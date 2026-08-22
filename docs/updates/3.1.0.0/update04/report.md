# 3.1.0.0 Update04 Report

## 状態

完了。実装、ローカル検証、Pull Request、GitHub Actions、Preview同期、公開URL実操作をすべて確認した。

## 1. Summary

- 44件のreviewed EffectClauseを武将戦法、武将技能、技能、状態変化の詳細表示へ接続した。
- generated-only Clauseは意味を推測せず、原文と「構造化確認中」の案内へフォールバックする。
- LR袁紹の戦法は、常時効果2件、主将効果1件、主将かつ兵力50%以上の700%効果1件に分けて表示する。
- 条件、効果、現在状態を分離し、確認用の原文は初期状態を閉じたまま保持する。
- Update05の既存実装とクローラ修正を保持し、Update04のPreview完了後に再開する。

## 2. Bug classification and root cause

- 分類: 条件付き効果の表示欠落および条件境界の不明瞭さ。
- 原因: 構造化済みEffectClauseを詳細画面へ提示する共通層がなく、原文をそのまま表示していた。
- 恒久対策: reviewedデータだけを利用する共通プレゼンターを追加し、未確認データには推測を許さない原文フォールバックを設けた。

## 3. Impact scope checked

- 武将詳細の戦法・技能
- 単独技能詳細
- 状態変化詳細
- LR袁紹の複合条件表示
- Update05編成判定との共存
- PC 1280 x 720、スマートフォン 390 x 844
- 検索、詳細、編成、保存データExport / Importを含むApp Validation全体

## 4. Files changed

- `hado_detail_condition_presenter.js`: 条件付き効果の共通表示モデルとHTML生成。
- `hado_update04.css`: PC・スマートフォン共通の条件カード表示。
- `hado_formation_condition_evaluator.js`: generated Clause検索API。
- `hado_core.js`: 武将・技能詳細への接続。
- `hado_formation.js`: 状態変化詳細への接続。
- `index.html`: 外部CSS・JavaScript読込とUpdate04キャッシュキー。
- `hado_version.js`, `HADO_DEV_INFO.json`: `3.1.0.0 Update04 r177`。
- `tools/test_3_1_0_0_update04_detail_condition_presenter.js`, `tools/run_app_validation.py`: 回帰テスト。
- Update04 Roadmap、実装記録、本報告書、および全体Roadmap・README。
- Update01 censusの入力SHAとJSON contractの派生ファイルSHAを現物へ合わせた。件数・分類・データ本体の変更はない。

## 5. HTML size change and externalization decision

- `index.html`: 29,463 bytes -> 29,623 bytes、+160 bytes。
- 表示ロジックとスタイルは新規外部ファイルへ分離し、HTMLには読込宣言のみを追加した。
- 旧来の単一巨大スクリプトは再作成していない。

## 6. Validation commands executed

- `node tools/test_3_1_0_0_update04_detail_condition_presenter.js`
- `node tools/test_3_1_0_0_update05_formation_condition_evaluator.js`
- `node tools/test_3_1_0_0_update05_version_policy.js`
- `node tools/test_json_index_contract.js`
- `python tools/run_app_validation.py`
- ローカルHTTPでPC・スマートフォン実ブラウザ操作

## 7. Validation results

- Update04対象44件と未確認フォールバック: PASS。
- Update05判定44件・5状態との共存: PASS。
- 派生JSON 21ファイルの契約: PASS。
- App Validation: 140 / 140 PASS。
- LR袁紹の4効果と700%の複合条件: PASS。
- PC: カード252 / 252 px、各行250 / 250 px、横あふれなし。
- スマートフォン: カード273 / 273 px、各行271 / 271 px、横あふれなし。
- 原文は初期状態で閉じ、開閉後も横あふれなし。
- ブラウザのerror / warningログ: 0件。

## 8. Git commit and pull request

- 実装commit: `8d2a0e74c038afa10f93291d5c8793469e91acda`
- 統合commit: `3a6e1c194a81f8772bb737a27019ce62a2e3dae0`
- Pull Request: #300 `3.1.0.0 Update04 条件付き効果の詳細表示`
- base: `feature/app-3.1.0.0`、base SHA: `1574d8e49e9e20888d087bb5b1089e181db3e8a8`
- merge-readiness: 競合なし、PASS。

## 9. GitHub Actions result

- `App Validation / app-validation`: PASS。
- Pull Request run: `32604920864`、job: `97108491999`。
- `Notify Hado Library Preview`: PASS。
- push run: `32604955872`、job: `97108573058`、1分19秒。

## 10. Preview synchronization result

### Preview confirmation

- 状態: PASS、Preview完了。
- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `3.1.0.0 Update04 r177`
- app branch / HEAD: `feature/app-3.1.0.0` / `3a6e1c194a81f8772bb737a27019ce62a2e3dae0`
- preview repository / HEAD: `mytemark2/hado_library-preview` / `e270db4543a3c40b6523f4aea22400b7799e4af4`
- `PREVIEW_SOURCE_COMMIT.txt`: `3a6e1c194a81f8772bb737a27019ce62a2e3dae0`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.1.0.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.1.0.0 Update04 r177`
- 必須ファイル: `index.html`, `hado_formation.js`, `hado_styles.css`, `hado_update04.css`, `hado_detail_condition_presenter.js`, `.nojekyll`, 3マーカー、`hadou_*.json`を確認した。
- DOM: Update04 CSS・JavaScript読込、条件カード4行、原文detailsを確認した。
- 操作: LR袁紹を検索し、戦法タブで常時2件、主将1件、主将かつ兵力50%以上1件を確認した。
- PC: カード252 / 252 px、行250 / 250 px、横あふれなし。
- スマートフォン390 x 844: カード273 / 273 px、行271 / 271 px、横あふれなし。
- 原文開閉: 初期状態は閉、開いた状態273 / 273 px、再度閉じられることを確認した。
- debug log: error / warning 0件。

## 11. Minimum user acceptance operation

PreviewでLR袁紹の詳細を開き、700%効果に「主将」「兵力50%以上」が同時表示され、原文を任意に開閉できることを確認する。

## 12. 確認事項

なし。Update05を再開する。推奨エンジンはGPT-5.6 Sol / reasoning High。

## 13. Remaining issues

なし。Update05で保留中の関連リンク監査不一致はUpdate04の残件ではなく、Update05のクローラ修正から再開する。
