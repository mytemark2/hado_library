'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const update=require('../hado_data_update.js');

const general=(id,name,troop,extra={})=>({name,url:`https://gamewith.jp/sangokushihadou/article/show/${id}`,tables:[{rows:[['兵科',troop,'相性','A']]}],...extra});
const skill=(id,name,text)=>({name,url:`https://gamewith.jp/sangokushihadou/article/show/${id}`,description:text});
const meta={collectedAt:'2026-10-17T01:56:42.204Z',processedAt:'2026-10-17T02:13:23.899Z',runId:'run-new',sourceCommit:'app-base'};
const derivedMeta={dataSetId:'run-new',acquiredAt:meta.collectedAt,processedAt:meta.processedAt,generatedAt:'2026-10-24T14:00:36.000Z',sourceRunId:'run-new',crawlerVersion:'1.1.0.9',sourceCommit:'app-base',sourceCommitRole:'application-generation-base',crawlerSourceCommitStatus:'unknown-in-source-run'};
const before={
  meta:{...meta,runId:'run-old'},
  generals:{items:[general(1,'武将A','騎兵'),general(2,'武将B','歩兵')]},
  skills:{items:[skill(10,'技能A','旧'),skill(11,'技能削除','削除')]},statusEffects:{items:[]},tactics:{items:[]},
  relatedLinkIndex:{...derivedMeta,dataSetId:'run-old',sourceRunId:'run-old'},searchIndex:{items:[]}
};
const after={
  meta,
  generals:{items:[general(1,'武将A','弓兵'),general(3,'武将C','工兵')]},
  skills:{items:[skill(10,'技能A','新'),skill(12,'技能追加','追加')]},
  statusEffects:{items:[{name:'未分類効果',type:'',source_url:'https://example.invalid/status'}]},
  tactics:{items:[{name:'表示戦法',url:'https://example.invalid/1'},{name:'保持戦法',url:'https://example.invalid/2'}]},
  relatedLinkIndex:derivedMeta,
  searchIndex:{items:[
    {sourceEntityKey:'equipments:article-346228',name:'青嚢書・名家医書',sourceUrl:'https://example.invalid/346228'},
    {sourceEntityKey:'equipments:article-381628',name:'青嚢書・名家医書',sourceUrl:'https://example.invalid/381628'}
  ]}
};

const diff=update.diffBundles(before,after);
assert.strictEqual(diff.available,true);
assert.deepStrictEqual(diff.categories.generals.counts,{added:1,changed:1,removed:1});
assert.deepStrictEqual(diff.categories.skills.counts,{added:1,changed:1,removed:1});
assert.strictEqual(diff.categories.troopTypes.counts.changed,4);

const status=update.createStatus({mode:'server-updated',source:'http',data:after,previousData:before,bundleManifest:{bundleId:'a'.repeat(64)}});
assert.strictEqual(status.acquisition.status,'succeeded');
assert.strictEqual(status.validation.status,'passed');
assert.strictEqual(status.reflection.status,'pending');
assert.strictEqual(status.provenance.acquiredAt,'2026-10-17T01:56:42.204Z');
assert.strictEqual(status.provenance.sourceRunId,'run-new');
assert.strictEqual(status.provenance.sourceCommitRole,'application-generation-base');
assert.strictEqual(status.provenance.crawlerSourceCommitStatus,'unknown-in-source-run');

const reflected=update.markReflected(status,after,{tacticCount:1,tacticNames:['表示戦法']});
assert.strictEqual(reflected.reflection.status,'passed');
assert.deepStrictEqual(reflected.audit.unclassifiedStatuses.map(item=>item.name),['未分類効果']);
assert.deepStrictEqual(reflected.audit.retainedTactics.map(item=>item.name),['保持戦法']);
assert.strictEqual(reflected.audit.equipmentArticleAliases.ok,true);

const fallback=update.createFallbackStatus({cachedData:after,cachedStatus:reflected,reason:'manifest-timeout',error:'timeout'});
assert.strictEqual(fallback.acquisition.status,'failed');
assert.strictEqual(fallback.validation.status,'cached-passed');
assert.strictEqual(fallback.reflection.status,'pending');
assert.strictEqual(fallback.diff,reflected.diff);

const root=path.resolve(__dirname,'..');
const realData={
  statusEffects:JSON.parse(fs.readFileSync(path.join(root,'hadou_status_effects.json'),'utf8')),
  tactics:JSON.parse(fs.readFileSync(path.join(root,'hadou_tactics.json'),'utf8')),
  searchIndex:JSON.parse(fs.readFileSync(path.join(root,'hadou_search_index.json'),'utf8'))
};
const update01Audit=JSON.parse(fs.readFileSync(path.join(root,'docs','updates','3.2.0.0','update01','data-audit.json'),'utf8'));
const retainedNames=new Set(update01Audit.runtimeTacticAudit.notExposed.map(item=>item.name));
const runtimeTacticNames=update.rows(realData.tactics).map(item=>item.name).filter(name=>!retainedNames.has(name));
const realAudit=update.buildAudit(realData,{tacticCount:runtimeTacticNames.length,tacticNames:runtimeTacticNames});
assert.deepStrictEqual(realAudit.unclassifiedStatuses.map(item=>item.name).sort(),['劇毒','即時兵器行動','即時戦法','即時攻撃','意気','火属性威力変化','焔計','相性変化'].sort());
assert.strictEqual(realAudit.tacticRetention.sourceCount,478);
assert.strictEqual(realAudit.tacticRetention.runtimeCount,458);
assert.strictEqual(realAudit.tacticRetention.retainedCount,20);
assert.strictEqual(realAudit.equipmentArticleAliases.ok,true);

console.log('3.2.0.0 Update03 data update tests passed');
