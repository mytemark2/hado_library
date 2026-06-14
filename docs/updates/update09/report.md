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
