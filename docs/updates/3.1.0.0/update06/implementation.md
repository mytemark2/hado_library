# 3.1.0.0 Update06 Implementation

## 実装方針

- `hado_search_clause_integration.js`: Update04/05と同じPresenter/Evaluatorを読み、reviewed Clauseの条件・発動タグと正規状態変化IDを一つの検索サマリーへ統合する。
- `hado_status_effects.js`: Clauseタグを既存タグ索引へ非破壊で追加し、タグ検索と通常全文検索の補助語に使う。結果カードには内部診断情報を表示しない。
- `hado_search.js`: 個別状態変化検索で正規ID一致を既存名称・原文検出より先に採用し、検索キャッシュへClauseデータ世代を含める。照合理由とIDは内部判定に限定する。
- `hado_bootstrap.js`: EffectClause索引確定直後にUpdate06統合索引を初期化し、診断情報へ件数と契約版を記録する。
- `hado_detail_condition_presenter.js`: 技能原文の`■`・`▼`・`●`を用い、条件または発動契機を見出し、その直後の効果を同じグループにまとめる。原文開閉は技能Lvごとに1つだけ表示する。
- `hado_update04.css`: 条件見出しと効果一覧が一体に見えるカードへ変更し、PC/スマートフォンの折返しを維持する。
- `hado_core.js`: 通常技能と参照付与技能を共通の条件・効果Presenterへ通す。参照付与技能は指定Lvの原文ブロックだけを抽出し、参照先の全Lvを並べない。
- `hado_update06.css`: 結果カード用の内部診断チップを廃止したため削除する。

## 信頼境界

1. `条件:*`と`発動:*`は44件のreviewed EffectClauseからのみ作る。
2. generated Clauseは`trust: generated`のまま保持し、検索タグへ昇格しない。
3. 状態変化所有者は`statusEffectKey`で照合し、表示名は既存マスタ・派生JSONの名称を使う。
4. 正規IDが未整備の検索は既存経路へフォールバックし、機能を削除しない。
5. 原文の明示記号をそのまま区切りに使う表示整形は、意味推測ではないためgenerated Clauseでも利用できる。抽象的な内部条件名は表示しない。
6. 原文明示記号からグループ化できた場合はreviewed/generatedを問わず旧原文の常時併記を止め、原文開閉1個に集約する。グループ化不能時のみ旧表示へフォールバックする。

## 事前監査結果

- reviewed EffectClause: 44件 / 12 entity。
- Clause由来タグ: 条件24種 / 発動7種。
- 正規状態変化参照: 5,884件 / 170正規ID。
- reviewed Clause原文と正規状態変化証跡の直接対応: 12件。
- 派生JSON本体・保存schema・Export/Import schemaは変更しない。
- 技能付与参照: 215出現 / 重複除外200関係 / 親技能122件 / 参照先112技能。参照先欠損は0件。
- 「白眉」付与LvⅠは「主将か、主将と自身が好相性の際」2効果と「出陣時」1効果の2グループ。LvⅡ以降の効果は付与カードへ混在させない。

## 外部化

統合責務は`hado_search_clause_integration.js`、詳細カードは既存の`hado_detail_condition_presenter.js`、`hado_core.js`、`hado_update04.css`へ分離する。結果カード専用だった`hado_update06.css`は削除し、`index.html`へJavaScriptやCSSを直書きしない。

## r184 表示情報の削減

- 技能カードでは「適用条件と効果」「条件ごとに～」「条件／発動／適用」「補足：」を常時表示しない。実際の条件文と効果文を残し、区分は左罫線の色と`title`・`aria-label`で補う。
- 参照技能の「技能データ参照」を削除し、`付与Lv`は通常技能と同じ`Lv`表示へ統一する。原文開閉は`原文`へ短縮する。
- 検索、データ管理、保存管理、軍馬編成、兵器・武装、結果サマリーの操作内容と重複する説明を削除する。検索履歴登録と結果根拠の操作説明はツールチップへ移す。
- 型プリセット未選択時の空の説明欄は`hidden`と`hado_styles.css`の非表示規則を併用し、レイアウト余白も残さない。
- 初回ガイド、型検索の`？`ヘルプ、Import前のバックアップ警告は、必要時の説明とデータ消失防止に必要なため残す。
- 画面文言の再増加を防ぐ`tools/test_3_1_0_0_update06_ui_copy_reduction.js`をApp Validationへ追加する。
