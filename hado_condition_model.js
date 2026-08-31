/* Hado Library 3.1 condition model contract. Runtime consumers are introduced in later Updates. */
(function initHadoConditionModel(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HADO_CONDITION_MODEL = api;
})(typeof window !== 'undefined' ? window : globalThis, function createHadoConditionModel() {
  'use strict';

  const RESULT_STATES = Object.freeze(['met', 'unmet', 'deferred', 'not_applicable', 'unknown']);
  const BOOLEAN_OPERATORS = Object.freeze(['all', 'any', 'not', 'predicate']);
  const COMPARATORS = Object.freeze([
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in',
    'includes', 'includes_all', 'includes_any', 'exists'
  ]);

  function result(state, reason, details) {
    const normalized = RESULT_STATES.includes(state) ? state : 'unknown';
    return Object.freeze({
      state: normalized,
      reason: String(reason || ''),
      details: details && typeof details === 'object' ? details : {}
    });
  }

  function createRegistryIndex(registry) {
    const items = Array.isArray(registry?.items) ? registry.items : (Array.isArray(registry) ? registry : []);
    const index = new Map();
    for (const item of items) {
      const type = String(item?.type || '').trim();
      if (!type) throw new Error('condition registry item requires type');
      if (index.has(type)) throw new Error(`duplicate condition registry type: ${type}`);
      index.set(type, Object.freeze({ ...item, type }));
    }
    return index;
  }

  function compareValue(actual, comparator, expected) {
    switch (comparator) {
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
      case 'gt': return Number(actual) > Number(expected);
      case 'gte': return Number(actual) >= Number(expected);
      case 'lt': return Number(actual) < Number(expected);
      case 'lte': return Number(actual) <= Number(expected);
      case 'in': return Array.isArray(expected) && expected.includes(actual);
      case 'not_in': return Array.isArray(expected) && !expected.includes(actual);
      case 'includes': return Array.isArray(actual) ? actual.includes(expected) : String(actual).includes(String(expected));
      case 'includes_all': return Array.isArray(actual) && Array.isArray(expected) && expected.every(value => actual.includes(value));
      case 'includes_any': return Array.isArray(actual) && Array.isArray(expected) && expected.some(value => actual.includes(value));
      case 'exists': return expected === false ? actual == null : actual != null;
      default: return null;
    }
  }

  function combineAll(results) {
    if (!results.length) return result('met', 'empty_all');
    if (results.some(row => row.state === 'unmet')) return result('unmet', 'all_contains_unmet', { results });
    if (results.some(row => row.state === 'unknown')) return result('unknown', 'all_contains_unknown', { results });
    if (results.some(row => row.state === 'deferred')) return result('deferred', 'all_contains_deferred', { results });
    if (results.some(row => row.state === 'not_applicable')) return result('not_applicable', 'all_contains_not_applicable', { results });
    return result('met', 'all_met', { results });
  }

  function combineAny(results) {
    if (!results.length) return result('unmet', 'empty_any');
    if (results.some(row => row.state === 'met')) return result('met', 'any_contains_met', { results });
    if (results.some(row => row.state === 'unknown')) return result('unknown', 'any_contains_unknown', { results });
    if (results.some(row => row.state === 'deferred')) return result('deferred', 'any_contains_deferred', { results });
    if (results.every(row => row.state === 'not_applicable')) return result('not_applicable', 'all_any_branches_not_applicable', { results });
    return result('unmet', 'all_applicable_any_branches_unmet', { results });
  }

  function phaseFallback(entry, evaluationContext) {
    const surface = String(evaluationContext?.surface || 'formation');
    const phase = String(entry?.phase || 'universal');
    if (phase === 'external' && surface !== 'external') return result('not_applicable', 'outside_external_context', { surface, phase });
    if (phase === 'battle' && surface !== 'battle') return result('deferred', 'battle_fact_required', { surface, phase });
    return null;
  }

  function evaluatePredicate(predicate, evaluationContext, registryIndex) {
    const type = String(predicate?.type || '').trim();
    const entry = registryIndex.get(type);
    if (!entry) return result('unknown', 'unregistered_predicate_type', { type });
    if (!['condition', 'trigger', 'context'].includes(entry.group)) {
      return result('unknown', 'non_predicate_registry_group', { type, group: entry.group });
    }
    const fallback = phaseFallback(entry, evaluationContext);
    const facts = evaluationContext?.facts && typeof evaluationContext.facts === 'object' ? evaluationContext.facts : {};
    const fact = String(predicate.fact || entry.defaultFact || type);
    if (!Object.prototype.hasOwnProperty.call(facts, fact)) return fallback || result('unknown', 'fact_missing', { type, fact });
    const comparator = String(predicate.comparator || 'eq');
    if (!COMPARATORS.includes(comparator)) return result('unknown', 'unsupported_comparator', { type, comparator });
    const compared = compareValue(facts[fact], comparator, predicate.value);
    if (compared == null) return result('unknown', 'comparison_failed', { type, comparator, fact });
    return result(compared ? 'met' : 'unmet', compared ? 'predicate_met' : 'predicate_unmet', {
      type, fact, comparator, actual: facts[fact], expected: predicate.value
    });
  }

  function evaluateExpression(expression, evaluationContext, registry) {
    const registryIndex = registry instanceof Map ? registry : createRegistryIndex(registry);
    if (!expression) return result('met', 'expression_omitted');
    const op = String(expression.op || '');
    if (op === 'predicate') return evaluatePredicate(expression, evaluationContext || {}, registryIndex);
    if (op === 'not') {
      const child = evaluateExpression(expression.item, evaluationContext, registryIndex);
      if (child.state === 'met') return result('unmet', 'not_met', { child });
      if (child.state === 'unmet') return result('met', 'not_unmet', { child });
      return result(child.state, 'not_preserves_indeterminate_state', { child });
    }
    const items = Array.isArray(expression.items) ? expression.items : [];
    const evaluated = items.map(item => evaluateExpression(item, evaluationContext, registryIndex));
    if (op === 'all') return combineAll(evaluated);
    if (op === 'any') return combineAny(evaluated);
    return result('unknown', 'unsupported_boolean_operator', { op });
  }

  function validateExpression(expression, registryIndex, path, errors) {
    if (!expression || typeof expression !== 'object') {
      errors.push(`${path} must be an expression object`);
      return;
    }
    const op = String(expression.op || '');
    if (!BOOLEAN_OPERATORS.includes(op)) {
      errors.push(`${path}.op is unsupported: ${op}`);
      return;
    }
    if (op === 'predicate') {
      const entry = registryIndex.get(String(expression.type || ''));
      if (!entry) errors.push(`${path}.type is not registered: ${expression.type || ''}`);
      else if (!['condition', 'trigger', 'context'].includes(entry.group)) errors.push(`${path}.type is not predicate-capable: ${entry.type}`);
      if (!COMPARATORS.includes(String(expression.comparator || 'eq'))) errors.push(`${path}.comparator is unsupported`);
      return;
    }
    if (op === 'not') {
      validateExpression(expression.item, registryIndex, `${path}.item`, errors);
      return;
    }
    if (!Array.isArray(expression.items) || expression.items.length === 0) {
      errors.push(`${path}.items must contain at least one expression`);
      return;
    }
    expression.items.forEach((item, index) => validateExpression(item, registryIndex, `${path}.items[${index}]`, errors));
  }

  function validateTypedCollection(value, group, registryIndex, path, errors, parentEffectId) {
    const items = value == null ? [] : (Array.isArray(value) ? value : [value]);
    items.forEach((item, index) => {
      const type = String(item?.type || '');
      const entry = registryIndex.get(type);
      if (!entry) errors.push(`${path}[${index}].type is not registered: ${type}`);
      else if (entry.group !== group) errors.push(`${path}[${index}].type must belong to ${group}: ${type}`);
      if (!parentEffectId || item?.effectId !== parentEffectId) {
        errors.push(`${path}[${index}].effectId must match effect.id`);
      }
    });
  }

  function validateEffectClause(clause, registry) {
    const registryIndex = registry instanceof Map ? registry : createRegistryIndex(registry);
    const errors = [];
    if (!clause || typeof clause !== 'object') return { ok: false, errors: ['clause must be an object'] };
    if (clause.schemaVersion !== '1.0') errors.push('schemaVersion must be 1.0');
    if (!String(clause.id || '').trim()) errors.push('id is required');
    if (!clause.effect || typeof clause.effect !== 'object') errors.push('effect is required');
    if (!clause.evidence || typeof clause.evidence !== 'object' || !String(clause.evidence.rawText || '').trim()) errors.push('evidence.rawText is required');
    if (clause.context) validateExpression(clause.context, registryIndex, 'context', errors);
    if (clause.trigger) validateExpression(clause.trigger, registryIndex, 'trigger', errors);
    if (clause.when) validateExpression(clause.when, registryIndex, 'when', errors);
    const parentEffectId = clause.effect?.id;
    validateTypedCollection(clause.modifier, 'modifier', registryIndex, 'modifier', errors, parentEffectId);
    validateTypedCollection(clause.limit, 'limit', registryIndex, 'limit', errors, parentEffectId);
    validateTypedCollection(clause.reset, 'reset', registryIndex, 'reset', errors, parentEffectId);
    validateTypedCollection(clause.suppression, 'suppression', registryIndex, 'suppression', errors, parentEffectId);
    validateTypedCollection(clause.target?.rules, 'targeting', registryIndex, 'target.rules', errors, parentEffectId);
    return { ok: errors.length === 0, errors };
  }

  function collectExpressionTypes(expression, output) {
    if (!expression || typeof expression !== 'object') return;
    if (expression.op === 'predicate' && expression.type) output.add(expression.type);
    if (expression.op === 'not') collectExpressionTypes(expression.item, output);
    if (Array.isArray(expression.items)) expression.items.forEach(item => collectExpressionTypes(item, output));
  }

  function collectSemanticTypes(clause) {
    const output = new Set();
    collectExpressionTypes(clause?.context, output);
    collectExpressionTypes(clause?.trigger, output);
    collectExpressionTypes(clause?.when, output);
    for (const key of ['modifier', 'limit', 'reset', 'suppression']) {
      const rows = Array.isArray(clause?.[key]) ? clause[key] : (clause?.[key] ? [clause[key]] : []);
      rows.forEach(row => { if (row?.type) output.add(row.type); });
    }
    const targetRules = Array.isArray(clause?.target?.rules) ? clause.target.rules : [];
    targetRules.forEach(row => { if (row?.type) output.add(row.type); });
    return [...output].sort();
  }

  function evaluateClause(clause, evaluationContext, registry) {
    const registryIndex = registry instanceof Map ? registry : createRegistryIndex(registry);
    const validation = validateEffectClause(clause, registryIndex);
    if (!validation.ok) return result('unknown', 'invalid_effect_clause', { errors: validation.errors });
    const contextResult = evaluateExpression(clause.context, evaluationContext, registryIndex);
    if (contextResult.state === 'unmet' || contextResult.state === 'not_applicable') {
      return result('not_applicable', 'clause_context_not_applicable', { context: contextResult });
    }
    if (contextResult.state !== 'met') return contextResult;
    const triggerResult = evaluateExpression(clause.trigger, evaluationContext, registryIndex);
    const whenResult = evaluateExpression(clause.when, evaluationContext, registryIndex);
    return combineAll([triggerResult, whenResult]);
  }

  return Object.freeze({
    RESULT_STATES,
    BOOLEAN_OPERATORS,
    COMPARATORS,
    createRegistryIndex,
    evaluateExpression,
    evaluateClause,
    validateEffectClause,
    collectSemanticTypes
  });
});
