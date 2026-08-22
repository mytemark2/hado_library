# 3.1.0.0 Update03 Report

## 状態

実装・ローカル検証完了。GitHub Actionsと公開Previewの最終確認を行う。

## Summary

- 4正本データセット1,810件からEffectClause 24,329件を決定的に生成した。
- 既存条件ブロックJSONを互換用、新規EffectClause JSONを3.1正本用に分離した。
- 生本文、出典位置、SHA-256、親効果ID、信頼状態を全Clauseに保持した。
- 未分類、無効、最終孤立、効果ID重複を0件にした。
- 21派生JSONを一括再生成し、個別手編集を廃した。

## Files changed

- `hadou_effect_clauses.json`、既存20派生 `hadou_*.json`
- `tools/test_json_index_contract.js`
- `tools/test_3_1_0_0_update03_version_policy.js`
- `tools/run_app_validation.py`
- `hado_version.js`, `HADO_DEV_INFO.json`, `hado_core.js`, `index.html`
- Update03 Roadmap / Implementation / Report、3.1全体Roadmap、README

旧Update02 version policy testはUpdate03版へ置換した。

## HTML size / externalization

- `index.html`: 0 bytes
- HTML内JavaScript追加: なし
- EffectClause生成: クローラー外部JavaScript
- Update03 runtime追加読込: なし

## Validation

- クローラーJavaScript / JSON構文、4回帰テスト
- 21派生JSON一括生成、既存契約10/10
- EffectClause 2回生成SHA-256比較
- `node tools/test_json_index_contract.js`
- `node tools/test_3_1_0_0_update03_version_policy.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `python -X utf8 tools/run_app_validation.py`
- `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`

ローカル結果:

- クローラー回帰: 4/4、PASS。
- 派生JSON生成: 21/21、既存JSON契約10/10、PASS。
- EffectClause: 1,810 records / 24,329 clauses / 44/44 gold、PASS。
- 決定性: 2回ともSHA-256 `e50e65d9c7b831ce9bab6e80b41fabc837df9b742038d034f4835786edbf321b`、PASS。
- App Validation: `138/138`、PASS。
- 派生JSON更新に伴いUpdate01センサスの互換索引source SHAを再生成し、決定性回帰を再合格させた。

Git / Actions、Previewの実値は確認後に追記する。

## 確認事項

なし。正式公開は行わず、Update03はPreviewで確認する。

## 次Update

Update04は戦法・技能詳細UI。構造化表示を主表示とし、「現在有効」「条件不足」「戦闘中判定」「対象外」「判定不可」を安全に表示し、原文を折り畳みで保持する。推奨エンジンはGPT-5.6 Sol / reasoning High。

## Remaining issues

Actionsと公開Previewの確認待ち。完了前に解消する。
