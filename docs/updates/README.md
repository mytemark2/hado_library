# 覇道ライブラリ アプリUpdate記録

開発ブランチ: `feature/app-3.0.0.0`

現在の到達点: `3.0.0.0 Update08.20`

全体計画: [3.0.0.0 全体ロードマップ](roadmap.md)

| Update | 状態 | 概要 | ロードマップ | 実装内容 | 報告 |
|---|---|---|---|---|---|
| Update01 | 完了 | 3.0.0.0基盤・プレビュー確認準備 | [roadmap](update01/roadmap.md) | [implementation](update01/implementation.md) | [report](update01/report.md) |
| Update02 | 完了 | JSON取込監査・派生JSON統合 | [roadmap](update02/roadmap.md) | [implementation](update02/implementation.md) | [report](update02/report.md) |
| Update03 | 改訂完了 | 型編成ナビ・7用途への再整理 | [roadmap](update03/roadmap.md) | [implementation](update03/implementation.md) | [report](update03/report.md) |
| Update04 | 改訂完了 | 9役割の型候補一覧・0件候補除外 | [roadmap](update04/roadmap.md) | [implementation](update04/implementation.md) | [report](update04/report.md) |
| Update05 | 完了 | 部隊別候補トレイ・既存選択ダイアログ委譲 | [roadmap](update05/roadmap.md) | [implementation](update05/implementation.md) | [report](update05/report.md) |
| Update06 | 完了 | 残り4役割接続・9役割すべての候補トレイ導線統一 | [roadmap](update06/roadmap.md) | [implementation](update06/implementation.md) | [report](update06/report.md) |
| Update07 | 完了（最新: 07.6） | 10段階適合スコア・評価ロジック調整・候補一覧の選択状態表示と役割限定条件対応 | [roadmap](update07/roadmap.md) | [implementation](update07/implementation.md) | [report](update07/report.md) |
| Update08 | 完了（最新: 08.20） | 保存データ対応型編成ナビ・新規部隊作成・保存評価・履歴・グループ管理・CSS外部化・単一バージョン定義 | [roadmap](update08/roadmap.md) | [implementation](update08/implementation.md) | [report](update08/report.md) |
| Update09 | 予定 | PC・スマホUI/UXと実用性改善 | [全体計画](roadmap.md#update09-uiux調整と実用性改善) | - | - |
| Update10 | 予定 | 全体回帰・ガイド更新・正式版候補 | [全体計画](roadmap.md#update10-全体回帰ガイド更新正式版候補) | - | - |

## 更新方式

通常更新は、開発ブランチの作業ツリーで実ソースを直接修正し、関連ファイルをまとめて1つの変更セットとしてコミット・Pull Request化する。

`updates/queue/*.json` に検索置換命令を置く方式、GitHub Actions内でアプリソースを文字列置換する方式、Update固有の使い捨て適用スクリプト/Workflowは廃止済みであり、再導入しない。

旧形式の仕様書とJSON報告は `docs/` および `report/` に保持する。今後のUpdateは本ディレクトリ構造で記録する。
