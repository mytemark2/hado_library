#!/usr/bin/env python3
"""Guard the PC/mobile formation layout contract that regressed during Update09 Phase 4.

This validator intentionally keeps the bug-prone responsive layout requirements in one
place so future changes fail local/CI validation before the preview can regress.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise SystemExit(f"missing {label}: {needle}")


def forbid(text: str, needle: str, label: str) -> None:
    if needle in text:
        raise SystemExit(f"forbidden {label}: {needle}")


def main() -> int:
    formation_js = read("hado_formation.js")
    styles_css = read("hado_styles.css")
    render_test = read("tools/test_formation_type_score_render.js")
    phase3_validator = read("tools/validate_update09_phase3_formation_ui.py")
    phase4_validator = read("tools/validate_update09_phase4_guides.py")

    # Mobile contract: total score must be embedded between warhorse selector and
    # result summary, not hidden in the duplicate selected stack.
    for needle in [
        "renderFormationTeamBoardSelectableHtml(f,`${scoreCardHtml}${quickSummaryHtml}`)",
        "${formationWarhorseEditorHtml}${scoreCardHtml}${quickSummaryHtml}",
        "formation-mobile-score-result-placement",
    ]:
        require(formation_js, needle, f"mobile score placement runtime {needle}")

    for needle in [
        "Update09.4.20-MOBILE-SCORE-BETWEEN-WARHORSE-SUMMARY",
        ".formation-mobile-score-result-placement{display:grid!important",
        ".formation-mobile-score-result-placement .formation-score-card{display:block!important",
        ".formation-selected-stack>.formation-selected-card.formation-score-card:not(.is-dialog){display:none!important",
    ]:
        require(styles_css, needle, f"mobile score placement CSS {needle}")

    for needle in [
        "renderFormationTeamBoardSelectableHtml(f,quickSummaryHtml)",
        "renderFormationTeamBoardSelectableHtml(f,`${quickSummaryHtml}${scoreCardHtml}`)",
    ]:
        forbid(formation_js, needle, f"stale mobile score placement {needle}")

    # PC contract: measure the real fixed app/title/tab stack, keep header and
    # group/actions fixed, and make only the formation list scrollable.
    for needle in [
        "function calculateFormationFixedPanelTop()",
        "function syncFormationListPanelViewport(",
        "getBoundingClientRect().bottom",
        "--formation-left-panel-top",
        "formationListPanel:viewport-sync",
        "formation-list-fixed-head",
        'id="formationNewBtn" class="btn-select-all">新規</button>',
        "formation-list-actions",
        "requestAnimationFrame(resetFormationListPanelScroll)",
    ]:
        require(formation_js, needle, f"PC formation panel runtime {needle}")

    for needle in [
        "Update09.4.20-PC-FORMATION-LIST-SCROLL",
        "Update09.4.20-PC-FORMATION-LIST-FIXED-HEAD",
        "Update09.4.20-PC-FORMATION-PANEL-ACTUAL-TAB-OFFSET",
        "Update09.4.20-PC-FORMATION-ACTIONS-ONE-ROW",
        "top:var(--formation-left-panel-top,var(--mobile-fixed-stack-space,128px))!important",
        "body.formation-tab .formation-list-panel{overflow:clip!important;overscroll-behavior:contain!important}",
        "body.formation-tab .formation-list-panel .formation-list{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important",
        "overflow-y:scroll!important",
        "scrollbar-gutter:stable",
        ".formation-list-actions{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))",
    ]:
        require(styles_css, needle, f"PC formation panel CSS {needle}")

    # Keep recurrence tests/validators from silently drifting away from the same
    # contract as the runtime.
    require(render_test, "renderFormationTeamBoardSelectableHtml(f,`${scoreCardHtml}${quickSummaryHtml}`)", "formation render test mobile score assertion")
    require(phase4_validator, "renderFormationTeamBoardSelectableHtml(f,`${scoreCardHtml}${quickSummaryHtml}`)", "Phase 4 guide validator mobile score assertion")
    for text, source in [
        (phase3_validator, "Phase 3 formation validator"),
        (phase4_validator, "Phase 4 guide validator"),
    ]:
        require(text, "Update09.4.20-MOBILE-SCORE-BETWEEN-WARHORSE-SUMMARY", f"{source} mobile score marker")
        require(text, "Update09.4.20-PC-FORMATION-ACTIONS-ONE-ROW", f"{source} PC action marker")

    require(phase3_validator, "renderFormationTeamBoardSelectableHtml(f,quickSummaryHtml)", "Phase 3 validator stale mobile placement guard")

    print("formation responsive layout contract ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
