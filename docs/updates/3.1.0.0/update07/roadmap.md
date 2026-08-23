# 3.1.0.0 Update07 Roadmap — 型評価 / scoreEvidence統合

## 状態

`3.1.0.0 Update07 r179`として完了。ユーザー指示により未着手のUpdate06より先に実施した。実装、全回帰、Actions、Preview同期、公開URLのPC・スマートフォン実操作が合格し、正式公開は行っていない。

## 目的

Update05で現在編成へ接続したreviewed EffectClauseを既存scoreEvidence形式へ投影し、条件を無視した加点、同一起源の基礎値・override二重加点、対象不一致を検出できる比較経路を作る。

## 実施範囲

1. EffectClauseから既存scoreEvidenceへのshadow adapterを追加する。
2. 現行スコアを表示上・保存上の正本に残し、Shadowスコアとの差を部隊編成に表示する。
3. 条件不成立、戦闘中判定、判定保留、判定不可、効果identity衝突、評価項目未対応を除外理由として分類する。
4. 同一effect identityと評価項目の組み合わせを一度だけ採用する。
5. 回帰テスト、App Validation、PC・スマートフォン、実Previewを確認する。

## 安全な切替条件

全reviewed Clauseのeffect identityが一意で、EffectClause自体に正規化済み評価項目が入り、未レビューClauseが残らず、現行スコアとの差分を意図差分として説明できる場合に限り新経路へ切り替える。Update07 r179ではこの条件を満たさないため、切替を行わない。

## 確認事項

なし。Update07完了後は、先送りしたUpdate06の通常検索・状態変化検索統合へ戻る。推奨エンジンはGPT-5.6 Sol / reasoning High。
