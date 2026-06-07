/* HADO app 3.0.0.0 Update07: shared 10-step type suitability scoring */
(()=>{'use strict';
const METRIC_ALIASES={
  troops:['兵力'],tactic_power:['戦法威力'],critical_tactic_power:['撃心威力'],critical_power:['会心威力'],attack_speed:['攻撃速度'],critical_rate:['会心発生','会心発生率'],critical_tactic_rate:['撃心発生','撃心発生率'],normal_attack_power:['通常攻撃威力'],normal_attack_target_count:['通常攻撃対象数','通常攻撃対象部隊数'],range:['射程'],anti_object:['対物特効'],tactic_speed:['戦法速度'],weakening_nullify:['弱化無効','弱化効果無効'],weakening_remove:['弱化解除','弱化効果解除'],strengthening_remove_avoid:['強化解除回避'],strengthening_seize_avoid:['強化奪取回避'],annihilation_avoidance:['壊滅回避'],remaining_troops:['残存兵力'],wounded_recovery:['負傷兵回復','兵力回復'],damage_reduction:['被ダメージ軽減'],tactic_reduction:['戦法短縮'],initial_tactic_gauge:['出陣時戦法ゲージ'],chain_rate:['連鎖率','連鎖確率'],status_effect_rate:['状態変化発生率'],tactic_delay:['戦法遅延'],chain_nullify:['連鎖無効'],enemy_attack_debuff:['敵部隊攻撃低下'],enemy_defense_debuff:['敵部隊防御低下'],ally_buff_multi:['味方バフ配布'],ally_target_count:['味方対象部隊数'],effect_duration:['効果時間'],enemy_debuff_multi:['敵デバフ配布'],enemy_target_count:['敵対象部隊数'],enemy_anti_object_debuff:['敵部隊対物特効低下','対物特効低下'],ally_wounded_recovery:['味方負傷兵回復'],ally_defense_buff:['味方防御上昇'],combat_start_tactic_gauge:['交戦開始時戦法ゲージ'],self_disadvantage_countermeasure:['自部隊不利対策','skill_effect:self_disadvantage_countermeasure'],ally_non_damage_effect:['味方非ダメージ効果','skill_effect:ally_non_damage_effect']
};
const norm=s=>String(s??'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const flat=v=>Array.isArray(v)?v.map(flat).join(' '):(v&&typeof v==='object'?Object.values(v).map(flat).join(' '):String(v??''));
const uniq=a=>[...new Set(a.filter(Boolean))];
function aliases(metric){return uniq([metric?.label,...(METRIC_ALIASES[metric?.metricKey]||[])]).map(norm).filter(Boolean)}
function segments(entity){return uniq([...(entity?.typeFeatures||[]),...(entity?.statusEffectRefs||[])].map(v=>norm(flat(v))).filter(Boolean))}
function metricMatched(entity,metric){const as=aliases(metric),ss=segments(entity);return Boolean(as.length&&ss.some(s=>as.some(a=>s.includes(a))))}
function score(entity,rule){const metrics=Array.isArray(rule?.metrics)?rule.metrics.slice(0,5):[];const matched=metrics.filter(m=>metricMatched(entity,m));const total=5;return{score:Math.min(10,matched.length*2),matched,total,matchedCount:matched.length};}
function label(result){return `${Number(result?.score||0)}/10`;}
window.HadoTypeScore={METRIC_ALIASES,metricMatched,score,label};
})();
