'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const shadowAdapter = require('../hado_update07_score_shadow.js');
const formationEvaluator = require('../hado_formation_condition_evaluator.js');

function clause(caseId, identity, rawText, state = 'met') {
  return {
    caseId,
    sourceName: 'テスト武将',
    sourceRole: 'main',
    state,
    label: state,
    clauseId: `clause:${caseId}`,
    effectIdentity: identity,
    clause: {
      id: `clause:${caseId}`,
      when: { type: 'condition.placement_role' },
      target: { scope: 'self' },
      effect: { identity },
      evidence: { category: 'generals', entity: 'テスト武将', sourceRecordId: 'generals:test', rawText },
      trust: { state: 'reviewed' }
    }
  };
}

const scorer = { score: entity => ({ totalScore: entity.scoreEvidence.length }) };
const result = shadowAdapter.build({
  conditionResult: {
    rows: [
      clause('met', 'unique:met', '部隊の攻撃が上昇', 'met'),
      clause('unmet', 'unique:unmet', '部隊の防御が上昇', 'unmet'),
      clause('deferred', 'unique:deferred', '部隊の知力が上昇', 'deferred'),
      clause('collision-a', 'duplicate', '部隊の攻撃が上昇', 'met'),
      clause('collision-b', 'duplicate', '部隊の攻撃が上昇', 'met')
    ],
    unresolved: [{ count: 2 }]
  },
  legacyEvidence: [{ sourceName: 'テスト武将' }],
  legacyTotalScore: 5,
  rule: { typeId: 'test' },
  scorer
});

assert.strictEqual(result.mode, 'shadow');
assert.strictEqual(result.activeScoreUnchanged, true, 'shadow must never replace the active score');
assert.strictEqual(result.reviewedRowCount, 5);
assert.strictEqual(result.eligibleEvidenceCount, 1, 'only a unique and met clause is eligible');
assert.strictEqual(result.evidence[0].effectFamily, 'attack_up');
assert.strictEqual(result.shadowTotalScore, 1);
assert.strictEqual(result.legacyTotalScore, 5);
assert.strictEqual(result.scoreDelta, -4);
assert.strictEqual(result.excludedReasonCounts.condition_unmet, 1);
assert.strictEqual(result.excludedReasonCounts.condition_deferred, 1);
assert.strictEqual(result.excludedReasonCounts.ambiguous_effect_identity, 2);
assert.strictEqual(result.unresolvedGeneratedClauseCount, 2);
assert.strictEqual(result.switchReady, false);

const clauseIndex = JSON.parse(fs.readFileSync('hadou_effect_clauses.json', 'utf8'));
const reviewed = clauseIndex.reviewedCases;
const identityCounts = reviewed.reduce((map, row) => {
  const identity = row.clause.effect.identity;
  map.set(identity, (map.get(identity) || 0) + 1);
  return map;
}, new Map());
const collisions = [...identityCounts.values()].filter(count => count > 1);
assert.strictEqual(reviewed.length, 44, 'Update05 reviewed corpus must remain the shadow input');
assert.strictEqual(collisions.length, 2, 'known effect-identity collision groups must remain classified');
assert.strictEqual(collisions.reduce((sum, count) => sum + count, 0), 7, 'known collision rows must not be double-scored');
formationEvaluator.indexClauseData(clauseIndex);
const yuanScoreClauses = formationEvaluator.evaluateFormationScoreClauses({
  members: [{ name: 'LR袁紹（えんしょう）', role: 'main', affinity: 'good', affinityCount: 1, starRank: 7 }],
  generalNames: ['LR袁紹（えんしょう）'],
  troopType: 'cavalry',
  siegeWeaponConfigured: false,
  stats: {}
});
const yuanShadow = shadowAdapter.build({ conditionResult: yuanScoreClauses, legacyEvidence: [], legacyTotalScore: 17, rule: { typeId: 'test' }, scorer });
assert.strictEqual(yuanScoreClauses.rows.length, 5, 'score projection must include unconditional reviewed clauses without changing the condition UI path');
assert.strictEqual(yuanShadow.excludedReasonCounts.ambiguous_effect_identity, 4, 'all four clauses sharing the LR袁紹 source effect must stay out of shadow scoring');

const versionSource = fs.readFileSync('hado_version.js', 'utf8');
const metaSource = fs.readFileSync('hado_update_meta.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const formationSource = fs.readFileSync('hado_formation.js', 'utf8');
const css = fs.readFileSync('hado_update07.css', 'utf8');
assert(versionSource.includes("updateNo: '07'"));
assert(versionSource.includes('revision: 179'));
assert(versionSource.includes('formalRelease: false'));

const nodes = new Map();
const node = id => (nodes.has(id) ? nodes.get(id) : (nodes.set(id, { textContent: '' }), nodes.get(id)));
const document = { title: '', readyState: 'complete', getElementById: node, querySelector: selector => selector === '#appTitlePanel h1' ? node('h1') : null, querySelectorAll: () => [], addEventListener() {} };
const context = { console, document, fetch: async () => { throw new Error('offline'); } };
context.window = context;
vm.createContext(context);
vm.runInContext(versionSource, context, { filename: 'hado_version.js' });
vm.runInContext(metaSource, context, { filename: 'hado_update_meta.js' });
assert.strictEqual(context.window.HADO_APP_DISPLAY_VERSION, '3.1.0.0 Update07 r179');

for (const asset of ['hado_update04.css', 'hado_update05.css', 'hado_update07.css', 'hado_condition_model.js', 'hado_formation_condition_evaluator.js', 'hado_detail_condition_presenter.js', 'hado_version.js', 'hado_type_score.js', 'hado_type_score_evidence.js', 'hado_update07_score_shadow.js', 'hado_type_data_store.js']) {
  assert(indexHtml.includes(`${asset}?v=07-r179`), `${asset} must use the Update07 cache key`);
}
assert(indexHtml.indexOf('hado_type_score.js') < indexHtml.indexOf('hado_type_score_evidence.js'));
assert(indexHtml.indexOf('hado_type_score_evidence.js') < indexHtml.indexOf('hado_update07_score_shadow.js'));
assert(indexHtml.indexOf('hado_update07_score_shadow.js') < indexHtml.indexOf('hado_type_data_store.js'));
assert(formationSource.includes('activeScoreUnchanged:true'));
assert(formationSource.includes('formationScore:update07-shadow'));
assert(formationSource.includes('evaluateFormationScoreClauses'));
assert(formationSource.includes('data-update07-score-shadow="1"'));
assert(css.includes('@media (max-width:600px)'));

console.log('3.1.0.0 Update07 score shadow regression ok');
