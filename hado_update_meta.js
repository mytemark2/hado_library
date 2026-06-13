/* HADO app Update display synchronizer: keep visible version labels aligned with HADO_DEV_INFO.json. */
(() => {
  'use strict';

  const META_URL = './HADO_DEV_INFO.json';
  const VERSION_SOURCE = Object.freeze({ ...(window.HADO_VERSION || {}) });
  const FALLBACK = Object.freeze(normalizeMeta(VERSION_SOURCE));
  window.HADO_APP_VERSION_META = FALLBACK;

  let current = FALLBACK;
  let syncing = false;
  let started = false;

  function normalizeMeta(raw) {
    const releaseVersion = String(raw?.releaseVersion || VERSION_SOURCE.releaseVersion || '').trim();
    const updateNo = String(raw?.updateNo || VERSION_SOURCE.updateNo || '').trim();
    const displayVersion = String(raw?.displayVersion || (releaseVersion && updateNo ? `${releaseVersion} Update${updateNo}` : releaseVersion)).trim();
    return { ...VERSION_SOURCE, ...raw, releaseVersion, updateNo, displayVersion };
  }

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function syncVisibleVersion(meta = current) {
    if (syncing) return;
    syncing = true;
    try {
      current = normalizeMeta(meta);
      const display = current.displayVersion;
      const title = `覇道ライブラリ ${display}`;
      if (document.title !== title) document.title = title;
      setText(document.querySelector('#appTitlePanel h1'), title);

      document.querySelectorAll('#hadoTypeEntryModal .hte-sub').forEach((node) => {
        const text = node.textContent || '';
        const suffix = text.includes(' / ') ? text.slice(text.indexOf(' / ')) : '';
        setText(node, `${display}${suffix}`);
      });

      document.querySelectorAll('#hct-modal .hct-note').forEach((node) => {
        const text = node.textContent || '';
        if (!/Update\d+(?:\.\d+)?\s*\/\s*部隊:/.test(text)) return;
        setText(node, text.replace(/^.*?Update\d+(?:\.\d+)?\s*\/\s*部隊:/, `${display} / 部隊:`));
      });

      window.HADO_DEV_INFO = current;
      window.HADO_APP_DISPLAY_VERSION = display;
      window.HADO_APP_VERSION_META = current;
    } finally {
      syncing = false;
    }
  }

  async function loadMeta() {
    try {
      const response = await fetch(META_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      syncVisibleVersion(await response.json());
    } catch (_) {
      syncVisibleVersion(FALLBACK);
    }
  }

  function requestSync() {
    syncVisibleVersion(current);
  }

  function start() {
    if (started) return;
    started = true;
    syncVisibleVersion(FALLBACK);
    loadMeta();
    window.addEventListener('pageshow', requestSync);
    window.addEventListener('hado:version-sync-request', requestSync);
  }

  window.HADO_SYNC_VISIBLE_VERSION = requestSync;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
