'use strict';
const assert=require('assert'),path=require('path');
const {runtimeHarness,expectedStageText,assertEquipmentSearchContract}=require('./equipment_search_contract');
const runtime=runtimeHarness(path.resolve(__dirname,'..'));
// Owned examples, independent of the current game data.
const fixture=[
 {name:'段階検証A',baseSearchText:'武器',equipmentStageSearchText:{initial:'初期 技能a 5%回復',ssrMax:'ssr最大 技能a 15%回復',urMax:'ur最大 技能a 25%回復'}},
 {name:'UR追加検証B',baseSearchText:'防具',equipmentStageSearchText:{initial:'初期 技能b 攻撃上昇',ssrMax:'ssr最大 技能b 防御上昇',urMax:'ur最大 技能b 負傷兵を20%回復'}}
];
for(const stage of ['initial','ssrMax','urMax']){runtime.state.stage=stage;assert.deepStrictEqual(fixture.filter(row=>runtime.getText(row).includes('回復')).map(row=>row.name),stage==='urMax'?['段階検証A','UR追加検証B']:['段階検証A']);}
runtime.state.stage='initial';assert(runtime.getText(fixture[0]).includes('5%回復'));assert(!runtime.getText(fixture[0]).includes('25%回復'));
runtime.state.stage='urMax';assert(runtime.getText(fixture[0]).includes('25%回復'));
const changed=structuredClone(fixture[1]);changed.name='改名された装備';changed.equipmentStageSearchText.urMax='ur最大 技能c 30%回復';assert(runtime.getText(changed).includes('30%回復'));
changed.equipmentStageSearchText.urMax='ur最大 技能c 攻撃上昇';assert(!runtime.getText(changed).includes('回復'));
const primary={items:[{url:'https://example.invalid/1'}]};
const source={items:[{name:'検証',stages:Object.fromEntries(['initial','ssrMax','urMax'].map(key=>[key,{label:key,skills:[{skillName:'検証技能',text:key==='urMax'?'20%回復':'攻撃上昇'}]}]))}],qualityAudit:{duplicateMergeAudit:{ok:true}}};
const search={items:[{category:'equipments',name:'検証',sourceUrl:primary.items[0].url,equipmentStageSearchText:Object.fromEntries(Object.entries(source.items[0].stages).map(([key,stage])=>[key,expectedStageText(stage,key)]))}],qualityAudit:{equipmentStageCoverage:{ok:true}}};
assertEquipmentSearchContract(primary,source,search);
for(const corrupt of [
 value=>{delete value.items[0].equipmentStageSearchText.urMax;},
 value=>{value.items[0].equipmentStageSearchText.initial+=' 20%回復';},
 value=>{value.items[0].equipmentStageSearchText.urMax='urMax 技能欠落';},
 value=>{value.items=[];}
]){const broken=structuredClone(search);corrupt(broken);assert.throws(()=>assertEquipmentSearchContract(primary,source,broken));}
const brokenSource=structuredClone(source);delete brokenSource.items[0].stages.urMax;
assert.throws(()=>assertEquipmentSearchContract(primary,brokenSource,search));
console.log('equipment fixture: additions, UR upgrades, renames, ability changes/removal and stage isolation passed');
