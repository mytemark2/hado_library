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
  { category: 'generals', name: '戦法主将', statusEffectRefs: [], typeFeatures: [
    { featureId: 'tactic_effect:weakening_nullify', label: '弱化効果無効', sourceLabel: '戦法主将:戦法:検証戦法', sourceText: '戦法発動時、自部隊の弱化効果を無効化する', targetScope: 'self', timing: 'always' }
  ] },
  { category: 'generals', name: '戦法補佐', statusEffectRefs: [], typeFeatures: [
    { featureId: 'tactic_effect:weakening_nullify', label: '弱化効果無効', sourceLabel: '戦法補佐:戦法:補佐戦法', sourceText: '戦法発動時、自部隊の弱化効果を無効化する', targetScope: 'self', timing: 'always' }
  ] },
  { category: 'generals', name: '技能補佐', statusEffectRefs: [], typeFeatures: [
    { featureId: 'skill_effect:tactic_speed', label: '戦法速度', sourceLabel: '技能補佐:技能:迅速Ⅰ', sourceText: '自部隊の戦法速度を上昇させる', targetScope: 'self', timing: 'always' }
  ] }
] };
const context = { console, require, setTimeout, clearTimeout, fetch: undefined, window: null, HADO_TYPE_SCORE_RULES: rules,
  state: { generals: [{ name: '戦法主将' }, { name: '戦法補佐' }, { name: '技能補佐' }], equipments: [], derivedData: { typeSearchPresets: { items: presets }, typeSearchFeatureIndex: featureIndex }, diagnostics: {}, typeSearchCacheStats: { hit: 0, miss: 0, invalidations: 0, store: 0 } },
  debugLog() {}, debugTimestamp() { return '2026-07-06T00:00:00.000Z'; }, norm, normalizeSaveItemName: norm, esc,
  safeCloneForDebug(value) { return JSON.parse(JSON.stringify(value)); }, effectSignedValue(effect) { return `${effect?.sign || '+'}${effect?.value ?? ''}${effect?.unit || ''}`; },
  isResponsiveMobileMode() { return false; }, PARAM_DISPLAY_GROUP_ORDER: ['能力'], PARAM_GROUPS: [{ keys: ['弱化無効'] }], timingLabel(value) { return value; }, parameterDisplayName(value) { return value; },
  getParameterDefaultUnit(key, unit) { return unit || '%'; }, formatFormationParameterNumber(value) { return String(Number(value) || 0); }, formationParameterDisplayValue(key, value) { return `${value?.sign || '+'}${value?.maxTotal ?? value?.value ?? ''}${value?.unit || ''}`; },
  getItemDisplayName(item) { return item?.name || ''; }, detailCategory(item) { return item?.category || 'generals'; }, localStorage: { getItem() { return null; }, setItem() {} }, document: { getElementById() { return null; } }, els: {}, performance: { now: () => 0 }, requestAnimationFrame(callback) { callback(); }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('hado_type_score.js','utf8'), context, { filename: 'hado_type_score.js' });
vm.runInContext(fs.readFileSync('hado_formation.js','utf8'), context, { filename: 'hado_formation.js' });
assert.strictEqual(context.normalizeFormationCandidateEvidenceSourceType({ featureId: 'tactic_effect:weakening_nullify', sourceLabel: '武将:戦法:検証戦法' }, { kind: 'general' }, 'generals', '戦法発動時、自部隊の弱化効果を無効化する', 'typeSearchFeatureIndex.typeFeatures'), 'tactic', 'tactic-derived typeSearch evidence normalizes to tactic');
assert.strictEqual(context.normalizeFormationCandidateEvidenceSourceType({ featureId: 'skill_effect:tactic_speed', sourceLabel: '武将:技能:迅速Ⅰ' }, { kind: 'general' }, 'generals', '自部隊の戦法速度を上昇させる', 'typeSearchFeatureIndex.typeFeatures'), 'skill', 'skill-origin text mentioning tactic speed remains skill');
const formation = { id: 'candidate-tactic-normalize', evaluationTypeId: 'calm', slots: { main: { general: '戦法主将' }, deputy1: {}, deputy2: {}, support1: { general: '戦法補佐' }, support2: { general: '技能補佐' } }, advisorSlots: {} };
const built = context.buildFormationScoreEvidence(formation, { effects: [], parameterCalculation: { rows: [] } });
assert(built.scoreEvidence.some(row => row.sourceLabel.includes('検証戦法') && row.sourceType === 'tactic' && row.sourceSlot === 'main'), 'active main tactic-derived candidate evidence must score as tactic');
assert(!built.scoreEvidence.some(row => row.sourceLabel.includes('補佐戦法')), 'inactive support tactic-derived candidate evidence must not enter scoreEvidence');
assert(built.candidateToScoreMismatches.some(row => row.sourceLabel.includes('補佐戦法') && row.mismatchReason === 'tactic_source_inactive_slot'), 'inactive tactic-derived candidate evidence is diagnosed');
const S = context.window.HadoTypeScore;
const calmRule = rules.find(rule => rule.typeId === 'calm');
let score = S.tableBridgeScore({ scoreEvidence: [{ evidenceId: 'slipped-support-tactic', sourceType: 'skill', sourceSlot: 'support1', sourceOrigin: 'typeSearchFeatureIndex.typeFeatures', sourceLabel: '戦法補佐:戦法:補佐戦法', timing: 'always', targetScope: 'self', effectFamily: 'weakening_nullify', rawText: '戦法発動時、自部隊の弱化効果を無効化する', matchedText: '戦法発動時、自部隊の弱化効果を無効化する', isPrimaryEffect: true, evidenceGroupKey: 'support-tactic-slip' }] }, calmRule);
const inactiveExcluded = score.excludedRows.find(row => row.evidenceId === 'slipped-support-tactic');
assert(inactiveExcluded, 'tableBridgeScore keeps inactive tactic-derived slip-through in excludedRows');
assert.strictEqual(inactiveExcluded.excludeReason, 'tactic_source_inactive_slot', 'tableBridgeScore final defense excludes inactive tactic-derived evidence even if sourceType is wrong');
assert.strictEqual(inactiveExcluded.point, 0, 'inactive tactic-derived excluded evidence has point 0');
score = S.tableBridgeScore({ scoreEvidence: [{ evidenceId: 'parameter-still-excluded', sourceType: 'formation', sourceKind: 'parameter', sourceLabel: 'parameter', timing: 'always', targetScope: 'self', effectFamily: 'weakening_nullify', rawText: '部隊の戦法ゲージ +50%', matchedText: '部隊の戦法ゲージ +50%', isPrimaryEffect: true, evidenceGroupKey: 'parameter-still-excluded' }] }, calmRule);
assert.strictEqual(score.excludedRows.find(row => row.evidenceId === 'parameter-still-excluded')?.excludeReason, 'aggregate_parameter_origin', 'Update09.5.39 parameter aggregate gate remains active');
console.log('Update09.5.40 tactic-derived evidence normalization tests passed');
