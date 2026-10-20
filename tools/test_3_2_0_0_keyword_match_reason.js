const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('hado_search.js', 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
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
  Object,
  Array,
  Set,
  Math,
  String,
  norm: value => String(value ?? '').replace(/\s+/g, ' ').trim(),
  getItemDisplayName: item => String(item?.name || item?.title || ''),
  sanitizeSectionForSearch: (_item, section) => section,
  isSearchExcludedTable: () => false,
  sanitizeRawForSearch: (_item, raw) => raw,
  getFastSearchableText: item => String(item?._searchableText || '').toLowerCase(),
};
vm.createContext(context);
for (const name of ['splitKeywordReasonSentences', 'cropKeywordReasonSentence', 'collectKeywordReasonValues', 'buildKeywordMatchReason']) {
  vm.runInContext(`${extractFunction(name)}; this.${name} = ${name};`, context);
}

const nameReason = context.buildKeywordMatchReason({ name: 'LR李典' }, '李典', true);
if (nameReason !== '一致理由：名称「LR李典」に「李典」が一致。') throw new Error(`unexpected name reason: ${nameReason}`);

const effectItem = {
  name: 'テスト技能',
  sections: [{ title: '効果', content: ['自身の攻撃を上昇する。', '交戦開始時に味方3部隊へ結束を付与する。', '防御も上昇する。'] }],
  tables: [],
  raw: {},
};
const effectReason = context.buildKeywordMatchReason(effectItem, '結束', false);
if (effectReason !== '一致理由：交戦開始時に味方3部隊へ結束を付与する。') throw new Error(`unexpected effect reason: ${effectReason}`);
if (effectReason.includes('防御も上昇')) throw new Error('reason included a sentence after the matching sentence');

const unsafeItem = { name: '安全確認', description: '<img src=x onerror=alert(1)>で工兵を強化する。', raw: {} };
const unsafeReason = context.buildKeywordMatchReason(unsafeItem, '工兵', false);
if (!unsafeReason.includes('工兵')) throw new Error('matching keyword missing from unsafe-text reason');
if (!source.includes('${esc(keywordReason)}')) throw new Error('keyword reason is not escaped before HTML rendering');

const longReason = context.buildKeywordMatchReason({ name: '長文', description: `${'前'.repeat(200)}結束${'後'.repeat(200)}`, raw: {} }, '結束', false);
if (longReason.length > 190 || !longReason.includes('結束') || !longReason.includes('…')) throw new Error(`long reason was not cropped safely: ${longReason.length}`);

if (context.buildKeywordMatchReason(effectItem, '', false) !== '') throw new Error('blank keyword produced a reason');
if (!source.includes('keywordReason:buildKeywordMatchReason(item,effectiveKeyword,nameOnlySearch)')) throw new Error('normal search rows do not retain keyword reasons');

console.log('PASS 3.2.0.0 keyword match reason: name, matching sentence, escaping, crop and blank query');
