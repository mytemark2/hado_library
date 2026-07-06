#!/usr/bin/env python3
"""Validate that the removed legacy hado_app.js bundle is not active runtime.

The active app is assembled from split scripts in index.html. This guard exists
so Phase/update work does not recreate or load the removed legacy bundle and then
assume changes there are visible in the running app.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
LEGACY = ROOT / "hado_app.js"
CORE = ROOT / "hado_core.js"
RULES = ROOT / "docs" / "HADO_GITHUB_OPERATION_RULES.md"

REQUIRED_ACTIVE_SCRIPTS = (
    "hado_core.js",
    "hado_formation.js",
    "hado_search.js",
    "hado_bootstrap.js",
    "hado_type_entry.js",
    "hado_type_candidates.js",
    "hado_candidate_tray.js",
)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> int:
    index_text = INDEX.read_text(encoding="utf-8")
    core_text = CORE.read_text(encoding="utf-8")
    rules_text = RULES.read_text(encoding="utf-8")

    require(not LEGACY.exists(), "removed legacy hado_app.js must not be recreated")
    require("hado_app.js" not in index_text, "index.html must not load removed legacy hado_app.js")
    for script in REQUIRED_ACTIVE_SCRIPTS:
        require(script in index_text, f"index.html is missing active runtime script: {script}")
    require("function getGuidedTourDefinitions" in core_text, "guided tour definitions must live in active hado_core.js")
    require("legacy monolithic artifact は削除済み" in rules_text, "operation rules must document that the legacy hado_app.js artifact was removed")

    print("legacy hado_app.js guard ok: removed artifact is not recreated or loaded; active runtime uses split scripts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
