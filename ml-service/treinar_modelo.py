"""
Script de treinamento do modelo de classificacao energetica.

Gera dados sinteticos + carrega dados rotulados dos CSVs + feedback real
para retreino ciclico. A cada execucao o modelo incorpora:
  - base-energetica-rotulada.csv (1000 registros reais)
  - treino_feedback.jsonl (predicoes reais acumuladas)
  - dados sinteticos (para balanceamento)

Uso:
    python3 treinar_modelo.py
"""

import warnings
warnings.filterwarnings("ignore")

import random
import json
import os
import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, FunctionTransformer
from sklearn.calibration import CalibratedClassifierCV

from features import engenharia_features, CATEGORIAS_MAIOR_CONSUMO, normalizar_categoria

def normalizar_categoria_label(cat):
    if not isinstance(cat, str):
        return "Mediano"
    cat_lower = cat.strip().lower()
    mapping = {
        "excelente": "Excelente",
        "bom": "Bom",
        "mediano": "Mediano",
        "ruim": "Ruim",
        "critico": "Critico",
        "crítico": "Critico"
    }
    return mapping.get(cat_lower, "Mediano")

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
FEEDBACK_PATH = os.path.join(BASE_DIR, "treino_feedback.jsonl")
MODELO_PATH = os.path.join(BASE_DIR, "modelo-categorizacao.joblib")

CSV_ROTULADO = os.path.join(DATA_DIR, "base-energetica-rotulada.csv")

CATEGORIAS = ["Excelente", "Bom", "Mediano", "Ruim", "Critico"]
MAP_CATEGORIA_UPPER = {c.upper(): c for c in CATEGORIAS}

TIPOS_IMOVEL = ["Casa", "Apartamento", "Comercial", "Industria", "Rural", "Outro"]

CONSUMO_BASE_POR_TIPO = {
    "Casa": 250, "Apartamento": 150, "Comercial": 500,
    "Industria": 800, "Rural": 300, "Outro": 250,
}

N_SINTETICOS = 4000
PESO_FEEDBACK = 5

COLUNAS_NUMERICAS_BASE = [
    "consumo_kwh", "quantidade_equipamentos", "horas_alto_consumo",
    "refrig_watts", "aquecimento_watts", "climatizacao_watts", "iluminacao_watts",
]
COLUNAS_BOOLEANAS = ["uso_horario_pico"]
COLUNAS_CATEGORICAS = ["tipo_imovel", "categoria_maior_consumo"]
COLUNAS_ENGENHEIRADAS = [
    "consumo_por_equipamento", "consumo_por_hora",
    "consumo_relativo_normalizado", "carga_estimada",
    "total_watts", "pct_refrig", "pct_aquecimento",
    "pct_climatizacao", "pct_iluminacao",
]
COLUNAS_NUMERICAS_TOTAIS = COLUNAS_NUMERICAS_BASE + COLUNAS_BOOLEANAS + COLUNAS_ENGENHEIRADAS

COLUNAS_FEATURES = (
    COLUNAS_NUMERICAS_BASE + COLUNAS_CATEGORICAS + COLUNAS_BOOLEANAS
)


def gerar_registro(id_cliente):
    tipo_imovel = random.choice(TIPOS_IMOVEL)
    quantidade_equipamentos = random.randint(1, 25)
    horas_alto_consumo = round(random.uniform(0, 12), 1)
    uso_horario_pico = random.random() < 0.5

    base_por_tipo = CONSUMO_BASE_POR_TIPO[tipo_imovel]

    consumo_kwh = (
        base_por_tipo
        + quantidade_equipamentos * random.uniform(8, 15)
        + horas_alto_consumo * random.uniform(10, 20)
        + (50 if uso_horario_pico else 0)
        + random.gauss(0, 30)
    )
    consumo_kwh = max(20, round(consumo_kwh, 1))

    cat_maior = random.choice(CATEGORIAS_MAIOR_CONSUMO)

    refrig = round(random.uniform(0, 3000), 1)
    aqueci = round(random.uniform(0, 8000), 1)
    climat = round(random.uniform(0, 5000), 1)
    ilumin = round(random.uniform(0, 2000), 1)

    return {
        "consumo_kwh": consumo_kwh,
        "uso_horario_pico": uso_horario_pico,
        "quantidade_equipamentos": quantidade_equipamentos,
        "tipo_imovel": tipo_imovel,
        "horas_alto_consumo": horas_alto_consumo,
        "categoria_maior_consumo": cat_maior,
        "refrig_watts": refrig,
        "aquecimento_watts": aqueci,
        "climatizacao_watts": climat,
        "iluminacao_watts": ilumin,
    }


def calcular_indice_ineficiencia(df):
    consumo_relativo = df["consumo_kwh"] / df["tipo_imovel"].map(CONSUMO_BASE_POR_TIPO)
    consumo_norm = (consumo_relativo / consumo_relativo.max()).clip(0, 1)
    equip_norm = (df["quantidade_equipamentos"] / df["quantidade_equipamentos"].max()).clip(0, 1)
    horas_norm = (df["horas_alto_consumo"] / df["horas_alto_consumo"].max()).clip(0, 1)
    pico_norm = df["uso_horario_pico"].astype(int)
    return 0.40 * consumo_norm + 0.25 * pico_norm + 0.20 * equip_norm + 0.15 * horas_norm


def carregar_csv_rotulado(caminho):
    if not os.path.exists(caminho):
        print("  Arquivo nao encontrado.")
        return pd.DataFrame()
    df = pd.read_csv(caminho)
    df["uso_horario_pico"] = df["uso_horario_pico"].astype(int)
    if "categoria" in df.columns:
        df["categoria"] = df["categoria"].apply(normalizar_categoria_label)
    if "categoria_maior_consumo" in df.columns:
        df["categoria_maior_consumo"] = df["categoria_maior_consumo"].apply(normalizar_categoria)
    cols_extra = ["refrig_watts", "aquecimento_watts", "climatizacao_watts", "iluminacao_watts"]
    for col in cols_extra:
        if col not in df.columns:
            df[col] = 0.0
    return df[COLUNAS_FEATURES + ["categoria"]]


def carregar_feedback(caminho):
    if not os.path.exists(caminho):
        print("  Nenhum arquivo de feedback encontrado.")
        return pd.DataFrame()

    registros = []
    with open(caminho, "r", encoding="utf-8") as f:
        for linha in f:
            linha = linha.strip()
            if not linha:
                continue
            try:
                entrada = json.loads(linha)
                feats = entrada.get("features", {})
                cat_raw = entrada.get("predicao", {}).get("categoria", "")
                registros.append({
                    "consumo_kwh": feats.get("consumo_kwh", 0),
                    "uso_horario_pico": feats.get("uso_horario_pico", False),
                    "quantidade_equipamentos": feats.get("quantidade_equipamentos", 0),
                    "tipo_imovel": feats.get("tipo_imovel", "Casa"),
                    "horas_alto_consumo": feats.get("horas_alto_consumo", 0),
                    "categoria_maior_consumo": normalizar_categoria(feats.get("categoria_maior_consumo", "Outros")),
                    "refrig_watts": feats.get("refrig_watts", 0.0),
                    "aquecimento_watts": feats.get("aquecimento_watts", 0.0),
                    "climatizacao_watts": feats.get("climatizacao_watts", 0.0),
                    "iluminacao_watts": feats.get("iluminacao_watts", 0.0),
                    "categoria": normalizar_categoria_label(cat_raw),
                })
            except (json.JSONDecodeError, KeyError):
                continue

    return pd.DataFrame(registros)


def gerar_sinteticos(n, seed_offset=0):
    regs = [gerar_registro(i + seed_offset) for i in range(n)]
    df = pd.DataFrame(regs)
    df["uso_horario_pico"] = df["uso_horario_pico"].astype(int)
    indice = calcular_indice_ineficiencia(df)
    df["categoria"] = pd.qcut(indice, q=5, labels=CATEGORIAS)
    return df[COLUNAS_FEATURES + ["categoria"]]


feature_eng = FunctionTransformer(engenharia_features, validate=False)

COLUNAS_CATEGORIA_MAIOR_CAT = [c.replace(" ", "").replace("ã", "a").replace("ç", "c")
                                for c in CATEGORIAS_MAIOR_CONSUMO]
pre_processador = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), COLUNAS_NUMERICAS_TOTAIS),
        ("cat", OneHotEncoder(
            handle_unknown="ignore",
            categories=[TIPOS_IMOVEL, CATEGORIAS_MAIOR_CONSUMO],
        ), COLUNAS_CATEGORICAS),
    ],
    verbose_feature_names_out=False,
)

# =========================================================================
# CARGA DOS DADOS
# =========================================================================

print("=" * 60)
print("CARGA DE DADOS")
print("=" * 60)

print("Carregando dados rotulados dos CSVs...")
df_csv = carregar_csv_rotulado(CSV_ROTULADO)
if len(df_csv) > 0:
    print(f"  {len(df_csv)} registros carregados de base-energetica-rotulada.csv")
    print(f"  Distribuicao categorias (CSV):")
    for cat, qtd in df_csv["categoria"].value_counts().items():
        print(f"    {cat}: {qtd}")
print()

print("Gerando dados sinteticos...")
df_sint = gerar_sinteticos(N_SINTETICOS)
print(f"  {len(df_sint)} registros sinteticos gerados")
print()

print("Carregando feedback de predicoes reais...")
df_fb = carregar_feedback(FEEDBACK_PATH)
partes = [df_sint]

if len(df_csv) > 0:
    partes.append(df_csv)

if len(df_fb) > 0:
    print(f"  {len(df_fb)} registros de feedback carregados")
    for cat, qtd in df_fb["categoria"].value_counts().items():
        print(f"    {cat}: {qtd}")
    df_fb["uso_horario_pico"] = df_fb["uso_horario_pico"].astype(int)
    df_fb_repetido = pd.concat([df_fb] * PESO_FEEDBACK, ignore_index=True)
    print(f"  Apos repeticao (peso x{PESO_FEEDBACK}): {len(df_fb_repetido)} registros")
    partes.append(df_fb_repetido)

df_full = pd.concat(partes, ignore_index=True)
print(f"\nTotal combinado: {len(df_full)} registros")
print(f"Distribuicao por tipo de imovel:")
print(df_full["tipo_imovel"].value_counts().to_string())
print(f"Distribuicao categoria maior consumo:")
print(df_full["categoria_maior_consumo"].value_counts().to_string())
print()

# =========================================================================
# TREINO
# =========================================================================

X_raw = df_full[COLUNAS_FEATURES]
y = df_full["categoria"]

X_treino, X_teste, y_treino, y_teste = train_test_split(
    X_raw, y, test_size=0.2, random_state=SEED, stratify=y
)

print(f"Treino: {len(X_treino)} | Teste: {len(X_teste)}")

pipeline_tune = Pipeline([
    ("features", feature_eng),
    ("pre", pre_processador),
    ("modelo", RandomForestClassifier(random_state=SEED)),
])

param_dist = {
    "modelo__n_estimators": [200, 300, 400],
    "modelo__max_depth": [None, 30],
    "modelo__min_samples_split": [2, 5],
    "modelo__min_samples_leaf": [1, 2],
    "modelo__max_features": ["sqrt", None],
    "modelo__class_weight": [None, "balanced"],
}

print()
print("=" * 60)
print("HYPERPARAMETER TUNING (RandomizedSearchCV)")
print("=" * 60)

random_search = RandomizedSearchCV(
    pipeline_tune, param_distributions=param_dist, n_iter=15,
    cv=3, scoring="accuracy", n_jobs=-1, random_state=SEED, verbose=1,
)
random_search.fit(X_treino, y_treino)

print(f"\nMelhores parametros:")
for param, valor in random_search.best_params_.items():
    print(f"  {param}: {valor}")
print(f"Melhor acuracia (CV): {random_search.best_score_:.4f}")
print()

print("=" * 60)
print("PROBABILITY CALIBRATION (CalibratedClassifierCV)")
print("=" * 60)

pipeline_calibrado = Pipeline([
    ("features", feature_eng),
    ("pre", pre_processador),
    ("modelo", CalibratedClassifierCV(
        RandomForestClassifier(**{
            k.replace("modelo__", ""): v
            for k, v in random_search.best_params_.items()
        }, random_state=SEED),
        cv=3, method="isotonic",
    )),
])
pipeline_calibrado.fit(X_treino, y_treino)
print("Modelo calibrado treinado com isotonic regression.")

# =========================================================================
# AVALIACAO
# =========================================================================

y_pred = pipeline_calibrado.predict(X_teste)
y_proba = pipeline_calibrado.predict_proba(X_teste)

acuracia = accuracy_score(y_teste, y_pred)
print(f"\nAcurácia no teste: {acuracia:.4f}")
print(f"\nRelatorio de classificacao:")
print(classification_report(y_teste, y_pred, zero_division=0))

confiancas = y_proba.max(axis=1)
print(f"\nDistribuicao das confiancas:")
print(f"  Media: {confiancas.mean():.3f}")
print(f"  Mediana: {np.median(confiancas):.3f}")
print(f"  Min: {confiancas.min():.3f}")
print(f"  Max: {confiancas.max():.3f}")
pct_acima_80 = (confiancas >= 0.80).mean()
pct_acima_90 = (confiancas >= 0.90).mean()
print(f"  % acima de 80%: {pct_acima_80:.1%}")
print(f"  % acima de 90%: {pct_acima_90:.1%}")

# =========================================================================
# SALVAR
# =========================================================================

joblib.dump(pipeline_calibrado, MODELO_PATH)
print(f"\nModelo salvo em '{MODELO_PATH}'")
print(f"Tamanho: {os.path.getsize(MODELO_PATH) / 1024 / 1024:.1f} MB")

print()
print("=" * 60)
print("TESTE COM TODOS OS TIPOS DE IMOVEL")
print("=" * 60)
for tipo in TIPOS_IMOVEL:
    teste = pd.DataFrame([{
        "consumo_kwh": 400.0, "uso_horario_pico": False,
        "quantidade_equipamentos": 10, "tipo_imovel": tipo,
        "horas_alto_consumo": 5.0, "categoria_maior_consumo": "Refrigeracao",
        "refrig_watts": 1500.0, "aquecimento_watts": 0.0,
        "climatizacao_watts": 0.0, "iluminacao_watts": 0.0,
    }])
    pred = pipeline_calibrado.predict(teste)[0]
    proba = pipeline_calibrado.predict_proba(teste).max()
    print(f"  {tipo:14s} -> {pred:10s} (confianca: {proba:.1%})")

print()
print(f"Dica: para o proximo ciclo, execute este script novamente —")
print(f"os dados em 'data/' e 'treino_feedback.jsonl' serao incorporados automaticamente.")
