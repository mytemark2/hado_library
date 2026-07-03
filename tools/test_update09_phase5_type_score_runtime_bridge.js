#!/usr/bin/env node
'use strict';
global.window = {};
require('../hado_type_score.js');
const S = window.HadoTypeScore;
function assert(cond, msg){ if(!cond) throw new Error(msg); }
function assertEq(actual, expected, msg){ if(actual !== expected) throw new Error(`${msg}: expected ${expected}, actual ${actual}`); }
const vaccineRule = { typeId: 'vaccine', typeName: 'ワクチン型', metrics: [{ metricKey: 'legacy', label: 'legacy' }] };
const buffRule = { typeId: 'buff_support', typeName: 'バフ支援型', metrics: [{ metricKey: 'legacy', label: 'legacy' }] };
const legacyRule = { typeId: 'attack_speed', typeName: '攻撃速度型', metrics: [{ metricKey: 'attack_speed', label: '攻撃速度' }] };
const ev = (effectFamily, targetScope, extra = {}) => Object.assign({
  evidenceId: `${effectFamily}:${targetScope}:${extra.sourceId || 'src'}`,
  sourceType: 'skill',
  sourceId: extra.sourceId || `${effectFamily}-src`,
  sourceLabel: extra.sourceLabel || '検証技能',
  timing: 'always',
  targetScope,
  effectFamily,
  isPrimaryEffect: true,
  isDerivedTag: false,
  isAggregateMetric: false,
  evidenceGroupKey: extra.evidenceGroupKey || `${extra.sourceId || effectFamily}|${targetScope}|${effectFamily}`,
  rawText: extra.rawText || effectFamily
}, extra);
const primaryRows = result => result.breakdown.flatMap(m => m.rows || []).filter(r => r.scoreRole === 'P');
const excludedReasons = result => result.excludedRows.map(r => `${r.changeItemId}:${r.excludeReason}`);
let result = S.score({ scoreEvidence: [
  ev('weakening_nullify','self'), ev('weakening_remove','ally'), ev('status_nullify','self'), ev('severance_counter','self'), ev('isolation_counter','self'), ev('chain_nullify_counter','self')
]}, vaccineRule);
assert(result.runtimeBridge && result.runtimeBridge.typeId === 'vaccine', 'vaccine uses runtime bridge');
['weakening_nullify','weakening_remove','status_nullify','severance_counter','isolation_counter','chain_nullify_counter'].forEach(id => assert(primaryRows(result).some(r => r.changeItemId === id), `vaccine primary ${id}`));
result = S.score({ scoreEvidence: [
  ev('defense_up','self'), ev('healing','self'), ev('wounded_recovery','ally'), ev('wounded_survival','self'), ev('attribute_resistance','self'), ev('tactic_gauge','self'), ev('tactic_speed','self'), ev('attack_speed_up','self'), ev('tactic_power_up','self'), ev('normal_attack_target_count_up','self'), ev('weakening_nullify','enemy'), ev('weakening_remove','unknown')
]}, vaccineRule);
['defense_up','healing','wounded_recovery','wounded_survival','attribute_resistance','tactic_gauge','tactic_speed','attack_speed_up','tactic_power_up','normal_attack_target_count_up'].forEach(id => assert(excludedReasons(result).includes(`${id}:deny_change_item`), `vaccine deny ${id}`));
assert(excludedReasons(result).includes('weakening_nullify:target_not_allowed'), 'vaccine excludes enemy target');
assert(excludedReasons(result).includes('weakening_remove:unknown_target_for_target_dependent_type'), 'vaccine excludes unknown target');
result = S.score({ scoreEvidence: [
  ev('weakening_nullify','self',{ evidenceGroupKey: 'same-origin', rawText: '弱化無効' }),
  ev('weakening_nullify','self',{ evidenceGroupKey: 'same-origin', rawText: '弱化効果無効' })
]}, vaccineRule);
assertEq(primaryRows(result).filter(r => r.changeItemId === 'weakening_nullify').length, 1, 'vaccine alias dedupe');
assert(excludedReasons(result).includes('weakening_nullify:duplicate_evidence'), 'vaccine duplicate reason');
result = S.score({ scoreEvidence: [
  ev('attack_up','ally'), ev('defense_up','ally'), ev('intelligence_up','ally'), ev('tactic_power_up','ally'), ev('normal_attack_power_up','ally'), ev('attack_speed_up','ally'), ev('critical_rate_up','ally'), ev('critical_power_up','ally'), ev('normal_attack_target_count_up','ally')
]}, buffRule);
assert(result.runtimeBridge && result.runtimeBridge.typeId === 'buff_support', 'buff_support uses runtime bridge');
['attack_up','defense_up','intelligence_up','tactic_power_up','normal_attack_power_up','attack_speed_up','critical_rate_up','critical_power_up','normal_attack_target_count_up'].forEach(id => assert(primaryRows(result).some(r => r.changeItemId === id), `buff primary ${id}`));
assert(!primaryRows(result).some(r => r.changeItemId === 'tactic_speed'), 'tactic_speed is not buff primary');
assert(!primaryRows(result).some(r => r.changeItemId === 'critical_tactic_rate_up'), 'critical_tactic_rate_up is not normal critical');
result = S.score({ scoreEvidence: [ev('attack_up','self')] }, buffRule);
assert(primaryRows(result)[0].point < 1, 'buff self primary is lower than ally distribution');
for (const family of ['tactic_speed','initial_tactic_gauge','ally_target_count']) {
  result = S.score({ scoreEvidence: [ev(family,'ally')] }, buffRule);
  assertEq(result.conditionalMaxScore, 0, `${family} alone is not high score`);
  assert(excludedReasons(result).includes(`${family}:support_without_primary`), `${family} support_without_primary`);
}
result = S.score({ scoreEvidence: [ev('attack_up','enemy'), ev('defense_up','unknown')] }, buffRule);
assert(excludedReasons(result).includes('attack_up:target_not_allowed'), 'buff excludes enemy target');
assert(excludedReasons(result).includes('defense_up:unknown_target_for_target_dependent_type'), 'buff excludes unknown target');
result = S.score({ scoreEvidence: [ev('attack_up','ally',{ evidenceGroupKey: 'same-buff', rawText: '攻撃上昇' }), ev('attack_up','ally',{ evidenceGroupKey: 'same-buff', rawText: '攻撃を上昇' })] }, buffRule);
assertEq(primaryRows(result).filter(r => r.changeItemId === 'attack_up').length, 1, 'buff alias dedupe');
assert(excludedReasons(result).includes('attack_up:duplicate_evidence'), 'buff duplicate reason');
result = S.score({ scoreEvidence: [ev('attack_speed_up','ally'), ev('tactic_speed','ally'), ev('critical_rate_up','ally'), ev('critical_tactic_rate_up','ally'), ev('critical_power_up','ally'), ev('critical_tactic_power_up','ally')] }, buffRule);
assert(primaryRows(result).some(r => r.changeItemId === 'attack_speed_up'), 'attack_speed_up primary');
assert(!primaryRows(result).some(r => r.changeItemId === 'tactic_speed'), 'tactic_speed not confused with attack_speed_up');
assert(primaryRows(result).some(r => r.changeItemId === 'critical_rate_up'), 'critical_rate_up primary');
assert(!primaryRows(result).some(r => r.changeItemId === 'critical_tactic_rate_up'), 'critical_tactic_rate_up not confused with critical_rate_up');
assert(primaryRows(result).some(r => r.changeItemId === 'critical_power_up'), 'critical_power_up primary');
assert(!primaryRows(result).some(r => r.changeItemId === 'critical_tactic_power_up'), 'critical_tactic_power_up not confused with critical_power_up');
const legacy = S.score({ typeFeatures: [{ featureId: 'skill_effect:attack_speed', label: '攻撃速度', matchedText: '自部隊の攻撃速度+25%' }] }, legacyRule);
assert(!legacy.runtimeBridge, 'non-target type keeps existing logic');
assertEq(legacy.matchedCount, 1, 'legacy type still scores');
console.log('Update09 Phase5 type score runtime bridge tests passed');
