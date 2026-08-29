/* Hado Library 3.1 Update05: formation adapter for the shared EffectClause evaluator. */
(function initHadoFormationConditionEvaluator(root, factory) {
  'use strict';
  const model = root?.HADO_CONDITION_MODEL || (typeof require === 'function' ? require('./hado_condition_model.js') : null);
  const api = factory(model);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HADO_FORMATION_CONDITION_EVALUATOR = api;
})(typeof window !== 'undefined' ? window : globalThis, function createFormationConditionEvaluator(model) {
  'use strict';

  if (!model) throw new Error('HADO_CONDITION_MODEL is required');

  const RUNTIME_REGISTRY_ROWS = Object.freeze([
    ['condition.placement_role','condition','formation'],
    ['condition.formation_membership','condition','formation'],
    ['condition.troop_type','condition','formation'],
    ['condition.general_identity_set','condition','formation'],
    ['condition.affinity','condition','formation'],
    ['condition.formation_stat_threshold','condition','formation'],
    ['condition.component_state','condition','formation'],
    ['condition.troop_threshold','condition','battle'],
    ['condition.stat_comparison','condition','battle'],
    ['condition.status_presence_count','condition','battle'],
    ['condition.skill_level','condition','formation'],
    ['condition.star_rank','condition','formation'],
    ['condition.count_threshold','condition','universal'],
    ['condition.probability','condition','battle'],
    ['condition.target_relation','condition','battle'],
    ['condition.entity_state_relation','condition','battle'],
    ['trigger.sortie','trigger','battle'],
    ['trigger.engagement_start','trigger','battle'],
    ['trigger.tactic_activation','trigger','battle'],
    ['trigger.normal_attack','trigger','battle'],
    ['trigger.pre_attack_or_hit','trigger','battle'],
    ['trigger.critical_hit','trigger','battle'],
    ['trigger.siege_action','trigger','battle'],
    ['trigger.status_change','trigger','battle'],
    ['trigger.damage_event','trigger','battle'],
    ['trigger.custom_event','trigger','battle'],
    ['context.always','context','universal'],
    ['context.appointment','context','external'],
    ['modifier.multiplier','modifier','metadata'],
    ['modifier.stat_scaling','modifier','metadata'],
    ['modifier.override_fixed','modifier','metadata'],
    ['modifier.additive','modifier','metadata'],
    ['modifier.cap_floor','modifier','metadata'],
    ['modifier.conditional_adjustment','modifier','metadata'],
    ['limit.activation_count','limit','metadata'],
    ['limit.duration','limit','metadata'],
    ['limit.upper_lower_bound','limit','metadata'],
    ['reset.cumulative','reset','metadata'],
    ['reset.reset_or_expire','reset','metadata'],
    ['suppression.activation_suppression','suppression','battle'],
    ['suppression.exception','suppression','metadata'],
    ['suppression.ignore_or_avoid','suppression','battle'],
    ['targeting.priority','targeting','metadata'],
    ['targeting.target_count','targeting','metadata']
  ]);
  const RUNTIME_REGISTRY = Object.freeze({
    schemaVersion: '1.0',
    itemCount: RUNTIME_REGISTRY_ROWS.length,
    items: Object.freeze(RUNTIME_REGISTRY_ROWS.map(([type, group, phase]) => Object.freeze({ type, group, phase })))
  });
  const REGISTRY_INDEX = model.createRegistryIndex(RUNTIME_REGISTRY);
  const RESULT_LABELS = Object.freeze({
    met: '成立',
    unmet: '不成立',
    deferred: '戦闘中判定',
    not_applicable: '対象外',
    unknown: '判定不可'
  });
  const RESULT_ORDER = Object.freeze(['unmet','met','deferred','not_applicable','unknown']);

  let clauseData = null;
  let reviewedByEntity = new Map();
  let generatedConditionalCountByEntity = new Map();
  let generatedConditionalRowsByEntity = new Map();

  function text(value) { return String(value == null ? '' : value).trim(); }
  function comparableName(value) {
    return text(value).replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').replace(/^(?:LR|UR|SSR|SR|R|N)\s*/i, '').replace(/[・･\s]/g, '');
  }
  function recordName(value) { return text(value).normalize('NFKC').replace(/\s+/g, ''); }
  function entityKey(category, name) { return `${text(category)}@@${recordName(name)}`; }
  function hasConditionalExpression(clause) {
    const contextType = clause?.context?.op === 'predicate' ? text(clause.context.type) : '';
    return !!clause?.trigger || !!clause?.when || (!!clause?.context && contextType !== 'context.always');
  }
  function indexClauseData(data) {
    if (!data || data.kind !== 'effect_clause_index') throw new Error('hadou_effect_clauses.json kind is invalid');
    if (data.contractVersion !== 'app-3.1.0.0-update05') throw new Error(`EffectClause contract is outdated: ${data.contractVersion || 'missing'}`);
    if (data.qualityAudit?.ok !== true) throw new Error('EffectClause quality audit failed');
    if (!Array.isArray(data.reviewedCases) || Number(data.reviewedCaseCount) !== data.reviewedCases.length || data.reviewedCases.length !== 44) throw new Error('EffectClause reviewedCases must contain 44 exact gold cases');
    const nextReviewed = new Map();
    for (const row of data.reviewedCases) {
      const clause = row?.clause;
      const validation = model.validateEffectClause(clause, REGISTRY_INDEX);
      if (!validation.ok || clause?.trust?.state !== 'reviewed') throw new Error(`invalid reviewed EffectClause: ${row?.caseId || 'unknown'}`);
      const key = entityKey(clause.evidence?.category, clause.evidence?.entity);
      if (!nextReviewed.has(key)) nextReviewed.set(key, []);
      nextReviewed.get(key).push(Object.freeze({ caseId: text(row.caseId), clause }));
    }
    const nextGenerated = new Map();
    const nextGeneratedRows = new Map();
    for (const item of Array.isArray(data.items) ? data.items : []) {
      const rows = (Array.isArray(item?.clauses) ? item.clauses : []).filter(hasConditionalExpression).map(clause => Object.freeze({
        sourceUnitId: text(clause?.evidence?.sourceUnitId),
        rawText: text(clause?.evidence?.rawText)
      }));
      if (rows.length) {
        const key = entityKey(item.category, item.name);
        nextGenerated.set(key, rows.length);
        nextGeneratedRows.set(key, Object.freeze(rows));
      }
    }
    clauseData = data;
    reviewedByEntity = nextReviewed;
    generatedConditionalCountByEntity = nextGenerated;
    generatedConditionalRowsByEntity = nextGeneratedRows;
    return getDataStatus();
  }
  function getDataStatus() {
    return Object.freeze({
      ready: !!clauseData,
      contractVersion: text(clauseData?.contractVersion),
      reviewedCaseCount: Number(clauseData?.reviewedCaseCount || 0),
      sourceRecordCount: Number(clauseData?.itemCount || 0),
      clauseCount: Number(clauseData?.clauseCount || 0)
    });
  }
  function getEntityClauseSummary(category, name) {
    const key = entityKey(category, name);
    return Object.freeze({
      category: text(category),
      name: text(name),
      reviewedCases: Object.freeze([...(reviewedByEntity.get(key) || [])]),
      generatedConditionalCount: Number(generatedConditionalCountByEntity.get(key) || 0),
      generatedConditionals: Object.freeze([...(generatedConditionalRowsByEntity.get(key) || [])])
    });
  }
  function memberFacts(snapshot, member) {
    const facts = {
      'context.always': true,
      'formation.role': text(member?.role),
      'formation.affinity': text(member?.affinity),
      'formation.generalNames': Array.isArray(snapshot?.generalNames) ? snapshot.generalNames.map(comparableName).filter(Boolean) : [],
      'formation.troopType': text(snapshot?.troopType),
      'formation.components.siegeWeapon.alive': !!snapshot?.siegeWeaponConfigured,
      'runtime.count': Number(member?.affinityCount || 0)
    };
    if (Number.isFinite(Number(member?.starRank))) facts['formation.starRank'] = Number(member.starRank);
    if (Number.isFinite(Number(member?.skillLevel))) facts['formation.skillLevel'] = Number(member.skillLevel);
    for (const [key, value] of Object.entries(snapshot?.stats || {})) if (Number.isFinite(Number(value))) facts[`formation.stats.${key}`] = Number(value);
    return facts;
  }
  function evaluateReviewedCase(row, snapshot, member) {
    const evaluation = model.evaluateClause(row.clause, { surface: 'formation', facts: memberFacts(snapshot, member) }, REGISTRY_INDEX);
    return Object.freeze({
      caseId: row.caseId,
      clauseId: text(row.clause.id),
      sourceName: text(member?.name),
      sourceRole: text(member?.role),
      state: evaluation.state,
      label: RESULT_LABELS[evaluation.state] || RESULT_LABELS.unknown,
      reason: evaluation.reason,
      rawText: text(row.clause.evidence?.rawText),
      rawTextSha256: text(row.clause.evidence?.rawTextSha256),
      trust: 'reviewed',
      effectIdentity: text(row.clause.effect?.identity),
      clause: row.clause,
      details: evaluation.details || {}
    });
  }
  function evaluateFormation(snapshot) {
    if (!clauseData) return Object.freeze({ ok: false, counts: { unknown: 1 }, rows: [], unresolved: [], status: getDataStatus(), error: 'EffectClause data is not loaded' });
    const members = Array.isArray(snapshot?.members) ? snapshot.members.filter(member => text(member?.name)) : [];
    const rows = [];
    const unresolved = [];
    for (const member of members) {
      const key = entityKey('generals', member.name);
      const reviewed = reviewedByEntity.get(key) || [];
      reviewed.filter(row => hasConditionalExpression(row.clause)).forEach(row => rows.push(evaluateReviewedCase(row, snapshot, member)));
      const generatedCount = Number(generatedConditionalCountByEntity.get(key) || 0);
      const unresolvedCount = Math.max(0, generatedCount - reviewed.length);
      if (unresolvedCount) unresolved.push(Object.freeze({ sourceName: text(member.name), sourceRole: text(member.role), state: 'unknown', label: RESULT_LABELS.unknown, count: unresolvedCount, reason: 'generated_clause_not_reviewed' }));
    }
    rows.sort((a, b) => RESULT_ORDER.indexOf(a.state) - RESULT_ORDER.indexOf(b.state) || a.sourceName.localeCompare(b.sourceName, 'ja') || a.caseId.localeCompare(b.caseId));
    const counts = Object.fromEntries(model.RESULT_STATES.map(state => [state, rows.filter(row => row.state === state).length]));
    counts.unknown += unresolved.reduce((sum, row) => sum + row.count, 0);
    return Object.freeze({ ok: true, rows, unresolved, counts: Object.freeze(counts), status: getDataStatus(), evaluatedMemberCount: members.length });
  }

  function evaluateFormationScoreClauses(snapshot) {
    if (!clauseData) return Object.freeze({ ok: false, counts: { unknown: 1 }, rows: [], unresolved: [], status: getDataStatus(), error: 'EffectClause data is not loaded' });
    const members = Array.isArray(snapshot?.members) ? snapshot.members.filter(member => text(member?.name)) : [];
    const rows = [];
    const unresolved = [];
    for (const member of members) {
      const key = entityKey('generals', member.name);
      const reviewed = reviewedByEntity.get(key) || [];
      reviewed.forEach(row => rows.push(evaluateReviewedCase(row, snapshot, member)));
      const generatedCount = Number(generatedConditionalCountByEntity.get(key) || 0);
      const unresolvedCount = Math.max(0, generatedCount - reviewed.length);
      if (unresolvedCount) unresolved.push(Object.freeze({ sourceName: text(member.name), sourceRole: text(member.role), state: 'unknown', label: RESULT_LABELS.unknown, count: unresolvedCount, reason: 'generated_clause_not_reviewed' }));
    }
    rows.sort((a, b) => RESULT_ORDER.indexOf(a.state) - RESULT_ORDER.indexOf(b.state) || a.sourceName.localeCompare(b.sourceName, 'ja') || a.caseId.localeCompare(b.caseId));
    const counts = Object.fromEntries(model.RESULT_STATES.map(state => [state, rows.filter(row => row.state === state).length]));
    counts.unknown += unresolved.reduce((sum, row) => sum + row.count, 0);
    return Object.freeze({ ok: true, rows, unresolved, counts: Object.freeze(counts), status: getDataStatus(), evaluatedMemberCount: members.length });
  }

  return Object.freeze({
    RUNTIME_REGISTRY,
    RESULT_LABELS,
    comparableName,
    indexClauseData,
    getDataStatus,
    getEntityClauseSummary,
    evaluateFormation,
    evaluateFormationScoreClauses
  });
});
