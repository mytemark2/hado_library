#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
global.window = {};
require('../hado_type_score.js');
const S = window.HadoTypeScore;
const doc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'updates', 'update09', 'hadou_type_score_judgement_table.v2.draft.json'), 'utf8'));
const changeDoc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'updates', 'update09', 'hadou_effect_change_item_catalog.draft.json'), 'utf8'));
const types = ['calm','zombie','bomb','critical_tactic','critical_normal','tactic_speed','attack_speed','normal_attack','debuff','anti_object','annihilation','buff_support','debuff_interference','wall_defense','garrison_support','vaccine'];
const keyOf = row => `${row.typeId}:${row.scoreMetricId}`;
const normalizeRow = row => ({
  typeId: row.typeId,
  scoreMetricId: row.scoreMetricId,
  scoreMetricLabel: row.scoreMetricLabel,
  displayOrder: row.displayOrder,
  changeItems: row.changeItems,
  denyChangeItems: row.denyChangeItems
});
assert(Array.isArray(S.BRIDGE_ROWS), 'runtime must expose bridge rows for consistency tests');
assert.strictEqual(doc.items.length, 80, 'docs judgement table must have 80 rows');
assert.strictEqual(S.BRIDGE_ROWS.length, 80, 'runtime judgement table must have 80 rows');
assert.deepStrictEqual([...S.BRIDGE_TYPE_IDS].sort(), types.slice().sort(), 'runtime bridge type ids must include all 16 types');
assert.notDeepStrictEqual([...S.BRIDGE_TYPE_IDS].sort(), ['buff_support','vaccine'], 'runtime bridge must not be limited to two types');
const docByKey = new Map(doc.items.map(row => [keyOf(row), normalizeRow(row)]));
const runtimeByKey = new Map(S.BRIDGE_ROWS.map(row => [keyOf(row), normalizeRow(row)]));
assert.deepStrictEqual([...runtimeByKey.keys()].sort(), [...docByKey.keys()].sort(), 'docs/runtime bridge metric keys must match');
for (const [key, expected] of docByKey) {
  assert.deepStrictEqual(runtimeByKey.get(key), expected, `runtime row mismatch: ${key}`);
}
for (const typeId of types) {
  const rows = S.BRIDGE_ROWS.filter(row => row.typeId === typeId).sort((a,b) => a.displayOrder - b.displayOrder);
  assert.strictEqual(rows.length, 5, `${typeId} must have five runtime metrics`);
  assert.deepStrictEqual(rows.map(row => row.displayOrder), [1,2,3,4,5], `${typeId} displayOrder must be 1..5`);
  rows.forEach(row => assert(!/^評価[1-5]$/.test(row.scoreMetricLabel), `${typeId} must not use fallback label`));
}
const runtimeChangeIds = new Set(Object.keys(S.BRIDGE_CHANGE_ITEMS || {}));
const docChangeIds = new Set(changeDoc.items.map(item => item.changeItemId));
for (const id of new Set(doc.items.flatMap(row => row.changeItems || []))) {
  assert(runtimeChangeIds.has(id), `runtime change item missing: ${id}`);
  assert(docChangeIds.has(id), `docs change catalog missing: ${id}`);
  const item = S.BRIDGE_CHANGE_ITEMS[id];
  assert(item.label && Array.isArray(item.effectFamilies) && item.effectFamilies.length && Array.isArray(item.aliases), `runtime change item incomplete: ${id}`);
}
console.log('Update09 Phase5 runtime/catalog consistency tests passed');
