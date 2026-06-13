const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

let savedLevel = 'Ⅱ';
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
    skills: [{ name: '連堅' }, { name: '堅強' }, { name: '未解放' }, { name: '盟主' }, { name: '備急' }]
  },
  normalizeSaveItemName: value => String(value || '').normalize('NFKC').trim(),
  getItemDisplayName: item => item?.name || item?.title || '',
  getCurrentSave: () => ({ name: '保存テスト', generals: ['LRテスト'], equipments: [] }),
  findSavedGeneralItemByName: name => ({ name }),
  getResolvedGeneralSkillLevelMap: () => new Map([['連堅', { level: savedLevel }], ['盟主', { level: savedLevel }], ['備急', { level: savedLevel }]]),
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

let profile = debug.savedSkillProfileForGeneral('LRテスト');
assert(profile.names.has('連堅'), 'saved star resolved source skill should be owned');
assert(profile.names.has('堅強'), 'saved star resolved granted skill should be owned at sufficient level');
assert.strictEqual(profile.levels.get('連堅'), 2, 'source skill level should be tracked');
assert.strictEqual(profile.levels.get('堅強'), 2, 'granted skill level should be tracked');
assert(!profile.names.has('未解放'), 'unresolved skill should not be owned');

const row = {
  source: 'effect-text',
  featureId: 'skill_effect:strengthening',
  label: '強化促進',
  matchedText: '■主将の際 ●連堅2により堅強Lv2を付与。■副将の際 ●未解放Lv1を付与。'
};
assert.strictEqual(debug.rowUsesUnownedSkill(row, profile.names, 'main_general', profile.levels), false, 'main role should keep saved-star granted skill in main-only clause');
assert.strictEqual(debug.rowUsesUnownedSkill(row, profile.names, 'vice_general', profile.levels), true, 'vice role should reject unowned skill in vice-only clause');
assert.strictEqual(debug.requiredSkillLevel('盟主がLv3以上であれば攻撃無効も付与できる', '盟主'), 3, 'skill requirement should parse がLv3以上');
assert.strictEqual(debug.requiredSkillLevel('技能「備急」をLv2にすると通常攻撃威力上昇も付与', '備急'), 2, 'skill requirement should parse をLv2');
assert.strictEqual(debug.requiredSkillLevel('●歓喜Lv2', '歓喜'), 2, 'skill requirement should parse direct skill Lv2');
assert.strictEqual(debug.requiredSkillLevel('自部隊の「南蛮」の技能Lv×20%、威力が上昇', '南蛮'), 1, 'skill multiplier without threshold should not become Lv20');

savedLevel = 'Ⅰ';
profile = debug.savedSkillProfileForGeneral('LRテスト');
assert(profile.names.has('連堅'), 'lower saved star still owns the source skill');
assert.strictEqual(profile.levels.get('連堅'), 1, 'lower saved star should track lower source skill level');
assert(!profile.names.has('堅強'), 'lower saved star should not own level-2 granted skill');
assert.strictEqual(debug.rowUsesUnownedSkill(row, profile.names, 'main_general', profile.levels), true, 'main role should reject skill clauses above the saved skill level');
assert.strictEqual(debug.rowUsesUnownedSkill({source:'effect-text',matchedText:'盟主がLv3以上であれば攻撃無効も付与できる'}, profile.names, 'main_general', profile.levels), true, 'Lv3 prose condition should be rejected when saved skill is Lv1');

console.log('Update08.20 saved type candidate limited skill requirement regression: passed');
