"""Testes do módulo de análise analítica dos retornos."""

from ml_qa.analysis import (
    analyze,
    detect_all,
    detect_consumption_consistency,
    detect_empty_recommendations,
    detect_low_confidence_without_groq,
    detect_set_consumption_mismatch,
    parse_source,
    recommendation_stats_by_source,
    source_distribution,
)
from ml_qa.checks import ScenarioOutcome
from ml_qa.scenarios import Scenario

# Distribuição de referência de uma casa média (watts por categoria).
CASA_MEDIA_DIST = {
    "REFRIGERATION_WATTS": 650.0,
    "HEATING_WATTS": 12000.0,
    "AIR_CONDITIONING_WATTS": 1500.0,
    "LIGHTING_WATTS": 120.0,
}
# Consumo mensal esperado calculado pelo gerador para esse conjunto
# (watts x horas x 30 / 1000, horas médias do catálogo).
CASA_MEDIA_EXPECTED = 1208.7


def _outcome(
    name: str, body: dict, payload: dict | None = None, status: int = 200
) -> ScenarioOutcome:
    return ScenarioOutcome(
        scenario=Scenario(
            name=name,
            group="boundary",
            payload=payload or {},
            tags=frozenset(),
            expected_monthly_kwh=CASA_MEDIA_EXPECTED,
        ),
        status_code=status,
        latency_ms=10.0,
        body=body,
    )


def test_parse_source_variants():
    assert parse_source("model") == {"kind": "model", "confidence": None}
    source_low = "model (confidence 67.4%)"
    parsed_low = parse_source(source_low)
    assert parsed_low == {"kind": "model-low-confidence", "confidence": 0.674}
    source_high = "model (confidence 92.0%)"
    assert parse_source(source_high)["kind"] == "model"
    source_groq = "model+groq (confidence 81.2%)"
    assert parse_source(source_groq) == {"kind": "model-groq", "confidence": 0.812}
    source_failed = "model+rule-based (groq failed) (confidence 63.1%)"
    parsed = parse_source(source_failed)
    assert parsed["kind"] == "model-groq-failed"
    assert parsed["confidence"] == 0.631
    assert parse_source("rule-based (model error)")["kind"] == "rule-based-error"
    source_unavailable = "rule-based (model unavailable)"
    assert parse_source(source_unavailable)["kind"] == "rule-based-unavailable"
    assert parse_source(None) == {"kind": "unknown", "confidence": None}


def test_source_distribution():
    outcomes = [
        _outcome(
            "a",
            {"category": "BOM", "probability": 0.9, "source": "model", "recommendations": ["x"]},
        ),
        _outcome(
            "b",
            {
                "category": "BOM",
                "probability": 0.75,
                "source": "model+groq (confidence 75.0%)",
                "recommendations": ["x"],
            },
        ),
        _outcome(
            "c",
            {
                "category": "MEDIANO",
                "probability": 0.7,
                "source": "model+groq (confidence 70.0%)",
                "recommendations": ["x"],
            },
        ),
    ]
    dist = source_distribution(outcomes)
    assert dist["model"]["count"] == 1
    assert dist["model-groq"]["count"] == 2
    assert dist["model-groq"]["avg_probability"] == 0.725


def test_detect_low_confidence_without_groq():
    outcomes = [
        _outcome(
            "low",
            {
                "category": "BOM",
                "probability": 0.65,
                "source": "model (confidence 65.0%)",
                "recommendations": ["x"],
            },
        ),
        _outcome(
            "high",
            {"category": "BOM", "probability": 0.95, "source": "model", "recommendations": ["x"]},
        ),
    ]
    alerts = detect_low_confidence_without_groq(outcomes)
    assert len(alerts) == 1
    assert alerts[0].scenario == "low"
    assert alerts[0].severity == "info"
    assert "65.0%" in alerts[0].message


def test_detect_empty_recommendations():
    outcomes = [
        _outcome(
            "empty",
            {"category": "BOM", "probability": 0.9, "source": "model", "recommendations": []},
        ),
        _outcome(
            "ok",
            {"category": "BOM", "probability": 0.9, "source": "model", "recommendations": ["dica"]},
        ),
    ]
    alerts = detect_empty_recommendations(outcomes)
    assert len(alerts) == 1
    assert alerts[0].severity == "critical"
    assert alerts[0].scenario == "empty"


def test_detect_consumption_consistency():
    # Casa média: esperado ~ (650*24 + 12000*1 + 1500*8 + 120*6) * 30 / 1000
    # = (15600 + 12000 + 12000 + 720) * 30 / 1000 = 40290 * 0.03 = 1208.7 kWh.
    outcomes = [
        _outcome(
            "low-critico",
            {
                "category": "CRITICO",
                "probability": 0.9,
                "source": "model",
                "recommendations": ["x"],
            },
            payload={"consumption_kwh": 200.0, "daily_consumption_distribution": CASA_MEDIA_DIST},
        ),
        _outcome(
            "high-excelente",
            {
                "category": "EXCELENTE",
                "probability": 0.9,
                "source": "model",
                "recommendations": ["x"],
            },
            payload={"consumption_kwh": 4000.0, "daily_consumption_distribution": CASA_MEDIA_DIST},
        ),
        _outcome(
            "ok",
            {
                "category": "BOM",
                "probability": 0.9,
                "source": "model",
                "recommendations": ["x"],
            },
            payload={"consumption_kwh": 1200.0, "daily_consumption_distribution": CASA_MEDIA_DIST},
        ),
    ]
    alerts = detect_consumption_consistency(outcomes)
    assert len(alerts) == 2
    assert {a.scenario for a in alerts} == {"low-critico", "high-excelente"}


def test_detect_set_consumption_mismatch():
    # Esperado 1208.7 kWh: consumo 100x menor e 10x maior devem ser alertados.
    outcomes = [
        _outcome(
            "abaixo",
            {"category": "BOM", "probability": 0.9, "source": "model", "recommendations": ["x"]},
            payload={"consumption_kwh": 5.0, "daily_consumption_distribution": CASA_MEDIA_DIST},
        ),
        _outcome(
            "acima",
            {"category": "BOM", "probability": 0.9, "source": "model", "recommendations": ["x"]},
            payload={"consumption_kwh": 20000.0, "daily_consumption_distribution": CASA_MEDIA_DIST},
        ),
        _outcome(
            "ok",
            {"category": "BOM", "probability": 0.9, "source": "model", "recommendations": ["x"]},
            payload={"consumption_kwh": 1200.0, "daily_consumption_distribution": CASA_MEDIA_DIST},
        ),
    ]
    alerts = detect_set_consumption_mismatch(outcomes)
    assert len(alerts) == 2
    assert {a.scenario for a in alerts} == {"abaixo", "acima"}
    assert all(a.severity == "warning" for a in alerts)


def test_detect_all_flags_rule_based_error():
    outcomes = [
        _outcome(
            "err",
            {
                "category": "BOM",
                "probability": 0.85,
                "source": "rule-based (model error)",
                "recommendations": ["x"],
            },
        ),
    ]
    alerts = detect_all(outcomes)
    severities = {a.title for a in alerts}
    assert "erro do modelo durante predição" in severities


def test_detect_all_flags_rule_based_unavailable():
    outcomes = [
        _outcome(
            "unavail",
            {
                "category": "BOM",
                "probability": 0.85,
                "source": "rule-based (model unavailable)",
                "recommendations": ["x"],
            },
        ),
    ]
    alerts = detect_all(outcomes)
    titles = {a.title for a in alerts}
    assert "modelo indisponível (fallback para regras)" in titles
    assert any(a.severity == "critical" for a in alerts)


def test_recommendation_stats_by_source():
    outcomes = [
        _outcome(
            "a",
            {
                "category": "BOM",
                "probability": 0.9,
                "source": "model",
                "recommendations": ["x", "y", "z"],
            },
        ),
        _outcome(
            "b",
            {"category": "BOM", "probability": 0.9, "source": "model", "recommendations": ["x"]},
        ),
        _outcome(
            "c",
            {
                "category": "BOM",
                "probability": 0.7,
                "source": "model+groq (confidence 70.0%)",
                "recommendations": ["x", "y"],
            },
        ),
    ]
    stats = recommendation_stats_by_source(outcomes)
    assert stats["model"]["responses"] == 2
    assert stats["model"]["avg_recommendations"] == 2.0
    assert stats["model-groq"]["avg_recommendations"] == 2.0


def test_analyze_returns_expected_keys():
    outcomes = [
        _outcome(
            "ok",
            {"category": "BOM", "probability": 0.9, "source": "model", "recommendations": ["dica"]},
            payload={"consumption_kwh": 300.0},
        ),
    ]
    result = analyze(outcomes, monotonicity_failures=[])
    assert set(result) == {
        "sources",
        "categories",
        "avg_probability_by_category",
        "recommendations_by_source",
        "alerts",
        "monotonicity_failures",
    }
    assert result["monotonicity_failures"] == []


def test_detect_all_no_alerts_when_healthy():
    outcomes = [
        _outcome(
            "ok",
            {
                "category": "BOM",
                "probability": 0.9,
                "source": "model",
                "recommendations": ["dica"],
            },
            payload={"consumption_kwh": 1200.0, "daily_consumption_distribution": CASA_MEDIA_DIST},
        ),
    ]
    assert detect_all(outcomes) == []
