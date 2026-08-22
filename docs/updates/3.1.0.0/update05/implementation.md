# 3.1.0.0 Update05 Implementation

## trust境界の恒久対策

Update03では、全件パーサー生成Clauseがgoldと同じsource unit・semantic typeを持つだけで`reviewed`へ昇格していた。boolean構造、fact、comparator、期待値はgold fixtureと異なるため、確定Evaluator入力にはできない。

クローラー1.1.0.5では全件パーサー出力を常に`generated`とし、Update02の正式gold 44件を`reviewedCases`へ構造ごと収録する。アプリは`reviewedCases`だけを成立/不成立へ確定し、残り24,329生成Clauseは判定不可として件数を表示する。

## runtime構成

- `hado_condition_model.js`: Update02の5状態Evaluator契約。
- `hado_formation_condition_evaluator.js`: 正式Registryと編成fact adapter。DOMや保存データへ依存しない。
- `hado_formation.js`: 現在編成snapshotを作り、条件タブへ評価結果を描画する。
- `hado_bootstrap.js`: `hadou_effect_clauses.json`を必須runtime JSONとして読み込み、44 reviewedケースを検証・索引化する。
- `hado_update05.css`: Update05固有UI。HTML内JavaScript/CSSは増やさない。

## fact方針

- 配置: 主将・副将・補佐・侍従をsource武将単位で解決。
- 好相性: 現在主将とsource武将の相性マスタから解決。
- 武将集合: 現在の主将・副将・補佐・侍従名から解決。
- 兵科: 現在主将の部隊兵科を正式値へ変換。
- 編制時能力値: 主将・副将・補佐5枠の現在能力値合計。
- 兵器: 現在編成の兵器選択有無。
- 戦闘中fact: 保存・推測せず未提供にし、Registry phaseからdeferredへ解決。
- 任命: formation surface外のためnot_applicable。

## 保存互換

評価結果は`state.diagnostics.formationConditions`と描画DOMだけに保持する。`sanitizeFormationRecord`、localStorage、Export/Import schemaへフィールドを追加しない。

## 生成JSON

クローラー1.1.0.5で21派生JSONを一括再生成した。EffectClauseは1,810 records / 24,329 generated clauses / 44 reviewed cases。個別JSONは手編集していない。
