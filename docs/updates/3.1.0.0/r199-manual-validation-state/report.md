# 3.1.0.0 r199 手動検証の実行中表示誤判定修正 Report

## 1. Summary

手動検証中の正当なボタン表示を回帰検証がNGにする自己矛盾を修正する。実データ、検索、詳細、編成、保存形式、正式公開は変更しない。

## 2. Bug classification and root cause

- 分類: 検証ロジックの状態依存による偽陽性。
- 原因: 検証開始前にボタン文言を「検証中…」へ変更した後、ページ全体に固定文言「検証実行」が存在することを必須判定していた。
- 恒久対策: 状態変化する文言をページ全体の固定文言検証から分離し、対象要素の許可状態として検証する。未知状態と要素欠落を落とす専用回帰を全体検証へ常設する。

## 3. Impact scope checked

手動検証の回帰チェック、拡張検証結果、ログコピー、通常時・実行中のボタン状態。実データ、検索、詳細、部隊編成、保存Export / Import、PC・スマートフォンの起動回帰も全体検証で確認する。

## 4. Files changed

検証runtime、専用回帰、全体検証登録、Preview revision・cache key、README、Roadmap、r199実装・報告記録。JSON、crawler、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

検証runtimeは既存の外部`hado_bootstrap.js`で修正し、インラインJavaScriptを追加しない。`index.html`は構造を変更せず、r199 cache keyだけを更新する。

## 6. Validation commands executed

- `node tools/test_3_1_0_0_manual_validation_button_state.js`
- `python -X utf8 tools/run_app_validation.py`
- `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`

## 7. Validation results

実装・Preview確認後に記録する。

## 8. Git commit and pull request

実装・Preview確認後に記録する。

## 9. GitHub Actions result

実装・Preview確認後に記録する。

## 10. Preview synchronization result

### Preview confirmation

実装・Preview確認後に記録する。

## 11. Minimum user acceptance operation

公開Previewの「？」から「検証実行」を押し、最終結果がOKであることを確認する。

## 12. Remaining issues

実装・Preview確認後に記録する。

## 確認事項

実装・Preview確認後に記録する。
