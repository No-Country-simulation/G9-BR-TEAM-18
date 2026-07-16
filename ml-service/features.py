import pandas as pd

CONSUMO_BASE_POR_TIPO = {
    "Casa": 250, "Apartamento": 150, "Comercial": 500,
    "Industria": 800, "Rural": 300, "Outro": 250,
}

CATEGORIAS_MAIOR_CONSUMO = [
    "Refrigeracao", "Climatizacao", "Tecnologia", "Iluminacao",
    "Eletrodomesticos", "Servicos", "Outros",
]


def _fill_distribuicao(df: pd.DataFrame) -> pd.DataFrame:
    for col in ["refrig_watts", "aquecimento_watts", "climatizacao_watts", "iluminacao_watts"]:
        if col not in df.columns:
            df[col] = 0.0
    return df


def normalizar_categoria(cat):
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
        "outros": "Outros"
    }
    return mapping.get(cat_lower, "Outros")


def engenharia_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = _fill_distribuicao(df)

    epsilon = 1e-6

    # Normalize categoria_maior_consumo if present
    if "categoria_maior_consumo" in df.columns:
        df["categoria_maior_consumo"] = df["categoria_maior_consumo"].apply(normalizar_categoria)

    df["consumo_por_equipamento"] = df["consumo_kwh"] / (df["quantidade_equipamentos"] + epsilon)
    df["consumo_por_hora"] = df["consumo_kwh"] / (df["horas_alto_consumo"] + epsilon)
    df["consumo_relativo_normalizado"] = df["consumo_kwh"] / 500.0
    df["carga_estimada"] = df["quantidade_equipamentos"] * df["horas_alto_consumo"]
    df["consumo_por_equipamento"] = df["consumo_por_equipamento"].clip(0, 500)
    df["consumo_por_hora"] = df["consumo_por_hora"].clip(0, 500)

    total = (
        df["refrig_watts"] + df["aquecimento_watts"]
        + df["climatizacao_watts"] + df["iluminacao_watts"]
    )
    df["total_watts"] = total
    df["pct_refrig"] = (df["refrig_watts"] / (total + epsilon)).clip(0, 1)
    df["pct_aquecimento"] = (df["aquecimento_watts"] / (total + epsilon)).clip(0, 1)
    df["pct_climatizacao"] = (df["climatizacao_watts"] / (total + epsilon)).clip(0, 1)
    df["pct_iluminacao"] = (df["iluminacao_watts"] / (total + epsilon)).clip(0, 1)

    # Add engineering for categoria_maior_consumo
    if "categoria_maior_consumo" in df.columns:
        # Convert to lowercase for consistency
        df["categoria_maior_consumo_lower"] = df["categoria_maior_consumo"].str.lower()
        # Create one-hot encoding for the category
        for cat in CATEGORIAS_MAIOR_CONSUMO:
            df[f"cat_maior_{cat.lower()}"] = (df["categoria_maior_consumo_lower"] == cat.lower()).astype(int)

    # Add engineering for distribuicao_consumo_diario
    # Extract features from the 4 power distribution columns
    if "distribuicao_consumo_diario" in df.columns:
        # distribuicao_consumo_diario is a dict/object with the 4 power fields
        # We'll extract them and add as separate columns
        df["refrig_watts"] = df["distribuicao_consumo_diario"].apply(
            lambda x: x.get("REFRIGERACAO_WATTS", 0.0) if isinstance(x, dict) else 0.0
        )
        df["aquecimento_watts"] = df["distribuicao_consumo_diario"].apply(
            lambda x: x.get("AQUECIMENTO_WATTS", 0.0) if isinstance(x, dict) else 0.0
        )
        df["climatizacao_watts"] = df["distribuicao_consumo_diario"].apply(
            lambda x: x.get("CLIMATIZACAO_WATTS", 0.0) if isinstance(x, dict) else 0.0
        )
        df["iluminacao_watts"] = df["distribuicao_consumo_diario"].apply(
            lambda x: x.get("ILUMINACAO_WATTS", 0.0) if isinstance(x, dict) else 0.0
        )
        # Recalculate total and percentages after extraction
        total = (
            df["refrig_watts"] + df["aquecimento_watts"]
            + df["climatizacao_watts"] + df["iluminacao_watts"]
        )
        df["total_watts"] = total
        df["pct_refrig"] = (df["refrig_watts"] / (total + epsilon)).clip(0, 1)
        df["pct_aquecimento"] = (df["aquecimento_watts"] / (total + epsilon)).clip(0, 1)
        df["pct_climatizacao"] = (df["climatizacao_watts"] / (total + epsilon)).clip(0, 1)
        df["pct_iluminacao"] = (df["iluminacao_watts"] / (total + epsilon)).clip(0, 1)

    return df
