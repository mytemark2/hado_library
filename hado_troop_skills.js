/* Hado Library 3.1.2.0: searchable troop-skill dataset derived from hadou_generals.json.troop_effects. */
(function initHadoTroopSkills(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HADO_TROOP_SKILLS = api;
})(typeof window !== 'undefined' ? window : globalThis, function createHadoTroopSkills() {
  'use strict';

  const clean = value => String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function getContract(rawGenerals) {
    if (!rawGenerals || typeof rawGenerals !== 'object' || Array.isArray(rawGenerals)) return null;
    return rawGenerals.troop_effects || rawGenerals.troopEffects || null;
  }

  function normalize(rawGenerals) {
    const contract = getContract(rawGenerals);
    const groups = Array.isArray(contract?.items) ? contract.items : [];
    const rows = [];
    groups.forEach((group, groupIndex) => {
      const troopType = clean(group?.troop_type || group?.troopType);
      const grantText = clean(group?.grant_text || group?.grantText);
      const effects = Array.isArray(group?.effects) ? group.effects : [];
      effects.forEach((effect, effectIndex) => {
        const name = clean(effect?.name) || `${troopType || '兵科'}技能${effectIndex + 1}`;
        const description = clean(effect?.description);
        const sources = Array.isArray(effect?.sources) ? effect.sources.map(source => ({
          url: clean(source?.url),
          collectedAt: clean(source?.collected_at || source?.collectedAt),
          method: clean(source?.method)
        })).filter(source => source.url) : [];
        const sourceUrls = Array.isArray(group?.source_urls) ? group.source_urls.map(clean).filter(Boolean) : [];
        rows.push({
          id: `troop-skill:${troopType || groupIndex + 1}:${name}`,
          name,
          title: name,
          description,
          troopType,
          grantText,
          sources,
          sourceUrls,
          url: sources[0]?.url || sourceUrls[0] || '',
          category: 'troopSkills',
          sourceDataset: 'troopSkills',
          schemaVersion: Number(contract?.schema_version || contract?.schemaVersion || 0),
          scope: clean(contract?.scope),
          searchTokens: [name, troopType, grantText, description, '兵科', '兵科技能'].filter(Boolean),
          _resultCardIndex: {
            displayName: name,
            subtitle: [troopType, grantText].filter(Boolean).join(' / '),
            badges: troopType ? [troopType] : []
          },
          sections: [
            {title: '基本情報', content: [`兵科：${troopType || '-'}`, `付与：${grantText || '-'}`]},
            {title: '効果', content: [description || '-']}
          ],
          raw: {name, description, troopType, grantText}
        });
      });
    });
    return rows;
  }

  function renderDetailHtml(item) {
    const troopType = clean(item?.troopType) || '-';
    const grantText = clean(item?.grantText) || '-';
    const description = clean(item?.description) || '-';
    return `<div class="general-detail-stack"><div class="general-card"><div class="general-card-header">基本情報</div><div class="general-card-body"><div class="equipment-kv-list"><div class="equipment-kv-row"><span>兵科</span><strong>${escapeHtml(troopType)}</strong></div><div class="equipment-kv-row"><span>付与</span><strong>${escapeHtml(grantText)}</strong></div></div></div></div><div class="general-card"><div class="general-card-header">効果</div><div class="general-card-body"><p>${escapeHtml(description)}</p></div></div></div>`;
  }

  function buildCopyLines(item) {
    return [
      `兵科：${clean(item?.troopType) || '-'}`,
      `付与：${clean(item?.grantText) || '-'}`,
      '',
      '■ 効果',
      clean(item?.description) || '-'
    ];
  }

  function install() {
    if (typeof applyLoadedData !== 'function' || typeof updateCountStatus !== 'function' || typeof itemMatchesSavedMode !== 'function') return false;
    if (install.done) return true;
    install.done = true;

    const baseApplyLoadedData = applyLoadedData;
    applyLoadedData = async function applyLoadedDataWithTroopSkills(data) {
      state.troopSkills = normalize(data?.generals);
      return baseApplyLoadedData(data);
    };

    const baseUpdateCountStatus = updateCountStatus;
    updateCountStatus = function updateCountStatusWithTroopSkills() {
      baseUpdateCountStatus();
      if (els?.countStatus && !/兵科技能\d+/.test(els.countStatus.textContent || '')) {
        els.countStatus.innerHTML = String(els.countStatus.innerHTML || '').replace(' / 装備', ` / 兵科技能${state.troopSkills.length} / 装備`);
      }
    };

    const baseItemMatchesSavedMode = itemMatchesSavedMode;
    itemMatchesSavedMode = function itemMatchesSavedModeWithTroopSkills(item, categoryKey) {
      if (categoryKey === 'troopSkills') return true;
      return baseItemMatchesSavedMode(item, categoryKey);
    };
    return true;
  }

  return Object.freeze({getContract, normalize, renderDetailHtml, buildCopyLines, install});
});
