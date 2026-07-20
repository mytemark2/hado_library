'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),'utf8'));
const rows=obj=>Array.isArray(obj)?obj:(Array.isArray(obj?.items)?obj.items:[]);
const source=fs.readFileSync(path.join(ROOT,'hado_status_effects.js'),'utf8');

function extractFunction(name){
  const start=source.indexOf(`function ${name}(`);
  assert(start>=0,`${name} source`);
  const bodyStart=source.indexOf('{',start);
  let depth=0;
  for(let index=bodyStart;index<source.length;index++){
    if(source[index]==='{')depth++;
    else if(source[index]==='}'&&--depth===0)return source.slice(start,index+1);
  }
  throw new Error(`${name} closing brace`);
}

const norm=value=>String(value??'').replace(/\s+/g,' ').trim();
const state={viewMode:'all',stage:'urMax',savedSearchCacheKey:''};
const helpers={
  state,
  getEffectiveEquipmentStageForItem:()=>state.stage,
  buildSavedSearchCacheKey:()=>'',
  getCurrentSave:()=>null,
  getItemDisplayName:item=>item?.name||'',
  findFirstTableValue:()=>'',
  equipmentStageLabel:stage=>stage==='initial'?'初期':(stage==='ssrMax'?'SSR最大':'UR最大'),
  selectEquipmentSkillStageBlock:()=>({block:null}),
  norm
};
const helperNames=Object.keys(helpers);
const buildEquipmentStageAwareSearchableText=Function(...helperNames,`return (${extractFunction('buildEquipmentStageAwareSearchableText')});`)(...helperNames.map(key=>helpers[key]));
const getFastSearchableText=Function(...helperNames,'buildEquipmentStageAwareSearchableText','normalizeDerivedSearchCategory','detailCategory','buildSearchableText',`return (${extractFunction('getFastSearchableText')});`)(...helperNames.map(key=>helpers[key]),buildEquipmentStageAwareSearchableText,value=>value,item=>item?.sourceDataset||'',()=> '');

const search=read('hadou_search_index.json');
const equipmentRows=rows(search).filter(row=>row.category==='equipments');
assert.strictEqual(equipmentRows.length,rows(read('hadou_equipments.json')).length);
assert.strictEqual(search.qualityAudit?.equipmentStageCoverage?.ok,true);
assert.strictEqual(search.qualityAudit.equipmentStageCoverage.missingSkillRefCount,0);

const expected={
  initial:['弘雅守信冠','金繍緑錦披風','双鉄戟','龍紋緑袍鎧'],
  ssrMax:['弘雅守信冠','炎帝神農茶譜','金繍緑錦披風','双鉄戟','龍紋緑袍鎧'],
  urMax:['龍淵剣','龍紋鉄甲','弘雅守信冠','炎帝神農茶譜','奮勇燕尾牌','金繍緑錦披風','双鉄戟','龍紋緑袍鎧']
};

for(const stage of Object.keys(expected)){
  state.stage=stage;
  const hits=equipmentRows.filter(entry=>getFastSearchableText({name:entry.name,sourceDataset:'equipments',_derivedSearchIndexEntry:entry}).includes('回復')).map(entry=>entry.name);
  assert.deepStrictEqual(hits,expected[stage],`${stage} 回復 hits`);
}

const twin=equipmentRows.find(entry=>entry.name==='双鉄戟');
const item={name:'双鉄戟',sourceDataset:'equipments',_derivedSearchIndexEntry:twin};
state.stage='initial';
assert(getFastSearchableText(item).includes('5%回復'));
assert(!getFastSearchableText(item).includes('25%回復'));
state.stage='urMax';
assert(getFastSearchableText(item).includes('25%回復'));
assert(!getFastSearchableText(item).includes('おすすめ武将'));
for(const entry of equipmentRows){
  assert(!Object.values(entry.equipmentStageSearchText||{}).some(text=>String(text).includes('おすすめ武将')),entry.name+' recommendation leak');
}

assert(/item\._derivedSearchIndexEntry=entry\|\|null/.test(source));
assert(/normalizeDerivedSearchCategory\(detailCategory\(item\)\)===['"]equipments['"]/.test(source));
assert(/return buildEquipmentStageAwareSearchableText\(item\)/.test(source));

console.log(JSON.stringify({ok:true,equipmentCount:equipmentRows.length,recoveryHits:Object.fromEntries(Object.entries(expected).map(([stage,names])=>[stage,names.length])),representative:'双鉄戟'},null,2));
