#!/usr/bin/env python3
"""Validate saved-mode ownership uses favorites only, while skills use saved star settings."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "hado_core.js").read_text(encoding="utf-8")
TYPE_SOURCE = (ROOT / "hado_type_candidates.js").read_text(encoding="utf-8")
REQUIRED = (
    "const generalOwnershipSources=[...(current?.generals||[])];",
    "const equipmentOwnershipSources=[...(current?.equipments||[])];",
    "resolveGeneralSkillProfile(generalItem).map",
    "policy:'saved ownership is favorites only; general skills are resolved from saved generalStars for owned generals'",
)
REQUIRED_TYPE = (
    "addSavedNames(generalNames,save.generals)",
    "addSavedNames(equipmentNames,save.equipments)",
    "function savedScoreEntity(v)",
    "function savedSkillNameSetForGeneral(name)",
    "getResolvedGeneralSkillLevelMap(item)",
    "addGrantedSkillNames(out,skillName,level)",
    "collectGrantedSkillEntriesForSavedIndex(skillName,level)",
)
FORBIDDEN = (
    "const generalOwnershipSources=[...(current?.generals||[]),...Object.keys(current?.generalStars||{})",
    "Object.keys(current?.generalSettings||{})];",
    "Object.keys(current?.inheritedSkills||{})];",
    "const equipmentOwnershipSources=[...(current?.equipments||[]),...Object.keys(current?.equipmentStars||{})",
)
FORBIDDEN_TYPE = (
    "addSavedObjectKeys(generalNames,save.generalStars)",
    "addSavedObjectKeys(generalNames,save.generalSettings)",
    "addSavedObjectKeys(generalNames,save.inheritedSkills)",
    "addSavedObjectKeys(equipmentNames,save.equipmentStars)",
    "addSavedObjectKeys(equipmentNames,save.equipmentStages)",
    "const rarityPrefixRe=",
)


def main() -> int:
    missing = [snippet for snippet in REQUIRED if snippet not in SOURCE]
    missing += [snippet for snippet in REQUIRED_TYPE if snippet not in TYPE_SOURCE]
    forbidden = [snippet for snippet in FORBIDDEN if snippet in SOURCE]
    forbidden += [snippet for snippet in FORBIDDEN_TYPE if snippet in TYPE_SOURCE]
    if missing:
        raise SystemExit("saved-mode favorite ownership/star skill policy missing: " + ", ".join(missing))
    if forbidden:
        raise SystemExit("saved-mode ownership still treats settings as ownership: " + ", ".join(forbidden))
    print("saved-mode ownership is favorites-only; type scoring uses saved-star resolved skills")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
