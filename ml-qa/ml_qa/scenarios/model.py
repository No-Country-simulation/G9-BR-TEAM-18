"""Definição do dataclass `Scenario` (em módulo próprio para evitar ciclo)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Scenario:
    """Um único caso de teste: payload, expectativa de status e metadados."""

    name: str
    group: str
    payload: dict[str, Any]
    expect_status: int = 200
    # Quando definido, o cenário participa de verificações de consistência
    # entre cenários do mesmo grupo (ex.: monotonicidade do consumo).
    monotonic_group: str | None = None
    monotonic_key: str | None = None  # chave numérica usada na ordenação
    tags: frozenset[str] = field(default_factory=frozenset)
    # Nome do conjunto de aparelhos realista usado (ver scenarios/appliance_sets.py).
    appliance_set: str | None = None
    # Consumo mensal esperado do conjunto (watts x horas x qty x 30 / 1000),
    # calculado com precisão no gerador e usado pela análise de coerência.
    expected_monthly_kwh: float | None = None
    # Detalhamento por equipamento (como o frontend exibe no histórico):
    # tupla de dicts {name, quantity, watts, hours, monthly_kwh}, ordenada por
    # consumo mensal decrescente. Populado por generate_scenarios a partir do
    # conjunto e do contrato; usado nos relatórios por análise.
    appliance_details: tuple[dict[str, Any], ...] = ()

    def json(self) -> dict[str, Any]:
        """Representação serializável (para relatórios)."""
        return {
            "name": self.name,
            "group": self.group,
            "payload": self.payload,
            "expect_status": self.expect_status,
            "monotonic_group": self.monotonic_group,
            "monotonic_key": self.monotonic_key,
            "tags": sorted(self.tags),
            "appliance_set": self.appliance_set,
            "expected_monthly_kwh": self.expected_monthly_kwh,
            "appliance_details": list(self.appliance_details),
        }
