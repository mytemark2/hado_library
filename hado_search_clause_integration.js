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
  let sourceTagsByEntity = new Map();
  let sourceTagEvidenceByEntity = new Map();
  let diagnostic = Object.freeze({ ready: false });

  function text(value) { return String(value == null ? '' : value).trim(); }
  function comparableName(value) {
    return text(value).normalize('NFKC').replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').replace(/^(?:LR|UR|SSR|SR|R|N)\s*/i, '').replace(/[・･\s]/g, '');
  }
  function recordName(value) { return text(value).normalize('NFKC').replace(/\s+/g, ''); }
  function normalizeCategory(value) {
    const key = text(value);
    return ({ status_effects: 'statusEffects', siege_weapons: 'siegeWeapons', ethnic_armaments: 'ethnicArmaments', warhorse_skills: 'warhorseSkills' })[key] || key;
  }
  function entityKey(category, name) { return `${normalizeCategory(category)}@@${recordName(name)}`; }
  function sourceEntityKey(category, name) { return entityKey(category, name); }
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

  function normalizedMarkerText(value) {
    return text(value).normalize('NFKC').replace(/\s+/g, ' ').trim();
  }
  function addSourceTag(tags, evidence, tag, rawText) {
    const value = text(tag);
    if (!value) return;
    tags.add(value);
    if (!evidence.has(value)) evidence.set(value, new Set());
    evidence.get(value).add(text(rawText));
  }
  function collectConditionTags(label, options = {}) {
    const value = normalizedMarkerText(label).replace(/^[■▼]\s*/, '');
    const compact = value.replace(/\s+/g, '');
    const tags = new Set();
    const add = tag => tags.add(`条件:${tag}`);
    if (!value || /^(?:常に|常時)$/.test(value)) return tags;
    if (options.includePlacement !== false) {
      if (/(?:^|[^戦法])主将/.test(compact)) add('主将');
      if (/副将/.test(compact)) add('副将');
      if (/補佐/.test(compact)) add('補佐');
      if (/参軍/.test(compact)) add('参軍');
    }
    if (/任命時/.test(compact)) add('任命時');
    if (/好相性/.test(compact)) add('好相性');
    ['騎兵', '歩兵', '弓兵', '盾兵'].forEach(type => { if (compact.includes(type)) add(type); });
    for (const match of compact.matchAll(/兵力(?:が)?(\d+)(%|％)?(以上|以下)/g)) add(`兵力${match[1]}${match[2] ? '%' : ''}${match[3]}`);
    for (const match of compact.matchAll(/編制時点[^。]*(攻撃|防御|知力|機動|射程)(?:が)?(\d+)以上/g)) add(`編制${match[1]}${match[2]}以上`);
    if (/部隊内|うち\d+人以上|主将が[^、。]*(?:\/|または)/.test(compact)) add('指定武将を編制');
    if (/武装[^。]*(?:編制|健在)/.test(compact)) add('武装編制中');
    if (/兵器[^。]*(?:編制|健在)/.test(compact)) add('兵器編制中');
    if (/駐屯|防衛中/.test(compact)) add('駐屯・防衛中');
    if (/詰所/.test(compact)) add('詰所');
    if (/侍従[^。]*(?:配置|いる)/.test(compact)) add('侍従配置');
    if (/弱化効果/.test(compact)) add('弱化状態');
    if (/強化効果/.test(compact)) add('強化状態');
    if (/攻撃目標/.test(compact)) add('攻撃目標条件');
    if (/男性|女性/.test(compact)) add('性別条件');
    if (/技能[^。]*Lv/i.test(compact)) add('技能Lv条件');
    if (/将星/.test(compact)) add('将星条件');
    if (/確率/.test(compact)) add('確率条件');
    return tags;
  }
  function collectTriggerTags(label) {
    const value = normalizedMarkerText(label).replace(/^▼\s*/, '');
    const compact = value.replace(/\s+/g, '');
    const tags = new Set();
    const add = tag => tags.add(`発動:${tag}`);
    if (/交戦開始時/.test(compact)) add('交戦開始時');
    if (/出陣時/.test(compact)) add('出陣時');
    if (/戦法[^。]*(?:発動|連鎖)|主将戦法発動|副将\d?の?戦法発動/.test(compact)) add('戦法発動時');
    if (/兵器[^。]*行動/.test(compact)) add('兵器行動時');
    if (/部隊(?:を)?撃破時/.test(compact)) add('部隊撃破時');
    if (/部隊(?:が)?壊滅|壊滅するダメージ/.test(compact)) add('壊滅時');
    if (/会心攻撃/.test(compact)) add('会心時');
    if (/ダメージを(?:受け|与え)/.test(compact)) add('ダメージ時');
    if (/通常攻撃[^。]*(?:時|するたび|する度)/.test(compact) && !/ダメージを受け/.test(compact)) add('通常攻撃時');
    if (/状態変化[^。]*(?:発生|付与|解除)/.test(compact)) add('状態変化時');
    return tags;
  }
  function indexSourceMarkerTags(conditionBlockData) {
    if (!conditionBlockData || conditionBlockData.kind !== 'effect_condition_blocks' || !Array.isArray(conditionBlockData.items)) {
      throw new Error('Update tag search requires hadou_effect_condition_blocks.json');
    }
    sourceTagsByEntity = new Map();
    sourceTagEvidenceByEntity = new Map();
    const conditionTags = new Set(), triggerTags = new Set();
    let markerBlockCount = 0;
    for (const item of conditionBlockData.items) {
      const key = sourceEntityKey(item?.category, item?.name || item?.displayName);
      const tags = sourceTagsByEntity.get(key) || new Set();
      const evidence = sourceTagEvidenceByEntity.get(key) || new Map();
      for (const block of Array.isArray(item?.blocks) ? item.blocks : []) {
        const raw = normalizedMarkerText(block?.sourceText || block?.effectText);
        const marker = raw.charAt(0);
        if (marker !== '■' && marker !== '▼') continue;
        markerBlockCount++;
        const conditions = collectConditionTags(raw, { includePlacement: marker === '■' });
        const triggers = marker === '▼' ? collectTriggerTags(raw) : new Set();
        conditions.forEach(tag => { conditionTags.add(tag); addSourceTag(tags, evidence, tag, raw); });
        triggers.forEach(tag => { triggerTags.add(tag); addSourceTag(tags, evidence, tag, raw); });
      }
      if (tags.size) sourceTagsByEntity.set(key, tags);
      if (evidence.size) sourceTagEvidenceByEntity.set(key, evidence);
    }
    return Object.freeze({
      itemCount: conditionBlockData.items.length,
      taggedEntityCount: sourceTagsByEntity.size,
      markerBlockCount,
      conditionTags: Object.freeze([...conditionTags].sort()),
      triggerTags: Object.freeze([...triggerTags].sort())
    });
  }

  function indexData(options = {}) {
    const clauseData = options.effectClauses || null;
    const featureData = options.typeSearchFeatureIndex || null;
    const relatedData = options.relatedLinkIndex || null;
    const statusData = options.statusEffects || null;
    const conditionBlockData = options.effectConditionBlocks || null;
    if (!clauseData || clauseData.kind !== 'effect_clause_index') throw new Error('Update06 requires hadou_effect_clauses.json');
    const featureRows = items(featureData);
    if (!featureRows.length) throw new Error('Update06 requires hadou_type_search_feature_index.json');
    featureRowsByEntity = new Map();
    statusKeysByName = new Map();
    summaryCache = new Map();
    const sourceTagDiagnostic = indexSourceMarkerTags(conditionBlockData);
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
    let clauseLinkedStatusRefCount = 0;
    for (const row of Array.isArray(clauseData.reviewedCases) ? clauseData.reviewedCases : []) {
      const clause = row?.clause || {};
      reviewedEntities.add(entityKey(clause?.evidence?.category, clause?.evidence?.entity));
    }
    for (const key of reviewedEntities) {
      const splitAt = key.indexOf('@@');
      const category = key.slice(0, splitAt);
      const entityName = key.slice(splitAt + 2);
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
      conditionTagCount: sourceTagDiagnostic.conditionTags.length,
      triggerTagCount: sourceTagDiagnostic.triggerTags.length,
      sourceTagItemCount: sourceTagDiagnostic.itemCount,
      sourceTaggedEntityCount: sourceTagDiagnostic.taggedEntityCount,
      sourceMarkerBlockCount: sourceTagDiagnostic.markerBlockCount,
      canonicalStatusRefCount,
      canonicalStatusKeyCount: new Set([...statusKeysByName.values()].flatMap(set => [...set])).size,
      clauseLinkedStatusRefCount,
      cacheKey,
      policy: 'condition/trigger tags come from explicit source markers in effect condition blocks; reviewed EffectClause remains authoritative for evaluation; canonical statusEffectKey supplies direct status matching'
    });
    return diagnostic;
  }

  function getEntitySummary(category, name) {
    const key = entityKey(category, name);
    const summaryKey = sourceEntityKey(category, name);
    if (summaryCache.has(summaryKey)) return summaryCache.get(summaryKey);
    const clauseSummary = evaluator.getEntityClauseSummary(normalizeCategory(category), name);
    const view = presenter.buildViewModel({ category: normalizeCategory(category), name });
    const tags = [...(sourceTagsByEntity.get(sourceEntityKey(category, name)) || [])];
    const semanticTypes = new Set();
    view.groups.forEach(group => group.rows.forEach(row => {
        row.semanticTypes.forEach(type => {
          semanticTypes.add(type);
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
    summaryCache.set(summaryKey, summary);
    return summary;
  }

  function getEntityTags(category, name) { return getEntitySummary(category, name).tags; }
  function getEntityTagEvidence(category, name) {
    const evidence = sourceTagEvidenceByEntity.get(sourceEntityKey(category, name)) || new Map();
    return Object.freeze(Object.fromEntries([...evidence.entries()].map(([tag, rows]) => [tag, Object.freeze([...rows])])));
  }
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
  return Object.freeze({ indexData, getDiagnostic: () => diagnostic, getCacheKey: () => cacheKey, getEntitySummary, getEntityTags, getEntityTagEvidence, getEntitySearchText, getCanonicalStatusMatches });
});
