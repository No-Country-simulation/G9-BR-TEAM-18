"""Cenários de valores-limite (boundary) e de monotonicidade.

Cada cenário parte de um **conjunto realista de aparelhos** (como o frontend
envia em produção) e varia um único campo por vez, mantendo os demais fixos.
Os valores de consumo são ancorados no consumo mensal esperado do conjunto
(derivado de watts x horas x quantidade), de modo que os cenários sejam
coerentes com o inventário analisado.
"""

from __future__ import annotations

from .appliance_sets import (
    APARTAMENTO_MEDIO,
    CASA_MEDIA,
    COMERCIO_LOJA,
    aggregate_set,
    build_payload,
)
from .catalog import MlContract, fallback_contract
from .model import Scenario

# Conjuntos de base: um por tipo de imóvel (realistas e conhecidos do ML).
BASE_SETS = (CASA_MEDIA, APARTAMENTO_MEDIO, COMERCIO_LOJA)

# Multiplicadores de consumo em torno do esperado do conjunto (faixa realista).
CONSUMPTION_FACTORS = [0.25, 0.5, 1.0, 1.5, 2.0, 4.0]
# Horas de alto consumo: faixa validada no backend (0.00 a 99.99).
HOURS_VALUES = [0.0, 4.0, 8.0, 12.0, 24.0]
PEAK_VALUES = [True, False]


def _named(
    appliance_set_name: str,
    group: str,
    name: str,
    payload: dict,
    expected_monthly_kwh: float,
    monotonic_group: str | None = None,
    monotonic_key: str | None = None,
) -> Scenario:
    return Scenario(
        name=name,
        group=group,
        payload=payload,
        monotonic_group=monotonic_group,
        monotonic_key=monotonic_key,
        tags=frozenset({"monotonic"} if monotonic_group else set()),
        appliance_set=appliance_set_name,
        expected_monthly_kwh=expected_monthly_kwh,
    )


def generate_boundary(contract: MlContract | None = None) -> list[Scenario]:
    """Gera cenários de valores-limite para cada campo, por conjunto de base."""
    contract = contract or fallback_contract()
    scenarios: list[Scenario] = []

    for appliance_set in BASE_SETS:
        aggregation = aggregate_set(appliance_set, contract)
        expected = aggregation["expected_monthly_kwh"] or 1.0
        base_name = appliance_set.name

        # Consumo variando em torno do esperado do conjunto.
        for factor in CONSUMPTION_FACTORS:
            consumption = round(expected * factor, 2)
            payload = build_payload(appliance_set, consumption, False, 5.0, contract)
            scenarios.append(
                _named(
                    base_name,
                    "boundary",
                    f"boundary/{base_name}/consumption={consumption:g}",
                    payload,
                    expected,
                )
            )

        # Horas de alto consumo variando isoladamente.
        for hours in HOURS_VALUES:
            payload = build_payload(appliance_set, expected, False, hours, contract)
            scenarios.append(
                _named(
                    base_name,
                    "boundary",
                    f"boundary/{base_name}/hours={hours:g}",
                    payload,
                    expected,
                )
            )

        # Uso em horário de pico (true/false).
        for peak in PEAK_VALUES:
            payload = build_payload(appliance_set, expected, peak, 5.0, contract)
            scenarios.append(
                _named(
                    base_name,
                    "boundary",
                    f"boundary/{base_name}/peak={str(peak).lower()}",
                    payload,
                    expected,
                )
            )

    # Cadeia de monotonicidade: mesmo conjunto, consumo crescente.
    for appliance_set in BASE_SETS:
        aggregation = aggregate_set(appliance_set, contract)
        expected = aggregation["expected_monthly_kwh"] or 1.0
        for factor in CONSUMPTION_FACTORS:
            consumption = round(expected * factor, 2)
            payload = build_payload(appliance_set, consumption, False, 5.0, contract)
            scenarios.append(
                _named(
                    appliance_set.name,
                    "boundary",
                    f"monotonic/{appliance_set.name}/consumption={consumption:g}",
                    payload,
                    expected,
                    monotonic_group="consumption",
                    monotonic_key=consumption,
                )
            )

    return scenarios
