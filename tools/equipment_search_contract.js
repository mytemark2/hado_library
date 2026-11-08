'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const normalize=value=>String(value??'').replace(/\s+/g,' ').trim().toLowerCase();
const rows=value=>Array.isArray(value)?value:(value?.items||[]);
function expectedStageText(stage,key){return normalize([stage?.label||key,...(stage?.skills||[]).flatMap(skill=>[skill.skillName||skill.name||'',skill.text||skill.body||''])].join(' '));}
function assertEquipmentSearchContract(primary,stageIndex,search){
 const equipment=rows(search).filter(row=>row.category==='equipments');
 assert.strictEqual(equipment.length,rows(primary).length,'every current equipment must have a search record');
 const stages=new Map(rows(stageIndex).map(row=>[row.name,row]));
 for(const url of rows(primary).map(row=>row.url||row.source_url).filter(Boolean))assert(equipment.some(row=>row.sourceUrl===url),`primary missing from search: ${url}`);
 for(const entry of equipment){
  const source=stages.get(entry.name);assert(source,`${entry.name}: stage source missing`);
  for(const key of ['initial','ssrMax','urMax']){
   assert(source.stages?.[key],`${entry.name}: ${key} source missing`);
   assert.strictEqual(entry.equipmentStageSearchText?.[key],expectedStageText(source.stages[key],key),`${entry.name}: ${key} missing, leaked or changed skill text`);
  }
 }
 for(const stage of stages.values())assert(equipment.some(row=>row.name===stage.name),`${stage.name}: stage missing from search`);
 assert.strictEqual(search.qualityAudit?.equipmentStageCoverage?.ok,true);
 assert.strictEqual(stageIndex.qualityAudit?.duplicateMergeAudit?.ok,true);
 return equipment;
}
function runtimeHarness(root){
 const source=fs.readFileSync(path.join(root,'hado_status_effects.js'),'utf8');
 function extract(name){const start=source.indexOf(`function ${name}(`);assert(start>=0,name);const body=source.indexOf('{',start);let depth=0;for(let i=body;i<source.length;i++){if(source[i]==='{')depth++;else if(source[i]==='}'&&--depth===0)return source.slice(start,i+1);}throw Error(name+' closing brace');}
 const state={viewMode:'all',stage:'urMax',savedSearchCacheKey:''};
 const helpers={state,getEffectiveEquipmentStageForItem:()=>state.stage,buildSavedSearchCacheKey:()=>'',getCurrentSave:()=>null,getItemDisplayName:item=>item?.name||'',findFirstTableValue:()=>'',equipmentStageLabel:key=>key==='initial'?'初期':key==='ssrMax'?'SSR最大':'UR最大',selectEquipmentSkillStageBlock:()=>({block:null}),norm:value=>String(value??'').replace(/\s+/g,' ').trim()};
 const names=Object.keys(helpers),values=Object.values(helpers);
 const build=Function(...names,`return (${extract('buildEquipmentStageAwareSearchableText')});`)(...values);
 const getText=Function(...names,'buildEquipmentStageAwareSearchableText','normalizeDerivedSearchCategory','detailCategory','buildSearchableText',`return (${extract('getFastSearchableText')});`)(...values,build,value=>value,item=>item?.sourceDataset||'',()=> '');
 return {state,getText:entry=>getText({name:entry.name,sourceDataset:'equipments',_derivedSearchIndexEntry:entry})};
}
module.exports={assertEquipmentSearchContract,expectedStageText,runtimeHarness};
