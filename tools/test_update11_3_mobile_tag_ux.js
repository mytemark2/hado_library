'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const status = read('hado_status_effects.js');
const css = read('hado_styles.css');
const html = read('index.html');
const version = read('hado_version.js');

assert(version.includes("updateNo: '11.3'"), 'visible update must be Update11.3');
assert(version.includes('revision: 163'), 'revision must be r163');
assert(html.includes('hado_status_effects.js?v=11.3-r163-mobile-tag-ux'), 'tag runtime must use the Update11.3 cache key');
assert(html.includes('hado_styles.css?v=11.3-r163'), 'CSS must use the Update11.3 cache key');

assert(status.includes("function scheduleSearchAfterTagChange(reason='')"), 'tag search must have a deferred refresh scheduler');
assert(status.includes("els.resultMeta.textContent='タグを反映しました。検索中…'"), 'tag selection must expose immediate feedback');
assert(status.includes("requestAnimationFrame(()=>setTimeout(run,0))"), 'search must start after a browser paint opportunity');
assert(status.includes('seq!==state._tagSearchRefreshSeq'), 'rapid tag changes must cancel stale scheduled searches');

for (const signature of [
  "renderTagSearchControls();scheduleSearchAfterTagChange(reason||'tag-search')",
  "renderTagSearchControls();scheduleSearchAfterTagChange(reason||'tag-remove')",
  "renderTagSearchControls();scheduleSearchAfterTagChange(reason||'tag-clear')",
]) {
  assert(status.includes(signature), `tag UI must render before scheduling search: ${signature}`);
}

assert(/@media \(max-width:520px\)[\s\S]*?#searchPanel #searchInput,[\s\S]*?#searchPanel #tagSearchInput\{[\s\S]*?font-size:16px!important/.test(css), 'mobile text inputs must use at least 16px to prevent iOS focus zoom');
assert(css.includes('@media (max-width:429px)'), 'narrow smartphone layout breakpoint must exist');
assert(css.includes('grid-template-columns:minmax(0,.86fr) minmax(0,1.14fr)!important'), 'narrow status search must reflow to two columns');
assert(css.includes('#searchPanel .search-preset-row.has-tag-filter #tagPickerToggleBtn{'), 'narrow tag button override must beat the earlier ID-specific width rule');
assert(css.includes('#searchPanel .search-preset-row.has-tag-filter .tag-picker-panel{grid-column:1/-1!important;grid-row:3!important}'), 'tag picker panel must span the full narrow status row');
assert(css.includes('flex-wrap:wrap!important') && css.includes('overflow:visible!important'), 'selected tags must wrap without clipping on mobile');
assert(!html.includes('maximum-scale=1') && !html.includes('user-scalable=no'), 'viewport zoom must remain available');

console.log('update11.3 mobile tag UX regression ok');
