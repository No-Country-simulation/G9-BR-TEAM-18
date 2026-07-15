from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Dict

app = FastAPI(
    title="EnergiAI - API de Inteligência Artificial",
    description="API interna para análise e classificação de eficiência energética.",
    version="1.0.0"
)

# -------------------------------------------------------------
# DEFINIÇÃO DO CONTRATO (Modelos de Entrada e Saída)
# -------------------------------------------------------------

class DistribuicaoConsumo(BaseModel):
    REFRIGERACAO_WATTS: float
    AQUECIMENTO_WATTS: float
    CLIMATIZACAO_WATTS: float
    ILUMINACAO_WATTS: float

# JSON que o Java vai enviar
class PredictRequest(BaseModel):
    consumo_kwh: float
    uso_horario_pico: bool
    quantidade_equipamentos: int
    tipo_imovel: str
    horas_alto_consumo: float
    distribuicao_consumo_diario: DistribuicaoConsumo

# JSON deve devolver para o Java
class PredictResponse(BaseModel):
    categoria: str
    probabilidade: float
    recomendacoes: list[str]

# -------------------------------------------------------------
# ENDPOINT DE PREDIÇÃO
# -------------------------------------------------------------

@app.post("/predict", response_model=PredictResponse)
def predict_consumo(data: PredictRequest):
    """
    Recebe os dados agregados do imóvel, roda a lógica do modelo de IA 
    e retorna a categoria de eficiência, probabilidade e recomendações.
    """
    
    # === ESPAÇO PARA O MODELO DE INTELIGÊNCIA ARTIFICIAL ===
    
    categoria = "MODERADO"
    probabilidade = 0.75
    recomendacoes = []
    
    # Exemplo de regra simulando o comportamento de uma Árvore de Decisão:
    if data.consumo_kwh > 350 or data.horas_alto_consumo > 7:
        categoria = "ALTO"
        probabilidade = 0.85
    elif data.consumo_kwh < 150:
        categoria = "EFICIENTE"
        probabilidade = 0.90
        
    # Geração de recomendações inteligentes baseadas nos dados de entrada
    if data.uso_horario_pico:
        recomendacoes.append("Reduzir o uso de equipamentos potentes durante os horários de pico (18h às 21h).")
        
    if data.distribuicao_consumo_diario.CLIMATIZACAO_WATTS > 3000:
        recomendacoes.append("Reduzir o uso de ar-condicionado ou ajustar a temperatura para 23°C.")
        
    if data.distribuicao_consumo_diario.AQUECIMENTO_WATTS > 5000:
        recomendacoes.append("Evitar banhos longos ou com o chuveiro elétrico na potência máxima.")
        
    if data.distribuicao_consumo_diario.ILUMINACAO_WATTS > 1000:
        recomendacoes.append("Substituir lâmpadas antigas por tecnologia LED de baixo consumo.")
        
    if not recomendacoes:
        recomendacoes.append("Mantenha o bom acompanhamento dos seus hábitos de consumo!")

    return PredictResponse(
        categoria=categoria,
        probabilidade=probabilidade,
        recomendacoes=recomendacoes
    )