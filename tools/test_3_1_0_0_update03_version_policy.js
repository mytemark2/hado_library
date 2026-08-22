'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const versionSource = fs.readFileSync('hado_version.js', 'utf8');
const metaSource = fs.readFileSync('hado_update_meta.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const agents = fs.readFileSync('AGENTS.md', 'utf8');
const operationRules = fs.readFileSync('docs/HADO_GITHUB_OPERATION_RULES.md', 'utf8');
const previewWorkflow = fs.readFileSync('.github/workflows/notify-preview.yml', 'utf8');

function runVersion(formalRelease) {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { textContent: '' });
    return nodes.get(id);
  };
  const document = {
    title: '',
    readyState: 'complete',
    getElementById: id => node(id),
    querySelector: selector => selector === '#appTitlePanel h1' ? node('h1') : null,
    querySelectorAll: () => [],
    addEventListener() {}
  };
  const context = { console, document, fetch: async () => { throw new Error('offline'); } };
  context.window = context;
  vm.createContext(context);
  const source = versionSource.replace(/formalRelease:\s*(?:true|false)/, `formalRelease: ${formalRelease}`);
  vm.runInContext(source, context, { filename: 'hado_version.js' });
  vm.runInContext(metaSource, context, { filename: 'hado_update_meta.js' });
  return { context, nodes };
}

assert(versionSource.includes("releaseVersion: '3.1.0.0'"), 'release version must be 3.1.0.0');
assert(versionSource.includes("updateNo: '03'"), 'active development stage must be Update03');
assert(versionSource.includes('revision: 174'), 'preview revision must be r174');
assert(versionSource.includes('formalRelease: false'), 'Update03 must remain a development preview');

const preview = runVersion(false);
assert.strictEqual(preview.context.window.HADO_APP_DISPLAY_VERSION, '3.1.0.0 Update03 r174', 'preview must display release version, Update, and revision');
assert.strictEqual(preview.nodes.get('h1').textContent, '覇道ライブラリ 3.1.0.0 Update03 r174', 'preview heading must include the active Update');

const formal = runVersion(true);
assert.strictEqual(formal.context.window.HADO_APP_DISPLAY_VERSION, '3.1.0.0', 'formal release must display only the four-part version');
assert.strictEqual(formal.nodes.get('diagnosticAppVersion').textContent, '覇道ライブラリ｜3.1.0.0', 'formal diagnostics must hide revision and Update');

for (const asset of ['hado_styles.css', 'hado_version.js', 'hado_core.js', 'hado_search.js']) {
  assert(indexHtml.includes(`${asset}?v=03-r174`), `${asset} must use the active Update cache key`);
}
assert(agents.includes('`Update` is not a normal release suffix'), 'repository rules must define Update as a large-development planning identifier');
assert(operationRules.includes('通常のリリース接尾辞ではない'), 'Japanese GitHub rules must define Update scope');
assert(previewWorkflow.includes('print(f"{base} r{revision.group(1)}")'), 'preview marker must include revision and support an empty Update');

console.log('3.1.0.0 Update03 version policy regression ok');
