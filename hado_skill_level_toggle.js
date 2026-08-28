(() => {
  'use strict';

  let instanceSerial = 0;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeLevel(value) {
    const source = String(value ?? '').trim();
    if (!source) return '';
    const roman = source.match(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]/g);
    if (roman?.length) return roman[roman.length - 1];
    const number = Number(source.replace(/[^0-9]/g, ''));
    return Number.isFinite(number) && number >= 1 && number <= 10
      ? ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'][number - 1]
      : source;
  }

  function hasAvailableDescription(text, html) {
    const plainText = String(text ?? '').trim();
    const renderedHtml = String(html ?? '').trim();
    const placeholderPattern = /^[-－—―‐‑‒–]+$/;
    if (plainText && !placeholderPattern.test(plainText)) return true;
    return !!renderedHtml;
  }

  function normalizeRows(rows) {
    const seen = new Set();
    return (Array.isArray(rows) ? rows : []).map(row => {
      const source = Array.isArray(row)
        ? { level: row[0], text: row[1], html: row[2] }
        : (row || {});
      const level = normalizeLevel(source.level);
      if (!level || seen.has(level)) return null;
      const text = String(source.text ?? '');
      const html = String(source.html ?? '');
      if (source.available === false || !hasAvailableDescription(text, html)) return null;
      seen.add(level);
      return {
        level,
        text,
        html
      };
    }).filter(Boolean);
  }

  function resolveCurrentLevel(rows, requestedLevel) {
    const requested = normalizeLevel(requestedLevel);
    if (requested && rows.some(row => row.level === requested)) return requested;
    const order = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];
    const requestedIndex = order.indexOf(requested);
    if (requestedIndex >= 0) {
      const lower = rows.filter(row => order.indexOf(row.level) <= requestedIndex).pop();
      if (lower) return lower.level;
    }
    return '';
  }

  function build(options = {}) {
    const rows = normalizeRows(options.rows);
    if (!rows.length) return '';
    const skillName = String(options.skillName ?? '').trim();
    const currentLevel = resolveCurrentLevel(rows, options.currentLevel);
    const prefix = String(options.idPrefix || 'skill-level').replace(/[^A-Za-z0-9_-]/g, '-') || 'skill-level';
    const instanceId = `${prefix}-${++instanceSerial}`;
    const renderDescription = typeof options.renderDescription === 'function'
      ? options.renderDescription
      : row => escapeHtml(row.text || '-');
    const buttons = rows.map((row, index) => {
      const open = row.level === currentLevel;
      const panelId = `${instanceId}-panel-${index + 1}`;
      return `<button type="button" class="skill-level-toggle${open ? ' is-active' : ''}" data-skill-level-target="${escapeHtml(panelId)}" aria-controls="${escapeHtml(panelId)}" aria-expanded="${open ? 'true' : 'false'}" aria-pressed="${open ? 'true' : 'false'}">${escapeHtml(row.level)}</button>`;
    }).join('');
    const panels = rows.map((row, index) => {
      const open = row.level === currentLevel;
      const panelId = `${instanceId}-panel-${index + 1}`;
      const description = renderDescription(row) || '<div class="skill-level-empty">説明なし</div>';
      return `<div id="${escapeHtml(panelId)}" class="skill-level-panel" data-skill-level="${escapeHtml(row.level)}"${open ? '' : ' hidden'}>${description}</div>`;
    }).join('');
    return `<div class="skill-level-disclosure" data-skill-name="${escapeHtml(skillName)}"><div class="skill-level-toggle-row" role="group" aria-label="${escapeHtml(skillName || '技能')}のレベル表示">${buttons}</div><div class="skill-level-panel-stack">${panels}</div></div>`;
  }

  function bind(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return 0;
    let count = 0;
    root.querySelectorAll('.skill-level-toggle[data-skill-level-target]').forEach(button => {
      if (button.dataset.skillLevelBound === '1') return;
      button.dataset.skillLevelBound = '1';
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-skill-level-target');
        const scope = button.closest('.skill-level-disclosure') || root;
        const panel = scope.querySelector(`#${targetId}`);
        if (!panel) return;
        const nextOpen = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
        button.setAttribute('aria-pressed', nextOpen ? 'true' : 'false');
        button.classList.toggle('is-active', nextOpen);
        panel.hidden = !nextOpen;
      });
      count += 1;
    });
    return count;
  }

  window.HADO_SKILL_LEVEL_TOGGLE = Object.freeze({
    build,
    bind,
    normalizeLevel,
    normalizeRows,
    resolveCurrentLevel,
    hasAvailableDescription
  });
})();
