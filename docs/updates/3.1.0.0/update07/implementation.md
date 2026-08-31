# 3.1.0.0 Update07 Implementation

## 実装方針

- `hado_update07_score_shadow.js`: reviewed EffectClauseを既存`HadoTypeScoreEvidence.normalizeRow`へ渡し、条件状態・identity衝突・評価項目未対応を分類する。
- `hado_formation_condition_evaluator.js`: 評価済み行へ参照元Clauseとeffect identityを保持する。
- `hado_formation.js`: 現行スコア算出後に同じ編成snapshotでshadowを計算し、現行値を変更せず診断と比較表示へ渡す。
- `hado_update07.css`: PC・スマートフォン共通の比較表示。HTML内へJavaScript/CSSを追加しない。
- `index.html`: score本体、既存evidence adapter、Update07 shadow adapterの順で読み込む。

## 重複防止規則

1. 同じeffect identityに複数のreviewed caseがある場合、効果単位を確定できないため全件を`ambiguous_effect_identity`として除外する。
2. 一意なidentityは`identity + effectFamily`で一度だけ採用する。
3. 条件状態が`met`の行だけshadow採点へ渡す。それ以外は理由付きで除外する。
4. Shadow結果は`activeScoreUnchanged: true`を必須とし、現行トータル・保存値へ代入しない。

## 事前監査結果

- reviewed case: 44件
- 一意effect identity: 39件
- identity衝突: 2グループ、7件（LR袁紹4件、司馬昭3件）
- 現行EffectClauseの`effect.kind`は`source_effect`で、個別の評価項目は未構造化。このため一括切替は不可。

## 互換性

保存schema、Export/Import、検索索引、派生JSONの契約は変更しない。現行scoreEvidenceと型スコアを正本として保持し、Update07は比較・診断経路だけを追加する。
