# 3.2.0.0 Update01 Implementation

## 状態・起点

監査・ローカル検証実施。**未完了**（明示的保留、PRマージ承認、3.2公開Preview検証待ち）。

- 正本開発ブランチ: `feature/app-3.2.0.0`。作成時HEAD: `e9153a954a998ad346c6ad7beb876056c11c52fb`。
- 起点: 同SHAの最新main、正式版`3.1.2.1`。計画資料の明示的な起点方針を採用。
- 作業ブランチ: `codex/3200-update01-audit`。隔離worktreeで実装。
- PR #382: OPEN、未マージ。計画head `69cd178ebfa1fd0f41b6daa7a6465c015c31639a`、旧base `feature/app-3.1.0.0`。計画4ファイルのみ引き継ぎ、READMEは最新mainの履歴へ追記した。
- #382の作業ブランチは別worktreeで使用中。古いbaseの実装差分を混ぜず、新しい正本をbaseとする実装PRへ集約する。#382は計画履歴として変更しない。
- 既存checkoutの3.1 Update01/02 JSON 5件の未コミット変更は保持。
- 新しい表示版: `3.2.0.0 Update01 r210`。正式公開は対象外。
- 推奨エンジン: GPT-6 Astra / reasoning high。理由: 全件差分、複数索引、実行時の解釈差を照合するため。計画上の推奨であり、実行モデルを変更したという意味ではない。

## 取得・生成の来歴

詳細は `provenance.json`。2026-10-17 10:56:42 JST取得。原取得run `2026-10-17T00-41-45-707Z`、保存成果物からの復旧run `2026-10-17T02-12-44-246Z`。

両runの終了状態はfailed（取得後のアプリ検証失敗）。4分類の取得完了ログと、保存済み全items（武将499、装備266、技能701、陣形22）の現行アプリとの完全一致を確認した。その後PR #384で検証を修復し、同じ成果物を検証・Preview反映、PR #385で正式版へ反映した。元のfailure記録を成功へ書き換えない。再取得は行わない。

`hadou_meta.json.sourceCommit=8239d70ed4d43f2b762858a1c14c21f221c9757b` はアプリ生成基準SHAであり、クローラーSHAではない。元生成時のクローラーSHAはrun記録に存在せず未確認。今回の正本クローラー確認・再生成チェックSHAは `59b53668e41db6e2e5619a75c68a5dd6df3d21e9`。

## 監査実装

- `tools/audit_data_coverage.js`: 12分類2,278行、36 JSONの正規LF SHA-256・件数・行識別子別差分を記録。一次IDは記事URL等を優先し、名称変更を削除・追加と誤認しない。
- 比較基準は直前の正式版データ `9d8642b77665a94b7b8e166814e15c4dc6b87091`。今回mainへの最新データ反映が既に済んでいるため、作業起点との差分は0。前回データとの差分を別途監査する。
- 追加44（武将5、戦法5、装備6、技能20、状態変化8）、削除0。変更は取得時刻等を含むraw変更として数え、意味変更と同一視しない。全IDと変更フィールドは `data-audit.json`。
- 検索・結果カード・技能所有者・関連リンクの参照を全件確認。所有者参照と関連リンク14,273本に新たな参照切れなし。装備aliasの2検出はreportの保留として明示。
- 兵科は武将499件すべての「兵科／相性」欄から確認。本文に他兵科が登場しただけでは分類しない。騎兵160、弓兵166、歩兵161、工兵5、盾兵7。
- 兵科技能は `commanders-troop-type`。対象武将は「主将として当該兵科効果を付与する候補」であり、通常技能の所持武将として混入させない。
- 実際の `buildDerivedTacticDataset` をVMで呼び、保存戦法478に対して実行時458、未露出20を全件列挙。VMは単体検証でありfileブラウザ検証の代替完了証拠ではない。
- `gold-fixtures.json` と `test_3_2_0_0_update01_audit.js`: 全分類件数、499武将の兵科ID集合、追加44件、未分類状態8件、装備alias2検出、戦法差分20件を固定。欠落・参照先破損をメモリ内へ注入して検出を確認。新しいデータbundleではfixtureをレビューして更新する必要があり、自動追認しない。

## 実装・開発工程の修正

- `hado_version.js`、`index.html`: Update01 r210、cache key `01-r210`。
- `hado_core.js`: FILE_META / HADO_BUILD_INFOを `window.HADO_VERSION` 参照へ変更。版定義を先に読み込む。機能コードの追加は外部JS、HTMLへのインラインJS追加なし。
- `HADO_DEV_INFO.json`: 基準正式版と更新日を修正。releaseVersion/updateNo/revisionを重複定義しない。
- `.github/workflows/notify-preview.yml`: 新正本へのpushを同期元とする設定。マージ前に公開Previewは変えない。
- `.github/workflows/app-validation.yml`: pull_request/merge_groupを保持し、実際の総合検証を実行する。main起点に不足していたデータPRのPreviewトークン事前確認を既存3.1開発ブランチから引き継いだ。
- 各既存版表示テストとPreview validator、merge-readinessのbaseを整合。
- HTML: 29,038 → 28,889 bytes（Git blob/LF基準、149 bytes減）。
- 派生JSON一式は無変更。生成元からの`--check`は出力置換もネットワーク取得も行わない。

## 検証と保留

実行コマンド・結果・Previewゲート・Update02受入条件は [report](report.md) を参照。正式公開なし。Update01を完了とせず、Update02の実装開始は保留する。
