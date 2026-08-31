# 覇道ライブラリ

三國志 覇道の情報を検索・確認するための個人開発Webアプリです。

## 現在の公開状況

- 正式版: `3.1.0.0`
- 正式版正本ブランチ: `main`
- 現在の開発ブランチ: なし（次回開発開始時に`main`から新規featureブランチを作成）
- 3.1.0.0のUpdate01〜Update10、最終調整、全体回帰、Preview確認を完了し、正式版へ反映しました。
- 配布用ZIPは当面公開しません。

詳細なUpdate計画と進捗は [`docs/updates/roadmap.md`](./docs/updates/roadmap.md) と [`docs/updates/README.md`](./docs/updates/README.md) を参照してください。

## 更新フロー

通常更新は、`main`から作成した開発ブランチの作業ツリーで実ソースを直接修正し、関連ファイルを1つの変更セットとしてコミット・Pull Request化します。

- `updates/queue/*.json` に検索置換命令を置く方式は廃止済みです。
- GitHub Actionsでアプリソースをアドホックに文字列置換する方式は使用しません。
- 次回開発ブランチは、開発開始時点の`main`から作成します。

## 公開アプリ

GitHub Pagesで公開中です。正式公開URL: `https://mytemark2.github.io/hado_library/`（source: `main` / `/`）。

## License

個人的かつ非営利の目的に限り、複製、利用、自分用の改修を許可します。

商用利用、再配布、改修版の公開は禁止します。

詳細は [LICENSE](./LICENSE) を参照してください。
