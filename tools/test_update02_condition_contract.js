'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const model = require('../hado_condition_model.js');

const ROOT = path.resolve(__dirname, '..');
const UPDATE01_DIR = path.join(ROOT, 'docs', 'updates', '3.1.0.0', 'update01');
const UPDATE02_DIR = path.join(ROOT, 'docs', 'updates', '3.1.0.0', 'update02');
const FILES = ['condition-registry.json', 'effect-clause.schema.json', 'condition-gold-fixtures.json'];
const normalize = buffer => buffer.toString('utf8').replace(/\r\n/g, '\n');
const before = Object.fromEntries(FILES.map(file => [file, normalize(fs.readFileSync(path.join(UPDATE02_DIR, file)))]));
const built = childProcess.spawnSync(process.execPath, ['tools/build_update02_condition_contract.js'], { cwd: ROOT, encoding: 'utf8' });
assert.strictEqual(built.status, 0, built.stderr || built.stdout || 'Update02 contract regeneration failed');
for (const file of FILES) {
  assert.strictEqual(normalize(fs.readFileSync(path.join(UPDATE02_DIR, file))), before[file], `${file} must regenerate deterministically`);
}

const registry = JSON.parse(before['condition-registry.json']);
const schema = JSON.parse(before['effect-clause.schema.json']);
const fixtures = JSON.parse(before['condition-gold-fixtures.json']);
const census = JSON.parse(fs.readFileSync(path.join(UPDATE01_DIR, 'condition-census.json'), 'utf8'));
const sourceGold = JSON.parse(fs.readFileSync(path.join(UPDATE01_DIR, 'condition-gold-set.json'), 'utf8'));
const sourceGoldSha256 = crypto.createHash('sha256').update(JSON.stringify(sourceGold)).digest('hex');
const registryIndex = model.createRegistryIndex(registry);

assert.deepStrictEqual(model.RESULT_STATES, ['met', 'unmet', 'deferred', 'not_applicable', 'unknown']);
assert.strictEqual(registry.schemaVersion, '1.0');
assert.strictEqual(registry.itemCount, 44);
assert.strictEqual(registry.items.length, 44);
assert.strictEqual(registryIndex.size, 44);
assert.strictEqual(new Set(registry.items.map(item => item.type)).size, 44);
assert.deepStrictEqual(
  registry.items.map(item => item.type).sort(),
  census.taxonomy.map(item => `${item.group}.${item.id}`).sort(),
  'formal registry must cover the complete Update01 taxonomy'
);
assert.strictEqual(schema.title, 'Hado Library EffectClause 1.0');
assert.strictEqual(schema.additionalProperties, false);

assert.strictEqual(fixtures.itemCount, 44);
assert.strictEqual(fixtures.items.length, sourceGold.items.length);
assert.strictEqual(fixtures.sourceGoldSha256, sourceGoldSha256, 'source gold semantic hash must ignore line endings');
const sourceById = new Map(sourceGold.items.map(item => [item.id, item]));
const prohibitedKeys = /^(?:patch|freeText|customText|sourceOverride)$/i;
function inspectKeys(value, pathParts = []) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert(!prohibitedKeys.test(key), `gold fixture must not use free-text patch key: ${[...pathParts, key].join('.')}`);
    inspectKeys(child, [...pathParts, key]);
  }
}

for (const fixture of fixtures.items) {
  const source = sourceById.get(fixture.caseId);
  assert(source, `fixture source missing: ${fixture.caseId}`);
  const validation = model.validateEffectClause(fixture.clause, registryIndex);
  assert(validation.ok, `${fixture.caseId} must satisfy EffectClause: ${validation.errors.join('; ')}`);
  assert.deepStrictEqual(fixture.expectedSemanticTypes, [...source.expectedSemanticTags].sort());
  assert.deepStrictEqual(model.collectSemanticTypes(fixture.clause), [...source.expectedSemanticTags].sort(), `${fixture.caseId} semantic coverage`);
  assert.strictEqual(fixture.clause.evidence.rawText, source.sourceText);
  assert.strictEqual(fixture.clause.evidence.rawTextSha256, crypto.createHash('sha256').update(source.sourceText).digest('hex'));
  assert(fixture.clause.effect.identity.includes(source.sourceRecordId), `${fixture.caseId} effect identity must retain source record`);
  const linkedItems = [
    ...fixture.clause.modifier,
    ...fixture.clause.limit,
    ...fixture.clause.reset,
    ...fixture.clause.suppression,
    ...(fixture.clause.target?.rules || [])
  ];
  for (const item of linkedItems) {
    assert.strictEqual(item.effectId, fixture.clause.effect.id, `${fixture.caseId} ${item.type} parent link`);
  }
  inspectKeys(fixture);
}

const byCase = new Map(fixtures.items.map(item => [item.caseId, item.clause]));
const mainClause = byCase.get('yuan-main-double');
assert.strictEqual(model.evaluateClause(mainClause, { surface: 'formation', facts: { 'formation.role': 'main' } }, registryIndex).state, 'met');
assert.strictEqual(model.evaluateClause(mainClause, { surface: 'formation', facts: { 'formation.role': 'support' } }, registryIndex).state, 'unmet');
assert.strictEqual(model.evaluateClause(mainClause, { surface: 'formation', facts: {} }, registryIndex).state, 'unknown');
assert.strictEqual(model.evaluateClause(byCase.get('cross-sortie'), { surface: 'formation', facts: {} }, registryIndex).state, 'deferred');
assert.strictEqual(model.evaluateClause(byCase.get('maliang-appointment'), { surface: 'formation', facts: {} }, registryIndex).state, 'not_applicable');

const unmetBeatsDeferred = model.evaluateExpression({
  op: 'all',
  items: [
    { op: 'predicate', type: 'condition.placement_role', fact: 'formation.role', comparator: 'eq', value: 'main' },
    { op: 'predicate', type: 'condition.troop_threshold', fact: 'battle.troopRatio', comparator: 'gte', value: 0.5 }
  ]
}, { surface: 'formation', facts: { 'formation.role': 'support' } }, registryIndex);
assert.strictEqual(unmetBeatsDeferred.state, 'unmet', 'explicit unmet must outrank deferred in AND');

const metWinsAny = model.evaluateExpression({
  op: 'any',
  items: [
    { op: 'predicate', type: 'condition.placement_role', fact: 'formation.role', comparator: 'eq', value: 'main' },
    { op: 'predicate', type: 'condition.skill_level', fact: 'formation.skillLevel', comparator: 'gte', value: 1 }
  ]
}, { surface: 'formation', facts: { 'formation.role': 'main' } }, registryIndex);
assert.strictEqual(metWinsAny.state, 'met', 'met must resolve OR even when another branch is unknown');

const negated = model.evaluateExpression({
  op: 'not',
  item: { op: 'predicate', type: 'condition.placement_role', fact: 'formation.role', comparator: 'eq', value: 'main' }
}, { surface: 'formation', facts: { 'formation.role': 'support' } }, registryIndex);
assert.strictEqual(negated.state, 'met');

const overrideClause = byCase.get('yuan-base-250-override-700');
assert(overrideClause.modifier.some(item => item.type === 'modifier.override_fixed' && item.effectId === overrideClause.effect.id), 'base/override must share one effect identity');
assert(fixtures.items.every(item => item.clause.trust.state === 'reviewed' && item.clause.trust.fallbackPolicy === 'raw_text_only'));

console.log(`Update02 condition contract ok: ${registry.itemCount} registry types / ${fixtures.itemCount} gold fixtures / ${model.RESULT_STATES.length} evaluator states`);
