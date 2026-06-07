'use strict';
/* HADO JSON loading, diagnostics, event binding and startup */
function unwrapDerivedJsonItems(raw){if(Array.isArray(raw))return raw;if(raw&&Array.isArray(raw.items))return raw.items;if(raw&&raw.data&&Array.isArray(raw.data.items))return raw.data.items;return [];}
function getDerivedJsonMeta(raw){
  const keys=['schemaVersion','schema_version','generatedAt','dataSetId','datasetId','data_set_id','crawlerVersion','crawler_version','generator','sourceFiles','source_files','sourceCounts','source_counts','sourceHashes','source_hashes','sourceSha256','source_sha256','kind','qualityAudit'];
  const meta={};
  function mergeFrom(src,override=false){
    if(!src||typeof src!=='object'||Array.isArray(src))return;
    keys.forEach(k=>{if(Object.prototype.hasOwnProperty.call(src,k)&&(override||!Object.prototype.hasOwnProperty.call(meta,k)))meta[k]=src[k];});
  }
  // HADO-2.8.9.52: 継承・補完した大型派生JSONでは meta 内が古く、トップレベルに補正メタがある。
  // 先に meta/data.meta を読み、最後にトップレベルを優先マージして sourceFiles / crawlerVersion / dataSetId を正しく診断する。
  if(raw&&raw.meta&&typeof raw.meta==='object')mergeFrom(raw.meta,false);
  if(raw&&raw.data&&raw.data.meta&&typeof raw.data.meta==='object')mergeFrom(raw.data.meta,false);
  if(raw&&typeof raw==='object'&&!Array.isArray(raw))mergeFrom(raw,true);
  return meta;
}

// HADO-2.9.5.4: old-JSON safety gate for suppressed/negative evidence.
function hado2954NegContext(text){return /(?:発揮されず|発揮されない|低下させ|低下する|抑え|不利にする|不利になる|減少|解除|取り除|無効化|無効にな|避ける|回避)/.test(norm(text||''));}
function hado2954PosContext(text){return /(?:[+＋]\s*\d|上昇|増加|強化|有利になる|バフ)/.test(norm(text||''));}
function hado2954InvalidRelatedStatus(st, siblings){const mt=norm(st?.matchedText||'');if(norm(st?.groupKey||'')!=='selfAbilityBuff')return false;if(hado2954NegContext(mt)&&!hado2954PosContext(mt))return true;const p=norm(st?.parameter||'');if(p&&new RegExp(p+'を\\s*\\d+(?:\\.\\d+)?\\s*[％%]').test(mt)&&!hado2954PosContext(mt)){return (siblings||[]).some(x=>norm(x?.parameter||'')===p&&norm(x?.groupKey||'')==='enemyAbilityDebuff');}return false;}
function hado2954InvalidAntiObjectFeature(f){if(norm(f?.featureId||'')!=='parameter:anti_object')return false;const mt=norm(f?.matchedText||'');if(!mt)return true;if(/^(structured-)/.test(norm(f?.source||'')))return false;const positive=/(?:対物特効|対物体攻撃|物体に対する与ダメージ)[^。●▼■※]{0,80}(?:[+＋]\s*\d|上昇|増加|強化|有利になる|バフ)|対物(?:火力|バフ)[^。]{0,30}(?:強化|上昇|増加|高倍率|大幅)/.test(mt);return !positive||hado2954NegContext(mt)&&!positive;}
function hado2954SanitizeDerivedJsonBundle(bundle){try{const data=bundle?.items||{};const rel=data.relatedLinkIndex;if(rel?.items)rel.items.forEach(item=>{const arr=Array.isArray(item?.related?.statusEffects)?item.related.statusEffects:[];item.related.statusEffects=arr.filter(st=>!hado2954InvalidRelatedStatus(st,arr));});const type=data.typeSearchFeatureIndex;if(type?.items)type.items.forEach(item=>{const sts=Array.isArray(item?.statusEffectRefs)?item.statusEffectRefs:[];item.statusEffectRefs=sts.filter(st=>!hado2954InvalidRelatedStatus(st,sts));item.typeFeatures=(Array.isArray(item?.typeFeatures)?item.typeFeatures:[]).filter(f=>!hado2954InvalidAntiObjectFeature(f));item.statusEffectRefCount=item.statusEffectRefs.length;item.typeFeatureCount=item.typeFeatures.length;});return bundle;}catch(err){debugLog('hado2954:safety-gate-error',{message:err?.message||String(err)});return bundle;}}

function normalizeDerivedJsonBundle(data){const result={};const status={loaded:0,total:DERIVED_JSON_KEYS.length,available:[],fallback:[]};for(const key of DERIVED_JSON_KEYS){const raw=data?data[key]:null;const items=unwrapDerivedJsonItems(raw);const meta=getDerivedJsonMeta(raw);const file=DERIVED_JSON_FILES[key]||key;const missing=!!(meta&&meta.optional&&meta.fallback)||!raw;const available=!missing&&items.length>0;result[key]={key,file,items,meta,available,missing,fallback:!available,sourceCount:items.length,schemaVersion:meta.schemaVersion||meta.schema_version||'',dataSetId:meta.dataSetId||meta.datasetId||meta.data_set_id||meta.sourceDataVersion||'',crawlerVersion:meta.crawlerVersion||meta.crawler_version||'',qualityAudit:meta.qualityAudit||null};if(available){status.loaded++;status.available.push(key);}else{status.fallback.push(key);}}return hado2954SanitizeDerivedJsonBundle({items:result,status});}
function buildDerivedJsonDiagnostic(normalized){
  const status=normalized&&normalized.status?normalized.status:{loaded:0,total:DERIVED_JSON_KEYS.length,available:[],fallback:[]};
  const files=DERIVED_JSON_KEYS.map(key=>{
    const entry=normalized&&normalized.items?normalized.items[key]:null;
    const meta=entry&&entry.meta&&typeof entry.meta==='object'?entry.meta:{};
    let loadStatus='missing';
    if(entry){
      if(entry.available)loadStatus='loaded';
      else if(entry.missing)loadStatus='missing';
      else if(Array.isArray(entry.items)&&entry.items.length===0)loadStatus='empty';
      else if(entry.fallback)loadStatus='fallback';
    }
    const schemaVersion=meta.schemaVersion||meta.schema_version||'';
    const dataSetId=meta.dataSetId||meta.datasetId||meta.data_set_id||meta.sourceDataVersion||'';
    const crawlerVersion=meta.crawlerVersion||meta.crawler_version||'';
    return {
      key,
      file:(entry&&entry.file)||DERIVED_JSON_FILES[key]||key,
      status:loadStatus,
      available:!!(entry&&entry.available),
      fallback:!!(entry&&entry.fallback),
      missing:!!(entry&&entry.missing),
      itemCount:entry&&Array.isArray(entry.items)?entry.items.length:0,
      schemaVersion,
      dataSetId,
      crawlerVersion,
      fallbackReason:loadStatus==='loaded'?'':(entry&&entry.missing?'file missing or optional fallback':(loadStatus==='empty'?'items empty':'derived data unavailable'))
    };
  });
  return {
    timestamp:debugTimestamp(),
    total:status.total||DERIVED_JSON_KEYS.length,
    loaded:status.loaded||0,
    available:status.available||[],
    fallback:status.fallback||[],
    allExpectedLoaded:files.every(f=>f.status==='loaded'&&f.itemCount>0),
    files
  };
}

function buildDerivedJsonIntegrityDiagnostic(normalized){
  const files=(state.diagnostics&&state.diagnostics.derivedJson&&Array.isArray(state.diagnostics.derivedJson.files))?state.diagnostics.derivedJson.files:[];
  const loaded=files.filter(f=>f.status==='loaded');
  const schemaVersions=[...new Set(loaded.map(f=>norm(f.schemaVersion||'')).filter(Boolean))];
  const dataSetIds=[...new Set(loaded.map(f=>norm(f.dataSetId||'')).filter(Boolean))];
  const crawlerVersions=[...new Set(loaded.map(f=>norm(f.crawlerVersion||'')).filter(Boolean))];
  const details=DERIVED_JSON_KEYS.map(key=>{
    const entry=normalized&&normalized.items?normalized.items[key]:null;
    const meta=entry&&entry.meta&&typeof entry.meta==='object'?entry.meta:{};
    const sourceFiles=Array.isArray(meta.sourceFiles)?meta.sourceFiles:(Array.isArray(meta.source_files)?meta.source_files:[]);
    const sourceSha256=meta.sourceSha256||meta.source_sha256||meta.sourceHashes||meta.source_hashes||'';
    const hasSourceSha256=!!(typeof sourceSha256==='string'?norm(sourceSha256):sourceSha256&&typeof sourceSha256==='object'&&Object.keys(sourceSha256).length);
    const itemCount=entry&&Array.isArray(entry.items)?entry.items.length:0;
    const warnings=[];
    if(!entry||!entry.available)warnings.push('not-loaded');
    if(!norm(meta.schemaVersion||meta.schema_version||''))warnings.push('schemaVersion-missing');
    if(!norm(meta.dataSetId||meta.datasetId||meta.data_set_id||meta.sourceDataVersion||''))warnings.push('dataSetId-missing');
    if(!sourceFiles.length)warnings.push('sourceFiles-missing');
    if(!hasSourceSha256)warnings.push('sourceSha256-missing');
    if(itemCount===0)warnings.push('items-empty');
    return {key,file:(entry&&entry.file)||DERIVED_JSON_FILES[key]||key,itemCount,schemaVersion:meta.schemaVersion||meta.schema_version||'',dataSetId:meta.dataSetId||meta.datasetId||meta.data_set_id||meta.sourceDataVersion||'',crawlerVersion:meta.crawlerVersion||meta.crawler_version||'',sourceFileCount:sourceFiles.length,hasSourceSha256,warnings};
  });
  const warningDetails=details.filter(d=>d.warnings&&d.warnings.length).map(d=>({key:d.key,warnings:d.warnings}));
  const datasetCounts={generals:state.generals?.length||0,tactics:state.tactics?.length||0,skills:state.skills?.length||0,equipments:state.equipments?.length||0,statusEffects:state.statusEffects?.length||0,formations:state.formationMasters?.length||0,siegeWeapons:state.siegeWeapons?.length||0,ethnicArmaments:state.ethnicArmaments?.length||0,ethnicResearchSkills:state.ethnicResearchSkills?.length||0,fiveElements:state.fiveElements?.length||0,warhorses:state.warhorses?.length||0,warhorseSkills:state.warhorseSkills?.length||0};
  const expected={statusEffectRelations:datasetCounts.statusEffects,searchIndex:Object.values(datasetCounts).reduce((a,b)=>a+(Number(b)||0),0)};
  const countWarnings=[];
  const statusRel=details.find(d=>d.key==='statusEffectRelations');
  if(statusRel&&expected.statusEffectRelations&&statusRel.itemCount<expected.statusEffectRelations)countWarnings.push({key:'statusEffectRelations',itemCount:statusRel.itemCount,expectedAtLeast:expected.statusEffectRelations});
  const search=details.find(d=>d.key==='searchIndex');
  if(search&&expected.searchIndex&&search.itemCount<Math.floor(expected.searchIndex*0.5))countWarnings.push({key:'searchIndex',itemCount:search.itemCount,expectedRoughly:expected.searchIndex,policy:'rough lower-bound only'});
  return {timestamp:debugTimestamp(),policy:'診断のみ。ここでは派生JSON利用可否を変更しない。正式利用前の不足メタ・件数不一致を警告として可視化する。',loadedCount:loaded.length,total:DERIVED_JSON_KEYS.length,schemaVersions,dataSetIds,crawlerVersions,consistentSchemaVersion:schemaVersions.length<=1,consistentDataSetId:dataSetIds.length<=1,details,warningCount:warningDetails.length+countWarnings.length,warningDetails,countWarnings,datasetCounts};
}
function updateDerivedJsonIntegrityDiagnostic(normalized){
  try{const diagnostic=buildDerivedJsonIntegrityDiagnostic(normalized||{items:state.derivedData,status:state.derivedDataStatus});state.diagnostics.derivedJsonIntegrity=diagnostic;debugLog('derivedJson:integrity',diagnostic);return diagnostic;}catch(err){const diagnostic={timestamp:debugTimestamp(),error:err?.message||String(err),policy:'integrity diagnostic failed; application behavior unchanged'};state.diagnostics.derivedJsonIntegrity=diagnostic;debugLog('derivedJson:integrity-error',diagnostic);return diagnostic;}
}
function applyDerivedJsonBundle(data){
  const normalized=normalizeDerivedJsonBundle(data);
  state.derivedData=normalized.items;
  state.derivedDataStatus=normalized.status;
  const diagnostic=buildDerivedJsonDiagnostic(normalized);
  state.diagnostics.derivedJson=diagnostic;
  updateDerivedJsonIntegrityDiagnostic(normalized);
  debugStartup('derived json status',diagnostic);
  debugLog('derivedJson:status',normalized.status);
  debugLog('derivedJson:diagnostic',diagnostic);
  return normalized;
}

async function applyLoadedData(data){debugLog('applyLoadedData:start');try{logStartupHelperAvailability('applyLoadedData:start');setLoadingState(true,{title:'JSONを読み込んでいます…',detail:'データを正規化しています。',current:0,total:100});state.rawCounts=data.meta?.source_counts||{};await nextFrame();const generalRaw=unwrapHadouItems(data.generals);const equipmentRaw=unwrapHadouItems(data.equipments);const skillRaw=unwrapHadouItems(data.skills);const statusEffectRaw=unwrapHadouItems(data.statusEffects);const siegeWeaponRaw=unwrapHadouItems(data.siegeWeapons);const ethnicArmamentRaw=unwrapHadouItems(data.ethnicArmaments);const ethnicResearchSkillRaw=unwrapHadouItems(data.ethnicResearchSkills);const formationRaw=unwrapHadouItems(data.formations);const fiveElementRaw=unwrapHadouItems(data.fiveElements);const warhorseRaw=unwrapHadouItems(data.warhorses);const warhorseSkillRaw=unwrapHadouItems(data.warhorseSkills);const statusEffectRawCount=statusEffectRaw.length;applyDerivedJsonBundle(data);invalidateTypeSearchResultCache('apply-loaded-data');updateStartupDiagnosticSnapshot({generalRawCount:generalRaw.length,equipmentRawCount:equipmentRaw.length,skillRawCount:skillRaw.length,statusEffectRawCount,siegeWeaponRawCount:siegeWeaponRaw.length,ethnicArmamentRawCount:ethnicArmamentRaw.length,ethnicResearchSkillRawCount:ethnicResearchSkillRaw.length,formationRawCount:formationRaw.length,fiveElementRawCount:fiveElementRaw.length,warhorseRawCount:warhorseRaw.length,warhorseSkillRawCount:warhorseSkillRaw.length});debugStartup('startup raw counts',{generalRaw:generalRaw.length,equipmentRaw:equipmentRaw.length,skillRaw:skillRaw.length,statusEffectsRaw:statusEffectRawCount,siegeWeaponsRaw:siegeWeaponRaw.length,ethnicArmamentsRaw:ethnicArmamentRaw.length,ethnicResearchSkillsRaw:ethnicResearchSkillRaw.length,formationsRaw:formationRaw.length,fiveElementsRaw:fiveElementRaw.length,warhorsesRaw:warhorseRaw.length,warhorseSkillsRaw:warhorseSkillRaw.length});debugLog('startup raw counts',{generalRawCount:generalRaw.length,equipmentRawCount:equipmentRaw.length,skillRawCount:skillRaw.length,statusEffectRawCount,siegeWeaponRawCount:siegeWeaponRaw.length,ethnicArmamentRawCount:ethnicArmamentRaw.length,ethnicResearchSkillRawCount:ethnicResearchSkillRaw.length,formationRawCount:formationRaw.length,fiveElementRawCount:fiveElementRaw.length,warhorseRawCount:warhorseRaw.length,warhorseSkillRawCount:warhorseSkillRaw.length});state.generals=normalizeLoadedDataset('generals',generalRaw);buildEthnicGeneralIndex();setLoadingState(true,{title:'JSONを読み込んでいます…',detail:'武将データを整形しています。',current:10,total:100});await nextFrame();state.tactics=buildDerivedTacticDataset(generalRaw);setLoadingState(true,{title:'JSONを読み込んでいます…',detail:'武将データから戦法を生成しています。',current:20,total:100});await nextFrame();state.ethnicResearchSkills=normalizeLoadedEthnicResearchSkills(ethnicResearchSkillRaw);state.fiveElements=normalizeLoadedFiveElements(fiveElementRaw);state.warhorses=normalizeLoadedWarhorses(warhorseRaw);state.warhorseSkills=normalizeLoadedWarhorseSkills(warhorseSkillRaw);state.skills=mergeEntriesByName([...buildDerivedSkillDataset(generalRaw,equipmentRaw,skillRaw),...state.ethnicResearchSkills,...fiveElementSkillDatasetItems()]);debugLog('ethnicResearchSkills:loaded',{count:state.ethnicResearchSkills.length,names:state.ethnicResearchSkills.map(x=>x.name)});updateStartupDiagnosticSnapshot({...state.diagnostics.startup,derivedGeneralCount:state.generals.length,derivedTacticCount:state.tactics.length,derivedSkillCount:state.skills.length,hasBushoInSkills:state.skills.some(item=>norm(item?.name||'')==='武聖'),fiveElementSkillCount:state.fiveElements.length,warhorseCount:state.warhorses.length,warhorseSkillCount:state.warhorseSkills.length});debugStartup('startup derived counts',{generals:state.generals.length,tactics:state.tactics.length,skills:state.skills.length,hasBushoInSkills:state.skills.some(item=>norm(item?.name||'')==='武聖'),fiveElementSkillCount:state.fiveElements.length,warhorseCount:state.warhorses.length,warhorseSkillCount:state.warhorseSkills.length});debugLog('startup derived counts',{derivedGeneralCount:state.generals.length,derivedTacticCount:state.tactics.length,derivedSkillCount:state.skills.length,hasBushoInSkills:state.skills.some(item=>norm(item?.name||'')==='武聖'),fiveElementSkillCount:state.fiveElements.length,warhorseCount:state.warhorses.length,warhorseSkillCount:state.warhorseSkills.length});buildAdvisorSkillDatasetDiagnostic();setLoadingState(true,{title:'JSONを読み込んでいます…',detail:'武将・装備データから技能を生成し、不足分を技能データで補完しています。',current:30,total:100});await nextFrame();state.equipments=normalizeLoadedDataset('equipments',equipmentRaw);setLoadingState(true,{title:'JSONを読み込んでいます…',detail:'装備データを整形しています。',current:40,total:100});await nextFrame();state.statusEffects=normalizeLoadedStatusEffects({items:statusEffectRaw,meta:getHadouMeta(data.statusEffects)});buildStatusEffectMetaIndex();refreshQuickStatusEffectOptions();refreshTypeSearchOptions();state.siegeWeapons=normalizeLoadedDataset('siegeWeapons',siegeWeaponRaw);state.ethnicArmaments=normalizeLoadedDataset('ethnicArmaments',ethnicArmamentRaw);state.formationMasters=normalizeLoadedDataset('formations',formationRaw);updateDerivedJsonIntegrityDiagnostic({items:state.derivedData,status:state.derivedDataStatus});debugStartup('startup final dataset counts',{generals:state.generals.length,tactics:state.tactics.length,skills:state.skills.length,equipments:state.equipments.length,statusEffects:state.statusEffects.length,siegeWeapons:state.siegeWeapons.length,ethnicArmaments:state.ethnicArmaments.length,ethnicResearchSkills:state.ethnicResearchSkills.length,formations:state.formationMasters.length,fiveElements:state.fiveElements.length,warhorses:state.warhorses.length,warhorseSkills:state.warhorseSkills.length});debugLog('statusEffects normalized',{count:state.statusEffects.length,metaCount:getHadouMeta(data.statusEffects)?.count||statusEffectRawCount});debugLog('derived dataset summary',{generalsSourceCount:generalRaw.length,equipmentsSourceCount:equipmentRaw.length,skillsSourceCount:skillRaw.length,tacticsCount:state.tactics.length,skillsCount:state.skills.length,siegeWeaponsCount:state.siegeWeapons.length,ethnicArmamentsCount:state.ethnicArmaments.length,formationsCount:state.formationMasters.length,warhorsesCount:state.warhorses.length,warhorseSkillsCount:state.warhorseSkills.length});setLoadingState(true,{title:'JSONを読み込んでいます…',detail:'状態変化データを整形しています。',current:45,total:100});await nextFrame();const allItems=[...state.generals,...state.tactics,...state.skills,...state.equipments,...state.statusEffects,...state.siegeWeapons,...state.ethnicArmaments,...state.ethnicResearchSkills,...state.formationMasters,...state.fiveElements,...state.warhorses,...state.warhorseSkills];setLoadingState(true,{title:'検索索引を作成中…',detail:'派生検索インデックスを適用しています。',current:52,total:100});await nextFrame();applyDerivedSearchIndexToItems(allItems);applyDerivedResultCardIndexToItems(allItems);await buildLookupIndexes();buildSearchTagIndex();buildDetailLinkCandidates();rebuildSavedModeIndex();debugLog('95% stage: start UI init',{counts:{generals:state.generals.length,tactics:state.tactics.length,skills:state.skills.length,equipments:state.equipments.length,statusEffects:state.statusEffects.length,siegeWeapons:state.siegeWeapons.length,ethnicArmaments:state.ethnicArmaments.length,ethnicResearchSkills:state.ethnicResearchSkills.length,formations:state.formationMasters.length,warhorses:state.warhorses.length,warhorseSkills:state.warhorseSkills.length},savedMode:state.viewMode,currentSaveId:state.saveData?.currentSaveId||'',savedSkillNameSetSize:state.savedModeIndex?.savedSkillNameSet?.size||0,savedStatusEffectCount:state.savedModeIndex?.statusEffectNames?.size||0,activeCategories:state.activeCategories});setLoadingState(true,{title:'画面を描画しています…',detail:'一覧と詳細を初期化しています。',current:95,total:100});await nextFrame();debugLog('95% stage: before updateCountStatus');updateCountStatus();debugLog('95% stage: after updateCountStatus');debugLog('95% stage: before renderSaveControls');renderSaveControls();debugLog('95% stage: after renderSaveControls');debugLog('95% stage: before renderSearchResults');renderSearchResults();debugLog('95% stage: after renderSearchResults',{resultCountText:els.resultMeta?.textContent||'',resultCount:state.lastResultRows?.length||0});debugLog('95% stage: before renderDetail');renderDetail();debugLog('95% stage: after renderDetail',{selectedItem:state.selectedItem?norm(state.selectedItem.name||state.selectedItem.title||''):''});pushOperationHistory('initial-load');debugLog('95% stage: UI init completed',{validation:'manual-only'});scheduleSearchCachePrewarm();setLoadingState(true,{title:'完了',detail:'ロードが完了しました。',current:100,total:100});await nextFrame();hideLoadingState();debugLog('applyLoadedData:end');maybeStartInitialGuidedTour('apply-loaded-data-complete');}catch(err){debugLog('applyLoadedData:error around 95%',{message:err?.message||String(err),stack:err?.stack||''});throw err;}}

async function saveMirrorOpen(){return await new Promise((resolve,reject)=>{const req=indexedDB.open(SAVE_MIRROR_DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(SAVE_MIRROR_STORE))db.createObjectStore(SAVE_MIRROR_STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Save mirror DB open failed'));});}
async function saveMirrorGet(){const db=await saveMirrorOpen();return await new Promise((resolve,reject)=>{const tx=db.transaction(SAVE_MIRROR_STORE,'readonly');const store=tx.objectStore(SAVE_MIRROR_STORE);const req=store.get(SAVE_MIRROR_KEY);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Save mirror read failed'));tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error||new Error('Save mirror transaction failed'));});}
async function saveMirrorSet(data,context=''){const payload={savedAt:new Date().toISOString(),data:sanitizeSaveDataStructure(data)};const db=await saveMirrorOpen();return await new Promise((resolve,reject)=>{const tx=db.transaction(SAVE_MIRROR_STORE,'readwrite');const store=tx.objectStore(SAVE_MIRROR_STORE);store.put(payload,SAVE_MIRROR_KEY);tx.oncomplete=()=>{db.close();debugLog('saveMirror:set',{context,saveCount:payload.data.saves.length,currentSaveId:payload.data.currentSaveId,searchHistoryCount:payload.data.searchHistory.length});resolve();};tx.onerror=()=>reject(tx.error||new Error('Save mirror write failed'));});}
async function recoverSaveDataFromMirrorIfNeeded(){try{const localHasSave=hasUsableSaveData(state.saveData);const mirror=await saveMirrorGet();const mirrorData=sanitizeSaveDataStructure(mirror?.data||{});debugLog('saveMirror:read',{localHasSave,mirrorSavedAt:mirror?.savedAt||'',mirrorSaveCount:mirrorData.saves.length,mirrorCurrentSaveId:mirrorData.currentSaveId,mirrorSearchHistoryCount:mirrorData.searchHistory.length});if(!localHasSave&&hasUsableSaveData(mirrorData)){state.saveData=mirrorData;if(mirrorData.searchHistory.length)state.searchHistory=sanitizeSearchHistoryList(mirrorData.searchHistory);debugLog('saveMirror:recovered',{saveCount:state.saveData.saves.length,currentSaveId:state.saveData.currentSaveId,searchHistoryCount:state.searchHistory.length});persistSearchHistory();persistSaveData();return true;}return false;}catch(err){debugLog('saveMirror:read-error',{message:err?.message||String(err)});return false;}}
// FIX[HADO-2.9.0.34-LATEST-JSON-REQUIRED]: 旧JSON互換フォールバックを廃止。現行機能で利用するJSONは全件必須。
const EXTERNAL_JSON_FILES={generals:'hadou_generals.json',skills:'hadou_skills.json',equipments:'hadou_equipments.json',statusEffects:'hadou_status_effects.json',siegeWeapons:'hadou_siege_weapons.json',ethnicArmaments:'hadou_ethnic_armaments.json',meta:'hadou_meta.json',ethnicResearchSkills:'hadou_ethnic_research_skills.json',formations:'hadou_formations.json',fiveElements:'hadou_five_elements.json',warhorses:'hadou_warhorses.json',warhorseSkills:'hadou_warhorse_skills.json',statusEffectRelations:'hadou_status_effect_relations.json',skillOwnerIndex:'hadou_skill_owner_index.json',searchIndex:'hadou_search_index.json',parameterSummaryIndex:'hadou_parameter_summary_index.json',resultCardIndex:'hadou_result_card_index.json',tagIndex:'hadou_tag_index.json',statusEffectMetaIndex:'hadou_status_effect_meta_index.json',statusEffectGroupOwnerIndex:'hadou_status_effect_group_owner_index.json',relatedLinkIndex:'hadou_related_link_index.json',equipmentSkillStageIndex:'hadou_equipment_skill_stage_index.json',tacticAttackIndex:'hadou_tactic_attack_index.json',formationCandidateIndex:'hadou_formation_candidate_index.json',effectConditionBlocks:'hadou_effect_condition_blocks.json',typeSearchFeatureIndex:'hadou_type_search_feature_index.json',typeSearchPresets:'hadou_type_search_presets.json',typeSearchRegressionCases:'hadou_type_search_regression_cases.json'};
const EXTERNAL_JSON_OPTIONAL_FILES={};
const DERIVED_JSON_KEYS=['statusEffectRelations','skillOwnerIndex','searchIndex','parameterSummaryIndex','resultCardIndex','tagIndex','statusEffectMetaIndex','statusEffectGroupOwnerIndex','relatedLinkIndex','equipmentSkillStageIndex','tacticAttackIndex','formationCandidateIndex','effectConditionBlocks','typeSearchFeatureIndex','typeSearchPresets','typeSearchRegressionCases'];
const DERIVED_JSON_FILES={statusEffectRelations:'hadou_status_effect_relations.json',skillOwnerIndex:'hadou_skill_owner_index.json',searchIndex:'hadou_search_index.json',parameterSummaryIndex:'hadou_parameter_summary_index.json',resultCardIndex:'hadou_result_card_index.json',tagIndex:'hadou_tag_index.json',statusEffectMetaIndex:'hadou_status_effect_meta_index.json',statusEffectGroupOwnerIndex:'hadou_status_effect_group_owner_index.json',relatedLinkIndex:'hadou_related_link_index.json',equipmentSkillStageIndex:'hadou_equipment_skill_stage_index.json',tacticAttackIndex:'hadou_tactic_attack_index.json',formationCandidateIndex:'hadou_formation_candidate_index.json',effectConditionBlocks:'hadou_effect_condition_blocks.json',typeSearchFeatureIndex:'hadou_type_search_feature_index.json',typeSearchPresets:'hadou_type_search_presets.json',typeSearchRegressionCases:'hadou_type_search_regression_cases.json'};
function isDerivedJsonKey(key){return DERIVED_JSON_KEYS.includes(key);}
function emptyOptionalJsonBundle(key){if(isDerivedJsonKey(key))return {items:[],meta:{optional:true,derived:true,count:0,fallback:true,schemaVersion:'1.0'}};return (key==='ethnicResearchSkills'||key==='formations'||key==='fiveElements'||key==='warhorses'||key==='warhorseSkills')?{items:[],meta:{optional:true,count:0}}:{items:[],meta:{optional:true}};}
const MIN_REQUIRED_DERIVED_CRAWLER_VERSION='1.0.5.23';
function compareDottedVersion(a,b){const aa=norm(a).split('.').map(v=>Number(v)||0);const bb=norm(b).split('.').map(v=>Number(v)||0);const len=Math.max(aa.length,bb.length);for(let i=0;i<len;i++){const d=(aa[i]||0)-(bb[i]||0);if(d)return d;}return 0;}
function validateRequiredDerivedJsonBundle(data){
  const problems=[];const metas=[];
  for(const key of DERIVED_JSON_KEYS){
    const file=DERIVED_JSON_FILES[key]||key;const raw=data&&data[key];const items=unwrapDerivedJsonItems(raw);const meta=getDerivedJsonMeta(raw);
    if(!raw){problems.push(`${file}: ファイル不足`);continue;}
    if(!items.length)problems.push(`${file}: itemsが空です`);
    const schema=norm(meta.schemaVersion||meta.schema_version||'');const dataSetId=norm(meta.dataSetId||meta.datasetId||meta.data_set_id||'');const crawler=norm(meta.crawlerVersion||meta.crawler_version||'');
    const sourceFiles=Array.isArray(meta.sourceFiles)?meta.sourceFiles:(Array.isArray(meta.source_files)?meta.source_files:[]);const sourceSha=meta.sourceSha256||meta.source_sha256||meta.sourceHashes||meta.source_hashes||'';
    if(!schema)problems.push(`${file}: schemaVersion不足`);
    if(!dataSetId)problems.push(`${file}: dataSetId不足`);
    if(!crawler)problems.push(`${file}: crawlerVersion不足`);
    else if(compareDottedVersion(crawler,MIN_REQUIRED_DERIVED_CRAWLER_VERSION)<0)problems.push(`${file}: crawlerVersion ${crawler} は旧版です（必要 ${MIN_REQUIRED_DERIVED_CRAWLER_VERSION} 以上）`);
    if(!sourceFiles.length)problems.push(`${file}: sourceFiles不足`);
    if(!(typeof sourceSha==='string'?norm(sourceSha):sourceSha&&typeof sourceSha==='object'&&Object.keys(sourceSha).length))problems.push(`${file}: sourceSha256不足`);
    metas.push({file,schema,dataSetId,crawler});
  }
  const unique=(key)=>[...new Set(metas.map(v=>norm(v[key]||'')).filter(Boolean))];
  const schemaVersions=unique('schema'),dataSetIds=unique('dataSetId'),crawlerVersions=unique('crawler');
  if(schemaVersions.length!==1)problems.push(`派生JSON schemaVersion不一致: ${schemaVersions.join(' / ')||'なし'}`);
  if(dataSetIds.length!==1)problems.push(`派生JSON dataSetId不一致: ${dataSetIds.join(' / ')||'なし'}`);
  if(crawlerVersions.length!==1)problems.push(`派生JSON crawlerVersion不一致: ${crawlerVersions.join(' / ')||'なし'}`);
  const related=data&&data.relatedLinkIndex;const qa=getDerivedJsonMeta(related).qualityAudit||related?.qualityAudit||{};
  if(qa?.legacyEquivalence?.ok!==true)problems.push('hadou_related_link_index.json: legacyEquivalence監査NG');
  if(qa?.representativeRegression?.ok!==true)problems.push('hadou_related_link_index.json: representativeRegression監査NG');
  if(qa?.annotationLeakAudit?.ok!==true)problems.push('hadou_related_link_index.json: annotationLeakAudit監査NG');
  if(qa?.fullGeneralStatusEffectAudit?.ok!==true||Number(qa?.fullGeneralStatusEffectAudit?.missingAfterTotal||0)!==0||Number(qa?.fullGeneralStatusEffectAudit?.ngAfterGeneralCount||0)!==0)problems.push('hadou_related_link_index.json: fullGeneralStatusEffectAudit監査NG');
  if(qa?.selfCountermeasureFullAudit?.ok!==true)problems.push('hadou_related_link_index.json: selfCountermeasureFullAudit監査NG');
  const risk=qa?.sourceRisk||{};if(Number(risk.parameterSummaryStatusCount||0)||Number(risk.textScanStatusCount||0)||Number(risk.representativeCorrectionCount||0)||Number(risk.fullGeneralStatusMissingAfterCount||0))problems.push('hadou_related_link_index.json: sourceRisk監査NG');
  const result={ok:problems.length===0,minCrawlerVersion:MIN_REQUIRED_DERIVED_CRAWLER_VERSION,schemaVersions,dataSetIds,crawlerVersions,problems};
  if(!result.ok)throw new Error('読み込んだJSONは旧版または不整合のため使用できません。最新クローラーで生成したJSON一式を選択してください。\n- '+problems.join('\n- '));
  return result;
}
function getCanonicalDerivedStatusEffectMetaByName(name){
  const target=norm(name||'');if(!target)return null;const bucket=state?.derivedData?.statusEffectMetaIndex;const items=bucket&&bucket.available&&Array.isArray(bucket.items)?bucket.items:[];
  return items.find(entry=>[entry?.name,entry?.displayName,entry?.rawName,...(Array.isArray(entry?.aliases)?entry.aliases:[])].map(norm).filter(Boolean).includes(target))||null;
}
const DIR_HANDLE_DB_NAME='hado_library_local_json_v1_1';
const DIR_HANDLE_STORE='handles';
const DIR_HANDLE_KEY='json_dir';
const JSON_CACHE_DB_NAME='hado_library_json_cache_v1_1';
const JSON_CACHE_STORE='json_cache';
const JSON_CACHE_KEY='bundle';
async function idbOpen(){return await new Promise((resolve,reject)=>{const req=indexedDB.open(DIR_HANDLE_DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DIR_HANDLE_STORE))db.createObjectStore(DIR_HANDLE_STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));});}
async function idbGet(key){const db=await idbOpen();return await new Promise((resolve,reject)=>{const tx=db.transaction(DIR_HANDLE_STORE,'readonly');const store=tx.objectStore(DIR_HANDLE_STORE);const req=store.get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('IndexedDB read failed'));tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error||new Error('IndexedDB transaction failed'));});}
async function idbSet(key,value){const db=await idbOpen();return await new Promise((resolve,reject)=>{const tx=db.transaction(DIR_HANDLE_STORE,'readwrite');const store=tx.objectStore(DIR_HANDLE_STORE);const req=store.put(value,key);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error||new Error('IndexedDB write failed'));tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error||new Error('IndexedDB transaction failed'));});}
async function getRememberedDirectoryHandle(){try{return await idbGet(DIR_HANDLE_KEY);}catch{return null;}}
async function setRememberedDirectoryHandle(handle){try{await idbSet(DIR_HANDLE_KEY,handle);}catch(err){console.warn('directory handle save failed',err);}}

async function jsonCacheOpen(){return await new Promise((resolve,reject)=>{const req=indexedDB.open(JSON_CACHE_DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(JSON_CACHE_STORE))db.createObjectStore(JSON_CACHE_STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('JSON cache DB open failed'));});}
async function jsonCacheGet(key){const db=await jsonCacheOpen();return await new Promise((resolve,reject)=>{const tx=db.transaction(JSON_CACHE_STORE,'readonly');const store=tx.objectStore(JSON_CACHE_STORE);const req=store.get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('JSON cache read failed'));tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error||new Error('JSON cache transaction failed'));});}
async function jsonCacheSet(key,value){const db=await jsonCacheOpen();return await new Promise((resolve,reject)=>{const tx=db.transaction(JSON_CACHE_STORE,'readwrite');const store=tx.objectStore(JSON_CACHE_STORE);store.put(value,key);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error||new Error('JSON cache write failed'));});}
async function jsonCacheDelete(key){const db=await jsonCacheOpen();return await new Promise((resolve,reject)=>{const tx=db.transaction(JSON_CACHE_STORE,'readwrite');const store=tx.objectStore(JSON_CACHE_STORE);store.delete(key);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error||new Error('JSON cache delete failed'));});}
async function getCachedJsonBundle(){try{const cached=await jsonCacheGet(JSON_CACHE_KEY);if(cached&&cached.data&&typeof cached.data==='object')return cached;return null;}catch{return null;}}
async function setCachedJsonBundle(data,source='manual',meta={}){const savedAt=new Date().toISOString();const fileManifest=meta&&meta.fileManifest&&typeof meta.fileManifest==='object'?meta.fileManifest:null;const bundleFingerprint=fileManifest?buildJsonManifestFingerprint(fileManifest):'';const summary=extractBundleGenerationSummary(data);await jsonCacheSet(JSON_CACHE_KEY,{savedAt,source,data,fileManifest,bundleFingerprint,sourceDataSetId:summary.dataSetId,sourceCrawlerVersion:summary.crawlerVersion});debugLog('jsonCache:set',{savedAt,source,bundleFingerprint,fileCount:fileManifest?Object.keys(fileManifest).length:0,sourceDataSetId:summary.dataSetId,sourceCrawlerVersion:summary.crawlerVersion});}
function extractBundleGenerationSummary(data){const derived=(data&&data.relatedLinkIndex)||null;const meta=getHadouMeta(derived)||derived?.meta||{};return {dataSetId:norm(meta?.dataSetId||''),crawlerVersion:norm(meta?.crawlerVersion||'')};}
function buildJsonManifestFingerprint(manifest){const rows=Object.entries(manifest||{}).sort(([a],[b])=>a.localeCompare(b,'ja')).map(([name,info])=>`${name}:${Number(info?.lastModified)||0}:${Number(info?.size)||0}`);return rows.join('|');}
function compareJsonManifests(current,cached){const currentFp=buildJsonManifestFingerprint(current);const cachedFp=buildJsonManifestFingerprint(cached);const allNames=uniq([...Object.keys(current||{}),...Object.keys(cached||{})]);const changes=[];let hasNewer=false;for(const name of allNames){const now=current?.[name]||null;const prev=cached?.[name]||null;if(!now||!prev){changes.push({name,kind:now?'added':'missing',current:now||null,cached:prev||null});if(now)hasNewer=true;continue;}const nowModified=Number(now.lastModified)||0;const prevModified=Number(prev.lastModified)||0;const nowSize=Number(now.size)||0;const prevSize=Number(prev.size)||0;if(nowModified!==prevModified||nowSize!==prevSize){changes.push({name,kind:nowModified>prevModified?'newer':(nowModified<prevModified?'older':'size-changed'),current:now,cached:prev});if(nowModified>prevModified||(!prevModified&&nowModified)||nowSize!==prevSize)hasNewer=true;}}return {changed:currentFp!==cachedFp,hasNewer,currentFingerprint:currentFp,cachedFingerprint:cachedFp,changes};}
async function collectDirectoryJsonManifest(handle){if(!handle)throw new Error('JSONフォルダハンドルがありません');const manifest={};for(const fileName of [...Object.values(EXTERNAL_JSON_FILES),...Object.values(EXTERNAL_JSON_OPTIONAL_FILES||{})]){try{const fh=await handle.getFileHandle(fileName,{create:false});const file=await fh.getFile();manifest[fileName]={lastModified:Number(file.lastModified)||0,size:Number(file.size)||0};}catch(err){if(Object.values(EXTERNAL_JSON_FILES).includes(fileName))throw new Error(`${fileName} が見つかりません`);}}return manifest;}
function collectSelectedJsonManifest(files){const manifest={};for(const file of Array.from(files||[])){if(!file?.name)continue;manifest[file.name]={lastModified:Number(file.lastModified)||0,size:Number(file.size)||0};}return manifest;}
function makeStartupDataLoadError(reason,options={}){const err=new Error(options.message||'データの読み込みが必要です');err.needsDataLoadScreen=true;err.dataLoadReason=reason;err.cachedBundle=options.cachedBundle||null;err.directoryManifest=options.directoryManifest||null;err.manifestComparison=options.manifestComparison||null;return err;}
function makeLatestJsonReloadError(reason,err,options={}){const detail=err?.message||String(err||'');return makeStartupDataLoadError(reason,{...options,message:`読み込んだJSONは旧版・欠損・不整合のため使用できません。最新クローラーで生成したJSON一式を選択してください。${detail?`\n${detail}`:''}`});}
function formatIsoForDisplay(value){const text=norm(value);if(!text)return '未記録';try{return new Date(text).toLocaleString('ja-JP');}catch{return text;}}
function summarizeManifestComparison(comparison){if(!comparison)return '';const rows=(comparison.changes||[]).slice(0,12).map(change=>`- ${change.name}: ${change.kind}`);if((comparison.changes||[]).length>12)rows.push(`- ほか ${(comparison.changes||[]).length-12} 件`);return rows.join('\n');}
function recordStartupDataDecision(detail={}){const diagnostic={timestamp:debugTimestamp(),protocol:location.protocol,...detail};state.diagnostics.startupDataAccess=diagnostic;debugStartup('startup data access',diagnostic);debugLog('startupDataAccess',diagnostic);return diagnostic;}
async function clearCachedJsonBundle(){try{await jsonCacheDelete(JSON_CACHE_KEY);}catch{}}
function validateTypeSearchFoundationDiagnostic(data){const problems=[];const feature=data&&data.typeSearchFeatureIndex||{};const presets=data&&data.typeSearchPresets||{};const regressions=data&&data.typeSearchRegressionCases||{};const groups=data&&data.statusEffectGroupOwnerIndex||{};const featureItems=unwrapDerivedJsonItems(feature);const presetItems=unwrapDerivedJsonItems(presets);const regressionItems=unwrapDerivedJsonItems(regressions);const groupItems=unwrapDerivedJsonItems(groups);const categoryCounts=feature?.qualityAudit?.categoryCounts||{};const expected={generals:Number(feature?.sourceCounts?.generals||0),equipments:Number(feature?.sourceCounts?.equipments||0),siegeWeapons:Number(feature?.sourceCounts?.siegeWeapons||0),warhorseSkills:Number(feature?.sourceCounts?.warhorseSkills||0)};for(const [key,count] of Object.entries(expected)){if(Number(categoryCounts[key]||0)!==count)problems.push(`hadou_type_search_feature_index.json: ${key}件数 ${categoryCounts[key]||0}（期待 ${count}）`);}if(!featureItems.length)problems.push('hadou_type_search_feature_index.json: itemsが空です');if(!presetItems.length)problems.push('hadou_type_search_presets.json: itemsが空です');const presetConditionRows=presetItems.flatMap(v=>Array.isArray(v?.conditions)?v.conditions:[]);const allowedImportance=new Set(['core','recommended','support']);if(presetItems.some(v=>!Array.isArray(v?.conditions)||!v.conditions.length))problems.push('hadou_type_search_presets.json: conditions未定義の型があります');if(presetConditionRows.some(v=>!norm(v?.featureId||'')||!norm(v?.canonicalFeatureId||'')||!allowedImportance.has(norm(v?.importance||''))))problems.push('hadou_type_search_presets.json: 条件ID・正規IDまたは重要度が不正です');if(!regressionItems.length)problems.push('hadou_type_search_regression_cases.json: itemsが空です');const failedRegression=regressionItems.filter(v=>v&&v.ok!==true);if(failedRegression.length)problems.push('hadou_type_search_regression_cases.json: 回帰NG '+failedRegression.map(v=>v.caseId).join(' / '));for(const g of groupItems){if(Number(g?.ownerRelationCount||0)<=0)problems.push(`hadou_status_effect_group_owner_index.json: ${g?.groupKey||'unknown'} ownerRelationCountが0です`);if(Number(g?.distinctOwnerCount||0)<=0)problems.push(`hadou_status_effect_group_owner_index.json: ${g?.groupKey||'unknown'} distinctOwnerCountが0です`);}const result={timestamp:debugTimestamp(),ok:problems.length===0,featureItemCount:featureItems.length,presetCount:presetItems.length,regressionCaseCount:regressionItems.length,presetConditionCount:presetConditionRows.length,presetImportanceCounts:{core:presetConditionRows.filter(v=>v.importance==='core').length,recommended:presetConditionRows.filter(v=>v.importance==='recommended').length,support:presetConditionRows.filter(v=>v.importance==='support').length},categoryCounts,problems,policy:'HADO-2.9.3.0: 既存状態変化JSON再利用・補助索引4カテゴリ網羅・JSON正本プリセット重要度・回帰ケース・状態変化グループ件数を診断する。'};state.diagnostics.typeSearchFoundation=result;debugStartup('type search foundation',result);debugLog('typeSearchFoundation',result);if(!result.ok)throw new Error('型検索基盤JSON監査NGです。\n- '+problems.join('\n- '));return result;}

// FEATURE[HADO-2.9.5.0-TYPE-SEARCH-RELEASE-GATE]: 型検索の正式化。JSON正本の解決不能・重複・カテゴリ欠落・回帰欠落を起動時と手動検証時にCritical監査する。
const TYPE_SEARCH_REQUIRED_REGRESSION_CASE_IDS=['group-count-recalculated','target-category-coverage','lr-simashi-no-reverse-flow','lr-kayuu-countermeasures','lr-dongzhuo-bomb-foundation','siege-weapon-anti-object','warhorse-skill-attack-speed','preset-importance-schema','preset-condition-resolvable','preset-score-priority','lr-simayi-no-false-anti-object-buff','attack-speed-preset-exists','normal-attack-expansion-preset-exists'];
function validateTypeSearchReleaseReadinessDiagnostic(data,options={}){
  const problems=[];const warnings=[];
  const feature=data&&data.typeSearchFeatureIndex||{};const presets=data&&data.typeSearchPresets||{};const regressions=data&&data.typeSearchRegressionCases||{};
  const featureItems=unwrapDerivedJsonItems(feature);const presetItems=unwrapDerivedJsonItems(presets);const regressionItems=unwrapDerivedJsonItems(regressions);
  const allowedCategories=[...TYPE_SEARCH_ALLOWED_CATEGORIES];const actualCategoryCounts={};const unexpectedCategories=[];
  const statusCatalog=new Set();const featureCatalog=new Set();
  featureItems.forEach(item=>{const category=norm(item?.category||'');actualCategoryCounts[category]=(actualCategoryCounts[category]||0)+1;if(category&&!allowedCategories.includes(category))unexpectedCategories.push(category);(Array.isArray(item?.statusEffectRefs)?item.statusEffectRefs:[]).forEach(ref=>{const id=norm(ref?.featureId||'');if(id)statusCatalog.add(id);});(Array.isArray(item?.typeFeatures)?item.typeFeatures:[]).forEach(ref=>{const id=norm(ref?.featureId||'');if(id)featureCatalog.add(id);});});
  const sourceCounts=feature?.sourceCounts||{};for(const category of allowedCategories){const actual=Number(actualCategoryCounts[category]||0);const expected=Number(sourceCounts?.[category]||0);if(actual<=0)problems.push(`hadou_type_search_feature_index.json: ${category} が0件です`);if(expected>0&&actual!==expected)problems.push(`hadou_type_search_feature_index.json: ${category}件数 ${actual}（期待 ${expected}）`);}if(unexpectedCategories.length)problems.push('hadou_type_search_feature_index.json: 対象外カテゴリ混入 '+uniq(unexpectedCategories).join(' / '));
  const presetIds=presetItems.map(v=>norm(v?.typeId||'')).filter(Boolean);const presetNames=presetItems.map(v=>norm(v?.typeName||'')).filter(Boolean);const duplicatePresetIds=presetIds.filter((v,i,a)=>a.indexOf(v)!==i);const duplicatePresetNames=presetNames.filter((v,i,a)=>a.indexOf(v)!==i);if(duplicatePresetIds.length)problems.push('hadou_type_search_presets.json: typeId重複 '+uniq(duplicatePresetIds).join(' / '));if(duplicatePresetNames.length)problems.push('hadou_type_search_presets.json: typeName重複 '+uniq(duplicatePresetNames).join(' / '));
  const unresolved=[];const presetSummaries=[];let presetConditionCount=0;let canonicalConditionCount=0;
  for(const preset of presetItems){const typeId=norm(preset?.typeId||'');const typeName=norm(preset?.typeName||'');const conditions=Array.isArray(preset?.conditions)?preset.conditions:[];presetConditionCount+=conditions.length;if(!typeId)problems.push('hadou_type_search_presets.json: typeId不足');if(!typeName)problems.push(`hadou_type_search_presets.json: ${typeId||'unknown'} typeName不足`);if(!conditions.length)problems.push(`hadou_type_search_presets.json: ${typeId||typeName||'unknown'} conditions不足`);
    const exactSeen=new Set();const canonicalMap=new Map();const importanceCounts={core:0,recommended:0,support:0};
    for(const condition of conditions){const featureId=norm(condition?.featureId||'');const canonicalFeatureId=norm(condition?.canonicalFeatureId||'');const conditionType=norm(condition?.conditionType||'');const importance=norm(condition?.importance||'');const exactKey=`${conditionType}@@${featureId}`;if(exactSeen.has(exactKey))problems.push(`hadou_type_search_presets.json: ${typeId||typeName} 条件重複 ${exactKey}`);exactSeen.add(exactKey);if(!featureId||!canonicalFeatureId)problems.push(`hadou_type_search_presets.json: ${typeId||typeName} 条件IDまたは正規ID不足`);if(!['statusEffect','typeFeature'].includes(conditionType))problems.push(`hadou_type_search_presets.json: ${typeId||typeName} conditionType不正 ${conditionType||'空'}`);if(!['core','recommended','support'].includes(importance))problems.push(`hadou_type_search_presets.json: ${typeId||typeName} importance不正 ${importance||'空'}`);const resolved=conditionType==='statusEffect'?statusCatalog.has(featureId):conditionType==='typeFeature'?featureCatalog.has(featureId):false;if(!resolved)unresolved.push({typeId,featureId,conditionType});const prev=canonicalMap.get(canonicalFeatureId);const rank={core:3,recommended:2,support:1};if(!prev||(rank[importance]||0)>(rank[prev]||0))canonicalMap.set(canonicalFeatureId,importance);}
    canonicalMap.forEach(importance=>{importanceCounts[importance]=(importanceCounts[importance]||0)+1;});canonicalConditionCount+=canonicalMap.size;if(!(importanceCounts.core>0))problems.push(`hadou_type_search_presets.json: ${typeId||typeName} 中核条件がありません`);
    const selectedStatus=new Set(conditions.filter(v=>norm(v?.conditionType||'')==='statusEffect').map(v=>norm(v?.featureId||'')));const selectedFeatures=new Set(conditions.filter(v=>norm(v?.conditionType||'')==='typeFeature').map(v=>norm(v?.featureId||'')));let candidateCount=0;for(const item of featureItems){const hitStatus=(Array.isArray(item?.statusEffectRefs)?item.statusEffectRefs:[]).some(ref=>selectedStatus.has(norm(ref?.featureId||'')));const hitFeature=(Array.isArray(item?.typeFeatures)?item.typeFeatures:[]).some(ref=>selectedFeatures.has(norm(ref?.featureId||'')));if(hitStatus||hitFeature)candidateCount++;}if(candidateCount<=0)problems.push(`hadou_type_search_presets.json: ${typeId||typeName} 候補0件`);
    if(Number(preset?.rawConditionCount||0)&&Number(preset.rawConditionCount)!==conditions.length)problems.push(`hadou_type_search_presets.json: ${typeId||typeName} rawConditionCount不一致`);if(Number(preset?.canonicalConditionCount||0)&&Number(preset.canonicalConditionCount)!==canonicalMap.size)problems.push(`hadou_type_search_presets.json: ${typeId||typeName} canonicalConditionCount不一致`);
    presetSummaries.push({typeId,typeName,conditionCount:conditions.length,canonicalConditionCount:canonicalMap.size,importanceCounts,candidateCount});
  }
  if(unresolved.length)problems.push('hadou_type_search_presets.json: 解決不能条件 '+unresolved.map(v=>`${v.typeId}:${v.featureId}`).join(' / '));
  const regressionIds=regressionItems.map(v=>norm(v?.caseId||'')).filter(Boolean);const duplicateRegressionIds=regressionIds.filter((v,i,a)=>a.indexOf(v)!==i);if(duplicateRegressionIds.length)problems.push('hadou_type_search_regression_cases.json: caseId重複 '+uniq(duplicateRegressionIds).join(' / '));const missingRequiredCases=TYPE_SEARCH_REQUIRED_REGRESSION_CASE_IDS.filter(id=>!regressionIds.includes(id));if(missingRequiredCases.length)problems.push('hadou_type_search_regression_cases.json: 必須回帰ケース不足 '+missingRequiredCases.join(' / '));const failedRegressionIds=regressionItems.filter(v=>v?.ok!==true).map(v=>norm(v?.caseId||'unknown'));if(failedRegressionIds.length)problems.push('hadou_type_search_regression_cases.json: 回帰NG '+failedRegressionIds.join(' / '));
  if(feature?.qualityAudit?.ok!==true)problems.push('hadou_type_search_feature_index.json: qualityAudit NG');if(presets?.qualityAudit?.ok!==true)problems.push('hadou_type_search_presets.json: qualityAudit NG');if(regressions?.qualityAudit?.ok!==true)problems.push('hadou_type_search_regression_cases.json: qualityAudit NG');
  const result={timestamp:debugTimestamp(),context:norm(options?.context||'runtime'),ok:problems.length===0,minRequiredCrawlerVersion:MIN_REQUIRED_DERIVED_CRAWLER_VERSION,featureItemCount:featureItems.length,allowedCategories,actualCategoryCounts,statusCatalogCount:statusCatalog.size,typeFeatureCatalogCount:featureCatalog.size,presetCount:presetItems.length,presetConditionCount,canonicalConditionCount,unresolvedConditionCount:unresolved.length,unresolved,presetSummaries,regressionCaseCount:regressionItems.length,requiredRegressionCaseCount:TYPE_SEARCH_REQUIRED_REGRESSION_CASE_IDS.length,missingRequiredCases,failedRegressionIds,problems,warnings,policy:'HADO-2.9.5.0: 型検索正式版では4カテゴリ全件、プリセット一意性、条件解決、正規ID、中核条件、候補存在、必須回帰ケースをCritical監査する。'};
  state.diagnostics.typeSearchReleaseReadiness=result;debugStartup('type search release readiness',result);debugLog('typeSearch:release-readiness',result);if(options?.throwOnError&& !result.ok)throw new Error('型検索正式版品質ゲートNGです。\n- '+problems.join('\n- '));return result;
}

function validateExternalJsonBundle(data){if(!data||typeof data!=='object')throw new Error('JSONデータが不正です');for(const key of Object.keys(EXTERNAL_JSON_FILES)){if(!(key in data))throw new Error(`必要なJSONファイルが不足しています: ${EXTERNAL_JSON_FILES[key]||key}。最新クローラーで生成したJSON一式を選択してください。`);const raw=data[key];if(key==='meta'){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('JSONデータ meta はオブジェクト形式である必要があります');continue;}if(!Array.isArray(raw)&&!(raw&&Array.isArray(raw.items)))throw new Error(`JSONデータ ${key} は配列または items 配列を持つ形式である必要があります`);}const canonical=validateRequiredDerivedJsonBundle(data);const typeSearchFoundation=validateTypeSearchFoundationDiagnostic(data);const typeSearchReleaseReadiness=validateTypeSearchReleaseReadinessDiagnostic(data,{context:'json-load',throwOnError:true});state.diagnostics.latestJsonRequiredGate={timestamp:debugTimestamp(),...canonical,typeSearchFoundation,typeSearchReleaseReadiness,policy:'HADO-2.9.5.0: 旧JSON互換補完を行わず、必要JSON・派生JSONメタ・型検索基盤・正式版品質ゲートが揃った場合だけ起動する。'};return true;}
async function loadJsonTextByFetch(url){const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error(`HTTP ${res.status} ${url}`);return await res.text();}
async function loadJsonTextByXhr(url){return await new Promise((resolve,reject)=>{try{const xhr=new XMLHttpRequest();xhr.open('GET',url,true);xhr.overrideMimeType('application/json');xhr.onreadystatechange=()=>{if(xhr.readyState!==4)return;if((xhr.status>=200&&xhr.status<300)||xhr.status===0){resolve(xhr.responseText);}else{reject(new Error(`HTTP ${xhr.status} ${url}`));}};xhr.onerror=()=>reject(new Error(`XHR failed ${url}`));xhr.send();}catch(err){reject(err);}});}
async function parseJsonText(text,fileLabel){try{return JSON.parse(text);}catch(err){throw new Error(`${fileLabel} のJSON解析に失敗: ${err.message}`);}}
async function loadExternalJsonBundleViaHttp(){
// PERF[HADO-2.9.6.5-WEB-JSON-PARALLEL]: GitHub Pages等のHTTP配信では公開JSONを並列取得し、直列待ちをなくす。
const out={};const required=Object.entries(EXTERNAL_JSON_FILES);const optional=Object.entries(EXTERNAL_JSON_OPTIONAL_FILES||{});const total=required.length+optional.length;let completed=0;const startedAt=performance.now();
const markLoaded=(file)=>{completed+=1;setLoadingState(true,{title:'公開JSONを読み込んでいます…',detail:`${file} を取得しました。`,current:completed,total});};
const requiredRows=await Promise.all(required.map(async([key,file])=>{const text=await loadJsonTextByXhr(file);const value=await parseJsonText(text,file);markLoaded(file);return [key,value];}));
const optionalRows=await Promise.all(optional.map(async([key,file])=>{try{const text=await loadJsonTextByXhr(file);const value=await parseJsonText(text,file);markLoaded(file);return [key,value];}catch(err){markLoaded(file);debugLog('optionalJson:missing-http',{key,file,message:err?.message||String(err)});return [key,emptyOptionalJsonBundle(key)];}}));
for(const [key,value] of [...requiredRows,...optionalRows])out[key]=value;
debugLog('webJson:parallel-load',{total,completed,elapsedMs:Math.round(performance.now()-startedAt)});
return out;}
async function ensureDirectoryPermission(handle,mode='read'){if(!handle)return false;try{const q=await handle.queryPermission({mode});if(q==='granted')return true;const r=await handle.requestPermission({mode});return r==='granted';}catch{return false;}}
async function loadExternalJsonBundleViaDirectoryHandle(handle){if(!handle)throw new Error('JSONフォルダハンドルがありません');const out={};for(const [key,file] of Object.entries(EXTERNAL_JSON_FILES)){let fh;try{fh=await handle.getFileHandle(file,{create:false});}catch{throw new Error(`${file} が見つかりません`);}const f=await fh.getFile();const text=await f.text();out[key]=await parseJsonText(text,file);}for(const [key,file] of Object.entries(EXTERNAL_JSON_OPTIONAL_FILES||{})){try{const fh=await handle.getFileHandle(file,{create:false});const f=await fh.getFile();const text=await f.text();out[key]=await parseJsonText(text,file);}catch(err){out[key]=emptyOptionalJsonBundle(key);debugLog('optionalJson:missing-directory',{key,file,message:err?.message||String(err)});}}return out;}
async function loadExternalJsonBundle(){
if(IS_WEB_DEPLOYMENT){
  const data=await loadExternalJsonBundleViaHttp();
  validateExternalJsonBundle(data);
  // PERF[HADO-2.9.6.5-WEB-CACHE-BACKGROUND]: ウェブ版はIndexedDBキャッシュ保存完了を画面起動の前提にしない。
  setCachedJsonBundle(data,'http').then(()=>debugLog('webJson:cache-save-complete',{source:'http'})).catch(err=>debugLog('webJson:cache-save-error',{message:err?.message||String(err)}));
  recordStartupDataDecision({loadDecision:'auto-http',startupDataSource:'http',directoryHandleAvailable:false,directoryPermission:'not-applicable'});
  debugStartup('external bundle source',{source:'http',cacheSave:'scheduled'});
  return data;
}
const cached=await getCachedJsonBundle();
const remembered=await getRememberedDirectoryHandle();
if(remembered){
  let permission='prompt';
  try{permission=await remembered.queryPermission({mode:'read'});}catch{permission='unknown';}
  const permitted=permission==='granted';
  if(!permitted){
    recordStartupDataDecision({loadDecision:'show-data-load-screen',reason:'directory-permission-unavailable',startupDataSource:'none',directoryHandleAvailable:true,directoryPermission:permission,cacheSavedAt:cached?.savedAt||'',cacheSource:cached?.source||''});
    throw makeStartupDataLoadError('directory-permission-unavailable',{cachedBundle:cached,message:'前回選択したJSONフォルダへ自動アクセスできません。JSONフォルダまたはJSONファイルを選択してください。'});
  }
  let directoryManifest;
  try{directoryManifest=await collectDirectoryJsonManifest(remembered);}catch(err){
    recordStartupDataDecision({loadDecision:'show-data-load-screen',reason:'directory-read-failed',startupDataSource:'none',directoryHandleAvailable:true,directoryPermission:permission,cacheSavedAt:cached?.savedAt||'',cacheSource:cached?.source||'',error:err?.message||String(err)});
    throw makeStartupDataLoadError('directory-read-failed',{cachedBundle:cached,message:`前回選択したJSONフォルダを読み込めません。${err?.message||err}`});
  }
  const comparison=cached?.fileManifest?compareJsonManifests(directoryManifest,cached.fileManifest):null;
  if(cached&&comparison?.changed){
    recordStartupDataDecision({loadDecision:'show-data-load-screen',reason:comparison.hasNewer?'directory-data-newer':'directory-data-changed',startupDataSource:'none',directoryHandleAvailable:true,directoryPermission:permission,cacheSavedAt:cached.savedAt||'',cacheSource:cached.source||'',folderFingerprint:comparison.currentFingerprint,cacheFingerprint:comparison.cachedFingerprint,newerBundleDetected:!!comparison.hasNewer,changedFiles:(comparison.changes||[]).map(v=>({name:v.name,kind:v.kind}))});
    throw makeStartupDataLoadError(comparison.hasNewer?'directory-data-newer':'directory-data-changed',{cachedBundle:cached,directoryManifest,manifestComparison:comparison,message:comparison.hasNewer?'JSONフォルダ内に、前回キャッシュ保存時より新しいデータが見つかりました。':'JSONフォルダ内のデータ構成が前回キャッシュ保存時から変化しています。'});
  }
  const data=await loadExternalJsonBundleViaDirectoryHandle(remembered);
  validateExternalJsonBundle(data);
  try{await setCachedJsonBundle(data,'directory-handle',{fileManifest:directoryManifest});}catch{}
  recordStartupDataDecision({loadDecision:'auto-directory-load',startupDataSource:'directory-handle',directoryHandleAvailable:true,directoryPermission:permission,cacheSavedAt:cached?.savedAt||'',folderFingerprint:buildJsonManifestFingerprint(directoryManifest),cacheFingerprint:cached?.bundleFingerprint||'',newerBundleDetected:false});
  debugStartup('external bundle source',{source:'directory-handle',cacheSaved:true,rememberedHandle:true});
  return data;
}
if(cached&&cached.data){
  try{
    validateExternalJsonBundle(cached.data);
    recordStartupDataDecision({loadDecision:'auto-cache-load',reason:cached.source==='file-input'?'file-input-valid-cache':'directory-handle-missing-valid-cache',startupDataSource:'indexeddb-cache',directoryHandleAvailable:false,directoryPermission:'missing',cacheSavedAt:cached.savedAt||'',cacheSource:cached.source||'',cacheFingerprint:cached.bundleFingerprint||''});
    debugStartup('external bundle source',{source:'indexeddb-cache',cacheSavedAt:cached.savedAt||'',cacheSource:cached.source||''});
    return cached.data;
  }catch(cacheErr){
    recordStartupDataDecision({loadDecision:'show-data-load-screen',reason:'cached-json-outdated-or-invalid',startupDataSource:'none',directoryHandleAvailable:false,directoryPermission:'missing',cacheSavedAt:cached.savedAt||'',cacheSource:cached.source||'',error:cacheErr?.message||String(cacheErr)});
    throw makeStartupDataLoadError('cached-json-outdated-or-invalid',{message:`前回キャッシュは旧版または不整合のため使用できません。最新クローラーで生成したJSON一式を選択してください。\n${cacheErr?.message||cacheErr}`});
  }
}
recordStartupDataDecision({loadDecision:'show-data-load-screen',reason:'no-cache-no-directory',startupDataSource:'none',directoryHandleAvailable:false,directoryPermission:'missing'});
throw makeStartupDataLoadError('no-cache-no-directory',{message:'使用するJSONデータを選択してください。'});
}
async function chooseJsonDirectoryAndLoad(){if(!window.showDirectoryPicker)throw new Error('このブラウザはフォルダ選択APIに未対応です。Chrome/Edge系ブラウザで開いてください。');const handle=await window.showDirectoryPicker({mode:'read'});const permitted=await ensureDirectoryPermission(handle,'read');if(!permitted)throw new Error('フォルダの読取権限が許可されませんでした');await setRememberedDirectoryHandle(handle);const manifest=await collectDirectoryJsonManifest(handle);const data=await loadExternalJsonBundleViaDirectoryHandle(handle);validateExternalJsonBundle(data);await setCachedJsonBundle(data,'directory-handle',{fileManifest:manifest});recordStartupDataDecision({loadDecision:'manual-directory-load',startupDataSource:'directory-picker',directoryHandleAvailable:true,directoryPermission:'granted',folderFingerprint:buildJsonManifestFingerprint(manifest),newerBundleDetected:false});debugStartup('external bundle source',{source:'directory-picker',cacheSaved:true,rememberedHandle:true});return data;}
async function chooseJsonFilesAndLoad(files){const selected=Array.from(files||[]);if(!selected.length)throw new Error('JSONファイルが選択されていません');const fileByName=new Map(selected.map(file=>[file.name,file]));const missing=[];const out={};for(const [key,fileName] of Object.entries(EXTERNAL_JSON_FILES)){const file=fileByName.get(fileName);if(!file){missing.push(fileName);continue;}const text=await file.text();out[key]=await parseJsonText(text,fileName);}for(const [key,fileName] of Object.entries(EXTERNAL_JSON_OPTIONAL_FILES||{})){const file=fileByName.get(fileName);if(file){const text=await file.text();out[key]=await parseJsonText(text,fileName);}else{out[key]=emptyOptionalJsonBundle(key);debugLog('optionalJson:missing-file-input',{key,fileName});}}if(missing.length)throw new Error('必要なJSONファイルが不足しています: '+missing.join(' / '));validateExternalJsonBundle(out);const manifest=collectSelectedJsonManifest(selected);await setCachedJsonBundle(out,'file-input',{fileManifest:manifest});recordStartupDataDecision({loadDecision:'manual-file-load',startupDataSource:'file-input',directoryHandleAvailable:false,directoryPermission:'not-applicable',folderFingerprint:buildJsonManifestFingerprint(manifest),selectedFiles:selected.map(file=>file.name)});debugStartup('external bundle source',{source:'file-input',cacheSaved:true,selectedFiles:selected.map(file=>file.name),optionalFiles:Object.values(EXTERNAL_JSON_OPTIONAL_FILES||{})});return out;}
function hideStartupDataLoadScreen(){const overlay=document.getElementById('startupDataOverlay');if(overlay)overlay.classList.remove('is-visible');}
function renderStartupDataLoadScreen(err){if(IS_WEB_DEPLOYMENT){renderWebJsonLoadFailure(err);return;}hideLoadingState();const overlay=document.getElementById('startupDataOverlay');const reasonEl=document.getElementById('startupDataReason');const compareEl=document.getElementById('startupDataCompare');const dirBtn=document.getElementById('startupDataDirBtn');const filesBtn=document.getElementById('startupDataFilesBtn');const cacheBtn=document.getElementById('startupDataCacheBtn');const cacheNote=document.getElementById('startupDataCacheNote');const fileInput=document.getElementById('startupDataFilesInput');if(!overlay||!reasonEl||!compareEl||!dirBtn||!filesBtn||!cacheBtn||!cacheNote||!fileInput){renderLoadError(err);return;}const cached=err?.cachedBundle||null;const comparison=err?.manifestComparison||null;reasonEl.textContent=err?.message||'使用するJSONデータを選択してください。';const lines=[];if(cached){lines.push(`前回キャッシュ保存日時：${formatIsoForDisplay(cached.savedAt||'')}`);lines.push(`前回キャッシュ読込方式：${cached.source||'未記録'}`);}if(comparison?.changed){lines.push('変更を検出したJSON：');lines.push(summarizeManifestComparison(comparison)||'- 詳細なし');}compareEl.textContent=lines.join('\n')||'前回キャッシュはありません。JSONデータを選択してください。';const cacheBlockedReasons=new Set(['directory-data-newer','directory-data-changed','cached-json-outdated-or-invalid','cache-load-failed']);const cacheAllowed=!!(cached&&cached.data)&&!cacheBlockedReasons.has(norm(err?.dataLoadReason||''));cacheBtn.hidden=!cacheAllowed;cacheNote.textContent=cacheAllowed?'前回キャッシュで起動できます。最新データへ更新する場合は、JSONフォルダまたはJSONファイルを再読込してください。':'最新クローラーで生成したJSON一式を選択してください。旧JSON・不整合JSONは起動に使用できません。';dirBtn.disabled=!window.showDirectoryPicker;dirBtn.title=dirBtn.disabled?'このブラウザはフォルダ選択APIに未対応です。JSONファイルを選択してください。':'';const setBusy=(busy,label='')=>{dirBtn.disabled=busy||!window.showDirectoryPicker;filesBtn.disabled=busy;cacheBtn.disabled=busy;if(label)reasonEl.textContent=label;};dirBtn.onclick=async()=>{try{setBusy(true,'JSONフォルダを読み込んでいます…');const data=await chooseJsonDirectoryAndLoad();hideStartupDataLoadScreen();await applyLoadedData(data);}catch(loadErr){setBusy(false);renderStartupDataLoadScreen(makeStartupDataLoadError('manual-directory-load-failed',{cachedBundle:cached,message:`JSONフォルダの読込に失敗しました。${loadErr?.message||loadErr}`}));}};filesBtn.onclick=()=>{fileInput.value='';fileInput.click();};fileInput.onchange=async()=>{try{setBusy(true,'JSONファイルを読み込んでいます…');const data=await chooseJsonFilesAndLoad(fileInput.files);hideStartupDataLoadScreen();await applyLoadedData(data);}catch(loadErr){setBusy(false);renderStartupDataLoadScreen(makeStartupDataLoadError('manual-file-load-failed',{cachedBundle:cached,message:`JSONファイルの読込に失敗しました。${loadErr?.message||loadErr}`}));}finally{fileInput.value='';}};cacheBtn.onclick=async()=>{if(!(cached&&cached.data))return;try{setBusy(true,'前回キャッシュで起動しています…');validateExternalJsonBundle(cached.data);recordStartupDataDecision({loadDecision:'manual-cache-load',startupDataSource:'indexeddb-cache',cacheSavedAt:cached.savedAt||'',cacheSource:cached.source||'',cacheFingerprint:cached.bundleFingerprint||'',reason:err?.dataLoadReason||''});hideStartupDataLoadScreen();await applyLoadedData(cached.data);}catch(loadErr){setBusy(false);renderStartupDataLoadScreen(makeStartupDataLoadError('cache-load-failed',{message:`前回キャッシュの読込に失敗しました。${loadErr?.message||loadErr}`}));}};overlay.classList.add('is-visible');if(guidedTourState.active&&guidedTourState.tourKey==='intro'){guidedTourState.suppressedStartupDataOverlay=true;overlay.classList.remove('is-visible');debugLog('guidedTour:suppress-startup-data-overlay',{reason:'intro-guide-active'});}}
function renderLoadError(err){if(IS_WEB_DEPLOYMENT){renderWebJsonLoadFailure(err);return;}debugLog('renderLoadError',err);hideLoadingState();els.countStatus.textContent='JSON読込失敗';els.resultMeta.textContent='ヒット件数：0件';els.results.innerHTML='';els.detail.innerHTML=`<section><h2>読込エラー</h2><p class="meta">${esc(err?.message||String(err))}</p><p class="meta">最新クローラーで生成したJSON一式が必要です。旧JSON・欠損JSONのアプリ側補完は行いません。</p><p class="meta">PCでは「JSONフォルダを選択して再読込」、iPhone等では「JSONファイルを選択して読込」から生成済みJSON一式を選択してください。</p></section>`;}

// FEATURE[HADO-2.1.2.2-REGRESSION-SELF-CHECK]: 既存機能の関数・要素・文言をDebug Logで自己診断する。
const REGRESSION_SELF_CHECK_SPEC={
  version:HADO_BUILD_INFO.version,
  requiredFunctions:[
    'startup','applyLoadedData','renderSearchResults','isNameOnlySearch','renderDetail','renderDebugPanel','buildDebugPanelText',
    'handleCopyResults','handleCopyParameterResults','handleCopyAllParameterResults','handleCopyAllParameters','handleCopyDetail',
    'buildResultsCopyText','buildParameterResultsCopyText','buildAllParameterResultsCopyText','buildDetailCopyText',
    'exportSaveDataToFile','exportSaveData','importSaveDataFromFile','importSaveDataFromText','renderSaveControls','renderSavedModeControls','rebuildSavedModeIndex',
    'renderSearchHistory','renderMobileSearchHistory','registerSearchHistory','deleteMobileSelectedSearchHistory',
    'renderTagSearchControls','renderTagCandidates','addSelectedTag','clearSelectedTags','validateTypeSearchFoundationDiagnostic','validateTypeSearchReleaseReadinessDiagnostic',
    'buildParameterSummarySearchText','buildMetricSourceSegments','buildMetricSourceSegmentsUncached','prewarmSearchCache',
    'setupMainTabs','setMainTab','toggleMainTab','renderFormationScreen','createNewFormation','duplicateCurrentFormation','deleteCurrentFormation','persistFormationData',
    'renderFormationAddButton','renderFormationAddPopover','renderFormationSkillFilterSelect','setFormationMasterName','setFormationDeploymentType','getSelectedFormationMaster','getFormationMasterSkillsForTeam','applyFormationMasterSkillsToSummary','applyFormationMasterSkillsToEffects','applyFormationDeploymentMultiplierToEffect','buildEthnicGeneralIndex','setFormationEthnicGeneralName','normalizeLoadedEthnicResearchSkills','getCurrentEthnicResearchSkillSetting','setCurrentEthnicResearchSkillSetting','applyActiveEthnicResearchSkills','getEffectiveEthnicResearchSkillSetting','makeInferredEthnicResponseLevel5','makeInferredNanbanFukutsuLevel5','repairEthnicResearchSkillLevels','normalizeEthnicTriggerSkillName','isFormationStatusSummarySupportedKey','classifyEthnicResearchStructuredEffect','buildEthnicResearchEffectDiagnostics','formationSummaryOpenAttr','enforceFormationSummaryAccordion','markFormationSummaryUserAction','isRecentFormationSummaryUserAction','restorePinnedFormationSummaryState','ensureFormationScrollOpenGuard','formationDetailOpenStateKey','rememberFormationDetailsOpenState','restoreFormationDetailsOpenState','setupFormationDetailsOpenStateEvents','validateEthnicResearchFormationIntegration','validateEthnicResearchSaveDataRoundtrip','normalizeFormationSkillFilter','isFormationNumericParameterEffect','splitSkillConditionBlocks','resolveServantContext','evaluateConditionBlock','getActiveSkillBlocks','evaluateGrantedSkillParentBlock','applyFormationQuickAdd','applySelectedItemToFormation','formationEffectSkillLabel','formationParameterSourceTags','formationEntityLinkHtml','formationAutoLinkHtml','handleCopyDebugLog','setEquipmentStage','isEquipmentSkillTable','getEquipmentSkillStageBlocks','splitEquipmentTablesForTabs','selectEquipmentSkillStageBlock','addEquipmentReferencedSkillParameterRecordsFromText','getEffectiveEquipmentStageForItem','setCurrentEquipmentStageValue','renderEquipmentStageSettingCard','renderGeneralAbilitySection','renderGeneralTroop','renderCompatibilityCard','getDetailTabSpecs','normalizeDetailActiveTab','renderDetailTabs','renderEquipmentTablesSubset','findTroopBaseTable','findTroopLevelTable','renderGeneralDetail','validateRequiredDerivedJsonBundle','getCanonicalDerivedStatusEffectMetaByName','validateStatusEffectCanonicalClassificationDiagnostic'
  ],
  requiredElements:[
    'fileSettingsPanel','fileSettingsToggleBtn','fileSettingsModeSummary','saveSelectSummary','mainTabSearchBtn','mainTabFormationBtn','mainTabWarhorseBtn','formationScreen','formationRoot','warhorseScreen','warhorseRoot',
    'rawJsonToggle','categoryBar','searchInput','nameOnlySearchToggle','clearKeywordBtn','typeSearchPresetSelect','typeSearchPresetInfo','typeSearchStatusEffectSelect','typeSearchFeatureSelect','typeSearchClearBtn','tagSearchInput','tagSearchCandidates','tagPickerToggleBtn','addTagSearchBtn','clearTagSearchBtn','selectedTagList','tagPickerPanel',
    'resultMeta','mobileSearchHistorySelect','mobileDeleteSearchHistoryBtn','resultSelect','mobileResultFavoriteBtn','opHistoryBackBtn','opHistoryForwardBtn',
    'copyResultsBtn','copyParamResultsBtn','copyAllParamResultsBtn','copyDetailBtn','countStatus','results','detail','debugPanel','debugPanelContent','runValidationBtn','copyDebugLogBtn',
    'topPickJsonDirBtn','topPickJsonFilesBtn','topPickJsonFilesInput','viewModeAll','viewModeSaved','generalStageInitial','generalStageMax','equipmentStageInitial','equipmentStageSsrMax','equipmentStageUrMax','saveSelect','newSaveBtn','renameSaveBtn','copySaveBtn','deleteSaveBtn','exportSaveDataBtn','importSaveDataBtn','importSaveDataInput'
  ],
  requiredTexts:[
    '検索','名称のみ','型プリセット','中核','推奨','補助','部隊編成','スタートガイド','保存管理','ログ表示','JSONフォルダを選択して再読込','JSONファイルを選択して読込','全データ','保存データ','全データ武将','全データ装備','初期','SSR最大','UR最大','保存データの装備段階','Export','Import',
    '一覧コピー','検索パラコピー','全パラコピー','詳細コピー','検証実行','ログコピー','使い始める','部隊編成に追加','追加','追加して部隊編成を開く',
    '部隊一覧','新規作成','複製','削除','保存','編制種類','通常','自都市','詰所','合算技能','全て','所有武将','状態変化率','兵器','武装','異民族武将','計算式','主将','副将1','副将2','補佐1','補佐2','侍従','武将','参軍','五行','軍馬','陣形','武器','防具','文物'
  ]
};
function getFunctionByNameForRegression(name){try{return eval(name);}catch{return undefined;}}
function getElementByNameForRegression(name){return els&&Object.prototype.hasOwnProperty.call(els,name)?els[name]:document.getElementById(name);}

function getValidationScriptText(){try{return Array.from(document.scripts||[]).map(script=>script.textContent||'').join('\n');}catch{return '';}}
function getCurrentExpectedVersionLabel(){return `hado_library_${HADO_BUILD_INFO.version}`;}
function getActualExportVersionForValidation(){try{if(typeof buildSaveDataExportObject!=='function')return {ok:false,actual:'function missing',error:'buildSaveDataExportObject is not defined'};const payload=buildSaveDataExportObject();return {ok:!!payload&&payload.exportVersion===getCurrentExpectedVersionLabel(),actual:payload?.exportVersion||'',expected:getCurrentExpectedVersionLabel(),sample:{exportScope:payload?.exportScope||'',saveCount:Array.isArray(payload?.saves)?payload.saves.length:0,formationCount:Array.isArray(payload?.formationData?.formations)?payload.formationData.formations.length:0}};}catch(err){return {ok:false,actual:'error',expected:getCurrentExpectedVersionLabel(),error:String(err?.message||err)};}}
function isValidHadouVersionString(value){return /^\d+\.\d+\.\d+\.\d+$/.test(norm(value));}
function isValidSha256String(value){return /^[a-f0-9]{64}$/.test(norm(value));}
function validateVersionConsistency(){
  const expected=HADO_BUILD_INFO.version;
  const expectedLabel=getCurrentExpectedVersionLabel();
  const expectedDisplayTitle=`覇道ライブラリ ${expected}`;
  const title=norm(document.title||'');
  const h1=norm(document.querySelector('h1')?.textContent||'');
  const exportCheck=getActualExportVersionForValidation();
  const checks=[
    {name:'title',actual:title,expected:expectedDisplayTitle,ok:title===expectedDisplayTitle,severity:'critical'},
    {name:'h1',actual:h1,expected:expectedDisplayTitle,ok:h1===expectedDisplayTitle,severity:'critical'},
    {name:'FILE_META.fileName',actual:FILE_META.fileName,expected:`${expectedLabel}.html`,ok:FILE_META.fileName===`${expectedLabel}.html`,severity:'critical'},
    {name:'HADO_BUILD_INFO.version',actual:HADO_BUILD_INFO.version,expected:'valid version string',ok:isValidHadouVersionString(HADO_BUILD_INFO.version)&&HADO_BUILD_INFO.version===expected,severity:'critical'},
    {name:'HADO_BUILD_INFO.baseVersion',actual:HADO_BUILD_INFO.baseVersion,expected:'valid base version string',ok:isValidHadouVersionString(HADO_BUILD_INFO.baseVersion)&&HADO_BUILD_INFO.baseVersion!==HADO_BUILD_INFO.version,severity:'critical'},
    {name:'HADO_BUILD_INFO.baseSha256',actual:HADO_BUILD_INFO.baseSha256,expected:'64 hex chars',ok:isValidSha256String(HADO_BUILD_INFO.baseSha256),severity:'critical'},
    {name:'exportVersion',actual:exportCheck.actual,expected:expectedLabel,ok:exportCheck.ok,severity:'critical',sample:exportCheck.sample,error:exportCheck.error||''}
  ];
  return {ok:checks.every(c=>c.ok),checks,missing:checks.filter(c=>!c.ok).map(c=>c.name),exportCheck};
}
function validateDomIdCoverage(){
  const script=getValidationScriptText();
  const ids=[...new Set([...script.matchAll(/getElementById\('([^']+)'\)/g)].map(m=>m[1]).filter(id=>{
    // FIX[HADO-2.7.3.53-VALIDATION-DOM-ID-FALSE-POSITIVE]: 動的IDテンプレート断片は実DOM IDではないため検証対象外。
    return !!id&&!/[+]/.test(id)&&!/^[\"']?\+?id\+?[\"']?$/.test(id);
  }))];
  const optionalIds=new Set([
    'detailLabelWidthValue','detailLabelWidthRange','detailSaveToggleBtn','hadouExtensionLevelSelect',
    'formationMasterSelect','formationDeploymentTypeSelect','formationMobileSelect','formationNewBtn','formationDuplicateBtn','formationDeleteBtn','formationMobileNewBtn','formationMobileDuplicateBtn','formationMobileDeleteBtn','formationMobileSaveBtn','formationSaveBtn','formationNameInput','formationSkillFilterSelect','formationSiegeWeaponSelect','formationSiegeWeaponLevelSelect','formationEthnicArmamentSelect','formationEthnicArmamentLevelSelect','formationEthnicGeneralSelect','formationAddPopover','formationAddCloseBtn','formationAddCancelBtn','formationQuickTargetSelect','formationAddStayBtn','formationAddOpenBtn','formationAddButton',
    'warhorseCreateMaster','warhorseCreateName','warhorseEditorForm','warhorseOpenCreateBtn','warhorseDuplicateBtn','warhorseDeleteBtn','warhorseCreateConfirmBtn','warhorseEditName','warhorseEditMaster','warhorseEditStar','warhorseEditFavorite','warhorseSaveStatus'
  ]);
  const missing=ids.filter(id=>!document.getElementById(id));
  const requiredMissing=missing.filter(id=>!optionalIds.has(id));
  const optionalMissing=missing.filter(id=>optionalIds.has(id));
  const duplicateIds=[...new Set(ids.filter(id=>document.querySelectorAll(`#${CSS.escape(id)}`).length>1))];
  return {ok:requiredMissing.length===0&&duplicateIds.length===0,checked:ids.length,missing:requiredMissing,optionalMissing,duplicateIds};
}
function collectDeclaredFunctionNamesForValidation(){
  const script=getValidationScriptText();
  const names=new Set();
  for(const m of script.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g))names.add(m[1]);
  for(const m of script.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\b/g))names.add(m[1]);
  for(const m of script.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g))names.add(m[1]);
  return names;
}
function collectReferencedFunctionNamesForValidation(){
  const script=getValidationScriptText();
  const names=new Set(REGRESSION_SELF_CHECK_SPEC.requiredFunctions||[]);
  // FIX[HADO-2.5.5.37-VALIDATION-HANDLER-GUARD]:
  // addEventListener の第2引数が click=(id,handler)=>... のようなローカル引数の場合、
  // グローバル関数として検証しない。検証は実在関数/必須関数の欠落検出に限定する。
  const ignore=new Set(['if','for','while','switch','catch','return','try','await','async','new','typeof','Number','String','Array','Object','JSON','Promise','Map','Set','Date','Error','RegExp','Math','console','localStorage','setTimeout','handler','cb','callback','listener','fn','e','event','err','clearTimeout','requestAnimationFrame','document','window','navigator','performance','norm','esc']);
  for(const m of script.matchAll(/addEventListener\([^,]+,\s*([A-Za-z_$][\w$]*)\s*(?:,|\))/g)){const name=m[1];if(!ignore.has(name))names.add(name);}
  for(const m of script.matchAll(/onclick\s*=\s*([A-Za-z_$][\w$]*)\b/g)){const name=m[1];if(!ignore.has(name))names.add(name);}
  const startupRe=new RegExp('async\\s+function\\s+startup\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n}\\s*startup\\(\\)');
  const startupMatch=script.match(startupRe);
  if(startupMatch){for(const m of startupMatch[1].matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)){const name=m[1];if(!ignore.has(name))names.add(name);}}
  return names;
}

function validateFunctionReferenceCoverage(){
  const declared=collectDeclaredFunctionNamesForValidation();
  const referenced=[...collectReferencedFunctionNamesForValidation()].sort();
  const missing=[];
  const checked=[];
  referenced.forEach(name=>{
    let ok=false;
    try{ok=typeof eval(name)==='function';}catch{ok=declared.has(name);}
    checked.push({name,ok});
    if(!ok)missing.push(name);
  });
  return {ok:missing.length===0,checked:checked.length,missing,declaredCount:declared.size};
}
function validateJsonCompatibility(){
  const legacy=[{name:'legacy'}];
  const wrapped={items:[{name:'wrapped'}],meta:{format:'wrapped'}};
  const malformed={items:{bad:true},meta:{format:'bad'}};
  const checks=[
    {name:'legacy array unwrap',ok:unwrapHadouItems(legacy).length===1},
    {name:'wrapped items unwrap',ok:unwrapHadouItems(wrapped).length===1},
    {name:'wrapped meta read',ok:getHadouMeta(wrapped).format==='wrapped'},
    {name:'malformed items fallback',ok:Array.isArray(unwrapHadouItems(malformed))&&unwrapHadouItems(malformed).length===0},
    {name:'legacy meta fallback',ok:Object.keys(getHadouMeta(legacy)).length===0},
    {name:'table rows wrapper normalize',ok:JSON.stringify(normalizeHadouTables([{index:0,rows:[["技能","効果"]]}]))===JSON.stringify([[["技能","効果"]]])}
  ];
  const loadedCounts={generals:state.generals.length,tactics:state.tactics.length,skills:state.skills.length,equipments:state.equipments.length,statusEffects:state.statusEffects.length,siegeWeapons:state.siegeWeapons.length,ethnicArmaments:state.ethnicArmaments.length,ethnicResearchSkills:state.ethnicResearchSkills.length,formations:state.formationMasters.length};
  return {ok:checks.every(c=>c.ok),checks,loadedCounts};
}
function validateEthnicResearchSaveDataRoundtrip(){
  const sample={id:'ethnic_roundtrip_test',name:'ethnic_roundtrip_test',ethnicResearchSkills:{'烏桓神速':{enabled:true,level:'Ⅴ'},'羌敏活':{enabled:false,level:'Ⅱ'}}};
  const sanitized=sanitizeSaveRecord(sample);
  const legacy=sanitizeSaveRecord({id:'legacy_ethnic_test',name:'legacy_ethnic_test'});
  const payload=buildSaveDataExportObject();
  const exportedSaves=Array.isArray(payload?.saves)?payload.saves:[];
  const exportHasField=exportedSaves.length?exportedSaves.every(save=>save&&typeof save.ethnicResearchSkills==='object'):true;
  const roundtripOk=!!(sanitized.ethnicResearchSkills?.['烏桓神速']?.enabled&&sanitized.ethnicResearchSkills?.['烏桓神速']?.level==='Ⅴ'&&sanitized.ethnicResearchSkills?.['羌敏活']?.enabled===false&&sanitized.ethnicResearchSkills?.['羌敏活']?.level==='Ⅱ');
  const legacyOk=!!legacy.ethnicResearchSkills&&typeof legacy.ethnicResearchSkills==='object'&&Object.keys(legacy.ethnicResearchSkills).length===0;
  return {ok:roundtripOk&&legacyOk&&exportHasField,roundtripOk,legacyOk,exportHasField,exportedSaveCount:exportedSaves.length,sample:sanitized.ethnicResearchSkills};
}
function validateEthnicResearchFormationIntegration(){
  const prevView=state.viewMode;
  const prevStage=state.generalStage;
  const skill=Array.isArray(state.ethnicResearchSkills)?state.ethnicResearchSkills.find(item=>getItemDisplayName(item)==='烏桓神速')||state.ethnicResearchSkills.find(item=>norm(item.ethnicGroup)==='烏桓'):null;
  if(!skill)return {ok:false,reason:'sample ethnic research skill not found'};
  const trigger=norm(skill.triggerSkill||skill.ethnicGroup||'烏桓');
  const run=(viewMode,generalStage)=>{
    state.viewMode=viewMode;
    state.generalStage=generalStage;
    const skillRows=new Map([[trigger,{name:trigger,holders:new Set(['検証']),levels:[3],category:'skill',sourceCategories:new Set(['その他'])}]]);
    const effectsRaw=[];const specials=[];const contributionLog=[];const excludedLog=[];
    const adopted=applyActiveEthnicResearchSkills({ethnicArmament:{name:'烏桓長槊'}},skillRows,effectsRaw,specials,contributionLog,excludedLog)||[];
    return {viewMode,generalStage,adoptedCount:adopted.length,hasSampleSkill:skillRows.has(getItemDisplayName(skill)),effectCount:effectsRaw.length,contributionCount:contributionLog.length,excludedCount:excludedLog.length,adoptedNames:adopted.map(x=>x.skillName),effectDiagnostics:{totalEffects:effectsRaw.length+excludedLog.filter(x=>x&&Object.prototype.hasOwnProperty.call(x,'effectKey')).length,adoptedEffects:effectsRaw.length,excludedEffects:excludedLog.filter(x=>x&&Object.prototype.hasOwnProperty.call(x,'effectKey')).length,unsupportedEffects:excludedLog.filter(x=>x&&x.action==='excluded-unsupported-key').length,conditionExcludedEffects:excludedLog.filter(x=>x&&x.action==='excluded-condition').length}};
  };
  try{
    const initial=run('all','initial');
    const max=run('all','max');
    return {ok:initial.adoptedCount===0&&max.adoptedCount>0&&max.hasSampleSkill,initial,max};
  }catch(err){
    return {ok:false,error:err?.message||String(err)};
  }finally{
    state.viewMode=prevView;
    state.generalStage=prevStage;
  }
}
function validateWarhorseSaveCopyRoundtrip(){
  const src=sanitizeSaveRecord({id:'warhorse_copy_src',name:'軍馬コピー検証',warhorses:{owned:{wh_normal:{id:'wh_normal',name:'検証通常馬',horseMasterId:'鹿毛',skills:[{skillId:'騎・速撃',level:3,slotIndex:0},{skillId:'騎・大固',level:2,slotIndex:1}]},wh_famous:{id:'wh_famous',name:'検証名馬',horseMasterId:'絶影',star:7,skills:[{skillId:'騎・重撃',level:5,slotIndex:0}]}},activeSlots:['wh_normal','wh_famous',null]}});
  const copied=sanitizeSaveRecord({id:'warhorse_copy_dst',name:'軍馬コピー検証 コピー',generals:src.generals,equipments:src.equipments,generalSettings:src.generalSettings,generalStars:src.generalStars,equipmentStars:src.equipmentStars,equipmentStages:src.equipmentStages,ethnicResearchSkills:src.ethnicResearchSkills,inheritedSkills:src.inheritedSkills,warhorses:JSON.parse(JSON.stringify(src.warhorses||{}))});
  const srcOwned=Object.keys(src.warhorses?.owned||{}).length;
  const dstOwned=Object.keys(copied.warhorses?.owned||{}).length;
  const activeOk=JSON.stringify(src.warhorses?.activeSlots||[])===JSON.stringify(copied.warhorses?.activeSlots||[]);
  const normalSkills=copied.warhorses?.owned?.wh_normal?.skills||[];
  const famous=copied.warhorses?.owned?.wh_famous||{};
  return {ok:srcOwned===2&&dstOwned===2&&activeOk&&normalSkills.length===2&&Number(famous.star)===7,srcOwned,dstOwned,activeSlots:copied.warhorses?.activeSlots||[],normalSkillCount:normalSkills.length,famousStar:famous.star};
}
function validateWarhorseFormationIntegration(){
  const prevSaveData=state.saveData;
  const prevCurrentSaveId=state.saveData?.currentSaveId||'';
  const prevView=state.viewMode;
  try{
    const normalSkill=getWarhorseSkillById('騎・重撃')||getWarhorseSkillById('騎・速撃');
    const famousMaster=getWarhorseMasterById('絶影')||getWarhorseMasterById('白龍');
    if(!normalSkill||!famousMaster)return {ok:false,reason:'sample warhorse master or skill not found',normalSkill:!!normalSkill,famousMaster:!!famousMaster};
    const famousSkillName=getWarhorseFixedSkillName(famousMaster);
    const sampleSave=sanitizeSaveRecord({id:'warhorse_formation_validation_save',name:'軍馬反映検証',warhorses:{owned:{wh_normal:{id:'wh_normal',name:'検証通常馬',horseMasterId:'鹿毛',skills:[{skillId:normalSkill.name||normalSkill.id,level:3,slotIndex:0},{skillId:normalSkill.name||normalSkill.id,level:2,slotIndex:1}]},wh_famous:{id:'wh_famous',name:'検証名馬',horseMasterId:getWarhorseMasterId(famousMaster),star:7,skills:[]}},activeSlots:['wh_normal','wh_famous',null]}});
    state.saveData={saves:[sampleSave],currentSaveId:sampleSave.id,searchHistory:[]};
    state.viewMode='saved';
    const f={id:'warhorse_validation_formation',name:'軍馬反映検証部隊',deploymentType:'normal',formationName:'基本',slots:{main:{general:'LR華雄（かゆう）'}}};
    const ctx=buildFormationContext(f);
    const skillRows=new Map();const effectsRaw=[];const contributionLog=[];const excludedLog=[];
    const adopted=collectActiveWarhorseFormationEffects(f,ctx,skillRows,effectsRaw,contributionLog,excludedLog)||[];
    const skillNames=[...skillRows.keys()];
    const effectKeys=effectsRaw.map(e=>e.key);
    const hasNormalSkill=skillNames.includes(normalSkill.name||normalSkill.id);
    const hasFamousSkill=famousSkillName?skillNames.includes(famousSkillName):true;
    const hasHorseSource=contributionLog.some(x=>x&&x.sourceType==='horse');
    const hasNumericEffect=effectsRaw.length>0;
    const ok=ctx.troopType==='騎兵'&&adopted.length>0&&hasNormalSkill&&hasFamousSkill&&hasHorseSource&&hasNumericEffect;
    return {ok,troopType:ctx.troopType,adoptedCount:adopted.length,skillNames,effectKeys,contributionCount:contributionLog.length,excludedCount:excludedLog.length,hasNormalSkill,hasFamousSkill,hasHorseSource,hasNumericEffect,adopted};
  }catch(err){
    return {ok:false,error:err?.message||String(err)};
  }finally{
    state.saveData=prevSaveData;
    if(state.saveData)state.saveData.currentSaveId=prevCurrentSaveId;
    state.viewMode=prevView;
  }
}
// HADO-2.9.0.33-DIAGNOSTIC-ONLY:
// related_link_index の注記・条件参照混入を検知する。表示時の黙示補正には使わない。
// 正本JSONの欠陥を隠さず、検証実行とDebug Logで原因を可視化する。
function validateDerivedRelatedLinkAnnotationLeakDiagnostic(){
  try{
    const bundle=getRelatedLinkIndexBundle();
    const items=Array.isArray(bundle.items)?bundle.items:[];
    if(!items.length){
      const result={ok:true,skipped:true,reason:'related_link_index not loaded',candidateCount:0,candidates:[],policy:'診断のみ。表示処理は変更しない。'};
      state.diagnostics.relatedLinkAnnotationLeakAudit=result;return result;
    }
    const candidates=[];
    const knownReferenceOnly=new Set(['generals@@LR祝融（しゅくゆう）@@絶縁','tactics@@赤帝爛舞@@絶縁','skills@@壮望@@絶縁']);
    const excludedEvidencePattern=/により.+(?:無効|無効化|発揮されない)|この効果は発揮されない|効果は発揮されない|発生している場合|発生していない場合|無効化されている場合|無効になっている場合|などの|自体は|例示|補足|付与する際|付与する時|付与を行う|付与率/;
    items.forEach(item=>{
      const category=norm(item?.category||'');const ownerName=norm(item?.name||'');
      const rels=Array.isArray(item?.related?.statusEffects)?item.related.statusEffects:[];
      rels.forEach(rel=>{
        const name=norm(rel?.name||rel?.displayName||'');
        const source=norm(rel?.source||'');const sourcePartType=norm(rel?.sourcePartType||'');
        const viaStatus=norm(rel?.viaStatus||'');const target=norm(rel?.target||'');
        const sourceText=norm(rel?.sourceText||rel?.matchedText||'');
        const directGrantEvidence=norm(rel?.directGrantEvidence||'');
        const directGrantVerified=rel?.directGrantVerified===true;
        if(source==='self_countermeasure_index'&&sourcePartType==='self-granted-status-nullify'&&viaStatus==='穿撃'&&target==='絶縁'){
          candidates.push({kind:'second-stage-nullify-from-穿撃-annotation-reference',category,ownerName,name,viaStatus,target,sourcePartType,sourceText});return;
        }
        if(source==='semantic_owner_status'&&sourcePartType==='semantic-owner-status-grant'&&name==='絶縁'){
          const known=knownReferenceOnly.has(`${category}@@${ownerName}@@${name}`);
          const evidenceExcluded=!!(directGrantEvidence&&excludedEvidencePattern.test(directGrantEvidence));
          const referenceOnlyText=!!(sourceText&&/(?:絶縁が発生している場合|絶縁が発生していない場合|絶縁が無効化されている場合|絶縁が無効になっている場合)/.test(sourceText));
          if(!directGrantVerified||!directGrantEvidence||evidenceExcluded||(known&&referenceOnlyText))candidates.push({kind:'annotation-or-condition-reference-as-direct-grant',category,ownerName,name,sourcePartType,sourceText,directGrantEvidence,directGrantVerified,knownReferenceOnly:known});
        }
      });
    });
    const crawlerAudit=bundle.audit?.annotationLeakAudit||{};
    const result={ok:candidates.length===0,candidateCount:candidates.length,candidates,crawlerAudit,policy:'HADO-2.9.0.35: アプリは表示時に黙示補正しない。直接付与はクローラー生成の局所証拠directGrantEvidenceを監査し、正常な長文sourceTextを巻き込まない。条件参照由来の絶縁と穿撃注記由来の二段階派生は診断NGにする。'};
    state.diagnostics.relatedLinkAnnotationLeakAudit=result;
    debugLog('validation:related-link-annotation-leak-audit',result);
    return result;
  }catch(err){
    const result={ok:false,error:err?.message||String(err),policy:'診断のみ。表示処理は変更しない。'};
    state.diagnostics.relatedLinkAnnotationLeakAudit=result;
    debugLog('validation:related-link-annotation-leak-audit-error',result);
    return result;
  }
}
function validateRelatedLinkSourceBoundarySmoke(){
  try{
    const item=findItemByDisplayNameLazy('generals','LR張飛（ちょうひ）')||findItemByDisplayNameLazy('generals','【三國志 覇道】LR張飛（ちょうひ）');
    if(!item)return {ok:false,error:'LR張飛 not found'};
    const indexed=typeof getDerivedRelatedLinkIndexGroupsForItem==='function'?getDerivedRelatedLinkIndexGroupsForItem(item,{trustedIndex:true}):null;
    const groups=(indexed&&Array.isArray(indexed.groups))?normalizeRelatedLinkGroupsForDisplay(indexed.groups):getRelatedLinkGroupsForItem(item);
    const enemyState=(groups.find(g=>g.category==='statusEffects'&&g.title==='敵部隊状態弱化')?.names||[]).map(norm);
    const selfResistance=((groups.find(g=>g.category==='statusEffects'&&g.title==='自部隊耐性強化')||groups.find(g=>g.category==='statusEffects'&&g.title==='自部隊不利対策'))?.names||[]).map(norm);
    const forbidden=['同討','畏怖','恐怖'];
    const forbiddenPresent=forbidden.filter(v=>enemyState.includes(v));
    const expectedSelf=['畏怖回避[鋼胆]','恐怖回避[鋼胆]'];
    const missingSelf=expectedSelf.filter(v=>!selfResistance.includes(norm(v))&&!selfResistance.some(name=>name===norm(v.replace('[鋼胆]',''))));
    const legacyEnemyExpectationRemoved=!enemyState.includes('萎縮');
    const ok=!forbiddenPresent.length&&!missingSelf.length;
    return {ok,enemyState,selfResistance,forbiddenPresent,missingSelf,legacyEnemyExpectationRemoved,policy:'LR張飛の攻略コメント由来「同討/畏怖/恐怖」を敵部隊状態弱化に出さず、鋼胆の畏怖/恐怖は自部隊耐性強化へ残す。萎縮を敵部隊状態弱化に期待する旧判定は廃止。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}
function validateKousekiSupplementalStatusBoundarySmoke(){
  try{
    const item=findItemByDisplayNameLazy('generals','LR項籍（こうせき）')||findItemByDisplayNameLazy('generals','【三國志 覇道】LR項籍（こうせき）');
    if(!item)return {ok:false,error:'LR項籍 not found'};
    const indexed=getDerivedRelatedLinkIndexGroupsForItem(item,{trustedIndex:true});
    const groups=(indexed&&Array.isArray(indexed.groups))?normalizeRelatedLinkGroupsForDisplay(indexed.groups):getRelatedLinkGroupsForItem(item);
    const enemyState=(groups.find(g=>g.category==='statusEffects'&&g.title==='敵部隊状態弱化')?.names||[]).map(norm);
    const selfResistance=((groups.find(g=>g.category==='statusEffects'&&g.title==='自部隊耐性強化')||groups.find(g=>g.category==='statusEffects'&&g.title==='自部隊不利対策'))?.names||[]).map(norm);
    const forbidden=enemyState.filter(v=>v==='分断');
    const ok=!forbidden.length;
    return {ok,enemyState,selfResistance,forbidden,policy:'LR項籍/震天の「※分断など...自体は敵部隊から付与されうる」は補足説明なので敵部隊状態弱化に出さない。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}
function validateSelfResistanceCountermeasureSmoke(){
  try{
    const rows=buildEffectCountermeasureIndex(true)||[];
    const sameAttack=rows.find(r=>r.groupKey==='selfResistanceBuff'&&r.name==='同討回避');
    const koAttack=rows.find(r=>r.groupKey==='selfResistanceBuff'&&r.name==='攻撃低下回避');
    const tacticPower=rows.find(r=>r.groupKey==='selfResistanceBuff'&&r.name==='戦法威力低下回避');
    const ok=!!sameAttack&&sameAttack.sources.length>0&&getLockedStatusEffectRelationGroupName('同討')==='enemyStateDebuff'&&!!koAttack&&!!tacticPower;
    return {ok,sameAttack,koAttack,tacticPower,policy:'自部隊不利対策は敵部隊状態弱化/能力低下のlockedGroupを確認し、同討回避や能力弱化効果括弧内分解を維持する。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}
function validateGeneralSkillSourceBoundarySmoke(){
  try{
    const item=findItemByDisplayNameLazy('generals','LR田豊（でんぽう）')||findItemByDisplayNameLazy('generals','【三國志 覇道】LR田豊（でんぽう）');
    if(!item)return {ok:false,error:'LR田豊 not found'};
    const derived=getDerivedRelatedLinkGroupsForItem(item);
    const groups=(derived&&Array.isArray(derived.groups))?derived.groups:getRelatedLinkGroupsForItem(item);
    const skills=(groups.find(g=>g.category==='skills'&&g.title==='技能')?.names||[]).map(norm);
    const selfResistance=((groups.find(g=>g.category==='statusEffects'&&g.title==='自部隊耐性強化')||groups.find(g=>g.category==='statusEffects'&&g.title==='自部隊不利対策'))?.names||[]).map(norm);
    const owned=[...collectSkillNamesFromGeneralItem(item)].map(norm).sort((a,b)=>a.localeCompare(b,'ja'));
    const expected=['剛風','賢略','慧断','石工','撃略'];
    const missingExpected=expected.filter(v=>!skills.includes(v));
    const forbiddenSkillPresent=skills.filter(v=>v==='栄華');
    const forbiddenCountermeasurePresent=selfResistance.filter(v=>/\[栄華\]/.test(v)||/^恐怖回避\[栄華\]$|^攻撃速度低下回避\[栄華\]$|^知力低下回避\[栄華\]$/.test(v));
    const ownerNoise=[...collectReferencedSkillNamesMentionedForDiagnostics(item)].filter(v=>v==='栄華');
    const ok=!missingExpected.length&&!forbiddenSkillPresent.length&&!forbiddenCountermeasurePresent.length&&owned.includes('剛風')&&!owned.includes('栄華');
    return {ok,skills,selfResistance,owned,missingExpected,forbiddenSkillPresent,forbiddenCountermeasurePresent,commentarySkillMentions:ownerNoise,policy:'LR田豊の攻略コメント「UR曹丕の技能『栄華』」は所持技能・自部隊不利対策に採用しない。武将関連技能は実技能欄のみ採用する。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}

function validateStatusEffectTargetSideGateSmoke(){
  try{
    const item=findItemByDisplayNameLazy('generals','LR夏侯惇（かこうとん）')||findItemByDisplayNameLazy('generals','【三國志 覇道】LR夏侯惇（かこうとん）');
    if(!item)return {ok:false,error:'LR夏侯惇 not found'};
    const derived=getDerivedRelatedLinkGroupsForItem(item);
    const groups=(derived&&Array.isArray(derived.groups))?derived.groups:getRelatedLinkGroupsForItem(item);
    const selfState=(groups.find(g=>g.category==='statusEffects'&&g.title==='自部隊状態強化')?.names||[]).map(norm);
    const enemyState=(groups.find(g=>g.category==='statusEffects'&&g.title==='敵部隊状態弱化')?.names||[]).map(norm);
    const selfAbility=(groups.find(g=>g.category==='statusEffects'&&g.title==='自部隊能力強化')?.names||[]).map(norm);
    const selfResistance=((groups.find(g=>g.category==='statusEffects'&&g.title==='自部隊耐性強化')||groups.find(g=>g.category==='statusEffects'&&g.title==='自部隊不利対策'))?.names||[]).map(norm);
    const meta=getStatusEffectMetaByName('戦法遅延');
    const ok=!selfState.includes('戦法遅延')&&enemyState.includes('戦法遅延')&&norm(meta?.resolvedTargetSide||meta?.defaultTargetSide||'')==='enemy'&&norm(meta?.resolvedGroupLabel||meta?.defaultGroupLabel||'')==='敵部隊状態弱化';
    return {ok,selfState,enemyState,selfAbility,selfResistance,meta:{defaultTargetSide:meta?.defaultTargetSide||'',resolvedTargetSide:meta?.resolvedTargetSide||'',targetSideMismatch:!!meta?.targetSideMismatch,defaultGroup:meta?.defaultGroupLabel||'',resolvedGroup:meta?.resolvedGroupLabel||'',judgement:meta?.targetSideJudgement||''},policy:'追加効果表・本文で確定したtargetSideを状態変化マスタtypeで覆さない。LR夏侯惇の戦法遅延が自部隊状態強化へ混入せず、敵部隊状態弱化へ分類されることだけを検証する。豪昇・闘気・攻撃上昇等の別効果は別テストで扱う。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}


function validateHadouExtensionSearchTextSmoke(){
  try{
    const siege=(state.siegeWeapons||[]).find(item=>getItemDisplayName(item)==='井闌')||(state.siegeWeapons||[])[0];
    const arm=(state.ethnicArmaments||[]).find(item=>getItemDisplayName(item)==='穿透箭')||(state.ethnicArmaments||[])[0];
    const siegeText=norm(siege?._searchableText||buildDetailRichSearchText(siege,'')).toLowerCase();
    const armText=norm(arm?._searchableText||buildDetailRichSearchText(arm,'')).toLowerCase();
    const siegeRequired=['最大耐久','対物','効果範囲'];
    const armRequired=['最大耐久','対物'];
    const missingSiege=siegeRequired.filter(k=>!siegeText.includes(k.toLowerCase()));
    const missingArm=armRequired.filter(k=>!armText.includes(k.toLowerCase()));
    return {ok:!!siege&&!!arm&&!missingSiege.length&&!missingArm.length,siege:getItemDisplayName(siege),armament:getItemDisplayName(arm),missingSiege,missingArm,textLength:{siege:siegeText.length,armament:armText.length},policy:'兵器・武装は派生検索インデックス利用時も、内容詳細に表示するレベル別パラメータ/追加効果を検索対象に含める。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}
function validateWarhorseMasterDetailObjectSmoke(){
  try{
    const sample={name:'検証用名馬',kind:'famous',category:'warhorses',sourceDataset:'warhorses',fixedSkillName:'検証固有技能',starEnabled:true,stats:{兵力:{初期:100,最大:200},攻撃:10,機動:'+2%'},starFixedSkillLevels:{1:1,4:2,7:3},starEffects:{1:{key:'機動',value:2,unit:'%'},4:{key:'機動',value:4,unit:'%'},7:{key:'機動',value:6,unit:'%'}}};
    const html=renderWarhorseMasterDetail(sample);
    const text=html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
    const forbidden=/\[object(?: Object)?\]|key:|value:|unit:|type:/.test(text);
    const humanReadable=text.includes('機動+2%')&&text.includes('機動+4%')&&text.includes('機動+6%');
    return {ok:!forbidden&&humanReadable&&text.includes('兵力')&&text.includes('初期:100'),htmlSample:text.slice(0,240),policy:'名馬詳細は将星効果を機動+2%のような利用者向け効果文へ整形し、key/value/unit等の内部構造を表示しない。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}
function validateQuickOwnerFavoriteRefreshSmoke(){
  try{
    const quickFunctionText=String(runQuickStatusEffectOwnerSearchAsync||'');
    const toggleFunctionText=String(toggleSavedName||'');
    const renderFunctionText=String(renderSearchResults||'');
    const ok=quickFunctionText.includes('keepPreviousRowsWhilePending')&&quickFunctionText.includes('fallbackRows')&&toggleFunctionText.includes("reason:'toggleSavedName'")&&renderFunctionText.includes('owner-results-pending-fallback');
    return {ok,policy:'クイック検索中のお気に入り切替では、保存索引更新後も旧結果をfallbackRowsとして保持し、非同期再検索完了前の0件表示を防止する。',checks:{runQuickOptions:quickFunctionText.includes('keepPreviousRowsWhilePending'),toggleCallsQuickRefresh:toggleFunctionText.includes("reason:'toggleSavedName'"),renderUsesFallback:renderFunctionText.includes('owner-results-pending-fallback')}};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}
function validateQuickOwnerReasonNoInternalFilenameSmoke(){
  try{
    const sample=buildQuickOwnerSelectionReason([{name:'攻撃上昇',groupKey:'selfAbilityBuff',relationType:'',sourceText:'hadou_parameter_summary_index.json',matchedText:'攻撃+10%'}],{label:'自部隊能力強化すべて',group:'selfAbilityBuff'});
    const sample2=buildQuickOwnerSelectionReason([{name:'攻撃上昇',groupKey:'selfAbilityBuff',relationType:'',sourceText:'派生JSON:hadou_status_effect_relations.json',matchedText:'攻撃上昇'}],{label:'自部隊能力強化すべて',group:'selfAbilityBuff'});
    const sample3=buildQuickOwnerSelectionReason([{name:'弱化効果回避[妙手]',groupKey:'selfResistanceBuff',relationType:'',sourceText:'related_link_index',matchedText:'自部隊より低知力の敵から受ける弱化効果を避ける'}],{kind:'group',label:'自部隊不利対策すべて',group:'selfResistanceBuff'});
    const combined=sample+' '+sample2+' '+sample3;
    const ok=!/\.json\b/i.test(combined)&&!/(?:hadou|hado)_[A-Za-z0-9_\-]+/.test(combined)&&!combined.includes('related_link_index')&&sample3.includes('弱化効果回避[妙手]')&&sample3.includes('自部隊より低知力の敵から受ける弱化効果を避ける')&&!sample3.includes('自部隊不利対策すべて');
    return {ok,sample,sample2,sample3,policy:'一覧の選定理由には内部JSONファイル名・内部索引識別子を表示しない。状態変化グループ検索では総称ではなく具体的な一致効果名と根拠文を表示する。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}
function collectReferencedSkillNamesMentionedForDiagnostics(item){
  const out=new Set();
  try{collectReferencedSkillNamesFromText(stringifyWithoutTextSample(sanitizeRawForSearch(item,item?.raw||item)),out);}catch{}
  try{(Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{(Array.isArray(sec?.content)?sec.content:[]).forEach(line=>collectReferencedSkillNamesFromText(line,out));});}catch{}
  return [...out].map(norm).filter(Boolean).sort((a,b)=>a.localeCompare(b,'ja'));
}

function validateFormationWeaponAndJijuConditionSmoke(){
  try{
    const xhd=findItemByDisplayNameLazy('generals','LR夏侯惇（かこうとん）')||findItemByDisplayNameLazy('generals','【三國志 覇道】LR夏侯惇（かこうとん）');
    const permissionRecords=collectGeneralSkillPermissionRecordsForWeaponTroop(xhd);
    const hasInfantryPermission=permissionRecords.some(r=>r.troopType==='歩兵'&&r.skillName==='雄猛');
    const fakeCtx={slotKey:'main'};
    const current=ensureCurrentFormation();
    const original=current?.slots?.main?JSON.parse(JSON.stringify(current.slots.main)):null;
    if(current?.slots?.main){current.slots.main.general=getItemDisplayName(xhd);current.slots.main.attendant='';current.slots.main.attendantPosition='';current.slots.main.equipments={weapon:'',armor:'',treasure:''};}
    const detail=getFormationSlotWeaponPermissionDetail(fakeCtx);
    if(current?.slots?.main&&original)current.slots.main=original;
    const slotAllowsInfantry=detail.allowedTroopTypes.includes('歩兵')&&detail.allowedTroopTypes.includes('騎兵');
    const noEquipmentSource=String(getFormationSlotAllowedWeaponTroopTypes).includes('getFormationSlotWeaponPermissionDetail')&&!String(getFormationSlotWeaponPermissionDetail).includes('collectEquipmentSkillTextForWeaponTroopPermission');
    const sampleOwner={name:'検証侍従条件',category:'generals',jiju_positions:[{position:'右下',condition:'UR以下 歩兵/騎兵 武力500以上'}]};
    const parsed=parseJijuCondition('UR以下 歩兵/騎兵 武力500以上');
    const parsedOk=parsed.rarityMax==='UR'&&parsed.troopTypes.includes('歩兵')&&parsed.troopTypes.includes('騎兵')&&parsed.stats.some(s=>s.name==='武力'&&s.required===500);
    const condText=formatJijuConditionHumanReadable('UR以下 歩兵/騎兵 武力500以上');
    const conditionVisible=renderGeneralJijuConditionRowsHtml(sampleOwner).includes('UR以下 / 歩兵/騎兵 / 武力500以上');
    return {ok:!!xhd&&hasInfantryPermission&&slotAllowsInfantry&&noEquipmentSource&&parsedOk&&conditionVisible,general:getItemDisplayName(xhd),permissionRecords,slotAllowed:detail.allowedTroopTypes,parsed,condText,conditionVisible,policy:'2.7.3.56: 武器候補拡張は武将本人技能だけ。侍従条件は複数兵科を許容し、詳細に条件を表示する。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}

function validateFormationJijuSinglePositionFirstSmoke(){
  try{
    const dt=findItemByDisplayNameLazy('generals','LR董卓（とうたく）')||findItemByDisplayNameLazy('generals','【三國志 覇道】LR董卓（とうたく）');
    const bc=findItemByDisplayNameLazy('generals','LR文醜（ぶんしゅう）')||findItemByDisplayNameLazy('generals','【三國志 覇道】LR文醜（ぶんしゅう）');
    const f={id:'smoke_jiju_priority',name:'侍従優先度検証',formationName:'勇往陣・改',deploymentType:'normal',slots:{main:createFormationSlot(),deputy1:createFormationSlot(),deputy2:createFormationSlot(),support1:createFormationSlot(),support2:createFormationSlot()},advisorSlots:createFormationAdvisorSlots(),siegeWeapon:{name:'',level:0},ethnicArmament:{name:'',level:0,ethnicGeneralName:''}};
    if(bc)f.slots.deputy2.general=getItemDisplayName(bc);
    if(dt)f.slots.support2.general=getItemDisplayName(dt);
    const availability=computeFormationJijuAvailability(f);
    const order=availability.processingOrder||[];
    const dtSlot=availability.bySlot?.support2||{};
    const bcSlot=availability.bySlot?.deputy2||{};
    const dtOrder=order.findIndex(x=>x.slotKey==='support2');
    const bcOrder=order.findIndex(x=>x.slotKey==='deputy2');
    const dtCondition=(getGeneralJijuPositionEntries(dt)||[]).map(e=>formatJijuConditionHumanReadable(e.condition||'')).join(' / ');
    const bcCondition=(getGeneralJijuPositionEntries(bc)||[]).map(e=>formatJijuConditionHumanReadable(e.condition||'')).join(' / ');
    const dtConditionOk=/歩兵\/弓兵/.test(dtCondition)&&/武力750以上/.test(dtCondition);
    const bcMulti=(bcSlot.jijuPositionCount||0)>1;
    const dtSingle=(dtSlot.jijuPositionCount||0)===1;
    const priorityOk=dtOrder>=0&&bcOrder>=0&&dtOrder<bcOrder&&dtSlot.jijuPriorityGroup===0&&bcSlot.jijuPriorityGroup===1;
    const dtAvailable=!!(dtSlot.hasAvailable&&(dtSlot.available||[]).some(c=>c.position==='右'));
    const bcRightBlocked=(bcSlot.candidates||[]).some(c=>c.position==='右下'&&c.reason==='reserved-by-priority'&&c.reservedBy==='support2');
    return {ok:!!dt&&!!bc&&dtConditionOk&&dtSingle&&bcMulti&&priorityOk&&dtAvailable&&bcRightBlocked,order,dt:{name:getItemDisplayName(dt),condition:dtCondition,slot:dtSlot},bc:{name:getItemDisplayName(bc),condition:bcCondition,slot:bcSlot},policy:'2.7.3.60: 侍従配置候補が1つだけの武将を先に座標確保し、複数候補を持つ武将は後回し。同グループ内だけ編成スロット優先順を使う。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}

function validateFormationRangeAndResultOrderSmoke(){
  try{
    const current=ensureCurrentFormation();
    const sample=JSON.parse(JSON.stringify(current||{id:'smoke_range',name:'射程検証',slots:{main:{general:'',attendant:'',equipments:{}}}}));
    if(!sample.slots)sample.slots={};
    if(!sample.slots.main)sample.slots.main={general:'',attendant:'',equipments:{}};
    if(!norm(sample.slots.main.general)){
      const first=(state.generals||[]).find(g=>Number.isFinite(getGeneralBaseRangeValue(g)))||(state.generals||[])[0];
      sample.slots.main.general=getItemDisplayName(first);
    }
    const data=buildFormationParameterData(sample);
    const rows=collectFormationAllParameterRows(data);
    const rangeRow=rows.find(r=>norm(r.key)==='射程');
    const required=collectFormationRequiredResultRows(data);
    const quick=collectFormationQuickSummaryRows(data,10);
    const seqOk=quick.every((r,i)=>i===0||quick[i-1].seq<r.seq);
    const requiredRange=required.find(r=>norm(r.key)==='射程');
    const requiredSpeed=required.find(r=>norm(r.key)==='攻撃速度');
    return {ok:!!rangeRow&&rangeRow.value!=='未判定'&&!!requiredRange&&!requiredRange.missing&&!!requiredSpeed&&seqOk,rangeRow,required:required.map(r=>({key:r.key,value:r.value,missing:!!r.missing,timingLabel:r.timingLabel})),quickKeys:quick.map(r=>r.key),seqOk,policy:'部隊の射程は主将兵科基本能力から通常時の状態変化率へ追加し、サマリー/結果は状態変化率の表示順を維持する'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}

function validateFormationRangeConditionGateSmoke(){
  try{
    const mk=(value,source,raw)=>({timing:'normal',key:'射程',group:'range',value,unit:'',sign:'+',sourceLabel:source,condition:cleanConditionText(raw||''),rawText:raw||`部隊の射程+${value}`});
    const baseOnly=[mk(1.5,'主将兵科基本能力','部隊の射程 1.5'),mk(1,'技能:練射Ⅱ','▼編制時点の自部隊の射程が2以上の際 ●部隊の射程+1')];
    const excludedLog1=[];
    const gate1=applyFormationRangeConditionGate(baseOnly,excludedLog1);
    const summary1=summarizeFormationEffectsBySkillLevel(baseOnly,[]);
    const range1=summary1?.normal?.range?.['射程']||summary1?.normal?.special?.['射程']||summary1?.normal?.ability?.['射程'];
    const withBonus=[mk(1.5,'主将兵科基本能力','部隊の射程 1.5'),mk(0.5,'技能:検証補正Ⅰ','■常に ●部隊の射程+0.5'),mk(1,'技能:練射Ⅱ','▼編制時点の自部隊の射程が2以上の際 ●部隊の射程+1')];
    const excludedLog2=[];
    const gate2=applyFormationRangeConditionGate(withBonus,excludedLog2);
    const summary2=summarizeFormationEffectsBySkillLevel(withBonus,[]);
    const range2=summary2?.normal?.range?.['射程']||summary2?.normal?.special?.['射程']||summary2?.normal?.ability?.['射程'];
    const display1=formationParameterDisplayValue('射程',range1);
    const display2=formationParameterDisplayValue('射程',range2);
    const realText='Ⅱ■常に　●この技能を持つ武将の将星ランクに応じて部隊の防御が上昇（将星ランク1につき+1%）　→主将か、主将と自身が好相性の際は効果が5倍（将星ランク1につき+5％）　●出陣時の自部隊の防御に応じて、戦法による被ダメージを軽減（防御500につき3％軽減。最大30％）▼編制時点の自部隊の射程が2以上の際　●部隊の射程+1';
    const parsedReal=parseParameterEffectsFromRecord({source:'技能:練射',text:realText});
    const realRangeEffects=(parsedReal.effects||[]).filter(e=>norm(e.key)==='射程');
    const realExtractOk=realRangeEffects.some(e=>Number(e.value)===1&&/編制時点の自部隊の射程が2以上/.test(norm(e.condition+' '+e.rawText)));
    return {ok:gate1.excluded===1&&Number(range1?.maxTotal)===1.5&&display1==='1.5'&&gate2.adopted===1&&Number(range2?.maxTotal)===3&&display2==='3'&&realExtractOk,gate1,display1,range1:{maxTotal:range1?.maxTotal,items:(range1?.items||[]).map(e=>e.sourceLabel)},gate2,display2,range2:{maxTotal:range2?.maxTotal,items:(range2?.items||[]).map(e=>e.sourceLabel)},realExtractOk,realRangeEffects:realRangeEffects.map(e=>({source:e.sourceLabel,value:e.value,condition:e.condition,rawText:e.rawText})),policy:'2.7.3.63: 練射等の射程条件付き効果は、実データ形式の技能本文から抽出したうえで、条件付き効果自身を除いた編制時点射程で判定する。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}
function validateFormationTacticGaugeCapSmoke(){
  try{
    const effects=[
      {timing:'deploy',key:'戦法ゲージ',group:'gauge',value:30,unit:'%',sign:'+',sourceLabel:'技能:検証AⅠ',condition:'出陣時',rawText:'戦法ゲージ+30%'},
      {timing:'deploy',key:'戦法ゲージ',group:'gauge',value:25,unit:'%',sign:'+',sourceLabel:'技能:検証BⅠ',condition:'出陣時',rawText:'戦法ゲージ+25%'}
    ];
    const summary=summarizeFormationEffectsBySkillLevel(effects,[]);
    const entry=summary?.deploy?.gauge?.['戦法ゲージ'];
    const display=formationParameterDisplayValue('戦法ゲージ',entry);
    const capNote=formationParameterCapNoteText(entry);
    return {ok:!!entry&&entry.maxTotal===50&&entry.total===50&&entry.uncappedMaxTotal===55&&entry.capApplied===true&&display==='+50%'&&/55%.*50%/.test(capNote),entry:{maxTotal:entry?.maxTotal,total:entry?.total,uncappedMaxTotal:entry?.uncappedMaxTotal,capApplied:!!entry?.capApplied,display,capNote},policy:'2.7.3.61: 戦法ゲージの正方向合算値は最大50%。計算根拠は保持し、表示値だけ50%で頭打ちにする。'};
  }catch(err){return {ok:false,error:err?.message||String(err)};}
}
function validateStatusEffectCanonicalClassificationDiagnostic(){
  const rows=[];const metaItems=getDerivedRelatedBucketItems('statusEffectMetaIndex');const ownerGroups=new Set(getDerivedRelatedBucketItems('statusEffectGroupOwnerIndex').map(v=>norm(v?.groupKey||'')).filter(Boolean));
  (state.statusEffects||[]).forEach(item=>{const name=norm(item?.name||item?.title||'');const canonical=getCanonicalDerivedStatusEffectMetaByName(name);const actual=getStatusEffectRelationGroupKey(item);if(!canonical){rows.push({name,problem:'meta-index-missing'});return;}const expected=norm(canonical.groupKey||'');if(actual!==expected)rows.push({name,problem:'runtime-group-mismatch',expected,actual});});
  const requiredGroups=Object.keys(STATUS_EFFECT_RELATION_GROUP_LABELS);const missingOwnerGroups=requiredGroups.filter(g=>!ownerGroups.has(g));
  const result={ok:rows.length===0&&missingOwnerGroups.length===0,source:'HADO-2.9.0.34',metaCount:metaItems.length,statusEffectCount:(state.statusEffects||[]).length,mismatchCount:rows.length,mismatches:rows.slice(0,100),missingOwnerGroups,policy:'状態変化分類はhadou_status_effect_meta_index.jsonを正本とし、アプリ側で再分類・補正しない。group owner索引も6分類すべて必須。'};
  state.diagnostics.statusEffectCanonicalClassification=result;return result;
}

function validateHadouExtensionDatasets(){
  const siege=Array.isArray(state.siegeWeapons)?state.siegeWeapons:[];
  const arms=Array.isArray(state.ethnicArmaments)?state.ethnicArmaments:[];
  const hasLoadedAnyDataset=(state.generals.length+state.equipments.length+state.statusEffects.length+siege.length+arms.length+(state.formationMasters?.length||0))>0;
  if(!hasLoadedAnyDataset)return {ok:true,skipped:true,reason:'datasets not loaded yet',counts:{siegeWeapons:siege.length,ethnicArmaments:arms.length}};
  const requiredArmamentNames=['突騎鞍','穿透箭','羌弩','藤甲','五渓鋼斧','山越楯','烏桓長槊','鮮卑軽弓','羌鉄車','戦象鞍','五渓鉄鎚','山越毒槍','烏桓馬鎧','東胡飛弓','羌飛鎚','南蛮羽箭','五渓骨朶','三尖槍'];
  const armNames=new Set(arms.map(getItemDisplayName));
  const missingArmaments=requiredArmamentNames.filter(name=>!armNames.has(name));
  const checks=[
    {name:'兵器6件',ok:siege.length===6,actual:siege.length,expected:6},
    {name:'武装18件',ok:arms.length===18,actual:arms.length,expected:18},
    {name:'訂正済み武装名',ok:missingArmaments.length===0,missing:missingArmaments},
    {name:'兵器Lv範囲',ok:siege.every(item=>(Array.isArray(item.levels)&&(!item.levels.length||Math.max(...item.levels.map(v=>Number(v.level)||0))<=20)))},
    {name:'武装Lv範囲',ok:arms.every(item=>(Array.isArray(item.levels)&&(!item.levels.length||Math.max(...item.levels.map(v=>Number(v.level)||0))<=5)))}
  ];
  checks.push({name:'兵器・武装パラメータ表示ヘルパー',ok:typeof renderFormationSelectedExtensionParameterBlocks==='function'});
  checks.push({name:'兵器・武装追加効果サマリー抽出ヘルパー',ok:typeof collectFormationExtensionSummaryEffects==='function'});
  checks.push({name:'追加効果サマリー対象キー',ok:allParameterSummaryKeys().has('対物特効')&&allParameterSummaryKeys().has('与ダメージ')&&allParameterSummaryKeys().has('被ダメージ')});
  checks.push({name:'状態変化率区分別表示ヘルパー',ok:typeof renderFormationParameterTimingTable==='function'});
  checks.push({name:'保存データ検索キャッシュキー',ok:typeof buildSavedSearchCacheKey==='function'});
  const statusLinkSmoke=typeof runStatusEffectLinkRegressionSmoke==='function'?runStatusEffectLinkRegressionSmoke():{ok:false,error:'missing function'};
  checks.push({name:'戦法追加効果の攻撃速度変化リンク判定',ok:!!statusLinkSmoke.ok,detail:statusLinkSmoke});
  checks.push({name:'戦法追加効果の能力変化・即時系リンク判定',ok:!!statusLinkSmoke.ok,detail:statusLinkSmoke});
    checks.push({name:'状態変化200件の対象判定メタ生成',ok:!!(state.diagnostics.statusEffectMeta&&state.diagnostics.statusEffectMeta.total===state.statusEffects.length&&state.diagnostics.statusEffectMeta.allTargetSideJudged),detail:state.diagnostics.statusEffectMeta||{}});
    checks.push({name:'状態変化200件の方向・作用分類メタ生成',ok:!!(state.diagnostics.statusEffectMeta&&state.diagnostics.statusEffectMeta.total===state.statusEffects.length&&state.diagnostics.statusEffectMeta.actionCounts),detail:{actionCounts:state.diagnostics.statusEffectMeta?.actionCounts||{},actionCounts:state.diagnostics.statusEffectMeta?.actionCounts||{}}});
    const canonicalClassification=typeof validateStatusEffectCanonicalClassificationDiagnostic==='function'?validateStatusEffectCanonicalClassificationDiagnostic():{ok:false,error:'missing function'};
    checks.push({name:'状態変化分類JSON正本整合',ok:!!canonicalClassification.ok,detail:canonicalClassification});
  try{
    const typoSmoke=collectStatusEffectRelationsFromText('自身1部隊にかかる一部の能力弱化効果（攻撃）と委縮を避ける',['萎縮','攻撃低下']);
    const labels=typoSmoke.map(v=>v.name);
    checks.push({name:'委縮誤記の萎縮正規化',ok:labels.includes('萎縮')&&!labels.includes('委縮'),actual:labels,policy:'クローリングデータ由来の委縮は内部で萎縮へ正規化し、UI/関連リンク表示には委縮を出さない'});
  }catch(err){checks.push({name:'委縮誤記の萎縮正規化',ok:false,error:err?.message||String(err)});}

  const relatedBoundarySmoke=typeof validateRelatedLinkSourceBoundarySmoke==='function'?validateRelatedLinkSourceBoundarySmoke():{ok:false,error:'missing function'};
  checks.push({name:'関連リンク入力境界:LR張飛の攻略コメント混入防止',ok:!!relatedBoundarySmoke.ok,detail:relatedBoundarySmoke});
  const relatedAnnotationLeakAudit=typeof validateDerivedRelatedLinkAnnotationLeakDiagnostic==='function'?validateDerivedRelatedLinkAnnotationLeakDiagnostic():{ok:false,error:'missing function'};
  checks.push({name:'派生JSON注記・条件参照混入診断',ok:!!relatedAnnotationLeakAudit.ok,detail:relatedAnnotationLeakAudit});
  const generalSkillBoundarySmoke=typeof validateGeneralSkillSourceBoundarySmoke==='function'?validateGeneralSkillSourceBoundarySmoke():{ok:false,error:'missing function'};
  checks.push({name:'関連リンク入力境界:LR田豊の攻略コメント技能混入防止',ok:!!generalSkillBoundarySmoke.ok,detail:generalSkillBoundarySmoke});
  const targetSideGateSmoke=typeof validateStatusEffectTargetSideGateSmoke==='function'?validateStatusEffectTargetSideGateSmoke():{ok:false,error:'missing function'};
  checks.push({name:'状態変化対象部隊ゲート:LR夏侯惇の戦法遅延分類',ok:!!targetSideGateSmoke.ok,detail:targetSideGateSmoke});
  const quickOwnerFavoriteSmoke=typeof validateQuickOwnerFavoriteRefreshSmoke==='function'?validateQuickOwnerFavoriteRefreshSmoke():{ok:false,error:'missing function'};
  checks.push({name:'クイック検索中のお気に入り切替0件落ち防止',ok:!!quickOwnerFavoriteSmoke.ok,detail:quickOwnerFavoriteSmoke});
  const quickOwnerReasonFilenameSmoke=typeof validateQuickOwnerReasonNoInternalFilenameSmoke==='function'?validateQuickOwnerReasonNoInternalFilenameSmoke():{ok:false,error:'missing function'};
  checks.push({name:'一覧選定理由の内部JSONファイル名非表示',ok:!!quickOwnerReasonFilenameSmoke.ok,detail:quickOwnerReasonFilenameSmoke});
  const extensionSearchSmoke=typeof validateHadouExtensionSearchTextSmoke==='function'?validateHadouExtensionSearchTextSmoke():{ok:false,error:'missing function'};
  checks.push({name:'兵器・武装詳細内容の検索対象化',ok:!!extensionSearchSmoke.ok,detail:extensionSearchSmoke});
  const warhorseDetailObjectSmoke=typeof validateWarhorseMasterDetailObjectSmoke==='function'?validateWarhorseMasterDetailObjectSmoke():{ok:false,error:'missing function'};
  checks.push({name:'名馬詳細の将星効果表示整形',ok:!!warhorseDetailObjectSmoke.ok,detail:warhorseDetailObjectSmoke});
  const formationWeaponJijuSmoke=typeof validateFormationWeaponAndJijuConditionSmoke==='function'?validateFormationWeaponAndJijuConditionSmoke():{ok:false,error:'missing function'};
  checks.push({name:'武将本人技能の武器候補拡張と侍従条件',ok:!!formationWeaponJijuSmoke.ok,detail:formationWeaponJijuSmoke});
  const formationJijuPrioritySmoke=typeof validateFormationJijuSinglePositionFirstSmoke==='function'?validateFormationJijuSinglePositionFirstSmoke():{ok:false,error:'missing function'};
  checks.push({name:'侍従配置優先度:単一候補優先',ok:!!formationJijuPrioritySmoke.ok,detail:formationJijuPrioritySmoke});
  const formationRangeOrderSmoke=typeof validateFormationRangeAndResultOrderSmoke==='function'?validateFormationRangeAndResultOrderSmoke():{ok:false,error:'missing function'};
  checks.push({name:'部隊の射程と結果表示順',ok:!!formationRangeOrderSmoke.ok,detail:formationRangeOrderSmoke});
  const formationRangeConditionGateSmoke=typeof validateFormationRangeConditionGateSmoke==='function'?validateFormationRangeConditionGateSmoke():{ok:false,error:'missing function'};
  checks.push({name:'射程条件ゲート:練射型条件',ok:!!formationRangeConditionGateSmoke.ok,detail:formationRangeConditionGateSmoke});
  const formationTacticGaugeCapSmoke=typeof validateFormationTacticGaugeCapSmoke==='function'?validateFormationTacticGaugeCapSmoke():{ok:false,error:'missing function'};
  checks.push({name:'戦法ゲージ状態変化率の上限50%',ok:!!formationTacticGaugeCapSmoke.ok,detail:formationTacticGaugeCapSmoke});

  const tacticDetailSmoke=typeof validateTacticDetailRenderedHtmlSmoke==='function'?validateTacticDetailRenderedHtmlSmoke():{ok:false,error:'missing function'};
  checks.push({name:'戦法詳細内容詳細の武将戦法フォーマット互換',ok:!!tacticDetailSmoke.ok,detail:tacticDetailSmoke});
  const skillDetailTabSmoke=typeof validateSkillDetailTabRenderedHtmlSmoke==='function'?validateSkillDetailTabRenderedHtmlSmoke():{ok:false,error:'missing function'};
  checks.push({name:'関連リンク遷移後の技能内容詳細表示',ok:!!skillDetailTabSmoke.ok,detail:skillDetailTabSmoke});
  const skillDetailAutoSelectSmoke=typeof validateSkillDetailAutoSelectTabPolicySmoke==='function'?validateSkillDetailAutoSelectTabPolicySmoke():{ok:false,error:'missing function'};
  checks.push({name:'技能検索自動選択時の内容詳細タブ保持',ok:!!skillDetailAutoSelectSmoke.ok,detail:skillDetailAutoSelectSmoke});
  try{
    const atkSpeedProfile=getStatusEffectProfile('攻撃速度変化(強化)');
    const atkSpeedRelated=collectRelatedItemsForStatusEffect('tactics',atkSpeedProfile);
    checks.push({name:'状態変化関連リンク実データ:攻撃速度変化(強化)→戦法',ok:atkSpeedRelated.names.length>0,actual:atkSpeedRelated.names.length,sample:atkSpeedRelated.names.slice(0,12)});
  }catch(err){checks.push({name:'状態変化関連リンク実データ:攻撃速度変化(強化)→戦法',ok:false,error:err?.message||String(err)});}
  const skillLevelSmoke=typeof runGeneralSkillLevelExtractionSmoke==='function'?runGeneralSkillLevelExtractionSmoke():{ok:false,error:'missing function'};
  checks.push({name:'武将技能Lv抽出の能力値誤検出防止',ok:!!skillLevelSmoke.ok,detail:skillLevelSmoke});
  try{
    const sample=arms.find(item=>norm(item.additionalEffect||item.additionalEffectDescription||''))||siege.find(item=>norm(item.additionalEffect||item.additionalEffectDescription||''));
    if(sample){
      const selectionKey=arms.includes(sample)?'ethnicArmament':'siegeWeapon';
      const level=getHadouExtensionSelectedLevel(sample);
      parseFormationExtensionAdditionalEffects({selectionKey,categoryKey:getFormationExtensionCategory(selectionKey),item:sample,name:getItemDisplayName(sample),level,levelData:getHadouExtensionLevelData(sample,level),kind:selectionKey==='ethnicArmament'?'武装':'兵器'});
    }
    checks.push({name:'兵器・武装追加効果抽出実行',ok:true});
  }catch(err){
    checks.push({name:'兵器・武装追加効果抽出実行',ok:false,error:err?.message||String(err)});
  }
  const ethnicResearch=Array.isArray(state.ethnicResearchSkills)?state.ethnicResearchSkills:[];
  checks.push({name:'異文化調査専用技能32件',ok:ethnicResearch.length===32,actual:ethnicResearch.length,expected:32});
  checks.push({name:'異文化調査専用技能名',ok:!ethnicResearch.some(item=>/守兵/.test(getItemDisplayName(item))),forbidden:'守兵'});
  const responseNames=['羌呼応','鮮卑呼応','烏桓呼応','南蛮呼応','五渓呼応','山越呼応'];
  const responseMissing=responseNames.filter(name=>!ethnicResearch.some(item=>getItemDisplayName(item)===name));
  const responseLevelProblems=responseNames.map(name=>{
    const item=ethnicResearch.find(x=>getItemDisplayName(x)===name);
    const levels=(Array.isArray(item?.levels)?item.levels:[]).map(lv=>Number(lv?.level)||0).sort((a,b)=>a-b);
    const ok=levels.join(',')==='1,2,3,4,5';
    return {name,ok,levels};
  }).filter(x=>!x.ok);
  checks.push({name:'呼応系6技能の存在',ok:responseMissing.length===0,missing:responseMissing});
  checks.push({name:'呼応系LvⅠ〜Ⅴ',ok:responseLevelProblems.length===0,problems:responseLevelProblems});
  const lv4OnlyProblems=ethnicResearch.map(item=>{
    const levels=(Array.isArray(item?.levels)?item.levels:[]).map(lv=>Number(lv?.level)||0).filter(Boolean).sort((a,b)=>a-b);
    const maxLevel=levels.length?levels[levels.length-1]:0;
    const declaredMax=Number(item?.maxLevel)||maxLevel;
    return {name:getItemDisplayName(item),levels,declaredMax,maxLevel,ok:!(maxLevel===4||declaredMax===4)};
  }).filter(x=>!x.ok);
  checks.push({name:'専用技能Lv4止まり禁止',ok:lv4OnlyProblems.length===0,problems:lv4OnlyProblems});
  const skillDataset=Array.isArray(state.skills)?state.skills:[];
  const ethnicSkillIntegrated=responseNames.every(name=>skillDataset.some(item=>getItemDisplayName(item)===name&&item?.isEthnicResearchSkill));
  const ethnicSkillSearchSmoke=['烏桓','羌','五渓'].map(keyword=>{
    const matched=skillDataset.filter(item=>item?.isEthnicResearchSkill&&getItemDisplayName(item).includes(keyword)).map(getItemDisplayName);
    return {keyword,matchedCount:matched.length,matched};
  });
  checks.push({name:'専用技能の技能カテゴリ統合',ok:ethnicSkillIntegrated,smoke:ethnicSkillSearchSmoke});
  const settingLabelSource=renderEthnicResearchSkillSettingCard(ethnicResearch.find(item=>getItemDisplayName(item)==='烏桓呼応')||ethnicResearch[0]||{});
  checks.push({name:'専用技能詳細ラベル',ok:settingLabelSource.includes('技能解放')&&settingLabelSource.includes('解放Lv')&&!settingLabelSource.includes('保存設定')&&!settingLabelSource.includes('設定Lv')});
  const allModeInitialOk=(()=>{const prevView=state.viewMode,prevStage=state.generalStage;try{state.viewMode='all';state.generalStage='initial';const html=renderEthnicResearchSkillSettingCard(ethnicResearch[0]||{});return html.includes('disabled')&&!html.includes('checked disabled')&&html.includes('value="Ⅰ" selected');}finally{state.viewMode=prevView;state.generalStage=prevStage;}})();
  const allModeMaxOk=(()=>{const prevView=state.viewMode,prevStage=state.generalStage;try{state.viewMode='all';state.generalStage='max';const html=renderEthnicResearchSkillSettingCard(ethnicResearch[0]||{});return html.includes('checked disabled')&&html.includes('selected');}finally{state.viewMode=prevView;state.generalStage=prevStage;}})();
  checks.push({name:'全データ武将連動の専用技能固定表示',ok:allModeInitialOk&&allModeMaxOk,initial:allModeInitialOk,max:allModeMaxOk});
  const formationIntegration=validateEthnicResearchFormationIntegration();
  checks.push({name:'専用技能の部隊編成反映',ok:formationIntegration.ok,detail:formationIntegration});
  const saveRoundtrip=validateEthnicResearchSaveDataRoundtrip();
  checks.push({name:'専用技能Export/Import互換',ok:saveRoundtrip.ok,detail:saveRoundtrip});
      checks.push({name:'兵器・武装パラメータは合算技能外表示',ok:typeof renderFormationSelectedExtensionParameterBlocks==='function',note:'rendered after formationSkillSummaryHtml, outside 合算技能 details'});
  const expectedFormationSkillOrder=['LR固有','継承','UR固有','将星4成長','将星7覚醒','その他','将星2成長','異文化調査','参軍','五行','軍馬','陣形','装備'];
  const sourceOrderOk=expectedFormationSkillOrder.every((name,idx,arr)=>idx===0||FORMATION_SKILL_SOURCE_ORDER.indexOf(arr[idx-1])<FORMATION_SKILL_SOURCE_ORDER.indexOf(name));
  checks.push({name:'合算技能表示順',ok:sourceOrderOk,order:FORMATION_SKILL_SOURCE_ORDER,expected:expectedFormationSkillOrder});
  const warhorseFunctionOk=typeof collectActiveWarhorseFormationEffects==='function'&&typeof getWarhorseSkillById==='function'&&typeof addWarhorseNumericEffects==='function';
  checks.push({name:'軍馬の部隊編成合算反映ヘルパー',ok:warhorseFunctionOk,detail:{collect:typeof collectActiveWarhorseFormationEffects,skillLookup:typeof getWarhorseSkillById,effectAdd:typeof addWarhorseNumericEffects}});
  checks.push({name:'軍馬編成画面の部隊割当UI',ok:typeof renderWarhorseAssignmentPanelHtml==='function'&&typeof setFormationWarhorseSlot==='function'&&typeof getWarhorseAssignmentOptionLabel==='function'&&typeof openFormationWarhorseEditFromSlot==='function',detail:{assignmentPanel:typeof renderWarhorseAssignmentPanelHtml,setSlot:typeof setFormationWarhorseSlot,optionLabel:typeof getWarhorseAssignmentOptionLabel,editFromAssignment:true,editFromFormationSlot:true,normalHorseMasterHidden:true}});
  const warhorseFormationIntegration=typeof validateWarhorseFormationIntegration==='function'?validateWarhorseFormationIntegration():{ok:false,error:'missing function'};
  checks.push({name:'軍馬の部隊編成実データ反映',ok:!!warhorseFormationIntegration.ok,detail:warhorseFormationIntegration});
  const warhorseCopyRoundtrip=typeof validateWarhorseSaveCopyRoundtrip==='function'?validateWarhorseSaveCopyRoundtrip():{ok:false,error:'missing function'};
  checks.push({name:'軍馬保存データコピー互換',ok:!!warhorseCopyRoundtrip.ok,detail:warhorseCopyRoundtrip});
  const effectDiagnostics=buildEthnicResearchEffectDiagnostics();
  checks.push({name:'専用技能効果診断',ok:true,detail:effectDiagnostics.counts,note:'diagnostic only; unsupported/non-numeric effects are reported in Debug Log and do not fail validation'});
  const integrationDetail=validateEthnicResearchFormationIntegration();
  checks.push({name:'専用技能反映ログ分類',ok:true,detail:integrationDetail.max?.effectDiagnostics||{},note:'diagnostic only; adopted/excluded effect counts are logged for investigation'});
  const warhorseDeleteUiOk=typeof buildWarhorseDeleteConfirmBarHtml==='function'&&typeof deleteOwnedWarhorseById==='function'&&!deleteOwnedWarhorseById.toString().includes('confirmed=explicitConfirmed||pendingMatch')&&!deleteOwnedWarhorseById.toString().includes('inline-confirm-card');
  checks.push({name:'軍馬削除UIは下部固定確認バー方式',ok:warhorseDeleteUiOk,detail:{hasBottomBarBuilder:typeof buildWarhorseDeleteConfirmBarHtml==='function',doubleTapRemoved:typeof deleteOwnedWarhorseById==='function'&&!deleteOwnedWarhorseById.toString().includes('confirmed=explicitConfirmed||pendingMatch'),inlineConfirmRemoved:typeof deleteOwnedWarhorseById==='function'&&!deleteOwnedWarhorseById.toString().includes('inline-confirm-card')}});
  const warhorseUndoToastLifecycleOk=typeof clearWarhorseUndoToast==='function'&&typeof dismissWarhorseUndoToast==='function'&&typeof scheduleWarhorseUndoToastAutoHide==='function'&&buildWarhorseUndoToastHtml.toString().includes('warhorseDismissUndoBtn')&&scheduleWarhorseUndoToastAutoHide.toString().includes('5000');
  checks.push({name:'軍馬削除後の元に戻す通知ライフサイクル',ok:warhorseUndoToastLifecycleOk,detail:{hasClear:typeof clearWarhorseUndoToast==='function',hasDismiss:typeof dismissWarhorseUndoToast==='function',hasCloseButton:buildWarhorseUndoToastHtml.toString().includes('warhorseDismissUndoBtn'),autoHideMs:5000}});
  const whRoundtrip=sanitizeWarhorseEntry({id:'wh_test',name:'軍馬技能保存テスト',horseMasterId:'絶影',star:4,favorite:true,skills:[{skillId:'騎・速撃',level:3,slotIndex:0},{skillId:'騎・速撃',level:2,slotIndex:1},{skillId:'騎・大固',level:5,slotIndex:2}]});
  const warhorseNormalSkillRoundtripOk=Array.isArray(whRoundtrip.skills)&&whRoundtrip.skills.length===3&&whRoundtrip.skills[0].skillId==='騎・速撃'&&whRoundtrip.skills[1].skillId==='騎・速撃'&&whRoundtrip.skills[1].level===2&&Array.isArray(whRoundtrip.normalSkills)&&whRoundtrip.normalSkills.length===3;
  checks.push({name:'軍馬通常技能3枠保存ラウンドトリップ',ok:warhorseNormalSkillRoundtripOk,detail:{skillCount:whRoundtrip.skills?.length||0,normalSkillCount:whRoundtrip.normalSkills?.length||0,slotsEqual:areWarhorseSkillSlotsEqual(whRoundtrip.skills,whRoundtrip.normalSkills),skills:whRoundtrip.skills}});
  checks.push({name:'軍馬編集保存の連続実行抑止',ok:typeof buildWarhorseEditorSaveSignature==='function'&&typeof setWarhorseSaveButtonState==='function'});
  const warhorseUiSource=(typeof buildWarhorseEditorHtml==='function'?buildWarhorseEditorHtml.toString():'')+(typeof buildWarhorseCompactCardHtml==='function'?buildWarhorseCompactCardHtml.toString():'');
  checks.push({name:'軍馬UI簡素化',ok:!warhorseUiSource.includes('warhorseEditMaster')&&!warhorseUiSource.includes('warhorseEditFavorite')&&!warhorseUiSource.includes('warhorse-edit-mini')&&warhorseUiSource.includes('warhorse-kind-chip')&&!warhorseUiSource.includes('鹿毛')&&!warhorseUiSource.includes('白毛'),detail:{masterEditRemoved:!warhorseUiSource.includes('warhorseEditMaster'),favoriteRemoved:!warhorseUiSource.includes('warhorseEditFavorite'),kindLabelKept:warhorseUiSource.includes('warhorse-kind-chip'),hairColorRemoved:!warhorseUiSource.includes('鹿毛')&&!warhorseUiSource.includes('白毛'),listEditLabelRemoved:!warhorseUiSource.includes('warhorse-edit-mini')}});
  const formationMobileSource=(typeof renderFormationMobileSelectHtml==='function'?renderFormationMobileSelectHtml.toString():'')+(typeof setupFormationEvents==='function'?setupFormationEvents.toString():'');
  const formationMobileStyleSource=Array.from(document.querySelectorAll('style')).map(s=>s.textContent||'').join('\n');
  const formationMobileButtons=['formationMobileNewBtn','formationMobileDuplicateBtn','formationMobileDeleteBtn','formationMobileSaveBtn'];
  const formationMobileButtonsRendered=formationMobileButtons.every(id=>formationMobileSource.includes(id));
  const formationMobileHandlersBound=formationMobileButtons.every(id=>formationMobileSource.includes("getElementById('"+id+"')"));
  const formationMobileActionsVisible=!/body\.formation-tab\s+\.formation-mobile-actions\s*\{\s*display\s*:\s*none\s*!important/i.test(formationMobileStyleSource)&&/body\.formation-tab\s+\.formation-mobile-actions\s*\{[^}]*display\s*:\s*(grid|flex)\s*!important/i.test(formationMobileStyleSource);
  checks.push({name:'スマホ部隊編成操作ボタン表示',ok:formationMobileButtonsRendered&&formationMobileHandlersBound&&formationMobileActionsVisible,detail:{buttonsRendered:formationMobileButtonsRendered,handlersBound:formationMobileHandlersBound,actionsVisibleCss:formationMobileActionsVisible,buttons:formationMobileButtons}});
const criticalNames=new Set(['戦法追加効果の攻撃速度変化リンク判定','戦法追加効果の能力変化・即時系リンク判定','戦法詳細内容詳細の武将戦法フォーマット互換','関連リンク遷移後の技能内容詳細表示','関連リンク入力境界:LR張飛の攻略コメント混入防止','武将技能Lv抽出の能力値誤検出防止','兵器6件','武装18件','訂正済み武装名','兵器Lv範囲','武装Lv範囲','異文化調査専用技能32件','異文化調査専用技能名','呼応系6技能の存在','呼応系LvⅠ〜Ⅴ','専用技能Lv4止まり禁止','軍馬削除UIは下部固定確認バー方式','軍馬削除後の元に戻す通知ライフサイクル','軍馬の部隊編成実データ反映','軍馬保存データコピー互換','軍馬通常技能3枠保存ラウンドトリップ','軍馬編集保存の連続実行抑止','軍馬UI簡素化','スマホ部隊編成操作ボタン表示','兵器・武装詳細内容の検索対象化','名馬詳細の将星効果表示整形','武将本人技能の武器候補拡張と侍従条件','侍従配置優先度:単一候補優先','部隊の射程と結果表示順']);
  const criticalFailures=checks.filter(c=>criticalNames.has(c.name)&&!c.ok);
  const diagnosticFailures=checks.filter(c=>!criticalNames.has(c.name)&&!c.ok);
  if(diagnosticFailures.length)debugLog('validation:hadouExtensions-diagnostic-not-critical',{count:diagnosticFailures.length,items:diagnosticFailures});
  debugLog('validation:hadouExtensions-critical-summary',{criticalFailureCount:criticalFailures.length,criticalFailures,diagnosticFailureCount:diagnosticFailures.length});
  return {ok:criticalFailures.length===0,checks,criticalFailures,diagnosticFailures,counts:{siegeWeapons:siege.length,ethnicArmaments:arms.length,ethnicResearchSkills:ethnicResearch.length,skills:skillDataset.length},armamentEthnicGroups:uniq(arms.map(item=>item.ethnicGroup).filter(Boolean)),armamentTroopTypes:uniq(arms.map(item=>item.troopType).filter(Boolean)),ethnicResearchSkillNames:ethnicResearch.map(item=>getItemDisplayName(item)),ethnicResearchSkillSearchSmoke:ethnicSkillSearchSmoke};
}
function getValidationEngineSourceForSelfCheck(){try{const script=getValidationScriptText();const start=script.indexOf('function validateVersionConsistency');const end=script.indexOf('async function handleRunValidationSelfCheck');if(start<0||end<0||end<=start)return '';return script.slice(start,end);}catch{return '';}}
function validateValidationEngineSelfCheck(){
  const source=getValidationEngineSourceForSelfCheck();
  const fixedVersionLiterals=[];
  const fixedShaLiterals=[];
  for(const m of source.matchAll(/['"`]((?:hado_library_)?\d+\.\d+\.\d+\.\d+(?:\.html)?)['"`]/g))fixedVersionLiterals.push(m[1]);
  for(const m of source.matchAll(/['"`]([a-f0-9]{64})['"`]/g))fixedShaLiterals.push(m[1]);
  const legacyExportMarkerNames=['literal'+'Export'+'Markers','dynamic'+'Export'+'Markers'];
  const hasLegacyExportStringSearch=/script\.includes\([^)]*exportVersion/.test(source)||legacyExportMarkerNames.some(token=>source.includes(token));
  const forbiddenPatterns=[
    {name:'hardcoded baseVersion comparison',ok:!/(baseVersion\s*={2,3}\s*['"`]\d+\.\d+\.\d+\.\d+['"`])/.test(source)},
    {name:'hardcoded baseSha256 comparison',ok:!/(baseSha256\s*={2,3}\s*['"`][a-f0-9]{64}['"`])/.test(source)},
    {name:'script string exportVersion search',ok:!hasLegacyExportStringSearch},
    {name:'fixed version literals in validation engine',ok:fixedVersionLiterals.length===0,actual:fixedVersionLiterals},
    {name:'fixed sha literals in validation engine',ok:fixedShaLiterals.length===0,actual:fixedShaLiterals}
  ];
  return {ok:!!source&&forbiddenPatterns.every(x=>x.ok),checks:forbiddenPatterns,sourceLength:source.length};
}
function summarizeValidationWarnings(parts){
  const warnings=[];
  if(parts.horizontalOverflow?.hasHorizontalOverflow)warnings.push({name:'horizontal overflow',amount:parts.horizontalOverflow.overflowAmount||0,samples:parts.horizontalOverflow.overflowSamples||[]});
  if(parts.hadouExtensions?.skipped)warnings.push({name:'hadou extension dataset check skipped',reason:parts.hadouExtensions.reason||''});if(parts.hadouExtensions&&parts.hadouExtensions.rawOk===false)warnings.push({name:'hadou extension diagnostics not clean',criticalFailures:parts.hadouExtensions.criticalFailures||[],diagnosticFailures:parts.hadouExtensions.diagnosticFailures||[]});
  return warnings;
}
function summarizeValidationInfo(parts){
  const info=[];
  if(parts.domIds?.optionalMissing?.length)info.push({name:'optional DOM not generated in current UI state',count:parts.domIds.optionalMissing.length,items:parts.domIds.optionalMissing});
  return info;
}
function ensureValidationResultDialogShell(){
  let overlay=document.getElementById('validationResultDialogOverlay');
  if(overlay)return overlay;
  overlay=document.createElement('div');
  overlay.id='validationResultDialogOverlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.48);display:none;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML='<div role="dialog" aria-modal="true" aria-labelledby="validationResultDialogTitle" style="width:min(680px,100%);max-height:86vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(15,23,42,.28);border:1px solid #cbd5e1;"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid #e2e8f0"><strong id="validationResultDialogTitle">検証実行結果</strong><div style="display:flex;gap:8px;align-items:center"><button type="button" id="validationResultDialogCancel" class="copy-btn" style="display:none">キャンセル</button><button type="button" id="validationResultDialogClose" class="copy-btn">閉じる</button></div></div><div id="validationProgressWrap" style="display:none;padding:12px 14px;border-bottom:1px solid #e2e8f0;background:#f8fafc"><div id="validationProgressText" class="note" style="margin-bottom:6px">検証中…</div><progress id="validationProgressBar" value="0" max="100" style="width:100%;height:12px"></progress></div><pre id="validationResultDialogBody" style="white-space:pre-wrap;word-break:break-word;margin:0;padding:14px;font-size:12px;line-height:1.55;color:#0f172a;background:#f8fafc"></pre></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click',ev=>{if(ev.target===overlay){if(state._validationRunning)state._validationCancelRequested=true;overlay.style.display='none';}});
  const close=overlay.querySelector('#validationResultDialogClose');
  if(close)close.addEventListener('click',()=>{if(state._validationRunning)state._validationCancelRequested=true;overlay.style.display='none';});
  const cancel=overlay.querySelector('#validationResultDialogCancel');
  if(cancel)cancel.addEventListener('click',()=>{state._validationCancelRequested=true;cancel.textContent='キャンセル要求済み';});
  return overlay;
}
function setValidationProgress(percent,label){
  const overlay=ensureValidationResultDialogShell();
  const wrap=overlay.querySelector('#validationProgressWrap');
  const bar=overlay.querySelector('#validationProgressBar');
  const text=overlay.querySelector('#validationProgressText');
  const cancel=overlay.querySelector('#validationResultDialogCancel');
  if(wrap)wrap.style.display='block';
  if(bar)bar.value=Math.max(0,Math.min(100,Number(percent)||0));
  if(text)text.textContent=`検証中 ${Math.round(Number(percent)||0)}%：${label||''}`;
  if(cancel){cancel.style.display='';cancel.textContent='キャンセル';}
}
function finishValidationProgress(){
  const overlay=ensureValidationResultDialogShell();
  const wrap=overlay.querySelector('#validationProgressWrap');
  const cancel=overlay.querySelector('#validationResultDialogCancel');
  if(wrap)wrap.style.display='none';
  if(cancel)cancel.style.display='none';
}
function buildValidationDialogMessage(result){
  // FIX[HADO-2.7.3.52-VALIDATION-COMPLETE-DIALOG]: 100%到達後に未定義関数で停止しないよう、結果表示を軽量サマリーで生成する。
  if(!result)return '検証結果を取得できませんでした。';
  const lines=[];
  const status=result.cancelled?'キャンセル':(result.ok?'OK':'NG');
  lines.push('検証実行結果：'+status);
  lines.push('version: '+(result.version||HADO_BUILD_INFO.version));
  lines.push('context: '+(result.context||''));
  lines.push('timestamp: '+(result.timestamp||debugTimestamp()));
  if(result.error)lines.push('error: '+result.error);
  const failures=Array.isArray(result.criticalFailures)?result.criticalFailures:[];
  lines.push('criticalFailures: '+failures.length);
  failures.slice(0,12).forEach(f=>{
    const name=f&&f.name?f.name:'unknown';
    const missing=Array.isArray(f&&f.missing)&&f.missing.length?' / missing: '+f.missing.slice(0,8).join(', '):'';
    const error=f&&f.error?' / error: '+f.error:'';
    const diag=Array.isArray(f&&f.diagnosticFailures)&&f.diagnosticFailures.length?' / diagnosticFailures: '+f.diagnosticFailures.slice(0,3).map(d=>d.name||'unknown').join(', '):'';
    lines.push('- '+name+missing+error+diag);
  });
  if(failures.length>12)lines.push('- ... '+(failures.length-12)+'件省略');
  lines.push('warnings: '+(Array.isArray(result.warnings)?result.warnings.length:0));
  lines.push('info: '+(Array.isArray(result.info)?result.info.length:0));
  lines.push('');
  lines.push('詳細は「ログコピー」で取得してください。画面には巨大JSONを描画しません。');
  return lines.join('\n');
}
function showValidationResultDialog(result,message){
  // FIX[HADO-2.7.3.52-VALIDATION-COMPLETE-DIALOG]: 完了時に進捗UIを閉じ、軽量結果だけを表示する。
  const overlay=ensureValidationResultDialogShell();
  const body=overlay.querySelector('#validationResultDialogBody');
  const title=overlay.querySelector('#validationResultDialogTitle');
  finishValidationProgress();
  if(title)title.textContent=result?.cancelled?'検証キャンセル':(result?.ok?'検証完了':'検証完了（要確認）');
  if(body)body.textContent=message||buildValidationDialogMessage(result);
  overlay.style.display='flex';
}
function validationYield(){return new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));}
async function runEnhancedValidationSelfCheckAsync(context='manual',progressCb=()=>{}){
  // FIX[HADO-2.7.3.50-VALIDATION-PROGRESS-NONBLOCKING]: 検証を段階分割し、進捗表示とUI yieldを挟む。同期一括実行でフリーズさせない。
  const parts={};
  const runStep=async(key,label,startPercent,endPercent,fn)=>{
    progressCb(startPercent,label+' 実行中');
    await validationYield();
    if(state._validationCancelRequested)throw new Error('validation-cancelled');
    const started=performance.now();
    const value=fn();
    parts[key]=value;
    progressCb(endPercent,label+' 完了（'+Math.round(performance.now()-started)+'ms）');
    await validationYield();
    return value;
  };
  try{
    await runStep('regression','回帰チェック',3,10,()=>runRegressionSelfCheck(context+':regression'));
    await runStep('stability','安定性チェック',10,20,()=>safeRunStabilitySelfCheck(context+':stability'));
    await runStep('versionConsistency','バージョン整合性',20,30,()=>validateVersionConsistency());
    ensureValidationResultDialogShell();
    await runStep('domIds','DOM ID検証',30,40,()=>validateDomIdCoverage());
    await runStep('functions','関数参照検証',40,52,()=>validateFunctionReferenceCoverage());
    await runStep('jsonCompatibility','JSON互換検証',52,62,()=>validateJsonCompatibility());
    await runStep('typeSearchReleaseReadiness','型検索正式版品質ゲート',62,69,()=>validateTypeSearchReleaseReadinessDiagnostic(state.derivedData,{context:context+':type-search-release'}));
    const hadouExtensionsRaw=await runStep('hadouExtensionsRaw','覇道拡張データ検証（最も時間がかかる工程）',69,80,()=>validateHadouExtensionDatasets());
    const hadouDiagnosticFailures=Array.isArray(hadouExtensionsRaw?.diagnosticFailures)?hadouExtensionsRaw.diagnosticFailures:[];
    parts.hadouExtensions={...hadouExtensionsRaw,ok:!!hadouExtensionsRaw?.ok&&hadouDiagnosticFailures.length===0,rawOk:hadouExtensionsRaw?.ok,diagnosticFailureCount:hadouDiagnosticFailures.length,policy:'HADO-2.7.3.53: diagnosticFailuresをOK扱いしない。検出済みデグレはcriticalFailuresへ昇格する。'};
    await validationYield();
    await runStep('saveData','保存データ検証',80,86,()=>validateSaveDataStability());
    await runStep('formationData','部隊編成データ検証',86,91,()=>validateFormationDataStability());
    await runStep('horizontalOverflow','横スクロール検証',91,95,()=>getHorizontalOverflowDiagnostics(context+':horizontal-overflow'));
    await runStep('validationEngine','検証エンジン検証',95,98,()=>validateValidationEngineSelfCheck());
    progressCb(99,'結果整形 実行中');await validationYield();
    const criticalChecks={versionConsistency:parts.versionConsistency,domIds:parts.domIds,functions:parts.functions,jsonCompatibility:parts.jsonCompatibility,typeSearchReleaseReadiness:parts.typeSearchReleaseReadiness,hadouExtensions:parts.hadouExtensions,saveData:parts.saveData,formationData:parts.formationData,regression:parts.regression,stability:parts.stability,validationEngine:parts.validationEngine};
    const criticalFailures=Object.entries(criticalChecks).filter(([,value])=>!value?.ok).map(([name,value])=>({name,missing:value?.missing||[],error:value?.error||'',diagnosticFailures:value?.diagnosticFailures||[]}));
    const warnings=summarizeValidationWarnings({domIds:parts.domIds,horizontalOverflow:parts.horizontalOverflow,hadouExtensions:parts.hadouExtensions});
    const info=summarizeValidationInfo({domIds:parts.domIds});
    const result={version:HADO_BUILD_INFO.version,context,timestamp:debugTimestamp(),validationPolicy:{okMeans:'critical checks only',warningsDoNotFail:true,versionTracking:'derived from HADO_BUILD_INFO.version / FILE_META.fileName',exportVersionCheck:'actual export payload, not HTML string search',execution:'async-progress-yield'},versionConsistency:parts.versionConsistency,domIds:parts.domIds,functions:parts.functions,jsonCompatibility:parts.jsonCompatibility,typeSearchReleaseReadiness:parts.typeSearchReleaseReadiness,hadouExtensions:parts.hadouExtensions,saveData:parts.saveData,formationData:parts.formationData,horizontalOverflow:parts.horizontalOverflow,regression:parts.regression,stability:parts.stability,validationEngine:parts.validationEngine,criticalFailures,warnings,warningCount:warnings.length,info,infoCount:info.length,runtimeLimitations:['ZIP内HTMLと単体HTMLのSHA-256一致、ZIP構造、ファイルシステム上のJSON妥当性は配布生成時の外部チェックで確認する。ブラウザ実行時は現在読み込まれたHTML/JSON状態のみ検証する。']};
    result.ok=criticalFailures.length===0;
    state.diagnostics.validation=result;
    progressCb(100,'検証完了');
    await validationYield();
    debugLog('validation:enhanced-self-check-async',{ok:result.ok,criticalFailures:criticalFailures.length,warnings:warnings.length,info:info.length});
    return result;
  }catch(err){
    const cancelled=String(err?.message||err)==='validation-cancelled';
    const result={version:HADO_BUILD_INFO.version,context,timestamp:debugTimestamp(),ok:false,cancelled,error:cancelled?'検証はキャンセルされました。':String(err?.message||err),partial:parts};
    state.diagnostics.validation=result;
    return result;
  }
}
async function handleRunValidationSelfCheck(){
  if(state._validationRunning)return;
  state._validationRunning=true;
  state._validationCancelRequested=false;
  const overlay=ensureValidationResultDialogShell();
  const body=overlay.querySelector('#validationResultDialogBody');
  overlay.style.display='flex';
  if(body)body.textContent='検証を開始しています…';
  if(els.runValidationBtn){els.runValidationBtn.disabled=true;els.runValidationBtn.textContent='検証中…';}
  try{
    const result=await runEnhancedValidationSelfCheckAsync('manual-button',setValidationProgress);
    state._debugPanelExtraText='=== Manual Validation Summary ===\n'+buildValidationDialogMessage(result);
    const message=buildValidationDialogMessage(result);
    showValidationResultDialog(result,message);
    return result;
  }finally{
    state._validationRunning=false;
    state._validationCancelRequested=false;
    if(els.runValidationBtn){els.runValidationBtn.disabled=false;els.runValidationBtn.textContent='検証実行';}
  }
}
function runRegressionSelfCheck(context='manual'){
  const fnResults=REGRESSION_SELF_CHECK_SPEC.requiredFunctions.map(name=>({name,ok:typeof getFunctionByNameForRegression(name)==='function'}));
  const elResults=REGRESSION_SELF_CHECK_SPEC.requiredElements.map(name=>({name,ok:!!getElementByNameForRegression(name)}));
  const html=document.documentElement?document.documentElement.textContent:'';
  const textResults=REGRESSION_SELF_CHECK_SPEC.requiredTexts.map(text=>({text,ok:html.includes(text)}));
  const result={
    version:REGRESSION_SELF_CHECK_SPEC.version,
    context,
    timestamp:debugTimestamp(),
    functions:{ok:fnResults.every(r=>r.ok),missing:fnResults.filter(r=>!r.ok).map(r=>r.name),checked:fnResults.length},
    elements:{ok:elResults.every(r=>r.ok),missing:elResults.filter(r=>!r.ok).map(r=>r.name),checked:elResults.length},
    texts:{ok:textResults.every(r=>r.ok),missing:textResults.filter(r=>!r.ok).map(r=>r.text),checked:textResults.length}
  };
  result.ok=result.functions.ok&&result.elements.ok&&result.texts.ok;
  state.diagnostics.regression=result;
  debugStartup('regression self check',result);
  if(!result.ok)console.warn('[hado-debug] regression self check failed',result);
  return result;
}
async function handleCopyAllParameters(){return handleCopyAllParameterResults();}
function exportSaveData(){return exportSaveDataToFile();}
function renderSavedModeControls(){return renderSaveControls();}
function renderMobileSearchHistory(){return renderSearchHistory();}
function toggleMainTab(tab){return setMainTab(tab);}
function saveFormationData(){return persistFormationData();}
function renderFormation(){return renderFormationScreen();}
function renderFormationAddButton(item){return renderFormationAddButtonHtml(item||state.selectedItem);}
function prewarmSearchCache(categoryKey){return prewarmSearchCacheForCategory(categoryKey||'equipments');}
function createFormation(){return createNewFormation();}
function openFormationAddPopover(item){return renderFormationAddPopover(item||state.selectedItem);}
function applySelectedItemToFormation(){return applyFormationQuickAdd(false);}
async function handleCopyDebugLog(){try{const text=buildDebugPanelText(state.selectedItem,state._debugPanelExtraText||'',{context:'copy-debug-log'});await copyTextToClipboard(text);if(els.copyDebugLogBtn){const prev=els.copyDebugLogBtn.textContent;els.copyDebugLogBtn.textContent='コピー済み';setTimeout(()=>{els.copyDebugLogBtn.textContent=prev;},1200);}}catch(err){window.alert(`コピーに失敗しました: ${err?.message||err}`);}}
async function startup(){const startupStartedAt=performance.now();configureDeploymentUi();setLoadingState(true,{title:IS_WEB_DEPLOYMENT?'公開JSONを読み込んでいます…':'JSONを読み込んでいます…',detail:'起動準備をしています。',current:0,total:100});await nextFrame();debugLog('startup:loading-overlay-visible',{webDeployment:IS_WEB_DEPLOYMENT,elapsedMs:Math.round(performance.now()-startupStartedAt)});state.showRawJson=false;diagnoseSaveLocalStorage('startup:before-load');state.saveData=loadSaveDataFromStorage();state.searchHistory=loadSearchHistory();loadFormationData();state.saveData.searchHistory=sanitizeSearchHistoryList(state.searchHistory);await recoverSaveDataFromMirrorIfNeeded();diagnoseSaveLocalStorage('startup:after-load');try{state.viewMode=localStorage.getItem('hado_library_view_mode_v1_2')==='saved'?'saved':'all';}catch{state.viewMode='all';}try{state.generalStage=normalizeGeneralStage(localStorage.getItem('hado_library_general_stage_v1')||'max');}catch{state.generalStage='max';}try{state.equipmentStage=normalizeEquipmentStage(localStorage.getItem('hado_library_equipment_stage_v1')||'urMax');}catch{state.equipmentStage='urMax';}debugStartup('file meta',FILE_META);debugStartup('build info',HADO_BUILD_INFO);debugStartup('runtime html version check',{title:document.title,h1:(document.querySelector('h1')?.textContent||''),fileName:FILE_META.fileName,version:HADO_BUILD_INFO.version});debugStartup('startup env',{protocol:location.protocol,userAgent:navigator.userAgent,viewMode:state.viewMode,generalStage:state.generalStage,equipmentStage:state.equipmentStage,equipmentStageSaveCount:Object.keys(getCurrentSave()?.equipmentStages||{}).length,showDebugLog:state.showRawJson,saveCount:state.saveData?.saves?.length||0,currentSaveId:state.saveData?.currentSaveId||'',searchHistoryCount:state.searchHistory?.length||0});els.rawJsonToggle.checked=!!state.showRawJson;debugStartup('copy buttons',{copyResultsBtnExists:!!els.copyResultsBtn,copyParamResultsBtnExists:!!els.copyParamResultsBtn,copyParamResultsBtnText:els.copyParamResultsBtn?norm(els.copyParamResultsBtn.textContent):'',copyAllParamResultsBtnExists:!!els.copyAllParamResultsBtn,copyAllParamResultsBtnText:els.copyAllParamResultsBtn?norm(els.copyAllParamResultsBtn.textContent):'',copyDetailBtnExists:!!els.copyDetailBtn});setupCategoryButtons();updateCategoryStyles();debugStartup('startup category initial',{generals:state.activeCategories.generals,allInactive:!Object.values(state.activeCategories||{}).some(Boolean)});updateCategoryDiagnosticSnapshot('startup');debugStartup('category state after setup',{internal:state.activeCategories,ui:getCategoryUiState()});rebuildSavedModeIndex();renderSaveControls();initFileSettingsPanel();setupMainTabs();setupUxHomePanel();setupDataContextControls();setupSaveManagerPanel();setupSearchDialogCollapse();setupSearchUxEnhancements();setupTypeSearchUi();setupMobileSwipeNavigation();state.diagnostics.validation={version:HADO_BUILD_INFO.version,context:'startup:skipped-heavy-validation',timestamp:debugTimestamp(),ok:true,skipped:true,policy:'HADO-2.7.3.52: 起動時の重い検証は実行せず、検証実行ボタンから進捗付きで実行する。進捗は工程開始/完了の2段階で表示し、100%後は軽量結果に切り替える。'};renderSearchHistory();renderTagSearchControls();syncMobileSearchHistoryDeleteButton();debugResponsiveSnapshot('startup:after-renderSearchHistory');window.addEventListener('resize',()=>{applyResponsiveLayout('window:resize');debugResponsiveSnapshot('window:resize');});window.addEventListener('orientationchange',()=>setTimeout(()=>{applyResponsiveLayout('window:orientationchange');debugResponsiveSnapshot('window:orientationchange');},250));if(els.opHistoryBackBtn)els.opHistoryBackBtn.addEventListener('click',()=>restoreOperationHistory(-1));if(els.opHistoryForwardBtn)els.opHistoryForwardBtn.addEventListener('click',()=>restoreOperationHistory(1));if(els.resultNextBtn)els.resultNextBtn.addEventListener('click',()=>moveSelectedResultBy(1));if(els.resultPrevBtn)els.resultPrevBtn.addEventListener('click',()=>moveSelectedResultBy(-1));if(els.runValidationBtn)els.runValidationBtn.addEventListener('click',handleRunValidationSelfCheck);setDebugCopyButtonEnabled(true);if(els.copyResultsBtn)els.copyResultsBtn.addEventListener('click',handleCopyResults);if(els.copyParamResultsBtn)els.copyParamResultsBtn.addEventListener('click',handleCopyParameterResults);if(els.copyAllParamResultsBtn)els.copyAllParamResultsBtn.addEventListener('click',handleCopyAllParameterResults);if(els.copyDetailBtn)els.copyDetailBtn.addEventListener('click',handleCopyDetail);if(els.mobileSearchHistorySelect)els.mobileSearchHistorySelect.addEventListener('change',()=>{const keyword=els.mobileSearchHistorySelect.value;if(!keyword){syncMobileSearchHistoryDeleteButton();return;}state.mobileSelectedSearchHistory=keyword;debugLog('mobileSearchHistory:select',{keyword});els.searchInput.value=keyword;resetMobileResultSelectLimit();renderSearchResults();renderDetail();pushOperationHistory('search-history-select');syncMobileSearchHistoryDeleteButton();});if(els.mobileDeleteSearchHistoryBtn)els.mobileDeleteSearchHistoryBtn.addEventListener('click',deleteMobileSelectedSearchHistory);if(els.resultSelect)els.resultSelect.addEventListener('change',()=>{if(els.resultSelect.value==='__more__'){increaseMobileResultSelectLimit();els.resultSelect.value='';syncMobileResultFavoriteButton('result-select-more');return;}const idx=Number(els.resultSelect.value);const row=Number.isFinite(idx)?state.lastResultRows[idx]:null;if(!row){syncMobileResultFavoriteButton('result-select-empty');return;}selectItemAndRender(row.item,row.label,{reason:'result-select'});syncMobileResultFavoriteButton('result-select-change');});if(els.mobileResultFavoriteBtn)els.mobileResultFavoriteBtn.addEventListener('click',toggleMobileResultFavorite);if(els.clearKeywordBtn)els.clearKeywordBtn.addEventListener('click',()=>{cancelScheduledSearchRender();clearQuickStatusEffectOwnerFilter();els.searchInput.value='';resetMobileResultSelectLimit();debugLog('keywordSearch:clear',{});renderSearchResults();renderDetail();pushOperationHistory('keyword-clear');});if(els.tagSearchInput){els.tagSearchInput.addEventListener('input',()=>renderTagCandidates());els.tagSearchInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addSelectedTag(els.tagSearchInput.value,'input-enter');els.tagSearchInput.value='';renderTagCandidates();}});}if(els.addTagSearchBtn)els.addTagSearchBtn.addEventListener('click',()=>{addSelectedTag(els.tagSearchInput?els.tagSearchInput.value:'','input-button');if(els.tagSearchInput)els.tagSearchInput.value='';renderTagCandidates();});if(els.clearTagSearchBtn)els.clearTagSearchBtn.addEventListener('click',()=>clearSelectedTags('clear-button'));if(els.tagPickerToggleBtn)els.tagPickerToggleBtn.addEventListener('click',()=>{state.tagPickerVisible=!state.tagPickerVisible;debugLog('tagSearch:pickerToggle',{visible:state.tagPickerVisible});renderTagSearchControls();});if(els.nameOnlySearchToggle)els.nameOnlySearchToggle.addEventListener('change',()=>{cancelScheduledSearchRender();resetMobileResultSelectLimit();state.nameOnlySearch=isNameOnlySearch();debugLog('keywordSearch:name-only-toggle',{checked:state.nameOnlySearch});renderSearchResults();renderDetail();pushOperationHistory('name-only-search-toggle');});els.searchInput.addEventListener('input',()=>{clearQuickStatusEffectOwnerFilter();if(state._searchComposing){debugLog('search:debounce-skip',{reason:'composition'});return;}scheduleSearchAndDetailRender('search-input');});els.searchInput.addEventListener('compositionstart',()=>{state._searchComposing=true;});els.searchInput.addEventListener('compositionend',()=>{state._searchComposing=false;clearQuickStatusEffectOwnerFilter();scheduleSearchAndDetailRender('search-input-compositionend');});els.searchInput.addEventListener('keydown',e=>{if(e.key!=='Enter')return;registerSearchHistory(els.searchInput.value);});els.rawJsonToggle.addEventListener('change',()=>{state.showRawJson=!!els.rawJsonToggle.checked;try{localStorage.setItem('hadou_canvas_show_raw_json_v1_1',state.showRawJson?'1':'0');}catch{}debugLog('debugPanel:toggle',{enabled:state.showRawJson,async:true});renderDebugPanel(state.selectedItem||null,state._debugPanelExtraText||'');});els.viewModeAll.addEventListener('change',()=>{if(els.viewModeAll.checked){try{localStorage.setItem('hado_library_view_mode_v1_2','all');}catch{}setViewMode('all');}});els.viewModeSaved.addEventListener('change',()=>{if(els.viewModeSaved.checked){try{localStorage.setItem('hado_library_view_mode_v1_2','saved');}catch{}setViewMode('saved');}});if(els.generalStageInitial)els.generalStageInitial.addEventListener('change',()=>{if(els.generalStageInitial.checked)setGeneralStage('initial');});if(els.generalStageMax)els.generalStageMax.addEventListener('change',()=>{if(els.generalStageMax.checked)setGeneralStage('max');});if(els.equipmentStageInitial)els.equipmentStageInitial.addEventListener('change',()=>{if(els.equipmentStageInitial.checked)setEquipmentStage('initial');});if(els.equipmentStageSsrMax)els.equipmentStageSsrMax.addEventListener('change',()=>{if(els.equipmentStageSsrMax.checked)setEquipmentStage('ssrMax');});if(els.equipmentStageUrMax)els.equipmentStageUrMax.addEventListener('change',()=>{if(els.equipmentStageUrMax.checked)setEquipmentStage('urMax');});els.saveSelect.addEventListener('change',async()=>{await runWithUiBusy('保存データを切り替えています…','保存データの索引と表示を更新しています。',async()=>{markSaveSwitchBusyContext('save-select');clearWarhorseUndoToast('save-select');state.saveData.currentSaveId=norm(els.saveSelect.value);persistSaveData();rebuildSavedModeIndex();renderSaveControls();renderSearchResults();renderDetail();if(state.mainTab==='formation')renderFormationScreen();else markFormationScreenStale('save-select');if(state.mainTab==='warhorse')renderWarhorseFormationScreen();updateCountStatus();});});els.newSaveBtn.addEventListener('click',async()=>{await createNewSave();updateCountStatus();});els.renameSaveBtn.addEventListener('click',async()=>{await renameCurrentSave();updateCountStatus();});els.copySaveBtn.addEventListener('click',async()=>{await copyCurrentSave();updateCountStatus();});els.deleteSaveBtn.addEventListener('click',()=>{deleteCurrentSave();updateCountStatus();});els.exportSaveDataBtn.addEventListener('click',()=>{exportSaveDataToFile();});function openImportSaveDataPicker(){
if(!els.importSaveDataInput){openImportPasteDialog('no-static-input');return;}
debugLog('importSaveData:picker-open',{staticInput:true,pattern:'same-as-json-file-loader'});
els.importSaveDataInput.value='';
try{els.importSaveDataInput.click();}catch(err){debugLog('importSaveData:picker-click-error',{message:err?.message||String(err)});openImportPasteDialog('picker-click-error');}
}
const importTriggerIsNativeLabel=!!(els.importSaveDataBtn&&els.importSaveDataBtn.tagName==='LABEL');if(els.importSaveDataBtn){['pointerdown','touchstart','mousedown'].forEach(ev=>{els.importSaveDataBtn.addEventListener(ev,()=>{if(els.importSaveDataInput)els.importSaveDataInput.value='';},{passive:true});});els.importSaveDataBtn.addEventListener('keydown',e=>{if(importTriggerIsNativeLabel&&(e.key==='Enter'||e.key===' ')){e.preventDefault();if(els.importSaveDataInput){els.importSaveDataInput.value='';els.importSaveDataInput.click();}}});els.importSaveDataBtn.addEventListener('click',()=>{debugLog('importSaveData:button-click',{nativeLabel:importTriggerIsNativeLabel,staticPicker:true,userAgent:navigator.userAgent});if(!importTriggerIsNativeLabel)openImportSaveDataPicker();renderDebugPanel(state.selectedItem);});}if(els.importSaveDataInput){els.importSaveDataInput.addEventListener('change',async()=>{const file=els.importSaveDataInput.files&&els.importSaveDataInput.files[0];debugLog('importSaveData:static-input-change',{hasFile:!!file,fileName:file?.name||'',fileSize:file?.size||0});renderDebugPanel(state.selectedItem);if(!file)return;try{await importSaveDataFromFile(file);}catch(err){debugLog('importSaveData:error',{message:err?.message||String(err)});renderDebugPanel(state.selectedItem);window.alert(`Importに失敗しました: ${err?.message||err}`);}finally{els.importSaveDataInput.value='';renderDebugPanel(state.selectedItem);}});}if(!window.showDirectoryPicker&&els.topPickJsonDirBtn){els.topPickJsonDirBtn.disabled=true;els.topPickJsonDirBtn.title='このブラウザはフォルダ選択APIに未対応です。JSONファイルを選択して読込を使用してください。';}if(els.topPickJsonFilesBtn&&els.topPickJsonFilesInput){els.topPickJsonFilesBtn.addEventListener('click',()=>{els.topPickJsonFilesInput.value='';els.topPickJsonFilesInput.click();});els.topPickJsonFilesInput.addEventListener('change',async()=>{const btn=els.topPickJsonFilesBtn;const prev=btn.textContent;try{btn.disabled=true;btn.textContent='読込中...';const data=await chooseJsonFilesAndLoad(els.topPickJsonFilesInput.files);await applyLoadedData(data);}catch(err){renderStartupDataLoadScreen(makeLatestJsonReloadError('manual-file-load-failed',err));}finally{btn.disabled=false;btn.textContent=prev;els.topPickJsonFilesInput.value='';}});}els.topPickJsonDirBtn.addEventListener('click',async()=>{const btn=els.topPickJsonDirBtn;const prev=btn.textContent;try{btn.disabled=true;btn.textContent='読込中...';const data=await chooseJsonDirectoryAndLoad();await applyLoadedData(data);}catch(err){renderStartupDataLoadScreen(makeLatestJsonReloadError('manual-directory-load-failed',err));}finally{btn.disabled=false;btn.textContent=prev;}});try{debugLog('startup:before-json-load',{elapsedMs:Math.round(performance.now()-startupStartedAt),webDeployment:IS_WEB_DEPLOYMENT});const data=await loadExternalJsonBundle();debugLog('startup:external-json-loaded',{elapsedMs:Math.round(performance.now()-startupStartedAt),webDeployment:IS_WEB_DEPLOYMENT});await applyLoadedData(data);debugLog('startup:ready',{elapsedMs:Math.round(performance.now()-startupStartedAt),webDeployment:IS_WEB_DEPLOYMENT});}catch(err){if(err?.needsDataLoadScreen)renderStartupDataLoadScreen(err);else renderStartupDataLoadScreen(makeLatestJsonReloadError('startup-json-load-failed',err));}}
startup();
