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
  HADO_TYPE_SCORE_RULES: rules,
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
        '知力': { sign: '+', maxTotal: 20, unit: '%' },
        '負傷兵回復': { sign: '+', maxTotal: 10, unit: '%' },
        '防御': { sign: '+', maxTotal: 20, unit: '%' }
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
      rawText: '自部隊の弱化効果を無効',
      condition: ''
    },
    {
      key: '知力',
      group: '能力',
      timing: 'normal',
      value: 20,
      sign: '+',
      unit: '%',
      sourceLabel: '検証知力技能',
      rawText: '知力を上昇',
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
    },
    {
      key: '防御',
      group: '能力',
      timing: 'normal',
      value: 20,
      sign: '+',
      unit: '%',
      sourceLabel: '検証防御技能',
      rawText: '味方3部隊の防御を上昇',
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

assert(maxTotalScore > 0, `vaccine score must not remain zero when effect sources exist: ${maxTotalScore}`);
assert(positiveRow, 'positive score row with evidence must exist');
assert(((positiveRow?.matchedEffects || []).length || (positiveRow?.evidenceRows || []).length) > 0, 'positive score row must include matched effects or evidence rows');
assert((positiveRow.evidenceRows || []).some(row => row.label === '弱化無効' || row.changeItemId === 'weakening_nullify'), 'vaccine must score weakening_nullify as Primary evidence');
const vaccineRows = (typeScore?.candidateScores?.[0]?.rows || []);
const excludedRows = [...(typeScore?.candidateScores?.[0]?.excludedRows || []), ...vaccineRows.flatMap(row => row.excludedRows || [])];
assert(excludedRows.some(row => row.changeItemId === 'wounded_recovery' && row.excludeReason === 'deny_change_item'), 'vaccine must keep wounded_recovery as Deny/Excluded evidence');
assert(excludedRows.some(row => row.changeItemId === 'defense_up' && row.excludeReason === 'deny_change_item'), 'vaccine must keep defense_up as Deny/Excluded evidence');
assert(Number(typeScore?.bridgeInputEvidenceCount || 0) > 0, 'diagnostics must expose bridgeInputEvidenceCount');
assert(Number(typeScore?.bridgeMatchedEvidenceCount || 0) > 0, 'diagnostics must expose bridgeMatchedEvidenceCount');
assert(Number(typeScore?.bridgeExcludedEvidenceCount || 0) > 0, 'diagnostics must expose bridgeExcludedEvidenceCount');
assert(typeScore?.scoreEvidenceBuildSource, 'diagnostics must expose scoreEvidenceBuildSource');
assert(html.includes('トータルスコア'), 'score summary HTML must render total score label');
assert(html.includes('id="formationEvaluationTypeSelect"'), 'score summary must render formationEvaluationTypeSelect in the total score panel');
assert(html.includes('data-formation-evaluation-type-select="1"'), 'score summary must mark every duplicated score-panel type select for delegated binding');
assert(html.includes('<option value="vaccine" selected>ワクチン型</option>'), 'formationEvaluationTypeSelect must select the current formation evaluationTypeId');
assert(html.includes('型未設定'), 'formationEvaluationTypeSelect must include an unset option');
assert(!html.includes('評価型ID') && !html.includes('formationEvaluationTypeInput'), 'score summary must not restore forbidden evaluation type UI');
assert(html.includes('<section class="formation-selected-card formation-score-card'), 'score card must be a constant visible section');
assert(!html.includes('<details class="formation-score-summary'), 'score card must not hide the score body in details');
const metricChipCount = (html.match(/data-formation-score-detail-index/g)||[]).length;
assert(metricChipCount === 5, 'vaccine score UI must render exactly five metric chips');
assert(html.includes('ワクチン型 / 5項目'), 'score summary must show ワクチン型 / 5項目');
assert(!html.includes('ワクチン型 / 1項目'), 'score summary must not show ワクチン型 / 1項目');
['弱化予防','弱化解除','状態異常対策','連鎖阻害対策','強化保護'].forEach(label => assert(html.includes(label), `vaccine metric label missing: ${label}`));
assert((html.match(/data-formation-score-detail-index/g)||[]).length === metricChipCount, 'evaluation score chips must render one button per visible score row');
assert(!html.includes('>評価2<') && !html.includes('>評価3<') && !html.includes('>評価4<') && !html.includes('>評価5<'), 'score summary must not render fallback evaluation labels');
assert((html.match(/data-formation-score-card=\"1\"/g)||[]).length === 1, 'score summary renderer must produce exactly one score card');
assert((html.match(/formation-score-detail-panel/g)||[]).length === 1, 'score summary renderer must produce exactly one detail panel');
assert(html.includes('formation-score-detail-panel is-collapsed'), 'score detail panel must default to collapsed one-line mode');
assert(html.includes('formation-score-evidence-tags is-collapsed'), 'collapsed score evidence tags must be marked for one-line overflow-safe rendering');
assert((html.match(/根拠/g)||[]).length >= metricChipCount, 'evaluation score chips/detail must show evidence counts without confusing them with points');
assert(!html.includes('点'), 'score card UI must not display point wording');
assert(!html.includes('内訳合計'), 'score detail panel must not display redundant numeric point totals');
assert(html.includes('data-formation-score-detail-label='), 'score chips must carry row labels for click diagnostics');
assert(html.includes('data-formation-score-detail-evidence-count='), 'score chips must carry evidence counts for click diagnostics');
assert(html.includes('formation-score-detail-panel'), 'selected evaluation score must render a detail panel');


const changeFormation = JSON.parse(JSON.stringify(formation));
changeFormation.evaluationTypeId = 'vaccine';
changeFormation.evaluationTypeName = 'ワクチン型';
context.state.formations = [changeFormation];
context.state.currentFormationId = changeFormation.id;
let saveContext = '';
let renderCalled = false;
let toastMessage = '';
context.saveFormationDataToStorage = (ctx) => { saveContext = ctx; return true; };
context.renderFormationScreen = () => { renderCalled = true; };
context.showFormationToast = (message) => { toastMessage = message; };
const originalBuildFormationParameterData = context.buildFormationParameterData;
const originalCalculateFormationAutoScores = context.calculateFormationAutoScores;
context.buildFormationParameterData = () => ({ effects: [], skills: [] });
let recalculatedTypeId = '';
context.calculateFormationAutoScores = (f) => { recalculatedTypeId = f.evaluationTypeId; return { totalScore: 7, evaluationScore: 7 }; };
const nextRule = rules.find(rule => rule.typeId && rule.typeId !== 'vaccine');
assert(nextRule, 'test fixture must provide another type rule');
const changed = context.setFormationEvaluationType(nextRule.typeId);
assert.strictEqual(changed, true, 'setFormationEvaluationType must accept a valid typeId');
assert.strictEqual(changeFormation.evaluationTypeId, nextRule.typeId, 'setFormationEvaluationType must update evaluationTypeId');
assert.strictEqual(changeFormation.evaluationTypeName, nextRule.typeName, 'setFormationEvaluationType must update evaluationTypeName');
assert.strictEqual(saveContext, 'setFormationEvaluationType', 'setFormationEvaluationType must persist with the expected save context');
assert.strictEqual(renderCalled, true, 'setFormationEvaluationType must rerender immediately');
assert.strictEqual(toastMessage, '型を変更しました', 'setFormationEvaluationType must show the user-facing toast');
assert.strictEqual(recalculatedTypeId, nextRule.typeId, 'setFormationEvaluationType must recalculate using the changed typeId');
assert.strictEqual(changeFormation.totalScore, 7, 'setFormationEvaluationType must store recalculated totalScore');
assert.strictEqual(changeFormation.evaluationScore, 7, 'setFormationEvaluationType must store recalculated evaluationScore');

const fakeChips = Array.from({ length: 5 }, (_, index) => ({
  dataset: { formationScoreDetailIndex: String(index) },
  active: false,
  ariaPressed: '',
  classList: { toggle(name, active) { if (name === 'is-active') this.owner.active = active; } },
  setAttribute(name, value) { if (name === 'aria-pressed') this.ariaPressed = value; }
}));
fakeChips.forEach(chip => { chip.classList.owner = chip; });
let replacedPanelHtml = '';
const fakePanel = { set outerHTML(value) { replacedPanelHtml = value; } };
const fakeCard = {
  querySelectorAll(selector) { return selector === '[data-formation-score-detail-index]' ? fakeChips : []; },
  querySelector(selector) { return selector === '.formation-score-detail-panel' ? fakePanel : null; }
};
const fakeBtn = {
  dataset: {
    formationScoreDetailIndex: '3',
    formationScoreDetailLabel: '弱化解除',
    formationScoreDetailScore: '0',
    formationScoreDetailEvidenceCount: '0'
  },
  closest(selector) { return selector === '.formation-score-card' ? fakeCard : null; }
};
context.state.formationScoreDetailRows = context.normalizeFormationScoreDisplayRows(typeScore.candidateScores[0].rows || []);
context.state.formationScoreDetailIndex = 0;
renderCalled = false;
const beforeClickDebugCount = debugEvents.length;
context.handleFormationScoreDetailClick(fakeBtn, { preventDefault() {}, stopPropagation() {} });
assert.strictEqual(context.state.formationScoreDetailIndex, 3, 'detail click must update state.formationScoreDetailIndex');
assert.strictEqual(renderCalled, true, 'detail click must rerender all duplicated score cards so the visible panel switches reliably');
assert.strictEqual(fakeChips[3].active, false, 'detail click must not rely on same-card partial DOM mutation only');
assert.strictEqual(replacedPanelHtml, '', 'detail click must not replace only one duplicated score-card panel');
assert(debugEvents.slice(beforeClickDebugCount).some(event => event.name === 'formationScoreDetail:click' && event.data.previousIndex === 0 && event.data.nextIndex === 3 && event.data.rowLabel === '弱化解除' && event.data.evidenceCount === 0), 'detail click debug log must include previousIndex, nextIndex, rowLabel, and evidenceCount');

assert(!html.includes('+1点'), 'score detail rows must not show redundant point contribution');
assert(!html.includes('>効果<') && !html.includes('>変化率<'), 'normal UI must not expose debug bucket headings');
assert(html.includes('クリックで詳細表示'), 'score detail panel must advertise that clicking opens full details');
assert(!html.includes('弱化無効(検証耐性技能)') && !html.includes('知力(検証知力技能)') && !html.includes('負傷兵回復(検証回復技能)'), 'collapsed score detail panel must use simplified labels without source text');
assert(!html.includes('class="sr-only"'), 'score detail HTML must not expose aggregate evidence labels through an undefined sr-only helper');
assert(!html.includes(' / 条件：常に') && !html.includes('検証耐性技能 / 検証知力技能'), 'score detail HTML must not render a slash-delimited aggregate source label dump');
assert(!html.includes('条件：常に'), 'score detail HTML must not expose aggregate default condition text outside evidence tags');

const syntheticDisadvantageRow = {
  label: '自部隊不利対策',
  score: 20,
  scoreDetails: Array.from({ length: 20 }, (_, index) => ({
    label: ['弱化無効','弱化解除','弱化反射','状態変化無効','不利変化無効'][index % 5],
    point: 1,
    source: `検証根拠${index + 1}`,
    condition: '常に',
    value: '+1',
    matchedText: `不利対策検証${index + 1}`,
    rawText: index === 0 ? 'LR関羽の戦法本文: 自身1部隊にかかる一部の不利変化を避け、効果回数分、受けた弱化効果を無効化する長文検証テキスト' : `弱化無効 弱化解除 弱化反射 状態変化無効 不利変化無効 ${index + 1}`,
    evidenceType: index % 2 ? 'effect' : 'parameter',
    reason: 'matched_item_count: 自部隊不利対策 に一致した根拠'
  }))
};
const syntheticHtml = context.renderFormationScoreEvidencePanelHtml(syntheticDisadvantageRow);
context.state.formationScoreEvidenceDialogOpen = true;
const syntheticDialogHtml = context.renderFormationScoreEvidenceDialogHtml(syntheticDisadvantageRow);
context.state.formationScoreEvidenceDialogOpen = false;
assert(syntheticHtml.includes('自部隊不利対策の内訳'), '20-evidence disadvantage row must render the selected heading');
assert(syntheticHtml.includes('クリックで詳細表示'), '20-evidence disadvantage row must show click-to-open detail guidance');
assert(!syntheticHtml.includes('点'), '20-evidence disadvantage row must not display point wording');
assert(syntheticHtml.includes('弱化無効') && syntheticHtml.includes('弱化解除') && syntheticHtml.includes('弱化反射') && syntheticHtml.includes('状態変化無効') && syntheticHtml.includes('不利変化無効'), 'collapsed disadvantage details must expose simplified matched labels');
assert((syntheticHtml.match(/弱化無効/g)||[]).length === 1, 'collapsed disadvantage details must dedupe repeated labels');
assert(!syntheticHtml.includes('一致根拠なし'), '20-evidence disadvantage row must not show the empty-evidence message');
assert(syntheticDialogHtml.includes('formation-score-evidence-dialog-overlay') && syntheticDialogHtml.includes('role="dialog"'), 'score evidence panel click must open a dialog like result summary');
assert(syntheticDialogHtml.includes('全件表示') && syntheticDialogHtml.includes('formation-score-evidence-dialog-list'), 'score evidence dialog must display all evidence in a dedicated list');
assert(fs.readFileSync('hado_styles.css','utf8').includes('.formation-score-evidence-dialog-list .formation-score-evidence-label{overflow:visible!important;text-overflow:clip!important;white-space:normal!important'), 'score evidence dialog labels must show full content without ellipsis');
const scoreEvidenceCss = fs.readFileSync('hado_styles.css','utf8');
assert(scoreEvidenceCss.includes('.formation-score-evidence-dialog-list{display:flex!important;flex-direction:column!important'), 'score evidence dialog list must force vertical stacking');
assert(scoreEvidenceCss.includes('.formation-score-evidence-line-item{width:100%;display:block'), 'score evidence line items must be full-width compact blocks');
assert(scoreEvidenceCss.includes('width:min(960px,calc(100vw - 48px))'), 'score evidence dialog must provide enough PC width for long raw text');
assert(!scoreEvidenceCss.includes('.formation-score-evidence-dialog-list.formation-score-evidence-tags.is-expanded{grid-template-columns:repeat(auto-fit'), 'score evidence dialog must not keep auto-fit horizontal card columns');
assert((syntheticDialogHtml.match(/class="formation-score-evidence-line-item /g)||[]).length === 20, 'score evidence dialog must render every evidence item as a compact two-line row');
assert(!syntheticDialogHtml.includes('formation-score-evidence-detail-card'), 'score evidence dialog must not render horizontal detail cards');
assert(!syntheticDialogHtml.includes('型要素'), 'score evidence dialog must not expose 型要素 as a main detail label');
assert(syntheticDialogHtml.includes('formation-score-evidence-index'), 'score evidence dialog must show row numbers for a readable list');
assert(syntheticDialogHtml.includes('formation-score-evidence-line-main') && syntheticDialogHtml.includes('formation-score-evidence-line-raw'), 'score evidence dialog must split each evidence into main and raw lines');
assert(syntheticDialogHtml.includes('LR関羽の戦法本文') && syntheticDialogHtml.includes('一部の不利変化を避け'), 'score evidence dialog must preserve readable long raw text excerpts');
assert(syntheticDialogHtml.includes('対象:') && syntheticDialogHtml.includes('根拠:') && syntheticDialogHtml.includes('formation-score-evidence-raw-label'), 'score evidence dialog must show target/source on line 1 and raw text on line 2');
assert(scoreEvidenceCss.includes('overflow-x:hidden!important'), 'score evidence dialog must not rely on horizontal scrolling');
assert(scoreEvidenceCss.includes('-webkit-line-clamp:2'), 'score evidence raw text must be compacted to one or two readable lines');

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
const detailRow = (typeScore.candidateScores[0].rows || []).find(row => row.label === '自部隊不利対策') || typeScore.candidateScores[0].rows[0];
const detailEvidenceCount = (detailRow.matchedEffects || []).length + (detailRow.matchedParameters || []).length;
assert(detailEvidenceCount > 0, 'score calculation must emit tag-only matched evidence for the evaluation row');
assert.strictEqual(detailEvidenceCount, Number(detailRow.score || 0), 'matched tag evidence count must match row.score');
assert([...(detailRow.matchedEffects || []), ...(detailRow.matchedParameters || [])].every(item => item.label || item.name || item.sourceLabel || item.value), 'each matched tag evidence item must include a displayable label or value');

assert.strictEqual(typeScore.rendered, true, 'diagnostic must mark score UI as rendered');
assert.strictEqual(typeScore.emptyReason, '', 'successful scoring must not report empty reason');
assert(typeSearch && typeSearch.mode === 'formation-score', 'typeSearch diagnostic must mirror formation score execution');
assert(typeSearchCache && Number(typeSearchCache.stats?.store || 0) > 0, 'formation score path must populate typeSearchCache stats');
assert(debugEvents.some(event => event.name === 'typeScore'), 'copy-debug-log source must receive typeScore debug event');
assert(debugEvents.some(event => event.name === 'formationScore:render'), 'copy-debug-log source must receive formationScore:render debug event');
const formationSource = fs.readFileSync('hado_formation.js','utf8');
const styleSource = fs.readFileSync('hado_styles.css','utf8');
const updateMetaSource = fs.readFileSync('hado_update_meta.js','utf8');
assert(!updateMetaSource.includes('renderFormationScoreSummaryHtml=function') && !updateMetaSource.includes('const wrappedSummary=function'), 'hado_update_meta.js must not override the interactive formation score summary renderer');
assert(!updateMetaSource.includes('patchVaccine'), 'hado_update_meta.js must not retain legacy vaccine score patching');
assert(!updateMetaSource.includes('formation-vaccine-effect-keyword-match'), 'legacy keyword-match score policy must not be reintroduced through update meta');
assert(!updateMetaSource.includes('window.calculateFormationAutoScores='), 'hado_update_meta.js must not monkey-patch formation score calculation');
assert(!updateMetaSource.includes('renderFormationListHtml=function'), 'hado_update_meta.js must not replace list rendering to hide empty-data score calls');
assert(!formationSource.includes('calculateFormationAutoScores(f,{})'), 'formation list rendering must not invoke score calculation with empty data');
assert(formationSource.includes('formationScore:render'), 'formation score render diagnostics must exist');
assert(formationSource.includes('formationScore:visible'), 'formation score visible diagnostics must exist');
assert(formationSource.includes('formationScore:empty'), 'formation score empty diagnostics must exist');
assert(formationSource.includes('formationScore:detail-bind'), 'formation detail bind diagnostics must exist');
assert(formationSource.includes('formationScoreDetail:bind'), 'legacy formation detail bind diagnostics must still exist');
assert(formationSource.includes('chipCount:scoreDetailButtons.length'), 'formation detail bind diagnostics must report chip count even when zero');
assert(formationSource.includes('detailPanelRendered:!!detailPanel'), 'formation detail bind diagnostics must report detail panel presence');
assert(formationSource.includes('formationScore:detail-click'), 'formation detail click diagnostics must exist');
assert(formationSource.includes('handleFormationScoreDetailClick'), 'formation score detail clicks should use a shared guarded handler');
assert(formationSource.includes('event.preventDefault();event.stopPropagation();'), 'formation score detail clicks should not bubble into parent formation controls');
assert(formationSource.includes('formationScore:detail-delegate'), 'formation score detail delegated click diagnostics must exist');
assert(formationSource.includes("querySelectorAll('.formation-score-card')"), 'formation score detail binding must cover every duplicated score card');
assert(formationSource.includes('scoreCards.forEach(card=>'), 'formation score detail delegated events must be attached to every score card');
assert(formationSource.includes("rawText:String(row?.rawText||row?.matchedText||'').slice(0,500)"), 'score evidence debug rows must preserve enough raw text for matched labels');
assert(formationSource.includes('function sumFormationScoreDetails(details)'), 'legacy score-detail total helper must remain defined to prevent render-time ReferenceError');
assert(formationSource.includes('<strong aria-label="根拠 ${esc(evidenceCount)}件">${esc(evidenceCount)}</strong>'), 'metric chip value must match rendered tag count');
assert(formationSource.includes('formationScore:detail-open-delegate'), 'detail panel click must have delegated dialog opening');
assert(!formationSource.includes('data-formation-score-show-more'), 'score evidence UI must not render a show-more button');
assert(formationSource.includes('function calculateFormationDisplayedTotalScore(rows){return (Array.isArray(rows)?rows:[]).reduce'), 'total score must be the sum of displayed evaluation score rows');
assert(formationSource.includes('function calculateFormationDisplayedTotalScore(rows)'), 'rendered total score must use a scoped visible-total helper');
assert(formationSource.includes('<strong>${esc(visibleTotalScore)}</strong>'), 'score card header must render the recalculated visible total');
assert(formationSource.includes('function formationScoreEvidenceDisplayTitle(title,source)'), 'formation evidence labels must use a shared parenthesized source formatter');
assert(formationSource.includes('displayTitle:formationScoreEvidenceDisplayTitle'), 'every evidence tag with a source must render a parenthesized source label');
assert(!formationSource.includes('const sourceLabels='), 'formation score renderer must not build an aggregate sourceLabels dump');
assert(!formationSource.includes('class="sr-only"'), 'formation score renderer must not rely on an undefined sr-only class to hide aggregate labels');

context.buildFormationParameterData = originalBuildFormationParameterData;
context.calculateFormationAutoScores = originalCalculateFormationAutoScores;
const judgementTable = Array.isArray(context.window.HadoTypeScore?.BRIDGE_ROWS) ? context.window.HadoTypeScore.BRIDGE_ROWS : [];
const typeNames = new Map(judgementTable.map(row => [row.typeId, row.typeName || row.typeId]));
for (const [typeId, typeName] of typeNames) {
  const testFormation = JSON.parse(JSON.stringify(formation));
  testFormation.evaluationTypeId = typeId;
  testFormation.evaluationTypeName = typeName;
  context.state.formations = [testFormation];
  context.state.currentFormationId = testFormation.id;
  context.state.formationScoreDetailIndex = 0;
  context.state.formationScoreEvidenceDialogOpen = true;
  let typeHtml;
  try { typeHtml = context.renderFormationScoreSummaryHtml(testFormation, formationData); } catch (err) { throw new Error(`${typeId} render failed: ${err.message}`); }
  assert(typeHtml.includes('/ 5項目'), `${typeId} score UI must render 型名 / 5項目`);
  assert(!typeHtml.includes('/ 1項目') && !typeHtml.includes('/ 2項目'), `${typeId} score UI must not render reduced metric count`);
  for (const label of judgementTable.filter(row => row.typeId === typeId).map(row => row.scoreMetricLabel)) {
    assert(typeHtml.includes(label), `${typeId} score UI must render metric label: ${label}`);
  }
  for (const token of ['>評価2<','>評価3<','>評価4<','>評価5<','Primary','Support','Deny','deny_change_item','changeItemId','scoreRole',' self',' ally',' enemy',' unknown','除外された根拠']) {
    assert(!typeHtml.includes(token), `${typeId} score UI must not expose technical token: ${token}`);
  }
}

assert(formationSource.includes('function renderFormationScoreEvidenceDialogHtml(row)'), 'score evidence detail click must render a dedicated dialog');
assert(formationSource.includes('formation-score-evidence-dialog-list'), 'score evidence dialog must contain an all-item evidence list');
assert(formationSource.includes('state.formationScoreEvidenceDialogOpen=true'), 'detail panel click must open the evidence dialog instead of inline expansion');
assert(formationSource.includes('formation-quick-summary-chip'), 'score evidence dialog must share result-summary chip styling');
assert(formationSource.includes('評価${esc(evidenceRows.length)} / 根拠${esc(evidenceRows.length)}件'), 'score detail header must show actual rendered evidence count');
assert(formationSource.includes('renderFormationTeamBoardSelectableHtml(f,`${scoreCardHtml}${quickSummaryHtml}`)'), 'mobile board must receive score card before summary');
assert(formationSource.includes('${formationWarhorseEditorHtml}${scoreCardHtml}${quickSummaryHtml}'), 'PC score card remains in selected stack');
assert(formationSource.includes("querySelectorAll('#formationEvaluationTypeSelect,[data-formation-evaluation-type-select]'"), 'all score-panel type selects must be bound, including duplicated mobile/PC score cards');
assert(formationSource.includes('formationScoreDetail:click'), 'legacy formation detail click diagnostics must still exist');
assert(formationSource.includes("rowLabel:btn?.dataset?.formationScoreDetailLabel"), 'formation detail click diagnostics must include row label');
assert(formationSource.includes("evidenceCount:Number(btn?.dataset?.formationScoreDetailEvidenceCount)"), 'formation detail click diagnostics must include evidence count');

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
  debugEventNames: debugEvents.map(event => event.name),
  htmlIncludesVisibleScoreCard: html.includes('formation-score-card'),
  htmlIncludesMetricChip: html.includes('formation-score-metric-chip')
};

console.log('formation type score render ok:');
console.log(JSON.stringify(proof, null, 2));
