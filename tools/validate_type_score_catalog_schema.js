#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DOC = path.join(ROOT, 'docs', 'updates', 'update09');
const files = {
  change: path.join(DOC, 'hadou_effect_change_item_catalog.draft.json'),
  table: path.join(DOC, 'hadou_type_score_judgement_table.v2.draft.json'),
  sample: path.join(DOC, 'hadou_type_score_trigger_catalog.sample.json')
};
function readJson(file){ return JSON.parse(fs.readFileSync(file, 'utf8')); }
function assert(cond,msg){ if(!cond) throw new Error(msg); }
function array(v,msg){ assert(Array.isArray(v), msg); }
function hasFields(obj, fields, ctx){ for (const f of fields) assert(Object.prototype.hasOwnProperty.call(obj, f), `${ctx} missing ${f}`); }
function main(){
  const change = readJson(files.change); const table = readJson(files.table); const sample = readJson(files.sample);
  array(change.items, 'change catalog items must be an array');
  array(table.items, 'judgement table items must be an array');
  array(sample.items, 'trigger sample items must be an array');
  const changeFields = ['changeItemId','label','category','effectFamilies','aliases','displayNormalizeTo','dedupeGroup'];
  change.items.forEach((item,i)=>{ hasFields(item, changeFields, `change.items[${i}]`); array(item.effectFamilies, `change.items[${i}].effectFamilies`); array(item.aliases, `change.items[${i}].aliases`); });
  const tableFields = ['typeId','typeName','scoreMetricId','scoreMetricLabel','displayOrder','scoreRole','changeItems','allowedTargets','allowedSourceTypes','allowedTiming','dependency','denyChangeItems','dedupePolicy','note'];
  table.items.forEach((item,i)=>{ hasFields(item, tableFields, `table.items[${i}]`); array(item.changeItems, `table.items[${i}].changeItems`); array(item.allowedTargets, `table.items[${i}].allowedTargets`); array(item.allowedSourceTypes, `table.items[${i}].allowedSourceTypes`); array(item.allowedTiming, `table.items[${i}].allowedTiming`); array(item.denyChangeItems, `table.items[${i}].denyChangeItems`); assert(Number.isInteger(item.displayOrder) && item.displayOrder >= 1 && item.displayOrder <= 5, `table.items[${i}].displayOrder must be 1..5`); assert(['P','S','X'].includes(item.scoreRole), `table.items[${i}].scoreRole must be P/S/X`); });
  assert(sample.items.length <= 50, 'sample must be 50 rows or fewer');
  sample.items.forEach((item,i)=>hasFields(item, ['typeId','typeName','scoreMetricId','scoreMetricLabel','displayOrder','scoreRole','changeItemId','changeItemLabel','effectFamily','aliases','allowedTargets','allowedSourceTypes','allowedTiming','dedupePolicy'], `sample.items[${i}]`));
  console.log('type score catalog schema validation passed');
}
main();
