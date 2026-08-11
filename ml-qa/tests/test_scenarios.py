"""Testes dos geradores de cenários (baseados em conjuntos de aparelhos)."""

from ml_qa.scenarios import ALL_GROUPS, generate_scenarios, resolve_groups
from ml_qa.scenarios.anomalies import generate_anomalies
from ml_qa.scenarios.appliance_sets import (
    ALL_SETS,
    aggregate_set,
    build_payload,
    set_by_name,
)
from ml_qa.scenarios.boundary import generate_boundary
from ml_qa.scenarios.catalog import fallback_contract
from ml_qa.scenarios.combinatorial import generate_combinatorial

CONTRACT = fallback_contract()


def test_generate_boundary_contains_core_groups():
    scenarios = generate_boundary(contract=CONTRACT)
    names = {s.name for s in scenarios}
    assert any("boundary/" in n for n in names)
    assert any("monotonic/" in n for n in names)
    assert any("peak=true" in n for n in names)


def test_generate_boundary_monotonic_scenarios_have_keys():
    scenarios = [
        s for s in generate_boundary(contract=CONTRACT) if s.monotonic_group == "consumption"
    ]
    assert len(scenarios) >= 2
    for s in scenarios:
        assert s.monotonic_key is not None
        assert isinstance(s.monotonic_key, float)


def test_generate_boundary_uses_appliance_sets():
    scenarios = generate_boundary(contract=CONTRACT)
    for s in scenarios:
        assert s.appliance_set is not None
        assert s.payload["property_type"] in CONTRACT.property_types
        assert "daily_consumption_distribution" in s.payload
        assert s.payload["equipment_quantity"] > 0


def test_generate_combinatorial_matrix_size():
    # len(ALL_SETS) x 3 níveis de consumo x 2 valores de peak + 9 thresholds.
    expected = len(ALL_SETS) * 3 * 2
    scenarios = generate_combinatorial(contract=CONTRACT)
    matrix = [s for s in scenarios if s.group == "combinatorial" and "threshold" not in s.name]
    assert len(matrix) == expected


def test_generate_combinatorial_products_from_catalog():
    scenarios = generate_combinatorial(contract=CONTRACT)
    matrix = [s for s in scenarios if "threshold" not in s.name]
    for s in matrix:
        products = s.payload.get("highest_consumption_products")
        if products:
            catalog_names = set(CONTRACT.appliance_names())
            assert set(products) <= catalog_names
        dist = s.payload["daily_consumption_distribution"]
        assert set(dist) == {
            "REFRIGERATION_WATTS",
            "HEATING_WATTS",
            "AIR_CONDITIONING_WATTS",
            "LIGHTING_WATTS",
        }


def test_generate_combinatorial_thresholds():
    thresholds = [s for s in generate_combinatorial(contract=CONTRACT) if "threshold" in s.name]
    assert len(thresholds) == 9  # 3 campos x 3 deltas


def test_generate_anomalies_all_expect_200():
    scenarios = generate_anomalies(contract=CONTRACT)
    assert all(s.expect_status == 200 for s in scenarios)
    assert len(scenarios) > 0
    for s in scenarios:
        assert s.payload["property_type"] in CONTRACT.property_types
        assert s.payload["consumption_kwh"] >= 0.01
        assert s.payload["high_consumption_hours"] >= 0.0
        assert "daily_consumption_distribution" in s.payload


def test_generate_all_scenarios_unique_names():
    scenarios = generate_scenarios(ALL_GROUPS, contract=CONTRACT)
    names = [s.name for s in scenarios]
    assert len(names) == len(set(names))
    assert len(scenarios) > 100


def test_appliance_sets_payload_derives_equipment():
    """O payload derivado do conjunto tem quantity coerente com os itens."""
    casa = set_by_name("casa-media")
    total_items = sum(qty for _, qty in casa.items)
    aggregation = aggregate_set(casa, CONTRACT)
    assert aggregation["equipment_quantity"] == total_items
    payload = build_payload(casa, 300.0, False, 5.0, CONTRACT)
    assert payload["equipment_quantity"] == total_items
    assert payload["property_type"] == "RESIDENCIAL"


def test_appliance_sets_products_known_by_ml():
    """Produtos de maior consumo são nomes do catálogo do ML."""
    for appliance_set in ALL_SETS:
        aggregation = aggregate_set(appliance_set, CONTRACT)
        for name in aggregation["highest_consumption_products"]:
            assert CONTRACT.appliance(name) is not None


def test_appliance_sets_category_like_frontend():
    """A categoria de maior consumo segue a regra do frontend: ml_category
    (de TODOS os aparelhos, incl. TECHNOLOGY/SERVICES) com maior watts total."""
    for appliance_set in ALL_SETS:
        aggregation = aggregate_set(appliance_set, CONTRACT)
        category = aggregation["highest_consumption_category"]
        assert category is not None, appliance_set.name
        # Watts por ml_category derivados diretamente do conjunto.
        from collections import defaultdict

        watts_by_cat: dict[str, float] = defaultdict(float)
        for name, qty in appliance_set.items:
            app = CONTRACT.appliance(name)
            assert app is not None, f"{name} fora do catálogo"
            watts_by_cat[app["ml_category"]] += float(app["watts"]) * qty
        expected_top = max(watts_by_cat, key=watts_by_cat.get)
        assert category == expected_top, appliance_set.name


def test_resolve_groups():
    assert resolve_groups(None) == ALL_GROUPS
    assert resolve_groups("all") == ALL_GROUPS
    assert resolve_groups("boundary,anomalies") == ("boundary", "anomalies")


def test_resolve_groups_invalid():
    import pytest

    with pytest.raises(ValueError):
        resolve_groups("nao-existe")
