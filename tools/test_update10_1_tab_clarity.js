#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('index.html');
const core = read('hado_core.js');
const search = read('hado_search.js');
const formation = read('hado_formation.js');
const candidates = read('hado_type_candidates.js');
const typeEntry = read('hado_type_entry.js');
const styles = read('hado_styles.css');
const tabsSource = read('hado_tabs.js');
const bootstrap = read('hado_bootstrap.js');
const statusEffects = read('hado_status_effects.js');
const relatedLinks = JSON.parse(read('hadou_related_link_index.json'));
const versionSource = read('hado_version.js');
const updateNo = versionSource.match(/updateNo:\s*'([^']+)'/)?.[1];
const revision = versionSource.match(/revision:\s*(\d+)/)?.[1];
assert(updateNo && revision, 'visible version source must define updateNo and revision');
const assetVersion = `${updateNo}-r${revision}`;

assert(index.indexOf(`hado_tabs.js?v=${assetVersion}`) < index.indexOf(`hado_core.js?v=${assetVersion}`), 'shared tab runtime must load before consumers');
assert(index.includes('role="tablist"') && index.includes('data-tab-key="normal"'), 'primary/search tab semantics missing');
assert(index.includes('aria-controls="normalSearchInputRow"') && index.includes('aria-controls="searchPresetBar"') && index.includes('aria-controls="typeSearchPanel"'), 'search tabs must identify their primary controlled content');
assert(core.includes('window.HADO_TABS.sync(mainTabList,activeMainTab)') && core.includes('role="tabpanel"'), 'main/detail tabs must use shared state and panels');
assert(!index.includes('searchModeCurrent') && !search.includes("statusId:'searchModeCurrent'"), 'redundant search-mode current row must stay removed');
assert(formation.includes('window.HADO_TABS.sync') && formation.includes('formation-work-panel-'), 'formation tabs must use shared state and panel relationships');
assert(candidates.includes('htc-workspace-panel') && candidates.includes('htc-tab-count'), 'candidate workspace must expose role context and counts');
assert(typeEntry.includes('hte-mode-panel') && typeEntry.includes('window.HADO_TABS?.sync'), 'type navigator must share tab semantics');
assert(styles.includes('#mainTabPanel .main-tab-btn[aria-selected="true"]') && styles.includes('#htc-modal .htc-tab[aria-selected="true"]'), 'strong selected styles missing');
assert(!core.includes('hado-tab-context') && !typeEntry.includes('hado-tab-context') && !candidates.includes('htc-panel-heading'), 'redundant current-tab rows must stay removed');
assert(!styles.includes("content:'表示中'"), 'selected tabs must not add a redundant display-status badge');
assert(styles.includes('@media(prefers-reduced-motion:reduce)'), 'motion preference fallback missing');
assert(bootstrap.includes("window.HADO_APP_VERSION_META?.visibleVersion") && bootstrap.includes('getValidationStyleText()'), 'runtime validation must follow visible version metadata and external CSS');
assert(bootstrap.includes("const expectedSummaryIds=['troops','damageTaken','normalAttack','tacticOpening','tacticSpeed','tacticMaxPower']"), 'runtime validation must follow the six-item decision summary contract');
assert(bootstrap.includes("typeof renderFormationWarhorseSlotsHtml==='function'"), 'runtime validation must follow the current three-slot warhorse UI');
assert(bootstrap.includes('Lazy-rendered formation/detail labels are validated through their render functions'), 'runtime validation must not require inactive lazy-tab text');
assert(statusEffects.includes('...(Array.isArray(related.mechanics)?related.mechanics:[])'), 'trusted related-link rendering must include crawler mechanics');
const relatedItems = relatedLinks.items || relatedLinks;
const lrZhangFei = relatedItems.find(item => item.name === 'LR張飛（ちょうひ）');
const zhangFeiMechanics = (lrZhangFei?.related?.mechanics || []).map(item => item.displayName || item.name);
assert(zhangFeiMechanics.includes('畏怖回避[鋼胆]') && zhangFeiMechanics.includes('恐怖回避[鋼胆]'), 'LR張飛 countermeasure fixtures must remain in the crawler-owned mechanics bucket');

let keydownHandler = null;
const sandbox = {
  document: {
    addEventListener(type, handler) { if (type === 'keydown') keydownHandler = handler; },
    getElementById() { return null; }
  },
  window: {}
};
vm.createContext(sandbox);
vm.runInContext(tabsSource, sandbox, { filename: 'hado_tabs.js' });
assert(keydownHandler && sandbox.window.HADO_TABS, 'shared tab runtime did not initialize');

function makeList(activation = 'automatic', orientation = '') {
  const list = {
    dataset: { tabActivation: activation },
    getAttribute(name) { return name === 'aria-orientation' ? orientation : null; },
    querySelectorAll() { return tabs; }
  };
  const tabs = ['first', 'second', 'third'].map((id, i) => ({
    id,
    dataset: { tabKey: id },
    disabled: false,
    hidden: false,
    textContent: id,
    attrs: { 'aria-selected': i === 0 ? 'true' : 'false' },
    classList: { toggle() {} },
    closest(selector) { return selector === '[role="tablist"]' ? list : this; },
    querySelector() { return null; },
    matches(selector) { return selector === `#${id}`; },
    getAttribute(name) { return this.attrs[name] ?? null; },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    toggleAttribute(name, on) { if (on) this.attrs[name] = ''; else delete this.attrs[name]; },
    focus() { this.focused = true; },
    click() { this.clicks = (this.clicks || 0) + 1; }
  }));
  return { list, tabs };
}

const horizontal = makeList('automatic');
keydownHandler({ key: 'ArrowRight', target: horizontal.tabs[0], preventDefault() {} });
assert(horizontal.tabs[1].focused && horizontal.tabs[1].clicks === 1, 'automatic horizontal tabs must activate on ArrowRight');
keydownHandler({ key: 'ArrowDown', target: horizontal.tabs[1], preventDefault() { throw new Error('horizontal ArrowDown must remain available for scrolling'); } });
assert(!horizontal.tabs[2].focused, 'horizontal tabs must not capture ArrowDown');

const manual = makeList('manual');
keydownHandler({ key: 'End', target: manual.tabs[0], preventDefault() {} });
assert(manual.tabs[2].focused && !manual.tabs[2].clicks, 'manual tabs must move focus without activation');
keydownHandler({ key: 'Enter', target: manual.tabs[2], preventDefault() {} });
assert(manual.tabs[2].clicks === 1, 'manual tabs must activate with Enter');

const vertical = makeList('automatic', 'vertical');
keydownHandler({ key: 'ArrowDown', target: vertical.tabs[0], preventDefault() {} });
assert(vertical.tabs[1].focused && vertical.tabs[1].clicks === 1, 'vertical tabs must activate on ArrowDown');

console.log('Update10.1 tab clarity regression passed.');
