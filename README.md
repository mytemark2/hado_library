# 覇道ライブラリ

三國志 覇道の情報を検索・確認するための個人開発Webアプリです。

## 現在の開発状況

- 直前の開発完了版: `3.0.2.0 r170`
- 開発中正本ブランチ: `feature/app-3.1.0.0`
- 現在の到達点: `3.1.0.0 Update06 r185`でr184の表示改善を維持し、2026-08-23に取得完了したクローラーデータから武将2・装備2・技能8・陣形1を安全に復旧しました。
- Update07のClause Shadowは完了済みで、現行スコアを表示上の正本に維持しています。Update06完了後はUpdate08へ進み、全Update完了までは正式公開・配布用ZIP作成を行いません。

詳細なUpdate計画と進捗は [`docs/updates/roadmap.md`](./docs/updates/roadmap.md) と [`docs/updates/README.md`](./docs/updates/README.md) を参照してください。

## 更新フロー

通常更新は、開発ブランチの作業ツリーで実ソースを直接修正し、関連ファイルを1つの変更セットとしてコミット・Pull Request化します。

- `updates/queue/*.json` に検索置換命令を置く方式は廃止済みです。
- GitHub Actionsでアプリソースをアドホックに文字列置換する方式は使用しません。
- 正本の`feature/app-3.1.0.0`へのpushで、プレビュー同期通知Workflowが自動実行されます。

## 公開アプリ

GitHub Pagesで公開予定です。

## License

個人的かつ非営利の目的に限り、複製、利用、自分用の改修を許可します。

商用利用、再配布、改修版の公開は禁止します。

詳細は [LICENSE](./LICENSE) を参照してください。
