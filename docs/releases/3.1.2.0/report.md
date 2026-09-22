# 3.1.2.0 完了報告

## 状態

実装、ローカル検証、PRマージ、Preview自動同期、公開URLの実操作確認を完了した。

## 実装結果

- 検索カテゴリに`兵科`を追加。
- `走撃`、`射襲`、`操器`、`列盾`、`反槍`を名称・兵科・付与文・効果文で検索可能にした。
- Clause Shadowの利用者向け比較表示をPreview含めて非表示にした。

## Preview検出不具合と対策

- 分類: 新規検索カテゴリの詳細表示統合漏れ。
- 根本原因: 兵科技能は既存の`hadou_related_link_index.json`の生成対象外だが、汎用詳細表示がその索引を必須としていた。
- 影響範囲: `troopSkills`の5件のみ。既存カテゴリの関連リンク契約は変更しない。
- 修正: 兵科技能は収集済みの出典URLを使用し、対象外の関連リンク索引を要求しない。
- 再発防止: 兵科技能詳細が関連リンク索引を要求しないことを専用回帰テストへ追加。
- Preview識別: 初回検出版`3.1.2.0 r206`から修正版`3.1.2.0 r207`へ更新。

## 検証結果

- 総合検証: `python -X utf8 tools/run_app_validation.py` 167/167合格
- 兵科技能契約検証: 5件の名称・兵科・付与文・効果文・参照URLと、検索・詳細・起動統合を確認
- Clause Shadow回帰検証: 計算と診断ログが維持され、利用者向け描画関数が空文字を返すことを確認
- 最新ブランチとの統合検証: `origin/main` `996bfbe`を統合、競合なし
- 実ブラウザ確認: 兵科の5件表示、`兵器速度+30%`から`操器`が1件ヒット、`走撃`詳細、不要な関連リンクエラーがないことを確認

## Git / Actions / Preview

- 実装PR: [#371](https://github.com/mytemark2/hado_library/pull/371)、マージCommit `6bf8647b26af684a851e0de1bbec1e5705c43d4e`
- Preview検出不具合修正PR: [#372](https://github.com/mytemark2/hado_library/pull/372)、マージCommit `38b2bb74133df9da0b60e94f2ea6514e59c0af08`
- PR自動検証: `App Validation / app-validation`合格
- Preview同期: `Notify Hado Library Preview` run `35673219470`成功
- Preview repository: `8c9cd2d7e511a9c0d9e83ce0b439b70a6971ca75`

## Preview confirmation

- 公開URL: <https://mytemark2.github.io/hado_library-preview/>
- 表示バージョン: `3.1.2.0 r207`
- `PREVIEW_SOURCE_COMMIT.txt`: `38b2bb74133df9da0b60e94f2ea6514e59c0af08`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.1.2.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.1.2.0 r207`
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`hado_troop_skills.js`、`hadou_generals.json`、`.nojekyll`と3種のPreviewマーカーを確認
- DOM確認: 検索カテゴリ`兵科`、表示件数`兵科技能5`、対象5技能の一覧と詳細を確認
- 操作確認: `兵科`のみで5件、効果文検索で`操器`が1件ヒット
- Clause Shadow: 部隊編成に`Clause Shadow`と`切替保留`が表示されないことを確認
- Debug log: ブラウザのerror/warn 0件
- 結果: PASS

## 利用者確認

最小確認操作は、Previewの通常検索で`兵科`だけを選択し、`走撃`を選択して兵科・付与文・効果文を確認する。

## 未解決事項

- なし。
