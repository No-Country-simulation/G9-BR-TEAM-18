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
