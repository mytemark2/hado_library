# 覇道ライブラリ GitHub運用ルール

## 正本
- `main`: 正式公開済みソース。直接Pushしない。
- `future/app-3.0.0.0`: 現在のアプリ開発中正本。
- `mytemark2/hado_library-preview`: ブラウザ動作確認専用。修正元にしない。

## 作業開始時
Repo、Branch、最新Commit SHA、`main`との差分、版数情報、Push済み状態を確認する。修正元識別にはGit Commit SHAを使う。記憶、過去チャット、ローカル残骸、`main`だけで修正元を決めない。

## 通常更新の反映方法
通常更新は、最新の開発ブランチ一式を取得し、ローカル作業領域で完成ソースを直接修正する。変更済みファイルはまとめて1Commitへ反映し、Pull Requestでレビュー可能な状態にする。

標準Git操作が使えない環境では、作業を停止して制約・影響範囲・安全な代替案を報告する。検索置換キューや使い捨てWorkflowなどの独自搬送経路で回避しない。

以下は通常更新に使用しない。
- `updates/queue/*.json` へ置換命令を登録する方式
- `old` / `new` / `expectedCount` を持つ検索・置換キュー
- Actions内でアプリソースを文字列置換する仕組み
- Update固有の使い捨て適用スクリプトまたはWorkflow
- 定期巡回・schedule前提の同期
- 手動Workflow実行を通常運用に含めること


## Pull Request前のマージ可能性確認
CodexはPRを作成する前に、必ず最新の開発正本ブランチに対するマージ可能性を自分で確認する。ユーザーにGitHubのConflict画面を見て判断させない。

標準チェック:

```bash
python3 tools/check_pr_merge_readiness.py --base feature/app-3.0.0.0
```

このチェックはGitHubから最新の `feature/app-3.0.0.0` を取得し、一時worktreeで `git merge --no-commit --no-ff` を実行して、PRのHEADが正本ブランチへ競合なく取り込めることを確認する。

- チェックが成功した場合のみPRを作成する。
- `origin` が存在しない場合は標準URLを登録してから取得を試みる。
- fetch、認証、ネットワーク、またはmergeで失敗した場合はPRを作成しない。
- 失敗時は、取得できなかったremote/base、HEAD SHA、失敗コマンド、次に必要な安全手順を報告する。
- PR本文には、確認したbase branch、base SHA、head SHA、実行コマンド、競合0件の結果を記録する。

この確認を通していないPRは、レビュー可能でも「マージ可能性未確認」として扱う。

## Update記録
各Updateは `docs/updates/<update>/roadmap.md`、`implementation.md`、`report.md` に記録する。`docs/updates/README.md` も原則としてコードと同じCommitで更新する。旧形式資料は削除せず、新形式文書から参照する。

## プレビュー
`main` 以外の作業ブランチへのPush後、`.github/workflows/notify-preview.yml` によりプレビュー同期を自動起動する。通常運用で手動Workflow Dispatchを要求しない。開発ブランチ反映とプレビュー同期結果は分けて報告する。正式公開用の `main` はプレビュー通知の対象外とする。

## HTML肥大化防止
HTMLへ大規模JavaScriptを直接追記しない。独立責務は外部JSを新設し、既存責務と一致する場合のみ既存JSへ追記する。HTML側はDOM骨格、最小限の初期化、`<script src="...">` 読込に留める。外部JS追加時は読込順、依存関係、`file://`、`https://`、プレビュー同期対象を確認する。HTMLサイズ制限に近づいた場合は既存インラインJSの外部化を優先する。

`hado_app.js` は現在の `index.html` から読み込まれない legacy monolithic artifact として扱う。通常の機能修正・Phase更新・ガイド文言更新では `hado_app.js` を編集せず、実際に読み込まれる `hado_core.js`、`hado_formation.js`、`hado_search.js` などの分割済み外部JSを編集する。`hado_app.js` の削除・移動・再分割は、通常更新と混ぜず専用PRで行う。

## 配布
SHA-256は単体HTMLとZIP内HTML、版数付きHTMLと`index.html`、派生JSONの`sourceSha256`整合に使う。正式公開はPull Request経由で`main`へMergeする。
