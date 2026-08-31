'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const items = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')).items;

const cases = [
  ['hadou_generals.json', 488, ['【三國志 覇道】LR沮授（そじゅ）', '【三國志 覇道】LR蒙恬（もうてん）']],
  ['hadou_equipments.json', 251, ['【三國志 覇道】心翠宝玉佩', '【三國志 覇道】万里安境矛']],
  ['hadou_skills.json', 661, ['【三國志 覇道】忠賢', '【三國志 覇道】恬安', '【三國志 覇道】攻逐', '【三國志 覇道】逐敵', '【三國志 覇道】叡威', '【三國志 覇道】鋼志', '【三國志 覇道】護叡', '【三國志 覇道】執守']],
  ['hadou_formations.json', 22, ['盾兵陣']]
];

for (const [file, expectedCount, expectedNames] of cases) {
  const rows = items(file);
  assert.strictEqual(rows.length, expectedCount, `${file} count`);
  assert.deepStrictEqual(rows.slice(0, expectedNames.length).map(row => row.name), expectedNames, `${file} newest records must stay first`);
}

const skillSearchRows = items('hadou_search_index.json').filter(row => row.category === 'skills');
assert.deepStrictEqual(
  skillSearchRows.slice(0, 8).map(row => row.name),
  ['忠賢', '恬安', '攻逐', '逐敵', '叡威', '鋼志', '護叡', '執守'],
  'derived skill search index must preserve the corrected primary order'
);

console.log('restored data order regression passed: generals 2 / equipments 2 / skills 8 / formations 1');
