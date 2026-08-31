# 3.1.0.0 r200 手動検証契約の現行UI・起点commit同期 Implementation

## 目的

r199の公開Previewで検出した残る偽陽性3件を修正し、現行UIと3.1開発メタデータを正しく検証する。

## 実装

- ARIA名として存在する「型プリセット」と、部隊編成タブで遅延描画される「新規作成」をページ全体の固定文言検証から除外する。
- 型プリセットは`typeSearchPresetSelect`要素、部隊新規作成は`createNewFormation`関数と既存の編成回帰で欠落検出を維持する。
- `HADO_BUILD_INFO.baseSha256`は旧版の64文字SHA-256と、3.1開発で記録している40文字Git commit SHAの両方を正当なsource revisionとして受理する。
- 39文字、非16進値、未知のボタン状態、対象要素・関数欠落はNGを維持する。

## 外部化判断

既存の検証責務を持つ外部`hado_bootstrap.js`と既存専用回帰を更新する。HTML構造、実データ、検索・編成ロジックは変更しない。
