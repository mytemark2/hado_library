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
assert(html.match(/data-skill-level="Ⅱ"><p>Lv2<\/p>/), 'current level panel must be visible');
assert(html.match(/data-skill-level="Ⅰ" hidden>/), 'other level panel must be hidden');

const attributes = new Map([
  ['data-skill-level-target', 'skill-panel-test'],
  ['aria-expanded', 'true'],
  ['aria-pressed', 'true']
]);
const panel = { hidden: false };
let clickHandler = null;
const button = {
  dataset: {},
  getAttribute: name => attributes.get(name) || '',
  setAttribute: (name, value) => attributes.set(name, value),
  classList: { toggle: (_name, value) => { button.active = value; } },
  addEventListener: (name, handler) => { if (name === 'click') clickHandler = handler; },
  closest: () => ({ querySelector: selector => selector === '#skill-panel-test' ? panel : null })
};
const root = { querySelectorAll: () => [button] };
assert.strictEqual(api.bind(root), 1);
assert(clickHandler, 'toggle click handler must be bound');
clickHandler();
assert.strictEqual(panel.hidden, true, 'clicking an open level hides its description');
assert.strictEqual(attributes.get('aria-expanded'), 'false');
clickHandler();
assert.strictEqual(panel.hidden, false, 'clicking a closed level shows its description');
assert.strictEqual(attributes.get('aria-expanded'), 'true');

const core = fs.readFileSync(path.join(ROOT, 'hado_core.js'), 'utf8');
const formation = fs.readFileSync(path.join(ROOT, 'hado_formation.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'hado_styles.css'), 'utf8');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(core.includes('renderSkillLevelToggleForItem({skillName:sec.title'), 'general skill cards use shared level toggles');
assert(core.includes("idPrefix:'referenced-skill-level'"), 'referenced skill cards use shared level toggles');
assert(core.includes("idPrefix:'skill-detail-level'"), 'direct skill details use shared level toggles');
assert(formation.includes('renderFormationSkillLevelToggleHtml(row)'), 'formation selected-skill cards use shared level toggles');
assert(formation.includes('HADO_SKILL_LEVEL_TOGGLE?.bind'), 'formation and detail rendering bind level toggles');
assert(css.includes('.skill-level-toggle.is-active'));
assert(css.includes('.formation-selected-skill-list.has-skill-descriptions'));
assert(index.indexOf('hado_skill_level_toggle.js') < index.indexOf('hado_core.js'));
assert(index.indexOf('hado_skill_level_toggle.js') < index.indexOf('hado_formation.js'));

console.log('skill level toggle ok: current level open / other levels hidden / independent toggle / general and formation shared');
