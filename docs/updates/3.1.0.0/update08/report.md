# 3.1.0.0 Update08 Report

## 1. Summary

Update08 r188で、詳細・通常検索・状態変化検索・型検索・部隊編成・型評価根拠・結果サマリーを同じEffectClause/Evaluator投影へ統一する。現行スコア値、JSON、保存データは変更せず、正式公開は行わない。

## 2. Bug classification and root cause

- 分類: 画面ごとの並行投影による判定根拠の分断。
- 原因: 詳細、検索、編成判定は共通Clauseを利用していたが、結果サマリーと型検索結果は既存の加算・派生索引だけを保持し、同じClauseの条件・対象・5状態を追跡できなかった。
- 恒久対策: Presenter、検索統合、Formation Evaluatorの出力をClause単位で束ねる共通画面投影を追加し、各画面が同じ投影を参照する。
- 再発防止: 44件全件についてClause ID、条件、対象、効果identity、原文SHA-256、詳細件数、検索件数、編成判定を比較する専用回帰をApp Validationへ追加する。

## 3. Impact scope checked

reviewed Clause 44件 / 14項目、詳細、通常検索、状態変化検索、型検索、部隊編成条件、型評価shadow、結果サマリー。現行スコア合計、JSON、crawler、保存schema、Export/Importは変更対象外。

## 4. Files changed

`hado_clause_surface_bridge.js`、`hado_update08.css`、`hado_bootstrap.js`、`hado_core.js`、`hado_status_effects.js`、`hado_search.js`、`hado_formation.js`、`index.html`、`hado_version.js`、Preview同期Workflowと検証、Update06/07版表示回帰、Update08専用回帰、App Validation一覧、README、全体Roadmap、Update08記録。`hado_version.js`はUpdate08 r188を識別するため変更し、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

`index.html`: 28,501 bytes → 28,629 bytes、+128 bytes。変更は外部JavaScript/CSSの読込2件と`08-r188`キャッシュキーである。実装は外部JavaScript/CSSへ分離し、HTMLへインライン実装を追加しない。

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

専用回帰はreviewed Clause 44件 / 14項目、画面投影不一致0件でPASS。全App Validation 153/153、版表示整合、Preview Workflow検証、`git diff --check`はPASS。ローカルHTTP版はUpdate08 r188、武将488・戦法447・技能1389・装備251、LR袁紹5 Clause、PC/390x844横方向超過0、ブラウザwarning/error 0件を確認した。公開Preview結果は反映後に記録する。

## 8. Git commit and pull request

実装Pull Request反映後に記録する。

## 9. GitHub Actions result

実装Pull Request反映後に記録する。

## 10. Preview synchronization result

実装Pull Request反映後に公開Pagesと3 markerを確認して記録する。

## 11. Minimum user acceptance operation

公開PreviewでUpdate08 r188を確認し、reviewed Clauseを持つ武将を含む編成の「条件」と「結果サマリー」で同じ成立状態が表示されることを確認する。

## 12. Remaining issues

Preview確認前のため未完了。正式公開は全Update完了後の明示承認まで実施しない。

## 確認事項

なし。Update08完了後はUpdate09の全件回帰・3.1.0.0正式版候補確認へ進む。

推奨エンジン: GPT-5.6 Sol / reasoning High。
