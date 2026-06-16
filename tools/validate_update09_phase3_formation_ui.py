#!/usr/bin/env python3
"""Validate Update09 Phase 3 formation UI contract."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORMATION = ROOT / "hado_formation.js"
TYPE_CANDIDATES = ROOT / "hado_type_candidates.js"
CSS = ROOT / "hado_styles.css"
HTML = ROOT / "index.html"

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
    "calculateFormationMemberScoreRows",
    "type-member-matched-item-count",
    "total-score-is-five-evaluation-score-sum",
    "評価スコアを表示",
    "formation-score-card",
    "formation-score-summary-head",
    "formation-score-summary-body",
    "formation-score-toggle-note",
    "formation-work-tabs-title",
    "formation-score-chip",
    "formation-group-head",
    "renderFormationTeamBoardSelectableHtml(f,selectedEditorHtml+quickSummaryHtml)",
    "formation-mobile-score-result-placement",
    "${formationWarhorseEditorHtml}${selectedEditorHtml}${quickSummaryHtml}",
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
    "scoreRows:generalRows.map",
    "保存データの軍馬を最大3枠まで部隊へ反映",
    "<h3>軍馬</h3>",
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
    "body.formation-tab #formationScreen>h2",
    ".formation-work-tabs-title",
    ".formation-score-generals{grid-template-columns:repeat(5",
    ".formation-quick-summary-list{display:grid!important",
    "formation-selected-card.formation-score-card:not(.is-dialog)",
    ".formation-mobile-score-result-placement",
    "formation-selected-stack>.formation-quick-summary-strip",
    "formation-quick-summary-strip",
    ".formation-warhorse-slots-body",
    ".formation-memo-inline",
    ".formation-group-head",
    "body.formation-tab .formation-compose-bar-grid .formation-memo-inline",
    "body.formation-tab .formation-score-meta{grid-template-columns:repeat(3",
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
    html_text = HTML.read_text(encoding="utf-8")
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
    forbidden_html = [s for s in ("※部隊編成の合算技能は配置・好相性・兵科などの条件を判定して反映します。", "<h2>部隊編成") if s in html_text]
    if forbidden_html:
        raise SystemExit("Update09 Phase3 formation UI still contains obsolete HTML: " + ", ".join(forbidden_html))
    print("Update09 Phase3 formation UI contract ok: score card, group management, type notes, warhorse layout")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
