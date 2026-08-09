'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const core = read('hado_core.js');
const styles = read('hado_styles.css');
const version = read('hado_version.js');

assert(/releaseVersion:\s*'\d+\.\d+\.\d+\.\d+'/.test(version), 'runtime release version source is required');
assert(/updateNo:\s*'\d+(?:\.\d+)?'/.test(version), 'runtime update number source is required');
assert(/revision:\s*\d+/.test(version), 'runtime revision source is required');
assert(core.includes("{title:'覇道ライブラリへようこそ',target:'#appTitlePanel',tab:'search',searchMode:'normal'"), 'first-time guide must start on normal search');
assert(core.includes("{title:'候補ワークスペース',target:'.result-copy-actions',tab:'search',searchMode:'normal'"), 'search guide step 8 must return to normal search');
assert(core.includes("{title:'結果サマリーの6項目を確認',target:'.formation-quick-summary-strip'"), 'formation guide step 8 must select the result summary');
assert(styles.includes('.guided-tour-text{font-size:14px;line-height:1.8;letter-spacing:.02em'), 'guide body must keep readable line and character spacing');
assert(styles.includes('.guided-tour-title{font-size:17px;font-weight:900;color:#0f172a;line-height:1.5;letter-spacing:.015em'), 'guide title must keep readable line and character spacing');
assert(!styles.includes('.guided-tour-text{line-height:1.55!important}'), 'mobile guide must not restore the cramped line height');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `missing ${name}`);
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

const hidden = { getClientRects: () => [] };
const visible = { getClientRects: () => [{ width: 320, height: 120 }] };
const context = {
  guidedTourState: { tourKey: 'formation' },
  getCurrentGuidedTourKey: () => 'formation',
  document: {
    querySelectorAll: (selector) => selector === '.formation-quick-summary-strip' ? [hidden, visible] : [],
    querySelector: () => null,
    getElementById: () => null,
  },
};
vm.createContext(context);
vm.runInContext(`${extractFunction(core, 'getGuidedTourStepTarget')}; this.resolveTarget=getGuidedTourStepTarget;`, context);
assert.strictEqual(context.resolveTarget({ target: '.formation-quick-summary-strip' }), visible, 'guide target resolution must skip a hidden duplicate and select the visible result summary');

console.log('Update10 guide navigation regression passed.');
