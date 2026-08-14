'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const core = read('hado_core.js');
const search = read('hado_search.js');
const status = read('hado_status_effects.js');
const css = read('hado_styles.css');
const html = read('index.html');
const version = read('hado_version.js');
const tagIndex = JSON.parse(read('hadou_tag_index.json'));

assert(version.includes("releaseVersion: '3.1.0.0'"), '3.1 development must retain Update11 behavior');
const updateMatch = version.match(/updateNo:\s*'(\d+)(?:\.(\d+))?'/);
const updateNoIsEmpty = version.includes("updateNo: ''");
const revisionMatch = version.match(/revision:\s*(\d+)/);
assert(updateNoIsEmpty || (updateMatch && Number(updateMatch[1]) >= 1), 'runtime must use a valid active Update number or an empty completed-plan value');
assert(revisionMatch && Number(revisionMatch[1]) >= 160, 'revision must be r160 or later');
assert(core.includes("version:\"3.1.0.0\""), 'runtime build version must match 3.1.0.0');
assert(core.includes("fileName:\"hado_library_3.1.0.0.html\""), 'runtime file metadata must match 3.1.0.0');

const expectedCategoryOrder = "['generals','tactics','skills','equipments','statusEffects','siegeWeapons','ethnicArmaments','formations','warhorses','warhorseSkills']";
assert(core.includes(`SEARCH_CATEGORY_DISPLAY_ORDER=Object.freeze(${expectedCategoryOrder})`), 'tag order must share the visible search category order');
assert(core.includes('availableTagCategoriesByKey:{}') && core.includes('availableTagGroupOrder:[]'), 'tag category metadata must be stored in shared state');
assert(status.includes('byKeyCategories[key].add(cat)'), 'derived tag index must collect each tag group target category');
assert(status.includes("status_effects:'statusEffects'"), 'derived status_effect category must normalize to the visible runtime category');
assert(status.includes('getTagGroupCategoryLabel(key)'), 'tag UI must render category labels');
assert(status.includes("category.className='tag-picker-category'"), 'tag picker must expose a visible category badge');
assert(status.includes("const keys=Object.keys(state.availableTagsByKey||{}).sort(compareTagGroupKeys)"), 'tag groups must use category-aware ordering');

const categoriesByTagGroup = new Map();
for (const item of tagIndex.items || []) {
  for (const tag of item.tags || []) {
    const key = String(tag).split(':')[0];
    if (!categoriesByTagGroup.has(key)) categoriesByTagGroup.set(key, new Set());
    categoriesByTagGroup.get(key).add(item.category);
  }
}
assert(categoriesByTagGroup.get('レアリティ')?.has('generals'), 'rarity group must identify generals');
assert(categoriesByTagGroup.get('レアリティ')?.has('tactics'), 'rarity group must identify tactics');
assert(categoriesByTagGroup.get('レアリティ')?.has('equipments'), 'rarity group must identify equipments');
assert(categoriesByTagGroup.get('状態変化分類')?.has('status_effects'), 'status-effect classification must identify the status-effect category');

assert(!search.includes("state.selectedTags=mode==='status'?[]"), 'status mode must not erase selected tags');
assert(search.includes('context.selectedTags=[...(state.selectedTags||[])]'), 'each search mode must preserve its own tags');
assert(search.includes("const target=(mode==='status'&&statusBar)?statusBar:queryRow"), 'status mode must move the complete tag combobox into its status row');
assert(search.includes('tagWrap.hidden=false') && !search.includes('tagWrap.hidden=true'), 'status mode must keep the complete tag combobox visible');
assert(search.includes("if(!matchesSelectedTags(item))return;"), 'synchronous status owner search must apply tags');
assert(search.includes("if(!matchesSelectedTags(item))continue;"), 'asynchronous status owner search must apply tags');
assert(search.includes("const tagKey=[...(state.selectedTags||[])]"), 'status owner cache key must include selected tags');
assert(search.includes('getTagGroupCategoryLabel(key)'), 'status condition chips must identify the tag category');
assert(status.includes("runQuickStatusEffectOwnerSearchAsync(state.quickStatusEffectOwnerFilter,{reason:'tag-filter-change'})"), 'tag changes must restart active status-effect searches');

assert(css.includes('.search-preset-row.has-tag-filter'), 'status/tag one-line layout CSS is required');
assert(css.includes('grid-template-columns:minmax(140px,.85fr) minmax(180px,1.25fr) 32px minmax(320px,1.35fr)!important'), 'desktop status/tag row must reserve a full tag-combobox column');
assert(css.includes('.tag-picker-category'), 'tag category badge CSS is required');
assert(/hado_search\.js\?v=\d+(?:\.\d+)*-r\d+/.test(html) && /hado_styles\.css\?v=\d+(?:\.\d+)*-r\d+/.test(html), 'runtime assets must use a versioned cache generation');
assert(!html.includes('10.4-r159'), 'old Update10.4 cache keys must not remain');

console.log('update11 tag organization regression ok');
