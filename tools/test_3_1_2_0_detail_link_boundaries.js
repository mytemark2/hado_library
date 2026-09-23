'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const readItems = file => {
  const parsed = JSON.parse(read(file));
  return Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : []);
};

const core = read('hado_core.js');
const search = read('hado_search.js');
const statusEffects = read('hado_status_effects.js');

const expectedOrder = "['generals','tactics','skills','equipments','statusEffects','siegeWeapons','ethnicArmaments','formations','warhorses','warhorseSkills','troopSkills']";
assert(core.includes(`SEARCH_CATEGORY_DISPLAY_ORDER=Object.freeze(${expectedOrder})`), '兵科 must be the final visible search category');
assert(search.includes("['warhorseSkills','軍馬技能',state.warhorseSkills],['troopSkills','兵科',state.troopSkills]"), '兵科 result order must follow 軍馬技能');
assert(search.includes("['warhorseSkills','軍馬技能'],['troopSkills','兵科']"), '兵科 category button must follow 軍馬技能');

assert(core.includes('class="detail-structure-label no-detail-linkify"'), 'key/value labels must opt out of automatic entity links');
assert(core.includes('class="merge-cell no-detail-linkify"'), 'merged section headings must opt out of automatic entity links');
assert(statusEffects.includes("SUPPRESSED_GENERIC_DETAIL_LINK_NAMES=new Set(['基本'])"), 'generic formation name 基本 must be suppressed');
assert(statusEffects.includes('SUPPRESSED_GENERIC_DETAIL_LINK_NAMES.has(n)'), 'generic-name suppression must participate in alias filtering');

const structuralTerms = new Set([
  '基本', '基本情報', 'カテゴリ', '名前', '説明', '兵科', '付与', '効果', '種類',
  'レベル', 'パラメータ', '追加効果', '追加効果説明', '異民族', '最大Lv', '改陣形',
  '元陣形', '能力影響', 'ステータス補正', '解放条件', '陣形', '陣形技能', '軍馬能力',
  '設定最大Lv', '効果最大Lv', '合算方式', '入手地域'
]);
const datasets = [
  ['generals', 'hadou_generals.json'],
  ['skills', 'hadou_skills.json'],
  ['equipments', 'hadou_equipments.json'],
  ['statusEffects', 'hadou_status_effects.json'],
  ['siegeWeapons', 'hadou_siege_weapons.json'],
  ['ethnicArmaments', 'hadou_ethnic_armaments.json'],
  ['formations', 'hadou_formations.json'],
  ['warhorses', 'hadou_warhorses.json'],
  ['warhorseSkills', 'hadou_warhorse_skills.json']
];
const collisions = datasets.flatMap(([category, file]) => readItems(file)
  .map(item => String(item?.name || item?.title || '').trim())
  .filter(name => structuralTerms.has(name))
  .map(name => ({category, name})));

assert.deepStrictEqual(collisions, [{category: 'formations', name: '基本'}], 'review every entity name that collides with a structural label');
console.log('3.1.2.0 category order and detail-link boundary tests passed');
