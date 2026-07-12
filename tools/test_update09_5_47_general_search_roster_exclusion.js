const fs = require('fs');
const vm = require('vm');
const generals = require('../hadou_generals.json');

const source = fs.readFileSync('hado_status_effects.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

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
  'isSearchExcludedSection',
  'isSearchExcludedTable',
  'sanitizeRawForSearch',
  'buildSearchableText',
]) {
  vm.runInContext(`${extractLastFunction(name)}; this.${name} = ${name};`, context);
}

const items = generals.items || generals;
const xiahou = items.find(item => String(item.name || '').includes('LR夏侯淵・盾兵'));
if (!xiahou) throw new Error('LR夏侯淵・盾兵 fixture missing');

const sourceRoster = (xiahou.tables || [])
  .filter(table => [20, 21].includes(Number(table.index)))
  .map(table => JSON.stringify(table))
  .join(' ');
if (!sourceRoster.includes('関羽')) {
  throw new Error('fixture does not reproduce 関羽 roster contamination');
}

const normalizedOnce = context.normalizeHadouTables(xiahou.tables);
const normalizedTwice = context.normalizeHadouTables(normalizedOnce);
for (const sourceIndex of [20, 21]) {
  const table = normalizedTwice.find(candidate => Number(candidate._sourceIndex) === sourceIndex);
  if (!table) throw new Error(`normalized table lost source index ${sourceIndex}`);
  if (!context.isSearchExcludedTable({ sourceDataset: 'generals' }, table)) {
    throw new Error(`normalized general roster table ${sourceIndex} was not excluded`);
  }
}

const runtimeItem = {
  name: xiahou.name,
  title: xiahou.title,
  description: xiahou.description || '',
  category: xiahou.category || '武将',
  sourceDataset: 'generals',
  tables: normalizedTwice,
  sections: xiahou.sections || [],
  raw: { ...xiahou, tables: normalizedOnce },
  searchTokens: [xiahou.name, xiahou.title].filter(Boolean),
};
const searchableText = context.buildSearchableText(runtimeItem);
if (searchableText.includes('関羽')) {
  throw new Error('LR夏侯淵・盾兵 runtime search text still contains 関羽');
}
if (!searchableText.includes('夏侯淵')) {
  throw new Error('runtime search text lost the general own name');
}
if (!html.includes('hado_status_effects.js?v=09.5.49-r139')) {
  throw new Error('status-effect runtime cache bust is missing');
}

console.log('PASS general roster exclusion after runtime table normalization');
