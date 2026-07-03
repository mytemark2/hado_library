#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rules = JSON.parse(fs.readFileSync('hadou_type_score_rules.json', 'utf8')).items;
const presets = JSON.parse(fs.readFileSync('hadou_type_search_presets.json', 'utf8')).items;
const featureIndex = JSON.parse(fs.readFileSync('hadou_type_search_feature_index.json', 'utf8'));
const context = {
  console, require, setTimeout, clearTimeout, fetch: undefined, window: null,
  state: { derivedData: { typeSearchPresets: { items: presets }, typeSearchFeatureIndex: { items: featureIndex.items } }, diagnostics: {}, typeSearchCacheStats: { hit: 0, miss: 0, invalidations: 0, store: 0 } },
  debugLog() {}, debugTimestamp() { return '2026-07-03T00:00:00.000Z'; }, norm, normalizeSaveItemName: norm, esc,
  safeCloneForDebug(value) { return JSON.parse(JSON.stringify(value)); },
  effectSignedValue(effect) { return `${effect?.sign || '+'}${effect?.value ?? ''}${effect?.unit || ''}`; },
  isResponsiveMobileMode() { return false; }, PARAM_DISPLAY_GROUP_ORDER: ['能力'], PARAM_GROUPS: [{ keys: ['防御', '負傷兵回復', '属性耐性', '戦法ゲージ', '戦法速度', '攻撃速度', '通常攻撃対象数'] }],
  timingLabel(value) { return value; }, parameterDisplayName(value) { return value; }, getParameterDefaultUnit(key, unit) { return unit || '%'; }, formatFormationParameterNumber(value) { return String(Number(value) || 0); }, formationParameterDisplayValue(key, value) { return `${value?.sign || '+'}${value?.maxTotal ?? value?.value ?? ''}${value?.unit || ''}`; },
  getItemDisplayName(item) { return item?.name || ''; }, detailCategory() { return ''; }, localStorage: { getItem() { return null; }, setItem() {} }, document: { getElementById() { return null; } }, els: {}, performance: { now: () => 0 }, requestAnimationFrame(callback) { callback(); }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('hado_type_score.js', 'utf8'), context, { filename: 'hado_type_score.js' });
vm.runInContext(fs.readFileSync('hado_formation.js', 'utf8'), context, { filename: 'hado_formation.js' });

const formation = { id: 'zero_primary_vaccine', name: '除外根拠のみ', evaluationTypeId: 'vaccine', evaluationTypeName: 'ワクチン型', slots: {}, advisorSlots: {} };
const data = {
  summary: { normal: { '能力': {
    '防御': { sign: '+', maxTotal: 40, unit: '%' },
    '負傷兵回復': { sign: '+', maxTotal: 10, unit: '%' },
    '属性耐性': { sign: '+', maxTotal: 20, unit: '%' },
    '戦法ゲージ': { sign: '+', maxTotal: 10, unit: '%' },
    '戦法速度': { sign: '+', maxTotal: 15, unit: '%' },
    '攻撃速度': { sign: '+', maxTotal: 20, unit: '%' },
    '通常攻撃対象数': { sign: '+', maxTotal: 1, unit: '' }
  } } },
  effects: [
    { key: '防御', timing: 'normal', value: 40, sign: '+', unit: '%', sourceLabel: '除外防御', rawText: '味方3部隊の防御を上昇', condition: '' },
    { key: '負傷兵回復', timing: 'normal', value: 10, sign: '+', unit: '%', sourceLabel: '除外負傷兵', rawText: '味方3部隊の負傷兵を最大兵力の10%回復', condition: '' },
    { key: '属性耐性', timing: 'normal', value: 20, sign: '+', unit: '%', sourceLabel: '除外属性', rawText: '自部隊の火属性耐性を上昇', condition: '' },
    { key: '戦法ゲージ', timing: 'normal', value: 10, sign: '+', unit: '%', sourceLabel: '除外ゲージ', rawText: '自部隊の戦法ゲージを増加', condition: '' },
    { key: '戦法速度', timing: 'normal', value: 15, sign: '+', unit: '%', sourceLabel: '除外戦法速度', rawText: '自部隊の戦法速度を上昇', condition: '' },
    { key: '攻撃速度', timing: 'normal', value: 20, sign: '+', unit: '%', sourceLabel: '除外攻撃速度', rawText: '味方3部隊の攻撃速度を上昇', condition: '' },
    { key: '通常攻撃対象数', timing: 'normal', value: 1, sign: '+', unit: '', sourceLabel: '除外通常対象', rawText: '自部隊の通常攻撃対象数を増加', condition: '' }
  ]
};

const built = context.buildFormationScoreEvidence(formation, data).scoreEvidence;
const denyIds = ['defense_up', 'wounded_recovery', 'attribute_resistance', 'tactic_gauge', 'tactic_speed', 'attack_speed_up', 'normal_attack_target_count_up'];
for (const id of denyIds) {
  assert(built.some(row => row.effectFamily === id), `${id} evidence must be built from formation data`);
}
const vaccineRule = rules.find(row => row.typeId === 'vaccine');
const directScore = context.window.HadoTypeScore.score({ roleId: 'formation_effects', scoreEvidence: built }, vaccineRule);
assert.strictEqual(directScore.totalScore, 0, 'vaccine must not score deny-only evidence');
for (const id of denyIds) {
  assert(directScore.excludedRows.some(row => row.changeItemId === id && row.excludeReason === 'deny_change_item'), `${id} must be excluded as deny_change_item`);
}

const html = context.renderFormationScoreSummaryHtml(formation, data);
const diag = context.state.diagnostics.typeScore;
const selected = diag.candidateScores[0];
assert(diag.bridgeInputEvidenceCount > 0, 'diagnostics must include bridge input evidence');
assert.strictEqual(diag.bridgeMatchedEvidenceCount, 0, 'diagnostics must show zero matched Primary evidence');
assert(diag.bridgeExcludedEvidenceCount > 0, 'diagnostics must include excluded evidence');
assert.strictEqual(selected.totalScore, 0, 'zero-primary vaccine totalScore must remain 0');
assert.strictEqual(diag.bridgeZeroPrimaryReason, 'no_primary_match_with_excluded_evidence', 'diagnostics must expose zero-primary reason code');
assert(String(diag.bridgeZeroPrimaryMessage || '').includes('評価対象Primaryなし'), 'diagnostics must expose Japanese zero-primary message');
assert((diag.bridgeExcludedReasons || {}).deny_change_item > 0, 'diagnostics must count deny_change_item exclusions');
assert(Array.isArray(diag.bridgeExcludedRowsSample) && diag.bridgeExcludedRowsSample.length > 0, 'diagnostics must expose excludedRows sample');
assert(html.includes('formation-score-zero-primary'), 'UI must render zero-primary diagnostic panel');
assert(html.includes('評価対象Primaryなし'), 'UI must explain that no Primary evidence matched');
assert(html.includes('除外件数'), 'UI must show excluded row count');
assert(html.includes('deny_change_item'), 'UI must show deny_change_item count');
assert(!(html.includes('formation-score-empty') && !html.includes('formation-score-zero-primary')), 'UI must not end with only 該当タグなし');
const scoredIds = selected.rows.flatMap(row => row.evidenceRows || []).map(row => row.changeItemId || row.effectFamily);
for (const id of denyIds) {
  assert(!scoredIds.includes(id), `${id} must not be scored for vaccine`);
}
console.log('Update09 Phase5 zero-primary type score diagnostics tests passed');
