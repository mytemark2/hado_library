const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const sandbox = {
  console: { info() {}, log() {}, warn() {}, error() {} },
  setInterval: () => 0,
  setTimeout: fn => { if (typeof fn === 'function') fn(); return 0; },
  addEventListener: () => {},
  alert: () => {},
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  MutationObserver: class { observe() {} },
  document: {
    readyState: 'complete',
    documentElement: {},
    head: { appendChild() {} },
    body: { appendChild() {} },
    createElement: () => ({}),
    getElementById: () => null
  },
  state: {
    viewMode: 'saved',
    skills: [{ name: '連堅' }, { name: '堅強' }, { name: '未解放' }],
    diagnostics: {}
  },
  normalizeSaveItemName: value => String(value || '').normalize('NFKC').trim(),
  getItemDisplayName: item => item?.name || item?.title || '',
  getCurrentSave: () => ({
    name: '診断テスト',
    generals: ['LRテスト'],
    equipments: [],
    generalStars: { LRテスト: 7 },
    generalSettings: {},
    inheritedSkills: {}
  }),
  findSavedGeneralItemByName: name => ({ name }),
  getResolvedGeneralSkillLevelMap: () => new Map([['連堅', { level: 'Ⅰ' }]]),
  collectGrantedSkillEntriesForSavedIndex: () => [],
  getCurrentInheritedSkill: () => null,
  debugLog: (event, payload) => { sandbox.lastDebug = { event, payload }; },
  createFormationFromTypeSelection: () => null
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('hado_type_score.js', 'utf8'), sandbox, { filename: 'hado_type_score.js' });
vm.runInContext(fs.readFileSync('hado_type_candidates.js', 'utf8'), sandbox, { filename: 'hado_type_candidates.js' });

const debug = sandbox.window.HadoTypeCandidatesDebug;
assert(debug, 'HadoTypeCandidatesDebug should be exposed');
assert.strictEqual(typeof debug.getDiagnostics, 'function', 'diagnostics accessor should be exposed');
assert.strictEqual(typeof debug.rowSkillRejection, 'function', 'row-level rejection reason should be exposed');
assert.strictEqual(typeof debug.auditSavedCandidateRows, 'function', 'candidate row audit should be exposed');

const mainOnlyUnowned = {
  source: 'effect-text',
  featureId: 'skill_effect:buff',
  label: '強化',
  matchedText: '■主将の際 ●未解放Lv1を付与。'
};
const profile = debug.savedSkillProfileForGeneral('LRテスト');
assert(profile.names.has('連堅'), 'saved profile should include resolved saved-star skill');
const rejection = debug.rowSkillRejection(mainOnlyUnowned, profile.names, 'main_general', profile.levels);
assert(rejection, 'main-only unowned skill row should expose rejection reason');
assert.strictEqual(rejection.reason, 'skill-unowned');
assert.strictEqual(rejection.skill, '未解放');

const viceAudit = debug.auditSavedCandidateRows({
  roleId: 'vice_general',
  displayName: 'LRテスト',
  typeFeatures: [mainOnlyUnowned],
  statusEffectRefs: []
}, profile);
assert.strictEqual(viceAudit.limitedRows, 1, 'limited row count should be captured');
assert.strictEqual(viceAudit.roleEmptyRows, 1, 'role-incompatible limited row should be captured');
assert.strictEqual(viceAudit.skillRejectedRows, 0, 'role-incompatible row should not be counted as saved-skill rejection');

const data = debug.emitCandidateDiagnostic('self-check', { roleId: 'main_general', finalCount: 1 });
assert.strictEqual(data.saveName, '診断テスト');
assert.strictEqual(sandbox.state.diagnostics.typeCandidates.latest.event, 'self-check');
assert.strictEqual(sandbox.state.diagnostics.typeCandidates.latest.saveSources.generals, 1);
assert(sandbox.lastDebug.event.includes('typeCandidate:self-check'), 'debugLog should receive diagnostic event');

console.log('Update08.22 type-candidate diagnostic logging regression: passed');
