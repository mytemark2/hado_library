/* Hado Library 3.1 Update08: one EffectClause/Evaluator projection for every UI surface. */
(function initHadoClauseSurfaceBridge(root, factory) {
  'use strict';
  const evaluator = root?.HADO_FORMATION_CONDITION_EVALUATOR || (typeof require === 'function' ? require('./hado_formation_condition_evaluator.js') : null);
  const presenter = root?.HADO_DETAIL_CONDITION_PRESENTER || (typeof require === 'function' ? require('./hado_detail_condition_presenter.js') : null);
  const search = root?.HADO_SEARCH_CLAUSE_INTEGRATION || (typeof require === 'function' ? require('./hado_search_clause_integration.js') : null);
  const api = factory(evaluator, presenter, search);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HADO_CLAUSE_SURFACE_BRIDGE = api;
})(typeof window !== 'undefined' ? window : globalThis, function createClauseSurfaceBridge(evaluator, presenter, search) {
  'use strict';

  if (!evaluator) throw new Error('HADO_FORMATION_CONDITION_EVALUATOR is required');
  if (!presenter) throw new Error('HADO_DETAIL_CONDITION_PRESENTER is required');
  if (!search) throw new Error('HADO_SEARCH_CLAUSE_INTEGRATION is required');

  const CONTRACT_VERSION = '3.1.0.0-update08-surface-v1';
  const TARGET_LABELS = Object.freeze({
    self: '自身', self_troop: '自部隊', allied_troops: '味方部隊', enemy_troops: '敵部隊',
    source_defined: '', appointment: '任命先', unknown: '対象不明'
  });
  let ready = false;
  let clauseData = null;
  let reviewedByEntity = new Map();
  let projectionCache = new Map();
  let runtimeDiagnostic = { formationEvaluations: 0, evidenceLinks: 0, typeSearchLinks: 0 };

  function text(value) { return String(value == null ? '' : value).trim(); }
  function comparableName(value) { return evaluator.comparableName ? evaluator.comparableName(value) : text(value).normalize('NFKC').replace(/（[^）]*）|\([^)]*\)/g, '').replace(/^(?:LR|UR|SSR|SR|R|N)\s*/i, '').replace(/[・･\s]/g, ''); }
  function normalizeCategory(value) { const key = text(value); return ({ status_effects: 'statusEffects', siege_weapons: 'siegeWeapons', ethnic_armaments: 'ethnicArmaments', warhorse_skills: 'warhorseSkills' })[key] || key; }
  function entityKey(category, name) { return `${normalizeCategory(category)}@@${comparableName(name)}`; }
  function projectionKey(category, name) { return `${normalizeCategory(category)}@@${text(name).normalize('NFKC').replace(/\s+/g, '')}`; }
  function normalizedEvidence(value) { return text(value).normalize('NFKC').replace(/[\s■▼●→。、，,.（）()％%]/g, ''); }
  function evidenceMatches(left, right) {
    const a = normalizedEvidence(left), b = normalizedEvidence(right);
    if (a.length < 6 || b.length < 6) return false;
    return a.includes(b) || b.includes(a);
  }
  function unique(values) { return [...new Set((values || []).map(text).filter(Boolean))]; }
  function freezeClause(row, displayRow = null) {
    const clause = row?.clause || {};
    return Object.freeze({
      caseId: text(row?.caseId), clauseId: text(clause.id), category: normalizeCategory(clause?.evidence?.category),
      entityName: text(clause?.evidence?.entity), sourceUnitId: text(clause?.evidence?.sourceUnitId),
      conditions: Object.freeze(unique(displayRow?.conditions || [])), semanticTypes: Object.freeze(unique(displayRow?.semanticTypes || [])),
      targetScope: text(clause?.target?.scope) || 'unknown', targetLabel: TARGET_LABELS[text(clause?.target?.scope)] ?? '',
      effectIdentity: text(clause?.effect?.identity), effectKind: text(clause?.effect?.kind), effectText: text(displayRow?.effectText),
      rawText: text(clause?.evidence?.rawText), rawTextSha256: text(clause?.evidence?.rawTextSha256), trust: text(clause?.trust?.state)
    });
  }

  function indexData(options = {}) {
    const data = options.effectClauses;
    if (!data || data.kind !== 'effect_clause_index' || !Array.isArray(data.reviewedCases)) throw new Error('Update08 requires reviewed EffectClause data');
    clauseData = data;
    reviewedByEntity = new Map();
    projectionCache = new Map();
    for (const row of data.reviewedCases) {
      const key = entityKey(row?.clause?.evidence?.category, row?.clause?.evidence?.entity);
      if (!reviewedByEntity.has(key)) reviewedByEntity.set(key, []);
      reviewedByEntity.get(key).push(row);
    }
    ready = true;
    return getDiagnostic();
  }

  function getEntityProjection(category, name) {
    const normalizedCategory = normalizeCategory(category);
    const reviewedKey = entityKey(normalizedCategory, name);
    const cacheKey = projectionKey(normalizedCategory, name);
    if (projectionCache.has(cacheKey)) return projectionCache.get(cacheKey);
    const presenterView = presenter.buildViewModel({ category: normalizedCategory, name });
    const searchView = search.getEntitySummary(normalizedCategory, name);
    const displayByCase = new Map();
    for (const group of presenterView.groups || []) for (const row of group.rows || []) for (const caseId of row.caseIds || []) displayByCase.set(caseId, row);
    const clauses = Object.freeze((reviewedByEntity.get(reviewedKey) || []).map(row => freezeClause(row, displayByCase.get(text(row.caseId)))));
    const projection = Object.freeze({
      contractVersion: CONTRACT_VERSION, ready, category: normalizedCategory, name: text(name), clauses,
      reviewedCaseCount: clauses.length, generatedConditionalCount: Number(searchView?.generatedConditionalCount || 0),
      searchTags: Object.freeze([...(searchView?.tags || [])]), statusEffectKeys: Object.freeze([...(searchView?.statusEffectKeys || [])]),
      surfaceCounts: Object.freeze({ detail: Number(presenterView.reviewedCaseCount || 0), search: Number(searchView?.reviewedCaseCount || 0), canonical: clauses.length }),
      consistent: clauses.length === Number(presenterView.reviewedCaseCount || 0) && clauses.length === Number(searchView?.reviewedCaseCount || 0)
    });
    projectionCache.set(cacheKey, projection);
    return projection;
  }

  function enrichEvaluation(result) {
    const rows = Object.freeze((result?.rows || []).map(row => {
      const surfaceClause = getEntityProjection('generals', row.sourceName).clauses.find(clause => clause.caseId === text(row.caseId)) || null;
      return Object.freeze({ ...row, surfaceClause });
    }));
    return Object.freeze({ ...(result || {}), rows });
  }
  function evaluateFormation(snapshot) {
    const conditionalResult = enrichEvaluation(evaluator.evaluateFormation(snapshot));
    const scoreResult = enrichEvaluation(typeof evaluator.evaluateFormationScoreClauses === 'function' ? evaluator.evaluateFormationScoreClauses(snapshot) : evaluator.evaluateFormation(snapshot));
    const rowsByCaseId = Object.freeze(Object.fromEntries(scoreResult.rows.map(row => [text(row.caseId), row])));
    runtimeDiagnostic = { ...runtimeDiagnostic, formationEvaluations: runtimeDiagnostic.formationEvaluations + 1 };
    return Object.freeze({ contractVersion: CONTRACT_VERSION, snapshot, conditionalResult, scoreResult, rows: scoreResult.rows, rowsByCaseId });
  }

  function linkEvidence(evidence, formationProjection = null, category = 'generals', name = '') {
    const raw = text(evidence?.rawText || evidence?.matchedText || evidence?.sourceText);
    const sourceName = text(evidence?.sourceName || evidence?.entityName || name);
    const candidates = formationProjection?.rows || getEntityProjection(category, sourceName).clauses;
    const links = [];
    for (const candidate of candidates || []) {
      const clause = candidate.surfaceClause || candidate;
      if (!clause || !evidenceMatches(raw, clause.rawText)) continue;
      if (sourceName && comparableName(sourceName) && comparableName(clause.entityName) && comparableName(sourceName) !== comparableName(clause.entityName) && !comparableName(sourceName).includes(comparableName(clause.entityName))) continue;
      links.push(Object.freeze({
        caseId: clause.caseId, clauseId: clause.clauseId, state: text(candidate.state), stateLabel: text(candidate.label),
        conditions: clause.conditions, targetScope: clause.targetScope, targetLabel: clause.targetLabel,
        effectIdentity: clause.effectIdentity, effectText: clause.effectText, entityName: clause.entityName, rawTextSha256: clause.rawTextSha256
      }));
    }
    runtimeDiagnostic = { ...runtimeDiagnostic, evidenceLinks: runtimeDiagnostic.evidenceLinks + links.length };
    return Object.freeze(links);
  }
  function getFormationClauseLinks(formationProjection, options = {}) {
    const effectTextIncludes = text(options.effectTextIncludes);
    const output = [];
    for (const candidate of formationProjection?.rows || []) {
      const clause = candidate.surfaceClause;
      if (!clause || (effectTextIncludes && !clause.effectText.includes(effectTextIncludes))) continue;
      output.push(Object.freeze({
        caseId: clause.caseId, clauseId: clause.clauseId, state: text(candidate.state), stateLabel: text(candidate.label),
        conditions: clause.conditions, targetScope: clause.targetScope, targetLabel: clause.targetLabel,
        effectIdentity: clause.effectIdentity, effectText: clause.effectText, entityName: clause.entityName, rawTextSha256: clause.rawTextSha256
      }));
    }
    return Object.freeze(output);
  }
  function linkFormationEffects(effects, formationProjection) {
    const seen = new Set(), output = [];
    for (const effect of Array.isArray(effects) ? effects : []) {
      for (const link of linkEvidence(effect, formationProjection)) {
        const key = `${link.caseId}|${link.state}`;
        if (!seen.has(key)) { seen.add(key); output.push(link); }
      }
    }
    return Object.freeze(output);
  }
  function annotateTypeSearchHits(category, name, hits) {
    const rows = (hits || []).map(hit => Object.freeze({ ...hit, clauseRefs: linkEvidence(hit, null, category, name) }));
    runtimeDiagnostic = { ...runtimeDiagnostic, typeSearchLinks: runtimeDiagnostic.typeSearchLinks + rows.reduce((sum, row) => sum + row.clauseRefs.length, 0) };
    return Object.freeze(rows);
  }
  function buildDetailPresentation(options = {}) {
    const view = presenter.buildViewModel(options);
    return Object.freeze({ view, html: presenter.renderHtml(options), projection: getEntityProjection(options.category, options.name) });
  }
  function getDiagnostic() {
    const projections = [...projectionCache.values()];
    return Object.freeze({ contractVersion: CONTRACT_VERSION, ready, reviewedCaseCount: Number(clauseData?.reviewedCaseCount || 0), reviewedEntityCount: reviewedByEntity.size, inconsistentProjectionCount: projections.filter(row => !row.consistent).length, ...runtimeDiagnostic });
  }

  return Object.freeze({
    CONTRACT_VERSION, RESULT_LABELS: evaluator.RESULT_LABELS, indexData, getDiagnostic, getEntityProjection, evaluateFormation,
    linkEvidence, linkFormationEffects, getFormationClauseLinks, annotateTypeSearchHits, buildDetailPresentation,
    getEntityTags: (category, name) => getEntityProjection(category, name).searchTags,
    getCacheKey: () => `${CONTRACT_VERSION}|${search.getCacheKey ? search.getCacheKey() : ''}`,
    getEntitySearchText: (category, name) => search.getEntitySearchText(category, name),
    getCanonicalStatusMatches: options => search.getCanonicalStatusMatches(options)
  });
});
