/* Hado Library 3.1 Update07: reviewed EffectClause -> scoreEvidence shadow adapter. */
(function initHadoUpdate07ScoreShadow(root, factory) {
  'use strict';
  const evidenceAdapter = root?.HadoTypeScoreEvidence || (typeof require === 'function' ? require('./hado_type_score_evidence.js') : null);
  const api = factory(evidenceAdapter);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HADO_UPDATE07_SCORE_SHADOW = api;
})(typeof window !== 'undefined' ? window : globalThis, function createUpdate07ScoreShadow(evidenceAdapter) {
  'use strict';

  if (!evidenceAdapter || typeof evidenceAdapter.normalizeRow !== 'function') throw new Error('HadoTypeScoreEvidence is required');

  const text = value => String(value == null ? '' : value).trim();
  const comparableName = value => text(value).replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').replace(/^(?:LR|UR|SSR|SR|R|N)\s*/i, '').replace(/[・･\s]/g, '');
  const scoreValue = score => Number(score?.totalScore ?? score?.conditionalMaxScore ?? score?.score ?? 0) || 0;

  function clauseIdentity(row) {
    return text(row?.clause?.effect?.identity || row?.effectIdentity || row?.clauseId || row?.caseId);
  }

  function clauseSource(row) {
    const clause = row?.clause || {};
    const evidence = clause.evidence || {};
    return {
      sourceEntityKey: text(evidence.sourceRecordId),
      canonicalFeatureKey: clauseIdentity(row),
      sourcePartType: 'effect_clause',
      sourceType: evidence.category === 'equipments' ? 'equipment' : 'skill',
      sourceLabel: `${text(evidence.entity || row?.sourceName)}:${text(row?.caseId)}`,
      sourceName: text(evidence.entity || row?.sourceName),
      rawText: text(evidence.rawText || row?.rawText),
      matchedText: text(evidence.rawText || row?.rawText),
      condition: text(clause?.when?.type || clause?.trigger?.type || clause?.context?.type),
      timing: clause?.trigger ? 'conditional' : (clause?.when || clause?.context ? 'conditional' : 'always'),
      targetScope: ['self','ally','enemy'].includes(text(clause?.target?.scope)) ? text(clause.target.scope) : 'unknown',
      roleGate: { scoreEligible: row?.state === 'met' },
      isPrimaryEffect: true,
      isDerivedTag: false,
      isAggregateMetric: false
    };
  }

  function build(options = {}) {
    const conditionResult = options.conditionResult || {};
    const reviewedRows = (Array.isArray(conditionResult.rows) ? conditionResult.rows : []).filter(row => row?.clause?.trust?.state === 'reviewed');
    const identityCounts = reviewedRows.reduce((map, row) => {
      const identity = clauseIdentity(row);
      map.set(identity, (map.get(identity) || 0) + 1);
      return map;
    }, new Map());
    const evidence = [];
    const excluded = [];
    const seen = new Set();
    for (const row of reviewedRows) {
      const identity = clauseIdentity(row);
      if (!identity || identityCounts.get(identity) > 1) {
        excluded.push({ caseId: text(row.caseId), sourceName: text(row.sourceName), state: text(row.state), reason: 'ambiguous_effect_identity', effectIdentity: identity });
        continue;
      }
      const normalized = evidenceAdapter.normalizeRow(clauseSource(row), { defaultTargetScope: 'unknown' }).filter(item => item.effectFamily && item.effectFamily !== 'unknown');
      if (!normalized.length) {
        excluded.push({ caseId: text(row.caseId), sourceName: text(row.sourceName), state: text(row.state), reason: 'effect_family_unmapped', effectIdentity: identity });
        continue;
      }
      for (const item of normalized) {
        const key = `${identity}|${item.effectFamily}`;
        if (seen.has(key)) {
          excluded.push({ caseId: text(row.caseId), sourceName: text(row.sourceName), state: text(row.state), reason: 'base_override_duplicate', effectIdentity: identity, effectFamily: item.effectFamily });
          continue;
        }
        seen.add(key);
        const projected = Object.assign({}, item, {
          evidenceId: `clause-shadow:${text(row.caseId)}:${item.effectFamily}`,
          evidenceGroupKey: key,
          rootEvidenceKey: key,
          sourceName: text(row.sourceName),
          sourceSlot: text(row.sourceRole),
          conditionState: text(row.state),
          conditionLabel: text(row.label),
          clauseId: text(row.clauseId),
          caseId: text(row.caseId),
          effectIdentity: identity,
          roleGate: { scoreEligible: row.state === 'met' }
        });
        if (row.state === 'met') evidence.push(projected);
        else excluded.push({ caseId: text(row.caseId), sourceName: text(row.sourceName), state: text(row.state), reason: `condition_${text(row.state)}`, effectIdentity: identity, effectFamily: item.effectFamily });
      }
    }
    const scorer = options.scorer;
    const rule = options.rule || null;
    const score = scorer && rule && typeof scorer.score === 'function' ? scorer.score({ roleId: 'formation_effects', scoreEvidence: evidence }, rule) : null;
    const legacyEvidence = Array.isArray(options.legacyEvidence) ? options.legacyEvidence : [];
    const reviewedNames = new Set(reviewedRows.map(row => comparableName(row.sourceName)).filter(Boolean));
    const legacyRowsInReviewedScope = legacyEvidence.filter(row => reviewedNames.has(comparableName(row.sourceName || row.sourceLabel?.split(':')?.[0])));
    const counts = excluded.reduce((acc, row) => (acc[row.reason] = (acc[row.reason] || 0) + 1, acc), {});
    const unresolvedCount = (conditionResult.unresolved || []).reduce((sum, row) => sum + Number(row?.count || 0), 0);
    const switchReady = reviewedRows.length > 0 && excluded.length === 0 && unresolvedCount === 0;
    return Object.freeze({
      schemaVersion: 'update07-score-shadow-v1',
      mode: 'shadow',
      activeScoreUnchanged: true,
      reviewedRowCount: reviewedRows.length,
      eligibleEvidenceCount: evidence.length,
      excludedEvidenceCount: excluded.length,
      excludedReasonCounts: Object.freeze(counts),
      unresolvedGeneratedClauseCount: unresolvedCount,
      legacyEvidenceCount: legacyEvidence.length,
      legacyEvidenceInReviewedScopeCount: legacyRowsInReviewedScope.length,
      legacyTotalScore: Number(options.legacyTotalScore || 0),
      shadowTotalScore: scoreValue(score),
      scoreDelta: scoreValue(score) - Number(options.legacyTotalScore || 0),
      switchReady,
      switchBlockReason: switchReady ? '' : 'reviewed_clause_projection_incomplete',
      evidence: Object.freeze(evidence),
      excluded: Object.freeze(excluded),
      score
    });
  }

  return Object.freeze({ build, clauseIdentity, clauseSource });
});
