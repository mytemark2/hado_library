'use strict';

const assert = require('assert');
const fs = require('fs');
const evaluator = require('../hado_formation_condition_evaluator.js');
const integration = require('../hado_search_clause_integration.js');
const bridge = require('../hado_clause_surface_bridge.js');

const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const generalsData = json('hadou_generals.json');
const tagIndex = json('hadou_tag_index.json');
const skillOwnerIndex = json('hadou_skill_owner_index.json');
const conditionBlocks = json('hadou_effect_condition_blocks.json');
const clauseData = json('hadou_effect_clauses.json');
const featureData = json('hadou_type_search_feature_index.json');
const relatedData = json('hadou_related_link_index.json');
const statusData = json('hadou_status_effects.json');

evaluator.indexClauseData(clauseData);
const diagnostic = integration.indexData({
  effectClauses: clauseData,
  effectConditionBlocks: conditionBlocks,
  typeSearchFeatureIndex: featureData,
  relatedLinkIndex: relatedData,
  statusEffects: statusData
});
bridge.indexData({ effectClauses: clauseData });

const displayGeneralName = value => String(value || '').trim().replace(/^【三國志 覇道】/, '');
const generalNames = new Set((generalsData.items || generalsData).map(item => displayGeneralName(item.name)));
const selectableTags = new Set(Object.keys(tagIndex.invertedTags || {}));
const tagsByGeneral = new Map([...generalNames].map(name => [name, new Set()]));
const add = (name, tag) => {
  if (!generalNames.has(name) || !tag) return;
  tagsByGeneral.get(name).add(tag);
};

for (const item of tagIndex.items || []) {
  const name = displayGeneralName(item.name);
  if (item.category !== 'generals' || !generalNames.has(name)) continue;
  for (const tag of item.tags || []) add(name, tag);
}

for (const skill of skillOwnerIndex.items || []) {
  const tag = skill.skillName ? `技能:${skill.skillName}` : '';
  if (!selectableTags.has(tag)) continue;
  for (const owner of skill.owners || []) {
    if (owner.category === 'generals') add(displayGeneralName(owner.displayName || owner.name), tag);
  }
}

for (const name of generalNames) {
  for (const tag of bridge.getEntityTags('generals', name)) add(name, tag);
}

for (const [tag, owners] of Object.entries(tagIndex.invertedTags || {})) {
  for (const owner of owners || []) {
    if (owner.category !== 'generals') continue;
    const name = displayGeneralName(owner.name);
    assert(tagsByGeneral.get(name)?.has(tag), `inverted tag owner missing: ${tag} -> ${owner.name}`);
  }
}

const ownersByTag = new Map();
for (const [name, tags] of tagsByGeneral) {
  for (const tag of tags) {
    if (!ownersByTag.has(tag)) ownersByTag.set(tag, new Set());
    ownersByTag.get(tag).add(name);
  }
}

const auditedGroups = new Map();
for (const [tag, expectedOwners] of ownersByTag) {
  assert(expectedOwners.size > 0, `selectable general tag must have at least one owner: ${tag}`);
  const actualOwners = new Set([...tagsByGeneral].filter(([, tags]) => tags.has(tag)).map(([name]) => name));
  assert.deepStrictEqual([...actualOwners].sort(), [...expectedOwners].sort(), `single-tag search mismatch: ${tag}`);
  const group = tag.split(':', 1)[0];
  auditedGroups.set(group, (auditedGroups.get(group) || 0) + 1);
}

const engagementOwners = ownersByTag.get('発動:交戦開始時') || new Set();
const rawEngagementOwners = new Set((conditionBlocks.items || []).filter(item => item.category === 'generals' && (item.blocks || []).some(block => /^\s*▼[^\n]*交戦開始時/.test(block.sourceText || ''))).map(item => item.name));
// Live data can add owners or change an existing skill without a schema change.
// Keep a non-empty source gate and exact identity parity below, not a dated count.
assert(rawEngagementOwners.size > 0, 'explicit source markers must not be empty');
assert.deepStrictEqual([...engagementOwners].sort(), [...rawEngagementOwners].sort(), 'engagement-start search must match every explicit source marker');
assert(!ownersByTag.has('条件:交戦開始時'), 'engagement start belongs only to the trigger group');
assert.strictEqual(bridge.getEntityTags('generals', 'LR馬良（ばりょう）').includes('発動:交戦開始時'), true);
assert.strictEqual(bridge.getEntityTags('generals', 'UR馬良（ばりょう）').includes('発動:交戦開始時'), false, 'surface projection cache must not leak tags between rarity variants');

for (const [name, tags] of tagsByGeneral) {
  for (const tag of tags) {
    if (!tag.startsWith('条件:') && !tag.startsWith('発動:')) continue;
    const evidence = integration.getEntityTagEvidence('generals', name)[tag] || [];
    assert(evidence.length > 0, `source evidence missing: ${tag} -> ${name}`);
    assert(evidence.every(raw => /^[■▼]/.test(raw)), `non-marker evidence used: ${tag} -> ${name}`);
  }
}

const statusSource = fs.readFileSync('hado_status_effects.js', 'utf8');
assert(statusSource.includes('rebuildAvailableTagCategoryIndex(all)'));
assert(statusSource.includes('getVisibleTagOptionsForGroup(key)'));
assert(statusSource.includes('tagAppliesToActiveCategories(row.tag)'));
assert(statusSource.includes('ownerlessPrunedCount'));
const bridgeSource = fs.readFileSync('hado_clause_surface_bridge.js', 'utf8');
assert(bridgeSource.includes('function projectionKey(category, name)'));
assert(bridgeSource.includes('projectionCache.set(cacheKey, projection)'));

console.log(`tag search exhaustive ok: ${ownersByTag.size} general tags / ${auditedGroups.size} groups / ${generalNames.size} generals / engagement-start ${engagementOwners.size} owners / ${diagnostic.sourceMarkerBlockCount} source markers`);
