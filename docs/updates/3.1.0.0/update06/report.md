# 3.1.0.0 Update06 Report

## 1. Summary

Update06を実装した。通常検索へreviewed EffectClause由来の条件・発動タグを追加し、状態変化検索へ正規`statusEffectKey`優先経路を追加した。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: 画面間の意味解釈分散・名称推測依存。
- 原因: 詳細はEffectClauseを参照する一方、通常検索と状態変化検索は既存タグ・自由文・名称一致を主に利用していた。
- 恒久対策: EffectClause Presenter/Evaluatorと正規状態変化IDを一つの外部統合層で索引化し、未reviewed Clauseを推測しない信頼境界を固定した。

## 3. Impact scope checked

通常検索、状態変化検索、タグAND/OR、検索モード独立、詳細、部隊編成条件、型スコアShadow、保存Export/Import、PC、スマートフォン、派生JSON契約を対象とする。

## 4. Files changed

`hado_search_clause_integration.js`、`hado_update06.css`、`hado_search.js`、`hado_status_effects.js`、`hado_bootstrap.js`、`index.html`、`hado_version.js`、専用回帰、App Validation、README、全体Roadmap、Update06記録。

## 5. HTML size change and externalization decision

`index.html`: 29,796 bytes → 29,946 bytes、+150 bytes。ロジックとCSSは外部ファイルへ分離し、HTML内JavaScript/CSSは追加していない。

## 6. Validation commands executed

- `node tools/test_3_1_0_0_update06_search_clause_integration.js`
- `node tools/test_3_1_0_0_update07_score_shadow.js`
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `python -X utf8 tools/run_app_validation.py`
- `git diff --check`

## 7. Validation results

専用回帰、Update07 Shadow回帰、派生JSON契約、版表示整合、全App Validation 142/142、`git diff --check`はPASS。ローカルHTTP版の実ブラウザでは、通常検索のClauseタグ選択、LR袁紹の結果・詳細タグ一致、状態変化「有利激攻」の正規ID一致、LR司馬昭の検索結果・詳細Clause一致を確認した。PC 1280×720とスマートフォン390×844で横方向の画面超過はなく、ブラウザエラーログは0件だった。Actionsと公開Previewはマージ後に確定記録する。

## 8. Git commit and pull request

実装完了後に確定記録する。

## 9. GitHub Actions result

Pull Request作成後に確定記録する。

## 10. Preview synchronization result

実装マージ後に実Preview repository・marker・公開URLを確認して確定記録する。

## 11. Minimum user acceptance operation

公開Previewの「検索」→「通常検索」でタグを開き、「条件」グループから「主将」を選択してLR袁紹の結果カードに「条件:主将」「条件:兵力50%以上」が表示されることを確認する。続けて「状態変化検索」→分類「自部隊能力強化」→状態変化「有利激攻」を選び、LR馬良の結果カードに「正規ID一致」が表示されることを確認する。

## 12. Remaining issues

リモート検証完了後に確定する。

## 確認事項

なし。Update06完了後は、Update07が完了済みのためUpdate08「結果サマリー・全画面統一」へ進む。推奨エンジンはGPT-5.6 Sol / reasoning High。
