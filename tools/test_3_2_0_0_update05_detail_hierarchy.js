const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const core = read('hado_core.js');
const formation = read('hado_formation.js');
const search = read('hado_search.js');
const status = read('hado_status_effects.js');
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

assert(/updateNo:\s*'08'/.test(version), 'the current development stage must be visible in Preview');
assert(/revision:\s*228/.test(version), 'the current Preview revision must be r228');
assert(index.includes('08-r228'), 'runtime assets must use the current Preview cache key');
assert(!index.includes('04-r218'), 'stale Update04 cache keys must be absent');

const generalTabsStart = core.indexOf("if(categoryKey==='generals')return [");
const generalTabsEnd = core.indexOf('];', generalTabsStart);
assert(generalTabsStart >= 0 && generalTabsEnd > generalTabsStart, 'general detail tabs must exist');
inOrder(core.slice(generalTabsStart, generalTabsEnd), [
  "key:'related'",
  "key:'parameter'",
  "key:'basic'",
  "key:'tactic'",
  "key:'skill'",
  "key:'other'"
], 'general detail order');
assert(core.includes("getDefaultDetailTabForCategory(categoryKey){return categoryKey==='generals'?'related'"), 'general detail must restore the Update04 overview default');
assert(core.slice(generalTabsStart, generalTabsEnd).includes("key:'related',label:'概要'"), 'the restored first tab must retain the familiar overview label');

assert(core.includes('renderReferencedSkillCardsFlat'), 'referenced skills must be rendered as peer cards');
assert(core.includes('general-skill-flat-scope'), 'parent and granted skills must share one visual list');
assert.strictEqual((core.match(/renderReferencedSkillGroup\(/g) || []).length, 0, 'nested reference group renderer must be removed');
assert(core.includes('data-parent-skill='), 'parent skill cards must expose their hierarchy');
assert(core.includes('data-referenced-from='), 'referenced skill cards must expose their parent');
assert(core.includes('getReferencedSkillEntriesFromLines(filteredContent)'), 'references must follow the selected skill-level content');
assert(core.includes('renderReferencedSkillLevelPanels(rows,scoped.targetLevel'), 'direct skill references must provide level-linked peer panels');
assert(core.includes('renderReferencedSkillLevelPanels(levelRows,currentLevel'), 'general skill references must provide level-linked peer panels');
assert(core.includes('bindFlatReferencedSkillLevelPanels'), 'level buttons must synchronize the peer reference cards');

assert(core.includes('renderGeneralDecisionSummary'), 'general identity must remain visible above tabs');
assert(formation.includes('detailDecisionSummaryHtml'), 'general decision summary must be rendered in the detail header');
assert(formation.includes('detailMatchContextHtml'), 'keyword match reason must be rendered in the detail header');
assert(search.includes('keywordMatchTab'), 'search result rows must retain the matching destination tab');
assert(status.includes('resolveDetailTabForSelection'), 'selection flow must resolve the user-purpose tab');
assert(status.includes('detailLastTabByCategory'), 'manual tab choice must be remembered by category');
assert(status.includes('detailActiveTab:state.detailActiveTab'), 'operation history must retain the active detail tab');
assert(core.includes("pushOperationHistory('detail-tab')"), 'manual tab changes must create a restorable history step');
const autoSelectValidationStart = core.indexOf('function validateSkillDetailAutoSelectTabPolicySmoke(){');
const autoSelectValidationEnd = core.indexOf('\nfunction renderTacticDetail(', autoSelectValidationStart);
const autoSelectValidation = core.slice(autoSelectValidationStart, autoSelectValidationEnd);
assert(autoSelectValidation.includes('applyResultRowDetailSelection'), 'browser validation must exercise the functional search selection path');
assert(autoSelectValidation.includes("keyword auto select outranks remembered parameter tab"), 'browser validation must cover keyword priority over remembered tabs');
assert(!autoSelectValidation.includes('String(renderSearchResults'), 'browser validation must not infer behavior from stale function-source strings');

assert(core.includes("const primaryConditionHtml=levelHtml?'':condition.html;"), 'direct skill details must suppress the duplicate condition block');
assert(core.includes("<details class=\"detail-supplement\"><summary>補足情報</summary>"), 'secondary source information must be collapsed');
assert(core.includes("[levelHtml,primaryConditionHtml,stageHtml,supplementalHtml]"), 'direct skill details must render level-scoped description and references before supplements');

[
  '.general-skill-flat-scope',
  '.skill-reference-level-panel',
  '.referenced-skill-relation',
  '.detail-match-context',
  '.detail-decision-summary',
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
