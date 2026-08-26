'use strict';

const assert = require('assert');
const fs = require('fs');
const evaluator = require('../hado_formation_condition_evaluator.js');
const presenter = require('../hado_detail_condition_presenter.js');
const integration = require('../hado_search_clause_integration.js');

const clauseData = JSON.parse(fs.readFileSync('hadou_effect_clauses.json', 'utf8'));
const skillData = JSON.parse(fs.readFileSync('hadou_skills.json', 'utf8'));
const featureData = JSON.parse(fs.readFileSync('hadou_type_search_feature_index.json', 'utf8'));
const relatedData = JSON.parse(fs.readFileSync('hadou_related_link_index.json', 'utf8'));
const statusData = JSON.parse(fs.readFileSync('hadou_status_effects.json', 'utf8'));
evaluator.indexClauseData(clauseData);
integration.indexData({ effectClauses: clauseData, typeSearchFeatureIndex: featureData, relatedLinkIndex: relatedData, statusEffects: statusData });

const skill = skillData.items.find(item => item.name === '【三國志 覇道】克遂');
assert(skill, '克遂 fixture is required');
const levelTwo = skill.tables[0].rows.find(row => row[0] === 'Ⅱ')?.[1];
assert(levelTwo && levelTwo !== '-', '克遂 LvⅡ source is required');

const view = presenter.buildViewModel({ category: 'skills', name: '克遂', sourceTexts: [levelTwo] });
assert.strictEqual(view.displaySources.length, 1, 'one selected skill level must produce one display source');
const display = view.displaySources[0];
assert.strictEqual(display.groups.length, 5, '克遂 LvⅡ must render as five condition/trigger groups');
assert.deepStrictEqual(display.groups.map(group => group.qualifiers.map(row => row.label).join('・')), [
  '常時',
  '主将か、主将と自身が好相性の際',
  '交戦開始時',
  '主将の際',
  '副将か補佐の際'
]);
assert.strictEqual(display.groups[0].effects.length, 1);
assert(display.groups[0].effects[0].text.includes('政治の20%'));
assert.strictEqual(display.groups[1].effects.length, 4, 'main/affinity condition must own all four following effects');
assert(display.groups[1].effects.some(row => row.text.includes('知力+1000')));
assert(display.groups[1].effects.some(row => row.text.includes('ダメージの上限が5000')));
assert(display.groups[1].effects.some(row => row.text.includes('有利激攻/有利巧守')));

const html = presenter.renderHtml({ category: 'skills', name: '克遂', sourceTexts: [levelTwo] });
assert(!html.includes('適用条件と効果'));
assert(!html.includes('条件ごとに、その条件で有効になる効果をまとめています。'));
assert.strictEqual((html.match(/<summary [^>]*>原文<\/summary>/g) || []).length, 1, 'compact raw source toggle must appear once per skill level');
assert(!html.includes('<span>条件</span>'));
assert(!html.includes('<span>発動</span>'));
assert(!html.includes('<span>適用</span>'));
assert(!html.includes('補足：'));
assert(!html.includes('確認済み'));
assert(!html.includes('detail-semantic-chip'));
assert(!html.includes('自部隊が比較優位'));
assert(!html.includes('正規ID一致'));

assert(integration.getEntityTags('generals', 'LR袁紹（えんしょう）').includes('条件:主将'), 'Clause tags remain available to search/filter internals');
const canonical = integration.getCanonicalStatusMatches({ category: 'generals', name: 'LR馬良（ばりょう）', statusName: '有利激攻', groupKey: 'selfAbilityBuff' });
assert(canonical.some(row => row.statusEffectKey === 'statusEffects:12'), 'canonical status matching remains available internally');
assert.strictEqual(integration.renderResultHtml, undefined);

const statusSource = fs.readFileSync('hado_status_effects.js', 'utf8');
const css = fs.readFileSync('hado_update04.css', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(!statusSource.includes('renderResultHtml'));
assert(css.includes('.detail-effect-group'));
assert(css.includes('@media(max-width:760px)'));
assert(!indexHtml.includes('hado_update06.css'));
assert(indexHtml.includes('3.1.0.0-r190'));
assert(!indexHtml.includes('06-r180'));

console.log('Update06 user-facing cards ok: 克遂 LvⅡ 5 groups / compact labels / one raw toggle');
