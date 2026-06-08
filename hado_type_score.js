/* HADO app 3.0.0.0 Update07.1: rule-based 10-step type suitability scoring */
(()=>{'use strict';
const METRIC_ALIASES={
  troops:['兵力'],tactic_power:['戦法威力'],critical_tactic_power:['撃心威力'],critical_power:['会心威力'],attack_speed:['攻撃速度'],critical_rate:['会心発生','会心発生率'],critical_tactic_rate:['撃心発生','撃心発生率'],normal_attack_power:['通常攻撃威力'],normal_attack_target_count:['通常攻撃対象数','通常攻撃対象部隊数'],range:['射程'],anti_object:['対物特効'],tactic_speed:['戦法速度'],weakening_nullify:['弱化無効','弱化効果無効'],weakening_remove:['弱化解除','弱化効果解除'],strengthening_remove_avoid:['強化解除回避'],strengthening_seize_avoid:['強化奪取回避'],annihilation_avoidance:['壊滅回避'],remaining_troops:['残存兵力'],wounded_recovery:['負傷兵回復','兵力回復'],damage_reduction:['被ダメージ軽減'],tactic_reduction:['戦法短縮'],initial_tactic_gauge:['出陣時戦法ゲージ'],chain_rate:['連鎖率','連鎖確率'],status_effect_rate:['状態変化発生率'],tactic_delay:['戦法遅延'],chain_nullify:['連鎖無効'],enemy_attack_debuff:['敵部隊攻撃低下'],enemy_defense_debuff:['敵部隊防御低下'],ally_buff_multi:['味方バフ配布'],ally_target_count:['味方対象部隊数'],effect_duration:['効果時間'],enemy_debuff_multi:['敵デバフ配布'],enemy_target_count:['敵対象部隊数'],enemy_anti_object_debuff:['敵部隊対物特効低下','対物特効低下'],ally_wounded_recovery:['味方負傷兵回復'],ally_defense_buff:['味方防御上昇'],combat_start_tactic_gauge:['交戦開始時戦法ゲージ'],self_disadvantage_countermeasure:['自部隊不利対策'],ally_non_damage_effect:['味方非ダメージ効果']
};
const FEATURE_ID_ALIASES={wounded_recovery:['skill_effect:healing'],chain_rate:['skill_effect:chain_rate'],troops:['parameter:troops']};
const norm=s=>String(s??'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const flat=v=>Array.isArray(v)?v.map(flat).join(' '):(v&&typeof v==='object'?Object.values(v).map(flat).join(' '):String(v??''));
const uniq=a=>[...new Set(a.filter(Boolean))];
const cleanMinus=s=>String(s??'').replace(/[−₋－―ー]/g,'-').replace(/＋/g,'+').replace(/％/g,'%');
function aliases(metric){return uniq([metric?.label,...(METRIC_ALIASES[metric?.metricKey]||[])]).map(norm).filter(Boolean)}
function expectedIds(metric){const k=metric?.metricKey||'';return uniq([`parameter:${k}`,`skill_effect:${k}`,...(FEATURE_ID_ALIASES[k]||[])])}
function featureRows(entity){return [...(entity?.typeFeatures||[]),...(entity?.statusEffectRefs||[])].filter(Boolean)}
function rowText(row){return flat([row?.label,row?.statusEffectName,row?.featureId,row?.matchedText])}
function metricRows(entity,metric){
  const ids=expectedIds(metric),as=aliases(metric);
  return featureRows(entity).filter(row=>{
    const id=String(row?.featureId||'');
    if(ids.includes(id))return true;
    const text=norm(rowText(row));
    return as.some(a=>text.includes(a));
  });
}
function relevantText(row,metric){
  const text=cleanMinus(row?.matchedText||rowText(row));
  const as=aliases(metric).map(cleanMinus);
  const n=norm(text); let p=-1;
  for(const a of as){const i=n.indexOf(norm(a));if(i>=0&&(p<0||i<p))p=i}
  if(p<0)return text.slice(0,180);
  return text.slice(Math.max(0,p-24),Math.min(text.length,p+96));
}
function percents(text){return [...cleanMinus(text).matchAll(/([+\-]?\d+(?:\.\d+)?)\s*%/g)].map(m=>Number(m[1])).filter(Number.isFinite)}
function numbers(text){return [...cleanMinus(text).matchAll(/([+\-]?\d+(?:\.\d+)?)/g)].map(m=>Number(m[1])).filter(Number.isFinite)}
function isConditional(text){return /(際|時|場合|条件|主将|副将|補佐|好相性|出陣|交戦|駐屯|都市|弱化効果が|有利変化が)/.test(String(text||''))}
function metricValue(entity,metric){
  const rows=metricRows(entity,metric),method=String(metric?.method||'presence_fixed');
  let confirmed=0,conditional=0,hit=false;
  for(const row of rows){
    const text=relevantText(row,metric),conditionalRow=isConditional(text);
    let values=method==='baseline_ratio'?numbers(text):percents(text);
    let value=0;
    if(method==='presence_fixed') value=Number(metric?.basis||100);
    else if(method==='percent_sum') value=values.filter(v=>v>0).reduce((a,b)=>a+b,0);
    else if(method==='percent_sum_or_presence') value=values.filter(v=>v>0).reduce((a,b)=>a+b,0)||Number(metric?.basis||100);
    else if(method==='baseline_ratio'){
      const inc=Number(metric?.basis?.baselineIncrement||1),pts=Number(metric?.basis?.baselinePoints||100);
      const positive=values.filter(v=>v>0);
      value=positive.length?Math.max(...positive)/inc*pts:0;
    } else value=Number(metric?.basis||100);
    if(value>0){hit=true;conditional+=value;if(!conditionalRow)confirmed+=value}
  }
  return {metricKey:metric?.metricKey,label:metric?.label,method,rows,confirmedValue:confirmed,conditionalMaxValue:conditional,hit};
}
const round1=n=>Math.round((Number(n)||0)*10)/10;
const capped=v=>Math.min(100,Math.max(0,Number(v)||0));
const metricPoints=v=>round1(capped(v)/50);
const fmt=n=>String(round1(n)).replace(/\.0$/,'');
function recordTrace(entity,rule,result){try{const previous=state.diagnostics.typeScore||{},recent=Array.isArray(previous.recent)?previous.recent:[],trace={timestamp:new Date().toISOString(),algorithmVersion:'3.0.0.0 Update07.3/type-score-trace-v3',entityName:String(entity?.displayName||entity?.name||entity?.id||''),roleId:String(entity?.roleId||''),typeId:String(rule?.typeId||''),typeName:String(rule?.typeName||''),score:result.score,confirmedScore:result.confirmedScore,conditionalMaxScore:result.conditionalMaxScore,matchedMetricCount:result.matchedCount,contributionSummary:summary(result),breakdown:result.breakdown};recent.push({timestamp:trace.timestamp,entityName:trace.entityName,roleId:trace.roleId,typeId:trace.typeId,typeName:trace.typeName,confirmedScore:trace.confirmedScore,conditionalMaxScore:trace.conditionalMaxScore,matchedMetricCount:trace.matchedMetricCount,contributionSummary:trace.contributionSummary});if(recent.length>60)recent.splice(0,recent.length-60);state.diagnostics.typeScore={timestamp:trace.timestamp,algorithmVersion:trace.algorithmVersion,evaluationCount:Number(previous.evaluationCount||0)+1,last:trace,recent};}catch(_){}}
function score(entity,rule){
  const metrics=Array.isArray(rule?.metrics)?rule.metrics.slice(0,5):[];
  const breakdown=metrics.map(m=>metricValue(entity,m));
  const confirmedScore=round1(breakdown.reduce((s,m)=>s+capped(m.confirmedValue),0)/50);
  const conditionalMaxScore=round1(breakdown.reduce((s,m)=>s+capped(m.conditionalMaxValue),0)/50);
  const matched=breakdown.filter(m=>m.hit);
  const result={score:conditionalMaxScore,confirmedScore,conditionalMaxScore,matched,total:5,matchedCount:matched.length,breakdown};
  recordTrace(entity,rule,result);
  return result;
}
function label(result){return `${fmt(result?.confirmedScore||0)}/10（条件込最大 ${fmt(result?.conditionalMaxScore||0)}/10）`}
function metricLabel(metric){const c=metricPoints(metric?.confirmedValue),m=metricPoints(metric?.conditionalMaxValue),v=c===m?fmt(c):`${fmt(c)}→${fmt(m)}`;return `${metric?.label||metric?.metricKey}:${v}/2`}
function summary(result){return (result?.breakdown||[]).map(metricLabel).join(' / ')}
window.HadoTypeScore={METRIC_ALIASES,metricRows,metricValue,score,label,metricLabel,summary};
})();
