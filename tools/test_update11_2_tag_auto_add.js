'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const core = read('hado_core.js');
const status = read('hado_status_effects.js');
const bootstrap = read('hado_bootstrap.js');
const css = read('hado_styles.css');
const html = read('index.html');
const version = read('hado_version.js');

const revisionMatch = version.match(/revision:\s*(\d+)/);
assert(revisionMatch && Number(revisionMatch[1]) >= 162, 'revision must be r162 or later');
assert(/hado_status_effects\.js\?v=\d+(?:\.\d+)*-r\d+/.test(html), 'changed runtime must use a versioned cache key');
assert(/hado_bootstrap\.js\?v=\d+(?:\.\d+)*-r\d+/.test(html), 'bootstrap must use a versioned cache key');

for (const [name, source] of Object.entries({core, bootstrap, css, html})) {
  assert(!source.includes('addTagSearchBtn'), `${name} must not retain the removed add button contract`);
}
assert(!html.includes('id="addTagSearchBtn"'), 'tag add button must be removed from the DOM');
assert(!html.includes('<datalist id="tagSearchCandidates"'), 'tag candidates must not depend on the browser-native datalist UI');
assert(html.includes('aria-autocomplete="list"'), 'tag input must expose the custom listbox relationship');
assert(html.includes('class="tag-candidate-list"'), 'custom tag candidate list must exist in the DOM');
assert(css.includes('.tag-input-row{grid-template-columns:auto minmax(0,1fr) auto}'), 'tag input row must have three columns');

assert(core.includes('tagSearchComposing:false'), 'shared state must track tag IME composition');
assert(!status.includes('function commitTagSearchInput('), 'typed text must not have an automatic commit helper');
assert(!status.includes('function resolveAvailableTagInput('), 'exact display-name input must remain a candidate until explicit selection');
assert(status.includes('rebuildTagCandidateSearchIndex();'), 'candidate search metadata must be precomputed when the tag index is built');
assert(status.includes('getMatchingTagCandidates(q,16)'), 'candidate rendering must be bounded to a small custom list');
assert(status.includes("selectTagCandidate(tag,'candidate-tap')"), 'candidate taps must commit the canonical tag directly');
assert(status.includes("if(state.tagSearchComposing){hideTagCandidates();return;}"), 'candidate work must be skipped while IME composition is active');
assert(status.includes("debugLog('tagSearch:add-duplicate'"), 'duplicate additions must be diagnosed without re-adding');
assert(status.includes('if(state.selectedTags.includes(t))'), 'duplicate tags must be idempotent');
assert(bootstrap.includes("addEventListener('compositionstart'"), 'tag input must guard IME composition start');
assert(bootstrap.includes("addEventListener('compositionend'"), 'tag input must refresh candidates after IME composition ends');
assert(!bootstrap.includes('commitTagSearchInput('), 'input, change, composition end, and bare Enter must never auto-add a tag');
assert(status.includes("e.key==='Enter'&&state.tagCandidateActiveIndex>=0"), 'Enter must add only an explicitly active candidate');
assert(status.includes('e.isComposing||e.keyCode===229'), 'Enter during IME composition must not select a candidate');

console.log('update11.2 explicit tag selection regression ok');
