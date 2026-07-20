'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const core = read('hado_core.js');
const index = read('index.html');

assert(core.includes('UPDATE10_2_QUICK_GUIDE_STEPS'), 'quick guide must be owned by the active external runtime');
assert(core.includes('UPDATE10_2_QUICK_GUIDE_STEPS.length'), 'quick guide must render every current step');
assert(core.includes('syncUpdate10QuickGuideCopy();'), 'quick guide copy must be synchronized during setup');

[
  '3モードの条件と選択中詳細は個別に保持されます',
  '型編成ナビは「主将から」「目的から」「型を直接」の3通りです',
  '編集中の型・役割・選択候補は閉じても復元されます',
  '侍従候補はUR以下です',
  '結果サマリーの6項目を確認',
  '兵力、被ダメージ、通常攻撃、戦法初動、戦法速度、戦法最大倍率',
  '最終能力値ではなく、現在編成から確認できる加算値です',
  'IME入力中は検索せず、変換確定後に検索します',
  'その直後に数値がある効果だけを対象にします',
  '概要・変化率・基礎・戦法・技能・その他',
].forEach((needle) => assert(core.includes(needle), `missing current guide contract: ${needle}`));

assert(core.includes("target:'.formation-quick-summary-strip'"), 'formation summary guide must target the result summary itself');
assert(core.includes("formationInnerTab:'edit'"), 'formation summary guide must open the edit tab');
assert(core.includes("formationInnerTab:'parameter'"), 'formation calculation guide must open the parameter tab');
assert(index.includes('id="uxQuickGuide"'), 'start guide host must remain available');
assert(index.includes('id="uxHomeVersionBadge"'), 'guide version badge must remain available');
assert(!core.includes('〇〇を表示中'), 'guide refresh must not restore redundant current-view rows');

console.log('Update10.2 guide refresh regression passed.');
