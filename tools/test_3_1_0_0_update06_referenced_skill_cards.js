'use strict';

const assert = require('assert');
const fs = require('fs');
const evaluator = require('../hado_formation_condition_evaluator.js');
const presenter = require('../hado_detail_condition_presenter.js');

const skills = JSON.parse(fs.readFileSync('hadou_skills.json', 'utf8')).items || [];
const clauses = JSON.parse(fs.readFileSync('hadou_effect_clauses.json', 'utf8'));
const cleanName = value => String(value || '').replace(/^【三國志 覇道】/, '').trim();
const romanLevels = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'];
const referencePattern = /(?:^|[■●\s　])([一-鿿々ぁ-んァ-ヶーA-Za-z0-9]+?)Lv([1-9]|10)を付与（この技能を持つ武将が所持しているものとして扱う）/g;
const skillMap = new Map(skills.map(item => [cleanName(item.name), item]));
const relations = new Map();

for (const item of skills) {
  for (const table of item.tables || []) {
    for (const row of table.rows || []) {
      const source = (Array.isArray(row) ? row : []).join(' ');
      for (const match of source.matchAll(referencePattern)) {
        const relation = { parent: cleanName(item.name), target: match[1], levelNumber: Number(match[2]) };
        relations.set(`${relation.parent}>${relation.target}>${relation.levelNumber}`, relation);
      }
    }
  }
}

assert(relations.size >= 200, 'the full referenced-skill corpus must remain covered');
assert(new Set([...relations.values()].map(row => row.parent)).size >= 122);
assert(new Set([...relations.values()].map(row => row.target)).size >= 112);
evaluator.indexClauseData(clauses);

for (const relation of relations.values()) {
  const target = skillMap.get(relation.target);
  assert(target, `referenced skill data must exist: ${relation.parent} -> ${relation.target}`);
  const level = romanLevels[relation.levelNumber - 1];
  assert(level, `supported referenced skill level is required: ${relation.target} Lv${relation.levelNumber}`);
  const levelRow = (target.tables || []).flatMap(table => table.rows || []).find(row => row?.[0] === level && row?.[1] && row[1] !== '-');
  assert(levelRow, `referenced level source must exist: ${relation.target} ${level}`);
  const view = presenter.buildViewModel({ category: 'skills', name: relation.target, sourceTexts: [levelRow[1]] });
  assert.strictEqual(view.displaySources.length, 1, `one granted level must render once: ${relation.target} ${level}`);
  assert(view.displaySources[0].groups.length > 0, `condition/effect groups are required: ${relation.target} ${level}`);
  const html = presenter.renderHtml({ category: 'skills', name: relation.target, sourceTexts: [levelRow[1]] });
  assert.strictEqual((html.match(/<summary [^>]*>原文<\/summary>/g) || []).length, 1, `compact raw source toggle must appear once: ${relation.target} ${level}`);
}

const whiteBrow = skillMap.get('白眉');
const whiteBrowLevelOne = whiteBrow.tables.flatMap(table => table.rows || []).find(row => row?.[0] === 'Ⅰ')[1];
const whiteBrowView = presenter.buildViewModel({ category: 'skills', name: '白眉', sourceTexts: [whiteBrowLevelOne] });
assert.deepStrictEqual(whiteBrowView.displaySources[0].groups.map(group => group.effects.length), [2, 1]);
assert.deepStrictEqual(whiteBrowView.displaySources[0].groups.map(group => group.qualifiers[0].label), ['主将か、主将と自身が好相性の際', '出陣時']);

const core = fs.readFileSync('hado_core.js', 'utf8');
const css = fs.readFileSync('hado_update04.css', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(core.includes('item:skillItem'), 'resolved referenced skill item must be retained for the shared presenter');
assert(core.includes('function renderReferencedSkillCard(entry)'));
assert(core.includes("buildDetailConditionPresentation(entry?.item||{name:entry?.name||''},'skills'"));
assert(core.includes('getReferencedSkillLevelContent(entry)'));
assert(core.includes('condition.grouped?condition.html'));
assert(core.includes('cards.push(renderReferencedSkillCard(entry))'));
assert(!core.includes('fmtContent(entry.content)'), 'referenced cards must not bypass the shared presenter with all-level raw content');
assert(!core.includes('技能データ参照'));
assert(!core.includes('付与Lv:'));
assert(css.includes('.referenced-skill-card{background:#f8fafc}'));
assert(indexHtml.includes('hado_core.js?v=3.1.0.0-r194'));
assert(!indexHtml.includes('06-r182'));

console.log(`Update06 referenced-skill cards ok: ${relations.size} relations / 白眉 2 groups / shared presenter / one granted level only`);
