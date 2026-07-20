#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const coreSource = fs.readFileSync('hado_core.js', 'utf8');

function extractLastFunction(name) {
  let start = coreSource.lastIndexOf(`function ${name}(`);
  assert(start >= 0, `function missing: ${name}`);
  if (coreSource.slice(Math.max(0, start - 6), start) === 'async ') start -= 6;
  const bodyStart = coreSource.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < coreSource.length; index += 1) {
    if (coreSource[index] === '{') depth += 1;
    if (coreSource[index] === '}' && --depth === 0) return coreSource.slice(start, index + 1);
  }
  throw new Error(`unbalanced function: ${name}`);
}

const storage = new Map();
const context = {
  console, JSON, Date, Map, Set, String, Number, Object, Array,
  SAVE_STORAGE_KEY: 'hado-save-roundtrip-test',
  HADO_BUILD_INFO: { version: '3.0.0.0' },
  state: {},
  els: { saveSelect: null, mobileSearchHistorySelect: null },
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value))
  },
  norm: value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim(),
  uniq: values => [...new Set(values)],
  createSaveId: () => 'generated-save-id',
  normalizeSaveItemName: value => String(value ?? '').replace(/[（(].*?[）)]/g, '').trim(),
  normalizeEquipmentStage: value => ['initial', 'ssrMax', 'urMax'].includes(value) ? value : 'urMax',
  buildCanonicalValueMap: (value, merge) => Object.entries(value && typeof value === 'object' ? value : {}).reduce((out, [key, row]) => { out[key] = merge(row, out[key]); return out; }, {}),
  mergeGeneralSettingValue: (previous, value) => ({ ...(previous || {}), ...(value || {}) }),
  sanitizeEthnicResearchSkillSettings: value => JSON.parse(JSON.stringify(value || {})),
  sanitizeInheritedSkillSettings: value => JSON.parse(JSON.stringify(value || {})),
  sanitizeWarhorseSaveData: value => JSON.parse(JSON.stringify(value || { owned: {} })),
  sanitizeFormationData: value => ({
    groups: JSON.parse(JSON.stringify(value?.groups || [{ id: 'group_1', name: 'グループ1' }])),
    currentFormationGroupId: value?.currentFormationGroupId || 'group_1',
    formations: JSON.parse(JSON.stringify(value?.formations || [])),
    currentFormationId: value?.currentFormationId || value?.formations?.[0]?.id || ''
  }),
  debugSaveNameMigration() {},
  debugLog() {},
  debugResponsiveSnapshot() {},
  persistSearchHistory() {},
  forceRefreshSearchHistoryAfterImport() {},
  rebuildSavedModeIndex() {},
  renderSaveControls() {},
  renderSearchHistory() {},
  renderSearchResults() {},
  renderDetail() {},
  renderFormationScreen() {},
  markFormationScreenStale() {},
  updateCountStatus() {},
  renderDebugPanel() {},
  requestConfirmDialog: async () => true,
  persistSaveData: () => { storage.set('hado-save-roundtrip-test', JSON.stringify(context.state.saveData)); return true; },
  persistFormationData: () => true,
  setTimeout: callback => { callback(); return 0; }
};
vm.createContext(context);
for (const name of [
  'defaultSaveData', 'sanitizeSaveRecord', 'sanitizeSaveDataStructure',
  'syncCurrentSaveSelection', 'sanitizeSearchHistoryList', 'getCurrentSave',
  'buildFormationDataExportObject', 'readImportedFormationData',
  'buildSaveDataExportObject', 'pickPrimaryImportedSaveRecord',
  'mergeImportedSaveRecordIntoCurrent', 'mergeImportedFormationDataIntoCurrent',
  'importSaveDataFromText'
]) {
  vm.runInContext(`${extractLastFunction(name)}; this.${name}=${name};`, context);
}

context.state = {
  saveData: {
    saves: [{ id: 'save_a', name: '検証保存', generals: ['LR関羽（かんう）'], equipments: ['青龍偃月刀'], generalSettings: {}, generalStars: { 'LR関羽': 4 }, equipmentStars: {}, equipmentStages: {}, ethnicResearchSkills: {}, inheritedSkills: {}, warhorses: { owned: {} } }],
    currentSaveId: 'save_a', searchHistory: []
  },
  searchHistory: ['兵力+', '関羽'],
  formationGroups: [{ id: 'group_1', name: 'グループ1' }],
  currentFormationGroupId: 'group_1',
  formations: [{ id: 'formation_a', groupId: 'group_1', name: '検証部隊', slots: {} }],
  currentFormationId: 'formation_a',
  mainTab: 'search', selectedItem: null
};

const exported = context.buildSaveDataExportObject();
assert.strictEqual(exported.exportScope, 'currentSave');
assert.strictEqual(exported.saves.length, 1);
assert.strictEqual(exported.saves[0].id, 'save_a');
assert.deepStrictEqual(Array.from(exported.searchHistory), ['兵力+', '関羽']);
assert.strictEqual(exported.formationData.formations[0].id, 'formation_a');

context.state.saveData = {
  saves: [{ id: 'save_existing', name: '既存保存', generals: [], equipments: [], generalSettings: {}, generalStars: {}, equipmentStars: {}, equipmentStages: {}, ethnicResearchSkills: {}, inheritedSkills: {}, warhorses: { owned: {} } }],
  currentSaveId: 'save_existing', searchHistory: []
};
context.state.searchHistory = ['既存履歴'];
context.state.formations = [{ id: 'formation_existing', groupId: 'group_1', name: '既存部隊', slots: {} }];
context.state.currentFormationId = 'formation_existing';

(async () => {
  assert.strictEqual(await context.importSaveDataFromText(JSON.stringify(exported), 'roundtrip.json'), true);
  assert.deepStrictEqual(Array.from(context.state.saveData.saves, save => save.id).sort(), ['save_a', 'save_existing']);
  assert.strictEqual(context.state.saveData.currentSaveId, 'save_a');
  assert.deepStrictEqual(Array.from(context.state.searchHistory), ['兵力+', '関羽', '既存履歴']);
  assert.deepStrictEqual(Array.from(context.state.formations, formation => formation.id).sort(), ['formation_a', 'formation_existing']);
  const persisted = JSON.parse(storage.get('hado-save-roundtrip-test'));
  assert.strictEqual(persisted.currentSaveId, 'save_a');
  assert.strictEqual(persisted.saves.length, 2);

  exported.saves[0].name = '検証保存・更新';
  assert.strictEqual(await context.importSaveDataFromText(JSON.stringify(exported), 'roundtrip-overwrite.json'), true);
  assert.strictEqual(context.state.saveData.saves.length, 2, 'same save id must overwrite without duplicating');
  assert.strictEqual(context.state.saveData.saves.find(save => save.id === 'save_a').name, '検証保存・更新');
  console.log('Update09.5.59 save Export/Import roundtrip passed: add, preserve, persist, formation merge, history merge, overwrite');
})().catch(error => { console.error(error); process.exitCode = 1; });
