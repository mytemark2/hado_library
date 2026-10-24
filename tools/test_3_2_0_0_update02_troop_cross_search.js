'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const troop=require('../hado_troop_skills.js');
const ROOT=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),'utf8'));
const source=read('hadou_generals.json');
const fixture=read('docs/updates/3.2.0.0/update02/troop-cross-search-gold.json');
const tagIndex=read('hadou_tag_index.json');
const rows=troop.normalize(source);
const commanderIndex=troop.buildCommanderIndex(source);
const stableId=url=>{const m=String(url||'').match(/\/article\/show\/(\d+)/);return m?`article-${m[1]}`:'';};

assert.deepStrictEqual(troop.TROOP_TYPES,['騎兵','歩兵','弓兵','盾兵','工兵']);
assert.strictEqual(commanderIndex.total,499);
assert.deepStrictEqual(commanderIndex.counts,{騎兵:160,歩兵:161,弓兵:166,盾兵:7,工兵:5});
assert.deepStrictEqual(commanderIndex.unclassified,[]);
assert.strictEqual(rows.length,5);
assert.strictEqual(rows.reduce((sum,row)=>sum+row.eligibleCommanderCount,0),499);
assert.deepStrictEqual(rows.map(row=>[row.troopType,row.name,row.eligibleCommanderCount]),[['騎兵','走撃',160],['弓兵','射襲',166],['工兵','操器',5],['盾兵','列盾',7],['歩兵','反槍',161]]);

const actual=rows.map(row=>({troopType:row.troopType,skillName:row.name,grantText:row.grantText,commanderCount:row.eligibleCommanders.length,commanders:row.eligibleCommanders.map(owner=>({stableId:stableId(owner.url),name:owner.name,sourceCell:owner.sourceCell})).sort((a,b)=>a.stableId.localeCompare(b.stableId))}));
assert.deepStrictEqual(actual,fixture.troopRelations,'all 499 troop relations must match the gold fixture');
assert.strictEqual(new Set(actual.flatMap(row=>row.commanders.map(owner=>owner.stableId))).size,499);

const tagAudit=tagIndex.qualityAudit?.troopTypeAudit;
assert(tagAudit?.ok,true);
assert.strictEqual(tagAudit.sourceGeneralCount,499);
assert.strictEqual(tagAudit.taggedGeneralCount,499);
assert.strictEqual(tagAudit.missingCount,0);
assert.deepStrictEqual(tagAudit.counts,{騎兵:160,歩兵:161,弓兵:166,盾兵:7,工兵:5});
const tagByName=new Map(tagIndex.items.filter(item=>item.category==='generals').map(item=>[item.name,new Set(item.tags||[])]));
for(const row of actual)for(const owner of row.commanders)assert(tagByName.get(owner.name)?.has(`兵科:${row.troopType}`),`${owner.name}: ${row.troopType} tag missing`);

const sousha=rows.find(row=>row.name==='操器');
assert(sousha.searchTokens.includes('工兵'));
assert(sousha.searchTokens.some(token=>token.includes('LR李典')),'commander names must cross-search the troop skill');
const detail=troop.renderDetailHtml(sousha);
assert(detail.includes('主将候補（5人）'));
assert(detail.includes('data-category="generals"'));
assert(detail.includes('LR李典（りてん）'));
assert(detail.includes('通常技能の所有者とは区別しています'));
assert(troop.buildCopyLines(sousha).some(line=>line.includes('LR李典')));

const status=fs.readFileSync(path.join(ROOT,'hado_status_effects.js'),'utf8');
const formation=fs.readFileSync(path.join(ROOT,'hado_formation.js'),'utf8');
const core=fs.readFileSync(path.join(ROOT,'hado_core.js'),'utf8');
const search=fs.readFileSync(path.join(ROOT,'hado_search.js'),'utf8');
const index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const version=fs.readFileSync(path.join(ROOT,'hado_version.js'),'utf8');
assert(status.includes("['兵科:騎兵','兵科:歩兵','兵科:弓兵','兵科:盾兵','兵科:工兵']"));
assert(status.includes("else if(category==='troopSkills')tags.push(...extractTroopSkillDetailTags(item))"));
assert(status.includes('runtimeTroopTagMissingInDerivedCount'));
assert(status.includes('...runtimeTags,...ownerTags'));
assert(formation.includes("categoryKey==='troopSkills'?(window.HADO_TROOP_SKILLS?.renderDetailHtml?.(item)||'')"));
assert(core.includes("troopSkills:'兵科技能'"));
assert(search.includes("['troopSkills','兵科技能',state.troopSkills]"));
assert(search.includes("['troopSkills','兵科技能']"));
assert(index.includes('hado_troop_skills.js?v=02-r215'));
assert(version.includes("updateNo: '02'"));
assert(version.includes('revision: 215'));

const derivedNames=['hadou_status_effect_relations.json','hadou_skill_owner_index.json','hadou_search_index.json','hadou_parameter_summary_index.json','hadou_result_card_index.json','hadou_tag_index.json','hadou_status_effect_meta_index.json','hadou_status_effect_group_owner_index.json','hadou_related_link_index.json','hadou_equipment_skill_stage_index.json','hadou_tactic_attack_index.json','hadou_formation_candidate_index.json','hadou_effect_condition_blocks.json','hadou_type_search_feature_index.json','hadou_type_search_presets.json','hadou_type_search_regression_cases.json','hadou_type_score_rules.json','hadou_type_purpose_rules.json','hadou_type_search_role_rules.json','hadou_type_search_role_index.json'];
for(const name of derivedNames)assert.strictEqual(read(name).crawlerVersion,'1.1.0.8',`${name}: crawlerVersion`);
const effectClauses=read('hadou_effect_clauses.json');assert.strictEqual(effectClauses.qualityAudit?.ok,true,'effect clause generated contract');assert.strictEqual(effectClauses.itemCount,1892);
console.log('3.2.0.0 Update02 troop cross-search passed: 5 troop skills, 499 commanders, generated/runtime tag contract, owner links');
