import os
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="EnergiAI - API de Inteligência Artificial",
    description="API interna para análise e classificação de eficiência energética.",
    version="2.0.0"
)

# -------------------------------------------------------------
# CARREGAMENTO DO MODELO
# -------------------------------------------------------------

MODELO_PATH = os.path.join(os.path.dirname(__file__), "modelo_categorizacao.joblib")
modelo = None

try:
    modelo = joblib.load(MODELO_PATH)
    print(f"[EnergiAI] Modelo carregado de {MODELO_PATH}")
except Exception as e:
    print(f"[EnergiAI] Aviso: modelo não encontrado ({e}) — usando fallback rule-based")

# -------------------------------------------------------------
# DEFINIÇÃO DO CONTRATO (Modelos de Entrada e Saída)
# -------------------------------------------------------------

CONSUMO_BASE_POR_TIPO = {
    "Casa": 250.0, "Apartamento": 150.0, "Comercio": 500.0,
    "Industria": 800.0, "Rural": 300.0, "Outro": 250.0,
}

class DistribuicaoConsumo(BaseModel):
    REFRIGERACAO_WATTS: float = 0.0
    AQUECIMENTO_WATTS: float = 0.0
    CLIMATIZACAO_WATTS: float = 0.0
    ILUMINACAO_WATTS: float = 0.0

class PredictRequest(BaseModel):
    consumo_kwh: float
    uso_horario_pico: bool
    quantidade_equipamentos: int
    tipo_imovel: str
    horas_alto_consumo: float
    distribuicao_consumo_diario: DistribuicaoConsumo | None = None

class PredictResponse(BaseModel):
    categoria: str
    probabilidade: float
    recomendacoes: list[str]

# -------------------------------------------------------------
# LÓGICA DE CLASSIFICAÇÃO
# -------------------------------------------------------------

def _classificar_rule_based(data: PredictRequest) -> tuple[str, float]:
    base = CONSUMO_BASE_POR_TIPO.get(data.tipo_imovel, 250.0)
    consumo_relativo = data.consumo_kwh / base
    consumo_norm = min(consumo_relativo / 3.0, 1.0)
    equip_norm = min(data.quantidade_equipamentos / 25.0, 1.0)
    horas_norm = min(data.horas_alto_consumo / 12.0, 1.0)
    pico_norm = 1.0 if data.uso_horario_pico else 0.0

    indice = 0.40 * consumo_norm + 0.25 * pico_norm + 0.20 * equip_norm + 0.15 * horas_norm

    if indice < 0.2:
        return "EXCELENTE", 0.92
    if indice < 0.4:
        return "BOM", 0.85
    if indice < 0.6:
        return "MEDIANO", 0.78
    if indice < 0.8:
        return "RUIM", 0.82
    return "CRITICO", 0.90

def _gerar_recomendacoes(data: PredictRequest, categoria: str) -> list[str]:
    recs = []
    if data.uso_horario_pico:
        recs.append("Reduzir o uso de equipamentos potentes durante os horários de pico (18h às 21h).")

    if categoria in ("RUIM", "CRITICO"):
        recs.append("Considere substituir equipamentos antigos por modelos mais eficientes.")

    if data.quantidade_equipamentos > 10:
        recs.append("Avalie a real necessidade de todos os equipamentos ligados simultaneamente.")

    if data.horas_alto_consumo > 5:
        recs.append("Distribua o uso de equipamentos ao longo do dia para reduzir o horário de alto consumo.")

    if data.distribuicao_consumo_diario:
        dc = data.distribuicao_consumo_diario
        if dc.CLIMATIZACAO_WATTS > 3000:
            recs.append("Reduzir o uso de ar-condicionado ou ajustar a temperatura para 23°C.")
        if dc.AQUECIMENTO_WATTS > 5000:
            recs.append("Evitar banhos longos ou com o chuveiro elétrico na potência máxima.")
        if dc.ILUMINACAO_WATTS > 1000:
            recs.append("Substituir lâmpadas antigas por tecnologia LED de baixo consumo.")

    if categoria == "EXCELENTE":
        recs.append("Continue mantendo as boas práticas de eficiência energética!")
    elif not recs:
        recs.append("Mantenha o bom acompanhamento dos seus hábitos de consumo!")

    return recs

# -------------------------------------------------------------
# ENDPOINT DE PREDIÇÃO
# -------------------------------------------------------------

@app.post("/predict", response_model=PredictResponse)
def predict_consumo(data: PredictRequest):
    if modelo is not None:
        try:
            df = pd.DataFrame([{
                "consumo_kwh": data.consumo_kwh,
                "uso_horario_pico": int(data.uso_horario_pico),
                "quantidade_equipamentos": data.quantidade_equipamentos,
                "tipo_imovel": data.tipo_imovel,
                "horas_alto_consumo": data.horas_alto_consumo,
            }])
            pred = modelo.predict(df)[0]
            probs = modelo.predict_proba(df)[0]
            idx = list(modelo.classes_).index(pred)
            categoria = pred.upper()
            probabilidade = round(float(probs[idx]), 4)
        except Exception as e:
            print(f"[EnergiAI] Erro na predição: {e}")
            categoria, probabilidade = _classificar_rule_based(data)
    else:
        categoria, probabilidade = _classificar_rule_based(data)

    recomendacoes = _gerar_recomendacoes(data, categoria)

    return PredictResponse(
        categoria=categoria,
        probabilidade=probabilidade,
        recomendacoes=recomendacoes
    )