const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

global.window = global;
global.state = { diagnostics: {} };
vm.runInThisContext(fs.readFileSync('hado_type_score.js', 'utf8'));

const roles = JSON.parse(fs.readFileSync('hadou_type_search_role_index.json', 'utf8')).items;
const rules = JSON.parse(fs.readFileSync('hadou_type_score_rules.json', 'utf8')).items;
const generalRoles = ['main_general', 'vice_general', 'support_general', 'attendant'];

function countsFor(typeId, candidateNames = null) {
  const rule = rules.find(row => row.typeId === typeId);
  assert(rule, `missing type rule: ${typeId}`);
  const allowedNames = candidateNames ? new Set(candidateNames) : null;
  const out = {};
  for (const roleId of generalRoles) {
    out[roleId] = roles
      .filter(row => row.roleId === roleId)
      .filter(row => !allowedNames || allowedNames.has(row.displayName || row.name))
      .filter(row => window.HadoTypeScore.score(row, rule).matchedCount > 0)
      .length;
  }
  return out;
}

function total(obj) { return Object.values(obj).reduce((sum, value) => sum + value, 0); }
function uniqueCount(obj) { return new Set(Object.values(obj)).size; }

const allVaccine = countsFor('vaccine');
const savedAllVaccine = countsFor('vaccine', roles.filter(row => row.roleId === 'main_general').map(row => row.displayName || row.name));
assert.deepStrictEqual(savedAllVaccine, allVaccine, 'saved-all/max candidate counts should match all-data selectable counts');
assert(uniqueCount(savedAllVaccine) > 1, `saved selectable counts should differ by role: ${JSON.stringify(savedAllVaccine)}`);

const allTacticSpeed = countsFor('tactic_speed');
assert(uniqueCount(allTacticSpeed) > 1, `all-data selectable counts should differ by role for tactic_speed: ${JSON.stringify(allTacticSpeed)}`);

const sampleSavedNames = roles.filter(row => row.roleId === 'main_general').slice(0, 120).map(row => row.displayName || row.name);
const savedSample = countsFor('vaccine', sampleSavedNames);
const ratio = total(savedSample) / Math.max(1, total(allVaccine));
assert(ratio > 0.15, `saved sample counts should not collapse to near-zero: ratio=${ratio}, counts=${JSON.stringify(savedSample)}, all=${JSON.stringify(allVaccine)}`);
assert(uniqueCount(savedSample) > 1, `saved sample selectable counts should differ by role: ${JSON.stringify(savedSample)}`);

console.log('Update08.21 type candidate selectable count self-check passed', { allVaccine, savedAllVaccine, savedSample, ratio });
