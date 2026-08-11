"""Verificações executadas sobre as respostas do ML Service."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from ..scenarios import Scenario

VALID_CATEGORIES = ["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"]
VALID_SOURCES = ["model", "model+groq", "rule-based"]
# Ordinal de categoria: quanto maior, pior a eficiência.
CATEGORY_ORDINAL = {name: i for i, name in enumerate(VALID_CATEGORIES)}


@dataclass(frozen=True)
class CheckResult:
    """Resultado de uma verificação individual sobre um cenário."""

    name: str
    passed: bool
    message: str = ""


@dataclass
class ScenarioOutcome:
    """Resultado completo de um cenário executado."""

    scenario: Scenario
    status_code: int | None
    latency_ms: float | None
    body: dict[str, Any] | None
    checks: list[CheckResult] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return all(c.passed for c in self.checks)

    def json(self) -> dict[str, Any]:
        return {
            "scenario": self.scenario.json(),
            "status_code": self.status_code,
            "latency_ms": self.latency_ms,
            "body": self.body,
            "checks": [
                {"name": c.name, "passed": c.passed, "message": c.message} for c in self.checks
            ],
            "passed": self.passed,
        }


CheckFn = Callable[[Scenario, int | None, dict[str, Any] | None], list[CheckResult]]


def run_all_checks(
    scenario: Scenario,
    status_code: int | None,
    body: dict[str, Any] | None,
    *check_fns: CheckFn,
) -> list[CheckResult]:
    """Executa todas as funções de check e agrega os resultados."""
    results: list[CheckResult] = []
    for fn in check_fns:
        results.extend(fn(scenario, status_code, body))
    return results
