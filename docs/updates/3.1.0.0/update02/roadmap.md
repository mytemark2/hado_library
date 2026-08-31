# 3.1.0.0 Update02 Roadmap — Condition Registry / EffectClause正式仕様

## 状態

完了。Update01の全件センサス44 taxonomy型を正式Registryへ移し、EffectClause 1.0と5状態Evaluator契約、44件のgold fixtureを確定した。

## 推奨エンジン

GPT-5.6 Sol / reasoning high。schema間の整合、boolean評価優先順位、将来consumerとの境界を同時に扱うため。未解決の設計矛盾が残る場合のみxhigh相当へ引き上げる。

## 起点

- 正本ブランチ: `feature/app-3.1.0.0`
- 起点Commit: `1567e86655e3c5adf0671ed4c67b00451fc8fbee`
- 起点表示版: `3.1.0.0 Update01 r172`
- 完了表示版: `3.1.0.0 Update02 r173`

## 目的

Update01で確認した全条件型を表現できる正式schemaとEvaluator契約を確定する。UI表示、編成判定、検索、型評価が後続Updateで同じClauseを利用できる境界を作る。

## 正式契約

1. Registryはcondition / trigger / context / modifier / limit / reset / suppression / targetingを別groupとして保持する。
2. EffectClauseはcontext / trigger / when / target / effect / modifier / limit / reset / priority / suppression / evidence / trustを持つ。
3. boolean式は`all` / `any` / `not` / `predicate`で表現する。
4. modifierは`effectId`で親効果へ接続し、baseとoverrideを同一effect identityで扱う。
5. evidenceは元カテゴリ、元実体、record/unit locator、原文、原文SHA-256を持つ。
6. trustは`unparsed` / `generated` / `reviewed` / `verified`を扱う。
7. 評価結果は`met` / `unmet` / `deferred` / `not_applicable` / `unknown`の5状態とする。

## Evaluator優先規則

- AND: 明示的不成立を最優先し、その後unknown、deferred、not_applicable、metの順で確定する。
- OR: 成立を最優先し、その後unknown、deferredを扱う。全分岐が対象外の場合のみnot_applicableとする。
- NOT: metとunmetだけを反転し、他の3状態は維持する。
- 外部任命等は部隊編成でunmetにせずnot_applicableとする。
- 戦闘中の事実が必要で編成時に判定できない場合はdeferredとする。

## 非対象

- クローラーからの全件EffectClause生成はUpdate03。
- 詳細UIはUpdate04。
- 部隊編成への実Evaluator接続はUpdate05。
- scoreEvidence切替はUpdate07 shadow比較後。
- 正式公開・配布用ZIP作成は全Update完了後。

## 完了ゲート

- [x] Update01 taxonomy 44型とRegistryが完全一致する。
- [x] 44件のgold setをEffectClauseで表現する。
- [x] 自由文patch用フィールドを使用しない。
- [x] 全modifier/limit/reset/suppression/target ruleが親effectIdを持つ。
- [x] AND/OR/NOTと5状態を自動検証する。
- [x] base/overrideが同一effect identityを共有する。
- [x] raw text/evidence/trust/fallback契約を固定する。
- [x] runtime UI、既存JSON、保存schema、scoreEvidenceを変更しない。

## 確認事項

なし。次のUpdate03では、クローラーの正規生成経路からEffectClauseを決定的に生成し、未分類・孤立condition/effect・base/override二重計上を品質ゲートへ追加する。
