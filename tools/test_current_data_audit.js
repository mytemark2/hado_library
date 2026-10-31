'use strict';
const assert=require('assert');
const {SOURCES}=require('./audit_data_coverage');
const {assertCurrentDataAudit:check}=require('./current_data_audit');
const troop=require('../hado_troop_skills');
function fixture(){
 const sources=Object.fromEntries(Object.keys(SOURCES).map(category=>[category,[{key:`${category}:1`,raw:{name:category,type:'即時効果'}}]]));
 sources.generals[0].raw={name:'general',tables:[{rows:[['兵科','騎兵','相性','A']]}]};
 const owner={key:'generals:1',searchPresent:true,troopTagPresent:true};
 const manifest={bundleId:'a'.repeat(64),files:Object.fromEntries(Object.values(SOURCES).map(file=>[`hadou_${file}.json`,{size:1,sha256:'b'.repeat(64)}]))};
 return {sources,files:{'hadou_bundle_manifest.json':manifest},summary:{sourceCounts:Object.fromEntries(Object.keys(SOURCES).map(category=>[category,1])),bundleId:manifest.bundleId,issues:[],unclassifiedTroops:[],unclassifiedStatuses:[],runtimeTacticAudit:{count:1,notExposed:[]},troopRelations:troop.TROOP_TYPES.map(type=>({troopType:type,scope:'commanders-troop-type',skill:type+'skill',description:'evidence',grantText:'grant',sources:[{url:'https://example.test',collectedAt:'2026-10-31T00:00:00Z'}],eligibleCommanders:type==='騎兵'?[owner]:[]}))}};
}
check(fixture());
const added=fixture();added.sources.equipments.push({key:'equipments:2',raw:{name:'new'}});added.summary.sourceCounts.equipments++;added.summary.bundleId=added.files['hadou_bundle_manifest.json'].bundleId='c'.repeat(64);check(added);
const general=fixture();general.sources.generals.push({key:'generals:2',raw:structuredClone(general.sources.generals[0].raw)});general.summary.sourceCounts.generals++;general.summary.troopRelations.find(x=>x.troopType==='騎兵').eligibleCommanders.push({key:'generals:2',searchPresent:true,troopTagPresent:true});check(general);
const switched=fixture();switched.sources.generals[0].raw.tables[0].rows[0][1]='歩兵';switched.summary.troopRelations.find(x=>x.troopType==='歩兵').eligibleCommanders=switched.summary.troopRelations.find(x=>x.troopType==='騎兵').eligibleCommanders;switched.summary.troopRelations.find(x=>x.troopType==='騎兵').eligibleCommanders=[];check(switched);
const unknown=fixture(),raw={name:'new unknown',type:'new classification',description:'original evidence',source_url:'https://example.test/effect'};unknown.sources.statusEffects.push({key:'statusEffects:2',raw});unknown.summary.sourceCounts.statusEffects++;unknown.summary.unclassifiedStatuses.push({name:raw.name,type:raw.type,description:raw.description,sourceUrl:raw.source_url});check(unknown);
const mutations=[
 x=>x.sources.skills.splice(0),
 x=>x.summary.sourceCounts.generals++,
 x=>x.summary.issues.push({code:'dangling-owner'}),
 x=>x.summary.issues.push({code:'primary-not-in-search'}),
 x=>x.summary.issues.push({code:'bundle-mismatch'}),
 x=>x.summary.bundleId='d'.repeat(64),
 x=>delete x.files['hadou_bundle_manifest.json'].files['hadou_skills.json'],
 x=>x.summary.troopRelations.find(r=>r.troopType==='騎兵').eligibleCommanders.splice(0),
 x=>x.summary.troopRelations.find(r=>r.troopType==='騎兵').eligibleCommanders[0].troopTagPresent=false,
 x=>x.summary.troopRelations[0].description='',
 x=>x.summary.runtimeTacticAudit.count=0,
 x=>x.summary.unclassifiedStatuses.push({name:'invented'})
];
for(const mutate of mutations){const x=fixture();mutate(x);assert.throws(()=>check(x));}
const missing=structuredClone(unknown);missing.summary.unclassifiedStatuses=[];assert.throws(()=>check(missing));
const inferred=structuredClone(unknown);inferred.summary.unclassifiedStatuses[0].type='有利変化';assert.throws(()=>check(inferred));
console.log('current-data audit: equipment/general additions, troop changes, new bundle and unresolved types accepted; empty sources/coverage/reference/hash/evidence corruption rejected');
