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
  { category: 'generals', name: '戦法主将', statusEffectRefs: [
    { featureId: 'status_effect:main_tactic', label: '弱化効果無効', statusEffectName: '弱化効果無効', sourceLabel: '戦法主将:戦法:検証戦法', sourceType: 'tactic', matchedText: '自部隊の弱化効果を無効', targetScope: 'self', timing: 'always' }
  ], typeFeatures: [] },
  { category: 'generals', name: '戦法補佐', statusEffectRefs: [
    { featureId: 'status_effect:support_tactic', label: '弱化効果無効', statusEffectName: '弱化効果無効', sourceLabel: '戦法補佐:戦法:補佐戦法', sourceType: 'tactic', matchedText: '自部隊の弱化効果を無効', targetScope: 'self', timing: 'always' }
  ], typeFeatures: [] },
  { category: 'generals', name: '戦法侍従', statusEffectRefs: [
    { featureId: 'status_effect:attendant_tactic', label: '弱化効果無効', statusEffectName: '弱化効果無効', sourceLabel: '戦法侍従:戦法:侍従戦法', sourceType: 'tactic', matchedText: '自部隊の弱化効果を無効', targetScope: 'self', timing: 'always' }
  ], typeFeatures: [] }
] };
const context = {
  console, require, setTimeout, clearTimeout, fetch: undefined, window: null,
  HADO_TYPE_SCORE_RULES: rules,
  state: { generals: [{ name: '戦法主将' }, { name: '戦法補佐' }, { name: '戦法侍従' }], equipments: [], derivedData: { typeSearchPresets: { items: presets }, typeSearchFeatureIndex: featureIndex }, diagnostics: {}, typeSearchCacheStats: { hit: 0, miss: 0, invalidations: 0, store: 0 } },
  debugLog() {}, debugTimestamp() { return '2026-07-06T00:00:00.000Z'; }, norm, normalizeSaveItemName: norm, esc,
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
const S = context.window.HadoTypeScore;
const calmRule = rules.find(rule => rule.typeId === 'calm');
assert(calmRule, 'calm rule fixture must exist');
const parameterEvidence = {
  evidenceId: 'parameter:gauge', sourceType: 'formation', sourceKind: 'parameter', sourceLabel: 'parameter', sourceId: 'parameter', timing: 'always', targetScope: 'self', effectFamily: 'weakening_nullify', rawText: '部隊の戦法ゲージ +50%', matchedText: '部隊の戦法ゲージ +50%', isPrimaryEffect: true, evidenceGroupKey: 'parameter|formation|weakening_nullify'
};
let score = S.tableBridgeScore({ scoreEvidence: [parameterEvidence] }, calmRule);
assert(score, 'calm must use table bridge');
assert.strictEqual(score.totalScore, 0, 'parameter aggregate evidence must not add score');
const parameterExcluded = score.excludedRows.find(row => row.evidenceId === 'parameter:gauge');
assert(parameterExcluded, 'parameter aggregate evidence remains diagnostic excludedRows');
assert.strictEqual(parameterExcluded.excludeReason, 'aggregate_parameter_origin', 'parameter aggregate evidence uses aggregate_parameter_origin');
assert.strictEqual(parameterExcluded.point, 0, 'parameter aggregate excluded evidence has point 0');
const formationAllowedRow = S.BRIDGE_ROWS.find(row => row.scoreRole !== 'X' && row.allowedSourceTypes.includes('formation') && row.changeItems.length && row.allowedTargets.length && row.allowedTiming.length);
assert(formationAllowedRow, 'test fixture needs a bridge row allowing formation sourceType');
score = S.tableBridgeScore({ scoreEvidence: [{ evidenceId: 'formation-skill', sourceType: 'formation', sourceKind: 'effect', sourceLabel: '陣形:勇往陣:技能:勇往軒昂Ⅰ', timing: formationAllowedRow.allowedTiming[0], targetScope: formationAllowedRow.allowedTargets[0], effectFamily: formationAllowedRow.changeItems[0], rawText: '陣形技能の一次効果', matchedText: '陣形技能の一次効果', isPrimaryEffect: true, evidenceGroupKey: 'formation-skill-primary' }] }, rules.find(rule => rule.typeId === formationAllowedRow.typeId));
assert(score.totalScore > 0, 'formation sourceType itself must remain scorable when it is not parameter aggregate');
let built = context.buildFormationScoreEvidence({ id: 'tactic-direct', evaluationTypeId: 'calm', slots: {} }, { effects: [
  { sourceType: 'tactic', sourceSlot: 'main', sourceLabel: '戦法主将:戦法:検証戦法', rawText: '自部隊の弱化効果を無効', targetScope: 'self', timing: 'always' },
  { sourceType: 'tactic', sourceSlot: 'support1', sourceLabel: '戦法補佐:戦法:補佐戦法', rawText: '自部隊の弱化効果を無効', targetScope: 'self', timing: 'always' }
], parameterCalculation: { rows: [] } });
assert(built.scoreEvidence.some(row => row.sourceLabel.includes('検証戦法') && row.sourceSlot === 'main'), 'main tactic effect must be scoreEvidence');
assert(!built.scoreEvidence.some(row => row.sourceLabel.includes('補佐戦法')), 'support tactic effect must be suppressed before scoring');
const formation = { id: 'candidate-tactic-slots', evaluationTypeId: 'calm', slots: { main: { general: '戦法主将' }, deputy1: {}, deputy2: {}, support1: { general: '戦法補佐', attendant: '戦法侍従' }, support2: {} }, advisorSlots: {} };
built = context.buildFormationScoreEvidence(formation, { effects: [], parameterCalculation: { rows: [] } });
assert(built.scoreEvidence.some(row => row.sourceLabel.includes('検証戦法') && row.sourceType === 'tactic' && row.sourceSlot === 'main'), 'main-slot candidate tactic evidence must be included');
assert(!built.scoreEvidence.some(row => row.sourceLabel.includes('補佐戦法')), 'support-slot candidate tactic evidence must be excluded');
assert(!built.scoreEvidence.some(row => row.sourceLabel.includes('侍従戦法')), 'attendant tactic evidence must be excluded');
assert(built.candidateToScoreMismatches.filter(row => row.mismatchReason === 'tactic_source_inactive_slot').length >= 2, 'inactive tactic slots must be diagnosed');
assert.strictEqual(context.formationScoreSourceDisplayLabel('LR関羽（かんう）:技能:武聖Ⅰ','skill'), 'LR関羽（かんう） / 技能: 武聖Ⅰ', 'skill source label includes skill name');
assert.strictEqual(context.formationScoreSourceDisplayLabel('LR関銀屏（かんぎんぺい）:技能:澄心Ⅰ','skill'), 'LR関銀屏（かんぎんぺい） / 技能: 澄心Ⅰ', 'another skill source label includes skill name');
assert.strictEqual(context.formationScoreSourceDisplayLabel('陣形:勇往陣:技能:勇往軒昂Ⅰ','formation'), '勇往陣 / 技能: 勇往軒昂Ⅰ', 'formation skill source label includes formation and skill name');
console.log('Update09.5.39 score evidence parameter/tactic/label regression tests passed');
