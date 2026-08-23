# 3.1.0.0 Update06 Report

## 1. Summary

Update06 r180の検索統合を維持したまま、r181で利用者向け表示を修正した。検索結果から「正規ID一致」「効果あり」および未指定のClause条件・発動タグを除去し、技能詳細を条件または発動契機と該当効果が一体で読めるカードへ変更した。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: 内部診断情報の画面露出、および情報階層の分断。
- 原因: r180では検索統合が成立したことを示す内部情報を結果カードへそのまま表示し、詳細カードもClause単位の行と意味タグを並べていた。そのため、利用者が次に行う操作や判断へつながらず、原文上の条件と効果の対応も見失いやすかった。
- 影響範囲: 通常検索結果、状態変化検索結果、武将詳細の戦法・技能カード、PC・スマートフォン表示。
- 恒久対策: 検索用索引・正規ID照合と利用者表示を分離する。詳細は原文の`■`（適用・条件）、`▼`（発動）、`●`（効果）、`→`（補足）を用い、条件見出しと直後の効果を同じグループへ構成する。専用回帰で「克遂 LvⅡ」の5グループと内部ラベル非表示を固定する。

## 3. Impact scope checked

通常検索、状態変化検索、タグ検索、検索モード独立、詳細、部隊編成条件、型スコアShadow、保存Export/Import、PC 1280×720、スマートフォン390×844、派生JSON契約を対象に確認した。

## 4. Files changed

`hado_detail_condition_presenter.js`、`hado_update04.css`、`hado_search_clause_integration.js`、`hado_status_effects.js`、`hado_update06.css`（削除）、`index.html`、`hado_version.js`、専用回帰、App Validation、README、全体Roadmap、Update06記録。

`hado_version.js`は利用者がr180と修正版を区別できるようr181へ更新した。`HADO_DEV_INFO.json`は表示版の重複を避ける現行方針に従い変更していない。

## 5. HTML size change and externalization decision

`index.html`: 29,928 bytes → 29,875 bytes、-53 bytes。結果カード用CSSの読込宣言を削除し、実装は外部JavaScriptと既存外部CSSへ分離した。HTML内JavaScript/CSSは追加していない。

## 6. Validation commands executed

- `node tools/test_3_1_0_0_update06_user_facing_cards.js`
- `node tools/test_3_1_0_0_update06_search_clause_integration.js`
- `node tools/test_3_1_0_0_update04_detail_condition_presenter.js`
- `node tools/test_3_1_0_0_update07_score_shadow.js`
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `python -X utf8 tools/run_app_validation.py`
- `git diff --check`
- ローカルHTTP版のPC・スマートフォン実操作

## 7. Validation results

専用回帰、検索内部契約、Update04詳細、Update07 Shadow、派生JSON契約、版表示整合、全App Validation 143/143、`git diff --check`はPASS。内部の条件タグ24種・発動タグ7種・正規状態変化参照5,884件を維持した。

ローカルHTTP版では次を確認した。

- 「克遂」はLvⅠが4グループ、LvⅡが5グループ。LvⅡの「主将か、主将と自身が好相性の際」には4効果が同じ枠内にまとまる。
- 原文開閉はLvごとに1つ。「確認済み」「自部隊が比較優位」等の抽象的な意味タグは技能カードに表示しない。
- LR馬良の通常検索結果に未指定の条件タグを表示しない。
- 状態変化「有利激攻」は39件を返し、「正規ID一致」「効果あり」「未指定の条件タグ」を表示しない。
- PC 1280×720、スマートフォン390×844とも横方向の画面超過なし。ブラウザ警告・エラー0件。

## 8. Git commit and pull request

実装PRの統合後に最終記録する。

## 9. GitHub Actions result

実装PRのActions完了後に最終記録する。

## 10. Preview synchronization result

`feature/app-3.1.0.0`への統合後、push起動のPreview同期と公開Pagesを最終確認する。手動実行・scheduleは使用しない。

### Preview confirmation

- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版・marker・Preview repository commit・DOM・操作・debug log: 実装統合後に最終記録する。
- 現在判定: ローカル検証PASS、Preview確認待ち。

## 11. Minimum user acceptance operation

公開Previewの「検索」で`LR馬良`を検索し、「技能」タブの「克遂」LvⅡを確認する。「主将か、主将と自身が好相性の際」の直下に4効果がまとまり、「交戦開始時」「主将の際」「副将か補佐の際」が別グループで続くことを確認する。続けて状態変化検索で「自部隊能力強化」→「有利激攻」を選び、検索結果に「正規ID一致」や未指定の条件タグが表示されないことを確認する。

## 12. Remaining issues

実装PRのActions、自動Preview同期、公開Preview確認が未完了。正式公開は全Update完了後の明示承認まで実施しない。

## 確認事項

Preview確認待ち。完了後、特段の確認事項がなければUpdate08「結果サマリー・全画面統一」へ進む。推奨エンジンはGPT-5.6 Sol / reasoning High。
