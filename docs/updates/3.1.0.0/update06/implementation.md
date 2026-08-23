# 3.1.0.0 Update06 Implementation

## 実装方針

- `hado_search_clause_integration.js`: Update04/05と同じPresenter/Evaluatorを読み、reviewed Clauseの条件・発動タグと正規状態変化IDを一つの検索サマリーへ統合する。
- `hado_status_effects.js`: Clauseタグを既存タグ索引へ非破壊で追加し、通常全文検索の補助語と結果カードへ反映する。
- `hado_search.js`: 個別状態変化検索で正規ID一致を既存名称・原文検出より先に採用し、検索キャッシュへClauseデータ世代を含める。
- `hado_bootstrap.js`: EffectClause索引確定直後にUpdate06統合索引を初期化し、診断情報へ件数と契約版を記録する。
- `hado_update06.css`: 条件・発動・正規ID一致チップのPC/スマートフォン表示。HTML内へCSSを追加しない。

## 信頼境界

1. `条件:*`と`発動:*`は44件のreviewed EffectClauseからのみ作る。
2. generated Clauseは`trust: generated`のまま保持し、検索タグへ昇格しない。
3. 状態変化所有者は`statusEffectKey`で照合し、表示名は既存マスタ・派生JSONの名称を使う。
4. 正規IDが未整備の検索は既存経路へフォールバックし、機能を削除しない。

## 事前監査結果

- reviewed EffectClause: 44件 / 12 entity。
- Clause由来タグ: 条件24種 / 発動7種。
- 正規状態変化参照: 5,884件 / 170正規ID。
- reviewed Clause原文と正規状態変化証跡の直接対応: 12件。
- 派生JSON本体・保存schema・Export/Import schemaは変更しない。

## 外部化

新しい統合責務は`hado_search_clause_integration.js`へ、表示は`hado_update06.css`へ分離した。`index.html`は読込宣言とキャッシュキーだけを変更する。
