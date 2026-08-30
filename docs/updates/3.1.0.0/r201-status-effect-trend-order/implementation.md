# 3.1.0.0 r201 状態変化検索のグループ別トレンド順 Implementation

## 目的

状態変化検索の小項目を、6つの中項目ごとに現在の編制・対策トレンドへ合わせる。単一の固定配列ではなく、調査で確定した上位項目と最新JSONの実データを組み合わせ、データ更新後も利用頻度の変化へ追随させる。

## 調査基準

調査日は2026-08-30。次の最新攻略情報を主な根拠にした。

- [最強LR・UR武将ランキング](https://gamewith.jp/sangokushihadou/article/show/244552)（2026-08-19更新）
- [最強のおすすめ編制テンプレート](https://gamewith.jp/sangokushihadou/article/show/246909)（2026-08-17更新）
- [最新アップデート情報](https://gamewith.jp/sangokushihadou/article/show/246638)（2026-08更新）
- [LR蒙恬のおすすめ編制](https://gamewith.jp/sangokushihadou/article/show/572688)（2026-08-19更新）
- [LR沮授のおすすめ編制](https://gamewith.jp/sangokushihadou/article/show/572687)（2026-08更新）
- [LR曹操の戦法と技能](https://gamewith.jp/sangokushihadou/article/show/516625)（2026-08更新）
- [LR関羽の戦法と技能](https://gamewith.jp/sangokushihadou/article/show/537936)（2026-08更新）
- [LR龐統のおすすめ編制](https://gamewith.jp/sangokushihadou/article/show/422813)（2026-07-29更新）

最新上位編制と新武将で繰り返し重視される戦法回転、撃心、強兵・豪昇、絶縁・弱化回避、強化奪取、弱化積鈍・鈍迷、深恐・感電、戦法範囲・連鎖妨害を優先アンカーとする。アンカー外は`hadou_status_effect_group_owner_index.json`の現行データで、カテゴリと所有者名を組み合わせた重複除外所有者数の降順とする。同数は日本語名順とし、結果を決定的にする。

## 実装

- `hado_search.js`に調査日と6分類別アンカーを定義する。
- 小項目の並びを「分類別アンカー → 現行JSONの重複除外所有者数 → 日本語名」の順に評価する。
- `[...]`付きの対策索引名は対策元技能名を除いた正規表示名で集計し、同じ対策を分散させない。
- 派生JSONの`dataSetId`、`generatedAt`、分類件数をキャッシュキーにし、公開JSONや手動JSONを再読込した場合は所有者数を再集計する。
- 専用回帰で6分類、93アンカーの存在・重複なし、代表上位順、所有者数フォールバック、旧全分類共通配列の不在を固定する。

## 外部化判断

既存の検索責務を持つ外部`hado_search.js`へ統合する。HTMLには新しいロジックやDOMを追加せず、`index.html`はr201のcache keyだけを更新する。JSONとcrawlerは変更しない。
