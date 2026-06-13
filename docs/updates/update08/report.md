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

## Update08.13 修正
- previewサイトを直接確認した結果、`hado_styles.css` が404/またはコメント断片だけの不完全なCSSとして公開されている状態を確認した。これはCSS配信の有無だけでなく、同期元/同期後assetの内容検証が不足していたことが原因。
- app側 `.github/workflows/notify-preview.yml` に、dispatch前の `Validate source preview assets before dispatch` を追加し、`index.html` が `./hado_styles.css` を参照し、ローカル `hado_styles.css` が10万byte以上で `:root{` / `.panel{` / `.app{` を含むことを検証する。
- 公開preview検証も `hado_styles.css` が10万byte以上で `:root{` / `.panel{` を含むことを条件にし、404・空ファイル・コメント断片だけのCSSを失敗扱いにする。
- 再発防止として、`tools/validate_preview_workflow.py` に source asset preflight と CSSサイズ閾値チェックがworkflowから消えた場合に失敗する検証を追加した。
- 表示バージョンを `3.0.0.0 Update08.13` へインクリメント済み。

## Update08.14 修正
- previewサイトを再確認し、`hado_styles.css` が依然として404になる原因を、app側の修正commitがあるbranchとpreview repo側 `sync-preview.yml` が hard-code して clone する `feature/app-3.0.0.0` の不一致、および repository_dispatch 後にpreview repo側同期workflowへ依存し続ける構造と判断した。
- app側 `.github/workflows/notify-preview.yml` から `repository_dispatch` 依存を撤廃し、pushされた現在のsource branch checkoutを `rsync --delete` でpreview repo `main` へ直接同期する方式に変更した。これにより `hado_styles.css` を含む同一checkoutのassetがpreview repoへ入る。
- 同期先preview repo上で `index.html` / `hado_library_3.0.0.0.html` / `hado_styles.css` / `hado_version.js` / `PREVIEW_SOURCE_COMMIT.txt` の存在、CSSサイズ10万byte以上、`:root{` / `.panel{` / `.app{` を検証してからcommit/pushする。
- 公開preview検証では `PREVIEW_SOURCE_BRANCH.txt` も確認し、どのbranch/commitが公開されたかを固定して照合する。
- 再発防止として、`tools/validate_preview_workflow.py` に direct rsync、preview repo push、source branch marker、CSS同期先検証を必須化し、旧 `repository_dispatch` / `sync_app_preview` / hard-code clone pattern が残ったら失敗する検証を追加した。
- 表示バージョンを `3.0.0.0 Update08.14` へインクリメント済み。

## Update08.15 修正
- 提示保存データでは多数の武将・装備が保存されている一方、IssueLogのBuild Infoは `Update07.3` / type-score `Update07.6` で、Update08.5以降の「保存所有0点候補を表示」修正が入った実行状態ではないことを確認した。
- ただし現行実装にも、型候補一覧が `state.savedModeIndex` のSetだけに依存し、保存データ本体からの再構築や旧名/基礎名・レアリティ付き名・ORIGINS表記の別名照合が不足する弱点が残っていた。
- `hado_type_candidates.js` の保存候補判定を修正し、現在保存データの `generals` / `generalStars` / `generalSettings` / `inheritedSkills` / `equipments` / `equipmentStars` / `equipmentStages` を型候補一覧側でも直接合成して照合するようにした。
- `関羽` と `LR関羽（かんう）`、`LR夏侯惇(ORIGINS)` と `夏侯惇` のような差分を別名キーとして照合し、保存データ候補が過少表示される原因を減らした。
- 再発防止として、`tools/validate_type_candidate_saved_name_matching.py` に保存データ本体fallbackと別名キー照合の必須検証を追加した。
- 表示バージョンを `3.0.0.0 Update08.15` へインクリメント済み。

## Update08.16 修正
- Update08.15の修正方針は、保存データ型候補一覧で重要な2軸（①武将を所有=お気に入りしているか、②その武将の保存将星で所有する技能で型判断しているか）に対して、名前照合・所有Set拡張に寄り過ぎていたため見直した。
- 所有判定は `generals` / `equipments` のお気に入りリストに限定し、`generalStars` / `generalSettings` / `inheritedSkills` / `equipmentStars` / `equipmentStages` のキーを所有扱いにする処理を廃止した。
- 武将候補の型スコアは、保存データ表示時に `getResolvedGeneralSkillLevelMap` で保存将星から解放済み技能を解決し、未解放技能由来の `effect-text` 特徴行を除外して `HadoTypeScore` へ渡すようにした。
- 全データ表示では従来通り全候補を対象にし、武将設定の最大将星前提で全技能を評価する。保存データ表示ではお気に入り武将のみを候補にし、その保存将星で解放済みの技能だけを型評価へ反映する。
- 再発防止として、`tools/validate_saved_mode_index_ownership_sources.py` と `tools/validate_type_candidate_saved_name_matching.py` を、stars/settingsを所有扱いに戻した場合や、レアリティ違いを同一所有扱いにした場合に失敗する検証へ更新した。
- 表示バージョンを `3.0.0.0 Update08.16` へインクリメント済み。

## Update08.17 修正
- 主将限定などの役割限定判定が消えるデグレを調査し、`roleAllowedSet` の主将判定にある除外条件が広すぎることを確認した。
- 実データの戦法本文では `この武将が主将の場合` と `対象部隊の主将と...` が同じ `matchedText` に混在することがあり、従来の `主将と` 除外により主将限定句まで無効化されていた。
- `hado_type_score.js` の主将限定判定から広域除外を外し、`主将の戦法` / `主将と` のような非限定語が同じ文にあっても、明示的な `この武将が主将の場合` / `主将時` / `■主将` を役割限定として維持するようにした。
- 再発防止として、`tools/test_type_score.js` に「主将限定句と主将参照語が混在する戦法本文」で主将は一致し、副将は一致しない回帰テストを追加した。
- 表示バージョンを `3.0.0.0 Update08.17` へインクリメント済み。

## Update08.18 修正
- 保存データ表示時の型候補一覧で、保存将星により解放済みの技能が付与する技能（例: 連堅が付与する堅強）を所有技能Setへ含めていなかったため、保存データ＋限定条件の候補が誤って除外される問題を確認した。
- `hado_type_score.js` の役割判定で、`■主将の際` / `■副将の際` などの見出しと後続の `●` / `▼` 箇条書きが分離され、見出しの役割限定が箇条書きへ継承されない類似問題も確認した。
- `hado_type_candidates.js` で保存将星から解放済みの技能に加え、その技能が現在Lvで付与する技能名を所有技能Setへ追加し、未所有技能判定前に `HadoTypeScore.roleCompatibleText` で対象役割の本文だけへ絞り込むようにした。
- `hado_type_score.js` で役割見出しのスコープを後続箇条書きへ継承し、直接 `featureId` が一致していても対象役割に残った本文に該当指標語がない場合は採点しないようにした。
- 再発防止として、`tools/test_saved_type_candidate_filter.js` を追加し、保存将星で解放済み技能が付与する技能と、別役割限定の未所有技能が同じ本文に混在するケースを検証するようにした。
- 表示バージョンを `3.0.0.0 Update08.18` へインクリメント済み。

## Update08.19 修正
- 添付ログの保存データ＋限定パターンを再確認し、Update08.18では保存将星で解放済みの技能名/付与技能名は扱ったが、同じ技能名の必要Lvまでは判定していなかった問題を確認した。
- `hado_type_candidates.js` で所有技能Setに加えて所有技能Lv Mapを保持し、`連堅2` / `堅強Lv2` のような要求Lvが保存将星で解放済みのLvを超える場合は、その限定句を保存データの型スコアから除外するようにした。
- 同じ役割限定本文に所有技能名と未所有技能名が混在する場合も、所有技能が1つ含まれるだけで通過しないよう、未所有またはLv不足の技能が1つでもあれば除外する判定へ修正した。
- 再発防止として、`tools/test_saved_type_candidate_filter.js` に Lv2 では通過し、Lv1 では同じ主将限定句を拒否する回帰ケースを追加した。
- 表示バージョンを `3.0.0.0 Update08.19` へインクリメント済み。

## Update08.20 修正
- 保存データ＋限定パターンの原因調査を再実施し、Update08.19の `requiredSkillLevel` が `連堅2` / `堅強Lv2` の直結表記だけを主に想定し、実データに多い `盟主がLv3以上`、`技能「備急」をLv2`、`●歓喜Lv2` のような助詞・引用符入り表現を十分に解析できていなかったことを確認した。
- `hado_type_candidates.js` の要求Lv解析を改善し、技能名の後に引用符・助詞・`技能`・`Lv` / `レベル` が挟まる表現を同一技能の必要Lvとして判定するようにした。
- `技能Lv×20%` のような倍率表現は Lv20 要求として扱わず、保存技能Lv1以上の所有技能として扱うよう回帰テストで確認した。
- セルフチェックとして、`tools/test_saved_type_candidate_filter.js` に `盟主がLv3以上`、`技能「備急」をLv2`、`●歓喜Lv2`、`技能Lv×20%` の解析結果と、保存Lv不足時の除外を追加した。
- 表示バージョンを `3.0.0.0 Update08.20` へインクリメント済み。

## Update08.21 修正
- 保存データ＋限定パターンのセルフチェック観点を再確認し、`candidateVisibleByScore` が保存データでは所有済み0点候補まで表示していたため、主将/副将/補佐/侍従の選択可能件数が所有数ベースで横並びになり得る原因を確認した。
- `hado_type_candidates.js` の候補表示を `matchedCount > 0` の選択可能候補へ戻し、保存データではお気に入り所有に限定しつつ、型に適合した候補だけを件数・一覧へ出すようにした。
- セルフチェックとして `tools/test_type_candidate_counts.js` を追加し、ワクチン型で全データ件数 `主将182 / 副将175 / 補佐175 / 侍従171`、保存データ全所有相当でも同件数、保存サンプルでも合計比率40.3%で大幅崩壊せず、役割別件数差が残ることを確認した。
- `tools/validate_saved_type_candidates_zero_score_visible.py` を、0点所有候補を選択可能表示しない方針の検証へ変更した。
- 表示バージョンを `3.0.0.0 Update08.21` へインクリメント済み。

## プレビュー同期
この作業環境ではPush後のGitHub Actions結果とプレビューURLの実機確認は未実行。コミット後、push-triggered `Notify Hado Library Preview` の成功とデプロイcommit一致を確認する。

## ユーザー受け入れ確認
1. 保存データ表示に切り替え、所有武将・装備のみが型候補一覧に出ることを確認する。
2. 型候補一覧から「この型で新規部隊」を押し、既存部隊が上書きされず新規部隊が追加されることを確認する。
3. 評価スコアとマイメモを入力し、「履歴へ保存」で履歴が最大10件に収まることを確認する。
4. グループ追加と部隊追加で最大5グループ、各12部隊の上限が機能することを確認する。
