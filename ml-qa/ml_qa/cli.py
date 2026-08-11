"""CLI do módulo ml-qa.

Exemplos:

    # Rodada completa contra o ML local (Docker):
    python -m ml_qa.cli

    # Somente o grupo de anomalias, com saída personalizada:
    python -m ml_qa.cli --scenarios anomalies --report-dir ./reports

    # Apenas verificação de contrato, sem relatório:
    python -m ml_qa.cli --report none

    # Alvo diferente (ex.: deploy Render):
    python -m ml_qa.cli --base-url https://energiai-ml-service.onrender.com
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .report import save_analysis_files, save_json, save_markdown
from .runner import DEFAULT_BASE_URL, DEFAULT_MAX_RPM, run_suite
from .scenarios import resolve_groups


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ml-qa",
        description="Suíte de testes exaustivos (black-box) para o ML Service da EnergiAI.",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"URL base do ML Service (default: {DEFAULT_BASE_URL})",
    )
    parser.add_argument(
        "--scenarios",
        default="all",
        help="Grupos de cenários: all, boundary, combinatorial, anomalies (separados por vírgula)",
    )
    parser.add_argument(
        "--report-dir",
        default="reports",
        help="Diretório de saída dos relatórios (default: reports)",
    )
    parser.add_argument(
        "--report",
        default="json,markdown",
        help="Formatos de relatório: json, markdown, none (separados por vírgula)",
    )
    parser.add_argument(
        "--max-rpm",
        type=int,
        default=DEFAULT_MAX_RPM,
        help=(
            "Máximo de requisições por minuto ao ML Service, com espaçamento "
            "uniforme. Default: 12 (cada cenário com confiança < 80% aciona o "
            "Groq, cujo limite gratuito é 25 chamadas/min; 12 req/min mantém "
            "margem segura). Use 0 para desativar o controle de taxa."
        ),
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    try:
        groups = resolve_groups(args.scenarios)
    except ValueError as exc:
        print(f"[ml-qa] Erro: {exc}", file=sys.stderr)
        return 2

    max_rpm = None if args.max_rpm == 0 else args.max_rpm
    if max_rpm:
        print(f"[ml-qa] Controle de taxa ativo: máx {max_rpm} req/min")
    print(f"[ml-qa] Executando suíte contra {args.base_url} ...")
    result = run_suite(base_url=args.base_url, groups=groups, max_rpm=max_rpm)
    print(
        f"[ml-qa] {result.total} cenários, {result.passed} aprovados, "
        f"{result.failed} falhas ({result.success_rate}%) em "
        f"{result.duration_ms / 1000:.2f}s"
    )
    if result.consistency_failures:
        failures = len(result.consistency_failures)
        print(f"[ml-qa] {failures} falha(s) de consistência (monotonicidade)")

    formats = {f.strip().lower() for f in args.report.split(",") if f.strip()}
    if "none" in formats:
        return 0 if result.failed == 0 else 1

    report_dir = Path(args.report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)

    for fmt in formats:
        if fmt == "json":
            path = report_dir / "ml-qa-report.json"
            save_json(result, str(path))
            print(f"[ml-qa] Relatório JSON: {path}")
        elif fmt == "markdown":
            path = report_dir / "ml-qa-report.md"
            save_markdown(result, str(path))
            analyses_dir = report_dir / "analyses"
            analysis_files = save_analysis_files(result, str(analyses_dir))
            print(f"[ml-qa] Relatório Markdown: {path}")
            print(f"[ml-qa] Análises detalhadas ({len(analysis_files)}): {analyses_dir}")

    return 0 if result.failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
