#!/usr/bin/env python3
"""Validate the type-search feature index contains usable formation scoring data."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "hadou_type_search_feature_index.json"
REQUIRED_CATEGORIES = ("generals", "equipments", "siegeWeapons", "warhorseSkills")


def main() -> int:
    if not SOURCE.is_file():
        raise SystemExit("hadou_type_search_feature_index.json is missing")
    if SOURCE.stat().st_size <= 2:
        raise SystemExit("hadou_type_search_feature_index.json is empty")
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    items = data.get("items")
    if not isinstance(items, list) or not items:
        raise SystemExit("hadou_type_search_feature_index.json items is empty")
    category_counts: Counter[str] = Counter()
    feature_rows = 0
    status_rows = 0
    named_rows = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        category = str(item.get("category") or "").strip()
        if category:
            category_counts[category] += 1
        if str(item.get("name") or "").strip():
            named_rows += 1
        type_features = item.get("typeFeatures")
        status_refs = item.get("statusEffectRefs")
        if isinstance(type_features, list) and type_features:
            feature_rows += 1
        if isinstance(status_refs, list) and status_refs:
            status_rows += 1
    missing_categories = [name for name in REQUIRED_CATEGORIES if category_counts[name] <= 0]
    if missing_categories:
        raise SystemExit("hadou_type_search_feature_index.json missing categories: " + ", ".join(missing_categories))
    if feature_rows <= 0:
        raise SystemExit("hadou_type_search_feature_index.json has no typeFeatures rows")
    if status_rows <= 0:
        raise SystemExit("hadou_type_search_feature_index.json has no statusEffectRefs rows")
    if named_rows != len(items):
        raise SystemExit(f"hadou_type_search_feature_index.json has unnamed rows: {len(items) - named_rows}")
    print(
        "type search feature index ok: "
        f"items={len(items)}, categories={dict(category_counts)}, "
        f"typeFeatureRows={feature_rows}, statusEffectRows={status_rows}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
