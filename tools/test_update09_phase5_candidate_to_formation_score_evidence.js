#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const rules = JSON.parse(fs.readFileSync('hadou_type_score_rules.json','utf8')).items;
const presets = JSON.parse(fs.readFileSync('hadou_type_search_presets.json','utf8')).items;
const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const featureIndex = { items: [
  { category: 'generals', name: '華佗', statusEffectRefs: [
    { featureId: 'status_effect:weakening_avoid:seisei', label: '弱化効果回避[鎮静]', statusEffectName: '弱化効果回避[鎮静]', sourceLabel: '華佗:技能:鎮静Ⅰ', sourcePartType: 'skill', matchedText: '弱化効果を5%の確率で避ける（他技能と合算）' },
    { featureId: 'status_effect:tag_only', label: '弱化効果回避', statusEffectName: '弱化効果回避[タグのみ]', sourceLabel: '華佗:検索タグ:弱化予防' }
  ], typeFeatures: [
    { featureId: 'type_feature:calm:weakening_guard', label: '弱化予防', sourceLabel: '華佗:技能:鎮静Ⅰ', sourcePartType: 'skill', matchedText: '弱化効果を5%の確率で避ける（他技能と合算）' }
  ] },
  { category: 'generals', name: '未配置武将', statusEffectRefs: [
    { featureId: 'status_effect:unplaced', label: '弱化効果回避', statusEffectName: '弱化効果回避', sourceLabel: '未配置武将:技能', sourcePartType: 'skill', matchedText: '弱化効果を避ける' }
  ], typeFeatures: [] },
  { category: 'generals', name: '不成立武将', statusEffectRefs: [
    { featureId: 'status_effect:inactive', label: '弱化効果回避', statusEffectName: '弱化効果回避', sourceLabel: '不成立武将:技能', sourcePartType: 'skill', matchedText: '弱化効果を避ける', conditionSatisfied: false }
  ], typeFeatures: [] }
] };
const context = {
  console, require, setTimeout, clearTimeout, fetch: undefined, window: null,
  state: { generals: [{ name: '華佗' }, { name: '未配置武将' }, { name: '不成立武将' }], equipments: [], derivedData: { typeSearchPresets: { items: presets }, typeSearchFeatureIndex: featureIndex }, diagnostics: {}, typeSearchCacheStats: { hit: 0, miss: 0, invalidations: 0, store: 0 } },
  debugLog() {}, debugTimestamp() { return '2026-07-04T00:00:00.000Z'; }, norm, normalizeSaveItemName: norm, esc,
  safeCloneForDebug(value) { return JSON.parse(JSON.stringify(value)); },
  effectSignedValue(effect) { return `${effect?.sign || '+'}${effect?.value ?? ''}${effect?.unit || ''}`; },
  isResponsiveMobileMode() { return false; }, PARAM_DISPLAY_GROUP_ORDER: ['能力'], PARAM_GROUPS: [{ keys: ['弱化無効'] }],
  timingLabel(value) { return value; }, parameterDisplayName(value) { return value; }, getParameterDefaultUnit(key, unit) { return unit || '%'; }, formatFormationParameterNumber(value) { return String(Number(value) || 0); }, formationParameterDisplayValue(key, value) { return `${value?.sign || '+'}${value?.maxTotal ?? value?.value ?? ''}${value?.unit || ''}`; },
  getItemDisplayName(item) { return item?.name || ''; }, detailCategory(item) { return item?.category || 'generals'; }, localStorage: { getItem() { return null; }, setItem() {} }, document: { getElementById() { return null; } }, els: {}, performance: { now: () => 0 }, requestAnimationFrame(callback) { callback(); }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('hado_type_score.js','utf8'), context, { filename: 'hado_type_score.js' });
vm.runInContext(fs.readFileSync('hado_formation.js','utf8'), context, { filename: 'hado_formation.js' });
const formation = { id: 'huatuo-calm', name: '新規部隊3', evaluationTypeId: 'calm', evaluationTypeName: '鎮静型', slots: { main: {}, deputy1: {}, deputy2: {}, support1: { general: '華佗' }, support2: { general: '不成立武将' } }, advisorSlots: {} };
const built = context.buildFormationScoreEvidence(formation, { effects: [], parameterCalculation: { rows: [] } });
assert(built.scoreEvidence.some(row => row.effectFamily === 'weakening_avoid' && row.sourceLabel.includes('鎮静')), '華佗・鎮静の一次根拠からweakening_avoid evidenceを作る');
assert(!built.scoreEvidence.some(row => row.sourceLabel.includes('未配置武将')), '未配置候補はscoreEvidenceに入れない');
assert(!built.scoreEvidence.some(row => row.sourceLabel.includes('不成立武将')), '配置済みでも不成立の候補判定はscoreEvidenceに入れない');
assert(built.candidateToScoreMismatches.some(row => row.mismatchReason === '候補判定あり・一次根拠不足'), 'タグのみ候補は直接加点せずmismatch診断に残す');
const score = context.window.HadoTypeScore.score({ roleId: 'formation_effects', scoreEvidence: built.scoreEvidence }, rules.find(rule => rule.typeId === 'calm'));
const weakGuard = score.breakdown.find(row => (row.scoreMetricId || row.metricKey) === 'calm_1');
assert(weakGuard && (Number(weakGuard.score || weakGuard.confirmedValue || 0) >= 1 || (weakGuard.rows || []).length >= 1), 'calm_1 / 弱化予防に少なくとも1点入る');
assert(score.totalScore >= 1, 'totalScoreは少なくとも1');
assert(score.runtimeBridge && score.runtimeBridge.usedFallback === false, '旧rule.metrics fallbackに戻さない');
assert(Number(score.matchedCount || 0) >= 1, 'bridgeMatchedEvidenceCount相当が1以上');
context.calculateFormationTypeScore(formation, { effects: [], parameterCalculation: { rows: [] } });
const diag = context.state.diagnostics.typeScore;
assert(diag.formationCandidateEvidenceCount >= 1, 'formationCandidateEvidenceCountを診断に出す');
assert(diag.formationCandidateEvidenceRows.some(row => row.expectedChangeItemId === 'weakening_avoid' && row.expectedScoreMetricId === 'calm_1' && row.primaryResolved), '候補判定とscoreMetricの接続を診断に出す');
assert(diag.candidateToScoreMismatches.some(row => row.mismatchReason === '候補判定あり・一次根拠不足'), '一次根拠不足の候補はmismatch診断に出す');
['弱化効果回避','弱化回避','弱化効果を避ける','弱化効果を5%の確率で避ける','弱化効果を確率で避ける'].forEach(text => {
  const ev = context.buildFormationScoreEvidence({ id: `alias-${text}`, slots: {}, evaluationTypeId: 'calm' }, { effects: [{ sourceLabel: 'alias-test', rawText: text, targetScope: 'self', timing: 'normal' }], parameterCalculation: { rows: [] } }).scoreEvidence;
  assert(ev.some(row => row.effectFamily === 'weakening_avoid'), `${text} must normalize to weakening_avoid`);
});
console.log('Update09 Phase5 candidate-to-formation score evidence tests passed');
