/* HADO app 3.0.0.0 Update06: complete remaining candidate tray handoff and future-ready pipeline */
(()=>{'use strict';
const REQUEST='hado:formation-candidate-tray-snapshot-request';
const SNAPSHOT='hado:formation-candidate-tray-snapshot';
const READY='hado:formation-candidate-tray-update06-ready';
const ROLE_LABELS={formation:'陣形',siege_weapon:'兵器',warhorse:'名馬',warhorse_skill:'軍馬技能'};
const UPDATE06_ROLES=new Set(Object.keys(ROLE_LABELS));
const norm=v=>String(v??'').normalize('NFKC').trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const itemName=item=>norm(item?.name||item?.title||item?.displayName||item?.label||item?.id||'');
function currentFormation(){try{return typeof getCurrentFormation==='function'?getCurrentFormation():null}catch{return null}}
function masters(role){
  const map={
    formation:()=>Array.isArray(state?.formationMasters)?state.formationMasters:[],
    siege_weapon:()=>Array.isArray(state?.siegeWeapons)?state.siegeWeapons:[],
    warhorse:()=>Array.isArray(state?.warhorses)?state.warhorses:[],
    warhorse_skill:()=>Array.isArray(state?.warhorseSkills)?state.warhorseSkills:[]
  };
  try{return (map[role]?.()||[]).map(item=>({item,name:itemName(item)})).filter(row=>row.name)}catch{return[]}
}
function isSavedMode(){try{return state?.viewMode==='saved'}catch{return false}}
function ownedWarhorseRows(){
  try{
    const data=typeof getCurrentWarhorseData==='function'?getCurrentWarhorseData():null;
    return Object.values(data?.owned||{}).map(wh=>({
      item:wh,
      id:norm(wh?.id||''),
      masterId:norm(wh?.horseMasterId||''),
      name:norm(wh?.name||wh?.customName||wh?.id||''),
      label:typeof getWarhorseAssignmentOptionLabel==='function'?getWarhorseAssignmentOptionLabel(wh):norm(wh?.name||wh?.customName||wh?.id||'')
    })).filter(row=>row.id);
  }catch{return[]}
}
function ownedNames(role){
  if(!isSavedMode())return null;
  try{
    if(role==='warhorse'){
      const set=new Set();ownedWarhorseRows().forEach(row=>{set.add(row.id);set.add(row.masterId);set.add(row.name);set.add(row.label);});return set.size?set:null;
    }
    const save=typeof getCurrentSave==='function'?getCurrentSave():null;
    const map={formation:['formations','formationMasters'],siege_weapon:['siegeWeapons','siegeWeaponNames'],warhorse_skill:['warhorseSkills','warhorseSkillNames']};
    const set=new Set();
    (map[role]||[]).forEach(key=>{const value=save?.[key];if(Array.isArray(value))value.forEach(v=>set.add(norm(typeof v==='string'?v:(v?.name||v?.title||v?.id||''))));});
    return set.size?set:null;
  }catch{return null}
}
function filterOwned(role,rows){const owned=ownedNames(role);return owned?rows.filter(row=>owned.has(row.name)||owned.has(norm(row.item?.id||''))):rows}
function score(role,row){const text=norm(JSON.stringify(row.item||{}));const hints={formation:['陣形','配置','編制'],siege_weapon:['兵器','攻撃','対物','射程'],warhorse:['名馬','軍馬','機動'],warhorse_skill:['軍馬技能','技能','機動','攻撃']}[role]||[];return hints.reduce((n,h)=>n+(text.includes(h)?1:0),0)}
function getCandidates(role){const mode=isSavedMode()?'saved':'all';const rows=filterOwned(role,masters(role)).map(row=>({...row,roleId:role,mode,score:score(role,row)}));rows.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ja'));return rows}
function persistFormation(context){const f=currentFormation();if(!f)return false;f.updatedAt=new Date().toISOString();state.formationDirty=true;if(typeof saveFormationDataToStorage==='function')saveFormationDataToStorage(context);if(typeof renderFormationScreen==='function')renderFormationScreen();return true}
function setFormation(name){const f=currentFormation();if(!f)return false;if(typeof normalizeFormationMasterName==='function')name=normalizeFormationMasterName(name);const exists=(Array.isArray(state?.formationMasters)?state.formationMasters:[]).some(item=>itemName(item)===name);if(!exists)return alert('陣形候補が見つかりません。');f.formationName=name;if(typeof repairFormationJijuAssignments==='function')repairFormationJijuAssignments(f,'candidateTray:update06:formation');return persistFormation('candidateTray:update06:formation')}
function setSiegeWeapon(name){const f=currentFormation();if(!f)return false;const exists=(Array.isArray(state?.siegeWeapons)?state.siegeWeapons:[]).some(item=>itemName(item)===name);if(!exists)return alert('兵器候補が見つかりません。');const lv=typeof normalizeFormationExtensionLevel==='function'?normalizeFormationExtensionLevel('siegeWeapon',name,0):0;f.siegeWeapon={name,level:lv};return persistFormation('candidateTray:update06:siegeWeapon')}
function warhorseMasterName(wh){try{const master=typeof getWarhorseMasterById==='function'?getWarhorseMasterById(wh?.horseMasterId):null;return norm(master?.name||wh?.name||wh?.customName||'')}catch{return norm(wh?.name||wh?.customName||'')}}
function pickWarhorse(name){
  const rows=ownedWarhorseRows();
  const target=rows.find(row=>row.id===name||row.name===name||row.label===name||warhorseMasterName(row.item)===name);
  if(!target)return alert('所有済み軍馬が見つかりません。保存データに名馬を登録してから選択してください。');
  document.getElementById('hctu6')?.remove();
  const overlay=document.createElement('div');overlay.id='hctu6';overlay.style='position:fixed;inset:0;z-index:99997;background:#0f172a94;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML=`<section style="width:min(540px,100%);background:#fff;border-radius:16px;padding:16px"><h2>軍馬枠を選択</h2><p style="font-size:13px;color:#64748b;line-height:1.6">${esc(target.label||target.name)} を既存の軍馬割当処理で登録します。同じ軍馬を複数枠へ割り当てることはできません。</p><div style="display:flex;gap:8px;flex-wrap:wrap">${[0,1,2].map(i=>`<button type="button" data-u6-horse-slot="${i}">軍馬${i+1}</button>`).join('')}<button type="button" data-u6-close>閉じる</button></div></section>`;
  document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};overlay.querySelector('[data-u6-close]').onclick=()=>overlay.remove();overlay.querySelectorAll('[data-u6-horse-slot]').forEach(btn=>btn.onclick=()=>{if(typeof setMainTab==='function')setMainTab('formation');if(typeof setFormationWarhorseSlot==='function'){setFormationWarhorseSlot(Number(btn.dataset.u6HorseSlot),target.id);overlay.remove();}});
  return true;
}
function findWarhorseSkillOwner(name){return ownedWarhorseRows().find(row=>{const wh=row.item||{};const master=typeof getWarhorseMasterById==='function'?getWarhorseMasterById(wh.horseMasterId):null;return norm(JSON.stringify([wh,master])).includes(norm(name));})||null}
function pickWarhorseSkill(name){const owner=findWarhorseSkillOwner(name);if(!owner)return alert('この軍馬技能を持つ所有済み軍馬が見つかりません。対象の軍馬を登録してください。');return pickWarhorse(owner.id)}
function selectorItems(role){if(role==='warhorse')return ownedWarhorseRows().map(row=>({roleId:role,name:row.id,label:row.label||row.name,score:1,item:row.item}));return getCandidates(role).slice(0,200)}
function apply(role,name){if(role==='formation')return setFormation(name);if(role==='siege_weapon')return setSiegeWeapon(name);if(role==='warhorse')return pickWarhorse(name);if(role==='warhorse_skill')return pickWarhorseSkill(name);return false}
function openSelector(row){document.getElementById('hctu6')?.remove();const list=selectorItems(row.roleId);const overlay=document.createElement('div');overlay.id='hctu6';overlay.style='position:fixed;inset:0;z-index:99997;background:#0f172a94;display:flex;align-items:center;justify-content:center;padding:16px';const notes={formation:'陣形変更後は既存の侍従3×3配置修復処理を通します。',siege_weapon:'既存の兵器マスタとLv正規化処理を通します。',warhorse:'所有済み軍馬から選択し、既存の軍馬3枠割当処理を通します。',warhorse_skill:'対象技能を持つ所有済み軍馬を検索し、既存の軍馬3枠割当処理へ委譲します。'};overlay.innerHTML=`<section style="width:min(760px,100%);max-height:88dvh;overflow:auto;background:#fff;border-radius:16px;padding:16px"><h2>${esc(ROLE_LABELS[row.roleId])}候補を選択</h2><p style="font-size:13px;color:#64748b;line-height:1.6">${esc(notes[row.roleId]||'')}</p><div style="display:grid;gap:8px">${list.map(v=>`<button type="button" data-u6-pick="${esc(v.name)}" style="text-align:left">${esc(v.label||v.name)}${v.score?` <span style="font-size:12px;color:#64748b">参考一致 ${esc(v.score)}</span>`:''}</button>`).join('')||'<div>候補がありません。</div>'}</div><div style="margin-top:12px"><button type="button" data-u6-close>閉じる</button></div></section>`;document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};overlay.querySelector('[data-u6-close]').onclick=()=>overlay.remove();overlay.querySelectorAll('[data-u6-pick]').forEach(btn=>btn.onclick=()=>{const ok=apply(row.roleId,norm(btn.dataset.u6Pick));if(ok&&row.roleId!=='warhorse'&&row.roleId!=='warhorse_skill')overlay.remove();});}
function decorateTray(){const modal=document.getElementById('hct-modal');if(!modal)return;modal.querySelectorAll('.hct-item').forEach(card=>{const badge=norm(card.querySelector('.hct-badge')?.textContent);const row=[...UPDATE06_ROLES].map(role=>({role,label:ROLE_LABELS[role]})).find(v=>v.label===badge);if(!row)return;if(card.querySelector('[data-hct-u6-place]'))return;card.querySelector('.hct-note')?.remove();const actions=card.querySelector('.hct-actions');if(!actions)return;const btn=document.createElement('button');btn.type='button';btn.className='hct-btn primary';btn.dataset.hctU6Place='1';btn.textContent='既存選択処理で反映';btn.onclick=()=>openSelector({roleId:row.role,name:norm(card.querySelector('.hct-title')?.textContent)});actions.prepend(btn);});}
addEventListener(SNAPSHOT,decorateTray);new MutationObserver(decorateTray).observe(document.documentElement,{childList:true,subtree:true});addEventListener(READY,()=>dispatchEvent(new CustomEvent(REQUEST,{detail:{context:'update06-ready'}})));dispatchEvent(new CustomEvent(READY));decorateTray();
})();
