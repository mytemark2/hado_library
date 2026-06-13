#!/usr/bin/env python3
"""Validate saved-mode type candidates show selectable scored rows, not all owned zero-score rows."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "hado_type_candidates.js").read_text(encoding="utf-8")

REQUIRED = (
    "function candidateVisibleByScore(v)",
    "return v._s.matchedCount>0",
    ".filter(savedCandidateAllowed).filter(candidateVisibleByScore)",
    "適合する候補だけを選択可能として表示",
)
FORBIDDEN = (
    "v._s.matchedCount>0||(savedModeActive()&&savedOwnershipRole(v.roleId))",
    "適合0点でも表示",
    ".filter(v=>v._s.matchedCount>0).filter(savedCandidateAllowed)",
)


def main() -> int:
    missing = [snippet for snippet in REQUIRED if snippet not in SOURCE]
    forbidden = [snippet for snippet in FORBIDDEN if snippet in SOURCE]
    if missing:
        raise SystemExit("saved selectable candidate score filtering missing: " + ", ".join(missing))
    if forbidden:
        raise SystemExit("saved candidate list still exposes owned zero-score rows as selectable: " + ", ".join(forbidden))
    print("saved-mode type candidates expose scored selectable rows only")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
