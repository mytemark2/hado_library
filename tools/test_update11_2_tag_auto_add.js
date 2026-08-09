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

assert(version.includes("updateNo: '11.3'"), 'visible update must be Update11.3');
assert(version.includes('revision: 163'), 'revision must be r163');
assert(html.includes('hado_status_effects.js?v=11.3-r163-mobile-tag-ux'), 'changed runtime must use the Update11.3 cache key');
assert(html.includes('hado_bootstrap.js?v=11.3-r163'), 'bootstrap must use the Update11.3 cache key');

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
