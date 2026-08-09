# 覇道ライブラリ

三國志 覇道の情報を検索・確認するための個人開発Webアプリです。

## 現在の開発状況

- 開発中版: `3.0.1.0 Update11.1 r161`
- 開発中正本ブランチ: `feature/app-3.0.0.0`
- 現在の到達点: Update11.1で技能タグを所持武将・所持装備へ関連付ける共通修正を実装しています。
- 次の予定: 次Updateの要件を整理します。配布用ZIPは当面公開しません。

詳細なUpdate計画と進捗は [`docs/updates/roadmap.md`](./docs/updates/roadmap.md) と [`docs/updates/README.md`](./docs/updates/README.md) を参照してください。

## 更新フロー

通常更新は、開発ブランチの作業ツリーで実ソースを直接修正し、関連ファイルを1つの変更セットとしてコミット・Pull Request化します。

- `updates/queue/*.json` に検索置換命令を置く方式は廃止済みです。
- GitHub Actionsでアプリソースをアドホックに文字列置換する方式は使用しません。
- `main` 以外の作業ブランチへのpushで、プレビュー同期通知Workflowが自動実行されます。

## 公開アプリ

GitHub Pagesで公開予定です。

## License

個人的かつ非営利の目的に限り、複製、利用、自分用の改修を許可します。

商用利用、再配布、改修版の公開は禁止します。

詳細は [LICENSE](./LICENSE) を参照してください。
