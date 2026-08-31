# 覇道ライブラリ 3.1.0.0 正式公開報告

## 1. Summary

- Previewで確認済みの `feature/app-3.1.0.0` を `main` へ正式公開した。
- 公開版は `3.1.0.0` のみを表示し、内部追跡用revisionは `203` を維持した。
- Preview確定データを再クロール、再生成せず、そのまま正式版へ昇格した。
- 本報告を `main` へ反映後、同じ最終コミットに `3.1.0.0` タグを付け、`feature/app-3.1.0.0` を削除する。

## 2. Bug classification and root cause

該当なし。正式公開・開発終了処理であり、追加の不具合修正は行っていない。

## 3. Impact scope checked

- 正式版タイトル、見出し、asset cache key
- 起動と公開JSON読込
- 通常検索と内容詳細
- 検索結果パネル背景色
- PC幅とスマートフォン幅
- Preview確定JSONと正式版JSONの同一性
- Production Pagesワークフロー

## 4. Files changed

正式公開PR #353では、3.1.0.0の全実装・生成JSON・Update記録に加え、正式版メタデータ、README、公開記録を反映した。

本終了記録では、この `report.md` のみを変更する。

## 5. HTML size change and externalization decision

- 旧main `index.html`: 29,327 bytes
- 3.1.0.0 `index.html`: 28,923 bytes
- 差分: -404 bytes
- 新規処理は分割済み外部JavaScriptに保持し、巨大なインラインJavaScriptは追加していない。

## 6. Validation commands executed

- `python -X utf8 tools/run_app_validation.py`
- `python -X utf8 tools/check_pr_merge_readiness.py --base main`
- Preview確定コミットと正式版mainの `hadou_*.json` 全差分確認
- 公開URLでPC幅・390x844幅の実操作確認

## 7. Validation results

- App Validation: 163コマンド成功
- merge-readiness: 成功、競合なし
- Preview確定コミット `f10c0e8c6cf69d471c74c86a5cea0328c97fa70e` と正式版mainの `hadou_*.json`: 差分0件
- PC幅: 横はみ出しなし
- スマートフォン幅390px: 読込100%、横はみ出しなし
- 通常検索 `関羽`: 7件
- `LR関羽（かんう）` の内容詳細: 表示成功
- 検索結果パネル背景色: `rgb(239, 246, 255)`
- Debug Log: エラー表示なし

## 8. Git commit and pull request

- 昇格元コミット: `f10c0e8c6cf69d471c74c86a5cea0328c97fa70e`
- 正式公開候補コミット: `9e96130579957ca57a41587540a3722a40143a82`
- 正式公開PR: [#353](https://github.com/mytemark2/hado_library/pull/353)
- PR状態: MERGED
- mainマージコミット: `cf0b352b5e2946233efc5c1f23185edc611795ad`

## 9. GitHub Actions result

- App Validation: [run 33386147917](https://github.com/mytemark2/hado_library/actions/runs/33386147917) / success
- Deploy Hado Library Production Pages: [run 33386194372](https://github.com/mytemark2/hado_library/actions/runs/33386194372) / success

## 10. Preview synchronization result

### Preview confirmation

- 公開URL: https://mytemark2.github.io/hado_library-preview/
- 表示版: `3.1.0.0 r203`
- `PREVIEW_SOURCE_COMMIT.txt`: `f10c0e8c6cf69d471c74c86a5cea0328c97fa70e`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.1.0.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.1.0.0 r203`
- Previewリポジトリmain: `ed3142c8731a85df636ec6c86654220bf4d60d55`
- 判定: PASS

### Production confirmation

- 公開URL: https://mytemark2.github.io/hado_library/
- 表示版: `3.1.0.0`
- asset cache key: `3.1.0.0-r203`
- 公開コミット: `cf0b352b5e2946233efc5c1f23185edc611795ad`
- DOM: タイトル・見出し・検索結果・内容詳細を確認
- 操作: 起動、検索、詳細表示を確認
- Debug Log: エラー表示なし
- 判定: PASS

## 11. Minimum user acceptance operation

完了済み。公開版で `関羽` を検索し、`LR関羽（かんう）` の内容詳細が開くことを確認した。

## 12. Remaining issues

none

## 確認事項

なし。正式版の公開確認後にリリースタグを作成し、開発ブランチを閉鎖する。
