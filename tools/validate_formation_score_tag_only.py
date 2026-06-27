#!/usr/bin/env python3
"""Validate formation score detail panels stay tag-only.

This catches the specific regression where 自部隊不利対策 details displayed
source rows such as 与ダメージ/被ダメージ, values, 発生元, or 条件 instead of
result-summary-style tags.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "hado_formation.js").read_text(encoding="utf-8")
CSS_SOURCE = (ROOT / "hado_styles.css").read_text(encoding="utf-8")

REQUIRED = (
    "function formationScoreEvidenceCondition(src)",
    "function formationScoreEvidenceDisplayTitle(title,source)",
    "function normalizeFormationScoreEvidenceRows(row)",
    "sourceTag:item?.sourceTag||item?.source||item?.sourceLabel||''",
    "displayTitle:formationScoreEvidenceDisplayTitle",
    "sourceTag:src.sourceTag||src.sourceLabel||source||''",
    "function renderFormationScoreEvidencePanelHtml(row)",
    "function renderFormationScoreEvidenceDialogHtml(row)",
    "formation-score-evidence-dialog-list",
    "state.formationScoreEvidenceDialogOpen=true",
    "data-formation-score-dialog-close",
    "formation-score-evidence-tags",
    "formation-score-evidence-tags is-collapsed",
    "formation-quick-summary-chip",
    "formation-score-evidence-label",
    "formation-score-evidence-tag",
    "<b>${esc(item.kindLabel||'型要素')}</b><span class=\"formation-score-evidence-label\">${esc(item.displayTitle||item.title)}</span>",
    "kindLabel:item?.kindLabel||(item?.evidenceType==='effect'?'状態変化':'型要素')",
    "kindLabel:type==='effect'?'状態変化':'型要素'",
    "function sumFormationScoreDetails(details)",
    "function calculateFormationDisplayedTotalScore(rows){return (Array.isArray(rows)?rows:[]).reduce",
    "<strong>${esc(visibleTotalScore)}</strong>",
    "${esc(row.label)}の内訳",
    "評価${esc(evidenceRows.length)} / 根拠${esc(evidenceRows.length)}件",
    "<strong aria-label=\"根拠 ${esc(evidenceCount)}件\">${esc(evidenceCount)}</strong>",
    "formationScore:detail-more-delegate",
    "rawText:String(row?.rawText||row?.matchedText||'').slice(0,500)",
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
    "<small>${esc(evidenceCount)}件一致</small>",
    "const sourceLabels=",
    "class=\"sr-only\"",
)

missing = [snippet for snippet in REQUIRED if snippet not in SOURCE]
if missing:
    raise SystemExit("formation score tag-only validator missing required snippets: " + ", ".join(missing))

present = [snippet for snippet in FORBIDDEN if snippet in SOURCE]
if present:
    raise SystemExit("formation score tag-only validator found forbidden source/detail snippets: " + ", ".join(present))

print("formation score tag-only detail contract ok")

CSS_REQUIRED = (
    ".formation-score-evidence-tags{display:flex;flex-wrap:wrap;gap:4px}",
    ".formation-score-evidence-tags.is-collapsed{display:flex;flex-wrap:nowrap",
    ".formation-score-evidence-tags.is-expanded{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr))",
    ".formation-score-evidence-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".formation-score-evidence-dialog-list{max-height:min(58vh,520px);overflow:auto!important",
    ".formation-score-evidence-tag{display:inline-flex",
    ".formation-score-evidence-tag b{font-size:10px",
    ".formation-score-evidence-tag.is-status",
    ".formation-score-evidence-tag.is-type",
)
missing_css = [snippet for snippet in CSS_REQUIRED if snippet not in CSS_SOURCE]
if missing_css:
    raise SystemExit("formation score tag-only validator missing required CSS snippets: " + ", ".join(missing_css))
