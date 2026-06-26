#!/usr/bin/env python3
"""Validate formation score total rendering cannot reference stale displayTotalScore identifiers."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORMATION = (ROOT / "hado_formation.js").read_text(encoding="utf-8")
UPDATE_META = (ROOT / "hado_update_meta.js").read_text(encoding="utf-8")

REQUIRED = (
    "function calculateFormationDisplayedTotalScore(rows)",
    "const visibleTotalScore=calculateFormationDisplayedTotalScore(rows)",
    "f.totalScore=visibleTotalScore;f.evaluationScore=visibleTotalScore",
    "const matchedCount=visibleTotalScore",
    "const evidenceCount=visibleTotalScore",
    "totalScore:visibleTotalScore,evaluationScore:visibleTotalScore",
    "<strong>${esc(visibleTotalScore)}</strong>",
)
FORBIDDEN = (
    "displayTotalScore",
    "renderFormationScoreSummaryHtml=function",
    "const wrappedSummary=function",
)


def main() -> int:
    missing = [snippet for snippet in REQUIRED if snippet not in FORMATION]
    if missing:
        raise SystemExit("formation score visible-total scope guard missing snippets: " + ", ".join(missing))
    forbidden_runtime = [snippet for snippet in FORBIDDEN if snippet in FORMATION]
    forbidden_meta = [snippet for snippet in FORBIDDEN[1:] if snippet in UPDATE_META]
    if forbidden_runtime or forbidden_meta:
        raise SystemExit("formation score visible-total scope guard found forbidden snippets: " + ", ".join(forbidden_runtime + forbidden_meta))
    helper_pos = FORMATION.index("function calculateFormationDisplayedTotalScore(rows)")
    render_pos = FORMATION.index("function renderFormationScoreSummaryHtml")
    if helper_pos > render_pos:
        raise SystemExit("calculateFormationDisplayedTotalScore must be defined before renderFormationScoreSummaryHtml")
    print("formation score visible-total scope guard ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
