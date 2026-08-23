# 3.1.0.0 Update07 Report

## 1. Summary

Update07のローカル実装・全回帰・HTTP Preview確認を完了した。reviewed EffectClauseを既存scoreEvidenceへ投影するClause Shadowを追加し、現行トータルを変更せず比較値と除外理由を部隊編成へ表示する。GitHub Actionsと公開Previewの確認が終わるまではPreview未完了として扱う。

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

- Git commit: Preview反映後に追記。
- Pull Request: Preview反映後に追記。

## 9. GitHub Actions result

未確認。Pull Request作成後にApp Validationを確認する。

## 10. Preview synchronization result

未確認。正本マージ後にNotify Hado Library Preview、Preview repository marker、公開Pagesを確認する。現時点の状態は**未完了**。

## 11. Minimum user acceptance operation

公開Previewの「部隊編成」→型を選択した部隊→「Clause Shadow（比較表示）」で、現行スコアが従来値のまま、Shadowスコアと除外理由が別表示になることを確認する。

## 12. Remaining issues

- GitHub Actions、Preview同期、公開Pages実操作が未確認。
- EffectClauseの正規評価項目未構造化とidentity衝突があるため、新経路への切替は保留。

## 確認事項

なし。Update07完了後は、先送りしたUpdate06の通常検索・状態変化検索統合へ戻る。推奨エンジンはGPT-5.6 Sol / reasoning High。
