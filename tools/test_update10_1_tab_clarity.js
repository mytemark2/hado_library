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

assert(index.indexOf('hado_tabs.js?v=10.1-r156') < index.indexOf('hado_core.js?v=10.1-r156'), 'shared tab runtime must load before consumers');
assert(index.includes('role="tablist"') && index.includes('data-tab-status-id="searchModeCurrent"'), 'primary/search tab semantics missing');
assert(index.includes('aria-controls="normalSearchInputRow"') && index.includes('aria-controls="searchPresetBar"') && index.includes('aria-controls="typeSearchPanel"'), 'search tabs must identify their primary controlled content');
assert(core.includes('window.HADO_TABS.sync(mainTabList,activeMainTab)') && core.includes('role="tabpanel"'), 'main/detail tabs must use shared state and panels');
assert(search.includes("statusId:'searchModeCurrent'"), 'search mode must expose the active context');
assert(formation.includes('window.HADO_TABS.sync') && formation.includes('formation-work-panel-'), 'formation tabs must use shared state and panel relationships');
assert(candidates.includes('htc-workspace-panel') && candidates.includes('htc-tab-count'), 'candidate workspace must expose role context and counts');
assert(typeEntry.includes('hte-mode-panel') && typeEntry.includes('window.HADO_TABS?.sync'), 'type navigator must share tab semantics');
assert(styles.includes('#mainTabPanel .main-tab-btn[aria-selected="true"]') && styles.includes('#htc-modal .htc-tab[aria-selected="true"]'), 'strong selected styles missing');
assert(styles.includes('@media(prefers-reduced-motion:reduce)'), 'motion preference fallback missing');

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
