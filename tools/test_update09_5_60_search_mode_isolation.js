#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const coreSource = fs.readFileSync('hado_core.js', 'utf8');
const searchSource = fs.readFileSync('hado_search.js', 'utf8');
const statusSource = fs.readFileSync('hado_status_effects.js', 'utf8');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `function missing: ${name}`);
  const paramsStart = source.indexOf('(', start);
  let paramsDepth = 0;
  let bodyStart = -1;
  for (let index = paramsStart; index < source.length; index += 1) {
    if (source[index] === '(') paramsDepth += 1;
    if (source[index] === ')' && --paramsDepth === 0) {
      bodyStart = source.indexOf('{', index);
      break;
    }
  }
  assert(bodyStart >= 0, `function body missing: ${name}`);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`unbalanced function: ${name}`);
}

assert(coreSource.includes('searchModeContexts:{normal:null,status:null,type:null}'), 'shared state must declare three isolated search contexts');
assert(searchSource.includes("const exactRow=normalSearchMode&&q?"), 'exact-name auto selection must be limited to normal search');
assert(searchSource.includes("const effectiveKeyword=normalSearchMode?"), 'hidden normal keyword must not be evaluated outside normal search');
assert(searchSource.includes("state.quickStatusEffectOwnerFilter&&(!state._quickOwnerRowsCache||state._quickOwnerRowsCache.pending)"), 'pending restored status searches must preserve their selected detail');
assert(!searchSource.includes("if(next!=='status')clearQuickStatusEffectOwnerFilter({skipRender:true})"), 'mode switching must not destroy status-search conditions');
assert(statusSource.includes('searchModeContext:getOperationSearchModeContextSnapshot()'), 'operation history must save the active isolated mode context');
assert(statusSource.includes('restoreSearchModeContext(state.searchMode,restoredContext)'), 'operation history must restore the mode context before rendering');
assert(statusSource.includes("reason:'operation-history-restore'"), 'restored status searches must restart their asynchronous owner search');

const controls = {
  quickStatusEffectGroupSelect: { value: 'all' },
  quickStatusEffectSelect: { value: '' },
  quickStatusEffectResetBtn: { classList: { toggle() {} } },
  typeSearchPresetSelect: { value: '' }
};
const items = {
  'skills:克破': { category: 'skills', name: '克破' },
  'skills:看透': { category: 'skills', name: '看透' },
  'generals:LR関羽': { category: 'generals', name: 'LR関羽' }
};
const context = {
  Object, Array, Number,
  TYPE_SEARCH_ALLOWED_CATEGORIES: ['generals', 'equipments', 'siegeWeapons', 'warhorseSkills'],
  state: {
    activeCategories: { generals: false, skills: true, equipments: false, siegeWeapons: false, warhorseSkills: false },
    selectedItem: items['skills:克破'], selectedLabel: '技能', detailActiveTab: 'skillDetail',
    selectedTags: ['兵科:盾兵'], nameOnlySearch: false, searchResultRenderLimit: 100,
    quickStatusEffectOwnerFilter: null, _quickOwnerRowsCache: null,
    typeSearchSelectedPresetId: '', typeSearchPresetDirty: false,
    typeSearchSelectedStatusEffectIds: [], typeSearchSelectedFeatureIds: [],
    searchModeContexts: { normal: null, status: null, type: null }
  },
  els: { searchInput: { value: '克破' }, nameOnlySearchToggle: { checked: false } },
  document: { getElementById: id => controls[id] || null },
  detailCategory: item => item.category,
  getItemDisplayName: item => item.name,
  getCategoryLabel: category => ({ skills: '技能', generals: '武将' }[category] || category),
  getDetailInitialTabForItem: item => item.category === 'skills' ? 'skillDetail' : 'summary',
  safeCloneForDebug: value => value == null ? value : JSON.parse(JSON.stringify(value)),
  findItemByCategoryAndName: (category, name) => items[`${category}:${name}`] || null,
  refreshQuickStatusEffectOptions() {}, renderTagSearchControls() {}, debugLog() {}
};
vm.createContext(context);
for (const name of [
  'cloneSearchModeCategories', 'getSearchModeSelectionSnapshot', 'createSearchModeContext',
  'ensureSearchModeContext', 'captureSearchModeContext', 'resolveSearchModeSelection',
  'restoreSearchModeContext'
]) vm.runInContext(`${extractFunction(searchSource, name)}; this.${name}=${name};`, context);

context.captureSearchModeContext('normal');
const normal = context.state.searchModeContexts.normal;
assert.strictEqual(normal.keyword, '克破');
assert.strictEqual(normal.selection.name, '克破');
assert.deepStrictEqual([...normal.selectedTags], ['兵科:盾兵']);

const status = context.ensureSearchModeContext('status', { inheritCategories: context.state.activeCategories });
context.restoreSearchModeContext('status', status);
assert.strictEqual(context.els.searchInput.value, '', 'status search runtime must clear the hidden normal keyword');
assert.strictEqual(context.state.selectedItem, null, 'first status-search entry must not inherit normal detail selection');

context.state.quickStatusEffectOwnerFilter = { key: 'avoid-steal', group: 'selfResistanceBuff', label: '強化奪取回避' };
context.state._quickOwnerRowsCache = { key: 'status-cache', rows: [] };
controls.quickStatusEffectGroupSelect.value = 'selfResistanceBuff';
controls.quickStatusEffectSelect.value = 'avoid-steal';
context.state.selectedItem = items['skills:看透'];
context.state.selectedLabel = '技能';
context.state.detailActiveTab = 'skillDetail';
context.captureSearchModeContext('status');

context.restoreSearchModeContext('normal', normal);
assert.strictEqual(context.els.searchInput.value, '克破');
assert.strictEqual(context.state.selectedItem.name, '克破');
assert.strictEqual(context.state.quickStatusEffectOwnerFilter, null);

context.restoreSearchModeContext('status', context.state.searchModeContexts.status);
assert.strictEqual(context.els.searchInput.value, '');
assert.strictEqual(context.state.quickStatusEffectOwnerFilter.label, '強化奪取回避');
assert.strictEqual(context.state.selectedItem.name, '看透');
assert.strictEqual(controls.quickStatusEffectGroupSelect.value, 'selfResistanceBuff');
assert.strictEqual(controls.quickStatusEffectSelect.value, 'avoid-steal');

const type = context.ensureSearchModeContext('type', { inheritCategories: context.state.activeCategories });
context.restoreSearchModeContext('type', type);
context.state.typeSearchSelectedPresetId = 'attack-speed';
context.state.typeSearchSelectedStatusEffectIds = ['status:攻撃速度上昇'];
context.state.selectedItem = items['generals:LR関羽'];
context.state.selectedLabel = '武将';
context.captureSearchModeContext('type');
context.restoreSearchModeContext('status', context.state.searchModeContexts.status);
context.restoreSearchModeContext('type', context.state.searchModeContexts.type);
assert.strictEqual(context.state.typeSearchSelectedPresetId, 'attack-speed');
assert.deepStrictEqual([...context.state.typeSearchSelectedStatusEffectIds], ['status:攻撃速度上昇']);
assert.strictEqual(context.state.selectedItem.name, 'LR関羽');

console.log('Update09.5.60 search mode isolation passed: normal/status/type conditions and detail selections restore independently');
