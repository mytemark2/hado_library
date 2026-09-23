# 3.1.2.0 完了報告

## 状態

`3.1.2.0 r208`のPreview確認を経て、`3.1.2.0`の正式公開、公開ファイル照合、公開URLの実操作確認まで完了した。

## 実装結果

- 検索カテゴリに`兵科`を追加。
- `走撃`、`射襲`、`操器`、`列盾`、`反槍`を名称・兵科・付与文・効果文で検索可能にした。
- Clause Shadowの利用者向け比較表示をPreview含めて非表示にした。
- `兵科`を`軍馬技能`の右側（カテゴリ末尾）へ移動した。
- 内容詳細の構造ラベルをリンク対象外にし、一般語の`基本`へ誤って陣形リンクが付く問題を修正した。

## Preview検出不具合と対策

- 分類: 新規検索カテゴリの詳細表示統合漏れ。
- 根本原因: 兵科技能は既存の`hadou_related_link_index.json`の生成対象外だが、汎用詳細表示がその索引を必須としていた。
- 影響範囲: `troopSkills`の5件のみ。既存カテゴリの関連リンク契約は変更しない。
- 修正: 兵科技能は収集済みの出典URLを使用し、対象外の関連リンク索引を要求しない。
- 再発防止: 兵科技能詳細が関連リンク索引を要求しないことを専用回帰テストへ追加。
- Preview識別: 初回検出版`3.1.2.0 r206`から修正版`3.1.2.0 r207`へ更新。

## 内容詳細の誤リンクと対策

- 分類: 名称と構造ラベルの衝突による自動リンク誤判定。
- 根本原因: 陣形名`基本`が自動リンク候補に登録され、内容詳細の一般語・構造表示でも文脈を区別せず一致していた。
- 影響範囲: 武将、戦法、技能、兵科、装備、状態変化、兵器、武装、陣形、名馬、軍馬技能の名称を構造ラベル一覧と照合した。現データで衝突する名称は`formations:基本`のみだった。
- 恒久対策: 表の項目名とセクション見出しを自動リンク対象外にし、一般語`基本`もリンク候補へ登録しない。
- 再発防止: 全主要データの名称と構造ラベルの衝突を検出する`test_3_1_2_0_detail_link_boundaries.js`を総合検証へ追加した。
- Preview識別: `3.1.2.0 r208`。

## 検証結果

- 総合検証: `python -X utf8 tools/run_app_validation.py` 168/168合格
- 兵科技能契約検証: 5件の名称・兵科・付与文・効果文・参照URLと、検索・詳細・起動統合を確認
- Clause Shadow回帰検証: 計算と診断ログが維持され、利用者向け描画関数が空文字を返すことを確認
- 最新ブランチとの統合検証: `origin/main` `996bfbe`を統合、競合なし
- 実ブラウザ確認: 兵科の5件表示、`兵器速度+30%`から`操器`が1件ヒット、`走撃`詳細、不要な関連リンクエラーがないことを確認
- リンク境界監査: 主要11カテゴリの名称と構造ラベルを照合し、衝突は`formations:基本`の1件。構造ラベル除外と一般語抑止後に専用回帰テスト合格

## Git / Actions / Preview

- 実装PR: [#371](https://github.com/mytemark2/hado_library/pull/371)、マージCommit `6bf8647b26af684a851e0de1bbec1e5705c43d4e`
- Preview検出不具合修正PR: [#372](https://github.com/mytemark2/hado_library/pull/372)、マージCommit `38b2bb74133df9da0b60e94f2ea6514e59c0af08`
- カテゴリ順・詳細リンク修正PR: [#374](https://github.com/mytemark2/hado_library/pull/374)、マージCommit `4409cd8957dc7b3339f7093cd05e7732f9936ff6`
- Preview完了記録PR: [#375](https://github.com/mytemark2/hado_library/pull/375)、マージCommit `d84064f434852b497bd5eab80643e94b45d9f3da`
- PR自動検証: `App Validation / app-validation`合格
- r208 Preview同期: `Notify Hado Library Preview` run `35808886677`成功
- r208 runtime確認時のPreview repository: `4f251cdff21e737f4e65e914fba8d7a467379439`
- 最終Preview同期: `Notify Hado Library Preview` run `35809380762`成功
- 最終Preview repository: `d0e535c65c4b86e59954fbe4d2705a3aa97a4c11`

## Preview confirmation

- 公開URL: <https://mytemark2.github.io/hado_library-preview/>
- 表示バージョン: `3.1.2.0 r208`
- `PREVIEW_SOURCE_COMMIT.txt`: `d84064f434852b497bd5eab80643e94b45d9f3da`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.1.2.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.1.2.0 r208`
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`hado_troop_skills.js`、`hadou_generals.json`、`.nojekyll`と3種のPreviewマーカーを確認
- DOM確認: 検索カテゴリ`兵科`が`軍馬技能`の右端、表示件数`兵科技能5`、対象5技能の一覧と詳細を確認
- 操作確認: `兵科`のみで5件、効果文検索で`操器`が1件ヒット
- 誤リンク確認: 陣形`基本`の詳細で、タイトルの`基本`と`基本情報`がリンクにならないことを確認
- Clause Shadow: 部隊編成に`Clause Shadow`と`切替保留`が表示されないことを確認
- Debug log: ブラウザのerror/warn 0件
- 結果: PASS

## Production confirmation

- 正式版反映承認: 2026-09-23
- 正式版PR: [#376](https://github.com/mytemark2/hado_library/pull/376)
- 正式版切替Commit: `adc2beeaad3631773ea7f2605c94d834f89da5f3`
- `main`マージCommit: `1a474f2613cee6165516aa7ca24d5bc7ec1e4e73`
- PR検証: `App Validation / app-validation` run `35812707650`成功
- 正式公開: `Deploy Hado Library Production Pages` run `35812791125`成功
- 公開URL: <https://mytemark2.github.io/hado_library/>
- 表示バージョン: `3.1.2.0`。内部revision `208`は保持し、正式版画面には表示しない。
- 公開バージョン定義: `releaseVersion=3.1.2.0`、`revision=208`、`formalRelease=true`
- 公開ファイル照合: `index.html`、`hado_version.js`、`hado_search.js`、`hado_troop_skills.js`、`hadou_generals.json`のSHA-256が`main`のGit blobと一致
- DOM・操作確認: `兵科`がカテゴリ末尾、兵科技能のみで5件、`走撃`詳細を表示
- 誤リンク確認: 陣形`基本`の詳細内リンクは0件で、タイトルの`基本`と`基本情報`はいずれもリンクではない
- Clause Shadow: 部隊編成に`Clause Shadow`と`切替保留`が表示されない
- 起動状態: 公開JSON読込完了、可視エラー・警告なし
- 結果: PASS

## 利用者確認

Previewで利用者確認済み。正式版でも通常検索で`兵科`だけを選択し、5件表示と`走撃`の兵科・付与文・効果文を確認済み。

## 未解決事項

- なし。
