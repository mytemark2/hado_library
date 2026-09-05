'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'hado_share.js'), 'utf8');
const styles = fs.readFileSync(path.join(ROOT, 'hado_styles.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const workflow = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'notify-preview.yml'), 'utf8');

const documentStub = {
  readyState: 'loading',
  addEventListener() {},
  getElementById() { return null; },
  querySelector() { return null; },
  createElement() { return {dataset:{}, appendChild(){}, className:'', hidden:false}; },
  body: {appendChild(){}}
};
const context = {
  console, TextEncoder, TextDecoder, Uint8Array, Blob, Response, URL, URLSearchParams,
  btoa, atob, setTimeout, clearTimeout, setInterval, clearInterval,
  document: documentStub,
  location: {protocol:'https:', origin:'https://example.test', pathname:'/preview/', href:'https://example.test/preview/'},
  navigator: {},
  state: {
    activeCategories:{generals:true,skills:true}, selectedTags:['条件:主将'], searchMode:'normal', nameOnlySearch:false,
    viewMode:'all', generalStage:'max', equipmentStage:'urMax', lastResultRows:[
      {label:'武将', item:{category:'generals',name:'LR関羽（かんう）'}, metric:{display:'攻撃+10%'}},
      {label:'技能', item:{category:'skills',name:'忠勇'}}
    ], formations:[], warhorses:[], warhorseSkills:[]
  },
  els:{searchInput:{value:'攻撃+'}},
  DATASET_LABELS:{generals:'武将',skills:'技能'},
  detailCategory:item=>item.category,
  resolveParameterCopyKeyFromKeyword:value=>value==='攻撃+'?'攻撃':'',
  getItemDisplayName:item=>item.name,
  stripReadingForCopy:value=>String(value).replace(/（[^）]*）/g,''),
  generalStageLabel:()=> '最大', equipmentStageLabel:()=> 'UR最大',
  debugLog() {}
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, {filename:'hado_share.js'});

(async () => {
  const api = context.HadoShare;
  assert(api, 'HadoShare API must be exported');
  const listText = api.buildResultsCopyText();
  assert(listText.startsWith('検索条件\n'), 'list copy must start with search conditions');
  assert(listText.includes('【武将】LR関羽｜攻撃+10%'), 'parameter value must be merged into list copy only for parameter search');
  assert(listText.includes('【技能】忠勇'), 'every result must include its category');

  const searchPayload = {v:1,kind:'search',app:'3.1.1.0',data:api.captureSearchState()};
  const encoded = await api.encodePayload(searchPayload);
  const decoded = await api.decodePayload(encoded);
  assert.strictEqual(JSON.stringify(decoded), JSON.stringify(searchPayload), 'share payload must round-trip');
  const link = await api.buildShareUrl('search', searchPayload.data);
  assert(link.startsWith('https://example.test/preview/?share='), 'share link must use one GET parameter');

  assert(api.renderFormationActionsHtml().includes('編成共有コピー'));
  assert(api.renderFormationActionsHtml().includes('新規部隊作成リンクコピー'));
  assert(api.renderWarhorseActionsHtml(true, true).includes('軍馬共有コピー'));
  assert(api.renderWarhorseActionsHtml(true, true).includes('新規軍馬作成リンクコピー'));
  assert(source.includes('state.formations.push(record)'), 'formation import must append a new record');
  assert(source.includes('data.owned[id] = record'), 'warhorse import must append a new record');
  assert(source.includes('activeSlotsUnchanged:true'), 'warhorse import must document that active assignments are unchanged');
  assert(source.includes('slot.attendantPosition ?'), 'formation copy must include attendant position');
  assert(source.includes('.slice(0, 3)'), 'warhorse copy/import must limit normal skills to three');
  assert(source.includes("source.formationName = '基本'"), 'missing formation masters must be blank-safe on import');
  assert(source.includes("document.getElementById('loadOverlay')?.classList.contains('is-visible')"), 'share import dialog must wait for startup loading to finish');
  assert(source.includes("tabs.append(host)"), 'formation copy actions must share the existing formation menu row');
  assert(!source.includes("panel.prepend(host)"), 'formation copy actions must not consume a separate row above the formation menu');
  assert(fs.readFileSync(path.join(ROOT, 'hado_share.css'), 'utf8').includes("margin-left: auto"), 'formation copy actions must align to the right in the menu row');
  assert(styles.includes('body.formation-tab .formation-compose-main-grid'), 'formation workspace must keep a scoped PC layout rule');
  assert(styles.includes('overflow-y:auto!important'), 'lower formation content must remain reachable by scrolling');

  assert(indexHtml.includes('hado_share.js?v=3.1.1.0-r205'));
  assert(indexHtml.includes('hado_share.css?v=3.1.1.0-r205'));
  assert(indexHtml.includes('hado_styles.css?v=3.1.1.0-r205'));
  assert(workflow.includes('ALLOWED_PREVIEW_SOURCE_BRANCH: feature/app-3.1.1.0'));
  console.log('3.1.1.0 copy/share contract passed: 8 user-facing functions, GET round-trip, append-only imports');
})().catch(error => { console.error(error); process.exitCode = 1; });
