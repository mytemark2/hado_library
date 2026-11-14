'use strict';
const assert = require('assert');
function assertTroopProjection(api, raw, rows) {
  const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const contract = api.getContract(raw);
  const expected = (contract?.items || []).flatMap(group => (group.effects || []).map(effect => ({
    name: clean(effect.name), description: clean(effect.description),
    troopType: clean(group.troop_type || group.troopType), grantText: clean(group.grant_text || group.grantText)
  })));
  assert.strictEqual(rows.length, expected.length, 'every current troop effect must have one search row');
  rows.forEach((row, index) => {
    const source = expected[index];
    for (const key of ['name', 'description', 'troopType', 'grantText']) assert.strictEqual(row[key], source[key], `troop projection ${index}: ${key}`);
    assert(row.searchTokens.includes(source.description), 'current effect description must be searchable');
    assert(row.sections.some(section => section.title === '効果' && section.content.includes(source.description)));
    assert(api.buildCopyLines(row).includes(source.description), 'copy must use the current effect description');
  });
}
module.exports = {assertTroopProjection};
