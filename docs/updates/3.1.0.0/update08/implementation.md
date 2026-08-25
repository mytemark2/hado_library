# 3.1.0.0 Update08 Implementation

## 実装方針

- `hado_clause_surface_bridge.js`を画面投影の単一窓口とし、Update04/05/06のPresenter、Evaluator、検索統合を再利用する。
- 共通投影はClause ID、case ID、条件、意味型、対象scope、効果identity、原文、原文SHA-256を保持する。内部IDは診断だけに使い、利用者画面へ表示しない。
- 部隊編成は1回生成した共通投影を条件タブ、型評価shadow、結果サマリーで共有する。
- 結果サマリーはClauseに結び付いた加算根拠だけ5状態を表示する。`source_defined`のような内部的な対象名は表示しない。
- 通常検索・状態変化検索・型検索は既存の検索結果と絞り込みを変えず、共通投影から条件タグ・正規状態変化・Clause参照を受け取る。

## スコア切替境界

現行44件のreviewed Clauseは、対象がすべて`source_defined`、効果が`source_effect`であり、数値加点へ安全に変換できない。Update07の判定どおり現行スコア値を正本に維持し、共通Evaluatorの判定結果をshadow根拠として共有する。Update08ではスコア合計、加点規則、候補順位を変更しない。

## 互換性

- JSON、crawler、保存schema、Export/Importを変更しない。
- localStorageへ条件判定を保存しない。
- 通常検索、状態変化検索、型検索の既存フォールバックを維持する。
- `file://`と`https://`の読み込み順を維持する。

## 外部化

共通処理は`hado_clause_surface_bridge.js`、表示差分は`hado_update08.css`へ分離する。`index.html`は外部資産の読込と`08-r188`キャッシュキーだけを変更し、インライン実装を追加しない。

## 事前監査

- reviewed Clause: 44件 / 14項目。
- 画面投影の不一致: 0件。
- LR袁紹: 5 Clause。詳細・検索・共通投影で5件一致。
- JSON再生成・再取得: なし。
- `HADO_DEV_INFO.json`: 表示版の重複を避けるため変更しない。
