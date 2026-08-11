"""Cenários de borda possíveis no fluxo real do projeto.

O backend valida e serializa o payload antes de enviá-lo ao ML Service,
portanto o ML **nunca** recebe (no fluxo atual):

- campos obrigatórios ausentes (o backend sempre envia os 6 obrigatórios);
- tipos incorretos (Jackson serializa corretamente);
- valores negativos (backend valida `consumption_kwh >= 0.01`,
  `high_consumption_hours >= 0.00`);
- `property_type` fora do contrato (validado contra o enum do backend);
- nomes de aparelhos desconhecidos (vêm do catálogo do próprio ML).

Este grupo cobre apenas os casos-limite **possíveis**: valores no extremo da
faixa validada, imóvel sem aparelhos registrados, campos opcionais ausentes
e consumo incoerente com o inventário. Todos esperam HTTP 200.
"""

from __future__ import annotations

from .appliance_sets import (
    CASA_BASICA,
    CASA_MEDIA,
    EMPTY_SET,
    aggregate_set,
    build_payload,
)
from .catalog import MlContract, fallback_contract
from .model import Scenario


def generate_anomalies(contract: MlContract | None = None) -> list[Scenario]:
    """Gera os casos-limite possíveis no fluxo real (todos esperam 200)."""
    contract = contract or fallback_contract()
    aggregation = aggregate_set(CASA_MEDIA, contract)
    expected = aggregation["expected_monthly_kwh"] or 1.0

    cases: list[tuple[str, dict, str | None]] = [
        # Consumo nos extremos da faixa validada no backend (0.01 a 99999999.99).
        (
            "edge/consumption-min",
            build_payload(CASA_MEDIA, 0.01, False, 5.0, contract),
            CASA_MEDIA.name,
        ),
        (
            "edge/consumption-max",
            build_payload(CASA_MEDIA, 99999999.99, False, 5.0, contract),
            CASA_MEDIA.name,
        ),
        # Horas nos extremos da faixa validada (0.00 a 99.99).
        (
            "edge/hours-min",
            build_payload(CASA_MEDIA, expected, False, 0.0, contract),
            CASA_MEDIA.name,
        ),
        (
            "edge/hours-max",
            build_payload(CASA_MEDIA, expected, False, 99.99, contract),
            CASA_MEDIA.name,
        ),
        # Imóvel sem aparelhos registrados: quantidade 0 e distribuição zerada.
        (
            "edge/empty-set",
            build_payload(EMPTY_SET, expected, False, 5.0, contract),
            EMPTY_SET.name,
        ),
        # Campos opcionais ausentes: o backend só os envia quando presentes.
        (
            "edge/optional-absent",
            build_payload(CASA_MEDIA, expected, False, 5.0, contract, omit_optional=True),
            CASA_MEDIA.name,
        ),
        # Consumo muito abaixo do que o inventário implicaria (incoerência).
        (
            "edge/consumption-below-set",
            build_payload(CASA_BASICA, 0.01, False, 5.0, contract),
            CASA_BASICA.name,
        ),
        # Consumo muito acima do que o inventário implicaria (incoerência).
        (
            "edge/consumption-above-set",
            build_payload(CASA_BASICA, expected * 10, False, 5.0, contract),
            CASA_BASICA.name,
        ),
        # Uso de pico com consumo baixo (semanticamente estranho, porém válido).
        (
            "edge/peak-low-consumption",
            build_payload(CASA_MEDIA, expected * 0.3, True, 5.0, contract),
            CASA_MEDIA.name,
        ),
    ]

    scenarios: list[Scenario] = []
    for name, payload, appliance_set in cases:
        scenarios.append(
            Scenario(
                name=f"anomaly/{name}",
                group="anomalies",
                payload=payload,
                expect_status=200,
                tags=frozenset({"edge"}),
                appliance_set=appliance_set,
                expected_monthly_kwh=aggregation["expected_monthly_kwh"],
            )
        )
    return scenarios
