"""Geração de cenários de teste para o ML Service.

Cada gerador produz uma lista de `Scenario`. Os cenários são divididos em
grupos (boundary, combinatorial, anomalies) para permitir execução seletiva.
Todos os cenários partem de **conjuntos realistas de aparelhos** (o que o
frontend envia em produção) e montam o payload exatamente como o backend.
"""

from __future__ import annotations

from dataclasses import replace

from .anomalies import generate_anomalies
from .appliance_sets import (
    ALL_SETS,
    ApplianceSet,
    aggregate_set,
    appliance_details,
    build_payload,
    set_by_name,
)
from .boundary import generate_boundary
from .catalog import MlContract, fallback_contract
from .combinatorial import generate_combinatorial
from .model import Scenario

__all__ = [
    "ALL_GROUPS",
    "ALL_SETS",
    "ApplianceSet",
    "Scenario",
    "aggregate_set",
    "build_payload",
    "generate_scenarios",
    "resolve_groups",
]

ALL_GROUPS = ("boundary", "combinatorial", "anomalies")


def generate_scenarios(
    groups: tuple[str, ...] = ALL_GROUPS,
    contract: MlContract | None = None,
) -> list[Scenario]:
    """Gera todos os cenários dos grupos solicitados, na ordem canônica.

    `contract` (opcional) fornece os valores reais do ML Service
    (`/contract` e `/appliance-catalog`); se ausente, usa o fallback do
    contrato 3.0.0. Todos os cenários refletem apenas entradas possíveis no
    fluxo atual do projeto (backend -> ML).
    """
    generators = {
        "boundary": generate_boundary,
        "combinatorial": generate_combinatorial,
        "anomalies": generate_anomalies,
    }
    contract = contract or fallback_contract()
    scenarios: list[Scenario] = []
    for group in groups:
        if group not in generators:
            raise ValueError(f"Grupo de cenários desconhecido: {group}")
        scenarios.extend(generators[group](contract=contract))
    return [_with_details(s, contract) for s in scenarios]


def _with_details(scenario: Scenario, contract: MlContract) -> Scenario:
    """Preenche o detalhamento por equipamento a partir do conjunto usado.

    Cenários que não partem de um conjunto (ex.: verificação de
    monotonicidade) mantêm `appliance_details` vazio.
    """
    if not scenario.appliance_set:
        return scenario
    try:
        appliance_set = set_by_name(scenario.appliance_set)
    except KeyError:
        return scenario
    details = appliance_details(appliance_set, contract)
    return replace(scenario, appliance_details=details)


def resolve_groups(value: str | None) -> tuple[str, ...]:
    """Converte o argumento CLI '--scenarios' em uma tupla de grupos válidos."""
    if not value or value.strip() == "all":
        return ALL_GROUPS
    groups = tuple(g.strip() for g in value.split(",") if g.strip())
    for g in groups:
        if g not in ALL_GROUPS:
            raise ValueError(f"Grupo de cenários desconhecido: {g}")
    return groups
