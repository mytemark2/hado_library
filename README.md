# 覇道ライブラリ

三國志 覇道の情報を検索・確認するための個人開発Webアプリです。

## 現在の公開状況

- 正式版: `3.1.0.0`
- 正式版正本ブランチ: `main`
- 現在の開発ブランチ: `feature/app-3.1.1.0`
- 開発Preview: `3.1.1.0 r205`（検索・詳細・部隊編成・軍馬編成のコピー／共有リンク機能、PC部隊編成メニューの省スペース化）
- 3.1.0.0は正式公開済みです。3.1.1.0はPreview確認中で、正式版には未反映です。
- 配布用ZIPは当面公開しません。

詳細なUpdate計画と進捗は [`docs/updates/roadmap.md`](./docs/updates/roadmap.md) と [`docs/updates/README.md`](./docs/updates/README.md) を参照してください。

## 更新フロー

通常更新は、`main`から作成した開発ブランチの作業ツリーで実ソースを直接修正し、関連ファイルを1つの変更セットとしてコミット・Pull Request化します。

- `updates/queue/*.json` に検索置換命令を置く方式は廃止済みです。
- GitHub Actionsでアプリソースをアドホックに文字列置換する方式は使用しません。
- 3.1.1.0開発ブランチは、開発開始時点の最新`main`から作成しています。

## 公開アプリ

GitHub Pagesで公開中です。正式公開URL: `https://mytemark2.github.io/hado_library/`（source: `main` / `/`）。

## License

個人的かつ非営利の目的に限り、複製、利用、自分用の改修を許可します。

商用利用、再配布、改修版の公開は禁止します。

詳細は [LICENSE](./LICENSE) を参照してください。
