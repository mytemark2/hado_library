'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'hado_share.js'), 'utf8');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'tools/fixtures/3_2_0_0_update06_share_save.json'), 'utf8'));
const horseSkills = JSON.parse(fs.readFileSync(path.join(root, 'hadou_warhorse_skills.json'), 'utf8')).items;
fixture.saves[0].warhorses.owned['u06-horse'].skills.forEach(skill => assert(horseSkills.some(item => item.name === skill.skillId), `UI fixture skill must exist: ${skill.skillId}`));
const clone = value => JSON.parse(JSON.stringify(value));
const slots = ['main', 'deputy1', 'deputy2', 'support1', 'support2'];
const labels = ['主将', '副将1', '副将2', '補佐1', '補佐2'];
const advisors = ['leadership', 'war', 'intelligence', 'politics', 'charm'];
const formation = {id:'original', groupId:'g', name:'共有確認部隊', formationName:'基本', deploymentType:'normal',
  slots:Object.fromEntries(slots.map((key, i) => [key, {general:`武将${i}`, attendant:`侍従${i}`, attendantPosition:'右下', equipments:{weapon:`武器${i}`, armor:`防具${i}`, treasure:`文物${i}`}}])),
  advisorSlots:{leadership:'参軍A'}, siegeWeapon:{name:'井闌', level:20}, ethnicArmament:{name:'藤甲',level:5,ethnicGeneralName:'異民族A'}, memo:'共有メモ', history:[{id:'private-history'}],candidateTray:[{id:'private-tray'}]};
const horse = {id:'horse1', name:'名馬A', horseMasterId:'famous', star:3,
  skills:[{skillId:'第三',level:3,slotIndex:2},{skillId:'第一',level:1,slotIndex:0},{skillId:'第二',level:2,slotIndex:1}],baseStats:{攻撃:100}};
const save = {id:'save', warhorses:{owned:{horse1:horse}, activeSlots:['horse1',null,null]}};
const elements = new Map();
const listeners = new Map();
const writes = [];
const clipboard = [];
const ctx = {console, TextEncoder,TextDecoder,Uint8Array,Blob,Response,URL,URLSearchParams,btoa,atob,
  setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},
  location:{protocol:'https:',origin:'https://example.test',pathname:'/preview/',href:'https://example.test/preview/'},
  document:{readyState:'loading',addEventListener:(type,cb)=>listeners.set(type,cb),getElementById:id=>elements.get(id)||null,querySelector:()=>null,
    createElement:()=>({dataset:{},hidden:true}),body:{appendChild:el=>elements.set(el.id,el)}},
  navigator:{},state:{formations:[formation],currentFormationId:'original',warhorseSelectedId:'horse1',formationDirty:false},els:{},
  FORMATION_SLOT_SPECS:slots.map((key,i)=>({key,label:labels[i]})),EQUIP_SLOT_SPECS:[{key:'weapon',label:'武器'},{key:'armor',label:'防具'},{key:'treasure',label:'文物'}],
  ADVISOR_SLOT_SPECS:advisors.map(key=>({key,label:key==='leadership'?'統率':key})),FORMATION_MAX_PER_GROUP:12,
  getCurrentFormation:()=>ctx.state.formations.find(f=>f.id===ctx.state.currentFormationId)||null,
  getCurrentSave:()=>save,
  getCurrentWarhorseData:()=>{throw new Error('copy must not call a mutating getter');},
  sanitizeWarhorseSaveData:data=>({owned:clone(data.owned||{}),activeSlots:clone(data.activeSlots||[null,null,null])}),
  getWarhorseMasterById:id=>id==='famous'?{kind:'famous'}:null,getWarhorseMasterKind:m=>m?.kind||'normal',
  getWarhorseSkillDisplayName:id=>id,normalizeWarhorseSkillLevel:lv=>Math.max(1,Math.min(5,Number(lv)||1)),
  normalizeWarhorseFamousStarValue:star=>star,warhorseBaseStatKeys:()=>['兵力','攻撃','防御'],
  getWarhorseFixedSkillName:()=> '固有技能A',getFamousHorseFixedSkillLevel:()=>4,
  getCurrentFormationGroup:()=>({id:'g'}),createFormationId:()=> 'new-formation',sanitizeFormationRecord:record=>clone(record),
  findItemByDisplayName:(cat,name)=>name.startsWith('不足')?null:{name},getItemDisplayName:item=>item.name,
  saveFormationDataToStorage:reason=>writes.push(reason),setMainTab(){},renderFormationScreen(){},showFormationToast(){},
  copyTextToClipboardSafe:async text=>clipboard.push(text),debugLog(){},alert:message=>{throw new Error(message);}};
ctx.state.formationMasters=[{name:'基本'}];ctx.window=ctx;
vm.createContext(ctx);vm.runInContext(source,ctx);
function freeze(value){Object.values(value).forEach(v=>{if(v&&typeof v==='object')freeze(v);});Object.freeze(value);return value;}
freeze(formation);freeze(save);
const before=JSON.stringify({formation,save});
async function action(name){const button={dataset:{hadoShareAction:name},disabled:false,textContent:'copy'};await listeners.get('click')({preventDefault(){},target:{closest:selector=>selector==='[data-hado-share-action]'?button:null}});}
async function confirm(){await listeners.get('click')({preventDefault(){},target:{closest:selector=>selector==='[data-hado-share-confirm]'?{}:null}});}
(async()=>{
  const api=ctx.HadoShare;
  const text=api.buildFormationCopyText();
  slots.forEach((key,i)=>assert(text.includes(`${labels[i]}：武将${i}｜侍従：侍従${i}（右下）｜武器：武器${i}｜防具：防具${i}｜文物：文物${i}`)));
  assert(text.includes('統率：参軍A'));
  assert(text.includes('井闌 Lv20')&&text.includes('藤甲 Lv5')&&text.includes('異民族A'));
  assert(text.includes('通常技能：第一 Lv1 / 第二 Lv2 / 第三 Lv3'));
  assert(text.includes('固有技能：固有技能A Lv4')&&text.includes('攻撃100'));
  assert(text.includes('軍馬2：未設定')&&text.includes('軍馬3：未設定'));
  assert(!text.includes('private-history')&&!text.includes('private-tray'));
  await action('formation-copy');assert.strictEqual(clipboard.pop(),text);
  await action('warhorse-copy');assert(clipboard.pop().includes('第一 Lv1 / 第二 Lv2 / 第三 Lv3'));
  await action('formation-link');
  const link=clipboard.pop();const payload=await api.decodePayload(new URL(link).searchParams.get('share'));
  assert.strictEqual(payload.v,1);assert.strictEqual(payload.data.warhorseReference.length,3);
  assert.strictEqual(api.buildFormationCopyText(payload.data),text,'link preview and copied text must represent the same snapshot');
  assert(!('history' in payload.data)&&!('candidateTray' in payload.data));
  assert.strictEqual(JSON.stringify({formation,save}),before,'copy and link generation must not mutate saved records');
  assert.strictEqual(writes.length,0,'copy must not persist any data');
  payload.data.advisorSlots.leadership='不足参軍';payload.data.slots.main.equipments.weapon='不足武器';payload.data.name='<script>unsafe</script>';
  ctx.location.href=await api.buildShareUrl('formation',payload.data);ctx.state._incomingHadoShareHandled=false;
  await api.applyIncomingShareLink();
  const dialog=elements.get('hadoShareImportDialog');
  assert(dialog.innerHTML.includes('共有された編成を確認')&&dialog.innerHTML.includes('軍馬は参照情報'));
  assert(dialog.innerHTML.includes('&lt;script&gt;unsafe&lt;/script&gt;')&&!dialog.innerHTML.includes('<script>unsafe</script>'));
  assert(ctx.state._pendingHadoShareImport.missing.some(v=>v.includes('不足参軍')));
  assert.strictEqual(ctx.state.formations.length,1,'opening link must not auto-import');
  // Cancel is a read-only operation too.
  await listeners.get('click')({preventDefault(){},target:{closest:selector=>selector==='[data-hado-share-cancel]'?{}:null}});
  assert.strictEqual(ctx.state.formations.length,1);assert.strictEqual(writes.length,0);
  ctx.state._incomingHadoShareHandled=false;await api.applyIncomingShareLink();await confirm();
  assert.strictEqual(ctx.state.formations.length,2);assert.strictEqual(ctx.state.formations[0],formation);
  assert.strictEqual(ctx.state.formations[1].slots.main.equipments.weapon,'');
  assert.strictEqual(ctx.state.formations[1].advisorSlots.leadership,'');
  assert.strictEqual(ctx.state.formations[1].slots.deputy1.attendantPosition,'右下');
  assert.strictEqual(JSON.stringify(save),JSON.stringify(JSON.parse(before).save),'import must preserve registered horses and assignments');
  const legacy=clone(payload.data);delete legacy.warhorseReference;
  assert(api.buildFormationCopyText(legacy).includes('このリンクには含まれていません'));
  const oldEncoded=await api.encodePayload({v:1,kind:'formation',app:'3.1.1.0',data:legacy});
  assert.strictEqual((await api.decodePayload(oldEncoded)).app,'3.1.1.0');
  await assert.rejects(api.decodePayload(await api.encodePayload({v:1,kind:'formation',data:null})),/形式/);
  await assert.rejects(api.buildShareUrl('formation',{memo:'長'.repeat(25000)}),/上限/);
  console.log('Update06 formation sharing passed: 5 roster lines, advisors, 3 horse skills, immutable copy, snapshot roundtrip, preview/cancel, append-only import, legacy and missing-data guards');
})().catch(error=>{console.error(error);process.exitCode=1;});
