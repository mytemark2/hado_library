const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const formation = read('hado_formation.js');
const typeCandidates = read('hado_type_candidates.js');
const indexHtml = read('index.html');

function block(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  assert(start >= 0 && end > start, `${startMarker} block must exist`);
  return source.slice(start + startMarker.length, end);
}

const generals = new Map([
  ['LR関羽', { name: 'LR関羽', rarity: 'LR' }],
  ['UR張飛', { name: 'UR張飛', rarity: 'UR' }],
]);
const policyContext = {
  window: {},
  norm: value => String(value ?? '').trim(),
  normalizeSaveItemName: value => String(value ?? '').trim(),
  findItemByDisplayName: (_category, name) => generals.get(String(name ?? '').trim()) || null,
  getItemDisplayName: item => item?.name || '',
  getGeneralRarityCode: item => item?.rarity || '',
  getGeneralRarityRank: item => ({ LR: 6, UR: 5, SSR: 4 }[item?.rarity] || 0),
};
vm.createContext(policyContext);
vm.runInContext(block(
  formation,
  '// HADO-3.0.0.0-ATTENDANT-CANDIDATE-POLICY-START',
  '// HADO-3.0.0.0-ATTENDANT-CANDIDATE-POLICY-END'
), policyContext);

assert.strictEqual(policyContext.window.HadoFormationCandidatePolicy.isAllowed('LR関羽', 'attendant'), false, 'LR must not be an attendant candidate');
assert.strictEqual(policyContext.window.HadoFormationCandidatePolicy.isAllowed('UR張飛', 'attendant'), true, 'UR must remain eligible for the global attendant gate');
assert.strictEqual(policyContext.window.HadoFormationCandidatePolicy.isAllowed('LR関羽', 'main_general'), true, 'LR must remain available for non-attendant roles');

const typeContext = {
  window: { HadoFormationCandidatePolicy: policyContext.window.HadoFormationCandidatePolicy },
  canonicalName: row => row.name,
  displayName: row => row.displayName || row.name,
};
vm.createContext(typeContext);
vm.runInContext(block(
  typeCandidates,
  '// HADO-3.0.0.0-TYPE-ATTENDANT-CANDIDATE-GATE-START',
  '// HADO-3.0.0.0-TYPE-ATTENDANT-CANDIDATE-GATE-END'
), typeContext);
assert.strictEqual(typeContext.typeCandidateRoleAllowed({ roleId: 'attendant', name: 'LR関羽' }, 'attendant'), false, 'type attendant list must exclude LR');
assert.strictEqual(typeContext.typeCandidateRoleAllowed({ roleId: 'attendant', name: 'UR張飛' }, 'attendant'), true, 'type attendant list must keep UR');

const roleIndex = JSON.parse(read('hadou_type_search_role_index.json'));
const roleRows = Array.isArray(roleIndex.items) ? roleIndex.items : [];
const lrAttendants = roleRows.filter(row => row.roleId === 'attendant' && /^LR/.test(String(row.displayName || row.name || row.sourceEntityKey || '')));
assert(lrAttendants.length > 0, 'fixture must prove the derived role index still contains raw LR attendant rows');
assert(typeCandidates.includes('source=roleSource.filter(v=>typeCandidateRoleAllowed(v,role))'), 'type candidate rows must pass through the shared role policy before scoring');
assert(formation.includes("if(role==='attendant')return destinations.filter(d=>d.kind==='attendant')"), 'candidate tray attendant role must keep attendant destinations only');
assert(formation.includes("renderFormationAddPopover(item,{roleId:row.roleId})"), 'candidate tray placement must preserve its selected role');
assert(formation.includes("candidateTray:add-rejected-by-role-policy"), 'candidate tray add must reject invalid role candidates');
for (const preservedRolePath of ['placeFormationCandidateTrayFormation', 'placeFormationCandidateTraySiegeWeapon', 'placeFormationCandidateTrayWarhorse']) {
  assert(formation.includes(`function ${preservedRolePath}`), `${preservedRolePath} must preserve the non-general candidate tray feature`);
}
assert(!indexHtml.includes('hado_candidate_tray_core.js'), 'duplicate candidate tray event handler must not be loaded');
assert(/hado_formation\.js\?v=[^"']+-r\d+/.test(indexHtml), 'formation runtime must keep a revisioned cache key without duplicating the visible Update string');
const versionSource = fs.readFileSync(path.join(root, 'hado_version.js'), 'utf8');
const releaseVersion = versionSource.match(/releaseVersion:\s*'([^']+)'/)?.[1];
const updateNo = versionSource.match(/updateNo:\s*'([^']*)'/)?.[1] || '';
const revision = versionSource.match(/revision:\s*(\d+)/)?.[1];
assert(releaseVersion && revision, 'runtime version and revision must be readable from hado_version.js');
const expectedCacheKey = `${updateNo || releaseVersion}-r${revision}`;
for (const asset of ['hado_type_candidates.js', 'hado_candidate_tray.js', 'hado_version.js']) {
  assert(indexHtml.includes(`${asset}?v=${expectedCacheKey}`), `${asset} must use the current centralized version cache key`);
}

console.log(`Update09.5.55 attendant candidate gate passed: raw LR attendant rows=${lrAttendants.length}, runtime visible=0`);
