/* Hado Library 3.1 Update04: reviewed EffectClause detail presenter. */
(function initHadoDetailConditionPresenter(root, factory) {
  'use strict';
  const evaluator = root?.HADO_FORMATION_CONDITION_EVALUATOR || (typeof require === 'function' ? require('./hado_formation_condition_evaluator.js') : null);
  const api = factory(evaluator);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HADO_DETAIL_CONDITION_PRESENTER = api;
})(typeof window !== 'undefined' ? window : globalThis, function createDetailConditionPresenter(evaluator) {
  'use strict';

  if (!evaluator) throw new Error('HADO_FORMATION_CONDITION_EVALUATOR is required');

  const TYPE_LABELS = Object.freeze({
    'condition.placement_role': '配置',
    'condition.formation_membership': '編制武将',
    'condition.troop_type': '兵科',
    'condition.general_identity_set': '指定武将',
    'condition.affinity': '相性',
    'condition.formation_stat_threshold': '編制能力',
    'condition.component_state': '編制状態',
    'condition.troop_threshold': '兵力',
    'condition.stat_comparison': '能力比較',
    'condition.status_presence_count': '状態数',
    'condition.skill_level': '技能Lv',
    'condition.star_rank': '将星',
    'condition.count_threshold': '個数',
    'condition.probability': '確率',
    'condition.target_relation': '対象関係',
    'condition.entity_state_relation': '状態関係',
    'trigger.sortie': '出陣時',
    'trigger.engagement_start': '交戦開始時',
    'trigger.tactic_activation': '戦法発動時',
    'trigger.normal_attack': '通常攻撃時',
    'trigger.pre_attack_or_hit': '攻撃直前',
    'trigger.critical_hit': '会心時',
    'trigger.siege_action': '兵器行動時',
    'trigger.status_change': '状態変化時',
    'trigger.damage_event': 'ダメージ時',
    'trigger.custom_event': '固有契機',
    'context.always': '常時',
    'context.appointment': '任命時',
    'modifier.multiplier': '倍率変更',
    'modifier.stat_scaling': '能力比例',
    'modifier.override_fixed': '固定値変更',
    'modifier.additive': '加算',
    'modifier.cap_floor': '上限・下限',
    'modifier.conditional_adjustment': '条件時変更',
    'limit.activation_count': '回数制限',
    'limit.duration': '継続時間',
    'limit.upper_lower_bound': '上限・下限',
    'reset.cumulative': '累積リセット',
    'reset.reset_or_expire': '解除・失効',
    'suppression.activation_suppression': '発動抑止',
    'suppression.exception': '例外',
    'suppression.ignore_or_avoid': '無視・回避',
    'targeting.priority': '対象優先',
    'targeting.target_count': '対象数'
  });

  function text(value) { return String(value == null ? '' : value).trim(); }
  function esc(value) { return text(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function normalizeEvidence(value) { return text(value).normalize('NFKC').replace(/[\s■▼●→]/g, '').replace(/[％]/g, '%'); }
  function sourceMatches(rawText, sourceTexts) {
    if (!Array.isArray(sourceTexts) || !sourceTexts.length) return true;
    const raw = normalizeEvidence(rawText);
    if (!raw) return false;
    return sourceTexts.some(source => {
      const normalized = normalizeEvidence(source);
      return normalized && (normalized.includes(raw) || raw.includes(normalized));
    });
  }
  function percent(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    return `${Number.isInteger(n * 100) ? n * 100 : Number((n * 100).toFixed(1))}%`;
  }
  function predicateLabel(predicate) {
    if (!predicate) return '';
    if (predicate.op === 'all' || predicate.op === 'any') {
      const labels = (predicate.items || []).map(predicateLabel).filter(Boolean);
      return labels.join(predicate.op === 'all' ? '・' : ' または ');
    }
    const type = text(predicate.type);
    const fact = text(predicate.fact);
    const comparator = text(predicate.comparator);
    const value = predicate.value;
    if (type === 'context.always') return '常時';
    if (type === 'context.appointment') return '任命時';
    if (type === 'condition.placement_role') return value === 'main' ? '主将' : value === 'deputy' ? '副将' : '配置条件';
    if (type === 'condition.troop_threshold') return `兵力${percent(value)}${comparator === 'gte' ? '以上' : '条件'}`;
    if (type === 'condition.troop_type') return value === 'cavalry' ? '騎兵' : value === 'infantry' ? '歩兵' : value === 'archer' ? '弓兵' : '兵科条件';
    if (type === 'condition.affinity') return '好相性';
    if (type === 'condition.formation_stat_threshold') {
      const stat = fact.includes('defense') ? '防御' : fact.includes('attack') ? '攻撃' : fact.includes('intelligence') ? '知力' : '能力';
      return `編制${stat}${text(value)}${comparator === 'gte' ? '以上' : '条件'}`;
    }
    if (type === 'condition.component_state') return '編制要素が有効';
    if (type === 'condition.stat_comparison') return '自部隊が比較優位';
    if (type === 'condition.status_presence_count') return '状態数条件';
    if (type === 'condition.general_identity_set') return '指定武将を編制';
    if (type === 'condition.skill_level') return '技能Lv条件';
    if (type === 'condition.star_rank') return '将星条件';
    if (type === 'condition.count_threshold') return '個数条件';
    if (type === 'condition.probability') return '確率条件';
    if (type === 'condition.entity_state_relation') return '状態関係条件';
    return TYPE_LABELS[type] || '条件あり';
  }
  function collectTypes(node, output = []) {
    if (!node) return output;
    if (text(node.type)) output.push(text(node.type));
    (node.items || []).forEach(item => collectTypes(item, output));
    return output;
  }
  function semanticTypes(clause) {
    const values = [];
    collectTypes(clause?.context, values);
    collectTypes(clause?.trigger, values);
    collectTypes(clause?.when, values);
    (clause?.modifier || []).forEach(row => values.push(text(row?.type)));
    (clause?.limit || []).forEach(row => values.push(text(row?.type)));
    (clause?.reset || []).forEach(row => values.push(text(row?.type)));
    (clause?.suppression || []).forEach(row => values.push(text(row?.type)));
    (clause?.target?.rules || []).forEach(row => values.push(text(row?.type)));
    return [...new Set(values.filter(Boolean))];
  }
  function conditionLabels(clause) {
    return [predicateLabel(clause?.context), predicateLabel(clause?.trigger), predicateLabel(clause?.when)].filter(Boolean);
  }
  function cleanEvidence(value) { return text(value).replace(/^[■▼●→\s]+/, '').replace(/\s+/g, ' '); }
  function defaultRow(reviewed) {
    const clause = reviewed.clause;
    const conditions = conditionLabels(clause);
    return Object.freeze({
      caseIds: Object.freeze([reviewed.caseId]),
      conditions: Object.freeze(conditions.length ? conditions : ['常時']),
      effectText: cleanEvidence(clause?.evidence?.rawText) || '原文を確認',
      semanticTypes: Object.freeze(semanticTypes(clause))
    });
  }
  function yuanTacticRows(caseIds) {
    const all = new Set(caseIds);
    const required = ['yuan-main-double', 'yuan-troops-50', 'yuan-base-250-override-700', 'yuan-kaii-25-to-50'];
    if (!required.every(id => all.has(id))) return null;
    return Object.freeze([
      Object.freeze({ caseIds: Object.freeze([]), conditions: Object.freeze(['常時']), effectText: '味方4部隊: 攻撃・知力 +150%', semanticTypes: Object.freeze(['context.always']) }),
      Object.freeze({ caseIds: Object.freeze([]), conditions: Object.freeze(['常時']), effectText: '味方4部隊: 全兵科・物体に有利', semanticTypes: Object.freeze(['context.always']) }),
      Object.freeze({ caseIds: Object.freeze(['yuan-main-double', 'yuan-kaii-25-to-50']), conditions: Object.freeze(['主将']), effectText: '自身: 魁威 25% → 50%', semanticTypes: Object.freeze(['condition.placement_role', 'modifier.multiplier']) }),
      Object.freeze({ caseIds: Object.freeze(['yuan-troops-50', 'yuan-base-250-override-700']), conditions: Object.freeze(['主将', '兵力50%以上']), effectText: '敵4部隊: 戦法威力 250% → 700%', semanticTypes: Object.freeze(['condition.placement_role', 'condition.troop_threshold', 'modifier.conditional_adjustment', 'modifier.override_fixed']) })
    ]);
  }
  function buildViewModel(options = {}) {
    const category = text(options.category);
    const name = text(options.name);
    const sourceTexts = (Array.isArray(options.sourceTexts) ? options.sourceTexts : []).map(text).filter(Boolean);
    const summary = evaluator.getEntityClauseSummary(category, name);
    const reviewed = summary.reviewedCases.filter(row => sourceMatches(row?.clause?.evidence?.rawText, sourceTexts));
    const generated = summary.generatedConditionals.filter(row => sourceMatches(row?.rawText, sourceTexts));
    const bySource = new Map();
    reviewed.forEach(row => {
      const sourceUnitId = text(row?.clause?.evidence?.sourceUnitId) || row.caseId;
      if (!bySource.has(sourceUnitId)) bySource.set(sourceUnitId, []);
      bySource.get(sourceUnitId).push(row);
    });
    const groups = [...bySource.entries()].map(([sourceUnitId, cases]) => {
      const special = yuanTacticRows(cases.map(row => row.caseId));
      return Object.freeze({
        sourceUnitId,
        caseIds: Object.freeze(cases.map(row => row.caseId)),
        rows: special || Object.freeze(cases.map(defaultRow)),
        rawText: text(cases[0]?.clause?.evidence?.rawText)
      });
    });
    return Object.freeze({
      category,
      name,
      groups: Object.freeze(groups),
      reviewedCaseCount: reviewed.length,
      generatedConditionalCount: generated.length,
      fallback: !reviewed.length && generated.length > 0,
      empty: !reviewed.length && !generated.length
    });
  }
  function renderHtml(options = {}) {
    const view = buildViewModel(options);
    if (view.empty) return '';
    if (view.fallback) {
      return `<div class="detail-condition-fallback" data-condition-trust="generated"><strong>原文表示</strong><span>構造化確認中の条件が${view.generatedConditionalCount}件あります。未確認データを推測せず、原文を表示しています。</span></div>`;
    }
    const groupsHtml = view.groups.map(group => {
      const rows = group.rows.map(row => {
        const conditionHtml = row.conditions.map(label => `<span class="detail-condition-chip">${esc(label)}</span>`).join('');
        const semanticHtml = row.semanticTypes.map(type => `<span class="detail-semantic-chip" title="${esc(type)}">${esc(TYPE_LABELS[type] || type)}</span>`).join('');
        return `<li class="detail-condition-row" data-case-ids="${esc(row.caseIds.join(' '))}"><div class="detail-condition-when">${conditionHtml}</div><div class="detail-condition-effect">${esc(row.effectText)}</div>${semanticHtml ? `<div class="detail-condition-semantics">${semanticHtml}</div>` : ''}</li>`;
      }).join('');
      return `<section class="detail-condition-group" data-source-unit="${esc(group.sourceUnitId)}"><ul class="detail-condition-list">${rows}</ul><details class="detail-condition-raw"><summary>原文を表示</summary><div>${esc(group.rawText)}</div></details></section>`;
    }).join('');
    return `<div class="detail-condition-card" data-condition-trust="reviewed"><div class="detail-condition-card-head"><strong>条件と効果</strong><span>確認済み ${view.reviewedCaseCount}件</span></div>${groupsHtml}</div>`;
  }

  return Object.freeze({ TYPE_LABELS, buildViewModel, renderHtml });
});
