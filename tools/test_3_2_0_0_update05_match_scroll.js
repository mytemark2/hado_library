const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'hado_status_effects.js'), 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `missing function ${name}`);
  const signatureStart = source.indexOf('(', start);
  let signatureDepth = 0;
  let bodyStart = -1;
  for (let i = signatureStart; i < source.length; i += 1) {
    if (source[i] === '(') signatureDepth += 1;
    if (source[i] === ')') {
      signatureDepth -= 1;
      if (signatureDepth === 0) {
        bodyStart = source.indexOf('{', i + 1);
        break;
      }
    }
  }
  assert(bodyStart >= 0, `missing body for ${name}`);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated function ${name}`);
}

const calls = [];
const exactHit = {
  textContent: '奮檄',
  parentElement: null,
  classList: { add: (name) => calls.push(['class', name]) },
  matches: () => false,
  closest: () => panel,
  scrollIntoView: (options) => calls.push(['scroll', options]),
};
const partialHit = { textContent: '技能 奮檄', parentElement: null };
const panel = {
  dataset: { activeTab: 'skill' },
  querySelectorAll: (selector) => selector === 'mark.search-hit' ? [partialHit, exactHit] : [],
};
const detail = {
  querySelectorAll: (selector) => selector === '.detail-tab-content[data-active-tab]' ? [panel] : [],
};
const context = {
  console,
  els: { detail },
  norm: (value) => String(value || '').replace(/\s+/g, ' ').trim(),
  debugLog: (...args) => calls.push(['debug', ...args]),
  window: { matchMedia: () => ({ matches: false }) },
  requestAnimationFrame: (callback) => callback(),
  setTimeout: (callback) => callback(),
};
vm.createContext(context);
for (const name of ['getDetailMatchScrollTarget', 'scrollDetailMatchTargetIntoView', 'scheduleDetailMatchTargetScroll']) {
  vm.runInContext(`${extractFunction(name)}; this.${name} = ${name};`, context);
}

assert.strictEqual(context.getDetailMatchScrollTarget(detail, 'skill', '奮檄'), exactHit, 'exact highlighted keyword must be the scroll target');
assert.strictEqual(context.scrollDetailMatchTargetIntoView('skill', '奮檄', { behavior: 'auto' }), true, 'match scroll must succeed');
const directScroll = calls.find((entry) => entry[0] === 'scroll');
assert(directScroll, 'scrollIntoView must be called');
assert.strictEqual(directScroll[1].block, 'center', 'matched text must be centered vertically');
assert.strictEqual(directScroll[1].inline, 'nearest', 'matched text must avoid unnecessary horizontal scrolling');
assert(calls.some((entry) => entry[0] === 'class' && entry[1] === 'detail-match-scroll-focus'), 'matched text must receive visible focus feedback');

calls.length = 0;
context.scheduleDetailMatchTargetScroll('skill', '奮檄');
assert(calls.some((entry) => entry[0] === 'scroll'), 'scheduled post-render scroll must reach the highlighted text');
assert(/renderDetail\(\);\s*scheduleDetailMatchTargetScroll\(tab,keyword\);/.test(source), 'match button must schedule scrolling after detail rerender');

console.log('3.2.0.0 Update05 match scroll regression passed.');
