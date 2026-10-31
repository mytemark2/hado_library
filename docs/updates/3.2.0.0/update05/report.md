# 3.2.0.0 Update05 完了報告

## 1. Summary

実装とローカル検証は完了した。公開Preview確認後にUpdate05の完了判定を記録する。

## 2. Bug classification and root cause

- 分類: 情報階層・関連付け・重複表示の設計不整合。
- 原因: 参照技能を親技能とは別の同列カードとして連結し、直接技能詳細では構造化説明とレベル説明を独立に連結していた。初期タブも利用者の確認順ではなく旧「概要」を固定していた。

## 3. Impact scope checked

武将詳細、技能詳細、参照技能、技能レベル切替、部隊編成技能表示、検索からの詳細遷移、保存互換、Export / Importを対象とする。

## 4. Files changed

- 実装: `hado_core.js`、`hado_styles.css`
- 版・キャッシュ: `hado_version.js`、`HADO_DEV_INFO.json`、`index.html`
- Update記録: `docs/updates/README.md`、`docs/updates/3.2.0.0/roadmap.md`、`docs/updates/3.2.0.0/update05/{roadmap,implementation,report}.md`
- 回帰: `tools/test_3_2_0_0_update05_detail_hierarchy.js`、`tools/run_app_validation.py`
- 現行版識別子に追従する既存回帰11件と、参照技能階層に追従する既存回帰1件
- 一次JSON・派生JSON: 変更なし

## 5. HTML size change and externalization decision

- `index.html`: 28,997 bytes → 28,997 bytes（0 bytes）
- キャッシュ識別子のみ更新。動作とスタイルは外部ファイルへ実装した。

## 6. Validation commands executed

- `node --check hado_core.js`
- `node tools/test_3_1_0_0_skill_level_toggle.js`
- `node tools/test_3_1_0_0_update04_detail_condition_presenter.js`
- `node tools/test_3_1_0_0_update06_referenced_skill_cards.js`
- `node tools/test_3_2_0_0_update05_detail_hierarchy.js`
- `python tools/validate_update_version_consistency.py`
- `python tools/run_app_validation.py`
- `git diff --check`

## 7. Validation results

- 全179項目合格。
- 701技能、実在レベル1,748件、未実在プレースホルダー1,757件の除外を確認。
- 条件gold 44件、全技能索引1,480件、関連参照14,309件を回帰。
- 保存データExport / Import往復、検索、詳細、編成、PC・スマートフォン契約を合格。
- 生成JSON契約21ファイルは整合し、JSON自体の変更はない。

## 8. Git commit and pull request

実装完了後に追記する。

## 9. GitHub Actions result

未実施。

## 10. Preview synchronization result

未実施。現時点ではPreview完了ではない。

### Preview confirmation

- 公開URL: https://mytemark2.github.io/hado_library-preview/
- 表示版: 未確認
- marker: 未確認
- Preview repository commit: 未確認
- DOM checks: 未確認
- operation checks: 未確認
- debug-log checks: 未確認
- 判定: BLOCKED（実装・検証中）

## 11. Minimum user acceptance operation

公開Previewで `LR袁紹` を検索し、詳細の `技能` タブで `轟名` 内に `轟天Lv3` と `盟主Lv2` が表示されること、`轟名` の直接詳細で同じ説明が二重表示されないことを確認する。

## 12. Remaining issues

PR、Actions、Preview同期、公開実動作確認が未完了。ローカル回帰は完了。

## 13. 確認事項

なし。
