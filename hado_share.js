'use strict';
/* HADO 3.1.1.0: search, detail, formation, and warhorse copy/share features. */
(() => {
  const SHARE_SCHEMA_VERSION = 1;
  const SHARE_PARAM = 'share';
  const MAX_SHARE_PARAM_LENGTH = 24000;
  const DEFAULT_PREVIEW_URL = 'https://mytemark2.github.io/hado_library-preview/';

  const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const clone = value => JSON.parse(JSON.stringify(value));
  const html = value => typeof esc === 'function' ? esc(value) : String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function currentVersion() {
    return window.HADO_VERSION?.releaseVersion || window.HADO_BUILD_INFO?.version || '3.1.1.0';
  }

  function bytesToBase64Url(bytes) {
    let binary = '';
    const size = 0x8000;
    for (let i = 0; i < bytes.length; i += size) binary += String.fromCharCode(...bytes.subarray(i, i + size));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function base64UrlToBytes(value) {
    const base64 = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, ch => ch.charCodeAt(0));
  }

  async function streamTransform(bytes, mode) {
    const Constructor = mode === 'compress' ? window.CompressionStream : window.DecompressionStream;
    if (typeof Constructor !== 'function') return null;
    const format = 'deflate-raw';
    const stream = new Blob([bytes]).stream().pipeThrough(new Constructor(format));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function encodePayload(payload) {
    const source = new TextEncoder().encode(JSON.stringify(payload));
    try {
      const compressed = await streamTransform(source, 'compress');
      if (compressed && compressed.length < source.length) return `d.${bytesToBase64Url(compressed)}`;
    } catch (error) {
      try { debugLog('share:compress-fallback', {message: error?.message || String(error)}); } catch {}
    }
    return `b.${bytesToBase64Url(source)}`;
  }

  async function decodePayload(encoded) {
    const raw = String(encoded || '');
    if (!raw || raw.length > MAX_SHARE_PARAM_LENGTH) throw new Error('共有データの長さが不正です。');
    const dot = raw.indexOf('.');
    const mode = dot > 0 ? raw.slice(0, dot) : 'b';
    const body = dot > 0 ? raw.slice(dot + 1) : raw;
    let bytes = base64UrlToBytes(body);
    if (mode === 'd') {
      const expanded = await streamTransform(bytes, 'decompress');
      if (!expanded) throw new Error('このブラウザでは圧縮共有リンクを読み込めません。');
      bytes = expanded;
    } else if (mode !== 'b') {
      throw new Error('未対応の共有形式です。');
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload || payload.v !== SHARE_SCHEMA_VERSION || !['search','item','formation','warhorse'].includes(payload.kind)) throw new Error('共有データの形式が一致しません。');
    return payload;
  }

  function baseShareUrl() {
    if (/^https?:$/.test(location.protocol)) return `${location.origin}${location.pathname}`;
    return DEFAULT_PREVIEW_URL;
  }

  async function buildShareUrl(kind, data) {
    const payload = {v: SHARE_SCHEMA_VERSION, kind, app: currentVersion(), data};
    const encoded = await encodePayload(payload);
    const url = new URL(baseShareUrl());
    url.searchParams.set(SHARE_PARAM, encoded);
    return url.toString();
  }

  function activeCategoryKeys() {
    return Object.entries(state.activeCategories || {}).filter(([, enabled]) => !!enabled).map(([key]) => key);
  }

  function captureSearchState() {
    return {
      mode: ['normal','status','type'].includes(clean(state.searchMode)) ? clean(state.searchMode) : 'normal',
      keyword: clean(els.searchInput?.value || ''),
      nameOnly: !!state.nameOnlySearch,
      tags: Array.isArray(state.selectedTags) ? state.selectedTags.map(clean).filter(Boolean) : [],
      categories: activeCategoryKeys(),
      viewMode: state.viewMode === 'saved' ? 'saved' : 'all',
      generalStage: state.generalStage === 'initial' ? 'initial' : 'max',
      equipmentStage: ['initial','ssrMax','urMax'].includes(state.equipmentStage) ? state.equipmentStage : 'urMax',
      statusFilter: state.quickStatusEffectOwnerFilter ? clone(state.quickStatusEffectOwnerFilter) : null,
      typePresetId: clean(state.typeSearchSelectedPresetId || ''),
      typePresetDirty: !!state.typeSearchPresetDirty,
      typeStatusIds: Array.isArray(state.typeSearchSelectedStatusEffectIds) ? state.typeSearchSelectedStatusEffectIds.map(clean).filter(Boolean) : [],
      typeFeatureIds: Array.isArray(state.typeSearchSelectedFeatureIds) ? state.typeSearchSelectedFeatureIds.map(clean).filter(Boolean) : []
    };
  }

  function searchModeLabel(mode) {
    return {normal:'通常検索', status:'状態変化検索', type:'型検索'}[mode] || '通常検索';
  }

  function searchConditionLines() {
    const snap = captureSearchState();
    const lines = [
      '検索条件',
      `検索方法：${searchModeLabel(snap.mode)}`,
      `検索語：${snap.keyword || '未指定'}`,
      `タグ：${snap.tags.length ? snap.tags.join(' / ') : '未指定'}`,
      `カテゴリ：${snap.categories.length ? snap.categories.map(key => DATASET_LABELS[key] || key).join(' / ') : '未指定'}`,
      `対象データ：${snap.viewMode === 'saved' ? '保存データ' : '全データ'}`
    ];
    if (snap.viewMode === 'all') {
      lines.push(`武将：${typeof generalStageLabel === 'function' ? generalStageLabel(snap.generalStage) : snap.generalStage}`);
      lines.push(`装備：${typeof equipmentStageLabel === 'function' ? equipmentStageLabel(snap.equipmentStage) : snap.equipmentStage}`);
    }
    if (snap.mode === 'status' && snap.statusFilter) lines.push(`状態変化：${clean(snap.statusFilter.label || snap.statusFilter.name || snap.statusFilter.effectName || snap.keyword) || '指定済み'}`);
    if (snap.mode === 'type') {
      if (snap.typePresetId) lines.push(`型：${snap.typePresetId}`);
      if (snap.typeStatusIds.length) lines.push(`状態：${snap.typeStatusIds.join(' / ')}`);
      if (snap.typeFeatureIds.length) lines.push(`要素：${snap.typeFeatureIds.join(' / ')}`);
    }
    lines.push(`ヒット件数：${(state.lastResultRows || []).length}件`);
    return lines;
  }

  function buildResultsCopyText() {
    const rows = state.lastResultRows || [];
    const keyword = clean(els.searchInput?.value || '');
    const parameterKey = typeof resolveParameterCopyKeyFromKeyword === 'function' ? resolveParameterCopyKeyFromKeyword(keyword) : '';
    const lines = [...searchConditionLines(), '', '検索結果'];
    if (!rows.length) lines.push('該当なし');
    rows.forEach(row => {
      const category = clean(row.label || DATASET_LABELS[detailCategory(row.item)] || detailCategory(row.item) || '項目');
      const name = typeof stripReadingForCopy === 'function' ? stripReadingForCopy(getItemDisplayName(row.item) || '-') : clean(getItemDisplayName(row.item) || '-');
      const metric = parameterKey && row.metric?.display ? `｜${row.metric.display}` : '';
      lines.push(`【${category}】${name}${metric}`);
    });
    const text = lines.join('\n');
    try { debugLog('share:results-copy', {count: rows.length, parameterKey, conditionLines: searchConditionLines().length}); } catch {}
    return text;
  }

  function datasetForCategory(category) {
    const map = {
      generals: state.generals, tactics: state.tactics, skills: state.skills, equipments: state.equipments,
      statusEffects: state.statusEffects, siegeWeapons: state.siegeWeapons, ethnicArmaments: state.ethnicArmaments,
      formations: state.formationMasters, warhorses: state.warhorses, warhorseSkills: state.warhorseSkills
    };
    return Array.isArray(map[category]) ? map[category] : [];
  }

  function itemIdentity(item) {
    const category = detailCategory(item);
    const id = clean(item?.id || item?.entityId || item?.canonicalId || item?.articleId || item?.url || '');
    return {category, id, name: clean(getItemDisplayName(item) || item?.name || item?.title || '')};
  }

  function findSharedItem(identity) {
    const rows = datasetForCategory(identity?.category);
    const wantedId = clean(identity?.id || '');
    const wantedName = clean(identity?.name || '');
    if (wantedId) {
      const exact = rows.find(item => [item?.id,item?.entityId,item?.canonicalId,item?.articleId,item?.url].some(value => clean(value) === wantedId));
      if (exact) return exact;
    }
    return rows.find(item => clean(getItemDisplayName(item) || item?.name || item?.title || '') === wantedName) || null;
  }

  async function copyUrl(kind, data, button, successText) {
    const url = await buildShareUrl(kind, data);
    await copyTextToClipboardSafe(url);
    const previous = button?.textContent || '';
    if (button) {
      button.textContent = successText || 'コピー済み';
      setTimeout(() => { if (button.isConnected) button.textContent = previous; }, 1200);
    }
    return url;
  }

  function formationExtensionLine(label, value) {
    const name = clean(value?.name || '');
    if (!name) return `${label}：未設定`;
    const level = Number(value?.level);
    return `${label}：${name}${Number.isFinite(level) && level > 0 ? ` Lv${level}` : ''}`;
  }

  function warhorseTextLines(entry, heading = true) {
    if (!entry) return ['軍馬：未設定'];
    const master = getWarhorseMasterById(entry.horseMasterId);
    const isFamous = getWarhorseMasterKind(master) === 'famous';
    const lines = [];
    if (heading) lines.push(`【軍馬】${clean(entry.name || entry.customName || entry.id)}`);
    lines.push(`種類：${isFamous ? '名馬' : '通常馬'}${isFamous ? ` / 将星${normalizeWarhorseFamousStarValue(entry.star ?? 0)}` : ''}`);
    const statParts = warhorseBaseStatKeys().map(key => `${key}${Number(entry.baseStats?.[key]) || 0}`).filter(Boolean);
    lines.push(`基本能力：${statParts.join(' / ')}`);
    const skills = (Array.isArray(entry.skills) ? entry.skills : []).slice(0, 3).map(skill => `${getWarhorseSkillDisplayName(skill.skillId)} Lv${normalizeWarhorseSkillLevel(skill.level)}`);
    lines.push(`通常技能：${skills.length ? skills.join(' / ') : '未設定'}`);
    if (isFamous) lines.push(`固有技能：${getWarhorseFixedSkillName(master) || '未設定'} Lv${getFamousHorseFixedSkillLevel(master, entry.star ?? 0)}`);
    return lines;
  }

  function buildFormationCopyText() {
    const formation = getCurrentFormation();
    if (!formation) return '部隊が選択されていません。';
    const lines = [
      `【部隊編成】${formation.name || '名称未設定'}`,
      `陣形：${formation.formationName || '基本'} / ${typeof formationDeploymentTypeLabel === 'function' ? formationDeploymentTypeLabel(formation.deploymentType) : (formation.deploymentType || '通常')}`,
      `用途：${formation.evaluationTypeName || '未指定'}`
    ];
    FORMATION_SLOT_SPECS.forEach(spec => {
      const slot = formation.slots?.[spec.key] || {};
      const equipment = slot.equipments || {};
      const attendant = slot.attendant ? `${slot.attendant}${slot.attendantPosition ? `（${slot.attendantPosition}）` : '（位置未設定）'}` : '未設定';
      lines.push(`${spec.label}：${slot.general || '未設定'}｜侍従：${attendant}｜武器：${equipment.weapon || '未設定'}｜防具：${equipment.armor || '未設定'}｜文物：${equipment.treasure || '未設定'}`);
    });
    lines.push(formationExtensionLine('兵器', formation.siegeWeapon));
    lines.push(formationExtensionLine('武装', formation.ethnicArmament));
    const horseData = getCurrentWarhorseData();
    const active = Array.isArray(horseData.activeSlots) ? horseData.activeSlots.slice(0, 3) : [];
    active.forEach((id, index) => {
      const horse = horseData.owned?.[clean(id || '')];
      if (!horse) lines.push(`軍馬${index + 1}：未設定`);
      else {
        const skills = (horse.skills || []).slice(0, 3).map(skill => `${getWarhorseSkillDisplayName(skill.skillId)} Lv${normalizeWarhorseSkillLevel(skill.level)}`).join(' / ') || '通常技能なし';
        lines.push(`軍馬${index + 1}：${horse.name || horse.id}｜${skills}`);
      }
    });
    if (formation.memo) lines.push(`メモ：${formation.memo}`);
    return lines.join('\n');
  }

  function selectedWarhorse() {
    const data = getCurrentWarhorseData();
    const id = clean(state._warhorseEditDialogId || state.warhorseSelectedId || '');
    return data.owned?.[id] || Object.values(data.owned || {})[0] || null;
  }

  function buildWarhorseCopyText() {
    const horse = selectedWarhorse();
    return horse ? warhorseTextLines(horse).join('\n') : '軍馬が選択されていません。';
  }

  function compactFormationForShare(formation) {
    return {
      name: clean(formation.name || '共有部隊'), formationName: clean(formation.formationName || '基本'), deploymentType: clean(formation.deploymentType || 'normal'),
      slots: clone(formation.slots || {}), advisorSlots: clone(formation.advisorSlots || {}), siegeWeapon: clone(formation.siegeWeapon || {}),
      ethnicArmament: clone(formation.ethnicArmament || {}), evaluationTypeId: clean(formation.evaluationTypeId || ''), evaluationTypeName: clean(formation.evaluationTypeName || ''), memo: clean(formation.memo || '')
    };
  }

  function compactWarhorseForShare(entry) {
    return {name: clean(entry.name || entry.customName || '共有軍馬'), horseMasterId: clean(entry.horseMasterId || ''), star: entry.star, skills: clone((entry.skills || []).slice(0, 3)), baseStats: clone(entry.baseStats || {})};
  }

  function renderFormationActionsHtml() {
    return '<div class="hado-share-actions" aria-label="部隊編成のコピー"><button type="button" class="copy-btn" data-hado-share-action="formation-copy">編成共有コピー</button><button type="button" class="copy-btn" data-hado-share-action="formation-link">新規部隊作成リンクコピー</button></div>';
  }

  function renderWarhorseActionsHtml(hasSave, hasHorse) {
    const disabled = !hasSave || !hasHorse ? ' disabled' : '';
    return `<div class="hado-share-actions" aria-label="軍馬のコピー"><button type="button" class="copy-btn" data-hado-share-action="warhorse-copy"${disabled}>軍馬共有コピー</button><button type="button" class="copy-btn" data-hado-share-action="warhorse-link"${disabled}>新規軍馬作成リンクコピー</button></div>`;
  }

  function missingFormationItems(data) {
    const missing = [];
    FORMATION_SLOT_SPECS.forEach(spec => {
      const slot = data?.slots?.[spec.key] || {};
      if (slot.general && !findItemByDisplayName('generals', slot.general)) missing.push(`${spec.label} 武将：${slot.general}`);
      if (slot.attendant && !findItemByDisplayName('generals', slot.attendant)) missing.push(`${spec.label} 侍従：${slot.attendant}`);
      EQUIP_SLOT_SPECS.forEach(eq => { const name = slot.equipments?.[eq.key]; if (name && !findItemByDisplayName('equipments', name)) missing.push(`${spec.label} ${eq.label}：${name}`); });
    });
    if (data?.formationName && !(state.formationMasters || []).some(item => clean(getItemDisplayName(item)) === clean(data.formationName))) missing.push(`陣形：${data.formationName}`);
    if (data?.siegeWeapon?.name && !findItemByDisplayName('siegeWeapons', data.siegeWeapon.name)) missing.push(`兵器：${data.siegeWeapon.name}`);
    if (data?.ethnicArmament?.name && !findItemByDisplayName('ethnicArmaments', data.ethnicArmament.name)) missing.push(`武装：${data.ethnicArmament.name}`);
    return missing;
  }

  function missingWarhorseItems(data) {
    const missing = [];
    if (data?.horseMasterId && !getWarhorseMasterById(data.horseMasterId)) missing.push(`軍馬種類：${data.horseMasterId}`);
    (data?.skills || []).slice(0, 3).forEach(skill => { if (skill.skillId && !getWarhorseSkillById(skill.skillId)) missing.push(`軍馬技能：${skill.skillId}`); });
    return missing;
  }

  function ensureImportDialog() {
    let dialog = document.getElementById('hadoShareImportDialog');
    if (dialog) return dialog;
    dialog = document.createElement('div');
    dialog.id = 'hadoShareImportDialog';
    dialog.className = 'hado-share-dialog';
    dialog.hidden = true;
    document.body.appendChild(dialog);
    return dialog;
  }

  function showImportDialog(payload) {
    const dialog = ensureImportDialog();
    const isFormation = payload.kind === 'formation';
    const missing = isFormation ? missingFormationItems(payload.data) : missingWarhorseItems(payload.data);
    const title = isFormation ? '共有部隊を新規作成' : '共有軍馬を新規作成';
    const name = clean(payload.data?.name || (isFormation ? '共有部隊' : '共有軍馬'));
    const missingHtml = missing.length ? `<div class="hado-share-missing"><strong>現在のデータにない項目</strong><ul>${missing.map(value => `<li>${html(value)}</li>`).join('')}</ul><div>不足項目は未設定として作成します。</div></div>` : '<div class="hado-share-ready">必要なデータを確認できました。</div>';
    dialog.innerHTML = `<div class="hado-share-dialog-backdrop" data-hado-share-cancel="1"></div><section class="hado-share-dialog-card" role="dialog" aria-modal="true" aria-labelledby="hadoShareDialogTitle"><h2 id="hadoShareDialogTitle">${html(title)}</h2><p><strong>${html(name)}</strong></p><p>既存データは変更せず、新しいデータとして追加します。</p>${missingHtml}<div class="hado-share-dialog-actions"><button type="button" class="copy-btn" data-hado-share-cancel="1">キャンセル</button><button type="button" class="btn-select-all" data-hado-share-confirm="1">新規作成</button></div></section>`;
    dialog.hidden = false;
    state._pendingHadoShareImport = {payload, missing};
  }

  function closeImportDialog() {
    const dialog = document.getElementById('hadoShareImportDialog');
    if (dialog) dialog.hidden = true;
    state._pendingHadoShareImport = null;
  }

  function importFormation(payload, missing) {
    const group = getCurrentFormationGroup();
    const groupRows = (state.formations || []).filter(item => item.groupId === group.id);
    if (groupRows.length >= FORMATION_MAX_PER_GROUP) throw new Error(`現在のグループは${FORMATION_MAX_PER_GROUP}部隊までです。`);
    const source = clone(payload.data || {});
    if (missing.length) {
      if (source.formationName && !(state.formationMasters || []).some(item => clean(getItemDisplayName(item)) === clean(source.formationName))) source.formationName = '基本';
      FORMATION_SLOT_SPECS.forEach(spec => {
        const slot = source.slots?.[spec.key];
        if (!slot) return;
        if (slot.general && !findItemByDisplayName('generals', slot.general)) slot.general = '';
        if (slot.attendant && !findItemByDisplayName('generals', slot.attendant)) { slot.attendant = ''; slot.attendantPosition = ''; }
        EQUIP_SLOT_SPECS.forEach(eq => { if (slot.equipments?.[eq.key] && !findItemByDisplayName('equipments', slot.equipments[eq.key])) slot.equipments[eq.key] = ''; });
      });
      if (source.siegeWeapon?.name && !findItemByDisplayName('siegeWeapons', source.siegeWeapon.name)) source.siegeWeapon = {};
      if (source.ethnicArmament?.name && !findItemByDisplayName('ethnicArmaments', source.ethnicArmament.name)) source.ethnicArmament = {};
      source.memo = [source.memo, `共有リンクで未設定：${missing.join(' / ')}`].filter(Boolean).join('\n');
    }
    const record = sanitizeFormationRecord({...source, id:createFormationId(), groupId:group.id, name:`${clean(source.name || '共有部隊')}（共有）`, history:[], candidateTray:[], updatedAt:new Date().toISOString()});
    state.formations.push(record);
    state.currentFormationId = record.id;
    state.formationDirty = true;
    saveFormationDataToStorage('share-import-new-formation');
    setMainTab('formation');
    renderFormationScreen();
    if (typeof showFormationToast === 'function') showFormationToast('共有部隊を新規作成しました');
  }

  function importWarhorse(payload, missing) {
    const save = getCurrentSave();
    if (!save) throw new Error('軍馬を追加する保存データを先に作成してください。');
    const data = getCurrentWarhorseData();
    const source = clone(payload.data || {});
    if (source.horseMasterId && !getWarhorseMasterById(source.horseMasterId)) source.horseMasterId = '';
    source.skills = (source.skills || []).filter(skill => getWarhorseSkillById(skill.skillId)).slice(0, 3);
    const id = createWarhorseSaveId();
    const record = sanitizeWarhorseEntry({...source, id, name:`${clean(source.name || '共有軍馬')}（共有）`, customName:`${clean(source.name || '共有軍馬')}（共有）`, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()});
    data.owned[id] = record;
    state.warhorseSelectedId = id;
    state._warhorseEditDialogId = id;
    persistSaveData();
    setMainTab('warhorse');
    renderWarhorseFormationScreen();
    try { debugLog('share:warhorse-import', {id, missing, activeSlotsUnchanged:true}); } catch {}
  }

  function applySearchState(data) {
    const categories = new Set(Array.isArray(data.categories) ? data.categories : []);
    Object.keys(state.activeCategories || {}).forEach(key => { state.activeCategories[key] = categories.has(key); });
    if (!Object.values(state.activeCategories || {}).some(Boolean)) state.activeCategories.generals = true;
    state.searchMode = ['normal','status','type'].includes(clean(data.mode)) ? clean(data.mode) : 'normal';
    state.nameOnlySearch = !!data.nameOnly;
    state.selectedTags = (Array.isArray(data.tags) ? data.tags : []).map(clean).filter(tag => !state.availableTags?.length || state.availableTags.includes(tag));
    state.generalStage = data.generalStage === 'initial' ? 'initial' : 'max';
    state.equipmentStage = ['initial','ssrMax','urMax'].includes(data.equipmentStage) ? data.equipmentStage : 'urMax';
    state.quickStatusEffectOwnerFilter = data.statusFilter && typeof data.statusFilter === 'object' ? clone(data.statusFilter) : null;
    state.typeSearchSelectedPresetId = clean(data.typePresetId || '');
    state.typeSearchPresetDirty = !!data.typePresetDirty;
    state.typeSearchSelectedStatusEffectIds = Array.isArray(data.typeStatusIds) ? data.typeStatusIds.map(clean).filter(Boolean) : [];
    state.typeSearchSelectedFeatureIds = Array.isArray(data.typeFeatureIds) ? data.typeFeatureIds.map(clean).filter(Boolean) : [];
    state.viewMode = data.viewMode === 'saved' && getCurrentSave() ? 'saved' : 'all';
    if (els.searchInput) els.searchInput.value = clean(data.keyword || '');
    if (els.nameOnlySearchToggle) els.nameOnlySearchToggle.checked = state.nameOnlySearch;
    if (els.viewModeAll) els.viewModeAll.checked = state.viewMode === 'all';
    if (els.viewModeSaved) els.viewModeSaved.checked = state.viewMode === 'saved';
    if (typeof rebuildSavedModeIndex === 'function') rebuildSavedModeIndex();
    if (typeof renderSaveControls === 'function') renderSaveControls();
    if (typeof renderTagSearchControls === 'function') renderTagSearchControls();
    if (typeof renderTypeSearchSelectedConditions === 'function') renderTypeSearchSelectedConditions();
    if (typeof updateCategoryStyles === 'function') updateCategoryStyles();
    if (typeof updateSearchModeUi === 'function') updateSearchModeUi();
    setMainTab('search');
    renderSearchResults();
    renderDetail();
    if (state.searchMode === 'status' && state.quickStatusEffectOwnerFilter && typeof runQuickStatusEffectOwnerSearchAsync === 'function') runQuickStatusEffectOwnerSearchAsync(state.quickStatusEffectOwnerFilter, {reason:'shared-search-link'});
  }

  async function applyIncomingShareLink() {
    if (state._incomingHadoShareHandled) return;
    const value = new URL(location.href).searchParams.get(SHARE_PARAM);
    if (!value) return;
    state._incomingHadoShareHandled = true;
    try {
      const payload = await decodePayload(value);
      if (payload.kind === 'search') applySearchState(payload.data || {});
      else if (payload.kind === 'item') {
        const item = findSharedItem(payload.data || {});
        if (!item) throw new Error('共有された項目が現在のデータにありません。');
        const identity = itemIdentity(item);
        applySearchState({mode:'normal', keyword:identity.name, nameOnly:true, tags:[], categories:[identity.category], viewMode:'all', generalStage:'max', equipmentStage:'urMax'});
        selectItemAndRender(item, DATASET_LABELS[identity.category] || identity.category, {reason:'shared-item-link'});
      } else showImportDialog(payload);
      try { debugLog('share:link-applied', {kind:payload.kind, sourceApp:payload.app || ''}); } catch {}
    } catch (error) {
      window.alert(`共有リンクを読み込めませんでした：${error?.message || error}`);
      try { debugLog('share:link-error', {message:error?.message || String(error)}); } catch {}
    }
  }

  async function handleAction(button, action) {
    if (action === 'search-link') return copyUrl('search', captureSearchState(), button, 'リンクコピー済み');
    if (action === 'item-link') {
      if (!state.selectedItem) throw new Error('共有する項目を選択してください。');
      return copyUrl('item', itemIdentity(state.selectedItem), button, 'リンクコピー済み');
    }
    if (action === 'formation-copy') {
      await copyTextToClipboardSafe(buildFormationCopyText());
      return flash(button, 'コピー済み');
    }
    if (action === 'formation-link') {
      const formation = getCurrentFormation();
      if (!formation) throw new Error('共有する部隊を選択してください。');
      return copyUrl('formation', compactFormationForShare(formation), button, 'リンクコピー済み');
    }
    if (action === 'warhorse-copy') {
      const horse = selectedWarhorse();
      if (!horse) throw new Error('共有する軍馬を選択してください。');
      await copyTextToClipboardSafe(buildWarhorseCopyText());
      return flash(button, 'コピー済み');
    }
    if (action === 'warhorse-link') {
      const horse = selectedWarhorse();
      if (!horse) throw new Error('共有する軍馬を選択してください。');
      return copyUrl('warhorse', compactWarhorseForShare(horse), button, 'リンクコピー済み');
    }
  }

  function flash(button, label) {
    const previous = button?.textContent || '';
    if (!button) return;
    button.textContent = label;
    setTimeout(() => { if (button.isConnected) button.textContent = previous; }, 1200);
  }

  function installFormationShareActions() {
    const root = document.getElementById('formationRoot');
    const panel = root?.querySelector('.formation-detail-panel');
    if (!panel || panel.querySelector('[data-hado-formation-share-actions]')) return;
    const host = document.createElement('div');
    host.dataset.hadoFormationShareActions = '1';
    host.innerHTML = renderFormationActionsHtml();
    panel.prepend(host);
  }

  function observeDynamicScreens() {
    const install = () => installFormationShareActions();
    install();
    const root = document.getElementById('formationRoot');
    if (root) new MutationObserver(install).observe(root, {childList:true, subtree:true});
  }

  function setupStaticShareActions() {
    const resultActions = document.querySelector('.result-copy-actions');
    if (resultActions) {
      resultActions.querySelector('#copyParamResultsBtn')?.remove();
      resultActions.querySelector('#copyAllParamResultsBtn')?.remove();
      let button = document.getElementById('copySearchLinkBtn');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-btn';
        button.id = 'copySearchLinkBtn';
        button.dataset.hadoShareAction = 'search-link';
        button.textContent = '検索リンクコピー';
        resultActions.appendChild(button);
      }
      els.copySearchLinkBtn = button;
    }
    const detailButton = document.getElementById('copyDetailBtn');
    if (detailButton) {
      detailButton.textContent = '詳細データコピー';
      let itemLinkButton = document.getElementById('copyItemLinkBtn');
      if (!itemLinkButton) {
        itemLinkButton = document.createElement('button');
        itemLinkButton.type = 'button';
        itemLinkButton.className = 'copy-btn';
        itemLinkButton.id = 'copyItemLinkBtn';
        itemLinkButton.dataset.hadoShareAction = 'item-link';
        itemLinkButton.textContent = '項目リンクコピー';
        detailButton.before(itemLinkButton);
      }
      els.copyItemLinkBtn = itemLinkButton;
    }
  }

  function scheduleIncomingShareApplication() {
    if (!new URL(location.href).searchParams.has(SHARE_PARAM)) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const loadComplete = !document.getElementById('loadOverlay')?.classList.contains('is-visible');
      if (loadComplete && (state.generals || []).length && (state.skills || []).length && (state.detailLinkCandidates || []).length) {
        clearInterval(timer);
        applyIncomingShareLink();
      } else if (Date.now() - startedAt > 120000) {
        clearInterval(timer);
        window.alert('共有リンクの読込は、アプリのデータ読込完了後に再度お試しください。');
      }
    }, 250);
  }

  function initializeShareUi() { setupStaticShareActions(); observeDynamicScreens(); scheduleIncomingShareApplication(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeShareUi, {once:true});
  else initializeShareUi();

  document.addEventListener('click', async event => {
    const cancel = event.target?.closest?.('[data-hado-share-cancel]');
    if (cancel) { event.preventDefault(); closeImportDialog(); return; }
    const confirm = event.target?.closest?.('[data-hado-share-confirm]');
    if (confirm) {
      event.preventDefault();
      const pending = state._pendingHadoShareImport;
      if (!pending) return;
      try {
        if (pending.payload.kind === 'formation') importFormation(pending.payload, pending.missing || []);
        else importWarhorse(pending.payload, pending.missing || []);
        closeImportDialog();
      } catch (error) { window.alert(`新規作成できませんでした：${error?.message || error}`); }
      return;
    }
    const button = event.target?.closest?.('[data-hado-share-action]');
    if (!button || button.disabled) return;
    event.preventDefault();
    try { await handleAction(button, button.dataset.hadoShareAction || ''); }
    catch (error) { window.alert(`コピーに失敗しました：${error?.message || error}`); }
  });

  window.HadoShare = Object.freeze({
    buildResultsCopyText, buildFormationCopyText, buildWarhorseCopyText, buildShareUrl,
    encodePayload, decodePayload, captureSearchState, itemIdentity, findSharedItem,
    renderFormationActionsHtml, renderWarhorseActionsHtml, applyIncomingShareLink
  });
})();
