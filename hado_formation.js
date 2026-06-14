'use strict';
/* HADO formation editor and formation calculations */
// FEATURE[HADO-2.1.2.0-FORMATION]: 簡易部隊編成データ・UI・追加処理
const FORMATION_SLOT_SPECS=[{key:'main',label:'主将'},{key:'deputy1',label:'副将1'},{key:'deputy2',label:'副将2'},{key:'support1',label:'補佐1'},{key:'support2',label:'補佐2'}];
const EQUIP_SLOT_SPECS=[{key:'weapon',label:'武器',type:'武器'},{key:'armor',label:'防具',type:'防具'},{key:'treasure',label:'文物',type:'文物'}];
const ADVISOR_SLOT_SPECS=[{key:'leadership',label:'統率'},{key:'war',label:'武力'},{key:'intelligence',label:'知力'},{key:'politics',label:'政治'},{key:'charm',label:'魅力'}];
const FORMATION_DEPLOYMENT_TYPE_OPTIONS=[{key:'normal',label:'通常'},{key:'own_city',label:'自都市'},{key:'station',label:'詰所'}];
const FORMATION_MAX_GROUPS=5;
const FORMATION_MAX_PER_GROUP=12;
const FORMATION_HISTORY_LIMIT=10;
function createFormationId(){return 'formation_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
function createFormationSlot(){return {general:'',attendant:'',attendantPosition:'',equipments:{weapon:'',armor:'',treasure:''}};}
function createFormationAdvisorSlots(){const out={};ADVISOR_SLOT_SPECS.forEach(s=>out[s.key]='');return out;}
function sanitizeFormationAdvisorSlots(v){const out=createFormationAdvisorSlots();Object.entries(v||{}).forEach(([key,val])=>{if(Object.prototype.hasOwnProperty.call(out,key))out[key]=normalizeSaveItemName(val||'');});return out;}
function createFormationSiegeWeaponSelection(){return {name:'',level:0};}
function createFormationEthnicArmamentSelection(){return {name:'',level:0,ethnicGeneralName:''};}
function getFormationExtensionCategory(selectionKey){return selectionKey==='siegeWeapon'?'siegeWeapons':selectionKey==='ethnicArmament'?'ethnicArmaments':'';}
function getFormationExtensionDefaultMaxLevel(selectionKey){return selectionKey==='siegeWeapon'?20:selectionKey==='ethnicArmament'?5:0;}
function getFormationExtensionItem(selectionKey,name){const category=getFormationExtensionCategory(selectionKey);return category?findItemByDisplayName(category,name):null;}
function getFormationExtensionMaxLevel(selectionKey,name){const item=getFormationExtensionItem(selectionKey,name);return getHadouExtensionMaxLevel(item)||getFormationExtensionDefaultMaxLevel(selectionKey);}
function normalizeFormationExtensionLevel(selectionKey,name,level){const n=normalizeSaveItemName(name||'');if(!n)return 0;const max=getFormationExtensionMaxLevel(selectionKey,n);let lv=Number(level)||max;if(max)lv=Math.max(1,Math.min(max,lv));return lv||0;}
function sanitizeFormationSiegeWeaponSelection(v){const name=normalizeSaveItemName(v?.name||'');return {name,level:normalizeFormationExtensionLevel('siegeWeapon',name,v?.level)};}
function sanitizeFormationEthnicArmamentSelection(v){const name=normalizeSaveItemName(v?.name||'');return {name,level:normalizeFormationExtensionLevel('ethnicArmament',name,v?.level),ethnicGeneralName:normalizeSaveItemName(v?.ethnicGeneralName||'')};}
function normalizeFormationMasterName(name){const n=norm(name||'');const items=Array.isArray(state.formationMasters)?state.formationMasters:[];if(!items.length)return n||'基本';if(n&&items.some(item=>norm(item?.name||item?.title||'')===n))return n;if(items.some(item=>norm(item?.name||item?.title||'')==='基本'))return '基本';return items[0]?norm(items[0].name||items[0].title||''):(n||'基本');}
function normalizeFormationDeploymentType(value){const v=norm(value||'');return FORMATION_DEPLOYMENT_TYPE_OPTIONS.some(o=>o.key===v)?v:'normal';}
function formationDeploymentTypeLabel(value){const v=normalizeFormationDeploymentType(value);return FORMATION_DEPLOYMENT_TYPE_OPTIONS.find(o=>o.key===v)?.label||'通常';}
function createFormationRecord(name='新規部隊'){const slots={};FORMATION_SLOT_SPECS.forEach(s=>slots[s.key]=createFormationSlot());const groupId=state?.currentFormationGroupId||'group_1';return {id:createFormationId(),groupId,name:norm(name)||'新規部隊',formationName:'基本',deploymentType:'normal',slots,advisorSlots:createFormationAdvisorSlots(),siegeWeapon:createFormationSiegeWeaponSelection(),ethnicArmament:createFormationEthnicArmamentSelection(),evaluationTypeId:'',evaluationTypeName:'',totalScore:0,evaluationScore:0,memo:'',history:[],candidateTray:[],updatedAt:new Date().toISOString()};}
function sanitizeFormationSlot(slot){return {general:normalizeSaveItemName(slot?.general||''),attendant:normalizeSaveItemName(slot?.attendant||''),attendantPosition:normalizeJijuPositionValue(slot?.attendantPosition||'')||'',equipments:{weapon:normalizeSaveItemName(slot?.equipments?.weapon||''),armor:normalizeSaveItemName(slot?.equipments?.armor||''),treasure:normalizeSaveItemName(slot?.equipments?.treasure||'')}};}
function sanitizeFormationCandidateTray(v){return (Array.isArray(v)?v:[]).map((x,i)=>({id:norm(x?.id||('tray_'+i)),roleId:norm(x?.roleId||''),name:normalizeSaveItemName(x?.name||''),typeId:norm(x?.typeId||''),typeName:norm(x?.typeName||''),source:norm(x?.source||'型候補一覧'),addedAt:norm(x?.addedAt||'')})).filter(x=>x.roleId&&x.name).slice(0,100);}
function sanitizeFormationHistory(v){return (Array.isArray(v)?v:[]).map(x=>({id:norm(x?.id||createFormationId()),savedAt:norm(x?.savedAt||x?.updatedAt||new Date().toISOString()),evaluationTypeId:norm(x?.evaluationTypeId||''),evaluationTypeName:norm(x?.evaluationTypeName||''),totalScore:Math.max(0,Math.min(10,Number(x?.totalScore)||0)),evaluationScore:Math.max(0,Math.min(10,Number(x?.evaluationScore)||0)),memo:norm(x?.memo||'')})).filter(x=>x.savedAt).slice(0,FORMATION_HISTORY_LIMIT);}
function sanitizeFormationRecord(f){const slots={};FORMATION_SLOT_SPECS.forEach(s=>slots[s.key]=sanitizeFormationSlot(f?.slots?.[s.key]||{}));const totalScore=Math.max(0,Math.min(10,Number(f?.totalScore)||0));const evaluationScore=Math.max(0,Math.min(10,Number(f?.evaluationScore ?? totalScore)||0));return {id:norm(f?.id||createFormationId()),groupId:norm(f?.groupId||'group_1'),name:norm(f?.name||'新規部隊'),formationName:normalizeFormationMasterName(f?.formationName||f?.formation||'基本'),deploymentType:normalizeFormationDeploymentType(f?.deploymentType||f?.formationDeployType||'normal'),slots,advisorSlots:sanitizeFormationAdvisorSlots(f?.advisorSlots||f?.advisors||{}),siegeWeapon:sanitizeFormationSiegeWeaponSelection(f?.siegeWeapon||{}),ethnicArmament:sanitizeFormationEthnicArmamentSelection(f?.ethnicArmament||{}),evaluationTypeId:norm(f?.evaluationTypeId||''),evaluationTypeName:norm(f?.evaluationTypeName||''),totalScore,evaluationScore,memo:norm(f?.memo||''),history:sanitizeFormationHistory(f?.history||[]),candidateTray:sanitizeFormationCandidateTray(f?.candidateTray||[]),updatedAt:norm(f?.updatedAt||new Date().toISOString())};}
function createFormationGroup(label='グループ1',id=''){return {id:norm(id||('group_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,5))),name:norm(label)||'グループ'};}
function sanitizeFormationGroups(v){const rows=(Array.isArray(v)?v:[]).map((g,i)=>createFormationGroup(g?.name||`グループ${i+1}`,g?.id||`group_${i+1}`)).filter(g=>g.id).slice(0,FORMATION_MAX_GROUPS);if(!rows.length)rows.push(createFormationGroup('グループ1','group_1'));return rows;}
function sanitizeFormationData(data){const groups=sanitizeFormationGroups(data?.groups);const validGroupIds=new Set(groups.map(g=>g.id));const counts={};const formations=(Array.isArray(data?.formations)?data.formations:[]).map(sanitizeFormationRecord).map(f=>{if(!validGroupIds.has(f.groupId))f.groupId=groups[0].id;return f;}).filter(f=>{counts[f.groupId]=(counts[f.groupId]||0)+1;return counts[f.groupId]<=FORMATION_MAX_PER_GROUP;});let currentFormationGroupId=norm(data?.currentFormationGroupId||data?.currentGroupId||groups[0].id);if(!validGroupIds.has(currentFormationGroupId))currentFormationGroupId=groups[0].id;let currentFormationId=norm(data?.currentFormationId||'');if(currentFormationId&&!formations.some(f=>f.id===currentFormationId))currentFormationId='';if(!currentFormationId&&formations.length){currentFormationId=(formations.find(f=>f.groupId===currentFormationGroupId)||formations[0]).id;}return {groups,currentFormationGroupId,formations,currentFormationId};}
function loadFormationData(){try{const raw=localStorage.getItem(FORMATION_STORAGE_KEY);const data=raw?sanitizeFormationData(JSON.parse(raw)):sanitizeFormationData({});state.formationGroups=data.groups;state.currentFormationGroupId=data.currentFormationGroupId;state.formations=data.formations;state.currentFormationId=data.currentFormationId;if(!state.formations.length){const f=createFormationRecord('攻城戦A');state.formationGroups=data.groups||sanitizeFormationGroups([]);state.currentFormationGroupId=state.formationGroups[0].id;f.groupId=state.currentFormationGroupId;state.formations=[f];state.currentFormationId=f.id;}state.formationDirty=false;debugLog('formation:load',{count:state.formations.length,currentFormationId:state.currentFormationId});}catch(err){debugLog('formation:load-error',{message:err?.message||String(err)});state.formationGroups=sanitizeFormationGroups([]);state.currentFormationGroupId=state.formationGroups[0].id;const f=createFormationRecord('攻城戦A');f.groupId=state.currentFormationGroupId;state.formations=[f];state.currentFormationId=f.id;state.formationDirty=false;}}
function saveFormationDataToStorage(context=''){try{const data=sanitizeFormationData({groups:state.formationGroups,currentFormationGroupId:state.currentFormationGroupId,formations:state.formations,currentFormationId:state.currentFormationId});localStorage.setItem(FORMATION_STORAGE_KEY,JSON.stringify(data));state.formationGroups=data.groups;state.currentFormationGroupId=data.currentFormationGroupId;state.formations=data.formations;state.currentFormationId=data.currentFormationId;debugLog('formation:storage-save',{context,count:state.formations.length,currentFormationId:state.currentFormationId});return true;}catch(err){debugLog('formation:storage-save-error',{context,message:err?.message||String(err)});return false;}}
function persistFormationData(){try{const ok=saveFormationDataToStorage('manual-save');if(!ok)throw new Error('localStorage save failed');state.formationDirty=false;debugLog('formation:persist',{count:state.formations.length,currentFormationId:state.currentFormationId});renderFormationScreen();showFormationToast('部隊編成を保存しました');return true;}catch(err){debugLog('formation:persist-error',{message:err?.message||String(err)});window.alert('部隊編成の保存に失敗しました: '+(err?.message||String(err)));return false;}}
function getCurrentFormation(){return (state.formations||[]).find(f=>f.id===state.currentFormationId)||null;}
function ensureCurrentFormation(){let f=getCurrentFormation();if(f)return f;f=createFormationRecord('攻城戦A');state.formations=Array.isArray(state.formations)?state.formations:[];state.formations.push(f);state.currentFormationId=f.id;state.formationDirty=true;return f;}

function getCurrentFormationGroup(){const groups=sanitizeFormationGroups(state.formationGroups||[]);if(!state.currentFormationGroupId||!groups.some(g=>g.id===state.currentFormationGroupId))state.currentFormationGroupId=groups[0].id;state.formationGroups=groups;return groups.find(g=>g.id===state.currentFormationGroupId)||groups[0];}
function getVisibleFormations(){const group=getCurrentFormationGroup();return (state.formations||[]).filter(f=>(f.groupId||group.id)===group.id);}
function ensureCurrentFormationInCurrentGroup(){const group=getCurrentFormationGroup();let f=getCurrentFormation();if(f&&f.groupId===group.id)return f;f=getVisibleFormations()[0]||null;if(f){state.currentFormationId=f.id;return f;}f=createFormationRecord('攻城戦A');f.groupId=group.id;state.formations=Array.isArray(state.formations)?state.formations:[];state.formations.push(f);state.currentFormationId=f.id;state.formationDirty=true;saveFormationDataToStorage('ensureCurrentFormationInCurrentGroup');return f;}
function selectFormationGroup(groupId){const groups=sanitizeFormationGroups(state.formationGroups||[]);if(!groups.some(g=>g.id===groupId))return;state.formationGroups=groups;state.currentFormationGroupId=groupId;const first=getVisibleFormations()[0]||null;if(first)state.currentFormationId=first.id;state.formationDirty=true;saveFormationDataToStorage('selectFormationGroup');renderFormationScreen();}
function addFormationGroup(){const groups=sanitizeFormationGroups(state.formationGroups||[]);if(groups.length>=FORMATION_MAX_GROUPS){window.alert(`グループは最大${FORMATION_MAX_GROUPS}件までです。`);return;}const group=createFormationGroup(`グループ${groups.length+1}`);groups.push(group);state.formationGroups=groups;state.currentFormationGroupId=group.id;state.currentFormationId='';state.formationDirty=true;saveFormationDataToStorage('addFormationGroup');renderFormationScreen();}
function setFormationGroupName(name){const group=getCurrentFormationGroup();group.name=norm(name)||group.name||'グループ';state.formationDirty=true;saveFormationDataToStorage('setFormationGroupName');renderFormationScreen();}
function updateFormationEvaluationFields(){const f=getCurrentFormation();if(!f)return;f.memo=norm(document.getElementById('formationMemoInput')?.value||'');f.totalScore=Math.max(0,Math.min(10,Number(document.getElementById('formationTotalScoreInput')?.value)||0));f.evaluationScore=Math.max(0,Math.min(10,Number(document.getElementById('formationEvaluationScoreInput')?.value)||0));f.updatedAt=new Date().toISOString();state.formationDirty=true;saveFormationDataToStorage('updateFormationEvaluationFields');renderFormationScreen();}
function saveFormationEvaluationSnapshot(){const f=getCurrentFormation();if(!f)return;updateFormationEvaluationFields();const current=getCurrentFormation();current.history=sanitizeFormationHistory([{id:createFormationId(),savedAt:new Date().toISOString(),evaluationTypeId:current.evaluationTypeId||'',evaluationTypeName:current.evaluationTypeName||'',totalScore:current.totalScore||0,evaluationScore:current.evaluationScore||0,memo:current.memo||''},...(current.history||[])]);current.updatedAt=new Date().toISOString();state.formationDirty=true;saveFormationDataToStorage('saveFormationEvaluationSnapshot');renderFormationScreen();showFormationToast('評価履歴を保存しました');}
function createFormationFromTypeSelection(sel){const group=getCurrentFormationGroup();if(getVisibleFormations().length>=FORMATION_MAX_PER_GROUP){window.alert(`1グループの部隊は最大${FORMATION_MAX_PER_GROUP}件です。`);return null;}const typeId=norm(sel?.typeId||'');const typeName=norm(sel?.typeName||sel?.typeId||'');const f=createFormationRecord(typeName?`型:${typeName}`:'型検索 新規部隊');f.groupId=group.id;f.evaluationTypeId=typeId;f.evaluationTypeName=typeName;f.memo=typeName?`型編成ナビから作成: ${typeName}`:'';state.formations.push(f);state.currentFormationId=f.id;state.formationDirty=true;saveFormationDataToStorage('createFormationFromTypeSelection');renderFormationScreen();return f;}
window.createFormationFromTypeSelection=createFormationFromTypeSelection;

function getAllDataItemsByCategory(category){if(category==='generals')return state.generals||[];if(category==='equipments')return state.equipments||[];if(category==='siegeWeapons')return state.siegeWeapons||[];if(category==='ethnicArmaments')return state.ethnicArmaments||[];return [];}
function findItemByDisplayName(category,name){const n=normalizeSaveItemName(name);return getAllDataItemsByCategory(category).find(item=>normalizeSaveItemName(getItemDisplayName(item))===n)||null;}
function getEquipmentType(item){const tables=Array.isArray(item?.tables)?item.tables:[];for(const table of tables){for(const row of (Array.isArray(table)?table:[])){if(Array.isArray(row)&&norm(row[0])==='種類')return norm(row[1]);}}
const text=(Array.isArray(item?.sections)?item.sections.map(s=>[s.title,...(s.content||[])].join(' ')).join(' '):'')+' '+getItemDisplayName(item);if(/武器/.test(text))return '武器';if(/防具/.test(text))return '防具';if(/文物/.test(text))return '文物';return '';}
function formationAllowedItems(category){const all=getAllDataItemsByCategory(category);if(state.viewMode!=='saved')return all;const cur=getCurrentSave();const names=new Set(category==='generals'?(cur?.generals||[]):category==='equipments'?(cur?.equipments||[]):[]);return all.filter(item=>names.has(normalizeSaveItemName(getItemDisplayName(item))));}
function isFormationCandidateAllowed(item){const category=detailCategory(item);if(!(category==='generals'||category==='equipments'))return false;if(state.viewMode!=='saved')return true;const n=normalizeSaveItemName(getItemDisplayName(item));const cur=getCurrentSave();return category==='generals'?(cur?.generals||[]).includes(n):(cur?.equipments||[]).includes(n);}
function pruneFormationUnavailableItemsForSavedMode(){
  if(state.viewMode!=='saved')return {changed:false,removed:[]};
  const cur=getCurrentSave();
  const generalNames=new Set((cur?.generals||[]).map(normalizeSaveItemName));
  const equipmentNames=new Set((cur?.equipments||[]).map(normalizeSaveItemName));
  const removed=[];
  (state.formations||[]).forEach(f=>{
    FORMATION_SLOT_SPECS.forEach(s=>{
      const slot=f?.slots?.[s.key];
      if(!slot)return;
      if(slot.general&&!generalNames.has(normalizeSaveItemName(slot.general))){
        removed.push({formation:f.name,slot:s.key,kind:'general',name:slot.general});
        slot.general='';
        if(slot.attendant){removed.push({formation:f.name,slot:s.key,kind:'attendant',name:slot.attendant,reason:'owner-general-removed'});slot.attendant='';}
        EQUIP_SLOT_SPECS.forEach(e=>{if(slot.equipments?.[e.key]){removed.push({formation:f.name,slot:s.key,kind:'equipment',equipKey:e.key,name:slot.equipments[e.key],reason:'owner-general-removed'});slot.equipments[e.key]='';}});
      }
      if(slot.attendant&&!generalNames.has(normalizeSaveItemName(slot.attendant))){removed.push({formation:f.name,slot:s.key,kind:'attendant',name:slot.attendant});slot.attendant='';}
      EQUIP_SLOT_SPECS.forEach(e=>{const n=slot.equipments?.[e.key]||'';if(n&&!equipmentNames.has(normalizeSaveItemName(n))){removed.push({formation:f.name,slot:s.key,kind:'equipment',equipKey:e.key,name:n});slot.equipments[e.key]='';}});
    });
  });
  if(removed.length){state.formationDirty=true;debugLog('formation:saved-mode-prune',{removedCount:removed.length,removed});}
  return {changed:removed.length>0,removed};
}
function getFormationSavedSkillLevelNumber(item,skillName){
  if(detailCategory(item)!=='generals')return 0;
  const lv=getResolvedGeneralSkillLevelMap(item).get(norm(skillName))||'';
  return lv?ROMAN_LEVELS.indexOf(lv)+1:0;
}
function findSkillItemByName(skillName){const n=norm(skillName);if(!n)return null;return (state.skills||[]).find(item=>norm(item?.name||item?.title||'')===n)||null;}
function getSkillItemContentForLevel(skillName,levelRoman){
  const skillItem=findSkillItemByName(skillName);
  const section=Array.isArray(skillItem?.sections)&&skillItem.sections.length?skillItem.sections[0]:null;
  const lines=filterSkillContentLines(section?.content||[]).filter(line=>!isOwnerListContentLine(line));
  if(!skillItem)return {found:false,reason:'state.skills name完全一致なし',content:'',lineCount:0};
  if(!lines.length)return {found:true,reason:'技能データ本文なし',content:'',lineCount:0};
  const raw=lines.join(' ');
  const selected=levelRoman?extractRomanLevelBlockText(raw,levelRoman):raw;
  return {found:true,reason:selected?'':'指定Lv本文なし',content:selected||raw,lineCount:lines.length,sourceGeneral:norm(skillItem?.sourceGeneral||skillItem?.raw?.sourceGeneral||'')};
}
function collectFormationParameterSourceRecords(item){
  const records=collectParameterSourceRecords(item);
  if(detailCategory(item)==='generals')debugLog('formation:general-stage-skill-records',{item:getItemDisplayName(item),viewMode:state.viewMode,generalStage:state.generalStage,recordCount:records.filter(r=>r.kind==='include').length,reason:'manual saved skill levels ignored; star-based skill profile used'});
  return records;
}
function formatFormationDate(iso){try{return new Date(iso).toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch{return norm(iso);}}
function isLRGeneralName(name){const item=findItemByDisplayName('generals',name);const display=getItemDisplayName(item)||norm(name);return /^LR/.test(display)||/\bLR\b/.test(display);}
function formationDisplayName(category,name){const item=findItemByDisplayName(category,name);const display=getItemDisplayName(item)||norm(name)||'未設定';return category==='equipments'?formatFormationEquipmentDisplayName(display):display;}
function formatFormationEquipmentDisplayName(value){
  const cleaned=stripDisplayNoise(value);
  return cleaned.split('/').map(part=>norm(part)).filter(part=>part&&!/アイコン$/.test(part)).join('・')||cleaned||norm(value)||'未設定';
}
function formationSlotLabel(key){return FORMATION_SLOT_SPECS.find(s=>s.key===key)?.label||key;}
function equipmentSlotLabel(key){return EQUIP_SLOT_SPECS.find(s=>s.key===key)?.label||key;}
function formationExtensionDisplayName(selectionKey,selection){const name=normalizeSaveItemName(selection?.name||'');if(!name)return '未指定';return formationDisplayName(getFormationExtensionCategory(selectionKey),name);}
function buildFormationExtensionSelectOptions(selectionKey,selectedName){const category=getFormationExtensionCategory(selectionKey);const items=getAllDataItemsByCategory(category);const selected=normalizeSaveItemName(selectedName||'');return '<option value="">未指定</option>'+items.map(item=>{const name=normalizeSaveItemName(getItemDisplayName(item));return `<option value="${esc(name)}" ${name===selected?'selected':''}>${esc(getItemDisplayName(item))}</option>`;}).join('');}
function buildFormationExtensionLevelOptions(selectionKey,selection){const name=normalizeSaveItemName(selection?.name||'');if(!name)return '<option value="0">-</option>';const item=getFormationExtensionItem(selectionKey,name);const levels=Array.isArray(item?.levels)?item.levels:[];const selected=normalizeFormationExtensionLevel(selectionKey,name,selection?.level);if(levels.length)return levels.map(lv=>{const n=Number(lv?.level)||0;return `<option value="${esc(n)}" ${n===selected?'selected':''}>Lv${esc(n)}</option>`;}).join('');const max=getFormationExtensionMaxLevel(selectionKey,name);let html='';for(let i=1;i<=max;i++)html+=`<option value="${esc(i)}" ${i===selected?'selected':''}>Lv${esc(i)}</option>`;return html;}
function getFormationMasterByName(name){const n=normalizeFormationMasterName(name);return (state.formationMasters||[]).find(item=>norm(item?.name||item?.title||'')===n)||null;}

function getSelectedFormationMaster(f){return getFormationMasterByName(f?.formationName||'基本')||getFormationMasterByName('基本')||null;}
function getFormationMasterSkillsForTeam(f){
  const master=getSelectedFormationMaster(f);
  const skills=Array.isArray(master?.skills)?master.skills:(Array.isArray(master?.raw?.skills)?master.raw.skills:[]);
  return (skills||[]).map(skill=>({
    name:normalizeSaveItemName(skill?.name||''),
    level:Number(skill?.level)||1,
    content:Array.isArray(skill?.content)?skill.content.map(norm).filter(Boolean):[norm(skill?.content||'')].filter(Boolean),
    sourceName:normalizeFormationMasterName(master?.name||f?.formationName||'基本')
  })).filter(skill=>skill.name);
}
function applyFormationMasterSkillsToSummary(f,skillRows,contributionLog){
  const skills=getFormationMasterSkillsForTeam(f);
  skills.forEach(skill=>{
    if(!skillRows.has(skill.name))skillRows.set(skill.name,{name:skill.name,holders:new Set(),levels:[],category:'formationShape',sourceCategories:new Set()});
    const row=skillRows.get(skill.name);
    row.holders.add(`陣形:${skill.sourceName}`);
    row.levels.push(skill.level||1);
    row.sourceCategories.add('陣形');
    contributionLog.push({holder:`陣形:${skill.sourceName}`,slot:'formation',skillName:skill.name,level:skill.level||1,source:`陣形:${skill.sourceName}:${skill.name}`,sourceType:'formationShape',adoptedBlocks:['陣形技能']});
  });
  debugLog('formationMaster:skills-applied',{formationName:normalizeFormationMasterName(f?.formationName||'基本'),skillCount:skills.length,skills:skills.map(s=>({name:s.name,level:s.level,sourceName:s.sourceName}))});
  return skills;
}
function buildFormationMasterSelectOptions(selectedName){const selected=normalizeFormationMasterName(selectedName);const items=Array.isArray(state.formationMasters)?state.formationMasters:[];return items.map(item=>{const name=norm(item?.name||item?.title||'');return `<option value="${esc(name)}" ${name===selected?'selected':''}>${esc(name||'-')}</option>`;}).join('')||'<option value="">陣形データなし</option>';}
function buildFormationDeploymentTypeOptions(selected){const current=normalizeFormationDeploymentType(selected);return FORMATION_DEPLOYMENT_TYPE_OPTIONS.map(opt=>`<option value="${esc(opt.key)}" ${opt.key===current?'selected':''}>${esc(opt.label)}</option>`).join('');}
function renderFormationSelectedMasterPreview(f){const master=getFormationMasterByName(f?.formationName||'基本');if(!master)return '<div class="detail-empty">陣形データが読み込まれていません。</div>';const info=[];info.push(['陣形',master.name||'-']);info.push(['編制種類',formationDeploymentTypeLabel(f?.deploymentType)]);info.push(['能力影響',master.ability_impact_text||master.raw?.ability_impact_text||'-']);info.push(['ステータス補正',master.status_correction||master.raw?.status_correction||'-']);const skills=Array.isArray(master.skills)?master.skills:(Array.isArray(master.raw?.skills)?master.raw.skills:[]);info.push(['陣形技能',skills.length?skills.map(x=>x?.name).filter(Boolean).join(' / '):'なし']);return `<section class="formation-extension-panel formation-master-select-panel"><div class="formation-section-header"><h3>陣形・編制種類</h3><span class="note">陣形3×3座標に基づき、侍従配置可否を自動判定します。</span></div><div class="formation-extension-grid"><label><span class="note">陣形</span><select id="formationMasterSelect" class="formation-select">${buildFormationMasterSelectOptions(f?.formationName)}</select></label><label><span class="note">編制種類</span><select id="formationDeploymentTypeSelect" class="formation-select">${buildFormationDeploymentTypeOptions(f?.deploymentType)}</select></label></div><div class="formation-section-header"><h3>陣形定義</h3><span class="note">陣形マスタの配置</span></div><div class="formation-master-layout-row">${renderFormationMasterGrid(master)}</div><div class="general-card no-detail-linkify"><div class="general-card-body">${renderEquipmentKeyValueRows(info)}</div></div></section>`;}

const FORMATION_MASTER_SLOT_MAP={main:'main',vice_1:'deputy1',vice_2:'deputy2',support_1:'support1',support_2:'support2'};
const FORMATION_APP_SLOT_TO_MASTER={main:'main',deputy1:'vice_1',deputy2:'vice_2',support1:'support_1',support2:'support_2'};
const FORMATION_SLOT_PRIORITY=['main','deputy1','deputy2','support1','support2'];
const JIJU_POSITION_OFFSETS={上:[-1,0],右上:[-1,1],右:[0,1],右下:[1,1],下:[1,0],左下:[1,-1],左:[0,-1],左上:[-1,-1]};
function getFormationMasterLayoutMatrix(master){const layout=master?.raw?.layout||master?.layout||{};return Array.isArray(layout.matrix)?layout.matrix:[];}
function getFormationSlotCoordMap(f){const master=getSelectedFormationMaster(f);const matrix=getFormationMasterLayoutMatrix(master);const map={};for(let r=0;r<3;r++){for(let c=0;c<3;c++){const raw=matrix?.[r]?.[c]||'';const key=FORMATION_MASTER_SLOT_MAP[raw]||'';if(key)map[key]={row:r,col:c,rawSlot:raw};}}return map;}
function coordKey(row,col){return `${row},${col}`;}
function isFormationCoordInside(row,col){return row>=0&&row<3&&col>=0&&col<3;}
function getGeneralJijuPositionEntries(item){
  const out=[];const seen=new Set();
  function addEntry(positionRaw,conditionRaw,source){
    const posText=normalizeJijuPositionValue(positionRaw);if(!posText)return;
    const condition=norm(conditionRaw||'');
    const key=posText+'|'+condition;
    if(seen.has(key))return;seen.add(key);
    out.push({positionText:posText,positions:parseJijuPositionDisplay(posText),condition,source});
  }
  const sources=[];
  if(Array.isArray(item?.jiju_positions))sources.push({source:'item.jiju_positions',list:item.jiju_positions});
  if(Array.isArray(item?.raw?.jiju_positions))sources.push({source:'raw.jiju_positions',list:item.raw.jiju_positions});
  sources.forEach(src=>src.list.forEach(entry=>{if(typeof entry==='string')addEntry(entry,'',src.source);else addEntry(entry?.position,entry?.condition,src.source);}));
  const tableSourceItem=(item?.raw&&Array.isArray(item.raw.tables))?item.raw:item;
  (Array.isArray(tableSourceItem?.tables)?tableSourceItem.tables:[]).forEach((table,tableIndex)=>{
    const rows=getTableRows(table);
    if(!Array.isArray(rows)||!rows.length)return;
    const header=rows[0]||[];
    if(!Array.isArray(header)||norm(header[0]||'')!=='配置位置')return;
    const condIndex=header.findIndex(h=>norm(h)==='条件');
    rows.slice(1).forEach((row,rowIndex)=>{if(Array.isArray(row))addEntry(row[0],condIndex>=0?row[condIndex]:(row[1]||''),`tables[${tableIndex}]配置位置`);});
  });
  return out;
}

function parseJijuCondition(conditionText){
  const text=norm(conditionText||'');
  const troopTypes=uniq((text.match(/歩兵|騎兵|弓兵/g)||[]));
  const stats=[];let m;const statRe=/(統率|武力|知力|政治|魅力)\s*(\d+)\s*以上/g;
  while((m=statRe.exec(text)))stats.push({name:m[1],required:Number(m[2])||0});
  const rarityMax=/UR以下/.test(text)?'UR':(/SSR以下/.test(text)?'SSR':(/SR以下/.test(text)?'SR':''));
  return {raw:text,rarityMax,troopTypes,stats};
}
function formatJijuConditionHumanReadable(conditionText){
  const parsed=parseJijuCondition(conditionText);
  const parts=[];
  if(parsed.rarityMax)parts.push(parsed.rarityMax+'以下');
  if(parsed.troopTypes.length)parts.push(parsed.troopTypes.join('/'));
  parsed.stats.forEach(st=>parts.push(`${st.name}${st.required}以上`));
  return parts.length?parts.join(' / '):(parsed.raw||'条件なし');
}
function renderGeneralJijuConditionRowsHtml(item){
  const entries=getGeneralJijuPositionEntries(item);
  if(!entries.length)return '';
  const seen=new Set();
  const rows=entries.map(entry=>{
    const position=entry.positionText||entry.positions?.join('、')||'-';
    const condition=formatJijuConditionHumanReadable(entry.condition||'');
    const key=`${norm(position)}@@${norm(condition)}`;
    if(seen.has(key))return '';
    seen.add(key);
    return `<tr><td style="width:140px">${esc(position)}</td><td>${esc(condition)}</td></tr>`;
  }).filter(Boolean).join('');
  if(!rows)return '';
  return `<div class="general-card" style="box-shadow:none"><div class="general-card-header">侍従配置条件</div><div class="general-card-body"><table class="kv-table"><tbody>${rows}</tbody></table></div></div>`;
}
function getGeneralJijuPositionListByName(name){const item=findItemByDisplayName('generals',name);if(!item)return [];const entries=getGeneralJijuPositionEntries(item);const seen=new Set();const out=[];entries.forEach(entry=>(entry.positions||[]).forEach(pos=>{if(!seen.has(pos)){seen.add(pos);out.push(pos);}}));return out;}
function getGeneralRarityCode(item){const name=normalizeSaveItemName(getItemDisplayName(item));const talent=getGeneralTalentValue(item);if(/^LR/.test(name)||talent>=1300)return 'LR';if(/^UR/.test(name)||talent>=1000)return 'UR';if(/^SSR/.test(name)||talent>=800)return 'SSR';if(/^SR/.test(name)||talent>=650)return 'SR';if(/^R/.test(name)||talent>=550)return 'R';return 'N';}
function getGeneralRarityRank(item){const order={N:1,R:2,SR:3,SSR:4,UR:5,LR:6};return order[getGeneralRarityCode(item)]||0;}
function getGeneralAbilityNumericValue(item,abilityName){
  const key=norm(abilityName||'');if(!item||!key)return 0;
  const itemName=normalizeSaveItemName(getItemDisplayName(item));
  if(state.viewMode==='saved'&&itemName){const settings=getCurrentGeneralSettings(itemName,false);const saved=Number(settings?.abilities?.[key]);if(Number.isFinite(saved)&&saved>0)return saved;}
  const tables=findGeneralAbilityTables(item);const sourceRows=(Array.isArray(tables.max)&&tables.max.length)?tables.max:((Array.isArray(tables.initial)&&tables.initial.length)?tables.initial:[]);
  for(const row of sourceRows){if(Array.isArray(row)&&norm(row[0])===key){const n=Number(String(row[1]||'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}}
  return 0;
}
function evaluateJijuAttendantCondition(ownerName,candidateName,position){
  const owner=findItemByDisplayName('generals',ownerName);const candidate=findItemByDisplayName('generals',candidateName);
  const result={ok:false,owner:normalizeSaveItemName(ownerName),candidate:normalizeSaveItemName(candidateName),position:normalizeJijuPositionValue(position||''),condition:'',reasons:[],parsed:null};
  if(!owner||!candidate){result.reasons.push('owner or candidate not found');return result;}
  const entries=getGeneralJijuPositionEntries(owner).filter(entry=>!result.position||(entry.positions||[]).includes(result.position));
  if(!entries.length){result.reasons.push('no jiju condition entry for position');return result;}
  for(const entry of entries){
    const condition=norm(entry.condition||'');
    const parsed=parseJijuCondition(condition);
    const reasons=[];let ok=true;
    if(condition){
      if(parsed.rarityMax==='UR'){const rank=getGeneralRarityRank(candidate);if(rank>5){ok=false;reasons.push('requires UR以下');}}
      if(parsed.rarityMax==='SSR'){const rank=getGeneralRarityRank(candidate);if(rank>4){ok=false;reasons.push('requires SSR以下');}}
      if(parsed.rarityMax==='SR'){const rank=getGeneralRarityRank(candidate);if(rank>3){ok=false;reasons.push('requires SR以下');}}
      // FIX[HADO-2.7.3.56-JIJU-CONDITION-MULTI-TROOP]: 歩兵/騎兵のような複数兵科条件は全件抽出し、いずれか一致で許可する。
      if(parsed.troopTypes.length){const troops=getGeneralTroopTypes(candidate);if(!troops.some(t=>parsed.troopTypes.includes(t))){ok=false;reasons.push(`requires ${parsed.troopTypes.join('/')}`);}}
      parsed.stats.forEach(st=>{const actual=getGeneralAbilityNumericValue(candidate,st.name);if(actual<st.required){ok=false;reasons.push(`requires ${st.name}${st.required}以上 actual=${actual}`);}});
    }
    if(ok){result.ok=true;result.condition=condition;result.parsed=parsed;result.reasons=['matched'];return result;}
    if(!result.condition){result.condition=condition;result.parsed=parsed;}
    result.reasons.push(...reasons);
  }
  return result;
}
function canAssignJijuAttendantByCondition(ownerName,candidateName,position){return evaluateJijuAttendantCondition(ownerName,candidateName,position).ok;}
function buildFormationOccupiedBaseCells(f){const coordMap=getFormationSlotCoordMap(f);const occupied=new Map();FORMATION_SLOT_SPECS.forEach(spec=>{const coord=coordMap[spec.key];if(coord)occupied.set(coordKey(coord.row,coord.col),{type:'base',slotKey:spec.key,label:spec.label,general:f?.slots?.[spec.key]?.general||''});});return occupied;}
function buildFormationJijuProcessingEntries(f){
  // FIX[HADO-2.7.3.60-JIJU-SINGLE-POSITION-FIRST]: 侍従配置候補が1つだけの武将を、複数候補を持つ武将より先に座標確保する。
  // 同じ優先度グループ内では、主将→副将1→副将2→補佐1→補佐2の編成スロット優先順を維持する。
  return FORMATION_SLOT_PRIORITY.map((slotKey,slotIndex)=>{
    const slot=f?.slots?.[slotKey]||{};
    const owner=normalizeSaveItemName(slot.general||'');
    const positions=owner?getGeneralJijuPositionListByName(owner):[];
    const positionCount=positions.length;
    const priorityGroup=owner?(positionCount===1?0:(positionCount>1?1:2)):3;
    const priorityLabel=priorityGroup===0?'single-position-first':(priorityGroup===1?'multi-position-late':(priorityGroup===2?'no-jiju-position':'empty-slot'));
    return {slotKey,slotIndex,owner,positions,positionCount,priorityGroup,priorityLabel};
  }).sort((a,b)=>a.priorityGroup-b.priorityGroup||a.slotIndex-b.slotIndex);
}
function computeFormationJijuAvailability(f){
  f=f||getCurrentFormation();
  const coordMap=getFormationSlotCoordMap(f);
  const occupied=buildFormationOccupiedBaseCells(f);
  const reserved=new Map();
  const bySlot={};
  const removed=[];
  const processingEntries=buildFormationJijuProcessingEntries(f);
  processingEntries.forEach((processingEntry,processingIndex)=>{
    const slotKey=processingEntry.slotKey;
    const slot=f?.slots?.[slotKey]||{};
    const coord=coordMap[slotKey];
    const owner=processingEntry.owner;
    const positions=processingEntry.positions;
    const candidates=[];
    if(coord&&owner){
      positions.forEach(pos=>{
        const off=JIJU_POSITION_OFFSETS[pos];
        if(!off)return;
        const row=coord.row+off[0],col=coord.col+off[1];
        const key=coordKey(row,col);
        let ok=true,reason='available';
        if(!isFormationCoordInside(row,col)){ok=false;reason='out-of-grid';}
        else if(occupied.has(key)){ok=false;reason='base-slot-occupied';}
        else if(reserved.has(key)){ok=false;reason='reserved-by-priority';}
        candidates.push({position:pos,row,col,key,ok,reason,reservedBy:reserved.get(key)?.slotKey||''});
      });
    }
    let selected=null;
    const currentPos=normalizeJijuPositionValue(slot.attendantPosition||'')||'';
    if(slot.attendant&&currentPos)selected=candidates.find(c=>c.ok&&c.position===currentPos)||null;
    if(!selected)selected=candidates.find(c=>c.ok)||null;
    if(slot.attendant&&selected){reserved.set(selected.key,{slotKey,position:selected.position,general:slot.attendant,priorityGroup:processingEntry.priorityGroup});}
    if(slot.attendant&&!selected){removed.push({slotKey,attendant:slot.attendant,previousPosition:slot.attendantPosition||'',reason:'no available jiju cell'});}
    const available=candidates.filter(c=>c.ok);
    bySlot[slotKey]={slotKey,owner,ownerLabel:formationSlotLabel(slotKey),ownerCoord:coord||null,positions,candidates,selected,available,hasAvailable:available.length>0,attendant:slot.attendant||'',jijuPriorityGroup:processingEntry.priorityGroup,jijuPriorityLabel:processingEntry.priorityLabel,jijuPositionCount:processingEntry.positionCount,jijuProcessingIndex:processingIndex};
    // BUGFIX[HADO-2.6.5.28-JIJU-PRIORITY]: 上位枠の侍従が未設定に戻った場合、上位枠が使える侍従座標を下位枠から奪還する。
    // CHANGE[HADO-2.7.3.60-JIJU-SINGLE-POSITION-FIRST]: 上位判定は単純スロット順ではなく、単一候補グループ→複数候補グループ→同グループ内スロット順で行う。
    if(owner&&!slot.attendant){available.forEach(c=>{if(c?.key&&!reserved.has(c.key))reserved.set(c.key,{slotKey,position:c.position,general:'',reserveOnly:true,priorityGroup:processingEntry.priorityGroup});});}
  });
  return {bySlot,coordMap,occupied,reserved,removed,processingOrder:processingEntries.map(e=>({slotKey:e.slotKey,owner:e.owner,positionCount:e.positionCount,priorityGroup:e.priorityGroup,priorityLabel:e.priorityLabel}))};
}
function repairFormationJijuAssignments(f,context='repair'){
  if(!f)return {changed:false,removed:[]};
  const availability=computeFormationJijuAvailability(f);
  let changed=false;
  const removed=[];
  Object.entries(availability.bySlot||{}).forEach(([slotKey,info])=>{
    const slot=f.slots?.[slotKey];
    if(!slot)return;
    if(slot.attendant){
      if(info.selected){
        if(slot.attendantPosition!==info.selected.position){slot.attendantPosition=info.selected.position;changed=true;}
      }else{
        removed.push({slotKey,attendant:slot.attendant,previousPosition:slot.attendantPosition||'',reason:'invalid attendant position'});
        slot.attendant='';slot.attendantPosition='';changed=true;
      }
    }else if(slot.attendantPosition){
      slot.attendantPosition='';changed=true;
    }
  });
  if(changed){f.updatedAt=new Date().toISOString();debugLog('formation:jiju-repaired',{context,formationId:f.id,removed});}
  return {changed,removed};
}
function renderFormationSelectedMasterTeamGrid(f){
  const master=getSelectedFormationMaster(f);const matrix=getFormationMasterLayoutMatrix(master);const availability=computeFormationJijuAvailability(f);const attendantCells=new Map();
  Object.values(availability.bySlot||{}).forEach(info=>{if(info.attendant&&info.selected)attendantCells.set(info.selected.key,{slotKey:info.slotKey,position:info.selected.position,attendant:info.attendant,owner:info.owner});});
  const cells=[];
  for(let r=0;r<3;r++)for(let c=0;c<3;c++){
    const baseRaw=matrix?.[r]?.[c]||'';const appSlot=FORMATION_MASTER_SLOT_MAP[baseRaw]||'';const att=attendantCells.get(coordKey(r,c));
    if(appSlot){const slot=f?.slots?.[appSlot]||{};const label=slot.general?formationDisplayName('generals',slot.general):normalizeFormationMasterSlotLabel(baseRaw);cells.push(`<div class="formation-master-cell ${formationMasterCellClass(baseRaw)}" title="${esc(formationSlotLabel(appSlot))}">${esc(label)}</div>`);}
    else if(att){cells.push(`<div class="formation-master-cell is-attendant" title="${esc(formationSlotLabel(att.slotKey)+' 侍従 '+att.position)}">${esc(formationDisplayName('generals',att.attendant))}</div>`);}
    else {cells.push('<div class="formation-master-cell is-empty"> </div>');}
  }
  const usable=Object.values(availability.bySlot||{}).filter(x=>x.hasAvailable).length;
  const warnings=[];Object.values(availability.bySlot||{}).forEach(info=>{if(info.owner&&getGeneralJijuPositionListByName(info.owner).length&&!info.hasAvailable)warnings.push(`${formationSlotLabel(info.slotKey)}の侍従配置不可`);});
  return `<div class="formation-master-layout-row"><div class="formation-master-grid is-team-grid" aria-label="部隊配置">${cells.join('')}</div><span class="formation-jiju-note">侍従配置可能枠: ${esc(usable)}件</span>${warnings.length?`<span class="formation-jiju-warning">${esc(warnings.join(' / '))}</span>`:''}</div>`;
}
function removeDuplicateGeneralWithinFormation(f,generalName,targetSlotKey,targetKind){
  const name=normalizeSaveItemName(generalName||'');if(!f||!name)return [];
  const removed=[];
  FORMATION_SLOT_SPECS.forEach(spec=>{const slot=f.slots?.[spec.key];if(!slot)return;
    if(!(targetKind==='general'&&spec.key===targetSlotKey)&&normalizeSaveItemName(slot.general)===name){removed.push({slotKey:spec.key,kind:'general',name,cleared:'slot'});f.slots[spec.key]=createFormationSlot();return;}
    if(!(targetKind==='attendant'&&spec.key===targetSlotKey)&&normalizeSaveItemName(slot.attendant)===name){removed.push({slotKey:spec.key,kind:'attendant',name,cleared:'attendant'});slot.attendant='';slot.attendantPosition='';}
  });
  if(removed.length)debugLog('formation:duplicate-general-removed',{formationId:f.id,generalName:name,targetSlotKey,targetKind,removed});
  return removed;
}
function clearFormationSlotLinkedData(slot){if(!slot)return;slot.general='';slot.attendant='';slot.attendantPosition='';slot.equipments={weapon:'',armor:'',treasure:''};}
function canAssignFormationAttendant(f,slotKey){const info=computeFormationJijuAvailability(f).bySlot?.[slotKey];return !!(info&&info.owner&&info.hasAvailable);}

function renderFormationExtensionControlsHtml(f){const siege=f?.siegeWeapon||createFormationSiegeWeaponSelection();const arm=f?.ethnicArmament||createFormationEthnicArmamentSelection();const siegeDisabled=normalizeSaveItemName(siege.name)?'':' disabled';const armDisabled=normalizeSaveItemName(arm.name)?'':' disabled';const ethnicGeneralDisabled=normalizeSaveItemName(arm.name)?'':' disabled';const openAttr='';const armEthnicGroup=getArmamentEthnicGroupByName(arm.name);const candidates=getEthnicGeneralCandidatesForArmament(arm.name);const ethnicGeneralText=arm.name?` / 異民族武将 ${esc(formationEthnicGeneralDisplayName(arm.ethnicGeneralName))}`:'';const currentText=`兵器 ${esc(formationExtensionDisplayName('siegeWeapon',siege))}${siege.name?` Lv${esc(normalizeFormationExtensionLevel('siegeWeapon',siege.name,siege.level))}`:''} / 武装 ${esc(formationExtensionDisplayName('ethnicArmament',arm))}${arm.name?` Lv${esc(normalizeFormationExtensionLevel('ethnicArmament',arm.name,arm.level))}`:''}${ethnicGeneralText}`;return `<details class="formation-mobile-summary-section formation-extension-details"${openAttr}><summary><span>兵器・武装</span><span class="note formation-summary-current">${currentText}</span></summary><div class="formation-mobile-summary-body"><section class="formation-extension-panel"><div class="formation-section-header"><h3>兵器・武装</h3><span class="note">各部隊に兵器・武装を1つずつ指定できます。Lvと異民族武将は部隊編成の保存データ対象です。</span></div><div class="formation-extension-grid"><label><span class="note">武装</span><select id="formationEthnicArmamentSelect" class="formation-select">${buildFormationExtensionSelectOptions('ethnicArmament',arm.name)}</select></label><label><span class="note">武装Lv</span><select id="formationEthnicArmamentLevelSelect" class="formation-select"${armDisabled}>${buildFormationExtensionLevelOptions('ethnicArmament',arm)}</select></label><label><span class="note">異民族武将</span><select id="formationEthnicGeneralSelect" class="formation-select"${ethnicGeneralDisabled}>${buildFormationEthnicGeneralSelectOptions(arm)}</select></label><label><span class="note">兵器</span><select id="formationSiegeWeaponSelect" class="formation-select">${buildFormationExtensionSelectOptions('siegeWeapon',siege.name)}</select></label><label><span class="note">兵器Lv</span><select id="formationSiegeWeaponLevelSelect" class="formation-select"${siegeDisabled}>${buildFormationExtensionLevelOptions('siegeWeapon',siege)}</select></label></div><div class="formation-extension-note">現在の設定：${currentText}${arm.name?`<br>武装の異民族：${esc(armEthnicGroup||'-')} / 候補武将：${esc(candidates.length)}名`:''}</div></section></div></details>`;}

function getFormationExtensionSelectionEntry(selectionKey,selection){
  const name=normalizeSaveItemName(selection?.name||'');
  if(!name)return null;
  const item=getFormationExtensionItem(selectionKey,name);
  if(!item)return null;
  const level=normalizeFormationExtensionLevel(selectionKey,name,selection?.level);
  const levelData=getHadouExtensionLevelData(item,level);
  const categoryKey=getFormationExtensionCategory(selectionKey);
  return {selectionKey,categoryKey,item,name,level,levelData,kind:selectionKey==='siegeWeapon'?'兵器':'武装'};
}
function getFormationExtensionEntries(f){
  const entries=[];
  const siege=getFormationExtensionSelectionEntry('siegeWeapon',f?.siegeWeapon||{});
  const arm=getFormationExtensionSelectionEntry('ethnicArmament',f?.ethnicArmament||{});
  if(siege)entries.push(siege);
  if(arm)entries.push(arm);
  return entries;
}
function buildFormationExtensionParameterRows(entry){
  if(!entry)return [];
  return HADO_EXTENSION_LEVEL_PARAM_SPECS.map(([key,label,unit])=>[label,formatHadouExtensionParamValue(entry.levelData?.[key],unit)]);
}
function formationExtensionEffectSummaryText(entry){
  const lines=[];
  const add=norm(entry?.item?.additionalEffect||'');
  const desc=norm(entry?.item?.additionalEffectDescription||'');
  if(add)lines.push(add);
  if(desc)lines.push('説明：'+desc);
  return lines.join(' / ')||'-';
}
function renderFormationExtensionParameterBlock(entry){
  if(!entry)return '';
  const item=entry.item;
  const openAttr=isResponsiveMobileMode()?'':' open';
  const basic=[];
  basic.push(['名称',item?.name||entry.name||'-']);
  basic.push(['Lv',entry.level?`Lv${entry.level}`:'-']);
  basic.push(['兵科',item?.troopType||'-']);
  basic.push(['異民族',item?.ethnicGroup||'-']);
  if(entry.selectionKey==='ethnicArmament'){
    const f=getCurrentFormation();
    basic.push(['異民族武将',formationEthnicGeneralDisplayName(f?.ethnicArmament?.ethnicGeneralName||'')]);
  }
  const paramRows=buildFormationExtensionParameterRows(entry);
  const effectRows=[['追加効果',item?.additionalEffect||'-']];
  const title=`${entry.kind}パラメータ：${item?.name||entry.name||'-'}${entry.level?` Lv${entry.level}`:''}`;
  return `<details class="formation-extension-param-details"${openAttr}><summary>${esc(title)}</summary><div class="formation-extension-param-body"><div class="general-card no-detail-linkify"><div class="general-card-body">${renderEquipmentKeyValueRows(basic)}${renderEquipmentKeyValueRows(paramRows)}${renderEquipmentKeyValueRows(effectRows)}</div></div></div></details>`;
}
function renderFormationSelectedExtensionParameterBlocks(f){
  const entries=getFormationExtensionEntries(f);
  const openAttr=isResponsiveMobileMode()?'':' open';
  const body=entries.length?entries.map(renderFormationExtensionParameterBlock).join(''):'<div class="detail-empty">兵器・武装は未指定です。</div>';
  return `<details class="formation-mobile-summary-section formation-extension-parameter-section"${openAttr}><summary>兵器・武装パラメータ</summary><div class="formation-mobile-summary-body"><div class="formation-section-header"><h3>兵器・武装パラメータ</h3></div><div class="general-detail-stack">${body}</div></div></details>`;
}
const FORMATION_EXTENSION_EFFECT_ALIASES=[
  {key:'対物特効',aliases:['対物特効','対物'],levelField:'antiObjectPercent'},
  {key:'与ダメージ',aliases:['与ダメージ','部隊与ダメージ']},
  {key:'被ダメージ',aliases:['被ダメージ','部隊被ダメージ']},
  {key:'攻撃',aliases:['部隊の攻撃','部隊攻撃','攻撃']},
  {key:'防御',aliases:['部隊の防御','部隊防御','防御']},
  {key:'知力',aliases:['部隊の知力','部隊知力','知力']},
  {key:'機動',aliases:['部隊の機動','部隊機動','機動']},
  {key:'攻撃速度',aliases:['攻撃速度']},
  {key:'射程',aliases:['部隊の射程','射程']},
  {key:'会心発生',aliases:['会心発生']},
  {key:'会心威力',aliases:['会心威力']},
  {key:'戦法速度',aliases:['戦法速度']},
  {key:'戦法威力',aliases:['戦法威力']},
  {key:'戦法ゲージ',aliases:['戦法ゲージ']}
];
function parseFormationExtensionAdditionalEffects(entry){
  const out=[];
  if(!entry?.item)return out;
  const summaryKeys=allParameterSummaryKeys();
  const text=norm([entry.item.additionalEffect||'',entry.item.additionalEffectDescription||'',entry.item.effect||'',entry.item.description||''].join(' '));
  if(!text)return out;
  const selectionKey=entry.selectionKey||'';
  const categoryKey=entry.categoryKey||getFormationExtensionCategory(selectionKey);
  const name=entry.name||getItemDisplayName(entry.item);
  const level=entry.level||0;
  FORMATION_EXTENSION_EFFECT_ALIASES.forEach(spec=>{
    let hit=false;
    (spec.aliases||[]).forEach(alias=>{
      if(hit)return;
      const unitPattern=spec.key==='射程'?'\\s*(?:[％%])?':'\\s*[％%]';
      const re=new RegExp(escRe(alias)+'[^。、,，/／]{0,18}([-+＋₋－])\\s*([0-9]+(?:\\.[0-9]+)?)'+unitPattern);
      const m=text.match(re);
      if(!m)return;
      const sign=/[\-₋－]/.test(m[1])?'-':'+';
      let value=Number(m[2]);
      if(spec.levelField&&Number.isFinite(Number(entry.levelData?.[spec.levelField]))){value=Number(entry.levelData[spec.levelField]);}
      if(!Number.isFinite(value))return;
      if(sign==='-')value=-Math.abs(value);
      addEffect(out,{timing:'normal',key:spec.key,value,unit:spec.key==='射程'?'':'%',sign,sourceLabel:`${name}:追加効果`,condition:'',rawText:text,sourceItemCategory:categoryKey,sourceItemName:name,extensionSelectionKey:selectionKey,extensionLevel:level});
      hit=true;
    });
  });
  (summaryKeys||[]).forEach(key=>{
    if(FORMATION_EXTENSION_EFFECT_ALIASES.some(spec=>spec.key===key))return;
    const label=parameterDisplayName(key);
    const re=new RegExp(escRe(label)+'[^。、,，/／]{0,18}([-+＋₋－])\\s*([0-9]+(?:\\.[0-9]+)?)\\s*[％%]');
    const m=text.match(re);
    if(!m)return;
    const sign=/[\-₋－]/.test(m[1])?'-':'+';
    const value=Number(m[2])*(sign==='-'?-1:1);
    if(!Number.isFinite(value))return;
    addEffect(out,{timing:'normal',key,value,unit:'%',sign,sourceLabel:`${name}:追加効果`,condition:'',rawText:text,sourceItemCategory:categoryKey,sourceItemName:name,extensionSelectionKey:selectionKey,extensionLevel:level});
  });
  return out;
}
function collectFormationExtensionSummaryEffects(f){
  const effects=[];
  getFormationExtensionEntries(f).forEach(entry=>{
    try{
      effects.push(...parseFormationExtensionAdditionalEffects(entry));
    }catch(err){
      debugLog('formationExtension:summary-effects-error',{formationId:f?.id||'',kind:entry?.kind||'',name:entry?.name||entry?.item?.name||'',message:err?.message||String(err)});
    }
  });
  if(effects.length)debugLog('formationExtension:summary-effects',{formationId:f?.id||'',count:effects.length,effects:effects.map(e=>({source:e.sourceLabel,key:e.key,value:e.value,sign:e.sign,raw:e.rawText}))});
  return effects;
}

function setFormationExtensionName(selectionKey,name){const f=ensureCurrentFormation();const n=normalizeSaveItemName(name||'');if(selectionKey==='siegeWeapon'){f.siegeWeapon={name:n,level:normalizeFormationExtensionLevel('siegeWeapon',n,0)};}else if(selectionKey==='ethnicArmament'){f.ethnicArmament={name:n,level:normalizeFormationExtensionLevel('ethnicArmament',n,0),ethnicGeneralName:''};}else{return;}f.updatedAt=new Date().toISOString();state.formationDirty=true;saveFormationDataToStorage('setFormationExtensionName:'+selectionKey);debugLog('formation:extension-name',{selectionKey,name:n,level:selectionKey==='siegeWeapon'?f.siegeWeapon.level:f.ethnicArmament.level});renderFormationScreen();}
function setFormationExtensionLevel(selectionKey,level){const f=ensureCurrentFormation();const target=selectionKey==='siegeWeapon'?f.siegeWeapon:selectionKey==='ethnicArmament'?f.ethnicArmament:null;if(!target||!normalizeSaveItemName(target.name))return;target.level=normalizeFormationExtensionLevel(selectionKey,target.name,level);f.updatedAt=new Date().toISOString();state.formationDirty=true;saveFormationDataToStorage('setFormationExtensionLevel:'+selectionKey);debugLog('formation:extension-level',{selectionKey,name:target.name,level:target.level});renderFormationScreen();}
function setFormationEthnicGeneralName(name){const f=ensureCurrentFormation();if(!f.ethnicArmament)f.ethnicArmament=createFormationEthnicArmamentSelection();if(!normalizeSaveItemName(f.ethnicArmament.name))return;const n=normalizeSaveItemName(name||'');f.ethnicArmament.ethnicGeneralName=n;f.updatedAt=new Date().toISOString();state.formationDirty=true;saveFormationDataToStorage('setFormationEthnicGeneralName');debugLog('formation:ethnic-general-selected',{armament:f.ethnicArmament.name,ethnicGroup:getArmamentEthnicGroupByName(f.ethnicArmament.name),ethnicGeneralName:n,candidateCount:getEthnicGeneralCandidatesForArmament(f.ethnicArmament.name).length});renderFormationScreen();}
function formationMarkDirty(){state.formationDirty=true;renderFormationScreen();}
function createNewFormation(){const group=getCurrentFormationGroup();const visible=getVisibleFormations();if(visible.length>=FORMATION_MAX_PER_GROUP){window.alert(`1グループの部隊は最大${FORMATION_MAX_PER_GROUP}件です。`);return;}const idx=visible.length+1;const f=createFormationRecord('新規部隊'+idx);f.groupId=group.id;state.formations.push(f);state.currentFormationId=f.id;state.formationDirty=true;saveFormationDataToStorage('createNewFormation');renderFormationScreen();}
function duplicateCurrentFormation(){const cur=getCurrentFormation();if(!cur)return;if(getVisibleFormations().length>=FORMATION_MAX_PER_GROUP){window.alert(`1グループの部隊は最大${FORMATION_MAX_PER_GROUP}件です。`);return;}const cp=sanitizeFormationRecord(JSON.parse(JSON.stringify(cur)));cp.id=createFormationId();cp.groupId=getCurrentFormationGroup().id;cp.name=cur.name+' コピー';cp.updatedAt=new Date().toISOString();state.formations.push(cp);state.currentFormationId=cp.id;state.formationDirty=true;saveFormationDataToStorage('duplicateCurrentFormation');renderFormationScreen();}
function deleteCurrentFormation(){const cur=getCurrentFormation();if(!cur)return;const groupId=cur.groupId||getCurrentFormationGroup().id;state.formations=(state.formations||[]).filter(f=>f.id!==cur.id);let visible=(state.formations||[]).filter(f=>(f.groupId||groupId)===groupId);if(!visible.length){const f=createFormationRecord('攻城戦A');f.groupId=groupId;state.formations.push(f);visible=[f];}state.currentFormationId=visible[0].id;state.formationDirty=true;saveFormationDataToStorage('deleteCurrentFormation');renderFormationScreen();}
function setFormationName(name){const cur=getCurrentFormation();if(!cur)return;cur.name=norm(name)||'無題部隊';cur.updatedAt=new Date().toISOString();state.formationDirty=true;saveFormationDataToStorage('setFormationName');renderFormationScreen();}
function removeFormationValue(slotKey,kind,equipKey=''){const f=getCurrentFormation();if(kind==='advisor'){const advisorKey=norm(equipKey||slotKey||'');if(f?.advisorSlots&&Object.prototype.hasOwnProperty.call(f.advisorSlots,advisorKey)){f.advisorSlots[advisorKey]='';f.updatedAt=new Date().toISOString();state.formationDirty=true;saveFormationDataToStorage('removeFormationAdvisor');renderFormationScreen();}return;}const slot=f?.slots?.[slotKey];if(!slot)return;if(kind==='general')clearFormationSlotLinkedData(slot);else if(kind==='attendant'){slot.attendant='';slot.attendantPosition='';}else if(kind==='equipment'&&equipKey)slot.equipments[equipKey]='';repairFormationJijuAssignments(f,'removeFormationValue');f.updatedAt=new Date().toISOString();formationMarkDirty();saveFormationDataToStorage('removeFormationValue');}
function findFormationGeneralSlotKey(f,generalName){const name=normalizeSaveItemName(generalName||'');if(!f||!name)return '';for(const spec of FORMATION_SLOT_SPECS){const slot=f.slots?.[spec.key];if(normalizeSaveItemName(slot?.general||'')===name)return spec.key;}return '';}
function moveFormationGeneralSlot(f,fromSlotKey,toSlotKey){
  if(!f||!fromSlotKey||!toSlotKey||fromSlotKey===toSlotKey)return false;
  const from=f.slots?.[fromSlotKey];
  const to=f.slots?.[toSlotKey];
  if(!from||!to)return false;
  const moved=JSON.parse(JSON.stringify(from));
  const target=JSON.parse(JSON.stringify(to));
  const targetGeneral=normalizeSaveItemName(target.general||'');
  // BUGFIX[HADO-2.5.2.5-FORMATION-SWAP]: 内容詳細から部隊内の既存武将を、既に武将がいる枠へ追加・変更する場合は「移動」ではなく「配置入れ替え」とする。
  // 入れ替え元（移動する武将）の侍従は配置先変更により条件が変わるため解除するが、装備は武将に紐づくものとして保持する。
  moved.attendant='';
  moved.attendantPosition='';
  f.slots[toSlotKey]=moved;
  if(targetGeneral){
    f.slots[fromSlotKey]=target;
    debugLog('formation:general-slot-swapped',{formation:f.name,fromSlotKey,toSlotKey,movedGeneral:moved.general,targetGeneral,sourceAttendantCleared:true,movedEquipmentKept:true,targetLinkedDataKept:true});
  }else{
    f.slots[fromSlotKey]=createFormationSlot();
    debugLog('formation:general-slot-moved',{formation:f.name,fromSlotKey,toSlotKey,general:moved.general,sourceAttendantCleared:true,equipmentKept:true});
  }
  return true;
}

const FORMATION_DUPLICATE_EQUIPMENT_ALLOWED_NAMES=['神刀','宝双剣','易経','宝雕弓','宝剣','蛇戟','象鼻刀','委貌冠','黒光鎧','明光鎧'];
function normalizeFormationEquipmentDuplicateKey(name){
  let n=normalizeSaveItemName(norm(name||''));
  n=n.replace(/(?:歩兵|騎兵|弓兵)?アイコン/g,'').replace(/\s*\/\s*/g,'').replace(/\s+/g,'');
  return n;
}
function isFormationDuplicateEquipmentAllowed(name){
  const n=normalizeFormationEquipmentDuplicateKey(name);
  if(!n)return false;
  return FORMATION_DUPLICATE_EQUIPMENT_ALLOWED_NAMES.some(raw=>{
    const a=normalizeFormationEquipmentDuplicateKey(raw);
    return !!a&&(n===a||n.includes(a));
  });
}
function collectFormationEquipmentUsage(f,ignoreSlotKey='',ignoreEquipKey=''){
  const usage=new Map();
  FORMATION_SLOT_SPECS.forEach(slotSpec=>{
    const slot=f?.slots?.[slotSpec.key];
    if(!slot)return;
    EQUIP_SLOT_SPECS.forEach(equipSpec=>{
      if(slotSpec.key===ignoreSlotKey&&equipSpec.key===ignoreEquipKey)return;
      const equipName=normalizeSaveItemName(slot.equipments?.[equipSpec.key]||'');
      if(!equipName)return;
      const key=normalizeFormationEquipmentDuplicateKey(equipName);
      if(!key)return;
      if(!usage.has(key))usage.set(key,[]);
      usage.get(key).push({slotKey:slotSpec.key,slotLabel:slotSpec.label,equipKey:equipSpec.key,equipLabel:equipSpec.label,name:equipName});
    });
  });
  return usage;
}
function getFormationEquipmentDuplicateBlockReason(f,equipmentName,slotKey,equipKey){
  const name=normalizeSaveItemName(equipmentName||'');
  if(!name)return '';
  if(isFormationDuplicateEquipmentAllowed(name))return '';
  const key=normalizeFormationEquipmentDuplicateKey(name);
  const usage=collectFormationEquipmentUsage(f,slotKey,equipKey);
  const hits=usage.get(key)||[];
  if(!hits.length)return '';
  return `同一部隊内で既に使用中です（${hits.map(h=>`${h.slotLabel}:${h.equipLabel}`).join('、')}）。`;
}
function canAssignFormationEquipmentToSlot(f,equipmentName,slotKey,equipKey){
  const reason=getFormationEquipmentDuplicateBlockReason(f,equipmentName,slotKey,equipKey);
  return {ok:!reason,reason};
}
function formationEquipmentCandidateAllowedByDuplicateRule(row,ctx){
  if(ctx.type!=='equipment')return true;
  const f=ensureCurrentFormation();
  const name=normalizeSaveItemName(row?.name||getItemDisplayName(row?.item)||'');
  const check=canAssignFormationEquipmentToSlot(f,name,ctx.slotKey,ctx.equipKey);
  if(!check.ok){
    debugLog('formationSelector:equipment-duplicate-excluded',{formation:f?.name||'',candidate:name,slotKey:ctx.slotKey,equipKey:ctx.equipKey,reason:check.reason,allowedDuplicates:FORMATION_DUPLICATE_EQUIPMENT_ALLOWED_NAMES});
  }
  return check.ok;
}

function assignFormationItem(item,destination){const f=ensureCurrentFormation();const category=detailCategory(item);const name=normalizeSaveItemName(getItemDisplayName(item));if(!name||!destination)return false;let removed=[];if(category==='generals'&&destination.kind==='advisor'){const advisorKey=norm(destination.advisorKey||'');if(!advisorSlotSpecByKey(advisorKey))return false;if(!advisorGeneralCanUseSlot(item,advisorKey)){debugLog('formation:assign-advisor-blocked',{formation:f.name,item:name,advisorKey,reason:'advisor slot not allowed'});return false;}if(!f.advisorSlots)f.advisorSlots=createFormationAdvisorSlots();Object.keys(f.advisorSlots).forEach(k=>{if(k!==advisorKey&&normalizeSaveItemName(f.advisorSlots[k])===name)f.advisorSlots[k]='';});f.advisorSlots[advisorKey]=name;f.updatedAt=new Date().toISOString();state.formationDirty=true;saveFormationDataToStorage('assignFormationAdvisor');debugLog('formation:assign-advisor',{formation:f.name,item:name,advisorKey,label:advisorSlotLabel(advisorKey)});renderFormationScreen();return true;}const slot=f.slots[destination.slotKey];if(!slot)return false;if(category==='generals'){if(destination.kind==='general'){const existingSlotKey=findFormationGeneralSlotKey(f,name);if(existingSlotKey&&existingSlotKey!==destination.slotKey){moveFormationGeneralSlot(f,existingSlotKey,destination.slotKey);removed=[{slotKey:existingSlotKey,kind:'general',name,cleared:'moved',keptLinkedData:true}];}else if(existingSlotKey===destination.slotKey){debugLog('formation:assign-general-same-slot',{formation:f.name,item:name,destination});}else{const replaced=normalizeSaveItemName(slot.general||'');if(replaced&&replaced!==name){debugLog('formation:assign-general-replace-external',{formation:f.name,slotKey:destination.slotKey,replacedGeneral:replaced,newGeneral:name,clearedLinkedData:true});}clearFormationSlotLinkedData(slot);slot.general=name;}}else if(destination.kind==='attendant'){const info=computeFormationJijuAvailability(f).bySlot?.[destination.slotKey];if(!info||!info.hasAvailable){debugLog('formation:assign-attendant-blocked',{formation:f.name,item:name,destination,reason:'no available jiju cell'});return false;}const requested=normalizeJijuPositionValue(destination.jijuPosition||destination.position||'');const chosen=requested?(info.available||[]).find(c=>c.position===requested):((info.selected)||(info.available||[])[0]);if(!chosen){debugLog('formation:assign-attendant-blocked',{formation:f.name,item:name,destination,reason:'requested jiju cell is not available'});return false;}const cond=evaluateJijuAttendantCondition(info.owner,name,chosen.position);if(!cond.ok){debugLog('formation:assign-attendant-blocked',{formation:f.name,item:name,destination,reason:'jiju condition not satisfied',condition:cond});return false;}removed=removeDuplicateGeneralWithinFormation(f,name,destination.slotKey,destination.kind);slot.attendant=name;slot.attendantPosition=chosen.position;}else return false;}else if(category==='equipments'){if(destination.kind!=='equipment'||!destination.equipKey)return false;const dupCheck=canAssignFormationEquipmentToSlot(f,name,destination.slotKey,destination.equipKey);if(!dupCheck.ok){debugLog('formation:assign-equipment-duplicate-blocked',{formation:f.name,item:name,destination,reason:dupCheck.reason,allowedDuplicates:FORMATION_DUPLICATE_EQUIPMENT_ALLOWED_NAMES});return false;}slot.equipments[destination.equipKey]=name;}else{return false;}const repaired=repairFormationJijuAssignments(f,'assignFormationItem');f.updatedAt=new Date().toISOString();state.formationDirty=true;saveFormationDataToStorage('assignFormationItem');debugLog('formation:assign',{formation:f.name,item:name,category,destination,duplicateRemoved:removed,jijuRepaired:repaired});renderFormationScreen();return true;}
function getFormationDestinationsForItem(item){const category=detailCategory(item);const out=[];const f=ensureCurrentFormation();if(category==='generals'){const candidateName=normalizeSaveItemName(getItemDisplayName(item));const availability=computeFormationJijuAvailability(f).bySlot||{};FORMATION_SLOT_SPECS.forEach(slotSpec=>{out.push({slotKey:slotSpec.key,kind:'general',label:slotSpec.label,group:slotSpec.label});const slot=f.slots?.[slotSpec.key];const info=availability[slotSpec.key];if(slot?.general&&!slot?.attendant&&info?.hasAvailable){(info.available||[]).forEach(c=>{const cond=evaluateJijuAttendantCondition(info.owner,candidateName,c.position);if(cond.ok){out.push({slotKey:slotSpec.key,kind:'attendant',jijuPosition:c.position,position:c.position,row:c.row,col:c.col,label:`${slotSpec.label} → 侍従 ${c.position}`,group:slotSpec.label,condition:cond.condition});}else{debugLog('formation:jiju-destination-excluded',{formation:f.name,owner:info.owner,candidate:candidateName,slotKey:slotSpec.key,position:c.position,condition:cond.condition,reasons:cond.reasons});}});}});}else if(category==='equipments'){const eqType=getEquipmentType(item);let eqKeys=EQUIP_SLOT_SPECS.filter(e=>!eqType||e.type===eqType).map(e=>e.key);FORMATION_SLOT_SPECS.forEach(slotSpec=>{eqKeys.forEach(eqKey=>out.push({slotKey:slotSpec.key,kind:'equipment',equipKey:eqKey,label:`${slotSpec.label} → ${equipmentSlotLabel(eqKey)}`,group:slotSpec.label}));});}return out;}
function renderFormationGroupControlsHtml(){const groups=sanitizeFormationGroups(state.formationGroups||[]),current=getCurrentFormationGroup();return `<div class="formation-group-controls"><label><span class="note">グループ</span><select id="formationGroupSelect" class="formation-select">${groups.map(g=>`<option value="${esc(g.id)}" ${g.id===current.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label><label><span class="note">グループ名</span><input id="formationGroupNameInput" type="text" value="${esc(current.name)}"></label><button type="button" id="formationGroupAddBtn" ${groups.length>=FORMATION_MAX_GROUPS?'disabled':''}>グループ追加</button><span class="note">最大${FORMATION_MAX_GROUPS}グループ / 各${FORMATION_MAX_PER_GROUP}部隊</span></div>`;}
function renderFormationListHtml(){const visible=getVisibleFormations();return visible.map((f,i)=>{const siege=formationExtensionDisplayName('siegeWeapon',f.siegeWeapon||{});const arm=formationExtensionDisplayName('ethnicArmament',f.ethnicArmament||{});return `<button type="button" class="formation-list-item ${f.id===state.currentFormationId?'is-active':''}" data-formation-select="${esc(f.id)}"><span class="formation-list-no">${i+1}</span><span><span class="formation-list-name">${esc(f.name)}</span><span class="formation-list-meta">型:${esc(f.evaluationTypeName||f.evaluationTypeId||'未指定')} / 評価:${esc(f.evaluationScore||0)}/10<br>更新: ${esc(formatFormationDate(f.updatedAt))}<br>兵器:${esc(siege)} / 武装:${esc(arm)}</span></span><span>${f.id===state.currentFormationId?'編集中':'›'}</span></button>`;}).join('')||'<div class="detail-empty">このグループに部隊がありません</div>';}
function renderFormationMobileSelectHtml(){const visible=getVisibleFormations();return `<div class="formation-mobile-select-wrap">${renderFormationGroupControlsHtml()}<div class="row between"><label class="note">部隊選択</label><span class="note">${visible.length}/${FORMATION_MAX_PER_GROUP}件</span></div><select id="formationMobileSelect" class="formation-select">${visible.map(f=>`<option value="${esc(f.id)}" ${f.id===state.currentFormationId?'selected':''}>${esc(f.name)}</option>`).join('')}</select><div class="formation-mobile-actions"><button type="button" id="formationMobileNewBtn" class="btn-select-all">新規</button><button type="button" id="formationMobileDuplicateBtn">複製</button><button type="button" id="formationMobileDeleteBtn" class="btn-clear-all">削除</button><button type="button" id="formationMobileSaveBtn" class="btn-select-all">保存</button></div></div>`;}
function renderFormationSlotCard(slotSpec,slot){const f=getCurrentFormation();const generalName=slot?.general||'';const attendantName=slot?.attendant||'';const generalItem=findItemByDisplayName('generals',generalName);const generalTitle=formationDisplayName('generals',generalName);const sub=generalItem?buildDetailTagsHtml(generalItem).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim():'';const availability=computeFormationJijuAvailability(f).bySlot?.[slotSpec.key]||null;const assistantAllowed=generalName&&availability&&availability.hasAvailable;const jijuLabel=availability?.selected?`${availability.selected.position} (${availability.selected.row+1},${availability.selected.col+1})`:(availability?.available?.length?availability.available.map(c=>c.position).join('/'):'配置不可');const jijuNote=generalName?`<div class="formation-jiju-note">侍従候補: ${esc(jijuLabel)}</div>`:'';const equipHtml=EQUIP_SLOT_SPECS.map(e=>{const n=slot?.equipments?.[e.key]||'';const disp=n?formationDisplayName('equipments',n):'未設定';return `<div class="formation-equip-cell"><div class="formation-equip-label">${esc(e.label)}</div><div class="formation-equip-name">${n?formationEntityLinkHtml('equipments',n,disp):esc(disp)}</div>${n?`<button type="button" class="copy-btn" data-formation-remove="equipment" data-slot-key="${esc(slotSpec.key)}" data-equip-key="${esc(e.key)}">解除</button>`:''}</div>`;}).join('');return `<div class="formation-slot-card"><div class="formation-slot-header"><span>${esc(slotSpec.label)}</span>${generalName?`<button type="button" class="copy-btn" data-formation-remove="general" data-slot-key="${esc(slotSpec.key)}">解除</button>`:''}</div><div class="formation-slot-body">${generalName?`<div><div class="formation-unit-name">${formationEntityLinkHtml('generals',generalName,generalTitle)}</div><div class="formation-unit-sub">${esc(sub||'武将')}</div>${renderFormationInheritedSkillControl(generalName)}${jijuNote}</div>`:`<div class="formation-empty">武将未設定</div>`}${generalName?`<div class="formation-assistant"><div class="formation-equip-label">侍従</div><div>${attendantName?formationEntityLinkHtml('generals',attendantName,formationDisplayName('generals',attendantName)):'未設定'}</div><div class="formation-jiju-note">${assistantAllowed?'配置可能':'陣形上の空き侍従位置なし'}</div>${attendantName?`<button type="button" class="copy-btn" data-formation-remove="attendant" data-slot-key="${esc(slotSpec.key)}">解除</button>`:''}</div>`:''}<div class="formation-equips"><div class="formation-equip-label">装備</div><div class="formation-equip-grid">${equipHtml}</div></div></div></div>`;}
function renderFormationRosterCompactHtml(f){const roleSpecs=[['main','主将'],['deputy1','副将1'],['deputy2','副将2'],['support1','補佐1'],['support2','補佐2']];return `<div class="formation-roster-compact">${roleSpecs.map(([key,label])=>{const n=f?.slots?.[key]?.general||'';const disp=n?formationDisplayName('generals',n):'未設定';return `<div class="formation-roster-compact-cell"><div class="formation-roster-compact-label">${esc(label)}</div><div class="formation-roster-compact-name">${esc(disp)}</div></div>`;}).join('')}</div>`;}
function collectFormationItems(f){const items=[];FORMATION_SLOT_SPECS.forEach(s=>{const slot=f?.slots?.[s.key];if(!slot)return;const g=findItemByDisplayName('generals',slot.general);if(g)items.push({item:g,holder:getItemDisplayName(g),kind:'武将',slotKey:s.key,slotLabel:s.label,holderSlot:s.key,holderRole:s.key,sourceType:'general'});const a=findItemByDisplayName('generals',slot.attendant);if(a)items.push({item:a,holder:getItemDisplayName(a),kind:'侍従',slotKey:s.key,slotLabel:s.label,holderSlot:s.key,holderRole:'attendant',sourceType:'attendant'});EQUIP_SLOT_SPECS.forEach(e=>{const eq=findItemByDisplayName('equipments',slot.equipments?.[e.key]);if(eq)items.push({item:eq,holder:getItemDisplayName(eq),kind:e.label,slotKey:s.key,slotLabel:s.label,holderSlot:s.key,equipKey:e.key,equipLabel:e.label,sourceType:'equipment'});});});const ethnicMeta=getFormationEthnicGeneralMeta(f);if(ethnicMeta)items.push(ethnicMeta);debugLog('formation:collect-items',{formationId:f?.id||'',itemCount:items.length,ethnicGeneral:ethnicMeta?{holder:ethnicMeta.holder,armament:ethnicMeta.ethnicArmamentName,ethnicGroup:ethnicMeta.ethnicGroup}:null});return items;}


function normalizeGeneralComparableName(name){let s=norm(name||'');s=s.replace(/[（(].*?[）)]/g,'');s=s.replace(/^(LR|UR|SSR|SR\+?|R\+?|N|覚醒)/,'');return norm(s);}
function getGeneralTroopType(item){const rows=Array.isArray(item?.tables)?item.tables.flat():[];for(const row of rows){if(Array.isArray(row)){for(let i=0;i<row.length-1;i++){if(norm(row[i])==='兵科'){const v=norm(row[i+1]);if(/歩兵|騎兵|弓兵/.test(v))return (v.match(/歩兵|騎兵|弓兵/)||[''])[0];}}}}const text=(Array.isArray(item?.sections)?item.sections.map(sec=>[sec.title,...(sec.content||[])].join(' ')).join(' '):'');const m=text.match(/兵科(歩兵|騎兵|弓兵)/);return m?m[1]:'';}
function extractTroopTypesFromText(text){return uniq((String(text||'').match(/歩兵|騎兵|弓兵/g)||[]));}
function getTableRowsSafe(table){if(!table)return [];if(Array.isArray(table))return table;if(Array.isArray(table?.rows))return table.rows;return [];}
function getGeneralBaseRangeValue(item){
  const table=findGeneralTroopBaseTable(item);
  const rows=getTableRowsSafe(table);
  for(const row of rows){
    if(!Array.isArray(row))continue;
    for(let i=0;i<row.length-1;i++){
      if(norm(row[i])==='射程'){
        const n=Number(norm(row[i+1]).replace(/[^0-9.\-]/g,''));
        if(Number.isFinite(n))return n;
      }
    }
  }
  const troop=getGeneralTroopType(item);
  const fallback={歩兵:1.0,騎兵:1.0,弓兵:1.5}[troop];
  return Number.isFinite(fallback)?fallback:NaN;
}
function addFormationBaseRangeEffect(f,ctx,effectsRaw){
  const mainName=norm(f?.slots?.main?.general||ctx?.slots?.main?.name||'');
  const mainItem=ctx?.slots?.main?.item||findItemByDisplayName('generals',mainName);
  const range=getGeneralBaseRangeValue(mainItem);
  if(!Number.isFinite(range)){debugLog('formation:base-range-missing',{mainName,troopType:ctx?.troopType||'',reason:'general base range not found'});return null;}
  const troop=ctx?.troopType||getGeneralTroopType(mainItem)||'';
  addEffect(effectsRaw,{timing:'normal',key:'射程',value:range,unit:'',sign:'+',sourceLabel:'主将兵科基本能力',condition:troop?`主将兵科 ${troop}`:'主将兵科',rawText:`部隊の射程 ${range}`,forceDisplay:true,sourceItemCategory:'generals',sourceItemName:getItemDisplayName(mainItem)||mainName});
  return {range,troopType:troop,mainGeneral:getItemDisplayName(mainItem)||mainName};
}

function parseFormationRangeThresholdCondition(effect){
  const raw=[effect?.condition,effect?.rawText].map(norm).filter(Boolean).join(' ');
  if(!raw)return null;
  const m=raw.match(/(?:編制時点の)?自部隊の射程が\s*([0-9]+(?:\.[0-9]+)?)\s*以上(?:の際|の場合)?/);
  if(!m)return null;
  const threshold=Number(m[1]);
  return Number.isFinite(threshold)?{threshold,raw}:null;
}
function isFormationRangeThresholdEffect(effect){
  return norm(effect?.key||'')==='射程'&&!!parseFormationRangeThresholdCondition(effect);
}
function evaluateFormationRangeConditionGate(effects){
  const list=Array.isArray(effects)?effects:[];
  const conditional=list.filter(isFormationRangeThresholdEffect);
  const baseRange=list.filter(e=>norm(e?.key||'')==='射程'&&!isFormationRangeThresholdEffect(e)).reduce((sum,e)=>sum+effectSignedValue(e),0);
  return {baseRange,conditionalCount:conditional.length,conditional};
}
function applyFormationRangeConditionGate(effects,excludedLog){
  if(!Array.isArray(effects)||!effects.length)return {baseRange:0,conditionalCount:0,adopted:0,excluded:0,details:[]};
  const evalBase=evaluateFormationRangeConditionGate(effects);
  if(!evalBase.conditionalCount)return evalBase;
  const kept=[];const details=[];let adopted=0,excluded=0;
  effects.forEach(e=>{
    const cond=parseFormationRangeThresholdCondition(e);
    if(norm(e?.key||'')!=='射程'||!cond){kept.push(e);return;}
    const satisfied=evalBase.baseRange>=cond.threshold;
    const baseText=formatFormationParameterNumber(evalBase.baseRange);
    const thText=formatFormationParameterNumber(cond.threshold);
    const reason=satisfied?`編制時点射程${baseText} >= ${thText}`:`条件未達：編制時点射程${baseText} < ${thText}`;
    const detail={source:e.sourceLabel||'',key:e.key,value:e.value,threshold:cond.threshold,baseRange:evalBase.baseRange,satisfied,reason,raw:cond.raw};
    details.push(detail);
    if(satisfied){
      adopted++;
      const next={...e,rangeConditionGate:{threshold:cond.threshold,baseRange:evalBase.baseRange,satisfied:true},condition:[cleanConditionText(e.condition||''),reason].filter(Boolean).join(' / ')};
      kept.push(next);
    }else{
      excluded++;
      if(Array.isArray(excludedLog))excludedLog.push({holder:'',slot:'',skillName:formationEffectSkillLabel(e.sourceLabel||''),source:e.sourceLabel||'',parameter:'射程',reason,conditions:[{type:'rangeThreshold',raw:cond.raw,satisfied:false,threshold:cond.threshold,baseRange:evalBase.baseRange}],rawText:e.rawText||''});
    }
  });
  effects.splice(0,effects.length,...kept);
  const result={baseRange:evalBase.baseRange,conditionalCount:evalBase.conditionalCount,adopted,excluded,details,policy:'HADO-2.7.3.62-FORMATION-RANGE-CONDITION-GATE: 射程条件付き効果は、条件付き射程効果自身を除いた編制時点射程で判定する。'};
  debugLog('formation:range-condition-gate',result);
  return result;
}

function getGeneralTroopTypes(item){
  const out=new Set();
  const rows=Array.isArray(item?.tables)?item.tables.flatMap(tbl=>getTableRowsSafe(tbl)):[];
  rows.forEach(row=>{if(!Array.isArray(row))return;for(let i=0;i<row.length-1;i++){if(norm(row[i])==='兵科')extractTroopTypesFromText(row[i+1]).forEach(v=>out.add(v));}});
  if(!out.size)extractTroopTypesFromText((Array.isArray(item?.sections)?item.sections.map(sec=>[sec.title,...(sec.content||[])].join(' ')).join(' '):'')).forEach(v=>out.add(v));
  return [...out];
}
function getEquipmentTroopTypes(item){
  const out=new Set();
  const rawParts=[];
  if(norm(item?.troopType))rawParts.push(item.troopType);
  (Array.isArray(item?.tables)?item.tables:[]).forEach(table=>getTableRowsSafe(table).forEach(row=>{if(!Array.isArray(row))return;for(let i=0;i<row.length-1;i++){if(norm(row[i])==='兵科')rawParts.push(row[i+1]);}}));
  rawParts.forEach(v=>extractTroopTypesFromText(v).forEach(t=>out.add(t)));
  const allText=[getItemDisplayName(item),...(Array.isArray(item?.sections)?item.sections.map(sec=>[sec.title,...(sec.content||[])].join(' ')):[])].join(' ');
  if(!out.size&&/装備可能な兵科に制限(?:が)?(?:無|な)い|兵科に制限(?:が)?(?:無|な)い/.test(allText))['歩兵','騎兵','弓兵'].forEach(v=>out.add(v));
  return [...out];
}
function extractAdditionalWeaponTroopPermissionsFromSkillText(text,skillName=''){
  const src=String(text||'');
  const out=[];const seen=new Set();
  const add=(troop,matchText)=>{troop=norm(troop);if(!/^(歩兵|騎兵|弓兵)$/.test(troop))return;const key=troop+'|'+norm(skillName||'');if(seen.has(key))return;seen.add(key);out.push({troopType:troop,skillName:norm(skillName||''),text:norm(matchText||src).slice(0,180)});};
  // FIX[HADO-2.7.3.56-FORMATION-WEAPON-PERMISSION-BY-OWN-SKILL]:
  // 「技能を持つ武将は〇〇専用の装備品を装着可」を、本人技能の場合だけ武器候補許可へ反映する。
  // 侍従によって発動している技能・装備で後から付く技能は、装備可否判定の入力にしない。
  const patterns=[
    /技能を持つ武将は\s*(歩兵|騎兵|弓兵)\s*専用の?\s*(?:武器|装備品)\s*を?\s*(?:装着可|装着できる|装備可能|装備できる)/g,
    /(歩兵|騎兵|弓兵)\s*専用の?\s*(?:武器|装備品).*?(?:装着可|装着できる|装備可能|装備できる)/g,
    /(歩兵|騎兵|弓兵)(?:武器).*?(?:装着可|装着できる|装備可能|装備できる)/g,
    /(?:装着可|装着できる|装備可能|装備できる).*?(歩兵|騎兵|弓兵)\s*専用の?\s*(?:武器|装備品)/g
  ];
  patterns.forEach(re=>{let m;while((m=re.exec(src))){if(m[1])add(m[1],m[0]);}});
  return out;
}
function extractAdditionalWeaponTroopTypesFromSkillText(text){return extractAdditionalWeaponTroopPermissionsFromSkillText(text).map(x=>x.troopType);}
function collectGeneralSkillPermissionRecordsForWeaponTroop(item){
  const records=[];
  if(!item)return records;
  try{
    const resolved=typeof resolveGeneralSkillProfile==='function'?resolveGeneralSkillProfile(item).map:null;
    collectGeneralSkillCardSections(item).sections.forEach(sec=>{
      const skillName=norm(sec?.title||'');
      if(!skillName)return;
      if(resolved instanceof Map&&!resolved.has(skillName))return;
      const text=(sec.content||[]).map(norm).join(' ');
      extractAdditionalWeaponTroopPermissionsFromSkillText(text,skillName).forEach(rec=>records.push(rec));
    });
  }catch{}
  return records;
}
function collectGeneralSkillTextForWeaponTroopPermission(item){
  return collectGeneralSkillPermissionRecordsForWeaponTroop(item).map(r=>[r.skillName,r.text].filter(Boolean).join(' ')).join(' ');
}
function collectEquipmentSkillTextForWeaponTroopPermission(item){
  // HADO-2.7.3.56: 武器装着可否は武将本人の有効技能だけで決める。装備スキル由来の許可は循環条件になるため採用しない。
  return '';
}
function getFormationSlotWeaponPermissionDetail(ctx){
  const f=ensureCurrentFormation();
  const slot=f?.slots?.[ctx.slotKey]||{};
  const out=new Set();
  const permissions=[];
  const generalItem=findItemByDisplayName('generals',slot.general||'');
  getGeneralTroopTypes(generalItem).forEach(v=>{out.add(v);permissions.push({troopType:v,source:'武将兵科',label:`武将兵科 ${v}`});});
  collectGeneralSkillPermissionRecordsForWeaponTroop(generalItem).forEach(rec=>{out.add(rec.troopType);permissions.push({...rec,source:'本人技能',label:`技能「${rec.skillName||'不明'}」により${rec.troopType}専用装備品を装着可`});});
  return {allowedTroopTypes:[...out],permissions};
}
function getFormationSlotAllowedWeaponTroopTypes(ctx){return getFormationSlotWeaponPermissionDetail(ctx).allowedTroopTypes;}
function formationWeaponCandidateMatchesTroop(row,ctx){
  if(ctx.type!=='equipment')return true;
  const fixedType=ctx.equipSpec?.type||ctx.equipmentType||'';
  if(fixedType!=='武器')return true;
  const allowed=getFormationSlotAllowedWeaponTroopTypes(ctx);
  if(!allowed.length)return false;
  const equipTroops=getEquipmentTroopTypes(row.item);
  const normalizedEquipTroops=equipTroops.length?equipTroops:['歩兵','騎兵','弓兵'];
  return normalizedEquipTroops.some(t=>allowed.includes(t));
}

function extractCompatibleGeneralNames(item){const own=normalizeGeneralComparableName(getItemDisplayName(item));const known=(state.generals||[]).map(g=>({display:getItemDisplayName(g),base:normalizeGeneralComparableName(getItemDisplayName(g))})).filter(x=>x.base).sort((a,b)=>b.display.length-a.display.length);const texts=[];(Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{const title=norm(sec?.title||'');if(/相性の良い/.test(title))texts.push([title,...(sec.content||[])].join(' '));});const out=new Set();texts.forEach(txt=>{known.forEach(k=>{if(k.base&&k.base!==own&&(txt.includes(k.display)||txt.includes(k.base)))out.add(k.base);});});return [...out];}
function buildFormationContext(f){const mainItem=findItemByDisplayName('generals',f?.slots?.main?.general||'');const mainName=getItemDisplayName(mainItem)||'';const slots={};FORMATION_SLOT_SPECS.forEach(s=>{const item=findItemByDisplayName('generals',f?.slots?.[s.key]?.general||'');slots[s.key]={name:getItemDisplayName(item)||'',baseName:normalizeGeneralComparableName(getItemDisplayName(item)||''),item};});const compatibilityMap={};FORMATION_SLOT_SPECS.forEach(s=>{const item=slots[s.key].item;if(item)compatibilityMap[slots[s.key].baseName]=extractCompatibleGeneralNames(item);});const ctx={mainGeneralName:mainName,mainGeneralNormalizedName:normalizeGeneralComparableName(mainName),troopType:getGeneralTroopType(mainItem)||'',deploymentType:normalizeFormationDeploymentType(f?.deploymentType),deploymentTypeLabel:formationDeploymentTypeLabel(f?.deploymentType),isOwnCity:normalizeFormationDeploymentType(f?.deploymentType)==='own_city',isStation:normalizeFormationDeploymentType(f?.deploymentType)==='station',isGarrisonOrDefense:['own_city','station'].includes(normalizeFormationDeploymentType(f?.deploymentType)),formationName:normalizeFormationMasterName(f?.formationName||'基本'),slots,compatibilityMap};debugLog('formationSkill:context',ctx);return ctx;}
function formationAreCompatible(ctx,nameA,nameB){const a=normalizeGeneralComparableName(nameA),b=normalizeGeneralComparableName(nameB);if(!a||!b||a===b)return false;const am=ctx.compatibilityMap?.[a]||[],bm=ctx.compatibilityMap?.[b]||[];return am.includes(b)||bm.includes(a);}
function formationAssignedGeneralBaseNames(ctx,slotKeys){return (slotKeys||[]).map(k=>ctx.slots?.[k]?.baseName||'').filter(Boolean);}
function formationHolderSlotAllowed(holderSlot,allowed){return (allowed||[]).includes(holderSlot);}
function parseMainNameConditionList(text){const t=norm(text||'');const hits=[];for(const re of [/自部隊の主将が([^。■●▼（）()]+?)(?:の際|の場合|なら)/g,/主将が([^。■●▼（）()]+?)(?:の際|の場合|なら)/g]){let m;while((m=re.exec(t))){let part=m[1].replace(/と好相性.*/,'').replace(/と自身.*/,'');part=part.replace(/または/g,'/').replace(/、/g,'/').replace(/・/g,'/').replace(/か/g,'/');part.split('/').map(normalizeGeneralComparableName).filter(Boolean).forEach(n=>hits.push(n));}}return [...new Set(hits)];}
function evaluateFormationConditionText(text,meta,ctx,opts={}){const t=norm(text||'');const holderSlot=meta?.holderSlot||'';const holderName=meta?.holder||meta?.holderName||'';const holderBase=normalizeGeneralComparableName(holderName);const conditions=[];function fail(type,raw,reason){conditions.push({type,raw,satisfied:false,reason});return {satisfied:false,conditions,reason};}function ok(type,raw,reason,extra={}){conditions.push({type,raw,satisfied:true,reason,...extra});}
 if(isAppointmentSkillText(t))return fail('appointment','任命技能','appointment skill is excluded from formation aggregation');
 if(/文化府に任命時|文化府/.test(t))return fail('unsupported','文化府','culture assignment is not supported in formation');
 if(/参軍の際|参軍起用|参軍技能/.test(t)&&!String(holderSlot||'').startsWith('advisor:'))return fail('unsupported','参軍','advisor formation is not supported yet');
 const ownCityDeploymentRe=/自都市(?:に駐屯中|駐屯部隊|駐屯中|に編制|へ編制)|自都市.*?(?:駐屯|編制)/;
 const stationDeploymentRe=/詰所(?:に駐屯中|駐屯中|に編制|へ編制|編制)|詰所/;
 const garrisonDeploymentRe=/駐屯\/?防衛中|駐屯・防衛中|駐屯防衛中|駐屯または防衛中|防衛中|駐屯中/;
 if(ownCityDeploymentRe.test(t)){if(ctx.isOwnCity)ok('deployment','自都市','deploymentType is own_city',{deploymentType:ctx.deploymentType||''});else return fail('deployment','自都市',`requires own_city but deploymentType=${ctx.deploymentType||'-'}`);}
 if(stationDeploymentRe.test(t)&&!ownCityDeploymentRe.test(t)){if(ctx.isStation)ok('deployment','詰所','deploymentType is station',{deploymentType:ctx.deploymentType||''});else return fail('deployment','詰所',`requires station but deploymentType=${ctx.deploymentType||'-'}`);}
 if(garrisonDeploymentRe.test(t)&&!ownCityDeploymentRe.test(t)&&!stationDeploymentRe.test(t)){if(ctx.isGarrisonOrDefense)ok('battleMode','駐屯/防衛','deploymentType is garrison/defense capable',{deploymentType:ctx.deploymentType||''});else if(opts.ignoreBattleMode){ok('battleMode','駐屯/防衛','garrison/defense condition ignored for skill aggregation',{deploymentType:ctx.deploymentType||''});}else return fail('battleMode','駐屯/防衛',`requires own_city/station but deploymentType=${ctx.deploymentType||'-'}`);}
 if(/兵力が\s*\d+\s*[％%](?:以下|以上)|兵力\s*\d+\s*[％%](?:以下|以上)/.test(t)){if(opts.ignoreBattleHp){ok('battleHp','兵力条件','battle HP condition ignored for skill aggregation');}else return fail('battleHp','兵力条件','battle HP condition is excluded');}
 if(opts.excludeCombat&&/戦法を発動|戦法発動|主将戦法|通常攻撃|攻撃を受け|会心攻撃|ダメージを与えた際/.test(t))return fail('battleTrigger','戦闘中条件','battle trigger condition is excluded');
 const roleChecks=[[/自身が侍従の際|侍従の際|侍従で/,['attendant'],'侍従の際'],[/主将か副将1の際|主将か、副将1の際/,['main','deputy1'],'主将か副将1の際'],[/主将か副将2の際|主将か、副将2の際/,['main','deputy2'],'主将か副将2の際'],[/主将か副将の際|主将か、副将の際|主将か副将で|主将か、副将で/,['main','deputy1','deputy2'],'主将か副将の際'],[/副将か補佐の際|副将か、補佐の際|副将か補佐で|副将か、補佐で/,['deputy1','deputy2','support1','support2'],'副将か補佐の際'],[/副将1の際|副将1で/,['deputy1'],'副将1の際'],[/副将2の際|副将2で/,['deputy2'],'副将2の際'],[/自身が副将の際|副将の際|副将で/,['deputy1','deputy2'],'副将の際'],[/自身が補佐の際|補佐の際|補佐で/,['support1','support2'],'補佐の際'],[/自身が主将の際|主将の際|主将で/,['main'],'主将の際']];
 for(const [re,allowed,raw] of roleChecks){if(re.test(t)){const pos=getFormationHolderPositionLabelFromMeta(meta||{});const allowedBySlot=formationHolderSlotAllowed(holderSlot,allowed);const allowedByRole=(allowed.includes('attendant')&&pos==='侍従');if(!allowedBySlot&&!allowedByRole)return fail('role',raw,`holder slot ${holderSlot||'-'} / position ${pos||'-'} is not allowed`);ok('role',raw,`holder slot ${holderSlot} / position ${pos||'-'} matched`,{allowedSlots:allowed,position:pos});break;}}
 if(/好相性/.test(t)){let passed=false;let reason='';if(/副将と補佐全員|副将全員|主将と副将全員/.test(t)){const targets=formationAssignedGeneralBaseNames(ctx,['deputy1','deputy2','support1','support2']);passed=targets.length>0&&targets.every(n=>formationAreCompatible(ctx,ctx.mainGeneralNormalizedName,n));reason=passed?'all deputies/supports are compatible with main':'not all deputies/supports are compatible with main';}else{passed=formationAreCompatible(ctx,holderBase,ctx.mainGeneralNormalizedName);reason=passed?'holder is compatible with main':'holder is not compatible with main';}
  if(!passed)return fail('affinity','好相性',reason);ok('affinity','好相性',reason);}
 const mainNames=parseMainNameConditionList(t);if(mainNames.length){const passed=mainNames.includes(ctx.mainGeneralNormalizedName);if(!passed)return fail('mainGeneralName',mainNames.join('/'),`main general ${ctx.mainGeneralNormalizedName||'-'} not matched`);ok('mainGeneralName',mainNames.join('/'),`main general ${ctx.mainGeneralNormalizedName} matched`,{names:mainNames});}
 const troopMatch=t.match(/自部隊が(歩兵|騎兵|弓兵)の際|自部隊が(歩兵|騎兵|弓兵)で/);if(troopMatch){const required=troopMatch[1]||troopMatch[2];if(ctx.troopType!==required)return fail('troopType',`自部隊が${required}`,`troop type ${ctx.troopType||'-'} not matched`);ok('troopType',`自部隊が${required}`,`troop type ${ctx.troopType} matched`);}
 if(/自部隊の(?:攻撃|防御|知力|機動)|編制時点/.test(t))ok('statThreshold','能力値条件','stat threshold ignored by current specification');
 return {satisfied:true,conditions,reason:conditions.length?'all conditions satisfied':'no formation condition'};}


function getFormationHolderPositionLabelFromMeta(meta){
  const role=norm(meta?.holderRole||meta?.originalHolderRole||'');
  const slot=norm(meta?.holderSlot||meta?.slotKey||'');
  if(role==='attendant'||meta?.sourceType==='attendant')return '侍従';
  if(slot==='main'||slot==='leader')return '主将';
  if(slot==='deputy1'||slot==='deputy2'||role==='deputy1'||role==='deputy2')return '副将';
  if(slot==='support1'||slot==='support2'||role==='support1'||role==='support2')return '補佐';
  return norm(meta?.slotLabel||'');
}
function sanitizeFormationEffectConditionText(text){
  let t=norm(text||'');
  if(!t)return '';
  const before=t;
  t=t.replace(/→?\s*(?:自身が)?(?:主将|副将|補佐|侍従)の際は効果が\s*[0-9]+(?:\.[0-9]+)?\s*倍[（(][^）)]*[）)](?:[（(][^）)]*上限[^）)]*[）)])?/g,'');
  t=t.replace(/→?\s*駐屯\/?防衛中は効果が\s*[0-9]+(?:\.[0-9]+)?\s*倍[（(][^）)]*[）)]/g,'');
  t=t.replace(/→?\s*自都市(?:に駐屯中|駐屯部隊に編制されている際)[、,，]?\s*(?:は)?効果が\s*[0-9]+(?:\.[0-9]+)?\s*倍[（(][^）)]*[）)]/g,'');
  if(before!==t)debugLog('statusEffect:condition-sanitized-for-multiplier',{before,after:t});
  return norm(t);
}
function applyFormationPositionMultiplierToEffect(effect,meta){
  const raw=[effect?.rawText,effect?.condition].map(norm).filter(Boolean).join(' ');
  const m=raw.match(/(?:自身が)?(主将|副将|補佐|侍従)の際は効果が\s*([0-9]+(?:\.[0-9]+)?)\s*倍(?:[（(]\s*([+＋\-－₋]?)\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]\s*[）)])?/);
  if(!m)return effect;
  const required=m[1];
  const actual=getFormationHolderPositionLabelFromMeta(meta||{});
  const multiplier=Number(m[2]);
  const base=Number(effect?.value);
  if(actual!==required){
    debugLog('statusEffect:position-condition-skip',{source:effect?.sourceLabel||'',holder:meta?.holder||'',slot:meta?.holderSlot||'',required,actual,baseValue:effect?.value,reason:'position multiplier condition not matched'});
    return effect;
  }
  if(!Number.isFinite(multiplier)||!Number.isFinite(base))return effect;
  const explicit=Number(m[4]);
  const nextValue=Number.isFinite(explicit)?explicit:(base*multiplier);
  const signChar=m[3]||'';
  const nextSign=/[-－₋]/.test(signChar)?'-':(/[+＋]/.test(signChar)?'+':(effect?.sign==='-'?'-':'+'));
  const baseCond=cleanConditionText(effect?.condition||'');
  const multiplierReason=`自身が${required}のため効果${multiplier}倍`;
  const next={...effect,value:nextValue,sign:nextSign,condition:[baseCond,multiplierReason].filter(Boolean).join(' / '),positionMultiplierApplied:true,positionMultiplier:multiplier,positionMultiplierBaseValue:base,positionMultiplierRequired:required,positionMultiplierActual:actual};
  debugLog('statusEffect:conditional-multiplier-applied',{source:effect?.sourceLabel||'',holder:meta?.holder||'',slot:meta?.holderSlot||'',required,actual,baseValue:base,multiplier,finalValue:nextValue,key:effect?.key||'',reason:multiplierReason});
  return next;
}


function applyFormationDeploymentMultiplierToEffect(effect,ctx){
  const raw=[effect?.rawText,effect?.condition].map(norm).filter(Boolean).join(' ');
  if(!raw)return effect;
  const patterns=[
    {re:/自都市駐屯部隊に編制されている際[、,，]?\s*(?:は)?効果が\s*([0-9]+(?:\.[0-9]+)?)\s*倍[（(]\s*([+＋\-－₋]?)\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]?\s*[）)]/,required:'own_city',label:'自都市駐屯部隊'},
    {re:/自都市(?:に駐屯中|駐屯中)[、,，]?\s*(?:は)?効果が\s*([0-9]+(?:\.[0-9]+)?)\s*倍[（(]\s*([+＋\-－₋]?)\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]?\s*[）)]/,required:'own_city',label:'自都市'},
    {re:/(?:駐屯\/?防衛中|駐屯・防衛中|駐屯防衛中)[、,，]?\s*(?:は)?効果が\s*([0-9]+(?:\.[0-9]+)?)\s*倍[（(]\s*([+＋\-－₋]?)\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]?\s*[）)]/,required:'garrison',label:'駐屯/防衛中'},
    {re:/詰所(?:に駐屯中|駐屯中|に編制|へ編制|編制)[、,，]?\s*(?:は)?効果が\s*([0-9]+(?:\.[0-9]+)?)\s*倍[（(]\s*([+＋\-－₋]?)\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]?\s*[）)]/,required:'station',label:'詰所'}
  ];
  for(const p of patterns){
    const m=raw.match(p.re);
    if(!m)continue;
    const matched=p.required==='own_city'?!!ctx?.isOwnCity:(p.required==='station'?!!ctx?.isStation:!!ctx?.isGarrisonOrDefense);
    if(!matched){debugLog('statusEffect:deployment-multiplier-skip',{source:effect?.sourceLabel||'',key:effect?.key||'',required:p.required,deploymentType:ctx?.deploymentType||'',raw:raw.slice(0,180)});return effect;}
    const multiplier=Number(m[1]);
    const explicit=Number(m[3]);
    const base=Number(effect?.value);
    if(!Number.isFinite(multiplier)||(!Number.isFinite(explicit)&&!Number.isFinite(base)))return effect;
    const signChar=m[2]||'';
    const nextSign=/[-－₋]/.test(signChar)?'-':(/[+＋]/.test(signChar)?'+':(effect?.sign==='-'?'-':'+'));
    const nextValue=Number.isFinite(explicit)?explicit:(base*multiplier);
    const reason=`${p.label}のため効果${multiplier}倍`;
    const cond=cleanConditionText(effect?.condition||'');
    const next={...effect,value:nextValue,sign:nextSign,condition:[cond,reason].filter(Boolean).join(' / '),deploymentMultiplierApplied:true,deploymentMultiplier:multiplier,deploymentMultiplierBaseValue:base,requiredDeployment:p.required};
    debugLog('statusEffect:deployment-multiplier-applied',{source:effect?.sourceLabel||'',key:effect?.key||'',baseValue:base,finalValue:nextValue,required:p.required,deploymentType:ctx?.deploymentType||'',reason});
    return next;
  }
  return effect;
}

function applyFormationMasterSkillsToEffects(f,ctx,effectsRaw,specials,excludedLog=[]){
  const skills=getFormationMasterSkillsForTeam(f);
  skills.forEach(skill=>{
    const text=(Array.isArray(skill.content)?skill.content:[skill.content]).map(norm).filter(Boolean).join(' ');
    if(!text)return;
    const rec={source:`技能:${skill.name}${ROMAN_LEVELS[(Number(skill.level)||1)-1]||'Ⅰ'}`,text,item:null,formationSkillName:skill.name,formationSourceCategory:'陣形'};
    const meta={holder:`陣形:${skill.sourceName}`,holderName:`陣形:${skill.sourceName}`,holderSlot:'formation',holderRole:'formation',sourceType:'formationShape',sourceItemCategory:'formations',sourceItemName:skill.sourceName};
    const blockEval=getActiveSkillBlocks(rec,meta,ctx,{excludeCombat:false,ignoreBattleMode:false,ignoreBattleHp:true});
    const adopted=blockEval.adopted.length>0;
    debugLog(adopted?'formationMaster:effect-adopted':'formationMaster:effect-excluded',{formationName:skill.sourceName,skillName:skill.name,blockCount:blockEval.blocks.length,adoptedBlockCount:blockEval.adopted.length,excludedBlockCount:blockEval.excluded.length,reason:adopted?'active condition block adopted':'no active condition block',conditions:blockEval.adopted.concat(blockEval.excluded).flatMap(x=>x.evaluation.conditions||[])});
    if(!adopted){excludedLog.push({holder:meta.holder,slot:'formation',skillName:skill.name,source:rec.source,reason:'no active condition block',excludedBlocks:blockEval.excluded.map(x=>({condition:x.block.condition,reason:x.evaluation.reason}))});return;}
    const activeRec={...rec,text:blockEval.activeText||rec.text,fullText:rec.text};
    const parsed=parseParameterEffectsFromRecord(activeRec);
    parsed.effects.forEach(e=>{
      if(!isFormationNumericParameterEffect(e)){excludedLog.push({holder:meta.holder,slot:'formation',skillName:skill.name,source:e.sourceLabel||rec.source,parameter:e.key||'',reason:'non-numeric formation master effect excluded'});return;}
      const evalText=[sanitizeFormationEffectConditionText(e.rawText),e.condition].filter(Boolean).join(' ');
      const effectEval=evaluateFormationConditionText(evalText,meta,ctx,{excludeCombat:false,ignoreBattleMode:false,ignoreBattleHp:true});
      debugLog('formationMaster:effect-condition-evaluate',{formationName:skill.sourceName,skillName:skill.name,source:e.sourceLabel||rec.source,key:e.key,adopted:effectEval.satisfied,reason:effectEval.reason,conditions:effectEval.conditions});
      if(!effectEval.satisfied){excludedLog.push({holder:meta.holder,slot:'formation',skillName:skill.name,source:e.sourceLabel||rec.source,parameter:e.key,reason:effectEval.reason,conditions:effectEval.conditions});return;}
      const adjusted=applyFormationDeploymentMultiplierToEffect(e,ctx);
      effectsRaw.push({...adjusted,sourceLabel:`陣形:${skill.sourceName}:${adjusted.sourceLabel||rec.source}`,sourceItemCategory:'formations',sourceItemName:skill.sourceName,sourceSlotKey:'formation',sourcePosition:'陣形'});
    });
    parsed.specials.forEach(sp=>{
      const specialEval=evaluateFormationConditionText([sp.rawText,sp.condition].filter(Boolean).join(' '),meta,ctx,{excludeCombat:true,ignoreBattleMode:false,ignoreBattleHp:true});
      if(specialEval.satisfied)specials.push({...sp,sourceLabel:`陣形:${skill.sourceName}:${sp.sourceLabel||rec.source}`});
    });
  });
  const formationEffects=effectsRaw.filter(e=>norm(e?.sourceLabel||'').startsWith('陣形:'));
  const byTiming=formationEffects.reduce((acc,e)=>{const k=e.timing||classifyEffectTiming(e.rawText||'',e.condition||'');acc[k]=(acc[k]||0)+1;return acc;},{});
  debugLog('formationMaster:effects-applied',{formationName:normalizeFormationMasterName(f?.formationName||'基本'),deploymentType:ctx?.deploymentType||'',deploymentTypeLabel:ctx?.deploymentTypeLabel||'',skillCount:skills.length,effectCount:formationEffects.length,byTiming,adoptedSources:formationEffects.map(e=>({key:e.key,value:e.value,unit:e.unit,timing:e.timing,source:e.sourceLabel,condition:e.condition})).slice(0,20)});
}

function splitSkillConditionBlocks(text){
  const segments=splitEffectSegments(text);
  const blocks=[];
  let current={index:0,condition:'常に',rawCondition:'■常に',segments:[],text:''};
  function isIgnorableLevelPrefix(body){
    const t=norm(body||'');
    if(!t)return true;
    // extractRomanLevelBlockText の戻り値は「Ⅰ■主将...」のようにLv記号で始まるため、
    // splitEffectSegments 後に「Ⅰ」だけの疑似「常に」ブロックが発生する。
    // これを有効ブロック扱いすると、主将限定技能（例: 不敗）が副将でも有効になるため除外する。
    return /^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+$/.test(t);
  }
  function pushCurrent(){
    if(!current)return;
    const body=current.segments.map(norm).filter(Boolean).join(' ');
    if(isIgnorableLevelPrefix(body)){
      debugLog('conditionBlock:ignored-level-prefix',{condition:current.condition,rawCondition:current.rawCondition,text:body});
      return;
    }
    current.text=body||current.rawCondition||'';
    blocks.push(current);
  }
  segments.forEach(seg=>{
    const t=norm(seg);
    if(!t)return;
    if(t.startsWith('■')){
      if(current.segments.length)pushCurrent();
      current={index:blocks.length,condition:cleanConditionText(t)||'常に',rawCondition:t,segments:[t],text:''};
    }else{
      current.segments.push(t);
    }
  });
  if(current.segments.length)pushCurrent();
  const whole=norm(text);
  if(!blocks.length&&whole&&!isIgnorableLevelPrefix(whole))blocks.push({index:0,condition:'常に',rawCondition:'■常に',segments:[whole],text:whole});
  debugLog('conditionBlock:split',{blockCount:blocks.length,conditions:blocks.map(b=>b.condition),sample:blocks.slice(0,5).map(b=>({condition:b.condition,text:b.text.slice(0,120)}))});
  return blocks;
}
function resolveServantContext(meta){
  const resolved={...(meta||{})};
  if(resolved.sourceType==='attendant'){
    resolved.originalHolderRole=resolved.holderRole||'attendant';
    resolved.holderRole=resolved.slotKey||resolved.holderSlot||resolved.holderRole;
    resolved.holderSlot=resolved.slotKey||resolved.holderSlot;
    debugLog('servant:context-resolved',{holder:resolved.holder,slotKey:resolved.slotKey,asHolderSlot:resolved.holderSlot,asHolderRole:resolved.holderRole,reason:'attendant skill is evaluated as the assigned parent slot'});
  }
  return resolved;
}
function evaluateConditionBlock(block,meta,ctx,opts={}){
  const resolvedMeta=resolveServantContext(meta||{});
  const rawText=norm(block?.text||block?.rawCondition||'');
  // 条件ブロック全体の採否では、"→自都市駐屯部隊に編制されている際、効果が3倍"のような
  // 倍率補正行だけを条件として扱わない。常時+5%などの基礎効果は通常/詰所でも採用し、
  // 倍率補正は applyFormationDeploymentMultiplierToEffect 側で個別効果ごとに判定する。
  const evaluationText=sanitizeFormationEffectConditionText(rawText);
  const text=evaluationText||rawText;
  const result=evaluateFormationConditionText(text,{...resolvedMeta,holderName:resolvedMeta.holder},ctx,opts);
  debugLog('conditionBlock:evaluate',{holder:resolvedMeta.holder,slot:resolvedMeta.holderSlot,sourceType:resolvedMeta.sourceType,condition:block?.condition||'',adopted:result.satisfied,reason:result.reason,conditions:result.conditions,text:text.slice(0,160),rawText:rawText.slice(0,160),sanitizedForMultiplier:rawText!==text});
  return result;
}
function getActiveSkillBlocks(record,meta,ctx,opts={}){
  const blocks=splitSkillConditionBlocks(record?.text||'');
  const adopted=[];
  const excluded=[];
  blocks.forEach(block=>{
    const evaluation=evaluateConditionBlock(block,meta,ctx,opts);
    const row={block,evaluation};
    if(evaluation.satisfied){adopted.push(row);debugLog('conditionBlock:adopted',{holder:meta?.holder,slot:meta?.holderSlot,source:record?.source,condition:block.condition,reason:evaluation.reason});}
    else{excluded.push(row);debugLog('conditionBlock:excluded',{holder:meta?.holder,slot:meta?.holderSlot,source:record?.source,condition:block.condition,reason:evaluation.reason});}
  });
  return {blocks,adopted,excluded,activeText:adopted.map(x=>x.block.text).join(' ')};
}

function evaluateGrantedSkillParentBlock(rec,meta,ctx,opts={}){
  if(!rec?.grantedFromSkill)return {satisfied:true,reason:'not a granted skill',conditions:[],block:null};
  const parentText=norm(rec.grantedFromParentText||'');
  const matched=norm(rec.grantedFromMatchedText||'');
  if(!parentText)return {satisfied:true,reason:'granted parent text not available',conditions:[],block:null};
  const blocks=splitSkillConditionBlocks(parentText);
  const target=blocks.find(b=>!matched||norm(b.text).includes(matched))||blocks[0]||null;
  if(!target)return {satisfied:true,reason:'granted parent block not found',conditions:[],block:null};
  const evaluation=evaluateConditionBlock(target,meta,ctx,opts);
  const payload={holder:meta?.holder,slot:meta?.holderSlot,source:rec.source,grantedFromSkill:rec.grantedFromSkill,grantedSkill:rec.grantedSkillName||rec.formationSkillName,matchedText:matched,condition:target.condition,adopted:evaluation.satisfied,reason:evaluation.reason,conditions:evaluation.conditions||[]};
  debugLog('formation:granted-skill-block-evaluate',payload);
  debugLog(evaluation.satisfied?'formation:granted-skill-adopted':'formation:granted-skill-excluded',payload);
  return {...evaluation,block:target};
}


function evaluateEquipmentSkillLvBoostParentCondition(rec,meta,ctx){
  if(!(meta?.sourceType==='equipment'&&rec?.equipmentReferenceKind==='skill-lv-boost'))return {satisfied:true,reason:'not equipment skill Lv boost',conditions:[],block:null};
  const parentText=norm(rec.equipmentReferenceParentText||'');
  const matched=norm(rec.equipmentReferenceText||'');
  if(!parentText)return {satisfied:true,reason:'equipment boost parent text not available',conditions:[],block:null};
  const blocks=splitSkillConditionBlocks(parentText);
  const target=blocks.find(b=>!matched||norm(b.text).includes(matched))||blocks[0]||null;
  if(!target)return {satisfied:true,reason:'equipment boost parent block not found',conditions:[],block:null};
  const evaluation=evaluateConditionBlock(target,meta,ctx,{excludeCombat:false,ignoreBattleMode:true,ignoreBattleHp:true});
  const payload={holder:meta?.holder,slot:meta?.holderSlot,source:rec.source,parentSkillName:rec.parentSkillName||'',targetSkill:rec.grantedSkillName||rec.formationSkillName||'',matchedText:matched,condition:target.condition,adopted:evaluation.satisfied,reason:evaluation.reason,conditions:evaluation.conditions||[]};
  debugLog('formation:equipment-skill-lv-boost-parent-evaluate',payload);
  return {...evaluation,block:target};
}
function formationSkillNameLevelFromSource(label){let s=norm(label||'');if(!s)return {name:'',level:0};if(s.includes(':'))s=s.split(':').pop();s=s.replace(/^技能:/,'').replace(/^(武器|防具|文物|侍従|主将|副将|補佐):?/,'');const lv=(s.match(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]$/)||[''])[0];const level=lv?ROMAN_LEVELS.indexOf(lv)+1:0;if(lv)s=s.slice(0,-lv.length);return {name:norm(s),level};}
function formationSkillSummaryKey(label){const p=formationSkillNameLevelFromSource(label);return p.name||parameterSourceRangeBase(label);}
function formationSelectEffectsForLevel(items,targetLevel,mode){const parsed=(items||[]).map(e=>({e,...formationSkillNameLevelFromSource(e.sourceLabel||'')}));const withLevel=parsed.filter(x=>x.level>0);if(withLevel.length){const levels=[...new Set(withLevel.map(x=>x.level))].sort((a,b)=>a-b);let chosen=targetLevel||((mode==='min')?levels[0]:levels[levels.length-1]);if(!levels.includes(chosen)){const lower=levels.filter(v=>v<=chosen).pop();const higher=levels.find(v=>v>=chosen);chosen=lower||higher||levels[levels.length-1];}return withLevel.filter(x=>x.level===chosen).map(x=>x.e);}const sorted=[...(items||[])].sort((a,b)=>Math.abs(effectSignedValue(a))-Math.abs(effectSignedValue(b)));if(!sorted.length)return [];return [mode==='min'?sorted[0]:sorted[sorted.length-1]];}
function summarizeFormationEffectsBySkillLevel(effects,skillList){
  const out={};
  const skillMap=new Map((skillList||[]).map(s=>[norm(s.name),s]));
  const mixed=new Set();
  const signGroups=new Map();
  (effects||[]).forEach(e=>{const base=[e.timing||'normal',e.group||'special',e.key].join('|');if(!signGroups.has(base))signGroups.set(base,new Set());signGroups.get(base).add(e.sign==='-'?'-':'+');});
  signGroups.forEach((set,base)=>{if(set.has('+')&&set.has('-'))mixed.add(base);});
  (effects||[]).forEach(e=>{const t=e.timing||'normal',g=e.group||'special',k=e.key;const base=[t,g,k].join('|');const displayKey=(mixed.has(base)&&e.sign==='-')?`${k}低下`:k;if(!out[t])out[t]={};if(!out[t][g])out[t][g]={};if(!out[t][g][displayKey])out[t][g][displayKey]={unit:(e.unit===undefined?'%':e.unit),items:[],total:0,minTotal:0,maxTotal:0,minItems:[],maxItems:[],isRange:false};out[t][g][displayKey].items.push(e);});
  Object.keys(out).forEach(t=>{Object.keys(out[t]).forEach(g=>{Object.keys(out[t][g]).forEach(k=>{const entry=out[t][g][k];const bySkill=new Map();entry.items.forEach(e=>{const key=formationSkillSummaryKey(e.sourceLabel);if(!bySkill.has(key))bySkill.set(key,[]);bySkill.get(key).push(e);});let minTotal=0,maxTotal=0,minItems=[],maxItems=[];bySkill.forEach((items,skillName)=>{const skill=skillMap.get(norm(skillName));const hasRoman=items.some(e=>formationSkillNameLevelFromSource(e.sourceLabel||'').level>0);if(skill&&hasRoman){const fixed=state.viewMode==='saved';const targetMin=fixed?(skill.total||skill.max||skill.min):skill.min;const targetMax=fixed?(skill.total||skill.max||skill.min):skill.max;const selectedMin=formationSelectEffectsForLevel(items,targetMin,'min');const selectedMax=formationSelectEffectsForLevel(items,targetMax,'max');selectedMin.forEach(e=>{minTotal+=effectSignedValue(e);minItems.push(e);});selectedMax.forEach(e=>{maxTotal+=effectSignedValue(e);maxItems.push(e);});}else{const selectedMin=formationSelectEffectsForLevel(items,0,'min');const selectedMax=formationSelectEffectsForLevel(items,0,'max');selectedMin.forEach(e=>{minTotal+=effectSignedValue(e);minItems.push(e);});selectedMax.forEach(e=>{maxTotal+=effectSignedValue(e);maxItems.push(e);});}});entry.minTotal=minTotal;entry.maxTotal=maxTotal;entry.total=maxTotal;entry.minItems=minItems;entry.maxItems=maxItems;entry.items=maxItems;entry.isRange=minTotal!==maxTotal;applyParameterSummaryCapToEntry(k,entry);});});});
  return out;
}

const FORMATION_GENERAL_SKILL_KIND_ORDER=['LR固有','継承','UR固有','将星4成長','将星7覚醒','その他','将星2成長'];
const FORMATION_SKILL_SOURCE_ORDER=[...FORMATION_GENERAL_SKILL_KIND_ORDER,'異文化調査','参軍','五行','軍馬','陣形','装備'];
const FORMATION_SKILL_FILTER_OPTIONS=['全て','武将','継承','異文化調査','参軍','五行','軍馬','陣形','装備'];
function formationSkillSourceCategory(meta){if(meta?.sourceType==='inheritedSkill')return '継承';if(meta?.sourceType==='ethnicResearchSkill')return '異文化調査';if(meta?.sourceType==='equipment')return '装備';if(meta?.sourceType==='advisor')return '参軍';if(meta?.sourceType==='fiveElements')return '五行';if(meta?.sourceType==='horse')return '軍馬';if(meta?.sourceType==='formationShape')return '陣形';return 'その他';}
function normalizeFormationSkillFilter(value){return FORMATION_SKILL_FILTER_OPTIONS.includes(value)?value:'全て';}
function formationSkillSourceOrderValue(categories){const arr=Array.isArray(categories)?categories:[...((categories&&typeof categories.forEach==='function')?categories:[])];const idxs=arr.map(c=>FORMATION_SKILL_SOURCE_ORDER.indexOf(c)).filter(i=>i>=0);return idxs.length?Math.min(...idxs):999;}
function formationSkillMatchesFilter(row,filter){const f=normalizeFormationSkillFilter(filter);if(f==='全て')return true;const cats=row?.sourceCategories||[];if(f==='武将')return cats.some(c=>isFormationGeneralSkillKind(c));return cats.includes(f);}
function renderFormationSkillFilterSelect(){const current=normalizeFormationSkillFilter(state.formationSkillFilter);return `<label class="note row" style="gap:6px">表示<select id="formationSkillFilterSelect" class="formation-filter-select">${FORMATION_SKILL_FILTER_OPTIONS.map(opt=>`<option value="${esc(opt)}" ${opt===current?'selected':''}>${esc(opt)}</option>`).join('')}</select></label>`;}
function isFormationNumericParameterEffect(effect){const value=Number(effect?.value);const key=norm(effect?.key||'');const ok=!!key&&Number.isFinite(value);if(!ok)debugLog('formationParameter:non-numeric-excluded',{source:effect?.sourceLabel||'',key:effect?.key||'',value:effect?.value,raw:effect?.rawText||'',reason:'state variation summary accepts numeric parameter effects only'});return ok;}
function isFormationStatusSummarySupportedKey(key){return allParameterSummaryKeys().has(norm(key||''));}
function normalizeEthnicTriggerSkillName(value){return norm(value||'').replace(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]$/,'');}
function getSkillRowAggregatedLevel(skillRows,skillName){
  const target=normalizeEthnicTriggerSkillName(skillName);
  if(!target||!(skillRows instanceof Map))return 0;
  let total=0;
  const exact=skillRows.get(target);
  if(exact&&Array.isArray(exact.levels))total+=exact.levels.reduce((a,b)=>a+(Number(b)||0),0);
  skillRows.forEach((row,key)=>{
    const rowName=normalizeEthnicTriggerSkillName(row?.name||key||'');
    if(rowName!==target||key===target)return;
    if(Array.isArray(row.levels))total+=row.levels.reduce((a,b)=>a+(Number(b)||0),0);
  });
  return total;
}
function getEthnicResearchSkillLevelData(skill,roman){
  const lv=normalizeSkillLevelValue(roman)||'Ⅰ';
  const levels=Array.isArray(skill?.levels)?skill.levels:[];
  return levels.find(x=>norm(x.roman||'')===lv)||levels[0]||{roman:lv,effectText:'',effects:[]};
}
function isEthnicResearchEffectConditionSatisfied(effect,f){
  const type=norm(effect?.conditionType||'always');
  if(type==='armamentEquipped'||Array.isArray(effect?.requiredArmaments)){
    const current=normalizeSaveItemName(f?.ethnicArmament?.name||'');
    const required=(effect?.requiredArmaments||[]).map(normalizeSaveItemName).filter(Boolean);
    const ok=!!current&&required.includes(current);
    return {ok,reason:ok?'required armament is equipped':'required armament is not equipped',currentArmament:current,requiredArmaments:required,conditionType:'armamentEquipped'};
  }
  return {ok:true,reason:'condition accepted by static formation calculation',conditionType:type||'always'};
}
function ethnicResearchEffectToParameterEffect(effect,skill,levelData){
  const key=norm(effect?.key||'');
  const value=Number(effect?.value);
  if(!key||!Number.isFinite(value))return null;
  const timing=norm(effect?.timing||'normal')||'normal';
  const sign=effect?.sign==='-'?'-':'+';
  const unit=effect?.unit===undefined?'%':effect.unit;
  return {timing,key,value,unit,sign,sourceLabel:`技能:${skill.name}${levelData.roman||''}`,condition:cleanConditionText(effect?.conditionText||''),rawText:norm(effect?.conditionText||'')||norm(levelData?.effectText||''),isConditional:!!norm(effect?.conditionText||''),group:getParamGroup(key),timingLabel:timingLabel(timing),sourceType:'ethnicResearchSkill'};
}
function classifyEthnicResearchStructuredEffect(effect,skill,levelData,f){
  const condition=isEthnicResearchEffectConditionSatisfied(effect,f);
  const key=norm(effect?.key||'');
  const value=Number(effect?.value);
  const numeric=!!key&&Number.isFinite(value);
  const supportedKey=isFormationStatusSummarySupportedKey(key);
  const conditional=condition.conditionType!=='always'||!!norm(effect?.conditionText||'')||Array.isArray(effect?.requiredArmaments);
  const base={skillName:skill?.name||'',ethnicGroup:skill?.ethnicGroup||'',level:levelData?.roman||'',key,value:effect?.value,unit:effect?.unit===undefined?'%':effect?.unit,sign:effect?.sign==='-'?'-':'+',conditionType:condition.conditionType,conditionText:norm(effect?.conditionText||''),currentArmament:condition.currentArmament||'',requiredArmaments:condition.requiredArmaments||[],numeric,supportedKey,conditional,summaryTarget:norm(effect?.summaryTarget||'formationStatusRate')};
  if(!condition.ok)return {...base,ok:false,action:'excluded-condition',reason:condition.reason};
  if(!numeric)return {...base,ok:false,action:'excluded-non-numeric',reason:'effect has no numeric key/value for state variation summary'};
  if(!supportedKey)return {...base,ok:false,action:'excluded-unsupported-key',reason:'effect key is not included in state variation summary keys'};
  return {...base,ok:true,action:conditional?'adopted-conditional':'adopted',reason:condition.reason};
}
function buildEthnicResearchEffectDiagnostics(){
  const skills=Array.isArray(state.ethnicResearchSkills)?state.ethnicResearchSkills:[];
  const counts={skills:skills.length,levels:0,effects:0,supported:0,conditional:0,unsupportedKey:0,nonNumeric:0,noEffects:0};
  const samples={conditional:[],unsupportedKey:[],nonNumeric:[],noEffects:[]};
  skills.forEach(skill=>{
    const levels=Array.isArray(skill?.levels)?skill.levels:[];
    levels.forEach(levelData=>{
      counts.levels++;
      const effects=Array.isArray(levelData?.effects)?levelData.effects:[];
      if(!effects.length){counts.noEffects++;if(samples.noEffects.length<10)samples.noEffects.push({skillName:getItemDisplayName(skill),level:levelData?.roman||arabicLevelToRoman(levelData?.level)||''});}
      effects.forEach(effect=>{
        counts.effects++;
        const diag=classifyEthnicResearchStructuredEffect(effect,skill,levelData,{ethnicArmament:{name:(effect?.requiredArmaments||[])[0]||''}});
        if(diag.numeric&&diag.supportedKey)counts.supported++;
        if(diag.conditional){counts.conditional++;if(samples.conditional.length<10)samples.conditional.push(diag);}
        if(!diag.numeric){counts.nonNumeric++;if(samples.nonNumeric.length<10)samples.nonNumeric.push(diag);}
        if(diag.numeric&&!diag.supportedKey){counts.unsupportedKey++;if(samples.unsupportedKey.length<10)samples.unsupportedKey.push(diag);}
      });
    });
  });
  return {ok:true,counts,samples};
}
function applyActiveEthnicResearchSkills(f,skillRows,effectsRaw,specials,contributionLog,excludedLog){
  const adopted=[];
  const skills=Array.isArray(state.ethnicResearchSkills)?state.ethnicResearchSkills:[];
  const effectStats={adopted:0,conditionalAdopted:0,excludedCondition:0,unsupportedKey:0,nonNumeric:0,totalEffects:0};
  skills.forEach(skill=>{
    const triggerSkill=norm(skill.triggerSkill||skill.ethnicGroup||'');
    const triggerMinLevel=Number(skill.triggerMinLevel)||3;
    const triggerLevel=getSkillRowAggregatedLevel(skillRows,triggerSkill);
    const setting=getEffectiveEthnicResearchSkillSetting(skill,false);
    if(triggerLevel<triggerMinLevel){const row={skillName:skill.name,ethnicGroup:skill.ethnicGroup,triggerSkill,triggerLevel,triggerMinLevel,reason:'trigger skill level is lower than required',settingSource:setting.source,policy:'saved default is enabled, but trigger level is insufficient'};excludedLog.push(row);debugLog('formation:ethnic-research-skill-excluded',row);return;}
    if(!setting.enabled){const row={skillName:skill.name,ethnicGroup:skill.ethnicGroup,triggerSkill,triggerLevel,triggerMinLevel,reason:setting.source==='all-initial'?'all-data initial disables ethnic research skill':'effective ethnic research setting disabled',settingSource:setting.source};excludedLog.push(row);debugLog('formation:ethnic-research-skill-excluded',row);return;}
    const levelData=getEthnicResearchSkillLevelData(skill,setting.level);
    if(!skillRows.has(skill.name))skillRows.set(skill.name,{name:skill.name,holders:new Set(),levels:[],category:'ethnicResearchSkill',sourceCategories:new Set()});
    const r=skillRows.get(skill.name);r.holders.add(`異文化調査:${skill.ethnicGroup||triggerSkill}`);r.levels.push(Math.max(1,ROMAN_LEVELS.indexOf(levelData.roman||setting.level)+1));r.sourceCategories.add('異文化調査');
    const adoptedRow={skillName:skill.name,ethnicGroup:skill.ethnicGroup,triggerSkill,triggerLevel,triggerMinLevel,settingLevel:levelData.roman||setting.level,settingSource:setting.source,reason:'trigger skill level satisfied and effective ethnic research setting enabled'};
    contributionLog.push({holder:`異文化調査:${skill.ethnicGroup||triggerSkill}`,slot:'ethnicResearch',skillName:skill.name,level:ROMAN_LEVELS.indexOf(levelData.roman||setting.level)+1,source:`技能:${skill.name}${levelData.roman||setting.level}`,sourceType:'ethnicResearchSkill',adoptedBlocks:['異文化調査専用技能']});
    debugLog('formation:ethnic-research-skill-adopted',adoptedRow);
    adopted.push(adoptedRow);
    const levelEffects=Array.isArray(levelData.effects)?levelData.effects:[];
    if(!levelEffects.length)debugLog('formation:ethnic-research-effect-none',{skillName:skill.name,level:levelData.roman||setting.level,reason:'no structured effects for this level'});
    levelEffects.forEach(effect=>{
      effectStats.totalEffects++;
      const classified=classifyEthnicResearchStructuredEffect(effect,skill,levelData,f);
      debugLog('formation:ethnic-research-effect-classified',classified);
      if(!classified.ok){
        const row={skillName:skill.name,effectKey:classified.key,action:classified.action,reason:classified.reason,currentArmament:classified.currentArmament,requiredArmaments:classified.requiredArmaments,settingSource:setting.source,level:classified.level};
        excludedLog.push(row);
        if(classified.action==='excluded-condition')effectStats.excludedCondition++;
        else if(classified.action==='excluded-unsupported-key')effectStats.unsupportedKey++;
        else if(classified.action==='excluded-non-numeric')effectStats.nonNumeric++;
        debugLog(classified.action==='excluded-unsupported-key'?'formation:ethnic-research-effect-unsupported':'formation:ethnic-research-effect-excluded',row);
        return;
      }
      const converted=ethnicResearchEffectToParameterEffect(effect,skill,levelData);
      if(!converted||!isFormationNumericParameterEffect(converted)){effectStats.nonNumeric++;excludedLog.push({skillName:skill.name,effectKey:effect.key,reason:'non-numeric structured effect excluded'});return;}
      effectsRaw.push(converted);
      effectStats.adopted++;
      if(classified.action==='adopted-conditional')effectStats.conditionalAdopted++;
      debugLog('formation:ethnic-research-effect-adopted',{skillName:skill.name,key:converted.key,value:converted.value,unit:converted.unit,sign:converted.sign,condition:converted.condition,conditionType:classified.conditionType,settingSource:setting.source,level:classified.level,reason:classified.reason});
    });
  });
  debugLog('formation:ethnic-research-effect-summary',{adoptedSkillCount:adopted.length,effectStats});
  return adopted;
}

function normalizeFiveElementKey(key){const k=norm(key);const map={wood:'wood',木:'wood',fire:'fire',火:'fire',earth:'earth',土:'earth',metal:'metal',金:'metal',water:'water',水:'water'};return map[k]||'';}
function fiveElementLabel(key){return ({wood:'木',fire:'火',earth:'土',metal:'金',water:'水'}[normalizeFiveElementKey(key)]||norm(key)||'-');}
function normalizeLoadedFiveElements(raw){
  if(!Array.isArray(raw))return [];
  return raw.map((item,index)=>{
    const src=item&&typeof item==='object'?item:{};
    const name=norm(src.name||src.title||`五行技能${index+1}`);
    const requirements={wood:0,fire:0,earth:0,metal:0,water:0};
    Object.entries(src.requirements||{}).forEach(([k,v])=>{const key=normalizeFiveElementKey(k);if(key)requirements[key]=Math.max(0,Number(v)||0);});
    return {name,level:norm(src.level||'Ⅰ')||'Ⅰ',requirements,text:norm(src.text||''),parameterEffects:Array.isArray(src.parameterEffects)?src.parameterEffects:[],dynamicEffects:Array.isArray(src.dynamicEffects)?src.dynamicEffects:[],sourceDataset:'fiveElements',category:'五行',raw:src,searchTokens:uniq([name,norm(src.text||'')])};
  }).filter(x=>!!x.name);
}
function fiveElementSkillDatasetItems(){
  return (state.fiveElements||[]).map(item=>({name:item.name,title:item.name,category:'skills',sourceDataset:'skills',sourceKind:'fiveElements',sections:[{title:item.name,content:[item.text]}],tables:[],url:'',raw:{...(item.raw||{}),sourceFiveElement:true,requirements:item.requirements,text:item.text},searchTokens:uniq([item.name,item.text,'五行'])}));
}

function createEmptyLevelTextMap(maxLevel){const out={};for(let i=1;i<=Math.max(0,Number(maxLevel)||0);i++)out[String(i)]='';return out;}
function createEmptyNumericEffectsMap(maxLevel){const out={};for(let i=1;i<=Math.max(0,Number(maxLevel)||0);i++)out[String(i)]=[];return out;}
function normalizeLoadedWarhorses(raw){
  if(!Array.isArray(raw))return [];
  return raw.map((item,index)=>{
    const src=item&&typeof item==='object'?item:{};
    const name=norm(src.name||src.title||`軍馬${index+1}`);
    const id=norm(src.id||src.key||src.masterId||name||`warhorse_${index+1}`);
    const kind=norm(src.kind||src.type||src.horseKind||'normal')==='famous'?'famous':'normal';
    const fixedSkillId=norm(src.fixedSkillId||src.fixedSkill?.skillId||src.fixedSkill?.id||src.fixedSkill?.name||src.famousSkillId||'');
    const fixedSkillName=norm(src.fixedSkill?.name||fixedSkillId||'');
    const skillSlotCount=Math.max(0,Math.min(3,Number(src.skillSlotCount ?? 3)||3));
    const starFixedSkillLevels=(src.starFixedSkillLevels&&typeof src.starFixedSkillLevels==='object')?src.starFixedSkillLevels:((src.fixedSkill?.levelByStar&&typeof src.fixedSkill.levelByStar==='object')?src.fixedSkill.levelByStar:null);
    const starEffects=src.starEffects&&typeof src.starEffects==='object'?src.starEffects:[];
    const stats=src.stats&&typeof src.stats==='object'?src.stats:((src.baseStats&&typeof src.baseStats==='object')?src.baseStats:{});
    return {id,name,title:name,kind,category:'warhorses',sourceDataset:'warhorses',displayOrder:Number(src.displayOrder)||index+1,fixedSkillId,fixedSkillName,skillSlotCount,starEnabled:!!src.starEnabled||kind==='famous',favoriteEnabled:!!src.favoriteEnabled||kind==='famous',starFixedSkillLevels,starEffects,stats,baseStats:stats,raw:src,searchTokens:uniq([name,kind==='famous'?'名馬':'通常馬',fixedSkillId,fixedSkillName,'軍馬',...Object.keys(stats||{}),...Object.values(stats||{}).map(v=>String(v))])};
  }).filter(x=>!!x.name);
}
function getWarhorseSkillKindFromSource(src){const k=norm(src?.skillKind||src?.kind||src?.type||'normal');return (k==='famous'||k==='famous_fixed'||k==='fixed_by_famous_horse_star')?'famous':'normal';}
function normalizeLoadedWarhorseSkills(raw){
  if(!Array.isArray(raw))return [];
  return raw.map((item,index)=>{
    const src=item&&typeof item==='object'?item:{};
    const name=norm(src.name||src.title||`軍馬技能${index+1}`);
    const id=norm(src.id||src.key||name||`warhorse_skill_${index+1}`);
    const skillKind=getWarhorseSkillKindFromSource(src);
    const maxSetLevel=skillKind==='normal'?Math.max(1,Math.min(5,Number(src.maxSetLevel)||5)):Math.max(1,Number(src.maxSetLevel)||Number(src.maxEffectiveLevel)||3);
    const maxEffectiveLevel=skillKind==='famous'?Math.max(1,Number(src.maxEffectiveLevel)||maxSetLevel||3):Math.max(1,Math.min(10,Number(src.maxEffectiveLevel)||10));
    const effectsByLevel=src.effectsByLevel&&typeof src.effectsByLevel==='object'?src.effectsByLevel:createEmptyLevelTextMap(maxEffectiveLevel);
    const numericEffectsByLevel=src.numericEffectsByLevel&&typeof src.numericEffectsByLevel==='object'?src.numericEffectsByLevel:createEmptyNumericEffectsMap(maxEffectiveLevel);
    const targetTroopType=norm(src.targetTroopType||src.troopType||'');
    const acquisitionRegions=Array.isArray(src.acquisitionRegions)?src.acquisitionRegions:[];
    const famousHorse=norm(src.famousHorse||'');
    const tags=uniq([...(Array.isArray(src.tags)?src.tags:[]),targetTroopType,famousHorse,skillKind==='famous'?'名馬固有技能':'通常軍馬技能','軍馬技能']);
    return {id,name,title:name,category:'warhorseSkills',sourceDataset:'warhorseSkills',skillKind,maxSetLevel,maxEffectiveLevel,levelCombine:norm(src.levelCombine|| (skillKind==='famous'?'fixed_by_famous_horse_star':'sum_cap')),targetTroopType,acquisitionRegions,famousHorse,tags,effectsByLevel,numericEffectsByLevel,raw:src,searchTokens:uniq([name,skillKind,targetTroopType,famousHorse,...tags,...acquisitionRegions.map(x=>norm(x?.region||x)).filter(Boolean)])};
  }).filter(x=>!!x.name);
}
function getFormationGeneralFiveElementValues(generalName){
  const out={wood:0,fire:0,earth:0,metal:0,water:0};
  const name=normalizeSaveItemName(generalName);
  if(!name)return out;
  if(state.viewMode==='all'){
    const v=normalizeGeneralStage(state.generalStage)==='max'?10:0;
    Object.keys(out).forEach(k=>out[k]=v);
    return out;
  }
  const settings=getCurrentGeneralSettings(name,false);
  const values=settings?.fiveElements||{};
  Object.entries(values).forEach(([k,v])=>{const key=normalizeFiveElementKey(k);if(key)out[key]=Math.max(0,Number(v)||0);});
  return out;
}
function calculateFormationFiveElementSummary(f){
  const members=[];const total={wood:0,fire:0,earth:0,metal:0,water:0};
  FORMATION_SLOT_SPECS.forEach(spec=>{
    if(!['main','deputy1','deputy2','support1','support2'].includes(spec.key))return;
    const generalName=norm(f?.slots?.[spec.key]?.general||'');
    if(!generalName)return;
    const values=getFormationGeneralFiveElementValues(generalName);
    Object.keys(total).forEach(k=>{total[k]+=Number(values[k])||0;});
    members.push({slotKey:spec.key,slotLabel:spec.label,name:generalName,values});
  });
  return {total,members};
}
function fiveElementRequirementSatisfied(total,requirements){
  const req=requirements||{};
  return ['wood','fire','earth','metal','water'].every(k=>(Number(total?.[k])||0)>=(Number(req[k])||0));
}
function countFormationMembersByFiveElementLevel(summary,element,minLevel){
  const key=normalizeFiveElementKey(element);const min=Number(minLevel)||0;
  if(!key)return 0;
  return (summary?.members||[]).filter(m=>(Number(m.values?.[key])||0)>=min).length;
}
function fiveElementEffectTiming(timing){const t=norm(timing||'normal');if(['tactic','deploy','normal','defense'].includes(t))return t;return 'normal';}
function addExplicitFiveElementEffect(effectsRaw,item,effect,conditionText=''){
  const key=norm(effect?.key||effect?.parameterKey||'');const value=Number(effect?.value);
  if(!key||!Number.isFinite(value)||value===0)return;
  addEffect(effectsRaw,{timing:fiveElementEffectTiming(effect.timing),key,value:Math.abs(value),unit:effect.unit===undefined?'%':effect.unit,sign:(effect.sign||(value<0?'-':'+')),sourceLabel:`技能:${item.name}${item.level||'Ⅰ'}`,condition:conditionText||cleanConditionText(effect.condition||''),rawText:norm(effect.rawText||item.text||''),sourceItemCategory:'',sourceItemName:''});
}
function applyActiveFiveElementSkills(f,ctx,skillRows,effectsRaw,specials,contributionLog,excludedLog){
  const summary=calculateFormationFiveElementSummary(f);
  const adopted=[];
  (state.fiveElements||[]).forEach(item=>{
    if(!fiveElementRequirementSatisfied(summary.total,item.requirements)){excludedLog.push({holder:'五行',slot:'fiveElements',skillName:item.name,source:`五行:${item.name}`,reason:'five element requirement not satisfied',requirements:item.requirements,total:summary.total});return;}
    if(!skillRows.has(item.name))skillRows.set(item.name,{name:item.name,holders:new Set(),levels:[],category:'fiveElements',sourceCategories:new Set()});
    const row=skillRows.get(item.name);row.holders.add('五行');row.levels.push(1);row.sourceCategories.add('五行');
    contributionLog.push({holder:'五行',slot:'fiveElements',skillName:item.name,level:1,source:`五行:${item.name}`,sourceType:'fiveElements',adoptedBlocks:['五行条件達成']});
    (item.parameterEffects||[]).forEach(effect=>addExplicitFiveElementEffect(effectsRaw,item,effect,''));
    (item.dynamicEffects||[]).forEach(effect=>{
      if(effect.type!=='count_members_element_level')return;
      const count=countFormationMembersByFiveElementLevel(summary,effect.element,effect.minLevel);
      const value=count*(Number(effect.perMemberValue)||0);
      addExplicitFiveElementEffect(effectsRaw,item,{...effect,key:effect.parameterKey,value,timing:effect.timing||'normal',unit:effect.unit||'%'},`${fiveElementLabel(effect.element)}行Lv${effect.minLevel}以上の武将${count}人`);
    });
    adopted.push(item.name);
  });
  debugLog('formation:five-elements',{formationId:f?.id||'',total:summary.total,members:summary.members,adopted});
  return {summary,adopted};
}
function fiveElementSummaryLineHtml(summary){const t=summary?.total||{};return `<span class="five-element-total-line">${['wood','fire','earth','metal','water'].map(k=>`<span class="five-element-chip">${esc(fiveElementLabel(k))}<strong>${Number(t[k])||0}</strong></span>`).join('')}</span>`;}
function renderFormationFiveElementSummary(f,data){
  const summary=data?.fiveElementSummary||calculateFormationFiveElementSummary(f);
  const bodyRows=[];
  bodyRows.push('<div class="head">武将</div>'+['wood','fire','earth','metal','water'].map(k=>`<div class="head num">${esc(fiveElementLabel(k))}</div>`).join(''));
  (summary.members||[]).forEach(m=>{bodyRows.push(`<div>${esc(m.slotLabel)} ${esc(stripReadingForCopy(m.name))}</div>`+['wood','fire','earth','metal','water'].map(k=>`<div class="num">${Number(m.values?.[k])||0}</div>`).join(''));});
  if(!(summary.members||[]).length)bodyRows.push('<div>未配置</div><div class="num">0</div><div class="num">0</div><div class="num">0</div><div class="num">0</div><div class="num">0</div>');
  return `<details class="formation-mobile-summary-section formation-five-elements-section"><summary><span>合算五行</span>${fiveElementSummaryLineHtml(summary)}</summary><div class="formation-mobile-summary-body"><div class="five-element-grid">${bodyRows.join('')}</div></div></details>`;
}


function getWarhorseSkillById(skillId){const id=norm(skillId||'');return (state.warhorseSkills||[]).find(sk=>norm(sk.id||sk.name||sk.title)===id)||null;}
function normalizeWarhorseNumericEffectKey(effect){return norm(effect?.key||effect?.parameterKey||effect?.stat||effect?.status||'');}
function warhorseEffectSign(effect){const value=Number(effect?.value);if(effect?.sign==='-')return '-';return value<0?'-':'+';}
function isWarhorseEffectConditionSatisfied(effect,ctx){const condition=norm(effect?.condition||effect?.rawText||'');const troop=norm(ctx?.troopType||'');const m=condition.match(/自部隊が(騎兵|歩兵|弓兵)の場合/);if(m){const ok=troop===m[1];return {ok,reason:ok?'troop type matched':'troop type mismatch',requiredTroopType:m[1],troopType:troop};}return {ok:true,reason:'condition accepted'};}
function addWarhorseSkillRow(skillRows,name,holder,level){if(!name||!level)return;if(!skillRows.has(name))skillRows.set(name,{name,holders:new Set(),levels:[],category:'warhorse',sourceCategories:new Set()});const row=skillRows.get(name);row.holders.add(holder);row.levels.push(Number(level)||0);row.sourceCategories.add('軍馬');}
function addWarhorseNumericEffects(effectsRaw,skill,effectiveLevel,sourceLabel,ctx,excludedLog,holder){const levelKey=String(Math.max(1,Number(effectiveLevel)||1));const rawEffects=skill?.numericEffectsByLevel?.[levelKey]||[];const rawText=skill?.effectsByLevel?.[levelKey]||'';(Array.isArray(rawEffects)?rawEffects:[]).forEach(effect=>{const key=normalizeWarhorseNumericEffectKey(effect);const value=Number(effect?.value);if(!key||!Number.isFinite(value)||value===0){excludedLog.push({holder,slot:'warhorse',skillName:skill?.name||'',source:sourceLabel,parameter:key,reason:'invalid warhorse numeric effect'});return;}const cond=isWarhorseEffectConditionSatisfied(effect,ctx);if(!cond.ok){excludedLog.push({holder,slot:'warhorse',skillName:skill?.name||'',source:sourceLabel,parameter:key,reason:cond.reason,conditions:[cond]});return;}addEffect(effectsRaw,{timing:norm(effect?.timing||'normal')||'normal',key,value:Math.abs(value),unit:effect?.type==='percent'?'%':'',sign:warhorseEffectSign(effect),sourceLabel,condition:cleanConditionText(effect?.condition||''),rawText:rawText||effect?.rawText||'',sourceItemCategory:'warhorseSkills',sourceItemName:skill?.name||''});});}
function collectActiveWarhorseFormationEffects(f,ctx,skillRows,effectsRaw,contributionLog,excludedLog){const data=getCurrentWarhorseData();const active=Array.isArray(data.activeSlots)?data.activeSlots.slice(0,3):[null,null,null];while(active.length<3)active.push(null);const normalBySkill=new Map();const adopted=[];active.forEach((id,idx)=>{const entry=data.owned?.[norm(id||'')];if(!entry)return;const master=getWarhorseMasterById(entry.horseMasterId);const holder=`軍馬${idx+1}:${entry.name||entry.customName||entry.id}`;(Array.isArray(entry.skills)?entry.skills:[]).forEach(sk=>{const skill=getWarhorseSkillById(sk.skillId);if(!skill){excludedLog.push({holder,slot:`warhorse:${idx+1}`,skillName:sk.skillId,source:`軍馬:${entry.name||entry.id}`,reason:'warhorse skill master not found'});return;}const skillName=skill.name||skill.title||sk.skillId;const current=normalBySkill.get(skillName)||{skill,level:0,holders:[]};current.level+=Number(sk.level)||0;current.holders.push(holder);normalBySkill.set(skillName,current);});const isFamous=getWarhorseMasterKind(master)==='famous';if(isFamous){const fixedName=getWarhorseFixedSkillName(master);const fixedSkill=getWarhorseSkillById(fixedName)||getWarhorseSkillById(master?.fixedSkill?.name||master?.raw?.fixedSkill?.name||'');const fixedLv=getFamousHorseFixedSkillLevel(master,entry.star||0);if(fixedName&&fixedSkill&&fixedLv){addWarhorseSkillRow(skillRows,fixedSkill.name||fixedName,holder,fixedLv);contributionLog.push({holder,slot:`warhorse:${idx+1}`,skillName:fixedSkill.name||fixedName,level:fixedLv,source:`軍馬:${entry.name||entry.id}:${fixedSkill.name||fixedName}`,sourceType:'horse',adoptedBlocks:['名馬固有軍馬技能']});addWarhorseNumericEffects(effectsRaw,fixedSkill,fixedLv,`軍馬:${entry.name||entry.id}:${fixedSkill.name||fixedName}${ROMAN_LEVELS[Math.max(0,Math.min(ROMAN_LEVELS.length-1,(Number(fixedLv)||1)-1))]||fixedLv}`,ctx,excludedLog,holder);adopted.push({slot:idx+1,horse:entry.name||entry.id,skill:fixedSkill.name||fixedName,level:fixedLv,type:'famousFixed'});}const starEffects=getFamousHorseStarEffects(master,entry.star||0);(starEffects||[]).forEach(effect=>{const key=normalizeWarhorseNumericEffectKey(effect);const value=Number(effect?.value);if(!key||!Number.isFinite(value)||value===0)return;addEffect(effectsRaw,{timing:norm(effect?.timing||'normal')||'normal',key,value:Math.abs(value),unit:effect?.type==='percent'?'%':'',sign:warhorseEffectSign(effect),sourceLabel:`軍馬:${entry.name||entry.id}:将星効果`,condition:`将星${normalizeWarhorseFamousStarValue(entry.star||0)}`,rawText:formatWarhorseEffectSummary(effect),sourceItemCategory:'warhorses',sourceItemName:entry.name||entry.id});adopted.push({slot:idx+1,horse:entry.name||entry.id,skill:'将星効果',level:normalizeWarhorseFamousStarValue(entry.star||0),type:'famousStar'});});}});normalBySkill.forEach(({skill,level,holders},skillName)=>{const cap=Math.max(1,Number(skill?.maxEffectiveLevel)||10);const effectiveLevel=Math.max(1,Math.min(cap,level));addWarhorseSkillRow(skillRows,skillName,holders.join(' / '),effectiveLevel);contributionLog.push({holder:holders.join(' / '),slot:'warhorse',skillName,level:effectiveLevel,source:`軍馬:${skillName}`,sourceType:'horse',adoptedBlocks:[`通常軍馬技能Lv合算 ${level} / 上限${cap}`]});addWarhorseNumericEffects(effectsRaw,skill,effectiveLevel,`軍馬:${skillName}${ROMAN_LEVELS[Math.max(0,Math.min(ROMAN_LEVELS.length-1,(Number(effectiveLevel)||1)-1))]||effectiveLevel}`,ctx,excludedLog,holders.join(' / '));adopted.push({slot:'normal',horse:holders,skill:skillName,level:effectiveLevel,type:'normal'});});debugLog('formation:warhorse-effects',{formationId:f?.id||'',activeSlots:active,adoptedCount:adopted.length,adopted});return adopted;}

function getFormationParameterDataCacheStore(){
  if(!state._formationParameterDataCache)state._formationParameterDataCache=new Map();
  return state._formationParameterDataCache;
}
function formationParameterDataSignature(f){
  const save=typeof getCurrentSave==='function'?getCurrentSave():null;
  const picked={
    viewMode:state.viewMode||'',
    saveId:save?.id||'',
    savedSeq:state.savedSearchCacheSeq||0,
    generals:save?.generals||[],
    generalStars:save?.generalStars||{},
    generalSettings:save?.generalSettings||{},
    inheritedSkills:save?.inheritedSkills||{},
    equipments:save?.equipments||[],
    equipmentStars:save?.equipmentStars||{},
    equipmentStages:save?.equipmentStages||{},
    warhorses:save?.warhorses?.owned||{},
    formation:{
      id:f?.id||'',
      slots:f?.slots||{},
      formationName:f?.formationName||'',
      deploymentType:f?.deploymentType||'',
      siegeWeapon:f?.siegeWeapon||{},
      ethnicArmament:f?.ethnicArmament||{},
      ethnicGeneralName:f?.ethnicGeneralName||'',
      advisorSlots:f?.advisorSlots||{},
      warhorseSlots:f?.warhorseSlots||[]
    },
    dataCounts:{
      generals:state.generals?.length||0,
      skills:state.skills?.length||0,
      equipments:state.equipments?.length||0,
      formations:state.formationMasters?.length||0,
      siegeWeapons:state.siegeWeapons?.length||0,
      ethnicArmaments:state.ethnicArmaments?.length||0,
      fiveElements:state.fiveElements?.length||0,
      warhorseSkills:state.warhorseSkills?.length||0
    }
  };
  try{return JSON.stringify(picked);}catch{return `${f?.id||''}:${f?.updatedAt||''}:${Date.now()}`;}
}
function clearFormationParameterDataCache(reason='manual'){
  const cache=state._formationParameterDataCache;
  if(cache&&cache.size)cache.clear();
  state._formationParameterDataCacheClearedAt=debugTimestamp();
  debugLog('formationParameterData:cache-clear',{reason});
}
function buildFormationParameterData(f){
  const cache=getFormationParameterDataCacheStore();
  const key=formationParameterDataSignature(f);
  const hit=cache.get(key);
  if(hit){
    state._formationParameterDataCacheStats=state._formationParameterDataCacheStats||{hit:0,miss:0};
    state._formationParameterDataCacheStats.hit++;
    return hit.data;
  }
  const started=performance.now();
  const data=buildFormationParameterDataUncached(f);
  if(cache.size>6)cache.clear();
  cache.set(key,{data,createdAt:Date.now()});
  state._formationParameterDataCacheStats=state._formationParameterDataCacheStats||{hit:0,miss:0};
  state._formationParameterDataCacheStats.miss++;
  debugLog('formationParameterData:cache-miss',{formationId:f?.id||'',formationName:f?.name||'',cacheSize:cache.size,ms:Number((performance.now()-started).toFixed(1)),policy:'Update09 Phase2 caches parameter calculation by formation/save signature'});
  return data;
}
function buildFormationParameterDataUncached(f){
  const ctx=buildFormationContext(f);
  const items=collectFormationItems(f);
  const effectsRaw=[];const specials=[];const skillRows=new Map();const savedSkillLevelSeen=new Set();
  const baseGeneralSkills=new Set();const baseSkillMetas=new Map();const contributionLog=[];const excludedLog=[];const equipmentBoostLog=[];
  const skillAggregationConditionOpts={excludeCombat:false,ignoreBattleMode:true,ignoreBattleHp:true};
  const itemRecords=items.map(meta=>({meta,records:collectFormationParameterSourceRecords(meta.item).filter(r=>r.kind==='include'&&r.source!=='戦法')}));
  function addSkillRow(rec,meta,recSkillName,recLv){
    if(!recSkillName)return;
    if(!skillRows.has(recSkillName))skillRows.set(recSkillName,{name:recSkillName,holders:new Set(),levels:[],category:'skill',sourceCategories:new Set()});
    const recRow=skillRows.get(recSkillName);recRow.holders.add(meta.holder);recRow.sourceCategories.add(rec?.formationSourceCategory||formationSkillSourceCategory(meta));if(rec?.equipmentReferenceKind==='skill-lv-boost'&&Number(rec.equipmentSkillLimit)){if(!recRow.equipmentBoostCaps)recRow.equipmentBoostCaps=[];recRow.equipmentBoostCaps.push(Number(rec.equipmentSkillLimit));}
    if(recLv){
      const levelKey=state.viewMode==='saved'?`${recSkillName}::${meta.holder}::${rec.source}`:`${recSkillName}::${meta.holder}::${rec.source}`;
      if(state.viewMode!=='saved'||!savedSkillLevelSeen.has(levelKey)){recRow.levels.push(recLv);savedSkillLevelSeen.add(levelKey);}
    }
  }
  // 1st pass: collect adopted general/attendant skills as base skills for equipment Lv+ boost validation.
  itemRecords.forEach(({meta,records})=>{
    if(meta.sourceType==='equipment')return;
    records.forEach(rec=>{
      if(rec.isAdvisorSkill){debugLog('formationSkill:advisor-excluded',{phase:'base',holder:meta.holder,slot:meta.holderSlot,source:rec.source,reason:'advisor skill excluded from formation aggregation'});return;}if(rec.isAppointmentSkill||isAppointmentSkillText(rec.text)){debugLog('formationSkill:appointment-excluded',{phase:'base',holder:meta.holder,slot:meta.holderSlot,source:rec.source,reason:'appointment skill excluded from formation aggregation'});return;}
      const p=formationSkillNameLevelFromSource(rec.source||'');
      const name=rec.formationSkillName||p.name||getItemDisplayName(meta.item);
      const blockEval=getActiveSkillBlocks(rec,meta,ctx,skillAggregationConditionOpts);
      const parentEval=evaluateGrantedSkillParentBlock(rec,meta,ctx,skillAggregationConditionOpts);
      const baseAdopted=blockEval.adopted.length>0&&parentEval.satisfied;
      debugLog('formationSkill:condition-parse',{phase:'base',holder:meta.holder,slot:meta.holderSlot,skillName:name,source:rec.source,grantedFromSkill:rec.grantedFromSkill||'',blockCount:blockEval.blocks.length,adoptedBlockCount:blockEval.adopted.length,excludedBlockCount:blockEval.excluded.length,conditions:blockEval.adopted.concat(blockEval.excluded).flatMap(x=>x.evaluation.conditions||[]).concat(parentEval.conditions||[]),adopted:baseAdopted,reason:baseAdopted?'active condition block and granted parent condition adopted':(!parentEval.satisfied?parentEval.reason:(blockEval.adopted.length?'at least one condition block adopted':'no active condition block'))});
      if(baseAdopted&&name){const normalizedName=norm(name);baseGeneralSkills.add(normalizedName);if(!baseSkillMetas.has(normalizedName))baseSkillMetas.set(normalizedName,[]);baseSkillMetas.get(normalizedName).push({meta,record:rec});}
    });
  });
  itemRecords.forEach(({meta,records})=>{
    records.forEach(rec=>{
      const recParsed=formationSkillNameLevelFromSource(rec.source||'');
      const recSkillName=rec.formationSkillName||recParsed.name||getItemDisplayName(meta.item);
      const isEquipmentSkillLvBoost=meta.sourceType==='equipment'&&rec.equipmentReferenceKind==='skill-lv-boost';
      const recLv=isEquipmentSkillLvBoost
        ? (Number(rec.equipmentSkillBoost)||Number(rec.formationSavedLevel)||0)
        : ((state.viewMode==='saved'&&rec.formationSavedLevel)?rec.formationSavedLevel:recParsed.level);
      const blockEval=getActiveSkillBlocks(rec,meta,ctx,skillAggregationConditionOpts);
      const parentEval=isEquipmentSkillLvBoost?evaluateEquipmentSkillLvBoostParentCondition(rec,meta,ctx):evaluateGrantedSkillParentBlock(rec,meta,ctx,skillAggregationConditionOpts);
      let adopted=isEquipmentSkillLvBoost?parentEval.satisfied:(blockEval.adopted.length>0&&parentEval.satisfied);
      let excludeReason=!parentEval.satisfied?parentEval.reason:(adopted?(isEquipmentSkillLvBoost?'equipment skill Lv boost parent condition adopted':'at least one condition block adopted'):'no active condition block');
      let activeText=isEquipmentSkillLvBoost?rec.text:blockEval.activeText;
      if(rec.isAdvisorSkill){adopted=false;excludeReason='advisor skill excluded from formation aggregation';debugLog('formationSkill:advisor-excluded',{phase:'aggregate',holder:meta.holder,slot:meta.holderSlot,skillName:recSkillName,source:rec.source,reason:excludeReason});}if(rec.isAppointmentSkill||isAppointmentSkillText(rec.text)){adopted=false;excludeReason='appointment skill excluded from formation aggregation';debugLog('formationSkill:appointment-excluded',{phase:'aggregate',holder:meta.holder,slot:meta.holderSlot,skillName:recSkillName,source:rec.source,reason:excludeReason});}
      if(adopted&&isEquipmentSkillLvBoost){
        const baseEntries=baseSkillMetas.get(norm(recSkillName))||[];
        const exists=baseEntries.length>0;
        equipmentBoostLog.push({equipment:meta.holder,targetSkill:recSkillName,boost:rec.equipmentReferenceText||'',parentSkill:rec.parentSkillName||'',baseSkillExists:exists,baseHolders:baseEntries.map(x=>x.meta?.holder).filter(Boolean),adopted:exists,reason:exists?'base skill exists in formation':'base skill not found in formation'});
        if(!exists){adopted=false;excludeReason='base skill not found in formation';}
      }
      const allConditions=blockEval.adopted.concat(blockEval.excluded).flatMap(x=>x.evaluation.conditions||[]).concat(parentEval.conditions||[]);
      debugLog(adopted?'formationSkill:adopted':'formationSkill:excluded',{holder:meta.holder,slot:meta.holderSlot,kind:meta.kind,sourceType:meta.sourceType,skillName:recSkillName,source:rec.source,blockCount:blockEval.blocks.length,adoptedBlockCount:blockEval.adopted.length,excludedBlockCount:blockEval.excluded.length,conditions:allConditions,reason:excludeReason});
      if(!adopted){excludedLog.push({holder:meta.holder,slot:meta.holderSlot,skillName:recSkillName,source:rec.source,reason:excludeReason,conditions:allConditions,excludedBlocks:blockEval.excluded.map(x=>({condition:x.block.condition,reason:x.evaluation.reason}))});return;}
      addSkillRow(rec,meta,recSkillName,recLv);
      contributionLog.push({holder:meta.holder,slot:meta.holderSlot,skillName:recSkillName,level:recLv,source:rec.source,sourceType:rec?.inheritedSkill?'inheritedSkill':meta.sourceType,adoptedBlocks:blockEval.adopted.map(x=>x.block.condition)});
      const activeRec={...rec,text:activeText||rec.text,fullText:rec.text};
      const parsed=parseParameterEffectsFromRecord(activeRec);
      parsed.effects.forEach(e=>{
        if(!isFormationNumericParameterEffect(e)){excludedLog.push({holder:meta.holder,slot:meta.holderSlot,skillName:recSkillName,source:e.sourceLabel||rec.source,parameter:e.key||'',reason:'non-numeric parameter effect excluded from state variation rate'});return;}
        const baseEffectMeta=(isEquipmentSkillLvBoost?((baseSkillMetas.get(norm(recSkillName))||[])[0]?.meta):null)||meta;
        // FIX[HADO-2.7.3.65-FORMATION-RANGE-CONDITION-DEFERRED]:
        // 「編制時点の自部隊の射程がN以上の際」は汎用条件評価ではなく、後段の
        // applyFormationRangeConditionGateで、条件付き射程効果自身を除いた射程により判定する。
        // ここで汎用評価に掛けると未対応条件として練射Ⅱの射程+1が消える。
        const isRangeThresholdEffect=isFormationRangeThresholdEffect(e);
        const effectEval=isRangeThresholdEffect
          ? {satisfied:true,reason:'range threshold condition deferred to applyFormationRangeConditionGate',conditions:[{type:'rangeThresholdDeferred',raw:[e.condition,e.rawText].map(norm).filter(Boolean).join(' '),satisfied:true}]}
          : evaluateFormationConditionText([sanitizeFormationEffectConditionText(e.rawText),e.condition].filter(Boolean).join(' '),{...baseEffectMeta,holderName:baseEffectMeta.holder},ctx,{excludeCombat:false});
        debugLog('formationSkill:condition-evaluate',{holder:meta.holder,slot:meta.holderSlot,evaluatedHolder:baseEffectMeta.holder,evaluatedSlot:baseEffectMeta.holderSlot,skillName:recSkillName,source:e.sourceLabel||rec.source,key:e.key,adopted:effectEval.satisfied,reason:effectEval.reason,conditions:effectEval.conditions,policy:isRangeThresholdEffect?'range threshold delegated to formation range condition gate':(isEquipmentSkillLvBoost?'equipment skill Lv boost effects evaluated by base skill holder':'numeric effects are not excluded only because they are battle-triggered')});
        if(!effectEval.satisfied){excludedLog.push({holder:meta.holder,slot:meta.holderSlot,skillName:recSkillName,source:e.sourceLabel||rec.source,parameter:e.key,reason:effectEval.reason,conditions:effectEval.conditions});return;}
        const ep=formationSkillNameLevelFromSource(e.sourceLabel||rec.source||'');
        const skillName=rec.formationSkillName||ep.name||recSkillName;
        if(skillRows.has(skillName)){const row=skillRows.get(skillName);row.holders.add(meta.holder);row.sourceCategories.add(rec?.formationSourceCategory||formationSkillSourceCategory(meta));if(row.category==='skill')row.category=e.group||'skill';}
        const adjustedEffect=applyFormationPositionMultiplierToEffect(e,baseEffectMeta);
        effectsRaw.push({...adjustedEffect,sourceLabel:`${meta.holder}:${adjustedEffect.sourceLabel||rec.source}`,sourceItemCategory:meta.sourceType==='equipment'?'equipments':'',sourceItemName:meta.sourceType==='equipment'?meta.holder:'',sourceSlotKey:baseEffectMeta.holderSlot||'',sourcePosition:getFormationHolderPositionLabelFromMeta(baseEffectMeta)});
      });
      parsed.specials.forEach(sp=>{
        const specialEval=evaluateFormationConditionText([sp.rawText,sp.condition].filter(Boolean).join(' '),{...meta,holderName:meta.holder},ctx,{excludeCombat:true});
        if(specialEval.satisfied)specials.push({...sp,sourceLabel:`${meta.holder}:${sp.sourceLabel||rec.source}`});
      });
    });
  });
  const formationMasterSkillsApplied=applyFormationMasterSkillsToSummary(f,skillRows,contributionLog);
  applyFormationMasterSkillsToEffects(f,ctx,effectsRaw,specials,excludedLog);
  const ethnicResearchAdopted=applyActiveEthnicResearchSkills(f,skillRows,effectsRaw,specials,contributionLog,excludedLog);
  const advisorAdopted=applyActiveAdvisorSkills(f,ctx,skillRows,effectsRaw,specials,contributionLog,excludedLog);
  const fiveElementAdopted=applyActiveFiveElementSkills(f,ctx,skillRows,effectsRaw,specials,contributionLog,excludedLog);
  const warhorseAdopted=collectActiveWarhorseFormationEffects(f,ctx,skillRows,effectsRaw,contributionLog,excludedLog);
  const extensionSummaryEffects=collectFormationExtensionSummaryEffects(f);
  extensionSummaryEffects.forEach(e=>effectsRaw.push(e));
  const formationRangeSummary=addFormationBaseRangeEffect(f,ctx,effectsRaw);
  if(formationRangeSummary)debugLog('formation:base-range',formationRangeSummary);
  const rangeConditionGate=applyFormationRangeConditionGate(effectsRaw,excludedLog);
  if(equipmentBoostLog.length)debugLog('formationSkill:equipment-boost',equipmentBoostLog);
  const skillList=[...skillRows.values()].map(r=>{const rawTotal=r.levels.reduce((a,b)=>a+b,0);const capList=(Array.isArray(r.equipmentBoostCaps)?r.equipmentBoostCaps:[]).filter(v=>Number(v)>0);const cap=capList.length?Math.min(...capList):0;const total=cap?Math.min(rawTotal,cap):rawTotal;const rawMin=r.levels.length?Math.min(...r.levels):0,rawMax=r.levels.length?Math.max(...r.levels):0;const min=cap?Math.min(rawMin,cap):rawMin,max=cap?Math.min(rawMax,cap):rawMax;const sourceCategories=[...(r.sourceCategories||new Set(['その他']))].sort((a,b)=>FORMATION_SKILL_SOURCE_ORDER.indexOf(a)-FORMATION_SKILL_SOURCE_ORDER.indexOf(b));return {name:r.name,holders:[...r.holders],min:state.viewMode==='saved'?total:min,max:state.viewMode==='saved'?total:max,total,category:r.category,sourceCategories,equipmentBoostCap:cap||0,rawTotal};}).filter(r=>state.viewMode!=='saved'||r.total>0).sort((a,b)=>formationSkillSourceOrderValue(a.sourceCategories)-formationSkillSourceOrderValue(b.sourceCategories)||a.name.localeCompare(b.name,'ja'));
  const dd=dedupeParameterEffects(effectsRaw);const rangeEffectTrace=buildFormationRangeEffectTrace(dd.kept,rangeConditionGate);const summary=summarizeFormationEffectsBySkillLevel(dd.kept,skillList);const specialSummary=summarizeSpecials(specials);
  debugLog('formation:range-effect-trace',rangeEffectTrace);
  debugLog('formationSkill:summary',{formationId:f?.id||'',formationName:f?.name||'',troopType:ctx.troopType||'',baseGeneralSkills:[...baseGeneralSkills],baseSkillMetaCount:baseSkillMetas.size,contributionCount:contributionLog.length,excludedCount:excludedLog.length,equipmentBoostCount:equipmentBoostLog.length,formationMasterSkillCount:(typeof formationMasterSkillsApplied!=='undefined'?formationMasterSkillsApplied.length:0),ethnicResearchAdoptedCount:(typeof ethnicResearchAdopted!=='undefined'?ethnicResearchAdopted.length:0),advisorAdoptedCount:(typeof advisorAdopted!=='undefined'?advisorAdopted.length:0),rangeEffectTrace,skills:skillList.map(s=>({name:s.name,total:s.total,min:s.min,max:s.max,holders:s.holders,sourceCategories:s.sourceCategories})),excludedSamples:excludedLog.slice(0,50)});
  return {summary,specialSummary,skills:skillList,effects:dd.kept,specials,formationContext:ctx,contributions:contributionLog,excluded:excludedLog,equipmentBoostLog,extensionSummaryEffects,rangeConditionGate,rangeEffectTrace,formationMasterSkills:formationMasterSkillsApplied||[],advisorSkills:advisorAdopted||[],fiveElementSummary:fiveElementAdopted?.summary||calculateFormationFiveElementSummary(f),fiveElementSkills:fiveElementAdopted?.adopted||[],warhorseSkills:warhorseAdopted||[],formationRangeSummary:formationRangeSummary||null};
}
function renderFormationSkillSummary(data){const allSkills=(data.skills||[]);const filter=normalizeFormationSkillFilter(state.formationSkillFilter);const skills=allSkills.filter(r=>formationSkillMatchesFilter(r,filter));const rows=skills.map(r=>`<tr><td>${formationEntityLinkHtml('skills',r.name,r.name)}</td><td>${esc(r.total||r.max||'-')}</td><td>${(r.sourceCategories||['その他']).map(c=>`<span class="formation-badge">${esc(c)}</span>`).join('')}</td><td>${r.holders.map(h=>`<span class="formation-badge">${formationAutoLinkHtml(h)}</span>`).join('')}</td></tr>`).join('');const note=allSkills.length>12?`<div class="formation-note">合算技能 ${skills.length}件 / 全${allSkills.length}件を表示しています。</div>`:'';return `${note}<table class="formation-table"><thead><tr><th>技能名</th><th>合算Lv</th><th>種別</th><th>所有武将</th></tr></thead><tbody>${rows||'<tr><td colspan="4">技能効果なし</td></tr>'}</tbody></table>`;}
function formationEffectSkillLabel(label){let s=norm(label||'');if(!s)return '';if(s.includes(':'))s=s.split(':').slice(1).join(':');s=s.replace(/^技能:/,'').replace(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]$/,'');s=s.replace(/^(武器|防具|文物|侍従|主将|副将|補佐):?/,'');return norm(s)||norm(label||'');}
function formationEffectSkillLabelWithLevel(label){let s=norm(label||'');if(!s)return '';if(s.includes(':'))s=s.split(':').slice(1).join(':');s=s.replace(/^技能:/,'');s=s.replace(/^(武器|防具|文物|侍従|主将|副将|補佐):?/,'');return norm(s)||norm(label||'');}
function formationParameterSourceTags(entry){const src=(entry?.items||[]).map(e=>formationEffectSkillLabel(e.sourceLabel||'')).filter(Boolean);const uniq=[...new Set(src)].slice(0,8);return uniq.map(s=>`<span class="formation-badge">${esc(s)}</span>`).join('')||'<span class="note">-</span>';}
function formationEffectTermText(e){if(!e)return '';const unit=e.unit===undefined?'%':(e.unit||'');const val=effectSignedValue(e);const signed=`${val>=0?'+':''}${val}${unit}`;const label=formationEffectSkillLabelWithLevel(e.sourceLabel||'')||'不明';const cond=cleanConditionText(e.condition||'');return `${signed}（${label}${cond?' / '+cond:''}）`;}
function formationEffectSourceLabelHtml(e){const label=formationEffectSkillLabelWithLevel(e?.sourceLabel||'')||'不明';const itemCategory=norm(e?.sourceItemCategory||'');const itemName=norm(e?.sourceItemName||'');if(itemCategory&&itemName){const linked=formationEntityLinkHtml(itemCategory,itemName,itemName);debugLog('statusEffect:equipment-link-built',{category:itemCategory,itemName,label});return `${linked}${label?`:${esc(label)}`:''}`;}return esc(label);}
function formationEffectTermHtml(e){if(!e)return '';const unit=e.unit===undefined?'%':(e.unit||'');const val=effectSignedValue(e);const signed=`${val>=0?'+':''}${val}${unit}`;const cond=cleanConditionText(e.condition||'');return `${esc(signed)}（${formationEffectSourceLabelHtml(e)}${cond?' / '+esc(cond):''}）`;}
function formationCalcTotalText(total,unit){const u=unit===undefined?'%':(unit||'');return `${Number(total||0)>=0?'+':''}${Number(total||0)}${u}`;}
function formationFormulaLineHtml(label,items,total,unit){const terms=(items||[]).map(formationEffectTermHtml).filter(Boolean);if(!terms.length)return `<span class="formation-calc-line formation-calc-empty">${esc(label)}: -</span>`;return `<span class="formation-calc-line">${esc(label)}: ${terms.join(' + ')} = <span class="formation-calc-total">${esc(formationCalcTotalText(total,unit))}</span></span>`;}
function formationParameterFormulaHtml(entry){const unit=entry?.unit||'';const capNote=formationParameterCapNoteText(entry);return `<div class="formation-calc">${formationFormulaLineHtml('計算',entry?.maxItems||entry?.items||[],entry?.maxTotal||0,unit)}${capNote?`<span class="formation-calc-line formation-cap-note">${esc(capNote)}</span>`:''}</div>`;}
function formationFormulaLineDebug(label,items,total,unit){return {label,terms:(items||[]).map(e=>({value:formationCalcTotalText(effectSignedValue(e),e.unit||''),source:formationEffectSkillLabelWithLevel(e.sourceLabel||''),condition:cleanConditionText(e.condition||''),rawText:norm(e.rawText||'')})),total:formationCalcTotalText(total,unit||'')};}
function formatFormationParameterNumber(n){const num=Number(n);if(!Number.isFinite(num))return '';return Number.isInteger(num)?String(num):String(Math.round(num*100)/100);}
function formationParameterDisplayValue(key,entry){const k=norm(key);const v=entry||{};const unit=getParameterDefaultUnit(k,v.unit);const total=Number(v.maxTotal??v.total??0);if(k==='射程')return Number.isFinite(total)?formatFormationParameterNumber(total):'未判定';return `${total>=0?'+':''}${formatFormationParameterNumber(total)}${unit}`;}
function formationParameterKeyOrderValue(key){const nk=norm(key);const k=nk.replace(/低下$/,'');let seq=0;for(const group of PARAM_GROUPS){for(const itemKey of group.keys){if(itemKey===k||itemKey===nk)return seq;seq++;}}return 9999;}
function formationOrderedParameterKeys(entries){return Object.keys(entries||{}).sort((a,b)=>formationParameterKeyOrderValue(a)-formationParameterKeyOrderValue(b)||a.localeCompare(b,'ja'));}
function buildFormationParameterCalculationDebug(data,f){const rows=[];const order=['tactic','deploy','normal','defense'];order.forEach(t=>{const groups=data.summary?.[t]||{};PARAM_DISPLAY_GROUP_ORDER.forEach(g=>{formationOrderedParameterKeys(groups[g]||{}).forEach(k=>{const v=groups[g][k];const unit=getParameterDefaultUnit(k,v.unit);rows.push({timing:t,timingLabel:timingLabel(t),group:g,parameterKey:k,parameterName:parameterDisplayName(k),displayValue:formationParameterDisplayValue(k,v),capApplied:!!v.capApplied,capNote:formationParameterCapNoteText(v),uncappedMaxTotal:v.uncappedMaxTotal,relatedSkills:[...new Set((v.maxItems||v.items||[]).map(e=>formationEffectSkillLabel(e.sourceLabel||'')).filter(Boolean))],formula:[formationFormulaLineDebug('計算',v.maxItems||v.items||[],v.maxTotal,unit)]});});});});return {formationId:f?.id||'',formationName:f?.name||'',viewMode:state.viewMode,mode:'fixed-by-general-stage',rowCount:rows.length,rows};}
function renderFormationParameterTimingTable(timing,groups){
  const rows=[];
  PARAM_DISPLAY_GROUP_ORDER.forEach(g=>{formationOrderedParameterKeys(groups?.[g]||{}).forEach(k=>{const v=groups[g][k];const val=formationParameterDisplayValue(k,v);rows.push(`<tr><td>${esc(parameterDisplayName(k))}</td><td>${esc(val)}</td><td class="formation-calc-cell">${formationParameterFormulaHtml(v)}</td></tr>`);});});
  const body=rows.join('')||'<tr><td colspan="3">状態変化率なし</td></tr>';
  return `<table class="formation-table formation-param-table ${state.formationCalcVisibleMobile?'is-calc-visible':'is-calc-collapsed'}"><thead><tr><th>項目</th><th>変化値</th><th class="formation-calc-header"><button type="button" class="formation-calc-toggle" title="スマホ表示時のみ計算式列を表示・非表示">計算式 ${state.formationCalcVisibleMobile?'▲':'▼'}</button></th></tr></thead><tbody>${body}</tbody></table>`;
}
function renderFormationParameterSummary(data){
  const order=['tactic','deploy','normal','defense'];
  let totalRows=0;
  const mobile=isResponsiveMobileMode();
  const store=state.formationDetailsOpen||{};
  const blocks=order.map(t=>{
    const groups=data.summary?.[t]||{};
    let timingRows=0;
    PARAM_DISPLAY_GROUP_ORDER.forEach(g=>{timingRows+=Object.keys(groups[g]||{}).length;});
    totalRows+=timingRows;
    const key='timing:'+t;
    const defaultOpen=mobile?(t==='deploy'||t==='normal'):true;
    const open=Object.prototype.hasOwnProperty.call(store,key)?!!store[key]:defaultOpen;
    const openAttr=open?' open':'';
    const label=timingLabel(t);
    debugLog('formation:status-detail-open-state',{key,label,open,source:Object.prototype.hasOwnProperty.call(store,key)?'state':'default',mobile});
    return `<details class="formation-timing-details" data-formation-timing="${esc(t)}"${openAttr}><summary><span>${esc(label)}</span><span class="note">${timingRows}件</span></summary><div class="formation-timing-body">${renderFormationParameterTimingTable(t,groups)}</div></details>`;
  }).join('');
  debugLog('formationSkill:fixed-value-summary',{rowCount:totalRows,reason:'general skill levels are fixed by general stage/star settings',layout:'timing-details'});
  return `<div class="formation-param-timing-stack">${blocks}</div>`;
}

function formationDetailOpenStateKey(details){
  if(!details)return '';
  if(details.classList.contains('formation-param-section'))return 'summary:param';
  if(details.classList.contains('formation-skill-section'))return 'summary:skill';
  if(details.classList.contains('formation-slots-details'))return 'summary:slots';
  if(details.classList.contains('formation-extension-details'))return 'summary:extension';
  if(details.classList.contains('formation-extension-parameter-section'))return 'summary:extension-parameters';
  if(details.classList.contains('formation-tactic-total-section'))return 'summary:tactic:total';
  if(details.classList.contains('formation-tactic-chain-section'))return 'summary:tactic:chain';
  if(details.classList.contains('formation-tactic-expected-section'))return 'summary:tactic:expected';
  if(details.classList.contains('formation-tactic-detail-section'))return 'summary:tactic:detail';
  if(details.classList.contains('formation-timing-details'))return 'timing:'+(details.dataset.formationTiming||norm(details.querySelector('summary')?.textContent||''));
  if(details.classList.contains('formation-extension-param-details'))return 'extension-param:'+norm(details.querySelector('summary')?.textContent||'');
  return '';
}
function rememberFormationDetailsOpenState(root=els.formationRoot){
  if(!root)return;
  const store=state.formationDetailsOpen||(state.formationDetailsOpen={});
  root.querySelectorAll('details.formation-mobile-summary-section,details.formation-timing-details,details.formation-extension-param-details').forEach(d=>{
    const key=formationDetailOpenStateKey(d);
    if(key)store[key]=!!d.open;
  });
}
function restoreFormationDetailsOpenState(root=els.formationRoot){
  if(!root)return;
  const store=state.formationDetailsOpen||{};
  root.querySelectorAll('details.formation-mobile-summary-section,details.formation-timing-details,details.formation-extension-param-details').forEach(d=>{
    const key=formationDetailOpenStateKey(d);
    const resultKeys=new Set(['summary:param','summary:tacticAttack','summary:requiredResult','summary:tactic:total','summary:tactic:chain','summary:tactic:expected','summary:tactic:detail']);
    if(key==='summary:param'&&normalizeFormationInnerTab(state.formationInnerTab)==='result'&&!isResponsiveMobileMode()){d.open=true;return;}
    if(isResponsiveMobileMode()&&normalizeFormationInnerTab(state.formationInnerTab)==='result'&&resultKeys.has(key)&&!isRecentFormationSummaryUserAction(key)){d.open=false;return;}
    if(key&&Object.prototype.hasOwnProperty.call(store,key))d.open=!!store[key];
  });
}

function markFormationSummaryUserAction(key){
  if(!key)return;
  state.formationLastSummaryUserAction={key,time:Date.now()};
}
function isRecentFormationSummaryUserAction(key,windowMs=900){
  const a=state.formationLastSummaryUserAction;
  return !!(a&&a.key===key&&(Date.now()-a.time)<=windowMs);
}
function restorePinnedFormationSummaryState(root=els.formationRoot,reason=''){
  if(!root||!isResponsiveMobileMode())return;
  const store=state.formationDetailsOpen||{};
  const skill=root.querySelector('details.formation-skill-section');
  const param=root.querySelector('details.formation-param-section');
  if(store['summary:skill']===true&&skill&&!skill.open){
    skill.open=true;
    debugLog('formation:summary-reopen',{key:'summary:skill',reason});
  }
  if(store['summary:skill']===true&&param&&param.open){
    param.open=false;
    store['summary:param']=false;
    debugLog('formation:accordion-enforced',{reason:reason||'skill-open-keeps-param-closed'});
  }
  root.querySelectorAll('details.formation-timing-details').forEach(d=>{
    const key=formationDetailOpenStateKey(d);
    if(key&&store[key]===true&&!d.open){
      d.open=true;
      debugLog('formation:status-detail-open-restored',{key,label:timingLabel(d.dataset.formationTiming||''),reason});
    }
  });
}
function ensureFormationScrollOpenGuard(){
  if(state._formationScrollOpenGuardInstalled)return;
  state._formationScrollOpenGuardInstalled=true;
  let raf=0;
  const guard=reason=>{
    if(state.mainTab!=='formation')return;
    if(!isResponsiveMobileMode())return;
    if(raf)cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{raf=0;restorePinnedFormationSummaryState(els.formationRoot,reason);});
  };
  window.addEventListener('scroll',()=>guard('window-scroll'),{passive:true});
  window.addEventListener('resize',()=>guard('window-resize'),{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('scroll',()=>guard('visualViewport-scroll'),{passive:true});
    window.visualViewport.addEventListener('resize',()=>guard('visualViewport-resize'),{passive:true});
  }
  document.addEventListener('visibilitychange',()=>guard('visibilitychange'),{passive:true});
}
function setupFormationDetailsOpenStateEvents(root=els.formationRoot){
  if(!root)return;
  ensureFormationScrollOpenGuard();
  root.querySelectorAll('details.formation-mobile-summary-section,details.formation-timing-details,details.formation-extension-param-details').forEach(d=>{
    const key=formationDetailOpenStateKey(d);
    const summary=d.querySelector('summary');
    if(summary&&key){
      ['pointerdown','keydown','click'].forEach(evt=>{
        summary.addEventListener(evt,e=>{
          if(evt==='keydown'&&!['Enter',' '].includes(e.key))return;
          markFormationSummaryUserAction(key);
        });
      });
    }
    d.addEventListener('toggle',()=>{
      const key=formationDetailOpenStateKey(d);
      if(!key)return;
      const store=state.formationDetailsOpen||(state.formationDetailsOpen={});
      const isTopSummary=d.classList.contains('formation-skill-section')||d.classList.contains('formation-param-section');
      const isStatusTiming=d.classList.contains('formation-timing-details');
      const userAction=isRecentFormationSummaryUserAction(key);
      if(isResponsiveMobileMode()&&(isTopSummary||isStatusTiming)&&!d.open&&!userAction&&store[key]===true){
        debugLog(isStatusTiming?'formation:status-detail-close-ignored':'formation:details-close-ignored',{key,reason:'not a recent user summary action; likely scroll/resize/layout'});
        requestAnimationFrame(()=>restorePinnedFormationSummaryState(root,'ignored-non-user-close'));
        return;
      }
      if(isResponsiveMobileMode()&&d.open&&isTopSummary){
        root.querySelectorAll('details.formation-param-section,details.formation-skill-section').forEach(other=>{
          if(other!==d&&other.open){
            other.open=false;
            const otherKey=formationDetailOpenStateKey(other);
            if(otherKey)store[otherKey]=false;
          }
        });
      }
      store[key]=!!d.open;
      if(isResponsiveMobileMode()&&key==='summary:skill'&&d.open)store['summary:param']=false;
      debugLog(isStatusTiming?'formation:status-detail-toggle':'formation:details-open-state',{key,open:!!d.open,mobile:isResponsiveMobileMode(),userAction});
      requestAnimationFrame(()=>restorePinnedFormationSummaryState(root,'after-toggle'));
    });
  });
}
function formationSummaryOpenAttr(key,defaultOpen=false){
  const store=state.formationDetailsOpen||{};
  const mobile=isResponsiveMobileMode();
  const inner=normalizeFormationInnerTab(state.formationInnerTab);
  const resultKeys=new Set(['summary:param','summary:tacticAttack','summary:requiredResult','summary:tactic:total','summary:tactic:chain','summary:tactic:expected','summary:tactic:detail']);
  if(mobile&&inner==='result'&&resultKeys.has(key)&&!isRecentFormationSummaryUserAction(key))return '';
  if(mobile&&key==='summary:param'&&store['summary:skill']===true)return '';
  if(Object.prototype.hasOwnProperty.call(store,key))return store[key]?' open':'';
  return defaultOpen?' open':'';
}
function enforceFormationSummaryAccordion(root=els.formationRoot){
  if(!root||!isResponsiveMobileMode())return;
  const skill=root.querySelector('details.formation-skill-section');
  const param=root.querySelector('details.formation-param-section');
  const store=state.formationDetailsOpen||(state.formationDetailsOpen={});
  if(store['summary:skill']===true&&skill&&!skill.open){
    skill.open=true;
    debugLog('formation:summary-reopen',{key:'summary:skill',reason:'enforce'});
  }
  if(skill&&skill.open&&param&&param.open){
    param.open=false;
    store['summary:param']=false;
    store['summary:skill']=true;
    debugLog('formation:accordion-enforced',{reason:'skill-open-keeps-param-closed'});
  }
}

function normalizeFormationInnerTab(tab){const k=norm(tab||'');if(k==='result')return 'tactic';return ['edit','tactic','parameter','detail'].includes(k)?k:'edit';}
function normalizeFormationResultTab(tab){return ['tactic','parameter'].includes(tab)?tab:'tactic';}
function setFormationResultTab(tab){state.formationResultTab=normalizeFormationResultTab(tab);debugLog('formationResultTab:set',{tab:state.formationResultTab});renderFormationScreen();}
function renderFormationResultTabsHtml(active){const current=normalizeFormationResultTab(active);const specs=[['tactic','戦法'],['parameter','変化率']];return `<div class="formation-work-tabs formation-result-tabs" role="tablist" aria-label="部隊編成結果表示切替">${specs.map(([key,label])=>`<button type="button" class="formation-work-tab-btn ${current===key?'is-active':''}" data-formation-result-tab="${esc(key)}" role="tab" aria-selected="${current===key?'true':'false'}">${esc(label)}</button>`).join('')}</div>`;}

function normalizeFormationSelectedSlotKey(key){const k=norm(key||'');return FORMATION_SLOT_SPECS.some(s=>s.key===k)?k:'main';}
function formationGeneralNameNoReading(name){return norm(name||'').replace(/（[^）]*）/g,'').trim();}
function formationDisplayNameNoReading(category,name){const display=formationDisplayName(category,name);return category==='generals'?formationGeneralNameNoReading(display):display;}
function getFormationSelectedSlotSpec(){const key=normalizeFormationSelectedSlotKey(state.formationSelectedSlot);return FORMATION_SLOT_SPECS.find(s=>s.key===key)||FORMATION_SLOT_SPECS[0];}
function setFormationSelectedSlot(key){state.formationSelectedSlot=normalizeFormationSelectedSlotKey(key);if(isResponsiveMobileMode())state.formationSlotDialogOpen=true;debugLog('formation:selected-slot',{slotKey:state.formationSelectedSlot,mobile:isResponsiveMobileMode(),dialogOpen:!!state.formationSlotDialogOpen});renderFormationScreen();}
function renderFormationComposeBarHtml(f,data){const siege=f?.siegeWeapon||createFormationSiegeWeaponSelection();const arm=f?.ethnicArmament||createFormationEthnicArmamentSelection();const siegeDisabled=normalizeSaveItemName(siege.name)?'':' disabled';const armDisabled=normalizeSaveItemName(arm.name)?'':' disabled';const ethnicGeneralDisabled=normalizeSaveItemName(arm.name)?'':' disabled';const history=(f.history||[]).slice(0,FORMATION_HISTORY_LIMIT);return `<div class="formation-compose-toolbar"><div class="formation-compose-toolbar-head"><div class="formation-compose-title">編成バー</div><div class="formation-compose-meta"><span class="formation-badge">部隊兵科：${esc(data.formationContext?.troopType||'未設定')}</span><span class="formation-badge">型：${esc(f.evaluationTypeName||f.evaluationTypeId||'未指定')}</span><span class="formation-save-dirty">${state.formationDirty?'未保存':''}</span></div></div><div class="formation-compose-bar-grid"><label><span class="note">部隊名</span><input id="formationNameInput" type="text" value="${esc(f.name)}"></label><label><span class="note">評価型ID</span><input id="formationEvaluationTypeInput" type="text" value="${esc(f.evaluationTypeId||'')}" readonly></label><label><span class="note">トータルスコア(0-10)</span><input id="formationTotalScoreInput" type="number" min="0" max="10" step="1" value="${esc(f.totalScore||0)}"></label><label><span class="note">評価スコア(0-10)</span><input id="formationEvaluationScoreInput" type="number" min="0" max="10" step="1" value="${esc(f.evaluationScore||0)}"></label><label><span class="note">マイメモ</span><input id="formationMemoInput" type="text" value="${esc(f.memo||'')}"></label><label><span class="note">評価保存</span><button type="button" id="formationEvaluationSaveBtn" class="btn-select-all">履歴へ保存</button></label><label><span class="note">陣形</span><select id="formationMasterSelect" class="formation-select">${buildFormationMasterSelectOptions(f?.formationName)}</select></label><label><span class="note">編制種類</span><select id="formationDeploymentTypeSelect" class="formation-select">${buildFormationDeploymentTypeOptions(f?.deploymentType)}</select></label><label><span class="note">武装</span><select id="formationEthnicArmamentSelect" class="formation-select">${buildFormationExtensionSelectOptions('ethnicArmament',arm.name)}</select></label><label><span class="note">武装Lv</span><select id="formationEthnicArmamentLevelSelect" class="formation-select"${armDisabled}>${buildFormationExtensionLevelOptions('ethnicArmament',arm)}</select></label><label><span class="note">異民族武将</span><select id="formationEthnicGeneralSelect" class="formation-select"${ethnicGeneralDisabled}>${buildFormationEthnicGeneralSelectOptions(arm)}</select></label><label><span class="note">兵器</span><select id="formationSiegeWeaponSelect" class="formation-select">${buildFormationExtensionSelectOptions('siegeWeapon',siege.name)}</select></label><label><span class="note">兵器Lv</span><select id="formationSiegeWeaponLevelSelect" class="formation-select"${siegeDisabled}>${buildFormationExtensionLevelOptions('siegeWeapon',siege)}</select></label></div><div class="formation-history-list note">履歴 ${history.length}/${FORMATION_HISTORY_LIMIT}: ${history.map(h=>`${esc(formatFormationDate(h.savedAt))} ${esc(h.evaluationScore)}/10 ${esc(h.memo||'')}`).join(' / ')||'なし'}</div></div>`;}

function getOwnedWarhorseDisplayLabel(id){
  const key=norm(id||'');
  const owned=(getCurrentWarhorseData()?.owned)||{};
  const wh=owned[key];
  if(!wh)return '';
  const master=getWarhorseMasterById(wh.horseMasterId);
  const kind=getWarhorseMasterKind(master)==='famous'?'名馬':'通常馬';
  const name=norm(wh.name||wh.customName||master?.name||key);
  if(kind==='famous')return `${name} / 名馬${master?.name?`:${master.name}`:''}`;
  return `${name} / 通常馬`;
}
function getWarhorseAssignmentOptionLabel(wh){
  if(!wh)return '';
  const id=norm(wh.id||'');
  const master=getWarhorseMasterById(wh.horseMasterId);
  const kind=getWarhorseMasterKind(master)==='famous'?'名馬':'通常馬';
  const name=norm(wh.name||wh.customName||master?.name||id);
  return kind==='famous'?`${name} / 名馬${master?.name?`:${master.name}`:''}`:`${name} / 通常馬`;
}
function renderFormationWarhorseSlotOptions(selectedId='',slotIndex=0){const selected=norm(selectedId||'');const data=getCurrentWarhorseData();const owned=Object.values(data.owned||{}).sort((a,b)=>norm(a.name).localeCompare(norm(b.name),'ja'));const assigned=new Set((data.activeSlots||[]).map((id,idx)=>idx===slotIndex?'':norm(id)).filter(Boolean));const rows=['<option value="">未設定</option>'];owned.forEach(wh=>{const id=norm(wh.id||'');if(!id)return;if(id!==selected&&assigned.has(id))return;const label=getWarhorseAssignmentOptionLabel(wh)||id;rows.push(`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(label)}</option>`);});return rows.join('');}
function renderFormationWarhorseSlotsHtml(){const current=getCurrentSave();const data=getCurrentWarhorseData();const active=Array.isArray(data.activeSlots)?data.activeSlots:[null,null,null];while(active.length<3)active.push(null);const ownedCount=Object.keys(data.owned||{}).length;const cells=[0,1,2].map(i=>{const id=norm(active[i]||'');const label=id?getOwnedWarhorseDisplayLabel(id):'';return `<div class="formation-warhorse-cell ${id?'has-warhorse':''}"><div class="formation-warhorse-label">軍馬${i+1}</div><select class="formation-warhorse-select" data-formation-warhorse-slot="${i}" ${current&&ownedCount?'':'disabled'}>${renderFormationWarhorseSlotOptions(id,i)}</select><div class="formation-warhorse-note">${esc(label|| (ownedCount?'未設定':'軍馬編成で作成してください'))}</div>${id?`<div class="formation-warhorse-actions"><button type="button" class="formation-warhorse-edit" data-formation-warhorse-edit="${esc(id)}">編集</button><button type="button" class="formation-warhorse-remove" data-formation-warhorse-remove="${i}">解除</button></div>`:''}</div>`;}).join('');return `<div class="formation-warhorse-row no-detail-linkify">${cells}</div>`;}

function renderWarhorseAssignmentPanelHtml(warhorseData){
  const current=getCurrentSave();
  const data=warhorseData||getCurrentWarhorseData();
  const active=Array.isArray(data.activeSlots)?data.activeSlots.slice(0,3):[null,null,null];
  while(active.length<3)active.push(null);
  const ownedCount=Object.keys(data.owned||{}).length;
  const cells=[0,1,2].map(i=>{
    const id=norm(active[i]||'');
    const label=id?getOwnedWarhorseDisplayLabel(id):'';
    return `<div class="warhorse-assignment-cell ${id?'has-warhorse':''}"><div class="warhorse-assignment-label">軍馬${i+1}</div><select class="warhorse-assignment-select" data-warhorse-assignment-slot="${i}" ${current&&ownedCount?'':'disabled'}>${renderFormationWarhorseSlotOptions(id,i)}</select><div class="warhorse-assignment-note">${esc(label||(ownedCount?'未設定':'軍馬を登録してください'))}</div>${id?`<div class="warhorse-assignment-actions"><button type="button" class="warhorse-assignment-edit" data-warhorse-assignment-edit="${esc(id)}">編集</button><button type="button" class="warhorse-assignment-remove" data-warhorse-assignment-remove="${i}">解除</button></div>`:''}</div>`;
  }).join('');
  return `<section class="warhorse-card warhorse-assignment-panel"><div class="warhorse-card-header"><div class="warhorse-card-title"><h3>部隊割当</h3><div class="note">部隊編成に反映する軍馬3枠を選択します。ここでの設定は部隊編成画面の軍馬枠と同じ保存データへ反映されます。</div></div></div><div class="warhorse-card-body"><div class="warhorse-assignment-grid">${cells}</div></div></section>`;
}
function setFormationWarhorseSlot(index,value){const data=getCurrentWarhorseData();const idx=Math.max(0,Math.min(2,Number(index)||0));const id=norm(value||'');if(id&&!(data.owned||{})[id])return;const active=Array.isArray(data.activeSlots)?data.activeSlots.slice(0,3):[null,null,null];while(active.length<3)active.push(null);if(id&&active.some((v,i)=>i!==idx&&norm(v)===id)){try{window.alert('同じ軍馬は複数枠に割り当てできません。');}catch{}renderFormationScreen();return;}active[idx]=id||null;data.activeSlots=active;persistSaveData();renderFormationScreen();updateUxHomePanel('formation-warhorse-slot');debugLog('formation:warhorse-slot-set',{slot:idx+1,id,activeSlots:data.activeSlots});}
function openFormationWarhorseEditFromSlot(id){const key=norm(id||'');if(!key)return;if(typeof setMainTab==='function')setMainTab('warhorse');openWarhorseEditDialog(key);debugLog('formation:warhorse-open-edit',{id:key,source:'formation-warhorse-slot'});}
function renderFormationTeamBoardSelectableHtml(f){
  const master=getSelectedFormationMaster(f);const matrix=getFormationMasterLayoutMatrix(master);const availability=computeFormationJijuAvailability(f);const attendantCells=new Map();const openJijuCells=new Map();
  Object.values(availability.bySlot||{}).forEach(info=>{
    if(info.attendant&&info.selected)attendantCells.set(info.selected.key,{slotKey:info.slotKey,position:info.selected.position,attendant:info.attendant,owner:info.owner,ownerLabel:formationSlotLabel(info.slotKey)});
  });
  Object.values(availability.bySlot||{}).forEach(info=>{
    if(!info.owner||!info.hasAvailable||info.attendant)return;
    (info.available||[]).forEach(c=>{
      if(!c?.key||attendantCells.has(c.key)||openJijuCells.has(c.key))return;
      openJijuCells.set(c.key,{slotKey:info.slotKey,position:c.position,row:c.row,col:c.col,owner:info.owner,ownerLabel:formationSlotLabel(info.slotKey)});
    });
  });
  const selected=normalizeFormationSelectedSlotKey(state.formationSelectedSlot);const cells=[];
  for(let r=0;r<3;r++)for(let c=0;c<3;c++){
    const key=coordKey(r,c);const baseRaw=matrix?.[r]?.[c]||'';const appSlot=FORMATION_MASTER_SLOT_MAP[baseRaw]||'';const att=attendantCells.get(key);const jiju=openJijuCells.get(key);
    if(appSlot){const slot=f?.slots?.[appSlot]||{};const name=slot.general?formationDisplayNameNoReading('generals',slot.general):'未設定';const role=formationSlotLabel(appSlot);cells.push(`<button type="button" class="formation-team-cell-btn ${formationMasterCellClass(baseRaw)} ${selected===appSlot?'is-selected':''}" data-formation-slot-select="${esc(appSlot)}" title="${esc(role)}"><span class="formation-team-role">${esc(role)}</span><span class="formation-team-name">${esc(name)}</span><span class="formation-team-sub">${slot.attendant?`侍従:${esc(formationDisplayNameNoReading('generals',slot.attendant))}`:'武将を編集'}</span></button>`);}
    else if(att){cells.push(`<button type="button" class="formation-team-cell-btn is-attendant" data-formation-selector-open="attendant" data-slot-key="${esc(att.slotKey)}" data-jiju-position="${esc(att.position)}" title="${esc(att.ownerLabel+'の侍従 '+att.position)}"><span class="formation-team-role">${esc(att.ownerLabel)}の侍従</span><span class="formation-team-name">${esc(formationDisplayNameNoReading('generals',att.attendant))}</span><span class="formation-team-sub">${esc(att.position)} / タップで変更</span></button>`);}
    else if(jiju){cells.push(`<button type="button" class="formation-team-cell-btn is-jiju-slot" data-formation-selector-open="attendant" data-slot-key="${esc(jiju.slotKey)}" data-jiju-position="${esc(jiju.position)}" title="${esc(jiju.ownerLabel+'の侍従枠 '+jiju.position)}"><span class="formation-team-role">${esc(jiju.ownerLabel)}の侍従枠</span><span class="formation-team-name">未設定</span><span class="formation-team-sub">${esc(jiju.position)} / タップで登録</span></button>`);}
    else{cells.push('<div class="formation-team-cell-btn is-empty"><span class="formation-team-role">空き</span></div>');}
  }
  const usable=Object.values(availability.bySlot||{}).filter(x=>x.hasAvailable).length;
  return `<section class="formation-board-card formation-team-board-no-link no-detail-linkify"><div class="formation-team-grid-selectable">${cells.join('')}</div>${renderFormationAdvisorSlotsHtml(f)}<div class="formation-warhorse-mobile-placement">${renderFormationWarhorseSlotsHtml()}</div></section>`;
}

function openFormationSelectorDialog(type,slotKey,equipKey='',jijuPosition=''){
  const t=['general','attendant','equipment','advisor'].includes(type)?type:'general';
  state.formationSelectorDialog={type:t,slotKey:normalizeFormationSelectedSlotKey(slotKey),equipKey:norm(equipKey||''),advisorKey:t==='advisor'?norm(equipKey||''):'',jijuPosition:t==='attendant'?normalizeJijuPositionValue(jijuPosition||''):'',keyword:'',advisorSkill:'',statusGroup:'',statusEffect:'',troop:'',rarity:'',equipmentType:''};
  if(isResponsiveMobileMode())state.formationSlotDialogOpen=t==='advisor'?false:true;
  debugLog('formationSelector:open',state.formationSelectorDialog);
  renderFormationScreen();
}
function closeFormationSelectorDialog(){const ctx=getFormationSelectorContext();state.formationSelectorDialog=null;if(ctx.type==='advisor')state.formationSlotDialogOpen=false;renderFormationScreen();}
function getFormationSelectorContext(){
  const dlg=state.formationSelectorDialog||{};
  const type=['general','attendant','equipment','advisor'].includes(dlg.type)?dlg.type:'general';
  const slotKey=normalizeFormationSelectedSlotKey(dlg.slotKey||state.formationSelectedSlot);
  const equipKey=norm(dlg.equipKey||'');
  const spec=FORMATION_SLOT_SPECS.find(s=>s.key===slotKey)||FORMATION_SLOT_SPECS[0];
  const equipSpec=EQUIP_SLOT_SPECS.find(e=>e.key===equipKey)||null;
  const advisorKey=type==='advisor'?norm(dlg.advisorKey||dlg.equipKey||''):'';
  const advisorSpec=advisorSlotSpecByKey(advisorKey);
  return {type,slotKey,equipKey,advisorKey,advisorSpec,spec,equipSpec,jijuPosition:normalizeJijuPositionValue(dlg.jijuPosition||''),keyword:norm(dlg.keyword||''),advisorSkill:norm(dlg.advisorSkill||''),statusGroup:normalizeFormationSelectorStatusGroup(dlg.statusGroup||''),statusEffect:norm(dlg.statusEffect||''),troop:norm(dlg.troop||''),rarity:norm(dlg.rarity||''),equipmentType:norm(dlg.equipmentType||'')};
}

function normalizeFormationSelectorStatusGroup(value){const key=norm(value||'');return STATUS_EFFECT_RELATION_GROUP_LABELS[key]?key:'';}
function getFormationSelectorStatusEffectsForGroup(groupKey){
  const group=normalizeFormationSelectorStatusGroup(groupKey);
  const cacheKey=group||'__all__';
  const cache=state._formationSelectorStatusEffectEntriesCache||{};
  const sig=[state.statusEffects?.length||0,cacheKey].join(':');
  if(cache[cacheKey]&&cache[cacheKey].sig===sig)return cache[cacheKey].rows;
  let rows=[];
  if(typeof buildQuickStatusEffectEntries==='function'){
    // 検索ダイアログと同じ候補・同じ優先順を利用する。groupFirst=falseで「よく使う順」を維持する。
    rows=buildQuickStatusEffectEntries({groupFirst:false}).filter(entry=>!group||entry.group===group);
  }else{
    const seen=new Set();
    rows=(state.statusEffects||[]).map(item=>{
      const profile=getStatusEffectProfile(item);
      const display=norm(item?.statusDisplayName||profile?.displayName||item?.name||item?.title||'');
      const original=norm(profile?.originalName||item?.name||item?.title||display);
      const g=getStatusEffectRelationGroupKey(item);
      return {item,display,original,groupKey:g,group:g,label:display||original,key:display||original,statusName:display||original};
    }).filter(row=>row.label&&(!group||row.groupKey===group||row.group===group)).filter(row=>{
      const key=normalizeSaveItemName(row.label);
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    }).sort((a,b)=>a.label.localeCompare(b.label,'ja'));
  }
  state._formationSelectorStatusEffectEntriesCache={...cache,[cacheKey]:{sig,rows}};
  return rows;
}
function getFormationSelectorStatusNamesCached(){
  const sig=(state.statusEffects?.length||0)+'|'+(state.statusEffects?.[0]?.name||state.statusEffects?.[0]?.title||'');
  const cache=state._formationSelectorStatusNamesCache;
  if(cache&&cache.sig===sig&&Array.isArray(cache.names))return cache.names;
  const names=getAllStatusEffectNamesForRelatedLinks();
  state._formationSelectorStatusNamesCache={sig,names};
  return names;
}
function getFormationSelectorEffectEntryCached(effectKey){
  const key=norm(effectKey||'');
  if(!key)return null;
  const cache=state._formationSelectorEffectEntryCache||{};
  const sig=[state.statusEffects?.length||0,key].join(':');
  if(cache[key]&&cache[key].sig===sig)return cache[key].entry;
  const entry=typeof getQuickStatusEffectEntryByKey==='function'?getQuickStatusEffectEntryByKey(key):null;
  state._formationSelectorEffectEntryCache={...cache,[key]:{sig,entry}};
  return entry;
}
function buildFormationSelectorStatusGroupOptions(ctx){
  const current=normalizeFormationSelectorStatusGroup(ctx?.statusGroup||'');
  const rows=(typeof SEARCH_UX_PRESET_GROUPS!=='undefined'?SEARCH_UX_PRESET_GROUPS:[]).filter(g=>g.key&&g.key!=='all');
  const fallback=Object.entries(STATUS_EFFECT_RELATION_GROUP_LABELS||{}).map(([key,label])=>({key,label}));
  const source=rows.length?rows:fallback;
  return `<option value="">状態変化分類すべて</option>${source.map(row=>`<option value="${esc(row.key)}" ${current===row.key?'selected':''}>${esc(row.label)}</option>`).join('')}`;
}
function buildFormationSelectorStatusEffectOptions(ctx){
  const current=norm(ctx?.statusEffect||'');
  const rows=getFormationSelectorStatusEffectsForGroup(ctx?.statusGroup||'');
  const placeholder=ctx?.statusGroup?`${STATUS_EFFECT_RELATION_GROUP_LABELS[ctx.statusGroup]||'状態変化'}すべて`:'状態変化すべて';
  return `<option value="">${esc(placeholder)}</option>${rows.map((row,idx)=>{const value=row.key||row.label;return `<option value="${esc(value)}" ${current===value||current===row.label?'selected':''}>${idx+1}. ${esc(row.label)}</option>`;}).join('')}`;
}
function normalizeFormationSelectorStatusNameValue(name){return normalizeSaveItemName(norm(name||''));}
function getFormationSelectorQuickFilterFromContext(ctx){
  const effectKey=norm(ctx?.statusEffect||'');
  const groupKey=normalizeFormationSelectorStatusGroup(ctx?.statusGroup||'');
  if(!effectKey){
    return groupKey?buildQuickStatusEffectGroupOwnerFilter(groupKey):null;
  }
  let entry=typeof getQuickStatusEffectEntryByKey==='function'?getQuickStatusEffectEntryByKey(effectKey):null;
  if(entry)return {...entry,group:norm(entry.group||ctx?.statusGroup||'')};
  const rows=getFormationSelectorStatusEffectsForGroup(ctx?.statusGroup||'');
  const row=rows.find(r=>norm(r.key||r.label)===effectKey||norm(r.label)===effectKey||norm(r.statusName)===effectKey)||null;
  if(row){
    return {key:row.key||effectKey,group:norm(row.group||row.groupKey||ctx?.statusGroup||''),label:row.label||row.statusName||effectKey,statusName:row.statusName||row.label||effectKey,relationType:row.relationType||'',kind:row.kind||'status'};
  }
  return {key:effectKey,group:normalizeFormationSelectorStatusGroup(ctx?.statusGroup||''),label:effectKey,statusName:effectKey,relationType:'',kind:'status'};
}
function getFormationSelectorQuickHitCacheKey(item,category,filter){
  const name=normalizeSaveItemName(getItemDisplayName(item)||item?.name||item?.title||'');
  const stageKey=category==='equipments'?getEffectiveEquipmentStageForItem(item):'';
  return [category,name,filter?.kind||'',filter?.key||'',filter?.group||'',filter?.label||'',filter?.statusName||'',filter?.relationType||'',state.viewMode||'',state.equipmentStage||'',stageKey,state.savedSearchCacheSeq||0,'quick-owner-v3-search-row-set'].map(norm).join('@@');
}
function getFormationSelectorQuickOwnerNameSet(category,filter){
  const cat=category==='equipments'?'equipments':'generals';
  const cacheKey=[cat,filter?.kind||'',filter?.key||'',filter?.group||'',filter?.label||'',filter?.statusName||'',filter?.relationType||'',state.viewMode||'',state.equipmentStage||'',state.savedSearchCacheSeq||0,'search-buildQuickOwnerRows-v1'].map(norm).join('@@');
  const cache=state._formationSelectorQuickOwnerNameSetCache||{};
  if(cache[cacheKey])return cache[cacheKey].set;
  const set=new Set();
  if(typeof buildQuickOwnerRows==='function'){
    const before={...(state.activeCategories||{})};
    try{
      Object.keys(state.activeCategories||{}).forEach(k=>{state.activeCategories[k]=false;});
      state.activeCategories[cat]=true;
      const result=buildQuickOwnerRows(filter);
      (result?.rows||[]).forEach(row=>{
        if(row?.key!==cat)return;
        const name=normalizeSaveItemName(getItemDisplayName(row.item)||row.item?.name||row.item?.title||'');
        if(name)set.add(name);
      });
      debugLog('formationSelector:quick-owner-name-set',{category:cat,filter:{key:filter?.key||'',group:filter?.group||'',label:filter?.label||'',statusName:filter?.statusName||'',relationType:filter?.relationType||''},count:set.size,source:'buildQuickOwnerRows',policy:'2.5.7.11: 検索画面のクイック所有者検索結果と同じ結果名Setで照合'});
    }catch(err){
      debugLog('formationSelector:quick-owner-name-set-error',{category:cat,message:String(err?.message||err)});
    }finally{
      Object.keys(before).forEach(k=>{state.activeCategories[k]=before[k];});
    }
  }
  state._formationSelectorQuickOwnerNameSetCache={...cache,[cacheKey]:{set}};
  return set;
}
function formationSelectorCandidateMatchesQuickStatusFilters(item,ctx,category,filter,statusEffectNames){
  // 2.5.7.11: 検索画面と完全に同じ「クイック所有者検索」の結果セットを使う。
  // 以前の候補別collectQuickStatusEffectOwnersForItem直接判定は、検索画面と結果がずれるため廃止。
  const quickFilter=filter||getFormationSelectorQuickFilterFromContext(ctx);
  if(!quickFilter)return true;
  const itemName=normalizeSaveItemName(getItemDisplayName(item)||item?.name||item?.title||'');
  if(!itemName)return false;
  const set=getFormationSelectorQuickOwnerNameSet(category,quickFilter);
  if(set&&set.size)return set.has(itemName);
  const cacheKey=getFormationSelectorQuickHitCacheKey(item,category,quickFilter);
  const cache=state._formationSelectorQuickHitCache||{};
  if(Object.prototype.hasOwnProperty.call(cache,cacheKey))return !!cache[cacheKey];
  const names=statusEffectNames||getAllStatusEffectNamesForRelatedLinks();
  const hits=(typeof collectQuickStatusEffectOwnersForItem==='function')
    ? collectQuickStatusEffectOwnersForItem(item,category,quickFilter,names)
    : [];
  const ok=!!(hits&&hits.length);
  if(Object.keys(cache).length>3000)state._formationSelectorQuickHitCache={};
  state._formationSelectorQuickHitCache={...(state._formationSelectorQuickHitCache||{}),[cacheKey]:ok};
  return ok;
}
function formationSelectorCandidateMatchesStatusFilters(item,ctx,category){
  return formationSelectorCandidateMatchesQuickStatusFilters(item,ctx,category,null,null);
}
function getFormationSelectorGeneralRarity(item){const name=getItemDisplayName(item);const m=norm(name).match(/^(LR|UR|SSR|SR\+?|R\+?|N)/);return m?m[1]:'';}

function getDerivedFormationCandidateIndexItems(){
  const bucket=state?.derivedData?.formationCandidateIndex;
  return bucket&&bucket.available&&Array.isArray(bucket.items)?bucket.items:[];
}
function getDerivedFormationCandidateEntry(item,categoryHint=''){
  const items=getDerivedFormationCandidateIndexItems();
  if(!items.length||!item)return null;
  const category=normalizeDerivedSearchCategory(categoryHint||detailCategory(item));
  const names=[getItemDisplayName(item),item?.name,item?.displayName,item?.rawName,item?.title,item?.raw?.name,item?.raw?.title].map(v=>normalizeSaveItemName(v)).filter(Boolean);
  const hit=items.find(entry=>{
    const ec=normalizeDerivedSearchCategory(entry?.category||'');
    if(category&&ec&&ec!==category)return false;
    const entryNames=[entry?.name,entry?.displayName,entry?.rawName,entry?.title].map(v=>normalizeSaveItemName(v)).filter(Boolean);
    return names.some(n=>entryNames.includes(n));
  })||null;
  if(hit){
    state.diagnostics.formationCandidateIndex={available:true,used:true,itemCount:items.length,lastCategory:category,lastName:names[0]||'',lastSkillCount:Number(hit.skillCount||((hit.skillNames||[]).length)||0),lastJijuPositions:Array.isArray(hit.jijuPositions)?hit.jijuPositions:[]};
  }
  return hit;
}
function getDerivedEffectConditionBlockEntry(item){
  const bucket=state?.derivedData?.effectConditionBlocks;
  const items=bucket&&bucket.available&&Array.isArray(bucket.items)?bucket.items:[];
  if(!items.length||!item)return null;
  const category=normalizeDerivedSearchCategory(detailCategory(item));
  const names=[getItemDisplayName(item),item?.name,item?.displayName,item?.rawName,item?.title,item?.raw?.name,item?.raw?.title].map(v=>normalizeSaveItemName(v)).filter(Boolean);
  const hit=items.find(entry=>{
    const ec=normalizeDerivedSearchCategory(entry?.category||'');
    if(category&&ec&&ec!==category)return false;
    const entryNames=[entry?.name,entry?.displayName,entry?.rawName,entry?.title].map(v=>normalizeSaveItemName(v)).filter(Boolean);
    return names.some(n=>entryNames.includes(n));
  })||null;
  if(hit){
    state.diagnostics.effectConditionBlocks={available:true,used:true,itemCount:items.length,lastCategory:category,lastName:names[0]||'',lastBlockCount:Number(hit.blockCount||((hit.blocks||[]).length)||0)};
  }
  return hit;
}
function derivedCandidateJoin(values){
  return (Array.isArray(values)?values:[]).map(norm).filter(Boolean).join('/');
}
function getFormationSelectorCandidateSub(item,type,ctx,extra={}){
  const derivedCandidate=getDerivedFormationCandidateEntry(item,type==='equipment'?'equipments':'generals');
  if(type==='advisor'){
    const all=getAdvisorSkillEntriesForGeneralItem(item);
    const records=getActiveAdvisorSkillRecordsForGeneralItem(item);
    const lv=advisorLevelLabel(getEffectiveGeneralAdvisorLevel(getItemDisplayName(item)));
    const slotLabel=ctx?.advisorSpec?.label||advisorSlotLabel(ctx?.advisorKey||'');
    const skills=records.length?records.map(r=>`${r.skillName}${r.levelRoman}`).join(' / '):(all.length?`技能未解放（Lv5/10で解放）`:'参軍技能なし');
    const allowed=extractAdvisorSlotKeysForGeneralItem(item).map(advisorSlotLabel).filter(Boolean).join('・');
    return [`${slotLabel}候補`,`参軍Lv:${lv}`,skills,allowed?`対応:${allowed}`:''].filter(Boolean).join(' / ');
  }
  if(type==='equipment'){
    const derivedTroops=derivedCandidate?derivedCandidate.troopTypes:[];
    const troops=(Array.isArray(derivedTroops)&&derivedTroops.length)?derivedTroops:getEquipmentTroopTypes(item);
    const troopText=troops.length?`兵科:${troops.join('・')}`:'兵科:制限なし';
    let permissionText='';
    if(ctx?.equipSpec?.type==='武器'){
      const detail=getFormationSlotWeaponPermissionDetail(ctx);
      const matched=(troops.length?troops:['歩兵','騎兵','弓兵']).filter(t=>detail.allowedTroopTypes.includes(t));
      const extra=detail.permissions.filter(p=>p.source==='本人技能'&&matched.includes(p.troopType)).map(p=>p.label);
      permissionText=extra.length?extra.join(' / '):(matched.length?`選択可:${matched.join('・')}`:'');
    }
    return [getEquipmentType(item)||'装備',troopText,permissionText,state.viewMode==='saved'?'保存データ候補':'全データ候補'].filter(Boolean).join(' / ');
  }
  const troop=(derivedCandidate&&Array.isArray(derivedCandidate.troopTypes)&&derivedCandidate.troopTypes[0])||getGeneralTroopType(item)||'';
  const rarity=(derivedCandidate&&derivedCandidate.rarity)||getFormationSelectorGeneralRarity(item)||'';
  const talent=(derivedCandidate&&derivedCandidate.talent)||getGeneralTalentValue(item)||'';
  const jijuPositions=derivedCandidate?derivedCandidateJoin(derivedCandidate.jijuPositions):getGeneralJijuPositionListByName(getItemDisplayName(item)).join('/');
  const skillCount=derivedCandidate?Number(derivedCandidate.skillCount||((derivedCandidate.skillNames||[]).length)||0):0;
  const parts=[rarity,troop,talent?`天賦${talent}`:'',jijuPositions?`侍従位置:${jijuPositions}`:'侍従位置:-',skillCount?`技能${skillCount}`:'',state.viewMode==='saved'?'保存データ候補':'全データ候補'];
  return parts.filter(Boolean).join(' / ');
}
function formationSelectorCandidateMatchesKeyword(item,name,keyword){
  const normalizeSelectorSearchText=value=>norm(value||'').toLowerCase();
  const key=normalizeSelectorSearchText(keyword||'');
  if(!key)return true;
  const display=norm(name||getItemDisplayName(item));
  const normalizedDisplay=normalizeSaveItemName(display);
  const title=norm(item?.title||item?.name||'');
  const normalizedTitle=normalizeSaveItemName(title);
  const searchable=[display,normalizedDisplay,title,normalizedTitle]
    .map(v=>normalizeSelectorSearchText(v||''))
    .filter(Boolean)
    .join(' ');
  return searchable.includes(key);
}

function getFormationAdvisorSkillFilterNames(ctx){
  const specKey=ctx?.advisorKey||'';
  const set=new Set();
  formationAllowedItems('generals').forEach(item=>{
    if(specKey&&!advisorGeneralCanUseSlot(item,specKey))return;
    getAdvisorSkillEntriesForGeneralItem(item).forEach(entry=>{const name=norm(entry?.name||'');if(name)set.add(name);});
  });
  return [...set].sort((a,b)=>a.localeCompare(b,'ja'));
}
function buildFormationSelectorAdvisorSkillOptions(ctx){
  const selected=norm(ctx?.advisorSkill||'');
  const names=getFormationAdvisorSkillFilterNames(ctx);
  return `<option value="">参軍技能すべて</option>${names.map(name=>`<option value="${esc(name)}" ${selected===name?'selected':''}>${esc(name)}</option>`).join('')}`;
}
function formationAdvisorCandidateMatchesSkillFilter(item,advisorSkill){
  const skill=norm(advisorSkill||'');
  if(!skill)return true;
  return getAdvisorSkillEntriesForGeneralItem(item).some(entry=>norm(entry?.name||'')===skill);
}
function getFormationSelectorBaseCandidateRows(ctx){
  const f=ensureCurrentFormation();
  if(ctx.type==='advisor'){
    return formationAllowedItems('generals').map(item=>({item,name:getItemDisplayName(item),category:'generals',advisorKey:ctx.advisorKey,f,activeAdvisorSkillCount:getActiveAdvisorSkillRecordsForGeneralItem(item).length,advisorLevel:Number(getEffectiveGeneralAdvisorLevel(getItemDisplayName(item))||0)})).filter(row=>getAdvisorSkillEntriesForGeneralItem(row.item).length&&advisorGeneralCanUseSlot(row.item,ctx.advisorKey)&&formationAdvisorCandidateMatchesSkillFilter(row.item,ctx.advisorSkill)).sort((a,b)=>{
      if((b.activeAdvisorSkillCount||0)!==(a.activeAdvisorSkillCount||0))return (b.activeAdvisorSkillCount||0)-(a.activeAdvisorSkillCount||0);
      if((b.advisorLevel||0)!==(a.advisorLevel||0))return (b.advisorLevel||0)-(a.advisorLevel||0);
      return normalizeSaveItemName(a.name).localeCompare(normalizeSaveItemName(b.name),'ja');
    });
  }
  if(ctx.type==='equipment'){
    const fixedType=ctx.equipSpec?.type||ctx.equipmentType||'';
    return formationAllowedItems('equipments').map(item=>({item,name:getItemDisplayName(item),category:'equipments',fixedType,f})).filter(row=>{
      const type=getEquipmentType(row.item);
      if(fixedType&&type&&type!==fixedType)return false;
      if(fixedType&&!type&&ctx.equipSpec&&ctx.equipSpec.type)return false;
      if(!formationWeaponCandidateMatchesTroop(row,ctx))return false;
      if(!formationEquipmentCandidateAllowedByDuplicateRule(row,ctx))return false;
      return true;
    }).sort((a,b)=>normalizeSaveItemName(a.name).localeCompare(normalizeSaveItemName(b.name),'ja'));
  }
  const availability=computeFormationJijuAvailability(f).bySlot?.[ctx.slotKey]||null;
  return formationAllowedItems('generals').map(item=>({item,name:getItemDisplayName(item),category:'generals',availability,f})).sort((a,b)=>normalizeSaveItemName(a.name).localeCompare(normalizeSaveItemName(b.name),'ja'));
}
function getFormationMatchingJijuCellsForCandidate(availability,candidateName,requestedPosition=''){
  const req=normalizeJijuPositionValue(requestedPosition||'');
  const name=normalizeSaveItemName(candidateName||'');
  if(!availability||!availability.owner||!name)return [];
  return (availability.available||[])
    .filter(c=>!req||c.position===req)
    .filter(c=>evaluateJijuAttendantCondition(availability.owner,name,c.position).ok);
}
function getFormationSelectorCandidateCondition(row,ctx){
  if(ctx.type!=='attendant')return '';
  const availability=row.availability||computeFormationJijuAvailability(ensureCurrentFormation()).bySlot?.[ctx.slotKey]||null;
  const matches=getFormationMatchingJijuCellsForCandidate(availability,row.name,ctx?.jijuPosition||'');
  return matches.length?`侍従条件OK：${matches.map(c=>c.position).join('/')}`:'';
}
async function getFormationSelectorCandidatesAsync(ctx,seq){
  return new Promise(resolve=>{
    const started=performance.now();
    const rows=getFormationSelectorBaseCandidateRows(ctx);
    const category=ctx.type==='equipment'?'equipments':'generals';
    const quickFilter=getFormationSelectorQuickFilterFromContext(ctx);
    const statusEffectNames=getAllStatusEffectNamesForRelatedLinks();
    const out=[];
    let idx=0;
    const chunkSize=18;
    const step=()=>{
      if(seq!==state._formationSelectorRefreshSeq){resolve(null);return;}
      const end=Math.min(idx+chunkSize,rows.length);
      for(;idx<end;idx++){
        const row=rows[idx];
        const item=row.item;const name=row.name;
        if(!formationSelectorCandidateMatchesKeyword(item,name,ctx.keyword))continue;
        if(ctx.type==='general'||ctx.type==='attendant'){
          if(ctx.troop&&getGeneralTroopType(item)!==ctx.troop)continue;
          if(ctx.rarity&&getFormationSelectorGeneralRarity(item)!==ctx.rarity)continue;
          if(ctx.type==='attendant'){
            const availability=row.availability;
            if(!availability||!availability.owner||!availability.hasAvailable)continue;
            if(!getFormationMatchingJijuCellsForCandidate(availability,name,ctx.jijuPosition||'').length)continue;
          }
        }
        if(quickFilter&&!formationSelectorCandidateMatchesQuickStatusFilters(item,ctx,category,quickFilter,statusEffectNames))continue;
        out.push({item,name,condition:getFormationSelectorCandidateCondition(row,ctx)});
        if(out.length>=120)break;
      }
      const wrap=els.formationRoot?els.formationRoot.querySelector('[data-formation-selector-results]'):null;
      if(wrap&&quickFilter&&idx<rows.length){wrap.innerHTML=`<div class="formation-selector-empty">状態変化条件で絞り込み中... ${idx}/${rows.length}</div>`;}
      if(idx<rows.length&&out.length<120){setTimeout(step,0);return;}
      debugLog('formationSelector:candidate-async',{type:ctx.type,advisorSkill:ctx.advisorSkill||'',statusGroup:ctx.statusGroup,statusEffect:ctx.statusEffect,filter:quickFilter?{key:quickFilter.key,group:quickFilter.group,label:quickFilter.label,statusName:quickFilter.statusName,relationType:quickFilter.relationType||''}:null,returned:out.length,processed:idx,total:rows.length,ms:Number((performance.now()-started).toFixed(1)),policy:'2.5.7.11: 検索画面のbuildQuickOwnerRows結果名Setと同じ判定を使用。分類のみでは絞り込まない。'});
      resolve(out);
    };
    setTimeout(step,0);
  });
}
function getFormationSelectorCandidates(ctx){
  const rows=getFormationSelectorBaseCandidateRows(ctx);
  const category=ctx.type==='equipment'?'equipments':'generals';
  const out=[];
  for(const row of rows){
    const item=row.item;const name=row.name;
    if(!formationSelectorCandidateMatchesKeyword(item,name,ctx.keyword))continue;
    if(ctx.type==='general'||ctx.type==='attendant'){
      if(ctx.troop&&getGeneralTroopType(item)!==ctx.troop)continue;
      if(ctx.rarity&&getFormationSelectorGeneralRarity(item)!==ctx.rarity)continue;
      if(ctx.type==='attendant'){
        const availability=row.availability;
        if(!availability||!availability.owner||!availability.hasAvailable)continue;
        if(!getFormationMatchingJijuCellsForCandidate(availability,name,ctx.jijuPosition||'').length)continue;
      }
    }
    if(ctx.statusEffect&&!formationSelectorCandidateMatchesStatusFilters(item,ctx,category))continue;
    out.push({item,name,condition:getFormationSelectorCandidateCondition(row,ctx)});
    if(out.length>=120)break;
  }
  return out;
}
function renderFormationSelectorResultsHtml(ctx,candidates,category){
  return candidates.length?`<div class="formation-selector-list">${candidates.map(c=>`<button type="button" class="formation-selector-item" data-formation-selector-pick="${esc(category)}" data-name="${esc(normalizeSaveItemName(c.name))}"><span class="formation-selector-item-title">${esc(formationDisplayName(category,c.name)||c.name)}</span><span class="formation-selector-item-sub">${esc(getFormationSelectorCandidateSub(c.item,ctx.type,ctx))}</span>${c.condition?`<span class="formation-selector-condition">${esc(c.condition)}</span>`:''}</button>`).join('')}</div>`:`<div class="formation-selector-empty">条件に合う候補がありません。</div>`;
}
function handleFormationSelectorPickAction(btn,event){
  if(!btn)return;
  if(event){event.preventDefault();event.stopPropagation();}
  if(btn.dataset.formationSelectorPicked==='1')return;
  btn.dataset.formationSelectorPicked='1';
  assignFormationSelectorCandidate(btn.dataset.formationSelectorPick,btn.dataset.name);
}
function bindFormationSelectorPickButton(btn){
  if(!btn||btn.dataset.formationSelectorPickBound==='1')return;
  btn.dataset.formationSelectorPickBound='1';
  btn.addEventListener('pointerup',event=>handleFormationSelectorPickAction(btn,event));
  btn.addEventListener('click',event=>handleFormationSelectorPickAction(btn,event));
}
function bindFormationSelectorResultButtons(wrap){
  if(!wrap)return;
  wrap.querySelectorAll('[data-formation-selector-pick]').forEach(bindFormationSelectorPickButton);
}
function refreshFormationSelectorDialogResults(){
  if(!els.formationRoot||!state.formationSelectorDialog)return;
  const wrap=els.formationRoot.querySelector('[data-formation-selector-results]');
  if(!wrap)return;
  const started=performance.now();
  const ctx=getFormationSelectorContext();
  const category=ctx.type==='equipment'?'equipments':'generals';
  const seq=(state._formationSelectorRefreshSeq||0)+1;
  state._formationSelectorRefreshSeq=seq;
  const hasStatusFilter=!!ctx.statusEffect;
  if(hasStatusFilter){
    wrap.innerHTML='<div class="formation-selector-empty">状態変化条件で絞り込み中...</div>';
    getFormationSelectorCandidatesAsync(ctx,seq).then(candidates=>{
      if(!candidates||seq!==state._formationSelectorRefreshSeq||!state.formationSelectorDialog)return;
      const currentCtx=getFormationSelectorContext();
      const currentCategory=currentCtx.type==='equipment'?'equipments':'generals';
      wrap.innerHTML=renderFormationSelectorResultsHtml(currentCtx,candidates,currentCategory);
      bindFormationSelectorResultButtons(wrap);
      debugLog('formationSelector:filter-refresh',{type:currentCtx.type,advisorSkill:currentCtx.advisorSkill||'',statusGroup:currentCtx.statusGroup,statusEffect:currentCtx.statusEffect,candidateCount:candidates.length,ms:Number((performance.now()-started).toFixed(1)),async:true});
    }).catch(err=>{
      if(seq!==state._formationSelectorRefreshSeq)return;
      wrap.innerHTML='<div class="formation-selector-empty">絞り込み中にエラーが発生しました。</div>';
      debugLog('formationSelector:filter-refresh-error',{message:String(err?.message||err)});
    });
    return;
  }
  const candidates=getFormationSelectorCandidates(ctx);
  wrap.innerHTML=renderFormationSelectorResultsHtml(ctx,candidates,category);
  bindFormationSelectorResultButtons(wrap);
  debugLog('formationSelector:filter-refresh',{type:ctx.type,advisorSkill:ctx.advisorSkill||'',statusGroup:ctx.statusGroup,statusEffect:ctx.statusEffect,candidateCount:candidates.length,ms:Number((performance.now()-started).toFixed(1)),async:false});
}
function refreshFormationSelectorStatusEffectControl(){
  if(!els.formationRoot||!state.formationSelectorDialog)return;
  const ctx=getFormationSelectorContext();
  const sel=els.formationRoot.querySelector('select[data-formation-selector-filter="statusEffect"]');
  if(sel){sel.innerHTML=buildFormationSelectorStatusEffectOptions(ctx);sel.value=ctx.statusEffect||'';}
}
function assignFormationSelectorCandidate(category,name){
  const ctx=getFormationSelectorContext();
  const item=findItemByDisplayName(category,name);
  if(!item){window.alert('候補データが見つかりません。');return;}
  let destination=null;
  if(ctx.type==='general')destination={slotKey:ctx.slotKey,kind:'general'};
  else if(ctx.type==='advisor')destination={kind:'advisor',advisorKey:ctx.advisorKey};
  else if(ctx.type==='equipment')destination={slotKey:ctx.slotKey,kind:'equipment',equipKey:ctx.equipKey};
  else if(ctx.type==='attendant'){
    const f=ensureCurrentFormation();const info=computeFormationJijuAvailability(f).bySlot?.[ctx.slotKey];
    const candidateName=normalizeSaveItemName(name);
    const requested=normalizeJijuPositionValue(ctx.jijuPosition||'');
    const available=(info?.available||[]).filter(c=>!requested||c.position===requested);
    const chosen=available.find(c=>evaluateJijuAttendantCondition(info.owner,candidateName,c.position).ok);
    if(!chosen){window.alert(requested?'指定した侍従位置の条件を満たす候補ではありません。':'侍従条件を満たす配置先がありません。');return;}
    destination={slotKey:ctx.slotKey,kind:'attendant',jijuPosition:chosen.position,position:chosen.position,row:chosen.row,col:chosen.col};
  }
  const ok=assignFormationItem(item,destination);
  if(!ok){window.alert('登録できませんでした。同一部隊内で既に使用中の装備、または条件を確認してください。');return;}
  state.formationSelectorDialog=null;
  state.formationSlotDialogOpen=isResponsiveMobileMode()&&ctx.type!=='attendant'&&ctx.type!=='advisor';
  renderFormationScreen();
}
function renderFormationSelectorDialogHtml(f){
  if(!state.formationSelectorDialog)return '';
  const ctx=getFormationSelectorContext();
  const title=ctx.type==='general'?`${ctx.spec.label}の武将を選択`:ctx.type==='attendant'?`${ctx.spec.label}の侍従を選択`:ctx.type==='advisor'?`参軍:${ctx.advisorSpec?.label||'参軍'}を選択`:`${ctx.spec.label}の${ctx.equipSpec?.label||'装備'}を選択`;
  const candidates=getFormationSelectorCandidates(ctx);
  const category=ctx.type==='equipment'?'equipments':'generals';
  const fixedNotes=[];
  if(state.viewMode==='saved')fixedNotes.push('保存データに登録済みの候補だけを表示しています。');
  if(ctx.type==='advisor')fixedNotes.push('参軍Lv5で1つ目、Lv10で2つ目の参軍技能が有効です。');
  if(ctx.type==='attendant')fixedNotes.push('侍従候補は、対象武将の侍従条件と陣形上の配置可能位置で自動抽出しています。兵科は条件側で固定されるため、ここでは変更できません（複数兵科が条件になる場合があります）。');
  if(ctx.type==='equipment'&&ctx.equipSpec){
    fixedNotes.push(`${ctx.equipSpec.label}に装備できる種類で事前フィルタしています。`);
    fixedNotes.push('同一部隊内で使用中の装備は候補から除外します。ただし神刀、宝双剣、易経、宝雕弓、宝剣、蛇戟、象鼻刀、委貌冠、黒光鎧、明光鎧は重複可能です。');
    if(ctx.equipSpec.type==='武器')fixedNotes.push(`武器は対象武将の兵科と、武将・既存装備の技能から推定した追加装備可能兵科に一致する候補のみ表示します。`);
  }
  const filterHtml=ctx.type==='advisor'
    ? `<div class="formation-selector-filter-grid is-advisor"><input type="text" class="formation-select" data-formation-selector-filter="keyword" placeholder="参軍武将名で検索" value="${esc(ctx.keyword)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><select class="formation-select" data-formation-selector-filter="advisorSkill">${buildFormationSelectorAdvisorSkillOptions(ctx)}</select></div>`
    : ctx.type==='equipment'
    ? `<div class="formation-selector-filter-grid has-status-filter is-equipment"><input type="text" class="formation-select" data-formation-selector-filter="keyword" placeholder="装備名で検索" value="${esc(ctx.keyword)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><select class="formation-select" data-formation-selector-filter="statusGroup">${buildFormationSelectorStatusGroupOptions(ctx)}</select><select class="formation-select" data-formation-selector-filter="statusEffect">${buildFormationSelectorStatusEffectOptions(ctx)}</select><select class="formation-select" data-formation-selector-filter="equipmentType" ${ctx.equipSpec?'disabled':''}><option value="">種類すべて</option>${EQUIP_SLOT_SPECS.map(e=>`<option value="${esc(e.type)}" ${(ctx.equipSpec?.type||ctx.equipmentType)===e.type?'selected':''}>${esc(e.label)}</option>`).join('')}</select></div>`
    : ctx.type==='attendant'
      ? `<div class="formation-selector-filter-grid has-status-filter is-attendant"><input type="text" class="formation-select" data-formation-selector-filter="keyword" placeholder="侍従名で検索" value="${esc(ctx.keyword)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><select class="formation-select" data-formation-selector-filter="statusGroup">${buildFormationSelectorStatusGroupOptions(ctx)}</select><select class="formation-select" data-formation-selector-filter="statusEffect">${buildFormationSelectorStatusEffectOptions(ctx)}</select></div>`
      : `<div class="formation-selector-filter-grid has-status-filter"><input type="text" class="formation-select" data-formation-selector-filter="keyword" placeholder="武将名で検索" value="${esc(ctx.keyword)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><select class="formation-select" data-formation-selector-filter="statusGroup">${buildFormationSelectorStatusGroupOptions(ctx)}</select><select class="formation-select" data-formation-selector-filter="statusEffect">${buildFormationSelectorStatusEffectOptions(ctx)}</select><select class="formation-select" data-formation-selector-filter="troop"><option value="">兵科すべて</option>${['歩兵','騎兵','弓兵'].map(v=>`<option value="${esc(v)}" ${ctx.troop===v?'selected':''}>${esc(v)}</option>`).join('')}</select><select class="formation-select" data-formation-selector-filter="rarity"><option value="">レアリティすべて</option>${['LR','UR','SSR','SR','R','N'].map(v=>`<option value="${esc(v)}" ${ctx.rarity===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>`;
  const currentSlot=f?.slots?.[ctx.slotKey]||{};
  const currentAdvisorName=ctx.type==='advisor'?normalizeSaveItemName((f?.advisorSlots||{})[ctx.advisorKey]||''):'';
  const clearButton=(ctx.type==='advisor'&&currentAdvisorName)?`<div class="formation-selector-command-row"><button type="button" class="copy-btn btn-clear-all" data-formation-remove="advisor" data-equip-key="${esc(ctx.advisorKey)}">現在の参軍を解除</button><span class="formation-selector-advisor-note">現在: ${esc(formationDisplayNameNoReading('generals',currentAdvisorName))}</span></div>`:(ctx.type==='attendant'&&currentSlot.attendant)?`<div class="formation-selector-command-row"><button type="button" class="copy-btn btn-clear-all" data-formation-remove="attendant" data-slot-key="${esc(ctx.slotKey)}">現在の侍従を解除</button></div>`:'';
  const listHtml=renderFormationSelectorResultsHtml(ctx,candidates,category);
  return `<div class="formation-mobile-dialog-overlay is-selector-top no-detail-linkify" data-formation-selector-backdrop="1"><div class="formation-mobile-dialog-card" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="formation-mobile-dialog-head"><div class="formation-mobile-dialog-title">${esc(title)}</div><button type="button" class="formation-mobile-dialog-close" data-formation-selector-close="1">閉じる</button></div><div class="formation-selector-dialog-body">${fixedNotes.length?`<div class="formation-selector-fixed-note">${esc(fixedNotes.join(' '))}</div>`:''}${filterHtml}${clearButton}<div data-formation-selector-results>${listHtml}</div></div></div></div>`;
}

function renderFormationSelectedSlotSkillSummaryHtml(f,spec,slot,data){
  if(!slot||!slot.general)return '<div class="formation-selected-skill-panel"><div class="formation-selected-skill-list"><div class="formation-selected-skill-empty">武将未設定です。</div></div></div>';
  const holderNames=new Set();
  const addName=name=>{const n=normalizeSaveItemName(name||'');if(n)holderNames.add(n);};
  addName(slot.general);addName(slot.attendant);
  Object.values(slot.equipments||{}).forEach(addName);
  let d=data;
  try{if(!d)d=buildFormationParameterData(f);}catch(err){debugLog('formation:selected-skill-data-error',{message:err?.message||String(err)});d=null;}
  const rows=(d?.skills||[]).filter(row=>(row.holders||[]).some(h=>holderNames.has(normalizeSaveItemName(h))));
  const filter=normalizeFormationSkillFilter(state.formationSkillFilter||'全て');
  const visible=rows.filter(row=>formationSkillMatchesFilter(row,filter)).sort((a,b)=>{
    const oa=formationSkillSourceOrderValue(a.sourceCategories||[]),ob=formationSkillSourceOrderValue(b.sourceCategories||[]);
    if(oa!==ob)return oa-ob;
    return norm(a.name).localeCompare(norm(b.name),'ja');
  });
  const body=visible.length?visible.map(row=>{
    const minLv=Math.max(1,Number(row.min||row.total||row.max||1)||1);
    const maxLv=Math.max(1,Number(row.max||row.total||row.min||1)||1);
    const lv=(minLv===maxLv)?(ROMAN_LEVELS[minLv-1]||String(minLv)):`${ROMAN_LEVELS[minLv-1]||minLv}〜${ROMAN_LEVELS[maxLv-1]||maxLv}`;
    return `<div class="formation-selected-skill-row"><div class="formation-selected-skill-name"><span>${esc(row.name)}</span><span class="formation-badge">${esc(lv)}</span></div></div>`;
  }).join(''):`<div class="formation-selected-skill-empty">この武将・装備で有効な合算技能はありません。</div>`;
  return `<div class="formation-selected-skill-panel"><div class="formation-selected-skill-list">${body}</div></div>`;
}

function renderFormationSelectedSlotEditorHtml(f,data){
  const spec=getFormationSelectedSlotSpec();
  const slot=f?.slots?.[spec.key]||createFormationSlot();
  const generalName=slot.general||'';
  const generalItem=findItemByDisplayName('generals',generalName);
  const generalTitle=generalName?formationDisplayNameNoReading('generals',generalName):'未設定';
  const sub=generalItem?buildDetailTagsHtml(generalItem).replace(/<[^>]*>/g,' ').replace(/カテゴリ:武将/g,'').replace(/\s+/g,' ').trim():'';
  const generalAction=`<div class="formation-edit-action-row"><button type="button" class="copy-btn toggle-active" data-formation-selector-open="general" data-slot-key="${esc(spec.key)}">${generalName?'武将を変更':'武将を登録'}</button>${generalName?`<button type="button" class="copy-btn" data-formation-remove="general" data-slot-key="${esc(spec.key)}">武将削除</button>`:''}</div>`;
  const equipHtml=EQUIP_SLOT_SPECS.map(e=>{const n=slot?.equipments?.[e.key]||'';return `<div class="formation-selected-equip"><div class="formation-selected-equip-label">${esc(e.label)}</div><div class="formation-selected-equip-name">${n?esc(formationDisplayName('equipments',n)): '未設定'}</div><div class="formation-edit-action-row"><button type="button" class="copy-btn" data-formation-selector-open="equipment" data-slot-key="${esc(spec.key)}" data-equip-key="${esc(e.key)}" ${generalName?'':'disabled'}>${n?'変更':'登録'}</button>${n?`<button type="button" class="copy-btn" data-formation-remove="equipment" data-slot-key="${esc(spec.key)}" data-equip-key="${esc(e.key)}">削除</button>`:''}</div></div>`;}).join('');
  const skillPanel=renderFormationSelectedSlotSkillSummaryHtml(f,spec,slot,data);
  const editor=generalName?`<div class="formation-selected-editor-main"><div class="formation-selected-summary"><div><div class="formation-selected-name">${esc(generalTitle)}</div><div class="formation-selected-sub">${esc(sub||'武将')}</div>${renderFormationInheritedSkillControl(generalName)}</div></div>${generalAction}<div><div class="formation-equip-label formation-selected-equipment-title" style="margin-bottom:6px">装備</div><div class="formation-selected-equips">${equipHtml}</div></div></div>${skillPanel}`:`<div class="formation-selected-editor-main"><div class="formation-selected-empty">この枠には武将が未設定です。下のボタンから登録してください。${generalAction}</div></div>${skillPanel}`;
  return `<section class="formation-selected-card"><div class="formation-selected-head"><div class="formation-selected-title">選択中：${esc(spec.label)}</div></div><div class="formation-selected-card-body">${editor}</div></section>`;
}

const FORMATION_REQUIRED_RESULT_KEYS=['攻撃速度','射程'];
function collectFormationAllParameterRows(data){const rows=[];let seq=0;['tactic','deploy','normal','defense'].forEach(t=>{const groups=data?.summary?.[t]||{};PARAM_DISPLAY_GROUP_ORDER.forEach(g=>{formationOrderedParameterKeys(groups?.[g]||{}).forEach(k=>{const v=groups[g][k];rows.push({seq:seq++,timing:t,timingLabel:timingLabel(t),group:g,key:k,label:parameterDisplayName(k),value:formationParameterDisplayValue(k,v)});});});});return rows;}
function formationRequiredResultPriority(row){const idx=FORMATION_REQUIRED_RESULT_KEYS.indexOf(norm(row?.key||''));return idx>=0?idx:999;}
function collectFormationRequiredResultRows(data){const all=collectFormationAllParameterRows(data);return FORMATION_REQUIRED_RESULT_KEYS.map(key=>{const found=all.find(r=>norm(r.key)===key);return found||{missing:true,key,label:parameterDisplayName(key),value:key==='射程'?'未判定':'該当なし',timingLabel:'-'};});}
function collectFormationQuickSummaryRows(data,limit=10,formation=null){const rows=collectFormationAllParameterRows(data);const picked=rows.slice(0,limit);FORMATION_REQUIRED_RESULT_KEYS.forEach(key=>{const found=rows.find(r=>norm(r.key)===key);if(found&&!picked.some(r=>norm(r.key)===key)){if(picked.length>=limit)picked.pop();picked.push(found);}});const sorted=picked.sort((a,b)=>a.seq-b.seq);if(formation){const tactic=getFormationTacticAttackMaxPowerSummary(formation,data);sorted.unshift({seq:-100,label:'戦法攻撃',value:tactic.label,key:'戦法攻撃最大威力'});}return sorted;}
function renderFormationRequiredResultSummary(data){const rows=collectFormationRequiredResultRows(data);return `<section class="formation-required-result-strip" aria-label="重要結果"><div class="formation-required-result-title">重要結果</div>${rows.map(r=>`<div class="formation-required-result-chip ${r.missing?'is-missing':''}"><span class="formation-required-result-label">${esc(r.label)}</span><strong>${esc(r.value)}</strong><span class="note">${esc(r.timingLabel||'-')}</span></div>`).join('')}</section>`;}
function renderFormationMasterReadOnlyHtml(f){const master=getFormationMasterByName(f?.formationName||'基本');if(!master)return '<div class="detail-empty">陣形データが読み込まれていません。</div>';const info=[];info.push(['陣形',master.name||'-']);info.push(['編制種類',formationDeploymentTypeLabel(f?.deploymentType)]);info.push(['能力影響',master.ability_impact_text||master.raw?.ability_impact_text||'-']);info.push(['ステータス補正',master.status_correction||master.raw?.status_correction||'-']);const skills=Array.isArray(master.skills)?master.skills:(Array.isArray(master.raw?.skills)?master.raw.skills:[]);info.push(['陣形技能',skills.length?skills.map(x=>x?.name).filter(Boolean).join(' / '):'なし']);return `<details class="formation-mobile-summary-section" open><summary>陣形情報</summary><div class="formation-mobile-summary-body"><div class="formation-master-layout-row">${renderFormationMasterGrid(master)}</div><div class="general-card no-detail-linkify"><div class="general-card-body">${renderEquipmentKeyValueRows(info)}</div></div></div></details>`;}
function renderFormationQuickResultSummary(data,formation=null){const rows=collectFormationQuickSummaryRows(data,10,formation);if(!rows.length)return `<div class="formation-quick-summary-strip formation-result-enlarge-strip" data-formation-summary-open="1" role="button" tabindex="0"><div class="formation-quick-summary-title"><span>結果サマリー</span><span class="note">タップで拡大</span></div><div class="formation-quick-summary-empty">状態変化率なし</div></div>`;return `<div class="formation-quick-summary-strip formation-result-enlarge-strip" data-formation-summary-open="1" role="button" tabindex="0"><div class="formation-quick-summary-title"><span>結果サマリー</span><span class="note">タップで拡大</span></div><div class="formation-quick-summary-list">${rows.slice(0,isResponsiveMobileMode()?6:10).map(r=>`<span class="formation-quick-summary-chip">${esc(r.label)}<span class="value">${esc(r.value)}</span></span>`).join('')}</div></div>`;}
function applyFormationInnerTabDisplay(tab){
  const active=normalizeFormationInnerTab(tab);
  if(!els.formationRoot)return false;
  const panels=els.formationRoot.querySelectorAll('[data-formation-work-panel]');
  const buttons=els.formationRoot.querySelectorAll('[data-formation-inner-tab]');
  if(!panels.length||!buttons.length)return false;
  buttons.forEach(btn=>{const on=normalizeFormationInnerTab(btn.dataset.formationInnerTab||'edit')===active;btn.classList.toggle('is-active',on);btn.setAttribute('aria-selected',on?'true':'false');});
  panels.forEach(panel=>{const on=(panel.dataset.formationWorkPanel===active);panel.classList.toggle('tab-content-hidden',!on);if(on){panel.removeAttribute('hidden');panel.setAttribute('aria-hidden','false');if(!panel.dataset.hadoLinkified){try{linkifyDetailTextNodes(panel);panel.dataset.hadoLinkified='1';}catch(err){debugLog('formationInnerTab:fast-linkify-error',{tab:active,message:err?.message||String(err)});}}}else{panel.setAttribute('hidden','');panel.setAttribute('aria-hidden','true');}});
  return true;
}
function setFormationInnerTab(tab){const next=normalizeFormationInnerTab(tab);const prev=state.formationInnerTab;state.formationInnerTab=next;const start=performance.now();if(!state._formationScreenStale&&applyFormationInnerTabDisplay(next)){debugLog('formationInnerTab:fast-switch',{from:prev,to:next,ms:Number((performance.now()-start).toFixed(1)),policy:'HADO-2.8.9.19: 上位タブ切替では部隊編成全体を再計算しない'});return;}debugLog('formationInnerTab:set-render',{from:prev,to:next,stale:!!state._formationScreenStale});renderFormationScreen();}
function buildFormationSummaryDialogHtmlFromRows(rows){return `<div class="formation-mobile-dialog-overlay formation-summary-dialog-overlay" data-formation-dialog-backdrop="summary"><div class="formation-mobile-dialog-card" role="dialog" aria-modal="true" aria-label="結果サマリー"><div class="formation-mobile-dialog-head"><div class="formation-mobile-dialog-title">結果サマリー</div><button type="button" class="formation-mobile-dialog-close" data-formation-summary-close="1">閉じる</button></div><div class="formation-mobile-summary-dialog-body">${rows.length?`<div class="formation-quick-summary-list">${rows.map(r=>`<span class="formation-quick-summary-chip">${esc(r.label)}<span class="value">${esc(r.value)}</span></span>`).join('')}</div>`:'<div class="formation-quick-summary-empty">状態変化率なし</div>'}<div class="formation-note">計算式や根拠は「変化率」タブで確認してください。</div></div></div></div>`;}
function cacheFormationSummaryDialogHtml(data,formation=null){const rows=collectFormationQuickSummaryRows(data,24,formation);state._formationSummaryDialogHtml=buildFormationSummaryDialogHtmlFromRows(rows);state._formationSummaryDialogRowCount=rows.length;state._formationSummaryDialogCachedAt=debugTimestamp();return rows;}
function renderFormationSummaryDialogHtml(data,formation=null){if(!state.formationSummaryDialogOpen)return '';const rows=cacheFormationSummaryDialogHtml(data,formation);return buildFormationSummaryDialogHtmlFromRows(rows);}
function getFormationSummaryDialogHost(){return (els.formationRoot&&els.formationRoot.querySelector('[data-formation-work-panel="edit"]'))||els.formationRoot||document.body;}
function bindFormationSummaryDialogFastEvents(root){const base=root||els.formationRoot||document;base.querySelectorAll('[data-formation-summary-close]').forEach(btn=>btn.addEventListener('click',closeFormationSummaryDialogFast));base.querySelectorAll('[data-formation-dialog-backdrop="summary"]').forEach(ov=>ov.addEventListener('click',e=>{if(e.target===ov)closeFormationSummaryDialogFast();}));}
function openFormationSummaryDialogFast(){const start=performance.now();state.formationSummaryDialogOpen=true;if(!els.formationRoot){renderFormationScreen();return;}const existing=els.formationRoot.querySelector('[data-formation-dialog-backdrop="summary"]');if(existing)existing.remove();if(state._formationScreenStale||!state._formationSummaryDialogHtml){debugLog('formationSummaryDialog:open-fallback-render',{stale:!!state._formationScreenStale,hasCache:!!state._formationSummaryDialogHtml});renderFormationScreen();return;}const host=getFormationSummaryDialogHost();host.insertAdjacentHTML('beforeend',state._formationSummaryDialogHtml);const overlay=els.formationRoot.querySelector('[data-formation-dialog-backdrop="summary"]');if(overlay)bindFormationSummaryDialogFastEvents(overlay);debugLog('formationSummaryDialog:open-fast',{rows:state._formationSummaryDialogRowCount||0,ms:Number((performance.now()-start).toFixed(1)),policy:'HADO-2.9.0.2: 結果サマリー拡大は部隊編成全体を再描画しない'});}
function closeFormationSummaryDialogFast(){const start=performance.now();state.formationSummaryDialogOpen=false;const existing=els.formationRoot&&els.formationRoot.querySelector('[data-formation-dialog-backdrop="summary"]');if(existing)existing.remove();debugLog('formationSummaryDialog:close-fast',{ms:Number((performance.now()-start).toFixed(1)),policy:'HADO-2.9.0.2: モーダルDOMのみ削除'});} 
function renderFormationTacticSummaryDialogHtml(f,data){if(!state.formationTacticSummaryDialogOpen)return '';return `<div class="formation-mobile-dialog-overlay formation-tactic-summary-dialog-overlay" data-formation-dialog-backdrop="tactic-summary"><div class="formation-mobile-dialog-card" role="dialog" aria-modal="true" aria-label="戦法サマリー"><div class="formation-mobile-dialog-head"><div class="formation-mobile-dialog-title">戦法サマリー</div><button type="button" class="formation-mobile-dialog-close" data-formation-tactic-summary-close="1">閉じる</button></div><div class="formation-mobile-summary-dialog-body">${renderFormationTacticAttackSummary(f,data,{dialog:true})}</div></div></div>`;}
function renderFormationSlotDialogHtml(f){if(!state.formationSlotDialogOpen)return '';const html=renderFormationSelectedSlotEditorHtml(f).replace('formation-selected-card','formation-selected-card is-dialog');return `<div class="formation-mobile-dialog-overlay" data-formation-dialog-backdrop="slot"><div class="formation-mobile-dialog-card" role="dialog" aria-modal="true" aria-label="選択中武将編集"><div class="formation-mobile-dialog-head"><div class="formation-mobile-dialog-title">選択中武将編集</div><button type="button" class="formation-mobile-dialog-close" data-formation-slot-dialog-close="1">閉じる</button></div>${html}</div></div>`;}

function renderFormationWorkTabsHtml(active){
  const specs=[['edit','編成'],['tactic','戦法'],['parameter','変化率'],['detail','詳細']];
  return `<div class="formation-work-tabs" role="tablist" aria-label="部隊編成表示切替">${specs.map(([key,label])=>`<button type="button" class="formation-work-tab-btn ${active===key?'is-active':''}" data-formation-inner-tab="${esc(key)}" role="tab" aria-selected="${active===key?'true':'false'}">${esc(label)}</button>`).join('')}</div>`;
}
function renderFormationScreenCore(){if(!els.formationRoot)return;rememberFormationDetailsOpenState(els.formationRoot);pruneFormationUnavailableItemsForSavedMode();const f=ensureCurrentFormationInCurrentGroup();const jijuRepair=repairFormationJijuAssignments(f,'renderFormationScreenCore');if(jijuRepair.changed)saveFormationDataToStorage('renderFormationScreenCore:jijuRepair');const data=buildFormationParameterData(f);const formationSkillDiag={formationId:f?.id||'',formationName:f?.name||'',viewMode:state.viewMode,skillCount:(data.skills||[]).length,hasBinkatsu:(data.skills||[]).some(s=>norm(s.name)==='敏活'),hasUnchui:(data.skills||[]).some(s=>norm(s.name)==='運籌帷幄'),skills:(data.skills||[]).map(s=>({name:s.name,total:s.total,min:s.min,max:s.max,holders:s.holders}))};const parameterDiag=buildFormationParameterCalculationDebug(data,f);state.diagnostics.formation={timestamp:debugTimestamp(),skillSummary:formationSkillDiag,parameterCalculation:parameterDiag,rangeConditionGate:data.rangeConditionGate||{},rangeEffectTrace:data.rangeEffectTrace||{},extensionSelection:{siegeWeapon:f.siegeWeapon||{},ethnicArmament:f.ethnicArmament||{}},advisorSummary:buildFormationAdvisorDebugSummary(f),formationSelection:{formationName:f.formationName||'基本',deploymentType:f.deploymentType||'normal',deploymentTypeLabel:formationDeploymentTypeLabel(f.deploymentType),jijuAvailability:computeFormationJijuAvailability(f)},extensionSummaryEffects:(data.extensionSummaryEffects||[]).map(e=>({sourceLabel:e.sourceLabel,key:e.key,value:effectSignedValue(e),unit:e.unit,condition:e.condition,rawText:e.rawText})),effectSources:(data.effects||[]).map(e=>({sourceLabel:e.sourceLabel,key:e.key,group:e.group,timing:e.timing,value:effectSignedValue(e),unit:e.unit,condition:cleanConditionText(e.condition||''),sourceItemCategory:e.sourceItemCategory||'',sourceItemName:e.sourceItemName||'',position:e.sourcePosition||'',positionMultiplierApplied:!!e.positionMultiplierApplied,positionMultiplier:e.positionMultiplier||0,positionMultiplierBaseValue:e.positionMultiplierBaseValue,rangeConditionGate:e.rangeConditionGate||undefined})).slice(0,200)};debugLog('formation:skill-summary',formationSkillDiag);debugLog('formation:parameter-calculation',parameterDiag);if(typeof deferTacticAttackDiagnosticSnapshot==='function')deferTacticAttackDiagnosticSnapshot('renderFormationScreenCore');const slotCards=FORMATION_SLOT_SPECS.map(s=>renderFormationSlotCard(s,f.slots?.[s.key]||createFormationSlot())).join('');const formationMasterControlsHtml=renderFormationSelectedMasterPreview(f);const extensionControlsHtml=renderFormationExtensionControlsHtml(f);const skillSummaryOpenAttr=formationSummaryOpenAttr('summary:skill',!isResponsiveMobileMode());const paramSummaryOpenAttr=formationSummaryOpenAttr('summary:param',!isResponsiveMobileMode()&&normalizeFormationInnerTab(state.formationInnerTab)==='parameter');const rosterSummaryHtml=renderFormationRosterCompactHtml(f);const formationSlotsHtml=`<details class="formation-mobile-summary-section formation-slots-details" open><summary><span>武将・装備詳細</span>${rosterSummaryHtml}</summary><div class="formation-mobile-summary-body"><div class="formation-slots">${slotCards}</div></div></details>`;const formationParamSummaryHtml=`<details class="formation-mobile-summary-section formation-param-section"${paramSummaryOpenAttr}><summary>状態変化率サマリー</summary><div class="formation-mobile-summary-body">${renderFormationParameterSummary(data)}</div></details>`;const formationExtensionParameterHtml=renderFormationSelectedExtensionParameterBlocks(f);const formationFiveElementSummaryHtml=renderFormationFiveElementSummary(f,data);const formationSkillSummaryHtml=`<details class="formation-mobile-summary-section formation-skill-section"${skillSummaryOpenAttr}><summary>合算技能</summary><div class="formation-mobile-summary-body"><div class="formation-section-header"><h3>合算技能</h3>${renderFormationSkillFilterSelect()}</div>${renderFormationSkillSummary(data)}</div></details>`;const innerTab=normalizeFormationInnerTab(state.formationInnerTab);const formationTabsHtml=renderFormationWorkTabsHtml(innerTab);const quickSummaryHtml=renderFormationQuickResultSummary(data,f);cacheFormationSummaryDialogHtml(data,f);const formationTacticAttackSummaryHtml=renderFormationTacticAttackSummary(f,data);const selectedEditorHtml=renderFormationSelectedSlotEditorHtml(f,data);const mobileSlotDialogHtml=renderFormationSlotDialogHtml(f);const mobileSummaryDialogHtml=renderFormationSummaryDialogHtml(data,f);const tacticSummaryDialogHtml=renderFormationTacticSummaryDialogHtml(f,data);const selectorDialogHtml=renderFormationSelectorDialogHtml(f);const formationWarhorseEditorHtml=`<section class="formation-selected-card formation-warhorse-editor-card no-detail-linkify">${renderFormationWarhorseSlotsHtml()}</section>`;const editPanelHiddenAttr=innerTab==='edit'?'':' hidden aria-hidden="true"';const tacticPanelHiddenAttr=innerTab==='tactic'?'':' hidden aria-hidden="true"';const parameterPanelHiddenAttr=innerTab==='parameter'?'':' hidden aria-hidden="true"';const detailPanelHiddenAttr=innerTab==='detail'?'':' hidden aria-hidden="true"';const editPanelHtml=`<section class="formation-work-tab-panel formation-edit-shell ${innerTab==='edit'?'':'tab-content-hidden'}" data-formation-work-panel="edit"${editPanelHiddenAttr}>${renderFormationComposeBarHtml(f,data)}<div class="formation-compose-main-grid">${renderFormationTeamBoardSelectableHtml(f)}<div class="formation-selected-stack">${selectedEditorHtml}${formationWarhorseEditorHtml}</div></div>${quickSummaryHtml}${mobileSlotDialogHtml}${mobileSummaryDialogHtml}${selectorDialogHtml}</section>`;const tacticPanelHtml=`<section class="formation-work-tab-panel formation-result-focus ${innerTab==='tactic'?'':'tab-content-hidden'}" data-formation-work-panel="tactic"${tacticPanelHiddenAttr}>${formationTacticAttackSummaryHtml}</section>`;const parameterPanelHtml=`<section class="formation-work-tab-panel formation-result-focus ${innerTab==='parameter'?'':'tab-content-hidden'}" data-formation-work-panel="parameter"${parameterPanelHiddenAttr}>${formationParamSummaryHtml}</section>`;const detailPanelHtml=`<section class="formation-work-tab-panel formation-detail-focus ${innerTab==='detail'?'':'tab-content-hidden'}" data-formation-work-panel="detail"${detailPanelHiddenAttr}><p class="formation-tab-intro">合算技能・陣形・兵器/武装を確認します。情報量が多いため、必要な区分だけ展開してください。</p>${formationFiveElementSummaryHtml}${formationSkillSummaryHtml}${formationExtensionParameterHtml}</section>`;debugLog('formationSkill:layout-pc-sidebar',{mode:'pc uses fixed left formation-list-panel; mobile unchanged',formationCount:(state.formations||[]).length,summaryCollapsedMobile:isResponsiveMobileMode(),innerTab});els.formationRoot.innerHTML=`${renderFormationMobileSelectHtml()}<div class="formation-layout"><aside class="formation-list-panel"><div class="row between"><h3>部隊一覧</h3><span class="note">${getVisibleFormations().length}/${FORMATION_MAX_PER_GROUP}件</span></div>${renderFormationGroupControlsHtml()}<div class="formation-list-actions"><button type="button" id="formationNewBtn" class="btn-select-all">新規作成</button><button type="button" id="formationDuplicateBtn">複製</button><button type="button" id="formationDeleteBtn" class="btn-clear-all">削除</button><button type="button" id="formationSaveBtn" class="btn-select-all">保存</button></div><div class="formation-list">${renderFormationListHtml()}</div></aside><section class="formation-detail-panel">${formationTabsHtml}${editPanelHtml}${tacticPanelHtml}${parameterPanelHtml}${detailPanelHtml}</section></div>`;restoreFormationDetailsOpenState(els.formationRoot);enforceFormationSummaryAccordion(els.formationRoot);setupFormationDetailsOpenStateEvents(els.formationRoot);requestAnimationFrame(()=>restorePinnedFormationSummaryState(els.formationRoot,'post-render-raf'));setTimeout(()=>restorePinnedFormationSummaryState(els.formationRoot,'post-render-timeout'),120);{const activePanel=els.formationRoot.querySelector(`[data-formation-work-panel="${innerTab}"]`)||els.formationRoot;try{linkifyDetailTextNodes(activePanel);if(activePanel!==els.formationRoot)activePanel.dataset.hadoLinkified='1';}catch(err){debugLog('formation:active-panel-linkify-error',{tab:innerTab,message:err?.message||String(err)});}}setupFormationEvents();setupFormationUpdate08Events();renderDebugPanel(state.selectedItem||null,'');}
function renderFormationScreen(){
  try{
    const result=renderFormationScreenCore();
    state._formationScreenRendered=true;
    state._formationScreenStale=false;
    return result;
  }catch(err){
    const message=err?.message||String(err);
    debugLog('formation:render-error',{message,stack:err?.stack||''});
    try{state.diagnostics.formation={timestamp:debugTimestamp(),ok:false,error:message};}catch{}
    if(els.formationRoot){
      els.formationRoot.innerHTML=`<div class="detail-empty">部隊編成の描画中にエラーが発生しました。Debug Logを確認してください。<br>${esc(message)}</div>`;
    }
    try{renderDebugPanel(state.selectedItem||null,'');}catch{}
  }
}
function setFormationMasterName(name){const f=getCurrentFormation();if(!f)return;const next=normalizeFormationMasterName(name);const prev=f.formationName||'基本';f.formationName=next||'基本';const repaired=repairFormationJijuAssignments(f,'setFormationMasterName');f.updatedAt=new Date().toISOString();state.formationDirty=true;saveFormationDataToStorage('setFormationMasterName');debugLog('formation:master-select',{formationId:f.id,previous:prev,current:f.formationName,jijuRepaired:repaired});renderFormationScreen();}
function setFormationDeploymentType(value){const f=getCurrentFormation();if(!f)return;const next=normalizeFormationDeploymentType(value);const prev=f.deploymentType||'normal';f.deploymentType=next;f.updatedAt=new Date().toISOString();state.formationDirty=true;debugLog('formation:deployment-type-select',{formationId:f.id,previous:prev,current:f.deploymentType,label:formationDeploymentTypeLabel(next)});renderFormationScreen();}
function setupFormationEvents(){if(!els.formationRoot)return;els.formationRoot.removeEventListener('click',handleDetailEntityLinkClick);els.formationRoot.addEventListener('click',handleDetailEntityLinkClick);els.formationRoot.querySelectorAll('[data-copy-formation-tactic-attack]').forEach(btn=>btn.addEventListener('click',copyFormationTacticAttackSummary));els.formationRoot.querySelectorAll('[data-formation-inner-tab]').forEach(btn=>btn.addEventListener('click',()=>setFormationInnerTab(btn.dataset.formationInnerTab||'edit')));els.formationRoot.querySelectorAll('[data-formation-result-tab]').forEach(btn=>btn.addEventListener('click',()=>setFormationResultTab(btn.dataset.formationResultTab||'tactic')));els.formationRoot.querySelectorAll('[data-formation-slot-select]').forEach(btn=>btn.addEventListener('click',()=>setFormationSelectedSlot(btn.dataset.formationSlotSelect||'main')));els.formationRoot.querySelectorAll('[data-formation-selector-open]').forEach(btn=>btn.addEventListener('click',()=>openFormationSelectorDialog(btn.dataset.formationSelectorOpen||'general',btn.dataset.slotKey||state.formationSelectedSlot,btn.dataset.equipKey||'',btn.dataset.jijuPosition||'')));els.formationRoot.querySelectorAll('[data-formation-selector-close]').forEach(btn=>btn.addEventListener('click',closeFormationSelectorDialog));els.formationRoot.querySelectorAll('[data-formation-selector-backdrop]').forEach(ov=>ov.addEventListener('click',e=>{if(e.target===ov)closeFormationSelectorDialog();}));els.formationRoot.querySelectorAll('[data-formation-selector-pick]').forEach(bindFormationSelectorPickButton);els.formationRoot.querySelectorAll('input[data-formation-selector-filter]').forEach(input=>{input.addEventListener('input',e=>{if(!state.formationSelectorDialog)return;state.formationSelectorDialog[e.currentTarget.dataset.formationSelectorFilter]=e.currentTarget.value;refreshFormationSelectorDialogResults();});input.addEventListener('change',e=>{if(!state.formationSelectorDialog)return;state.formationSelectorDialog[e.currentTarget.dataset.formationSelectorFilter]=e.currentTarget.value;refreshFormationSelectorDialogResults();});input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(!state.formationSelectorDialog)return;state.formationSelectorDialog[e.currentTarget.dataset.formationSelectorFilter]=e.currentTarget.value;refreshFormationSelectorDialogResults();}});});els.formationRoot.querySelectorAll('select[data-formation-selector-filter]').forEach(input=>input.addEventListener('change',e=>{if(!state.formationSelectorDialog)return;const key=e.currentTarget.dataset.formationSelectorFilter;state.formationSelectorDialog[key]=e.currentTarget.value;if(key==='statusGroup'){state.formationSelectorDialog.statusEffect='';refreshFormationSelectorStatusEffectControl();}refreshFormationSelectorDialogResults();}));els.formationRoot.querySelectorAll('[data-formation-slot-dialog-close]').forEach(btn=>btn.addEventListener('click',()=>{state.formationSlotDialogOpen=false;renderFormationScreen();}));els.formationRoot.querySelectorAll('[data-formation-summary-open]').forEach(btn=>{const open=()=>openFormationSummaryDialogFast();btn.addEventListener('click',open);btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});els.formationRoot.querySelectorAll('[data-formation-summary-close]').forEach(btn=>btn.addEventListener('click',closeFormationSummaryDialogFast));els.formationRoot.querySelectorAll('[data-formation-tactic-summary-open]').forEach(btn=>{const open=()=>{state.formationTacticSummaryDialogOpen=true;renderFormationScreen();};btn.addEventListener('click',open);btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});els.formationRoot.querySelectorAll('[data-formation-tactic-summary-close]').forEach(btn=>btn.addEventListener('click',()=>{state.formationTacticSummaryDialogOpen=false;renderFormationScreen();}));els.formationRoot.querySelectorAll('[data-formation-dialog-backdrop]').forEach(ov=>ov.addEventListener('click',e=>{if(e.target===ov){if((ov.dataset.formationDialogBackdrop||'')==='summary'){closeFormationSummaryDialogFast();return;}state.formationSlotDialogOpen=false;state.formationSummaryDialogOpen=false;state.formationTacticSummaryDialogOpen=false;renderFormationScreen();}}));els.formationRoot.querySelectorAll('.formation-calc-toggle').forEach(btn=>{btn.addEventListener('click',()=>{state.formationCalcVisibleMobile=!state.formationCalcVisibleMobile;debugLog('formation:calc-toggle',{visible:state.formationCalcVisibleMobile});renderFormationScreen();});});els.formationRoot.querySelectorAll('[data-formation-select]').forEach(btn=>btn.addEventListener('click',()=>{state.currentFormationId=btn.dataset.formationSelect;saveFormationDataToStorage('selectFormation');renderFormationScreen();}));const sel=document.getElementById('formationMobileSelect');if(sel)sel.addEventListener('change',e=>{state.currentFormationId=e.target.value;saveFormationDataToStorage('selectFormationMobile');renderFormationScreen();});const n=document.getElementById('formationNewBtn');if(n)n.addEventListener('click',createNewFormation);const d=document.getElementById('formationDuplicateBtn');if(d)d.addEventListener('click',duplicateCurrentFormation);const del=document.getElementById('formationDeleteBtn');if(del)del.addEventListener('click',deleteCurrentFormation);
const mn=document.getElementById('formationMobileNewBtn');if(mn)mn.addEventListener('click',createNewFormation);
const md=document.getElementById('formationMobileDuplicateBtn');if(md)md.addEventListener('click',duplicateCurrentFormation);
const mdel=document.getElementById('formationMobileDeleteBtn');if(mdel)mdel.addEventListener('click',deleteCurrentFormation);
const msave=document.getElementById('formationMobileSaveBtn');if(msave)msave.addEventListener('click',persistFormationData);
const save=document.getElementById('formationSaveBtn');if(save)save.addEventListener('click',persistFormationData);const name=document.getElementById('formationNameInput');if(name)name.addEventListener('change',e=>setFormationName(e.target.value));const formationMasterSelect=document.getElementById('formationMasterSelect');if(formationMasterSelect)formationMasterSelect.addEventListener('change',e=>setFormationMasterName(e.target.value));const deploymentTypeSelect=document.getElementById('formationDeploymentTypeSelect');if(deploymentTypeSelect)deploymentTypeSelect.addEventListener('change',e=>setFormationDeploymentType(e.target.value));const siegeSelect=document.getElementById('formationSiegeWeaponSelect');if(siegeSelect)siegeSelect.addEventListener('change',e=>setFormationExtensionName('siegeWeapon',e.target.value));const siegeLevel=document.getElementById('formationSiegeWeaponLevelSelect');if(siegeLevel)siegeLevel.addEventListener('change',e=>setFormationExtensionLevel('siegeWeapon',e.target.value));const armSelect=document.getElementById('formationEthnicArmamentSelect');if(armSelect)armSelect.addEventListener('change',e=>setFormationExtensionName('ethnicArmament',e.target.value));const armLevel=document.getElementById('formationEthnicArmamentLevelSelect');if(armLevel)armLevel.addEventListener('change',e=>setFormationExtensionLevel('ethnicArmament',e.target.value));const ethnicGeneral=document.getElementById('formationEthnicGeneralSelect');if(ethnicGeneral)ethnicGeneral.addEventListener('change',e=>setFormationEthnicGeneralName(e.target.value));els.formationRoot.querySelectorAll('.formation-inherited-skill-select').forEach(select=>{select.addEventListener('change',e=>{setCurrentInheritedSkill(e.currentTarget.dataset.generalName,e.currentTarget.value,'formation');});});const skillFilter=document.getElementById('formationSkillFilterSelect');if(skillFilter)skillFilter.addEventListener('change',e=>{rememberFormationDetailsOpenState(els.formationRoot);state.formationSkillFilter=normalizeFormationSkillFilter(e.target.value);if(isResponsiveMobileMode()){state.formationDetailsOpen=state.formationDetailsOpen||{};state.formationDetailsOpen['summary:skill']=true;state.formationDetailsOpen['summary:param']=false;}debugLog('formationSkill:filter',{filter:state.formationSkillFilter,detailsOpen:state.formationDetailsOpen});renderFormationScreen();});els.formationRoot.querySelectorAll('[data-formation-warhorse-slot]').forEach(sel=>sel.addEventListener('change',e=>setFormationWarhorseSlot(e.currentTarget.dataset.formationWarhorseSlot,e.currentTarget.value)));els.formationRoot.querySelectorAll('[data-formation-warhorse-edit]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();openFormationWarhorseEditFromSlot(btn.dataset.formationWarhorseEdit||'');}));els.formationRoot.querySelectorAll('[data-formation-warhorse-remove]').forEach(btn=>btn.addEventListener('click',()=>setFormationWarhorseSlot(btn.dataset.formationWarhorseRemove,'')));els.formationRoot.querySelectorAll('[data-formation-remove]').forEach(btn=>btn.addEventListener('click',()=>removeFormationValue(btn.dataset.slotKey,btn.dataset.formationRemove,btn.dataset.equipKey||'')));}

function setupFormationUpdate08Events(){
  const groupSelect=document.getElementById('formationGroupSelect');
  if(groupSelect)groupSelect.addEventListener('change',e=>selectFormationGroup(e.target.value));
  const groupName=document.getElementById('formationGroupNameInput');
  if(groupName)groupName.addEventListener('change',e=>setFormationGroupName(e.target.value));
  const groupAdd=document.getElementById('formationGroupAddBtn');
  if(groupAdd)groupAdd.addEventListener('click',addFormationGroup);
  ['formationMemoInput','formationTotalScoreInput','formationEvaluationScoreInput'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.addEventListener('change',updateFormationEvaluationFields);
  });
  const evalSave=document.getElementById('formationEvaluationSaveBtn');
  if(evalSave)evalSave.addEventListener('click',saveFormationEvaluationSnapshot);
}
function showFormationToast(message,withOpen=false){const old=document.querySelector('.formation-toast');if(old)old.remove();const div=document.createElement('div');div.className='formation-toast';div.innerHTML=`<span>${esc(message)}</span>${withOpen?'<button type="button" data-open-formation-toast>編成を開く</button>':''}`;document.body.appendChild(div);const btn=div.querySelector('[data-open-formation-toast]');if(btn)btn.addEventListener('click',()=>{div.remove();setMainTab('formation');});setTimeout(()=>{if(div.parentNode)div.remove();},4200);}
function renderFormationAddButtonHtml(item){const cat=detailCategory(item);if(!(cat==='generals'||cat==='equipments'))return '';return `<span class="formation-add-anchor"><button type="button" id="formationAddButton" class="copy-btn formation-add-btn">部隊編成に追加</button></span>`;}
function ensureFormationAddPopoverElement(){let pop=document.getElementById('formationAddPopover');if(!pop){pop=document.createElement('div');pop.id='formationAddPopover';pop.className='formation-add-popover';pop.hidden=true;document.body.appendChild(pop);return pop;}if(pop.parentElement!==document.body)document.body.appendChild(pop);return pop;}
function renderFormationQuickAddGrid(item,destinations,selectedKey){
  const category=detailCategory(item);const f=ensureCurrentFormation();const master=getSelectedFormationMaster(f);const matrix=getFormationMasterLayoutMatrix(master);const byKey=new Map(destinations.map(d=>[formationDestinationKey(d),d]));const bySlot={};destinations.forEach(d=>{if(!bySlot[d.slotKey])bySlot[d.slotKey]=[];bySlot[d.slotKey].push(d);});
  const candidateName=normalizeSaveItemName(getItemDisplayName(item));const candidateExistingSlotKey=category==='generals'?findFormationGeneralSlotKey(f,candidateName):'';
  const attendantByCoord={};destinations.filter(d=>d.kind==='attendant').forEach(d=>{const key=coordKey(Number(d.row),Number(d.col));if(!attendantByCoord[key])attendantByCoord[key]=[];attendantByCoord[key].push(d);});
  const cells=[];
  for(let r=0;r<3;r++)for(let c=0;c<3;c++){
    const baseRaw=matrix?.[r]?.[c]||'';const appSlot=FORMATION_MASTER_SLOT_MAP[baseRaw]||'';const coord=coordKey(r,c);const attendantDests=attendantByCoord[coord]||[];
    if(appSlot){
      const slot=f?.slots?.[appSlot]||{};const slotLabel=formationSlotLabel(appSlot);const current=slot.general?formationDisplayName('generals',slot.general):'';
      if(category==='generals'){
        const d=(bySlot[appSlot]||[]).find(x=>x.kind==='general');const key=d?formationDestinationKey(d):'';const selected=key&&key===selectedKey;const isReplace=!!current&&normalizeSaveItemName(current)!==candidateName;const movingExisting=candidateExistingSlotKey&&candidateExistingSlotKey!==appSlot;
        const actionText=current?(isReplace?`${slotLabel}を変更`:`${slotLabel}を再選択`):`${slotLabel}に配置`;
        const warning=isReplace&&!candidateExistingSlotKey?'<div class="formation-quick-replace-warning">部隊外武将で置き換える場合、現在の武将に紐づく侍従・装備は外れます</div>':(movingExisting?`<div class="formation-quick-replace-warning">${esc(formationSlotLabel(candidateExistingSlotKey))}から移動します</div>`:'');
        cells.push(`<div class="formation-quick-cell ${formationMasterCellClass(FORMATION_APP_SLOT_TO_MASTER[appSlot]||'')} ${isReplace?'is-replace-target':''} ${selected?'is-selected':''}"><div class="formation-quick-cell-role">${esc(slotLabel)}</div><div class="formation-quick-cell-current">${esc(current||'未配置')}</div>${warning}${d?`<button type="button" class="${selected?'is-selected':''}" data-formation-destination="${esc(key)}"><span class="formation-quick-action-label">${esc(actionText)}</span></button>`:''}</div>`);
      }else{
        const eqDests=(bySlot[appSlot]||[]).filter(x=>x.kind==='equipment');
        cells.push(`<div class="formation-quick-cell ${formationMasterCellClass(FORMATION_APP_SLOT_TO_MASTER[appSlot]||'')}"><div class="formation-quick-cell-role">${esc(slotLabel)}</div><div class="formation-quick-cell-current">${esc(current||'武将未配置')}</div>${eqDests.map(d=>{const key=formationDestinationKey(d);const selected=key===selectedKey;return `<button type="button" class="formation-quick-equip-btn is-equipment ${selected?'is-selected':''}" data-formation-destination="${esc(key)}">${esc(slotLabel)}の${esc(equipmentSlotLabel(d.equipKey))}</button>`;}).join('')||'<div class="formation-quick-cell-note">装備枠なし</div>'}</div>`);
      }
    }else if(category==='generals'&&attendantDests.length){
      cells.push(`<div class="formation-quick-cell is-attendant-cell">${attendantDests.map(d=>{const key=formationDestinationKey(d);const selected=key===selectedKey;return `<button type="button" class="is-attendant ${selected?'is-selected':''}" data-formation-destination="${esc(key)}"><span class="formation-quick-cell-role">侍従</span><br><span class="formation-quick-action-label">${esc(formationSlotLabel(d.slotKey))}の侍従に配置</span><br><span class="formation-quick-cell-note">位置：${esc(d.jijuPosition||'')}</span></button>`;}).join('')}</div>`);
    }else{
      cells.push('<div class="formation-quick-cell is-empty"><span class="formation-quick-cell-note">配置不可</span></div>');
    }
  }
  return `<div class="formation-quick-grid-wrap"><div class="formation-quick-grid" aria-label="部隊編成3x3追加先選択">${cells.join('')}</div></div>`;
}
function renderFormationAddPopover(item){const pop=ensureFormationAddPopoverElement();if(!pop||!item)return;const f=ensureCurrentFormation();const itemName=getItemDisplayName(item);const destinations=getFormationDestinationsForItem(item);const selected=state.quickAddDestination&&destinations.some(d=>formationDestinationKey(d)===state.quickAddDestination)?state.quickAddDestination:(destinations[0]?formationDestinationKey(destinations[0]):'');state.quickAddDestination=selected;const quickGrid=renderFormationQuickAddGrid(item,destinations,selected);const emptyNote=destinations.length?'':'<div class="formation-empty">追加可能な配置先がありません。</div>';pop.innerHTML=`<div class="row between"><strong>部隊編成に追加・変更</strong><button type="button" class="copy-btn" id="formationAddCloseBtn">×</button></div><label><span class="note">対象の部隊編成</span><select id="formationQuickTargetSelect" class="formation-select">${(state.formations||[]).map(row=>`<option value="${esc(row.id)}" ${row.id===state.currentFormationId?'selected':''}>${esc(row.name)}</option>`).join('')}</select></label>${emptyNote||quickGrid}<div class="formation-popover-footer"><button type="button" id="formationAddCancelBtn" class="copy-btn">キャンセル</button><button type="button" id="formationAddStayBtn" class="btn-select-all" ${selected?'':'disabled'}>追加・変更</button><button type="button" id="formationAddOpenBtn" class="toggle-active" ${selected?'':'disabled'}>追加・変更して部隊編成を開く</button></div>`;pop.hidden=false;const close=document.getElementById('formationAddCloseBtn');if(close)close.addEventListener('click',()=>{pop.hidden=true;});const cancel=document.getElementById('formationAddCancelBtn');if(cancel)cancel.addEventListener('click',()=>{pop.hidden=true;});const target=document.getElementById('formationQuickTargetSelect');if(target)target.addEventListener('change',e=>{state.currentFormationId=e.target.value;state.quickAddDestination='';renderFormationAddPopover(item);});pop.querySelectorAll('[data-formation-destination]').forEach(btn=>btn.addEventListener('click',()=>{state.quickAddDestination=btn.dataset.formationDestination;renderFormationAddPopover(item);}));const stay=document.getElementById('formationAddStayBtn');if(stay)stay.addEventListener('click',()=>applyFormationQuickAdd(item,false));const open=document.getElementById('formationAddOpenBtn');if(open)open.addEventListener('click',()=>applyFormationQuickAdd(item,true));}
function formationDestinationKey(d){return [d.slotKey,d.kind,d.equipKey||'',d.jijuPosition||d.position||''].join(':');}
function parseFormationDestinationKey(key){const [slotKey,kind,equipKey,position]=String(key||'').split(':');return {slotKey,kind,equipKey,position,jijuPosition:position};}
function getFormationDestinationCurrentName(d){const f=getCurrentFormation();const slot=f?.slots?.[d?.slotKey];if(!slot)return '';if(d.kind==='general')return formationDisplayName('generals',slot.general||'');if(d.kind==='attendant')return formationDisplayName('generals',slot.attendant||'');if(d.kind==='equipment')return formationDisplayName('equipments',slot?.equipments?.[d.equipKey]||'');return '';}
function formatFormationDestinationLabel(d){const current=getFormationDestinationCurrentName(d);return current?`${d.label}（${current}）`:d.label;}
function applyFormationQuickAdd(item,openFormation){if(!isFormationCandidateAllowed(item)){window.alert('保存データモードでは、お気に入り登録済みの武将・装備のみ追加できます。');return;}const d=parseFormationDestinationKey(state.quickAddDestination);const ok=assignFormationItem(item,d);if(!ok){window.alert('追加先を選択してください。');return;}const pop=document.getElementById('formationAddPopover');if(pop)pop.hidden=true;showFormationToast(`${getItemDisplayName(item)} を部隊編成に追加・変更しました`,!openFormation);if(openFormation)setMainTab('formation');}
function setupFormationAddButton(item){const btn=document.getElementById('formationAddButton');if(!btn)return;btn.addEventListener('click',e=>{e.stopPropagation();renderFormationAddPopover(item);});if(!window.__formationAddOutsideCloseBound){window.__formationAddOutsideCloseBound=true;document.addEventListener('click',e=>{const pop=document.getElementById('formationAddPopover');const anchor=document.querySelector('.formation-add-anchor');if(pop&&!pop.hidden&&!pop.contains(e.target)&&(!anchor||!anchor.contains(e.target)))pop.hidden=true;});document.addEventListener('keydown',e=>{if(e.key==='Escape'){const pop=document.getElementById('formationAddPopover');if(pop&&!pop.hidden)pop.hidden=true;}});}}


function normalizeFormationMasterSlotLabel(slot){const s=norm(slot||'');const map={main:'主',vice_1:'副1',vice_2:'副2',support_1:'補1',support_2:'補2'};return map[s]||'';}
function formationMasterCellClass(slot){const s=norm(slot||'');if(!s)return 'is-empty';if(s==='main')return 'is-main';if(s==='vice_1'||s==='vice_2')return 'is-vice';if(s==='support_1'||s==='support_2')return 'is-support';return '';} 
function renderFormationMasterGrid(item){const layout=item?.raw?.layout||item?.layout||{};const matrix=Array.isArray(layout.matrix)?layout.matrix:[];const rows=[];for(let r=0;r<3;r++){for(let c=0;c<3;c++){const slot=matrix?.[r]?.[c]||'';const label=normalizeFormationMasterSlotLabel(slot);rows.push(`<div class="formation-master-cell ${formationMasterCellClass(slot)}" title="${esc(slot||'空き')}">${esc(label)}</div>`);}}return `<div class="formation-master-layout-row"><div class="formation-master-grid" aria-label="陣形3×3配置">${rows.join('')}</div><span class="meta">3×3配置</span></div>`;}
function renderFormationMasterSkills(item){const skills=Array.isArray(item?.raw?.skills)?item.raw.skills:(Array.isArray(item?.skills)?item.skills:[]);if(!skills.length)return '<span class="meta">技能なし</span>';return `<div class="formation-master-skill-list">${skills.map(skill=>`<div class="formation-master-skill"><div class="formation-master-skill-name">${esc(skill?.name||'-')}</div><div>${fmtContent(Array.isArray(skill?.content)?skill.content:[skill?.content||''])}</div></div>`).join('')}</div>`;}
function renderFormationMasterDetail(item){const raw=item?.raw||item||{};const basicRows=[['カテゴリ','陣形'],['改陣形',raw.is_modified?'はい':'いいえ'],['元陣形',raw.base_formation||'-'],['能力影響',raw.ability_impact_text||Object.entries(raw.ability_impact||{}).map(([k,v])=>`${k}:${v}`).join(' / ')||'-'],['ステータス補正',raw.status_correction||'-'],['解放条件',raw.unlock_condition||'-']];return `<div class="general-detail-stack"><div class="general-card"><div class="general-card-header">陣形配置</div><div class="general-card-body">${renderFormationMasterGrid(item)}</div></div><div class="general-card"><div class="general-card-header">基本情報</div><div class="general-card-body">${renderEquipmentKeyValueRows(basicRows)}</div></div><div class="general-card"><div class="general-card-header">陣形技能</div><div class="general-card-body">${renderFormationMasterSkills(item)}</div></div></div>`;}
function renderWarhorseMasterDetail(item){
  const isFamous=getWarhorseMasterKind(item)==='famous';
  const fixedSkill=norm(item?.fixedSkillName||item?.fixedSkillId||'');
  const basicRows=[['カテゴリ',isFamous?'名馬':'通常馬'],['名前',item?.name||'-']];
  if(isFamous){basicRows.push(['固有軍馬技能',fixedSkill||'-']);basicRows.push(['将星',item?.starEnabled?'あり':'なし']);}
  const stats=(item?.stats&&typeof item.stats==='object')?item.stats:((item?.baseStats&&typeof item.baseStats==='object')?item.baseStats:{});
  const statRows=Object.entries(stats).map(([k,v])=>[k,formatDetailValueForDisplay(v)]).filter(row=>row[1]&&row[1]!=='-');
  const starLevelRows=[];
  const levelMap=item?.starFixedSkillLevels&&typeof item.starFixedSkillLevels==='object'?item.starFixedSkillLevels:{};
  Object.keys(levelMap).sort((a,b)=>Number(a)-Number(b)).forEach(star=>starLevelRows.push([`将星${star}`,`固有技能Lv${formatDetailValueForDisplay(levelMap[star])}`]));
  const starEffects=item?.starEffects&&typeof item.starEffects==='object'?item.starEffects:{};
  const starEffectRows=buildWarhorseStarEffectRows(starEffects);
  const html=`<div class="general-detail-stack"><div class="general-card"><div class="general-card-header">基本情報</div><div class="general-card-body">${renderEquipmentKeyValueRows(basicRows)}</div></div>${statRows.length?`<div class="general-card"><div class="general-card-header">軍馬能力</div><div class="general-card-body">${renderEquipmentKeyValueRows(statRows)}</div></div>`:''}${starLevelRows.length?`<div class="general-card"><div class="general-card-header">将星別 固有軍馬技能Lv</div><div class="general-card-body">${renderEquipmentKeyValueRows(starLevelRows)}</div></div>`:''}${starEffectRows.length?`<div class="general-card"><div class="general-card-header">将星効果</div><div class="general-card-body">${renderEquipmentKeyValueRows(starEffectRows)}</div></div>`:''}</div>`;
  if(/\[object Object\]/.test(html))debugLog('warhorseDetail:object-display-warning',{name:getItemDisplayName(item),stats,starEffects});
  return html;
}
function renderWarhorseSkillDetail(item){
  const isFamous=norm(item?.skillKind)==='famous';
  const basicRows=[['カテゴリ','軍馬技能'],['種別',isFamous?'名馬固有技能':'通常軍馬技能'],['兵科',item?.targetTroopType||'-'],['名馬',item?.famousHorse||'-'],['設定最大Lv',item?.maxSetLevel?`Lv${item.maxSetLevel}`:'-'],['効果最大Lv',item?.maxEffectiveLevel?`Lv${item.maxEffectiveLevel}`:'-'],['合算方式',item?.levelCombine||'-']];
  const regions=(Array.isArray(item?.acquisitionRegions)?item.acquisitionRegions:[]).map(x=>typeof x==='object'?norm(x.region||x.name||JSON.stringify(x)):norm(x)).filter(Boolean);
  if(regions.length)basicRows.push(['入手地域',regions.join(' / ')]);
  const effects=item?.effectsByLevel&&typeof item.effectsByLevel==='object'?item.effectsByLevel:{};
  const effectRows=Object.keys(effects).sort((a,b)=>Number(a)-Number(b)).map(lv=>[`Lv${lv}`,norm(effects[lv])||'-']);
  return `<div class="general-detail-stack"><div class="general-card"><div class="general-card-header">基本情報</div><div class="general-card-body">${renderEquipmentKeyValueRows(basicRows)}</div></div>${effectRows.length?`<div class="general-card"><div class="general-card-header">レベル別効果</div><div class="general-card-body">${renderEquipmentKeyValueRows(effectRows)}</div></div>`:''}</div>`;
}
function renderDetail(){
  const profile={context:'renderDetail',timestamp:new Date().toLocaleTimeString('ja-JP',{hour12:false}),version:HADO_BUILD_INFO.version,phases:{}};
  const t0=performance.now();let t=t0;
  const mark=(name,extra={})=>{const now=performance.now();profile.phases[name]={ms:Number((now-t).toFixed(1)),totalMs:Number((now-t0).toFixed(1)),...extra};t=now;};
  reconcileSelectedItemFromResultSelect('renderDetail:start');
  mark('reconcileSelectedItem');
  const item=state.selectedItem;const type=state.selectedLabel;const q=currentKeyword();
  if(!item){const detailEl=getFreshDetailElement();if(detailEl)detailEl.innerHTML='<div class="detail-empty">検索結果の一覧から項目を選択してください。</div>';profile.empty=true;profile.totalMs=Number((performance.now()-t0).toFixed(1));if(!state.diagnostics)state.diagnostics={};state.diagnostics.detailProfile=profile;debugLog('detailProfile',profile);renderDebugPanel(null,'');return;}
  const name=item.name||item.title||'(名称不明)';const categoryKey=detailCategory(item);profile.categoryKey=categoryKey;profile.name=name;profile.label=type;profile.activeTab=state.detailActiveTab;const effectConditionIndexEntry=getDerivedEffectConditionBlockEntry(item);if(effectConditionIndexEntry)profile.effectConditionBlocks={source:'effect-condition-blocks-index',blockCount:Number(effectConditionIndexEntry.blockCount||((effectConditionIndexEntry.blocks||[]).length)||0)};
  const sourceGeneral=norm(item?.raw?.sourceGeneral||item?.sourceGeneral||'');const url=item.url||'';
  mark('identityResolve');
  const sectionsHtml=renderSectionsHtml(item.sections);
  mark('renderSectionsHtml',{htmlLength:String(sectionsHtml||'').length,sectionCount:Array.isArray(item?.sections)?item.sections.length:0});
  if(!state.diagnostics)state.diagnostics={};
  state.diagnostics.detailTabBuildProfile={};
  const tabbedHtml=(isGeneralItem(item)||isEquipmentItem(item)||categoryKey==='skills')?renderTabbedDetailContent(item,categoryKey):'';
  mark('renderTabbedDetailContent',{htmlLength:String(tabbedHtml||'').length,activeTab:state.detailActiveTab});
  const tabProfileCandidate=state.diagnostics?.detailTabBuildProfile;
  if(tabbedHtml&&tabProfileCandidate&&tabProfileCandidate.category===categoryKey&&norm(tabProfileCandidate.item)===norm(name))profile.tabBuildProfile=safeCloneForDebug(tabProfileCandidate);
  const tabRelatedProfile=state.diagnostics?.relatedLinks?.profile;
  if(tabRelatedProfile&&tabRelatedProfile.category===categoryKey&&norm(tabRelatedProfile.item)===norm(name))profile.relatedLinksProfile=safeCloneForDebug(tabRelatedProfile);
  const eqHtml=!tabbedHtml&&isEquipmentItem(item)?renderEquipmentDetail(item):'';
  const generalHtml=!tabbedHtml&&isGeneralItem(item)?renderGeneralDetail(item):'';
  const skillHtml=!tabbedHtml&&categoryKey==='skills'?renderSkillDetail(item):'';
  const tacticHtml=categoryKey==='tactics'?renderTacticDetail(item):'';
  const hadouExtensionHtml=isHadouExtensionEquipmentItem(item)?buildHadouExtensionDetailHtml(item,categoryKey):'';
  const statusEffectHtml=categoryKey==='statusEffects'?`<div class="general-detail-stack"><div class="general-card"><div class="general-card-header">状態変化</div><div class="general-card-body">${renderEquipmentKeyValueRows([[`種類`,item?.effectType||'']])}${sectionsHtml}</div></div></div>`:'';
  const formationMasterHtml=categoryKey==='formations'?renderFormationMasterDetail(item):'';
  const warhorseHtml=categoryKey==='warhorses'?renderWarhorseMasterDetail(item):'';
  const warhorseSkillHtml=categoryKey==='warhorseSkills'?renderWarhorseSkillDetail(item):'';
  mark('renderCategorySpecificHtml',{eqLength:String(eqHtml||'').length,generalLength:String(generalHtml||'').length,skillLength:String(skillHtml||'').length,tacticLength:String(tacticHtml||'').length,hadouExtensionLength:String(hadouExtensionHtml||'').length,statusEffectLength:String(statusEffectHtml||'').length,formationLength:String(formationMasterHtml||'').length,warhorseLength:String(warhorseHtml||'').length,warhorseSkillLength:String(warhorseSkillHtml||'').length});
  const detailDebugText=[isGeneralItem(item)?buildEmbeddedSkillDebugInfo(item):(categoryKey==='statusEffects'?`effectType=${norm(item?.effectType||'')}`:''),isGeneralItem(item)?`[advisor-skill-diagnostic] ${JSON.stringify(buildAdvisorLevelDiagnosticForGeneral(item),null,2)}`:'',categoryKey==='skills'?`[skill-detail] name=${getItemDisplayName(item)} sections=${Array.isArray(item?.sections)?item.sections.length:0} rawSections=${Array.isArray(item?.raw?.sections)?item.raw.sections.length:0} tables=${Array.isArray(item?.tables)?item.tables.length:0}`:'',categoryKey==='tactics'?buildTacticDetailDebugText():'',state.diagnostics?.parameterSummary?.debugText||'',state.diagnostics?.detailTabs?`[detail-tab-cards] ${JSON.stringify(state.diagnostics.detailTabs,null,2)}`:''].filter(Boolean).join('\n\n');
  mark('buildDetailDebugText',{textLength:String(detailDebugText||'').length});
  const saveButton=(categoryKey==='generals'||categoryKey==='equipments')?`<button type="button" class="save-star ${isSavedName(categoryKey,name)?'is-saved':''}" id="detailSaveToggleBtn" aria-label="保存切替">${isSavedName(categoryKey,name)?'★':'☆'}</button>`:'';
  const formationAddButton=renderFormationAddButtonHtml(item);
  const bodyHtml=tabbedHtml||generalHtml||eqHtml||skillHtml||tacticHtml||hadouExtensionHtml||statusEffectHtml||formationMasterHtml||warhorseHtml||warhorseSkillHtml||sectionsHtml;
  mark('resolveBodyAndButtons',{bodyLength:String(bodyHtml||'').length,formationButtonLength:String(formationAddButton||'').length});
  debugLog('renderDetail:body-resolve',{categoryKey,name,selectedLabel:type,bodyKind:tabbedHtml?'tabbed':generalHtml?'general':eqHtml?'equipment':skillHtml?'skill':tacticHtml?'tactic':hadouExtensionHtml?'hadouExtension':statusEffectHtml?'statusEffect':formationMasterHtml?'formation':warhorseHtml?'warhorse':warhorseSkillHtml?'warhorseSkill':sectionsHtml?'sections':'empty',bodyLength:String(bodyHtml||'').length,selectedTab:state.detailActiveTab});debugLog('renderDetail:phase',{phase:'before-tags',categoryKey,name});
  const detailTagsHtml=buildDetailTagsHtml(item);
  mark('buildDetailTagsHtml',{htmlLength:String(detailTagsHtml||'').length});
  debugLog('renderDetail:phase',{phase:'after-tags',categoryKey,name,tagsLength:String(detailTagsHtml||'').length});
  const relatedLinksHtml=categoryKey==='generals'?'':safeBuildRelatedLinksHtml(item,categoryKey,name);
  mark('safeBuildRelatedLinksHtml',{htmlLength:String(relatedLinksHtml||'').length,groupCount:state.diagnostics?.relatedLinks?.groupCount||0});
  if(state.diagnostics?.relatedLinks?.profile)profile.relatedLinksProfile=safeCloneForDebug(state.diagnostics.relatedLinks.profile);
  debugLog('renderDetail:phase',{phase:'after-related-links',categoryKey,name,relatedLinksLength:String(relatedLinksHtml||'').length});
  const html=`<div class="row between"><div style="display:grid;gap:8px"><div class="title-row"><div class="detail-title-main-row"><div class="section-title no-detail-linkify">${esc(type)} : ${esc(name)}</div>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="detail-source-link no-detail-linkify">GameWithを開く</a>`:''}</div>${saveButton}${formationAddButton}</div>${sourceGeneral&&categoryKey!=='skills'&&categoryKey!=='tactics'?`<div>武将名: ${esc(sourceGeneral)}</div>`:''}${detailTagsHtml}${relatedLinksHtml}</div><label class="row note detail-col-width-control" style="gap:6px"><span>1列目幅</span><input id="detailLabelWidthRange" type="range" min="20" max="45" value="${esc(state.detailLabelWidth)}" /><span id="detailLabelWidthValue">${esc(state.detailLabelWidth)}%</span></label></div>${bodyHtml?`<section>${bodyHtml}</section>`:''}`;
  mark('assembleHtml',{htmlLength:String(html||'').length});
  setDetailHtmlHard(html,categoryKey,name,type,'renderDetail');
  mark('setDetailHtmlHard',{childCount:els.detail?els.detail.childElementCount:0});
  debugRenderedDetailIdentity(item,categoryKey,name,type,'renderDetail:after-hard-set');if(categoryKey==='skills')debugSkillDetailDomState(item,'renderDetail:after-hard-set');
  mark('debugIdentityAndSkillDom');
  setupDetailTabButtons();mark('setupDetailTabButtons');
  markDetailTwoColumnTables();mark('markDetailTwoColumnTables');
  els.detail.querySelectorAll('.hadou-extension-level-select').forEach(select=>{select.addEventListener('change',e=>{setHadouExtensionSelectedLevel(item,e.target.value);debugLog('hadouExtensionDetail:level-change',{category:categoryKey,name:getItemDisplayName(item),level:e.target.value});renderDetail();});});const detailWidthRange=document.getElementById('detailLabelWidthRange');if(detailWidthRange)detailWidthRange.addEventListener('input',e=>{state.detailLabelWidth=Number(e.target.value)||25;applyDetailTableColumnWidth();});renderDebugPanel(item,detailDebugText);const btn=document.getElementById('detailSaveToggleBtn');if(btn)btn.addEventListener('click',()=>toggleSavedName(categoryKey,name));setupFormationAddButton(item);els.detail.querySelectorAll('.general-current-ability-input').forEach(input=>{input.addEventListener('change',e=>{setCurrentGeneralAbilityValue(e.target.dataset.generalName,e.target.dataset.abilityName,e.target.value);});});els.detail.querySelectorAll('.general-five-element-input').forEach(input=>{input.addEventListener('change',e=>{setCurrentGeneralFiveElementValue(e.target.dataset.generalName,e.target.dataset.elementName,e.target.value);});});els.detail.querySelectorAll('.general-advisor-level-select').forEach(select=>{select.addEventListener('change',e=>{setCurrentGeneralAdvisorLevel(e.target.dataset.generalName,e.target.value);renderDetailPreservingScroll('advisor-level-change');if(state.mainTab==='formation')renderFormationScreen();});});els.detail.querySelectorAll('.general-skill-level-select').forEach(select=>{select.addEventListener('change',e=>{setCurrentGeneralSkillLevel(e.target.dataset.generalName,e.target.dataset.skillName,e.target.value);});});els.detail.querySelectorAll('.ethnic-research-enabled-input').forEach(input=>{input.addEventListener('change',e=>{setCurrentEthnicResearchSkillSetting(e.target.dataset.skillName,{enabled:e.target.checked});});});els.detail.querySelectorAll('.ethnic-research-level-select').forEach(select=>{select.addEventListener('change',e=>{setCurrentEthnicResearchSkillSetting(e.target.dataset.skillName,{level:e.target.value});});});els.detail.querySelectorAll('.star-rating-btn').forEach(btn=>{btn.addEventListener('click',e=>{const category=e.currentTarget.dataset.starCategory;const itemName=e.currentTarget.dataset.itemName;const maxStars=Number(e.currentTarget.dataset.starMax)||0;const clickedValue=Number(e.currentTarget.dataset.starValue)||0;const currentValue=getCurrentStarValue(category,itemName,maxStars);const nextValue=currentValue===clickedValue?0:clickedValue;setCurrentStarValue(category,itemName,nextValue,maxStars);renderDetailPreservingScroll('star-change');});});els.detail.querySelectorAll('.inherited-skill-select').forEach(select=>{select.addEventListener('change',e=>{setCurrentInheritedSkill(e.currentTarget.dataset.generalName,e.currentTarget.value,'detail');});});els.detail.querySelectorAll('.equipment-stage-setting-input').forEach(input=>{input.addEventListener('change',e=>{if(e.currentTarget.checked){beginPreserveDetailScroll('equipment-stage-change');setCurrentEquipmentStageValue(e.currentTarget.dataset.equipmentName,e.currentTarget.value);finishPreserveDetailScroll('equipment-stage-change');}});});
  mark('attachDetailEventHandlers',{inputCount:els.detail?els.detail.querySelectorAll('input,select,button').length:0});
  if(!isHadouExtensionEquipmentItem(item))linkifyDetailTextNodes(els.detail);
  mark('linkifyDetailTextNodes');
  highlightDetailTextNodes(els.detail,q);
  mark('highlightDetailTextNodes',{keyword:norm(q)});
  els.detail.removeEventListener('click',handleDetailEntityLinkClick);els.detail.addEventListener('click',handleDetailEntityLinkClick);if(!state._preserveDetailScrollSnapshot)els.detail.scrollTop=0;syncResultSelectSelection();
  mark('syncSelectionAndScroll');
  applyResponsiveLayout('renderDetail:after-detail');applyMobileDetailOverflowGuard('renderDetail:after-layout');
  mark('responsiveLayoutAndOverflowGuard');
  profile.totalMs=Number((performance.now()-t0).toFixed(1));
  const slowProfile=recordSlowContentDetailBottleneck(profile);
  if(slowProfile)profile.slowContentDetailBottleneck=safeCloneForDebug(slowProfile);
  if(!state.diagnostics)state.diagnostics={};state.diagnostics.detailProfile=profile;debugLog('detailProfile',profile);
  setTimeout(()=>{const asyncStart=performance.now();applyMobileDetailOverflowGuard('renderDetail:after-layout:async');debugResponsiveSnapshot('renderDetail:after-layout:async');if(state.diagnostics?.detailProfile){state.diagnostics.detailProfile.asyncLayoutMs=Number((performance.now()-asyncStart).toFixed(1));state.diagnostics.detailProfile.asyncTimestamp=new Date().toLocaleTimeString('ja-JP',{hour12:false});}},0);
}
function updateCountStatus(){const current=getCurrentSave();const saveLabel=current?` / 現在セーブ:${esc(current.name)}`:'';els.countStatus.innerHTML=`表示件数: 武将${state.generals.length} / 戦法${state.tactics.length} / 技能${state.skills.length} / 装備${state.equipments.length} / 状態変化${state.statusEffects.length} / 兵器${state.siegeWeapons.length} / 武装${state.ethnicArmaments.length} / 専用技能${state.ethnicResearchSkills.length} / 陣形${state.formationMasters.length} / 軍馬${state.warhorses.length} / 軍馬技能${state.warhorseSkills.length}${saveLabel}`;if(typeof updateUxHomePanel==='function')updateUxHomePanel('updateCountStatus');if(typeof updateSaveManagerPanel==='function')updateSaveManagerPanel('updateCountStatus');if(typeof updateDataContextBar==='function')updateDataContextBar('updateCountStatus');debugStartup('dataset counts',{generals:state.generals.length,tactics:state.tactics.length,skills:state.skills.length,equipments:state.equipments.length,statusEffects:state.statusEffects.length,siegeWeapons:state.siegeWeapons.length,ethnicArmaments:state.ethnicArmaments.length,ethnicResearchSkills:state.ethnicResearchSkills.length,formations:state.formationMasters.length,warhorses:state.warhorses.length,warhorseSkills:state.warhorseSkills.length,viewMode:state.viewMode});}

const MOBILE_RESULT_SELECT_PAGE_SIZE=100;
function getMobileResultSelectLimit(){const n=Number(state.mobileResultSelectLimit||MOBILE_RESULT_SELECT_PAGE_SIZE);return Number.isFinite(n)&&n>0?n:MOBILE_RESULT_SELECT_PAGE_SIZE;}
function resetMobileResultSelectLimit(){state.mobileResultSelectLimit=MOBILE_RESULT_SELECT_PAGE_SIZE;}
function increaseMobileResultSelectLimit(){state.mobileResultSelectLimit=getMobileResultSelectLimit()+MOBILE_RESULT_SELECT_PAGE_SIZE;debugLog('mobileResultSelect:show-more',{limit:state.mobileResultSelectLimit,total:state.lastResultRows?.length||0});renderResultSelect(state.lastResultRows||[]);}
function scheduleSearchAndDetailRender(reason='search-input'){
  clearTimeout(state._searchDebounceTimer);
  const delay=isResponsiveMobileMode()?220:120;
  const keyword=els.searchInput?els.searchInput.value:'';
  state._searchDebounceTimer=setTimeout(()=>{
    state._searchDebounceTimer=0;
    debugLog('search:debounced-render',{reason,delay,keyword:norm(keyword)});
    resetMobileResultSelectLimit();
    renderSearchResults();
    renderDetail();
    pushOperationHistory(reason);
  },delay);
}
function cancelScheduledSearchRender(){if(state._searchDebounceTimer){clearTimeout(state._searchDebounceTimer);state._searchDebounceTimer=0;}}

function renderResultSelect(rows){
  if(!els.resultSelect)return;
  const list=Array.isArray(rows)?rows:[];
  const mobile=isResponsiveMobileMode();
  const limit=mobile?Math.min(getMobileResultSelectLimit(),list.length):list.length;
  const visible=list.slice(0,limit);
  els.resultSelect.innerHTML='';
  const empty=document.createElement('option');
  empty.value='';
  empty.textContent=list.length?`検索結果から選択（${visible.length}/${list.length}件）`:'検索結果なし';
  els.resultSelect.appendChild(empty);
  visible.forEach((row,idx)=>{const displayName=getResultCardOptionLabel(row);const metricLabel=row?.metric?` (${row.metric.display})`:'';const opt=document.createElement('option');opt.value=String(idx);opt.textContent=`${row.label} : ${displayName}${metricLabel}`;if(state.selectedItem===row.item)opt.selected=true;els.resultSelect.appendChild(opt);});
  if(mobile&&limit<list.length){const more=document.createElement('option');more.value='__more__';more.textContent=`さらに表示（次の${Math.min(MOBILE_RESULT_SELECT_PAGE_SIZE,list.length-limit)}件 / 全${list.length}件）`;els.resultSelect.appendChild(more);}
  if(list.length&&!state.selectedItem&&visible.length){els.resultSelect.value='0';}
  els.resultSelect.disabled=!list.length;
  let note=els.resultSelect.closest('.result-select-wrap')?.querySelector('.result-select-note');
  if(!note&&els.resultSelect.closest('.result-select-wrap')){note=document.createElement('div');note.className='result-select-note';els.resultSelect.closest('.result-select-wrap').appendChild(note);}
  if(note)note.textContent=(mobile&&list.length>limit)?`スマホ負荷軽減のため ${limit}/${list.length}件を表示中です。`:(mobile&&list.length>0?`${list.length}件を表示中です。`:'' );
  applyResponsiveLayout('renderResultSelect');
  syncMobileResultFavoriteButton('renderResultSelect');
}
function buildCategoryCacheStatsForProfile(categoryStats){
  const stats=state._searchCacheStats||makeSearchCacheStats();
  const out={};
  Object.keys(categoryStats||{}).forEach(k=>{
    out[k]={active:!!categoryStats[k].active,total:categoryStats[k].total||0,matched:categoryStats[k].matched||0,ms:categoryStats[k].ms||0,parameterSearchTextCache:safeCloneForDebug(stats.byCategory?.[k]?.parameterSearchText||{hit:0,miss:0,bypass:0}),metricSourceCache:safeCloneForDebug(stats.byCategory?.[k]?.metricSource||{hit:0,miss:0,bypass:0})};
  });
  return out;
}

const SEARCH_UX_PRESET_CATEGORIES=['generals','tactics','skills','equipments','statusEffects','formations'];
