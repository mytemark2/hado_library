#!/usr/bin/env python3
"""Validate Update09 Phase 4 guide/version wording stays present."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKS = {
    "hado_version.js": [
        "updateNo: '09.4.1'",
        "revision: 74",
        "Update09.4.1: start Phase 4 guide and operation-flow cleanup.",
    ],
    "index.html": [
        "Update09.4.1 操作ガイド",
        "Update09.4.1 クイック導線",
        "型編成ナビ→型候補一覧→候補トレイ→部隊編成",
        "全データ表示は理論値、保存データ表示は登録済み武将・装備中心",
    ],
    "hado_app.js": [
        "Update09.4.1では、型候補確認、候補トレイ、部隊編成結果確認",
        "型検索で方針を決めたら、部隊編成タブの型編成ナビと型候補一覧へ進みます。",
        "型編成ナビ→型候補一覧→候補トレイ→部隊編成",
        "軍馬直下のトータルスコア",
    ],
    "docs/updates/update09/roadmap.md": [
        "Phase 4 着手",
        "3.0.0.0 Update09.4.1",
    ],
}
missing = []
for rel, needles in CHECKS.items():
    text = (ROOT / rel).read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            missing.append(f"{rel}: {needle}")
if missing:
    raise SystemExit("Update09 Phase4 guide/version contract missing:\n- " + "\n- ".join(missing))
print("Update09 Phase4 guide/version contract ok")
