# 3.1.0.0 Update04 Roadmap — 戦法・技能詳細UI

## 状態

`3.1.0.0 Update04 r177`として実装・Preview検証中。Update04完了後、保持中のUpdate05を再開する。正式公開は行わない。

## 目的

EffectClauseの条件・効果関係を詳細画面で読みやすく表示し、原文を証跡として折り畳みで残す。

## trust境界

- 構造化主表示は、Update02のgold fixtureと一致する44 reviewed casesだけを使う。
- 24,329 generated clausesは断定表示しない。
- reviewed casesがない条件文は「構造化確認中」と明示し、既存の原文表示を維持する。
- 詳細表示と部隊編成は同じ`hado_formation_condition_evaluator.js`の索引APIを共有する。

## 完了ゲート

1. 44 reviewed casesを詳細presenterで欠落なく表示できる。
2. LR袁紹の700%を`主将`かつ`兵力50%以上`として表示する。
3. 原文はデフォルト折り畳みで確認できる。
4. generated-onlyデータは原文フォールバックになる。
5. PC/スマホの実画面で折返し・横はみ出し・折り畳み操作を確認する。
6. App Validation、PR、Actions、Preview marker、公開Pages実操作が合格する。

## 確認事項

なし。Update04完了後はUpdate05を再開する。推奨エンジンはGPT-5.6 Sol / reasoning High。
