/* HADO app 3.0.0.0 Update09.5.61 candidate-workspace launcher. */
(()=>{'use strict';
const REQUEST='hado:formation-candidate-tray-snapshot-request';
const SNAPSHOT='hado:formation-candidate-tray-snapshot';
const OPEN_REQUEST='hado:formation-candidate-tray-open-request';
let snapshot={formationId:'',formationName:'',evaluationTypeId:'',items:[]};
function requestSnapshot(context='ui'){dispatchEvent(new CustomEvent(REQUEST,{detail:{context}}));}
function style(){if(document.getElementById('hct-style'))return;const e=document.createElement('style');e.id='hct-style';e.textContent=`#hct-open{position:fixed;right:18px;bottom:72px;z-index:99990;border:1px solid #0f766e;border-radius:999px;padding:11px 17px;background:#fff;color:#0f766e;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(15,118,110,.16)}#hct-count{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;margin-left:6px;border-radius:999px;background:#0f766e;color:#fff;font-size:12px}`;document.head.appendChild(e)}
function close(){if(window.HadoTypeCandidates&&typeof window.HadoTypeCandidates.close==='function')window.HadoTypeCandidates.close();}
function open(options={}){const detail={...options,mode:'candidate',source:options.source||'candidate-workspace-launcher'};if(window.HadoTypeCandidates&&typeof window.HadoTypeCandidates.open==='function')return window.HadoTypeCandidates.open(detail);dispatchEvent(new CustomEvent('hado:type-candidates-open-request',{detail}));}
function refreshButton(){const n=Array.isArray(snapshot.items)?snapshot.items.length:0;const c=document.getElementById('hct-count');if(c)c.textContent=String(n)}
function isFormationTab(){return typeof window.state==='object'?window.state.mainTab==='formation':document.getElementById('formationScreen')&&!document.getElementById('formationScreen').classList.contains('tab-content-hidden')}
function syncVisibility(){const b=document.getElementById('hct-open');const visible=!!isFormationTab();if(b)b.hidden=!visible;if(!visible)close()}
function mount(){if(document.getElementById('hct-open'))return;style();const b=document.createElement('button');b.id='hct-open';b.type='button';b.innerHTML='候補ワークスペース <span id="hct-count">0</span>';b.onclick=()=>open().catch?.(err=>alert(`候補ワークスペースの読込に失敗しました。\n${err.message}`));document.body.appendChild(b);requestSnapshot('mount');syncVisibility();new MutationObserver(syncVisibility).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['class']});setInterval(syncVisibility,400)}
addEventListener(SNAPSHOT,e=>{snapshot=e.detail||{formationId:'',formationName:'',evaluationTypeId:'',items:[]};refreshButton()});
addEventListener(OPEN_REQUEST,e=>open(e.detail||{}));
window.HadoCandidateTray={open,close,requestSnapshot};
if(document.readyState==='loading')addEventListener('DOMContentLoaded',mount);else mount();
})();
