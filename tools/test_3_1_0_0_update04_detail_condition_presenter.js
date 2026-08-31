'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const evaluator = require('../hado_formation_condition_evaluator.js');
const presenter = require('../hado_detail_condition_presenter.js');

const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'hadou_effect_clauses.json'), 'utf8'));
evaluator.indexClauseData(data);

const reviewedCaseIds = new Set(data.reviewedCases.map(row => row.caseId));
const renderedCaseIds = new Set();
for (const item of data.items) {
  const view = presenter.buildViewModel({ category: item.category, name: item.name });
  view.groups.forEach(group => group.rows.forEach(row => row.caseIds.forEach(id => renderedCaseIds.add(id))));
}
for (const id of reviewedCaseIds) assert(renderedCaseIds.has(id), `reviewed case must be rendered: ${id}`);
assert.strictEqual(reviewedCaseIds.size, 44);

const yuanSource = data.reviewedCases.find(row => row.caseId === 'yuan-main-double').clause.evidence.rawText;
const yuan = presenter.buildViewModel({ category: 'generals', name: 'LR袁紹（えんしょう）', sourceTexts: [yuanSource] });
assert.strictEqual(yuan.reviewedCaseCount, 4);
assert.strictEqual(yuan.groups.length, 1);
assert.strictEqual(yuan.groups[0].rows.length, 4);
assert(yuan.groups[0].rows.some(row => row.conditions.join('|') === '主将|兵力50%以上' && row.effectText.includes('250% → 700%')));
const yuanHtml = presenter.renderHtml({ category: 'generals', name: 'LR袁紹（えんしょう）', sourceTexts: [yuanSource] });
assert(yuanHtml.includes('data-condition-trust="reviewed"'));
assert(yuanHtml.includes('原文を表示'));
assert(!/戦法威力 250% → 700%<\/div>\s*<div class="detail-condition-semantics">[^]*常時/.test(yuanHtml), '700% must not be presented as an always-active effect');

const generatedSkill = data.items.find(item => item.category === 'skills' && item.clauses.some(clause => clause.trust.state === 'generated' && clause.when));
assert(generatedSkill, 'a generated-only skill fixture is required');
const generatedEvidence = generatedSkill.clauses.find(clause => clause.when).evidence.rawText;
const fallback = presenter.buildViewModel({ category: 'skills', name: generatedSkill.name, sourceTexts: [generatedEvidence] });
assert.strictEqual(fallback.fallback, false, 'explicit source markers are safe to group without inferring semantic conditions');
const fallbackHtml = presenter.renderHtml({ category: 'skills', name: generatedSkill.name, sourceTexts: [generatedEvidence] });
assert(fallbackHtml.includes('data-condition-trust="source"'));
assert(fallbackHtml.includes('detail-effect-group'));
assert(!fallbackHtml.includes('未確認データを推測せず'));

const css = fs.readFileSync(path.join(ROOT, 'hado_update04.css'), 'utf8');
assert(css.includes('@media(max-width:760px)'));
assert(css.includes('overflow-wrap:anywhere'));
assert(css.includes('.detail-effect-group>header{display:grid'));
assert(css.includes('.detail-effect-group>ul'));

console.log('Update04 detail presenter ok: 44 reviewed cases / LR袁紹 gated 700% / marked-source grouping / mobile CSS');
