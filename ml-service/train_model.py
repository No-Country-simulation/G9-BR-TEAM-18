"""
Training script for the energy efficiency classification model.

Generates synthetic data + loads labeled data from CSVs + real feedback
for cyclic retraining. Each run the model incorporates:
  - labeled-energy-base.csv (1000 real records)
  - treino_feedback.jsonl (accumulated real predictions)
  - synthetic data (for balancing)

Usage:
    python3 train_model.py
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

from features import feature_engineering, HIGHEST_CONSUMPTION_CATEGORIES, normalize_category

def normalize_category_label(cat):
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

CATEGORIES = ["Excelente", "Bom", "Mediano", "Ruim", "Critico"]
MAP_CATEGORY_UPPER = {c.upper(): c for c in CATEGORIES}

PROPERTY_TYPES = ["Casa", "Apartamento", "Comercial", "Industria", "Rural", "Outro"]

BASE_CONSUMPTION_BY_TYPE = {
    "Casa": 250, "Apartamento": 150, "Comercial": 500,
    "Industria": 800, "Rural": 300, "Outro": 250,
}

N_SYNTHETIC = int(os.getenv("N_SYNTHETIC", "4000"))
FEEDBACK_WEIGHT = int(os.getenv("FEEDBACK_WEIGHT", "5"))

BASE_NUMERIC_COLUMNS = [
    "consumption_kwh", "equipment_quantity", "high_consumption_hours",
    "refrigeration_watts", "heating_watts", "air_conditioning_watts", "lighting_watts",
]
BOOLEAN_COLUMNS = ["peak_hour_usage"]
CATEGORICAL_COLUMNS = ["property_type", "highest_consumption_category"]
ENGINEERED_COLUMNS = [
    "consumption_per_equipment", "consumption_per_hour",
    "normalized_relative_consumption", "estimated_load",
    "total_watts", "pct_refrigeration", "pct_heating",
    "pct_air_conditioning", "pct_lighting",
]
TOTAL_NUMERIC_COLUMNS = BASE_NUMERIC_COLUMNS + BOOLEAN_COLUMNS + ENGINEERED_COLUMNS

FEATURE_COLUMNS = (
    BASE_NUMERIC_COLUMNS + CATEGORICAL_COLUMNS + BOOLEAN_COLUMNS
)


def generate_record(client_id):
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


def calculate_inefficiency_index(df):
    consumption_relative = df["consumption_kwh"] / df["property_type"].map(BASE_CONSUMPTION_BY_TYPE)
    consumption_norm = (consumption_relative / consumption_relative.max()).clip(0, 1)
    equip_norm = (df["equipment_quantity"] / df["equipment_quantity"].max()).clip(0, 1)
    hours_norm = (df["high_consumption_hours"] / df["high_consumption_hours"].max()).clip(0, 1)
    pico_norm = df["peak_hour_usage"].astype(int)
    return 0.40 * consumption_norm + 0.25 * pico_norm + 0.20 * equip_norm + 0.15 * hours_norm


def load_labeled_csv(path):
    if not os.path.exists(path):
        print("  File not found.")
        return pd.DataFrame()
    df = pd.read_csv(path)
    df["peak_hour_usage"] = df["peak_hour_usage"].astype(int)
    if "category" in df.columns:
        df["category"] = df["category"].apply(normalize_category_label)
    if "highest_consumption_category" in df.columns:
        df["highest_consumption_category"] = df["highest_consumption_category"].apply(normalize_category)
    cols_extra = ["refrigeration_watts", "heating_watts", "air_conditioning_watts", "lighting_watts"]
    for col in cols_extra:
        if col not in df.columns:
            df[col] = 0.0
    return df[FEATURE_COLUMNS + ["category"]]


def load_feedback(path):
    if not os.path.exists(path):
        print("  No feedback file found.")
        return pd.DataFrame()

    records = []
    with open(path, "r", encoding="utf-8") as f:
        for row in f:
            row = row.strip()
            if not row:
                continue
            try:
                entry = json.loads(row)
                feats = entry.get("features", {})
                cat_raw = entry.get("prediction", {}).get("category", "")
                records.append({
                    "consumption_kwh": feats.get("consumption_kwh", 0),
                    "peak_hour_usage": feats.get("peak_hour_usage", False),
                    "equipment_quantity": feats.get("equipment_quantity", 0),
                    "property_type": feats.get("property_type", "Casa"),
                    "high_consumption_hours": feats.get("high_consumption_hours", 0),
                    "highest_consumption_category": normalize_category(feats.get("highest_consumption_category", "Outros")),
                    "refrigeration_watts": feats.get("refrigeration_watts", 0.0),
                    "heating_watts": feats.get("heating_watts", 0.0),
                    "air_conditioning_watts": feats.get("air_conditioning_watts", 0.0),
                    "lighting_watts": feats.get("lighting_watts", 0.0),
                    "category": normalize_category_label(cat_raw),
                })
            except (json.JSONDecodeError, KeyError):
                continue

    return pd.DataFrame(records)


def generate_synthetic(n, seed_offset=0):
    regs = [generate_record(i + seed_offset) for i in range(n)]
    df = pd.DataFrame(regs)
    df["peak_hour_usage"] = df["peak_hour_usage"].astype(int)
    index = calculate_inefficiency_index(df)
    df["category"] = pd.qcut(index, q=5, labels=CATEGORIES)
    return df[FEATURE_COLUMNS + ["category"]]


feature_eng = FunctionTransformer(feature_engineering, validate=False)

CATEGORIA_MAIOR_CAT_COLUMNS = [c.replace(" ", "").replace("ã", "a").replace("ç", "c")
                                for c in HIGHEST_CONSUMPTION_CATEGORIES]
preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), TOTAL_NUMERIC_COLUMNS),
        ("cat", OneHotEncoder(
            handle_unknown="ignore",
            categories=[PROPERTY_TYPES, HIGHEST_CONSUMPTION_CATEGORIES],
        ), CATEGORICAL_COLUMNS),
    ],
    verbose_feature_names_out=False,
)

# =========================================================================
# DATA LOADING
# =========================================================================

print("=" * 60)
print("DATA LOADING")
print("=" * 60)

print("Loading labeled data from CSVs...")
df_csv = load_labeled_csv(LABELED_CSV)
if len(df_csv) > 0:
    print(f"  {len(df_csv)} records loaded from labeled-energy-base.csv")
    print(f"  Category distribution (CSV):")
    for cat, count in df_csv["category"].value_counts().items():
        print(f"    {cat}: {count}")
print()

print("Generating synthetic data...")
df_sint = generate_synthetic(N_SYNTHETIC)
print(f"  {len(df_sint)} synthetic records generated")
print()

print("Loading feedback from real predictions...")
df_fb = load_feedback(FEEDBACK_PATH)
parts = [df_sint]

if len(df_csv) > 0:
    parts.append(df_csv)

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
print(f"Distribution by property type:")
print(df_full["property_type"].value_counts().to_string())
print(f"Distribution highest consumption category:")
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

pipeline_tune = Pipeline([
    ("features", feature_eng),
    ("pre", preprocessor),
    ("model", RandomForestClassifier(random_state=SEED)),
])

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
    pipeline_tune, param_distributions=param_dist, n_iter=15,
    cv=3, scoring="accuracy", n_jobs=-1, random_state=SEED, verbose=1,
)
random_search.fit(X_train, y_train)

print(f"\nBest parameters:")
for param, value in random_search.best_params_.items():
    print(f"  {param}: {value}")
print(f"Best accuracy (CV): {random_search.best_score_:.4f}")
print()

print("=" * 60)
print("PROBABILITY CALIBRATION (CalibratedClassifierCV)")
print("=" * 60)

calibrated_pipeline = Pipeline([
    ("features", feature_eng),
    ("pre", preprocessor),
    ("model", CalibratedClassifierCV(
        RandomForestClassifier(**{
            k.replace("model__", ""): v
            for k, v in random_search.best_params_.items()
        }, random_state=SEED),
        cv=3, method="isotonic",
    )),
])
calibrated_pipeline.fit(X_train, y_train)
print("Calibrated model trained with isotonic regression.")

# =========================================================================
# EVALUATION
# =========================================================================

y_pred = calibrated_pipeline.predict(X_test)
y_proba = calibrated_pipeline.predict_proba(X_test)

accuracy = accuracy_score(y_test, y_pred)
print(f"\nTest accuracy: {accuracy:.4f}")
print(f"\nClassification report:")
print(classification_report(y_test, y_pred, zero_division=0))

confidences = y_proba.max(axis=1)
print(f"\nConfidence distribution:")
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

joblib.dump(calibrated_pipeline, MODEL_PATH)
print(f"\nModel saved to '{MODEL_PATH}'")
print(f"Size: {os.path.getsize(MODEL_PATH) / 1024 / 1024:.1f} MB")

print()
print("=" * 60)
print("TEST WITH ALL PROPERTY TYPES")
print("=" * 60)
for tipo in PROPERTY_TYPES:
    teste = pd.DataFrame([{
        "consumption_kwh": 400.0, "peak_hour_usage": False,
        "equipment_quantity": 10, "property_type": tipo,
        "high_consumption_hours": 5.0, "highest_consumption_category": "Refrigeracao",
        "refrigeration_watts": 1500.0, "heating_watts": 0.0,
        "air_conditioning_watts": 0.0, "lighting_watts": 0.0,
    }])
    pred = calibrated_pipeline.predict(teste)[0]
    proba = calibrated_pipeline.predict_proba(teste).max()
    print(f"  {tipo:14s} -> {pred:10s} (confidence: {proba:.1%})")

print()
print(f"Tip: for the next cycle, run this script again —")
print(f"the data in 'data/' and 'treino_feedback.jsonl' will be incorporated automatically.")
