"""
Audit script for the model/Groq/rule-based split in production predictions.

Reads treino_feedback.jsonl and reports the distribution of the "source"
field across all logged predictions, so the actual real-world usage of
each prediction path can be checked against what training-time confidence
metrics would suggest (see ADR-0049 and the peak_hour_usage investigation
in ADR-0046/Q007).

Usage:
    python3 scripts/audit_prediction_sources.py
    python3 scripts/audit_prediction_sources.py --path /custom/path/treino_feedback.jsonl
"""

import argparse
import json
import os
import re
from collections import Counter


def normalize_source(source: str) -> str:
    """Collapse sources like 'model (confidence 76.4%)' into a fixed bucket,
    so percentages embedded in the string don't fragment the count."""
    if source == "model":
        return "model"
    if source.startswith("model+groq"):
        return "model+groq"
    if source.startswith("model ("):
        return "model (low confidence, groq unavailable)"
    if source.startswith("rule-based (model error)"):
        return "rule-based (model error)"
    if source.startswith("rule-based (model unavailable)"):
        return "rule-based (model unavailable)"
    if source.startswith("rule-based (groq failed)"):
        return "rule-based (groq failed)"
    return f"other: {source}"


def audit(path: str) -> None:
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    counts: Counter[str] = Counter()
    total = 0
    parse_errors = 0

    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                parse_errors += 1
                continue
            source = entry.get("source", "")
            counts[normalize_source(source)] += 1
            total += 1

    if total == 0:
        print("No records found.")
        return

    print(f"Total predictions logged: {total}")
    if parse_errors:
        print(f"Lines skipped (parse errors): {parse_errors}")
    print()
    print(f"{'source':45s} {'count':>8s} {'%':>7s}")
    print("-" * 62)
    for source, count in counts.most_common():
        pct = 100 * count / total
        print(f"{source:45s} {count:>8d} {pct:>6.1f}%")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--path",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "treino_feedback.jsonl"),
        help="Path to treino_feedback.jsonl (default: ml-service/treino_feedback.jsonl)",
    )
    args = parser.parse_args()
    audit(os.path.abspath(args.path))