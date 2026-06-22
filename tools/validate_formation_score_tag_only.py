#!/usr/bin/env python3
"""Validate formation score detail panels stay tag-only.

This catches the specific regression where 自部隊不利対策 details displayed
source rows such as 与ダメージ/被ダメージ, values, 発生元, or 条件 instead of
result-summary-style tags.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "hado_formation.js").read_text(encoding="utf-8")

REQUIRED = (
    "FORMATION_SCORE_EVIDENCE_ALIASES",
    "'自部隊不利対策':['弱化無効'",
    "function formationScoreEvidenceTitle(src,row)",
    "const text=`${src?.matchedText||''} ${src?.rawText||''}`",
    "return hit||fallback",
    "function renderFormationScoreEvidencePanelHtml(row)",
    "formation-score-evidence-tags",
    "formation-score-evidence-tag",
    "<b>${esc(item.kindLabel||'型要素')}</b>${esc(item.title)}",
    "kindLabel:'型要素'",
    "kindLabel:'状態変化'",
    "function formationScoreEvidenceKind(type)",
    "${esc(row.label)}のタグ",
    "${esc(evidenceRows.length)}件",
    "rawText:String(row?.rawText||text).slice(0,1000)",
)

FORBIDDEN = (
    "return '不利対策根拠'",
    "formation-score-evidence-source",
    "formation-score-evidence-condition",
    "formation-score-evidence-value",
    "発生元：${esc(item.source)}",
    "条件：${esc(item.condition",
    "${esc(score)} / ${esc(evidenceRows.length)}件一致",
    "${esc(score)} / ${esc(score)}件一致",
)

missing = [snippet for snippet in REQUIRED if snippet not in SOURCE]
if missing:
    raise SystemExit("formation score tag-only validator missing required snippets: " + ", ".join(missing))

present = [snippet for snippet in FORBIDDEN if snippet in SOURCE]
if present:
    raise SystemExit("formation score tag-only validator found forbidden source/detail snippets: " + ", ".join(present))

print("formation score tag-only detail contract ok")
