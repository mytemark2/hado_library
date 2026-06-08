# Update07 Report

## 完了内容
- 10段階の適合スコアを共通処理として実装した。
- 型編成ナビと型候補一覧を同一採点関数へ統一した。
- 汎用語による過剰一致を抑制した。
- 主軸理由と補助理由を区別した。
- HTMLへの大規模なJavaScript追記は行っていない。
- HTML増減は `index.html` が **+102 bytes**、`hado_library_3.0.0.0.html` が **+102 bytes** である。
- 外部化判断: 採点ロジックはHTMLへ埋め込まず、責務名ファイル `hado_type_score.js` へ分離した。

## ローカル監査
- `node --check hado_type_score.js`: 合格
- `node --check hado_type_candidates.js`: 合格
- 5項目一致 = 10点: 合格
- 3項目一致 = 6点: 合格
- 同一項目の技能Lv違いが重複加点されない: 合格
- `味方部隊`、`敵部隊`、`弱化効果`、`秒間` などの汎用語だけでは加点されない: 合格
- 兵力が採点対象として残る: 合格
- 採点項目固有の `味方対象部隊数` は正常加点される: 合格
- GitHub反映後の `hado_type_score.js` SHA-256 が受領ファイルと一致: 合格
- GitHub反映後の `hado_type_candidates.js` SHA-256 が受領ファイルと一致: 合格
- `index.html` と `hado_library_3.0.0.0.html` のSHA-256一致: 合格
- 旧 `METRIC_ALIASES`、`metricAliases`、`flatten` の削除: 合格
- 再利用可能な検証スクリプト `tools/validate_app_js.py` の追加: 完了

## Update07.1 追加修正
- 初版の `matched.length * 2` は仮ロジックであり、数値計算になっていなかったため撤去した。
- `hadou_type_score_rules.json` の `percent_sum`、`percent_sum_or_presence`、`presence_fixed`、`baseline_ratio` を共通採点処理へ接続した。
- 確定スコアと条件込最大を分離した。
- 5項目の寄与点を各最大2点として画面へ表示する。
- `tools/test_type_score.js` を追加した。

## Update07.2 診断ログ追加
- 変更JS: `hado_type_score.js` に採点結果保存、`hado_core.js` にログコピー出力を追加した。
- ログ内容: 候補名、役割、型ID、型名、確定スコア、条件込最大スコア、一致項目数、寄与サマリー、項目別breakdown。
- 数値計算式は変更していない。
- HTML増減: `index.html` 0 bytes、`hado_library_3.0.0.0.html` 0 bytes。
- 外部化判断: HTMLへインライン実装せず、既存責務の外部JSへ追加した。

## 未実装
- 保存データ表示モードの所有情報フィルター
- 保存された将星、技能Lv、装備所有状況を反映した候補評価
- 新規部隊作成、保存評価、履歴、グループ管理

上記はUpdate08で実装する。

## ユーザー確認操作
1. プレビューで部隊編成タブを開く。
2. `型編成ナビ` で目的と型を保存する。
3. `型候補一覧` を開き、各候補が `適合スコア: n/10` で表示されることを確認する。
4. 主軸型または補助型を選び、理由表示を確認する。
5. 候補を候補トレイへ追加し、従来どおり `配置先を選ぶ` が機能することを確認する。
