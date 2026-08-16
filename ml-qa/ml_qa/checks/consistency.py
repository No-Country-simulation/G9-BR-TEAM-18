"""Verificações de consistência entre cenários (monotonicidade).

A regra central: para um mesmo perfil de imóvel, aumentar o consumo mensal
(kWh) nunca deve produzir uma categoria MELHOR de eficiência energética.
"""

from __future__ import annotations

from typing import Any

from . import CATEGORY_ORDINAL


def check_monotonicity(outcomes: list[Any]) -> list[str]:
    """Valida a monotonicidade da categoria em relação ao consumo.

    `outcomes` são objetos `ScenarioOutcome` já executados. Retorna uma lista
    de mensagens de falha (vazia se tudo consistente).
    """
    failures: list[str] = []

    grouped: dict[str, list[Any]] = {}
    for outcome in outcomes:
        group = outcome.scenario.monotonic_group
        if group is None:
            continue
        grouped.setdefault(group, []).append(outcome)

    for group, members in grouped.items():
        # Ignora cenários sem resposta 200 (falha de rede/erro HTTP).
        completed = [m for m in members if m.status_code == 200 and isinstance(m.body, dict)]
        if len(completed) < 2:
            continue

        ordered = sorted(
            completed,
            key=lambda m: float(m.scenario.monotonic_key or 0),
        )

        for prev, curr in zip(ordered, ordered[1:], strict=False):
            prev_cat = prev.body.get("category")
            curr_cat = curr.body.get("category")
            if prev_cat not in CATEGORY_ORDINAL or curr_cat not in CATEGORY_ORDINAL:
                continue
            prev_ord = CATEGORY_ORDINAL[prev_cat]
            curr_ord = CATEGORY_ORDINAL[curr_cat]
            if curr_ord < prev_ord:
                failures.append(
                    f"[{group}] consumo {prev.scenario.monotonic_key} "
                    f"-> {curr.scenario.monotonic_key}: categoria melhorou "
                    f"de {prev_cat} para {curr_cat} (ordinal {prev_ord}->{curr_ord})"
                )

    return failures
