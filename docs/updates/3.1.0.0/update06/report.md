# 3.1.0.0 Update06 Report

## 1. Summary

Update06 r180からr183までの検索・技能カード・読込安定化を維持し、r184で技能、検索、データ管理、保存管理、軍馬編成、兵器・武装、結果サマリーの重複説明を削減する。必要説明はガイド、ツールチップ、アクセシビリティ名へ集約し、データ消失防止警告は残す。正式公開は行わない。

## 2. Bug classification and root cause

- 分類: 共通表示経路から外れた並行実装、およびLv表示範囲の誤り。
- 原因: 通常技能は`buildDetailConditionPresentation`を通る一方、参照付与技能は`renderGeneralSkills`内で参照先の全Lv原文を`fmtContent`へ直接渡していた。このため条件と効果のグループ化が行われず、付与されていないLvも混在した。
- 同系統の原因: 通常技能側も、原文明示記号からグループ化済みでも`reviewed`でない場合は旧原文を併記していたため、generatedデータで二重表示し得た。
- 恒久対策: 通常技能・参照付与技能の双方を共通Presenterへ通し、参照付与技能は指定されたRoman Lvブロックだけを抽出する。Presenterがグループを生成できたかを共通判定にし、グループ化不能時だけ旧表示へフォールバックする。
- 再発防止: 全データの重複除外200参照関係を走査し、参照先存在、指定Lv抽出、条件・効果グループ、原文開閉1個を検証する専用回帰をApp Validationへ追加する。
- 追加分類: 起動時の例外処理経路にある存在しない関数名の呼出し。
- 追加原因: データ未読込ガードだけが、実在する`clearSearchProgressTimer`ではなく未定義の`cancelSearchProgressIndicator`を呼び出していた。通常の読込完了後操作では通らないため、従来回帰で検出されていなかった。
- 追加対策: データ未読込ガードを既存の進捗タイマー停止関数へ統一し、未定義関数名の不在とガード内の正しい呼出しを専用回帰で固定する。
- r184分類: 情報設計上の冗長表示。見出し、区分名、補足文が実際の条件文・効果文・操作部品と同時に常時表示され、内容理解より先に説明を読ませる構成になっていた。
- r184原因: 技能カード改善時に内部区分を利用者向け見出しとして追加し、他画面でも機能追加ごとに説明文を常設したため、画面全体の表示基準が統一されていなかった。
- r184恒久対策: 「操作に必要な名称・状態・警告は表示、操作部品と重複する説明は非表示、必要時の説明はガイドまたはツールチップ」の共通基準へ統一する。専用文言回帰をApp Validationへ組み込み、削除した説明の再追加を検出する。

## 3. Impact scope checked

技能付与参照215出現、重複除外200関係、親技能122件、参照先112技能を全件回帰した。r184の表示監査は技能、通常検索、状態変化検索、型検索、データ管理、保存管理、軍馬編成、部隊編成の兵器・武装と結果サマリーを対象とした。計算、検索判定、保存データ、Export/Import、派生JSONは変更しない。

## 4. Files changed

`hado_detail_condition_presenter.js`、`hado_core.js`、`hado_search.js`、`hado_formation.js`、`hado_update04.css`、`hado_styles.css`、`index.html`、`hado_version.js`、技能・検索・編成の既存回帰、`tools/test_3_1_0_0_update06_ui_copy_reduction.js`、`tools/run_app_validation.py`、README、全体Roadmap、Update06記録。

`hado_version.js`はPreviewで表示削減版を識別できるようr184へ更新した。`HADO_DEV_INFO.json`は表示版の重複を避ける現行方針に従い変更していない。

## 5. HTML size change and externalization decision

`index.html`: 29,857 bytes → 28,475 bytes、-1,382 bytes。冗長な静的説明を削除し、キャッシュキーを`06-r184`へ更新した。動的表示は既存の外部JavaScript、表示調整は`hado_update04.css`で行い、HTML内JavaScript/CSSは追加していない。

## 6. Validation commands executed

- `node --check hado_core.js`
- `node tools/test_3_1_0_0_update06_referenced_skill_cards.js`
- `node tools/test_3_1_0_0_update06_user_facing_cards.js`
- `node tools/test_3_1_0_0_update06_ui_copy_reduction.js`
- `node tools/test_3_1_0_0_update06_search_clause_integration.js`
- `node tools/test_3_1_0_0_update04_detail_condition_presenter.js`
- `node tools/test_3_1_0_0_update07_score_shadow.js`
- `node tools/test_update09_5_43_search_requires_json.js`
- `node tools/test_json_index_contract.js`
- `python -X utf8 tools/validate_update_version_consistency.py`
- `python -X utf8 tools/run_app_validation.py`
- `git diff --check`
- 公開PreviewのPC・スマートフォン実操作（反映後に実施）

## 7. Validation results

専用回帰、派生JSON契約、版表示整合、全App Validation 145/145、`git diff --check`はPASS。全データ監査で参照関係200件、親技能122件、参照先112技能、参照先欠損0件を確認した。ローカルURLのブラウザ操作はブラウザ安全制限で実施せず、実画面は公開Previewで確認した。

ローカルHTTP版では次を確認した。

- 「白眉」付与LvⅠは「主将か、主将と自身が好相性の際」2効果と「出陣時」1効果の2グループ。LvⅡの「防御+15%」「主将戦法発動時」は混在しない。
- 原文開閉は1個、旧原文直表示は0個。「敏活」も共通カードで1グループになる。
- 通常技能「克遂」に旧原文の二重表示はない。検索結果の「正規ID一致」「効果あり」も0件。
- 公開JSON読込完了前に検索入力し、未読込ガードを通しても例外0件。読込完了後は同じキーワードで1件を返し、白眉カードへ遷移できる。
- PC 1280×720、スマートフォン390×844ともページ・白眉カードの横方向超過なし。ブラウザ警告・エラー0件。

## 8. Git commit and pull request

- 実装commit: `328a0c8e38b74e686661faa75c8519ecce59812b`
- Pull Request: `#311`（`feature/app-3.1.0.0`へsquash merge）
- 競合: なし。`python3 tools/check_pr_merge_readiness.py --base feature/app-3.1.0.0`でbase `17907bed8cd99d3f2cec82238a49fa5710d6691f`、head `1cc5f91fa623539e71e7ec92cb59e492c02af57e`、merge可能を確認した。
- r183安定化commit: `a49dc7fc899fc1557ce0e45069a435b002994519`
- r183 Pull Request: `#313`（`feature/app-3.1.0.0`へsquash merge）
- r183競合: なし。merge-readinessでbase `4bf3d5255f50ff9539ae81dad2e6110a9ea94513`、head `2c9d537190a019f7003265fc095635d7f3ef7786`、merge可能を確認した。
- r184実装commit: `6c2c3be07d2a4ee7d03dfc515613e93cbbaf24bc`
- r184 Pull Request: `#315`（`feature/app-3.1.0.0`へsquash merge）
- r184競合: なし。merge-readinessでbase `a00c3ce3d9098c2397948632ae7097259448389c`、head `ee1e0e43c32c70cb0dfaa817989c016865c57e88`、merge可能を確認した。

## 9. GitHub Actions result

- `App Validation / app-validation`: r182 run `32635871079`、r183 run `32636671059`、ともにPASS。
- `Notify Hado Library Preview`: r182 run `32635894809`、r183 run `32636687678`、ともにpush起動・PASS。
- 通常のPreview同期に手動実行・scheduleは使用していない。
- r184 `App Validation / app-validation`: run `32731448122`、PASS。
- r184 `Notify Hado Library Preview`: push run `32731665384`、PASS。同期とPages公開待ちを含め1分31秒で完了した。

## 10. Preview synchronization result

Preview repository `main`は`1b8a23a9d06903aa835d87bc072590e7dfb4d4c0`。`PREVIEW_SOURCE_COMMIT.txt`は`a49dc7fc899fc1557ce0e45069a435b002994519`、`PREVIEW_SOURCE_BRANCH.txt`は`feature/app-3.1.0.0`、`PREVIEW_DISPLAY_VERSION.txt`は`3.1.0.0 Update06 r183`で一致した。

`index.html`、`hado_formation.js`、`hado_styles.css`、`hadou_*.json`、`.nojekyll`、3 marker、`hado_core.js`、`hado_update04.css`の配備を確認した。

### Preview confirmation

- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `覇道ライブラリ 3.1.0.0 Update06 r183`。
- marker: source commit `a49dc7fc899fc1557ce0e45069a435b002994519` / branch `feature/app-3.1.0.0` / display `3.1.0.0 Update06 r183`。
- Preview repository commit: `1b8a23a9d06903aa835d87bc072590e7dfb4d4c0`。
- DOM/asset: r183の`hado_core.js`、`hado_search.js`、`hado_update04.css`を実行し、白眉・敏活の参照技能カードと共通条件・効果グループDOMを確認。
- 操作: 公開JSON読込中にLR馬良を入力して例外0件。読込完了後は1件を返した。白眉LvⅠは2グループ、効果数は2・1、原文開閉1個、旧原文直表示0個、LvⅡ効果混在なし。敏活は1グループ、克遂の旧原文二重表示0件、検索結果の内部ラベル0件。
- PC/スマートフォン: 1280×720、390×844ともページ・白眉カードの横方向超過なし。
- debug log: ブラウザ警告・エラー0件。
- 判定: PASS。

### r184 Preview confirmation

- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `覇道ライブラリ 3.1.0.0 Update06 r184`。
- marker: source commit `6c2c3be07d2a4ee7d03dfc515613e93cbbaf24bc` / branch `feature/app-3.1.0.0` / display `3.1.0.0 Update06 r184`。
- Preview repository commit: `e4f992dfa2e05a4f18bdba44f6d35119ba3dd930`。
- 配備: `index.html`、`hado_formation.js`、`hado_styles.css`、`hadou_*.json`一式、`.nojekyll`、3 marker、`hado_core.js`、`hado_detail_condition_presenter.js`、`hado_update04.css`を確認。
- asset: `hado_version.js?v=06-r184`と`hado_styles.css?v=06-r184`を公開URLで実行していることを確認。
- PC操作: 1280×720で`LR馬良`を検索し1件、技能タブへ遷移。白眉LvⅠは2グループ、効果数2・1、原文開閉1個、カード・ページの横方向超過0件。
- 表示削減: 白眉の「適用条件と効果」「条件ごとに～」「技能データ参照」「付与Lv:」「補足：」は0件。検索欄、データ管理、軍馬編成でも削除対象文言0件。
- ヘルプ境界: 検索履歴登録は検索欄の`aria-label`・`title`に保持。型プリセット未選択時の説明欄は非表示、型検索の`？`ヘルプは表示。
- スマートフォン操作: 390×844で白眉カードは2グループ・効果数2・1を維持し、カード・ページ・型検索の横方向超過0件。
- debug log: ブラウザ警告・エラー0件、アプリDebug Logのerror/exception/failed 0件。
- 判定: PASS。

## 11. Minimum user acceptance operation

公開Previewの「検索」で`LR馬良`を検索し、技能内の参照カード「白眉」を確認する。「適用条件と効果」「条件／発動／適用」「補足：」「技能データ参照」が表示されず、実際の条件文と効果文だけで白眉LvⅠの2グループを読み取れることを確認する。併せて検索欄、データ管理、軍馬編成の重複説明が削除されていることを確認する。

## 12. Remaining issues

none。正式公開は全Update完了後の明示承認まで実施しない。

## 確認事項

なし。ユーザーが公開Previewを開いた状態で、上記「Minimum user acceptance operation」を代理実行して合格した。Update07は完了済みのため、次はUpdate08「結果サマリー・全画面統一」。推奨エンジンはGPT-5.6 Sol / reasoning High。
