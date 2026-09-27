#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const searchSource = fs.readFileSync('hado_search.js', 'utf8');
const coreSource = fs.readFileSync('hado_core.js', 'utf8');
const ownerIndex = JSON.parse(fs.readFileSync('hadou_status_effect_group_owner_index.json', 'utf8'));
const group = (ownerIndex.items || []).find(item => item.groupKey === 'selfResistanceBuff');
assert(group, 'self-disadvantage owner index must exist');
const sourceOwner = (group.owners?.generals || []).find(owner => owner.name === 'LR張角（ちょうかく）' && owner.statusEffectName === '感電回避[大賢]');
assert(sourceOwner, 'the generated owner index must contain LR張角 through 大賢');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `function missing: ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`unbalanced function: ${name}`);
}

const sourceHit = {
  name: sourceOwner.statusEffectName,
  groupKey: group.groupKey,
  relationType: '回避',
  sourceText: sourceOwner.source,
  matchedText: sourceOwner.matchedText
};
const ownerMap = new Map([['LR張角（ちょうかく）', { hits: [sourceHit] }]]);
const index = { bucket: { generals: ownerMap }, source: 'generated-status-effect-group-owner-index-canonical', cacheHit: false };
const context = {
  Object, Array, Number, String, Map, Set,
  norm: value => String(value || '').replace(/\s+/g, ' ').trim(),
  normalizeQuickStatusEffectTrendLabel: value => String(value || '').trim().replace(/\[[^\]]+\]$/, ''),
  normalizeGeneralStage: value => value === 'initial' ? 'initial' : 'max',
  state: { viewMode: 'all', generalStage: 'max' },
  getDerivedStatusEffectGroupOwnerIndex: key => key === group.groupKey ? group : null,
  buildQuickStatusEffectGroupOwnerNameIndex: filter => {
    assert.strictEqual(filter.kind, 'group');
    assert.strictEqual(filter.group, group.groupKey);
    return index;
  },
  getItemDisplayName: item => item.name
};
vm.createContext(context);
vm.runInContext(`${extractFunction(searchSource, 'collectQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData')}; this.collectQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData=collectQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData; ${extractFunction(searchSource, 'mergeQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData')}; this.mergeQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData=mergeQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData;`, context);

const general = { name: 'LR張角（ちょうかく）' };
const filter = { kind: 'countermeasure', group: 'selfResistanceBuff', label: '感電回避', statusName: '感電', relationType: '回避' };
const hits = context.collectQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData(general, 'generals', filter);
assert.strictEqual(hits.length, 1, 'all-data max-level individual search must find LR張角');
assert.strictEqual(hits[0].name, '感電回避[大賢]');
assert.strictEqual(hits[0].reason, 'generated-status-individual-owner-index');
const existingDirectMatch = [{ name: '感電回避', groupKey: 'selfResistanceBuff', relationType: '回避', reason: 'direct-countermeasure' }];
context.mergeQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData(existingDirectMatch, general, 'generals', filter);
assert.strictEqual(existingDirectMatch.length, 1, 'the generated index must not duplicate an already-found exact individual result');
assert.strictEqual(context.collectQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData(general, 'generals', { ...filter, label: '会心耐性' }).length, 0, 'a different selected effect must not match');

context.state.generalStage = 'initial';
assert.strictEqual(context.collectQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData(general, 'generals', filter).length, 0, 'initial skill-level searches must not receive max-level index hits');
context.state.generalStage = 'max';
context.state.viewMode = 'saved';
assert.strictEqual(context.collectQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData(general, 'generals', filter).length, 0, 'saved-data searches must use saved skill levels, not all-data maximum');

const ownerSearchStart = searchSource.indexOf('function collectQuickStatusEffectOwnersForItem(');
const ownerSearchEnd = searchSource.indexOf('\n\nfunction ensureQuickOwnerDefaultActiveCategories', ownerSearchStart);
assert(searchSource.slice(ownerSearchStart, ownerSearchEnd).includes('mergeQuickStatusEffectOwnersFromGeneratedIndexForMaxAllData(out,item,categoryKey,filter)'), 'individual quick search must merge exact matches from the generated owner index');
assert(searchSource.includes('generalStage:${state.generalStage||\'\'}'), 'per-item owner cache must distinguish initial and max skill-level modes');
assert(coreSource.includes("state.quickStatusEffectOwnerFilter,{reason:'general-stage-change'}"), 'changing the global skill stage must rerun active owner searches');

console.log('individual status-effect max-level owner index regression passed: LR張角 / exact effect / initial and saved-mode guards');
