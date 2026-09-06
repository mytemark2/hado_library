# 3.1.1.0 完了報告

## 状態

実装、ローカル検証、開発ブランチへのPush、Preview同期を完了した。

## 実装結果

- 検索結果: 一覧コピー、検索リンクコピー
- 内容詳細: 詳細データコピー、項目リンクコピー
- 部隊編成: 編成共有コピー、新規部隊作成リンクコピー
- 軍馬編成: 軍馬共有コピー、新規軍馬作成リンクコピー

## 安全性

- 部隊・軍馬の共有リンクは、確認後に新規データを追加する。
- 既存の部隊、軍馬、軍馬配置を上書きしない。
- 不足データは未設定にして利用者へ表示する。
- 起動時のデータ読込が完了してから共有リンクを解釈する。

## 検証結果

- 総合検証: `python -X utf8 tools/run_app_validation.py` 165/165合格
- 追加契約検証: 8機能、単一GETパラメータ、圧縮・非圧縮往復、追加専用インポートを確認
- 最新`main`との統合検証: base `2594e936ddcdb1b21a6242035ebffa4e3a0a1df5`、競合なし
- 実装Commit: `44065dac28b2e40bbfdabf8e32c2f4f6ee13842d`
- GitHub Actions: `Notify Hado Library Preview` run `33768486427` 成功
- 同期処理: Previewリポジトリへ必要なHTML、JS、CSS、20系統の派生JSON、マーカーを一括同期し、SHA-256を照合
- 公開マーカー: Actions内の実HTTP確認で source `44065dac28b2e40bbfdabf8e32c2f4f6ee13842d`、version `3.1.1.0 r204`、JSON bundle一致
- PC操作: 検索条件付き一覧コピー、検索リンク復元、詳細コピー、項目リンク、部隊共有、新規部隊追加を確認
- スマートフォン表示: 総合回帰のレスポンシブ契約および共有操作列の折返しを確認
- デバッグログ: ローカル実ブラウザ確認でJavaScriptエラーなし

## 利用者確認

Previewで、検索・詳細・部隊編成・軍馬編成の各コピー名と出力内容を確認する。部隊・軍馬リンクは、確認画面で既存データを変更せず新規追加される旨を確認してから実行する。

## 2026-09-06 データ件数固定の検証修正

変更は`tools/test_3_1_0_0_tag_search_exhaustive.js`と本リリースの開発記録のみ。新取得データの交戦開始時対象は106件で、従来の105固定が誤検知していた。元データの明示マーカーとの全件一致を維持し、旧データ105件・新データ106件とも`python -X utf8 tools/run_app_validation.py`の全165コマンドが合格。新取得runは`2026-09-06T04-28-19-226Z`、基点は`a8da10e9d22ccd77c26f5d552c66be92818cd4f9`。ランタイム・版表示・JSONスキーマは変更しない。HTML差分0 bytes。利用者の追加操作は不要。

## 未解決事項

- なし。

## r205 PC部隊編成レイアウト修正

- 修正Commit: `954c996b0fa51f93810bc1cb8090e885d488161f`
- 総合検証: `python -X utf8 tools/run_app_validation.py` 165/165合格
- 最新`main`との統合検証: base `2594e936ddcdb1b21a6242035ebffa4e3a0a1df5`、競合なし
- GitHub Actions: `Notify Hado Library Preview` run `33957376421` 成功
- Preview repository: `e51ebac1f2c0cf09a7d379a218190c44b6690188`
- 公開マーカー: source `954c996b0fa51f93810bc1cb8090e885d488161f`、branch `feature/app-3.1.1.0`、version `3.1.1.0 r205`
- PC 1917×964: コピー操作を部隊編成メニュー行の右端へ統合し、編集領域の下端まで内部スクロールで到達できることを確認
- スマートフォン 390×844: 両コピー操作を表示し、横方向のはみ出しなし
- HTMLサイズ: Git blob 28,976 bytesから変更なし。DOM構造は増やさず、外部JavaScript/CSSのみを修正
- Debug Log: 公開Previewでerror/warnなし
- 未解決事項: なし
