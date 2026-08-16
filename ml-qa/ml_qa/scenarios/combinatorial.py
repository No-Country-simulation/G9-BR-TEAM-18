"""Cenários combinatórios: conjunto de aparelhos x variações de uso.

Cruza os **conjuntos realistas de aparelhos** (o que o frontend envia) com
variações de consumo relativo ao esperado do conjunto, uso em horário de
pico e os limiares de recomendação do ML. Tudo é montado pelo
`build_payload`, que replica o cálculo do backend e garante que a
distribuição de watts e os produtos enviados sejam coerentes com o
inventário analisado.
"""

from __future__ import annotations

from .appliance_sets import ALL_SETS, aggregate_set, build_payload
from .catalog import MlContract, fallback_contract
from .model import Scenario

# Níveis de consumo relativos ao consumo mensal esperado do conjunto.
# - baixo: consumo muito abaixo do que o inventário implicaria
# - esperado: consumo coerente com o inventário
# - alto: consumo acima do que o inventário implicaria
CONSUMPTION_LEVELS = [
    ("baixo", 0.3),
    ("esperado", 1.0),
    ("alto", 2.5),
]
PEAK_VALUES = [True, False]

# Limiares usados pelo ML para recomendações (extraídos de main.py).
RECOMMENDATION_THRESHOLDS = {
    "AIR_CONDITIONING_WATTS": 3000.0,
    "HEATING_WATTS": 5000.0,
    "LIGHTING_WATTS": 1000.0,
}

# Distribuição-base para os cenários de fronteira de recomendação.
BASE_DISTRIBUTION: dict[str, float] = {
    "REFRIGERATION_WATTS": 500.0,
    "HEATING_WATTS": 1000.0,
    "AIR_CONDITIONING_WATTS": 800.0,
    "LIGHTING_WATTS": 200.0,
}


def generate_combinatorial(contract: MlContract | None = None) -> list[Scenario]:
    """Gera a matriz: conjuntos x níveis de consumo x horário de pico."""
    contract = contract or fallback_contract()
    scenarios: list[Scenario] = []
    counter = 0

    for appliance_set in ALL_SETS:
        aggregation = aggregate_set(appliance_set, contract)
        expected = aggregation["expected_monthly_kwh"] or 1.0
        for level_name, factor in CONSUMPTION_LEVELS:
            consumption = round(expected * factor, 2)
            for peak in PEAK_VALUES:
                counter += 1
                payload = build_payload(appliance_set, consumption, peak, 5.0, contract)
                scenarios.append(
                    Scenario(
                        name=(
                            f"combinatorial/{counter:02d}-{appliance_set.name}-"
                            f"{level_name}-peak={str(peak).lower()}"
                        ),
                        group="combinatorial",
                        payload=payload,
                        tags=frozenset({"matrix"}),
                        appliance_set=appliance_set.name,
                        expected_monthly_kwh=aggregation["expected_monthly_kwh"],
                    )
                )

    # Cenários-alvo nos limiares exatos das recomendações (fronteira).
    # Usa um conjunto comercial realista, variando só o watts da categoria.
    base_set = next(s for s in ALL_SETS if s.property_type == "COMERCIAL")
    for field_name, threshold in RECOMMENDATION_THRESHOLDS.items():
        for delta in (-1.0, 0.0, 1.0):
            dist = dict(BASE_DISTRIBUTION)
            dist[field_name] = threshold + delta
            base_agg = aggregate_set(base_set, contract)
            payload = build_payload(base_set, 300.0, False, 4.0, contract)
            payload["daily_consumption_distribution"] = dist
            scenarios.append(
                Scenario(
                    name=f"threshold/{field_name}={threshold + delta:g}",
                    group="combinatorial",
                    payload=payload,
                    tags=frozenset({"threshold"}),
                    appliance_set=base_set.name,
                    expected_monthly_kwh=base_agg["expected_monthly_kwh"],
                )
            )

    return scenarios
