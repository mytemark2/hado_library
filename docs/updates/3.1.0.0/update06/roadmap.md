# 3.1.0.0 Update06 Roadmap — 通常検索・状態変化検索統合

## 状態

`3.1.0.0 Update06 r180`として実装・検証・自動Preview同期・公開Preview確認を完了した。ユーザー指示でUpdate07を先に完了した後、Update06へ戻った。全Update完了まで正式公開は行わない。

## 目的

詳細表示と同じreviewed EffectClauseから条件・発動タグを作り、通常検索側の独自自由文解釈を減らす。状態変化検索は名称推測だけに依存せず、既存派生JSONの正規`statusEffectKey`を優先して所有者へ接続する。

## 実施範囲

1. reviewed EffectClauseから`条件:*`と`発動:*`を派生し、通常検索のタグ・全文検索・結果カードへ接続する。
2. generated Clauseは検索タグへ昇格せず、既存の原文フォールバックを維持する。
3. `hadou_type_search_feature_index.json`と`hadou_related_link_index.json`の`statusEffectKey`を統合し、状態変化検索で正規ID一致を優先する。
4. 正規IDがない旧データ・対策系検索は既存互換経路を維持する。
5. PC・スマートフォン、通常検索、状態変化検索、詳細、保存Import/Export、全App Validation、実Previewを確認する。

## 完了ゲート

- 通常検索の条件・発動表示と詳細が同じreviewed EffectClauseを参照する。
- 状態変化検索で正規`statusEffectKey`一致を診断・表示できる。
- 未reviewed Clauseを条件タグとして推測しない。
- 既存検索結果、保存schema、Export/Import、型スコアを変更しない。

## 確認事項

なし。Update06完了後は、Update07が完了済みのためUpdate08「結果サマリー・全画面統一」へ進む。推奨エンジンはGPT-5.6 Sol / reasoning High。
