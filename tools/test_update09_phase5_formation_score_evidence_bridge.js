#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const rules = JSON.parse(fs.readFileSync('hadou_type_score_rules.json', 'utf8')).items;
const presets = JSON.parse(fs.readFileSync('hadou_type_search_presets.json', 'utf8')).items;
const featureIndex = JSON.parse(fs.readFileSync('hadou_type_search_feature_index.json', 'utf8'));
const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const context = {
  console, require, setTimeout, clearTimeout, fetch: undefined, window: null,
  state: { derivedData: { typeSearchPresets: { items: presets }, typeSearchFeatureIndex: { items: featureIndex.items } }, diagnostics: {}, typeSearchCacheStats: { hit: 0, miss: 0, invalidations: 0, store: 0 } },
  debugLog() {}, debugTimestamp() { return '2026-07-03T00:00:00.000Z'; }, norm, normalizeSaveItemName: norm, esc,
  safeCloneForDebug(value) { return JSON.parse(JSON.stringify(value)); },
  effectSignedValue(effect) { return `${effect?.sign || '+'}${effect?.value ?? ''}${effect?.unit || ''}`; },
  isResponsiveMobileMode() { return false; }, PARAM_DISPLAY_GROUP_ORDER: ['能力'], PARAM_GROUPS: [{ keys: ['弱化無効', '攻撃', '防御', '攻撃速度'] }],
  timingLabel(value) { return value; }, parameterDisplayName(value) { return value; }, getParameterDefaultUnit(key, unit) { return unit || '%'; }, formatFormationParameterNumber(value) { return String(Number(value) || 0); }, formationParameterDisplayValue(key, value) { return `${value?.sign || '+'}${value?.maxTotal ?? value?.value ?? ''}${value?.unit || ''}`; },
  getItemDisplayName(item) { return item?.name || ''; }, detailCategory() { return ''; }, localStorage: { getItem() { return null; }, setItem() {} }, document: { getElementById() { return null; } }, els: {}, performance: { now: () => 0 }, requestAnimationFrame(callback) { callback(); }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('hado_type_score.js', 'utf8'), context, { filename: 'hado_type_score.js' });
vm.runInContext(fs.readFileSync('hado_formation.js', 'utf8'), context, { filename: 'hado_formation.js' });
const formation = { id: 'bridge_formation', name: '実画面相当', evaluationTypeId: 'vaccine', evaluationTypeName: 'ワクチン型', slots: {}, advisorSlots: {} };
const data = {
  summary: { normal: { '能力': { '攻撃': { sign: '+', maxTotal: 30, unit: '%' }, '防御': { sign: '+', maxTotal: 40, unit: '%' }, '攻撃速度': { sign: '+', maxTotal: 20, unit: '%' } } } },
  parameterCalculation: { rows: [{ key: '攻撃', label: '攻撃', timing: 'normal', value: '+30%' }, { key: '防御', label: '防御', timing: 'normal', value: '+40%' }, { key: '攻撃速度', label: '攻撃速度', timing: 'normal', value: '+20%' }] },
  effects: [
    { key: '弱化無効', timing: 'normal', value: 1, sign: '+', unit: '', sourceLabel: '検証耐性', rawText: '自部隊の弱化効果を無効', condition: '' },
    { key: '負傷兵回復', timing: 'normal', value: 10, sign: '+', unit: '%', sourceLabel: '検証回復', rawText: '味方3部隊の負傷兵を最大兵力の10%回復', condition: '' },
    { key: '弱化無効', timing: 'normal', value: 1, sign: '+', unit: '', sourceLabel: '敵対象', rawText: '敵3部隊に弱化無効を付与', condition: '' },
    { key: '弱化解除', timing: 'normal', value: 1, sign: '+', unit: '', sourceLabel: '対象不明', rawText: '弱化解除', condition: '' }
  ]
};
const built = context.buildFormationScoreEvidence(formation, data).scoreEvidence;
assert(built.some(row => row.effectFamily === 'weakening_nullify' && row.targetScope === 'self'), 'formationData.effects must build weakening_nullify scoreEvidence');
assert(built.some(row => row.effectFamily === 'wounded_recovery'), 'formationData.effects must build wounded_recovery deny-target evidence');
assert(built.some(row => row.effectFamily === 'attack_up'), 'parameterCalculation.rows must build attack_up evidence');
assert(built.some(row => row.effectFamily === 'defense_up'), 'parameterCalculation.rows must build defense_up evidence');
assert(built.some(row => row.effectFamily === 'attack_speed_up'), 'parameterCalculation.rows must build attack_speed_up evidence');
const vaccineRule = rules.find(row => row.typeId === 'vaccine');
const vaccineScore = context.window.HadoTypeScore.score({ roleId: 'formation_effects', scoreEvidence: built }, vaccineRule);
assert(vaccineScore.totalScore > 0, 'vaccine score must not remain zero with weakening evidence');
assert(vaccineScore.excludedRows.some(row => row.effectFamily === 'wounded_recovery' && row.excludeReason === 'deny_change_item'), 'wounded_recovery must be excluded for vaccine');
assert(vaccineScore.excludedRows.some(row => row.targetScope === 'enemy' && row.excludeReason === 'target_not_allowed'), 'enemy evidence must be excluded for vaccine');
assert(vaccineScore.excludedRows.some(row => row.targetScope === 'unknown' && row.excludeReason === 'unknown_target_for_target_dependent_type'), 'unknown evidence must be excluded for vaccine');
const buffRule = rules.find(row => row.typeId === 'buff_support');
const buffScore = context.window.HadoTypeScore.score({ roleId: 'formation_effects', scoreEvidence: built }, buffRule);
['attack_up','defense_up','attack_speed_up'].forEach(id => {
  const excluded = buffScore.excludedRows.find(row => row.changeItemId === id && row.sourceKind === 'parameter');
  assert(excluded, `${id} parameter aggregate evidence must remain visible in excluded diagnostics`);
  assert.strictEqual(excluded.excludeReason, 'aggregate_parameter_origin', `${id} parameter aggregate evidence must be blocked at bridge scoring`);
  assert.strictEqual(Number(excluded.point || 0), 0, `${id} parameter aggregate evidence must contribute 0 points`);
});
assert(!buffScore.breakdown.some(row => row.scoreRole === 'P' && row.rows.some(e => ['attack_up','defense_up','attack_speed_up'].includes(e.changeItemId) && e.sourceKind === 'parameter')), 'buff_support must not score aggregate parameter evidence as Primary');
context.renderFormationScoreSummaryHtml(formation, data);
const diag = context.state.diagnostics.typeScore;
assert(diag.candidateScores[0].totalScore > 0, 'renderFormationScoreSummaryHtml vaccine score must not stay zero');
assert(diag.bridgeInputEvidenceCount > 0 && diag.bridgeMatchedEvidenceCount > 0, 'diagnostics must expose bridge evidence counts');
console.log('Update09 Phase5 formation score evidence bridge tests passed');
