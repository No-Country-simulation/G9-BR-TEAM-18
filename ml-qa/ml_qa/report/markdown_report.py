"""Relatório Markdown: análise completa com fontes, categorias, alertas e o
detalhamento de cada cenário (entrada, retorno, latência e verificações).

Além do relatório consolidado (resumo + tabelas agregadas), o módulo gera um
arquivo Markdown por análise (`reports/analyses/`), com o detalhamento por
equipamento como o frontend exibe no histórico, o payload enviado, a resposta
do ML e as verificações executadas.
"""

from __future__ import annotations

import json
from statistics import fmean, median

from ..analysis import parse_source
from ..checks import ScenarioOutcome
from ..runner import SuiteResult
from ..scenarios import Scenario

SOURCE_KIND_LABELS = {
    "model": "Modelo (confiança ≥ 80%)",
    "model-low-confidence": "Modelo (confiança < 80%, sem Groq)",
    "model-groq": "Modelo + Groq (confiança < 80%)",
    "model-groq-failed": "Modelo + Groq (falhou → regras)",
    "rule-based-error": "Regras (erro do modelo)",
    "rule-based-unavailable": "Regras (modelo indisponível)",
    "rule-based": "Regras",
    "unknown": "Desconhecido",
}


def _latency_stats(result: SuiteResult) -> dict[str, float]:
    latencies = [o.latency_ms for o in result.outcomes if o.latency_ms is not None]
    if not latencies:
        return {"n": 0, "avg": 0.0, "median": 0.0, "p95": 0.0, "p99": 0.0}
    ordered = sorted(latencies)
    p95 = ordered[int(len(ordered) * 0.95) - 1] if len(ordered) >= 20 else ordered[-1]
    p99 = ordered[int(len(ordered) * 0.99) - 1] if len(ordered) >= 100 else ordered[-1]
    return {
        "n": len(latencies),
        "avg": round(fmean(latencies), 2),
        "median": round(median(latencies), 2),
        "p95": round(p95, 2),
        "p99": round(p99, 2),
    }


def _status_code_distribution(result: SuiteResult) -> dict[int, int]:
    distribution: dict[int, int] = {}
    for o in result.outcomes:
        if o.status_code is not None:
            distribution[o.status_code] = distribution.get(o.status_code, 0) + 1
    return dict(sorted(distribution.items()))


def _source_table(analysis: dict) -> list[str]:
    header = "| Fonte | Cenários | % | Prob. média | Latência média (ms) |"
    lines = [header, "|---|---|---|---|---|"]
    sources = analysis["sources"]
    if not sources:
        return ["_Nenhuma resposta 200 para análise._"]
    for kind, stats in sources.items():
        prob = f"{stats['avg_probability']:.2%}" if stats["avg_probability"] is not None else "-"
        lat = f"{stats['avg_latency_ms']}" if stats["avg_latency_ms"] is not None else "-"
        label = SOURCE_KIND_LABELS.get(kind, kind)
        lines.append(f"| {label} | {stats['count']} | {stats['percent']}% | {prob} | {lat} |")
    return lines


def _category_table(analysis: dict) -> list[str]:
    lines = ["| Categoria | Cenários | % | Prob. média |", "|---|---|---|---|"]
    categories = analysis["categories"]
    if not categories:
        return ["_Nenhuma categoria retornada._"]
    for category, stats in categories.items():
        prob = f"{stats['avg_probability']:.2%}" if stats["avg_probability"] is not None else "-"
        lines.append(f"| {category} | {stats['count']} | {stats['percent']}% | {prob} |")
    return lines


def _recommendations_by_source_table(analysis: dict) -> list[str]:
    lines = [
        "| Fonte | Respostas | Média de recomendações | Mín. | Máx. |",
        "|---|---|---|---|---|",
    ]
    stats = analysis.get("recommendations_by_source", {})
    if not stats:
        return ["_Sem dados de recomendações._"]
    for kind, s in stats.items():
        label = SOURCE_KIND_LABELS.get(kind, kind)
        avg = f"{s['avg_recommendations']}" if s["avg_recommendations"] is not None else "-"
        mn = s["min_recommendations"] if s["min_recommendations"] is not None else "-"
        mx = s["max_recommendations"] if s["max_recommendations"] is not None else "-"
        lines.append(f"| {label} | {s['responses']} | {avg} | {mn} | {mx} |")
    return lines


def _alerts_section(analysis: dict) -> list[str]:
    alerts = analysis["alerts"]
    if not alerts:
        return ["Nenhuma inconsistência detectada nos retornos."]
    lines = ["| Severidade | Cenário | Alerta | Detalhe |", "|---|---|---|---|"]
    icons = {"critical": "🔴", "warning": "🟡", "info": "🔵"}
    for alert in alerts:
        scenario = f"`{alert['scenario']}`" if alert["scenario"] else "-"
        icon = icons.get(alert["severity"], "⚪")
        title = alert["title"].replace("|", "/")
        message = alert["message"].replace("|", "/")
        lines.append(f"| {icon} {alert['severity']} | {scenario} | {title} | {message} |")
    return lines


def _equipment_table(scenario: Scenario) -> list[str]:
    """Tabela 'Detalhamento por Equipamento' como o histórico do frontend.

    Colunas: Equipamento, Qtd, Potência (W), Uso/dia (h), kWh/mês; total de
    kWh/mês na última linha. Ordenação por consumo mensal decrescente.
    """
    if not scenario.appliance_details:
        return ["_Nenhum equipamento no conjunto (imóvel sem aparelhos registrados)._"]
    lines = [
        "| Equipamento | Qtd | Potência (W) | Uso/dia (h) | kWh/mês |",
        "|---|---|---|---|---|",
    ]
    total = sum(row["monthly_kwh"] for row in scenario.appliance_details)
    for row in scenario.appliance_details:
        watts = f"{row['watts']:.0f}"
        hours = f"{row['hours']:.1f}"
        monthly = f"{row['monthly_kwh']:.1f}"
        lines.append(f"| {row['name']} | {row['quantity']} | {watts} | {hours} | {monthly} |")
    lines.append(f"| **Total** | | | | **{total:.1f}** |")
    return lines


def _analysis_filename(name: str) -> str:
    """Converte o nome do cenário em um nome de arquivo seguro."""
    return name.replace("/", "-").replace("=", "-") + ".md"


def render_analysis_markdown(outcome: ScenarioOutcome) -> str:
    """Renderiza um arquivo Markdown completo para uma única análise.

    Estrutura espelhada no histórico do frontend: detalhamento por
    equipamento (com kWh/mês e total), payload enviado, resposta do ML
    (categoria, probabilidade, fonte e recomendações) e verificações.
    """
    scenario = outcome.scenario
    lines: list[str] = []
    lines.append(f"# Análise: `{scenario.name}`")
    lines.append("")
    lines.append(f"- **Grupo:** {scenario.group}")
    lines.append(f"- **Conjunto:** {scenario.appliance_set or '-'}")
    lines.append(f"- **Resultado:** {'✅ aprovado' if outcome.passed else '❌ falhou'}")
    status = outcome.status_code if outcome.status_code is not None else "erro de conexão"
    lines.append(f"- **HTTP:** {status}")
    latency = f"{outcome.latency_ms:.0f} ms" if outcome.latency_ms is not None else "-"
    lines.append(f"- **Latência:** {latency}")
    if "threshold" in scenario.tags:
        lines.append(
            "- **Observação:** distribuição de watts ajustada para testar o "
            "limiar de recomendação; a tabela abaixo reflete o inventário do "
            "conjunto, não a distribuição alterada."
        )
    lines.append("")

    lines.append("## Detalhamento por Equipamento")
    lines.append("")
    lines.extend(_equipment_table(scenario))
    lines.append("")

    lines.append("## Payload enviado")
    lines.append("")
    lines.append("```json")
    lines.append(json.dumps(scenario.payload, ensure_ascii=False, indent=2))
    lines.append("```")
    lines.append("")

    if outcome.status_code == 200 and isinstance(outcome.body, dict):
        body = outcome.body
        source_kind = parse_source(body.get("source"))["kind"]
        source_label = SOURCE_KIND_LABELS.get(source_kind, str(body.get("source", "-")))
        lines.append("## Resposta do ML")
        lines.append("")
        lines.append("| Campo | Valor |")
        lines.append("|---|---|")
        lines.append(f"| Categoria | {body.get('category', '-')} |")
        lines.append(f"| Probabilidade | {body.get('probability', '-')} |")
        lines.append(f"| Fonte | {source_label} |")
        lines.append("")
        recommendations = body.get("recommendations", [])
        lines.append("### Recomendações")
        lines.append("")
        if isinstance(recommendations, list) and recommendations:
            for rec in recommendations:
                lines.append(f"- {rec}")
        else:
            lines.append("_Sem recomendações retornadas._")
    else:
        lines.append("## Resposta do ML")
        lines.append("")
        lines.append(f"_Sem resposta válida (status {status})._")
    lines.append("")

    lines.append("## Verificações")
    lines.append("")
    if not outcome.checks:
        lines.append("_Nenhuma verificação executada._")
    else:
        for check in outcome.checks:
            icon = "✅" if check.passed else "❌"
            detail = f": {check.message}" if check.message else ""
            lines.append(f"- {icon} {check.name}{detail}")
    lines.append("")

    lines.append("---")
    lines.append("_Gerado automaticamente pelo módulo `ml-qa`._")
    return "\n".join(lines) + "\n"


def save_analysis_files(result: SuiteResult, directory: str) -> list[str]:
    """Grava um arquivo Markdown por análise; retorna os caminhos gerados."""
    from pathlib import Path

    target = Path(directory)
    target.mkdir(parents=True, exist_ok=True)
    paths: list[str] = []
    for outcome in result.outcomes:
        # O cenário sintético de monotonicidade não é uma análise real.
        if outcome.scenario.group == "consistency":
            continue
        path = target / _analysis_filename(outcome.scenario.name)
        path.write_text(render_analysis_markdown(outcome), encoding="utf-8")
        paths.append(str(path))
    return paths


def _scenarios_detail_table(result: SuiteResult) -> list[str]:
    lines = [
        (
            "| Cenário | Conjunto | Grupo | HTTP | Categoria | Prob. | "
            "Fonte | Latência (ms) | Resultado |"
        ),
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for outcome in result.outcomes:
        name = f"`{outcome.scenario.name}`"
        appliance_set = outcome.scenario.appliance_set or "-"
        status = outcome.status_code if outcome.status_code is not None else "erro"
        if outcome.status_code == 200 and isinstance(outcome.body, dict):
            body = outcome.body
            category = body.get("category", "-")
            prob = body.get("probability")
            prob_text = f"{prob}" if prob is not None else "-"
            source_kind = parse_source(body.get("source"))["kind"]
            source_label = SOURCE_KIND_LABELS.get(source_kind, str(body.get("source", "-")))
            if source_kind == "model-groq":
                source = f"{source_label} (`{body.get('source', '')}`)"
            else:
                source = source_label
        else:
            category = "-"
            prob_text = "-"
            source = "-"
        latency = f"{outcome.latency_ms:.0f}" if outcome.latency_ms is not None else "-"
        result_label = "✅" if outcome.passed else "❌"
        lines.append(
            f"| {name} | {appliance_set} | {outcome.scenario.group} | {status} | "
            f"{category} | {prob_text} | {source} | {latency} | {result_label} |"
        )
    return lines


def render_markdown(result: SuiteResult) -> str:
    """Renderiza um relatório Markdown analítico completo."""
    lat = _latency_stats(result)
    status_dist = _status_code_distribution(result)
    analysis = result.analysis

    lines: list[str] = []
    lines.append("# Relatório de Testes Exaustivos - ML Service")
    lines.append("")
    lines.append(f"- **Base URL:** `{result.base_url}`")
    lines.append(f"- **Início:** `{result.started_at}`")
    lines.append(f"- **Duração:** {result.duration_ms / 1000:.2f}s")
    lines.append("")

    lines.append("## Resumo")
    lines.append("")
    lines.append("| Métrica | Valor |")
    lines.append("|---|---|")
    lines.append(f"| Cenários executados | {result.total} |")
    lines.append(f"| Aprovados | {result.passed} |")
    lines.append(f"| Falhas | {result.failed} |")
    lines.append(f"| Taxa de sucesso | {result.success_rate}% |")
    lines.append("")

    lines.append("## Distribuição de Fontes (origem da classificação)")
    lines.append("")
    lines.append(
        "Mostra **como** o ML Service classificou cada cenário: somente pelo "
        "modelo treinado (`model`), com apoio do Groq (`model+groq`, quando a "
        "confiança do modelo fica abaixo de 80%), ou caindo para regras."
    )
    lines.append("")
    lines.extend(_source_table(analysis))
    lines.append("")

    lines.append("## Distribuição de Categorias")
    lines.append("")
    lines.extend(_category_table(analysis))
    lines.append("")

    lines.append("## Recomendações por Fonte")
    lines.append("")
    lines.append(
        "Quantidade média de recomendações devolvidas por cada origem da "
        "classificação: compara o volume gerado pelo modelo, pelo Groq e "
        "pelas regras."
    )
    lines.append("")
    lines.extend(_recommendations_by_source_table(analysis))
    lines.append("")

    lines.append("## Inconsistências e Alertas")
    lines.append("")
    lines.extend(_alerts_section(analysis))
    lines.append("")

    if analysis["monotonicity_failures"]:
        lines.append("## Falhas de Consistência (Monotonicidade)")
        lines.append("")
        lines.append(
            "Para um mesmo perfil, aumentar o consumo **não** deveria melhorar a categoria:"
        )
        lines.append("")
        for failure in analysis["monotonicity_failures"]:
            lines.append(f"- {failure}")
        lines.append("")

    lines.append("## Latência")
    lines.append("")
    lines.append("| Métrica | ms |")
    lines.append("|---|---|")
    lines.append(f"| Média | {lat['avg']} |")
    lines.append(f"| Mediana | {lat['median']} |")
    lines.append(f"| p95 | {lat['p95']} |")
    lines.append(f"| p99 | {lat['p99']} |")
    lines.append("")

    lines.append("## Distribuição de Status HTTP")
    lines.append("")
    lines.append("| Status | Quantidade |")
    lines.append("|---|---|")
    if status_dist:
        for status, count in status_dist.items():
            lines.append(f"| {status} | {count} |")
    else:
        lines.append("| - | 0 |")
    lines.append("")

    lines.append("## Cenários Falhos")
    lines.append("")
    failed = [o for o in result.outcomes if not o.passed]
    if not failed:
        lines.append("Nenhuma falha. Todos os cenários passaram.")
    else:
        lines.append("| Cenário | Status HTTP | Verificação | Mensagem |")
        lines.append("|---|---|---|---|")
        for outcome in failed:
            for check in outcome.checks:
                if check.passed:
                    continue
                status = outcome.status_code if outcome.status_code is not None else "erro"
                message = check.message.replace(chr(124), "/")
                lines.append(f"| `{outcome.scenario.name}` | {status} | {check.name} | {message} |")
    lines.append("")

    lines.append("## Análises Detalhadas")
    lines.append("")
    lines.append(
        "Cada cenário possui um arquivo próprio em `analyses/` com o "
        "detalhamento por equipamento (como o histórico do frontend), o "
        "payload enviado, a resposta do ML e as verificações:"
    )
    lines.append("")
    for outcome in result.outcomes:
        if outcome.scenario.group == "consistency":
            continue
        filename = _analysis_filename(outcome.scenario.name)
        icon = "✅" if outcome.passed else "❌"
        lines.append(f"- {icon} [`{outcome.scenario.name}`](analyses/{filename})")
    lines.append("")

    lines.append("## Detalhamento dos Cenários")
    lines.append("")
    lines.append("Cada cenário executado, com o retorno devolvido pelo ML Service.")
    lines.append(
        "A convenção de nomes e o significado de cada código estão em "
        "[`docs/scenarios.md`](../docs/scenarios.md)."
    )
    lines.append("")
    lines.append("Legenda das colunas:")
    lines.append("")
    lines.append(
        "- **Conjunto:** perfil realista de aparelhos usado no cenário (como o "
        "frontend envia em produção). O payload é derivado do conjunto: "
        "`equipment_quantity`, `daily_consumption_distribution`, "
        "`highest_consumption_category` e `highest_consumption_products`."
    )
    lines.append(
        "- **Fonte:** `Modelo` = classificação só pelo modelo treinado "
        "(confiança ≥ 80%); `Modelo + Groq` = modelo com confiança < 80% "
        "apoiado pelo LLM; `Regras` = fallback por regras."
    )
    lines.append(
        "- **Resultado:** ✅ todos os checks passaram · ❌ alguma verificação "
        "falhou (ver seção 'Cenários Falhos')."
    )
    lines.append("")
    lines.extend(_scenarios_detail_table(result))
    lines.append("")

    lines.append("---")
    lines.append("_Gerado automaticamente pelo módulo `ml-qa`._")
    return "\n".join(lines) + "\n"


def save_markdown(result: SuiteResult, path: str) -> None:
    """Grava o relatório Markdown em um arquivo."""
    with open(path, "w", encoding="utf-8") as f:
        f.write(render_markdown(result))
