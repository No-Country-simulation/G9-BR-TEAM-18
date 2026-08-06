import json
import os
import re
import time
import traceback
from datetime import UTC, date, datetime

import joblib
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI
from groq import Groq
from pydantic import BaseModel
from features import normalize_property_type, translate_category

load_dotenv()

app = FastAPI(
    title="EnergiAI - API de Inteligência Artificial",
    description="API interna para análise e classificação de eficiência energética.",
    version="2.1.0",
)

# -------------------------------------------------------------
# MODEL LOADING
# -------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "categorization-model.joblib")

print("[EnergiAI] Startup debug:")
print(f"[EnergiAI]   BASE_DIR = {BASE_DIR}")
print(f"[EnergiAI]   MODEL_PATH = {MODEL_PATH}")
print(f"[EnergiAI]   CWD = {os.getcwd()}")
print(f"[EnergiAI]   Files in /app: {os.listdir('/app') if os.path.isdir('/app') else 'N/A'}")
print(f"[EnergiAI]   Model file exists: {os.path.exists(MODEL_PATH)}")

model = None

try:
    model = joblib.load(MODEL_PATH)
    print(f"[EnergiAI] Model loaded successfully from {MODEL_PATH}")
except FileNotFoundError:
    print(f"[EnergiAI] ERROR: Model file not found at {MODEL_PATH}")
    print(f"[EnergiAI]   Files in BASE_DIR: {os.listdir(BASE_DIR)}")
except Exception as e:
    print(f"[EnergiAI] ERROR: Failed to load model: {e}")
    print(f"[EnergiAI]   Traceback: {traceback.format_exc()}")

# -------------------------------------------------------------
# VALID EFFICIENCY CATEGORIES
# -------------------------------------------------------------

VALID_CATEGORIES = ["EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"]

# -------------------------------------------------------------
# GROQ (fallback when confidence < 80%)
# -------------------------------------------------------------

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
groq_client = None
if GROQ_API_KEY and GROQ_API_KEY.startswith("gsk_"):
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("[EnergiAI] Groq client configured (fallback for confidence < 80%)")
else:
    print("[EnergiAI] Warning: GROQ_API_KEY not set or invalid — fallback rule-based only")

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
training_log_path = os.getenv("TRAINING_LOG_PATH", "treino_feedback.jsonl")
TRAINING_LOG = os.path.join(BASE_DIR, training_log_path)

# Groq free tier limits (llama-3.3-70b-versatile): 30 RPM / 1,000 RPD
# We use a safety margin: 25 RPM / 900 RPD
GROQ_MAX_RPM = int(os.getenv("GROQ_MAX_RPM", "25"))
GROQ_MAX_RPD = int(os.getenv("GROQ_MAX_RPD", "900"))
_groq_call_times: list[float] = []
_groq_calls_today: int = 0
_groq_today: date = date.today()


def _groq_can_call() -> bool:
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


def _groq_register_call() -> None:
    global _groq_calls_today
    _groq_call_times.append(time.time())
    _groq_calls_today += 1


# -------------------------------------------------------------
# CONTRACT DEFINITION
# -------------------------------------------------------------

BASE_CONSUMPTION_BY_TYPE = {
    "RESIDENCIAL": 250.0,
    "APARTAMENTO": 150.0,
    "COMERCIAL": 500.0,
}


class ConsumptionDistribution(BaseModel):
    REFRIGERATION_WATTS: float = 0.0
    HEATING_WATTS: float = 0.0
    AIR_CONDITIONING_WATTS: float = 0.0
    LIGHTING_WATTS: float = 0.0


class PredictRequest(BaseModel):
    consumption_kwh: float
    peak_hour_usage: bool
    equipment_quantity: int
    property_type: str
    high_consumption_hours: float
    highest_consumption_category: str | None = "Outros"
    highest_consumption_products: list[str] | None = None
    daily_consumption_distribution: ConsumptionDistribution | None = None


class PredictResponse(BaseModel):
    category: str
    probability: float
    recommendations: list[str]
    source: str = ""


class StatusResponse(BaseModel):
    groq_available: bool
    groq_calls_today: int
    groq_daily_limit: int
    groq_calls_per_minute: int
    groq_minute_limit: int
    model_loaded: bool


# -------------------------------------------------------------
# CLASSIFICATION LOGIC (RULE-BASED)
# -------------------------------------------------------------


def _classify_rule_based(data: PredictRequest) -> tuple[str, float]:
    base = BASE_CONSUMPTION_BY_TYPE.get(data.property_type, 250.0)
    consumption_relative = data.consumption_kwh / base
    consumption_norm = min(consumption_relative / 3.0, 1.0)
    equip_norm = min(data.equipment_quantity / 25.0, 1.0)
    hours_norm = min(data.high_consumption_hours / 12.0, 1.0)
    pico_norm = 1.0 if data.peak_hour_usage else 0.0

    indice = 0.40 * consumption_norm + 0.25 * pico_norm + 0.20 * equip_norm + 0.15 * hours_norm

    if indice < 0.2:
        return "EXCELENTE", 0.92
    if indice < 0.4:
        return "BOM", 0.85
    if indice < 0.6:
        return "MEDIANO", 0.78
    if indice < 0.8:
        return "RUIM", 0.82
    return "CRITICO", 0.90

CATEGORY_RECOMMENDATIONS = {
    "Refrigeracao": (
        "Verifique a vedação da geladeira e evite deixá-la encostada em paredes "
        "ou perto de fontes de calor, isso força o motor a trabalhar mais."
    ),
    "Climatizacao": (
        "Ajuste o ar-condicionado para 23°C e evite deixar portas ou janelas "
        "abertas enquanto ele estiver ligado."
    ),
    "Tecnologia": (
        "Desligue TVs, computadores e videogames da tomada quando ficarem "
        "muito tempo sem uso, o consumo em standby soma ao longo do mês."
    ),
    "Iluminacao": (
        "Troque lâmpadas antigas por modelos LED, que entregam a mesma "
        "iluminação consumindo bem menos energia."
    ),
    "Eletrodomesticos": (
        "Prefira banhos mais curtos no chuveiro elétrico e use o micro-ondas "
        "ou a air fryer no lugar do forno tradicional sempre que possível."
    ),
    "Servicos": (
        "Revise bombas d'água, portões elétricos e outros equipamentos de uso "
        "ocasional, é comum ficarem ligados sem necessidade."
    ),
}


def _generate_recommendations(data: PredictRequest, category: str) -> list[str]:
    recs = []

    if data.peak_hour_usage:
        recs.append(
            "Evite usar equipamentos de maior potência entre 18h e 21h, "
            "esse é o horário de pico e costuma pesar mais na conta."
        )

    highest_category_pt = translate_category(data.highest_consumption_category or "Outros")
    category_rec = CATEGORY_RECOMMENDATIONS.get(highest_category_pt)
    if category_rec:
        recs.append(category_rec)

    if category in ("RUIM", "CRITICO"):
        recs.append(
            "Considere substituir os equipamentos mais antigos por modelos "
            "com melhor selo de eficiência energética."
        )

    if data.equipment_quantity > 10:
        recs.append(
            "Com tantos equipamentos no imóvel, vale revisar quais realmente "
            "precisam ficar ligados ao mesmo tempo."
        )

    if data.high_consumption_hours > 5:
        recs.append(
            "Tente distribuir o uso dos equipamentos ao longo do dia, em vez "
            "de concentrar tudo num único período de alto consumo."
        )

    if data.daily_consumption_distribution:
        dc = data.daily_consumption_distribution
        if dc.AIR_CONDITIONING_WATTS > 3000:
            recs.append("Reduzir o uso de ar-condicionado ou ajustar a temperatura para 23°C.")
        if dc.HEATING_WATTS > 5000:
            recs.append("Evitar banhos longos ou com o chuveiro elétrico na potência máxima.")
        if dc.LIGHTING_WATTS > 1000:
            recs.append("Substituir lâmpadas antigas por tecnologia LED de baixo consumo.")

    if category == "EXCELENTE":
        recs.append("Continue mantendo essas boas práticas, seu consumo está bem equilibrado!")
    elif not recs:
        recs.append("Continue acompanhando seus hábitos de consumo de perto.")

    return recs


# -------------------------------------------------------------
# GROQ — RECOMMENDATION GENERATION VIA LLM
# -------------------------------------------------------------


def _generate_recommendations_groq(data: PredictRequest, category: str) -> list[str]:
    property_type_pt = normalize_property_type(data.property_type)
    highest_category_pt = translate_category(data.highest_consumption_category or "Outros")
    produtos_texto = (
        ", ".join(data.highest_consumption_products[:3])
        if data.highest_consumption_products
        else None
    )

    category_rule = ""
    if highest_category_pt != "Outros":
        category_rule = (
            f"- Pelo menos uma recomendação deve abordar especificamente a categoria de maior "
            f"consumo do imóvel ({highest_category_pt})"
        )
        if produtos_texto:
            category_rule += f", citando ao menos um destes equipamentos: {produtos_texto}"
        category_rule += ".\n"

    prompt = f"""Com base nos dados abaixo, gere exatamente 3 recomendações curtas, práticas\
 e realmente úteis para melhorar a eficiência energética do imóvel.

REGRAS OBRIGATÓRIAS:
- Envolva EXCLUSIVAMENTE: hábitos de uso de equipamentos elétricos, horários de consumo, ou
  manutenção/substituição de aparelhos elétricos. Nada de água, gás ou outros recursos.
- Baseie-se APENAS nos dados fornecidos. Não invente equipamentos ou hábitos não informados.
- Se o tipo de imóvel for "Apartamento", não sugira painéis solares ou soluções que dependam
  de telhado/espaço externo próprio.
{category_rule}- Cada recomendação deve abordar um aspecto diferente, sem repetir o mesmo tipo de dica.
- Não cite marcas, modelos ou preços. Não use termos técnicos sem explicação simples.
- Máximo 20 palavras por recomendação. Sem emojis, markdown ou numeração.
- Tom: {category} — se for Ruim ou Crítico, seja direto sobre a necessidade de mudança.
  Se for Excelente ou Bom, reforce boas práticas já adotadas.

Dados do imóvel:
- Consumo mensal: {data.consumption_kwh} kWh
- Uso em horário de pico: {"Sim" if data.peak_hour_usage else "Não"}
- Quantidade de equipamentos: {data.equipment_quantity}
- Tipo de imóvel: {property_type_pt}
- Horas de alto consumo por dia: {data.high_consumption_hours}
- Categoria de maior consumo: {highest_category_pt}
- Equipamentos de maior consumo: {produtos_texto or "não informado"}
- Categoria de eficiência: {category}

Responda APENAS com as 3 recomendações, uma por linha, sem numeração,
sem introdução e sem comentários adicionais."""

    assert groq_client is not None
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "Você é um assistente especializado em eficiência energética "
                    "residencial e comercial. Responda sempre em português do Brasil, "
                    "de forma objetiva e sem rodeios."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=150,
        temperature=0.3
    )

    text = (response.choices[0].message.content or "").strip()
    recommendations = [
        re.sub(r"^\s*[\d]+[\.\)]?\s*", "", linha.strip("-•* ").strip())
        for linha in text.split("\n")
        if linha.strip()
    ]
    return [r for r in recommendations[:3] if r]

def _run_prediction(data: "PredictRequest") -> dict:
    """Executa a lógica de predição e retorna um dicionário com category, probability, recommendations, source."""
    category = ""
    probability = 0.0
    source = ""
    recommendations = []

    if model is not None:
        try:
            dc = data.daily_consumption_distribution or ConsumptionDistribution()
            df = pd.DataFrame(
                [
                    {
                        "consumption_kwh": data.consumption_kwh,
                        "peak_hour_usage": int(data.peak_hour_usage),
                        "equipment_quantity": data.equipment_quantity,
                        "property_type": normalize_property_type(data.property_type),
                        "high_consumption_hours": data.high_consumption_hours,
                        "highest_consumption_category": translate_category(
                            data.highest_consumption_category or "Outros"
                        ),
                        "refrigeration_watts": dc.REFRIGERATION_WATTS,
                        "heating_watts": dc.HEATING_WATTS,
                        "air_conditioning_watts": dc.AIR_CONDITIONING_WATTS,
                        "lighting_watts": dc.LIGHTING_WATTS,
                    }
                ]
            )
            pred = model.predict(df)[0]
            probs = model.predict_proba(df)[0]
            max_prob = float(max(probs))
            category = pred.upper()
            probability = round(max_prob, 4)

            if max_prob >= 0.80:
                source = "model"
            elif groq_client and _groq_can_call():
                source = f"model+groq (confidence {max_prob:.1%})"
            else:
                source = f"model (confidence {max_prob:.1%})"
        except Exception as e:
            print(f"[EnergiAI] Prediction error: {e}")
            category, probability = _classify_rule_based(data)
            source = "rule-based (model error)"
    else:
        category, probability = _classify_rule_based(data)
        source = "rule-based (model unavailable)"

    if groq_client and "groq" in source:
        _groq_register_call()
        try:
            recommendations = _generate_recommendations_groq(data, category)
            if not recommendations:
                raise ValueError("Groq returned empty recommendations")
        except Exception as e:
            print(f"[EnergiAI] Error calling Groq: {e} — using rule-based fallback")
            recommendations = _generate_recommendations(data, category)
            source = source.replace("groq", "rule-based (groq failed)")
    else:
        recommendations = _generate_recommendations(data, category)

    return {"category": category, "probability": probability, "recommendations": recommendations, "source": source}


# -------------------------------------------------------------
# STORAGE FOR RETRAINING (feedback loop)
# -------------------------------------------------------------


def _store_for_training(
    data: PredictRequest,
    category: str,
    probability: float,
    recommendations: list[str],
    source: str,
) -> None:
    dc = data.daily_consumption_distribution or ConsumptionDistribution()
    record = {
        "timestamp": datetime.now(UTC).isoformat(),
        "features": {
            "consumption_kwh": data.consumption_kwh,
            "peak_hour_usage": data.peak_hour_usage,
            "equipment_quantity": data.equipment_quantity,
            "property_type": normalize_property_type(data.property_type),
            "high_consumption_hours": data.high_consumption_hours,
            "highest_consumption_category": translate_category(
                data.highest_consumption_category or "Outros"
            ),
            "refrigeration_watts": dc.REFRIGERATION_WATTS,
            "heating_watts": dc.HEATING_WATTS,
            "air_conditioning_watts": dc.AIR_CONDITIONING_WATTS,
            "lighting_watts": dc.LIGHTING_WATTS,
        },
        "prediction": {
            "category": category,
            "probability": probability,
        },
        "generated_recommendations": recommendations,
        "source": source,
    }
    try:
        with open(TRAINING_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"[EnergiAI] Error storing feedback: {e}")


# -------------------------------------------------------------
# PREDICTION ENDPOINT
# -------------------------------------------------------------


@app.post("/predict", response_model=PredictResponse)
def predict_consumption(data: PredictRequest) -> PredictResponse:
    result = _run_prediction(data)
    _store_for_training(data, result["category"], result["probability"], result["recommendations"], result["source"])
    return PredictResponse(
        category=result["category"],
        probability=result["probability"],
        recommendations=result["recommendations"],
        source=result["source"],
    )


@app.post("/predict/simulate", response_model=PredictResponse)
def predict_simulate(data: PredictRequest) -> PredictResponse:
    """Simula uma predição sem armazenar no log de treinamento."""
    result = _run_prediction(data)
    return PredictResponse(
        category=result["category"],
        probability=result["probability"],
        recommendations=result["recommendations"],
        source=result["source"],
    )


@app.get("/predict-schema")
def predict_schema() -> dict:
    """Retorna o schema JSON do PredictRequest para descoberta dinâmica pelo backend."""
    return PredictRequest.model_json_schema()

@app.get("/contract")
def contract() -> dict:
    """Retorna o contrato completo do ML Service para descoberta dinâmica."""
    return {
        "version": "3.0.0",
        "property_types": ["RESIDENCIAL", "APARTAMENTO", "COMERCIAL"],
        "efficiency_categories": VALID_CATEGORIES,
        "consumption_categories": [
            "REFRIGERATION", "CLIMATE_CONTROL", "TECHNOLOGY",
            "LIGHTING", "APPLIANCES", "SERVICES", "OTHERS",
        ],
        "request_schema": PredictRequest.model_json_schema(),
        "response_schema": PredictResponse.model_json_schema(),
    }


@app.get("/appliance-catalog")
def appliance_catalog() -> dict:
    """Retorna o catálogo de aparelhos que o modelo reconhece."""
    df_pph = pd.read_csv(os.path.join(BASE_DIR, "data", "pph-data-complete.csv"))
    catalog = []
    APPLIANCE_COLUMNS = {
        "qtd_geladeira":         {"name": "Geladeira",        "ml_category": "REFRIGERATION",  "watts": 150,  "hours": 24},
        "qtd_ar_condicionado":   {"name": "Ar-condicionado",  "ml_category": "CLIMATE_CONTROL", "watts": 1500, "hours": 8},
        "qtd_ventilador":        {"name": "Ventilador",       "ml_category": "CLIMATE_CONTROL", "watts": 100,  "hours": 8},
        "qtd_lampadas":          {"name": "Lampada",          "ml_category": "LIGHTING",        "watts": 12,   "hours": 6},
        "qtd_microondas":        {"name": "Micro-ondas",      "ml_category": "APPLIANCES",      "watts": 1200, "hours": 0.5},
        "qtd_air_fryer":         {"name": "Air fryer",        "ml_category": "APPLIANCES",      "watts": 1500, "hours": 0.75},
        "qtd_lavar_secar":       {"name": "Maquina de lavar", "ml_category": "APPLIANCES",      "watts": 500,  "hours": 1.5},
        "qtd_chuveiro_eletrico": {"name": "Chuveiro eletrico","ml_category": "APPLIANCES",      "watts": 5500, "hours": 0.5},
        "qtd_tv":                {"name": "Televisao",        "ml_category": "TECHNOLOGY",      "watts": 150,  "hours": 6},
        "qtd_computadores":      {"name": "Computador",       "ml_category": "TECHNOLOGY",      "watts": 150,  "hours": 8},
        "qtd_videogame":         {"name": "Videogame",        "ml_category": "TECHNOLOGY",      "watts": 200,  "hours": 4},
    }
    for col, info in APPLIANCE_COLUMNS.items():
        if col in df_pph.columns:
            catalog.append(info)
    return {"appliances": catalog}

@app.get("/categories")
def categories() -> dict:
    """Retorna a lista de categorias de eficiência energética válidas."""
    return {"categories": VALID_CATEGORIES}


@app.get("/status")
def status() -> StatusResponse:
    agora = time.time()
    calls_per_minute = sum(1 for t in _groq_call_times if agora - t < 60)
    return StatusResponse(
        groq_available=groq_client is not None,
        groq_calls_today=_groq_calls_today,
        groq_daily_limit=GROQ_MAX_RPD,
        groq_calls_per_minute=calls_per_minute,
        groq_minute_limit=GROQ_MAX_RPM,
        model_loaded=model is not None,
    )
