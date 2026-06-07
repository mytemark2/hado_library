'use strict';
/* HADO core, shared state, UI shell, parsing and common helpers */
const DATASET_LABELS={generals:'武将',tactics:'戦法',skills:'技能',equipments:'装備',statusEffects:'状態変化',siegeWeapons:'兵器',ethnicArmaments:'武装',formations:'陣形',warhorses:'名馬',warhorseSkills:'軍馬技能'};
const DETAIL_BLOCKLIST=['宇宙SF戦略RPG『ファウンデーション','Text Sample','技能別武将一覧はこちら','参軍技能別武将一覧はこちら'];
const DETAIL_SECTION_STOP_TITLES=['三國志 覇道の関連リンク','同じ五行適正の高い武将'];
const DETAIL_SECTION_MERGE_TITLES=['の戦法','の技能','の能力・五行適正','と相性の良い武将','の兵科'];
const DETAIL_SECTION_CONTENT_STOP_TEXTS=['同じ五行適正の高い武将'];
const state={rawCounts:{},generals:[],tactics:[],skills:[],equipments:[],statusEffects:[],statusEffectMetaByName:new Map(),statusEffectMetaList:[],siegeWeapons:[],ethnicArmaments:[],ethnicResearchSkills:[],formationMasters:[],fiveElements:[],warhorses:[],warhorseSkills:[],showRawJson:false,activeCategories:{generals:true,tactics:false,equipments:false,skills:false,statusEffects:false,siegeWeapons:false,ethnicArmaments:false,formations:false,warhorses:false,warhorseSkills:false},selectedItem:null,selectedLabel:'',viewMode:'all',saveData:{saves:[],currentSaveId:''},searchHistory:[],lastSearchDebug:null,lastResultRows:[],operationHistory:[],operationHistoryIndex:-1,isRestoringHistory:false,mobileSelectedSearchHistory:'',responsiveCompact:false,formations:[],currentFormationId:'',formationDirty:false,formationCalcVisibleMobile:false,formationDetailsOpen:{},formationLastSummaryUserAction:null,formationSkillFilter:'全て',formationSelectedSlot:'main',formationSelectorDialog:null,generalStage:'max',equipmentStage:'urMax',quickAddDestination:'',selectedTags:[],quickStatusEffectOwnerFilter:null,searchMode:'normal',typeSearchSelectedPresetId:'',typeSearchPresetDirty:false,typeSearchSelectedStatusEffectIds:[],typeSearchSelectedFeatureIds:[],typeSearchCategoriesBeforeEnter:null,typeSearchResultCache:new Map(),typeSearchCacheSeq:0,typeSearchCacheStats:{hit:0,miss:0,invalidations:0,store:0},typeSearchLastInvalidationReason:'',availableTags:[],availableTagsByKey:{},tagPickerVisible:false,nameOnlySearch:false,detailLinkCandidates:[],lookupIndexes:{generalSkillNames:new Map(),equipmentSkillNames:new Map(),generalTacticNames:new Map(),equipmentStatusEffectNames:new Map(),generalStatusEffectNames:new Map(),skillStatusEffectNames:new Map(),tacticStatusEffectNames:new Map()},savedModeIndex:{generalNames:new Set(),equipmentNames:new Set(),skillNames:new Set(),statusEffectNames:new Set()},diagnostics:{startup:{},categories:{},search:{},skillBuild:{},detailProfile:{},detailTabBuildProfile:{},slowContentDetailProfiles:[],derivedJsonIntegrity:{},derivedParameterSummaryUsage:{},derivedSkillOwnerUsage:{},quickStatusEffectGroupFilterCache:{},savedSkillLevelResolution:{}},detailLabelWidth:25,detailActiveTab:'parameter',mainTab:'search',formationInnerTab:'edit',formationResultTab:'tactic',formationTacticSummaryDialogOpen:false,fileSettingsCollapsed:false,searchDialogCollapsed:false,categoryProfileHistory:[],categoryProfileSeq:0,lastSearchProfile:null,_searchCacheStats:null,savedSearchCacheKey:'',savedSearchCacheSeq:0,ethnicGeneralIndex:{},warhorseSelectedId:'',derivedData:{statusEffectRelations:null,skillOwnerIndex:null,searchIndex:null,parameterSummaryIndex:null,resultCardIndex:null,tagIndex:null,statusEffectMetaIndex:null,statusEffectGroupOwnerIndex:null,relatedLinkIndex:null,equipmentSkillStageIndex:null,tacticAttackIndex:null,formationCandidateIndex:null,effectConditionBlocks:null},derivedDataStatus:{loaded:0,total:0,available:[],fallback:[]}};
const els={fileSettingsPanel:document.getElementById('fileSettingsPanel'),fileSettingsToggleBtn:document.getElementById('fileSettingsToggleBtn'),fileSettingsModeSummary:document.getElementById('fileSettingsModeSummary'),saveSelectSummary:document.getElementById('saveSelectSummary'),searchPanel:document.getElementById('searchPanel'),searchDialogToggleBtn:document.getElementById('searchDialogToggleBtn'),searchDialogBody:document.getElementById('searchDialogBody'),mainTabSearchBtn:document.getElementById('mainTabSearchBtn'),mainTabFormationBtn:document.getElementById('mainTabFormationBtn'),mainTabWarhorseBtn:document.getElementById('mainTabWarhorseBtn'),formationScreen:document.getElementById('formationScreen'),formationRoot:document.getElementById('formationRoot'),warhorseScreen:document.getElementById('warhorseScreen'),warhorseRoot:document.getElementById('warhorseRoot'),rawJsonToggle:document.getElementById('rawJsonToggle'),categoryBar:document.getElementById('categoryBar'),searchInput:document.getElementById('searchInput'),nameOnlySearchToggle:document.getElementById('nameOnlySearchToggle'),clearKeywordBtn:document.getElementById('clearKeywordBtn'),tagSearchInput:document.getElementById('tagSearchInput'),tagSearchCandidates:document.getElementById('tagSearchCandidates'),tagPickerToggleBtn:document.getElementById('tagPickerToggleBtn'),addTagSearchBtn:document.getElementById('addTagSearchBtn'),clearTagSearchBtn:document.getElementById('clearTagSearchBtn'),selectedTagList:document.getElementById('selectedTagList'),tagPickerPanel:document.getElementById('tagPickerPanel'),resultMeta:document.getElementById('resultMeta'),mobileSearchHistorySelect:document.getElementById('mobileSearchHistorySelect'),mobileDeleteSearchHistoryBtn:document.getElementById('mobileDeleteSearchHistoryBtn'),resultSelect:document.getElementById('resultSelect'),mobileResultFavoriteBtn:document.getElementById('mobileResultFavoriteBtn'),opHistoryBackBtn:document.getElementById('opHistoryBackBtn'),opHistoryForwardBtn:document.getElementById('opHistoryForwardBtn'),resultNextBtn:document.getElementById('resultNextBtn'),resultPrevBtn:document.getElementById('resultPrevBtn'),copyResultsBtn:document.getElementById('copyResultsBtn'),copyParamResultsBtn:document.getElementById('copyParamResultsBtn'),copyAllParamResultsBtn:document.getElementById('copyAllParamResultsBtn'),copyDetailBtn:document.getElementById('copyDetailBtn'),countStatus:document.getElementById('countStatus'),results:document.getElementById('results'),detail:document.getElementById('detail'),debugPanel:document.getElementById('debugPanel'),debugPanelContent:document.getElementById('debugPanelContent'),topPickJsonDirBtn:document.getElementById('topPickJsonDirBtn'),topPickJsonFilesBtn:document.getElementById('topPickJsonFilesBtn'),topPickJsonFilesInput:document.getElementById('topPickJsonFilesInput'),viewModeAll:document.getElementById('viewModeAll'),viewModeSaved:document.getElementById('viewModeSaved'),generalStageInitial:document.getElementById('generalStageInitial'),generalStageMax:document.getElementById('generalStageMax'),equipmentStageInitial:document.getElementById('equipmentStageInitial'),equipmentStageSsrMax:document.getElementById('equipmentStageSsrMax'),equipmentStageUrMax:document.getElementById('equipmentStageUrMax'),saveSelect:document.getElementById('saveSelect'),newSaveBtn:document.getElementById('newSaveBtn'),renameSaveBtn:document.getElementById('renameSaveBtn'),copySaveBtn:document.getElementById('copySaveBtn'),deleteSaveBtn:document.getElementById('deleteSaveBtn'),exportSaveDataBtn:document.getElementById('exportSaveDataBtn'),importSaveDataBtn:document.getElementById('importSaveDataBtn'),importSaveDataInput:document.getElementById('importSaveDataInput'),saveManagerPanel:document.getElementById('saveManagerPanel'),saveManagerSummaryText:document.getElementById('saveManagerSummaryText'),saveManagerRefreshBtn:document.getElementById('saveManagerRefreshBtn'),saveManagerCurrentValue:document.getElementById('saveManagerCurrentValue'),saveManagerCurrentNote:document.getElementById('saveManagerCurrentNote'),saveManagerOwnedValue:document.getElementById('saveManagerOwnedValue'),saveManagerOwnedNote:document.getElementById('saveManagerOwnedNote'),saveManagerFormationValue:document.getElementById('saveManagerFormationValue'),saveManagerFormationNote:document.getElementById('saveManagerFormationNote'),saveManagerExportValue:document.getElementById('saveManagerExportValue'),saveManagerExportNote:document.getElementById('saveManagerExportNote'),saveManagerNewBtn:document.getElementById('saveManagerNewBtn'),saveManagerCopyBtn:document.getElementById('saveManagerCopyBtn'),saveManagerExportBtn:document.getElementById('saveManagerExportBtn'),saveManagerImportBtn:document.getElementById('saveManagerImportBtn'),selectAllCategoriesBtn:document.getElementById('selectAllCategoriesBtn'),clearAllCategoriesBtn:document.getElementById('clearAllCategoriesBtn'),searchHistory:document.getElementById('searchHistory'),loadOverlay:document.getElementById('loadOverlay'),loadTitle:document.getElementById('loadTitle'),loadProgressBar:document.getElementById('loadProgressBar'),loadPercent:document.getElementById('loadPercent'),loadCounts:document.getElementById('loadCounts'),loadDetail:document.getElementById('loadDetail'),debugPanel:document.getElementById('debugPanel'),debugPanelContent:document.getElementById('debugPanelContent'),runValidationBtn:document.getElementById('runValidationBtn'),copyDebugLogBtn:document.getElementById('copyDebugLogBtn')};
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
// FIX[HADO-2.7.0.3-ISHUKU-TYPO-NORMALIZE]: クローリングデータ由来の誤記「委縮」は内部判定上「萎縮」に正規化する。UI表示も萎縮へ統一する。
const normalizeHadouCrawlerTypoText=s=>norm(s).replace(/委縮/g,'萎縮');
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function stripDisplayNoise(value){
  let text=String(value??'');
  if(!text)return '';
  text=text.split('/').map(part=>norm(part)).filter(part=>part&&!/アイコン$/.test(part)).join(' / ');
  text=text.replace(/\s*\/\s*\/\s*/g,' / ').replace(/^\s*\/\s*|\s*\/\s*$/g,'');
  text=text.replace(/\s{2,}/g,' ').trim();
  return text;
}
function escDisplay(value){return esc(stripDisplayNoise(value));}
const escRe=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const uniq=a=>[...new Set((Array.isArray(a)?a:[]).map(v=>norm(v)).filter(Boolean))];
const ROMAN_LEVELS=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ'];
const SKILL_RARITY_NOISE_NAMES=new Set(['UR','SSR','SR+','SR','R+','R']);
const isSkillRarityNoiseName=name=>SKILL_RARITY_NOISE_NAMES.has(norm(name));
const SAVE_STORAGE_KEY='hado_library_saved_sets_v1_2';
const SAVE_MIRROR_DB_NAME='hado_library_save_mirror_v1_9';
const SAVE_MIRROR_STORE='save_mirror';
const SAVE_MIRROR_KEY='current_save_data';
const SEARCH_HISTORY_STORAGE_KEY='hado_library_search_history_v1_2';
const FORMATION_STORAGE_KEY='hado_library_formations_v2_1_2_0';
const LOAD_DEBUG_PREFIX='[hado-debug]';
const debugTimerMap=new Map();
const debugLines=[];
const startupDebugLines=[];
const MAX_DEBUG_LINES=220;
const FILE_META={fileName:"hado_library_3.0.0.0.html",createdAt:"2026-06-06 00:00:00"};
// FEATURE[HADO-VERSIONING]: 2.x.x.y バージョン管理。メジャー/マイナーはユーザー採番、x は機能追加、y は不具合修正。
const HADO_BUILD_INFO={version:"3.0.0.0",baseVersion:"2.9.6.5",changeType:"feature",summary:"Update02: add type score, purpose, role rule and baseline role candidate JSON files.",baseSha256:"fb5063235bd797ae8376c2f0c37da4863e375d85c611f5b3400904a151dfcafa"};

// FEATURE[HADO-2.9.6.3-WEB-DEPLOYMENT]: HTTP(S)配信時は公開JSONを自動取得し、手動JSONロードUIを表示しない。
const IS_WEB_DEPLOYMENT=/^https?:$/.test(location.protocol);
function setElementHiddenById(id,hidden){const el=document.getElementById(id);if(el)el.hidden=!!hidden;}
function configureDeploymentUi(){
  try{
    document.body.classList.toggle('is-web-deployment',IS_WEB_DEPLOYMENT);
    const manualIds=['startupDataDirBtn','startupDataFilesBtn','startupDataCacheBtn','topPickJsonDirBtn','topPickJsonFilesBtn','uxPickJsonDirBtn','uxPickJsonFilesBtn','dataSheetJsonDirBtn','dataSheetJsonFilesBtn'];
    manualIds.forEach(id=>setElementHiddenById(id,IS_WEB_DEPLOYMENT));
    ['topWebJsonReloadBtn','webJsonReloadBtn'].forEach(id=>setElementHiddenById(id,!IS_WEB_DEPLOYMENT));
    const introText=document.getElementById('uxJsonLoadGuideText');
    if(introText)introText.textContent=IS_WEB_DEPLOYMENT?'ウェブ版では、公開サイトに格納されたJSONを自動的に読み込みます。JSONフォルダやJSONファイルを手動で選択する必要はありません。既存の保存データがある場合はImport、新規で使う場合は保存データを作成してください。':'PCはJSONフォルダ、スマホはJSONファイルを読み込みます。既存の保存データがある場合はImport、新規で使う場合は保存データを作成してから所有武将・装備を登録します。';
    const note=document.getElementById('fileSettingsJsonLoadNote');
    if(note)note.textContent=IS_WEB_DEPLOYMENT?'ウェブ版では、公開サイトに格納されたJSON一式を起動時に自動取得します。手動でJSONフォルダやJSONファイルを選択する必要はありません。':'起動時にJSON一式の状態を確認します。必要JSONの不足、派生JSONの旧版・不整合、またはJSON更新検出時はデータ読込画面を表示します。';
    const sub=document.getElementById('fileSettingsJsonLoadSubNote');
    if(sub)sub.textContent=IS_WEB_DEPLOYMENT?'※ 公開JSONを更新した場合は、ページを再読込するか「公開JSONを再取得」を押してください。保存データのImport / Exportは従来どおり利用できます。':'※ PCのJSONフォルダ方式では起動時に更新を検出します。スマホ等のJSONファイル選択方式では、前回読込済みの正常キャッシュで自動起動します。最新JSONへ更新する場合はデータ管理から再読込してください。';
    ['topWebJsonReloadBtn','webJsonReloadBtn'].forEach(id=>{const btn=document.getElementById(id);if(btn&&!btn.dataset.boundWebReload){btn.dataset.boundWebReload='1';btn.addEventListener('click',()=>location.reload());}});
    if(IS_WEB_DEPLOYMENT){const overlay=document.getElementById('startupDataOverlay');if(overlay)overlay.classList.remove('is-visible');}
    debugLog('deployment:ui',{web:IS_WEB_DEPLOYMENT,protocol:location.protocol});
  }catch(err){try{debugLog('deployment:ui-error',{message:err?.message||String(err)});}catch{}}
}
function renderWebJsonLoadFailure(err){
  hideStartupDataLoadScreen();hideLoadingState();
  const message=err?.message||String(err||'公開JSONの取得に失敗しました。');
  if(els.countStatus)els.countStatus.textContent='公開JSON取得失敗';
  if(els.resultMeta)els.resultMeta.textContent='ヒット件数：0件';
  if(els.results)els.results.innerHTML='';
  if(els.detail){els.detail.innerHTML=`<section><h2>公開JSONの取得に失敗しました</h2><p class="meta">${esc(message)}</p><p class="meta">ウェブ版では公開サイトに格納されたJSONを自動取得します。JSONフォルダやJSONファイルを手動で選択する必要はありません。</p><p class="meta">ページを再読込してください。改善しない場合は、公開JSONの配置または整合性を確認してください。</p><button id="webRetryJsonLoadBtn" type="button">ページを再読込</button></section>`;document.getElementById('webRetryJsonLoadBtn')?.addEventListener('click',()=>location.reload());}
  const status=document.getElementById('dataFileStatusText');if(status)status.textContent='ウェブ版：公開JSONの取得に失敗しました。ページを再読込してください。';
  debugLog('deployment:web-json-load-failed',{message});
}
// FEATURE[HADO-2.8.9.51-SLOW-DETAIL-PROFILE]: 内容詳細の初回描画が0.5秒以上のカテゴリで、ボトルネック工程を分解してDebug Logへ残す。
const DETAIL_BOTTLENECK_THRESHOLD_MS=500;
const DETAIL_BOTTLENECK_HISTORY_LIMIT=40;
function roundDetailMs(v){return Number((Number(v)||0).toFixed(1));}
function createDetailStageProfiler(context={}){
  const started=performance.now();
  let last=started;
  const steps=[];
  function mark(label,extra={}){
    const now=performance.now();
    const row={label,ms:roundDetailMs(now-last),totalMs:roundDetailMs(now-started),...extra};
    steps.push(row);
    last=now;
    return row;
  }
  function wrap(label,fn,extraFactory){
    const before=performance.now();
    try{
      const result=fn();
      const now=performance.now();
      const extra=typeof extraFactory==='function'?(extraFactory(result)||{}):{};
      const row={label,ms:roundDetailMs(now-before),totalMs:roundDetailMs(now-started),...extra};
      steps.push(row);
      last=now;
      return result;
    }catch(err){
      const now=performance.now();
      steps.push({label,ms:roundDetailMs(now-before),totalMs:roundDetailMs(now-started),error:String(err?.message||err)});
      last=now;
      throw err;
    }
  }
  function finish(extra={}){return {...context,...extra,totalMs:roundDetailMs(performance.now()-started),steps:steps.slice()};}
  return {mark,wrap,finish,steps};
}
function flattenDetailProfileSteps(profile){
  const rows=[];
  Object.entries(profile?.phases||{}).forEach(([name,v])=>rows.push({scope:'renderDetail',label:name,ms:roundDetailMs(v?.ms),totalMs:roundDetailMs(v?.totalMs),htmlLength:v?.htmlLength||'',groupCount:v?.groupCount||''}));
  const tabProfile=profile?.tabBuildProfile||profile?.detailTabBuildProfile;
  (tabProfile?.steps||[]).forEach(v=>rows.push({scope:tabProfile.scope||'renderTabbedDetailContent',label:v.label,ms:roundDetailMs(v.ms),totalMs:roundDetailMs(v.totalMs),htmlLength:v.htmlLength||'',groupCount:v.groupCount||'',source:v.source||''}));
  const builder=tabProfile?.builderProfile;
  (builder?.steps||[]).forEach(v=>rows.push({scope:builder.scope||'detailTabParts',label:v.label,ms:roundDetailMs(v.ms),totalMs:roundDetailMs(v.totalMs),htmlLength:v.htmlLength||'',groupCount:v.groupCount||'',source:v.source||''}));
  const related=profile?.relatedLinksProfile||profile?.relatedLinksBuildProfile;
  (related?.steps||[]).forEach(v=>rows.push({scope:related.scope||'safeBuildRelatedLinksHtml',label:v.label,ms:roundDetailMs(v.ms),totalMs:roundDetailMs(v.totalMs),htmlLength:v.htmlLength||'',groupCount:v.groupCount||'',source:v.source||''}));
  const diagRelated=state?.diagnostics?.relatedLinks?.profile;
  const diagRelatedMatches=diagRelated&&profile&&(!diagRelated.category||diagRelated.category===profile.categoryKey)&&(!diagRelated.item||norm(diagRelated.item)===norm(profile.name||''));
  if(diagRelatedMatches&&diagRelated!==related)(diagRelated.steps||[]).forEach(v=>rows.push({scope:diagRelated.scope||'safeBuildRelatedLinksHtml:last',label:v.label,ms:roundDetailMs(v.ms),totalMs:roundDetailMs(v.totalMs),htmlLength:v.htmlLength||'',groupCount:v.groupCount||'',source:v.source||''}));
  return rows.filter(r=>Number.isFinite(r.ms));
}
function recordSlowContentDetailBottleneck(profile){
  const phases=profile?.phases||{};
  const triggerMs=Math.max(Number(profile?.totalMs)||0,Number(phases.renderTabbedDetailContent?.ms)||0,Number(phases.safeBuildRelatedLinksHtml?.ms)||0,Number(phases.renderCategorySpecificHtml?.ms)||0);
  if(triggerMs<DETAIL_BOTTLENECK_THRESHOLD_MS)return null;
  const steps=flattenDetailProfileSteps(profile).sort((a,b)=>(b.ms||0)-(a.ms||0));
  const relatedProfileCandidate=profile.relatedLinksProfile||profile.relatedLinksBuildProfile||{};
  const diagRelatedProfile=state.diagnostics?.relatedLinks?.profile||{};
  const diagRelatedOk=diagRelatedProfile&&(!diagRelatedProfile.category||diagRelatedProfile.category===profile.categoryKey)&&(!diagRelatedProfile.item||norm(diagRelatedProfile.item)===norm(profile.name||''));
  const record={version:HADO_BUILD_INFO.version,timestamp:new Date().toLocaleTimeString('ja-JP',{hour12:false}),thresholdMs:DETAIL_BOTTLENECK_THRESHOLD_MS,categoryKey:profile.categoryKey||'',name:profile.name||'',label:profile.label||'',activeTab:profile.activeTab||'',totalMs:roundDetailMs(profile.totalMs),triggerMs:roundDetailMs(triggerMs),topBottlenecks:steps.slice(0,12),phaseSummary:safeCloneForDebug(profile.phases||{}),tabBuildProfile:safeCloneForDebug(profile.tabBuildProfile||profile.detailTabBuildProfile||{}),relatedLinksProfile:safeCloneForDebug(Object.keys(relatedProfileCandidate||{}).length?relatedProfileCandidate:(diagRelatedOk?diagRelatedProfile:{})),policy:'内容詳細描画が0.5秒以上の場合、renderDetail工程、タブ生成、関連リンク生成、DOM反映のどこが遅いかを記録する。'};
  if(!state.diagnostics)state.diagnostics={};
  if(!Array.isArray(state.diagnostics.slowContentDetailProfiles))state.diagnostics.slowContentDetailProfiles=[];
  state.diagnostics.slowContentDetailProfiles.push(record);
  if(state.diagnostics.slowContentDetailProfiles.length>DETAIL_BOTTLENECK_HISTORY_LIMIT)state.diagnostics.slowContentDetailProfiles=state.diagnostics.slowContentDetailProfiles.slice(-DETAIL_BOTTLENECK_HISTORY_LIMIT);
  state.diagnostics.lastSlowContentDetailProfile=record;
  debugLog('slow-content-detail:bottleneck',record);
  return record;
}

const HADO_STATUS_RELATION_FIX_HISTORY=[{version:'2.9.0.37',source:'2.9.0.36',target:'関連リンク0件の空索引正本化とクローラー開始直後フリーズ抑止',fixed:['クローラー1.0.5.15で関連リンク0件も空の正規索引として保持','全ソースデータの関連リンク索引網羅率coverageAuditをZIP生成前監査へ追加','アプリはcoverageAudit.okをrelated_link_index信頼条件に追加し、空索引と欠落を区別','クローラー開始直後と派生JSON生成15工程でUIへ制御を返し進捗表示'],checked:['状態変化:雄然は空索引として存在しエラーにならない','状態変化200件すべて関連リンク索引へ収録','LR関羽/LR司馬師/LR祝融の既存回帰を維持','JSON26件・HTML1件・SHA一致']},{version:'2.9.0.36',source:'2.9.0.35',target:'自部隊不利対策と付与状態変化の表示分離',fixed:['クローラー1.0.5.14でrelated_link_indexへdisplayRoleを付与','selfResistanceBuffの機能要約をfunctional-summary、実際に付与される状態変化素名をgranted-statusとして正本化','アプリ詳細では自部隊不利対策と付与される状態変化を別グループ表示','表示時の文字列推測や個別非表示を追加しない'],checked:['LR関羽: 弱化効果無効[弱化無効]は自部隊不利対策へ表示','LR関羽: 弱化無効/弱化解除/龍吟は付与される状態変化へ分離','LR司馬師: 状態変化無効[分断]は生成しない','JSON26件・HTML1件・SHA一致']},{version:'2.9.0.35',source:'2.9.0.34',target:'派生JSON条件参照遮断と検証器誤検知修正',fixed:['クローラー1.0.5.13で「状態変化名が発生している場合」を直接付与として途中確定せず、武将ページ全体を戦法JSONへ持ち込まない','アプリ検証器でasyncを必須関数名として誤認しない','絶縁監査は長文sourceTextではなくdirectGrantEvidenceの局所証拠を優先','LR夏侯惇の戦法遅延分類テストを対象分類だけに限定'],checked:['壮望の条件参照から絶縁所有リンクを生成しない','LR曹操/LR李牧/超世の傑/奇陣翼撃の正常な絶縁付与を維持','LR夏侯惇の戦法遅延は敵部隊状態弱化','旧JSON・欠損JSONの読込停止方針を維持','派生JSONの必要クローラーバージョンを1.0.5.13以上へ更新']},{version:'2.9.0.23',source:'2.9.0.22',target:'状態変化分類ラベルと実在状態変化名の表示分離',fixed:['状態変化マスタに実在する献計/取込/強化奪取等へ耐性・耐性低下を後付けしない絶対ゲートを追加','selfResistanceBuff表示を自部隊不利対策、enemyResistanceDebuff表示を敵部隊有利対策へ統一','対策ラベル角括弧内の参照元を技能→状態変化→戦法の順で解決し、弱化効果回避[献計]の献計を状態変化詳細へリンク'],checked:['LR張良: 献計/取込を実在名で表示','LR張良: 弱化効果回避[献計]の献計が状態変化リンク','LR司馬師: 敵部隊有利対策に強化奪取を表示','献計耐性/取込耐性/強化奪取耐性低下を生成しない']},{version:'2.9.0.15',source:'2.9.0.14',target:'戦法追加効果由来の自部隊不利対策表示名',fixed:['クローラー生成派生JSONのself-countermeasure-granted-statusで、表示名の角括弧を[戦法]ではなくviaStatus由来の状態変化名に変更','LR夏侯惇(ORIGINS)の奮心由来対策を弱化効果無効[奮心]として表示','関連リンク正本JSONと状態変化グループ所有者索引を同一データセットで更新'],checked:['LR夏侯惇(ORIGINS): 弱化効果無効[奮心]が存在','LR夏侯惇(ORIGINS): 弱化効果無効[戦法]が残らない','結束無効/不敵無効/奮心無効は生成しない','LRラインハルトの専用名宝由来混入を再発させない']},{version:'2.9.0.14',source:'2.9.0.13',target:'自部隊不利対策のクローラー正本化と状態変化グループ索引修正',fixed:['監査OKのrelated_link_index利用時にアプリ側で自部隊不利対策を再生成しないよう修正','クローラー1.0.5.1で専用名宝欄を武将本人の戦法/技能ソースから除外','戦法追加効果として付与される状態変化由来の自部隊不利対策を[戦法]として生成','status_effect_group_owner_indexをrelated_link_index正本から補完し、状態変化グループ選択で武将/戦法/技能/装備がヒットするよう修正'],checked:['LRヤン: 弱化効果回避[妙手]を表示','LRラインハルト: 専用名宝由来の弱化無効を武将本人に混入しない','LR夏侯惇(ORIGINS): 結束無効/不敵無効/奮心無効等を生成せず、弱化効果無効[戦法]を表示','LR司馬師: 状態変化無効[分断]を生成しない','LR華雄/LR呂玲綺/LR関羽の既存自部隊耐性強化を維持']},{version:'2.9.0.2',source:'2.9.0.1',target:'部隊編成結果サマリー拡大表示の高速化',fixed:['結果サマリー拡大表示の開閉でrenderFormationScreenを呼ばないよう修正','直近描画済みの結果サマリーHTMLをキャッシュし、モーダルDOMだけを追加/削除','formationSummaryDialog:open-fast/close-fastログを追加して再発時に描画経路を確認可能化'],checked:['編成タブのdata-formation-summary-openは維持','戦法タブの不要な結果サマリー出力は再追加しない','部隊編成計算ロジックは変更しない']},{version:'2.9.0.1',source:'2.9.0.0',target:'部隊編成結果サマリーの拡大表示整理',fixed:['編成タブの結果サマリーにPC用の拡大ダイアログ表示定義を追加','編成タブ結果サマリーのクリック/Enter/Spaceで拡大表示できるよう操作イベントを補強','戦法タブに混入していた不要な戦法サマリー拡大ストリップとダイアログ出力を削除'],checked:['編成タブにdata-formation-summary-openが残る','戦法タブにdata-formation-tactic-summary-openが出力されない','JS構文チェック']},{version:'2.9.0.0',source:'2.8.9.56',target:'部隊編成ガイド8/8と戦法ゲージリンク抑止',fixed:['部隊編成ガイド8/8で変化率タブへ明示切替し、状態変化率サマリーを選択対象にする','ガイド文言を現行UIの編成/戦法/変化率/詳細タブに合わせる','戦法ゲージを詳細本文の自動リンク候補から除外し、不要な状態変化リンクを作らない'],checked:['formation guide step 8にformationInnerTab=parameterを追加','戦法ゲージがdetailLinkCandidatesに入らない抑止関数を追加','JS構文チェック']},{version:'2.8.9.55',source:'2.8.9.54',target:'付与技能由来の自部隊耐性強化展開',fixed:['クローラー1.0.4.40で直接対策を持たず付与技能だけを持つ技能も生成対象に含める','LR関羽の忠勇→武聖由来の同討回避/戦法遅延回避をrelated_link_index正本に固定','アプリ側補完ではなくクローラー生成JSONの監査対象として扱う'],checked:['LR関羽の自部隊耐性強化に同討回避[武聖]と戦法遅延回避[武聖]が存在すること','LR華雄の剛塁由来自部隊耐性強化5件を維持','LR司馬師に状態変化無効[分断]が出ないこと']},{version:'2.8.9.54',source:'2.8.9.53',target:'クローラー生成済み自部隊不利対策ラベルの表示フィルタ',fixed:['攻撃低下回避[剛塁]など状態変化マスタに実体がない対策ラベルをcanUseRelatedLinkNameで除外しない','selfResistanceBuff/enemyResistanceDebuffはクローラー生成済み表示名をそのまま関連リンク表示する','アプリ側補完はtrusted related_link_index欠損時のフォールバックに限定'],checked:['LR華雄の自部隊耐性強化5件をJSON正本から表示対象として判定','LR呂玲綺/ LR関羽の自部隊耐性強化代表をJSON正本から判定','LR司馬師の状態変化無効[分断]非表示を維持']},{version:'2.8.9.53',source:'2.8.9.52',target:'自部隊不利対策のクローラー正本化表示',fixed:['related_link_indexに含まれるselfResistanceBuff/enemyResistanceDebuffを表示対象に復帰','対策名[技能]形式の生成済み表示名をアプリ側で再加工せずそのまま使用','監査済みrelated_link_index使用時はアプリ側補完を旧JSON/欠損JSON対策に限定'],checked:['LR華雄/剛塁の攻撃低下回避・萎縮回避・会心無効・撃心無効・強化解除回避がJSONから取得できること','LR呂玲綺の状態変化無効[憤怒]/[絶縁]をJSONから取得できること','LR司馬師に状態変化無効[分断]が出ないこと']},{version:'2.7.3.66',source:'2.7.3.65',target:'練射型射程効果の本文全体再補完と診断固定',fixed:['条件ブロック抽出後のactiveTextに射程行が残らない場合でも、技能本文全体から射程条件付き効果を再補完','射程条件付き効果のsourceLabelを技能名+ローマ数字に正規化し、練射ⅡとしてeffectSourcesへ残す','射程ゲートのbaseRange/threshold/adopted/excluded/detailsを部隊編成診断へ出力','射程行に練射Ⅱが含まれるかをrangeEffectTraceで確認可能化'],checked:['UR厳顔の練射Ⅱ本文に編制時点の自部隊の射程が2以上の際、部隊の射程+1が存在することを確認','補完正規表現が練射Ⅱ本文から射程+1を抽出することを静的確認','JS構文チェック','ZIP実展開SHA一致']},{version:'2.7.3.65',source:'2.7.3.64',target:'練射型射程条件の汎用条件評価除外',fixed:['射程条件付き効果は汎用のformation条件評価で除外せず、applyFormationRangeConditionGateへ委譲','編制時点の自部隊の射程がN以上の際は、条件付き射程効果自身を除いた射程で専用判定','練射ⅡがeffectSourcesに残り、基礎射程1.5+阻龍1.0の部隊で部隊の射程3.5になる経路を固定','同種不具合を検出するため、現行部隊の射程行・effectSourcesに練射Ⅱがあるかを診断へ追加'],checked:['2.7.3.64ログで部隊の射程2.5のまま再発していたことを確認','汎用条件評価前に射程条件付き効果を専用ゲートへ通す設計へ変更','JS構文チェック','ZIP実展開SHA一致']},{version:'2.7.3.64',source:'2.7.3.63',target:'練射型射程条件の有効ブロック後消失',fixed:['部隊編成ではgetActiveSkillBlocks後のactiveTextだけをparseParameterEffectsFromRecordへ渡していたため、別条件ブロックの練射型射程+1が失われる問題を修正','activeRecにfullTextとして元レコード全文を保持し、appendRangeThresholdEffectsFromRecordTextはfullTextを優先参照','陣形技能など同じ解析経路でもfullTextを保持し、条件行と効果行がactiveTextから落ちても補完抽出できるようにした','診断ログで部隊の射程2.5のままになる再発を検出しやすいよう検証名を明確化'],checked:['練射Ⅱの元レコード全文から条件付き射程+1を抽出できる静的確認','基礎射程1.5+阻龍1.0の状態では練射+1が採用可能になる設計','練射自身の+1だけで条件達成扱いにしないゲート処理は維持','JS構文チェック']},{version:'2.7.3.63',source:'2.7.3.62',target:'射程条件ゲートの実データ抽出',fixed:['練射のように条件行と効果行が同一技能本文内で分離していても、レコード本文全体から条件付き射程補正を補完抽出','parseParameterEffectsFromRecordの通常セグメント抽出で落ちた射程+値を、編制時点射程条件つき効果として効果リストへ追加','合算結果の部隊の射程に、条件達成時だけ練射型の射程+1が反映されるよう修正','検証を合成データだけでなく実際の練射本文パース確認まで拡張'],checked:['実データ形式の練射Ⅱ本文から条件付き射程+1を抽出','基礎射程1.5+阻龍1.0の状態では練射+1を採用できる','練射自身の+1だけで条件達成扱いにしない','JS構文チェック']},{version:'2.7.3.62',source:'2.7.3.61',target:'射程条件ゲート',fixed:['技能名ではなく条件文として「編制時点の自部隊の射程がN以上の際」を判定','射程条件付きの部隊の射程+値は、基礎射程+無条件射程補正で条件判定してから採用','練射自身の射程+1で条件達成扱いにしない','条件未達の射程補正は状態変化率・重要結果から除外し、除外ログへ理由を残す'],checked:['基礎射程1.5では練射型の射程+1を採用しない','無条件射程+0.5で事前射程2.0になった場合だけ射程+1を採用','射程条件ゲートの回帰チェックを追加','JS構文チェック']},{version:'2.7.3.61',source:'2.7.3.60',target:'戦法ゲージ状態変化率の上限',fixed:['戦法ゲージの状態変化率は合算後の最大値を50%で頭打ちにする','部隊編成結果・サマリー・状態変化率表の戦法ゲージ表示に上限50%を適用','計算根拠では元の合算値と上限適用を確認できるようにする','戦法ゲージ低下など敵側/低下表示は今回の上限対象外とし、正の戦法ゲージ上昇のみ制限'],checked:['合算55%の検証データが表示値50%になる','uncappedMaxTotalに元値55%を保持','射程表示と侍従単一候補優先の既存回帰を維持','JS構文チェック']},{version:'2.7.3.60',source:'2.7.3.59',target:'侍従配置優先順位',fixed:['侍従配置候補が1つだけの武将を、複数候補を持つ武将より先に座標確保するよう変更','複数候補を持つ武将同士は従来どおり主将→副将1→副将2→補佐1→補佐2の編成スロット優先順で処理','LR董卓のような単一侍従位置の武将が、複数候補のLR文醜に同一座標を先取りされる問題を防止','侍従配置優先順の回帰チェックを追加'],checked:['LR董卓は単一候補のためLR文醜より先に処理される','LR董卓の侍従条件は歩兵/弓兵/武力750以上として保持','LR文醜は複数候補のため単一候補グループの後に処理される','JS構文チェック']},{version:'2.7.3.59',source:'2.7.3.58',target:'部隊編成の射程表示と結果表示順',fixed:['主将の兵科基本能力から部隊の射程を通常時の状態変化率へ必ず追加','射程+0.5などの非％補正を技能/装備/兵器/武装追加効果から抽出','サマリー/結果の並び順を状態変化率の表示順（戦法発動時→出陣時→通常時→駐屯防衛時、区分順→項目順）へ統一','攻撃速度・射程は重要結果として別枠にも必ず表示'],checked:['部隊の射程が結果タブ重要結果と通常時状態変化率に表示される','結果サマリーは状態変化表示順に沿う','射程補正を％表示しない','JS構文チェック']},{version:'2.7.3.58',source:'2.7.3.57',target:'部隊編成結果/詳細タブのスクロールと重要結果表示',fixed:['結果タブと詳細タブに独立した縦スクロール領域を再設定し、開いた状態変化率や詳細情報を最後まで閲覧可能化','攻撃速度と部隊の射程を重要結果として結果タブ上部へ常時表示','結果サマリーの優先順を調整し、攻撃速度と部隊の射程が件数制限で落ちないようにする','状態変化率の表示名に部隊の攻撃速度/部隊の射程を追加'],checked:['結果/詳細タブのスクロールCSS追加','結果タブの重要結果HTML追加','サマリー優先順変更','JS構文チェック']},{version:'2.7.3.56',source:'2.7.3.55',target:'武将本人技能の装備兵科拡張と侍従条件',fixed:['本人技能本文の「技能を持つ武将は〇〇専用の装備品を装着可」を武器候補の許可兵科へ反映','装着可/装着できる/装備可能/装備できるの表記ゆれに対応','侍従による技能・装備由来技能では武器候補を拡張しない境界を固定','侍従配置条件の歩兵/騎兵など複数兵科を全件抽出して判定','武将詳細の基本情報に侍従条件を位置別に表示'],checked:['LR夏侯惇は騎兵に加えて雄猛により歩兵武器を許可','装備由来技能では武器候補を拡張しない','侍従条件「歩兵/騎兵」は歩兵・騎兵の候補を許可','武将詳細にUR以下/兵科/能力条件を表示']},{version:'2.7.3.55',source:'2.7.3.54',target:'軍馬/名馬の将星効果詳細表示',fixed:['名馬の将星効果をkey:value/unitの内部構造ではなく、機動+2%のような利用者向け表示へ整形','starEffectsの配列/object/summary/stats形式を共通の表示関数で正規化','検索テキストと詳細表示で同じ将星効果表示文字列を利用','将星効果がkey:value形式や[object Object]にならない回帰チェックを追加'],checked:['検証用名馬の将星効果が機動+2%/機動+4%/機動+6%として表示される','名馬詳細HTMLにkey:value/value:2/unit:%/[object Object]を含めない']},{version:'2.7.3.54',source:'2.7.3.53',target:'兵器・武装検索対象と名馬詳細表示',fixed:['兵器・武装カテゴリで派生検索インデックスを使う場合も、レベル別パラメータ・追加効果・raw詳細を検索対象に残す','最大耐久/対物/効果範囲/射程など、内容詳細に表示される項目をキーワード検索対象に追加','名馬/軍馬マスタ詳細のbaseStats・starEffects等のオブジェクト値を表示用に整形し、[object Object]を出さない','単体HTMLとZIP内HTMLの不一致を解消し、FILE_META/HADO_BUILD_INFOを2.7.3.54へ同期'],checked:['兵器:井闌の検索テキストに最大耐久/対物/効果範囲を含む','武装:穿透箭の検索テキストに最大耐久/対物を含む','名馬詳細HTMLに[object Object]を含めない','単体HTMLとZIP内HTMLのSHA一致']},{version:'2.7.3.53',source:'2.7.3.52',target:'戦法遅延表示経路と検証完了判定',fixed:['状態変化メタで確定したself/enemyを関連リンク表示生成に再適用し、derived-json由来の古いgroupKeyを信用しない','LR夏侯惇の戦法遅延を自部隊状態強化から除外し敵部隊状態弱化へ移動','検証のdiagnosticFailuresをcriticalFailuresへ昇格し、検出済み不具合をOK扱いしない','DOM ID検証で動的IDテンプレート文字列と軍馬編集遅延DOMを偽陽性にしない'],checked:['LR夏侯惇: 自部隊状態強化=豪昇/闘気、敵部隊状態弱化=戦法遅延','manual validationでdiagnosticFailuresがあればNG理由に出る','warhorseSaveStatusと+id+のDOM偽陽性抑止']},{version:'2.7.3.51',source:'2.7.3.50',target:'構文エラー修正と配布整合性',fixed:['文字列中の改行を\\nへ修正','正規表現境界の実バックスペース文字を\\bへ修正','単体HTMLとZIP内HTMLのSHA一致を再確保'],checks:['JS構文チェック','制御文字スキャン','ZIP実展開SHA一致']},{version:'2.7.3.50',source:'2.7.3.49',target:'状態変化対象部隊ゲートと検証/ログ基盤',fixed:['追加効果表・本文由来のtargetSideを表示分類に反映し、type由来分類でself/enemyを上書きしない','LR夏侯惇の戦法遅延を自部隊状態強化から除外し、敵部隊状態弱化へ分類','検証実行を段階分割し、進捗率表示とUI yieldを追加','Debug Log表示OFFでも内部ログバッファからログコピー可能化','Debug Panelは要約表示にし、巨大ログDOM残留を抑止'],checked:['LR夏侯惇: 戦法遅延は敵部隊状態弱化、豪昇/闘気は自部隊状態強化','LR張飛/LR田豊/LR典韋の既存回帰維持','検証実行ボタンがasync経路を使用','ログコピーがstate.showRawJsonに依存しない']},{version:'2.7.3.49',source:'2.7.3.48',target:'一覧の選定理由表示',fixed:['クイック検索の選定理由からhadou_parameter_summary_index.json等の内部JSONファイル名を非表示化','理由文生成時に内部ファイル名を表示用サマリーへ整形','検索判定・派生JSON利用・クイック検索結果件数は変更しない'],checked:['選定理由に.jsonファイル名を出さない静的回帰チェック','HADO-2.7.3.48のお気に入り切替0件落ち防止経路を維持','LR田豊の栄華混入防止境界を維持']},{version:'2.7.3.48',source:'2.7.3.47',target:'クイック検索中のお気に入り切替再描画',fixed:['お気に入り切替後に保存データ索引更新でquickOwner cache keyが変わっても、旧クイック検索結果を保持したまま非同期再検索する','toggleSavedNameからクイック検索再実行経路を呼び、renderSearchResultsだけで0件表示へ落とさない','pending中のfallback rowsはお気に入り更新時だけ使い、通常検索・カテゴリ切替の挙動は維持'],checked:['クイック検索中の一覧☆/★押下で即時0件表示に落ちない設計','通常検索のお気に入り切替経路は維持','LR田豊の栄華混入防止境界は維持']},{version:'2.7.3.47',source:'2.7.3.46',target:'関連リンク入力境界デグレ',fixed:['武将の関連技能を実技能欄だけに限定し、Raw全文・攻略コメント・おすすめ説明・相性説明から技能名を採用しない','派生JSON/索引に攻略コメント由来の技能名が残っていても、表示直前に実技能欄で再照合','LR田豊の攻略コメント「UR曹丕の技能『栄華』」混入を遮断','栄華由来の自部隊不利対策がLR田豊に出ない回帰テストを追加'],checked:['LR田豊: 技能リンクは剛風/賢略/慧断/石工/撃略のみ','LR田豊: 栄華と栄華由来の恐怖回避/攻撃速度低下回避/知力低下回避を除外','LR張飛: 攻略コメント由来の同討混入防止を維持','LR典韋/咬牙: 能力弱化効果括弧内分解を維持']},{version:'2.7.3.46',source:'2.7.3.45',target:'咬牙の自部隊不利対策解析',fixed:['能力弱化効果（攻撃/防御/戦法速度/戦法威力）を弱化効果解除ではなく個別の攻撃低下回避/防御低下回避/戦法速度低下回避/戦法威力低下回避として採用','強化解除を避ける文言を弱化効果解除へ誤分類しない','技能詳細関連リンクの診断記録でnowTime未定義によりbuild-errorになる不具合を修正'],preserved:['LR張飛の攻略コメント由来同討除外','守衛/鋼胆などの恐怖・畏怖回避','効果本文ホワイトリスト境界']},{version:'2.7.3.45',source:'2.7.3.44',target:'関連リンクの入力境界デグレ',fixed:['派生JSONに攻略コメント由来の関連が残っていても、武将/装備/技能/戦法の表示関連リンクは効果本文ホワイトリストで再判定','関連リンク入力対象外コメントをソースコメントで明文化','LR張飛で同討が敵部隊状態弱化に復活しない回帰チェックを追加'],checked:['LR張飛: 敵部隊状態弱化は萎縮のみを許容','LR張飛: 畏怖/恐怖は自部隊不利対策へ表示','関連リンク生成本体と対策名[技能]表示を維持']},{version:'2.7.3.44',source:'2.7.3.43',target:'関連リンクの対策文脈重複',fixed:['対策行のtargetを保持','自部隊不利対策/敵部隊有利対策として採用したtargetだけを通常状態変化グループから除外','関連リンク生成本体と派生JSON利用ルートは維持'],checked:['LR張飛の畏怖/恐怖重複抑止','関連リンク全体表示維持','JS構文','ZIP構成']},{version:'2.7.3.40',source:'2.7.3.38',target:'状態変化グループ選択',fixed:['カテゴリ未選択状態でも状態変化グループの選択値を保持','カテゴリ未選択時は検索を走らせず待機表示にする','カテゴリ選択後に保持中のグループフィルタを適用'],checked:['JS構文','ZIP構成','カテゴリ未選択時のグループ選択保持','カテゴリ選択後のフィルタ適用']},{version:'2.7.3.38',source:'2.7.3.37',target:'自部隊不利対策グループ検索',fixed:['グループ検索のpending 0件表示を同期索引生成で抑止','対策技能所有者を派生JSONだけでなくロード済み武将/装備データからも補完','自部隊不利対策すべてで武将カテゴリ0件になる不具合を再修正'],checked:['JS構文','ZIP構成','同期グループ検索ルート','技能所有者補完ルート'],remaining:[]},{version:'2.7.3.37',source:'2.7.3.36',target:'自部隊不利対策グループ検索',fixed:['不利対策グループ索引で、対策技能名を技能カテゴリだけでなく所有武将・装備へ展開','自部隊不利対策すべて選択時に武将カテゴリ0件になる不具合を修正','技能所有者展開はhadou_skill_owner_index.jsonを優先利用し、個別状態変化検索は維持'],checked:['JS構文','ZIP構成','自部隊不利対策グループの所有者展開実装','個別状態変化検索の既存処理維持']},{version:'2.7.3.36',source:'2.7.3.35',target:'状態変化グループ検索高速化',fixed:['状態変化グループ選択時に派生JSON由来のgroup owner indexを優先利用','検索画面と武将/装備選択ダイアログで同じ高速索引を利用','個別状態変化選択時の既存処理は維持','groupFilterCacheの診断ログを追加'],checked:['JS構文','ZIP構成','派生JSON同梱','グループ検索専用索引実装','フォールバック維持']},{version:'2.7.3.34',source:'2.7.3.32',target:'技能所有者派生JSONの正式利用',fixed:['hadou_skill_owner_index.json由来の所有者名を実データ存在確認後の正規名へ変換','技能詳細の関連リンクで派生JSON所有者を正式利用し、存在しない広告/関連記事名を除外','derivedSkillOwnerUsageをDiagnostic Snapshotへ追加し利用件数・除外件数を可視化'],preserved:['技能詳細本文末尾の所有者一覧除外','保存データ技能LvのLvなし表示','関連リンク派生JSON利用ルート','派生JSON欠損時フォールバック']},{version:'2.7.3.32',source:'2.7.3.31',target:'全データ表示のパラメータ検索テキスト高速化',fixed:['全データ表示時はhadou_parameter_summary_index.jsonから検索用パラメータテキストを優先生成','保存データ表示時は将星・技能Lv・装備段階反映のため従来計算を維持','derivedParameterSummaryUsageをDiagnostic Snapshotへ追加し派生JSON利用状況を可視化'],preserved:['保存データ技能LvのLvなし表示','関連リンク派生JSON利用ルート','スクロール位置保持','派生JSON欠損時フォールバック']},{version:'2.7.3.31',source:'2.7.3.30',target:'低デグレ領域の診断強化',fixed:['派生JSON4種のschemaVersion/dataSetId/sourceSha256整合性を診断ログで確認可能化','現在選択中武将の保存データ技能Lv解決結果をDiagnostic Snapshotへ出力','派生JSON正式利用前に不足メタ・件数不一致を警告として可視化'],preserved:['保存データ技能LvのLvなし表示','関連リンク派生JSON利用ルート','スクロール位置保持','検索カテゴリON時の高速化']},{version:'2.7.3.30',source:'2.7.3.29',target:'保存データ設定変更時のスクロール位置',fixed:['武将・装備の将星変更後に画面上部へ戻らないようスクロール位置を保存復元','詳細DOM差し替え時のscrollTop=0を保存データ設定変更時だけ抑止','装備段階・参軍Lvなど同系統の詳細再描画にも同じ復元処理を適用'],preserved:['保存データ技能LvのLvなし表示','関連リンク派生JSON利用ルート','検索カテゴリON時の高速化']},{version:'2.7.3.29',source:'2.7.3.28',target:'保存データ表示の武将技能Lv',fixed:['保存データ表示では将星未設定を0として扱う','LR/UR/SSRの将星解放前技能をLvなしにする','戦法技能タブで保存データの解決Lvに合わせた本文を表示'],preserved:['関連リンク派生JSON利用ルート','検索カテゴリON時の高速化','派生JSON欠損時フォールバック']},
  {version:'2.7.3.28',source:'2.7.3.27',target:'内容詳細の関連リンク生成高速化',fixed:['safeBuildRelatedLinksHtmlに派生JSON利用ルートを追加','関連リンクHTMLをitem単位でキャッシュ','detailProfileでrelatedLinks source/cacheHitを確認可能化'],preserved:['先頭詳細の自動表示','検索カテゴリON時の空キーワード高速化','派生JSON欠損時の従来計算フォールバック']},
  
  {version:'2.7.3.27',source:'2.7.3.26',target:'内容詳細描画のトラブルシュート',fixed:['renderDetail内の主要工程をdetailProfileとして計測','関連リンク生成・タブHTML生成・DOM反映・イベント設定・linkify/highlight・Debug Panel・レスポンシブ処理を分解','Category Profile HistoryへdetailProfileを同梱'],preserved:['カテゴリON直後の先頭詳細自動表示','空キーワード時の検索テキスト生成スキップ','派生JSON読込診断','表示中タブのみ生成']},
  {version:'2.7.3.26',source:'2.7.3.25',target:'カテゴリON時の検索・内容詳細初期表示高速化',fixed:['キーワード未指定時は検索テキスト生成を行わずカテゴリ全件をそのまま結果化','検索メトリック抽出は検索条件がある場合のみ実行','内容詳細はPC/スマホとも表示中タブのみ生成し、未表示タブの重いHTML生成を遅延化'],preserved:['カテゴリON直後の先頭詳細自動表示','派生JSON欠損時の従来計算フォールバック','派生JSON読込診断','検索カテゴリ初期全OFF']},
  {version:'2.7.3.24',source:'2.7.3.23',target:'派生JSON読込状態の診断表示',fixed:['派生JSON4種のloaded/missing/empty/fallback状態をDiagnostic Snapshotへ出力','各派生JSONのfile/itemCount/schemaVersion/dataSetIdを確認可能化','Debug LogへderivedJson:diagnosticを出力'],preserved:['派生JSONがない場合は従来計算へフォールバック','検索カテゴリ初期全OFF','初期検索結果の全件描画なし']},
  {version:'2.7.3.23',source:'2.7.3.22',target:'派生JSON標準同梱と互換フォールバック基盤',fixed:['派生JSON4種を任意読込対象に追加','派生JSONの読込状態をstate.derivedDataに保持','派生JSONが存在しない場合は従来計算へフォールバックする前提を維持','ZIP標準構成に派生JSONプレースホルダを同梱'],preserved:['初期検索結果を全件描画しない方針','検索カテゴリ初期全OFF','No.1〜8185の回帰チェック定義','既存JSON互換']},
  {version:'2.7.3.22',source:'2.7.3.21',target:'ロード直後の検索カテゴリ初期状態',fixed:['activeCategories.generalsの初期値をfalseに変更','startup時に武将カテゴリをtrueへ強制する処理を削除','ロード完了後もカテゴリ未選択の案内表示を維持'],preserved:['初期検索結果を全件描画しない方針','検証実行ボタン','No.1〜8185の回帰チェック定義','最新版JSON同梱構成']},
  {version:'2.7.3.21',source:'2.7.3.20',target:'ロード速度改善の第1段階',fixed:['通常ロード時にrunStabilitySelfCheck/runEnhancedValidationSelfCheckを実行しない','検証系処理は検証実行ボタンから明示実行する','起動直後は検索結果を全件描画せず案内表示にする','デバッグログOFF時はconsole/debugLinesへ記録しない'],preserved:['検証実行ボタン','No.1〜8185の回帰チェック定義','派生JSONなしでも従来計算する互換方針','既存JSON構成']},
  {version:'2.7.3.20',source:'2.7.3.19実関数全件チェック',target:'runStatusEffectLinkRegressionSmoke negativeResultsでenemyAbilityDebuffとして残存した49件',fixed:['補正値説明を敵部隊能力低下として採用しない','一定以上などの条件文を敵部隊能力低下として採用しない','自部隊/味方への能力上昇を敵部隊能力低下として採用しない','敵部隊の能力上昇を解除/取り除く説明を敵部隊能力低下として採用しない','低下ではなく上昇解除という除外説明を敵部隊能力低下として採用しない'],preserved:['No.1〜8185のnegativeCases','本物の敵部隊能力低下positiveケース','自部隊不利対策分類','ZIP内JSON構成']},
  {version:'2.7.3.19',source:'2.7.3.18追加シミュレーション',target:'関連リンクの敵部隊能力低下・自部隊不利対策の残り1185ケース（No.7001〜8185）',fixed:['能力参照・条件・比較・対象決定を能力低下として誤採用しない','加算/上乗せ/味方強化/敵強化解除/無効化を敵部隊能力低下として誤採用しない','低下非発生・耐性説明系を敵部隊能力低下として誤採用しない','既存7000件を含め、No.8185までの抑止対象を回帰チェックに含める'],preserved:['2.7.3.18までの7000改善','本物の攻撃/防御/知力/命中/被ダメージ上昇','能力弱化効果を避ける等の自部隊不利対策','追加効果表の対象側判定']},
  {version:'2.7.3.18',source:'2.7.3.17追加シミュレーション',target:'関連リンクの敵部隊能力低下・自部隊不利対策の追加2000ケース（No.5001〜7000）',fixed:['能力参照・条件・比較・対象決定を能力低下として誤採用しない','加算/上乗せ/味方強化/敵強化解除/無効化を敵部隊能力低下として誤採用しない','低下非発生・耐性説明系を敵部隊能力低下として誤採用しない','既存5000件を含め、No.7000までの抑止対象を回帰チェックに含める'],preserved:['2.7.3.17までの5000改善','本物の攻撃/防御/知力/命中/被ダメージ上昇','能力弱化効果を避ける等の自部隊不利対策','追加効果表の対象側判定']},
  {version:'2.7.3.16',source:'2.7.3.15追加シミュレーション',target:'関連リンクの敵部隊能力低下・自部隊不利対策の追加1000ケース（No.2501〜3500）',fixed:['能力参照・条件・比較・対象決定を能力低下として誤採用しない','加算/上乗せ/味方強化/敵強化解除/無効化を敵部隊能力低下として誤採用しない','低下非発生・耐性説明系を敵部隊能力低下として誤採用しない','既存2500件を含め、No.3500までの抑止対象を回帰チェックに含める'],preserved:['2.7.3.15までの2500改善','本物の攻撃/防御/知力/命中/被ダメージ上昇','能力弱化効果を避ける等の自部隊不利対策','追加効果表の対象側判定']},
  {version:'2.7.3.15',source:'2.7.3.14追加シミュレーション',target:'関連リンクの敵部隊能力低下・自部隊不利対策の追加500ケース（No.2001〜2500）',fixed:['能力比較・参照・判定・対象決定を能力低下として誤採用しない','加算/上乗せ/味方付与/敵強化解除/無効化を敵部隊能力低下として誤採用しない','既存2000件を含め、No.2500までの抑止対象を回帰チェックに含める'],preserved:['2.7.3.14までの2000改善','本物の攻撃/防御/知力/命中/被ダメージ上昇','能力弱化効果（攻撃）を避ける等の自部隊不利対策','追加効果表の対象側判定']},
  {version:'2.7.3.14',source:'2.7.3.13追加シミュレーション',target:'関連リンクの敵部隊能力低下・自部隊不利対策の追加500ケース（No.1501〜2000）',fixed:['能力比較・参照・判定・対象決定を能力低下として誤採用しない','加算/上乗せ/味方付与/敵強化解除/無効化を敵部隊能力低下として誤採用しない','既存1500件を含め、No.2000までの抑止対象を回帰チェックに含める'],preserved:['2.7.3.13までの1500改善','本物の攻撃/防御/知力/命中/被ダメージ上昇','能力弱化効果（攻撃）を避ける等の自部隊不利対策','追加効果表の対象側判定']},
  {version:'2.7.3.13',source:'2.7.3.12追加シミュレーション',target:'関連リンクの敵部隊能力低下・自部隊不利対策の追加500ケース（No.1001〜1500）',fixed:['能力比較・参照・判定・対象決定を能力低下として誤採用しない','加算/上乗せ/味方付与/敵強化解除/無効化を敵部隊能力低下として誤採用しない','既存1000件を含め、No.1500までの抑止対象を回帰チェックに含める'],preserved:['2.7.3.12までの1000改善','本物の攻撃/防御/知力/命中/被ダメージ上昇','能力弱化効果（攻撃）を避ける等の自部隊不利対策','追加効果表の対象側判定']},
  {version:'2.7.3.11',source:'2.7.3.10追加シミュレーション',target:'関連リンクの敵部隊能力低下・自部隊不利対策の追加320ケース（No.181〜500）',fixed:['能力参照・条件・比較・算出・選択・性能参照を能力低下として誤採用しない','加算/上乗せ/味方付与/敵強化解除を敵部隊能力低下として誤採用しない','既存180件を含め、No.500までの抑止対象を回帰チェックに含める'],preserved:['2.7.3.10までの180改善','本物の攻撃/防御/知力/命中/被ダメージ上昇','能力弱化効果（攻撃）を避ける等の自部隊不利対策','追加効果表の対象側判定']},
  {version:'2.7.3.10',source:'2.7.3.9追加シミュレーション',target:'関連リンクの敵部隊能力低下・自部隊不利対策の追加100ケース',fixed:['能力説明・参照・条件・比較・非発生・解除/無効・攻撃文を能力低下として誤採用しない','前回までの改善80件を回帰チェックに含める','本物の敵部隊能力低下と自部隊不利対策は維持'],preserved:['2.7.3.7の10改善','2.7.3.8の20改善','2.7.3.9の50改善','本物の攻撃/防御/知力/命中/被ダメージ上昇','能力弱化効果（攻撃）を避ける等の自部隊不利対策']},
  {version:'2.7.3.9',source:'2.7.3.8追加シミュレーション',target:'関連リンクの敵部隊能力低下・自部隊不利対策の追加50ケース',fixed:['能力値を参照条件として使う文を能力低下にしない','自部隊の低下解除/無効/非発生を敵部隊能力低下へ入れない','攻撃/防御/知力/兵力/射程/命中/会心/戦法速度などの説明文を誤判定しない','本物の敵部隊能力低下と自部隊不利対策は維持'],preserved:['2.7.3.7の10改善','2.7.3.8の20改善','本物の攻撃/防御/知力/命中/被ダメージ上昇','能力弱化効果（攻撃）を避ける等の自部隊不利対策']},
  {version:'2.7.3.8',source:'2.7.3.7追加シミュレーション',target:'関連リンクの敵部隊能力低下の中優先度誤爆追加20ケース',fixed:['攻撃無効/攻撃を受けた際/攻撃の威力など防御・説明文を攻撃低下にしない','部隊の攻撃/防御/知力/機動/戦法速度/会心発生/命中の自部隊強化を敵部隊低下へ逆変換しない','知力系統の攻撃・防御無視攻撃・通常攻撃威力上昇等を能力低下として扱わない','被ダメージ上昇など本物の敵部隊低下は維持'],preserved:['2.7.3.7の10改善','本物の攻撃/防御/知力/命中低下','能力弱化効果（攻撃）を避ける等の自部隊不利対策']},
  {version:'2.7.3.6',source:'2.7.3.5自己シミュレーション',target:'即時戦法/戦法待ち時間短縮の関連リンク回帰チェック失敗',fixed:['戦法ゲージ系の別表記として戦法待ち時間/即時戦法/戦法短縮を認識','戦法待ち時間を短縮/即時戦法を自部隊能力強化の戦法短縮として採用'],preserved:['LR張良の知力の低い敵部隊は知力低下ではない判定','能力弱化効果（攻撃）を避ける等の自部隊不利対策','追加効果表の攻撃速度変化/戦法威力変化など対象側で読む既存判定'],verified:['張良_知力の低い敵部隊は知力低下ではない','張良_低知力部隊は知力低下ではない','即時戦法は戦法短縮として selfAbilityBuff','本物の敵知力低下は enemyAbilityDebuff']},
  {version:'2.7.3.5',source:'2.7.3.4実機ログ指摘',target:'LR張良の敵部隊能力低下:知力低下誤表示',fixed:['比較表現に続く弱化効果を知力低下の明示方向として扱わない','知力の低い敵部隊/低知力部隊の回帰条件を再確認'],preserved:['能力弱化効果（攻撃）を避ける等の自部隊不利対策','追加効果表の攻撃速度変化/戦法威力変化など対象側で読む既存判定'],deferred:['同一本文に本物の低下効果が混在する要確認候補','中/低優先度候補']}
];

function safeCloneForDebug(value){try{return JSON.parse(JSON.stringify(value));}catch{return value;}}
function getCategoryUiState(){const out={};document.querySelectorAll('#categoryBar button[data-category]').forEach(btn=>{const key=btn.getAttribute('data-category');out[key]={toggleActive:btn.classList.contains('toggle-active'),text:norm(btn.textContent||'')};});return out;}
function updateCategoryDiagnosticSnapshot(context=''){state.diagnostics.categories={context,timestamp:debugTimestamp(),state:safeCloneForDebug(state.activeCategories),ui:getCategoryUiState()};}
function updateSearchDiagnosticSnapshot(payload={}){state.diagnostics.search={timestamp:debugTimestamp(),...safeCloneForDebug(payload)};}
function updateStartupDiagnosticSnapshot(payload={}){state.diagnostics.startup={timestamp:debugTimestamp(),...safeCloneForDebug(payload)};}
function updateSkillBuildDiagnosticSnapshot(payload={}){state.diagnostics.skillBuild={timestamp:debugTimestamp(),...safeCloneForDebug(payload)};}
function debugTimestamp(){const d=new Date();const pad=(n,w=2)=>String(n).padStart(w,'0');return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(),3)}`;}
function debugStringify(value){if(typeof value==='string')return value;try{return JSON.stringify(value);}catch{return String(value);}}
function pushDebugLine(line){debugLines.push(line);if(debugLines.length>MAX_DEBUG_LINES)debugLines.splice(0,debugLines.length-MAX_DEBUG_LINES);}
function pushStartupDebugLine(line){startupDebugLines.push(line);}
function isDebugLogEnabled(){try{return !!(typeof state!=='undefined'&&state.showRawJson);}catch{return false;}}
function debugLog(...args){if(!isDebugLogEnabled())return;const line=`${debugTimestamp()} ${LOAD_DEBUG_PREFIX} ${args.map(debugStringify).join(' ')}`;console.log(line);pushDebugLine(line);}
function debugStartup(label,payload){if(!isDebugLogEnabled())return;const line=`${debugTimestamp()} ${LOAD_DEBUG_PREFIX} [startup] ${label}${typeof payload==='undefined'?'':' '+debugStringify(payload)}`;console.log(line);pushStartupDebugLine(line);pushDebugLine(line);}
function debugTimeStart(label){if(!isDebugLogEnabled())return;debugTimerMap.set(label,performance.now());}
function debugTimeEnd(label){if(!isDebugLogEnabled())return;const start=debugTimerMap.get(label);const elapsed=typeof start==='number'?(performance.now()-start):NaN;debugTimerMap.delete(label);const line=`${debugTimestamp()} ${LOAD_DEBUG_PREFIX} ${label}: ${Number.isFinite(elapsed)?elapsed.toFixed(1):'N/A'}ms`;console.log(line);pushDebugLine(line);}
function debugCount(label){if(!isDebugLogEnabled())return;console.count(label);const line=`${debugTimestamp()} ${LOAD_DEBUG_PREFIX} ${label} invoked`;console.log(line);pushDebugLine(line);}

function unwrapHadouItems(raw){
  if(Array.isArray(raw))return raw;
  if(raw&&Array.isArray(raw.items))return raw.items;
  return [];
}
function getHadouMeta(raw){
  return raw&&typeof raw==='object'&&!Array.isArray(raw)?(raw.meta||{}):{};
}
function safeRunStabilitySelfCheck(context='manual'){
  try{return runStabilitySelfCheck(context);}
  catch(err){const result={version:HADO_BUILD_INFO.version,context,timestamp:debugTimestamp(),ok:false,error:String(err?.message||err)};try{state.diagnostics.stability=result;debugLog('stability:self-check-error',result);}catch{}return result;}
}
function validateSaveDataStability(){const data=state.saveData||{};const saves=Array.isArray(data.saves)?data.saves:[];const ids=new Set();const problems=[];saves.forEach((save,idx)=>{if(!save||typeof save!=='object')problems.push(`save[${idx}] is not object`);if(!norm(save?.id||''))problems.push(`save[${idx}] id missing`);if(ids.has(save?.id))problems.push(`save id duplicated: ${save.id}`);if(save?.id)ids.add(save.id);if(!Array.isArray(save?.generals))problems.push(`save[${idx}] generals not array`);if(!Array.isArray(save?.equipments))problems.push(`save[${idx}] equipments not array`);});if(data.currentSaveId&&!ids.has(data.currentSaveId))problems.push('currentSaveId does not exist in saves');return {ok:problems.length===0,saveCount:saves.length,currentSaveId:data.currentSaveId||'',searchHistoryCount:Array.isArray(state.searchHistory)?state.searchHistory.length:0,problems};}
function validateFormationDataStability(){const formations=Array.isArray(state.formations)?state.formations:[];const ids=new Set();const problems=[];const extensionSummary=[];formations.forEach((f,idx)=>{if(!f||typeof f!=='object'){problems.push(`formation[${idx}] is not object`);return;}if(!norm(f.id||''))problems.push(`formation[${idx}] id missing`);if(ids.has(f.id))problems.push(`formation id duplicated: ${f.id}`);if(f.id)ids.add(f.id);if(!f.slots||typeof f.slots!=='object')problems.push(`formation[${idx}] slots missing`);(Array.isArray(typeof FORMATION_SLOT_SPECS!=='undefined'?FORMATION_SLOT_SPECS:[])?FORMATION_SLOT_SPECS:[]).forEach(spec=>{const slot=f.slots?.[spec.key];if(!slot)problems.push(`${f.name||f.id}:${spec.key} slot missing`);else{if(!slot.equipments||typeof slot.equipments!=='object')problems.push(`${f.name||f.id}:${spec.key} equipments missing`);(Array.isArray(typeof EQUIP_SLOT_SPECS!=='undefined'?EQUIP_SLOT_SPECS:[])?EQUIP_SLOT_SPECS:[]).forEach(eq=>{if(slot.equipments&&!(eq.key in slot.equipments))problems.push(`${f.name||f.id}:${spec.key}:${eq.key} missing`);});}});const siege=sanitizeFormationSiegeWeaponSelection(f.siegeWeapon||{});const arm=sanitizeFormationEthnicArmamentSelection(f.ethnicArmament||{});if(siege.name&&!findItemByDisplayName('siegeWeapons',siege.name))problems.push(`${f.name||f.id}: siegeWeapon not found: ${siege.name}`);if(arm.name&&!findItemByDisplayName('ethnicArmaments',arm.name))problems.push(`${f.name||f.id}: ethnicArmament not found: ${arm.name}`);if(siege.name&&(siege.level<1||siege.level>getFormationExtensionMaxLevel('siegeWeapon',siege.name)))problems.push(`${f.name||f.id}: siegeWeapon level out of range`);if(arm.name&&(arm.level<1||arm.level>getFormationExtensionMaxLevel('ethnicArmament',arm.name)))problems.push(`${f.name||f.id}: ethnicArmament level out of range`);extensionSummary.push({formation:f.name||f.id,formationName:normalizeFormationMasterName(f.formationName||'基本'),deploymentType:normalizeFormationDeploymentType(f.deploymentType||'normal'),siegeWeapon:siege,ethnicArmament:arm});});if(state.currentFormationId&&!ids.has(state.currentFormationId))problems.push('currentFormationId does not exist in formations');return {ok:problems.length===0,formationCount:formations.length,currentFormationId:state.currentFormationId||'',extensionSummary:extensionSummary.slice(0,20),problems:problems.slice(0,30)};}
function collectUiSnapshot(context=''){
  const mobile=isResponsiveMobileMode();
  const formationTab=document.body.classList.contains('formation-tab');
  const mobileHistoryPanel=els.mobileSearchHistorySelect?els.mobileSearchHistorySelect.closest('.mobile-search-history-panel'):null;
  const mobileHistoryDisplay=mobileHistoryPanel?getComputedStyle(mobileHistoryPanel).display:'';
  const resultSelectCount=els.resultSelect?els.resultSelect.options.length:0;
  const detailTabs=els.detail?[...els.detail.querySelectorAll('.detail-tab-btn')].map(b=>norm(b.textContent)):[];
  const detailContent=els.detail?els.detail.querySelector('.detail-tab-content'):null;
  const detailTitleText=norm(els.detail?.querySelector?.('.title-row .section-title')?.textContent||'');
  const detailText=norm(els.detail?els.detail.textContent:'');
  const detailDataset=els.detail?{category:els.detail.dataset.detailCategory||'',name:els.detail.dataset.detailName||'',label:els.detail.dataset.detailLabel||''}:{};
  const skillDetailCardExists=!!(els.detail&&[...els.detail.querySelectorAll('.general-card-header')].find(v=>norm(v.textContent||'')==='技能説明'));
  const skillDetailDomOk=detailDataset.category!=='skills'||((detailContent?.getAttribute('data-active-tab')||'')==='skillDetail'&&skillDetailCardExists&&detailText.length>0);
  const hasGeneralAbilityTable=!!(els.detail&&els.detail.querySelector('.general-ability-scroll table.generic-table'));
  const hasCurrentAbilityInput=!!(els.detail&&els.detail.querySelector('.general-current-ability-input'));
  const debugCopyNearToggle=!!(els.copyDebugLogBtn&&els.copyDebugLogBtn.closest('.debug-log-top-actions'));
  const formationMobileControls=!!(els.formationRoot&&els.formationRoot.querySelector('.formation-mobile-actions'));
  const formationLayoutRendered=!!(els.formationRoot&&els.formationRoot.querySelector('.formation-layout'));
  const formationRootTextLength=norm(els.formationRoot?els.formationRoot.textContent:'').length;
  const paramSection=els.formationRoot?els.formationRoot.querySelector('.formation-param-section'):null;
  const skillSection=els.formationRoot?els.formationRoot.querySelector('.formation-skill-section'):null;
  const paramBody=els.formationRoot?els.formationRoot.querySelector('.formation-param-section .formation-mobile-summary-body'):null;
  const skillBody=els.formationRoot?els.formationRoot.querySelector('.formation-skill-section .formation-mobile-summary-body'):null;
  const formationParamSectionOpen=!formationTab||!!(paramSection&&paramSection.open);
  const formationSkillSectionOpen=!formationTab||!!(skillSection&&skillSection.open);
  const formationParamBodyPresent=!formationTab||!!(paramBody&&norm(paramBody.textContent).length>0);
  const formationSkillBodyPresent=!formationTab||!!(skillBody&&norm(skillBody.textContent).length>0);
  // BUGFIX[HADO-2.4.5.0-VALIDATION]: PC/スマホともユーザーがdetailsを閉じた状態は正常操作として扱う。
  // Critical判定はDOMと内容の存在までに限定し、open状態は診断情報に留める。
  const formationRequiredSectionsVisible=!formationTab||(formationParamBodyPresent&&formationSkillBodyPresent);
  const formationContentRendered=!formationTab||(formationLayoutRendered&&formationRootTextLength>0&&formationRequiredSectionsVisible);
  return {context,timestamp:debugTimestamp(),mobile,formationTab,mobileFormationHistoryHidden:!(mobile&&formationTab)||mobileHistoryDisplay==='none',resultSelectOptionCount:resultSelectCount,detailDataset,detailTitleText,detailActiveTab:detailContent?detailContent.getAttribute('data-active-tab')||'':'',detailHtmlLength:els.detail?String(els.detail.innerHTML||'').length:0,detailTextLength:detailText.length,detailTextSample:detailText.slice(0,160),detailTabs,skillDetailCardExists,skillDetailDomOk,hasGeneralAbilityTable,hasCurrentAbilityInput,debugCopyButtonNearToggle:debugCopyNearToggle,formationMobileControls,formationLayoutRendered,formationRootTextLength,formationParamSectionOpen,formationSkillSectionOpen,formationParamBodyPresent,formationSkillBodyPresent,formationRequiredSectionsVisible,formationContentRendered};
}
function runStabilitySelfCheck(context='manual'){try{const save=validateSaveDataStability();const formation=validateFormationDataStability();const ui=collectUiSnapshot(context);const result={version:HADO_BUILD_INFO.version,context,timestamp:debugTimestamp(),saveData:save,formationData:formation,uiSnapshot:ui,ok:save.ok&&formation.ok&&ui.mobileFormationHistoryHidden&&ui.formationContentRendered};state.diagnostics.stability=result;state.diagnostics.uiSnapshot=ui;debugLog('stability:self-check',result);if(!result.ok)console.warn('[hado-debug] stability self check warning',result);return result;}catch(err){const result={version:HADO_BUILD_INFO.version,context,timestamp:debugTimestamp(),ok:false,error:String(err?.message||err)};try{state.diagnostics.stability=result;debugLog('stability:self-check-error',result);}catch{}return result;}}

function buildDiagnosticSnapshotForLog(){
  return {startup:state.diagnostics.startup||{},skillBuild:state.diagnostics.skillBuild||{},advisorSkills:state.diagnostics.advisorSkills||{},derivedJson:state.diagnostics.derivedJson||{},derivedJsonIntegrity:state.diagnostics.derivedJsonIntegrity||{},typeSearchFoundation:state.diagnostics.typeSearchFoundation||{},typeSearchReleaseReadiness:state.diagnostics.typeSearchReleaseReadiness||{},typeSearch:state.diagnostics.typeSearch||{},typeSearchCache:state.diagnostics.typeSearchCache||{},typeSearchCacheInvalidation:state.diagnostics.typeSearchCacheInvalidation||{},typeSearchHistoryRestore:state.diagnostics.typeSearchHistoryRestore||{},derivedParameterSummaryUsage:state.diagnostics.derivedParameterSummaryUsage||{},savedSkillLevelResolution:state.diagnostics.savedSkillLevelResolution||{},categories:state.diagnostics.categories||{},search:state.diagnostics.search||{},responsive:state.diagnostics.responsive||{},formation:state.diagnostics.formation||{},detailProfile:state.diagnostics.detailProfile||{},detailTabBuildProfile:state.diagnostics.detailTabBuildProfile||{},slowContentDetailProfiles:state.diagnostics.slowContentDetailProfiles||[],lastSlowContentDetailProfile:state.diagnostics.lastSlowContentDetailProfile||{},detailIdentity:state.diagnostics.detailIdentity||{},skillDetailDom:state.diagnostics.skillDetailDom||{},relatedLinks:state.diagnostics.relatedLinks||{},relatedLinksError:state.diagnostics.relatedLinksError||{},relatedLinkAnnotationLeakAudit:state.diagnostics.relatedLinkAnnotationLeakAudit||{},statusEffectMeta:state.diagnostics.statusEffectMeta||{},selfResistanceRelatedLinks:state.diagnostics.selfResistanceRelatedLinks||{},effectCountermeasureIndex:state.diagnostics.effectCountermeasureIndex||{},regression:state.diagnostics.regression||{},validation:state.diagnostics.validation||{},stability:state.diagnostics.stability||{},uiSnapshot:state.diagnostics.uiSnapshot||{}};
}
function buildDebugPanelText(item,extraText='',options={}){
  // FIX[HADO-2.7.3.50-DEBUG-LOG-COPY-INDEPENDENT]: ログコピーはDebug Log表示状態に依存させない。DOM表示のためだけに巨大ログを描画しない。
  const opts=options&&typeof options==='object'?options:{};
  if(!opts.skipStability)safeRunStabilitySelfCheck(opts.context||'debug-log:build');
  const sections=[];
  sections.push('=== File Meta ===');sections.push(JSON.stringify(FILE_META,null,2));sections.push('');
  sections.push('=== Build Info ===');sections.push(JSON.stringify(HADO_BUILD_INFO,null,2));sections.push('');
  sections.push('=== Diagnostic Snapshot ===');sections.push(JSON.stringify(buildDiagnosticSnapshotForLog(),null,2));sections.push('');
  sections.push('=== Startup Diagnostic Log (fixed) ===');sections.push(startupDebugLines.join('\n'));sections.push('');
  sections.push('=== Console Debug Log ===');sections.push(debugLines.join('\n'));sections.push('');
  sections.push('=== Category Profile History ===');sections.push(JSON.stringify(state.categoryProfileHistory||[],null,2));
  if(item&&opts.includeRaw!==false){sections.push('');sections.push('=== Raw JSON ===');sections.push(JSON.stringify(item?.raw||item||{},null,2));}
  if(extraText){sections.push('');sections.push('=== Detail Debug ===');sections.push(extraText);}
  return sections.join('\n');
}
function buildDebugPanelSummaryText(item,extraText=''){
  const snapshot=buildDiagnosticSnapshotForLog();
  const lines=[];
  lines.push('=== Debug Log Summary ===');
  lines.push(`version: ${HADO_BUILD_INFO.version}`);
  lines.push(`file: ${FILE_META.fileName}`);
  lines.push(`validation: ${snapshot.validation?.ok===true?'OK':snapshot.validation?.ok===false?'NG':'未実行'} / warnings=${snapshot.validation?.warningCount??'-'} / info=${snapshot.validation?.infoCount??'-'}`);
  lines.push(`search results: ${snapshot.search?.results??'-'}`);
  lines.push(`relatedLinks: ${snapshot.relatedLinks?.name||'-'} / groups=${snapshot.relatedLinks?.groupCount??'-'}`);
  lines.push(`typeSearch readiness: ${snapshot.typeSearchReleaseReadiness?.ok===true?'OK':snapshot.typeSearchReleaseReadiness?.ok===false?'NG':'未実行'} / presets=${snapshot.typeSearchReleaseReadiness?.presetCount??'-'} / unresolved=${snapshot.typeSearchReleaseReadiness?.unresolvedConditionCount??'-'}`);
  lines.push('');
  lines.push('詳細ログは「ログコピー」から取得できます。Debug Log表示は要約のみ表示します。');
  lines.push('');
  lines.push('=== Recent Console Debug Log ===');
  lines.push(debugLines.slice(-60).join('\n'));
  if(extraText){lines.push('');lines.push('=== Detail Debug Summary ===');lines.push(String(extraText).slice(0,2000));}
  return lines.join('\n');
}
function cancelDebugPanelRender(){const id=state._debugPanelRenderId;if(id){if(state._debugPanelRenderMode==='idle'&&window.cancelIdleCallback)cancelIdleCallback(id);else clearTimeout(id);}state._debugPanelRenderId=0;state._debugPanelRenderMode='';}
function setDebugCopyButtonEnabled(enabled){if(!els.copyDebugLogBtn)return;els.copyDebugLogBtn.disabled=!enabled;els.copyDebugLogBtn.onclick=handleCopyDebugLog;}
function scheduleDebugPanelRender(callback){if(window.requestIdleCallback){state._debugPanelRenderMode='idle';state._debugPanelRenderId=requestIdleCallback(callback,{timeout:700});}else{state._debugPanelRenderMode='timeout';state._debugPanelRenderId=setTimeout(callback,0);}}
function renderDebugPanel(item,extraText=''){
if(!els.debugPanel||!els.debugPanelContent)return;
state._debugPanelItem=item||null;
state._debugPanelExtraText=extraText||'';
cancelDebugPanelRender();
document.body.classList.toggle('debug-panel-visible',!!state.showRawJson);
if(typeof schedulePcSearchViewportLayout==='function')schedulePcSearchViewportLayout('debugPanel:visibility');
if(!state.showRawJson){els.debugPanel.style.display='none';els.debugPanelContent.textContent='';setDebugCopyButtonEnabled(true);return;}
els.debugPanel.style.display='';setDebugCopyButtonEnabled(false);
els.debugPanelContent.textContent='Debug Log生成中...';
const seq=(state._debugPanelRenderSeq||0)+1;state._debugPanelRenderSeq=seq;
scheduleDebugPanelRender(()=>{
state._debugPanelRenderId=0;state._debugPanelRenderMode='';
if(seq!==state._debugPanelRenderSeq||!state.showRawJson)return;
const t0=performance.now();
const text=buildDebugPanelSummaryText(state._debugPanelItem,state._debugPanelExtraText);
els.debugPanelContent.textContent=text||'';
setDebugCopyButtonEnabled(!!text);
debugLog('debugPanel:async-render',{enabled:!!state.showRawJson,length:text?text.length:0,ms:Number((performance.now()-t0).toFixed(1))});
});
}
function getResponsiveDiagnosticSnapshot(context='') {
const pcPanel=els.searchHistory?els.searchHistory.closest('.pc-search-history-panel'):null;
const mobilePanel=els.mobileSearchHistorySelect?els.mobileSearchHistorySelect.closest('.mobile-search-history-panel'):null;
const pcPanelStyle=pcPanel?getComputedStyle(pcPanel):null;
const mobilePanelStyle=mobilePanel?getComputedStyle(mobilePanel):null;
const listStyle=els.searchHistory?getComputedStyle(els.searchHistory):null;
const mobileHistorySelectStyle=els.mobileSearchHistorySelect?getComputedStyle(els.mobileSearchHistorySelect):null;
const resultsStyle=els.results?getComputedStyle(els.results):null;
const resultSelectWrap=els.resultSelect?els.resultSelect.closest('.result-select-wrap'):null;
const resultSelectWrapStyle=resultSelectWrap?getComputedStyle(resultSelectWrap):null;
return {context,timestamp:debugTimestamp(),innerWidth:window.innerWidth,innerHeight:window.innerHeight,devicePixelRatio:window.devicePixelRatio||1,matchMax980:!!(window.matchMedia&&window.matchMedia('(max-width:980px)').matches),matchCoarse:!!(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches),searchHistoryCount:Array.isArray(state.searchHistory)?state.searchHistory.length:0,pcHistoryPanelDisplay:pcPanelStyle?.display||'',pcHistoryPanelPosition:pcPanelStyle?.position||'',mobileHistoryPanelDisplay:mobilePanelStyle?.display||'',mobileHistoryPanelPosition:mobilePanelStyle?.position||'',mobileHistoryPanelTop:mobilePanel?Math.round(mobilePanel.getBoundingClientRect().top):null,historyListDisplay:listStyle?.display||'',mobileHistorySelectDisplay:mobileHistorySelectStyle?.display||'',mobileHistorySelectOptionCount:els.mobileSearchHistorySelect?els.mobileSearchHistorySelect.options.length:0,resultsDisplay:resultsStyle?.display||'',resultSelectWrapDisplay:resultSelectWrapStyle?.display||'',resultSelectOptionCount:els.resultSelect?els.resultSelect.options.length:0,...getHorizontalOverflowDiagnostics(context),domOrder:getElementOrderInfo()};
}
function debugResponsiveSnapshot(context='') {
const snapshot=getResponsiveDiagnosticSnapshot(context);
state.diagnostics.responsive=snapshot;
debugLog('responsive snapshot',snapshot);
return snapshot;
}
function isResponsiveMobileMode(){
return !!(window.matchMedia&&((window.matchMedia('(max-width:980px)').matches)||(window.matchMedia('(pointer:coarse)').matches)));
}
function getElementOrderInfo(){
const app=document.querySelector('.app');
if(!app)return [];
return [...app.children].map((el,idx)=>({idx,tag:el.tagName,id:el.id||'',className:el.className||'',text:norm((el.textContent||'').slice(0,40))}));
}
function getHorizontalOverflowDiagnostics(context='') {
const doc=document.documentElement;
const body=document.body;
const viewport=window.innerWidth||doc.clientWidth||0;
const clientWidth=doc.clientWidth||viewport;
const docScroll=doc.scrollWidth||0;
const bodyScroll=body?.scrollWidth||0;
const selectors=['.app','.layout','.panel','#detail','.detail','#detail .general-card','#detail .general-card-body','#detail table','#detail th','#detail td','#detail .parameter-block','#detail .parameter-main','#detail .raw','#debugPanelContent'];
const seen=new Set();
const samples=[];
selectors.forEach(sel=>{
  document.querySelectorAll(sel).forEach(el=>{
    if(seen.has(el)||!el.getBoundingClientRect)return;
    seen.add(el);
    const rect=el.getBoundingClientRect();
    const overflowRight=Math.ceil(rect.right-viewport);
    const scrollOverflow=Math.ceil((el.scrollWidth||0)-(el.clientWidth||0));
    if(overflowRight>1||scrollOverflow>1){
      samples.push({
        tag:el.tagName,
        id:el.id||'',
        className:String(el.className||'').slice(0,80),
        width:Math.round(rect.width),
        right:Math.round(rect.right),
        clientWidth:el.clientWidth||0,
        scrollWidth:el.scrollWidth||0,
        overflowRight,
        scrollOverflow,
        text:norm((el.textContent||'').slice(0,60))
      });
    }
  });
});
const overflowAmount=Math.max(0,docScroll-clientWidth,bodyScroll-clientWidth);
return {
  context,
  documentClientWidth:clientWidth,
  documentScrollWidth:docScroll,
  bodyScrollWidth:bodyScroll,
  hasHorizontalOverflow:overflowAmount>1,
  overflowAmount,
  overflowSamples:samples.slice(0,8)
};
}
function applyMobileDetailOverflowGuard(context='') {
if(!isResponsiveMobileMode())return null;
const targets=[els.detail,document.querySelector('.layout'),document.querySelector('.app')].filter(Boolean);
targets.forEach(el=>{
  el.style.maxWidth='100%';
  el.style.minWidth='0';
  el.style.overflowX='hidden';
});
if(els.detail){
  els.detail.querySelectorAll('table,th,td,pre,code,.raw,.general-card,.general-card-body,.parameter-block,.parameter-main,.detail-entity-link').forEach(el=>{
    el.style.maxWidth='100%';
    el.style.minWidth='0';
    el.style.overflowWrap='anywhere';
    el.style.wordBreak='break-word';
    if(el.tagName==='TABLE')el.style.tableLayout='fixed';
    if(el.tagName==='PRE'||el.tagName==='CODE'||el.classList.contains('raw'))el.style.whiteSpace='pre-wrap';
  });
}
const diag=getHorizontalOverflowDiagnostics(context);
state.diagnostics.mobileDetailOverflow=diag;
debugLog('mobileLayout:detail-overflow-check',diag);
return diag;
}

// FEATURE[HADO-2.1.0.2-FILESETTINGS-MODE-RADIO]: 表示モードラジオボタンと保存データセレクトをファイル設定サマリーへ移動し、折り畳み/展開時に常時表示する。
function syncFileSettingsSummary(){
  if(els.viewModeAll)els.viewModeAll.checked=state.viewMode==='all';
  if(els.viewModeSaved)els.viewModeSaved.checked=state.viewMode==='saved';
  const gs=normalizeGeneralStage(state.generalStage);
  if(els.generalStageInitial)els.generalStageInitial.checked=gs==='initial';
  if(els.generalStageMax)els.generalStageMax.checked=gs==='max';
  const st=normalizeEquipmentStage(state.equipmentStage);
  if(els.equipmentStageInitial)els.equipmentStageInitial.checked=st==='initial';
  if(els.equipmentStageSsrMax)els.equipmentStageSsrMax.checked=st==='ssrMax';
  if(els.equipmentStageUrMax)els.equipmentStageUrMax.checked=st==='urMax';
}
// FEATURE[HADO-2.1.0.3-FILESETTINGS-COLLAPSE-FIX]: ファイル設定パネル折り畳み制御関数を復旧し、起動時ReferenceErrorを防止する。
function setFileSettingsCollapsed(collapsed,persist=true){
  state.fileSettingsCollapsed=!!collapsed;
  if(els.fileSettingsPanel)els.fileSettingsPanel.classList.toggle('is-collapsed',state.fileSettingsCollapsed);
  if(els.fileSettingsToggleBtn){
    els.fileSettingsToggleBtn.textContent=(state.fileSettingsCollapsed?'▶':'▼')+' ファイル設定';
    els.fileSettingsToggleBtn.setAttribute('aria-expanded',state.fileSettingsCollapsed?'false':'true');
  }
  if(persist){
    try{localStorage.setItem('hado_library_file_settings_collapsed_v1',state.fileSettingsCollapsed?'1':'0');}catch{}
  }
  syncFileSettingsSummary();
  debugLog('fileSettings:collapsed',{collapsed:state.fileSettingsCollapsed,persist});
}
function initFileSettingsPanel(){
  let saved=null;try{saved=localStorage.getItem('hado_library_file_settings_collapsed_v1');}catch{}
  const hasSave=!!(state.saveData&&Array.isArray(state.saveData.saves)&&state.saveData.saves.length);
  const collapsed=saved===null?hasSave:saved==='1';
  setFileSettingsCollapsed(collapsed,false);
  if(els.fileSettingsToggleBtn)els.fileSettingsToggleBtn.addEventListener('click',()=>setFileSettingsCollapsed(!state.fileSettingsCollapsed,true));
  if(els.saveSelectSummary)els.saveSelectSummary.addEventListener('change',()=>{if(!els.saveSelect)return;els.saveSelect.value=els.saveSelectSummary.value;els.saveSelect.dispatchEvent(new Event('change',{bubbles:true}));});
}

function isPcSearchViewportLayout(){
  // FIX[HADO-2.5.8.3-PC-WIDTH-ONLY]: PC幅ではタッチ/マウス判定に依存せず検索固定レイアウトを有効化する。
  const pc=!!(window.matchMedia&&window.matchMedia('(min-width:981px)').matches);
  const guide=document.getElementById('uxHomePanel');
  const guideVisible=!!(guide&&!guide.classList.contains('is-dismissed'));
  return pc&&state.mainTab!=='formation'&&!guideVisible&&!state.showRawJson;
}
function updatePcSearchViewportLayout(context=''){
  const enabled=isPcSearchViewportLayout();
  document.body.classList.toggle('hado-pc-search-viewport',enabled);
  const root=document.documentElement;
  if(!enabled){
    root.style.removeProperty('--pc-search-workspace-top');
    root.style.removeProperty('--pc-search-workspace-height');
    root.style.removeProperty('--pc-search-history-top');
    root.style.removeProperty('--pc-search-history-height');
    root.style.removeProperty('--pc-search-panel-bottom');
    return;
  }
  const layout=document.querySelector('.layout');
  if(!layout)return;
  const searchPanel=els.searchPanel||document.getElementById('searchPanel');
  if(searchPanel&&!state.searchDialogCollapsed){
    const body=els.searchDialogBody||document.getElementById('searchDialogBody');
    const meta=searchPanel.querySelector('.search-meta-row');
    if(body){body.hidden=false;body.removeAttribute('hidden');body.style.removeProperty('display');body.style.removeProperty('max-height');body.style.removeProperty('overflow');body.style.removeProperty('visibility');}
    if(meta){meta.style.removeProperty('display');meta.style.removeProperty('visibility');}
  }
  const bottomGap=12;
  const minHeight=180;
  const historyMinHeight=220;
  const rect=layout.getBoundingClientRect();
  const searchRect=searchPanel?searchPanel.getBoundingClientRect():rect;
  const top=Math.max(0,Math.floor(rect.top));
  const searchBottom=Math.max(top,Math.floor(searchRect.bottom));
  const historyTop=Math.max(0,Math.floor(searchRect.top));
  const height=Math.max(minHeight,Math.floor(window.innerHeight-top-bottomGap));
  const historyHeight=Math.max(historyMinHeight,Math.floor(window.innerHeight-historyTop-bottomGap));
  root.style.setProperty('--pc-search-workspace-top',top+'px');
  root.style.setProperty('--pc-search-workspace-height',height+'px');
  root.style.setProperty('--pc-search-history-top',historyTop+'px');
  root.style.setProperty('--pc-search-history-height',historyHeight+'px');
  root.style.setProperty('--pc-search-panel-bottom',searchBottom+'px');
  debugLog('pcSearchViewport:update',{context,top,height,historyTop,historyHeight,searchBottom,collapsed:!!state.searchDialogCollapsed});
}
function schedulePcSearchViewportLayout(context=''){
  const run=()=>updatePcSearchViewportLayout(context);
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);
  else setTimeout(run,0);
  setTimeout(()=>updatePcSearchViewportLayout(context+':deferred'),0);
}
function isSearchDialogCollapsed(){
  const panel=els.searchPanel||document.getElementById('searchPanel');
  const body=els.searchDialogBody||document.getElementById('searchDialogBody');
  if(panel)return panel.classList.contains('is-search-collapsed');
  if(body)return !!body.hidden||body.hasAttribute('hidden');
  return !!state.searchDialogCollapsed;
}
function setSearchDialogCollapsed(collapsed,persist=false){
  state.searchDialogCollapsed=!!collapsed;
  const panel=els.searchPanel||document.getElementById('searchPanel');
  const body=els.searchDialogBody||document.getElementById('searchDialogBody');
  const btn=els.searchDialogToggleBtn||document.getElementById('searchDialogToggleBtn');
  if(panel)panel.classList.toggle('is-search-collapsed',state.searchDialogCollapsed);
  if(body){
    if(state.searchDialogCollapsed){
      body.hidden=true;
      body.setAttribute('hidden','');
      body.style.setProperty('display','none','important');
    }else{
      body.hidden=false;
      body.removeAttribute('hidden');
      body.style.removeProperty('display');
      body.style.removeProperty('max-height');
      body.style.removeProperty('overflow');
      body.style.removeProperty('visibility');
    }
  }
  if(btn){
    btn.textContent=state.searchDialogCollapsed?'展開':'折り畳む';
    btn.setAttribute('aria-expanded',state.searchDialogCollapsed?'false':'true');
    btn.setAttribute('title',state.searchDialogCollapsed?'検索条件を展開':'検索条件を折り畳む');
  }
  debugLog('searchDialog:collapsed',{collapsed:state.searchDialogCollapsed,persist});
  schedulePcSearchViewportLayout('searchDialogCollapsed');
  setTimeout(()=>schedulePcSearchViewportLayout('searchDialogCollapsed:after-open'),120);
}
function setupSearchDialogCollapse(){
  setSearchDialogCollapsed(false,false);
  const btn=els.searchDialogToggleBtn||document.getElementById('searchDialogToggleBtn');
  if(btn&&!btn.dataset.searchDialogToggleBound){
    btn.dataset.searchDialogToggleBound='1';
    btn.addEventListener('click',(ev)=>{
      ev.preventDefault();
      setSearchDialogCollapsed(!isSearchDialogCollapsed(),true);
    });
  }
}
function getSearchModeElements(){return [document.querySelector('.pc-search-history-panel'),document.querySelector('.mobile-search-history-panel'),document.querySelector('.search-wrap'),document.querySelector('.layout')].filter(Boolean);}
function normalizeMainTab(tab){return tab==='formation'||tab==='warhorse'?tab:'search';}
function getMainTabOrder(){return ['search','formation','warhorse'];}
function markFormationScreenStale(reason){
  state._formationScreenStale=true;
  debugLog('formation:screen-stale',{reason:reason||''});
}
function renderFormationScreenForTabSwitch(){
  const hasRendered=!!(els.formationRoot&&els.formationRoot.children&&els.formationRoot.children.length>0);
  if(!hasRendered||state._formationScreenStale){
    debugLog('formation:tab-switch-render',{hasRendered,stale:!!state._formationScreenStale});
    renderFormationScreen();
    return;
  }
  debugLog('formation:tab-switch-skip-render',{reason:'cached'});
}
function setMainTab(tab){
  const nextTab=normalizeMainTab(tab);
  if(state._mainTabInitialized&&state.mainTab===nextTab){
    debugLog('mainTab:set-skip',{tab:nextTab,reason:'already-active'});
    return;
  }
  state.mainTab=nextTab;
  state._mainTabInitialized=true;
  const formation=state.mainTab==='formation';
  const warhorse=state.mainTab==='warhorse';
  const search=state.mainTab==='search';
  document.body.classList.toggle('formation-tab',formation);
  document.body.classList.toggle('warhorse-tab',warhorse);
  getSearchModeElements().forEach(el=>el.classList.toggle('tab-content-hidden',!search));
  if(els.formationScreen)els.formationScreen.classList.toggle('tab-content-hidden',!formation);
  if(els.warhorseScreen)els.warhorseScreen.classList.toggle('tab-content-hidden',!warhorse);
  if(els.mainTabSearchBtn)els.mainTabSearchBtn.classList.toggle('is-active',search);
  if(els.mainTabFormationBtn)els.mainTabFormationBtn.classList.toggle('is-active',formation);
  if(els.mainTabWarhorseBtn)els.mainTabWarhorseBtn.classList.toggle('is-active',warhorse);
  if(formation)renderFormationScreenForTabSwitch();
  if(warhorse)renderWarhorseFormationScreen();
  applyResponsiveLayout('setMainTab:'+state.mainTab);
  if(search&&typeof schedulePcSearchViewportLayout==='function')schedulePcSearchViewportLayout('setMainTab:search');
  debugLog('mainTab:set',{tab:state.mainTab});if(typeof updateUxHomePanel==='function')updateUxHomePanel('setMainTab');if(typeof updateGuidedTourToggleLabel==='function')updateGuidedTourToggleLabel();
}
function setupMainTabs(){
  if(els.mainTabSearchBtn)els.mainTabSearchBtn.addEventListener('click',()=>setMainTab('search'));
  if(els.mainTabFormationBtn)els.mainTabFormationBtn.addEventListener('click',()=>setMainTab('formation'));
  if(els.mainTabWarhorseBtn)els.mainTabWarhorseBtn.addEventListener('click',()=>setMainTab('warhorse'));
  setMainTab('search');
}

function isMobileSwipeInteractiveTarget(target){
  return !!(target&&target.closest&&target.closest('button,a,input,select,textarea,label,summary,[role=button],.control-select,.result-select,.search-history-select'));
}
function getMobileSwipeDetailContext(target){
  if(!target||!target.closest)return null;
  const detail=target.closest('#detail');
  if(!detail)return null;
  return detail;
}
function switchDetailTabBySwipe(direction){
  const item=state.selectedItem;
  if(!item)return false;
  const categoryKey=detailCategory(item);
  const specs=getDetailTabSpecs(categoryKey);
  if(!Array.isArray(specs)||specs.length<2)return false;
  const active=normalizeDetailActiveTab(categoryKey);
  const idx=Math.max(0,specs.findIndex(t=>t.key===active));
  const nextIdx=Math.max(0,Math.min(specs.length-1,idx+direction));
  if(nextIdx===idx)return false;
  state.detailActiveTab=specs[nextIdx].key;
  debugLog('mobileSwipe:detail-tab',{from:active,to:state.detailActiveTab,direction,item:getItemDisplayName(item)});
  renderDetail();
  return true;
}
function switchMainTabBySwipe(direction){
  const order=getMainTabOrder();
  const current=normalizeMainTab(state.mainTab);
  const idx=Math.max(0,order.indexOf(current));
  const nextIdx=Math.max(0,Math.min(order.length-1,idx+(direction>0?1:-1)));
  const next=order[nextIdx];
  if(state.mainTab===next)return false;
  debugLog('mobileSwipe:main-tab',{from:state.mainTab,to:next,direction});
  setMainTab(next);
  return true;
}

function warhorseSkillOptionHtml(selectedId='',excludeIds=[]){
  const selected=norm(selectedId||'');
  const excludes=new Set((excludeIds||[]).map(v=>norm(v)).filter(Boolean));
  const skills=(Array.isArray(state.warhorseSkills)?state.warhorseSkills:[]).filter(sk=>getWarhorseSkillKind(sk)!=='famous');
  const rows=['<option value="">未設定</option>'];
  skills.forEach(sk=>{
    const id=norm(sk.id||sk.name||sk.title||'');
    if(!id)return;
    if(id!==selected&&excludes.has(id))return;
    rows.push(`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(sk.name||sk.title||id)}</option>`);
  });
  return rows.join('');
}
function warhorseMasterOptionHtml(selectedId='',kind='normal'){
  const selected=norm(selectedId||'');
  const desired=norm(kind||'normal');
  const masters=(Array.isArray(state.warhorses)?state.warhorses:[]).filter(h=>getWarhorseMasterKind(h)===(desired||'normal'));
  const rows=[];
  masters.forEach(h=>{
    const id=getWarhorseMasterId(h);
    if(!id)return;
    rows.push(`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(h.name||h.title||id)}</option>`);
  });
  if(!rows.length)rows.push('<option value="">通常馬マスタ未読込</option>');
  return rows.join('');
}
function warhorseAllMasterOptionHtml(selectedId=''){
  const selected=norm(selectedId||'');
  const masters=Array.isArray(state.warhorses)?state.warhorses:[];
  const rows=[];
  masters.forEach(h=>{const id=getWarhorseMasterId(h);if(!id)return;const kind=getWarhorseMasterKind(h)==='famous'?'名馬':'通常馬';rows.push(`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(kind)}：${esc(h.name||h.title||id)}</option>`);});
  if(!rows.length)rows.push('<option value="">軍馬マスタ未読込</option>');
  return rows.join('');
}
function getWarhorseSkillDisplayName(skillId){const id=norm(skillId||'');const sk=(state.warhorseSkills||[]).find(x=>norm(x.id||x.name||x.title)===id);return sk?norm(sk.name||sk.title||id):id;}

function getWarhorseMasterDisplayName(masterId){const m=getWarhorseMasterById(masterId);return m?norm(m.name||m.title||masterId):norm(masterId||'');}
function buildWarhorseCreateDialogHtml(){
  if(!state._warhorseCreateDialogVisible)return '';
  const kind=state._warhorseCreateKind==='famous'?'famous':'normal';
  const masters=(state.warhorses||[]).filter(h=>getWarhorseMasterKind(h)===kind);
  const selectedMasterId=norm(state._warhorseCreateMasterId||getWarhorseMasterId(masters[0])||'');
  const selectedMaster=getWarhorseMasterById(selectedMasterId)||masters[0]||null;
  const defaultName=norm(state._warhorseCreateName||selectedMaster?.name||'新規軍馬');
  const previewKind=kind==='famous'?'名馬':'通常馬';
  const fixed=kind==='famous'?getWarhorseFixedSkillName(selectedMaster):'';
  const preview=`${previewKind}${selectedMaster?` / ${selectedMaster.name||selectedMasterId}`:''}${fixed?` / 固有技能:${fixed}`:''}`;
  return `<div class="warhorse-modal" role="dialog" aria-modal="true" aria-labelledby="warhorseCreateTitle"><div class="warhorse-modal-card"><div class="warhorse-modal-header"><div class="warhorse-modal-title"><h3 id="warhorseCreateTitle">軍馬を登録</h3><div class="note">通常馬または名馬を選び、名前を付けて保存軍馬を作成します。作成後の変更は一覧カードから開く編集ダイアログで行います。</div></div><button type="button" class="warhorse-modal-close" data-warhorse-create-close="1" aria-label="閉じる">×</button></div><div class="warhorse-create-segment" role="group" aria-label="軍馬種別"><button type="button" data-warhorse-create-kind="normal" class="${kind==='normal'?'is-active':''}">通常馬</button><button type="button" data-warhorse-create-kind="famous" class="${kind==='famous'?'is-active':''}">名馬</button></div><div class="warhorse-modal-grid"><label for="warhorseCreateMaster">馬マスタ</label><select id="warhorseCreateMaster">${masters.map(h=>{const id=getWarhorseMasterId(h);return `<option value="${esc(id)}" ${id===selectedMasterId?'selected':''}>${esc(h.name||h.title||id)}</option>`;}).join('')||'<option value="">マスタ未読込</option>'}</select><label for="warhorseCreateName">軍馬名</label><input id="warhorseCreateName" type="text" maxlength="80" value="${esc(defaultName)}" placeholder="例：騎兵対物用 白龍" /></div><div class="warhorse-modal-preview">作成内容：${esc(preview)}</div><div class="warhorse-modal-actions"><button type="button" data-warhorse-create-close="1">キャンセル</button><button type="button" class="warhorse-modal-create" id="warhorseCreateConfirmBtn">作成する</button></div></div></div>`;
}
function openWarhorseCreateDialog(kind='normal'){
  clearWarhorseUndoToast('open-create');
  if(!getCurrentSave()){try{window.alert('軍馬を作成するには保存データを作成または選択してください。');}catch{}return;}
  const normalized=kind==='famous'?'famous':'normal';
  const master=getDefaultWarhorseMaster(normalized);
  state._warhorseCreateDialogVisible=true;state._warhorseCreateKind=normalized;state._warhorseCreateMasterId=getWarhorseMasterId(master);state._warhorseCreateName=master?`${master.name||'軍馬'} ${Object.keys(getCurrentWarhorseData().owned||{}).length+1}`:`軍馬 ${Object.keys(getCurrentWarhorseData().owned||{}).length+1}`;
  renderWarhorseFormationScreen();
}
function closeWarhorseCreateDialog(){state._warhorseCreateDialogVisible=false;state._warhorseCreateKind='';state._warhorseCreateMasterId='';state._warhorseCreateName='';renderWarhorseFormationScreen();}
function confirmWarhorseCreateDialog(){
  const kind=state._warhorseCreateKind==='famous'?'famous':'normal';
  const masterId=norm(document.getElementById('warhorseCreateMaster')?.value||state._warhorseCreateMasterId||'');
  const name=norm(document.getElementById('warhorseCreateName')?.value||getWarhorseMasterDisplayName(masterId)||'新規軍馬');
  state._warhorseCreateDialogVisible=false;
  createDefaultOwnedWarhorse(kind,{masterId,name});
}
function openWarhorseEditDialog(id){
  clearWarhorseUndoToast('open-edit');
  const key=norm(id||'');
  const data=getCurrentWarhorseData();
  if(!key||!data.owned?.[key]){try{window.alert('編集する軍馬を選択してください。');}catch{}return;}
  state.warhorseSelectedId=key;
  state._warhorseEditDialogId=key;
  renderWarhorseFormationScreen();
}
function closeWarhorseEditDialog(){state._warhorseEditDialogId='';state._warhorseDeleteConfirmId='';renderWarhorseFormationScreen();}
function isWarhorseDeletePending(id){return !!id&&norm(state._warhorseDeleteConfirmId||'')===norm(id||'');}
function cancelWarhorseDeleteConfirm(id){const key=norm(id||state._warhorseDeleteConfirmId||'');debugLog('warhorseSave:delete-cancel-bar',{id:key,pendingId:state._warhorseDeleteConfirmId||''});state._warhorseDeleteConfirmId='';renderWarhorseFormationScreen();}
function buildWarhorseDeleteConfirmBarHtml(warhorseData){const id=norm(state._warhorseDeleteConfirmId||'');if(!id)return '';const entry=warhorseData?.owned?.[id]||null;if(!entry)return '';const name=entry.name||entry.customName||id;return `<div class="warhorse-delete-bottom-bar" role="alertdialog" aria-live="assertive" aria-label="軍馬削除確認"><div><div class="warhorse-delete-bottom-title">軍馬を削除しますか？</div><div class="warhorse-delete-bottom-text">「${esc(name)}」を削除します。削除後は下部の「元に戻す」から復元できます。</div></div><div class="warhorse-delete-bottom-actions"><button type="button" id="warhorseDeleteBarCancelBtn" class="warhorse-delete-bottom-cancel">キャンセル</button><button type="button" id="warhorseDeleteBarConfirmBtn" class="warhorse-delete-bottom-confirm">削除する</button></div></div>`;}
function clearWarhorseUndoToastTimer(){if(state._warhorseUndoToastTimer){try{clearTimeout(state._warhorseUndoToastTimer);}catch{}state._warhorseUndoToastTimer=null;}}
function clearWarhorseUndoToast(reason){const last=state._warhorseLastDeleted;clearWarhorseUndoToastTimer();state._warhorseLastDeleted=null;if(last?.id)debugLog('warhorseSave:undo-clear',{id:last.id,reason:reason||'clear'});}
function expireWarhorseUndoToast(id,reason){const last=state._warhorseLastDeleted;if(!last||!last.id){clearWarhorseUndoToastTimer();return;}const target=norm(id||last.id);if(target&&norm(last.id)!==target)return;clearWarhorseUndoToast(reason||'timeout');renderWarhorseFormationScreen();}
function scheduleWarhorseUndoToastAutoHide(id){clearWarhorseUndoToastTimer();const target=norm(id||state._warhorseLastDeleted?.id||'');if(!target)return;state._warhorseUndoToastTimer=setTimeout(()=>expireWarhorseUndoToast(target,'timeout'),5000);}
function buildWarhorseUndoToastHtml(){const last=state._warhorseLastDeleted;if(!last||!last.id)return '';if(last.expiresAt&&Date.now()>Number(last.expiresAt)){clearWarhorseUndoToast('expired-before-render');return '';}const name=last.entry?.name||last.entry?.customName||last.id;return `<div class="warhorse-undo-toast" role="status" aria-live="polite"><span>${esc(name)}を削除しました。</span><button type="button" id="warhorseUndoDeleteBtn">元に戻す</button><button type="button" id="warhorseDismissUndoBtn" aria-label="削除通知を閉じる">×</button></div>`;}
function dismissWarhorseUndoToast(reason){clearWarhorseUndoToast(reason||'dismiss');renderWarhorseFormationScreen();}
function undoLastWarhorseDelete(){const last=state._warhorseLastDeleted;if(!last||!last.id||!last.entry){debugLog('warhorseSave:undo-abort',{reason:'no-last-deleted'});clearWarhorseUndoToastTimer();return;}clearWarhorseUndoToastTimer();const data=getCurrentWarhorseData();if(data.owned?.[last.id]){debugLog('warhorseSave:undo-abort',{id:last.id,reason:'already-exists'});clearWarhorseUndoToast('already-exists');renderWarhorseFormationScreen();return;}data.owned[last.id]=sanitizeWarhorseEntry({...last.entry});data.activeSlots=Array.isArray(last.activeSlots)?last.activeSlots.slice(0,3):data.activeSlots;state.warhorseSelectedId=last.id;state._warhorseEditDialogId=last.id;state._warhorseDeleteConfirmId='';clearWarhorseUndoToast('undo');persistSaveData();renderWarhorseFormationScreen();if(state.mainTab==='formation')renderFormationScreen();updateUxHomePanel('warhorse-undo-delete');debugLog('warhorseSave:undo',{id:state.warhorseSelectedId,ownedCountAfter:Object.keys(data.owned||{}).length});}
function buildWarhorseEditDialogHtml(warhorseData){
  const id=norm(state._warhorseEditDialogId||'');
  if(!id)return '';
  const selected=warhorseData?.owned?.[id]||null;
  if(!selected)return '';
  state.warhorseSelectedId=id;
  const master=getWarhorseMasterById(selected.horseMasterId);
  const editor=buildWarhorseEditorHtml(selected,master,warhorseData);
  return `<div class="warhorse-modal warhorse-edit-modal" role="dialog" aria-modal="true" aria-labelledby="warhorseEditTitle"><div class="warhorse-modal-card"><div class="warhorse-modal-header"><div class="warhorse-modal-title"><h3 id="warhorseEditTitle">軍馬を編集</h3><div class="note">軍馬名、通常軍馬技能、名馬の将星を編集します。</div></div><button type="button" class="warhorse-modal-close" data-warhorse-edit-close="1" aria-label="閉じる">×</button></div>${editor}</div></div>`;
}
function deleteOwnedWarhorseById(id,options){
  const data=getCurrentWarhorseData();const key=norm(id||'');const src=key?data.owned?.[key]:null;
  const ownedCountBefore=Object.keys(data.owned||{}).length;
  const explicitConfirmed=!!(options&&options.confirmed);
  debugLog('warhorseSave:delete-request',{id:key,exists:!!src,ownedCountBefore,editDialogId:state._warhorseEditDialogId||'',selectedId:state.warhorseSelectedId||'',pendingId:state._warhorseDeleteConfirmId||'',explicitConfirmed,confirmed:explicitConfirmed,method:'bottom-confirm-bar'});
  if(!src){try{window.alert('削除する軍馬を選択してください。');}catch{}debugLog('warhorseSave:delete-abort',{id:key,reason:'not-found'});state._warhorseDeleteConfirmId='';renderWarhorseFormationScreen();return;}
  if(!explicitConfirmed){
    state._warhorseDeleteConfirmId=key;
    state.warhorseSelectedId=key;
    if(!state._warhorseEditDialogId)state._warhorseEditDialogId=key;
    debugLog('warhorseSave:delete-pending-bar',{id:key,name:src.name||src.customName||'',ownedCountBefore,method:'bottom-confirm-bar'});
    renderWarhorseFormationScreen();
    return;
  }
  const activeSlotsBefore=Array.isArray(data.activeSlots)?data.activeSlots.slice(0,3):[null,null,null];
  clearWarhorseUndoToastTimer();state._warhorseLastDeleted={id:key,entry:safeCloneForDebug(src),activeSlots:activeSlotsBefore,deletedAt:debugTimestamp(),expiresAt:Date.now()+5000};
  debugLog('warhorseSave:delete-confirmed-bar',{id:key,name:src.name||src.customName||'',ownedCountBefore,method:'bottom-confirm-bar'});
  delete data.owned[key];
  data.activeSlots=(data.activeSlots||[null,null,null]).map(slotId=>norm(slotId)===key?null:slotId);
  state.warhorseSelectedId=Object.keys(data.owned||{})[0]||'';
  state._warhorseEditDialogId='';
  state._warhorseDeleteConfirmId='';
  persistSaveData();renderWarhorseFormationScreen();scheduleWarhorseUndoToastAutoHide(key);if(state.mainTab==='formation')renderFormationScreen();updateUxHomePanel('warhorse-delete');debugLog('warhorseSave:delete-done',{id:key,ownedCountBefore,ownedCountAfter:Object.keys(data.owned||{}).length,undoAvailable:true,undoAutoHideMs:5000,method:'bottom-confirm-bar'});
}

function buildWarhorseEditorHtml(selected,selectedMaster,warhorseData){
  if(!selected)return '<div class="warhorse-empty-note">編集する軍馬を選択してください。</div>';
  const isFamous=getWarhorseMasterKind(selectedMaster)==='famous';
  const skills=Array.isArray(selected.skills)?selected.skills:[];
  const stat=selected.baseStats||{};
  const statInputs=warhorseBaseStatKeys().map(k=>`<label class="warhorse-stat-cell"><span>${esc(k)}</span><input type="number" step="1" data-warhorse-stat="${esc(k)}" value="${esc(Number.isFinite(Number(stat[k]))?Number(stat[k]):0)}"></label>`).join('');
  const skillRows=[0,1,2].map(i=>{
    const cur=skills[i]||{};
    const curId=norm(cur.skillId||'');
    const lv=normalizeWarhorseSkillLevel(cur.level||1);
    return `<div class="warhorse-editor-label">通常技能${i+1}</div><div class="warhorse-skill-grid"><select data-warhorse-skill-index="${i}" data-warhorse-skill-field="skillId">${warhorseSkillOptionHtml(curId,[])}</select><select data-warhorse-skill-index="${i}" data-warhorse-skill-field="level">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===lv?'selected':''}>Lv${n}</option>`).join('')}</select></div>`;
  }).join('');
  const star=isFamous?normalizeWarhorseFamousStarValue(selected.star ?? 0):'';
  const fixedSkillName=isFamous?getWarhorseFixedSkillName(selectedMaster):'';
  const fixedLv=isFamous?getFamousHorseFixedSkillLevel(selectedMaster,star):'';
  const starEffects=isFamous?getFamousHorseStarEffects(selectedMaster,star).map(formatWarhorseEffectSummary).filter(Boolean).join('、'):'';
  const starHtml=isFamous?`<div class="warhorse-editor-label">将星</div><select id="warhorseEditStar">${[0,1,2,3,4,5,6,7].map(n=>`<option value="${n}" ${n===star?'selected':''}>将星${n}</option>`).join('')}</select>`:'';
  const fixedSkillHtml=isFamous?`<div class="warhorse-editor-label">固有軍馬技能</div><div class="warhorse-editor-value">${esc(fixedSkillName||'未設定')} Lv${esc(fixedLv)}（変更不可）</div><div class="warhorse-editor-label">将星効果</div><div class="warhorse-editor-value">${esc(starEffects||'なし')}</div>`:'';
  return `<form id="warhorseEditorForm" class="warhorse-editor-form"><div class="warhorse-form-grid"><div class="warhorse-editor-label">軍馬名</div><input id="warhorseEditName" type="text" value="${esc(selected.name||selected.customName||'')}" maxlength="80"><div class="warhorse-editor-label">種別</div><div class="warhorse-editor-value">${esc(isFamous?'名馬':'通常馬')}</div>${starHtml}${fixedSkillHtml}${skillRows}</div><div><div class="warhorse-editor-label" style="margin-bottom:6px">基本能力</div><div class="warhorse-stat-grid">${statInputs}</div></div><div class="warhorse-form-note">通常軍馬技能は最大3つ、1枠に設定できるLvは1〜5です。</div><div id="warhorseSaveStatus" class="warhorse-form-note" hidden></div><div class="warhorse-action-row"><button type="submit" class="warhorse-save-btn">変更を保存</button><button type="button" id="warhorseDuplicateBtn" class="warhorse-secondary-btn">複製</button><button type="button" id="warhorseDeleteBtn" class="warhorse-danger-btn">この軍馬を削除</button></div></form>`;
}
function buildWarhorseCompactCardHtml(w,warhorseData){
  const master=getWarhorseMasterById(w.horseMasterId);
  const isFamous=getWarhorseMasterKind(master)==='famous';
  const kindLabel=isFamous?'名馬':'通常馬';
  const skills=(Array.isArray(w.skills)?w.skills:[]).map(sk=>`<span class="warhorse-chip">${esc(getWarhorseSkillDisplayName(sk.skillId))} Lv${esc(normalizeWarhorseSkillLevel(sk.level))}</span>`).join('')||'<span class="warhorse-chip is-empty">通常技能 未設定</span>';
  const fixed=isFamous?`<span class="warhorse-chip is-fixed">固有 ${esc(getWarhorseFixedSkillName(master)||'-')} Lv${esc(getFamousHorseFixedSkillLevel(master,w.star ?? 0))}</span><span class="warhorse-chip">将星${esc(normalizeWarhorseFamousStarValue(w.star ?? 0))}</span>`:'';
  return `<button type="button" class="warhorse-list-item" data-warhorse-edit-id="${esc(w.id)}"><span class="warhorse-list-top"><span class="warhorse-list-title">${esc(w.name||w.customName||w.id)}</span><span class="warhorse-kind-chip ${isFamous?'is-famous':''}">${esc(kindLabel)}</span></span><span class="warhorse-compact-row">${fixed}${skills}</span></button>`;
}
function renderWarhorseFormationScreen(){
  if(!els.warhorseRoot)return;
  const currentSave=getCurrentSave?getCurrentSave():null;
  const warhorseData=currentSave?ensureSaveWarhorseData(currentSave):sanitizeWarhorseSaveData({});
  const ownedList=currentSave?getOwnedWarhorseList():[];
  if(state.warhorseSelectedId&&!ownedList.some(w=>w.id===state.warhorseSelectedId))state.warhorseSelectedId=ownedList[0]?.id||'';
  if(state._warhorseEditDialogId&&!ownedList.some(w=>w.id===state._warhorseEditDialogId))state._warhorseEditDialogId='';if(state._warhorseDeleteConfirmId&&!ownedList.some(w=>w.id===state._warhorseDeleteConfirmId))state._warhorseDeleteConfirmId='';
  const ownedRows=currentSave?(ownedList.map(w=>buildWarhorseCompactCardHtml(w,warhorseData)).join('')||'<div class="warhorse-empty-state"><strong>まだ軍馬がありません。</strong><span>「＋ 軍馬を登録」から通常馬または名馬を作成してください。編集は作成後のカードから行えます。</span></div>'):'<div class="warhorse-empty-state"><strong>保存データが未作成です。</strong><span>保存データを新規作成またはImportすると、軍馬を保存できます。</span></div>';
  els.warhorseRoot.innerHTML=`<div class="warhorse-layout"><section class="warhorse-card"><div class="warhorse-card-header"><div class="warhorse-card-title"><h3>登録済み軍馬</h3><div class="note">${currentSave?`登録 ${ownedList.length}件`:'保存データ未選択'}。カードを押すと編集ダイアログを開きます。</div></div><button type="button" id="warhorseOpenCreateBtn" class="warhorse-primary-btn" ${currentSave?'':'disabled'}>＋ 軍馬を登録</button></div><div class="warhorse-card-body"><div class="warhorse-list">${ownedRows}</div></div></section></div>${buildWarhorseCreateDialogHtml()}${buildWarhorseEditDialogHtml(warhorseData)}${buildWarhorseDeleteConfirmBarHtml(warhorseData)}${buildWarhorseUndoToastHtml()}`;
  if(state._warhorseLastDeleted?.id&&!state._warhorseUndoToastTimer){scheduleWarhorseUndoToastAutoHide(state._warhorseLastDeleted.id);}
  els.warhorseRoot.onclick=(event)=>{
    const undoDeleteBtn=event.target&&event.target.closest?event.target.closest('#warhorseUndoDeleteBtn'):null;
    if(undoDeleteBtn){event.preventDefault();event.stopPropagation();undoLastWarhorseDelete();return;}
    const dismissUndoBtn=event.target&&event.target.closest?event.target.closest('#warhorseDismissUndoBtn'):null;
    if(dismissUndoBtn){event.preventDefault();event.stopPropagation();dismissWarhorseUndoToast('dismiss-button');return;}
    const deleteBarCancelBtn=event.target&&event.target.closest?event.target.closest('#warhorseDeleteBarCancelBtn'):null;
    if(deleteBarCancelBtn){event.preventDefault();event.stopPropagation();cancelWarhorseDeleteConfirm(state._warhorseDeleteConfirmId||state._warhorseEditDialogId||state.warhorseSelectedId||'');return;}
    const deleteBarConfirmBtn=event.target&&event.target.closest?event.target.closest('#warhorseDeleteBarConfirmBtn'):null;
    if(deleteBarConfirmBtn){event.preventDefault();event.stopPropagation();const deleteId=norm(state._warhorseDeleteConfirmId||state._warhorseEditDialogId||state.warhorseSelectedId||'');debugLog('warhorseSave:delete-click',{id:deleteId,editDialogId:state._warhorseEditDialogId||'',selectedId:state.warhorseSelectedId||'',pendingId:state._warhorseDeleteConfirmId||'',confirmed:true,source:'bottom-confirm-bar'});deleteOwnedWarhorseById(deleteId,{confirmed:true});return;}
    const deleteBtn=event.target&&event.target.closest?event.target.closest('#warhorseDeleteBtn'):null;
    if(deleteBtn){event.preventDefault();event.stopPropagation();const deleteId=norm(state._warhorseEditDialogId||state.warhorseSelectedId||'');debugLog('warhorseSave:delete-click',{id:deleteId,editDialogId:state._warhorseEditDialogId||'',selectedId:state.warhorseSelectedId||'',pendingId:state._warhorseDeleteConfirmId||'',confirmed:false,source:'delete-button'});deleteOwnedWarhorseById(deleteId,{confirmed:false});return;}
    const duplicateBtn=event.target&&event.target.closest?event.target.closest('#warhorseDuplicateBtn'):null;
    if(duplicateBtn){event.preventDefault();event.stopPropagation();duplicateSelectedOwnedWarhorse();return;}
    const closeEdit=event.target&&event.target.closest?event.target.closest('[data-warhorse-edit-close]'):null;
    if(closeEdit){event.preventDefault();closeWarhorseEditDialog();return;}
    const item=event.target&&event.target.closest?event.target.closest('[data-warhorse-edit-id]'):null;
    if(item){event.preventDefault();openWarhorseEditDialog(item.getAttribute('data-warhorse-edit-id')||'');debugLog('warhorseSave:open-edit',{id:state.warhorseSelectedId});return;}
  };
  const form=document.getElementById('warhorseEditorForm');if(form){form.addEventListener('submit',handleSaveWarhorseEditor);form.addEventListener('input',()=>setWarhorseSaveButtonState('ready',''));form.addEventListener('change',()=>setWarhorseSaveButtonState('ready',''));}
  const createBtn=document.getElementById('warhorseOpenCreateBtn');if(createBtn)createBtn.addEventListener('click',()=>openWarhorseCreateDialog('normal'));
  els.warhorseRoot.querySelectorAll('[data-warhorse-create-close]').forEach(node=>node.addEventListener('click',e=>{e.preventDefault();closeWarhorseCreateDialog();}));
  els.warhorseRoot.querySelectorAll('[data-warhorse-create-kind]').forEach(node=>node.addEventListener('click',()=>{const kind=node.getAttribute('data-warhorse-create-kind')==='famous'?'famous':'normal';state._warhorseCreateKind=kind;const master=getDefaultWarhorseMaster(kind);state._warhorseCreateMasterId=getWarhorseMasterId(master);state._warhorseCreateName=master?`${master.name||'軍馬'} ${Object.keys(getCurrentWarhorseData().owned||{}).length+1}`:`軍馬 ${Object.keys(getCurrentWarhorseData().owned||{}).length+1}`;renderWarhorseFormationScreen();}));
  const createMaster=document.getElementById('warhorseCreateMaster');if(createMaster)createMaster.addEventListener('change',()=>{state._warhorseCreateMasterId=norm(createMaster.value||'');const nameInput=document.getElementById('warhorseCreateName');if(nameInput&&!norm(nameInput.value)){const master=getWarhorseMasterById(state._warhorseCreateMasterId);state._warhorseCreateName=master?`${master.name||'軍馬'} ${Object.keys(getCurrentWarhorseData().owned||{}).length+1}`:'';}else if(nameInput){state._warhorseCreateName=norm(nameInput.value||'');}renderWarhorseFormationScreen();});
  const createConfirm=document.getElementById('warhorseCreateConfirmBtn');if(createConfirm)createConfirm.addEventListener('click',confirmWarhorseCreateDialog);
  const createName=document.getElementById('warhorseCreateName');if(createName)createName.addEventListener('input',()=>{state._warhorseCreateName=createName.value;});
  els.warhorseRoot.querySelectorAll('[data-warhorse-assignment-slot]').forEach(sel=>sel.addEventListener('change',()=>{setFormationWarhorseSlot(sel.getAttribute('data-warhorse-assignment-slot'),sel.value||'');if(state.mainTab==='warhorse')renderWarhorseFormationScreen();}));
  els.warhorseRoot.querySelectorAll('[data-warhorse-assignment-edit]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();openWarhorseEditDialog(btn.getAttribute('data-warhorse-assignment-edit')||'');}));
  els.warhorseRoot.querySelectorAll('[data-warhorse-assignment-remove]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();setFormationWarhorseSlot(btn.getAttribute('data-warhorse-assignment-remove'),'');if(state.mainTab==='warhorse')renderWarhorseFormationScreen();}));
  debugLog('warhorseScreen:render',{ownedWarhorses:ownedList.length,activeSlots:assignedCount,currentSaveName:currentSave?.name||'',layout:'list-only-dialog-editor'});
}


// FEATURE[HADO-2.5.0.0-UX-SHELL]: 初回導線・状態カード・簡易使い方説明
function getUxDatasetTotalCount(){return (state.generals?.length||0)+(state.tactics?.length||0)+(state.skills?.length||0)+(state.equipments?.length||0)+(state.statusEffects?.length||0)+(state.siegeWeapons?.length||0)+(state.ethnicArmaments?.length||0)+(state.ethnicResearchSkills?.length||0)+(state.formationMasters?.length||0)+(state.warhorses?.length||0)+(state.warhorseSkills?.length||0);}
function setUxText(id,value){const el=document.getElementById(id);if(el)el.textContent=String(value??'');}
function updateUxHomePanel(context=''){
  const total=getUxDatasetTotalCount();
  const current=getCurrentSave?getCurrentSave():null;
  const saveCount=Array.isArray(state.saveData?.saves)?state.saveData.saves.length:0;
  const formationCount=Array.isArray(state.formations)?state.formations.length:0;
  const historyCount=Array.isArray(state.searchHistory)?state.searchHistory.length:0;
  const loaded=total>0;
  setUxText('uxDataStateValue',loaded?'読込済み':'未読込');
  setUxText('uxDataStateNote',loaded?`武将${state.generals.length} / 戦法${state.tactics.length} / 技能${state.skills.length} / 装備${state.equipments.length} / 陣形${state.formationMasters.length}`:(IS_WEB_DEPLOYMENT?'公開JSONを自動取得しています。失敗時はページを再読込してください。':'JSONフォルダまたはJSONファイルを選択してください。'));
  setUxText('uxSaveStateValue',current?current.name:(saveCount?`${saveCount}件`:'未作成'));
  setUxText('uxSaveStateNote',current?`表示モード:${state.viewMode==='saved'?'保存データ':'全データ'} / 検索履歴${historyCount}件`:'保存データを作成またはImportできます。');
  setUxText('uxFormationStateValue',`${formationCount}部隊`);
  setUxText('uxFormationStateNote',state.currentFormationId?`選択中:${(state.formations||[]).find(f=>f.id===state.currentFormationId)?.name||state.currentFormationId}`:'部隊編成タブで作成・確認できます。');
  let actionValue=IS_WEB_DEPLOYMENT?'自動読込':'データ読込';
  let actionNote=IS_WEB_DEPLOYMENT?'公開JSONを自動取得しています。完了後に検索を利用できます。':'最初にJSONを読み込んでください。';
  if(loaded&&!current){actionValue='保存データ準備';actionNote='全データ検索は利用できます。保存データ運用する場合は新規作成またはImportしてください。';}
  if(loaded&&current){actionValue='検索または部隊編成';actionNote='検索条件を指定するか、部隊編成タブで編成を確認してください。';}
  setUxText('uxNextActionValue',actionValue);
  setUxText('uxNextActionNote',actionNote);
  debugLog('uxHome:update',{context,total,saveCount,currentSaveName:current?.name||'',formationCount,historyCount,mainTab:state.mainTab});
}


// FEATURE[HADO-2.9.6.1-GUIDED-TOUR]: 現行UI対応のタブ別吹き出しガイド
const GUIDED_TOUR_STORAGE_KEY='hado_library_guided_tour_intro_seen_v2_9_6_5';
const guidedTourState={active:false,tourKey:'',index:0,steps:[],lastTarget:null,startedFromButton:false,panelDock:'',suppressedStartupDataOverlay:false,initialAutoStartScheduled:false};
function getGuidedTourElements(){
  return {
    overlay:document.getElementById('guidedTourOverlay'),
    spotlight:document.getElementById('guidedTourSpotlight'),
    bubble:document.getElementById('guidedTourBubble'),
    kicker:document.getElementById('guidedTourKicker'),
    title:document.getElementById('guidedTourTitle'),
    text:document.getElementById('guidedTourText'),
    progress:document.getElementById('guidedTourProgress'),
    prev:document.getElementById('guidedTourPrevBtn'),
    next:document.getElementById('guidedTourNextBtn'),
    end:document.getElementById('guidedTourEndBtn'),
    toggle:document.getElementById('uxHomeOpenBtn')
  };
}
function getGuidedTourDefinitions(){
  return {
    intro:[
      {title:'覇道ライブラリへようこそ',target:'#appTitlePanel',body:'初回は、準備と基本操作だけを案内します。\n検索・部隊編成・軍馬編成の各タブでは、上部の「ガイド開始」から専用ガイドを確認できます。'},
      {title:'現在のデータ状態を確認',target:'#dataContextSummary',body:'上部のデータバーで、全データ/保存データ、保存名、武将状態、装備状態を確認できます。\nこの欄を押すと、データ管理を開けます。'},
      (IS_WEB_DEPLOYMENT?{title:'公開JSONは自動で読み込まれます',target:'#dataContextSummary',body:'ウェブ版では、公開サイトに格納されたJSON一式を起動時に自動取得します。\nJSONフォルダやJSONファイルを手動で選択する必要はありません。'}:{title:'JSONデータを読み込みます',target:'#dataManagementSheet .data-file-pane',openDataSheet:true,body:'PCは「JSONフォルダ再読込」、スマホは「JSONファイル読込」を使います。\n最新クローラーで生成したJSON一式を読み込んでください。'}),
      {title:'保存データを準備します',target:'#dataSavedOptions',openDataSheet:true,dataMode:'saved',body:'保存データでは、お気に入り登録した武将・装備、部隊編成、軍馬を管理できます。\n既存データはImport、新規利用は「新規」から作成します。'},
      {title:'お気に入り登録',target:'#results,#resultSelect',closeDataSheet:true,body:'検索結果や内容詳細で武将・装備を★登録すると、現在選択中の保存データに反映されます。\n保存データ表示では、登録済みの武将・装備を前提に候補を絞り込みます。'},
      {title:'3つのタブで操作します',target:'#mainTabPanel',body:'検索、部隊編成、軍馬編成の3つのタブがあります。\nタブを切り替えた後に「ガイド開始」を押すと、そのタブ専用の案内が始まります。'},
      {title:'タブ別ガイドを使ってください',target:'#uxHomeOpenBtn',body:'初回ガイドはここまでです。\n検索機能は大幅に増えているため、最初に検索タブで「ガイド開始」を押してください。\n初回ガイドをもう一度見たい時は、上部の「？」から再表示できます。'}
    ],
    search:[
      {title:'検索ガイドを開始します',target:'#searchPanel',tab:'search',expandSearchPanel:true,body:'検索には「通常検索」「状態変化検索」「型検索」があります。\n目的に合う検索モードを選び、カテゴリ・タグ・条件を組み合わせます。'},
      {title:'検索モードを選択',target:'#searchModeBar',tab:'search',expandSearchPanel:true,body:'通常検索は自由検索、状態変化検索は状態変化からの逆引き、型検索は攻撃速度型・撃心型などの編成コンセプトから候補を探す機能です。'},
      {title:'通常検索：キーワード',target:'#normalSearchInputRow',tab:'search',searchMode:'normal',expandSearchPanel:true,body:'通常検索では、名称や本文を部分一致で探します。\n「名称のみ」をONにすると名称限定になります。キーワード未入力でも、カテゴリをONにするとカテゴリ全件を表示します。'},
      {title:'通常検索・型検索：タグ',target:'#tagSearchWrap',tab:'search',searchMode:'normal',expandSearchPanel:true,body:'タグは属性の絞り込みに使います。\n同じタググループ内はOR、異なるタググループ間はANDです。例：兵科:騎兵 OR 兵科:弓兵 AND 性別:女。'},
      {title:'カテゴリを選択',target:'#categoryBar',tab:'search',searchMode:'normal',expandSearchPanel:true,body:'検索対象カテゴリを複数選択できます。\n型検索では、武将・装備・兵器・軍馬技能の4カテゴリに限定されます。'},
      {title:'状態変化検索',target:'#searchPresetBar',tab:'search',searchMode:'status',expandSearchPanel:true,body:'状態変化検索では、6分類から目的を選び、状態変化を1件選択します。\n自部隊能力強化、自部隊状態強化、自部隊不利対策、敵部隊能力低下、敵部隊状態弱化、敵部隊有利対策を逆引きできます。'},
      {title:'型検索',target:'#typeSearchPanel',tab:'search',searchMode:'type',expandSearchPanel:true,body:'型検索では、攻撃速度型、通常攻撃拡張型、撃心型、ゾンビ型などのプリセットを選択できます。\n状態変化と型要素はOR条件で検索され、タグは属性絞り込みとしてANDで適用されます。条件は追加・削除できます。'},
      {title:'検索結果とコピー',target:'.result-copy-actions',tab:'search',searchMode:'type',expandSearchPanel:true,body:'検索結果は自動更新されます。\n一覧コピー、検索パラコピー、全パラコピーを用途に応じて使います。型検索では一致理由と重要度を確認できます。'},
      {title:'検索結果から詳細を確認',target:'#results,#resultSelect',tab:'search',body:'PCでは一覧、スマホではドロップダウンから結果を選択します。\n選択すると、右側または下部の内容詳細へ表示されます。'},
      {title:'内容詳細と履歴操作',target:'#detail',tab:'search',body:'内容詳細では、関連リンク、状態変化率、パラメータ、コピー用テキストを確認できます。\n戻る/進む、検索結果の前後移動も利用できます。'}
    ],
    formation:[
      {title:'部隊編成ガイドを開始します',target:'#formationScreen',body:'部隊編成では、武将・装備・侍従・参軍・兵器・武装・軍馬を配置し、合算結果を確認します。まずは画面全体の構成を確認します。',tab:'formation'},
      {title:'部隊の選択と基本設定',target:'.formation-list-panel,#formationMobileSelect',body:'編成対象の部隊を選び、部隊名・陣形・攻城/防衛などの基本条件を確認します。スマホでは部隊選択ドロップダウンを使います。',tab:'formation'},
      {title:'部隊編成内のタブ',target:'.formation-work-tabs',body:'部隊編成内には、配置を行う「編成」、戦法攻撃を確認する「戦法」、状態変化率を見る「変化率」、合算技能などを見る「詳細」があります。',tab:'formation'},
      {title:'配置パネルで枠を選択',target:'.formation-board-card,.formation-team-grid-selectable',body:'主将・副将・補佐・侍従などの枠を選択します。枠を選ぶと、右側またはダイアログで配置する武将を選べます。',tab:'formation',formationInnerTab:'edit'},
      {title:'武将編集画面で装備や条件を設定',target:'.formation-selected-editor-main,.formation-selected-card:not(.formation-warhorse-assignment-card)',body:'選択した武将には、武器・防具・文物、技能条件、侍従などを設定します。保存データ表示では、お気に入り登録済みの所持データを前提に選びます。',tab:'formation',formationInnerTab:'edit'},
      {title:'兵器・武装・異民族武将',target:'.formation-extension-panel,.formation-extension-grid',body:'兵器・武装・異民族武将は、部隊条件に応じて追加効果やパラメータに反映されます。攻城や駐屯向けの確認で重要です。',tab:'formation',formationInnerTab:'edit'},
      {title:'参軍と軍馬',target:'.formation-advisor-row,.formation-warhorse-editor-card',body:'参軍と軍馬も部隊結果に反映されます。PCでは武将編集画面の下、スマホでは配置パネルの参軍の下に軍馬が表示されます。',tab:'formation',formationInnerTab:'edit'},
      {title:'変化率タブで状態変化率を確認',target:'.formation-result-focus[data-formation-work-panel="parameter"],.formation-param-section',body:'変化率タブでは、状態変化率サマリーを確認します。必要に応じて計算根拠を展開できます。',tab:'formation',formationInnerTab:'parameter'}
    ],
    warhorse:[
      {title:'軍馬編成ガイドを開始します',target:'#warhorseScreen',body:'軍馬編成では、通常馬・名馬の登録、技能レベル、名馬の将星を管理します。部隊への割当は、部隊編成画面の軍馬枠で行います。',tab:'warhorse'},
      {title:'所有軍馬一覧を確認',target:'.warhorse-list,#warhorseRoot',body:'作成済みの軍馬を一覧で確認します。通常馬と名馬で、設定できる技能や将星の扱いが異なります。',tab:'warhorse'},
      {title:'軍馬を作成',target:'.warhorse-create-segment,#warhorseOpenCreateBtn',body:'新しい軍馬を作成します。通常馬は通常軍馬技能、名馬は固有軍馬技能と将星効果を管理します。',tab:'warhorse'},
      {title:'軍馬を編集',target:'.warhorse-editor-form,#warhorseEditorForm,.warhorse-card',body:'軍馬名、技能、技能Lv、名馬の将星などを編集します。保存した軍馬は、部隊編成画面の軍馬枠から割り当てます。',tab:'warhorse'},
      {title:'部隊編成画面で割り当て',target:'#mainTabPanel',body:'軍馬編成画面では、部隊への割当操作は行いません。部隊へ割り当てる場合は、上部の「部隊編成」タブを開き、編成画面の軍馬枠から通常馬・名馬を選択します。',tab:'warhorse'},
      {title:'部隊編成結果に反映',target:'#mainTabPanel',body:'部隊編成画面で軍馬を割り当てると、軍馬技能や名馬将星効果が部隊結果へ反映されます。割当後は部隊編成タブの変化率を確認してください。',tab:'warhorse'}
    ]
  };
}
function getCurrentGuidedTourKey(){
  const tab=normalizeMainTab(state.mainTab||'search');
  if(tab==='formation')return 'formation';
  if(tab==='warhorse')return 'warhorse';
  return 'search';
}
function getGuidedTourStepTarget(step){
  const selectors=String(step?.target||'').split(',').map(v=>v.trim()).filter(Boolean);
  for(const sel of selectors){
    try{const el=document.querySelector(sel);if(el&&el.getClientRects&&el.getClientRects().length)return el;}catch{}
  }
  for(const sel of selectors){
    try{const el=document.querySelector(sel);if(el)return el;}catch{}
  }
  const key=guidedTourState.tourKey||getCurrentGuidedTourKey();
  const fallback=key==='formation'?'#formationScreen':(key==='warhorse'?'#warhorseScreen':'#searchPanel');
  try{return document.querySelector(fallback)||document.getElementById('appTitlePanel');}catch{return document.getElementById('appTitlePanel');}
}
function applyGuidedTourStepAction(step){
  if(step&&step.tab&&normalizeMainTab(state.mainTab)!==step.tab){
    setMainTab(step.tab);
  }
  // FIX[HADO-2.9.6.1-GUIDE-SEARCH-MODE-TARGET]: 非表示中の検索要素へ枠を当てない。説明対象モードへ切り替えてから位置計算する。
  if(step&&step.expandSearchPanel&&normalizeMainTab(state.mainTab)==='search'){
    try{setSearchDialogCollapsed(false,false);}catch(err){debugLog('guidedTour:search-expand-error',{message:err?.message||String(err)});}
  }
  if(step&&step.searchMode&&normalizeMainTab(state.mainTab)==='search'){
    try{setSearchMode(step.searchMode,{skipHistory:true});}catch(err){debugLog('guidedTour:search-mode-error',{mode:step.searchMode,message:err?.message||String(err)});}
  }
  // FIX[HADO-2.9.0.0-GUIDE-FORMATION-STEP8]: 部隊編成ガイドの後半は、説明対象の内部タブへ明示的に切り替えてからスポットライト位置を計算する。
  // 8/8は状態変化率サマリーを説明するため、編成タブのままではなく「変化率」タブを正しく選択する。
  if(step&&step.formationInnerTab&&normalizeMainTab(state.mainTab)==='formation'){
    try{setFormationInnerTab(step.formationInnerTab);}catch(err){debugLog('guidedTour:formation-inner-tab-error',{tab:step.formationInnerTab,message:err?.message||String(err)});}
  }
  if(step&&step.formationResultTab&&normalizeMainTab(state.mainTab)==='formation'){
    try{setFormationResultTab(step.formationResultTab);}catch(err){debugLog('guidedTour:formation-result-tab-error',{tab:step.formationResultTab,message:err?.message||String(err)});}
  }
  if(step&&step.openDataSheet){
    try{openDataManagementSheet();}catch{}
  }
  if(step&&step.dataMode==='saved'){
    try{setViewMode('saved');syncDataManagementSheet('guided-tour-saved');updateDataContextBar('guided-tour-saved');}catch{}
  }
  if(step&&step.closeDataSheet){
    try{closeDataManagementSheet();}catch{}
  }
}
function clearGuidedTourFocus(){
  if(guidedTourState.lastTarget&&guidedTourState.lastTarget.classList)guidedTourState.lastTarget.classList.remove('guided-tour-focus');
  guidedTourState.lastTarget=null;
}
function isGuidedTourMobileViewport(){
  try{return !!(window.matchMedia&&((window.matchMedia('(max-width:980px)').matches)||(window.matchMedia('(pointer:coarse)').matches)));}catch{return (window.innerWidth||0)<=980;}
}
function getGuidedTourViewportSize(){
  return {vw:window.innerWidth||document.documentElement.clientWidth||360,vh:window.innerHeight||document.documentElement.clientHeight||640};
}
function getGuidedTourBubbleHeight(){
  const ge=getGuidedTourElements();
  const bubble=ge.bubble;
  const {vh}=getGuidedTourViewportSize();
  if(!bubble)return Math.min(360,Math.max(220,Math.round(vh*0.42)));
  const rect=bubble.getBoundingClientRect();
  const h=(rect&&Number.isFinite(rect.height)&&rect.height>0)?rect.height:Math.min(360,Math.max(220,Math.round(vh*0.42)));
  return Math.min(Math.max(120,h),Math.max(140,Math.round(vh*0.56)));
}
function getGuidedTourSpotRect(targetRect){
  const {vw,vh}=getGuidedTourViewportSize();
  if(!targetRect||!Number.isFinite(targetRect.top))return null;
  const left=Math.max(8,Math.min(vw-48,targetRect.left-8));
  const top=Math.max(8,Math.min(vh-42,targetRect.top-8));
  const right=Math.min(vw-8,targetRect.right+8);
  const bottom=Math.min(vh-8,targetRect.bottom+8);
  return {left,top,right,bottom,width:Math.max(40,right-left),height:Math.max(34,bottom-top)};
}
function getVerticalOverlap(aTop,aBottom,bTop,bBottom){
  return Math.max(0,Math.min(aBottom,bBottom)-Math.max(aTop,bTop));
}
function getGuidedTourAutoDock(targetRect){
  const {vh}=getGuidedTourViewportSize();
  const margin=12;
  const bubbleH=getGuidedTourBubbleHeight();
  const spot=getGuidedTourSpotRect(targetRect);
  if(!spot)return 'bottom';
  const topPanel={top:margin,bottom:margin+bubbleH};
  const bottomPanel={top:Math.max(margin,vh-margin-bubbleH),bottom:vh-margin};
  const topOverlap=getVerticalOverlap(topPanel.top,topPanel.bottom,spot.top,spot.bottom);
  const bottomOverlap=getVerticalOverlap(bottomPanel.top,bottomPanel.bottom,spot.top,spot.bottom);
  if(topOverlap===0&&bottomOverlap===0){
    const center=(spot.top+spot.bottom)/2;
    return center>(vh/2)?'top':'bottom';
  }
  if(bottomOverlap===0)return 'bottom';
  if(topOverlap===0)return 'top';
  return topOverlap<=bottomOverlap?'top':'bottom';
}
function setGuidedTourBubbleDock(dock){
  const ge=getGuidedTourElements();
  const bubble=ge.bubble;
  if(!bubble)return;
  const next=dock==='top'?'top':'bottom';
  guidedTourState.panelDock=next;
  bubble.classList.toggle('guide-dock-top',next==='top');
  bubble.classList.toggle('guide-dock-bottom',next==='bottom');
  bubble.classList.toggle('is-mobile-docked',isGuidedTourMobileViewport());
  bubble.classList.remove('is-above');
  bubble.style.left='';
  bubble.style.right='';
  bubble.style.top='';
  bubble.style.bottom='';
  bubble.style.width='';
  bubble.style.maxHeight='';
}
function recomputeGuidedTourBubbleDock(){
  if(!guidedTourState.active)return;
  guidedTourState.panelDock='';
  positionGuidedTour();
}
function applyGuidedTourSpotlightRect(spotlight,targetRect,dock){
  const {vw,vh}=getGuidedTourViewportSize();
  const spot=getGuidedTourSpotRect(targetRect);
  if(!spot){spotlight.style.display='none';return;}
  const ge=getGuidedTourElements();
  const bubble=ge.bubble;
  let left=spot.left,top=spot.top,right=spot.right,bottom=spot.bottom;
  if(bubble){
    const panel=bubble.getBoundingClientRect();
    if(panel&&Number.isFinite(panel.top)){
      const gap=8;
      if(getVerticalOverlap(top,bottom,panel.top,panel.bottom)>0){
        if(dock==='top')top=Math.min(vh-42,Math.max(top,panel.bottom+gap));
        else bottom=Math.max(top+34,Math.min(bottom,panel.top-gap));
      }
    }
  }
  left=Math.max(8,Math.min(vw-48,left));
  right=Math.min(vw-8,Math.max(left+40,right));
  top=Math.max(8,Math.min(vh-42,top));
  bottom=Math.min(vh-8,Math.max(top+34,bottom));
  if(bottom<=top+20){spotlight.style.display='none';return;}
  spotlight.style.display='block';
  spotlight.style.left=`${left}px`;
  spotlight.style.top=`${top}px`;
  spotlight.style.width=`${Math.max(40,right-left)}px`;
  spotlight.style.height=`${Math.max(34,bottom-top)}px`;
}
function scheduleGuidedTourPosition(skipScroll=false){
  if(!guidedTourState.active)return;
  guidedTourState.positionSkipScroll=!!skipScroll;
  if(guidedTourState.positionRaf)return;
  guidedTourState.positionRaf=requestAnimationFrame(()=>{
    guidedTourState.positionRaf=0;
    positionGuidedTour({skipScroll:guidedTourState.positionSkipScroll});
    guidedTourState.positionSkipScroll=false;
  });
}
function positionGuidedTour(opts={}){
  if(!guidedTourState.active)return;
  const ge=getGuidedTourElements();
  if(!ge.overlay||!ge.bubble||!ge.spotlight)return;
  const step=guidedTourState.steps[guidedTourState.index]||{};
  const target=getGuidedTourStepTarget(step);
  clearGuidedTourFocus();
  const mobile=isGuidedTourMobileViewport();
  const skipScroll=!!(opts&&opts.skipScroll);
  if(target){
    if(!skipScroll){try{target.scrollIntoView({behavior:'auto',block:mobile?'nearest':'center',inline:'nearest'});}catch{}}
    target.classList.add('guided-tour-focus');
    guidedTourState.lastTarget=target;
  }
  clearTimeout(guidedTourState.positionTimer);
  guidedTourState.positionTimer=setTimeout(()=>{
    const r=target?target.getBoundingClientRect():null;
    const autoDock=getGuidedTourAutoDock(r);
    setGuidedTourBubbleDock(autoDock);
    requestAnimationFrame(()=>{
      applyGuidedTourSpotlightRect(ge.spotlight,r,autoDock);
      if(state.showRawJson)debugLog('guidedTour:position',{dock:guidedTourState.panelDock,autoDock,mobile,targetHeight:r?Math.round(r.height):0,targetTop:r?Math.round(r.top):null,targetBottom:r?Math.round(r.bottom):null,bubbleTop:ge.bubble?Math.round(ge.bubble.getBoundingClientRect().top):null,bubbleBottom:ge.bubble?Math.round(ge.bubble.getBoundingClientRect().bottom):null});
    });
  },0);
}
function renderGuidedTourStep(){
  const ge=getGuidedTourElements();
  if(!ge.overlay||!guidedTourState.active)return;
  const step=guidedTourState.steps[guidedTourState.index]||{};
  applyGuidedTourStepAction(step);
  if(ge.kicker)ge.kicker.textContent=guidedTourState.tourKey==='intro'?'初回ガイド':(guidedTourState.tourKey==='formation'?'部隊編成ガイド':guidedTourState.tourKey==='warhorse'?'軍馬編成ガイド':'検索ガイド');
  if(ge.title)ge.title.textContent=step.title||'ガイド';
  if(ge.text)ge.text.textContent=step.body||'';
  if(ge.progress)ge.progress.textContent=`${guidedTourState.index+1} / ${guidedTourState.steps.length}`;
  if(ge.prev)ge.prev.disabled=guidedTourState.index<=0;
  if(ge.next)ge.next.textContent=guidedTourState.index>=guidedTourState.steps.length-1?'完了':'次へ';
  updateGuidedTourToggleLabel();
  scheduleGuidedTourPosition(false);
}
function startGuidedTour(tourKey,fromButton=false){
  const defs=getGuidedTourDefinitions();
  const key=defs[tourKey]?tourKey:'intro';
  // FIX[HADO-2.9.6.2-GUIDE-STARTUP-DIALOG]: 初回ガイドと起動時データ読込確認ダイアログを同時表示しない。
  if(key==='intro'){
    const startupOverlay=document.getElementById('startupDataOverlay');
    guidedTourState.suppressedStartupDataOverlay=!!(startupOverlay&&startupOverlay.classList.contains('is-visible'));
    if(startupOverlay)startupOverlay.classList.remove('is-visible');
  }
  guidedTourState.active=true;
  guidedTourState.tourKey=key;
  guidedTourState.index=0;
  guidedTourState.steps=defs[key].slice();
  guidedTourState.startedFromButton=!!fromButton;
  guidedTourState.panelDock='';
  const ge=getGuidedTourElements();
  if(ge.overlay){ge.overlay.classList.add('is-active');ge.overlay.setAttribute('aria-hidden','false');}
  document.body.classList.add('guided-tour-active');
  debugLog('guidedTour:start',{key,fromButton});
  renderGuidedTourStep();
}
function endGuidedTour(reason='end'){
  if(!guidedTourState.active)return;
  const key=guidedTourState.tourKey;
  guidedTourState.active=false;
  const ge=getGuidedTourElements();
  if(ge.overlay){ge.overlay.classList.remove('is-active');ge.overlay.setAttribute('aria-hidden','true');}
  document.body.classList.remove('guided-tour-active');
  clearGuidedTourFocus();
  if(key==='intro'){try{localStorage.setItem(GUIDED_TOUR_STORAGE_KEY,'1');}catch{}}
  // FIX[HADO-2.9.6.2-GUIDE-STARTUP-DIALOG]: ガイド終了後、未解決だったデータ読込確認を再表示する。
  if(guidedTourState.suppressedStartupDataOverlay){
    const startupOverlay=document.getElementById('startupDataOverlay');
    if(startupOverlay)startupOverlay.classList.add('is-visible');
    guidedTourState.suppressedStartupDataOverlay=false;
  }
  updateGuidedTourToggleLabel();
  debugLog('guidedTour:end',{key,reason});
}
function guidedTourNext(){
  if(!guidedTourState.active)return;
  if(guidedTourState.index>=guidedTourState.steps.length-1){endGuidedTour('complete');return;}
  guidedTourState.index+=1;
  guidedTourState.panelDock='';
  renderGuidedTourStep();
}
function guidedTourPrev(){
  if(!guidedTourState.active)return;
  guidedTourState.index=Math.max(0,guidedTourState.index-1);
  guidedTourState.panelDock='';
  renderGuidedTourStep();
}
function updateGuidedTourToggleLabel(){
  const ge=getGuidedTourElements();
  if(ge.toggle)ge.toggle.textContent=guidedTourState.active?'ガイド終了':'ガイド開始';
}
function toggleGuidedTourFromHeader(){
  if(guidedTourState.active){endGuidedTour('toggle');return;}
  startGuidedTour(getCurrentGuidedTourKey(),true);
}
function restartInitialGuidedTourFromHelp(){
  try{localStorage.removeItem(GUIDED_TOUR_STORAGE_KEY);}catch{}
  try{closeDiagnosticSheet();}catch{}
  startGuidedTour('intro',true);
}
function setupGuidedTourButtons(){
  const ge=getGuidedTourElements();
  if(ge.next)ge.next.addEventListener('click',guidedTourNext);
  if(ge.prev)ge.prev.addEventListener('click',guidedTourPrev);
  if(ge.end)ge.end.addEventListener('click',()=>endGuidedTour('button'));
  if(ge.bubble)ge.bubble.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('button'))return;recomputeGuidedTourBubbleDock();});
  window.addEventListener('resize',()=>scheduleGuidedTourPosition(true));
  window.addEventListener('scroll',()=>scheduleGuidedTourPosition(true),{passive:true});
  updateGuidedTourToggleLabel();
}
function maybeStartInitialGuidedTour(context=''){
  // FIX[HADO-2.9.6.4-GUIDE-AFTER-DATA-LOAD]: 初回ガイドはキャッシュJSON・公開JSONの読込と初期描画が完了した後だけ表示する。
  let seen=false;try{seen=localStorage.getItem(GUIDED_TOUR_STORAGE_KEY)==='1';}catch{}
  if(seen||guidedTourState.active||guidedTourState.initialAutoStartScheduled)return;
  guidedTourState.initialAutoStartScheduled=true;
  debugLog('guidedTour:intro-auto-start-scheduled',{context});
  setTimeout(()=>{
    guidedTourState.initialAutoStartScheduled=false;
    let seenNow=false;try{seenNow=localStorage.getItem(GUIDED_TOUR_STORAGE_KEY)==='1';}catch{}
    if(!seenNow&&!guidedTourState.active){
      debugLog('guidedTour:intro-auto-start',{context});
      startGuidedTour('intro',false);
    }
  },250);
}

function setupUxHomePanel(){
  const panel=document.getElementById('uxHomePanel');
  if(panel){
    panel.classList.add('is-dismissed');
    try{localStorage.setItem('hado_library_2_5_home_dismissed_v1','1');}catch{}
  }
  const click=(id,handler)=>{const el=document.getElementById(id);if(el)el.addEventListener('click',handler);};
  click('uxHomeOpenBtn',toggleGuidedTourFromHeader);
  click('uxHomeDismissBtn',()=>{if(panel)panel.classList.add('is-dismissed');try{localStorage.setItem('hado_library_2_5_home_dismissed_v1','1');}catch{}schedulePcSearchViewportLayout('uxHome:dismiss');debugLog('uxHome:dismissed');});
  click('uxPickJsonDirBtn',()=>{if(els.topPickJsonDirBtn&&!els.topPickJsonDirBtn.disabled)els.topPickJsonDirBtn.click();});
  click('uxPickJsonFilesBtn',()=>{if(els.topPickJsonFilesBtn)els.topPickJsonFilesBtn.click();});
  click('uxImportSaveBtn',()=>{if(els.importSaveDataInput){els.importSaveDataInput.value='';els.importSaveDataInput.click();}else if(els.importSaveDataBtn)els.importSaveDataBtn.click();});
  click('uxNewSaveBtn',()=>{if(els.newSaveBtn)els.newSaveBtn.click();});
  setupGuidedTourButtons();
  updateUxHomePanel('setup-guided-tour');
}


// BUGFIX[HADO-2.5.2.1-SAVE-MANAGER-COMPACT]: 保存管理パネルは折り畳み式の簡潔表示にし、更新失敗で起動停止させない
function updateSaveManagerPanel(context=''){
  try{
    if(!els.saveManagerPanel)return;
    const current=getCurrentSave();
    const saveCount=Array.isArray(state.saveData?.saves)?state.saveData.saves.length:0;
    const formationCount=Array.isArray(state.formations)?state.formations.length:0;
    const historyCount=Array.isArray(state.searchHistory)?state.searchHistory.length:0;
    const currentName=current?norm(current.name||'無題セーブ'):'未作成';
    const generals=current&&Array.isArray(current.generals)?current.generals.length:0;
    const equipments=current&&Array.isArray(current.equipments)?current.equipments.length:0;
    const inheritedCount=current&&current.inheritedSkills?Object.keys(current.inheritedSkills||{}).length:0;
    const ethnicSettingCount=current&&current.ethnicResearchSkills?Object.keys(current.ethnicResearchSkills||{}).length:0;
    const exportVersion=`hado_library_${HADO_BUILD_INFO.version}`;
    const summary=current?`${currentName} / 武将${generals}・装備${equipments} / 部隊${formationCount}`:`保存データ未作成 / 部隊${formationCount}`;
    if(els.saveManagerSummaryText)els.saveManagerSummaryText.textContent=summary;
    if(els.saveManagerCurrentValue)els.saveManagerCurrentValue.textContent=currentName;
    if(els.saveManagerCurrentNote)els.saveManagerCurrentNote.textContent=current?`保存データ ${saveCount}件中の現在選択。`:'新規保存またはImportで保存データを準備してください。';
    if(els.saveManagerOwnedValue)els.saveManagerOwnedValue.textContent=`武将${generals} / 装備${equipments}`;
    if(els.saveManagerOwnedNote)els.saveManagerOwnedNote.textContent=`継承技能${inheritedCount}件、異文化調査設定${ethnicSettingCount}件。`;
    if(els.saveManagerFormationValue)els.saveManagerFormationValue.textContent=`部隊${formationCount} / 履歴${historyCount}`;
    if(els.saveManagerFormationNote)els.saveManagerFormationNote.textContent=state.currentFormationId?`現在部隊ID: ${state.currentFormationId}`:'部隊未選択または未作成です。';
    if(els.saveManagerExportValue)els.saveManagerExportValue.textContent=exportVersion;
    if(els.saveManagerExportNote)els.saveManagerExportNote.textContent=`Export対象: 現在の保存データ、検索履歴、部隊編成。`;
    debugLog('saveManager:update',{context,currentName,saveCount,generals,equipments,formationCount,historyCount,exportVersion});
  }catch(err){
    console.error('[hado-debug] saveManager:update-error',err);
    try{debugLog('saveManager:update-error',{context,message:err?.message||String(err)});}catch{}
  }
}
function setupSaveManagerPanel(){
  try{
    if(els.saveManagerRefreshBtn)els.saveManagerRefreshBtn.addEventListener('click',()=>updateSaveManagerPanel('refresh-button'));
    if(els.saveManagerNewBtn)els.saveManagerNewBtn.addEventListener('click',async()=>{await createNewSave();updateCountStatus();updateSaveManagerPanel('new-button');});
    if(els.saveManagerCopyBtn)els.saveManagerCopyBtn.addEventListener('click',async()=>{await copyCurrentSave();updateCountStatus();updateSaveManagerPanel('copy-button');});
    if(els.saveManagerExportBtn)els.saveManagerExportBtn.addEventListener('click',()=>{updateSaveManagerPanel('before-export');exportSaveDataToFile();});
    updateSaveManagerPanel('setup');
  }catch(err){
    console.error('[hado-debug] saveManager:setup-error',err);
    try{debugLog('saveManager:setup-error',{message:err?.message||String(err)});}catch{}
  }
}


// FEATURE[HADO-2.5.2.2-DATA-BAR]: 通常時は1行データバー、切替時だけモード別設定を表示
function dataContextLoadedCount(){return (state.generals?.length||0)+(state.tactics?.length||0)+(state.skills?.length||0)+(state.equipments?.length||0)+(state.statusEffects?.length||0)+(state.siegeWeapons?.length||0)+(state.ethnicArmaments?.length||0)+(state.ethnicResearchSkills?.length||0)+(state.formationMasters?.length||0)+(state.warhorses?.length||0)+(state.warhorseSkills?.length||0);}
function getDataContextSummaryText(){
  const current=getCurrentSave?getCurrentSave():null;
  const jsonOk=dataContextLoadedCount()>0;
  const suffix=jsonOk?'':'｜JSON未読込';
  if(state.viewMode==='saved'){
    return `保存データ｜${current?norm(current.name||'無題セーブ'):'未作成'}${suffix}`;
  }
  return `全データ｜武将:${generalStageLabel(state.generalStage)}｜装備:${equipmentStageLabel(state.equipmentStage)}${suffix}`;
}
function updateDataContextBar(context=''){
  try{
    const summary=document.getElementById('dataContextSummary');
    if(summary)summary.textContent=getDataContextSummaryText();
    const fileStatus=document.getElementById('dataFileStatusText');
    if(fileStatus){
      const loaded=dataContextLoadedCount()>0;
      fileStatus.textContent=loaded?(IS_WEB_DEPLOYMENT?`ウェブ版：公開JSONを自動読込済｜武将${state.generals.length} / 戦法${state.tactics.length} / 技能${state.skills.length} / 装備${state.equipments.length} / 陣形${state.formationMasters.length}`:`JSON読込済：武将${state.generals.length} / 戦法${state.tactics.length} / 技能${state.skills.length} / 装備${state.equipments.length} / 陣形${state.formationMasters.length}`):(IS_WEB_DEPLOYMENT?'ウェブ版：公開JSONを自動取得中です。失敗時はページを再読込してください。':'JSON未読込：JSONフォルダまたはJSONファイルを選択してください。');
    }
    syncDataManagementSheet(context);
    debugLog('dataContext:update',{context,summary:summary?summary.textContent:'',viewMode:state.viewMode,generalStage:state.generalStage,equipmentStage:state.equipmentStage});
  }catch(err){try{debugLog('dataContext:update-error',{context,message:err?.message||String(err)});}catch{}}
}
function setSheetHidden(id,hidden){const el=document.getElementById(id);if(el)el.hidden=!!hidden;}
function syncDataManagementSheet(context=''){
  const allActive=state.viewMode!=='saved';
  document.getElementById('dataModeAllBtn')?.classList.toggle('is-active',allActive);
  document.getElementById('dataModeSavedBtn')?.classList.toggle('is-active',!allActive);
  document.getElementById('dataAllOptions')?.classList.toggle('is-hidden',!allActive);
  document.getElementById('dataSavedOptions')?.classList.toggle('is-hidden',allActive);
  document.querySelectorAll('[data-general-stage]').forEach(btn=>btn.classList.toggle('is-active',btn.getAttribute('data-general-stage')===normalizeGeneralStage(state.generalStage)));
  document.querySelectorAll('[data-equipment-stage]').forEach(btn=>btn.classList.toggle('is-active',btn.getAttribute('data-equipment-stage')===normalizeEquipmentStage(state.equipmentStage)));
  const select=document.getElementById('dataSheetSaveSelect');
  if(select){
    const currentValue=select.value;
    select.innerHTML='';
    const saves=Array.isArray(state.saveData?.saves)?state.saveData.saves:[];
    if(!saves.length){const opt=document.createElement('option');opt.value='';opt.textContent='保存データ未作成';select.appendChild(opt);select.disabled=true;}
    else{saves.forEach(save=>{const opt=document.createElement('option');opt.value=save.id;opt.textContent=save.name||'無題セーブ';if(save.id===state.saveData.currentSaveId)opt.selected=true;select.appendChild(opt);});select.disabled=false;}
    if(currentValue&&[...select.options].some(o=>o.value===currentValue)&&!state.saveData.currentSaveId)select.value=currentValue;
  }
}
function openDataManagementSheet(){updateDataContextBar('open-sheet');setSheetHidden('dataManagementSheet',false);}
function closeDataManagementSheet(){setSheetHidden('dataManagementSheet',true);updateDataContextBar('close-sheet');}
function updateDiagnosticAppVersion(){const el=document.getElementById('diagnosticAppVersion');if(el)el.textContent=`覇道ライブラリ｜v${HADO_BUILD_INFO.version}`;}
function openDiagnosticSheet(){updateDiagnosticAppVersion();setSheetHidden('diagnosticSheet',false);}
function closeDiagnosticSheet(){setSheetHidden('diagnosticSheet',true);}
function setupDataContextControls(){
  const click=(id,handler)=>{const el=document.getElementById(id);if(el)el.addEventListener('click',handler);};
  click('dataContextSummary',openDataManagementSheet);
  const dataSummary=document.getElementById('dataContextSummary');
  if(dataSummary)dataSummary.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDataManagementSheet();}});
  click('dataSheetCloseTopBtn',closeDataManagementSheet);
  click('dataSheetCloseBtn',closeDataManagementSheet);
  document.querySelectorAll('[data-data-sheet-close]').forEach(el=>el.addEventListener('click',closeDataManagementSheet));
  click('diagnosticMenuOpenBtn',openDiagnosticSheet);
  click('restartIntroGuideBtn',restartInitialGuidedTourFromHelp);
  click('diagnosticCloseTopBtn',closeDiagnosticSheet);
  click('diagnosticCloseBtn',closeDiagnosticSheet);
  document.querySelectorAll('[data-diagnostic-close]').forEach(el=>el.addEventListener('click',closeDiagnosticSheet));
  click('dataModeAllBtn',()=>{setViewMode('all');syncDataManagementSheet('mode-all');updateDataContextBar('mode-all');});
  click('dataModeSavedBtn',()=>{setViewMode('saved');syncDataManagementSheet('mode-saved');updateDataContextBar('mode-saved');});
  document.querySelectorAll('[data-general-stage]').forEach(btn=>btn.addEventListener('click',()=>setGeneralStage(btn.getAttribute('data-general-stage'))));
  document.querySelectorAll('[data-equipment-stage]').forEach(btn=>btn.addEventListener('click',()=>setEquipmentStage(btn.getAttribute('data-equipment-stage'))));
  const saveSel=document.getElementById('dataSheetSaveSelect');
  if(saveSel)saveSel.addEventListener('change',async()=>{await runWithUiBusy('保存データを切り替えています…','保存データの索引と表示を更新しています。',async()=>{markSaveSwitchBusyContext('save-select-data-sheet');clearWarhorseUndoToast('save-select-data-sheet');state.saveData.currentSaveId=norm(saveSel.value||'');persistSaveData();rebuildSavedModeIndex();renderSaveControls();renderSearchResults();renderDetail();if(state.mainTab==='formation')renderFormationScreen();updateDataContextBar('save-select');});});
  click('dataSheetNewSaveBtn',async()=>{await createNewSave();updateDataContextBar('new-save');});
  click('dataSheetCopySaveBtn',async()=>{await copyCurrentSave();updateDataContextBar('copy-save');});
  click('dataSheetRenameSaveBtn',async()=>{await renameCurrentSave();updateDataContextBar('rename-save');});
  click('dataSheetDeleteSaveBtn',()=>{deleteCurrentSave();updateDataContextBar('delete-save');});
  click('dataSheetExportBtn',()=>{exportSaveDataToFile();updateDataContextBar('export');});
  click('dataSheetImportBtn',()=>{if(els.importSaveDataInput){els.importSaveDataInput.value='';els.importSaveDataInput.click();}});
  click('dataSheetJsonDirBtn',()=>{if(els.topPickJsonDirBtn&&!els.topPickJsonDirBtn.disabled)els.topPickJsonDirBtn.click();});
  click('dataSheetJsonFilesBtn',()=>{if(els.topPickJsonFilesInput){els.topPickJsonFilesInput.value='';els.topPickJsonFilesInput.click();}else if(els.topPickJsonFilesBtn)els.topPickJsonFilesBtn.click();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(isSaveInputModalOpen())return;closeDataManagementSheet();closeDiagnosticSheet();}});
  updateDataContextBar('setup');
}

function setupMobileSwipeNavigation(){
  let touchStart=null;
  const thresholdX=55;
  const maxVerticalRatio=1.25;
  document.addEventListener('touchstart',e=>{
    if(!isResponsiveMobileMode())return;
    if(!e.touches||e.touches.length!==1)return;
    const t=e.touches[0];
    const target=e.target;
    touchStart={x:t.clientX,y:t.clientY,time:Date.now(),target,detailContext:getMobileSwipeDetailContext(target),interactive:isMobileSwipeInteractiveTarget(target)};
  },{passive:true});
  document.addEventListener('touchend',e=>{
    if(!touchStart)return;
    const start=touchStart;
    touchStart=null;
    if(!isResponsiveMobileMode())return;
    if(start.interactive){debugLog('mobileSwipe:ignored',{reason:'interactive-target'});return;}
    const changed=e.changedTouches&&e.changedTouches[0];
    if(!changed){debugLog('mobileSwipe:ignored',{reason:'no-changed-touch'});return;}
    const dx=changed.clientX-start.x;
    const dy=changed.clientY-start.y;
    const absX=Math.abs(dx);
    const absY=Math.abs(dy);
    if(absX<thresholdX||absX<absY*maxVerticalRatio){debugLog('mobileSwipe:ignored',{reason:'vertical-or-small',dx:Number(dx.toFixed(1)),dy:Number(dy.toFixed(1)),absX:Number(absX.toFixed(1)),absY:Number(absY.toFixed(1))});return;}
    const direction=dx<0?1:-1;
    const handled=start.detailContext?switchDetailTabBySwipe(direction):switchMainTabBySwipe(direction);
    if(handled&&e.cancelable)e.preventDefault();
  },{passive:false});
  debugLog('mobileSwipe:setup',{enabled:true});
}

function updateMobileStickyHeaderOffsets(mobile,context='') {
  const root=document.documentElement;
  const header=document.getElementById('appTitlePanel');
  const tabs=document.getElementById('mainTabPanel');
  if(!root)return;
  if(header&&tabs){
    const headerHeight=Math.ceil(header.getBoundingClientRect().height||0);
    const tabHeight=Math.ceil(tabs.getBoundingClientRect().height||0);
    const gap=0;
    const stackGap=10;
    const tabTop=headerHeight+gap;
    const stackSpace=headerHeight+gap+tabHeight+stackGap;
    root.style.setProperty('--mobile-main-tab-sticky-top', `${tabTop}px`);
    root.style.setProperty('--mobile-main-tab-fixed-top', `${tabTop}px`);
    root.style.setProperty('--mobile-fixed-stack-space', `${stackSpace}px`);
    tabs.setAttribute('data-mobile-sticky-tabs','1');
    debugLog('mobileStickyHeader:offset',{context,headerHeight,tabHeight,gap,tabTop,stackSpace,mode:'fixed',mobile});
  }else{
    root.style.removeProperty('--mobile-main-tab-sticky-top');
    root.style.removeProperty('--mobile-main-tab-fixed-top');
    root.style.removeProperty('--mobile-fixed-stack-space');
    if(tabs)tabs.removeAttribute('data-mobile-sticky-tabs');
  }
}
function applyResponsiveLayout(context='') {
const mobile=isResponsiveMobileMode();
const app=document.querySelector('.app');
const headerPanel=app?app.firstElementChild:null;
const pcPanel=els.searchHistory?els.searchHistory.closest('.pc-search-history-panel'):null;
const mobilePanel=els.mobileSearchHistorySelect?els.mobileSearchHistorySelect.closest('.mobile-search-history-panel'):null;
const resultWrap=els.resultSelect?els.resultSelect.closest('.result-select-wrap'):null;
const mainTabPanel=document.getElementById('mainTabPanel');
const searchPanel=document.querySelector('.search-wrap');
updateMobileStickyHeaderOffsets(mobile,context);
if(mobilePanel&&app&&mainTabPanel){
  // スマホ検索履歴は「検索/部隊編成タブ」と「検索パネル」の間に固定する。
  // DOM順だけでなくCSS orderでも補正するため、ZIP展開後や再描画後でも位置が戻る。
  const desiredAnchor=(searchPanel&&searchPanel.parentElement===app)?searchPanel:(mainTabPanel.nextElementSibling||null);
  if(desiredAnchor&&mobilePanel.nextElementSibling!==desiredAnchor){
    app.insertBefore(mobilePanel,desiredAnchor);
  }else if(!desiredAnchor&&mobilePanel.previousElementSibling!==mainTabPanel){
    mainTabPanel.insertAdjacentElement('afterend',mobilePanel);
  }
}
if(mobile){
const formation=state.mainTab==='formation';
if(mainTabPanel)mainTabPanel.style.setProperty('order','30','important');
if(mobilePanel)mobilePanel.style.setProperty('order','31','important');
if(searchPanel)searchPanel.style.setProperty('order','32','important');
const layoutPanel=document.querySelector('.layout');
if(layoutPanel)layoutPanel.style.setProperty('order','33','important');
if(els.formationScreen)els.formationScreen.style.setProperty('order','34','important');
if(pcPanel){pcPanel.style.setProperty('display','none','important');}
if(mobilePanel){
  if(formation){
    mobilePanel.style.setProperty('display','none','important');
  }else{
    mobilePanel.style.setProperty('display','block','important');
    mobilePanel.style.setProperty('position','static','important');
    mobilePanel.style.setProperty('width','auto','important');
    mobilePanel.style.setProperty('max-height','none','important');
    mobilePanel.style.setProperty('overflow','visible','important');
    mobilePanel.style.setProperty('z-index','auto','important');
  }
}
if(els.mobileSearchHistorySelect){els.mobileSearchHistorySelect.style.setProperty('display',formation?'none':'block','important');}
if(els.searchHistory){els.searchHistory.style.setProperty('display','none','important');}
if(els.results){els.results.style.setProperty('display','none','important');}
if(resultWrap){resultWrap.style.setProperty('display','grid','important');resultWrap.style.setProperty('gap','8px');}
}else{
if(mainTabPanel)mainTabPanel.style.removeProperty('order');
if(mobilePanel)mobilePanel.style.removeProperty('order');
if(searchPanel)searchPanel.style.removeProperty('order');
const layoutPanel=document.querySelector('.layout');
if(layoutPanel)layoutPanel.style.removeProperty('order');
if(els.formationScreen)els.formationScreen.style.removeProperty('order');
if(pcPanel){pcPanel.style.removeProperty('display');pcPanel.style.removeProperty('position');pcPanel.style.removeProperty('width');pcPanel.style.removeProperty('max-height');pcPanel.style.removeProperty('overflow');pcPanel.style.removeProperty('z-index');}
if(mobilePanel){mobilePanel.style.removeProperty('display');mobilePanel.style.removeProperty('position');mobilePanel.style.removeProperty('width');mobilePanel.style.removeProperty('max-height');mobilePanel.style.removeProperty('overflow');mobilePanel.style.removeProperty('z-index');}
if(els.mobileSearchHistorySelect){els.mobileSearchHistorySelect.style.removeProperty('display');}
if(els.searchHistory){els.searchHistory.style.removeProperty('display');}
if(els.results){els.results.style.removeProperty('display');}
if(resultWrap){resultWrap.style.removeProperty('display');resultWrap.style.removeProperty('gap');}
}
if(state.mainTab==='formation'){getSearchModeElements().forEach(el=>el.classList.add('tab-content-hidden'));if(els.formationScreen)els.formationScreen.classList.remove('tab-content-hidden');}
if(state.mainTab==='formation'){
  document.querySelectorAll('.formation-param-section').forEach(el=>{if(el&&'open' in el)el.open=true;});
  document.querySelectorAll('.formation-skill-section,.formation-extension-parameter-section,.formation-extension-param-details').forEach(el=>{if(el&&'open' in el)el.open=!mobile;});
  document.querySelectorAll('.formation-timing-details').forEach(el=>{if(el&&'open' in el){const t=el.getAttribute('data-formation-timing')||'';el.open=!mobile||t==='deploy'||t==='normal';}});
}
schedulePcSearchViewportLayout('applyResponsiveLayout:'+context);
debugLog('applyResponsiveLayout',{context,mobile,order:getElementOrderInfo()});
}
function loadSearchHistory(){
try{
const raw=JSON.parse(localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY)||'[]');
if(Array.isArray(raw)&&raw.length)return uniq(raw);
}catch{}
try{
const saved=JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY)||'{}');
if(Array.isArray(saved?.searchHistory)&&saved.searchHistory.length)return uniq(saved.searchHistory);
}catch{}
return [];
}
function persistSearchHistory(){
const list=sanitizeSearchHistoryList(state.searchHistory||[]);
state.searchHistory=list;
try{localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY,JSON.stringify(list));}catch(err){debugLog('persistSearchHistory:localStorage-error',{message:err?.message||String(err)});}
try{state.saveData={...(state.saveData||defaultSaveData()),searchHistory:list};localStorage.setItem(SAVE_STORAGE_KEY,JSON.stringify(state.saveData));saveMirrorSet(state.saveData,'persistSearchHistory').catch(err=>debugLog('persistSearchHistory:mirror-error',{message:err?.message||String(err)}));}catch(err){debugLog('persistSearchHistory:saveDataStorage-error',{message:err?.message||String(err)});saveMirrorSet(state.saveData,'persistSearchHistory-after-localStorage-error').catch(e=>debugLog('persistSearchHistory:mirror-after-error-failed',{message:e?.message||String(e)}));}
}
function populateSearchHistorySelect(selectEl,list){if(!selectEl)return;selectEl.innerHTML='';const empty=document.createElement('option');empty.value='';empty.textContent=list.length?'検索履歴を選択':'履歴なし';selectEl.appendChild(empty);list.forEach(keyword=>{const opt=document.createElement('option');opt.value=keyword;opt.textContent=keyword;selectEl.appendChild(opt);});selectEl.disabled=!list.length;}
function renderSearchHistory(){applyResponsiveLayout('renderSearchHistory:start');const list=Array.isArray(state.searchHistory)?state.searchHistory:[];debugLog('renderSearchHistory:start',{count:list.length,first:list[0]||'',hasMobileSelect:!!els.mobileSearchHistorySelect,hasList:!!els.searchHistory});populateSearchHistorySelect(els.mobileSearchHistorySelect,list);if(!els.searchHistory){applyResponsiveLayout('renderSearchHistory:no-list');debugResponsiveSnapshot('renderSearchHistory:no-list');return;}els.searchHistory.innerHTML='';if(!list.length){els.searchHistory.innerHTML='<div class="search-history-empty">履歴なし</div>';applyResponsiveLayout('renderSearchHistory:empty');debugResponsiveSnapshot('renderSearchHistory:empty');return;}list.forEach(keyword=>{const row=document.createElement('div');row.className='search-history-item';const btn=document.createElement('button');btn.type='button';btn.className='search-history-keyword';btn.textContent=keyword;btn.title=keyword;btn.addEventListener('click',()=>{els.searchInput.value=keyword;renderSearchResults();renderDetail();pushOperationHistory('search-history');});const del=document.createElement('button');del.type='button';del.className='search-history-delete';del.textContent='×';del.setAttribute('aria-label',keyword+' を削除');del.addEventListener('click',()=>{state.searchHistory=(state.searchHistory||[]).filter(v=>v!==keyword);persistSearchHistory();renderSearchHistory();});row.appendChild(btn);row.appendChild(del);els.searchHistory.appendChild(row);});applyResponsiveLayout('renderSearchHistory:end');debugResponsiveSnapshot('renderSearchHistory:end');}
function registerSearchHistory(keyword){const q=norm(keyword);if(!q)return;state.searchHistory=[q,...(state.searchHistory||[]).filter(v=>v!==q)];persistSearchHistory();renderSearchHistory();}
function setLoadingState(visible,{title='読込中…',detail='',current=0,total=0}={}){if(!els.loadOverlay)return;els.loadOverlay.classList.toggle('is-visible',!!visible);if(!visible)return;const safeTotal=total>0?total:0;const percent=safeTotal?Math.max(0,Math.min(100,Math.round((current/safeTotal)*100))):0;els.loadTitle.textContent=title;els.loadDetail.textContent=detail||'';els.loadProgressBar.max=safeTotal||100;els.loadProgressBar.value=safeTotal?Math.min(current,safeTotal):0;els.loadPercent.textContent=`${percent}%`;els.loadCounts.textContent=safeTotal?`${Math.min(current,safeTotal)} / ${safeTotal}`:'準備中';}
function hideLoadingState(){if(els.loadOverlay)els.loadOverlay.classList.remove('is-visible');}
async function runWithUiBusy(title,detail,fn){
  setLoadingState(true,{title:title||'処理中…',detail:detail||'少しお待ちください。',current:0,total:0});
  await nextFrame();
  try{return await fn();}
  finally{await nextFrame();hideLoadingState();}
}
function markSaveSwitchBusyContext(reason){debugLog('saveData:busy',{reason});}
function nextFrame(){return new Promise(resolve=>setTimeout(resolve,0));}
const createSaveId=()=>`save_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
function defaultSaveData(){return {saves:[],currentSaveId:'',searchHistory:[]};}
function normalizeNumericSettingValue(value){if(value===0||value==='0')return '0';return norm(value);}
function normalizeAdvisorLevelValue(value){const v=norm(value);if(!v||v==='なし'||v==='none'||v==='未設定')return '';const n=Number(v);if(!Number.isFinite(n))return '';return String(Math.max(0,Math.min(10,Math.floor(n))));}
function advisorLevelLabel(value){const v=normalizeAdvisorLevelValue(value);return v===''?'なし':v;}
function normalizeSkillLevelValue(value){const v=norm(value);return ROMAN_LEVELS.includes(v)?v:'';}
function normalizeGeneralSetting(setting){
const legacySkillCount=setting&&typeof setting==='object'&&setting.skills&&typeof setting.skills==='object'?Object.keys(setting.skills).length:0;
if(legacySkillCount)debugLog('saveData:legacy-general-skills-ignored',{count:legacySkillCount,policy:'武将技能Lvは保存データに保持せず、将星から自動解決する'});
const abilities=Object.fromEntries(Object.entries(setting?.abilities||{}).map(([key,val])=>[norm(key),normalizeNumericSettingValue(val)]).filter(([key])=>!!key));
const fiveElements=Object.fromEntries(Object.entries(setting?.fiveElements||{}).map(([key,val])=>[norm(key),normalizeNumericSettingValue(val)]).filter(([key])=>!!key));
const hasAdvisorLevel=setting&&typeof setting==='object'&&Object.prototype.hasOwnProperty.call(setting,'advisorLevel');
const advisorLevel=hasAdvisorLevel?normalizeAdvisorLevelValue(setting.advisorLevel):'';
return {abilities,fiveElements,advisorLevel};
}
function normalizeSaveItemName(name){return norm(name).replace(/（[^）]*）/g,'').trim();}
function mergeGeneralSettingValue(prev,val){const base=normalizeGeneralSetting(prev||{});const next=normalizeGeneralSetting(val||{});const valHasAdvisor=val&&typeof val==='object'&&Object.prototype.hasOwnProperty.call(val,'advisorLevel');return {abilities:{...base.abilities,...next.abilities},fiveElements:{...base.fiveElements,...next.fiveElements},advisorLevel:valHasAdvisor?next.advisorLevel:base.advisorLevel};}
function buildCanonicalValueMap(obj,normalizeValue){const out={};Object.entries(obj||{}).forEach(([rawKey,val])=>{const key=normalizeSaveItemName(rawKey);if(!key)return;out[key]=normalizeValue(val,out[key],rawKey,key);});return out;}

function sanitizeEthnicResearchSkillSettings(settings){
  const out={};
  Object.entries(settings||{}).forEach(([rawName,val])=>{
    const name=normalizeSaveItemName(rawName);
    if(!name)return;
    const level=normalizeSkillLevelValue(val?.level||val?.roman||'Ⅰ')||'Ⅰ';
    out[name]={enabled:!!val?.enabled,level};
  });
  return out;
}

function sanitizeInheritedSkillSettings(settings){
  const out={};
  Object.entries(settings||{}).forEach(([rawName,val])=>{
    const generalName=normalizeSaveItemName(rawName);
    if(!generalName)return;
    const skillName=normalizeSaveItemName(typeof val==='string'?val:(val?.skillName||val?.name||''));
    if(!skillName)return;
    const sourceGeneralNames=uniq((Array.isArray(val?.sourceGeneralNames)?val.sourceGeneralNames:[val?.sourceGeneralName||val?.sourceGeneral||'']).map(normalizeSaveItemName).filter(Boolean));
    out[generalName]={skillName,sourceGeneralNames,enabled:val?.enabled===false?false:true};
  });
  return out;
}
function isLRGeneralItem(item){const talent=getGeneralTalentValue(item);const name=getItemDisplayName(item);return talent===1400||talent===1300||/^LR/.test(name);}
function isValidInheritableSkillName(skillName){const n=normalizeSaveItemName(skillName);if(!n)return false;if(/^(Lv|Lv1|星)$/.test(n))return false;if(/^\d+(?:\.\d+)?$/.test(n))return false;if(!findSkillItemByName(n))return false;return true;}
function getGeneralNormalSkillEntries(item){return getRawGeneralSkillEntries(item).filter(e=>!e.isAdvisor&&isValidInheritableSkillName(e.name));}

function getGeneralOwnedSkillKind(item,skillName){
  const name=normalizeSaveItemName(skillName);
  if(!item||!name)return 'その他';
  const talent=getGeneralTalentValue(item);
  const normal=getGeneralNormalSkillEntries(item);
  const idx=normal.findIndex(e=>normalizeSaveItemName(e.name)===name);
  if(idx<0)return 'その他';
  const pos=idx+1;
  if(talent===1400||talent===1300){
    if(pos===1)return 'LR固有';
    if(pos===2)return '継承';
    if(pos===3)return '将星4成長';
    if(pos===4)return '将星2成長';
    if(pos===5)return '将星7覚醒';
    return 'その他';
  }
  if(talent===1200||talent===1100||talent===1000){
    if(pos===1)return 'UR固有';
    if(pos===2)return '将星4成長';
    if(pos===3)return '将星2成長';
    if(pos===4)return '将星7覚醒';
    return 'その他';
  }
  if(talent===875){
    if(pos===1)return '将星7覚醒';
    if(pos===2)return '将星4成長';
    if(pos===3)return '将星2成長';
    return 'その他';
  }
  return 'その他';
}
function isFormationGeneralSkillKind(value){return ['LR固有','継承','UR固有','将星4成長','将星7覚醒','その他','将星2成長'].includes(value);}
function getCurrentOwnedSkillNameSet(item){return new Set([...getResolvedGeneralSkillLevelMap(item).keys()].map(normalizeSaveItemName));}
function buildInheritedSkillCandidateMaster(targetGeneralName=''){
  const current=getCurrentSave();
  const targetName=normalizeSaveItemName(targetGeneralName||'');
  const targetItem=targetName?findItemByDisplayName('generals',targetName):null;
  const currentOwned=targetItem?getCurrentOwnedSkillNameSet(targetItem):new Set();
  const map=new Map();
  const ownedGeneralNames=new Set((current?.generals||[]).map(normalizeSaveItemName));
  (state.generals||[]).forEach(g=>{
    const sourceName=normalizeSaveItemName(getItemDisplayName(g));
    if(!sourceName||!ownedGeneralNames.has(sourceName)||!isLRGeneralItem(g))return;
    const normal=getGeneralNormalSkillEntries(g);
    const second=normal[1]?.name||'';
    const skillName=normalizeSaveItemName(second);
    if(!isValidInheritableSkillName(skillName))return;
    if(targetName&&currentOwned.has(skillName))return;
    if(!map.has(skillName))map.set(skillName,{skillName,sourceGeneralNames:[],sourceGeneralItems:[]});
    const row=map.get(skillName);
    row.sourceGeneralNames.push(sourceName);
    row.sourceGeneralItems.push(g);
  });
  const candidates=[...map.values()].map(v=>({...v,sourceGeneralNames:uniq(v.sourceGeneralNames)})).sort((a,b)=>a.skillName.localeCompare(b.skillName,'ja'));
  debugLog('inheritedSkill:candidates-built',{targetGeneralName:targetName,ownedSourceGeneralCount:ownedGeneralNames.size,candidateCount:candidates.length,candidates:candidates.slice(0,30).map(c=>({skillName:c.skillName,sources:c.sourceGeneralNames}))});
  return candidates;
}
function getCurrentInheritedSkill(generalName){const current=getCurrentSave();const key=normalizeSaveItemName(generalName);const row=current?.inheritedSkills?.[key];if(!row||row.enabled===false||!normalizeSaveItemName(row.skillName))return null;return {skillName:normalizeSaveItemName(row.skillName),sourceGeneralNames:uniq((row.sourceGeneralNames||[]).map(normalizeSaveItemName).filter(Boolean)),enabled:true};}
function pruneInvalidInheritedSkillsForCurrentSave(context=''){
  const current=getCurrentSave();
  if(!current||!current.inheritedSkills||!state.generals?.length||!state.skills?.length)return {changed:false,removed:[]};
  const removed=[];
  Object.entries({...current.inheritedSkills}).forEach(([rawGeneral,row])=>{
    const general=normalizeSaveItemName(rawGeneral);const skill=normalizeSaveItemName(row?.skillName||'');
    const item=findItemByDisplayName('generals',general);
    const candidates=buildInheritedSkillCandidateMaster(general).map(c=>c.skillName);
    if(!general||!skill||!item||!isLRGeneralItem(item)||!candidates.includes(skill)){delete current.inheritedSkills[rawGeneral];removed.push({general,skill,reason:!item?'target general not found':(!isLRGeneralItem(item)?'target is not LR':'not in current candidate list')});}
  });
  if(removed.length){debugLog('inheritedSkill:pruned-invalid',{context,removed});persistSaveData();return {changed:true,removed};}
  return {changed:false,removed};
}
function setCurrentInheritedSkill(generalName,skillName,context='detail'){
  const current=getCurrentSave();const key=normalizeSaveItemName(generalName);const nextSkill=normalizeSaveItemName(skillName);
  if(!current||!key)return;
  if(!current.inheritedSkills||typeof current.inheritedSkills!=='object')current.inheritedSkills={};
  const prev=current.inheritedSkills[key]||null;
  if(!nextSkill){delete current.inheritedSkills[key];debugLog(context==='formation'?'inheritedSkill:changed-from-formation':'inheritedSkill:changed-from-detail',{general:key,previous:prev,next:null});}
  else{
    const candidate=buildInheritedSkillCandidateMaster(key).find(c=>c.skillName===nextSkill);
    if(!candidate){debugLog('inheritedSkill:skipped-not-owned-source',{general:key,skillName:nextSkill,context});return;}
    current.inheritedSkills[key]={skillName:nextSkill,sourceGeneralNames:candidate.sourceGeneralNames,enabled:true};
    debugLog(context==='formation'?'inheritedSkill:changed-from-formation':'inheritedSkill:changed-from-detail',{general:key,previous:prev,next:current.inheritedSkills[key]});
  }
  persistSaveData();rebuildSavedModeIndex();renderSearchResults();renderDetail();if(state.mainTab==='formation')renderFormationScreen();
}
function renderInheritedSkillSettingCard(item){
  const generalName=normalizeSaveItemName(getItemDisplayName(item));
  if(state.viewMode!=='saved'||!generalName||!isLRGeneralItem(item))return '';
  const current=getCurrentInheritedSkill(generalName);
  const candidates=buildInheritedSkillCandidateMaster(generalName);
  const hasCurrent=current&&candidates.some(c=>c.skillName===current.skillName);
  const currentOption=current&&!hasCurrent?`<option value="${esc(current.skillName)}" selected>${esc(current.skillName)}（候補外・現在設定）</option>`:'';
  const options=['<option value="">未設定</option>',currentOption,...candidates.map(c=>`<option value="${esc(c.skillName)}" ${current&&current.skillName===c.skillName?'selected':''}>${esc(c.skillName)}（${esc(c.sourceGeneralNames.join(' / '))}）</option>`)].join('');
  return `<div class="general-card"><div class="general-card-header">継承技能</div><div class="general-card-body"><label class="note">真髄<select class="inherited-skill-select control-select" data-general-name="${esc(generalName)}">${options}</select></label><div class="meta" style="margin-top:8px">所有LR武将の真髄のみ選択できます。継承技能はLvⅠ固定で、この武将の追加技能として扱います。</div></div></div>`;
}
function getInheritedSkillParameterRecordsForGeneral(item,add){
  const generalName=normalizeSaveItemName(getItemDisplayName(item));
  const inherited=getCurrentInheritedSkill(generalName);
  if(!inherited)return [];
  const skillName=inherited.skillName;
  const contentInfo=getSkillItemContentForLevel(skillName,'Ⅰ');
  const text=contentInfo.content||`参照技能データ未取得: ${skillName}Ⅰ`;
  const extra={formationSkillName:skillName,formationSavedLevel:1,inheritedSkill:true,sourceSkillType:'継承',formationSourceCategory:'継承',sourceGeneralNames:inherited.sourceGeneralNames};
  add(`技能:${skillName}Ⅰ`,text,'include',extra);
  addGrantedSkillParameterRecordsFromLines([text],skillName,add,{parentSkillName:skillName,parentSkillLevel:'Ⅰ',...extra});
  debugLog('inheritedSkill:applied-to-general',{general:generalName,skillName,sourceGeneralNames:inherited.sourceGeneralNames,contentFound:contentInfo.found,lineCount:contentInfo.lineCount});
  return [{skillName,level:'Ⅰ',sourceGeneralNames:inherited.sourceGeneralNames}];
}
function renderFormationInheritedSkillControl(generalName){
  const name=normalizeSaveItemName(generalName);
  const item=findItemByDisplayName('generals',name);
  if(state.viewMode!=='saved'||!name||!item||!isLRGeneralItem(item))return '';
  const current=getCurrentInheritedSkill(name);
  const candidates=buildInheritedSkillCandidateMaster(name);
  const options=['<option value="">未設定</option>',...candidates.map(c=>`<option value="${esc(c.skillName)}" ${current&&current.skillName===c.skillName?'selected':''}>${esc(c.skillName)}</option>`)].join('');
  return `<div class="formation-assistant"><div class="formation-equip-label">継承技能</div><select class="formation-inherited-skill-select formation-select" data-general-name="${esc(name)}">${options}</select><div class="formation-extension-note">${current?`真髄元：${esc(current.sourceGeneralNames.join(' / ')||'-')}`:'未設定'}</div></div>`;
}
function getCurrentEthnicResearchSkillSetting(name,createIfMissing=false){
  const current=getCurrentSave();
  const skillName=normalizeSaveItemName(name);
  if(!current||!skillName)return {enabled:true,level:'Ⅰ',isDefault:true};
  if(!current.ethnicResearchSkills||typeof current.ethnicResearchSkills!=='object')current.ethnicResearchSkills={};
  if(!current.ethnicResearchSkills[skillName]){
    if(createIfMissing)current.ethnicResearchSkills[skillName]={enabled:true,level:'Ⅰ'};
    else return {enabled:true,level:'Ⅰ',isDefault:true};
  }
  const s=current.ethnicResearchSkills[skillName]||{};
  return {enabled:s.enabled!==false,level:normalizeSkillLevelValue(s.level)||'Ⅰ',isDefault:false};
}
function getEthnicResearchSkillMaxRoman(item){
  const levels=Array.isArray(item?.levels)?item.levels:[];
  const romans=levels.map(lv=>normalizeSkillLevelValue(lv?.roman||arabicLevelToRoman(lv?.level))).filter(Boolean);
  if(romans.length)return romans[romans.length-1];
  const maxLevel=Math.max(1,Math.min(ROMAN_LEVELS.length,Number(item?.maxLevel)||5));
  return ROMAN_LEVELS[maxLevel-1]||'Ⅰ';
}
function getEffectiveEthnicResearchSkillSetting(item,createIfMissing=false){
  const name=getItemDisplayName(item)||normalizeSaveItemName(item?.name||item?.title||'');
  const maxRoman=getEthnicResearchSkillMaxRoman(item);
  if(state.viewMode==='saved'){
    const setting=getCurrentEthnicResearchSkillSetting(name,createIfMissing);
    return {enabled:!!setting.enabled,level:normalizeSkillLevelValue(setting.level)||'Ⅰ',source:'saved',editable:true,maxRoman};
  }
  if(normalizeGeneralStage(state.generalStage)==='max'){
    return {enabled:true,level:maxRoman,source:'all-max',editable:false,maxRoman};
  }
  return {enabled:false,level:'Ⅰ',source:'all-initial',editable:false,maxRoman};
}
function setCurrentEthnicResearchSkillSetting(name,patch){
  const current=getCurrentSave();
  const skillName=normalizeSaveItemName(name);
  if(!current||!skillName)return;
  if(!current.ethnicResearchSkills||typeof current.ethnicResearchSkills!=='object')current.ethnicResearchSkills={};
  const prev=getCurrentEthnicResearchSkillSetting(skillName,true);
  current.ethnicResearchSkills[skillName]={enabled:patch&&Object.prototype.hasOwnProperty.call(patch,'enabled')?!!patch.enabled:prev.enabled,level:normalizeSkillLevelValue(patch?.level||prev.level)||'Ⅰ'};
  persistSaveData();
  rebuildSavedModeIndex();
  debugLog('ethnicResearchSkill:setting-saved',{skillName,setting:current.ethnicResearchSkills[skillName]});
  renderSearchResults();
  renderDetail();
  if(state.mainTab==='formation')renderFormationScreen();
}
function debugSaveNameMigration(context,save){try{const rawGenerals=Array.isArray(save?.generals)?save.generals:[];const rawEquipments=Array.isArray(save?.equipments)?save.equipments:[];const rawGeneralStarKeys=Object.keys(save?.generalStars||{});const rawGeneralSettingKeys=Object.keys(save?.generalSettings||{});debugLog('saveData:name-migration',{context,rawGeneralCount:rawGenerals.length,cleanGeneralCount:uniq(rawGenerals.map(normalizeSaveItemName).filter(Boolean)).length,rawEquipmentCount:rawEquipments.length,cleanEquipmentCount:uniq(rawEquipments.map(normalizeSaveItemName).filter(Boolean)).length,changedGeneralNameSample:rawGenerals.filter(v=>normalizeSaveItemName(v)!==norm(v)).slice(0,10).map(v=>({raw:v,clean:normalizeSaveItemName(v)})),changedGeneralStarKeySample:rawGeneralStarKeys.filter(v=>normalizeSaveItemName(v)!==norm(v)).slice(0,10).map(v=>({raw:v,clean:normalizeSaveItemName(v)})),changedGeneralSettingKeySample:rawGeneralSettingKeys.filter(v=>normalizeSaveItemName(v)!==norm(v)).slice(0,10).map(v=>({raw:v,clean:normalizeSaveItemName(v)})),hasRawLRKaoWithReading:rawGenerals.includes('LR華雄（かゆう）')||rawGeneralStarKeys.includes('LR華雄（かゆう）')||rawGeneralSettingKeys.includes('LR華雄（かゆう）'),hasCleanLRKao:rawGenerals.map(normalizeSaveItemName).includes('LR華雄')||rawGeneralStarKeys.map(normalizeSaveItemName).includes('LR華雄')||rawGeneralSettingKeys.map(normalizeSaveItemName).includes('LR華雄')});}catch(err){debugLog('saveData:name-migration:error',{context,message:err?.message||String(err)});}}

function normalizeWarhorseSkillLevel(value){const n=Number(value);return Math.max(1,Math.min(5,Number.isFinite(n)?Math.floor(n):1));}
function normalizeWarhorseStarValue(value){if(value===null||value===undefined||value==='')return null;const n=Number(value);return Math.max(0,Math.min(7,Number.isFinite(n)?Math.floor(n):0));}
function normalizeWarhorseFamousStarValue(value){const n=Number(value);return Math.max(0,Math.min(7,Number.isFinite(n)?Math.floor(n):0));}
function getWarhorseMasterKind(master){return norm(master?.kind||master?.type)==='famous'?'famous':'normal';}
function getWarhorseSkillKind(skill){const k=norm(skill?.skillKind||skill?.kind||skill?.type||'normal');return (k==='famous'||k==='famous_fixed')?'famous':'normal';}
function getWarhorseMasterId(master){return norm(master?.id||master?.name||master?.title||'');}
function getWarhorseFixedSkillName(master){return norm(master?.fixedSkillName||master?.fixedSkillId||master?.raw?.fixedSkill?.name||master?.raw?.fixedSkillId||'');}
function getFamousHorseFixedSkillLevel(master,star){const n=normalizeWarhorseFamousStarValue(star);const levels=master?.starFixedSkillLevels||master?.raw?.fixedSkill?.levelByStar||{};if(levels&&typeof levels==='object'){if(levels[String(n)]!=null)return Math.max(1,Number(levels[String(n)])||1);let bestStar=-1,bestLv=1;Object.entries(levels).forEach(([k,v])=>{const st=Number(k);if(Number.isFinite(st)&&st<=n&&st>bestStar){bestStar=st;bestLv=Math.max(1,Number(v)||1);}});return bestLv;}if(n>=7)return 3;if(n>=4)return 2;return 1;}
function getFamousHorseStarEffects(master,star){const n=normalizeWarhorseFamousStarValue(star);const raw=master?.starEffects||master?.raw?.starEffects||{};if(Array.isArray(raw)){return raw.filter(e=>{const min=Number(e?.starMin??e?.star??1);const max=Number(e?.starMax??e?.star??7);return n>=min&&n<=max;});}if(raw&&typeof raw==='object'){let best=-1;Object.keys(raw).forEach(k=>{const st=Number(k);if(Number.isFinite(st)&&st<=n&&st>best)best=st;});return best>=0&&Array.isArray(raw[String(best)])?raw[String(best)]:[];}return [];}
function formatWarhorseEffectSummary(effect){const stat=norm(effect?.stat||effect?.status||effect?.key||effect?.name||effect?.label||'');const value=effect?.value??effect?.amount??effect?.rate??'';const unit=norm(effect?.unit||'')||(norm(effect?.type||effect?.valueType||'')==='percent'?'%':'');const valueText=normalizeSignedWarhorseEffectValue(value,unit);return stat&&valueText?`${stat}${valueText}`:(stat||valueText||'');}
function normalizeSignedWarhorseEffectValue(value,unit=''){
  if(value===null||value===undefined||value==='')return '';
  const unitText=norm(unit||'');
  if(typeof value==='number'&&Number.isFinite(value)){const n=Number.isInteger(value)?String(value):String(Number(value.toFixed(2)));return `${value>0?'+':''}${n}${unitText}`;}
  const s=norm(value);
  if(!s)return '';
  const hasSign=/^[+\-]/.test(s);
  const hasUnit=unitText&&s.includes(unitText);
  return `${hasSign?'':'+'}${s}${hasUnit?'':unitText}`;
}
function formatWarhorseStarEffectForDisplay(effect){
  if(effect===null||effect===undefined||effect==='')return '-';
  if(typeof effect==='string'||typeof effect==='number')return formatDetailValueForDisplay(effect);
  if(Array.isArray(effect)){
    const parts=effect.map(v=>formatWarhorseStarEffectForDisplay(v)).filter(v=>v&&v!=='-');
    return parts.length?parts.join(' / '):'-';
  }
  if(typeof effect==='object'){
    const direct=norm(effect.summary||effect.description||effect.text||effect.effectText||effect.effect||'');
    if(direct)return direct;
    const stat=norm(effect.stat||effect.status||effect.key||effect.name||effect.label||effect.target||'');
    const value=effect.value??effect.amount??effect.rate??effect.percent??'';
    const unit=norm(effect.unit||'')||(norm(effect.type||effect.valueType||'')==='percent'?'%':'');
    const valueText=normalizeSignedWarhorseEffectValue(value,unit);
    if(stat&&valueText)return `${stat}${valueText}`;
    const stats=effect.stats||effect.values||effect.effects;
    if(stats&&typeof stats==='object'&&!Array.isArray(stats)){
      const parts=Object.entries(stats).map(([k,v])=>{
        if(v&&typeof v==='object'&&!Array.isArray(v)){
          const innerValue=v.value??v.amount??v.rate??v.percent??'';
          const innerUnit=norm(v.unit||'')||(norm(v.type||v.valueType||'')==='percent'?'%':'');
          const innerText=normalizeSignedWarhorseEffectValue(innerValue,innerUnit)||formatWarhorseStarEffectForDisplay(v);
          return innerText&&innerText!=='-'?`${k}${innerText}`:'';
        }
        const text=normalizeSignedWarhorseEffectValue(v,norm(effect.unit||''));
        return text?`${k}${text}`:'';
      }).filter(Boolean);
      if(parts.length)return parts.join(' / ');
    }
    const fallback=formatWarhorseEffectSummary(effect)||formatDetailValueForDisplay(effect);
    return fallback||'-';
  }
  return formatDetailValueForDisplay(effect);
}
function buildWarhorseStarEffectRows(starEffects){
  const rows=[];
  const push=(label,value)=>{const text=formatWarhorseStarEffectForDisplay(value);if(text&&text!=='-')rows.push([label,text]);};
  if(Array.isArray(starEffects)){
    starEffects.forEach((value,index)=>{
      const star=value&&typeof value==='object'?(value.star??value.starMin??value.unlockStar??index+1):index+1;
      push(`将星${star}`,value);
    });
  }else if(starEffects&&typeof starEffects==='object'){
    Object.keys(starEffects).sort((a,b)=>Number(a)-Number(b)).forEach(star=>push(`将星${star}`,starEffects[star]));
  }
  return rows;
}
function warhorseBaseStatKeys(){return ['兵力','攻撃','防御','知力','輸送','探索','機動'];}
function getWarhorseMasterById(id){const key=norm(id);return (state.warhorses||[]).find(h=>getWarhorseMasterId(h)===key)||null;}
function getDefaultWarhorseMaster(kind='normal'){const desired=norm(kind);const list=Array.isArray(state.warhorses)?state.warhorses:[];return list.find(h=>getWarhorseMasterKind(h)===(desired||'normal'))||list[0]||null;}
function createWarhorseSaveId(){return 'wh_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
function sanitizeWarhorseSkillEntry(entry,index=0){const skillId=norm(entry?.skillId||entry?.id||entry?.name||'');if(!skillId)return null;const slotIndex=Number.isFinite(Number(entry?.slotIndex))?Math.max(0,Math.min(2,Math.floor(Number(entry.slotIndex)))):Math.max(0,Math.min(2,Number(index)||0));return {skillId,level:normalizeWarhorseSkillLevel(entry?.level),slotIndex};}
function sanitizeWarhorseEntry(entry){const id=norm(entry?.id||createWarhorseSaveId());const horseMasterId=norm(entry?.horseMasterId||entry?.masterId||entry?.baseHorseId||'');const name=norm(entry?.name||entry?.customName||'新規軍馬');const rawSkills=Array.isArray(entry?.skills)?entry.skills:(Array.isArray(entry?.normalSkills)?entry.normalSkills:[]);const skills=rawSkills.map((sk,idx)=>sanitizeWarhorseSkillEntry(sk,idx)).filter(Boolean).slice(0,3).map((sk,idx)=>({...sk,slotIndex:Number.isFinite(Number(sk.slotIndex))?sk.slotIndex:idx}));const star=normalizeWarhorseStarValue(entry?.star);const baseStats={};warhorseBaseStatKeys().forEach(k=>{const v=Number(entry?.baseStats?.[k]);baseStats[k]=Number.isFinite(v)?v:0;});return {id,name,horseMasterId,customName:norm(entry?.customName||name),favorite:!!entry?.favorite,star,skills,normalSkills:skills.map(sk=>({...sk})),baseStats,createdAt:norm(entry?.createdAt||''),updatedAt:norm(entry?.updatedAt||'')};}
function sanitizeWarhorseSaveData(data){const rawOwned=data?.owned;const owned={};if(rawOwned&&typeof rawOwned==='object'&&!Array.isArray(rawOwned)){Object.entries(rawOwned).forEach(([key,val])=>{const wh=sanitizeWarhorseEntry({...val,id:val?.id||key});if(wh.id)owned[wh.id]=wh;});}else if(Array.isArray(rawOwned)){rawOwned.forEach(val=>{const wh=sanitizeWarhorseEntry(val);if(wh.id)owned[wh.id]=wh;});}const activeSlots=Array.isArray(data?.activeSlots)?data.activeSlots.slice(0,3).map(v=>{const id=norm(v||'');return id&&owned[id]?id:null;}):[null,null,null];while(activeSlots.length<3)activeSlots.push(null);return {owned,activeSlots};}
function ensureSaveWarhorseData(save){if(!save)return sanitizeWarhorseSaveData({});save.warhorses=sanitizeWarhorseSaveData(save.warhorses||{});return save.warhorses;}
function getCurrentWarhorseData(){const save=getCurrentSave?getCurrentSave():null;return ensureSaveWarhorseData(save);}
function getOwnedWarhorseList(){const wh=getCurrentWarhorseData();return Object.values(wh.owned||{}).sort((a,b)=>norm(a.name).localeCompare(norm(b.name),'ja'));}
function getSelectedOwnedWarhorse(){const data=getCurrentWarhorseData();const id=norm(state._warhorseEditDialogId||state.warhorseSelectedId||'');return id?data.owned[id]||null:null;}
function areWarhorseSkillSlotsEqual(a,b){const left=(Array.isArray(a)?a:[]).map((sk,idx)=>sanitizeWarhorseSkillEntry(sk,idx)).filter(Boolean).sort((x,y)=>x.slotIndex-y.slotIndex);const right=(Array.isArray(b)?b:[]).map((sk,idx)=>sanitizeWarhorseSkillEntry(sk,idx)).filter(Boolean).sort((x,y)=>x.slotIndex-y.slotIndex);return left.length===right.length&&left.every((sk,idx)=>sk.skillId===right[idx].skillId&&Number(sk.level)===Number(right[idx].level)&&Number(sk.slotIndex)===Number(right[idx].slotIndex));}

function buildWarhorseEditorSaveSignature(entry){
  const wh=sanitizeWarhorseEntry(entry||{});
  const stat={};
  warhorseBaseStatKeys().forEach(k=>{stat[k]=Number(wh.baseStats?.[k])||0;});
  const skills=(Array.isArray(wh.skills)?wh.skills:[]).map((sk,idx)=>sanitizeWarhorseSkillEntry(sk,idx)).filter(Boolean).sort((a,b)=>a.slotIndex-b.slotIndex);
  return JSON.stringify({id:wh.id,name:wh.name,customName:wh.customName,horseMasterId:wh.horseMasterId,favorite:!!wh.favorite,star:wh.star,skills,baseStats:stat});
}
function setWarhorseSaveButtonState(status,message){
  const btn=document.querySelector('#warhorseEditorForm .warhorse-save-btn');
  const note=document.getElementById('warhorseSaveStatus');
  const stateKey=norm(status||'');
  if(btn){
    btn.disabled=stateKey==='saving';
    btn.textContent=stateKey==='saving'?'保存中…':stateKey==='saved'?'保存済み':'変更を保存';
  }
  if(note){
    note.textContent=norm(message||'');
    note.hidden=!norm(message||'');
  }
}
function clearWarhorseSaveSignatureOnEdit(){
  state._warhorseSaveInFlight=false;
}
function mergeWarhorseEntryIntoSave(save,entry,context=''){
  if(!save||!entry)return null;
  const sanitizedEntry=sanitizeWarhorseEntry(entry);
  if(!sanitizedEntry?.id)return null;
  const current=save.warhorses&&typeof save.warhorses==='object'?save.warhorses:{};
  const owned=current.owned&&typeof current.owned==='object'&&!Array.isArray(current.owned)?{...current.owned}:{};
  owned[sanitizedEntry.id]=sanitizedEntry;
  const activeSlots=Array.isArray(current.activeSlots)?current.activeSlots.slice(0,3):[null,null,null];
  while(activeSlots.length<3)activeSlots.push(null);
  save.warhorses=sanitizeWarhorseSaveData({owned,activeSlots});
  const merged=save.warhorses?.owned?.[sanitizedEntry.id]||null;
  debugLog('warhorseSave:force-merge-entry',{context,id:sanitizedEntry.id,skillCount:sanitizedEntry.skills?.length||0,mergedSkillCount:merged?.skills?.length||0,skills:sanitizedEntry.skills||[],mergedSkills:merged?.skills||[]});
  return merged;
}
function mergeWarhorseEntryIntoSaveData(saveData,saveId,entry,context=''){
  const targetSaveId=norm(saveId||saveData?.currentSaveId||'');
  const save=(saveData?.saves||[]).find(s=>s.id===targetSaveId)||null;
  return mergeWarhorseEntryIntoSave(save,entry,context);
}
function findPersistedWarhorseEntry(saveId,warhorseId){try{const raw=localStorage.getItem(SAVE_STORAGE_KEY)||'';if(!raw)return null;const parsed=sanitizeSaveDataStructure(JSON.parse(raw));const save=(parsed.saves||[]).find(s=>s.id===saveId)||null;return save?.warhorses?.owned?.[warhorseId]||null;}catch(err){debugLog('warhorseSave:persist-read-error',{id:warhorseId,message:err?.message||String(err)});return null;}}
function createDefaultOwnedWarhorse(kind='normal',options={}){const data=getCurrentWarhorseData();const master=options?.masterId?getWarhorseMasterById(options.masterId):getDefaultWarhorseMaster(kind);const isFamous=getWarhorseMasterKind(master)==='famous';const id=createWarhorseSaveId();const now=debugTimestamp();const baseName=norm(options?.name||'')||(master?`${master.name||'軍馬'} ${Object.keys(data.owned||{}).length+1}`:`軍馬 ${Object.keys(data.owned||{}).length+1}`);data.owned[id]=sanitizeWarhorseEntry({id,name:baseName,customName:baseName,horseMasterId:getWarhorseMasterId(master),favorite:isFamous,star:isFamous?0:null,skills:[],createdAt:now,updatedAt:now});state.warhorseSelectedId=id;persistSaveData();markFormationScreenStale('warhorse-create');if(state.mainTab==='formation')renderFormationScreen();renderWarhorseFormationScreen();updateUxHomePanel('warhorse-create');debugLog('warhorseSave:create',{id,name:baseName,kind:isFamous?'famous':'normal',horseMasterId:data.owned[id].horseMasterId,formationStale:true});}
function duplicateSelectedOwnedWarhorse(){const data=getCurrentWarhorseData();const src=getSelectedOwnedWarhorse();if(!src){try{window.alert('複製する軍馬を選択してください。');}catch{}return;}const id=createWarhorseSaveId();const now=debugTimestamp();const copy=sanitizeWarhorseEntry({...src,id,name:`${src.name||'軍馬'} コピー`,customName:`${src.customName||src.name||'軍馬'} コピー`,createdAt:now,updatedAt:now});data.owned[id]=copy;state.warhorseSelectedId=id;state._warhorseEditDialogId=id;persistSaveData();markFormationScreenStale('warhorse-duplicate');if(state.mainTab==='formation')renderFormationScreen();renderWarhorseFormationScreen();updateUxHomePanel('warhorse-duplicate');debugLog('warhorseSave:duplicate',{from:src.id,to:id,formationStale:true});}
function deleteSelectedOwnedWarhorse(){const id=norm(state._warhorseEditDialogId||state.warhorseSelectedId||getSelectedOwnedWarhorse()?.id||'');deleteOwnedWarhorseById(id);}
function handleSaveWarhorseEditor(event){
  if(event&&event.preventDefault)event.preventDefault();
  if(state._warhorseSaveInFlight){
    debugLog('warhorseSave:skip-in-flight',{editDialogId:state._warhorseEditDialogId||'',selectedId:state.warhorseSelectedId||''});
    return;
  }
  const currentSave=getCurrentSave?getCurrentSave():null;
  const data=currentSave?ensureSaveWarhorseData(currentSave):getCurrentWarhorseData();
  const selected=getSelectedOwnedWarhorse();
  if(!selected){try{window.alert('保存する軍馬を選択してください。');}catch{}return;}
  const targetId=norm(state._warhorseEditDialogId||selected.id||state.warhorseSelectedId||'');
  const saveId=norm(getCurrentSave()?.id||state.saveData?.currentSaveId||'');
  const name=norm(document.getElementById('warhorseEditName')?.value||selected.name||selected.customName||'軍馬');
  const horseMasterId=norm(selected.horseMasterId||'');
  const master=getWarhorseMasterById(horseMasterId);
  const isFamous=getWarhorseMasterKind(master)==='famous';
  const skills=[];
  for(let i=0;i<3;i++){
    const skillId=norm(document.querySelector(`[data-warhorse-skill-index="${i}"][data-warhorse-skill-field="skillId"]`)?.value||'');
    const level=normalizeWarhorseSkillLevel(document.querySelector(`[data-warhorse-skill-index="${i}"][data-warhorse-skill-field="level"]`)?.value||1);
    if(skillId)skills.push({skillId,level,slotIndex:i});
  }
  const baseStats={};
  warhorseBaseStatKeys().forEach(k=>{const v=Number(document.querySelector(`[data-warhorse-stat="${k}"]`)?.value);baseStats[k]=Number.isFinite(v)?v:0;});
  const now=debugTimestamp();
  const savedEntry=sanitizeWarhorseEntry({...selected,id:targetId,name,customName:name,horseMasterId,star:isFamous?normalizeWarhorseFamousStarValue(document.getElementById('warhorseEditStar')?.value ?? selected.star ?? 0):null,favorite:isFamous?(selected.favorite!==false):false,skills,baseStats,updatedAt:now,createdAt:selected.createdAt||now});
  const saveSignature=buildWarhorseEditorSaveSignature(savedEntry);
  const last=state._warhorseLastSaveSignature||{};
  if(last.saveId===saveId&&last.id===targetId&&last.signature===saveSignature){
    setWarhorseSaveButtonState('saved','保存済みです。変更がないため再保存は行いません。');
    debugLog('warhorseSave:skip-unchanged',{id:targetId,saveId,skillCount:savedEntry.skills.length,signature:saveSignature,dialogClosed:true});
    state._warhorseEditDialogId='';
    state._warhorseDeleteConfirmId='';
    markFormationScreenStale('warhorse-save-unchanged');
    renderWarhorseFormationScreen();
    return;
  }
  state._warhorseSaveInFlight=true;
  setWarhorseSaveButtonState('saving','保存中です。連続タップを無視します。');
  try{
    data.owned[targetId]=savedEntry;
    mergeWarhorseEntryIntoSave(currentSave,savedEntry,'handleSaveWarhorseEditor:before-persist');
    state.warhorseSelectedId=targetId;
    state._warhorseEditDialogId=targetId;
    const persistOk=persistSaveData({saveId,warhorseEntry:savedEntry});
    const persistedEntry=findPersistedWarhorseEntry(saveId,targetId);
    const slotsOk=!!persistedEntry&&areWarhorseSkillSlotsEqual(savedEntry.skills,persistedEntry.skills);
    debugLog('warhorseSave:persist-verify-skills',{id:targetId,saveId,persistOk,slotsOk,expected:savedEntry.skills,persisted:persistedEntry?.skills||[],persistedNormal:persistedEntry?.normalSkills||[]});
    if(!persistOk||!slotsOk){try{window.alert('軍馬技能の保存検証に失敗しました。Debug Log の warhorseSave:persist-verify-skills を確認してください。');}catch{}}
    if(persistOk&&slotsOk){state._warhorseLastSaveSignature={saveId,id:targetId,signature:saveSignature,savedAt:debugTimestamp()};state._warhorseEditDialogId='';state._warhorseDeleteConfirmId='';}
    markFormationScreenStale('warhorse-edit-save');
    if(state.mainTab==='formation')renderFormationScreen();
    renderWarhorseFormationScreen();
    updateUxHomePanel('warhorse-edit-save');
    debugLog('warhorseSave:edit',{id:targetId,name,horseMasterId,kind:isFamous?'famous':'normal',star:isFamous?data.owned[targetId].star:null,favorite:data.owned[targetId].favorite,skillCount:data.owned[targetId].skills.length,skillSlots:data.owned[targetId].skills,baseStats,persistOk,slotsOk,dialogClosed:!!(persistOk&&slotsOk),repeatGuard:true,formationStale:true});
  }finally{
    state._warhorseSaveInFlight=false;
  }
}

function sanitizeSaveRecord(save){debugSaveNameMigration('sanitizeSaveRecord:input',save);const rawGenerals=Array.isArray(save?.generals)?save.generals:[];const rawEquipments=Array.isArray(save?.equipments)?save.equipments:[];const sanitized={id:norm(save?.id||createSaveId()),name:norm(save?.name||'無題セーブ'),generals:uniq(rawGenerals.map(normalizeSaveItemName).filter(Boolean)),equipments:uniq(rawEquipments.map(normalizeSaveItemName).filter(Boolean)),generalSettings:buildCanonicalValueMap(save?.generalSettings,(val,prev)=>mergeGeneralSettingValue(prev,val)),generalStars:buildCanonicalValueMap(save?.generalStars,(val)=>Math.max(0,Math.min(7,Number(val)||0))),equipmentStars:buildCanonicalValueMap(save?.equipmentStars,(val)=>Math.max(0,Math.min(10,Number(val)||0))),equipmentStages:buildCanonicalValueMap(save?.equipmentStages,(val)=>normalizeEquipmentStage(val)),ethnicResearchSkills:sanitizeEthnicResearchSkillSettings(save?.ethnicResearchSkills||{}),inheritedSkills:sanitizeInheritedSkillSettings(save?.inheritedSkills||{}),warhorses:sanitizeWarhorseSaveData(save?.warhorses||{})};debugLog('sanitizeSaveRecord:summary',{name:sanitized.name,generalCount:sanitized.generals.length,equipmentCount:sanitized.equipments.length,generalStarCount:Object.keys(sanitized.generalStars||{}).length,equipmentStarCount:Object.keys(sanitized.equipmentStars||{}).length,equipmentStageCount:Object.keys(sanitized.equipmentStages||{}).length,warhorseCount:Object.keys(sanitized.warhorses?.owned||{}).length,hasLRKao:sanitized.generals.includes('LR華雄')||Object.prototype.hasOwnProperty.call(sanitized.generalStars||{},'LR華雄')});return sanitized;}
function sanitizeSaveDataStructure(data){const normalized=defaultSaveData();normalized.saves=Array.isArray(data?.saves)?data.saves.map(sanitizeSaveRecord):[];normalized.currentSaveId=norm(data?.currentSaveId||'');normalized.searchHistory=sanitizeSearchHistoryList(data?.searchHistory||[]);if(normalized.currentSaveId&&!normalized.saves.some(save=>save.id===normalized.currentSaveId))normalized.currentSaveId='';if(!normalized.currentSaveId&&normalized.saves.length)normalized.currentSaveId=normalized.saves[0].id;return normalized;}
function hasUsableSaveData(data){return Array.isArray(data?.saves)&&data.saves.length>0;}
function buildPersistableSaveData(){return sanitizeSaveDataStructure({...(state.saveData||defaultSaveData()),searchHistory:sanitizeSearchHistoryList(state.searchHistory||state.saveData?.searchHistory||[])});}
function diagnoseSaveLocalStorage(context=''){let ok=false;let length=-1;let saveCount=-1;let currentSaveId='';let message='';try{const testKey=SAVE_STORAGE_KEY+'_probe';localStorage.setItem(testKey,'1');localStorage.removeItem(testKey);const raw=localStorage.getItem(SAVE_STORAGE_KEY)||'';length=raw.length;if(raw){const parsed=JSON.parse(raw);saveCount=Array.isArray(parsed?.saves)?parsed.saves.length:-1;currentSaveId=norm(parsed?.currentSaveId||'');}ok=true;}catch(err){message=err?.message||String(err);}debugLog('saveStorage:diagnostic',{context,ok,length,saveCount,currentSaveId,message,protocol:location.protocol,userAgent:navigator.userAgent});return {ok,length,saveCount,currentSaveId,message};}
function warnSavePersistFailure(reason){debugLog('persistSaveData:warning',{reason});try{window.alert('保存データをブラウザの保存領域に記録できませんでした。\n再度開いたときにセーブデータが消える可能性があります。\nログ表示 の saveStorage / persistSaveData ログを確認してください。');}catch{}}
function loadSaveDataFromStorage(){try{const raw=localStorage.getItem(SAVE_STORAGE_KEY);if(!raw){debugLog('loadSaveDataFromStorage:empty');return defaultSaveData();}const parsed=JSON.parse(raw);const data=sanitizeSaveDataStructure(parsed);debugLog('loadSaveDataFromStorage:loaded',{rawLength:raw.length,saveCount:data.saves.length,currentSaveId:data.currentSaveId,searchHistoryCount:data.searchHistory.length});return data;}catch(err){debugLog('loadSaveDataFromStorage:error',{message:err?.message||String(err)});return defaultSaveData();}}
function persistSaveData(options={}){let json='';try{state.saveData=buildPersistableSaveData();if(options?.warhorseEntry){mergeWarhorseEntryIntoSaveData(state.saveData,options.saveId,options.warhorseEntry,'persistSaveData:before-json');}json=JSON.stringify(state.saveData);localStorage.setItem(SAVE_STORAGE_KEY,json);const verifyRaw=localStorage.getItem(SAVE_STORAGE_KEY)||'';const verify=verifyRaw?sanitizeSaveDataStructure(JSON.parse(verifyRaw)):defaultSaveData();if(options?.warhorseEntry){mergeWarhorseEntryIntoSaveData(verify,options.saveId,options.warhorseEntry,'persistSaveData:verify-merge-check');}const ok=verifyRaw===json&&verify.saves.length===state.saveData.saves.length&&verify.currentSaveId===state.saveData.currentSaveId;debugLog('persistSaveData:localStorage-verify',{ok,jsonLength:json.length,verifyLength:verifyRaw.length,saveCount:state.saveData.saves.length,verifySaveCount:verify.saves.length,currentSaveId:state.saveData.currentSaveId,verifyCurrentSaveId:verify.currentSaveId,warhorsePatch:!!options?.warhorseEntry});if(!ok){warnSavePersistFailure('localStorage verify mismatch');return false;}saveMirrorSet(state.saveData,'persistSaveData').catch(err=>debugLog('persistSaveData:mirror-error',{message:err?.message||String(err)}));return true;}catch(err){debugLog('persistSaveData:error',{message:err?.message||String(err),jsonLength:json.length});warnSavePersistFailure(err?.message||String(err));saveMirrorSet(state.saveData,'persistSaveData-after-localStorage-error').catch(e=>debugLog('persistSaveData:mirror-after-error-failed',{message:e?.message||String(e)}));return false;}}
function syncCurrentSaveSelection(){if(els.saveSelect&&!els.saveSelect.disabled&&norm(els.saveSelect.value)){state.saveData.currentSaveId=norm(els.saveSelect.value);}}
function sanitizeSearchHistoryList(list){return uniq(Array.isArray(list)?list.map(v=>norm(v)).filter(Boolean):[]);}
function readTextFileCompat(file){return new Promise((resolve,reject)=>{try{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(reader.error||new Error('ファイル読込に失敗しました'));reader.readAsText(file,'UTF-8');}catch(err){if(file&&typeof file.text==='function'){file.text().then(resolve,reject);}else{reject(err);}}});}
function forceRefreshSearchHistoryAfterImport(context=''){persistSearchHistory();renderSearchHistory();setTimeout(()=>{renderSearchHistory();debugLog('importSaveData:force-refresh',{context,searchHistoryCount:(state.searchHistory||[]).length,first:(state.searchHistory||[])[0]||'',mobileOptionCount:els.mobileSearchHistorySelect?els.mobileSearchHistorySelect.options.length:0,mobileFirstOption:els.mobileSearchHistorySelect&&els.mobileSearchHistorySelect.options[1]?els.mobileSearchHistorySelect.options[1].textContent:''});debugResponsiveSnapshot('importSaveData:force-refresh');},0);}
function buildFormationDataExportObject(){return sanitizeFormationData({formations:state.formations,currentFormationId:state.currentFormationId});}
function readImportedFormationData(parsed){const hasFormationData=!!(parsed&&parsed.formationData)||Array.isArray(parsed?.formations);const source=parsed?.formationData||{formations:parsed?.formations,currentFormationId:parsed?.currentFormationId};return {hasFormationData,data:sanitizeFormationData(source)};}
function buildSaveDataExportObject(){syncCurrentSaveSelection();const current=getCurrentSave();const formationData=buildFormationDataExportObject();const payload={saves:current?[sanitizeSaveRecord(JSON.parse(JSON.stringify(current)))]:[],currentSaveId:current?.id||'',searchHistory:sanitizeSearchHistoryList(state.searchHistory),formationData,exportedAt:new Date().toISOString(),exportVersion:`hado_library_${HADO_BUILD_INFO.version}`,exportScope:'currentSave',importPolicy:'singleSaveAddOrOverwrite'};debugLog('exportSaveData:build',{saveCount:payload.saves.length,currentSaveId:payload.currentSaveId,formationCount:formationData.formations.length,currentFormationId:formationData.currentFormationId,searchHistoryCount:payload.searchHistory.length});return payload;}
function exportSaveDataToFile(){try{const payload=buildSaveDataExportObject();const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`hado_library_save_data_${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}catch(err){window.alert(`Exportに失敗しました: ${err?.message||err}`);}}
function pickPrimaryImportedSaveRecord(imported){
  const saves=Array.isArray(imported?.saves)?imported.saves:[];
  if(!saves.length)return null;
  const currentId=norm(imported?.currentSaveId||'');
  return saves.find(save=>save.id===currentId)||saves[0]||null;
}
function mergeImportedSaveRecordIntoCurrent(importedSave, sourceName=''){
  const save=sanitizeSaveRecord(JSON.parse(JSON.stringify(importedSave||{})));
  state.saveData=sanitizeSaveDataStructure(state.saveData||defaultSaveData());
  const idx=(state.saveData.saves||[]).findIndex(existing=>existing.id===save.id);
  const mode=idx>=0?'overwrite':'add';
  if(idx>=0)state.saveData.saves[idx]=save;
  else state.saveData.saves.push(save);
  state.saveData.currentSaveId=save.id;
  debugLog('importSaveData:single-save-merged',{sourceName,mode,saveId:save.id,saveName:save.name,saveCount:state.saveData.saves.length});
  return {mode,save};
}
function mergeImportedFormationDataIntoCurrent(importedFormation, sourceName=''){
  if(!importedFormation?.hasFormationData)return {merged:false,mode:'none',added:0,overwritten:0,currentFormationId:state.currentFormationId||''};
  const incoming=Array.isArray(importedFormation.data?.formations)?importedFormation.data.formations:[];
  if(!incoming.length)return {merged:false,mode:'empty',added:0,overwritten:0,currentFormationId:state.currentFormationId||''};
  const existing=Array.isArray(state.formations)?state.formations:[];
  const byId=new Map(existing.map(f=>[f.id,f]));
  let added=0;let overwritten=0;
  incoming.forEach(f=>{if(!f||!f.id)return;if(byId.has(f.id))overwritten++;else added++;byId.set(f.id,sanitizeFormationData({formations:[f],currentFormationId:f.id}).formations[0]||f);});
  state.formations=[...byId.values()];
  const importedCurrent=norm(importedFormation.data?.currentFormationId||'');
  if(importedCurrent&&state.formations.some(f=>f.id===importedCurrent))state.currentFormationId=importedCurrent;
  else if(!state.currentFormationId&&state.formations.length)state.currentFormationId=state.formations[0].id;
  state.formationDirty=true;
  debugLog('importSaveData:formation-merged',{sourceName,added,overwritten,formationCount:state.formations.length,currentFormationId:state.currentFormationId});
  return {merged:true,mode:'add-or-overwrite',added,overwritten,currentFormationId:state.currentFormationId};
}
async function importSaveDataFromText(text,sourceName=''){
debugLog('importSaveData:text-start',{sourceName,textLength:String(text||'').length,head:String(text||'').slice(0,80)});
let parsed;
try{parsed=JSON.parse(String(text||''));}catch(err){throw new Error(`JSON解析に失敗しました: ${err.message}`);}
const imported=sanitizeSaveDataStructure(parsed);
const importedSearchHistory=sanitizeSearchHistoryList(parsed?.searchHistory||imported.searchHistory||[]);
const importedFormation=readImportedFormationData(parsed);
const primarySave=pickPrimaryImportedSaveRecord(imported);
debugLog('importSaveData:parsed',{sourceName,saveCount:imported.saves.length,currentSaveId:imported.currentSaveId,primarySaveId:primarySave?.id||'',primarySaveName:primarySave?.name||'',importedSearchHistoryCount:importedSearchHistory.length,hasSearchHistory:Array.isArray(parsed?.searchHistory),hasFormationData:importedFormation.hasFormationData,formationCount:importedFormation.data.formations.length,currentFormationId:importedFormation.data.currentFormationId,exportScope:parsed?.exportScope||'',importPolicy:parsed?.importPolicy||''});
if(!primarySave)throw new Error('Import対象の保存データが見つかりません。Exportデータに saves が含まれているか確認してください。');
const existingBefore=sanitizeSaveDataStructure(state.saveData||defaultSaveData());
const sameIdExists=(existingBefore.saves||[]).some(save=>save.id===primarySave.id);
const modeLabel=sameIdExists?'同じIDの保存データを上書き':'新しい保存データとして追加';
const multiNote=imported.saves.length>1?`\n※Importデータに複数の保存データがありますが、現在選択IDまたは先頭の1件だけを取り込みます。`:'';
const formationNote=importedFormation.hasFormationData?'\n※部隊編成データが含まれる場合は、既存部隊を削除せず、同ID上書きまたは追加します。':'';
if(!(await requestConfirmDialog(`Importデータの保存データ「${primarySave.name}」を${modeLabel}します。\n既存の他の保存データは削除されません。${multiNote}${formationNote}`))){debugLog('importSaveData:cancelled',{sourceName});renderDebugPanel(state.selectedItem);return false;}
const beforeCount=existingBefore.saves.length;
const mergeResult=mergeImportedSaveRecordIntoCurrent(primarySave,sourceName);
const formationMergeResult=mergeImportedFormationDataIntoCurrent(importedFormation,sourceName);
// FIX[HADO-2.9.6.5-IMPORT-SEARCH-HISTORY]: Import履歴を既存履歴の先頭へマージし、重複を除去して専用localStorageと保存データへ反映する。
const existingSearchHistory=sanitizeSearchHistoryList(state.searchHistory||[]);
state.searchHistory=sanitizeSearchHistoryList([...importedSearchHistory,...existingSearchHistory]);
debugLog('importSaveData:search-history-merged',{sourceName,importedSearchHistoryCount:importedSearchHistory.length,beforeSearchHistoryCount:existingSearchHistory.length,afterSearchHistoryCount:state.searchHistory.length,first:state.searchHistory[0]||''});
forceRefreshSearchHistoryAfterImport('import-save-data');
debugLog('importSaveData:applied-before-persist',{sourceName,mode:mergeResult.mode,beforeSaveCount:beforeCount,afterSaveCount:state.saveData.saves.length,currentSaveId:state.saveData.currentSaveId,importedSearchHistoryMerged:true,importedSearchHistoryCount:importedSearchHistory.length,stateSearchHistoryCount:state.searchHistory.length,hasFormationData:importedFormation.hasFormationData,formationMergeResult});
const importPersistOk=persistSaveData();
const importFormationPersistOk=formationMergeResult.merged?persistFormationData():true;
let verifySaveCount=-1;let verifyCurrentSaveId='';
try{const v=JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY)||'{}');verifySaveCount=Array.isArray(v?.saves)?v.saves.length:-1;verifyCurrentSaveId=norm(v?.currentSaveId||'');}catch{}
debugLog('importSaveData:persist-verify',{sourceName,importPersistOk,importFormationPersistOk,mode:mergeResult.mode,saveId:mergeResult.save.id,stateSaveCount:state.saveData.saves.length,storageSaveCount:verifySaveCount,currentSaveId:state.saveData.currentSaveId,storageCurrentSaveId:verifyCurrentSaveId,formationCount:(state.formations||[]).length,currentFormationId:state.currentFormationId});
rebuildSavedModeIndex();
renderSaveControls();
renderSearchHistory();
renderSearchResults();
renderDetail();
if(state.mainTab==='formation'||formationMergeResult.merged)renderFormationScreen();
else markFormationScreenStale('import-save-single');
updateCountStatus();
debugLog('importSaveData:completed',{sourceName,mode:mergeResult.mode,saveCount:state.saveData.saves.length,currentSaveId:state.saveData.currentSaveId,formationMergeResult});
renderDebugPanel(state.selectedItem);
return true;
}
async function importSaveDataFromFile(file){
if(!file)return false;
debugLog('importSaveData:file-start',{fileName:file.name||'',fileSize:file.size||0,userAgent:navigator.userAgent});
const text=await readTextFileCompat(file);
debugLog('importSaveData:file-read',{fileName:file.name||'',textLength:text.length,head:text.slice(0,80)});
return importSaveDataFromText(text,file.name||'file');
}
function isSaveInputModalOpen(){return !!document.querySelector('.save-input-overlay.is-visible');}
function registerSaveInputModalOverlay(overlay){
  if(!overlay)return;
  overlay.dataset.hadoModal='1';
  overlay.style.zIndex='220000';
  const card=overlay.querySelector('.save-input-card');
  if(card)card.style.zIndex='220001';
}
function openImportPasteDialog(reason=''){
if(isSaveInputModalOpen()){debugLog('modal:blocked-duplicate',{type:'import-paste',reason});return;}
debugLog('importSaveData:fallback-open',{reason,userAgent:navigator.userAgent});
const overlay=document.createElement('div');
overlay.className='save-input-overlay is-visible';
overlay.innerHTML=`<div class="save-input-card" role="dialog" aria-modal="true"><div class="save-input-title">Import JSONを貼り付け</div><div class="note">ファイル選択が反応しない場合は、セーブデータJSONの中身を貼り付けてください。</div><textarea class="save-input-field" style="min-height:220px;resize:vertical;font-family:monospace"></textarea><div class="save-input-actions"><button type="button" data-action="cancel">キャンセル</button><button type="button" data-action="ok" class="toggle-active">Import</button></div></div>`;
registerSaveInputModalOverlay(overlay);
document.body.appendChild(overlay);
const textarea=overlay.querySelector('textarea');
const close=()=>overlay.remove();
overlay.querySelector('[data-action="cancel"]').addEventListener('click',()=>{debugLog('importSaveData:fallback-cancel');close();});
overlay.querySelector('[data-action="ok"]').addEventListener('click',async()=>{try{await importSaveDataFromText(textarea.value,'manual-paste');close();}catch(err){window.alert(`Importに失敗しました: ${err?.message||err}`);}});
setTimeout(()=>textarea.focus(),0);
}
async function copyTextToClipboard(text){const value=String(text??'');try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(value);return true;}}catch{}const textarea=document.createElement('textarea');textarea.value=value;textarea.setAttribute('readonly','readonly');textarea.style.position='fixed';textarea.style.opacity='0';document.body.appendChild(textarea);textarea.select();let ok=false;try{ok=document.execCommand('copy');}catch{}textarea.remove();if(!ok)throw new Error('コピーに失敗しました');return true;}
function getCurrentSave(){const id=norm(state.saveData.currentSaveId||'');return (state.saveData.saves||[]).find(save=>save.id===id)||null;}
function ensureCurrentSave(){if(getCurrentSave())return;state.saveData.currentSaveId=state.saveData.saves[0]?.id||'';}
function createSaveRecordWithName(name){const save=sanitizeSaveRecord({id:createSaveId(),name:norm(name)||'新規',generals:[],equipments:[]});state.saveData.saves.push(save);state.saveData.currentSaveId=save.id;persistSaveData();rebuildSavedModeIndex();renderSaveControls();renderSearchResults();renderDetail();return save;}
function requestTextInput(title,defaultValue=''){return new Promise(resolve=>{if(isSaveInputModalOpen()){debugLog('modal:blocked-duplicate',{type:'text-input',title});resolve(null);return;}const overlay=document.createElement('div');overlay.className='save-input-overlay is-visible';overlay.innerHTML=`<div class="save-input-card" role="dialog" aria-modal="true"><div class="save-input-title">${esc(title)}</div><input type="text" class="save-input-field" value="${esc(defaultValue)}" /><div class="save-input-actions"><button type="button" data-action="cancel">キャンセル</button><button type="button" data-action="ok" class="toggle-active">OK</button></div></div>`;registerSaveInputModalOverlay(overlay);document.body.appendChild(overlay);const input=overlay.querySelector('input');let closed=false;const close=value=>{if(closed)return;closed=true;overlay.remove();resolve(value);};overlay.querySelector('[data-action="cancel"]').addEventListener('click',()=>close(null));overlay.querySelector('[data-action="ok"]').addEventListener('click',()=>close(input.value));overlay.addEventListener('click',e=>{if(e.target===overlay)close(null);});input.addEventListener('keydown',e=>{if(e.key==='Enter')close(input.value);if(e.key==='Escape')close(null);});setTimeout(()=>{input.focus();input.select();},0);});}
function requestConfirmDialog(message){return new Promise(resolve=>{if(isSaveInputModalOpen()){debugLog('modal:blocked-duplicate',{type:'confirm',message});resolve(false);return;}const overlay=document.createElement('div');overlay.className='save-input-overlay is-visible';overlay.innerHTML=`<div class="save-input-card" role="dialog" aria-modal="true"><div class="save-input-title">確認</div><div class="note">${esc(message)}</div><div class="save-input-actions"><button type="button" data-action="cancel">キャンセル</button><button type="button" data-action="ok" class="toggle-active">OK</button></div></div>`;registerSaveInputModalOverlay(overlay);document.body.appendChild(overlay);let closed=false;const close=value=>{if(closed)return;closed=true;overlay.remove();resolve(value);};overlay.querySelector('[data-action="cancel"]').addEventListener('click',()=>close(false));overlay.querySelector('[data-action="ok"]').addEventListener('click',()=>close(true));overlay.addEventListener('click',e=>{if(e.target===overlay)close(false);});document.addEventListener('keydown',function onKey(e){if(e.key==='Escape'){document.removeEventListener('keydown',onKey);close(false);}});});}
function renderSaveControls(){ensureCurrentSave();const current=getCurrentSave();els.saveSelect.innerHTML='';if(!state.saveData.saves.length){const opt=document.createElement('option');opt.value='';opt.textContent='セーブ未作成';els.saveSelect.appendChild(opt);els.saveSelect.disabled=true;els.renameSaveBtn.disabled=true;els.copySaveBtn.disabled=true;els.deleteSaveBtn.disabled=true;}else{state.saveData.saves.forEach(save=>{const opt=document.createElement('option');opt.value=save.id;opt.textContent=save.name;if(save.id===state.saveData.currentSaveId)opt.selected=true;els.saveSelect.appendChild(opt);});els.saveSelect.disabled=false;els.renameSaveBtn.disabled=!current;els.copySaveBtn.disabled=!current;els.deleteSaveBtn.disabled=!current;}if(els.viewModeAll)els.viewModeAll.checked=state.viewMode==='all';if(els.viewModeSaved)els.viewModeSaved.checked=state.viewMode==='saved';syncFileSettingsSummary();if(typeof updateUxHomePanel==='function')updateUxHomePanel('renderSaveControls');if(typeof updateSaveManagerPanel==='function')updateSaveManagerPanel('renderSaveControls');if(typeof updateDataContextBar==='function')updateDataContextBar('renderSaveControls');}
function setViewMode(mode,options={}){const previous=state.viewMode;state.viewMode=mode==='saved'?'saved':'all';rebuildSavedModeIndex();renderSaveControls();if(!options.skipRender){renderSearchResults();renderDetail();if(state.mainTab==='formation')renderFormationScreen();else markFormationScreenStale('setViewMode');}if(typeof updateDataContextBar==='function')updateDataContextBar('setViewMode');if(!options.skipHistory&&previous!==state.viewMode&&typeof pushOperationHistory==='function')pushOperationHistory('view-mode-'+state.viewMode);debugLog('viewMode:set',{previous,next:state.viewMode,skipRender:!!options.skipRender,skipHistory:!!options.skipHistory});}
async function createNewSave(){const name=norm(await requestTextInput('セーブ名を入力してください','新規'));if(!name)return;createSaveRecordWithName(name);}
async function renameCurrentSave(){const current=getCurrentSave();if(!current)return;const name=norm(await requestTextInput('新しいセーブ名を入力してください',current.name));if(!name)return;current.name=name;persistSaveData();rebuildSavedModeIndex();renderSaveControls();}
async function copyCurrentSave(){const current=getCurrentSave();if(!current)return;const name=norm(await requestTextInput('コピー後のセーブ名を入力してください',`${current.name}_copy`));if(!name)return;const save=sanitizeSaveRecord({id:createSaveId(),name,generals:current.generals,equipments:current.equipments,generalSettings:JSON.parse(JSON.stringify(current.generalSettings||{})),generalStars:JSON.parse(JSON.stringify(current.generalStars||{})),equipmentStars:JSON.parse(JSON.stringify(current.equipmentStars||{})),equipmentStages:JSON.parse(JSON.stringify(current.equipmentStages||{})),ethnicResearchSkills:JSON.parse(JSON.stringify(current.ethnicResearchSkills||{})),inheritedSkills:JSON.parse(JSON.stringify(current.inheritedSkills||{})),warhorses:JSON.parse(JSON.stringify(current.warhorses||{}))});state.saveData.saves.push(save);state.saveData.currentSaveId=save.id;persistSaveData();rebuildSavedModeIndex();renderSaveControls();renderSearchResults();renderDetail();if(state.mainTab==='warhorse')renderWarhorseFormationScreen();if(state.mainTab==='formation')renderFormationScreen();debugLog('saveData:copy-with-warhorses',{from:current.id,to:save.id,warhorseCount:Object.keys(save.warhorses?.owned||{}).length,activeSlots:save.warhorses?.activeSlots||[]});}
function deleteCurrentSave(){const current=getCurrentSave();if(!current)return;if(!window.confirm(`「${current.name}」を削除しますか？`))return;state.saveData.saves=state.saveData.saves.filter(save=>save.id!==current.id);ensureCurrentSave();persistSaveData();rebuildSavedModeIndex();renderSaveControls();renderSearchResults();renderDetail();}
function isSavedName(categoryKey,name){const current=getCurrentSave();const n=normalizeSaveItemName(name);if(!current||!n)return false;if(categoryKey==='generals')return current.generals.includes(n);if(categoryKey==='equipments')return current.equipments.includes(n);return false;}
function toggleSavedName(categoryKey,name){const n=normalizeSaveItemName(name);if(!(categoryKey==='generals'||categoryKey==='equipments')||!n)return;if(!getCurrentSave()){createSaveRecordWithName('新規');if(!getCurrentSave())return;}const quickOwnerActive=!!state.quickStatusEffectOwnerFilter;const quickFallbackRows=quickOwnerActive&&Array.isArray(state.lastResultRows)?state.lastResultRows.filter(row=>row&&row.item).slice():[];const current=getCurrentSave();const target=categoryKey==='generals'?current.generals:current.equipments;const idx=target.indexOf(n);if(idx>=0)target.splice(idx,1);else target.push(n);if(categoryKey==='generals')current.generals=uniq(target);else current.equipments=uniq(target);persistSaveData();rebuildSavedModeIndex();renderSaveControls();if(quickOwnerActive){runQuickStatusEffectOwnerSearchAsync(state.quickStatusEffectOwnerFilter,{keepPreviousRowsWhilePending:true,fallbackRows:quickFallbackRows,reason:'toggleSavedName'});}if(state.viewMode==='saved'){renderSearchResults();if(state.selectedItem&&(detailCategory(state.selectedItem)===categoryKey)&&normalizeSaveItemName(state.selectedItem.name||state.selectedItem.title||'')===n&&!isSavedName(categoryKey,n)){state.selectedItem=null;state.selectedLabel='';}renderDetail();}else{renderSearchResults();renderDetail();}}
function getCurrentGeneralSettings(name,createIfMissing=false){const current=getCurrentSave();const generalName=normalizeSaveItemName(name);if(!current||!generalName)return null;if(!current.generalSettings||typeof current.generalSettings!=='object')current.generalSettings={};if(!current.generalSettings[generalName]&&createIfMissing)current.generalSettings[generalName]=normalizeGeneralSetting({});return current.generalSettings[generalName]||null;}
function setCurrentGeneralAbilityValue(name,key,value){const settings=getCurrentGeneralSettings(name,true);if(!settings)return;const normalizedKey=norm(key);if(!normalizedKey)return;settings.abilities[normalizedKey]=normalizeNumericSettingValue(value);persistSaveData();rebuildSavedModeIndex();}
function setCurrentGeneralFiveElementValue(name,key,value){const settings=getCurrentGeneralSettings(name,true);if(!settings)return;const normalizedKey=norm(key);if(!normalizedKey)return;settings.fiveElements[normalizedKey]=normalizeNumericSettingValue(value);persistSaveData();rebuildSavedModeIndex();}
function setCurrentGeneralAdvisorLevel(name,value){const settings=getCurrentGeneralSettings(name,true);if(!settings)return;settings.advisorLevel=normalizeAdvisorLevelValue(value);persistSaveData();rebuildSavedModeIndex();debugLog('advisorLevel:saved',{general:normalizeSaveItemName(name),advisorLevel:advisorLevelLabel(settings.advisorLevel)});}
function getCurrentGeneralAdvisorLevel(name){const settings=getCurrentGeneralSettings(name,false);return normalizeAdvisorLevelValue(settings?.advisorLevel||'');}
function getEffectiveGeneralAdvisorLevel(name){if(state.viewMode==='all'){return normalizeGeneralStage(state.generalStage)==='max'?'10':'';}return getCurrentGeneralAdvisorLevel(name);}
function effectiveAdvisorLevelSourceLabel(){if(state.viewMode==='all')return normalizeGeneralStage(state.generalStage)==='max'?'全データ武将:最大':'全データ武将:初期';return '保存データ';}
function setCurrentGeneralSkillLevel(name,key,value){debugLog('saveData:legacy-skill-level-write-ignored',{general:normalizeSaveItemName(name),skill:norm(key),value:norm(value),policy:'武将技能Lvは将星から自動解決するため保存しない'});}
function getCurrentStarValue(categoryKey,name,maxStars){const current=getCurrentSave();const itemName=normalizeSaveItemName(name);if(!current||!itemName)return 0;const map=categoryKey==='generals'?(current.generalStars||{}):(current.equipmentStars||{});const value=Math.max(0,Math.min(maxStars,Number(map[itemName])||0));return value;}
function setCurrentStarValue(categoryKey,name,value,maxStars){const current=getCurrentSave();const itemName=normalizeSaveItemName(name);if(!current||!itemName)return;if(categoryKey==='generals'){if(!current.generalStars||typeof current.generalStars!=='object')current.generalStars={};current.generalStars[itemName]=Math.max(0,Math.min(maxStars,Number(value)||0));}else if(categoryKey==='equipments'){if(!current.equipmentStars||typeof current.equipmentStars!=='object')current.equipmentStars={};current.equipmentStars[itemName]=Math.max(0,Math.min(maxStars,Number(value)||0));}persistSaveData();rebuildSavedModeIndex();}
function getCurrentEquipmentStageValue(name){const current=getCurrentSave();const itemName=normalizeSaveItemName(name);if(!current||!itemName)return '';const map=current.equipmentStages||{};return map[itemName]?normalizeEquipmentStage(map[itemName]):'';}
function setCurrentEquipmentStageValue(name,stage){const current=getCurrentSave();const itemName=normalizeSaveItemName(name);if(!current||!itemName)return;const next=normalizeEquipmentStage(stage);if(!current.equipmentStages||typeof current.equipmentStages!=='object')current.equipmentStages={};const prev=current.equipmentStages[itemName]||'';current.equipmentStages[itemName]=next;persistSaveData();invalidateEquipmentStageCaches();rebuildSavedModeIndex();debugLog('equipmentStage:saved-selected',{equipment:itemName,previous:prev,current:next,label:equipmentStageLabel(next),saveId:current.id||'',saveName:current.name||'',quickOwnerActive:!!state.quickStatusEffectOwnerFilter});if(state.quickStatusEffectOwnerFilter)runQuickStatusEffectOwnerSearchAsync(state.quickStatusEffectOwnerFilter);renderSearchResults();renderDetail();if(state.mainTab==='formation')renderFormationScreen();pushOperationHistory('saved-equipment-stage');}
function getEffectiveEquipmentStageForItem(item){const name=normalizeSaveItemName(getItemDisplayName(item));if(state.viewMode==='saved'&&name){const saved=getCurrentEquipmentStageValue(name);if(saved)return saved;debugLog('equipmentStage:saved-default','formationSkill:condition-parse','formationSkill:condition-evaluate','formationSkill:equipment-boost','部隊兵科',{equipment:name,defaultStage:'initial',label:equipmentStageLabel('initial')});return 'initial';}return normalizeEquipmentStage(state.equipmentStage);}
function getEffectiveEquipmentStageForEquipmentName(equipmentName){
  const name=normalizeSaveItemName(equipmentName);
  if(state.viewMode==='saved'&&name){
    const saved=getCurrentEquipmentStageValue(name);
    return saved?normalizeEquipmentStage(saved):'initial';
  }
  return normalizeEquipmentStage(state.equipmentStage);
}
function isEquipmentDerivedSkillItem(item){
  const raw=item?.raw||{};
  return !!normalizeSaveItemName(raw.sourceEquipment||item?.sourceName||'')&&!!norm(raw.equipmentSkillStage||'');
}
function equipmentSkillStageMatchesCurrent(item){
  if(!isEquipmentDerivedSkillItem(item))return true;
  const raw=item?.raw||{};
  const sourceEquipment=normalizeSaveItemName(raw.sourceEquipment||item?.sourceName||'');
  const stageTitle=norm(raw.equipmentSkillStage||item?.equipmentSkillStage||(Array.isArray(item?.sections)&&item.sections[0]?item.sections[0].title:''));
  if(!sourceEquipment||!stageTitle)return true;
  const effectiveStage=getEffectiveEquipmentStageForEquipmentName(sourceEquipment);
  const candidates=equipmentStageTitleCandidates(effectiveStage).map(norm);
  const matched=candidates.includes(stageTitle);
  if(!matched){
    debugLog('quickSearch:equipment-skill-stage-excluded',{skill:getItemDisplayName(item),sourceEquipment,skillStage:stageTitle,effectiveStage,effectiveStageLabel:equipmentStageLabel(effectiveStage),reason:'equipment-derived skill stage does not match current equipment stage'});
  }
  return matched;
}

const GENERAL_STAGE_OPTIONS=['initial','max'];
function normalizeGeneralStage(stage){return GENERAL_STAGE_OPTIONS.includes(stage)?stage:'max';}
function generalStageLabel(stage){return normalizeGeneralStage(stage)==='initial'?'初期':'最大';}
function invalidateGeneralStageCaches(){let count=0;[...(state.generals||[])].forEach(item=>{if(Object.prototype.hasOwnProperty.call(item,'_parameterSummarySearchTextAll')){delete item._parameterSummarySearchTextAll;count++;}if(Object.prototype.hasOwnProperty.call(item,'_metricSourceSegmentsAll'))delete item._metricSourceSegmentsAll;});[...(state.skills||[])].forEach(item=>{['_statusEffectRelatedLinkTextSafeAll','_statusEffectRelatedLinkTextSafeWithTacticEffects'].forEach(key=>{if(Object.prototype.hasOwnProperty.call(item,key)){delete item[key];count++;}});});debugLog('generalStage:cache-invalidate',{count,skillRelatedLinkStatusCache:true});}
function setGeneralStage(stage){const next=normalizeGeneralStage(stage);if(state.generalStage===next){syncFileSettingsSummary();return;}const prev=state.generalStage;state.generalStage=next;try{localStorage.setItem('hado_library_general_stage_v1',next);}catch{}invalidateGeneralStageCaches();syncFileSettingsSummary();debugLog('generalStage:selected',{previous:prev,current:next,label:generalStageLabel(next)});renderSearchResults();renderDetail();if(state.mainTab==='formation')renderFormationScreen();else markFormationScreenStale('general-stage');pushOperationHistory('general-stage');if(typeof updateDataContextBar==='function')updateDataContextBar('general-stage');}
function getGeneralTalentValue(item){let text=norm(findFirstTableValue(item,'天賦')||'');if(!text){(Array.isArray(item?.tables)?item.tables:[]).some(table=>(Array.isArray(table)?table:[]).some(row=>{if(!Array.isArray(row))return false;const idx=row.findIndex(cell=>norm(cell)==='天賦');if(idx>=0){text=norm(row[idx+1]||'');return true;}return false;}));}const m=text.match(/\d+/);return m?Number(m[0]):0;}
function getGeneralStageStarForItem(item){const name=normalizeSaveItemName(getItemDisplayName(item)||item?.name||'');const current=getCurrentSave();if(state.viewMode==='saved'&&current&&name){const hasStar=Object.prototype.hasOwnProperty.call(current.generalStars||{},name);const star=hasStar?Math.max(0,Math.min(7,Number(current.generalStars[name])||0)):0;debugLog('generalStage:star-source',{general:name,source:hasStar?'saved-generalStars':'saved-generalStars-default-zero',star,stage:state.generalStage,policy:'保存データ表示では将星未設定を0として扱う'});return star;}const star=normalizeGeneralStage(state.generalStage)==='initial'?0:7;debugLog('generalStage:star-source',{general:name,source:'general-stage',stage:state.generalStage,star});return star;}
function getRawGeneralSkillEntries(item){const advisorNames=new Set(extractAdvisorSkillEntries(item,getItemDisplayName(item)).map(e=>norm(e.name)));const entries=[];const seen=new Set();getOwnedSkillLevelMapFromTables(item).forEach((level,name)=>{name=norm(name);if(!name||seen.has(name))return;seen.add(name);const isAdvisor=advisorNames.has(name);const maxLevelNumber=Math.max(1,ROMAN_LEVELS.indexOf(level)+1);const entry={name,maxLevel:level,maxLevelNumber,order:entries.length+1,isAdvisor};if(isAdvisor)debugLog('generalStage:advisor-skill-skipped',{general:getItemDisplayName(item),skill:name,reason:'advisor skill is excluded from general stage calculation'});entries.push(entry);});return entries;}
function applyResolvedSkill(out,entries,index,levelNumber,reason){const e=entries[index];if(!e||e.isAdvisor)return;const lvNum=Math.max(1,Math.min(e.maxLevelNumber,levelNumber));out.set(e.name,{level:arabicLevelToRoman(lvNum),levelNumber:lvNum,reason,order:e.order,maxLevel:e.maxLevel});}
function resolveGeneralSkillProfile(item,overrideStar=null){const talent=getGeneralTalentValue(item);const star=overrideStar==null?getGeneralStageStarForItem(item):Math.max(0,Math.min(7,Number(overrideStar)||0));const raw=getRawGeneralSkillEntries(item);const normal=raw.filter(e=>!e.isAdvisor);const resolved=new Map();const excluded=[];const savedModeActive=state.viewMode==='saved'&&!!getCurrentSave()&&overrideStar==null;function base(count,reason){for(let i=0;i<count;i++)applyResolvedSkill(resolved,normal,i,1,reason);}if(!savedModeActive&&normalizeGeneralStage(state.generalStage)==='max'&&overrideStar==null){normal.forEach((e,i)=>applyResolvedSkill(resolved,normal,i,e.maxLevelNumber,'general stage max'));}else if(talent>=1300){base(4,'talent>=1300 star0');if(star>=2)applyResolvedSkill(resolved,normal,3,2,'talent>=1300 star2 level+1');if(star>=4)applyResolvedSkill(resolved,normal,2,2,'talent>=1300 star4 level+1');if(star>=7)applyResolvedSkill(resolved,normal,4,normal[4]?.maxLevelNumber||1,'talent>=1300 star7 unlock');}
else if(talent>=1000&&talent<=1200){base(1,'talent1000-1200 star0');if(star>=2)applyResolvedSkill(resolved,normal,2,2,'talent1000-1200 star2');if(star>=4)applyResolvedSkill(resolved,normal,1,2,'talent1000-1200 star4');if(star>=7)applyResolvedSkill(resolved,normal,3,normal[3]?.maxLevelNumber||1,'talent1000-1200 star7');}
else if(talent===875){if(star>=2)applyResolvedSkill(resolved,normal,2,2,'talent875 star2');if(star>=4)applyResolvedSkill(resolved,normal,1,2,'talent875 star4');if(star>=7)applyResolvedSkill(resolved,normal,0,normal[0]?.maxLevelNumber||1,'talent875 star7');}
else if(talent>=800&&talent<=900){base(3,'talent800-900 fixed');}
else if(talent===650){base(2,'talent650 fixed');}
else if(talent>=500&&talent<=550){base(1,'talent500-550 fixed');}
else{debugLog('generalStage:initial-rule',{general:getItemDisplayName(item),talent,star,stage:state.generalStage,reason:'unknown talent rule'});}
normal.forEach(e=>{if(!resolved.has(e.name))excluded.push({skill:e.name,reason:'not unlocked at resolved star/stage',order:e.order});});const profile={generalName:getItemDisplayName(item),talent,star,stage:state.generalStage,savedModeActive,rawSkills:raw.map(e=>({name:e.name,maxLevel:e.maxLevel,order:e.order,isAdvisor:e.isAdvisor})),resolvedSkills:[...resolved.entries()].map(([name,v])=>({name,level:v.level,levelNumber:v.levelNumber,reason:v.reason,order:v.order})),excludedSkills:excluded};const selectedName=state.selectedItem?getItemDisplayName(state.selectedItem):'';if(savedModeActive&&norm(selectedName)===norm(profile.generalName)){state.diagnostics.savedSkillLevelResolution={timestamp:debugTimestamp(),policy:'保存データ表示時の現在選択武将について、将星から解決した技能Lvを診断表示する。未解放技能はexcludedSkills側に残り、表示ではLvなしになる想定。',...safeCloneForDebug(profile)};}debugLog('generalStage:resolved-skill-levels',profile);return {profile,map:new Map([...resolved.entries()].map(([name,v])=>[name,v.level]))};}
function getResolvedGeneralSkillLevelMap(item){return resolveGeneralSkillProfile(item).map;}

function renderEquipmentStageSettingCard(item){const name=getItemDisplayName(item);if(state.viewMode!=='saved'||!name)return '';const saved=getCurrentEquipmentStageValue(name);const effective=saved||'initial';const options=[['initial','初期'],['ssrMax','SSR最大'],['urMax','UR最大']];return `<div class="general-card"><div class="general-card-header">保存データの装備段階</div><div class="general-card-body"><div class="equipment-stage-setting-value">${esc(equipmentStageLabel(effective))}</div><div class="equipment-stage-setting-row" style="margin-top:10px">${options.map(([value,label])=>`<label class="equipment-stage-setting-radio ${effective===value?'is-active':''}"><input type="radio" name="savedEquipmentStage" class="equipment-stage-setting-input" data-equipment-name="${esc(name)}" value="${esc(value)}" ${effective===value?'checked':''} /><span>${esc(label)}</span></label>`).join('')}</div><div class="meta" style="margin-top:8px">保存データ表示時は、この装備に設定した段階を状態変化率へ反映します。未設定時は初期を使用します。</div></div></div>`;}
function renderStarRatingCard(categoryKey,itemName,maxStars){const editable=state.viewMode==='saved';const item=categoryKey==='generals'?findItemByDisplayName('generals',itemName):null;const currentValue=editable?getCurrentStarValue(categoryKey,itemName,maxStars):(categoryKey==='generals'?(normalizeGeneralStage(state.generalStage)==='initial'?0:maxStars):maxStars);const stars=Array.from({length:maxStars},(_,idx)=>idx<currentValue?'★':'☆').join('');const buttons=editable?`<div class="star-rating-row">${Array.from({length:maxStars},(_,idx)=>{const value=idx+1;const isOn=value<=currentValue;return `<button type="button" class="star-rating-btn ${isOn?'is-on':''}" data-star-category="${esc(categoryKey)}" data-item-name="${esc(itemName)}" data-star-value="${value}" data-star-max="${maxStars}" aria-label="将星 ${value}">${isOn?'★':'☆'}</button>`;}).join('')}</div><div class="meta">同じ星数を押すと0に戻ります。</div>`:'';return `<div class="general-card"><div class="general-card-header">将星</div><div class="general-card-body"><div class="star-rating-wrap"><div class="star-rating-value">${esc(stars)}</div>${buttons}</div></div></div>`;}
function detectMaxRomanLevel(text){const source=String(text||'');let maxIndex=-1;ROMAN_LEVELS.forEach((level,idx)=>{if(source.includes(level)&&idx>maxIndex)maxIndex=idx;});return maxIndex>=0?ROMAN_LEVELS[maxIndex]:'';}
function getSkillMaxLevel(section){const title=norm(section?.title||'');const content=Array.isArray(section?.content)?section.content.join(' '):'';return detectMaxRomanLevel(`${title} ${content}`);}
function buildSkillLevelOptions(maxLevel){const maxIndex=ROMAN_LEVELS.indexOf(maxLevel);const options=[''];if(maxIndex>=0){for(let i=0;i<=maxIndex;i++)options.push(ROMAN_LEVELS[i]);}return options;}
function filterSkillContentLines(lines){return (Array.isArray(lines)?lines:[]).filter(line=>{const text=norm(line);if(!text)return false;if(isOwnerListContentLine(text))return false;return true;});}

function isOwnerListContentLine(line){
  const text=norm(line);
  if(!text)return false;
  if(text.includes('一覧はこちら'))return true;
  // 技能詳細カード末尾の「背水を持つ武将LR韓信」のような所有者一覧だけを除外する。
  // 効果本文に含まれる「この技能を持つ武将の戦法で...」は技能効果そのものなので除外しない。
  if(/^この技能を持つ武将/.test(text))return false;
  if(/[■●▼ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]/.test(text))return false;
  if(/^.{1,40}を持つ武将/.test(text))return true;
  if(/^.{1,40}を所持する武将/.test(text))return true;
  return false;
}

function arabicLevelToRoman(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>=1&&n<=ROMAN_LEVELS.length?ROMAN_LEVELS[n-1]:'';
}
function getOwnedSkillLevelMapFromTables(item){
  const map=new Map();
  // FIX[HADO-2.5.5.37-SKILL-LEVEL-ROW-GUARD]:
  // 能力値表の「統率 1182」「Lv10」「星6」などを技能名として拾わない。
  // 技能一覧の行は row[0]=技能名+Lv、row[1..]=本文 かつ 本文に ■/●/▼ を含む行だけ採用する。
  (Array.isArray(item?.tables)?item.tables:[]).forEach((table,tableIndex)=>{
    (Array.isArray(table)?table:[]).forEach((row,rowIndex)=>{
      if(!Array.isArray(row)||row.length<2)return;
      const head=norm(row[0]||'');
      const body=norm(row.slice(1).join(' '));
      const m=head.match(/^(.+?)([1-9]|10)$/);
      if(!m||!body||!/[■●▼]/.test(body))return;
      const name=norm(m[1]);
      const level=arabicLevelToRoman(m[2]);
      if(!name||!level||SKILL_RARITY_NOISE_NAMES.has(name))return;
      if(/^(Lv|星|解放将星|基礎兵力|統率|武力|知力|政治|魅力|攻撃|防御|機動|射程|輸送|被ダメ軽減)$/.test(name))return;
      map.set(name,level);
    });
  });
  return map;
}

function runGeneralSkillLevelExtractionSmoke(){
  try{
    const sample={tables:[
      [['統率','1182','68位 / 473人'],['武力','1279','26位 / 473人'],['','Lv10','Lv11'],['解放将星','星1','星3'],['攻撃','9%','10%']],
      [['連堅1','■主将の際　●堅強Lv2を付与'],['剛塁2','■常に　●部隊の防御+10%']]
    ]};
    const map=getOwnedSkillLevelMapFromTables(sample);
    const entries=[...map.entries()];
    const forbidden=['118','127','Lv','星','攻撃','防御','統率','武力'];
    const ok=map.get('連堅')==='Ⅰ'&&map.get('剛塁')==='Ⅱ'&&!forbidden.some(k=>map.has(k));
    return {ok,entries,forbiddenHit:forbidden.filter(k=>map.has(k))};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}
function getParameterGeneralSkillLevelMap(item){
  const map=getResolvedGeneralSkillLevelMap(item);
  if(state.viewMode==='saved')debugLog('generalStage:manual-skill-ignored',{item:getItemDisplayName(item),reason:'saved generalSettings.skills is ignored; star-based skill levels are used',skillCount:map.size});
  debugLog('generalStage:parameter-source',{item:getItemDisplayName(item),stage:state.generalStage,skillCount:map.size,skills:[...map.entries()].slice(0,20)});
  return map;
}

function extractRomanLevelBlockText(text, romanLevel){
  const src=norm(text);
  const level=norm(romanLevel);
  if(!src||!level)return src;
  const levels=ROMAN_LEVELS.map(escRe).join('|');
  // 「Ⅰ■...Ⅱ■...」のようにレベル記号の前に空白がないケースが多いため、
  // 空白前提にせず、ローマ数字そのものをレベル境界として検出する。
  // ただし効果本文中の任意のローマ数字誤検出を避けるため、直後が「■」「▼」「●」または行末のものを優先する。
  const boundaryRe=new RegExp('('+levels+')(?=■|▼|●|$)','g');
  const hits=[];
  let m;
  while((m=boundaryRe.exec(src)))hits.push({level:m[1],index:m.index});
  if(!hits.length){
    const looseRe=new RegExp('('+levels+')','g');
    while((m=looseRe.exec(src)))hits.push({level:m[1],index:m.index});
  }
  const hit=hits.find(h=>h.level===level);
  if(!hit)return src;
  const currentIndex=hits.indexOf(hit);
  const next=hits[currentIndex+1];
  // 選択Lv本文の先頭に残る「Ⅰ」等は、条件ブロックではなくレベル見出しである。
  // これを残すと splitSkillConditionBlocks 側で疑似的な「常に」ブロックになり、
  // 主将限定の付与技能（例: 不敗→妙手）が補佐・副将でも有効扱いになるため除去する。
  return norm(src.slice(hit.index+hit.level.length, next?next.index:src.length));
}
function extractAllRomanLevelBlocks(text){
  const src=norm(text);
  if(!src)return [];
  const levels=ROMAN_LEVELS.map(escRe).join('|');
  const boundaryRe=new RegExp('('+levels+')(?=■|▼|●|$)','g');
  const hits=[];
  let m;
  while((m=boundaryRe.exec(src)))hits.push({level:m[1],index:m.index});
  if(!hits.length)return [{level:'',text:src}];
  return hits.map((hit,idx)=>{
    const next=hits[idx+1];
    return {level:hit.level,text:norm(src.slice(hit.index,next?next.index:src.length))};
  }).filter(x=>x.text);
}



function extractEmbeddedSkillRefsFromText(text){const refs=[];const source=String(text||'');if(!source)return refs;const re=/(?:^|[■●\s　])([一-鿿々ぁ-んァ-ヶーA-Za-z0-9]+?)Lv([1-9]|10)を付与（この技能を持つ武将が所持しているものとして扱う）/g;for(const m of source.matchAll(re)){const name=norm(m[1]);const levelNum=Number(m[2]);const level=ROMAN_LEVELS[levelNum-1]||'';if(name&&level)refs.push({name,level,matchedText:norm(m[0])});}return refs;}
function getReferencedSkillEntriesFromLines(lines){const refs=[];const seen=new Set();(Array.isArray(lines)?lines:[]).forEach(line=>{extractEmbeddedSkillRefsFromText(line).forEach(ref=>{const key=`${ref.name}__${ref.level}`;if(seen.has(key))return;seen.add(key);refs.push(ref);});});return refs.map(ref=>{const skillItem=(state.skills||[]).find(item=>norm(item?.name||item?.title||'')===ref.name);if(!skillItem)return {name:ref.name,level:ref.level,matchedText:ref.matchedText,found:false,reason:'state.skills で name 完全一致なし'};const section=Array.isArray(skillItem?.sections)&&skillItem.sections.length?skillItem.sections[0]:null;const content=filterSkillContentLines(section?.content||[]);if(!content.length)return {name:ref.name,level:ref.level,matchedText:ref.matchedText,found:false,reason:'sections[0].content が空'};return {name:ref.name,level:ref.level,matchedText:ref.matchedText,found:true,content,sourceGeneral:norm(skillItem?.sourceGeneral||skillItem?.raw?.sourceGeneral||'')};});}
function addGrantedSkillParameterRecordsFromLines(lines,parentSkillName,add,extra={}){
  const sourceLines=Array.isArray(lines)?lines:[];
  const entries=getReferencedSkillEntriesFromLines(sourceLines);
  entries.forEach(entry=>{
    const source=`技能:${entry.name}${entry.level}`;
    const levelNumber=ROMAN_LEVELS.indexOf(entry.level)+1;
    const parentText=sourceLines.find(line=>norm(line).includes(entry.matchedText))||sourceLines.join(' ');
    const extraInfo={...extra,formationSkillName:entry.name,formationSavedLevel:levelNumber||0,grantedSkillName:entry.name,grantedSkillLevel:entry.level,grantedFromSkill:parentSkillName,grantedFromMatchedText:entry.matchedText,grantedFromParentText:parentText};
    let adopted=false;
    let selected='';
    if(entry.found){
      const rawContent=(Array.isArray(entry.content)?entry.content:[]).filter(line=>!isOwnerListContentLine(line)).join(' ');
      selected=extractRomanLevelBlockText(rawContent,entry.level);
      if(selected){add(source,selected,'include',extraInfo);adopted=true;}
    }
    if(!adopted){
      add(source,`参照技能データ未取得: ${entry.name}${entry.level}`,'include',extraInfo);
    }
    const logPayload={sourceSkill:parentSkillName,grantedSkill:entry.name,grantedLv:entry.level,matchedText:entry.matchedText,parentText:norm(parentText).slice(0,220),reason:'この技能を持つ武将が所持しているものとして扱う',recordSource:source,skillFound:!!entry.found,adopted:true,hasEffectText:!!selected,notFoundReason:entry.reason||''};
    debugLog('parameterSummary:granted-skill',logPayload);
    debugLog('formation:granted-skill',logPayload);
  });
}
function renderEmbeddedSkillCards(lines){const entries=getReferencedSkillEntriesFromLines(lines).filter(entry=>entry.found);if(!entries.length)return '';return `<div style="display:grid;gap:12px;margin-top:12px">${entries.map(entry=>`<div class="general-skill-card" style="background:#f8fafc"><div class="row between" style="align-items:flex-start;gap:12px"><div class="general-skill-name" style="margin-bottom:0">${esc(entry.name)}</div><div><span class="badge">付与Lv: ${esc(entry.level)}</span><span class="badge">技能データ参照</span></div></div><div class="general-text" style="margin-top:12px">${fmtContent(entry.content)}</div></div>`).join('')}</div>`;}
function buildEmbeddedSkillDebugInfo(item){const sections=(Array.isArray(item?.sections)?item.sections:[]).filter(sec=>isGeneralSkillSection(item,sec));const logs=[];logs.push(`selected=${norm(item?.name||item?.title||'')}`);logs.push(`skillsDatasetCount=${Array.isArray(state.skills)?state.skills.length:0}`);sections.forEach(sec=>{const filteredContent=filterSkillContentLines(sec?.content||[]);logs.push(`--- skill:${norm(sec?.title||'')} ---`);logs.push(`filteredLineCount=${filteredContent.length}`);const refs=[];(filteredContent||[]).forEach((line,idx)=>{const found=extractEmbeddedSkillRefsFromText(line);logs.push(`line[${idx}]=${norm(line)}`);logs.push(`line[${idx}] refs=${JSON.stringify(found.map(v=>({name:v.name,level:v.level,matchedText:v.matchedText})))}`);refs.push(...found);});if(!refs.length){logs.push('resolvedRefs=[]');return;}const resolved=getReferencedSkillEntriesFromLines(filteredContent);resolved.forEach(entry=>{if(entry.found){logs.push(`resolved ${entry.name} Lv${entry.level}: FOUND sourceGeneral=${entry.sourceGeneral||''} contentLines=${Array.isArray(entry.content)?entry.content.length:0}`);}else{logs.push(`resolved ${entry.name} Lv${entry.level}: NOT_FOUND reason=${entry.reason||''}`);}});});return logs.join('\n');}
function collectReferencedSkillNamesFromText(text,out){const s=String(text||'');if(!s)return;for(const m of s.matchAll(/「([^」]+)」/g)){const n=norm(m[1]);if(n)out.add(n);}for(const m of s.matchAll(/([一-鿿々ぁ-んァ-ヶーA-Za-z0-9]+)を持つ武将/g)){const n=norm(m[1]);if(n)out.add(n);}for(const m of s.matchAll(/([一-鿿々ぁ-んァ-ヶーA-Za-z0-9]+)を習得/g)){const n=norm(m[1]);if(n)out.add(n);}}
function collectSkillNamesFromGeneralItem(item){
  const out=new Set();
  const itemName=norm(item?.name||item?.title||getItemDisplayName(item)||'');
  if(!itemName)return out;
  // FIX[HADO-2.7.3.47-GENERAL-SKILL-SOURCE-BOUNDARY]:
  // 武将の関連技能・自部隊不利対策の所有技能判定は、実技能欄だけを正本にする。
  // 攻略コメント/おすすめ説明/相性説明/評論文に出る「UR曹丕の技能『栄華』」等は、
  // その武将の所持技能ではないため、Raw全文・sections全文・引用符内語句からは採用しない。
  // 正本経路: 技能テーブル(row[0]=技能名+Lv,row[1]=効果本文) / 「〇〇の技能」配下の技能section / 表示用技能カード抽出結果。
  try{getOwnedSkillLevelMapFromTables(item).forEach((level,name)=>{const n=norm(name);if(n)out.add(n);});}catch{}
  try{collectGeneralSkillTableSections(item).forEach(sec=>{const n=norm(sec?.title||'');if(n)out.add(n);});}catch{}
  try{extractSkillEntries(item,itemName).forEach(entry=>{const n=norm(entry?.name||'');if(n)out.add(n);});}catch{}
  // 診断のみ：攻略コメント等に含まれる技能名候補を可視化する。採用はしない。
  try{
    const mentioned=new Set();
    collectReferencedSkillNamesFromText(stringifyWithoutTextSample(sanitizeRawForSearch(item,item?.raw||item)),mentioned);
    (Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{
      if(Array.isArray(sec?.content))sec.content.forEach(line=>collectReferencedSkillNamesFromText(line,mentioned));
    });
    const suppressed=[...mentioned].map(norm).filter(n=>n&&!out.has(n)&&findItemByCategoryAndName('skills',n));
    if(suppressed.length)debugLog('relatedLinks:suppress-general-commentary-skill-noise',{general:itemName,suppressed:[...new Set(suppressed)].sort((a,b)=>a.localeCompare(b,'ja')).slice(0,50),adopted:[...out].sort((a,b)=>a.localeCompare(b,'ja')),policy:'武将関連技能は実技能欄のみ採用。攻略コメント・おすすめ説明・相性説明内の技能名は採用しない。'});
  }catch{}
  return out;
}
function collectSkillNamesFromEquipmentItem(item){
  const out=new Set();
  const itemName=norm(item?.name||item?.title||getItemDisplayName(item)||'');
  if(!itemName)return out;
  // FIX[HADO-2.8.9.24.1-EQUIPMENT-RELATED-SKILL-BOUNDARY]:
  // 装備の関連技能は、装備技能表に直接掲載された技能と、その技能本文で「技能Lv+1」として明示された参照技能だけを採用する。
  // Raw全文・おすすめ武将・攻略コメント・入手方法・関連リンク・状態変化名から技能名を拾うと、披荊斬棘戈のように
  // 同じ能力変化を持つ多数の技能が関連技能へ混入するため、表示直前と索引構築の双方で境界を固定する。
  try{
    const split=splitEquipmentTablesForTabs(item);
    const blocks=getEquipmentSkillStageBlocks(item,split.skill||[]);
    blocks.forEach(block=>{
      (Array.isArray(block?.table)?block.table:[]).forEach(row=>{
        if(!Array.isArray(row)||row.length<2)return;
        const skillName=norm(row[0]||'');
        const body=norm(row.slice(1).join(' '));
        if(!skillName||!body)return;
        if(/^(最高レア|種類|兵科|レア|統率|武力|知力|政治|魅力|武将|特徴|装備品の入手方法|探索の進め方|専用武将|おすすめ武将)$/.test(skillName))return;
        out.add(skillName);
        collectReferencedSkillNamesFromText(body,out);
      });
    });
  }catch(err){
    debugLog('relatedLinks:equipment-skill-boundary-error',{equipment:itemName,error:err?.message||String(err)});
  }
  // 診断のみ：従来の全文スキャンなら拾ってしまう技能名を可視化する。採用はしない。
  try{
    const mentioned=new Set();
    collectReferencedSkillNamesFromText(stringifyWithoutTextSample(sanitizeRawForSearch(item,item?.raw||item)),mentioned);
    (Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{
      if(Array.isArray(sec?.content))sec.content.forEach(line=>collectReferencedSkillNamesFromText(line,mentioned));
    });
    const suppressed=[...mentioned].map(norm).filter(n=>n&&!out.has(n)&&findItemByCategoryAndName('skills',n));
    if(suppressed.length)debugLog('relatedLinks:suppress-equipment-commentary-skill-noise',{equipment:itemName,suppressed:[...new Set(suppressed)].sort((a,b)=>a.localeCompare(b,'ja')).slice(0,80),adopted:[...out].sort((a,b)=>a.localeCompare(b,'ja')),policy:'装備関連技能は装備技能表と技能Lv+1参照のみ採用。全文・おすすめ・攻略コメント由来の技能名は採用しない。'});
  }catch{}
  return out;
}

function getStatusEffectProfilesForRelatedLinks(statusEffectNames){
  const rawItems=Array.isArray(state.statusEffects)?state.statusEffects:[];
  const names=(statusEffectNames||[]).map(norm).filter(Boolean);
  const cacheKey=[rawItems.length,names.join('|')].join('::');
  if(state._statusEffectRelatedProfilesCache&&state._statusEffectRelatedProfilesCache.key===cacheKey){
    return state._statusEffectRelatedProfilesCache.profiles;
  }
  const profiles=[];
  const seen=new Set();
  rawItems.forEach(item=>{
    const profile=getStatusEffectProfile(item);
    const key=profile.originalName||profile.displayName;
    if(key&&!seen.has(key)){profiles.push(profile);seen.add(key);}
  });
  names.forEach(n=>{
    if(!n||seen.has(n))return;
    const profile=getStatusEffectProfile(n);
    profiles.push(profile);
    seen.add(n);
  });
  state._statusEffectRelatedProfilesCache={key:cacheKey,profiles};
  return profiles;
}
function collectStatusEffectNamesFromText(text,statusEffectNames){
  const source=normalizeHadouCrawlerTypoText(text||'');
  const hits=new Set();
  if(!source)return hits;
  const profiles=getStatusEffectProfilesForRelatedLinks(statusEffectNames);
  profiles.forEach(profile=>{
    const r=detectStatusEffectRelationForOwnerText(source,profile);
    if(r.matched){
      const display=profile.displayName||profile.originalName;
      if(display)hits.add(display);
    }
  });
  return hits;
}

const ETHNIC_GENERAL_SKILL_NAMES=['烏桓','羌','鮮卑','南蛮','五渓蛮','山越'];
function collectEthnicSkillNamesFromGeneralItem(item){
  const out=new Set();
  try{collectSkillNamesFromGeneralItem(item).forEach(name=>out.add(norm(name)));}catch{}
  try{[...getOwnedSkillLevelMapFromTables(item).keys()].forEach(name=>out.add(norm(name)));}catch{}
  return out;
}
function buildEthnicGeneralIndex(){
  const index={};
  ETHNIC_GENERAL_SKILL_NAMES.forEach(name=>index[name]=[]);
  (state.generals||[]).forEach(item=>{
    const generalName=normalizeSaveItemName(getItemDisplayName(item));
    if(!generalName)return;
    const skills=collectEthnicSkillNamesFromGeneralItem(item);
    ETHNIC_GENERAL_SKILL_NAMES.forEach(group=>{
      if(skills.has(group))index[group].push({name:generalName,item,ethnicGroup:group,skills:[...skills]});
    });
  });
  Object.keys(index).forEach(group=>index[group].sort((a,b)=>a.name.localeCompare(b.name,'ja')));
  state.ethnicGeneralIndex=index;
  const summary=Object.fromEntries(Object.entries(index).map(([k,v])=>[k,v.length]));
  state.diagnostics.ethnicGeneralIndex={timestamp:debugTimestamp(),summary};
  debugLog('ethnicGeneralIndex:build',{summary,samples:Object.fromEntries(Object.entries(index).map(([k,v])=>[k,v.slice(0,10).map(x=>x.name)]))});
  return index;
}
function getArmamentEthnicGroupByName(armamentName){
  const item=findItemByDisplayName('ethnicArmaments',armamentName);
  return norm(item?.ethnicGroup||'');
}
function getEthnicGeneralCandidatesForArmament(armamentName){
  const ethnicGroup=getArmamentEthnicGroupByName(armamentName);
  if(!ethnicGroup)return [];
  const index=state.ethnicGeneralIndex&&Object.keys(state.ethnicGeneralIndex).length?state.ethnicGeneralIndex:buildEthnicGeneralIndex();
  let candidates=Array.isArray(index[ethnicGroup])?index[ethnicGroup]:[];
  if(state.viewMode==='saved'){
    const current=getCurrentSave();
    const allowed=new Set((current?.generals||[]).map(normalizeSaveItemName));
    candidates=candidates.filter(c=>allowed.has(normalizeSaveItemName(c.name)));
  }
  return candidates;
}
function formationEthnicGeneralDisplayName(name){
  const n=normalizeSaveItemName(name||'');
  if(!n)return '未指定';
  return norm(formationDisplayName('generals',n)).replace(/（[^）]*）$/,'');
}
function buildFormationEthnicGeneralSelectOptions(armSelection){
  const armName=normalizeSaveItemName(armSelection?.name||'');
  const selected=normalizeSaveItemName(armSelection?.ethnicGeneralName||'');
  if(!armName)return '<option value="">未指定</option>';
  const candidates=getEthnicGeneralCandidatesForArmament(armName);
  const names=new Set(candidates.map(c=>normalizeSaveItemName(c.name)));
  let html='<option value="">未指定</option>';
  if(selected&&!names.has(selected))html+=`<option value="${esc(selected)}" selected>${esc(formationEthnicGeneralDisplayName(selected))}（候補外）</option>`;
  html+=candidates.map(c=>`<option value="${esc(c.name)}" ${normalizeSaveItemName(c.name)===selected?'selected':''}>${esc(formationEthnicGeneralDisplayName(c.name))}</option>`).join('');
  return html;
}
function getFormationEthnicGeneralMeta(f){
  const arm=sanitizeFormationEthnicArmamentSelection(f?.ethnicArmament||{});
  const name=normalizeSaveItemName(arm.ethnicGeneralName||'');
  if(!arm.name||!name)return null;
  const armItem=findItemByDisplayName('ethnicArmaments',arm.name);
  const ethnicGroup=norm(armItem?.ethnicGroup||getArmamentEthnicGroupByName(arm.name));
  const generalItem=findItemByDisplayName('generals',name);
  const selectedIsSaved=state.viewMode!=='saved'||isSavedName('generals',name);
  if(!generalItem){
    debugLog('formation:ethnic-general-excluded',{armament:arm.name,ethnicGroup,ethnicGeneralName:name,reason:'general item not found'});
    return null;
  }
  if(!selectedIsSaved){
    debugLog('formation:ethnic-general-excluded',{armament:arm.name,ethnicGroup,ethnicGeneralName:name,reason:'selected ethnic general is not included in current saved generals'});
    return null;
  }
  const candidateNames=new Set(getEthnicGeneralCandidatesForArmament(arm.name).map(c=>normalizeSaveItemName(c.name)));
  const candidateMatched=candidateNames.has(name);
  debugLog('formation:ethnic-general-resolved',{armament:arm.name,ethnicGroup,ethnicGeneralName:name,candidateMatched,source:'ethnicArmament',policy:'指定した異民族武将の技能を主将技能として扱う'});
  return {item:generalItem,holder:getItemDisplayName(generalItem),kind:'異民族武将',slotKey:'main',slotLabel:'主将',holderSlot:'main',holderRole:'main',sourceType:'ethnicGeneral',ethnicArmamentName:arm.name,ethnicGroup,candidateMatched};
}
function addStatusEffectNameHitsFromText(out,text,statusEffectNames){
  collectStatusEffectNamesFromText(text,statusEffectNames).forEach(v=>out.add(v));
}
function pushStatusEffectSourcePart(parts,value){
  const t=norm(value);
  if(t)parts.push(t);
}
function isRomanSkillLevelCell(value){return /^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+$/.test(norm(value||''));}
const TACTIC_ADDITIONAL_EFFECT_STATUS_RULES=[
  {effect:'攻撃変化',summaryKey:'攻撃'},
  {effect:'防御変化',summaryKey:'防御'},
  {effect:'知力変化',summaryKey:'知力'},
  {effect:'機動変化',summaryKey:'機動'},
  {effect:'攻撃速度変化',summaryKey:'攻撃速度'},
  {effect:'会心発生変化',summaryKey:'会心発生'},
  {effect:'会心威力変化',summaryKey:'会心威力'},
  {effect:'戦法速度変化',summaryKey:'戦法速度'},
  {effect:'戦法威力変化',summaryKey:'戦法威力'},
  {effect:'対物特効変化',summaryKey:'対物特効'},
  {effect:'兵科相性変化',summaryKey:'兵科相性'},
  {effect:'兵器速度変化',summaryKey:'兵器速度'},
  {effect:'命中変化',summaryKey:'命中'},
  {effect:'撃心発生変化',summaryKey:'撃心発生'},
  {effect:'撃心威力変化',summaryKey:'撃心威力'},
  {effect:'通常攻撃威力変化',summaryKey:'通常攻撃威力'},
  {effect:'火属性威力変化',summaryKey:'火属性威力'},
  {effect:'騎兵特効',summaryKey:'騎兵特効'},
  {effect:'歩兵特効',summaryKey:'歩兵特効'},
  {effect:'弓兵特効',summaryKey:'弓兵特効'},
  {effect:'相性変化',summaryKey:'兵科相性'},
  {effect:'即時戦法',summaryKey:'戦法ゲージ',special:'tacticShorten'},
  {effect:'即時攻撃',summaryKey:'攻撃待ち時間',special:'attackShorten'},
  {effect:'即時兵器行動',summaryKey:'兵器速度',special:'siegeActionShorten'}
];
function getTacticAdditionalEffectTargetSide(joined){
  const text=norm(joined||'');
  if(/味方|自分|自身|自部隊|自軍/.test(text))return 'self';
  if(/敵|対象部隊|攻撃対象/.test(text))return 'enemy';
  return '';
}
function pushTacticAdditionalEffectSyntheticPart(parts,rule,side,joined){
  const summaryKey=norm(rule?.summaryKey||'');
  if(!summaryKey)return;
  if(rule.special==='tacticShorten'){
    pushStatusEffectSourcePart(parts,'自部隊の戦法待ち時間を短縮する 追加効果 即時戦法');
    return;
  }
  if(rule.special==='attackShorten'){
    pushStatusEffectSourcePart(parts,'自部隊に攻撃短縮を付与する 追加効果 即時攻撃');
    return;
  }
  if(rule.special==='siegeActionShorten'){
    pushStatusEffectSourcePart(parts,'自部隊の兵器速度が上昇する 追加効果 即時兵器行動');
    return;
  }
  if(!side)return;
  const verb=side==='self'?'上昇':'低下';
  const owner=side==='self'?'自部隊':'敵部隊';
  pushStatusEffectSourcePart(parts,`${owner}の${summaryKey}が${verb}する 追加効果 ${norm(rule.effect)} ${norm(joined)}`);
}
function addTacticAbilityChangeSyntheticParts(parts,cells){
  const joined=norm((cells||[]).join(' '));
  if(!joined)return;
  const side=getTacticAdditionalEffectTargetSide(joined);
  TACTIC_ADDITIONAL_EFFECT_STATUS_RULES.forEach(rule=>{
    const effect=norm(rule.effect||'');
    if(!effect)return;
    if(!new RegExp(escRe(effect)).test(joined))return;
    // 「攻撃変化」が「攻撃速度変化」に誤爆しないよう、短い項目は専用ガードを置く。
    if(effect==='攻撃変化'&&/攻撃速度変化|通常攻撃威力変化|戦法攻撃/.test(joined))return;
    if(effect==='防御変化'&&/防御中/.test(joined))return;
    pushTacticAdditionalEffectSyntheticPart(parts,rule,side,joined);
  });
}

function collectTacticStatusEffectSourceParts(item,parts,options={}){
  // FIX[HADO-2.5.5.21-TACTIC-OWNER-MAIN-SECTIONS]: 派生戦法データはtablesではなくsectionsに主効果を保持するため、戦法本文も所有者検索対象にする。
  (Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{
    const title=norm(sec?.title||'');
    if(title)pushStatusEffectSourcePart(parts,title);
    (Array.isArray(sec?.content)?sec.content:[]).forEach(line=>pushStatusEffectSourcePart(parts,line));
  });
  (Array.isArray(item?.raw?.sections)?item.raw.sections:[]).forEach(sec=>{
    const title=norm(sec?.title||'');
    if(title)pushStatusEffectSourcePart(parts,title);
    (Array.isArray(sec?.content)?sec.content:[]).forEach(line=>pushStatusEffectSourcePart(parts,line));
  });
  (Array.isArray(item?.tables)?item.tables:[]).forEach(table=>{
    const rows=getTableRows(table);
    if(!rows.length)return;
    const flat=rows.flat().map(norm).join(' ');
    const isMainEffect=/兵科.*効果系統.*攻撃属性|発動間隔.*対象範囲|\b効果\b/.test(flat);
    const isAdditional=/追加効果.*対象範囲.*継続|追加効果/.test(flat);
    if(!isMainEffect&&!isAdditional)return;
    rows.forEach(row=>{
      if(!Array.isArray(row))return;
      const cells=row.map(norm).filter(Boolean);
      if(!cells.length)return;
      if(cells.some(v=>/おすすめ編制|入手方法|ランキング|関連リンク|相性の良い武将|各レアリティ|性能$/.test(v)))return;
      pushStatusEffectSourcePart(parts,cells.join(' '));
      addTacticAbilityChangeSyntheticParts(parts,cells);
    });
  });
  if(options.includeTacticAdditionalEffects){
    try{collectTacticAdditionalEffectTexts(item).forEach(v=>pushStatusEffectSourcePart(parts,v));}catch{}
  }
}
function collectSkillStatusEffectSourceParts(item,parts){
  // FIX[HADO-2.5.6.18-SKILL-RELATED-LINK-LEVEL-SCOPE]:
  // 内容詳細の表示は全レベルを維持する。一方、関連リンクの状態変化判定は
  // 全データ武将オプションに合わせ、初期=LvⅠ、最大=実在する最大Lvだけを対象にする。
  getSkillRelatedLinkStatusEffectTexts(item).forEach(text=>pushStatusEffectSourcePart(parts,text));
}
function collectEquipmentStatusEffectSourceParts(item,parts){
  try{
    const split=splitEquipmentTablesForTabs(item);
    const effectiveEquipmentStage=getEffectiveEquipmentStageForItem(item);
    const selected=selectEquipmentSkillStageBlock(item,split.skill||[],effectiveEquipmentStage);
    const selectedRows=(selected?.block&&Array.isArray(selected.block.table))?selected.block.table:[];
    selectedRows.forEach(row=>{
      if(!Array.isArray(row)||row.length<2)return;
      const skillName=norm(row[0]||'');
      const body=norm(row.slice(1).join(' '));
      if(skillName&&body)pushStatusEffectSourcePart(parts,skillName+' '+body);
    });
    return;
  }catch{}
  (Array.isArray(item?.tables)?item.tables:[]).forEach(table=>{
    const rows=getTableRows(table);
    rows.forEach(row=>{
      if(!Array.isArray(row)||row.length<2)return;
      const first=norm(row[0]||'');
      const body=norm(row.slice(1).join(' '));
      if(first&&body&&/[■●▼]|\+\d|上昇|低下|付与|避ける|無効|解除|打ち消/.test(body))pushStatusEffectSourcePart(parts,first+' '+body);
    });
  });
}
function collectGeneralStatusEffectSourceParts(item,parts){
  try{
    collectParameterSourceRecords(item).forEach(record=>{
      if(record?.kind==='include')pushStatusEffectSourcePart(parts,record.source+' '+record.text);
    });
  }catch{}
}
function buildStatusEffectRelatedLinkText(item,options={}){
  if(!item)return '';
  const cacheKey=options.includeTacticAdditionalEffects?'_statusEffectRelatedLinkTextSafeWithTacticEffects':'_statusEffectRelatedLinkTextSafeAll';
  if(Object.prototype.hasOwnProperty.call(item,cacheKey))return item[cacheKey];
  const parts=[];
  const category=detailCategory(item);
  pushStatusEffectSourcePart(parts,item?.name||item?.title||'');
  if(category==='generals')collectGeneralStatusEffectSourceParts(item,parts);
  else if(category==='tactics')collectTacticStatusEffectSourceParts(item,parts,options);
  else if(category==='skills')collectSkillStatusEffectSourceParts(item,parts);
  else if(category==='equipments')collectEquipmentStatusEffectSourceParts(item,parts);
  else{
    pushStatusEffectSourcePart(parts,item?.description||'');
    (Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{
      pushStatusEffectSourcePart(parts,sec?.title||'');
      (Array.isArray(sec?.content)?sec.content:[]).forEach(v=>pushStatusEffectSourcePart(parts,v));
    });
  }
  const text=norm(parts.filter(Boolean).join(' '));
  try{Object.defineProperty(item,cacheKey,{value:text,writable:true,configurable:true});}catch{item[cacheKey]=text;}
  return text;
}
function collectStatusEffectNamesFromMetricSegments(item,statusEffectNames,options={}){
  const out=new Set();
  const text=buildStatusEffectRelatedLinkText(item,options);
  addStatusEffectNameHitsFromText(out,text,statusEffectNames);
  return out;
}
function collectStatusEffectNamesFromSkillItem(item,statusEffectNames){
  return collectStatusEffectNamesFromMetricSegments(item,statusEffectNames);
}
function collectStatusEffectNamesFromTacticItem(item,statusEffectNames){
  return collectStatusEffectNamesFromMetricSegments(item,statusEffectNames,{includeTacticAdditionalEffects:true});
}
function collectStatusEffectNamesFromEquipmentItem(item,statusEffectNames){
  return collectStatusEffectNamesFromMetricSegments(item,statusEffectNames);
}
function addStatusRelationValues(target,values){
  (values||[]).forEach(v=>{
    if(v&&typeof v==='object'&&norm(v.name))target.push(v);
    else{const n=norm(v);if(n)target.push({name:n});}
  });
}
function buildStatusEffectRelatedLinkParts(item,options={}){
  if(!item)return [];
  const parts=[];
  const category=detailCategory(item);
  pushStatusEffectSourcePart(parts,item?.name||item?.title||'');
  if(category==='generals')collectGeneralStatusEffectSourceParts(item,parts);
  else if(category==='tactics')collectTacticStatusEffectSourceParts(item,parts,options);
  else if(category==='skills')collectSkillStatusEffectSourceParts(item,parts);
  else if(category==='equipments')collectEquipmentStatusEffectSourceParts(item,parts);
  else{
    pushStatusEffectSourcePart(parts,item?.description||'');
    (Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{
      pushStatusEffectSourcePart(parts,sec?.title||'');
      (Array.isArray(sec?.content)?sec.content:[]).forEach(v=>pushStatusEffectSourcePart(parts,v));
    });
  }
  return parts.map(norm).filter(Boolean);
}
function collectStatusEffectRelationsFromMetricSegments(item,statusEffectNames,options={}){
  const out=[];
  const seen=new Set();
  const parts=buildStatusEffectRelatedLinkParts(item,options);
  parts.forEach(part=>{
    collectStatusEffectRelationsFromText(part,statusEffectNames).forEach(v=>{
      const key=[v?.name||v,v?.groupKey||'',v?.relationType||'',v?.reason||''].join('@@');
      if(seen.has(key))return;
      seen.add(key);
      out.push(v);
    });
  });
  if(!options.suppressDebug)debugLog('relatedStatusEffects:segment-context',{source:'HADO-2.5.6.1',item:getItemDisplayName(item),category:detailCategory(item),partCount:parts.length,hitCount:out.length,hits:out.slice(0,40),policy:'状態変化関連リンクは6分類化。短いsummaryKeyが攻撃速度等の長い語に混入しないように判定し、耐性系は分類理由もログ出力する。'});
  return out;
}
function collectStatusEffectRelationsFromSkillItem(item,statusEffectNames){
  return collectStatusEffectRelationsFromMetricSegments(item,statusEffectNames);
}
function collectStatusEffectRelationsFromTacticItem(item,statusEffectNames){
  return collectStatusEffectRelationsFromMetricSegments(item,statusEffectNames,{includeTacticAdditionalEffects:true});
}
function collectStatusEffectRelationsFromEquipmentItem(item,statusEffectNames){
  return collectStatusEffectRelationsFromMetricSegments(item,statusEffectNames);
}
function refreshOwnerStatusEffectIndexes(generalStatusEffectNames,equipmentStatusEffectNames,generalSkillNames,generalTacticNames,equipmentSkillNames,skillStatusEffectNames,tacticStatusEffectNames,statusEffectNames){
  let generalOwnTacticHits=0,generalOwnSkillHits=0,generalDirectHits=0,equipmentSkillHits=0,equipmentDirectHits=0;
  (state.generals||[]).forEach(item=>{
    const name=norm(item?.name||item?.title||'');
    if(!name)return;
    if(!generalStatusEffectNames.has(name))generalStatusEffectNames.set(name,new Set());
    const target=generalStatusEffectNames.get(name);
    collectStatusEffectNamesFromMetricSegments(item,statusEffectNames).forEach(v=>{target.add(v);generalDirectHits++;});
    (generalTacticNames.get(name)||new Set()).forEach(tacticName=>{
      (tacticStatusEffectNames.get(tacticName)||new Set()).forEach(v=>{target.add(v);generalOwnTacticHits++;});
    });
    (generalSkillNames.get(name)||new Set()).forEach(skillName=>{
      (skillStatusEffectNames.get(skillName)||new Set()).forEach(v=>{target.add(v);generalOwnSkillHits++;});
    });
  });
  (state.equipments||[]).forEach(item=>{
    const name=norm(item?.name||item?.title||'');
    if(!name)return;
    if(!equipmentStatusEffectNames.has(name))equipmentStatusEffectNames.set(name,new Set());
    const target=equipmentStatusEffectNames.get(name);
    collectStatusEffectNamesFromEquipmentItem(item,statusEffectNames).forEach(v=>{target.add(v);equipmentDirectHits++;});
    (equipmentSkillNames.get(name)||new Set()).forEach(skillName=>{
      (skillStatusEffectNames.get(skillName)||new Set()).forEach(v=>{target.add(v);equipmentSkillHits++;});
    });
  });
  debugLog('relatedStatusEffects:owner-refresh',{source:'HADO-2.5.5.7',generalDirectHits,generalOwnTacticHits,generalOwnSkillHits,equipmentDirectHits,equipmentSkillHits,generalOwners:generalStatusEffectNames.size,equipmentOwners:equipmentStatusEffectNames.size,policy:'武将は所有戦法+所有技能、装備は装備本文+装備技能から能力変化系状態変化を関連リンク化'});
}


async function buildLookupIndexes(){
const generalSkillNames=new Map();
const equipmentSkillNames=new Map();
const generalTacticNames=new Map();
const generalStatusEffectNames=new Map();
const equipmentStatusEffectNames=new Map();
const skillStatusEffectNames=new Map();
const tacticStatusEffectNames=new Map();
const generalCount=Array.isArray(state.generals)?state.generals.length:0;
const tacticCount=Array.isArray(state.tactics)?state.tactics.length:0;
const skillCount=Array.isArray(state.skills)?state.skills.length:0;
const equipCount=Array.isArray(state.equipments)?state.equipments.length:0;
const total=Math.max(1,generalCount+tacticCount+skillCount+equipCount);
let current=0;
setLoadingState(true,{title:'索引を作成中…',detail:'武将・戦法・技能・装備の基本索引を作成しています。',current,total});
for(let i=0;i<generalCount;i++){
  const item=state.generals[i];
  const name=norm(item?.name||item?.title||'');
  if(name){
    generalSkillNames.set(name,collectSkillNamesFromGeneralItem(item));
    const tacticName=findTacticName(item);
    generalTacticNames.set(name,new Set(tacticName?[norm(tacticName)]:[]));
  }
  current++;
  if(i%25===0){
    setLoadingState(true,{title:'索引を作成中…',detail:`武将索引を作成中 (${current}/${total})`,current,total});
    await nextFrame();
  }
}
for(let i=0;i<tacticCount;i++){
  const item=state.tactics[i];
  const name=norm(item?.name||item?.title||'');
  const sourceGeneral=norm(item?.raw?.sourceGeneral||item?.sourceGeneral||'');
  if(sourceGeneral&&name){
    if(!generalTacticNames.has(sourceGeneral))generalTacticNames.set(sourceGeneral,new Set());
    generalTacticNames.get(sourceGeneral).add(name);
  }
  current++;
  if(i%50===0){
    setLoadingState(true,{title:'索引を作成中…',detail:`戦法索引を作成中 (${current}/${total})`,current,total});
    await nextFrame();
  }
}
for(let i=0;i<skillCount;i++){
  current++;
  if(i%100===0){
    setLoadingState(true,{title:'索引を作成中…',detail:`技能索引を作成中 (${current}/${total})`,current,total});
    await nextFrame();
  }
}
for(let i=0;i<equipCount;i++){
  const item=state.equipments[i];
  const name=norm(item?.name||item?.title||'');
  if(name)equipmentSkillNames.set(name,collectSkillNamesFromEquipmentItem(item));
  current++;
  if(i%25===0){
    setLoadingState(true,{title:'索引を作成中…',detail:`装備索引を作成中 (${current}/${total})`,current,total});
    await nextFrame();
  }
}
debugLog('buildLookupIndexes:summary',{
  source:'HADO-2.5.5.7-lazy-status-effect-link-index',
  generalSkillNames:generalSkillNames.size,
  generalTacticNames:generalTacticNames.size,
  equipmentSkillNames:equipmentSkillNames.size,
  statusEffectPolicy:'状態変化関連リンクは起動時に全件計算せず、詳細表示時に選択項目だけ遅延計算する'
});
state.lookupIndexes={generalSkillNames,equipmentSkillNames,generalTacticNames,generalStatusEffectNames,equipmentStatusEffectNames,skillStatusEffectNames,tacticStatusEffectNames};
}


function buildSavedSearchCacheKey(save){
  try{
    const current=save||getCurrentSave();
    if(!current)return 'no-save';
    const sanitizedGeneralSettings={};
    Object.entries(current.generalSettings||{}).forEach(([key,val])=>{sanitizedGeneralSettings[normalizeSaveItemName(key)]=normalizeGeneralSetting(val);});
    const payload={
      id:current.id||'',
      generals:current.generals||[],
      equipments:current.equipments||[],
      generalSettings:sanitizedGeneralSettings,
      generalStars:current.generalStars||{},
      equipmentStars:current.equipmentStars||{},
      equipmentStages:current.equipmentStages||{},
      ethnicResearchSkills:current.ethnicResearchSkills||{},
      inheritedSkills:current.inheritedSkills||{},
      formationStage:{generalStage:state.generalStage,equipmentStage:state.equipmentStage}
    };
    return JSON.stringify(payload);
  }catch(err){
    debugLog('savedSearchCache:key-error',{message:err?.message||String(err)});
    return `error:${Date.now()}`;
  }
}
function collectMapValuesByNormalizedKey(map,name){
  const out=new Set();
  if(!(map instanceof Map))return out;
  const clean=normalizeSaveItemName(name);
  const direct=map.get(name)||map.get(clean);
  if(direct)direct.forEach(v=>out.add(v));
  map.forEach((values,key)=>{if(normalizeSaveItemName(key)===clean&&values)values.forEach(v=>out.add(v));});
  return out;
}
function findSavedGeneralItemByName(name){const clean=normalizeSaveItemName(name);return (state.generals||[]).find(item=>normalizeSaveItemName(getItemDisplayName(item)||item?.name||item?.title||'')===clean)||null;}

function collectGrantedSkillEntriesForSavedIndex(skillName,level){
  const name=norm(skillName);
  const lv=norm(level);
  if(!name)return [];
  const skillItem=findSkillItemByName(name);
  if(!skillItem)return [];
  const sections=Array.isArray(skillItem?.sections)?skillItem.sections:[];
  const contentLines=[];
  sections.forEach(sec=>{
    const lines=filterSkillContentLines(sec?.content||[]);
    if(lines.length)contentLines.push(...lines);
  });
  if(!contentLines.length)return [];
  const joined=contentLines.join(' ');
  const selected=lv?extractRomanLevelBlockText(joined,lv):joined;
  const sourceLines=selected?[selected]:contentLines;
  return getReferencedSkillEntriesFromLines(sourceLines);
}
function addGrantedSkillsToSavedIndex(skillName,level,skillNames,statusEffectNames,skillStatusLookup,diagnostics,sourceGeneralName){
  const parent=norm(skillName);
  if(!parent)return;
  const entries=collectGrantedSkillEntriesForSavedIndex(parent,level);
  if(!entries.length)return;
  entries.forEach(entry=>{
    if(!entry?.name)return;
    skillNames.add(entry.name);
    const skillStatuses=skillStatusLookup.get(entry.name);
    if(skillStatuses)skillStatuses.forEach(v=>statusEffectNames.add(v));
    diagnostics.push({sourceGeneral:sourceGeneralName||'',sourceSkill:parent,sourceLevel:level||'',grantedSkill:entry.name,grantedLevel:entry.level||'',found:!!entry.found,reason:entry.reason||''});
  });
}

function rebuildSavedModeIndex(){
const current=getCurrentSave();
pruneInvalidInheritedSkillsForCurrentSave('rebuildSavedModeIndex');
const generalNames=new Set((current?.generals||[]).map(v=>normalizeSaveItemName(v)).filter(Boolean));
const equipmentNames=new Set((current?.equipments||[]).map(v=>normalizeSaveItemName(v)).filter(Boolean));
const skillNames=new Set();
const statusEffectNames=new Set();
const lookup=state.lookupIndexes||{};
const equipmentLookup=lookup.equipmentSkillNames instanceof Map?lookup.equipmentSkillNames:new Map();
const generalStatusLookup=lookup.generalStatusEffectNames instanceof Map?lookup.generalStatusEffectNames:new Map();
const equipmentStatusLookup=lookup.equipmentStatusEffectNames instanceof Map?lookup.equipmentStatusEffectNames:new Map();
const skillStatusLookup=lookup.skillStatusEffectNames instanceof Map?lookup.skillStatusEffectNames:new Map();
const savedSkillDiagnostics=[];
const grantedSkillDiagnostics=[];
generalNames.forEach(name=>{
  const generalItem=findSavedGeneralItemByName(name);
  const resolved=generalItem?resolveGeneralSkillProfile(generalItem).map:new Map();
  resolved.forEach((level,skillName)=>{if(skillName)skillNames.add(skillName);});
  const inherited=getCurrentInheritedSkill(name);if(inherited?.skillName){skillNames.add(inherited.skillName);const inheritedStatuses=skillStatusLookup.get(inherited.skillName);if(inheritedStatuses)inheritedStatuses.forEach(v=>statusEffectNames.add(v));addGrantedSkillsToSavedIndex(inherited.skillName,'Ⅰ',skillNames,statusEffectNames,skillStatusLookup,grantedSkillDiagnostics,name);}
  const statuses=collectMapValuesByNormalizedKey(generalStatusLookup,name);
  statuses.forEach(v=>statusEffectNames.add(v));
  resolved.forEach((level,skillName)=>{const skillStatuses=skillStatusLookup.get(skillName);if(skillStatuses)skillStatuses.forEach(v=>statusEffectNames.add(v));addGrantedSkillsToSavedIndex(skillName,level,skillNames,statusEffectNames,skillStatusLookup,grantedSkillDiagnostics,name);});
  if(generalItem||resolved.size)savedSkillDiagnostics.push({general:name,found:!!generalItem,skills:[...resolved.keys()].slice(0,12)});
});
equipmentNames.forEach(name=>{
  const names=collectMapValuesByNormalizedKey(equipmentLookup,name);
  names.forEach(v=>{skillNames.add(v);addGrantedSkillsToSavedIndex(v,'',skillNames,statusEffectNames,skillStatusLookup,grantedSkillDiagnostics,`装備:${name}`);});
  const statuses=collectMapValuesByNormalizedKey(equipmentStatusLookup,name);
  statuses.forEach(v=>statusEffectNames.add(v));
});
const legacySkillFieldCount=Object.values(current?.generalSettings||{}).reduce((sum,val)=>sum+(val&&typeof val==='object'&&val.skills&&typeof val.skills==='object'?Object.keys(val.skills).length:0),0);
if(legacySkillFieldCount)debugLog('saveData:legacy-general-skills-ignored-in-index',{count:legacySkillFieldCount,policy:'保存データ技能一覧は保存技能Lvではなく、保存武将の将星から再計算'});
const nextSavedSearchCacheKey=buildSavedSearchCacheKey(current);
if(state.savedSearchCacheKey!==nextSavedSearchCacheKey){state.savedSearchCacheKey=nextSavedSearchCacheKey;state.savedSearchCacheSeq=(state.savedSearchCacheSeq||0)+1;debugLog('savedSearchCache:key-update',{seq:state.savedSearchCacheSeq,currentSave:current?.name||'',generals:generalNames.size,equipments:equipmentNames.size});}
if(grantedSkillDiagnostics.length)debugLog('savedModeIndex:granted-skills-added',{count:grantedSkillDiagnostics.length,sample:grantedSkillDiagnostics.slice(0,20)});
debugLog('rebuildSavedModeIndex',{generals:generalNames.size,equipments:equipmentNames.size,skills:skillNames.size,statusEffects:statusEffectNames.size,currentSave:current?.name||'',savedSearchCacheSeq:state.savedSearchCacheSeq,policy:'general skills resolved from saved generalStars and granted reference skills',sample:savedSkillDiagnostics.slice(0,8),grantedSkillCount:grantedSkillDiagnostics.length,grantedSkillSample:grantedSkillDiagnostics.slice(0,8)});
state.savedModeIndex={generalNames,equipmentNames,skillNames,statusEffectNames};
invalidateTypeSearchResultCache('saved-mode-index-rebuild');
}

function itemMatchesSavedMode(item,categoryKey){if(categoryKey==='siegeWeapons'||categoryKey==='ethnicArmaments'||categoryKey==='formations')return true;if(categoryKey==='skills'&&isEthnicResearchSkillItem(item))return true;const current=getCurrentSave();if(!current)return false;const name=normalizeSaveItemName(item?.name||item?.title||'');const idx=state.savedModeIndex||{generalNames:new Set(),equipmentNames:new Set(),skillNames:new Set(),statusEffectNames:new Set()};if(categoryKey==='generals')return idx.generalNames.has(name);if(categoryKey==='equipments')return idx.equipmentNames.has(name);if(categoryKey==='tactics'){const sg=normalizeSaveItemName(item?.raw?.sourceGeneral||item?.sourceGeneral||'');return !!sg&&idx.generalNames.has(sg);}if(categoryKey==='skills')return idx.skillNames.has(name);if(categoryKey==='statusEffects')return idx.statusEffectNames.has(name);return false;}
function isBlocked(v){const t=norm(v).toLowerCase();return !!t&&DETAIL_BLOCKLIST.some(w=>t.includes(String(w).toLowerCase()));}
function isStopTitle(t){t=norm(t);return DETAIL_SECTION_STOP_TITLES.some(w=>t.includes(w));}
function isMergedTitle(t){t=norm(t);return !!t&&DETAIL_SECTION_MERGE_TITLES.some(w=>t.includes(w));}
function trimSectionsBeforeStopTitle(sections){if(!Array.isArray(sections))return [];const i=sections.findIndex(sec=>isStopTitle(sec?.title||''));return i>=0?sections.slice(0,i):sections.slice();}
function trimSectionContentAtStop(content){if(!Array.isArray(content))return [];const i=content.findIndex(line=>DETAIL_SECTION_CONTENT_STOP_TEXTS.some(w=>norm(line).includes(w)));const sliced=i>=0?content.slice(0,i):content.slice();return sliced.filter(line=>!isBlocked(line)&&!isOwnerListContentLine(line));}
function filterSections(sections){if(!Array.isArray(sections))return [];let removedTitleCount=0;let removedEmptyCount=0;let removedOwnerLineCount=0;const source=trimSectionsBeforeStopTitle(sections);const filtered=source.map(sec=>{const title=norm(sec?.title||'');const rawContent=Array.isArray(sec?.content)?sec.content:[];const content=trimSectionContentAtStop(rawContent);removedOwnerLineCount+=rawContent.filter(line=>isOwnerListContentLine(line)||isBlocked(line)).length;if(isBlocked(title)||isStopTitle(title)||isOwnerListContentLine(title)){removedTitleCount++;return null;}if(!title&&!content.length){removedEmptyCount++;return null;}if(!isMergedTitle(title)&&!content.length){removedEmptyCount++;return null;}return {...sec,title,content};}).filter(Boolean);if(removedTitleCount||removedEmptyCount||removedOwnerLineCount)debugLog('detailSections:filter-owner-list',{sourceCount:source.length,renderedCount:filtered.length,removedTitleCount,removedEmptyCount,removedOwnerLineCount,blockedWords:DETAIL_BLOCKLIST});return filtered;}
function normalizeDisplayLineBreaks(text){const lines=String(text??'').replace(/\r\n/g,'\n').split('\n');const out=[];const startsNewBlock=line=>/^[■▼●ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]/.test(norm(line));const endsSentence=line=>/[。！？!?)）]$/.test(norm(line));lines.forEach(rawLine=>{const line=String(rawLine??'').trim();if(!line)return;if(!out.length){out.push(line);return;}const prev=out[out.length-1];if(startsNewBlock(line)||endsSentence(prev))out.push(line);else out[out.length-1]=prev+line;});return out;}function fmtContent(lines){const parts=[];const roman=ROMAN_LEVELS;(Array.isArray(lines)?lines:[]).flatMap(line=>normalizeDisplayLineBreaks(line)).forEach(line=>{let text=String(line??'');if(!text)return;text=text.replace(/■/g,'\n■').replace(/▼/g,'\n▼').replace(/●/g,'\n　●');roman.forEach(r=>text=text.replace(new RegExp(r,'g'),`\n${r}`));text.split('\n').map(seg=>seg.replace(/^[ \t]+/,'').trimEnd()).filter(Boolean).forEach(seg=>{const e=escDisplay(seg);if(seg.startsWith('■'))parts.push(`<span style="color:#a16207;font-weight:700">${e}</span>`);else if(seg.startsWith('▼'))parts.push(`<span style="color:#ca8a04">${e}</span>`);else if(roman.some(r=>seg.includes(r)))parts.push(`<hr class="divider"><strong>${e}</strong>`);else parts.push(e);});});return parts.join('<br>');}
function renderSectionsHtml(sections){const fs=filterSections(sections).filter(sec=>norm(sec?.title||'')!=='侍従の配置可能位置と条件');if(!fs.length)return '';return `<table class="section-table">${fs.map(sec=>{const title=norm(sec?.title||'');const content=Array.isArray(sec?.content)?sec.content:[];if(isMergedTitle(title))return `<tr><td colspan="2" class="merge-cell">${escDisplay(title)}</td></tr>`;return `<tr><td>${escDisplay(title)}</td><td>${fmtContent(content)}</td></tr>`;}).join('')}</table>`;}
function renderRaw(item){return `<pre class="raw">${esc(JSON.stringify(item?.raw||item||{},null,2))}</pre>`;}
function renderEquipmentKeyValueRows(rows){if(!Array.isArray(rows)||!rows.length)return '';return `<table class="kv-table">${rows.map(row=>{const key=Array.isArray(row)?row[0]:'';const value=Array.isArray(row)?row[1]:'';const keyText=norm(key);const valueHtml=keyText==='侍従位置'?renderJijuPositionDisplayHtml(value):(keyText==='相性'?renderAffinityClockHtml(value):escDisplay(value));return `<tr><td style="width:220px">${escDisplay(key)}</td><td>${valueHtml}</td></tr>`;}).join('')}</table>`;}
function renderEquipmentHeaderValueTable(headers,values){if(!Array.isArray(headers)||!Array.isArray(values)||!headers.length)return '';return `<table class="generic-table"><thead><tr>${headers.map(v=>`<th>${esc(v)}</th>`).join('')}</tr></thead><tbody><tr>${values.map(v=>`<td>${esc(v)}</td>`).join('')}</tr></tbody></table>`;}
function renderEquipmentTwoColumnFormattedRows(rows){if(!Array.isArray(rows)||!rows.length)return '';return `<table class="generic-table"><tbody>${rows.map(row=>`<tr><td style="width:220px">${esc(Array.isArray(row)?row[0]:'')}</td><td>${fmtContent([Array.isArray(row)?row[1]:''])}</td></tr>`).join('')}</tbody></table>`;}
function renderEquipmentGenericTable(table){if(!Array.isArray(table)||!table.length)return '';const headers=Array.isArray(table[0])?table[0]:[];const body=table.slice(1);return `<table class="generic-table"><thead><tr>${headers.map(v=>`<th>${esc(v)}</th>`).join('')}</tr></thead><tbody>${body.map(row=>`<tr>${(Array.isArray(row)?row:[row]).map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function renderEquipmentTablesHtml(tables){if(!Array.isArray(tables)||!tables.length)return '';const rows=tables.map(t=>getTableRows(t));const blocks=[];if(Array.isArray(rows[0])&&rows[0].length)blocks.push(renderEquipmentKeyValueRows(rows[0]));if(Array.isArray(rows[1])&&Array.isArray(rows[1][0])&&Array.isArray(rows[1][1]))blocks.push(renderEquipmentHeaderValueTable(rows[1][0],rows[1][1]));if(Array.isArray(rows[2])&&rows[2].length)blocks.push(renderEquipmentTwoColumnFormattedRows(rows[2]));if(Array.isArray(rows[3])&&rows[3].length)blocks.push(renderEquipmentGenericTable(rows[3]));if(Array.isArray(rows[4])&&rows[4].length)blocks.push(renderEquipmentGenericTable(rows[4]));if(Array.isArray(rows[5])&&rows[5].length)blocks.push(renderEquipmentKeyValueRows(rows[5]));return blocks.filter(Boolean).join('');}
function renderEquipmentDetail(item){const blocks=[renderStarRatingCard('equipments',item?.name||'',10),renderEquipmentTablesHtml(item?.tables||[])].filter(Boolean).join('');return blocks?`<div class="general-detail-stack">${blocks}</div>`:'';}
function isGeneralItem(item){return detailCategory(item)==='generals';}
function flattenPairRows(table){const rows=[];getTableRows(table).forEach(row=>{if(!Array.isArray(row))return;for(let i=0;i<row.length;i+=2){const key=norm(row[i]||'');const value=norm(row[i+1]||'');if(key)rows.push([key,value]);}});return rows;}
function findTableIndex(tables,predicate){return (Array.isArray(tables)?tables:[]).findIndex((table,idx)=>{try{return !!predicate(table,idx);}catch{return false;}});}
function isStatTable(table){return Array.isArray(table)&&table.length>=3&&table.every(row=>Array.isArray(row)&&row.length>=3&&/^(統率|武力|知力|政治|魅力)$/.test(norm(row[0]||'')));}
function isFiveElementTable(table){return Array.isArray(table)&&table.length>=1&&table.every(row=>Array.isArray(row)&&row.length>=4);}
function findGeneralAbilityTables(item){const tables=Array.isArray(item?.tables)?item.tables:[];let initial=null,max=null,elements=null;let initialIdx=-1,maxIdx=-1;for(let i=0;i<tables.length;i++){if(isStatTable(tables[i])){initial=tables[i];initialIdx=i;break;}}if(initialIdx>=0){for(let i=initialIdx+1;i<tables.length;i++){if(isStatTable(tables[i])){max=tables[i];maxIdx=i;break;}}}const elementStart=maxIdx>=0?maxIdx+1:initialIdx>=0?initialIdx+1:0;for(let i=elementStart;i<tables.length;i++){if(isFiveElementTable(tables[i])){elements=tables[i];break;}}return {initial,max,elements};}
function flattenFiveElements(table){const rows=[];(Array.isArray(table)?table:[]).forEach(row=>{if(!Array.isArray(row))return;for(let i=0;i<row.length;i+=2){const name=norm(row[i]||'');const rank=norm(row[i+1]||'');if(name&&name!=='-'&&rank&&rank!=='-')rows.push([name,rank]);}});return rows;}
function renderFiveElementsTable(table,itemName){const rows=flattenFiveElements(table);if(!rows.length)return '';const editable=state.viewMode==='saved';const settings=editable?getCurrentGeneralSettings(itemName,true):null;return `<table class="generic-table"><thead><tr><th>現Lv</th><th>属性</th><th>適正</th></tr></thead><tbody>${rows.map(row=>{const currentValue=editable?(settings?.fiveElements?.[row[0]]??''):'15';const currentCell=editable?`<input type="text" class="general-five-element-input" data-general-name="${esc(itemName)}" data-element-name="${esc(row[0])}" value="${esc(currentValue)}" inputmode="numeric" style="width:88px" />`:esc(currentValue);return `<tr><td>${currentCell}</td><td>${esc(row[0])}</td><td><span class="general-chip">${esc(row[1])}</span></td></tr>`;}).join('')}</tbody></table>`;}
function buildGeneralAbilityComparisonRows(initialRows,maxRows){const map=new Map();(Array.isArray(initialRows)?initialRows:[]).forEach(row=>{if(!Array.isArray(row)||!norm(row[0]||''))return;map.set(norm(row[0]),{name:norm(row[0]),initialValue:norm(row[1]||''),initialRank:norm(row[2]||''),maxValue:'',maxRank:''});});(Array.isArray(maxRows)?maxRows:[]).forEach(row=>{if(!Array.isArray(row)||!norm(row[0]||''))return;const key=norm(row[0]);if(!map.has(key))map.set(key,{name:key,initialValue:'',initialRank:'',maxValue:'',maxRank:''});const current=map.get(key);current.maxValue=norm(row[1]||'');current.maxRank=norm(row[2]||'');});return [...map.values()];}
function renderGeneralAbilityComparisonTable(initialRows,maxRows,itemName){const rows=buildGeneralAbilityComparisonRows(initialRows,maxRows);if(!rows.length)return '';const editable=state.viewMode==='saved';const settings=editable?getCurrentGeneralSettings(itemName,true):null;return `<table class="generic-table"><thead><tr><th colspan="2">現能力</th><th colspan="3">初期能力</th><th colspan="3">最大能力</th></tr><tr><th>項目</th><th style="text-align:right">値</th><th>項目</th><th style="text-align:right">値</th><th>順位</th><th>項目</th><th style="text-align:right">値</th><th>順位</th></tr></thead><tbody>${rows.map(row=>{const currentValue=editable?(settings?.abilities?.[row.name]??''):row.maxValue;const currentCell=editable?`<input type="text" class="general-current-ability-input" data-general-name="${esc(itemName)}" data-ability-name="${esc(row.name)}" value="${esc(currentValue)}" inputmode="numeric" style="width:88px" />`:esc(currentValue);return `<tr><td>${esc(row.name)}</td><td style="text-align:right">${currentCell}</td><td>${esc(row.name)}</td><td style="text-align:right">${esc(row.initialValue)}</td><td>${esc(row.initialRank)}</td><td>${esc(row.name)}</td><td style="text-align:right">${esc(row.maxValue)}</td><td>${esc(row.maxRank)}</td></tr>`;}).join('')}</tbody></table>`;}
function findGeneralBasicInfoTable(item){const tables=Array.isArray(item?.tables)?item.tables:[];const idx=findTableIndex(tables,table=>flattenPairRows(table).some(pair=>pair[0]==='名')&&flattenPairRows(table).some(pair=>pair[0]==='兵科'));return idx>=0?tables[idx]:null;}
const VALID_JIJU_POSITIONS=new Set(['上','右上','右','右下','下','左下','左','左上']);
function normalizeJijuPositionValue(value){let text=norm(value||'').replace(/／/g,'/');if(!text)return '';const parts=text.split('/').map(v=>norm(v)).filter(Boolean);if(!parts.length)return '';if(!parts.every(v=>VALID_JIJU_POSITIONS.has(v)))return '';return parts.join('/');}
function getValidJijuPositionValues(item){
  const out=[];const seen=new Set();
  function addValue(raw,source){const pos=normalizeJijuPositionValue(raw);if(pos&&!seen.has(pos)){seen.add(pos);out.push(pos);debugLog('general:jiju-position-valid',{name:getItemDisplayName(item),position:pos,source});}}
  const sources=[];
  if(Array.isArray(item?.jiju_positions))sources.push({source:'item.jiju_positions',list:item.jiju_positions});
  if(Array.isArray(item?.raw?.jiju_positions))sources.push({source:'raw.jiju_positions',list:item.raw.jiju_positions});
  sources.forEach(src=>src.list.forEach(entry=>{const raw=(typeof entry==='string')?entry:entry?.position;addValue(raw,src.source);}));
  const tableSourceItem=(item?.raw&&Array.isArray(item.raw.tables))?item.raw:item;
  (Array.isArray(tableSourceItem?.tables)?tableSourceItem.tables:[]).forEach((table,tableIndex)=>{
    const rows=getTableRows(table);
    if(!Array.isArray(rows)||!rows.length)return;
    const header=rows[0]||[];
    if(!Array.isArray(header)||norm(header[0]||'')!=='配置位置')return;
    rows.slice(1).forEach((row,rowIndex)=>{if(Array.isArray(row))addValue(row[0],`tables[${tableIndex}]配置位置`);});
  });
  return out;
}
function getGeneralJijuPositionDisplay(item){return getValidJijuPositionValues(item).join('、');}

function parseJijuPositionDisplay(value){
  const text=norm(value||'').replace(/／/g,'/');
  if(!text)return [];
  const seen=new Set();
  const out=[];
  text.split(/[、,，/]+/).map(v=>norm(v)).filter(Boolean).forEach(pos=>{
    if(VALID_JIJU_POSITIONS.has(pos)&&!seen.has(pos)){seen.add(pos);out.push(pos);}
  });
  return out;
}
function renderJijuPositionDisplayHtml(value){
  const display=norm(value||'');
  const active=new Set(parseJijuPositionDisplay(display));
  const order=['左上','上','右上','左','中央','右','左下','下','右下'];
  const cells=order.map(pos=>{
    const classes=['jiju-position-cell'];
    if(pos==='中央')classes.push('is-center');
    else if(active.has(pos))classes.push('is-active');
    return `<span class="${classes.join(' ')}" aria-hidden="true"></span>`;
  }).join('');
  return `<span class="jiju-position-display" title="侍従位置: ${esc(display)}"><span class="jiju-position-grid" aria-hidden="true">${cells}</span><span class="jiju-position-text">${esc(display)}</span></span>`;
}

function parseAffinityValue(raw){
  const text=norm(raw||'');
  if(!/^\d+$/.test(text))return null;
  const value=Number(text);
  if(!Number.isInteger(value)||value<0||value>149)return null;
  return value;
}
function mixAffinityColor(a,b,t){
  const ah=String(a||'').replace('#','');
  const bh=String(b||'').replace('#','');
  const ar=parseInt(ah.slice(0,2),16),ag=parseInt(ah.slice(2,4),16),ab=parseInt(ah.slice(4,6),16);
  const br=parseInt(bh.slice(0,2),16),bg=parseInt(bh.slice(2,4),16),bb=parseInt(bh.slice(4,6),16);
  const clamp=x=>Math.max(0,Math.min(255,Math.round(x)));
  const r=clamp(ar+(br-ar)*t),g=clamp(ag+(bg-ag)*t),bl=clamp(ab+(bb-ab)*t);
  return '#'+[r,g,bl].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function getAffinityBackgroundColor(value){
  const BLUE='#3b82f6';
  const GREEN='#22c55e';
  const RED='#ef4444';
  let v=Number(value);
  if(!Number.isFinite(v))return '#e5e7eb';
  if(v<18.75)v+=150;
  if(v<=75)return mixAffinityColor(BLUE,GREEN,(v-18.75)/56.25);
  if(v<=131.25)return mixAffinityColor(GREEN,RED,(v-75)/56.25);
  return mixAffinityColor(RED,BLUE,(v-131.25)/37.5);
}
function renderAffinityClockHtml(raw){
  const value=parseAffinityValue(raw);
  const valid=value!==null;
  const bg=valid?getAffinityBackgroundColor(value):'#e5e7eb';
  const title=valid?`相性値: ${value}`:'相性値未取得';
  const hand=valid?`<line class="affinity-clock-hand" x1="12" y1="12" x2="12" y2="4.2" transform="rotate(${value*2.4} 12 12)"></line><circle class="affinity-clock-center" cx="12" cy="12" r="1.6"></circle>`:'';
  const valueHtml=valid?`<span class="affinity-value">${value}</span>`:'';
  return `<span class="affinity-display" title="${esc(title)}"><span class="affinity-clock" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle class="affinity-clock-bg" cx="12" cy="12" r="10" style="fill:${esc(bg)}"></circle><line class="affinity-clock-mark" x1="12" y1="2.8" x2="12" y2="5.2"></line>${hand}</svg></span>${valueHtml}</span>`;
}
function getGeneralBasicInfoRows(item){
  const rows=flattenPairRows(findGeneralBasicInfoTable(item));
  const displayRows=rows.slice();
  const jijuDisplay=getGeneralJijuPositionDisplay(item);
  if(jijuDisplay&&!displayRows.some(r=>r&&r[0]==='侍従位置')){
    const row=['侍従位置',jijuDisplay];
    const compatibilityIndex=displayRows.findIndex(r=>r&&r[0]==='相性');
    if(compatibilityIndex>=0)displayRows.splice(compatibilityIndex+1,0,row);
    else displayRows.push(row);
    debugLog('general:jiju-position-row-inserted',{name:getItemDisplayName(item),jijuDisplay,after:compatibilityIndex>=0?'相性':'append',rowCount:displayRows.length});
  }else{
    debugLog('general:jiju-position-row-skip',{name:getItemDisplayName(item),jijuDisplay,hasExisting:displayRows.some(r=>r&&r[0]==='侍従位置'),rowCount:displayRows.length});
  }
  return displayRows;
}
function renderGeneralBasicInfo(item){const displayRows=getGeneralBasicInfoRows(item);if(!displayRows.length)return '';const preferred=['名','字','性別','天賦','兵科','相性','侍従位置','おすすめ編制'];const ordered=[...displayRows.filter(r=>preferred.includes(r[0])),...displayRows.filter(r=>!preferred.includes(r[0]))];const jijuConditionHtml=renderGeneralJijuConditionRowsHtml(item);return `<div class="general-card"><div class="general-card-header">基本情報</div><div class="general-card-body"><div class="general-detail-stack">${renderEquipmentKeyValueRows(ordered)}${jijuConditionHtml}</div></div></div>`;}
function renderGeneralAbilitySection(item){const itemName=getItemDisplayName(item)||norm(item?.name||'');const tables=findGeneralAbilityTables(item);const blocks=[];const abilityTable=renderGeneralAbilityComparisonTable(tables.initial,tables.max,itemName);if(abilityTable)blocks.push(`<div class="general-card" style="box-shadow:none"><div class="general-card-header">能力値</div><div class="general-card-body"><div class="general-ability-scroll">${abilityTable}</div>${state.viewMode==='saved'?'<div class="meta" style="margin-top:8px">保存データ表示時は「現能力」の値を入力できます。</div>':''}</div></div>`);const five=renderFiveElementsTable(tables.elements,itemName);if(five)blocks.push(`<div class="general-card" style="box-shadow:none"><div class="general-card-header">五行適正</div><div class="general-card-body">${five}</div></div>`);if(blocks.length)return `<div class="general-card"><div class="general-card-header">能力・五行適正</div><div class="general-card-body"><div class="general-detail-stack">${blocks.join('')}</div></div></div>`;const sections=Array.isArray(item?.sections)?item.sections:[];const titles=new Set(['初期能力','最大能力','五行適正']);const picked=sections.filter(sec=>titles.has(norm(sec?.title||'')));if(!picked.length){const fallback=sections.find(sec=>norm(sec?.title||'')===`${cleanArticleTitleForLink(itemName)||itemName}の能力・五行適正`||norm(sec?.title||'')===`${itemName}の能力・五行適正`);if(!fallback)return '';return `<div class="general-card"><div class="general-card-header">能力・五行適正</div><div class="general-card-body"><div class="general-text">${fmtContent(fallback.content||[])}</div></div></div>`;}return `<div class="general-card"><div class="general-card-header">能力・五行適正</div><div class="general-card-body"><div class="general-detail-stack">${picked.map(sec=>`<div class="general-card" style="box-shadow:none"><div class="general-card-header">${esc(sec.title)}</div><div class="general-card-body"><div class="general-text">${fmtContent(sec.content||[])}</div></div></div>`).join('')}</div></div></div>`;}
function isGeneralTroopBaseTable(table){if(!Array.isArray(table)||!table.length||!Array.isArray(table[0]))return false;const flat=table.flat().map(norm).join(' ');return norm(table[0][0]||'')==='兵科'&&/輸送|機動|射程|攻撃間隔/.test(flat)&&!/効果系統|対象範囲|発動率/.test(flat);}function findGeneralTroopBaseTable(item){return (Array.isArray(item?.tables)?item.tables:[]).find(isGeneralTroopBaseTable)||null;}function findGeneralTroopLevelTable(item){return (Array.isArray(item?.tables)?item.tables:[]).find(table=>Array.isArray(table)&&table.some(row=>Array.isArray(row)&&norm(row[0]||'')==='解放将星')&&table.some(row=>Array.isArray(row)&&norm(row[0]||'')==='基礎兵力'))||null;}function parseGeneralTroopMilestones(table){const out=[];if(!Array.isArray(table))return out;for(let r=0;r<table.length;r++){const header=Array.isArray(table[r])?table[r]:[];const next=Array.isArray(table[r+1])?table[r+1]:[];if(norm(next[0]||'')!=='解放将星')continue;for(let c=1;c<header.length;c++){const lv=norm(header[c]||'');const star=norm(next[c]||'');if(!lv||lv==='-'||!star||star==='-')continue;const values=[];for(let rr=r+2;rr<table.length;rr++){const row=Array.isArray(table[rr])?table[rr]:[];if(norm(row[0]||'')===''&&rr>r+2)break;if(norm(row[0]||'')==='解放将星')break;const key=norm(row[0]||'');const val=norm(row[c]||'');if(key&&val&&val!=='-')values.push([key,val]);}out.push({level:lv,star,values});}}const seen=new Set();return out.filter(x=>{const key=x.level+'__'+x.star;if(seen.has(key))return false;seen.add(key);return true;});}function troopCompactKvHtml(rows){return `<div class="general-troop-compact-grid">${(Array.isArray(rows)?rows:[]).map(([k,v])=>`<div class="general-troop-compact-item"><span class="general-troop-compact-label">${esc(k)}</span><span class="general-troop-compact-value">${esc(v)}</span></div>`).join('')}</div>`;}function renderGeneralTroopBaseSummary(table){const rows=[];(Array.isArray(table)?table:[]).forEach(row=>{if(!Array.isArray(row))return;for(let i=0;i<row.length;i+=2){const key=norm(row[i]||'');const val=norm(row[i+1]||'');if(key&&val)rows.push([key,val]);}});if(!rows.length)return '';return `<div class="general-mini-card general-troop-card no-detail-linkify"><div class="general-mini-card-title">兵科の基本能力</div>${troopCompactKvHtml(rows)}</div>`;}function renderGeneralTroopMilestones(table){const steps=parseGeneralTroopMilestones(table);if(!steps.length)return '';const openAttr=isResponsiveMobileMode()?'':' open';return `<div class="general-mini-card general-troop-card no-detail-linkify"><details class="general-troop-milestones-details"${openAttr}><summary><span>兵科ランク上昇タイミング</span><span class="meta">${steps.length}件</span></summary><div class="general-troop-timeline">${steps.map(step=>`<div class="general-troop-step"><div class="general-troop-step-title">${esc(step.star)} / ${esc(step.level)}</div>${troopCompactKvHtml(step.values)}</div>`).join('')}</div><div class="meta" style="margin-top:6px">兵科ランクが上がるタイミングのみ表示します。</div></details></div>`;}function renderGeneralTroop(item){const base=renderGeneralTroopBaseSummary(findGeneralTroopBaseTable(item)||findGeneralTroopBaseTable(item));const milestones=renderGeneralTroopMilestones(findGeneralTroopLevelTable(item)||findTroopLevelTable(item));if(base||milestones)return `<div class="general-card no-detail-linkify"><div class="general-card-header">兵科・将星情報</div><div class="general-card-body"><div class="general-mobile-card-grid">${[base,milestones].filter(Boolean).join('')}</div></div></div>`;const sections=Array.isArray(item?.sections)?item.sections:[];const picked=sections.filter(sec=>['兵科の基本能力','各レベルの能力'].includes(norm(sec?.title||'')));if(!picked.length){const itemName=cleanArticleTitleForLink(getItemDisplayName(item))||norm(item?.name||'');const fallback=sections.find(sec=>norm(sec?.title||'')===`${itemName}の兵科`);if(!fallback)return '';return `<div class="general-card no-detail-linkify"><div class="general-card-header">兵科・将星情報</div><div class="general-card-body"><div class="general-text">${fmtContent(fallback.content||[])}</div></div></div>`;}return `<div class="general-card no-detail-linkify"><div class="general-card-header">兵科・将星情報</div><div class="general-card-body"><div class="general-detail-stack">${picked.map(sec=>`<div class="general-card no-detail-linkify" style="box-shadow:none"><div class="general-card-header">${esc(sec.title)}</div><div class="general-card-body"><div class="general-text">${fmtContent(sec.content||[])}</div></div></div>`).join('')}</div></div></div>`;}
function compatibilityChipHtml(displayName){const clean=cleanArticleTitleForLink(displayName)||norm(displayName);const target=findDetailLinkTarget(clean,'generals')||findDetailLinkTarget(displayName,'generals');if(target)return `<a href="#" class="general-link-chip detail-entity-link" data-category="generals" data-name="${esc(getItemDisplayName(target.item))}">${esc(clean)}</a>`;return `<span class="general-link-chip no-link">${esc(clean)}</span>`;}function extractCompatibilityChipNames(text,item){const own=cleanArticleTitleForLink(getItemDisplayName(item));const known=(state.generals||[]).map(g=>({display:getItemDisplayName(g),clean:cleanArticleTitleForLink(getItemDisplayName(g)),base:normalizeGeneralComparableName(getItemDisplayName(g))})).filter(x=>x.clean&&x.clean!==own).sort((a,b)=>b.clean.length-a.clean.length);const src=norm(text||'');const hits=[];const seen=new Set();known.forEach(k=>{if((k.clean&&src.includes(k.clean))||(k.base&&src.includes(k.base))){const key=k.clean;if(!seen.has(key)){seen.add(key);hits.push(k.display);}}});return hits;}function renderCompatibilitySectionChips(sec,item){const text=[sec?.title||'',...(Array.isArray(sec?.content)?sec.content:[])].join(' ');const names=extractCompatibilityChipNames(text,item);if(!names.length)return `<div class="general-text">${fmtContent(sec?.content||[])}</div>`;return `<div class="general-chip-section"><div class="general-chip-section-title">${esc(sec?.title||'相性の良い武将')}</div><div class="general-chip-list">${names.map(compatibilityChipHtml).join('')}</div></div>`;}function renderCompatibilityCard(item){const sections=Array.isArray(item?.sections)?item.sections:[];let picked=sections.filter(sec=>/^相性の良い/.test(norm(sec?.title||'')));if(!picked.length){const itemName=cleanArticleTitleForLink(getItemDisplayName(item))||norm(item?.name||'');const fallback=sections.find(sec=>norm(sec?.title||'')===`${itemName}と相性の良い武将`);if(!fallback)return '';picked=[fallback];}return `<div class="general-card"><div class="general-card-header">相性</div><div class="general-card-body"><div class="general-mobile-card-grid">${picked.map(sec=>`<div class="general-mini-card">${renderCompatibilitySectionChips(sec,item)}</div>`).join('')}</div></div></div>`;}

function findCommentarySections(item){const sections=Array.isArray(item?.sections)?item.sections:[];const itemName=norm(item?.name||'');const start=sections.findIndex(sec=>norm(sec?.title||'')===`${itemName}の基本情報`);const reservedTitles=new Set([`${itemName}の戦法`,`${itemName}の技能`,`${itemName}の能力・五行適正`,`${itemName}と相性の良い武将`,`${itemName}の兵科`,`${itemName}の入手方法`,`${itemName}の列伝`,'初期能力','最大能力','五行適正','兵科の基本能力','各レベルの能力']);const isCommentaryStopTitle=title=>{const t=norm(title||'');if(!t)return false;if(reservedTitles.has(t))return true;if(t.endsWith('の戦法'))return true;if(t.endsWith('の技能'))return true;if(t.endsWith('の能力・五行適正'))return true;if(t.endsWith('の兵科'))return true;if(t.endsWith('の入手方法'))return true;if(t.endsWith('の列伝'))return true;if(/^相性の良い/.test(t))return true;return false;};const slice=sections.slice(start>=0?start+1:0);const stopIndex=slice.findIndex(sec=>isCommentaryStopTitle(sec?.title||''));const target=stopIndex>=0?slice.slice(0,stopIndex):slice;return target.filter(sec=>{const title=norm(sec?.title||'');if(!title)return false;if(/^(侍従の配置可能位置と条件|能力比較一覧はこちら)$/.test(title))return false;return true;}).slice(0,4);
}
function renderCommentaryCard(item){const rows=findCommentarySections(item);if(!rows.length)return '';return `<div class="general-card"><div class="general-card-header">解説</div><div class="general-card-body"><div class="general-commentary-grid">${rows.map(sec=>`<div class="general-commentary-card"><div class="general-commentary-title">${esc(sec.title)}</div><div class="general-commentary-body">${fmtContent(sec.content||[])}</div></div>`).join('')}</div></div></div>`;}
function findTacticTable(item){const tables=Array.isArray(item?.tables)?item.tables:[];const idx=findTableIndex(tables,table=>Array.isArray(table)&&Array.isArray(table[0])&&norm(table[0][0]||'')==='兵科'&&norm(table[0][1]||'')==='効果系統');return idx>=0?tables[idx]:null;}
function findTacticName(item){const sections=Array.isArray(item?.sections)?item.sections:[];const itemName=norm(item?.name||item?.title||'');if(detailCategory(item)==='tactics'&&itemName)return itemName;const tacticParentIdx=sections.findIndex(sec=>/の戦法$/.test(norm(sec?.title||'')));const stopTitles=new Set([`${itemName}の基本情報`,`${itemName}の技能`,`${itemName}の能力・五行適正`,`${itemName}の参軍性能`,`${itemName}と相性の良い武将`,`${itemName}の入手方法`,`${itemName}の兵科`,`${itemName}の列伝`,'初期能力','最大能力','五行適正','兵科の基本能力','各レベルの能力','演義','正史','ランキング情報','武将関連のお役立ち情報']);const isCandidateTitle=title=>!!title&&!stopTitles.has(title)&&!title.endsWith('の戦法')&&!title.endsWith('の技能')&&!title.endsWith('の追加効果')&&!/^相性の良い/.test(title)&&title!==itemName&&!title.includes('基本情報');if(tacticParentIdx>=0){for(let i=tacticParentIdx+1;i<sections.length;i++){const title=norm(sections[i]?.title||'');if(!title)continue;if(stopTitles.has(title)||title.startsWith(`${itemName}の`))break;if(isCandidateTitle(title))return title;}const parentContent=Array.isArray(sections[tacticParentIdx]?.content)?sections[tacticParentIdx].content:[];for(const line of parentContent){const text=norm(line);const m=text.match(/^(.+?)(兵科|効果系統|攻撃属性)/);if(m){const candidate=norm(m[1]);if(isCandidateTitle(candidate))return candidate;}}}const tacticSection=sections.find(sec=>isCandidateTitle(norm(sec?.title||''))&&Array.isArray(sec?.content)&&sec.content.some(line=>/(兵科|効果系統|攻撃属性)/.test(norm(line))));if(tacticSection)return norm(tacticSection.title||'');return itemName||''; }
function tacticStatusEffectAnchorHtml(display,effectName,targetText='',descriptionText=''){
  const label=norm(display);
  if(!label)return '';
  const statusName=resolveTacticAdditionalStatusEffectName(effectName,targetText,descriptionText);
  if(!statusName||isSuppressedStatusEffectDetailLinkName(statusName))return esc(label);
  return `<a href="#" class="detail-entity-link" data-category="statusEffects" data-name="${esc(statusName)}">${esc(label)}</a>`;
}
function linkTacticAbilityChangeTextHtml(html,sourceText='',effectName='',targetText=''){
  let out=String(html||'');
  const source=norm(sourceText);
  const inferTargetByVerb=verb=>/低下|減少|下げ/.test(norm(verb))?'敵':(/敵|相手/.test(source)&&!/自身|自部隊|自分|味方/.test(source)?'敵':'自分');
  const anchor=(label,effectBase,verb)=>tacticStatusEffectAnchorHtml(label,`${effectBase}変化`,targetText||inferTargetByVerb(verb),sourceText);
  out=out.replace(/攻撃と防御を([^、。<]*(?:％|%|倍)?)/g,(m,amount)=>`${anchor('攻撃','攻撃','上昇')}と${anchor('防御','防御','上昇')}を${amount}`);
  out=out.replace(/攻撃、防御、知力を([^、。<]*(?:％|%|倍)?)/g,(m,amount)=>`${anchor('攻撃','攻撃','上昇')}、${anchor('防御','防御','上昇')}、${anchor('知力','知力','上昇')}を${amount}`);
  const map={'攻撃速度':'攻撃速度','兵器速度':'兵器速度','戦法威力':'戦法威力','攻撃':'攻撃','防御':'防御','知力':'知力','機動':'機動'};
  out=out.replace(/(攻撃速度|兵器速度|戦法威力|攻撃|防御|知力|機動)(を[^、。<]*?(上昇|低下|減少|増加|下げ|上げ))/g,(m,term,tail,verb)=>`${anchor(term,map[term]||term,verb)}${tail}`);
  if(effectName){
    const base=norm(effectName).replace(/変化$/,'');
    if(base){
      const status=resolveTacticAdditionalStatusEffectName(effectName,targetText,sourceText);
      if(status){
        const a1=`<a href="#" class="detail-entity-link" data-category="statusEffects" data-name="${esc(status)}">${esc(base)}が上昇</a>`;
        const a2=`<a href="#" class="detail-entity-link" data-category="statusEffects" data-name="${esc(status)}">${esc(base)}が低下</a>`;
        out=out.replace(new RegExp(`${base}が上昇`,'g'),a1).replace(new RegExp(`${base}が低下`,'g'),a2);
      }
    }
  }
  return out;
}
function fmtTacticLinkedContent(lines,effectName='',targetText=''){
  const source=(Array.isArray(lines)?lines:[]).join(' ');
  return linkTacticAbilityChangeTextHtml(fmtContent(lines),source,effectName,targetText);
}

// FEATURE[HADO-2.8.0.0-TACTIC-ATTACK-SUMMARY]: 戦法本文から戦法攻撃率・対象部隊数・補正値・計算式・補足を抽出する。
function normalizeTacticAttackNumber(value){const n=Number(String(value??'').replace(/[０-９]/g,ch=>String(ch.charCodeAt(0)-0xFF10)).replace(/[％%]/g,''));return Number.isFinite(n)?n:0;}
function normalizeTacticAttackPercent(value){const n=Number(String(value??'').replace(/[％%]/g,''));return Number.isFinite(n)?n:0;}
function normalizeTacticAttackText(text){return norm(text||'').replace(/％/g,'%').replace(/×/g,'×').replace(/＋/g,'+');}
function getTacticAttackEffectLine(item){const table=findTacticTable(item);if(Array.isArray(table)&&Array.isArray(table[3]))return norm(table[3][0]||'');return '';}
function parseTacticAttackTargetCount(value){const raw=String(value??'').replace(/[０-９]/g,ch=>String(ch.charCodeAt(0)-0xFF10));const jp={一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10};return jp[raw]||Number(raw)||0;}
function extractTacticAttackBaseEntries(text){const src=normalizeTacticAttackText(text);const candidates=[];const seen=new Set();function add(priority,targetText,targetCount,power,matchedText,startIndex,endIndex){power=normalizeTacticAttackPercent(power);if(!power)return;const target=norm(targetText||'対象');let count=Number(targetCount);if(!Number.isFinite(count)||count<0)count=0;if(!count&&/対象|攻撃目標/.test(target))count=1;const matched=norm(matchedText);const key=[priority,target,count,power,matched,startIndex,endIndex].join('|');if(seen.has(key))return;seen.add(key);candidates.push({priority,targetText:target,targetCount:count,basePower:power,matchedText:matched,startIndex:Number(startIndex)||0,endIndex:Number(endIndex)||0});}
for(const m of src.matchAll(/((?:対象を含む)?敵\s*([0-9０-９一二三四五六七八九十]+)\s*部隊)に\s*([0-9０-９]+)\s*%\s*の攻撃/g)){add(1,m[1],parseTacticAttackTargetCount(m[2]),m[3],m[0],m.index,m.index+m[0].length);}
for(const m of src.matchAll(/((?:対象を含む)?敵\s*([0-9０-９一二三四五六七八九十]+)\s*部隊)[^。\n]{0,100}?([0-9０-９]+)\s*%\s*の攻撃/g)){add(2,m[1],parseTacticAttackTargetCount(m[2]),m[3],m[0],m.index,m.index+m[0].length);}
for(const m of src.matchAll(/(対象|攻撃目標|敵部隊)に\s*([0-9０-９]+)\s*%\s*の攻撃/g)){add(3,m[1],1,m[2],m[0],m.index,m.index+m[0].length);}
for(const m of src.matchAll(/(対象|攻撃目標)[^。\n]{0,60}?([0-9０-９]+)\s*%\s*の攻撃/g)){add(4,m[1],1,m[2],m[0],m.index,m.index+m[0].length);}
for(const m of src.matchAll(/さらに\s*([0-9０-９]+)\s*%\s*の攻撃/g)){add(5,'同対象',0,m[1],m[0],m.index,m.index+m[0].length);}
if(!candidates.length)return [];
const overlaps=(a,b)=>a.startIndex<b.endIndex&&b.startIndex<a.endIndex;
let filtered=[];
candidates.sort((a,b)=>a.priority-b.priority||(b.targetCount||0)-(a.targetCount||0)||(b.matchedText.length-a.matchedText.length));
for(const c of candidates){const duplicate=filtered.some(x=>x.basePower===c.basePower&&(overlaps(x,c)||x.matchedText.includes(c.matchedText)||c.matchedText.includes(x.matchedText)||(x.targetCount>0&&c.priority>=5)));if(!duplicate)filtered.push(c);}
filtered.sort((a,b)=>a.priority-b.priority||(b.targetCount||0)-(a.targetCount||0)||(b.matchedText.length-a.matchedText.length));
const primary=filtered[0];
return primary?[{targetText:primary.targetText,targetCount:primary.targetCount,basePower:primary.basePower,matchedText:primary.matchedText,priority:primary.priority}]:[];}
function extractTacticAttackPowerModifiers(text){
const src=normalizeTacticAttackText(text);const modifiers=[];const seen=new Set();
function cleanConditionText(v){return norm(v||'').replace(/^[（(\s　]+|[）)\s　]+$/g,'').replace(/[、，。\s　]+$/g,'');}
function add(row){const key=norm([row.type,row.text,row.formula,row.skillName,row.value,row.factor,row.targetCount].filter(v=>v!==undefined&&v!==null&&v!=='').join('|'));if(!key||seen.has(key))return;seen.add(key);modifiers.push(row);}
function hasMainCondition(text){return /この武将が主将|主将の場合|主将の際|主将か/.test(text||'');}
function hasDeputyCondition(text){return /副将\s*[12１２]?|副将の場合|副将の際/.test(text||'');}
if(/攻撃または知力の高い方の系統/.test(src))add({type:'attackSystemChoice',text:'自部隊の攻撃または知力の高い方の系統（同値の場合は知力系統）',formula:'',conditionText:'',value:0});
for(const m of src.matchAll(/(?:自部隊の)?「([^」]+)」の技能Lv\s*[×x]\s*([0-9０-９]+)\s*%\s*威力が上昇(?:。?最大\+?([0-9０-９]+)\s*%)?/g)){const skill=norm(m[1]);const per=normalizeTacticAttackNumber(m[2]);const max=m[3]?normalizeTacticAttackNumber(m[3]):0;add({type:'skillLevelPower',skillName:skill,perLevel:per,max,text:norm(m[0]),formula:max?`min(${skill}Lv×${per}%, ${max}%)`:`${skill}Lv×${per}%`});}
for(const m of src.matchAll(/([^。\n()（）]{0,120}?威力を\s*([0-9０-９]+)\s*%\s*にして攻撃する)/g)){const text=norm(m[1]);const value=normalizeTacticAttackNumber(m[2]);const mainOnly=hasMainCondition(text);const deputyOnly=!mainOnly&&hasDeputyCondition(text);const troopCondition=(text.match(/(?:現在)?兵力が?\s*([0-9０-９]+)\s*%\s*以上/)||[])[1];add({type:'conditionalReplacementPower',value,mainOnly,deputyOnly,troopHpAtLeast:troopCondition?normalizeTacticAttackNumber(troopCondition):0,text,formula:`条件成立時 ${value}%`,conditionText:cleanConditionText(text.replace(/威力を\s*[0-9０-９]+\s*%\s*にして攻撃する/g,''))});}
for(const m of src.matchAll(/([^。\n()（）]{0,120}?(?:威力|戦法威力)(?:が|を)?\s*(?:さらに)?\s*([0-9０-９]+)\s*%\s*(?:上昇|増加|上昇させて攻撃する))/g)){const text=norm(m[1]);const value=normalizeTacticAttackNumber(m[2]);add({type:'flatPowerUp',value,text,formula:`+${value}%`,conditionText:cleanConditionText(text.replace(/(?:威力|戦法威力)(?:が|を)?\s*(?:さらに)?\s*[0-9０-９]+\s*%\s*(?:上昇|増加|上昇させて攻撃する)/g,'')),mainOnly:hasMainCondition(text),deputyOnly:hasDeputyCondition(text)});}
for(const m of src.matchAll(/([^。\n()（）]{0,120}?威力(?:が|を)?\s*([0-9０-９]+(?:\.[0-9]+)?)\s*倍)/g)){const text=norm(m[1]);const factor=Number(String(m[2]).replace(/[０-９]/g,ch=>String(ch.charCodeAt(0)-0xFF10)))||0;if(factor>0)add({type:'multiplierPower',factor,text,formula:`×${factor}`,conditionText:cleanConditionText(text.replace(/威力(?:が|を)?\s*[0-9０-９]+(?:\.[0-9]+)?\s*倍/g,'')),mainOnly:hasMainCondition(text),deputyOnly:hasDeputyCondition(text),attackTargetOnly:/攻撃目標/.test(text)});}
for(const m of src.matchAll(/将星ランクに応じて、?威力が\s*([0-9０-９]+)\s*%\s*ずつ上昇/g)){const value=normalizeTacticAttackNumber(m[1]);add({type:'starRankPowerUp',value,text:norm(m[0]),formula:`将星ランク×${value}%`,conditionText:'将星ランクに応じて'});}
for(const m of src.matchAll(/([^。\n()（）]{0,100}?戦法の敵対象部隊数が\s*([0-9０-９]+)\s*部隊になる)/g)){const text=norm(m[1]);const targetCount=normalizeTacticAttackNumber(m[2]);add({type:'targetCountOverride',targetCount,text,formula:`条件成立時 ${targetCount}部隊`,conditionText:cleanConditionText(text.replace(/戦法の敵対象部隊数が\s*[0-9０-９]+\s*部隊になる/g,'')),mainOnly:hasMainCondition(text)});}
for(const m of src.matchAll(/最大\+\s*([0-9０-９]+)\s*%/g)){const value=normalizeTacticAttackNumber(m[1]);if(!modifiers.some(x=>Number(x.max)===value))add({type:'maxOnly',value,text:norm(m[0]),formula:`最大+${value}%`});}
return modifiers;}
function extractTacticAttackNotes(text,baseEntries,modifiers){let src=norm(text||'');(baseEntries||[]).forEach(e=>{if(e.matchedText)src=src.replace(e.matchedText,'');});(modifiers||[]).forEach(m=>{if(m.text)src=src.replace(m.text,'');});src=src.replace(/[（）()]/g,' ').replace(/^[、。\s　]+|[、。\s　]+$/g,'');const notes=[];const seen=new Set();function add(v){v=norm(v).replace(/^して[、，]?/,'').replace(/^[、。\s　]+|[、。\s　]+$/g,'');if(!v||seen.has(v))return;seen.add(v);notes.push(v);}src.split(/[。\n]/).forEach(part=>{part.split(/、|，/).forEach(seg=>{if(/負傷兵|消滅|打ち消|解除|命中|会心|撃心|攻撃目標|兵力/.test(seg)&&!/^[0-9０-９]+%の攻撃/.test(seg)&&!/威力が上昇/.test(seg))add(seg);});});return notes;}
function formatTacticAttackEntryLabel(entry){if(!entry)return '';const power=Number(entry.basePower)||0;const count=Number(entry.targetCount)||0;if(count>0)return `戦法攻撃${power}%(${count}部隊)`;return `戦法攻撃${power}%`;}
function isTacticAttackPowerModifier(m){return ['skillLevelPower','flatPowerUp','conditionalReplacementPower','multiplierPower','starRankPowerUp','maxOnly'].includes(m?.type);}
function formatTacticAttackFormula(summary){if(!summary||!summary.baseEntries?.length)return '';const base=summary.baseEntries.map(e=>`${Number(e.basePower)||0}%`).join(' + ');const replacements=(summary.modifiers||[]).filter(m=>m.type==='conditionalReplacementPower');if(replacements.length){const rep=replacements.map(m=>m.formula||`条件成立時 ${Number(m.value)||0}%`).join(' / ');return `通常時：${base} / ${rep}`;}const mods=(summary.modifiers||[]).filter(isTacticAttackPowerModifier).filter(m=>m.formula).map(m=>m.formula);return [base,...mods].join(' + ');}function extractTacticAttackSummaryRuntime(item){const source=detailCategory(item)==='tactics'?(findSourceGeneralForTacticDetail(item)||item):item;const effectLine=getTacticAttackEffectLine(source)||getTacticAttackEffectLine(item);const baseEntries=extractTacticAttackBaseEntries(effectLine);const modifiers=extractTacticAttackPowerModifiers(effectLine);const notes=extractTacticAttackNotes(effectLine,baseEntries,modifiers);const label=baseEntries.map(formatTacticAttackEntryLabel).filter(Boolean).join(' / ');const formula=formatTacticAttackFormula({baseEntries,modifiers});return {hasAttack:baseEntries.length>0,effectLine,baseEntries,modifiers,notes,label,formula,tacticName:findTacticName(source)||findTacticName(item)||getItemDisplayName(item),sourceGeneral:getItemDisplayName(source)};}

function normalizeDerivedTacticAttackCategory(category){
  const c=normalizeDerivedSearchCategory(category||'');
  return c||norm(category||'');
}
function getDerivedTacticAttackIndexItems(){
  const bucket=state?.derivedData?.tacticAttackIndex;
  return bucket&&bucket.available&&Array.isArray(bucket.items)?bucket.items:[];
}
function getDerivedTacticAttackIndexEntry(item){
  const items=getDerivedTacticAttackIndexItems();
  if(!items.length||!item)return null;
  const category=normalizeDerivedTacticAttackCategory(detailCategory(item));
  const display=normalizeSaveItemName(getItemDisplayName(item));
  const tacticName=normalizeSaveItemName(findTacticName(item)||getItemDisplayName(item));
  const sourceGeneral=normalizeSaveItemName(getItemDisplayName(findSourceGeneralForTacticDetail(item)||item));
  for(const entry of items){
    const entryCategory=normalizeDerivedTacticAttackCategory(entry?.category||'');
    const entryName=normalizeSaveItemName(entry?.name||entry?.displayName||'');
    const entrySource=normalizeSaveItemName(entry?.sourceGeneral||'');
    if(category==='tactics'&&(entryCategory==='tactics'||entryCategory==='tactic')){
      if(entryName&&[display,tacticName].includes(entryName))return entry;
    }
    if(category==='generals'){
      if(entrySource&&entrySource===sourceGeneral)return entry;
      if(entryName&&entryName===tacticName)return entry;
    }
  }
  return null;
}
function buildTacticAttackSummaryFromIndexEntry(entry,item){
  if(!entry)return null;
  const basePower=Number(entry.basePower)||0;
  const targetCount=Number(entry.targetCount)||0;
  const hasAttack=!!entry.hasAttack||basePower>0;
  const baseEntries=hasAttack?[{
    basePower,
    targetCount,
    targetText:targetCount?`対象${targetCount}部隊`:'',
    raw:norm(entry.label||entry.formula||entry.sourceText||''),
    source:'hadou_tactic_attack_index.json'
  }]:[];
  const modifiers=Array.isArray(entry.modifiers)?entry.modifiers.map(m=>({
    type:norm(m?.type||'derived'),
    text:norm(m?.text||m?.label||m?.formula||''),
    formula:norm(m?.formula||''),
    skillName:norm(m?.skillName||''),
    value:m?.value
  })).filter(m=>m.text||m.formula||m.skillName):[];
  const label=norm(entry.label||baseEntries.map(formatTacticAttackEntryLabel).filter(Boolean).join(' / '));
  const formula=norm(entry.formula||formatTacticAttackFormula({baseEntries,modifiers}));
  const summary={hasAttack,effectLine:norm(entry.sourceText||''),baseEntries,modifiers,notes:[],label,formula,tacticName:norm(entry.name||entry.displayName||findTacticName(item)||getItemDisplayName(item)),sourceGeneral:norm(entry.sourceGeneral||getItemDisplayName(findSourceGeneralForTacticDetail(item)||item)),source:'tactic-attack-index',conditionBlocks:Array.isArray(entry.conditionBlocks)?entry.conditionBlocks:[],attackBlocks:Array.isArray(entry.attackBlocks)?entry.attackBlocks:[]};
  state.diagnostics.tacticAttackIndex={available:true,used:true,name:summary.tacticName,sourceGeneral:summary.sourceGeneral,hasAttack:summary.hasAttack,basePower,targetCount,conditionBlockCount:summary.conditionBlocks.length,attackBlockCount:summary.attackBlocks.length};
  return summary;
}
function extractTacticAttackSummary(item){
  const derived=buildTacticAttackSummaryFromIndexEntry(getDerivedTacticAttackIndexEntry(item),item);
  if(derived)return derived;
  const runtime=extractTacticAttackSummaryRuntime(item);
  state.diagnostics.tacticAttackIndex={available:getDerivedTacticAttackIndexItems().length>0,used:false,name:runtime?.tacticName||getItemDisplayName(item),fallback:true};
  return runtime;
}
function getTacticAttackCompareMeta(item){
  const s=extractTacticAttackSummary(item);
  const baseEntries=Array.isArray(s.baseEntries)?s.baseEntries:[];
  const basePowerMax=baseEntries.reduce((max,e)=>Math.max(max,Number(e.basePower)||0),0);
  const targetCountMax=baseEntries.reduce((max,e)=>Math.max(max,Number(e.targetCount)||0),0);
  const hasModifier=Array.isArray(s.modifiers)&&s.modifiers.length>0;
  const hasAttack=!!s.hasAttack;
  const category=detailCategory(item);
  const hasTacticContext=category==='tactics'||category==='generals'||!!s.tacticName||!!s.effectLine;
  return {summary:s,basePowerMax,targetCountMax,hasModifier,hasAttack,hasTacticContext,directAttackNone:hasTacticContext&&!hasAttack};
}
function buildTacticAttackSearchText(item){
  const meta=getTacticAttackCompareMeta(item);
  const s=meta.summary;
  if(!meta.hasTacticContext)return '';
  const parts=['戦法攻撃サマリー',s.tacticName,s.sourceGeneral];
  if(meta.hasAttack){
    parts.push('戦法攻撃','戦法攻撃あり',s.label,s.formula,`戦法攻撃率${meta.basePowerMax}`,`戦法攻撃率:${meta.basePowerMax}`,`${meta.basePowerMax}%`,`${meta.basePowerMax}％`);
  }else{
    parts.push('戦法攻撃なし','直接攻撃なし','攻撃ダメージなし');
  }
  if(meta.targetCountMax){parts.push(`${meta.targetCountMax}部隊`,`対象部隊数${meta.targetCountMax}`,`対象部隊数:${meta.targetCountMax}`);}
  parts.push(meta.hasModifier?'攻撃補正あり':'攻撃補正なし',meta.hasModifier?'補正あり':'補正なし');
  (s.baseEntries||[]).forEach(e=>{parts.push(`${e.basePower}%`,`${e.basePower}％`);if(e.targetCount)parts.push(`${e.targetCount}部隊`,`対象部隊数:${e.targetCount}`);parts.push(e.targetText);});
  (s.modifiers||[]).forEach(m=>{parts.push(m.text,m.formula,m.skillName,m.type);});
  return norm(parts.filter(Boolean).join(' '));
}
function renderTacticAttackResultBadges(item){
  const meta=getTacticAttackCompareMeta(item);
  const s=meta.summary;
  if(!meta.hasTacticContext)return '';
  const badges=[];
  if(meta.hasAttack){
    if(s.label)badges.push(s.label);
    if(meta.targetCountMax)badges.push(`対象${meta.targetCountMax}部隊`);
    if(meta.hasModifier)badges.push('攻撃補正あり');
  }else{
    badges.push('直接攻撃なし');
  }
  return badges.map(v=>`<span class="search-result-mini-badge tactic-attack-result-badge">${esc(v)}</span>`).join('');
}
function shouldApplyTacticAttackSort(keyword,rows){
  const k=norm(keyword||'');
  if(!k)return false;
  if(!/(戦法攻撃|攻撃率順|戦法火力|対象部隊数)/.test(k))return false;
  return (rows||[]).some(row=>row&&(row.key==='tactics'||row.key==='generals')&&getTacticAttackCompareMeta(row.item).hasTacticContext);
}
function compareTacticAttackRows(a,b){
  const am=getTacticAttackCompareMeta(a.item),bm=getTacticAttackCompareMeta(b.item);
  if(am.hasAttack!==bm.hasAttack)return am.hasAttack?-1:1;
  if(am.basePowerMax!==bm.basePowerMax)return bm.basePowerMax-am.basePowerMax;
  if(am.targetCountMax!==bm.targetCountMax)return bm.targetCountMax-am.targetCountMax;
  if(am.hasModifier!==bm.hasModifier)return am.hasModifier?-1:1;
  return String(getItemDisplayName(a.item)).localeCompare(String(getItemDisplayName(b.item)),'ja');
}
function buildTacticAttackCopyLines(item){const s=extractTacticAttackSummary(item);if(!s.hasAttack&&!s.modifiers.length)return [];const lines=['■ 戦法攻撃サマリー'];if(s.label)lines.push('基礎攻撃率：'+s.label);if(s.modifiers&&s.modifiers.length){lines.push('攻撃率補正：');s.modifiers.forEach(m=>lines.push('- '+detailCopyCleanText(m.text)+(m.formula?' / 式：'+detailCopyCleanText(m.formula):'')));}else lines.push('攻撃率補正：なし');lines.push('計算式：'+(s.formula||'なし'));return lines;}
function normalizeTacticAttackNoAttackLabel(summary){return summary&&summary.hasAttack?(summary.label||'戦法攻撃あり'):'直接攻撃なし';}
function normalizeTacticAttackModifierLabel(evaluated,summary){const mods=evaluated?.modifierEvaluations||[];if(mods.length)return mods.map(m=>`${m.text||m.formula||m.reason}${m.reason?'（'+m.reason+'）':''}`).join(' / ');if(summary?.hasAttack)return '攻撃率補正なし';return '攻撃率補正対象外';}
function buildFormationTacticAttackCopyText(){const f=ensureCurrentFormation();const data=buildFormationParameterData(f);const rows=collectFormationTacticAttackRows(f,data);const totals=calculateFormationTacticAttackTotals(rows);const expected=calculateFormationTacticExpectedValue(rows);const lines=['部隊編成 戦法攻撃サマリー',`部隊：${f?.name||f?.formationName||'未命名部隊'}`,''];lines.push('■ 三連鎖時サマリー');lines.push(`基礎合計：${totals.baseFormula} = ${totals.baseTotal}%`);if(totals.hasModifier){lines.push(`補正込み：${totals.adjustedFormula}${totals.hasEvaluatedModifier?' = '+totals.adjustedTotal+'%':'（補正未評価あり）'}`);}else{lines.push(`補正込み：基礎合計と同じ（${totals.baseTotal}%）`);}lines.push('');lines.push('■ 連鎖期待値');lines.push(`基礎期待値：${expected.baseFormula} = ${formatTacticExpectedNumber(expected.baseExpected)}%`);if(expected.hasModifier){lines.push(`補正込み期待値：${expected.adjustedFormula}${expected.hasUnevaluatedModifier?'（補正未評価あり）':' = '+formatTacticExpectedNumber(expected.adjustedExpected)+'%'}`);}else{lines.push(`補正込み期待値：基礎期待値と同じ（${formatTacticExpectedNumber(expected.baseExpected)}%）`);}lines.push('');lines.push('■ 主将・副将戦法');rows.forEach(r=>{lines.push(`${r.slotLabel}：${r.generalDisplay||r.generalName||'未設定'}`);if(!r.generalName){lines.push('  未設定');return;}const s=r.summary||{};lines.push(`  戦法：${s.tacticName||'-'}`);lines.push(`  攻撃：${normalizeTacticAttackNoAttackLabel(s)}`);lines.push(`  補正：${normalizeTacticAttackModifierLabel(r.evaluated,s)}`);if(s.hasAttack)lines.push(`  計算式：${r.evaluated?.adjustedFormula||s.formula||r.evaluated?.baseFormula||'-'}`);else lines.push('  計算式：直接攻撃なし');});lines.push('');lines.push('※2.8.9.1時点：副将の期待値は、相性・発動間隔・侍従配置・将星・技能補正を反映した推定連鎖率で算出。');return '```text\n'+lines.join('\n')+'\n```';}
async function copyFormationTacticAttackSummary(){try{const text=buildFormationTacticAttackCopyText();await navigator.clipboard.writeText(text);debugLog('copy:formation-tactic-attack',{ok:true,charCount:text.length});const btn=document.querySelector('[data-copy-formation-tactic-attack]');if(btn){const prev=btn.textContent;btn.textContent='コピー済み';setTimeout(()=>{btn.textContent=prev;},1200);}}catch(err){debugLog('copy:formation-tactic-attack',{ok:false,error:String(err?.message||err)});window.alert('コピーに失敗しました: '+(err?.message||err));}}
function buildTacticAttackDiagnosticSnapshot(){const items=[...(state.generals||[]),...(state.tactics||[])];const seen=new Set();const rows=[];items.forEach(item=>{const key=detailCategory(item)+'@@'+getItemDisplayName(item);if(seen.has(key))return;seen.add(key);const meta=getTacticAttackCompareMeta(item);if(!meta.hasTacticContext)return;const s=meta.summary||{};rows.push({category:detailCategory(item),name:getItemDisplayName(item),tacticName:s.tacticName||'',hasAttack:!!s.hasAttack,basePowerMax:meta.basePowerMax,targetCountMax:meta.targetCountMax,modifierCount:(s.modifiers||[]).length,directAttackNone:!!meta.directAttackNone,unresolvedModifier:(s.modifiers||[]).some(m=>/未評価|将星|対象|場合/.test(m.text||m.conditionText||''))});});const summary={timestamp:debugTimestamp(),version:HADO_BUILD_INFO.version,total:rows.length,hasAttack:rows.filter(r=>r.hasAttack).length,directAttackNone:rows.filter(r=>r.directAttackNone).length,withModifier:rows.filter(r=>r.modifierCount>0).length,unresolvedModifier:rows.filter(r=>r.unresolvedModifier).length,samples:rows.filter(r=>r.hasAttack||r.directAttackNone).slice(0,20)};state.diagnostics.tacticAttackSummary=summary;return summary;}
function renderTacticAttackSummaryBlock(item){const s=extractTacticAttackSummary(item);if(!s.hasAttack&&!s.modifiers.length)return '';const baseRows=(s.baseEntries||[]).map(e=>`<li>${esc(formatTacticAttackEntryLabel(e))}</li>`).join('')||'<li class="tactic-attack-empty">基礎攻撃率なし</li>';const modRows=(s.modifiers||[]).map(m=>`<li>${esc(m.text)}${m.formula?`<div class="meta">式：${esc(m.formula)}</div>`:''}</li>`).join('')||'<li class="tactic-attack-empty">攻撃率補正なし</li>';const formula=s.formula?`<div class="tactic-attack-formula">${esc(s.formula)}</div>`:'<div class="tactic-attack-empty">計算式なし</div>';return `<details class="search-param-details tactic-attack-summary-details"><summary><span>戦法攻撃サマリー</span>${s.label?`<span class="note">${esc(s.label)}</span>`:''}</summary><div class="general-card tactic-attack-summary-card"><div class="general-card-body"><div class="tactic-attack-summary"><div class="tactic-attack-label">${esc(s.label||'戦法攻撃サマリー')}</div><div><strong>基礎攻撃率</strong><ul class="tactic-attack-list">${baseRows}</ul></div><div><strong>攻撃率補正</strong><ul class="tactic-attack-list">${modRows}</ul></div><div><strong>計算式</strong>${formula}</div></div></div></div></details>`;}
function getFormationSkillTotalLevelFromData(data,skillName){const target=norm(skillName);if(!target)return 0;const row=(data?.skills||[]).find(s=>norm(s?.name||'')===target);const n=Number(row?.total??row?.max??row?.min??0);return Number.isFinite(n)?n:0;}
function tacticAttackModifierAppliesByRole(modifier,row){const slotKey=row?.slotKey||'';if(modifier?.mainOnly&&slotKey!=='main')return false;if(modifier?.deputyOnly&&slotKey!=='deputy1'&&slotKey!=='deputy2')return false;return true;}
function buildTacticAttackRoleConditionAuditRows(summary){const rows=[];(summary?.modifiers||[]).forEach(m=>{if(!m?.mainOnly&&!m?.deputyOnly)return;['main','deputy1','deputy2'].forEach(slotKey=>{rows.push({type:m.type||'',slotKey,applies:tacticAttackModifierAppliesByRole(m,{slotKey}),text:m.text||m.conditionText||''});});});return rows;}
function evaluateFormationTacticAttackModifier(modifier,data,row){if(!modifier)return {evaluated:false,value:0,text:'',formula:norm(modifier?.formula||''),reason:'補正なし'};
if(modifier.type==='attackSystemChoice'){return {type:'info',evaluated:true,value:0,formula:'',text:modifier.text||'攻撃または知力の高い方の系統',reason:'攻撃系統選択'};}
if(modifier.type==='skillLevelPower'){const lv=getFormationSkillTotalLevelFromData(data,modifier.skillName);const per=Number(modifier.perLevel)||0;const raw=lv*per;const max=Number(modifier.max)||0;const value=max?Math.min(raw,max):raw;const evaluated=lv>0&&per>0;return {type:'additive',evaluated,value,skillLevel:lv,formula:max?`min(${modifier.skillName}Lv${lv}×${per}%, ${max}%)`:`${modifier.skillName}Lv${lv}×${per}%`,text:evaluated?`${modifier.skillName}Lv${lv}×${per}%${max?`（上限${max}%）`:''} = +${value}%`:`${modifier.skillName}Lv未検出のため未評価`,reason:evaluated?'編成内技能Lvで評価':'編成内技能Lv未検出'};}
if(modifier.type==='flatPowerUp'){const value=Number(modifier.value)||0;const applies=tacticAttackModifierAppliesByRole(modifier,row);return {type:'additive',evaluated:applies,value:applies?value:0,formula:`+${value}%`,text:applies?`${modifier.conditionText?modifier.conditionText+'：':''}+${value}%`:`${modifier.conditionText||'条件'}のため未適用（+${value}%）`,reason:applies?'固定威力補正':'配置条件不一致'};}
if(modifier.type==='multiplierPower'){const factor=Number(modifier.factor)||0;const applies=tacticAttackModifierAppliesByRole(modifier,row);return {type:'multiplier',evaluated:applies&&factor>0,value:0,multiplier:applies?factor:1,formula:`×${factor}`,text:applies?`${modifier.conditionText?modifier.conditionText+'：':''}威力×${factor}`:`${modifier.conditionText||'条件'}のため未適用（威力×${factor}）`,reason:applies?'威力倍率':'配置条件不一致'};}
if(modifier.type==='conditionalReplacementPower'){const basePower=Number(row?.basePower)||0;const appliesByRole=tacticAttackModifierAppliesByRole(modifier,row);const value=Number(modifier.value)||0;const hpText=modifier.troopHpAtLeast?`現在兵力${modifier.troopHpAtLeast}%以上`:'';const roleText=modifier.mainOnly?'主将':(modifier.deputyOnly?'副将':'配置条件なし');const condition=[roleText,hpText,modifier.conditionText&&!modifier.mainOnly&&!modifier.deputyOnly?modifier.conditionText:''].filter(Boolean).join('かつ');if(appliesByRole){return {type:'replacement',evaluated:true,value,replacementPower:value,formula:`条件成立時 ${value}%`,text:`条件付き威力：${condition||'条件成立時'} → ${value}%候補`,reason:'条件付き威力置換',candidate:true,delta:value-basePower};}return {type:'replacement',evaluated:false,value:0,replacementPower:value,formula:`条件成立時 ${value}%`,text:`条件付き威力：${roleText}限定のため未適用（条件成立時 ${value}%）`,reason:'配置条件不一致',candidate:false,delta:0};}
if(modifier.type==='targetCountOverride'){const applies=tacticAttackModifierAppliesByRole(modifier,row);return {type:'targetCount',evaluated:applies,value:0,targetCount:Number(modifier.targetCount)||0,formula:modifier.formula||'',text:applies?`条件付き対象部隊数：${modifier.conditionText||'条件成立時'} → ${modifier.targetCount}部隊`:`条件付き対象部隊数：${modifier.conditionText||'条件'}のため未適用（${modifier.targetCount}部隊）`,reason:applies?'対象部隊数変化':'配置条件不一致'};}
if(modifier.type==='starRankPowerUp'){return {type:'additive',evaluated:false,value:0,formula:modifier.formula||'',text:`将星ランク連動：${modifier.text||modifier.formula||''}（未評価）`,reason:'将星ランク連動は未評価'};}
if(modifier.type==='maxOnly'){return {type:'info',evaluated:false,value:0,formula:modifier.formula||'',text:modifier.text||modifier.formula||'最大値情報',reason:'最大値情報のみ'};}
return {evaluated:false,value:0,formula:norm(modifier.formula||''),text:modifier.text||modifier.formula||'未評価補正',reason:'未対応補正'};}
function evaluateFormationTacticAttackSummary(summary,data,row){const basePower=(summary?.baseEntries||[]).reduce((sum,e)=>sum+(Number(e.basePower)||0),0);const evalRow={...(row||{}),basePower};const modifierEvaluations=(summary?.modifiers||[]).map(m=>evaluateFormationTacticAttackModifier(m,data,evalRow));const replacement=modifierEvaluations.find(m=>m.type==='replacement'&&m.evaluated&&Number(m.replacementPower)>0);const evaluatedBonus=modifierEvaluations.filter(m=>m.evaluated&&m.type==='additive').reduce((sum,m)=>sum+(Number(m.value)||0),0);const multiplier=modifierEvaluations.filter(m=>m.evaluated&&m.type==='multiplier').reduce((prod,m)=>prod*(Number(m.multiplier)||1),1);const hasModifier=(summary?.modifiers||[]).length>0;const hasEvaluatedModifier=modifierEvaluations.some(m=>m.evaluated&&['additive','multiplier','replacement'].includes(m.type));const rawAdjusted=replacement?Number(replacement.replacementPower)||basePower:(basePower+evaluatedBonus)*multiplier;const adjustedPower=Math.round(rawAdjusted*100)/100;const baseFormula=(summary?.baseEntries||[]).map(e=>`${Number(e.basePower)||0}%`).join(' + ')||'0%';const additiveFormula=modifierEvaluations.filter(m=>m.evaluated&&m.type==='additive').map(m=>m.formula).filter(Boolean).join(' + ');const multiplierFormula=modifierEvaluations.filter(m=>m.evaluated&&m.type==='multiplier').map(m=>m.formula).filter(Boolean).join('');let adjustedFormula=baseFormula;if(replacement)adjustedFormula=`${baseFormula} / ${replacement.formula}`;else{if(additiveFormula)adjustedFormula=`${adjustedFormula} + ${additiveFormula}`;if(multiplierFormula)adjustedFormula=`(${adjustedFormula})${multiplierFormula}`;}return {basePower,hasModifier,hasEvaluatedModifier,modifierEvaluations,evaluatedBonus,multiplier,adjustedPower,baseFormula,adjustedFormula,replacement};}
function parseTacticPercentValue(text){const m=norm(text).replace(/[％]/g,'%').match(/([0-9]+(?:\.[0-9]+)?)\s*%/);return m?Number(m[1]):0;}
function parseTacticIntervalSeconds(text){const m=norm(text).replace(/[０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0)).match(/([0-9]+(?:\.[0-9]+)?)\s*秒/);return m?Number(m[1]):0;}
function extractTacticActivationMeta(general){const table=findTacticTable(general);const values=Array.isArray(table?.[5])?table[5]:[];const intervalText=norm(values[0]||'');const targetRange=norm(values[1]||'');const rateText=norm(values[2]||'');const orderText=norm(values[3]||'');return {intervalText,targetRange,rateText,chainOrder:orderText,intervalSec:parseTacticIntervalSeconds(intervalText),chainRate:parseTacticPercentValue(rateText)};}
function getGeneralAffinityValueForChain(general){const rows=getGeneralBasicInfoRows(general);const raw=findFirstPairValueInRows(rows,['相性']);const value=parseAffinityValue(raw);return value===null?null:value;}
function calculateAffinityCircularDiff150(a,b){const av=Number(a),bv=Number(b);if(!Number.isFinite(av)||!Number.isFinite(bv))return null;const diff=Math.abs(av-bv);return Math.min(diff,150-diff);}

const AFFINITY_CHAIN_DELTA_BASE=10;
const AFFINITY_CHAIN_DELTA_SLOPE=0.2;
function calculateAffinityChainDelta150(diff){if(!Number.isFinite(Number(diff)))return 0;const d=Math.max(0,Math.min(75,Number(diff)));return AFFINITY_CHAIN_DELTA_BASE-(AFFINITY_CHAIN_DELTA_SLOPE*d);}
function formatAffinityChainFormula(diff){if(!Number.isFinite(Number(diff)))return '';const d=Math.max(0,Math.min(75,Number(diff)));return `10−0.2×${formatPercentOne(d)}=${formatPercentOne(calculateAffinityChainDelta150(d))}%`; }
function calculateIntervalChainDelta(mainInterval,selfInterval){const B=Number(mainInterval)||0;const A=Number(selfInterval)||0;if(!B||!A)return 0;const raw=454.5*(B-A)/(A*B);return Math.round(raw*10)/10;}
function clampPercentValue(value){const n=Number(value)||0;return Math.max(0,Math.min(100,n));}
function formatPercentOne(value){const n=Number(value)||0;return Number.isInteger(n)?String(n):String(Math.round(n*10)/10);}
function getFormationRowDirectSkillNameSetForChain(row){const set=new Set();const general=row?.general||null;if(!general)return set;try{if(typeof getResolvedGeneralSkillLevelMap==='function'){const m=getResolvedGeneralSkillLevelMap(general);if(m&&typeof m.forEach==='function')m.forEach((level,name)=>{const n=norm(name);if(n&&norm(level))set.add(n);});}}catch{}try{if(!set.size&&typeof getOwnedSkillLevelMapFromTables==='function'){const m=getOwnedSkillLevelMapFromTables(general);if(m&&typeof m.forEach==='function')m.forEach((level,name)=>{const n=norm(name);if(n&&norm(level))set.add(n);});}}catch{}return set;}

function getFormationRowTroopTypeForChain(row){return getGeneralTroopType(row?.general)||'';}
function getFormationRowDirectSkillNameSetForChain(row){const set=new Set();if(!row?.slot)return set;const item=row.general;if(!item)return set;collectFormationParameterSourceRecords({sourceType:'general',item,holder:getItemDisplayName(item),holderSlot:row.slotKey,kind:'general'}).forEach(rec=>{const p=formationSkillNameLevelFromSource(rec.source||'');const name=norm(rec.formationSkillName||p.name||'');if(name)set.add(name);});return set;}
function getFormationSkillLevelForChain(data,skillName){const target=norm(skillName);const row=(data?.skills||[]).find(s=>norm(s?.name||'').replace(/［.*?］/g,'')===target);if(!row)return 0;const v=Number(row.total||row.max||row.min||0);return Number.isFinite(v)?v:0;}
function hasFormationSkillForChain(data,skillName){return getFormationSkillLevelForChain(data,skillName)>0||(data?.skills||[]).some(s=>norm(s?.name||'').replace(/［.*?］/g,'')===norm(skillName));}
function hasFormationEffectiveSkillSourceForChain(data,skillName){
  const target=norm(skillName).replace(/［.*?］/g,'');
  if(!target)return false;
  if(hasFormationSkillForChain(data,target))return true;
  const effects=Array.isArray(data?.effects)?data.effects:[];
  return effects.some(e=>{
    const label=norm(e?.sourceLabel||'').replace(/［.*?］/g,'');
    const raw=norm(e?.rawText||'').replace(/［.*?］/g,'');
    return label.includes(`技能:${target}`)||label.includes(target+'Ⅰ')||label.includes(target+'Ⅱ')||label.includes(target+'Ⅲ')||raw.includes(target);
  });
}
function evaluateChainSkillConditionForRow(e,row){
  const raw=[e?.rawText,e?.condition,e?.sourceLabel].map(norm).filter(Boolean).join(' ');
  if(/連鎖確率低下/.test(raw))return {ok:false,reason:'連鎖確率低下は加算対象外'};
  if(isTemporaryChainJudgementText(raw))return {ok:false,reason:'一時判定型は通常推定連鎖率から除外'};
  if(/副将1|副将１/.test(raw)&&row.slotKey!=='deputy1')return {ok:false,reason:'副将1限定'};
  if(/副将2|副将２/.test(raw)&&row.slotKey!=='deputy2')return {ok:false,reason:'副将2限定'};
  const troopReq=(raw.match(/副将の(騎兵|歩兵|弓兵)の連鎖確率/)||[])[1]||'';
  if(troopReq){const troop=getFormationRowTroopTypeForChain(row);if(troop!==troopReq)return {ok:false,reason:`副将兵科不一致 ${troop||'未取得'} != ${troopReq}`};}
  if(/自身の連鎖確率/.test(raw)&&!/副将の連鎖確率/.test(raw)){return {ok:false,reason:'自身の連鎖確率は対象副将の通常推定から除外'};}
  const hasNot=/技能「([^」]+)」を所持していない副将/.exec(raw);
  const hasYes=/技能「([^」]+)」を所持している副将/.exec(raw);
  const skillName=norm((hasNot&&hasNot[1])||(hasYes&&hasYes[1])||'');
  if(skillName){if(!(row.slotKey==='deputy1'||row.slotKey==='deputy2'))return {ok:false,reason:'副将限定'};const directSkills=getFormationRowDirectSkillNameSetForChain(row);const hasSkill=directSkills.has(skillName);if(hasNot)return {ok:!hasSkill,reason:hasSkill?`対象副将が技能「${skillName}」を直接所持`:`対象副将が技能「${skillName}」を直接非所持`};return {ok:hasSkill,reason:hasSkill?`対象副将が技能「${skillName}」を直接所持`:`対象副将が技能「${skillName}」を直接非所持`};}
  if(!/(副将|連鎖確率)/.test(raw))return {ok:false,reason:'副将連鎖率対象外'};
  return {ok:true,reason:troopReq?`副将兵科 ${troopReq} 条件一致`:''};
}
function getFormationDynamicChainSkillBonus(data,row){
  if(!row||row.slotKey==='main')return {value:0,details:[]};
  const rules=[
    {skill:'慧合旺盛',ref:'連慧',factor:0.5},
    {skill:'合心会覇',ref:'投合',factor:0.5},
    {skill:'活発烈撃',ref:'敏活',factor:0.5},
    {skill:'繫守連合',ref:'連帯',factor:0.5},
    {skill:'繋守連合',ref:'連帯',factor:0.5}
  ];
  let total=0;const details=[];
  rules.forEach(r=>{
    if(!hasFormationEffectiveSkillSourceForChain(data,r.skill))return;
    const lv=getFormationSkillLevelForChain(data,r.ref);
    if(lv<=0)return;
    const value=Math.round(lv*r.factor*10)/10;
    if(value<=0)return;
    total+=value;
    details.push({value,source:`技能:${r.skill}`,condition:`部隊の「${r.ref}」Lv${lv} × ${r.factor}%`,rawText:`部隊の「${r.ref}」のLv×${r.factor}%、副将の連鎖確率が上昇`,reason:'合算技能Lv参照型'});
  });
  return {value:Math.round(total*10)/10,details};
}
function getFormationChainBonusFromData(data,row){if(!row||row.slotKey==='main')return {value:0,details:[]};const details=[];let total=0;(data?.effects||[]).forEach(e=>{if(norm(e?.key||'')!=='連鎖確率')return;const cond=evaluateChainSkillConditionForRow(e,row);if(!cond.ok){debugLog('formationChain:skill-bonus-excluded',{slotKey:row.slotKey,general:row.generalDisplay||row.generalName||'',source:e?.sourceLabel||'',condition:e?.condition||'',value:e?.value||0,reason:cond.reason});return;}const sign=norm(e.sign||'+');const v=Number(e.value)||0;if(v<=0||sign==='-'||sign==='₋')return;total+=v;details.push({value:v,source:e.sourceLabel||'',condition:e.condition||'',rawText:e.rawText||'',reason:cond.reason});});const dynamic=getFormationDynamicChainSkillBonus(data,row);if(dynamic.value){total+=dynamic.value;details.push(...dynamic.details);}return {value:Math.round(total*10)/10,details};}

function getFormationSlotDirectJijuBonus(f,slotKey){
  const slot=f?.slots?.[slotKey]||{};
  const ownerName=normalizeSaveItemName(slot.general||'');
  const attendantName=normalizeSaveItemName(slot.attendant||'');
  if(!ownerName||!attendantName)return {value:0,details:[]};
  const owner=findItemByDisplayName('generals',ownerName);
  const attendant=findItemByDisplayName('generals',attendantName);
  if(!owner||!attendant)return {value:0,details:[`${formationSlotLabel(slotKey)}: 武将または侍従未取得`]};
  if(getGeneralRarityCode(owner)!=='LR')return {value:0,details:[`${formationSlotLabel(slotKey)}: LR武将ではないため侍従連鎖率補正なし`]};
  const ownerBase=normalizeGeneralComparableName(getItemDisplayName(owner)||ownerName);
  const attendantBase=normalizeGeneralComparableName(getItemDisplayName(attendant)||attendantName);
  const ownerCompat=extractCompatibleGeneralNames(owner)||[];
  const attendantCompat=extractCompatibleGeneralNames(attendant)||[];
  const compatible=!!(ownerBase&&attendantBase&&(ownerCompat.includes(attendantBase)||attendantCompat.includes(ownerBase)));
  const value=compatible?1.5:0.5;
  const detail=`${formationDisplayName('generals',attendantName)}${compatible?'（好相性）':''} +${formatPercentOne(value)}%`;
  return {value,details:[detail],compatible,owner:ownerName,attendant:attendantName};
}

function getFormationJijuDirectBonusForChain(f,row){if(!row||row.slotKey==='main')return {value:0,details:[]};let total=0;const details=[];const mainBonus=getFormationSlotDirectJijuBonus(f,'main');if(mainBonus.value){total+=mainBonus.value;details.push(`主将LRの侍従補正→${row.slotLabel}: ${mainBonus.details[0]}`);}if(row.slotKey==='deputy1'||row.slotKey==='deputy2'){const ownBonus=getFormationSlotDirectJijuBonus(f,row.slotKey);if(ownBonus.value){total+=ownBonus.value;details.push(`${row.slotLabel}LR本人の侍従補正: ${ownBonus.details[0]}`);}}return {value:Math.round(total*10)/10,details};}
function getFormationStarDirectBonusForChain(row){if(!row||row.slotKey==='main'||!row.general)return {value:0,details:[]};const star=Math.max(0,Math.min(7,Number(getGeneralStageStarForItem(row.general))||0));const value=Math.round(star*0.5*10)/10;return {value,star,details:[`${row.slotLabel} 将星${star} ×0.5% = +${value}%`]};}
function calculateEstimatedChainRate150(row,mainRow,data,f){const meta=row?.activationMeta||{};const baseRate=Number(meta.chainRate)||0;const mainInterval=Number(mainRow?.activationMeta?.intervalSec)||0;const selfInterval=Number(meta.intervalSec)||0;const mainAffinity=getGeneralAffinityValueForChain(mainRow?.general);const selfAffinity=getGeneralAffinityValueForChain(row?.general);const affinityDiff=calculateAffinityCircularDiff150(mainAffinity,selfAffinity);const affinityDelta=calculateAffinityChainDelta150(affinityDiff);const affinityFormula=formatAffinityChainFormula(affinityDiff);const intervalDelta=calculateIntervalChainDelta(mainInterval,selfInterval);const skillBonus=getFormationChainBonusFromData(data,row);const jijuBonus=getFormationJijuDirectBonusForChain(f,row);const starBonus=getFormationStarDirectBonusForChain(row);const estimated=clampPercentValue(baseRate+affinityDelta+intervalDelta+jijuBonus.value+starBonus.value+skillBonus.value);const intervalFormula=(mainInterval&&selfInterval)?`454.5×(${mainInterval}-${selfInterval})/(${selfInterval}×${mainInterval})=${formatPercentOne(intervalDelta)}%`:'';return {baseRate,mainAffinity,selfAffinity,affinityDiff,affinityDelta,affinityFormula,mainInterval,selfInterval,intervalDelta,intervalFormula,skillBonus:skillBonus.value,skillBonusDetails:skillBonus.details,jijuBonus:jijuBonus.value,jijuBonusDetails:jijuBonus.details,starBonus:starBonus.value,starBonusDetails:starBonus.details,starRank:starBonus.star,estimatedRate:estimated};}
function evaluateFormationTacticChainMeta(row,mainRow,data,f){if(!row?.generalName)return {available:false,label:'未設定'};const meta=row.activationMeta||{};if(row.slotKey==='main')return {available:true,isMain:true,rateLabel:'100%（主将）',displayRate:100,estimatedRate:100,reason:'主将は期待値計算では100%。発動順は連鎖順優先、同一連鎖順では主将が最優先。',intervalDiff:0};const calc=calculateEstimatedChainRate150(row,mainRow,data,f);const baseRate=calc.baseRate;const intervalDiff=(calc.mainInterval&&calc.selfInterval)?calc.selfInterval-calc.mainInterval:0;const slower=intervalDiff>0;const faster=intervalDiff<0;const notes=[];if(baseRate)notes.push(`基礎連鎖率 ${baseRate}%`);else notes.push('基礎連鎖率 未取得');if(calc.affinityDiff!==null)notes.push(`相性差 ${calc.affinityDiff}/75 → ${calc.affinityDelta>=0?'+':''}${formatPercentOne(calc.affinityDelta)}%${calc.affinityFormula?`（${calc.affinityFormula}）`:''}`);else notes.push('相性値 未取得 → +0%');if(calc.mainInterval&&calc.selfInterval){const formulaNote=calc.intervalFormula?`（${calc.intervalFormula}）`:'';if(slower)notes.push(`主将より${intervalDiff}秒遅い → ${formatPercentOne(calc.intervalDelta)}%${formulaNote}`);else if(faster)notes.push(`主将より${Math.abs(intervalDiff)}秒早い → +${formatPercentOne(calc.intervalDelta)}%${formulaNote}`);else notes.push('主将と発動間隔同一 → +0%');}else notes.push('発動間隔差 未取得 → +0%');notes.push(`侍従配置補正 +${formatPercentOne(calc.jijuBonus||0)}%`);notes.push(`将星補正 +${formatPercentOne(calc.starBonus||0)}%`);if(calc.skillBonus)notes.push(`技能補正 +${formatPercentOne(calc.skillBonus)}%`);else notes.push('技能補正 +0%');notes.push(`推定連鎖率 ${formatPercentOne(calc.estimatedRate)}%`);return {available:true,isMain:false,baseRate,displayRate:calc.estimatedRate,estimatedRate:calc.estimatedRate,affinityDiff:calc.affinityDiff,affinityDelta:calc.affinityDelta,affinityFormula:calc.affinityFormula,mainAffinity:calc.mainAffinity,selfAffinity:calc.selfAffinity,intervalDelta:calc.intervalDelta,skillBonus:calc.skillBonus,skillBonusDetails:calc.skillBonusDetails,jijuBonus:calc.jijuBonus,jijuBonusDetails:calc.jijuBonusDetails,starBonus:calc.starBonus,starBonusDetails:calc.starBonusDetails,starRank:calc.starRank,intervalFormula:calc.intervalFormula,intervalDiff,slower,faster,rateLabel:baseRate?`${formatPercentOne(calc.estimatedRate)}%（推定）`:'未取得',reason:notes.join(' / ')};}
function tacticChainOrderRank(orderText){const t=norm(orderText||'');if(t.includes('早'))return 1;if(t.includes('普通'))return 2;if(t.includes('遅'))return 3;return 99;}
function tacticSlotPriorityRank(slotKey){if(slotKey==='main')return 1;if(slotKey==='deputy1')return 2;if(slotKey==='deputy2')return 3;return 99;}
function getFormationTacticActivationOrderRows(rows){return (rows||[]).filter(r=>r?.generalName).map(r=>({row:r,orderRank:tacticChainOrderRank(r?.activationMeta?.chainOrder),slotRank:tacticSlotPriorityRank(r?.slotKey)})).sort((a,b)=>(a.orderRank-b.orderRank)||(a.slotRank-b.slotRank)).map((x,idx)=>({...x.row,activationOrder:idx+1,activationOrderRank:x.orderRank,activationSlotRank:x.slotRank}));}
function formatTacticActivationOrderLabel(row){const order=norm(row?.activationMeta?.chainOrder||'未取得');return `${row.activationOrder}. ${row.slotLabel}：${row.generalDisplay||row.generalName}（連鎖順：${order}）`;}

function collectFormationTacticAttackRows(f,data){const specs=[{key:'main',label:'主将'},{key:'deputy1',label:'副将1'},{key:'deputy2',label:'副将2'}];const rows=specs.map(spec=>{const slot=f?.slots?.[spec.key]||{};const generalName=normalizeSaveItemName(slot.general||'');const general=generalName?findItemByDisplayName('generals',generalName):null;const summary=general?extractTacticAttackSummary(general):null;const activationMeta=general?extractTacticActivationMeta(general):{};const evalContext={slotKey:spec.key,slotLabel:spec.label,generalName,generalDisplay:general?getItemDisplayName(general):generalName,activationMeta,general,slot};const evaluated=summary?evaluateFormationTacticAttackSummary(summary,data,evalContext):null;return {...evalContext,summary,evaluated,basePower:evaluated?.basePower||0};});const mainRow=rows.find(r=>r.slotKey==='main');rows.forEach(r=>{r.chain=evaluateFormationTacticChainMeta(r,mainRow,data,f);});return rows;}
function formatFormationTacticFormulaTerm(row,withModifiers){const s=row?.summary||{};if(!s.hasAttack)return '0%';if(!withModifiers)return row?.evaluated?.baseFormula||'0%';return row?.evaluated?.adjustedFormula||row?.evaluated?.baseFormula||'0%';}
function calculateFormationTacticAttackTotals(rows){const active=(rows||[]).filter(r=>r?.summary?.hasAttack);const baseTotal=active.reduce((sum,r)=>sum+(Number(r.evaluated?.basePower)||0),0);const adjustedTotal=active.reduce((sum,r)=>sum+(Number(r.evaluated?.adjustedPower)||Number(r.evaluated?.basePower)||0),0);const baseFormula=active.length?active.map(r=>`${r.slotLabel} ${formatFormationTacticFormulaTerm(r,false)}`).join(' + '):'0%';const adjustedFormula=active.length?active.map(r=>`${r.slotLabel} ${formatFormationTacticFormulaTerm(r,true)}`).join(' + '):'0%';const hasModifier=active.some(r=>!!r.evaluated?.hasModifier);const hasEvaluatedModifier=active.some(r=>!!r.evaluated?.hasEvaluatedModifier);return {activeCount:active.length,baseTotal,adjustedTotal,baseFormula,adjustedFormula,hasModifier,hasEvaluatedModifier};}
function getFormationTacticAttackMaxPowerSummary(f,data){try{const rows=collectFormationTacticAttackRows(f,data);const totals=calculateFormationTacticAttackTotals(rows);const maxPower=totals.hasEvaluatedModifier?totals.adjustedTotal:totals.baseTotal;return {maxPower,baseTotal:totals.baseTotal,hasAttack:totals.activeCount>0,hasModifier:totals.hasModifier,hasEvaluatedModifier:totals.hasEvaluatedModifier,label:totals.activeCount>0?`最大${maxPower}%`:'直接攻撃なし'};}catch(err){debugLog('formation:tactic-max-summary-error',{message:err?.message||String(err)});return {maxPower:0,baseTotal:0,hasAttack:false,label:'未取得'};}}


function formationTacticDetailOpenAttr(key){return formationSummaryOpenAttr(key,false);}
function renderFormationTacticSectionSummary(title,chips){return `<span class="formation-tactic-section-summary"><span class="formation-tactic-summary-main">${esc(title)}</span><span class="formation-tactic-summary-chips">${(chips||[]).filter(Boolean).map(c=>`<span class="formation-tactic-summary-chip${c.warn?' is-warn':''}">${esc(c.label||c)}</span>`).join('')}</span></span>`;}
function formationTacticSlotSummary(rows,mode){return (rows||[]).map(r=>{if(!r.generalName)return `${r.slotLabel}:未設定`;const s=r.summary||{};if(mode==='rate')return `${r.slotLabel}:${r.chain?.rateLabel||'未取得'}`;if(mode==='tactic')return `${r.slotLabel}:${s.tacticName||'-'}`;return `${r.slotLabel}:${normalizeTacticAttackNoAttackLabel(s)}`;}).join(' / ');}
function renderFormationTacticChainSummary(rows){const activationRows=getFormationTacticActivationOrderRows(rows);const activationHtml=activationRows.length?activationRows.map(r=>`<div>${esc(formatTacticActivationOrderLabel(r))}</div>`).join(''):'<div>発動順を判定できる戦法枠がありません。</div>';const rowHtml=(rows||[]).map(r=>{if(!r.generalName)return `<div class="parameter-row"><div class="parameter-main"><span class="parameter-key">${esc(r.slotLabel)}</span><span class="parameter-value-inline">未設定</span></div></div>`;const meta=r.activationMeta||{};const chain=r.chain||{};const interval=meta.intervalText||'未取得';const rate=chain.rateLabel||'未取得';const order=meta.chainOrder||'未取得';const affinityText=chain.isMain?'主将':(chain.affinityDiff!==null?`主将：${chain.mainAffinity} / ${r.slotLabel}：${chain.selfAffinity} / 相性差：${chain.affinityDiff}`:'未取得');const affinityDeltaText=chain.isMain?'+0%':`${Number(chain.affinityDelta||0)>=0?'+':''}${formatPercentOne(chain.affinityDelta||0)}%`;const affinityFormulaText=(!chain.isMain&&chain.affinityFormula)?` / ${chain.affinityFormula}`:'';const intervalDeltaText=chain.isMain?'+0%':`${Number(chain.intervalDelta||0)>=0?'+':''}${formatPercentOne(chain.intervalDelta||0)}%`;const jijuText=chain.isMain?'+0%':`+${formatPercentOne(chain.jijuBonus||0)}%`;const starText=chain.isMain?'+0%':`+${formatPercentOne(chain.starBonus||0)}%`;const skillText=chain.isMain?'+0%':`+${formatPercentOne(chain.skillBonus||0)}%`;const extraDetails=[];(chain.jijuBonusDetails||[]).forEach(d=>extraDetails.push(`<div>侍従内訳：${esc(d)}</div>`));(chain.starBonusDetails||[]).forEach(d=>extraDetails.push(`<div>将星内訳：${esc(d)}</div>`));(chain.skillBonusDetails||[]).slice(0,6).forEach(d=>extraDetails.push(`<div>技能内訳：${esc(d.source||'')}${d.value?` +${esc(formatPercentOne(d.value))}%`:''}${d.condition?` / ${esc(d.condition)}`:''}</div>`));const reasonHtml=(!chain.isMain&&chain.reason)?`<div>判定：${esc(chain.reason||'')}</div>`:'';return `<div class="parameter-row formation-tactic-chain-row"><div class="parameter-main"><span class="parameter-key">${esc(r.slotLabel)}</span><span class="parameter-value-inline">${esc(rate)}</span><span class="parameter-inline-detail">${esc(interval)} / ${esc(order)}</span></div><details class="formation-tactic-formula-details"><summary>計算式</summary><div class="parameter-detail-expanded"><div>武将：${esc(r.generalDisplay||r.generalName)}</div><div>発動間隔：${esc(interval)}</div><div>発動率/基礎連鎖率：${esc(meta.rateText||'未取得')}</div><div>相性補正：${esc(affinityText)} / ${esc(affinityDeltaText)}${esc(affinityFormulaText)}</div><div>発動間隔補正：${esc(intervalDeltaText)}${chain.intervalFormula?` / ${esc(chain.intervalFormula)}`:''}</div><div>侍従配置補正：${esc(jijuText)}</div><div>将星補正：${esc(starText)}</div><div>技能補正：${esc(skillText)}</div>${reasonHtml}${extraDetails.join('')}</div></details></div>`;}).join('');const summary=renderFormationTacticSectionSummary('連鎖率・発動順',[{label:formationTacticSlotSummary(rows,'rate')}]);return `<details class="formation-mobile-summary-section formation-tactic-subsection formation-tactic-chain-section"${formationTacticDetailOpenAttr('summary:tactic:chain')}><summary>${summary}</summary><div class="formation-mobile-summary-body"><div class="parameter-block formation-tactic-chain-rate"><div class="parameter-block-body"><div class="parameter-row"><div class="parameter-main"><span class="parameter-key">発動順</span><span class="parameter-value-inline">連鎖順優先</span></div><div class="parameter-detail-expanded"><div>判定ルール：連鎖順が最優先。同じ連鎖順の場合のみ、主将 → 副将1 → 副将2。</div>${activationHtml}</div></div>${rowHtml}<div class="formation-note">推定連鎖率は、基礎連鎖率＋相性補正（150進数の相性差を10−0.2×相性差で計算）＋発動間隔補正（454.5×(主将秒−副将秒)/(副将秒×主将秒)、小数第1位四捨五入）＋侍従配置補正＋将星補正＋技能補正で算出します。一時的な連鎖率上昇は通常補正に混ぜず括弧付きで扱います。</div></div></div></div></details>`;}
function formatTacticExpectedNumber(value){const n=Number(value)||0;return Number.isInteger(n)?String(n):String(Math.round(n*10)/10);}
function calculateFormationTacticExpectedValue(rows){const parts=[];let baseExpected=0;let adjustedExpected=0;let hasModifier=false;let hasUnevaluatedModifier=false;let hasAny=false;(rows||[]).forEach(r=>{if(!r?.generalName)return;hasAny=true;const slotLabel=r.slotLabel||'';const basePower=Number(r.basePower)||0;const rate=r.slotKey==='main'?100:(Number(r.chain?.displayRate)||0);const rateLabel=r.slotKey==='main'?'100%':(rate?`${rate}%`:'未取得');const baseContribution=basePower*rate/100;baseExpected+=baseContribution;const hasMod=!!r.evaluated?.hasModifier;const hasEval=!!r.evaluated?.hasEvaluatedModifier;const adjustedPower=hasEval?(Number(r.evaluated.adjustedPower)||basePower):basePower;const adjustedContribution=adjustedPower*rate/100;adjustedExpected+=adjustedContribution;if(hasMod)hasModifier=true;if(hasMod&&!hasEval)hasUnevaluatedModifier=true;parts.push({slotLabel,generalDisplay:r.generalDisplay||r.generalName||'',basePower,adjustedPower,rate,rateLabel,baseContribution,adjustedContribution,hasModifier:hasMod,hasEvaluatedModifier:hasEval,formula:`${slotLabel} ${basePower}% × ${rateLabel}`});});const baseFormula=parts.length?parts.map(p=>`${p.slotLabel} ${p.basePower}%×${p.rateLabel}`).join(' + '):'0';const adjustedFormula=parts.length?parts.map(p=>`${p.slotLabel} ${p.adjustedPower}%×${p.rateLabel}${p.hasModifier&&!p.hasEvaluatedModifier?'(補正未評価)':''}`).join(' + '):'0';return {hasAny,parts,baseExpected,adjustedExpected,baseFormula,adjustedFormula,hasModifier,hasUnevaluatedModifier};}
function renderFormationTacticExpectedValueSummary(rows){const expected=calculateFormationTacticExpectedValue(rows);if(!expected.hasAny)return '';const partHtml=expected.parts.map(p=>`<div>${esc(p.slotLabel)}：${esc(p.generalDisplay)} / ${esc(String(p.basePower))}% × ${esc(p.rateLabel)} = ${esc(formatTacticExpectedNumber(p.baseContribution))}%</div>`).join('');const adjustedLabel=expected.hasModifier?(expected.hasUnevaluatedModifier?'補正式あり（未評価含む）':`${formatTacticExpectedNumber(expected.adjustedExpected)}%`):`基礎期待値と同じ（${formatTacticExpectedNumber(expected.baseExpected)}%）`;const adjustedDetail=expected.hasModifier?`${esc(expected.adjustedFormula)}${expected.hasUnevaluatedModifier?'':' = '+esc(formatTacticExpectedNumber(expected.adjustedExpected))+'%'}`:'攻撃率補正がないため、補正込み期待値は基礎期待値と同じです。';const summary=renderFormationTacticSectionSummary('連鎖期待値',[{label:`基礎 ${formatTacticExpectedNumber(expected.baseExpected)}%`},{label:`補正込み ${adjustedLabel}`}]);return `<details class="formation-mobile-summary-section formation-tactic-subsection formation-tactic-expected-section"${formationTacticDetailOpenAttr('summary:tactic:expected')}><summary>${summary}</summary><div class="formation-mobile-summary-body"><div class="parameter-block formation-tactic-expected-value"><div class="parameter-block-body"><div class="parameter-row"><div class="parameter-main"><span class="parameter-key">基礎期待値</span><span class="parameter-value-inline">${esc(formatTacticExpectedNumber(expected.baseExpected))}%</span></div><div class="parameter-detail-expanded"><div>${esc(expected.baseFormula)} = ${esc(formatTacticExpectedNumber(expected.baseExpected))}%</div>${partHtml}</div></div><div class="parameter-row"><div class="parameter-main"><span class="parameter-key">補正込み期待値</span><span class="parameter-value-inline">${esc(adjustedLabel)}</span></div><div class="parameter-detail-expanded">${adjustedDetail}</div></div><div class="formation-note">主将は100%、副将は相性・発動間隔・侍従配置・将星・技能補正を反映した推定連鎖率で算出します。</div></div></div></div></details>`;}
function renderFormationTacticAttackSummary(f,data,opts={}){const rows=collectFormationTacticAttackRows(f,data);const filled=rows.filter(r=>r.generalName).length;const totals=calculateFormationTacticAttackTotals(rows);const rowHtml=rows.map(r=>{if(!r.generalName)return `<div class="parameter-row"><div class="parameter-main"><span class="parameter-key">${esc(r.slotLabel)}</span><span class="parameter-value-inline">未設定</span></div></div>`;const s=r.summary||{};const label=normalizeTacticAttackNoAttackLabel(s);const modText=normalizeTacticAttackModifierLabel(r.evaluated,s);const formula=s.hasAttack?(r.evaluated?.adjustedFormula||s.formula||'計算式なし'):'直接攻撃なし';const adjusted=r.evaluated?.hasEvaluatedModifier?`評価後 ${r.evaluated.adjustedPower}%`:'';const valueText=adjusted?`${label} / ${adjusted}`:label;return `<div class="parameter-row formation-tactic-attack-row"><div class="parameter-main"><span class="parameter-key">${esc(r.slotLabel)}</span><span class="parameter-value-inline">${esc(s.tacticName||'-')}</span><span class="parameter-inline-detail">${esc(valueText)}</span></div><div class="parameter-detail-expanded"><div>武将：${esc(r.generalDisplay||r.generalName)}</div><div>攻撃：${esc(label)}</div><div>攻撃率補正：${esc(modText)}</div><div>計算式：${esc(formula)}</div></div></div>`;}).join('');const adjustedLabel=totals.hasModifier?(totals.hasEvaluatedModifier?`${totals.adjustedTotal}%`:'補正式あり（未評価あり）'):`基礎合計と同じ（${totals.baseTotal}%）`;const adjustedDetail=totals.hasModifier?`${esc(totals.adjustedFormula)}${totals.hasEvaluatedModifier?` = ${esc(String(totals.adjustedTotal))}%`:'（補正未評価あり。詳細は主将・副将戦法を確認）'}`:`攻撃率補正がないため、補正込みは基礎合計と同じです。`;const copyAction=`<div class="row between"><span class="note">Discord向けコピー対応</span><button type="button" class="copy-btn" data-copy-formation-tactic-attack>戦法攻撃サマリーコピー</button></div>`;const totalSummary=renderFormationTacticSectionSummary('三連鎖時サマリー',[{label:`基礎 ${totals.baseTotal}%`},{label:`補正込み ${adjustedLabel}`,warn:totals.hasModifier&&!totals.hasEvaluatedModifier}]);const totalHtml=`<details class="formation-mobile-summary-section formation-tactic-subsection formation-tactic-total-section"${formationTacticDetailOpenAttr('summary:tactic:total')}><summary>${totalSummary}</summary><div class="formation-mobile-summary-body"><div class="parameter-block formation-tactic-chain-total"><div class="parameter-block-body">${copyAction}<div class="parameter-row"><div class="parameter-main"><span class="parameter-key">基礎合計</span><span class="parameter-value-inline">${esc(String(totals.baseTotal))}%</span></div><div class="parameter-detail-expanded">${esc(totals.baseFormula)} = ${esc(String(totals.baseTotal))}%</div></div><div class="parameter-row"><div class="parameter-main"><span class="parameter-key">補正込み</span><span class="parameter-value-inline">${esc(adjustedLabel)}</span></div><div class="parameter-detail-expanded">${adjustedDetail}</div></div></div></div></div></details>`;const chainHtml=renderFormationTacticChainSummary(rows);const expectedHtml=renderFormationTacticExpectedValueSummary(rows);const detailSummary=renderFormationTacticSectionSummary('主将・副将戦法',[{label:formationTacticSlotSummary(rows,'tactic')}]);const detailHtml=`<details class="formation-mobile-summary-section formation-tactic-subsection formation-tactic-detail-section"${formationTacticDetailOpenAttr('summary:tactic:detail')}><summary>${detailSummary}</summary><div class="formation-mobile-summary-body"><div class="parameter-block"><div class="parameter-block-body">${rowHtml}</div></div></div></details>`;return `<div class="formation-tactic-attack-section"><div class="formation-note">各カードは初期折り畳みです。見出しで要点を確認し、計算式は必要時のみ展開できます。</div>${totalHtml}${chainHtml}${expectedHtml}${detailHtml}</div>`;}
function renderGeneralTactic(item){const table=findTacticTable(item);if(!Array.isArray(table)||table.length<6)return '';const valueRow=Array.isArray(table[1])?table[1]:[];const effectLine=norm((table[3]||[])[0]||'');const timingHeaders=Array.isArray(table[4])?table[4]:[];const timingValues=Array.isArray(table[5])?table[5]:[];const summaryRows=[['戦法名',findTacticName(item)],['兵科',valueRow[0]||''],['効果系統',valueRow[1]||''],['攻撃属性',valueRow[2]||''],['発動間隔',timingValues[0]||''],['対象範囲',timingValues[1]||''],['発動率',timingValues[2]||''],['連鎖順',timingValues[3]||'']];return `<div class="general-card"><div class="general-card-header">戦法</div><div class="general-card-body"><div class="general-two-col"><div>${renderEquipmentKeyValueRows(summaryRows)}</div><div class="general-card" style="box-shadow:none"><div class="general-card-header">効果概要</div><div class="general-card-body"><div class="general-text">${fmtTacticLinkedContent([effectLine])}</div></div></div></div></div></div>`;}
function findAdditionalEffectsTable(item){const tables=Array.isArray(item?.tables)?item.tables:[];const idx=findTableIndex(tables,table=>Array.isArray(table)&&Array.isArray(table[0])&&norm(table[0][0]||'')==='追加効果'&&norm(table[0][1]||'')==='対象範囲');return idx>=0?tables[idx]:null;}
function inferTacticAdditionalEffectDirection(targetText,descriptionText=''){const target=norm(targetText);if(/敵|相手/.test(target))return 'weak';if(/自分|自身|自部隊|味方|味方部隊|味方\s*\/|自分\s*\//.test(target))return 'strong';const desc=norm(descriptionText);if(/自分|自身|自部隊|味方|味方部隊|味方\s*\/|自分\s*\//.test(desc))return 'strong';if(/敵|相手/.test(desc))return 'weak';if(/低下|減少|下げ|弱化/.test(desc))return 'weak';if(/上昇|増加|上げ|強化|短縮|軽減/.test(desc))return 'strong';return '';}function findStatusEffectActualNameForLink(name){const target=norm(name);if(!target)return '';const hit=(state.statusEffects||[]).find(item=>[item?.name,item?.originalName,item?.raw?.name,item?.title,item?.statusDisplayName].map(norm).filter(Boolean).includes(target));return hit?norm(hit.name||hit.originalName||hit.raw?.name||target):'';}function resolveTacticAdditionalStatusEffectName(effectName,targetText='',descriptionText=''){const raw=norm(effectName);if(!raw)return '';const directName=findStatusEffectActualNameForLink(raw);if(directName)return directName;const direct=findDetailLinkTarget(raw,'statusEffects');if(direct)return norm(direct.item?.name||direct.item?.originalName||direct.item?.raw?.name||getItemDisplayName(direct.item));const direction=inferTacticAdditionalEffectDirection(targetText,descriptionText);const candidates=[];const normalized=raw.replace(/（/g,'(').replace(/）/g,')');if(/変化$/.test(normalized)||STATUS_EFFECT_NORMALIZATION_RULES[`${normalized}(強化)`]||STATUS_EFFECT_NORMALIZATION_RULES[`${normalized}(弱化)`]){if(direction==='weak')candidates.push(`${normalized}(弱化)`,`${normalized}（弱化）`);if(direction==='strong')candidates.push(`${normalized}(強化)`,`${normalized}（強化）`);candidates.push(`${normalized}(強化)`,`${normalized}（強化）`,`${normalized}(弱化)`,`${normalized}（弱化）`);}for(const cand of candidates){const actual=findStatusEffectActualNameForLink(cand);if(actual)return actual;const target=findDetailLinkTarget(cand,'statusEffects');if(target)return norm(target.item?.name||target.item?.originalName||target.item?.raw?.name||getItemDisplayName(target.item));}return '';}function tacticAdditionalEffectNameHtml(effectName,targetText='',descriptionText=''){const display=norm(effectName);if(!display)return '';const statusName=resolveTacticAdditionalStatusEffectName(display,targetText,descriptionText);if(!statusName)return esc(display);return `<a href="#" class="detail-entity-link" data-category="statusEffects" data-name="${esc(statusName)}">${esc(display)}</a>`;}function renderGeneralAdditionalEffects(item){const table=findAdditionalEffectsTable(item);if(!Array.isArray(table)||table.length<3)return '';const rows=[];for(let i=1;i<table.length;i+=2){const head=Array.isArray(table[i])?table[i]:[];const desc=Array.isArray(table[i+1])?norm(table[i+1][0]||''):'';if(norm(head[0]||''))rows.push([head[0]||'',head[1]||'',head[2]||'',desc]);}if(!rows.length)return '';return `<div class="general-card"><div class="general-card-header">追加効果</div><div class="general-card-body"><table class="generic-table"><thead><tr><th>効果名</th><th>対象</th><th>継続</th><th>内容</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${tacticAdditionalEffectNameHtml(row[0],row[1],row[3])}</td><td>${esc(row[1])}</td><td>${esc(row[2])}</td><td>${fmtTacticLinkedContent([row[3]],row[0],row[1])}</td></tr>`).join('')}</tbody></table></div></div>`;}
function getTacticDetailDebugInfo(item,renderSource,html){
  const info={name:getItemDisplayName(item),category:detailCategory(item),sourceGeneral:norm(item?.raw?.sourceGeneral||item?.sourceGeneral||''),renderSourceName:renderSource?getItemDisplayName(renderSource):'',directTableCount:Array.isArray(item?.tables)?item.tables.length:0,sourceTableCount:renderSource&&Array.isArray(renderSource?.tables)?renderSource.tables.length:0,hasTacticTable:!!(renderSource&&findTacticTable(renderSource)),hasAdditionalEffectsTable:!!(renderSource&&findAdditionalEffectsTable(renderSource)),format:'general-tactic-card-compatible',htmlLength:String(html||'').length,statusEffectLinks:{attack:String(html||'').includes('data-name="攻撃変化(強化)"'),defense:String(html||'').includes('data-name="防御変化(強化)"'),tacticPower:String(html||'').includes('data-name="戦法威力変化(強化)"')}};
  return info;
}
function findSourceGeneralForTacticDetail(item){
  const sourceGeneral=norm(item?.raw?.sourceGeneral||item?.sourceGeneral||'');
  if(sourceGeneral){
    const hit=(state.generals||[]).find(g=>normalizeSaveItemName(getItemDisplayName(g))===normalizeSaveItemName(sourceGeneral));
    if(hit)return hit;
  }
  const tacticName=getItemDisplayName(item);
  return (state.generals||[]).find(g=>norm(findTacticName(g))===norm(tacticName))||null;
}
function buildTacticDetailDebugText(){
  const d=state.diagnostics?.tacticDetail;
  if(!d)return '';
  const lines=[];
  lines.push(`[tactic-detail] name="${d.name}" sourceGeneral="${d.sourceGeneral||''}" renderSource="${d.renderSourceName||''}"`);
  lines.push(`[tactic-detail] format=${d.format} directTableCount=${d.directTableCount} sourceTableCount=${d.sourceTableCount} hasTacticTable=${!!d.hasTacticTable} hasAdditionalEffectsTable=${!!d.hasAdditionalEffectsTable} htmlLength=${d.htmlLength}`);
  lines.push(`[tactic-detail] statusEffectLinks attack=${!!d.statusEffectLinks?.attack} defense=${!!d.statusEffectLinks?.defense} tacticPower=${!!d.statusEffectLinks?.tacticPower}`);
  if(d.reason)lines.push(`[tactic-detail] reason=${d.reason}`);
  return lines.join('\n');
}
function validateTacticDetailRenderedHtmlSmoke(){
  const sample=(state.tactics||[]).find(item=>getItemDisplayName(item)==='豪強猛武')||null;
  if(!sample)return {ok:false,reason:'sample tactic 豪強猛武 not found'};
  const html=renderTacticDetail(sample,{validation:true});
  const checks=[
    {name:'戦法カード',ok:/general-card-header">戦法</.test(html)},
    {name:'追加効果カード',ok:/general-card-header">追加効果</.test(html)},
    {name:'generic-table',ok:/class="generic-table"/.test(html)},
    {name:'攻撃変化リンク',ok:html.includes('data-category="statusEffects"')&&html.includes('data-name="攻撃変化(強化)"')},
    {name:'防御変化リンク',ok:html.includes('data-category="statusEffects"')&&html.includes('data-name="防御変化(強化)"')},
    {name:'戦法威力変化リンク',ok:html.includes('data-category="statusEffects"')&&html.includes('data-name="戦法威力変化(強化)"')}
  ];
  return {ok:checks.every(c=>c.ok),sample:'豪強猛武',checks,htmlLength:html.length,diagnostics:state.diagnostics?.tacticDetail||null};
}

function validateSkillDetailTabRenderedHtmlSmoke(){
  const sample=(state.skills||[]).find(item=>getItemDisplayName(item)==='剛塁')||null;
  if(!sample)return {ok:false,reason:'sample skill 剛塁 not found'};
  const prevItem=state.selectedItem,prevLabel=state.selectedLabel,prevTab=state.detailActiveTab;
  let html='';
  try{
    state.selectedItem=sample;state.selectedLabel='技能';state.detailActiveTab=getDetailInitialTabForItem(sample);
    html=renderTabbedDetailContent(sample,'skills');
  }finally{state.selectedItem=prevItem;state.selectedLabel=prevLabel;state.detailActiveTab=prevTab;}
  const checks=[
    {name:'内容詳細タブ',ok:html.includes('data-detail-tab="skillDetail"')&&html.includes('内容詳細')},
    {name:'内容詳細がactive',ok:html.includes('data-active-tab="skillDetail"')},
    {name:'技能説明カード',ok:html.includes('general-card-header">技能説明')},
    {name:'技能本文またはLv表',ok:html.includes('generic-table')&&html.includes('剛塁')===false?true:/Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ/.test(html)},
    {name:'変化率タブも残存',ok:html.includes('data-detail-tab="parameter"')&&(html.includes('変化率')||html.includes('サマリー'))}
  ];
  return {ok:checks.every(c=>c.ok),sample:'剛塁',activeTab:getDefaultDetailTabForCategory('skills'),checks,htmlLength:html.length,diagnostics:state.diagnostics?.detailTabs||null};
}

function validateSkillDetailAutoSelectTabPolicySmoke(){
  const sample=(state.skills||[]).find(item=>getItemDisplayName(item)==='剛塁')||null;
  const source=String(renderSearchResults||'');
  const checks=[
    {name:'pending detail link keeps category default tab',ok:source.includes('getDetailInitialTabForItem(pendingRow.item)')},
    {name:'exact name auto select keeps category default tab',ok:source.includes('getDetailInitialTabForItem(exactRow.item)')},
    {name:'first auto select keeps category default tab',ok:source.includes('getDetailInitialTabForItem(rows[0].item)')},
    {name:'skill default tab is content detail',ok:sample&&getDetailInitialTabForItem(sample)==='skillDetail'}
  ];
  return {ok:checks.every(c=>c.ok),checks,policy:'renderSearchResults must not force skill detail selections back to parameter'};
}

function renderTacticDetail(item,options={}){const source=findSourceGeneralForTacticDetail(item)||item;const tactic=renderGeneralTactic(source);const add=renderGeneralAdditionalEffects(source);const blocks=[tactic,add].filter(Boolean).join('');const html=blocks?`<div class="general-detail-stack tactic-detail-stack">${blocks}</div>`:'';const diag=getTacticDetailDebugInfo(item,source,html);if(!blocks)diag.reason='tactic/additional-effect blocks empty; check derived tactic tables and source general lookup';state.diagnostics.tacticDetail=diag;if(!options.validation)debugLog('tacticDetail:render',diag);return html;}
function isGeneralSkillSection(item,sec){const title=norm(sec?.title||'');const itemName=norm(item?.name||'');if(!title)return false;const reserved=[`${itemName}の技能`,`${itemName}の能力・五行適正`,`${itemName}の参軍性能`,`${itemName}と相性の良い武将`,`${itemName}の入手方法`,`${itemName}の兵科`,`${itemName}の列伝`,'初期能力','最大能力','五行適正','兵科の基本能力','各レベルの能力'];if(reserved.includes(title))return false;if(title.endsWith('の技能')||title.endsWith('の戦法')||title.endsWith('の専用名宝'))return false;if(/^(相性の良い|演義|正史|ランキング情報|武将関連のお役立ち情報)/.test(title))return false;const filteredContent=filterSkillContentLines(sec?.content||[]);if(!filteredContent.length)return false;if(filteredContent.some(line=>norm(line).startsWith(`${itemName}の技能`)))return false;return filteredContent.some(line=>/[■●]/.test(String(line||'')));}
function isAdvisorSkillParentSection(sec){const title=norm(sec?.title||'');return title==='参軍技能'||/の参軍性能$/.test(title);}function collectGeneralSkillTableSections(item){const sections=[];const seen=new Set();(Array.isArray(item?.tables)?item.tables:[]).forEach((table,tableIndex)=>{(Array.isArray(table)?table:[]).forEach((row,rowIndex)=>{if(!Array.isArray(row)||row.length<2)return;const key=norm(row[0]||'');const body=norm(row.slice(1).join(' '));const m=key.match(/^(.+?)([1-9]|10)$/);if(!m||!body||!/[■●]/.test(body))return;const name=norm(m[1]);if(!name||SKILL_RARITY_NOISE_NAMES.has(name)||seen.has(name))return;seen.add(name);sections.push({title:name,content:[body],_source:'table-skill-row',_tableIndex:tableIndex,_rowIndex:rowIndex,_listedLevel:arabicLevelToRoman(m[2])});});});return sections;}
function collectGeneralSkillCardSections(item){const sourceSections=Array.isArray(item?.sections)?item.sections:[];const baseSections=sourceSections.filter(sec=>!isAdvisorSkillParentSection(sec)).filter(sec=>isGeneralSkillSection(item,sec));const byName=new Map();baseSections.forEach(sec=>{const name=norm(sec?.title||'');if(name&&!byName.has(name))byName.set(name,{...sec,_source:'section'});});collectGeneralSkillTableSections(item).forEach(sec=>{const name=norm(sec?.title||'');if(name&&!byName.has(name))byName.set(name,sec);});const listedSkillNames=[...getOwnedSkillLevelMapFromTables(item).keys()];const relatedSkillNames=[];const orderedNames=[];listedSkillNames.forEach(name=>{name=norm(name);if(name&&!orderedNames.includes(name))orderedNames.push(name);});const cards=[];orderedNames.forEach(name=>{let sec=byName.get(name);if(!sec){const skillItem=(state.skills||[]).find(s=>norm(s?.name||s?.title||'')===name);const skillSec=Array.isArray(skillItem?.sections)&&skillItem.sections.length?skillItem.sections[0]:null;const content=filterSkillContentLines(skillSec?.content||[]);if(content.length)sec={title:name,content,_source:'state.skills-owned'};}if(sec)cards.push(sec);});baseSections.forEach(sec=>{const name=norm(sec?.title||'');if(name&&!cards.some(s=>norm(s?.title||'')===name))cards.push({...sec,_source:'section-extra'});});const renderedNames=cards.map(sec=>norm(sec?.title||'')).filter(Boolean);const expectedNames=[...new Set(orderedNames.filter(Boolean))];const missingSkillNames=expectedNames.filter(name=>!renderedNames.includes(name));return {sections:cards,listedSkillNames,relatedSkillNames,renderedNames,missingSkillNames};}

function isAppointmentSkillText(text){return /(?:^|[■●▼\s　])[^。■●▼]*に任命時|任命時/.test(norm(text||''));}
function getSkillUsageBadgesHtml(isAdvisorSkill,isAppointmentSkill){let html='';if(isAdvisorSkill)html+='<span class="badge advisor-skill-badge">参軍技能</span>';if(isAppointmentSkill)html+='<span class="badge appointment-skill-badge">任命技能</span>';return html;}
function renderGeneralSkillContentForLevel(lines,currentLevel){const filtered=filterSkillContentLines(lines);if(state.viewMode==='saved'){if(!currentLevel)return {content:['この保存データでは未解放です。'],selected:false};const joined=filtered.join(' ');const selected=extractRomanLevelBlockText(joined,currentLevel);if(selected&&selected!==joined)return {content:[selected],selected:true};}return {content:filtered,selected:!!currentLevel};}
function renderGeneralSkills(item){const sourceSections=Array.isArray(item?.sections)?item.sections:[];const advisorStart=sourceSections.findIndex(sec=>norm(sec?.title||'')==='参軍技能');let advisorEnd=sourceSections.length;if(advisorStart>=0){const foundEnd=sourceSections.findIndex((sec,idx)=>idx>advisorStart&&isAdvisorSkillStopTitle(norm(sec?.title||'')));if(foundEnd>=0)advisorEnd=foundEnd;}const advisorRangeCount=advisorStart>=0?Math.max(0,advisorEnd-advisorStart):0;const advisorSkillNames=new Set(extractAdvisorSkillEntries(item,getItemDisplayName(item)).map(e=>norm(e.name)));const skillCoverage=collectGeneralSkillCardSections(item);const sections=skillCoverage.sections;debugLog('renderGeneralSkills:coverage',{name:getItemDisplayName(item),advisorStart,advisorEnd,advisorRangeCount,advisorSkillNames:[...advisorSkillNames],listedSkillNames:skillCoverage.listedSkillNames,relatedSkillNames:skillCoverage.relatedSkillNames,renderedSkillNames:skillCoverage.renderedNames,missingSkillNames:skillCoverage.missingSkillNames,renderedCount:sections.length,sectionSources:sections.map(sec=>({title:norm(sec?.title||''),source:sec?._source||'section'})).slice(0,50)});if(!sections.length)return '';const resolvedSkillMap=getResolvedGeneralSkillLevelMap(item);const cards=[];sections.forEach(sec=>{const rawFilteredContent=filterSkillContentLines(sec?.content||[]);const currentLevel=resolvedSkillMap.get(norm(sec.title))||'';const renderedContentInfo=renderGeneralSkillContentForLevel(sec?.content||[],currentLevel);const filteredContent=renderedContentInfo.content;const levelControl=`<span class="badge">Lv: ${esc(currentLevel||'なし')}</span>`;const isAdvisorSkill=advisorSkillNames.has(norm(sec.title));const isAppointmentSkill=isAppointmentSkillText(rawFilteredContent.join(' '));if(isAdvisorSkill)debugLog('advisorSkill:render',{general:getItemDisplayName(item),skillName:norm(sec.title),source:sec?._source||'section'});if(isAppointmentSkill)debugLog('appointmentSkill:render',{general:getItemDisplayName(item),skillName:norm(sec.title),source:sec?._source||'section'});const badges=getSkillUsageBadgesHtml(isAdvisorSkill,isAppointmentSkill);cards.push(`<div class="general-skill-card ${isAdvisorSkill?'advisor-skill-card ':''}${isAppointmentSkill?'appointment-skill-card':''}"><div class="row between" style="align-items:flex-start;gap:12px"><div class="general-skill-name" style="margin-bottom:0">${esc(sec.title)}${badges?' '+badges:''}</div><div>${levelControl}</div></div><div class="general-text" style="margin-top:12px">${fmtContent(filteredContent)}</div></div>`);const embeddedEntries=(currentLevel&&!isAdvisorSkill&&!isAppointmentSkill)?getReferencedSkillEntriesFromLines(rawFilteredContent).filter(entry=>entry.found):[];embeddedEntries.forEach(entry=>{const refCurrentLevel=entry.level;const refLevelControl=`<span class="badge">付与Lv: ${esc(refCurrentLevel)}</span>`;cards.push(`<div class="general-skill-card" style="background:#f8fafc"><div class="row between" style="align-items:flex-start;gap:12px"><div class="general-skill-name" style="margin-bottom:0">${esc(entry.name)}</div><div>${refLevelControl}<span class="badge">技能データ参照</span></div></div><div class="general-text" style="margin-top:12px">${fmtContent(entry.content)}</div></div>`);});});return `<div class="general-card"><div class="general-card-header">技能</div><div class="general-card-body"><div class="general-skill-grid">${cards.join('')}</div></div></div>`;}
const EQUIPMENT_STAGE_OPTIONS=['initial','ssrMax','urMax'];
function normalizeEquipmentStage(stage){return EQUIPMENT_STAGE_OPTIONS.includes(stage)?stage:'urMax';}

function normalizeDerivedEquipmentStageKey(stage){
  const st=norm(stage||'');
  if(st==='initial'||st==='初期')return 'initial';
  if(st==='ssrMax'||st==='SSR最大'||st==='ssr_max')return 'ssrMax';
  if(st==='urMax'||st==='UR最大'||st==='ur_max')return 'urMax';
  return normalizeEquipmentStage(st||'urMax');
}
function getDerivedEquipmentSkillStageEntry(item){
  const bucket=state?.derivedData?.equipmentSkillStageIndex;
  const items=bucket&&bucket.available&&Array.isArray(bucket.items)?bucket.items:[];
  if(!items.length||!item)return null;
  const names=[getItemDisplayName(item),item?.name,item?.displayName,item?.rawName,item?.title,item?.raw?.name,item?.raw?.title].map(v=>normalizeSaveItemName(v)).filter(Boolean);
  return items.find(entry=>{
    if(normalizeDerivedSearchCategory(entry?.category||'')!=='equipments')return false;
    const entryNames=[entry?.name,entry?.displayName,entry?.rawName,entry?.title].map(v=>normalizeSaveItemName(v)).filter(Boolean);
    return names.some(n=>entryNames.includes(n));
  })||null;
}
function derivedEquipmentStageLegacyTitle(stageKey){
  const st=normalizeDerivedEquipmentStageKey(stageKey);
  if(st==='initial')return 'SSR時の初期能力';
  if(st==='ssrMax')return 'SSR時の最大能力';
  return 'UR時の最大能力';
}
function getDerivedEquipmentSkillStageBlocks(item){
  const entry=getDerivedEquipmentSkillStageEntry(item);
  if(!entry||!entry.stages)return null;
  const order=['urMax','ssrMax','initial'];
  const blocks=[];
  order.forEach((stageKey,idx)=>{
    const stage=entry.stages[stageKey];
    if(!stage||!Array.isArray(stage.skills)||!stage.skills.length)return;
    const table=stage.skills.map(s=>[norm(s?.skillName||s?.name||''),norm(s?.text||s?.body||'')]).filter(row=>row[0]&&row[1]);
    if(!table.length)return;
    blocks.push({
      title:derivedEquipmentStageLegacyTitle(stageKey),
      displayLabel:stage.label||equipmentStageLabel(stageKey),
      stageKey:normalizeDerivedEquipmentStageKey(stageKey),
      table,
      sourceIndex:`derived:${stageKey}`,
      source:'hadou_equipment_skill_stage_index.json',
      parameterEffects:Array.isArray(stage.parameterEffects)?stage.parameterEffects:[]
    });
  });
  if(blocks.length){
    const diag={item:getItemDisplayName(item),source:'hadou_equipment_skill_stage_index.json',blockCount:blocks.length,titles:blocks.map(b=>b.title),qualityAudit:state.derivedData?.equipmentSkillStageIndex?.meta?.qualityAudit||null};
    state.diagnostics.equipmentSkillStageIndex=diag;
    debugLog('equipmentSkillStageIndex:blocks',diag);
    return blocks;
  }
  return null;
}
function equipmentStageLabel(stage){const st=normalizeEquipmentStage(stage);return st==='initial'?'初期':st==='ssrMax'?'SSR最大':'UR最大';}
function equipmentStageModeLabelForItem(item){const stage=getEffectiveEquipmentStageForItem(item);const prefix=state.viewMode==='saved'?'保存データ':'全データ';return `${prefix}(${equipmentStageLabel(stage)})`;}
function renderEquipmentStageStatusHtml(item){if(!isEquipmentItem(item))return '';return `<div class="parameter-stage-status note">装備状態：${esc(equipmentStageModeLabelForItem(item))}</div>`;}
function equipmentStageStatusCopyLine(item){if(!isEquipmentItem(item))return '';return `装備状態：${equipmentStageModeLabelForItem(item)}`;}
function equipmentStageTitleCandidates(stage){const st=normalizeEquipmentStage(stage);if(st==='initial')return ['SSR時の初期能力','技能ブロック3','技能ブロック2'];if(st==='ssrMax')return ['SSR時の最大能力','技能ブロック2','技能ブロック1'];return ['UR時の最大能力','SSR時の最大能力','技能ブロック1'];}
function getTableRows(table){if(Array.isArray(table))return table;if(table&&Array.isArray(table.rows))return table.rows;return [];}
function getTableSourceIndex(table,fallbackIndex=0){if(table&&typeof table==='object'&&!Array.isArray(table)&&Number.isFinite(Number(table.index)))return Number(table.index);return fallbackIndex;}
function isEquipmentSkillTable(table){const rows=getTableRows(table);if(!rows.length)return false;let skillLike=0;let invalidHeader=0;(rows||[]).forEach(row=>{if(!Array.isArray(row)||row.length<2)return;const name=norm(row[0]||'');const body=norm(row.slice(1).join(' '));if(!name||!body)return;if(/^(最高レア|種類|兵科|レア|統率|武力|知力|政治|魅力|武将|特徴|装備品|装備品の入手方法|探索の進め方|名宝ランキング)$/.test(name)){invalidHeader++;return;}if(/^(UR|SSR|SR|R)$/.test(name)&&/[0-9]/.test(body)){invalidHeader++;return;}if(/[■●▼]|技能Lv/.test(body))skillLike++;});return skillLike>0&&skillLike>=invalidHeader;}
function getEquipmentSkillStageBlocks(item,skillTables){const derivedBlocks=getDerivedEquipmentSkillStageBlocks(item);if(derivedBlocks&&derivedBlocks.length)return derivedBlocks;const sourceTables=Array.isArray(skillTables)&&skillTables.length?skillTables:(Array.isArray(item?.tables)?item.tables:[]).filter((table,idx)=>idx>1&&isEquipmentSkillTable(table));const highestRare=norm(findFirstTableValue(item,'最高レア'));const blocks=[];sourceTables.forEach((table,idx)=>{const rows=getTableRows(table);if(!rows.length)return;let title='';if(highestRare==='UR'){if(idx===0)title='UR時の最大能力';else if(idx===1)title='SSR時の最大能力';else if(idx===2)title='SSR時の初期能力';else title='技能ブロック'+(idx+1);}else if(highestRare==='SSR'){if(idx===0)title='SSR時の最大能力';else if(idx===1)title='SSR時の初期能力';else title='技能ブロック'+(idx+1);}else{title='技能ブロック'+(idx+1);}blocks.push({title,table:rows,sourceIndex:getTableSourceIndex(table,idx)});});debugLog('equipmentStage:source-blocks',{equipment:getItemDisplayName(item),highestRare,skillTableCount:sourceTables.length,blockCount:blocks.length,titles:blocks.map(b=>b.title)});return blocks;}
function splitEquipmentTablesForTabs(item){const tables=Array.isArray(item?.tables)?item.tables:[];const basic=[];const skill=[];const other=[];tables.forEach((table,idx)=>{const rows=getTableRows(table);if(!rows.length){return;}if(idx>1&&isEquipmentSkillTable(table)){skill.push(rows);return;}const firstCells=rows.map(row=>Array.isArray(row)?norm(row[0]||''):'').filter(Boolean);const joined=firstCells.join(' ');if(/^(最高レア|種類|兵科|レア|統率|武力|知力|政治|魅力)/.test(joined)||firstCells.some(x=>/^(最高レア|種類|兵科|レア|統率|武力|知力|政治|魅力)$/.test(x))){basic.push(rows);return;}other.push(rows);});debugLog('equipmentTables:split',{item:getItemDisplayName(item),total:tables.length,basic:basic.length,skill:skill.length,other:other.length});return {basic,skill,other};}
function selectEquipmentSkillStageBlock(item,skillTables,stage=state.equipmentStage){const blocks=getEquipmentSkillStageBlocks(item,skillTables||[]);const requested=normalizeEquipmentStage(stage);const candidates=equipmentStageTitleCandidates(requested);let block=blocks.find(b=>candidates.includes(norm(b.title||'')));let fallback=false;if(!block&&blocks.length){fallback=true;if(requested==='initial')block=blocks[blocks.length-1];else if(requested==='ssrMax')block=blocks.find(b=>norm(b.title||'').includes('SSR時の最大'))||blocks[0];else block=blocks.find(b=>norm(b.title||'').includes('UR時の最大'))||blocks.find(b=>norm(b.title||'').includes('SSR時の最大'))||blocks[0];}if(block&&norm(block.title||'')!==candidates[0])fallback=true;return {block,blocks,requestedStage:requested,requestedLabel:equipmentStageLabel(requested),fallback};}
function findSkillItemByName(name){const target=norm(name);if(!target)return null;return (state.skills||[]).find(item=>norm(item?.name||item?.title||'')===target)||null;}
function extractEquipmentReferencedSkillRefsFromText(text){const refs=[];const seen=new Set();function push(name,level,matchedText,kind,extra={}){name=norm(name);level=norm(level);if(!name||!level)return;if(!findSkillItemByName(name))return;const key=name+'__'+level+'__'+kind;if(seen.has(key))return;seen.add(key);refs.push({name,level,matchedText:norm(matchedText),kind,...extra});}
  const src=String(text||'');if(!src)return refs;
  extractEmbeddedSkillRefsFromText(src).forEach(ref=>push(ref.name,ref.level,ref.matchedText,'owned-grant'));
  for(const m of src.matchAll(/部隊の「([^」]+)」の技能Lv\s*\+\s*([1-9]|10)(?:（上限([1-9]|10)）)?/g)){const name=norm(m[1]||'');const boost=Number(m[2])||0;const limit=m[3]?Number(m[3]):0;if(name&&boost&&findSkillItemByName(name)){const key=name+'__boost__'+boost+'__'+limit+'__skill-lv-boost';if(!seen.has(key)){seen.add(key);refs.push({name,level:'',matchedText:norm(m[0]),kind:'skill-lv-boost',boost,limit});}}debugLog('equipmentStage:skill-lv-boost-reference-detected',{skill:name,boost,limit,matchedText:norm(m[0]||''),reason:'部隊編成では対象技能を武将側が所持している場合だけ合算技能Lvへ加算する'});}
  for(const m of src.matchAll(/(?:^|[■●▼\s　「])([一-鿿々ぁ-んァ-ヶーA-Za-z0-9]+)Lv([1-9]|10)を付与/g)){const level=ROMAN_LEVELS[Number(m[2])-1]||'';push(m[1],level,m[0],'grant',{grantLevel:Number(m[2])});}
  return refs;}
function addEquipmentReferencedSkillParameterRecordsFromText(text,parentSkillName,add,extra={}){const refs=extractEquipmentReferencedSkillRefsFromText(text);refs.forEach(ref=>{const skillItem=findSkillItemByName(ref.name);if(ref.kind==='skill-lv-boost'){const source=`技能:${ref.name}Lv+${ref.boost}${ref.limit?`（上限${ref.limit}）`:''}`;add(source,ref.matchedText,'include',{...extra,parentSkillName,formationSkillName:ref.name,formationSavedLevel:ref.boost,grantedSkillName:ref.name,equipmentReferenceKind:ref.kind,equipmentReferenceText:ref.matchedText,equipmentReferenceParentText:text,equipmentSkillBoost:ref.boost,equipmentSkillLimit:ref.limit});debugLog('equipmentStage:skill-lv-boost-record',{equipment:extra.equipmentName||'',stage:extra.equipmentStageLabel||'',sourceSkill:parentSkillName,targetSkill:ref.name,boost:ref.boost,limit:ref.limit,matchedText:ref.matchedText,skillFound:!!skillItem,source});return;}const section=skillItem&&Array.isArray(skillItem.sections)&&skillItem.sections.length?skillItem.sections[0]:null;const raw=(section&&Array.isArray(section.content)?section.content:[]).filter(line=>!isOwnerListContentLine(line)).join(' ');const selected=extractRomanLevelBlockText(raw,ref.level);const source=`参照技能:${ref.name}${ref.level}`;if(selected){add(source,selected,'include',{...extra,parentSkillName,grantedSkillName:ref.name,grantedSkillLevel:ref.level,equipmentReferenceKind:ref.kind,equipmentReferenceText:ref.matchedText,equipmentReferenceParentText:text});}
  debugLog('equipmentStage:granted-skill',{equipment:extra.equipmentName||'',stage:extra.equipmentStageLabel||'',sourceSkill:parentSkillName,referencedSkill:ref.name,referencedLv:ref.level,kind:ref.kind,matchedText:ref.matchedText,skillFound:!!skillItem,adopted:!!selected,source});});return refs;}
function invalidateEquipmentStageCaches(){
  let count=0,statusTextCount=0,quickRelationCount=0;
  [...(state.equipments||[])].forEach(item=>{
    if(Object.prototype.hasOwnProperty.call(item,'_parameterSummarySearchTextAll')){delete item._parameterSummarySearchTextAll;count++;}
    if(Object.prototype.hasOwnProperty.call(item,'_metricSourceSegmentsAll'))delete item._metricSourceSegmentsAll;
    ['_statusEffectRelatedLinkTextSafeAll','_statusEffectRelatedLinkTextSafeWithTacticEffects'].forEach(key=>{
      if(Object.prototype.hasOwnProperty.call(item,key)){delete item[key];statusTextCount++;}
    });
    if(Object.prototype.hasOwnProperty.call(item,'_quickStatusEffectRelationCache')){delete item._quickStatusEffectRelationCache;quickRelationCount++;}
  });
  state._quickOwnerRowsCache=null;
  state._quickOwnerAsyncSeq=(state._quickOwnerAsyncSeq||0)+1;
  debugLog('equipmentStage:cache-invalidate',{count,statusTextCount,quickRelationCount,quickOwnerActive:!!state.quickStatusEffectOwnerFilter,reason:'equipment stage affects equipment status-effect owner search'});
}
function setEquipmentStage(stage){const next=normalizeEquipmentStage(stage);if(state.equipmentStage===next){syncFileSettingsSummary();return;}const prev=state.equipmentStage;state.equipmentStage=next;try{localStorage.setItem('hado_library_equipment_stage_v1',next);}catch{}invalidateEquipmentStageCaches();syncFileSettingsSummary();debugLog('equipmentStage:selected',{previous:prev,current:next,label:equipmentStageLabel(next),quickOwnerActive:!!state.quickStatusEffectOwnerFilter});if(state.quickStatusEffectOwnerFilter)runQuickStatusEffectOwnerSearchAsync(state.quickStatusEffectOwnerFilter);renderSearchResults();renderDetail();if(state.mainTab==='formation')renderFormationScreen();else markFormationScreenStale('equipment-stage');pushOperationHistory('equipment-stage');if(typeof updateDataContextBar==='function')updateDataContextBar('equipment-stage');}

function renderEquipmentSkillStageTables(item,tables){const blocks=getEquipmentSkillStageBlocks(item,tables||[]);const html=blocks.map((block,idx)=>{const body=renderEquipmentTwoColumnFormattedRows(block.table);if(!body)return '';return `<div class="general-card"><div class="general-card-header">${esc(block.title||('技能ブロック'+(idx+1)))}</div><div class="general-card-body">${body}</div></div>`;}).filter(Boolean).join('');debugLog('equipmentSkillBlocks:render',{item:getItemDisplayName(item),highestRare:findFirstTableValue(item,'最高レア'),rawSkillBlockCount:Array.isArray(tables)?tables.length:0,renderedBlockCount:blocks.length,titles:blocks.map(b=>b.title),sourceIndexes:blocks.map(b=>b.sourceIndex)});return html;}

function getSkillEquipmentSourceNames(item){const names=[];const raw=item?.raw||{};if(norm(raw.sourceEquipment))names.push(norm(raw.sourceEquipment));(Array.isArray(raw.sourceEquipments)?raw.sourceEquipments:[]).forEach(v=>{if(norm(v))names.push(norm(v));});(Array.isArray(item?.sourceNames)?item.sourceNames:[]).forEach(v=>{const n=norm(v);if(n&&state.equipments.some(eq=>normalizeSaveItemName(getItemDisplayName(eq))===normalizeSaveItemName(n)))names.push(n);});return uniq(names);}
function filterEquipmentSkillRowsForSkill(table,skillName){const name=norm(skillName);if(!Array.isArray(table)||!name)return [];return table.filter(row=>{if(!Array.isArray(row)||row.length<2)return false;const rowName=norm(row[0]||'');const body=norm(row.slice(1).join(' '));if(rowName===name)return true;if(body.includes(`「${name}」`)||body.includes(`${name}Lv`)||body.includes(`${name}の技能Lv`))return true;return false;});}
function renderSkillEquipmentStageCards(item){const skillName=getItemDisplayName(item);const equipmentNames=getSkillEquipmentSourceNames(item);const blocks=[];equipmentNames.forEach(eqName=>{const equipment=state.equipments.find(eq=>normalizeSaveItemName(getItemDisplayName(eq))===normalizeSaveItemName(eqName));if(!equipment)return;const skillTables=(Array.isArray(equipment?.tables)?equipment.tables:[]).filter((table,idx)=>idx>1&&Array.isArray(table)&&table.length&&Array.isArray(table[0])&&isEquipmentSkillTable(table));const stageBlocks=getEquipmentSkillStageBlocks(equipment,skillTables);stageBlocks.forEach(block=>{const rows=filterEquipmentSkillRowsForSkill(block.table,skillName);if(!rows.length)return;const body=renderEquipmentTwoColumnFormattedRows(rows);if(!body)return;blocks.push(`<div class="general-card"><div class="general-card-header">${esc(eqName)}：${esc(block.title||'技能')}</div><div class="general-card-body">${body}</div></div>`);});});debugLog('skillEquipmentStageBlocks:render',{skill:skillName,equipmentNames,renderedBlockCount:blocks.length});return blocks.join('');}

function isEthnicResearchSkillItem(item){return !!(item&&item.isEthnicResearchSkill||norm(item?.sourceType||'')==='ethnicResearchSkill'||norm(item?.type||'')==='ethnicResearchSkill');}
function renderEthnicResearchSkillSettingCard(item){
  if(!isEthnicResearchSkillItem(item))return '';
  const name=getItemDisplayName(item);
  const levels=Array.isArray(item?.levels)?item.levels:[];
  const effectiveSetting=getEffectiveEthnicResearchSkillSetting(item,true);
  const maxRoman=effectiveSetting.maxRoman||getEthnicResearchSkillMaxRoman(item);
  const effectiveEnabled=!!effectiveSetting.enabled;
  const effectiveLevel=normalizeSkillLevelValue(effectiveSetting.level)||'Ⅰ';
  const disabled=effectiveSetting.editable?'':' disabled';
  const note=effectiveSetting.source==='saved'
    ?'保存データ表示時は、この技能解放と解放Lvを部隊編成へ反映します。未設定時は技能解放を有効、解放LvをⅠとして扱います。'
    :(effectiveSetting.source==='all-max'
      ?'全データ表示時は、全データ武将グループが最大のため、技能解放を有効・解放Lvを最大値で固定表示します。'
      :'全データ表示時は、全データ武将グループが初期のため、技能解放を無効・解放Lvを1で固定表示します。');
  const levelOptions=(levels.length?levels.map(lv=>lv.roman||arabicLevelToRoman(lv.level)).filter(Boolean):ROMAN_LEVELS.slice(0,item?.maxLevel||5)).map(lv=>`<option value="${esc(lv)}" ${effectiveLevel===lv?'selected':''}>${esc(lv)}</option>`).join('');
  const triggerText=`${item.triggerSkill||item.ethnicGroup||'-'} Lv${item.triggerMinLevel||3}以上`;
  const rows=[
    ['分類','異文化調査専用技能'],
    ['異民族',esc(item.ethnicGroup||'-')],
    ['発動条件',esc(triggerText)],
    ['技能解放',`<label class="row note" style="gap:6px"><input type="checkbox" class="ethnic-research-enabled-input" data-skill-name="${esc(name)}" ${effectiveEnabled?'checked':''}${disabled} /><span>開放済みにする</span></label>`],
    ['解放Lv',`<select class="control-select ethnic-research-level-select" data-skill-name="${esc(name)}"${disabled}>${levelOptions}</select>`]
  ];
  debugLog('ethnicResearchSkill:setting-render',{skillName:name,viewMode:state.viewMode,generalStage:state.generalStage,effectiveEnabled,effectiveLevel,maxRoman,effectiveSource:effectiveSetting.source,editable:effectiveSetting.editable});
  return `<div class="general-card"><div class="general-card-header">異文化調査専用技能設定</div><div class="general-card-body"><table class="kv-table">${rows.map(row=>`<tr><td style="width:220px">${esc(row[0])}</td><td>${row[1]}</td></tr>`).join('')}</table><div class="meta" style="margin-top:8px">${esc(note)}</div></div></div>`;
}
function renderEthnicResearchEffectSummary(effects){
  if(!Array.isArray(effects)||!effects.length)return '<span class="meta">構造化効果なし</span>';
  return effects.map(effect=>{
    const key=norm(effect?.key||effect?.parameter||'');
    const value=(effect?.value!==undefined&&effect?.value!==null)?`${effect.sign||''}${effect.value}${effect.unit||''}`:'';
    const cond=norm(effect?.conditionText||effect?.condition||'');
    const target=norm(effect?.summaryTarget||'');
    return esc([key,value,cond,target?`対象:${target}`:''].filter(Boolean).join(' / '));
  }).join('<br>');
}
function renderEthnicResearchSkillDetail(item){
  const levels=Array.isArray(item?.levels)?item.levels:[];
  const settingCard=renderEthnicResearchSkillSettingCard(item);
  const levelRows=levels.map(lv=>`<tr><td style="width:64px;text-align:center"><strong>${esc(lv.roman||arabicLevelToRoman(lv.level))}</strong></td><td>${fmtContent([lv.effectText||''])}</td></tr>`).join('');
  const levelCard=levelRows?`<div class="general-card"><div class="general-card-header">Lv別効果</div><div class="general-card-body"><table class="generic-table"><thead><tr><th>Lv</th><th>効果本文</th></tr></thead><tbody>${levelRows}</tbody></table></div></div>`:'';
  debugLog('ethnicResearchSkill:detail-render',{skillName:getItemDisplayName(item),levelCount:levels.length,maxLevel:item?.maxLevel||levels.length,hasEffects:levels.some(lv=>Array.isArray(lv.effects)&&lv.effects.length),sourceImageCount:Array.isArray(item?.sourceImages)?item.sourceImages.length:0,displayPolicy:'effects/sourceImages are debug-only and are not rendered in detail'});
  const html=[settingCard,levelCard].filter(Boolean).join('');
  return html?`<div class="general-detail-stack">${html}</div>`:'';
}
function splitSkillLevelEffectRowsFromText(text){
  const source=norm(text||'');
  if(!source)return [];
  const rows=[];
  // FIX[HADO-2.5.6.16-SKILL-LEVEL-ROWS]: Ⅱ-Ⅲ-Ⅳ-Ⅴ のような未解放/未記載プレースホルダもレベル境界として扱い、Ⅰ行に後続Lv表記を巻き込まない。
  const re=/(Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|Ⅵ|Ⅶ|Ⅷ|Ⅸ|Ⅹ)(?=\s*(?:■|▼|●|-|－|—|―))/g;
  const matches=[...source.matchAll(re)];
  if(!matches.length)return [];
  matches.forEach((m,idx)=>{
    const level=m[1];
    const bodyStart=m.index+level.length;
    const bodyEnd=idx+1<matches.length?matches[idx+1].index:source.length;
    let body=norm(source.slice(bodyStart,bodyEnd));
    if(/^[-－—―]+$/.test(body))body='-';
    if(level&&body)rows.push([level,body]);
  });
  return rows;
}
function getSkillLevelRowsForDetail(item){
  const tableRows=getTableRows(Array.isArray(item?.tables)?item.tables[0]:null).filter(row=>Array.isArray(row)&&ROMAN_LEVELS.includes(norm(row[0]||'')));
  if(tableRows.length)return {rows:tableRows.map(row=>[norm(row[0]||''),norm(row.slice(1).join(' '))]).filter(row=>row[0]&&row[1]),source:'table'};
  const name=getItemDisplayName(item);
  const sections=Array.isArray(item?.sections)?item.sections:[];
  let best={rows:[],source:'none',sectionTitle:'',score:-1};
  for(const sec of sections){
    const title=norm(sec?.title||'');
    if(title&&name&&title!==name&&title!==`${name}のレベル別効果`&&!/のレベル別効果$/.test(title))continue;
    const lines=filterSkillContentLines(Array.isArray(sec?.content)?sec.content:[]);
    const text=lines.map(norm).filter(Boolean).join(' ');
    const rows=splitSkillLevelEffectRowsFromText(text);
    if(!rows.length)continue;
    const filledRows=rows.filter(row=>norm(row[1]||'')&&norm(row[1]||'')!=='-').length;
    const score=rows.length*1000+filledRows*100+rows.map(row=>norm(row[1]||'').length).reduce((a,b)=>a+b,0);
    if(score>best.score)best={rows,source:'section',sectionTitle:title,score};
  }
  if(best.rows.length){
    debugLog('skillDetail:level-table-source-selected',{name,sectionTitle:best.sectionTitle,rowCount:best.rows.length,score:best.score,policy:'2.5.6.17: 所有者一覧行を除外し、複数候補sectionからLv行数が最も多い説明を採用'});
    return {rows:best.rows,source:best.source,sectionTitle:best.sectionTitle};
  }
  return {rows:[],source:'none'};
}

function getSkillRelatedLinkLevelRowsForCurrentStage(item){
  const info=getSkillLevelRowsForDetail(item);
  const rows=(info.rows||[]).map(row=>[norm(row[0]||''),norm(row[1]||'')]).filter(row=>row[0]);
  if(!rows.length)return {rows:[],targetLevel:'',source:info.source||'none',reason:'no-level-rows'};
  const filled=rows.filter(row=>row[1]&&row[1]!=='-');
  const stage=normalizeGeneralStage(state.generalStage);
  let target='';
  let reason='';
  if(state.viewMode==='all'&&stage==='initial'){
    target='Ⅰ';
    reason='all-general-initial';
  }else if(state.viewMode==='all'&&stage==='max'){
    const last=filled[filled.length-1]||rows[rows.length-1];
    target=last?last[0]:'';
    reason='all-general-max';
  }else{
    const last=filled[filled.length-1]||rows[rows.length-1];
    target=last?last[0]:'';
    reason='fallback-current-max';
  }
  const selected=target?rows.filter(row=>row[0]===target&&row[1]&&row[1]!=='-'):[];
  const effective=selected.length?selected:(filled.length?[filled[filled.length-1]]:rows.slice(0,1));
  debugLog('skillRelatedLinks:level-scope',{skill:getItemDisplayName(item),viewMode:state.viewMode,generalStage:stage,targetLevel:target,effectiveLevels:effective.map(row=>row[0]),source:info.source||'none',reason,policy:'2.5.6.18: 表示は全Lvを維持し、関連リンクの状態変化判定だけ全データ武将オプションに合わせて対象Lvへ限定'});
  return {rows:effective,targetLevel:target,source:info.source||'none',reason};
}
function getSkillRelatedLinkStatusEffectTexts(item){
  const scoped=getSkillRelatedLinkLevelRowsForCurrentStage(item);
  return (scoped.rows||[]).map(row=>[row[0],row[1]].filter(Boolean).join(' ')).filter(Boolean);
}
function renderSkillLevelTableCard(item){
  const info=getSkillLevelRowsForDetail(item);
  const rows=info.rows||[];
  if(!rows.length)return '';
  const body=rows.map(row=>`<tr><td style="width:64px;text-align:center"><strong>${escDisplay(row[0])}</strong></td><td>${fmtContent([row[1]||''])}</td></tr>`).join('');
  debugLog('skillDetail:level-table',{name:getItemDisplayName(item),rowCount:rows.length,source:info.source,sectionTitle:info.sectionTitle||''});
  return `<div class="general-card"><div class="general-card-header">技能説明</div><div class="general-card-body"><table class="generic-table"><tbody>${body}</tbody></table></div></div>`;
}
function isDuplicateSkillDescriptionSection(item,sec){
  const title=norm(sec?.title||'');
  const name=getItemDisplayName(item);
  if(title===`${name}のレベル別効果`||/のレベル別効果$/.test(title))return true;
  return false;
}
function isSkillLevelTableSourceSection(item,sec){
  const title=norm(sec?.title||'');
  const name=getItemDisplayName(item);
  if(!title||!name)return false;
  if(title!==name&&title!==`${name}のレベル別効果`&&!/のレベル別効果$/.test(title))return false;
  const text=(Array.isArray(sec?.content)?sec.content:[]).map(norm).filter(Boolean).join(' ');
  return splitSkillLevelEffectRowsFromText(text).length>0;
}
function renderSkillDetail(item){
  if(isEthnicResearchSkillItem(item))return renderEthnicResearchSkillDetail(item);
  const stageHtml=renderSkillEquipmentStageCards(item);
  const levelInfo=getSkillLevelRowsForDetail(item);
  const levelHtml=renderSkillLevelTableCard(item);
  let sections=Array.isArray(item?.sections)?item.sections:[];
  if(stageHtml&&norm(item?.raw?.sourceEquipment||'')){sections=[];}
  if(levelHtml){sections=sections.filter(sec=>!isDuplicateSkillDescriptionSection(item,sec)&&!(levelInfo.source==='section'&&isSkillLevelTableSourceSection(item,sec)));}
  let baseHtml=renderSectionsHtml(sections);
  if(!baseHtml&&Array.isArray(item?.raw?.sections)&&item.raw.sections.length){
    const rawSections=item.raw.sections.filter(sec=>!(levelInfo.source==='section'&&isSkillLevelTableSourceSection(item,sec)));
    baseHtml=renderSectionsHtml(rawSections);
  }
  const html=[levelHtml,baseHtml,stageHtml].filter(Boolean).join('');
  const derivedOwnerDiagnostic=buildDerivedSkillOwnerDiagnosticForItem(item);
  if(derivedOwnerDiagnostic)state.diagnostics.derivedSkillOwnerForCurrentSkill=derivedOwnerDiagnostic;
  debugLog('skillDetail:render',{name:getItemDisplayName(item),hasLevelTable:!!levelHtml,levelTableSource:levelInfo.source,levelRowCount:(levelInfo.rows||[]).length,sectionCount:(Array.isArray(item?.sections)?item.sections:[]).length,renderedSectionCount:sections.length,rawSectionCount:(Array.isArray(item?.raw?.sections)?item.raw.sections:[]).length,stageHtml:!!stageHtml,htmlLength:String(html||'').length,derivedOwnerDiagnostic,policy:'2.7.3.33: レベル表はtable優先。本文末尾の所有者一覧は復活させず、所有者参照はhadou_skill_owner_index.json由来の関連リンク/診断へ分離。'});
  return html?`<div class="general-detail-stack">${html}</div>`:`<div class="general-detail-stack"><div class="general-card"><div class="general-card-header">技能説明</div><div class="general-card-body"><div class="detail-empty">表示できる技能説明がありません。Debug Log の skillDetail:render を確認してください。</div></div></div></div>`;
}

function getDetailTabSpecs(categoryKey){
  if(categoryKey==='generals')return [
    {key:'related',label:'概要'},
    {key:'parameter',label:'変化率'},
    {key:'basic',label:'基礎'},
    {key:'tactic',label:'戦法'},
    {key:'skill',label:'技能'},
    {key:'other',label:'その他'}
  ];
  if(categoryKey==='equipments')return [
    {key:'parameter',label:'変化率'},
    {key:'basic',label:'基礎'},
    {key:'skill',label:'装備技能'},
    {key:'other',label:'その他'}
  ];
  if(categoryKey==='skills')return [
    {key:'parameter',label:'変化率'},
    {key:'skillDetail',label:'内容詳細'}
  ];
  return [{key:'parameter',label:'変化率'}];
}
function getDefaultDetailTabForCategory(categoryKey){return categoryKey==='generals'?'related':(categoryKey==='skills'?'skillDetail':'parameter');}
function normalizeDetailActiveTab(categoryKey){
  const specs=getDetailTabSpecs(categoryKey);
  const allowed=new Set(specs.map(t=>t.key));
  const fallback=getDefaultDetailTabForCategory(categoryKey);
  const active=allowed.has(state.detailActiveTab)?state.detailActiveTab:(allowed.has(fallback)?fallback:'parameter');
  state.detailActiveTab=active;
  return active;
}
function renderDetailTabs(categoryKey){
  const active=normalizeDetailActiveTab(categoryKey);
  const specs=getDetailTabSpecs(categoryKey);
  return `<div class="detail-tabs" role="tablist">${specs.map(tab=>`<button type="button" class="detail-tab-btn ${tab.key===active?'is-active':''}" data-detail-tab="${esc(tab.key)}" role="tab" aria-selected="${tab.key===active?'true':'false'}">${esc(tab.label)}</button>`).join('')}</div>`;
}
function renderEquipmentTablesSubset(tables){
  if(!Array.isArray(tables)||!tables.length)return '';
  return tables.map((table,idx)=>{
    const body=Array.isArray(table)&&table.length?renderEquipmentGenericTable(table):'';
    if(!body)return '';
    return `<div class="general-card"><div class="general-card-header">${esc('情報'+(idx+1))}</div><div class="general-card-body">${body}</div></div>`;
  }).filter(Boolean).join('');
}
function findTroopBaseTable(item){
  return (Array.isArray(item?.tables)?item.tables:[]).find(table=>Array.isArray(table)&&table.length&&Array.isArray(table[0])&&norm(table[0][0]||'')==='兵科')||null;
}
function findTroopLevelTable(item){
  return (Array.isArray(item?.tables)?item.tables:[]).find(table=>Array.isArray(table)&&table.length&&Array.isArray(table[0])&&['騎兵武将','歩兵武将','弓兵武将'].some(k=>norm(table[0][0]||'').includes(k)))||null;
}
function renderGeneralDetail(item){
  const parts=buildGeneralDetailTabParts(item);
  return parts&&parts.html?Object.values(parts.html).filter(Boolean).join(''):renderSectionsHtml(item?.sections||[]);
}

function renderAdvisorLevelSettingCard(item){
  const itemName=getItemDisplayName(item)||norm(item?.name||'');
  const advisorDiag=buildAdvisorLevelDiagnosticForGeneral(item);
  if(!advisorDiag.advisorSkillCount)return '';
  const currentLevel=getEffectiveGeneralAdvisorLevel(itemName);
  const options=['',...Array.from({length:11},(_,i)=>String(i))].map(v=>`<option value="${esc(v)}" ${normalizeAdvisorLevelValue(v)===currentLevel?'selected':''}>${esc(v===''?'なし':v)}</option>`).join('');
  const unlocked=advisorDiag.activeAdvisorSkills.length?advisorDiag.activeAdvisorSkills.join(' / '):'なし';
  const skillRows=advisorDiag.advisorSkills.map(s=>`<tr><td>${esc(String(s.order))}</td><td>${esc(s.name)}</td><td>Lv${esc(String(s.unlockLevel||'-'))}</td><td>${s.active?'有効':'未解放'}</td></tr>`).join('');
  const selector=state.viewMode==='saved'?`<label class="row" style="gap:8px"><span>参軍Lv</span><select class="control-select general-advisor-level-select" data-general-name="${esc(itemName)}">${options}</select></label>`:`<div class="note">参軍Lv: ${esc(advisorLevelLabel(currentLevel))}（${esc(effectiveAdvisorLevelSourceLabel())}）</div>`;
  return `<div class="general-card" style="box-shadow:none"><div class="general-card-header">参軍Lv</div><div class="general-card-body"><div class="general-detail-stack">${selector}<div class="note">有効参軍技能: ${esc(unlocked)}</div><table class="generic-table"><thead><tr><th>#</th><th>参軍技能</th><th>解放</th><th>判定</th></tr></thead><tbody>${skillRows}</tbody></table></div></div></div>`;
}


function buildGeneralDetailTabParts(item,activeOnly=false,activeKey='parameter'){
  const profiler=createDetailStageProfiler({scope:'buildGeneralDetailTabParts',category:'generals',item:getItemDisplayName(item),activeOnly,activeKey});
  const include=key=>!activeOnly||activeKey===key;
  const html={related:'',parameter:'',basic:'',tactic:'',skill:'',other:''};
  const cards={related:[],parameter:[],basic:[],tactic:[],skill:[],other:[]};
  if(include('related')){const rel=profiler.wrap('related.safeBuildRelatedLinksHtml',()=>safeBuildRelatedLinksHtml(item,'generals',getItemDisplayName(item)),r=>({htmlLength:String(r||'').length,groupCount:state.diagnostics?.relatedLinks?.groupCount||0,source:state.diagnostics?.relatedLinks?.source||'',cacheHit:!!state.diagnostics?.relatedLinks?.cacheHit}));html.related=rel;cards.related=rel?['関連リンク']:[];}
  if(include('parameter')){const p=profiler.wrap('parameter.renderParameterSummaryTab',()=>renderParameterSummaryTab(item),r=>({htmlLength:String(r||'').length}));html.parameter=p;cards.parameter=p?['parameterSummary']:[];}
  if(include('basic')){
    const star=profiler.wrap('basic.renderStarRatingCard',()=>renderStarRatingCard('generals',item?.name||'',7),r=>({htmlLength:String(r||'').length}));
    const inherited=profiler.wrap('basic.renderInheritedSkillSettingCard',()=>renderInheritedSkillSettingCard(item),r=>({htmlLength:String(r||'').length}));
    const advisorLevel=profiler.wrap('basic.renderAdvisorLevelSettingCard',()=>renderAdvisorLevelSettingCard(item),r=>({htmlLength:String(r||'').length}));
    const basicInfo=profiler.wrap('basic.renderGeneralBasicInfo',()=>renderGeneralBasicInfo(item),r=>({htmlLength:String(r||'').length}));
    const ability=profiler.wrap('basic.renderGeneralAbilitySection',()=>renderGeneralAbilitySection(item),r=>({htmlLength:String(r||'').length}));
    html.basic=[star,inherited,advisorLevel,basicInfo,ability].filter(Boolean).join('');cards.basic=[star?'starRating':'',inherited?'継承技能':'',advisorLevel?'参軍Lv':'',basicInfo?'基本情報':'',ability?'能力・五行適正':''].filter(Boolean);
  }
  if(include('tactic')){const tactic=profiler.wrap('tactic.renderGeneralTactic',()=>renderGeneralTactic(item),r=>({htmlLength:String(r||'').length}));const add=profiler.wrap('tactic.renderGeneralAdditionalEffects',()=>renderGeneralAdditionalEffects(item),r=>({htmlLength:String(r||'').length}));html.tactic=[tactic,add].filter(Boolean).join('');cards.tactic=[tactic?'戦法':'',add?'追加効果':''].filter(Boolean);}
  if(include('skill')){const skills=profiler.wrap('skill.renderGeneralSkills',()=>renderGeneralSkills(item),r=>({htmlLength:String(r||'').length}));html.skill=[skills].filter(Boolean).join('');cards.skill=[skills?'技能':''].filter(Boolean);}
  if(include('other')){const troop=profiler.wrap('other.renderGeneralTroop',()=>renderGeneralTroop(item),r=>({htmlLength:String(r||'').length}));const comp=profiler.wrap('other.renderCompatibilityCard',()=>renderCompatibilityCard(item),r=>({htmlLength:String(r||'').length}));const comm=profiler.wrap('other.renderCommentaryCard',()=>renderCommentaryCard(item),r=>({htmlLength:String(r||'').length}));html.other=[troop,comp,comm].filter(Boolean).join('');cards.other=[troop?'兵科':'',comp?'相性':'',comm?'解説':''].filter(Boolean);}
  return {html,cards,excluded:['参軍技能(parentCard)'],unassigned:[],lazy:activeOnly,profile:profiler.finish({includedTabs:Object.keys(html).filter(k=>html[k]),cardCounts:Object.fromEntries(Object.entries(cards).map(([k,v])=>[k,(v||[]).length]))})};
}
function buildEquipmentDetailTabParts(item,activeOnly=false,activeKey='parameter'){
  const profiler=createDetailStageProfiler({scope:'buildEquipmentDetailTabParts',category:'equipments',item:getItemDisplayName(item),activeOnly,activeKey});
  const include=key=>!activeOnly||activeKey===key;
  const html={parameter:'',basic:'',skill:'',other:''};
  const cards={parameter:[],basic:[],skill:[],other:[]};
  const split=profiler.wrap('splitEquipmentTablesForTabs',()=>include('basic')||include('skill')||include('other')?splitEquipmentTablesForTabs(item):{basic:[],skill:[],other:[]},r=>({basicCount:(r?.basic||[]).length,skillCount:(r?.skill||[]).length,otherCount:(r?.other||[]).length}));
  if(include('parameter')){const p=profiler.wrap('parameter.renderParameterSummaryTab',()=>renderParameterSummaryTab(item),r=>({htmlLength:String(r||'').length}));html.parameter=p;cards.parameter=p?['parameterSummary']:[];}
  if(include('basic')){const star=profiler.wrap('basic.renderStarRatingCard',()=>renderStarRatingCard('equipments',item?.name||'',10),r=>({htmlLength:String(r||'').length}));const stageSetting=profiler.wrap('basic.renderEquipmentStageSettingCard',()=>renderEquipmentStageSettingCard(item),r=>({htmlLength:String(r||'').length}));const tableHtml=profiler.wrap('basic.renderEquipmentTablesSubset',()=>renderEquipmentTablesSubset(split.basic),r=>({htmlLength:String(r||'').length,rowGroups:(split.basic||[]).length}));const basic=[star,stageSetting,tableHtml].filter(Boolean).join('');html.basic=basic;cards.basic=[star?'starRating':'',stageSetting?'保存データの装備段階':'',split.basic.length?'基本情報・能力':''].filter(Boolean);}
  if(include('skill')){html.skill=profiler.wrap('skill.renderEquipmentSkillStageTables',()=>renderEquipmentSkillStageTables(item,split.skill),r=>({htmlLength:String(r||'').length}));const skillBlocks=profiler.wrap('skill.getEquipmentSkillStageBlocks',()=>getEquipmentSkillStageBlocks(item,split.skill||[]),r=>({blockCount:(r||[]).length}));cards.skill=skillBlocks.map(b=>b.title);}
  if(include('other')){html.other=profiler.wrap('other.renderEquipmentTablesSubset',()=>renderEquipmentTablesSubset(split.other),r=>({htmlLength:String(r||'').length,rowGroups:(split.other||[]).length}));cards.other=(split.other||[]).map((_,i)=>`その他情報table${i+1}`);}
  return {html,cards,excluded:['おすすめ武将(parameterSourceExcluded)','専用武将(parameterSourceExcluded)','入手方法(parameterSourceExcluded)'],unassigned:[],lazy:activeOnly,profile:profiler.finish({includedTabs:Object.keys(html).filter(k=>html[k]),cardCounts:Object.fromEntries(Object.entries(cards).map(([k,v])=>[k,(v||[]).length]))})};
}
function buildSkillDetailTabParts(item,activeOnly=false,activeKey='skillDetail'){
  const profiler=createDetailStageProfiler({scope:'buildSkillDetailTabParts',category:'skills',item:getItemDisplayName(item),activeOnly,activeKey});
  const include=key=>!activeOnly||activeKey===key;
  const html={skillDetail:'',parameter:''};
  const cards={skillDetail:[],parameter:[]};
  if(include('skillDetail')){const detail=profiler.wrap('skillDetail.renderSkillDetail',()=>renderSkillDetail(item),r=>({htmlLength:String(r||'').length}));html.skillDetail=[detail].filter(Boolean).join('');cards.skillDetail=[detail?'技能説明':''].filter(Boolean);}
  if(include('parameter')){const p=profiler.wrap('parameter.renderParameterSummaryTab',()=>renderParameterSummaryTab(item),r=>({htmlLength:String(r||'').length}));html.parameter=p;cards.parameter=p?['parameterSummary']:[];}
  return {html,cards,excluded:['技能説明重複section'],unassigned:[],lazy:activeOnly,profile:profiler.finish({includedTabs:Object.keys(html).filter(k=>html[k]),cardCounts:Object.fromEntries(Object.entries(cards).map(([k,v])=>[k,(v||[]).length]))})};
}
function renderTabbedDetailContent(item,categoryKey){
  const profiler=createDetailStageProfiler({scope:'renderTabbedDetailContent',category:categoryKey,item:getItemDisplayName(item)});
  const active=normalizeDetailActiveTab(categoryKey);profiler.mark('normalizeDetailActiveTab',{active});
  const activeOnly=true;
  const tabs=categoryKey==='generals'?profiler.wrap('buildGeneralDetailTabParts',()=>buildGeneralDetailTabParts(item,activeOnly,active),r=>({profileTotalMs:r?.profile?.totalMs||0,includedTabs:(r?.profile?.includedTabs||[]).join(',')})):categoryKey==='equipments'?profiler.wrap('buildEquipmentDetailTabParts',()=>buildEquipmentDetailTabParts(item,activeOnly,active),r=>({profileTotalMs:r?.profile?.totalMs||0,includedTabs:(r?.profile?.includedTabs||[]).join(',')})):categoryKey==='skills'?profiler.wrap('buildSkillDetailTabParts',()=>buildSkillDetailTabParts(item,activeOnly,active),r=>({profileTotalMs:r?.profile?.totalMs||0,includedTabs:(r?.profile?.includedTabs||[]).join(',')})):null;
  if(!tabs){const p=profiler.finish({activeTab:active,noTabs:true});if(!state.diagnostics)state.diagnostics={};state.diagnostics.detailTabBuildProfile=p;return '';}
  const fallback=getDefaultDetailTabForCategory(categoryKey);profiler.mark('resolveFallback',{fallback});
  const tabHtml=tabs.html[active]||tabs.html[fallback]||tabs.html.parameter||'';profiler.mark('resolveTabHtml',{htmlLength:String(tabHtml||'').length,active,fallback});
  const tabButtons=profiler.wrap('renderDetailTabs',()=>renderDetailTabs(categoryKey),r=>({htmlLength:String(r||'').length}));
  const cardLog={item:getItemDisplayName(item),category:categoryKey,activeTab:active,lazyRender:!!tabs.lazy,tabs:getDetailTabSpecs(categoryKey).map(t=>t.key),tabLabels:getDetailTabSpecs(categoryKey).map(t=>t.label),cards:tabs.cards,excluded:tabs.excluded,unassigned:tabs.unassigned,buildProfile:safeCloneForDebug(tabs.profile||{})};
  debugLog('detail-tabs',cardLog);state.diagnostics.detailTabs=cardLog;
  const htmlOut=`${tabButtons}<div class="detail-tab-content" data-active-tab="${esc(active)}">${tabHtml?`<div class="general-detail-stack">${tabHtml}</div>`:`<div class="detail-empty">このタブに表示する内容はありません。</div>`}</div>`;
  profiler.mark('assembleTabbedHtml',{htmlLength:String(htmlOut||'').length});
  const p=profiler.finish({activeTab:active,lazyRender:!!tabs.lazy,builderProfile:safeCloneForDebug(tabs.profile||{})});
  if(!state.diagnostics)state.diagnostics={};state.diagnostics.detailTabBuildProfile=p;debugLog('detail-tab-build-profile',p);
  return htmlOut;
}
function setupDetailTabButtons(){els.detail.querySelectorAll('.detail-tab-btn[data-detail-tab]').forEach(btn=>{btn.addEventListener('click',()=>{state.detailActiveTab=btn.getAttribute('data-detail-tab')||'parameter';debugLog('detail-tab:click',{tab:state.detailActiveTab,item:state.selectedItem?getItemDisplayName(state.selectedItem):''});renderDetail();});});}
