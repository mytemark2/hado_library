#!/usr/bin/env python3
"""Validate saved-mode type candidate names can match saved master item names.

The app stores saved ownership names from crawler master JSON display names such as
"【三國志 覇道】LR司馬師（しばし）" while type-candidate rows use compact names such as
"LR司馬師（しばし）". This check protects that normalization bridge.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROLE_TO_MASTER = {
    "main_general": "hadou_generals.json",
    "vice_general": "hadou_generals.json",
    "support_general": "hadou_generals.json",
    "attendant": "hadou_generals.json",
    "equipment": "hadou_equipments.json",
}


def load_items(path: str) -> list[dict]:
    raw = json.loads((ROOT / path).read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and isinstance(raw.get("items"), list):
        return raw["items"]
    return []


def match_key(value: object) -> str:
    text = str(value or "").strip()
    text = re.sub(r"（[^）]*）", "", text)
    text = re.sub(r"^【三國志\s*覇道】", "", text)
    text = re.sub(r"^【[^】]+】", "", text)
    return text.strip()


def main() -> int:
    role_items = load_items("hadou_type_search_role_index.json")
    problems: list[str] = []
    for role_id, master_file in ROLE_TO_MASTER.items():
        master_keys = {match_key(row.get("name") or row.get("title")) for row in load_items(master_file)}
        master_keys.discard("")
        candidates = [row for row in role_items if row.get("roleId") == role_id]
        missing = [row.get("name") or row.get("displayName") for row in candidates if match_key(row.get("name") or row.get("displayName")) not in master_keys]
        if missing:
            problems.append(f"{role_id}: {len(missing)}/{len(candidates)} candidates do not match saved master names, sample={missing[:5]}")
    if problems:
        raise SystemExit("\n".join(problems))
    print("type candidate saved-name matching ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
