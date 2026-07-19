#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const candidatesSource = fs.readFileSync('hado_type_candidates.js', 'utf8');
const launcherSource = fs.readFileSync('hado_candidate_tray.js', 'utf8');
const storage = new Map();
const selection = {
  typeId: 'attack_speed', typeName: '攻撃速度型', purposeId: 'siege',
  mainGeneral: { id: 'general-lr-kanu', roleId: 'main_general', name: 'LR関羽', displayName: 'LR関羽（かんう）' },
};

function createCandidateContext() {
  const events = [];
  const context = {
    console, Date, Map, Set, JSON, String, Number, Object, Array,
    state: { diagnostics: {}, mainTab: 'formation' },
    window: null,
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    },
    CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    dispatchEvent: event => { events.push(event); return true; },
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
  context.window = context;
  vm.createContext(context);
  vm.runInContext(candidatesSource, context, { filename: 'hado_type_candidates.js' });
  return { context, debug: context.HadoTypeCandidatesDebug, events };
}

storage.set('hado.typeEntry.selection.v1', JSON.stringify(selection));
const first = createCandidateContext();
const seeded = first.debug.initializeDraftForTest(selection);
const mainKey = first.debug.trayPayloadKey(seeded.draftItems[0]);
first.debug.setWorkspaceStateForTest({
  context: 'draft', selection, draftItems: seeded.draftItems, primaryMainKey: mainKey,
  mode: 'edit', workspaceTab: 'vice_general', role: 'vice_general', query: '連鎖', renderLimit: 120,
});
const saved = first.debug.saveDraftForTest();
assert(saved, 'matching pre-formation draft must be saved');
assert.strictEqual(saved.mode, 'edit');
assert.strictEqual(saved.workspaceTab, 'vice_general');
assert.strictEqual(saved.role, 'vice_general');
assert.strictEqual(saved.query, '連鎖');
assert.strictEqual(saved.renderLimit, 120);
assert.strictEqual(saved.primaryMainKey, mainKey);

const launcherPlan = first.debug.workspaceOpenPlan({ source: 'candidate-workspace-launcher', mode: 'candidate' }, saved);
assert.deepStrictEqual(JSON.parse(JSON.stringify(launcherPlan)), {
  context: 'draft', mode: 'edit', workspaceTab: 'vice_general', role: 'vice_general', query: '連鎖', renderLimit: 120,
}, 'normal launcher must resume the pending draft and its UI state instead of reverting to the active formation');
const eventPlan = first.debug.workspaceOpenPlan({}, saved);
assert.strictEqual(eventPlan.context, 'draft', 'event/API launch without a source must resume the matching draft');

const reloaded = createCandidateContext();
const afterReload = reloaded.debug.loadMatchingDraftForTest(selection);
assert(afterReload, 'matching draft must remain available after application reload');
assert.strictEqual(afterReload.primaryMainKey, mainKey);
assert.strictEqual(afterReload.workspaceTab, 'vice_general');
assert.strictEqual(afterReload.query, '連鎖');
assert.strictEqual(reloaded.debug.workspaceOpenPlan({ source: 'candidate-workspace-launcher', mode: 'candidate' }, afterReload).context, 'draft');

const otherSelection = { ...selection, typeId: 'defense', typeName: '防御型' };
const mismatch = reloaded.debug.loadMatchingDraftForTest(otherSelection);
assert.strictEqual(mismatch, null, 'a draft for another type selection must not be mixed into the active formation');
assert.strictEqual(reloaded.debug.workspaceOpenPlan({ source: 'candidate-workspace-launcher', mode: 'candidate' }, mismatch).context, 'formation');

assert(first.events.some(event => event.type === 'hado:type-candidate-draft-snapshot' && event.detail?.active && event.detail.count === 1), 'draft changes must publish their count to the launcher');
assert(launcherSource.includes("DRAFT_SNAPSHOT='hado:type-candidate-draft-snapshot'"), 'launcher must consume draft snapshots');
assert(launcherSource.includes('draftSnapshot.active?Number(draftSnapshot.count||0)'), 'launcher badge must prefer the pending draft count');
assert(candidatesSource.includes("addEventListener(DRAFT_SNAPSHOT_REQUEST,()=>publishDraftSnapshot())"), 'page reload must support a launcher snapshot request');

console.log('Update09.5.65 candidate draft resume passed: launcher/event/reload state restore, context isolation, badge sync');
