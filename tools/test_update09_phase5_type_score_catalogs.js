#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DOC = path.join(ROOT, 'docs', 'updates', 'update09');
const read = f => JSON.parse(fs.readFileSync(path.join(DOC, f), 'utf8'));
const change = read('hadou_effect_change_item_catalog.draft.json').items;
const tableDoc = read('hadou_type_score_judgement_table.v2.draft.json');
const table = tableDoc.items;
function assert(cond,msg){ if(!cond) throw new Error(msg); }
const requiredChangeItems = ['attack_up','defense_up','intelligence_up','tactic_power_up','normal_attack_power_up','anti_object_up','critical_rate_up','critical_power_up','critical_tactic_rate_up','critical_tactic_power_up','attack_speed_up','normal_attack_target_count_up','range_up','tactic_speed','tactic_reduction','initial_tactic_gauge','combat_start_tactic_gauge','tactic_gauge','chain_rate','damage_reduction','attribute_resistance','healing','wounded_recovery','wounded_survival','annihilation_avoidance','remaining_troops','weakening_nullify','weakening_remove','weakening_avoid','status_nullify','status_remove','severance_counter','isolation_counter','chain_nullify_counter','control_counter','buff_protection','enemy_attack_down','enemy_defense_down','enemy_anti_object_down','tactic_delay','chain_nullify_to_enemy','confuse','fear','severance','isolation','effect_duration','ally_target_count'];
const changeIds = new Set(change.map(i => i.changeItemId));
requiredChangeItems.forEach(id => assert(changeIds.has(id), `missing change item: ${id}`));
const types = ['calm','zombie','bomb','critical_tactic','critical_normal','tactic_speed','attack_speed','normal_attack','debuff','anti_object','annihilation','buff_support','debuff_interference','wall_defense','garrison_support','vaccine'];
const byType = new Map(types.map(t => [t, table.filter(r => r.typeId === t).sort((a,b)=>a.displayOrder-b.displayOrder)]));
types.forEach(typeId => {
  const rows = byType.get(typeId);
  assert(rows.length === 5, `${typeId} must have five score metrics`);
  assert(rows.map(r => r.displayOrder).join(',') === '1,2,3,4,5', `${typeId} displayOrder must be 1..5`);
  assert(rows.some(r => r.scoreRole === 'P'), `${typeId} has no Primary row`);
  assert(!rows.every(r => r.scoreRole === 'S'), `${typeId} is Support-only`);
  rows.forEach(r => {
    assert(r.scoreMetricLabel && !/^評価[1-5]$/.test(r.scoreMetricLabel), `${typeId} has fallback label`);
    assert(r.dedupePolicy && r.dedupePolicy.includes('evidenceGroupKey'), `${typeId} missing evidenceGroupKey dedupe policy`);
  });
});
assert(byType.get('vaccine').map(r => r.scoreMetricLabel).join('|') === '弱化予防|弱化解除|状態異常対策|連鎖阻害対策|強化保護', 'vaccine five labels mismatch');
const vaccine = byType.get('vaccine');
['defense_up','healing','wounded_recovery','wounded_survival','attribute_resistance','tactic_gauge','tactic_speed','attack_speed_up','tactic_power_up','normal_attack_target_count_up'].forEach(id => assert(vaccine.some(r => r.denyChangeItems.includes(id)), `vaccine missing deny item: ${id}`));
const buffItems = new Set(byType.get('buff_support').flatMap(r => r.changeItems));
['attack_up','defense_up','intelligence_up','tactic_power_up','normal_attack_power_up','attack_speed_up','critical_rate_up','critical_power_up','normal_attack_target_count_up'].forEach(id => assert(buffItems.has(id), `buff_support missing ${id}`));
assert(byType.get('buff_support').some(r => /高評価に(せず|しない)/.test(r.dependency)), 'buff_support missing support cap dependency');
const debuffItems = new Set(byType.get('debuff_interference').flatMap(r => r.changeItems));
assert(debuffItems.has('enemy_attack_down') && byType.get('debuff_interference').some(r => r.allowedTargets.includes('enemy')), 'debuff_interference primary must target enemy');
assert(byType.get('debuff_interference').some(r => /高評価に(せず|しない)/.test(r.dependency)), 'debuff_interference missing support cap dependency');
assert(byType.get('attack_speed').some(r => r.denyChangeItems.includes('tactic_speed')), 'attack_speed must deny tactic_speed');
assert(byType.get('tactic_speed').some(r => r.denyChangeItems.includes('attack_speed_up')), 'tactic_speed must deny attack_speed_up');
assert(byType.get('critical_normal').some(r => r.denyChangeItems.includes('critical_tactic_rate_up')), 'critical_normal must deny tactic critical');
assert(byType.get('critical_tactic').some(r => r.denyChangeItems.includes('critical_rate_up')), 'critical_tactic must deny normal critical');
assert(tableDoc.rules.some(r => r.includes('selfとallyを全型で機械的に相互許容しない')), 'missing self/ally non-mechanical rule');
assert(tableDoc.rules.some(r => r.includes('unknown対象')), 'missing unknown target rule');
console.log('Update09 Phase5 type score catalog regression tests passed');
