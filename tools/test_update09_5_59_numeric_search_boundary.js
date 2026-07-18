#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const metricSource = fs.readFileSync('hado_status_effects.js', 'utf8');
const searchSource = fs.readFileSync('hado_search.js', 'utf8');

function extractLastFunction(source, name) {
  const start = source.lastIndexOf(`function ${name}(`);
  assert(start >= 0, `function missing: ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`unbalanced function: ${name}`);
}

const context = {
  String, Number, Array, Object, RegExp,
  norm: value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim(),
  escRe: value => String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
};
vm.createContext(context);
for (const name of [
  'normalizeMetricSearchText',
  'parseMetricSearchKeyword',
  'metricMatchesSearchQuery',
  'normalizeMetricSourceText',
  'normalizeMetricSegmentForMatch',
  'collectMetricMatchesFromSegment'
]) {
  vm.runInContext(`${extractLastFunction(metricSource, name)}; this.${name}=${name};`, context);
}

const plusQuery = context.parseMetricSearchKeyword('兵力+');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(plusQuery)),
  { raw: '兵力+', base: '兵力', sign: '+', numberText: '', unit: '', position: 'suffix-sign', mode: 'sign-only' }
);
assert.strictEqual(context.parseMetricSearchKeyword('攻撃速度＋').sign, '+', 'full-width plus must normalize');
assert.strictEqual(context.parseMetricSearchKeyword('防御－').sign, '-', 'full-width minus must normalize');

const positive = context.collectMetricMatchesFromSegment('部隊の兵力+15%', ['兵力'], 0);
const negative = context.collectMetricMatchesFromSegment('部隊の兵力-10%', ['兵力'], 0);
const unsigned = context.collectMetricMatchesFromSegment('基礎兵力 9000', ['兵力'], 0);
assert.strictEqual(positive[0].sign, '+');
assert.strictEqual(negative[0].sign, '-');
assert.strictEqual(unsigned[0].sign, '');
assert(context.metricMatchesSearchQuery({ matches: positive }, plusQuery), '兵力+ must accept an explicit positive value');
assert(!context.metricMatchesSearchQuery({ matches: negative }, plusQuery), '兵力+ must reject a negative value');
assert(!context.metricMatchesSearchQuery({ matches: unsigned }, plusQuery), '兵力+ must reject an unsigned basic value');
assert(!context.metricMatchesSearchQuery(null, plusQuery), '兵力+ must reject text-only matches');

const exactQuery = context.parseMetricSearchKeyword('兵力+15%');
assert(context.metricMatchesSearchQuery({ matches: positive }, exactQuery), 'exact signed numeric query must match');
assert(!context.metricMatchesSearchQuery({ matches: context.collectMetricMatchesFromSegment('部隊の兵力+10%', ['兵力'], 0) }, exactQuery), 'exact numeric query must reject another value');

const searchIndex = JSON.parse(fs.readFileSync('hadou_search_index.json', 'utf8')).items;
const luBu = searchIndex.find(item => String(item?.name || '').startsWith('LR呂布（'));
assert(luBu, 'real LR呂布 search fixture must exist');
assert(String(luBu.searchText || '').includes('兵力を決定'), 'real LR呂布 fixture must keep the text-only troop reference');
const luBuMatches = context.collectMetricMatchesFromSegment(String(luBu.searchText || ''), ['兵力'], 0);
assert(!context.metricMatchesSearchQuery({ matches: luBuMatches }, plusQuery), 'real LR呂布 must not satisfy 兵力+');

assert(
  searchSource.includes("searchContext.mode!=='plain'&&!metricMatchesSearchQuery(metric,searchContext)"),
  'renderSearchResults must enforce the numeric metric boundary before adding a result'
);

console.log('Update09.5.59 numeric search boundary passed: explicit sign/number/unit required and LR呂布 excluded from 兵力+');
