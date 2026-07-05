#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const rules = JSON.parse(fs.readFileSync('hadou_type_score_rules.json','utf8')).items;
const presets = JSON.parse(fs.readFileSync('hadou_type_search_presets.json','utf8')).items;
const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const longTacticText = 'LR関羽の戦法 神武威顕: 自身1部隊に弱化無効を付与し、さらに攻撃、防御、対物特効、戦法威力など多数の効果を説明する戦法全文として扱われる長文。これは個別の一次効果行ではなく派生特徴の集約本文である。';
const featureIndex = { items: [
  { category: 'generals', name: 'LR関羽', statusEffectRefs: [
    { featureId: 'status_effect:weakening_nullify:name', label: '弱化無効', statusEffectName: '弱化無効', sourceLabel: 'LR関羽（かんう）:技能:弱化無効', sourcePartType: 'skill', matchedText: '弱化無効' },
    { featureId: 'status_effect:weakening_nullify:desc', label: '弱化効果無効[弱化無効]', statusEffectName: '弱化効果無効[弱化無効]', sourceLabel: 'LR関羽（かんう）:技能:弱化無効', sourcePartType: 'skill', matchedText: '効果回数分、受けた弱化効果を無効化する' },
    { featureId: 'status_effect:weakening_avoid:busei', label: '弱化効果回避[武聖]', statusEffectName: '弱化効果回避[武聖]', sourceLabel: 'LR関羽（かんう）:技能:武聖', sourcePartType: 'skill', matchedText: '自身1部隊にかかる一部の不利変化を避ける' }
  ], typeFeatures: [
    { featureId: 'skill_effect:weakening_nullify', label: '弱化予防', sourceLabel: 'LR関羽（かんう）:戦法:神武威顕', sourcePartType: 'tactic', matchedText: longTacticText }
  ] },
  { category: 'generals', name: '華佗', statusEffectRefs: [
    { featureId: 'status_effect:weakening_avoid:seisei', label: '弱化効果回避[鎮静]', statusEffectName: '弱化効果回避[鎮静]', sourceLabel: '華佗（かだ）:技能:鎮静', sourcePartType: 'skill', matchedText: '弱化効果を5%の確率で避ける（他技能と合算）Ⅱ' }
  ], typeFeatures: [] }
] };
const context = {
  console, require, setTimeout, clearTimeout, fetch: undefined, window: null,
  state: { generals: [{ name: 'LR関羽' }, { name: '華佗' }], equipments: [], derivedData: { typeSearchPresets: { items: presets }, typeSearchFeatureIndex: featureIndex }, diagnostics: {}, typeSearchCacheStats: { hit: 0, miss: 0, invalidations: 0, store: 0 } },
  debugLog() {}, debugTimestamp() { return '2026-07-04T00:00:00.000Z'; }, norm, normalizeSaveItemName: norm, esc,
  safeCloneForDebug(value) { return JSON.parse(JSON.stringify(value)); }, effectSignedValue(effect) { return `${effect?.sign || '+'}${effect?.value ?? ''}${effect?.unit || ''}`; },
  isResponsiveMobileMode() { return false; }, PARAM_DISPLAY_GROUP_ORDER: ['能力'], PARAM_GROUPS: [{ keys: ['弱化無効'] }],
  timingLabel(value) { return value; }, parameterDisplayName(value) { return value; }, getParameterDefaultUnit(key, unit) { return unit || '%'; }, formatFormationParameterNumber(value) { return String(Number(value) || 0); }, formationParameterDisplayValue(key, value) { return `${value?.sign || '+'}${value?.maxTotal ?? value?.value ?? ''}${value?.unit || ''}`; },
  getItemDisplayName(item) { return item?.name || ''; }, detailCategory(item) { return item?.category || 'generals'; }, localStorage: { getItem() { return null; }, setItem() {} }, document: { getElementById() { return null; } }, els: {}, performance: { now: () => 0 }, requestAnimationFrame(callback) { callback(); }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('hado_type_score.js','utf8'), context, { filename: 'hado_type_score.js' });
vm.runInContext(fs.readFileSync('hado_formation.js','utf8'), context, { filename: 'hado_formation.js' });
const formation = { id: 'dedup-calm', name: '新規部隊3', evaluationTypeId: 'calm', evaluationTypeName: '鎮静型', slots: { main: { general: 'LR関羽' }, deputy1: {}, deputy2: {}, support1: { general: '華佗' }, support2: {} }, advisorSlots: {} };
const built = context.buildFormationScoreEvidence(formation, { effects: [], parameterCalculation: { rows: [] } });
assert(built.dedupedRows.length >= 1, '名称行と説明行の重複をdedupedRowsへ残す');
const nullifyEvidence = built.scoreEvidence.filter(row => row.effectFamily === 'weakening_nullify' && row.sourceName.includes('LR関羽') && row.primaryResolved !== false);
assert.strictEqual(nullifyEvidence.length, 1, 'LR関羽の弱化効果無効は名称・説明を1根拠に統合する');
assert(nullifyEvidence[0].rawText.includes('効果回数分、受けた弱化効果を無効化する'), '統合後の原文は説明文を優先する');
assert(Number(nullifyEvidence[0].duplicateSuppressedCount || 0) >= 1, '統合後の根拠にduplicateSuppressedCountを出す');
assert(nullifyEvidence[0].rootEvidenceKey && nullifyEvidence[0].rootStatusEffectName === '弱化無効', 'rootEvidenceKey/rootStatusEffectNameを保持する');
const derivedLong = built.scoreEvidence.find(row => row.sourceOrigin === 'typeSearchFeatureIndex.typeFeatures' && row.rawText.includes('戦法全文'));
assert(derivedLong && derivedLong.isDerivedTag && derivedLong.isAggregateMetric && derivedLong.primaryResolved === false, 'typeFeaturesの長文派生特徴は直接加点しない印を付ける');
const score = context.window.HadoTypeScore.score({ roleId: 'formation_effects', scoreEvidence: built.scoreEvidence }, rules.find(rule => rule.typeId === 'calm'));
const calm1 = score.breakdown.find(row => (row.metricKey || row.scoreMetricId) === 'calm_1');
assert.strictEqual(Number(calm1.confirmedValue || calm1.score || 0), 3, 'calm_1 / 弱化予防はLR関羽 nullify、武聖、華佗 鎮静の3点にする');
assert(calm1.rows.some(row => row.changeItemId === 'weakening_avoid' && row.label.includes('武聖')), '武聖の弱化効果回避は残す');
assert(calm1.rows.some(row => row.changeItemId === 'weakening_avoid' && row.label.includes('鎮静')), '華佗・鎮静の弱化効果回避は残す');
assert(score.excludedRows.some(row => row.sourceOrigin === 'typeSearchFeatureIndex.typeFeatures' && row.excludeReason === 'aggregate_or_derived_origin'), 'typeFeatures長文派生特徴はbridgeで除外診断に残す');
assert.strictEqual(score.runtimeBridge.usedFallback, false, '判定表ブリッジを維持する');
context.calculateFormationTypeScore(formation, { effects: [], parameterCalculation: { rows: [] } });
assert(context.state.diagnostics.typeScore.scoreEvidenceDuplicateSuppressedCount >= 1, '診断にduplicateSuppressedCountを出す');
assert(context.state.diagnostics.typeScore.scoreEvidenceDedupedRows.length >= 1, '診断にdedupedRowsを出す');
console.log('Update09.5.34 score evidence root-effect dedup tests passed');
