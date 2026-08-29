'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const manifestTool = require('./build_json_bundle_manifest.js');

const ROOT = path.resolve(__dirname, '..');
const readJson = name => JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8'));
const sha256 = value => crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
const uniqueCount = values => new Set(values).size;

const census = readJson('docs/updates/3.1.0.0/update01/condition-census.json');
const clauses = readJson('hadou_effect_clauses.json');
const manifest = readJson('hadou_bundle_manifest.json');
const scan = census.scanSummary;
const audit = clauses.qualityAudit;

assert.strictEqual(scan.sourceRecordCount, 1822);
assert.strictEqual(scan.scannedRecordCount, scan.sourceRecordCount);
assert.strictEqual(scan.unscannedRecordCount, 0);
assert.strictEqual(scan.semanticUnitCount, 46362);
assert.strictEqual(scan.classifiedUnitCount, scan.semanticUnitCount);
assert.strictEqual(scan.unresolvedUnitCount, 0);
assert.strictEqual(census.unresolvedUnits.length, 0);
assert.deepStrictEqual(
  Object.fromEntries(Object.entries(scan.byCategory).map(([key, row]) => [key, row.sourceRecords])),
  { generals: 488, tactics: 467, skills: 661, statusEffects: 206 }
);

assert.strictEqual(clauses.itemCount, scan.sourceRecordCount);
assert.strictEqual(clauses.items.length, clauses.itemCount);
assert.strictEqual(uniqueCount(clauses.items.map(row => row.id)), clauses.itemCount);
assert.strictEqual(audit.ok, true);
assert.strictEqual(audit.sourceRecordCount, scan.sourceRecordCount);
assert.strictEqual(audit.scannedRecordCount, scan.scannedRecordCount);
assert.strictEqual(audit.sourceUnitCount, scan.semanticUnitCount);
assert.strictEqual(audit.unparsedSemanticUnitCount, 0);
assert.strictEqual(audit.invalidClauseCount, 0);
assert.strictEqual(audit.orphanConditionCount, 0);
assert.strictEqual(audit.orphanTriggerCount, 0);
assert.strictEqual(audit.orphanEffectCount, 0);
assert.strictEqual(audit.duplicateEffectIdentityCount, 0);
assert.deepStrictEqual(audit.unmatchedGoldCaseIds, []);
assert.strictEqual(audit.reviewedGoldCount, 44);

const generatedClauses = clauses.items.flatMap(item => item.clauses || []);
assert.strictEqual(generatedClauses.length, audit.clauseCount);
assert.strictEqual(uniqueCount(generatedClauses.map(row => row.id)), generatedClauses.length);
assert.strictEqual(uniqueCount(generatedClauses.map(row => row.effect.identity)), generatedClauses.length);

let missingModifierBaseCount = 0;
let invalidEvidenceHashCount = 0;
for (const clause of generatedClauses) {
  for (const modifier of clause.modifier || []) {
    if (!clause.effect || modifier.effectId !== clause.effect.id) missingModifierBaseCount += 1;
  }
  if (sha256(clause.evidence.rawText) !== clause.evidence.rawTextSha256) invalidEvidenceHashCount += 1;
}
assert.strictEqual(missingModifierBaseCount, 0);
assert.strictEqual(invalidEvidenceHashCount, 0);

const reviewed = clauses.reviewedCases || [];
assert.strictEqual(reviewed.length, 44);
assert.strictEqual(uniqueCount(reviewed.map(row => row.caseId)), reviewed.length);
assert.strictEqual(uniqueCount(reviewed.map(row => row.clause.id)), reviewed.length);
for (const row of reviewed) {
  assert.strictEqual(row.clause.trust.state, 'reviewed');
  assert.strictEqual(sha256(row.clause.evidence.rawText), row.clause.evidence.rawTextSha256);
  for (const modifier of row.clause.modifier || []) assert.strictEqual(modifier.effectId, row.clause.effect.id);
}

// The 107 normalized-signature groups are review candidates across levels/stages,
// not duplicated effect records. Identity and Clause ID are the double-count gates.
assert.strictEqual(audit.duplicateBaseOverrideCount, 107);
assert.strictEqual(audit.duplicateEffectIdentityCount, 0);

const expectedManifest = manifestTool.buildManifest();
assert.deepStrictEqual(manifest, expectedManifest);
assert.strictEqual(manifestTool.canonicalText('a\r\nb\r\n'), 'a\nb\n');
assert.strictEqual(manifestTool.canonicalText('a\nb\n'), 'a\nb\n');

const source = fs.readFileSync(path.join(ROOT, 'hado_formation.js'), 'utf8');
const versionSource = fs.readFileSync(path.join(ROOT, 'hado_version.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(source.includes('activeScoreUnchanged:true'));
assert(source.includes('HADO_UPDATE07_SCORE_SHADOW'));
assert(versionSource.includes("updateNo: ''"));
assert(versionSource.includes('revision: 198'));
assert(indexHtml.includes('hado_version.js?v=3.1.0.0-r198'));
assert(!indexHtml.includes('08-r189'));

console.log(
  `Update09 full regression ok: records ${scan.scannedRecordCount}/${scan.sourceRecordCount}, ` +
  `semantic units ${scan.classifiedUnitCount}/${scan.semanticUnitCount}, clauses ${generatedClauses.length}, ` +
  'unresolved 0, orphan condition/trigger/effect 0/0/0, real duplicate identity 0, surface gate delegated to Update08 regression'
);
