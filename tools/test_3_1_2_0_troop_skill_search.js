'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const troopSkills = require('../hado_troop_skills.js');

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
assert.strictEqual(rows.length, 5, 'all five troop skills must become searchable rows');
assert.deepStrictEqual(
  rows.map(row => [row.troopType, row.name]),
  [['騎兵', '走撃'], ['弓兵', '射襲'], ['工兵', '操器'], ['盾兵', '列盾'], ['歩兵', '反槍']]
);
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

const sousha = rows.find(row => row.name === '操器');
assert(sousha.searchTokens.join(' ').includes('兵器速度+30%'), 'effect text must be searchable');
assert(troopSkills.renderDetailHtml(sousha).includes('自部隊の兵器の被ダメージ-70%'));
assert(troopSkills.buildCopyLines(sousha).includes('兵科：工兵'));

assert(core.includes("troopSkills:'兵科'"));
assert(core.includes('troopSkills:[]'));
assert(search.includes("['troopSkills','兵科',state.troopSkills]"));
assert(search.includes("['troopSkills','兵科']"));
assert(statusEffects.includes('troopSkills:state.troopSkills'));
assert(bootstrap.includes('...state.troopSkills'));
assert(bootstrap.indexOf('window.HADO_TROOP_SKILLS?.install?.();') < bootstrap.lastIndexOf('startup();'));
assert(formation.includes("categoryKey==='generals'||categoryKey==='troopSkills'"), 'troop skill detail must not require a derived related-link index');
assert(indexHtml.includes('hado_troop_skills.js?v=3.1.2.0-r207'));
assert(indexHtml.indexOf('hado_status_effects.js') < indexHtml.indexOf('hado_troop_skills.js'));
assert(indexHtml.indexOf('hado_troop_skills.js') < indexHtml.indexOf('hado_bootstrap.js'));
assert(version.includes("releaseVersion: '3.1.2.0'"));
assert(version.includes('revision: 207'));

const shadowRenderer = formation.match(/function renderUpdate07ScoreShadowHtml\(shadow\)\{[\s\S]*?\n\}/)?.[0] || '';
assert(shadowRenderer.includes("return '';"), 'Clause Shadow renderer must remain hidden');

console.log('3.1.2.0 troop skill search contract passed: 5 rows, category/detail/search integration, Shadow hidden');
