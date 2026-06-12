#!/usr/bin/env python3
"""Validate saved-mode ownership index includes saved settings as ownership sources."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_SNIPPETS = (
    "...(current?.generals||[])",
    "Object.keys(current?.generalStars||{})",
    "Object.keys(current?.generalSettings||{})",
    "Object.keys(current?.inheritedSkills||{})",
    "...(current?.equipments||[])",
    "Object.keys(current?.equipmentStars||{})",
    "Object.keys(current?.equipmentStages||{})",
)


def main() -> int:
    source = (ROOT / "hado_core.js").read_text(encoding="utf-8")
    missing = [snippet for snippet in REQUIRED_SNIPPETS if snippet not in source]
    if missing:
        raise SystemExit("saved-mode ownership sources missing: " + ", ".join(missing))
    print("saved-mode ownership sources include explicit lists, stars, settings, stages, and inherited skills")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
