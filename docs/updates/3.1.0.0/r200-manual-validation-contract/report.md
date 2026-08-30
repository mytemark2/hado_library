# 3.1.0.0 r200 手動検証契約の現行UI・起点commit同期 Report

## 1. Summary

r199 Previewで確認した遅延描画文言2件と起点commit形式1件の偽陽性を修正し、公開Previewの手動検証を正しく完了できるようにする。

## 2. Bug classification and root cause

- 分類: 検証ロジックの旧UI・旧メタデータ契約による偽陽性。
- 原因: ARIA名または遅延描画で提供する文言をページ全体の`textContent`へ要求し、40文字Git commit SHAを64文字SHA-256として検査していた。
- 恒久対策: 文言検証を固定表示・状態要素・遅延機能の責務ごとに分離し、source revisionは実運用中の40/64文字契約を専用回帰で固定する。

## 3. Impact scope checked

手動検証、版数整合、回帰文言、検証結果ダイアログ、ログ。検索・詳細・部隊編成・保存Export / Import・JSON契約・PC・スマートフォンは全体回帰で確認する。

## 4. Files changed

検証runtime、専用回帰、Preview revision・cache key、README、Roadmap、r199/r200記録。JSON、crawler、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

実装・Preview確認後に記録する。検証runtimeは既存の外部`hado_bootstrap.js`で修正し、インラインJavaScriptとHTML構造は追加しない。

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
