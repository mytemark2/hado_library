# 3.1.0.0 Update08 Report

## 1. Summary

Update08 r189で、詳細・通常検索・状態変化検索・型検索・部隊編成・型評価根拠・結果サマリーを同じEffectClause/Evaluator投影へ統一した。現行スコア値、JSON、保存データは変更せず、正式公開は行っていない。

## 2. Bug classification and root cause

- 分類: 画面ごとの並行投影による判定根拠の分断。
- 原因: 詳細、検索、編成判定は共通Clauseを利用していたが、結果サマリーと型検索結果は既存の加算・派生索引だけを保持し、同じClauseの条件・対象・5状態を追跡できなかった。
- 恒久対策: Presenter、検索統合、Formation Evaluatorの出力をClause単位で束ねる共通画面投影を追加し、各画面が同じ投影を参照する。
- 再発防止: 44件全件についてClause ID、条件、対象、効果identity、原文SHA-256、詳細件数、検索件数、編成判定を比較する専用回帰をApp Validationへ追加する。
- Preview実編成で検出した不足: r188では「戦法最大倍率」が従来の250%だけを表示し、同じClauseの「250%→700% / 兵力50%以上」と5状態を結果サマリーへ渡していなかった。
- 追加対策: r189でPresenterの効果文を共通投影へ保持し、戦法最大倍率へ基礎Clauseの成立、条件Clauseの戦闘中判定、条件文、250%→700%を同じ参照として渡す。専用回帰で2 Clauseと2状態の組合せを固定する。

## 3. Impact scope checked

reviewed Clause 44件 / 14項目、詳細、通常検索、状態変化検索、型検索、部隊編成条件、型評価shadow、結果サマリー。現行スコア合計、JSON、crawler、保存schema、Export/Importは変更対象外。

## 4. Files changed

`hado_clause_surface_bridge.js`、`hado_update08.css`、`hado_bootstrap.js`、`hado_core.js`、`hado_status_effects.js`、`hado_search.js`、`hado_formation.js`、`index.html`、`hado_version.js`、Preview同期Workflowと検証、Update06/07版表示回帰、Update08専用回帰、App Validation一覧、README、全体Roadmap、Update08記録。`hado_version.js`はUpdate08 r189を識別するため変更し、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

`index.html`: 28,501 bytes → 28,629 bytes、+128 bytes。変更は外部JavaScript/CSSの読込2件と`08-r189`キャッシュキーである。実装は外部JavaScript/CSSへ分離し、HTMLへインライン実装を追加しない。

## 6. Validation commands executed

- `node tools/test_3_1_0_0_update08_surface_unification.js`
- `node tools/test_3_1_0_0_update06_search_clause_integration.js`
- `node tools/test_3_1_0_0_update07_score_shadow.js`
- `python -X utf8 tools/validate_preview_workflow.py`
- `node tools/test_notify_preview_workflow_no_preview_workflow_edit.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `python -X utf8 tools/run_app_validation.py`
- `git diff --check`
- ローカルHTTP版のPC・390x844実ブラウザ確認

## 7. Validation results

専用回帰はreviewed Clause 44件 / 14項目、画面投影不一致0件でPASS。全App Validation 153/153、版表示整合、Preview Workflow検証、`git diff --check`はPASS。ローカルHTTP版はUpdate08 r189、武将488・戦法447・技能1389・装備251、LR袁紹5 Clause、PC/390x844横方向超過0、ブラウザwarning/error 0件を確認した。公開Previewでも同じ件数、表示版、対象DOM・資産、結果サマリー、PC/390x844横方向超過0、ブラウザwarning/error 0件を確認した。

## 8. Git commit and pull request

- 初回実装: PR #324、作業Commit `c94d6b324609b178f4f211853216dd9dc24603dc`、正本Merge Commit `9e6111eff134b5db3a12aef77a9b588b85dce522`。
- Preview実編成で検出した不足の修正: PR #325、作業Commit `2cb64b54d8f96e5821c3196843809ccc92cf59aa`、正本Merge Commit `d7b6004230a482f82869e4f1fa5f211db8f365c1`。
- PR #325のmerge-readiness: base/headは`9e6111eff134b5db3a12aef77a9b588b85dce522` / `2cb64b54d8f96e5821c3196843809ccc92cf59aa`、競合なし。

## 9. GitHub Actions result

- PR #324 App Validation: run `32913121825`、PASS。
- PR #325 App Validation: run `32927929885`、PASS。
- r188 Preview同期: `Notify Hado Library Preview` run `32913167788`、success。
- r189 Preview同期: `Notify Hado Library Preview` run `32927952111`、success（1分20秒）。

## 10. Preview synchronization result

イベント駆動同期はpushだけで自動起動し、手動dispatchやscheduleを使用していない。r189同期後のPreview repository `main` HEADは`968d433e6c49b0222816cdbb8c8e6fe02eae1147`。必須配信ファイルと3 markerの一致を確認した。

### Preview confirmation

- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `3.1.0.0 Update08 r189`
- marker: `PREVIEW_SOURCE_COMMIT.txt=d7b6004230a482f82869e4f1fa5f211db8f365c1`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.1.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.1.0.0 Update08 r189`
- Preview repository commit: `968d433e6c49b0222816cdbb8c8e6fe02eae1147`
- DOM/資産: `index.html`、`hado_clause_surface_bridge.js`、`hado_formation.js`、`hado_update08.css`、`hado_styles.css`、`hadou_*.json`、`.nojekyll`を確認。画面内へ内部Clause IDの露出なし。
- 操作: LR袁紹を主将にした保存編成で、結果サマリーに「最大250%」「成立」「戦闘中判定」「主将」「兵力50%以上」「敵4部隊: 戦法威力 250% → 700%」「LR袁紹」を確認。
- PC/スマートフォン: 1280pxと390x844で横方向超過0。
- debug-log: browser warning/error 0件。
- 判定: PASS。

## 11. Minimum user acceptance operation

公開PreviewでLR袁紹を主将にした保存編成を開き、「戦法最大倍率」へ成立・戦闘中判定と250%→700%の根拠が表示される操作を実施済み。利用者側の追加必須確認はない。

## 12. Remaining issues

none。正式公開は全Update完了後の明示承認まで実施しない。

## 確認事項

なし。次はUpdate09の全件回帰・3.1.0.0正式版候補確認へ進む。

推奨エンジン: GPT-5.6 Sol / reasoning High。
