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

    formation_js = read("hado_formation.js")
    styles_css = read("hado_styles.css")
    roadmap = read("docs/updates/update09/roadmap.md")
    implementation = read("docs/updates/update09/implementation.md")
    report = read("docs/updates/update09/report.md")

    require(version_js, "updateNo: '09.4.6'", "Update09.4.6 update number")
    require(version_js, "revision: 79", "Update09.4.6 revision")
    require(version_js, "Update09.4.6", "visible Phase 4 version summary")

    for needle in [
        "Update09.4.6 操作ガイド",
        "型編成ナビ",
        "型候補一覧",
        "候補トレイ",
        "部隊編成",
        "全データ表示",
        "保存データ表示",
        "グループリスト",
        "変更",
    ]:
        require(index_html, needle, f"start guide text {needle}")

    for needle in [
        "型検索/型編成ナビ → 型候補一覧 → 候補トレイ → 部隊編成",
        "全データ表示は未所持を含む理論候補",
        "保存データ表示は登録済み所持データ中心の候補",
        "部隊のグループは、攻城・防衛・イベントなど用途別に部隊を整理する単位です",
        "グループリストで表示対象を切り替え",
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
        "function renderFormationNextStepHelpHtml()",
        "<summary>次の操作</summary>",
        "グループ切替で攻城・防衛・イベント",
        "「変更」から追加・名前変更・削除",
        "候補トレイや検索結果から配置",
        "トータルスコアと評価タグ",
        "formation-group-select",
        "data-formation-group-manage",
        "data-formation-group-select",
        "formationGroup:manage-click",
        "formationGroup:dialog-open",
    ]:
        require(formation_js, needle, f"formation next-step help {needle}")

    for needle in [
        ".formation-next-step-help",
        ".formation-next-step-body",
        ".formation-group-select",
    ]:
        require(styles_css, needle, f"formation next-step help style {needle}")


    for needle in [
        "formation-group-title",
        "formation-group-current-name",
        "formation-group-count",
        "formation-group-select-label",
        "<span class=\"note\">切替</span>",
        "<span class=\"note\">グループリスト</span>",
    ]:
        forbid(formation_js, needle, f"obsolete formation group label/layout {needle}")

    require(index_html, "hado_core.js", "active core script load")
    forbid(index_html, "hado_app.js", "legacy hado_app.js script load")

    for doc_name, doc in [
        ("roadmap", roadmap),
        ("implementation", implementation),
        ("report", report),
    ]:
        require(doc, "Update09.4.6", f"{doc_name} Phase 4 record")
        require(doc, "Phase 4", f"{doc_name} Phase 4 label")

    print("Update09 Phase 4 guide/version validation OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
