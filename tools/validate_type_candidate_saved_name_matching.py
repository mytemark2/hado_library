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

SOURCE = (ROOT / "hado_type_candidates.js").read_text(encoding="utf-8")
REQUIRED_SOURCE_SNIPPETS = (
    "const removeReading=",
    "function savedSkillNameSetForGeneral(name)",
    "function savedScoreEntity(v)",
    "addSavedNames(generalNames,save.generals)",
    "addSavedNames(equipmentNames,save.equipments)",
    "getResolvedGeneralSkillLevelMap(item)",
    "rowUsesUnownedSkill(row,ownedSkills,roleId,ownedLevels=new Map())",
    "savedRoleCompatibleText(row,roleId)",
    "addGrantedSkillNames(out,levels,skillName,level)",
    "savedSkillProfileForGeneral(name)",
    "requiredSkillLevel(text,skillName)",
    "const LEVEL_JOIN=",
    "const LEVEL_TOKEN=",
    "skillLevelNumber=v=>",
)
FORBIDDEN_SOURCE_SNIPPETS = (
    "const rarityPrefixRe=",
    "function savedAliasKeys(s)",
    "addSavedObjectKeys(generalNames,save.generalStars)",
    "addSavedObjectKeys(generalNames,save.generalSettings)",
    "addSavedObjectKeys(generalNames,save.inheritedSkills)",
    "addSavedObjectKeys(equipmentNames,save.equipmentStars)",
    "addSavedObjectKeys(equipmentNames,save.equipmentStages)",
)

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
    source_missing = [snippet for snippet in REQUIRED_SOURCE_SNIPPETS if snippet not in SOURCE]
    forbidden_source = [snippet for snippet in FORBIDDEN_SOURCE_SNIPPETS if snippet in SOURCE]
    if source_missing:
        raise SystemExit("type candidate saved ownership/star-skill policy missing: " + ", ".join(source_missing))
    if forbidden_source:
        raise SystemExit("type candidate saved ownership is too broad: " + ", ".join(forbidden_source))
    exact_samples = [("LR司馬師（しばし）", "LR司馬師"), ("【三國志 覇道】LR関羽（かんう）", "LR関羽")]
    exact_problems = [f"{a} != {b}" for a, b in exact_samples if match_key(a) != match_key(b)]
    if exact_problems:
        raise SystemExit("saved reading/prefix normalization failed: " + ", ".join(exact_problems))
    if match_key("関羽") == match_key("LR関羽（かんう）"):
        raise SystemExit("saved ownership must not equate base 関羽 with LR関羽")
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
