/* Regression tests for HADO app Update07.1 rule-based type scoring */
global.window={};
require('../hado_type_score.js');
const S=window.HadoTypeScore;
function assertEq(actual,expected,label){if(actual!==expected)throw new Error(`${label}: expected ${expected}, actual ${actual}`)}
const rule={metrics:[
  {metricKey:'troops',label:'兵力',method:'percent_sum'},
  {metricKey:'weakening_nullify',label:'弱化無効',method:'presence_fixed',basis:100},
  {metricKey:'normal_attack_target_count',label:'通常攻撃対象数',method:'baseline_ratio',basis:{baselineIncrement:1,baselinePoints:100}},
  {metricKey:'attack_speed',label:'攻撃速度',method:'percent_sum'},
  {metricKey:'chain_rate',label:'連鎖率',method:'percent_sum'}
]};
const entity={typeFeatures:[
  {featureId:'parameter:troops',label:'兵力',matchedText:'●部隊の兵力+20%'},
  {featureId:'skill_effect:weakening_nullify',label:'弱化無効',matchedText:'●弱化無効'},
  {featureId:'skill_effect:normal_attack_target_count',label:'通常攻撃対象数',matchedText:'●通常攻撃対象部隊数+1'},
  {featureId:'parameter:attack_speed',label:'攻撃速度',matchedText:'●攻撃速度+25%'},
  {featureId:'skill_effect:chain_rate',label:'連鎖確率',matchedText:'■主将の際 ●副将の連鎖確率+5%'}
]};
const r=S.score(entity,rule);
assertEq(r.confirmedScore,4.9,'confirmedScore');
assertEq(r.conditionalMaxScore,5,'conditionalMaxScore');
assertEq(r.matchedCount,5,'matchedCount');
assertEq(S.summary(r),'兵力:0.4/2 / 弱化無効:2/2 / 通常攻撃対象数:2/2 / 攻撃速度:0.5/2 / 連鎖率:0→0.1/2','summary');

const roleRule={metrics:[
  {metricKey:'chain_rate',label:'連鎖率',method:'percent_sum'},
  {metricKey:'attack_speed',label:'攻撃速度',method:'percent_sum'},
  {metricKey:'normal_attack_target_count',label:'通常攻撃対象数',method:'baseline_ratio',basis:{baselineIncrement:1,baselinePoints:100}}
]};
const roleLimited={roleId:'main_general',typeFeatures:[
  {featureId:'skill_effect:chain_rate',label:'連鎖確率',matchedText:'■副将の際 ●副将の連鎖確率+5% 技能Lv3'},
  {featureId:'parameter:attack_speed',label:'攻撃速度',matchedText:'■主将の際 ●攻撃速度+20% 技能Lv2'},
  {featureId:'skill_effect:normal_attack_target_count',label:'通常攻撃対象数',matchedText:'■主将の際 ●通常攻撃対象部隊数+1 技能Lv5'}
]};
const rr=S.score(roleLimited,roleRule);
assertEq(rr.confirmedScore,0,'role confirmedScore');
assertEq(rr.conditionalMaxScore,2.4,'role conditionalMaxScore');
assertEq(rr.matchedCount,2,'role matchedCount');
assertEq(S.metricRows(roleLimited,roleRule.metrics[0]).length,0,'vice-only chain excluded for main role');
assertEq(S.metricRows({...roleLimited,roleId:'vice_general'},roleRule.metrics[0]).length,1,'vice-only chain included for vice role');

const mainOnlyMixedText='LRテストの戦法 効果自身を含む味方4部隊の攻撃速度を100％上昇（この武将が主将の場合、戦法の敵対象部隊数が6部隊になる）（対象部隊の主将とこの武将が好相性の際、効果量が2倍になる）';
const mixedRule={typeId:'mixed-main-only',typeName:'主将限定混在',metrics:[{metricKey:'enemy_target_count',label:'敵対象部隊数',method:'presence_fixed',basis:100}]};
const mainMixed=window.HadoTypeScore.score({roleId:'main_general',displayName:'主将候補',typeFeatures:[{featureId:'skill_effect:enemy_target_count',label:'敵対象部隊数',matchedText:mainOnlyMixedText}]},mixedRule);
assertEq(mainMixed.matchedCount,1,'mixed text main-only should match main role');
const viceMixed=window.HadoTypeScore.score({roleId:'vice_general',displayName:'副将候補',typeFeatures:[{featureId:'skill_effect:enemy_target_count',label:'敵対象部隊数',matchedText:mainOnlyMixedText}]},mixedRule);
assertEq(viceMixed.matchedCount,0,'mixed text main-only should not match vice role');

const bulletScopedText='■主将の際 ●通常攻撃対象部隊数+1。■副将の際 ●連鎖確率+2%。';
const bulletRule={typeId:'bullet-role-scope',typeName:'役割見出しスコープ',metrics:[{metricKey:'normal_attack_target_count',label:'通常攻撃対象数',method:'presence_fixed',basis:100},{metricKey:'chain_rate',label:'連鎖確率',method:'presence_fixed',basis:100}]};
const bulletMain=window.HadoTypeScore.score({roleId:'main_general',displayName:'主将候補',typeFeatures:[{featureId:'skill_effect:normal_attack_target_count',label:'通常攻撃対象数',matchedText:bulletScopedText},{featureId:'skill_effect:chain_rate',label:'連鎖確率',matchedText:bulletScopedText}]},bulletRule);
assertEq(bulletMain.matchedCount,1,'bullet scoped main should only match main clause');
const bulletVice=window.HadoTypeScore.score({roleId:'vice_general',displayName:'副将候補',typeFeatures:[{featureId:'skill_effect:normal_attack_target_count',label:'通常攻撃対象数',matchedText:bulletScopedText},{featureId:'skill_effect:chain_rate',label:'連鎖確率',matchedText:bulletScopedText}]},bulletRule);
assertEq(bulletVice.matchedCount,1,'bullet scoped vice should only match vice clause');
assertEq(window.HadoTypeScore.metricRows({roleId:'vice_general',typeFeatures:[{featureId:'skill_effect:normal_attack_target_count',label:'通常攻撃対象数',matchedText:bulletScopedText}]},bulletRule.metrics[0]).length,0,'main bullet should not leak to vice role');

console.log('Update08.21 type-score regression: passed');
