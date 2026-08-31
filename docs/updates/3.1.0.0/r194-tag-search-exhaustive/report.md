# 3.1.0.0 r194 通常検索タグの原文同期・全タグ総点検 Report

## 1. Summary

条件・発動タグを全原文の明示マーカーから生成し、現在の検索カテゴリに所有者が存在するタグだけを候補表示するよう改修した。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: タグ索引の対象範囲不足、意味分類の重複、所有者カテゴリ判定不足。
- 原因: 条件・発動候補がreviewed EffectClause 44件だけから生成され、発動ラベルを条件にも重複登録していた。表示可否もタググループ全体のカテゴリだけで判定していた。
- 類似不具合: 原文タグを武将名の広い同一視で結ぶとLR・UR・通常版が混ざる可能性も検出した。
- 恒久対策: 全明示原文マーカーからタグを生成し、原文タグはレアリティを保持した完全一致で接続し、個別タグの実所有カテゴリで候補を絞る。

## 3. Impact scope checked

武将488件、通常検索で選択可能な939タグ・10グループ、原文マーカー4,654件、条件タグ38種、発動タグ8種。通常検索、タグ入力候補、タグ選択画面、カテゴリ切替、既存検索モード、PC、390x844。

## 4. Files changed

`hado_search_clause_integration.js`、`hado_bootstrap.js`、`hado_status_effects.js`、`hado_core.js`、`hado_search.js`、`hado_version.js`、`index.html`、README、Roadmap、r194記録、回帰テスト。JSON、crawler、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

`index.html`: Git blob 28,822 bytes → 28,822 bytes、±0 bytes。既存外部JavaScriptへ実装し、HTMLには`r194`キャッシュキーだけを反映した。

## 6. Validation commands executed

- JavaScript構文検査
- `node tools/test_3_1_0_0_tag_search_exhaustive.js`
- 条件・発動、タグカテゴリ、技能所有者、PC・スマホ候補の専用回帰
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `python -X utf8 tools/run_app_validation.py`
- `python tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`

## 7. Validation results

- 武将488件の通常検索で選択可能な939タグ・10グループを1件ずつ照合し、0件タグ0、所有者不一致0。タグ索引にない参照用技能93件は画面選択肢ではないため監査対象外とした。
- `発動:交戦開始時`は明示原文105武将と完全一致し、`条件:交戦開始時`は候補なし。
- 1,824件へ原文タグを適用し、4,654原文マーカー、条件38種、発動8種、正規状態変化参照5,930件を確認した。
- App Validationは157/157件PASS、PR #335はmerge済み、Preview同期もsuccess。
- ただし公開Pagesの実操作で`発動:交戦開始時`が105件ではなく179件となり、画面投影キャッシュがLR・UR・通常版を混同している追加原因を検出した。

## 8. Git commit and pull request

- 実装commit: `eb1c4079217e0f93b0352f891b10d1e80af472b5`
- Pull Request: `#335`（merge commit `2e3f105c957154168b3e4243e62ff3359c5cb35f`）

## 9. GitHub Actions result

- `App Validation / app-validation`: success（run `33236726026`）
- `Notify Hado Library Preview`: success（run `33236744015`）

## 10. Preview synchronization result

### Preview confirmation

- Preview repository commit: `8aa7103686879acbe924e38529220a2e4d3c890d`
- markerはsource commit `2e3f105c957154168b3e4243e62ff3359c5cb35f`、source branch `feature/app-3.1.0.0`、display version `3.1.0.0 r194`で一致。
- 公開実操作: FAIL。`発動:交戦開始時`が179件となったため、r194を完了扱いにしない。

## 11. Minimum user acceptance operation

公開Previewの通常検索でタグを開き、「条件」に「交戦開始時」がないこと、「発動」の「交戦開始時」を選ぶと原文該当武将へ絞られることを確認する。

## 12. Remaining issues

r195で画面投影キャッシュを修正する。正式公開は未実施。

## 確認事項

現時点ではなし。正式公開は利用者の明示承認まで行わない。
