# 3.1.0.0 r201 状態変化検索のグループ別トレンド順 Report

## 1. Summary

状態変化検索の小項目順を、全分類共通の旧固定順から、6分類別の2026年8月トレンド順へ変更した。上位項目外は最新JSONの重複除外所有者数で並べ、データ更新へ追随する。

## 2. Bug classification and root cause

- 分類: 検索候補の優先順位設計不整合。
- 原因: 全分類で1つの固定配列を共有し、`攻撃上昇`など旧表示名が現在の`攻撃変化(強化)`等と一致しないため、大半の項目が文字コード順へ落ちていた。
- 恒久対策: 分類別アンカーを現行正規名で固定し、対象外を現行JSON所有者数で補完する。アンカーの存在・重複と実際の比較結果を全体検証へ追加する。

## 3. Impact scope checked

状態変化検索の6分類、小項目の全候補、JSON再読込、通常検索・型検索とのモード分離、PC・スマートフォン、検索結果・詳細、保存Export / Importを確認した。専用回帰では6分類・93アンカー、現行正規名と画面表示名の対応、所有者数フォールバックを全件確認した。

## 4. Files changed

- `hado_search.js`
- `tools/test_3_1_0_0_status_effect_trend_order.js`
- `tools/run_app_validation.py`
- revisionを参照するUpdate06～09回帰8件
- `hado_version.js`
- `index.html`
- `README.md`
- `docs/updates/3.1.0.0/roadmap.md`
- `docs/updates/3.1.0.0/r201-status-effect-trend-order/implementation.md`
- 本報告

JSON、crawler、CSS、`HADO_DEV_INFO.json`は変更していない。

## 5. HTML size change and externalization decision

Git blobは28,885 bytesから28,885 bytesで増減0 bytes。HTML構造は変更せず、cache keyだけをr201へ更新した。並び替えロジックは既存外部`hado_search.js`へ統合し、HTML内へJavaScriptを追加していない。

## 6. Validation commands executed

- `python -X utf8 tools/run_app_validation.py`
- `node tools/test_3_1_0_0_status_effect_trend_order.js`
- `node tools/test_3_1_0_0_update08_surface_unification.js`
- `node tools/test_3_1_0_0_update09_full_regression.js`
- `node tools/test_update09_5_60_search_mode_isolation.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `git diff --check`
- `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`
- 公開Pagesで6分類の先頭8件、戦法短縮検索、PC 1280px、390×844、内蔵検証、console、debug logを実操作確認

## 7. Validation results

- App Validation: 162/162件成功。
- 専用回帰: 6分類 / 93アンカー / 現行所有者数フォールバック成功。
- Update08、Update09、検索モード分離、版整合、差分整合: すべて成功。
- merge readiness: base `d559f0e2e74366f29095f654e01164c763e2ec14`、head `d4d109d1e9315896d38bc83c4dc2565794262cd7`、競合なし。
- 公開Pages: 6分類の先頭8件が設計順と一致。自部隊能力強化の`戦法短縮`を選択し93件を表示、検索条件・結果詳細も正常。
- PC: 1280pxでbody幅1265px、横あふれなし。スマートフォン: 390×844でbody幅375px、横あふれなし。
- 内蔵検証: OK、criticalFailures 0、warnings 0、info 0。
- console warning/error: 0件。Debug Log: validation OK、warnings 0、info 0。

## 8. Git commit and pull request

- 実装commit: `d4d109d1e9315896d38bc83c4dc2565794262cd7`
- PR: [#347 状態変化検索を分類別の最新トレンド順へ更新](https://github.com/mytemark2/hado_library/pull/347)
- `feature/app-3.1.0.0`統合commit: `e997acc6507a1834e0b02a4437d01885b8eac095`

## 9. GitHub Actions result

- `App Validation / app-validation`: success（PR #347）
- `Notify Hado Library Preview`: success（run `33315333755`、push起動）
- Preview側Pages公開待機までworkflow内で成功。

## 10. Preview synchronization result

### Preview confirmation

- 公開URL: https://mytemark2.github.io/hado_library-preview/
- 表示版: `3.1.0.0 r201`
- Preview repository `main`: `e1041599d014da85dc81bfa66afd43c90c0605ba`
- `PREVIEW_SOURCE_COMMIT.txt`: `e997acc6507a1834e0b02a4437d01885b8eac095`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.1.0.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.1.0.0 r201`
- 必須公開物: `index.html`、`hado_formation.js`、`hado_styles.css`、20件の契約対象`hadou_*.json`を含む派生JSON一式、`.nojekyll`、marker 3件を確認。
- DOM: タイトル、6分類select、分類別候補、検索条件、検索結果、詳細を確認。
- JavaScript/CSS: `hado_search.js?v=3.1.0.0-r201`、`hado_styles.css?v=3.1.0.0-r201`の読込と動作を確認。
- 操作: 6分類の切替、分類別先頭8件、`戦法短縮`選択、93件表示を確認。
- PC・スマートフォン: 1280pxおよび390×844で横あふれなし。
- Debug Log: validation OK / warnings=0 / info=0。console warning/error 0件。
- 判定: **PASS**。

## 11. Minimum user acceptance operation

公開Previewで「検索」→「状態変化検索」を開き、中項目を切り替え、小項目の先頭候補が用途に合う順になっていることを確認する。最低操作は「自部隊能力強化」→「戦法短縮」を選び、検索結果が表示されることの確認とする。

## 12. Remaining issues

none。正式公開は未実施。

## 確認事項

追加確認事項はない。正式公開は利用者の明示承認まで行わない。
