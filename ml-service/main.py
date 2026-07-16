import os
import json
import time
import joblib
import pandas as pd
from datetime import datetime, timezone, date
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from groq import Groq

load_dotenv()

app = FastAPI(
    title="EnergiAI - API de Inteligência Artificial",
    description="API interna para análise e classificação de eficiência energética.",
    version="2.1.0"
)

# -------------------------------------------------------------
# CARREGAMENTO DO MODELO
# -------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELO_PATH = os.path.join(BASE_DIR, "modelo-categorizacao.joblib")
modelo = None

try:
    modelo = joblib.load(MODELO_PATH)
    print(f"[EnergiAI] Modelo carregado de {MODELO_PATH}")
except Exception as e:
    print(f"[EnergiAI] Aviso: modelo não encontrado ({e}) — usando fallback rule-based")

# -------------------------------------------------------------
# GROQ (fallback quando confiança < 80%)
# -------------------------------------------------------------

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
cliente_groq = None
if GROQ_API_KEY and GROQ_API_KEY.startswith("gsk_"):
    cliente_groq = Groq(api_key=GROQ_API_KEY)
    print("[EnergiAI] Cliente Groq configurado (fallback para confiança < 80%)")
else:
    print("[EnergiAI] Aviso: GROQ_API_KEY não definida ou inválida — fallback rule-based apenas")

GROQ_MODELO = "llama-3.3-70b-versatile"
TREINO_LOG = os.path.join(BASE_DIR, "treino_feedback.jsonl")

# Limites free tier Groq (llama-3.3-70b-versatile): 30 RPM / 1.000 RPD
# Usamos margem de segurança: 25 RPM / 900 RPD
GROQ_MAX_RPM = 25
GROQ_MAX_RPD = 900
_groq_call_times: list[float] = []
_groq_calls_today: int = 0
_groq_today: date = date.today()


def _groq_pode_chamar() -> bool:
    global _groq_calls_today, _groq_today
    hoje = date.today()
    if hoje != _groq_today:
        _groq_today = hoje
        _groq_calls_today = 0

    if _groq_calls_today >= GROQ_MAX_RPD:
        return False

    agora = time.time()
    global _groq_call_times
    _groq_call_times = [t for t in _groq_call_times if agora - t < 60]
    if len(_groq_call_times) >= GROQ_MAX_RPM:
        return False

    return True


def _groq_registrar_chamada():
    global _groq_calls_today
    _groq_call_times.append(time.time())
    _groq_calls_today += 1

# -------------------------------------------------------------
# DEFINIÇÃO DO CONTRATO
# -------------------------------------------------------------

CONSUMO_BASE_POR_TIPO = {
    "Casa": 250.0, "Apartamento": 150.0, "Comercial": 500.0,
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
    categoria_maior_consumo: str | None = "Outros"
    distribuicao_consumo_diario: DistribuicaoConsumo | None = None

class PredictResponse(BaseModel):
    categoria: str
    probabilidade: float
    recomendacoes: list[str]
    origem: str = ""

class StatusResponse(BaseModel):
    groq_disponivel: bool
    groq_chamadas_hoje: int
    groq_limite_diario: int
    groq_chamadas_minuto: int
    groq_limite_minuto: int
    modelo_carregado: bool

# -------------------------------------------------------------
# LÓGICA DE CLASSIFICAÇÃO (RULE-BASED)
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
# GROQ — GERAÇÃO DE RECOMENDAÇÕES VIA LLM
# -------------------------------------------------------------

def _gerar_recomendacoes_groq(data: PredictRequest, categoria: str) -> list[str]:
    prompt = f"""Com base nos dados abaixo, gere exatamente 3 recomendações curtas, práticas
e realmente úteis para melhorar a eficiência energética do imóvel.

REGRAS OBRIGATÓRIAS:
- Envolva EXCLUSIVAMENTE: hábitos de uso de equipamentos elétricos, horários de consumo, ou
  manutenção/substituição de aparelhos elétricos. Nada de água, gás ou outros recursos.
- Baseie-se APENAS nos dados fornecidos. Não invente equipamentos ou hábitos não informados.
- Se o tipo de imóvel for "Apartamento", não sugira painéis solares ou soluções que dependam
  de telhado/espaço externo próprio.
- Cada recomendação deve abordar um aspecto diferente, sem repetir o mesmo tipo de dica.
- Não cite marcas, modelos ou preços. Não use termos técnicos sem explicação simples.
- Máximo 20 palavras por recomendação. Sem emojis, markdown ou numeração.
- Tom: {categoria} — se for Ruim ou Crítico, seja direto sobre a necessidade de mudança.
  Se for Excelente ou Bom, reforce boas práticas já adotadas.

Dados do imóvel:
- Consumo mensal: {data.consumo_kwh} kWh
- Uso em horário de pico: {"Sim" if data.uso_horario_pico else "Não"}
- Quantidade de equipamentos: {data.quantidade_equipamentos}
- Tipo de imóvel: {data.tipo_imovel}
- Horas de alto consumo por dia: {data.horas_alto_consumo}
- Categoria de eficiência: {categoria}

Responda APENAS com as 3 recomendações, uma por linha, sem numeração,
sem introdução e sem comentários adicionais."""

    resposta = cliente_groq.chat.completions.create(
        model=GROQ_MODELO,
        messages=[
            {"role": "system", "content": "Você é um assistente especializado em eficiência energética residencial e comercial. Responda sempre em português do Brasil, de forma objetiva e sem rodeios."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=150,
        temperature=0,
    )

    texto = (resposta.choices[0].message.content or "").strip()
    import re
    recomendacoes = [
        re.sub(r"^\s*[\d]+[\.\)]?\s*", "", linha).strip("-•* ").strip()
        for linha in texto.split("\n")
        if linha.strip()
    ]
    return [r for r in recomendacoes[:3] if r]

# -------------------------------------------------------------
# ARMAZENAMENTO PARA RETREINAMENTO (feedback loop)
# -------------------------------------------------------------

def _armazenar_para_treino(data: PredictRequest, categoria: str, probabilidade: float,
                           recomendacoes: list[str], origem: str):
    dc = data.distribuicao_consumo_diario or DistribuicaoConsumo()
    registro = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "features": {
            "consumo_kwh": data.consumo_kwh,
            "uso_horario_pico": data.uso_horario_pico,
            "quantidade_equipamentos": data.quantidade_equipamentos,
            "tipo_imovel": data.tipo_imovel,
            "horas_alto_consumo": data.horas_alto_consumo,
            "categoria_maior_consumo": data.categoria_maior_consumo or "Outros",
            "refrig_watts": dc.REFRIGERACAO_WATTS,
            "aquecimento_watts": dc.AQUECIMENTO_WATTS,
            "climatizacao_watts": dc.CLIMATIZACAO_WATTS,
            "iluminacao_watts": dc.ILUMINACAO_WATTS,
        },
        "predicao": {
            "categoria": categoria,
            "probabilidade": probabilidade,
        },
        "recomendacoes_geradas": recomendacoes,
        "origem": origem,
    }
    try:
        with open(TREINO_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(registro, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"[EnergiAI] Erro ao armazenar feedback: {e}")

# -------------------------------------------------------------
# ENDPOINT DE PREDIÇÃO
# -------------------------------------------------------------

@app.post("/predict", response_model=PredictResponse)
def predict_consumo(data: PredictRequest):
    categoria = ""
    probabilidade = 0.0
    origem = ""
    recomendacoes = []

    # --- Classificação ---
    if modelo is not None:
        try:
            dc = data.distribuicao_consumo_diario or DistribuicaoConsumo()
            df = pd.DataFrame([{
                "consumo_kwh": data.consumo_kwh,
                "uso_horario_pico": int(data.uso_horario_pico),
                "quantidade_equipamentos": data.quantidade_equipamentos,
                "tipo_imovel": data.tipo_imovel,
                "horas_alto_consumo": data.horas_alto_consumo,
                "categoria_maior_consumo": data.categoria_maior_consumo or "Outros",
                "refrig_watts": dc.REFRIGERACAO_WATTS,
                "aquecimento_watts": dc.AQUECIMENTO_WATTS,
                "climatizacao_watts": dc.CLIMATIZACAO_WATTS,
                "iluminacao_watts": dc.ILUMINACAO_WATTS,
            }])
            pred = modelo.predict(df)[0]
            probs = modelo.predict_proba(df)[0]
            max_prob = float(max(probs))
            categoria = pred.upper()
            probabilidade = round(max_prob, 4)

            if max_prob >= 0.80:
                origem = "modelo"
            elif cliente_groq and _groq_pode_chamar():
                origem = f"modelo+groq (confiança {max_prob:.1%})"
            else:
                origem = f"modelo (confiança {max_prob:.1%})"
        except Exception as e:
            print(f"[EnergiAI] Erro na predição: {e}")
            categoria, probabilidade = _classificar_rule_based(data)
            origem = "rule-based (modelo com erro)"
    else:
        categoria, probabilidade = _classificar_rule_based(data)
        origem = "rule-based (modelo não disponível)"

    # --- Recomendações ---
    if cliente_groq and "groq" in origem:
        _groq_registrar_chamada()
        try:
            recomendacoes = _gerar_recomendacoes_groq(data, categoria)
            if not recomendacoes:
                raise ValueError("Groq retornou recomendações vazias")
        except Exception as e:
            print(f"[EnergiAI] Erro ao chamar Groq: {e} — usando fallback rule-based")
            recomendacoes = _gerar_recomendacoes(data, categoria)
            origem = origem.replace("groq", "rule-based (groq falhou)")
    else:
        recomendacoes = _gerar_recomendacoes(data, categoria)

    _armazenar_para_treino(data, categoria, probabilidade, recomendacoes, origem)

    return PredictResponse(
        categoria=categoria,
        probabilidade=probabilidade,
        recomendacoes=recomendacoes,
        origem=origem,
    )


@app.get("/status")
def status():
    agora = time.time()
    chamadas_minuto = sum(1 for t in _groq_call_times if agora - t < 60)
    return StatusResponse(
        groq_disponivel=cliente_groq is not None,
        groq_chamadas_hoje=_groq_calls_today,
        groq_limite_diario=GROQ_MAX_RPD,
        groq_chamadas_minuto=chamadas_minuto,
        groq_limite_minuto=GROQ_MAX_RPM,
        modelo_carregado=modelo is not None,
    )
