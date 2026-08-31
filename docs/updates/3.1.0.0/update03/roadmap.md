# 3.1.0.0 Update03 Roadmap — クローラー構造化JSON生成

## 目的

Update02で確定したEffectClause 1.0、44分類、44ゴールドケースを、クローラーの正規生成経路から4正本データセット全件へ決定的に適用する。

## 実装条件

- 正本ブランチ: `feature/app-3.1.0.0`
- 実装起点Commit: `9712fabf37511bf23db8806415917aa93325ce11`
- 完了表示版: `3.1.0.0 Update03 r174`
- 推奨・使用エンジン: GPT-5.6 Sol / reasoning High
- `formalRelease: false`を維持し、正式公開・本番昇格は行わない。

## 実施内容

1. 武将486、戦法465、技能653、状態変化206、計1,810件を正本として走査する。
2. 条件・文脈・トリガー・効果・補正・制限・リセット・抑制・対象指定をEffectClauseへ親子付けする。
3. Clauseごとに生本文、source record/unit、source locator、SHA-256、trust stateを保持する。
4. 親のない条件等は削除せず、生本文フォールバックClauseとして追跡可能にする。
5. 未分類、無効Clause、最終孤立、重複効果ID、固定値上書き候補を自動監査する。
6. 既存20派生JSONと新規JSONを一回の生成処理で21件一括反映する。

## 構成判断

既存 `hadou_effect_condition_blocks.json` は3.0系互換用として維持する。EffectClauseは新規 `hadou_effect_clauses.json` を3.1系正本層とし、Update03では起動時に読み込ませない。Update04から必要なレコード単位で詳細表示へ接続する。

## 完了ゲート

- 同一入力の2回生成がバイト単位・SHA-256で一致する。
- 正本1,810件、EffectClause 24,329件を収録する。
- 未分類、無効Clause、最終孤立条件・トリガー・効果、重複効果IDが0件である。
- 44ゴールドケースが全件対応する。
- 21派生JSON契約、全App Validation、Actions、公開Preview、marker一致が合格する。
