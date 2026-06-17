#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const rules = JSON.parse(fs.readFileSync('hadou_type_score_rules.json', 'utf8')).items;
const presets = JSON.parse(fs.readFileSync('hadou_type_search_presets.json', 'utf8')).items;
const featureIndex = JSON.parse(fs.readFileSync('hadou_type_search_feature_index.json', 'utf8'));
const debugEvents = [];

function norm(value) {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

const context = {
  console,
  require,
  setTimeout,
  clearTimeout,
  fetch: undefined,
  window: null,
  state: {
    derivedData: {
      typeSearchPresets: { items: presets },
      typeSearchFeatureIndex: { items: featureIndex.items }
    },
    diagnostics: {},
    typeSearchCacheStats: { hit: 0, miss: 0, invalidations: 0, store: 0 }
  },
  debugLog(name, data) {
    debugEvents.push({ name, data });
  },
  debugTimestamp() {
    return '2026-06-17T00:00:00.000Z';
  },
  norm,
  normalizeSaveItemName: norm,
  esc,
  safeCloneForDebug(value) {
    return JSON.parse(JSON.stringify(value));
  },
  effectSignedValue(effect) {
    return `${effect?.sign || '+'}${effect?.value ?? ''}${effect?.unit || ''}`;
  },
  isResponsiveMobileMode() {
    return false;
  },
  PARAM_DISPLAY_GROUP_ORDER: ['能力'],
  PARAM_GROUPS: [{ keys: ['弱化無効', '攻撃速度', '負傷兵回復'] }],
  timingLabel(value) {
    return value;
  },
  parameterDisplayName(value) {
    return value;
  },
  getParameterDefaultUnit(key, unit) {
    return unit || '%';
  },
  formatFormationParameterNumber(value) {
    return String(Number(value) || 0);
  },
  formationParameterDisplayValue(key, value) {
    return `${value?.sign || '+'}${value?.maxTotal ?? value?.value ?? ''}${value?.unit || ''}`;
  },
  getItemDisplayName(item) {
    return item?.name || '';
  },
  detailCategory() {
    return '';
  },
  localStorage: {
    getItem() { return null; },
    setItem() {}
  },
  document: {
    getElementById() { return null; }
  },
  els: {},
  performance: { now: () => 0 },
  requestAnimationFrame(callback) {
    callback();
  }
};
context.window = context;

vm.createContext(context);
vm.runInContext(fs.readFileSync('hado_type_score.js', 'utf8'), context, { filename: 'hado_type_score.js' });
vm.runInContext(fs.readFileSync('hado_formation.js', 'utf8'), context, { filename: 'hado_formation.js' });

const formation = {
  id: 'formation_type_score_render_test',
  name: '検証部隊',
  evaluationTypeId: 'vaccine',
  evaluationTypeName: 'ワクチン型',
  slots: {
    main: { general: '', equipments: {} },
    deputy1: { general: '', equipments: {} },
    deputy2: { general: '', equipments: {} },
    support1: { general: '', equipments: {} },
    support2: { general: '', equipments: {} }
  },
  advisorSlots: {}
};

const formationData = {
  skills: [],
  summary: {
    normal: {
      '能力': {
        '弱化無効': { sign: '+', maxTotal: 1, unit: '' },
        '攻撃速度': { sign: '+', maxTotal: 20, unit: '%' },
        '負傷兵回復': { sign: '+', maxTotal: 10, unit: '%' }
      }
    }
  },
  effects: [
    {
      key: '弱化無効',
      group: '耐性',
      timing: 'normal',
      value: 1,
      sign: '+',
      unit: '',
      sourceLabel: '検証耐性技能',
      rawText: '弱化効果無効を付与',
      condition: ''
    },
    {
      key: '攻撃速度',
      group: '能力',
      timing: 'normal',
      value: 20,
      sign: '+',
      unit: '%',
      sourceLabel: '検証支援技能',
      rawText: '自身を含む味方3部隊の攻撃速度+20%',
      condition: ''
    },
    {
      key: '負傷兵回復',
      group: '回復',
      timing: 'normal',
      value: 10,
      sign: '+',
      unit: '%',
      sourceLabel: '検証回復技能',
      rawText: '味方3部隊の負傷兵を最大兵力の10%回復',
      condition: ''
    }
  ]
};

const html = context.renderFormationScoreSummaryHtml(formation, formationData);
const typeScore = context.state.diagnostics.typeScore;
const typeSearch = context.state.diagnostics.typeSearch;
const typeSearchCache = context.state.diagnostics.typeSearchCache;
const maxTotalScore = Math.max(...(typeScore?.candidateScores || []).map(row => Number(row.totalScore || 0)));
const positiveRow = (typeScore?.candidateScores || [])
  .flatMap(candidate => candidate.rows || [])
  .find(row => Number(row.score || 0) > 0 && ((row.matchedEffects || []).length || (row.matchedParameters || []).length));

assert(html.includes('トータルスコア'), 'score summary HTML must render total score label');
assert(typeScore && typeof typeScore === 'object', 'typeScore diagnostic must exist');
assert.strictEqual(typeScore.calculationInvoked, true, 'formation render must invoke type-score calculation');
assert.strictEqual(typeScore.formationId, formation.id, 'diagnostic must include formation id');
assert.strictEqual(typeScore.formationName, formation.name, 'diagnostic must include formation name');
assert.strictEqual(typeScore.selectedTypeId, 'vaccine', 'vaccine type must be scored when selected');
assert.strictEqual(typeScore.presetCount, 16, 'all type presets must be loaded');
assert(Number(typeScore.featureItemCount || 0) > 0, 'feature index must be loaded');
assert(Number(typeScore.parameterRowCount || 0) > 0, 'parameter rows must feed scoring');
assert(Number(typeScore.effectSourceCount || 0) > 0, 'effect sources must feed scoring');
assert((typeScore.candidateScores || []).length > 0, 'candidate scores must be emitted');
assert(maxTotalScore > 0, 'at least one candidate total score must be non-zero');
assert(positiveRow, 'at least one evaluation row must include matched effect or parameter evidence');
assert.strictEqual(typeScore.rendered, true, 'diagnostic must mark score UI as rendered');
assert.strictEqual(typeScore.emptyReason, '', 'successful scoring must not report empty reason');
assert(typeSearch && typeSearch.mode === 'formation-score', 'typeSearch diagnostic must mirror formation score execution');
assert(typeSearchCache && Number(typeSearchCache.stats?.store || 0) > 0, 'formation score path must populate typeSearchCache stats');
assert(debugEvents.some(event => event.name === 'typeScore'), 'copy-debug-log source must receive typeScore debug event');

const proof = {
  htmlIncludesTotalScore: html.includes('トータルスコア'),
  typeScore: {
    calculationInvoked: typeScore.calculationInvoked,
    formationId: typeScore.formationId,
    formationName: typeScore.formationName,
    selectedTypeId: typeScore.selectedTypeId,
    presetCount: typeScore.presetCount,
    featureItemCount: typeScore.featureItemCount,
    parameterRowCount: typeScore.parameterRowCount,
    effectSourceCount: typeScore.effectSourceCount,
    candidateScoresLength: typeScore.candidateScores.length,
    maxTotalScore,
    topCandidate: typeScore.candidateScores[0],
    rendered: typeScore.rendered,
    emptyReason: typeScore.emptyReason
  },
  typeSearch,
  typeSearchCache,
  debugEventNames: debugEvents.map(event => event.name)
};

console.log('formation type score render ok:');
console.log(JSON.stringify(proof, null, 2));
