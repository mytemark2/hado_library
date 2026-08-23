# 3.1.0.0 Update07 Report

## 1. Summary

Update07を完了した。reviewed EffectClauseを既存scoreEvidenceへ投影するClause Shadowを追加し、現行トータルを変更せず比較値と除外理由を部隊編成へ表示する。全回帰、GitHub Actions、Preview同期、公開URLのPC・スマートフォン実操作まで合格し、正式公開は行っていない。

## 2. Bug classification and root cause

- 分類: 評価経路統合前のデータ契約不足・重複加点リスク。
- 原因: 44 reviewed caseは39のeffect identityへ集約され、2 identity・7 caseが同一効果単位を共有する。またEffectClauseの`effect.kind`は`source_effect`で、個別の正規評価項目を保持していない。
- 対策: identity衝突を自動採点から除外し、一意な`identity + effectFamily`だけを一度採用する。条件状態が`met`以外の行も理由付きで除外し、現行スコアは切り替えない。

## 3. Impact scope checked

- 部隊編成の型スコア、条件タブ、評価根拠、PC・スマートフォン配置。
- 起動、公開JSON読込、通常検索、部隊編成、保存データExport/Import回帰。
- Update04詳細表示、Update05条件評価、20派生JSON契約。
- 保存schema、Export/Import schema、検索索引、派生JSON本体は変更なし。

## 4. Files changed

- `hado_update07_score_shadow.js`: Clause Shadow adapterと分類。
- `hado_formation_condition_evaluator.js`: 採点比較専用の全reviewed Clause評価経路。
- `hado_formation.js`: shadow計算、診断、比較表示。
- `hado_update07.css`: PC・スマートフォン比較UI。
- `index.html`: Update07資産と`07-r179`キャッシュキー。
- `hado_version.js`: `3.1.0.0 Update07 r179`。
- `tools/test_3_1_0_0_update07_score_shadow.js`, `tools/run_app_validation.py`, `tools/validate_update_version_consistency.py`: 再発防止。
- README、全体Roadmap、Update07 Roadmap・実装記録・本報告。

## 5. HTML size change and externalization decision

- `index.html`: 29,596 bytes → 29,825 bytes、+229 bytes。
- ロジックは`hado_update07_score_shadow.js`、表示は`hado_update07.css`へ外出しし、HTML内JavaScript/CSSは増やしていない。

## 6. Validation commands executed

- `node --check hado_update07_score_shadow.js`
- `node --check hado_formation_condition_evaluator.js`
- `node --check hado_formation.js`
- `node tools/test_3_1_0_0_update07_score_shadow.js`
- `node tools/test_3_1_0_0_update05_formation_evaluator.js`
- `node tools/test_3_1_0_0_update04_detail_condition_presenter.js`
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/run_app_validation.py`
- `git diff --check`

## 7. Validation results

- App Validation: 140/140 PASS。
- Update07専用回帰: 44 reviewed case、39 identity、衝突2グループ7件、LR袁紹の全5 reviewed Clause投影をPASS。
- Update04/05・派生JSON契約: PASS。
- ローカルHTTP PC: `3.1.0.0 Update07 r179`、現行17 / Shadow 0、reviewed 5、除外5、条件は成立3 / 戦闘中判定1 / 判定不可14。
- ローカルHTTP 390×844: 2列表示、カード・ページ横あふれなし、console warning/errorなし。

## 8. Git commit and pull request

- 実装コミット: `501d866a1abf6b15d3520206cad18944339aabb8`
- 正本squash commit: `ccd1474ac457d05b23c07d6ad839a05e66e5e986`
- Pull Request: [#305](https://github.com/mytemark2/hado_library/pull/305)
- Base: `feature/app-3.1.0.0`
- merge-readiness: base `4b1749c433133e64215bb8409ed719801018cce1`、head `501d866a1abf6b15d3520206cad18944339aabb8`、競合なし。

## 9. GitHub Actions result

- `App Validation / app-validation`: SUCCESS（run `32611192813`、job `97124444670`）。
- `Notify Hado Library Preview`: SUCCESS（run `32611216664`、job `97124506397`）。

## 10. Preview synchronization result

**PASS**。push起動の`Notify Hado Library Preview`が手動操作なしで同期し、Pages反映完了まで検証した。

### Preview confirmation

- 公開URL: <https://mytemark2.github.io/hado_library-preview/>
- 表示版: `3.1.0.0 Update07 r179`
- App正本HEAD: `ccd1474ac457d05b23c07d6ad839a05e66e5e986`
- Preview repository `main` HEAD: `1f1687b06a28b2c94ae4a815552482aac1621b78`
- `PREVIEW_SOURCE_COMMIT.txt`: `ccd1474ac457d05b23c07d6ad839a05e66e5e986`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.1.0.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.1.0.0 Update07 r179`
- 必須資産: `index.html`、`hado_formation.js`、`hado_styles.css`、`hado_update07.css`、`hado_update07_score_shadow.js`、`hado_type_score_evidence.js`、20派生`hadou_*.json`、`.nojekyll`、3 markerを確認。
- DOM/操作: LR袁紹・バフ支援型で現行17 / Shadow 0、reviewed 5、除外5、条件は成立3 / 戦闘中判定1 / 判定不可14。現行トータルは17のまま。
- PC/スマートフォン: 390×844で比較カード1件、2列、カード・ページ横あふれなし。
- Debug log: `formationScore:update07-shadow`にtypeId、reviewed 5、identity衝突4、現行17、Shadow 0、`switchReady:false`を確認。`formationScore:update07-shadow-error`、console warning/errorなし。
- 結果: **PASS**。

## 11. Minimum user acceptance operation

公開Previewの「部隊編成」→LR袁紹を主将にした部隊→型「バフ支援型」で、「Clause Shadow（比較表示）」が現行17、Shadow 0、reviewed 5、除外5を別表示し、トータルスコアが17のままであることを確認する。

## 12. Remaining issues

なし。EffectClauseの正規評価項目未構造化とidentity衝突による新経路切替保留は、誤採点防止のための意図したUpdate07結果であり、現行スコアへ影響しない。

## 確認事項

なし。Update07完了後は、先送りしたUpdate06の通常検索・状態変化検索統合へ戻る。推奨エンジンはGPT-5.6 Sol / reasoning High。
