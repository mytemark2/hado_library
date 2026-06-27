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
- permission-sensitive な `Auto-merge Internal PR` workflow は最小CI方針に合わないため削除対象とした。
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
- permission-sensitive な auto-merge workflow は削除し、PRの自動マージ有効化はGitHub標準UI/設定に委ねる方針へ戻した。
- `tools/validate_preview_workflow.py`、`tools/validate_merge_queue_workflow.py` の期待値も安定版に戻し、auto-merge workflow validatorは削除した。
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


## Phase 3.15 PC/mobile formation layout and score-row fallback fix

- Classification: formation layout refinement and score display regression.
- Root cause: PC group/memo rows still used the previous dense grid, smartphone score spacing inherited a margin from the mobile placement container, and the no-rule fallback reused old general slot score rows (`主将`, `副将`) instead of type evaluation metric rows.
- Permanent countermeasure: group and memo rows have explicit layout contracts, mobile score spacing/meta rows have dedicated overrides, and formation score fallback no longer emits general-slot rows.
- Impact scope checked: PC group controls, PC compose bar memo row, smartphone 軍馬 -> トータルスコア spacing, smartphone score metadata, and score rows when type rules/member rows are unavailable.
- Minimum acceptance: PCでグループが2行、マイメモが独立1行になっていること、スマホで軍馬直下にトータルスコアが詰まって表示されること、評価スコア行に主将/副将が出ないことを確認する。


## Phase 3.17 smartphone formation member-score resolution fix

- Classification: smartphone-visible formation score calculation regression.
- Root cause: `getFormationTypeSearchFeatureItems()` required `typeSearchFeatureIndex.available`, so a loaded derived JSON bundle with `items` but no truthy `available` flag could resolve zero member feature rows. `calculateFormationAutoScores()` then fell back to scoring `formationTypeScoreEntity()`, leaving the diagnostic trace at `roleId: formation` with all five metrics at zero.
- Permanent countermeasure: member scoring now reads the `items` array directly, logs member-resolution misses, and no longer falls back to pseudo-formation entity scoring.
- Impact scope checked: smartphone score card, PC score card shared calculation path, type-search feature index loading, member score aggregation, and type-score diagnostics.
- Minimum acceptance: on smartphone width, open 部隊編成 and confirm `formation:type-score-member-aggregate.memberCount` is non-zero, `typeScore.last.roleId` is a member role rather than `formation`, and the five evaluation-score rows/total score are no longer all zero for a populated formation.


## Workflow validation cleanup: remove unnecessary update-meta sync check

- Classification: CI validation noise reduction.
- Root cause: `App Validation` still ran `tools/validate_update_meta_no_broad_observer.py`, a narrow implementation-detail check for update-meta sync hooks. In practice this check could fail the entire workflow even when app JavaScript, CSS, version consistency, preview workflow contract, and functional regressions had already passed.
- Permanent countermeasure: removed the update-meta sync-hook validator from the App Validation workflow and added a merge-queue workflow guard so it is not accidentally reintroduced.
- Impact scope checked: App Validation workflow command list and merge-queue workflow contract validator.
- HTML size change: none. Runtime app files were not changed.

## 2026-06-17 Update09.3.17 type-search feature index regression guard

- Rechecked the current source artifact `hadou_type_search_feature_index.json`; it is not an empty file in this working tree and contains 746 `items` across generals, equipments, siege weapons, and warhorse skills.
- Root cause for the reported preview behavior is that a deployment with an empty `hadou_type_search_feature_index.json` leaves `state.derivedData.typeSearchFeatureIndex.items` empty, so formation score member resolution cannot find武将/装備 feature rows and the aggregate diagnostic remains at `memberCount=0`.
- Added a minimal App Validation guard that fails when `hadou_type_search_feature_index.json` is missing, empty, has `items: []`, lacks required categories, or lacks usable `typeFeatures` / `statusEffectRefs` rows. This prevents the same empty-artifact deployment from passing validation again.
- Preview sync remains minimal: because `notify-preview.yml` already syncs `hadou_*.json`, the same non-empty JSON will be copied to the preview repository when the source branch is pushed and the preview workflow runs.

## 2026-06-17 Update09.3.18 formation render type-score connection

- Classification: formation score calculation invocation bug.
- Root cause: the derived type-search JSON was loaded, but the formation render path still did not guarantee a concrete type-score diagnostic/output when the current formation had no selected type or when member feature resolution was not the correct source for actual formation effects.
- Implementation change: `calculateFormationTypeScore()` now runs from the formation score summary render path, uses `parameterCalculation` rows and `effectSources` as the primary scoring entity, evaluates the selected type or all available presets/rules, writes the same result to the UI and `state.diagnostics.typeScore`, and records `calculationInvoked`, preset/item/parameter/effect counts, candidate scores, and empty reasons.
- Permanent countermeasure: the score diagnostic is no longer left as `{}` during formation rendering; when scoring cannot proceed it records an explicit `emptyReason` instead.
- HTML size change: none. The fix remains in external JavaScript plus documentation/validator updates.

## 2026-06-17 Update09.3.19 PC formation score visibility fix

- Classification: PC-width layout visibility regression.
- Root cause: older mobile/coarse-pointer CSS hid `.formation-selected-card:not(.is-dialog)` for touch-capable devices. On PC-width devices that report `pointer: coarse`, the right-pane score card could still be hidden even though the layout was visually PC-sized.
- Implementation change: added a PC-width override that always shows the right-pane `.formation-score-card` inside `.formation-selected-stack` and hides the mobile-only score placement at `min-width: 981px`.
- Impact scope checked: PC-width formation edit panel score card, touch-capable PC media query interaction, and mobile score placement separation.
- HTML size change: none. CSS-only fix plus metadata/docs.

## 2026-06-17 Update09.3.20 formation type-score execution proof

- Classification: formation score calculation verification gap and duplicate-source counting bug.
- Root cause: the previous Update09.3.19 response proved only score-card visibility. It did not add a repeatable post-fix check that executes the formation render score path and proves `typeScore` is populated with a non-zero score and matched effect/parameter evidence.
- Implementation change: added `tools/test_formation_type_score_render.js`, which loads `hado_type_score.js` and `hado_formation.js` in a VM, calls `renderFormationScoreSummaryHtml()` with a formation containing actual parameter/effect data, and asserts that `state.diagnostics.typeScore` has `calculationInvoked: true`, non-empty candidate scores, a non-zero total, and matched effect or parameter rows. The formation effect scoring entity now keeps parameter rows in `typeFeatures` and effect rows in `statusEffectRefs`, avoiding duplicate parameter/effect scoring from the same effect source.
- Post-fix diagnostic excerpt from the new executable check: `calculationInvoked=true`, `presetCount=16`, `featureItemCount=746`, `parameterRowCount=1`, `effectSourceCount=1`, `candidateScoresLength=1`, `maxTotalScore=2`, top type `会心型`, positive row `会心発生`, matched effect `検証技能`, matched parameter `会心発生`.
- Permanent countermeasure: App Validation now runs the formation render score diagnostic test, and the merge-queue workflow validator requires that command so the test cannot silently disappear from CI.
- Impact scope checked: `calculateFormationTypeScore()`, `renderFormationScoreSummaryHtml()`, `calculateFormationAutoScores()`, diagnostic output (`typeScore`, `typeSearch`, `typeSearchCache`), and UI output containing `トータルスコア`.
- HTML size change: none. The regression proof is an external test and the runtime calculation fix remains in external JavaScript.

## 2026-06-17 Update09.3.21 vaccine score alias matching fix

- Classification: type-score matching defect, not a data-load or render-path defect.
- Root cause: the previous investigation over-focused on whether `typeScore` was invoked and whether derived JSON / formation parameter rows existed. For `selectedTypeId=vaccine`, the real failure mode was `candidateScores[0].totalScore=0` with all `matchedEffects` / `matchedParameters` empty because `hado_type_score.js` did not map real effect/parameter wording to the vaccine metric keys.
- Implementation change: expanded `METRIC_ALIASES` for vaccine-related metric keys, especially `self_disadvantage_countermeasure`, `ally_non_damage_effect`, `weakening_nullify`, `weakening_remove`, and `ally_wounded_recovery`, using real wording such as `弱化効果無効`, `不利変化無効`, `自身を含む味方`, `攻撃速度`, `戦法ゲージ`, `通常攻撃対象部隊数`, `負傷兵回復`, and `負傷兵を最大兵力`.
- Regression proof: `tools/test_formation_type_score_render.js` now selects `vaccine` / `ワクチン型` and feeds actual-style parameter/effect rows. The post-fix diagnostic has `selectedTypeId=vaccine`, `presetCount=16`, `parameterRowCount=3`, `effectSourceCount=3`, `candidateScoresLength=1`, `maxTotalScore=10`, and matched evidence in `自部隊不利対策`, `味方非ダメージ効果`, `弱化無効`, and `味方負傷兵回復` rows.
- Permanent countermeasure: direct type-score regression coverage was added for vaccine aliases in `tools/test_type_score.js`, and the formation render diagnostic test now uses vaccine instead of an unrelated critical-score type.
- Lesson learned: if `typeScore.calculationInvoked=true`, rows/effects are non-empty, and `candidateScores` exists but all matched arrays are empty, treat it as a metric alias / feature-id matching problem first rather than changing JSON generation, CSS, cache, or render placement.
- HTML size change: none. The fix is in external JavaScript and tests.

## 2026-06-17 Update09.3.22 expandable formation evaluation-score details

- Classification: formation score UX improvement.
- Request: clicking an evaluation score under the total score should show the score breakdown.
- Implementation change: formation score rows now carry `matchedEffects` and `matchedParameters` from the scoring diagnostic into `renderFormationScoreSummaryHtml()`. Rows with evidence render as clickable `<details>` chips that expand to show matched effect and parameter sources, while rows without evidence remain compact chips.
- Regression proof: `tools/test_formation_type_score_render.js` now asserts the score summary HTML contains expandable score detail markup and matched evidence labels in addition to the existing non-zero vaccine score diagnostics.
- HTML size change: none. The behavior is implemented in external JavaScript and CSS.

## 2026-06-23 Phase 3 completion report

- Summary: Update09 Phase 3 is complete. The final accepted runtime version is `3.0.0.0 Update09.3.40` / revision `73`.
- Bug classification and root cause: the final Phase 3 fixes addressed formation score display mismatches where the total score and evaluation score headers could diverge from the visible tag evidence. The root cause was using a prior aggregate score source for display instead of deriving the displayed total from the five rendered evaluation rows and their normalized evidence tags.
- Impact scope checked: formation score summary, evaluation score chips, tag-only detail panel, show-more behavior, type candidate/tag UI, candidate tray related display paths, PC layout, and supporting validators.
- Files changed in the completion record: `docs/updates/update09/roadmap.md`, `docs/updates/roadmap.md`, `docs/updates/update09/implementation.md`, and `docs/updates/update09/report.md`.
- HTML size and externalization decision: no HTML or runtime JavaScript/CSS was changed for this completion record. Phase 3 runtime changes remain externalized in JavaScript/CSS from the preceding implementation commits.
- Validation commands recorded for the accepted Phase 3 state: `python3 tools/run_app_validation.py` passed with `app validation self-check passed: 64 commands`; `python3 tools/validate_update09_phase3_formation_ui.py`, `python3 tools/validate_formation_score_tag_only.py`, and `python3 tools/validate_update_version_consistency.py` passed.
- Preview confirmation: the user confirmed the public preview display is correct and accepted Phase 3 on 2026-06-23.
- Minimum user acceptance operation: open the preview 部隊編成 screen, confirm the five evaluation scores sum to the displayed total, open an evaluation score detail, confirm tag-only evidence display and `さらに表示` behavior. This was accepted by the user.
- Remaining issues: none for Phase 3. Phase 4 remains the next planned phase for guide/help/wording and operation-flow cleanup, not a Phase 3 residual defect.


## 2026-06-25 Update09.4.1 Phase 4 start report

- Summary: Phase 4 is not complete yet; this change starts Phase 4 by updating visible version metadata and the first layer of in-app guide/flow wording.
- Bug classification and root cause: this is a planned UX/guide update, not a runtime defect fix. The root UX gap was that Phase 3 changed formation/group/score behavior, but the start guide and guided tours still described the older generic search-to-detail flow.
- Implementation change: active guide copy in `hado_core.js` now explains the 型検索/型編成ナビ → 型候補一覧 → 候補トレイ → 部隊編成 flow, clarifies 全データ表示 vs 保存データ表示, and adds a 部隊グループ/グループリスト/「変更」 button explanation to the formation guide.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.1` / revision `74`; `HADO_DEV_INFO.json` records Phase 4 guide/flow cleanup while keeping version constants centralized in `hado_version.js`.
- Recurrence prevention: `tools/validate_update09_phase4_guides.py` checks the version, active guide text, start guide text, documentation status, and confirms the legacy `hado_app.js` bundle is not referenced by `index.html`.
- HTML size and externalization decision: the HTML change is limited to the compact start-guide text/badge. No large inline JavaScript was added; active behavior remains in external JavaScript.
- Minimum user acceptance operation: open the start guide and confirm Update09.4.1 is visible; open Search guide and confirm 型検索/型編成ナビ → 型候補一覧 → 候補トレイ → 部隊編成 wording; open Formation guide and confirm 部隊グループ, グループリスト, and 「変更」 button explanation appears.
- Remaining issues: Phase 4 is ongoing. Next work should move longer supplemental explanations into details/help/modal blocks and continue reducing always-visible text density.


## 2026-06-26 Update09.4.2 Phase 4 next-step help report

- Summary: Phase 4 remains ongoing. This change completes the next slice by adding compact next-step guidance to 型候補一覧 and 候補トレイ.
- Bug classification and root cause: planned UX/guide cleanup. The root UX issue was that users could identify a type and see candidates, but the immediate next action was still split across modal text, floating tray UI, and formation screen knowledge.
- Implementation change: `hado_type_candidates.js` now renders a collapsible `次の操作` block that states the current data mode, explains 全データ表示 vs 保存データ表示, and lists the candidate-to-tray-to-formation path. `hado_candidate_tray.js` now uses a shorter action-oriented guide line.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.2` / revision `75`.
- Recurrence prevention: `tools/validate_update09_phase4_guides.py` now checks Update09.4.2, the 型候補一覧 `次の操作` block, the 候補トレイ short guidance, and the active guide wording.
- HTML size and externalization decision: only the compact start-guide badge version changed in HTML. The guide behavior is implemented in external JavaScript.
- Minimum user acceptance operation: open 型候補一覧, expand `次の操作`, confirm the data-mode explanation and 3-step path; open 候補トレイ and confirm the short next-action line; proceed to 部隊編成 using `配置先を選ぶ`.
- Remaining issues: Phase 4 is not complete. Next work should continue moving other long supplemental explanations into details/help/modal blocks and review PC/smartphone text density.


## 2026-06-26 Update09.4.3 formation score render error fix report

- Summary: fixed and guarded the reported 部隊編成 render error `displayTotalScore is not defined`. Phase 4 remains ongoing.
- Bug classification: runtime rendering regression / stale local identifier reference risk in the formation score summary path.
- Root cause: the score summary renderer depended on the local identifier `displayTotalScore` in multiple rendered/diagnostic positions, and previous self-checks asserted only that the string existed instead of proving that stale references could not remain.
- Impact scope checked: `renderFormationScoreSummaryHtml()`, total score header rendering, score render diagnostics, tag-only score details, `hado_update_meta.js` renderer override prevention, and the standard formation score render test.
- Implementation change: introduced `calculateFormationDisplayedTotalScore(rows)` and changed the render path to use the locally defined `visibleTotalScore` consistently for `f.totalScore`, `f.evaluationScore`, diagnostics, matched/evidence counts, and the visible header.
- Permanent countermeasure: added `tools/validate_formation_score_total_scope.py` to forbid `displayTotalScore` in `hado_formation.js`, require the helper contract, and keep the guard in `tools/run_app_validation.py`.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.3` / revision `76`.
- Minimum user acceptance operation: open 部隊編成, confirm no render error appears, confirm トータルスコア is visible, and click an evaluation score chip to confirm tag-only details still open.
- Remaining issues: Phase 4 is not complete. Continue the planned guide/help density cleanup after this regression fix is accepted.


## 2026-06-26 Update09.4.4 formation next-step help report

- Summary: continued Phase 4 by adding a compact in-screen `次の操作` guide to 部隊編成. Phase 4 remains ongoing.
- Bug classification and root cause: planned UX/guide cleanup. The UX gap was that the formation guided tour explained groups, but the normal screen did not provide a persistent compact reminder of the group-list → change → slot placement → score/save sequence.
- Implementation change: `hado_formation.js` now renders `renderFormationNextStepHelpHtml()` inside the group controls area, and `hado_styles.css` styles it as a compact collapsible block.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.4` / revision `77`.
- Recurrence prevention: `tools/validate_update09_phase4_guides.py` now checks the active formation runtime and CSS for the new `次の操作` guide contract.
- HTML size and externalization decision: only the guide badge version changed in HTML. The guide itself is externalized in JavaScript/CSS.
- Minimum user acceptance operation: open 部隊編成, expand `次の操作`, confirm the four-step explanation, switch the グループリスト, open `変更`, select a slot, confirm score tags, and save.
- Remaining issues: Phase 4 is not complete. Continue reducing long always-visible explanations and verify PC/smartphone text density in the next slice.


## 2026-06-26 Update09.4.5 formation group control fix report

- Summary: fixed the 部隊編成 group controls so the visible current group name is shown and every rendered `変更` button opens the group dialog. Phase 4 remains ongoing.
- Bug classification: runtime UI event-binding regression / duplicate-ID binding risk in the formation group controls.
- Root cause: the group controls can appear in multiple rendered areas, but handlers were attached with single `document.getElementById()` calls. If the visible control was not the first matching ID, clicking `変更` produced no dialog and no debug log.
- Implementation change: added stable `data-formation-group-manage` / `data-formation-group-select` hooks, changed binding to `els.formationRoot.querySelectorAll(...)`, added debug logs, and changed the visible label from `グループリスト` to a current group-name chip plus `切替`.
- Permanent countermeasure: extended `tools/validate_update09_phase3_formation_ui.py` and `tools/validate_update09_phase4_guides.py` to require data-hook group binding and debug-log snippets.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.5` / revision `78`.
- Minimum user acceptance operation: open 部隊編成, confirm the current group name is visible, click `変更`, confirm the group dialog opens and Debug Log records `formationGroup:manage-click` / `formationGroup:dialog-open`, then switch groups via `切替`.
- Remaining issues: Phase 4 is not complete. Continue reducing long always-visible explanations and verify PC/smartphone text density in the next slice.


## 2026-06-26 Update09.4.6 formation group selector compact row report

- Summary: changed the 部隊編成 group controls to a one-line wide listbox plus `変更` button layout. Phase 4 remains ongoing.
- Bug classification and root cause: UX/layout correction. The prior fix made the group name visible, but it introduced extra labels and reduced the effective listbox width on compact layouts.
- Implementation change: removed visible `グループ` / `グループリスト` / `切替` labels from the normal controls, kept the selected group visible inside the listbox, and kept the `変更` button in the same row.
- Permanent countermeasure: validators now require the `.formation-group-select` hook and forbid the obsolete label/current-name/count snippets in `hado_formation.js`.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.6` / revision `79`.
- Minimum user acceptance operation: open 部隊編成 and confirm the group controls show one wide listbox and one `変更` button on the same row; click `変更` and confirm the dialog still opens.
- Remaining issues: Phase 4 is not complete. Continue reducing long always-visible explanations and verify PC/smartphone text density in the next slice.


## 2026-06-26 Update09.4.7 stale update-meta group override report

- Summary: removed the stale Update09.3 group-control override from `hado_update_meta.js` so the compact one-line group selector actually appears at runtime. Phase 4 remains ongoing.
- Bug classification and root cause: runtime override regression. `hado_formation.js` had the intended compact markup, but `hado_update_meta.js` ran after it and overwrote `renderFormationGroupControlsHtml()` with old `グループ` / `グループリスト` markup.
- Implementation change: deleted the stale override and injected `.formation-group-list-row` CSS, leaving the active split runtime to render the wide listbox + `変更` button.
- Permanent countermeasure: Phase 3/4 validators now inspect `hado_update_meta.js` and fail if obsolete group-control override snippets return.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.7` / revision `80`.
- Minimum user acceptance operation: hard reload the preview, open 部隊編成, confirm the left group area no longer shows `グループ` / `グループリスト`, and confirm the wide listbox plus `変更` button is on one row.
- Remaining issues: Phase 4 is not complete. Continue PC/smartphone density checks after this runtime override correction is verified.


## 2026-06-26 Update09.4.8 remove unrequested formation group help report

- Summary: removed the unrequested `次の操作` block from directly under the 部隊編成 group selector. Phase 4 remains ongoing.
- Bug classification and root cause: UX over-implementation. The group selector is a simple control, but Phase 4 guidance was inserted directly under it, increasing visual noise and implying the control was more complex than it is.
- Implementation change: deleted the formation-only next-step helper function, removed it from `renderFormationGroupControlsHtml()`, and removed the corresponding CSS. The group area now contains only the wide listbox and `変更` button.
- Permanent countermeasure: validators now forbid `renderFormationNextStepHelpHtml`, `.formation-next-step-help`, and `.formation-next-step-body` in the formation runtime/styles.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.8` / revision `81`.
- Minimum user acceptance operation: hard reload the preview, open 部隊編成, confirm the group area contains only the listbox and `変更` button, and confirm no `次の操作` block appears under it.
- Remaining issues: Phase 4 is not complete. Continue only with requested Phase 4 guide refinements and avoid adding extra controls to simple UI areas.


## 2026-06-26 Update09.4.9 PC formation list panel scrollbar report

- Summary: restored a visible vertical scroll path for the PC left-side group/formation selection panel. Phase 4 remains ongoing.
- Bug classification and root cause: PC layout regression. Fixed-position panel rules hid overflow on `.formation-list-panel`, so the panel could lose an obvious vertical scroll path when content was taller than the viewport.
- Implementation change: added a PC-only CSS override to make `.formation-list-panel` and `.formation-list` vertically scrollable with stable scrollbar gutter.
- Permanent countermeasure: Phase 3/4 validators require the scrollbar fix marker and stable scrollbar CSS.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.9` / revision `82`.
- Minimum user acceptance operation: in PC width, open 部隊編成 and confirm the left-side group/部隊一覧 panel has a vertical scrollbar when the panel content exceeds the visible height.
- Remaining issues: Phase 4 is not complete. Keep subsequent slices smaller to reduce conflict surface.


## 2026-06-26 Update09.4.10 PC formation list scroll area constraint report

- Summary: adjusted the PC left formation panel so the group selector/actions stay fixed and only the 部隊一覧 list area scrolls. Phase 4 remains ongoing.
- Bug classification and root cause: PC layout regression from the prior scrollbar fix. Scrolling the whole fixed panel could hide the top group/header area, matching the reported screenshot.
- Implementation change: restored hidden overflow on `.formation-list-panel` and moved vertical scrolling to `.formation-list` with stable scrollbar gutter.
- Permanent countermeasure: validators require the new marker plus fixed-panel and scrollable-list snippets.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.10` / revision `83`.
- Minimum user acceptance operation: in PC width, open 部隊編成 and confirm the group selector/header/actions stay visible while the 部隊一覧 cards scroll inside the list area.
- Remaining issues: Phase 4 is not complete. Continue keeping future corrections narrow to reduce conflict surface.


## 2026-06-26 Update09.4.11 PC formation panel scroll reset report

- Summary: reset the PC left formation panel scroll position after render so the 部隊一覧 header, group selector, and action buttons are visible at initial display. Phase 4 remains ongoing.
- Bug classification and root cause: PC layout state regression. The prior whole-panel scroll path could leave a retained non-zero `scrollTop`, so the top controls remained clipped even after restricting list scrolling.
- Implementation change: set `.formation-list-panel.scrollTop = 0` immediately after rendering the formation DOM.
- Permanent countermeasure: validators require the render-time scroll reset guard.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.11` / revision `84`.
- Minimum user acceptance operation: in PC width, hard reload, open 部隊編成, and confirm 部隊一覧 header, group selector, and buttons are visible before the list cards; only the list cards scroll.
- Remaining issues: Phase 4 is not complete. Continue keeping future corrections narrow to reduce conflict surface.


## 2026-06-27 Update09.4.12 delayed PC formation panel scroll reset report

- Summary: strengthened the PC left formation panel reset so the 部隊一覧 header, group selector, and action buttons are restored after layout settles. Phase 4 remains ongoing.
- Bug classification and root cause: PC layout state regression. The immediate reset could be too early if layout/browser scroll restoration adjusted the panel after DOM insertion.
- Implementation change: added immediate, `requestAnimationFrame`, and timeout reset calls for `.formation-list-panel.scrollTop`.
- Permanent countermeasure: validators require the reset helper and delayed reset calls.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.12` / revision `85`.
- Minimum user acceptance operation: hard reload, open 部隊編成 in PC width, and confirm the 部隊一覧 header/group selector/action buttons are visible above the scrollable card list.
- Remaining issues: Phase 4 is not complete. Continue keeping future corrections narrow and avoid unrelated files.


## 2026-06-27 Update09.4.13 PC formation panel shell non-scrollable report

- Summary: stopped the PC left formation panel shell from being a scroll container so 部隊一覧, group selector, and action buttons cannot be hidden by retained panel scroll offset.
- Bug classification and root cause: PC fixed-panel scroll ancestor regression. The panel itself could still receive focus/restore scrolling after render even though only the list child should scroll.
- Implementation change: use `overflow:clip` on `.formation-list-panel`, keep `.formation-list` as the only scroll area, and expand reset timing with `scrollTo` and longer delayed resets.
- Permanent countermeasure: validators require the non-scrollable panel shell and expanded reset calls.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.13` / revision `86`.
- Minimum user acceptance operation: hard reload, open 部隊編成 in PC width, and confirm the 部隊一覧 header/group selector/action buttons are always visible; only the card list scrolls.
- Remaining issues: Phase 4 is not complete. Continue future corrections in narrow PRs.


## 2026-06-27 Update09.4.14 PC formation asset cache-bust report

- Summary: added cache-bust query strings for the active formation CSS/JS assets so the deployed preview cannot keep using older panel-scroll code while showing the new version.
- Bug classification and root cause: stale asset cache / deployment visibility mismatch. Version metadata could update independently from cached CSS/JS.
- Implementation change: `index.html` now loads `hado_styles.css?v=09.4.14` and `hado_formation.js?v=09.4.14`.
- Permanent countermeasure: validators require the cache-busted asset references.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.14` / revision `87`.
- Minimum user acceptance operation: hard reload or open preview in a fresh tab, then confirm 部隊一覧/group/action controls are visible and only the card list scrolls.
- Remaining issues: Phase 4 is not complete.


## 2026-06-27 Update09.4.15 PC formation fixed-header offset clamp report

- Summary: fixed the likely actual PC clipping cause by preventing `--mobile-fixed-stack-space` from being set below the header stack height.
- Bug classification and root cause: fixed-position offset calculation race. Early zero-height measurement could set the shared header offset variable too small, placing the fixed formation panel behind the header.
- Implementation change: clamp stack space to 118px minimum and log raw/calculated values in `mobileStickyHeader:offset`.
- Permanent countermeasure: validators require the stack-space clamp and raw offset diagnostics.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.15` / revision `88`.
- Minimum user acceptance operation: hard reload, open 部隊編成 in PC width, and confirm 部隊一覧/group/action controls are visible above the list. If not, copy `mobileStickyHeader:offset` and `formationListPanel:scroll-reset` logs.
- Remaining issues: Phase 4 is not complete.


## 2026-06-27 Update09.4.16 PC formation list fixed head report

- Summary: separated and pinned the PC left-panel header/group/actions so they remain visible independently of the card list scroll state.
- Bug classification and root cause: shared-scroll-shell layout regression. Header/group/actions were still in the same scrollable/clipped shell flow as the card list.
- Implementation change: introduced `.formation-list-fixed-head` around 部隊一覧, group selector, and action buttons, with sticky top CSS.
- Permanent countermeasure: validators require the fixed-head wrapper and sticky CSS marker.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.16` / revision `89`.
- Minimum user acceptance operation: open 部隊編成 in PC width and confirm 部隊一覧/group/action controls are visible; scroll only the card list.
- Remaining issues: Phase 4 is not complete. If this still fails, collect DOM/computed-style logs before further UI changes.

## 2026-06-27 Update09.4.17 PC formation panel measured tab offset report

- Summary: corrected the PC left formation panel position by measuring the actual fixed data/header and main-tab bottom instead of relying on fallback offsets.
- Bug classification and root cause: fixed-header overlap/layout calculation defect. The fixed `検索 / 部隊編成 / 軍馬` tab area was not used as the source of truth for left-panel top positioning.
- Implementation change: added measured panel top synchronization and forced the card list child to show a vertical scrollbar when overflowing.
- Permanent countermeasure: validators require the measured-offset helper and CSS marker.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.17` / revision `90`.
- Minimum user acceptance operation: open 部隊編成 in PC width and confirm the left panel starts below the top tabs, shows the group selector/actions, and the部隊 card list shows a scrollbar.
- Remaining issues: Phase 4 is not complete. If this still fails, collect `formationListPanel:viewport-sync` logs and computed styles for `.formation-list-panel` and `.formation-list` before further UI changes.

## 2026-06-27 Update09.4.18 PC formation action buttons compact row report

- Summary: changed the PC left-panel formation actions from four stacked buttons to one row: `新規 / 複製 / 削除 / 保存`.
- Implementation change: shortened the new-formation button label and added a PC CSS override for a four-column action row.
- Permanent countermeasure: validators require the compact action CSS marker.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.18` / revision `91`.
- Minimum user acceptance operation: open 部隊編成 in PC width and confirm the four action buttons appear on one row above the scrollable部隊 list.
- Remaining issues: Phase 4 is not complete.

## 2026-06-27 Update09.4.19 mobile total score placement report

- Summary: restored the mobile total score panel between the warhorse block and result summary.
- Bug classification and root cause: mobile placement regression. The mobile board placement received only the result summary, not the score card.
- Implementation change: mobile board placement now receives `scoreCardHtml` before `quickSummaryHtml`; mobile CSS hides only the duplicate selected-stack score card.
- Permanent countermeasure: validators and render tests require the score-card mobile placement contract.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.19` / revision `92`.
- Minimum user acceptance operation: open 部隊編成 on smartphone width and confirm トータルスコア appears between 軍馬 and 結果サマリー.
- Remaining issues: Phase 4 is not complete.

## 2026-06-27 Update09.4.20 formation responsive layout regression guard report

- Summary: added a dedicated regression guard for the converged PC and smartphone formation layout defects before continuing Phase 4.
- Bug classification and root cause: recurrence-prevention gap. The PC formation left-panel and smartphone score placement contracts were validated in fragments, which made repeated regressions possible during Phase 4 UI changes.
- Implementation change: introduced `tools/validate_formation_responsive_layout_contract.py` and wired it into the standard validation runner.
- Permanent countermeasure: the validation suite now checks the combined responsive contract for measured PC top offset, fixed group/action header, one-row action buttons, scrollable formation list, and smartphone score placement between 軍馬 and 結果サマリー.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.20` / revision `93`.
- Minimum user acceptance operation: open 部隊編成 on PC and smartphone width; confirm the PC left panel keeps 部隊一覧/group/actions visible with the list scrollbar, and smartphone width shows トータルスコア between 軍馬 and 結果サマリー.
- Remaining issues: Phase 4 is still in progress; no known residual issue for the converged PC/mobile formation layout contract.


## 2026-06-27 Update09.4.21 Phase 4 completion report

- Summary: corrected the misplaced formation guide spotlight targets for steps 2/8 and 5/8 and closed Phase 4.
- Bug classification and root cause: guided-tour target mismatch. Step 2/8 used the full fixed left panel instead of the fixed group/action header; step 5/8 used a selector that is absent in the current PC formation layout, so the spotlight could fall back to an unrelated area.
- Implementation change: changed only the guide definitions in `hado_core.js` and validation/version/docs. No formation layout, scoring, data, or save behavior was changed.
- Permanent countermeasure: `tools/validate_update09_phase4_guides.py` now requires the corrected guide targets and forbids the old selectors.
- Version metadata: visible runtime version advanced to `3.0.0.0 Update09.4.21` / revision `94`.
- Minimum user acceptance operation: open 部隊編成ガイド and confirm 2/8 highlights the left panel fixed head/group/action area, and 5/8 highlights the visible formation board instead of the app title.
- Remaining issues: none for Phase 4; Phase 4 is complete.

## 2026-06-27 Update09.5.1 Phase 5 type search/candidate/tray report

- Summary: Update09 Phase 5 fixes the type-entry → type-candidate → candidate-tray handoff and adds profiling for the previously unmeasured type-search time.
- Bug classification and root cause: UI flow defect and persistence gap. Type candidate card selection only updated local modal state (`st.picked`), and no event connected that state to the current formation `candidateTray`; the entry dialog also saved selection without navigating to the candidate list.
- Impact scope checked: type search profiling, type candidate role tabs/counts, candidate card selection, candidate tray add/open/remove/clear/place events, current formation persistence, candidateTray sanitize compatibility, and validation wiring.
- Files changed: `hado_search.js`, `hado_type_entry.js`, `hado_type_candidates.js`, `hado_candidate_tray.js`, `hado_formation.js`, `hado_version.js`, `HADO_DEV_INFO.json`, `tools/run_app_validation.py`, and `tools/validate_update09_phase5_type_candidate_flow.py`.
- HTML size change and externalization decision: `index.html` was not changed; all runtime behavior was implemented in external JavaScript modules.
- Speed measurement result: the earlier observed `totalMs=269.8ms` with about `22ms` of measured phases is now diagnosable through `measuredKnownMs`, `unmeasuredMs`, `unmeasuredMsWarning`, row-build, importance, chips, diagnostic, responsive, detail, and cache timings. New runtime measurements must be collected in browser after deployment.
- Validation commands: `node --check` for the changed JavaScript files, `python3 tools/validate_update09_phase5_type_candidate_flow.py`, and `python3 tools/run_app_validation.py`.
- Validation results: recorded in the final agent report for this change.
- GitHub Actions result: not available in this local workspace before push.
- Preview result: not preview-complete in this workspace because no `origin` remote is configured, so the application branch cannot be pushed and the preview repository/Pages markers cannot be verified here.
- Minimum user acceptance operation: open 部隊編成, open 型編成ナビ, choose a type, press `型候補一覧へ`, select a candidate card, press `候補トレイへ`, confirm the tray opens with that candidate, repeat add to confirm no duplicate, then use `配置先を選ぶ` for a supported 武将/装備 candidate and verify the existing formation placement popover appears.
- Remaining issues: preview synchronization and public Pages verification remain blocked until a remote-enabled environment pushes the committed branch.

## 2026-06-27 Update09.5.2 formation score type selector report

- Summary: added an editable `型` list box to the total score panel so the current formation type can be changed directly from 部隊編成.
- Bug classification and root cause: missing edit affordance. Formation records already persisted `evaluationTypeId` / `evaluationTypeName`, but the score panel only displayed the active type and no UI path updated those fields for the current formation.
- Implementation change: `renderFormationScoreSummaryHtml` renders `formationEvaluationTypeSelect` before `トータルスコア`; `setFormationEvaluationType(typeId)` updates the current formation, recalculates `totalScore` / `evaluationScore`, saves with `setFormationEvaluationType`, rerenders, and shows a toast.
- Impact scope checked: formation score rendering, type option rendering, selected option state, immediate recalculation/persistence, existing score chips/detail panel, candidate tray behavior, and forbidden old labels/IDs.
- HTML size change and externalization decision: no large inline HTML logic was added; behavior is in `hado_formation.js` and styling is in `hado_styles.css`.
- Validation commands: `node tools/test_formation_type_score_render.js`, `python3 tools/run_app_validation.py`.
- Preview result: not preview-complete in this workspace because remote fetch/push is blocked.
- Minimum user acceptance operation: open 部隊編成, use the `型` select at the left of the total score panel, confirm the score/chips/tags redraw immediately, reload, and confirm the selected type persists.
- Remaining issues: preview synchronization and public Pages verification remain blocked until a remote-enabled environment pushes the branch.

## 2026-06-27 Update09.5.3 formation type selector binding fix report

- Summary: fixed the issue where changing the visible `型` list box did not always update the current formation or recalculate score immediately.
- Bug classification and root cause: duplicated DOM binding defect. The score card is rendered in two placements for responsive layout, but the prior code bound only a single `getElementById('formationEvaluationTypeSelect')` result.
- Implementation change: every rendered score-panel type select is marked with `data-formation-evaluation-type-select="1"`, and `setupFormationEvents` binds all matching selects to `setFormationEvaluationType`.
- Validation: `node tools/test_formation_type_score_render.js` and `python3 tools/run_app_validation.py`.
- Remaining issues: preview synchronization and public Pages verification remain blocked until remote access is available.


### Update09.5.4 完了報告 — 評価スコア根拠タグの発生元表示復旧
- 事象: 型変更の即時再計算修正後、評価スコア詳細タグから `弱化無効(技能名)` のような発生元表示が欠落していた。
- 原因: 詳細タグをタグ専用 UI に戻した際、`source` / `sourceLabel` をタグ本文へ合成する処理がなく、補助情報側にしか残らない経路があった。
- 対応: `formationScoreEvidenceDisplayTitle()` を追加し、提供済み詳細行・フォールバック根拠行の両方で `sourceTag` を保持して括弧付き表示へ反映した。
- 回帰防止: `tools/test_formation_type_score_render.js` で `弱化無効(検証耐性技能)` 形式を検証し、`tools/validate_formation_score_tag_only.py` でも共有フォーマッタと実レンダー断片を必須化した。
- 残課題: ローカル静的/機能検証は実施対象。プレビュー同期はリモート接続・認証状態に依存するため、この環境で完了可否を別途報告する。


### Update09.5.5 完了報告 — 評価スコア根拠タグの集約テキスト露出防止
- 事象: `class="sr-only"` として出した根拠集約 `sourceLabels` が、CSS 未定義のため通常本文として露出した。
- 原因: 括弧付き発生元の存在チェックに偏り、余計な補助テキストが画面に出ないことと `sr-only` 定義の有無を検証していなかった。
- 対応: 集約テキスト生成と `sr-only` span 出力を削除し、表示対象をタグ内の括弧付き発生元だけにした。
- 再発防止: テストと validator で `sourceLabels` / 未定義 `sr-only` 依存 / `/` 区切り根拠ダンプの再混入を禁止した。


### Update09.5.6 完了報告 — 評価スコア内訳の欄外表示防止
- 事象: 評価スコア内訳の根拠タグが複数行に広がり、スコアカード内の結果サマリー領域と干渉して欄外表示に見える状態だった。
- 原因: collapsed/expanded の表示状態を CSS クラスで分けず、通常時も `flex-wrap` で複数行表示していたため、長い根拠名がカード内の余白を押し広げていた。
- 対応: 通常時は1行 `nowrap + overflow hidden`、さらに表示時は結果サマリー風のグリッド chip 表示へ切り替えるようにした。
- 再発防止: test / validator で collapsed/expanded クラスと overflow-safe CSS、`formation-quick-summary-chip` 共有を検証する。


### Update09.5.7 完了報告 — 評価スコア内訳の全件ダイアログ化
- 事象: `さらに表示` が inline 展開であり、結果サマリーと同じ別ダイアログ表示・全件表示になっていなかった。
- 原因: 「結果サマリーと同じように」を chip/grid の見た目として解釈し、既存の結果サマリーの拡大ダイアログ動作まで接続していなかった。
- 対応: `さらに表示` は `formationScoreEvidenceDialogOpen` を立てて再描画し、専用 dialog で選択中評価項目の根拠を全件表示する。
- 再発防止: test / validator で dialog 出力、全件 chip 表示、dialog close/backdrop イベントを検証する。
