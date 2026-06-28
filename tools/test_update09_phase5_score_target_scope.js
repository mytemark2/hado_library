/* Update09 Phase5 targetScope-aware score matching regression tests */
global.window={};
require('../hado_type_score.js');
const S=window.HadoTypeScore;
function assert(cond,msg){if(!cond)throw new Error(msg)}
function assertEq(actual,expected,msg){if(actual!==expected)throw new Error(`${msg}: expected ${expected}, actual ${actual}`)}
function scoreOne(metricKey,label,matchedText){
  return S.score({roleId:'formation_effects',typeFeatures:[{featureId:`skill_effect:${metricKey}`,label,matchedText}]},{typeId:'scope-test',typeName:'scope-test',metrics:[{metricKey,label,method:'presence_fixed'}]}).breakdown[0];
}
const nonDamageCases=[
  ['味方の攻撃を上昇','攻撃',0],
  ['味方の攻撃速度を上昇','攻撃速度',0],
  ['味方の戦法速度を上昇','戦法速度',0],
  ['味方の戦法ゲージを上昇','戦法ゲージ',0],
  ['味方の機動を上昇','機動',0],
  ['味方の射程を上昇','射程',0],
  ['味方の連鎖率を上昇','連鎖率',0],
  ['味方の知力を上昇','知力',1],
  ['自部隊の知力を上昇','知力',1],
  ['知力を上昇','知力',1]
];
nonDamageCases.forEach(([text,label,expected])=>{
  const row=scoreOne('ally_non_damage_effect',label,text);
  assertEq(row.itemCount,expected,`ally_non_damage_effect ${text}`);
  if(expected)assert(row.rows[0].displayBucket==='知力上昇','知力は非ダメージの下位ラベルで表示される');
});
[
  ['自部隊の弱化効果を無効','弱化無効','弱化対策'],
  ['自部隊の弱化効果を解除','弱化解除','弱化対策'],
  ['自部隊の弱化効果を反射','弱化反射','弱化対策'],
  ['自部隊の会心を無効','会心無効','被火力対策'],
  ['自部隊の撃心を無効','撃心無効','被火力対策'],
  ['自部隊の被ダメージを軽減','被ダメージ軽減','被火力対策'],
  ['自部隊の壊滅を回避','壊滅回避','生存対策']
].forEach(([text,label,bucket])=>{const row=scoreOne('self_disadvantage_countermeasure',label,text);assertEq(row.itemCount,1,`self_disadvantage includes ${text}`);assertEq(row.rows[0].displayBucket,bucket,`self bucket ${text}`);assertEq(row.rows[0].targetScope,'self',`self target ${text}`);});
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
  {featureId:'skill_effect:weakening_nullify',label:'弱化無効',matchedText:'自部隊の弱化効果を無効'},
  {featureId:'skill_effect:ally_wounded_recovery',label:'負傷兵回復',matchedText:'味方の負傷兵を回復'}
]};
const result=S.score(duplicateEntity,vaccineRule);
assertEq(result.breakdown[0].itemCount,1,'weakening_nullify evidence belongs to self_disadvantage');
assertEq(result.breakdown[2].itemCount,0,'weakening_nullify does not double score after self_disadvantage');
assertEq(result.breakdown[1].itemCount,0,'wounded recovery does not double score as generic non-damage when specific metric exists');
assertEq(result.breakdown[4].itemCount,1,'ally wounded recovery keeps the specific recovery score');
assert(S.inferTargetScope('自身を含む味方の負傷兵を回復')==='ally','targetScope ally includes self-containing ally text');
assert(S.inferTargetScope('自部隊の弱化効果を解除')==='self','targetScope self detects self text');
assert(S.inferTargetScope('敵部隊の攻撃を低下')==='enemy','targetScope enemy detects enemy text');
assert(S.inferTargetScope('知力を上昇')==='unknown','targetScope unknown remains available for no-target text');
console.log('Update09 Phase5 score targetScope regression: passed');
