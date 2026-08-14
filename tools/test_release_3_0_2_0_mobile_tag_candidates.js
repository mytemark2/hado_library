'use strict';

const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const status = fs.readFileSync('hado_status_effects.js', 'utf8');
const css = fs.readFileSync('hado_styles.css', 'utf8');
const tagIndex = JSON.parse(fs.readFileSync('hadou_tag_index.json', 'utf8'));

const soutouTags = Object.keys(tagIndex.invertedTags || {}).filter(tag => {
  const value = String(tag).split(':').slice(1).join(':').trim();
  return value === '掃討';
});

assert.deepStrictEqual(soutouTags, ['技能:掃討'], '掃討 must remain a unique display-name alias for 技能:掃討');
assert(!html.includes('<datalist'), 'mobile tag selection must not use a browser-native datalist');
assert(html.includes('role="listbox"'), 'custom candidates must expose a listbox');
assert(html.includes('autocomplete="off"'), 'native autocomplete must not cover the custom candidate list');
assert(status.includes('getMatchingTagCandidates(input,limit=16)'), 'candidate lookup must cap rendered options at 16');
assert(status.includes("source:'precomputed'"), 'candidate lookup must use a precomputed searchable index');
assert(status.includes('row.searchText.includes(q)'), 'input-time filtering must reuse precomputed searchable text');
assert(status.includes('if(applyDerivedTagIndexToItems(all)){rebuildTagCandidateSearchIndex();'), 'derived tag-index loading must also build candidate search metadata');
assert(status.includes('state.tagCandidatePointerDown=true'), 'touch selection must retain the input/list relationship until click commits');
assert(status.includes('seq!==state.tagCandidateBlurSeq'), 'a stale mobile blur timer must not close a newly focused candidate list');
assert(status.includes("selectTagCandidate(tag,'candidate-tap')"), 'a candidate tap must select the canonical tag');
assert(status.includes("scheduleSearchAfterTagChange(reason||'tag-search')"), 'search must remain deferred until after selected-tag rendering');
assert(css.includes('touch-action:manipulation'), 'mobile candidate buttons must use tap-safe touch behavior');
assert(/@media \(max-width:520px\)[\s\S]*?#searchPanel #searchInput,[\s\S]*?#searchPanel #tagSearchInput\{[\s\S]*?font-size:16px!important/.test(css), 'mobile input focus must not trigger browser page zoom');
assert(css.includes('max-height:min(248px,38dvh)'), 'mobile candidates must remain inside the visible viewport');

console.log('3.0.2.0 mobile tag candidate regression ok');
