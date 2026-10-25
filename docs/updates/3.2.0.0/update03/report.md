# 3.2.0.0 Update03 完了報告

## 状態

**完了（2026-10-25）。** 実装、175項目の回帰、アプリPR、GitHub Actions、自動Preview同期、公開URLの実動作、公開診断まで合格した。正式公開は行っていない。

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
- PC公開画面と375px幅を含むレイアウト回帰、公開Preview実操作、デバッグログ確認: 合格。

## Git・Actions・Preview

- クローラー実装commit: `2ff54b67f14a6e49d8641b84f3ed748596d18c82`。
- クローラーPR: #40。`feature/crawler-1.1.0.0`へマージ済み。
- クローラー正本merge commit: `e883e82a9776696e60d2c5967d2bd3d0e6d09355`。
- クローラーPRにはリモートcheck設定なし。ローカル `npm test` 全合格、doctor合格、21ファイル再生成check合格をマージゲートとした。
- アプリ実装commit: `67f99dcd8cc8935a6b398650522d2f57f4f18bae`。
- アプリPR: [#397](https://github.com/mytemark2/hado_library/pull/397)。base `feature/app-3.2.0.0`、merge commit `7755244030a1b01e75d94ce7abcecccb99f6d2ef`。
- App Validation: run `40163102017`、成功。
- Notify Hado Library Preview: push run `40163196852`、成功。
- Preview repository `main`: `69edac6d64f59a5721173237cea304580af3ab5f`。
- marker: source commit `7755244030a1b01e75d94ce7abcecccb99f6d2ef`、source branch `feature/app-3.2.0.0`、display version `3.2.0.0 Update03 r216`。
- アプリ由来runtime 71件はPreviewとGit blob一致。`.nojekyll`、marker 3件、36件の `hadou_*.json` を確認した。

## 最小利用者確認

公開Previewで実施済み。データ管理の3段階、来歴、差分、監査情報、LR李典検索、操器詳細を確認した。利用者側の追加確認は不要。

## 残件

なし。

## 確認事項

なし。

## Preview confirmation

- 公開URL: https://mytemark2.github.io/hado_library-preview/
- 表示版: `3.2.0.0 Update03 r216`。
- marker: source commit `7755244030a1b01e75d94ce7abcecccb99f6d2ef` / branch `feature/app-3.2.0.0` / display `3.2.0.0 Update03 r216`。
- Preview repository commit: `69edac6d64f59a5721173237cea304580af3ab5f`。
- DOM・操作: データ管理の取得・検証・反映がすべて完了。取得日時、処理日時、生成日時、bundle ID、件数差分、未分類8件、戦法478/458/20件、同名装備2IDを確認。LR李典検索と詳細、工兵の兵科技能「操器」と所有武将5名を確認。
- 公開キャッシュ再読込: 現行データ同士の比較として武将499→499、技能701→701、兵科技能5→5、追加・変更・削除0件を確認。
- デバッグログ: 表示切替正常。手動診断は `criticalFailures: 0`、`warnings: 0`、`info: 0`。
- PC・スマートフォン: 公開PC画面の操作と、App Validation内の375px幅・横はみ出し回帰に合格。
- 判定: PASS。
