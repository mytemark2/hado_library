'use strict';
// Offline full census. No network requests and no generated application JSON writes.
const fs=require('fs'), path=require('path'), crypto=require('crypto'), cp=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const SOURCES={generals:'generals',tactics:'tactics',equipments:'equipments',skills:'skills',statusEffects:'status_effects',siegeWeapons:'siege_weapons',ethnicArmaments:'ethnic_armaments',ethnicResearchSkills:'ethnic_research_skills',formations:'formations',fiveElements:'five_elements',warhorses:'warhorses',warhorseSkills:'warhorse_skills'};
const rows=x=>Array.isArray(x)?x:(x?.items||x?.status_effects||[]);
const read=(dir,f)=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>hash(JSON.stringify(canonical(x)));
const name=x=>String(x.displayName||x.name||x.title||x.rawName||'').replace(/^【[^】]*】/,'').replace(/の(?:戦法と技能|おすすめ編制.*|性能|入手方法|能力.*|評価.*).*$/,'').replace(/\s+/g,' ').trim();
function fnv(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function catalog(category,list){
 const ids=list.map((x,i)=>{const explicit=String(x.id||x.entityId||x.tooltip_id||x.tooltipId||'').trim();if(explicit)return explicit.replace(/[^0-9A-Za-z_.-]+/g,'-');const a=String(x.url||x.source_url||x.sourceUrl||x.source?.url||'').match(/\/article\/show\/(\d+)/i);if(a)return 'article-'+a[1];if(category==='statusEffects'&&x.index!=null&&Number.isInteger(Number(x.index)))return 'index-'+x.index;return 'name-'+fnv(name(x)||`${category}-${i}`);});
 const counts=new Map();ids.forEach(id=>counts.set(id,(counts.get(id)||0)+1));
 return list.map((raw,i)=>({key:`${category}:${ids[i]}${counts.get(ids[i])>1?'-'+fnv(name(raw)||String(i)):''}`,name:name(raw),raw}));
}
function duplicates(values){const counts=new Map();values.forEach(v=>counts.set(v,(counts.get(v)||0)+1));return [...counts].filter(([,v])=>v>1).map(([key,count])=>({key,count}));}
function difference(before,after){
 const b=new Map(before.map(x=>[x.key,x])),a=new Map(after.map(x=>[x.key,x]));
 return {added:after.filter(x=>!b.has(x.key)).map(x=>({key:x.key,name:x.name,sha256:digest(x.raw)})),removed:before.filter(x=>!a.has(x.key)).map(x=>({key:x.key,name:x.name,sha256:digest(x.raw)})),changed:after.filter(x=>b.has(x.key)&&digest(x.raw)!==digest(b.get(x.key).raw)).map(x=>({key:x.key,beforeName:b.get(x.key).name,name:x.name,beforeSha256:digest(b.get(x.key).raw),sha256:digest(x.raw),changedFields:[...new Set([...Object.keys(b.get(x.key).raw),...Object.keys(x.raw)])].filter(k=>JSON.stringify(canonical(x.raw[k]))!==JSON.stringify(canonical(b.get(x.key).raw[k])))}))};
}
function runtimeTactics(dir,generals){
 const vm=require('vm');
 const element={style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},appendChild(){},setAttribute(){}};
 const context={console,location:{protocol:'file:'},document:{getElementById(){return element},querySelectorAll(){return []},querySelector(){return element},addEventListener(){},createElement(){return element},body:element},localStorage:{getItem(){return null},setItem(){}},setTimeout(){},clearTimeout(){},requestAnimationFrame(){},URL,URLSearchParams};
 context.window=context;context.addEventListener=()=>{};vm.createContext(context);
 for(const file of ['hado_version.js','hado_core.js','hado_status_effects.js'])vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),context,{filename:file});
 context.input=generals;
 return JSON.parse(JSON.stringify(vm.runInContext('buildDerivedTacticDataset(input)',context)));
}
function audit(dir, overrides={}){
 const files=Object.fromEntries(fs.readdirSync(dir).filter(f=>/^hadou_.*\.json$/.test(f)).sort().map(f=>[f,read(dir,f)]));
 Object.assign(files,overrides);
 const sources=Object.fromEntries(Object.entries(SOURCES).map(([c,f])=>[c,catalog(c,rows(files[`hadou_${f}.json`]))]));
 const s=rows(files['hadou_search_index.json']), owners=rows(files['hadou_skill_owner_index.json']), related=rows(files['hadou_related_link_index.json']);
 const sk=new Set(s.map(x=>x.sourceEntityKey)), ok=new Set(owners.map(x=>x.skillKey)), groups=new Set(rows(files['hadou_status_effect_group_owner_index.json']).map(x=>x.groupKey)), statuses=new Set(rows(files['hadou_status_effect_meta_index.json']).map(x=>x.statusEffectKey));
 const issues=[];const issue=(code,key,file)=>issues.push({code,key,file});
 for(const [c,list] of Object.entries(sources)){
  duplicates(list.map(x=>x.key)).forEach(d=>issue('duplicate-primary-identity',d.key,`hadou_${SOURCES[c]}.json`));
  for(const x of list)if(!sk.has(x.key))issue('primary-not-in-search',x.key,'hadou_search_index.json');
 }
 for(const [file,field] of [['hadou_search_index.json','sourceEntityKey'],['hadou_skill_owner_index.json','skillKey'],['hadou_related_link_index.json','sourceEntityKey'],['hadou_result_card_index.json','id']])duplicates(rows(files[file]).map(x=>x[field])).forEach(d=>issue('duplicate-index-identity',d.key,file));
 for(const x of owners){
  if(x.ownerCount!==x.owners.length)issue('owner-count-mismatch',x.skillKey,'hadou_skill_owner_index.json');
  duplicates(x.owners.map(o=>o.skillOwnerKey)).forEach(d=>issue('duplicate-owner',d.key,'hadou_skill_owner_index.json'));
  for(const o of x.owners)if(!sk.has(o.ownerEntityKey))issue('dangling-owner',o.ownerEntityKey,'hadou_skill_owner_index.json');
 }
 let refs=0;
 for(const x of related){
  if(!sk.has(x.sourceEntityKey)&&!ok.has(x.sourceEntityKey))issue('dangling-related-source',x.sourceEntityKey,'hadou_related_link_index.json');
  for(const [bucket,values] of Object.entries(x.related||{}))if(bucket!=='sourceRefs'&&Array.isArray(values))for(const r of values){refs++;const valid=r.targetDomain==='skill'?ok.has(r.targetKey):r.targetDomain==='statusEffect'?statuses.has(r.targetKey):r.targetDomain==='statusGroup'?groups.has(r.targetKey):r.targetDomain==='mechanic'?Boolean(r.targetKey):r.targetDomain==='equipmentSkill'?sk.has(String(r.targetKey).split(':equipmentSkill:')[0]):sk.has(r.targetKey);if(!valid)issue('dangling-related-target',r.targetKey,'hadou_related_link_index.json');}
 }
 const cards=new Set(rows(files['hadou_result_card_index.json']).map(x=>x.id));for(const x of s)if(!cards.has(x.id))issue('missing-result-card',x.sourceEntityKey,'hadou_result_card_index.json');
 const manifest=files['hadou_bundle_manifest.json'];for(const [f,e]of Object.entries(manifest.files)){const bytes=Buffer.from(fs.readFileSync(path.join(dir,f),'utf8').replace(/\r\n/g,'\n'));if(bytes.length!==e.size||hash(bytes)!==e.sha256)issue('bundle-mismatch',f,'hadou_bundle_manifest.json');}
 const troopRows=require(path.join(dir,'hado_troop_skills.js')).normalize(files['hadou_generals.json']);
 const troopRelations=troopRows.map(t=>({troopType:t.troopType,skill:t.name,scope:t.scope,grantText:t.grantText,description:t.description,sources:t.sources,eligibleCommanders:[]}));
 const unclassifiedTroops=[];const tags=rows(files['hadou_tag_index.json']);
 for(const x of sources.generals){
  // Only the biography's labeled troop cell establishes the general's own troop.
  const cells=(x.raw.tables||[]).flatMap(t=>t.rows||[]).filter(r=>r.includes('兵科')&&r.includes('相性'));
  const value=cells.map(r=>r[r.indexOf('兵科')+1]);const matches=troopRelations.filter(t=>value.some(v=>String(v).split(/[\s/]+/)[0]===t.troopType));
  if(matches.length!==1){unclassifiedTroops.push({key:x.key,name:x.name,cells:value});continue;}
  const t=matches[0], tag=tags.find(z=>z.category==='generals'&&z.name===x.name);
  t.eligibleCommanders.push({key:x.key,name:x.name,sourceUrl:x.raw.url,sourceCell:value[0],searchPresent:sk.has(x.key),troopTagPresent:(tag?.tags||[]).includes('兵科:'+t.troopType)});
 }
 const tactics=runtimeTactics(dir,rows(files['hadou_generals.json']));const tacticNames=new Set(tactics.map(x=>x.name));
 const runtimeTacticAudit={count:tactics.length,notExposed:sources.tactics.filter(x=>!tacticNames.has(x.raw.name)).map(x=>({key:x.key,name:x.name,url:x.raw.url,sourceGeneral:x.raw.sourceGeneral})),policy:'hado_bootstrap.js builds runtime tactics from general sections; retained hadou_tactics records are not loaded directly'};
 const unclassifiedStatuses=rows(files['hadou_status_effects.json']).filter(x=>!x.type||!['有利変化','不利変化','能力変化(強化)','能力変化(弱化)','即時効果'].includes(x.type)).map(x=>({name:x.name,type:x.type,description:x.description,sourceUrl:x.source_url}));
 return {sources,files,summary:{fileInventory:Object.entries(files).map(([f,d])=>({file:f,count:rows(d).length,sha256:hash(Buffer.from(fs.readFileSync(path.join(dir,f),'utf8').replace(/\r\n/g,'\n'))),dataSetId:d.dataSetId||null,generatedAt:d.generatedAt||null})),sourceCounts:Object.fromEntries(Object.entries(sources).map(([c,a])=>[c,a.length])),searchCount:s.length,skillCount:owners.length,ownerLinkCount:owners.reduce((n,x)=>n+x.owners.length,0),relatedLinkCount:refs,runtimeTacticAudit,bundleId:manifest.bundleId,issues,troopRelations,unclassifiedTroops,unclassifiedStatuses}};
}
function main(){
 const args=process.argv.slice(2), baseline=args[args.indexOf('--baseline')+1];if(!args.includes('--baseline')||!baseline)throw Error('--baseline <git commit> required');
 const sourceArg=args.indexOf('--source-commit');
 const sourceCommit=cp.execFileSync('git',['-c',`safe.directory=${ROOT.replace(/\\/g,'/')}`,'rev-parse',sourceArg<0?'HEAD':args[sourceArg+1]],{cwd:ROOT,encoding:'utf8'}).trim();
 const current=audit(ROOT), changes={};
 for(const [category,f]of Object.entries(SOURCES)){
  const before=JSON.parse(cp.execFileSync('git',['-c',`safe.directory=${ROOT.replace(/\\/g,'/')}`,'show',`${baseline}:hadou_${f}.json`],{cwd:ROOT,maxBuffer:100*1024*1024,encoding:'utf8'}));changes[category]=difference(catalog(category,rows(before)),current.sources[category]);
 }
 const fileChanges=[];
 for(const entry of current.summary.fileInventory){
  const declared=cp.execFileSync('git',['-c',`safe.directory=${ROOT.replace(/\\/g,'/')}`,'show',`${sourceCommit}:${entry.file}`],{cwd:ROOT,maxBuffer:150*1024*1024});
  if(hash(declared)!==entry.sha256)throw Error(`Dataset differs from declared source commit: ${entry.file}`);
  const bytes=cp.execFileSync('git',['-c',`safe.directory=${ROOT.replace(/\\/g,'/')}`,'show',`${baseline}:${entry.file}`],{cwd:ROOT,maxBuffer:150*1024*1024});
  const before=JSON.parse(bytes),after=current.files[entry.file];
  const key=x=>x.sourceEntityKey||x.skillKey||x.groupKey||x.statusEffectKey||(x.name?`${x.category||''}:${x.name}`:x.id||digest(x));
  const group=list=>{const map=new Map();for(const x of list){const k=key(x);if(!map.has(k))map.set(k,[]);map.get(k).push(digest(x));}return new Map([...map].map(([k,v])=>[k,v.sort().join(':')]));};
  const b=group(rows(before)),a=group(rows(after));
  fileChanges.push({file:entry.file,beforeSha256:hash(bytes),sha256:entry.sha256,beforeCount:rows(before).length,count:rows(after).length,rowIdentity:'sourceEntityKey/skillKey/groupKey/statusEffectKey/category:name/id; duplicate keys compared as multisets',addedKeys:[...a.keys()].filter(k=>!b.has(k)),removedKeys:[...b.keys()].filter(k=>!a.has(k)),changedKeys:[...a.keys()].filter(k=>b.has(k)&&a.get(k)!==b.get(k)),topLevelChangedFields:Array.isArray(before)?[]:[...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>digest(before[k]??null)!==digest(after[k]??null))});
 }
 const out={schemaVersion:1,baselineCommit:baseline,currentSourceCommit:sourceCommit,...current.summary,changes,fileChanges};
 const target=path.join(ROOT,'docs/updates/3.2.0.0/update01/data-audit.json');fs.writeFileSync(target,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({issueCount:out.issues.length,issues:out.issues.slice(0,10),counts:out.sourceCounts,changes:Object.fromEntries(Object.entries(changes).map(([c,d])=>[c,Object.fromEntries(Object.entries(d).map(([k,v])=>[k,v.length]))])),troops:out.troopRelations.map(x=>({troop:x.troopType,count:x.eligibleCommanders.length,missingTags:x.eligibleCommanders.filter(z=>!z.troopTagPresent).length})),unclassifiedTroops:out.unclassifiedTroops.length,unclassifiedStatuses:out.unclassifiedStatuses.map(x=>[x.name,x.type])},null,2));
}
module.exports={audit,catalog,difference,duplicates,digest};if(require.main===module)main();
