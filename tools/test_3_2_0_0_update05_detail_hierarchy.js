const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const core = read('hado_core.js');
const formation = read('hado_formation.js');
const styles = read('hado_styles.css');
const index = read('index.html');
const version = read('hado_version.js');
const skills = JSON.parse(read('hadou_skills.json')).items;

function inOrder(source, tokens, label) {
  let cursor = -1;
  tokens.forEach((token) => {
    const next = source.indexOf(token, cursor + 1);
    assert(next > cursor, `${label}: ${token}`);
    cursor = next;
  });
}

assert(/updateNo:\s*'05'/.test(version), 'Update05 must be visible in Preview');
assert(/revision:\s*219/.test(version), 'Update05 Preview must use r219');
assert(index.includes('05-r219'), 'runtime assets must use the Update05 cache key');
assert(!index.includes('04-r218'), 'stale Update04 cache keys must be absent');

const generalTabsStart = core.indexOf("if(categoryKey==='generals')return [");
const generalTabsEnd = core.indexOf('];', generalTabsStart);
assert(generalTabsStart >= 0 && generalTabsEnd > generalTabsStart, 'general detail tabs must exist');
inOrder(core.slice(generalTabsStart, generalTabsEnd), [
  "key:'basic'",
  "key:'tactic'",
  "key:'skill'",
  "key:'related'",
  "key:'parameter'",
  "key:'other'"
], 'general detail order');
assert(core.includes("getDefaultDetailTabForCategory(categoryKey){return categoryKey==='generals'?'basic'"), 'general detail must open on basic information');

assert(core.includes('const referencedHtml=renderReferencedSkillGroup(embeddedEntries,parentSkillName);'), 'referenced skills must be grouped under their parent skill');
assert(core.includes('data-parent-skill='), 'parent skill cards must expose their hierarchy');
assert(core.includes('data-referenced-from='), 'referenced skill cards must expose their parent');
assert(core.includes('general-skill-reference-title'), 'referenced skills must have an explicit group label');
assert(core.includes('getReferencedSkillEntriesFromLines(filteredContent)'), 'references must follow the selected skill-level content');
assert(core.includes("renderAfterDescription:row=>renderEmbeddedSkillCards([row.text],skillName)"), 'direct skill references must switch with the selected level');
assert(core.includes("renderAfterDescription:row=>mayRenderReferences?renderEmbeddedSkillCards([row.text],parentSkillName):''"), 'general skill references must switch with the inspected level');

assert(core.includes("const primaryConditionHtml=levelHtml?'':condition.html;"), 'direct skill details must suppress the duplicate condition block');
assert(core.includes("<details class=\"detail-supplement\"><summary>補足情報</summary>"), 'secondary source information must be collapsed');
assert(core.includes("[levelHtml,primaryConditionHtml,stageHtml,supplementalHtml]"), 'direct skill details must render level-scoped description and references before supplements');

[
  '.general-skill-reference-group',
  '.general-skill-reference-title',
  '.referenced-skill-relation',
  '.detail-supplement',
  '.detail-supplement-body'
].forEach((selector) => assert(styles.includes(selector), `missing Update05 style ${selector}`));
assert(styles.includes('min-height:44px'), 'mobile supplement control must meet the touch target gate');

assert(formation.includes('renderSkillLevelToggleForItem'), 'formation skill descriptions must retain the shared skill-level presenter');
assert(core.includes('renderSkillLevelToggleForItem'), 'detail skill descriptions must retain the shared skill-level presenter');

const parent = skills.find((item) => String(item.name || '').endsWith('轟名'));
assert(parent, 'gold parent skill 轟名 must exist');
const parentText = JSON.stringify(parent.tables?.[0]?.rows?.[0] || []);
assert(parentText.includes('轟天Lv3'), '轟名 must retain the 轟天Lv3 reference');
assert(parentText.includes('盟主Lv2'), '轟名 must retain the 盟主Lv2 reference');
['轟天', '盟主'].forEach((name) => {
  assert(skills.some((item) => String(item.name || '').endsWith(name)), `referenced skill ${name} must resolve`);
});

console.log('3.2.0.0 Update05 detail hierarchy regression passed.');
