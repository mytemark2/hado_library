'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UPDATE01_DIR = path.join(ROOT, 'docs', 'updates', '3.1.0.0', 'update01');
const UPDATE02_DIR = path.join(ROOT, 'docs', 'updates', '3.1.0.0', 'update02');
const CENSUS_PATH = path.join(UPDATE01_DIR, 'condition-census.json');
const GOLD_PATH = path.join(UPDATE01_DIR, 'condition-gold-set.json');

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

const DEFINITIONS = [
  ['condition.placement_role', 'condition', 'formation', 'enum', ['eq', 'in'], '編成内の配置役割'],
  ['condition.formation_membership', 'condition', 'formation', 'set', ['includes', 'includes_all', 'includes_any'], '部隊内の所属関係'],
  ['condition.troop_type', 'condition', 'formation', 'enum', ['eq', 'in'], '兵科・盾兵等の部隊種別'],
  ['condition.general_identity_set', 'condition', 'formation', 'set', ['includes', 'includes_all', 'includes_any'], '特定武将集合'],
  ['condition.affinity', 'condition', 'formation', 'enum', ['eq', 'in'], '武将間の相性関係'],
  ['condition.formation_stat_threshold', 'condition', 'formation', 'number', ['gt', 'gte', 'lt', 'lte'], '編制時能力値の閾値'],
  ['condition.component_state', 'condition', 'formation', 'structure', ['eq', 'exists'], '兵器等の編成要素と健在状態'],
  ['condition.troop_threshold', 'condition', 'battle', 'number', ['gt', 'gte', 'lt', 'lte'], '現在兵力・兵力割合の閾値'],
  ['condition.stat_comparison', 'condition', 'battle', 'number', ['gt', 'gte', 'lt', 'lte', 'eq'], '自部隊と対象部隊の能力比較'],
  ['condition.status_presence_count', 'condition', 'battle', 'number', ['gt', 'gte', 'lt', 'lte', 'eq'], '状態変化の有無・数'],
  ['condition.skill_level', 'condition', 'formation', 'number', ['gt', 'gte', 'lt', 'lte', 'eq'], '技能Lv'],
  ['condition.star_rank', 'condition', 'formation', 'number', ['gt', 'gte', 'lt', 'lte', 'eq'], '将星ランク'],
  ['condition.count_threshold', 'condition', 'universal', 'number', ['gt', 'gte', 'lt', 'lte', 'eq'], '人数・個数・連鎖数等の閾値'],
  ['condition.probability', 'condition', 'battle', 'number', ['gt', 'gte', 'lt', 'lte', 'eq'], '確率条件'],
  ['condition.target_relation', 'condition', 'battle', 'enum', ['eq', 'in'], '自身・味方・敵・対象との関係'],
  ['condition.entity_state_relation', 'condition', 'battle', 'structure', ['eq', 'exists'], '効果対象となる実体の状態関係'],
  ['trigger.sortie', 'trigger', 'battle', 'event', ['eq'], '出陣時'],
  ['trigger.engagement_start', 'trigger', 'battle', 'event', ['eq'], '交戦開始時'],
  ['trigger.tactic_activation', 'trigger', 'battle', 'event', ['eq'], '戦法発動時'],
  ['trigger.normal_attack', 'trigger', 'battle', 'event', ['eq'], '通常攻撃時'],
  ['trigger.pre_attack_or_hit', 'trigger', 'battle', 'event', ['eq'], '攻撃・被弾直前'],
  ['trigger.critical_hit', 'trigger', 'battle', 'event', ['eq'], '会心・撃心発生時'],
  ['trigger.siege_action', 'trigger', 'battle', 'event', ['eq'], '兵器行動時'],
  ['trigger.status_change', 'trigger', 'battle', 'event', ['eq'], '状態変化発生時'],
  ['trigger.damage_event', 'trigger', 'battle', 'event', ['eq'], 'ダメージ発生時'],
  ['trigger.custom_event', 'trigger', 'battle', 'event', ['eq'], '固有の戦闘イベント'],
  ['context.always', 'context', 'universal', 'boolean', ['eq'], '常時適用'],
  ['context.appointment', 'context', 'external', 'enum', ['eq', 'in'], '施設任命コンテキスト'],
  ['modifier.multiplier', 'modifier', 'metadata', 'number', [], '効果量の乗算'],
  ['modifier.stat_scaling', 'modifier', 'metadata', 'structure', [], '能力値比例'],
  ['modifier.override_fixed', 'modifier', 'metadata', 'structure', [], 'base値の固定上書き'],
  ['modifier.additive', 'modifier', 'metadata', 'number', [], '加算補正'],
  ['modifier.cap_floor', 'modifier', 'metadata', 'structure', [], '上限・下限'],
  ['modifier.conditional_adjustment', 'modifier', 'metadata', 'structure', [], '条件付き補正'],
  ['limit.activation_count', 'limit', 'metadata', 'number', [], '発動回数制限'],
  ['limit.duration', 'limit', 'metadata', 'duration', [], '効果時間・継続区間'],
  ['limit.upper_lower_bound', 'limit', 'metadata', 'structure', [], '値の上下限'],
  ['reset.cumulative', 'reset', 'metadata', 'structure', [], '累積規則'],
  ['reset.reset_or_expire', 'reset', 'metadata', 'event', [], 'リセット・失効契機'],
  ['suppression.activation_suppression', 'suppression', 'battle', 'structure', [], '発動抑止'],
  ['suppression.exception', 'suppression', 'metadata', 'structure', [], '適用除外'],
  ['suppression.ignore_or_avoid', 'suppression', 'battle', 'structure', [], '無視・回避'],
  ['targeting.priority', 'targeting', 'metadata', 'structure', [], '対象選択優先順位'],
  ['targeting.target_count', 'targeting', 'metadata', 'number', [], '対象数']
];

const FACTS = Object.freeze({
  'condition.placement_role': ['formation.role', 'eq', 'main'],
  'condition.formation_membership': ['formation.members', 'includes', 'self'],
  'condition.troop_type': ['formation.troopType', 'eq', 'cavalry'],
  'condition.general_identity_set': ['formation.generalNames', 'includes_any', ['関羽', '関興', '関索', '関銀屏']],
  'condition.affinity': ['formation.affinity', 'eq', 'good'],
  'condition.formation_stat_threshold': ['formation.stats.defense', 'gte', 2750],
  'condition.component_state': ['formation.components.siegeWeapon.alive', 'eq', true],
  'condition.troop_threshold': ['battle.troopRatio', 'gte', 0.5],
  'condition.stat_comparison': ['battle.comparison.selfGreater', 'eq', true],
  'condition.status_presence_count': ['battle.statusCount', 'gte', 1],
  'condition.skill_level': ['formation.skillLevel', 'gte', 1],
  'condition.star_rank': ['formation.starRank', 'gte', 1],
  'condition.count_threshold': ['runtime.count', 'gte', 1],
  'condition.probability': ['battle.probability', 'gte', 0.5],
  'condition.target_relation': ['battle.targetRelation', 'eq', 'enemy'],
  'condition.entity_state_relation': ['battle.entityState.active', 'eq', true],
  'trigger.sortie': ['battle.event', 'eq', 'sortie'],
  'trigger.engagement_start': ['battle.event', 'eq', 'engagement_start'],
  'trigger.tactic_activation': ['battle.event', 'eq', 'tactic_activation'],
  'trigger.normal_attack': ['battle.event', 'eq', 'normal_attack'],
  'trigger.pre_attack_or_hit': ['battle.event', 'eq', 'pre_attack_or_hit'],
  'trigger.critical_hit': ['battle.eventKinds', 'includes', 'critical_hit'],
  'trigger.siege_action': ['battle.event', 'eq', 'siege_action'],
  'trigger.status_change': ['battle.event', 'eq', 'status_change'],
  'trigger.damage_event': ['battle.eventKinds', 'includes', 'damage_event'],
  'trigger.custom_event': ['battle.event', 'eq', 'custom_event'],
  'context.always': ['context.always', 'eq', true],
  'context.appointment': ['external.appointment', 'eq', 'military_office']
});

const PAYLOADS = Object.freeze({
  'modifier.multiplier': { operation: 'multiply', value: 2 },
  'modifier.stat_scaling': { operation: 'scale_from_stat', value: { stat: 'politics', ratio: 0.2 } },
  'modifier.override_fixed': { operation: 'override', value: { mode: 'fixed', value: 700, unit: 'percent' } },
  'modifier.additive': { operation: 'add', value: 1 },
  'modifier.cap_floor': { operation: 'clamp', value: { min: null, max: 5000 } },
  'modifier.conditional_adjustment': { operation: 'adjust_when_met', value: { mode: 'replace' } },
  'limit.activation_count': { scope: 'event', max: 1 },
  'limit.duration': { mode: 'until_event', event: 'first_tactic_activation' },
  'limit.upper_lower_bound': { min: null, max: 1 },
  'reset.cumulative': { mode: 'accumulate', step: 1 },
  'reset.reset_or_expire': { mode: 'reset_on', event: 'battle_end' },
  'suppression.activation_suppression': { mode: 'suppress_when', condition: 'source_attack_invalidated' },
  'suppression.exception': { mode: 'exclude', target: 'documented_exception' },
  'suppression.ignore_or_avoid': { mode: 'avoid', target: 'documented_effect' },
  'targeting.priority': { order: 1, basis: 'affinity' },
  'targeting.target_count': { count: 1 }
});

function registryItem(definition) {
  const [type, group, phase, valueType, operators, description] = definition;
  return { type, group, phase, valueType, operators, description };
}

function expression(items) {
  if (!items.length) return null;
  return items.length === 1 ? items[0] : { op: 'all', items };
}

function predicate(type) {
  const [fact, comparator, value] = FACTS[type];
  return { op: 'predicate', type, fact, comparator, value };
}

function typedPayload(type, effectId) {
  const payload = JSON.parse(JSON.stringify(PAYLOADS[type] || {}));
  return { type, effectId, ...payload };
}

function buildGoldCase(item, registryByType) {
  const context = [];
  const trigger = [];
  const when = [];
  const modifier = [];
  const limit = [];
  const reset = [];
  const suppression = [];
  const targetRules = [];
  const effectId = `${item.id}:effect`;
  for (const type of item.expectedSemanticTags) {
    const entry = registryByType.get(type);
    if (!entry) throw new Error(`gold case ${item.id} references unknown type ${type}`);
    if (entry.group === 'context') context.push(predicate(type));
    else if (entry.group === 'trigger') trigger.push(predicate(type));
    else if (entry.group === 'condition') when.push(predicate(type));
    else if (entry.group === 'modifier') modifier.push(typedPayload(type, effectId));
    else if (entry.group === 'limit') limit.push(typedPayload(type, effectId));
    else if (entry.group === 'reset') reset.push(typedPayload(type, effectId));
    else if (entry.group === 'suppression') suppression.push(typedPayload(type, effectId));
    else if (entry.group === 'targeting') targetRules.push(typedPayload(type, effectId));
  }
  return {
    caseId: item.id,
    expectedSemanticTypes: [...item.expectedSemanticTags].sort(),
    clause: {
      schemaVersion: '1.0',
      id: `${item.sourceUnitId}:${item.id}`,
      context: expression(context),
      trigger: expression(trigger),
      when: expression(when),
      target: { scope: 'source_defined', rules: targetRules },
      effect: {
        id: effectId,
        identity: `${item.sourceRecordId}:${item.sourceUnitId}`,
        kind: 'source_effect',
        operation: 'preserve',
        baseValue: null,
        unit: 'source_defined'
      },
      modifier,
      limit,
      reset,
      priority: 0,
      suppression,
      evidence: {
        category: item.category,
        entity: item.entity,
        sourceRecordId: item.sourceRecordId,
        sourceUnitId: item.sourceUnitId,
        rawText: item.sourceText,
        rawTextSha256: sha256(item.sourceText)
      },
      trust: { state: 'reviewed', fallbackPolicy: 'raw_text_only' }
    }
  };
}

function buildSchema() {
  const expressionRef = { '$ref': '#/$defs/expression' };
  const typedRef = group => ({
    type: 'array',
    items: {
      type: 'object',
      required: ['type', 'effectId'],
      properties: { type: { type: 'string', pattern: `^${group}\\.` }, effectId: { type: 'string', minLength: 1 } },
      additionalProperties: true
    }
  });
  return {
    '$schema': 'https://json-schema.org/draft/2020-12/schema',
    '$id': 'https://mytemark2.github.io/hado_library-preview/schema/effect-clause-1.0.json',
    title: 'Hado Library EffectClause 1.0',
    type: 'object',
    required: ['schemaVersion', 'id', 'target', 'effect', 'modifier', 'limit', 'reset', 'priority', 'suppression', 'evidence', 'trust'],
    properties: {
      schemaVersion: { const: '1.0' },
      id: { type: 'string', minLength: 1 },
      context: { anyOf: [expressionRef, { type: 'null' }] },
      trigger: { anyOf: [expressionRef, { type: 'null' }] },
      when: { anyOf: [expressionRef, { type: 'null' }] },
      target: {
        type: 'object', required: ['scope', 'rules'],
        properties: { scope: { type: 'string', minLength: 1 }, rules: typedRef('targeting') }, additionalProperties: false
      },
      effect: {
        type: 'object', required: ['id', 'identity', 'kind', 'operation', 'unit'],
        properties: {
          id: { type: 'string', minLength: 1 }, identity: { type: 'string', minLength: 1 },
          kind: { type: 'string', minLength: 1 }, operation: { type: 'string', minLength: 1 },
          baseValue: {}, unit: { type: 'string', minLength: 1 }
        }, additionalProperties: true
      },
      modifier: typedRef('modifier'),
      limit: typedRef('limit'),
      reset: typedRef('reset'),
      priority: { type: 'number' },
      suppression: typedRef('suppression'),
      evidence: {
        type: 'object',
        required: ['category', 'entity', 'sourceRecordId', 'sourceUnitId', 'rawText', 'rawTextSha256'],
        properties: {
          category: { type: 'string' }, entity: { type: 'string' }, sourceRecordId: { type: 'string' },
          sourceUnitId: { type: 'string' }, rawText: { type: 'string', minLength: 1 },
          rawTextSha256: { type: 'string', pattern: '^[0-9a-f]{64}$' }
        }, additionalProperties: false
      },
      trust: {
        type: 'object', required: ['state', 'fallbackPolicy'],
        properties: {
          state: { enum: ['unparsed', 'generated', 'reviewed', 'verified'] },
          fallbackPolicy: { enum: ['raw_text_only', 'none'] }
        }, additionalProperties: false
      }
    },
    additionalProperties: false,
    '$defs': {
      expression: {
        oneOf: [
          {
            type: 'object', required: ['op', 'type', 'fact', 'comparator', 'value'],
            properties: {
              op: { const: 'predicate' }, type: { type: 'string' }, fact: { type: 'string' },
              comparator: { enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'includes', 'includes_all', 'includes_any', 'exists'] }, value: {}
            }, additionalProperties: false
          },
          {
            type: 'object', required: ['op', 'items'],
            properties: { op: { enum: ['all', 'any'] }, items: { type: 'array', minItems: 1, items: expressionRef } },
            additionalProperties: false
          },
          {
            type: 'object', required: ['op', 'item'],
            properties: { op: { const: 'not' }, item: expressionRef }, additionalProperties: false
          }
        ]
      }
    }
  };
}

function main() {
  const census = readJson(CENSUS_PATH);
  const gold = readJson(GOLD_PATH);
  const registryItems = DEFINITIONS.map(registryItem);
  const registryByType = new Map(registryItems.map(item => [item.type, item]));
  const censusTypes = census.taxonomy.map(row => `${row.group}.${row.id}`).sort();
  const registryTypes = registryItems.map(row => row.type).sort();
  if (JSON.stringify(censusTypes) !== JSON.stringify(registryTypes)) throw new Error('formal registry must cover every Update01 taxonomy type exactly');
  fs.mkdirSync(UPDATE02_DIR, { recursive: true });
  const registry = {
    schemaVersion: '1.0',
    kind: 'hado_condition_registry',
    releaseVersion: '3.1.0.0',
    updateNo: '02',
    evaluationStates: ['met', 'unmet', 'deferred', 'not_applicable', 'unknown'],
    taxonomySha256: sha256(JSON.stringify(census.taxonomy)),
    itemCount: registryItems.length,
    items: registryItems
  };
  const fixtures = {
    schemaVersion: '1.0',
    kind: 'hado_effect_clause_gold_fixtures',
    releaseVersion: '3.1.0.0',
    updateNo: '02',
    sourceGoldSha256: sha256(JSON.stringify(gold)),
    itemCount: gold.items.length,
    items: gold.items.map(item => buildGoldCase(item, registryByType))
  };
  writeJson(path.join(UPDATE02_DIR, 'condition-registry.json'), registry);
  writeJson(path.join(UPDATE02_DIR, 'effect-clause.schema.json'), buildSchema());
  writeJson(path.join(UPDATE02_DIR, 'condition-gold-fixtures.json'), fixtures);
  console.log(JSON.stringify({ registryTypes: registry.itemCount, goldFixtures: fixtures.itemCount }, null, 2));
}

if (require.main === module) main();

module.exports = { DEFINITIONS, FACTS, PAYLOADS, buildSchema, buildGoldCase };
