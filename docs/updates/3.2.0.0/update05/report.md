# 3.2.0.0 Update05 完了報告

## 1. Summary

Update05は完了した。詳細画面の確認順、参照技能の親子関係、技能レベルとの同期、重複説明を是正し、ローカル回帰、PR、Actions、自動Preview同期、公開サイトのPC・スマートフォン実操作まで合格した。Production・正式版には反映していない。

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

- 実装commit: `3fa5c17a59dacb87cbc11678f64e067d1d1f3173`
- PR: [#406](https://github.com/mytemark2/hado_library/pull/406)
- PR base: `feature/app-3.2.0.0`
- 開始・取得base SHA: `173e87c057e8f6a30aa085b0bb27775b769ada41`
- merge commit: `82b9f23cd5f7bd96be423de5ff20cfb79c9b6b3f`
- merge readiness: head `3fa5c17a59dacb87cbc11678f64e067d1d1f3173`、base `173e87c057e8f6a30aa085b0bb27775b769ada41`、競合なし。旧PR・旧ブランチ・無関係な生成物の混入なし。

## 9. GitHub Actions result

- PR App Validation: success（run `41254385710`、52秒）
- Notify Hado Library Preview: success（run `41254457163`、1分17秒）
- 通常のpush起点・イベント駆動同期で実行し、手動dispatch・定期pollingは使用していない。

## 10. Preview synchronization result

Preview同期と公開実動作を確認済み。Update05はPreview完了。

### Preview confirmation

- 公開URL: https://mytemark2.github.io/hado_library-preview/?v=05-r219&source=82b9f23
- 表示版: `3.2.0.0 Update05 r219`
- 実装Preview確認時のapp repository branch / HEAD: `feature/app-3.2.0.0` / `82b9f23cd5f7bd96be423de5ff20cfb79c9b6b3f`
- 実装Preview確認時のPreview repository `main` HEAD: `0fcfd2f0216e249ad22c235e441d768334c82a78`
- marker: `PREVIEW_SOURCE_COMMIT.txt=82b9f23cd5f7bd96be423de5ff20cfb79c9b6b3f`、`PREVIEW_SOURCE_BRANCH.txt=feature/app-3.2.0.0`、`PREVIEW_DISPLAY_VERSION.txt=3.2.0.0 Update05 r219`
- required files: `index.html`、`hado_formation.js`、`hado_styles.css`、`.nojekyll`、marker 3件、`hadou_*.json` 36件を確認。
- Runtime assets: `hado_core.js?v=05-r219`、`hado_styles.css?v=05-r219`、`hado_skill_level_toggle.js?v=05-r219` の参照を公開DOMで確認。
- DOM checks: 武将詳細タブは `基礎 → 戦法 → 技能 → 関連 → 変化率 → その他`、初期選択は `基礎`。技能詳細は `内容詳細 → 変化率`。
- operation checks: `LR袁紹 → 轟名` 内に `参照技能`、`轟名から付与`、`轟天Lv3`、`盟主Lv2` を確認。`轟名` 直接詳細の同一条件文は1回のみ。`壮望` の選択をLvⅠからLvⅡへ切り替えると参照技能 `壮志` もLvⅠからLvⅡへ同期。親技能の可視レベルパネルは常に1件。
- responsive checks: PC 1280×720、スマートフォン390×844で文書・参照技能カードの横はみ出し0。
- debug-log checks: 公開アプリ内検証 `OK`、`criticalFailures=0`、`warnings=0`、`info=0`。ブラウザconsoleのwarn/error 0件。
- 判定: PASS

## 11. Minimum user acceptance operation

公開Previewで `LR袁紹` を検索し、詳細の `技能` タブで `轟名` 内に `轟天Lv3` と `盟主Lv2` が表示されること、`轟名` の直接詳細で同じ説明が二重表示されないことを確認した。追加の利用者確認は不要。

## 12. Remaining issues

なし。`file://` 全体回帰は既定計画どおりUpdate08で実施し、Update05の未完了ゲートには含めない。

## 13. 確認事項

なし。
