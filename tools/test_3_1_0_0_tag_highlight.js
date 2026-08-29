'use strict';

const assert = require('assert');
const fs = require('fs');
const api = require('../hado_tag_highlight.js');

assert.strictEqual(api.PALETTE_SIZE, 12);

const selected = ['レアリティ:LR', '兵科:騎兵', '技能:掃討'];
const initialSlots = api.assignSlots(selected);
assert.strictEqual(new Set(Object.values(initialSlots)).size, selected.length, 'simultaneously selected tags must use different colors');

const stableSlots = api.assignSlots(selected.slice(1), initialSlots);
assert.strictEqual(stableSlots['兵科:騎兵'], initialSlots['兵科:騎兵'], 'remaining tag color must stay stable after another tag is removed');
assert.strictEqual(stableSlots['技能:掃討'], initialSlots['技能:掃討'], 'remaining tag color must stay stable after another tag is removed');

const entries = api.buildEntries(
  selected,
  ['レアリティ:LR', '兵科:騎兵'],
  tag => tag.split(':').slice(1).join(':'),
  initialSlots
);
assert.deepStrictEqual(entries.map(entry => entry.tag), ['レアリティ:LR', '兵科:騎兵'], 'only tags actually owned by the result may be highlighted');

const html = api.highlightTextHtml('LR張飛は騎兵。<script>', entries);
assert(html.includes(`tag-color-${initialSlots['レアリティ:LR']}`));
assert(html.includes(`data-selected-tag="レアリティ:LR">LR</mark>`));
assert(html.includes(`tag-color-${initialSlots['兵科:騎兵']}`));
assert(html.includes(`data-selected-tag="兵科:騎兵">騎兵</mark>`));
assert(html.includes('&lt;script&gt;'), 'unmatched result text must remain HTML-escaped');
assert(!html.includes('技能:掃討'), 'a selected tag not owned by the result must not appear');

const status = fs.readFileSync('hado_status_effects.js', 'utf8');
const search = fs.readFileSync('hado_search.js', 'utf8');
const formation = fs.readFileSync('hado_formation.js', 'utf8');
const css = fs.readFileSync('hado_styles.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

assert(status.includes('renderMatchedSelectedTagsHtml(row.item)') || search.includes('renderMatchedSelectedTagsHtml(row.item)'));
assert(status.includes("span.className=`selected-tag-badge tag-highlight-token ${getTagColorClass(tag)}`"));
assert(status.includes('is-selected tag-highlight-token'));
assert(search.includes('renderSelectedTagConditionChipsHtml()'));
assert(search.includes('highlightSelectedTagTextHtml(displayName,row.item)'));
assert(search.includes('search-result-tag-matches'));
assert(formation.includes('highlightSelectedTagTextNodes(els.detail,item)'));
assert(formation.includes('matchedTags=renderMatchedSelectedTagsHtml(row.item)'));
assert(index.indexOf('hado_tag_highlight.js') < index.indexOf('hado_status_effects.js'), 'tag highlight helper must load before its consumers');
for (let slot = 0; slot < api.PALETTE_SIZE; slot += 1) assert(css.includes(`.tag-color-${slot}{`), `CSS palette slot ${slot} is required`);
assert(css.includes('.tag-text-highlight'));
assert(css.includes('.search-result-matched-tag'));

console.log('tag highlight ok: stable 12-color mapping / owned-tag filtering / safe multi-color text highlighting / desktop-mobile-detail integration');
