/* HADO app 3.0.0.0 Update09.3.28: type tag wizard */
(() => {
  'use strict';

  const STORAGE_KEY = 'hado.typeEntry.selection.v1';
  const EVENT_NAME = 'hado:type-search-entry-selected';
  const WIZARD_STEPS = {
    main: ['main', 'purpose', 'type', 'confirm'],
    purpose: ['purpose', 'type', 'confirm'],
    type: ['type', 'confirm']
  };
  const STEP_LABELS = { main: '主将', purpose: '目的', type: '型', confirm: '確認' };

  const state = {
    mode: 'main', stepIndex: 0, mainGeneral: null, purposeId: '', typeId: '',
    showAllPurposes: false, query: '', data: null, mainRenderLimit: 80
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function displayVersion() { return window.HADO_APP_DISPLAY_VERSION || window.HADO_APP_VERSION_META?.displayVersion || '3.0.0.0'; }
  const norm = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
  const asItems = (v, keys) => { if (Array.isArray(v)) return v; for (const k of keys) if (Array.isArray(v?.[k])) return v[k]; return []; };
  const nextPaint = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
  async function loadSharedTypeData() {
    if (!window.HadoTypeDataStore?.load) throw new Error('型検索共通データストアが読み込まれていません。');
    return window.HadoTypeDataStore.load();
  }

  const steps = () => WIZARD_STEPS[state.mode] || WIZARD_STEPS.main;
  const currentStep = () => steps()[Math.max(0, Math.min(state.stepIndex, steps().length - 1))];
  const purpose = () => state.data?.purposes.find((p) => p.purposeId === state.purposeId) || null;
  const typeRule = () => state.data?.scoreRules.find((t) => t.typeId === state.typeId) || null;

  function scoreType(general, rule) {
    if (!general) return { score: null, matched: [], total: 5, matchedCount: 0 };
    if (!window.HadoTypeScore) throw new Error('型タグ共通処理が読み込まれていません。');
    return window.HadoTypeScore.score(general, rule);
  }
  function purposeRows(p) {
    const primary=(p?.primaryTypes||[]).map(v=>({...v,role:'primary',roleLabel:'中核'}));
    const secondary=(p?.secondaryTypes||[]).map(v=>({...v,role:'secondary',roleLabel:'推奨'}));
    if(primary.length||secondary.length)return [...primary,...secondary];
    return (p?.recommendedTypeIds||[]).map(typeId=>({typeId,role:'primary',roleLabel:'候補型',reason:'旧JSON互換候補'}));
  }

  function clampStep() { state.stepIndex = Math.max(0, Math.min(Number(state.stepIndex) || 0, steps().length - 1)); }
  function loadSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      state.mode = WIZARD_STEPS[saved.mode] ? saved.mode : 'main';
      state.mainGeneral = saved.mainGeneral || null;
      state.purposeId = saved.purposeId || '';
      state.typeId = saved.typeId || '';
      state.stepIndex = Number(saved.stepIndex) || 0;
      clampStep();
    } catch (_) {}
  }
  function saveSelection() {
    if (!typeRule()) return;
    const selected = { mode: state.mode, stepIndex: state.stepIndex, mainGeneral: state.mainGeneral, purposeId: state.purposeId, typeId: state.typeId, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: selected }));
    const msg = document.getElementById('hadoTypeEntryMessage');
    if (msg) msg.textContent = '選択内容を保存しました。';
    close();
    const openCandidates = () => {
      if (window.HadoTypeCandidates && typeof window.HadoTypeCandidates.open === 'function') {
        window.HadoTypeCandidates.open({ source: 'type-entry-save', mode: 'edit' });
      } else {
        window.dispatchEvent(new CustomEvent('hado:type-candidates-open-request', { detail: { source: 'type-entry-save' } }));
      }
    };
    setTimeout(openCandidates, 0);
  }
  function clearSelection() { state.mainGeneral = null; state.purposeId = ''; state.typeId = ''; state.query = ''; state.stepIndex = 0; render(); }
  function switchMode(mode) { if (!WIZARD_STEPS[mode]) return; state.mode = mode; state.stepIndex = 0; state.mainGeneral = null; state.purposeId = ''; state.typeId = ''; state.query = ''; render(); }
  function canAdvance() { const step = currentStep(); return step === 'main' ? Boolean(state.mainGeneral) : step === 'purpose' ? Boolean(purpose()) : step === 'type' ? Boolean(typeRule()) : false; }
  function goNext() { if (!canAdvance()) return; state.stepIndex = Math.min(state.stepIndex + 1, steps().length - 1); render(); }
  function goBack() { state.stepIndex = Math.max(0, state.stepIndex - 1); render(); }

  function style() {
    if (document.getElementById('hadoTypeEntryStyle')) return;
    const el = document.createElement('style'); el.id = 'hadoTypeEntryStyle';
    el.textContent = `
      #hadoTypeEntryOpen{position:fixed;right:18px;bottom:18px;z-index:99990;border:0;border-radius:999px;padding:12px 18px;background:#1d4ed8;color:#fff;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer}
      #hadoTypeEntryOverlay{position:fixed;inset:0;z-index:99991;background:rgba(15,23,42,.56);display:flex;align-items:center;justify-content:center;padding:16px}
      #hadoTypeEntryModal{width:min(880px,100%);max-height:92dvh;background:#fff;border-radius:18px;display:grid;grid-template-rows:auto auto auto minmax(0,1fr) auto;overflow:hidden;color:#172033;box-shadow:0 20px 60px rgba(0,0,0,.35)}
      .hte-head,.hte-tabs,.hte-progress,.hte-foot{padding:14px 18px}.hte-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:1px solid #d9e1ec}.hte-head h2{margin:0}.hte-sub{font-size:12px;color:#64748b;margin-top:4px}.hte-tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #d9e1ec}.hte-btn,.hte-tab{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:9px 12px;cursor:pointer}.hte-tab.active,.hte-btn.primary{border-color:#2563eb;background:#eff6ff;color:#1d4ed8;font-weight:700}.hte-btn:disabled{opacity:.45;cursor:not-allowed}.hte-progress{display:flex;gap:8px;flex-wrap:wrap;background:#f8fafc;border-bottom:1px solid #d9e1ec}.hte-step{font-size:12px;color:#64748b;border:1px solid #cbd5e1;border-radius:999px;padding:5px 9px;background:#fff}.hte-step.active{color:#1d4ed8;border-color:#93c5fd;background:#eff6ff;font-weight:700}.hte-step.done{color:#166534;border-color:#86efac;background:#f0fdf4}.hte-body{min-height:0;overflow:auto;padding:14px 18px}.hte-card{border:1px solid #d8e0eb;border-radius:14px;padding:12px;background:#fff}.hte-title{font-weight:700;margin-bottom:8px}.hte-list{display:grid;gap:8px;max-height:52dvh;overflow:auto}.hte-item{border:1px solid #d8e0eb;border-radius:12px;padding:10px;background:#fff;cursor:pointer;text-align:left}.hte-item.active{border-color:#2563eb;background:#eff6ff}.hte-note,.hte-reason{font-size:12px;color:#475569;margin-top:4px}.hte-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.hte-chip{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:2px 7px;background:#eef2ff;color:#3730a3;font-size:11px}.hte-chip b{font-size:10px;color:#475569}.hte-chip.is-core{background:#dcfce7;color:#166534}.hte-chip.is-recommended{background:#dbeafe;color:#1d4ed8}.hte-chip.is-support{background:#fef3c7;color:#92400e}.hte-chip.is-status{background:#fce7f3;color:#be185d}.hte-item-role{display:inline-block;font-size:11px;border-radius:999px;padding:2px 7px;margin-bottom:4px;background:#f1f5f9;color:#475569}.hte-item-role.primary{background:#dbeafe;color:#1d4ed8}.hte-group-title{font-weight:700;margin:10px 0 6px}.hte-foot{position:sticky;bottom:0;background:#fff;border-top:1px solid #d9e1ec;display:flex;justify-content:space-between;gap:12px;align-items:center}.hte-foot-actions{display:flex;gap:8px;flex-wrap:wrap}.hte-summary{font-size:13px}.hte-search{width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:8px}.hte-confirm{display:grid;gap:10px}.hte-confirm-row{display:grid;grid-template-columns:120px minmax(0,1fr);gap:8px;border-bottom:1px solid #e2e8f0;padding-bottom:8px}.hte-confirm-row:last-child{border-bottom:none}.hte-confirm-label{font-weight:700}
      @media(max-width:720px){#hadoTypeEntryOverlay{padding:0}#hadoTypeEntryModal{width:100%;height:100dvh;max-height:none;border-radius:0}.hte-head,.hte-tabs,.hte-progress,.hte-body,.hte-foot{padding:12px}.hte-list{max-height:46dvh}.hte-foot{align-items:flex-start;flex-direction:column}.hte-foot-actions{width:100%}.hte-foot-actions .hte-btn{flex:1}.hte-confirm-row{grid-template-columns:92px minmax(0,1fr)}}`;
    document.head.appendChild(el);
  }

  function typeRows(typeIds) { const ids = typeIds?.length ? typeIds : state.data.scoreRules.map((v) => v.typeId); return ids.map((id) => state.data.scoreRules.find((v) => v.typeId === id)).filter(Boolean); }
  function tagRowsFor(general, rule) { const result = general ? scoreType(general, rule) : null; if (window.HadoTypeTags && general) return window.HadoTypeTags.tagList(general, rule, result); return (rule?.metrics || []).slice(0, 5).map((m, i) => ({ kind: i < 2 ? 'core' : i < 4 ? 'recommended' : 'support', kindLabel: i < 2 ? '中核' : i < 4 ? '推奨' : '補助', label: m.label || m.metricKey || '型要素' })); }
  function renderTypeTags(general, rule) { return tagRowsFor(general, rule).slice(0, 12).map((t) => `<span class="hte-chip is-${esc(t.kind || 'type')}"><b>${esc(t.kindLabel || '型要素')}</b>${esc(t.label || '')}</span>`).join(''); }
  function renderStepProgress() { return `<div class="hte-progress">${steps().map((step, i) => `<span class="hte-step ${i < state.stepIndex ? 'done' : i === state.stepIndex ? 'active' : ''}">${i + 1}. ${esc(STEP_LABELS[step])}</span>`).join('')}</div>`; }
  function filteredMainGenerals() {
    const q = norm(state.query);
    return state.data.generals.filter(g => !q || norm(g.displayName || g.name).includes(q));
  }
  function renderMainCandidateItems() {
    const filtered = filteredMainGenerals();
    const limit = Math.max(40, Number(state.mainRenderLimit) || 80);
    const visible = filtered.slice(0, limit);
    const cards = visible.map(g => `<button class="hte-item ${state.mainGeneral?.id === g.id ? 'active' : ''}" data-main-id="${esc(g.id)}">${esc(g.displayName || g.name)}</button>`).join('');
    const more = visible.length < filtered.length ? `<button class="hte-btn" type="button" data-main-more>さらに表示（${visible.length}/${filtered.length}件）</button>` : '';
    return `${cards}${more}`;
  }
  function bindMainCandidateItems(modal) {
    modal.querySelectorAll('[data-main-id]').forEach(b => b.addEventListener('click', () => { state.mainGeneral = state.data.generals.find(g => g.id === b.dataset.mainId) || null; state.purposeId = ''; state.typeId = ''; render(); }));
    const more = modal.querySelector('[data-main-more]');
    if (more) more.addEventListener('click', () => { state.mainRenderLimit += 80; const list = modal.querySelector('#hadoTypeEntryMainList'); if (list) { list.innerHTML = renderMainCandidateItems(); bindMainCandidateItems(modal); } });
  }
  function renderMainStep() {
    return `<div class="hte-card"><div class="hte-title">主将を選択</div><input class="hte-search" id="hadoTypeEntryQuery" placeholder="主将名で絞り込み" value="${esc(state.query)}"><div class="hte-list" id="hadoTypeEntryMainList">${renderMainCandidateItems()}</div><div class="hte-note">候補は段階表示します。IME変換中は候補DOMを更新せず、変換確定後に絞り込みます。</div></div>`;
  }
  function renderPurposeStep() { return `<div class="hte-card"><div class="hte-title">${state.mainGeneral ? '主将を使う目的を選択' : '目的を選択'}</div><div class="hte-note" style="margin-bottom:8px">目的は実戦用途で分離しています。型の順位ではなく、用途に必要な役割から選択してください。</div><div class="hte-list">${state.data.purposes.map((p) => `<button class="hte-item ${state.purposeId === p.purposeId ? 'active' : ''}" data-purpose-id="${esc(p.purposeId)}"><div class="hte-title">${esc(p.purposeName)}</div><div class="hte-reason">${esc(p.summary || '')}</div></button>`).join('')}</div></div>`; }
  function typeCard(row) { const rule=state.data.scoreRules.find((t)=>t.typeId===row.typeId); if(!rule)return ''; return `<button class="hte-item ${state.typeId===rule.typeId?'active':''}" data-type-id="${esc(rule.typeId)}"><span class="hte-item-role ${row.role==='primary'?'primary':''}">${esc(row.roleLabel||'型')}</span><div class="hte-title">${esc(rule.typeName)}</div><div class="hte-tags">${renderTypeTags(state.mainGeneral,rule)}</div>${rule.description?`<div class="hte-reason">${esc(rule.description)}</div>`:''}${row.reason?`<div class="hte-reason"><strong>${esc(row.roleLabel||'目的')}:</strong> ${esc(row.reason)}</div>`:''}</button>`; }
  function renderTypeStep() { if(state.mode==='type'){ const rows=state.data.scoreRules.map((v)=>({typeId:v.typeId,role:'direct',roleLabel:'型を直接選択',reason:v.description||''})); return `<div class="hte-card"><div class="hte-title">型を直接選択</div><div class="hte-list">${rows.map(typeCard).join('')}</div></div>`; } const rows=purposeRows(purpose()),primary=rows.filter((v)=>v.role==='primary'),secondary=rows.filter((v)=>v.role!=='primary'); return `<div class="hte-card"><div class="hte-title">${esc(purpose()?.purposeName||'目的')}に使う型を選択</div><div class="hte-reason">${esc(purpose()?.summary||'')}</div><div class="hte-group-title">中核候補</div><div class="hte-list">${primary.map(typeCard).join('')}</div><div class="hte-group-title">推奨候補</div><div class="hte-list">${secondary.map(typeCard).join('')}</div></div>`; }
  function renderConfirmStep() { const row=purposeRows(purpose()).find((v)=>v.typeId===state.typeId)||null; return `<div class="hte-card"><div class="hte-title">選択内容を確認</div><div class="hte-confirm"><div class="hte-confirm-row"><div class="hte-confirm-label">選び方</div><div>${esc(state.mode === 'main' ? '主将から考える' : state.mode === 'purpose' ? '目的から考える' : '型を直接選ぶ')}</div></div><div class="hte-confirm-row"><div class="hte-confirm-label">主将</div><div>${esc(state.mainGeneral?.displayName || state.mainGeneral?.name || '指定なし')}</div></div><div class="hte-confirm-row"><div class="hte-confirm-label">目的</div><div>${esc(purpose()?.purposeName || '指定なし')}</div></div><div class="hte-confirm-row"><div class="hte-confirm-label">型</div><div>${esc(typeRule()?.typeName || '未選択')}</div></div>${row?.reason?`<div class="hte-confirm-row"><div class="hte-confirm-label">選定理由</div><div>${esc(row.reason)}</div></div>`:''}</div><div class="hte-note" style="margin-top:10px">内容を確認し、「候補ワークスペースへ」を押してください。</div></div>`; }
  function renderStepBody() { return currentStep() === 'main' ? renderMainStep() : currentStep() === 'purpose' ? renderPurposeStep() : currentStep() === 'type' ? renderTypeStep() : renderConfirmStep(); }

  function render() {
    const modal = document.getElementById('hadoTypeEntryModal'); if (!modal || !state.data) return; clampStep();
    const step = currentStep();
    const modeLabel = state.mode === 'main' ? '主将から考える' : state.mode === 'purpose' ? '目的から考える' : '型を直接選ぶ';
    modal.innerHTML = `<div class="hte-head"><div><h2>型編成ナビ</h2><div class="hte-sub">${esc(displayVersion())} / 型タグ・目的・候補表示</div></div><button class="hte-btn" data-action="close">閉じる</button></div><div class="hte-tabs" role="tablist" aria-label="型の選び方" data-tab-activation="manual"><button type="button" id="hte-tab-main" class="hte-tab ${state.mode === 'main' ? 'active is-active' : ''}" data-mode="main" data-tab-key="main" role="tab" aria-controls="hte-mode-panel" aria-selected="${state.mode === 'main' ? 'true' : 'false'}" tabindex="${state.mode === 'main' ? '0' : '-1'}"><span class="hado-tab-label">主将から考える</span></button><button type="button" id="hte-tab-purpose" class="hte-tab ${state.mode === 'purpose' ? 'active is-active' : ''}" data-mode="purpose" data-tab-key="purpose" role="tab" aria-controls="hte-mode-panel" aria-selected="${state.mode === 'purpose' ? 'true' : 'false'}" tabindex="${state.mode === 'purpose' ? '0' : '-1'}"><span class="hado-tab-label">目的から考える</span></button><button type="button" id="hte-tab-type" class="hte-tab ${state.mode === 'type' ? 'active is-active' : ''}" data-mode="type" data-tab-key="type" role="tab" aria-controls="hte-mode-panel" aria-selected="${state.mode === 'type' ? 'true' : 'false'}" tabindex="${state.mode === 'type' ? '0' : '-1'}"><span class="hado-tab-label">型を直接選ぶ</span></button></div><div class="hado-tab-context hte-mode-current" aria-live="polite">${esc(modeLabel)}を表示中</div>${renderStepProgress()}<div id="hte-mode-panel" class="hte-body hado-tab-panel-enter" role="tabpanel" aria-labelledby="hte-tab-${esc(state.mode)}" tabindex="0">${renderStepBody()}</div><div class="hte-foot"><div><div class="hte-summary">主将: ${esc(state.mainGeneral?.displayName || state.mainGeneral?.name || '未選択')} / 目的: ${esc(purpose()?.purposeName || '未選択')} / 型: ${esc(typeRule()?.typeName || '未選択')}</div><div id="hadoTypeEntryMessage" class="hte-note"></div></div><div class="hte-foot-actions"><button class="hte-btn" data-action="clear">リセット</button>${state.stepIndex > 0 ? '<button class="hte-btn" data-action="back">戻る</button>' : ''}${step === 'confirm' ? '<button class="hte-btn primary" data-action="save">候補ワークスペースへ</button>' : `<button class="hte-btn primary" data-action="next" ${canAdvance() ? '' : 'disabled'}>次へ</button>`}</div></div>`;
    if (window.HADO_TABS?.sync) window.HADO_TABS.sync(modal.querySelector('.hte-tabs'), modal.querySelector(`#hte-tab-${state.mode}`));
    modal.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => switchMode(b.dataset.mode)));
    modal.querySelectorAll('[data-action="close"]').forEach((b) => b.addEventListener('click', close));
    modal.querySelectorAll('[data-action="clear"]').forEach((b) => b.addEventListener('click', clearSelection));
    modal.querySelectorAll('[data-action="back"]').forEach((b) => b.addEventListener('click', goBack));
    modal.querySelectorAll('[data-action="next"]').forEach((b) => b.addEventListener('click', goNext));
    modal.querySelectorAll('[data-action="save"]').forEach((b) => b.addEventListener('click', saveSelection));
    bindMainCandidateItems(modal);
    modal.querySelectorAll('[data-purpose-id]').forEach((b) => b.addEventListener('click', () => { state.purposeId = b.dataset.purposeId; state.typeId = ''; render(); }));
    modal.querySelectorAll('[data-type-id]').forEach((b) => b.addEventListener('click', () => { state.typeId = b.dataset.typeId; render(); }));
    const queryInput = document.getElementById('hadoTypeEntryQuery');
    if (queryInput) { let composing = false; const applyMainFilter = () => { state.query = queryInput.value; state.mainRenderLimit = 80; const list = modal.querySelector('#hadoTypeEntryMainList'); if (list) { list.innerHTML = renderMainCandidateItems(); bindMainCandidateItems(modal); } }; queryInput.addEventListener('compositionstart', () => { composing = true; }); queryInput.addEventListener('compositionend', () => { composing = false; applyMainFilter(); }); queryInput.addEventListener('input', (e) => { state.query = e.target.value; if (!composing && !e.isComposing) applyMainFilter(); }); }
  }

  function close() { document.getElementById('hadoTypeEntryOverlay')?.remove(); }
  async function open() {
    style();
    close(); const overlay = document.createElement('div'); overlay.id = 'hadoTypeEntryOverlay'; overlay.innerHTML = '<section id="hadoTypeEntryModal" role="dialog" aria-modal="true" aria-label="型編成ナビ"><div class="hte-body"><div class="hte-card"><div class="hte-title">型編成ナビを準備しています…</div><div class="hte-note">型検索データを読み込んでいます。</div></div></div></section>'; overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); }); document.body.appendChild(overlay); await nextPaint();
    if (!state.data) { const shared = await loadSharedTypeData(); state.data = { generals: asItems(shared.roleIndex, ['items']).filter((v) => v.roleId === 'main_general').sort((a, b) => Number(a.sourceIndex || 0) - Number(b.sourceIndex || 0)), scoreRules: asItems(shared.scoreRules, ['items', 'types']), purposes: asItems(shared.purposeRules, ['items', 'purposes']) }; window.HADO_TYPE_SCORE_RULES = state.data.scoreRules; loadSaved(); }
    if (!document.getElementById('hadoTypeEntryModal')) return;
    render();
  }
  function syncVisibility(){const button=document.getElementById('hadoTypeEntryOpen');const visible=typeof window.state==='object'?window.state.mainTab==='formation':document.getElementById('formationScreen')&&!document.getElementById('formationScreen').classList.contains('tab-content-hidden');if(button)button.hidden=!visible;if(!visible)close();}
  function mount() { if (document.getElementById('hadoTypeEntryOpen')) return; style(); const button = document.createElement('button'); button.id = 'hadoTypeEntryOpen'; button.textContent = '型編成ナビ'; button.addEventListener('click', () => open().catch((e) => alert(`型編成ナビの読込に失敗しました。\n${e.message}`))); document.body.appendChild(button); syncVisibility(); new MutationObserver(syncVisibility).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['class']}); setInterval(syncVisibility,400); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
