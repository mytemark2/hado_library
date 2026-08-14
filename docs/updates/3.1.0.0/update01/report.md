# 3.1.0.0 Update01 Report

## 状態

3.1 Update01開始準備を実施中。全件条件センサス本体は未着手。

## 今回完了した範囲

- `feature/app-3.1.0.0` 開発ブランチを作成した。
- 起点は `feature/app-3.0.0.0` の最新確認済みCommit `1a5ce523053661c3b8d6a8fc5a295ef620196fe6`。
- 3.1専用開発記録フォルダ `docs/updates/3.1.0.0/` を用意した。
- 3.1全体ロードマップを作成した。
- Update01全件条件センサスの詳細ロードマップを作成した。
- Codexでの標準作業ルール、禁止事項、Preview切替方針を文書化した。
- 3.1開発の表示版を`3.1.0.0 Update01 r171`として開始する。
- Preview通知Workflowの唯一の同期元を`feature/app-3.1.0.0`へ切り替える。
- リポジトリ内の正本ブランチ記載とPRマージ準備チェックの既定baseを3.1へ揃える。
- 全App Validationは133/133 commands成功した。
- Preview repositoryで3.0正本を固定取得する旧同期Workflowを`disabled_manually`へ変更し、Pages配信Workflowはactiveのまま維持した。
- `index.html`は機能DOMを変更せず、asset cache key更新によりGit blobで60 bytes減少した。新規インラインJavaScriptは追加していない。

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
- Update01全件センサスの成果に基づく3.1機能実装

これらは今回の「3.1 Update01開始準備」の範囲外であり、以後のUpdate01実装で実施する。

## 開始準備の確認項目

- [x] 全App Validation（133/133 commands）
- [ ] PRのbaseが`feature/app-3.1.0.0`
- [ ] GitHub ActionsのApp Validation成功
- [ ] `Notify Hado Library Preview`成功
- [ ] Preview repositoryのsource branch/commit/display version marker一致
- [ ] 公開Previewの`3.1.0.0 Update01 r171`表示

## Codex開始時の最小確認

Codexは開発開始時に次を確認すること。

1. `feature/app-3.1.0.0` の最新HEAD。
2. `docs/updates/3.1.0.0/roadmap.md`。
3. `docs/updates/3.1.0.0/update01/roadmap.md`。
4. 本`implementation.md`と`report.md`。
5. 最新`hadou_effect_condition_blocks.json`とクローラー生成処理。
6. 最新の全対象JSON件数/hashと既存workflow/Preview同期経路。
