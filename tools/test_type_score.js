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
console.log('Update07.1 type-score regression: passed');
