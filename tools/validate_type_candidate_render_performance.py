#!/usr/bin/env python3
"""Validate type-candidate rendering keeps heavy diagnostics/cache work off the critical paint path."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TYPE_CANDIDATES = (ROOT / "hado_type_candidates.js").read_text(encoding="utf-8")
TYPE_SCORE = (ROOT / "hado_type_score.js").read_text(encoding="utf-8")
FORMATION = (ROOT / "hado_formation.js").read_text(encoding="utf-8")
CORE = (ROOT / "hado_core.js").read_text(encoding="utf-8")

REQUIRED = (
    (TYPE_CANDIDATES, "roleCache:new Map()"),
    (TYPE_CANDIDATES, "function roleRowsCacheKey(role)"),
    (TYPE_CANDIDATES, "if(st.roleCache.has(key))return st.roleCache.get(key)"),
    (TYPE_CANDIDATES, "requestIdleCallback(run,{timeout:800})"),
    (TYPE_CANDIDATES, "window.HADO_TYPE_CANDIDATE_VERBOSE_LOGS"),
    (TYPE_CANDIDATES, "window.HADO_TYPE_SCORE_TRACE_SUSPENDED=true"),
    (TYPE_CANDIDATES, "keptTypeFeatures"),
    (TYPE_CANDIDATES, "typeFeatures:audit.keptTypeFeatures"),
    (TYPE_SCORE, "if(window.HADO_TYPE_SCORE_TRACE_SUSPENDED)return"),
    (CORE, "function deferTacticAttackDiagnosticSnapshot"),
    (CORE, "requestIdleCallback(run,{timeout:1200})"),
    (FORMATION, "deferTacticAttackDiagnosticSnapshot('renderFormationScreenCore')"),
)
FORBIDDEN = (
    (TYPE_CANDIDATES, "console.info('[HADO type-candidate diagnostic]',data)}catch{}return data"),
    (FORMATION, "buildTacticAttackDiagnosticSnapshot();debugLog('tacticAttack:diagnostic'"),
)


def main() -> int:
    missing = [snippet for text, snippet in REQUIRED if snippet not in text]
    forbidden = [snippet for text, snippet in FORBIDDEN if snippet in text]
    if missing:
        raise SystemExit("render performance guard missing: " + ", ".join(missing))
    if forbidden:
        raise SystemExit("render performance guard found blocking pattern: " + ", ".join(forbidden))
    print("type-candidate/formation render performance guards ok: cached rows, async diagnostics, suspended bulk traces")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
