'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const core = read('hado_core.js');
const formation = read('hado_formation.js');
const search = read('hado_search.js');
const status = read('hado_status_effects.js');
const css = read('hado_styles.css');
const html = read('index.html');
const version = read('hado_version.js');

assert(version.includes("updateNo: '11.4'"), 'visible update must be Update11.4');
assert(version.includes('revision: 164'), 'revision must be r164');
assert(html.includes('hado_status_effects.js?v=11.4-r164-mobile-parity'), 'status runtime must use the Update11.4 cache key');
assert(html.includes('hado_formation.js?v=11.4-r164-mobile-parity'), 'formation runtime must use the Update11.4 cache key');
assert(html.includes('hado_styles.css?v=11.4-r164'), 'CSS must use the Update11.4 cache key');

assert(search.includes("const target=(mode==='status'&&statusBar)?statusBar:queryRow"), 'status search must move the complete tag combobox into the status row');
assert(search.includes('tagWrap.hidden=false'), 'tag combobox must stay visible in status search');
assert(!search.includes('tagWrap.hidden=true'), 'status search must not hide the tag combobox');
assert(css.includes('.search-preset-row.has-tag-filter #tagSearchWrap{'), 'status tag combobox needs an explicit grid cell');
assert(css.includes('grid-template-columns:auto minmax(0,1fr) auto!important'), 'status tag controls must retain button/input/clear layout');

assert(formation.includes('function renderMobileResultSummary'), 'mobile result details summary must be rendered');
assert(formation.includes('getResultCardBadgesHtml(row)'), 'mobile result summary must include the same major badges as PC cards');
assert(formation.includes('formatTypeSearchReasonsHtml(row.typeSearchMatches||[])'), 'mobile result summary must include type-search match reasons');
assert(css.includes('.mobile-result-summary{'), 'mobile result summary must have a responsive layout contract');

assert(formation.includes('<details class="formation-selected-skill-panel"'), 'selected formation skills must use a mobile disclosure');
assert(css.includes('.formation-selected-skill-panel{display:grid!important'), 'selected formation skills must not stay hidden on mobile');
assert(formation.includes('formation-selector-current-skill-note'), 'advisor dialog must show active advisor skill names');
assert(formation.includes('function getFormationWarhorseSlotNote'), 'formation warhorse slots must expose assignment and skill details');
assert(css.includes('body.formation-tab .formation-warhorse-slots-body{grid-template-columns:1fr!important}'), 'narrow formation warhorse details must use a non-overflowing single column');

assert(core.includes("const assignedCount=(Array.isArray(warhorseData.activeSlots)?warhorseData.activeSlots:[]).filter(Boolean).length"), 'warhorse render log must define assignedCount');
assert(core.includes("const search=state.mainTab==='search'"), 'responsive history visibility must be tied to the search tab');
assert(core.includes("display',search?'block':'none'"), 'mobile search history select must be hidden outside search');

assert(/@media\(max-width:980px\),\(pointer:coarse\)[\s\S]*?input\[type="text"\][\s\S]*?select,textarea\{font-size:16px!important\}/.test(css), 'focusable mobile form controls must use 16px to prevent browser focus zoom');
assert(!html.includes('maximum-scale=1') && !html.includes('user-scalable=no'), 'accessibility zoom must remain enabled');

console.log('update11.4 mobile parity regression ok');
