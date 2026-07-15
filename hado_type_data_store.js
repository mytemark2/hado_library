/* HADO app shared type-search data store. */
(() => {
  'use strict';

  const FILES = Object.freeze({
    roles: 'hadou_type_search_role_index.json',
    scoreRules: 'hadou_type_score_rules.json',
    purposeRules: 'hadou_type_purpose_rules.json'
  });
  let cached = null;
  let pending = null;
  const stats = { requests: 0, cacheHits: 0, loads: 0, lastLoadMs: 0 };

  async function fetchJson(file) {
    stats.requests += 1;
    const response = await fetch(file, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    return response.json();
  }

  function load() {
    if (cached) {
      stats.cacheHits += 1;
      return Promise.resolve(cached);
    }
    if (pending) {
      stats.cacheHits += 1;
      return pending;
    }
    const started = performance.now();
    pending = Promise.all([
      fetchJson(FILES.roles),
      fetchJson(FILES.scoreRules),
      fetchJson(FILES.purposeRules)
    ]).then(([roleIndex, scoreRules, purposeRules]) => {
      cached = Object.freeze({ roleIndex, scoreRules, purposeRules });
      stats.loads += 1;
      stats.lastLoadMs = Number((performance.now() - started).toFixed(1));
      return cached;
    }).finally(() => {
      pending = null;
    });
    return pending;
  }

  function peek() { return cached; }
  function getStats() { return { ...stats, loaded: !!cached, pending: !!pending }; }
  function resetForTest() { cached = null; pending = null; stats.requests = 0; stats.cacheHits = 0; stats.loads = 0; stats.lastLoadMs = 0; }

  window.HadoTypeDataStore = Object.freeze({ load, peek, getStats, resetForTest, files: FILES });
})();
