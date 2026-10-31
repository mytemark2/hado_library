'use strict';
const assert=require('assert');
const path=require('path');
const {SOURCES,CLASSIFIED_STATUS_TYPES}=require('./audit_data_coverage');
const troop=require('../hado_troop_skills');

// Live-data contracts use the current primary records, never a historical total.
function assertCurrentDataAudit(result,knownIssues=[]){
 const {sources,files,summary:s}=result;
 assert.deepStrictEqual(s.issues,knownIssues,'new index gaps, duplicate identities or hash failures require repair');
 assert.deepStrictEqual(Object.keys(s.sourceCounts).sort(),Object.keys(SOURCES).sort());
 for(const [category,file] of Object.entries(SOURCES)){
  assert(sources[category]?.length>0,`${category}: primary records required`);
  assert.strictEqual(s.sourceCounts[category],sources[category].length,`${category}: audit count`);
  assert(files['hadou_bundle_manifest.json'].files[`hadou_${file}.json`],`${category}: manifest entry missing`);
 }
 assert.match(s.bundleId,/^[a-f0-9]{64}$/,'current bundle identifier');
 assert.strictEqual(s.bundleId,files['hadou_bundle_manifest.json'].bundleId,'audit must describe the current manifest');
 assert.deepStrictEqual(s.unclassifiedTroops,[],'every primary general must have an evidenced troop type');
 const expected=Object.fromEntries(troop.TROOP_TYPES.map(type=>[type,[]]));
 for(const general of sources.generals){
  const type=troop.extractGeneralTroopType(general.raw).troopType;
  assert(expected[type],`${general.key}: missing or unsupported troop type`);
  expected[type].push(general.key);
 }
 for(const type of troop.TROOP_TYPES){
  const rules=s.troopRelations.filter(row=>row.troopType===type);
  assert(rules.length>0,`${type}: troop rule missing`);
  for(const rule of rules){
   assert.strictEqual(rule.scope,'commanders-troop-type');
   assert(rule.skill&&rule.description&&rule.grantText,`${type}: incomplete source definition`);
   assert(rule.sources.length&&rule.sources.every(source=>source.url&&source.collectedAt),`${type}: source evidence missing`);
   assert.deepStrictEqual(rule.eligibleCommanders.map(owner=>owner.key).sort(),expected[type].slice().sort(),`${type}: current primary membership`);
   assert(rule.eligibleCommanders.every(owner=>owner.searchPresent&&owner.troopTagPresent),`${type}: missing search entry or troop tag`);
  }
 }
 assert.strictEqual(s.runtimeTacticAudit.count+s.runtimeTacticAudit.notExposed.length,sources.tactics.length,'all retained tactics must be accounted for');
 for(const retained of s.runtimeTacticAudit.notExposed)assert(sources.tactics.some(row=>row.key===retained.key),'retained tactic source missing');
 const unresolved=sources.statusEffects.map(row=>row.raw).filter(raw=>!raw.type||!CLASSIFIED_STATUS_TYPES.includes(raw.type)).map(raw=>({name:raw.name,type:raw.type,description:raw.description,sourceUrl:raw.source_url}));
 assert.deepStrictEqual(s.unclassifiedStatuses,unresolved,'retain every unresolved status and its original classification/evidence');
 return s;
}

function historicalTroopSource(fixture,audit){
 return {items:fixture.troopRelations.flatMap(row=>row.commanders.map(owner=>({name:owner.name,url:`https://gamewith.jp/sangokushihadou/article/show/${owner.stableId.replace('article-','')}`,tables:[{rows:[['兵科',owner.sourceCell,'相性','fixture']]}]}))),troop_effects:{items:audit.troopRelations.map(row=>({troop_type:row.troopType,grant_text:row.grantText,effects:[{name:row.skill,description:row.description,sources:row.sources}]}))}};
}
function validationDataRoot(defaultRoot){
 const index=process.argv.indexOf('--data-root');
 if(index<0)return defaultRoot;
 assert(process.argv[index+1],'--data-root requires an explicit local validation directory');
 return path.resolve(process.argv[index+1]);
}
module.exports={assertCurrentDataAudit,historicalTroopSource,validationDataRoot};
