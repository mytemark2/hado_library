'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const clone = value => JSON.parse(JSON.stringify(value));
const freeze = value => {Object.values(value || {}).forEach(item => {if(item && typeof item === 'object')freeze(item);}); return Object.freeze(value);};
const fixture = JSON.parse(fs.readFileSync('tools/fixtures/3_2_0_0_update07_compare_save.json','utf8'));
const [a,b] = fixture.formationData.formations;
const writes = [];
const slots = ['main','deputy1','deputy2','support1','support2'];
const equipment = ['weapon','armor','treasure'];
const advisors = ['leadership','war','intelligence','politics','charm'];
const troopApi = require('../hado_troop_skills.js');
const generals = JSON.parse(fs.readFileSync('hadou_generals.json','utf8')).items;
const findGeneral = name => generals.find(item => (item.name || '').replace(/^【[^】]*】/,'').split('（')[0] === name) || null;
const state = {saveData:freeze(clone(fixture)),formations:freeze(clone([a,b])),formationGroups:fixture.formationData.groups,
  currentFormationId:a.id,currentFormationGroupId:a.groupId,formationDirty:false,viewMode:'saved',diagnostics:{original:true},_formationClauseSurface:{original:true}};
const ctx = {state,window:{},console,document:{},setTimeout,clearTimeout,
  FORMATION_SLOT_SPECS:slots.map(key=>({key,label:key})),EQUIP_SLOT_SPECS:equipment.map(key=>({key,label:key})),ADVISOR_SLOT_SPECS:advisors.map(key=>({key,label:key})),
  findItemByDisplayName:(_,name)=>findGeneral(name),getGeneralTroopType:item=>troopApi.extractGeneralTroopType(item).troopType,
  formationDeploymentTypeLabel:key=>key==='own_city'?'自都市':'通常',
  getCurrentSave:()=>ctx.state.saveData.saves[0],sanitizeWarhorseSaveData:clone,
  getWarhorseMasterById:()=>({}),getWarhorseFixedSkillName:()=> '白龍',getFamousHorseFixedSkillLevel:()=>2,
  buildFormationClauseSurface:()=>{state._formationClauseSurface={comparison:true};return {};},
  buildFormationParameterDataUncached:formation=>{
    // Emulate existing normalizing helpers. Both mutations must affect detached copies.
    ctx.getCurrentSave().warhorses.owned['u06-horse'].name='normalized on copy';
    formation.memo='normalized on copy';
    state.formations[0].memo='normalized via global lookup on copy';
    state.diagnostics.compare=true;
    return {formation};
  },
  calculateFormationAutoScores:formation=>({totalScore:formation.id===a.id?10:15,breakdown:{evaluationTypeName:formation.evaluationTypeName,scoreRows:[{label:'攻撃',score:10,scoreDetails:[]}]}}),
  debugLog(){},localStorage:{setItem:(...args)=>writes.push(args)},
};
vm.runInNewContext(fs.readFileSync('hado_formation_compare.js','utf8'),ctx);
const api = ctx.window.HADO_FORMATION_COMPARE;
const before = JSON.stringify(state);
const originals = {save:state.saveData,formations:state.formations,diagnostics:state.diagnostics,clause:state._formationClauseSurface};
assert(api.matches(a,'攻城'));
assert(api.matches(a,'LR袁紹 騎兵'));
assert(api.matches(a,'ｌｒ袁紹'));
assert(api.matches(a,a.memo));
assert(api.matches(b,'工兵'));
assert(!api.matches(a,'存在しない部隊'));
assert(!api.matches(a,'攻城 工兵'),'multiple keywords use AND');
assert(api.matches({...a,advisorSlots:{leadership:'参軍検索確認'}},'参軍検索確認'));
assert(api.matches({...a,slots:{support2:{attendant:'侍従検索確認'}}},'侍従検索確認'));
assert(api.matches({...a,evaluationTypeName:'攻撃速度型'},'攻撃速度型'));
const delta = api.differences(a,b).filter(row=>row.changed);
assert(delta.some(row=>row.key==='main.general'));
assert(delta.some(row=>row.key==='main.weapon'));
assert(delta.some(row=>row.key==='main.position'));
assert.equal(api.differences(a,a).filter(row=>row.changed).length,0);
// Cover every slot, attendant, equipment and advisor path including missing fields.
for(const slot of slots){
  for(const key of ['general','attendant','attendantPosition']){
    const changed=clone(a);changed.slots[slot] ||= {};changed.slots[slot][key]='差分';
    assert(api.differences(a,changed).some(row=>row.changed&&row.key===`${slot}.${key==='attendantPosition'?'position':key}`));
  }
  for(const key of equipment){
    const changed=clone(a);changed.slots[slot] ||= {};changed.slots[slot].equipments ||= {};changed.slots[slot].equipments[key]='差分';
    assert(api.differences(a,changed).some(row=>row.changed&&row.key===`${slot}.${key}`));
  }
}
for(const key of advisors){const changed=clone(a);changed.advisorSlots[key]='差分';assert(api.differences(a,changed).some(row=>row.changed&&row.key===`advisor.${key}`));}
const scores = api.evaluatePair(a,b);
assert.deepEqual(Array.from(scores,score=>score.total),[10,15]);
assert.strictEqual(state.saveData,originals.save);assert.strictEqual(state.formations,originals.formations);
assert.strictEqual(state.diagnostics,originals.diagnostics);assert.strictEqual(state._formationClauseSurface,originals.clause);
assert.equal(JSON.stringify(state),before,'comparison must preserve saved data, selection, timestamps, memo, history, tray and dirty state');
const horses=api.horseSummary();
assert(horses[0].includes('騎・大固 Lv1 / 歩・大固 Lv2 / 騎・重撃 Lv3'));
assert(horses[0].includes('固有:白龍 Lv2'));assert(horses[1].includes('未設定'));
assert.equal(JSON.stringify(state),before);
ctx.calculateFormationAutoScores=()=>{throw new Error('calculation failed');};
assert.throws(()=>api.evaluatePair(a,b),/calculation failed/);
assert.strictEqual(state.saveData,originals.save);assert.strictEqual(state.formations,originals.formations);
assert.equal(JSON.stringify(state),before,'exceptions must also restore evaluation context');
state.diagnostics.circular=state.diagnostics;
assert.throws(()=>api.evaluatePair(a,b),/circular|cyclic/i);
assert.strictEqual(state.saveData,originals.save);assert.strictEqual(state.formations,originals.formations);
assert.strictEqual(state.diagnostics,originals.diagnostics,'snapshot construction failures must also restore context');
delete state.diagnostics.circular;
assert.equal(JSON.stringify(state),before);
assert.equal(writes.length,0);
const index = fs.readFileSync('index.html','utf8');
const formationSource = fs.readFileSync('hado_formation.js','utf8');
const troopGetter = formationSource.slice(formationSource.indexOf('function getGeneralTroopType(item){'),formationSource.indexOf('\nfunction extractTroopTypesFromText'));
const troopContext = {window:{HADO_TROOP_SKILLS:troopApi},norm:value=>String(value || '').trim()};
vm.runInNewContext(troopGetter+';this.readTroop=getGeneralTroopType;',troopContext);
for(const general of generals){
  const expected = troopApi.extractGeneralTroopType(general).troopType;
  if(expected)assert.equal(troopContext.readTroop(general),expected,'formation and search must share verified primary troop classification');
}
assert.equal(troopContext.readTroop(findGeneral('LR李典')),'工兵');
assert.equal(troopContext.readTroop({tables:[],sections:[]}),'','unknown types remain unclassified');
assert(index.indexOf('hado_formation.js?') < index.indexOf('hado_formation_compare.js?'));
assert(index.indexOf('hado_formation_compare.js?') < index.indexOf('hado_bootstrap.js?'));
assert(fs.readFileSync('hado_formation.js','utf8').includes('window.HADO_FORMATION_COMPARE?.mount(els.formationRoot)'));
console.log('Update07 passed: AND filters, all roster/attendant/equipment/advisor differences, current evaluation, immutable records and exception restoration, shared horse skills, runtime load order');
