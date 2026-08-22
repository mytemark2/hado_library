'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const model = require('../hado_condition_model.js');
const evaluator = require('../hado_formation_condition_evaluator.js');

const ROOT = path.resolve(__dirname, '..');
const clauseData = JSON.parse(fs.readFileSync(path.join(ROOT, 'hadou_effect_clauses.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'updates', '3.1.0.0', 'update02', 'condition-registry.json'), 'utf8'));

assert.deepStrictEqual(
  evaluator.RUNTIME_REGISTRY.items.map(({ type, group, phase }) => ({ type, group, phase })),
  registry.items.map(({ type, group, phase }) => ({ type, group, phase })),
  'runtime registry must match the formal Update02 type/group/phase contract'
);
assert.strictEqual(clauseData.contractVersion, 'app-3.1.0.0-update05');
assert.strictEqual(clauseData.reviewedCaseCount, 44);
assert.strictEqual(clauseData.reviewedCases.length, 44);
assert(clauseData.items.flatMap(item => item.clauses).every(clause => clause.trust.state === 'generated'));
for (const row of clauseData.reviewedCases) {
  assert.strictEqual(row.clause.trust.state, 'reviewed');
  assert(model.validateEffectClause(row.clause, evaluator.RUNTIME_REGISTRY).ok, row.caseId);
}

const status = evaluator.indexClauseData(clauseData);
assert.deepStrictEqual(status, {
  ready: true,
  contractVersion: 'app-3.1.0.0-update05',
  reviewedCaseCount: 44,
  sourceRecordCount: 1810,
  clauseCount: 24329
});

function evaluate(name, role, options = {}) {
  return evaluator.evaluateFormation({
    members: [{ name, role, affinity: options.affinity || 'good', affinityCount: options.affinityCount ?? 1, starRank: options.starRank }],
    generalNames: options.generalNames || [name],
    troopType: options.troopType || 'cavalry',
    siegeWeaponConfigured: !!options.siegeWeaponConfigured,
    stats: options.stats || {}
  });
}
function stateOf(result, caseId) { return result.rows.find(row => row.caseId === caseId)?.state; }

const yuanMain = evaluate('LR袁紹（えんしょう）', 'main');
assert.strictEqual(stateOf(yuanMain, 'yuan-main-double'), 'met');
assert.strictEqual(stateOf(yuanMain, 'yuan-troops-50'), 'deferred');
assert(yuanMain.counts.unknown > 0, 'unreviewed generated clauses must remain unknown');
const yuanSupport = evaluate('LR袁紹（えんしょう）', 'support');
assert.strictEqual(stateOf(yuanSupport, 'yuan-main-double'), 'unmet');

const maliangMain = evaluate('LR馬良（ばりょう）', 'main');
assert.strictEqual(stateOf(maliangMain, 'maliang-affinity'), 'met');
assert.strictEqual(stateOf(maliangMain, 'maliang-appointment'), 'not_applicable');
assert.strictEqual(stateOf(maliangMain, 'maliang-vice1-trigger'), 'deferred');

const sunHighDefense = evaluate('LR孫堅・盾兵（そんけん）', 'main', { stats: { defense: 3000 } });
const sunLowDefense = evaluate('LR孫堅・盾兵（そんけん）', 'main', { stats: { defense: 2000 } });
assert.strictEqual(stateOf(sunHighDefense, 'sun-formation-defense'), 'met');
assert.strictEqual(stateOf(sunLowDefense, 'sun-formation-defense'), 'unmet');

const huangWithSiege = evaluate('LR黄月英（こうげつえい）', 'main', { siegeWeaponConfigured: true });
const huangWithoutSiege = evaluate('LR黄月英（こうげつえい）', 'main', { siegeWeaponConfigured: false });
assert.strictEqual(stateOf(huangWithSiege, 'huang-component-alive'), 'met');
assert.strictEqual(stateOf(huangWithoutSiege, 'huang-component-alive'), 'unmet');
assert.strictEqual(stateOf(huangWithSiege, 'huang-siege-action'), 'deferred');

const empty = evaluator.evaluateFormation({ members: [], generalNames: [] });
assert.strictEqual(empty.ok, true);
assert.deepStrictEqual(empty.rows, []);
assert.deepStrictEqual(empty.unresolved, []);
assert.strictEqual(JSON.stringify({ formations: [{ slots: {} }] }).includes('conditionEvaluation'), false, 'evaluation is derived and must not be persisted');

assert.deepStrictEqual(model.RESULT_STATES, ['met', 'unmet', 'deferred', 'not_applicable', 'unknown']);
console.log('Update05 formation evaluator ok: 44 reviewed cases / 5 states / generated clauses stay unknown');
