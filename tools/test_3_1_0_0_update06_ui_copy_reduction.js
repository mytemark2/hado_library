'use strict';

const assert = require('assert');
const fs = require('fs');
const evaluator = require('../hado_formation_condition_evaluator.js');
const presenter = require('../hado_detail_condition_presenter.js');

const clauses = JSON.parse(fs.readFileSync('hadou_effect_clauses.json', 'utf8'));
const skills = JSON.parse(fs.readFileSync('hadou_skills.json', 'utf8')).items || [];
evaluator.indexClauseData(clauses);

const skill = skills.find(item => item.name === '【三國志 覇道】克遂');
const levelTwo = skill.tables[0].rows.find(row => row[0] === 'Ⅱ')[1];
const cardHtml = presenter.renderHtml({ category: 'skills', name: '克遂', sourceTexts: [levelTwo] });
for (const redundant of ['適用条件と効果', '条件ごとに、その条件で有効になる効果をまとめています。', '<span>条件</span>', '<span>発動</span>', '<span>適用</span>', '補足：']) {
  assert(!cardHtml.includes(redundant), `skill card must hide redundant copy: ${redundant}`);
}
assert(cardHtml.includes('title="条件"'));
assert(cardHtml.includes('title="発動"'));
assert(cardHtml.includes('>原文</summary>'));

const indexHtml = fs.readFileSync('index.html', 'utf8');
const core = fs.readFileSync('hado_core.js', 'utf8');
const search = fs.readFileSync('hado_search.js', 'utf8');
const formation = fs.readFileSync('hado_formation.js', 'utf8');
const styles = fs.readFileSync('hado_styles.css', 'utf8');
const version = fs.readFileSync('hado_version.js', 'utf8');

for (const redundant of [
  '技能データ参照', '付与Lv:', 'Enterで履歴登録', '分類で絞って状態変化を選択',
  '軍馬の作成・編集・削除を行います。', '切り替え時だけ必要な設定を選択します。',
  '未保存の武将・装備を含めた理論値で検索・編成します。',
  '登録済み武将・装備・部隊編成を基準に表示します。',
  'ガイド再表示やログ確認を行います。通常操作では閉じたままで構いません。',
  '保存データ・部隊・検索履歴の状態を必要な時だけ確認します。'
]) {
  assert(!indexHtml.includes(redundant), `default screen must hide redundant copy: ${redundant}`);
}
assert(indexHtml.includes('title="Enterで検索履歴に登録"'));
assert(indexHtml.includes('id="fileSettingsJsonLoadNote"></div>'));
assert(indexHtml.includes('Import前は、必要に応じてExportでバックアップしてください。'), 'data-loss warning must remain visible');
assert(indexHtml.includes('スタートガイド'), 'explanations must remain available in the guide');
assert(!core.includes('技能データ参照'));
assert(!core.includes('付与Lv:'));
assert(core.includes("if(note){note.textContent='';note.hidden=true;}"));
assert(search.includes("info.innerHTML='';info.hidden=true"));
assert(search.includes("info.title=norm(preset.description||'')"));
assert(styles.includes('.type-search-preset-info[hidden]{display:none!important}'));
assert(!formation.includes('各部隊に兵器・武装を1つずつ指定できます。'));
assert(!formation.includes('現在の設定：'));
assert(!formation.includes('編成による加算値・タップで根拠表示'));
assert(formation.includes('title="選択すると根拠を表示"'));
assert(version.includes('revision: 192'));
assert(indexHtml.includes('3.1.0.0-r192'));

console.log('Update06 UI copy reduction ok: skill/search/data/formation default screens compact; guide, tooltips, and warning retained');
