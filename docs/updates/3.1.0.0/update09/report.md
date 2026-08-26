# 3.1.0.0 Update09 Report

## 1. Summary

Update09で全データ回帰と正式版候補確認を行い、Previewを`3.1.0.0 r190`へ更新する。正式公開は行わない。

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

実装・Preview反映後に確定する。

## 8. Git commit and pull request

反映後に確定する。

## 9. GitHub Actions result

反映後に確定する。

## 10. Preview synchronization result

反映後に公開Pagesと3 markerを確認して確定する。

## 11. Minimum user acceptance operation

公開Previewで版表示、検索、詳細、保存編成、結果サマリーを確認する。Codex側で実施し、追加確認が必要な場合だけ利用者へ明記する。

## 12. Remaining issues

Preview確認前のため未完了。正式公開は利用者の明示承認まで行わない。

## 確認事項

なし。Update09完了後は正式公開の明示承認待ちとなる。

推奨エンジン: GPT-5.6 Sol / reasoning High。
