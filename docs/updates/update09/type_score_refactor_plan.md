# Update09 Phase5 型評価スコア再設計メモ

## 目的

Update09 Phase5 の型評価スコアは、現行コード上では一定のガードを持つが、判定ルールが `hadou_type_score_rules.json`、`hado_type_score.js`、`hado_type_score_evidence.js`、および `docs/updates/update09/hadou_type_score_judgement_table.draft.json` に分散している。

本ドキュメントは、型評価スコアを **デグレしにくい表駆動実装** に移行するための正本設計を整理する。

## 現行コード解析結果

### 1. `hadou_type_score_rules.json`

現行の型スコア正本候補。以下を保持している。

- 型一覧: 16型
- 各型の metric: 原則5項目
- scoring policy: 重みなし、型充足度なし、技能Lv点なし、兵力は含める
- source counts: 武将476、戦法455、技能620、状態変化200、装備238、陣形21、五行10、軍馬技能27、異文化調査技能32 など

ただし、このファイルは **型 → 評価metric** までしか持たない。
以下は持っていない。

- 評価metricに紐づく changeItem 正本
- P/S/X（Primary / Support / Deny）
- targetPolicy
- dependency rule
- 実データ上の戦法名・状態変化名・技能名
- 同一起源の代表化ポリシー

### 2. `hado_type_score.js`

現行の実行時判定本体。

主な役割:

- `METRIC_ALIASES` による文字列alias定義
- `METRIC_MATCH_SPECS` による対象scope・除外alias・effectKind定義
- `VACCINE_BUCKETS`、`SELF_DISADVANTAGE_BUCKETS`、`NON_DAMAGE_BUCKETS` による分類
- `metricCategoryGate()` によるカテゴリdeny
- `scoreEvidenceOrigin()` による派生/集計除外
- `targetMatches()` による targetScope 判定
- `dedupeBreakdownRows()` による同一起源の代表化

問題点:

- 判定ルールがJSにハードコードされており、表として監査しにくい
- 型ごとの例外やdenyがJSに増えやすい
- `self` と `ally` の相互許容が全体ロジックにあり、型ごとの対象ポリシーと分離しにくい
- `vaccine_protective_support` など過去互換の広い分類が残ると、ワクチン型へ防御/回復/属性耐性が混入する余地がある
- Supportだけで高評価になる問題を型横断で検証しにくい

### 3. `hado_type_score_evidence.js`

Update09.5.22 で追加された正規化層。

主な役割:

- 戦法・技能・状態変化・装備・五行・軍馬などの効果を `scoreEvidence` へ正規化
- `effectFamily` と `effectKind` を付与
- `sourceType`、`sourceLabel`、`targetScope`、`targetCount`、`timing`、`duration`、`rawText` を保持
- `isPrimaryEffect`、`isDerivedTag`、`isAggregateMetric` を持たせる
- 変化率集計、結果サマリー、派生タグ、検索タグ、関連リンクタグを採点根拠から除外できる形にする

この層は必要。ただし、現時点では `hado_type_score.js` の採点ロジックと完全統合されていない。

### 4. `docs/updates/update09/hadou_type_score_judgement_table.draft.json`

設計ドラフトとして、次の原則を持つ。

- 評価スコアはタグ一致ではなく `scoreEvidence` を入力にする
- 型要素、検索タグ、関連リンクタグ、変化率集計、結果サマリー、パラメータ集計は直接加点しない
- `targetScope` は必要条件であり、十分条件ではない
- primary が0なら support だけで高得点にしない
- 同一起源の効果は `evidenceGroupKey` で代表化する

この方向性は正しい。ただし、実行時正本ではなく docs 配下の draft であり、現行判定の完全な置き換えにはなっていない。

## 結論

現行仕様はベストではない。

理由は、判定ルールが表ではなく、複数のJSONとJSロジックに分散しているため。
今後は、次の **表駆動4層構造** に移行する。

```text
source master data
  ↓
scoreEvidence
  ↓
hadou_effect_change_item_catalog.json
  ↓
hadou_type_score_judgement_table.json
  ↓
hadou_type_score_trigger_catalog.json
  ↓
score result / score breakdown / UI tags
```

## 正本ファイル構成

### 1. `hado_type_score_evidence.js`

役割: 実データの一次効果を共通形式へ正規化する。

必須フィールド:

| field | 内容 |
|---|---|
| evidenceId | 安定ID |
| sourceType | tactic / skill / statusEffect / equipment / formation / fiveElement / warhorseSkill / ethnicResearchSkill など |
| sourceId | 元データIDまたは名称 |
| sourceLabel | 表示名 |
| sourceSlot | main / vice1 / support1 / equipment / formation / fiveElement など |
| timing | always / tactic_activated / combat_start / on_attack / on_damaged / on_chain / on_garrison / conditional |
| conditionText | 発動条件本文 |
| targetScope | self / ally / enemy / unknown |
| targetCount | 対象部隊数。なければ null |
| effectKind | buff / debuff / recovery / defense / disadvantage_counter / gauge / chain / range / anti_object / survival / buff_protection / utility |
| effectFamily | attack_up / weakening_remove / tactic_speed などの正規化family |
| value | 効果量 |
| unit | % / count / second / presence / unknown |
| duration | 効果時間秒 |
| isPrimaryEffect | 一次効果かどうか |
| isDerivedTag | 派生タグかどうか |
| isAggregateMetric | 変化率集計・結果サマリーかどうか |
| evidenceGroupKey | 同一起源dedupeキー |
| rawText | 根拠本文 |

### 2. `hadou_effect_change_item_catalog.json`

役割: `effectFamily` を、表示・評価に使う `changeItem` へ正規化する。

例:

```json
{
  "changeItemId": "weakening_remove",
  "label": "弱化解除",
  "category": "不利対策",
  "effectFamilies": ["weakening_remove"],
  "aliases": ["弱化解除", "弱化効果解除", "弱化効果を解除", "弱化効果を打ち消す"],
  "displayNormalizeTo": "弱化解除",
  "dedupeGroup": "weakening_remove"
}
```

このカタログで、以下を統合する。

- 弱化無効 / 弱化効果無効
- 弱化解除 / 弱化効果解除 / 弱化効果を打ち消す
- 通常攻撃対象数 / 通常攻撃対象部隊数
- 連鎖率 / 連鎖確率
- 負傷兵生存 / 負傷兵として生存する兵数
- 状態変化無効 / 不利変化無効 / 不利状態無効

### 3. `hadou_type_score_judgement_table.json`

役割: 型ごとの P/S/X 判定を表として保持する。

必須フィールド:

| field | 内容 |
|---|---|
| typeId | 型ID |
| typeName | 型名 |
| scoreMetricId | 評価スコアID |
| scoreMetricLabel | 評価スコア表示名 |
| scoreRole | P / S / X |
| changeItems | 対象changeItem |
| allowedTargets | self / ally / enemy / unknown |
| allowedSourceTypes | tactic / skill / statusEffect / equipment / formation / fiveElement / warhorseSkill / ethnicResearchSkill |
| allowedTiming | always / tactic_activated / combat_start など |
| dependency | Supportだけで高評価にしない等の条件 |
| denyChangeItems | 混入禁止changeItem |
| dedupePolicy | 同一起源代表化ルール |
| note | 監査用説明 |

scoreRole の意味:

| scoreRole | 意味 |
|---|---|
| P | Primary。型成立の中核 |
| S | Support。Pがある場合だけ補助加点 |
| X | Deny。該当型では混入禁止 |

### 4. `hadou_type_score_trigger_catalog.json`

役割: 正本JSONから生成した、実データ上の対象名カタログ。

生成元:

- `hadou_tactics.json`
- `hadou_status_effects.json`
- `hadou_skills.json`
- `hadou_equipments.json`
- `hadou_formations.json`
- `hadou_five_elements.json`
- `hadou_warhorse_skills.json`
- `hadou_ethnic_research_skills.json`

出力フィールド:

| field | 内容 |
|---|---|
| typeId | 型ID |
| typeName | 型名 |
| scoreRole | P / S / X |
| scoreMetricId | 評価スコアID |
| scoreMetricLabel | 評価スコア名 |
| changeItemId | 変化項目ID |
| changeItemLabel | 変化項目名 |
| triggerSourceType | 戦法 / 状態変化 / 技能 / 装備 / 陣形 / 五行 / 軍馬技能 / 異文化調査技能 |
| targetName | 戦法名・状態変化名・技能名など |
| targetScope | self / ally / enemy / unknown |
| targetCount | 対象数 |
| timing | 発動タイミング |
| matchedAlias | 一致したalias |
| rawText | 根拠本文 |
| sourceFile | 元JSON |
| sourceId | 元ID |

このファイルは手書き禁止。必ず generator で再生成する。

## 型別 judgement matrix 正本案

| typeId | 型名 | scoreRole | scoreMetric | changeItems | allowedTargets | triggerSourceTypes | dependency / deny |
|---|---|---|---|---|---|---|---|
| calm | 鎮静型 | P | 弱化無効・回避 | weakening_nullify, weakening_avoid | self, ally | tactic, skill, statusEffect, equipment, fiveElement, warhorseSkill | enemy deny / derived deny / aggregate deny |
| calm | 鎮静型 | P | 弱化解除 | weakening_remove | self, ally | tactic, skill, statusEffect, equipment, fiveElement | 土行は許可。火行は不可 |
| calm | 鎮静型 | P | 強化維持 | buff_protection | self, ally | tactic, skill, statusEffect, equipment | 強化解除回避/強化奪取回避 |
| calm | 鎮静型 | S | 兵力 | troops_up | self | skill, equipment, formation, warhorseSkill, ethnicResearchSkill | Pが0なら高評価にしない |
| zombie | ゾンビ型 | P | 壊滅回避 | annihilation_avoidance | self, ally | tactic, skill, equipment, warhorseSkill | firepower only deny |
| zombie | ゾンビ型 | P | 残存兵力 | remaining_troops | self, ally | tactic, skill, equipment | firepower only deny |
| zombie | ゾンビ型 | P | 回復・負傷兵回復 | wounded_recovery, healing, continuous_healing | self, ally | tactic, skill, equipment, statusEffect | enemy deny |
| zombie | ゾンビ型 | S | 被ダメージ軽減・耐性 | damage_reduction, attribute_resistance | self, ally | tactic, skill, equipment, formation, fiveElement, warhorseSkill | Pが0なら高評価にしない |
| bomb | 爆弾型 | P | 対物特効 | anti_object_up | self, ally | tactic, skill, equipment, formation, warhorseSkill | anti_objectなしの火力だけは高評価禁止 |
| bomb | 爆弾型 | P | 撃心火力 | critical_tactic_rate_up, critical_tactic_power_up, tactic_power_up | self, ally | tactic, skill, statusEffect, equipment | 会心と撃心を混同しない |
| bomb | 爆弾型 | S | 戦法回転 | tactic_speed, initial_tactic_gauge | self, ally | skill, equipment, formation, warhorseSkill | Pが0なら高評価にしない |
| critical_tactic | 撃心型 | P | 撃心発生・威力 | critical_tactic_rate_up, critical_tactic_power_up | self, ally | tactic, skill, statusEffect, equipment | 会心系deny |
| critical_tactic | 撃心型 | P | 戦法威力 | tactic_power_up | self, ally | tactic, skill, statusEffect, equipment, warhorseSkill | Pが0なら速度/兵力だけ高評価禁止 |
| critical_normal | 会心型 | P | 会心発生・威力 | critical_rate_up, critical_power_up | self, ally | tactic, skill, statusEffect, equipment, warhorseSkill | 撃心系deny |
| critical_normal | 会心型 | P | 通常攻撃火力 | normal_attack_power_up | self, ally | tactic, skill, statusEffect, equipment | tactic only deny |
| critical_normal | 会心型 | S | 攻撃速度・対象数 | attack_speed_up, normal_attack_target_count_up | self, ally | tactic, skill, statusEffect, equipment, warhorseSkill | Pが0なら高評価にしない |
| tactic_speed | 戦法速度型 | P | 戦法速度・短縮 | tactic_speed, tactic_reduction | self, ally | skill, equipment, formation, warhorseSkill | 攻撃速度と混同禁止 |
| tactic_speed | 戦法速度型 | P | 初動ゲージ | initial_tactic_gauge, combat_start_tactic_gauge | self, ally | skill, equipment, formation, fiveElement | 火力だけdeny |
| tactic_speed | 戦法速度型 | S | 連鎖率・兵力 | chain_rate, troops_up | self | skill, equipment, formation, warhorseSkill | Pが0なら高評価にしない |
| attack_speed | 攻撃速度型 | P | 攻撃速度 | attack_speed_up | self, ally | tactic, skill, statusEffect, equipment, warhorseSkill | 戦法速度と混同禁止 |
| attack_speed | 攻撃速度型 | S | 通常攻撃拡張 | normal_attack_target_count_up, normal_attack_power_up, critical_rate_up, range_up | self, ally | tactic, skill, statusEffect, equipment, formation | Pが0なら高評価にしない |
| normal_attack | 通常攻撃拡張型 | P | 通常攻撃対象・射程 | normal_attack_target_count_up, range_up | self, ally | tactic, skill, statusEffect, equipment, formation | attack_speedだけでは高評価禁止 |
| normal_attack | 通常攻撃拡張型 | S | 通常攻撃補助 | normal_attack_power_up, attack_speed_up, troops_up | self, ally | tactic, skill, statusEffect, equipment, formation | Pが0なら高評価にしない |
| debuff | デバフ型（基礎） | P | 敵デバフ本体 | enemy_attack_down, enemy_defense_down, tactic_delay, chain_nullify_to_enemy | enemy | tactic, skill, statusEffect | self/ally deny |
| debuff | デバフ型（基礎） | S | 状態変化発生率 | status_effect_rate | self, ally | skill, equipment, tactic | デバフ本体が0なら高評価禁止 |
| anti_object | 対物型 | P | 対物特効 | anti_object_up | self, ally | tactic, skill, statusEffect, equipment, formation, warhorseSkill | 対物特効なしの火力だけ高評価禁止 |
| anti_object | 対物型 | S | 火力・速度 | tactic_power_up, normal_attack_power_up, attack_speed_up, troops_up | self, ally | tactic, skill, statusEffect, equipment, warhorseSkill | Pが0なら高評価にしない |
| annihilation | 汎用火力型 | P | 戦法/撃心/会心威力 | tactic_power_up, critical_tactic_power_up, critical_power_up | self, ally | tactic, skill, statusEffect, equipment | 防御/回復only deny |
| annihilation | 汎用火力型 | S | 攻撃速度・兵力 | attack_speed_up, troops_up | self, ally | tactic, skill, statusEffect, equipment, warhorseSkill | 参考型。過大評価禁止 |
| buff_support | バフ支援型 | P | 味方バフ配布 | attack_up, defense_up, intelligence_up, tactic_power_up, normal_attack_power_up, attack_speed_up, critical_rate_up, critical_power_up, normal_attack_target_count_up | self, ally | tactic, skill, statusEffect, equipment | enemy deny。自部隊のみは部分点 |
| buff_support | バフ支援型 | S | 配布性能 | ally_target_count, effect_duration, initial_tactic_gauge, tactic_speed, buff_protection | self, ally | tactic, skill, statusEffect, equipment, formation | buff本体が0なら高評価禁止 |
| debuff_interference | デバフ妨害型 | P | 敵デバフ配布 | enemy_attack_down, enemy_defense_down, enemy_anti_object_down, tactic_delay, chain_nullify_to_enemy, confuse, fear, severance, isolation | enemy | tactic, skill, statusEffect | enemy必須 |
| debuff_interference | デバフ妨害型 | S | 妨害性能 | enemy_target_count, effect_duration, status_effect_rate, tactic_speed | enemy, self | tactic, skill, statusEffect, equipment | デバフ本体が0なら高評価禁止 |
| wall_defense | 城壁防衛型 | P | 防衛primary | enemy_anti_object_down, damage_reduction, wounded_recovery | self, ally, enemy | tactic, skill, statusEffect, equipment, formation, fiveElement | 敵対物低下はenemy、耐久/回復はself/ally |
| wall_defense | 城壁防衛型 | S | 通常攻撃妨害 | normal_attack_target_count_up, attack_speed_up | self, ally | tactic, skill, statusEffect, equipment | primaryが0なら高評価禁止 |
| garrison_support | 駐屯支援型 | P | 駐屯支援primary | enemy_anti_object_down, ally_wounded_recovery, defense_up | ally, enemy | tactic, skill, statusEffect, equipment | 味方回復/防御、敵対物低下を優先 |
| garrison_support | 駐屯支援型 | S | 初動/回転 | combat_start_tactic_gauge, tactic_speed | self, ally | skill, equipment, formation | primaryが0なら高評価禁止 |
| vaccine | ワクチン型 | P | 弱化無効・回避 | weakening_nullify, weakening_avoid | self, ally | tactic, skill, statusEffect, equipment | 防御/回復/属性耐性/ゲージdeny |
| vaccine | ワクチン型 | P | 弱化解除 | weakening_remove | self, ally | tactic, skill, statusEffect, equipment, fiveElement | 土行は許可。火行はdeny |
| vaccine | ワクチン型 | P | 状態異常・制御対策 | status_nullify, status_remove, severance_counter, isolation_counter, chain_nullify_counter, control_counter | self, ally | tactic, skill, statusEffect, equipment | enemy deny |
| vaccine | ワクチン型 | P/S | 強化維持 | buff_protection | self, ally | tactic, skill, statusEffect, equipment, fiveElement | 木行はバフ維持として支援。防御/回復とは別 |
| vaccine | ワクチン型 | X | 混入禁止 | defense_up, healing, wounded_survival, attribute_resistance, tactic_gauge, attack_speed_up, tactic_power_up, normal_attack_target_count_up | self, ally | any | ワクチン型に加点しない |

## 採点アルゴリズム契約

実装時は次の順序を固定する。

```text
1. buildFormationScoreEvidence()
2. isAggregateMetric / isDerivedTag / isPrimaryEffect を確認し、採点対象外を除外
3. effectFamily を changeItem に正規化
4. hadou_type_score_judgement_table.json の P/S/X と targetPolicy を照合
5. X に該当する evidence は該当型から除外し、必要なら診断に出す
6. evidenceGroupKey で同一起源を代表化
7. Primary score を計算
8. Primary が0の場合、Support は高評価へ使わない
9. Support score を計算
10. score breakdown に sourceLabel / rawText / targetScope / timing / matchedAlias を必ず出す
```

## 実装禁止事項

- `hado_type_score.js` に型ごとの巨大aliasや例外ifを追加し続けること
- 結果サマリー/変化率集計を直接採点すること
- 関連リンクタグ・検索タグ・型要素を直接採点すること
- `targetScope` だけで加点可否を決めること
- self/allyを全型で機械的に相互許容すること
- Supportだけで高評価にすること
- 同一rawText由来の別名を複数回加点すること

## 必須テスト

| test | 内容 |
|---|---|
| schema test | 3つの正本JSONの必須フィールド検証 |
| normalization test | scoreEvidence が期待familyへ正規化されること |
| trigger catalog test | 正本JSONから戦法名・状態変化名・技能名を全件生成できること |
| positive judgement test | 期待する型へ入ること |
| negative judgement test | 入ってはいけない型に入らないこと |
| target test | self / ally / enemy / unknown の扱いが型別に正しいこと |
| dependency test | Supportだけで高評価にならないこと |
| dedupe test | 同一起源のaliasが二重加点されないこと |
| regression test | LR司馬師、LR呂玲綺、火行、土行、木行、弱化無効重複、攻撃速度/戦法速度混同を固定すること |

## 移行フェーズ

### Phase A: Documentation / schema only

- 本ドキュメントを正本化
- `hadou_effect_change_item_catalog.schema.json` のドラフト作成
- `hadou_type_score_judgement_table.schema.json` のドラフト作成
- `hadou_type_score_trigger_catalog.schema.json` のドラフト作成

### Phase B: Catalog generation

- `tools/build_type_score_trigger_catalog.js` を追加
- 戦法/状態変化/技能/装備/陣形/五行/軍馬/異文化から trigger catalog を生成
- CSVも生成し、レビュー可能にする

### Phase C: Runtime bridge

- `hado_type_score.js` から ad hoc alias 判定を段階撤去
- `scoreEvidence` → `changeItem` → `judgementTable` の照合関数を追加
- まず `buff_support` と `vaccine` のみ切替

### Phase D: Full migration

- 16型すべてを judgement table 参照へ移行
- `METRIC_ALIASES` と `METRIC_MATCH_SPECS` は互換用から削除または最小化
- UI breakdown を evidence ベースへ統一

## 完了条件

- 型ごとの P/S/X がJSONで監査できる
- 変化項目がカタログで監査できる
- 対象の戦法名・状態変化名・技能名が trigger catalog で監査できる
- 実行時採点が結果サマリー/変化率集計/派生タグを直接読まない
- 既知の誤判定が negative test で固定されている
- Support-only high score が全型で禁止されている
