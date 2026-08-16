"""Testes das verificações de contrato e consistência."""

from ml_qa.checks import ScenarioOutcome
from ml_qa.checks.consistency import check_monotonicity
from ml_qa.checks.response_contract import (
    check_category_valid,
    check_http_status,
    check_probability_range,
    check_recommendations,
    check_response_schema,
    check_source_valid,
)
from ml_qa.scenarios import Scenario

VALID_BODY = {
    "category": "MEDIANO",
    "probability": 0.78,
    "recommendations": ["Dica um", "Dica dois"],
    "source": "model",
}


def _scenario(**overrides) -> Scenario:
    payload = {
        "consumption_kwh": 250.0,
        "peak_hour_usage": False,
        "equipment_quantity": 10,
        "property_type": "RESIDENCIAL",
        "high_consumption_hours": 5.0,
    }
    payload.update(overrides)
    return Scenario(name="t", group="boundary", payload=payload)


def test_check_http_status_ok():
    result = check_http_status(_scenario(), 200, VALID_BODY)[0]
    assert result.passed


def test_check_http_status_mismatch():
    result = check_http_status(_scenario(), 500, VALID_BODY)[0]
    assert not result.passed
    assert "500" in result.message


def test_check_http_status_expected_422():
    scenario = _scenario()
    scenario = Scenario(
        name="anom",
        group="anomalies",
        payload=scenario.payload,
        expect_status=422,
    )
    result = check_http_status(scenario, 422, None)[0]
    assert result.passed


def test_check_response_schema_missing_field():
    body = {k: v for k, v in VALID_BODY.items() if k != "source"}
    result = check_response_schema(_scenario(), 200, body)[0]
    assert not result.passed
    assert "source" in result.message


def test_check_category_valid():
    assert check_category_valid(_scenario(), 200, {"category": "EXCELENTE"})[0].passed
    assert not check_category_valid(_scenario(), 200, {"category": "OTIMO"})[0].passed


def test_check_probability_range():
    assert check_probability_range(_scenario(), 200, {"probability": 0.5})[0].passed
    assert not check_probability_range(_scenario(), 200, {"probability": 1.5})[0].passed
    assert not check_probability_range(_scenario(), 200, {"probability": "alta"})[0].passed


def test_check_recommendations_empty():
    result = check_recommendations(_scenario(), 200, {"recommendations": []})[0]
    assert not result.passed


def test_check_source_valid_prefix():
    source = {"source": "model+groq (confidence 81.2%)"}
    assert check_source_valid(_scenario(), 200, source)[0].passed
    assert not check_source_valid(_scenario(), 200, {"source": "alien"})[0].passed


def test_check_monotonicity_improvement_detected():
    scenarios = [
        Scenario(
            name="low",
            group="boundary",
            payload={},
            monotonic_group="consumption",
            monotonic_key=100.0,
        ),
        Scenario(
            name="high",
            group="boundary",
            payload={},
            monotonic_group="consumption",
            monotonic_key=1000.0,
        ),
    ]
    outcomes = [
        ScenarioOutcome(
            scenario=scenarios[0],
            status_code=200,
            latency_ms=10.0,
            body={
                "category": "RUIM",
                "probability": 0.8,
                "recommendations": [],
                "source": "model",
            },
        ),
        ScenarioOutcome(
            scenario=scenarios[1],
            status_code=200,
            latency_ms=10.0,
            body={
                "category": "EXCELENTE",
                "probability": 0.9,
                "recommendations": [],
                "source": "model",
            },
        ),
    ]
    failures = check_monotonicity(outcomes)
    assert len(failures) == 1
    assert "melhorou" in failures[0]


def test_check_monotonicity_no_improvement_passes():
    scenarios = [
        Scenario(
            name="low",
            group="boundary",
            payload={},
            monotonic_group="consumption",
            monotonic_key=100.0,
        ),
        Scenario(
            name="high",
            group="boundary",
            payload={},
            monotonic_group="consumption",
            monotonic_key=1000.0,
        ),
    ]
    outcomes = [
        ScenarioOutcome(
            scenario=scenarios[0],
            status_code=200,
            latency_ms=10.0,
            body={
                "category": "BOM",
                "probability": 0.8,
                "recommendations": [],
                "source": "model",
            },
        ),
        ScenarioOutcome(
            scenario=scenarios[1],
            status_code=200,
            latency_ms=10.0,
            body={
                "category": "RUIM",
                "probability": 0.9,
                "recommendations": [],
                "source": "model",
            },
        ),
    ]
    assert check_monotonicity(outcomes) == []
