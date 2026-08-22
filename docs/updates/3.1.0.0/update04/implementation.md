# 3.1.0.0 Update04 Implementation

## 構成

- `hado_detail_condition_presenter.js`: reviewed caseの条件ラベル、効果行、原文折り畳み、generated-onlyフォールバックを生成する。
- `hado_formation_condition_evaluator.js`: 詳細と編成で共有するentity単位のreviewed/generated索引APIを提供する。
- `hado_core.js`: 武将の戦法・技能、技能詳細へpresenterを接続する。
- `hado_formation.js`: 状態変化詳細へpresenterを接続する。
- `hado_update04.css`: PC/スマホ共通の外部CSS。HTML内へJavaScript/CSSを追加しない。

## 表示方針

- 条件チップと効果を同じ行に表示する。
- semantic typeは補助チップとして表示し、意味と正式typeを追跡できるようにする。
- LR袁紹の戦法は、常時2行、主将時の魁威、主将かつ兵力50%以上の700%を分離する。
- reviewed caseの原文は`details`でデフォルト閉じる。
- generated-only条件は既存原文を消さず、未確認である旨を表示する。

## 互換性

表示専用の派生modelであり、保存データ、Export/Import、検索索引、編成保存schemaは変更しない。Update05の部隊編成条件評価UIとCSSも保持する。
