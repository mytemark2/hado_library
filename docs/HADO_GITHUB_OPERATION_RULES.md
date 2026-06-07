# 覇道ライブラリ GitHub運用ルール

## 正本
- `main`: 正式公開済みソース。直接Pushしない。
- `feature/app-3.0.0.0`: 現在のアプリ開発中正本。
- `mytemark2/hado_library-preview`: ブラウザ動作確認専用。修正元にしない。

## 作業開始時
Repo、Branch、最新Commit SHA、`main`との差分、版数情報、Push済み状態を確認する。修正元識別にはGit Commit SHAを使い、作業開始時の全ファイルSHA-256確認は行わない。

## Update記録
各Updateは `docs/updates/<update>/roadmap.md`、`implementation.md`、`report.md` に記録する。`docs/updates/README.md` も原則としてコードと同じCommitで更新する。旧形式資料は削除せず、新形式文書から参照する。

## プレビュー
`feature/app-3.0.0.0` へのPush後、`.github/workflows/notify-preview.yml` によりプレビュー同期を自動起動する。開発ブランチ反映とプレビュー同期結果は分けて報告する。

## HTML肥大化防止
HTMLへ大規模JavaScriptを直接追記しない。独立責務は外部JSを新設し、既存責務と一致する場合のみ既存JSへ追記する。HTML側はDOM骨格、最小限の初期化、`<script src="...">` 読込に留める。外部JS追加時は読込順、依存関係、`file://`、`https://`、プレビュー同期対象を確認する。HTMLサイズ制限に近づいた場合は既存インラインJSの外部化を優先する。

## 配布
SHA-256は単体HTMLとZIP内HTML、版数付きHTMLと`index.html`、派生JSONの`sourceSha256`整合に使う。正式公開はPull Request経由で`main`へMergeする。
