/* Browser-session tools for analyzing one selected save. */
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
    const formations = array(state.formations).map((row,i) => ({id:String(i+1), original:row, formation:publicFormation(row)}));
    const unique = (items, key) => [...new Map(items.map(item => [key(item),item])).values()];
    const layouts = new Set(array(state.formationMasters).map(row=>name(row.name || row.title)));
    return {save, formations, generals:owned(generalCategory,save.generals), equipments:owned(equipmentCategory,save.equipments),
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
    const protectedRows = catalog.formations.filter(row=>protectedIds.includes(row.id));
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
    const seeds = chosen.base ? [chosen.base.formation] : catalog.formations.map(row=>row.formation);
    const fixed = name(options.fixedMain);
    const mainCandidates = fixed ? [fixed] : generals.slice(0,12);
    const deploy = options.deployment || chosen.base?.formation.deploymentType || 'normal';
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
    return advice.search({seeds,moves,options,inspect: f=>{
      if (f.deploymentType!==deploy || validity(f,catalog,chosen,options).length) return null;
      const filled=slotKeys.filter(key=>f.slots[key].general).length;
      return {filled,complete:filled===slotKeys.length && (options.purpose!=='siege' || !!f.siegeWeapon.name),
        changes:advice.diff(chosen.base?.formation || emptyFormation(),f).length,
        metrics:advice.summarize(evidence.collect(f),options.target)};
    }});
  }

  function detailed(f, options, evidence) {
    const rows = evidence.collect(f);
    const parameters = buildFormationParameterDataUncached(f);
    const weapon = getFormationExtensionSelectionEntry('siegeWeapon',f.siegeWeapon);
    const tactics = getFormationTacticActivationOrderRows(collectFormationTacticAttackRows(f,parameters));
    const metrics = advice.summarize(rows,options.target);
    const confirmed = rows.filter(row=>row.state==='confirmed' && row.metrics.some(metric=>options.priorities.includes(metric)));
    const uncertain = rows.filter(row=>row.state!=='confirmed' && row.metrics.some(metric=>options.priorities.includes(metric)));
    const ownership = slotKeys.map(slot=>{
      const row=f.slots[slot];
      return {slot, general:row.general?{name:row.general,stars:getCurrentStarValue('generals',row.general,7)}:null,
        attendant:row.attendant?{name:row.attendant,stars:getCurrentStarValue('generals',row.attendant,7)}:null,
        equipment:Object.values(row.equipments).filter(Boolean).map(value=>({name:value,stage:getEffectiveEquipmentStageForEquipmentName(value),
          stars:getCurrentStarValue('equipments',value,10)}))};
    });
    return {formation:f,ownership,metrics, evidence:[...confirmed,...uncertain].slice(0,36),
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
    if (options.deployment && !FORMATION_DEPLOYMENT_TYPE_OPTIONS.some(row=>row.key===options.deployment)) {
      throw new Error('配置場所を確認してください。');
    }
    const chosen = selection(catalog,input);
    const evidence = createEvidence(catalog);
    const baseline = chosen.base?.formation || emptyFormation();
    const before = advice.summarize(evidence.collect(baseline),options.target);
    const format = f => {
      const data = detailed(f,options,evidence);
      return {...data, differences:advice.diff(baseline,f), metricChanges:advice.compareDetails(before,data.metrics,options.priorities)};
    };
    if (manual) {
      if (!input.formation || typeof input.formation!=='object' || Array.isArray(input.formation)) throw new Error('比較する編成を指定してください。');
      const f=publicFormation(input.formation);
      const errors=validity(f,catalog,chosen,options);
      return errors.length ? {ok:false, errors} : {ok:true,data:dataStatus(),result:format(f)};
    }
    const result = moveSearch(catalog,options,chosen,evidence);
    return {ok:true,data:dataStatus(),baseline:chosen.base?.id || null, purpose:options.purpose, target:options.target, priorities:options.priorities,
      examined:result.examined, candidateLimit:result.bound, exhaustive:false, ranking:'指定優先順で、成立した効果・原文にある個別補正値を比較する候補探索',
      candidates:result.candidates.map(row=>format(row.formation)),
      reason:result.candidates.length?'':'指定条件で全5枠を埋められる候補がありません。保護部隊・主将固定・登録兵器を確認してください。'};
  }

  const string = {type:'string',maxLength:120};
  const listOfNames = {type:'array',items:string,maxItems:60};
  const inputSchema = {type:'object',additionalProperties:false,properties:{
    purpose:{type:'string',enum:Object.keys(advice.presets)},
    priorities:{type:'array',items:{type:'string',enum:advice.metrics},uniqueItems:true,minItems:1,maxItems:advice.metrics.length},
    baseId:string, protectedIds:listOfNames, fixedMain:string,
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
    },handler:(catalog,input)=>runAnalysis(catalog,input,true)}
  };

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

  function execute(key, input) {
    try {
      if (!Object.hasOwn(tools,key) || !input || typeof input!=='object' || Array.isArray(input)) throw new Error('入力を確認してください。');
      const schema = tools[key].schema;
      if (Object.keys(input).some(field=>!Object.hasOwn(schema.properties,field)) ||
          Object.entries(input).some(([field,value])=>schema.properties[field].type==='string' &&
            (typeof value!=='string' || value.length>120))) throw new Error('入力に対応していない項目があります。');
      const save = activeSave();
      const result=withSave(save,()=>tools[key].handler(buildCatalog(getCurrentSave()),input));
      debugLog('formationAdvice:read',{operation:key,ok:result.ok,readOnly:true});
      return result;
    } catch (error) {
      return {ok:false,error:String(error.message || error)};
    }
  }

  let button, status, panel, method, args, output;
  function revoke() {
    session=null;
    controller?.abort();
    controller=null;
    clearTimeout(expiryTimer);
    if (panel) panel.hidden=true;
    if (output) output.textContent='';
    if (args) args.value='{}';
    if (button) button.textContent='選択中のセーブの参照を許可';
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
    session={saveId:save.id,expires:Date.now()+sessionDuration};
    expiryTimer=setTimeout(revoke,sessionDuration);
    button.textContent='接続を終了';
    status.textContent='選択中のセーブを参照できます。';
    const modelContext=document.modelContext || navigator.modelContext;
    if (typeof modelContext?.registerTool==='function') {
      const current = session;
      const registration=new AbortController();
      controller=registration;
      try {
        for (const [key,tool] of Object.entries(tools)) {
          if (session!==current) return;
          await modelContext.registerTool({
            name:key,description:tool.description,inputSchema:tool.schema,
            annotations:{readOnlyHint:true,untrustedContentHint:true},
            execute:async input=>JSON.stringify(session===current?execute(key,input):{ok:false,error:'接続は終了しました。'})
          },{signal:registration.signal});
        }
        return;
      } catch {
        registration.abort();
        if (session!==current) return;
      }
    }
    panel.hidden=false;
  }

  function mount() {
    const host=document.createElement('section');
    host.id='hadoChatgptConnection';
    host.className='panel no-detail-linkify';
    host.innerHTML='<h2>ChatGPT接続の確認</h2><p>ChatGPTが選択中のセーブの所持情報と保存編成を、このタブで20分間、読み取り専用で参照します。</p>' +
      '<button type="button">選択中のセーブの参照を許可</button><p role="status">未接続</p>' +
      '<form hidden aria-label="ブラウザー連携の入力"><label>操作<select name="tool"></select></label>' +
      '<label>引数<textarea name="args" rows="3">{}</textarea></label><button type="submit">照会</button>' +
      '<pre aria-label="照会結果" class="hado-chatgpt-result"></pre></form>';
    button=host.querySelector('button');
    status=host.querySelector('[role="status"]');
    panel=host.querySelector('form');
    method=panel.elements.tool;
    args=panel.elements.args;
    output=panel.querySelector('pre');
    for (const key of Object.keys(tools)) method.add(new Option(key,key));
    button.addEventListener('click',authorize);
    panel.addEventListener('submit',event=>{
      event.preventDefault();
      try {output.textContent=JSON.stringify(execute(method.value,JSON.parse(args.value)));}
      catch {output.textContent='入力JSONを確認してください。';}
    });
    document.getElementById('saveSelect')?.addEventListener('change',revoke);
    window.addEventListener('pagehide',revoke);
    document.getElementById('appTitlePanel')?.after(host);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
