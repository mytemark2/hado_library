const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const sandbox = {
  console,
  setInterval: () => 0,
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
    skills: [{ name: '堅強' }, { name: '未解放' }]
  },
  normalizeSaveItemName: value => String(value || '').normalize('NFKC').trim(),
  getItemDisplayName: item => item?.name || item?.title || '',
  getCurrentSave: () => ({ name: '保存テスト', generals: ['LRテスト'], equipments: [] }),
  findSavedGeneralItemByName: name => ({ name }),
  getResolvedGeneralSkillLevelMap: () => new Map([['連堅', { level: 'Ⅱ' }]]),
  collectGrantedSkillEntriesForSavedIndex: (skillName, level) => skillName === '連堅' && level === 'Ⅱ' ? [{ name: '堅強', level: 'Ⅱ', found: true }] : [],
  getCurrentInheritedSkill: () => null,
  createFormationFromTypeSelection: () => null
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('hado_type_score.js', 'utf8'), sandbox, { filename: 'hado_type_score.js' });
vm.runInContext(fs.readFileSync('hado_type_candidates.js', 'utf8'), sandbox, { filename: 'hado_type_candidates.js' });

const debug = sandbox.window.HadoTypeCandidatesDebug;
assert(debug, 'HadoTypeCandidatesDebug should be exposed for regression checks');

const ownedSkills = debug.savedSkillNameSetForGeneral('LRテスト');
assert(ownedSkills.has('連堅'), 'saved star resolved source skill should be owned');
assert(ownedSkills.has('堅強'), 'saved star resolved granted skill should be owned');
assert(!ownedSkills.has('未解放'), 'unresolved skill should not be owned');

const row = {
  source: 'effect-text',
  featureId: 'skill_effect:strengthening',
  label: '強化促進',
  matchedText: '■主将の際 ●堅強Lv2を付与。■副将の際 ●未解放Lv1を付与。'
};
assert.strictEqual(debug.rowUsesUnownedSkill(row, ownedSkills, 'main_general'), false, 'main role should keep saved-star granted skill in main-only clause');
assert.strictEqual(debug.rowUsesUnownedSkill(row, ownedSkills, 'vice_general'), true, 'vice role should reject unowned skill in vice-only clause');

console.log('Update08.18 saved type candidate role-limited skill filter regression: passed');
