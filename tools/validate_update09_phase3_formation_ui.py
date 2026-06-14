#!/usr/bin/env python3
"""Validate Update09 Phase 3 formation UI contract."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORMATION = ROOT / "hado_formation.js"
CSS = ROOT / "hado_styles.css"

REQUIRED_JS = (
    "formationEvaluationTypeDisplayName",
    "calculateFormationAutoScores",
    "renderFormationScoreSummaryHtml",
    "renderFormationGroupNameDialogHtml",
    "renderFormationMemoDialogHtml",
    "formationGroupRenameBtn",
    "formationMemoEditBtn",
    "Update09 Phase3 uses popup editing for PC and mobile",
    "state.formationSlotDialogOpen=true",
)
FORBIDDEN_JS = (
    "formationEvaluationTypeInput",
    "formationTotalScoreInput",
    "formationEvaluationScoreInput",
    "formationEvaluationSaveBtn",
    "履歴へ保存",
    "評価型ID",
)
REQUIRED_CSS = (
    ".formation-group-controls",
    ".formation-score-summary",
    ".formation-score-breakdown",
    ".formation-memo-inline",
    ".formation-dialog-actions",
)


def main() -> int:
    js = FORMATION.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    missing_js = [snippet for snippet in REQUIRED_JS if snippet not in js]
    forbidden_js = [snippet for snippet in FORBIDDEN_JS if snippet in js]
    missing_css = [snippet for snippet in REQUIRED_CSS if snippet not in css]
    if missing_js:
        raise SystemExit("Update09 Phase3 formation UI missing JS: " + ", ".join(missing_js))
    if forbidden_js:
        raise SystemExit("Update09 Phase3 formation UI still contains removed controls: " + ", ".join(forbidden_js))
    if missing_css:
        raise SystemExit("Update09 Phase3 formation UI missing CSS: " + ", ".join(missing_css))
    print("Update09 Phase3 formation UI contract ok: group/memo dialogs, read-only scores, popup editing")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
