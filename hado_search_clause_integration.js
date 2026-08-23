/* Hado Library 3.1 Update06: shared EffectClause search/status integration. */
(function initHadoSearchClauseIntegration(root, factory) {
  'use strict';
  const evaluator = root?.HADO_FORMATION_CONDITION_EVALUATOR || (typeof require === 'function' ? require('./hado_formation_condition_evaluator.js') : null);
  const presenter = root?.HADO_DETAIL_CONDITION_PRESENTER || (typeof require === 'function' ? require('./hado_detail_condition_presenter.js') : null);
  const api = factory(evaluator, presenter);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HADO_SEARCH_CLAUSE_INTEGRATION = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSearchClauseIntegration(evaluator, presenter) {
  'use strict';

  if (!evaluator) throw new Error('HADO_FORMATION_CONDITION_EVALUATOR is required');
  if (!presenter) throw new Error('HADO_DETAIL_CONDITION_PRESENTER is required');

  let ready = false;
  let cacheKey = '';
  let featureRowsByEntity = new Map();
  let statusKeysByName = new Map();
  let summaryCache = new Map();
  let diagnostic = Object.freeze({ ready: false });

  function text(value) { return String(value == null ? '' : value).trim(); }
  function comparableName(value) {
    return text(value).normalize('NFKC').replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').replace(/^(?:LR|UR|SSR|SR|R|N)\s*/i, '').replace(/[・･\s]/g, '');
  }
  function normalizeCategory(value) {
    const key = text(value);
    return ({ status_effects: 'statusEffects', siege_weapons: 'siegeWeapons', ethnic_armaments: 'ethnicArmaments', warhorse_skills: 'warhorseSkills' })[key] || key;
  }
  function entityKey(category, name) { return `${normalizeCategory(category)}@@${comparableName(name)}`; }
  function items(raw) { return Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []); }
  function addMapSet(map, key, value) {
    if (!key || !value) return;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(value);
  }
  function normalizedEvidence(value) { return text(value).normalize('NFKC').replace(/[\s■▼●→。、，,.（）()]/g, ''); }
  function evidenceMatches(a, b) {
    const left = normalizedEvidence(a), right = normalizedEvidence(b);
    if (left.length < 6 || right.length < 6) return false;
    return left.includes(right) || right.includes(left);
  }
  function statusNameKeys(value) {
    const name = comparableName(value);
    return name ? new Set(statusKeysByName.get(name) || []) : new Set();
  }
  function freezeRefs(rows) {
    return Object.freeze(rows.map(row => Object.freeze({
      statusEffectKey: text(row.statusEffectKey),
      statusEffectName: text(row.statusEffectName || row.label),
      groupKey: text(row.groupKey),
      groupLabel: text(row.groupLabel),
      featureId: text(row.featureId),
      matchedText: text(row.matchedText || row.rawText),
      sourcePartType: text(row.sourcePartType),
      canonicalFeatureKey: text(row.canonicalFeatureKey)
    })));
  }

  function indexData(options = {}) {
    const clauseData = options.effectClauses || null;
    const featureData = options.typeSearchFeatureIndex || null;
    const relatedData = options.relatedLinkIndex || null;
    const statusData = options.statusEffects || null;
    if (!clauseData || clauseData.kind !== 'effect_clause_index') throw new Error('Update06 requires hadou_effect_clauses.json');
    const featureRows = items(featureData);
    if (!featureRows.length) throw new Error('Update06 requires hadou_type_search_feature_index.json');
    featureRowsByEntity = new Map();
    statusKeysByName = new Map();
    summaryCache = new Map();
    function addEntityRefs(row, refs) {
      if (!refs.length) return;
      const key = entityKey(row.category, row.name);
      const existing = featureRowsByEntity.get(key) || [];
      const seen = new Set(existing.map(ref => [text(ref.statusEffectKey), text(ref.matchedText || ref.rawText), text(ref.sourcePartType)].join('@@')));
      for (const ref of refs) {
        const signature = [text(ref.statusEffectKey), text(ref.matchedText || ref.rawText), text(ref.sourcePartType)].join('@@');
        if (!seen.has(signature)) { seen.add(signature); existing.push(ref); }
        addMapSet(statusKeysByName, comparableName(ref.statusEffectName || ref.label || ref.name), text(ref.statusEffectKey));
      }
      featureRowsByEntity.set(key, existing);
    }
    for (const row of featureRows) {
      const refs = (Array.isArray(row?.statusEffectRefs) ? row.statusEffectRefs : []).filter(ref => text(ref?.statusEffectKey) && text(ref?.statusEffectName || ref?.label));
      addEntityRefs(row, refs);
    }
    for (const row of items(relatedData)) {
      const refs = (Array.isArray(row?.related?.statusEffects) ? row.related.statusEffects : []).filter(ref => text(ref?.statusEffectKey) && text(ref?.statusEffectName || ref?.name || ref?.displayName)).map(ref => ({ ...ref, statusEffectName: ref.statusEffectName || ref.name || ref.displayName }));
      addEntityRefs(row, refs);
    }
    const canonicalStatusRefCount = [...featureRowsByEntity.values()].reduce((sum, refs) => sum + refs.length, 0);
    for (const row of items(statusData)) {
      const name = comparableName(row?.statusDisplayName || row?.name || row?.title);
      if (!name) continue;
      const candidates = [row?.statusEffectKey, row?.canonicalStatusEffectKey, row?.id].map(text).filter(value => /^statusEffects:/.test(value));
      candidates.forEach(value => addMapSet(statusKeysByName, name, value));
    }
    const reviewedEntities = new Set();
    const conditionTags = new Set();
    const triggerTags = new Set();
    let clauseLinkedStatusRefCount = 0;
    for (const row of Array.isArray(clauseData.reviewedCases) ? clauseData.reviewedCases : []) {
      const clause = row?.clause || {};
      reviewedEntities.add(entityKey(clause?.evidence?.category, clause?.evidence?.entity));
    }
    for (const key of reviewedEntities) {
      const splitAt = key.indexOf('@@');
      const category = key.slice(0, splitAt);
      const entityName = key.slice(splitAt + 2);
      const view = presenter.buildViewModel({ category, name: entityName });
      view.groups.forEach(group => group.rows.forEach(row => {
        row.conditions.filter(label => label && label !== '常時').forEach(label => conditionTags.add(`条件:${label}`));
        row.semanticTypes.filter(type => type.startsWith('trigger.')).forEach(type => triggerTags.add(`発動:${presenter.TYPE_LABELS[type] || type}`));
      }));
      const clauses = evaluator.getEntityClauseSummary(category, entityName).reviewedCases;
      const refs = featureRowsByEntity.get(key) || [];
      refs.forEach(ref => {
        if (clauses.some(reviewed => evidenceMatches(reviewed?.clause?.evidence?.rawText, ref?.matchedText || ref?.rawText))) clauseLinkedStatusRefCount++;
      });
    }
    cacheKey = [text(featureData?.dataSetId || featureData?.meta?.dataSetId), text(relatedData?.dataSetId || relatedData?.meta?.dataSetId), text(clauseData?.contractVersion), Number(clauseData?.reviewedCaseCount || 0), canonicalStatusRefCount].join('|');
    ready = true;
    diagnostic = Object.freeze({
      ready: true,
      contractVersion: text(clauseData.contractVersion),
      reviewedCaseCount: Number(clauseData.reviewedCaseCount || 0),
      reviewedEntityCount: reviewedEntities.size,
      conditionTagCount: conditionTags.size,
      triggerTagCount: triggerTags.size,
      canonicalStatusRefCount,
      canonicalStatusKeyCount: new Set([...statusKeysByName.values()].flatMap(set => [...set])).size,
      clauseLinkedStatusRefCount,
      cacheKey,
      policy: 'reviewed EffectClause supplies condition/trigger tags; canonical statusEffectKey supplies direct status matching; generated clauses remain raw-text fallback only'
    });
    return diagnostic;
  }

  function getEntitySummary(category, name) {
    const key = entityKey(category, name);
    if (summaryCache.has(key)) return summaryCache.get(key);
    const clauseSummary = evaluator.getEntityClauseSummary(normalizeCategory(category), name);
    const view = presenter.buildViewModel({ category: normalizeCategory(category), name });
    const tags = [];
    const semanticTypes = new Set();
    view.groups.forEach(group => group.rows.forEach(row => {
      row.conditions.filter(label => label && label !== '常時').forEach(label => tags.push(`条件:${label}`));
      row.semanticTypes.forEach(type => {
        semanticTypes.add(type);
        if (type.startsWith('trigger.')) tags.push(`発動:${presenter.TYPE_LABELS[type] || type}`);
      });
    }));
    const statusRefs = freezeRefs(featureRowsByEntity.get(key) || []);
    const reviewedEvidence = clauseSummary.reviewedCases.map(row => row?.clause?.evidence?.rawText).filter(Boolean);
    const clauseLinkedStatusRefs = Object.freeze(statusRefs.filter(ref => reviewedEvidence.some(raw => evidenceMatches(raw, ref.matchedText))));
    const summary = Object.freeze({
      ready,
      category: normalizeCategory(category),
      name: text(name),
      trust: view.reviewedCaseCount > 0 ? 'reviewed' : (view.generatedConditionalCount > 0 ? 'generated' : 'none'),
      reviewedCaseCount: view.reviewedCaseCount,
      generatedConditionalCount: view.generatedConditionalCount,
      tags: Object.freeze([...new Set(tags)]),
      semanticTypes: Object.freeze([...semanticTypes]),
      statusEffectRefs: statusRefs,
      clauseLinkedStatusRefs,
      statusEffectKeys: Object.freeze([...new Set(statusRefs.map(ref => ref.statusEffectKey).filter(Boolean))])
    });
    summaryCache.set(key, summary);
    return summary;
  }

  function getEntityTags(category, name) { return getEntitySummary(category, name).tags; }
  function getEntitySearchText(category, name) {
    const summary = getEntitySummary(category, name);
    const status = summary.statusEffectRefs.flatMap(ref => [ref.statusEffectName, ref.statusEffectKey]);
    return [...summary.tags, ...status].join(' ').toLowerCase();
  }
  function getCanonicalStatusMatches(options = {}) {
    const statusName = text(options.statusName || options.label);
    const keys = statusNameKeys(statusName);
    if (!keys.size) return Object.freeze([]);
    const group = text(options.groupKey || options.group);
    const summary = getEntitySummary(options.category, options.name);
    return Object.freeze(summary.statusEffectRefs.filter(ref => keys.has(ref.statusEffectKey) && (!group || !ref.groupKey || ref.groupKey === group)).map(ref => Object.freeze({
      name: ref.statusEffectName,
      statusEffectKey: ref.statusEffectKey,
      groupKey: ref.groupKey,
      relationType: '',
      reason: 'canonical-status-effect-id',
      sourceText: ref.matchedText || ref.statusEffectName,
      matchedText: ref.matchedText || ref.statusEffectName,
      targetSide: '',
      canonical: true
    })));
  }
  return Object.freeze({ indexData, getDiagnostic: () => diagnostic, getCacheKey: () => cacheKey, getEntitySummary, getEntityTags, getEntitySearchText, getCanonicalStatusMatches });
});
