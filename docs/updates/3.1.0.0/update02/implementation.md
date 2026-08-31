# 3.1.0.0 Update02 Implementation

## 状態

正式契約の実装とローカル完了ゲートを完了。GitHub Actionsと公開Previewの最終確認を行う。

## 実装条件

- 正本ブランチ: `feature/app-3.1.0.0`
- 実装起点Commit: `1567e86655e3c5adf0671ed4c67b00451fc8fbee`
- 完了表示版: `3.1.0.0 Update02 r173`
- 推奨・使用エンジン: GPT-5.6 Sol / reasoning high
- `formalRelease: false`を維持し、正式公開・配布用ZIP作成は行わない。

## Condition Registry

`condition-registry.json`へUpdate01 taxonomyと1対1で対応する44型を定義した。各型は`type`、`group`、`phase`、`valueType`、許可comparison、説明を持つ。

評価phaseは次の5区分とする。

- `formation`: 編成情報で判定可能
- `battle`: 戦闘中の事実が必要
- `external`: 任命等の別コンテキスト
- `universal`: 画面をまたいで評価可能
- `metadata`: modifier等の構造情報

## EffectClause 1.0

`effect-clause.schema.json`で次を正式化した。

- context / trigger / whenは`all` / `any` / `not` / `predicate`によるboolean tree。
- target、effect、modifier、limit、reset、priority、suppressionを分離。
- modifier等は`effectId`で親効果へ接続。
- evidenceへsource record/unit、原文、SHA-256を保持。
- trust stateとraw-text fallback policyを保持。
- schema外フィールドは拒否し、自由文patch用フィールドを持たない。

## Evaluator

`hado_condition_model.js`をブラウザ/Node.js両対応の外部モジュールとして追加した。今回はHTMLへ読み込まず、後続consumerが共有できる契約として固定する。

- `evaluateExpression`: AND/OR/NOT/predicate評価
- `evaluateClause`: context、trigger、whenを5状態で評価
- `validateEffectClause`: Registryとの型整合と親構造を検証
- `collectSemanticTypes`: Clauseに含まれる正式typeを列挙

明示的不成立があるANDは、戦闘中条件が同居しても`unmet`とする。任命条件を部隊編成で評価した場合は`not_applicable`、戦闘事実が不足する場合は`deferred`、編成事実が不足する場合は`unknown`とする。

## Gold fixture

Update01の44件を`condition-gold-fixtures.json`へ変換した。全fixtureは元のexpectedSemanticTagsを正式フィールドへ配置し、元record/unit、原文、原文SHA-256を保持する。

`tools/build_update02_condition_contract.js`がRegistry、JSON Schema、gold fixtureを決定的に再生成する。これはUpdate02の仕様fixture生成であり、全ソースデータを解析するUpdate03クローラー生成処理ではない。

## 再発防止

`tools/test_update02_condition_contract.js`で次を検証する。

1. 3成果物の決定的再生成。
2. Update01 taxonomy 44型との完全一致。
3. gold 44件すべてのEffectClause検証。
4. expectedSemanticTagsと構造化typeの完全一致。
5. 自由文patch field不在。
6. 親effectId、evidence SHA、trust/fallbackの整合。
7. met/unmet/deferred/not_applicable/unknownの全状態。
8. AND/OR/NOT優先規則とbase/override identity。

## 互換性

既存`hadou_*.json`、runtime consumer、検索、詳細、部隊編成、保存Export/Import、scoreEvidenceは変更していない。新モデルを`index.html`へ読み込ませていないため、既存動作への実行時影響はない。

## HTML・外部化判断

- `index.html`: asset cache keyを`02-r173`へ同長置換。Git blobサイズ増減0 bytes。
- HTML内JavaScript追加: なし。
- 新規責務: `hado_condition_model.js`と外部Node.js生成・検証ツールへ実装。
