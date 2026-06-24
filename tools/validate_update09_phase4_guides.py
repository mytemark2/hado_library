#!/usr/bin/env python3
"""Validate Update09 Phase 4 visible version and guide-flow wording."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FILES = {
    "version": ROOT / "hado_version.js",
    "dev": ROOT / "HADO_DEV_INFO.json",
    "index": ROOT / "index.html",
    "app": ROOT / "hado_app.js",
    "roadmap": ROOT / "docs/updates/roadmap.md",
    "update09_roadmap": ROOT / "docs/updates/update09/roadmap.md",
    "implementation": ROOT / "docs/updates/update09/implementation.md",
    "report": ROOT / "docs/updates/update09/report.md",
}

texts = {name: path.read_text(encoding="utf-8") for name, path in FILES.items()}

required: list[tuple[str, str]] = [
    ("version", "updateNo: '09.4.1'"),
    ("version", "revision: 74"),
    ("version", "Update09.4.1: refresh Phase 4 guide wording and operation flow."),
    ("dev", "Update09 Phase 4 starts guide wording and operation-flow cleanup"),
    ("index", "Update09.4.1 操作ガイド"),
    ("index", "型編成ナビ"),
    ("index", "型候補一覧"),
    ("index", "候補トレイ"),
    ("index", "部隊編成"),
    ("index", "全データ表示は理論候補"),
    ("index", "保存データ表示は所有データ前提"),
    ("index", "グループリスト"),
    ("index", "「変更」から作成・名前変更・削除"),
    ("app", "型編成ナビ→部隊編成"),
    ("app", "型検索から型編成ナビ、型候補一覧、候補トレイへ進み"),
    ("app", "型候補一覧で9役割の候補を確認して候補トレイへ送ります"),
    ("app", "候補トレイから選んだ武将・装備・侍従・参軍・兵器・武装・軍馬"),
    ("app", "部隊のグループはグループリストで切り替え"),
    ("roadmap", "Phase 4着手"),
    ("update09_roadmap", "Phase 4 着手"),
    ("implementation", "Update09.4.1 Phase 4 ガイド/導線整理開始"),
    ("report", "Update09.4.1 Phase 4 ガイド/導線整理レポート"),
]

missing = [f"{name}: {needle}" for name, needle in required if needle not in texts[name]]
if missing:
    raise SystemExit("Update09 Phase4 guide/version contract missing:\n- " + "\n- ".join(missing))

if "updateNo: '09.3.40'" in texts["version"] or "revision: 73" in texts["version"]:
    raise SystemExit("Update09 Phase4 version bump is incomplete; old Update09.3.40 metadata remains in hado_version.js")

print("Update09 Phase4 guide/version contract ok: Update09.4.1 flow wording and group guidance present")
