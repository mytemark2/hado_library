# HADO App 3.0.0.0 Update04.2 Scope

## Purpose
Add a vaccine-oriented candidate view and remove zero-match noise from the selected-type candidate browser.

## New type: ワクチン型
Display candidates that satisfy either of the following vaccine-oriented signals:

1. 自部隊不利対策を持つ
   - 自部隊耐性強化
   - 自部隊不利対策
   - 弱化無効
   - 弱化解除
   - 状態変化無効
   - 回避・無効化・解除・無視系の耐性分類

2. 味方への非ダメージ効果を持つ
   - 味方部隊への有利変化付与
   - 味方部隊への弱化解除
   - 味方部隊への状態変化無効
   - 味方部隊への回復
   - 味方部隊への防御・耐性強化
   - ダメージ効果のみの候補は除外

## Candidate browser change
- Exclude candidates whose same-type reference match count is 0.
- Keep the role tab count consistent with the filtered candidate count shown to the user.
- Preserve query filtering after the zero-match exclusion.
- Do not change formation data.
- Do not auto-place candidates.
- Do not bypass attendant, formation, troop type, range, equipment duplication, adviser, five-elements, siege weapon, armament, warhorse, or warhorse-skill gates.

## Regression checks
- ワクチン型候補に自部隊不利対策が含まれる。
- ワクチン型候補に味方への非ダメージ効果が含まれる。
- ダメージ効果のみの候補をワクチン型として加点しない。
- 参考一致数0件の候補を一覧へ表示しない。
- 型候補一覧の特徴チップに `[object Object]` を表示しない。
- 既存の候補表示専用境界を維持する。
