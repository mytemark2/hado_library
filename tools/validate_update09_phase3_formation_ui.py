#!/usr/bin/env python3
"""Validate Update09 Phase 3 formation UI contract."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORMATION = ROOT / "hado_formation.js"
TYPE_CANDIDATES = ROOT / "hado_type_candidates.js"
CSS = ROOT / "hado_styles.css"

REQUIRED_JS = (
    "formationEvaluationTypeDisplayName",
    "calculateFormationGeneralScoreRows",
    "calculateFormationAutoScores",
    "ensureFormationTypeScoreRulesLoaded",
    "getFormationTypeScoreRule",
    "formationTypeScoreEntity",
    "scorePolicy:'type-matched-item-count'",
    "<strong>${esc(scores.totalScore)}</strong>",
    "renderFormationScoreSummaryHtml",
    "formation-score-card",
    "formation-score-summary-head",
    "formation-score-summary-body",
    "formation-score-toggle-note",
    "${selectedEditorHtml}${quickSummaryHtml}${formationWarhorseEditorHtml}",
    "renderFormationGroupNameDialogHtml",
    "formationGroupDialogSelect",
    "formationGroupCreateBtn",
    "formationGroupDeleteBtn",
    "renderFormationMemoDialogHtml",
    "formationGroupRenameBtn",
    "formationMemoEditBtn",
    "Update09 Phase3 uses popup editing for PC and mobile",
    "state.formationSlotDialogOpen=true",
    "getWarhorseAssignmentOptionLabel",
    "setFormationWarhorseSlot",
    "renderFormationWarhorseSlotsHtml",
    "formation-warhorse-slots-body",
)
FORBIDDEN_JS = (
    "formationEvaluationTypeInput",
    "formationTotalScoreInput",
    "<strong>${esc(scores.totalScore)}点</strong>",
    "評価:${esc(scores.evaluationScore)}点",
    "formationEvaluationScoreInput",
    "formationEvaluationSaveBtn",
    "履歴へ保存",
    "評価型ID",
    "編集はポップアップで行います",
    "data-formation-warhorse-edit",
    "data-formation-warhorse-remove",
)
REQUIRED_TYPE_CANDIDATES = (
    "typeCandidateViewModeLabel",
    "全データ表示",
    "window.HADO_TYPE_SCORE_RULES=st.data.types",
    "評価項目別スコア: ${esc(window.HadoTypeScore.summary(v._s))}",
    "保存データ表示",
    "選択中の型: ${esc(type()?.typeName||'未選択')} / 目的: ${esc(purpose()?.purposeName||'指定なし')} / ${esc(typeCandidateViewModeLabel())}",
)
FORBIDDEN_TYPE_CANDIDATES = (
    "候補をクリックすると選択状態になります",
    "savedCandidateNote()",
    "${esc(displayVersion())} / 選択中の型",
    "トータルスコア: <strong>${esc(v._s?.totalScore||0)}件</strong>",
    "適合スコア: <strong>${esc(window.HadoTypeScore.label(v._s))}</strong> / 評価スコア",
)
REQUIRED_CSS = (
    ".formation-group-controls",
    ".formation-group-title",
    ".formation-score-card",
    ".formation-score-summary",
    ".formation-score-breakdown",
    ".formation-score-summary>summary",
    ".formation-score-summary-body",
    ".formation-score-toggle-note",
    "formation-selected-card.formation-score-card:not(.is-dialog)",
    "formation-quick-summary-strip",
    ".formation-warhorse-slots-body",
    ".formation-memo-inline",
    ".formation-dialog-actions",
)
FORBIDDEN_CSS = (
    ".formation-score-field",
    ".formation-selected-popup-prompt",
)


def main() -> int:
    js = FORMATION.read_text(encoding="utf-8")
    type_js = TYPE_CANDIDATES.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    missing_js = [snippet for snippet in REQUIRED_JS if snippet not in js]
    forbidden_js = [snippet for snippet in FORBIDDEN_JS if snippet in js]
    missing_type = [snippet for snippet in REQUIRED_TYPE_CANDIDATES if snippet not in type_js]
    forbidden_type = [snippet for snippet in FORBIDDEN_TYPE_CANDIDATES if snippet in type_js]
    missing_css = [snippet for snippet in REQUIRED_CSS if snippet not in css]
    forbidden_css = [snippet for snippet in FORBIDDEN_CSS if snippet in css]
    if missing_js:
        raise SystemExit("Update09 Phase3 formation UI missing JS: " + ", ".join(missing_js))
    if forbidden_js:
        raise SystemExit("Update09 Phase3 formation UI still contains removed controls: " + ", ".join(forbidden_js))
    if missing_type:
        raise SystemExit("Update09 Phase3 type candidate UI missing JS: " + ", ".join(missing_type))
    if forbidden_type:
        raise SystemExit("Update09 Phase3 type candidate UI still contains removed notes: " + ", ".join(forbidden_type))
    if missing_css:
        raise SystemExit("Update09 Phase3 formation UI missing CSS: " + ", ".join(missing_css))
    if forbidden_css:
        raise SystemExit("Update09 Phase3 formation UI still contains obsolete CSS: " + ", ".join(forbidden_css))
    print("Update09 Phase3 formation UI contract ok: score card, group management, type notes, warhorse layout")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
