/* HADO app 3.0.0.0 Update09.3.4: count-based type scoring with optional bulk trace suspension */
(()=>{'use strict';
const METRIC_ALIASES={
  troops:['兵力'],
  tactic_power:['戦法威力'],
  critical_tactic_power:['撃心威力'],
  critical_power:['会心威力'],
  attack_speed:['攻撃速度'],
  critical_rate:['会心発生','会心発生率'],
  critical_tactic_rate:['撃心発生','撃心発生率'],
  normal_attack_power:['通常攻撃威力'],
  normal_attack_target_count:['通常攻撃対象数','通常攻撃対象部隊数'],
  range:['射程'],
  anti_object:['対物特効'],
  tactic_speed:['戦法速度'],
  weakening_nullify:['弱化無効','弱化効果無効','状態変化無効','弱化回避','弱化効果回避','不利変化無効'],
  weakening_remove:['弱化解除','弱化効果解除','弱化回復','弱化効果を解除'],
  strengthening_remove_avoid:['強化解除回避'],
  strengthening_seize_avoid:['強化奪取回避'],
  annihilation_avoidance:['壊滅回避'],
  remaining_troops:['残存兵力'],
  wounded_recovery:['負傷兵回復','兵力回復','負傷兵を最大兵力','負傷兵を回復'],
  damage_reduction:['被ダメージ軽減'],
  tactic_reduction:['戦法短縮'],
  initial_tactic_gauge:['出陣時戦法ゲージ'],
  chain_rate:['連鎖率','連鎖確率'],
  status_effect_rate:['状態変化発生率'],
  tactic_delay:['戦法遅延'],
  chain_nullify:['連鎖無効'],
  enemy_attack_debuff:['敵部隊攻撃低下'],
  enemy_defense_debuff:['敵部隊防御低下'],
  ally_buff_multi:['味方バフ配布'],
  ally_target_count:['味方対象部隊数'],
  effect_duration:['効果時間'],
  enemy_debuff_multi:['敵デバフ配布'],
  enemy_target_count:['敵対象部隊数'],
  enemy_anti_object_debuff:['敵部隊対物特効低下','対物特効低下'],
  ally_wounded_recovery:['味方負傷兵回復','負傷兵回復','兵力回復','負傷兵を最大兵力','負傷兵を回復'],
  ally_defense_buff:['味方防御上昇'],
  combat_start_tactic_gauge:['交戦開始時戦法ゲージ'],
  self_disadvantage_countermeasure:['自部隊不利対策','弱化無効','弱化効果無効','弱化解除','弱化効果解除','状態変化無効','弱化回避','弱化効果回避','弱化反射','弱化効果反射','会心無効','撃心無効','不利変化無効'],
  ally_non_damage_effect:['味方非ダメージ効果','味方バフ','味方支援','自身を含む味方','部隊の攻撃','部隊の防御','部隊の知力','部隊の機動','部隊の兵力','攻撃速度','戦法速度','戦法ゲージ','会心発生','会心威力','連鎖確率','連鎖率','通常攻撃対象数','通常攻撃対象部隊数','射程','負傷兵回復','負傷兵生存']
};
const FEATURE_ID_ALIASES={wounded_recovery:['skill_effect:healing'],chain_rate:['skill_effect:chain_rate'],troops:['parameter:troops']};
const GENERAL_ROLES=new Set(['main_general','vice_general','support_general','attendant']);
const norm=s=>String(s??'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const flat=v=>Array.isArray(v)?v.map(flat).join(' '):(v&&typeof v==='object'?Object.values(v).map(flat).join(' '):String(v??''));
const uniq=a=>[...new Set(a.filter(Boolean))];
const cleanMinus=s=>String(s??'').replace(/[−₋－―ー]/g,'-').replace(/＋/g,'+').replace(/％/g,'%');
function aliases(metric){return uniq([metric?.label,...(METRIC_ALIASES[metric?.metricKey]||[])]).map(norm).filter(Boolean)}
function expectedIds(metric){const k=metric?.metricKey||'';return uniq([`parameter:${k}`,`skill_effect:${k}`,...(FEATURE_ID_ALIASES[k]||[])])}
function featureRows(entity){return [...(entity?.typeFeatures||[]),...(entity?.statusEffectRefs||[])].filter(Boolean)}
function rowText(row){return flat([row?.label,row?.statusEffectName,row?.featureId,row?.matchedText])}
function splitClauses(text){return String(text||'').split(/(?<=[。．.!?！？])|[\n\r]+|(?=■|▼|●)/).map(v=>v.trim()).filter(Boolean)}
function roleAllowedSet(text){
  const raw=String(text||''),n=norm(raw),allowed=new Set();
  const hasCombinedViceSupport=/副将(?:か|または|\/|・)?補佐|補佐(?:か|または|\/|・)?副将/.test(raw);
  if(hasCombinedViceSupport){allowed.add('vice_general');allowed.add('support_general')}
  if(/(?:自身|この武将|この技能を持つ武将|装備者|自部隊)?が?主将(?:の際|時|の場合|で|として|に編制)|主将時|■主将/.test(raw))allowed.add('main_general');
  if(/副将(?:の際|時|の場合|で|として|に編制|の連鎖確率)|副将時|■副将/.test(raw))allowed.add('vice_general');
  if(/補佐(?:の際|時|の場合|で|として|に編制)|補佐時|■補佐/.test(raw))allowed.add('support_general');
  if(/侍従(?:の際|時|の場合|で|として|に編制)|侍従時|■侍従/.test(raw))allowed.add('attendant');
  if(!allowed.size&&/(^|[^自])主将限定/.test(n))allowed.add('main_general');
  if(!allowed.size&&/副将限定/.test(n))allowed.add('vice_general');
  if(!allowed.size&&/補佐限定/.test(n))allowed.add('support_general');
  if(!allowed.size&&/侍従限定/.test(n))allowed.add('attendant');
  return allowed;
}
function roleCompatibleText(row,roleId){
  const text=String(row?.matchedText||rowText(row));
  if(!GENERAL_ROLES.has(String(roleId||'')))return text;
  const clauses=splitClauses(text),kept=[];let activeAllowed=null;
  for(const clause of clauses){
    const trimmed=clause.trim(),allowed=roleAllowedSet(clause);
    if(allowed.size)activeAllowed=allowed;
    else if(/^■/.test(trimmed))activeAllowed=null;
    const scoped=allowed.size?allowed:((/^[●▼]/.test(trimmed)&&activeAllowed&&activeAllowed.size)?activeAllowed:new Set());
    if(!scoped.size||scoped.has(roleId))kept.push(clause);
  }
  return kept.join(' ');
}
function roleCompatibleRow(row,roleId){return roleCompatibleText(row,roleId).trim().length>0}
function metricRows(entity,metric){
  const ids=expectedIds(metric),as=aliases(metric),roleId=String(entity?.roleId||'');
  return featureRows(entity).filter(row=>{
    const scopedText=roleCompatibleText(row,roleId);
    if(!scopedText.trim())return false;
    const text=norm(scopedText),id=String(row?.featureId||'');
    if(ids.includes(id)){
      const raw=String(row?.matchedText||rowText(row));
      return norm(scopedText)===norm(raw)||as.some(a=>text.includes(a));
    }
    return as.some(a=>text.includes(a));
  });
}
function relevantText(row,metric,roleId){
  const text=cleanMinus(roleCompatibleText(row,roleId)||row?.matchedText||rowText(row));
  const as=aliases(metric).map(cleanMinus);
  const n=norm(text); let p=-1;
  for(const a of as){const i=n.indexOf(norm(a));if(i>=0&&(p<0||i<p))p=i}
  if(p<0)return text.slice(0,180);
  return text.slice(Math.max(0,p-24),Math.min(text.length,p+96));
}
function percents(text){return [...cleanMinus(text).matchAll(/([+\-]?\d+(?:\.\d+)?)\s*%/g)].map(m=>Number(m[1])).filter(Number.isFinite)}
function numbers(text){return [...cleanMinus(text).matchAll(/[+\-]\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?(?=\s*(?:部隊|回|個|人|枠|対象|$))/g)].map(m=>Number(String(m[0]).replace(/\s+/g,''))).filter(Number.isFinite)}
function isConditional(text){return /(際|時|場合|条件|主将|副将|補佐|侍従|好相性|出陣|交戦|駐屯|都市|弱化効果が|有利変化が)/.test(String(text||''))}
function metricValue(entity,metric){
  const roleId=String(entity?.roleId||''),rows=metricRows(entity,metric),method='matched_item_count';
  const confirmedRows=rows.filter(row=>!isConditional(relevantText(row,metric,roleId)));
  const itemCount=rows.length,confirmedCount=confirmedRows.length;
  return {metricKey:metric?.metricKey,label:metric?.label,method,rows,confirmedRows,confirmedValue:confirmedCount,conditionalMaxValue:itemCount,itemCount,confirmedItemCount:confirmedCount,hit:itemCount>0};
}
const round1=n=>Math.round((Number(n)||0)*10)/10;
const fmt=n=>String(round1(n)).replace(/\.0$/,'');
function formationMemberScore(entity,rule){
  const members=Array.isArray(entity?.members)?entity.members:Array.isArray(entity?.formationMembers)?entity.formationMembers:[];
  return members.reduce((sum,member)=>sum+score(member,rule).fitScore,0);
}
function recordTrace(entity,rule,result){if(window.HADO_TYPE_SCORE_TRACE_SUSPENDED)return;try{const previous=state.diagnostics.typeScore||{},recent=Array.isArray(previous.recent)?previous.recent:[],trace={timestamp:new Date().toISOString(),algorithmVersion:'3.0.0.0 Update09.3.4/type-score-count-v1',entityName:String(entity?.displayName||entity?.name||entity?.id||''),roleId:String(entity?.roleId||''),typeId:String(rule?.typeId||''),typeName:String(rule?.typeName||''),score:result.score,confirmedScore:result.confirmedScore,conditionalMaxScore:result.conditionalMaxScore,matchedMetricCount:result.matchedCount,contributionSummary:summary(result),breakdown:result.breakdown};recent.push({timestamp:trace.timestamp,entityName:trace.entityName,roleId:trace.roleId,typeId:trace.typeId,typeName:trace.typeName,confirmedScore:trace.confirmedScore,conditionalMaxScore:trace.conditionalMaxScore,matchedMetricCount:trace.matchedMetricCount,contributionSummary:trace.contributionSummary});if(recent.length>60)recent.splice(0,recent.length-60);state.diagnostics.typeScore={timestamp:trace.timestamp,algorithmVersion:trace.algorithmVersion,evaluationCount:Number(previous.evaluationCount||0)+1,last:trace,recent};}catch(_){}}
function score(entity,rule){
  const metrics=Array.isArray(rule?.metrics)?rule.metrics.slice(0,5):[];
  const breakdown=metrics.map(m=>metricValue(entity,m));
  const confirmedScore=breakdown.reduce((s,m)=>s+Number(m.confirmedValue||0),0);
  const conditionalMaxScore=breakdown.reduce((s,m)=>s+Number(m.conditionalMaxValue||0),0);
  const fitScore=conditionalMaxScore;
  const evaluationScore=breakdown.reduce((s,m)=>s+Number(m.itemCount||0),0);
  const memberTotal=formationMemberScore(entity,rule);
  const totalScore=memberTotal>0?memberTotal:fitScore;
  const matched=breakdown.filter(m=>m.hit);
  const result={score:fitScore,fitScore,evaluationScore,totalScore,confirmedScore,conditionalMaxScore,matched,total:5,matchedCount:matched.length,breakdown};
  recordTrace(entity,rule,result);
  return result;
}
function label(result){return `${fmt((result?.fitScore??result?.conditionalMaxScore)||0)}`}
function metricLabel(metric){return `${metric?.label||metric?.metricKey}:${fmt((metric?.itemCount??metric?.conditionalMaxValue)||0)}`}
function summary(result){return (result?.breakdown||[]).map(metricLabel).join(' / ')}
window.HadoTypeScore={METRIC_ALIASES,metricRows,metricValue,score,label,metricLabel,summary,roleCompatibleText,roleAllowedSet};
})();
