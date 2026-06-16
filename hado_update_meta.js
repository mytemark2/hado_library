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

(() => {
  'use strict';
  function esc0(v){return (typeof esc==='function')?esc(v):String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function addCss(){
    if(document.getElementById('u09p3fix'))return;
    const s=document.createElement('style');s.id='u09p3fix';s.textContent='body.formation-tab .formation-group-list-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end}body.formation-tab .formation-compose-bar-grid .formation-memo-under-siege{grid-column:1/-1}body.formation-tab .formation-score-evaluation-inline{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:6px!important}body.formation-tab .formation-score-evaluation-inline .formation-score-chip{display:grid!important;border:1px solid #dbeafe;background:#fff;border-radius:10px;padding:5px 7px}body.formation-tab .formation-score-evaluation-inline .formation-score-label{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.formation-tab .formation-score-evaluation-inline .value{font-size:15px;font-weight:800}';document.head.appendChild(s);
  }
  function patch(){
    addCss();
    try{if(typeof renderFormationGroupControlsHtml==='function')renderFormationGroupControlsHtml=function(){const groups=sanitizeFormationGroups(state.formationGroups||[]),current=getCurrentFormationGroup();return `<div class="formation-group-controls"><div class="formation-group-head"><span class="formation-group-title">グループ</span></div><div class="formation-group-list-row"><label class="formation-group-select-label"><span class="note">グループリスト</span><select id="formationGroupSelect" class="formation-select">${groups.map(g=>`<option value="${esc0(g.id)}" ${g.id===current.id?'selected':''}>${esc0(g.name)}</option>`).join('')}</select></label><button type="button" id="formationGroupRenameBtn" class="formation-group-manage-btn">変更</button></div></div>`;};}catch(_){ }
    try{if(typeof renderFormationComposeBarHtml==='function')renderFormationComposeBarHtml=function(f,data){const siege=f?.siegeWeapon||createFormationSiegeWeaponSelection(),arm=f?.ethnicArmament||createFormationEthnicArmamentSelection();const sd=normalizeSaveItemName(siege.name)?'':' disabled',ad=normalizeSaveItemName(arm.name)?'':' disabled',egd=normalizeSaveItemName(arm.name)?'':' disabled';const memoText=norm(f?.memo||'')||'未記入';return `<div class="formation-compose-toolbar"><div class="formation-compose-toolbar-head"><div class="formation-compose-title">編成バー</div><div class="formation-compose-meta"><span class="formation-badge">部隊兵科：${esc0(data.formationContext?.troopType||'未設定')}</span><span class="formation-badge">型：${esc0(formationEvaluationTypeDisplayName(f))}</span><span class="formation-save-dirty">${state.formationDirty?'未保存':''}</span></div></div><div class="formation-compose-bar-grid"><label><span class="note">部隊名</span><input id="formationNameInput" type="text" value="${esc0(f.name)}"></label><label><span class="note">陣形</span><select id="formationMasterSelect" class="formation-select">${buildFormationMasterSelectOptions(f?.formationName)}</select></label><label><span class="note">編制種類</span><select id="formationDeploymentTypeSelect" class="formation-select">${buildFormationDeploymentTypeOptions(f?.deploymentType)}</select></label><label><span class="note">武装</span><select id="formationEthnicArmamentSelect" class="formation-select">${buildFormationExtensionSelectOptions('ethnicArmament',arm.name)}</select></label><label><span class="note">武装Lv</span><select id="formationEthnicArmamentLevelSelect" class="formation-select"${ad}>${buildFormationExtensionLevelOptions('ethnicArmament',arm)}</select></label><label><span class="note">異民族武将</span><select id="formationEthnicGeneralSelect" class="formation-select"${egd}>${buildFormationEthnicGeneralSelectOptions(arm)}</select></label><label><span class="note">兵器</span><select id="formationSiegeWeaponSelect" class="formation-select">${buildFormationExtensionSelectOptions('siegeWeapon',siege.name)}</select></label><label><span class="note">兵器Lv</span><select id="formationSiegeWeaponLevelSelect" class="formation-select"${sd}>${buildFormationExtensionLevelOptions('siegeWeapon',siege)}</select></label><div class="formation-memo-inline formation-memo-under-siege"><span class="note">マイメモ</span><span class="formation-memo-text" title="${esc0(memoText)}">${esc0(memoText)}</span><button type="button" id="formationMemoEditBtn">編集</button></div></div></div>`;};}catch(_){ }
    try{if(typeof renderFormationScoreSummaryHtml==='function')renderFormationScoreSummaryHtml=function(f,data){const scores=calculateFormationAutoScores(f,data);f.totalScore=scores.totalScore;f.evaluationScore=scores.evaluationScore;const rows=(scores.breakdown?.scoreRows||[]).slice(0,5);while(rows.length<5)rows.push({label:`評価${rows.length+1}`,score:0});return `<div class="formation-score-summary" aria-label="自動計算スコア"><div class="formation-score-summary-head"><div class="formation-score-total"><span>トータルスコア</span><strong>${esc0(scores.totalScore)}</strong></div><span class="formation-score-toggle-note">評価スコア5項目</span></div><div class="formation-score-breakdown formation-score-generals formation-score-evaluation-inline">${rows.map(r=>`<span class="formation-score-chip"><span class="formation-score-label">${esc0(r.label||'')}</span><span class="value">${esc0(r.score||0)}</span></span>`).join('')}</div></div>`;};}catch(_){ }
    try{if(typeof renderFormationScreen==='function'&&typeof state!=='undefined'&&state?.mainTab==='formation')renderFormationScreen();}catch(_){ }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
})();
