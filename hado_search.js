'use strict';
/* HADO search, quick status-effect search and type search */
// FEATURE[HADO-2.5.5.14-STATUS-QUICK-GROUP-FILTER]: クイック検索に6分類の第一フィルタを追加。スマホでも横並びを維持する。
const SEARCH_UX_PRESET_GROUPS=[
  {key:'all',label:'すべて'},
  {key:'selfAbilityBuff',label:'自部隊能力強化'},
  {key:'selfStateBuff',label:'自部隊状態強化'},
  {key:'selfResistanceBuff',label:'自部隊不利対策'},
  {key:'enemyAbilityDebuff',label:'敵部隊能力低下'},
  {key:'enemyStateDebuff',label:'敵部隊状態弱化'},
  {key:'enemyResistanceDebuff',label:'敵部隊有利対策'}
];
const SEARCH_UX_PRESETS={
  gauge:{group:'selfAbilityBuff',keyword:'戦法短縮',categories:SEARCH_UX_PRESET_CATEGORIES,label:'戦法短縮'},
  atkSpeedBuff:{group:'selfAbilityBuff',keyword:'攻撃速度上昇',categories:SEARCH_UX_PRESET_CATEGORIES,label:'攻撃速度上昇'},
  criticalRateBuff:{group:'selfAbilityBuff',keyword:'会心発生上昇',categories:SEARCH_UX_PRESET_CATEGORIES,label:'会心発生上昇'},
  criticalPowerBuff:{group:'selfAbilityBuff',keyword:'会心威力上昇',categories:SEARCH_UX_PRESET_CATEGORIES,label:'会心威力上昇'},
  tacticSpeedBuff:{group:'selfAbilityBuff',keyword:'戦法速度上昇',categories:SEARCH_UX_PRESET_CATEGORIES,label:'戦法速度上昇'},
  attackBuff:{group:'selfAbilityBuff',keyword:'攻撃上昇',categories:SEARCH_UX_PRESET_CATEGORIES,label:'攻撃上昇'},
  defenseBuff:{group:'selfAbilityBuff',keyword:'防御上昇',categories:SEARCH_UX_PRESET_CATEGORIES,label:'防御上昇'},
  intelligenceBuff:{group:'selfAbilityBuff',keyword:'知力上昇',categories:SEARCH_UX_PRESET_CATEGORIES,label:'知力上昇'},
  antiObjectBuff:{group:'selfAbilityBuff',keyword:'対物特効上昇',categories:SEARCH_UX_PRESET_CATEGORIES,label:'対物特効上昇'},
  tacticPowerBuff:{group:'selfAbilityBuff',keyword:'戦法威力上昇',categories:SEARCH_UX_PRESET_CATEGORIES,label:'戦法威力上昇'},
  damageBuff:{group:'selfAbilityBuff',keyword:'与ダメージ上昇',categories:SEARCH_UX_PRESET_CATEGORIES,label:'与ダメージ上昇'},
  damageTakenDown:{group:'selfAbilityBuff',keyword:'被ダメージ低下',categories:SEARCH_UX_PRESET_CATEGORIES,label:'被ダメージ低下'},
  compatibilityBuff:{group:'selfAbilityBuff',keyword:'兵科相性変化(強化)',categories:SEARCH_UX_PRESET_CATEGORIES,label:'兵科相性有利'},
  morale:{group:'selfStateBuff',keyword:'猛奮',categories:SEARCH_UX_PRESET_CATEGORIES,label:'猛奮'},
  defiant:{group:'selfStateBuff',keyword:'不敵',categories:SEARCH_UX_PRESET_CATEGORIES,label:'不敵'},
  firmness:{group:'selfStateBuff',keyword:'堅固',categories:SEARCH_UX_PRESET_CATEGORIES,label:'堅固'},
  isolation:{group:'selfStateBuff',keyword:'絶縁',categories:SEARCH_UX_PRESET_CATEGORIES,label:'絶縁'},
  debuffImmune:{group:'selfStateBuff',keyword:'弱化無効',categories:SEARCH_UX_PRESET_CATEGORIES,label:'弱化無効'},
  unyielding:{group:'selfStateBuff',keyword:'不退',categories:SEARCH_UX_PRESET_CATEGORIES,label:'不退'},
  immortal:{group:'selfStateBuff',keyword:'不滅',categories:SEARCH_UX_PRESET_CATEGORIES,label:'不滅'},
  shrinkAvoid:{group:'selfResistanceBuff',keyword:'萎縮 避ける',categories:SEARCH_UX_PRESET_CATEGORIES,label:'萎縮回避'},
  buffRemoveAvoid:{group:'selfResistanceBuff',keyword:'強化解除 避ける',categories:SEARCH_UX_PRESET_CATEGORIES,label:'強化解除回避'},
  abilityDebuffAvoid:{group:'selfResistanceBuff',keyword:'能力弱化 避ける',categories:SEARCH_UX_PRESET_CATEGORIES,label:'能力弱化回避'},
  adverseNullify:{group:'selfResistanceBuff',keyword:'不利変化 無効',categories:SEARCH_UX_PRESET_CATEGORIES,label:'不利変化無効'},
  debuffReflect:{group:'selfResistanceBuff',keyword:'弱化反射',categories:SEARCH_UX_PRESET_CATEGORIES,label:'弱化反射'},
  attackDebuff:{group:'enemyAbilityDebuff',keyword:'攻撃低下',categories:SEARCH_UX_PRESET_CATEGORIES,label:'攻撃低下'},
  defenseDebuff:{group:'enemyAbilityDebuff',keyword:'防御低下',categories:SEARCH_UX_PRESET_CATEGORIES,label:'防御低下'},
  intelligenceDebuff:{group:'enemyAbilityDebuff',keyword:'知力低下',categories:SEARCH_UX_PRESET_CATEGORIES,label:'知力低下'},
  atkSpeedDebuff:{group:'enemyAbilityDebuff',keyword:'攻撃速度低下',categories:SEARCH_UX_PRESET_CATEGORIES,label:'攻撃速度低下'},
  tacticSpeedDebuff:{group:'enemyAbilityDebuff',keyword:'戦法速度低下',categories:SEARCH_UX_PRESET_CATEGORIES,label:'戦法速度低下'},
  fear:{group:'enemyStateDebuff',keyword:'恐怖',categories:SEARCH_UX_PRESET_CATEGORIES,label:'恐怖'},
  confusion:{group:'enemyStateDebuff',keyword:'同討',categories:SEARCH_UX_PRESET_CATEGORIES,label:'同討'},
  shrink:{group:'enemyStateDebuff',keyword:'萎縮',categories:SEARCH_UX_PRESET_CATEGORIES,label:'萎縮'},
  kyoshin:{group:'enemyStateDebuff',keyword:'怯心',categories:SEARCH_UX_PRESET_CATEGORIES,label:'怯心'},
  doubt:{group:'enemyStateDebuff',keyword:'疑心',categories:SEARCH_UX_PRESET_CATEGORIES,label:'疑心'},
  chainBlock:{group:'enemyStateDebuff',keyword:'連鎖不能',categories:SEARCH_UX_PRESET_CATEGORIES,label:'連鎖不能'},
  buffInvalid:{group:'enemyStateDebuff',keyword:'強化無効',categories:SEARCH_UX_PRESET_CATEGORIES,label:'強化無効'},
  delay:{group:'enemyStateDebuff',keyword:'戦法遅延',categories:SEARCH_UX_PRESET_CATEGORIES,label:'戦法遅延'},
  buffRemove:{group:'enemyResistanceDebuff',keyword:'有利変化 解除',categories:SEARCH_UX_PRESET_CATEGORIES,label:'有利変化解除'},
  buffCancel:{group:'enemyResistanceDebuff',keyword:'強化効果 打ち消す',categories:SEARCH_UX_PRESET_CATEGORIES,label:'強化打消'},
  firmnessIgnore:{group:'enemyResistanceDebuff',keyword:'堅固 無視',categories:SEARCH_UX_PRESET_CATEGORIES,label:'堅固無視'},
  debuffImmuneRemove:{group:'enemyResistanceDebuff',keyword:'弱化無効 解除',categories:SEARCH_UX_PRESET_CATEGORIES,label:'弱化無効解除'},
  favorableIgnore:{group:'enemyResistanceDebuff',keyword:'有利変化 無視',categories:SEARCH_UX_PRESET_CATEGORIES,label:'有利変化無視'}

};
// FEATURE[HADO-2.5.5.15-STATUS-QUICK-OWNER-SEARCH]: クイック検索を文字列検索ではなく状態変化所有者検索に変更する。
// FEATURE[HADO-2.5.5.16-TACTIC-GAUGE-AS-TACTIC-SHORTEN]: 戦法ゲージ上昇は関連リンク/クイック検索上で戦法短縮に正規化する。
const SEARCH_UX_EXTRA_RELATION_PRESETS=[
  {key:'relation:shrinkAvoid',group:'selfResistanceBuff',label:'萎縮回避',statusName:'萎縮',relationType:'回避'},
  {key:'relation:buffRemoveAvoid',group:'selfResistanceBuff',label:'強化解除回避',statusName:'強化解除',relationType:'回避'},
  {key:'relation:abilityDebuffAvoid',group:'selfResistanceBuff',label:'能力弱化回避',statusName:'能力弱化',relationType:'回避'},
  {key:'relation:adverseNullify',group:'selfResistanceBuff',label:'不利変化無効',statusName:'不利変化',relationType:'無効化'},
  {key:'relation:buffRemove',group:'enemyResistanceDebuff',label:'有利変化解除',statusName:'有利変化',relationType:'解除'},
  {key:'relation:buffCancel',group:'enemyResistanceDebuff',label:'強化打消',statusName:'強化効果',relationType:'解除'},
  {key:'relation:firmnessIgnore',group:'enemyResistanceDebuff',label:'堅固無視',statusName:'堅固',relationType:'無視'},
  {key:'relation:debuffImmuneRemove',group:'enemyResistanceDebuff',label:'弱化無効解除',statusName:'弱化無効',relationType:'解除'},
  {key:'relation:favorableIgnore',group:'enemyResistanceDebuff',label:'有利変化無視',statusName:'有利変化',relationType:'無視'}
];
const SEARCH_UX_STATUS_EFFECT_ORDER=['戦法短縮','攻撃速度上昇','会心発生上昇','会心威力上昇','戦法速度上昇','攻撃上昇','防御上昇','知力上昇','対物特効上昇','戦法威力上昇','与ダメージ上昇','被ダメージ低下','兵科相性変化(強化)','猛奮','不敵','堅固','絶縁','弱化無効','不退','不滅','萎縮回避','攻撃低下回避','強化解除回避','弱化効果回避','弱化効果無効','弱化効果解除','能力弱化回避','不利変化無効','弱化反射','攻撃低下','防御低下','知力低下','攻撃速度低下','戦法速度低下','怯心','恐怖','同討','萎縮','疑心','連鎖不能','強化無効','戦法遅延','有利変化解除','強化打消','堅固無視','弱化無効解除','有利変化無視'];
// FEATURE[HADO-2.5.5.18-QUICK-OWNER-FREEZE-FIX]: クイック検索では通常全文検索をスキップし、状態変化関連抽出をアイテム単位でキャッシュする。
function quickStatusEffectSortValue(entry){const label=norm(entry?.label||'');const idx=SEARCH_UX_STATUS_EFFECT_ORDER.indexOf(label);return idx>=0?idx:1000+(label?label.charCodeAt(0):0);}
function getQuickStatusEffectRelationCacheBucket(item){
  if(!item||typeof item!=='object')return null;
  if(!Object.prototype.hasOwnProperty.call(item,'_quickStatusEffectRelationCache')){
    try{Object.defineProperty(item,'_quickStatusEffectRelationCache',{value:{},writable:true,configurable:true});}
    catch{item._quickStatusEffectRelationCache={};}
  }
  return item._quickStatusEffectRelationCache;
}
// FEATURE[HADO-2.5.5.17-QUICK-STATUS-FREQUENCY-ORDER-RESTORE]: すべて表示では6分類順ではなく、編成でよく使う順を優先する。分類選択時は分類内で同じ優先順を使う。
function buildQuickStatusEffectEntries(options={}){
  const groupFirst=options&&options.groupFirst!==false;
  const entries=[];
  (state.statusEffects||[]).forEach(item=>{
    const label=norm(item?.statusDisplayName||item?.title||item?.name||'');
    const statusName=norm(item?.statusDisplayName||item?.name||item?.originalName||label);
    let group=norm(item?.statusRelationGroup||getStatusEffectRelationGroupKey(item));
    if(label==='戦法短縮'||statusName==='戦法短縮')group='selfAbilityBuff';
    if(!STATUS_EFFECT_RELATION_GROUP_LABELS[group])return;
    if(!label||!statusName)return;
    entries.push({key:`status:${statusName}`,group,label,statusName,kind:'status',item});
  });
  buildEffectCountermeasureIndex().forEach(row=>{const canonicalStatus=findStatusEffectItemByAnyName(row.name)?row.name:row.target;entries.push({key:`countermeasure:${row.groupKey}:${row.name}`,group:row.groupKey,label:row.name,statusName:canonicalStatus,relationType:row.relation,kind:'countermeasure',countermeasure:row});});
  // 旧プリセットは生成インデックスが空の初期化タイミングのみの保険。通常は実データ由来の countermeasure を使う。
  if(!entries.some(e=>e.kind==='countermeasure'))SEARCH_UX_EXTRA_RELATION_PRESETS.forEach(e=>entries.push({...e,kind:'relation'}));
  const seen=new Map();
  entries.forEach(entry=>{
    const key=[entry.group,entry.label,entry.statusName,entry.relationType||''].join('@@');
    if(!seen.has(key))seen.set(key,entry);
  });
  return [...seen.values()].sort((a,b)=>{
    if(groupFirst){
      const ga=SEARCH_UX_PRESET_GROUPS.findIndex(g=>g.key===a.group);
      const gb=SEARCH_UX_PRESET_GROUPS.findIndex(g=>g.key===b.group);
      if(ga!==gb)return ga-gb;
    }
    return quickStatusEffectSortValue(a)-quickStatusEffectSortValue(b)||norm(a.label).localeCompare(norm(b.label),'ja');
  });
}
function getQuickStatusEffectEntryByKey(key){
  const k=norm(key);
  if(!k)return null;
  return buildQuickStatusEffectEntries().find(entry=>entry.key===k)||null;
}
function quickStatusEffectRelationMatches(entry,filter){
  if(!entry||!filter)return false;
  const entryGroup=norm(entry.groupKey||'');
  const filterGroup=norm(filter.group||'');
  const filterStatusName=norm(filter.statusName||filter.label||'');
  const isTacticShortenFilter=filterStatusName==='戦法短縮';
  if(filterGroup&&entryGroup&&entryGroup!==filterGroup&&!isTacticShortenFilter)return false;
  const rawName=norm(entry.name||'');
  const item=findStatusEffectItemByAnyName(rawName);
  const display=statusRelationDisplayName(entry,item||{name:rawName,title:rawName});
  const label=norm(filter.label||'');
  const statusName=filterStatusName||norm(filter.statusName||'');
  const relation=norm(filter.relationType||'');
  if(relation&&norm(entry.relationType||'')&&norm(entry.relationType)!==relation)return false;
  const profile=getStatusEffectProfile(item||rawName);
  if(statusName==='能力弱化'&&filterGroup==='selfResistanceBuff'&&isAbilityStatusEffectProfile(profile)&&profile.direction==='debuff')return true;
  if(statusName==='不利変化'&&filterGroup==='selfResistanceBuff'&&profile.direction==='debuff')return true;
  if((statusName==='有利変化'||statusName==='強化効果')&&filterGroup==='enemyResistanceDebuff'&&profile.direction==='buff')return true;
  if(label&&norm(display)===label)return true;
  if(statusName&&(rawName===statusName||norm(display)===statusName))return true;
  const values=[profile?.displayName,profile?.originalName,profile?.summaryKey,...(profile?.aliases||[])].map(norm).filter(Boolean);
  return !!(statusName&&values.includes(statusName));
}
// FIX[HADO-2.5.5.27-SKILL-RAW-MERGE]: 既存技能にもhadou_skills.json由来の技能本文sectionsを統合し、クイック検索の技能カテゴリ照合漏れを防ぐ。
// FEATURE[HADO-2.5.5.19-QUICK-OWNER-SINGLE-PROFILE]: クイック検索は選択中の状態変化だけを照合し、全状態変化×全アイテムの総当たりを禁止する。
// FEATURE[HADO-2.5.5.20-QUICK-OWNER-ONLY]: クイック検索はカテゴリ/キーワード/タグ条件を使わず、選択した状態変化を所有する武将・戦法・技能・装備だけを表示する。
// FIX[HADO-2.5.5.21-TACTIC-OWNER-LINKS]: 戦法本文sectionsと戦法追加効果表を所有者検索/関連リンクに含め、戦法短縮は戦法ゲージ/戦法待ち時間系に正規化する。
// FIX[HADO-2.5.5.22-TACTIC-SHORTEN-OWNER-GROUP]: 戦法短縮は即時効果だが、クイック検索では戦法ゲージ系の自部隊能力強化として照合する。
// FIX[HADO-2.5.5.24-QUICK-RESET]: クイック検索解除時に条件チップへ残らないようにし、明示的な解除ボタンを追加する。
function getQuickStatusEffectFilterProfiles(filter,statusEffectNames){
  const statusName=norm(filter?.statusName||filter?.label||'');
  const group=norm(filter?.group||'');
  const profiles=getStatusEffectProfilesForRelatedLinks(statusEffectNames);
  if(statusName==='能力弱化'&&group==='selfResistanceBuff'){
    return profiles.filter(p=>isAbilityStatusEffectProfile(p)&&p.direction==='debuff');
  }
  if(statusName==='不利変化'&&group==='selfResistanceBuff'){
    return profiles.filter(p=>p.direction==='debuff');
  }
  if((statusName==='有利変化'||statusName==='強化効果')&&group==='enemyResistanceDebuff'){
    return profiles.filter(p=>p.direction==='buff');
  }
  const item=findStatusEffectItemByAnyName(statusName)||findStatusEffectItemByAnyName(filter?.label||'');
  const profile=getStatusEffectProfile(item||statusName);
  if(profile&&statusName==='戦法短縮'){
    profile.summaryKey='戦法ゲージ';
    profile.direction='buff';
    profile.displayName='戦法短縮';
    profile.aliases=[...new Set([...(profile.aliases||[]),'戦法短縮','戦法ゲージ','戦法ゲージ増加','戦法ゲージ上昇','戦法ゲージ+','戦法ゲージ＋','戦法ゲージが上昇','戦法待ち時間','戦法待ち時間を短縮','戦法の待ち時間','戦法の待ち時間を短縮'].map(norm).filter(Boolean))];
  }
  return profile?[profile]:[];
}
function getQuickStatusEffectFilterProfileKey(filter,statusEffectNames){
  const profiles=getQuickStatusEffectFilterProfiles(filter,statusEffectNames);
  return profiles.map(p=>norm(p?.displayName||p?.originalName||p?.summaryKey||'')).filter(Boolean).join('|');
}
function detectQuickStatusEffectDirectAbilityMatch(part,profile){
  const src=norm(part||'');
  const key=norm(profile?.summaryKey||'');
  if(!src||!key||!isAbilityStatusEffectProfile(profile))return null;
  if(!src.includes(key))return null;
  const direction=inferStatusEffectRelationDirection(src,key);
  if(profile.direction&&direction&&direction!==profile.direction)return null;
  if(profile.direction&&!direction)return null;
  const ctx=inferStatusEffectRelationContext(src,profile);
  const groupKey=resolveStatusEffectRelationGroup(profile,ctx,direction);
  if(!groupKey)return null;
  return {matched:true,groupKey,relationType:ctx.relationType||'',reason:ctx.reason||'direct-ability',targetSide:ctx.targetSide||''};
}
function sanitizeQuickOwnerReasonSourceText(text){
  // FIX[HADO-2.9.2.1-QUICK-OWNER-REASON-NO-INTERNAL-SOURCE]:
  // 一覧の「選定理由」はユーザー向け表示であり、内部JSONファイル名や索引識別子は表示しない。
  // 判定自体は派生JSONを引き続き利用し、表示文だけを整形する。
  let src=norm(text||'');
  if(!src)return '';
  src=src.replace(/\b(?:hadou|hado)_[A-Za-z0-9_\-]+\.json\b/gi,'');
  src=src.replace(/\b(?:related_link_index|status_effect_group_owner_index|generated-status-effect-group-owner-index-canonical)\b/gi,'');
  src=src.replace(/(?:^|[\s　])(?:派生JSON|内部JSON)[:：]?\s*/g,' ');
  src=src.replace(/^[：:\-\s　]+|[：:\-\s　]+$/g,'');
  src=src.replace(/\s{2,}/g,' ').trim();
  return src;
}
function compactQuickOwnerSourceText(text){
  const src=sanitizeQuickOwnerReasonSourceText(text);
  if(!src)return '';
  const cleaned=src.replace(/\s+/g,' ').replace(/^[■●▼\s]+/,'');
  return cleaned.length>96?cleaned.slice(0,96)+'…':cleaned;
}
function getQuickOwnerReasonSource(hit){
  const primary=compactQuickOwnerSourceText(hit?.sourceText||'');
  if(primary)return primary;
  return compactQuickOwnerSourceText(hit?.matchedText||'');
}
function buildQuickOwnerSelectionReason(hits,filter){
  const list=(hits||[]).filter(Boolean);
  if(!list.length)return '';
  const isGroupFilter=isQuickStatusEffectGroupOwnerFilter(filter);
  const fallbackLabel=norm(filter?.label||filter?.statusName||list[0]?.name||'状態変化');
  const parts=[];
  const seen=new Set();
  list.forEach(hit=>{
    const effectLabel=norm((isGroupFilter?hit?.name:'')||fallbackLabel||hit?.name||'状態変化');
    const rel=norm(hit?.relationType||'');
    const group=getQuickStatusEffectGroupLabel(hit?.groupKey||filter?.group||'');
    const src=getQuickOwnerReasonSource(hit);
    const sourceKind=src?`：${src}`:'';
    const groupKind=!isGroupFilter&&group?` / ${group}`:'';
    const key=[effectLabel,rel,groupKind,src].join('@@');
    if(seen.has(key))return;
    seen.add(key);
    parts.push(`${effectLabel}${rel?`（${rel}）`:''}${groupKind}${sourceKind}`);
  });
  return `選定理由：${parts.slice(0,2).join(' / ')}${parts.length>2?' 他':''}`;
}

// FEATURE[HADO-2.7.3.36-GROUP-FILTER-CACHE]: 状態変化グループ選択時は、個別状態変化×全候補の再帰判定を避け、派生JSON由来のグループ別所有者索引を優先利用する。
function getQuickStatusEffectGroupCacheVersionKey(){
  return ['groupOwnerIndex:v1',state.viewMode||'',state.equipmentStage||'',state.savedSearchCacheSeq||0,[...getQuickOwnerActiveDatasetKeys()].join('|')].map(norm).join('@@');
}
function getQuickStatusEffectItemLookup(categoryKey){
  const arr=categoryKey==='generals'?state.generals:categoryKey==='tactics'?state.tactics:categoryKey==='skills'?state.skills:categoryKey==='equipments'?state.equipments:categoryKey==='statusEffects'?state.statusEffects:[];
  const map=new Map();
  (Array.isArray(arr)?arr:[]).forEach(item=>{
    const names=[getItemDisplayName(item),item?.name,item?.title,item?.rawName,item?.raw?.name,item?.raw?.title,item?.raw?.rawName].map(norm).filter(Boolean);
    names.forEach(n=>{if(n&&!map.has(n))map.set(n,item);});
  });
  return map;
}
function getQuickStatusEffectGroupRelationGroup(entry){
  const statusName=norm(entry?.statusEffectName||entry?.baseName||entry?.name||entry?.displayName||'');
  const item=findStatusEffectItemByAnyName(statusName);
  if(item)return getStatusEffectRelationGroupKey(item);
  const type=norm(entry?.type||'');
  if(type==='有利変化')return 'selfStateBuff';
  if(type==='不利変化')return 'enemyStateDebuff';
  if(type==='能力変化(強化)')return 'selfAbilityBuff';
  if(type==='能力変化(弱化)')return 'enemyAbilityDebuff';
  return '';
}
function addQuickGroupOwnerName(bucket,categoryKey,name,hit){
  const n=norm(name);
  if(!n)return;
  if(!bucket[categoryKey])bucket[categoryKey]=new Map();
  const existing=bucket[categoryKey].get(n)||{hits:[]};
  const key=[hit?.name||'',hit?.groupKey||'',hit?.relationType||'',hit?.reason||'',hit?.sourceText||''].map(norm).join('@@');
  if(!existing._seen)existing._seen=new Set();
  if(!existing._seen.has(key)){
    existing._seen.add(key);
    existing.hits.push(hit);
  }
  bucket[categoryKey].set(n,existing);
}
function buildQuickStatusEffectGroupOwnerNameIndex(filter){
  const generated=buildQuickStatusEffectGroupOwnerNameIndexFromGeneratedJson(filter);
  if(generated)return generated;
  const group=norm(filter?.group||'');
  throw new Error(`状態変化グループ ${group||'(未指定)'} の正本JSON索引を利用できません。最新JSON一式を再読込してください。`);
}
function buildQuickStatusEffectGroupOwnerRowsFromIndex(filter){
  // HADO-2.9.0.10: ここでは標準カテゴリ自動ONを行わない。ユーザーの現在のカテゴリ状態だけで行を構築する。
  const index=buildQuickStatusEffectGroupOwnerNameIndex(filter);
  if(!index)return null;
  const started=performance.now();
  const datasets=[['generals','武将',state.generals],['tactics','戦法',state.tactics],['skills','技能',state.skills],['equipments','装備',state.equipments],['statusEffects','状態変化',state.statusEffects]];
  const activeDatasetKeys=getQuickOwnerActiveDatasetKeys();
  const rows=[];
  const stats=[];
  datasets.forEach(([key,label,items])=>{
    const arr=Array.isArray(items)?items:[];
    const active=activeDatasetKeys.has(key);
    const stat={key,label,active,total:arr.length,matched:0,source:index.source,cacheHit:!!index.cacheHit};
    stats.push(stat);
    if(!active)return;
    const ownerMap=index.bucket[key]||new Map();
    arr.forEach(item=>{
      if(state.viewMode==='saved'&&!itemMatchesSavedMode(item,key))return;
      const names=[getItemDisplayName(item),item?.name,item?.title,item?.rawName,item?.raw?.name,item?.raw?.title,item?.raw?.rawName].map(norm).filter(Boolean);
      let record=null;
      for(const n of names){if(ownerMap.has(n)){record=ownerMap.get(n);break;}}
      if(!record||!record.hits?.length)return;
      const hits=record.hits;
      const metric={display:`${filter.label} 所有`,value:hits.length,quickStatusEffect:true,reasonText:buildQuickOwnerSelectionReason(hits,filter),relationTypes:[...new Set(hits.map(h=>norm(h.relationType||'')).filter(Boolean))].join('/')};
      rows.push({key,label,item,metric});
      stat.matched++;
    });
  });
  rows.sort((a,b)=>{const order={generals:0,tactics:1,skills:2,equipments:3,statusEffects:4};const da=(order[a.key]??9)-(order[b.key]??9);if(da)return da;return getItemDisplayName(a.item).localeCompare(getItemDisplayName(b.item),'ja');});
  const ms=Number((performance.now()-started).toFixed(1));
  state.quickStatusEffectGroupFilterCacheDiag={group:index.group,label:filter.label||'',source:index.source,cacheHit:!!index.cacheHit,buildMs:index.buildMs,rowMs:ms,resultCount:rows.length,stats,relationEntries:index.relationEntries,parameterEntries:index.parameterEntries,countermeasureEntries:index.countermeasureEntries,timestamp:new Date().toISOString()};
  state.diagnostics.quickStatusEffectGroupFilterCache=safeCloneForDebug(state.quickStatusEffectGroupFilterCacheDiag);
  return {rows,stats,ms,source:index.source,cacheHit:!!index.cacheHit,indexBuildMs:index.buildMs};
}
function collectQuickStatusEffectOwnersFromRelatedLinkIndex(item,categoryKey,filter){
  if(!item||!filter)return [];
  if(!['generals','tactics','skills','equipments','statusEffects'].includes(categoryKey))return [];
  const entry=typeof getDerivedRelatedLinkIndexEntry==='function'?getDerivedRelatedLinkIndexEntry(item):null;
  const related=entry?.related||{};
  const rels=Array.isArray(related.statusEffects)?related.statusEffects:[];
  if(!rels.length)return [];
  const out=[];
  const seen=new Set();
  rels.forEach(v=>{
    const name=norm(v?.name||v?.statusEffectName||v?.displayName||v?.finalDisplayName||'');
    if(!name)return;
    const rel={name,groupKey:norm(v?.groupKey||''),relationType:norm(v?.relationType||''),reason:'related-link-index-quick-owner',targetSide:norm(v?.targetSide||''),sourceText:norm(v?.sourceText||v?.matchedText||v?.source||'hadou_related_link_index.json'),matchedText:norm(v?.matchedText||v?.sourceText||name),alias:norm(v?.linkTarget||v?.target||v?.parameter||''),direction:norm(v?.direction||'')};
    if(!quickStatusEffectRelationMatches(rel,filter))return;
    const key=[rel.name,rel.groupKey,rel.relationType,rel.sourceText].join('@@');
    if(seen.has(key))return;
    seen.add(key);
    out.push(rel);
  });
  return out;
}
function collectQuickStatusEffectOwnersForItem(item,categoryKey,filter,statusEffectNames){
  if(categoryKey==='skills'&&!equipmentSkillStageMatchesCurrent(item))return [];
  const options=categoryKey==='tactics'?{includeTacticAdditionalEffects:true,suppressDebug:true}:{suppressDebug:true};
  const bucket=getQuickStatusEffectRelationCacheBucket(item);
  const filterKey=[filter?.kind||'',filter?.key||'',filter?.group||'',filter?.label||'',filter?.statusName||'',filter?.relationType||'',getQuickStatusEffectFilterProfileKey(filter,statusEffectNames)].map(norm).join('@@');
  const stageKey=categoryKey==='equipments'?getEffectiveEquipmentStageForItem(item):'';const cacheKey=`${categoryKey}|${options.includeTacticAdditionalEffects?'withTacticEffects':'default'}|${filterKey}|stage:${stageKey}|view:${state.viewMode||''}|seq:${state.savedSearchCacheSeq||0}`;
  if(bucket&&bucket[cacheKey])return bucket[cacheKey];
  const profiles=getQuickStatusEffectFilterProfiles(filter,statusEffectNames);
  const out=[];
  const seen=new Set();
  if(isQuickStatusEffectGroupOwnerFilter(filter)){
    const index=buildQuickStatusEffectGroupOwnerNameIndex(filter);
    const ownerMap=index?.bucket?.[categoryKey];
    if(ownerMap){
      const names=[getItemDisplayName(item),item?.name,item?.title,item?.rawName,item?.raw?.name,item?.raw?.title,item?.raw?.rawName].map(norm).filter(Boolean);
      let record=null;
      for(const n of names){if(ownerMap.has(n)){record=ownerMap.get(n);break;}}
      if(record&&Array.isArray(record.hits)){
        record.hits.forEach(hit=>out.push({...hit,groupFilter:filter.group,groupFilterLabel:filter.label||'',groupIndexSource:index.source,groupIndexCacheHit:!!index.cacheHit}));
      }
      if(bucket)bucket[cacheKey]=out;
      return out;
    }
    const entries=getQuickStatusEffectEntriesForGroupFilter(filter);
    entries.forEach(entry=>{
      collectQuickStatusEffectOwnersForItem(item,categoryKey,entry,statusEffectNames).forEach(hit=>{
        const key=[hit.name,hit.groupKey,hit.relationType,hit.reason,hit.sourceText||hit.matchedText||''].join('@@');
        if(seen.has(key))return;
        seen.add(key);
        out.push({...hit,groupFilter:filter.group,groupFilterLabel:filter.label||''});
      });
    });
    if(bucket)bucket[cacheKey]=out;
    return out;
  }
  // FIX[HADO-2.7.0.7-COUNTERMEASURE-QUICK-SEARCH]:
  // 自部隊不利対策/敵部隊有利対策は状態変化プロファイル総当たりではなく、
  // effectCountermeasureIndex と同じ派生抽出結果で照合する。
  // これにより「強化時間短縮」などの対策名検索が、博達や強化時間短縮自身へ到達する。
  if(filter?.kind==='countermeasure'){
    const targetName=norm(filter.label||filter.statusName||'');
    const targetGroup=norm(filter.group||'');
    const targetRelation=normalizeCountermeasureRelationLabel(filter.relationType||'');
    collectCountermeasureRelationsForSourceItem(item,categoryKey).forEach(rel=>{
      if(targetGroup&&rel.groupKey!==targetGroup)return;
      if(targetName&&rel.name!==targetName)return;
      if(targetRelation&&rel.relation!==targetRelation)return;
      const key=[rel.name,rel.groupKey,rel.relation,rel.sourceType,rel.sourceName].join('@@');
      if(seen.has(key))return;
      seen.add(key);
      out.push({name:rel.name,groupKey:rel.groupKey,relationType:rel.relation,reason:'countermeasure-index',targetSide:rel.groupKey==='selfResistanceBuff'?'self':'enemy',sourceText:rel.sourceText,matchedText:rel.sourceText,alias:rel.target||'',direction:''});
    });
    if(bucket)bucket[cacheKey]=out;
    return out;
  }
  if(categoryKey==='statusEffects'){
    profiles.forEach(profile=>{
      const itemProfile=getStatusEffectProfile(item);
      const values=[itemProfile.originalName,itemProfile.displayName,itemProfile.summaryKey,...(itemProfile.aliases||[])].map(norm).filter(Boolean);
      const profileValues=[profile.originalName,profile.displayName,profile.summaryKey,...(profile.aliases||[])].map(norm).filter(Boolean);
      const matched=profileValues.some(v=>values.includes(v));
      if(!matched)return;
      const rel={name:itemProfile.displayName||itemProfile.originalName,groupKey:getStatusEffectRelationGroupKey(item),relationType:'',reason:'status-effect-self',targetSide:'',sourceText:`状態変化自身：${itemProfile.displayName||itemProfile.originalName||''}`};
      if(!quickStatusEffectRelationMatches(rel,filter))return;
      const key=[rel.name,rel.groupKey,rel.relationType,rel.reason].join('@@');
      if(seen.has(key))return;
      seen.add(key);
      out.push(rel);
    });
    if(bucket)bucket[cacheKey]=out;
    return out;
  }
  if(categoryKey==='generals'){
    const generalName=getItemDisplayName(item);
    getQuickStatusEffectTacticNamesForGeneralName(generalName).forEach(tacticName=>{
      const tactic=(Array.isArray(state?.tactics)?state.tactics:[]).find(t=>norm(getItemDisplayName(t))===norm(tacticName));
      if(!tactic)return;
      collectQuickStatusEffectOwnersForItem(tactic,'tactics',filter,statusEffectNames).forEach(hit=>{
        const key=[hit.name,hit.groupKey,hit.relationType,'source-general-tactic-status-effect',tacticName,hit.sourceText||hit.matchedText||''].join('@@');
        if(seen.has(key))return;
        seen.add(key);
        out.push({...hit,reason:'source-general-tactic-status-effect',sourceText:`戦法:${tacticName} / ${hit.sourceText||hit.matchedText||hit.name}`,matchedText:hit.matchedText||hit.name});
      });
    });
  }
  collectQuickStatusEffectOwnersFromRelatedLinkIndex(item,categoryKey,filter).forEach(rel=>{
    const key=[rel.name,rel.groupKey,rel.relationType,rel.reason,rel.sourceText||rel.matchedText||''].join('@@');
    if(seen.has(key))return;
    seen.add(key);
    out.push(rel);
  });
  const parts=buildStatusEffectRelatedLinkParts(item,options);
  for(const part of parts){
    for(const profile of profiles){
      let r=detectStatusEffectRelationForOwnerText(part,profile);
      if(!r.matched){
        const direct=detectQuickStatusEffectDirectAbilityMatch(part,profile);
        if(direct)r=direct;
      }
      if(!r.matched)continue;
      const display=profile.displayName||profile.originalName;
      const rel={name:display,groupKey:r.groupKey||'',relationType:r.relationType||'',reason:r.reason||'',targetSide:r.targetSide||'',sourceText:part,matchedText:part,alias:r.alias||'',direction:r.direction||''};
      if(!quickStatusEffectRelationMatches(rel,filter))continue;
      const key=[rel.name,rel.groupKey,rel.relationType,rel.reason].join('@@');
      if(seen.has(key))continue;
      seen.add(key);
      out.push(rel);
    }
  }
  if(bucket)bucket[cacheKey]=out;
  return out;
}


function ensureQuickOwnerDefaultActiveCategories(context){
  // HADO-2.9.0.11: 標準カテゴリの自動有効化は廃止。カテゴリ状態はユーザー操作のみを正本にする。
  return false;
}
function getQuickOwnerActiveDatasetKeys(){
  const keys=['generals','tactics','skills','equipments','statusEffects'];
  const active=keys.filter(key=>!!state.activeCategories?.[key]);
  return new Set(active);
}

function getQuickOwnerActiveDatasetLabel(){
  const labels={generals:'武将',tactics:'戦法',skills:'技能',equipments:'装備',statusEffects:'状態変化'};
  const keys=[...getQuickOwnerActiveDatasetKeys()];
  return keys.length?keys.map(k=>labels[k]||k).join(' / '):'未選択';
}
function buildQuickStatusEffectOwnerRows(filter){
  // HADO-2.9.0.11: 非同期/再構築時もカテゴリを勝手に戻さない。カテゴリ状態はユーザー操作のみを正本にする。
  if(isQuickStatusEffectGroupOwnerFilter(filter)){
    const indexed=buildQuickStatusEffectGroupOwnerRowsFromIndex(filter);
    if(indexed){
      debugLog('searchUx:group-owner-index-sync',{filter,resultCount:indexed.rows.length,stats:indexed.stats,ms:indexed.ms,indexBuildMs:indexed.indexBuildMs,cacheHit:indexed.cacheHit,source:indexed.source});
      return {rows:indexed.rows,stats:indexed.stats,ms:indexed.ms,source:indexed.source,cacheHit:indexed.cacheHit};
    }
  }
  const rows=[];
  const statusEffectNames=getAllStatusEffectNamesForRelatedLinks();
  const datasets=[['generals','武将',state.generals],['tactics','戦法',state.tactics],['skills','技能',state.skills],['equipments','装備',state.equipments],['statusEffects','状態変化',state.statusEffects]];
  const activeDatasetKeys=getQuickOwnerActiveDatasetKeys();
  const stats=[];
  datasets.forEach(([key,label,items])=>{
    let matched=0;
    const active=activeDatasetKeys.has(key);
    if(!active){stats.push({key,label,active:false,total:Array.isArray(items)?items.length:0,matched:0});return;}
    // クイック検索は状態変化所有者専用。カテゴリ選択だけ尊重し、キーワード・タグ条件は適用しない。
    (Array.isArray(items)?items:[]).forEach(item=>{
      if(state.viewMode==='saved'&&!itemMatchesSavedMode(item,key))return;
      const hits=collectQuickStatusEffectOwnersForItem(item,key,filter,statusEffectNames);
      if(!hits.length)return;
      const metric={display:`${filter.label} 所有`,value:hits.length,quickStatusEffect:true,reasonText:buildQuickOwnerSelectionReason(hits,filter),relationTypes:[...new Set(hits.map(h=>norm(h.relationType||'')).filter(Boolean))].join('/')};
      rows.push({key,label,item,metric});
      matched++;
    });
    stats.push({key,label,active,total:Array.isArray(items)?items.length:0,matched});
  });
  rows.sort((a,b)=>{
    const order={generals:0,tactics:1,skills:2,equipments:3,statusEffects:4};
    const da=(order[a.key]??9)-(order[b.key]??9);
    if(da)return da;
    return getItemDisplayName(a.item).localeCompare(getItemDisplayName(b.item),'ja');
  });
  return {rows,stats};
}

function getQuickOwnerFilterCacheKey(filter){
  if(!filter)return '';
  // カテゴリ選択はクイック検索に反映する。キーワード・タグは反映しない。
  return [filter.kind||'',filter.key||'',filter.group||'',filter.label||'',filter.statusName||'',filter.relationType||'',state.viewMode||'',state.equipmentStage||'',state.savedSearchCacheSeq||0,'equipmentSkillStageFilter:v1',[...getQuickOwnerActiveDatasetKeys()].join('|')].map(norm).join('@@');
}
function runQuickStatusEffectOwnerSearchAsync(filter,options={}){
  if(!filter)return;
  // FIX[HADO-2.9.0.17-QUICK-STATUS-PENDING-NO-CATEGORY]:
  // 状態変化グループ・状態変化フィルターはカテゴリ選択状態を変更しない。
  // 対象カテゴリが未選択の場合は空検索を走らせず、条件を保持した待機状態にする。
  if(getQuickOwnerActiveDatasetKeys().size===0){
    state._quickOwnerRowsCache=null;
    debugLog('searchUx:owner-search-pending-no-category',{source:'HADO-2.9.0.17',filter,reason:'quick status filter is retained until a target category is selected'});
    return;
  }
  // HADO-2.9.0.11: 非同期再検索でもカテゴリ自動ONを行わない。全解除・個別ON/OFFの手動状態を尊重する。
  const cacheKey=getQuickOwnerFilterCacheKey(filter);
  // FIX[HADO-2.7.3.48-QUICK-OWNER-FAVORITE-REFRESH]:
  // クイック検索中に一覧/詳細のお気に入りを切り替えると、保存索引更新でcache keyが変わる。
  // その状態でrenderSearchResultsだけを呼ぶと、非同期検索完了前に0件表示へ落ちるため、
  // お気に入り更新時だけ旧クイック検索結果をfallbackRowsとして保持し、非同期再検索完了後に差し替える。
  const keepPreviousRowsWhilePending=!!options.keepPreviousRowsWhilePending;
  const fallbackRows=(keepPreviousRowsWhilePending&&Array.isArray(options.fallbackRows))?options.fallbackRows.filter(row=>row&&row.item).slice():[];
  const fallbackReason=norm(options.reason||'');
  state._quickOwnerAsyncSeq=(state._quickOwnerAsyncSeq||0)+1;
  const seq=state._quickOwnerAsyncSeq;
  state._quickOwnerRowsCache={key:cacheKey,rows:[],stats:[],pending:true,keepPreviousRowsWhilePending,fallbackRows,fallbackReason};
  if(isQuickStatusEffectGroupOwnerFilter(filter)){
    // HADO-2.7.3.40: グループ索引生成は重くなる場合があるため、カテゴリクリック処理内では実行しない。
    // pendingを先に画面へ返してから、次のタスクで索引生成・結果反映を行う。
    setTimeout(()=>{
      if(seq!==state._quickOwnerAsyncSeq)return;
      const started=performance.now();
      const indexed=buildQuickStatusEffectGroupOwnerRowsFromIndex(filter);
      if(seq!==state._quickOwnerAsyncSeq)return;
      if(indexed){
        state._quickOwnerRowsCache={key:cacheKey,rows:indexed.rows,stats:indexed.stats,pending:false,ms:Number((performance.now()-started).toFixed(1)),source:indexed.source,cacheHit:indexed.cacheHit,indexBuildMs:indexed.indexBuildMs};
        debugLog('searchUx:group-owner-index-async',{source:'HADO-2.7.3.40',filter,resultCount:indexed.rows.length,stats:indexed.stats,ms:state._quickOwnerRowsCache.ms,indexBuildMs:indexed.indexBuildMs,cacheHit:indexed.cacheHit,sourceIndex:indexed.source});
      }else{
        state._quickOwnerRowsCache={key:cacheKey,rows:[],stats:[],pending:false,ms:Number((performance.now()-started).toFixed(1)),source:'group-index-empty'};
      }
      renderSearchResults();
      renderDetail();
    },0);
    return;
  }
  const statusEffectNames=getAllStatusEffectNamesForRelatedLinks();
  const datasets=[['generals','武将',state.generals],['tactics','戦法',state.tactics],['skills','技能',state.skills],['equipments','装備',state.equipments],['statusEffects','状態変化',state.statusEffects]];
  const activeDatasetKeys=getQuickOwnerActiveDatasetKeys();
  const tasks=[];
  const stats=[];
  datasets.forEach(([key,label,items])=>{
    const arr=Array.isArray(items)?items:[];
    const active=activeDatasetKeys.has(key);
    const stat={key,label,active,total:arr.length,matched:0};
    stats.push(stat);
    if(!active)return;
    arr.forEach(item=>tasks.push({key,label,item,stat}));
  });
  const rows=[];
  let idx=0;
  const started=performance.now();
  const chunkSize=18;
  const step=()=>{
    if(seq!==state._quickOwnerAsyncSeq)return;
    const end=Math.min(idx+chunkSize,tasks.length);
    for(;idx<end;idx++){
      const task=tasks[idx];
      const {key,label,item,stat}=task;
      if(state.viewMode==='saved'&&!itemMatchesSavedMode(item,key))continue;
      const hits=collectQuickStatusEffectOwnersForItem(item,key,filter,statusEffectNames);
      if(!hits.length)continue;
      const metric={display:`${filter.label} 所有`,value:hits.length,quickStatusEffect:true,reasonText:buildQuickOwnerSelectionReason(hits,filter),relationTypes:[...new Set(hits.map(h=>norm(h.relationType||'')).filter(Boolean))].join('/')};
      rows.push({key,label,item,metric});
      stat.matched++;
    }
    if(els.resultMeta)els.resultMeta.textContent=`状態変化検索中：${idx}/${tasks.length}件`;
    if(idx<tasks.length){setTimeout(step,0);return;}
    rows.sort((a,b)=>{const order={generals:0,tactics:1,skills:2,equipments:3,statusEffects:4};const da=(order[a.key]??9)-(order[b.key]??9);if(da)return da;return getItemDisplayName(a.item).localeCompare(getItemDisplayName(b.item),'ja');});
    state._quickOwnerRowsCache={key:cacheKey,rows,stats,pending:false,ms:Number((performance.now()-started).toFixed(1))};
    debugLog('searchUx:owner-results-async',{source:'HADO-2.5.5.25-mobile-search-ux',filter,resultCount:rows.length,stats,ms:state._quickOwnerRowsCache.ms});
    renderSearchResults();
    renderDetail();
  };
  setTimeout(step,0);
}
function clearQuickStatusEffectOwnerFilter(options={}){
  const keepGroup=!!options.keepGroup;
  state.quickStatusEffectOwnerFilter=null;
  state._quickOwnerRowsCache=null;
  state._quickOwnerAsyncSeq=(state._quickOwnerAsyncSeq||0)+1;
  const groupSelect=document.getElementById('quickStatusEffectGroupSelect');
  const quickSelect=document.getElementById('quickStatusEffectSelect');
  const resetBtn=document.getElementById('quickStatusEffectResetBtn');
  if(groupSelect&&!keepGroup)groupSelect.value='all';
  if(quickSelect)quickSelect.value='';
  if(resetBtn)resetBtn.classList.remove('is-active');
  refreshQuickStatusEffectOptions('');
  resetMobileResultSelectLimit();
  if(!options.skipRender){renderSearchResults();renderDetail();}
  renderSearchConditionChips();
  debugLog('searchUx:quick-reset',{source:'HADO-2.5.5.25-mobile-search-ux',skipRender:!!options.skipRender});
}
function getQuickStatusEffectGroupLabel(groupKey){return (SEARCH_UX_PRESET_GROUPS.find(g=>g.key===groupKey)||{}).label||'';}
function buildQuickStatusEffectGroupOwnerFilter(groupKey){
  const group=norm(groupKey||'');
  if(!group||group==='all'||!STATUS_EFFECT_RELATION_GROUP_LABELS[group])return null;
  const label=getQuickStatusEffectGroupLabel(group)||STATUS_EFFECT_RELATION_GROUP_LABELS[group]||group;
  return {key:`group:${group}`,group,label:`${label}すべて`,statusName:'',relationType:'',kind:'group'};
}
function isQuickStatusEffectGroupOwnerFilter(filter){return !!filter&&norm(filter.kind)==='group'&&!!norm(filter.group||'');}
function getQuickStatusEffectEntriesForGroupFilter(filter){
  const group=norm(filter?.group||'');
  if(!group)return [];
  return buildQuickStatusEffectEntries({groupFirst:false}).filter(entry=>entry.group===group&&entry.kind!=='group');
}
function refreshQuickStatusEffectOptions(selectedKey=''){
  const groupSelect=document.getElementById('quickStatusEffectGroupSelect');
  const quickSelect=document.getElementById('quickStatusEffectSelect');
  if(!quickSelect)return;
  const group=groupSelect?.value||'all';
  const entries=buildQuickStatusEffectEntries({groupFirst:group!=='all'}).filter(entry=>group==='all'||entry.group===group);
  quickSelect.innerHTML='<option value="">状態変化を選択</option>'+entries.map((entry,idx)=>`<option value="${esc(entry.key)}">${idx+1}. ${esc(entry.label)}</option>`).join('');
  if(selectedKey&&entries.some(entry=>entry.key===selectedKey))quickSelect.value=selectedKey;
  else quickSelect.value='';
  debugLog('searchUx:quick-options',{source:'HADO-2.5.5.18-quick-owner-freeze-fix',group,groupLabel:getQuickStatusEffectGroupLabel(group),count:entries.length,selectedKey:quickSelect.value});
}
function renderSearchConditionChips(){
  const wrap=document.getElementById('searchConditionChips');
  if(!wrap)return;
  const chips=[];
  if(isTypeSearchMode()){
    const activeCats=getTypeSearchActiveCategoryKeys().map(k=>DATASET_LABELS[k]||k);
    const statusMap=getTypeSearchCatalogMap('statusEffectRefs');
    const featureMap=getTypeSearchCatalogMap('typeFeatures');
    const statuses=(state.typeSearchSelectedStatusEffectIds||[]).map(id=>statusMap.get(id)?.label||id);
    const features=(state.typeSearchSelectedFeatureIds||[]).map(id=>featureMap.get(id)?.label||id);
    chips.push('<span class="search-condition-chip is-keyword">型検索</span>');
    const preset=getActiveTypeSearchPreset();if(preset)chips.push(`<span class="search-condition-chip">型：${esc(preset.typeName||preset.typeId||'')}${state.typeSearchPresetDirty?'（条件編集済み）':''}</span>`);
    chips.push(`<span class="search-condition-chip">カテゴリ：${esc(activeCats.length?activeCats.join(' / '):'未選択')}</span>`);
    chips.push(`<span class="search-condition-chip">対象：${state.viewMode==='saved'?'保存データ':'全データ'}</span>`);
    if(statuses.length)chips.push(`<span class="search-condition-chip">状態変化（OR）：${esc(statuses.join(' / '))}</span>`);
    if(features.length)chips.push(`<span class="search-condition-chip">型要素（OR）：${esc(features.join(' / '))}</span>`);
    const tags=Array.isArray(state.selectedTags)?state.selectedTags:[];
    if(tags.length)groupTagsByKey(tags).forEach((groupTags,key)=>{chips.push(`<span class="search-condition-chip">タグ（${esc(displayTagGroupKey(key))}・OR）：${esc(groupTags.map(getTagValueLabel).join(' / '))}</span>`);});
    wrap.innerHTML=chips.join('');
    return;
  }
  const quickResetBtn=document.getElementById('quickStatusEffectResetBtn');
  if(quickResetBtn)quickResetBtn.classList.toggle('is-active',!!state.quickStatusEffectOwnerFilter);
  if(state.quickStatusEffectOwnerFilter){
    chips.push(`<span class="search-condition-chip is-keyword">状態変化検索：${esc(state.quickStatusEffectOwnerFilter.label||'')}</span>`);
    chips.push(`<span class="search-condition-chip">対象データ：${esc(getQuickOwnerActiveDatasetLabel())}</span>`);
    chips.push(`<span class="search-condition-chip">表示範囲：${state.viewMode==='saved'?'保存データ':'全データ'}</span>`);
    wrap.innerHTML=chips.join('');
    return;
  }
  const keyword=norm(typeof currentKeyword==='function'?currentKeyword():(els.searchInput?.value||''));
  const activeCats=Object.entries(state.activeCategories||{}).filter(([,v])=>!!v).map(([k])=>DATASET_LABELS[k]||k);
  const tags=Array.isArray(state.selectedTags)?state.selectedTags:[];
  chips.push(`<span class="search-condition-chip ${keyword?'is-keyword':'is-empty'}">キーワード：${esc(keyword||'未指定')}</span>`);
  chips.push(`<span class="search-condition-chip">カテゴリ：${esc(activeCats.length?activeCats.join(' / '):'未選択')}</span>`);
  chips.push(`<span class="search-condition-chip">対象：${state.viewMode==='saved'?'保存データ':'全データ'}</span>`);
  chips.push(`<span class="search-condition-chip">範囲：${isNameOnlySearch&&isNameOnlySearch()?'名称のみ':'全文'}</span>`);
  if(tags.length)groupTagsByKey(tags).forEach((groupTags,key)=>{chips.push(`<span class="search-condition-chip">タグ（${esc(displayTagGroupKey(key))}・OR）：${esc(groupTags.map(getTagValueLabel).join(' / '))}</span>`);});
  wrap.innerHTML=chips.join('');
}
function applySearchUxPreset(key){
  if(state.searchMode!=='status')setSearchMode('status',{skipRender:true,skipHistory:true});
  const preset=getQuickStatusEffectEntryByKey(key);
  if(!preset)return;
  const groupSelect=document.getElementById('quickStatusEffectGroupSelect');
  if(groupSelect&&groupSelect.value!==preset.group){groupSelect.value=preset.group;refreshQuickStatusEffectOptions(key);}
  const quickSelect=document.getElementById('quickStatusEffectSelect');
  if(quickSelect&&quickSelect.value!==key)quickSelect.value=key;
  const resetBtn=document.getElementById('quickStatusEffectResetBtn');
  if(resetBtn)resetBtn.classList.add('is-active');
  state.quickStatusEffectOwnerFilter={key:preset.key,group:preset.group,label:preset.label,statusName:preset.statusName||preset.label,relationType:preset.relationType||'',kind:preset.kind||'status'};
  // クイック検索は専用の所有者検索として扱い、通常検索欄・タグ条件は変更しない。
  // HADO-2.9.0.11: カテゴリはユーザー操作のみを正本にし、未選択でも自動ONしない。
  resetMobileResultSelectLimit();
  state._quickOwnerRowsCache=null;
  renderSearchResults();
  renderDetail();
  runQuickStatusEffectOwnerSearchAsync(state.quickStatusEffectOwnerFilter);
  pushOperationHistory('quick-status-owner-search');
  debugLog('searchUx:preset-applied',{source:'HADO-2.5.5.25-mobile-search-ux',key,group:preset.group,groupLabel:getQuickStatusEffectGroupLabel(preset.group),label:preset.label,statusName:preset.statusName,relationType:preset.relationType||'',mode:'owner-search-only'});
}
function applySearchUxGroupFilter(groupKey){
  if(state.searchMode!=='status')setSearchMode('status',{skipRender:true,skipHistory:true});
  const filter=buildQuickStatusEffectGroupOwnerFilter(groupKey);
  if(!filter){clearQuickStatusEffectOwnerFilter();return;}
  const groupSelect=document.getElementById('quickStatusEffectGroupSelect');
  if(groupSelect&&groupSelect.value!==filter.group)groupSelect.value=filter.group;
  const quickSelect=document.getElementById('quickStatusEffectSelect');
  if(quickSelect)quickSelect.value='';
  const resetBtn=document.getElementById('quickStatusEffectResetBtn');
  if(resetBtn)resetBtn.classList.add('is-active');
  state.quickStatusEffectOwnerFilter=filter;
  resetMobileResultSelectLimit();
  state._quickOwnerRowsCache=null;
  state._quickOwnerAsyncSeq=(state._quickOwnerAsyncSeq||0)+1;
  // HADO-2.9.0.11: 状態変化グループ選択時もカテゴリを自動ONしない。
  // 全解除・個別カテゴリON/OFFを含め、ユーザーの手動カテゴリ状態をそのまま使う。
  renderSearchResults();
  renderDetail();
  runQuickStatusEffectOwnerSearchAsync(state.quickStatusEffectOwnerFilter);
  pushOperationHistory('quick-status-owner-group-search');
  debugLog('searchUx:group-filter-applied',{source:'HADO-2.7.3.39',group:filter.group,groupLabel:getQuickStatusEffectGroupLabel(filter.group),label:filter.label,mode:'owner-search-group'});
}
function setupSearchUxEnhancements(){
  document.querySelectorAll('[data-search-preset]').forEach(btn=>{
    btn.addEventListener('click',()=>applySearchUxPreset(btn.getAttribute('data-search-preset')));
  });
  const groupSelect=document.getElementById('quickStatusEffectGroupSelect');
  const quickSelect=document.getElementById('quickStatusEffectSelect');
  const resetBtn=document.getElementById('quickStatusEffectResetBtn');
  if(groupSelect){
    groupSelect.addEventListener('change',()=>{
      const group=groupSelect.value||'all';
      refreshQuickStatusEffectOptions('');
      if(group&&group!=='all'){
        applySearchUxGroupFilter(group);
      }else{
        clearQuickStatusEffectOwnerFilter();
      }
    });
  }
  if(resetBtn){
    resetBtn.addEventListener('click',()=>clearQuickStatusEffectOwnerFilter());
  }
  refreshQuickStatusEffectOptions(quickSelect?.value||'');
  if(quickSelect){
    quickSelect.addEventListener('change',()=>{
      const key=quickSelect.value;
      if(key)applySearchUxPreset(key);
      else {
        const group=document.getElementById('quickStatusEffectGroupSelect')?.value||'all';
        if(group&&group!=='all')applySearchUxGroupFilter(group);
        else clearQuickStatusEffectOwnerFilter({keepGroup:true});
      }
    });
  }
  renderSearchConditionChips();
  debugLog('searchUx:setup',{presetCount:document.querySelectorAll('[data-search-preset]').length,quickStatusEffectGroupSelect:!!groupSelect,quickStatusEffectSelect:!!quickSelect,quickStatusEffectOptions:quickSelect?quickSelect.options.length:0,quickStatusEffectResetBtn:!!resetBtn});
}


// FEATURE[HADO-2.9.3.0-TYPE-PRESET]: 状態変化検索を維持し、型検索へプリセット・重要度・適合度順を接続する。
const TYPE_SEARCH_PHASE3_MARKER='HADO-2.9.3.0: type-search-preset-importance-ranking';
const TYPE_SEARCH_ALLOWED_CATEGORIES=['generals','equipments','siegeWeapons','warhorseSkills'];
const TYPE_SEARCH_CATEGORY_ORDER={generals:0,equipments:1,siegeWeapons:2,warhorseSkills:3};
const TYPE_SEARCH_IMPORTANCE_ORDER={core:3,recommended:2,support:1,manual:0};
const TYPE_SEARCH_IMPORTANCE_LABELS={core:'中核',recommended:'推奨',support:'補助',manual:'手動'};
function isTypeSearchMode(){return norm(state.searchMode||'normal')==='type';}
function getTypeSearchIndexItems(){const entry=state.derivedData?.typeSearchFeatureIndex;return Array.isArray(entry?.items)?entry.items:[];}
function getTypeSearchPresetItems(){const entry=state.derivedData?.typeSearchPresets;return Array.isArray(entry?.items)?entry.items:[];}
function getTypeSearchPresetById(typeId){const id=norm(typeId||'');return getTypeSearchPresetItems().find(v=>norm(v?.typeId||'')===id)||null;}
function normalizeTypeSearchImportance(value){const v=norm(value||'');return Object.prototype.hasOwnProperty.call(TYPE_SEARCH_IMPORTANCE_ORDER,v)?v:'manual';}
function getTypeSearchPresetConditions(preset){if(!preset)return[];const rows=Array.isArray(preset?.conditions)?preset.conditions:[];if(rows.length)return rows.map(v=>({featureId:norm(v?.featureId||''),label:norm(v?.label||v?.featureId||''),conditionType:norm(v?.conditionType||''),importance:normalizeTypeSearchImportance(v?.importance),canonicalFeatureId:norm(v?.canonicalFeatureId||v?.featureId||'')})).filter(v=>v.featureId&&(v.conditionType==='statusEffect'||v.conditionType==='typeFeature'));const out=[];(preset?.statusEffectNames||[]).forEach(name=>out.push({featureId:`status_effect:${norm(name)}`,label:norm(name),conditionType:'statusEffect',importance:'recommended',canonicalFeatureId:`status_effect:${norm(name)}`}));(preset?.typeFeatureIds||[]).forEach(featureId=>out.push({featureId:norm(featureId),label:norm(featureId),conditionType:'typeFeature',importance:'recommended',canonicalFeatureId:norm(featureId)}));return out.filter(v=>v.featureId);}
function getActiveTypeSearchPreset(){return getTypeSearchPresetById(state.typeSearchSelectedPresetId);}
function getTypeSearchPresetConditionMap(){return new Map(getTypeSearchPresetConditions(getActiveTypeSearchPreset()).map(v=>[v.featureId,v]));}
function getTypeSearchConditionCanonicalId(featureId){const id=norm(featureId||'');return norm(getTypeSearchPresetConditionMap().get(id)?.canonicalFeatureId||id);}
function getTypeSearchConditionImportance(featureId){return getTypeSearchPresetConditionMap().get(norm(featureId||''))?.importance||'manual';}
function getTypeSearchImportanceLabel(value){return TYPE_SEARCH_IMPORTANCE_LABELS[normalizeTypeSearchImportance(value)]||'手動';}
function collectTypeSearchCatalogFrom(field){const map=new Map();getTypeSearchIndexItems().forEach(item=>(Array.isArray(item?.[field])?item[field]:[]).forEach(ref=>{const id=norm(ref?.featureId||'');if(!id||map.has(id))return;map.set(id,{featureId:id,label:norm(ref?.label||ref?.statusEffectName||id),featureType:norm(ref?.featureType||''),groupLabel:norm(ref?.groupLabel||''),groupKey:norm(ref?.groupKey||'')});}));return [...map.values()].sort((a,b)=>{const ga=norm(a.groupLabel||'');const gb=norm(b.groupLabel||'');if(ga!==gb)return ga.localeCompare(gb,'ja');return a.label.localeCompare(b.label,'ja');});}
function getTypeSearchStatusCatalog(){return collectTypeSearchCatalogFrom('statusEffectRefs');}
function getTypeSearchFeatureCatalog(){return collectTypeSearchCatalogFrom('typeFeatures');}
function getTypeSearchCatalogMap(field){return new Map((field==='statusEffectRefs'?getTypeSearchStatusCatalog():getTypeSearchFeatureCatalog()).map(x=>[x.featureId,x]));}
function getTypeSearchSelectedConditionCount(){return uniq([...(state.typeSearchSelectedStatusEffectIds||[]),...(state.typeSearchSelectedFeatureIds||[])].map(getTypeSearchConditionCanonicalId)).length;}
function getTypeSearchActiveCategoryKeys(){return TYPE_SEARCH_ALLOWED_CATEGORIES.filter(key=>!!state.activeCategories?.[key]);}
function dedupeTypeSearchConditionsByCanonical(rows){const map=new Map();(rows||[]).forEach(v=>{const key=norm(v?.canonicalFeatureId||v?.featureId||'');if(!key)return;const prev=map.get(key);if(!prev||(TYPE_SEARCH_IMPORTANCE_ORDER[normalizeTypeSearchImportance(v?.importance)]||0)>(TYPE_SEARCH_IMPORTANCE_ORDER[normalizeTypeSearchImportance(prev?.importance)]||0))map.set(key,v);});return [...map.values()];}
function summarizeTypeSearchImportance(rows){const out={core:0,recommended:0,support:0,manual:0};dedupeTypeSearchConditionsByCanonical(rows).forEach(v=>{const k=normalizeTypeSearchImportance(v?.importance);out[k]=(out[k]||0)+1;});return out;}
function refreshTypeSearchPresetOptions(){const select=document.getElementById('typeSearchPresetSelect');if(!select)return;const selected=norm(state.typeSearchSelectedPresetId||select.value||'');const rows=getTypeSearchPresetItems();select.innerHTML='<option value="">手動で条件を選択</option>'+rows.map(v=>`<option value="${esc(v.typeId||'')}">${esc(v.typeName||v.typeId||'')}</option>`).join('');if(selected&&rows.some(v=>norm(v?.typeId||'')===selected))select.value=selected;else select.value='';renderTypeSearchPresetInfo();}
function renderTypeSearchPresetInfo(){const info=document.getElementById('typeSearchPresetInfo');if(!info)return;const wasOpen=!!info.open;const preset=getActiveTypeSearchPreset();if(!preset){info.className='type-search-preset-info is-empty';info.innerHTML='<summary>型プリセットを選択すると条件を自動設定</summary><div class="type-search-preset-detail">状態変化と型要素をまとめて設定します。</div>';info.open=wasOpen;return;}const conditions=getTypeSearchPresetConditions(preset);const counts=summarizeTypeSearchImportance(conditions);const dirty=state.typeSearchPresetDirty?'<span class="type-search-preset-dirty">条件編集済み</span>':'';const groupHtml=['core','recommended','support'].map(importance=>{const labels=conditions.filter(v=>normalizeTypeSearchImportance(v?.importance)===importance).map(v=>norm(v?.label||v?.featureId||'')).filter(Boolean);if(!labels.length)return'';return `<span class="type-search-preset-condition-group"><span class="type-search-importance-chip is-${importance}">${esc(getTypeSearchImportanceLabel(importance))}</span> ${esc(labels.join(' / '))}</span>`;}).join('');info.className='type-search-preset-info';info.innerHTML=`<summary><span class="type-search-preset-title">${esc(preset.typeName||preset.typeId||'')}${dirty}</span>：中核${counts.core||0}・推奨${counts.recommended||0}・補助${counts.support||0}</summary><div class="type-search-preset-detail"><span>${esc(preset.description||'')}</span>${groupHtml}</div>`;info.open=wasOpen;}
function refreshTypeSearchOptions(){refreshTypeSearchPresetOptions();const statusSelect=document.getElementById('typeSearchStatusEffectSelect');const featureSelect=document.getElementById('typeSearchFeatureSelect');if(statusSelect){const selected=statusSelect.value||'';const rows=getTypeSearchStatusCatalog();statusSelect.innerHTML='<option value="">状態変化を選択</option>'+rows.map(x=>`<option value="${esc(x.featureId)}">${x.groupLabel?`[${esc(x.groupLabel)}] `:''}${esc(x.label)}</option>`).join('');if(selected&&rows.some(x=>x.featureId===selected))statusSelect.value=selected;}if(featureSelect){const selected=featureSelect.value||'';const rows=getTypeSearchFeatureCatalog();featureSelect.innerHTML='<option value="">型要素を選択</option>'+rows.map(x=>`<option value="${esc(x.featureId)}">${esc(x.label)}</option>`).join('');if(selected&&rows.some(x=>x.featureId===selected))featureSelect.value=selected;}renderTypeSearchSelectedConditions();}
function renderTypeSearchSelectedConditionList(id,selectedIds,field){const wrap=document.getElementById(id);if(!wrap)return;const catalog=getTypeSearchCatalogMap(field);const ids=uniq((selectedIds||[]).map(norm).filter(Boolean));wrap.innerHTML='';if(!ids.length){wrap.innerHTML='<span class="type-search-empty">未指定</span>';return;}ids.forEach(featureId=>{const info=catalog.get(featureId)||{label:featureId};const importance=getTypeSearchConditionImportance(featureId);const badge=document.createElement('span');badge.className=`type-search-badge is-${importance}`;const label=document.createElement('span');label.className='type-search-badge-label';label.textContent=getTypeSearchImportanceLabel(importance);badge.appendChild(label);badge.appendChild(document.createTextNode(' '+info.label));const btn=document.createElement('button');btn.type='button';btn.className='type-search-badge-remove';btn.textContent='×';btn.setAttribute('aria-label',info.label+' を解除');btn.addEventListener('click',()=>removeTypeSearchCondition(field,featureId));badge.appendChild(btn);wrap.appendChild(badge);});}
function renderTypeSearchSelectedConditions(){renderTypeSearchSelectedConditionList('typeSearchSelectedStatusEffects',state.typeSearchSelectedStatusEffectIds,'statusEffectRefs');renderTypeSearchSelectedConditionList('typeSearchSelectedFeatures',state.typeSearchSelectedFeatureIds,'typeFeatures');renderTypeSearchPresetInfo();}
function markTypeSearchPresetDirty(){if(state.typeSearchSelectedPresetId)state.typeSearchPresetDirty=true;renderTypeSearchPresetInfo();}
function addTypeSearchCondition(field,featureId){const id=norm(featureId||'');if(!id)return;const key=field==='statusEffectRefs'?'typeSearchSelectedStatusEffectIds':'typeSearchSelectedFeatureIds';state[key]=uniq([...(state[key]||[]),id]);markTypeSearchPresetDirty();renderTypeSearchSelectedConditions();resetMobileResultSelectLimit();renderSearchResults();renderDetail();pushOperationHistory('type-search-condition-add');debugLog('typeSearch:condition-add',{field,featureId:id,presetId:state.typeSearchSelectedPresetId,presetDirty:state.typeSearchPresetDirty,statusEffectIds:state.typeSearchSelectedStatusEffectIds,featureIds:state.typeSearchSelectedFeatureIds});}
function removeTypeSearchCondition(field,featureId){const id=norm(featureId||'');const key=field==='statusEffectRefs'?'typeSearchSelectedStatusEffectIds':'typeSearchSelectedFeatureIds';state[key]=(state[key]||[]).filter(x=>x!==id);markTypeSearchPresetDirty();renderTypeSearchSelectedConditions();resetMobileResultSelectLimit();renderSearchResults();renderDetail();pushOperationHistory('type-search-condition-remove');debugLog('typeSearch:condition-remove',{field,featureId:id,presetId:state.typeSearchSelectedPresetId,presetDirty:state.typeSearchPresetDirty,statusEffectIds:state.typeSearchSelectedStatusEffectIds,featureIds:state.typeSearchSelectedFeatureIds});}
function clearTypeSearchConditions(options={}){state.typeSearchSelectedPresetId='';state.typeSearchPresetDirty=false;state.typeSearchSelectedStatusEffectIds=[];state.typeSearchSelectedFeatureIds=[];const select=document.getElementById('typeSearchPresetSelect');if(select)select.value='';renderTypeSearchSelectedConditions();resetMobileResultSelectLimit();if(!options.skipRender){renderSearchResults();renderDetail();pushOperationHistory('type-search-clear');}debugLog('typeSearch:clear',{skipRender:!!options.skipRender});}
function applyTypeSearchPreset(typeId,options={}){const id=norm(typeId||'');if(!id){clearTypeSearchConditions(options);return;}const preset=getTypeSearchPresetById(id);if(!preset)return;const statusCatalog=getTypeSearchCatalogMap('statusEffectRefs');const featureCatalog=getTypeSearchCatalogMap('typeFeatures');const conditions=getTypeSearchPresetConditions(preset);const missing=[];const statusIds=[];const featureIds=[];conditions.forEach(c=>{if(c.conditionType==='statusEffect'){if(statusCatalog.has(c.featureId))statusIds.push(c.featureId);else missing.push(c.featureId);}else if(c.conditionType==='typeFeature'){if(featureCatalog.has(c.featureId))featureIds.push(c.featureId);else missing.push(c.featureId);}});state.typeSearchSelectedPresetId=id;state.typeSearchPresetDirty=false;state.typeSearchSelectedStatusEffectIds=uniq(statusIds);state.typeSearchSelectedFeatureIds=uniq(featureIds);const select=document.getElementById('typeSearchPresetSelect');if(select)select.value=id;renderTypeSearchSelectedConditions();resetMobileResultSelectLimit();if(!options.skipRender){renderSearchResults();renderDetail();if(!options.skipHistory)pushOperationHistory('type-search-preset-'+id);}debugLog('typeSearch:preset-apply',{presetId:id,typeName:preset.typeName,conditionCount:conditions.length,statusEffectIds:state.typeSearchSelectedStatusEffectIds,featureIds:state.typeSearchSelectedFeatureIds,missing});}
function updateSearchModeUi(){const mode=norm(state.searchMode||'normal');[['normal','searchModeNormalBtn'],['status','searchModeStatusBtn'],['type','searchModeTypeBtn']].forEach(([key,id])=>{const btn=document.getElementById(id);if(!btn)return;const active=mode===key;btn.classList.toggle('is-active',active);btn.setAttribute('aria-selected',active?'true':'false');});const statusBar=document.getElementById('searchPresetBar');if(statusBar)statusBar.hidden=mode!=='status';const typePanel=document.getElementById('typeSearchPanel');if(typePanel)typePanel.hidden=mode!=='type';const queryRow=document.getElementById('searchQueryRow');if(queryRow)queryRow.hidden=mode==='status';const inputRow=document.getElementById('normalSearchInputRow');if(inputRow)inputRow.hidden=mode!=='normal';const tagWrap=document.getElementById('tagSearchWrap');if(tagWrap)tagWrap.hidden=mode==='status';const enterNote=document.querySelector('.search-enter-note');if(enterNote)enterNote.hidden=mode!=='normal';if(els.nameOnlySearchToggle)els.nameOnlySearchToggle.disabled=mode!=='normal';if(els.clearKeywordBtn)els.clearKeywordBtn.hidden=mode!=='normal';if(els.copyParamResultsBtn)els.copyParamResultsBtn.hidden=mode==='type';document.querySelectorAll('#categoryBar button[data-category]').forEach(btn=>{const hidden=mode==='type'&&!TYPE_SEARCH_ALLOWED_CATEGORIES.includes(btn.dataset.category||'');btn.classList.toggle('type-search-category-hidden',hidden);btn.disabled=hidden;});renderTypeSearchSelectedConditions();renderSearchConditionChips();}
function setSearchMode(mode,options={}){const next=['normal','status','type'].includes(norm(mode))?norm(mode):'normal';const previous=norm(state.searchMode||'normal');if(previous!==next){if(next==='type'&&previous!=='type'){state.typeSearchCategoriesBeforeEnter=safeCloneForDebug(state.activeCategories);Object.keys(state.activeCategories||{}).forEach(key=>{state.activeCategories[key]=TYPE_SEARCH_ALLOWED_CATEGORIES.includes(key);});}else if(previous==='type'&&next!=='type'&&state.typeSearchCategoriesBeforeEnter){Object.keys(state.activeCategories||{}).forEach(key=>{state.activeCategories[key]=!!state.typeSearchCategoriesBeforeEnter[key];});state.typeSearchCategoriesBeforeEnter=null;}state.searchMode=next;if(next!=='status')clearQuickStatusEffectOwnerFilter({skipRender:true});updateCategoryStyles();}updateSearchModeUi();if(!options.skipRender){resetMobileResultSelectLimit();renderSearchResults();renderDetail();if(!options.skipHistory)pushOperationHistory('search-mode-'+next);}debugLog('searchMode:set',{previous,next,skipRender:!!options.skipRender});}
function setupTypeSearchUi(){const bind=(id,fn)=>{const el=document.getElementById(id);if(el)el.addEventListener('click',fn);};const presetSelect=document.getElementById('typeSearchPresetSelect');if(presetSelect)presetSelect.addEventListener('change',()=>applyTypeSearchPreset(presetSelect.value));bind('searchModeNormalBtn',()=>setSearchMode('normal'));bind('searchModeStatusBtn',()=>setSearchMode('status'));bind('searchModeTypeBtn',()=>setSearchMode('type'));bind('typeSearchStatusEffectAddBtn',()=>{const select=document.getElementById('typeSearchStatusEffectSelect');addTypeSearchCondition('statusEffectRefs',select?.value||'');if(select)select.value='';});bind('typeSearchFeatureAddBtn',()=>{const select=document.getElementById('typeSearchFeatureSelect');addTypeSearchCondition('typeFeatures',select?.value||'');if(select)select.value='';});bind('typeSearchClearBtn',()=>clearTypeSearchConditions());refreshTypeSearchOptions();updateSearchModeUi();debugLog('typeSearch:setup',{presetCount:getTypeSearchPresetItems().length,statusCatalogCount:getTypeSearchStatusCatalog().length,featureCatalogCount:getTypeSearchFeatureCatalog().length,allowedCategories:TYPE_SEARCH_ALLOWED_CATEGORIES,autoSearch:true,manualRunButton:false,uiLayout:'compact-3rows'});}

const TYPE_SEARCH_CACHE_MAX_ENTRIES=40;
function getTypeSearchResultCacheMap(){if(!(state.typeSearchResultCache instanceof Map))state.typeSearchResultCache=new Map();return state.typeSearchResultCache;}
function getTypeSearchDataSetId(){return norm(state.derivedData?.typeSearchFeatureIndex?.dataSetId||state.derivedData?.typeSearchPresets?.dataSetId||state.derivedData?.statusEffectRelations?.dataSetId||'');}
function invalidateTypeSearchResultCache(reason=''){const cache=getTypeSearchResultCacheMap();const previousSize=cache.size;cache.clear();state.typeSearchCacheSeq=(state.typeSearchCacheSeq||0)+1;state.typeSearchCacheStats=state.typeSearchCacheStats||{hit:0,miss:0,invalidations:0,store:0};state.typeSearchCacheStats.invalidations=(state.typeSearchCacheStats.invalidations||0)+1;state.typeSearchLastInvalidationReason=norm(reason||'');const diag={timestamp:debugTimestamp(),reason:state.typeSearchLastInvalidationReason,previousSize,seq:state.typeSearchCacheSeq,stats:safeCloneForDebug(state.typeSearchCacheStats)};state.diagnostics.typeSearchCacheInvalidation=diag;debugLog('typeSearch:cache-invalidate',diag);}
function getTypeSearchSavedModePolicy(){return {viewMode:state.viewMode,restrictedCategories:state.viewMode==='saved'?['generals','equipments']:[],alwaysVisibleCategories:['siegeWeapons','warhorseSkills'],savedSearchCacheSeq:state.savedSearchCacheSeq||0,policy:'HADO-2.9.4.0: 保存データ表示では武将・装備だけを所有登録で絞り込み、兵器・軍馬技能は候補探索のため全件表示する。'};}
function itemMatchesTypeSearchViewMode(item,categoryKey){if(state.viewMode!=='saved')return true;if(categoryKey==='generals'||categoryKey==='equipments')return itemMatchesSavedMode(item,categoryKey);return categoryKey==='siegeWeapons'||categoryKey==='warhorseSkills';}
function getTypeSearchResultCacheKey(){return JSON.stringify({dataSetId:getTypeSearchDataSetId(),presetId:state.typeSearchSelectedPresetId||'',presetDirty:!!state.typeSearchPresetDirty,statusEffectIds:uniq([...(state.typeSearchSelectedStatusEffectIds||[])].map(norm).filter(Boolean)).sort(),featureIds:uniq([...(state.typeSearchSelectedFeatureIds||[])].map(norm).filter(Boolean)).sort(),selectedTags:uniq([...(state.selectedTags||[])].map(norm).filter(Boolean)).sort(),activeCategories:getTypeSearchActiveCategoryKeys().slice().sort(),viewMode:state.viewMode,savedSearchCacheSeq:state.viewMode==='saved'?(state.savedSearchCacheSeq||0):0});}
function cloneTypeSearchRows(rows){return (rows||[]).map(row=>({...row,typeSearchMatches:(row.typeSearchMatches||[]).map(hit=>({...hit})),typeSearchImportance:{...(row.typeSearchImportance||{})},metric:{...(row.metric||{})}}));}
function storeTypeSearchResultCache(key,rows,stats,phase){if(!key)return;const cache=getTypeSearchResultCacheMap();if(cache.has(key))cache.delete(key);cache.set(key,{rows:cloneTypeSearchRows(rows),stats:safeCloneForDebug(stats),phase:safeCloneForDebug(phase),createdAt:Date.now()});while(cache.size>TYPE_SEARCH_CACHE_MAX_ENTRIES){const oldest=cache.keys().next().value;cache.delete(oldest);}state.typeSearchCacheStats=state.typeSearchCacheStats||{hit:0,miss:0,invalidations:0,store:0};state.typeSearchCacheStats.store=(state.typeSearchCacheStats.store||0)+1;}
function getCachedTypeSearchResult(key){const cache=getTypeSearchResultCacheMap();if(!key||!cache.has(key))return null;const value=cache.get(key);cache.delete(key);cache.set(key,value);return {rows:cloneTypeSearchRows(value.rows),stats:safeCloneForDebug(value.stats),phase:safeCloneForDebug(value.phase),createdAt:value.createdAt};}
function buildTypeSearchMatchesForIndexItem(indexItem,phase=null){const selectedStatus=new Set((state.typeSearchSelectedStatusEffectIds||[]).map(norm));const selectedFeatures=new Set((state.typeSearchSelectedFeatureIds||[]).map(norm));const hits=[];const add=(ref,kind)=>{const id=norm(ref?.featureId||'');const canonicalFeatureId=getTypeSearchConditionCanonicalId(id);if(!id||hits.some(x=>x.canonicalFeatureId===canonicalFeatureId))return;hits.push({featureId:id,canonicalFeatureId,label:norm(ref?.label||ref?.statusEffectName||id),kind,importance:getTypeSearchConditionImportance(id),source:norm(ref?.sourcePartType||ref?.source||''),groupLabel:norm(ref?.groupLabel||'')});};let t=performance.now();(Array.isArray(indexItem?.statusEffectRefs)?indexItem.statusEffectRefs:[]).forEach(ref=>{if(selectedStatus.has(norm(ref?.featureId||'')))add(ref,'状態変化');});if(phase)phase.statusEffectMatchMs=(phase.statusEffectMatchMs||0)+(performance.now()-t);t=performance.now();(Array.isArray(indexItem?.typeFeatures)?indexItem.typeFeatures:[]).forEach(ref=>{if(selectedFeatures.has(norm(ref?.featureId||'')))add(ref,'型要素');});if(phase)phase.featureMatchMs=(phase.featureMatchMs||0)+(performance.now()-t);return hits;}
function summarizeTypeSearchMatches(hits){const counts=summarizeTypeSearchImportance(hits);return {total:(hits||[]).length,core:counts.core||0,recommended:counts.recommended||0,support:counts.support||0,manual:counts.manual||0};}
function formatTypeSearchReasonText(hits){const groups={core:[],recommended:[],support:[],manual:[]};(hits||[]).forEach(hit=>groups[normalizeTypeSearchImportance(hit?.importance)].push(`${hit.kind}：${hit.label}`));return ['core','recommended','support','manual'].filter(k=>groups[k].length).map(k=>`${getTypeSearchImportanceLabel(k)}：${groups[k].join(' / ')}`).join(' ｜ ');}
function formatTypeSearchReasonsHtml(hits){const groups={core:[],recommended:[],support:[],manual:[]};(hits||[]).forEach(hit=>groups[normalizeTypeSearchImportance(hit?.importance)].push(`${hit.kind}：${hit.label}`));return ['core','recommended','support','manual'].filter(k=>groups[k].length).map(k=>`<span class="type-search-result-reason-group"><span class="type-search-result-reason-label is-${k}">${esc(getTypeSearchImportanceLabel(k))}：</span>${esc(groups[k].join(' / '))}</span>`).join('');}
function renderTypeSearchResultList(rows){if(!els.results)return;els.results.innerHTML='';const renderLimit=getSearchResultRenderLimit(rows,'',false);rows.slice(0,renderLimit).forEach(row=>{const li=document.createElement('li');if(state.selectedItem===row.item)li.classList.add('active');const displayName=getResultCardDisplayName(row);const subTitle=getResultCardSubtitle(row);const saved=(row.key==='generals'||row.key==='equipments')&&isSavedName(row.key,displayName);const main=document.createElement('div');main.className='search-result-card-main';const reasons=formatTypeSearchReasonsHtml(row.typeSearchMatches||[]);main.innerHTML=`<div class="search-result-top"><span class="search-result-category">${esc(row.label)}</span><span class="search-result-title">${esc(displayName)}</span><span class="search-result-metric">${esc(row.metric?.display||'')}</span></div>${subTitle?`<div class="search-result-meta">${esc(subTitle)}</div>`:''}${reasons?`<div class="type-search-result-reasons"><strong>一致理由：</strong>${reasons}</div>`:''}`;main.addEventListener('click',()=>selectItemAndRender(row.item,row.label,{reason:'type-search-result-click',preserveListScroll:true}));li.appendChild(main);if(row.key==='generals'||row.key==='equipments'){const btn=document.createElement('button');btn.type='button';btn.className=`save-star ${saved?'is-saved':''}`;btn.textContent=saved?'★':'☆';btn.addEventListener('click',e=>{e.stopPropagation();toggleSavedName(row.key,displayName);});li.appendChild(btn);}els.results.appendChild(li);});if(renderLimit<rows.length){const moreLi=document.createElement('li');moreLi.className='search-result-more-row';const btn=document.createElement('button');btn.type='button';btn.className='copy-btn';btn.textContent=`さらに表示（${renderLimit}/${rows.length}件）`;btn.addEventListener('click',e=>{e.stopPropagation();increaseSearchResultRenderLimit();});moreLi.appendChild(btn);els.results.appendChild(moreLi);}return renderLimit;}
function renderTypeSearchResults(){const searchProgressSeq=beginSearchProgressIndicator();const started=performance.now();const previousSelectedItem=state.selectedItem;const conditionCount=getTypeSearchSelectedConditionCount();const activeKeys=getTypeSearchActiveCategoryKeys();const selectedTags=[...(state.selectedTags||[])];const cacheKey=getTypeSearchResultCacheKey();const cacheMap=getTypeSearchResultCacheMap();let rows=[];let stats={};TYPE_SEARCH_ALLOWED_CATEGORIES.forEach(key=>{stats[key]={active:activeKeys.includes(key),total:0,matched:0};});let phase={candidateCount:0,afterSavedFilterCount:0,afterTagFilterCount:0,matchedCount:0,savedFilteredOutCount:0,tagFilteredOutCount:0,savedFilterMs:0,tagFilterMs:0,statusEffectMatchMs:0,featureMatchMs:0,sortMs:0,cacheLookupMs:0,selectRenderMs:0,domRenderMs:0};let cacheHit=false;let cached=null;if(conditionCount&&activeKeys.length){let t=performance.now();cached=getCachedTypeSearchResult(cacheKey);phase.cacheLookupMs+=performance.now()-t;if(cached){cacheHit=true;rows=cached.rows||[];stats=cached.stats||stats;phase={...phase,...(cached.phase||{}),cacheLookupMs:phase.cacheLookupMs};state.typeSearchCacheStats=state.typeSearchCacheStats||{hit:0,miss:0,invalidations:0,store:0};state.typeSearchCacheStats.hit=(state.typeSearchCacheStats.hit||0)+1;}else{state.typeSearchCacheStats=state.typeSearchCacheStats||{hit:0,miss:0,invalidations:0,store:0};state.typeSearchCacheStats.miss=(state.typeSearchCacheStats.miss||0)+1;getTypeSearchIndexItems().forEach(indexItem=>{const key=norm(indexItem?.category||'');if(!activeKeys.includes(key))return;stats[key].total++;phase.candidateCount++;const item=findItemByCategoryAndName(key,indexItem?.name||'');if(!item)return;let t=performance.now();const savedOk=itemMatchesTypeSearchViewMode(item,key);phase.savedFilterMs+=performance.now()-t;if(!savedOk){phase.savedFilteredOutCount++;return;}phase.afterSavedFilterCount++;t=performance.now();const tagOk=matchesSelectedTags(item);phase.tagFilterMs+=performance.now()-t;if(!tagOk){phase.tagFilteredOutCount++;return;}phase.afterTagFilterCount++;const hits=buildTypeSearchMatchesForIndexItem(indexItem,phase);if(!hits.length)return;const importance=summarizeTypeSearchMatches(hits);stats[key].matched++;phase.matchedCount++;rows.push({key,label:indexItem?.categoryLabel||DATASET_LABELS[key]||key,item,typeSearchMatches:hits,typeSearchImportance:importance,metric:{display:`一致 ${hits.length}/${conditionCount}（中核${importance.core}・推奨${importance.recommended}・補助${importance.support}${importance.manual?`・手動${importance.manual}`:''}）`,value:hits.length,reasonText:formatTypeSearchReasonText(hits),typeSearch:true}});});let t=performance.now();rows.sort((a,b)=>{const ai=a.typeSearchImportance||{};const bi=b.typeSearchImportance||{};let d=(bi.core||0)-(ai.core||0);if(d)return d;d=(bi.total||0)-(ai.total||0);if(d)return d;d=(bi.recommended||0)-(ai.recommended||0);if(d)return d;d=(bi.support||0)-(ai.support||0);if(d)return d;const c=(TYPE_SEARCH_CATEGORY_ORDER[a.key]??9)-(TYPE_SEARCH_CATEGORY_ORDER[b.key]??9);if(c)return c;return getItemDisplayName(a.item).localeCompare(getItemDisplayName(b.item),'ja');});phase.sortMs=performance.now()-t;storeTypeSearchResultCache(cacheKey,rows,stats,phase);}}if(rows.length){const current=state.selectedItem?rows.find(row=>row.item===state.selectedItem):null;if(!current){state.selectedItem=rows[0].item;state.selectedLabel=rows[0].label;state.detailActiveTab=getDetailInitialTabForItem(rows[0].item);}}else{state.selectedItem=null;state.selectedLabel='';state.detailActiveTab='';}state.lastResultRows=rows;updateResultNavigationButtons();let t=performance.now();renderResultSelect(rows);phase.selectRenderMs=performance.now()-t;t=performance.now();const renderLimit=renderTypeSearchResultList(rows);phase.domRenderMs=performance.now()-t;let finalText='';if(!conditionCount)finalText='型検索：型プリセット、状態変化、または型要素を選択してください。';else if(!activeKeys.length)finalText='型検索：対象カテゴリを選択してください。';else finalText=`ヒット件数：${rows.length}件`;finishSearchProgressIndicator(searchProgressSeq,finalText);renderSearchConditionChips();const round=v=>Number((Number(v)||0).toFixed(1));const profile={timestamp:debugTimestamp(),mode:'type',presetId:state.typeSearchSelectedPresetId||'',presetDirty:!!state.typeSearchPresetDirty,conditionCount,statusEffectIds:[...(state.typeSearchSelectedStatusEffectIds||[])],featureIds:[...(state.typeSearchSelectedFeatureIds||[])],selectedTags,activeCategories:activeKeys,viewMode:state.viewMode,savedModePolicy:getTypeSearchSavedModePolicy(),cacheHit,cacheKey,cacheSize:cacheMap.size,cacheSeq:state.typeSearchCacheSeq||0,cacheStats:safeCloneForDebug(state.typeSearchCacheStats||{}),candidateCount:phase.candidateCount,afterSavedFilterCount:phase.afterSavedFilterCount,afterTagFilterCount:phase.afterTagFilterCount,savedFilteredOutCount:phase.savedFilteredOutCount,tagFilteredOutCount:phase.tagFilteredOutCount,resultCount:rows.length,renderedCount:renderLimit,statusEffectMatchMs:round(phase.statusEffectMatchMs),featureMatchMs:round(phase.featureMatchMs),savedFilterMs:round(phase.savedFilterMs),tagFilterMs:round(phase.tagFilterMs),sortMs:round(phase.sortMs),cacheLookupMs:round(phase.cacheLookupMs),selectRenderMs:round(phase.selectRenderMs),domRenderMs:round(phase.domRenderMs),topRows:rows.slice(0,10).map(row=>({category:row.key,name:getItemDisplayName(row.item),importance:row.typeSearchImportance,reasons:formatTypeSearchReasonText(row.typeSearchMatches)})),categoryStats:stats,history:{index:state.operationHistoryIndex,size:state.operationHistory.length},totalMs:round(performance.now()-started),policy:'HADO-2.9.4.0: 型検索はJSON正本プリセットを利用し、状態変化と型要素はOR、属性タグはグループ内OR・グループ間AND。保存データ表示では武将・装備のみ所有登録で絞り込み、兵器・軍馬技能は全件候補。結果はdataSetId・条件集合・タグ・カテゴリ・表示範囲・保存索引世代でキャッシュする。'};state.diagnostics.typeSearch=profile;state.diagnostics.typeSearchCache={timestamp:profile.timestamp,cacheHit,cacheKey,cacheSize:cacheMap.size,cacheSeq:profile.cacheSeq,cacheStats:profile.cacheStats,lastInvalidationReason:state.typeSearchLastInvalidationReason||'',savedModePolicy:profile.savedModePolicy};state.lastSearchProfile=profile;updateSearchDiagnosticSnapshot(profile);debugLog('typeSearch:profile',profile);debugLog('typeSearch:cache',state.diagnostics.typeSearchCache);if(previousSelectedItem!==state.selectedItem)renderDetail();return rows;}

function getSearchWarhorseItems(){return (Array.isArray(state.warhorses)?state.warhorses:[]).filter(item=>getWarhorseMasterKind(item)==='famous');}
function renderInitialSearchPlaceholder(){
  debugLog('initial-search-placeholder:render');
  state.lastResultRows=[];
  state.selectedItem=null;
  state.selectedLabel='';
  state.detailActiveTab='';
  if(els.resultMeta)els.resultMeta.textContent='未実行：カテゴリ選択またはキーワード入力';
  renderSearchConditionChips();
  renderResultSelect([]);
  if(els.results){
    els.results.innerHTML='<li class="search-initial-empty"><div class="detail-empty">カテゴリを選択、またはキーワードを入力してください。</div></li>';
  }
  updateSearchDiagnosticSnapshot({keyword:currentKeyword(),effectiveKeyword:'',nameOnlySearch:isNameOnlySearch(),hasActive:Object.values(state.activeCategories||{}).some(Boolean),activeCategories:state.activeCategories,uiCategoryState:getCategoryUiState(),datasetStats:[],results:0,initialPlaceholder:true});
  debugResponsiveSnapshot('renderInitialSearchPlaceholder');
}
function isBroadSearchResultSet(rows,q,nameOnlySearch){
  const tags=Array.isArray(state.selectedTags)?state.selectedTags:[];
  if(q||nameOnlySearch||tags.length||state.quickStatusEffectOwnerFilter)return false;
  const activeKeys=Object.keys(state.activeCategories||{}).filter(key=>!!state.activeCategories[key]);
  if(activeKeys.length!==1)return false;
  const key=activeKeys[0];
  if(key!=='generals'&&key!=='tactics')return false;
  return Array.isArray(rows)&&rows.length>=300;
}
function shouldDeferAutoDetailForBroadSearch(rows,q,nameOnlySearch){
  return isBroadSearchResultSet(rows,q,nameOnlySearch);
}
// FEATURE[HADO-2.9.0.28-SEARCH-PROGRESS]:
// 検索結果件数欄を一時的な進捗インジケーターとして使う。
// 通常検索は描画完了後に0%→100%を短時間表示して件数へ戻す。
// 状態変化グループの非同期検索は結果確定まで95%で待機する。
function clearSearchProgressTimer(){
  if(state._searchProgressTimer){clearTimeout(state._searchProgressTimer);clearInterval(state._searchProgressTimer);state._searchProgressTimer=0;}
}
function setSearchProgressIndicatorValue(seq,value){
  if(seq!==state._searchProgressSeq||!els.resultMeta)return;
  const v=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
  state._searchProgressValue=v;
  els.resultMeta.textContent=`検索中：${v}%`;
}
function beginSearchProgressIndicator(){
  clearSearchProgressTimer();
  const seq=(state._searchProgressSeq||0)+1;
  state._searchProgressSeq=seq;
  setSearchProgressIndicatorValue(seq,0);
  state._searchProgressTimer=setInterval(()=>{
    if(seq!==state._searchProgressSeq){clearSearchProgressTimer();return;}
    const current=Math.max(0,Number(state._searchProgressValue)||0);
    if(current>=95)return;
    setSearchProgressIndicatorValue(seq,Math.min(95,current+5));
  },40);
  return seq;
}
function finishSearchProgressIndicator(seq,finalText){
  if(seq!==state._searchProgressSeq)return;
  clearSearchProgressTimer();
  const advance=()=>{
    if(seq!==state._searchProgressSeq)return;
    const current=Math.max(0,Number(state._searchProgressValue)||0);
    if(current>=100){
      state._searchProgressTimer=setTimeout(()=>{
        if(seq===state._searchProgressSeq&&els.resultMeta)els.resultMeta.textContent=finalText;
      },100);
      return;
    }
    const next=Math.min(100,current+Math.max(10,Math.ceil((100-current)/3)));
    setSearchProgressIndicatorValue(seq,next);
    state._searchProgressTimer=setTimeout(advance,35);
  };
  state._searchProgressTimer=setTimeout(advance,0);
}
function keepSearchProgressIndicatorPending(seq){
  if(seq!==state._searchProgressSeq)return;
  // beginSearchProgressIndicator() の interval を維持し、95%で待機する。
}
function renderSearchResults(){
  if(isTypeSearchMode())return renderTypeSearchResults();
  const searchProgressSeq=beginSearchProgressIndicator();
  debugTimeStart('renderSearchResults時間');
  const totalStart=performance.now();
  const previousSelectedItem=state.selectedItem;
  let searchSelectionChanged=false;
  state._searchCacheStats=makeSearchCacheStats();
  state._savedMetricDebugCount=0;
  const nameOnlySearch=isNameOnlySearch();
  state.nameOnlySearch=nameOnlySearch;
  const searchContext=nameOnlySearch?null:currentSearchContext();
  debugLog('searchContext',{nameOnlySearch,context:searchContext});
  const effectiveKeyword=norm(nameOnlySearch?currentKeyword():((searchContext?.base)||currentKeyword()));
  const q=effectiveKeyword.toLowerCase();
  const rows=[];
  // HADO-2.9.0.11: 描画側・開始操作側ともカテゴリを自動ONしない。
  // 全解除・個別カテゴリON/OFFはユーザーの明示操作として保持する。
  const hasActive=Object.values(state.activeCategories).some(Boolean);
  const datasets=[['generals','武将',state.generals],['tactics','戦法',state.tactics],['skills','技能',state.skills],['equipments','装備',state.equipments],['statusEffects','状態変化',state.statusEffects],['siegeWeapons','兵器',state.siegeWeapons],['ethnicArmaments','武装',state.ethnicArmaments],['formations','陣形',state.formationMasters],['warhorses','名馬',getSearchWarhorseItems()],['warhorseSkills','軍馬技能',state.warhorseSkills]];
  const uiCategoryState=getCategoryUiState();
  const datasetStats=[];
  const categoryCount={};
  let buildTextMs=0,savedFilterMs=0,tagFilterMs=0,keywordMatchMs=0,metricMs=0,sortMs=0,renderSelectMs=0,domRenderMs=0;
  let searchIndexFastPathHit=0,searchIndexRuntimeFallback=0,parameterSearchRequested=0;
  updateCategoryDiagnosticSnapshot('renderSearchResults:start');
  debugLog('renderSearchResults:start',{viewMode:state.viewMode,activeCategories:state.activeCategories,uiCategoryState,keyword:q,effectiveKeyword,hasActive,metricMode:searchContext?.mode||'',nameOnlySearch,selectedTags:state.selectedTags||[],quickStatusEffectOwnerFilter:state.quickStatusEffectOwnerFilter||null});
  if(!state.quickStatusEffectOwnerFilter)datasets.forEach(([key,label,items])=>{
    const total=Array.isArray(items)?items.length:0;
    const cat={active:!!state.activeCategories[key],total,matched:0,ms:0,buildTextMs:0,savedFilterMs:0,tagFilterMs:0,keywordMatchMs:0,metricMs:0,parameterSearchTextCache:{hit:0,miss:0,bypass:0},metricSourceCache:{hit:0,miss:0,bypass:0}};
    categoryCount[key]=cat;
    if(!hasActive||!state.activeCategories[key]){datasetStats.push({key,label,active:false,total,matched:0});return;}
    const catStart=performance.now();
    debugTimeStart(`dataset処理時間:${key}`);
    let datasetMatched=0;
    (Array.isArray(items)?items:[]).forEach(item=>{
      if(!item)return;
      let t=performance.now();
      if(state.viewMode==='saved'&&!itemMatchesSavedMode(item,key)){const e=performance.now()-t;savedFilterMs+=e;cat.savedFilterMs+=e;return;}
      {const e=performance.now()-t;savedFilterMs+=e;cat.savedFilterMs+=e;}
      t=performance.now();
      if(!matchesSelectedTags(item)){const e=performance.now()-t;tagFilterMs+=e;cat.tagFilterMs+=e;return;}
      {const e=performance.now()-t;tagFilterMs+=e;cat.tagFilterMs+=e;}
      let keywordMatched=false;
      if(!q){
        keywordMatched=true;
        cat.parameterSearchTextCache.bypass++;
      }else if(nameOnlySearch){
        t=performance.now();
        const displayName=getItemDisplayName(item).toLowerCase();
        {const e=performance.now()-t;buildTextMs+=e;cat.buildTextMs+=e;}
        t=performance.now();
        keywordMatched=displayName.includes(q);
        {const e=performance.now()-t;keywordMatchMs+=e;cat.keywordMatchMs+=e;}
      }else{
        t=performance.now();
        const needsParamSearch=isParameterSummarySearchKeyword(q);
        const searchable=needsParamSearch?buildRuntimeSearchableText(item,q):getFastSearchableText(item);
        if(needsParamSearch){parameterSearchRequested++;searchIndexRuntimeFallback++;}else searchIndexFastPathHit++;
        {const e=performance.now()-t;buildTextMs+=e;cat.buildTextMs+=e;}
        t=performance.now();
        keywordMatched=searchable.includes(q);
        {const e=performance.now()-t;keywordMatchMs+=e;cat.keywordMatchMs+=e;}
      }
      if(keywordMatched){
        t=performance.now();
        const metric=(!searchContext||nameOnlySearch)?null:extractMetricFromItem(item,searchContext);
        {const e=performance.now()-t;metricMs+=e;cat.metricMs+=e;}
        rows.push({key,label,item,metric});datasetMatched++;
      }
    });
    cat.matched=datasetMatched;cat.ms=performance.now()-catStart;
    debugLog('dataset matched',{key,total,matched:datasetMatched});
    datasetStats.push({key,label,active:true,total,matched:datasetMatched});
    debugTimeEnd(`dataset処理時間:${key}`);
  });
  if(state.quickStatusEffectOwnerFilter){
    const cacheKey=getQuickOwnerFilterCacheKey(state.quickStatusEffectOwnerFilter);
    let quickOwner=(state._quickOwnerRowsCache&&state._quickOwnerRowsCache.key===cacheKey)?state._quickOwnerRowsCache:null;
    const quickHasActive=Object.values(state.activeCategories||{}).some(Boolean);
    if(!quickHasActive){
      rows.length=0;
      state._quickOwnerRowsCache=null;
      debugLog('searchUx:owner-results-wait-category',{source:'HADO-2.7.3.39',filter:state.quickStatusEffectOwnerFilter});
    }else{
    // HADO-2.7.3.40: ここで同期的にグループ索引を作ると、カテゴリON直後にフリーズする。
    // 結果は runQuickStatusEffectOwnerSearchAsync の非同期処理で反映し、ここでは待機表示に留める。
    if((!quickOwner||quickOwner.pending)&&isQuickStatusEffectGroupOwnerFilter(state.quickStatusEffectOwnerFilter)){
      debugLog('searchUx:owner-results-group-pending-no-sync',{source:'HADO-2.7.3.40',filter:state.quickStatusEffectOwnerFilter,cacheKey});
    }
    rows.length=0;
    if(quickOwner&&!quickOwner.pending){
      rows.push(...(quickOwner.rows||[]));
      debugLog('searchUx:owner-results',{source:'HADO-2.5.5.25-mobile-search-ux',filter:state.quickStatusEffectOwnerFilter,resultCount:rows.length,stats:quickOwner.stats,ms:quickOwner.ms});
    }else if(quickOwner&&quickOwner.pending&&quickOwner.keepPreviousRowsWhilePending&&Array.isArray(quickOwner.fallbackRows)&&quickOwner.fallbackRows.length){
      rows.push(...quickOwner.fallbackRows.filter(row=>row&&row.item));
      debugLog('searchUx:owner-results-pending-fallback',{source:'HADO-2.7.3.48-QUICK-OWNER-FAVORITE-REFRESH',filter:state.quickStatusEffectOwnerFilter,resultCount:rows.length,reason:quickOwner.fallbackReason||'',policy:'お気に入り切替後の非同期再検索中だけ旧結果を保持して0件表示を防止'});
    }else{
      debugLog('searchUx:owner-results-pending',{source:'HADO-2.5.5.25-mobile-search-ux',filter:state.quickStatusEffectOwnerFilter});
    }
    }
  }
  if(searchContext&&!state.quickStatusEffectOwnerFilter){const t=performance.now();debugTimeStart('metric sort時間');rows.sort((a,b)=>{const aHas=!!a.metric;const bHas=!!b.metric;if(aHas!==bHas)return aHas?-1:1;if(aHas&&bHas&&a.metric.value!==b.metric.value)return b.metric.value-a.metric.value;return 0;});debugTimeEnd('metric sort時間');sortMs=performance.now()-t;}else if(!state.quickStatusEffectOwnerFilter&&shouldApplyTacticAttackSort(currentKeyword(),rows)){const t=performance.now();debugTimeStart('tactic attack sort時間');rows.sort(compareTacticAttackRows);debugTimeEnd('tactic attack sort時間');sortMs=performance.now()-t;debugLog('tacticAttackSearch:sort',{keyword:currentKeyword(),resultCount:rows.length,policy:'戦法攻撃検索時は攻撃率降順、対象部隊数降順、攻撃補正あり優先で表示'});}
  const pendingSelection=state._pendingDetailLinkSelection||null;
  if(rows.length){
    const pendingRow=pendingSelection?rows.find(row=>row.item===pendingSelection.item):null;
    const currentRow=state.selectedItem?rows.find(row=>row.item===state.selectedItem):null;
    const currentName=state.selectedItem?norm(getItemDisplayName(state.selectedItem)).toLowerCase():'';
    const exactRow=q?rows.find(row=>norm(getItemDisplayName(row.item)).toLowerCase()===q):null;
    if(pendingRow){
      state.selectedItem=pendingRow.item;
      state.selectedLabel=pendingRow.label;
      state.detailActiveTab=getDetailInitialTabForItem(pendingRow.item);
      debugLog('search:auto-select-pending-detail-link',{name:getItemDisplayName(pendingRow.item),label:pendingRow.label,resultCount:rows.length,requested:pendingSelection.name||''});
    }else if(exactRow&&currentName!==q){
      state.selectedItem=exactRow.item;
      state.selectedLabel=exactRow.label;
      state.detailActiveTab=getDetailInitialTabForItem(exactRow.item);
      debugLog('search:auto-select-exact-name',{name:getItemDisplayName(exactRow.item),label:exactRow.label,resultCount:rows.length,keyword:q,previous:currentName});
    }else if(!currentRow){
      if(shouldDeferAutoDetailForBroadSearch(rows,q,nameOnlySearch)){
        state.selectedItem=null;
        state.selectedLabel='';
        state.detailActiveTab='';
        debugLog('search:auto-select-deferred-broad-category',{resultCount:rows.length,reason:'blank broad category browse',activeCategories:state.activeCategories});
      }else{
        state.selectedItem=rows[0].item;
        state.selectedLabel=rows[0].label;
        state.detailActiveTab=getDetailInitialTabForItem(rows[0].item);
        debugLog('search:auto-select-first',{name:getItemDisplayName(rows[0].item),label:rows[0].label,resultCount:rows.length,reason:(q||nameOnlySearch||((state.selectedTags||[]).length))?'filtered-search':'initial-first-result'});
      }
    }
  }else if(state.selectedItem){
    state.selectedItem=null;
    state.selectedLabel='';
  }
  searchSelectionChanged=state.selectedItem!==previousSelectedItem;
  const quickWaitingForCategory=!!(state.quickStatusEffectOwnerFilter&&getQuickOwnerActiveDatasetKeys().size===0);
  const quickPending=!!(state.quickStatusEffectOwnerFilter&&state._quickOwnerRowsCache&&state._quickOwnerRowsCache.pending);
  const finalResultMetaText=quickWaitingForCategory?`状態変化フィルター選択中：${state.quickStatusEffectOwnerFilter.label||''}。対象カテゴリを選択してください。`:`ヒット件数：${rows.length}件`;
  if(quickPending&&!quickWaitingForCategory)keepSearchProgressIndicatorPending(searchProgressSeq);else finishSearchProgressIndicator(searchProgressSeq,finalResultMetaText);
  renderSearchConditionChips();
  state.lastResultRows=rows;
  updateResultNavigationButtons();
  let t=performance.now();renderResultSelect(rows);forceResultSelectToCurrentItem('renderSearchResults:after-result-select');renderSelectMs=performance.now()-t;
  debugResponsiveSnapshot('renderSearchResults:after-result-select');
  t=performance.now();
  els.results.innerHTML='';
  updateSearchDiagnosticSnapshot({keyword:currentKeyword(),effectiveKeyword,nameOnlySearch,hasActive,activeCategories:state.activeCategories,uiCategoryState,datasetStats,results:rows.length,skillDatasetCount:Array.isArray(state.skills)?state.skills.length:0,hasBushoInSkills:Array.isArray(state.skills)?state.skills.some(item=>norm(item?.name||'')==='武聖'):false});
  let domMetricRowCount=0;const domMetricSamples=[];
  const renderLimit=getSearchResultRenderLimit(rows,q,nameOnlySearch);rows.slice(0,renderLimit).forEach(row=>{const li=document.createElement('li');if(state.selectedItem===row.item)li.classList.add('active');const displayName=getResultCardDisplayName(row);const subTitle=getResultCardSubtitle(row);const metricLabel=row.metric?row.metric.display:'';const useCompactCard=!!getResultCardIndexForRow(row)&&!metricLabel&&!q;const tacticAttackBadges=useCompactCard?'':((row.key==='tactics'||row.key==='generals')?renderTacticAttackResultBadges(row.item):'');const saved=(row.key==='generals'||row.key==='equipments')&&isSavedName(row.key,displayName);const cardBadges=getResultCardBadgesHtml(row);const main=document.createElement('div');main.className='search-result-card-main';const reasonText=row.metric&&row.metric.reasonText?row.metric.reasonText:'';main.innerHTML=`<div class="search-result-top"><span class="search-result-category">${esc(row.label)}</span><span class="search-result-title">${esc(displayName)}</span>${metricLabel?`<span class="search-result-metric">${esc(metricLabel)}</span>`:''}</div>${subTitle?`<div class="search-result-meta">${esc(subTitle)}</div>`:''}${cardBadges?`<div class="search-result-subrow">${cardBadges}</div>`:''}${reasonText?`<div class="search-result-reason">${esc(reasonText)}</div>`:''}${tacticAttackBadges?`<div class="search-result-subrow">${tacticAttackBadges}</div>`:''}`;if(metricLabel){domMetricRowCount++;if(domMetricSamples.length<10)domMetricSamples.push({name:norm(displayName),metricLabel,html:main.innerHTML});}main.addEventListener('click',()=>{selectItemAndRender(row.item,row.label,{reason:'result-click',preserveListScroll:true});});li.appendChild(main);if(row.key==='generals'||row.key==='equipments'){const btn=document.createElement('button');btn.type='button';btn.className=`save-star ${saved?'is-saved':''}`;btn.textContent=saved?'★':'☆';btn.addEventListener('click',e=>{e.stopPropagation();toggleSavedName(row.key,displayName);});li.appendChild(btn);}els.results.appendChild(li);});if(renderLimit<rows.length){const moreLi=document.createElement('li');moreLi.className='search-result-more-row';const btn=document.createElement('button');btn.type='button';btn.className='copy-btn';btn.textContent=`さらに表示（${renderLimit}/${rows.length}件）`;btn.addEventListener('click',e=>{e.stopPropagation();increaseSearchResultRenderLimit();});moreLi.appendChild(btn);els.results.appendChild(moreLi);}if(quickWaitingForCategory){els.results.innerHTML=`<li class="search-initial-empty"><div class="detail-empty">状態変化フィルター「${esc(state.quickStatusEffectOwnerFilter?.label||'')}」を選択中です。対象カテゴリを選択すると絞り込みます。</div></li>`;}
  domRenderMs=performance.now()-t;
  const stats=state._searchCacheStats||makeSearchCacheStats();
  Object.keys(categoryCount).forEach(k=>{const c=categoryCount[k];c.ms=Number((c.ms||0).toFixed(1));c.buildTextMs=Number((c.buildTextMs||0).toFixed(1));c.savedFilterMs=Number((c.savedFilterMs||0).toFixed(1));c.tagFilterMs=Number((c.tagFilterMs||0).toFixed(1));c.keywordMatchMs=Number((c.keywordMatchMs||0).toFixed(1));c.metricMs=Number((c.metricMs||0).toFixed(1));c.parameterSearchTextCache=safeCloneForDebug(stats.byCategory?.[k]?.parameterSearchText||{hit:0,miss:0,bypass:0});c.metricSourceCache=safeCloneForDebug(stats.byCategory?.[k]?.metricSource||{hit:0,miss:0,bypass:0});debugLog('categorySearch:profile',{key:k,label:(datasets.find(d=>d[0]===k)||[])[1]||k,...c});});
  debugLog('renderSearchResults:dom metric summary',{rowCount:rows.length,domMetricRowCount,domMetricSamples});
  debugLog('tagSearch:filter',{keyword:currentKeyword(),selectedTags:state.selectedTags||[],selectedTagGroups:getSelectedTagGroupsDebug(),groupRelation:'AND',afterCount:rows.length});
  debugLog('renderSearchResults:end',buildSearchDebugInfo(searchContext,rows));
  const profile={keyword:currentKeyword(),nameOnlySearch,viewMode:state.viewMode,categoryCount,totalMs:Number((performance.now()-totalStart).toFixed(1)),buildTextMs:Number(buildTextMs.toFixed(1)),savedFilterMs:Number(savedFilterMs.toFixed(1)),tagFilterMs:Number(tagFilterMs.toFixed(1)),keywordMatchMs:Number(keywordMatchMs.toFixed(1)),metricMs:Number(metricMs.toFixed(1)),sortMs:Number(sortMs.toFixed(1)),renderSelectMs:Number(renderSelectMs.toFixed(1)),domRenderMs:Number(domRenderMs.toFixed(1)),searchIndexUsage:{fastPathHit:searchIndexFastPathHit,runtimeFallback:searchIndexRuntimeFallback,parameterSearchRequested},resultCardIndex:safeCloneForDebug(state.diagnostics.resultCardIndex||{}),tagIndex:safeCloneForDebug(state.diagnostics.tagIndex||{}),statusEffectGroupOwnerIndex:safeCloneForDebug(state.quickStatusEffectGroupFilterCacheDiag||{}),renderedCount:typeof renderLimit==='number'?renderLimit:Math.min(rows.length,1000),totalMatched:rows.length,parameterSearchTextCache:safeCloneForDebug(stats.parameterSearchText),metricSourceCache:safeCloneForDebug(stats.metricSource),resultCount:rows.length};
  state.lastSearchProfile=profile;
  state.diagnostics.searchProfile=safeCloneForDebug(profile);
  if(state.diagnostics.search)state.diagnostics.search.searchProfile=safeCloneForDebug(profile);
  debugLog('searchTextCache:summary',{viewMode:state.viewMode,activeCategories:state.activeCategories,parameterSearchText:profile.parameterSearchTextCache,metricSource:profile.metricSourceCache});
  debugLog('searchTextCache:categorySummary',{viewMode:state.viewMode,keyword:currentKeyword(),categoryCount:buildCategoryCacheStatsForProfile(categoryCount)});
  debugLog('search:profile',profile);
  if(searchSelectionChanged&&(state._pendingDetailLinkSelection||q||nameOnlySearch||((state.selectedTags||[]).length))){
    const expectedItem=state.selectedItem;
    setTimeout(()=>{
      if(expectedItem&&state.selectedItem===expectedItem){
        debugLog('renderSearchResults:async-detail-sync',{name:getItemDisplayName(expectedItem),category:detailCategory(expectedItem),reason:'selection changed during search'});
        renderDetail();
      }
    },0);
  }
  debugTimeEnd('renderSearchResults時間');
}
function recordCategoryProfile(entry){
  if(!state.categoryProfileHistory)state.categoryProfileHistory=[];
  state.categoryProfileSeq=(state.categoryProfileSeq||0)+1;
  const focused=state.lastSearchProfile?.categoryCount?.[entry.categoryKey]||null;
  const rec={seq:state.categoryProfileSeq,timestamp:new Date().toLocaleTimeString('ja-JP',{hour12:false}),...entry,resultCount:state.lastResultRows?.length||0,activeCategories:safeCloneForDebug(state.activeCategories),focusedCategory:safeCloneForDebug(focused),categoryCount:safeCloneForDebug(state.lastSearchProfile?.categoryCount||{}),detailProfile:safeCloneForDebug(state.diagnostics?.detailProfile||{}),slowContentDetailProfile:safeCloneForDebug(state.diagnostics?.lastSlowContentDetailProfile||{})};
  state.categoryProfileHistory.push(rec);
  if(state.categoryProfileHistory.length>50)state.categoryProfileHistory=state.categoryProfileHistory.slice(-50);
  debugLog('categoryProfileHistory:record',rec);
}
function updateCategoryStyles(){const buttons=document.querySelectorAll('[data-category]');buttons.forEach(btn=>{const key=btn.dataset.category;const hidden=isTypeSearchMode()&&!TYPE_SEARCH_ALLOWED_CATEGORIES.includes(key);const active=!!state.activeCategories[key];btn.classList.toggle('toggle-active',active);btn.classList.toggle('type-search-category-hidden',hidden);btn.disabled=hidden;btn.setAttribute('aria-pressed',active?'true':'false');});debugLog('category styles synced',{state:state.activeCategories,ui:getCategoryUiState(),searchMode:state.searchMode});}
function toggleCategory(categoryKey){if(isTypeSearchMode()&&!TYPE_SEARCH_ALLOWED_CATEGORIES.includes(categoryKey))return;const before=safeCloneForDebug(state.activeCategories);const beforeActive=!!state.activeCategories[categoryKey];const start=performance.now();state.activeCategories[categoryKey]=!state.activeCategories[categoryKey];const afterActive=!!state.activeCategories[categoryKey];debugLog('toggleCategory',{categoryKey,before,after:state.activeCategories,quickOwnerActive:!!state.quickStatusEffectOwnerFilter});updateCategoryStyles();if(state.quickStatusEffectOwnerFilter){state._quickOwnerRowsCache=null;runQuickStatusEffectOwnerSearchAsync(state.quickStatusEffectOwnerFilter);}const s=performance.now();renderSearchResults();const searchMs=performance.now()-s;const d=performance.now();renderDetail();const detailMs=performance.now()-d;recordCategoryProfile({categoryKey,beforeActive,afterActive,viewMode:state.viewMode,keyword:currentKeyword(),searchMs:Number(searchMs.toFixed(1)),detailMs:Number(detailMs.toFixed(1)),totalMs:Number((performance.now()-start).toFixed(1))});pushOperationHistory('category');}
function selectAllCategories(){const before=safeCloneForDebug(state.activeCategories);Object.keys(state.activeCategories).forEach(key=>{state.activeCategories[key]=isTypeSearchMode()?TYPE_SEARCH_ALLOWED_CATEGORIES.includes(key):true;});debugLog('selectAllCategories',{before,after:state.activeCategories,quickOwnerActive:!!state.quickStatusEffectOwnerFilter});updateCategoryStyles();if(state.quickStatusEffectOwnerFilter){state._quickOwnerRowsCache=null;runQuickStatusEffectOwnerSearchAsync(state.quickStatusEffectOwnerFilter);}renderSearchResults();renderDetail();pushOperationHistory('category-select-all');}
function clearAllCategories(){const before=safeCloneForDebug(state.activeCategories);Object.keys(state.activeCategories).forEach(key=>{state.activeCategories[key]=false;});debugLog('clearAllCategories',{before,after:state.activeCategories,quickOwnerActive:!!state.quickStatusEffectOwnerFilter});updateCategoryStyles();if(state.quickStatusEffectOwnerFilter){state._quickOwnerRowsCache=null;runQuickStatusEffectOwnerSearchAsync(state.quickStatusEffectOwnerFilter);}renderSearchResults();renderDetail();pushOperationHistory('category-clear-all');}
function setupCategoryButtons(){[['generals','武将'],['tactics','戦法'],['skills','技能'],['equipments','装備'],['statusEffects','状態変化'],['siegeWeapons','兵器'],['ethnicArmaments','武装'],['formations','陣形'],['warhorses','名馬'],['warhorseSkills','軍馬技能']].forEach(([key,label])=>{const btn=document.createElement('button');btn.type='button';btn.dataset.category=key;btn.textContent=label;btn.addEventListener('click',()=>toggleCategory(key));els.categoryBar.appendChild(btn);});if(els.selectAllCategoriesBtn)els.selectAllCategoriesBtn.addEventListener('click',selectAllCategories);if(els.clearAllCategoriesBtn)els.clearAllCategoriesBtn.addEventListener('click',clearAllCategories);updateCategoryStyles();}
function logStartupHelperAvailability(context){const availability={normalizeLoadedStatusEffects:typeof normalizeLoadedStatusEffects==='function',isSearchExcludedSection:typeof isSearchExcludedSection==='function',isSearchExcludedTable:typeof isSearchExcludedTable==='function',stringifyWithoutTextSample:typeof stringifyWithoutTextSample==='function',sanitizeRawForSearch:typeof sanitizeRawForSearch==='function',normalizeSaveItemName:typeof normalizeSaveItemName==='function',sanitizeSaveRecord:typeof sanitizeSaveRecord==='function'};const missing=Object.keys(availability).filter(k=>!availability[k]);debugLog('startup helper availability',{context,missingCount:missing.length,missing,availability,htmlFile:FILE_META.fileName,buildCheck:'2.1-helper-save-normalize-20260428'});return missing;}
function scheduleSearchCachePrewarm(){
  if(state.viewMode!=='all')return;
  const categories=['generals','tactics','skills','equipments'];
  const run=async()=>{for(const category of categories){await prewarmSearchCacheForCategory(category);}};
  debugLog('prewarmSearchCache:scheduled',{categories,policy:'HADO-2.8.9.19: 武将・戦法も検索fast path用に事前正規化する'});
  if(typeof requestIdleCallback==='function')requestIdleCallback(()=>run(),{timeout:1500});else setTimeout(run,50);
}
async function prewarmSearchCacheForCategory(categoryKey){
  const items=getDatasetByCategory(categoryKey);
  const start=performance.now();
  let searchHit=0,searchMiss=0,paramHit=0,paramMiss=0,error=0;
  debugLog('prewarmSearchCache:start',{category:categoryKey,total:items.length});
  for(let i=0;i<items.length;i++){
    const item=items[i];
    try{
      if(Object.prototype.hasOwnProperty.call(item,'_searchableTextNorm'))searchHit++;else{getFastSearchableText(item);searchMiss++;}
      if(state.viewMode==='all'){
        if(Object.prototype.hasOwnProperty.call(item,'_parameterSummarySearchTextAll'))paramHit++;else{buildParameterSummarySearchText(item);paramMiss++;}
      }
    }
    catch(err){error++;debugLog('prewarmSearchCache:item-error',{category:categoryKey,index:i,item:getItemDisplayName(item),message:err?.message||String(err)});}
    if(i%20===19)await new Promise(resolve=>setTimeout(resolve,0));
  }
  debugLog('prewarmSearchCache:category',{category:categoryKey,total:items.length,searchHit,searchMiss,paramHit,paramMiss,error,ms:Number((performance.now()-start).toFixed(1))});
  debugLog('prewarmSearchCache:end',{category:categoryKey,ms:Number((performance.now()-start).toFixed(1))});
}

