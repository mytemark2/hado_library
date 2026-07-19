#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const candidatesSource = fs.readFileSync('hado_type_candidates.js', 'utf8');
const formationSource = fs.readFileSync('hado_formation.js', 'utf8');

assert(!candidatesSource.includes('data-add-tray'), 'redundant candidate add button must not return');
assert(candidatesSource.includes('カード選択は候補へ即時反映されます。'), 'edit mode must explain immediate candidate updates');
assert(candidatesSource.includes("st.context=options.source==='type-entry-save'?'draft':'formation'"), 'type-entry flow must use an isolated draft');
assert(candidatesSource.includes('data-workspace-main-select=') && candidatesSource.includes('主将に選択中'), 'candidate mode must expose its selected main general');
assert(candidatesSource.includes("st.sel?.typeId?'<button class=\"htc-btn primary\" data-create-formation>この型で新規部隊</button>':''"), 'new formation action must belong to candidate mode');

const draftStorage = new Map();
const candidateContext = {
  console, Date, Map, Set, JSON, String, Number, Object, Array,
  state: { diagnostics: {}, mainTab: 'search' },
  window: null,
  localStorage: {
    getItem: key => draftStorage.has(key) ? draftStorage.get(key) : null,
    setItem: (key, value) => draftStorage.set(key, String(value)),
    removeItem: key => draftStorage.delete(key),
  },
  document: {
    readyState: 'complete', documentElement: {},
    head: { appendChild() {} }, body: { appendChild() {} },
    createElement: () => ({}), getElementById: () => null,
  },
  MutationObserver: class { observe() {} },
  addEventListener() {},
  setInterval: () => 0,
  setTimeout: callback => { callback(); return 0; },
  requestAnimationFrame: callback => callback(),
  alert() {},
};
candidateContext.window = candidateContext;
vm.createContext(candidateContext);
vm.runInContext(candidatesSource, candidateContext, { filename: 'hado_type_candidates.js' });
const candidateDebug = candidateContext.HadoTypeCandidatesDebug;
const seeded = candidateDebug.initializeDraftForTest({
  typeId: 'attack_speed', typeName: '攻撃速度型', purposeId: 'siege',
  mainGeneral: { id: 'general-lr-kanu', roleId: 'main_general', name: 'LR関羽', displayName: 'LR関羽（かんう）' },
});
assert.strictEqual(seeded.draftItems.length, 1, 'selected main general must seed exactly one draft candidate');
assert.strictEqual(seeded.draftItems[0].roleId, 'main_general');
assert.strictEqual(seeded.draftItems[0].name, 'LR関羽');
assert.strictEqual(seeded.draftItems[0].source, '型編成ナビ');
assert.strictEqual(seeded.primaryMainKey, candidateDebug.trayPayloadKey(seeded.draftItems[0]), 'seeded main general must be selected');

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

const existing = { id: 'formation_existing', groupId: 'group_1', name: '既存部隊', slots: { main: { general: 'UR曹操' } }, candidateTray: [{ id: 'old', roleId: 'main_general', name: 'UR曹操' }] };
const snapshotContexts = [];
const formationContext = {
  console, Date,
  window: { alert() {} },
  state: { formations: [existing], currentFormationId: existing.id, currentFormationGroupId: 'group_1', formationDirty: false },
  norm: value => String(value ?? '').trim(),
  normalizeSaveItemName: value => String(value ?? '').replace(/[（(].*?[）)]/g, '').trim(),
  getCurrentFormationGroup: () => ({ id: 'group_1', name: 'グループ1' }),
  getVisibleFormations: () => formationContext.state.formations.filter(row => row.groupId === 'group_1'),
  createFormationRecord: name => ({ id: 'formation_new', groupId: 'group_1', name, slots: { main: { general: '' } }, candidateTray: [], evaluationTypeId: '', evaluationTypeName: '', memo: '' }),
  sanitizeFormationCandidateTray: rows => rows.map(row => ({ ...row, name: formationContext.normalizeSaveItemName(row.name), displayName: row.displayName || row.name })),
  findItemByDisplayName: (_category, name) => formationContext.normalizeSaveItemName(name) === 'LR関羽' ? { name: 'LR関羽（かんう）' } : null,
  evaluateFormationRoleCandidateEligibility: () => ({ ok: true, reason: 'eligible' }),
  getItemDisplayName: item => item.name,
  saveFormationDataToStorage() { return true; },
  dispatchFormationCandidateTraySnapshot: context => snapshotContexts.push(context),
  debugLog() {}, renderFormationScreen() {}, showFormationToast() {},
  FORMATION_MAX_PER_GROUP: 12,
};
vm.createContext(formationContext);
vm.runInContext(`${extractFunction(formationSource, 'createFormationFromTypeSelection')}; this.createFormationFromTypeSelection=createFormationFromTypeSelection;`, formationContext);
const created = formationContext.createFormationFromTypeSelection({
  typeId: 'attack_speed', typeName: '攻撃速度型',
  candidateTray: seeded.draftItems,
  mainGeneral: 'LR関羽',
});
assert(created, 'new formation must be created');
assert.strictEqual(created.evaluationTypeId, 'attack_speed');
assert.strictEqual(created.candidateTray.length, 1, 'reviewed candidates must be copied to the new formation');
assert.strictEqual(created.candidateTray[0].roleId, 'main_general');
assert.strictEqual(created.slots.main.general, 'LR関羽', 'selected main general must be assigned to the new formation main slot');
assert.strictEqual(existing.slots.main.general, 'UR曹操', 'the existing formation must not be overwritten');
assert.strictEqual(existing.candidateTray[0].name, 'UR曹操', 'the existing formation candidate tray must remain unchanged');
assert.deepStrictEqual(snapshotContexts, ['create-from-type'], 'new formation must immediately refresh the candidate workspace launcher snapshot');

console.log('Update09.5.64 candidate workspace flow passed: immediate edit, isolated draft, selected main, candidate-mode creation, no existing-formation overwrite');
