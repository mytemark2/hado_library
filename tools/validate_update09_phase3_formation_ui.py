#!/usr/bin/env python3
"""Validate Update09 Phase 3 formation UI contract."""
from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
FORMATION = ROOT / "hado_formation.js"
TYPE_CANDIDATES = ROOT / "hado_type_candidates.js"
TYPE_ENTRY = ROOT / "hado_type_entry.js"
CSS = ROOT / "hado_styles.css"
HTML = ROOT / "index.html"
UPDATE_META = ROOT / "hado_update_meta.js"

REQUIRED_JS = (
    "formationEvaluationTypeDisplayName",
    "calculateFormationGeneralScoreRows",
    "calculateFormationAutoScores",
    "calculateFormationTypeScore",
    "buildFormationEffectScoreEntity",
    "formation-effect-score-selected-type",
    "formation-effect-score-candidates",
    "candidateScores",
    "calculationInvoked:true",
    "reason:''",
    "debugLog('typeScore'",
    "recordFormationTypeScoreDiagnostic",
    "mode:'formation-score'",
    "formation-score-candidates",
    "ensureFormationTypeScoreRulesLoaded",
    "getFormationTypeScoreRule",
    "<strong>${esc(visibleTotalScore)}</strong>",
    "renderFormationScoreSummaryHtml",
    "calculateFormationMemberScoreRows",
    "formation:type-score-member-resolve",
    "total-score-is-five-evaluation-score-sum",
    "formationScore:render",
    "formationScore:visible",
    "formationScore:empty",
    "formationScore:detail-bind",
    "formationScore:detail-click",
    "formationScore:detail-delegate",
    "handleFormationScoreDetailClick",
    "event.preventDefault();event.stopPropagation();",
    "normalizeFormationScoreDisplayRows",
    "formation-score-card",
    "formation-score-summary-head",
    "formation-score-summary-body",
    "<section class=\"formation-selected-card formation-score-card",
    "formation-work-tabs-title",
    "formation-score-chip",
    "formation-group-select",
    "formation-mobile-score-result-placement",
    "${formationWarhorseEditorHtml}${scoreCardHtml}${quickSummaryHtml}",
    "renderFormationGroupNameDialogHtml",
    "formationGroupDialogSelect",
    "formationGroupCreateBtn",
    "formationGroupDeleteBtn",
    "renderFormationMemoDialogHtml",
    "formationGroupRenameBtn",
    "data-formation-group-manage",
    "data-formation-group-select",
    "formationGroup:manage-click",
    "formationGroup:dialog-open",
    'id="formationNewBtn" class="btn-select-all">新規</button>',
    "querySelectorAll('[data-formation-group-manage],#formationGroupRenameBtn')",
    "function resetFormationListPanelScroll()",
    "formationListPanel:viewport-sync",
    "--formation-left-panel-top",
    "function calculateFormationFixedPanelTop()",
    "panel.scrollTop=0",
    "requestAnimationFrame(resetFormationListPanelScroll)",
    "setTimeout(resetFormationListPanelScroll,80)",
        "setTimeout(resetFormationListPanelScroll,250)",
        "setTimeout(resetFormationListPanelScroll,600)",
        "panel.scrollTo({top:0,left:0,behavior:'auto'})",
    "formationMemoEditBtn",
    "Update09 Phase3 uses popup editing for PC and mobile",
    "state.formationSlotDialogOpen=true",
    "getWarhorseAssignmentOptionLabel",
    "setFormationWarhorseSlot",
    "renderFormationWarhorseSlotsHtml",
    "formation-warhorse-slots-body",
)

REQUIRED_FUNCTION_DEFINITIONS = (
    "renderFormationScoreSummaryHtml",
    "renderFormationScoreMetricChipsHtml",
    "renderFormationScoreEvidencePanelHtml",
    "normalizeFormationScoreDisplayRows",
    "normalizeFormationScoreEvidenceRows",
    "setFormationScoreDetailIndex",
    "openFormationScoreEvidenceDialog",
)

FORBIDDEN_JS = (
    "scoreRows:generalRows.map",
    "window.HadoTypeScore.score(formationTypeScoreEntity",
    "保存データの軍馬を最大3枠まで部隊へ反映",
    "<h3>軍馬</h3>",
    "formationEvaluationTypeInput",
    "formationTotalScoreInput",
    "<strong>${esc(scores.totalScore)}点</strong>",
    "評価:${esc(scores.evaluationScore)}点",
    "formationEvaluationScoreInput",
    "formationEvaluationSaveBtn",
    "formation-group-title",
    "formation-group-current-name",
    "formation-group-count",
    "formation-group-select-label",
    "renderFormationNextStepHelpHtml",
    "formation-next-step-help",
    "履歴へ保存",
    "<details class=\"formation-score-summary",
    "formation-score-evidence-point",
    "+${esc(item.point)}点",
    "内訳合計",
    "unit:'点'",
    "評価型ID",
    "編集はポップアップで行います",
    "data-formation-warhorse-edit",
    "data-formation-warhorse-remove",
)
REQUIRED_TYPE_CANDIDATES = (
    "typeCandidateViewModeLabel",
    "全データ表示",
    "window.HADO_TYPE_SCORE_RULES=st.data.types",
    "renderTagChips(v)",
    "tagRank(b)-tagRank(a)||Number(a.sourceIndex||0)-Number(b.sourceIndex||0)",
    "保存データ表示",
    "選択中の型: ${esc(type()?.typeName||st.sel?.typeName||'未選択')} / 目的: ${esc(purpose()?.purposeName||'指定なし')} / ${esc(typeCandidateViewModeLabel())}",
)
FORBIDDEN_TYPE_CANDIDATES = (
    "候補をクリックすると選択状態になります",
    "savedCandidateNote()",
    "${esc(displayVersion())} / 選択中の型",
    "トータルスコア: <strong>${esc(v._s?.totalScore||0)}件</strong>",
    "適合スコア: <strong>${esc(window.HadoTypeScore.label(v._s))}</strong> / 評価スコア",
    "適合スコア",
    "主将適合スコア",
    "評価項目別スコア",
    "件数ベース適合スコア",
    "HadoTypeScore.label(v._s)",
    "HadoTypeScore.summary(v._s)",
    "htc-score",
)
REQUIRED_CSS = (
    ".formation-group-controls",
    ".formation-group-select",
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
    "formation-selected-stack>.formation-selected-card.formation-score-card:not(.is-dialog)",
    "formation-selected-stack>.formation-quick-summary-strip",
    "formation-quick-summary-strip",
    ".formation-warhorse-slots-body",
    ".formation-memo-inline",
    ".formation-group-select",
    "body.formation-tab .formation-compose-bar-grid .formation-memo-inline",
    "body.formation-tab .formation-score-meta{grid-template-columns:repeat(3",
    ".formation-dialog-actions",
    "Update09.3.19-PC-FORMATION-SCORE-VISIBLE",
    "@media (min-width:981px)",
    ".formation-selected-stack>.formation-selected-card.formation-score-card:not(.is-dialog)",
    "Update09.4.21-PC-FORMATION-LIST-SCROLL",
    "Update09.4.21-PC-FORMATION-LIST-FIXED-HEAD",
    "Update09.4.21-PC-FORMATION-PANEL-ACTUAL-TAB-OFFSET",
    ".formation-list-fixed-head{position:relative!important;top:auto!important",
    "body.formation-tab .formation-list-panel{overflow:clip!important;overscroll-behavior:contain!important}",
    "body.formation-tab .formation-list-panel .formation-list{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important",
    "scrollbar-gutter:stable",
    "overflow-y:scroll!important",
    "Update09.4.21-PC-FORMATION-ACTIONS-ONE-ROW",
    "Update09.4.21-MOBILE-SCORE-BETWEEN-WARHORSE-SUMMARY",
    "formation-mobile-score-result-placement .formation-score-card",
    "grid-template-columns:repeat(4,minmax(0,1fr))",
)
FORBIDDEN_CSS = (
    ".formation-score-field",
    ".formation-selected-popup-prompt",
    ".formation-group-title",
    ".formation-group-current-name",
    ".formation-group-count",
    ".formation-group-select-label",
    ".formation-next-step-help",
    ".formation-next-step-body",
)


def main() -> int:
    js = FORMATION.read_text(encoding="utf-8")
    type_js = TYPE_CANDIDATES.read_text(encoding="utf-8")
    type_entry_js = TYPE_ENTRY.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    html_text = HTML.read_text(encoding="utf-8")
    update_meta = UPDATE_META.read_text(encoding="utf-8")
    missing_js = [snippet for snippet in REQUIRED_JS if snippet not in js]
    missing_function_defs = [name for name in REQUIRED_FUNCTION_DEFINITIONS if not re.search(r"function\s+" + re.escape(name) + r"\s*\(", js)]
    forbidden_js = [snippet for snippet in FORBIDDEN_JS if snippet in js]
    missing_type = [snippet for snippet in REQUIRED_TYPE_CANDIDATES if snippet not in type_js]
    forbidden_type = [snippet for snippet in FORBIDDEN_TYPE_CANDIDATES if snippet in type_js]
    forbidden_type_entry = [snippet for snippet in FORBIDDEN_TYPE_CANDIDATES if snippet in type_entry_js]
    missing_css = [snippet for snippet in REQUIRED_CSS if snippet not in css]
    forbidden_css = [snippet for snippet in FORBIDDEN_CSS if snippet in css]
    if missing_js:
        raise SystemExit("Update09 Phase3 formation UI missing JS: " + ", ".join(missing_js))
    if missing_function_defs:
        raise SystemExit("Update09 Phase3 formation UI missing function definitions: " + ", ".join(missing_function_defs))
    if forbidden_js:
        raise SystemExit("Update09 Phase3 formation UI still contains removed controls: " + ", ".join(forbidden_js))

    if js.count("${formationWarhorseEditorHtml}${scoreCardHtml}${quickSummaryHtml}") != 1:
        raise SystemExit("Update09 Phase3 formation UI must render exactly one score card in formation-selected-stack")
    if "renderFormationTeamBoardSelectableHtml(f,quickSummaryHtml)" in js:
        raise SystemExit("Update09 Phase3 formation UI must pass scoreCardHtml before quickSummaryHtml for mobile placement")
    if missing_type:
        raise SystemExit("Update09 Phase3 type candidate UI missing JS: " + ", ".join(missing_type))
    if forbidden_type:
        raise SystemExit("Update09 Phase3 type candidate UI still contains removed notes: " + ", ".join(forbidden_type))
    if forbidden_type_entry:
        raise SystemExit("Update09 Phase3 type entry UI still contains removed score wording: " + ", ".join(forbidden_type_entry))
    if missing_css:
        raise SystemExit("Update09 Phase3 formation UI missing CSS: " + ", ".join(missing_css))
    if forbidden_css:
        raise SystemExit("Update09 Phase3 formation UI still contains obsolete CSS: " + ", ".join(forbidden_css))
    forbidden_html = [s for s in ("※部隊編成の合算技能は配置・好相性・兵科などの条件を判定して反映します。", "<h2>部隊編成") if s in html_text]
    if forbidden_html:
        raise SystemExit("Update09 Phase3 formation UI still contains obsolete HTML: " + ", ".join(forbidden_html))

    if "renderFormationScoreSummaryHtml=function" in update_meta or "const wrappedSummary=function" in update_meta:
        raise SystemExit("hado_update_meta.js must not override renderFormationScoreSummaryHtml; hado_formation.js owns the interactive score detail UI")
    stale_group_override = [snippet for snippet in (
        "renderFormationGroupControlsHtml=function",
        "formation-group-list-row",
        "formation-group-title",
        "formation-group-select-label",
        "<span class=\"note\">グループリスト</span>",
        "formation-next-step-help",
        "renderFormationNextStepHelpHtml",
    ) if snippet in update_meta]
    if stale_group_override:
        raise SystemExit("hado_update_meta.js must not override formation group controls: " + ", ".join(stale_group_override))
    print("Update09 Phase3 formation UI contract ok: score card function definitions, group management, type notes, warhorse layout")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
