const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const searchSource = fs.readFileSync('hado_status_effects.js', 'utf8');
function extractLastFunction(name) {
  const start = searchSource.lastIndexOf(`function ${name}(`);
  assert(start >= 0, `function missing: ${name}`);
  const bodyStart = searchSource.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < searchSource.length; index += 1) {
    if (searchSource[index] === '{') depth += 1;
    if (searchSource[index] === '}' && --depth === 0) return searchSource.slice(start, index + 1);
  }
  throw new Error(`unbalanced function: ${name}`);
}

const searchContext = {
  Array, JSON, Number, Object, String,
  norm: value => String(value ?? '').replace(/\s+/g, ' ').trim(),
  detailCategory: item => String(item?.sourceDataset || item?.category || ''),
  buildTacticAttackSearchText: () => ''
};
vm.createContext(searchContext);
for (const name of [
  'normalizeHadouTableRows', 'normalizeHadouTables', 'stringifyWithoutTextSample',
  'isGeneralCommentarySearchSection', 'isSearchExcludedSection',
  'isSearchExcludedTable', 'isSearchExcludedContentLine', 'sanitizeSectionForSearch',
  'sanitizeRawForSearch', 'buildSearchableText'
]) vm.runInContext(`${extractLastFunction(name)}; this.${name}=${name};`, searchContext);

const synthetic = {
  name: 'テスト武将', title: 'テスト武将', sourceDataset: 'generals',
  sections: [
    { title: 'テスト武将の基本情報', content: ['基本情報'] },
    { title: '解説', content: ['解説専用語'] },
    { title: 'テスト武将の戦法', content: ['戦法情報'] },
    { title: 'テスト戦法', content: ['実効果専用語 部隊の兵力+10%'] },
    { title: '兵科の基本能力', content: ['兵科能力専用語'] },
    { title: '各レベルの能力', content: ['兵科ランク専用語 基礎兵力9000'] },
    { title: '兵科ランク上昇タイミング', content: ['上昇時期専用語'] }
  ],
  tables: [
    [['兵科', '騎兵'], ['輸送', 'C'], ['機動', '100'], ['射程', '1.0'], ['攻撃間隔', '1秒'], ['表専用語', 'x']],
    [['Pv9', 'Pv10'], ['解放将星', '星0'], ['基礎兵力', '9000'], ['ランク表専用語', 'x']]
  ]
};
synthetic.raw = JSON.parse(JSON.stringify(synthetic));
const searchable = searchContext.buildSearchableText(synthetic);
for (const excluded of ['解説専用語', '兵科能力専用語', '兵科ランク専用語', '上昇時期専用語', '表専用語', 'ランク表専用語', '基礎兵力9000']) {
  assert(!searchable.includes(excluded.toLowerCase()), `excluded general source leaked: ${excluded}`);
}
assert(searchable.includes('実効果専用語'), 'actual tactic effect must remain searchable');

const generals = require('../hadou_generals.json').items;
function runtimeItem(item) {
  const tables = searchContext.normalizeHadouTables(item.tables);
  return { ...item, sourceDataset: 'generals', tables, raw: { ...item, tables } };
}
const troopMatches = generals.map(runtimeItem).filter(item => searchContext.buildSearchableText(item).includes('兵力'));
assert(troopMatches.length < generals.length, `troop-only sections still make every general match: ${troopMatches.length}/${generals.length}`);
assert(troopMatches.some(item => String(item.name || '').includes('司馬師')), 'real troop-increase effect must remain searchable');

const candidateSource = fs.readFileSync('hado_type_candidates.js', 'utf8');
const coreSource = fs.readFileSync('hado_core.js', 'utf8');
const entrySource = fs.readFileSync('hado_type_entry.js', 'utf8');
assert(candidateSource.includes("addEventListener(TRAY_SNAPSHOT,e=>syncPickedFromTraySnapshot"), 'tray snapshot listener missing');
assert(candidateSource.includes('await prepareRoleRowsBase(role'), 'candidate scoring must yield in batches');
assert(candidateSource.includes('rs.slice(0,Math.max(30,st.renderLimit))'), 'candidate DOM must be capped');
assert(entrySource.includes('window.HadoTypeDataStore.load()'), 'type entry must use shared data store');
assert(entrySource.includes('renderMainCandidateItems()'), 'type entry main candidates must be staged');
const setViewModeBody = coreSource.slice(coreSource.indexOf('function setViewMode('), coreSource.indexOf('async function createNewSave'));
assert(!setViewModeBody.includes('rebuildSavedModeIndex()'), 'view-mode toggle must reuse the maintained saved index');
assert(setViewModeBody.includes('scheduleViewModeFormationRender()'), 'formation redraw must be deferred');

const candidateSandbox = {
  console, window: null, state: { diagnostics: {}, mainTab: 'search' },
  setInterval: () => 0, addEventListener: () => {}, alert: () => {},
  localStorage: { getItem: () => null },
  MutationObserver: class { observe() {} },
  document: {
    readyState: 'complete', documentElement: {},
    head: { appendChild() {} }, body: { appendChild() {} },
    createElement: () => ({}), getElementById: () => null
  }
};
candidateSandbox.window = candidateSandbox;
vm.createContext(candidateSandbox);
vm.runInContext(candidateSource, candidateSandbox, { filename: 'hado_type_candidates.js' });
const candidateDebug = candidateSandbox.HadoTypeCandidatesDebug;
const trayRow = { roleId: 'main_general', name: 'LRテスト', displayName: 'LRテスト', typeId: 'vaccine' };
const trayKey = candidateDebug.trayPayloadKey(trayRow);
candidateDebug.setPickedStateForTest('main_general::LRテスト', trayKey);
candidateDebug.syncPickedFromTraySnapshot({ context: 'candidate-tray-add', items: [trayRow] });
assert(candidateDebug.getPickedState().picked, 'selection must remain while its tray row exists');
candidateDebug.syncPickedFromTraySnapshot({ context: 'candidate-tray-remove', items: [] });
assert.deepStrictEqual(candidateDebug.getPickedState().picked, '', 'selection must clear after tray removal');

const storeSource = fs.readFileSync('hado_type_data_store.js', 'utf8');
let fetchCount = 0;
const storeSandbox = {
  window: {}, performance: { now: () => 1 },
  fetch: async file => { fetchCount += 1; return { ok: true, json: async () => ({ file, items: [] }) }; }
};
vm.createContext(storeSandbox);
vm.runInContext(storeSource, storeSandbox, { filename: 'hado_type_data_store.js' });
Promise.all([storeSandbox.window.HadoTypeDataStore.load(), storeSandbox.window.HadoTypeDataStore.load()])
  .then(() => storeSandbox.window.HadoTypeDataStore.load())
  .then(() => {
    assert.strictEqual(fetchCount, 3, 'shared type data must fetch each of three files once per page');
    console.log(`PASS Update09.5.56 search/sync/performance: 兵力 ${troopMatches.length}/${generals.length}, shared fetches=${fetchCount}`);
  })
  .catch(error => { console.error(error); process.exitCode = 1; });
