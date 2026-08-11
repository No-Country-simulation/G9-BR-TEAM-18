"""Geração de relatórios a partir de um SuiteResult."""

from .json_report import render_json, save_json
from .markdown_report import (
    render_analysis_markdown,
    render_markdown,
    save_analysis_files,
    save_markdown,
)

__all__ = [
    "render_analysis_markdown",
    "render_json",
    "save_analysis_files",
    "save_json",
    "render_markdown",
    "save_markdown",
]
