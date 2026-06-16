# Update09 Report

## Phase 1: UI/UX監査レポート

## Summary
- Update09の最初の作業として、現行UI/UXの問題点を「性能」「部隊編成レイアウト」「ガイド」「補足説明」「操作導線」の5分類で整理した。
- 各分類に対し、実装可能性と既存アーキテクチャへの影響を踏まえた改善案を3つずつ提示した。
- 実装順は、性能改善 → 部隊編成ポップアップ化 → 導線統合 → ガイド/説明整理 → PC/スマホ回帰を推奨する。

## Bug classification and root cause
- 分類: UI/UX改善前調査。特定の単一不具合ではなく、Update08までに機能追加を優先した結果として、表示密度、再描画範囲、横断導線、ガイド世代差が積み上がったもの。
- 根本原因:
  - 部隊編成画面の描画責務が大きく、軽い表示状態変更でも全体描画へ流れやすい。
  - 型編成ナビ、型候補一覧、候補トレイ、部隊編成が別UIとして追加され、全体の操作順を示す統合ナビゲーションが不足している。
  - 仕様説明を常時表示する箇所が残り、主操作の視認性を下げている。
  - スタートガイドが最新の保存データ対応型候補・候補トレイ・評価履歴導線を十分に反映していない。

## Impact scope checked
- 部隊編成画面の描画・レイアウト・スロット変更導線。
- 型編成ナビの主将選択、目的選択、型選択、確認フロー。
- 型候補一覧の保存データ表示、ロール別候補、検索、診断/キャッシュ方針。
- 候補トレイの表示、解除、配置先選択、既存ゲート委譲。
- スタートガイド、型検索ヘルプ、補足説明表示。
- 全データ表示/保存データ表示の見分け方。

## Files changed
- `docs/updates/roadmap.md`: Update09の状態を予定から調査・設計中へ更新。
- `docs/updates/update09/roadmap.md`: Update09の目的、優先テーマ、フェーズ計画、完了条件を追加。
- `docs/updates/update09/implementation.md`: UI/UX問題点と各3案の改善案、推奨実装順、検証方針を追加。
- `docs/updates/update09/report.md`: Phase 1の調査結果、根本原因、影響範囲、検証結果を記録。

## HTML size change and externalization decision
- HTMLサイズ変更: なし。
- 外部化判断: Phase 1はドキュメントのみ。今後の実装は既存責務の外部JS/CSSへ統合し、HTMLへ大型ロジックを追加しない。

## Validation commands executed
- `python3 -m json.tool HADO_DEV_INFO.json`
- `python3 tools/validate_app_js.py`
- `python3 tools/validate_external_css.py`
- `python3 tools/validate_type_candidate_render_performance.py`
- `python3 tools/validate_update_version_consistency.py`

## Validation results
- `python3 -m json.tool HADO_DEV_INFO.json`: PASS。
- `python3 tools/validate_app_js.py`: PASS（js=14, json=36, html_identity=ok）。
- `python3 tools/validate_external_css.py`: PASS（HTML references hado_styles.css and has no style blocks/attributes）。
- `python3 tools/validate_type_candidate_render_performance.py`: PASS（cached rows, async diagnostics, suspended bulk traces）。
- `python3 tools/validate_update_version_consistency.py`: PASS（3.0.0.0 Update08.23 / revision 31 / single source hado_version.js）。

## Git commit and pull request
- ローカルGitコミット作成済み。Pull RequestはCodexのPR記録として作成する。

## GitHub Actions result
- 未実行。Phase 1のローカル調査PR作成後、リモートPush/Actions/preview同期の確認が必要。

## Preview synchronization result
- 未実行。Phase 1のローカル調査PR作成後、push-triggered preview同期の確認が必要。

## Minimum user acceptance operation
1. Update09の問題点分類が、ユーザー申告の5項目を網羅していることを確認する。
2. 各分類に3つずつ改善案があり、優先順位に違和感がないことを確認する。
3. 次フェーズで最初に着手する改善案を選択する。

## Remaining issues
- Phase 1時点では実装変更は未着手。
- ブラウザ上のPC/スマホ実操作確認、GitHub Actions、preview同期確認は次フェーズ以降で実施する。


## Phase 2: 性能・再描画改善レポート

## Summary
- 部隊編成の重い状態変化率/合算技能計算を、編成内容と保存データの署名でキャッシュするようにした。
- 型候補一覧のロール別スコア計算結果を検索語から分離し、検索欄入力では再スコアリングせず文字列フィルタだけ行うようにした。
- 可視バージョンを `3.0.0.0 Update09.0` へ更新した。

## Bug classification and root cause
- 分類: 性能改善。
- 根本原因: 部隊編成画面では、編成内容が変わらない操作でも `buildFormationParameterData()` が再実行されやすかった。型候補一覧では、検索語が変わるたびにロール候補のスコア計算・所有判定まで再実行される構造だった。

## Impact scope checked
- 部隊編成の編成タブ、戦法タブ、変化率タブ、詳細タブ。
- 部隊編成の選択スロット変更、ダイアログ開閉、結果サマリー表示。
- 型候補一覧のロール別件数、検索欄入力、保存データ表示での所有候補フィルタ。
- 表示バージョン同期、HTML/CSS外部化、プレビュー/merge queue workflow定義。

## Files changed
- `hado_formation.js`: 部隊編成パラメータ計算キャッシュを追加。
- `hado_type_candidates.js`: 型候補一覧のロール別ベースキャッシュと検索語フィルタ分離を追加。
- `hado_version.js`: 可視バージョンを `Update09.0` に更新。
- `HADO_DEV_INFO.json`: 開発概要と更新日時をUpdate09性能改善へ更新。
- `docs/updates/update09/implementation.md`: Phase 2実装記録を追記。
- `docs/updates/update09/report.md`: Phase 2検証・残課題を追記。

## HTML size change and externalization decision
- HTMLサイズ変更: なし。
- 外部化判断: 既存責務の外部JSに統合し、HTMLへ大型ロジックは追加していない。

## Validation commands executed
- `node --check hado_formation.js`
- `node --check hado_type_candidates.js`
- `python3 -m json.tool HADO_DEV_INFO.json`
- `python3 tools/validate_app_js.py`
- `python3 tools/validate_external_css.py`
- `python3 tools/validate_type_candidate_render_performance.py`
- `python3 tools/validate_update_version_consistency.py`
- `python3 tools/validate_formation_link_helpers.py`
- `python3 tools/validate_preview_workflow.py`
- `python3 tools/validate_merge_queue_workflow.py`
- `python3 tools/validate_auto_merge_workflow.py`

## Validation results
- `node --check hado_formation.js`: PASS。
- `node --check hado_type_candidates.js`: PASS。
- `python3 -m json.tool HADO_DEV_INFO.json`: PASS。
- `python3 tools/validate_app_js.py`: PASS（js=14, json=36, html_identity=ok）。
- `python3 tools/validate_external_css.py`: PASS。
- `python3 tools/validate_type_candidate_render_performance.py`: PASS。
- `python3 tools/validate_update_version_consistency.py`: PASS（3.0.0.0 Update09.0 / revision 32）。
- `python3 tools/validate_formation_link_helpers.py`: PASS。
- `python3 tools/validate_preview_workflow.py`: PASS。
- `python3 tools/validate_merge_queue_workflow.py`: PASS。
- `python3 tools/validate_auto_merge_workflow.py`: PASS。

## GitHub Actions result
- 未実行。ローカル環境ではpush後のActions実行結果を確認できないため、PR作成後に確認が必要。

## Preview synchronization result
- 未実行。ローカル環境ではpush-triggered preview同期を確認できないため、PR作成後に確認が必要。

## Minimum user acceptance operation
1. 部隊編成画面を開き、スロット選択・タブ切替・結果サマリー拡大/閉じるを連続操作して、以前より固まりにくいことを確認する。
2. 部隊編成で武将または装備を変更した後、合算技能・状態変化率・結果サマリーが最新内容へ更新されることを確認する。
3. 型候補一覧を開き、ロール切替後に検索欄へ文字入力/削除しても、候補一覧の反応が重くなりにくいことを確認する。
4. 保存データ表示で型候補一覧を開き、所有済み候補だけが表示され、検索しても候補数やスコアが不自然に変わらないことを確認する。
5. 画面タイトルまたはアプリ上部の表示が `3.0.0.0 Update09.0` になっていることを確認する。

## Remaining issues
- ブラウザ実機でのPC/スマホ体感確認、GitHub Actions、preview同期確認は未実施。
- Phase 3以降の部隊編成レイアウト/ポップアップ化、ガイド整理、導線統合は未着手。


## Phase 3: 部隊編成レイアウト改修メモ

### 変更概要
- Phase 3着手に向け、可視表示を `Update09.x.y` 形式で管理する方針を追加した。Phase 3初回は `3.0.0.0 Update09.3.0` とする。
- グループ表示、型選択、スコア表示、保存/履歴、マイメモ編集のPhase 3改修メモを追加した。
- 実装前の設計整理のため、HTMLサイズ変更はない。

### ユーザー受け入れ確認項目
1. Phase 3実装後、画面上部の表示が `3.0.0.0 Update09.3.0` 以降になっていることを確認する。
2. 部隊編成のグループ行が、ボタンを含めて1行で表示され、名前変更は別ダイアログで行えることを確認する。
3. 型選択が重複表示されず、表示型IDが通常UIに出ていないことを確認する。
4. トータルスコアと評価スコアが入力ダイアログではなく、自動計算の読み取り専用表示としてまとまっていることを確認する。
5. 履歴へ保存ボタンがなく、保存ボタンで保存できること、マイメモは1行表示で編集時のみ別ダイアログになることを確認する。

### 検証
- `python3 -m json.tool HADO_DEV_INFO.json`: PASS。
- `python3 tools/validate_update_version_consistency.py`: PASS。
- `python3 tools/validate_app_js.py`: PASS。
- `python3 tools/validate_external_css.py`: PASS。

### 未解決事項
- Phase 3の画面実装とPC/スマホ実操作確認は次作業。
- GitHub Actionsとpreview同期確認はpush後に実施が必要。


## Phase 3: Preview workflow Node.js 20 warning follow-up

### 調査結果
- `Notify Hado Library Preview` の提示ログに出ていた `Node.js 20 actions are deprecated` は、preview同期処理本体の失敗原因ではなく、JavaScript Actionの実行ランタイム移行に関するGitHub Actions runnerの警告である。
- 該当箇所は `actions/checkout@v4` であり、preview同期の成否は別途 `Require preview repository token`、`Sync preview repository contents`、`Dispatch preview Pages deployment workflow`、`Verify preview reflects source commit and version assets` の各ステップ結果で判断する必要がある。

### 対応
- `Notify Hado Library Preview` と `App Validation` の `actions/checkout` を Node.js 24 対応版の `actions/checkout@v5` へ更新した。
- `Auto-merge Internal PR` の `actions/github-script` を Node.js 24 対応版の `actions/github-script@v8` へ更新した。
- workflow契約検証スクリプトを更新し、古いNode.js 20世代のAction指定へ戻った場合に検知できるようにした。

### 残確認
- GitHub Actions上で `Notify Hado Library Preview` を再実行し、警告解消と実際の失敗ステップ有無を確認する。
- preview公開URLの `PREVIEW_SOURCE_COMMIT.txt`、`PREVIEW_SOURCE_BRANCH.txt`、`PREVIEW_DISPLAY_VERSION.txt`、`hado_version.js` が期待値に一致することを確認する。


## Phase 3: Preview workflow dispatch 403 follow-up

### 調査結果
- `Dispatch preview Pages deployment workflow` で `Resource not accessible by personal access token` / HTTP 403 が出る場合、preview repoへの同期push自体ではなく、preview repoの Pages workflow を API dispatch する権限が `PREVIEW_REPO_TOKEN` に不足している。
- preview repo側の `jekyll-gh-pages.yml` は push trigger も持つ前提で検証しているため、app workflowが preview repo `main` へpushした後は、dispatch権限がなくてもpush-triggered Pages公開で反映される可能性がある。
- 重要なのはdispatch APIの成功だけではなく、最後の `Verify preview reflects source commit and version assets` で公開URLのcommit/version/CSSが期待値と一致することである。

### 対応
- `Dispatch preview Pages deployment workflow` のHTTP 403は即失敗にせず、警告を出して最終preview検証へ進むようにした。
- HTTP 204の場合は従来通りdispatch成功として扱い、403以外の想定外HTTP statusは失敗させる。
- `PREVIEW_REPO_TOKEN` の必須権限説明を Contents Read/Write 中心へ見直し、Actions Read/Writeは即時dispatch用の任意権限として扱う。
- workflow契約検証に、dispatch 403時も最終preview検証が必須であることのチェックを追加した。

### 残確認
- GitHub Actions上で `Notify Hado Library Preview` を再実行し、dispatch 403が警告扱いになった後、`Verify preview reflects source commit and version assets` が成功することを確認する。
- final verificationが失敗する場合は、preview repo側のpush trigger Pages workflowが実行されているか、または `PREVIEW_REPO_TOKEN` に Actions Read/Write を付与する必要がある。


## Phase 3.1: 部隊編成レイアウト実装レポート

### 変更概要
- `3.0.0.0 Update09.3.1` として、Phase 3で未実装だった部隊編成レイアウト/変更ダイアログの主要項目を実装した。
- グループ行を1行表示にし、名前変更を別ダイアログへ分離した。
- 型IDの通常表示入力欄、スコア入力欄、履歴へ保存ボタン、履歴一覧の常時表示を廃止した。
- トータルスコア/評価スコアは自動計算の読み取り専用サマリーとし、評価スコアと内訳をトータルスコア配下へ表示した。
- マイメモは1行表示にし、編集時のみ別ダイアログを開くようにした。
- 編成盤面のスロット選択はPC/スマホ共通でポップアップ編集を開くようにした。

### 受け入れ確認項目
1. PC幅で、部隊編成のグループ行がグループ選択・現在名・名前変更・追加ボタンを含めて1行に収まること。
2. グループ名の変更がインライン入力ではなく、別ダイアログで完結すること。
3. 型選択状態が型名だけで表示され、表示型IDの読み取り専用入力欄が出ないこと。
4. トータルスコア/評価スコアの入力欄がなく、読み取り専用の自動計算サマリーと内訳だけが表示されること。
5. `履歴へ保存` ボタンが出ず、保存ボタンで現在の自動計算スコアが保存されること。
6. マイメモが1行表示で、編集ボタンから別ダイアログを開いて編集できること。
7. PCでも編成盤面の武将枠を選ぶと、武将・装備・侍従変更ダイアログが開くこと。

### 検証
- `python3 tools/validate_update09_phase3_formation_ui.py`: PASS。

### 残確認
- ブラウザ実機でのPC/スマホ操作確認、GitHub Actions、preview同期確認はpush後に実施する。


## Phase 3.2: 部隊編成描画エラー修正レポート

### 不具合分類・根本原因
- 分類: Phase 3 UI実装時の参照漏れによる描画停止。
- 根本原因: 右側の常時編集カードを案内表示へ変更した際にも、軍馬カード側で `renderFormationWarhorseSlotsHtml()` を呼び続けていたが、このヘルパーが `hado_formation.js` に存在しなかった。

### 対応
- `renderFormationWarhorseSlotsHtml()`、`setFormationWarhorseSlot()`、`openFormationWarhorseEditFromSlot()`、`getWarhorseAssignmentOptionLabel()` を追加し、軍馬3枠の表示・選択・解除・編集導線を復元した。
- Phase 3 UI契約検証へ軍馬関連ヘルパーの存在確認を追加した。
- 可視バージョンを `3.0.0.0 Update09.3.2` へ更新した。

### 受け入れ確認
1. 部隊編成画面を開いて、描画エラーが発生しないこと。
2. 編成タブ内に軍馬3枠が表示されること。
3. 登録済み軍馬を選択/解除でき、編集ボタンから軍馬編成へ移動できること。


## Phase 3.3: 追加UI整理レポート

### 不具合分類・根本原因
- 分類: Phase 3 UI改善後の表示密度・説明過多・スコア算出認識差分の是正。
- 根本原因: Phase 3.1ではポップアップ編集の案内パネルを残していたため、利用者が必要とするスコア表示位置を占有していた。また、スコア算出が各武将枠の合算ではなく編成要素の充足率ベースであり、ユーザー認識とずれていた。

### 影響範囲
- 部隊編成の編成タブ、スコア表示、グループ行、グループ変更ダイアログ、軍馬選択カード。
- 型候補一覧のヘッダー説明表示。
- 保存時に保持される自動計算スコア値。

### 対応
- 案内パネルを削除し、同じ位置へ自動計算スコアパネルを移動した。
- トータルスコア/評価スコアを主将・副将・補佐の各武将枠スコア合算に変更した。
- グループ行を `グループ`、`グループリスト`、`変更` へ簡素化し、変更ダイアログで新規作成・名前変更・削除を実行できるようにした。
- 型候補一覧は `選択中の型 / 目的 / 全データ表示または保存データ表示` の1行表示へ整理した。
- 軍馬選択の編集ボタンを除去し、スマホでも3枠が横並びになるCSSを追加した。
- 再発防止として Phase 3 UI契約検証を更新し、廃止文言・廃止ボタン・型候補説明の契約を検査対象へ追加した。

### 受け入れ確認
1. 部隊編成画面で `編集はポップアップで行います` パネルが表示されず、その位置に `トータルスコア` が表示されること。
2. 武将を変更すると、主将・副将・補佐ごとのスコア内訳とトータルスコア/評価スコアが合算値として更新されること。
3. グループ行が `グループ`、`グループリスト`、`変更` だけになり、変更ダイアログで新規作成・名前変更・削除できること。
4. 型候補一覧の上部が `選択中の型 / 目的 / 全データ表示または保存データ表示` の1行だけになっていること。
5. 軍馬選択に `編集` ボタンがなく、スマホ幅で3つの軍馬枠が横並びで表示されること。

## Phase 3.3 preview通知失敗調査

### 不具合分類・根本原因
- 分類: preview同期前の必須アセット検証失敗。
- 根本原因: `Notify Hado Library Preview` の `Validate source preview assets before sync` ステップは、previewへ同期するルート直下アセットとして `index.html`、`hado_library_3.0.0.0.html`、`hado_styles.css`、`hado_version.js` の4ファイルを必須としている。提示ログでは、このうち `hado_library_3.0.0.0.html` がチェックアウト済みworkspaceに存在しなかったため、preview repoへ同期する前に意図通り停止した。
- 補足: ローカルの現在HEADでは `hado_library_3.0.0.0.html` は存在し、同じ検証スクリプトもPASSした。そのため、失敗したActions runは「現在HEADそのもののCSS/JSエラー」ではなく、実行対象SHA/ブランチのチェックアウト結果に必須previewアセットが欠けていたことが直接原因である。

### 対応
- `notify-preview.yml` の必須アセット検証を、単に `Required preview source asset missing` で停止するだけでなく、欠落ファイル、存在している必須アセット、workflowから見えているルートファイル一覧を出力する診断メッセージへ強化した。
- preview repoへのrsync後検証でも同様に、同期後rootに存在するファイル一覧を出すようにした。
- 再発防止として `tools/validate_preview_workflow.py` に、今回追加した診断文言の存在確認を追加した。

### 対応方法
1. 失敗したActions runの `GITHUB_SHA` とブランチを確認し、そのコミットに `hado_library_3.0.0.0.html` が含まれているか確認する。
2. 含まれていない場合は、`index.html` と同一内容の `hado_library_3.0.0.0.html` をソースブランチへ含めてpushする。
3. 含まれているのに失敗する場合は、今回強化したログの `Root files visible to workflow` を確認し、checkout対象SHA/ブランチ、またはワークフロー実行対象が想定ブランチと一致しているかを確認する。

## Phase 3.3 preview workflow簡素化レポート

### 不具合分類・根本原因
- 分類: preview通知workflowに、アプリ検証と重複する事前/同期後アセット検証を入れすぎたことによる不要な失敗。
- 根本原因: `Notify Hado Library Preview` は本来、pushされたソースをpreview repoへ同期し、公開previewが対象commit/versionへ更新されたか確認する責務で十分だった。しかし、`hado_library_3.0.0.0.html` の存在、CSSサイズ、CSS必須断片、preview Pages workflow定義のAPI読取など、`App Validation` やpreview repo側の責務と重複するチェックを追加していたため、UI改修とは無関係な条件で即失敗する状態になっていた。
- ログZIPはこの環境から直接取得できなかったが、提示された失敗ログと現行workflowを照合し、失敗点がsource asset検証であることを確認した。

### 対応
- `notify-preview.yml` から `Validate source preview assets before sync` を削除した。
- `notify-preview.yml` から `Verify preview Pages deployment workflow exists` を削除した。
- preview repoへのrsync後に行っていたHTML/CSSサイズ/断片検証を削除した。
- 公開preview確認は、`PREVIEW_SOURCE_COMMIT.txt`、`PREVIEW_SOURCE_BRANCH.txt`、`hado_version.js` によるcommit/branch/version一致確認に絞った。
- `tools/validate_preview_workflow.py` も、簡素化後の責務に合わせて更新した。

### 今後の切り分け
- アプリ本体のHTML/CSS/JS整合性は `App Validation` で確認する。
- preview通知workflowは、同期・push・必要ならdispatch・公開commit/version一致確認だけを行う。
- preview workflowが失敗した場合は、token/clone/push/dispatch/公開反映のどこで止まったかを見る。アプリ内部の静的検証失敗と混同しない。

## Phase 3.3 workflow action version rollback report

### 不具合分類・根本原因
- 分類: GitHub Actions共通部品の過剰アップグレードによる複数workflow失敗。
- 根本原因: `Node.js 20 actions are deprecated` は警告であり、直ちに失敗原因ではなかったにもかかわらず、`actions/checkout@v5` と `actions/github-script@v8` へ先行更新した。これらはrunner互換条件が上がるため、リポジトリ側の実行環境で4つのworkflowが同時に失敗するリスクを作った。
- 類似原因: App Validation、Notify Preview、Auto-merge、各validatorで同じaction version前提を共有していたため、1つの誤ったversion判断が複数workflowへ波及した。

### 対応
- `actions/checkout` を `@v4` へ戻した。
- `actions/github-script` を `@v7` へ戻した。
- `tools/validate_preview_workflow.py`、`tools/validate_merge_queue_workflow.py`、`tools/validate_auto_merge_workflow.py` の期待値も安定版に戻した。
- Node 20 deprecation warningは「警告」として扱い、workflowを壊す先行アップグレードを行わない方針へ戻した。

### 再発防止
- GitHub Actionsの共通action major versionを上げる場合は、警告だけで判断せず、対象runner互換性と実際の成功runを確認してから変更する。
- 複数workflowへ横断適用する変更は、App Validation、Notify Preview、Auto-merge、merge queue validatorの全てで同一version前提になっていないか確認する。

## Phase 3.3 preview push競合修正レポート

### 不具合分類・根本原因
- 分類: preview repository `main` への並列push競合。
- 根本原因: `Notify Hado Library Preview` はpreview repoをcloneしてcommitを作成した後に `main` へpushしていたが、同時または近接して別のpreview同期runが `main` を更新すると、手元cloneの期待old SHAとremote current SHAがずれ、GitHubから `cannot lock ref 'refs/heads/main': is at ... but expected ...` として拒否される。これはアプリ改修内容ではなく、preview同期workflowの競合制御不足である。

### 対応
- `Notify Hado Library Preview` に `concurrency` を追加し、同一リポジトリ内のpreview同期runを直列化した。
- preview repo pushがremote更新競合で失敗した場合に、最大3回までfresh cloneからrsync/commit/pushをやり直すretryを追加した。
- 3回連続で競合する場合のみ、継続的に別runがpreview mainを更新している異常状態として失敗させる。
- `tools/validate_preview_workflow.py` にconcurrencyとretry文言の存在確認を追加し、同じ競合対策が消えないようにした。

### 再発防止
- preview repoのような共有ブランチへworkflowからpushする場合は、必ずworkflow-level concurrencyかpush retryのいずれか、または両方を入れる。
- `cannot lock ref ... is at ... but expected ...` はコンテンツ検証エラーではなく、remote branch更新競合として扱う。

## Phase 3.3 dispatch権限/配布HTML必須チェック削除レポート

### 不具合分類・根本原因
- 分類: preview通知workflowとApp Validationに残っていた不要な権限/API呼び出し・重複ファイル必須チェック。
- 根本原因: preview repoへのpushでPages deploymentが起動する構成にもかかわらず、`workflow_dispatch` APIを呼び続けていたため、`PREVIEW_REPO_TOKEN` に Actions: write がない環境で403になった。また、通常開発のApp Validationで `hado_library_3.0.0.0.html` を必須にしていたため、root正本である `index.html` が存在していても配布用HTMLがないブランチで失敗した。

### 対応
- `Notify Hado Library Preview` から `Dispatch preview Pages deployment workflow` ステップを削除した。
- `PREVIEW_REPO_TOKEN` の必要権限を preview repo の Contents: Read and write に絞り、Actions: write を不要にした。
- `tools/validate_app_js.py` から `hado_library_3.0.0.0.html` との同一性必須チェックを削除し、通常開発では `index.html` の存在確認に絞った。
- `tools/validate_external_css.py` と `tools/validate_update_version_consistency.py` も通常開発のroot HTMLである `index.html` を検証対象に絞った。
- `tools/validate_preview_workflow.py` からdispatch API前提の検証を削除した。

### 再発防止
- 通常開発workflowでは、配布パッケージ用HTMLを必須にしない。配布物チェックは配布作成時だけ実施する。
- preview通知workflowでは、preview repoへのpush-triggered deploymentを正とし、通常同期に追加のActions権限/API dispatchを要求しない。

## Phase 3.3 saved候補validator文言依存修正レポート

### 不具合分類・根本原因
- 分類: UI文言削除後にvalidatorだけが旧説明文を要求し続けたことによるApp Validation失敗。
- 根本原因: 型候補一覧から補足説明を削除するPhase 3要件に従って `適合する候補だけを選択可能として表示` というユーザー向け文言は削除済みだった。しかし `tools/validate_saved_type_candidates_zero_score_visible.py` がその文言の存在を必須にしていたため、実装挙動は正しいままvalidatorが失敗した。

### 対応
- `tools/validate_saved_type_candidates_zero_score_visible.py` から旧UI文言の必須チェックを削除した。
- validatorは `candidateVisibleByScore()` と `owned.filter(...).filter(candidateVisibleByScore)` 相当の実装挙動だけを検証するようにした。

### 再発防止
- UI簡素化で削除した表示文言を、validatorの必須条件として残さない。
- validatorはユーザー表示文言ではなく、原則として動作契約・関数・データフローを検証する。

## Phase 3.3 preview sync最小化レポート

### 不具合分類・根本原因
- 分類: preview同期workflowがsource root全体を広くrsyncしていたことによる不要ファイル同期とpush競合誘発。
- 根本原因: `rsync -a --delete ./` でroot全体をpreview repoへ同期していたため、既に削除/不要化した旧HTML（例: `hado_library_2.9.6.1.html` など）までpreview rootへ移動・復活させる差分を作っていた。これはUpdate09 Phase 3の実行に不要であり、push差分を過大化して競合や失敗を起こしやすくしていた。

### 対応
- preview同期対象を `index.html`、`hado_*.js`、`hado_styles.css`、`hadou_*.json` の現在runtimeに必要な最小ファイルへ限定した。
- preview rootは `.git` と `.github` を残して一度クリアし、最小runtimeファイルと `PREVIEW_SOURCE_*` メタファイルだけを配置するようにした。
- 公開previewのpost-sync checkは削除済みのまま維持し、workflow内の追加チェックは行わない。
- `tools/validate_preview_workflow.py` に、広範囲 `rsync -a --delete`、dispatch、post-sync verifyが戻らないことを検証する禁止条件を追加した。

### 再発防止
- preview同期workflowでは、source root全体を同期しない。
- 削除済み/旧版HTMLをpreview rootへ戻さない。
- previewに必要なファイルセットは現在runtimeの最小構成だけに限定する。


## Phase 3.4 型候補一覧スコア計算変更レポート

### 不具合分類・根本原因
- 分類: 型候補一覧のスコア定義変更。
- 根本原因: 旧実装は百分率や基準値を点数化していたため、ユーザーが求める「対象となる5条件の状態変化率項目数の合計」と一致していなかった。

### 対応
- `HadoTypeScore.metricValue()` を、百分率/基準値の換算ではなく、対象条件に一致した状態変化率項目数を数える方式へ変更した。
- `HadoTypeScore.score()` に `fitScore`、`evaluationScore`、`totalScore` を明示し、適合/評価/トータルの各スコアを件数ベースで返すようにした。
- 型候補カードの表示を、適合スコア、評価スコア、トータルスコアの3値が確認できる形へ変更した。

### 再発防止
- `tools/test_type_score.js` の期待値を件数ベースへ更新し、百分率換算へ戻った場合に検知できるようにした。

### 最低限の受け入れ確認
- 型候補一覧で候補カードを表示し、適合スコア/評価スコア/トータルスコアが「件」単位で表示されること。
- 条件ごとの内訳が、状態変化率項目数として `兵力:1件` のように表示されること。

## Phase 3.5 部隊編成スコア計算反映レポート

### 不具合分類・根本原因
- 分類: 型候補一覧と部隊編成スコアの計算定義不一致。
- 根本原因: 型候補一覧は件数ベースへ変更済みだったが、部隊編成の `calculateFormationAutoScores()` は主将/副将/補佐の装備・技能数を足す旧Phase 3暫定計算のままだった。

### 対応
- 部隊編成でも選択中の型ルールを取得し、部隊の状態変化率効果を `HadoTypeScore` に渡して、対象5条件に一致する項目数を数える方式へ変更した。
- トータルスコア/評価スコアを `件` 単位で表示し、条件別内訳も状態変化率項目数として表示するようにした。
- 型ルールは部隊編成側で非同期ロードし、型編成ナビ/型候補一覧がロード済みの場合は共有キャッシュを使うようにした。

### 再発防止
- 部隊編成と型候補一覧で別々のスコア定義を持たず、どちらも `HadoTypeScore` の件数ベース採点を利用する。

### 最低限の受け入れ確認
- 部隊編成で型を選択済みの部隊を開き、トータルスコア/評価スコアが `件` 単位で表示されること。
- 武将・装備・軍馬などを変更して状態変化率項目が変わると、トータルスコア/評価スコアと条件別内訳が更新されること。

## Phase 3.6 型候補表示とスマホ部隊スコア表示修正レポート

### 不具合分類・根本原因
- 分類: 型候補一覧表示要件の過剰表示とスマホ部隊編成CSSの表示抑制。
- 根本原因: 型候補一覧の武将カードに、ユーザーが不要としたトータルスコアを表示していた。また、スマホ部隊編成では旧レイアウト用の `.formation-selected-card:not(.is-dialog){display:none}` がスコアカードにも適用され、トータルスコア/評価スコアが非表示になっていた。

### 対応
- 型候補一覧の武将カードからトータルスコアを削除し、適合スコアと評価項目ごとの評価スコア内訳だけを表示するようにした。
- スマホ部隊編成で `.formation-score-card` を明示的に表示するCSSを追加した。
- validatorに、型候補一覧のトータルスコア表示が戻らないこと、スマホでスコアカードを表示するCSSが存在することを追加した。

### 再発防止
- 武将候補カードにトータルスコア表示を戻さない。
- スマホの選択カード非表示ルールに、スコアカードを巻き込まない。

### 最低限の受け入れ確認
- 型候補一覧の武将カードにトータルスコアが表示されず、適合スコアと5評価項目ごとの内訳が表示されること。
- スマホ幅で部隊編成を開き、スコアカードにトータルスコア/評価スコアが表示されること。

## Phase 3.7 部隊編成スコア表示位置・軍馬操作・単位表記修正レポート

### 不具合分類・根本原因
- 分類: スマホ部隊編成レイアウト、軍馬操作UI、スコア表示要件の不一致。
- 根本原因: スマホ部隊編成ではスコアカードを再表示したものの、結果サマリーとの通常フロー上の間隔を明示していなかったため重なって見えるケースがあった。また、軍馬は `未設定` 選択で解除できるのに別途削除ボタンを残していた。スコア表示も `件` 単位を付けており、ユーザー要望の「数値のみ」と一致していなかった。

### 対応
- スマホ部隊編成のスコアカードと結果サマリーへ `position:relative`、`clear:both`、個別marginを指定し、重ならない通常フローに固定した。
- 軍馬枠の削除ボタンと削除ボタン用イベント登録を削除した。
- トータルスコア、評価スコア、適合スコアおよび評価項目別スコアの表示から単位を外した。
- 型候補一覧は適合スコアと評価項目別スコアのみを表示し、ロール別描画エラー時は診断ログを残して候補一覧全体の読み込みを止めないようにした。

### 再発防止
- `tools/validate_update09_phase3_formation_ui.py` で、候補カードのトータルスコア再表示、スコアの旧単位表示、スマホスコアカード位置調整CSSの欠落を検出する。

### 最低限の受け入れ確認
- スマホ幅で部隊編成を開き、スコアカードと結果サマリーが重ならないこと。
- 軍馬枠に削除ボタンがなく、プルダウンの `未設定` で解除できること。
- トータルスコア、評価スコア、適合スコアが数値のみで表示されること。
- 型候補一覧で武将の適合スコアと評価項目別スコア内訳が表示され、トータルスコアは表示されないこと。

## Phase 3.8 official JSON load regression fix

- Classification: runtime official JSON loading regression after Update09.3.7 scoring changes.
- Root cause: Phase 3 score rendering started depending on `hadou_type_score_rules.json`, but the startup official JSON bundle did not load that file. The app therefore had a split dependency: core JSON loaded at startup, while score rules were fetched later by feature-specific code.
- Permanent countermeasure: `hadou_type_score_rules.json` is now an optional member of the official JSON bundle, and `applyLoadedData()` publishes it to `window.HADO_TYPE_SCORE_RULES` before formation/type score rendering uses it.
- Impact scope checked: HTTP preview official JSON loading, local file/folder JSON loading, formation score rendering, and the existing standalone fallback fetch for score rules.
- HTML size change: none. The change stays in external JavaScript.

## Phase 3.9 mobile score/result layout fix

- Classification: smartphone formation layout defect.
- Root cause: the result summary was rendered after the whole compose grid, while the total score panel was inside the selected-stack column. On smartphone this made the two panels depend on grid/stack flow and could place or overlay them unexpectedly.
- Permanent countermeasure: the result summary is now rendered directly after the score panel in the same stack. The score panel is a tappable `details` component so smartphone users can expand evaluation-item scores only when needed.
- Minimum acceptance: on smartphone width, open 部隊編成 and confirm the visible order is 軍馬 -> トータルスコア -> 結果サマリー, then tap トータルスコア to expand/collapse the itemized evaluation scores.

## Phase 3.10 mobile panel order correction

- Classification: smartphone formation panel ordering defect.
- Root cause: Phase 3.9 placed the score panel before the result summary but misunderstood the desired full order and left the warhorse panel after both panels.
- Permanent countermeasure: the render order and validator contract now require `formationWarhorseEditorHtml -> selectedEditorHtml -> quickSummaryHtml`.
- Minimum acceptance: on smartphone width, open 部隊編成 and confirm the visible order is 軍馬 -> トータルスコア -> 結果サマリー.

## Phase 3.11 mobile visible panel and advisor compactness fix

- Classification: smartphone formation visibility/layout regression.
- Root cause: the requested order was applied inside the selected stack, but smartphone CSS hides selected cards and renders warhorse in the board card. As a result, the visible smartphone flow still depended on separate hidden/visible regions and the score/result panels could be missed.
- Permanent countermeasure: smartphone-visible score and result summary panels are now rendered inside the board card directly after the smartphone warhorse placement; advisor and warhorse controls are compacted with mobile-specific CSS.
- Minimum acceptance: on smartphone width, open 部隊編成 and confirm 軍馬 -> トータルスコア -> 結果サマリー are all visible, and the 参軍 row is compact rather than vertically long.


## Phase 3.12 formation evaluation-score regression fix

- Classification: formation score calculation regression.
- Root cause: the Phase 3 formation score panel calculated evaluation rows from `data.effects` after the formation parameter summary had already merged effects. That lost the member-level type-search feature rows used by the candidate score calculation, so the formation 評価スコア could be lower or zero even though candidate 適合スコア was correct.
- Impact scope checked: 部隊編成 score panel, selected formation members, role-scoped score matching, type-candidate fit/adaptation scoring, and smartphone score/result layout.
- Permanent countermeasure: formation score calculation now builds member score entities from `hadou_type_search_feature_index.json`, applies each member role before calling `HadoTypeScore.score()`, and sums the five evaluation metrics into the score panel rows. The validator now requires the member-aggregate score policy marker.
- Minimum acceptance: open 部隊編成, choose a type, and confirm the トータルスコア/評価スコア and each evaluation item change according to the assigned members while the 型候補一覧の適合スコア remains unchanged.
- HTML size change: none. The change stays in external JavaScript and validation/docs.


## Phase 3.13 score terminology alignment

- Classification: score terminology and aggregation regression.
- Root cause: the UI treated 評価スコア as one aggregate number in the score-card header. The requested definition is that 評価スコア exists per each of the five type evaluation items, while 適合スコア and トータルスコア are the sums of those five rows for a武将 and a部隊 respectively.
- Permanent countermeasure: formation total score is now explicitly calculated as the sum of the five evaluation-score rows, and the header no longer labels that aggregate as 評価スコア.
- Impact scope checked: 部隊編成 score card, formation list score label, type-candidate fit score semantics, and mobile score expansion layout.
- Minimum acceptance: open 部隊編成, expand トータルスコア, and confirm the five displayed rows are the 評価スコア values and the header トータルスコア equals their sum.


## Phase 3.14 formation layout cleanup

- Classification: formation layout and visual-noise improvement.
- Root cause: Phase 3 retained legacy panel framing, duplicated title placement, explanatory notes, and horizontally scrollable chip rows after the layout had moved to compact score/result cards.
- Permanent countermeasure: the formation title now lives in the internal tab row, the old panel frame and explanatory notes are hidden/removed, warhorse heading text is removed, and score/result chip rows are constrained to no-scroll compact layouts.
- Impact scope checked: 部隊編成 outer panel, internal tabs, 軍馬 panel, total score card, evaluation-score rows, result summary rows, PC/mobile overflow behavior.
- Minimum acceptance: open 部隊編成 and confirm the visible order starts with `部隊編成 | 編成 | 戦法 | 変化率 | 詳細`, the old explanatory note and warhorse heading/note are absent, and score/result rows do not horizontally scroll.
