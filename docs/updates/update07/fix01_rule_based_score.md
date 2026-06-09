# Update07.1 Rule-based suitability score fix

## バグ分類
採点ロジック未接続。UI表示は10段階になっていたが、ルールJSONの計算方式を利用せず、特徴の存在だけで1項目2点を付与していた。

## 根本原因
`hado_type_score.js` 初版が、`hadou_type_score_rules.json` の `method` を評価せず、`matched.length * 2` の仮ロジックを正式処理として利用していた。

## 影響範囲
- 型編成ナビの主将適合スコア
- 型候補一覧の候補適合スコア
- 殲滅系を含む全16型
- Update08で予定している所有情報フィルター後の候補評価

## 恒久対策
- `percent_sum`
- `percent_sum_or_presence`
- `presence_fixed`
- `baseline_ratio`

を共通採点処理で解釈する。
5項目の各寄与点は最大2点、合計最大10点とする。
条件付き文言は確定値へ加えず、条件込最大へ加える。

## 表示
- `確定スコア/10（条件込最大 n/10）`
- 各項目の寄与点 `項目: 確定→条件込最大/2`

## 再発防止
`tools/test_type_score.js` を追加し、割合加算、有無固定、基準比率、条件付き加点、項目別表示を回帰確認する。
