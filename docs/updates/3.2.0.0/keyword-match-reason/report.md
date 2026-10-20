# 3.2.0.0 割込み — キーワード一致理由表示 Report

## 状態

ローカル実装・回帰検証完了。PR・Preview結果は反映後に追記する。

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

## 残件

- PR作成、CI、自動Preview同期、公開URLでの一致理由表示確認。

## 確認事項

なし。
