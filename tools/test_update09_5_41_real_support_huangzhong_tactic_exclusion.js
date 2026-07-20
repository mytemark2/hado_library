#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const rules = JSON.parse(fs.readFileSync('hadou_type_score_rules.json','utf8')).items;
const presets = JSON.parse(fs.readFileSync('hadou_type_search_presets.json','utf8')).items;
const featureItems = JSON.parse(fs.readFileSync('hadou_type_search_feature_index.json','utf8')).items;
const norm = value => String(value ?? '').normalize('NFKC').replace(/\s+/g,' ').trim();
const normalizeSaveItemName = value => norm(value).replace(/[（(].*?[）)]/g,'').trim();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pickFeature = name => {
  const target = normalizeSaveItemName(name);
  const entry = featureItems.find(item => [item.name,item.displayName,item.rawName,item.title].map(normalizeSaveItemName).includes(target));
  assert(entry, `feature index entry exists for ${name}`);
  return entry;
};
const featureIndex = { items: [pickFeature('LR関羽'), pickFeature('LR黄忠'), pickFeature('LR関銀屏'), pickFeature('UR夏侯淵'), pickFeature('華佗'), pickFeature('UR張飛')] };
const context = { console, require, setTimeout, clearTimeout, fetch: undefined, window: null, HADO_TYPE_SCORE_RULES: rules,
  state: { generals: [{ name: 'LR関羽' }, { name: 'LR関銀屏' }, { name: 'UR夏侯淵' }, { name: '華佗' }, { name: 'LR黄忠' }, { name: 'UR張飛' }], equipments: [], derivedData: { typeSearchPresets: { items: presets }, typeSearchFeatureIndex: featureIndex }, diagnostics: {}, typeSearchCacheStats: { hit: 0, miss: 0, invalidations: 0, store: 0 } },
  debugLog() {}, debugTimestamp() { return '2026-07-07T00:00:00.000Z'; }, norm, normalizeSaveItemName, esc,
  safeCloneForDebug(value) { return JSON.parse(JSON.stringify(value)); }, effectSignedValue(effect) { return `${effect?.sign || '+'}${effect?.value ?? ''}${effect?.unit || ''}`; },
  isResponsiveMobileMode() { return false; }, PARAM_DISPLAY_GROUP_ORDER: ['能力'], PARAM_GROUPS: [{ keys: ['戦法威力'] }], timingLabel(value) { return value; }, parameterDisplayName(value) { return value; },
  getParameterDefaultUnit(key, unit) { return unit || '%'; }, formatFormationParameterNumber(value) { return String(Number(value) || 0); }, formationParameterDisplayValue(key, value) { return `${value?.sign || '+'}${value?.maxTotal ?? value?.value ?? ''}${value?.unit || ''}`; },
  getItemDisplayName(item) { return item?.name || ''; }, detailCategory(item) { return item?.category || 'generals'; }, localStorage: { getItem() { return null; }, setItem() {} }, document: { getElementById() { return null; } }, els: {}, performance: { now: () => 0 }, requestAnimationFrame(callback) { callback(); }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('hado_type_score.js','utf8'), context, { filename: 'hado_type_score.js' });
vm.runInContext(fs.readFileSync('hado_formation.js','utf8'), context, { filename: 'hado_formation.js' });
const formation = { id: 'formation_mp8ec3h2_053o5x', name: '新規部隊3', formationName: '勇往陣', evaluationTypeId: 'bomb', evaluationTypeName: '爆弾型', slots: { main: { general: 'LR関羽', attendant: 'UR張飛', attendantPosition: '右下', equipments: {} }, deputy1: { general: 'LR関銀屏', equipments: {} }, deputy2: { general: 'UR夏侯淵', equipments: {} }, support1: { general: '華佗', equipments: {} }, support2: { general: 'LR黄忠', equipments: {} } }, advisorSlots: {} };
const built = context.buildFormationScoreEvidence(formation, { effects: [], parameterCalculation: { rows: [] }, selectedTypeId: 'bomb' });
assert.strictEqual(formation.slots.support2.general, 'LR黄忠', 'real export fixture keeps LR黄忠 in support2');
assert(built.scoreEvidence.some(row => row.sourceName === 'LR関羽' && row.sourceSlot === 'main' && row.effectFamily === 'tactic_power_up'), 'main LR関羽 tactic power evidence remains scoreable');
assert(!built.scoreEvidence.some(row => row.sourceName === 'LR黄忠' && row.effectFamily === 'tactic_power_up'), 'support2 LR黄忠 tactic power must not enter scoreEvidence');
assert(!built.scoreEvidence.some(row => row.sourceName === 'LR黄忠' && row.effectFamily === 'tactic_speed' && /発動間隔|連鎖順/.test(String(row.rawText||''))), 'support2 LR黄忠 tactic-text tactic speed must not enter scoreEvidence');
assert(built.scoreEvidence.some(row => row.sourceName === 'LR黄忠' && row.effectFamily === 'tactic_speed' && row.sourceType === 'skill'), 'skill-origin LR黄忠 tactic-speed avoidance remains skill evidence');
assert(built.candidateToScoreMismatches.some(row => row.sourceName === 'LR黄忠' && row.mismatchReason === 'tactic_source_inactive_slot'), 'support2 LR黄忠 tactic-derived evidence is diagnosed as inactive tactic slot');
const bombRule = rules.find(rule => rule.typeId === 'bomb');
const score = context.window.HadoTypeScore.tableBridgeScore({ scoreEvidence: built.scoreEvidence }, bombRule);
const tacticPower = score.breakdown.find(row => row.label === '戦法威力');
assert(tacticPower, 'bomb tactic power metric exists');
assert(tacticPower.rows.some(row => row.sourceName === 'LR関羽'), 'score keeps main LR関羽 tactic power evidence');
assert(!tacticPower.rows.some(row => row.sourceName === 'LR黄忠'), 'score excludes support2 LR黄忠 tactic power evidence');
console.log('Update09.5.41 real support LR黄忠 tactic exclusion test passed');
