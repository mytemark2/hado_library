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
