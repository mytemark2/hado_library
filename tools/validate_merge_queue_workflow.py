#!/usr/bin/env python3
"""Validate the pull request / merge queue validation workflow contract."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "app-validation.yml"
REQUIRED = (
    "name: App Validation",
    "pull_request:",
    "merge_group:",
    "app-validation:",
    "name: app-validation",
    "uses: actions/checkout@v5",
    "node --check hado_type_candidates.js",
    "python3 tools/validate_app_js.py",
    "python3 tools/validate_update_version_consistency.py",
    "python3 tools/validate_auto_merge_workflow.py",
    "python3 tools/validate_saved_mode_index_ownership_sources.py",
    "python3 tools/validate_type_candidate_render_performance.py",
    "python3 tools/validate_update09_phase3_formation_ui.py",
    "node tools/test_type_score.js",
    "node tools/test_saved_type_candidate_filter.js",
    "node tools/test_type_candidate_counts.js",
    "node tools/test_type_candidate_diagnostics.js",
    "node hado_status_effect_regression.js",
    "git diff --check",
)


def main() -> int:
    if not WORKFLOW.is_file():
        raise SystemExit("app validation workflow is missing")
    text = WORKFLOW.read_text(encoding="utf-8")
    missing = [snippet for snippet in REQUIRED if snippet not in text]
    if missing:
        raise SystemExit("app validation workflow missing: " + ", ".join(missing))
    print("merge queue workflow ok: App Validation / app-validation supports pull_request and merge_group")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
