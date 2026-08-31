# 3.1.0.0 Update09 Report

## 1. Summary

Update09で全データ回帰と正式版候補確認を完了し、Previewを`3.1.0.0 r190`へ更新した。正式公開は行っていない。

## 2. Bug classification and root cause

- 分類: クロスプラットフォーム検証の誤判定。
- 原因: bundle manifest検証がJSON内容ではなくCRLF/LFを含む生文字列を比較していた。
- 恒久対策: マニフェストの現在値もLFへ正規化してから期待値と比較する。
- 再発防止: Update09全件回帰でLF/CRLF同値性を直接検証し、App Validationへ常設する。

## 3. Impact scope checked

武将488、戦法467、技能661、状態変化206、計1,822件、意味単位46,362件、生成Clause 24,554件、reviewed Clause 44件。通常検索、状態変化検索、型検索、詳細、部隊編成、候補ワークスペース、型評価、結果サマリー、保存Import/Export、JSON cache、PC、390x844、Preview同期。

## 4. Files changed

検証ツール、`hado_version.js`、`index.html`、現在版を確認する既存回帰、README、全体Roadmap、Update09記録。JSONと`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

`index.html`: 28,629 bytes → 28,790 bytes、+161 bytes。`3.1.0.0-r190`キャッシュキーへの変更だけで、新しいインライン実装は追加しない。

## 6. Validation commands executed

- `node tools/test_3_1_0_0_update09_full_regression.js`
- `node tools/build_json_bundle_manifest.js --check`
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `python -X utf8 tools/run_app_validation.py`
- `python tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`
- PC・390x844・公開Preview実操作

## 7. Validation results

- 全1,822件・意味単位46,362件・生成Clause 24,554件を走査し、未走査、未分類、未確認残差、無効Clause、孤立condition/trigger/effect、実害のあるeffect identity重複、modifier基礎effect欠落、evidence SHA不一致はすべて0件。
- 正規化後の重複候補107群はレベル・段階差を含む監査候補であり、Clause IDとeffect identityによる実害重複は0件。
- `python -X utf8 tools/run_app_validation.py`: 154/154件PASS。
- JSON契約、保存Import/Export往復、通常検索、状態変化検索、型検索、詳細、部隊編成、候補ワークスペース、型評価、結果サマリー、PC、390x844の回帰はPASS。

## 8. Git commit and pull request

- 作業commit: `5c6d10904080476b7fd0145b84e0d66b8b68a2d4`
- Pull Request: [#327](https://github.com/mytemark2/hado_library/pull/327)
- `feature/app-3.1.0.0`へのmerge commit: `12f1889ea1129bb20610fcc939e871b4c155c285`
- merge-readiness: base `1e4f41af8a4f9c5a01efb1cb914adade9e355774`、head `5c6d10904080476b7fd0145b84e0d66b8b68a2d4`、競合なし。

## 9. GitHub Actions result

- `App Validation / app-validation`: run `32932133613`、PASS。
- `Notify Preview Repository`: run `32932159080`、success（1分19秒）。

## 10. Preview synchronization result

`feature/app-3.1.0.0`へのpushを契機にイベント駆動で同期した。scheduleや手動workflowは使用していない。

### Preview confirmation

- 公開URL: <https://mytemark2.github.io/hado_library-preview/>
- 表示版: `覇道ライブラリ 3.1.0.0 r190`
- Preview repository commit: `53581011b06704326aeb1002cabfe8995be8439f`
- marker: source commit `12f1889ea1129bb20610fcc939e871b4c155c285`、source branch `feature/app-3.1.0.0`、display version `3.1.0.0 r190`
- 必須配置: `index.html`、`hado_formation.js`、`hado_styles.css`、`hadou_*.json`、`.nojekyll`、3 markerを確認。
- DOM・asset: 版表示、検索、詳細、部隊編成、条件、結果サマリーを確認し、script/CSSのcache keyが`3.1.0.0-r190`であることを確認。
- 操作: LR袁紹の通常検索1件、状態変化「攻撃上昇」366件、型「撃心型」138件、保存済み編成3/12件、条件内訳「成立3・不成立0・戦闘中判定1・対象外0・判定不可14」、結果サマリー「最大250%」を確認。内部ID表示なし。
- PC 1280x720・スマートフォン390x844: 横方向overflow 0、表示崩れなし。
- debug log: browser error 0件。
- 判定: PASS。

## 11. Minimum user acceptance operation

公開Previewで版表示、検索、詳細、保存編成、条件、結果サマリーをCodex側で確認済み。利用者による追加の必須確認はない。

## 12. Remaining issues

none。正式公開は利用者の明示承認まで行わない。

## 確認事項

なし。3.1.0.0の全Updateは完了し、正式公開の明示承認待ちとなる。

推奨エンジン: GPT-5.6 Sol / reasoning High。
