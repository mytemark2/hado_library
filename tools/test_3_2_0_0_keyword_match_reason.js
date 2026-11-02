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
  Map,
  Set,
  Math,
  String,
  norm: value => String(value ?? '').replace(/\s+/g, ' ').trim(),
  getItemDisplayName: item => String(item?.name || item?.title || ''),
  detailCategory: item => String(item?.category || ''),
  getDefaultDetailTabForCategory: category => category === 'generals' ? 'related' : (category === 'skills' ? 'skillDetail' : 'parameter'),
  isGeneralSkillSection: (_item, section) => String(section?.title || '').includes('技能'),
  findTacticName: item => String(item?._tacticName || ''),
  getOwnedSkillLevelMapFromTables: item => new Map((item?._ownedSkillNames || []).map(name => [name, 'Ⅰ'])),
  sanitizeSectionForSearch: (_item, section) => section,
  isSearchExcludedTable: () => false,
  sanitizeRawForSearch: (_item, raw) => raw,
  getFastSearchableText: item => String(item?._searchableText || '').toLowerCase(),
};
vm.createContext(context);
for (const name of ['splitKeywordReasonSentences', 'cropKeywordReasonSentence', 'classifyKeywordReasonDetailTab', 'classifyKeywordReasonTableTab', 'collectKeywordReasonEntries', 'collectKeywordReasonValues', 'buildKeywordMatchDetail', 'buildKeywordMatchReason']) {
  vm.runInContext(`${extractFunction(name)}; this.${name} = ${name};`, context);
}

const nameReason = context.buildKeywordMatchReason({ name: 'LR李典' }, '李典', true);
if (nameReason !== '一致理由：名称「LR李典」に「李典」が一致。') throw new Error(`unexpected name reason: ${nameReason}`);

const effectItem = {
  category: 'skills',
  name: 'テスト技能',
  sections: [{ title: '効果', content: ['自身の攻撃を上昇する。', '交戦開始時に味方3部隊へ結束を付与する。', '防御も上昇する。'] }],
  tables: [],
  raw: {},
};
const effectReason = context.buildKeywordMatchReason(effectItem, '結束', false);
if (effectReason !== '一致理由：交戦開始時に味方3部隊へ結束を付与する。') throw new Error(`unexpected effect reason: ${effectReason}`);
if (effectReason.includes('防御も上昇')) throw new Error('reason included a sentence after the matching sentence');
const effectDetail = context.buildKeywordMatchDetail(effectItem, '結束', false);
if (effectDetail.tab !== 'skillDetail') throw new Error(`skill match did not select content detail: ${effectDetail.tab}`);

const generalItem = {
  category: 'generals',
  name: 'LR検証武将',
  sections: [
    { title: 'LR検証武将の戦法', content: ['敵3部隊に火属性攻撃を行う。'] },
    { title: 'LR検証武将の技能', content: ['技能「検証」を所持する。'] }
  ],
  tables: [],
  raw: {}
};
if (context.buildKeywordMatchDetail(generalItem, '火属性', false).tab !== 'tactic') throw new Error('tactic keyword did not select the tactic tab');
if (context.buildKeywordMatchDetail(generalItem, '検証」を所持', false).tab !== 'skill') throw new Error('skill keyword did not select the skill tab');

const namedSectionItem = {
  category: 'generals',
  name: 'LR固有名武将',
  _tacticName: '強盛莫敵',
  _ownedSkillNames: ['轟名'],
  sections: [
    { title: '強盛莫敵', content: ['敵4部隊を攻撃する'] },
    { title: '轟名', content: ['Ⅰ■主将の際 ●付与技能を得る'] }
  ],
  tables: [],
  raw: {}
};
if (context.buildKeywordMatchDetail(namedSectionItem, '強盛莫敵', false).tab !== 'tactic') throw new Error('named tactic section did not select the tactic tab');
if (context.buildKeywordMatchDetail(namedSectionItem, '轟名', false).tab !== 'skill') throw new Error('owned-skill named section did not select the skill tab');

const descriptionCollisionItem = {
  category: 'generals',
  name: 'LR一致優先武将',
  description: '技能名は轟名。',
  sections: [{ title: 'LR一致優先武将の技能', content: ['轟名1■主将の際 ●付与技能を得る'] }],
  tables: [{ rows: [['轟名1', '■主将の際 ●付与技能を得る']] }],
  raw: {}
};
if (context.buildKeywordMatchDetail(descriptionCollisionItem, '轟名', false).tab !== 'skill') throw new Error('search-only description incorrectly outranked the visible skill section');

const unsafeItem = { name: '安全確認', description: '<img src=x onerror=alert(1)>で工兵を強化する。', raw: {} };
const unsafeReason = context.buildKeywordMatchReason(unsafeItem, '工兵', false);
if (!unsafeReason.includes('工兵')) throw new Error('matching keyword missing from unsafe-text reason');
if (!source.includes('${esc(keywordReason)}')) throw new Error('keyword reason is not escaped before HTML rendering');

const longReason = context.buildKeywordMatchReason({ name: '長文', description: `${'前'.repeat(200)}結束${'後'.repeat(200)}`, raw: {} }, '結束', false);
if (longReason.length > 190 || !longReason.includes('結束') || !longReason.includes('…')) throw new Error(`long reason was not cropped safely: ${longReason.length}`);

if (context.buildKeywordMatchReason(effectItem, '', false) !== '') throw new Error('blank keyword produced a reason');
if (!source.includes('keywordReason:keywordMatch.text,keywordMatchTab:')) throw new Error('normal search rows do not retain keyword reason and target tab');
if (!source.includes("applyResultRowDetailSelection(rows[0],'search-auto-first'")) throw new Error('first search result does not apply the matching tab automatically');

console.log('PASS 3.2.0.0 keyword match reason: name, matching sentence, escaping, crop and blank query');
