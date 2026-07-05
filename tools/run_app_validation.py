#!/usr/bin/env python3
"""Run the same local checks as .github/workflows/app-validation.yml.

This script is intentionally kept close to the workflow so Codex/self-checks can
run one command before reporting completion instead of accidentally omitting a
validator that CI will execute.
"""
from __future__ import annotations

import glob
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

COMMANDS: list[list[str]] = [
    ["node", "--check", "hado_version.js"],
    ["node", "--check", "hado_update_meta.js"],
    ["node", "--check", "hado_core.js"],
    ["node", "--check", "hado_formation.js"],
    ["node", "--check", "hado_type_candidates.js"],
    ["node", "--check", "hado_type_entry.js"],
    ["node", "--check", "hado_candidate_tray.js"],
    ["python3", "-m", "json.tool", "HADO_DEV_INFO.json"],
]

for report in sorted(glob.glob(str(ROOT / "report" / "*.json"))):
    COMMANDS.append(["python3", "-m", "json.tool", str(Path(report).relative_to(ROOT))])

COMMANDS.extend(
    [
        ["python3", "tools/validate_app_js.py"],
        ["python3", "tools/validate_external_css.py"],
        ["python3", "tools/validate_preview_workflow.py"],
        ["node", "tools/test_notify_preview_workflow_no_preview_workflow_edit.js"],
        ["node", "--check", "tools/test_update09_5_28_public_json_load_regression.js"],
        ["node", "tools/test_update09_5_28_public_json_load_regression.js"],
        ["node", "--check", "tools/test_update09_5_29_disadvantage_display_labels.js"],
        ["node", "tools/test_update09_5_29_disadvantage_display_labels.js"],
        ["node", "--check", "tools/test_update09_5_30_candidate_score_display_hierarchy.js"],
        ["node", "tools/test_update09_5_30_candidate_score_display_hierarchy.js"],
    ["node", "--check", "tools/test_update09_5_34_score_evidence_dedup.js"],
    ["node", "tools/test_update09_5_34_score_evidence_dedup.js"],
        ["python3", "tools/validate_legacy_hado_app_not_loaded.py"],
        ["python3", "tools/validate_update_version_consistency.py"],
        ["python3", "tools/validate_update09_phase4_guides.py"],
        ["python3", "tools/validate_update09_phase5_type_candidate_flow.py"],
        ["python3", "tools/validate_update09_phase5_score_target_scope.py"],
        ["node", "tools/validate_type_score_catalog_schema.js"],
        ["node", "tools/build_type_score_trigger_catalog.js", "--check"],
        ["node", "tools/build_type_score_trigger_catalog.js", "--sample"],
        ["node", "tools/test_update09_phase5_type_score_catalogs.js"],
        ["node", "--check", "tools/test_update09_phase5_runtime_catalog_consistency.js"],
        ["node", "tools/test_update09_phase5_runtime_catalog_consistency.js"],
        ["node", "--check", "tools/test_update09_phase5_all_type_score_runtime_bridge.js"],
        ["node", "tools/test_update09_phase5_all_type_score_runtime_bridge.js"],
        ["node", "--check", "tools/test_update09_phase5_type_score_runtime_bridge.js"],
        ["node", "tools/test_update09_phase5_type_score_runtime_bridge.js"],
        ["node", "tools/test_update09_phase5_formation_score_evidence_bridge.js"],
        ["node", "--check", "tools/test_update09_phase5_candidate_to_formation_score_evidence.js"],
        ["node", "tools/test_update09_phase5_candidate_to_formation_score_evidence.js"],
        ["node", "tools/test_update09_phase5_score_evidence_normalization.js"],
        ["node", "tools/test_update09_phase5_zero_primary_type_score_diagnostics.js"],
        ["python3", "tools/validate_type_candidate_saved_name_matching.py"],
        ["python3", "tools/validate_saved_mode_index_ownership_sources.py"],
        ["python3", "tools/validate_saved_type_candidates_zero_score_visible.py"],
        ["python3", "tools/validate_type_candidate_render_performance.py"],
        ["python3", "tools/validate_type_search_feature_index_data.py"],
        ["python3", "tools/validate_formation_link_helpers.py"],
        ["python3", "tools/validate_update09_phase3_formation_ui.py"],
        ["python3", "tools/validate_update09_phase4_guides.py"],
        ["python3", "tools/validate_formation_score_tag_only.py"],
        ["python3", "tools/validate_formation_score_total_scope.py"],
        ["python3", "tools/validate_formation_responsive_layout_contract.py"],
        ["node", "tools/test_type_score.js"],
        ["node", "tools/test_update09_phase5_score_target_scope.js"],
        ["node", "tools/test_formation_type_score_render.js"],
        ["node", "tools/test_saved_type_candidate_filter.js"],
        ["node", "tools/test_type_candidate_counts.js"],
        ["node", "tools/test_type_candidate_diagnostics.js"],
        ["node", "hado_status_effect_regression.js"],
        ["python3", "-c", "import pathlib,sys; sys.exit(1 if pathlib.Path('updates/queue').exists() else 0)"],
        ["git", "diff", "--check"],
    ]
)


def main() -> int:
    for idx, cmd in enumerate(COMMANDS, 1):
        print(f"[{idx}/{len(COMMANDS)}] $ {' '.join(cmd)}", flush=True)
        result = subprocess.run(cmd, cwd=ROOT)
        if result.returncode != 0:
            print(f"app validation failed: {' '.join(cmd)}", file=sys.stderr)
            return result.returncode
    print(f"app validation self-check passed: {len(COMMANDS)} commands")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
