/* Update09 Phase5 target/effect/category gate regression tests */
global.window={};
require('../hado_type_score.js');
const S=window.HadoTypeScore;
function assert(cond,msg){if(!cond)throw new Error(msg)}
function assertEq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: expected ${expected}, actual ${actual}`)}
function scoreOne(metricKey,label,matchedText,extra={}){
  return S.score({roleId:'formation_effects',typeFeatures:[{featureId:`skill_effect:${metricKey}`,label,matchedText,...extra}]},{typeId:'scope-test',typeName:'scope-test',metrics:[{metricKey,label,method:'presence_fixed'}]}).breakdown[0];
}
const nonDamageCases=[
  ['味方の攻撃を上昇','攻撃',0,''],
  ['味方の攻撃速度を上昇','攻撃速度',0,''],
  ['味方の戦法ゲージを上昇','戦法ゲージ',0,''],
  ['味方の連鎖率を上昇','連鎖率',0,''],
  ['味方の知力を上昇','知力',0,''],
  ['自部隊の知力を上昇','知力',0,''],
  ['味方の防御を上昇','防御',1,'耐久支援'],
  ['味方の弱化効果を解除','弱化解除',1,'不利対策'],
  ['味方の兵力を回復','兵力回復',1,'生存支援'],
  ['知力を上昇','知力',0,''],
  ['味方の与ダメージを上昇','ダメージ',0,''],
  ['味方が敵にダメージを与える','ダメージ',0,'']
];
nonDamageCases.forEach(([text,label,expected,bucket])=>{
  const row=scoreOne('ally_non_damage_effect',label,text);
  assertEq(row.itemCount,expected,`ally_non_damage_effect ${text}`);
  if(expected)assertEq(row.rows[0].displayBucket,bucket,`ally_non_damage bucket ${text}`);
});
[
  ['型要素 知力上昇 > 対象不明 > 部隊の知力(変化率集計)','知力',{sourceLabel:'変化率集計',featureType:'parameter',source:'parameter_summary'}],
  ['型要素 知力上昇 > 自部隊 > 部隊の知力(変化率集計)','知力',{sourceLabel:'変化率集計',featureType:'parameter',source:'parameter_summary'}],
  ['状態変化 知力上昇 > 対象不明 > 知力','知力',{featureType:'statusEffect',source:'hadou_related_link_index.json',sourcePartType:'semantic-owner-parameter'}],
  ['状態変化 防御上昇 > 対象不明 > 防御','防御',{featureType:'statusEffect',source:'hadou_related_link_index.json',sourcePartType:'semantic-owner-parameter'}],
  ['部隊の知力(変化率集計)','知力',{sourceLabel:'変化率集計',featureType:'parameter',source:'parameter_summary'}],
  ['部隊の防御(変化率集計)','防御',{sourceLabel:'変化率集計',featureType:'parameter',source:'parameter_summary'}]
].forEach(([text,label,extra])=>assertEq(scoreOne('ally_non_damage_effect',label,text,extra).itemCount,0,`ally_non_damage excludes non-primary/unknown/aggregate: ${text}`));
[
  ['自部隊の戦法ゲージを増加','戦法ゲージ'],
  ['自部隊の通常攻撃対象数を増加','通常攻撃対象数'],
  ['自部隊の攻撃速度を上昇','攻撃速度'],
  ['自部隊の防御を上昇 [UR時の最大能力]','防御'],
  ['自部隊の負傷兵として生存する兵数を増加','負傷兵として生存する兵数'],
  ['味方の通常攻撃対象数を増加','通常攻撃対象数'],
  ['味方の防御を上昇 [UR時の最大能力]','防御']
].forEach(([text,label])=>assertEq(scoreOne('ally_non_damage_effect',label,text).itemCount,0,`ally_non_damage excludes screenshot/regression case: ${text}`));
assertEq(scoreOne('ally_non_damage_effect','攻撃速度','状態変化 速度支援 > 味方 > 攻撃速度(LR貂蝉（ちょうせん）: 技能:合唱Ⅰ)').itemCount,0,'ally_non_damage excludes screenshot ally attack-speed support; it belongs to speed/firepower, not vaccine support');

assertEq(scoreOne('ally_non_damage_effect','負傷兵として生存する兵数','味方の負傷兵として生存する兵数を増加').rows[0].displayBucket,'生存支援','wounded survival is survival support, not chain support');
[
  ['被火力対策 > 自部隊 > 防御 自部隊の防御を上昇','防御'],
  ['被火力対策 > 自部隊 > 対物防御 自部隊の対物防御を上昇','対物防御'],
  ['被火力対策 > 自部隊 > 被ダメージ軽減 自部隊の被ダメージを軽減','被ダメージ軽減'],
  ['生存対策 > 自部隊 > 兵力回復 自部隊の兵力を回復','兵力回復'],
  ['生存対策 > 自部隊 > 負傷兵回復 自部隊の負傷兵を回復','負傷兵回復'],
  ['火力支援 > 自部隊 > 攻撃 自部隊の攻撃を上昇','攻撃'],
  ['火力支援 > 自部隊 > 会心威力 自部隊の会心威力を上昇','会心威力'],
  ['戦法支援 > 自部隊 > 戦法ゲージ 自部隊の戦法ゲージを増加','戦法ゲージ'],
  ['自部隊の会心を無効','会心無効'],
  ['自部隊の撃心を無効','撃心無効']
].forEach(([text,label])=>assertEq(scoreOne('self_disadvantage_countermeasure',label,text).itemCount,0,`self_disadvantage excludes non-disadvantage category: ${text}`));
[
  ['自部隊の弱化効果を無効','弱化効果無効','弱化対策'],
  ['自部隊の弱化効果を解除','弱化効果解除','弱化対策'],
  ['自部隊の状態変化無効[分断]','状態変化無効','状態変化対策'],
  ['自部隊の状態変化無効[絶縁]','状態変化無効','状態変化対策'],
  ['自部隊の状態変化無効[連鎖無効]','状態変化無効','状態変化対策'],
  ['味方部隊の弱化効果を解除','弱化効果解除','弱化対策'],
  ['自部隊の分断を防ぐ','分断対策','制御対策'],
  ['自部隊の恐怖を防ぐ','恐怖対策','制御対策']
].forEach(([text,label,bucket])=>{const row=scoreOne('self_disadvantage_countermeasure',label,text);assertEq(row.itemCount,1,`self_disadvantage includes ${text}`);assertEq(row.rows[0].displayBucket,bucket,`self bucket ${text}`);assert(['self','ally'].includes(row.rows[0].targetScope),`self/ally target ${text}`);});
['敵部隊の攻撃を低下','敵部隊の戦法を遅延','弱化無効'].forEach(text=>assertEq(scoreOne('self_disadvantage_countermeasure','弱化無効',text).itemCount,0,`self_disadvantage excludes ${text}`));
[
  ['味方の負傷兵を回復',1],
  ['味方部隊の兵力を回復',1],
  ['自身を含む味方の負傷兵を回復',1],
  ['自部隊の負傷兵を回復',0],
  ['自身の兵力を回復',0],
  ['負傷兵回復',0],
  ['兵力回復',0]
].forEach(([text,expected])=>assertEq(scoreOne('ally_wounded_recovery','負傷兵回復',text).itemCount,expected,`ally_wounded_recovery ${text}`));
const vaccineRule={metrics:[
  {metricKey:'self_disadvantage_countermeasure',label:'自部隊不利対策'},
  {metricKey:'ally_non_damage_effect',label:'味方非ダメージ効果'},
  {metricKey:'weakening_nullify',label:'弱化無効'},
  {metricKey:'weakening_remove',label:'弱化解除'},
  {metricKey:'ally_wounded_recovery',label:'味方負傷兵回復'}
]};
const duplicateEntity={roleId:'formation_effects',typeFeatures:[
  {featureId:'skill_effect:weakening_nullify',label:'弱化効果無効[弱化無効]',sourceLabel:'検証技能',matchedText:'自部隊の弱化効果を無効',rawText:'自部隊の弱化効果を無効'},
  {featureId:'status_effect:弱化無効',label:'弱化無効',sourceLabel:'検証技能',matchedText:'自部隊の弱化効果を無効',rawText:'自部隊の弱化効果を無効'},
  {featureId:'skill_effect:ally_wounded_recovery',label:'負傷兵回復',matchedText:'味方の負傷兵を回復'}
]};
const result=S.score(duplicateEntity,vaccineRule);
assertEq(result.breakdown[0].itemCount,1,'weakening duplicate evidence belongs to self_disadvantage once');
assertEq(result.breakdown[2].itemCount,0,'weakening_nullify does not double score after self_disadvantage');
assertEq(result.breakdown[1].itemCount,0,'wounded recovery does not double score as generic non-damage when specific metric exists');
assertEq(result.breakdown[4].itemCount,1,'ally wounded recovery keeps the specific recovery score');
const nonDamageBulkEntity={roleId:'formation_effects',typeFeatures:[
  {featureId:'skill_effect:ally_non_damage_effect',label:'知力',matchedText:'味方の知力を上昇',sourceLabel:'技能A'},
  {featureId:'skill_effect:ally_non_damage_effect',label:'攻撃',matchedText:'味方の攻撃を上昇',sourceLabel:'技能B'},
  {featureId:'skill_effect:ally_non_damage_effect',label:'戦法威力',matchedText:'味方の戦法威力を上昇',sourceLabel:'技能C'},
  {featureId:'skill_effect:ally_non_damage_effect',label:'会心発生',matchedText:'味方の会心発生を上昇',sourceLabel:'技能D'},
  {featureId:'skill_effect:ally_non_damage_effect',label:'攻撃速度',matchedText:'味方の攻撃速度を上昇',sourceLabel:'技能E'},
  {featureId:'skill_effect:ally_non_damage_effect',label:'防御',matchedText:'味方の防御を上昇',sourceLabel:'技能F'},
  {featureId:'skill_effect:ally_non_damage_effect',label:'兵力回復',matchedText:'味方の兵力を回復',sourceLabel:'技能G'}
]};
const bulkScore=S.score(nonDamageBulkEntity,{metrics:[{metricKey:'ally_non_damage_effect',label:'味方非ダメージ効果'}]}).breakdown[0];
assertEq(bulkScore.rawEvidenceCount,2,'ally_non_damage excludes firepower/tempo support before representative scoring');
assertEq(bulkScore.itemCount,2,'ally_non_damage keeps only defensive/survival/protective support buckets, not firepower or tempo support');
assert(bulkScore.rows.every(row=>row.representativePolicy==='one-row-per-support-bucket'),'ally_non_damage rows expose representative policy');
const categories=[
  ['damage_reduction','被ダメージ軽減','味方の負傷兵を回復',0,'defense category excludes recovery'],
  ['wounded_recovery','負傷兵回復','自部隊の防御を上昇',0,'survival/recovery category excludes defense-only'],
  ['tactic_power','戦法威力','味方の防御を上昇',0,'firepower category excludes defense buff'],
  ['enemy_debuff_multi','敵デバフ配布','味方の攻撃を上昇',0,'enemy disruption excludes ally buff'],
  ['initial_tactic_gauge','出陣時戦法ゲージ','味方の防御を上昇',0,'tactic support excludes defense'],
  ['chain_rate','連鎖率','味方の戦法ゲージを増加',0,'chain support excludes tactic gauge']
];
categories.forEach(([metricKey,label,text,expected,msg])=>assertEq(scoreOne(metricKey,label,text).itemCount,expected,msg));
assert(S.inferTargetScope('自身を含む味方の負傷兵を回復')==='ally','targetScope ally includes self-containing ally text');
assert(S.inferTargetScope('自部隊の弱化効果を解除')==='self','targetScope self detects self text');
assert(S.inferTargetScope('敵部隊の攻撃を低下')==='enemy','targetScope enemy detects enemy text');
assert(S.inferTargetScope('知力を上昇')==='unknown','targetScope unknown remains available for no-target text');
console.log('Update09 Phase5 score category gate regression: passed');
