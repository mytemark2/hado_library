const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'hado_bootstrap.js'), 'utf8');

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert(start >= 0, `${name} must exist`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} function body is incomplete`);
}

const requiredTextBlock = source.match(/requiredTexts:\s*\[([\s\S]*?)\],\s*requiredElementTexts:/);
assert(requiredTextBlock, 'required text and state-aware element text contracts must exist');
assert(!requiredTextBlock[1].includes("'検証実行'"), 'transient validation button label must not be checked as a page-wide static text');
assert(!requiredTextBlock[1].includes("'型プリセット'"), 'ARIA-only type preset label must not be checked through page textContent');
assert(!requiredTextBlock[1].includes("'新規作成'"), 'lazy formation label must not be required before the formation panel is rendered');
assert(source.includes("{name:'runValidationBtn',allowedTexts:['検証実行','検証中…']}"), 'validation button must accept only its idle and running labels');
assert(source.includes("'typeSearchPresetSelect'"), 'type preset feature must remain covered by required element validation');
assert(source.includes("'createNewFormation'"), 'formation creation must remain covered by required function validation');

let currentElement = { textContent: '検証実行' };
const context = {
  getElementByNameForRegression: name => (name === 'runValidationBtn' ? currentElement : null),
  norm: value => String(value || '').trim()
};
vm.runInNewContext(`${extractFunction('getRegressionElementTextResult')};this.check=getRegressionElementTextResult;`, context);

const spec = { name: 'runValidationBtn', allowedTexts: ['検証実行', '検証中…'] };
assert.strictEqual(context.check(spec).ok, true, 'idle validation button label must pass');
currentElement.textContent = '検証中…';
assert.strictEqual(context.check(spec).ok, true, 'running validation button label must pass');
currentElement.textContent = '不明な状態';
const invalid = context.check(spec);
assert.strictEqual(invalid.ok, false, 'unknown validation button label must still fail');
assert.strictEqual(invalid.actual, '不明な状態');
currentElement = null;
assert.strictEqual(context.check(spec).ok, false, 'missing validation button must fail');

const regressionBody = extractFunction('runRegressionSelfCheck');
assert(regressionBody.includes('elementTextResults'), 'regression self-check must evaluate state-aware element labels');
assert(regressionBody.includes('result.elementTexts.ok'), 'state-aware element label failures must fail the overall result');

vm.runInNewContext(`${extractFunction('isValidSourceRevisionString')};this.isValidSourceRevisionString=isValidSourceRevisionString;`, context);
assert.strictEqual(context.isValidSourceRevisionString('1a5ce523053661c3b8d6a8fc5a295ef620196fe6'), true, '40-character Git commit SHA must pass');
assert.strictEqual(context.isValidSourceRevisionString('f'.repeat(64)), true, '64-character SHA-256 must pass');
assert.strictEqual(context.isValidSourceRevisionString('f'.repeat(39)), false, 'truncated source revision must fail');
assert.strictEqual(context.isValidSourceRevisionString('not-a-revision'), false, 'non-hex source revision must fail');
assert(source.includes("ok:isValidSourceRevisionString(HADO_BUILD_INFO.baseSha256)"), 'version validation must use the source revision compatibility contract');

console.log('3.1.0.0 manual validation button state regression: passed');

// Exercise the actual runtime metadata rather than a synthetic revision string alone.
const versionSource = fs.readFileSync(path.join(root, 'hado_version.js'), 'utf8');
const coreSource = fs.readFileSync(path.join(root, 'hado_core.js'), 'utf8');
const runtime = { window: {} };
vm.runInNewContext(versionSource, runtime);
const buildDeclaration = coreSource.match(/const HADO_BUILD_INFO=([^;]+);/)[0];
vm.runInNewContext(`${buildDeclaration};this.build=HADO_BUILD_INFO;`, runtime);
assert(context.isValidSourceRevisionString(runtime.build.baseSha256), 'actual build metadata must retain its source revision');
assert.strictEqual(runtime.build.baseSha256, runtime.window.HADO_VERSION.baseSourceRevision);

// Troop-skill details cannot be added as a general: no add-to-formation label is expected.
const specSource = source.slice(source.indexOf('const REGRESSION_SELF_CHECK_SPEC='), source.indexOf('function getFunctionByNameForRegression'));
const page = { textContent: '' };
const regressionContext = {
  HADO_BUILD_INFO: runtime.build,
  document: { documentElement: page },
  state: { diagnostics: {} },
  debugTimestamp: () => 'fixture', debugStartup: () => {}, console: { warn: () => {} },
  getFunctionByNameForRegression: () => () => {},
  getElementByNameForRegression: () => ({ textContent: '検証中…' }),
  getRegressionElementTextResult: () => ({ ok: true })
};
vm.runInNewContext(`${specSource};this.spec=REGRESSION_SELF_CHECK_SPEC;${regressionBody};this.run=runRegressionSelfCheck;`, regressionContext);
assert(!regressionContext.spec.requiredTexts.includes('部隊編成に追加'));
assert(!regressionContext.spec.requiredTexts.includes('追加'));
assert(regressionContext.spec.requiredFunctions.includes('renderFormationAddButton'));
assert(regressionContext.spec.requiredFunctions.includes('applyFormationQuickAdd'));
page.textContent = regressionContext.spec.requiredTexts.join(' / ');
assert.strictEqual(regressionContext.run('troop-detail').ok, true);
regressionContext.getFunctionByNameForRegression = name => name === 'applyFormationQuickAdd' ? undefined : () => {};
assert.strictEqual(regressionContext.run('broken-add-function').ok, false, 'real feature removal must still fail');
console.log('actual build provenance and troop-detail regression contracts: passed');

const warningContext = { HADO_BUILD_INFO: runtime.build, debugTimestamp: () => 'fixture' };
vm.runInNewContext(`${extractFunction('buildValidationDialogMessage')};this.message=buildValidationDialogMessage;`, warningContext);
const warningResult = warningContext.message({ok:true,context:'fixture',warnings:[{name:'horizontal overflow',amount:17},{name:'hadou extension dataset check skipped',reason:'fixture reason'}],criticalFailures:[]});
assert(warningResult.includes('horizontal overflow / 17px'));
assert(warningResult.includes('hadou extension dataset check skipped / fixture reason'));
assert(warningResult.includes('warnings: 2'));
const longWarningResult=warningContext.message({ok:true,warnings:Array.from({length:20},()=>({name:'n'.repeat(2000),reason:'r'.repeat(2000)})),criticalFailures:[]});
assert(longWarningResult.length<6000,'warning summary must stay bounded');
assert(longWarningResult.includes('8件省略'));
console.log('bounded diagnostic warning details: passed');
