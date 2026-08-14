# 3.1.0.0 Update01 Implementation

## 状態

未実装。3.1開発基盤とロードマップ文書のみ準備済み。

## 今回の準備作業

- `feature/app-3.0.0.0` の最新HEAD `1a5ce523053661c3b8d6a8fc5a295ef620196fe6` を起点として `feature/app-3.1.0.0` を作成する。
- 3.1専用の開発記録を `docs/updates/3.1.0.0/` 配下へ分離する。
- 全体ロードマップとUpdate01ロードマップを作成し、Codexが実装開始前に読む正本とする。
- Update01ではUI実装を先行せず、全件条件センサスを最優先とする。

## 実装時の原則

- 最新ブランチを正本とし、過去チャット、main、古いPreview、ローカル残骸を修正元にしない。
- 実ファイルを直接修正し、原則1 Commit・1 Pushで反映する。
- 新規責務は外部JSとし、同責務の既存JSへ統合可能なら新規ファイルを増やさない。
- `updates/queue`、`old/new/expectedCount`、Actions内のソース文字列置換、使い捨て適用workflowを使用しない。
- 派生JSONは正規生成処理から再生成し、アプリ側で個別手修正しない。
- Update01の監査結果が揃うまでEffectClause最終schemaを固定しない。
- LR袁紹専用パーサや個別例外で全体仕様を代替しない。

## Update01で今後記録する内容

実装開始後は本書へ次を追記する。

1. 監査ツール/スクリプトの責務と変更ファイル
2. 監査母数と実走査件数
3. 未分類残差と解消方法
4. 現行condition blocksの誤分類/未抽出
5. gold set一覧
6. Condition Registry候補
7. EffectClauseへ必要な表現能力
8. HTML増減と外部化判断
9. ローカル検証結果
10. Actions/Preview結果

## Previewについて

本準備作業では機能ソースを変更しないため、Preview同期元の切替は行わない。

3.1の実装結果をPreviewへ出す最初のUpdateで、最新の`.github/workflows/notify-preview.yml`とPreview repositoryの同期契約を再確認し、同期元を`feature/app-3.1.0.0`へ切り替える。3.0と3.1から同一Previewへ同時に上書きしない。
