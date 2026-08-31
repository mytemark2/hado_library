# 3.1.0.0 r195 タグ画面投影の武将版違い混同修正 Report

## 1. Summary

r194の公開確認で検出した画面投影キャッシュの武将版違い混同を修正し、通常検索タグを原文所有者へ一致させる。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: 共有画面投影キャッシュのキー衝突。
- 原因: 検索索引は完全一致へ修正済みだったが、`hado_clause_surface_bridge.js`の投影キャッシュがレアリティと読み仮名を除去したキーを使い、LR・UR・通常版の最初のタグ集合を再利用していた。
- 恒久対策: Clause照合キーと画面投影キャッシュキーを分離し、後者を完全一致にする。

## 3. Impact scope checked

武将488件、通常検索で選択可能な939タグ・10グループ、LR・UR・覚醒・通常・ORIGINS・兵科違い、通常検索、タグ入力候補、タグ選択画面、PC、390x844。

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

- 画面投影API経由で488武将・選択可能939タグを全件照合し、0件タグ0、所有者不一致0。タグ索引にない参照用技能93件は画面選択肢ではないため対象外とした。
- `発動:交戦開始時`は原文105武将と一致し、LR馬良からUR馬良への漏れがない。
- 条件34タグ、発動8タグを含む10グループを公開画面で確認した。
- JSON契約は21ファイル、App Validationは157/157件PASS。

## 8. Git commit and pull request

- 実装commit: `f50c62128db4a5be7fb13b8c980d00210ae0a7d5`
- Pull Request: `#336`（base: `feature/app-3.1.0.0`、merged）
- 開発ブランチ統合commit: `1a08ec39ea9c1a8a0ecdf4732a28102d6dcbad41`
- Merge readiness: base `2e3f105c957154168b3e4243e62ff3359c5cb35f`、head `f50c62128db4a5be7fb13b8c980d00210ae0a7d5`、競合なし。

## 9. GitHub Actions result

- `App Validation / app-validation`: success（run `33237137296`）
- `Notify Hado Library Preview`: success（run `33237154482`、1分15秒）

## 10. Preview synchronization result

### Preview confirmation

- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `3.1.0.0 r195`
- Preview repository commit: `a8b690e7ebfff25601de9504a0b627f4cfbbd25e`
- `PREVIEW_SOURCE_COMMIT.txt`: `1a08ec39ea9c1a8a0ecdf4732a28102d6dcbad41`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.1.0.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.1.0.0 r195`
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`.nojekyll`、marker 3ファイル、`hadou_*.json` 36件を確認。
- 公開DOM: 武将488件、タグ939件・10グループ、条件34件、発動8件。
- 実操作: `条件:交戦開始時`は選択肢0、`発動:交戦開始時`は選択肢1・ヒット105件。LR馬良は含み、UR馬良は含まず、UR沙摩柯を含む。
- PC 1280幅・390x844: 横方向overflow 0。選択済みタグと105件表示を維持。
- Debug log: validation OK、search results 105。console warning/error 0件。
- 判定: PASS。

## 11. Minimum user acceptance operation

Codex側で公開PreviewのPC・390x844実操作まで確認済み。利用者による追加の必須確認はない。任意確認として「発動」から「交戦開始時」を選ぶと105件になる。

## 12. Remaining issues

なし。正式公開は未実施。

## 確認事項

なし。正式公開は利用者の明示承認まで行わない。
