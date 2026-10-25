/* Hado Library 3.2.0.0 Update03: data acquisition, validation, reflection and semantic diff. */
(function initHadoDataUpdate(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.HADO_DATA_UPDATE=api;
})(typeof window!=='undefined'?window:globalThis,function createHadoDataUpdate(){
  'use strict';

  const TROOP_TYPES=Object.freeze(['騎兵','歩兵','弓兵','盾兵','工兵']);
  const clean=value=>String(value==null?'':value).replace(/\s+/g,' ').trim();
  const rows=value=>Array.isArray(value)?value:(Array.isArray(value?.items)?value.items:(Array.isArray(value?.status_effects)?value.status_effects:[]));
  const escapeHtml=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const displayName=item=>clean(item?.displayName||item?.name||item?.title||item?.rawName||'').replace(/^【[^】]*】/,'').replace(/の(?:戦法と技能|おすすめ編制.*|性能|入手方法|能力.*|評価.*).*$/,'');
  const canonical=value=>Array.isArray(value)?value.map(canonical):(value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value);
  const fingerprint=value=>JSON.stringify(canonical(value));

  function recordBaseId(category,item,index){
    const explicit=clean(item?.id||item?.entityId||item?.tooltip_id||item?.tooltipId||'');
    if(explicit)return explicit;
    const url=clean(item?.url||item?.source_url||item?.sourceUrl||item?.source?.url||'');
    const article=url.match(/\/article\/show\/(\d+)/i);
    if(article)return `article-${article[1]}`;
    if(category==='statusEffects'&&item?.index!=null)return `index-${item.index}`;
    return `name-${displayName(item)||index}`;
  }

  function indexRecords(category,value){
    const list=rows(value);const seen=new Map();
    return list.map((item,index)=>{
      const base=recordBaseId(category,item,index);const count=(seen.get(base)||0)+1;seen.set(base,count);
      const id=count===1?base:`${base}#${count}`;
      return {id:`${category}:${id}`,name:displayName(item)||id,raw:item,fingerprint:fingerprint(item)};
    });
  }

  function diffRecords(category,beforeValue,afterValue){
    const before=indexRecords(category,beforeValue),after=indexRecords(category,afterValue);
    const beforeById=new Map(before.map(item=>[item.id,item]));const afterById=new Map(after.map(item=>[item.id,item]));
    const added=after.filter(item=>!beforeById.has(item.id)).map(({id,name})=>({id,name}));
    const removed=before.filter(item=>!afterById.has(item.id)).map(({id,name})=>({id,name}));
    const changed=after.filter(item=>beforeById.has(item.id)&&beforeById.get(item.id).fingerprint!==item.fingerprint).map(item=>({id:item.id,beforeName:beforeById.get(item.id).name,name:item.name}));
    return {category,beforeCount:before.length,afterCount:after.length,added,changed,removed,counts:{added:added.length,changed:changed.length,removed:removed.length}};
  }

  function tableRows(item){
    return (Array.isArray(item?.tables)?item.tables:[]).flatMap(table=>Array.isArray(table?.rows)?table.rows:(Array.isArray(table)?table:[])).filter(Array.isArray).map(row=>row.map(clean));
  }

  function generalTroopType(item){
    for(const companion of ['相性','輸送'])for(const row of tableRows(item)){
      if(!row.includes('兵科')||!row.includes(companion))continue;
      const value=clean(row[row.indexOf('兵科')+1]);const matches=TROOP_TYPES.filter(type=>value.includes(type));
      if(matches.length===1)return matches[0];
    }
    return '';
  }

  function troopSnapshot(generals){
    const groups=Object.fromEntries(TROOP_TYPES.map(type=>[type,new Map()]));
    indexRecords('generals',generals).forEach(entry=>{const type=generalTroopType(entry.raw);if(type)groups[type].set(entry.id,entry.name);});
    const contract=generals?.troop_effects||generals?.troopEffects||{};
    const effects=new Map((Array.isArray(contract?.items)?contract.items:[]).map(item=>[clean(item?.troop_type||item?.troopType),fingerprint(item)]));
    return {groups,effects};
  }

  function diffTroops(beforeGenerals,afterGenerals){
    const before=troopSnapshot(beforeGenerals),after=troopSnapshot(afterGenerals);
    const changes=[];
    TROOP_TYPES.forEach(type=>{
      const b=before.groups[type],a=after.groups[type];
      const added=[...a].filter(([id])=>!b.has(id)).map(([id,name])=>({id,name}));
      const removed=[...b].filter(([id])=>!a.has(id)).map(([id,name])=>({id,name}));
      const skillChanged=(before.effects.get(type)||'')!==(after.effects.get(type)||'');
      if(added.length||removed.length||skillChanged)changes.push({id:`troop:${type}`,name:type,beforeCount:b.size,afterCount:a.size,added,removed,skillChanged});
    });
    return {category:'troopTypes',beforeCount:TROOP_TYPES.filter(type=>before.groups[type].size).length,afterCount:TROOP_TYPES.filter(type=>after.groups[type].size).length,added:[],removed:[],changed:changes,counts:{added:0,changed:changes.length,removed:0}};
  }

  function diffBundles(beforeData,afterData){
    if(!beforeData||!afterData)return {available:false,reason:'比較元の検証済みデータがありません',categories:{}};
    const categories={
      generals:diffRecords('generals',beforeData.generals,afterData.generals),
      skills:diffRecords('skills',beforeData.skills,afterData.skills),
      troopTypes:diffTroops(beforeData.generals,afterData.generals)
    };
    const totals=Object.values(categories).reduce((sum,item)=>({added:sum.added+item.counts.added,changed:sum.changed+item.counts.changed,removed:sum.removed+item.counts.removed}),{added:0,changed:0,removed:0});
    return {available:true,categories,totals,changed:totals.added+totals.changed+totals.removed>0};
  }

  function generationMeta(data){
    return data?.relatedLinkIndex||data?.searchIndex||data?.tagIndex||{};
  }

  function provenance(data,bundleManifest){
    const primary=data?.meta||{},derived=generationMeta(data);
    return {
      bundleId:clean(bundleManifest?.bundleId||''),dataSetId:clean(derived?.dataSetId||''),
      acquiredAt:clean(derived?.acquiredAt||primary?.collectedAt||primary?.dataUpdatedAt||''),
      processedAt:clean(derived?.processedAt||primary?.processedAt||primary?.exportedAt||''),
      generatedAt:clean(derived?.generatedAt||''),sourceRunId:clean(derived?.sourceRunId||primary?.runId||''),
      crawlerVersion:clean(derived?.crawlerVersion||primary?.crawlerVersion||''),sourceCrawlerVersion:clean(derived?.sourceCrawlerVersion||primary?.crawlerVersion||''),
      sourceCommit:clean(derived?.sourceCommit||primary?.sourceCommit||''),sourceCommitRole:clean(derived?.sourceCommitRole||(primary?.sourceCommit?'application-generation-base':'unrecorded')),
      crawlerSourceCommit:clean(derived?.crawlerSourceCommit||''),crawlerSourceCommitStatus:clean(derived?.crawlerSourceCommitStatus||(derived?.crawlerSourceCommit?'recorded':'unknown-in-source-run'))
    };
  }

  function buildAudit(data,runtime={}){
    const unclassifiedStatuses=indexRecords('statusEffects',data?.statusEffects).filter(entry=>!clean(entry.raw?.type||entry.raw?.effectType)).map(({id,name,raw})=>({id,name,sourceUrl:clean(raw?.source_url||raw?.url||'')}));
    const rawTactics=indexRecords('tactics',data?.tactics);const runtimeNames=new Set((runtime.tacticNames||[]).map(clean).filter(Boolean));
    const retainedTactics=runtimeNames.size?rawTactics.filter(item=>!runtimeNames.has(clean(item.name))).map(({id,name,raw})=>({id,name,sourceUrl:clean(raw?.url||raw?.source_url||'')})):[];
    const searchRows=rows(data?.searchIndex);const articleAliasIds=['equipments:article-346228','equipments:article-381628'];
    const articleAliasRows=searchRows.filter(row=>articleAliasIds.includes(clean(row?.sourceEntityKey))).map(row=>({id:clean(row.sourceEntityKey),name:clean(row.name),sourceUrl:clean(row.sourceUrl||'')}));
    return {
      unclassifiedStatuses,unclassifiedStatusAudit:{count:unclassifiedStatuses.length,policy:'未分類のまま原文・出典を保持し、極性を推測しない'},
      retainedTactics,tacticRetention:{sourceCount:rawTactics.length,runtimeCount:Number(runtime.tacticCount||runtimeNames.size||0),retainedCount:retainedTactics.length,policy:'保存戦法は取得履歴として保持し、画面用戦法は武将sectionから再構築する'},
      equipmentArticleAliases:{ok:articleAliasRows.length===2&&new Set(articleAliasRows.map(row=>row.id)).size===2,rows:articleAliasRows,policy:'同名装備でも記事IDを別識別子として保持する'}
    };
  }

  function createStatus(options={}){
    const now=new Date().toISOString();const data=options.data||null;const previousData=options.previousData||null;
    return {
      schemaVersion:1,mode:clean(options.mode||'loaded'),source:clean(options.source||''),createdAt:now,
      acquisition:{status:clean(options.acquisitionStatus||'succeeded'),checkedAt:clean(options.checkedAt||now),reason:clean(options.reason||''),error:clean(options.error||'')},
      validation:{status:clean(options.validationStatus||'passed'),validatedAt:clean(options.validatedAt||now),reason:clean(options.validationReason||'')},
      reflection:{status:'pending',reflectedAt:'',error:''},
      provenance:provenance(data,options.bundleManifest),previousProvenance:previousData?provenance(previousData,options.previousBundleManifest):null,
      diff:diffBundles(previousData,data),audit:buildAudit(data),cachePersisted:options.cachePersisted!==false
    };
  }

  function createFallbackStatus(options={}){
    const base=createStatus({mode:'cache-fallback',source:'indexeddb-cache',data:options.cachedData,previousData:null,bundleManifest:options.cachedBundleManifest,acquisitionStatus:'failed',validationStatus:'cached-passed',reason:options.reason,error:options.error});
    base.diff=options.cachedStatus?.diff||{available:false,reason:'更新取得に失敗したため、前回の差分記録を維持しています',categories:{}};
    base.previousSuccessfulStatus=options.cachedStatus||null;base.cachePersisted=true;return base;
  }

  function markReflected(status,data,runtime={}){
    const next=status&&typeof status==='object'?status:createStatus({data,mode:'loaded'});
    next.reflection={status:'passed',reflectedAt:new Date().toISOString(),error:''};
    next.audit=buildAudit(data,runtime);
    return next;
  }

  function markReflectionFailed(status,error){
    const next=status&&typeof status==='object'?status:{};
    next.reflection={status:'failed',reflectedAt:'',error:clean(error?.message||error||'')};return next;
  }

  function shortId(value){const text=clean(value);return text.length>18?`${text.slice(0,10)}…${text.slice(-6)}`:(text||'未記録');}
  function formatDate(value){const text=clean(value);if(!text)return '未記録';const date=new Date(text);return Number.isNaN(date.getTime())?text:date.toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'});}
  function statusLabel(stage){return stage==='passed'?'完了':stage==='succeeded'?'完了':stage==='current'?'更新なし':stage==='cached-passed'?'前回検証済み':stage==='failed'?'失敗':'確認中';}
  function itemList(items,empty='なし'){
    if(!items?.length)return `<span class="data-update-empty">${escapeHtml(empty)}</span>`;
    const visible=items.slice(0,80);const rest=items.length-visible.length;
    return `<ul>${visible.map(item=>`<li><span>${escapeHtml(item.name||item.id)}</span><code>${escapeHtml(item.id||'')}</code></li>`).join('')}${rest?`<li><span>ほか ${rest}件</span><code>表示上限80件</code></li>`:''}</ul>`;
  }
  function diffSection(label,entry){
    if(!entry)return '';
    const details=[['追加',entry.added],['変更',entry.changed],['削除',entry.removed]].map(([name,list])=>`<div class="data-update-change-group"><strong>${name} ${list?.length||0}件</strong>${itemList(list)}</div>`).join('');
    return `<details class="data-update-details"><summary>${escapeHtml(label)}：${entry.beforeCount} → ${entry.afterCount}（追加${entry.counts.added} / 変更${entry.counts.changed} / 削除${entry.counts.removed}）</summary>${details}</details>`;
  }

  function render(container,status){
    if(!container)return;
    if(!status){container.innerHTML='<div class="data-update-empty">更新状態を確認中です。</div>';return;}
    const p=status.provenance||{},diff=status.diff||{};const fallback=status.mode==='cache-fallback';
    const totals=diff.totals||{added:0,changed:0,removed:0};
    const diffHtml=diff.available
      ?`<div class="data-update-summary">前回比：追加${totals.added} / 変更${totals.changed} / 削除${totals.removed}</div>${diffSection('武将',diff.categories?.generals)}${diffSection('技能',diff.categories?.skills)}${diffSection('兵科',diff.categories?.troopTypes)}`
      :`<div class="data-update-empty">${escapeHtml(diff.reason||'比較元なし')}</div>`;
    const unclassified=status.audit?.unclassifiedStatuses||[];const retained=status.audit?.retainedTactics||[];const aliases=status.audit?.equipmentArticleAliases||{};
    container.innerHTML=`
      ${fallback?`<div class="data-update-warning">公開データの取得または検証に失敗したため、前回の検証済みデータを保持して起動しています。${status.acquisition?.error?`<br>${escapeHtml(status.acquisition.error)}`:''}</div>`:''}
      <div class="data-update-stage-grid">
        <div><span>取得</span><strong data-stage="${escapeHtml(status.acquisition?.status||'pending')}">${statusLabel(status.acquisition?.status)}</strong></div>
        <div><span>検証</span><strong data-stage="${escapeHtml(status.validation?.status||'pending')}">${statusLabel(status.validation?.status)}</strong></div>
        <div><span>反映</span><strong data-stage="${escapeHtml(status.reflection?.status||'pending')}">${statusLabel(status.reflection?.status)}</strong></div>
      </div>
      <div class="data-update-provenance">
        <div><span>取得日時</span><strong>${escapeHtml(formatDate(p.acquiredAt))}</strong></div>
        <div><span>処理日時</span><strong>${escapeHtml(formatDate(p.processedAt))}</strong></div>
        <div><span>派生生成日時</span><strong>${escapeHtml(formatDate(p.generatedAt))}</strong></div>
        <div><span>データ識別子</span><strong title="${escapeHtml(p.dataSetId)}">${escapeHtml(shortId(p.dataSetId))}</strong></div>
        <div><span>取得run</span><strong title="${escapeHtml(p.sourceRunId)}">${escapeHtml(shortId(p.sourceRunId))}</strong></div>
        <div><span>bundle</span><strong title="${escapeHtml(p.bundleId)}">${escapeHtml(shortId(p.bundleId))}</strong></div>
      </div>
      <details class="data-update-details" open><summary>前回の検証済みデータとの差分</summary>${diffHtml}</details>
      <details class="data-update-details"><summary>監査上の保持・未確定情報</summary>
        <div class="data-update-audit"><strong>未分類状態変化 ${unclassified.length}件</strong><p>原文と出典を保持し、分類を推測していません。</p>${itemList(unclassified)}</div>
        <div class="data-update-audit"><strong>保存戦法の保持 ${status.audit?.tacticRetention?.retainedCount||0}件</strong><p>一次JSON ${status.audit?.tacticRetention?.sourceCount||0}件 / 画面反映 ${status.audit?.tacticRetention?.runtimeCount||0}件。保持レコードは削除していません。</p>${itemList(retained)}</div>
        <div class="data-update-audit"><strong>同名装備の記事ID ${aliases.ok?'正常':'要確認'}</strong><p>${escapeHtml(aliases.policy||'')}</p>${itemList(aliases.rows||[])}</div>
        <div class="data-update-audit"><strong>生成元commit</strong><p>${p.crawlerSourceCommitStatus==='recorded'?escapeHtml(shortId(p.crawlerSourceCommit)):'元取得runにはクローラーSHAの記録がありません。既存の記録を不明のまま保持しています。'}</p></div>
      </details>`;
  }

  return Object.freeze({TROOP_TYPES,rows,indexRecords,generalTroopType,diffRecords,diffTroops,diffBundles,provenance,buildAudit,createStatus,createFallbackStatus,markReflected,markReflectionFailed,render});
});
