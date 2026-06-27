#!/usr/bin/env python3
"""Validate Update09 Phase 4 guide/version wording lives in active runtime files."""
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
    version_js = read("hado_version.js")
    index_html = read("index.html")
    core_js = read("hado_core.js")
    candidates_js = read("hado_type_candidates.js")
    tray_js = read("hado_candidate_tray.js")
    update_meta_js = read("hado_update_meta.js")

    formation_js = read("hado_formation.js")
    styles_css = read("hado_styles.css")
    roadmap = read("docs/updates/update09/roadmap.md")
    implementation = read("docs/updates/update09/implementation.md")
    report = read("docs/updates/update09/report.md")

    require(version_js, "updateNo: '09.4.20'", "Update09.4.20 update number")
    require(version_js, "revision: 93", "Update09.4.20 revision")
    require(version_js, "Update09.4.20", "visible Phase 4 version summary")

    for needle in [
        "Update09.4.20 操作ガイド",
        "型編成ナビ",
        "型候補一覧",
        "候補トレイ",
        "部隊編成",
        "./hado_styles.css?v=09.4.20",
        "./hado_formation.js?v=09.4.20",
        "全データ表示",
        "保存データ表示",
        "グループ選択欄",
        "変更",
    ]:
        require(index_html, needle, f"start guide text {needle}")

    for needle in [
        "型検索/型編成ナビ → 型候補一覧 → 候補トレイ → 部隊編成",
        "全データ表示は未所持を含む理論候補",
        "保存データ表示は登録済み所持データ中心の候補",
        "部隊のグループは、攻城・防衛・イベントなど用途別に部隊を整理する単位です",
        "グループ選択欄で表示対象を切り替え",
        "「変更」ボタンでグループの追加・名前変更・削除",
        "候補一覧では「次の操作」を開く",
    ]:
        require(core_js, needle, f"active guided-tour text {needle}")


    for needle in [
        "function renderNextStepHelp()",
        "<summary>次の操作</summary>",
        "全データ表示",
        "保存データ表示",
        "候補トレイへ追加",
        "部隊編成を開き",
    ]:
        require(candidates_js, needle, f"type candidates next-step help {needle}")

    for needle in [
        "hct-flow",
        "次の操作:",
        "型候補一覧で追加した候補を確認",
        "配置先を選ぶ",
        "成立判定は迂回しません",
    ]:
        require(tray_js, needle, f"candidate tray next-step help {needle}")


    for needle in [
        "minStackSpace=118",
        "Math.max(rawStackSpace,minStackSpace)",
        "rawStackSpace",
    ]:
        require(core_js, needle, f"fixed header offset clamp {needle}")

    for needle in [
        "formation-list-fixed-head",
        "formation-group-select",
        "data-formation-group-manage",
        "data-formation-group-select",
        "formationGroup:manage-click",
        "formationGroup:dialog-open",
        "function resetFormationListPanelScroll()",
        "panel.scrollTop=0",
        "requestAnimationFrame(resetFormationListPanelScroll)",
        "setTimeout(resetFormationListPanelScroll,80)",
        "setTimeout(resetFormationListPanelScroll,250)",
        "setTimeout(resetFormationListPanelScroll,600)",
        "panel.scrollTo({top:0,left:0,behavior:'auto'})",
        "function calculateFormationFixedPanelTop()",
        "getBoundingClientRect().bottom",
        "--formation-left-panel-top",
        "formationListPanel:viewport-sync",
        "overflow-y','scroll'",
        'id="formationNewBtn" class="btn-select-all">新規</button>',
        "renderFormationTeamBoardSelectableHtml(f,`${scoreCardHtml}${quickSummaryHtml}`)",
    ]:
        require(formation_js, needle, f"formation group controls {needle}")

    require(styles_css, ".formation-group-select", "formation group select style")
    require(styles_css, "Update09.4.20-PC-FORMATION-LIST-SCROLL", "PC formation list scrollbar fix marker")
    require(styles_css, "Update09.4.20-PC-FORMATION-LIST-FIXED-HEAD", "PC formation list fixed head marker")
    require(styles_css, "Update09.4.20-PC-FORMATION-PANEL-ACTUAL-TAB-OFFSET", "PC formation measured top marker")
    require(styles_css, ".formation-list-fixed-head{position:relative!important;top:auto!important", "PC formation fixed head style")
    require(styles_css, "body.formation-tab .formation-list-panel{overflow:clip!important;overscroll-behavior:contain!important}", "PC formation panel fixed controls")
    require(styles_css, "body.formation-tab .formation-list-panel .formation-list{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important", "PC formation list scroll area")
    require(styles_css, "--formation-left-panel-top", "PC formation measured top CSS var")
    require(styles_css, "overflow-y:scroll!important", "PC formation forced visible scrollbar")
    require(styles_css, "Update09.4.20-PC-FORMATION-ACTIONS-ONE-ROW", "PC formation action row marker")
    require(styles_css, "Update09.4.20-MOBILE-SCORE-BETWEEN-WARHORSE-SUMMARY", "mobile score placement marker")
    require(styles_css, "formation-mobile-score-result-placement .formation-score-card", "mobile score card placement style")
    require(styles_css, "grid-template-columns:repeat(4,minmax(0,1fr))", "PC formation four action columns")
    require(styles_css, "scrollbar-gutter:stable", "PC formation list stable scrollbar")


    for needle in [
        "formation-group-title",
        "formation-group-current-name",
        "formation-group-count",
        "formation-group-select-label",
        "formation-group-list-row",
        "renderFormationGroupControlsHtml=function",
        "function renderFormationNextStepHelpHtml()",
        "formation-next-step-help",
        "formation-next-step-body",
        "<span class=\"note\">切替</span>",
        "<span class=\"note\">グループリスト</span>",
    ]:
        forbid(formation_js, needle, f"obsolete formation group label/layout {needle}")
        forbid(update_meta_js, needle, f"obsolete update-meta group override {needle}")

    require(index_html, "hado_core.js", "active core script load")
    forbid(index_html, "hado_app.js", "legacy hado_app.js script load")

    for doc_name, doc in [
        ("roadmap", roadmap),
        ("implementation", implementation),
        ("report", report),
    ]:
        require(doc, "Update09.4.20", f"{doc_name} Phase 4 record")
        require(doc, "Phase 4", f"{doc_name} Phase 4 label")

    print("Update09 Phase 4 guide/version validation OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
