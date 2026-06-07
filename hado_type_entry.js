/* HADO app 3.0.0.0 Update07.1: seven-purpose wizard with rule-based 10-step suitability score */
(() => {
  'use strict';

  const STORAGE_KEY = 'hado.typeEntry.selection.v1';
  const EVENT_NAME = 'hado:type-search-entry-selected';
  const JSON_FILES = {
    roles: 'hadou_type_search_role_index.json',
    scoreRules: 'hadou_type_score_rules.json',
    purposeRules: 'hadou_type_purpose_rules.json'
  };
  const WIZARD_STEPS = {
    main: ['main', 'purpose', 'type', 'confirm'],
    purpose: ['purpose', 'type', 'confirm'],
    type: ['type', 'confirm']
  };
  const STEP_LABELS = { main: '主将', purpose: '目的', type: '型', confirm: '確認' };

  const state = {
    mode: 'main', stepIndex: 0, mainGeneral: null, purposeId: '', typeId: '',
    showAllPurposes: false, query: '', data: null
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
  const asItems = (v, keys) => { if (Array.isArray(v)) return v; for (const k of keys) if (Array.isArray(v?.[k])) return v[k]; return []; };
  const fetchJson = async (file) => { const r = await fetch(file, { cache: 'no-store' }); if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`); return r.json(); };

  const steps = () => WIZARD_STEPS[state.mode] || WIZARD_STEPS.main;
  const currentStep = () => steps()[Math.max(0, Math.min(state.stepIndex, steps().length - 1))];
  const purpose = () => state.data?.purposes.find((p) => p.purposeId === state.purposeId) || null;
  const typeRule = () => state.data?.scoreRules.find((t) => t.typeId === state.typeId) || null;

  function scoreType(general, rule) {
    if (!general) return { score: null, matched: [], total: 5, matchedCount: 0 };
    if (!window.HadoTypeScore) throw new Error('適合スコア共通処理が読み込まれていません。');
    return window.HadoTypeScore.score(general, rule);
  }
  function purposeRows(p) {
    const primary=(p?.primaryTypes||[]).map(v=>({...v,role:'primary',roleLabel:'主軸型'}));
    const secondary=(p?.secondaryTypes||[]).map(v=>({...v,role:'secondary',roleLabel:'補助型'}));
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
      .hte-head,.hte-tabs,.hte-progress,.hte-foot{padding:14px 18px}.hte-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:1px solid #d9e1ec}.hte-head h2{margin:0}.hte-sub{font-size:12px;color:#64748b;margin-top:4px}.hte-tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #d9e1ec}.hte-btn,.hte-tab{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:9px 12px;cursor:pointer}.hte-tab.active,.hte-btn.primary{border-color:#2563eb;background:#eff6ff;color:#1d4ed8;font-weight:700}.hte-btn:disabled{opacity:.45;cursor:not-allowed}.hte-progress{display:flex;gap:8px;flex-wrap:wrap;background:#f8fafc;border-bottom:1px solid #d9e1ec}.hte-step{font-size:12px;color:#64748b;border:1px solid #cbd5e1;border-radius:999px;padding:5px 9px;background:#fff}.hte-step.active{color:#1d4ed8;border-color:#93c5fd;background:#eff6ff;font-weight:700}.hte-step.done{color:#166534;border-color:#86efac;background:#f0fdf4}.hte-body{min-height:0;overflow:auto;padding:14px 18px}.hte-card{border:1px solid #d8e0eb;border-radius:14px;padding:12px;background:#fff}.hte-title{font-weight:700;margin-bottom:8px}.hte-list{display:grid;gap:8px;max-height:52dvh;overflow:auto}.hte-item{border:1px solid #d8e0eb;border-radius:12px;padding:10px;background:#fff;cursor:pointer;text-align:left}.hte-item.active{border-color:#2563eb;background:#eff6ff}.hte-score{font-weight:700}.hte-match,.hte-note,.hte-reason{font-size:12px;color:#475569;margin-top:4px}.hte-item-role{display:inline-block;font-size:11px;border-radius:999px;padding:2px 7px;margin-bottom:4px;background:#f1f5f9;color:#475569}.hte-item-role.primary{background:#dbeafe;color:#1d4ed8}.hte-group-title{font-weight:700;margin:10px 0 6px}.hte-foot{position:sticky;bottom:0;background:#fff;border-top:1px solid #d9e1ec;display:flex;justify-content:space-between;gap:12px;align-items:center}.hte-foot-actions{display:flex;gap:8px;flex-wrap:wrap}.hte-summary{font-size:13px}.hte-search{width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:8px}.hte-confirm{display:grid;gap:10px}.hte-confirm-row{display:grid;grid-template-columns:120px minmax(0,1fr);gap:8px;border-bottom:1px solid #e2e8f0;padding-bottom:8px}.hte-confirm-row:last-child{border-bottom:none}.hte-confirm-label{font-weight:700}
      @media(max-width:720px){#hadoTypeEntryOverlay{padding:0}#hadoTypeEntryModal{width:100%;height:100dvh;max-height:none;border-radius:0}.hte-head,.hte-tabs,.hte-progress,.hte-body,.hte-foot{padding:12px}.hte-list{max-height:46dvh}.hte-foot{align-items:flex-start;flex-direction:column}.hte-foot-actions{width:100%}.hte-foot-actions .hte-btn{flex:1}.hte-confirm-row{grid-template-columns:92px minmax(0,1fr)}}`;
    document.head.appendChild(el);
  }

  function typeRows(typeIds) { const ids = typeIds?.length ? typeIds : state.data.scoreRules.map((v) => v.typeId); return ids.map((id) => state.data.scoreRules.find((v) => v.typeId === id)).filter(Boolean); }
  function renderStepProgress() { return `<div class="hte-progress">${steps().map((step, i) => `<span class="hte-step ${i < state.stepIndex ? 'done' : i === state.stepIndex ? 'active' : ''}">${i + 1}. ${esc(STEP_LABELS[step])}</span>`).join('')}</div>`; }
  function renderMainStep() {
    const q = norm(state.query); const generals = state.data.generals;
    return `<div class="hte-card"><div class="hte-title">主将を選択</div><input class="hte-search" id="hadoTypeEntryQuery" placeholder="主将名で絞り込み" value="${esc(state.query)}"><div class="hte-list">${generals.map((g) => `<button class="hte-item ${state.mainGeneral?.id === g.id ? 'active' : ''}" data-main-id="${esc(g.id)}" ${q && !norm(g.displayName || g.name).includes(q) ? 'hidden' : ''}>${esc(g.displayName || g.name)}</button>`).join('')}</div><div class="hte-note">上ほど新しい武将です。IME変換中は候補DOMを作り直さず、変換確定後に表示・非表示だけを切り替えます。</div></div>`;
  }
  function renderPurposeStep() { return `<div class="hte-card"><div class="hte-title">${state.mainGeneral ? '主将を使う目的を選択' : '目的を選択'}</div><div class="hte-note" style="margin-bottom:8px">目的は実戦用途で分離しています。型の順位ではなく、用途に必要な役割から選択してください。</div><div class="hte-list">${state.data.purposes.map((p) => `<button class="hte-item ${state.purposeId === p.purposeId ? 'active' : ''}" data-purpose-id="${esc(p.purposeId)}"><div class="hte-title">${esc(p.purposeName)}</div><div class="hte-reason">${esc(p.summary || '')}</div></button>`).join('')}</div></div>`; }
  function typeCard(row) { const rule=state.data.scoreRules.find((t)=>t.typeId===row.typeId); if(!rule)return ''; const r=scoreType(state.mainGeneral,rule); return `<button class="hte-item ${state.typeId===rule.typeId?'active':''}" data-type-id="${esc(rule.typeId)}"><span class="hte-item-role ${row.role==='primary'?'primary':''}">${esc(row.roleLabel||'型')}</span><div class="hte-title">${esc(rule.typeName)}</div>${rule.description?`<div class="hte-reason">${esc(rule.description)}</div>`:''}${row.reason?`<div class="hte-reason"><strong>${esc(row.roleLabel==='主軸型'?'主軸理由':row.roleLabel==='補助型'?'補助理由':'推奨理由')}:</strong> ${esc(row.reason)}</div>`:''}<div class="hte-score">主将適合スコア: ${r.score==null?'未採点':esc(window.HadoTypeScore.label(r))}</div>${r.score==null?'':`<div class="hte-match">${esc(window.HadoTypeScore.summary(r))}</div>`}</button>`; }
  function renderTypeStep() { if(state.mode==='type'){ const rows=state.data.scoreRules.map((v)=>({typeId:v.typeId,role:'direct',roleLabel:'型を直接選択',reason:v.description||''})); return `<div class="hte-card"><div class="hte-title">型を直接選択</div><div class="hte-list">${rows.map(typeCard).join('')}</div><div class="hte-note">適合スコアは型の5項目をルールJSONの計算方式で評価した10段階表示です。確定値と条件込最大を分け、項目別寄与点も表示します。技能Lvは採点しません。異なる型同士の順位付けには使いません。</div></div>`; } const rows=purposeRows(purpose()),primary=rows.filter((v)=>v.role==='primary'),secondary=rows.filter((v)=>v.role!=='primary'); return `<div class="hte-card"><div class="hte-title">${esc(purpose()?.purposeName||'目的')}に使う型を選択</div><div class="hte-reason">${esc(purpose()?.summary||'')}</div><div class="hte-group-title">主軸型</div><div class="hte-list">${primary.map(typeCard).join('')}</div><div class="hte-group-title">補助型</div><div class="hte-list">${secondary.map(typeCard).join('')}</div><div class="hte-note">適合スコアは型の5項目をルールJSONの計算方式で評価した10段階表示です。確定値と条件込最大を分け、項目別寄与点も表示します。技能Lvは採点しません。異なる型同士の順位付けには使いません。</div></div>`; }
  function renderConfirmStep() { const row=purposeRows(purpose()).find((v)=>v.typeId===state.typeId)||null; return `<div class="hte-card"><div class="hte-title">選択内容を確認</div><div class="hte-confirm"><div class="hte-confirm-row"><div class="hte-confirm-label">選び方</div><div>${esc(state.mode === 'main' ? '主将から考える' : state.mode === 'purpose' ? '目的から考える' : '型を直接選ぶ')}</div></div><div class="hte-confirm-row"><div class="hte-confirm-label">主将</div><div>${esc(state.mainGeneral?.displayName || state.mainGeneral?.name || '指定なし')}</div></div><div class="hte-confirm-row"><div class="hte-confirm-label">目的</div><div>${esc(purpose()?.purposeName || '指定なし')}</div></div><div class="hte-confirm-row"><div class="hte-confirm-label">型</div><div>${esc(typeRule()?.typeName || '未選択')}</div></div>${row?.reason?`<div class="hte-confirm-row"><div class="hte-confirm-label">選定理由</div><div>${esc(row.reason)}</div></div>`:''}</div><div class="hte-note" style="margin-top:10px">内容を確認し、「選択を保存」を押してください。</div></div>`; }
  function renderStepBody() { return currentStep() === 'main' ? renderMainStep() : currentStep() === 'purpose' ? renderPurposeStep() : currentStep() === 'type' ? renderTypeStep() : renderConfirmStep(); }

  function render() {
    const modal = document.getElementById('hadoTypeEntryModal'); if (!modal || !state.data) return; clampStep();
    const step = currentStep();
    modal.innerHTML = `<div class="hte-head"><div><h2>型編成ナビ</h2><div class="hte-sub">3.0.0.0 Update07.1 / 数値計算対応10段階適合スコア・主軸型・補助型・理由表示</div></div><button class="hte-btn" data-action="close">閉じる</button></div><div class="hte-tabs"><button class="hte-tab ${state.mode === 'main' ? 'active' : ''}" data-mode="main">主将から考える</button><button class="hte-tab ${state.mode === 'purpose' ? 'active' : ''}" data-mode="purpose">目的から考える</button><button class="hte-tab ${state.mode === 'type' ? 'active' : ''}" data-mode="type">型を直接選ぶ</button></div>${renderStepProgress()}<div class="hte-body">${renderStepBody()}</div><div class="hte-foot"><div><div class="hte-summary">主将: ${esc(state.mainGeneral?.displayName || state.mainGeneral?.name || '未選択')} / 目的: ${esc(purpose()?.purposeName || '未選択')} / 型: ${esc(typeRule()?.typeName || '未選択')}</div><div id="hadoTypeEntryMessage" class="hte-note"></div></div><div class="hte-foot-actions"><button class="hte-btn" data-action="clear">リセット</button>${state.stepIndex > 0 ? '<button class="hte-btn" data-action="back">戻る</button>' : ''}${step === 'confirm' ? '<button class="hte-btn primary" data-action="save">選択を保存</button>' : `<button class="hte-btn primary" data-action="next" ${canAdvance() ? '' : 'disabled'}>次へ</button>`}</div></div>`;
    modal.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => switchMode(b.dataset.mode)));
    modal.querySelectorAll('[data-action="close"]').forEach((b) => b.addEventListener('click', close));
    modal.querySelectorAll('[data-action="clear"]').forEach((b) => b.addEventListener('click', clearSelection));
    modal.querySelectorAll('[data-action="back"]').forEach((b) => b.addEventListener('click', goBack));
    modal.querySelectorAll('[data-action="next"]').forEach((b) => b.addEventListener('click', goNext));
    modal.querySelectorAll('[data-action="save"]').forEach((b) => b.addEventListener('click', saveSelection));
    modal.querySelectorAll('[data-main-id]').forEach((b) => b.addEventListener('click', () => { state.mainGeneral = state.data.generals.find((g) => g.id === b.dataset.mainId) || null; state.purposeId = ''; state.typeId = ''; render(); }));
    modal.querySelectorAll('[data-purpose-id]').forEach((b) => b.addEventListener('click', () => { state.purposeId = b.dataset.purposeId; state.typeId = ''; render(); }));
    modal.querySelectorAll('[data-type-id]').forEach((b) => b.addEventListener('click', () => { state.typeId = b.dataset.typeId; render(); }));
    const queryInput = document.getElementById('hadoTypeEntryQuery');
    if (queryInput) { let composing = false; const applyMainFilter = () => { state.query = queryInput.value; const q = norm(state.query); modal.querySelectorAll('[data-main-id]').forEach((button) => { const general = state.data.generals.find((g) => g.id === button.dataset.mainId); button.hidden = Boolean(q) && !norm(general?.displayName || general?.name).includes(q); }); }; queryInput.addEventListener('compositionstart', () => { composing = true; }); queryInput.addEventListener('compositionend', () => { composing = false; applyMainFilter(); }); queryInput.addEventListener('input', (e) => { state.query = e.target.value; if (!composing && !e.isComposing) applyMainFilter(); }); }
  }

  function close() { document.getElementById('hadoTypeEntryOverlay')?.remove(); }
  async function open() {
    style();
    if (!state.data) { const [roleIndex, scoreRules, purposeRules] = await Promise.all([fetchJson(JSON_FILES.roles), fetchJson(JSON_FILES.scoreRules), fetchJson(JSON_FILES.purposeRules)]); state.data = { generals: asItems(roleIndex, ['items']).filter((v) => v.roleId === 'main_general').sort((a, b) => Number(a.sourceIndex || 0) - Number(b.sourceIndex || 0)), scoreRules: asItems(scoreRules, ['items', 'types']), purposes: asItems(purposeRules, ['items', 'purposes']) }; loadSaved(); }
    close(); const overlay = document.createElement('div'); overlay.id = 'hadoTypeEntryOverlay'; overlay.innerHTML = '<section id="hadoTypeEntryModal" role="dialog" aria-modal="true" aria-label="型編成ナビ"></section>'; overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); }); document.body.appendChild(overlay); render();
  }
  function syncVisibility(){const button=document.getElementById('hadoTypeEntryOpen');const visible=typeof window.state==='object'?window.state.mainTab==='formation':document.getElementById('formationScreen')&&!document.getElementById('formationScreen').classList.contains('tab-content-hidden');if(button)button.hidden=!visible;if(!visible)close();}
  function mount() { if (document.getElementById('hadoTypeEntryOpen')) return; style(); const button = document.createElement('button'); button.id = 'hadoTypeEntryOpen'; button.textContent = '型編成ナビ'; button.addEventListener('click', () => open().catch((e) => alert(`型編成ナビの読込に失敗しました。\n${e.message}`))); document.body.appendChild(button); syncVisibility(); new MutationObserver(syncVisibility).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['class']}); setInterval(syncVisibility,400); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
