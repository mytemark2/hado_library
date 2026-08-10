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

const huaman = items.find(item => String(item.name || '').includes('UR花鬘'));
if (!huaman) throw new Error('UR花鬘 fixture missing');
const huamanOwnerRoster = (huaman.sections || [])
  .flatMap(section => section.content || [])
  .find(line => String(line).includes('兵心を持つ武将') && String(line).includes('LR関羽'));
if (!huamanOwnerRoster) throw new Error('skill-owner roster fixture missing');
const huamanTables = context.normalizeHadouTables(huaman.tables);
const huamanRuntime = {
  name: huaman.name,
  title: huaman.title,
  description: huaman.description || '',
  category: huaman.category || '武将',
  sourceDataset: 'generals',
  tables: context.normalizeHadouTables(huamanTables),
  sections: huaman.sections || [],
  raw: { ...huaman, tables: huamanTables },
  searchTokens: [huaman.name, huaman.title].filter(Boolean),
};
if (context.buildSearchableText(huamanRuntime).includes('関羽')) {
  throw new Error('UR花鬘 runtime search text still contains another-general roster 関羽');
}
const versionSource = fs.readFileSync('hado_version.js', 'utf8');
const releaseVersion = versionSource.match(/releaseVersion:\s*'([^']+)'/)?.[1];
const updateNo = versionSource.match(/updateNo:\s*'([^']*)'/)?.[1] || '';
const revision = versionSource.match(/revision:\s*(\d+)/)?.[1];
const cacheKey = `${updateNo || releaseVersion}-r${revision}`;
for (const asset of ['hado_version.js', 'hado_core.js', 'hado_status_effects.js']) {
  if (!html.includes(`${asset}?v=${cacheKey}`)) {
    throw new Error(`${asset} cache bust does not match ${cacheKey}`);
  }
}

console.log('PASS general roster exclusion after runtime table normalization');
