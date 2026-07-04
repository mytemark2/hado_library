#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const rules = JSON.parse(fs.readFileSync('hadou_type_score_rules.json','utf8')).items;
const presets = JSON.parse(fs.readFileSync('hadou_type_search_presets.json','utf8')).items;
const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const featureIndex = { items: [{ category: 'generals', name: '華佗', statusEffectRefs: [
  { featureId: 'status_effect:weakening_avoid:seisei', label: '弱化効果回避[鎮静]', statusEffectName: '弱化効果回避[鎮静]', sourceLabel: '華佗:技能:鎮静Ⅰ', sourcePartType: 'skill', matchedText: '弱化効果を5%の確率で避ける（他技能と合算）' }
], typeFeatures: [
  { featureId: 'type_feature:calm:weakening_guard', label: '弱化予防', sourceLabel: '華佗:技能:鎮静Ⅰ', sourcePartType: 'skill', matchedText: '弱化効果を5%の確率で避ける（他技能と合算）' }
] }] };
const debugEvents = [];
const context = {
  console, require, setTimeout, clearTimeout, fetch: undefined, window: null,
  state: { generals: [{ name: '華佗' }], equipments: [], derivedData: { typeSearchPresets: { items: presets }, typeSearchFeatureIndex: featureIndex }, diagnostics: {}, typeSearchCacheStats: { hit: 0, miss: 0, invalidations: 0, store: 0 }, formationScoreDetailIndex: 0, formationScoreEvidenceDialogOpen: true },
  debugLog(name, data) { debugEvents.push({ name, data }); }, debugTimestamp() { return '2026-07-04T00:00:00.000Z'; }, norm, normalizeSaveItemName: norm, esc,
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
assert.strictEqual(context.window.HadoTypeScore.changeItemDisplayLabel('weakening_nullify'), '弱化効果無効');
assert.strictEqual(context.window.HadoTypeScore.changeItemDisplayLabel('weakening_avoid'), '弱化効果回避');
assert.strictEqual(context.window.HadoTypeScore.changeItemDisplayLabel('weakening_remove'), '弱化効果解除');
assert.strictEqual(context.window.HadoTypeScore.changeItemDisplayLabel('buff_protection'), '強化解除・奪取対策');
const formation = { id: 'huatuo-display', name: '新規部隊3', evaluationTypeId: 'calm', evaluationTypeName: '鎮静型', slots: { support1: { general: '華佗' } }, advisorSlots: {} };
const built = context.buildFormationScoreEvidence(formation, { effects: [], parameterCalculation: { rows: [] } });
const score = context.window.HadoTypeScore.score({ roleId: 'formation_effects', scoreEvidence: built.scoreEvidence }, rules.find(rule => rule.typeId === 'calm'));
const weakGuard = score.breakdown.find(row => (row.scoreMetricId || row.metricKey) === 'calm_1');
assert(weakGuard && weakGuard.rows && weakGuard.rows.length >= 1, 'calm_1 / 弱化予防に華佗・鎮静の根拠が入る');
assert.strictEqual(weakGuard.rows[0].changeItemId, 'weakening_avoid', '内部changeItemIdは維持する');
assert.strictEqual(weakGuard.rows[0].changeItemDisplayLabel, '弱化効果回避［鎮静］', '標準効果名は角括弧つきで表示する');
assert.strictEqual(weakGuard.rows[0].displayCategory, '弱化予防', '評価項目名と標準効果名を分ける');
const tags = context.window.HadoTypeTags.tagList({ roleId: 'formation_effects', scoreEvidence: built.scoreEvidence }, rules.find(rule => rule.typeId === 'calm'), score);
assert(tags.some(tag => tag.kindLabel === '中核' && tag.label === '弱化予防'), '型候補一覧用タグに評価項目名を出す');
assert(tags.some(tag => tag.kindLabel === '根拠' && tag.label === '弱化効果回避［鎮静］'), '型候補一覧用タグに標準効果名を根拠として出す');
assert(!tags.some(tag => tag.kindLabel === '状態変化' && tag.label === '弱化解除'), '根拠を状態変化/弱化解除として混同しない');
const details = context.buildFormationScoreDetails(weakGuard);
assert(details.some(row => row.label === '弱化効果回避［鎮静］' && row.displayCategory === '弱化予防' && row.rawEffectText.includes('弱化効果を5%の確率で避ける')), '詳細は評価項目・標準効果名・原文を分ける');
const displayRows = context.normalizeFormationScoreDisplayRows([{ label: '弱化予防', score: 1, scoreDetails: details }]);
const summaryHtml = context.renderFormationScoreEvidencePanelHtml(displayRows[0]);
assert(summaryHtml.includes('弱化効果回避［鎮静］'), '評価スコア詳細の簡略表示に標準効果名を出す');
assert(!summaryHtml.includes('弱化回避'), '短縮表示「弱化回避」は出さない');
const dialogHtml = context.renderFormationScoreEvidenceDialogHtml(displayRows[0]);
assert(dialogHtml.includes('対象: 自部隊'), '詳細1行目には対象を出す');
assert(dialogHtml.includes('根拠: 華佗 / 技能'), '詳細1行目には誰の何かを出す');
assert(dialogHtml.includes('formation-score-evidence-line-raw') && dialogHtml.includes('原文:') && dialogHtml.includes('弱化効果を5%の確率で避ける'), '詳細2行目には原文根拠を出す');
const relatedSource = fs.readFileSync('hado_status_effects.js','utf8');
assert(relatedSource.includes('countermeasureRelatedDisplayCategory'), '関連リンクにも評価カテゴリ表示関数を持つ');
assert(relatedSource.includes('弱化予防') && relatedSource.includes('弱化効果回避'), '関連リンク表示も弱化予防: 弱化効果回避へ正規化できる');
console.log('Update09.5.29 disadvantage display label normalization tests passed');
