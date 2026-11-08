'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {assertEquipmentSearchContract,expectedStageText,runtimeHarness}=require('./equipment_search_contract');
const {validationDataRoot}=require('./current_data_audit');
const root=path.resolve(__dirname,'..'),dataRoot=validationDataRoot(root),read=name=>JSON.parse(fs.readFileSync(path.join(dataRoot,name),'utf8'));
const stages=read('hadou_equipment_skill_stage_index.json'),search=read('hadou_search_index.json');
const equipment=assertEquipmentSearchContract(read('hadou_equipments.json'),stages,search);
const source=new Map(stages.items.map(row=>[row.name,row])),runtime=runtimeHarness(root);
for(const key of ['initial','ssrMax','urMax']){runtime.state.stage=key;for(const row of equipment){
 const text=runtime.getText(row),stageText=expectedStageText(source.get(row.name).stages[key],key);
 assert(text.includes(stageText),`${row.name}: runtime ${key} dropped current skill text`);
 assert.strictEqual(text.includes('回復'),stageText.includes('回復')||String(row.baseSearchText||'').includes('回復')||row.name.includes('回復'),`${row.name}: runtime ${key} cross-stage leakage`);
}}
console.log(`equipment live contract: ${equipment.length} equipment x 3 stages, no missing/leaked skill text`);
