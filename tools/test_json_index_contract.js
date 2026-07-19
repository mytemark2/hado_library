'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),'utf8'));
const rows=obj=>Array.isArray(obj)?obj:(Array.isArray(obj?.items)?obj.items:[]);
const fragment=value=>/"\]\s*,\s*\["|\\?"\s*,\s*\\?"|\{\s*"(?:index|rows|title|name)"/.test(String(value||''));
const normalized=value=>String(value??'').normalize('NFKC').replace(/[\s　、，。．・:：;；()（）「」『』【】]/g,'').toLowerCase();
const displayName=item=>String(item?.displayName||item?.name||item?.title||item?.rawName||'').replace(/^【[^】]*】/,'').replace(/の(?:戦法と技能|おすすめ編制.*|性能|入手方法|能力.*|評価.*).*$/,'').trim();
const entityHash=value=>{let h=2166136261;for(const ch of String(value??'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ('00000000'+(h>>>0).toString(16)).slice(-8);};
const flattenScalars=value=>{const out=[];const walk=v=>{if(v==null)return;if(['string','number','boolean'].includes(typeof v)){out.push(String(v));return;}if(Array.isArray(v)){v.forEach(walk);return;}if(typeof v==='object')Object.values(v).forEach(walk);};walk(value);return out.join(' ');};

const generatedFiles=[
  'hadou_effect_condition_blocks.json','hadou_equipment_skill_stage_index.json','hadou_formation_candidate_index.json',
  'hadou_parameter_summary_index.json','hadou_related_link_index.json','hadou_result_card_index.json','hadou_search_index.json',
  'hadou_skill_owner_index.json','hadou_status_effect_group_owner_index.json','hadou_status_effect_meta_index.json',
  'hadou_status_effect_relations.json','hadou_tactic_attack_index.json','hadou_tag_index.json','hadou_type_purpose_rules.json',
  'hadou_type_score_rules.json','hadou_type_search_feature_index.json','hadou_type_search_presets.json',
  'hadou_type_search_regression_cases.json','hadou_type_search_role_index.json','hadou_type_search_role_rules.json'
];
generatedFiles.forEach(name=>assert.doesNotThrow(()=>read(name),`${name} must parse`));

const parameter=read('hadou_parameter_summary_index.json');
const related=read('hadou_related_link_index.json');
const search=read('hadou_search_index.json');
const skillOwner=read('hadou_skill_owner_index.json');
const statusMeta=read('hadou_status_effect_meta_index.json');
const tacticAttack=read('hadou_tactic_attack_index.json');
const feature=read('hadou_type_search_feature_index.json');
const role=read('hadou_type_search_role_index.json');
const regressions=read('hadou_type_search_regression_cases.json');

const sourceFiles={generals:'hadou_generals.json',tactics:'hadou_tactics.json',equipments:'hadou_equipments.json',skills:'hadou_skills.json',statusEffects:'hadou_status_effects.json',siegeWeapons:'hadou_siege_weapons.json',ethnicArmaments:'hadou_ethnic_armaments.json',ethnicResearchSkills:'hadou_ethnic_research_skills.json',formations:'hadou_formations.json',fiveElements:'hadou_five_elements.json',warhorses:'hadou_warhorses.json',warhorseSkills:'hadou_warhorse_skills.json'};
const sourceTextByKey=new Map();
for(const [category,file] of Object.entries(sourceFiles)){
  const sourceRows=rows(read(file));
  const baseIds=sourceRows.map((item,index)=>{const explicit=String(item?.id||item?.entityId||item?.tooltip_id||item?.tooltipId||'').trim();if(explicit)return explicit.replace(/[^0-9A-Za-z_.-]+/g,'-');const url=String(item?.url||item?.source_url||item?.sourceUrl||item?.source?.url||'');const article=url.match(/\/article\/show\/(\d+)/i);if(article)return 'article-'+article[1];if(category==='statusEffects'&&Number.isInteger(Number(item?.index)))return 'index-'+item.index;return 'name-'+entityHash(displayName(item)||`${category}-${index}`);});
  const counts=baseIds.reduce((map,id)=>(map.set(id,(map.get(id)||0)+1),map),new Map());
  sourceRows.forEach((item,index)=>{let id=baseIds[index];if((counts.get(id)||0)>1)id+='-'+entityHash(displayName(item)||String(index));sourceTextByKey.set(`${category}:${id}`,flattenScalars(item));});
}
const assertEvidenceInSource=(row,label)=>{const source=sourceTextByKey.get(row.sourceEntityKey);assert(source,`${label} sourceEntityKey ${row.sourceEntityKey}`);const evidence=String(row.matchedText||'').replace(/…$/,'');assert(evidence,`${label} matchedText`);assert(normalized(source).includes(normalized(evidence)),`${label} evidencePath ${row.evidencePath}: ${evidence.slice(0,80)}`);};

const sourceKeys=new Set(rows(search).map(v=>v.sourceEntityKey).filter(Boolean));
const statusKeys=new Set(rows(statusMeta).map(v=>v.statusEffectKey).filter(Boolean));
const skillKeys=new Set(rows(skillOwner).map(v=>v.skillKey).filter(Boolean));
const statusGroups=new Set(rows(read('hadou_status_effect_group_owner_index.json')).map(v=>v.groupKey).filter(Boolean));

assert.strictEqual(skillOwner.contractVersion,'1.0');
assert.strictEqual(rows(skillOwner).length,1343);
const allowedSkillDomains=new Set(['generalSkill','advisorSkill','equipmentSkill','ethnicResearchSkill','fiveElementSkill','warhorseSkill','derivedSkill']);
rows(skillOwner).forEach(row=>{
  assert(allowedSkillDomains.has(row.skillDomain),row.skillName+': '+row.skillDomain);
  assert(Array.isArray(row.skillDomains)&&row.skillDomains.includes(row.skillDomain));
  assert(skillKeys.has(row.skillKey));
  assert(row.sourceEntityKey);
  row.owners.forEach(owner=>assert(owner.ownerEntityKey&&owner.skillOwnerKey));
});

let relatedRefCount=0;
rows(related).forEach(item=>{
  assert(item.sourceEntityKey&&(sourceKeys.has(item.sourceEntityKey)||(item.category==='skills'&&skillKeys.has(item.sourceEntityKey))),item.category+': '+item.name);
  Object.entries(item.related||{}).forEach(([bucket,values])=>{
    if(bucket==='sourceRefs'||!Array.isArray(values))return;
    values.forEach(ref=>{
      relatedRefCount++;
      assert(ref.targetDomain&&ref.targetKey&&ref.relatedRef,`${item.name}:${bucket} relatedRef`);
      if(ref.targetDomain==='statusEffect')assert(statusKeys.has(ref.targetKey));
      else if(ref.targetDomain==='skill')assert(skillKeys.has(ref.targetKey));
      else if(ref.targetDomain==='statusGroup')assert(statusGroups.has(ref.targetKey));
      else if(ref.targetDomain==='equipmentSkill')assert(sourceKeys.has(String(ref.targetKey).split(':equipmentSkill:')[0]));
      else if(ref.targetDomain!=='mechanic')assert(sourceKeys.has(ref.targetKey),`${ref.targetDomain}:${ref.targetKey}`);
    });
  });
});
assert(relatedRefCount>0);
assert.strictEqual(related.qualityAudit.canonicalRefAudit.unresolvedRefCount,0);
assert.strictEqual(related.qualityAudit.canonicalRefAudit.droppedSourceItemCount,0);
assert.strictEqual(related.qualityAudit.canonicalRefAudit.droppedTargetCount,0);
assert.strictEqual(related.qualityAudit.coverageAudit.ok,true);
assert.strictEqual(related.qualityAudit.coverageAudit.applicationSkillExpectedCount,rows(skillOwner).length);
assert.strictEqual(related.qualityAudit.coverageAudit.applicationSkillIndexedCount,rows(skillOwner).length);
assert.strictEqual(related.qualityAudit.coverageAudit.missingApplicationSkillCount,0);
for(const [name,domain] of [['堅固打破','equipmentSkill'],['啓蒙','advisorSkill'],['烏桓堅装','ethnicResearchSkill'],['火行','fiveElementSkill'],['奮戦','generalSkill'],['窮地戦威','equipmentSkill']]){
  const owner=rows(skillOwner).find(v=>v.skillName===name);assert(owner,name+' skill owner row');assert.strictEqual(owner.skillDomain,domain,name+' domain');
  assert(rows(related).some(v=>v.category==='skills'&&v.name===name),name+' related row');
}
const equipmentStage=read('hadou_equipment_skill_stage_index.json');
const medicalBooks=rows(equipmentStage).filter(v=>v.name==='青嚢書・名家医書');
assert.strictEqual(medicalBooks.length,1);
assert(Object.values(medicalBooks[0].stages||{}).flatMap(v=>v.skills||[]).some(v=>v.skillName==='窮地戦威'));
assert.strictEqual(equipmentStage.qualityAudit.duplicateMergeAudit.ok,true);

// Runtime skills assembled from equipment/advisor/etc. retain their sourceDataset.
// The detail renderer must therefore pass the displayed `skills` category into
// the related-index lookup instead of falling back to that sourceDataset.
const relatedRuntimeSource=fs.readFileSync(path.join(ROOT,'hado_status_effects.js'),'utf8');
assert(/function getDerivedRelatedLinkIndexEntry\(item,categoryHint=''/m.test(relatedRuntimeSource));
assert(/getDerivedRelatedLinkIndexEntry\(item,category\)/m.test(relatedRuntimeSource));
assert(/getDerivedRelatedLinkIndexGroupsForItem\(item,\{trustedIndex:true,category,name:itemName\}\)/m.test(relatedRuntimeSource));
const bootstrapSource=fs.readFileSync(path.join(ROOT,'hado_bootstrap.js'),'utf8');
assert(/const requestToken=\[/m.test(bootstrapSource));
assert(/loadJsonTextByXhr\(requestUrl\(file\)\)/m.test(bootstrapSource));

const parameterEffects=rows(parameter).flatMap(v=>v.effects||[]);
assert(parameterEffects.length>0);
parameterEffects.forEach(effect=>{
  assert(effect.parameterKey&&effect.sourceEntityKey&&effect.sourcePartType&&effect.evidencePath&&effect.parameterFeatureKey);
  assert(Array.isArray(effect.keywords)&&effect.keywords.length>0);
  assert(!effect.keywords.some(fragment));
  assert(!fragment(effect.matchedText));
  assertEvidenceInSource(effect,'parameter');
});

const featureRows=rows(feature).flatMap(v=>[...(v.typeFeatures||[]),...(v.statusEffectRefs||[])]);
assert(featureRows.length>0);
featureRows.forEach(row=>{
  assert(row.sourceEntityKey&&row.sourcePartType&&row.canonicalFeatureKey&&row.featureDomain&&row.roleGate);
  assert.notStrictEqual(row.sourcePartType,'article_text');
  assertEvidenceInSource(row,'type feature');
});
rows(feature).flatMap(v=>v.statusEffectRefs||[]).forEach(ref=>assert(statusKeys.has(ref.statusEffectKey)));

const metaByKey=new Map(rows(statusMeta).map(v=>[v.statusEffectKey,v]));
for(const ref of [...rows(feature).flatMap(v=>v.statusEffectRefs||[]),...rows(role).flatMap(v=>v.statusEffectRefs||[])]){
  const meta=metaByKey.get(ref.statusEffectKey);assert(meta);assert.strictEqual(ref.groupKey,meta.groupKey);
}

assert.strictEqual(role.contractVersion,'1.0');
assert.strictEqual(role.qualityAudit.sourceCategoryResolution.ok,true);
rows(role).forEach(item=>{
  assert(item.sourceEntityKey&&item.roleFeatureKey);
  [...(item.typeFeatures||[]),...(item.statusEffectRefs||[])].forEach(ref=>{
    assert(ref.sourcePartType&&ref.canonicalFeatureKey&&ref.featureDomain&&ref.roleGate);
    if(['support_general','attendant'].includes(item.roleId)&&ref.sourcePartType==='tactic_text')assert.strictEqual(ref.roleGate.scoreEligible,false);
  });
});

rows(tacticAttack).forEach(row=>{
  ['hasDirectDamage','hasAnyAttackEffect','hasConditionalAttack','hasCounterAttack'].forEach(key=>assert.strictEqual(typeof row[key],'boolean'));
  if((row.attackBlocks||[]).length)assert.strictEqual(row.hasAnyAttackEffect,true);
});

for(const name of ['穿撃','轟炎']){
  const meta=rows(statusMeta).find(v=>v.name===name);assert(meta);assert.strictEqual(meta.gameType,'有利変化');assert.strictEqual(meta.actorPolarity,'selfPositive');assert.strictEqual(meta.direction,'buff');assert.strictEqual(meta.targetSide,'self');
}

const requiredCases=['type-feature-no-pseudo-status-key','type-feature-tactic-source-part','role-score-tactic-role-gate','skill-owner-domain-separation','related-link-no-unresolved-ref','related-link-application-skill-coverage','status-meta-group-consistency','tactic-attack-block-consistency','parameter-summary-no-array-fragment'];
const caseMap=new Map(rows(regressions).map(v=>[v.caseId,v]));
requiredCases.forEach(id=>assert.strictEqual(caseMap.get(id)?.ok,true,id));

global.window={};
require('../hado_type_score.js');
const scorer=window.HadoTypeScore;
const contractRow={featureId:'legacy:attack_speed',canonicalFeatureKey:'parameter:attack_speed',featureDomain:'parameter',sourceEntityKey:'generals:article-1',sourcePartType:'tactic_text',evidencePath:'sections[1]',matchedText:'自部隊の攻撃速度を50%上昇',sourceType:'tactic',roleGate:{scoreEligible:true,allowedRoleIds:['main_general','vice_general'],allowedSlots:['main','deputy1','deputy2']}};
assert.strictEqual(scorer.scoreEvidenceOrigin(contractRow,'main_general').eligible,true);
assert.strictEqual(scorer.scoreEvidenceOrigin(contractRow,'support_general').eligible,false);
assert.strictEqual(scorer.metricRows({roleId:'main_general',typeFeatures:[contractRow]},{metricKey:'attack_speed',label:'攻撃速度'}).length,1);
assert.strictEqual(scorer.metricRows({roleId:'support_general',typeFeatures:[contractRow]},{metricKey:'attack_speed',label:'攻撃速度'}).length,0);

console.log(JSON.stringify({ok:true,generatedFileCount:generatedFiles.length,skillOwnerCount:rows(skillOwner).length,relatedItemCount:rows(related).length,relatedRefCount,parameterEffectCount:parameterEffects.length,featureEvidenceCount:featureRows.length,roleItemCount:rows(role).length,regressionCaseCount:rows(regressions).length},null,2));
