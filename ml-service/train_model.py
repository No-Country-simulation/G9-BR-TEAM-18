"""
Training script for the energy efficiency classification model.

Loads real data from PPH 2019 survey + labeled CSV + feedback loop,
with synthetic data for class balancing.

Data sources:
  - pph-data-complete.csv (27,827 real Brazilian household records)
  - labeled-energy-base.csv (1,000 labeled records)
  - treino_feedback.jsonl (accumulated live predictions)

Usage:
    python3 train_model.py
"""

import json
import os
import random
import warnings

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler

from features import HIGHEST_CONSUMPTION_CATEGORIES, feature_engineering, normalize_category

warnings.filterwarnings("ignore")


def normalize_category_label(cat: object) -> str:
    if not isinstance(cat, str):
        return "Mediano"
    cat_lower = cat.strip().lower()
    mapping = {
        "excelente": "Excelente",
        "bom": "Bom",
        "mediano": "Mediano",
        "ruim": "Ruim",
        "critico": "Critico",
        "crítico": "Critico",
    }
    return mapping.get(cat_lower, "Mediano")


SEED = int(os.getenv("RANDOM_SEED", "42"))
random.seed(SEED)
np.random.seed(SEED)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
feedback_filename = os.getenv("TRAINING_LOG_PATH", "treino_feedback.jsonl")
FEEDBACK_PATH = os.path.join(BASE_DIR, feedback_filename)
model_filename = os.getenv("MODEL_PATH", "categorization-model.joblib")
MODEL_PATH = os.path.join(BASE_DIR, model_filename)

LABELED_CSV = os.path.join(DATA_DIR, "labeled-energy-base.csv")
PPH_CSV = os.path.join(DATA_DIR, "main-dataset.csv")

CATEGORIES = ["Excelente", "Bom", "Mediano", "Ruim", "Critico"]
MAP_CATEGORY_UPPER = {c.upper(): c for c in CATEGORIES}

PROPERTY_TYPES = ["Casa", "Apartamento", "Comercial"]

BASE_CONSUMPTION_BY_TYPE = {
    "Casa": 250,
    "Apartamento": 150,
    "Comercial": 500,
}

N_SYNTHETIC = int(os.getenv("N_SYNTHETIC", "2000"))
FEEDBACK_WEIGHT = int(os.getenv("FEEDBACK_WEIGHT", "5"))

BASE_NUMERIC_COLUMNS = [
    "consumption_kwh",
    "equipment_quantity",
    "high_consumption_hours",
    "refrigeration_watts",
    "heating_watts",
    "air_conditioning_watts",
    "lighting_watts",
]
BOOLEAN_COLUMNS = ["peak_hour_usage"]
CATEGORICAL_COLUMNS = ["property_type", "highest_consumption_category"]
ENGINEERED_COLUMNS = [
    "consumption_per_equipment",
    "consumption_per_hour",
    "normalized_relative_consumption",
    "estimated_load",
    "total_watts",
    "pct_refrigeration",
    "pct_heating",
    "pct_air_conditioning",
    "pct_lighting",
]
TOTAL_NUMERIC_COLUMNS = BASE_NUMERIC_COLUMNS + BOOLEAN_COLUMNS + ENGINEERED_COLUMNS

FEATURE_COLUMNS = BASE_NUMERIC_COLUMNS + CATEGORICAL_COLUMNS + BOOLEAN_COLUMNS

# Columns in PPH CSV used for feature extraction
PPH_APPLIANCE_QTY_COLUMNS = [
    "qtd_geladeira",
    "qtd_ar_condicionado",
    "qtd_ventilador",
    "qtd_lampadas",
    "qtd_microondas",
    "qtd_air_fryer",
    "qtd_lavar_secar",
    "qtd_computadores",
    "qtd_videogame",
    "qtd_tv",
    "qtd_chuveiro_eletrico",
]

def _assign_region_property(region: str, counter: int) -> str:
    """Assign property type based on region with proportional distribution."""
    distribution = {
        "Norte": ["Casa", "Casa", "Casa", "Apartamento", "Comercial"],
        "Nordeste": ["Casa", "Casa", "Apartamento", "Apartamento", "Comercial"],
        "Centro-Oeste": ["Casa", "Casa", "Apartamento", "Casa", "Comercial"],
        "Sudeste": ["Apartamento", "Casa", "Apartamento", "Casa", "Comercial"],
        "Sul": ["Casa", "Casa", "Apartamento", "Apartamento", "Comercial"],
    }
    options = distribution.get(region, ["Casa", "Apartamento"])
    return options[counter % len(options)]


def _estimate_high_consumption_hours(kwh: float, equipment_qty: int) -> float:
    """Estimate high consumption hours based on consumption per equipment."""
    consumption_per_unit = kwh / max(equipment_qty, 1)
    if consumption_per_unit > 40:
        return 8.0
    elif consumption_per_unit > 25:
        return 5.0
    else:
        return 3.0


def _infer_peak_usage(row: pd.Series) -> int:
    """Infer peak hour usage from multiple habit columns."""
    peak_indicators = [
        "habito_evita_standby",
        "habito_ac_portas_fechadas",
        "habito_desliga_tv_sem_uso",
    ]
    conscious_count = sum(
        1
        for col in peak_indicators
        if col in row.index
        and isinstance(row[col], str)
        and row[col].strip() in ("Nunca", "Raramente")
    )
    if conscious_count >= 2:
        return 1
    return 0


def generate_record(client_id: int) -> dict:
    property_type = random.choice(PROPERTY_TYPES)
    equipment_quantity = random.randint(1, 25)
    high_consumption_hours = round(random.uniform(0, 12), 1)
    peak_hour_usage = random.random() < 0.5

    base_by_type = BASE_CONSUMPTION_BY_TYPE[property_type]

    consumption_kwh = (
        base_by_type
        + equipment_quantity * random.uniform(8, 15)
        + high_consumption_hours * random.uniform(10, 20)
        + (50 if peak_hour_usage else 0)
        + random.gauss(0, 30)
    )
    consumption_kwh = max(20, round(consumption_kwh, 1))

    cat_highest = random.choice(HIGHEST_CONSUMPTION_CATEGORIES)

    refrig = round(random.uniform(0, 3000), 1)
    heating = round(random.uniform(0, 8000), 1)
    climat = round(random.uniform(0, 5000), 1)
    ilumin = round(random.uniform(0, 2000), 1)

    return {
        "consumption_kwh": consumption_kwh,
        "peak_hour_usage": peak_hour_usage,
        "equipment_quantity": equipment_quantity,
        "property_type": property_type,
        "high_consumption_hours": high_consumption_hours,
        "highest_consumption_category": cat_highest,
        "refrigeration_watts": refrig,
        "heating_watts": heating,
        "air_conditioning_watts": climat,
        "lighting_watts": ilumin,
    }


def calculate_inefficiency_index(df: pd.DataFrame) -> pd.Series:
    consumption_relative = df["consumption_kwh"] / df["property_type"].map(BASE_CONSUMPTION_BY_TYPE)
    consumption_norm = (consumption_relative / consumption_relative.max()).clip(0, 1)
    equip_norm = (df["equipment_quantity"] / df["equipment_quantity"].max()).clip(0, 1)
    hours_norm = (df["high_consumption_hours"] / df["high_consumption_hours"].max()).clip(0, 1)
    pico_norm = df["peak_hour_usage"].astype(int)
    return 0.40 * consumption_norm + 0.25 * pico_norm + 0.20 * equip_norm + 0.15 * hours_norm


def load_labeled_csv(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        print("  File not found.")
        return pd.DataFrame()
    df = pd.read_csv(path)
    df["peak_hour_usage"] = df["peak_hour_usage"].astype(int)
    if "category" in df.columns:
        df["category"] = df["category"].apply(normalize_category_label)
    if "highest_consumption_category" in df.columns:
        df["highest_consumption_category"] = df["highest_consumption_category"].apply(
            normalize_category
        )
    cols_extra = [
        "refrigeration_watts",
        "heating_watts",
        "air_conditioning_watts",
        "lighting_watts",
    ]
    for col in cols_extra:
        if col not in df.columns:
            df[col] = 0.0
    return df[FEATURE_COLUMNS + ["category"]]


def load_pph_data(path: str) -> pd.DataFrame:
    """Load the merged PPH 2019 + notebook-enriched dataset for training.

    main-dataset.csv already contains categoria_maior_consumo and
    produtos_maior_consumo, merged and validated (row alignment by
    ENTREVISTA + REGIAO + UF + MUNICIPIO) in M003_merge_datasets.ipynb.
    No positional join or fallback is needed here anymore.

    Features derived from PPH columns:
      - consumption_kwh: consumo_real_medio_kwh_mes
      - equipment_quantity: sum of qtd_* appliance columns
      - property_type: inferred from REGIAO with proportional distribution
      - high_consumption_hours: estimated from consumption per equipment
      - peak_hour_usage: inferred from multiple habit columns
      - consumption distribution: from kwh_categoria_* columns

    Rows without a categoria_maior_consumo value (missing/non-string)
    fall back to "Outros" via normalize_category().
    """
    if not os.path.exists(path):
        print("  File not found.")
        return pd.DataFrame()

    df = pd.read_csv(path, encoding="utf-8-sig").reset_index(drop=True)

    df["highest_consumption_category"] = df["categoria_maior_consumo"].apply(normalize_category)

    # Assign property type with regional proportional distribution
    df["property_type"] = df.reset_index(drop=True).apply(
        lambda row: _assign_region_property(
            row["REGIAO"].strip() if isinstance(row["REGIAO"], str) else "Outro",
            row.name,
        ),
        axis=1,
    )

    # Calculate total equipment quantity from all appliance columns
    qty_cols = [c for c in PPH_APPLIANCE_QTY_COLUMNS if c in df.columns]
    df["equipment_quantity"] = df[qty_cols].fillna(0).astype(int).sum(axis=1)

    # Calculate consumption kWh from reported value, with fallback
    kwh_cols = [
        "kwh_" + c.replace("qtd_", "")
        for c in qty_cols
        if "kwh_" + c.replace("qtd_", "") in df.columns
    ]
    df["consumption_kwh"] = pd.to_numeric(df["consumo_real_medio_kwh_mes"], errors="coerce").fillna(
        df[kwh_cols].fillna(0).sum(axis=1)
    )

    # Estimate high consumption hours deterministically from consumption intensity
    df["high_consumption_hours"] = df.apply(
        lambda row: _estimate_high_consumption_hours(
            row["consumption_kwh"], row["equipment_quantity"]
        ),
        axis=1,
    )

    # Infer peak hour usage from multiple habit columns
    df["peak_hour_usage"] = df.apply(_infer_peak_usage, axis=1)

    # Map category kWh to consumption distribution (monthly kWh -> avg watts)
    df["refrigeration_watts"] = df.get("kwh_categoria_refrigeracao", 0).fillna(0) * 1000 / 730
    df["air_conditioning_watts"] = df.get("kwh_categoria_climatizacao", 0).fillna(0) * 1000 / 730
    df["heating_watts"] = df.get("kwh_categoria_eletrodomesticos", 0).fillna(0) * 1000 / 730
    df["lighting_watts"] = df.get("kwh_categoria_iluminacao", 0).fillna(0) * 1000 / 730

    # Handle missing values
    df["consumption_kwh"] = (
        df["consumption_kwh"].fillna(df["consumption_kwh"].median()).clip(lower=20)
    )
    df["highest_consumption_category"] = df["highest_consumption_category"].fillna("Outros")

    # Calculate inefficiency index to create labels
    pph_subset = df[FEATURE_COLUMNS].copy()
    pph_subset["peak_hour_usage"] = pph_subset["peak_hour_usage"].astype(int)
    index = calculate_inefficiency_index(pph_subset)
    df["category"] = pd.qcut(index, q=5, labels=CATEGORIES)

    result_columns = FEATURE_COLUMNS + ["category", "produtos_maior_consumo"]
    result = df[result_columns].copy()
    result["peak_hour_usage"] = result["peak_hour_usage"].astype(int)
    return result


def load_feedback(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        print("  No feedback file found.")
        return pd.DataFrame()

    records = []
    with open(path, encoding="utf-8") as f:
        for row in f:
            row = row.strip()
            if not row:
                continue
            try:
                entry = json.loads(row)
                feats = entry.get("features", {})
                cat_raw = entry.get("prediction", {}).get("category", "")
                records.append(
                    {
                        "consumption_kwh": feats.get("consumption_kwh", 0),
                        "peak_hour_usage": feats.get("peak_hour_usage", False),
                        "equipment_quantity": feats.get("equipment_quantity", 0),
                        "property_type": feats.get("property_type", "Casa"),
                        "high_consumption_hours": feats.get("high_consumption_hours", 0),
                        "highest_consumption_category": normalize_category(
                            feats.get("highest_consumption_category", "Outros")
                        ),
                        "refrigeration_watts": feats.get("refrigeration_watts", 0.0),
                        "heating_watts": feats.get("heating_watts", 0.0),
                        "air_conditioning_watts": feats.get("air_conditioning_watts", 0.0),
                        "lighting_watts": feats.get("lighting_watts", 0.0),
                        "category": normalize_category_label(cat_raw),
                    }
                )
            except (json.JSONDecodeError, KeyError):
                continue

    return pd.DataFrame(records)


def generate_synthetic(n: int, seed_offset: int = 0) -> pd.DataFrame:
    regs = [generate_record(i + seed_offset) for i in range(n)]
    df = pd.DataFrame(regs)
    df["peak_hour_usage"] = df["peak_hour_usage"].astype(int)
    index = calculate_inefficiency_index(df)
    df["category"] = pd.qcut(index, q=5, labels=CATEGORIES)
    return df[FEATURE_COLUMNS + ["category"]]


feature_eng = FunctionTransformer(feature_engineering, validate=False)

CATEGORIA_MAIOR_CAT_COLUMNS = [
    c.replace(" ", "").replace("ã", "a").replace("ç", "c") for c in HIGHEST_CONSUMPTION_CATEGORIES
]
preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), TOTAL_NUMERIC_COLUMNS),
        (
            "cat",
            OneHotEncoder(
                handle_unknown="ignore",
                categories=[PROPERTY_TYPES, HIGHEST_CONSUMPTION_CATEGORIES],
            ),
            CATEGORICAL_COLUMNS,
        ),
    ],
    verbose_feature_names_out=False,
)

# =========================================================================
# DATA LOADING
# =========================================================================

print("=" * 60)
print("DATA LOADING")
print("=" * 60)

parts = []

print("Loading PPH 2019 real survey data...")
df_pph = load_pph_data(PPH_CSV)
if len(df_pph) > 0:
    print(f"  {len(df_pph)} records from PPH 2019 survey")
    print("  Category distribution (PPH):")
    for cat, count in df_pph["category"].value_counts().items():
        print(f"    {cat}: {count}")
    parts.append(df_pph)
print()

print("Loading labeled data from CSVs...")
df_csv = load_labeled_csv(LABELED_CSV)
if len(df_csv) > 0:
    print(f"  {len(df_csv)} records loaded from labeled-energy-base.csv")
    print("  Category distribution (CSV):")
    for cat, count in df_csv["category"].value_counts().items():
        print(f"    {cat}: {count}")
    parts.append(df_csv)
print()

print("Generating synthetic data for class balancing...")
df_sint = generate_synthetic(N_SYNTHETIC)
print(f"  {len(df_sint)} synthetic records generated")
parts.append(df_sint)
print()

print("Loading feedback from real predictions...")
df_fb = load_feedback(FEEDBACK_PATH)

if len(df_fb) > 0:
    print(f"  {len(df_fb)} feedback records loaded")
    for cat, count in df_fb["category"].value_counts().items():
        print(f"    {cat}: {count}")
    df_fb["peak_hour_usage"] = df_fb["peak_hour_usage"].astype(int)
    df_fb_repeated = pd.concat([df_fb] * FEEDBACK_WEIGHT, ignore_index=True)
    print(f"  After repetition (weight x{FEEDBACK_WEIGHT}): {len(df_fb_repeated)} records")
    parts.append(df_fb_repeated)

df_full = pd.concat(parts, ignore_index=True)
print(f"\nTotal combined: {len(df_full)} records")
print("Distribution by property type:")
print(df_full["property_type"].value_counts().to_string())
print("Distribution highest consumption category:")
print(df_full["highest_consumption_category"].value_counts().to_string())
print()

# =========================================================================
# TRAINING
# =========================================================================

X_raw = df_full[FEATURE_COLUMNS]
y = df_full["category"]

X_train, X_test, y_train, y_test = train_test_split(
    X_raw, y, test_size=0.2, random_state=SEED, stratify=y
)

print(f"Train: {len(X_train)} | Test: {len(X_test)}")

pipeline_tune = Pipeline(
    [
        ("features", feature_eng),
        ("pre", preprocessor),
        ("model", RandomForestClassifier(random_state=SEED)),
    ]
)

param_dist = {
    "model__n_estimators": [200, 300, 400],
    "model__max_depth": [None, 30],
    "model__min_samples_split": [2, 5],
    "model__min_samples_leaf": [1, 2],
    "model__max_features": ["sqrt", None],
    "model__class_weight": [None, "balanced"],
}

print()
print("=" * 60)
print("HYPERPARAMETER TUNING (RandomizedSearchCV)")
print("=" * 60)

random_search = RandomizedSearchCV(
    pipeline_tune,
    param_distributions=param_dist,
    n_iter=15,
    cv=3,
    scoring="accuracy",
    n_jobs=-1,
    random_state=SEED,
    verbose=1,
)
random_search.fit(X_train, y_train)

print("\nBest parameters:")
for param, value in random_search.best_params_.items():
    print(f"  {param}: {value}")
print(f"Best accuracy (CV): {random_search.best_score_:.4f}")
print()

print("=" * 60)
print("PROBABILITY CALIBRATION (CalibratedClassifierCV)")
print("=" * 60)

calibrated_pipeline = Pipeline(
    [
        ("features", feature_eng),
        ("pre", preprocessor),
        (
            "model",
            CalibratedClassifierCV(
                RandomForestClassifier(
                    **{k.replace("model__", ""): v for k, v in random_search.best_params_.items()},
                    random_state=SEED,
                ),
                cv=3,
                method="isotonic",
            ),
        ),
    ]
)
calibrated_pipeline.fit(X_train, y_train)
print("Calibrated model trained with isotonic regression.")

# =========================================================================
# EVALUATION
# =========================================================================

y_pred = calibrated_pipeline.predict(X_test)
y_proba = calibrated_pipeline.predict_proba(X_test)

accuracy = accuracy_score(y_test, y_pred)
print(f"\nTest accuracy: {accuracy:.4f}")
print("\nClassification report:")
print(classification_report(y_test, y_pred, zero_division=0))

confidences = y_proba.max(axis=1)
print("\nConfidence distribution:")
print(f"  Mean: {confidences.mean():.3f}")
print(f"  Median: {np.median(confidences):.3f}")
print(f"  Min: {confidences.min():.3f}")
print(f"  Max: {confidences.max():.3f}")
pct_above_80 = (confidences >= 0.80).mean()
pct_above_90 = (confidences >= 0.90).mean()
print(f"  % above 80%: {pct_above_80:.1%}")
print(f"  % above 90%: {pct_above_90:.1%}")

# =========================================================================
# SAVE
# =========================================================================

joblib.dump(calibrated_pipeline, MODEL_PATH, compress=3)
print(f"\nModel saved to '{MODEL_PATH}'")
print(f"Size: {os.path.getsize(MODEL_PATH) / 1024 / 1024:.1f} MB")

print()
print("=" * 60)
print("TEST WITH ALL PROPERTY TYPES AND CATEGORIES")
print("=" * 60)
for tipo in PROPERTY_TYPES:
    for categoria_consumo in HIGHEST_CONSUMPTION_CATEGORIES:
        teste = pd.DataFrame(
            [
                {
                    "consumption_kwh": 400.0,
                    "peak_hour_usage": False,
                    "equipment_quantity": 10,
                    "property_type": tipo,
                    "high_consumption_hours": 5.0,
                    "highest_consumption_category": categoria_consumo,
                    "refrigeration_watts": 1500.0,
                    "heating_watts": 0.0,
                    "air_conditioning_watts": 0.0,
                    "lighting_watts": 0.0,
                }
            ]
        )
        pred = calibrated_pipeline.predict(teste)[0]
        proba = calibrated_pipeline.predict_proba(teste).max()
        print(f"  {tipo:14s} -> {pred:10s} (confidence: {proba:.1%})")

print()
print("Tip: for the next cycle, run this script again —")
print("the data in 'data/' and 'treino_feedback.jsonl' will be incorporated automatically.")
