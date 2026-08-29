# 3.1.0.0 r195 タグ画面投影の武将版違い混同修正 Report

## 1. Summary

r194の公開確認で検出した画面投影キャッシュの武将版違い混同を修正し、通常検索タグを原文所有者へ一致させる。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: 共有画面投影キャッシュのキー衝突。
- 原因: 検索索引は完全一致へ修正済みだったが、`hado_clause_surface_bridge.js`の投影キャッシュがレアリティと読み仮名を除去したキーを使い、LR・UR・通常版の最初のタグ集合を再利用していた。
- 恒久対策: Clause照合キーと画面投影キャッシュキーを分離し、後者を完全一致にする。

## 3. Impact scope checked

武将488件、通常検索用1,032タグ・10グループ、LR・UR・覚醒・通常・ORIGINS・兵科違い、通常検索、タグ入力候補、タグ選択画面、PC、390x844。

## 4. Files changed

`hado_clause_surface_bridge.js`、画面投影経由の全タグ回帰、`hado_version.js`、`index.html`、README、Roadmap、r194/r195記録、現在版テスト。JSON、crawler、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

`index.html`: Git blob 28,822 bytes → 28,822 bytes、±0 bytes。外部JavaScriptを修正し、HTMLには`r195`キャッシュキーだけを反映した。

## 6. Validation commands executed

- JavaScript構文検査
- `node tools/test_3_1_0_0_tag_search_exhaustive.js`
- `node tools/test_3_1_0_0_update08_surface_unification.js`
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `python -X utf8 tools/run_app_validation.py`
- `python tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`

## 7. Validation results

- 画面投影API経由で488武将・1,032タグを全件照合し、0件タグ0、所有者不一致0。
- `発動:交戦開始時`は原文105武将と一致し、LR馬良からUR馬良への漏れがない。
- Actionsと公開Preview結果は同期完了後に追記する。

## 8. Git commit and pull request

Actions・Preview確認後に追記する。

## 9. GitHub Actions result

Actions完了後に追記する。

## 10. Preview synchronization result

### Preview confirmation

イベント駆動同期と公開Pages実操作の完了後に追記する。

## 11. Minimum user acceptance operation

通常検索の「発動」から「交戦開始時」を選び、105件になることを確認する。「条件」には「交戦開始時」が表示されないことも確認する。

## 12. Remaining issues

Actions・Preview確認待ち。正式公開は未実施。

## 確認事項

現時点ではなし。正式公開は利用者の明示承認まで行わない。
