# 3.1.0.0 Update03 Implementation

## 生成経路

クローラー `1.1.0.4` の `src/app_3_1_effect_clause.js` が4正本データセットを意味単位へ分解し、Update02のRegistryとSchemaへ変換する。生成元PRは `mytemark2/hado_library-crawler#18`、開発ブランチmerge commitは `8328a58a39aabe89b4a9db843ce2b8707309bae5`。

全派生JSONは `tools/regenerate_derived_json.js` で一括生成し、個別JSONは手編集していない。

## EffectClause出力

- 正本レコード: 1,810
- 意味単位: 45,929
- EffectClause: 24,329
- trust: generated / reviewed
- reviewed gold: 44/44
- 生本文フォールバック: 1,498
- 固定値上書き監査候補: 104

固定値上書き候補は同一効果IDの重複ではなく、Update04以降で表示・評価する際にbase/override関係を再確認する監査入力として保持する。

## 品質監査

生成時に次を失敗ゲートとした。

- 未分類意味単位
- schema不整合Clause
- 最終孤立condition / trigger / effect
- 重複effect identity
- ゴールドケース未対応

アプリ側 `tools/test_json_index_contract.js` は21JSONの構文、全24,329 Clauseの必須構造、typed fieldの親effectId、全生本文SHA-256、trust state、監査結果、ファイル全体SHA-256を検証する。

## サイズと互換性

- `hadou_effect_clauses.json`: 33,293,268 bytes
- SHA-256: `e50e65d9c7b831ce9bab6e80b41fabc837df9b742038d034f4835786edbf321b`
- 初回の整形JSON 58,638,322 bytesから、契約名を変えず空白と任意重複fieldを削減した。
- 既存 `hadou_effect_condition_blocks.json` は互換用として維持した。
- Update03ではruntime consumerへ接続していないため、検索、詳細、編成、保存Export/Importの動作経路は変更しない。

## HTML・外部化判断

- `index.html`: cache keyを `03-r174` へ同長置換。サイズ増減0 bytes。
- HTML内JavaScript追加: なし。
- 生成責務: クローラー外部JavaScriptへ実装。
- runtime表示版: `hado_version.js`だけを正本として更新。
