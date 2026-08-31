# 3.1.0.0 r202 検索結果一覧背景の視認性調整 Implementation

## 変更内容

検索結果一覧コンテナ`.results`の背景を、既存の選択状態にも使う淡い青`#eff6ff`へ変更する。

## 非変更範囲

- 各検索結果カード`.results li`は白`#fff`のまま維持する。
- 選択状態`.results li.active`、ホバー状態、検索ロジック、JSON、CSS以外の画面は変更しない。

## 外部化判断

既存の`hado_styles.css`だけを変更する。HTML構造やJavaScriptは追加しない。
