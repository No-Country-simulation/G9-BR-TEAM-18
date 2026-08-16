"""Testes do runner e dos relatórios (com mocks HTTP)."""

from pathlib import Path
from unittest.mock import patch

import pytest

from ml_qa.report import render_analysis_markdown, render_markdown, save_analysis_files
from ml_qa.runner import RateLimiter, run_suite
from ml_qa.scenarios.catalog import fallback_contract

CONTRACT = fallback_contract()


def test_run_suite_with_mocked_http():
    def fake_post(self, url, json=None):
        from types import SimpleNamespace

        return SimpleNamespace(
            status_code=200,
            json=lambda: {
                "category": "MEDIANO",
                "probability": 0.78,
                "recommendations": ["Dica"],
                "source": "model",
            },
        )

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("boundary",), max_rpm=None, contract=CONTRACT)

    assert result.total > 0
    assert result.failed == 0
    assert result.passed == result.total


def test_run_suite_reports_http_error():
    def fake_post(self, url, json=None):
        from types import SimpleNamespace

        return SimpleNamespace(status_code=422, json=lambda: {"detail": "invalido"})

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("anomalies",), max_rpm=None, contract=CONTRACT)

    # Todas as anomalias esperam 200; o mock retorna 422, então falham.
    assert result.total > 0
    assert result.failed == result.total


def test_render_json_contains_totals():
    def fake_post(self, url, json=None):
        from types import SimpleNamespace

        return SimpleNamespace(
            status_code=200,
            json=lambda: {
                "category": "BOM",
                "probability": 0.85,
                "recommendations": ["Dica"],
                "source": "model",
            },
        )

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("boundary",), max_rpm=None, contract=CONTRACT)

    data = result.json()
    assert data["totals"]["total"] > 0
    assert data["totals"]["success_rate"] == 100.0


def test_render_markdown_contains_sections():
    def fake_post(self, url, json=None):
        from types import SimpleNamespace

        return SimpleNamespace(
            status_code=200,
            json=lambda: {
                "category": "BOM",
                "probability": 0.85,
                "recommendations": ["Dica"],
                "source": "model",
            },
        )

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("boundary",), max_rpm=None, contract=CONTRACT)

    md = render_markdown(result)
    assert "# Relatório de Testes Exaustivos" in md
    assert "## Resumo" in md
    assert "## Distribuição de Fontes" in md
    assert "## Distribuição de Categorias" in md
    assert "## Inconsistências e Alertas" in md
    assert "## Detalhamento dos Cenários" in md
    assert "## Cenários Falhos" in md
    assert "Nenhuma falha" in md


def test_markdown_detail_table_columns_aligned():
    """O cabeçalho da tabela de detalhamento tem o mesmo nº de colunas das linhas."""

    def fake_post(self, url, json=None):
        from types import SimpleNamespace

        return SimpleNamespace(
            status_code=200,
            json=lambda: {
                "category": "BOM",
                "probability": 0.85,
                "recommendations": ["Dica"],
                "source": "model",
            },
        )

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("boundary",), max_rpm=None, contract=CONTRACT)

    md = render_markdown(result)
    lines = md.splitlines()
    start = next(i for i, line in enumerate(lines) if line.startswith("| Cenário |"))
    header = lines[start]
    header_cols = header.count("|") - 1
    for row in lines[start + 2 :]:
        if not row.startswith("|"):
            break
        assert row.count("|") - 1 == header_cols, (
            f"linha com {row.count('|') - 1} colunas, cabeçalho com {header_cols}: {row[:60]}"
        )


def test_markdown_ends_with_single_newline():
    def fake_post(self, url, json=None):
        from types import SimpleNamespace

        return SimpleNamespace(
            status_code=200,
            json=lambda: {
                "category": "BOM",
                "probability": 0.85,
                "recommendations": ["Dica"],
                "source": "model",
            },
        )

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("boundary",), max_rpm=None, contract=CONTRACT)

    md = render_markdown(result)
    assert md.endswith("\n")
    assert not md.endswith("\n\n")


def test_analysis_file_contains_equipment_breakdown(tmp_path: Path):
    """O arquivo por análise traz a tabela de equipamentos como o frontend."""

    def fake_post(self, url, json=None):
        from types import SimpleNamespace

        return SimpleNamespace(
            status_code=200,
            json=lambda: {
                "category": "MEDIANO",
                "probability": 0.7,
                "recommendations": ["Dica 1", "Dica 2"],
                "source": "model",
            },
        )

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("boundary",), max_rpm=None, contract=CONTRACT)

    paths = save_analysis_files(result, str(tmp_path))
    real = sum(1 for o in result.outcomes if o.scenario.group != "consistency")
    assert len(paths) == real
    files = list(tmp_path.glob("*.md"))
    assert files
    content = files[0].read_text(encoding="utf-8")
    assert "## Detalhamento por Equipamento" in content
    assert "| Equipamento | Qtd | Potência (W) | Uso/dia (h) | kWh/mês |" in content
    assert "| **Total** |" in content
    assert "## Payload enviado" in content
    assert "## Resposta do ML" in content
    assert "### Recomendações" in content
    assert "- Dica 1" in content
    assert "## Verificações" in content


def test_analysis_file_uses_real_appliance_data():
    """A tabela usa watts/horas reais do catálogo e calcula kWh/mês correto."""

    def fake_post(self, url, json=None):
        from types import SimpleNamespace

        return SimpleNamespace(
            status_code=200,
            json=lambda: {
                "category": "BOM",
                "probability": 0.8,
                "recommendations": ["Dica"],
                "source": "model",
            },
        )

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("anomalies",), max_rpm=None, contract=CONTRACT)

    # A análise do cenário 'edge/empty-set' não tem equipamentos.
    empty = next(o for o in result.outcomes if o.scenario.name == "anomaly/edge/empty-set")
    md_empty = render_analysis_markdown(empty)
    assert "_Nenhum equipamento no conjunto" in md_empty

    # A análise de um cenário com conjunto deve ter pelo menos uma linha com kWh.
    with_set = next(o for o in result.outcomes if o.scenario.appliance_details)
    md = render_analysis_markdown(with_set)
    assert "| Geladeira | 1 | 150 | 24.0 | 108.0 |" in md


def test_consolidated_report_links_analyses(tmp_path: Path):
    """O relatório consolidado lista as análises detalhadas com links."""

    def fake_post(self, url, json=None):
        from types import SimpleNamespace

        return SimpleNamespace(
            status_code=200,
            json=lambda: {
                "category": "BOM",
                "probability": 0.85,
                "recommendations": ["Dica"],
                "source": "model",
            },
        )

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("boundary",), max_rpm=None, contract=CONTRACT)

    md = render_markdown(result)
    assert "## Análises Detalhadas" in md
    assert "[`boundary/" in md
    assert "(analyses/" in md


def test_run_suite_invalid_group():
    with pytest.raises(ValueError):
        run_suite(groups=("inexistente",), contract=CONTRACT)


def test_fallback_contract_has_realistic_values():
    """O contrato fallback 3.0.0 contém apenas valores possíveis no fluxo real."""
    contract = fallback_contract()
    assert contract.property_types
    assert contract.consumption_categories
    assert contract.appliances
    assert all(app["name"] for app in contract.appliances)


def test_fetch_contract_fallback_on_connection_error():
    """fetch_contract não levanta quando o ML está fora; usa o fallback."""
    import httpx

    from ml_qa.scenarios.catalog import fetch_contract

    def fake_get(self, url, **kwargs):
        raise httpx.ConnectError("connection refused")

    with patch("httpx.Client.get", fake_get):
        contract = fetch_contract("http://ml:8000")
    assert len(contract.property_types) > 0
    assert len(contract.appliances) > 0
    # Sem rede, os valores são exatamente os do fallback 3.0.0.
    assert set(contract.property_types) == set(fallback_contract().property_types)


def test_rate_limiter_spaces_requests_uniformly():
    import time

    # max_rpm=120 em janela de 60s => 1 requisição a cada 0.5s.
    limiter = RateLimiter(max_rpm=120, window_seconds=60.0)
    start = time.monotonic()
    limiter.wait()
    limiter.wait()
    elapsed = time.monotonic() - start
    assert elapsed >= 0.45, f"esperava espaçamento ~0.5s, decorreu {elapsed:.3f}s"


def test_rate_limiter_never_bursts():
    """A primeira chamada não libera rajada: o intervalo é sempre respeitado."""
    import time

    limiter = RateLimiter(max_rpm=600, window_seconds=60.0)  # 1 req a cada 0.1s
    start = time.monotonic()
    for _ in range(3):
        limiter.wait()
    elapsed = time.monotonic() - start
    assert elapsed >= 0.19, f"3 requisições a 0.1s deveriam levar >= 0.2s, levou {elapsed:.3f}s"


def test_rate_limiter_disabled_when_none():
    import time

    limiter = RateLimiter(max_rpm=None)
    start = time.monotonic()
    for _ in range(5):
        limiter.wait()
    elapsed = time.monotonic() - start
    assert elapsed < 1.0


def test_run_suite_accepts_max_rpm_zero_fast():
    def fake_post(self, url, json=None):
        from types import SimpleNamespace

        return SimpleNamespace(
            status_code=200,
            json=lambda: {
                "category": "BOM",
                "probability": 0.9,
                "recommendations": ["Dica"],
                "source": "model",
            },
        )

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("boundary",), max_rpm=None, contract=CONTRACT)
    assert result.passed == result.total


def test_run_suite_connection_error_reports_failure():
    import httpx

    def fake_post(self, url, json=None):
        raise httpx.ConnectError("connection refused")

    with patch("httpx.Client.post", fake_post):
        result = run_suite(groups=("boundary",), max_rpm=None, contract=CONTRACT)

    assert result.total > 0
    assert result.failed == result.total
    # O check de status deve reportar falha de conexão.
    failed = [o for o in result.outcomes if not o.passed]
    assert all(o.status_code is None for o in failed)
    assert any(c.name == "http_status" for o in failed for c in o.checks)
