# Preview認証のマージ前検査

## 原因と影響

2026-09-13の定期更新では、収集・ローカル検証・データPRの検証は成功したが、データPRをマージした後に`PREVIEW_REPO_TOKEN`がHTTP 401 `Bad credentials`となった。アプリ開発ブランチだけが更新され、Previewは直前のデータに残った。

分類は外部認証情報の失効と、公開前提条件をマージ後に初めて検査していた工程設計の不備である。データ形式・クローラー取得処理の障害ではない。

## 恒久対策

同一リポジトリの`automation/hado-data-*` Pull Requestに限り、`App Validation / app-validation`で次を読み取り検査する。

- `PREVIEW_REPO_TOKEN`が存在すること。
- `mytemark2/hado_library-preview`へ認証付きでアクセスできること。
- Previewの`deploy-preview.yml`を参照できること。

失敗時はApp Validationを失敗させる。クローラーはApp Validation成功前にデータPRをマージしないため、Previewへ同期不能な状態で正本だけ進めない。検査はPreviewへ書き込まない。

## 運用

トークン交換後は、期限と権限を記録する。必要権限はPreviewリポジトリのContents read/writeとActions read。通常のアプリPR、正式版main、定期処理の曜日条件、正式版承認ゲートは変更しない。

## 受入条件

- 無効または未登録のトークンではcrawler data PRのApp Validationが失敗し、未マージで残る。
- 有効なトークンでは事前検査と既存検証が合格し、従来のイベント駆動Preview同期へ進む。
- 通常のアプリPRには認証検査を要求しない。
- Previewおよび正式版のデータ・表示版・実行コードを本変更で変更しない。
