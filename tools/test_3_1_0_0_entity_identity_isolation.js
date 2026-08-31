'use strict';

const assert = require('assert');
const fs = require('fs');
const evaluator = require('../hado_formation_condition_evaluator.js');
const integration = require('../hado_search_clause_integration.js');

const clauseData = JSON.parse(fs.readFileSync('hadou_effect_clauses.json', 'utf8'));
const featureData = JSON.parse(fs.readFileSync('hadou_type_search_feature_index.json', 'utf8'));
const relatedData = JSON.parse(fs.readFileSync('hadou_related_link_index.json', 'utf8'));
const statusData = JSON.parse(fs.readFileSync('hadou_status_effects.json', 'utf8'));
const conditionBlockData = JSON.parse(fs.readFileSync('hadou_effect_condition_blocks.json', 'utf8'));

function text(value) { return String(value == null ? '' : value).trim(); }
function rows(value) { return Array.isArray(value) ? value : (Array.isArray(value?.items) ? value.items : []); }
function normalizeCategory(value) {
  const key = text(value);
  return ({ status_effects: 'statusEffects', siege_weapons: 'siegeWeapons', ethnic_armaments: 'ethnicArmaments', warhorse_skills: 'warhorseSkills' })[key] || key;
}
function recordName(value) { return text(value).normalize('NFKC').replace(/\s+/g, ''); }
function comparableName(value) {
  return text(value).normalize('NFKC').replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').replace(/^(?:LR|UR|SSR|SR|R|N)\s*/i, '').replace(/[・･\s]/g, '');
}
function entityKey(category, name) { return `${normalizeCategory(category)}@@${recordName(name)}`; }
function personKey(category, name) { return `${normalizeCategory(category)}@@${comparableName(name)}`; }
function hasConditionalExpression(clause) {
  const contextType = clause?.context?.op === 'predicate' ? text(clause.context.type) : '';
  return !!clause?.trigger || !!clause?.when || (!!clause?.context && contextType !== 'context.always');
}

evaluator.indexClauseData(clauseData);
integration.indexData({
  effectClauses: clauseData,
  effectConditionBlocks: conditionBlockData,
  typeSearchFeatureIndex: featureData,
  relatedLinkIndex: relatedData,
  statusEffects: statusData
});

const entityInfo = new Map();
const expectedStatusKeys = new Map();
function addStatusRows(row, refs) {
  const category = normalizeCategory(row?.category);
  const name = text(row?.name || row?.displayName);
  if (!category || !name) return;
  const key = entityKey(category, name);
  entityInfo.set(key, { category, name });
  if (!expectedStatusKeys.has(key)) expectedStatusKeys.set(key, new Set());
  for (const ref of refs || []) {
    const statusEffectKey = text(ref?.statusEffectKey);
    if (/^statusEffects:/.test(statusEffectKey)) expectedStatusKeys.get(key).add(statusEffectKey);
  }
}
for (const row of rows(featureData)) addStatusRows(row, Array.isArray(row?.statusEffectRefs) ? row.statusEffectRefs : []);
for (const row of rows(relatedData)) addStatusRows(row, Array.isArray(row?.related?.statusEffects) ? row.related.statusEffects : []);

let auditedStatusAssociations = 0;
for (const [key, expectedSet] of expectedStatusKeys) {
  const info = entityInfo.get(key);
  const expected = [...expectedSet].sort();
  const actual = [...integration.getEntitySummary(info.category, info.name).statusEffectKeys].sort();
  assert.deepStrictEqual(actual, expected, `canonical status references leaked across records: ${info.category} / ${info.name}`);
  auditedStatusAssociations += expected.length;
}

const statusCollisionGroups = new Map();
for (const [key, info] of entityInfo) {
  const groupKey = personKey(info.category, info.name);
  if (!statusCollisionGroups.has(groupKey)) statusCollisionGroups.set(groupKey, []);
  statusCollisionGroups.get(groupKey).push(key);
}
const collidedStatusEntities = [...statusCollisionGroups.values()].filter(group => group.length > 1).flat().length;
assert(collidedStatusEntities > 0, 'same-person record variants are required for the isolation audit');

const generalNames = rows(relatedData).filter(item => normalizeCategory(item?.category) === 'generals').map(item => text(item?.name)).filter(Boolean);
const criticalResistanceOwners = generalNames.filter(name => integration.getCanonicalStatusMatches({
  category: 'generals', name, statusName: '会心耐性', groupKey: 'selfResistanceBuff'
}).some(row => row.statusEffectKey === 'statusEffects:13')).sort();
assert.deepStrictEqual(criticalResistanceOwners, [
  'UR兀突骨（ごつとつこつ）',
  'UR曹洪（そうこう）',
  'UR張角（ちょうかく）'
].sort(), '会心耐性 must belong only to the three source generals');
assert(!integration.getEntitySearchText('generals', 'LR張角（ちょうかく）').includes('会心耐性'), 'normal search text must not inherit UR張角 status effects');

const reviewedCasesByEntity = new Map();
for (const row of clauseData.reviewedCases || []) {
  const evidence = row?.clause?.evidence || {};
  const key = entityKey(evidence.category, evidence.entity);
  if (!reviewedCasesByEntity.has(key)) reviewedCasesByEntity.set(key, []);
  reviewedCasesByEntity.get(key).push(text(row.caseId));
}
let auditedClauseEntities = 0;
for (const item of clauseData.items || []) {
  const summary = evaluator.getEntityClauseSummary(item.category, item.name);
  const expectedGenerated = (item.clauses || []).filter(hasConditionalExpression).length;
  const expectedReviewed = [...(reviewedCasesByEntity.get(entityKey(item.category, item.name)) || [])].sort();
  const actualReviewed = summary.reviewedCases.map(row => text(row.caseId)).sort();
  assert.strictEqual(summary.generatedConditionalCount, expectedGenerated, `generated Clause count leaked across records: ${item.category} / ${item.name}`);
  assert.deepStrictEqual(actualReviewed, expectedReviewed, `reviewed Clause leaked across records: ${item.category} / ${item.name}`);
  auditedClauseEntities++;
}
assert(evaluator.getEntityClauseSummary('generals', 'LR袁紹（えんしょう）').reviewedCases.length > 0);
assert.strictEqual(evaluator.getEntityClauseSummary('generals', 'UR袁紹（えんしょう）').reviewedCases.length, 0, 'reviewed LR袁紹 clauses must not leak into UR袁紹');

const presenter = require('../hado_detail_condition_presenter.js');
const bridge = require('../hado_clause_surface_bridge.js');
bridge.indexData({ effectClauses: clauseData });
assert(bridge.getEntityProjection('generals', 'LR袁紹（えんしょう）').clauses.length > 0);
assert.strictEqual(bridge.getEntityProjection('generals', 'UR袁紹（えんしょう）').clauses.length, 0, 'surface clauses must retain exact rarity identity');
assert(presenter, 'detail presenter must remain loadable');

console.log(`3.1.0.0 entity identity isolation ok: ${entityInfo.size} status entities / ${auditedStatusAssociations} status associations / ${collidedStatusEntities} collision-prone records / ${auditedClauseEntities} Clause entities / 会心耐性 owners=3`);
