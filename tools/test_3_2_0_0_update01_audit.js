'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {audit,catalog,difference,duplicates}=require('./audit_data_coverage.js');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const gold=read('docs/updates/3.2.0.0/update01/gold-fixtures.json');
const result=audit(root),s=result.summary;
assert.deepStrictEqual(s.issues,gold.knownIssues,'new index gaps or changed hold items require review');
assert.deepStrictEqual(s.sourceCounts,gold.sourceCounts,'all twelve source categories');
assert.strictEqual(s.bundleId,gold.bundleId,'audit fixture must be reviewed for each new bundle');
assert.deepStrictEqual(s.unclassifiedTroops,[]);
assert.deepStrictEqual(s.runtimeTacticAudit,gold.runtimeTacticAudit,'retained vs runtime tactics must remain explained');
assert.deepStrictEqual(s.unclassifiedStatuses.map(x=>x.name).sort(),gold.unclassifiedStatusNames,'never infer status polarity');
for(const t of gold.troops){const found=s.troopRelations.find(x=>x.troopType===t.troopType);assert(found);assert.strictEqual(found.skill,t.skill);assert.strictEqual(found.scope,'commanders-troop-type');assert.deepStrictEqual(found.eligibleCommanders.map(x=>x.key).sort(),t.commanders);assert(found.sources.every(x=>x.url&&x.collectedAt));assert(found.description&&found.grantText);}
for(const x of gold.addedEntities){assert(result.sources[x.category].some(r=>r.key===x.key),x.key);assert(result.files['hadou_search_index.json'].items.some(r=>r.sourceEntityKey===x.key),`added record must be searchable: ${x.key}`);}
// Stable identity: a rename remains a modification, while deletions/additions and duplicates stay distinct.
const before=catalog('generals',[{name:'old',url:'https://example.test/article/show/1'}]);
const after=catalog('generals',[{name:'renamed',url:'https://example.test/article/show/1'}]);
assert.strictEqual(difference(before,after).changed.length,1);assert.strictEqual(difference(before,after).added.length,0);assert.strictEqual(difference(before,[]).removed.length,1);assert.strictEqual(difference([],after).added.length,1);assert.strictEqual(duplicates(['a','a']).length,1);
// In-memory corruption must be rejected without editing the source dataset.
const search=structuredClone(result.files['hadou_search_index.json']);search.items=search.items.filter(x=>x.sourceEntityKey!=='generals:article-582917');
assert(audit(root,{'hadou_search_index.json':search}).summary.issues.some(x=>x.code==='primary-not-in-search'&&x.key==='generals:article-582917'));
const owners=structuredClone(result.files['hadou_skill_owner_index.json']);owners.items[0].owners[0].ownerEntityKey='generals:missing-fixture';
assert(audit(root,{'hadou_skill_owner_index.json':owners}).summary.issues.some(x=>x.code==='dangling-owner'&&x.key==='generals:missing-fixture'));
console.log(`Update01 audit: ${Object.values(s.sourceCounts).reduce((a,b)=>a+b,0)} source rows; ${s.relatedLinkCount} related links; 499 troop identities; ${gold.addedEntities.length} additions; 2 explicit alias holds; mutation guards passed`);
