'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const evaluator = require('../hado_formation_condition_evaluator.js');
const integration = require('../hado_search_clause_integration.js');

const clauseData = JSON.parse(fs.readFileSync('hadou_effect_clauses.json', 'utf8'));
const featureData = JSON.parse(fs.readFileSync('hadou_type_search_feature_index.json', 'utf8'));
const relatedData = JSON.parse(fs.readFileSync('hadou_related_link_index.json', 'utf8'));
const statusData = JSON.parse(fs.readFileSync('hadou_status_effects.json', 'utf8'));
evaluator.indexClauseData(clauseData);
const diagnostic = integration.indexData({ effectClauses: clauseData, typeSearchFeatureIndex: featureData, relatedLinkIndex: relatedData, statusEffects: statusData });

assert.strictEqual(diagnostic.ready, true);
assert.strictEqual(diagnostic.reviewedCaseCount, 44);
assert(diagnostic.reviewedEntityCount > 0);
assert(diagnostic.conditionTagCount > 0);
assert(diagnostic.triggerTagCount > 0);
assert(diagnostic.canonicalStatusRefCount > 0);
assert(diagnostic.canonicalStatusKeyCount > 0);

const yuan = integration.getEntitySummary('generals', 'LR袁紹（えんしょう）');
assert.strictEqual(yuan.trust, 'reviewed');
assert(yuan.tags.includes('条件:主将'));
assert(yuan.tags.includes('条件:兵力50%以上'));
assert(integration.getEntitySearchText('generals', 'LR袁紹（えんしょう）').includes('条件:主将'));

const unreviewed = integration.getEntitySummary('generals', 'UR沙摩柯（しゃまか）');
assert.strictEqual(unreviewed.trust, 'generated');
assert.deepStrictEqual([...unreviewed.tags], [], 'generated clauses must not become inferred search tags');

const statusMatches = integration.getCanonicalStatusMatches({ category: 'generals', name: 'LR馬良（ばりょう）', statusName: '有利激攻', groupKey: 'selfAbilityBuff' });
assert(statusMatches.length > 0);
assert.strictEqual(statusMatches[0].statusEffectKey, 'statusEffects:12');
assert.strictEqual(statusMatches[0].reason, 'canonical-status-effect-id');
assert.strictEqual(statusMatches[0].canonical, true);
const tacticWithCanonicalStatus = relatedData.items.find(row => row.category === 'tactics' && (row.related?.statusEffects || []).some(ref => ref.statusEffectKey));
assert(tacticWithCanonicalStatus, 'canonical tactic status reference fixture is required');
const tacticRef = tacticWithCanonicalStatus.related.statusEffects.find(ref => ref.statusEffectKey);
const tacticMatches = integration.getCanonicalStatusMatches({ category: 'tactics', name: tacticWithCanonicalStatus.name, statusName: tacticRef.statusEffectName || tacticRef.name, groupKey: tacticRef.groupKey });
assert(tacticMatches.some(ref => ref.statusEffectKey === tacticRef.statusEffectKey), 'tactics must use the canonical related-link status ID');

assert.strictEqual(integration.renderResultHtml, undefined, 'internal Clause diagnostics must not render on user-facing result cards');

const bootstrapSource = fs.readFileSync('hado_bootstrap.js', 'utf8');
const searchSource = fs.readFileSync('hado_search.js', 'utf8');
const statusSource = fs.readFileSync('hado_status_effects.js', 'utf8');
const versionSource = fs.readFileSync('hado_version.js', 'utf8');
const metaSource = fs.readFileSync('hado_update_meta.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(bootstrapSource.includes('HADO_SEARCH_CLAUSE_INTEGRATION.indexData'));
assert(searchSource.includes('getCanonicalStatusMatches'));
assert(searchSource.includes("canonical-status-effect-id") || searchSource.includes('canonicalIdentity'));
assert(statusSource.includes('mergeClauseSearchTags'));
assert(statusSource.includes('getEntitySearchText'));
assert(!statusSource.includes('renderResultHtml'));
assert(!statusSource.includes('正規ID一致'));
assert(indexHtml.indexOf('hado_detail_condition_presenter.js') < indexHtml.indexOf('hado_search_clause_integration.js'));
assert(indexHtml.indexOf('hado_search_clause_integration.js') < indexHtml.indexOf('hado_search.js'));
assert(!indexHtml.includes('hado_update06.css'));
assert(indexHtml.includes('hado_search_clause_integration.js?v=06-r183'));
assert(!indexHtml.includes('06-r180'));
assert(!indexHtml.includes('07-r179'));
assert(versionSource.includes("updateNo: '06'"));
assert(versionSource.includes('revision: 183'));
assert(versionSource.includes('formalRelease: false'));

const nodes = new Map();
const node = id => (nodes.has(id) ? nodes.get(id) : (nodes.set(id, { textContent: '' }), nodes.get(id)));
const document = { title: '', readyState: 'complete', getElementById: node, querySelector: selector => selector === '#appTitlePanel h1' ? node('h1') : null, querySelectorAll: () => [], addEventListener() {} };
const context = { console, document, fetch: async () => { throw new Error('offline'); } };
context.window = context;
vm.createContext(context);
vm.runInContext(versionSource, context, { filename: 'hado_version.js' });
vm.runInContext(metaSource, context, { filename: 'hado_update_meta.js' });
assert.strictEqual(context.window.HADO_APP_DISPLAY_VERSION, '3.1.0.0 Update06 r183');

console.log(`3.1.0.0 Update06 search internals ok: ${diagnostic.conditionTagCount} condition tags / ${diagnostic.triggerTagCount} trigger tags / ${diagnostic.canonicalStatusRefCount} canonical status refs / no internal result-card labels`);
