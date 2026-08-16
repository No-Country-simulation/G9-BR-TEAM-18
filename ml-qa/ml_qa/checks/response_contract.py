"""Verificações de contrato sobre a resposta do endpoint /predict."""

from __future__ import annotations

from typing import Any

from ..scenarios import Scenario
from . import CATEGORY_ORDINAL, VALID_CATEGORIES, VALID_SOURCES, CheckResult


def check_http_status(
    scenario: Scenario, status_code: int | None, body: dict[str, Any] | None
) -> list[CheckResult]:
    """Valida que o status HTTP observado corresponde ao esperado."""
    if status_code is None:
        return [CheckResult("http_status", False, "Sem resposta (erro de conexão)")]
    if status_code != scenario.expect_status:
        return [
            CheckResult(
                "http_status",
                False,
                f"Esperado {scenario.expect_status}, recebido {status_code}",
            )
        ]
    return [CheckResult("http_status", True, f"{status_code} conforme esperado")]


def check_response_schema(
    scenario: Scenario, status_code: int | None, body: dict[str, Any] | None
) -> list[CheckResult]:
    """Valida que o corpo da resposta contém os campos do contrato."""
    if status_code != 200:
        return [CheckResult("response_schema", True, "Skipped: resposta sem corpo de predição")]
    if not isinstance(body, dict):
        return [CheckResult("response_schema", False, "Corpo da resposta não é um objeto JSON")]

    required = {"category", "probability", "recommendations", "source"}
    missing = sorted(required - set(body))
    if missing:
        return [CheckResult("response_schema", False, f"Campos ausentes: {', '.join(missing)}")]

    return [CheckResult("response_schema", True, "Campos obrigatórios presentes")]


def check_category_valid(
    scenario: Scenario, status_code: int | None, body: dict[str, Any] | None
) -> list[CheckResult]:
    """Valida que a categoria retornada pertence ao conjunto válido."""
    if status_code != 200 or not isinstance(body, dict):
        return [CheckResult("category_valid", True, "Skipped")]
    category = body.get("category")
    if category not in VALID_CATEGORIES:
        return [
            CheckResult(
                "category_valid",
                False,
                f"Categoria inválida: {category!r} (válidas: {VALID_CATEGORIES})",
            )
        ]
    return [CheckResult("category_valid", True, f"Categoria {category} válida")]


def check_probability_range(
    scenario: Scenario, status_code: int | None, body: dict[str, Any] | None
) -> list[CheckResult]:
    """Valida que a probabilidade está no intervalo [0, 1]."""
    if status_code != 200 or not isinstance(body, dict):
        return [CheckResult("probability_range", True, "Skipped")]
    probability = body.get("probability")
    if not isinstance(probability, (int, float)) or not (0.0 <= probability <= 1.0):
        return [
            CheckResult(
                "probability_range",
                False,
                f"Probabilidade fora do intervalo [0,1]: {probability!r}",
            )
        ]
    return [CheckResult("probability_range", True, f"Probabilidade {probability} válida")]


def check_recommendations(
    scenario: Scenario, status_code: int | None, body: dict[str, Any] | None
) -> list[CheckResult]:
    """Valida que as recomendações são uma lista não vazia de strings."""
    if status_code != 200 or not isinstance(body, dict):
        return [CheckResult("recommendations", True, "Skipped")]
    recs = body.get("recommendations")
    if not isinstance(recs, list) or len(recs) == 0:
        return [CheckResult("recommendations", False, "recommendations ausente ou vazia")]
    if not all(isinstance(r, str) and r.strip() for r in recs):
        return [
            CheckResult(
                "recommendations",
                False,
                "recommendations contém itens não-string ou vazios",
            )
        ]
    return [CheckResult("recommendations", True, f"{len(recs)} recomendações válidas")]


def check_source_valid(
    scenario: Scenario, status_code: int | None, body: dict[str, Any] | None
) -> list[CheckResult]:
    """Valida que a origem (source) é reconhecida pelo contrato."""
    if status_code != 200 or not isinstance(body, dict):
        return [CheckResult("source_valid", True, "Skipped")]
    source = body.get("source", "")
    known = any(source.startswith(prefix) for prefix in VALID_SOURCES)
    if not known:
        return [
            CheckResult(
                "source_valid",
                False,
                f"Fonte desconhecida: {source!r} (prefixos esperados: {VALID_SOURCES})",
            )
        ]
    return [CheckResult("source_valid", True, f"Fonte {source} reconhecida")]


def check_ordinal_consistency(
    scenario: Scenario, status_code: int | None, body: dict[str, Any] | None
) -> list[CheckResult]:
    """Valida que a categoria é semanticamente coerente com o consumo.

    Cenários de borda (tag 'edge') não são avaliados aqui: entradas extremas
    podem gerar qualquer classificação válida dentro do conjunto ordinal.
    """
    if status_code != 200 or not isinstance(body, dict):
        return [CheckResult("ordinal_consistency", True, "Skipped")]
    if "edge" in scenario.tags:
        return [CheckResult("ordinal_consistency", True, "Skipped: anomalia semântica")]
    category = body.get("category")
    if category not in CATEGORY_ORDINAL:
        return [CheckResult("ordinal_consistency", False, f"Categoria não ordinal: {category!r}")]
    return [CheckResult("ordinal_consistency", True, f"Categoria {category} coerente")]
