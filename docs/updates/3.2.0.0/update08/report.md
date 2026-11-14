# Update08 検証報告

3.2.0.0 Update08 r228の全体回帰と公開Previewの検証に合格した。正式版の公開判断は利用者承認を待つ。

## 自動回帰とGitHub Actions

- `python tools/run_app_validation.py` は185項目すべて合格。現行データ監査、派生JSON契約21ファイル、検索・詳細・編成、比較時の保存データ保護、旧保存形式とExport/Importの往復を含む。
- `python tools/validate_update_version_consistency.py` と `git diff --check` は合格。
- 開発正本は `feature/app-3.2.0.0`、開始点は `492610aa26abf91a66987e779630781ef202b07f`。候補の作業ブランチは `codex/3200-update08-release-candidate`、headは `fe42e310e93859ffb0a9ecee3090f84394115613`。`python tools/check_pr_merge_readiness.py --base feature/app-3.2.0.0` は上記base/headで競合なし。候補の変更ファイルは[実装記録](implementation.md)に記載。
- [PR #424](https://github.com/mytemark2/hado_library/pull/424) は [App Validation](https://github.com/mytemark2/hado_library/actions/runs/43550821722) 合格後に `6663a667c10c96cd57199c902fa7ae9e02e272f4` へマージ。開発ブランチのpushを起点に [Notify](https://github.com/mytemark2/hado_library/actions/runs/43551030656) と [Pages](https://github.com/mytemark2/hado_library-preview/actions/runs/43551095706) が成功した。
- 検証中に[自動データ更新PR #425](https://github.com/mytemark2/hado_library/pull/425) が入り、[App Validation](https://github.com/mytemark2/hado_library/actions/runs/43552493697)、[Notify](https://github.com/mytemark2/hado_library/actions/runs/43552620083)、[Pages](https://github.com/mytemark2/hado_library-preview/actions/runs/43552675291) が成功した。武将・装備・陣形と検索・技能所有者・タグ索引では、取得・生成情報のみの差分を確認した。公開マニフェスト上のデータ更新日時は2026-11-08 17:46 JST。

## Preview確認

**合格。** 表示版は `3.2.0.0 Update08 r228`。[公開HTTPS Preview](https://mytemark2.github.io/hado_library-preview/?v=08-r228&source=e9d5476)

- 公開markerは `PREVIEW_SOURCE_COMMIT.txt` が `e9d547610d029e23b75fe22e533f96dfea892e0e`、`PREVIEW_SOURCE_BRANCH.txt` が `feature/app-3.2.0.0`、`PREVIEW_DISPLAY_VERSION.txt` が `3.2.0.0 Update08 r228`。
- Previewリポジトリの `main` は検証時点で `c8aa23e853baea199b1c9241c3d2468d17422bdc`。`index.html`、`hado_formation.js`、`hado_styles.css`、`.nojekyll`、3つのmarker、`hadou_*.json` 36件を確認した。
- 公開版のバージョンJS・編成JS・比較JS・共通CSS・マニフェスト・武将JSON・検索索引は開発元のSHA-256と一致。マニフェストが列挙する公開データ31ファイルは全件のサイズ・SHA-256が一致した。HTMLには配信工程がPreview用タイトル・バナーを挿入するため、公開ページで実際のDOMと見出しを確認した。
- PC幅で起動と検索結果の一致理由を確認。「工兵」の一致箇所へ移動し、LR李典の基礎タブで兵科行が表示範囲内に入った。検証用の保存編成2件は差分6項目・評価差−17を表示。編成共有コピーは完了表示とクリップボード出力を確認した。
- 390×844では「工兵」の一致箇所までページがスクロールし、同じ編成比較で差分6項目・評価差−17・共通軍馬を確認。文書と比較結果の横はみ出しは0px。
- データ更新反映後も初期読込、見出し、キーワード「操器」の一致理由、工兵の技能詳細と所有武将へのリンクを確認。更新前後の内蔵検証はともにOK、重大0・警告0・情報0。Debug Logの表示と出力、およびブラウザー警告・エラー0件を確認した。ログコピーの内容確認はツール接続の中断で未実施。
- 保存互換とExport/Importの往復は自動回帰で確認。画面検証には既存の検証用セーブを使用した。

## 確認事項

利用者による追加の動作確認はなし。正式公開の判断は別途承認が必要。

## 最小受入操作

公開Previewで「工兵」を検索し、LR李典の「一致箇所を表示」で兵科行を確認する。部隊編成では「2編成を比較」で保存済みの2件を選び、差分が表示されることを確認する。いずれもPC幅とスマートフォン幅で実施済み。

## 残件

Update08の必須検証に残件なし。正式版への反映と公開は承認待ち。
