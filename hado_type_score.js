/* HADO app 3.0.0.0 Update09.5.9: target-scope aware type scoring */
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
  weakening_nullify:['弱化無効','弱化効果無効','弱化効果を無効','状態変化無効','弱化回避','弱化効果回避','不利変化無効'],
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
  ally_wounded_recovery:['味方負傷兵回復','負傷兵回復','兵力回復','兵力を回復','負傷兵を最大兵力','負傷兵を回復'],
  ally_defense_buff:['味方防御上昇','防御上昇','防御'],
  combat_start_tactic_gauge:['交戦開始時戦法ゲージ'],
  self_disadvantage_countermeasure:['自部隊不利対策','弱化無効','弱化効果無効','弱化効果を無効','弱化解除','弱化効果解除','弱化効果を解除','弱化回避','弱化効果回避','弱化反射','弱化効果反射','弱化効果を反射','状態変化無効','不利変化無効','会心無効','会心を無効','撃心無効','撃心を無効','被ダメージ軽減','被ダメージを軽減','防御上昇','防御','壊滅回避','壊滅を回避','兵力回復','兵力を回復','負傷兵回復','強化解除回避','強化奪取回避'],
  ally_non_damage_effect:['味方非ダメージ効果','知力','知力上昇','部隊の知力','防御上昇','防御','被ダメージ軽減','兵力回復','兵力を回復','負傷兵回復','壊滅回避','弱化解除','弱化無効','弱化回避','不利変化無効','強化解除回避','強化奪取回避']
};
const FEATURE_ID_ALIASES={wounded_recovery:['skill_effect:healing'],chain_rate:['skill_effect:chain_rate'],troops:['parameter:troops']};
const GENERAL_ROLES=new Set(['main_general','vice_general','support_general','attendant']);
const norm=s=>String(s??'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const flat=v=>Array.isArray(v)?v.map(flat).join(' '):(v&&typeof v==='object'?Object.values(v).map(flat).join(' '):String(v??''));
const uniq=a=>[...new Set(a.filter(Boolean))];
const cleanMinus=s=>String(s??'').replace(/[−₋－―ー]/g,'-').replace(/＋/g,'+').replace(/％/g,'%');
const hasAny=(text,terms)=>terms.some(term=>norm(text).includes(norm(term)));
const TARGET_SCOPE_LABELS={self:'自部隊',ally:'味方',enemy:'敵部隊',any:'対象不問',unknown:'対象不明'};
const EFFECT_KIND_LABELS={non_damage:'非ダメージ',firepower:'火力/速度',recovery:'回復',defense:'防御/軽減',weakening:'弱化対策',status_guard:'状態変化対策',survival:'生存対策',buff_keep:'バフ維持',enemy_debuff:'敵妨害',generic:'効果'};
const FIREPOWER_ALIASES=['攻撃','攻撃上昇','攻撃速度','戦法速度','戦法ゲージ','出陣時戦法ゲージ','交戦開始時戦法ゲージ','会心発生','会心威力','撃心発生','撃心威力','通常攻撃対象数','通常攻撃対象部隊数','射程','機動','連鎖率','連鎖確率','対物特効','戦法威力','通常攻撃威力'];
const INTELLIGENCE_ALIASES=['知力','知力上昇','部隊の知力','自部隊の知力','味方の知力'];
const SELF_DISADVANTAGE_BUCKETS=[
  {bucket:'弱化対策',kind:'weakening',aliases:['弱化無効','弱化効果無効','弱化効果を無効','弱化解除','弱化効果解除','弱化効果を解除','弱化回避','弱化効果回避','弱化反射','弱化効果反射','弱化効果を反射']},
  {bucket:'状態変化対策',kind:'status_guard',aliases:['状態変化無効','不利変化無効']},
  {bucket:'被火力対策',kind:'defense',aliases:['会心無効','会心を無効','撃心無効','撃心を無効','被ダメージ軽減','被ダメージを軽減','防御上昇','防御']},
  {bucket:'生存対策',kind:'survival',aliases:['壊滅回避','壊滅を回避','兵力回復','兵力を回復','負傷兵回復']},
  {bucket:'バフ維持',kind:'buff_keep',aliases:['強化解除回避','強化奪取回避']}
];
const NON_DAMAGE_BUCKETS=[
  {bucket:'知力上昇',kind:'non_damage',aliases:INTELLIGENCE_ALIASES,scope:'any'},
  {bucket:'防御上昇',kind:'defense',aliases:['防御上昇','防御'],scope:'ally'},
  {bucket:'被ダメージ軽減',kind:'defense',aliases:['被ダメージ軽減'],scope:'ally'},
  {bucket:'回復',kind:'recovery',aliases:['兵力回復','兵力を回復','負傷兵回復','負傷兵を最大兵力','負傷兵を回復'],scope:'ally'},
  {bucket:'生存対策',kind:'survival',aliases:['壊滅回避'],scope:'ally'},
  {bucket:'弱化対策',kind:'weakening',aliases:['弱化解除','弱化無効','弱化回避','弱化効果解除','弱化効果無効','弱化効果回避'],scope:'ally'},
  {bucket:'状態変化対策',kind:'status_guard',aliases:['不利変化無効','状態変化無効'],scope:'ally'},
  {bucket:'バフ維持',kind:'buff_keep',aliases:['強化解除回避','強化奪取回避'],scope:'ally'}
];
const METRIC_MATCH_SPECS={
  ally_non_damage_effect:{targetScope:'ally',requiresTarget:true,includeAliases:METRIC_ALIASES.ally_non_damage_effect,excludeAliases:FIREPOWER_ALIASES,effectKind:'non_damage',displayBucket:'非ダメージ'},
  self_disadvantage_countermeasure:{targetScope:'self',requiresTarget:true,includeAliases:METRIC_ALIASES.self_disadvantage_countermeasure,excludeAliases:['敵部隊','敵の','相手の','戦法遅延','連鎖無効','攻撃低下','防御低下'],effectKind:'weakening',displayBucket:'自部隊不利対策'},
  ally_wounded_recovery:{targetScope:'ally',requiresTarget:true,includeAliases:METRIC_ALIASES.ally_wounded_recovery,excludeAliases:[],effectKind:'recovery',displayBucket:'味方負傷兵回復'},
  weakening_nullify:{targetScope:'self',requiresTarget:true,includeAliases:METRIC_ALIASES.weakening_nullify,excludeAliases:[],effectKind:'weakening',displayBucket:'弱化対策',deprecatedInto:'self_disadvantage_countermeasure'},
  weakening_remove:{targetScope:'self',requiresTarget:true,includeAliases:METRIC_ALIASES.weakening_remove,excludeAliases:[],effectKind:'weakening',displayBucket:'弱化対策'},
  enemy_attack_debuff:{targetScope:'enemy',requiresTarget:true,includeAliases:METRIC_ALIASES.enemy_attack_debuff,excludeAliases:[],effectKind:'enemy_debuff',displayBucket:'敵攻撃低下'},
  enemy_defense_debuff:{targetScope:'enemy',requiresTarget:true,includeAliases:METRIC_ALIASES.enemy_defense_debuff,excludeAliases:[],effectKind:'enemy_debuff',displayBucket:'敵防御低下'},
  enemy_debuff_multi:{targetScope:'enemy',requiresTarget:true,includeAliases:METRIC_ALIASES.enemy_debuff_multi,excludeAliases:[],effectKind:'enemy_debuff',displayBucket:'敵デバフ'},
  enemy_target_count:{targetScope:'enemy',requiresTarget:true,includeAliases:METRIC_ALIASES.enemy_target_count,excludeAliases:[],effectKind:'enemy_debuff',displayBucket:'敵対象数'},
  enemy_anti_object_debuff:{targetScope:'enemy',requiresTarget:true,includeAliases:METRIC_ALIASES.enemy_anti_object_debuff,excludeAliases:[],effectKind:'enemy_debuff',displayBucket:'敵対物低下'}
};
const METRIC_PRIORITY={ally_wounded_recovery:120,self_disadvantage_countermeasure:110,ally_non_damage_effect:80,weakening_nullify:20,weakening_remove:60};
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
function inferTargetScope(text){
  const raw=String(text||''),n=norm(raw);
  const hasEnemy=/(敵部隊|敵の|敵3部隊|敵2部隊|敵4部隊|相手|対象部隊に|攻撃対象)/.test(raw)||/(敵|相手)/.test(n);
  const hasAlly=/(自身を含む味方|味方部隊|味方[0-9一二三四五六七八九十]*部隊|味方の|味方全体|味方)/.test(raw)||/自身を含む味方|味方/.test(n);
  const hasSelf=/(自部隊|自身|自分|この武将|装備者|自軍)/.test(raw)||/(自部隊|自身|自分|装備者)/.test(n);
  if(hasAlly)return 'ally';
  if(hasSelf)return 'self';
  if(hasEnemy)return 'enemy';
  return 'unknown';
}
function targetMatches(actual,required){
  if(required==='any')return true;
  if(required==='self')return actual==='self'||actual==='ally';
  if(required==='ally')return actual==='ally';
  if(required==='enemy')return actual==='enemy';
  return actual==='unknown';
}
function inferTargetScopeForMetric(text,required='any'){const scope=inferTargetScope(text);const raw=String(text||''),n=norm(raw);if(required==='enemy'&&(/(敵部隊|敵の|敵[0-9一二三四五六七八九十]*部隊|相手|敵対象部隊|敵)/.test(raw)||/(敵|相手)/.test(n)))return 'enemy';if(required==='self'&&/(自部隊|自身|自分|装備者)/.test(raw))return 'self';if(required==='ally'&&/(自身を含む味方|味方部隊|味方[0-9一二三四五六七八九十]*部隊|味方の|味方)/.test(raw))return 'ally';return scope}
function targetScopeLabel(scope){return TARGET_SCOPE_LABELS[scope]||TARGET_SCOPE_LABELS.unknown}
function effectKindLabel(kind){return EFFECT_KIND_LABELS[kind]||EFFECT_KIND_LABELS.generic}
function firstBucket(text,buckets){return buckets.find(bucket=>hasAny(text,bucket.aliases))||null}
function metricSpec(metric){return METRIC_MATCH_SPECS[metric?.metricKey||'']||{targetScope:'any',requiresTarget:false,includeAliases:METRIC_ALIASES[metric?.metricKey]||[],excludeAliases:[],effectKind:'generic',displayBucket:metric?.label||metric?.metricKey||'型要素'}}
function rowEvidenceKey(row){return [row?.featureId||'',row?.sourceKind||'',row?.sourceLabel||'',row?.key||row?.label||row?.statusEffectName||'',row?.matchedText||rowText(row)].map(norm).join('|')}
function classifyMetricRow(row,metric,scopedText){
  const spec=metricSpec(metric),metricKey=metric?.metricKey||'',text=String(scopedText||''),targetScope=inferTargetScopeForMetric(text,spec.targetScope),include=uniq([metric?.label,...(spec.includeAliases||[])]),exclude=spec.excludeAliases||[];
  const intelligence=metricKey==='ally_non_damage_effect'&&hasAny(text,INTELLIGENCE_ALIASES);
  const included=intelligence||hasAny(text,include);
  const excluded=!intelligence&&exclude.length&&hasAny(text,exclude);
  const targetOk=!spec.requiresTarget||intelligence||targetMatches(targetScope,spec.targetScope);
  let bucket=null;
  if(metricKey==='self_disadvantage_countermeasure')bucket=firstBucket(text,SELF_DISADVANTAGE_BUCKETS);
  else if(metricKey==='ally_non_damage_effect')bucket=firstBucket(text,NON_DAMAGE_BUCKETS);
  const displayBucket=bucket?.bucket||spec.displayBucket||metric?.label||metricKey;
  const effectKind=bucket?.kind||spec.effectKind||'generic';
  const excludeReason=!included?'includeAliases未一致':(excluded?'excludeAliases一致':(!targetOk?`targetScope ${targetScope} does not satisfy ${spec.targetScope}`:''));
  return {included:!!included&&!excluded&&targetOk,excludeReason,targetScope,targetScopeLabel:targetScopeLabel(targetScope),requiredTargetScope:spec.targetScope||'any',requiresTarget:!!spec.requiresTarget,effectKind,effectKindLabel:effectKindLabel(effectKind),displayBucket,intelligenceException:!!intelligence,deprecatedInto:spec.deprecatedInto||'',matchedAlias:include.find(term=>hasAny(text,[term]))||''};
}
function metricRows(entity,metric){
  const ids=expectedIds(metric),as=aliases(metric),roleId=String(entity?.roleId||''),spec=metricSpec(metric);
  return featureRows(entity).map(row=>{
    const scopedText=roleCompatibleText(row,roleId);
    if(!scopedText.trim())return null;
    const text=norm(scopedText),id=String(row?.featureId||'');
    const aliasMatched=ids.includes(id)?(norm(scopedText)===norm(String(row?.matchedText||rowText(row)))||as.some(a=>text.includes(a))):as.some(a=>text.includes(a));
    const classified=classifyMetricRow(row,metric,scopedText);
    if(!aliasMatched&&!classified.included)return null;
    if(!classified.included)return null;
    return Object.assign({},row,classified,{matchedText:row?.matchedText||rowText(row),targetScope:classified.targetScope,targetScopeMatched:classified.targetScope,displayBucket:classified.displayBucket,effectKind:classified.effectKind,evidenceKey:rowEvidenceKey(row),scoreEligible:true,metricKey:metric?.metricKey||''});
  }).filter(Boolean);
}
function relevantText(row,metric,roleId){
  const text=cleanMinus(roleCompatibleText(row,roleId)||row?.matchedText||rowText(row));
  const spec=metricSpec(metric),as=uniq([...(aliases(metric)||[]),...(spec.includeAliases||[])]).map(cleanMinus);
  const n=norm(text); let p=-1;
  for(const a of as){const i=n.indexOf(norm(a));if(i>=0&&(p<0||i<p))p=i}
  if(p<0)return text.slice(0,180);
  return text.slice(Math.max(0,p-24),Math.min(text.length,p+96));
}
function percents(text){return [...cleanMinus(text).matchAll(/([+\-]?\d+(?:\.\d+)?)\s*%/g)].map(m=>Number(m[1])).filter(Number.isFinite)}
function numbers(text){return [...cleanMinus(text).matchAll(/[+\-]\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?(?=\s*(?:部隊|回|個|人|枠|対象|$))/g)].map(m=>Number(String(m[0]).replace(/\s+/g,''))).filter(Number.isFinite)}
function isConditional(text){return /(際|時|場合|条件|主将|副将|補佐|侍従|好相性|出陣|交戦|駐屯|都市|弱化効果が|有利変化が)/.test(String(text||''))}
function metricValue(entity,metric){
  const roleId=String(entity?.roleId||''),rows=metricRows(entity,metric),method='target_scope_matched_item_count';
  const confirmedRows=rows.filter(row=>!isConditional(relevantText(row,metric,roleId)));
  const itemCount=rows.length,confirmedCount=confirmedRows.length;
  return {metricKey:metric?.metricKey,label:metric?.label,method,targetScope:metricSpec(metric).targetScope,requiresTarget:metricSpec(metric).requiresTarget,rows,confirmedRows,confirmedValue:confirmedCount,conditionalMaxValue:itemCount,itemCount,confirmedItemCount:confirmedCount,hit:itemCount>0};
}
function dedupeBreakdownRows(breakdown){
  const owners=new Map();
  breakdown.forEach((metric,metricIndex)=>{(metric.rows||[]).forEach(row=>{const key=row.evidenceKey||rowEvidenceKey(row),priority=METRIC_PRIORITY[metric.metricKey]??50,current=owners.get(key);if(!current||priority>current.priority||(priority===current.priority&&metricIndex<current.metricIndex))owners.set(key,{metricKey:metric.metricKey,priority,metricIndex});});});
  return breakdown.map(metric=>{const rows=(metric.rows||[]).filter(row=>owners.get(row.evidenceKey||rowEvidenceKey(row))?.metricKey===metric.metricKey);const confirmedRows=(metric.confirmedRows||[]).filter(row=>owners.get(row.evidenceKey||rowEvidenceKey(row))?.metricKey===metric.metricKey);const itemCount=rows.length,confirmedCount=confirmedRows.length;return Object.assign({},metric,{rows,confirmedRows,itemCount,conditionalMaxValue:itemCount,confirmedValue:confirmedCount,confirmedItemCount:confirmedCount,hit:itemCount>0,dedupePolicy:'single-score-per-evidence-row',dedupedFromMetricCount:(metric.rows||[]).length-itemCount});});
}
const round1=n=>Math.round((Number(n)||0)*10)/10;
const fmt=n=>String(round1(n)).replace(/\.0$/,'');
function formationMemberScore(entity,rule){
  const members=Array.isArray(entity?.members)?entity.members:Array.isArray(entity?.formationMembers)?entity.formationMembers:[];
  return members.reduce((sum,member)=>sum+score(member,rule).fitScore,0);
}
function recordTrace(entity,rule,result){if(window.HADO_TYPE_SCORE_TRACE_SUSPENDED)return;try{const previous=state.diagnostics.typeScore||{},recent=Array.isArray(previous.recent)?previous.recent:[],trace={timestamp:new Date().toISOString(),algorithmVersion:'3.0.0.0 Update09.5.9/type-score-target-scope-v1',entityName:String(entity?.displayName||entity?.name||entity?.id||''),roleId:String(entity?.roleId||''),typeId:String(rule?.typeId||''),typeName:String(rule?.typeName||''),score:result.score,confirmedScore:result.confirmedScore,conditionalMaxScore:result.conditionalMaxScore,matchedMetricCount:result.matchedCount,contributionSummary:summary(result),breakdown:result.breakdown};recent.push({timestamp:trace.timestamp,entityName:trace.entityName,roleId:trace.roleId,typeId:trace.typeId,typeName:trace.typeName,confirmedScore:trace.confirmedScore,conditionalMaxScore:trace.conditionalMaxScore,matchedMetricCount:trace.matchedMetricCount,contributionSummary:trace.contributionSummary});if(recent.length>60)recent.splice(0,recent.length-60);state.diagnostics.typeScore={timestamp:trace.timestamp,algorithmVersion:trace.algorithmVersion,evaluationCount:Number(previous.evaluationCount||0)+1,last:trace,recent};}catch(_){}}
function score(entity,rule){
  const metrics=Array.isArray(rule?.metrics)?rule.metrics.slice(0,5):[];
  const breakdown=dedupeBreakdownRows(metrics.map(m=>metricValue(entity,m)));
  const confirmedScore=breakdown.reduce((s,m)=>s+Number(m.confirmedValue||0),0);
  const conditionalMaxScore=breakdown.reduce((s,m)=>s+Number(m.conditionalMaxValue||0),0);
  const fitScore=conditionalMaxScore;
  const evaluationScore=breakdown.reduce((s,m)=>s+Number(m.itemCount||0),0);
  const memberTotal=formationMemberScore(entity,rule);
  const totalScore=memberTotal>0?memberTotal:fitScore;
  const matched=breakdown.filter(m=>m.hit);
  const result={score:fitScore,fitScore,evaluationScore,totalScore,confirmedScore,conditionalMaxScore,matched,total:5,matchedCount:matched.length,breakdown,targetScopeScoring:true,dedupePolicy:'single-score-per-evidence-row'};
  recordTrace(entity,rule,result);
  return result;
}
function label(result){return `${fmt((result?.fitScore??result?.conditionalMaxScore)||0)}`}
function metricLabel(metric){return `${metric?.label||metric?.metricKey}:${fmt((metric?.itemCount??metric?.conditionalMaxValue)||0)}`}
function summary(result){return (result?.breakdown||[]).map(metricLabel).join(' / ')}
function tagKind(index){return index<2?'core':index<4?'recommended':'support'}
function tagKindLabel(kind){return kind==='core'?'中核':kind==='recommended'?'推奨':'補助'}
function rowTagLabel(row){return String(row?.displayBucket||row?.label||row?.statusEffectName||row?.key||row?.featureId||'').trim()}
function tagList(entity,rule,result=null){
  const resolved=result||score(entity,rule),out=[],seen=new Set();
  (resolved?.breakdown||[]).forEach((metric,index)=>{
    const rows=Array.isArray(metric?.rows)?metric.rows:[];
    if(!rows.length)return;
    const kind=tagKind(index);
    const metricLabel=String(metric?.label||metric?.metricKey||'型要素').trim();
    const key=`${kind}:${metricLabel}`;
    if(!seen.has(key)){seen.add(key);out.push({kind,kindLabel:tagKindLabel(kind),label:metricLabel,source:'metric',targetScope:metric.targetScope||'any'});}
    rows.slice(0,4).forEach(row=>{
      const label=rowTagLabel(row);
      if(!label)return;
      const rowKind=String(row?.sourceKind||'').includes('effect')?'status':'type';
      const rowKey=`${rowKind}:${label}:${row.targetScope||'unknown'}:${row.effectKind||''}`;
      if(!seen.has(rowKey)){seen.add(rowKey);out.push({kind:rowKind,kindLabel:rowKind==='status'?'状態変化':'型要素',label,source:'row',targetScope:row.targetScope||'unknown',targetScopeLabel:row.targetScopeLabel||targetScopeLabel(row.targetScope),effectKind:row.effectKind||'generic',effectKindLabel:row.effectKindLabel||effectKindLabel(row.effectKind)});}
    });
  });
  return out.slice(0,18);
}
function tagSummary(entity,rule,result=null){return tagList(entity,rule,result).map(t=>`${t.kindLabel}:${t.label}`).join(' / ')}
window.HadoTypeScore={METRIC_ALIASES,METRIC_MATCH_SPECS,TARGET_SCOPE_LABELS,inferTargetScope,inferTargetScopeForMetric,targetMatches,metricRows,metricValue,score,label,metricLabel,summary,roleCompatibleText,roleAllowedSet};
window.HadoTypeTags={tagList,tagSummary,tagKindLabel};
})();
