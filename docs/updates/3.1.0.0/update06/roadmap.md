# 3.1.0.0 Update06 Roadmap — 通常検索・状態変化検索統合

## 状態

`3.1.0.0 Update06 r181`として利用者向け表示修正まで完了した。r180で検索統合を完了後、結果カードへ内部診断を表示していた点と、技能カードで条件と効果の関係が分断されていた点を改修し、全回帰、自動Preview同期、公開PreviewのPC・スマートフォン実操作が合格した。全Update完了まで正式公開は行わない。

## 目的

詳細表示と同じreviewed EffectClauseから条件・発動タグを作り、通常検索側の独自自由文解釈を減らす。状態変化検索は名称推測だけに依存せず、既存派生JSONの正規`statusEffectKey`を優先して所有者へ接続する。

## 実施範囲

1. reviewed EffectClauseから`条件:*`と`発動:*`を派生し、通常検索のタグ・全文検索へ接続する。結果カードには検索条件として選んだタグ以外の内部診断を追加しない。
2. generated Clauseは検索タグへ昇格せず、既存の原文フォールバックを維持する。
3. `hadou_type_search_feature_index.json`と`hadou_related_link_index.json`の`statusEffectKey`を統合し、状態変化検索で正規ID一致を内部判定として優先する。利用者には「正規ID一致」やID値を表示しない。
4. 正規IDがない旧データ・対策系検索は既存互換経路を維持する。
5. PC・スマートフォン、通常検索、状態変化検索、詳細、保存Import/Export、全App Validation、実Previewを確認する。
6. 技能詳細は「適用・条件・発動」見出しの直下に該当効果をまとめ、「克遂 LvⅡ」を5グループで表示する。原文開閉は技能Lvにつき1つとする。

## 完了ゲート

- 通常検索の条件・発動タグ検索と詳細が同じreviewed EffectClauseを参照する。
- 状態変化検索で正規`statusEffectKey`一致を内部診断できる。
- 未reviewed Clauseを条件タグとして推測しない。
- 既存検索結果、保存schema、Export/Import、型スコアを変更しない。
- 結果カードに「正規ID一致」「効果あり」または未指定の条件タグを表示しない。
- 技能カードで、各条件がどの効果へ掛かるかを原文順に追える。

## 確認事項

なし。Update06完了後は、Update07が完了済みのためUpdate08「結果サマリー・全画面統一」へ進む。推奨エンジンはGPT-5.6 Sol / reasoning High。
