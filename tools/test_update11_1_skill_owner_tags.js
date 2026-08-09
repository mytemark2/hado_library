'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const runtime = read('hado_status_effects.js');
const version = read('hado_version.js');
const html = read('index.html');
const tagIndex = JSON.parse(read('hadou_tag_index.json'));
const ownerIndex = JSON.parse(read('hadou_skill_owner_index.json'));

assert(version.includes("updateNo: '11.3'"), 'visible update must be Update11.3');
assert(version.includes('revision: 163'), 'revision must be r163');
assert(runtime.includes("buildDerivedSkillOwnerTagLookup(availableTags)"), 'skill-owner tag lookup must be implemented');
assert(runtime.includes("getDerivedRelatedBucketItems('skillOwnerIndex')"), 'runtime must use the derived skill-owner index');
assert(runtime.includes("`技能:${skillName}`"), 'runtime must map skill names to skill tags');
assert(runtime.includes("category!=='generals'&&category!=='equipments'"), 'only searchable owner categories may receive skill tags');
assert(runtime.includes("lookup.byKeyCategories['技能'].add(category)"), 'skill tag group must expose owner categories');
assert(runtime.includes('ownerTagAppliedItems') && runtime.includes('ownerTagApplications'), 'runtime diagnostics must report owner tag propagation');
assert(html.includes('hado_status_effects.js?v=11.3-r163-mobile-tag-ux'), 'changed runtime must use the Update11.3 cache key');

const skillTags = new Set();
for (const item of tagIndex.items || []) {
  for (const tag of item.tags || []) {
    if (String(tag).startsWith('技能:')) skillTags.add(String(tag));
  }
}

let generalLinks = 0;
let equipmentLinks = 0;
let coveredSkillEntries = 0;
for (const entry of ownerIndex.items || []) {
  const tag = `技能:${String(entry.skillName || entry.name || '').trim()}`;
  if (!skillTags.has(tag)) continue;
  coveredSkillEntries++;
  for (const owner of entry.owners || []) {
    if (owner.category === 'generals') generalLinks++;
    if (owner.category === 'equipments') equipmentLinks++;
  }
}
assert(coveredSkillEntries >= 600, `expected broad skill tag coverage, got ${coveredSkillEntries}`);
assert(generalLinks >= 1500, `expected broad general ownership coverage, got ${generalLinks}`);
assert(equipmentLinks >= 400, `expected broad equipment ownership coverage, got ${equipmentLinks}`);

const training = (ownerIndex.items || []).find(entry => entry.skillName === '練兵');
assert(training, '練兵 must exist in the skill-owner index');
const trainingGenerals = (training.owners || []).filter(owner => owner.category === 'generals').map(owner => owner.displayName || owner.name);
const trainingEquipments = (training.owners || []).filter(owner => owner.category === 'equipments').map(owner => owner.displayName || owner.name);
assert(trainingGenerals.length === 5, `練兵 must have 5 generals, got ${trainingGenerals.length}`);
assert(trainingEquipments.length === 5, `練兵 must have 5 equipments, got ${trainingEquipments.length}`);
assert(trainingGenerals.includes('UR関興（かんこう）'), '練兵 general owners must include UR関興');
assert(trainingEquipments.includes('張飛の頭巾'), '練兵 equipment owners must include 張飛の頭巾');

console.log(`update11.1 skill-owner tag regression ok: ${coveredSkillEntries} skills / ${generalLinks} general links / ${equipmentLinks} equipment links`);
