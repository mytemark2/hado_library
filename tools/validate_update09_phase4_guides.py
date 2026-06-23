#!/usr/bin/env python3
"""Validate Update09 Phase 4 guide and flow wording."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
checks = {
    "index.html": [
        "Update09.4.2 操作ガイド",
        "Update09.4.2 クイック導線",
        "型編成ナビ→型候補一覧→候補トレイ→部隊編成",
        "全データ表示は理論値、保存データ表示は登録済み武将・装備中心",
    ],
    "hado_app.js": [
        "Update09.4.2では、グループ整理、型候補確認",
        "全データ表示は未所持を含む理論値確認、保存データ表示は★登録済み",
        "型検索で方針を決めたら、部隊編成タブの型編成ナビと型候補一覧へ進みます。",
        "型候補から配置先へつなげる",
        "グループを選択・変更",
    ],
    "hado_type_candidates.js": [
        "<summary>次の操作</summary>",
        "全データ表示は理論値、保存データ表示は登録済み武将・装備中心です。",
        "新規編成へ進む場合は「この型で新規部隊」を押してください。",
    ],
    "hado_formation.js": [
        "data-formation-group-manage",
        "data-formation-group-select",
        "formation-group-help",
    ],
    "hado_styles.css": [
        "Update09.4.2 formation group controls layout",
        ".formation-group-select-label{display:grid",
    ],
    "hado_version.js": [
        "updateNo: '09.4.2'",
        "revision: 75",
        "Update09.4.2: fix formation group controls and add group guide step.",
    ],
}

missing = []
for rel, needles in checks.items():
    text = (ROOT / rel).read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            missing.append(f"{rel}: {needle}")
if missing:
    raise SystemExit("Update09 Phase4 guide contract missing:\n- " + "\n- ".join(missing))
print("Update09 Phase4 guide contract ok: guide badge, full/saved explanation, type-to-formation flow, version")
