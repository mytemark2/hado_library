# 3.2.0.0 Update03 完了報告

## 状態

実装とローカル検証は完了。アプリPR、GitHub Actions、Preview、file://実機確認が完了するまではUpdate03完了としない。

## 概要

- 取得・検証・反映の3段階を可視化した。
- 前回検証済みデータとの差分を武将・技能・兵科別に表示した。
- 画面反映成功後だけ新キャッシュを確定する原子的な更新経路へ変更した。
- データ来歴を取得・処理・生成・run・生成元commitの役割別に記録した。
- 同名装備2記事の索引統合を生成元で修正し、21派生JSONを一式再生成した。

## データ監査結果

- 一次件数: 武将499、装備266、技能701、陣形22、状態変化214。
- 戦法: 一次478、画面反映458、取得履歴として保持20。
- 未分類状態変化: 8。原文と出典を保持し、分類は推測していない。
- 同名装備: `equipments:article-346228` と `equipments:article-381628` を各1件索引化。
- 過去取得runのクローラーSHA: 元記録に存在しないため不明のまま保持。今後のCLI runから自動記録する。
- 再取得: なし。既存取得が十分であることを先に照合した。

## 変更ファイル

- 実行ソース: `hado_data_update.js`、`hado_bootstrap.js`、`hado_core.js`、`hado_web_json_cache.js`、`hado_styles.css`、`index.html`。
- 版情報: `hado_version.js`、`HADO_DEV_INFO.json`。
- 派生データ: `hadou_bundle_manifest.json` と生成対象21ファイル一式（内容変更は20ファイル、`hadou_effect_clauses.json` は同一内容）。
- 回帰: Update03新規テスト、版固定テスト、Update01 gold、生成器版固定テスト。
- 記録: Update03 roadmap / implementation / report、全体roadmap、Update README、Update01保留記録。

## HTMLサイズと外部化

起点 `cfbc31862d0536666e01c71f6ec26c90ee3dd8e1` 比で `index.html` は28,889 bytesから28,988 bytesへ99 bytes増加。増分は外部スクリプト読込だけであり、大型処理は外部JavaScriptへ実装した。

## 検証

- `node tools/test_3_2_0_0_update03_data_update.js`: 合格。
- `node tools/test_web_json_cache_policy.js`: 合格。
- `node tools/test_json_index_contract.js`: 21ファイル契約合格。
- JavaScript構文、JSON構文、`git diff --check`: 合格。
- `python -X utf8 tools/run_app_validation.py`: 175/175合格。保存Export/Import、検索、詳細、編成、版表示、Preview workflow静的検証を含む。
- PC/スマホ実ブラウザ、Preview、file://は後続ゲート。

## Git・Actions・Preview

- クローラー実装commit: `2ff54b67f14a6e49d8641b84f3ed748596d18c82`。
- クローラーPR: #40。`feature/crawler-1.1.0.0`へマージ済み。
- クローラー正本merge commit: `e883e82a9776696e60d2c5967d2bd3d0e6d09355`。
- クローラーPRにはリモートcheck設定なし。ローカル `npm test` 全合格、doctor合格、21ファイル再生成check合格をマージゲートとした。
- アプリcommit、PR、Actions、Preview marker、公開URLは後続で追記する。

## 最小利用者確認

1. データ管理を開き、取得・検証・反映が別々に表示されること。
2. 前回比の追加・変更・削除と、監査上の保持・未確定情報を開けること。
3. 検索、詳細、部隊編成、Export/Importが従来どおり動作すること。
4. `file://` で同フォルダーのJSONを読み込み、同じ表示と主要操作を確認すること。

## 残件

- アプリPRとApp Validation。
- Preview自動同期、marker、公開画面、PC/スマホ、デバッグログ確認。
- `file://` 実機確認。

## 確認事項

なし。
