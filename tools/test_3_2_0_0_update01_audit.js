'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {audit,catalog,difference,duplicates}=require('./audit_data_coverage.js');
const {assertCurrentDataAudit,validationDataRoot}=require('./current_data_audit');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const gold=read('docs/updates/3.2.0.0/update01/gold-fixtures.json');
const historical=read('docs/updates/3.2.0.0/update01/data-audit.json');
const dataRoot=validationDataRoot(root),result=audit(dataRoot),s=result.summary;
// Historical evidence remains immutable; live bundle acceptance is a separate contract.
assert.deepStrictEqual(historical.sourceCounts,gold.sourceCounts,'historical twelve-category census');
assert.strictEqual(historical.bundleId,gold.bundleId,'historical bundle identity');
assert.deepStrictEqual(historical.runtimeTacticAudit,gold.runtimeTacticAudit);
assert.deepStrictEqual(historical.unclassifiedStatuses.map(x=>x.name).sort(),gold.unclassifiedStatusNames);
for(const t of gold.troops){const found=historical.troopRelations.find(x=>x.troopType===t.troopType);assert(found);assert.strictEqual(found.skill,t.skill);assert.deepStrictEqual(found.eligibleCommanders.map(x=>x.key).sort(),t.commanders);}
assertCurrentDataAudit(result,gold.knownIssues);
for(const x of gold.addedEntities){assert(result.sources[x.category].some(r=>r.key===x.key),x.key);assert(result.files['hadou_search_index.json'].items.some(r=>r.sourceEntityKey===x.key),`added record must be searchable: ${x.key}`);}
// Stable identity: a rename remains a modification, while deletions/additions and duplicates stay distinct.
const before=catalog('generals',[{name:'old',url:'https://example.test/article/show/1'}]);
const after=catalog('generals',[{name:'renamed',url:'https://example.test/article/show/1'}]);
assert.strictEqual(difference(before,after).changed.length,1);assert.strictEqual(difference(before,after).added.length,0);assert.strictEqual(difference(before,[]).removed.length,1);assert.strictEqual(difference([],after).added.length,1);assert.strictEqual(duplicates(['a','a']).length,1);
// In-memory corruption must be rejected without editing the source dataset.
const search=structuredClone(result.files['hadou_search_index.json']);search.items=search.items.filter(x=>x.sourceEntityKey!=='generals:article-582917');
assert(audit(dataRoot,{'hadou_search_index.json':search}).summary.issues.some(x=>x.code==='primary-not-in-search'&&x.key==='generals:article-582917'));
const owners=structuredClone(result.files['hadou_skill_owner_index.json']);owners.items[0].owners[0].ownerEntityKey='generals:missing-fixture';
assert(audit(dataRoot,{'hadou_skill_owner_index.json':owners}).summary.issues.some(x=>x.code==='dangling-owner'&&x.key==='generals:missing-fixture'));
console.log(`Update01 audit: ${Object.values(s.sourceCounts).reduce((a,b)=>a+b,0)} current source rows; ${s.relatedLinkCount} related links; historical gold retained; live membership and mutation guards passed`);
