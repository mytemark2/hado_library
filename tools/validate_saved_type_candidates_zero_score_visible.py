#!/usr/bin/env python3
"""Validate saved-mode type candidates keep saved-owned zero-score rows visible."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "hado_type_candidates.js").read_text(encoding="utf-8")

REQUIRED = (
    "function candidateVisibleByScore(v)",
    "v._s.matchedCount>0||(savedModeActive()&&savedOwnershipRole(v.roleId))",
    ".filter(savedCandidateAllowed).filter(candidateVisibleByScore)",
    "適合0点でも表示",
)
FORBIDDEN = ".filter(v=>v._s.matchedCount>0).filter(savedCandidateAllowed)"


def main() -> int:
    missing = [snippet for snippet in REQUIRED if snippet not in SOURCE]
    if missing:
        raise SystemExit("saved zero-score candidate visibility missing: " + ", ".join(missing))
    if FORBIDDEN in SOURCE:
        raise SystemExit("saved candidate list still filters matchedCount before saved ownership")
    print("saved-mode type candidates keep saved-owned zero-score rows visible")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
