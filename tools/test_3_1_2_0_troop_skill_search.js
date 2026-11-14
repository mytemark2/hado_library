'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const troopSkills = require('../hado_troop_skills.js');
const {assertTroopProjection} = require('./troop_search_contract');

const ROOT = path.resolve(__dirname, '..');
const generals = JSON.parse(fs.readFileSync(path.join(ROOT, 'hadou_generals.json'), 'utf8'));
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const core = fs.readFileSync(path.join(ROOT, 'hado_core.js'), 'utf8');
const search = fs.readFileSync(path.join(ROOT, 'hado_search.js'), 'utf8');
const statusEffects = fs.readFileSync(path.join(ROOT, 'hado_status_effects.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(ROOT, 'hado_bootstrap.js'), 'utf8');
const formation = fs.readFileSync(path.join(ROOT, 'hado_formation.js'), 'utf8');
const version = fs.readFileSync(path.join(ROOT, 'hado_version.js'), 'utf8');

const contract = troopSkills.getContract(generals);
assert(contract, 'hadou_generals.json must include troop_effects');
assert.strictEqual(contract.schema_version, 1);
assert.strictEqual(contract.scope, 'commanders-troop-type');

const rows = troopSkills.normalize(generals);
assertTroopProjection(troopSkills, generals, rows);
for (const row of rows) {
  assert.strictEqual(row.category, 'troopSkills');
  assert.strictEqual(row.sourceDataset, 'troopSkills');
  assert(row.description, `${row.name}: description is required`);
  assert(row.grantText, `${row.name}: grant text is required`);
  assert(row.url.startsWith('https://'), `${row.name}: source URL is required`);
  assert(row.searchTokens.includes(row.name));
  assert(row.searchTokens.includes(row.troopType));
  assert(row.sections.some(section => section.title === '効果'));
}

// Owned examples retain fixed rendering behavior and exercise legitimate changes.
const fixture = {items: [], troop_effects: {schema_version: 1, scope: 'commanders-troop-type', items: [{troop_type: '工兵', grant_text: '主将の兵科が工兵', effects: [{name: '検証技能', description: '兵器速度+30%', sources: [{url: 'https://example.invalid/troop'}]}]}]}};
for (const effects of [
  [{name: '改名技能', description: '兵器速度+40%'}],
  [{name: '追加技能A', description: '攻撃上昇'}, {name: '追加技能B', description: '負傷兵を20%回復'}]
]) {
  const changed = structuredClone(fixture); changed.troop_effects.items[0].effects = effects;
  const projected = troopSkills.normalize(changed); assertTroopProjection(troopSkills, changed, projected);
  assert.throws(() => assertTroopProjection(troopSkills, changed, projected.slice(1)), /every current/);
  const corrupt = structuredClone(projected); corrupt[0].description = '古い効果';
  assert.throws(() => assertTroopProjection(troopSkills, changed, corrupt), /description/);
}
const example = troopSkills.normalize(fixture)[0];
assert(troopSkills.renderDetailHtml(example).includes('兵器速度+30%'));
assert(troopSkills.buildCopyLines(example).includes('兵科：工兵'));

assert(core.includes("troopSkills:'兵科技能'"));
assert(core.includes('troopSkills:[]'));
assert(search.includes("['troopSkills','兵科技能',state.troopSkills]"));
assert(search.includes("['troopSkills','兵科技能']"));
assert(statusEffects.includes('troopSkills:state.troopSkills'));
assert(bootstrap.includes('...state.troopSkills'));
assert(bootstrap.indexOf('window.HADO_TROOP_SKILLS?.install?.();') < bootstrap.lastIndexOf('startup();'));
assert(formation.includes("categoryKey==='generals'||categoryKey==='troopSkills'"), 'troop skill detail must not require a derived related-link index');
assert(indexHtml.includes('hado_troop_skills.js?v=07-r227'));
assert(indexHtml.indexOf('hado_status_effects.js') < indexHtml.indexOf('hado_troop_skills.js'));
assert(indexHtml.indexOf('hado_troop_skills.js') < indexHtml.indexOf('hado_bootstrap.js'));
assert(version.includes("releaseVersion: '3.2.0.0'"));
assert(version.includes('revision: 227'));

const shadowRenderer = formation.match(/function renderUpdate07ScoreShadowHtml\(shadow\)\{[\s\S]*?\n\}/)?.[0] || '';
assert(shadowRenderer.includes("return '';"), 'Clause Shadow renderer must remain hidden');

console.log(`troop skill search contract passed: ${rows.length} current rows; additions/rename/ability changes; missing/stale effects rejected`);
