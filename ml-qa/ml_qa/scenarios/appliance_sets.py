"""Conjuntos de aparelhos realistas e geração do payload como o backend envia.

Em produção o fluxo é:

1. O usuário monta o **inventário do imóvel** no frontend escolhendo aparelhos
   do catálogo que o backend sincronizou do ML Service, cada um com uma
   quantidade;
2. O frontend calcula `equipment_quantity`, a distribuição diária de watts por
   categoria, a categoria de maior consumo e o top 3 de aparelhos por consumo
   mensal (computado com watts x horas x quantidade);
3. O backend agrega o inventário (ApplianceAggregationService) e monta o
   payload do `/predict` com esses valores + `consumption_kwh`,
   `peak_hour_usage`, `high_consumption_hours` e `property_type`.

Este módulo replica exatamente esse cálculo para que cada cenário do ml-qa
envie um conjunto de aparelhos **possível no fluxo real** e os valores
derivados sejam coerentes entre si (ex.: muitos aparelhos de refrigeração
implicam REFRIGERATION_WATTS alto).
"""

from __future__ import annotations

from dataclasses import dataclass

from .catalog import MlContract, fallback_contract

# Mapeia a categoria do aparelho (ml_category) para a chave da distribuição.
# Mesmo mapeamento do ApplianceAggregationService.distributionFor():
# - REFRIGERATION -> REFRIGERATION_WATTS
# - APPLIANCES/HEATING -> HEATING_WATTS
# - CLIMATE_CONTROL/AIR_CONDITIONING -> AIR_CONDITIONING_WATTS
# - LIGHTING -> LIGHTING_WATTS
# - TECHNOLOGY/SERVICES/OUTROS -> não entram na distribuição (OTHER)
DISTRIBUTION_KEYS = [
    "REFRIGERATION_WATTS",
    "HEATING_WATTS",
    "AIR_CONDITIONING_WATTS",
    "LIGHTING_WATTS",
]

CATEGORY_TO_KEY = {
    "REFRIGERATION": "REFRIGERATION_WATTS",
    "APPLIANCES": "HEATING_WATTS",
    "CLIMATE_CONTROL": "AIR_CONDITIONING_WATTS",
    "LIGHTING": "LIGHTING_WATTS",
}


@dataclass(frozen=True)
class ApplianceSet:
    """Perfil realista de inventário de aparelhos de um imóvel."""

    name: str
    label: str
    property_type: str
    items: tuple[tuple[str, int], ...]  # [(nome do aparelho no catálogo, quantidade)]


# Conjunto vazio: imóvel sem aparelhos registrados (possível em produção).
EMPTY_SET = ApplianceSet(
    name="imovel-vazio",
    label="Imóvel sem aparelhos",
    property_type="RESIDENCIAL",
    items=(),
)


# ---------------------------------------------------------------------------
# Perfis realistas por tipo de imóvel (nomes do catálogo do ML).
# ---------------------------------------------------------------------------

CASA_BASICA = ApplianceSet(
    name="casa-basica",
    label="Casa básica",
    property_type="RESIDENCIAL",
    items=(
        ("Geladeira", 1),
        ("Lampada", 6),
        ("Televisao", 1),
        ("Micro-ondas", 1),
        ("Chuveiro eletrico", 1),
        ("Roteador", 1),
        ("Ventilador", 1),
    ),
)

CASA_MEDIA = ApplianceSet(
    name="casa-media",
    label="Casa média",
    property_type="RESIDENCIAL",
    items=(
        ("Geladeira", 1),
        ("Freezer", 1),
        ("Lampada", 10),
        ("Televisao", 2),
        ("Micro-ondas", 1),
        ("Air fryer", 1),
        ("Maquina de lavar", 1),
        ("Chuveiro eletrico", 1),
        ("Roteador", 1),
        ("Notebook", 1),
        ("Videogame", 1),
        ("Ventilador", 1),
        ("Ar-condicionado", 1),
    ),
)

CASA_GRANDE = ApplianceSet(
    name="casa-grande",
    label="Casa grande",
    property_type="RESIDENCIAL",
    items=(
        ("Geladeira", 2),
        ("Freezer", 1),
        ("Lampada", 16),
        ("Televisao", 2),
        ("Micro-ondas", 1),
        ("Forno", 1),
        ("Air fryer", 1),
        ("Maquina de lavar", 1),
        ("Secadora", 1),
        ("Chuveiro eletrico", 2),
        ("Roteador", 1),
        ("Computador", 2),
        ("Notebook", 2),
        ("Videogame", 1),
        ("Ar-condicionado", 2),
        ("Ventilador", 2),
        ("Bomba d'agua", 1),
        ("Portao eletrico", 1),
        ("Motor de piscina", 1),
    ),
)

APARTAMENTO_COMPACTO = ApplianceSet(
    name="apartamento-compacto",
    label="Apartamento compacto",
    property_type="APARTAMENTO",
    items=(
        ("Geladeira", 1),
        ("Lampada", 4),
        ("Televisao", 1),
        ("Micro-ondas", 1),
        ("Chuveiro eletrico", 1),
        ("Roteador", 1),
        ("Notebook", 1),
        ("Ventilador", 1),
    ),
)

APARTAMENTO_MEDIO = ApplianceSet(
    name="apartamento-medio",
    label="Apartamento médio",
    property_type="APARTAMENTO",
    items=(
        ("Geladeira", 1),
        ("Lampada", 8),
        ("Televisao", 1),
        ("Micro-ondas", 1),
        ("Air fryer", 1),
        ("Maquina de lavar", 1),
        ("Chuveiro eletrico", 1),
        ("Roteador", 1),
        ("Notebook", 1),
        ("Videogame", 1),
        ("Split", 1),
        ("Ventilador", 1),
    ),
)

COMERCIO_LOJA = ApplianceSet(
    name="comercio-loja",
    label="Comércio (loja)",
    property_type="COMERCIAL",
    items=(
        ("Geladeira", 2),
        ("Bebedouro", 1),
        ("Lampada", 12),
        ("Televisao", 1),
        ("Computador", 2),
        ("Ar-condicionado", 2),
        ("Ventilador", 2),
        ("Cafeteira", 1),
    ),
)

COMERCIO_ESCRITORIO = ApplianceSet(
    name="comercio-escritorio",
    label="Comércio (escritório)",
    property_type="COMERCIAL",
    items=(
        ("Geladeira", 1),
        ("Bebedouro", 1),
        ("Lampada", 16),
        ("Computador", 4),
        ("Notebook", 4),
        ("Roteador", 1),
        ("Ar-condicionado", 2),
        ("Cafeteira", 1),
    ),
)

COMERCIO_RESTAURANTE = ApplianceSet(
    name="comercio-restaurante",
    label="Comércio (restaurante)",
    property_type="COMERCIAL",
    items=(
        ("Geladeira", 2),
        ("Freezer", 1),
        ("Bebedouro", 1),
        ("Lampada", 12),
        ("Micro-ondas", 1),
        ("Forno", 1),
        ("Fogao", 1),
        ("Liquidificador", 1),
        ("Cafeteira", 1),
        ("Ar-condicionado", 1),
        ("Ventilador", 2),
    ),
)

ALL_SETS: tuple[ApplianceSet, ...] = (
    CASA_BASICA,
    CASA_MEDIA,
    CASA_GRANDE,
    APARTAMENTO_COMPACTO,
    APARTAMENTO_MEDIO,
    COMERCIO_LOJA,
    COMERCIO_ESCRITORIO,
    COMERCIO_RESTAURANTE,
)


def set_by_name(name: str) -> ApplianceSet:
    for appliance_set in (*ALL_SETS, EMPTY_SET):
        if appliance_set.name == name:
            return appliance_set
    raise KeyError(f"Conjunto de aparelhos desconhecido: {name}")


def aggregate_set(appliance_set: ApplianceSet, contract: MlContract | None = None) -> dict:
    """Agrega o inventário como o backend faz.

    Retorna os valores derivados do conjunto: quantidade total, watts por
    categoria, produtos de maior consumo mensal e categoria de maior consumo.
    """
    contract = contract or fallback_contract()
    distribution = {key: 0.0 for key in DISTRIBUTION_KEYS}
    category_watts: dict[str, float] = {}  # watts por ml_category (todos)
    products: list[dict] = _product_rows(appliance_set, contract)  # [{name, monthly_kwh}]
    equipment_quantity = 0

    for name, quantity in appliance_set.items:
        appliance = contract.appliance(name)
        if appliance is None:
            continue
        watts_total = float(appliance["watts"]) * quantity
        equipment_quantity += quantity
        key = CATEGORY_TO_KEY.get(appliance["ml_category"])
        if key:
            distribution[key] += watts_total
        # O frontend (computeApplianceCalc) soma watts por ml_category de TODOS
        # os aparelhos (incl. TECHNOLOGY/SERVICES) para derivar a categoria.
        ml_category = appliance["ml_category"]
        category_watts[ml_category] = category_watts.get(ml_category, 0.0) + watts_total

    highest_products = [p["name"] for p in products[:3]]

    # Categoria de maior consumo: mesma regra do frontend (ml_category com
    # maior watts total). Pode ser TECHNOLOGY/SERVICES se dominarem o inventário.
    highest_category = None
    if category_watts:
        highest_category = max(category_watts, key=category_watts.get)

    return {
        "equipment_quantity": equipment_quantity,
        "distribution": distribution,
        "highest_consumption_products": highest_products,
        "highest_consumption_category": highest_category,
        "expected_monthly_kwh": round(sum(p["monthly_kwh"] for p in products), 2),
    }


def appliance_details(
    appliance_set: ApplianceSet, contract: MlContract | None = None
) -> tuple[dict, ...]:
    """Detalhamento por equipamento, como o frontend exibe no histórico.

    Cada linha traz {name, quantity, watts, hours, monthly_kwh}, ordenada por
    consumo mensal decrescente (mesma regra do ApplianceTable do frontend).
    O consumo mensal é watts x horas x quantidade x 30 / 1000.
    """
    contract = contract or fallback_contract()
    rows: list[dict] = []
    for name, quantity in appliance_set.items:
        appliance = contract.appliance(name)
        if appliance is None:
            continue
        watts = float(appliance["watts"])
        hours = float(appliance["hours"])
        rows.append(
            {
                "name": name,
                "quantity": quantity,
                "watts": watts,
                "hours": hours,
                # Valor bruto (sem arredondar): a exibição formata com 1 casa
                # e o total soma os valores exatos, como o frontend faz.
                "monthly_kwh": watts * hours * quantity * 30 / 1000,
            }
        )
    rows.sort(key=lambda row: row["monthly_kwh"], reverse=True)
    return tuple(rows)


def _product_rows(appliance_set: ApplianceSet, contract: MlContract) -> list[dict]:
    """Linhas por aparelho com nome e consumo mensal (para agregação)."""
    return [
        {"name": row["name"], "monthly_kwh": row["monthly_kwh"]}
        for row in appliance_details(appliance_set, contract)
    ]


def build_payload(
    appliance_set: ApplianceSet,
    consumption_kwh: float,
    peak_hour_usage: bool,
    high_consumption_hours: float,
    contract: MlContract | None = None,
    omit_optional: bool = False,
) -> dict:
    """Monta o payload do /predict exatamente como o backend envia.

    Espelha o MlPredictionAdapter: sempre envia os 6 campos obrigatórios
    (incluindo `daily_consumption_distribution`) e, quando disponíveis,
    `highest_consumption_category` e `highest_consumption_products`.
    """
    contract = contract or fallback_contract()
    aggregation = aggregate_set(appliance_set, contract)

    payload: dict = {
        "consumption_kwh": float(consumption_kwh),
        "peak_hour_usage": bool(peak_hour_usage),
        "equipment_quantity": aggregation["equipment_quantity"],
        "property_type": appliance_set.property_type,
        "high_consumption_hours": float(high_consumption_hours),
        "daily_consumption_distribution": aggregation["distribution"],
    }
    if not omit_optional:
        if aggregation["highest_consumption_category"]:
            payload["highest_consumption_category"] = aggregation["highest_consumption_category"]
        if aggregation["highest_consumption_products"]:
            payload["highest_consumption_products"] = aggregation["highest_consumption_products"]
    return payload
