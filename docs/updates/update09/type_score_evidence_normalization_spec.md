# 評価スコア全面見直し仕様：評価根拠の正規化層と型別判定表

## 1. 期待値の定義

評価スコアは、検索タグや派生タグの一致数ではなく、**現在の部隊がその型として成立しているか**を判定する。

判定順は固定する。

1. 部隊編成後に実際に成立している一次効果を抽出する。
2. 一次効果を `scoreEvidence` に正規化する。
3. 型ごとの `primary / support / deny / dependency / targetPolicy` に照合する。
4. 同一起源の派生効果を代表化する。
5. primary が0なら support だけで高得点にしない。
6. 内訳には、ユーザーが見て納得できる一次効果だけを表示する。

現行の `hadou_type_score_rules.json` は `metricsPerType: 5` で型ごと5項目を持つ方針だが、この5項目だけでは「中核項目」と「補助項目」の関係を表現できない。したがって、5項目制はUI表示として残しても、内部判定には `primary/support/dependency` を追加する。

## 2. scoreEvidence 正規化層

評価スコアは、以下の形式の正規化済み一次効果だけを入力にする。

```ts
type ScoreEvidence = {
  evidenceId: string;
  sourceType:
    | "general" | "tactic" | "skill" | "equipment" | "formation"
    | "siegeWeapon" | "ethnicArmament" | "ethnicResearchSkill"
    | "fiveElement" | "warhorse" | "warhorseSkill";
  sourceId: string;
  sourceLabel: string;
  sourceSlot:
    | "main" | "vice1" | "vice2" | "support1" | "support2"
    | "attendant" | "equipment" | "formation" | "fiveElement" | "warhorse";
  timing:
    | "always" | "tactic_activated" | "combat_start" | "on_attack"
    | "on_damaged" | "on_chain" | "on_garrison" | "conditional";
  conditionText: string;
  targetScope: "self" | "ally" | "enemy" | "unknown";
  targetCount: number | null;
  effectKind:
    | "buff" | "debuff" | "recovery" | "defense"
    | "disadvantage_counter" | "gauge" | "chain" | "range"
    | "damage" | "anti_object" | "survival" | "buff_protection" | "utility";
  effectFamily: string;
  value: number | null;
  unit: "%" | "count" | "second" | "presence" | "unknown";
  duration: number | null;
  isPrimaryEffect: boolean;
  isDerivedTag: boolean;
  isAggregateMetric: boolean;
  evidenceGroupKey: string;
  rawText: string;
}
```

### 2.1 直接加点してよいもの

- 戦法本文・技能本文・装備技能本文・陣形効果・五行効果・軍馬効果などから抽出された一次効果。
- 部隊編成後に条件が成立している合算技能・異文化調査・五行・軍馬技能の一次効果。
- 発生元、対象、効果種別、タイミング、条件が説明できるもの。

### 2.2 直接加点してはいけないもの

- 型要素
- 検索タグ
- 関連リンクタグ
- 状態変化タグだけの派生項目
- 部隊の知力などの変化率集計
- 結果サマリー
- パラメータサマリー
- 対象不明の対象依存効果
- 同一一次効果から派生した別名タグ

## 3. 効果ファミリー

最低限、以下の canonical family へ正規化する。

### 3.1 バフ系

- `attack_up`
- `defense_up`
- `intelligence_up`
- `tactic_power_up`
- `normal_attack_power_up`
- `attack_speed_up`
- `critical_rate_up`
- `critical_power_up`
- `critical_tactic_rate_up`
- `critical_tactic_power_up`
- `normal_attack_target_count_up`
- `range_up`
- `anti_object_up`

### 3.2 デバフ/妨害系

- `enemy_attack_down`
- `enemy_defense_down`
- `enemy_anti_object_down`
- `tactic_delay`
- `chain_nullify_to_enemy`
- `confuse`
- `fear`
- `severance`
- `isolation`

### 3.3 不利対策系

- `weakening_nullify`
- `weakening_remove`
- `weakening_avoid`
- `status_nullify`
- `status_remove`
- `severance_counter`
- `isolation_counter`
- `chain_nullify_counter`
- `control_counter`

### 3.4 生存/耐久系

- `troops_up`
- `wounded_recovery`
- `wounded_survival`
- `annihilation_avoidance`
- `damage_reduction`
- `attribute_resistance`
- `healing`
- `continuous_healing`

### 3.5 速度/回転系

- `tactic_speed`
- `tactic_reduction`
- `initial_tactic_gauge`
- `combat_start_tactic_gauge`
- `chain_rate`

## 4. 型別判定表

以下が全面見直し後の型別判定表。`primary` が型成立の中核、`support` は補助。`support` は原則として `primary` がある場合にのみ意味を持つ。


### 鎮静型（`calm`）

目的: 弱化無効・解除・強化維持で敵妨害に崩されにくくする。

| 区分 | 内容 |
|---|---|
| primary | weakening_guard, weakening_remove, buff_protection |
| support | troops |
| 除外 | plainDefenseOnly, plainRecoveryOnly, firepowerOnly, tempoOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=full_if_affects_own_or_allies / enemy=deny / unknown=deny |
| 期待根拠例 | 弱化無効, 弱化解除, 弱化回避, 強化解除回避, 強化奪取回避 |

依存ルール:
- troopsは補助。weakening_guard/weakening_remove/buff_protectionが全て0なら型成立スコアを高くしない。
- weakening_guardとweakening_removeは同一起源なら代表化し、親カテゴリとの二重加点を禁止。

### ゾンビ型（`zombie`）

目的: 壊滅回避・残存兵力・回復・被ダメ軽減で長時間耐える。

| 区分 | 内容 |
|---|---|
| primary | annihilation_avoidance, remaining_troops, wounded_recovery |
| support | damage_reduction, troops |
| 除外 | firepowerOnly, tempoOnly, debuffOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=partial_or_full_if_support_type / enemy=deny / unknown=deny |
| 期待根拠例 | 壊滅回避, 残存兵力, 負傷兵回復, 兵力回復, 負傷兵として生存する兵数, 被ダメージ軽減 |

依存ルール:
- damage_reductionとtroopsだけで高得点にしない。回復/壊滅回避/残存兵力のいずれかをprimaryとして要求。
- 負傷兵生存・治癒・継続回復は生存支援として評価する。

### 爆弾型（`bomb`）

目的: 対物特効と撃心戦法で城壁・要所に一撃の大ダメージを出す。

| 区分 | 内容 |
|---|---|
| primary | anti_object, critical_tactic_power, tactic_power |
| support | critical_tactic_rate, tactic_speed |
| 除外 | plainDefenseOnly, plainRecoveryOnly, allyBuffOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=partial_if_buff_to_self_or_ally_attack / enemy=deny_unless_enemy_debuff_boosts_damage / unknown=deny |
| 期待根拠例 | 対物特効, 撃心威力, 撃心発生, 戦法威力, 戦法速度 |

依存ルール:
- tactic_speedは補助。anti_object/tactic_power/critical_tacticが0なら高得点にしない。
- 対物特効低下など敵デバフは別型へ寄せ、爆弾型では直接火力への寄与が明確な場合のみ補助。

### 撃心型（`critical_tactic`）

目的: 撃心発生・撃心威力・戦法威力で戦法攻撃の上振れを狙う。

| 区分 | 内容 |
|---|---|
| primary | critical_tactic_rate, critical_tactic_power, tactic_power |
| support | tactic_speed, troops |
| 除外 | normalAttackOnly, plainDefenseOnly, plainRecoveryOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=partial_if_buff / enemy=deny / unknown=deny |
| 期待根拠例 | 撃心発生, 撃心威力, 戦法威力, 戦法速度 |

依存ルール:
- 撃心発生または撃心威力が0なら、戦法速度/兵力だけで撃心型高得点にしない。
- 会心と撃心は別family。混同禁止。

### 会心型（`critical_normal`）

目的: 会心発生・会心威力・通常攻撃威力で通常攻撃火力を伸ばす。

| 区分 | 内容 |
|---|---|
| primary | critical_rate, critical_power, normal_attack_power |
| support | attack_speed, normal_attack_target_count |
| 除外 | tacticOnly, plainDefenseOnly, plainRecoveryOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=partial_if_buff / enemy=deny / unknown=deny |
| 期待根拠例 | 会心発生, 会心威力, 通常攻撃威力, 攻撃速度, 通常攻撃対象数 |

依存ルール:
- attack_speed/target_countは補助。会心または通常攻撃威力が0なら高得点にしない。
- 撃心系を会心型へ混入させない。

### 戦法速度型（`tactic_speed`）

目的: 初回/継続戦法を早める。

| 区分 | 内容 |
|---|---|
| primary | tactic_speed, tactic_reduction, initial_tactic_gauge |
| support | chain_rate, troops |
| 除外 | normalAttackOnly, plainDefenseOnly, plainRecoveryOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=partial_if_support / enemy=deny / unknown=deny |
| 期待根拠例 | 戦法速度, 戦法短縮, 出陣時戦法ゲージ, 交戦開始時戦法ゲージ, 連鎖率 |

依存ルール:
- 戦法速度/短縮/初期ゲージのいずれかをprimaryとして要求。
- chain_rateとtroopsだけでは戦法速度型を成立させない。

### 攻撃速度型（`attack_speed`）

目的: 攻撃速度を中心に通常攻撃回数を増やす。

| 区分 | 内容 |
|---|---|
| primary | attack_speed |
| support | normal_attack_target_count, normal_attack_power, critical_rate, range |
| 除外 | tacticOnly, plainDefenseOnly, plainRecoveryOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=partial_if_buff / enemy=deny / unknown=deny |
| 期待根拠例 | 攻撃速度, 通常攻撃対象数, 通常攻撃威力, 会心発生, 射程 |

依存ルール:
- attack_speedをprimaryとして要求。通常攻撃対象数だけで攻撃速度型高得点にしない。
- 戦法速度と攻撃速度を混同しない。

### 通常攻撃拡張型（`normal_attack`）

目的: 通常攻撃対象数と射程を伸ばし、多数の敵部隊へ通常攻撃する。

| 区分 | 内容 |
|---|---|
| primary | normal_attack_target_count, range |
| support | normal_attack_power, attack_speed, troops |
| 除外 | tacticOnly, plainDefenseOnly, plainRecoveryOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=partial_if_buff / enemy=deny / unknown=deny |
| 期待根拠例 | 通常攻撃対象数, 射程, 通常攻撃威力, 攻撃速度 |

依存ルール:
- target_count/rangeのいずれかをprimaryとして要求。
- attack_speedだけで通常攻撃拡張型を高得点にしない。

### デバフ型（基礎）（`debuff`）

目的: 敵への状態変化・戦法遅延・連鎖阻害・攻防低下を確認する基礎型。

| 区分 | 内容 |
|---|---|
| primary | enemy_debuff, status_effect_rate, tactic_delay, chain_nullify |
| support | enemy_attack_debuff, enemy_defense_debuff |
| 除外 | allyBuffOnly, selfBuffOnly, plainRecoveryOnly, aggregateMetric, derivedTag |
| 対象方針 | self=deny / ally=deny / enemy=full / unknown=deny |
| 期待根拠例 | 状態変化発生率, 戦法遅延, 連鎖無効, 敵部隊攻撃低下, 敵部隊防御低下 |

依存ルール:
- 敵対象であることを必須にする。
- 状態変化発生率だけではなく、敵へ付与する実デバフ本体との紐付きを優先。

### 対物型（`anti_object`）

目的: 対物特効を中心に城壁・要所へのダメージを伸ばす。

| 区分 | 内容 |
|---|---|
| primary | anti_object |
| support | tactic_power, normal_attack_power, attack_speed, troops |
| 除外 | plainDefenseOnly, plainRecoveryOnly, allyNonDamageOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=partial_if_buff / enemy=partial_if_enemy_anti_object_debuff / unknown=deny |
| 期待根拠例 | 対物特効, 対物体攻撃, 戦法威力, 通常攻撃威力, 攻撃速度 |

依存ルール:
- anti_objectをprimaryとして要求。戦法威力や攻撃速度だけで対物型高得点にしない。
- 対物体攻撃/対物特効は同familyとして代表化。

### 汎用火力型（`annihilation`）

目的: 戦法・撃心・会心・速度を横断する参考火力型。主軸選定では過大評価しない。

| 区分 | 内容 |
|---|---|
| primary | tactic_power, critical_tactic_power, critical_power |
| support | attack_speed, troops |
| 除外 | plainDefenseOnly, plainRecoveryOnly, pureSupportOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=partial_if_buff / enemy=deny_unless_damage_debuff / unknown=deny |
| 期待根拠例 | 戦法威力, 撃心威力, 会心威力, 攻撃速度, 兵力 |

依存ルール:
- 参考型のため、複数火力familyの代表化を必須にし、同じ攻撃上昇の派生タグで過大評価しない。
- troopsは補助。火力primaryが0なら高得点にしない。

### バフ支援型（`buff_support`）

目的: 味方または自部隊へ、早く・多く・長く有益バフを配る。

| 区分 | 内容 |
|---|---|
| primary | ally_buff_distribution |
| support | ally_target_count, effect_duration, initial_tactic_gauge, tactic_speed |
| 除外 | enemyDebuffOnly, directDamageOnly, plainRecoveryOnlyUnlessBuffSupport, aggregateMetric, derivedTag |
| 対象方針 | self=partial / ally=full / enemy=deny / unknown=deny |
| 期待根拠例 | 攻撃上昇, 防御上昇, 知力上昇, 戦法威力上昇, 通常攻撃威力上昇, 攻撃速度上昇, 会心発生, 会心威力, 通常攻撃対象数 |

依存ルール:
- ally_buff_distributionが0の場合、target_count/duration/tactic_speedだけで高得点にしない。
- 自部隊のみのバフは自己バフとして部分点。自身を含む味方/味方複数部隊は配布として高評価。
- target_countとdurationは、buff本体と同じevidenceGroupに紐づく場合のみ加点。
- 攻撃/防御/知力/戦法威力/通常攻撃威力/攻撃速度/会心/通常攻撃対象数などの有益強化をbuffとして拾う。

### デバフ妨害型（`debuff_interference`）

目的: 敵へ早く・多く・長くデバフを配る。

| 区分 | 内容 |
|---|---|
| primary | enemy_debuff_distribution |
| support | enemy_target_count, effect_duration, status_effect_rate, tactic_speed |
| 除外 | allyBuffOnly, selfBuffOnly, plainRecoveryOnly, aggregateMetric, derivedTag |
| 対象方針 | self=deny / ally=deny / enemy=full / unknown=deny |
| 期待根拠例 | 敵弱化, 敵攻撃低下, 敵防御低下, 戦法遅延, 連鎖無効, 混乱, 恐怖, 分断, 絶縁 |

依存ルール:
- enemy_debuff_distributionが0の場合、status_effect_rate/tactic_speedだけで高得点にしない。
- target_countとdurationは敵デバフ本体に紐づく場合のみ加点。

### 城壁防衛型（`wall_defense`）

目的: 城壁前で敵対物低下・多対象攻撃・回復・被ダメ軽減により防衛する。

| 区分 | 内容 |
|---|---|
| primary | enemy_anti_object_debuff, damage_reduction, wounded_recovery |
| support | normal_attack_target_count, attack_speed |
| 除外 | pureFirepowerToEnemyOnly, allyBuffOnlyUnlessDefense, aggregateMetric, derivedTag |
| 対象方針 | self=full_for_defense_recovery / ally=partial_if_defense_support / enemy=full_for_anti_object_debuff / unknown=deny |
| 期待根拠例 | 敵部隊対物特効低下, 通常攻撃対象数, 攻撃速度, 負傷兵回復, 被ダメージ軽減 |

依存ルール:
- 敵対物低下/防御回復系のprimaryが0なら、攻撃速度/対象数だけで防衛型高得点にしない。
- 通常攻撃対象数は防衛で複数妨害する補助として扱う。

### 駐屯支援型（`garrison_support`）

目的: 駐屯で敵対物低下・味方回復・防御強化・初動/回転補助により味方を支える。

| 区分 | 内容 |
|---|---|
| primary | enemy_anti_object_debuff, ally_wounded_recovery, ally_defense_buff |
| support | combat_start_tactic_gauge, tactic_speed |
| 除外 | pureFirepowerOnly, selfOnlyAttackBuff, aggregateMetric, derivedTag |
| 対象方針 | self=partial / ally=full / enemy=full_for_anti_object_debuff / unknown=deny |
| 期待根拠例 | 敵部隊対物特効低下, 味方負傷兵回復, 味方防御上昇, 交戦開始時戦法ゲージ, 戦法速度 |

依存ルール:
- enemy_anti_object_debuff/ally_recovery/ally_defenseのどれかをprimaryとして要求。
- combat_start_tactic_gauge/tactic_speedは補助。primaryが0なら高得点にしない。

### ワクチン型（`vaccine`）

目的: 弱化・状態異常・制御への対策で不利状態を受けにくく、受けても戻せる。

| 区分 | 内容 |
|---|---|
| primary | weakening_guard, weakening_remove, status_guard, control_guard |
| support | buff_protection, ally_scope |
| 除外 | plainDefenseOnly, plainRecoveryOnly, firepowerOnly, tempoOnly, attributeResistanceOnly, aggregateMetric, derivedTag |
| 対象方針 | self=full / ally=full_if_countermeasure / enemy=deny / unknown=deny |
| 期待根拠例 | 弱化無効, 弱化解除, 弱化回避, 状態変化無効, 状態異常解除, 分断対策, 絶縁対策, 連鎖無効対策, 強化解除回避 |

依存ルール:
- 防御/回復/負傷兵生存/属性耐性だけではワクチン型に加点しない。
- 火行の火属性ダメージ軽減はワクチン型ではなく被火力/属性耐性。土行の弱化効果打ち消しは弱化解除。
- weakening_guard/remove/status/controlのいずれも0なら、ワクチン型は0または低評価で正しい。

## 5. 実装順序

1. `buildFormationScoreEvidence(f)` を新設し、戦法・技能・装備・五行・異文化・軍馬・陣形を `scoreEvidence[]` に変換する。
2. 既存 `typeFeatures/statusEffectRefs` は直接採点せず、`scoreEvidence` 作成時の補助材料に限定する。
3. `hadou_type_score_rules.json` とは別に、または拡張として `hadou_type_score_judgement_table.json` を追加する。
4. `HadoTypeScore.score(entity, rule)` は `scoreEvidence[]` と型別判定表を入力にする。
5. 既存UIの5チップ表示は維持しつつ、内部は primary/support/dependency で判定する。
6. 実データ回帰テストを追加する。

## 6. 必須回帰テスト

### バフ支援型

- 攻撃/防御/知力/通常攻撃威力/戦法威力/攻撃速度/会心/通常攻撃対象数が戦法発動時に発生する部隊では、`味方バフ配布` が0にならない。
- `味方バフ配布` が0の場合、`戦法速度` だけで高得点にしない。
- `味方対象部隊数` と `効果時間` は、バフ本体に紐づく場合だけ加点。

### ワクチン型

- 火行の火属性ダメージ軽減はワクチン型に入れない。
- 土行の弱化効果打ち消しは弱化解除に入れる。
- 防御/回復/負傷兵生存だけではワクチン型に加点しない。

### 共通

- 対象不明を対象依存カテゴリに加点しない。
- 変化率集計を評価根拠にしない。
- 型要素/検索タグ/関連リンクタグを直接加点しない。
- 同一一次効果から派生したタグを二重加点しない。
