"""Descoberta dos valores reais suportados pelo ML Service.

No fluxo atual do projeto, o backend só envia ao ML Service valores que o
próprio ML Service define e publica via `/contract` e `/appliance-catalog`:

- `property_type`: um dos `property_types` do contrato (validado no backend);
- `highest_consumption_category`: uma das `consumption_categories` do contrato;
- `highest_consumption_products`: nomes do catálogo de aparelhos que o ML
  publica (o frontend só oferece os aparelhos que o backend sincronizou do
  ML; logo, o ML nunca recebe um nome que ele não conhece);
- `daily_consumption_distribution`: sempre presente (calculada pelo backend a
  partir do inventário de aparelhos do imóvel).

Este módulo consulta esses endpoints para que os cenários gerados reflitam
apenas valores possíveis no fluxo real. Se o ML estiver indisponível, usa o
catálogo conhecido do contrato 3.0.0 como fallback (mesma abordagem do
backend).
"""

from __future__ import annotations

from dataclasses import dataclass

import httpx

CONTRACT_PATH = "/contract"
CATALOG_PATH = "/appliance-catalog"

# Fallback: contrato 3.0.0 (mesmos valores usados pelo backend como default).
FALLBACK_PROPERTY_TYPES = ["RESIDENCIAL", "APARTAMENTO", "COMERCIAL"]
FALLBACK_CONSUMPTION_CATEGORIES = [
    "REFRIGERATION",
    "CLIMATE_CONTROL",
    "TECHNOLOGY",
    "LIGHTING",
    "APPLIANCES",
    "SERVICES",
    "OTHERS",
]

# Catálogo completo que o ML Service publica (APPLIANCE_COLUMNS em main.py).
# Nomes exatamente como o ML publica, sem acentuação, porque é assim que o
# backend sincroniza e o frontend exibe.
FALLBACK_APPLIANCES: list[dict] = [
    {"name": "Geladeira", "ml_category": "REFRIGERATION", "watts": 150, "hours": 24},
    {"name": "Freezer", "ml_category": "REFRIGERATION", "watts": 200, "hours": 24},
    {"name": "Frigobar", "ml_category": "REFRIGERATION", "watts": 100, "hours": 24},
    {"name": "Bebedouro", "ml_category": "REFRIGERATION", "watts": 90, "hours": 24},
    {"name": "Ar-condicionado", "ml_category": "CLIMATE_CONTROL", "watts": 1500, "hours": 8},
    {"name": "Split", "ml_category": "CLIMATE_CONTROL", "watts": 1200, "hours": 8},
    {"name": "Ventilador", "ml_category": "CLIMATE_CONTROL", "watts": 100, "hours": 8},
    {"name": "Aquecedor", "ml_category": "CLIMATE_CONTROL", "watts": 1500, "hours": 3},
    {"name": "Lampada", "ml_category": "LIGHTING", "watts": 12, "hours": 6},
    {"name": "Micro-ondas", "ml_category": "APPLIANCES", "watts": 1200, "hours": 0.5},
    {"name": "Air fryer", "ml_category": "APPLIANCES", "watts": 1500, "hours": 0.75},
    {"name": "Maquina de lavar", "ml_category": "APPLIANCES", "watts": 500, "hours": 1.5},
    {"name": "Secadora", "ml_category": "APPLIANCES", "watts": 2500, "hours": 1},
    {"name": "Chuveiro eletrico", "ml_category": "APPLIANCES", "watts": 5500, "hours": 0.5},
    {"name": "Cafeteira", "ml_category": "APPLIANCES", "watts": 800, "hours": 0.25},
    {"name": "Ferro de passar", "ml_category": "APPLIANCES", "watts": 1200, "hours": 0.5},
    {"name": "Aspirador", "ml_category": "APPLIANCES", "watts": 1400, "hours": 0.5},
    {"name": "Liquidificador", "ml_category": "APPLIANCES", "watts": 500, "hours": 0.25},
    {"name": "Batedeira", "ml_category": "APPLIANCES", "watts": 300, "hours": 0.25},
    {"name": "Forno", "ml_category": "APPLIANCES", "watts": 1500, "hours": 0.75},
    {"name": "Fogao", "ml_category": "APPLIANCES", "watts": 1500, "hours": 1},
    {"name": "Televisao", "ml_category": "TECHNOLOGY", "watts": 150, "hours": 6},
    {"name": "Computador", "ml_category": "TECHNOLOGY", "watts": 150, "hours": 8},
    {"name": "Notebook", "ml_category": "TECHNOLOGY", "watts": 65, "hours": 6},
    {"name": "Roteador", "ml_category": "TECHNOLOGY", "watts": 10, "hours": 24},
    {"name": "Videogame", "ml_category": "TECHNOLOGY", "watts": 200, "hours": 4},
    {"name": "Bomba d'agua", "ml_category": "SERVICES", "watts": 750, "hours": 1},
    {"name": "Portao eletrico", "ml_category": "SERVICES", "watts": 250, "hours": 0.25},
    {"name": "Motor de piscina", "ml_category": "SERVICES", "watts": 750, "hours": 4},
]


@dataclass
class MlContract:
    """Valores reais suportados pelo ML Service."""

    property_types: list[str]
    consumption_categories: list[str]
    appliances: list[dict]  # [{name, ml_category, watts, hours}]

    def appliance(self, name: str) -> dict | None:
        """Retorna o aparelho do catálogo pelo nome (ou None)."""
        for app in self.appliances:
            if app["name"] == name:
                return app
        return None

    def appliance_names(self) -> list[str]:
        return [app["name"] for app in self.appliances]

    def appliance_names_by_category(self, category: str) -> list[str]:
        return [app["name"] for app in self.appliances if app.get("ml_category") == category]


def fallback_contract() -> MlContract:
    """Contrato com os valores conhecidos do contrato 3.0.0 (sem rede)."""
    return MlContract(
        property_types=list(FALLBACK_PROPERTY_TYPES),
        consumption_categories=list(FALLBACK_CONSUMPTION_CATEGORIES),
        appliances=[dict(app) for app in FALLBACK_APPLIANCES],
    )


def fetch_contract(base_url: str) -> MlContract:
    """Busca o contrato e o catálogo reais; usa fallback se o ML falhar."""
    contract_data: dict = {}
    catalog_data: dict = {}
    with httpx.Client(base_url=base_url, timeout=10.0) as client:
        try:
            response = client.get(CONTRACT_PATH)
            if response.status_code == 200:
                contract_data = response.json()
        except httpx.HTTPError:
            pass
        try:
            response = client.get(CATALOG_PATH)
            if response.status_code == 200:
                catalog_data = response.json()
        except httpx.HTTPError:
            pass

    property_types = contract_data.get("property_types") or FALLBACK_PROPERTY_TYPES
    consumption_categories = (
        contract_data.get("consumption_categories") or FALLBACK_CONSUMPTION_CATEGORIES
    )
    appliances = catalog_data.get("appliances") or FALLBACK_APPLIANCES

    return MlContract(
        property_types=list(property_types),
        consumption_categories=list(consumption_categories),
        appliances=list(appliances),
    )
