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
    try{if(typeof renderFormationScreen==='function'&&typeof state!=='undefined'&&state?.mainTab==='formation')renderFormationScreen();}catch(_){ }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
})();

/* FIX[Update09.3.21-FORMATION-SCORE-DIAG-NO-LIST-OVERWRITE]:
   Prevent empty list-render scoring from overwriting the real selected formation score diagnostic. */
(() => {
  'use strict';
  function esc1(v){return (typeof esc==='function')?esc(v):String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function n1(v){try{return typeof normalizeSaveItemName==='function'?normalizeSaveItemName(v||''):String(v||'').trim();}catch(_){return String(v||'').trim();}}
  function hasScoreInput(data){return !!(data&&(Array.isArray(data.effects)&&data.effects.length||Array.isArray(data.parameterRows)&&data.parameterRows.length||data.parameterCalculation));}
  function diagnosticFormationData(f){
    const d=window.state?.diagnostics?.formation||{};
    const pc=d.parameterCalculation||{};
    const fid=String(f?.id||''), fname=n1(f?.name||'');
    const pid=String(pc.formationId||''), pname=n1(pc.formationName||'');
    const matches=(fid&&pid&&fid===pid)||(fname&&pname&&fname===pname);
    if(!matches)return null;
    const rows=Array.isArray(pc.rows)?pc.rows:[];
    const effects=Array.isArray(d.effectSources)?d.effectSources:[];
    if(!rows.length&&!effects.length)return null;
    return {parameterCalculation:pc,parameterRows:rows,effects};
  }
  function silentEmptyScore(f,reason){
    const score=Number(f?.totalScore||f?.evaluationScore||0)||0;
    return {totalScore:score,evaluationScore:score,breakdown:{scoreRows:[],filledGenerals:typeof countFormationFilledGenerals==='function'?countFormationFilledGenerals(f):0,skillCount:0,parameterCount:0,evaluationTypeName:typeof formationEvaluationTypeDisplayName==='function'?formationEvaluationTypeDisplayName(f):'',scorePolicy:'empty-data-no-diagnostic-overwrite',memberCount:0,candidateScores:[],emptyReason:reason||'list render skipped empty score data'}};
  }
  function patch(){
    const originalAuto=window.calculateFormationAutoScores||calculateFormationAutoScores;
    if(typeof originalAuto==='function'&&!originalAuto.__u09321){
      const wrapped=function(f,data={}){
        const hydrated=hasScoreInput(data)?data:diagnosticFormationData(f);
        if(hydrated)return originalAuto(f,hydrated);
        return silentEmptyScore(f,'formation score input is empty; diagnostic not overwritten');
      };
      wrapped.__u09321=true;
      window.calculateFormationAutoScores=wrapped;
      try{calculateFormationAutoScores=wrapped;}catch(_){}
    }

    if(typeof renderFormationListHtml==='function'&&!renderFormationListHtml.__u09321){
      const wrappedList=function(){
        const visible=typeof getVisibleFormations==='function'?getVisibleFormations():[];
        return visible.map((f,i)=>{
          const siege=typeof formationExtensionDisplayName==='function'?formationExtensionDisplayName('siegeWeapon',f.siegeWeapon||{}):'';
          const arm=typeof formationExtensionDisplayName==='function'?formationExtensionDisplayName('ethnicArmament',f.ethnicArmament||{}):'';
          const score=Number(f?.totalScore||f?.evaluationScore||0)||0;
          return `<button type="button" class="formation-list-item ${f.id===state.currentFormationId?'is-active':''}" data-formation-select="${esc1(f.id)}"><span class="formation-list-no">${i+1}</span><span><span class="formation-list-name">${esc1(f.name)}</span><span class="formation-list-meta">型:${esc1(formationEvaluationTypeDisplayName(f))} / 合計:${esc1(score)}<br>更新: ${esc1(formatFormationDate(f.updatedAt))}<br>兵器:${esc1(siege)} / 武装:${esc1(arm)}</span></span><span>${f.id===state.currentFormationId?'編集中':'›'}</span></button>`;
        }).join('')||'<div class="detail-empty">このグループに部隊がありません</div>';
      };
      wrappedList.__u09321=true;
      renderFormationListHtml=wrappedList;
      window.renderFormationListHtml=wrappedList;
    }



    try{if(typeof renderFormationScreen==='function'&&window.state?.mainTab==='formation')renderFormationScreen();}catch(_){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
})();

/* FIX[FORMATION-VACCINE-SCORE-MATCH]: Map vaccine metrics to actual formation parameter/effect names. */
(() => {
  'use strict';
  const normText=s=>String(s??'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
  const esc2=v=>(typeof esc==='function')?esc(v):String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function hasInput(data){return !!(data&&(Array.isArray(data.effects)&&data.effects.length||Array.isArray(data.parameterRows)&&data.parameterRows.length||data.parameterCalculation));}
  function diagData(f){
    const d=window.state?.diagnostics?.formation||{};
    const pc=d.parameterCalculation||{};
    const rows=Array.isArray(pc.rows)?pc.rows:[];
    const effects=Array.isArray(d.effectSources)?d.effectSources:[];
    if(!rows.length&&!effects.length)return null;
    const fid=String(f?.id||''), pid=String(pc.formationId||'');
    const fn=normText(f?.name||''), pn=normText(pc.formationName||'');
    if((fid&&pid&&fid===pid)||(fn&&pn&&fn===pn))return {parameterCalculation:pc,parameterRows:rows,effects};
    return null;
  }
  function flatten(v){
    if(Array.isArray(v))return v.map(flatten).join(' ');
    if(v&&typeof v==='object')return Object.entries(v).filter(([k])=>!['rows','formula'].includes(k)).map(([,x])=>flatten(x)).join(' ');
    return String(v??'');
  }
  function pRows(data){
    const pc=data?.parameterCalculation||{};
    return Array.isArray(data?.parameterRows)?data.parameterRows:(Array.isArray(pc.rows)?pc.rows:[]);
  }
  function eRows(data){return Array.isArray(data?.effects)?data.effects:[];}
  function rowText(row){return normText(flatten(row));}
  function keyText(row){return normText([row?.key,row?.parameterKey,row?.parameterName,row?.displayValue,row?.sourceLabel,row?.condition,row?.rawText].filter(Boolean).join(' '));}
  function asDebug(row,kind){
    if(typeof formationScoreRowToDebug==='function')return formationScoreRowToDebug({...row,sourceKind:kind});
    return {sourceKind:kind,label:row?.parameterName||row?.key||row?.parameterKey||'',sourceLabel:row?.sourceLabel||'',key:row?.key||row?.parameterKey||'',value:row?.displayValue||row?.value||'',matchedText:String(flatten(row)).slice(0,160)};
  }
  function unique(rows){
    const seen=new Set();
    return rows.filter(row=>{const k=[row.sourceKind,row.key,row.label,row.sourceLabel,row.value,row.matchedText].join('|');if(seen.has(k))return false;seen.add(k);return true;});
  }
  function collect(data,predicate){
    const matchedParameters=pRows(data).filter(r=>predicate(rowText(r),keyText(r),r,'parameter')).map(r=>asDebug(r,'parameter'));
    const matchedEffects=eRows(data).filter(r=>predicate(rowText(r),keyText(r),r,'effect')).map(r=>asDebug(r,'effect'));
    return {matchedParameters:unique(matchedParameters).slice(0,40),matchedEffects:unique(matchedEffects).slice(0,40)};
  }

  function detailFromRow(row,kind,index,label){
    const dbg=asDebug(row,kind);
    return {label:dbg.label||dbg.key||label,point:1,source:dbg.sourceLabel||(kind==='parameter'?'変化率集計':'スコア根拠'),condition:dbg.condition||'常に',value:dbg.value||'',matchedText:dbg.matchedText||'',rawText:dbg.rawText||dbg.matchedText||'',evidenceType:kind,reason:`formation-vaccine-effect-keyword-match: ${label} に一致したため +1点`,featureId:dbg.featureId||'',key:dbg.key||'',index};
  }

  function positiveSupport(t,k){
    if(/敵|低下|奪取|解除|弱化|デバフ/.test(t))return false;
    if(/-[0-9]/.test(t)&&!/被ダメージ|獲得物喪失/.test(t))return false;
    return /部隊の攻撃|部隊の防御|部隊の知力|部隊の機動|部隊の兵力|攻撃速度|戦法速度|戦法ゲージ|会心発生|会心威力|連鎖確率|連鎖率|通常攻撃対象数|射程|負傷兵回復|負傷兵生存|耐性|味方/.test(t+k);
  }
  const PREDICATES={
    self_disadvantage_countermeasure:(t,k)=>/被ダメージ|耐性|負傷兵として生存|負傷兵生存|壊滅|弱化無効|弱化効果無効|弱化解除|状態変化無効|不利|不利変化/.test(t+k),
    ally_non_damage_effect:(t,k)=>positiveSupport(t,k),
    weakening_nullify:(t,k)=>/弱化無効|弱化効果無効|弱化.*無効|状態変化無効.*弱化|デバフ.*無効/.test(t+k),
    weakening_remove:(t,k)=>/弱化解除|弱化効果解除|弱化.*解除|デバフ.*解除|弱化.*取り除/.test(t+k),
    ally_wounded_recovery:(t,k)=>/負傷兵回復|味方負傷兵回復|兵力回復|負傷兵.*回復/.test(t+k)
  };
  function patchVaccine(scores,f,data){
    const selected=scores?.breakdown?.candidateScores?.[0];
    const isVaccine=normText(selected?.typeId||f?.evaluationTypeId||'')==='vaccine'||normText(selected?.typeName||f?.evaluationTypeName||'').includes('ワクチン');
    if(!isVaccine)return scores;
    const input=hasInput(data)?data:diagData(f);
    if(!input)return scores;
    const metricDefs=[
      ['self_disadvantage_countermeasure','自部隊不利対策'],
      ['ally_non_damage_effect','味方非ダメージ効果'],
      ['weakening_nullify','弱化無効'],
      ['weakening_remove','弱化解除'],
      ['ally_wounded_recovery','味方負傷兵回復']
    ];
    const rows=metricDefs.map(([key,label])=>{const rawParams=pRows(input).filter(r=>PREDICATES[key](rowText(r),keyText(r),r,'parameter'));const rawEffects=eRows(input).filter(r=>PREDICATES[key](rowText(r),keyText(r),r,'effect'));const hit=collect(input,PREDICATES[key]);const scoreDetails=[...rawParams.map((r,i)=>detailFromRow(r,'parameter',i,label)),...rawEffects.map((r,i)=>detailFromRow(r,'effect',rawParams.length+i,label))];return {label,score:scoreDetails.length,scoreDetails,evidenceRows:scoreDetails,matchedParameters:hit.matchedParameters,matchedEffects:hit.matchedEffects};});
    const total=rows.reduce((sum,row)=>sum+Number(row.score||0),0);
    const candidate={typeId:'vaccine',typeName:'ワクチン型',totalScore:total,rows};
    scores.totalScore=total;
    scores.evaluationScore=total;
    scores.breakdown=scores.breakdown||{};
    scores.breakdown.scoreRows=rows.map(r=>({label:r.label,score:r.score,unit:'点',scoreDetails:r.scoreDetails,evidenceRows:r.evidenceRows,matchedParameters:r.matchedParameters,matchedEffects:r.matchedEffects}));
    scores.breakdown.candidateScores=[candidate];
    scores.breakdown.parameterCount=eRows(input).length||pRows(input).length;
    scores.breakdown.emptyReason=total?'':'ワクチン型に一致する効果がありません';
    scores.breakdown.scorePolicy='formation-vaccine-effect-keyword-match';
    try{
      const d=window.state?.diagnostics||{};
      d.typeScore={...(d.typeScore||{}),timestamp:new Date().toISOString(),formationId:f?.id||'',formationName:f?.name||'',selectedTypeId:'vaccine',selectedTypeName:'ワクチン型',parameterRowCount:pRows(input).length,effectSourceCount:eRows(input).length,calculationInvoked:true,candidateScores:[candidate],rendered:true,emptyReason:scores.breakdown.emptyReason,reason:scores.breakdown.emptyReason,policy:'formation-vaccine-effect-keyword-match'};
      d.typeSearch={...(d.typeSearch||{}),timestamp:d.typeScore.timestamp,mode:'formation-score',candidateScoreCount:1,selectedTypeId:'vaccine',rendered:true,reason:d.typeScore.reason||''};
    }catch(_){}
    return scores;
  }
  function patch(){
    const base=window.calculateFormationAutoScores||calculateFormationAutoScores;
    if(typeof base==='function'&&!base.__vaccineMatch){
      const wrapped=function(f,data={}){return patchVaccine(base(f,data),f,data);};
      wrapped.__vaccineMatch=true;
      window.calculateFormationAutoScores=wrapped;
      try{calculateFormationAutoScores=wrapped;}catch(_){}
    }

    try{if(typeof renderFormationScreen==='function'&&window.state?.mainTab==='formation')renderFormationScreen();}catch(_){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
})();
