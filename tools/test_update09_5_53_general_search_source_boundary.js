const fs = require('fs');
const vm = require('vm');
const generals = require('../hadou_generals.json');

const source = fs.readFileSync('hado_status_effects.js', 'utf8');

function extractLastFunction(name) {
  const start = source.lastIndexOf(`function ${name}(`);
  if (start < 0) throw new Error(`function missing: ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`function is not balanced: ${name}`);
}

const context = {
  Array,
  JSON,
  Number,
  Object,
  String,
  norm: value => String(value ?? '').replace(/\s+/g, ' ').trim(),
  detailCategory: item => String(item?.sourceDataset || item?.category || ''),
  buildTacticAttackSearchText: () => '',
};
vm.createContext(context);
for (const name of [
  'normalizeHadouTableRows',
  'normalizeHadouTables',
  'stringifyWithoutTextSample',
  'isGeneralCommentarySearchSection',
  'isSearchExcludedSection',
  'isSearchExcludedTable',
  'isSearchExcludedContentLine',
  'sanitizeSectionForSearch',
  'sanitizeRawForSearch',
  'buildSearchableText',
]) {
  vm.runInContext(`${extractLastFunction(name)}; this.${name} = ${name};`, context);
}

function toRuntimeItem(item) {
  const tables = context.normalizeHadouTables(item.tables);
  const name = String(item.name || item.title || '').replace(/^【三國志 覇道】/, '').replace(/の戦法と技能$/, '');
  return {
    name,
    title: item.title,
    description: item.description || '',
    category: item.category || '武将',
    sourceDataset: 'generals',
    tables,
    sections: item.sections || [],
    raw: { ...item, tables },
    searchTokens: [item.name, item.title, item.description].filter(Boolean),
  };
}

const items = generals.items || generals;
const matches = items
  .map(toRuntimeItem)
  .filter(item => context.buildSearchableText(item).includes('関羽'))
  .map(item => item.name)
  .sort((left, right) => left.localeCompare(right, 'ja'));

const expected = [
  'LR周倉（しゅうそう）',
  'LR関羽（かんう）',
  'LR関銀屏（かんぎんぺい）',
  'LR関平（かんぺい）',
  'UR廖化（りょうか）',
  'UR関羽（かんう）',
  '関羽（かんう）',
].sort((left, right) => left.localeCompare(right, 'ja'));

if (JSON.stringify(matches) !== JSON.stringify(expected)) {
  throw new Error(`関羽 expected ${JSON.stringify(expected)}, actual ${JSON.stringify(matches)}`);
}

for (const excludedName of [
  'LR呂蒙・盾兵（りょもう）',
  'LR司馬師（しばし）',
  'LR張良（ちょうりょう）',
  'UR蒋欽（しょうきん）',
  'LR孟獲（もうかく）',
  'LR呂玲綺（りょれいき）',
  'UR張苞（ちょうほう）',
  '黄忠（こうちゅう）',
  'LR夏侯淵・盾兵（かこうえん）',
]) {
  if (matches.includes(excludedName)) {
    throw new Error(`out-of-scope commentary or biography match survived: ${excludedName}`);
  }
}

const futureCommentary = {
  name: 'テスト武将',
  title: 'テスト武将',
  sourceDataset: 'generals',
  sections: [
    { title: 'テスト武将の基本情報', content: ['基本情報'] },
    { title: '将来追加された攻略見出し', content: ['関羽と組み合わせる解説'] },
    { title: 'テスト武将の戦法', content: ['戦法情報'] },
    { title: 'テスト戦法', content: ['対象に攻撃する'] },
  ],
  tables: [],
  raw: {},
};
futureCommentary.raw = { ...futureCommentary };
if (context.buildSearchableText(futureCommentary).includes('関羽')) {
  throw new Error('future arbitrary commentary heading was not structurally excluded');
}

const actualEffect = {
  name: 'テスト武将',
  title: 'テスト武将',
  sourceDataset: 'generals',
  sections: [
    { title: 'テスト武将の基本情報', content: ['基本情報'] },
    { title: 'テスト武将の戦法', content: ['戦法情報'] },
    { title: 'テスト戦法', content: ['主将が関羽の際、攻撃を上昇'] },
  ],
  tables: [],
  raw: {},
};
actualEffect.raw = { ...actualEffect };
if (!context.buildSearchableText(actualEffect).includes('関羽')) {
  throw new Error('actual tactic or skill effect text was incorrectly excluded');
}

console.log(`PASS Update09.5.53 general search source boundary: ${matches.length} exact matches`);
