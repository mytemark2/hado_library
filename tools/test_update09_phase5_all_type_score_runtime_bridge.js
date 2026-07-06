#!/usr/bin/env node
'use strict';
const assert = require('assert');
global.window = {};
require('../hado_type_score.js');
const S = window.HadoTypeScore;
const types = ['calm','zombie','bomb','critical_tactic','critical_normal','tactic_speed','attack_speed','normal_attack','debuff','anti_object','annihilation','buff_support','debuff_interference','wall_defense','garrison_support','vaccine'];
const rowsByType = typeId => S.BRIDGE_ROWS.filter(row => row.typeId === typeId).sort((a,b) => a.displayOrder - b.displayOrder);
const ev = (changeItemId, targetScope, extra = {}) => ({
  evidenceId: `${changeItemId}:${targetScope}:${extra.suffix || 'src'}`,
  sourceType: extra.sourceType || 'skill',
  sourceId: extra.sourceId || `${changeItemId}-src`,
  sourceLabel: extra.sourceLabel || '全型検証根拠',
  timing: extra.timing || 'always',
  targetScope,
  effectFamily: changeItemId,
  rawText: extra.rawText || changeItemId,
  matchedText: extra.matchedText || extra.rawText || changeItemId,
  isPrimaryEffect: extra.isPrimaryEffect !== false,
  isDerivedTag: !!extra.isDerivedTag,
  isAggregateMetric: !!extra.isAggregateMetric,
  evidenceGroupKey: extra.evidenceGroupKey || `${changeItemId}|${targetScope}|${extra.suffix || 'src'}`
});
const rule = typeId => ({ typeId, typeName: rowsByType(typeId)[0].typeName, metrics: [{ metricKey: 'legacy', label: 'legacy' }] });
const targetFor = row => (row.allowedTargets || []).includes('ally') ? 'ally' : ((row.allowedTargets || [])[0] || 'self');
for (const typeId of types) {
  const rows = rowsByType(typeId);
  const evidence = rows.map((row, index) => ev(row.changeItems[0], targetFor(row), { suffix: String(index) }));
  const direct = S.tableBridgeScore({ scoreEvidence: evidence }, rule(typeId));
  assert(direct, `${typeId} tableBridgeScore must not return null`);
  assert.strictEqual(direct.breakdown.length, 5, `${typeId} direct bridge must return five metrics`);
  assert.strictEqual(direct.totalScore, 5, `${typeId} direct bridge must score five matching evidence rows`);
  assert.strictEqual(direct.matchedCount, 5, `${typeId} direct bridge matchedCount must be five`);
  assert.strictEqual(direct.runtimeBridge.usedFallback, false, `${typeId} direct bridge must not use fallback`);
  const viaScore = S.score({ scoreEvidence: evidence }, rule(typeId));
  assert(viaScore.runtimeBridge && viaScore.runtimeBridge.typeId === typeId, `${typeId} score() must use bridge`);
  assert.strictEqual(viaScore.breakdown.length, 5, `${typeId} score() must return five metrics`);
  assert.strictEqual(viaScore.totalScore, 5, `${typeId} score() must total five`);
}
for (const typeId of types) {
  const zero = S.score({ scoreEvidence: [] }, rule(typeId));
  assert(zero.runtimeBridge && zero.runtimeBridge.typeId === typeId, `${typeId} zero case must still use bridge`);
  assert.strictEqual(zero.breakdown.length, 5, `${typeId} zero case must return five metrics`);
  assert.strictEqual(zero.totalScore, 0, `${typeId} zero case must remain zero`);
  zero.breakdown.forEach(row => assert(row.label && !/^評価[1-5]$/.test(row.label), `${typeId} zero row must have user-facing label`));
}
const excludedReasons = result => result.excludedRows.map(row => `${row.changeItemId}:${row.excludeReason}`);
let result = S.score({ scoreEvidence: ['defense_up','healing','wounded_recovery','wounded_survival','attribute_resistance','tactic_gauge','tactic_speed','attack_speed_up','tactic_power_up','normal_attack_target_count_up'].map(id => ev(id, 'self')) }, rule('vaccine'));
['defense_up','healing','wounded_recovery','wounded_survival','attribute_resistance','tactic_gauge','tactic_speed','attack_speed_up','tactic_power_up','normal_attack_target_count_up'].forEach(id => assert(excludedReasons(result).includes(`${id}:deny_change_item`), `vaccine must deny ${id}`));
assert.strictEqual(result.totalScore, 0, 'vaccine deny-only input must not score');
result = S.score({ scoreEvidence: [ev('tactic_speed','self')] }, rule('attack_speed'));
assert(excludedReasons(result).includes('tactic_speed:deny_change_item'), 'attack_speed must deny tactic_speed');
assert.strictEqual(result.totalScore, 0, 'attack_speed must not score tactic_speed');
result = S.score({ scoreEvidence: [ev('attack_speed_up','self')] }, rule('tactic_speed'));
assert(excludedReasons(result).includes('attack_speed_up:deny_change_item'), 'tactic_speed must deny attack_speed_up');
assert.strictEqual(result.totalScore, 0, 'tactic_speed must not score attack_speed_up');
result = S.score({ scoreEvidence: [ev('critical_tactic_rate_up','self')] }, rule('critical_normal'));
assert(excludedReasons(result).includes('critical_tactic_rate_up:deny_change_item'), 'critical_normal must deny tactic critical');
result = S.score({ scoreEvidence: [ev('critical_rate_up','self')] }, rule('critical_tactic'));
assert(excludedReasons(result).includes('critical_rate_up:deny_change_item'), 'critical_tactic must deny normal critical');
result = S.score({ scoreEvidence: [ev('attack_up','enemy')] }, rule('buff_support'));
assert(excludedReasons(result).includes('attack_up:target_not_allowed'), 'ally/self type must exclude enemy target');
result = S.score({ scoreEvidence: [ev('enemy_attack_down','self')] }, rule('debuff'));
assert(excludedReasons(result).includes('enemy_attack_down:target_not_allowed'), 'enemy interference type must exclude self target');
result = S.score({ scoreEvidence: [ev('attack_up','unknown')] }, rule('buff_support'));
assert(excludedReasons(result).includes('attack_up:unknown_target_for_target_dependent_type'), 'unknown target must be excluded');
result = S.score({ scoreEvidence: [ev('attack_up','ally',{ isAggregateMetric: true, suffix: 'aggregate' }), ev('attack_up','ally',{ isDerivedTag: true, suffix: 'derived' })] }, rule('buff_support'));
assert(excludedReasons(result).includes('attack_up:aggregate_or_derived_origin'), 'aggregate/derived evidence must be excluded');
assert.strictEqual(result.totalScore, 0, 'aggregate/derived evidence must not score');
result = S.score({ scoreEvidence: [ev('weakening_nullify','self',{ evidenceGroupKey: 'same-origin', rawText: '弱化無効' }), ev('weakening_nullify','self',{ evidenceGroupKey: 'same-origin', rawText: '弱化効果無効', suffix: 'alias' })] }, rule('vaccine'));
assert.strictEqual(result.breakdown.flatMap(row => row.rows || []).filter(row => row.changeItemId === 'weakening_nullify').length, 1, 'same evidenceGroupKey must score once');
assert(excludedReasons(result).includes('weakening_nullify:duplicate_evidence'), 'duplicate evidence must be excluded');
result = S.score({ scoreEvidence: [ev('weakening_nullify','self'), ev('status_nullify','self',{ suffix: 'status' })] }, rule('vaccine'));
const byLabel = new Map(result.breakdown.map(row => [row.label, row]));
assert(byLabel.get('弱化予防').rows.some(row => row.changeItemId === 'weakening_nullify'), 'weakening_nullify must score in 弱化予防');
assert(byLabel.get('状態異常対策').rows.some(row => row.changeItemId === 'status_nullify'), 'status_nullify must score in 状態異常対策');
console.log('Update09 Phase5 all-type runtime bridge tests passed');
