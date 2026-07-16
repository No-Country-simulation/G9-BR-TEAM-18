import pandas as pd

CONSUMO_BASE_POR_TIPO = {
    "Casa": 250, "Apartamento": 150, "Comercial": 500,
    "Industria": 800, "Rural": 300, "Outro": 250,
}


def engenharia_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    epsilon = 1e-6
    df["consumo_por_equipamento"] = df["consumo_kwh"] / (df["quantidade_equipamentos"] + epsilon)
    df["consumo_por_hora"] = df["consumo_kwh"] / (df["horas_alto_consumo"] + epsilon)
    df["consumo_relativo_normalizado"] = df["consumo_kwh"] / 500.0
    df["carga_estimada"] = df["quantidade_equipamentos"] * df["horas_alto_consumo"]
    df["consumo_por_equipamento"] = df["consumo_por_equipamento"].clip(0, 500)
    df["consumo_por_hora"] = df["consumo_por_hora"].clip(0, 500)
    return df
