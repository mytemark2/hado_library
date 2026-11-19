/* Browser-session tools for planning formations from one selected save. */
(() => {
  'use strict';
  if (location.protocol !== 'https:' || new URLSearchParams(location.search).get('chatgpt') !== 'formation') return;
  const advice = window.HadoFormationAdvice;
  const clone = value => JSON.parse(JSON.stringify(value));
  const name = value => normalizeSaveItemName(value || '');
  const array = value => Array.isArray(value) ? value : [];
  const byName = (x, y) => x.localeCompare(y,'ja');
  const slotKeys = FORMATION_SLOT_SPECS.map(spec => spec.key);
  const generalCategory = 'generals';
  const equipmentCategory = 'equipments';
  const sessionDuration = 20 * 60 * 1000;
  const generalIdentity = value => normalizeGeneralComparableName(value).replace(/・(?:盾兵|工兵|歩兵|弓兵|騎兵)$/,'');
  let session = null;
  let controller = null;
  let expiryTimer = null;

  function dataStatus() {
    const status = window.HADO_DATA_UPDATE_STATUS || {};
    const p = status.provenance || {};
    return {ready:status.reflection?.status === 'passed', bundleId:p.bundleId || '',
      acquiredAt:state.dataUpdateMeta?.dataUpdatedAt || p.acquiredAt || '', processedAt:p.processedAt || '',
      runId:p.sourceRunId || '', mode:status.mode || '', validation:status.validation?.status || ''};
  }

  function withSave(save, run) {
    const previous = {viewMode:state.viewMode, saveData:state.saveData, diagnostics:state.diagnostics, showRawJson:state.showRawJson};
    try {
      state.viewMode = 'saved';
      state.saveData = {currentSaveId:save.id,saves:[clone(save)]};
      state.diagnostics = {};
      state.showRawJson = false;
      return run();
    } finally {
      Object.assign(state, previous);
    }
  }

  function editedSaveReady() {
    return !state.formationDirty;
  }

  function emptyFormation() {
    return {formationName:'基本', deploymentType:'normal', slots:Object.fromEntries(slotKeys.map(key => [key,createFormationSlot()])),
      advisorSlots:createFormationAdvisorSlots(), siegeWeapon:createFormationSiegeWeaponSelection(),
      ethnicArmament:createFormationEthnicArmamentSelection()};
  }

  function publicFormation(f) {
    const result = emptyFormation();
    result.formationName = name(f?.formationName) || '基本';
    result.deploymentType = name(f?.deploymentType) || 'normal';
    for (const key of slotKeys) result.slots[key] = sanitizeFormationSlot(f?.slots?.[key]);
    result.advisorSlots = sanitizeFormationAdvisorSlots(f?.advisorSlots);
    result.siegeWeapon = {name:name(f?.siegeWeapon?.name), level:Number(f?.siegeWeapon?.level) || 0};
    result.ethnicArmament = {name:name(f?.ethnicArmament?.name), level:Number(f?.ethnicArmament?.level) || 0,
      ethnicGeneralName:name(f?.ethnicArmament?.ethnicGeneralName)};
    return result;
  }

  function entityNames(f) {
    const members = slotKeys.flatMap(key => [f.slots[key].general,f.slots[key].attendant]);
    return [...members,...Object.values(f.advisorSlots)].filter(Boolean);
  }

  function equipmentNames(f) {
    return slotKeys.flatMap(key => Object.values(f.slots[key].equipments)).filter(Boolean)
      .map(normalizeFormationEquipmentDuplicateKey);
  }

  function buildCatalog(save) {
    const owned = (category, names) => {
      const set = new Set(array(names).map(name));
      return new Map(getAllDataItemsByCategory(category).map(item => [name(getItemDisplayName(item)),item])
        .filter(([key]) => set.has(key)));
    };
    const generals = owned(generalCategory,save.generals);
    const equipments = owned(equipmentCategory,save.equipments);
    const allFormations = array(state.formations).map(row => ({original:row, formation:publicFormation(row)}));
    // Legacy formation storage is shared across saves. Only show builds that can
    // be matched entirely to the selected save's ownership.
    const belongs = ({formation}) =>
      formation.slots.main.general && entityNames(formation).every(value=>generals.has(value)) &&
      slotKeys.every(key=>Object.values(formation.slots[key].equipments).every(value=>!value||equipments.has(value)));
    const formations = [], unrelated = [];
    for (const row of allFormations) {
      if (belongs(row)) formations.push({...row,id:String(formations.length+1)});
      else unrelated.push(row);
    }
    const unique = (items, key) => [...new Map(items.map(item => [key(item),item])).values()];
    const layouts = new Set(array(state.formationMasters).map(row=>name(row.name || row.title)));
    return {formations, unrelated, generals, equipments,
      layouts:unique(['基本',...formations.map(row => row.formation.formationName)],value=>value)
        .filter(value => layouts.has(value) || value === '基本'),
      siege:unique(formations.map(row=>row.formation.siegeWeapon)
        .filter(row=>row.name && row.level>0 && findItemByDisplayName('siegeWeapons',row.name) && row.level<=getFormationExtensionMaxLevel('siegeWeapon',row.name)),row=>row.name+'\0'+row.level),
      armaments:unique(formations.map(row=>row.formation.ethnicArmament)
        .filter(row=>row.name && row.level>0 && findItemByDisplayName('ethnicArmaments',row.name) && row.level<=getFormationExtensionMaxLevel('ethnicArmament',row.name)),row=>JSON.stringify(row))};
  }

  function selection(catalog, input) {
    const base = input.baseId ? catalog.formations.find(row=>row.id === input.baseId) : null;
    if (input.baseId && !base) throw new Error('編成IDが見つかりません。');
    const protectedIds = input.protectedIds ?? catalog.formations.filter(row=>row !== base).map(row=>row.id);
    if (!Array.isArray(protectedIds) || protectedIds.some(id=>!catalog.formations.some(row=>row.id===id && row!==base))) {
      throw new Error('保護対象の編成IDを確認してください。');
    }
    const protectedRows = [...catalog.unrelated,...catalog.formations.filter(row=>protectedIds.includes(row.id))];
    const reservedGenerals = new Set(protectedRows.flatMap(row=>entityNames(row.formation).map(generalIdentity)));
    const reservedEquipment = new Set(protectedRows.flatMap(row=>equipmentNames(row.formation)));
    // An already shared unit/equipment in the baseline may be preserved; it cannot be moved to a different slot.
    return {base, reservedGenerals, reservedEquipment};
  }

  function validity(f, catalog, chosen, options) {
    const errors = [];
    const seen = new Set();
    const before = advice.assignments(chosen.base?.formation || emptyFormation());
    const after = advice.assignments(f);
    const main = f.slots.main.general;
    if (!main) errors.push('主将が必要です。');
    if (options.fixedMain && main !== name(options.fixedMain)) errors.push('指定の主将を配置してください。');
    if (!catalog.layouts.includes(f.formationName)) errors.push('保存済みまたは基本の陣形が必要です。');
    if (!FORMATION_DEPLOYMENT_TYPE_OPTIONS.some(row=>row.key===f.deploymentType) ||
        (options.deployment && f.deploymentType!==options.deployment)) errors.push('配置場所を確認してください。');
    if (f.siegeWeapon.name && !catalog.siege.some(row=>row.name===f.siegeWeapon.name && row.level===f.siegeWeapon.level)) {
      errors.push('保存編成で確認できる兵器とレベルを指定してください。');
    }
    if (f.ethnicArmament.name && !catalog.armaments.some(row=>JSON.stringify(row)===JSON.stringify(f.ethnicArmament))) {
      errors.push('保存編成で確認できる武装を指定してください。');
    }
    for (const [field,value] of Object.entries(after)) {
      if (!value || !(/\.general$|\.attendant$|^advisor\./).test(field)) continue;
      if (!catalog.generals.has(value)) errors.push(field+' の武将は所持と現行データを確認できません。');
      const identity = generalIdentity(value);
      if (seen.has(identity)) errors.push(field+' の武将は同じ部隊で重複しています。');
      if (chosen.reservedGenerals.has(identity) && before[field]!==value) errors.push(field+' の武将は保護中の編成で使用中です。');
      seen.add(identity);
    }
    const availability = slotKeys.some(key=>f.slots[key].attendant) ? computeFormationJijuAvailability(f).bySlot : {};
    for (const key of slotKeys) {
      const slot = f.slots[key];
      if (slot.attendant && (!slot.general || !slot.attendantPosition ||
          availability[key]?.selected?.position!==slot.attendantPosition ||
          !canAssignJijuAttendantByCondition(slot.general,slot.attendant,slot.attendantPosition))) {
        errors.push(key+' の侍従の配置条件を満たしません。');
      }
      for (const spec of EQUIP_SLOT_SPECS) {
        const equipped = slot.equipments[spec.key];
        if (!equipped) continue;
        const item = catalog.equipments.get(equipped);
        if (!slot.general || !item || getEquipmentType(item)!==spec.type ||
            !formationWeaponCandidateMatchesTroop({item},{type:'equipment',slotKey:key,equipSpec:spec},f)) {
          errors.push(key+'.'+spec.key+' の装備は所持・種類・兵科のいずれかを確認できません。');
        }
        if (item && !canAssignFormationEquipmentToSlot(f,equipped,key,spec.key).ok) errors.push(key+'.'+spec.key+' の装備は部隊内で重複しています。');
        if (chosen.reservedEquipment.has(normalizeFormationEquipmentDuplicateKey(equipped)) && before[key+'.'+spec.key]!==equipped) {
          errors.push(key+'.'+spec.key+' の装備は保護中の編成で使用中です。');
        }
      }
    }
    return errors;
  }

  const battleCondition = /(?:兵力|戦法ゲージ).{0,18}(?:以上|以下|未満)|交戦|出陣|発動時|攻撃時|攻撃を受け|攻撃した|ダメージを受ける際|撃破|発生して|付与され|健在|自部隊より|敵部隊より|駐屯|防衛中|確率で|兵器が編制/;
  const simpleCondition = /^(?:自身が)?(?:主将|副将|補佐|侍従)(?:の際|の場合)$/;
  const namedCondition = /^部隊内[（(]主将\/副将\/補佐[）)]とその侍従に([^■●]+?)のうち1人以上いる(?:場合|際)$/;

  function stateForEffect(group, line, holder, ctx, source) {
    const condition = advice.canonical(group).replace(/^■/,'');
    const namedMatch = condition.match(namedCondition);
    if (namedMatch) {
      const list = namedMatch[1].split('/');
      if (!ctx.memberIdentities.some(identity=>list.includes(identity))) return 'inactive';
    } else if (simpleCondition.test(condition)) {
      const role = holder.sourceType === 'attendant' ? '侍従' : formationSlotLabel(holder.slotKey).replace(/\d+$/,'');
      if (!condition.includes(role)) return 'inactive';
    } else if (/^(?:主将か、?主将と自身が好相性)(?:の際|の場合)$/.test(condition)) {
      if (holder.sourceType === 'equipment' || holder.sourceType === 'attendant') return 'unknown';
      if (holder.slotKey !== 'main' && !ctx.compatible(holder.holder)) return 'inactive';
    } else if (condition && condition !== '常に') {
      return battleCondition.test(condition) ? 'conditional' : 'unknown';
    }
    if (source.grantedFromSkill || source.equipmentReferenceKind || holder.sourceType === 'attendant') return 'unknown';
    if (source.source === '戦法' || battleCondition.test(line)) return 'conditional';
    if (/^敵部隊からの1回の通常攻撃[、,]1回の戦法によるダメージの上限が[\d,]+になる/.test(advice.canonical(line))) return 'confirmed';
    if (/編制時点|の時|の場合|の際|条件|のLv|→|応じて|につき/.test(line)) return 'unknown';
    return 'confirmed';
  }

  function createEvidence(catalog) {
    const cache = new Map();
    const affinities = new Map();
    function records(item) {
      if (!cache.has(item)) {
        cache.set(item,collectFormationParameterSourceRecords(item)
          .filter(row=>row.kind==='include' && !row.isAdvisorSkill && !row.isAppointmentSkill)
          .flatMap(row => {
            if (row.source === '戦法') {
              return row.text.split(/。|(?<=\))\s+/).map(line=>({row,condition:'',line,metrics:advice.classify(line)}))
                .filter(entry=>entry.metrics.length);
            }
            return splitSkillConditionBlocks(row.text).flatMap(block => {
              let trigger = '';
              return block.segments.flatMap(segment => {
                if (segment.startsWith('■')) return [];
                if (segment.startsWith('▼')) {trigger=segment;return [];}
                const line = segment.replace(/^●/,'').split(/(?=\s*→)/,1)[0].trim();
                return [{row, condition:block.condition, trigger, line, metrics:advice.classify(line)}];
              }).filter(entry=>entry.metrics.length);
            });
          }));
      }
      return cache.get(item);
    }
    function compatible(a,b) {
      const lists = [a,b].map(key=>{
        if (!affinities.has(key)) affinities.set(key,extractCompatibleGeneralNames(catalog.generals.get(key)));
        return affinities.get(key);
      });
      return lists[0].includes(normalizeGeneralComparableName(b)) || lists[1].includes(normalizeGeneralComparableName(a));
    }
    function collect(f) {
      const memberIdentities = slotKeys.flatMap(key=>[f.slots[key].general,f.slots[key].attendant]).filter(Boolean).map(generalIdentity);
      const ctx = {memberIdentities,compatible:holder=>compatible(name(holder),f.slots.main.general)};
      return slotKeys.flatMap(slotKey => {
        const slot = f.slots[slotKey];
        const holders = [[slot.general,'general',catalog.generals],[slot.attendant,'attendant',catalog.generals],
          ...Object.values(slot.equipments).map(value=>[value,'equipment',catalog.equipments])];
        return holders.flatMap(([holder,sourceType,map]) => {
          const item = map.get(holder);
          if (!item) return [];
          return records(item).filter(entry=>entry.row.source!=='戦法' ||
            (sourceType==='general' && advice.tacticSlots.has(slotKey))).map(entry=>{
            const status=stateForEffect(entry.condition,entry.line,{slotKey,sourceType,holder},ctx,entry.row);
            return {source:holder,slot:slotKey,kind:sourceType,skill:entry.row.source,rawText:entry.line,
              condition:[entry.condition,entry.trigger].filter(Boolean).join(' / '), metrics:entry.metrics,
              state:entry.trigger && status==='confirmed'?'conditional':status,
              sourceUrl:item.raw?.url || item.url || ''};
          });
        });
      });
    }
    return {records,collect};
  }

  function formationsForTool(catalog) {
    return catalog.formations.map(row=>({id:row.id, main:row.formation.slots.main.general,
      deployment:row.formation.deploymentType, formation:row.formation.formationName,
      current:row.original.id===state.currentFormationId, group:array(state.formationGroups).findIndex(g=>g.id===row.original.groupId)+1}));
  }

  function provenance(catalog, input) {
    const names = array(input.checkNames);
    if (names.length>25 || names.some(value=>typeof value!=='string'||value.length>120)) throw new Error('照合する名称は25件までです。');
    const master = ['generals','equipments','formationMasters','siegeWeapons','skills','statusEffects'].flatMap(key=>array(state[key]));
    const indexed = new Set(master.map(item=>name(getItemDisplayName(item))));
    const query = typeof input.ownedQuery==='string' ? advice.canonical(input.ownedQuery).toLowerCase() : '';
    const matches = map=>query ? [...map.keys()].filter(value=>advice.canonical(value).toLowerCase().includes(query)).sort(byName).slice(0,25) : [];
    const gameUpdatedAt = input.gameUpdatedAt || '';
    if (gameUpdatedAt && !/^\d{4}-\d{2}-\d{2}$/.test(gameUpdatedAt)) throw new Error('ゲームの更新日は YYYY-MM-DD で指定してください。');
    const data = dataStatus();
    const acquiredLocal = data.acquiredAt ? new Date(data.acquiredAt) : null;
    const gameDate = acquiredLocal && Number.isFinite(acquiredLocal.getTime()) ?
      new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(acquiredLocal) : '';
    return {ok:true, build:window.HADO_APP_DISPLAY_VERSION, data,
      freshness:{gameUpdatedAt, gameDataAcquiredDate:gameDate,
        acquiredBeforeGameUpdate:gameDate && gameUpdatedAt ? gameDate<gameUpdatedAt : null},
      save:{generals:catalog.generals.size, equipments:catalog.equipments.size, formations:formationsForTool(catalog),
        registeredSiege:catalog.siege, registeredLayouts:catalog.layouts, registeredArmaments:catalog.armaments},
      ownedMatches:{generals:matches(catalog.generals),equipments:matches(catalog.equipments)},
      coverage:names.map(value=>({name:name(value), inGameData:indexed.has(name(value)),
        owned:catalog.generals.has(name(value)) || catalog.equipments.has(name(value))}))};
  }

  function moveSearch(catalog, options, chosen, evidence) {
    const weights = new Map(options.priorities.map((metric,index)=>[metric,options.priorities.length-index]));
    const quick = item => [...new Set(evidence.records(item).flatMap(entry=>entry.metrics))]
      .reduce((score,metric)=>score+(weights.get(metric)||0),0);
    const shortlist = (map, reserved, max) => [...map].filter(([key])=>!reserved.has(key))
      .map(([key,item])=>({key,score:quick(item)}))
      .sort((a,b)=>b.score-a.score || byName(a.key,b.key)).slice(0,max).map(row=>row.key);
    const generals = shortlist(catalog.generals,new Set([...catalog.generals.keys()]
      .filter(key=>chosen.reservedGenerals.has(generalIdentity(key)))),20);
    const equipment = shortlist(catalog.equipments,new Set([...catalog.equipments.keys()]
      .filter(key=>chosen.reservedEquipment.has(normalizeFormationEquipmentDuplicateKey(key)))),38);
    const deploy=options.deployment || chosen.base?.formation.deploymentType || 'normal';
    const savedSeeds=chosen.base?[chosen.base]:catalog.formations;
    const seeds=savedSeeds.map(row=>({...row.formation,deploymentType:deploy}));
    const fixed=name(options.fixedMain);
    const mainCandidates=fixed?[fixed]:generals.slice(0,12);
    for (const candidate of mainCandidates) {
      const f = emptyFormation();
      f.slots.main.general = candidate;
      f.deploymentType = deploy;
      if (chosen.base) {
        f.formationName=chosen.base.formation.formationName;
        f.siegeWeapon=clone(chosen.base.formation.siegeWeapon);
        f.ethnicArmament=clone(chosen.base.formation.ethnicArmament);
        f.advisorSlots=clone(chosen.base.formation.advisorSlots);
      }
      seeds.push(f);
    }
    const moves = [
      {values:catalog.layouts,apply:(f,value)=>{f.formationName=value;}},
      {values:catalog.siege,apply:(f,value)=>{f.siegeWeapon=clone(value);}},
      {values:catalog.armaments,apply:(f,value)=>{f.ethnicArmament=clone(value);}}
    ];
    for (const advisor of ADVISOR_SLOT_SPECS) {
      const values=[...new Set(catalog.formations.map(row=>row.formation.advisorSlots[advisor.key]).filter(Boolean))];
      if (values.length) moves.push({values,apply:(f,value)=>{f.advisorSlots[advisor.key]=value;}});
    }
    for (const key of slotKeys) {
      moves.push({values:key==='main'?mainCandidates:generals, apply:(f,value)=>{
        if (f.slots[key].general!==value) f.slots[key]={...createFormationSlot(),general:value};
      }});
    }
    for (const key of slotKeys) {
      const attendees = generals.filter(value=>isFormationRoleCandidateAllowed(catalog.generals.get(value),'attendant')).slice(0,8);
      moves.push({values:attendees,apply:(f,value)=>{
        const slot=f.slots[key];
        if (!slot.general) return;
        const prev = slot.attendant;
        slot.attendant='';
        const allowed = computeFormationJijuAvailability(f).bySlot[key]?.available || [];
        const position=allowed.find(row=>canAssignJijuAttendantByCondition(slot.general,value,row.position));
        slot.attendant=position?value:prev;
        if (position) slot.attendantPosition=position.position;
      }});
      for (const spec of EQUIP_SLOT_SPECS) {
        moves.push({values:equipment.filter(value=>getEquipmentType(catalog.equipments.get(value))===spec.type).slice(0,7),
          apply:(f,value)=>{f.slots[key].equipments[spec.key]=value;}});
      }
    }
    return advice.search({seeds,moves,options,shortlistLimit:24,inspect: f=>{
      if (f.deploymentType!==deploy || validity(f,catalog,chosen,options).length) return null;
      const filled=slotKeys.filter(key=>f.slots[key].general).length;
      return {filled,complete:filled===slotKeys.length && (options.purpose!=='siege' || !!f.siegeWeapon.name),
        changes:advice.diff(chosen.base?.formation || emptyFormation(),f).length,
        metrics:advice.summarize(evidence.collect(f),options.target)};
    }});
  }

  function formationNumbers(parameters) {
    const entry=(timing,group,key)=>parameters.summary?.[timing]?.[group]?.[key];
    const speed=timing=>entry(timing,'speed','戦法速度');
    function combine(...entries) {
      const percent=entries.reduce((sum,item)=>sum+(item?.maxTotal||0),0);
      const conditions=[...new Set(entries.flatMap(item=>(item?.maxItems||[]).map(effect=>effect.condition))
        .filter(value=>value&&value!=='常に'))];
      return {percent,conditions};
    }
    const gauge=entry('deploy','gauge','戦法ゲージ');
    const gaugeTerms=(gauge?.maxItems||[]).filter(effect=>!/交戦開始|初回の戦法発動まで/.test([effect.condition,effect.rawText].join(' ')));
    const gaugeTotal=gaugeTerms.reduce((sum,effect)=>sum+(effect.sign==='-'?-1:1)*Number(effect.value),0);
    return {
      tactic_speed:combine(speed('normal')),
      garrison_tactic_speed:combine(speed('normal'),speed('defense')),
      engagement_tactic_speed:combine(speed('normal'),speed('defense'),speed('defenseEngagement')),
      starting_gauge:combine(gauge&&{maxTotal:Math.min(gaugeTotal,getParameterSummaryCap('戦法ゲージ',gauge)?.max??Infinity),maxItems:gaugeTerms}),
      siege_speed:combine(entry('normal','speed','兵器速度'),entry('defense','speed','兵器速度'))
    };
  }

  function evaluateFormation(f,options,evidence) {
    const rows=evidence.collect(f);
    const parameters=buildFormationParameterDataUncached(f);
    const numbers=formationNumbers(parameters);
    const metrics=advice.summarize(rows,options.target);
    for (const [key,value] of Object.entries(numbers)) metrics[key].formationValue=value.percent;
    return {rows,parameters,numbers,metrics};
  }

  function detailed(f, options, evaluation) {
    const {rows,parameters,numbers,metrics}=evaluation;
    const weapon = getFormationExtensionSelectionEntry('siegeWeapon',f.siegeWeapon);
    const tactics = getFormationTacticActivationOrderRows(collectFormationTacticAttackRows(f,parameters));
    const confirmed = rows.filter(row=>row.state==='confirmed' && row.metrics.some(metric=>options.priorities.includes(metric)));
    const uncertain = rows.filter(row=>row.state!=='confirmed' && row.metrics.some(metric=>options.priorities.includes(metric)));
    const ownership = slotKeys.map(slot=>{
      const row=f.slots[slot];
      return {slot, general:row.general?{name:row.general,stars:getCurrentStarValue('generals',row.general,7)}:null,
        attendant:row.attendant?{name:row.attendant,stars:getCurrentStarValue('generals',row.attendant,7)}:null,
        equipment:Object.values(row.equipments).filter(Boolean).map(value=>({name:value,stage:getEffectiveEquipmentStageForEquipmentName(value),
          stars:getCurrentStarValue('equipments',value,10)}))};
    });
    return {formation:f,ownership,metrics,numbers,evidence:[...confirmed,...uncertain].slice(0,36),
      model:{tacticActivation:tactics.map(row=>({
        slot:row.slotKey, order:row.activationOrder, general:row.generalName, baseIntervalSeconds:row.activationMeta?.intervalSec ?? null,
        estimatedChainPercent:row.slotKey==='main'?100:(row.activationMeta?.chainRate?row.chain.estimatedRate:null),
        listedTacticPowerPercent:row.evaluated?.basePower ?? null
      })),
      siege:{target:options.target, seconds:options.seconds,
        registeredWeapon:weapon ? {name:weapon.name,level:weapon.level,baseStats:buildFormationExtensionParameterRows(weapon)} : null,
        firstAttackSeconds:null, attackIntervalSeconds:null,
        damagePerHit:null, totalDamage:null, reason:'兵器・対象・研究・戦闘補正を含む計算式を確認できていません。'},
      incomingChainTotal:null, incomingChainReason:'相手の編成・攻撃種別・連鎖回数が必要です。単発上限は別項目です。'}};
  }

  function runAnalysis(catalog,input,manual) {
    const options = advice.rankInputs(input);
    const coverage=manual?null:provenance(catalog,{checkNames:input.checkNames,gameUpdatedAt:input.gameUpdatedAt});
    if (options.deployment && !FORMATION_DEPLOYMENT_TYPE_OPTIONS.some(row=>row.key===options.deployment)) {
      throw new Error('配置場所を確認してください。');
    }
    const chosen = selection(catalog,input);
    const evidence = createEvidence(catalog);
    const baseline = chosen.base?.formation || emptyFormation();
    const before=evaluateFormation(baseline,options,evidence).metrics;
    const format = ({formation,evaluation}) => {
      const data=detailed(formation,options,evaluation);
      return {...data,differences:advice.diff(baseline,formation),metricChanges:advice.compareDetails(before,data.metrics,options.priorities)};
    };
    if (manual) {
      if (!input.formation || typeof input.formation!=='object' || Array.isArray(input.formation)) throw new Error('比較する編成を指定してください。');
      const f=publicFormation(input.formation);
      const errors=validity(f,catalog,chosen,options);
      return errors.length ? {ok:false,errors} : {ok:true,data:dataStatus(),result:format({formation:f,evaluation:evaluateFormation(f,options,evidence)})};
    }
    const result=moveSearch(catalog,options,chosen,evidence);
    const finalists=result.candidates.map(row=>({...row,evaluation:evaluateFormation(row.formation,options,evidence)}));
    finalists.sort((a,b)=>advice.compareMetrics(a.evaluation.metrics,b.evaluation.metrics,options.priorities) ||
      a.changes-b.changes || byName(a.id,b.id));
    return {ok:true,data:dataStatus(),baseline:chosen.base?.id || null,purpose:options.purpose,target:options.target,priorities:options.priorities,
      examined:result.examined,candidateLimit:result.bound,completeCandidates:result.completeCount,
      rankedCandidates:finalists.length,exhaustive:false,allTopTiesVerified:false,
      ranking:'候補を絞り込み、戦法速度・出陣ゲージ・兵器速度は編成画面と同じ計算で比較します。',
      coverage:coverage.coverage,freshness:coverage.freshness,
      candidates:finalists.slice(0,options.limit).map(format),
      reason:finalists.length?'':'指定条件で全5枠を埋められる候補がありません。保護部隊・主将固定・登録兵器を確認してください。'};
  }

  const string = {type:'string',maxLength:120};
  const listOfNames = {type:'array',items:string,maxItems:60};
  const inputSchema = {type:'object',additionalProperties:false,properties:{
    purpose:{type:'string',enum:Object.keys(advice.presets)},
    priorities:{type:'array',items:{type:'string',enum:advice.metrics},uniqueItems:true,minItems:1,maxItems:advice.metrics.length},
    baseId:string, protectedIds:listOfNames, fixedMain:string, checkNames:{...listOfNames,maxItems:25}, gameUpdatedAt:string,
    deployment:{type:'string',enum:FORMATION_DEPLOYMENT_TYPE_OPTIONS.map(row=>row.key)},
    target:{type:'string',enum:['unit','wall','citadel']},seconds:{type:'integer',minimum:1,maximum:180},
    limit:{type:'integer',minimum:1,maximum:5}
  }};
  const tools = {
    hado_formation_context:{description:'Inspect the selected save’s available formation IDs and game-data provenance. Check names found in recent official updates.',schema:{
      type:'object',additionalProperties:false,properties:{checkNames:{...listOfNames,maxItems:25},ownedQuery:string,gameUpdatedAt:string}
    }, handler:provenance},
    hado_formation_search:{description:'Find legal full formations from the selected save. Rank by game effect priorities and compare with baseId. Defaults to protecting all other saved formations; set protectedIds explicitly when the user allows sharing members and equipment.',schema:inputSchema,handler:(catalog,input)=>runAnalysis(catalog,input,false)},
    hado_formation_evaluate:{description:'Validate and compare a proposed detached formation against baseId using the selected save. Use the formation shape returned by search. Does not save or change the editor.',schema:{
      ...inputSchema,required:['formation'],properties:{...inputSchema.properties,formation:{type:'object',description:'Formation returned by hado_formation_search with any requested slot changes.'}}
    },handler:(catalog,input)=>runAnalysis(catalog,input,true)},
    hado_formation_save:{writes:true,description:'Append one previously searched candidate to the current formation group. Call only when the user explicitly asks to save this candidate. Requires separate one-save permission in the page.',schema:{type:'object',additionalProperties:false,required:['candidateId'],properties:{candidateId:string,name:string}}}
  };

  function planSnapshot(save) {
    return {
      signature:JSON.stringify({
        save, data:dataStatus(), groupId:state.currentFormationGroupId,
        formations:array(state.formations).map(row=>[row.id,row.groupId,advice.assignments(publicFormation(row))])
      }),
      storedFormations:localStorage.getItem(FORMATION_STORAGE_KEY),
      storedSave:localStorage.getItem(SAVE_STORAGE_KEY)
    };
  }

  function rememberCandidates(result,input,save) {
    if (!result.candidates.length) return;
    const snapshot=planSnapshot(save);
    for (const row of result.candidates) {
      const id=crypto.randomUUID();
      session.plans.set(id,{formation:clone(row.formation),input:clone(input),snapshot});
      row.candidateId=id;
    }
    while (session.plans.size>15) session.plans.delete(session.plans.keys().next().value);
  }

  function saveCandidate(input) {
    const save=activeSave();
    const plan=session.plans.get(input.candidateId);
    if (!plan) throw new Error('今回の接続で取得した候補IDを指定してください。');
    if (plan.saved) return plan.saved;
    if (!session.canSave) throw new Error('接続欄で候補1件の新規保存を許可してください。');
    const next=planSnapshot(save);
    if (next.signature!==plan.snapshot.signature || next.storedFormations!==plan.snapshot.storedFormations || next.storedSave!==plan.snapshot.storedSave) {
      throw new Error('所持情報・編成・保存先のいずれかが変わりました。候補を検索し直してください。');
    }
    const errors=withSave(save,()=>{
      const catalog=buildCatalog(getCurrentSave());
      return validity(plan.formation,catalog,selection(catalog,plan.input),advice.rankInputs(plan.input));
    });
    if (errors.length) return {ok:false,errors};

    const previous={
      formations:state.formations, formationGroups:state.formationGroups,
      currentFormationId:state.currentFormationId, currentFormationGroupId:state.currentFormationGroupId
    };
    const group=getCurrentFormationGroup();
    if (state.formations.filter(row=>row.groupId===group.id).length>=FORMATION_MAX_PER_GROUP) {
      Object.assign(state,previous);
      throw new Error('現在のグループが満杯です。保存先を切り替えて検索し直してください。');
    }
    const label=input.name?.trim() || plan.formation.slots.main.general+'の候補編成';
    const record=sanitizeFormationRecord({...createFormationRecord(label),...plan.formation,groupId:group.id});
    state.formations=[...state.formations,record];
    state.currentFormationId=record.id;
    if (!saveFormationDataToStorage('formation-advice-new-formation')) {
      Object.assign(state,previous);
      throw new Error('編成の保存に失敗しました。再実行できます。');
    }
    session.canSave=false;
    plan.saved={ok:true,formationId:record.id,name:record.name,added:1};
    writeButton.disabled=false;
    status.textContent='新しい編成を保存しました。';
    try {
      setViewMode('saved',{skipRender:true,skipHistory:true});
      setMainTab('formation');
      renderFormationScreen();
    } catch (error) {
      debugLog('formationAdvice:render-after-save-error',{message:String(error.message || error)});
    }
    return plan.saved;
  }

  function activeSave() {
    const save=getCurrentSave();
    if (!session || !save || save.id!==session.saveId || Date.now()>=session.expires) {
      if (session) revoke();
      throw new Error('選択したセーブへの接続を許可してください。');
    }
    if (!dataStatus().ready) throw new Error('ゲームデータ読み込み完了後に実行してください。');
    if (state.formationDirty) throw new Error('編成の編集内容を保存するか元に戻してから照会してください。');
    return save;
  }

  async function execute(key, input) {
    try {
      if (!Object.hasOwn(tools,key) || !input || typeof input!=='object' || Array.isArray(input)) throw new Error('入力を確認してください。');
      const schema = tools[key].schema;
      if (Object.keys(input).some(field=>!Object.hasOwn(schema.properties,field)) ||
          Object.entries(input).some(([field,value])=>schema.properties[field].type==='string' &&
            (typeof value!=='string' || value.length>120))) throw new Error('入力に対応していない項目があります。');
      const save = activeSave();
      if (tools[key].writes) {
        const current=session;
        const persist=()=>current===session ? saveCandidate(input) : {ok:false,error:'接続は終了しました。'};
        const result=navigator.locks?.request ? await navigator.locks.request(FORMATION_STORAGE_KEY,persist) : persist();
        debugLog('formationAdvice:save',{operation:key,ok:result.ok});
        return result;
      }
      const started=performance.now();
      const result=withSave(save,()=>tools[key].handler(buildCatalog(getCurrentSave()),input));
      if (key==='hado_formation_search') {
        rememberCandidates(result,input,save);
        result.elapsedMs=Math.round(performance.now()-started);
        result.canSave=!!session.canSave;
      }
      debugLog('formationAdvice:read',{operation:key,ok:result.ok,readOnly:true,elapsedMs:Math.round(performance.now()-started)});
      return result;
    } catch (error) {
      return {ok:false,error:String(error.message || error)};
    }
  }

  let button, writeButton, status;
  function revoke() {
    session=null;
    controller?.abort();
    controller=null;
    clearTimeout(expiryTimer);
    if (button) button.textContent='選択中のセーブの参照を許可';
    if (writeButton) {writeButton.hidden=true;writeButton.disabled=false;}
    if (status) status.textContent='未接続';
  }

  async function authorize(event) {
    if (!event.isTrusted) return;
    if (session) {revoke();return;}
    const save=getCurrentSave();
    if (!save || !dataStatus().ready) {
      status.textContent='セーブを選択し、データ読み込み完了後に許可してください。';
      return;
    }
    const modelContext=document.modelContext || navigator.modelContext;
    if (typeof modelContext?.registerTool!=='function') {
      status.textContent='ChatGPTのブラウザーでこのページを開いてください。';
      return;
    }
    session={saveId:save.id,expires:Date.now()+sessionDuration,canSave:false,plans:new Map()};
    expiryTimer=setTimeout(revoke,sessionDuration);
    button.textContent='接続を終了';
    status.textContent='選択中のセーブを参照できます。';
    writeButton.hidden=false;
    const current = session;
    const registration=new AbortController();
    controller=registration;
    try {
      for (const [key,tool] of Object.entries(tools)) {
        if (session!==current) return;
        await modelContext.registerTool({
          name:key,description:tool.description,inputSchema:tool.schema,
          annotations:{readOnlyHint:!tool.writes,untrustedContentHint:true},
          execute:async input=>JSON.stringify(session===current?await execute(key,input):{ok:false,error:'接続は終了しました。'})
        },{signal:registration.signal});
      }
    } catch {
      if (session===current) {
        revoke();
        status.textContent='ChatGPTへの接続に失敗しました。ページを開き直してお試しください。';
      }
    }
  }

  function mount() {
    const host=document.createElement('section');
    host.id='hadoChatgptConnection';
    host.className='panel no-detail-linkify';
    host.innerHTML='<h2>ChatGPT接続の確認</h2><p>選択中のセーブを、このタブで20分間参照します。候補の新規保存は1回ずつ許可できます。</p>' +
      '<button type="button">選択中のセーブの参照を許可</button> ' +
      '<button type="button" id="hadoChatgptAllowSave" hidden>候補1件の新規保存を許可</button><p role="status">未接続</p>';
    button=host.querySelector('button');
    writeButton=host.querySelector('#hadoChatgptAllowSave');
    status=host.querySelector('[role="status"]');
    button.addEventListener('click',authorize);
    writeButton.addEventListener('click',event=>{
      if (!event.isTrusted || !session) return;
      try {
        activeSave();
        session.canSave=true;
        writeButton.disabled=true;
        status.textContent='今回の接続で、候補1件を新規保存できます。';
      } catch (error) {
        status.textContent=String(error.message || error);
      }
    });
    for (const id of ['saveSelect','dataSheetSaveSelect']) {
      document.getElementById(id)?.addEventListener('change',revoke);
    }
    window.addEventListener('pagehide',revoke);
    window.addEventListener('storage',event=>{
      if (event.key===FORMATION_STORAGE_KEY || event.key===SAVE_STORAGE_KEY || event.key===null) revoke();
    });
    document.getElementById('appTitlePanel')?.after(host);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
