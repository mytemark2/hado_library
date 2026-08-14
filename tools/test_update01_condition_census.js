'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CENSUS_PATH = path.join(ROOT, 'docs', 'updates', '3.1.0.0', 'update01', 'condition-census.json');
const GOLD_PATH = path.join(ROOT, 'docs', 'updates', '3.1.0.0', 'update01', 'condition-gold-set.json');

const beforeCensus = fs.readFileSync(CENSUS_PATH);
const beforeGold = fs.readFileSync(GOLD_PATH);
const normalizeLineEndings = buffer => buffer.toString('utf8').replace(/\r\n/g, '\n');
const build = childProcess.spawnSync(process.execPath, ['tools/build_update01_condition_census.js'], {
  cwd: ROOT,
  encoding: 'utf8'
});
assert.strictEqual(build.status, 0, build.stderr || build.stdout || 'condition census regeneration failed');
assert.strictEqual(normalizeLineEndings(fs.readFileSync(CENSUS_PATH)), normalizeLineEndings(beforeCensus), 'condition census must regenerate deterministically');
assert.strictEqual(normalizeLineEndings(fs.readFileSync(GOLD_PATH)), normalizeLineEndings(beforeGold), 'condition gold set must regenerate deterministically');

const census = JSON.parse(beforeCensus.toString('utf8'));
const gold = JSON.parse(beforeGold.toString('utf8'));
const expectedCounts = { generals: 486, tactics: 465, skills: 653, statusEffects: 206 };

assert.strictEqual(census.kind, 'update01_condition_census');
assert.strictEqual(census.releaseVersion, '3.1.0.0');
assert.strictEqual(census.updateNo, '01');
assert.strictEqual(census.scanSummary.sourceRecordCount, 1810);
assert.strictEqual(census.scanSummary.scannedRecordCount, 1810);
assert.strictEqual(census.scanSummary.unscannedRecordCount, 0);
assert.strictEqual(census.scanSummary.unresolvedUnitCount, 0);
assert(census.scanSummary.semanticUnitCount > 40000, 'semantic unit census must retain full source coverage');
assert.strictEqual(census.records.length, 1810, 'every source record must have an audit record');
assert(census.records.every(row => row.unitCount > 0 && row.unitDigest && row.disposition === 'semantic_units_scanned'), 'each source record must retain a deterministic scan disposition');

for (const [category, expected] of Object.entries(expectedCounts)) {
  const row = census.scanSummary.byCategory[category];
  assert.strictEqual(row.sourceRecords, expected, `${category} source count`);
  assert.strictEqual(row.scannedRecords, expected, `${category} scan count`);
  assert.strictEqual(row.recordsWithoutConditionLanguage, 0, `${category} must have an explicit semantic scan`);
}

const requiredGroups = ['condition', 'trigger', 'context', 'modifier', 'limit', 'reset', 'suppression', 'targeting'];
for (const group of requiredGroups) {
  const entries = census.taxonomy.filter(row => row.group === group);
  assert(entries.length > 0, `${group} taxonomy must be present`);
  assert(entries.every(row => row.unitCount > 0 && row.examples.length > 0), `${group} taxonomy entries need representative examples`);
}

const blocksAudit = census.existingConditionBlocksAudit;
assert.strictEqual(blocksAudit.missingRecordCount, 228);
assert.deepStrictEqual(blocksAudit.byCategory.generals, { sourceRecords: 486, indexedRecords: 481, missingRecords: 5 });
assert.deepStrictEqual(blocksAudit.byCategory.tactics, { sourceRecords: 465, indexedRecords: 460, missingRecords: 5 });
assert.deepStrictEqual(blocksAudit.byCategory.skills, { sourceRecords: 653, indexedRecords: 641, missingRecords: 12 });
assert.deepStrictEqual(blocksAudit.byCategory.statusEffects, { sourceRecords: 206, indexedRecords: 0, missingRecords: 206 });
assert(blocksAudit.likelyMisclassificationCount > 0, 'current marker classifier review list must be retained');
assert(blocksAudit.conditionBlocksWithoutParentEffectLinkCount > 0, 'missing parent-child links must be quantified');
assert.strictEqual(blocksAudit.reuseDecision, 'diagnostic_input_only');
assert(census.update02Requirements.length >= 8, 'Update02 input requirements must be complete');

assert(gold.itemCount >= 40, 'gold set must contain at least 40 cases');
const goldIds = new Set(gold.items.map(row => row.id));
for (const id of [
  'yuan-troops-50', 'maliang-politics-ratio', 'guanping-first-tactic',
  'sun-base-power-fixed', 'simazhao-insulation-suppression', 'huang-siege-action',
  'cross-star-rank', 'status-periodic'
]) assert(goldIds.has(id), `gold set missing ${id}`);
assert(gold.items.every(row => row.sourceText && row.expectedSemanticTags.length), 'gold set cases must retain source evidence and expected semantics');

console.log(`Update01 condition census regression ok: ${census.scanSummary.scannedRecordCount} records / ${census.scanSummary.semanticUnitCount} units / ${gold.itemCount} gold cases`);
