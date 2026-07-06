#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const context = {
  console, require, setTimeout, clearTimeout, fetch: undefined, window: null,
  state: {
    diagnostics: {}, typeSearchCacheStats: { hit: 0, miss: 0, invalidations: 0, store: 0 },
    derivedData: { effectConditionBlocks: { available: true, items: [{ category: 'generals', name: '華佗', blockCount: 1, blocks: [{ text: '弱化効果を避ける' }] }] } },
    generals: [{ name: '華佗' }], equipments: []
  },
  debugLog() {}, debugTimestamp() { return '2026-07-04T00:00:00.000Z'; }, norm, normalizeSaveItemName: norm, esc,
  safeCloneForDebug(value) { return JSON.parse(JSON.stringify(value)); }, getItemDisplayName(item) { return item?.name || ''; }, detailCategory() { return 'generals'; },
  effectSignedValue(effect) { return `${effect?.sign || '+'}${effect?.value ?? ''}${effect?.unit || ''}`; },
  isResponsiveMobileMode() { return false; }, PARAM_DISPLAY_GROUP_ORDER: [], PARAM_GROUPS: [],
  timingLabel(value) { return value; }, parameterDisplayName(value) { return value; }, getParameterDefaultUnit(key, unit) { return unit || '%'; }, formatFormationParameterNumber(value) { return String(Number(value) || 0); }, formationParameterDisplayValue(key, value) { return `${value?.sign || '+'}${value?.maxTotal ?? value?.value ?? ''}${value?.unit || ''}`; },
  localStorage: { getItem() { return null; }, setItem() {} }, document: { getElementById() { return null; } }, els: {}, performance: { now: () => 0 }, requestAnimationFrame(callback) { callback(); }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('hado_formation.js', 'utf8'), context, { filename: 'hado_formation.js' });
assert.doesNotThrow(() => context.getDerivedEffectConditionBlockEntry({ name: '華佗' }), 'effectConditionBlocks lookup must not throw normalizeCategory ReferenceError');
const hit = context.getDerivedEffectConditionBlockEntry({ name: '華佗' });
assert(hit && hit.name === '華佗', '公開JSON由来の詳細ブロックを取得できる');
console.log('Update09.5.28 public JSON load regression passed');
