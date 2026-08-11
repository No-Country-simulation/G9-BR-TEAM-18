"""Relatório JSON: estruturado, comparável entre rodadas (diff-able)."""

from __future__ import annotations

import json

from ..runner import SuiteResult


def render_json(result: SuiteResult) -> str:
    """Serializa o resultado da suíte como JSON indentado."""
    return json.dumps(result.json(), ensure_ascii=False, indent=2)


def save_json(result: SuiteResult, path: str) -> None:
    """Grava o relatório JSON em um arquivo."""
    with open(path, "w", encoding="utf-8") as f:
        f.write(render_json(result))
