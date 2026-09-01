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

for (const [file, minimumCount, representativeNames] of cases) {
  const rows = items(file);
  assert.ok(rows.length >= minimumCount, `${file} count must not decrease below ${minimumCount}`);
  const names = new Set(rows.map(row => row.name));
  representativeNames.forEach(name => assert.ok(names.has(name), `${file} must retain ${name}`));
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
