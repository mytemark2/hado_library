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

`index.html`: Git blob 28,885 bytes → 28,885 bytes、±0 bytes。HTML構造は変更せず、既存資産のr200 cache keyだけを更新した。検証runtimeは既存の外部`hado_bootstrap.js`で修正し、インラインJavaScriptを追加していない。

## 6. Validation commands executed

- `node tools/test_3_1_0_0_manual_validation_button_state.js`
- `python -X utf8 tools/run_app_validation.py`
- `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`

## 7. Validation results

専用回帰は、ボタン通常時・実行中の許可、未知状態・要素欠落の拒否、40文字Git commit SHAと64文字SHA-256の許可、39文字・非16進値の拒否、遅延描画機能の要素・関数による代替検証に合格した。`python -X utf8 tools/run_app_validation.py`は161/161件合格し、21派生JSON契約、検索、詳細、編成、保存Export / Import、レスポンシブ、禁止queue不在を確認した。マージ準備検査はbase `7d3e7bd615f295bca115909afe594dec118a2172`、head `da24c7f0b01356f3ab360441a23a2d3e5a7667c2`で競合なしだった。

## 8. Git commit and pull request

- 実装commit: `da24c7f0b01356f3ab360441a23a2d3e5a7667c2`
- Pull request: #345（base: `feature/app-3.1.0.0`、merged）
- 実装merge commit: `051a91720e38675a9bfe2adbad79f951810c361f`
- 競合: なし

## 9. GitHub Actions result

- PR必須check `App Validation / app-validation`: success（run `33293240849`）
- push起点 `Notify Hado Library Preview`: success（run `33293259455`、1分17秒）
- 通常同期は`feature/app-3.1.0.0`へのpushによるイベント駆動で、schedule・手動dispatchは使用していない。

## 10. Preview synchronization result

### Preview confirmation

- URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `3.1.0.0 r200`
- 実装確認時Preview repository commit: `e5e6e49a2dfa36f25a0f0450bf423070db7e6612`
- marker: source commit `051a91720e38675a9bfe2adbad79f951810c361f`、source branch `feature/app-3.1.0.0`、display version `3.1.0.0 r200`
- 必須資産: `index.html`、`hado_formation.js`、`hado_styles.css`、rootの`hadou_*.json` 36件、`.nojekyll`、3 markerを確認した。派生JSON契約対象21件はApp Validationで合格した。
- DOM・asset: title / h1 / 診断版表示が`3.1.0.0 r200`で一致し、`hado_bootstrap.js`、`hado_version.js`、`hado_styles.css`がr200 cache keyで実行された。
- 操作: 「検証実行」→「検証中…」→「検証実行」の状態遷移を確認し、最終結果はOK、criticalFailures 0、warnings 0、info 0だった。
- PC: clientWidth 1920px・scrollWidth 1920px、横方向overflow 0。console warning 0、error 0。
- 390×844: 実clientWidth 375px・scrollWidth 375px、横方向overflow 0。検証ボタンは168.5×60pxで表示され、診断版表示は`3.1.0.0 r200`だった。
- Debug Log: `validation: OK / warnings=0 / info=0`、手動検証SummaryもOKで一致した。
- 判定: PASS。後続の本記録のみの統合ではmarkerだけが新しい文書merge commitへ進むため、runtime資産が実装確認時と同一であることを再確認する。

## 11. Minimum user acceptance operation

公開Previewの「？」から「検証実行」を押し、最終結果がOKであることを確認する。

## 12. Remaining issues

なし。正式公開は未実施であり、利用者の明示承認まで行わない。

## 確認事項

確認事項なし。最低確認操作は、公開Previewの「？」から「検証実行」を押し、最終結果がOKになること。正式公開は利用者の明示承認まで行わない。
