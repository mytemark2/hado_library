'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const advice = require('../hado_formation_advice.js');

const cap = '敵部隊からの1回の通常攻撃、1回の戦法によるダメージの上限が5000になる（連鎖攻撃の場合、連鎖攻撃ごとに上限が5000になる）';
assert.deepEqual(advice.classify(cap), ['hit_cap']);
assert.deepEqual(advice.classify('戦法の攻撃威力を200％に固定した状態で被ダメージを計算する'), ['power_ceiling']);
assert.deepEqual(advice.classify('自部隊の兵器が受けるダメージ-30%'), ['siege_survival']);
assert(!advice.classify('敵部隊の戦法速度-20%').includes('opening'));
const summarized = advice.summarize([
  {source:'李典',slot:'main',skill:'兼才',rawText:cap,state:'confirmed',metrics:['hit_cap']},
  {source:'李典',slot:'main',skill:'兼才',rawText:cap,state:'confirmed',metrics:['hit_cap']},
  {source:'馬良',slot:'deputy1',rawText:cap,state:'conditional',metrics:['hit_cap']}
]);
assert.equal(summarized.hit_cap.cap, 5000);
assert.equal(summarized.hit_cap.confirmed, 1);
assert.equal(summarized.hit_cap.conditional, 1);
const oneEffect = value => advice.summarize([{source:'A',slot:'main',rawText:'兵器速度+'+value+'%',state:'confirmed',metrics:['siege_speed']}]);
assert(advice.compareMetrics(oneEffect(10),oneEffect(25),['siege_speed']) > 0);
assert.throws(()=>advice.rankInputs({priorities:['hit_cap','hit_cap']},{}),/priorities/);

const source = readFileSync('hado_formation_webmcp.js','utf8');
const slotKeys=['main','deputy1','deputy2','support1','support2'];
const createSlot = () => ({general:'',attendant:'',attendantPosition:'',equipments:{weapon:'',armor:'',treasure:''}});
const initialFormation = {id:'fixture-base',groupId:'group1',name:'DO NOT SHARE',memo:'DO NOT SHARE',formationName:'基本',deploymentType:'normal',
  slots:Object.fromEntries(slotKeys.map((key,i)=>[key,{...createSlot(),general:['LR李典','LR曹仁','UR甲','UR乙','UR丙'][i]}])),
  advisorSlots:{},siegeWeapon:{name:'木獣',level:3},ethnicArmament:{}};
const records = {
  LR李典:[{condition:'部隊内（主将/副将/補佐）とその侍従に曹操/曹仁/夏侯惇/張遼/楽進/程昱のうち1人以上いる場合',line:cap,skill:'兼才'},
    {condition:'主将の際',line:'兵器速度+25%',skill:'兵器整備'}],
  LR曹仁:[{condition:'常に',line:'通常攻撃による被ダメージ-15%',skill:'守備'}],
  UR甲:[{condition:'常に',line:'弱化効果を無効化する',skill:'弱化対策'}],
  UR乙:[{condition:'常に',line:'兵器による与ダメージ+20%',skill:'兵器攻撃'}],
  UR戊:[{condition:'常に',line:'副将の連鎖確率+2%',skill:'連鎖'}]
};
const save={id:'test-save',name:'DO NOT SHARE',generals:['LR李典','LR曹仁','UR甲','UR乙','UR丙','UR丁','UR戊'],equipments:[],generalStars:{LR李典:4}};
const privateSave={id:'other-save',generals:[],equipments:[]};
const state={viewMode:'all',showRawJson:false,diagnostics:{preserved:true},
  saveData:{currentSaveId:save.id,saves:[save,privateSave]},currentFormationId:initialFormation.id,
  formations:[initialFormation],formationGroups:[{id:'group1'}],generals:save.generals.map(name=>({name})),equipments:[],
  formationMasters:[{name:'基本'}],siegeWeapons:[{name:'木獣'}],skills:[]};

function element() {
  return {hidden:false,textContent:'',events:{},addEventListener(key,value){this.events[key]=value;}};
}
const nodes={section:element(),button:element(),status:element(),form:element(),pre:element(),select:element(),args:element(),save:element()};
nodes.select.add = function () {};
nodes.form.elements={tool:nodes.select,args:nodes.args};
nodes.form.querySelector=()=>nodes.pre;
nodes.section.querySelector=selector=>({'button':nodes.button,'[role="status"]':nodes.status,form:nodes.form})[selector];
let mountCount=0;
const native = new Map();
const document={readyState:'complete',createElement:()=>nodes.section,getElementById:id=>({
  saveSelect:nodes.save,appTitlePanel:{after(){mountCount++;}}
})[id],modelContext:{
  async registerTool(tool,opts) {native.set(tool.name,tool);opts.signal.addEventListener('abort',()=>native.delete(tool.name));}
}};
const context={
  location:{protocol:'https:',search:''},document,navigator:{},URLSearchParams,AbortController,Option:function () {},state,
  setTimeout:()=>0,clearTimeout(){},debugLog(){},
  window:{HadoFormationAdvice:advice,HADO_APP_DISPLAY_VERSION:'fixture',addEventListener(){},HADO_DATA_UPDATE_STATUS:{
    reflection:{status:'passed'},provenance:{acquiredAt:'2026-11-08T00:00:00Z',processedAt:'2026-11-14T00:00:00Z'}
  }},
  FORMATION_SLOT_SPECS:slotKeys.map(key=>({key})),EQUIP_SLOT_SPECS:['weapon','armor','treasure'].map(key=>({key,type:key})),
  ADVISOR_SLOT_SPECS:[],FORMATION_DEPLOYMENT_TYPE_OPTIONS:[{key:'normal'}],
  normalizeSaveItemName:value=>String(value||''),getCurrentSave:()=>state.saveData.saves.find(row=>row.id===state.saveData.currentSaveId),
  getAllDataItemsByCategory:category=>state[category]||[],getItemDisplayName:item=>item?.name||'',
  findItemByDisplayName:(category,name)=>state[category]?.find(row=>row.name===name),
  createFormationSlot:createSlot,sanitizeFormationSlot:row=>({...createSlot(),...row}),createFormationAdvisorSlots:()=>({}),
  sanitizeFormationAdvisorSlots:()=>({}),createFormationSiegeWeaponSelection:()=>({name:'',level:0}),
  createFormationEthnicArmamentSelection:()=>({name:'',level:0,ethnicGeneralName:''}),normalizeFormationEquipmentDuplicateKey:x=>x,
  getFormationExtensionMaxLevel:()=>20,getEquipmentType:()=>'',formationWeaponCandidateMatchesTroop:()=>true,canAssignFormationEquipmentToSlot:()=>({ok:true}),
  computeFormationJijuAvailability:()=>({bySlot:{}}),canAssignJijuAttendantByCondition:()=>false,isFormationRoleCandidateAllowed:()=>false,
  normalizeGeneralComparableName:name=>name.replace(/^(LR|UR)/,''),extractCompatibleGeneralNames:()=>[],
  formationSlotLabel:slot=>({main:'主将',deputy1:'副将1',deputy2:'副将2',support1:'補佐1',support2:'補佐2'})[slot],
  collectFormationParameterSourceRecords:item=>(records[item?.name]||[]).map(record=>({kind:'include',source:'技能:'+record.skill,text:record})),
  splitSkillConditionBlocks:({condition,line})=>[{condition,segments:['■'+condition,'●'+line]}],
  getCurrentStarValue:(category,name)=>state.saveData.saves[0].generalStars[name]||0,getEffectiveEquipmentStageForEquipmentName:()=>null,
  buildFormationParameterDataUncached:()=>{assert.equal(state.viewMode,'saved');return {};},
  getFormationExtensionSelectionEntry:()=>null,getFormationTacticActivationOrderRows:()=>[],collectFormationTacticAttackRows:()=>[]
};
const snapshot = () => JSON.stringify(state);

(async () => {
  vm.runInNewContext(source,context);
  assert.equal(mountCount,0);
  context.location.search='?chatgpt=formation';
  vm.runInNewContext(source,context);
  assert.equal(mountCount,1);
  assert.equal(native.size,0);
  await nodes.button.events.click({isTrusted:false});
  assert.equal(native.size,0);
  await nodes.button.events.click({isTrusted:true});
  assert.equal(native.size,3);
  const before=snapshot();
  const rpc=async (key,args)=>JSON.parse(await native.get('hado_formation_'+key).execute(args));
  const info=await rpc('context',{checkNames:['LR李典','LR徐盛']});
  assert.equal(info.ok,true);
  assert.equal(info.data.ready,true);
  assert.equal(info.coverage[0].owned,true);
  assert.equal(info.coverage[1].inGameData,false);
  assert(!JSON.stringify(info).includes('DO NOT SHARE'));
  const result=await rpc('search',{baseId:'1',fixedMain:'LR李典',purpose:'defense'});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert(result.candidates.length>0);
  assert.equal(result.candidates[0].metrics.hit_cap.cap,5000);
  assert.equal(result.candidates[0].ownership[0].general.stars,4);
  const candidate=result.candidates[0].formation;
  assert.equal((await rpc('evaluate',{baseId:'1',purpose:'defense',formation:candidate})).ok,true);
  const missingCompanion=structuredClone(candidate);
  missingCompanion.slots[slotKeys.find(slot=>candidate.slots[slot].general==='LR曹仁')].general='UR丁';
  assert.equal((await rpc('evaluate',{baseId:'1',purpose:'defense',formation:missingCompanion})).result.metrics.hit_cap.cap,null);
  const duplicate=structuredClone(candidate);
  duplicate.slots.deputy1.general='LR李典';
  assert.equal((await rpc('evaluate',{baseId:'1',purpose:'defense',formation:duplicate})).ok,false);
  const siege=await rpc('search',{baseId:'1',fixedMain:'LR李典',purpose:'siege',target:'wall'});
  assert(siege.candidates.length>0,JSON.stringify(siege));
  assert.equal(siege.candidates[0].metrics.siege_speed.strongestConfirmedPercent,25);
  assert.equal(siege.candidates[0].model.siege.totalDamage,null);
  assert.equal(snapshot(),before);
  const old=native.get('hado_formation_context').execute;
  state.saveData.currentSaveId=privateSave.id;
  assert.equal(JSON.parse(await old({})).ok,false);
  assert.equal(native.size,0);
  state.saveData.currentSaveId=save.id;

  // The opt-in tab works in the browser even when native WebMCP is unavailable.
  document.modelContext=undefined;
  await nodes.button.events.click({isTrusted:true});
  assert.equal(nodes.form.hidden,false);
  nodes.select.value='hado_formation_context';
  nodes.args.value='{}';
  nodes.form.events.submit({preventDefault(){}});
  assert.equal(JSON.parse(nodes.pre.textContent).ok,true);
  nodes.save.events.change();
  assert.equal(nodes.form.hidden,true);
  assert.equal(nodes.pre.textContent,'');
  assert.equal(snapshot(),before);
  const html=readFileSync('index.html','utf8');
  assert(html.indexOf('hado_formation.js?') < html.indexOf('hado_formation_advice.js?'));
  assert(html.indexOf('hado_formation_advice.js?') < html.indexOf('hado_formation_webmcp.js?'));
  console.log('Update09 browser formation search and saved-data boundary passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
