/* Hado Library 3.2.0.0 Update02: troop-type, troop-skill and commander cross-search. */
(function initHadoTroopSkills(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HADO_TROOP_SKILLS = api;
})(typeof window !== 'undefined' ? window : globalThis, function createHadoTroopSkills() {
  'use strict';

  const TROOP_TYPES = Object.freeze(['騎兵', '歩兵', '弓兵', '盾兵', '工兵']);
  const clean = value => String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  const generalName = value => clean(value).replace(/^【[^】]*】/, '').replace(/の(?:戦法と技能|おすすめ編制.*|性能|入手方法|能力.*|評価.*).*$/, '');
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function getContract(rawGenerals) {
    if (!rawGenerals || typeof rawGenerals !== 'object' || Array.isArray(rawGenerals)) return null;
    return rawGenerals.troop_effects || rawGenerals.troopEffects || null;
  }

  function getGeneralItems(rawGenerals) {
    if (Array.isArray(rawGenerals)) return rawGenerals;
    return Array.isArray(rawGenerals?.items) ? rawGenerals.items : [];
  }

  function getTableRows(item) {
    const rows = [];
    (Array.isArray(item?.tables) ? item.tables : []).forEach(table => {
      const tableRows = Array.isArray(table?.rows) ? table.rows : (Array.isArray(table) ? table : []);
      tableRows.forEach(row => { if (Array.isArray(row)) rows.push(row.map(clean)); });
    });
    return rows;
  }

  function extractTroopTypes(value) {
    const text = clean(value);
    return TROOP_TYPES.filter(type => text.includes(type));
  }

  function extractGeneralTroopType(item) {
    const rows = getTableRows(item);
    for (const companionLabel of ['相性', '輸送']) {
      for (const row of rows) {
        if (!row.includes('兵科') || !row.includes(companionLabel)) continue;
        const index = row.indexOf('兵科');
        const troopTypes = extractTroopTypes(row[index + 1]);
        if (troopTypes.length === 1) return { troopType: troopTypes[0], sourceCell: clean(row[index + 1]), sourceLabel: companionLabel };
      }
    }
    return { troopType: '', sourceCell: '', sourceLabel: '' };
  }

  function buildCommanderIndex(rawGenerals) {
    const byTroopType = Object.fromEntries(TROOP_TYPES.map(type => [type, []]));
    const unclassified = [];
    getGeneralItems(rawGenerals).forEach((general, sourceIndex) => {
      const relation = extractGeneralTroopType(general);
      const name = generalName(general?.displayName || general?.name || general?.title);
      if (!relation.troopType) {
        unclassified.push({ name, sourceIndex, url: clean(general?.url || general?.source_url) });
        return;
      }
      byTroopType[relation.troopType].push({
        name,
        url: clean(general?.url || general?.source_url),
        sourceCell: relation.sourceCell,
        sourceLabel: relation.sourceLabel,
        sourceIndex
      });
    });
    return {
      byTroopType,
      total: Object.values(byTroopType).reduce((sum, list) => sum + list.length, 0),
      counts: Object.fromEntries(TROOP_TYPES.map(type => [type, byTroopType[type].length])),
      unclassified
    };
  }

  function normalize(rawGenerals) {
    const contract = getContract(rawGenerals);
    const groups = Array.isArray(contract?.items) ? contract.items : [];
    const commanderIndex = buildCommanderIndex(rawGenerals);
    const rows = [];
    groups.forEach((group, groupIndex) => {
      const troopType = clean(group?.troop_type || group?.troopType);
      const grantText = clean(group?.grant_text || group?.grantText);
      const commanders = (commanderIndex.byTroopType[troopType] || []).map(owner => ({ ...owner }));
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
          eligibleCommanders: commanders,
          eligibleCommanderCount: commanders.length,
          relationKind: 'troop-skill-to-commanders',
          sources,
          sourceUrls,
          url: sources[0]?.url || sourceUrls[0] || '',
          category: 'troopSkills',
          sourceDataset: 'troopSkills',
          schemaVersion: Number(contract?.schema_version || contract?.schemaVersion || 0),
          scope: clean(contract?.scope),
          searchTokens: [name, troopType, grantText, description, '兵科', '兵科技能', '主将候補', ...commanders.map(owner => owner.name)].filter(Boolean),
          _resultCardIndex: {
            displayName: name,
            subtitle: [troopType, `主将候補${commanders.length}人`, grantText].filter(Boolean).join(' / '),
            badges: ['兵科技能', troopType].filter(Boolean)
          },
          sections: [
            {title: '基本情報', content: [`種別：兵科技能`, `兵科：${troopType || '-'}`, `付与：${grantText || '-'}`]},
            {title: '効果', content: [description || '-']},
            {title: `主将候補（${commanders.length}人）`, content: commanders.length ? commanders.map(owner => owner.name) : ['なし']}
          ],
          raw: {name, description, troopType, grantText, eligibleCommanders: commanders}
        });
      });
    });
    return rows;
  }

  function renderCommanderLinks(item) {
    const commanders = Array.isArray(item?.eligibleCommanders) ? item.eligibleCommanders : [];
    if (!commanders.length) return '<span class="meta">該当なし</span>';
    return commanders.map(owner => `<a href="#" class="detail-entity-link" data-category="generals" data-name="${escapeHtml(owner.name)}">${escapeHtml(owner.name)}</a>`).join(' / ');
  }

  function renderDetailHtml(item) {
    const troopType = clean(item?.troopType) || '-';
    const grantText = clean(item?.grantText) || '-';
    const description = clean(item?.description) || '-';
    const count = Array.isArray(item?.eligibleCommanders) ? item.eligibleCommanders.length : 0;
    return `<div class="general-detail-stack"><div class="general-card"><div class="general-card-header">兵科と兵科技能</div><div class="general-card-body"><div class="equipment-kv-list"><div class="equipment-kv-row"><span>種別</span><strong>兵科技能</strong></div><div class="equipment-kv-row"><span>兵科</span><strong>${escapeHtml(troopType)}</strong></div><div class="equipment-kv-row"><span>付与</span><strong>${escapeHtml(grantText)}</strong></div></div></div></div><div class="general-card"><div class="general-card-header">効果</div><div class="general-card-body"><p>${escapeHtml(description)}</p></div></div><div class="general-card"><div class="general-card-header">主将候補（${count}人）</div><div class="general-card-body"><div class="general-text">${renderCommanderLinks(item)}</div><p class="meta">一次JSONの「兵科・相性」セルで同じ兵科と確認できた武将です。通常技能の所有者とは区別しています。</p></div></div></div>`;
  }

  function buildCopyLines(item) {
    const commanders = Array.isArray(item?.eligibleCommanders) ? item.eligibleCommanders.map(owner => clean(owner?.name)).filter(Boolean) : [];
    return [
      '種別：兵科技能',
      `兵科：${clean(item?.troopType) || '-'}`,
      `付与：${clean(item?.grantText) || '-'}`,
      '',
      '■ 効果',
      clean(item?.description) || '-',
      '',
      `■ 主将候補（${commanders.length}人）`,
      commanders.length ? commanders.join(' / ') : '-'
    ];
  }

  function install() {
    if (typeof applyLoadedData !== 'function' || typeof updateCountStatus !== 'function' || typeof itemMatchesSavedMode !== 'function') return false;
    if (install.done) return true;
    install.done = true;

    const baseApplyLoadedData = applyLoadedData;
    applyLoadedData = async function applyLoadedDataWithTroopSkills(data) {
      const commanderIndex = buildCommanderIndex(data?.generals);
      state.troopSkills = normalize(data?.generals);
      state.diagnostics.troopSkills = {
        contractSkillCount: state.troopSkills.length,
        commanderCount: commanderIndex.total,
        counts: commanderIndex.counts,
        unclassifiedCount: commanderIndex.unclassified.length,
        unclassified: commanderIndex.unclassified,
        relationOwnerCount: state.troopSkills.reduce((sum, item) => sum + Number(item.eligibleCommanderCount || 0), 0),
        source: 'hadou_generals.json troop_effects + 兵科・相性セル'
      };
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

  return Object.freeze({TROOP_TYPES, getContract, getGeneralItems, extractGeneralTroopType, buildCommanderIndex, normalize, renderDetailHtml, buildCopyLines, install});
});
