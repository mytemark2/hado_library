#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const rules = JSON.parse(fs.readFileSync('hadou_type_score_rules.json','utf8')).items;
const presets = JSON.parse(fs.readFileSync('hadou_type_search_presets.json','utf8')).items;
const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function element(){ return { style:{}, hidden:false, disabled:false, classList:{ contains(){ return false; } }, appendChild(){}, remove(){}, setAttribute(){}, addEventListener(){}, querySelector(){ return null; }, querySelectorAll(){ return []; } }; }
const context = {
  console, require, setTimeout, clearTimeout, setInterval(){}, fetch: undefined, window: null,
  document: { readyState: 'complete', head: element(), body: element(), documentElement: element(), createElement: element, getElementById(){ return null; } },
  MutationObserver: class { observe(){} },
  localStorage: { getItem(){ return null; }, setItem(){} },
  addEventListener(){}, dispatchEvent(){}, CustomEvent: class { constructor(name, init){ this.type=name; this.detail=init?.detail; } },
  performance: { now: () => 0 }, requestIdleCallback(cb){ cb(); },
  state: { viewMode: 'all', diagnostics: {}, savedSearchCacheSeq: 0 },
  norm, esc,
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('hado_type_score.js','utf8'), context, { filename: 'hado_type_score.js' });
vm.runInContext(fs.readFileSync('hado_type_candidates.js','utf8'), context, { filename: 'hado_type_candidates.js' });
context.window.HadoTypeCandidatesDebug.setDebugDataForTest({ roles: [], types: rules, purposes: presets }, { typeId: 'calm' });
const candidate = {
  displayName: '華佗（かだ）',
  roleId: 'support_general',
  _typeTags: [
    { kind: 'core', kindLabel: '中核', label: '弱化解除' },
    { kind: 'evidence', kindLabel: '根拠', label: '弱化効果解除' }
  ],
  statusEffectRefs: [
    { featureId: 'status_effect:weakening_avoid:seisei', label: '弱化効果回避[鎮静]', statusEffectName: '弱化効果回避[鎮静]', sourcePartType: 'skill', matchedText: '弱化効果を5%の確率で避ける（他技能と合算）Ⅱ' },
    { featureId: 'status_effect:weakening_remove:sample', label: '弱化効果解除[仮根拠]', statusEffectName: '弱化効果解除[仮根拠]', sourcePartType: 'skill', matchedText: '弱化効果を解除' }
  ],
  typeFeatures: []
};
const tags = context.window.HadoTypeCandidatesDebug.candidateDisplayTags(candidate);
assert(tags.some(t => t.kindLabel === '中核' && t.label === '弱化予防'), '候補一覧カードに弱化予防を表示する');
assert(tags.some(t => t.kindLabel === '根拠' && t.label === '弱化効果回避［鎮静］'), '候補一覧カードに弱化効果回避［鎮静］を表示する');
assert(tags.some(t => t.kindLabel === '中核' && t.label === '弱化解除'), '既存の弱化解除も維持する');
assert(tags.some(t => t.kindLabel === '根拠' && /弱化効果解除/.test(t.label)), '弱化効果解除の根拠も維持する');
assert(!tags.some(t => t.label === '弱化回避'), '短縮語の弱化回避を表示しない');
const score = context.window.HadoTypeScore.score({ roleId: 'formation_effects', scoreEvidence: [{ evidenceId:'seisei', sourceType:'skill', sourceLabel:'華佗:技能:鎮静Ⅰ', timing:'always', targetScope:'self', effectFamily:'weakening_avoid', rawText:'弱化効果を5%の確率で避ける（他技能と合算）Ⅱ', matchedText:'弱化効果を5%の確率で避ける（他技能と合算）Ⅱ', isPrimaryEffect:true, evidenceGroupKey:'huatuo:seisei:weakening_avoid' }] }, rules.find(r => r.typeId === 'calm'));
const calm1 = score.breakdown.find(row => row.metricKey === 'calm_1');
assert(calm1.confirmedValue >= 1, 'calm_1 / 弱化予防のスコアを維持する');
assert.strictEqual(score.runtimeBridge.usedFallback, false, '判定表ブリッジを維持する');
assert.strictEqual(calm1.rows[0].changeItemId, 'weakening_avoid', '内部changeItemIdを維持する');
const formationSource = fs.readFileSync('hado_formation.js','utf8');
assert(formationSource.includes('formation-score-evidence-line-item'), '評価スコア詳細は1根拠2行の明細行を使う');
assert(formationSource.includes('formation-score-evidence-line-main') && formationSource.includes('formation-score-evidence-effect') && formationSource.includes('対象:') && formationSource.includes('根拠:') && formationSource.includes('formation-score-evidence-line-raw'), '標準効果・対象・根拠を1行目、原文を2行目に分離する');
assert(!formationSource.includes("<b>${esc(item.kindLabel||'型要素')}</b>"), '評価スコア詳細に型要素ラベルを出さない');
const css = fs.readFileSync('hado_styles.css','utf8');
assert(css.includes('.formation-score-evidence-dialog-list{display:flex!important;flex-direction:column!important') && css.includes('.formation-score-evidence-line-item{width:100%;display:block') && css.includes('.formation-score-evidence-line-main{display:flex'), '詳細モーダルを横並びカードではなく1根拠2行の明細にするCSSを持つ');
assert(css.includes('overflow-x:hidden!important'), '詳細モーダルは横スクロール前提にしない');
assert(css.includes('overflow-wrap:break-word') && css.includes('white-space:normal'), '長文原文を折り返して読めるCSSを持つ');
console.log('Update09.5.30 candidate and score display hierarchy tests passed');
