# 3.1.0.0 r193 技能レベル単一選択・タググループ折り畳み Report

## 1. Summary

技能レベルを単一選択式へ変更し、技能名右側へ有効レベルを表示した。タグ選択をグループ単位の折り畳み式にし、カテゴリ表記と条件・発動タグの導線を修正した。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: UI選択モデルと情報階層の不一致。
- 原因: レベルボタンが独立トグルとして実装され、同一技能内で複数説明を同時表示できた。タググループは全候補を初期展開し、全適用カテゴリを表示していたため、現在の武将検索に対して「武将・戦法・装備」と表示された。
- 恒久対策: 技能レベルを単一選択モデルへ変更し、タグカテゴリを現在の検索対象へ連動させる。

## 3. Impact scope checked

武将技能、参照付与技能、技能詳細、部隊編成技能、通常検索、状態変化検索、型検索、タグ候補、選択済みタグ、PC、390x844。

## 4. Files changed

`hado_skill_level_toggle.js`、`hado_core.js`、`hado_formation.js`、`hado_status_effects.js`、`hado_styles.css`、`hado_version.js`、`index.html`、回帰テスト、README、Roadmap、r193記録。JSON、crawler、`HADO_DEV_INFO.json`は変更しない。

## 5. HTML size change and externalization decision

`index.html`: Git blob 28,822 bytes → 28,822 bytes、±0 bytes。既存外部JavaScript/CSSを修正し、HTMLには`r193`キャッシュキーだけを反映した。

## 6. Validation commands executed

- `node --check hado_skill_level_toggle.js`
- `node --check hado_core.js`
- `node --check hado_formation.js`
- `node --check hado_status_effects.js`
- `node tools/test_3_1_0_0_skill_level_toggle.js`
- `node tools/test_update11_tag_organization.js`
- `node tools/test_3_1_0_0_update06_search_clause_integration.js`
- `node tools/test_3_1_0_0_update06_referenced_skill_cards.js`
- `node tools/test_3_1_0_0_update06_user_facing_cards.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/run_app_validation.py`

## 7. Validation results

- 技能661件・元データ3305レベルを全件監査し、存在する1661レベルだけを表示、存在しない1644レベルを除外した。
- 同一技能は常に1レベルだけを表示し、選択中レベルの再クリックでも表示を維持することを確認した。
- 武将技能、参照付与技能、部隊編成技能の有効レベル表示を確認した。
- 条件タグ24件、発動タグ7件、正規状態変化参照5930件を確認した。
- 派生JSON契約は21ファイル、全体検証は156コマンドすべて合格した。JSON内容の変更はない。

## 8. Git commit and pull request

- 実装commit: `85ff99f1a76f6f9e3aaa1ea2924716acb778b0bb`
- 開発ブランチ統合commit: `82d64bf8efb56a1c520cfae15790f98ea6779703`
- Pull request: `#333`（base: `feature/app-3.1.0.0`、merged）
- Merge readiness: base `a4e1b0d215d610357eba454ea9965e86dffcb1f0`、head `85ff99f1a76f6f9e3aaa1ea2924716acb778b0bb`、競合なし。

## 9. GitHub Actions result

- `App Validation / app-validation`: success（PR #333）
- `Notify Hado Library Preview`: success（run `33225229956`、source `82d64bf8efb56a1c520cfae15790f98ea6779703`）

## 10. Preview synchronization result

### Preview confirmation

- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `3.1.0.0 r193`
- Preview repository commit: `82b66311e771c2bc83c84f1f82dc2eab1f884c10`
- `PREVIEW_SOURCE_COMMIT.txt`: `82d64bf8efb56a1c520cfae15790f98ea6779703`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.1.0.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.1.0.0 r193`
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`.nojekyll`、marker 3ファイル、`hadou_*.json` 36件を確認。
- DOM・操作: 武将技能と部隊編成技能で有効レベルを右側表示し、レベル変更後も選択中1件・表示説明1件を維持した。選択中レベルの再クリックでも閉じない。
- タグ: 初期全グループ非表示、見出しクリック開閉、武将カテゴリ表記、条件24件・発動7件、タグ選択・解除・絞り込みを確認。
- 390×844: 技能レベル、タググループとも横はみ出しなし。
- Debug log: 表示切替正常、ブラウザconsole warning/error 0件。
- 判定: PASS。

## 11. Minimum user acceptance operation

公開Previewで武将技能のレベルを切り替え、選択した1レベルだけが表示されること、技能右側に有効レベルが表示されることを確認する。タグ画面では初期状態が折り畳みで、武将カテゴリ表示、条件・発動グループの開閉とタグ選択を確認する。

## 12. Remaining issues

なし。正式公開は未実施。

## 確認事項

なし。正式公開は利用者の明示承認まで行わない。
