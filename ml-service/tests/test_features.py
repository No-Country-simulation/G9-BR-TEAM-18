import os

import joblib
import pandas as pd
import pytest

from features import feature_engineering

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "categorization-model.joblib")


def _sample_row(**overrides) -> dict:
    row = {
        "consumption_kwh": 400.0,
        "peak_hour_usage": 0,
        "equipment_quantity": 10,
        "property_type": "Casa",
        "high_consumption_hours": 5.0,
        "highest_consumption_category": "Climatizacao",
        "refrigeration_watts": 1500.0,
        "heating_watts": 0.0,
        "air_conditioning_watts": 3000.0,
        "lighting_watts": 500.0,
    }
    row.update(overrides)
    return row


def test_feature_engineering_ignores_daily_consumption_distribution_key():
    """The pipeline always derives *_watts columns directly (train_model.py and
    main.py never emit a 'daily_consumption_distribution' column). Feature
    engineering must keep using refrigeration_watts/heating_watts/... and not
    be influenced by an extra 'daily_consumption_distribution' column, even if
    present."""
    row = _sample_row()
    df_plain = pd.DataFrame([row])
    df_with_extra = pd.DataFrame(
        [
            {
                **row,
                "daily_consumption_distribution": {
                    "REFRIGERATION_WATTS": 9999.0,
                    "HEATING_WATTS": 9999.0,
                    "AIR_CONDITIONING_WATTS": 9999.0,
                    "LIGHTING_WATTS": 9999.0,
                },
            }
        ]
    )

    result_plain = feature_engineering(df_plain)
    result_with_extra = feature_engineering(df_with_extra)

    for col in [
        "total_watts",
        "pct_refrigeration",
        "pct_heating",
        "pct_air_conditioning",
        "pct_lighting",
    ]:
        assert result_plain.loc[0, col] == pytest.approx(result_with_extra.loc[0, col])

    assert result_with_extra.loc[0, "total_watts"] == pytest.approx(1500.0 + 0.0 + 3000.0 + 500.0)


def test_feature_engineering_output_columns_and_ranges():
    df = pd.DataFrame([_sample_row()])
    result = feature_engineering(df)

    engineered_columns = [
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
    for col in engineered_columns:
        assert col in result.columns

    pct_sum = (
        result.loc[0, "pct_refrigeration"]
        + result.loc[0, "pct_heating"]
        + result.loc[0, "pct_air_conditioning"]
        + result.loc[0, "pct_lighting"]
    )
    assert pct_sum == pytest.approx(1.0)
    for col in ["pct_refrigeration", "pct_heating", "pct_air_conditioning", "pct_lighting"]:
        assert 0.0 <= result.loc[0, col] <= 1.0


@pytest.mark.skipif(
    not os.path.exists(MODEL_PATH), reason="categorization-model.joblib not present"
)
def test_pipeline_predict_smoke():
    """The serialized pipeline (features -> preprocessor -> model) must keep
    predicting without error after simplifying feature_engineering."""
    model = joblib.load(MODEL_PATH)
    df = pd.DataFrame([_sample_row()])

    prediction = model.predict(df)
    probabilities = model.predict_proba(df)

    assert len(prediction) == 1
    assert probabilities.shape[0] == 1
