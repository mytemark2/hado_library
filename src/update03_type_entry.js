/* HADO app 3.0.0.0 Update03.2: type formation entry navigator */
(() => {
  'use strict';

  const STORAGE_KEY = 'hado.typeEntry.selection.v1';
  const EVENT_NAME = 'hado:type-search-entry-selected';
  const JSON_FILES = {
    roles: 'hadou_type_search_role_index.json',
    scoreRules: 'hadou_type_score_rules.json',
    purposeRules: 'hadou_type_purpose_rules.json'
  };

  const METRIC_ALIASES = {
    troops: ['兵力'],
    tactic_power: ['戦法威力'],
    critical_tactic_power: ['撃心威力'],
    critical_power: ['会心威力'],
    attack_speed: ['攻撃速度'],
    critical_rate: ['会心発生', '会心発生率'],
    critical_tactic_rate: ['撃心発生', '撃心発生率'],
    normal_attack_power: ['通常攻撃威力'],
    normal_attack_target_count: ['通常攻撃対象数', '通常攻撃対象部隊数'],
    range: ['射程'],
    anti_object: ['対物特効'],
    tactic_speed: ['戦法速度'],
    weakening_nullify: ['弱化無効', '弱化効果無効'],
    weakening_remove: ['弱化解除', '弱化効果解除'],
    strengthening_remove_avoid: ['強化解除回避'],
    strengthening_seize_avoid: ['強化奪取回避'],
    annihilation_avoidance: ['壊滅回避'],
    remaining_troops: ['残存兵力'],
    wounded_recovery: ['負傷兵回復'],
    damage_reduction: ['被ダメージ軽減'],
    tactic_reduction: ['戦法短縮'],
    initial_tactic_gauge: ['出陣時戦法ゲージ'],
    chain_rate: ['連鎖率', '連鎖確率'],
    status_effect_rate: ['状態変化発生率'],
    tactic_delay: ['戦法遅延'],
    chain_nullify: ['連鎖無効'],
    enemy_attack_debuff: ['敵部隊攻撃低下'],
    enemy_defense_debuff: ['敵部隊防御低下']
  };

  const state = {
    mode: 'main',
    mainGeneral: null,
    purposeId: '',
    typeId: '',
    showAllPurposes: false,
    query: '',
    data: null
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
  const flatten = (v) => {
    if (Array.isArray(v)) return v.map(flatten).join(' ');
    if (v && typeof v === 'object') return Object.values(v).map(flatten).join(' ');
    return String(v ?? '');
  };
  const asItems = (v, keys) => {
    if (Array.isArray(v)) return v;
    for (const k of keys) if (Array.isArray(v?.[k])) return v[k];
    return [];
  };
  const fetchJson = async (file) => {
    const r = await fetch(file, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
    return r.json();
  };

  function metricAliases(metric) {
    return [metric.label, ...(METRIC_ALIASES[metric.metricKey] || [])].filter(Boolean).map(norm);
  }

  function scoreType(general, rule) {
    if (!general) return { score: null, matched: [], total: 5 };
    const featureText = norm(flatten(general.typeFeatures || []));
    const metrics = Array.isArray(rule.metrics) ? rule.metrics.slice(0, 5) : [];
    const matched = metrics.filter((metric) => metricAliases(metric).some((a) => a && featureText.includes(a)));
    return { score: Math.min(10, matched.length * 2), matched, total: 5 };
  }

  function scorePurpose(general, purpose) {
    const rules = state.data.scoreRules;
    const rows = (purpose.recommendedTypeIds || [])
      .map((typeId) => ({ rule: rules.find((r) => r.typeId === typeId), typeId }))
      .filter((v) => v.rule)
      .map((v) => ({ ...v, result: scoreType(general, v.rule) }))
      .sort((a, b) => (b.result.score ?? -1) - (a.result.score ?? -1));
    return { score: rows[0]?.result.score ?? null, best: rows[0] || null, rows };
  }

  function loadSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      state.mode = saved.mode || 'main';
      state.purposeId = saved.purposeId || '';
      state.typeId = saved.typeId || '';
      state.mainGeneral = saved.mainGeneral || null;
    } catch (_) {}
  }

  function saveSelection() {
    const selected = {
      mode: state.mode,
      mainGeneral: state.mainGeneral,
      purposeId: state.purposeId,
      typeId: state.typeId,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: selected }));
    const msg = document.getElementById('hadoTypeEntryMessage');
    if (msg) msg.textContent = '選択内容を保存しました。';
  }

  function clearSelection() {
    state.mainGeneral = null;
    state.purposeId = '';
    state.typeId = '';
    state.query = '';
    render();
  }

  function style() {
    if (document.getElementById('hadoTypeEntryStyle')) return;
    const el = document.createElement('style');
    el.id = 'hadoTypeEntryStyle';
    el.textContent = `
      #hadoTypeEntryOpen{position:fixed;right:18px;bottom:18px;z-index:99990;border:0;border-radius:999px;padding:12px 18px;background:#1d4ed8;color:#fff;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer}
      #hadoTypeEntryOverlay{position:fixed;inset:0;z-index:99991;background:rgba(15,23,42,.56);display:flex;align-items:center;justify-content:center;padding:16px}
      #hadoTypeEntryModal{width:min(1180px,100%);max-height:92dvh;background:#fff;border-radius:18px;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;overflow:hidden;color:#172033;box-shadow:0 20px 60px rgba(0,0,0,.35)}
      .hte-head,.hte-tabs,.hte-foot{padding:14px 18px}.hte-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:1px solid #d9e1ec}.hte-head h2{margin:0}.hte-sub{font-size:12px;color:#64748b;margin-top:4px}.hte-tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #d9e1ec}.hte-btn,.hte-tab{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:9px 12px;cursor:pointer}.hte-tab.active,.hte-btn.primary{border-color:#2563eb;background:#eff6ff;color:#1d4ed8;font-weight:700}.hte-body{min-height:0;overflow:auto;padding:14px 18px}.hte-grid{display:grid;grid-template-columns:minmax(280px,360px) minmax(0,1fr);gap:14px}.hte-card{border:1px solid #d8e0eb;border-radius:14px;padding:12px;background:#fff}.hte-title{font-weight:700;margin-bottom:8px}.hte-list{display:grid;gap:8px;max-height:52dvh;overflow:auto}.hte-item{border:1px solid #d8e0eb;border-radius:12px;padding:10px;background:#fff;cursor:pointer;text-align:left}.hte-item.active{border-color:#2563eb;background:#eff6ff}.hte-score{font-weight:700}.hte-score small{font-weight:400;color:#64748b}.hte-match{font-size:12px;color:#475569;margin-top:4px}.hte-note{font-size:12px;color:#64748b}.hte-selected{background:#eff6ff;border-color:#93c5fd}.hte-foot{position:sticky;bottom:0;background:#fff;border-top:1px solid #d9e1ec;display:flex;justify-content:space-between;gap:12px;align-items:center}.hte-foot-actions{display:flex;gap:8px;flex-wrap:wrap}.hte-summary{font-size:13px}.hte-search{width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:8px}
      @media(max-width:720px){#hadoTypeEntryOverlay{padding:0}#hadoTypeEntryModal{width:100%;height:100dvh;max-height:none;border-radius:0}.hte-grid{grid-template-columns:1fr}.hte-head,.hte-tabs,.hte-body,.hte-foot{padding:12px}.hte-list{max-height:38dvh}.hte-foot{align-items:flex-start;flex-direction:column}.hte-foot-actions{width:100%}.hte-foot-actions .hte-btn{flex:1}}
    `;
    document.head.appendChild(el);
  }

  function typeRows(typeIds) {
    const ids = typeIds?.length ? typeIds : state.data.scoreRules.map((v) => v.typeId);
    return ids.map((id) => state.data.scoreRules.find((v) => v.typeId === id)).filter(Boolean);
  }

  function renderMainPane() {
    if (state.mainGeneral) {
      return `<div class="hte-card hte-selected"><div class="hte-title">選択中の主将</div><div>${esc(state.mainGeneral.displayName || state.mainGeneral.name)}</div><div style="margin-top:10px;display:flex;gap:8px"><button class="hte-btn" data-action="change-main">主将を変更</button><button class="hte-btn" data-action="clear">解除</button></div></div>`;
    }
    const q = norm(state.query);
    const generals = state.data.generals.filter((v) => !q || norm(v.displayName || v.name).includes(q));
    return `<div class="hte-card"><div class="hte-title">主将を選択</div><input class="hte-search" id="hadoTypeEntryQuery" placeholder="主将名で絞り込み" value="${esc(state.query)}"><div class="hte-list">${generals.map((g) => `<button class="hte-item" data-main-id="${esc(g.id)}">${esc(g.displayName || g.name)}</button>`).join('')}</div><div class="hte-note" style="margin-top:8px">上ほど新しい武将です。</div></div>`;
  }

  function renderPurposes() {
    const scored = state.data.purposes.map((p) => ({ p, r: scorePurpose(state.mainGeneral, p) }));
    const visible = state.showAllPurposes || !state.mainGeneral ? scored : scored.filter((v) => (v.r.score ?? 0) > 0);
    return `<div class="hte-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div class="hte-title">${state.mainGeneral ? '主将に合う目的' : '目的を選択'}</div>${state.mainGeneral ? `<label class="hte-note"><input type="checkbox" id="hadoShowAllPurposes" ${state.showAllPurposes ? 'checked' : ''}> 全目的を表示</label>` : ''}</div><div class="hte-list">${visible.map(({p,r}) => `<button class="hte-item ${state.purposeId === p.purposeId ? 'active' : ''}" data-purpose-id="${esc(p.purposeId)}"><div class="hte-title">${esc(p.purposeName)}</div><div class="hte-score">主将参考適合度: ${r.score == null ? '-' : `${r.score}/10`}</div>${r.best ? `<div class="hte-match">最上位型: ${esc(r.best.rule.typeName)} / ${r.best.result.matched.length}/5項目一致</div>` : ''}</button>`).join('') || '<div class="hte-note">一致する目的がありません。「全目的を表示」を選ぶと全件確認できます。</div>'}</div></div>`;
  }

  function renderTypes() {
    const purpose = state.data.purposes.find((p) => p.purposeId === state.purposeId);
    const rules = typeRows(state.mode === 'type' ? null : purpose?.recommendedTypeIds);
    return `<div class="hte-card"><div class="hte-title">型を選択</div><div class="hte-list">${rules.map((rule) => { const r = scoreType(state.mainGeneral, rule); return `<button class="hte-item ${state.typeId === rule.typeId ? 'active' : ''}" data-type-id="${esc(rule.typeId)}"><div class="hte-title">${esc(rule.typeName)}</div><div class="hte-score">主将参考適合度: ${r.score == null ? '-' : `${r.score}/10`}</div><div class="hte-match">一致: ${r.matched.length}/5項目${r.matched.length ? ` / ${r.matched.map((m) => esc(m.label)).join('、')}` : ''}</div></button>`; }).join('')}</div><div class="hte-note" style="margin-top:8px">固定5項目を各2点で採点します。候補数や広い特徴語では加点しません。</div></div>`;
  }

  function render() {
    const modal = document.getElementById('hadoTypeEntryModal');
    if (!modal || !state.data) return;
    modal.innerHTML = `<div class="hte-head"><div><h2>型編成ナビ</h2><div class="hte-sub">3.0.0.0 Update03.2 / 主将単体の参考適合度</div></div><button class="hte-btn" data-action="close">閉じる</button></div><div class="hte-tabs"><button class="hte-tab ${state.mode === 'main' ? 'active' : ''}" data-mode="main">主将から考える</button><button class="hte-tab ${state.mode === 'purpose' ? 'active' : ''}" data-mode="purpose">目的から考える</button><button class="hte-tab ${state.mode === 'type' ? 'active' : ''}" data-mode="type">型を直接選ぶ</button></div><div class="hte-body"><div class="hte-grid">${state.mode === 'main' ? renderMainPane() : ''}${state.mode !== 'type' ? renderPurposes() : ''}${(state.mode === 'type' || state.purposeId) ? renderTypes() : ''}</div></div><div class="hte-foot"><div><div class="hte-summary">主将: ${esc(state.mainGeneral?.displayName || state.mainGeneral?.name || '未選択')} / 目的: ${esc(state.data.purposes.find((p) => p.purposeId === state.purposeId)?.purposeName || '未選択')} / 型: ${esc(state.data.scoreRules.find((t) => t.typeId === state.typeId)?.typeName || '未選択')}</div><div id="hadoTypeEntryMessage" class="hte-note"></div></div><div class="hte-foot-actions"><button class="hte-btn" data-action="clear">リセット</button><button class="hte-btn primary" data-action="save">選択を保存</button></div></div>`;

    modal.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { state.mode = b.dataset.mode; state.purposeId = ''; state.typeId = ''; render(); }));
    modal.querySelectorAll('[data-action="close"]').forEach((b) => b.addEventListener('click', close));
    modal.querySelectorAll('[data-action="clear"]').forEach((b) => b.addEventListener('click', clearSelection));
    modal.querySelectorAll('[data-action="change-main"]').forEach((b) => b.addEventListener('click', () => { state.mainGeneral = null; state.purposeId = ''; state.typeId = ''; render(); }));
    modal.querySelectorAll('[data-action="save"]').forEach((b) => b.addEventListener('click', saveSelection));
    modal.querySelectorAll('[data-main-id]').forEach((b) => b.addEventListener('click', () => { state.mainGeneral = state.data.generals.find((g) => g.id === b.dataset.mainId) || null; state.purposeId = ''; state.typeId = ''; render(); }));
    modal.querySelectorAll('[data-purpose-id]').forEach((b) => b.addEventListener('click', () => { state.purposeId = b.dataset.purposeId; state.typeId = ''; render(); }));
    modal.querySelectorAll('[data-type-id]').forEach((b) => b.addEventListener('click', () => { state.typeId = b.dataset.typeId; render(); }));
    document.getElementById('hadoShowAllPurposes')?.addEventListener('change', (e) => { state.showAllPurposes = e.target.checked; render(); });
    document.getElementById('hadoTypeEntryQuery')?.addEventListener('input', (e) => { state.query = e.target.value; render(); document.getElementById('hadoTypeEntryQuery')?.focus(); });
  }

  function close() { document.getElementById('hadoTypeEntryOverlay')?.remove(); }

  async function open() {
    style();
    if (!state.data) {
      const [roleIndex, scoreRules, purposeRules] = await Promise.all([fetchJson(JSON_FILES.roles), fetchJson(JSON_FILES.scoreRules), fetchJson(JSON_FILES.purposeRules)]);
      state.data = {
        generals: asItems(roleIndex, ['items']).filter((v) => v.roleId === 'main_general').sort((a, b) => Number(a.sourceIndex || 0) - Number(b.sourceIndex || 0)),
        scoreRules: asItems(scoreRules, ['items', 'types']),
        purposes: asItems(purposeRules, ['items', 'purposes'])
      };
      loadSaved();
    }
    close();
    const overlay = document.createElement('div');
    overlay.id = 'hadoTypeEntryOverlay';
    overlay.innerHTML = '<section id="hadoTypeEntryModal" role="dialog" aria-modal="true" aria-label="型編成ナビ"></section>';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    render();
  }

  function mount() {
    if (document.getElementById('hadoTypeEntryOpen')) return;
    style();
    const button = document.createElement('button');
    button.id = 'hadoTypeEntryOpen';
    button.textContent = '型編成ナビ';
    button.addEventListener('click', () => open().catch((e) => alert(`型編成ナビの読込に失敗しました。\n${e.message}`)));
    document.body.appendChild(button);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
