import pandas as pd

BASE_CONSUMPTION_BY_TYPE = {"Casa": 250, "Apartamento": 150, "Comercial": 500}

HIGHEST_CONSUMPTION_CATEGORIES = [
    "Refrigeracao",
    "Climatizacao",
    "Tecnologia",
    "Iluminacao",
    "Eletrodomesticos",
    "Servicos",
    "Outros",
]

APPLIANCE_COLUMNS = {
    "qtd_geladeira": {
        "name": "Geladeira",
        "ml_category": "REFRIGERATION",
        "watts": 150,
        "hours": 24,
    },
    "qtd_freezer": {"name": "Freezer", "ml_category": "REFRIGERATION", "watts": 200, "hours": 24},
    "qtd_frigobar": {"name": "Frigobar", "ml_category": "REFRIGERATION", "watts": 100, "hours": 24},
    "qtd_bebedouro": {
        "name": "Bebedouro",
        "ml_category": "REFRIGERATION",
        "watts": 90,
        "hours": 24,
    },
    "qtd_ar_condicionado": {
        "name": "Ar-condicionado",
        "ml_category": "CLIMATE_CONTROL",
        "watts": 1500,
        "hours": 8,
    },
    "qtd_ar_condicionado_split": {
        "name": "Split",
        "ml_category": "CLIMATE_CONTROL",
        "watts": 1200,
        "hours": 8,
    },
    "qtd_ventilador": {
        "name": "Ventilador",
        "ml_category": "CLIMATE_CONTROL",
        "watts": 100,
        "hours": 8,
    },
    "qtd_aquecedor_eletrico": {
        "name": "Aquecedor",
        "ml_category": "CLIMATE_CONTROL",
        "watts": 1500,
        "hours": 3,
    },
    "qtd_lampadas": {"name": "Lampada", "ml_category": "LIGHTING", "watts": 12, "hours": 6},
    "qtd_microondas": {
        "name": "Micro-ondas",
        "ml_category": "APPLIANCES",
        "watts": 1200,
        "hours": 0.5,
    },
    "qtd_air_fryer": {
        "name": "Air fryer",
        "ml_category": "APPLIANCES",
        "watts": 1500,
        "hours": 0.75,
    },
    "qtd_lavar_secar": {
        "name": "Maquina de lavar",
        "ml_category": "APPLIANCES",
        "watts": 500,
        "hours": 1.5,
    },
    "qtd_secadora_roupas": {
        "name": "Secadora",
        "ml_category": "APPLIANCES",
        "watts": 2500,
        "hours": 1,
    },
    "qtd_chuveiro_eletrico": {
        "name": "Chuveiro eletrico",
        "ml_category": "APPLIANCES",
        "watts": 5500,
        "hours": 0.5,
    },
    "qtd_cafeteira_eletrica": {
        "name": "Cafeteira",
        "ml_category": "APPLIANCES",
        "watts": 800,
        "hours": 0.25,
    },
    "qtd_ferro_passar": {
        "name": "Ferro de passar",
        "ml_category": "APPLIANCES",
        "watts": 1200,
        "hours": 0.5,
    },
    "qtd_aspirador_po": {
        "name": "Aspirador",
        "ml_category": "APPLIANCES",
        "watts": 1400,
        "hours": 0.5,
    },
    "qtd_liquidificador": {
        "name": "Liquidificador",
        "ml_category": "APPLIANCES",
        "watts": 500,
        "hours": 0.25,
    },
    "qtd_batedeira": {
        "name": "Batedeira",
        "ml_category": "APPLIANCES",
        "watts": 300,
        "hours": 0.25,
    },
    "qtd_forno_eletrico": {
        "name": "Forno",
        "ml_category": "APPLIANCES",
        "watts": 1500,
        "hours": 0.75,
    },
    "qtd_fogao_eletrico": {"name": "Fogao", "ml_category": "APPLIANCES", "watts": 1500, "hours": 1},
    "qtd_tv": {"name": "Televisao", "ml_category": "TECHNOLOGY", "watts": 150, "hours": 6},
    "qtd_computadores": {
        "name": "Computador",
        "ml_category": "TECHNOLOGY",
        "watts": 150,
        "hours": 8,
    },
    "qtd_notebook": {"name": "Notebook", "ml_category": "TECHNOLOGY", "watts": 65, "hours": 6},
    "qtd_roteador_wifi": {
        "name": "Roteador",
        "ml_category": "TECHNOLOGY",
        "watts": 10,
        "hours": 24,
    },
    "qtd_videogame": {"name": "Videogame", "ml_category": "TECHNOLOGY", "watts": 200, "hours": 4},
    "qtd_bomba_dagua": {
        "name": "Bomba d'agua",
        "ml_category": "SERVICES",
        "watts": 750,
        "hours": 1,
    },
    "qtd_portao_eletrico": {
        "name": "Portao eletrico",
        "ml_category": "SERVICES",
        "watts": 250,
        "hours": 0.25,
    },
    "qtd_motor_piscina": {
        "name": "Motor de piscina",
        "ml_category": "SERVICES",
        "watts": 750,
        "hours": 4,
    },
}

# Colunas que existem no dataset mas são redundantes com uma coluna já listada
REDUNDANT_APPLIANCE_COLUMNS = {
    "qtd_computador_desktop": "qtd_computadores",
    "qtd_maquina_lavar": "qtd_lavar_secar",
}


def _fill_distribution(df: pd.DataFrame) -> pd.DataFrame:
    for col in ["refrigeration_watts", "heating_watts", "air_conditioning_watts", "lighting_watts"]:
        if col not in df.columns:
            df[col] = 0.0
    return df


def normalize_category(cat: object) -> str:
    if not isinstance(cat, str):
        return "Outros"
    cat_lower = cat.strip().lower()
    mapping = {
        "refrigeração": "Refrigeracao",
        "refrigeracao": "Refrigeracao",
        "climatização": "Climatizacao",
        "climatizacao": "Climatizacao",
        "tecnologia": "Tecnologia",
        "iluminação": "Iluminacao",
        "iluminacao": "Iluminacao",
        "eletrodomésticos": "Eletrodomesticos",
        "eletrodomesticos": "Eletrodomesticos",
        "serviços": "Servicos",
        "servicos": "Servicos",
        "outros": "Outros",
    }
    return mapping.get(cat_lower, "Outros")


def normalize_property_type(ptype: object) -> str:
    """Normaliza property_type de ingles para portugues (formato do modelo)."""
    if not isinstance(ptype, str):
        return "Casa"
    mapping = {
        "residencial": "Casa",
        "apartamento": "Apartamento",
        "comercial": "Comercial",
    }
    return mapping.get(ptype.strip().lower(), "Casa")


def translate_category(cat: object) -> str:
    """Traduz highest_consumption_category de ingles para portugues.
    Funcao separada da normalize_category() porque esta e usada no pipeline
    sklearn (treino + inferência) e não deve ser alterada.
    """
    if not isinstance(cat, str):
        return "Outros"
    mapping = {
        "refrigeration": "Refrigeracao",
        "climate_control": "Climatizacao",
        "climatization": "Climatizacao",
        "technology": "Tecnologia",
        "lighting": "Iluminacao",
        "appliances": "Eletrodomesticos",
        "services": "Servicos",
        "others": "Outros",
    }
    return mapping.get(cat.strip().lower(), "Outros")


def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = _fill_distribution(df)

    epsilon = 1e-6

    if "highest_consumption_category" in df.columns:
        df["highest_consumption_category"] = df["highest_consumption_category"].apply(
            normalize_category
        )

    df["consumption_per_equipment"] = df["consumption_kwh"] / (df["equipment_quantity"] + epsilon)
    df["consumption_per_hour"] = df["consumption_kwh"] / (df["high_consumption_hours"] + epsilon)
    df["normalized_relative_consumption"] = df["consumption_kwh"] / 500.0
    df["estimated_load"] = df["equipment_quantity"] * df["high_consumption_hours"]
    df["consumption_per_equipment"] = df["consumption_per_equipment"].clip(0, 500)
    df["consumption_per_hour"] = df["consumption_per_hour"].clip(0, 500)

    total = (
        df["refrigeration_watts"]
        + df["heating_watts"]
        + df["air_conditioning_watts"]
        + df["lighting_watts"]
    )
    df["total_watts"] = total
    df["pct_refrigeration"] = (df["refrigeration_watts"] / (total + epsilon)).clip(0, 1)
    df["pct_heating"] = (df["heating_watts"] / (total + epsilon)).clip(0, 1)
    df["pct_air_conditioning"] = (df["air_conditioning_watts"] / (total + epsilon)).clip(0, 1)
    df["pct_lighting"] = (df["lighting_watts"] / (total + epsilon)).clip(0, 1)

    if "highest_consumption_category" in df.columns:
        df["highest_consumption_category_lower"] = df["highest_consumption_category"].str.lower()
        for cat in HIGHEST_CONSUMPTION_CATEGORIES:
            lower_cat = cat.lower()
            df[f"cat_highest_{lower_cat}"] = (
                df["highest_consumption_category_lower"] == lower_cat
            ).astype(int)

    if "daily_consumption_distribution" in df.columns:
        df["refrigeration_watts"] = df["daily_consumption_distribution"].apply(
            lambda x: x.get("REFRIGERATION_WATTS", 0.0) if isinstance(x, dict) else 0.0
        )
        df["heating_watts"] = df["daily_consumption_distribution"].apply(
            lambda x: x.get("HEATING_WATTS", 0.0) if isinstance(x, dict) else 0.0
        )
        df["air_conditioning_watts"] = df["daily_consumption_distribution"].apply(
            lambda x: x.get("AIR_CONDITIONING_WATTS", 0.0) if isinstance(x, dict) else 0.0
        )
        df["lighting_watts"] = df["daily_consumption_distribution"].apply(
            lambda x: x.get("LIGHTING_WATTS", 0.0) if isinstance(x, dict) else 0.0
        )
        total = (
            df["refrigeration_watts"]
            + df["heating_watts"]
            + df["air_conditioning_watts"]
            + df["lighting_watts"]
        )
        df["total_watts"] = total
        df["pct_refrigeration"] = (df["refrigeration_watts"] / (total + epsilon)).clip(0, 1)
        df["pct_heating"] = (df["heating_watts"] / (total + epsilon)).clip(0, 1)
        df["pct_air_conditioning"] = (df["air_conditioning_watts"] / (total + epsilon)).clip(0, 1)
        df["pct_lighting"] = (df["lighting_watts"] / (total + epsilon)).clip(0, 1)

    return df
