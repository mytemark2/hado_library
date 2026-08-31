/* Tag-color assignment and safe text highlighting shared by search surfaces. */
(() => {
  'use strict';

  const PALETTE_SIZE = 12;
  const normalize = value => String(value ?? '').trim();
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
  const escapeRegExp = value => String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const unique = values => [...new Set((Array.isArray(values) ? values : []).map(normalize).filter(Boolean))];

  function assignSlots(selectedTags, previousSlots = {}) {
    const tags = unique(selectedTags);
    const result = {};
    const used = new Set();
    tags.forEach(tag => {
      const slot = Number(previousSlots?.[tag]);
      if (Number.isInteger(slot) && slot >= 0 && slot < PALETTE_SIZE && !used.has(slot)) {
        result[tag] = slot;
        used.add(slot);
      }
    });
    tags.forEach((tag, index) => {
      if (Object.prototype.hasOwnProperty.call(result, tag)) return;
      let slot = Array.from({ length: PALETTE_SIZE }, (_, value) => value).find(value => !used.has(value));
      if (!Number.isInteger(slot)) slot = index % PALETTE_SIZE;
      result[tag] = slot;
      used.add(slot);
    });
    return result;
  }

  function buildEntries(selectedTags, itemTags, getLabel, slots = {}) {
    const owned = new Set(unique(itemTags));
    return unique(selectedTags).filter(tag => owned.has(tag)).map(tag => {
      const separator = tag.indexOf(':');
      const rawValue = normalize(separator >= 0 ? tag.slice(separator + 1) : tag);
      const label = normalize(typeof getLabel === 'function' ? getLabel(tag) : rawValue) || rawValue;
      return {
        tag,
        label,
        slot: Number.isInteger(Number(slots[tag])) ? Number(slots[tag]) % PALETTE_SIZE : 0,
        terms: unique([label, rawValue]).sort((a, b) => b.length - a.length)
      };
    });
  }

  function buildMatcher(entries) {
    const byTerm = new Map();
    (Array.isArray(entries) ? entries : []).forEach(entry => {
      unique(entry?.terms).forEach(term => {
        const key = term.toLocaleLowerCase('ja-JP');
        if (!byTerm.has(key)) byTerm.set(key, entry);
      });
    });
    const terms = [...byTerm.keys()].sort((a, b) => b.length - a.length);
    if (!terms.length) return null;
    return { byTerm, regex: new RegExp(terms.map(escapeRegExp).join('|'), 'giu') };
  }

  function splitMatches(text, entries) {
    const source = String(text ?? '');
    const matcher = buildMatcher(entries);
    if (!matcher) return [{ text: source, entry: null }];
    const parts = [];
    let last = 0;
    for (const match of source.matchAll(matcher.regex)) {
      const index = match.index ?? 0;
      if (index > last) parts.push({ text: source.slice(last, index), entry: null });
      const value = match[0];
      const entry = matcher.byTerm.get(value.toLocaleLowerCase('ja-JP')) || null;
      parts.push({ text: value, entry });
      last = index + value.length;
    }
    if (last < source.length) parts.push({ text: source.slice(last), entry: null });
    return parts.length ? parts : [{ text: source, entry: null }];
  }

  function highlightTextHtml(text, entries) {
    return splitMatches(text, entries).map(part => {
      if (!part.entry) return escapeHtml(part.text);
      return `<mark class="tag-text-highlight tag-color-${part.entry.slot}" data-selected-tag="${escapeHtml(part.entry.tag)}">${escapeHtml(part.text)}</mark>`;
    }).join('');
  }

  function applyToTextNodes(root, entries) {
    if (!root || !Array.isArray(entries) || !entries.length) return 0;
    const doc = root.ownerDocument;
    const nodeFilter = doc?.defaultView?.NodeFilter || globalThis.NodeFilter;
    if (!doc || !nodeFilter) return 0;
    const exactByTerm = buildMatcher(entries)?.byTerm || new Map();
    root.querySelectorAll?.('mark.search-hit').forEach(mark => {
      const entry = exactByTerm.get(normalize(mark.textContent).toLocaleLowerCase('ja-JP'));
      if (!entry) return;
      mark.classList.add('tag-text-highlight', `tag-color-${entry.slot}`);
      mark.dataset.selectedTag = entry.tag;
    });
    const skipTags = new Set(['SCRIPT', 'STYLE', 'PRE', 'TEXTAREA', 'INPUT', 'SELECT', 'BUTTON']);
    const walker = doc.createTreeWalker(root, nodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || skipTags.has(parent.tagName)) return nodeFilter.FILTER_REJECT;
        if (parent.closest?.('.tag-highlight-token,.tag-text-highlight,.search-hit,.selected-tag-badge,.tag-picker-option,.search-result-matched-tag')) return nodeFilter.FILTER_REJECT;
        return splitMatches(node.nodeValue || '', entries).some(part => part.entry) ? nodeFilter.FILTER_ACCEPT : nodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let count = 0;
    nodes.forEach(node => {
      const fragment = doc.createDocumentFragment();
      splitMatches(node.nodeValue || '', entries).forEach(part => {
        if (!part.entry) {
          fragment.appendChild(doc.createTextNode(part.text));
          return;
        }
        const mark = doc.createElement('mark');
        mark.className = `tag-text-highlight tag-color-${part.entry.slot}`;
        mark.dataset.selectedTag = part.entry.tag;
        mark.textContent = part.text;
        fragment.appendChild(mark);
        count += 1;
      });
      node.parentNode?.replaceChild(fragment, node);
    });
    return count;
  }

  const api = Object.freeze({
    PALETTE_SIZE,
    assignSlots,
    buildEntries,
    splitMatches,
    highlightTextHtml,
    applyToTextNodes,
    escapeHtml
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.HADO_TAG_HIGHLIGHT = api;
})();
