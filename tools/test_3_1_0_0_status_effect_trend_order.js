#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const searchSource = fs.readFileSync('hado_search.js', 'utf8');
const meta = JSON.parse(fs.readFileSync('hadou_status_effect_meta_index.json', 'utf8'));
const ownerIndex = JSON.parse(fs.readFileSync('hadou_status_effect_group_owner_index.json', 'utf8'));
const groupKeys = ['selfAbilityBuff', 'selfStateBuff', 'selfResistanceBuff', 'enemyAbilityDebuff', 'enemyStateDebuff', 'enemyResistanceDebuff'];

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `function missing: ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`unbalanced function: ${name}`);
}

function readTrendGroups() {
  const result = {};
  for (const group of groupKeys) {
    const match = searchSource.match(new RegExp(`${group}:Object\\.freeze\\((\\[[^\\]]*\\])\\)`));
    assert(match, `trend order missing: ${group}`);
    result[group] = Function(`return ${match[1]}`)();
  }
  return result;
}

function normalizeDisplayLabel(value) {
  let label = String(value || '').trim().replace(/\[[^\]]+\]$/, '');
  const exact = {
    '被ダメージ変化(強化)': '被ダメージ低下', '被ダメージ変化(弱化)': '被ダメージ上昇',
    '兵科相性変化(強化)': '兵科相性上昇', '兵科相性変化(弱化)': '兵科相性低下'
  };
  if (exact[label]) return exact[label];
  return label.replace(/変化\(強化\)$/, '上昇').replace(/変化\(弱化\)$/, '低下');
}

const trendGroups = readTrendGroups();
assert(searchSource.includes("reviewedAt:'2026-08-30'"), 'trend review date must be recorded');
assert(!searchSource.includes('SEARCH_UX_STATUS_EFFECT_ORDER='), 'retired global flat order must not remain');
assert(searchSource.includes('return compareQuickStatusEffectTrend(a,b);'), 'quick options must use the group-aware trend comparator');

const candidates = Object.fromEntries(groupKeys.map(key => [key, new Set()]));
for (const item of meta.items || []) {
  let group = item.groupKey;
  const label = normalizeDisplayLabel(item.displayName || item.name || '');
  if (label === '戦法短縮') group = 'selfAbilityBuff';
  if (candidates[group] && label) candidates[group].add(label);
}
for (const group of ownerIndex.items || []) {
  if (!candidates[group.groupKey]) continue;
  for (const owners of Object.values(group.owners || {})) {
    for (const owner of owners || []) {
      const label = normalizeDisplayLabel(owner.statusEffectName || '');
      if (label) candidates[group.groupKey].add(label);
    }
  }
}

for (const group of groupKeys) {
  assert(trendGroups[group].length > 0, `${group}: priority anchors must not be empty`);
  assert.strictEqual(new Set(trendGroups[group]).size, trendGroups[group].length, `${group}: duplicate priority anchor`);
  for (const label of trendGroups[group]) assert(candidates[group].has(label), `${group}: unavailable priority anchor: ${label}`);
}

const context = {
  Object, Array, Number, String, Map, Set,
  norm: value => String(value || '').replace(/\s+/g, ' ').trim(),
  state: { derivedData: { statusEffectGroupOwnerIndex: ownerIndex } },
  SEARCH_UX_PRESET_GROUPS: [{ key: 'all' }, ...groupKeys.map(key => ({ key }))],
  getDerivedStatusEffectGroupOwnerIndex: key => (ownerIndex.items || []).find(item => item.groupKey === key) || null
};
vm.createContext(context);
vm.runInContext(`const SEARCH_UX_STATUS_EFFECT_TREND=${JSON.stringify({ reviewedAt: '2026-08-30', groups: trendGroups })}; let quickStatusEffectTrendOwnerCountCache={key:'',counts:new Map()};`, context);
for (const name of [
  'normalizeQuickStatusEffectTrendLabel', 'getQuickStatusEffectTrendOwnerCountCacheKey',
  'buildQuickStatusEffectTrendOwnerCountCache', 'getQuickStatusEffectTrendOwnerCount',
  'compareQuickStatusEffectTrend'
]) vm.runInContext(`${extractFunction(searchSource, name)}; this.${name}=${name};`, context);

const ability = [
  { group: 'selfAbilityBuff', label: '攻撃上昇' },
  { group: 'selfAbilityBuff', label: '撃心発生上昇' },
  { group: 'selfAbilityBuff', label: '戦法速度上昇' },
  { group: 'selfAbilityBuff', label: '戦法短縮' }
].sort(context.compareQuickStatusEffectTrend).map(item => item.label);
assert.deepStrictEqual(ability, ['戦法短縮', '戦法速度上昇', '撃心発生上昇', '攻撃上昇']);

const fallback = [
  { group: 'selfAbilityBuff', label: '闇盾' },
  { group: 'selfAbilityBuff', label: '兵器速度上昇' }
].sort(context.compareQuickStatusEffectTrend).map(item => item.label);
assert.deepStrictEqual(fallback, ['兵器速度上昇', '闇盾'], 'non-anchor entries must fall back to current distinct-owner frequency');

assert.strictEqual(context.normalizeQuickStatusEffectTrendLabel('戦法速度変化(強化)'), '戦法速度上昇', 'canonical JSON label must share the visible trend key');
assert.strictEqual(context.normalizeQuickStatusEffectTrendLabel('被ダメージ変化(強化)'), '被ダメージ低下', 'inverse damage display label must be normalized');
assert(context.getQuickStatusEffectTrendOwnerCount({ group: 'selfAbilityBuff', label: '攻撃上昇' }) > context.getQuickStatusEffectTrendOwnerCount({ group: 'selfAbilityBuff', label: '闇盾' }), 'owner frequency must come from current generated JSON');
console.log(`3.1.0.0 status-effect trend order passed: ${groupKeys.length} groups / ${Object.values(trendGroups).reduce((sum, rows) => sum + rows.length, 0)} anchors / current owner-frequency fallback`);
