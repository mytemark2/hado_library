# 3.1.0.0 Update06 Implementation

## 実装方針

- `hado_search_clause_integration.js`: Update04/05と同じPresenter/Evaluatorを読み、reviewed Clauseの条件・発動タグと正規状態変化IDを一つの検索サマリーへ統合する。
- `hado_status_effects.js`: Clauseタグを既存タグ索引へ非破壊で追加し、タグ検索と通常全文検索の補助語に使う。結果カードには内部診断情報を表示しない。
- `hado_search.js`: 個別状態変化検索で正規ID一致を既存名称・原文検出より先に採用し、検索キャッシュへClauseデータ世代を含める。照合理由とIDは内部判定に限定する。
- `hado_bootstrap.js`: EffectClause索引確定直後にUpdate06統合索引を初期化し、診断情報へ件数と契約版を記録する。
- `hado_detail_condition_presenter.js`: 技能原文の`■`・`▼`・`●`を用い、条件または発動契機を見出し、その直後の効果を同じグループにまとめる。原文開閉は技能Lvごとに1つだけ表示する。
- `hado_update04.css`: 条件見出しと効果一覧が一体に見えるカードへ変更し、PC/スマートフォンの折返しを維持する。
- `hado_update06.css`: 結果カード用の内部診断チップを廃止したため削除する。

## 信頼境界

1. `条件:*`と`発動:*`は44件のreviewed EffectClauseからのみ作る。
2. generated Clauseは`trust: generated`のまま保持し、検索タグへ昇格しない。
3. 状態変化所有者は`statusEffectKey`で照合し、表示名は既存マスタ・派生JSONの名称を使う。
4. 正規IDが未整備の検索は既存経路へフォールバックし、機能を削除しない。
5. 原文の明示記号をそのまま区切りに使う表示整形は、意味推測ではないためgenerated Clauseでも利用できる。抽象的な内部条件名は表示しない。

## 事前監査結果

- reviewed EffectClause: 44件 / 12 entity。
- Clause由来タグ: 条件24種 / 発動7種。
- 正規状態変化参照: 5,884件 / 170正規ID。
- reviewed Clause原文と正規状態変化証跡の直接対応: 12件。
- 派生JSON本体・保存schema・Export/Import schemaは変更しない。

## 外部化

統合責務は`hado_search_clause_integration.js`、詳細カードは既存の`hado_detail_condition_presenter.js`と`hado_update04.css`へ分離する。結果カード専用だった`hado_update06.css`は削除し、`index.html`へJavaScriptやCSSを直書きしない。
