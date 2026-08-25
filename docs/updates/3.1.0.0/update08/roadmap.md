# 3.1.0.0 Update08 Roadmap

## 目的

詳細、通常検索、状態変化検索、型検索、部隊編成、型評価根拠、結果サマリーが、同じreviewed EffectClauseとFormation Evaluatorの投影を参照する状態へ統一する。

## 実装範囲

1. 44件のreviewed Clauseを項目別の共通投影へ集約する。
2. 詳細・検索・編成でClause ID、条件、対象、効果、原文ハッシュを共通化する。
3. 部隊編成の5状態判定を結果サマリーと型評価根拠へ引き渡す。
4. 内部IDや利用価値のない説明を画面へ追加しない。
5. Preview同期で新しいJavaScriptとCSSを必須資産として検証する。

## 完了ゲート

- reviewed Clause 44件の画面間不一致が0件。
- 詳細、検索、編成条件、型評価根拠、結果サマリーが共通投影を使用する。
- 現行スコア値と保存データ互換性が変わらない。
- App Validation、GitHub Actions、公開Preview確認がすべて合格する。
- 正式公開は行わない。

## 確認事項

なし。Update08完了後はUpdate09の全件回帰・3.1.0.0正式版候補確認へ進む。

推奨エンジン: GPT-5.6 Sol / reasoning High。
