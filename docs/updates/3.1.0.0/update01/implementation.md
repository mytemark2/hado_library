# 3.1.0.0 Update01 Implementation

## 状態

開始準備中。3.1正本・表示版・Preview同期経路をUpdate01へ切り替える。

## 今回の準備作業

- `feature/app-3.0.0.0` の最新HEAD `1a5ce523053661c3b8d6a8fc5a295ef620196fe6` を起点として `feature/app-3.1.0.0` を作成する。
- 3.1専用の開発記録を `docs/updates/3.1.0.0/` 配下へ分離する。
- 全体ロードマップとUpdate01ロードマップを作成し、Codexが実装開始前に読む正本とする。
- Update01ではUI実装を先行せず、全件条件センサスを最優先とする。

## 2026-08-14 Update01開始準備

- 正本ブランチを`feature/app-3.1.0.0`として、`AGENTS.md`、GitHub運用ルール、README、PRマージ準備チェックの既定baseを同期した。
- 表示版を`3.1.0.0 Update01 r171`へ更新し、`hado_version.js`を単一の可視バージョン正本として維持した。
- `HADO_DEV_INFO.json`、`FILE_META`、`HADO_BUILD_INFO`、`index.html`のasset cache keyをUpdate01開始版へ同期した。
- `.github/workflows/notify-preview.yml`の唯一の許可元を`feature/app-3.1.0.0`へ変更し、3.0系とCodex作業ブランチからのPreview上書きを禁止した。
- scheduleや`workflow_dispatch`は追加せず、正本ブランチへのpushを契機とするイベント駆動同期を維持した。
- Preview repositoryの旧`.github/workflows/sync-preview.yml`は3.0正本を固定取得していたため、GitHub上で`disabled_manually`へ変更した。Pages配信を担当する`Deploy Hado Library Preview`はactiveのまま維持した。
- HTMLへ機能実装やインラインJavaScriptは追加していない。asset cache key短縮により、Git blobとしての`index.html`は29,327 bytesから29,267 bytesへ60 bytes減少する。
- `python -X utf8 tools/run_app_validation.py`を実行し、133/133 commands成功を確認した。3.1でUpdate番号が`01`へ戻るため、旧Update11/Update09の機能回帰テストは過去の番号大小比較ではなく、現在版と機能契約を検証するよう更新した。

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

Update01開始準備で、Preview同期元を`feature/app-3.1.0.0`へ切り替える。3.0と3.1から同一Previewへ同時に上書きしない。

この切替は正本ブランチへ反映されたpushから有効になる。Actions、Preview repository marker、公開Pagesの一致は反映後に確認する。
