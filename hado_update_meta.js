/* HADO app Update display synchronizer: keep visible version labels aligned with HADO_DEV_INFO.json.
   Update09.5.10: this file is metadata-only; runtime scoring/layout fixes belong in source modules and validators block legacy hotfix overrides. */
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
      setText(document.getElementById('uxHomeVersionBadge'), `${display} 操作ガイド`);
      setText(document.getElementById('diagnosticAppVersion'), `覇道ライブラリ｜${display}`);

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
      const res = await fetch(META_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return normalizeMeta(await res.json());
    } catch (_) {
      return FALLBACK;
    }
  }

  async function start() {
    if (started) return;
    started = true;
    syncVisibleVersion(FALLBACK);
    const meta = await loadMeta();
    syncVisibleVersion(meta);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
