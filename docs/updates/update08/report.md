# Update08 Report

## 状態
完了（ローカル実装・静的検証済み、プレビュー同期はPush後確認が必要）

## 実装結果
- 保存データ表示モードの型候補一覧で、武将系候補は保存データの所有武将、装備候補は所有装備、名馬/軍馬技能候補は登録済み名馬がある場合に限定するようにした。
- 全データ表示では所有情報フィルターを適用しない。
- 型候補一覧に「この型で新規部隊」を追加し、選択中の型を新規部隊へ自動入力するようにした。
- 既存部隊は上書きせず、新規部隊として追加する。
- 部隊レコードに評価型名、トータルスコア、評価スコア、マイメモ、履歴、グループIDを保存するようにした。
- 1部隊10履歴、1グループ12部隊、最大5グループの上限を保存時の正規化とUI操作で適用した。

## 変更ファイル
- `hado_formation.js`
- `hado_core.js`
- `hado_type_candidates.js`
- `HADO_DEV_INFO.json`
- `hado_update_meta.js`
- `docs/updates/roadmap.md`
- `docs/updates/update08/roadmap.md`
- `docs/updates/update08/implementation.md`
- `docs/updates/update08/report.md`
- `hado_status_effects.js`
- `tools/validate_formation_link_helpers.py`

## HTMLサイズと外部化
- HTML変更なし。
- Update08の新規挙動は外部JSへ実装した。

## Update08.1 修正
- `3.0.0.0 Update08.1` として、部隊編成描画で `formationEntityLinkHtml is not defined` が発生する問題を修正した。
- 実際にHTMLから読み込まれる `hado_status_effects.js` に編成画面用リンクヘルパーを配置した。
- 旧結合ファイル `hado_app.js` には同ヘルパーが残っていたが、現在のHTMLロード順では読み込まれないため、外部分割後の配置漏れが原因だった。
- 再発防止として、HTMLで有効なスクリプト群に編成リンクヘルパーが存在することを検証する `tools/validate_formation_link_helpers.py` を追加した。

## 検証結果
- JavaScript構文検証: 成功。
- JSON構文検証: 成功。
- アプリJS検証: 成功。
- `updates/queue` は存在しない。
- HTML有効スクリプト内の編成リンクヘルパー存在検証: 成功。
- 型候補名と保存所有名の照合検証: 成功。
- 表示バージョンを `3.0.0.0 Update08.2` へインクリメント済み。

## Update08.2 修正
- 保存データ表示の型候補一覧で候補数が少なくなる問題を調査し、保存データ側の所有名（例: `【三國志 覇道】LR司馬師`）と型候補側の短縮名（例: `LR司馬師（しばし）`）を直接比較していたことが原因と特定した。
- 保存所有名と型候補名を同じ照合キーへ正規化し、武将4役割と装備候補が所有データへ正しく一致するようにした。
- 再発防止として、型候補JSONの武将/装備候補名が保存マスタ名へ照合可能であることを検証する `tools/validate_type_candidate_saved_name_matching.py` を追加した。
- 表示バージョンを `3.0.0.0 Update08.2` へインクリメント済み。

## Update08.3 修正
- 修正ごとの視認性を担保するため、表示バージョンを `3.0.0.0 Update08.3` へインクリメントした。
- 複数ファイルで表示バージョンを直接定義しないよう、実行時フォールバックの単一定義を `hado_version.js` の `HADO_VERSION` に集約した。
- 型候補一覧は固定の Update 文字列を持たず、`window.HADO_APP_DISPLAY_VERSION` / `window.HADO_APP_VERSION_META` を参照する。
- 再発防止として、メタJSON、`hado_update_meta.js`、HTML読み込み順、型候補JSのハードコード有無を検証する `tools/validate_update_version_consistency.py` を追加した。

## Update08.4 修正
- 保存データ表示の型候補一覧で対象武将がまだ少ない原因として、所有判定の元データが `saves[].generals` / `saves[].equipments` に偏っていた点を修正した。
- 保存データでは将星、能力設定、継承技能、装備星、装備段階を設定した時点で実質的に保存対象として扱うため、`generalStars` / `generalSettings` / `inheritedSkills` / `equipmentStars` / `equipmentStages` のキーも候補所有判定に含める。
- 再発防止として、保存モード索引が明示所有リスト・将星・設定値・段階を所有ソースに含むことを検証する `tools/validate_saved_mode_index_ownership_sources.py` を追加した。
- 表示バージョンを `3.0.0.0 Update08.4` へインクリメント済み。

## Update08.5 修正
- 保存データ表示の型候補一覧で「所有はしているが選択中の型スコアが0点」の武将・装備が `matchedCount > 0` 条件で非表示になっていた点を修正した。
- 保存データ表示では所有対象に絞り込んだうえで、適合0点の対象も表示し、スコア順で下位に並べる。これにより保存データに切り替えた途端に大半の所有対象が消える状態を避ける。
- 再発防止として、保存モード候補一覧が `matchedCount > 0` を保存対象へ強制しないことを検証する `tools/validate_saved_type_candidates_zero_score_visible.py` を追加した。
- 表示バージョンを `3.0.0.0 Update08.5` へインクリメント済み。

## Update08.6 修正
- HTMLからCSS分離が未完了だった原因として、既存の大型 `<style>` ブロックが `index.html` / `hado_library_3.0.0.0.html` に残っていた点を修正した。
- 共通CSSを `hado_styles.css` に外部化し、両HTMLは `<link href="./hado_styles.css" rel="stylesheet"/>` の参照のみを持つ。
- プレビューが古い件は、2026-06-12時点でプレビューURLの表示が `3.0.0.0 Update08.4` のままで、ローカル正本 `Update08.5` 以降の反映が完了していないことを確認した。Push後に `Notify Hado Library Preview` の成功、preview側deploy commit、表示バージョン `Update08.6` の一致確認が必要。
- 再発防止として、HTMLに `<style>` ブロックや `style=` 属性が残っていないこと、`hado_styles.css` が参照されていることを検証する `tools/validate_external_css.py` を追加した。
- 表示バージョンを `3.0.0.0 Update08.6` へインクリメント済み。

## Update08.7 修正
- 起動直後からChromeがフリーズする原因として、`hado_update_meta.js` が `document.documentElement` 全体を `MutationObserver` で監視し、起動時の大量DOM更新ごとに表示バージョン同期処理とDOM queryを繰り返す構造になっていた点を修正した。
- 全DOM監視を廃止し、初期化時、`HADO_DEV_INFO.json` 読込後、`pageshow`、および `hado:version-sync-request` の明示イベント時だけ同期する。
- 型編成ナビと候補トレイは描画時に `window.HADO_APP_DISPLAY_VERSION` / `window.HADO_APP_VERSION_META` を読むようにし、全DOM監視に依存しない表示へ変更した。
- 再発防止として、`hado_update_meta.js` に広域 `MutationObserver` が残っていないことを検証する `tools/validate_update_meta_no_broad_observer.py` を追加した。
- 表示バージョンを `3.0.0.0 Update08.7` へインクリメント済み。

## Update08.8 修正
- 可視バージョン/Update番号を毎回複数ファイルへ書く必要が残っていた原因として、`HADO_DEV_INFO.json` と `hado_update_meta.js` が `updateNo` / `displayVersion` を重複定義していた点を修正した。
- 実行時の唯一の定義元を `hado_version.js` の `HADO_VERSION` const にし、`hado_update_meta.js`、HTML、preview workflow、検証スクリプトはその値を参照するだけにした。
- `HADO_DEV_INFO.json` から `releaseVersion` / `updateNo` / `displayVersion` / `revision` の重複フィールドを除去し、`versionSource: "hado_version.js"` のみを保持する。
- 再発防止として、`tools/validate_update_version_consistency.py` を更新し、`HADO_DEV_INFO.json` や `hado_update_meta.js` に重複バージョン定義が戻った場合は失敗するようにした。
- 表示バージョンを `3.0.0.0 Update08.8` へインクリメント済み。

## Update08.9 修正
- プレビューが `Update08.4` に戻る/古いままになる原因として、アプリ側 `.github/workflows/notify-preview.yml` が `repository_dispatch` の `event_type: app_branch_updated` を送っていた一方、preview側workflowは `types: [sync_app_preview]` を待ち受けており、通常push通知ではpreview同期が起動しない契約不一致を確認した。
- preview側workflowは `feature/app-3.0.0.0` を固定cloneするため、アプリ側通知も同ブランチpushに限定し、`main`以外すべてを通知する設定を廃止した。
- dispatch後検証を、HTML本文に期待表示文字列があるかだけではなく、preview公開物の `PREVIEW_SOURCE_COMMIT.txt` がpush元SHAと一致し、`hado_version.js` の `releaseVersion` / `updateNo` が期待表示バージョンと一致し、`index.html` が `hado_version.js` を参照していることの検証へ強化した。
- 再発防止として、`tools/validate_preview_workflow.py` を更新し、`sync_app_preview`、`feature/app-3.0.0.0`、`PREVIEW_SOURCE_COMMIT.txt`、`hado_version.js` の検証がworkflowから消えた場合に失敗するようにした。
- 表示バージョンを `3.0.0.0 Update08.9` へインクリメント済み。

## Update08.10 修正
- CSSがpreviewで読み込まれない状態を見逃した原因として、preview検証が `PREVIEW_SOURCE_COMMIT.txt`、`hado_version.js`、`index.html` のversion参照確認に留まり、外部化した `hado_styles.css` の公開・参照・内容を確認していなかった点を修正した。
- preview側syncは `rsync` でCSSもコピー対象に含め得る構造だが、アプリ側workflowでCSS assetを必須検証していなかったため、CSS未配信やHTML参照漏れを検知できなかった。
- `Notify Hado Library Preview` のpost-dispatch検証で、公開 `index.html` が `./hado_styles.css` を参照し、公開 `hado_styles.css` が取得でき、`:root{` と `.panel{` を含むことを確認するようにした。
- 再発防止として、`tools/validate_preview_workflow.py` に `hado_styles.css` と `./hado_styles.css` の必須チェックを追加した。
- 表示バージョンを `3.0.0.0 Update08.10` へインクリメント済み。

## Update08.11 修正
- preview repoの `jekyll-gh-pages.yml` を作り直したらCSSが読み込まれるようになった理由は、preview同期が「app repoからpreview repoへファイルをコピーする段階」と「preview repoの内容をGitHub Pagesへ公開する段階」の2段階であり、後者のPages公開workflowが欠落・不整合・未実行だと、`hado_styles.css` がrepoに入っていても公開URLへ反映されないため。
- app側 `.github/workflows/notify-preview.yml` に、dispatch前のpreflightとして preview repo `main` の `.github/workflows/jekyll-gh-pages.yml` をGitHub APIで読み取り、`actions/jekyll-build-pages`、`actions/deploy-pages`、`push:`、`branches:` を含むことを検証する処理を追加した。
- これにより、Pages公開workflowが消えた/壊れた状態ではpreview同期を進めず、原因を明示してworkflowを失敗させる。
- 再発防止として、`tools/validate_preview_workflow.py` に `Verify preview Pages deployment workflow exists`、`jekyll-gh-pages.yml`、`actions/deploy-pages`、`actions/jekyll-build-pages` の必須チェックを追加した。
- 表示バージョンを `3.0.0.0 Update08.11` へインクリメント済み。

## Update08.12 修正
- 毎回サイト公開を取り消して作り直さないと反映されない原因として、preview repoの `sync-preview.yml` がGitHub Actions内で `git push` しており、そのpushでは別workflowの `on: push` が通常起動しないため、Pages公開workflowが自動実行されない点を修正した。
- app側 `.github/workflows/notify-preview.yml` で `sync_app_preview` dispatch後、preview repo `main` の `PREVIEW_SOURCE_COMMIT.txt` がpush元SHAになるまでGitHub APIで待機する。
- 同期commit確認後、app側workflowから preview repo の `actions/workflows/jekyll-gh-pages.yml/dispatches` を呼び、Pages公開workflowを自動起動する。これによりユーザーがサイト公開を手動で作り直す必要をなくす。
- `PREVIEW_REPO_TOKEN` は preview repo の Contents Read/Write に加え Actions Read/Write 権限が必要になった。
- 再発防止として、`tools/validate_preview_workflow.py` に sync commit待機、Pages workflow dispatch、dispatch endpoint、`PREVIEW_REPO_TOKEN` の必須チェックを追加した。
- 表示バージョンを `3.0.0.0 Update08.12` へインクリメント済み。

## プレビュー同期
この作業環境ではPush後のGitHub Actions結果とプレビューURLの実機確認は未実行。コミット後、push-triggered `Notify Hado Library Preview` の成功とデプロイcommit一致を確認する。

## ユーザー受け入れ確認
1. 保存データ表示に切り替え、所有武将・装備のみが型候補一覧に出ることを確認する。
2. 型候補一覧から「この型で新規部隊」を押し、既存部隊が上書きされず新規部隊が追加されることを確認する。
3. 評価スコアとマイメモを入力し、「履歴へ保存」で履歴が最大10件に収まることを確認する。
4. グループ追加と部隊追加で最大5グループ、各12部隊の上限が機能することを確認する。
