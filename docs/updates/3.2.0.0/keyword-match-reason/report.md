# 3.2.0.0 割込み — キーワード一致理由表示 Report

## 状態

完了。PR #393を開発正本へ統合し、r214の自動Preview同期、公開URLの実動作、公開診断まで確認した。正式公開は行っていない。

## 変更

- キーワード指定時だけ、検索結果へ`一致理由：`で始まる名称一致または本文の一文を表示する。
- 一致文は既存の検索対象境界に従い、最大180文字へ短縮する。
- HTMLへ直接スクリプトを追加しない。

## 変更ファイル

- 実装: `hado_search.js`、`hado_styles.css`
- 版・cache key: `hado_version.js`、`HADO_DEV_INFO.json`、`index.html`
- 回帰: `tools/test_3_2_0_0_keyword_match_reason.js`、`tools/run_app_validation.py`、版固定テスト10件
- 記録: 本フォルダーのroadmap、implementation、report

## 検証結果

- `node tools/test_3_2_0_0_keyword_match_reason.js`: 合格。名称一致、本文の一致文だけの抽出、長文短縮、HTMLエスケープ経路、空検索を確認。
- `python tools/run_app_validation.py`: 174/174合格。JSON索引契約、検索境界、保存Export/Import、編成、Preview workflow、版整合を含む。
- 初回の通常権限実行は検証用sample書込みでEPERMとなったため、同じ検証を隔離作業ツリーへの書込み許可付きで再実行して完走。生成sampleの内容差分はなく、行末だけの一時差分を復元した。

## HTML・外部化

- HTMLの機能コード追加: 0 bytes。
- `index.html`の内容変更: cache key `01-r213`から`01-r214`のみ。同じ文字数のため論理サイズ差0 bytes。作業ツリー上のCRLFとGit blobのLF差は機能差に含めない。
- 新規挙動は既存の外部`hado_search.js`へ実装し、インラインJavaScriptは追加していない。

## Git・GitHub Actions

- 実装commit: `d7f24b2d012931ad74ef648a1eb9f27111b6cd08`
- 開発正本のmerge commit: `37361ea7eb7ce3d3f628e948b92afce519fd3f84`
- PR: #393 `3.2.0.0: 検索結果にキーワード一致理由を表示`
- PR base: `feature/app-3.2.0.0`
- App Validation: run 39451417919、174項目、成功。
- Preview同期: run 39451658748、push起動、Pages反映待機を含め成功。

## Preview確認

- 公開URL: `https://mytemark2.github.io/hado_library-preview/`
- 表示版: `3.2.0.0 Update01 r214`
- Preview repository `main`: `709e1a258ad50d66a068006964e6eb10ece3713a`
- `PREVIEW_SOURCE_COMMIT.txt`: `37361ea7eb7ce3d3f628e948b92afce519fd3f84`
- `PREVIEW_SOURCE_BRANCH.txt`: `feature/app-3.2.0.0`
- `PREVIEW_DISPLAY_VERSION.txt`: `3.2.0.0 Update01 r214`
- 必須ファイル: `index.html`、`hado_formation.js`、`hado_styles.css`、`hadou_*.json`、`.nojekyll`、3 markerをGitHub上で確認。
- 通常検索`結束`: 武将16件、16件すべてに`.search-result-keyword-reason`を表示。LR李典では結束を含む実データ文を表示。
- 名称のみ`LR李典`: `一致理由：名称「LR李典（りてん）」に「LR李典」が一致。`を表示。
- 空検索: キーワード一致理由0件。
- スマートフォン幅: 375pxで`innerWidth=375`、`scrollWidth=360`。一致理由16件を表示し、横はみ出しなし。
- 公開診断: `検証実行結果：OK`、`criticalFailures: 0`、`warnings: 0`、`info: 0`。
- console warning/error: 検索実行後の取得時点で0件。
- 判定: PASS。

## 最小利用者確認操作

通常検索へ任意のキーワードを入力し、結果カードに`一致理由：`と一致語を含む文が表示されることを確認する。

## 残件

なし。次は3.2.0.0 Update02へ進める。正式版mainへの公開は別途承認が必要。

## 確認事項

なし。
