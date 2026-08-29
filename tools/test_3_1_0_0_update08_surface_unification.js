'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const evaluator = require('../hado_formation_condition_evaluator.js');
const searchIntegration = require('../hado_search_clause_integration.js');
const bridge = require('../hado_clause_surface_bridge.js');

const ROOT = path.resolve(__dirname, '..');
const readJson = name => JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8'));
const clauseData = readJson('hadou_effect_clauses.json');

evaluator.indexClauseData(clauseData);
searchIntegration.indexData({
  effectClauses: clauseData,
  effectConditionBlocks: readJson('hadou_effect_condition_blocks.json'),
  typeSearchFeatureIndex: readJson('hadou_type_search_feature_index.json'),
  relatedLinkIndex: readJson('hadou_related_link_index.json'),
  statusEffects: readJson('hadou_status_effects.json')
});
const diagnostic = bridge.indexData({ effectClauses: clauseData });

assert.strictEqual(diagnostic.ready, true);
assert.strictEqual(diagnostic.contractVersion, '3.1.0.0-update08-surface-v1');
assert.strictEqual(diagnostic.reviewedCaseCount, 44);
assert.strictEqual(diagnostic.reviewedEntityCount, 14);

const entityKeys = new Map();
for (const row of clauseData.reviewedCases) {
  const evidence = row.clause.evidence;
  entityKeys.set(`${evidence.category}@@${evidence.entity}`, [evidence.category, evidence.entity]);
}
let projectionCount = 0;
for (const [category, name] of entityKeys.values()) {
  const projection = bridge.getEntityProjection(category, name);
  assert.strictEqual(projection.consistent, true, `${category}/${name} must agree across canonical, detail, and search surfaces`);
  assert.strictEqual(projection.surfaceCounts.canonical, projection.surfaceCounts.detail);
  assert.strictEqual(projection.surfaceCounts.canonical, projection.surfaceCounts.search);
  projectionCount += projection.reviewedCaseCount;
  for (const clause of projection.clauses) {
    const gold = clauseData.reviewedCases.find(row => row.caseId === clause.caseId);
    assert(gold, clause.caseId);
    assert.strictEqual(clause.clauseId, gold.clause.id);
    assert.strictEqual(clause.rawTextSha256, gold.clause.evidence.rawTextSha256);
    assert.strictEqual(clause.effectIdentity, gold.clause.effect.identity);
    assert.strictEqual(clause.targetScope, gold.clause.target.scope);
  }
}
assert.strictEqual(projectionCount, 44);
assert.strictEqual(bridge.getDiagnostic().inconsistentProjectionCount, 0);

const yuan = bridge.getEntityProjection('generals', 'LR袁紹（えんしょう）');
assert.strictEqual(yuan.reviewedCaseCount, 5);
assert.deepStrictEqual(yuan.surfaceCounts, { detail: 5, search: 5, canonical: 5 });
assert(yuan.searchTags.includes('条件:主将'));
assert(yuan.searchTags.includes('条件:兵力50%以上'));

const snapshot = {
  members: [{ name: 'LR袁紹（えんしょう）', role: 'main', affinity: 'good', affinityCount: 1 }],
  generalNames: ['LR袁紹（えんしょう）'],
  troopType: 'cavalry',
  siegeWeaponConfigured: false,
  stats: {}
};
const directConditional = evaluator.evaluateFormation(snapshot);
const directScore = evaluator.evaluateFormationScoreClauses(snapshot);
const formation = bridge.evaluateFormation(snapshot);
assert.deepStrictEqual(formation.conditionalResult.counts, directConditional.counts);
assert.deepStrictEqual(formation.scoreResult.counts, directScore.counts);
assert.strictEqual(formation.conditionalResult.rows.length, 4);
assert.strictEqual(formation.scoreResult.rows.length, 5);
for (const row of formation.scoreResult.rows) {
  assert(row.surfaceClause, row.caseId);
  assert.strictEqual(row.surfaceClause.caseId, row.caseId);
  assert.strictEqual(row.surfaceClause.clauseId, row.clauseId);
  assert.strictEqual(row.surfaceClause.rawTextSha256, row.rawTextSha256);
  assert.strictEqual(row.surfaceClause.effectIdentity, row.effectIdentity);
}

const rawText = yuan.clauses[0].rawText;
const evidenceLinks = bridge.linkFormationEffects([{ rawText }], formation);
assert.strictEqual(evidenceLinks.length, 4);
assert.deepStrictEqual([...new Set(evidenceLinks.map(row => row.state))].sort(), ['deferred', 'met']);
assert(evidenceLinks.every(row => row.targetScope === 'source_defined'));
assert(evidenceLinks.every(row => row.targetLabel === ''), 'internal source_defined targets must not add an unhelpful user label');
const tacticSummaryLinks = bridge.getFormationClauseLinks(formation, { effectTextIncludes: '戦法威力' });
assert.deepStrictEqual(tacticSummaryLinks.map(row => row.caseId).sort(), ['yuan-base-250-override-700', 'yuan-troops-50']);
assert.deepStrictEqual([...new Set(tacticSummaryLinks.map(row => row.state))].sort(), ['deferred', 'met']);
assert(tacticSummaryLinks.every(row => row.effectText.includes('250% → 700%')));
const typeHits = bridge.annotateTypeSearchHits('generals', 'LR袁紹（えんしょう）', [{ featureId: 'fixture', matchedText: rawText }]);
assert.strictEqual(typeHits[0].clauseRefs.length, 4);

const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const versionSource = fs.readFileSync(path.join(ROOT, 'hado_version.js'), 'utf8');
const coreSource = fs.readFileSync(path.join(ROOT, 'hado_core.js'), 'utf8');
const statusSource = fs.readFileSync(path.join(ROOT, 'hado_status_effects.js'), 'utf8');
const searchSource = fs.readFileSync(path.join(ROOT, 'hado_search.js'), 'utf8');
const formationSource = fs.readFileSync(path.join(ROOT, 'hado_formation.js'), 'utf8');
assert(indexHtml.indexOf('hado_search_clause_integration.js?v=3.1.0.0-r195') < indexHtml.indexOf('hado_clause_surface_bridge.js?v=3.1.0.0-r195'));
assert(indexHtml.indexOf('hado_clause_surface_bridge.js?v=3.1.0.0-r195') < indexHtml.indexOf('hado_formation.js?v=3.1.0.0-r195-mobile-parity'));
assert(indexHtml.includes('hado_update08.css?v=3.1.0.0-r195'));
assert(!indexHtml.includes('06-r187'));
assert(versionSource.includes("updateNo: ''"));
assert(versionSource.includes('revision: 195'));
assert(coreSource.includes('bridge.buildDetailPresentation'));
assert(statusSource.includes('HADO_CLAUSE_SURFACE_BRIDGE||rootApi.HADO_SEARCH_CLAUSE_INTEGRATION'));
assert(searchSource.includes('bridge.annotateTypeSearchHits'));
assert(formationSource.includes('data?.clauseSurface?.scoreResult'));
assert(formationSource.includes('bridge.linkFormationEffects'));
assert(formationSource.includes("bridge.getFormationClauseLinks(data?.clauseSurface,{effectTextIncludes:'戦法威力'})"));
assert(formationSource.includes('formation-clause-state'));
assert(!formationSource.includes('formation-condition-case'));
assert(formationSource.includes('activeScoreUnchanged:true'));
assert(formationSource.includes('HADO_UPDATE07_SCORE_SHADOW'));

console.log(`Update08 surface unification ok: ${projectionCount} reviewed clauses / ${entityKeys.size} entities / detail-search-formation-score-summary consistent / active score unchanged`);
