"""Executa os cenários contra a API HTTP do ML Service e agrega resultados."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

import httpx

from .analysis import analyze
from .checks import CheckResult, ScenarioOutcome, run_all_checks
from .checks.consistency import check_monotonicity
from .checks.response_contract import (
    check_category_valid,
    check_http_status,
    check_ordinal_consistency,
    check_probability_range,
    check_recommendations,
    check_response_schema,
    check_source_valid,
)
from .scenarios import ALL_GROUPS, MlContract, Scenario, generate_scenarios
from .scenarios.catalog import fetch_contract

DEFAULT_BASE_URL = "http://localhost:8000"
PREDICT_PATH = "/predict"
TIMEOUT_SECONDS = 30.0
# Limite padrão de requisições por minuto ao ML Service.
#
# O plano gratuito do Groq permite 25 chamadas/minuto. Cada cenário com
# confiança < 80% aciona UMA chamada ao Groq, e o ML Service também é usado
# por outras fontes (ex.: o backend em produção). Para garantir que o Groq
# responda com qualidade em TODOS os cenários que precisam dele, o ml-qa se
# limita a 12 req/min com espaçamento uniforme (5s entre requisições): mesmo
# que todos os cenários de um minuto acionem o Groq, são no máximo 12
# chamadas, bem abaixo do limite de 25. Use `--max-rpm` para ajustar.
DEFAULT_MAX_RPM = 12


@dataclass
class SuiteResult:
    """Resultado agregado de uma rodada de testes."""

    base_url: str
    started_at: str
    duration_ms: float
    outcomes: list[ScenarioOutcome] = field(default_factory=list)
    consistency_failures: list[str] = field(default_factory=list)
    analysis: dict[str, Any] = field(default_factory=dict)

    @property
    def total(self) -> int:
        return len(self.outcomes)

    @property
    def passed(self) -> int:
        return sum(1 for o in self.outcomes if o.passed)

    @property
    def failed(self) -> int:
        return self.total - self.passed

    @property
    def success_rate(self) -> float:
        if self.total == 0:
            return 0.0
        return round(self.passed / self.total * 100, 2)

    def json(self) -> dict[str, Any]:
        return {
            "base_url": self.base_url,
            "started_at": self.started_at,
            "duration_ms": round(self.duration_ms, 2),
            "totals": {
                "total": self.total,
                "passed": self.passed,
                "failed": self.failed,
                "success_rate": self.success_rate,
            },
            "consistency_failures": self.consistency_failures,
            "analysis": self.analysis,
            "outcomes": [o.json() for o in self.outcomes],
        }


def _timed_post(
    client: httpx.Client, url: str, payload: dict[str, Any]
) -> tuple[int | None, dict[str, Any] | None, float | None]:
    """Executa POST medindo latência. Retorna (status, body, latency_ms)."""
    start = time.perf_counter()
    try:
        response = client.post(url, json=payload)
    except httpx.HTTPError:
        return None, None, None
    latency_ms = (time.perf_counter() - start) * 1000.0
    try:
        body: dict[str, Any] | None = response.json()
    except ValueError:
        body = None
    return response.status_code, body, latency_ms


class RateLimiter:
    """Espaça requisições uniformemente para respeitar limites por minuto.

    Diferente de um sliding-window simples (que permite rajadas no início da
    janela), este limitador garante um intervalo fixo entre requisições
    (`window_seconds / max_rpm`). Isso evita que muitos cenários acionem o
    Groq em sequência rápida e estourem o limite de 25 RPM do plano gratuito,
    o que degradaria a qualidade das análises (fallback silencioso para
    recomendações por regras).
    """

    def __init__(self, max_rpm: int | None, window_seconds: float = 60.0) -> None:
        self._interval = window_seconds / max_rpm if max_rpm and max_rpm > 0 else 0.0
        self._next_available = 0.0

    def wait(self) -> None:
        """Bloqueia até o instante reservado para a próxima requisição."""
        if self._interval <= 0.0:
            return
        now = time.monotonic()
        if now < self._next_available:
            time.sleep(self._next_available - now)
            now = time.monotonic()
        # Reserva o próximo slot: uma requisição a cada `interval` segundos.
        self._next_available = now + self._interval


def run_suite(
    base_url: str = DEFAULT_BASE_URL,
    groups: tuple[str, ...] = ALL_GROUPS,
    max_rpm: int | None = DEFAULT_MAX_RPM,
    contract: MlContract | None = None,
) -> SuiteResult:
    """Executa todos os cenários e retorna o resultado agregado.

    `max_rpm` limita as requisições por minuto ao ML Service com espaçamento
    uniforme. Como cada cenário com confiança < 80% aciona o Groq, o default
    conservador (12 req/min) garante que o limite gratuito de 25 RPM do Groq
    nunca seja estourado, preservando a qualidade real das análises. Use
    `max_rpm=None` para desativar o controle de taxa (não recomendado contra
    o Groq).

    `contract` (opcional) injeta os valores reais do ML Service
    (`/contract` e `/appliance-catalog`). Se omitido, o runner busca o
    contrato real em `base_url` (com fallback para o contrato 3.0.0) para
    que os cenários reflitam apenas entradas possíveis no fluxo atual.
    """
    from datetime import UTC, datetime

    if contract is None:
        contract = fetch_contract(base_url)
    scenarios = generate_scenarios(groups=groups, contract=contract)
    outcomes: list[ScenarioOutcome] = []

    rate_limiter = RateLimiter(max_rpm)
    start = time.perf_counter()
    with httpx.Client(base_url=base_url, timeout=TIMEOUT_SECONDS) as client:
        for scenario in scenarios:
            rate_limiter.wait()
            status_code, body, latency_ms = _timed_post(client, PREDICT_PATH, scenario.payload)
            checks = run_all_checks(
                scenario,
                status_code,
                body,
                check_http_status,
                check_response_schema,
                check_category_valid,
                check_probability_range,
                check_recommendations,
                check_source_valid,
                check_ordinal_consistency,
            )
            outcomes.append(
                ScenarioOutcome(
                    scenario=scenario,
                    status_code=status_code,
                    latency_ms=latency_ms,
                    body=body,
                    checks=checks,
                )
            )
    duration_ms = (time.perf_counter() - start) * 1000.0

    consistency_failures = check_monotonicity(outcomes)
    if consistency_failures:
        outcomes.append(
            ScenarioOutcome(
                scenario=Scenario(
                    name="consistency/monotonicity",
                    group="consistency",
                    payload={},
                    expect_status=200,
                ),
                status_code=None,
                latency_ms=None,
                body=None,
                checks=[
                    CheckResult(
                        "monotonicity",
                        False,
                        "; ".join(consistency_failures),
                    )
                ],
            )
        )

    return SuiteResult(
        base_url=base_url,
        started_at=datetime.now(UTC).isoformat(),
        duration_ms=duration_ms,
        outcomes=outcomes,
        consistency_failures=consistency_failures,
        analysis=analyze(outcomes, monotonicity_failures=consistency_failures),
    )
