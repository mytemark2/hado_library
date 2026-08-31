'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const toggleSource = fs.readFileSync(path.join(ROOT, 'hado_skill_level_toggle.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(toggleSource, context, { filename: 'hado_skill_level_toggle.js' });
const api = context.window.HADO_SKILL_LEVEL_TOGGLE;
assert(api, 'shared skill level toggle API must be available');

const skillsDocument = JSON.parse(fs.readFileSync(path.join(ROOT, 'hadou_skills.json'), 'utf8'));
const skills = skillsDocument.items;
const romanLevels = new Set(['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ']);
const placeholderPattern = /^[-－—―‐‑‒–]+$/;
let sourceLevelRowCount = 0;
let availableLevelRowCount = 0;
let placeholderLevelRowCount = 0;
let placeholderSkillCount = 0;
for (const skill of skills) {
  const sourceRows = (skill.tables?.[0]?.rows || [])
    .filter(row => Array.isArray(row) && romanLevels.has(String(row[0] || '').trim()))
    .map(row => ({ level: row[0], text: row.slice(1).join(' ') }));
  sourceLevelRowCount += sourceRows.length;
  const placeholders = sourceRows.filter(row => placeholderPattern.test(String(row.text || '').trim()));
  if (placeholders.length) placeholderSkillCount += 1;
  placeholderLevelRowCount += placeholders.length;
  const normalizedRows = api.normalizeRows(sourceRows);
  availableLevelRowCount += normalizedRows.length;
  assert(normalizedRows.every(row => !placeholderPattern.test(row.text.trim())), `${skill.name}: placeholder levels must not reach the toggle UI`);
  assert.deepStrictEqual(
    Array.from(normalizedRows, row => row.level),
    sourceRows.filter(row => String(row.text || '').trim() && !placeholderPattern.test(String(row.text || '').trim())).map(row => String(row.level).trim()),
    `${skill.name}: toggle levels must exactly match levels with real descriptions`
  );
}
assert.strictEqual(skills.length, Number(skillsDocument.meta?.count), 'all canonical skill definitions must be audited, including future crawler additions');
assert.strictEqual(sourceLevelRowCount, availableLevelRowCount + placeholderLevelRowCount, 'every source level row must be classified as available or unavailable');
assert(placeholderSkillCount > 0 && placeholderLevelRowCount > 0, 'the full-data audit must include unavailable level placeholders');

const html = api.build({
  skillName: '白眉',
  currentLevel: 'Ⅱ',
  rows: [
    { level: 'Ⅰ', text: 'Lv1', html: '<p>Lv1</p>' },
    { level: 'Ⅱ', text: 'Lv2', html: '<p>Lv2</p>' },
    { level: 'Ⅲ', text: 'Lv3', html: '<p>Lv3</p>' }
  ],
  renderDescription: row => row.html
});
assert.strictEqual((html.match(/class="skill-level-toggle/g) || []).length, 4, 'one row wrapper and three level buttons are rendered');
assert(html.includes('class="skill-level-toggle is-active"'));
assert(html.includes('>Ⅱ</button>'));
assert(html.match(/aria-expanded="true"[^>]*>Ⅱ<\/button>/), 'current level must be expanded initially');
assert(html.match(/aria-expanded="false"[^>]*>Ⅰ<\/button>/), 'other levels must be collapsed initially');
assert(html.includes('role="radiogroup"'), 'level choices must expose single-selection semantics');
assert(html.match(/aria-checked="true"[^>]*>Ⅱ<\/button>/), 'current level must be the selected radio choice');
assert(html.match(/data-skill-level="Ⅱ"><p>Lv2<\/p>/), 'current level panel must be visible');
assert(html.match(/data-skill-level="Ⅰ" hidden>/), 'other level panel must be hidden');

const limitedHtml = api.build({
  skillName: '白眉',
  currentLevel: 'Ⅱ',
  rows: [
    { level: 'Ⅰ', text: 'Lv1' },
    { level: 'Ⅱ', text: 'Lv2' },
    { level: 'Ⅲ', text: '-' },
    { level: 'Ⅳ', text: '－' },
    { level: 'Ⅴ', text: '—' }
  ]
});
assert.deepStrictEqual(Array.from(limitedHtml.matchAll(/class="skill-level-toggle(?: is-active)?"[^>]*>([^<]+)<\/button>/g), match => match[1]), ['Ⅰ', 'Ⅱ']);
assert(!limitedHtml.includes('>Ⅲ</button>') && !limitedHtml.includes('>Ⅳ</button>') && !limitedHtml.includes('>Ⅴ</button>'), 'levels without real descriptions must not render');

const makeButton = (id, selected) => {
  const attributes = new Map([
    ['data-skill-level-target', id],
    ['aria-expanded', selected ? 'true' : 'false'],
    ['aria-pressed', selected ? 'true' : 'false'],
    ['aria-checked', selected ? 'true' : 'false']
  ]);
  const button = {
    dataset: {},
    attributes,
    getAttribute: name => attributes.get(name) || '',
    setAttribute: (name, value) => attributes.set(name, value),
    classList: { toggle: (_name, value) => { button.active = value; } },
    addEventListener: (name, handler) => { if (name === 'click') button.clickHandler = handler; }
  };
  return button;
};
const panelI = { hidden: false };
const panelII = { hidden: true };
const buttonI = makeButton('skill-panel-i', true);
const buttonII = makeButton('skill-panel-ii', false);
const buttons = [buttonI, buttonII];
const scope = {
  querySelectorAll: () => buttons,
  querySelector: selector => selector === '#skill-panel-i' ? panelI : (selector === '#skill-panel-ii' ? panelII : null)
};
buttons.forEach(button => { button.closest = () => scope; });
const root = { querySelectorAll: () => buttons };
assert.strictEqual(api.bind(root), 2);
assert(buttonI.clickHandler && buttonII.clickHandler, 'single-selection handlers must be bound');
buttonII.clickHandler();
assert.strictEqual(panelI.hidden, true, 'selecting level II hides level I');
assert.strictEqual(panelII.hidden, false, 'selecting level II shows only level II');
assert.strictEqual(buttonI.attributes.get('aria-checked'), 'false');
assert.strictEqual(buttonII.attributes.get('aria-checked'), 'true');
buttonII.clickHandler();
assert.strictEqual(panelII.hidden, false, 'selecting the current level again must keep it visible');
assert.strictEqual(buttonII.attributes.get('aria-expanded'), 'true');

const core = fs.readFileSync(path.join(ROOT, 'hado_core.js'), 'utf8');
const formation = fs.readFileSync(path.join(ROOT, 'hado_formation.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'hado_styles.css'), 'utf8');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(core.includes('renderSkillLevelToggleForItem({skillName:sec.title'), 'general skill cards use shared level toggles');
assert(core.includes("idPrefix:'referenced-skill-level'"), 'referenced skill cards use shared level toggles');
assert(core.includes("idPrefix:'skill-detail-level'"), 'direct skill details use shared level toggles');
assert(core.includes('renderGeneralSkillLevelBadge(currentLevel)'), 'general skill cards show the effective skill level at the top right');
assert(core.includes("renderGeneralSkillLevelBadge(entry?.level||'','付与される技能レベル')"), 'referenced skill cards show the granted level at the top right');
assert(formation.includes('renderFormationSkillLevelToggleHtml(row)'), 'formation selected-skill cards use shared level toggles');
assert(formation.includes('aria-label="この枠の有効技能レベル">Lv${esc(lv)}'), 'formation selected-skill cards show their effective level beside the skill name');
assert(formation.includes('HADO_SKILL_LEVEL_TOGGLE?.bind'), 'formation and detail rendering bind level toggles');
assert(core.includes('.filter(isAvailableSkillLevelRow)'), 'all core display paths filter unavailable level rows before rendering');
assert(css.includes('.skill-level-toggle.is-active'));
assert(css.includes('.formation-selected-skill-list.has-skill-descriptions'));
assert(index.indexOf('hado_skill_level_toggle.js') < index.indexOf('hado_core.js'));
assert(index.indexOf('hado_skill_level_toggle.js') < index.indexOf('hado_formation.js'));

console.log(`skill level selector ok: ${skills.length} skills / ${availableLevelRowCount} available levels / ${placeholderLevelRowCount} unavailable placeholders excluded / exactly one visible level / effective-level badges / general and formation shared`);
