"""Análise analítica dos retornos do ML Service.

Interpreta o campo `source` (origem da classificação), a probabilidade, a
categoria retornada e a correlação com o consumo informado, produzindo:

- distribuição de fontes (model, model+groq, rule-based, etc.);
- estatísticas de probabilidade por fonte;
- distribuição de categorias;
- alertas de inconsistência (fallback inesperado, confiança baixa sem Groq,
  categoria incoerente com consumo extremo, recomendações vazias).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from statistics import fmean
from typing import Any

from .checks import CATEGORY_ORDINAL
from .checks.consistency import check_monotonicity

# Razões (consumo informado / esperado do conjunto) consideradas coerentes.
# Fora da faixa, o consumo é internamente incoerente com o inventário.
COHERENT_RATIO_MIN = 0.4
COHERENT_RATIO_MAX = 2.5
# Dentro da faixa coerente, categorias extremas ainda podem ser suspeitas
# quando o consumo relativo é baixo/alto demais para elas.
LOW_RATIO = 0.6  # consumo relativo <= isso: RUIM/CRITICO é suspeito
HIGH_RATIO = 1.5  # consumo relativo >= isso: EXCELENTE/BOM é suspeito
SUSPICIOUS_BAD = {"RUIM", "CRITICO"}
SUSPICIOUS_GOOD = {"EXCELENTE", "BOM"}


@dataclass(frozen=True)
class Alert:
    """Alerta de inconsistência detectado na rodada."""

    severity: str  # "critical" | "warning" | "info"
    title: str
    message: str
    scenario: str | None = None

    def json(self) -> dict[str, Any]:
        return {
            "severity": self.severity,
            "title": self.title,
            "message": self.message,
            "scenario": self.scenario,
        }


def parse_source(source: str | None) -> dict[str, Any]:
    """Interpreta o campo `source` do ML Service.

    Formatos observados (ml-service v2.1):
    - "model"
    - "model (confidence 67.4%)"
    - "model+groq (confidence 81.2%)"
    - "model+rule-based (groq failed) (confidence 63.1%)"
    - "rule-based (model error)"
    - "rule-based (model unavailable)"
    """
    if not source:
        return {"kind": "unknown", "confidence": None}

    confidence = None
    match = re.search(r"confidence ([0-9.]+)%", source)
    if match:
        confidence = round(float(match.group(1)) / 100.0, 4)

    if "groq failed" in source:
        kind = "model-groq-failed"
    elif "model+groq" in source:
        kind = "model-groq"
    elif "rule-based" in source:
        if "error" in source:
            kind = "rule-based-error"
        elif "unavailable" in source:
            kind = "rule-based-unavailable"
        else:
            kind = "rule-based"
    elif "model" in source:
        if confidence is not None and confidence < 0.80:
            kind = "model-low-confidence"
        else:
            kind = "model"
    else:
        kind = "unknown"

    return {"kind": kind, "confidence": confidence}


def _group_by(outcomes: list[Any], key: str) -> dict[str, list[Any]]:
    grouped: dict[str, list[Any]] = {}
    for outcome in outcomes:
        if outcome.status_code != 200 or not isinstance(outcome.body, dict):
            continue
        value = outcome.body.get(key)
        grouped.setdefault(str(value), []).append(outcome)
    return grouped


def source_distribution(outcomes: list[Any]) -> dict[str, dict[str, Any]]:
    """Distribuição das fontes de classificação com estatísticas."""
    buckets: dict[str, list[Any]] = {}
    for outcome in outcomes:
        if outcome.status_code != 200 or not isinstance(outcome.body, dict):
            continue
        parsed = parse_source(outcome.body.get("source"))
        buckets.setdefault(parsed["kind"], []).append(outcome)

    distribution: dict[str, dict[str, Any]] = {}
    total = sum(len(v) for v in buckets.values())
    for kind, items in sorted(buckets.items(), key=lambda kv: -len(kv[1])):
        probabilities = [
            o.body.get("probability")
            for o in items
            if isinstance(o.body.get("probability"), (int, float))
        ]
        latencies = [o.latency_ms for o in items if o.latency_ms is not None]
        distribution[kind] = {
            "count": len(items),
            "percent": round(len(items) / total * 100, 2) if total else 0.0,
            "avg_probability": round(fmean(probabilities), 4) if probabilities else None,
            "min_probability": round(min(probabilities), 4) if probabilities else None,
            "max_probability": round(max(probabilities), 4) if probabilities else None,
            "avg_latency_ms": round(fmean(latencies), 2) if latencies else None,
        }
    return distribution


def category_distribution(outcomes: list[Any]) -> dict[str, dict[str, Any]]:
    """Distribuição das categorias retornadas com probabilidade média."""
    grouped = _group_by(outcomes, "category")
    total = sum(len(v) for v in grouped.values())
    distribution: dict[str, dict[str, Any]] = {}
    for category, items in sorted(grouped.items()):
        probabilities = [
            o.body.get("probability")
            for o in items
            if isinstance(o.body.get("probability"), (int, float))
        ]
        distribution[category] = {
            "count": len(items),
            "percent": round(len(items) / total * 100, 2) if total else 0.0,
            "avg_probability": round(fmean(probabilities), 4) if probabilities else None,
        }
    return distribution


def probability_by_category(outcomes: list[Any]) -> dict[str, float | None]:
    """Probabilidade média por categoria retornada."""
    return {cat: stats["avg_probability"] for cat, stats in category_distribution(outcomes).items()}


def detect_consumption_consistency(outcomes: list[Any]) -> list[Alert]:
    """Detecta categorias incoerentes com o consumo relativo ao conjunto.

    Compara o `consumption_kwh` informado com o consumo esperado do conjunto
    de aparelhos (derivado dos watts da distribuição). Para consumo relativo
    dentro da faixa coerente, categorias extremas ainda podem ser suspeitas:
    consumo relativamente baixo classificado como RUIM/CRITICO, ou consumo
    relativamente alto classificado como EXCELENTE/BOM. Cenários de borda
    (tag 'edge') também são avaliados aqui.
    """
    alerts: list[Alert] = []
    for outcome in outcomes:
        if outcome.status_code != 200 or not isinstance(outcome.body, dict):
            continue
        consumption = outcome.scenario.payload.get("consumption_kwh")
        if not isinstance(consumption, (int, float)) or consumption <= 0:
            continue
        expected = _expected_kwh(outcome)
        if expected <= 0:
            continue
        ratio = consumption / expected
        category = outcome.body.get("category")
        if category not in CATEGORY_ORDINAL:
            continue
        if ratio <= LOW_RATIO and category in SUSPICIOUS_BAD:
            alerts.append(
                Alert(
                    severity="warning",
                    title="categoria suspeita para consumo baixo",
                    message=(
                        f"Consumo {consumption:g} kWh ({ratio:.2f}x do esperado "
                        f"do conjunto) retornou {category} (prob "
                        f"{outcome.body.get('probability')}) - inesperado para "
                        f"um perfil de baixo consumo relativo"
                    ),
                    scenario=outcome.scenario.name,
                )
            )
        if ratio >= HIGH_RATIO and category in SUSPICIOUS_GOOD:
            alerts.append(
                Alert(
                    severity="warning",
                    title="categoria suspeita para consumo alto",
                    message=(
                        f"Consumo {consumption:g} kWh ({ratio:.2f}x do esperado "
                        f"do conjunto) retornou {category} (prob "
                        f"{outcome.body.get('probability')}) - inesperado para "
                        f"um perfil de alto consumo relativo"
                    ),
                    scenario=outcome.scenario.name,
                )
            )
    return alerts


def detect_low_confidence_without_groq(outcomes: list[Any]) -> list[Alert]:
    """Detecta predições do modelo com confiança < 80% sem fallback Groq.

    Pela lógica do ML Service, quando a confiança do modelo fica abaixo de
    80% o Groq deveria ser acionado. Se o `source` for apenas "model
    (confidence X%)" com X < 80, o fallback não ocorreu. Isso costuma
    indicar limite de taxa do Groq atingido (25 RPM) durante a rodada; as
    recomendações foram geradas por regras sem aviso no `source`.
    """
    alerts: list[Alert] = []
    for outcome in outcomes:
        if outcome.status_code != 200 or not isinstance(outcome.body, dict):
            continue
        parsed = parse_source(outcome.body.get("source"))
        confidence = parsed["confidence"]
        if parsed["kind"] == "model-low-confidence":
            alerts.append(
                Alert(
                    severity="info",
                    title="confiança baixa sem fallback Groq",
                    message=(
                        f"Modelo retornou confiança {confidence:.1%} (< 80%) "
                        f"sem acionar o Groq (possivelmente limite de taxa "
                        f"atingido); recomendações geradas por regras"
                    ),
                    scenario=outcome.scenario.name,
                )
            )
    return alerts


def recommendation_stats_by_source(outcomes: list[Any]) -> dict[str, dict[str, Any]]:
    """Estatísticas das recomendações geradas por cada fonte.

    Conta quantas recomendações cada resposta 200 trouxe, agrupadas por
    tipo de fonte, permitindo comparar a qualidade (quantidade) das
    recomendações vindas do modelo sozinho, do Groq e das regras.
    """
    buckets: dict[str, list[int]] = {}
    for outcome in outcomes:
        if outcome.status_code != 200 or not isinstance(outcome.body, dict):
            continue
        parsed = parse_source(outcome.body.get("source"))
        recs = outcome.body.get("recommendations")
        if not isinstance(recs, list):
            continue
        buckets.setdefault(parsed["kind"], []).append(len(recs))

    stats: dict[str, dict[str, Any]] = {}
    for kind, sizes in sorted(buckets.items(), key=lambda kv: -len(kv[1])):
        stats[kind] = {
            "responses": len(sizes),
            "avg_recommendations": round(fmean(sizes), 2) if sizes else None,
            "min_recommendations": min(sizes) if sizes else None,
            "max_recommendations": max(sizes) if sizes else None,
        }
    return stats


def detect_set_consumption_mismatch(outcomes: list[Any]) -> list[Alert]:
    """Detecta consumo informado incoerente com o conjunto de aparelhos.

    Cada cenário parte de um conjunto realista de aparelhos (como o frontend
    envia em produção). O consumo mensal esperado do conjunto é derivado de
    watts x horas x quantidade. Se o `consumption_kwh` informado divergir
    muito do esperado, os dados são internamente incoerentes e a análise
    perde confiabilidade. É exatamente o tipo de problema que este módulo
    deve expor.
    """
    alerts: list[Alert] = []
    for outcome in outcomes:
        if outcome.status_code != 200 or not isinstance(outcome.body, dict):
            continue
        consumption = outcome.scenario.payload.get("consumption_kwh")
        if not isinstance(consumption, (int, float)) or consumption <= 0:
            continue
        expected = _expected_kwh(outcome)
        if expected <= 0:
            continue
        ratio = consumption / expected
        if ratio > 3.0 or ratio < 0.2:
            direction = "acima" if ratio > 3.0 else "abaixo"
            alerts.append(
                Alert(
                    severity="warning",
                    title="consumo incoerente com o conjunto de aparelhos",
                    message=(
                        f"Consumo informado {consumption:g} kWh está {direction} "
                        f"do esperado para o inventário ({expected:.0f} kWh, "
                        f"razão {ratio:.2f}x). Os dados são internamente "
                        f"incoerentes e a análise pode não refletir a realidade"
                    ),
                    scenario=outcome.scenario.name,
                )
            )
    return alerts


def _expected_kwh(outcome: Any) -> float:
    """Consumo mensal esperado do conjunto, com precisão quando disponível.

    Usa o `expected_monthly_kwh` calculado pelo gerador (watts x horas x
    quantidade x 30 / 1000, com as horas reais de cada aparelho do catálogo).
    Para cenários sem o valor (ex.: mocks), reconstrói uma estimativa a
    partir dos watts da distribuição com horas médias por categoria.
    """
    expected = outcome.scenario.expected_monthly_kwh
    if isinstance(expected, (int, float)) and expected > 0:
        return float(expected)
    distribution = outcome.scenario.payload.get("daily_consumption_distribution")
    if not isinstance(distribution, dict):
        return 0.0
    hours_by_key = {
        "REFRIGERATION_WATTS": 24.0,
        "HEATING_WATTS": 1.0,
        "AIR_CONDITIONING_WATTS": 8.0,
        "LIGHTING_WATTS": 6.0,
    }
    total = 0.0
    for key, hours in hours_by_key.items():
        watts = distribution.get(key, 0.0)
        if isinstance(watts, (int, float)):
            total += watts * hours * 30 / 1000
    return total


def detect_empty_recommendations(outcomes: list[Any]) -> list[Alert]:
    """Detecta respostas 200 sem recomendações (contrato espera lista não vazia)."""
    alerts: list[Alert] = []
    for outcome in outcomes:
        if outcome.status_code != 200 or not isinstance(outcome.body, dict):
            continue
        recs = outcome.body.get("recommendations")
        if not isinstance(recs, list) or len(recs) == 0:
            alerts.append(
                Alert(
                    severity="critical",
                    title="recomendações vazias",
                    message="Resposta 200 sem recomendações, contrato violado",
                    scenario=outcome.scenario.name,
                )
            )
    return alerts


def detect_all(outcomes: list[Any]) -> list[Alert]:
    """Agrega todos os alertas de inconsistência da rodada."""
    alerts: list[Alert] = []
    alerts.extend(detect_consumption_consistency(outcomes))
    alerts.extend(detect_low_confidence_without_groq(outcomes))
    alerts.extend(detect_set_consumption_mismatch(outcomes))
    alerts.extend(detect_empty_recommendations(outcomes))

    # Fallbacks inesperados (modelo deveria estar carregado e funcionando).
    for outcome in outcomes:
        if outcome.status_code != 200 or not isinstance(outcome.body, dict):
            continue
        parsed = parse_source(outcome.body.get("source"))
        if parsed["kind"] == "rule-based-error":
            alerts.append(
                Alert(
                    severity="critical",
                    title="erro do modelo durante predição",
                    message="Modelo falhou e a classificação caiu para rule-based",
                    scenario=outcome.scenario.name,
                )
            )
        elif parsed["kind"] == "model-groq-failed":
            alerts.append(
                Alert(
                    severity="warning",
                    title="Groq falhou",
                    message=(
                        "Chamada ao Groq falhou e as recomendações caíram para "
                        "regras (source contém 'groq failed')"
                    ),
                    scenario=outcome.scenario.name,
                )
            )
        elif parsed["kind"] == "rule-based-unavailable":
            alerts.append(
                Alert(
                    severity="critical",
                    title="modelo indisponível (fallback para regras)",
                    message=(
                        "Modelo treinado não carregado ou não encontrado; toda "
                        "a classificação está sendo feita por regras"
                    ),
                    scenario=outcome.scenario.name,
                )
            )
    return alerts


def analyze(outcomes: list[Any], monotonicity_failures: list[str] | None = None) -> dict[str, Any]:
    """Executa a análise completa da rodada e retorna um dicionário.

    `monotonicity_failures` pode ser passado pré-calculado (evita executar
    `check_monotonicity` duas vezes na mesma rodada).
    """
    if monotonicity_failures is None:
        monotonicity_failures = check_monotonicity(outcomes)
    return {
        "sources": source_distribution(outcomes),
        "categories": category_distribution(outcomes),
        "avg_probability_by_category": probability_by_category(outcomes),
        "recommendations_by_source": recommendation_stats_by_source(outcomes),
        "alerts": [a.json() for a in detect_all(outcomes)],
        "monotonicity_failures": monotonicity_failures,
    }
