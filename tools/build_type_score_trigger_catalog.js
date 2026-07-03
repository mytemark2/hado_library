#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DOC = path.join(ROOT, 'docs', 'updates', 'update09');
const CHANGE = path.join(DOC, 'hadou_effect_change_item_catalog.draft.json');
const TABLE = path.join(DOC, 'hadou_type_score_judgement_table.v2.draft.json');
const SAMPLE = path.join(DOC, 'hadou_type_score_trigger_catalog.sample.json');
function readJson(file){ return JSON.parse(fs.readFileSync(file, 'utf8')); }
function buildRows(){
  const change = readJson(CHANGE).items;
  const byId = new Map(change.map(item => [item.changeItemId, item]));
  const table = readJson(TABLE).items;
  const rows = [];
  for (const rule of table) {
    for (const changeItemId of rule.changeItems || []) {
      const item = byId.get(changeItemId);
      if (!item) throw new Error(`unknown changeItemId in judgement table: ${changeItemId}`);
      for (const effectFamily of item.effectFamilies || []) {
        rows.push({
          typeId: rule.typeId,
          typeName: rule.typeName,
          scoreMetricId: rule.scoreMetricId,
          scoreMetricLabel: rule.scoreMetricLabel,
          scoreRole: rule.scoreRole,
          changeItemId,
          changeItemLabel: item.label,
          effectFamily,
          aliases: item.aliases,
          allowedTargets: rule.allowedTargets,
          allowedSourceTypes: rule.allowedSourceTypes,
          allowedTiming: rule.allowedTiming,
          dedupePolicy: rule.dedupePolicy
        });
      }
    }
  }
  return rows;
}
function summary(rows){
  const types = new Set(rows.map(r => r.typeId));
  const changeItems = new Set(rows.map(r => r.changeItemId));
  const roles = rows.reduce((a,r)=>(a[r.scoreRole]=(a[r.scoreRole]||0)+1,a),{});
  return { schemaVersion: 'trigger-catalog-summary-2026-06-30', rowCount: rows.length, typeCount: types.size, changeItemCount: changeItems.size, roleCounts: roles };
}
function main(){
  const args = new Set(process.argv.slice(2));
  const rows = buildRows();
  if (args.has('--check')) {
    console.log(JSON.stringify({ ok: true, ...summary(rows) }, null, 2));
    return;
  }
  if (args.has('--sample')) {
    const out = { schemaVersion: 'sample-2026-06-30', kind: 'type_score_trigger_catalog_sample', maxRows: 50, summary: summary(rows), items: rows.slice(0, 50) };
    fs.writeFileSync(SAMPLE, JSON.stringify(out, null, 2) + '\n');
    console.log(`wrote sample: ${path.relative(ROOT, SAMPLE)} (${out.items.length} rows)`);
    return;
  }
  console.log(JSON.stringify(summary(rows), null, 2));
}
main();
