'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const items = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')).items;

const cases = [
  ['hadou_generals.json', 488, [572584,572585]],
  ['hadou_equipments.json', 251, [572594,572595]],
  ['hadou_skills.json', 661, [572593,572592,572590,572591,572589,572588,572586,572587]],
  ['hadou_formations.json', 22, [261056]]
];

for (const [file, minimumCount, retainedArticleIds] of cases) {
  const rows = items(file);
  assert.ok(rows.length >= minimumCount, `${file} count must not decrease below ${minimumCount}`);
  const ids = new Set(rows.map(row => String(row.url || row.source_url || '').match(/\/article\/show\/(\d+)/)?.[1]));
  retainedArticleIds.forEach(id => assert.ok(ids.has(String(id)), `${file} must retain source article ${id}`));
}

const skillPrimaryNames = items('hadou_skills.json')
  .map(row => String(row.name || '').replace(/^【三國志 覇道】/, ''));
const skillSearchRows = items('hadou_search_index.json').filter(row => row.category === 'skills');
assert.deepStrictEqual(
  skillSearchRows.map(row => row.name),
  skillPrimaryNames,
  'derived skill search index must preserve the complete primary order'
);

console.log('restored data order regression passed: non-decreasing primary counts / representative retention / complete skill index order');
