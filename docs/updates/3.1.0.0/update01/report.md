# 3.1.0.0 Update01 Report

## 状態

3.1開発準備完了。Update01本体の全件条件センサスは未着手。

## 今回完了した範囲

- `feature/app-3.1.0.0` 開発ブランチを作成した。
- 起点は `feature/app-3.0.0.0` の最新確認済みCommit `1a5ce523053661c3b8d6a8fc5a295ef620196fe6`。
- 3.1専用開発記録フォルダ `docs/updates/3.1.0.0/` を用意した。
- 3.1全体ロードマップを作成した。
- Update01全件条件センサスの詳細ロードマップを作成した。
- Codexでの標準作業ルール、禁止事項、Preview切替方針を文書化した。

## ロードマップで固定した重要事項

- LR袁紹を唯一の設計基準にしない。
- 武将486・戦法465・技能653・状態変化206を基準に全件監査する。
- 既知キーワード抽出ではなく、全原文から未分類残差を出す方式を採用する。
- Update01完了前にEffectClause/Condition Registryの最終schemaを固定しない。
- `trigger`、`when`、`target`、`effect`、`context`を分離する。
- 基礎値と条件成立値はbase + overrideで表現し、別効果として二重登録しない。
- 原文は証跡として保持し、詳細UIでは折り畳み表示を標準とする。
- 部隊編成の判定は成立/不成立/戦闘中判定/対象外/判定不可の5状態を前提とする。
- 条件判定結果はlocalStorageへ保存せず、編成と最新Clauseから再計算する。
- scoreEvidence切替はUI/構造化と分離し、Update07でshadow比較後に行う。
- 新武将追加時に未知条件を検出できる品質ゲートを3.1完成条件へ含める。

## 未実施

- Update01全件センサス
- Condition Registry正式仕様
- EffectClause正式schema
- クローラー構造化JSON変更
- アプリUI変更
- Preview同期元の3.1ブランチへの切替
- Actions/公開Previewによる3.1機能確認

これらは今回の「開発フォルダとロードマップ準備」の範囲外であり、CodexによるUpdate01以降で実施する。

## Codex開始時の最小確認

Codexは開発開始時に次を確認すること。

1. `feature/app-3.1.0.0` の最新HEAD。
2. `docs/updates/3.1.0.0/roadmap.md`。
3. `docs/updates/3.1.0.0/update01/roadmap.md`。
4. 本`implementation.md`と`report.md`。
5. 最新`hadou_effect_condition_blocks.json`とクローラー生成処理。
6. 最新の全対象JSON件数/hashと既存workflow/Preview同期経路。
