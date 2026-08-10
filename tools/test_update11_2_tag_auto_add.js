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

const updateMatch = version.match(/updateNo:\s*'(\d+)\.(\d+)'/);
const updateNoIsEmpty = version.includes("updateNo: ''");
const revisionMatch = version.match(/revision:\s*(\d+)/);
assert(updateNoIsEmpty || (updateMatch && (Number(updateMatch[1]) > 11 || (Number(updateMatch[1]) === 11 && Number(updateMatch[2]) >= 2))), 'runtime must retain Update11.2 behavior after the Update plan ends');
assert(revisionMatch && Number(revisionMatch[1]) >= 162, 'revision must be r162 or later');
assert(/hado_status_effects\.js\?v=\d+(?:\.\d+)*-r\d+/.test(html), 'changed runtime must use a versioned cache key');
assert(/hado_bootstrap\.js\?v=\d+(?:\.\d+)*-r\d+/.test(html), 'bootstrap must use a versioned cache key');

for (const [name, source] of Object.entries({core, bootstrap, css, html})) {
  assert(!source.includes('addTagSearchBtn'), `${name} must not retain the removed add button contract`);
}
assert(!html.includes('id="addTagSearchBtn"'), 'tag add button must be removed from the DOM');
assert(css.includes('.tag-input-row{grid-template-columns:auto minmax(0,1fr) auto}'), 'tag input row must have three columns');

assert(core.includes('tagSearchComposing:false'), 'shared state must track tag IME composition');
assert(status.includes("function commitTagSearchInput(reason='input-exact')"), 'exact-tag commit helper must exist');
assert(status.includes('state.availableTags.includes(value)'), 'only valid candidate tags may be committed');
assert(status.includes("debugLog('tagSearch:add-duplicate'"), 'duplicate additions must be diagnosed without re-adding');
assert(status.includes('if(state.selectedTags.includes(t))'), 'duplicate tags must be idempotent');
assert(bootstrap.includes("addEventListener('compositionstart'"), 'tag input must guard IME composition start');
assert(bootstrap.includes("addEventListener('compositionend'"), 'tag input must commit after IME composition ends');
assert(bootstrap.includes('e.isComposing||e.keyCode===229'), 'Enter during IME composition must not commit');
assert(bootstrap.includes("commitTagSearchInput('input-exact')"), 'exact typed values and datalist selections must auto-add');
assert(bootstrap.includes("commitTagSearchInput('input-enter')"), 'Enter must use the same valid-tag commit path');
assert(!bootstrap.includes("commitTagSearchInput('input-button')"), 'removed button path must not remain');

console.log('update11.2 tag auto-add regression ok');
