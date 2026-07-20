const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const bootstrap = fs.readFileSync(path.join(root, 'hado_bootstrap.js'), 'utf8');
const startMarker = '// HADO-3.0.0.0-IME-SEARCH-COMMIT-START';
const endMarker = '// HADO-3.0.0.0-IME-SEARCH-COMMIT-END';
const start = bootstrap.indexOf(startMarker);
const end = bootstrap.indexOf(endMarker);
assert(start >= 0 && end > start, 'IME search guard marker block must exist');

const listeners = new Map();
const input = {
  value: '',
  addEventListener(type, handler, capture) {
    listeners.set(type, { handler, capture });
  }
};
const calls = { cancel: 0, clear: 0, schedules: [], logs: [] };
const context = {
  state: {},
  els: { searchInput: input },
  cancelScheduledSearchRender() { calls.cancel += 1; },
  clearQuickStatusEffectOwnerFilter() { calls.clear += 1; },
  scheduleSearchAndDetailRender(reason) { calls.schedules.push(reason); },
  debugLog(name, detail) { calls.logs.push({ name, detail }); },
  norm(value) { return String(value ?? '').trim(); }
};
vm.createContext(context);
vm.runInContext(bootstrap.slice(start + startMarker.length, end), context);

for (const type of ['compositionstart', 'compositionend', 'input', 'keydown']) {
  assert(listeners.has(type), `${type} guard listener must be installed`);
  assert.strictEqual(listeners.get(type).capture, true, `${type} guard must run before legacy listeners`);
}

function dispatch(type, init = {}) {
  const event = {
    key: '',
    keyCode: 0,
    isComposing: false,
    stopped: false,
    stopImmediatePropagation() { this.stopped = true; },
    ...init
  };
  listeners.get(type).handler(event);
  return event;
}

input.value = 'か';
assert.strictEqual(dispatch('input').stopped, false, 'ordinary input must continue to the normal debounce listener');

const compositionStart = dispatch('compositionstart');
assert.strictEqual(compositionStart.stopped, true, 'compositionstart must replace the legacy listener');
assert.strictEqual(calls.cancel, 1, 'compositionstart must cancel a pending pre-composition search');
assert.strictEqual(context.state._searchComposing, true);

input.value = 'かん';
assert.strictEqual(dispatch('input', { isComposing: true }).stopped, true, 'input during composition must not search');
const imeEnter = dispatch('keydown', { key: 'Enter', keyCode: 229, isComposing: true });
assert.strictEqual(imeEnter.stopped, true, 'IME confirmation Enter must not be registered as search history');

input.value = '関羽';
const compositionEnd = dispatch('compositionend');
assert.strictEqual(compositionEnd.stopped, true, 'compositionend must replace the legacy listener');
assert.deepStrictEqual(calls.schedules, ['search-input-compositionend'], 'committed text must schedule exactly one search');
assert.strictEqual(calls.clear, 1, 'committed text must clear the temporary owner filter');
assert.strictEqual(context.state._searchComposing, false);

const duplicateInput = dispatch('input');
assert.strictEqual(duplicateInput.stopped, true, 'the browser follow-up input for the same commit must be consumed');
assert.deepStrictEqual(calls.schedules, ['search-input-compositionend'], 'follow-up input must not schedule a second search');

input.value = '関羽a';
assert.strictEqual(dispatch('input').stopped, false, 'the next real input must return to the normal debounce path');
assert.strictEqual(dispatch('keydown', { key: 'Enter' }).stopped, false, 'ordinary Enter must retain search-history behavior');
assert.strictEqual(dispatch('keydown', { key: 'Enter', keyCode: 229 }).stopped, true, 'legacy keyCode 229 must also be treated as IME input');

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(/hado_bootstrap\.js\?v=[^"']+/.test(indexHtml), 'IME runtime bootstrap must keep a cache-busting query');
const versionSource = fs.readFileSync(path.join(root, 'hado_version.js'), 'utf8');
const updateNo = versionSource.match(/updateNo:\s*'([^']+)'/)?.[1];
const revision = versionSource.match(/revision:\s*(\d+)/)?.[1];
assert(updateNo && revision, 'current version metadata must be readable');
assert(indexHtml.includes(`hado_version.js?v=${updateNo}-r${revision}`), 'version asset cache key must follow the current visible version');

console.log('Update09.5.54 IME search commit regression test passed');
