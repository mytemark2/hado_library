'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const search = read('hado_search.js');
const status = read('hado_status_effects.js');
const styles = read('hado_styles.css');
const share = read('hado_share.js');
const bootstrap = read('hado_bootstrap.js');
const index = read('index.html');
const version = read('hado_version.js');

assert(version.includes("updateNo: '04'"));
assert(version.includes('revision: 217'));
assert(index.includes('hado_version.js?v=04-r217'));
assert(!index.includes('03-r216'));

assert(search.includes('function renderSearchConditionChip('));
assert(search.includes('function bindSearchConditionChipActions('));
for (const action of ['keyword', 'category', 'view', 'name-range', 'quick-status', 'search-mode', 'type-clear', 'type-status', 'type-feature', 'tag']) {
  assert(search.includes(`action==='${action}'`), `missing chip action: ${action}`);
}
assert(search.includes("keys.forEach(key=>chips.push(renderSearchConditionChip(`カテゴリ：${DATASET_LABELS[key]||key}`"), 'categories must be separate removable chips');
assert(status.includes('data-search-condition-action="tag"'), 'selected tags must be removable from the condition summary');
assert(status.includes('aria-label="${esc(label)}を解除"'), 'tag remove control must expose an accessible label');

const typeStart = search.indexOf('function renderTypeSearchResultList(');
const typeEnd = search.indexOf('function renderTypeSearchResults(', typeStart);
const typeRenderer = search.slice(typeStart, typeEnd);
assert(typeRenderer.indexOf('search-result-primary-reason') < typeRenderer.indexOf('search-result-tag-matches'));
assert(typeRenderer.indexOf('search-result-primary-reason') < typeRenderer.indexOf('search-result-secondary search-result-meta'));

const normalStart = search.indexOf("const keywordReason=norm(row.keywordReason||'')");
const normalEnd = search.indexOf('if(metricLabel)', normalStart);
const normalRenderer = search.slice(normalStart, normalEnd);
assert(normalRenderer.indexOf('search-result-primary-reason') >= 0);
assert(normalRenderer.indexOf('search-result-primary-reason') < normalRenderer.indexOf('search-result-tag-matches'));
assert(normalRenderer.indexOf('search-result-primary-reason') < normalRenderer.indexOf('search-result-secondary search-result-meta'));

for (let indexNo = 0; indexNo < 12; indexNo += 1) {
  assert(styles.includes(`.tag-color-${indexNo}{`), `missing stable tag color ${indexNo}`);
}
const palette = styles.slice(styles.indexOf('.tag-color-0{'), styles.indexOf('.tag-highlight-token{'));
for (const existingUiColor of ['#1d4ed8', '#0f766e', '#16a34a']) {
  assert(!palette.includes(existingUiColor), `tag palette reuses existing blue/green UI color: ${existingUiColor}`);
}
assert(styles.includes('.search-condition-chip-remove{'));
assert(styles.includes('.search-condition-chip-remove{width:32px;height:32px'));
assert(styles.includes('.search-condition-chips,.search-condition-chips.search-condition-chips-header{max-width:100%;overflow-x:hidden}'));
assert(styles.includes('.result-copy-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}'));

assert(index.includes('id="copyResultsBtn" type="button">検索結果をコピー</button>'));
assert(share.includes("button.textContent = '検索条件リンクをコピー'"));
assert(bootstrap.includes("'検索結果をコピー','検索条件リンクをコピー'"));

console.log('PASS 3.2.0.0 Update04 search conditions, reason-first cards, tag palette, copy labels, responsive guards');
