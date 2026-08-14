# 3.1.0.0 Update01 Report

## 状態

全件条件センサス完了。ローカル完了ゲート合格。GitHub Actions・公開Previewの最終確認後にUpdate01を閉じる。

## Summary

- 武将486、戦法465、技能653、状態変化206の全1,810件を走査した。
- 45,929意味単位を分類し、未走査0件、未分類残差0件を確認した。
- condition / trigger / context / modifier / limit / reset / suppression / targetingの44 taxonomy候補を作成した。
- 必須武将と横断条件を含む44件のgold setを作成した。
- Update02へ渡すCondition Registry / EffectClause / Evaluator要件を確定した。

## 現行condition blocksの診断

- 未収載228件: 武将5、戦法5、技能12、状態変化206。
- 分類見直し候補2,196ブロック。
- 親条件を文字列マーカーだけでは特定できない曖昧候補1,385ブロック。
- conditionとeffectの親子リンク欠落4,787ブロック。
- 結論: 診断入力として再利用し、3.1意味モデル正本にはしない。

## Files changed

- `tools/build_update01_condition_census.js`
- `tools/test_update01_condition_census.js`
- `tools/run_app_validation.py`
- `docs/updates/3.1.0.0/update01/condition-census.json`
- `docs/updates/3.1.0.0/update01/condition-gold-set.json`
- 3.1全体・Update01 Roadmap、Implementation、Report、README
- `hado_version.js`、`HADO_DEV_INFO.json`、`hado_core.js`、`index.html`
- `tools/test_3_1_0_0_update01_version_policy.js`

元の`hadou_*.json`、検索、詳細、編成、保存データ契約、runtime consumerは変更していない。

## HTML size / externalization

- `index.html`: 0 bytes
- JavaScriptのHTML内追加: なし
- 新規責務: 外部Node.js監査ツールへ実装

## Validation

- `node tools/build_update01_condition_census.js`
- `node tools/test_update01_condition_census.js`
- `python -X utf8 tools/run_app_validation.py`
- `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`

ローカル結果:

- Update01 census regression: `1810 records / 45929 units / 44 gold cases`、PASS。
- App Validation: `134/134`、PASS。
- runtime生成JSON差分: なし。`hadou_effect_condition_blocks.json`は監査入力としてのみ使用。

merge readiness、Commit、PR、Actions、Preview marker、公開Pages確認はGitHub反映後に本タスクの完了報告へ記録する。

## Completion gate

- [x] 最新正本の母数を再確認した。
- [x] 対象母数と実走査件数が一致した。
- [x] 未走査武将・戦法・技能・状態変化が0件。
- [x] 現行condition blocksを持たないレコードを個別記録した。
- [x] 未確認残差が0件。
- [x] 全分類一覧と代表例を作成した。
- [x] gold setを44件作成した。
- [x] 現行condition blocksの再利用可否と不足点を明文化した。
- [x] Update02で正式schemaを確定する入力が揃った。
- [ ] GitHub Actions App Validation成功。
- [ ] Preview同期・marker・公開Pages確認。

## Minimum user acceptance

公開Previewで`3.1.0.0 Update01 r172`を確認し、公開JSON自動読込、通常検索、部隊編成、軍馬編成が従来どおり操作できることを確認する。Update01は監査Updateのため、新しいUI操作は追加しない。

## Remaining issues

GitHub Actions・公開Preview確認のみ。正式schema・UI・Evaluator実装は計画どおりUpdate02以降の範囲。
