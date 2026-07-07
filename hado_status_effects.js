'use strict';
/* HADO status-effect relations and related-link logic */
function collectParameterSourceRecords(item){const category=detailCategory(item);const records=[];function add(source,text,kind='include',extra={}){const t=norm(text);if(!t)return;records.push({source,text:t,kind,item,...extra});}if(category==='generals'){const tacticTable=findTacticTable(item);const tacticEffect=norm((tacticTable?.[3]||[])[0]||'');if(tacticEffect)add('戦法',tacticEffect);const sections=Array.isArray(item?.sections)?item.sections:[];const ownedLevelMap=getParameterGeneralSkillLevelMap(item);const advisorSkillNames=new Set(extractAdvisorSkillEntries(item,getItemDisplayName(item)).map(e=>norm(e.name)));const skillStart=sections.findIndex(sec=>/の技能$/.test(norm(sec?.title||'')));const skillStop=skillStart>=0?sections.findIndex((sec,idx)=>idx>skillStart&&isSkillStopTitle(norm(sec?.title||''))):-1;const skillEnd=skillStop>=0?skillStop:sections.length;const rangeMode=false;sections.forEach((sec,idx)=>{const title=norm(sec?.title||'');const rawContent=(Array.isArray(sec?.content)?sec.content:[]).filter(line=>!isOwnerListContentLine(line)).join(' ');if(!title)return;if(skillStart>=0&&idx>skillStart&&idx<skillEnd&&ownedLevelMap.has(title)){const level=ownedLevelMap.get(title);const isAdvisorSkill=advisorSkillNames.has(title);const isAppointmentSkill=isAppointmentSkillText(rawContent);const generalSkillKind=getGeneralOwnedSkillKind(item,title);const generalSkillExtra={sourceSkillType:generalSkillKind,formationSourceCategory:generalSkillKind};const advisorExtra=isAdvisorSkill?{isAdvisorSkill:true,sourceSkillType:'参軍技能',formationSourceCategory:'参軍'}:{};const appointmentExtra=isAppointmentSkill?{isAppointmentSkill:true,sourceSkillType:'任命技能',formationSourceCategory:'任命'}:{};const skillExtra={...generalSkillExtra,...advisorExtra,...appointmentExtra};if(isAdvisorSkill)debugLog('advisorSkill:detected',{context:'parameter-source',general:getItemDisplayName(item),skillName:title,level});if(isAppointmentSkill)debugLog('appointmentSkill:detected',{context:'parameter-source',general:getItemDisplayName(item),skillName:title,level});if(rangeMode){extractAllRomanLevelBlocks(rawContent).forEach(block=>add(`技能:${title}${block.level}`,block.text,'include',skillExtra));}else{const content=extractRomanLevelBlockText(rawContent,level);add(`技能:${title}${level}`,content,'include',skillExtra);addGrantedSkillParameterRecordsFromLines([content||rawContent],title,add,{parentSkillName:title,parentSkillLevel:level,...skillExtra});}return;}if(/の技能$/.test(title)){add(title,rawContent,'exclude');return;}if(/技能|戦法|追加効果|能力|初期能力|最大能力|兵科の基本能力|各レベルの能力|相性|解説|入手方法|列伝|兵科|おすすめ|特徴|評価|五行適正|演義|正史/.test(title))add(title,rawContent,'exclude');});getInheritedSkillParameterRecordsForGeneral(item,add);}else if(category==='equipments'){const split=splitEquipmentTablesForTabs(item);const effectiveEquipmentStage=getEffectiveEquipmentStageForItem(item);const savedEquipmentStage=(state.viewMode==='saved')?getCurrentEquipmentStageValue(getItemDisplayName(item)):'';const selected=selectEquipmentSkillStageBlock(item,split.skill||[],effectiveEquipmentStage);const selectedBlock=selected.block;debugLog('equipmentStage:source-blocks',{item:getItemDisplayName(item),viewMode:state.viewMode,globalStage:state.equipmentStage,savedStage:savedEquipmentStage,effectiveStage:effectiveEquipmentStage,requestedStage:selected.requestedStage,requestedLabel:selected.requestedLabel,selectedTitle:selectedBlock?selectedBlock.title:'',fallback:selected.fallback,availableTitles:(selected.blocks||[]).map(b=>b.title),skillTableCount:(split.skill||[]).length});if(selected.fallback)debugLog('equipmentStage:fallback',{item:getItemDisplayName(item),requestedStage:selected.requestedStage,selectedLabel:selected.requestedLabel,selectedTitle:selectedBlock?selectedBlock.title:'',availableTitles:(selected.blocks||[]).map(b=>b.title)});let selectedRows=0,refCount=0;(selectedBlock&&Array.isArray(selectedBlock.table)?selectedBlock.table:[]).forEach(row=>{if(Array.isArray(row)&&row.length>=2){const skillName=norm(row[0]||'');const body=norm(row.slice(1).join(' '));if(skillName&&body){const appointmentExtra=isAppointmentSkillText(body)?{isAppointmentSkill:true,sourceSkillType:'任命技能',formationSourceCategory:'任命'}:{};if(appointmentExtra.isAppointmentSkill)debugLog('appointmentSkill:detected',{context:'equipment-parameter-source',equipment:getItemDisplayName(item),skillName,stage:selectedBlock.title||selected.requestedLabel});add(`技能:${skillName}［${selectedBlock.title||selected.requestedLabel}］`,body,'include',{equipmentStage:selected.requestedStage,equipmentStageLabel:selectedBlock.title||selected.requestedLabel,equipmentName:getItemDisplayName(item),...appointmentExtra});selectedRows++;const refs=addEquipmentReferencedSkillParameterRecordsFromText(body,skillName,add,{equipmentStage:selected.requestedStage,equipmentStageLabel:selectedBlock.title||selected.requestedLabel,equipmentName:getItemDisplayName(item)});refCount+=refs.length;}}});debugLog('equipmentStage:parameter-source',{item:getItemDisplayName(item),stage:selected.requestedStage,stageLabel:selectedBlock?selectedBlock.title:selected.requestedLabel,selectedRows,referencedSkillCount:refCount});debugLog('parameterSource:equipment-skill-tables',{item:getItemDisplayName(item),equipmentStage:selected.requestedStage,selectedTitle:selectedBlock?selectedBlock.title:'',skillTableCount:(split.skill||[]).length,otherTableCount:(split.other||[]).length,skillFirstCells:(selectedBlock&&Array.isArray(selectedBlock.table)?selectedBlock.table:[]).map(row=>Array.isArray(row)?norm(row[0]):'').slice(0,20),otherFirstCells:(split.other||[]).flatMap(table=>(Array.isArray(table)?table:[]).map(row=>Array.isArray(row)?norm(row[0]):'')).slice(0,20)});(Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{const title=norm(sec?.title||'');const content=(Array.isArray(sec?.content)?sec.content:[]).join(' ');if(/専用武将|おすすめ武将|入手方法|ランキング|関連リンク|基本情報|能力|各レアリティ|技能|UR時|SSR時|初期技能|鍛錬前/.test(title))add(title,content,'exclude');});}else if(category==='skills'){const skillName=getItemDisplayName(item);const sections=Array.isArray(item?.sections)?item.sections:[];let included=0;sections.forEach((sec,idx)=>{const title=norm(sec?.title||'')||skillName||`技能説明${idx+1}`;const lines=(Array.isArray(sec?.content)?sec.content:[]).filter(line=>!isOwnerListContentLine(line)&&!/(技能別武将一覧はこちら|参軍技能別武将一覧はこちら)/.test(norm(line)));const content=norm(lines.join(' '));if(!content)return;if(/を持つ武将$|を強化する装備品$|一覧はこちら|関連リンク|入手方法|ランキング/.test(title)){add(title,content,'exclude');return;}add(`技能:${title}`,content,'include',{sourceSkillType:norm(item?.sourceType||item?.raw?.sourceType||'技能'),formationSourceCategory:'技能'});included++;});if(!included){const rawText=norm([item?.description,item?.raw?.description,item?.effectText].filter(Boolean).join(' '));if(rawText)add(`技能:${skillName||'技能'}`,rawText,'include',{sourceSkillType:'技能',formationSourceCategory:'技能'});}debugLog('parameterSource:skill-detail',{item:skillName,sectionCount:sections.length,included});}return records;}
const PARAM_GROUPS=[{group:'ability',keys:['兵力','攻撃','防御','知力','機動']},{group:'damage',keys:['与ダメージ','通常攻撃威力','戦法威力','戦法攻撃与ダメージ','通常攻撃与ダメージ','物理与ダメージ','知力与ダメージ','火属性威力','火属性戦法威力','対物特効','対歩兵攻撃','対騎兵攻撃','対弓兵攻撃']},{group:'speed',keys:['攻撃速度','戦法速度','兵器速度','会心発生','会心威力','撃心発生','撃心威力','連鎖確率']},{group:'defense',keys:['被ダメージ','通常攻撃被ダメージ','戦法被ダメージ','物理被ダメージ','知力被ダメージ','会心耐性','物理耐性','知力耐性','火属性耐性']},{group:'gauge',keys:['戦法ゲージ']},{group:'target',keys:['通常攻撃対象数','戦法対象数','射程']}];
const PARAM_EXCLUDED_KEYS=new Set(['命中','統率','武力','政治','魅力']);
const PARAM_COUNT_KEYS=new Set(['通常攻撃対象数','戦法対象数']);
// HADO-2.7.3.59-FORMATION-RANGE-AND-ORDER: 射程は%ではなく数値表示する。状態変化率の表示順と同じキー順でサマリー/結果を出す。
const PARAM_NO_UNIT_KEYS=new Set([...PARAM_COUNT_KEYS,'射程']);
function getParameterDefaultUnit(key,explicitUnit){const k=norm(key);if(explicitUnit!==undefined)return explicitUnit;return (PARAM_NO_UNIT_KEYS&&PARAM_NO_UNIT_KEYS.has(k))?'':'%';}
const PARAM_DISPLAY_GROUP_ORDER=['ability','damage','speed','defense','gauge','target','special'];
function getParamGroup(key){for(const g of PARAM_GROUPS){if(g.keys.includes(key))return g.group;}return 'special';}
// FEATURE[HADO-2.1.1.0-PARAM-DISPLAY-LABEL]: 状態変化率の表示名だけを変更する。内部キー・検索キー・抽出キーは変更しない。
const PARAM_DISPLAY_LABELS={'兵力':'部隊の兵力','攻撃':'部隊の攻撃','防御':'部隊の防御','知力':'部隊の知力','機動':'部隊の機動','攻撃速度':'部隊の攻撃速度','射程':'部隊の射程'};
// FEATURE[HADO-2.5.5.0-STATUS-EFFECT-LINKS]: 状態変化カテゴリ名と状態変化率summaryKeyを接続する表示・関連リンク用正規化マップ。内部キーは変更しない。
const STATUS_EFFECT_NORMALIZATION_RULES={
  '攻撃速度変化(強化)':{summaryKey:'攻撃速度',direction:'buff',displayName:'攻撃速度上昇',aliases:['攻撃速度','攻撃速度上昇','攻撃速度+','攻撃速度＋','攻撃速度を上昇','攻撃速度が上昇']},
  '攻撃速度変化(弱化)':{summaryKey:'攻撃速度',direction:'debuff',displayName:'攻撃速度低下',aliases:['攻撃速度低下','攻撃速度-','攻撃速度－','攻撃速度を低下','攻撃速度が低下']},
  '会心発生変化(強化)':{summaryKey:'会心発生',direction:'buff',displayName:'会心発生上昇',aliases:['会心発生','会心発生率','会心発生上昇','会心発生+','会心発生率+','会心発生が上昇']},
  '会心発生変化(弱化)':{summaryKey:'会心発生',direction:'debuff',displayName:'会心発生低下',aliases:['会心発生低下','会心発生率低下','会心発生-','会心発生率-','会心発生が低下']},
  '会心威力変化(強化)':{summaryKey:'会心威力',direction:'buff',displayName:'会心威力上昇',aliases:['会心威力','会心威力上昇','会心威力+','会心威力が上昇']},
  '会心威力変化(弱化)':{summaryKey:'会心威力',direction:'debuff',displayName:'会心威力低下',aliases:['会心威力低下','会心威力-','会心威力が低下']},
  '戦法速度変化(強化)':{summaryKey:'戦法速度',direction:'buff',displayName:'戦法速度上昇',aliases:['戦法速度','戦法速度上昇','戦法速度+','戦法速度が上昇']},
  '戦法速度変化(弱化)':{summaryKey:'戦法速度',direction:'debuff',displayName:'戦法速度低下',aliases:['戦法速度低下','戦法速度-','戦法速度が低下']},
  '戦法ゲージ変化(強化)':{summaryKey:'戦法ゲージ',direction:'buff',displayName:'戦法短縮',aliases:['戦法短縮','戦法ゲージ','戦法ゲージ増加','戦法ゲージ上昇','戦法ゲージ+','戦法ゲージ＋','戦法ゲージが上昇','戦法待ち時間','戦法待ち時間を短縮','戦法待ち時間を少し短縮','戦法待ち時間を大きく短縮','戦法待ち時間をわずかに短縮','戦法の待ち時間','戦法の待ち時間を短縮','戦法の待ち時間を少し短縮','戦法の待ち時間を大きく短縮','戦法の待ち時間をわずかに短縮']},
  '戦法短縮':{summaryKey:'戦法ゲージ',direction:'buff',displayName:'戦法短縮',aliases:['戦法短縮','戦法ゲージ','戦法ゲージ増加','戦法ゲージ上昇','戦法ゲージ+','戦法ゲージ＋','戦法ゲージが上昇','戦法待ち時間','戦法待ち時間を短縮','戦法待ち時間を少し短縮','戦法待ち時間を大きく短縮','戦法待ち時間をわずかに短縮','戦法の待ち時間','戦法の待ち時間を短縮','戦法の待ち時間を少し短縮','戦法の待ち時間を大きく短縮','戦法の待ち時間をわずかに短縮']},
  '対物特効変化(強化)':{summaryKey:'対物特効',direction:'buff',displayName:'対物特効上昇',aliases:['対物特効','対物特効上昇','対物特効+','対物特効が上昇']},
  '対物特効変化(弱化)':{summaryKey:'対物特効',direction:'debuff',displayName:'対物特効低下',aliases:['対物特効低下','対物特効-','対物特効が低下']},
  '与ダメージ変化(強化)':{summaryKey:'与ダメージ',direction:'buff',displayName:'与ダメージ上昇',aliases:['与ダメージ','与ダメージ上昇','与ダメージ+','与ダメージが上昇']},
  '与ダメージ変化(弱化)':{summaryKey:'与ダメージ',direction:'debuff',displayName:'与ダメージ低下',aliases:['与ダメージ低下','与ダメージ-','与ダメージが低下']},
  '被ダメージ変化(強化)':{summaryKey:'被ダメージ',direction:'buff',displayName:'被ダメージ低下',aliases:['被ダメージ低下','被ダメージ軽減','被ダメージ-','被ダメージが減少','被ダメージを軽減']},
  '被ダメージ変化(弱化)':{summaryKey:'被ダメージ',direction:'debuff',displayName:'被ダメージ上昇',aliases:['被ダメージ','被ダメージ上昇','被ダメージ+','被ダメージが上昇']}
  ,
  '兵科相性変化(強化)':{summaryKey:'兵科相性',direction:'buff',displayName:'兵科相性上昇',aliases:['兵科相性','兵科相性上昇','兵科相性変化','兵科相性が上昇']},
  '兵科相性変化(弱化)':{summaryKey:'兵科相性',direction:'debuff',displayName:'兵科相性低下',aliases:['兵科相性低下','兵科相性変化','兵科相性が低下']},
  '兵器速度変化(強化)':{summaryKey:'兵器速度',direction:'buff',displayName:'兵器速度上昇',aliases:['兵器速度','兵器速度上昇','兵器速度変化','兵器速度が上昇','兵器待ち時間短縮','兵器待ち時間を短縮']},
  '兵器速度変化(弱化)':{summaryKey:'兵器速度',direction:'debuff',displayName:'兵器速度低下',aliases:['兵器速度低下','兵器速度変化','兵器速度が低下']},
  '命中変化(強化)':{summaryKey:'命中',direction:'buff',displayName:'命中上昇',aliases:['命中','命中上昇','命中変化','命中が上昇']},
  '命中変化(弱化)':{summaryKey:'命中',direction:'debuff',displayName:'命中低下',aliases:['命中低下','命中変化','命中が低下']},
  '撃心発生変化(強化)':{summaryKey:'撃心発生',direction:'buff',displayName:'撃心発生上昇',aliases:['撃心発生','撃心発生上昇','撃心発生変化','撃心発生が上昇']},
  '撃心発生変化(弱化)':{summaryKey:'撃心発生',direction:'debuff',displayName:'撃心発生低下',aliases:['撃心発生低下','撃心発生変化','撃心発生が低下']},
  '撃心威力変化(強化)':{summaryKey:'撃心威力',direction:'buff',displayName:'撃心威力上昇',aliases:['撃心威力','撃心威力上昇','撃心威力変化','撃心威力が上昇']},
  '撃心威力変化(弱化)':{summaryKey:'撃心威力',direction:'debuff',displayName:'撃心威力低下',aliases:['撃心威力低下','撃心威力変化','撃心威力が低下']},
  '通常攻撃威力変化(強化)':{summaryKey:'通常攻撃威力',direction:'buff',displayName:'通常攻撃威力上昇',aliases:['通常攻撃威力','通常攻撃威力上昇','通常攻撃威力変化','通常攻撃威力が上昇']},
  '通常攻撃威力変化(弱化)':{summaryKey:'通常攻撃威力',direction:'debuff',displayName:'通常攻撃威力低下',aliases:['通常攻撃威力低下','通常攻撃威力変化','通常攻撃威力が低下']},
  '火属性強化':{summaryKey:'火属性威力',direction:'buff',displayName:'火属性強化',aliases:['火属性強化','火属性威力','火属性威力上昇','火属性威力変化','火属性威力が上昇']},
  '火属性戦法威力(強化)':{summaryKey:'火属性戦法威力',direction:'buff',displayName:'火属性戦法威力上昇',aliases:['火属性戦法威力','火属性戦法威力上昇','火属性戦法威力が上昇']},
  '火属性戦法威力(弱化)':{summaryKey:'火属性戦法威力',direction:'debuff',displayName:'火属性戦法威力低下',aliases:['火属性戦法威力低下','火属性戦法威力が低下']},
  '攻撃短縮':{summaryKey:'攻撃待ち時間',direction:'buff',displayName:'攻撃短縮',aliases:['攻撃短縮','即時攻撃','通常攻撃待ち時間','通常攻撃の待ち時間','攻撃待ち時間短縮','通常攻撃待ち時間を短縮']}

};
const STATUS_EFFECT_SUMMARY_DISPLAY_RULES={
  '攻撃速度':{buff:'攻撃速度上昇',debuff:'攻撃速度低下'},
  '会心発生':{buff:'会心発生上昇',debuff:'会心発生低下'},
  '会心威力':{buff:'会心威力上昇',debuff:'会心威力低下'},
  '戦法速度':{buff:'戦法速度上昇',debuff:'戦法速度低下'},
  '戦法ゲージ':{buff:'戦法短縮',debuff:'戦法遅延'},
  '対物特効':{buff:'対物特効上昇',debuff:'対物特効低下'},
  '与ダメージ':{buff:'与ダメージ上昇',debuff:'与ダメージ低下'},
  '被ダメージ':{buff:'被ダメージ低下',debuff:'被ダメージ上昇'}
};
function normalizeStatusEffectRuleKey(value){return norm(value).replace(/（/g,'(').replace(/）/g,')');}
function statusEffectRuleForName(name){const key=normalizeStatusEffectRuleKey(name);if(STATUS_EFFECT_NORMALIZATION_RULES[key])return STATUS_EFFECT_NORMALIZATION_RULES[key];const m=key.match(/^(.+?)(?:変化)?\((強化|弱化)\)$/);if(!m)return null;const summaryKey=norm(m[1]);const isBuff=m[2]==='強化';const displayName=summaryKey+(isBuff?'上昇':'低下');return {summaryKey,direction:isBuff?'buff':'debuff',displayName,aliases:[summaryKey,displayName,summaryKey+(isBuff?'+':'-'),summaryKey+(isBuff?'＋':'－'),summaryKey+'が'+(isBuff?'上昇':'低下'),summaryKey+'変化']};}
function getStatusEffectProfile(input){const item=(input&&typeof input==='object')?input:null;const originalName=norm(item?.originalName||item?.raw?.name||item?.name||item?.title||input||'');const rule=statusEffectRuleForName(originalName);const displayName=norm(item?.statusDisplayName||rule?.displayName||originalName);const summaryKey=norm(item?.statusSummaryKey||rule?.summaryKey||'');const direction=norm(item?.statusDirection||rule?.direction||'');const rawAliases=[originalName,displayName,summaryKey,...(Array.isArray(rule?.aliases)?rule.aliases:[])];const aliases=[...new Set(rawAliases.map(norm).filter(v=>v&&v.length>=2))];return {originalName,displayName,summaryKey,direction,aliases,normalized:!!rule};}
function getStatusEffectDisplayName(input){return getStatusEffectProfile(input).displayName;}
function parameterDisplayName(key){const k=norm(key);return PARAM_DISPLAY_LABELS[k]||k;}
function parameterSummaryDisplayName(key,entry){const k=norm(key);const base=parameterDisplayName(k);const rule=STATUS_EFFECT_SUMMARY_DISPLAY_RULES[k];if(!rule)return base;const total=Number(entry?.maxTotal??entry?.total??0);if(total<0)return rule.debuff||base;if(total>0)return rule.buff||base;return rule.buff||base;}

function statusEffectTypeOf(name){const n=norm(name);const item=(state.statusEffects||[]).find(x=>norm(x?.name||'')===n);return norm(item?.effectType||item?.type||item?.raw?.type||'');}
function classifyEffectTiming(text,context=''){let t=norm(context+' '+text);const deploymentOnly=/自都市駐屯部隊に編制されている際/.test(t)&&!/自都市に駐屯中|駐屯\/?防衛中|駐屯・防衛中|防衛中/.test(t);if(/戦法を発動|戦法発動|主将戦法|戦法で付与|戦法攻撃時|戦法発動時/.test(t))return 'tactic';if(/出陣時|交戦開始時|初回の戦法発動まで/.test(t))return 'deploy';if(!deploymentOnly&&/駐屯|防衛/.test(t))return 'defense';return 'normal';}
function timingLabel(t){return t==='tactic'?'戦法発動時':t==='deploy'?'出陣時':t==='defense'?'駐屯防衛時':'通常時';}
function splitEffectSegments(text){return norm(text).replace(/([■▼●])/g,'\n$1').split(/\n+/).map(norm).filter(Boolean);}
function addEffect(list,opts){const key=norm(opts.key);if(!key)return;if(PARAM_EXCLUDED_KEYS&&PARAM_EXCLUDED_KEYS.has(key)){debugLog('parameter-effect:discarded',{reason:'excludedKey',key,source:opts.sourceLabel||'',raw:opts.rawText||''});return;}const n=Number(opts.value);if(Number.isFinite(n)&&n===0&&!opts.forceDisplay)return;const unit=getParameterDefaultUnit(key,opts.unit);list.push({...opts,key,unit,group:getParamGroup(key),timing:opts.timing||'normal',timingLabel:timingLabel(opts.timing||'normal')});}
function parameterKeyAlternation(){return PARAM_GROUPS.flatMap(g=>g.keys).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');}
function splitParamKeyList(text){return norm(text).split(/[、,，と・\/]/).map(v=>norm(v)).filter(Boolean).filter(v=>PARAM_GROUPS.flatMap(g=>g.keys).includes(v));}
function maxPercentInText(text){const m=norm(text).match(/最大\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]/);return m?Number(m[1]):null;}
function parameterKeyAltExcept(exceptKey){const ex=norm(exceptKey);return PARAM_GROUPS.flatMap(g=>g.keys).filter(k=>norm(k)!==ex).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');}
function cleanConditionText(text){return norm(text).replace(/^[■▼]/,'');}
function isGenericParamFalseHit(key,matched,segment){const m=norm(matched),seg=norm(segment);if(PARAM_EXCLUDED_KEYS&&PARAM_EXCLUDED_KEYS.has(key))return true;if(/(?:付与率|発生率|確率)[^。●▼■]{0,12}[+＋]/.test(m))return true;if(['兵力','攻撃','防御','知力','機動'].includes(key)){const otherAlt=parameterKeyAltExcept(key);if(otherAlt){const basisRe=new RegExp(escRe(key)+'に応じて[^。●▼■]{0,80}(?:'+otherAlt+')が(?:上昇|増加|低下|減少|軽減)');if(basisRe.test(seg))return true;}if(new RegExp(escRe(key)+'が[^。●▼■]{0,40}(?:より高い|以上|以下|未満|高い場合|低い場合)[^。●▼■]{0,40}(?:付与率|発生率|確率)[+＋]').test(seg))return true;}if(key==='兵力'&&/(最大兵力|基礎兵力).*に応じて/.test(seg))return true;if(key==='兵力'&&/最大兵力/.test(m)&&/(戦法速度|戦法ゲージ|与ダメージ|被ダメージ|会心|撃心|威力|軽減|上昇)/.test(seg))return true;if(key==='与ダメージ'&&/(戦法攻撃の与ダメージ|通常攻撃の与ダメージ|物理系統.*与ダメージ)/.test(seg))return true;if(key==='与ダメージ'&&/被ダメージ\s*[-₋－]/.test(m))return true;if(key==='被ダメージ'&&/(物理系統.*被ダメージ|知力系統.*被ダメージ|戦法.*被ダメージ|通常攻撃.*被ダメージ)/.test(seg))return true;if(key==='被ダメージ'&&/与ダメージ\s*[+＋]/.test(m))return true;if(key==='攻撃'&&(/[0-9]+(?:\.[0-9]+)?\s*[％%]の攻撃/.test(seg)||/攻撃する.*威力.*[0-9]+(?:\.[0-9]+)?\s*[％%].*上昇/.test(seg)))return true;if(key!=='戦法威力'&&/技能Lv[^。●▼■]{0,30}[0-9]+(?:\.[0-9]+)?\s*[％%][^。●▼■]{0,20}威力[^。●▼■]{0,20}上昇/.test(m))return true;if(['攻撃','防御','知力','兵力'].includes(key)&&/(与ダメージ|被ダメージ|戦法威力|通常攻撃威力|攻撃速度|戦法速度|対象部隊数|戦法ゲージ|会心|撃心|耐性|軽減)/.test(m.replace(key,'')))return true;if(key==='攻撃'&&/(攻撃速度|戦法攻撃|通常攻撃|攻撃目標|攻撃間隔|攻撃属性|攻撃威力)/.test(m))return true;if(key==='防御'&&/(防御中|駐屯\/防衛|駐屯・防衛)/.test(m))return true;return false;}

function addParameterNumericEffect(list,{timing,key,val,sign='+',source,context,raw,forceDisplay=false,unit}){const num=Number(val);if(!Number.isFinite(num)||(!forceDisplay&&num===0))return;const cleanKey=norm(key);const resolvedUnit=getParameterDefaultUnit(cleanKey,unit);addEffect(list,{timing,key:cleanKey,value:num,unit:resolvedUnit,sign,sourceLabel:source,condition:cleanConditionText(context),rawText:raw,isConditional:/際|場合|時|駐屯|防衛|主将|副将|補佐|兵力|好相性|応じて|最大|上限|将星/.test(context+raw),forceDisplay:!!forceDisplay});}

function parseTacticConditionalPowerEffects(seg,timing,source,context,effects,item){let m;if(source==='戦法'&&(m=seg.match(/対象が([^）)、,，。]+?)の場合[^。●▼■]*?威力を\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]\s*上昇/))){const target=norm(m[1]);addParameterNumericEffect(effects,{timing,key:`戦法威力（対${target}）`,val:m[2],sign:'+',source,context:`対象が${target}の場合`,raw:m[0]});}if(source==='戦法'&&(m=seg.match(/将星ランクに応じて[^。●▼■]*?威力が\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]\s*ずつ上昇/))){const step=Number(m[1]);if(Number.isFinite(step)){if(state.viewMode==='saved'){const star=getCurrentStarValue('generals',item?.name||getItemDisplayName(item),7);addParameterNumericEffect(effects,{timing,key:'戦法威力（将星依存）',val:step*star,sign:'+',source,context:`将星${star}`,raw:m[0],forceDisplay:true});}else{addParameterNumericEffect(effects,{timing,key:'戦法威力（将星依存）',val:0,sign:'+',source,context:'将星0',raw:m[0],forceDisplay:true});addParameterNumericEffect(effects,{timing,key:'戦法威力（将星依存）',val:step*7,sign:'+',source,context:'将星7',raw:m[0],forceDisplay:true});}}}}
function parseSpecificParameterEffects(seg,timing,source,context,effects){let m;if((m=seg.match(/戦法攻撃の与ダメージ\s*[+＋]([0-9]+(?:\.[0-9]+)?)\s*[％%]/)))addParameterNumericEffect(effects,{timing,key:'戦法攻撃与ダメージ',val:m[1],sign:'+',source,context,raw:seg});if((m=seg.match(/通常攻撃の与ダメージ\s*[+＋]([0-9]+(?:\.[0-9]+)?)\s*[％%]/)))addParameterNumericEffect(effects,{timing,key:'通常攻撃与ダメージ',val:m[1],sign:'+',source,context,raw:seg});if((m=seg.match(/物理系統[^。●▼■]{0,30}与ダメージ\s*[+＋]([0-9]+(?:\.[0-9]+)?)\s*[％%]/)))addParameterNumericEffect(effects,{timing,key:'物理与ダメージ',val:m[1],sign:'+',source,context,raw:seg});if((m=seg.match(/物理系統[^。●▼■]{0,30}被ダメージ\s*[-₋－]([0-9]+(?:\.[0-9]+)?)\s*[％%]/)))addParameterNumericEffect(effects,{timing,key:'物理被ダメージ',val:m[1],sign:'-',source,context,raw:seg});if((m=seg.match(/(?:部隊の)?射程\s*[+＋]([0-9]+(?:\.[0-9]+)?)/)))addParameterNumericEffect(effects,{timing,key:'射程',val:m[1],sign:'+',source,context,raw:seg,unit:''});if((m=seg.match(/(?:部隊の)?射程\s*[-₋－]([0-9]+(?:\.[0-9]+)?)/)))addParameterNumericEffect(effects,{timing,key:'射程',val:m[1],sign:'-',source,context,raw:seg,unit:''});}

// FIX[HADO-2.7.3.63-FORMATION-RANGE-CONDITION-REAL-TEXT]:
// 練射の実データは「▼編制時点の自部隊の射程が2以上の際」と「●部隊の射程+1」が
// 同一技能本文内の別セグメントとして存在する。セグメント単位抽出で落ちても、
// レコード本文全体から条件付き射程補正を補完抽出し、後段の射程条件ゲートに渡す。
function findLatestRomanLevelBefore(text,index){
  const t=String(text||'');let found='';
  const re=/([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])(?=\s*■)/g;let m;
  while((m=re.exec(t))&&m.index<=index){found=m[1];}
  return found;
}
function appendRangeThresholdEffectsFromRecordText(record,effects){
  const text=norm([record?.fullText,record?.originalText,record?.rawText,record?.text].filter(Boolean).join(' '));
  if(!text||!/射程/.test(text))return;
  const re=/▼?\s*((?:編制時点の)?自部隊の射程が\s*([0-9]+(?:\.[0-9]+)?)\s*以上(?:の際|の場合)?)\s*●\s*(?:部隊の)?射程\s*([+＋\-－₋])\s*([0-9]+(?:\.[0-9]+)?)/g;
  let m;
  while((m=re.exec(text))){
    const condition=cleanConditionText(m[1]);
    const sign=/[\-－₋]/.test(m[3])?'-':'+';
    const value=Number(m[4]);
    if(!Number.isFinite(value))continue;
    const roman=findLatestRomanLevelBefore(text,m.index)||ROMAN_LEVELS[Math.max(0,(Number(record?.formationSavedLevel||record?.level)||1)-1)]||'';
    const parsedSource=formationSkillNameLevelFromSource(record?.source||'');
    const baseName=norm(record?.formationSkillName||parsedSource.name||record?.source||'技能');
    const normalizedSource=/^技能:/.test(baseName)?baseName:`技能:${baseName}`;
    const source=sourceLabelWithLevel(normalizedSource,roman);
    const raw=m[0];
    const exists=(effects||[]).some(e=>norm(e?.key||'')==='射程'&&norm(e.sourceLabel)===norm(source)&&Number(e.value)===value&&e.sign===sign&&/自部隊の射程/.test(norm(e.condition+' '+e.rawText)));
    if(exists)continue;
    addParameterNumericEffect(effects,{timing:'normal',key:'射程',val:value,sign,source,context:condition,raw,unit:''});
    debugLog('parameter-effect:range-threshold-real-text-added',{source,condition,value,sign,raw,recordSource:record?.source||'',baseName,roman,textHasRange:/自部隊の射程/.test(text)});
  }
}
function ensureRangeThresholdEffectsFromActiveRecord(activeRec,parsed){
  const before=(parsed?.effects||[]).filter(isFormationRangeThresholdEffect).length;
  appendRangeThresholdEffectsFromRecordText(activeRec,parsed?.effects||[]);
  const after=(parsed?.effects||[]).filter(isFormationRangeThresholdEffect).length;
  if(after!==before)debugLog('parameter-effect:range-threshold-ensure',{source:activeRec?.source||'',formationSkillName:activeRec?.formationSkillName||'',before,after,usedFullText:!!activeRec?.fullText});
  return parsed;
}
function buildFormationRangeEffectTrace(effects,rangeConditionGate){
  const list=Array.isArray(effects)?effects:[];
  const rows=list.filter(e=>norm(e?.key||'')==='射程').map(e=>({source:e.sourceLabel||'',value:effectSignedValue(e),unit:e.unit||'',condition:cleanConditionText(e.condition||''),rawText:e.rawText||'',isRangeThreshold:isFormationRangeThresholdEffect(e),gate:e.rangeConditionGate||null}));
  return {rangeRows:rows,hasRenshaRange:rows.some(r=>/練射/.test(norm(r.source))&&Number(r.value)===1),rangeTotal:rows.reduce((sum,r)=>sum+(Number(r.value)||0),0),gate:rangeConditionGate||null};
}
function parseParallelDifferentValueEffects(seg,timing,source,context,effects){
  const text=norm(seg);
  if(!/(上昇|増加|低下|減少|軽減)/.test(text))return;
  const actionMatch=text.match(/(上昇|増加|低下|減少|軽減)/);
  if(!actionMatch)return;
  const action=actionMatch[1];
  const sign=/低下|減少|軽減/.test(action)?'-':'+';
  const keyAlt=parameterKeyAlternation();
  const pairRe=new RegExp('('+keyAlt+')を\\s*([0-9]+(?:\\.[0-9]+)?)\\s*[％%](?=\\s*[、,，]|\\s*(?:上昇|増加|低下|減少|軽減))','g');
  let m;
  while((m=pairRe.exec(text))){
    const key=norm(m[1]);
    const val=m[2];
    const raw=m[0]+action;
    if(isGenericParamFalseHit(key,raw,text))continue;
    addParameterNumericEffect(effects,{timing,key,val,sign,source,context,raw});
  }
}

function parseMultiTargetPercentEffects(seg,timing,source,context,effects){const keyAlt=parameterKeyAlternation();let m;const twoValueRe=new RegExp('((?:'+keyAlt+')(?:[、,，と・](?:'+keyAlt+'))+)を\\s*([0-9]+(?:\\.[0-9]+)?)\\s*[％%]\\s*[、,，]\\s*('+keyAlt+')を\\s*([0-9]+(?:\\.[0-9]+)?)\\s*[％%]\\s*(上昇|増加|低下|減少|軽減)','g');while((m=twoValueRe.exec(seg))){const sign=/低下|減少|軽減/.test(m[5])?'-':'+';splitParamKeyList(m[1]).forEach(k=>addParameterNumericEffect(effects,{timing,key:k,val:m[2],sign,source,context,raw:m[0]}));addParameterNumericEffect(effects,{timing,key:m[3],val:m[4],sign,source,context,raw:m[0]});}const oneValueRe=new RegExp('((?:'+keyAlt+')(?:[、,，と・](?:'+keyAlt+'))+)を\\s*([0-9]+(?:\\.[0-9]+)?)\\s*[％%]\\s*(上昇|増加|低下|減少|軽減)','g');while((m=oneValueRe.exec(seg))){const sign=/低下|減少|軽減/.test(m[3])?'-':'+';splitParamKeyList(m[1]).forEach(k=>addParameterNumericEffect(effects,{timing,key:k,val:m[2],sign,source,context,raw:m[0]}));}}
function sourceLabelWithLevel(source,level){const s=norm(source),lv=norm(level);if(!lv||!/^技能:/.test(s))return s;if(new RegExp('(?:'+ROMAN_LEVELS.map(escRe).join('|')+')$').test(s))return s;return s+lv;}
function stripAttackScalingClausesForParameterExtract(segment){
  let text=norm(segment);
  if(!text)return text;
  const before=text;
  const attackCtx=/(?:対象を含む)?敵s*d+s*部隊にs*d+(?:.d+)?s*[％%]s*の攻撃/.test(text);
  if(attackCtx){
    text=text.replace(/[（(][^（）()。●▼■]{0,140}(?:Lv×|に応じて|につき|ずつ)[^（）()。●▼■]{0,120}威力が上昇。?s*最大s*[+＋]?d+(?:.d+)?s*[％%][^（）()]*[）)]/g,'');
    text=text.replace(/(?:Lv×|に応じて|につき|ずつ)[^。●▼■]{0,120}威力が上昇。?s*最大s*[+＋]?d+(?:.d+)?s*[％%]/g,'');
  }
  if(before!==text)debugLog('parameter-extract:skip-attack-scaling-clause',{before,after:text});
  return text;
}
function appendMultiplierMaxEffectsFromSegment(effects,startIndex,seg,source,context){
  const text=norm(seg);
  const m=text.match(/好相性[^。●▼■]*?効果が\s*[0-9]+(?:\.[0-9]+)?\s*倍[（(]\s*([+＋\-－₋]?)\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]\s*[）)]/);
  if(!m)return;
  const condition=(text.match(/(?:主将か、)?主将と自身が好相性の際|主将か、主将と自身が好相性の際|好相性の際/)||[])[0]||'好相性の際';
  const affected=effects.slice(startIndex).filter(e=>e&&e.sourceLabel===source&&e.rawText===seg&&e.unit==='%');
  const signChar=m[1]||'';
  affected.forEach(e=>{
    const sign=/[-－₋]/.test(signChar)?'-':(/[+＋]/.test(signChar)?'+':e.sign);
    const val=Number(m[2]);
    if(!Number.isFinite(val))return;
    const exists=effects.some(x=>x&&x.sourceLabel===source&&x.key===e.key&&x.value===val&&x.sign===sign&&x.rawText===seg&&x.condition===condition);
    if(!exists)addParameterNumericEffect(effects,{timing:e.timing,key:e.key,val,sign,source,context:condition,raw:seg,forceDisplay:val===0});
  });
}


// FIX[HADO-2.8.9.5-CHAIN-SKILL-BONUS]: 連鎖率補正は状態変化率の通常抽出だけでは
// 「副将の弓兵の連鎖確率+3%」「技能「羌」を所持していない副将」などを落とすため、
// 連鎖率専用の固定値抽出を追加する。一時判定型（疑心/連鎖累減/奪魂を無視して判定）は通常値へ混ぜない。
function isTemporaryChainJudgementText(text){const s=norm(text||'');return /疑心|連鎖累減|奪魂/.test(s)&&/(影響を無視|判定を行う|状態で判定)/.test(s);}
function parseChainRateFixedEffects(seg,timing,source,context,effects){
  const text=norm(seg||'');
  if(!text||!/連鎖確率/.test(text))return;
  if(/連鎖確率低下/.test(text))return;
  if(isTemporaryChainJudgementText(text))return;
  const subjects=[];
  const subjectRe=/(技能「[^」]+」を所持していない副将|技能「[^」]+」を所持している副将|副将[１２12]?|副将の(?:騎兵|歩兵|弓兵)|自身)/g;
  let sm;
  while((sm=subjectRe.exec(text)))subjects.push({text:sm[1],index:sm.index});
  const re=/連鎖確率\s*[+＋]([0-9]+(?:\.[0-9]+)?)\s*[％%]/g;
  let m;
  while((m=re.exec(text))){
    const val=Number(m[1]);
    if(!Number.isFinite(val)||val<=0)continue;
    let subject='副将';
    const prior=subjects.filter(x=>x.index<=m.index).pop();
    if(prior)subject=prior.text;
    const raw=text.slice(Math.max(0,(prior?prior.index:m.index)-20),Math.min(text.length,m.index+m[0].length+20));
    addEffect(effects,{timing:timing||'normal',key:'連鎖確率',value:val,unit:'%',sign:'+',sourceLabel:source,condition:cleanConditionText([context,subject].filter(Boolean).join(' / ')),rawText:raw||text,isConditional:!!context});
  }
}

function parseParameterEffectsFromRecord(record){
  const effects=[],specials=[];
  let context='',blockContext='',currentLevel='';
  const allKeys=PARAM_GROUPS.flatMap(g=>g.keys);
  function composeConditionContext(seg){
    const t=norm(seg||'');
    if(!t)return context;
    if(t.startsWith('■')){
      blockContext=t;
      context=t;
      return context;
    }
    if(t.startsWith('▼')){
      const inherited=blockContext&&blockContext!=='■常に'&&cleanConditionText(blockContext)!=='常に';
      context=inherited?`${blockContext} ${t}`:t;
      if(inherited)debugLog('parameter-effect:inherit-parent-condition',{source:record?.source||'',parent:blockContext,child:t,effectiveContext:context});
      return context;
    }
    return context;
  }
  splitEffectSegments(record.text).forEach(segRaw=>{
    let seg=stripAttackScalingClausesForParameterExtract(norm(segRaw));
    const levelMatch=seg.match(/^([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])(?:\s*)/);
    if(levelMatch){
      currentLevel=levelMatch[1];
      seg=norm(seg.slice(levelMatch[0].length));
      if(!seg)return;
    }
    const effectiveContext=composeConditionContext(seg);
    let timing=classifyEffectTiming(seg,effectiveContext);
    const source=sourceLabelWithLevel(record.source,currentLevel);
    if(record.source==='戦法')timing='tactic';
    const segmentEffectStart=effects.length;
    parseMultiTargetPercentEffects(seg,timing,source,effectiveContext,effects);
    parseParallelDifferentValueEffects(seg,timing,source,effectiveContext,effects);
    parseTacticConditionalPowerEffects(seg,timing,source,effectiveContext,effects,record.item);
    parseSpecificParameterEffects(seg,timing,source,effectiveContext,effects);
    parseChainRateFixedEffects(seg,timing,source,effectiveContext,effects);
    allKeys.forEach(key=>{
      const k=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      let m;
      const patterns=[
        [new RegExp(k+'[^。●▼■]{0,16}[+＋]([0-9]+(?:\\.[0-9]+)?)\\s*[％%]','g'),'+'],
        [new RegExp(k+'[^。●▼■]{0,16}[-₋－]([0-9]+(?:\\.[0-9]+)?)\\s*[％%]','g'),'-'],
        [new RegExp(k+'[^。●▼■]{0,40}([0-9]+(?:\\.[0-9]+)?)\\s*[％%][^。●▼■]{0,20}(上昇|増加)','g'),'+'],
        [new RegExp(k+'[^。●▼■]{0,40}([0-9]+(?:\\.[0-9]+)?)\\s*[％%][^。●▼■]{0,20}(低下|減少|軽減)','g'),'-']
      ];
      patterns.forEach(([re,sign])=>{
        while((m=re.exec(seg))){
          const raw=m[0];
          if(isGenericParamFalseHit(key,raw,seg))continue;
          const max=maxPercentInText(seg);
          const val=(max!==null&&/最大/.test(seg)&&/(に応じて|につき|ずつ)/.test(seg))?max:m[1];
          if(!effects.slice(segmentEffectStart).some(e=>e.sourceLabel===source&&e.key===key&&e.sign===sign&&Number(e.value)===Number(val)))addParameterNumericEffect(effects,{timing,key,val,sign,source,context:effectiveContext,raw:seg});
        }
      });
    });
    appendMultiplierMaxEffectsFromSegment(effects,segmentEffectStart,seg,source,effectiveContext);
    let m;
    if((m=seg.match(/通常攻撃の対象部隊数\s*[+＋]([0-9]+(?:\.[0-9]+)?)/)))addEffect(effects,{timing,key:'通常攻撃対象数',value:Number(m[1]),unit:'',sign:'+',sourceLabel:source,condition:cleanConditionText(effectiveContext),rawText:seg,isConditional:!!effectiveContext});
    if((m=seg.match(/戦法ゲージ[^。●▼■]{0,40}([0-9]+(?:\.[0-9]+)?)\s*[％%][^。●▼■]{0,20}(上昇|増加)/))){
      const max=maxPercentInText(seg);
      addParameterNumericEffect(effects,{timing,key:'戦法ゲージ',val:(max!==null?max:m[1]),sign:'+',source,context:effectiveContext,raw:seg});
    }
    if(/付与|解除|奪取|無効|不退|不滅|全兵科有利|強化反転|弱化反射|避ける/.test(seg)){
      const names=[];
      (state.statusEffects||[]).forEach(se=>{const n=norm(se?.name||'');if(n&&seg.includes(n))names.push(n);});
      if(names.length)names.forEach(n=>specials.push({timing,timingLabel:timingLabel(timing),type:statusEffectTypeOf(n)||'状態変化',name:n,sourceLabel:source,condition:cleanConditionText(effectiveContext),rawText:seg}));
      else if(/全兵科有利|避ける|無効|不退|不滅/.test(seg))specials.push({timing,timingLabel:timingLabel(timing),type:'特殊効果',name:seg.slice(0,60),sourceLabel:source,condition:cleanConditionText(effectiveContext),rawText:seg});
    }
  });
  appendRangeThresholdEffectsFromRecordText(record,effects);
  return {effects,specials};
}
function dedupeParameterEffects(effects){const grouped=new Map();const removed=[],kept=[];(effects||[]).forEach(e=>{const rawKey=norm(e.rawText||'').replace(/\s+/g,'');const key=[e.timing,e.group,e.key,e.value,e.unit,e.sign,rawKey].join('|');if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(e);});grouped.forEach(items=>{items.sort((a,b)=>{const ag=/^技能$|^所有技能|の技能$/.test(norm(a.sourceLabel||''))?1:0;const bg=/^技能$|^所有技能|の技能$/.test(norm(b.sourceLabel||''))?1:0;return ag-bg;});items.forEach((e,i)=>{if(i===0)kept.push(e);else removed.push(e);});});return {kept,removed};}
function effectSignedValue(e){return Number(e.value||0)*(e.sign==='-'?-1:1);}
function parameterSourceRangeBase(label){let s=norm(label||'');if(/^技能:/.test(s)){const lv='(?:'+ROMAN_LEVELS.map(escRe).join('|')+')';s=s.replace(new RegExp(lv+'$'),'');}return s||'不明';}

// FIX[HADO-2.7.3.61-TACTIC-GAUGE-CAP-50]: 戦法ゲージの状態変化率は合算後の正方向最大値を50%で頭打ちにする。
// 計算根拠は残し、表示値・サマリー値だけを上限適用後の値にする。
function getParameterSummaryCap(key,entry){
  const k=norm(key||'');
  const unit=getParameterDefaultUnit(k,entry?.unit);
  if(k==='戦法ゲージ'&&unit==='%')return {max:50,label:'戦法ゲージ上限50%'};
  return null;
}
function applyParameterSummaryCapToEntry(key,entry){
  if(!entry)return entry;
  const cap=getParameterSummaryCap(key,entry);
  if(!cap||!Number.isFinite(cap.max))return entry;
  const originalMin=Number(entry.minTotal||0);
  const originalMax=Number(entry.maxTotal??entry.total??0);
  const nextMin=originalMin>cap.max?cap.max:originalMin;
  const nextMax=originalMax>cap.max?cap.max:originalMax;
  if(nextMin!==originalMin||nextMax!==originalMax){
    entry.capApplied=true;
    entry.capMax=cap.max;
    entry.capLabel=cap.label;
    entry.uncappedMinTotal=originalMin;
    entry.uncappedMaxTotal=originalMax;
    entry.minTotal=nextMin;
    entry.maxTotal=nextMax;
    entry.total=nextMax;
    entry.isRange=entry.minTotal!==entry.maxTotal;
  }
  return entry;
}
function formationParameterCapNoteText(entry){
  if(!entry||!entry.capApplied)return '';
  const unit=entry.unit===undefined?'%':(entry.unit||'');
  const before=Number(entry.uncappedMaxTotal??entry.uncappedTotal??entry.total??0);
  const after=Number(entry.maxTotal??entry.total??0);
  return `${entry.capLabel||'上限適用'}：${formationCalcTotalText(before,unit)} → ${formationCalcTotalText(after,unit)}`;
}
function summarizeEffects(effects){
  const out={};
  const mixed=new Set();
  const signGroups=new Map();
  (effects||[]).forEach(e=>{const base=[e.timing||'normal',e.group||'special',e.key].join('|');if(!signGroups.has(base))signGroups.set(base,new Set());signGroups.get(base).add(e.sign==='-'?'-':'+');});
  signGroups.forEach((set,base)=>{if(set.has('+')&&set.has('-'))mixed.add(base);});
  (effects||[]).forEach(e=>{const t=e.timing||'normal',g=e.group||'special',k=e.key;const base=[t,g,k].join('|');const displayKey=(mixed.has(base)&&e.sign==='-')?`${k}低下`:k;if(!out[t])out[t]={};if(!out[t][g])out[t][g]={};if(!out[t][g][displayKey])out[t][g][displayKey]={unit:(e.unit===undefined?'%':e.unit),items:[],total:0,minTotal:0,maxTotal:0,minItems:[],maxItems:[],isRange:false};out[t][g][displayKey].items.push(e);});
  Object.keys(out).forEach(t=>{Object.keys(out[t]).forEach(g=>{Object.keys(out[t][g]).forEach(k=>{const entry=out[t][g][k];const bySource=new Map();entry.items.forEach(e=>{const base=parameterSourceRangeBase(e.sourceLabel);if(!bySource.has(base))bySource.set(base,[]);bySource.get(base).push(e);});let minTotal=0,maxTotal=0,minItems=[],maxItems=[];bySource.forEach(items=>{items.sort((a,b)=>Math.abs(effectSignedValue(a))-Math.abs(effectSignedValue(b)));const min=items[0],max=items[items.length-1];minTotal+=effectSignedValue(min);maxTotal+=effectSignedValue(max);minItems.push(min);maxItems.push(max);});entry.minTotal=minTotal;entry.maxTotal=maxTotal;entry.total=maxTotal;entry.minItems=minItems;entry.maxItems=maxItems;entry.isRange=minTotal!==maxTotal;applyParameterSummaryCapToEntry(k,entry);});});});
  return out;
}

function summarizeSpecials(specials){const out={};(specials||[]).forEach(s=>{const t=s.timing||'normal',type=s.type||'特殊効果';if(!out[t])out[t]={};if(!out[t][type])out[t][type]=[];if(!out[t][type].some(x=>x.name===s.name))out[t][type].push(s);});return out;}
function buildParameterDebugText(item,sources,effectsRaw,effects,removed,specials,summary,specialSummary){const lines=[];lines.push(`[detail-tabs] item="${getItemDisplayName(item)}" category=${detailCategory(item)} activeTab=${state.detailActiveTab||'parameter'}`);const include=sources.filter(s=>s.kind==='include'),exclude=sources.filter(s=>s.kind==='exclude');lines.push(`[parameter-source] includeSections=${include.map(s=>s.source).join(',')||'none'}`);lines.push(`[parameter-source] excludeSections=${exclude.map(s=>s.source).join(',')||'none'}`);lines.push(`[parameter-source] sourceTextCount=${include.length}`);include.slice(0,30).forEach((s,i)=>lines.push(`[parameter-source-text:${i+1}] source="${s.source}" text="${s.text.slice(0,120)}"`));lines.push(`[parameter-effect-count] beforeDedupe=${effectsRaw.length} afterDedupe=${effects.length} removed=${removed.length} specials=${specials.length}`);effects.slice(0,80).forEach((e,i)=>lines.push(`[parameter-effect:${i+1}] timing=${e.timingLabel} group=${e.group} key=${e.key} value=${e.sign}${e.value}${e.unit} source="${e.sourceLabel}" condition="${e.condition||''}" raw="${e.rawText.slice(0,120)}"`));lines.push(`[parameter-dedupe] before=${effectsRaw.length} after=${effects.length} removed=${removed.length}`);removed.slice(0,20).forEach((e,i)=>lines.push(`[parameter-dedupe:removed:${i+1}] key=${e.key} value=${e.sign}${e.value}${e.unit} source="${e.sourceLabel}" reason=sameEffectKey`));['tactic','deploy','normal','defense'].forEach(t=>{const groups=summary[t]||{};Object.keys(groups).forEach(g=>{Object.keys(groups[g]).forEach(k=>{const v=groups[g][k];const formula=v.items.map(x=>`${x.sign}${x.value}`).join(' + ').replace(/\+ -/g,'- ')+` = ${v.total>=0?'+':''}${v.total}${v.unit||''}`;lines.push(`[parameter-calc] timing=${timingLabel(t)} group=${g} key=${k}`);lines.push(`formula="${formula}"`);v.items.forEach(x=>lines.push(`  - source="${x.sourceLabel}" value=${x.sign}${x.value}${x.unit} condition="${x.condition||''}" raw="${x.rawText.slice(0,120)}"`));});});});['tactic','deploy','normal','defense'].forEach(t=>{const sp=specialSummary[t]||{};Object.keys(sp).forEach(type=>lines.push(`[parameter-special] timing=${timingLabel(t)} type=${type} items=${sp[type].map(x=>x.name).join('/')}`));});const counts=['tactic','deploy','normal','defense'].map(t=>`${timingLabel(t)}=${effects.filter(e=>e.timing===t).length+specials.filter(e=>e.timing===t).length}`).join(' ');lines.push(`[parameter-timing-summary] ${counts}`);return lines.join('\n');}
function buildParameterSummaryData(item){const sources=collectParameterSourceRecords(item);const include=sources.filter(s=>s.kind==='include');let effectsRaw=[],specials=[];include.forEach(src=>{const parsed=parseParameterEffectsFromRecord(src);effectsRaw.push(...parsed.effects);specials.push(...parsed.specials);});const dd=dedupeParameterEffects(effectsRaw);const effects=dd.kept,removed=dd.removed;const summary=summarizeEffects(effects),specialSummary=summarizeSpecials(specials);const debugText=buildParameterDebugText(item,sources,effectsRaw,effects,removed,specials,summary,specialSummary);state.diagnostics.parameterSummary={item:getItemDisplayName(item),category:detailCategory(item),effectCount:effects.length,specialCount:specials.length,debugText};return {summary,specialSummary,debugText,effects,specials,sources,removed};}
function parameterDisplaySourceLabel(label){let s=norm(label||'');s=s.replace(/^table\d+:/,'技能:');s=s.replace(/^追加効果:\d+$/,'追加効果');s=s.replace(/.*の技能$/,'技能');s=s.replace(/^所有技能:/,'技能:');if(/^技能:/.test(s))s=s.replace(/^技能:/,'');if(s==='所有技能')s='技能';return s||'不明';}
function isParameterDetailInitiallyOpen(){return !(window.matchMedia&&window.matchMedia('(max-width: 980px)').matches);}
function renderParameterSummaryTab(item){const data=buildParameterSummaryData(item);const order=['tactic','deploy','normal','defense'];const blocks=[];function sourceInlineText(x,omitCondition=false){const label=parameterDisplaySourceLabel(x.sourceLabel);const val=(x.sign&&x.value!==undefined)?`${x.sign}${x.value}${x.unit||''}`:'';const cond=(!omitCondition&&x.condition)?` ${x.condition}`:'';return `${esc(label)}${val?` ${esc(val)}`:''}${cond?`（${esc(cond.trim())}）`:''}`;}function fmt(v,unit){return `${v>=0?'+':''}${v}${unit||''}`;}function starCond(items){const hit=(items||[]).find(x=>/^将星\d+$/.test(norm(x.condition||'')));return hit?norm(hit.condition):'';}function detailBodyHtml(v,keyName){const unit=v.unit||'';if(v.isRange){const isStarDependency=norm(keyName).includes('将星依存');const minStar=starCond(v.minItems);const maxStar=starCond(v.maxItems);const minDetail=v.minItems.map(x=>sourceInlineText(x,isStarDependency)).filter(Boolean).join(' / ');const maxDetail=v.maxItems.map(x=>sourceInlineText(x,isStarDependency)).filter(Boolean).join(' / ');const minLabel=isStarDependency&&minStar?`最小(${esc(minStar)})`:'最小';const maxLabel=isStarDependency&&maxStar?`最大(${esc(maxStar)})`:'最大';return `<div class="parameter-detail-expanded"><div>${minLabel}: ${esc(fmt(v.minTotal,unit))}${minDetail?` [${minDetail}]`:''}</div><div>${maxLabel}: ${esc(fmt(v.maxTotal,unit))}${maxDetail?` [${maxDetail}]`:''}</div></div>`;}const detail=(v.maxItems&&v.maxItems.length?v.maxItems:v.items||[]).map(sourceInlineText).filter(Boolean).join(' / ');return detail?`<div class="parameter-detail-expanded"><div>[${detail}]</div></div>`:'';}function detailDisclosureHtml(detail){return detail?`<details class="parameter-detail-disclosure" ${isParameterDetailInitiallyOpen()?'open':''}><summary>詳細</summary>${detail}</details>`:'';}order.forEach(t=>{const groups=data.summary[t]||{};const rows=[];const orderedGroups=[...PARAM_DISPLAY_GROUP_ORDER,...Object.keys(groups).filter(g=>!PARAM_DISPLAY_GROUP_ORDER.includes(g))];orderedGroups.forEach(g=>{const entries=groups[g]||{};Object.keys(entries).sort((a,b)=>a.localeCompare(b,'ja')).forEach(k=>{const v=entries[k];if(Number(v.maxTotal||v.total)===0&&Number(v.minTotal||0)===0&&!((v.items||[]).some(x=>x.forceDisplay)))return;const val=v.isRange?`${fmt(v.minTotal,v.unit)} ～ ${fmt(v.maxTotal,v.unit)}`:fmt(v.maxTotal??v.total,v.unit);const detail=detailBodyHtml(v,k);rows.push(`<div class="parameter-row"><div class="parameter-main"><span class="parameter-key">${esc(parameterSummaryDisplayName(k,v))}</span><span class="parameter-value-inline">${esc(val)}</span>${detailDisclosureHtml(detail)}</div></div>`);});});if(rows.length)blocks.push(`<details class="search-param-details" open><summary><span>${esc(timingLabel(t))}</span><span class="note">${rows.length}件</span></summary><div class="parameter-block"><div class="parameter-block-title">${esc(timingLabel(t))}</div><div class="parameter-block-body">${rows.join('')}</div></div></details>`);});const tacticAttackSummaryHtml=(detailCategory(item)==='generals'||detailCategory(item)==='tactics')?renderTacticAttackSummaryBlock(item):'';const statusSummaryHtml=`<details class="search-param-details status-effect-rate-summary-details" open><summary><span>状態変化率サマリー</span><span class="note">${blocks.length}区分</span></summary>${blocks.length?blocks.join(''):'<div class="parameter-empty">抽出できる状態変化率はありません。</div>'}</details>`;return `${renderEquipmentStageStatusHtml(item)}<div class="parameter-summary">${tacticAttackSummaryHtml}${statusSummaryHtml}</div>`;}

function cloneSection(sec){return {title:norm(sec?.title||''),content:Array.isArray(sec?.content)?sec.content.map(v=>norm(v)).filter(Boolean):[]};}
function isSkillStopTitle(t){t=norm(t);return /の能力・五行適正|の参軍性能|と相性の良い武将|の兵科|の入手方法|列伝|おすすめ編制/.test(t);}
function extractTacticEntry(item,generalName){const sections=Array.isArray(item?.sections)?item.sections:[];const start=sections.findIndex(sec=>/の戦法$/.test(norm(sec?.title||'')));if(start<0)return null;const sourceTables=normalizeHadouTables(item?.tables);const tacticTable=sourceTables.find(table=>Array.isArray(table)&&Array.isArray(table[0])&&norm(table[0][0]||'')==='兵科'&&norm(table[0][1]||'')==='効果系統')||null;const additionalTable=sourceTables.find(table=>Array.isArray(table)&&Array.isArray(table[0])&&norm(table[0][0]||'')==='追加効果'&&norm(table[0][1]||'')==='対象範囲')||null;for(let i=start+1;i<sections.length;i++){const section=cloneSection(sections[i]);if(!section.title)continue;if(/の技能$/.test(section.title)||isSkillStopTitle(section.title))break;const tacticTables=[tacticTable,additionalTable].filter(Boolean);return {name:section.title,title:'',description:'',url:norm(item?.url||''),category:'tactics',keyValues:[],tables:tacticTables,sections:[section],sourceDataset:'tactics',sourceName:generalName,sourceNames:[generalName],searchTokens:uniq([generalName,section.title]),raw:{name:section.title,sourceGeneral:generalName,sourceUrl:norm(item?.url||''),tables:tacticTables,sections:[section]}};}return null;}
function extractSkillEntries(item,generalName){const sections=Array.isArray(item?.sections)?item.sections:[];const start=sections.findIndex(sec=>/の技能$/.test(norm(sec?.title||'')));if(start<0)return [];const results=[];for(let i=start+1;i<sections.length;i++){const section=cloneSection(sections[i]);if(!section.title)continue;if(isSkillStopTitle(section.title))break;if(/の戦法$|の技能$/.test(section.title))continue;results.push({name:section.title,title:'',description:'',url:norm(item?.url||''),category:'skills',keyValues:[],tables:[],sections:[section],sourceDataset:'skills',sourceName:generalName,sourceNames:[generalName],searchTokens:uniq([generalName,section.title]),raw:{name:section.title,sourceGeneral:generalName,sourceUrl:norm(item?.url||''),sections:[section]}});}return results;}
function isAdvisorSkillStopTitle(t){t=norm(t);return /^(初期能力|最大能力)$/.test(t)||/と相性の良い武将|の入手方法|の兵科|列伝|演義|正史|おすすめ編制/.test(t);}
function extractAdvisorSkillEntries(item,generalName){const sections=Array.isArray(item?.sections)?item.sections:[];const start=sections.findIndex(sec=>norm(sec?.title||'')==='参軍技能');if(start<0)return [];const results=[];for(let i=start+1;i<sections.length;i++){const section=cloneSection(sections[i]);const title=norm(section?.title||'');if(!title)continue;if(isAdvisorSkillStopTitle(title))break;if(title==='参軍技能'||/の参軍性能$/.test(title))continue;results.push({name:title,title:'',description:'',url:norm(item?.url||''),category:'skills',keyValues:[],tables:[],sections:[section],sourceDataset:'skills',sourceName:generalName,sourceNames:[generalName],searchTokens:uniq([generalName,title,'参軍技能']),raw:{name:title,sourceGeneral:generalName,sourceSkillType:'参軍技能',sourceUrl:norm(item?.url||''),sections:[section]}});}return results;}
function getAdvisorSkillEntriesForGeneralItem(item){return extractAdvisorSkillEntries(item,getItemDisplayName(item)||pickNameFromTitle(norm(item?.title||''),'generals')).filter(v=>!!v?.name);}
function getActiveAdvisorSkillEntriesForGeneralItem(item,advisorLevel){const level=Number(normalizeAdvisorLevelValue(advisorLevel)||0);const entries=getAdvisorSkillEntriesForGeneralItem(item);const limit=level>=10?2:(level>=5?1:0);return entries.slice(0,limit);}
function buildAdvisorLevelDiagnosticForGeneral(item){const name=getItemDisplayName(item)||norm(item?.name||item?.title||'');const level=getEffectiveGeneralAdvisorLevel(name);const entries=getAdvisorSkillEntriesForGeneralItem(item);const active=getActiveAdvisorSkillEntriesForGeneralItem(item,level);return {general:name,advisorLevel:advisorLevelLabel(level),advisorLevelSource:effectiveAdvisorLevelSourceLabel(),advisorSkillCount:entries.length,advisorSkills:entries.map((e,idx)=>({order:idx+1,name:e.name,unlockLevel:idx===0?5:idx===1?10:null,active:active.some(a=>norm(a.name)===norm(e.name))})),activeAdvisorSkills:active.map(e=>e.name),policy:'全データ表示では武将初期=参軍Lvなし、武将最大=参軍Lv10。保存データ表示では保存データの参軍Lvを使用。Lv5で1つ目、Lv10で2つ目の参軍技能が有効。'};}
function buildAdvisorSkillDatasetDiagnostic(){const rows=(state.generals||[]).map(item=>buildAdvisorLevelDiagnosticForGeneral(item)).filter(d=>d.advisorSkillCount>0);const levelBuckets={none:0,lv0_4:0,lv5_9:0,lv10:0};(state.generals||[]).forEach(item=>{const effectiveLevel=getEffectiveGeneralAdvisorLevel(getItemDisplayName(item));const level=Number(effectiveLevel||0);if(!effectiveLevel)levelBuckets.none++;else if(level<5)levelBuckets.lv0_4++;else if(level<10)levelBuckets.lv5_9++;else levelBuckets.lv10++;});const result={timestamp:debugTimestamp(),generalWithAdvisorSkillCount:rows.length,totalAdvisorSkillRefs:rows.reduce((sum,d)=>sum+d.advisorSkillCount,0),levelBuckets,samples:rows.slice(0,20)};state.diagnostics.advisorSkills=result;debugLog('advisorSkill:diagnostic',result);return result;}

function advisorSlotSpecByKey(key){return ADVISOR_SLOT_SPECS.find(s=>s.key===norm(key))||null;}
function advisorSlotLabel(key){return advisorSlotSpecByKey(key)?.label||norm(key)||'参軍';}
function advisorSlotKeyFromAbilityLabel(label){const l=norm(label);return ({'統率':'leadership','武力':'war','知力':'intelligence','政治':'politics','魅力':'charm'})[l]||'';}
function extractAdvisorSlotKeysForGeneralItem(item){
  const out=new Set();
  const advisorSections=(Array.isArray(item?.sections)?item.sections:[]).filter(sec=>/参軍性能|初期能力|最大能力/.test(norm(sec?.title||''))||((sec?.content||[]).join(' ').includes('位 /')));
  advisorSections.forEach(sec=>{(sec.content||[]).forEach(line=>{String(line||'').replace(/(統率|武力|知力|政治|魅力)\s*\d+/g,(m,label)=>{const key=advisorSlotKeyFromAbilityLabel(label);if(key)out.add(key);return m;});});});
  const allText=advisorSections.map(sec=>[sec.title,...(sec.content||[])].join(' ')).join(' ');
  ['統率','武力','知力','政治','魅力'].forEach(label=>{if(new RegExp(label+'\\s*[0-9]').test(allText)){const key=advisorSlotKeyFromAbilityLabel(label);if(key)out.add(key);}});
  if(!out.size&&getAdvisorSkillEntriesForGeneralItem(item).length)ADVISOR_SLOT_SPECS.forEach(s=>out.add(s.key));
  return [...out];
}
function advisorGeneralCanUseSlot(item,advisorKey){const key=norm(advisorKey);if(!key)return false;const slots=extractAdvisorSlotKeysForGeneralItem(item);return slots.includes(key);}
function getAdvisorSkillLevelMapFromSummary(item){
  const map=new Map();
  const sec=(Array.isArray(item?.sections)?item.sections:[]).find(s=>norm(s?.title||'')==='参軍技能');
  const text=(sec?.content||[]).join(' ');
  if(!text)return map;
  for(const entry of getAdvisorSkillEntriesForGeneralItem(item)){
    const name=norm(entry.name);if(!name)continue;
    const m=text.match(new RegExp(escRe(name)+'\\s*([0-9]+|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])'));
    if(m){let lv=ROMAN_LEVELS.includes(m[1])?ROMAN_LEVELS.indexOf(m[1])+1:Number(m[1]);if(Number.isFinite(lv)&&lv>0)map.set(name,Math.max(1,Math.min(10,Math.floor(lv))));}
  }
  return map;
}
function extractAdvisorSkillLevelText(entry,levelNumber){
  const roman=ROMAN_LEVELS[Math.max(1,Math.min(10,Number(levelNumber)||1))-1]||'Ⅰ';
  const text=(entry?.sections||[]).map(sec=>(sec.content||[]).join(' ')).join(' ');
  if(!text)return '';
  const re=new RegExp(escRe(roman)+'(.*?)(?=[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ](?:■|-)|$)');
  const m=text.match(re);
  return norm(m?m[1]:text);
}
function getActiveAdvisorSkillRecordsForGeneralItem(item){
  const generalName=getItemDisplayName(item)||norm(item?.name||item?.title||'');
  const advisorLevel=Number(getEffectiveGeneralAdvisorLevel(generalName)||0);
  const entries=getAdvisorSkillEntriesForGeneralItem(item);
  const limit=advisorLevel>=10?2:(advisorLevel>=5?1:0);
  const lvMap=getAdvisorSkillLevelMapFromSummary(item);
  return entries.slice(0,limit).map((entry,idx)=>{const skillName=norm(entry.name);const lv=lvMap.get(skillName)||1;const roman=ROMAN_LEVELS[lv-1]||'Ⅰ';return {entry,skillName,levelNumber:lv,levelRoman:roman,unlockLevel:idx===0?5:10,text:extractAdvisorSkillLevelText(entry,lv)||((entry.sections||[]).map(sec=>(sec.content||[]).join(' ')).join(' '))};});
}
function advisorSkillConditionText(text){return norm(String(text||'').replace(/■?\s*参軍で、?/g,'■').replace(/■?\s*参軍の際/g,'■').replace(/参軍の際/g,'').replace(/参軍で、?/g,''));}
function collectFormationAdvisorRecords(f){
  const out=[];const slots=sanitizeFormationAdvisorSlots(f?.advisorSlots||{});
  ADVISOR_SLOT_SPECS.forEach(spec=>{const name=normalizeSaveItemName(slots[spec.key]||'');const item=findItemByDisplayName('generals',name);if(!item)return;const skills=getActiveAdvisorSkillRecordsForGeneralItem(item);out.push({advisorKey:spec.key,advisorLabel:spec.label,generalName:name,item,advisorLevel:advisorLevelLabel(getEffectiveGeneralAdvisorLevel(name)),skills});});
  return out;
}
function buildFormationAdvisorDebugSummary(f){
  const slots=sanitizeFormationAdvisorSlots(f?.advisorSlots||{});
  return ADVISOR_SLOT_SPECS.map(spec=>{
    const name=normalizeSaveItemName(slots[spec.key]||'');
    const item=findItemByDisplayName('generals',name);
    const allSkills=item?getAdvisorSkillEntriesForGeneralItem(item):[];
    const activeSkills=item?getActiveAdvisorSkillRecordsForGeneralItem(item):[];
    const level=name?getEffectiveGeneralAdvisorLevel(name):'';
    const canUse=item?advisorGeneralCanUseSlot(item,spec.key):false;
    const status=!name?'empty':(!canUse?'slot-not-allowed':(!activeSkills.length?'locked':'active'));
    return {slotKey:spec.key,slotLabel:spec.label,general:name,advisorLevel:advisorLevelLabel(level),canUseSlot:canUse,skillCount:allSkills.length,activeSkillCount:activeSkills.length,activeSkills:activeSkills.map(s=>`${s.skillName}${s.levelRoman}`),status};
  });
}
function renderFormationAdvisorSlotsHtml(f){
  const slots=sanitizeFormationAdvisorSlots(f?.advisorSlots||{});
  return `<div class="formation-advisor-row">${ADVISOR_SLOT_SPECS.map(spec=>{
    const name=normalizeSaveItemName(slots[spec.key]||'');
    const item=findItemByDisplayName('generals',name);
    const skills=item?getActiveAdvisorSkillRecordsForGeneralItem(item):[];
    const lv=name?advisorLevelLabel(getEffectiveGeneralAdvisorLevel(name)):'';
    const skillText=!name?'':(skills.length?skills.map(s=>`${s.skillName}${s.levelRoman}`).join(' / '):`Lv${esc(lv)}未解放`);
    const stateClass=!name?'':(skills.length?'has-advisor has-active-advisor':'has-advisor has-locked-advisor');
    const title=name?`参軍:${spec.label} / ${formationDisplayNameNoReading('generals',name)} / 参軍Lv:${lv} / ${skillText}`:`参軍:${spec.label} / 未設定`;
    return `<button type="button" class="formation-advisor-cell ${stateClass}" data-formation-selector-open="advisor" data-equip-key="${esc(spec.key)}" title="${esc(title)}"><span class="formation-advisor-label">${esc(spec.label)}</span><span class="formation-advisor-name">${name?esc(formationDisplayNameNoReading('generals',name)):'未設'}</span><span class="formation-advisor-skills">${esc(skillText)}</span></button>`;
  }).join('')}</div>`;
}
function applyActiveAdvisorSkills(f,ctx,skillRows,effectsRaw,specials,contributionLog,excludedLog){
  const adopted=[];
  collectFormationAdvisorRecords(f).forEach(advisor=>{
    advisor.skills.forEach(skill=>{
      const rec={kind:'include',source:`技能:${skill.skillName}${skill.levelRoman}`,text:skill.text,formationSkillName:skill.skillName,formationSourceCategory:'参軍',isAdvisorSkill:true};
      if(!skillRows.has(skill.skillName))skillRows.set(skill.skillName,{name:skill.skillName,holders:new Set(),levels:[],category:'advisor',sourceCategories:new Set()});
      const row=skillRows.get(skill.skillName);row.holders.add(`参軍:${advisor.advisorLabel} ${advisor.generalName}`);row.levels.push(skill.levelNumber);row.sourceCategories.add('参軍');
      contributionLog.push({holder:`参軍:${advisor.advisorLabel} ${advisor.generalName}`,slot:`advisor:${advisor.advisorKey}`,skillName:skill.skillName,level:skill.levelNumber,source:rec.source,sourceType:'advisor',adoptedBlocks:['参軍Lv条件達成']});
      const activeRec={...rec,text:advisorSkillConditionText(skill.text)};
      const parsed=ensureRangeThresholdEffectsFromActiveRecord(activeRec,parseParameterEffectsFromRecord(activeRec));
      parsed.effects.forEach(e=>{
        if(!isFormationNumericParameterEffect(e)){excludedLog.push({holder:advisor.generalName,slot:`advisor:${advisor.advisorKey}`,skillName:skill.skillName,source:e.sourceLabel||rec.source,parameter:e.key||'',reason:'non-numeric advisor effect excluded'});return;}
        const effectEval=evaluateFormationConditionText([advisorSkillConditionText(sanitizeFormationEffectConditionText(e.rawText)),advisorSkillConditionText(e.condition)].filter(Boolean).join(' '),{holder:`参軍:${advisor.advisorLabel} ${advisor.generalName}`,holderName:advisor.generalName,holderSlot:`advisor:${advisor.advisorKey}`,sourceType:'advisor'},ctx,{excludeCombat:false,ignoreBattleMode:false,ignoreBattleHp:true});
        if(!effectEval.satisfied){excludedLog.push({holder:advisor.generalName,slot:`advisor:${advisor.advisorKey}`,skillName:skill.skillName,source:e.sourceLabel||rec.source,parameter:e.key,reason:effectEval.reason,conditions:effectEval.conditions});return;}
        effectsRaw.push({...e,sourceLabel:`参軍:${advisor.advisorLabel}:${advisor.generalName}:${e.sourceLabel||rec.source}`,sourceItemCategory:'generals',sourceItemName:advisor.generalName,sourceSlotKey:`advisor:${advisor.advisorKey}`,sourcePosition:'参軍'});
      });
      parsed.specials.forEach(sp=>specials.push({...sp,sourceLabel:`参軍:${advisor.advisorLabel}:${advisor.generalName}:${sp.sourceLabel||rec.source}`}));
      adopted.push({slot:advisor.advisorKey,label:advisor.advisorLabel,general:advisor.generalName,skill:skill.skillName,level:skill.levelRoman});
    });
  });
  debugLog('formation:advisor-skills',{formationId:f?.id||'',adopted});
  return adopted;
}

function extractEquipmentSkillEntries(item,equipmentName){const tables=Array.isArray(item?.tables)?item.tables:[];const skillTables=tables.filter((table,idx)=>idx>1&&isEquipmentSkillTable(table));const stageBlocks=getEquipmentSkillStageBlocks(item,skillTables);const entries=[];stageBlocks.forEach(block=>{(Array.isArray(block.table)?block.table:[]).forEach(row=>{if(!Array.isArray(row)||row.length<2)return;const skillName=norm(row[0]||'');const skillBody=norm(row.slice(1).join(' '));if(!skillName||!skillBody)return;if(/^(最高レア|種類|兵科|レア|統率|武力|知力|政治|魅力|武将|特徴|装備品の入手方法|探索の進め方)$/.test(skillName))return;const section={title:block.title||skillName,content:[`装備：${equipmentName}`,skillBody]};entries.push({name:skillName,title:'',description:'',url:norm(item?.url||''),category:'skills',keyValues:[],tables:[],sections:[section],sourceDataset:'skills',sourceName:equipmentName,sourceNames:[equipmentName],searchTokens:uniq([equipmentName,skillName,block.title]),raw:{name:skillName,sourceEquipment:equipmentName,sourceUrl:norm(item?.url||''),equipmentSkillStage:block.title||'',equipmentSkillSourceIndex:block.sourceIndex,sections:[section]}});});});debugLog('skillBuild:equipment-skill-stage-extract',{equipment:equipmentName,highestRare:findFirstTableValue(item,'最高レア'),skillTableCount:skillTables.length,stageCount:stageBlocks.length,entryCount:entries.length,stageTitles:stageBlocks.map(b=>b.title)});return entries;}
function mergeEntriesByName(entries){const map=new Map();entries.forEach(entry=>{const key=norm(entry?.name||'');if(!key)return;if(!map.has(key)){const initial={...entry,sourceNames:uniq(entry.sourceNames||[entry.sourceName]),searchTokens:uniq(entry.searchTokens||[])};if(Array.isArray(initial.sections))initial.sections=initial.sections.map(sec=>cloneSection(sec));if(initial.raw&&Array.isArray(initial.raw.sections))initial.raw={...initial.raw,sections:initial.raw.sections.map(sec=>cloneSection(sec))};map.set(key,initial);return;}const cur=map.get(key);cur.sourceNames=uniq([...(cur.sourceNames||[]),...(entry.sourceNames||[entry.sourceName])]);cur.searchTokens=uniq([...(cur.searchTokens||[]),...(entry.searchTokens||[])]);if(Array.isArray(entry.sections)&&entry.sections.length){const existing=new Set((Array.isArray(cur.sections)?cur.sections:[]).map(sec=>`${norm(sec?.title||'')}|${JSON.stringify(sec?.content||[])}`));const add=entry.sections.filter(sec=>!existing.has(`${norm(sec?.title||'')}|${JSON.stringify(sec?.content||[])}`)).map(sec=>cloneSection(sec));cur.sections=[...(Array.isArray(cur.sections)?cur.sections:[]),...add];}if(entry.raw&&Array.isArray(entry.raw.sections)&&entry.raw.sections.length){const curRaw=cur.raw&&typeof cur.raw==='object'?cur.raw:{};const existingRaw=new Set((Array.isArray(curRaw.sections)?curRaw.sections:[]).map(sec=>`${norm(sec?.title||'')}|${JSON.stringify(sec?.content||[])}`));const addRaw=entry.raw.sections.filter(sec=>!existingRaw.has(`${norm(sec?.title||'')}|${JSON.stringify(sec?.content||[])}`)).map(sec=>cloneSection(sec));cur.raw={...curRaw,...(!norm(curRaw?.sourceGeneral||'')&&norm(entry?.raw?.sourceGeneral||'')?entry.raw:{}),sections:[...(Array.isArray(curRaw.sections)?curRaw.sections:[]),...addRaw]};}else if(!norm(cur?.raw?.sourceGeneral||'')&&norm(entry?.raw?.sourceGeneral||'')){cur.raw={...(cur.raw||{}),...entry.raw};}});return [...map.values()];}
function buildDerivedTacticDataset(generalRaw){const entries=(Array.isArray(generalRaw)?generalRaw:[]).filter(item=>shouldIncludeItem('generals',item)).map(item=>extractTacticEntry(item,pickNameFromTitle(norm(item?.title||''),'generals'))).filter(v=>!!v?.name);return mergeEntriesByName(entries);} 
function isSupplementalSkillPage(item){const title=norm(item?.title||'');if(!title)return false;const cleaned=title.replace(/^【[^】]+】\s*/,'').trim();return /.+?の効果と所持武将・強化する装備品/.test(cleaned);}
function extractNamesFromTextLines(lines,ignorePatterns=[]){const results=[];(Array.isArray(lines)?lines:[]).forEach(line=>{const text=norm(line);if(!text)return;if(ignorePatterns.some(re=>re.test(text)))return;text.split(/[、,，\/]/).map(v=>norm(v)).filter(Boolean).forEach(name=>{if(ignorePatterns.some(re=>re.test(name)))return;results.push(name);});});return uniq(results);}
function extractSupplementalSkillName(item){if(!isSupplementalSkillPage(item))return '';const cleaned=norm(item?.title||'').replace(/^【[^】]+】\s*/,'').trim();const m=cleaned.match(/(.+?)の効果と所持武将・強化する装備品/);return norm(m?m[1]:'');}
function buildSupplementalSkillSection(item,skillName){const levelRows=Array.isArray(item?.tables?.[0])?item.tables[0]:[];const content=levelRows.filter(row=>Array.isArray(row)&&norm(row[0]||'')&&norm(row[1]||'')&&norm(row[1]||'')!=='-').map(row=>`${norm(row[0]||'')}${norm(row[1]||'')}`);if(content.length)return {title:skillName,content};const levelSection=(Array.isArray(item?.sections)?item.sections:[]).find(sec=>norm(sec?.title||'')===`${skillName}のレベル別効果`);if(levelSection){const lines=(Array.isArray(levelSection.content)?levelSection.content:[]).map(v=>norm(v)).filter(Boolean);if(lines.length)return {title:skillName,content:lines};}return {title:skillName,content:[]};}
function extractSupplementalSkillEntry(item){if(!isSupplementalSkillPage(item))return null;const skillName=extractSupplementalSkillName(item);if(!skillName)return null;const sections=Array.isArray(item?.sections)?item.sections:[];const holderGeneralSection=sections.find(sec=>norm(sec?.title||'')===`${skillName}を持つ武将`);const holderEquipmentSection=sections.find(sec=>norm(sec?.title||'')===`${skillName}を強化する装備品`);const ignorePatterns=[/一覧はこちら/,/所持する武将はいない/,/強化できる装備品はない/,/強化できる陣形はない/];const generalNames=extractNamesFromTextLines(holderGeneralSection?.content||[],ignorePatterns);const equipmentNames=extractNamesFromTextLines(holderEquipmentSection?.content||[],ignorePatterns);const section=buildSupplementalSkillSection(item,skillName);return {name:skillName,title:'',description:'',url:norm(item?.url||''),category:'skills',keyValues:[],tables:[],sections:[section],sourceDataset:'skills',sourceNames:uniq([...generalNames,...equipmentNames]),searchTokens:uniq([skillName,...generalNames,...equipmentNames]),raw:{name:skillName,sourceUrl:norm(item?.url||''),sourceGenerals:generalNames,sourceEquipments:equipmentNames,sections:[section]}};}
function buildDerivedSkillDataset(generalRaw,equipmentRaw,skillRaw){const generalItems=(Array.isArray(generalRaw)?generalRaw:[]).filter(item=>shouldIncludeItem('generals',item));const normalGeneralEntries=generalItems.flatMap(item=>extractSkillEntries(item,pickNameFromTitle(norm(item?.title||''),'generals'))).filter(v=>!!v?.name);const advisorGeneralEntries=generalItems.flatMap(item=>extractAdvisorSkillEntries(item,pickNameFromTitle(norm(item?.title||''),'generals'))).filter(v=>!!v?.name);const generalEntries=[...normalGeneralEntries,...advisorGeneralEntries];const equipmentEntries=(Array.isArray(equipmentRaw)?equipmentRaw:[]).filter(item=>shouldIncludeItem('equipments',item)).flatMap(item=>extractEquipmentSkillEntries(item,pickNameFromTitle(norm(item?.title||''),'equipments'))).filter(v=>!!v?.name);const merged=mergeEntriesByName([...generalEntries,...equipmentEntries]);const existingNames=new Set(merged.map(entry=>norm(entry?.name||'')));const supplementalPages=(Array.isArray(skillRaw)?skillRaw:[]).filter(item=>isSupplementalSkillPage(item));const supplementalEntriesAll=supplementalPages.map(item=>extractSupplementalSkillEntry(item)).filter(v=>!!v?.name);const supplementalEntries=supplementalEntriesAll.filter(v=>!existingNames.has(norm(v.name)));const mergedAll=mergeEntriesByName([...merged,...supplementalEntriesAll]).filter(entry=>!isSkillRarityNoiseName(entry?.name));const detectedBushoInSkillRaw=supplementalPages.some(item=>extractSupplementalSkillName(item)==='武聖');const derivedBusho=merged.some(entry=>norm(entry?.name||'')==='武聖');const appendedBusho=supplementalEntries.some(entry=>norm(entry?.name||'')==='武聖');const existsBusho=mergedAll.some(entry=>norm(entry?.name||'')==='武聖');const skillRawCount=Array.isArray(skillRaw)?skillRaw.length:0;updateSkillBuildDiagnosticSnapshot({generalDerivedCount:generalEntries.length,normalGeneralDerivedCount:normalGeneralEntries.length,advisorGeneralDerivedCount:advisorGeneralEntries.length,equipmentDerivedCount:equipmentEntries.length,mergedBaseCount:merged.length,skillRawPageCount:skillRawCount,supplementalPageCount:supplementalPages.length,supplementalAddedCount:supplementalEntries.length,supplementalMergedCount:supplementalEntriesAll.length,detectedBushoInSkillRaw,derivedBusho,appendedBusho,existsBusho,sampleSupplementalNames:supplementalEntries.slice(0,20).map(v=>norm(v?.name||''))});debugStartup('skill source counts',{skillRaw:skillRawCount,normalGeneralDerived:normalGeneralEntries.length,advisorGeneralDerived:advisorGeneralEntries.length,derived:merged.length,supplementalPages:supplementalPages.length,supplementalAdded:supplementalEntries.length});debugStartup('skill exists check 武聖',{skillRaw:detectedBushoInSkillRaw,derived:derivedBusho,supplemental:appendedBusho,final:existsBusho});debugStartup('advisor skill exists check',{renkan:mergedAll.some(entry=>norm(entry?.name||'')==='連環'),zouhei:mergedAll.some(entry=>norm(entry?.name||'')==='増兵'),advisorGeneralDerivedCount:advisorGeneralEntries.length});if(skillRawCount===0){debugStartup('WARNING skillRaw=0',{message:'hadou_skills.json が未読込、空配列、または古いキャッシュの可能性があります。JSONフォルダを選択して再読込してください。'});debugLog('WARNING skillRaw=0',{message:'hadou_skills.json が未読込、空配列、または古いキャッシュの可能性があります。JSONフォルダを選択して再読込してください。'});}debugLog('skillBuild summary',{generalDerivedCount:generalEntries.length,normalGeneralDerivedCount:normalGeneralEntries.length,advisorGeneralDerivedCount:advisorGeneralEntries.length,equipmentDerivedCount:equipmentEntries.length,mergedBaseCount:merged.length,skillRawPageCount:skillRawCount,supplementalPageCount:supplementalPages.length,supplementalAddedCount:supplementalEntries.length,supplementalMergedCount:supplementalEntriesAll.length,detectedBushoInSkillRaw,derivedBusho,appendedBusho,existsBusho});return mergedAll;}
function isNoiseTitle(t){t=norm(t);if(!t)return true;return /おすすめ|最強|ランキング|まとめ|比較|解説|使い方|編成|リセマラ|序盤|イベント|ガチャ|アップデート|初心者|インタビュー|ニュース|検証/.test(t);}
function pickNameFromTitle(title,datasetType){const t=norm(title);if(!t)return '';const cleaned=t.replace(/^【[^】]+】\s*/,'').trim();if(datasetType==='generals'){const m=cleaned.match(/(.+?)の戦法と技能/);return m?norm(m[1]):'';}if(datasetType==='equipments'){const m=cleaned.match(/(.+?)の能力と技能/);return m?norm(m[1]):'';}if(datasetType==='tactics'||datasetType==='skills'){const m=cleaned.match(/(.+?)の効果/)||cleaned.match(/(.+?)の性能/)||cleaned.match(/(.+?)の詳細/)||cleaned.match(/(.+?)とは/)||cleaned.match(/(.+?)について/);return m?norm(m[1]):cleaned;}return cleaned;}
function shouldIncludeItem(datasetType,item){const title=norm(item?.title||'');const name=norm(item?.name||'');if(datasetType==='siegeWeapons'||datasetType==='ethnicArmaments'||datasetType==='ethnicResearchSkills'||datasetType==='formations')return !!(name||title);if(!title||isNoiseTitle(title))return false;if(datasetType==='generals')return /の戦法と技能/.test(title);if(datasetType==='equipments')return /の能力と技能/.test(title);if(datasetType==='tactics'||datasetType==='skills')return /の戦法と技能/.test(title);return false;}
function normalizeHadouTableRows(table){if(Array.isArray(table))return table;if(table&&typeof table==='object'&&Array.isArray(table.rows))return table.rows;return [];}
function normalizeHadouTables(tables){return (Array.isArray(tables)?tables:[]).map(normalizeHadouTableRows).filter(table=>Array.isArray(table));}
function normalizeHadouRawItemTables(item){if(!item||typeof item!=='object')return item;return {...item,tables:normalizeHadouTables(item.tables)};}
function normalizeLoadedDataset(datasetType,raw){if(!Array.isArray(raw))return [];return raw.filter(item=>shouldIncludeItem(datasetType,item)).map((item,index)=>{const normalizedItem=normalizeHadouRawItemTables(item);const title=norm(normalizedItem?.title||normalizedItem?.name||'');const isHadouExtension=datasetType==='siegeWeapons'||datasetType==='ethnicArmaments';const name=(isHadouExtension?norm(normalizedItem?.name||title):pickNameFromTitle(title,datasetType))||`item-${index+1}`;const description=norm(normalizedItem?.description||'');const ethnicGroup=norm(normalizedItem?.ethnicGroup||'');const troopType=norm(normalizedItem?.troopType||'');const additionalEffect=norm(normalizedItem?.additionalEffect||'');const additionalEffectDescription=norm(normalizedItem?.additionalEffectDescription||'');const levelTokens=Array.isArray(normalizedItem?.levels)?normalizedItem.levels.map(lv=>`Lv${lv?.level||''} ${Object.values(lv||{}).join(' ')}`).join(' '):'';return {name,title,description,url:norm(normalizedItem?.url||''),category:norm(normalizedItem?.category||datasetType),ethnicGroup,troopType,additionalEffect,additionalEffectDescription,levels:Array.isArray(normalizedItem?.levels)?normalizedItem.levels:[],keyValues:Array.isArray(normalizedItem?.keyValues)?normalizedItem.keyValues:[],tables:normalizeHadouTables(normalizedItem?.tables),sections:Array.isArray(normalizedItem?.sections)?normalizedItem.sections:[],sourceDataset:datasetType,raw:normalizedItem,searchTokens:uniq([name,title,description,ethnicGroup,troopType,additionalEffect,additionalEffectDescription,levelTokens])};}).filter(v=>!!v.name);}

function mergeEthnicResearchSkillItemsByName(items){
  const map=new Map();
  (Array.isArray(items)?items:[]).forEach(item=>{
    const name=norm(item?.name||item?.title||'');
    if(!name)return;
    if(!map.has(name)){map.set(name,{...item,levels:Array.isArray(item?.levels)?[...item.levels]:[],sourceImages:Array.isArray(item?.sourceImages)?[...item.sourceImages]:[]});return;}
    const base=map.get(name);
    const levelMap=new Map((Array.isArray(base.levels)?base.levels:[]).map(lv=>[Number(lv?.level)||0,lv]));
    (Array.isArray(item?.levels)?item.levels:[]).forEach(lv=>{const key=Number(lv?.level)||0;if(!key||!levelMap.has(key))levelMap.set(key,lv);});
    base.levels=[...levelMap.values()].sort((a,b)=>(Number(a?.level)||0)-(Number(b?.level)||0));
    base.maxLevel=Math.max(Number(base.maxLevel)||0,Number(item?.maxLevel)||0,base.levels.length);
    base.sourceImages=uniq([...(Array.isArray(base.sourceImages)?base.sourceImages:[]),...(Array.isArray(item?.sourceImages)?item.sourceImages:[])].map(x=>JSON.stringify(x))).map(x=>JSON.parse(x));
    base.confidence=base.confidence==='needs_review'||item?.confidence==='needs_review'?'needs_review':(base.confidence||item?.confidence||'confirmed');
  });
  return [...map.values()];
}

function makeInferredEthnicResponseLevel5(skillText){
  return {level:5,roman:'Ⅴ',effectText:`■常に\n●技能「${skillText}」を所持している副将の連鎖確率+5%\n●技能「${skillText}」を所持していない副将の連鎖確率+2.5%`,effects:[
    {timing:'normal',key:'連鎖確率',sign:'+',value:5,unit:'%',conditionText:`技能「${skillText}」を所持している副将`,conditionType:'always',summaryTarget:'formationStatusRate'},
    {timing:'normal',key:'連鎖確率',sign:'+',value:2.5,unit:'%',conditionText:`技能「${skillText}」を所持していない副将`,conditionType:'always',summaryTarget:'formationStatusRate'}
  ],inferred:true,inferredReason:'runtime repair: LvⅠ〜Ⅳの規則性とユーザー指摘に基づきLvⅤを補完'};
}
function makeInferredNanbanFukutsuLevel5(){
  return {level:5,roman:'Ⅴ',effectText:'■常に\n▼兵力が50%以下のとき\n●部隊の防御+50%',effects:[
    {timing:'normal',key:'防御',sign:'+',value:50,unit:'%',conditionText:'兵力が50%以下のとき',conditionType:'hpBelowOrEqual50',summaryTarget:'formationStatusRate'}
  ],inferred:true,inferredReason:'runtime repair: ユーザー指摘および既存補完方針に基づきLvⅤを補完'};
}
function repairEthnicResearchSkillLevels(item){
  const name=norm(item?.name||item?.title||'');
  const responseMap={'羌呼応':'羌','鮮卑呼応':'鮮卑','烏桓呼応':'烏桓','南蛮呼応':'南蛮','五渓呼応':'五渓蛮','山越呼応':'山越'};
  const levels=Array.isArray(item?.levels)?item.levels.slice():[];
  const hasLv5=levels.some(lv=>Number(lv?.level)===5||norm(lv?.roman)==='Ⅴ');
  let repaired=false;
  if(responseMap[name]&&!hasLv5){levels.push(makeInferredEthnicResponseLevel5(responseMap[name]));repaired=true;}
  if(name==='南蛮不屈'&&!hasLv5){levels.push(makeInferredNanbanFukutsuLevel5());repaired=true;}
  if(repaired){
    levels.sort((a,b)=>(Number(a?.level)||0)-(Number(b?.level)||0));
    item={...item,levels,maxLevel:Math.max(5,Number(item?.maxLevel)||0),needsReview:true,reviewNote:'LvⅤ was repaired at runtime because source JSON had maxLevel 4.'};
    debugLog('ethnicResearchSkill:runtime-level5-repair',{name,levels:levels.map(lv=>lv.roman||arabicLevelToRoman(lv.level)),maxLevel:item.maxLevel});
  }
  return item;
}
function normalizeLoadedEthnicResearchSkills(raw){
  const items=mergeEthnicResearchSkillItemsByName(Array.isArray(raw)?raw:[]).filter(item=>shouldIncludeItem('ethnicResearchSkills',item));
  return items.map((item,index)=>{item=repairEthnicResearchSkillLevels(item);
    const name=norm(item?.name||item?.title||`ethnic-research-skill-${index+1}`);
    const ethnicGroup=norm(item?.ethnicGroup||'');
    const triggerSkill=norm(item?.triggerSkill||ethnicGroup);
    const triggerMinLevel=Number(item?.triggerMinLevel)||3;
    const levels=Array.isArray(item?.levels)?item.levels.map((lv,idx)=>({level:Number(lv?.level)||idx+1,roman:norm(lv?.roman||arabicLevelToRoman(Number(lv?.level)||idx+1)),effectText:norm(lv?.effectText||lv?.text||''),effects:Array.isArray(lv?.effects)?lv.effects:[]})):[];
    const section={title:name,content:levels.map(lv=>`${lv.roman||arabicLevelToRoman(lv.level)}${lv.effectText}`).filter(Boolean)};
    return {...item,name,title:item?.title||name,category:'skills',sourceDataset:'skills',sourceType:'ethnicResearchSkill',isEthnicResearchSkill:true,ethnicGroup,triggerSkill,triggerMinLevel,maxLevel:Number(item?.maxLevel)||levels.length,levels,sections:[section],keyValues:[['分類','異文化調査専用技能'],['異民族',ethnicGroup],['発動条件',`${triggerSkill} Lv${triggerMinLevel}以上`]],searchTokens:uniq([name,ethnicGroup,triggerSkill,'異文化調査','専用技能']),raw:{...(item?.raw||{}),...item,name,ethnicGroup,triggerSkill,triggerMinLevel,levels,sourceType:'ethnicResearchSkill',sections:[section]}};
  });
}

const STATUS_EFFECT_RELATION_GROUP_LABELS={selfAbilityBuff:'自部隊能力強化',selfStateBuff:'自部隊状態強化',selfResistanceBuff:'自部隊不利対策',enemyAbilityDebuff:'敵部隊能力低下',enemyStateDebuff:'敵部隊状態弱化',enemyResistanceDebuff:'敵部隊有利対策'};
function isTacticGaugeDelayStatusEffect(profile,meta,itemOrName){
  const name=norm((meta?.name||meta?.displayName||profile?.displayName||profile?.originalName||(typeof itemOrName==='string'?itemOrName:(itemOrName?.name||itemOrName?.title||'')))||'');
  return name==='戦法遅延'||norm(meta?.actionKind||'')==='tactic_gauge_delay';
}
function isStatusEffectSemanticNameIn(name,list){return (list||[]).some(v=>name===v);}
function resolveStatusEffectSemanticGroupKey(profile,targetSide,meta,itemOrName){
  const side0=norm(targetSide||meta?.resolvedTargetSide||meta?.defaultTargetSide||'');
  const item=(itemOrName&&typeof itemOrName==='object')?itemOrName:null;
  const name=norm(meta?.name||meta?.displayName||profile?.displayName||profile?.originalName||item?.name||item?.title||itemOrName||'');
  const type=norm(meta?.effectType||item?.effectType||item?.raw?.type||'');
  const summary=norm(profile?.summaryKey||meta?.summaryKey||item?.statusSummaryKey||'');
  const direction=norm(profile?.direction||meta?.direction||item?.statusDirection||'');
  const desc=norm(item?.description||item?.raw?.description||meta?.description||'');
  const action=norm(meta?.actionKind||'');
  const text=[name,type,summary,direction,desc,action,norm(meta?.actionLabel||''),norm(meta?.actionTarget||'')].filter(Boolean).join(' ');
  // FIX[HADO-2.9.0.34-STATUS-META-CANONICAL]: 派生JSONに存在する状態変化はアプリ内名称リストで再分類しない。
  const canonical=getCanonicalDerivedStatusEffectMetaByName(name);
  if(canonical&&STATUS_EFFECT_RELATION_GROUP_LABELS[norm(canonical.groupKey||'')])return norm(canonical.groupKey);
  let side=side0;
  if(side!=='self'&&side!=='enemy'){
    if(type==='有利変化'||type==='能力変化(強化)')side='self';
    else if(type==='不利変化'||type==='能力変化(弱化)')side='enemy';
  }
  const selfResistanceNames=['回避','堅固','取込','攻撃無効','弱化無効','会心耐性','物理耐性','知力耐性','絶縁','物理戦法遮断','知力戦法遮断','不退','有利巧守','闘気','弱化反射','瞬影','強固','借威','練守','雄然','他対象攻撃耐性','閃護','恵守','完璧','廉潔','不敵','泰然','憤怒','不滅','闇盾','快気','賢壁','打開','火耐性変化(強化)'];
  const enemyResistanceNames=['穿撃','轟炎','戦法威力低下付与','戦法速度低下付与','強化無効','強化抑制','強化反転','反転','強化解除','強化奪取','強化時間短縮','畏武','武装破壊','火耐性変化(弱化)'];
  const selfAbilityNames=['治癒','高揚','結束','通常攻撃拡張','火属性強化','火属性付与','有利激攻','練心','呼応・一','呼応・二','盤石','奮心','憤撃','強化促進','鬼迫','猛奮','追討','龍鎧','豪昇','巧知','閃襲','烈風','御剣飛行','威心・攻','覇弓','攻防一体','飲血','火神降臨','火炮','撃迅','義奮','剛憤','強兵','撃炎','魁威','活身','威槍','操賢','龍吟','慧叡','護厳','献計','攻撃短縮','戦法短縮','兵器行動短縮','強化延長','強化増幅','即時回復','正転'];
  const enemyStateNames=['病毒','火傷','凶兆','恐怖','混乱','同討','疑心','弱化残存','畏怖','挑発','連鎖不能','連鎖無効','怯心','幻惑','分断','騎兵戦法抑圧','沙縛','毒﨧','反情','砕心','歩兵戦法抑圧','戦法遅延'];
  const enemyAbilityNames=['戦法範囲縮小','禍兆','戦法弱化','会心率半減','萎縮','通常攻撃縮小','不利脆弱','潜影','不利消沈','弱化積鈍','断道','物理戦法弱点','戦慄','深恐','困憊','闇動','封撃','乱炎','連鎖累減','暗影詛呪','氷呪','奪魂','感電','鈍迷','負傷兵数変化','弱化延長','士気奪取','震乱','兵科相性変化(弱化)','歩兵特効(弱化)','弓兵特効(弱化)','騎兵特効(弱化)','対物特効変化(弱化)','攻撃変化(弱化)','防御変化(弱化)','知力変化(弱化)','機動変化(弱化)','攻撃速度変化(弱化)','戦法速度変化(弱化)','兵器速度変化(弱化)','会心発生変化(弱化)','会心威力変化(弱化)','撃心発生変化(弱化)','撃心威力変化(弱化)','戦法威力変化(弱化)','命中変化(弱化)','生存割合変化(弱化)','与ダメージ変化(弱化)','被ダメージ変化(弱化)','通常攻撃威力変化(弱化)','火属性戦法威力(弱化)'];
  if(isStatusEffectSemanticNameIn(name,selfResistanceNames))return 'selfResistanceBuff';
  if(isStatusEffectSemanticNameIn(name,enemyResistanceNames))return 'enemyResistanceDebuff';
  if(isStatusEffectSemanticNameIn(name,selfAbilityNames))return 'selfAbilityBuff';
  if(isStatusEffectSemanticNameIn(name,enemyStateNames))return 'enemyStateDebuff';
  if(isStatusEffectSemanticNameIn(name,enemyAbilityNames))return 'enemyAbilityDebuff';
  if(/火耐性/.test(name+summary))return side==='enemy'?'enemyResistanceDebuff':'selfResistanceBuff';
  if(['buff_remove','buff_steal','buff_nullify','buff_reverse','buff_shorten','buff_suppress','armament_break','buff_remove_special'].includes(action))return 'enemyResistanceDebuff';
  if(['debuff_cleanse','debuff_nullify','debuff_reflect'].includes(action))return 'selfResistanceBuff';
  if(['tactic_gauge_delay','tactic_gauge_steal','wounded_soldier_reduce','tactic_gauge_destroy'].includes(action))return 'enemyAbilityDebuff';
  const isTacticDelay=isTacticGaugeDelayStatusEffect(profile,meta,itemOrName);
  const isAbility=isAbilityStatusEffectProfile(profile)&&!isTacticDelay;
  if(isAbility){
    if(/耐性/.test(name+summary+desc))return side==='enemy'?'enemyResistanceDebuff':'selfResistanceBuff';
    return side==='enemy'?'enemyAbilityDebuff':'selfAbilityBuff';
  }
  if(side==='self'){
    if(/耐性|無効|反射|回避|避け|受けない|カット|軽減|被ダメージ.*(?:減少|低下|軽減)|シールド|打ち消|壊滅.*耐える/.test(text))return 'selfResistanceBuff';
    return 'selfAbilityBuff';
  }
  if(side==='enemy'){
    if(/強化効果.*(?:打ち消|解除|奪取|奪う|無効|反転|短縮|抑制)|有利変化.*(?:打ち消|解除|奪取|無効|反転|短縮)|耐性.*低下|無視|武装.*(?:0|破壊)/.test(text))return 'enemyResistanceDebuff';
    if(/通常攻撃.*でき|戦法.*でき|命令でき|連鎖.*(?:起きない|不能|無効)|混乱|同討|恐怖|畏怖|疑心|挑発|幻惑|分断|状態変化.*(?:無効|付与できなく)|抑圧/.test(text))return 'enemyStateDebuff';
    return 'enemyAbilityDebuff';
  }
  if(direction==='debuff'||/不利変化|弱化|低下|減少/.test(type+text))return 'enemyStateDebuff';
  return 'selfAbilityBuff';
}
function resolveStatusEffectGroupKeyByTargetSideGate(profile,targetSide,meta,itemOrName){
  const group=resolveStatusEffectSemanticGroupKey(profile,targetSide,meta,itemOrName);
  return STATUS_EFFECT_RELATION_GROUP_LABELS[group]?group:'';
}

function isStatusEffectTargetSideLocked(meta){
  const source=norm(meta?.defaultTargetSideSource||'');
  const side=norm(meta?.defaultTargetSide||'');
  // FIX[HADO-2.8.8.2-STATUS-FINAL-GATE]:
  // 状態変化マスタの type / 即時効果名で self/enemy が上位確定した場合は、
  // 状態変化説明文や別出現元の観測 targetSide でグローバル分類を上書きしない。
  // 分断の説明文に含まれる「自部隊」や、別戦法の観測値が関連リンク/サマリーへ混入するデグレを遮断する。
  return !!side&&(source==='type'||source==='immediate-text');
}
function getStatusEffectLockedTargetSide(meta){
  return isStatusEffectTargetSideLocked(meta)?norm(meta.defaultTargetSide||''):'';
}
function getStatusEffectRelationGroupKey(effect){
  const item=typeof effect==='string'?findItemByCategoryAndName('statusEffects',effect):effect;
  const existingMeta=item&&typeof item==='object'?item.statusEffectMeta:null;
  if(existingMeta?.resolvedGroupKey&&STATUS_EFFECT_RELATION_GROUP_LABELS[existingMeta.resolvedGroupKey])return existingMeta.resolvedGroupKey;
  const profile=getStatusEffectProfile(item||effect||'');
  const type=norm((item&&typeof item==='object')?(item.effectType||item.raw?.type||''):'');
  const actionMeta=(item&&typeof item==='object')?classifyStatusEffectActionMeta(item,profile):null;
  const targetMeta=(item&&typeof item==='object')?inferStatusEffectDefaultTargetSideFromType(type,item.name||item.originalName||profile.originalName,item.description||item.raw?.description||'',actionMeta):{targetSide:'',source:'unknown',reason:''};
  return resolveStatusEffectSemanticGroupKey(profile,targetMeta.targetSide,{...(actionMeta||{}),effectType:type,defaultTargetSide:targetMeta.targetSide,defaultTargetSideSource:targetMeta.source,defaultTargetSideReason:targetMeta.reason,name:item?.name||effect,displayName:profile.displayName,summaryKey:profile.summaryKey,direction:profile.direction},item||effect)||'selfStateBuff';
}
function getStatusEffectRelationGroupLabel(effect){return STATUS_EFFECT_RELATION_GROUP_LABELS[getStatusEffectRelationGroupKey(effect)]||'自部隊状態強化';}
const STATUS_EFFECT_ABILITY_SUMMARY_KEYS=new Set(['兵力','攻撃','防御','知力','機動','攻撃速度','会心発生','会心威力','戦法速度','戦法ゲージ','対物特効','与ダメージ','被ダメージ','戦法威力','物理与ダメージ','知力与ダメージ','戦法被ダメージ','物理被ダメージ','知力被ダメージ','兵科相性','兵器速度','命中','撃心発生','撃心威力','通常攻撃威力','火属性威力','火属性戦法威力','騎兵特効','歩兵特効','弓兵特効','攻撃待ち時間']);
function isAbilityStatusEffectProfile(profile){
  const original=norm(profile?.originalName||'');
  const summary=norm(profile?.summaryKey||'');
  return /(?:変化)?\((強化|弱化)\)/.test(original)||STATUS_EFFECT_ABILITY_SUMMARY_KEYS.has(summary);
}
function shouldSuppressDefensiveAbilityDebuff(profile,ctx){
  // FIX[HADO-2.7.0.0-SELF-RESISTANCE-LINK]:
  // 能力弱化系の「避ける/無効化/解除」は、状態変化率サマリーには入れないが関連リンクでは自部隊不利対策に分類する。
  // 旧実装のようにここで抑止すると、剛塁の「能力弱化効果（攻撃）を避ける」がリンク対象から消えるため、捨てずに resolveStatusEffectRelationGroup へ渡す。
  return false;
}
function findStatusEffectItemByAnyName(name){
  const target=norm(name);
  if(!target)return null;
  return (state.statusEffects||[]).find(item=>{
    const profile=getStatusEffectProfile(item);
    const values=[item?.name,item?.title,item?.originalName,item?.statusDisplayName,profile?.originalName,profile?.displayName,...(profile?.aliases||[])].map(norm).filter(Boolean);
    return values.includes(target);
  })||findItemByCategoryAndName('statusEffects',target)||null;
}
function getStatusEffectMetaForRelationEntry(entry,item){
  const direct=item&&typeof item==='object'?item.statusEffectMeta:null;
  if(direct)return direct;
  const n=norm(entry?.name||entry?.statusEffectName||entry?.baseName||entry?.displayName||(typeof item==='string'?item:''));
  return getStatusEffectMetaByName(n);
}
function applyStatusTargetSideGateToGroup(groupKey,entry,item){
  const explicit=norm(groupKey||'');
  if(explicit==='selfResistanceBuff'||explicit==='enemyResistanceDebuff')return explicit;
  const meta=getStatusEffectMetaForRelationEntry(entry,item);
  const profile=getStatusEffectProfile(item||entry?.name||entry);
  const lockedSide=getStatusEffectLockedTargetSide(meta);
  let side=norm(entry?.targetSide||'');
  // FIX[HADO-2.8.8.2-STATUS-FINAL-GATE]:
  // 出現元が明示 targetSide を持つ場合はその文脈を使う。
  // ただし、entry 側に文脈が無い関連リンク/派生JSON/状態変化マスタ表示では、
  // type / immediate-text で上位確定した meta.resolvedTargetSide を優先し、古い groupKey や観測集約値で上書きしない。
  if(!side)side=lockedSide||norm(meta?.resolvedTargetSide||'');
  const gated=resolveStatusEffectGroupKeyByTargetSideGate(profile,side,meta,item||entry?.name||entry);
  if(gated&&STATUS_EFFECT_RELATION_GROUP_LABELS[gated])return gated;
  return explicit;
}
function statusRelationPreferredGroup(entry,item){
  const explicit=norm(entry?.groupKey||'');
  const gated=applyStatusTargetSideGateToGroup(explicit,entry,item);
  if(gated&&STATUS_EFFECT_RELATION_GROUP_LABELS[gated])return gated;
  if(explicit&&STATUS_EFFECT_RELATION_GROUP_LABELS[explicit])return explicit;
  return getStatusEffectRelationGroupKey(item||entry?.name||entry);
}
function statusRelationDisplayName(entry,item){
  const rawName=entry&&typeof entry==='object'?entry.name:entry;
  const n=norm(rawName);
  const base=getItemDisplayName(item||{name:n,title:n});
  const relation=norm(entry?.relationType||'');
  const groupKey=norm(entry?.groupKey||'');
  const finalLabel=norm(entry?.displayName||entry?.finalDisplayName||entry?.label||'');
  const isPrecomputedCountermeasure=!!(entry&&(entry.source==='self_countermeasure_index'||/self-countermeasure|self-granted-status-nullify/.test(norm(entry.sourcePartType||''))));
  if(groupKey==='selfResistanceBuff'){
    // HADO-2.8.9.53: クローラー生成済みの「対策名[技能]」はアプリ側で再加工しない。
    // ここで「耐性」を付け直すと、正本JSONの自部隊不利対策が表示から消える/壊れる。
    if(isPrecomputedCountermeasure)return finalLabel||base;
    // HADO-2.9.0.23: 状態変化マスタに実在する名称は分類ラベルに合わせて加工しない。
    if(findStatusEffectItemByAnyName(base))return base;
    if(/[［\[][^\]］]+[\]］]$/.test(base)||/(回避|無効|解除|反射)$/.test(base))return base;
    if(/回避/.test(relation))return `${base}回避`;
    if(/無効化|無効/.test(relation))return `${base}無効`;
    if(/反射/.test(relation))return `${base}反射`;
    if(/解除/.test(relation))return `${base}解除`;
    return `${base}耐性`;
  }
  if(groupKey==='enemyResistanceDebuff'){
    // HADO-2.9.0.23: 強化奪取など実在する即時効果へ「耐性低下」を後付けしない。
    if(findStatusEffectItemByAnyName(base))return base;
    if(finalLabel)return finalLabel;
    if(/[［\[][^\]］]+[\]］]$/.test(base)||/(無視|解除|無効化|無効|封じ|耐性低下)$/.test(base))return base;
    if(/無視/.test(relation))return `${base}無視`;
    if(/解除/.test(relation))return `${base}解除`;
    if(/無効化|無効/.test(relation))return `${base}無効`;
    if(/封じ/.test(relation))return `${base}封じ`;
    return `${base}耐性低下`;
  }
  return finalLabel||base;
}
function resolveStatusEffectRelatedLinkTargetName(displayName){
  let n=norm(displayName);
  if(!n)return '';
  n=norm(n.replace(/[［\[].*?[\]］]/g,''));
  if(findStatusEffectItemByAnyName(n))return n;
  const candidates=[];
  const suffixes=['耐性低下','無効化','回避','反射','解除','無視','封じ','耐性'];
  suffixes.forEach(suf=>{if(n.endsWith(suf)){const base=norm(n.slice(0,-suf.length));if(base)candidates.push(base);}});
  const explicit={能力弱化回避:'能力弱化',不利変化無効:'不利変化'};
  if(explicit[n])candidates.push(explicit[n]);
  for(const cand of candidates){
    const item=findStatusEffectItemByAnyName(cand);
    if(item)return norm(item?.name||item?.originalName||item?.statusDisplayName||getItemDisplayName(item)||cand);
  }
  return '';
}
function canUseRelatedLinkName(cat,n,currentCategory,currentName){
  const name=norm(n);
  if(!name)return false;
  if(cat==='statusEffects'){
    // HADO-2.8.9.54: クローラー生成済みの自部隊不利対策ラベルは、必ずしも状態変化マスタに実体を持たない。
    // 例: 攻撃低下回避[剛塁] / 会心無効[剛塁]。これを状態変化実体チェックで落とすと自部隊不利対策が全体的に消える。
    if(isCountermeasureRelatedDisplayLabel(name))return true;
    const linkName=resolveStatusEffectRelatedLinkTargetName(name)||name;
    if(currentCategory==='statusEffects'&&linkName===currentName)return false;
    return !!findStatusEffectItemByAnyName(linkName);
  }
  const targetName=cat==='skills'?relatedSkillTargetNameForDisplay(name):name;
  return (cat!==currentCategory||targetName!==currentName)&&!!findItemByCategoryAndName(cat,targetName);
}
function statusRelationGroupPriority(groupKey,item,entry){
  const profile=getStatusEffectProfile(item||entry?.name||entry);
  const isAbility=isAbilityStatusEffectProfile(profile);
  const relation=norm(entry?.relationType||'');
  if(groupKey==='selfResistanceBuff'||groupKey==='enemyResistanceDebuff')return 100;
  if(isAbility&&(groupKey==='selfAbilityBuff'||groupKey==='enemyAbilityDebuff'))return 90;
  if(!isAbility&&(groupKey==='selfStateBuff'||groupKey==='enemyStateDebuff'))return 80;
  if(/回避|無効化|解除|反射|無視/.test(relation))return 70;
  return 50;
}
function addStatusEffectRelationGroups(add,names){
  const selected=new Map();
  (names||[]).forEach(entry=>{
    const rawName=entry&&typeof entry==='object'?entry.name:entry;
    const n=norm(rawName);if(!n)return;
    const item=findStatusEffectItemByAnyName(n);
    const groupKey=statusRelationPreferredGroup(entry,item||n);
    if(!STATUS_EFFECT_RELATION_GROUP_LABELS[groupKey])return;
    const profile=getStatusEffectProfile(item||n);
    // 分類ガード：自部隊強化に低下そのもの、敵部隊低下に上昇そのものを混ぜない。
    if(groupKey==='selfAbilityBuff'&&profile.direction==='debuff')return;
    if(groupKey==='enemyAbilityDebuff'&&profile.direction==='buff')return;
    if(groupKey==='selfStateBuff'&&profile.direction==='debuff')return;
    if(groupKey==='enemyStateDebuff'&&profile.direction==='buff')return;
    const display=statusRelationDisplayName(entry,item||{name:n,title:n});
    if(!display)return;
    const priority=statusRelationGroupPriority(groupKey,item||n,entry||{});
    const current=selected.get(display);
    if(!current||priority>current.priority){
      selected.set(display,{display,groupKey,priority,relationType:norm(entry?.relationType||''),reason:norm(entry?.reason||'')});
    }
  });
  const bucket={selfAbilityBuff:[],selfStateBuff:[],selfResistanceBuff:[],enemyAbilityDebuff:[],enemyStateDebuff:[],enemyResistanceDebuff:[]};
  selected.forEach(v=>{if(bucket[v.groupKey]&&!bucket[v.groupKey].includes(v.display))bucket[v.groupKey].push(v.display);});
  // HADO-2.8.9.53: related_link_index が正本として生成した selfResistanceBuff/enemyResistanceDebuff も表示する。
  // アプリ側で補完して作るのではなく、クローラー生成済みの対策名[技能]をそのまま出す。
  ['selfAbilityBuff','selfStateBuff','selfResistanceBuff','enemyAbilityDebuff','enemyStateDebuff','enemyResistanceDebuff'].forEach(key=>{
    if(bucket[key].length)add('statusEffects',STATUS_EFFECT_RELATION_GROUP_LABELS[key],bucket[key]);
  });
}
function normalizeLoadedStatusEffects(raw){
const items=Array.isArray(raw?.items)?raw.items:[];
return items.map((item,index)=>{
const originalName=norm(item?.name||'')||`statusEffect-${index+1}`;
const effectType=norm(item?.type||'');
const description=norm(item?.description||'');
const profile=getStatusEffectProfile({name:originalName,raw:item});
const displayName=profile.displayName||originalName;
const keyValues=[['種類',effectType]];
if(displayName!==originalName)keyValues.push(['統一表示名',displayName],['元名称',originalName]);
if(profile.summaryKey)keyValues.push(['summaryKey',profile.summaryKey],['direction',profile.direction||'']);
const relationGroup=getStatusEffectRelationGroupKey({name:originalName,originalName,statusDisplayName:displayName,effectType,description,raw:item});
keyValues.push(['状態変化分類',STATUS_EFFECT_RELATION_GROUP_LABELS[relationGroup]||'']);
return {name:originalName,title:displayName,originalName,statusDisplayName:displayName,statusSummaryKey:profile.summaryKey,statusDirection:profile.direction,statusRelationGroup:relationGroup,statusRelationGroupLabel:STATUS_EFFECT_RELATION_GROUP_LABELS[relationGroup]||'',statusFixedRelationGroup:relationGroup,statusFixedRelationGroupLabel:STATUS_EFFECT_RELATION_GROUP_LABELS[relationGroup]||'',statusGroupLocked:true,description,url:'',category:'statusEffects',sourceDataset:'statusEffects',effectType,keyValues,tables:[],sections:[{title:'説明',content:[description]}],raw:item,searchTokens:uniq([originalName,displayName,profile.summaryKey,effectType,description,STATUS_EFFECT_RELATION_GROUP_LABELS[relationGroup]||'',...(profile.aliases||[])])};
}).filter(v=>!!v.name);
}

// FIX[HADO-2.7.0.10-STATUS-EFFECT-TARGET-META]: 状態変化200件について、既定分類と戦法追加効果から観測した対象側を明示メタとして保持する。
function statusEffectGroupDefaultTargetSide(groupKey){
  const key=norm(groupKey||'');
  if(/^self/.test(key))return 'self';
  if(/^enemy/.test(key))return 'enemy';
  return '';
}
function statusEffectGroupDefaultDirection(groupKey,effectType,profile){
  const pdir=norm(profile?.direction||'');
  if(pdir)return pdir;
  const type=norm(effectType||'');
  const key=norm(groupKey||'');
  if(/能力変化\(強化\)|有利変化/.test(type))return 'buff';
  if(/能力変化\(弱化\)|不利変化/.test(type))return 'debuff';
  if(/^self/.test(key))return 'buff';
  if(/^enemy/.test(key))return 'debuff';
  return '';
}
function inferStatusEffectTargetSideFromAdditionalEffectTarget(targetText,descriptionText=''){
  const text=norm([targetText,descriptionText].filter(Boolean).join(' '));
  const target=norm(targetText||'');
  if(/敵|相手/.test(target))return 'enemy';
  if(/味方|自分|自身|自部隊|自軍/.test(target))return 'self';
  if(/敵|相手/.test(text)&&!/味方|自分|自身|自部隊|自軍/.test(text))return 'enemy';
  if(/味方|自分|自身|自部隊|自軍/.test(text)&&!/敵|相手/.test(text))return 'self';
  return '';
}

function inferStatusEffectDefaultTargetSideFromType(effectType,name='',description='',actionMeta=null){
  const type=norm(effectType||'');
  const n=norm(name||'');
  const desc=norm(description||'');
  const kind=norm(actionMeta?.actionKind||'');
  const text=[n,desc,kind,norm(actionMeta?.actionLabel||'')].filter(Boolean).join(' ');
  if(type==='有利変化'||type==='能力変化(強化)')return {targetSide:'self',source:'type',reason:`type:${type}`};
  if(type==='不利変化'||type==='能力変化(弱化)')return {targetSide:'enemy',source:'type',reason:`type:${type}`};
  if(type==='即時効果'){
    if(/^(攻撃短縮|戦法短縮|兵器行動短縮|強化延長|強化増幅|即時回復|正転)$/.test(n))return {targetSide:'self',source:'immediate-text',reason:'即時効果:自部隊支援系'};
    if(/^(強化解除|強化奪取|反転|弱化延長|戦法遅延|士気奪取|武装破壊|強化時間短縮|畏武|震乱|負傷兵数変化)$/.test(n))return {targetSide:'enemy',source:'immediate-text',reason:'即時効果:敵部隊作用系'};
    if(/^debuff_(cleanse|nullify|reflect)/.test(kind)||/弱化(解除|無効|反射|打消)|快気|打開|龍吟/.test(text))return {targetSide:'self',source:'immediate-text',reason:'即時効果:弱化対策系'};
    if(/^buff_(remove|steal|nullify|reverse|shorten)/.test(kind)||/強化(解除|奪取|無効|反転|時間短縮)|強化効果.*(打ち消|解除|奪|無効|反転|短縮)/.test(text))return {targetSide:'enemy',source:'immediate-text',reason:'即時効果:敵強化阻害系'};
    if(/^buff_(amplify|extend|promote)/.test(kind)||/強化(増幅|延長|促進)|能力強化効果.*(増幅|延長)/.test(text))return {targetSide:'self',source:'immediate-text',reason:'即時効果:強化支援系'};
  }
  return {targetSide:'',source:'unknown',reason:type?`type:${type}:未判定`:'typeなし'};
}
function collectStatusEffectAdditionalEffectObservations(){
  const observations=[];
  const readAdditionalTable=(owner,table)=>{
    const rows=getTableRows(table);
    if(!rows.length)return;
    const head=Array.isArray(rows[0])?rows[0].map(norm):[];
    if(!(head[0]==='追加効果'&&head[1]==='対象範囲'))return;
    for(let idx=1;idx<rows.length;idx+=2){
      const row=Array.isArray(rows[idx])?rows[idx]:[];
      const descRow=Array.isArray(rows[idx+1])?rows[idx+1]:[];
      const effectName=norm(row[0]||'');
      const targetText=norm(row[1]||'');
      const duration=norm(row[2]||'');
      const description=norm(descRow.join(' '));
      if(!effectName||/追加効果|対象範囲/.test(effectName))continue;
      const statusName=resolveTacticAdditionalStatusEffectName(effectName,targetText,description);
      if(!statusName)continue;
      const statusItem=findStatusEffectItemByAnyName(statusName)||findStatusEffectItemByAnyName(effectName);
      const profile=getStatusEffectProfile(statusItem||statusName);
      const relation=detectStatusEffectRelationForOwnerText(`追加効果 ${effectName} ${targetText} ${duration} ${description}`,profile);
      const inferredSide=inferStatusEffectTargetSideFromAdditionalEffectTarget(targetText,description);
      const targetSide=norm(relation?.targetSide||inferredSide||'');
      const groupKey=norm(relation?.groupKey|| (targetSide?getStatusEffectRelationGroupKey(statusItem||statusName):''));
      observations.push({statusName:norm(statusItem?.name||statusItem?.originalName||statusName),displayName:norm(statusItem?.statusDisplayName||profile.displayName||effectName),effectName,targetText,duration,description,targetSide,groupKey,relationType:norm(relation?.relationType||''),sourceCategory:'tactics',sourceName:norm(owner?.name||owner?.title||''),sourceGeneral:norm(owner?.sourceName||owner?.raw?.sourceGeneral||''),matched:!!relation?.matched,reason:norm(relation?.reason||'additional-effect-target')});
    }
  };
  (state.tactics||[]).forEach(tactic=>{(Array.isArray(tactic?.tables)?tactic.tables:[]).forEach(table=>readAdditionalTable(tactic,table));});
  return observations;
}


// FIX[HADO-2.7.0.15-STATUS-EFFECT-META-MINIMAL]:
// 状態変化メタは「状態変化そのものの性質」だけを持つ。
// 対策/阻害の採用可否や除外理由は派生インデックス側の責務とし、ここでは保持しない。
function classifyStatusEffectActionMeta(item,profile){
  const name=norm(item?.name||item?.originalName||item?.statusDisplayName||profile?.displayName||'');
  const displayName=norm(item?.statusDisplayName||profile?.displayName||name);
  const effectType=norm(item?.effectType||item?.raw?.type||'');
  const desc=norm(item?.description||item?.raw?.description||'');
  const text=[name,displayName,effectType,desc].filter(Boolean).join(' ');
  const result={actionKind:'none',actionLabel:'通常効果',actionTarget:'',judgementReason:'default'};
  const set=(kind,label,target,reason)=>Object.assign(result,{actionKind:kind,actionLabel:label,actionTarget:target,judgementReason:reason||kind});
  if(name==='攻撃短縮'||displayName==='攻撃短縮')set('normal_attack_wait_shorten','攻撃短縮','通常攻撃待ち時間','status-name:normal-attack-wait-shorten');
  else if(name==='戦法短縮'||displayName==='戦法短縮')set('tactic_wait_shorten','戦法短縮','戦法待ち時間','status-name:tactic-wait-shorten');
  else if(name==='兵器行動短縮'||displayName==='兵器行動短縮')set('siege_wait_shorten','兵器行動短縮','兵器待ち時間','status-name:siege-wait-shorten');
  else if(name==='負傷兵数変化'||displayName==='負傷兵数変化')set('wounded_soldier_reduce','負傷兵数変化','負傷兵','status-name:wounded-soldier-reduce');
  else if(name==='強化解除'||displayName==='強化解除')set('buff_remove','強化解除','強化効果','status-name:buff-remove');
  else if(name==='強化奪取'||displayName==='強化奪取')set('buff_steal','強化奪取','強化効果','status-name:buff-steal');
  else if(name==='強化無効'||displayName==='強化無効')set('buff_nullify','強化無効','強化効果','status-name:buff-nullify');
  else if(name==='強化反転'||displayName==='強化反転'||name==='反転'||displayName==='反転')set('buff_reverse',name==='反転'||displayName==='反転'?'反転':'強化反転','強化効果','status-name:buff-reverse');
  else if(name==='強化時間短縮'||displayName==='強化時間短縮')set('buff_shorten','強化時間短縮','強化効果','status-name:buff-shorten');
  else if(name==='強化抑制'||displayName==='強化抑制')set('buff_suppress','強化抑制','強化効果','status-name:buff-suppress');
  else if(name==='弱化解除'||displayName==='弱化解除')set('debuff_cleanse','弱化解除','弱化効果','status-name:debuff-cleanse');
  else if(name==='弱化無効'||displayName==='弱化無効')set('debuff_nullify','弱化無効','弱化効果','status-name:debuff-nullify');
  else if(name==='弱化反射'||displayName==='弱化反射')set('debuff_reflect','弱化反射','弱化効果','status-name:debuff-reflect');
  else if(name==='弱化延長'||displayName==='弱化延長')set('debuff_extend','弱化延長','弱化効果','status-name:debuff-extend');
  else if(name==='戦法遅延'||displayName==='戦法遅延')set('tactic_gauge_delay','戦法遅延','戦法ゲージ','status-name:tactic-gauge-delay');
  else if(name==='士気奪取'||displayName==='士気奪取')set('tactic_gauge_steal','士気奪取','戦法ゲージ','status-name:tactic-gauge-steal');
  else if(name==='即時回復'||displayName==='即時回復')set('instant_heal','即時回復','負傷兵','status-name:instant-heal');
  else if(name==='武装破壊'||displayName==='武装破壊')set('armament_break','武装破壊','武装耐久','status-name:armament-break');
  else if(name==='畏武'||displayName==='畏武')set('buff_remove_special','畏武','強化効果','status-name:iwu');
  else if(name==='震乱'||displayName==='震乱')set('tactic_gauge_destroy','震乱','戦法ゲージ','status-name:shinran');
  else if(name==='強化増幅'||displayName==='強化増幅'||/能力強化効果の効果量を増幅/.test(desc))set('buff_amplify','強化増幅','強化効果','status-name:buff-amplify');
  else if(name==='強化延長'||displayName==='強化延長'||/強化.*延長|効果時間.*延長/.test(text))set('buff_extend','強化延長','強化効果','status-name:buff-extend');
  else if(name==='強化促進'||displayName==='強化促進'||/強化.*促進/.test(text))set('buff_promote','強化促進','強化効果','status-name:buff-promote');
  return result;
}

function isStatusMetaSelfDisadvantageTarget(meta){
  if(!meta)return false;
  // 自部隊不利対策の対象は、通常は敵部隊へ付与される不利側状態変化。方向判定メタを唯一の基準にする。
  return meta.defaultTargetSide==='enemy' && (meta.isDisadvantage || meta.direction==='debuff' || /不利変化|能力変化\(弱化\)|即時効果/.test(meta.effectType||''));
}
function getCountermeasureStatusEffectMetaByTargetName(name){
  const item=getCountermeasureStatusEffectItemByTargetName(name);
  if(!item)return null;
  return item.statusEffectMeta||getStatusEffectMetaByName(item.name||item.originalName||item.statusDisplayName||name);
}
function isEnemyAdvantageObstructionActionKind(kind){
  return ['buff_remove','buff_steal','buff_nullify','buff_reverse','buff_shorten','buff_suppress'].includes(norm(kind||''));
}
function getEnemyAdvantageObstructionStatusByRelation(relation){
  const r=normalizeCountermeasureRelationLabel(relation||'');
  const kindMap={解除:'buff_remove',奪取:'buff_steal',無効:'buff_nullify',反転:'buff_reverse',短縮:'buff_shorten',抑制:'buff_suppress'};
  const kind=kindMap[r]||'';
  if(!kind)return null;
  return (state.statusEffectMetaList||[]).find(m=>m.actionKind===kind&&m.defaultTargetSide==='enemy')||null;
}
function getRelationFromEnemyAdvantageObstructionMeta(meta){
  const kind=norm(meta?.actionKind||'');
  const map={buff_remove:'解除',buff_steal:'奪取',buff_nullify:'無効',buff_reverse:'反転',buff_shorten:'短縮',buff_suppress:'抑制'};
  return map[kind]||'';
}
function getEnemyAdvantageObstructionRelationFromStatusName(name){
  const meta=getStatusEffectMetaByName(name);
  if(!meta||meta.defaultTargetSide!=='enemy'||!isEnemyAdvantageObstructionActionKind(meta.actionKind))return '';
  return getRelationFromEnemyAdvantageObstructionMeta(meta);
}
function hasEnemyAdvantageObstructionContext(sourceText){
  const src=normalizeHadouCrawlerTypoText(sourceText||'');
  if(!src)return false;
  if(/無視して.*ダメージ|ダメージ.*無視|攻撃.*無視/.test(src))return false;
  if(/避ける|回避|受けない|受けず/.test(src))return false;
  if(/敵|敵部隊|対象を含む敵|相手|対象/.test(src))return true;
  if(/強化効果|有利変化/.test(src)&&/(?:打ち消|解除|奪取|奪う|無効|反転|短縮|抑制)/.test(src))return true;
  return false;
}

function buildStatusEffectBaseMeta(item){
  const profile=getStatusEffectProfile(item);
  const effectType=norm(item?.effectType||item?.raw?.type||'');
  const name=norm(item?.name||item?.originalName||profile.originalName);
  const displayName=norm(item?.statusDisplayName||profile.displayName||name);
  const description=norm(item?.description||item?.raw?.description||'');
  const actionMeta=classifyStatusEffectActionMeta(item,profile);
  const canonical=getCanonicalDerivedStatusEffectMetaByName(name);
  if(!canonical)throw new Error(`hadou_status_effect_meta_index.json に状態変化 ${name} がありません。最新JSON一式を再読込してください。`);
  const targetMeta={targetSide:norm(canonical.targetSide||''),source:'derived-json-canonical',reason:norm(canonical.classificationReason||'hadou_status_effect_meta_index.json')};
  const groupKey=norm(canonical.groupKey||'');
  if(!STATUS_EFFECT_RELATION_GROUP_LABELS[groupKey])throw new Error(`状態変化 ${name} の groupKey が不正です: ${groupKey}`);
  const direction=norm(canonical.direction||statusEffectGroupDefaultDirection(groupKey,effectType,profile));
  return {name,displayName:norm(canonical.displayName||displayName),originalName:norm(item?.originalName||name),effectType,summaryKey:norm(canonical.summaryKey||profile.summaryKey||''),direction,defaultTargetSide:targetMeta.targetSide,defaultTargetSideSource:targetMeta.source,defaultTargetSideReason:targetMeta.reason,defaultGroupKey:groupKey,defaultGroupLabel:STATUS_EFFECT_RELATION_GROUP_LABELS[groupKey]||'',isAdvantage:direction==='buff'||/有利変化|能力変化\(強化\)/.test(effectType),isDisadvantage:direction==='debuff'||/不利変化|能力変化\(弱化\)/.test(effectType),actionKind:actionMeta.actionKind,actionLabel:actionMeta.actionLabel,actionTarget:actionMeta.actionTarget,actionJudgementReason:actionMeta.judgementReason,observedTargetSides:[],observedGroupKeys:[],observations:[],targetSideJudgement:targetMeta.source,canonicalSource:'hadou_status_effect_meta_index.json'};
}
function buildStatusEffectMetaIndex(){
  const byName=new Map();
  const list=[];
  (state.statusEffects||[]).forEach(item=>{
    const meta=buildStatusEffectBaseMeta(item);
    list.push(meta);
    [meta.name,meta.displayName,meta.originalName].forEach(k=>{const n=norm(k);if(n)byName.set(n,meta);});
  });
  const observations=collectStatusEffectAdditionalEffectObservations();
  observations.forEach(obs=>{
    const meta=byName.get(norm(obs.statusName))||byName.get(norm(obs.displayName))||byName.get(norm(obs.effectName));
    if(!meta)return;
    meta.observations.push(obs);
    if(obs.targetSide&&!meta.observedTargetSides.includes(obs.targetSide))meta.observedTargetSides.push(obs.targetSide);
    if(obs.groupKey&&!meta.observedGroupKeys.includes(obs.groupKey))meta.observedGroupKeys.push(obs.groupKey);
  });
  list.forEach(meta=>{
    const observedSingle=meta.observedTargetSides.length===1?meta.observedTargetSides[0]:'';
    meta.hasObservedTargetSide=meta.observedTargetSides.length>0;
    meta.targetSideLocked=isStatusEffectTargetSideLocked(meta);
    meta.targetSideMismatch=!!(meta.defaultTargetSide&&observedSingle&&meta.defaultTargetSide!==observedSingle);
    const lockedSide=getStatusEffectLockedTargetSide(meta);
    if(lockedSide){
      meta.resolvedTargetSide=lockedSide;
      meta.targetSideJudgement=meta.targetSideMismatch?'locked-default-overrides-observed':meta.defaultTargetSideSource;
      meta.finalGateReason=`locked:${meta.defaultTargetSideSource}:${meta.defaultTargetSideReason||''}`;
    }else{
      meta.resolvedTargetSide=(meta.targetSideMismatch&&observedSingle)?observedSingle:(meta.defaultTargetSide||observedSingle||'');
      meta.targetSideJudgement=meta.targetSideMismatch?'observed-overrides-default':(meta.defaultTargetSide?meta.defaultTargetSideSource:(observedSingle?'observed-fallback':'unknown'));
      meta.finalGateReason=meta.targetSideJudgement;
    }
    meta.resolvedGroupKey=meta.canonicalSource?meta.defaultGroupKey:(resolveStatusEffectGroupKeyByTargetSideGate({displayName:meta.displayName,originalName:meta.originalName,summaryKey:meta.summaryKey,direction:meta.direction},meta.resolvedTargetSide,meta,meta.name)||meta.defaultGroupKey);
    meta.resolvedGroupLabel=STATUS_EFFECT_RELATION_GROUP_LABELS[meta.resolvedGroupKey]||meta.defaultGroupLabel||'';
  });
  (state.statusEffects||[]).forEach(item=>{
    const meta=byName.get(norm(item?.name||item?.originalName||item?.statusDisplayName||''));
    if(!meta)return;
    item.statusEffectMeta=meta;
    item.statusTargetSide=meta.resolvedTargetSide;
    item.statusDefaultTargetSide=meta.defaultTargetSide;
    item.statusObservedTargetSides=meta.observedTargetSides.slice();
    item.statusEffectMetaReady=true;
    const kv=Array.isArray(item.keyValues)?item.keyValues:[];
    item.keyValues=kv.filter(row=>!['対象判定','既定対象','判定根拠','判定理由','観測対象','対象不一致','作用分類','作用対象'].includes(norm(row?.[0]||'')));
    item.keyValues.push(['対象判定',meta.targetSideJudgement],['既定対象',meta.defaultTargetSide||'-'],['解決対象',meta.resolvedTargetSide||'-'],['判定根拠',meta.defaultTargetSideSource||'-'],['判定理由',meta.defaultTargetSideReason||'-'],['観測対象',meta.observedTargetSides.join('/')||'-'],['対象不一致',meta.targetSideMismatch?'yes':'no'],['解決分類',meta.resolvedGroupLabel||'-'],['作用分類',meta.actionLabel||'-'],['作用対象',meta.actionTarget||'-']);
    item.searchTokens=uniq([...(Array.isArray(item.searchTokens)?item.searchTokens:[]),meta.defaultGroupLabel,meta.resolvedGroupLabel,meta.defaultTargetSide,meta.defaultTargetSideSource,meta.defaultTargetSideReason,meta.resolvedTargetSide,meta.targetSideJudgement,meta.actionKind,meta.actionLabel,meta.actionTarget]);
  });
  state.statusEffectMetaByName=byName;
  state.statusEffectMetaList=list;
  const typeCounts={};
  const groupCounts={};
  const targetCounts={};
  const actionCounts={};
  list.forEach(m=>{typeCounts[m.effectType||'']=(typeCounts[m.effectType||'']||0)+1;groupCounts[m.resolvedGroupKey||m.defaultGroupKey||'']=(groupCounts[m.resolvedGroupKey||m.defaultGroupKey||'']||0)+1;targetCounts[m.resolvedTargetSide||'']=(targetCounts[m.resolvedTargetSide||'']||0)+1;actionCounts[m.actionKind||'none']=(actionCounts[m.actionKind||'none']||0)+1;});
  state.diagnostics.statusEffectMeta={source:'HADO-2.7.0.21',total:list.length,allTargetSideJudged:list.every(m=>!!m.resolvedTargetSide),missingTargetSide:list.filter(m=>!m.resolvedTargetSide).map(m=>m.name),observedMetaCount:list.filter(m=>m.hasObservedTargetSide).length,observationCount:observations.length,typeCounts,groupCounts,targetCounts,actionCounts,targetSideSourceCounts:list.reduce((acc,m)=>{const k=m.defaultTargetSideSource||'unknown';acc[k]=(acc[k]||0)+1;return acc;},{}),targetSideMismatches:list.filter(m=>m.targetSideMismatch).map(m=>({name:m.name,type:m.effectType,defaultTargetSide:m.defaultTargetSide,observedTargetSides:m.observedTargetSides,resolvedTargetSide:m.resolvedTargetSide,targetSideJudgement:m.targetSideJudgement,finalGateReason:m.finalGateReason||''})),sample:list.slice(0,30).map(m=>({name:m.name,displayName:m.displayName,type:m.effectType,direction:m.direction,defaultTargetSide:m.defaultTargetSide,defaultTargetSideSource:m.defaultTargetSideSource,defaultTargetSideReason:m.defaultTargetSideReason,observedTargetSides:m.observedTargetSides,targetSideLocked:m.targetSideLocked,targetSideMismatch:m.targetSideMismatch,targetSideJudgement:m.targetSideJudgement,finalGateReason:m.finalGateReason||'',group:m.resolvedGroupLabel||m.defaultGroupLabel,defaultGroup:m.defaultGroupLabel,resolvedGroup:m.resolvedGroupLabel,actionKind:m.actionKind,actionLabel:m.actionLabel,actionTarget:m.actionTarget})) ,policy:'状態変化メタは6分類（自部隊能力強化/自部隊状態強化/自部隊不利対策/敵部隊能力低下/敵部隊状態弱化/敵部隊有利対策）で確定し、関連リンク・状態変化率・部隊編成表示で同一分類関数を使用する。'};
  debugLog('statusEffectMeta:build',state.diagnostics.statusEffectMeta);
  return list;
}
function getStatusEffectMetaByName(name){
  const n=norm(name||'');
  if(!n)return null;
  if(state.statusEffectMetaByName instanceof Map&&state.statusEffectMetaByName.has(n))return state.statusEffectMetaByName.get(n);
  const item=findStatusEffectItemByAnyName(n);
  return item?.statusEffectMeta||null;
}

function stringifyWithoutTextSample(value){return JSON.stringify(value,(key,val)=>key==='textSample'?undefined:val);}function isSearchExcludedSection(item,section){const title=norm(section?.title||'');const category=norm(item?.sourceDataset||item?.category||'');if(!title)return false;if(/の入手方法$/.test(title))return true;if(category==='generals'){if(/と相性の良い武将$/.test(title))return true;if(/の専用名宝$/.test(title))return true;}if(category==='equipments')return true;return false;}function isSearchExcludedTable(item,table){const category=norm(item?.sourceDataset||item?.category||'');if(!Array.isArray(table)||!table.length)return false;const firstRow=Array.isArray(table[0])?table[0]:[];const first0=norm(firstRow[0]||'');const first1=norm(firstRow[1]||'');if(category==='equipments'){if(first0==='武将')return true;return false;}if(category==='generals'){if(first0==='名宝'&&first1==='技能効果')return true;return false;}return false;}function sanitizeRawForSearch(item,raw){if(!raw||typeof raw!=='object')return raw;const clone=JSON.parse(JSON.stringify(raw));delete clone.textSample;if(Array.isArray(clone.sections)){clone.sections=clone.sections.filter(sec=>!isSearchExcludedSection(item,sec));}if(Array.isArray(clone.tables)){clone.tables=clone.tables.filter(tbl=>!isSearchExcludedTable(item,tbl));}return clone;}function buildSearchableText(item){const base=[item?.name,item?.title,item?.description,item?.sourceName,item?.sourceGeneral,item?.raw?.sourceGeneral,...(Array.isArray(item?.sourceNames)?item.sourceNames:[]),...(Array.isArray(item?.searchTokens)?item.searchTokens:[])].filter(Boolean).map(v=>norm(v)).join(' ');const sections=(Array.isArray(item?.sections)?item.sections:[]).filter(sec=>!isSearchExcludedSection(item,sec)).map(sec=>[sec?.title,...(Array.isArray(sec?.content)?sec.content:[])].filter(Boolean).join(' ')).join(' ');const tables=(Array.isArray(item?.tables)?item.tables:[]).filter(tbl=>!isSearchExcludedTable(item,tbl)).map(tbl=>stringifyWithoutTextSample(tbl)).join(' ');const rawForSearch=sanitizeRawForSearch(item,item?.raw);const rawText=typeof rawForSearch==='object'?stringifyWithoutTextSample(rawForSearch):String(rawForSearch||'');const tacticAttackText=detailCategory(item)==='tactics'||detailCategory(item)==='generals'?buildTacticAttackSearchText(item):'';return norm([base,sections,tables,rawText,tacticAttackText].filter(Boolean).join(' ')).toLowerCase();}

const DERIVED_SEARCH_CATEGORY_ALIASES={generals:'generals',tactics:'tactics',skills:'skills',equipments:'equipments',statusEffects:'status_effects',status_effects:'status_effects',siegeWeapons:'siege_weapons',siege_weapons:'siege_weapons',ethnicArmaments:'ethnic_armaments',ethnic_armaments:'ethnic_armaments',ethnicResearchSkills:'ethnic_research_skills',ethnic_research_skills:'ethnic_research_skills',formations:'formations',fiveElements:'five_elements',five_elements:'five_elements',warhorses:'warhorses',warhorseSkills:'warhorse_skills',warhorse_skills:'warhorse_skills'};
function normalizeDerivedSearchCategory(value){const key=norm(value||'');return DERIVED_SEARCH_CATEGORY_ALIASES[key]||key;}
function getDerivedSearchIndexItems(){const bucket=state?.derivedData?.searchIndex;return bucket&&bucket.available&&Array.isArray(bucket.items)?bucket.items:[];}
function makeDerivedSearchIndexKey(category,name){return `${normalizeDerivedSearchCategory(category)}::${norm(name||'').toLowerCase()}`;}

function isDetailRichSearchCategory(cat){const c=normalizeDerivedSearchCategory(cat||'');return c==='siege_weapons'||c==='ethnic_armaments'||c==='warhorses';}
function formatDetailValueForDisplay(value){
  if(value===null||value===undefined||value==='')return '-';
  if(typeof value==='number'&&Number.isFinite(value))return String(Number.isInteger(value)?value:Number(value.toFixed(2)));
  if(typeof value==='string')return norm(value)||'-';
  if(Array.isArray(value)){
    const parts=value.map(v=>formatDetailValueForDisplay(v)).filter(v=>v&&v!=='-');
    return parts.length?parts.join(' / '):'-';
  }
  if(typeof value==='object'){
    const parts=[];
    Object.entries(value).forEach(([k,v])=>{
      const vv=formatDetailValueForDisplay(v);
      if(vv&&vv!=='-')parts.push(`${k}:${vv}`);
    });
    return parts.length?parts.join(' / '):'-';
  }
  return String(value);
}
function buildHadouExtensionFullSearchText(item){
  const parts=[];
  const add=v=>{const s=norm(v);if(s&&s!=='-')parts.push(s);};
  add(DATASET_LABELS[detailCategory(item)]||item?.category||'');
  add(item?.name||item?.title||'');add(item?.description||'');add(item?.troopType||'');add(item?.ethnicGroup||'');
  add(item?.additionalEffect||'');add(item?.additionalEffectDescription||'');
  const levels=Array.isArray(item?.levels)?item.levels:[];
  levels.forEach(levelData=>{
    add(levelData?.level?`Lv${levelData.level}`:'');
    HADO_EXTENSION_LEVEL_PARAM_SPECS.forEach(([key,label,unit])=>{
      const val=levelData?.[key];
      if(val===null||val===undefined||val==='')return;
      const formatted=formatHadouExtensionParamValue(val,unit||'');
      add(label);add(formatted);add(`${label}${formatted}`);add(`${label} ${formatted}`);
    });
    add(formatDetailValueForDisplay(levelData));
  });
  const raw=item?.raw&&typeof item.raw==='object'?item.raw:null;
  if(raw){add(raw.source_url||raw.url||'');add(formatDetailValueForDisplay(raw));}
  return norm([...new Set(parts)].join(' ')).toLowerCase();
}
function buildWarhorseMasterFullSearchText(item){
  const parts=[];const add=v=>{const s=norm(v);if(s&&s!=='-')parts.push(s);};
  add('名馬');add('軍馬');add(item?.name||item?.title||'');add(getWarhorseMasterKind(item)==='famous'?'名馬':'通常馬');
  add(item?.fixedSkillName||item?.fixedSkillId||'');
  const stats=(item?.stats&&typeof item.stats==='object')?item.stats:((item?.baseStats&&typeof item.baseStats==='object')?item.baseStats:{});
  Object.entries(stats).forEach(([k,v])=>{add(k);add(formatDetailValueForDisplay(v));add(`${k}${formatDetailValueForDisplay(v)}`);});
  const levelMap=item?.starFixedSkillLevels&&typeof item.starFixedSkillLevels==='object'?item.starFixedSkillLevels:{};
  Object.entries(levelMap).forEach(([star,lv])=>{add(`将星${star}`);add(`固有技能Lv${formatDetailValueForDisplay(lv)}`);});
  buildWarhorseStarEffectRows(item?.starEffects||{}).forEach(row=>{add(row[0]);add(row[1]);add(`${row[0]} ${row[1]}`);});add(formatDetailValueForDisplay(item?.raw||''));
  return norm([...new Set(parts)].join(' ')).toLowerCase();
}
function buildDetailRichSearchText(item,entrySearchText=''){
  const cat=normalizeDerivedSearchCategory(detailCategory(item));
  const detailText=(cat==='siege_weapons'||cat==='ethnic_armaments')?buildHadouExtensionFullSearchText(item):(cat==='warhorses'?buildWarhorseMasterFullSearchText(item):'');
  const fallback=buildSearchableText(item);
  return norm([entrySearchText,detailText,fallback].filter(Boolean).join(' ')).toLowerCase();
}
function buildDerivedSearchIndexLookup(){const items=getDerivedSearchIndexItems();const byName=new Map();const byRawName=new Map();const byTitle=new Map();items.forEach(entry=>{const cat=normalizeDerivedSearchCategory(entry?.category||'');const names=[entry?.name,entry?.rawName,entry?.title].map(v=>norm(v)).filter(Boolean);names.forEach((name,idx)=>{const map=idx===0?byName:(idx===1?byRawName:byTitle);const key=makeDerivedSearchIndexKey(cat,name);if(!map.has(key))map.set(key,entry);});});return {available:items.length>0,count:items.length,byName,byRawName,byTitle};}
function getDerivedSearchIndexEntry(item,lookup){if(!item||!lookup||!lookup.available)return null;const cat=normalizeDerivedSearchCategory(detailCategory(item));const names=[getItemDisplayName(item),item?.name,item?.rawName,item?.title,item?.raw?.name,item?.raw?.title].map(v=>norm(v)).filter(Boolean);for(const name of names){const key=makeDerivedSearchIndexKey(cat,name);const hit=lookup.byName.get(key)||lookup.byRawName.get(key)||lookup.byTitle.get(key);if(hit)return hit;}return null;}
function applyDerivedSearchIndexToItems(allItems){const lookup=buildDerivedSearchIndexLookup();const diag={available:!!lookup.available,indexItems:lookup.count||0,totalItems:Array.isArray(allItems)?allItems.length:0,applied:0,fallback:0,byCategory:{}};if(!Array.isArray(allItems)||!lookup.available){diag.fallback=Array.isArray(allItems)?allItems.length:0;state.diagnostics.searchIndex=diag;debugStartup('derived search index apply',diag);debugLog('derivedSearchIndex:apply',diag);return diag;}allItems.forEach(item=>{const cat=normalizeDerivedSearchCategory(detailCategory(item)||'unknown');if(!diag.byCategory[cat])diag.byCategory[cat]={total:0,applied:0,fallback:0};diag.byCategory[cat].total++;const entry=getDerivedSearchIndexEntry(item,lookup);if(entry&&norm(entry.searchText||'')){const mergedSearchText=isDetailRichSearchCategory(cat)?buildDetailRichSearchText(item,entry.searchText):norm(entry.searchText).toLowerCase();item._searchableText=mergedSearchText;item._derivedSearchIndexHit=true;item._derivedSearchIndexId=entry.id||'';if(isDetailRichSearchCategory(cat))item._derivedSearchIndexMergedDetail=true;diag.applied++;diag.byCategory[cat].applied++;}else{item._searchableText=isDetailRichSearchCategory(cat)?buildDetailRichSearchText(item,''):buildSearchableText(item);item._derivedSearchIndexHit=false;diag.fallback++;diag.byCategory[cat].fallback++;}});state.diagnostics.searchIndex=diag;debugStartup('derived search index apply',diag);debugLog('derivedSearchIndex:apply',diag);return diag;}
function buildDerivedResultCardIndexLookup(){const items=getDerivedRelatedBucketItems('resultCardIndex');const byName=new Map();const byRawName=new Map();const byTitle=new Map();items.forEach(entry=>{const cat=normalizeDerivedSearchCategory(entry?.category||'');[[entry?.name,byName],[entry?.rawName,byRawName],[entry?.title,byTitle],[entry?.displayName,byName]].forEach(([value,map])=>{const name=norm(value);if(!name)return;const key=makeDerivedSearchIndexKey(cat,name);if(!map.has(key))map.set(key,entry);});});return {available:items.length>0,count:items.length,byName,byRawName,byTitle};}
function getDerivedResultCardEntry(item,lookup){if(!item||!lookup||!lookup.available)return null;const cat=normalizeDerivedSearchCategory(detailCategory(item));const names=[getItemDisplayName(item),item?.name,item?.rawName,item?.title,item?.raw?.name,item?.raw?.title].map(v=>norm(v)).filter(Boolean);for(const name of names){const key=makeDerivedSearchIndexKey(cat,name);const hit=lookup.byName.get(key)||lookup.byRawName.get(key)||lookup.byTitle.get(key);if(hit)return hit;}return null;}
function applyDerivedResultCardIndexToItems(allItems){const lookup=buildDerivedResultCardIndexLookup();const diag={available:!!lookup.available,indexItems:lookup.count||0,totalItems:Array.isArray(allItems)?allItems.length:0,applied:0,fallback:0,byCategory:{}};if(!Array.isArray(allItems)||!lookup.available){diag.fallback=Array.isArray(allItems)?allItems.length:0;state.diagnostics.resultCardIndex=diag;debugStartup('derived result card index apply',diag);debugLog('derivedResultCardIndex:apply',diag);return diag;}allItems.forEach(item=>{const cat=normalizeDerivedSearchCategory(detailCategory(item)||'unknown');if(!diag.byCategory[cat])diag.byCategory[cat]={total:0,applied:0,fallback:0};diag.byCategory[cat].total++;const entry=getDerivedResultCardEntry(item,lookup);if(entry){item._resultCardIndex=entry;item._derivedResultCardIndexHit=true;diag.applied++;diag.byCategory[cat].applied++;}else{item._derivedResultCardIndexHit=false;diag.fallback++;diag.byCategory[cat].fallback++;}});state.diagnostics.resultCardIndex=diag;debugStartup('derived result card index apply',diag);debugLog('derivedResultCardIndex:apply',diag);return diag;}
function getResultCardIndexForRow(row){return row?.item?._resultCardIndex||null;}
function getResultCardDisplayName(row){const card=getResultCardIndexForRow(row);return norm(card?.displayName||card?.name||row?.item?.name||row?.item?.title||'-');}
function getResultCardSubtitle(row){const card=getResultCardIndexForRow(row);const subtitle=norm(card?.subtitle||'');if(subtitle)return subtitle;const rawSubTitle=row?.item?.title&&row.item.title!==row.item.name?row.item.title:'';return /^【三國志 覇道】/.test(norm(rawSubTitle))?'':norm(rawSubTitle);}
function getResultCardBadgesHtml(row){const card=getResultCardIndexForRow(row);const badges=Array.isArray(card?.badges)?card.badges.map(norm).filter(Boolean).filter(isAllowedSearchResultBadge).slice(0,4):[];if(!badges.length)return '';return badges.map(v=>`<span class="search-result-mini-badge is-dataset">${esc(v)}</span>`).join('');}
function getResultCardOptionLabel(row){const card=getResultCardIndexForRow(row);return norm(card?.optionLabel||card?.displayName||card?.name||row?.item?.name||row?.item?.title||'-');}
function buildDerivedTagIndexLookup(){const bucket=state?.derivedData?.tagIndex;const items=bucket&&bucket.available&&Array.isArray(bucket.items)?bucket.items:[];const byName=new Map();const byKey={};const tagSet=new Set();const blockedTags=new Set();items.forEach(entry=>{const cat=normalizeDerivedSearchCategory(entry?.category||'');const tags=(Array.isArray(entry?.tags)?entry.tags:[]).map(norm).filter(Boolean).filter(tag=>{if(isAllowedSearchTag(tag))return true;blockedTags.add(tag);return false;});if(!cat||!tags.length)return;[entry?.name,entry?.rawName,entry?.title,entry?.displayName].map(norm).filter(Boolean).forEach(name=>{const key=makeDerivedSearchIndexKey(cat,name);if(!byName.has(key))byName.set(key,tags);});tags.forEach(tag=>{tagSet.add(tag);const p=tag.indexOf(':');const k=p>=0?tag.slice(0,p):'その他';if(!byKey[k])byKey[k]=new Set();byKey[k].add(tag);});});const tagGroups=bucket&&bucket.available&&bucket.meta&&bucket.meta.tagGroups;return {available:items.length>0,count:items.length,byName,tagSet,byKey,blockedTags:[...blockedTags].sort((a,b)=>a.localeCompare(b,'ja'))};}
function applyDerivedTagIndexToItems(allItems){const lookup=buildDerivedTagIndexLookup();const diag={available:!!lookup.available,indexItems:lookup.count||0,totalItems:Array.isArray(allItems)?allItems.length:0,applied:0,fallback:0,tagCount:lookup.tagSet?lookup.tagSet.size:0,blockedTagCount:Array.isArray(lookup.blockedTags)?lookup.blockedTags.length:0,blockedTags:lookup.blockedTags||[],byCategory:{}};if(!Array.isArray(allItems)||!lookup.available){diag.fallback=Array.isArray(allItems)?allItems.length:0;state.diagnostics.tagIndex=diag;debugLog('tagSearch:derived-index-fallback',diag);return false;}allItems.forEach(item=>{const cat=normalizeDerivedSearchCategory(detailCategory(item)||'unknown');if(!diag.byCategory[cat])diag.byCategory[cat]={total:0,applied:0,fallback:0};diag.byCategory[cat].total++;const names=[getItemDisplayName(item),item?.name,item?.rawName,item?.title,item?.raw?.name,item?.raw?.title].map(norm).filter(Boolean);let tags=null;for(const name of names){const hit=lookup.byName.get(makeDerivedSearchIndexKey(cat,name));if(hit){tags=hit;break;}}if(tags){item._detailTags=[...new Set(tags)];item._derivedTagIndexHit=true;diag.applied++;diag.byCategory[cat].applied++;}else{item._derivedTagIndexHit=false;diag.fallback++;diag.byCategory[cat].fallback++;}});state.availableTags=[...lookup.tagSet].sort((a,b)=>a.localeCompare(b,'ja'));state.availableTagsByKey=Object.fromEntries(Object.entries(lookup.byKey).map(([k,set])=>[k,[...set].sort((a,b)=>a.localeCompare(b,'ja'))]));state.selectedTags=(state.selectedTags||[]).filter(t=>lookup.tagSet.has(t));state.diagnostics.tagIndex=diag;debugLog('tagSearch:derived-index-built',diag);return true;}
function shouldUseCompactBroadResultRendering(rows,q,nameOnlySearch){return Array.isArray(rows)&&rows.length>100&&!q&&!nameOnlySearch&&!(state.selectedTags||[]).length&&!state.quickStatusEffectOwnerFilter;}
function getSearchResultRenderSessionKey(q,nameOnlySearch){return JSON.stringify({q,nameOnlySearch,viewMode:state.viewMode,active:state.activeCategories,selectedTags:state.selectedTags||[],quick:state.quickStatusEffectOwnerFilter||null});}
function getSearchResultRenderLimit(rows,q,nameOnlySearch){if(!Array.isArray(rows))return 0;const sessionKey=getSearchResultRenderSessionKey(q,nameOnlySearch);if(state.searchResultRenderSessionKey!==sessionKey){state.searchResultRenderSessionKey=sessionKey;state.searchResultRenderLimit=shouldUseCompactBroadResultRendering(rows,q,nameOnlySearch)?100:1000;}return Math.min(rows.length,Math.max(1,Number(state.searchResultRenderLimit)||100));}
function increaseSearchResultRenderLimit(){state.searchResultRenderLimit=Math.min((state.lastResultRows||[]).length,(Number(state.searchResultRenderLimit)||100)+100);debugLog('searchResultRender:increase',{limit:state.searchResultRenderLimit,total:(state.lastResultRows||[]).length});renderSearchResults();}
function getDerivedStatusEffectGroupOwnerIndex(group){const items=getDerivedRelatedBucketItems('statusEffectGroupOwnerIndex');const target=norm(group);return items.find(entry=>norm(entry?.groupKey||'')===target)||null;}

// FIX[HADO-2.9.0.12-QUICK-STATUS-GENERAL-TACTIC-OWNER]:
// 状態変化クイック検索で、戦法データの状態変化を戦法の sourceGeneral にも展開する。
// 武将ページ内の専用名宝欄は使わず、hadou_tactics.json の戦法正本だけを参照する。
function normalizeTacticSourceGeneralName(name){
  const raw=norm(name||'');
  if(!raw)return '';
  const cleaned=typeof cleanArticleTitleForLink==='function'?cleanArticleTitleForLink(raw):raw;
  return normalizeSaveItemName(cleaned||raw);
}
function getTacticSourceGeneralNames(tactic){
  const candidates=[tactic?.sourceGeneral,tactic?.sourceGeneralName,tactic?.generalName,tactic?.ownerName,tactic?.sourceName,tactic?.raw?.sourceGeneral,tactic?.raw?.sourceGeneralName].filter(Boolean);
  const out=[];
  candidates.forEach(v=>{
    const a=normalizeTacticSourceGeneralName(v);
    const b=normalizeSaveItemName(v);
    [a,b].forEach(n=>{if(n&&!out.includes(n))out.push(n);});
  });
  return out;
}
function getQuickStatusEffectTacticNamesForGeneralName(generalName){
  const target=normalizeSaveItemName(generalName);
  if(!target)return [];
  const out=[];
  (Array.isArray(state?.tactics)?state.tactics:[]).forEach(tactic=>{
    const owners=getTacticSourceGeneralNames(tactic);
    if(!owners.includes(target))return;
    const name=getItemDisplayName(tactic);
    if(name&&!out.includes(name))out.push(name);
  });
  return out;
}
function getQuickStatusEffectSourceGeneralNamesForTacticName(tacticName){
  const target=norm(tacticName);
  if(!target)return [];
  const out=[];
  (Array.isArray(state?.tactics)?state.tactics:[]).forEach(tactic=>{
    const names=[getItemDisplayName(tactic),tactic?.name,tactic?.title,tactic?.rawName,tactic?.raw?.name,tactic?.raw?.title].map(norm).filter(Boolean);
    if(!names.includes(target))return;
    getTacticSourceGeneralNames(tactic).forEach(n=>{if(n&&!out.includes(n))out.push(n);});
  });
  return out;
}
function quickStatusEffectItemMatchesNormalizedName(item,name){
  const target=normalizeSaveItemName(name);
  if(!target)return false;
  const values=[getItemDisplayName(item),item?.name,item?.title,item?.rawName,item?.raw?.name,item?.raw?.title,item?.raw?.rawName].map(normalizeSaveItemName).filter(Boolean);
  return values.includes(target);
}
function addQuickGroupSourceGeneralsForTacticOwner(bucket,tacticName,hit){
  getQuickStatusEffectSourceGeneralNamesForTacticName(tacticName).forEach(owner=>{
    addQuickGroupOwnerName(bucket,'generals',owner,{...hit,reason:'tactic-source-general-status-group-index',sourceText:`戦法:${norm(tacticName)}→${owner}`,matchedText:norm(tacticName)});
  });
}

function buildQuickStatusEffectGroupOwnerNameIndexFromGeneratedJson(filter){const group=norm(filter?.group||'');if(!isQuickStatusEffectGroupOwnerFilter(filter)||!group)return null;const entry=getDerivedStatusEffectGroupOwnerIndex(group);if(!entry||!entry.owners)throw new Error(`hadou_status_effect_group_owner_index.json に ${group} がありません。最新JSON一式を再読込してください。`);const cacheKey=['generated',group,getQuickStatusEffectGroupCacheVersionKey()].join('@@');const cache=state._quickStatusEffectGroupOwnerIndexCache||{};if(cache[cacheKey])return {...cache[cacheKey],cacheHit:true};const started=performance.now();const bucket={generals:new Map(),tactics:new Map(),skills:new Map(),equipments:new Map(),statusEffects:new Map()};let ownerEntries=0;Object.entries(entry.owners||{}).forEach(([cat,owners])=>{const normalizedCat=normalizeDerivedSearchCategory(cat);if(!bucket[normalizedCat])return;(Array.isArray(owners)?owners:[]).forEach(owner=>{const ownerName=getDerivedRelatedOwnerName(owner);if(!ownerName)return;ownerEntries++;const hit={name:norm(owner?.statusEffectName||owner?.matchedText||entry.groupLabel||filter.label||''),groupKey:group,relationType:norm(owner?.relationType||''),reason:'generated-status-group-owner-index',sourceText:norm(owner?.source||owner?.sourceText||'hadou_status_effect_group_owner_index.json'),matchedText:norm(owner?.matchedText||owner?.statusEffectName||''),targetSide:entry.targetSide||statusEffectGroupDefaultTargetSide(group)};addQuickGroupOwnerName(bucket,normalizedCat,ownerName,hit);if(normalizedCat==='tactics')addQuickGroupSourceGeneralsForTacticOwner(bucket,ownerName,hit);});});if(ownerEntries<=0)debugLog('searchUx:generated-group-owner-index-empty',{source:'HADO-2.9.0.34',group,label:filter?.label||'',reason:'正本JSONのownerEntriesが0件。アプリ側フォールバックは行わない'});const result={bucket,group,cacheHit:false,buildMs:Number((performance.now()-started).toFixed(1)),source:'generated-status-effect-group-owner-index-canonical',relationEntries:ownerEntries,parameterEntries:0,countermeasureEntries:0};state._quickStatusEffectGroupOwnerIndexCache={...cache,[cacheKey]:result};return result;}

function buildReferencedSkillSearchText(item){
const category=norm(item?.sourceDataset||item?.category||'');
if(category!=='generals')return '';
const skillNames=[];
const pushName=name=>{const s=norm(name);if(s)skillNames.push(s);};
(Array.isArray(item?.skills)?item.skills:[]).forEach(skill=>{if(typeof skill==='string')pushName(skill);else pushName(skill?.name||skill?.title);});
(Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{
(Array.isArray(sec?.content)?sec.content:[]).forEach(line=>{
const src=normalizeMetricSourceText(line);
if(!src)return;
for(const skill of Array.isArray(state?.skills)?state.skills:[]){
const name=norm(skill?.name||skill?.title||'');
if(name&&src.includes(name))pushName(name);
}
});
});
const uniqNames=[...new Set(skillNames)];
const parts=[];
uniqNames.forEach(name=>{
const hit=(Array.isArray(state?.skills)?state.skills:[]).find(skill=>norm(skill?.name||skill?.title||'')===name);
if(!hit)return;
parts.push(name);
(Array.isArray(hit?.sections)?hit.sections:[]).forEach(sec=>{
parts.push(norm(sec?.title||''));
(Array.isArray(sec?.content)?sec.content:[]).forEach(v=>parts.push(norm(v)));
});
(Array.isArray(hit?.tables)?hit.tables:[]).forEach(tbl=>parts.push(stringifyWithoutTextSample(tbl)));
const rawForSearch=sanitizeRawForSearch(hit,hit?.raw||hit);
parts.push(typeof rawForSearch==='object'?stringifyWithoutTextSample(rawForSearch):String(rawForSearch||''));
});
return normalizeMetricSourceText(parts.join(' '));
}

function makeSearchCacheStats(){
  const cats=['generals','tactics','skills','equipments','statusEffects'];
  const obj={parameterSearchText:{hit:0,miss:0,bypass:0},metricSource:{hit:0,miss:0,bypass:0},byCategory:{}};
  cats.forEach(k=>obj.byCategory[k]={parameterSearchText:{hit:0,miss:0,bypass:0},metricSource:{hit:0,miss:0,bypass:0}});
  return obj;
}
function searchCacheCategoryKey(item){return detailCategory(item)||'unknown';}
function bumpSearchCacheStat(type,kind,item){
  if(!state._searchCacheStats)state._searchCacheStats=makeSearchCacheStats();
  const root=state._searchCacheStats[type];if(root&&Object.prototype.hasOwnProperty.call(root,kind))root[kind]++;
  const key=searchCacheCategoryKey(item);const cat=state._searchCacheStats.byCategory[key];
  if(cat&&cat[type]&&Object.prototype.hasOwnProperty.call(cat[type],kind))cat[type][kind]++;
}
function recordDerivedParameterSummaryUsage(kind,item,extra={}){
  try{
    if(!state.diagnostics)state.diagnostics={};
    const key=detailCategory(item)||'unknown';
    const diag=state.diagnostics.derivedParameterSummaryUsage||{source:'hadou_parameter_summary_index.json',policy:'全データ表示のみ派生JSONを優先利用。保存データ表示は将星・技能Lv・装備段階を反映するため従来計算を維持。',used:0,miss:0,fallback:0,empty:0,byCategory:{},last:null};
    if(!diag.byCategory[key])diag.byCategory[key]={used:0,miss:0,fallback:0,empty:0};
    if(Object.prototype.hasOwnProperty.call(diag,kind))diag[kind]++;
    if(Object.prototype.hasOwnProperty.call(diag.byCategory[key],kind))diag.byCategory[key][kind]++;
    diag.last={kind,category:key,name:getItemDisplayName(item),timestamp:debugTimestamp(),...extra};
    state.diagnostics.derivedParameterSummaryUsage=diag;
  }catch{}
}
function buildDerivedParameterSummarySearchText(item){
  try{
    if(state.viewMode!=='all'||!item)return null;
    if(typeof getDerivedParameterSummaryEntry!=='function')return null;
    const entry=getDerivedParameterSummaryEntry(detailCategory(item),getItemDisplayName(item));
    if(!entry||!Array.isArray(entry.effects)){recordDerivedParameterSummaryUsage('miss',item,{reason:'entry-not-found'});return null;}
    if(!entry.effects.length){recordDerivedParameterSummaryUsage('empty',item,{reason:'effects-empty'});return '';} 
    const parts=[];
    entry.effects.forEach(effect=>{
      const parameter=norm(effect?.parameter||effect?.key||'');
      const value=norm(effect?.value||'');
      const matched=norm(effect?.matchedText||effect?.text||'');
      const direction=norm(effect?.direction||'');
      const targetSide=norm(effect?.targetSide||'');
      const timing=norm(effect?.timing||effect?.phase||'');
      const display=parameter?parameterSummaryDisplayName(parameter,{maxTotal:/decrease|低下|減少|^-/.test(`${direction} ${value}`)?-1:1,total:/decrease|低下|減少|^-/.test(`${direction} ${value}`)?-1:1}):'';
      [parameter,display,value,matched,direction,targetSide,timing,parameter&&value?`${parameter} ${value}`:'',display&&value?`${display} ${value}`:'',timing&&parameter?`${timing} ${parameter}`:'',timing&&display?`${timing} ${display}`:''].forEach(v=>{const t=norm(v);if(t)parts.push(t);});
    });
    const text=norm([...new Set(parts)].join(' ')).toLowerCase();
    recordDerivedParameterSummaryUsage('used',item,{effectCount:entry.effects.length,textLength:text.length});
    return text;
  }catch(err){
    recordDerivedParameterSummaryUsage('fallback',item,{reason:'exception',message:err?.message||String(err)});
    debugLog('derivedParameterSummary:searchText:error',{item:getItemDisplayName(item),message:err?.message||String(err)});
    return null;
  }
}
function buildParameterSummarySearchText(item){
  if(state.viewMode==='all'&&item&&Object.prototype.hasOwnProperty.call(item,'_parameterSummarySearchTextAll')){bumpSearchCacheStat('parameterSearchText','hit',item);return item._parameterSummarySearchTextAll||'';}
  if(state.viewMode==='all'&&item){
    const derivedText=buildDerivedParameterSummarySearchText(item);
    if(derivedText!==null){item._parameterSummarySearchTextAll=derivedText||'';bumpSearchCacheStat('parameterSearchText','hit',item);return derivedText||'';}
  }
  if(state.viewMode==='saved'&&item){
    const key=state.savedSearchCacheKey||buildSavedSearchCacheKey(getCurrentSave());
    const cached=item._parameterSummarySearchTextSaved;
    if(cached&&cached.key===key){bumpSearchCacheStat('parameterSearchText','hit',item);return cached.text||'';}
    bumpSearchCacheStat('parameterSearchText','miss',item);
  }else if(state.viewMode!=='all')bumpSearchCacheStat('parameterSearchText','bypass',item);else bumpSearchCacheStat('parameterSearchText','miss',item);
  try{
    const entries=buildParameterCopyEntries(item,'');
    const parts=[];
    entries.forEach(e=>{
      parts.push(e.timing,e.key,e.value,`${e.key} ${e.value}`,`${e.timing} ${e.key} ${e.value}`);
    });
    const text=norm(parts.join(' ')).toLowerCase();
    if(state.viewMode==='all'&&item)item._parameterSummarySearchTextAll=text;
    if(state.viewMode==='saved'&&item)item._parameterSummarySearchTextSaved={key:state.savedSearchCacheKey||buildSavedSearchCacheKey(getCurrentSave()),text};
    return text;
  }catch(err){
    debugLog('search:parameter-summary:error',{item:getItemDisplayName(item),message:err?.message||String(err)});
    return '';
  }
}
function getFastSearchableText(item){
  if(!item)return '';
  if(Object.prototype.hasOwnProperty.call(item,'_searchableTextNorm'))return item._searchableTextNorm||'';
  const raw=item._searchableText||buildSearchableText(item)||'';
  const text=String(raw).toLowerCase();
  item._searchableTextNorm=text;
  return text;
}
function isParameterSummarySearchKeyword(q){
  const key=norm(q||'').toLowerCase();
  if(!key)return false;
  const paramKeys=(typeof allParameterSummaryKeys==='function')?allParameterSummaryKeys():new Set();
  if(paramKeys.has(key))return true;
  if(['戦法発動時','出陣時','通常時','駐屯防衛時'].includes(key))return true;
  if(/[+\-＋－%％]/.test(key))return true;
  return /ダメージ|ゲージ|速度|確率|攻撃|防御|兵力|知力|会心|撃心|威力|耐性|特効|射程|対象数|負傷兵|兵科相性/.test(key);
}
function buildRuntimeSearchableText(item,keyword=''){
  const base=getFastSearchableText(item);
  const q=norm(keyword||'').toLowerCase();
  if(!isParameterSummarySearchKeyword(q))return base;
  const param=buildParameterSummarySearchText(item);
  return param?`${base} ${param}`:base;
}

function currentKeyword(){return norm(els.searchInput.value||'');}
function isNameOnlySearch(){return !!(els.nameOnlySearchToggle&&els.nameOnlySearchToggle.checked);}
function currentSearchContext(){const keyword=currentKeyword();if(!keyword)return null;const parsed=parseMetricSearchKeyword(keyword);if(parsed)return parsed;return {raw:keyword,base:keyword,sign:'',numberText:'',unit:'',position:'plain',mode:'plain'};}
function normalizeMetricSearchText(value){return String(value??'').replace(/[＋﹢]/g,'+').replace(/[－−‐‑‒–—―ー﹣]/g,'-').replace(/％/g,'%').replace(/\s+/g,' ').trim();}
function parseMetricSearchKeyword(keyword){const raw=normalizeMetricSearchText(keyword||'');if(!raw)return null;const prefix=raw.match(/^([+-]?)(\d+(?:\.\d+)?)(%)?(.+)$/);if(prefix){const base=norm(prefix[4]||'');if(base)return {raw:norm(raw),base,sign:prefix[1]||'',numberText:String(prefix[2]||''),unit:prefix[3]||'',position:'prefix',mode:'numeric'};}const suffix=raw.match(/^(.+?)([+-]?)(\d+(?:\.\d+)?)(%)?$/);if(suffix){const base=norm(suffix[1]||'');if(base)return {raw:norm(raw),base,sign:suffix[2]||'',numberText:String(suffix[3]||''),unit:suffix[4]||'',position:'suffix',mode:'numeric'};}const trailing=raw.match(/^(.+?)([+-])$/);if(trailing){const base=norm(trailing[1]||'');if(base)return {raw:norm(raw),base,sign:trailing[2]||'',numberText:'',unit:'',position:'suffix-sign',mode:'sign-only'};}return null;}
function normalizeMetricSourceText(text){return normalizeMetricSearchText(text||'');}
function pushMetricSegments(out,value){const text=norm(value);if(text)out.push(text);}
function appendTableTextsInDisplayOrder(out,tables){(Array.isArray(tables)?tables:[]).forEach(table=>{(Array.isArray(table)?table:[]).forEach(row=>{if(Array.isArray(row))row.forEach(cell=>pushMetricSegments(out,cell));else pushMetricSegments(out,row);});});}
function buildSavedModeMetricSourceSegments(item){
  const out=[];
  const category=detailCategory(item);
  if(category==='generals'){
    const sources=collectParameterSourceRecords(item).filter(s=>s.kind==='include');
    sources.forEach(src=>{pushMetricSegments(out,src.source);pushMetricSegments(out,src.text);});
    if(state._savedMetricDebugCount===undefined)state._savedMetricDebugCount=0;
    if(state._savedMetricDebugCount<30){state._savedMetricDebugCount++;debugLog('saved-parameter-list:metric-source',{item:getItemDisplayName(item),sourceCount:sources.length,sources:sources.map(s=>s.source).slice(0,20)});}
    return out;
  }
  return null;
}
function buildMetricSourceSegmentsUncached(item){const savedSegs=(state.viewMode==='saved')?buildSavedModeMetricSourceSegments(item):null;if(savedSegs)return savedSegs;const out=[];const category=detailCategory(item);if(category==='generals'){const sections=(Array.isArray(item?.sections)?item.sections:[]);sections.filter(sec=>!isAdvisorSkillParentSection(sec)&&isGeneralSkillSection(item,sec)).forEach(sec=>{pushMetricSegments(out,sec?.title);const filtered=filterSkillContentLines(sec?.content||[]);filtered.forEach(line=>pushMetricSegments(out,line));getReferencedSkillEntriesFromLines(filtered).filter(entry=>entry.found).forEach(entry=>{pushMetricSegments(out,entry.name);(Array.isArray(entry.content)?entry.content:[]).forEach(line=>pushMetricSegments(out,line));});});const tacticTable=findTacticTable(item);appendTableTextsInDisplayOrder(out,tacticTable?[tacticTable]:[]);const addTable=findAdditionalEffectsTable(item);appendTableTextsInDisplayOrder(out,addTable?[addTable]:[]);const ability=findGeneralAbilityTables(item);appendTableTextsInDisplayOrder(out,[ability.initial,ability.max,ability.elements]);appendTableTextsInDisplayOrder(out,[findTroopBaseTable(item),findTroopLevelTable(item),findGeneralBasicInfoTable(item)]);(Array.isArray(item?.sections)?item.sections:[]).filter(sec=>/^相性の良い/.test(norm(sec?.title||''))&&norm(sec?.title||'')!==`${norm(item?.name||'')}と相性の良い武将`).forEach(sec=>{pushMetricSegments(out,sec?.title);(Array.isArray(sec?.content)?sec.content:[]).forEach(line=>pushMetricSegments(out,line));});findCommentarySections(item).forEach(sec=>{pushMetricSegments(out,sec?.title);(Array.isArray(sec?.content)?sec.content:[]).forEach(line=>pushMetricSegments(out,line));});return out;}if(category==='equipments'){appendTableTextsInDisplayOrder(out,item?.tables||[]);(Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{if(isSearchExcludedSection(item,sec))return;pushMetricSegments(out,sec?.title);(Array.isArray(sec?.content)?sec.content:[]).forEach(line=>pushMetricSegments(out,line));});return out;}(Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{if(isSearchExcludedSection(item,sec))return;pushMetricSegments(out,sec?.title);(Array.isArray(sec?.content)?sec.content:[]).forEach(line=>pushMetricSegments(out,line));});appendTableTextsInDisplayOrder(out,(Array.isArray(item?.tables)?item.tables:[]).filter(tbl=>!isSearchExcludedTable(item,tbl)));return out;}
function buildMetricSourceSegments(item){
  if(state.viewMode==='all'&&item&&Object.prototype.hasOwnProperty.call(item,'_metricSourceSegmentsAll')){bumpSearchCacheStat('metricSource','hit',item);return item._metricSourceSegmentsAll||[];}
  if(state.viewMode==='saved'&&item){
    const key=state.savedSearchCacheKey||buildSavedSearchCacheKey(getCurrentSave());
    const cached=item._metricSourceSegmentsSaved;
    if(cached&&cached.key===key){bumpSearchCacheStat('metricSource','hit',item);return cached.segments||[];}
    bumpSearchCacheStat('metricSource','miss',item);
    const segs=buildMetricSourceSegmentsUncached(item);
    item._metricSourceSegmentsSaved={key,segments:segs};
    return segs;
  }
  if(state.viewMode!=='all')bumpSearchCacheStat('metricSource','bypass',item);else bumpSearchCacheStat('metricSource','miss',item);
  const segs=buildMetricSourceSegmentsUncached(item);
  if(state.viewMode==='all'&&item)item._metricSourceSegmentsAll=segs;
  return segs;
}
function buildMetricSourceText(item){return normalizeMetricSourceText(buildMetricSourceSegments(item).join('。 '));}
function normalizeMetricKeywordVariants(base){const raw=normalizeMetricSearchText(base||'');const variants=[];const push=v=>{const x=normalizeMetricSearchText(v||'');if(x&&!variants.includes(x))variants.push(x);};push(raw);push(raw.replace(/の/g,''));return variants;}
function normalizeMetricSegmentForMatch(value){return normalizeMetricSourceText(value||'').replace(/％/g,'%');}
function buildMetricRangeDisplay(matches){if(!Array.isArray(matches)||!matches.length)return '';const groups=[{unit:'',values:[]},{unit:'%',values:[]}];const seenByUnit={'':new Set(),'%':new Set()};matches.forEach(m=>{const unit=m.unit==='%'?'%':'';const value=Number(m.value);if(!Number.isFinite(value))return;const key=String(value);if(seenByUnit[unit].has(key))return;seenByUnit[unit].add(key);const group=groups.find(g=>g.unit===unit);if(group)group.values.push(value);});const formatValue=(value,unit)=>`${value>0?'+':''}${Number.isInteger(value)?String(value):String(value)}${unit}`;const parts=[];groups.forEach(group=>{if(!group.values.length)return;group.values.sort((a,b)=>a-b);if(group.values.length===1){parts.push(formatValue(group.values[0],group.unit));return;}parts.push(`${formatValue(group.values[0],group.unit)} ～ ${formatValue(group.values[group.values.length-1],group.unit)}`);});return parts.join(', ');}
function collectMetricMatchesFromSegment(segment,keywordVariants,baseOffset){const text=normalizeMetricSegmentForMatch(segment);if(!text)return [];const matches=[];const seen=new Set();(Array.isArray(keywordVariants)?keywordVariants:[]).forEach(keyword=>{const keywordEsc=escRe(keyword);if(!keywordEsc)return;const patterns=[new RegExp(keywordEsc+'\\s*([+-]?)\\s*(\\d+(?:\\.\\d+)?)\\s*([%％])?','gi'),new RegExp('([+-]?)\\s*(\\d+(?:\\.\\d+)?)\\s*([%％])?\\s*'+keywordEsc,'gi')];patterns.forEach(re=>{for(const m of text.matchAll(re)){const sign=(m[1]||'').trim();const numberText=String(m[2]||'').trim();const unit=(m[3]||'').replace('％','%')==='%'?'%':'';const absValue=Number(numberText);if(!Number.isFinite(absValue))continue;const value=sign==='-'?-absValue:absValue;const display=(sign==='-'?'-':'+')+numberText+unit;const index=(typeof m.index==='number'?m.index:0)+baseOffset;const matchedText=norm(m[0]||'');const key=index+'|'+matchedText+'|'+value+'|'+unit;if(seen.has(key))continue;seen.add(key);matches.push({index,matchedText,numberText,unit,value,display});}});});return matches;}
function isMetricOwnerListSegment(segment,itemName){const text=norm(segment);if(!text)return true;const name=norm(itemName||'');if(name&&text.startsWith(name+'を持つ武将'))return true;if(/を持つ武将/.test(text))return true;if(/を強化する装備品/.test(text))return true;if(/を強化する陣形/.test(text))return true;if(/全武将一覧|全装備品一覧|全陣形一覧/.test(text))return true;return false;}
function buildMetricEffectSegmentsForItemNameSearch(item){const itemName=getItemDisplayName(item);const out=[];(Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{if(isSearchExcludedSection(item,sec))return;if(isAdvisorSkillParentSection(sec))return;(Array.isArray(sec?.content)?sec.content:[]).forEach(line=>{if(isMetricOwnerListSegment(line,itemName))return;pushMetricSegments(out,line);});});return out;}
function metricSectionTitleMatches(sec,keywordVariants){const title=normalizeMetricSegmentForMatch(sec?.title||'');if(!title)return false;const compactTitle=title.replace(/の/g,'');return (Array.isArray(keywordVariants)?keywordVariants:[]).some(keyword=>{const k=normalizeMetricSegmentForMatch(keyword||'');return !!k&&(title===k||compactTitle===k.replace(/の/g,''));});}
function buildMetricEffectSegmentsForMatchedSectionTitleSearch(item,keywordVariants){const out=[];(Array.isArray(item?.sections)?item.sections:[]).forEach(sec=>{if(isSearchExcludedSection(item,sec))return;if(isAdvisorSkillParentSection(sec))return;if(!metricSectionTitleMatches(sec,keywordVariants))return;(Array.isArray(sec?.content)?sec.content:[]).forEach(line=>{if(isMetricOwnerListSegment(line,norm(sec?.title||'')))return;pushMetricSegments(out,line);});});return out;}
function collectSignedMetricNumbersFromSegments(segments,baseOffset){const matches=[];const seen=new Set();let offset=baseOffset||0;(Array.isArray(segments)?segments:[]).forEach(segment=>{const text=normalizeMetricSegmentForMatch(segment);const re=/([+-])\s*(\d+(?:\.\d+)?)\s*([%％])?/g;for(const m of text.matchAll(re)){const sign=(m[1]||'').trim();const numberText=String(m[2]||'').trim();const unit=(m[3]||'').replace('％','%')==='%'?'%':'';const absValue=Number(numberText);if(!Number.isFinite(absValue))continue;const value=sign==='-'?-absValue:absValue;const display=(sign==='-'?'-':'+')+numberText+unit;const index=(typeof m.index==='number'?m.index:0)+offset;const matchedText=norm(m[0]||'');const key=index+'|'+matchedText+'|'+value+'|'+unit;if(seen.has(key))continue;seen.add(key);matches.push({index,matchedText,numberText,unit,value,display});}offset+=text.length+1;});return matches;}
function extractMetricFromItem(item,metricSearch){if(!item||!metricSearch||!metricSearch.base)return null;const keywordVariants=normalizeMetricKeywordVariants(metricSearch.base);const itemName=getItemDisplayName(item);const nameVariants=normalizeMetricKeywordVariants(itemName);const isItemNameSearch=keywordVariants.some(v=>nameVariants.includes(v));const segments=buildMetricSourceSegments(item);const matches=[];let offset=0;const seen=new Set();if(isItemNameSearch){collectSignedMetricNumbersFromSegments(buildMetricEffectSegmentsForItemNameSearch(item),0).forEach(m=>{const key=m.index+'|'+m.matchedText+'|'+m.value+'|'+m.unit;if(seen.has(key))return;seen.add(key);matches.push(m);});}
if(!matches.length){collectSignedMetricNumbersFromSegments(buildMetricEffectSegmentsForMatchedSectionTitleSearch(item,keywordVariants),0).forEach(m=>{const key=m.index+'|'+m.matchedText+'|'+m.value+'|'+m.unit;if(seen.has(key))return;seen.add(key);matches.push(m);});}
if(!matches.length){(Array.isArray(segments)?segments:[]).forEach(segment=>{const text=normalizeMetricSegmentForMatch(segment);const segmentMatches=collectMetricMatchesFromSegment(text,keywordVariants,offset);segmentMatches.forEach(m=>{const key=m.index+'|'+m.matchedText+'|'+m.value+'|'+m.unit;if(seen.has(key))return;seen.add(key);matches.push(m);});offset+=text.length+1;});}
if(!matches.length){const source=normalizeMetricSourceText(segments.map(v=>normalizeMetricSegmentForMatch(v)).join('。 '));collectMetricMatchesFromSegment(source,keywordVariants,0).forEach(m=>{const key=m.index+'|'+m.matchedText+'|'+m.value+'|'+m.unit;if(seen.has(key))return;seen.add(key);matches.push(m);});}if(!matches.length)return null;matches.sort((a,b)=>a.index-b.index);const picked=matches[0];const rangeDisplay=buildMetricRangeDisplay(matches)||picked.display;const debugLimit=30;if(!state.searchNumberRangeDebugCount)state.searchNumberRangeDebugCount=0;if(state.searchNumberRangeDebugCount<debugLimit){state.searchNumberRangeDebugCount++;debugLog('searchNumberRange:summary',{keyword:metricSearch.base,keywordVariants,itemName,isItemNameSearch,plain:matches.filter(m=>m.unit!=='%').map(m=>m.display),percent:matches.filter(m=>m.unit==='%').map(m=>m.display),display:rangeDisplay,matchCount:matches.length});}return {...picked,display:rangeDisplay,matchCount:matches.length,matches:matches.map(({index,...rest})=>rest)};}
function buildSearchDebugInfo(metricSearch,rows){return {keyword:currentKeyword(),metricSearch:metricSearch?{base:metricSearch.base,sign:metricSearch.sign,numberText:metricSearch.numberText,unit:metricSearch.unit,position:metricSearch.position,mode:metricSearch.mode}:null,resultCount:rows.length,rows:rows.slice(0,50).map(row=>({label:row.label,name:norm(row.item?.name||row.item?.title||''),metric:row.metric?{display:row.metric.display,value:row.metric.value,matchedText:row.metric.matchedText,matchCount:row.metric.matchCount}:null}))};}
function detailCategory(item){return norm(item?.sourceDataset||item?.category||'');}
function isEquipmentItem(item){return detailCategory(item)==='equipments';}

function isSiegeWeaponItem(item){return detailCategory(item)==='siegeWeapons';}
function isEthnicArmamentItem(item){return detailCategory(item)==='ethnicArmaments';}
function isHadouExtensionEquipmentItem(item){const c=detailCategory(item);return c==='siegeWeapons'||c==='ethnicArmaments';}
const HADO_EXTENSION_LEVEL_PARAM_SPECS=[
  ['maxDurability','最大耐久',''],
  ['attack','攻撃',''],
  ['defense','防御',''],
  ['intelligence','知力',''],
  ['transport','輸送',''],
  ['exploration','探索',''],
  ['mobility','機動',''],
  ['antiObjectPercent','対物','%'],
  ['range','射程',''],
  ['effectAmountPercent','効果量','%'],
  ['durationSeconds','継続','秒'],
  ['effectRange','効果範囲','']
];
function getHadouExtensionMaxLevel(item){const levels=Array.isArray(item?.levels)?item.levels:[];return Math.max(0,...levels.map(v=>Number(v?.level)||0));}
function getHadouExtensionSelectedLevel(item){const max=getHadouExtensionMaxLevel(item);let current=Number(item?._detailSelectedLevel)||0;if(!current||!Array.isArray(item?.levels)||!item.levels.some(v=>Number(v?.level)===current))current=max;return current||1;}
function setHadouExtensionSelectedLevel(item,level){if(!item)return;const max=getHadouExtensionMaxLevel(item);let lv=Number(level)||max||1;if(max)lv=Math.max(1,Math.min(max,lv));item._detailSelectedLevel=lv;}
function getHadouExtensionLevelData(item,level){const levels=Array.isArray(item?.levels)?item.levels:[];const lv=Number(level)||getHadouExtensionSelectedLevel(item);return levels.find(v=>Number(v?.level)===lv)||levels[levels.length-1]||{};}
function formatHadouExtensionParamValue(value,unit=''){if(value===null||value===undefined||value==='')return '-';if(typeof value==='number'&&Number.isFinite(value)){return String(Number.isInteger(value)?value:Number(value.toFixed(2)))+unit;}return String(value)+unit;}
function buildHadouExtensionLevelOptions(item,selectedLevel){const levels=Array.isArray(item?.levels)?item.levels:[];return levels.map(lv=>{const n=Number(lv?.level)||0;return `<option value="${esc(n)}" ${n===selectedLevel?'selected':''}>Lv${esc(n)}</option>`;}).join('');}
function buildHadouExtensionParameterRows(item,level){const data=getHadouExtensionLevelData(item,level);return HADO_EXTENSION_LEVEL_PARAM_SPECS.map(([key,label,unit])=>[label,formatHadouExtensionParamValue(data?.[key],unit)]);}
function buildHadouExtensionDetailHtml(item,categoryKey){const selectedLevel=getHadouExtensionSelectedLevel(item);const maxLevel=getHadouExtensionMaxLevel(item);const basicRows=[['カテゴリ',DATASET_LABELS[categoryKey]||item?.category||'-'],['説明',item?.description||'-'],['兵科',item?.troopType||'-'],['異民族',item?.ethnicGroup||'-'],['最大Lv',maxLevel?`Lv${maxLevel}`:'-']];const levelControl=`<div class="row" style="align-items:center;gap:8px"><label for="hadouExtensionLevelSelect"><strong>表示Lv</strong></label><select id="hadouExtensionLevelSelect" class="hadou-extension-level-select">${buildHadouExtensionLevelOptions(item,selectedLevel)}</select><span class="meta">内容詳細のLv選択は保存データには保存しません。</span></div>`;const paramRows=buildHadouExtensionParameterRows(item,selectedLevel);const addRows=[['追加効果',item?.additionalEffect||'-'],['追加効果説明',item?.additionalEffectDescription||'-']];return `<div class="general-detail-stack"><div class="general-card"><div class="general-card-header">基本情報</div><div class="general-card-body">${renderEquipmentKeyValueRows(basicRows)}</div></div><div class="general-card"><div class="general-card-header">レベル</div><div class="general-card-body">${levelControl}</div></div><div class="general-card"><div class="general-card-header">パラメータ</div><div class="general-card-body">${renderEquipmentKeyValueRows(paramRows)}</div></div><div class="general-card"><div class="general-card-header">追加効果</div><div class="general-card-body">${renderEquipmentKeyValueRows(addRows)}</div></div></div>`;}
function buildHadouExtensionCopyLines(item,categoryKey){const selectedLevel=getHadouExtensionSelectedLevel(item);const lines=[];lines.push('■ 基本情報');lines.push(['説明：'+(item?.description||'-'),'兵科：'+(item?.troopType||'-'),'異民族：'+(item?.ethnicGroup||'-')].join(' / '));lines.push('');lines.push('■ Lv'+selectedLevel+' パラメータ');buildHadouExtensionParameterRows(item,selectedLevel).forEach(([label,value])=>lines.push(label+'：'+value));lines.push('');lines.push('■ 追加効果');lines.push(item?.additionalEffect||'-');if(norm(item?.additionalEffectDescription||'')){lines.push('追加効果説明：'+norm(item.additionalEffectDescription));}return lines;}
function formatHadouExtensionCompactParameterLine(item){const level=getHadouExtensionSelectedLevel(item);const rows=buildHadouExtensionParameterRows(item,level).filter(row=>row[1]&&row[1]!=='-');return `Lv${level}：`+rows.map(row=>row[0]+' '+row[1]).join(' / ');}
function isSectionsOnlyDetailItem(item){const c=detailCategory(item);return c==='equipments'||c==='tactics'||c==='skills';}
function highlight(html,kw){const q=norm(kw);if(!q)return html;const re=new RegExp(`(${escRe(q)})`,'gi');return html.replace(re,'<mark class="search-hit">$1</mark>');}
function highlightDetailTextNodes(root,kw){const q=norm(kw);if(!root||!q)return;const re=new RegExp(`(${escRe(q)})`,'gi');const skipTags=new Set(['SCRIPT','STYLE','PRE','TEXTAREA','INPUT','SELECT','BUTTON']);const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const parent=node.parentElement;if(!parent||skipTags.has(parent.tagName))return NodeFilter.FILTER_REJECT;const text=node.nodeValue||'';if(!text||!re.test(text)){re.lastIndex=0;return NodeFilter.FILTER_REJECT;}re.lastIndex=0;return NodeFilter.FILTER_ACCEPT;}});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);let count=0;nodes.forEach(node=>{const text=node.nodeValue||'';re.lastIndex=0;let last=0;const frag=document.createDocumentFragment();for(const m of text.matchAll(re)){const idx=m.index??0;if(idx>last)frag.appendChild(document.createTextNode(text.slice(last,idx)));const mark=document.createElement('mark');mark.className='search-hit';mark.textContent=m[0];frag.appendChild(mark);last=idx+m[0].length;count++;}if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));node.parentNode.replaceChild(frag,node);});if(count)debugLog('highlightDetailTextNodes',{keyword:q,count});}

function getDatasetByCategory(category){const map={generals:state.generals,tactics:state.tactics,skills:state.skills,equipments:state.equipments,statusEffects:state.statusEffects,siegeWeapons:state.siegeWeapons,ethnicArmaments:state.ethnicArmaments,formations:state.formationMasters,warhorses:getSearchWarhorseItems(),warhorseSkills:state.warhorseSkills};return Array.isArray(map[category])?map[category]:[];}
function getCategoryLabel(category){return DATASET_LABELS[category]||category||'';}
function getItemDisplayName(item){if(detailCategory(item)==='statusEffects'&&norm(item?.statusDisplayName||item?.title||''))return norm(item?.statusDisplayName||item?.title||'');return norm(item?.name||item?.title||'');}
function cleanArticleTitleForLink(rawTitle){let s=norm(rawTitle);if(!s)return '';s=s.replace(/^【三國志 覇道】/,'');s=s.replace(/の戦法と技能.*$/,'').replace(/の能力と技能.*$/,'').replace(/の効果と所持武将.*$/,'').replace(/の効果.*$/,'').replace(/の基本情報.*$/,'');s=s.replace(/（[^）]*）/g,'');return norm(s);}
function isSuppressedStatusEffectDetailLinkName(name){return norm(name)==='戦法ゲージ';}
function isSuppressedDetailLinkAlias(category,name){
  const n=norm(name);
  // FIX[HADO-2.9.0.0-NO-TACTIC-GAUGE-LINK]: 戦法ゲージは状態変化率の内部項目として頻出するため、自動リンク化しない。
  // 戦法短縮・戦法遅延など実体のある状態変化リンクは維持し、完全一致の「戦法ゲージ」だけを抑止する。
  return category==='statusEffects'&&isSuppressedStatusEffectDetailLinkName(n);
}
function getDetailLinkAliasesForItem(item){const aliases=[];const category=detailCategory(item);const add=(v,rank)=>{const n=norm(v);if(!n||n.length<2)return;if(isSuppressedDetailLinkAlias(category,n))return;if(!aliases.some(x=>x.name===n))aliases.push({name:n,rank});};const display=getItemDisplayName(item);add(display,3);const cleaned=cleanArticleTitleForLink(display);add(cleaned,3);if(category==='statusEffects'){const profile=getStatusEffectProfile(item);add(profile.originalName,3);add(profile.displayName,3);(profile.aliases||[]).forEach(a=>add(a,2));}if(category==='generals'&&cleaned){const noRarity=norm(cleaned.replace(/^(LR|UR|SSR|SR\+?|R\+?)/,''));add(noRarity,1);}return aliases;}
function getDetailLinkNamesForItem(item){return getDetailLinkAliasesForItem(item).map(x=>x.name);}
function buildDetailLinkAliasMap(){const aliasMap=new Map();const aliasRanks=new Map();const collision=new Set();const collisionRanks=new Map();[['generals',state.generals],['tactics',state.tactics],['skills',state.skills],['equipments',state.equipments],['statusEffects',state.statusEffects],['siegeWeapons',state.siegeWeapons],['ethnicArmaments',state.ethnicArmaments],['formations',state.formationMasters],['warhorses',getSearchWarhorseItems()],['warhorseSkills',state.warhorseSkills]].forEach(([category,items])=>{(Array.isArray(items)?items:[]).forEach(item=>{getDetailLinkAliasesForItem(item).forEach(alias=>{const name=alias.name;const rank=alias.rank||1;const key=category+':'+name;if(collision.has(key)){const collisionRank=collisionRanks.get(key)||0;if(rank<=collisionRank)return;collision.delete(key);collisionRanks.delete(key);aliasMap.set(key,item);aliasRanks.set(key,rank);return;}if(!aliasMap.has(key)){aliasMap.set(key,item);aliasRanks.set(key,rank);return;}if(aliasMap.get(key)===item){if(rank>(aliasRanks.get(key)||0))aliasRanks.set(key,rank);return;}const currentRank=aliasRanks.get(key)||0;if(rank>currentRank){aliasMap.set(key,item);aliasRanks.set(key,rank);return;}if(rank<currentRank)return;aliasMap.delete(key);aliasRanks.delete(key);collision.add(key);collisionRanks.set(key,rank);});});});state.detailLinkAliasMap=aliasMap;debugLog('detailLinkAliasMap:built',{aliases:aliasMap.size,collisions:collision.size,collisionSamples:[...collision].slice(0,20),sample:[...aliasMap.keys()].slice(0,20)});return aliasMap;}
function findItemByCategoryAndName(category,name){const target=norm(name);if(!category||!target)return null;const exact=getDatasetByCategory(category).find(item=>{const names=[getItemDisplayName(item),item?.name,item?.title,item?.originalName,item?.statusDisplayName,item?.raw?.name,item?.raw?.title].map(norm).filter(Boolean);return names.includes(target);});if(exact)return exact;const key=category+':'+target;return state.detailLinkAliasMap?.get(key)||null;}
function getDetailLinkCandidatePriority(category,name){const n=String(name||'').trim();if(category==='generals'){if(/^(LR|UR|SSR|SR\+?|R\+?)/.test(n))return 300;if(/^覚醒/.test(n))return 280;if(/^[A-Za-zＡ-Ｚａ-ｚ]/.test(n))return 260;return 200;}if(category==='tactics')return 150;if(category==='skills')return 140;if(category==='equipments')return 130;if(category==='statusEffects')return 120;if(category==='formations')return 110;if(category==='warhorseSkills')return 108;if(category==='warhorses')return 106;return 100;}
function compareDetailLinkCandidates(a,b){const pa=a?.priority??0;const pb=b?.priority??0;if(pa!==pb)return pb-pa;const la=String(a?.name||'').length;const lb=String(b?.name||'').length;if(la!==lb)return lb-la;return String(a?.name||'').localeCompare(String(b?.name||''),'ja');}
function buildDetailLinkCandidates(){const candidates=[];const seen=new Set();const aliasMap=buildDetailLinkAliasMap();aliasMap.forEach((item,key)=>{const splitAt=key.indexOf(':');const category=key.slice(0,splitAt);const name=key.slice(splitAt+1);if(!name||name.length<2)return;const candKey=category+':'+name;if(seen.has(candKey))return;seen.add(candKey);candidates.push({category,name,label:getCategoryLabel(category),priority:getDetailLinkCandidatePriority(category,name)});});candidates.sort(compareDetailLinkCandidates);state.detailLinkCandidates=candidates;debugLog('detailLinkCandidates:built',{total:candidates.length,generals:candidates.filter(x=>x.category==='generals').length,prefixedGenerals:candidates.filter(x=>x.category==='generals'&&x.priority>=260).length,sample:candidates.slice(0,10).map(x=>({category:x.category,name:x.name,priority:x.priority}))});}
function findDetailLinkTarget(name,preferredCategory=''){const target=norm(name);if(!target)return null;if((!preferredCategory||preferredCategory==='statusEffects')&&isSuppressedStatusEffectDetailLinkName(target))return null;const categories=preferredCategory?[preferredCategory]:['generals','tactics','skills','equipments','statusEffects'];for(const category of categories){const item=findItemByCategoryAndName(category,target);if(item)return {category,item,label:getCategoryLabel(category)};}return null;}
function formationEntityLinkHtml(category,name,label){const n=norm(name);const display=norm(label)||n;if(!display)return '';const target=findDetailLinkTarget(n,category);if(!target)return esc(display);return `<a href="#" class="detail-entity-link" data-category="${esc(target.category)}" data-name="${esc(getItemDisplayName(target.item))}">${esc(display)}</a>`;}
function formationAutoLinkHtml(name){const n=norm(name);if(!n)return '';const target=findDetailLinkTarget(n,'')||findDetailLinkTarget(n,'generals')||findDetailLinkTarget(n,'equipments')||findDetailLinkTarget(n,'skills')||findDetailLinkTarget(n,'tactics')||findDetailLinkTarget(n,'statusEffects');if(!target)return esc(n);return `<a href="#" class="detail-entity-link" data-category="${esc(target.category)}" data-name="${esc(getItemDisplayName(target.item))}">${esc(n)}</a>`;}
function activateCategoryOnly(category){Object.keys(state.activeCategories).forEach(key=>{state.activeCategories[key]=key===category;});updateCategoryStyles();}
function handleDetailEntityLinkClick(e){const a=e.target.closest&&e.target.closest('a.detail-entity-link');if(!a)return;e.preventDefault();const category=a.dataset.category||'';const name=a.dataset.name||a.textContent||'';const target=findDetailLinkTarget(name,category);debugLog('detail-link:click',{requestedCategory:category,requestedName:norm(name),resolvedCategory:target?target.category:'',resolvedName:target?getItemDisplayName(target.item):'',found:!!target});if(!target)return;if(els.searchInput)els.searchInput.value=norm(target.item?.name||target.item?.title||name);activateCategoryOnly(target.category);state.selectedItem=target.item;state.selectedLabel=target.label;state.detailActiveTab=getDetailInitialTabForItem(target.item);state._pendingDetailLinkSelection={item:target.item,category:target.category,label:target.label,name:getItemDisplayName(target.item)};if(state.mainTab==='formation')setMainTab('search');renderDetail();renderSearchResults();state._pendingDetailLinkSelection=null;if(state.selectedItem!==target.item){debugLog('detail-link:selection-corrected-after-search',{requested:getItemDisplayName(target.item),actual:state.selectedItem?getItemDisplayName(state.selectedItem):'',category:target.category});state.selectedItem=target.item;state.selectedLabel=target.label;state.detailActiveTab=getDetailInitialTabForItem(target.item);if(Array.isArray(state.lastResultRows))renderResultSelect(state.lastResultRows);}if(state.viewMode==='saved'&&!itemMatchesSavedMode(target.item,target.category))debugLog('detail-link:saved-target-filtered',{category:target.category,name:getItemDisplayName(target.item),reason:'not included in savedModeIndex'});renderDetail();const rerenderDetailLinkTarget=()=>{if(state.selectedItem===target.item){debugLog('detail-link:post-frame-render',{name:getItemDisplayName(target.item),category:target.category});renderDetail();}};if(typeof requestAnimationFrame==='function')requestAnimationFrame(rerenderDetailLinkTarget);setTimeout(rerenderDetailLinkTarget,0);pushOperationHistory('detail-link');}
function getBestDetailLinkCandidateAt(text,pos){let best=null;for(const cand of state.detailLinkCandidates||[]){if(!cand?.name)continue;if(text.startsWith(cand.name,pos)){if(!best||compareDetailLinkCandidates(cand,best)<0)best=cand;}}return best;}
function findNextDetailLinkHit(text,pos){let best=null;let bestIndex=-1;for(const cand of state.detailLinkCandidates||[]){if(!cand?.name)continue;const idx=text.indexOf(cand.name,pos);if(idx<0)continue;if(bestIndex<0||idx<bestIndex){best=cand;bestIndex=idx;continue;}if(idx===bestIndex&&compareDetailLinkCandidates(cand,best)<0){best=cand;}}return best?{candidate:best,index:bestIndex}:null;}
function createDetailEntityAnchor(hit,text){const a=document.createElement('a');a.href='#';a.className='detail-entity-link';a.dataset.category=hit.category;a.dataset.name=hit.name;a.textContent=text;return a;}
function getBestGeneralDetailLinkCandidateAt(text,pos){let best=null;for(const cand of state.detailLinkCandidates||[]){if(cand?.category!=='generals'||!cand?.name)continue;if(text.startsWith(cand.name,pos)){if(!best||compareDetailLinkCandidates(cand,best)<0)best=cand;}}return best;}
function findOwnerListMarkerEnd(text){const markers=['を持つ武将','を所持する武将'];let best=-1;let end=-1;markers.forEach(marker=>{const idx=text.indexOf(marker);if(idx>=0&&(best<0||idx<best)){best=idx;end=idx+marker.length;}});return end;}
function linkifyGeneralOwnerListText(text,hitLogRef){const markerEnd=findOwnerListMarkerEnd(text);if(markerEnd<0)return null;const frag=document.createDocumentFragment();frag.appendChild(document.createTextNode(text.slice(0,markerEnd)));let pos=markerEnd;let linkedCount=0;while(pos<text.length){const hit=getBestGeneralDetailLinkCandidateAt(text,pos);if(hit){if(linkedCount>0)frag.appendChild(document.createTextNode(' '));frag.appendChild(createDetailEntityAnchor(hit,text.slice(pos,pos+hit.name.length)));if(hitLogRef.count<20){debugLog('detailLinkify:owner-list-hit',{name:hit.name,category:hit.category,index:pos,priority:hit.priority,textSample:text.slice(Math.max(0,pos-20),Math.min(text.length,pos+hit.name.length+30))});hitLogRef.count++;}pos+=hit.name.length;linkedCount++;continue;}frag.appendChild(document.createTextNode(text[pos]));pos++;}
if(linkedCount>0)debugLog('detailLinkify:owner-list-summary',{markerText:text.slice(Math.max(0,markerEnd-20),markerEnd),linkedCount,textSample:text.slice(markerEnd,Math.min(text.length,markerEnd+120))});return linkedCount>0?frag:null;}
function linkifyDetailTextNodes(root){if(!root||!state.detailLinkCandidates?.length)return;const skipTags=new Set(['A','BUTTON','SELECT','INPUT','TEXTAREA','SCRIPT','STYLE','PRE','TH']);const hitLogRef={count:0};const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const parent=node.parentElement;if(!parent||skipTags.has(parent.tagName))return NodeFilter.FILTER_REJECT;if(parent.closest&&parent.closest('thead,th,h1,h2,h3,h4,.badge,.selected-tag-badge,.tag-picker-option,.tag-picker-title,.no-detail-linkify,.general-troop-card,.general-card-header,.section-title,.detail-toolbar'))return NodeFilter.FILTER_REJECT;const text=node.nodeValue||'';if(!norm(text))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(node=>{const text=node.nodeValue||'';const ownerListFrag=linkifyGeneralOwnerListText(text,hitLogRef);if(ownerListFrag){node.parentNode.replaceChild(ownerListFrag,node);return;}let pos=0;const frag=document.createDocumentFragment();while(pos<text.length){let hitAtPos=getBestDetailLinkCandidateAt(text,pos);let hitIndex=pos;let hit=hitAtPos;if(!hit){const next=findNextDetailLinkHit(text,pos);if(next){hit=next.candidate;hitIndex=next.index;}}if(!hit){frag.appendChild(document.createTextNode(text.slice(pos)));break;}if(hitIndex>pos)frag.appendChild(document.createTextNode(text.slice(pos,hitIndex)));frag.appendChild(createDetailEntityAnchor(hit,text.slice(hitIndex,hitIndex+hit.name.length)));if(hitLogRef.count<20){debugLog('detailLinkify:hit',{name:hit.name,category:hit.category,index:hitIndex,priority:hit.priority,textSample:text.slice(Math.max(0,hitIndex-20),Math.min(text.length,hitIndex+hit.name.length+30))});hitLogRef.count++;}pos=hitIndex+hit.name.length;}node.parentNode.replaceChild(frag,node);});}
function getItemCategoryAndLabel(item){const category=detailCategory(item);return {category,label:getCategoryLabel(category)};}
function forceResultSelectToCurrentItem(context=''){
  if(!els.resultSelect||!state.selectedItem||!Array.isArray(state.lastResultRows))return false;
  const idx=state.lastResultRows.findIndex(row=>row&&row.item===state.selectedItem);
  if(idx<0)return false;
  const before=els.resultSelect.value;
  const next=String(idx);
  if(before!==next)els.resultSelect.value=next;
  debugLog('resultSelect:force-current-item',{context,before,next,name:getItemDisplayName(state.selectedItem),category:detailCategory(state.selectedItem)});
  return true;
}
function reconcileSelectedItemFromResultSelect(context=''){
  if(!els.resultSelect||!Array.isArray(state.lastResultRows))return false;
  const pending=state._pendingDetailLinkSelection||null;
  if(pending&&pending.item){
    debugLog('detail-selection:reconcile-skip-pending-link',{
      context,
      pending:{name:getItemDisplayName(pending.item),category:pending.category||detailCategory(pending.item),label:pending.label||getCategoryLabel(detailCategory(pending.item))},
      selectValue:els.resultSelect.value||'',
      selected:state.selectedItem?{name:getItemDisplayName(state.selectedItem),category:detailCategory(state.selectedItem),label:state.selectedLabel}:''
    });
    return false;
  }
  const raw=els.resultSelect.value;
  if(!/^\d+$/.test(String(raw||'')))return false;
  const row=state.lastResultRows[Number(raw)];
  if(!row||!row.item)return false;
  if(state.selectedItem!==row.item||state.selectedLabel!==row.label){
    const before=state.selectedItem?{name:getItemDisplayName(state.selectedItem),category:detailCategory(state.selectedItem),label:state.selectedLabel}:null;
    const selectedCategory=state.selectedItem?detailCategory(state.selectedItem):'';
    const rowCategory=detailCategory(row.item);
    if(before&&selectedCategory&&rowCategory&&selectedCategory!==rowCategory&&state.activeCategories&&state.activeCategories[selectedCategory]&&!state.activeCategories[rowCategory]){
      debugLog('detail-selection:reconcile-skip-stale-result-select',{context,before,candidate:{name:getItemDisplayName(row.item),category:rowCategory,label:row.label},selectValue:raw,reason:'result dropdown belongs to stale category'});
      return false;
    }
    state.selectedItem=row.item;
    state.selectedLabel=row.label;
    state.detailActiveTab=getDetailInitialTabForItem(row.item);
    debugLog('detail-selection:reconciled-from-result-select',{context,before,after:{name:getItemDisplayName(row.item),category:detailCategory(row.item),label:row.label},selectValue:raw,reason:'result dropdown and detail state diverged'});
    return true;
  }
  return false;
}
function getFreshDetailElement(){
  const el=document.getElementById('detail')||els.detail;
  if(el&&els.detail!==el)els.detail=el;
  return el;
}
function setDetailHtmlHard(html,categoryKey,name,label,context=''){
  const detailEl=getFreshDetailElement();
  if(!detailEl)return false;
  detailEl.innerHTML='';
  const tpl=document.createElement('template');
  tpl.innerHTML=html;
  detailEl.replaceChildren(tpl.content.cloneNode(true));
  detailEl.dataset.detailCategory=String(categoryKey||'');
  detailEl.dataset.detailName=String(name||'');
  detailEl.dataset.detailLabel=String(label||'');
  if(!state._preserveDetailScrollSnapshot)detailEl.scrollTop=0;
  debugLog('renderDetail:hard-set',{context,categoryKey,name,label,childCount:detailEl.childElementCount,htmlLength:String(html||'').length,preserveScroll:!!state._preserveDetailScrollSnapshot});
  return true;
}

function captureDetailScrollSnapshot(){
  const detailEl=getFreshDetailElement();
  return {
    windowX:typeof window!=='undefined'?window.scrollX:0,
    windowY:typeof window!=='undefined'?window.scrollY:0,
    detailScrollTop:detailEl?detailEl.scrollTop:0,
    detailScrollLeft:detailEl?detailEl.scrollLeft:0,
    category:detailEl?.dataset?.detailCategory||'',
    name:detailEl?.dataset?.detailName||''
  };
}
function restoreDetailScrollSnapshot(snapshot,context=''){
  if(!snapshot)return;
  const detailEl=getFreshDetailElement();
  try{
    if(detailEl){
      detailEl.scrollTop=Number(snapshot.detailScrollTop)||0;
      detailEl.scrollLeft=Number(snapshot.detailScrollLeft)||0;
    }
    if(typeof window!=='undefined'&&typeof window.scrollTo==='function'){
      window.scrollTo(Number(snapshot.windowX)||0,Number(snapshot.windowY)||0);
    }
    debugLog('detailScroll:restore',{context,windowY:snapshot.windowY,detailScrollTop:snapshot.detailScrollTop,category:snapshot.category,name:snapshot.name});
  }catch(e){debugLog('detailScroll:restore-error',{context,error:String(e&&e.message||e)});}
}
function beginPreserveDetailScroll(context=''){
  state._preserveDetailScrollSnapshot=captureDetailScrollSnapshot();
  state._preserveDetailScrollContext=context;
  debugLog('detailScroll:capture',{context,snapshot:state._preserveDetailScrollSnapshot});
}
function finishPreserveDetailScroll(context=''){
  const snapshot=state._preserveDetailScrollSnapshot;
  if(!snapshot)return;
  restoreDetailScrollSnapshot(snapshot,context||state._preserveDetailScrollContext||'');
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>restoreDetailScrollSnapshot(snapshot,(context||state._preserveDetailScrollContext||'')+':raf'));
  setTimeout(()=>{restoreDetailScrollSnapshot(snapshot,(context||state._preserveDetailScrollContext||'')+':async');if(state._preserveDetailScrollSnapshot===snapshot){state._preserveDetailScrollSnapshot=null;state._preserveDetailScrollContext='';}},0);
}
function renderDetailPreservingScroll(context=''){
  beginPreserveDetailScroll(context);
  renderDetail();
  finishPreserveDetailScroll(context);
}
function debugRenderedDetailIdentity(item,categoryKey,name,label,context=''){
  const detailEl=getFreshDetailElement();
  const titleText=norm(detailEl?.querySelector?.('.title-row .section-title')?.textContent||'');
  const expectedLabel=label||getCategoryLabel(categoryKey);
  const expected=`${expectedLabel} : ${name}`;
  const ok=titleText===expected;
  debugLog('renderDetail:dom-identity',{context,ok,expected,titleText,categoryKey,name,label:expectedLabel,resultSelectValue:els.resultSelect?els.resultSelect.value:'',selectedName:state.selectedItem?getItemDisplayName(state.selectedItem):'',selectedCategory:state.selectedItem?detailCategory(state.selectedItem):'',detailDataset:detailEl?{category:detailEl.dataset.detailCategory||'',name:detailEl.dataset.detailName||'',label:detailEl.dataset.detailLabel||''}:null});
  if(!state.diagnostics)state.diagnostics={};
  state.diagnostics.detailIdentity={context,ok,expected,titleText,categoryKey,name,label:expectedLabel};
  return ok;
}
function debugSkillDetailDomState(item,context=''){
  const detailEl=getFreshDetailElement();
  if(!detailEl)return null;
  const category=detailCategory(item);
  const content=detailEl.querySelector('.detail-tab-content');
  const text=norm(content?content.textContent:detailEl.textContent||'');
  const activeTab=content?content.getAttribute('data-active-tab')||'':'';
  const skillDetailCardExists=!![...detailEl.querySelectorAll('.general-card-header')].find(v=>norm(v.textContent||'')==='技能説明');
  const result={context,category,name:getItemDisplayName(item),detailDataset:{category:detailEl.dataset.detailCategory||'',name:detailEl.dataset.detailName||'',label:detailEl.dataset.detailLabel||''},activeTab,tabLabels:[...detailEl.querySelectorAll('.detail-tab-btn')].map(b=>norm(b.textContent||'')),skillDetailCardExists,textLength:text.length,textSample:text.slice(0,180),ok:category!=='skills'||(activeTab==='skillDetail'&&text.length>0&&skillDetailCardExists)};
  debugLog('skillDetail:dom-state',result);
  if(!state.diagnostics)state.diagnostics={};
  state.diagnostics.skillDetailDom=result;
  return result;
}

// FIX[HADO-2.9.0.26-PC-RESULT-LIST-SCROLL]: PC検索結果一覧のスクロール制御を操作別に分離する。
// 一覧クリック時は現在位置を保持し、内容詳細の4ナビゲーションボタン時だけ選択項目を一覧先頭へ寄せる。
function isPcResultListScrollMode(){return !!(els.results&&typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(min-width:981px)').matches);}
function captureResultListScrollSnapshot(){if(!els.results||!isPcResultListScrollMode())return null;return {scrollTop:Number(els.results.scrollTop)||0,scrollLeft:Number(els.results.scrollLeft)||0};}
function restoreResultListScrollSnapshot(snapshot,context=''){if(!snapshot||!els.results||!isPcResultListScrollMode())return;els.results.scrollTop=Number(snapshot.scrollTop)||0;els.results.scrollLeft=Number(snapshot.scrollLeft)||0;debugLog('resultListScroll:restore',{context,scrollTop:els.results.scrollTop,scrollLeft:els.results.scrollLeft});}
function restoreResultListScrollSnapshotStable(snapshot,context=''){if(!snapshot)return;restoreResultListScrollSnapshot(snapshot,context);if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>restoreResultListScrollSnapshot(snapshot,context+':raf'));setTimeout(()=>restoreResultListScrollSnapshot(snapshot,context+':async'),0);}
function scrollSelectedResultToListTop(context=''){if(!els.results||!isPcResultListScrollMode())return false;const active=els.results.querySelector('li.active');if(!active)return false;const listRect=els.results.getBoundingClientRect();const activeRect=active.getBoundingClientRect();const nextTop=Math.max(0,(Number(els.results.scrollTop)||0)+(activeRect.top-listRect.top));els.results.scrollTop=nextTop;debugLog('resultListScroll:selected-to-top',{context,scrollTop:els.results.scrollTop,name:state.selectedItem?getItemDisplayName(state.selectedItem):''});return true;}
function scheduleScrollSelectedResultToListTop(context=''){scrollSelectedResultToListTop(context);if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>scrollSelectedResultToListTop(context+':raf'));setTimeout(()=>scrollSelectedResultToListTop(context+':async'),0);}
function syncResultSelectSelection(){if(!els.resultSelect)return;const opts=[...els.resultSelect.options];opts.forEach(opt=>{if(opt.value==='')opt.selected=!state.selectedItem;else{const row=state.lastResultRows[Number(opt.value)];opt.selected=!!row&&row.item===state.selectedItem;}});}
function getSelectedResultRowIndex(){if(!state.selectedItem||!Array.isArray(state.lastResultRows))return -1;return state.lastResultRows.findIndex(row=>row&&row.item===state.selectedItem);}
function updateResultNavigationButtons(){const idx=getSelectedResultRowIndex();const total=Array.isArray(state.lastResultRows)?state.lastResultRows.length:0;if(els.resultNextBtn)els.resultNextBtn.disabled=!(idx>=0&&idx<total-1);if(els.resultPrevBtn)els.resultPrevBtn.disabled=!(idx>0&&idx<total);}
function moveSelectedResultBy(delta){const idx=getSelectedResultRowIndex();if(idx<0||!Array.isArray(state.lastResultRows))return;const nextIdx=idx+delta;if(nextIdx<0||nextIdx>=state.lastResultRows.length)return;const row=state.lastResultRows[nextIdx];if(!row||!row.item)return;state.searchResultRenderLimit=Math.max(Number(state.searchResultRenderLimit)||100,nextIdx+1);debugLog('resultNavigation:move',{delta,from:idx,to:nextIdx,name:getItemDisplayName(row.item),category:detailCategory(row.item)});selectItemAndRender(row.item,row.label,{reason:delta>0?'result-next':'result-prev',scrollListToSelectedTop:true});}
function getOperationSnapshot(){const item=state.selectedItem;const category=item?detailCategory(item):'';return {keyword:els.searchInput?els.searchInput.value:'',selectedTags:[...(state.selectedTags||[])],searchMode:state.searchMode||'normal',viewMode:state.viewMode||'all',typeSearchSelectedPresetId:state.typeSearchSelectedPresetId||'',typeSearchPresetDirty:!!state.typeSearchPresetDirty,typeSearchSelectedStatusEffectIds:[...(state.typeSearchSelectedStatusEffectIds||[])],typeSearchSelectedFeatureIds:[...(state.typeSearchSelectedFeatureIds||[])],selectedCategory:category,selectedName:item?getItemDisplayName(item):'',selectedLabel:state.selectedLabel||getCategoryLabel(category),activeCategories:safeCloneForDebug(state.activeCategories)};}
function sameOperationSnapshot(a,b){return JSON.stringify(a||{})===JSON.stringify(b||{});}
function updateOperationHistoryButtons(){if(els.opHistoryBackBtn)els.opHistoryBackBtn.disabled=state.operationHistoryIndex<=0;if(els.opHistoryForwardBtn)els.opHistoryForwardBtn.disabled=state.operationHistoryIndex<0||state.operationHistoryIndex>=state.operationHistory.length-1;updateResultNavigationButtons();}
function pushOperationHistory(reason=''){if(state.isRestoringHistory)return;const snap=getOperationSnapshot();const current=state.operationHistory[state.operationHistoryIndex];if(sameOperationSnapshot(current,snap)){updateOperationHistoryButtons();return;}if(state.operationHistoryIndex<state.operationHistory.length-1)state.operationHistory=state.operationHistory.slice(0,state.operationHistoryIndex+1);state.operationHistory.push(snap);if(state.operationHistory.length>100)state.operationHistory.shift();state.operationHistoryIndex=state.operationHistory.length-1;debugLog('operationHistory:push',{reason,index:state.operationHistoryIndex,size:state.operationHistory.length,snapshot:snap});updateOperationHistoryButtons();}
function restoreOperationHistory(delta){const nextIndex=state.operationHistoryIndex+delta;if(nextIndex<0||nextIndex>=state.operationHistory.length)return;const snap=state.operationHistory[nextIndex];state.isRestoringHistory=true;try{state.operationHistoryIndex=nextIndex;if(els.searchInput)els.searchInput.value=snap.keyword||'';state.selectedTags=Array.isArray(snap.selectedTags)?snap.selectedTags.map(norm).filter(Boolean):[];state.typeSearchSelectedPresetId=norm(snap.typeSearchSelectedPresetId||'');state.typeSearchPresetDirty=!!snap.typeSearchPresetDirty;state.typeSearchSelectedStatusEffectIds=Array.isArray(snap.typeSearchSelectedStatusEffectIds)?snap.typeSearchSelectedStatusEffectIds.map(norm).filter(Boolean):[];state.typeSearchSelectedFeatureIds=Array.isArray(snap.typeSearchSelectedFeatureIds)?snap.typeSearchSelectedFeatureIds.map(norm).filter(Boolean):[];const restoredViewMode=snap.viewMode==='saved'?'saved':'all';if(state.viewMode!==restoredViewMode){state.viewMode=restoredViewMode;rebuildSavedModeIndex();}if(els.viewModeAll)els.viewModeAll.checked=state.viewMode==='all';if(els.viewModeSaved)els.viewModeSaved.checked=state.viewMode==='saved';renderSaveControls();state.searchMode=['normal','status','type'].includes(norm(snap.searchMode))?norm(snap.searchMode):'normal';renderTagSearchControls();renderTypeSearchSelectedConditions();if(snap.activeCategories&&typeof snap.activeCategories==='object'){Object.keys(state.activeCategories).forEach(key=>{state.activeCategories[key]=!!snap.activeCategories[key];});}updateCategoryStyles();updateSearchModeUi();state.selectedItem=findItemByCategoryAndName(snap.selectedCategory,snap.selectedName);state.selectedLabel=state.selectedItem?(snap.selectedLabel||getCategoryLabel(snap.selectedCategory)):'';renderSearchResults();scheduleScrollSelectedResultToListTop('operation-history:'+delta);renderDetail();if(typeof updateDataContextBar==='function')updateDataContextBar('operation-history');const diag={timestamp:debugTimestamp(),delta,index:state.operationHistoryIndex,size:state.operationHistory.length,searchMode:state.searchMode,viewMode:state.viewMode,presetId:state.typeSearchSelectedPresetId||'',presetDirty:!!state.typeSearchPresetDirty,statusEffectCount:(state.typeSearchSelectedStatusEffectIds||[]).length,featureCount:(state.typeSearchSelectedFeatureIds||[]).length,tagCount:(state.selectedTags||[]).length,activeCategories:Object.entries(state.activeCategories||{}).filter(([,v])=>!!v).map(([k])=>k)};state.diagnostics.typeSearchHistoryRestore=diag;debugLog('typeSearch:history-restore',diag);}finally{state.isRestoringHistory=false;updateOperationHistoryButtons();}}
function getDetailInitialTabForItem(item){return getDefaultDetailTabForCategory(detailCategory(item));}
function selectItemAndRender(item,label,options={}){if(!item)return;const resultListScrollSnapshot=options.preserveListScroll?captureResultListScrollSnapshot():null;state.selectedItem=item;state.selectedLabel=label||getCategoryLabel(detailCategory(item));state.detailActiveTab=getDetailInitialTabForItem(item);renderSearchResults();if(resultListScrollSnapshot)restoreResultListScrollSnapshotStable(resultListScrollSnapshot,options.reason||'select');else if(options.scrollListToSelectedTop)scheduleScrollSelectedResultToListTop(options.reason||'select');renderDetail();if(!options.skipHistory)pushOperationHistory(options.reason||'select');}
function getDetailLinkCandidatePriority(category,name){const n=String(name||'').trim();if(category==='generals'){if(/^(LR|UR|SSR|SR\+?|R\+?)/.test(n))return 300;if(/^覚醒/.test(n))return 280;if(/^[A-Za-zＡ-Ｚａ-ｚ]/.test(n))return 260;return 200;}if(category==='tactics')return 150;if(category==='skills')return 140;if(category==='equipments')return 130;if(category==='statusEffects')return 120;if(category==='formations')return 110;if(category==='warhorseSkills')return 108;if(category==='warhorses')return 106;return 100;}
function compareDetailLinkCandidates(a,b){const pa=a?.priority??0;const pb=b?.priority??0;if(pa!==pb)return pb-pa;const la=String(a?.name||'').length;const lb=String(b?.name||'').length;if(la!==lb)return lb-la;return String(a?.name||'').localeCompare(String(b?.name||''),'ja');}
function markdownEscapeCell(value){return String(value??'').replace(/\r?\n+/g,' ').replace(/\|/g,'\\|').trim();}
async function copyTextToClipboardSafe(text){if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);return;}const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');ta.remove();}
function stripReadingForCopy(name){return norm(name).replace(/（[^）]*）/g,'').trim();}
function copyDisplayWidth(s){let w=0;for(const ch of String(s||'')){w+=(/[\u3000-\u30ff\u3400-\u9fff\uff01-\uff60]/.test(ch)?2:1);}return w;}
function padCopyName(name,width){let s=String(name||'');let pad=Math.max(1,width-copyDisplayWidth(s)+2);return s+' '.repeat(pad);}
function formatParameterValueForCopy(v){function fmt(n,unit){const num=Number(n);return (num>=0?'+':'')+String(Number.isInteger(num)?num:num)+String(unit||'');}const unit=(v&&v.unit!==undefined)?v.unit:'%';if(v?.isRange){const min=Number(v.minTotal||0),max=Number(v.maxTotal||0);if((min<0&&max>0)||(min>0&&max<0))return fmt(max,unit)+' / '+fmt(min,unit);return fmt(v.minTotal,unit)+' ～ '+fmt(v.maxTotal,unit);}return fmt(v?.total??v?.maxTotal??0,unit);}
function formatParameterSourcesForCopy(v){const src=[];const add=x=>{const label=parameterDisplaySourceLabel(x?.sourceLabel||'');if(label&&!src.includes(label))src.push(label);};const items=v?.isRange?[...(v.minItems||[]),...(v.maxItems||[])]:((v?.maxItems&&v.maxItems.length)?v.maxItems:(v?.items||[]));items.forEach(add);return src.join('/');}
function buildParameterCopyEntries(item,exactKey){const out=[];try{const data=buildParameterSummaryData(item);['tactic','deploy','normal','defense'].forEach(t=>{const groups=data.summary?.[t]||{};Object.keys(groups).forEach(g=>{const entries=groups[g]||{};Object.keys(entries).forEach(k=>{if(exactKey&&norm(k)!==norm(exactKey))return;const v=entries[k];if(!v)return;if(Number(v.maxTotal||v.total)===0&&Number(v.minTotal||0)===0&&!((v.items||[]).some(x=>x.forceDisplay)))return;out.push({timing:timingLabel(t),key:k,value:formatParameterValueForCopy(v),sources:formatParameterSourcesForCopy(v)});});});});}catch(err){debugLog('copy:parameter-entries:error',{item:getItemDisplayName(item),key:exactKey||'',message:err?.message||String(err)});}return out;}
function allParameterSummaryKeys(){return new Set(PARAM_GROUPS.flatMap(g=>g.keys).map(norm).filter(Boolean));}
function buildResultsMarkdown(){return buildResultsCopyText();}
function buildResultsCopyText(){const lines=[];const keyword=isTypeSearchMode()?'':norm(currentKeyword());if(keyword)lines.push('検索キーワード: '+keyword);(state.lastResultRows||[]).forEach(row=>{const name=getItemDisplayName(row.item)||'-';const metric=row.metric?' '+row.metric.display:'';lines.push(row.label+' : '+name+metric);});const text=lines.join('\n');debugLog('copy:list',{count:(state.lastResultRows||[]).length,keyword,format:'discord-plain',markdownTable:false,hasMarkdownTableHeader:/\|---\|/.test(text),sample:lines.slice(0,5)});return text;}
function detailCopyCleanText(text){return norm(text).replace(/https?:\/\/\S+/g,'').replace(/元ページを開く/g,'').replace(/\|---\|/g,'').trim();}
function formatDetailCopyBodyText(text){let t=detailCopyCleanText(text);if(!t)return '';t=t.replace(/\s*(■)/g,'\n$1').replace(/\s*(▼)/g,'\n$1').replace(/\s*(●)/g,'\n$1').replace(/\s*(└)/g,'\n$1').replace(/\s*(→)/g,'\n$1');ROMAN_LEVELS.forEach(r=>{t=t.replace(new RegExp('\\s*('+escRe(r)+')(?=■|▼|●)','g'),'\n$1');});return t.split(/\n+/).map(v=>v.trim()).filter(Boolean).join('\n');}
// FEATURE[HADO-2.1.0.5-DEFINITION-GUARD]: コピー系で参照する補助関数の定義漏れを防止する。
function parseSearchContext(raw){return parseMetricSearchKeyword(raw)||{raw:norm(raw||''),base:norm(raw||''),sign:'',numberText:'',unit:'',position:'plain',mode:'plain'};}
function parameterTimingShortLabel(t){return {'戦法発動時':'戦法','出陣時':'出陣','通常時':'通常','駐屯防衛時':'駐屯/防衛'}[t]||t;}
function formatCompactParameterEntry(e){const rawVal=norm(e?.value||'');const displayName=parameterSummaryDisplayName(e?.key||'',{maxTotal:/^-/.test(rawVal)?-1:1,total:/^-/.test(rawVal)?-1:1});return displayName+' '+rawVal+(e?.sources?'['+norm(e.sources)+']':'');}
function buildDetailCopyParameterLines(item){const entries=buildParameterCopyEntries(item,'');const lines=['■ 状態変化率'];const equipmentStatus=equipmentStageStatusCopyLine(item);if(equipmentStatus)lines.push(equipmentStatus);if(!entries.length){lines.push('状態変化率なし');return lines;}const grouped={};entries.forEach(e=>{if(!grouped[e.timing])grouped[e.timing]=[];grouped[e.timing].push(e);});['戦法発動時','出陣時','通常時','駐屯防衛時'].forEach(t=>{const rows=grouped[t]||[];if(rows.length)lines.push(parameterTimingShortLabel(t)+'：'+rows.map(formatCompactParameterEntry).join(' / '));});return lines;}
function buildDetailCopyBasicLines(item,categoryKey){const pairs=[];if(categoryKey==='equipments'){const basic=(Array.isArray(item?.tables)&&Array.isArray(item.tables[0]))?item.tables[0]:[];(Array.isArray(basic)?basic:[]).forEach(row=>{if(Array.isArray(row)&&row.length>=2){const k=detailCopyCleanText(row[0]);const v=detailCopyCleanText(row[1]);if(k&&v&&['最高レア','種類','兵科'].includes(k))pairs.push(k+'：'+v);}});}else if(categoryKey==='generals'){const rows=getGeneralBasicInfoRows(item);['天賦','兵科','相性','侍従位置','系統','性別'].forEach(k=>{const v=findFirstPairValueInRows(rows,[k]);if(!v)return;if(k==='相性'&&parseAffinityValue(v)===null)return;pairs.push(k+'：'+v);});}return pairs.length?['■ 基本情報',pairs.join(' / ')]:[];}
function buildEquipmentSkillCopyLines(item){const split=splitEquipmentTablesForTabs(item);const blocks=getEquipmentSkillStageBlocks(item,split.skill||[]);const lines=[];let skillRows=0;lines.push('■ 技能');blocks.forEach((block,idx)=>{lines.push('', '【'+(block.title||('技能ブロック'+(idx+1)))+'】');(Array.isArray(block.table)?block.table:[]).forEach(row=>{if(!Array.isArray(row)||row.length<2)return;const n=detailCopyCleanText(row[0]);const body=formatDetailCopyBodyText(row.slice(1).join(' '));if(n&&body){lines.push('',n,body);skillRows++;}});});debugLog('copy:detail-equipment-skills',{item:getItemDisplayName(item),skillBlockCount:blocks.length,rawSkillBlockCount:(split.skill||[]).length,skillRows,titles:blocks.map(b=>b.title),sourceIndexes:blocks.map(b=>b.sourceIndex)});return {lines,skillBlockCount:blocks.length,skillRows};}
function buildGenericDetailCopyLines(item){const lines=[];filterSections(item.sections||[]).slice(0,8).forEach(sec=>{const title=detailCopyCleanText(sec?.title||'');const content=formatDetailCopyBodyText((Array.isArray(sec?.content)?sec.content:[]).join(' '));if(title&&content)lines.push('■ '+title,content);});return lines;}
// FEATURE[HADO-2.1-007]: 詳細コピー案2改。
function buildDetailCopyText(){const item=state.selectedItem;if(!item){debugLog('copy:detail',{reason:'no-selected-item'});return '詳細なし';}const categoryKey=detailCategory(item);const label=state.selectedLabel||DATASET_LABELS?.[categoryKey]||categoryKey||'詳細';const name=stripReadingForCopy(getItemDisplayName(item)||'-');if(isHadouExtensionEquipmentItem(item)){const lines=['【'+label+'】'+name,'',...buildHadouExtensionCopyLines(item,categoryKey)];const text='```text\n'+lines.join('\n').replace(/\n{4,}/g,'\n\n\n')+'\n```';debugLog('copy:detail',{category:categoryKey,name,format:'discord-codeblock-hadou-extension',level:getHadouExtensionSelectedLevel(item),lineCount:text.split(/\n/).length,charCount:text.length});return text;}const lines=['【'+label+'】'+name,'',...buildDetailCopyParameterLines(item)];const tacticAttackCopy=(categoryKey==='tactics'||categoryKey==='generals')?buildTacticAttackCopyLines(item):[];if(tacticAttackCopy.length)lines.push('',...tacticAttackCopy);const basic=buildDetailCopyBasicLines(item,categoryKey);if(basic.length)lines.push('',...basic);let equipmentSkillInfo=null;if(categoryKey==='equipments'){equipmentSkillInfo=buildEquipmentSkillCopyLines(item);if(equipmentSkillInfo.lines.length)lines.push('',...equipmentSkillInfo.lines);}else{const generic=buildGenericDetailCopyLines(item);if(generic.length)lines.push('',...generic);}const fence='```';const text=fence+'text\n'+lines.join('\n').replace(/\n{4,}/g,'\n\n\n')+'\n'+fence;debugLog('copy:detail',{category:categoryKey,name,format:'discord-codeblock-v2-raw-formatted',lineCount:text.split(/\n/).length,charCount:text.length,sectionUsedCount:categoryKey==='equipments'?(equipmentSkillInfo?.skillBlockCount||0):buildGenericDetailCopyLines(item).filter(v=>/^■ /.test(v)).length,equipmentSkillRows:equipmentSkillInfo?.skillRows||0,urlDetected:/https?:\/\//.test(text),sourcePageTextDetected:/元ページを開く/.test(text),readingDetected:/^【[^】]+】.*（[^）]+）/m.test(text),markdownTableDetected:/\|---\|/.test(text),sample:text.split(/\n/).slice(0,18)});return text;}
// FEATURE[HADO-2.1.0.5-PARAM-COPY-NO-PREFIX-CONVERSION]: 検索パラコピーでは「部隊の」を外す候補変換や末尾一致変換を行わず、検索キーワード解析後の完全一致のみでパラメータキーを解決する。
function resolveParameterCopyKeyFromKeyword(rawKeyword){const raw=norm(rawKeyword).replace(/[＋]/g,'+').replace(/[－]/g,'-');if(!raw)return '';const context=parseSearchContext(raw);const candidates=[];if(context?.base)candidates.push(norm(context.base));const stripped=raw.replace(/[+\-－＋]\s*$/,'').replace(/[＋]/g,'+').trim();if(stripped)candidates.push(stripped);const keySet=allParameterSummaryKeys();for(const c of candidates){if(keySet.has(c))return c;}return '';}
function getAllParameterCopyTargets(){const targets=[];const add=(categoryKey,label,items)=>{if(!state.activeCategories?.[categoryKey])return;(Array.isArray(items)?items:[]).forEach(item=>{if(!item)return;if(state.viewMode==='saved'&&!itemMatchesSavedMode(item,categoryKey))return;targets.push({categoryKey,label,item});});};add('generals','武将',state.generals);add('equipments','装備',state.equipments);add('siegeWeapons','兵器',state.siegeWeapons);add('ethnicArmaments','武装',state.ethnicArmaments);return targets;}
function buildAllParameterResultsCopyText(){const targets=getAllParameterCopyTargets();const counts={generals:0,equipments:0,siegeWeapons:0,ethnicArmaments:0};targets.forEach(t=>{if(counts[t.categoryKey]!==undefined)counts[t.categoryKey]++;});const lines=['全パラコピー',`対象：武将 ${counts.generals}件 / 装備 ${counts.equipments}件 / 兵器 ${counts.siegeWeapons}件 / 武装 ${counts.ethnicArmaments}件 / 合計 ${targets.length}件`,''];targets.forEach(({label,item,categoryKey})=>{const name=stripReadingForCopy(getItemDisplayName(item)||'-');lines.push(`【${label}】${name}`);if(isHadouExtensionEquipmentItem(item)){lines.push(formatHadouExtensionCompactParameterLine(item),'');return;}const entries=buildParameterCopyEntries(item,'');if(!entries.length){lines.push('状態変化率なし','');return;}const grouped={};entries.forEach(e=>{if(!grouped[e.timing])grouped[e.timing]=[];grouped[e.timing].push(e);});['戦法発動時','出陣時','通常時','駐屯防衛時'].forEach(t=>{const rows=grouped[t]||[];if(rows.length)lines.push(parameterTimingShortLabel(t)+'：'+rows.map(formatCompactParameterEntry).join(' / '));});lines.push('');});const text='```text\n'+lines.join('\n').replace(/\n+$/,'')+'\n```';debugLog('copy:all-parameter-list',{viewMode:state.viewMode,activeCategories:safeCloneForDebug(state.activeCategories),counts,total:targets.length,format:'discord-codeblock',hasEquipmentOutput:/【装備】/.test(text),hasSiegeWeaponOutput:/【兵器】/.test(text),hasEthnicArmamentOutput:/【武装】/.test(text),hasMarkdownTableHeader:/\|---\|/.test(text)});return text;}
function buildParameterResultsCopyText(){const rawKeyword=norm(currentKeyword());const matchedKey=resolveParameterCopyKeyFromKeyword(rawKeyword);const keySet=allParameterSummaryKeys();if(!rawKeyword||!matchedKey||!keySet.has(matchedKey)){debugLog('copy:parameter-list:skip',{reason:'keyword-not-parameter-key',rawKeyword,matchedKey,format:'discord-codeblock'});return '検索キーワードが状態変化率項目に一致していません。\n対象キーワード例: 攻撃 / 防御 / 戦法ゲージ / 物理被ダメージ / 対物体攻撃';}const grouped={};(state.lastResultRows||[]).forEach(row=>{const entries=buildParameterCopyEntries(row.item,matchedKey);if(!entries.length)return;const name=stripReadingForCopy(getItemDisplayName(row.item)||'-');entries.forEach(e=>{if(!grouped[e.timing])grouped[e.timing]=[];grouped[e.timing].push({name,value:e.value,label:row.label});});});const timings=['戦法発動時','出陣時','通常時','駐屯防衛時'];const maxName=Math.min(24,Math.max(8,...Object.values(grouped).flat().map(r=>copyDisplayWidth(r.name))));const body=[];timings.forEach(t=>{const rows=grouped[t]||[];if(!rows.length)return;if(body.length)body.push('');body.push(t);rows.forEach(r=>body.push(padCopyName(r.name,maxName)+r.value));});const displayKey=parameterDisplayName(matchedKey);const text=body.length?'【'+displayKey+'】\n```text\n'+body.join('\n')+'\n```':'【'+displayKey+'】\n```text\n該当なし\n```';debugLog('copy:parameter-list',{rawKeyword,matchedKey,displayKey:parameterDisplayName(matchedKey),rows:Object.values(grouped).reduce((a,b)=>a+b.length,0),visibleRows:(state.lastResultRows||[]).length,format:'discord-codeblock',markdownTable:false,hasMarkdownTableHeader:/\|---\|/.test(text),sample:text.split(/\n/).slice(0,12)});return text;}

async function handleCopyResults(){try{await copyTextToClipboardSafe(buildResultsCopyText());const prev=els.copyResultsBtn.textContent;els.copyResultsBtn.textContent='コピー済み';setTimeout(()=>{els.copyResultsBtn.textContent=prev;},1200);}catch(err){window.alert(`一覧コピーに失敗しました: ${err?.message||err}`);}}
async function handleCopyParameterResults(){try{await copyTextToClipboardSafe(buildParameterResultsCopyText());const prev=els.copyParamResultsBtn.textContent;els.copyParamResultsBtn.textContent='コピー済み';setTimeout(()=>{els.copyParamResultsBtn.textContent=prev;},1200);}catch(err){window.alert(`検索パラコピーに失敗しました: ${err?.message||err}`);}}
async function handleCopyAllParameterResults(){try{await copyTextToClipboardSafe(buildAllParameterResultsCopyText());const prev=els.copyAllParamResultsBtn.textContent;els.copyAllParamResultsBtn.textContent='コピー済み';setTimeout(()=>{els.copyAllParamResultsBtn.textContent=prev;},1200);}catch(err){window.alert(`全パラコピーに失敗しました: ${err?.message||err}`);}}
async function handleCopyDetail(){try{await copyTextToClipboardSafe(buildDetailCopyText());const prev=els.copyDetailBtn.textContent;els.copyDetailBtn.textContent='コピー済み';setTimeout(()=>{els.copyDetailBtn.textContent=prev;},1200);}catch(err){window.alert(`詳細コピーに失敗しました: ${err?.message||err}`);}}
function hasStatusSummaryKeyHit(src,key){
  const text=normalizeMetricSearchText(normalizeHadouCrawlerTypoText(src||''));
  const k=normalizeMetricSearchText(norm(key||''));
  if(!text||!k)return false;
  if(k==='攻撃')return /(^|[^通常会心撃心戦法物理知力])攻撃(?!速度|属性|間隔)/.test(text);
  if(k==='戦法ゲージ')return /(戦法ゲージ|戦法待ち時間|戦法短縮|即時戦法)/.test(text);
  if(k==='戦法')return /(^|[^騎兵歩兵弓兵])戦法(?!速度|威力|ゲージ|待ち時間|抑圧)/.test(text);
  return text.includes(k);
}
function inferStatusEffectRelationDirection(text,summaryKey){
  const src=normalizeMetricSearchText(normalizeHadouCrawlerTypoText(text||''));
  const key=norm(summaryKey||'');
  const metricKey=normalizeMetricSearchText(key);
  if(!src||!key||!hasStatusSummaryKeyHit(src,key))return '';
  const k=escRe(metricKey);
  if(key==='戦法ゲージ'&&/(戦法待ち時間[^。●▼■]{0,32}短縮|即時戦法|戦法短縮|戦法ゲージ[^。●▼■]{0,40}(上昇|増加)|戦法ゲージ[^。●▼■]{0,24}[+＋][0-9])/.test(src))return 'buff';
  if(key==='戦法ゲージ'&&new RegExp(k+'[^。●▼■]{0,32}(減少|奪う|上昇しなく|上昇しない|上昇不可)|'+k+'[^。●▼■]{0,24}[-₋－][0-9]|戦法待ち時間[^。●▼■]{0,32}(延長|増加)').test(src))return 'debuff';
  const plus=new RegExp(k+'[^。●▼■]{0,24}[+＋][0-9]|[+＋][0-9][^。●▼■]{0,24}'+k+'|'+k+'[^。●▼■]{0,40}(上昇|増加|高め|強化)|'+key+'上昇|'+key+'増加');
  const minus=new RegExp(k+'[^。●▼■]{0,24}[-₋－][0-9]|[-₋－][0-9][^。●▼■]{0,24}'+k+'|'+k+'[^。●▼■]{0,40}(低下|減少|下げ|弱化|半減|軽減)|'+key+'低下|'+key+'減少');
  if(key==='被ダメージ'){
    if(/に応じて|が高いほど|が低いほど|の値|増加量|効果量|算出|算定|判定|基準|条件|場合|味方|自部隊|解除|無効化|無効にする|発生しない|少ないほど|高いほど|低いほど/.test(src))return '';
    if(new RegExp(k+'[^。●▼■]{0,40}(低下|減少|軽減)|'+k+'[^。●▼■]{0,24}[-₋－][0-9]|'+key+'低下').test(src))return 'buff';
    if(new RegExp(k+'[^。●▼■]{0,40}(上昇|増加)|'+k+'[^。●▼■]{0,24}[+＋][0-9]|'+key+'上昇').test(src))return 'debuff';
  }
  if(key==='与ダメージ'){
    if(new RegExp(k+'[^。●▼■]{0,40}(低下|減少|下げ)|'+k+'[^。●▼■]{0,24}[-₋－][0-9]|'+key+'低下').test(src))return 'debuff';
    if(new RegExp(k+'[^。●▼■]{0,40}(上昇|増加|高め)|'+k+'[^。●▼■]{0,24}[+＋][0-9]|'+key+'上昇').test(src))return 'buff';
  }
  if(new RegExp('能力強化効果（[^）]{0,24}'+k+'[^）]{0,24}）|'+k+'[^。●▼■]{0,30}能力強化効果').test(src))return 'buff';
  if(new RegExp('能力弱化効果（[^）]{0,24}'+k+'[^）]{0,24}）|'+k+'[^。●▼■]{0,30}能力弱化効果').test(src))return 'debuff';
  if(plus.test(src))return 'buff';
  if(minus.test(src))return 'debuff';
  return '';
}
function inferStatusEffectTargetSide(text,windowText,hitIndex){
  const src=norm(text||'');
  const win=norm(windowText||src);
  const selfRe=/(自身|自部隊|味方|味方部隊|味方[0-9一二三四五六七八九十]+部隊|自軍|自分|自都市駐屯部隊)/g;
  const enemyRe=/(対象を含む敵|攻撃対象|敵[0-9一二三四五六七八九十]+部隊|敵部隊|対象部隊|敵)/g;
  const collect=(re,side,source)=>{const out=[];let m;re.lastIndex=0;while((m=re.exec(source))){out.push({side,index:m.index,text:m[0]});if(m[0].length===0)re.lastIndex++;}return out;};
  const pickAroundHit=(source,idx)=>{
    if(!(idx>=0))return '';
    const markers=[...collect(selfRe,'self',source),...collect(enemyRe,'enemy',source)].sort((a,b)=>a.index-b.index);
    if(!markers.length)return '';
    const before=markers.filter(m=>m.index<=idx).sort((a,b)=>b.index-a.index)[0];
    const after=markers.filter(m=>m.index>idx).sort((a,b)=>a.index-b.index)[0];
    if(before&&idx-before.index<=96)return before.side;
    if(after&&after.index-idx<=36)return after.side;
    return '';
  };
  const local=pickAroundHit(win,typeof hitIndex==='number'?hitIndex:-1);
  if(local)return local;
  const selfIdx=win.search(new RegExp(selfRe.source));
  const enemyIdx=win.search(new RegExp(enemyRe.source));
  if(selfIdx>=0&&enemyIdx>=0){
    if(typeof hitIndex==='number'&&hitIndex>=0){
      return Math.abs(hitIndex-selfIdx)<=Math.abs(hitIndex-enemyIdx)?'self':'enemy';
    }
    return selfIdx<=enemyIdx?'self':'enemy';
  }
  if(selfIdx>=0)return 'self';
  if(enemyIdx>=0)return 'enemy';
  const wholeSelf=src.search(new RegExp(selfRe.source));
  const wholeEnemy=src.search(new RegExp(enemyRe.source));
  if(wholeSelf>=0&&wholeEnemy>=0)return wholeSelf<=wholeEnemy?'self':'enemy';
  if(wholeSelf>=0)return 'self';
  if(wholeEnemy>=0)return 'enemy';
  return '';
}
function inferStatusEffectRelationContext(text,profile){
  const src=normalizeHadouCrawlerTypoText(text||'');
  const summaryKey=norm(profile?.summaryKey||'');
  const aliases=(profile?.aliases||[]).map(norm).filter(Boolean).sort((a,b)=>b.length-a.length);
  const names=[...(aliases||[]),summaryKey].filter(Boolean).sort((a,b)=>b.length-a.length);
  const hit=names.find(v=>v&&hasStatusSummaryKeyHit(src,v));
  const pos=hit?src.indexOf(hit):-1;
  const windowStart=hit?Math.max(0,pos-64):0;
  const windowText=hit?src.slice(windowStart,Math.min(src.length,pos+hit.length+104)):src;
  const hitIndexInWindow=hit?pos-windowStart:-1;
  const defensive=/(避ける|受けない|受けず|無効化|無効にする|発生を無効|防ぐ|防止)/.test(windowText);
  const bypass=/(無視して|無視する|無視できる|貫通|看破)/.test(windowText);
  const removeSelf=/(自身|自部隊|味方|自軍|自分)[^。●▼■]{0,96}(弱化|不利変化|不利状態|能力弱化|状態変化)[^。●▼■]{0,96}(解除|打ち消|消滅)|((弱化|不利変化|不利状態|能力弱化)[^。●▼■]{0,80}(解除|打ち消|消滅))/.test(windowText);
  const selfAbilityDebuffControl=/(自身|自部隊|味方|自軍|自分)[^。●▼■]{0,96}(攻撃|防御|知力|機動|兵力|攻撃速度|戦法速度|会心発生|会心威力|撃心発生|撃心威力|命中|与ダメージ|被ダメージ|通常攻撃威力|戦法威力|兵器速度)[^。●▼■]{0,24}(低下|減少|弱化|上昇|増加)[^。●▼■]{0,64}(解除|打ち消|消滅|無効化|無効にする|避ける|受けない|受けず|防ぐ|防止|しない)/.test(windowText);
  const removeEnemyBuff=/(敵|対象|攻撃対象)[^。●▼■]{0,96}(有利変化|強化効果|有利状態|強化)[^。●▼■]{0,96}(解除|打ち消|消滅|無効|無視)|(有利変化|強化効果|有利状態)[^。●▼■]{0,80}(解除|打ち消|消滅|無効|無視)/.test(windowText);
  let targetSide=inferStatusEffectTargetSide(src,windowText,hitIndexInWindow);
  let relationType='';
  let reason='base';
  if(removeEnemyBuff){relationType=bypass?'無視':'解除';targetSide='enemy';reason='remove-enemy-buff';}
  else if(selfAbilityDebuffControl){relationType=/解除|打ち消|消滅/.test(windowText)?'解除':(/避ける|受けない|受けず/.test(windowText)?'回避':'無効化');targetSide='self';reason='remove-self-debuff';}
  else if(bypass&&targetSide==='enemy'){relationType='無視';reason='enemy-resistance-bypass';}
  else if(defensive){relationType=/避ける|受けない|受けず/.test(windowText)?'回避':'無効化';targetSide='self';reason='defensive-context';}
  else if(removeSelf){relationType='解除';targetSide='self';reason='remove-self-debuff';}
  else if(/付与/.test(windowText)){relationType='付与';reason='apply';}
  else if(/上昇|増加|高め|強化|[+＋][0-9]/.test(windowText)){relationType='強化';reason='buff';}
  else if(/低下|減少|下げ|弱化|[-₋－][0-9]/.test(windowText)){relationType='弱化';reason='debuff';}
  return {relationType,targetSide,groupKey:'',reason,windowText};
}


function statusAbilityRelationBaseKeys(profile){
  const values=[profile?.summaryKey,profile?.displayName,profile?.originalName,...(Array.isArray(profile?.aliases)?profile.aliases:[])].map(norm).filter(Boolean);
  const out=[];
  values.forEach(v=>{
    let x=v.replace(/能力弱化効果|能力強化効果|弱化効果|強化効果|変化|低下|上昇|強化|弱化|効果/g,'').replace(/[（(][^）)]*[）)]/g,'');
    x=norm(x);
    if(x)out.push(x);
  });
  const abilityKeys=['通常攻撃威力','攻撃速度','会心発生','会心威力','戦法速度','戦法威力','撃心発生','撃心威力','兵器速度','対物特効','与ダメージ','被ダメージ','戦法ゲージ','命中','兵力','攻撃','防御','知力','機動'];
  values.forEach(v=>abilityKeys.forEach(k=>{if(v.includes(k))out.push(k);}));
  return uniq(out).sort((a,b)=>b.length-a.length);
}
function isComparisonOnlyAbilityCondition(text,profile,direction){
  if(!isAbilityStatusEffectProfile(profile))return false;
  const src=normalizeMetricSearchText(normalizeHadouCrawlerTypoText(text||''));
  const wanted=norm(profile?.direction||direction||'');
  if(!src||wanted!=='debuff')return false;
  const keys=statusAbilityRelationBaseKeys(profile);
  if(!keys.length)return false;
  return keys.some(key=>{
    const k=escRe(key);
    // 能力弱化効果（攻撃）を避ける等は自部隊不利対策として維持する。
    if(new RegExp('能力弱化効果[（(][^）)]*'+k+'[^）)]*[）)]').test(src))return false;
    // 本物の低下方向が明示されている場合は除外しない。
    // ただし『知力の低い敵部隊から受ける弱化効果』のような比較条件+弱化効果は能力低下ではないため、ここでは『弱化』単独を明示方向として扱わない。
    if(new RegExp(k+'[^。●▼■]{0,32}(低下|減少|下げ)|'+k+'低下|'+k+'減少').test(src))return false;
    const segs=src.split(/[。●▼■]/).map(norm).filter(Boolean).filter(seg=>seg.includes(key)||new RegExp('(低|高)'+k).test(seg));
    return segs.some(seg=>{
      // 比較条件。「知力の低い敵部隊」「自部隊より最大兵力の低い部隊」「敵部隊より高い場合」等は能力低下ではない。
      const comparisonPatterns=[
        new RegExp(k+'(?:の)?[^。●▼■]{0,20}(低い|高い|より低い|より高い)'),
        new RegExp('(自部隊より|敵部隊より|対象より|部隊より)[^。●▼■]{0,24}'+k+'[^。●▼■]{0,24}(低い|高い)'),
        new RegExp(k+'[^。●▼■]{0,24}(敵部隊より|自部隊より|対象より|部隊より)[^。●▼■]{0,24}(高い|低い)'),
        new RegExp('(低'+k+'|高'+k+')'),
        new RegExp('(低い|高い)[^。●▼■]{0,12}'+k)
      ];
      if(comparisonPatterns.some(re=>re.test(seg)))return true;
      if(key==='兵力'&&/(最大兵力|兵力)[^。●▼■]{0,32}(低い|高い|より低い|より高い)/.test(seg))return true;
      // 加算/上乗せは自部隊側の加算・強化文脈であり、敵部隊能力低下ではない。
      const additive=/(上乗せ|加算)/.test(seg)&&new RegExp(k).test(seg);
      if(additive)return true;
      return false;
    });
  });
}

function isSelfSideOnlyAbilityTextOppositeDebuff(text,profile,direction){
  if(!isAbilityStatusEffectProfile(profile))return false;
  const wanted=norm(profile?.direction||direction||'');
  if(wanted!=='debuff')return false;
  const src=normalizeMetricSearchText(normalizeHadouCrawlerTypoText(text||''));
  if(!src)return false;
  const keys=statusAbilityRelationBaseKeys(profile);
  if(!keys.length)return false;
  const selfSide='(自身|自部隊|味方|味方[0-9一二三四五六七八九十]+部隊|部隊)';
  return keys.some(key=>{
    const k=escRe(key);
    // 能力値を参照する条件文（防御500につき、戦法速度に応じて等）は能力低下そのものではない。
    if(new RegExp(k+'[^。●▼■]{0,28}(につき|に応じて|が高いほど|が低いほど|に比例|を参照|の値|の高低|が高い場合|が低い場合|判定|基準|決定|算出|算定|換算|性能|選択|比較|効果量|増加量)').test(src)&&!new RegExp(k+'[^。●▼■]{0,32}(低下|減少|下げ)|'+key+'低下').test(src))return true;
    // 「自部隊の攻撃低下を解除/無効化」「被ダメージ上昇しない」は敵部隊能力低下ではなく自部隊不利対策または非発生表現。
    if(new RegExp('(自身|自部隊|味方|自軍|自分)[^。●▼■]{0,80}'+k+'[^。●▼■]{0,24}(低下|減少|弱化|上昇|増加)[^。●▼■]{0,64}(解除|打ち消|消滅|無効化|無効にする|避ける|受けない|受けず|防ぐ|防止|しない)').test(src))return true;
    if(new RegExp(k+'[^。●▼■]{0,24}(低下|減少|上昇|増加|弱化)[^。●▼■]{0,8}しない').test(src))return true;
    // 「敵4部隊に400%の攻撃」「通常攻撃」「戦法攻撃」「攻撃目標」は攻撃低下ではない。
    if(key==='攻撃'&&/(通常攻撃|戦法攻撃|攻撃目標|[0-9０-９]+％の攻撃|[0-9０-９]+%の攻撃|ダメージを与える|効果系統攻撃|攻撃属性|受けた攻撃|攻撃を受け|攻撃の威力|攻撃を無効化|攻撃無効|防御無視攻撃)/.test(src)&&!/(攻撃[^。●▼■]{0,32}(低下|減少|下げ)|攻撃低下|攻撃[^。●▼■]{0,24}[-₋－][0-9])/.test(src))return true;
    // 自部隊/味方/部隊の与ダメージ上昇は、敵部隊の与ダメージ低下へ逆変換しない。
    if(key==='与ダメージ'&&new RegExp(selfSide+'[^。●▼■]{0,80}'+k+'[^。●▼■]{0,40}(上昇|増加|高め|[+＋][0-9])|'+k+'[^。●▼■]{0,40}(上昇|増加|高め|[+＋][0-9])').test(src)&&!new RegExp(k+'[^。●▼■]{0,40}(低下|減少|下げ|[-₋－][0-9])|'+key+'低下').test(src))return true;
    // 自部隊/味方/部隊の被ダメージ軽減/低下は、敵部隊の被ダメージ上昇へ逆変換しない。
    if(key==='被ダメージ'&&new RegExp(selfSide+'[^。●▼■]{0,96}'+k+'[^。●▼■]{0,48}(軽減|低下|減少|[-₋－][0-9])|'+k+'[^。●▼■]{0,48}(軽減|低下|減少|[-₋－][0-9])').test(src)&&!new RegExp(k+'[^。●▼■]{0,40}(上昇|増加|[+＋][0-9])|'+key+'上昇').test(src))return true;
    // 自部隊/味方/部隊の能力上昇は、同名能力の敵部隊低下へ逆変換しない。
    if(['攻撃','防御','知力','機動','攻撃速度','戦法速度','会心発生','会心威力','命中','通常攻撃威力','戦法威力','兵器速度'].includes(key)&&new RegExp(selfSide+'[^。●▼■]{0,80}'+k+'[^。●▼■]{0,40}(上昇|増加|高め|[+＋][0-9])|'+k+'[^。●▼■]{0,40}(上昇|増加|高め|[+＋][0-9])').test(src)&&!new RegExp(k+'[^。●▼■]{0,40}(低下|減少|下げ|[-₋－][0-9])|'+key+'低下').test(src))return true;
    // 「攻撃または知力の高い方」「攻撃/知力が敵部隊より高い場合」「現在兵力が自部隊より低い」などは比較条件であり低下ではない。
    const compare=[
      new RegExp(k+'(?:または|/|／|、)[^。●▼■]{0,16}(攻撃|防御|知力|兵力|現在兵力|最大兵力)[^。●▼■]{0,32}(高い方|低い方)'),
      new RegExp(k+'[^。●▼■]{0,32}(敵部隊より|自部隊より|対象より|部隊より)[^。●▼■]{0,24}(高い|低い|上回|下回)'),
      new RegExp('(敵部隊より|自部隊より|対象より|部隊より)[^。●▼■]{0,32}'+k+'[^。●▼■]{0,24}(高い|低い|上回|下回)'),
      new RegExp('(現在兵力|最大兵力|兵力)[^。●▼■]{0,40}(自部隊より低い|敵部隊より低い|低い部隊|より低い部隊|高い部隊|より高い部隊)'),
      new RegExp('(低'+k+'|高'+k+')[^。●▼■]{0,40}(敵|部隊|対象)')
    ];
    if(compare.some(re=>re.test(src))&&!new RegExp(k+'[^。●▼■]{0,32}(低下|減少|下げ)|'+key+'低下').test(src))return true;
    return false;
  });
}


function isGenericFalsePositiveAbilityDebuffMention(text,profile,ctx,direction){
  if(!isAbilityStatusEffectProfile(profile))return false;
  const wanted=norm(profile?.direction||direction||'');
  if(wanted!=='debuff')return false;
  const src=normalizeMetricSearchText(normalizeHadouCrawlerTypoText(text||''));
  if(!src)return false;
  const reason=norm(ctx?.reason||'');
  const relation=norm(ctx?.relationType||'');
  // 自部隊不利対策として明示される能力弱化効果（攻撃）などは維持する。
  if(/defensive|remove-self-debuff|resistance/.test(reason)||/回避|無効化|反射|受けない|受けず/.test(relation))return false;
  const keys=statusAbilityRelationBaseKeys(profile);
  if(!keys.length)return false;
  return keys.some(key=>{
    const k=escRe(key);
    const actualDebuff=new RegExp(k+'[^。●▼■]{0,32}(低下|減少|下げ|弱化|[-₋－][0-9])|'+k+'低下|'+k+'減少');
    // 被ダメージ上昇は敵部隊へ付与する場合は本物の敵部隊能力低下だが、参照・条件・味方付与・解除/無効文脈は除外する。
    if(key==='被ダメージ'&&new RegExp(k+'[^。●▼■]{0,48}(参照|に応じて|が高いほど|が低いほど|の値|増加量|効果量|算出|算定|判定|基準|条件|場合|味方|自部隊|部隊|解除|無効化|無効にする|発生しない)|味方[^。●▼■]{0,48}'+k+'[^。●▼■]{0,48}(上昇|増加)|敵部隊[^。●▼■]{0,48}'+k+'上昇[^。●▼■]{0,32}(解除|無効化|無効にする)').test(src))return true;
    const actualDamageTakenUp=(key==='被ダメージ')&&new RegExp(k+'[^。●▼■]{0,32}(上昇|増加|[+＋][0-9])|'+k+'上昇').test(src);
    if(actualDamageTakenUp)return false;
    // 「攻撃低下を解除/無効/防止」のような解除・防止文は、敵部隊能力低下そのものではない。
    if(actualDebuff.test(src)&&new RegExp(k+'[^。●▼■]{0,32}(低下|減少|弱化)?[^。●▼■]{0,32}(解除|打ち消|消滅|無効化|無効にする|防ぐ|防止|発生しない|しない)').test(src))return true;
    if(actualDebuff.test(src))return false;
    const neutralPatterns=[
      new RegExp(k+'[^。●▼■]{0,40}(上昇|増加|強化|高め|[+＋][0-9]|上乗せ|加算)'),
      new RegExp(k+'[^。●▼■]{0,48}(参照|に応じて|につき|が高いほど|が低いほど|に比例|の値|高い方|低い方|同値|場合|条件|判定|基準|決定|算出|算定|換算|性能|選択|比較|高低|増加量|効果量)'),
      new RegExp(k+'[^。●▼■]{0,48}(無視|無効|無効化|解除|打ち消|消滅|受ける|受けた|威力|系統|属性|目標|対象|回復|軽減|短縮|拡張|発生|耐性|範囲|距離|長い|短い|速い|遅い|多い|少ない|大きい|小さい|上限|下限|付与|維持|得る|行う|行った|する)'),
      new RegExp('(通常攻撃|戦法攻撃|物理系統の攻撃|知力系統の攻撃|防御無視攻撃|攻撃無効|攻撃を受け|攻撃の威力|攻撃対象|攻撃間隔|攻撃属性)')
    ];
    if(neutralPatterns.some(re=>re.test(src)))return true;
    // 能力名が含まれるだけの「説明・条件・対象側」文は採用しない。
    if(new RegExp('(自身|自部隊|味方|部隊|副将|主将|補佐|敵部隊)[^。●▼■]{0,80}'+k).test(src)&&!actualDebuff.test(src))return true;
    return false;
  });
}

function isDefensiveAbilityDebuffExplicit(text,profile){
  if(!isAbilityStatusEffectProfile(profile))return true;
  const wanted=norm(profile?.direction||'');
  if(wanted!=='debuff')return true;
  const src=normalizeMetricSearchText(normalizeHadouCrawlerTypoText(text||''));
  const relationKeys=statusAbilityRelationBaseKeys(profile);
  const explicitNames=[profile?.displayName,profile?.originalName,...(Array.isArray(profile?.aliases)?profile.aliases:[])].map(v=>normalizeMetricSearchText(norm(v))).filter(Boolean).filter(v=>/(低下|上昇|変化|弱化|強化|減少|増加)/.test(v));
  if(src&&explicitNames.some(name=>new RegExp(escRe(name)+'[^。●▼■]{0,40}(避ける|受けない|受けず|無効化|無効にする|防ぐ|防止|解除|打ち消|消滅)').test(src)))return true;
  if(!src||!relationKeys.length)return false;
  return relationKeys.some(key=>{
    const k=escRe(key);
    // 能力弱化効果（攻撃）を避ける、攻撃低下を避ける等は自部隊不利対策として維持。
    if(new RegExp('能力弱化効果[（(][^）)]*'+k+'[^）)]*[）)]').test(src))return true;
    if(new RegExp(k+'(?:低下|減少|弱化|変化)?[^。●▼■]{0,32}(避ける|受けない|受けず|無効化|無効にする|防ぐ|防止)').test(src)&&new RegExp(k+'[^。●▼■]{0,24}(低下|減少|弱化)|'+k+'低下|能力弱化効果').test(src))return true;
    if(new RegExp('(能力弱化|弱化効果|不利変化|不利状態)[^。●▼■]{0,48}'+k).test(src))return true;
    return false;
  });
}
function isExplicitAbilityRelationContext(text,profile,ctx,direction){
  if(!isAbilityStatusEffectProfile(profile))return true;
  if(isComparisonOnlyAbilityCondition(text,profile,direction))return false;
  if(isGenericFalsePositiveAbilityDebuffMention(text,profile,ctx,direction))return false;
  const relation=norm(ctx?.relationType||'');
  const reason=norm(ctx?.reason||'');
  if(/回避|無効化|解除|反射|受けない|受けず|無視/.test(relation)||/defensive|remove-|resistance/.test(reason)){
    if(isAbilityStatusEffectProfile(profile)&&norm(profile?.direction||direction||'')==='debuff'&&!isDefensiveAbilityDebuffExplicit(text,profile))return false;
    return true;
  }
  if(isSelfSideOnlyAbilityTextOppositeDebuff(text,profile,direction))return false;
  const src=normalizeMetricSearchText(normalizeHadouCrawlerTypoText(text||''));
  const key=norm(profile?.summaryKey||'');
  const metricKey=normalizeMetricSearchText(key);
  const wanted=norm(profile?.direction||direction||'');
  if(!src||!key||!wanted)return true;
  const k=escRe(metricKey);
  // 追加効果表の「攻撃速度変化 / 味方・敵」だけは対象側で上昇/低下を読む既存仕様を維持する。
  if(new RegExp(k+'\\s*変化').test(src)&&/(味方|自部隊|自身|敵|対象)/.test(src))return true;
  // 戦法短縮はデータ上「戦法待ち時間を短縮」「即時戦法」と表記されるため、戦法ゲージの別表記として扱う。
  if(key==='戦法ゲージ'){
    if(wanted==='buff')return /(戦法待ち時間[^。●▼■]{0,32}短縮|即時戦法|戦法短縮|戦法ゲージ[^。●▼■]{0,40}(上昇|増加)|戦法ゲージ[^。●▼■]{0,24}[+＋][0-9])/.test(src);
    if(wanted==='debuff')return /(戦法ゲージ[^。●▼■]{0,32}(減少|奪う|上昇しなく|上昇しない|上昇不可)|戦法ゲージ[^。●▼■]{0,24}[-₋－][0-9]|戦法待ち時間[^。●▼■]{0,32}(延長|増加))/.test(src);
  }
  // 「与ダメージが減少しない」「被ダメージが上昇しない」等は非発生・防止表現であり、敵部隊能力低下/上昇として採用しない。
  if(new RegExp(k+'[^。●▼■]{0,24}(低下|減少|上昇|増加|弱化)[^。●▼■]{0,8}しない').test(src))return false;
  if(new RegExp(k+'[^。●▼■]{0,20}(につき|に応じて|が高いほど|が低いほど|に比例|を参照|の値|の高低|が高い場合|が低い場合)').test(src)&&!new RegExp(k+'[^。●▼■]{0,32}(低下|減少|下げ|上昇|増加)|'+key+'低下|'+key+'上昇').test(src))return false;
  const positive=new RegExp(k+'[^。●▼■]{0,32}([+＋][0-9]|上昇|増加|高め|強化|上乗せ|加算)|([+＋][0-9])[^。●▼■]{0,24}'+k+'|'+k+'上昇|'+k+'増加');
  const negative=new RegExp(k+'[^。●▼■]{0,32}([-₋－][0-9]|低下|減少|下げ|弱化|半減|軽減)|([-₋－][0-9])[^。●▼■]{0,24}'+k+'|'+k+'低下|'+k+'減少');
  if(key==='被ダメージ'){
    return wanted==='buff'
      ? new RegExp(k+'[^。●▼■]{0,40}(低下|減少|軽減)|'+k+'[^。●▼■]{0,24}[-₋－][0-9]|'+key+'低下').test(src)
      : new RegExp(k+'[^。●▼■]{0,40}(上昇|増加)|'+k+'[^。●▼■]{0,24}[+＋][0-9]|'+key+'上昇').test(src);
  }
  if(key==='与ダメージ'){
    return wanted==='buff'
      ? new RegExp(k+'[^。●▼■]{0,40}(上昇|増加|高め)|'+k+'[^。●▼■]{0,24}[+＋][0-9]|'+key+'上昇').test(src)
      : new RegExp(k+'[^。●▼■]{0,40}(低下|減少|下げ)|'+k+'[^。●▼■]{0,24}[-₋－][0-9]|'+key+'低下').test(src);
  }
  return wanted==='buff'?positive.test(src):negative.test(src);
}

function isStrictAbilityDirectionContextMismatch(profile,ctx,direction){
  if(!isAbilityStatusEffectProfile(profile))return false;
  const wanted=norm(profile?.direction||'');
  const side=norm(ctx?.targetSide||'');
  const dir=norm(direction||'');
  const relation=norm(ctx?.relationType||'');
  const reason=norm(ctx?.reason||'');
  const resistance=/回避|無効化|解除|反射|受けない|受けず/.test(relation)||/defensive|remove-self-debuff|resistance/.test(reason);
  if(resistance)return false;
  // 能力低下系は「敵にかかる低下」または明示的な低下方向が必要。
  // 敦睦の「自身の魅力を攻撃、防御、知力に加算」「攻撃または知力」は self 文脈かつ方向語なしのため対象外。
  if(wanted==='debuff'&&side==='self'&&!dir)return true;
  if(wanted==='buff'&&side==='enemy'&&!dir)return true;
  if(wanted&&dir&&wanted!==dir)return true;
  return false;
}
function resolveStatusEffectRelationGroup(profile,ctx,direction){
  const isAbility=isAbilityStatusEffectProfile(profile);
  const relation=norm(ctx?.relationType||'');
  const side=norm(ctx?.targetSide||'');
  const dir=norm(direction||profile?.direction||'');
  const reason=norm(ctx?.reason||'');
  // 耐性系は能力/状態そのものと分離する。これにより「攻撃低下回避」「萎縮回避」が自部隊状態強化へ混入しない。
  if(reason==='remove-enemy-buff'||reason==='enemy-resistance-bypass'||(side==='enemy'&&/解除|無視|無効化|封じ/.test(relation)))return 'enemyResistanceDebuff';
  if(reason==='defensive-context'||reason==='remove-self-debuff'||(side==='self'&&/回避|無効化|反射|解除/.test(relation)))return 'selfResistanceBuff';
  if(isAbility){
    if(side==='self'&&dir!=='debuff')return 'selfAbilityBuff';
    if(side==='enemy'&&dir!=='buff')return 'enemyAbilityDebuff';
    if(dir==='debuff')return 'enemyAbilityDebuff';
    return 'selfAbilityBuff';
  }
  if(side==='self')return 'selfStateBuff';
  if(side==='enemy')return 'enemyStateDebuff';
  return getStatusEffectRelationGroupKey(findStatusEffectItemByAnyName(profile?.displayName||profile?.originalName)||profile?.displayName||profile?.originalName);
}
function selfResistanceAbilityDebuffDisplayName(key){
  const k=norm(key).replace(/変化|弱化効果|能力弱化効果/g,'');
  const map={兵力:'兵力低下',攻撃:'攻撃低下',防御:'防御低下',知力:'知力低下',機動:'機動低下',攻撃速度:'攻撃速度低下',会心発生:'会心発生低下',会心威力:'会心威力低下',戦法速度:'戦法速度低下',戦法ゲージ:'戦法遅延',対物特効:'対物特効低下',与ダメージ:'与ダメージ低下',被ダメージ:'被ダメージ上昇',戦法威力:'戦法威力低下',撃心発生:'撃心発生低下',撃心威力:'撃心威力低下',兵器速度:'兵器速度低下',命中:'命中低下',通常攻撃威力:'通常攻撃威力低下'};
  return map[k]||'';
}
function collectSelfResistanceSupplementalRelationsFromText(text){
  const src=normalizeHadouCrawlerTypoText(text||'');
  const out=[];
  const push=(name,reason,raw)=>{const n=norm(name);if(!n)return;out.push({name:n,groupKey:'selfResistanceBuff',relationType:'回避',reason, targetSide:'self', rawText:norm(raw||'')});};
  if(!/(避ける|受けない|受けず|無効化|無効にする|防ぐ|防止|発生しない)/.test(src))return out;
  const windows=src.split(/[■●▼。]/).map(norm).filter(Boolean);
  windows.forEach(seg=>{
    if(!/(避ける|受けない|受けず|無効化|無効にする|防ぐ|防止|発生しない)/.test(seg))return;
    let m;
    const abilityRe=/能力弱化効果[（(]([^）)]+)[）)]/g;
    while((m=abilityRe.exec(seg))){
      norm(m[1]).split(/[、,，・/／と]/).map(norm).filter(Boolean).forEach(key=>push(selfResistanceAbilityDebuffDisplayName(key),'self-resistance-supplement:ability-debuff',seg));
    }
    ['萎縮','強化解除','弱化解除','強化無効','弱化無効','同討','恐怖','畏怖','混乱','通常攻撃縮小','戦法弱化','戦法遅延','攻撃速度低下','戦法速度低下','攻撃低下','防御低下','知力低下','機動低下'].forEach(name=>{
      const n=norm(name);
      if(n&&new RegExp(escRe(n)+'[^。●▼■]{0,80}(?:を)?(?:避ける|受けない|受けず|無効化|無効にする|防ぐ|防止|発生しない)').test(seg))push(n,'self-resistance-supplement:explicit-effect',seg);
    });
    // 「能力弱化効果（攻撃）と萎縮を避ける」のように、括弧内能力名の後ろに「と状態名」が続く表記を補足する。
    const tail=seg.match(/能力弱化効果[（(][^）)]+[）)]([^。●▼■]{0,80})(?:避ける|受けない|受けず|無効化|無効にする|防ぐ|防止)/);
    if(tail){norm(tail[1]).split(/[、,，・/／と]/).map(v=>v.replace(/を$/,'')).map(norm).filter(Boolean).forEach(name=>{
      if(name&&!/^(一部の|自身|自部隊|にかかる)$/.test(name))push(name,'self-resistance-supplement:tail-effect',seg);
    });}
  });
  const seen=new Set();
  return out.filter(v=>{const key=[v.name,v.groupKey,v.reason].join('@@');if(seen.has(key))return false;seen.add(key);return true;});
}
function isSupplementalStatusEffectMentionOnlyForRelatedLinks(source,profile,relation){
  const src=normalizeHadouCrawlerTypoText(source||'');
  const group=norm(relation?.groupKey||'');
  if(!src||!profile||!group)return false;
  const names=[profile.displayName,profile.originalName,profile.summaryKey,...(profile.aliases||[])].map(norm).filter(Boolean);
  const unique=[...new Set(names)].filter(v=>v.length>=2);
  for(const name of unique){
    const n=escRe(name);
    // HADO-2.8.9.44: 項籍/震天の「※分断などの...状態変化...自体は敵部隊から付与されうる」は、
    // 敵へ分断を付与する効果ではなく補足説明。状態変化関連リンクの通常弱化には採用しない。
    const supplementalMention=new RegExp(n+'などの[^。●▼■]{0,120}状態変化').test(src)||new RegExp('状態変化[^。●▼■]{0,120}'+n+'など').test(src);
    const explicitSupplement=/※|補足|自体は敵部隊から付与されうる|発生中も|対象にならないため|1部隊分として消費されない/.test(src);
    const actualEnemyApply=new RegExp('(敵|対象)[^。●▼■]{0,24}(に|へ)[^。●▼■]{0,24}'+n+'[^。●▼■]{0,24}(付与|発生)').test(src);
    const actualSelfApply=new RegExp('(自身|自部隊|味方)[^。●▼■]{0,24}(に|へ)[^。●▼■]{0,24}'+n+'[^。●▼■]{0,24}(付与|発生)').test(src);
    if(supplementalMention&&explicitSupplement&&!actualEnemyApply&&!actualSelfApply){
      return true;
    }
  }
  return false;
}

function isExplicitStatusNullifyRelationForProfile(source,profile,relation){
  const rel=norm(relation?.relationType||relation||'');
  if(!/無効化|無効/.test(rel))return true;
  const src=normalizeHadouCrawlerTypoText(source||'');
  if(!src)return false;
  const display=norm(profile?.displayName||profile?.originalName||profile?.summaryKey||'');
  if(display&&/(無効|遮断|耐性|不退|堅固|回避|反射)$/.test(display))return true;
  if(isAbilityStatusEffectProfile(profile))return isDefensiveAbilityDebuffExplicit(src,profile);
  const names=[profile?.displayName,profile?.originalName,profile?.summaryKey,...(Array.isArray(profile?.aliases)?profile.aliases:[])].map(norm).filter(Boolean).sort((a,b)=>b.length-a.length);
  for(const name of [...new Set(names)]){
    if(!name||name.length<2)continue;
    const n=escRe(name);
    if(new RegExp(n+'[^。●▼■]{0,48}(?:を|が|の発生を|の付与を)?[^。●▼■]{0,24}(?:無効化|無効にする|無効|発生しない|防ぐ|防止)').test(src))return true;
    if(new RegExp('(?:無効化|無効にする|無効|発生しない|防ぐ|防止)[^。●▼■]{0,32}'+n).test(src))return true;
  }
  return false;
}
function shouldSuppressOverbroadStatusNullifyRelation(source,profile,relation){
  const rel=norm(relation?.relationType||'');
  const group=norm(relation?.groupKey||'');
  const reason=norm(relation?.reason||'');
  if(!/無効化|無効/.test(rel))return false;
  if(group!=='selfResistanceBuff'&&group!=='enemyResistanceDebuff')return false;
  if(!/defensive-context|ability-summary-context|summaryKey\+direction|alias/.test(reason))return false;
  return !isExplicitStatusNullifyRelationForProfile(source,profile,relation);
}

function collectStatusEffectRelationsFromText(text,statusEffectNames){
  const source=normalizeHadouCrawlerTypoText(text||'');
  const out=[];
  const seen=new Set();
  if(!source)return out;
  const profiles=getStatusEffectProfilesForRelatedLinks(statusEffectNames);
  profiles.forEach(profile=>{
    const r=detectStatusEffectRelationForOwnerText(source,profile);
    if(!r.matched)return;
    const display=profile.displayName||profile.originalName;
    if(!display)return;
    if(isSupplementalStatusEffectMentionOnlyForRelatedLinks(source,profile,r)){
      debugLog('relatedStatusEffects:supplemental-mention-suppressed',{source:'HADO-2.8.9.44',name:display,groupKey:r.groupKey||'',reason:r.reason||'',textSample:source.slice(0,260),policy:'補足説明内の「分断など」は付与・発生効果ではないため通常状態変化関連リンクから除外する。'});
      return;
    }
    if(shouldSuppressOverbroadStatusNullifyRelation(source,profile,r)){
      debugLog('relatedStatusEffects:overbroad-nullify-suppressed',{source:'HADO-2.9.0.13',name:display,groupKey:r.groupKey||'',relationType:r.relationType||'',reason:r.reason||'',textSample:source.slice(0,260),policy:'〇〇無効は、対象状態変化そのものを無効化する明示文がある場合だけ生成する。味方付与や別状態の弱化無効/状態変化無効に近接しただけでは生成しない。'});
      return;
    }
    const key=[display,r.groupKey||'',r.relationType||''].join('@@');
    if(seen.has(key))return;
    seen.add(key);
    out.push({name:display,groupKey:r.groupKey||'',relationType:r.relationType||'',reason:r.reason||'',targetSide:r.targetSide||''});
  });
  const supplemental=collectSelfResistanceSupplementalRelationsFromText(source);
  supplemental.forEach(v=>{
    const key=[v.name,v.groupKey||'',v.relationType||''].join('@@');
    if(seen.has(key))return;
    seen.add(key);
    out.push(v);
  });
  if(supplemental.length)debugLog('relatedStatusEffects:selfResistance-supplement',{source:'HADO-2.7.0.3',supplemental:supplemental.slice(0,20),textSample:source.slice(0,240),policy:'実データ経路で能力弱化効果（攻撃）と萎縮を避ける等を自部隊不利対策へ補足分類。クローリングデータ由来の委縮表記は内部で萎縮に正規化し、状態変化率サマリーには反映しない。'});
  return out;
}

function isNeutralAbilityDebuffRegressionText(text,profile){
  const src=normalizeMetricSearchText(normalizeHadouCrawlerTypoText(text||''));
  const key=norm(profile?.summaryKey||'');
  if(!src||!key||norm(profile?.direction||'')!=='debuff')return false;
  const k=escRe(normalizeMetricSearchText(key));
  // FIX[HADO-2.7.3.20-STATUS-REGRESSION-49]:
  // 回帰チェックNo.2352/2386/2494-2500/3012/3052/3181-3197/3212/3291/4012/4052/4181-4197/4212/4291/4832/4872で残った
  // 1) 自部隊・味方への能力上昇説明、2) 敵部隊の能力上昇解除説明、3) 補正値説明、4) 条件文、5) 「低下ではなく上昇解除」説明は、
  // 敵部隊能力低下そのものではないため、実関数経路でも enemyAbilityDebuff へ残さない。
  if(/補正値を説明する本文であり[^。●▼■]{0,32}能力低下ではない/.test(src))return true;
  if(new RegExp(k+'[^。●▼■]{0,24}補正値[^。●▼■]{0,32}(説明|本文)').test(src)&&/能力低下ではない/.test(src))return true;
  if(new RegExp(k+'[^。●▼■]{0,24}が一定以上のとき').test(src))return true;
  if(new RegExp(k+'低下[^。●▼■]{0,16}ではなく[^。●▼■]{0,32}'+k+'上昇[^。●▼■]{0,32}(解除説明|解除|取り除く|無効化)').test(src))return true;
  if(new RegExp('(敵部隊|対象)[^。●▼■]{0,48}'+k+'上昇[^。●▼■]{0,48}(取り除く|解除|無効化|無効にする)').test(src))return true;
  if(new RegExp('(自身|自部隊|味方)[^。●▼■]{0,48}'+k+'[^。●▼■]{0,32}(上昇|増加|付与|強化)').test(src))return true;
  if(key==='被ダメージ'){
    if(new RegExp(k+'[^。●▼■]{0,48}(に応じて|が高いほど|が低いほど|の値|増加量|効果量|算出|算定|判定|基準|条件|場合|少ないほど|高いほど|低いほど)').test(src))return true;
    if(new RegExp('(味方|自部隊)[^。●▼■]{0,64}'+k+'[^。●▼■]{0,48}(上昇|増加|付与)|'+k+'[^。●▼■]{0,48}(味方|自部隊)[^。●▼■]{0,48}(付与|上昇|増加)').test(src))return true;
    if(new RegExp('(敵部隊|対象)[^。●▼■]{0,48}'+k+'上昇[^。●▼■]{0,32}(解除|無効化|無効にする)|'+k+'上昇[^。●▼■]{0,32}(解除|無効化|無効にする)').test(src))return true;
  }
  return false;
}

function detectStatusEffectRelationInText(text,profile){
  const src=normalizeHadouCrawlerTypoText(text||'');
  if(!src||!profile)return {matched:false,unknown:false,reason:'empty'};
  if(isNeutralAbilityDebuffRegressionText(src,profile))return {matched:false,unknown:false,reason:'neutral-ability-debuff-regression-suppressed'};
  const aliases=(profile.aliases||[]).filter(v=>v&&v!==profile.summaryKey);
  const strongAlias=aliases.find(a=>a&&hasStatusSummaryKeyHit(src,a));
  const direction=inferStatusEffectRelationDirection(src,profile.summaryKey);
  const ctx=inferStatusEffectRelationContext(src,profile);
  const relationAllowsDirectionMismatch=/回避|無効化|解除|反射|無視|封じ/.test(norm(ctx?.relationType||''))||/defensive|remove-|resistance/.test(norm(ctx?.reason||''));
  const damageTakenNeutralContext=norm(profile?.summaryKey||'')==='被ダメージ'&&/(に応じて|が高いほど|が低いほど|の値|増加量|効果量|算出|算定|判定|基準|条件|場合|味方|自部隊|解除|無効化|無効にする|発生しない|少ないほど|高いほど|低いほど)/.test(normalizeMetricSearchText(normalizeHadouCrawlerTypoText(src)));
  const abilityInverseDirectionAllowed=isAbilityStatusEffectProfile(profile)&&norm(profile?.summaryKey||'')==='被ダメージ'&&profile.direction==='debuff'&&!damageTakenNeutralContext&&/(被ダメ[ー－-]ジ[^。●▼■]{0,40}(上昇|増加)|被ダメ[ー－-]ジ[^。●▼■]{0,24}[+＋][0-9]|被ダメ[ー－-]ジ上昇)/.test(normalizeMetricSearchText(normalizeHadouCrawlerTypoText(src)));
  const effectiveDirection=abilityInverseDirectionAllowed?'debuff':direction;
  if(!isExplicitAbilityRelationContext(src,profile,ctx,effectiveDirection||direction))return {matched:false,unknown:false,reason:'implicit-ability-direction-suppressed',direction:effectiveDirection||direction,relationType:ctx.relationType,targetSide:ctx.targetSide};
  if(profile.direction&&direction&&direction!==profile.direction&&!relationAllowsDirectionMismatch&&!abilityInverseDirectionAllowed)return {matched:false,unknown:false,reason:'direction-mismatch',direction,relationType:ctx.relationType,targetSide:ctx.targetSide};
  if(shouldSuppressDefensiveAbilityDebuff(profile,ctx))return {matched:false,unknown:false,reason:'suppress-defensive-ability-debuff',direction:effectiveDirection||direction,relationType:ctx.relationType,targetSide:ctx.targetSide};
  if(isStrictAbilityDirectionContextMismatch(profile,ctx,effectiveDirection||direction))return {matched:false,unknown:false,reason:'strict-ability-direction-context-mismatch',direction:effectiveDirection||direction,relationType:ctx.relationType,targetSide:ctx.targetSide};
  const groupKey=resolveStatusEffectRelationGroup(profile,ctx,effectiveDirection||direction);
  if(strongAlias&&(!profile.direction||!(effectiveDirection||direction)||(effectiveDirection||direction)===profile.direction||relationAllowsDirectionMismatch||groupKey))return {matched:true,unknown:false,reason:ctx.reason==='base'?'alias':ctx.reason,alias:strongAlias,direction:effectiveDirection||direction,relationType:ctx.relationType,groupKey,targetSide:ctx.targetSide};
  if(profile.summaryKey&&hasStatusSummaryKeyHit(src,profile.summaryKey)){
    if(shouldSuppressDefensiveAbilityDebuff(profile,ctx))return {matched:false,unknown:false,reason:'suppress-defensive-ability-debuff',direction:effectiveDirection||direction,relationType:ctx.relationType,targetSide:ctx.targetSide};
    if(isStrictAbilityDirectionContextMismatch(profile,ctx,effectiveDirection||direction))return {matched:false,unknown:false,reason:'strict-ability-direction-context-mismatch',direction:effectiveDirection||direction,relationType:ctx.relationType,targetSide:ctx.targetSide};
    if(((effectiveDirection||direction)&&(!profile.direction||(effectiveDirection||direction)===profile.direction))||groupKey)return {matched:true,unknown:false,reason:ctx.reason==='base'?'summaryKey+direction':ctx.reason,direction:effectiveDirection||direction,relationType:ctx.relationType,groupKey,targetSide:ctx.targetSide};
    return {matched:false,unknown:true,reason:'summaryKey-without-direction',direction:effectiveDirection||direction};
  }
  return {matched:false,unknown:false,reason:'no-hit'};
}

function detectStatusEffectRelationForOwnerText(text,profile){
  const primary=detectStatusEffectRelationInText(text,profile);
  if(primary.matched)return primary;
  const src=normalizeHadouCrawlerTypoText(text||'');
  if(isNeutralAbilityDebuffRegressionText(src,profile))return primary;
  const summaryKey=norm(profile?.summaryKey||'');
  if(!src||!summaryKey||!hasStatusSummaryKeyHit(src,summaryKey)||!isAbilityStatusEffectProfile(profile))return primary;
  const ctx=inferStatusEffectRelationContext(src,profile);
  const side=norm(ctx?.targetSide||'');
  const wantedDirection=norm(profile?.direction||'');
  const inferredDirection=norm(inferStatusEffectRelationDirection(src,summaryKey));
  // FIX[HADO-2.7.3.20-ABILITY-CHANGE-TARGET-POSITIVE]:
  // 追加効果表の「攻撃速度変化 / 敵」は、方向語が本文から明示抽出できなくても対象側で低下として読む。
  const sideDirection=side==='self'?'buff':(side==='enemy'?'debuff':'');
  const abilityChangeByTarget=!!(isAbilityStatusEffectProfile(profile)&&summaryKey&&new RegExp(escRe(summaryKey)+'\s*変化').test(src)&&sideDirection);
  if(!abilityChangeByTarget&&!isExplicitAbilityRelationContext(src,profile,ctx,inferredDirection||wantedDirection))return primary;
  // FIX[HADO-2.5.5.33-TACTIC-ABILITY-CHANGE-TARGET-SIDE]:
  // 戦法の追加効果表は「攻撃速度変化 / 味方」のように、上昇/低下を対象側で読む必要がある。
  // 「25%遅い」等の表記や主効果中の「対象」語に引きずられて味方対象の攻撃速度変化を落とさない。
  if(inferredDirection&&wantedDirection&&inferredDirection!==wantedDirection&&!(abilityChangeByTarget&&sideDirection===wantedDirection))return primary;
  const ctxAllowsResistance=/回避|無効化|解除|反射|受けない|受けず/.test(norm(ctx?.relationType||''))||/defensive|remove-self-debuff|resistance/.test(norm(ctx?.reason||''));
  if(side==='self'&&wantedDirection==='debuff'&&!ctxAllowsResistance)return primary;
  if(side==='enemy'&&wantedDirection==='buff'&&!ctxAllowsResistance)return primary;
  const direction=(abilityChangeByTarget&&sideDirection)||inferredDirection||wantedDirection;
  const relationType=ctx.relationType|| (direction==='debuff'?'弱化':(direction==='buff'?'強化':''));
  let groupKey='';
  if(side==='self'&&direction==='buff')groupKey='selfAbilityBuff';
  else if(side==='enemy'&&direction==='debuff')groupKey='enemyAbilityDebuff';
  else if(!side&&direction==='buff')groupKey='selfAbilityBuff';
  else if(!side&&direction==='debuff')groupKey='enemyAbilityDebuff';
  else groupKey=resolveStatusEffectRelationGroup(profile,{...ctx,relationType},direction);
  if(!groupKey)return primary;
  return {matched:true,unknown:false,reason:'ability-summary-context',direction,relationType,groupKey,targetSide:side,alias:summaryKey};
}
function collectTacticAdditionalEffectTexts(tacticItem){
  // FIX[HADO-2.5.5.39-TACTIC-ADDITIONAL-EFFECTS-DIRECT]: 戦法カテゴリ自身の追加効果表を直接読む。
  // sourceGeneral は記事タイトル形式になるため、武将名照合だけに依存しない。
  const texts=[];
  const seen=new Set();
  const push=(value)=>{const t=norm(value);if(!t||seen.has(t))return;seen.add(t);texts.push(t);};
  const readAdditionalTable=(table)=>{
    const rows=getTableRows(table);
    if(!rows.length)return;
    const head=Array.isArray(rows[0])?rows[0].map(norm):[];
    if(!(head[0]==='追加効果'&&head[1]==='対象範囲'))return;
    for(let idx=1;idx<rows.length;idx++){
      const row=Array.isArray(rows[idx])?rows[idx]:[];
      if(!row.length)continue;
      const rowText=norm(row.join(' '));
      const next=Array.isArray(rows[idx+1])?norm(rows[idx+1].join(' ')):'';
      if(!rowText||/追加効果.*対象範囲/.test(rowText))continue;
      push([rowText,next].filter(Boolean).join(' '));
      addTacticAbilityChangeSyntheticParts(texts,row.concat(next?[next]:[]));
      if(next)idx++;
    }
  };
  (Array.isArray(tacticItem?.tables)?tacticItem.tables:[]).forEach(readAdditionalTable);
  const sourceNames=new Set();
  [tacticItem?.raw?.sourceGeneral,tacticItem?.sourceGeneral,tacticItem?.sourceName].forEach(v=>{const n=norm(v);if(n)sourceNames.add(n);});
  (Array.isArray(tacticItem?.sourceNames)?tacticItem.sourceNames:[]).forEach(v=>{const n=norm(v);if(n)sourceNames.add(n);});
  (Array.isArray(tacticItem?.raw?.sourceNames)?tacticItem.raw.sourceNames:[]).forEach(v=>{const n=norm(v);if(n)sourceNames.add(n);});
  const generalMatches=(state.generals||[]).filter(g=>{
    const gName=norm(g?.name||g?.title||'');
    const clean=cleanArticleTitleForLink(g?.title||'');
    return sourceNames.has(gName)||sourceNames.has(clean);
  });
  generalMatches.forEach(general=>{
    const table=findAdditionalEffectsTable(general);
    if(Array.isArray(table))readAdditionalTable(table);
  });
  (Array.isArray(tacticItem?.sections)?tacticItem.sections:[]).forEach(sec=>{
    const title=norm(sec?.title||'');
    (Array.isArray(sec?.content)?sec.content:[]).forEach(line=>{
      const t=norm([title,line].filter(Boolean).join(' '));
      if(/追加効果|対象範囲|継続|戦法短縮|戦法ゲージ|戦法待ち時間|付与|上昇|低下|解除|無視|避ける|攻撃速度|戦法速度|戦法威力|会心|兵器速度/.test(t))push(t);
    });
  });
  return texts;
}
function collectRelatedItemsForStatusEffect(category,profile){
  const list=category==='tactics'?state.tactics:category==='skills'?state.skills:category==='equipments'?state.equipments:[];
  const names=[];
  let fromAdditionalEffects=0,unknownCandidates=0;
  (Array.isArray(list)?list:[]).forEach(item=>{
    const name=getItemDisplayName(item);
    let matched=false,additionalMatched=false,unknown=false;
    const options=category==='tactics'?{includeTacticAdditionalEffects:true,suppressDebug:true}:{suppressDebug:true};
    const parts=buildStatusEffectRelatedLinkParts(item,options);
    parts.forEach(part=>{
      const r=detectStatusEffectRelationForOwnerText(part,profile);
      if(r.matched)matched=true;
      if(r.unknown)unknown=true;
    });
    if(category==='tactics'){
      collectTacticAdditionalEffectTexts(item).forEach(text=>{
        const r=detectStatusEffectRelationForOwnerText(text,profile);
        if(r.matched){matched=true;additionalMatched=true;}
        if(r.unknown)unknown=true;
      });
    }
    if(matched){names.push(name);if(additionalMatched)fromAdditionalEffects++;}
    else if(unknown)unknownCandidates++;
  });
  return {names:[...new Set(names)].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ja')),fromAdditionalEffects,unknownCandidates};
}
function buildStatusEffectRelatedLinkDiagnostics(item,profile,related){
  return {source:'HADO-2.5.5.7',statusOriginalName:profile.originalName,statusDisplayName:profile.displayName,summaryKey:profile.summaryKey,direction:profile.direction,relatedTactics:related.tactics.names.length,relatedTacticsFromAdditionalEffects:related.tactics.fromAdditionalEffects,relatedSkills:related.skills.names.length,relatedEquipments:related.equipments.names.length,unknownDirectionCandidates:related.tactics.unknownCandidates+related.skills.unknownCandidates+related.equipments.unknownCandidates,unlinkedReason:(!profile.summaryKey?'no-summaryKey':(related.tactics.names.length+related.skills.names.length+related.equipments.names.length?'':'no-matching-text'))};
}
function getEnhancedStatusEffectRelatedGroups(item){
  const profile=getStatusEffectProfile(item);
  const related={tactics:collectRelatedItemsForStatusEffect('tactics',profile),skills:collectRelatedItemsForStatusEffect('skills',profile),equipments:collectRelatedItemsForStatusEffect('equipments',profile)};
  const diag=buildStatusEffectRelatedLinkDiagnostics(item,profile,related);
  state.diagnostics.statusEffectRelatedLinks=diag;
  debugLog('statusEffectRelatedLinks:summaryKey',diag);
  const groups=[];
  if(related.tactics.names.length)groups.push({category:'tactics',title:'戦法',names:related.tactics.names});
  if(related.skills.names.length)groups.push({category:'skills',title:'技能',names:related.skills.names});
  if(related.equipments.names.length)groups.push({category:'equipments',title:'装備',names:related.equipments.names});
  return groups;
}
function buildStatusEffectOwnersHtml(effectName){const item=findItemByCategoryAndName('statusEffects',effectName)||{name:effectName};const groups=getEnhancedStatusEffectRelatedGroups(item);if(!groups.length)return '';const blocks=groups.map(group=>`<div><strong>${esc(group.title)}:</strong> ${group.names.map(owner=>`<a href="#" class="detail-entity-link" data-category="${esc(group.category)}" data-name="${esc(owner)}">${esc(owner)}</a>`).join(' / ')}</div>`);return `<div class="general-card" style="box-shadow:none"><div class="general-card-header">関連リンク</div><div class="general-card-body"><div class="general-text">${blocks.join('')}</div></div></div>`;}

function invertNameSetMap(map){const out=new Map();if(!(map instanceof Map))return out;map.forEach((set,owner)=>{(set instanceof Set?Array.from(set):Array.isArray(set)?set:[]).forEach(name=>{const n=norm(name);if(!n)return;if(!out.has(n))out.set(n,new Set());out.get(n).add(norm(owner));});});return out;}
function normalizeRelatedLinkNameList(names){
  if(!names)return [];
  if(Array.isArray(names))return names;
  if(names instanceof Set)return [...names];
  if(typeof names==='string')return [names];
  try{if(typeof names[Symbol.iterator]==='function')return [...names];}catch(e){}
  return [];
}
function getSetValues(map,key){if(!(map instanceof Map))return [];const set=map.get(norm(key));return [...(set instanceof Set?set:new Set())].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ja'));}
function getOwnersFromMap(map,targetName){const out=[];if(!(map instanceof Map))return out;const target=norm(targetName);map.forEach((set,owner)=>{if(set instanceof Set&&set.has(target))out.push(norm(owner));});return [...new Set(out)].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ja'));}
function collectNamesMentionedInItem(item,categoryKey){const list=categoryKey==='generals'?state.generals:categoryKey==='tactics'?state.tactics:categoryKey==='skills'?state.skills:categoryKey==='equipments'?state.equipments:state.statusEffects;const names=(Array.isArray(list)?list:[]).map(v=>norm(v?.name||v?.title||'')).filter(Boolean).sort((a,b)=>b.length-a.length);const text=buildSearchableText(item);const own=norm(item?.name||item?.title||'');const out=[];names.forEach(n=>{if(n&&n!==own&&text.includes(n.toLowerCase()))out.push(n);});return [...new Set(out)].sort((a,b)=>a.localeCompare(b,'ja'));}
function getAllStatusEffectNamesForRelatedLinks(){return (state.statusEffects||[]).map(item=>norm(item?.name||item?.title||item?.statusDisplayName||'')).filter(Boolean).sort((a,b)=>b.length-a.length);}
function findItemByDisplayNameLazy(categoryKey,name){const clean=normalizeSaveItemName(name);const list=getDatasetByCategory(categoryKey)||[];return (list||[]).find(item=>normalizeSaveItemName(getItemDisplayName(item)||item?.name||item?.title||'')===clean)||findItemByCategoryAndName(categoryKey,name)||null;}
function addStatusSet(target,values){(values||new Set()).forEach(v=>{const n=norm(v);if(n)target.add(n);});}
function collectStatusEffectsForSkillNameLazy(skillName,statusEffectNames){const item=findItemByDisplayNameLazy('skills',skillName);return item?collectStatusEffectNamesFromSkillItem(item,statusEffectNames):new Set();}
function collectStatusEffectsForTacticNameLazy(tacticName,statusEffectNames){const item=findItemByDisplayNameLazy('tactics',tacticName);return item?collectStatusEffectNamesFromTacticItem(item,statusEffectNames):new Set();}
function collectStatusEffectNamesForGeneralDetail(item,statusEffectNames){
  const out=[];
  addStatusRelationValues(out,collectStatusEffectRelationsFromMetricSegments(item,statusEffectNames));
  const generalName=norm(item?.name||item?.title||'');
  const tacticName=findTacticName(item);
  let tacticItem=null;
  if(tacticName)tacticItem=findItemByDisplayNameLazy('tactics',tacticName);
  if(!tacticItem&&generalName)tacticItem=(state.tactics||[]).find(v=>norm(v?.raw?.sourceGeneral||v?.sourceGeneral||'')===generalName)||null;
  if(tacticItem)addStatusRelationValues(out,collectStatusEffectRelationsFromTacticItem(tacticItem,statusEffectNames));
  collectSkillNamesFromGeneralItem(item).forEach(skillName=>{
    const skillItem=findItemByDisplayNameLazy('skills',skillName);
    if(skillItem)addStatusRelationValues(out,collectStatusEffectRelationsFromSkillItem(skillItem,statusEffectNames));
  });
  return out;
}
function collectStatusEffectNamesForEquipmentDetail(item,statusEffectNames){
  const out=[];
  addStatusRelationValues(out,collectStatusEffectRelationsFromEquipmentItem(item,statusEffectNames));
  collectSkillNamesFromEquipmentItem(item).forEach(skillName=>{
    const skillItem=findItemByDisplayNameLazy('skills',skillName);
    if(skillItem)addStatusRelationValues(out,collectStatusEffectRelationsFromSkillItem(skillItem,statusEffectNames));
  });
  return out;
}
function collectStatusEffectOwnerNamesFromRelatedGroups(groups,ownerCategory){
  const idx=state.lookupIndexes||{};
  const out=new Set();
  (groups||[]).forEach(group=>{
    if(group.category==='tactics'){
      (group.names||[]).forEach(name=>{
        const tactic=findItemByDisplayNameLazy('tactics',name);
        const sourceGeneral=norm(tactic?.raw?.sourceGeneral||tactic?.sourceGeneral||'');
        if(ownerCategory==='generals'&&sourceGeneral)out.add(sourceGeneral);
      });
    }
    if(group.category==='skills'){
      (group.names||[]).forEach(name=>{
        const skill=findItemByDisplayNameLazy('skills',name);
        const sourceGeneral=norm(skill?.raw?.sourceGeneral||skill?.sourceGeneral||'');
        const sourceEquipment=norm(skill?.raw?.sourceEquipment||skill?.sourceEquipment||'');
        if(ownerCategory==='generals'){
          if(sourceGeneral)out.add(sourceGeneral);
          getOwnersFromMap(idx.generalSkillNames,name).forEach(v=>out.add(v));
        }
        if(ownerCategory==='equipments'){
          if(sourceEquipment)out.add(sourceEquipment);
          getOwnersFromMap(idx.equipmentSkillNames,name).forEach(v=>out.add(v));
        }
      });
    }
    if(ownerCategory===group.category)(group.names||[]).forEach(v=>out.add(v));
  });
  return [...out];
}
function collectTacticNamesMentionedInSkillEffectOnly(item){
  const names=new Set();
  const allowed=new Set((state.tactics||[]).map(getItemDisplayName).map(norm).filter(Boolean));
  const rows=getTableRows(Array.isArray(item?.tables)?item.tables[0]:null);
  const texts=[];
  rows.forEach(row=>{if(Array.isArray(row)&&ROMAN_LEVELS.includes(norm(row[0]||'')))texts.push(norm(row[1]||''));});
  (Array.isArray(item?.sections)?item.sections:[]).filter(sec=>/レベル別効果$/.test(norm(sec?.title||''))).forEach(sec=>(sec.content||[]).forEach(v=>texts.push(norm(v))));
  allowed.forEach(name=>{if(name&&texts.some(t=>t.includes(name)))names.add(name);});
  const allMentioned=collectNamesMentionedInItem(item,'tactics');
  const suppressed=allMentioned.filter(n=>!names.has(n));
  if(suppressed.length)debugLog('relatedLinks:suppress-skill-tactic-owner-noise',{skill:getItemDisplayName(item),suppressed:suppressed.slice(0,30),policy:'技能詳細の所有武将一覧・おすすめ表から拾った戦法名は関連戦法から除外'});
  return [...names].sort((a,b)=>a.localeCompare(b,'ja'));
}

function collectSkillNamesMentionedInSkillEffectOnly(item){
  const names=new Set();
  const own=norm(getItemDisplayName(item)||item?.name||item?.title||'');
  const allowed=new Set((state.skills||[]).map(getItemDisplayName).map(norm).filter(Boolean));
  const texts=[];
  const rows=getTableRows(Array.isArray(item?.tables)?item.tables[0]:null);
  rows.forEach(row=>{if(Array.isArray(row)&&ROMAN_LEVELS.includes(norm(row[0]||'')))texts.push(norm(row[1]||''));});
  (Array.isArray(item?.sections)?item.sections:[]).filter(sec=>/レベル別効果$/.test(norm(sec?.title||''))).forEach(sec=>(sec.content||[]).forEach(v=>texts.push(norm(v))));
  const normalizedTexts=texts.map(t=>normalizeHadouCrawlerTypoText(t));
  allowed.forEach(name=>{
    if(!name||name===own)return;
    // 技能詳細では、所有武将一覧の「特徴/所持技能」ではなく、レベル別効果本文に明示された技能参照だけを関連技能にする。
    // 例: 剛塁 → 剛力Lv1を付与 は関連技能として採用。LR華雄の所持技能 連堅/破撃/巡見 は除外。
    const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const directPattern=new RegExp(`(?:技能[「『]?${escaped}[」』]?|[「『]${escaped}[」』]?|${escaped})(?:Lv|レベル|を付与|を所持|の技能Lv)`);
    if(normalizedTexts.some(t=>directPattern.test(t)))names.add(name);
  });
  const allMentioned=collectNamesMentionedInItem(item,'skills').filter(n=>n!==own);
  const suppressed=allMentioned.filter(n=>!names.has(n));
  if(suppressed.length)debugLog('relatedLinks:suppress-skill-owner-noise',{skill:getItemDisplayName(item),suppressed:suppressed.slice(0,50),adopted:[...names],policy:'技能詳細の関連技能はレベル別効果本文に明示された技能参照に限定し、所持武将一覧・特徴/所持技能由来の技能名は除外する'});
  return [...names].sort((a,b)=>a.localeCompare(b,'ja'));
}


function normalizeCountermeasureRelationLabel(relation){
  const r=norm(relation||'');
  if(/回避|避け/.test(r))return '回避';
  if(/無効/.test(r))return '無効';
  if(/奪取|奪う|奪/.test(r))return '奪取';
  if(/解除|打ち消/.test(r))return '解除';
  if(/反射/.test(r))return '反射';
  if(/短縮/.test(r))return '短縮';
  if(/反転/.test(r))return '反転';
  if(/抑制/.test(r))return '抑制';
  return r||'対策';
}
function normalizeCountermeasureTargetName(name){
  let n=normalizeHadouCrawlerTypoText(name||'');
  n=n.replace(/変化\((強化|弱化)\)$/,'').replace(/\((強化|弱化)\)$/,'');
  const map={能力弱化:'弱化効果',不利変化:'弱化効果',有利変化:'強化効果',強化打消:'強化効果'};
  return map[n]||n;
}
function makeCountermeasureName(target,relation){
  const t=normalizeCountermeasureTargetName(target);
  const r=normalizeCountermeasureRelationLabel(relation);
  if(!t||!r)return '';
  // FIX[HADO-2.7.0.7-COUNTERMEASURE-CANONICAL-NAME]:
  // 敵部隊有利対策は「強化効果+関係」をそのまま連結せず、既存の状態変化名へ寄せる。
  // 例: 強化効果+短縮 => 強化時間短縮。これにより検索候補名と実データ名の不一致を防ぐ。
  if(t==='強化効果'){
    const map={解除:'強化解除',無効:'強化無効',奪取:'強化奪取',短縮:'強化時間短縮',反転:'強化反転',抑制:'強化抑制'};
    if(map[r])return map[r];
  }
  return `${t}${r}`;
}
function countermeasureNameHasExtractionNoise(name){
  const n=norm(name||'');
  return /\d|[０-９]|%|％|確率|場合|際|時|部隊|自身|自部隊|発生していない|効果時間|ダメージ/.test(n);
}

// FIX[HADO-2.7.0.21-SELF-DISADVANTAGE-REMAINING-SPECIAL]:
// 状態変化名そのものでは拾えない自部隊不利対策は、合意済みの7候補だけを採用する。
// 2.7.0.21で会心無効/撃心無効を追加。耐久補助・ダメージ防御などはここでは採用しない。
const SELF_DISADVANTAGE_GENERIC_TARGETS={
  '弱化効果':new Set(['回避','無効','反射','解除']),
  '状態変化':new Set(['無効']),
  '会心':new Set(['無効']),
  '撃心':new Set(['無効'])
};
const SELF_DISADVANTAGE_GENERIC_NAMES=new Set(['弱化効果回避','弱化効果無効','弱化効果反射','弱化効果解除','状態変化無効','会心無効','撃心無効']);
// FIX[HADO-2.8.9.46-SELF-COUNTERMEASURE-RECEIVED-EFFECTS]:
// 『自部隊が受ける強化解除/強化奪取を避ける』など、状態変化マスタ上は即時効果・敵側作用でも、受け手が自部隊の文脈なら自部隊不利対策として扱う。
const SELF_DISADVANTAGE_RECEIVED_EFFECT_TARGETS=new Set(['強化解除','強化奪取','強化無効','強化抑制','強化反転','反転','強化時間短縮','弱化解除','連鎖無効','連鎖不能','連鎖累減','戦法遅延','士気奪取']);
function isReceivedEffectSelfCountermeasureTarget(target,relation,sourceText=''){
  const n=normalizeCountermeasureTargetName(target);
  const r=normalizeCountermeasureRelationLabel(relation);
  const src=normalizeHadouCrawlerTypoText(sourceText||'');
  if(!SELF_DISADVANTAGE_RECEIVED_EFFECT_TARGETS.has(n))return false;
  if(r!=='回避'&&r!=='無効')return false;
  if(!/(?:自部隊|自身|味方|部隊|敵部隊から|から受ける|受ける|にかかる)/.test(src))return false;
  if(r==='回避')return /避ける|回避/.test(src);
  return /受けない|受けず|無効化|無効にする|防ぐ|防止/.test(src);
}
function isAllowedGenericSelfDisadvantageCountermeasure(target,relation,sourceText=''){
  const n=normalizeCountermeasureTargetName(target);
  const r=normalizeCountermeasureRelationLabel(relation);
  const src=normalizeHadouCrawlerTypoText(sourceText||'');
  if(!n||!r)return false;
  const allowed=SELF_DISADVANTAGE_GENERIC_TARGETS[n];
  if(!allowed||!allowed.has(r))return false;
  if(n==='弱化効果'){
    if(!/(弱化効果|不利変化|能力弱化効果)/.test(src))return false;
    if(r==='回避')return /避ける|回避/.test(src);
    if(r==='無効')return /受けない|受けず|無効化|無効にする|防ぐ|防止/.test(src);
    if(r==='反射')return /反射/.test(src);
    if(r==='解除')return /解除|打ち消/.test(src);
  }
  if(n==='状態変化'){
    if(!/状態変化/.test(src))return false;
    if(r==='無効')return /受けない|受けず|無効化|無効にする|発生を無効|発生しない|防ぐ|防止/.test(src);
  }
  if(n==='会心'||n==='撃心'){
    if(r!=='無効')return false;
    if(!src.includes(n))return false;
    return /発生しない|発生させない|受けない|無効/.test(src);
  }
  return false;
}
function isAllowedGenericSelfDisadvantageCountermeasureName(name){
  return SELF_DISADVANTAGE_GENERIC_NAMES.has(norm(name||''));
}

// FIX[HADO-2.7.0.9-SELF-DISADVANTAGE-STRICT-TARGET]:
// 自部隊不利対策の第一段階は「状態変化マスタ200件に存在する不利側状態変化 + 対策名」に限定する。
// 弱化効果などの総称、会心/撃心などの特殊概念、献計/弱化無効などの対策手段側状態変化は対象名にしない。
function getCountermeasureStatusEffectItemByTargetName(name){
  const n=normalizeCountermeasureTargetName(name);
  if(!n)return null;
  return findStatusEffectItemByAnyName(n);
}
function isSelfDisadvantageCountermeasureTargetName(name){
  const meta=getCountermeasureStatusEffectMetaByTargetName(name);
  return isStatusMetaSelfDisadvantageTarget(meta);
}
function hasSelfDisadvantageCountermeasureContext(sourceText,name){
  const src=normalizeHadouCrawlerTypoText(sourceText||'');
  if(!src)return false;
  if(/無視して.*ダメージ|ダメージ.*無視|攻撃.*無視/.test(src))return false;
  // 明示的に「自部隊/自身/味方が受ける・かかる」文脈。
  if(/(?:自身\d*部隊|自部隊|味方\d*部隊|部隊)にかかる|(?:自身\d*部隊|自部隊|味方\d*部隊|部隊)が受ける|(?:敵|敵部隊|部隊)から受ける|から受ける|受ける/.test(src))return true;
  // 「恐怖を避ける」のような短い箇条は、対象名が不利側状態変化であれば自部隊が受ける不利の対策として扱う。
  return isSelfDisadvantageCountermeasureTargetName(name)&&/(?:避ける|回避|受けない|受けず|無効化|無効にする|防ぐ|防止|発生しない)/.test(src);
}
function isAllowedCountermeasureTargetName(name,groupKey,relation,sourceText=''){
  const n=normalizeCountermeasureTargetName(name);
  const g=norm(groupKey||'');
  const r=normalizeCountermeasureRelationLabel(relation||'');
  const src=normalizeHadouCrawlerTypoText(sourceText||'');
  if(!n||!g||!r)return false;
  if(countermeasureNameHasExtractionNoise(n))return false;
  if(/無視して.*ダメージ|ダメージ.*無視|攻撃.*無視/.test(src))return false;
  if(g==='selfResistanceBuff'){
    // 2.7.0.21: 状態変化名ベースに加え、状態変化名ではない候補は合意済み候補だけ通す。
    // 2.8.9.46: 強化解除/強化奪取などを『受ける』『避ける』場合は、自部隊不利対策として先に許可する。
    if(isReceivedEffectSelfCountermeasureTarget(n,r,src))return true;
    if(isAllowedGenericSelfDisadvantageCountermeasure(n,r,src))return true;
    return isSelfDisadvantageCountermeasureTargetName(n)&&hasSelfDisadvantageCountermeasureContext(src,n);
  }
  if(g==='enemyResistanceDebuff'){
    // HADO-2.7.0.16: 敵部隊有利阻害の第1ゲートは「対象状態変化が direction=self であること」。
    // direction=enemy の即時効果（強化解除/強化奪取/強化反転など）や不利変化（強化抑制）は、
    // 作用語として後続処理で復活させない。対象外になったものは表示・検索登録しない。
    const meta=getCountermeasureStatusEffectMetaByTargetName(n);
    return !!meta&&meta.defaultTargetSide==='self'&&hasEnemyAdvantageObstructionContext(src);
  }
  return false;
}
function shouldUseCountermeasureRelation(rel,sourceText=''){
  const group=norm(rel?.groupKey||'');
  if(group!=='selfResistanceBuff'&&group!=='enemyResistanceDebuff')return false;
  const relation=normalizeCountermeasureRelationLabel(rel?.relationType||'');
  if(!relation)return false;
  const src=norm(sourceText||rel?.sourceText||rel?.matchedText||'');
  return isAllowedCountermeasureTargetName(rel?.name||'',group,relation,src);
}
function getEffectCountermeasureSourceName(item){return getItemDisplayName(item)||norm(item?.name||item?.title||'');}
function collectGenericCountermeasureRelationsFromText(text){
  const src=normalizeHadouCrawlerTypoText(text||'');
  const out=[];
  if(!src)return out;
  const push=(groupKey,name,relation,reason)=>{const n=normalizeCountermeasureTargetName(name);const r=normalizeCountermeasureRelationLabel(relation);if(!n||!r)return;out.push({name:n,groupKey,relationType:r,reason,targetSide:groupKey==='selfResistanceBuff'?'self':'enemy',sourceText:src});};
  const segments=src.split(/[■●▼。]/).map(norm).filter(Boolean);
  segments.forEach(seg=>{
    if(/弱化効果|不利変化/.test(seg)){
      if(/避ける|回避/.test(seg))push('selfResistanceBuff','弱化効果','回避','generic-self-debuff-avoid');
      if(/受けない|受けず|無効化|無効にする|防ぐ|防止/.test(seg))push('selfResistanceBuff','弱化効果','無効','generic-self-debuff-nullify');
      if(/解除|打ち消/.test(seg))push('selfResistanceBuff','弱化効果','解除','generic-self-debuff-cleanse');
      if(/反射/.test(seg))push('selfResistanceBuff','弱化効果','反射','generic-self-debuff-reflect');
    }
    if(/会心/.test(seg)&&/発生しない|受けない|無効/.test(seg))push('selfResistanceBuff','会心','無効','generic-critical-prevent');
    if(/撃心/.test(seg)&&/発生しない|受けない|無効/.test(seg))push('selfResistanceBuff','撃心','無効','generic-gekihshin-prevent');
    if(/強化効果|有利変化/.test(seg)){
      if(/打ち消|解除/.test(seg))push('enemyResistanceDebuff','強化効果','解除','generic-enemy-buff-remove');
      if(/奪取|奪う|奪/.test(seg))push('enemyResistanceDebuff','強化効果','奪取','generic-enemy-buff-steal');
      if(/無効化|無効にする|付与されない/.test(seg))push('enemyResistanceDebuff','強化効果','無効','generic-enemy-buff-nullify');
      if(/短縮/.test(seg))push('enemyResistanceDebuff','強化効果','短縮','generic-enemy-buff-shorten');
      if(/抑制/.test(seg))push('enemyResistanceDebuff','強化効果','抑制','generic-enemy-buff-suppress');
      if(/反転|弱化/.test(seg)&&/変える|反転/.test(seg))push('enemyResistanceDebuff','強化効果','反転','generic-enemy-buff-reverse');
    }
  });
  const seen=new Set();
  return out.filter(v=>{const key=[v.groupKey,v.name,v.relationType].join('@@');if(seen.has(key))return false;seen.add(key);return true;});
}
function splitCountermeasureClauses(text){
  const src=normalizeHadouCrawlerTypoText(text||'');
  if(!src)return [];
  return src.split(/[■●▼。\n]/).map(norm).filter(Boolean);
}
function normalizeCountermeasureTargetToken(token,context=''){
  let t=normalizeHadouCrawlerTypoText(token||'');
  const ctx=normalizeHadouCrawlerTypoText(context||'');
  t=t.replace(/^[、,，・\/／\s]+|[、,，・\/／\s]+$/g,'');
  t=t.replace(/^(自身|自部隊|部隊|味方\d*部隊|対象を含む敵\d*部隊|敵\d*部隊|敵部隊|味方部隊)にかかる/g,'');
  t=t.replace(/^(自身|自部隊|部隊|敵部隊|味方部隊)の/g,'');
  t=t.replace(/^(一部の|全ての|すべての|全て|すべて|受ける|から受ける|より受ける|にかかる|かかる|際に|時に|場合に|ときに|効果量分|確率で)+/g,'');
  t=t.replace(/(を|が|は|の効果|効果)$/g,'');
  t=norm(t);
  const paren=t.match(/能力弱化効果[（(]([^）)]+)[）)]/);
  if(paren){
    const mapped=selfResistanceAbilityDebuffDisplayName(paren[1]);
    return mapped||'';
  }
  const abilityParen=ctx.match(/能力弱化効果[（(]([^）)]+)[）)]/);
  if(/^(攻撃|防御|知力|機動|攻撃速度|戦法速度|戦法威力|与ダメージ|被ダメージ|命中)$/.test(t)&&/能力弱化効果/.test(ctx)){
    const mapped=selfResistanceAbilityDebuffDisplayName(t);
    return mapped||'';
  }
  if(t==='委縮')t='萎縮';
  const genericMap={能力弱化効果:'弱化効果',不利変化:'弱化効果',弱化:'弱化効果',有利変化:'強化効果',強化:'強化効果'};
  if(genericMap[t])return genericMap[t];
  return normalizeCountermeasureTargetName(t);
}
function splitCountermeasureTargetList(raw,context=''){
  let phrase=normalizeHadouCrawlerTypoText(raw||'');
  if(!phrase)return [];
  phrase=phrase.replace(/^[\s\S]*?(?:自身\d*部隊にかかる|自部隊にかかる|部隊にかかる)/,'');
  phrase=phrase.replace(/^[\s\S]*?(?:から受ける|より受ける)/,'');
  phrase=phrase.replace(/^[\s\S]*?(?:発生する|受ける)/,'');
  phrase=phrase.replace(/(?:を|が)?(?:避ける|回避する|回避|受けない|受けず|無効化する|無効化|無効にする|防ぐ|防止する|防止|発生しない|解除する|解除|打ち消す|打ち消し|短縮する|短縮|反転する|反転).*$/,'');
  phrase=phrase.replace(/^(一部の|全ての|すべての)+/,'');
  const out=[];
  // FIX[HADO-2.7.3.46-ABILITY-DEBUFF-PAREN-SPLIT]:
  // 「能力弱化効果（攻撃/防御/戦法速度/戦法威力）を避ける」は、弱化効果解除ではなく
  // 攻撃低下回避・防御低下回避・戦法速度低下回避・戦法威力低下回避として個別採用する。
  // 括弧内を保護したまま1トークン化すると複数能力を失うため、先に能力名へ展開してから残りの状態名を解析する。
  phrase=phrase.replace(/能力弱化効果[（(]([^）)]+)[）)]/g,(m,inner)=>{
    norm(inner).split(/[、,，・\/／と]/).map(norm).filter(Boolean).forEach(key=>{
      const mapped=selfResistanceAbilityDebuffDisplayName(key);
      if(mapped)out.push(mapped);
    });
    return '';
  });
  const parts=phrase.split(/(?:および|及び|ならびに|並びに|、|,|，|・|\/|／|\s+と\s+|と)/).map(v=>v.trim()).filter(Boolean);
  parts.forEach(part=>{
    const n=normalizeCountermeasureTargetToken(part,context||phrase);
    if(n&&!/^(一部の|全ての|すべての|自身|自部隊|部隊|敵部隊|味方部隊|効果|確率)$/.test(n))out.push(n);
  });
  return [...new Set(out)];
}

// FIX[HADO-2.7.0.17-STATUS-GROUP-LOCK]:
// 状態変化1データにつき状態変化グループは一度だけ確定する。
// 対策/阻害の派生インデックスは、この固定グループを上書きしない。
function getLockedStatusEffectRelationGroupName(name){
  const targetName=normalizeCountermeasureTargetName(name);
  const item=findStatusEffectItemByAnyName(targetName)||findStatusEffectItemByAnyName(name);
  if(!item)return '';
  return norm(item.statusFixedRelationGroup||item.statusRelationGroup||getStatusEffectRelationGroupKey(item));
}
function isCountermeasureGroupAllowedByLockedStatusGroup(groupKey,targetName){
  const group=norm(groupKey||'');
  const fixed=getLockedStatusEffectRelationGroupName(targetName);
  if(!fixed){
    // 2.7.0.20: 状態変化マスタ外の総称系不利対策は総称候補のみ許可。
    // 2.8.9.46: 強化解除/強化奪取などの受け手が自部隊になる即時効果も、受ける/避ける文脈では自部隊不利対策として許可する。
    const n=normalizeCountermeasureTargetName(targetName);
    return group==='selfResistanceBuff'&&(!!SELF_DISADVANTAGE_GENERIC_TARGETS[n]||SELF_DISADVANTAGE_RECEIVED_EFFECT_TARGETS.has(n));
  }
  if(group==='selfResistanceBuff')return /^enemy/.test(fixed);
  if(group==='enemyResistanceDebuff')return /^self/.test(fixed);
  return true;
}
// FIX[HADO-2.9.0.27-ADVISOR-ABILITY-DEBUFF]:
// 「知力の弱化効果を避ける」のような能力限定文は、総称の弱化効果回避ではなく
// 知力低下回避等へ個別化する。参軍技能「啓蒙」の関連リンク補完でも同一関数を使う。
function collectAbilitySpecificWeakeningTargetsForCountermeasure(clause){
  const src=normalizeHadouCrawlerTypoText(clause||'');
  const out=[];
  const re=/(通常攻撃威力|攻撃速度|戦法速度|戦法威力|対物特効|与ダメージ|被ダメージ|連鎖確率|攻撃|防御|知力|機動|命中)(?:の)?弱化効果/g;
  let m;
  while((m=re.exec(src))){
    const mapped=selfResistanceAbilityDebuffDisplayName(m[1]);
    if(mapped)out.push(mapped);
  }
  return [...new Set(out)];
}
function collectCountermeasureRelationsFromClause(clause){
  const seg=normalizeHadouCrawlerTypoText(clause||'');
  const out=[];
  if(!seg)return out;
  const pushMany=(groupKey,targets,relation,reason)=>{
    (targets||[]).forEach(target=>{
      const name=normalizeCountermeasureTargetName(target);
      const rel=normalizeCountermeasureRelationLabel(relation);
      if(!name||!rel)return;
      if(!isAllowedCountermeasureTargetName(name,groupKey,rel,seg))return;
      if(!isCountermeasureGroupAllowedByLockedStatusGroup(groupKey,name))return;
      out.push({name,groupKey,relationType:rel,reason,targetSide:groupKey==='selfResistanceBuff'?'self':'enemy',sourceText:seg});
    });
  };
  // HADO-2.7.0.8: 対策名は許可リスト方式。弱化効果などの総称は明示文だけ採用し、能力弱化効果（攻撃）のような括弧指定は個別化する。
  const abilitySpecificWeakeningTargets=collectAbilitySpecificWeakeningTargetsForCountermeasure(seg);
  if(/(?:弱化効果|不利変化)/.test(seg)&&!/能力弱化効果[（(]/.test(seg)&&!abilitySpecificWeakeningTargets.length){
    if(/避ける|回避/.test(seg))pushMany('selfResistanceBuff',['弱化効果'],'回避','generic-self-debuff-avoid');
    if(/受けない|受けず|無効化|無効にする|防ぐ|防止/.test(seg))pushMany('selfResistanceBuff',['弱化効果'],'無効','generic-self-debuff-nullify');
    if(/解除|打ち消/.test(seg))pushMany('selfResistanceBuff',['弱化効果'],'解除','generic-self-debuff-cleanse');
    if(/反射/.test(seg))pushMany('selfResistanceBuff',['弱化効果'],'反射','generic-self-debuff-reflect');
  }
  if(/(?:避ける|回避)/.test(seg)){
    pushMany('selfResistanceBuff',abilitySpecificWeakeningTargets,'回避','ability-specific-self-debuff-avoid');
    const before=seg.replace(/(?:を)?(?:避ける|回避する|回避)[\s\S]*$/,'');
    pushMany('selfResistanceBuff',splitCountermeasureTargetList(before,seg),'回避','clause-self-avoid');
  }
  if(/(?:受けない|受けず|無効化|無効にする|防ぐ|防止)/.test(seg)){
    pushMany('selfResistanceBuff',abilitySpecificWeakeningTargets,'無効','ability-specific-self-debuff-nullify');
    const before=seg.replace(/(?:を)?(?:受けない|受けず|無効化する|無効化|無効にする|防ぐ|防止する|防止)[\s\S]*$/,'');
    pushMany('selfResistanceBuff',splitCountermeasureTargetList(before,seg),'無効','clause-self-nullify');
  }
  if(/発生しない/.test(seg)){
    const before=seg.replace(/(?:が)?発生しない[\s\S]*$/,'');
    pushMany('selfResistanceBuff',splitCountermeasureTargetList(before,seg),'無効','clause-self-trigger-prevent');
  }
  // FIX[HADO-2.7.3.46-WEAK-DEBUFF-CLEANSE-FALSE-POSITIVE]:
  // 「能力弱化効果（攻撃/防御）と強化解除を避ける」は弱化効果を解除する文ではない。
  // 弱化効果解除/反射は、弱化効果そのものに解除/反射が係る明示文だけ採用する。
  if(!/能力弱化効果[（(]/.test(seg)&&/(?:弱化効果|不利変化)[^。●▼■]{0,40}(?:解除|打ち消)|(?:解除|打ち消)[^。●▼■]{0,40}(?:弱化効果|不利変化)/.test(seg))pushMany('selfResistanceBuff',['弱化効果'],'解除','clause-self-debuff-cleanse');
  if(!/能力弱化効果[（(]/.test(seg)&&/(?:弱化効果|不利変化)[^。●▼■]{0,40}反射|反射[^。●▼■]{0,40}(?:弱化効果|不利変化)/.test(seg))pushMany('selfResistanceBuff',['弱化効果'],'反射','clause-self-debuff-reflect');
  if(/状態変化/.test(seg)&&/(?:受けない|受けず|無効化|無効にする|発生を無効|発生しない|防ぐ|防止)/.test(seg))pushMany('selfResistanceBuff',['状態変化'],'無効','clause-self-state-change-nullify');
  // HADO-2.7.0.15: 敵部隊有利阻害は状態変化メタの最小構造を使い、派生インデックス側で作用名ベースに生成する。
  // ここで生成するのは対象状態変化ではなく、強化効果に対する解除/奪取/無効/反転/短縮/抑制の作用名。
  if(/(?:強化効果|有利変化)/.test(seg)&&hasEnemyAdvantageObstructionContext(seg)){
    if(/(?:打ち消|解除)/.test(seg))pushMany('enemyResistanceDebuff',['強化効果'],'解除','clause-enemy-buff-remove');
    if(/(?:奪取|奪う|奪)/.test(seg))pushMany('enemyResistanceDebuff',['強化効果'],'奪取','clause-enemy-buff-steal');
    if(/(?:無効化|無効にする|付与されない|付与できない)/.test(seg))pushMany('enemyResistanceDebuff',['強化効果'],'無効','clause-enemy-buff-nullify');
    if(/短縮/.test(seg))pushMany('enemyResistanceDebuff',['強化効果'],'短縮','clause-enemy-buff-shorten');
    if(/抑制/.test(seg))pushMany('enemyResistanceDebuff',['強化効果'],'抑制','clause-enemy-buff-suppress');
    if(/(?:反転|弱化)/.test(seg)&&/(?:変える|反転)/.test(seg))pushMany('enemyResistanceDebuff',['強化効果'],'反転','clause-enemy-buff-reverse');
  }
  ['強化解除','強化奪取','強化無効','強化反転','反転','強化時間短縮','強化抑制'].forEach(statusName=>{
    if(!seg.includes(statusName)||!hasEnemyAdvantageObstructionContext(seg))return;
    const relation=getEnemyAdvantageObstructionRelationFromStatusName(statusName);
    if(relation)pushMany('enemyResistanceDebuff',['強化効果'],relation,`clause-enemy-buff-status-name:${statusName}`);
  });
  const seen=new Set();
  return out.filter(v=>{
    if(!shouldUseCountermeasureRelation(v,seg))return false;
    const key=[v.groupKey,v.name,v.relationType].join('@@');
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}
function collectDirectCountermeasureRelationsFromStatusEffectItem(item){
  // HADO-2.7.0.16: 状態変化自身が direction=enemy の即時効果・不利変化である場合、
  // それは敵部隊有利阻害の「対象状態変化」ではない。
  // 第1ゲートで対象外になったものを、作用分類から直接復活させない。
  return [];
}
function collectCountermeasureRelationsForSourceItem(item,sourceType){
  const out=[];
  if(!item)return out;
  const sourceName=getEffectCountermeasureSourceName(item);
  const sourceLabel=sourceType==='statusEffects'?'状態変化':sourceType==='tactics'?'戦法':sourceType==='equipments'?'装備':'技能';
  const parts=buildStatusEffectRelatedLinkParts(item,{includeTacticAdditionalEffects:false});
  const seen=new Set();
  if(sourceType==='statusEffects'){
    collectDirectCountermeasureRelationsFromStatusEffectItem(item).forEach(rel=>{
      const relation=normalizeCountermeasureRelationLabel(rel.relationType||'');
      const name=makeCountermeasureName(rel.name,relation);
      const groupKey=norm(rel.groupKey||'');
      if(!name||!groupKey)return;
      const key=[groupKey,name,sourceType,sourceName].join('@@');
      if(seen.has(key))return;
      seen.add(key);
      out.push({groupKey,groupLabel:STATUS_EFFECT_RELATION_GROUP_LABELS[groupKey]||'',name,target:normalizeCountermeasureTargetName(rel.name),relation,sourceType,sourceLabel,sourceName,sourceText:rel.sourceText||sourceName});
    });
  }
  parts.forEach(part=>{
    splitCountermeasureClauses(part).forEach((clause,clauseIndex)=>{
      collectCountermeasureRelationsFromClause(clause).forEach(rel=>{
        const relation=normalizeCountermeasureRelationLabel(rel.relationType||'');
        const name=makeCountermeasureName(rel.name,relation);
        const groupKey=norm(rel.groupKey||'');
        if(!name||!groupKey)return;
        const key=[groupKey,name,sourceType,sourceName].join('@@');
        if(seen.has(key))return;
        seen.add(key);
        out.push({groupKey,groupLabel:STATUS_EFFECT_RELATION_GROUP_LABELS[groupKey]||'',name,target:normalizeCountermeasureTargetName(rel.name),relation,sourceType,sourceLabel,sourceName,sourceText:clause});
      });
    });
  });
  if(sourceName==='剛塁')debugLog('effectCountermeasure:clause-extract:gourui',{source:'HADO-2.7.0.21',sourceName,relations:out.map(v=>({name:v.name,target:v.target,relation:v.relation,text:v.sourceText})),policy:'対策抽出は箇条単位＋並列表現分解＋状態変化マスタ200件の不利側対象限定。総称・特殊概念・対策手段側状態変化を対象名にしない。'});
  return out;
}
function buildEffectCountermeasureIndex(force=false){
  const cacheKey=[state.skills?.length||0,state.statusEffects?.length||0,HADO_BUILD_INFO.version].join('|');
  if(!force&&state._effectCountermeasureIndex&&state._effectCountermeasureIndexKey===cacheKey)return state._effectCountermeasureIndex;
  const byKey=new Map();
  const addRel=(rel)=>{
    if(!rel||!rel.name||!rel.groupKey)return;
    const key=[rel.groupKey,rel.name].join('@@');
    if(!byKey.has(key))byKey.set(key,{groupKey:rel.groupKey,groupLabel:rel.groupLabel,name:rel.name,target:rel.target,relation:rel.relation,skills:[],statusEffects:[],_skillSet:new Set(),_statusSet:new Set(),samples:[]});
    const row=byKey.get(key);
    if(rel.sourceType==='skills'){
      if(!row._skillSet.has(rel.sourceName)){row._skillSet.add(rel.sourceName);row.skills.push(rel.sourceName);}
    }else if(rel.sourceType==='statusEffects'){
      if(!row._statusSet.has(rel.sourceName)){row._statusSet.add(rel.sourceName);row.statusEffects.push(rel.sourceName);}
    }
    if(row.samples.length<5)row.samples.push({sourceType:rel.sourceType,sourceName:rel.sourceName,text:rel.sourceText.slice(0,180)});
  };
  (state.skills||[]).filter(item=>!item?.isEthnicResearchSkill).forEach(item=>collectCountermeasureRelationsForSourceItem(item,'skills').forEach(addRel));
  (state.statusEffects||[]).forEach(item=>collectCountermeasureRelationsForSourceItem(item,'statusEffects').forEach(addRel));
  const rows=[...byKey.values()].map(row=>{delete row._skillSet;delete row._statusSet;row.skills=row.skills.sort((a,b)=>a.localeCompare(b,'ja'));row.statusEffects=row.statusEffects.sort((a,b)=>a.localeCompare(b,'ja'));row.sources=[...row.skills,...row.statusEffects];return row;}).filter(row=>row.sources.length).sort((a,b)=>{
    const order={selfResistanceBuff:0,enemyResistanceDebuff:1};
    const d=(order[a.groupKey]??9)-(order[b.groupKey]??9);if(d)return d;
    return a.name.localeCompare(b.name,'ja');
  });
  state._effectCountermeasureIndex=rows;
  state._effectCountermeasureIndexKey=cacheKey;
  state.diagnostics.effectCountermeasureIndex={source:'HADO-2.7.0.21',count:rows.length,selfDisadvantage:rows.filter(r=>r.groupKey==='selfResistanceBuff').length,enemyAdvantage:rows.filter(r=>r.groupKey==='enemyResistanceDebuff').length,zeroHitCount:rows.filter(r=>!r.sources.length).length,lockedGroupViolationCount:rows.filter(r=>!isCountermeasureGroupAllowedByLockedStatusGroup(r.groupKey,r.target||r.name)).length,enemyAdvantageForbiddenNames:rows.filter(r=>r.groupKey==='enemyResistanceDebuff'&&!isCountermeasureGroupAllowedByLockedStatusGroup(r.groupKey,r.target||r.name)).map(r=>r.name),selfCheck:rows.map(r=>({group:r.groupLabel,name:r.name,target:r.target,lockedGroup:getLockedStatusEffectRelationGroupName(r.target||r.name),skills:r.skills,statusEffects:r.statusEffects,hitCount:r.sources.length})),sample:rows.slice(0,40).map(r=>({group:r.groupLabel,name:r.name,target:r.target,lockedGroup:getLockedStatusEffectRelationGroupName(r.target||r.name),sources:r.sources})) ,policy:'状態変化名ベースの不利対策に加え、状態変化マスタ外の自部隊不利対策は、弱化効果回避/無効/反射/解除・状態変化無効・会心無効・撃心無効の7候補のみ採用。耐久補助、ダメージ防御、負傷兵生存増加は採用しない。'};
  debugLog('effectCountermeasureIndex:build',state.diagnostics.effectCountermeasureIndex);
  return rows;
}
function formatCountermeasureDisplay(row,sourceNames){
  const names=(sourceNames||row?.sources||[]).map(norm).filter(Boolean);
  return `${row.name}${names.length?'['+names.join(',')+']':''}`;
}
function getCountermeasureRowByGroupAndName(groupKey,name){
  const g=norm(groupKey), n=norm(name);
  return buildEffectCountermeasureIndex().find(row=>row.groupKey===g&&row.name===n)||null;
}

// FIX[HADO-2.8.9.45-COUNTERMEASURE-GRANTED-SKILL-GATE]:
// 自部隊不利対策は、武将/装備が直接持つ技能だけでなく、技能本文で
// 「〇〇Lvを付与（この技能を持つ武将が所持しているものとして扱う）」と明示された参照技能も
// 実際に所持しているものとして扱う。例: LR関羽 忠勇1 → 武聖Lv1 → 同討回避/戦法遅延回避。
// 関羽個別ではなく、全武将・全装備・技能詳細の関連リンク表示直前ゲートで共通適用する。
function collectCountermeasureEffectLinesFromSkillItem(skillItem){
  const lines=[];
  try{
    (Array.isArray(skillItem?.sections)?skillItem.sections:[]).forEach(sec=>{
      (filterSkillContentLines(sec?.content||[])||[]).forEach(line=>{const n=norm(line);if(n)lines.push(n);});
    });
  }catch{}
  try{
    (Array.isArray(skillItem?.tables)?skillItem.tables:[]).forEach(table=>{
      getTableRows(table).forEach(row=>{
        if(!Array.isArray(row))return;
        const lv=norm(row[0]||'');
        const body=norm(row[1]||'');
        if(body&&(!lv||ROMAN_LEVELS.includes(lv)||/[■●▼]|Lv\d|を付与/.test(body)))lines.push(body);
      });
    });
  }catch{}
  return [...new Set(lines)];
}
function collectGrantedCountermeasureSkillNamesFromSkillItem(skillItem,depth=0,seen){
  const out=new Set();
  if(!skillItem||depth>4)return out;
  seen=seen||new Set();
  const skillName=norm(getItemDisplayName(skillItem)||skillItem?.name||skillItem?.title||'');
  if(skillName){
    if(seen.has(skillName))return out;
    seen.add(skillName);
  }
  const lines=collectCountermeasureEffectLinesFromSkillItem(skillItem);
  const refs=getReferencedSkillEntriesFromLines(lines);
  refs.forEach(ref=>{
    const name=norm(ref?.name||'');
    if(!name)return;
    out.add(name);
    const next=findItemByDisplayNameLazy('skills',name)||findItemByCategoryAndName('skills',name);
    if(next){
      collectGrantedCountermeasureSkillNamesFromSkillItem(next,depth+1,new Set(seen)).forEach(v=>out.add(v));
    }
  });
  return out;
}

// FIX[HADO-2.8.9.47-RELATED-LINK-ESCAPE-REGEXP]:
// 関連リンク生成の状態変化名正規表現で使用する共通エスケープ関数。
function escapeRegExp(value){
  return String(value==null?'':value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
}

// FIX[HADO-2.8.9.46-GRANTED-STATUS-COUNTERMEASURE]:
// 武将/戦法/技能/装備が付与する状態変化の説明に自部隊不利対策が含まれる場合、
// 例: LR呂玲綺の『憤怒』→『絶縁』→状態変化無効 を関連リンク表示直前で展開する。
function splitCountermeasureStatusGrantClauses(text){
  const src=normalizeHadouCrawlerTypoText(text||'');
  if(!src)return [];
  return src.split(/[。．\n]|[■●▼]/).map(v=>norm(v)).filter(Boolean);
}
function isEnemyGrantedStatusEffectContextForCountermeasure(text,statusName){
  const src=normalizeHadouCrawlerTypoText(text||'');
  const n=norm(statusName||'');
  if(!src||!n||!src.includes(n))return false;
  const escaped=escapeRegExp(n);
  return splitCountermeasureStatusGrantClauses(src).filter(clause=>clause.includes(n)).some(clause=>{
    const c=norm(clause);
    return new RegExp('(?:敵|相手|対象)[^。●▼■]{0,100}(?:に|へ|を対象に)[^。●▼■]{0,80}'+escaped+'[^。●▼■]{0,80}(?:付与|発生)').test(c)
      || new RegExp('(?:対象を含む)?敵\d*部隊[^。●▼■]{0,100}'+escaped+'[^。●▼■]{0,80}(?:付与|発生)').test(c)
      || new RegExp(escaped+'[^。●▼■]{0,80}(?:を)?(?:付与|発生)[^。●▼■]{0,100}(?:敵|相手|対象)').test(c)
      || new RegExp(escaped+'[^。●▼■]{0,160}(?:敵|相手)[^。●▼■]{0,40}(?:から|に|へ)[^。●▼■]{0,80}(?:付与|発生)').test(c)
      || /敵部隊から付与|敵[^。●▼■]{0,40}から付与|付与されうる/.test(c);
  });
}
function isSelfGrantedStatusEffectContextForCountermeasure(text,statusName){
  const src=normalizeHadouCrawlerTypoText(text||'');
  const n=norm(statusName||'');
  if(!src||!n||!src.includes(n))return false;
  const escaped=escapeRegExp(n);
  const selfTarget='(?:自身\d*部隊|自身|自分|自部隊|味方\d*部隊|味方)';
  return splitCountermeasureStatusGrantClauses(src).filter(clause=>clause.includes(n)).some(clause=>{
    const c=norm(clause);
    if(isEnemyGrantedStatusEffectContextForCountermeasure(c,n))return false;
    return new RegExp(selfTarget+'[^。●▼■]{0,80}(?:に|へ)[^。●▼■]{0,60}'+escaped+'[^。●▼■]{0,80}付与').test(c)
      || new RegExp(escaped+'[^。●▼■]{0,60}'+selfTarget+'\s*/').test(c)
      || new RegExp(escaped+'[^。●▼■]{0,80}'+selfTarget+'[^。●▼■]{0,80}付与').test(c);
  });
}
// FIX[HADO-2.8.9.48-RELATED-LINK-REVERSE-FLOW-GUARD]:
// 敵へ付与した状態変化は、自部隊耐性強化へ二段展開しない。
// 状態変化マスタ説明は、ownerが自部隊/味方へ明示付与した状態変化か、受ける不利を避ける明示文がある場合だけ展開する。
function collectSelfGrantedStatusEffectNamesFromTextForCountermeasure(text){
  const src=normalizeHadouCrawlerTypoText(text||'');
  if(!src)return [];
  const names=getAllStatusEffectNamesForRelatedLinks().sort((a,b)=>norm(b).length-norm(a).length);
  const out=new Set();
  names.forEach(name=>{
    const n=norm(name);
    if(!n||!src.includes(n))return;
    if(isSelfGrantedStatusEffectContextForCountermeasure(src,n))out.add(n);
  });
  return [...out].sort((a,b)=>a.localeCompare(b,'ja'));
}
function collectCountermeasureSourceStatusEffectNamesForOwnerItem(item,category){
  const cat=category||detailCategory(item);
  const out=new Set();
  const pushFromItem=it=>{
    buildStatusEffectRelatedLinkParts(it,{includeTacticAdditionalEffects:true}).forEach(part=>{
      collectSelfGrantedStatusEffectNamesFromTextForCountermeasure(part).forEach(v=>out.add(v));
    });
  };
  pushFromItem(item);
  if(cat==='generals'||cat==='equipments'||cat==='skills'){
    const skillNames=cat==='skills'?[getItemDisplayName(item)]:collectCountermeasureSourceSkillNamesForOwnerItem(item,cat);
    (skillNames||[]).forEach(skillName=>{
      const skillItem=findItemByDisplayNameLazy('skills',skillName)||findItemByCategoryAndName('skills',skillName);
      if(skillItem)pushFromItem(skillItem);
    });
  }
  return [...out].map(norm).filter(Boolean).sort((a,b)=>a.localeCompare(b,'ja'));
}
function pushCountermeasureRowsFromGrantedStatusEffects(rels,item,category){
  collectCountermeasureSourceStatusEffectNamesForOwnerItem(item,category).forEach(statusName=>{
    const statusItem=findStatusEffectItemByAnyName(statusName);
    if(!statusItem)return;
    collectCountermeasureRelationsForSourceItem(statusItem,'statusEffects').forEach(rel=>{
      rels.push({...rel,sourceName:statusName,grantedStatus:true});
    });
  });
}

function collectCountermeasureSourceSkillNamesForOwnerItem(item,category){
  const cat=category||detailCategory(item);
  const direct=cat==='generals'?collectSkillNamesFromGeneralItem(item):(cat==='equipments'?collectSkillNamesFromEquipmentItem(item):new Set());
  const out=new Set((direct instanceof Set?[...direct]:(Array.isArray(direct)?direct:[])).map(norm).filter(Boolean));
  [...out].forEach(skillName=>{
    const skillItem=findItemByDisplayNameLazy('skills',skillName)||findItemByCategoryAndName('skills',skillName);
    if(skillItem){
      collectGrantedCountermeasureSkillNamesFromSkillItem(skillItem,0,new Set()).forEach(v=>out.add(v));
    }
  });
  return [...out].map(norm).filter(Boolean).sort((a,b)=>a.localeCompare(b,'ja'));
}

// FIX[HADO-2.9.0.7-REVERT-DEDICATED-EQUIPMENT-AS-GENERAL-SOURCE]:
// 2.9.0.6で追加した「武将ページ内の専用名宝欄を武将本人の自部隊不利対策ソースとして扱う」経路は撤回。
// 武将本人の関連リンク補完対象は、従来仕様どおり本人技能・付与技能・自己付与状態変化に限定する。
// 専用名宝は装備カテゴリで扱うべきデータであり、武将本人の戦法/技能と同列に判定しない。
function pushCountermeasureRowsFromSkillAndGrantedSkills(rels,skillItem,skillName){
  const baseName=norm(skillName||getItemDisplayName(skillItem));
  if(skillItem)collectCountermeasureRelationsForSourceItem(skillItem,'skills').forEach(rel=>rels.push({...rel,sourceName:baseName||rel.sourceName}));
  const grants=collectGrantedCountermeasureSkillNamesFromSkillItem(skillItem,0,new Set());
  grants.forEach(grantedName=>{
    const grantedItem=findItemByDisplayNameLazy('skills',grantedName)||findItemByCategoryAndName('skills',grantedName);
    if(grantedItem)collectCountermeasureRelationsForSourceItem(grantedItem,'skills').forEach(rel=>rels.push({...rel,sourceName:grantedName||rel.sourceName,grantedVia:baseName}));
  });
}

function collectCountermeasureRelatedLinkRowsForItem(item){
  const category=detailCategory(item);
  const itemName=getItemDisplayName(item);
  const rels=[];
  const pushFromSource=(sourceItem,sourceType,sourceName)=>{
    collectCountermeasureRelationsForSourceItem(sourceItem,sourceType).forEach(rel=>rels.push({...rel,sourceName:sourceName||rel.sourceName}));
  };
  if(category==='skills'){
    pushCountermeasureRowsFromSkillAndGrantedSkills(rels,item,itemName);
    pushCountermeasureRowsFromGrantedStatusEffects(rels,item,'skills');
  }
  else if(category==='statusEffects')pushFromSource(item,'statusEffects',itemName);
  else if(category==='tactics'){
    pushFromSource(item,'tactics',itemName);
    pushCountermeasureRowsFromGrantedStatusEffects(rels,item,'tactics');
  }
  else if(category==='equipments'){
    pushFromSource(item,'equipments',itemName);
    collectCountermeasureSourceSkillNamesForOwnerItem(item,'equipments').forEach(skillName=>{const skillItem=findItemByDisplayNameLazy('skills',skillName)||findItemByCategoryAndName('skills',skillName);if(skillItem)pushFromSource(skillItem,'skills',skillName);});
    pushCountermeasureRowsFromGrantedStatusEffects(rels,item,'equipments');
  }
  else if(category==='generals'){
    collectCountermeasureSourceSkillNamesForOwnerItem(item,'generals').forEach(skillName=>{const skillItem=findItemByDisplayNameLazy('skills',skillName)||findItemByCategoryAndName('skills',skillName);if(skillItem)pushFromSource(skillItem,'skills',skillName);});
    // 2.9.0.27: 旧JSON/欠損JSON向け安全ゲートでも、武将JSON内の参軍技能本文を解析対象にする。
    // 参軍技能は通常技能と区別できるよう表示ソース名へ (参) を付ける。
    getAdvisorSkillEntriesForGeneralItem(item).forEach(entry=>{const skillName=norm(entry?.name||'');if(skillName)pushFromSource(entry,'skills',skillName+'(参)');});
    pushCountermeasureRowsFromGrantedStatusEffects(rels,item,'generals');
  }
  const byKey=new Map();
  rels.forEach(rel=>{
    if(!rel.name||!rel.groupKey)return;
    const key=[rel.groupKey,rel.name].join('@@');
    if(!byKey.has(key))byKey.set(key,{groupKey:rel.groupKey,groupLabel:STATUS_EFFECT_RELATION_GROUP_LABELS[rel.groupKey]||'',name:rel.name,target:rel.target||'',sources:[]});
    const row=byKey.get(key);
    if(!row.target&&rel.target)row.target=rel.target;
    if(!row.sources.includes(rel.sourceName))row.sources.push(rel.sourceName);
  });
  return [...byKey.values()].map(row=>({category:'statusEffects',title:row.groupLabel,names:[formatCountermeasureDisplay(row,row.sources.sort((a,b)=>a.localeCompare(b,'ja')))],targets:[norm(row.target||'')].filter(Boolean)}));
}
function suppressCountermeasureDuplicateStatusNames(groups,rows,item){
  // HADO-2.7.3.44: 対策文脈で採用済みの対象名だけ、通常の弱化/低下グループから除外する。
  // 関連リンク生成本体・派生JSON・キャッシュ構造には触れず、同一item内の表示直前グループだけを局所加工する。
  try{
    if(!Array.isArray(groups)||!Array.isArray(rows)||!rows.length)return groups;
    const removeByTitle={
      '自部隊不利対策':['敵部隊状態弱化','敵部隊能力低下','敵部隊耐性低下'],
      // HADO-2.8.9.44: 現行表示名は selfResistanceBuff=自部隊耐性強化。
      // 対策ゲートはこの表示名でも優先し、同討回避など採用済みtargetを通常の敵弱化/低下から除外する。
      '自部隊耐性強化':['敵部隊状態弱化','敵部隊能力低下','敵部隊耐性低下'],
      '敵部隊有利対策':['自部隊状態強化','自部隊能力強化','自部隊耐性強化'],
      '敵部隊耐性低下':['自部隊状態強化','自部隊能力強化','自部隊耐性強化']
    };
    const targetsByTitle=new Map();
    rows.forEach(row=>{
      const title=norm(row?.title||'');
      const targetTitles=removeByTitle[title]||[];
      if(!targetTitles.length)return;
      const targets=(row.targets||[]).map(norm).filter(Boolean);
      if(!targets.length)return;
      targetTitles.forEach(t=>{
        if(!targetsByTitle.has(t))targetsByTitle.set(t,new Set());
        targets.forEach(v=>targetsByTitle.get(t).add(v));
      });
    });
    if(!targetsByTitle.size)return groups;
    const removed=[];
    const next=groups.map(group=>{
      if(!group||group.category!=='statusEffects')return group;
      const targets=targetsByTitle.get(norm(group.title||''));
      if(!targets||!targets.size)return group;
      const before=Array.isArray(group.names)?group.names:[];
      const after=before.filter(name=>!targets.has(norm(resolveStatusEffectRelatedLinkTargetName(name)||name))&&!targets.has(norm(name)));
      if(after.length!==before.length){
        removed.push({title:group.title,removed:before.filter(name=>!after.includes(name)),kept:after});
      }
      return {...group,names:after};
    }).filter(group=>!(group&&group.category==='statusEffects'&&Array.isArray(group.names)&&group.names.length===0));
    if(removed.length){
      if(!state.diagnostics)state.diagnostics={};
      state.diagnostics.countermeasureDuplicateSuppression={source:'2.7.3.44',category:detailCategory(item),name:getItemDisplayName(item),removed,policy:'自部隊不利対策/敵部隊有利対策として採用済みのtargetだけを通常状態変化グループから除外。関連リンク生成本体は変更しない。'};
      debugLog('relatedLinks:countermeasure-duplicate-suppression',state.diagnostics.countermeasureDuplicateSuppression);
    }
    return next;
  }catch(err){
    debugLog('relatedLinks:countermeasure-duplicate-suppression-error',{error:err?.message||String(err)});
    return groups;
  }
}
function addCountermeasureRelatedGroups(groups,item){
  const rows=collectCountermeasureRelatedLinkRowsForItem(item);
  if(rows.length){
    // 2.7.0.9: 旧来の状態変化関連リンク側で生成された自部隊不利対策/敵部隊有利対策の素名表示を、
    // 対策名[技能名]形式の派生インデックス表示に置き換える。
    for(let i=groups.length-1;i>=0;i--){
      if(groups[i]&&groups[i].category==='statusEffects'&&(groups[i].title==='自部隊不利対策'||groups[i].title==='敵部隊有利対策'))groups.splice(i,1);
    }
    groups=suppressCountermeasureDuplicateStatusNames(groups,rows,item);
  }
  rows.forEach(row=>{
    const existing=groups.find(g=>g.category===row.category&&g.title===row.title);
    if(existing){existing.names=[...new Set([...existing.names,...row.names])].sort((a,b)=>a.localeCompare(b,'ja'));}
    else groups.push({category:row.category,title:row.title,names:row.names});
  });
  return groups;
}
// FIX[HADO-2.9.0.27-TRUSTED-ADVISOR-SAFETY-GATE]:
// 最新の監査済み related_link_index を正本とする。ただし旧JSONや欠損JSONで参軍技能由来の
// 自部隊不利対策だけが不足している場合は、該当リンクだけを局所補完する。
function addTrustedAdvisorCountermeasureSafetyFallback(groups,item,statusRels){
  try{
    if(detailCategory(item)!=='generals')return groups;
    const advisorEntries=getAdvisorSkillEntriesForGeneralItem(item);
    if(!advisorEntries.length)return groups;
    const indexedNames=new Set((statusRels||[]).map(v=>norm(v?.name||v?.displayName||'')).filter(Boolean));
    if([...indexedNames].some(name=>/\(参\)\]$/.test(name)))return groups;
    const rows=collectCountermeasureRelatedLinkRowsForItem(item).map(row=>({...row,names:(row.names||[]).filter(name=>/\(参\)\]$/.test(norm(name))&&!indexedNames.has(norm(name)))})).filter(row=>row.names.length);
    if(!rows.length)return groups;
    let next=suppressCountermeasureDuplicateStatusNames(groups,rows,item);
    rows.forEach(row=>{
      const existing=next.find(g=>g.category===row.category&&g.title===row.title);
      if(existing)existing.names=[...new Set([...(existing.names||[]),...row.names])].sort((a,b)=>a.localeCompare(b,'ja'));
      else next.push({category:row.category,title:row.title,names:[...row.names]});
    });
    const diag={source:'HADO-2.9.0.27',category:detailCategory(item),name:getItemDisplayName(item),added:rows.flatMap(row=>row.names),policy:'監査済みJSONを正本とし、旧JSON/欠損JSON時のみ参軍技能由来の不足リンクを局所補完する。'};
    state.diagnostics.trustedAdvisorCountermeasureSafetyFallback=diag;
    debugLog('relatedLinks:trusted-advisor-countermeasure-safety-fallback',diag);
    return next;
  }catch(err){debugLog('relatedLinks:trusted-advisor-countermeasure-safety-fallback-error',{error:err?.message||String(err)});return groups;}
}
function buildSelfResistanceRelatedLinkProbe(item,groups){
  try{
    const category=detailCategory(item), name=getItemDisplayName(item);
    const watch=category==='generals'&&/華雄/.test(name)||category==='skills'&&name==='剛塁';
    if(!watch)return null;
    const statusEffectNames=getAllStatusEffectNamesForRelatedLinks();
    const parts=buildStatusEffectRelatedLinkParts(item,{includeTacticAdditionalEffects:true});
    const relationRows=[];
    parts.forEach((part,idx)=>{
      const relations=collectStatusEffectRelationsFromText(part,statusEffectNames).filter(r=>r&&r.groupKey==='selfResistanceBuff');
      if(relations.length)relationRows.push({partIndex:idx,textSample:part.slice(0,300),relations});
    });
    const summary=summarizeRelatedLinkGroups(groups||[]);
    const hasSelfResistance=summary.some(g=>g.title==='自部隊不利対策'&&g.count>0);
    const diag={source:'HADO-2.7.0.3',category,name,partCount:parts.length,selfResistancePartHits:relationRows.length,selfResistanceRelations:relationRows.slice(0,20),relatedGroups:summary,hasSelfResistance,linkTargets:(summary.find(g=>g.title==='自部隊不利対策')?.names||[]).map(v=>({label:v,target:resolveStatusEffectRelatedLinkTargetName(v)||v,found:!!findStatusEffectItemByAnyName(resolveStatusEffectRelatedLinkTargetName(v)||v)})),policy:'剛塁問題の原因追跡。単体判定ではなく、実データ→sourceParts→relations→relatedGroups→表示リンク先名の経路で確認する。'};
    state.diagnostics.selfResistanceRelatedLinks=diag;
    debugLog('relatedLinks:selfResistance-probe',diag);
    return diag;
  }catch(err){const diag={source:'HADO-2.7.0.3',error:err?.message||String(err)};state.diagnostics.selfResistanceRelatedLinks=diag;debugLog('relatedLinks:selfResistance-probe-error',diag);return diag;}
}

function getDerivedRelatedBucketItems(key){
  const bucket=state?.derivedData?.[key];
  return bucket&&bucket.available&&Array.isArray(bucket.items)?bucket.items:[];
}
function getDerivedRelatedOwnerName(owner){
  return norm(owner?.name||owner?.displayName||owner?.rawName||owner?.title||owner||'');
}
function derivedRelatedOwnerMatches(owner,name){
  const target=norm(name);
  if(!target)return false;
  const candidates=[owner?.name,owner?.displayName,owner?.rawName,owner?.title,owner?.sourceName,owner].map(getDerivedRelatedOwnerName).filter(Boolean);
  return candidates.some(v=>v===target);
}
function getDerivedStatusEffectEntriesForOwner(category,name){
  const items=getDerivedRelatedBucketItems('statusEffectRelations');
  if(!items.length)return null;
  const targetCategory=category==='generals'?'generals':category==='equipments'?'equipments':category==='skills'?'skills':category==='tactics'?'tactics':'';
  if(!targetCategory)return [];
  const out=[];
  items.forEach(entry=>{
    const related=entry&&entry.related&&Array.isArray(entry.related[targetCategory])?entry.related[targetCategory]:[];
    if(related.some(owner=>derivedRelatedOwnerMatches(owner,name))){
      const statusName=norm(entry.statusEffectName||entry.baseName||entry.name||entry.displayName||'');
      if(statusName)out.push({name:statusName,reason:'derivedStatusEffectRelations',source:'hadou_status_effect_relations.json'});
    }
  });
  return out;
}
function getWhitelistedStatusEffectEntriesForRelatedLinkOwner(item,category,name){
  // FIX[HADO-2.7.3.45-RELATED-LINK-SOURCE-BOUNDARY]:
  // 関連リンクの状態変化判定は「実際の効果本文」だけを入力にする。
  // hadou_status_effect_relations.json は高速化用の派生JSONだが、過去版で攻略コメント・おすすめ説明・
  // 「同討や壊滅ダメージの対策」等の評価文が混入したため、表示直前では必ず下記ホワイトリスト経路で再判定する。
  // 対象にする: 戦法効果、戦法追加効果、技能本文、技能レベル別本文、装備技能本文、状態変化率の正規効果本文。
  // 対象外にする: 攻略評価コメント、おすすめ編制説明、相性説明、入手方法、列伝、五行説明、ランキング、関連リンク、所有者一覧。
  const statusEffectNames=getAllStatusEffectNamesForRelatedLinks();
  const cat=category||detailCategory(item);
  const out=[];
  const addAll=(values,reason)=>{
    (values||[]).forEach(v=>{
      const entry=(v&&typeof v==='object')?{...v}:{name:v};
      const n=norm(entry.name||'');
      if(!n)return;
      out.push({...entry,name:n,reason:entry.reason||reason,source:entry.source||'related-link-whitelist'});
    });
  };
  try{
    if(cat==='generals')addAll(collectStatusEffectNamesForGeneralDetail(item,statusEffectNames),'whitelist-general-effect-sources');
    else if(cat==='equipments')addAll(collectStatusEffectNamesForEquipmentDetail(item,statusEffectNames),'whitelist-equipment-effect-sources');
    else if(cat==='skills')addAll(collectStatusEffectRelationsFromSkillItem(item,statusEffectNames),'whitelist-skill-effect-sources');
    else if(cat==='tactics')addAll(collectStatusEffectRelationsFromTacticItem(item,statusEffectNames),'whitelist-tactic-effect-sources');
  }catch(err){
    debugLog('relatedLinks:source-boundary-whitelist-error',{category:cat,name:name||getItemDisplayName(item),error:err?.message||String(err)});
  }
  const seen=new Set();
  const result=out.filter(entry=>{const key=[entry.name,entry.groupKey||'',entry.relationType||''].join('@@');if(seen.has(key))return false;seen.add(key);return true;});
  if(!state.diagnostics)state.diagnostics={};
  state.diagnostics.relatedLinkSourceBoundary={source:'2.7.3.45',category:cat,name:name||getItemDisplayName(item),whitelistHitCount:result.length,sample:result.slice(0,20),policy:'派生JSONに攻略コメント由来の関連が残っていても、表示関連リンクは効果本文ホワイトリストで再判定する。'};
  return result;
}
function getDerivedStatusEffectEntryByName(name){
  const target=norm(name);
  if(!target)return null;
  const items=getDerivedRelatedBucketItems('statusEffectRelations');
  return items.find(entry=>{
    const names=[entry?.statusEffectName,entry?.baseName,entry?.name,entry?.displayName].map(norm).filter(Boolean);
    return names.includes(target);
  })||null;
}
function getDerivedSkillOwnerEntry(skillName){
  const target=norm(skillName);
  if(!target)return null;
  const items=getDerivedRelatedBucketItems('skillOwnerIndex');
  return items.find(entry=>norm(entry?.skillName||entry?.name||'')===target)||null;
}
function derivedOwnerTypeToCategory(ownerType){
  const type=norm(ownerType);
  if(type==='general')return 'generals';
  if(type==='equipment')return 'equipments';
  if(type==='skill')return 'skills';
  if(type==='tactic')return 'tactics';
  if(type==='statusEffect')return 'statusEffects';
  return '';
}
function resolveDerivedOwnerCanonicalName(ownerType,owner){
  const category=derivedOwnerTypeToCategory(ownerType||owner?.ownerType||'');
  const raw=norm(owner?.name||owner?.displayName||owner?.rawName||owner?.title||owner||'');
  if(!category||!raw)return '';
  const found=findItemByCategoryAndName(category,raw);
  if(!found)return '';
  return getItemDisplayName(found);
}
function ensureDerivedSkillOwnerUsageDiagnostic(){
  if(!state.diagnostics.derivedSkillOwnerUsage){
    state.diagnostics.derivedSkillOwnerUsage={timestamp:'',used:0,miss:0,filtered:0,byOwnerType:{},last:null};
  }
  return state.diagnostics.derivedSkillOwnerUsage;
}
function recordDerivedSkillOwnerUsage(info){
  const diag=ensureDerivedSkillOwnerUsageDiagnostic();
  diag.timestamp=(typeof nowTime==='function'?nowTime():new Date().toLocaleTimeString('ja-JP',{hour12:false}));
  diag.used+=(info?.used||0);
  diag.miss+=(info?.miss||0);
  diag.filtered+=(info?.filtered||0);
  const type=norm(info?.ownerType||'unknown')||'unknown';
  if(!diag.byOwnerType[type])diag.byOwnerType[type]={used:0,miss:0,filtered:0};
  diag.byOwnerType[type].used+=(info?.used||0);
  diag.byOwnerType[type].miss+=(info?.miss||0);
  diag.byOwnerType[type].filtered+=(info?.filtered||0);
  diag.last=info;
}
function getDerivedSkillOwnerNames(skillName,ownerType){
  const entry=getDerivedSkillOwnerEntry(skillName);
  const owners=Array.isArray(entry?.owners)?entry.owners:[];
  if(!entry){recordDerivedSkillOwnerUsage({skillName:norm(skillName),ownerType,used:0,miss:1,filtered:0,source:'hadou_skill_owner_index.json'});return [];}
  let filtered=0;
  const names=[];
  owners.filter(owner=>norm(owner?.ownerType||'')===ownerType).forEach(owner=>{
    const canonical=resolveDerivedOwnerCanonicalName(ownerType,owner);
    if(canonical)names.push(canonical);
    else filtered++;
  });
  const unique=[...new Set(names.map(norm).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja'));
  recordDerivedSkillOwnerUsage({skillName:norm(skillName),ownerType,used:unique.length,miss:0,filtered,source:'hadou_skill_owner_index.json'});
  return unique;
}

function buildCountermeasureSkillOwnerLookup(ownerType){
  const type=norm(ownerType||'');
  if(!(type==='general'||type==='equipment'))return new Map();
  const sourceItems=type==='general'?(Array.isArray(state.generals)?state.generals:[]):(Array.isArray(state.equipments)?state.equipments:[]);
  const cacheKey=[type,sourceItems.length,state.skillBuildSeq||0,state.savedSearchCacheSeq||0,HADO_BUILD_INFO.version].join('|');
  state._countermeasureSkillOwnerLookupCache=state._countermeasureSkillOwnerLookupCache||{};
  const cached=state._countermeasureSkillOwnerLookupCache[cacheKey];
  if(cached)return cached;
  const started=performance.now();
  const map=new Map();
  sourceItems.forEach(item=>{
    try{
      const ownerName=norm(getItemDisplayName(item));
      if(!ownerName)return;
      const skillNames=type==='general'?collectSkillNamesFromGeneralItem(item):collectSkillNamesFromEquipmentItem(item);
      (skillNames instanceof Set?[...skillNames]:(Array.isArray(skillNames)?skillNames:[])).map(norm).filter(Boolean).forEach(skill=>{
        if(!map.has(skill))map.set(skill,new Set());
        map.get(skill).add(ownerName);
      });
    }catch{}
  });
  const ms=Number((performance.now()-started).toFixed(1));
  const result={map,cacheKey,ms,itemCount:sourceItems.length,skillCount:map.size};
  state._countermeasureSkillOwnerLookupCache[cacheKey]=result;
  state.diagnostics.countermeasureSkillOwnerLookup=state.diagnostics.countermeasureSkillOwnerLookup||{};
  state.diagnostics.countermeasureSkillOwnerLookup[type]={cacheKey,ms,itemCount:sourceItems.length,skillCount:map.size,timestamp:new Date().toISOString()};
  debugLog('countermeasureSkillOwnerLookup:build',{source:'HADO-2.7.3.40',ownerType:type,cacheKey,ms,itemCount:sourceItems.length,skillCount:map.size});
  return result;
}
function getCountermeasureSkillOwnerNames(skillName,ownerType){
  const type=norm(ownerType||'');
  const target=norm(skillName||'');
  if(!target||!type)return [];
  const out=new Set();
  try{(getDerivedSkillOwnerNames(target,type)||[]).forEach(name=>{const n=norm(name);if(n)out.add(n);});}catch{}
  // HADO-2.7.3.40: グループ検索中に技能ごとに全武将/全装備を走査すると、
  // 「状態変化グループ選択 → 武将カテゴリON」でメインスレッドが詰まる。
  // 先に skillName -> ownerNames の索引を1回だけ作り、以後はMap参照にする。
  const lookup=buildCountermeasureSkillOwnerLookup(type);
  const owners=lookup&&lookup.map?lookup.map.get(target):null;
  if(owners)owners.forEach(name=>{const n=norm(name);if(n)out.add(n);});
  return [...out].map(norm).filter(Boolean).sort((a,b)=>a.localeCompare(b,'ja'));
}
function buildDerivedSkillOwnerDiagnosticForItem(item){
  if(detailCategory(item)!=='skills')return null;
  const skillName=getItemDisplayName(item);
  const entry=getDerivedSkillOwnerEntry(skillName);
  if(!entry)return {skillName,available:false,generals:[],equipments:[],filtered:0};
  const owners=Array.isArray(entry?.owners)?entry.owners:[];
  let filtered=0;
  const general=[];
  const equipment=[];
  owners.forEach(owner=>{
    const type=norm(owner?.ownerType||'');
    const canonical=resolveDerivedOwnerCanonicalName(type,owner);
    if(!canonical){filtered++;return;}
    if(type==='general')general.push(canonical);
    else if(type==='equipment')equipment.push(canonical);
  });
  return {skillName,available:true,generals:[...new Set(general)].sort((a,b)=>a.localeCompare(b,'ja')),equipments:[...new Set(equipment)].sort((a,b)=>a.localeCompare(b,'ja')),filtered,ownerTotal:owners.length};
}
function buildDerivedParameterSummaryLookup(){
  const items=getDerivedRelatedBucketItems('parameterSummaryIndex');
  const signature=[items.length,state.derivedData?.parameterSummaryIndex?.dataSetId||state.derivedData?.parameterSummaryIndex?.meta?.dataSetId||'',state.derivedData?.parameterSummaryIndex?.crawlerVersion||state.derivedData?.parameterSummaryIndex?.meta?.crawlerVersion||''].join('|');
  if(state._derivedParameterSummaryLookup&&state._derivedParameterSummaryLookup.signature===signature)return state._derivedParameterSummaryLookup.map;
  const map=new Map();
  items.forEach(entry=>{
    const cat=normalizeDerivedSearchCategory(entry?.category||'');
    if(!cat)return;
    [entry?.name,entry?.rawName,entry?.displayName,entry?.title].map(norm).filter(Boolean).forEach(n=>{
      const key=`${cat}@@${n}`;
      if(!map.has(key))map.set(key,entry);
    });
  });
  state._derivedParameterSummaryLookup={signature,map};
  return map;
}
function getDerivedParameterSummaryEntry(category,name){
  const cat=normalizeDerivedSearchCategory(category);
  const target=norm(name);
  if(!cat||!target)return null;
  return buildDerivedParameterSummaryLookup().get(`${cat}@@${target}`)||null;
}
function mapDerivedParameterEffectToStatusRelation(effect){
  const param=norm(effect?.parameter||'');
  const direction=norm(effect?.direction||'');
  const matched=norm(effect?.matchedText||'');
  const targetSide=norm(effect?.targetSide||'');
  if(!param||!direction)return null;
  let base='';
  if(/被ダメージ/.test(matched)||param==='被ダメージ')base='被ダメージ変化';
  else if(param==='与ダメージ')base='与ダメージ変化';
  else if(param==='兵科相性')base='兵科相性変化';
  else if(param==='対物特効')base='対物特効変化';
  else if(param==='攻撃'||param==='防御'||param==='知力'||param==='機動'||param==='攻撃速度'||param==='戦法速度'||param==='兵器速度'||param==='会心発生'||param==='会心威力'||param==='撃心発生'||param==='撃心威力'||param==='戦法威力'||param==='命中'||param==='通常攻撃威力')base=`${param}変化`;
  if(!base)return null;
  const isIncrease=direction==='increase'||direction==='上昇'||/\+/.test(norm(effect?.value||''));
  const rawName=`${base}(${isIncrease?'強化':'弱化'})`;
  let groupKey=isIncrease?'selfAbilityBuff':'enemyAbilityDebuff';
  if(base==='被ダメージ変化'&&!isIncrease)groupKey='selfAbilityBuff';
  else if(base==='被ダメージ変化'&&isIncrease)groupKey='enemyAbilityDebuff';
  else if(targetSide==='self_or_ally'&&isIncrease)groupKey='selfAbilityBuff';
  else if(targetSide==='enemy'&&!isIncrease)groupKey='enemyAbilityDebuff';
  return {name:rawName,groupKey,reason:'derivedParameterSummary',source:'hadou_parameter_summary_index.json'};
}
function getDerivedParameterStatusRelations(category,name){
  const entry=getDerivedParameterSummaryEntry(category,name);
  if(!entry||!Array.isArray(entry.effects))return [];
  const out=[];
  entry.effects.forEach(effect=>{
    const rel=mapDerivedParameterEffectToStatusRelation(effect);
    if(rel)out.push(rel);
  });
  return out;
}
function filterGeneralSkillRelatedNamesByOwnedSkillBoundary(currentCategory,currentName,cat,names){
  const sourceNames=normalizeRelatedLinkNameList(names);
  if(cat!=='skills')return sourceNames;
  if(currentCategory==='generals'){
    const general=findItemByDisplayNameLazy('generals',currentName)||findItemByCategoryAndName('generals',currentName);
    if(!general)return sourceNames;
    const owned=collectSkillNamesFromGeneralItem(general);
    const filtered=sourceNames.map(norm).filter(n=>n&&owned.has(relatedSkillTargetNameForDisplay(n)));
    const removed=sourceNames.map(norm).filter(n=>n&&!owned.has(relatedSkillTargetNameForDisplay(n))&&findItemByCategoryAndName('skills',relatedSkillTargetNameForDisplay(n)));
    if(removed.length)debugLog('relatedLinks:display-boundary-general-skill-filter',{general:currentName,removed:[...new Set(removed)].sort((a,b)=>a.localeCompare(b,'ja')).slice(0,50),kept:[...new Set(filtered)].sort((a,b)=>a.localeCompare(b,'ja')),policy:'HADO-2.7.3.47: 派生JSON/索引に攻略コメント由来の技能名が残っていても、武将関連リンク表示直前に実技能欄で再照合する。'});
    return filtered;
  }
  if(currentCategory==='equipments'){
    const equipment=findItemByDisplayNameLazy('equipments',currentName)||findItemByCategoryAndName('equipments',currentName);
    if(!equipment)return sourceNames;
    const owned=collectSkillNamesFromEquipmentItem(equipment);
    const filtered=sourceNames.map(norm).filter(n=>n&&owned.has(n));
    const removed=sourceNames.map(norm).filter(n=>n&&!owned.has(n)&&findItemByCategoryAndName('skills',n));
    if(removed.length)debugLog('relatedLinks:display-boundary-equipment-skill-filter',{equipment:currentName,removed:[...new Set(removed)].sort((a,b)=>a.localeCompare(b,'ja')).slice(0,80),kept:[...new Set(filtered)].sort((a,b)=>a.localeCompare(b,'ja')),policy:'HADO-2.8.9.24.1: related_link_index/skill_owner_indexに広域スキャン由来の技能名が残っていても、装備関連技能は装備技能表と技能Lv+1参照で再照合して表示する。'});
    return filtered;
  }
  return sourceNames;
}
function addDerivedRelatedGroup(groups,currentCategory,currentName,cat,title,names){
  const sourceNames=filterGeneralSkillRelatedNamesByOwnedSkillBoundary(currentCategory,currentName,cat,names);
  const clean=[...new Set(sourceNames.map(norm).filter(Boolean))].filter(n=>canUseRelatedLinkName(cat,n,currentCategory,currentName)).sort((a,b)=>a.localeCompare(b,'ja'));
  if(!clean.length)return;
  const existing=groups.find(g=>g.category===cat&&g.title===title);
  if(existing)existing.names=[...new Set([...existing.names,...clean])].sort((a,b)=>a.localeCompare(b,'ja'));
  else groups.push({category:cat,title,names:clean});
}

function buildDerivedRelatedLinkIndexLookup(){
  const items=getDerivedRelatedBucketItems('relatedLinkIndex');
  const signature=[items.length,getRelatedLinkIndexSignature()].join('|');
  if(state._derivedRelatedLinkIndexLookup&&state._derivedRelatedLinkIndexLookup.signature===signature)return state._derivedRelatedLinkIndexLookup.map;
  const map=new Map();
  items.forEach(entry=>{
    const cat=normalizeDerivedSearchCategory(entry?.category||'');
    if(!cat)return;
    [entry?.name,entry?.displayName,entry?.rawName,entry?.title].map(norm).filter(Boolean).forEach(n=>{
      const key=`${cat}@@${n}`;
      if(!map.has(key))map.set(key,entry);
    });
  });
  state._derivedRelatedLinkIndexLookup={signature,map};
  state.diagnostics.relatedLinkIndexLookup={signature,itemCount:items.length,keyCount:map.size,source:'related-link-index-map'};
  return map;
}
function getDerivedRelatedLinkIndexEntry(item){
  if(!item)return null;
  const category=normalizeDerivedSearchCategory(detailCategory(item));
  const names=[getItemDisplayName(item),item?.name,item?.rawName,item?.title,item?.raw?.name,item?.raw?.title].map(v=>norm(v)).filter(Boolean);
  const lookup=buildDerivedRelatedLinkIndexLookup();
  for(const n of names){
    const entry=lookup.get(`${category}@@${n}`);
    if(entry)return entry;
  }
  return null;
}
function relatedSkillTargetNameForDisplay(value){return norm(String(value||'').replace(/[（(]参[）)]$/,''));}
function isAdvisorRelatedSkillDisplayName(value){return /[（(]参[）)]$/.test(norm(value||''));}
function derivedRelatedIndexNames(list){
  return (Array.isArray(list)?list:[]).filter(v=>{
    const t=norm(v?.sourcePartType||'');
    return !/comment|recommend|commentary|ranking|入手|おすすめ|評価/.test(t);
  }).map(v=>norm(v?.displayName||v?.name||v?.rawName||v?.title||v)).filter(Boolean);
}
function getCachedWhitelistedStatusEffectEntriesForRelatedLinkOwner(item,category,name){
  const cacheKey=[category||detailCategory(item),norm(name||getItemDisplayName(item)),getRelatedLinkIndexSignature(),HADO_BUILD_INFO.version].join('@@');
  if(!state._relatedLinkWhitelistStatusCache)state._relatedLinkWhitelistStatusCache=new Map();
  if(state._relatedLinkWhitelistStatusCache.has(cacheKey))return state._relatedLinkWhitelistStatusCache.get(cacheKey)||[];
  const values=getWhitelistedStatusEffectEntriesForRelatedLinkOwner(item,category,name)||[];
  state._relatedLinkWhitelistStatusCache.set(cacheKey,values);
  return values;
}
function getFastParameterStatusRelationsForTrustedRelatedIndex(category,name,related){
  const rels=[];
  const addAll=(values)=>{(values||[]).forEach(v=>{if(v&&v.name)rels.push(v);});};
  addAll(getDerivedParameterStatusRelations(category,name));
  const seen=new Set();
  return rels.filter(v=>{const key=[v.name||'',v.groupKey||'',v.relationType||''].join('@@');if(seen.has(key))return false;seen.add(key);return true;});
}
function getDerivedRelatedLinkIndexGroupsForItem(item,options={}){
  const entry=getDerivedRelatedLinkIndexEntry(item);
  if(!entry||!entry.related)return null;
  const category=detailCategory(item);
  const name=norm(getItemDisplayName(item));
  const trustedIndex=!!options.trustedIndex;
  const groups=[];
  const add=(cat,title,names)=>addDerivedRelatedGroup(groups,category,name,cat,title,names);
  const related=entry.related||{};
  add('generals','武将',derivedRelatedIndexNames(related.generals));
  add('tactics','戦法',derivedRelatedIndexNames(related.tactics));
  add('skills','技能',derivedRelatedIndexNames(related.skills));
  add('equipments','装備',derivedRelatedIndexNames(related.equipments));
  let statusRels=(Array.isArray(related.statusEffects)?related.statusEffects:[]).map(v=>({
    name:norm(v?.name||v?.statusEffectName||v?.displayName||''),
    groupKey:norm(v?.groupKey||''),
    groupLabel:norm(v?.groupLabel||''),
    relationType:norm(v?.relationType||''),
    source:norm(v?.source||'hadou_related_link_index.json'),
    sourcePartType:norm(v?.sourcePartType||''),
    sourceTacticName:norm(v?.sourceTacticName||''),
    sourceTacticGrantedStatusName:norm(v?.sourceTacticGrantedStatusName||''),
    directGrantVerified:v?.directGrantVerified===true,
    displayRole:norm(v?.displayRole||''),
    sourceName:norm(v?.sourceName||''),
    sourceKind:norm(v?.sourceKind||''),
    coveredByFunctionalSummary:v?.coveredByFunctionalSummary===true
  })).filter(v=>v.name&&!/comment|recommend|commentary|ranking|入手|おすすめ|評価/.test(v.sourcePartType))
    .filter(v=>!(v.source==='self_countermeasure_index'&&v.sourcePartType==='self-countermeasure-granted-status'&&v.sourceTacticName&&!v.directGrantVerified));
  const indexedCountermeasureRels=statusRels.filter(v=>v&&(v.source==='self_countermeasure_index'||/self-countermeasure/.test(v.sourcePartType)||isCountermeasureRelatedDisplayLabel(v.name)));
  let usedFastParameterStatus=false;
  let usedEffectSourceWhitelist=false;
  const relatedBundle=getRelatedLinkIndexBundle();
  const trustedAuditOk=trustedIndex&&relatedLinkIndexAuditOkForTrust(relatedBundle.audit||{},norm(relatedBundle.meta?.crawlerVersion||''));
  const shouldRebuildStatusFromWhitelist=trustedIndex&&(!trustedAuditOk&&['equipments','skills','tactics'].includes(category));
  if(shouldRebuildStatusFromWhitelist){
    // HADO-2.9.0.14: 監査OKのrelated_link_indexは正本として使い、武将カテゴリでも表示直前の本文再解析をしない。
    // クローラー不具合の判別不能化と検索/詳細表示の速度劣化を避けるため、ホワイトリスト再走査は監査NG時だけに限定する。
    const whitelistedRels=getCachedWhitelistedStatusEffectEntriesForRelatedLinkOwner(item,category,name);
    statusRels=[...whitelistedRels,...indexedCountermeasureRels];
    usedEffectSourceWhitelist=true;
  }else if(trustedAuditOk){
    // HADO-2.8.9.52: クローラー監査OKの related_link_index は状態変化リンクも正本扱いする。
    // ただし2.9.0.7以降、武将カテゴリは専用名宝欄混入を避けるため上のホワイトリスト境界を優先する。
    usedEffectSourceWhitelist=false;
  }else if(!trustedIndex&&category==='equipments'){
    statusRels=getWhitelistedStatusEffectEntriesForRelatedLinkOwner(item,category,name);
  }
  const grantedStatusRels=statusRels.filter(v=>v&&v.groupKey==='selfResistanceBuff'&&v.displayRole==='granted-status');
  const primaryStatusRels=statusRels.filter(v=>!(v&&v.groupKey==='selfResistanceBuff'&&v.displayRole==='granted-status'));
  addStatusEffectRelationGroups(add,primaryStatusRels);
  if(grantedStatusRels.length)add('statusEffects','付与される状態変化',grantedStatusRels.map(v=>v.name));
  if(trustedAuditOk&&category==='generals')groups.splice(0,groups.length,...addTrustedAdvisorCountermeasureSafetyFallback(groups,item,statusRels));
  if(!trustedIndex&&(category==='generals'||category==='skills'||category==='statusEffects')){
    groups.splice(0,groups.length,...addCountermeasureRelatedGroups(groups,item));
    buildSelfResistanceRelatedLinkProbe(item,groups);
  }else if(!trustedIndex){
    groups.splice(0,groups.length,...addCountermeasureRelatedGroups(groups,item));
    buildSelfResistanceRelatedLinkProbe(item,groups);
  }else if(category==='generals'||category==='skills'||category==='statusEffects'){
    buildSelfResistanceRelatedLinkProbe(item,groups);
  }
  const diag={category,name,source:'hadou_related_link_index.json',available:true,groupCount:groups.length,relatedCounts:Object.fromEntries(Object.entries(related).map(([k,v])=>[k,Array.isArray(v)?v.length:0])),trustedIndex,usedFastParameterStatus,usedEffectSourceWhitelist,displayRoleUsage:{functionalSummary:primaryStatusRels.filter(v=>v.displayRole==='functional-summary').length,grantedStatus:grantedStatusRels.length,directStatus:primaryStatusRels.filter(v=>v.displayRole==='direct-status').length},qualityAudit:state.derivedData?.relatedLinkIndex?.qualityAudit||state.derivedData?.relatedLinkIndex?.meta?.qualityAudit||null,policy:'HADO-2.9.0.36: 監査OKのrelated_link_indexではdisplayRoleを正本として使う。functional-summaryは自部隊不利対策、granted-statusは付与される状態変化へ分離し、アプリ側の文字列推測で重複排除しない。'};
  state.diagnostics.relatedLinkIndex=diag;
  debugLog('relatedLinkIndex:hit',diag);
  const countermeasureTrusted=!!(trustedIndex&&trustedAuditOk&&state.derivedData?.relatedLinkIndex);
  return {groups,source:usedEffectSourceWhitelist?'related-link-index+effect-source-whitelist':(usedFastParameterStatus?'related-link-index+parameter-summary-index':'related-link-index-trusted'),usedRelatedLinkIndex:true,usedFastParameterStatus,usedEffectSourceWhitelist,countermeasureTrusted};
}

function getDerivedRelatedLinkGroupsForItem(item){
  const category=detailCategory(item);
  const name=getItemDisplayName(item);
  const idx=state.lookupIndexes||{};
  const hasDerivedStatus=getDerivedRelatedBucketItems('statusEffectRelations').length>0;
  const hasDerivedSkillOwners=getDerivedRelatedBucketItems('skillOwnerIndex').length>0;
  const groups=[];
  const add=(cat,title,names)=>addDerivedRelatedGroup(groups,category,norm(name),cat,title,names);
  let used=false;
  if(category==='generals'){
    used=hasDerivedStatus;
    add('tactics','戦法',getSetValues(idx.generalTacticNames,name));
    add('skills','技能',getSetValues(idx.generalSkillNames,name));
    const rels=[...getWhitelistedStatusEffectEntriesForRelatedLinkOwner(item,category,name),...getDerivedParameterStatusRelations(category,name)];
    addStatusEffectRelationGroups(add,rels);
    groups.splice(0,groups.length,...addCountermeasureRelatedGroups(groups,item));
  }else if(category==='equipments'){
    used=hasDerivedStatus||hasDerivedSkillOwners;
    add('skills','技能',getSetValues(idx.equipmentSkillNames,name));
    const rels=[...getWhitelistedStatusEffectEntriesForRelatedLinkOwner(item,category,name),...getDerivedParameterStatusRelations(category,name)];
    addStatusEffectRelationGroups(add,rels);
  }else if(category==='skills'){
    used=hasDerivedStatus||hasDerivedSkillOwners;
    if(hasDerivedSkillOwners){
      add('generals','武将',getDerivedSkillOwnerNames(name,'general'));
      add('equipments','装備',getDerivedSkillOwnerNames(name,'equipment'));
    }else{
      add('generals','武将',getOwnersFromMap(idx.generalSkillNames,name));
      add('equipments','装備',getOwnersFromMap(idx.equipmentSkillNames,name));
    }
    const rels=getWhitelistedStatusEffectEntriesForRelatedLinkOwner(item,category,name);
    addStatusEffectRelationGroups(add,rels);
    groups.splice(0,groups.length,...addCountermeasureRelatedGroups(groups,item));
  }else if(category==='tactics'){
    used=hasDerivedStatus;
    add('generals','武将',getOwnersFromMap(idx.generalTacticNames,name));
    const rels=getWhitelistedStatusEffectEntriesForRelatedLinkOwner(item,category,name);
    addStatusEffectRelationGroups(add,rels);
  }else if(category==='statusEffects'){
    const entry=getDerivedStatusEffectEntryByName(name);
    if(entry){
      used=true;
      const related=entry.related||{};
      const directOwners=rows=>(rows||[]).filter(owner=>norm(owner?.relationType||'')==='direct_grant'||norm(owner?.sourcePartType||owner?.source||'')==='semantic-owner-status-grant').map(getDerivedRelatedOwnerName);
      add('tactics','戦法',directOwners(related.tactics));
      add('skills','技能',directOwners(related.skills));
      add('equipments','装備',directOwners(related.equipments));
      add('generals','武将',directOwners(related.generals));
    }
  }
  if(!used)return null;
  buildSelfResistanceRelatedLinkProbe(item,groups);
  return {groups,source:'derived-json-2.8.8.8-compatible',usedStatusEffectRelations:hasDerivedStatus,usedSkillOwnerIndex:hasDerivedSkillOwners,usedParameterSummary:getDerivedRelatedBucketItems('parameterSummaryIndex').length>0};
}
function getRelatedLinkIndexBundle(){
  const entry=state.derivedData?.relatedLinkIndex||null;
  if(!entry)return {items:[],meta:{},audit:{},available:false};
  if(Array.isArray(entry))return {items:entry,meta:{},audit:{},available:entry.length>0};
  const baseMeta=(entry.meta&&typeof entry.meta==='object')?entry.meta:{};
  const meta={...baseMeta};
  ['schemaVersion','dataSetId','datasetId','data_set_id','crawlerVersion','crawler_version','generatedAt','kind'].forEach(k=>{if(entry[k]&&!meta[k])meta[k]=entry[k];});
  const auditCandidates=[entry.qualityAudit,entry.quality_audit,baseMeta.qualityAudit,baseMeta.quality_audit,entry.audit,entry.meta?.audit].filter(v=>v&&typeof v==='object');
  const audit=auditCandidates[0]||{};
  if(audit&&!meta.qualityAudit)meta.qualityAudit=audit;
  const items=Array.isArray(entry.items)?entry.items:(Array.isArray(entry.data)?entry.data:(Array.isArray(entry.entries)?entry.entries:[]));
  return {items,meta,audit,available:!!(entry.available!==false&&items.length>0)};
}
function boolishTrue(v){return v===true||v==='true'||v===1||v==='1';}
function numberish(v){const n=Number(v||0);return Number.isFinite(n)?n:0;}
function compareVersionAtLeast(actual,required){
  const a=String(actual||'').split('.').map(v=>parseInt(v,10)||0);
  const b=String(required||'').split('.').map(v=>parseInt(v,10)||0);
  const len=Math.max(a.length,b.length);
  for(let i=0;i<len;i++){const av=a[i]||0,bv=b[i]||0;if(av>bv)return true;if(av<bv)return false;}
  return true;
}
function relatedLinkIndexAuditOkForTrust(audit,crawlerVersion){
  const sourceRisk=audit?.sourceRisk||{};
  const regression=audit?.representativeRegression||{};
  const legacy=audit?.legacyEquivalence||{};
  const fullAudit=audit?.fullGeneralStatusEffectAudit||{};
  const coverageAudit=audit?.coverageAudit||{};
  const coverageOk=boolishTrue(coverageAudit.ok)&&!numberish(coverageAudit.missingCount)&&numberish(coverageAudit.statusEffectIndexedCount)>=numberish(coverageAudit.statusEffectExpectedCount);
  const riskOk=!numberish(sourceRisk.parameterSummaryStatusCount)
    &&!numberish(sourceRisk.textScanStatusCount)
    &&!numberish(sourceRisk.representativeCorrectionCount)
    &&!numberish(sourceRisk.fullGeneralStatusMissingAfterCount);
  const fullOk=boolishTrue(fullAudit.ok)&&!numberish(fullAudit.missingAfterTotal)&&!numberish(fullAudit.ngAfterGeneralCount);
  const representativeOk=boolishTrue(regression.ok)&&boolishTrue(legacy.ok)&&riskOk;
  const crawlerOk=compareVersionAtLeast(crawlerVersion,'1.0.4.30');
  // HADO-2.8.9.42: 1.0.4.30以降は全武将状態変化監査(fullGeneralStatusEffectAudit)を主信頼条件にする。
  // 代表3件監査だけでなく、全武将473件のmissingAfterTotal=0を満たす場合のみ正本利用する。
  return !!(crawlerOk&&coverageOk&&riskOk&&(fullOk||representativeOk));
}
function getRelatedLinkIndexSignature(){
  const bundle=getRelatedLinkIndexBundle();
  const meta=bundle.meta||{};
  const audit=bundle.audit||{};
  const crawlerVersion=norm(meta.crawlerVersion||state.diagnostics?.derivedJsonIntegrity?.crawlerVersions?.[0]||'');
  const dataSetId=norm(meta.dataSetId||meta.datasetId||state.diagnostics?.derivedJsonIntegrity?.dataSetIds?.[0]||'');
  const trustStatus=relatedLinkIndexAuditOkForTrust(audit,crawlerVersion)?'ok':'ng';
  return [crawlerVersion,dataSetId,trustStatus].join('|');
}
function getRelatedLinksCacheKey(item,categoryKey,name){
  const category=categoryKey||detailCategory(item);
  const itemName=norm(name||getItemDisplayName(item));
  const mode=state.viewMode||'';
  return [category,itemName,mode,'relatedIndexTrust',getRelatedLinkIndexSignature&&getRelatedLinkIndexSignature()].filter(Boolean).join('@@');
}

function getRelatedLinkGroupsForItem(item){const category=detailCategory(item);const name=getItemDisplayName(item);const idx=state.lookupIndexes||{};const groups=[];const statusEffectNames=getAllStatusEffectNamesForRelatedLinks();function add(cat,title,names){const sourceNames=normalizeRelatedLinkNameList(names);const currentName=norm(name);const clean=[...new Set(sourceNames.map(norm).filter(Boolean))].filter(n=>canUseRelatedLinkName(cat,n,category,currentName)).sort((a,b)=>a.localeCompare(b,'ja'));if(clean.length){const existing=groups.find(g=>g.category===cat&&g.title===title);if(existing){existing.names=[...new Set([...existing.names,...clean])].sort((a,b)=>a.localeCompare(b,'ja'));}else groups.push({category:cat,title,names:clean});}}
if(category==='generals'){
  add('tactics','戦法',getSetValues(idx.generalTacticNames,name));
  add('skills','技能',getSetValues(idx.generalSkillNames,name));
  add('equipments','装備',collectNamesMentionedInItem(item,'equipments'));
  addStatusEffectRelationGroups(add,collectStatusEffectNamesForGeneralDetail(item,statusEffectNames));
}
else if(category==='equipments'){
  add('generals','武将',collectNamesMentionedInItem(item,'generals'));
  add('skills','技能',getSetValues(idx.equipmentSkillNames,name));
  addStatusEffectRelationGroups(add,collectStatusEffectNamesForEquipmentDetail(item,statusEffectNames));
}
else if(category==='skills'){
  add('generals','武将',getOwnersFromMap(idx.generalSkillNames,name));
  add('skills','技能',collectSkillNamesMentionedInSkillEffectOnly(item));
  add('tactics','戦法',collectTacticNamesMentionedInSkillEffectOnly(item));
  add('equipments','装備',getOwnersFromMap(idx.equipmentSkillNames,name));
  addStatusEffectRelationGroups(add,collectStatusEffectRelationsFromSkillItem(item,statusEffectNames));
}
else if(category==='tactics'){
  add('generals','武将',getOwnersFromMap(idx.generalTacticNames,name));
  add('skills','技能',collectNamesMentionedInItem(item,'skills'));
  add('equipments','装備',collectNamesMentionedInItem(item,'equipments'));
  addStatusEffectRelationGroups(add,collectStatusEffectRelationsFromTacticItem(item,statusEffectNames));
}
else if(category==='statusEffects'){
  const enhanced=getEnhancedStatusEffectRelatedGroups(item);
  enhanced.forEach(g=>groups.push(g));
  add('generals','武将',collectStatusEffectOwnerNamesFromRelatedGroups(enhanced,'generals'));
  add('equipments','装備',collectStatusEffectOwnerNamesFromRelatedGroups(enhanced,'equipments'));
}
addCountermeasureRelatedGroups(groups,item);
const groupSummary=summarizeRelatedLinkGroups(groups);debugLog('relatedLinks:groups',{category,name,groupCount:groups.length,groups:groupSummary,effectCountermeasureIndexCount:(state._effectCountermeasureIndex||[]).length});buildSelfResistanceRelatedLinkProbe(item,groups);return groups;}
function summarizeRelatedLinkGroups(groups){return (Array.isArray(groups)?groups:[]).map(group=>({category:group.category,title:group.title,count:Array.isArray(group.names)?group.names.length:0,names:(Array.isArray(group.names)?group.names:[]).slice(0,30)}));}
function isCountermeasureRelatedGroupTitle(title){
  const t=norm(title||'');
  return t==='自部隊不利対策'||t==='敵部隊有利阻害'||t==='敵部隊有利対策';
}
function isCountermeasureRelatedDisplayLabel(label){
  const raw=norm(label||'');
  if(!raw)return false;
  // HADO-2.8.9.44: 自部隊耐性強化グループ内でも、同討回避[武聖] のような対策ラベルは
  // 状態変化リンクではなく、対策ラベルとして描画する。通常の 献計/取込/弱化無効 などは従来通り状態変化リンク。
  return /^[^\[\]［］]+(?:回避|無効|解除|反射|短縮|抑制|奪取|反転|無視)(?:[\[［].*[\]］])?$/.test(raw);
}
function renderCountermeasureRelatedBaseHtml(title){
  const name=norm(title||'');
  if(!name)return '';
  const statusItem=findStatusEffectItemByAnyName(name);
  if(statusItem&&!isSuppressedStatusEffectDetailLinkName(name)){
    const linkName=norm(statusItem?.name||statusItem?.originalName||statusItem?.statusDisplayName||getItemDisplayName(statusItem)||name);
    return `<a href="#" class="detail-entity-link" data-category="statusEffects" data-name="${esc(linkName)}">${esc(name)}</a>`;
  }
  return `<span>${esc(name)}</span>`;
}
function renderCountermeasureRelatedLabelHtml(label){
  const raw=norm(label||'');
  if(!raw)return '';
  const m=raw.match(/^([^\[]+)(?:\[([^\]]*)\])?$/);
  if(!m)return `<span class="countermeasure-label">${esc(raw)}</span>`;
  const title=norm(m[1]||'');
  const sources=norm(m[2]||'');
  const titleHtml=renderCountermeasureRelatedBaseHtml(title);
  if(!sources)return `<span class="countermeasure-label">${titleHtml}</span>`;
  const sourceHtml=sources.split(/[、,，]/).map(norm).filter(Boolean).map(sourceName=>{
    // FIX[HADO-2.9.0.28-ADVISOR-COUNTERMEASURE-LINK]:
    // 表示名 啓蒙(参) は維持し、技能詳細へのリンク先だけ実技能名 啓蒙 へ正規化する。
    const skillTargetName=relatedSkillTargetNameForDisplay(sourceName);
    const skillItem=typeof findItemByDisplayNameLazy==='function'?findItemByDisplayNameLazy('skills',skillTargetName):null;
    if(skillItem){
      return `<a href="#" class="detail-entity-link" data-category="skills" data-name="${esc(skillTargetName)}">${esc(sourceName)}</a>`;
    }
    const statusItem=findStatusEffectItemByAnyName(sourceName);
    if(statusItem&&!isSuppressedStatusEffectDetailLinkName(sourceName)){
      const statusName=norm(statusItem?.name||statusItem?.originalName||statusItem?.statusDisplayName||getItemDisplayName(statusItem)||sourceName);
      return `<a href="#" class="detail-entity-link" data-category="statusEffects" data-name="${esc(statusName)}">${esc(sourceName)}</a>`;
    }
    const tacticItem=typeof findItemByDisplayNameLazy==='function'?findItemByDisplayNameLazy('tactics',sourceName):null;
    if(tacticItem){
      return `<a href="#" class="detail-entity-link" data-category="tactics" data-name="${esc(sourceName)}">${esc(sourceName)}</a>`;
    }
    return `<span>${esc(sourceName)}</span>`;
  }).join(',');
  return `<span class="countermeasure-label">${titleHtml}[${sourceHtml}]</span>`;
}

function normalizeRelatedLinkGroupsForDisplay(groups){
  // FIX[HADO-2.8.8.4-RELATED-GROUP-MERGE]:
  // 2.8.8.3の6分類化で、派生JSON経路とHTML側再分類経路が同じ表示タイトル
  // （例：自部隊耐性強化）を複数グループとして返すケースが発生した。
  // 関連リンク表示直前で category + title 単位に統合し、同名リンクも重複排除する。
  if(!Array.isArray(groups)||!groups.length)return [];
  const map=new Map();
  const order=[];
  for(const rawGroup of groups){
    if(!rawGroup)continue;
    const category=norm(rawGroup.category||'');
    const title=norm(rawGroup.title||'');
    if(!category&&!title)continue;
    const key=`${category}@@${title}`;
    if(!map.has(key)){
      map.set(key,{...rawGroup,category:rawGroup.category||category,title:rawGroup.title||title,names:[]});
      order.push(key);
    }
    const group=map.get(key);
    const seen=new Set((group.names||[]).map(v=>norm(v)));
    for(const name of Array.isArray(rawGroup.names)?rawGroup.names:[]){
      const n=norm(name);
      if(!n||seen.has(n))continue;
      group.names.push(name);
      seen.add(n);
    }
  }
  const merged=order.map(k=>map.get(k)).filter(g=>Array.isArray(g.names)&&g.names.length);
  const duplicates=(Array.isArray(groups)?groups:[]).length-merged.length;
  if(duplicates>0){
    debugLog('relatedLinks:merge-duplicate-groups',{before:groups.length,after:merged.length,mergedDuplicates:duplicates,groups:summarizeRelatedLinkGroups(merged),policy:'同一category/titleの関連リンクグループは表示前に1つへ統合する。'});
  }
  return merged;
}
function buildRelatedLinksHtmlFromGroups(groups){groups=normalizeRelatedLinkGroupsForDisplay(groups);if(!Array.isArray(groups)||!groups.length)return '';const blocks=groups.map(group=>{const isCountermeasure=isCountermeasureRelatedGroupTitle(group.title);const namesHtml=group.names.map(owner=>{if(isCountermeasure||isCountermeasureRelatedDisplayLabel(owner))return renderCountermeasureRelatedLabelHtml(owner);const linkName=group.category==='statusEffects'?(resolveStatusEffectRelatedLinkTargetName(owner)||owner):(group.category==='skills'?relatedSkillTargetNameForDisplay(owner):owner);if(group.category==='statusEffects'&&isSuppressedStatusEffectDetailLinkName(linkName))return esc(owner);return `<a href="#" class="detail-entity-link" data-category="${esc(group.category)}" data-name="${esc(linkName)}">${esc(owner)}</a>`;}).join(' / ');return `<div style="margin-bottom:8px"><strong>${esc(group.title)}：</strong> ${namesHtml}</div>`;});return `<div class="general-card related-links-card no-detail-linkify" style="box-shadow:none"><div class="general-card-header">関連リンク</div><div class="general-card-body"><div class="general-text">${blocks.join('')}</div></div></div>`;}
function buildRelatedLinksHtml(item){const groups=getRelatedLinkGroupsForItem(item);return buildRelatedLinksHtmlFromGroups(groups);}
function isTrustedRelatedLinkIndexForItem(item){
  const bundle=getRelatedLinkIndexBundle();
  const meta=bundle.meta||{};
  const audit=bundle.audit||{};
  const regression=audit.representativeRegression||{};
  const legacy=audit.legacyEquivalence||{};
  const sourceRisk=audit.sourceRisk||{};
  const fullAudit=audit.fullGeneralStatusEffectAudit||{};
  const coverageAudit=audit.coverageAudit||{};
  const coverageOk=boolishTrue(coverageAudit.ok)&&!numberish(coverageAudit.missingCount)&&numberish(coverageAudit.statusEffectIndexedCount)>=numberish(coverageAudit.statusEffectExpectedCount);
  const crawlerVersions=state.diagnostics?.derivedJsonIntegrity?.crawlerVersions||[];
  const crawlerVersion=norm(meta.crawlerVersion||crawlerVersions[0]||'');
  const dataSetId=norm(meta.dataSetId||meta.datasetId||state.diagnostics?.derivedJsonIntegrity?.dataSetIds?.[0]||'');
  const hasItems=!!(bundle.available&&bundle.items&&bundle.items.length);
  const riskOk=!numberish(sourceRisk.parameterSummaryStatusCount)
    &&!numberish(sourceRisk.textScanStatusCount)
    &&!numberish(sourceRisk.representativeCorrectionCount)
    &&!numberish(sourceRisk.fullGeneralStatusMissingAfterCount);
  const fullOk=boolishTrue(fullAudit.ok)&&!numberish(fullAudit.missingAfterTotal)&&!numberish(fullAudit.ngAfterGeneralCount);
  const representativeOk=boolishTrue(regression.ok)&&boolishTrue(legacy.ok)&&riskOk;
  const crawlerOk=compareVersionAtLeast(crawlerVersion,'1.0.4.30');
  const trusted=!!(hasItems&&crawlerOk&&coverageOk&&riskOk&&(fullOk||representativeOk));
  let reason='trusted';
  if(!trusted){
    if(!hasItems)reason='related-link-index-empty';
    else if(!crawlerOk)reason='crawler-version-too-old';
    else if(!coverageOk)reason='related-link-index-coverage-ng';
    else if(!riskOk)reason='source-risk-not-cleared';
    else if(!fullOk&&!representativeOk)reason='full-general-status-audit-ng';
    else reason='trust-condition-ng';
  }
  state.diagnostics.relatedLinkTrust={trusted,reason,crawlerVersion,dataSetId,representativeRegression:regression,legacyEquivalence:legacy,sourceRisk,coverageAudit,fullGeneralStatusEffectAudit:fullAudit,qualityAuditSource:audit===meta.qualityAudit?'meta':'root-or-hoisted',itemCount:bundle.items?bundle.items.length:0,policy:'HADO-2.9.0.37: related_link_indexはcoverageAudit.ok=true、missingCount=0、状態変化索引件数充足、既存品質監査OKを正本利用条件にする。'};
  return trusted;
}


// FIX[HADO-2.9.0.14-CRAWLER-OWNED-COUNTERMEASURE]:
// 監査OKのrelated_link_indexでは、アプリ側で自部隊不利対策を再生成しない。
// 自部隊不利対策・戦法由来[戦法]・専用名宝除外はクローラー生成JSONを正本とする。
function safeBuildRelatedLinksHtml(item,categoryKey,name){
  const category=categoryKey||detailCategory(item);
  const itemName=name||getItemDisplayName(item);
  const profiler=createDetailStageProfiler({scope:'safeBuildRelatedLinksHtml',category,item:itemName});
  try{
    const cacheKey=profiler.wrap('getRelatedLinksCacheKey',()=>getRelatedLinksCacheKey(item,category,itemName));
    if(!state._relatedLinksCache)state._relatedLinksCache=new Map();
    const cache=state._relatedLinksCache;
    const hasCache=cache.has(cacheKey);profiler.mark('cache.check',{cacheHit:hasCache,cacheKey});
    if(hasCache){const cached=cache.get(cacheKey);const profile=profiler.finish({cacheHit:true,cacheKey});const detail={...(cached.detail||{}),cacheHit:true,cacheKey,source:cached.source||'cache',profile};if(!state.diagnostics)state.diagnostics={};state.diagnostics.relatedLinks=detail;delete state.diagnostics.relatedLinksError;debugLog('relatedLinks:cache-hit',detail);return cached.html||'';}
    debugLog('relatedLinks:build-start',{category,name:itemName,cacheKey});
    let groups=null;let source='related-link-index-required';let derivedInfo=null;
    const trustedIndex=profiler.wrap('isTrustedRelatedLinkIndexForItem',()=>isTrustedRelatedLinkIndexForItem(item));
    if(!trustedIndex)throw new Error('hadou_related_link_index.json の品質監査がNGです。最新クローラーで生成したJSON一式を再読込してください。');
    const indexed=profiler.wrap('getDerivedRelatedLinkIndexGroupsForItem',()=>getDerivedRelatedLinkIndexGroupsForItem(item,{trustedIndex:true}),r=>({hasGroups:!!(r&&Array.isArray(r.groups)),groupCount:Array.isArray(r?.groups)?r.groups.length:0,source:r?.source||''}));
    if(!(indexed&&Array.isArray(indexed.groups)))throw new Error('hadou_related_link_index.json に対象データの関連リンク索引がありません。最新クローラーで生成したJSON一式を再読込してください。');
    groups=indexed.groups;source=indexed.source||'related-link-index-required';derivedInfo={trustedIndex:true,usedRelatedLinkIndex:true,usedFastParameterStatus:!!indexed.usedFastParameterStatus,usedEffectSourceWhitelist:!!indexed.usedEffectSourceWhitelist,policy:'HADO-2.9.0.34: related_link_indexを表示正本として必須利用する。監査NG・欠損時にアプリ側で関連リンクを再生成しない。'};
    profiler.mark('countermeasureRelatedGroups.skipped',{reason:'crawler-generated-related-link-index-is-source-of-truth'});
    groups=profiler.wrap('normalizeRelatedLinkGroupsForDisplay',()=>normalizeRelatedLinkGroupsForDisplay(groups),r=>({groupCount:Array.isArray(r)?r.length:0}));
    const summary=profiler.wrap('summarizeRelatedLinkGroups',()=>summarizeRelatedLinkGroups(groups),r=>({groupCount:Array.isArray(r)?r.length:0}));
    const html=profiler.wrap('buildRelatedLinksHtmlFromGroups',()=>buildRelatedLinksHtmlFromGroups(groups),r=>({htmlLength:String(r||'').length}));
    const profile=profiler.finish({cacheHit:false,cacheKey,source,groupCount:Array.isArray(groups)?groups.length:0,htmlLength:String(html||'').length});
    const detail={category,name:itemName,groupCount:Array.isArray(groups)?groups.length:0,groups:summary,htmlLength:String(html||'').length,emptyReason:Array.isArray(groups)&&groups.length?'':'no-related-groups',source,cacheHit:false,cacheKey,derivedInfo,profile};
    if(!state.diagnostics)state.diagnostics={};state.diagnostics.relatedLinks=detail;delete state.diagnostics.relatedLinksError;cache.set(cacheKey,{html,detail,source,createdAt:Date.now()});debugLog('relatedLinks:build-end',detail);return html;
  }catch(err){const profile=profiler.finish({error:String(err?.message||err)});const detail={category,name:itemName,message:err?.message||String(err),stack:String(err?.stack||'').slice(0,1000),profile,policy:'HADO-2.9.0.34: 関連リンク正本JSONの異常をアプリ側で補完・非表示化しない。診断ログと画面へ明示する。'};debugLog('relatedLinks:build-error',detail);if(!state.diagnostics)state.diagnostics={};state.diagnostics.relatedLinks={category:detail.category,name:detail.name,groupCount:0,groups:[],htmlLength:0,emptyReason:'required-related-link-index-error',errorMessage:detail.message,profile};state.diagnostics.relatedLinksError=detail;return `<section class="related-link-required-error"><h3>関連リンクJSONエラー</h3><p class="meta">${esc(detail.message)}</p><p class="meta">最新クローラーで生成したJSON一式を再読込してください。アプリ側で関連リンクを補完しません。</p></section>`;}
}
function renderSkillDetailRelatedLinks(item){const html=safeBuildRelatedLinksHtml(item,'skills',getItemDisplayName(item));debugLog('skillDetail:related-links',{name:getItemDisplayName(item),htmlLength:String(html||'').length,diagnostics:state.diagnostics?.relatedLinks||{},error:state.diagnostics?.relatedLinksError||null,policy:'2.5.6.16: 技能カテゴリの関連リンクはタグ直下の共通位置へ移動。本文参照技能も自己以外は表示する'});return html;}
function findFirstTableValue(item,keys){const keySet=new Set((Array.isArray(keys)?keys:[keys]).map(norm));for(const table of Array.isArray(item?.tables)?item.tables:[]){for(const row of getTableRows(table)){if(Array.isArray(row)&&row.length>=2&&keySet.has(norm(row[0]))){const val=norm(row[1]);if(val)return val;}}}for(const [k,v] of Array.isArray(item?.keyValues)?item.keyValues:[]){if(keySet.has(norm(k))){const val=norm(v);if(val)return val;}}return '';}
function findFirstPairValueInRows(rows,keys){const keySet=new Set((Array.isArray(keys)?keys:[keys]).map(norm));for(const row of Array.isArray(rows)?rows:[]){if(Array.isArray(row)&&row.length>=2&&keySet.has(norm(row[0]))){const val=norm(row[1]);if(val)return val;}}return '';}
function isAllowedSearchTag(tag){const t=norm(tag);if(!t)return false;if(t.startsWith('兵科:'))return ['兵科:騎兵','兵科:歩兵','兵科:弓兵'].includes(t);if(t==='種類:normal'||t==='種類:famous')return false;return true;}
function isAllowedSearchResultBadge(value){const v=norm(value);return !!v&&!['列伝','騎兵歩兵弓兵','SSR：弓兵UR：騎兵歩兵弓兵','normal','famous'].includes(v);}
function splitTagValues(key,value){const v=norm(value);if(!v)return [];if(key==='兵科'){const parts=v.match(/騎兵|歩兵|弓兵/g)||[];return [...new Set(parts)].map(x=>`${key}:${x}`);}return [`${key}:${v}`].filter(isAllowedSearchTag);}
function retagValues(newKey,value,oldKey=newKey){return splitTagValues(oldKey,value).map(tag=>{const p=tag.indexOf(':');const val=p>=0?tag.slice(p+1):tag;return `${newKey}:${val}`;});}
function extractGeneralDetailTags(item){const rows=getGeneralBasicInfoRows(item);const tags=[];[['兵科',['兵科']],['性別',['性別']],['天賦',['天賦']],['おすすめ編成',['おすすめ編成','おすすめ編制']]].forEach(([label,keys])=>{splitTagValues(label,findFirstPairValueInRows(rows,keys)).forEach(t=>tags.push(t));});debugLog('detailTags:extractGeneral',{name:getItemDisplayName(item),rows:rows.slice(0,12),tags});return tags;}
function extractEquipmentDetailTags(item){const basicTable=(Array.isArray(item?.tables)&&Array.isArray(item.tables[0]))?item.tables[0]:[];const rows=flattenPairRows(basicTable);const tags=[];[['最高レア',['最高レア']],['装備種類',['種類']],['兵科',['兵科']]].forEach(([label,keys])=>{const v=findFirstPairValueInRows(rows,keys);(label==='装備種類'?retagValues(label,v,'種類'):splitTagValues(label,v)).forEach(t=>tags.push(t));});debugLog('detailTags:extractEquipment',{name:getItemDisplayName(item),rows:rows.slice(0,12),tags});return tags;}
function extractStatusEffectDetailTags(item){const v=norm(item?.effectType||findFirstTableValue(item,'種類'));return v?[`状態変化種類:${v}`]:[];}
function extractSkillDetailTags(item){const name=getItemDisplayName(item);const idx=state.lookupIndexes||{};const hasGeneral=getOwnersFromMap(idx.generalSkillNames,name).length>0||!!norm(item?.sourceGeneral||item?.raw?.sourceGeneral||'');const hasEquipment=getOwnersFromMap(idx.equipmentSkillNames,name).length>0||!!norm(item?.sourceEquipment||item?.raw?.sourceEquipment||'');if(hasGeneral)return ['技能種類:武将技能'];if(hasEquipment)return ['技能種類:装備技能'];return ['技能種類:関連なし'];}
function extractSiegeWeaponDetailTags(item){const tags=[];splitTagValues('兵科',item?.troopType||'').forEach(t=>tags.push(t));tags.push('兵器種類:兵器');return tags;}
function extractEthnicArmamentDetailTags(item){const tags=[];splitTagValues('異民族',item?.ethnicGroup||'').forEach(t=>tags.push(t));splitTagValues('兵科',item?.troopType||'').forEach(t=>tags.push(t));tags.push('武装種類:武装');return tags;}
function getSearchTagsForItem(item){const category=detailCategory(item);const tags=[];if(category==='generals')tags.push(...extractGeneralDetailTags(item));else if(category==='equipments')tags.push(...extractEquipmentDetailTags(item));else if(category==='statusEffects')tags.push(...extractStatusEffectDetailTags(item));else if(category==='skills')tags.push(...extractSkillDetailTags(item));else if(category==='siegeWeapons')tags.push(...extractSiegeWeaponDetailTags(item));else if(category==='ethnicArmaments')tags.push(...extractEthnicArmamentDetailTags(item));return [...new Set(tags.map(norm).filter(Boolean).filter(isAllowedSearchTag))];}
function buildDetailTagsHtml(item){const tags=getSearchTagsForItem(item);debugLog('detailTags:render',{category:detailCategory(item),name:getItemDisplayName(item),tags});return `<div>${tags.map(t=>`<span class="badge">${esc(t)}</span>`).join('')}</div>`;}
function buildSearchTagIndex(){const all=[...state.generals,...state.tactics,...state.skills,...state.equipments,...state.statusEffects,...state.siegeWeapons,...state.ethnicArmaments,...state.ethnicResearchSkills,...state.formationMasters,...state.fiveElements,...state.warhorses,...state.warhorseSkills];if(applyDerivedTagIndexToItems(all)){debugLog('tagSearch:indexBuilt',{source:'hadou_tag_index.json',totalTags:state.availableTags.length,keys:Object.keys(state.availableTagsByKey),sample:state.availableTags.slice(0,20),diagnostic:state.diagnostics.tagIndex});renderTagSearchControls();return;}const tagSet=new Set();const byKey={};all.forEach(item=>{const tags=getSearchTagsForItem(item);item._detailTags=tags;tags.forEach(tag=>{tagSet.add(tag);const p=tag.indexOf(':');const key=p>=0?tag.slice(0,p):'その他';if(!byKey[key])byKey[key]=new Set();byKey[key].add(tag);});});state.availableTags=[...tagSet].sort((a,b)=>a.localeCompare(b,'ja'));state.availableTagsByKey=Object.fromEntries(Object.entries(byKey).map(([k,set])=>[k,[...set].sort((a,b)=>a.localeCompare(b,'ja'))]));state.selectedTags=(state.selectedTags||[]).filter(t=>tagSet.has(t));debugLog('tagSearch:indexBuilt',{source:'runtime',totalTags:state.availableTags.length,keys:Object.keys(state.availableTagsByKey),sample:state.availableTags.slice(0,20)});renderTagSearchControls();}
function tagMatchesInput(tag,input){const q=norm(input).toLowerCase();if(!q)return true;return norm(tag).toLowerCase().includes(q);}
function getTagGroupKey(tag){const t=norm(tag);const p=t.indexOf(':');return p>=0?norm(t.slice(0,p)):`その他:${t}`;}
function getTagValueLabel(tag){const t=norm(tag);const p=t.indexOf(':');return p>=0?norm(t.slice(p+1)):t;}
function groupTagsByKey(tags){const groups=new Map();(Array.isArray(tags)?tags:[]).map(norm).filter(Boolean).forEach(tag=>{const key=getTagGroupKey(tag);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(tag);});return groups;}
function displayTagGroupKey(key){const k=norm(key);return k.startsWith('その他:')?'その他':k;}
function getSelectedTagGroupsDebug(){return [...groupTagsByKey(state.selectedTags||[]).entries()].map(([key,tags])=>({key:displayTagGroupKey(key),matchMode:'OR',tags:[...tags]}));}
function addSelectedTag(tag,reason=''){const t=norm(tag);if(!t)return;if(!state.availableTags.includes(t)){debugLog('tagSearch:add-missing',{tag:t,reason});return;}if(!state.selectedTags.includes(t))state.selectedTags.push(t);debugLog('tagSearch:selected',{reason,selectedTags:state.selectedTags,selectedTagGroups:getSelectedTagGroupsDebug(),groupRelation:'AND'});renderTagSearchControls();renderSearchResults();renderDetail();pushOperationHistory('tag-search');}
function removeSelectedTag(tag,reason=''){const t=norm(tag);state.selectedTags=(state.selectedTags||[]).filter(v=>v!==t);debugLog('tagSearch:selected',{reason,selectedTags:state.selectedTags,selectedTagGroups:getSelectedTagGroupsDebug(),groupRelation:'AND'});renderTagSearchControls();renderSearchResults();renderDetail();pushOperationHistory('tag-remove');}
function clearSelectedTags(reason=''){state.selectedTags=[];if(els.tagSearchInput)els.tagSearchInput.value='';debugLog('tagSearch:selected',{reason,selectedTags:state.selectedTags,selectedTagGroups:[],groupRelation:'AND'});renderTagSearchControls();renderSearchResults();renderDetail();pushOperationHistory('tag-clear');}
function renderSelectedTags(){if(!els.selectedTagList)return;const tags=state.selectedTags||[];els.selectedTagList.innerHTML='';if(!tags.length){els.selectedTagList.innerHTML='<span class="tag-search-note">タグ未指定</span>';return;}groupTagsByKey(tags).forEach((groupTags,key)=>{const group=document.createElement('span');group.className='selected-tag-group';const label=document.createElement('span');label.className='selected-tag-group-label';label.textContent=displayTagGroupKey(key)+'：';group.appendChild(label);groupTags.forEach(tag=>{const span=document.createElement('span');span.className='selected-tag-badge';span.textContent=getTagValueLabel(tag);const btn=document.createElement('button');btn.type='button';btn.className='selected-tag-remove';btn.textContent='×';btn.setAttribute('aria-label',tag+' を解除');btn.addEventListener('click',()=>removeSelectedTag(tag,'badge'));span.appendChild(btn);group.appendChild(span);});els.selectedTagList.appendChild(group);});}
function renderTagCandidates(){if(!els.tagSearchCandidates)return;els.tagSearchCandidates.innerHTML='';const q=els.tagSearchInput?els.tagSearchInput.value:'';state.availableTags.filter(tag=>tagMatchesInput(tag,q)).slice(0,80).forEach(tag=>{const opt=document.createElement('option');opt.value=tag;els.tagSearchCandidates.appendChild(opt);});}
function renderTagPickerPanel(){if(!els.tagPickerPanel)return;els.tagPickerPanel.classList.toggle('is-visible',!!state.tagPickerVisible);els.tagPickerPanel.innerHTML='';if(!state.tagPickerVisible)return;const TAG_KEY_DISPLAY_ORDER=['兵科','性別','天賦','最高レア','おすすめ編成','装備種類','技能種類','状態変化種類','兵器種類','武装種類','異民族'];const keys=Object.keys(state.availableTagsByKey||{}).sort((a,b)=>{const ai=TAG_KEY_DISPLAY_ORDER.indexOf(a);const bi=TAG_KEY_DISPLAY_ORDER.indexOf(b);if(ai!==-1||bi!==-1){if(ai===-1)return 1;if(bi===-1)return -1;if(ai!==bi)return ai-bi;}return a.localeCompare(b,'ja');});if(!keys.length){els.tagPickerPanel.innerHTML='<div class="tag-search-note">タグ候補なし</div>';return;}keys.forEach(key=>{const group=document.createElement('div');group.className='tag-picker-group';const title=document.createElement('div');title.className='tag-picker-title';title.textContent=key+'（グループ内OR）';const options=document.createElement('div');options.className='tag-picker-options';(state.availableTagsByKey[key]||[]).forEach(tag=>{const label=document.createElement('label');label.className='tag-picker-option';const cb=document.createElement('input');cb.type='checkbox';cb.value=tag;cb.checked=(state.selectedTags||[]).includes(tag);cb.addEventListener('change',()=>{if(cb.checked)addSelectedTag(tag,'picker');else removeSelectedTag(tag,'picker');});label.appendChild(cb);label.appendChild(document.createTextNode(tag));options.appendChild(label);});group.appendChild(title);group.appendChild(options);els.tagPickerPanel.appendChild(group);});}
function renderTagSearchControls(){renderTagCandidates();renderSelectedTags();renderTagPickerPanel();}
function matchesSelectedTags(item){const selected=state.selectedTags||[];if(!selected.length)return true;const tags=new Set((item?._detailTags||getSearchTagsForItem(item)).map(norm).filter(Boolean));return [...groupTagsByKey(selected).values()].every(groupTags=>groupTags.some(tag=>tags.has(tag)));}
function getSelectedResultSelectRow(){if(!els.resultSelect)return null;const idx=Number(els.resultSelect.value);return Number.isFinite(idx)?state.lastResultRows[idx]:null;}
function syncMobileResultFavoriteButton(context=''){const btn=els.mobileResultFavoriteBtn;if(!btn)return;const row=getSelectedResultSelectRow();const category=row?.key||'';const name=norm(row?.item?.name||row?.item?.title||'');const enabled=!!(row&&(category==='generals'||category==='equipments')&&name);const saved=enabled&&isSavedName(category,name);btn.disabled=!enabled;btn.textContent=saved?'★':'☆';btn.classList.toggle('is-saved',!!saved);btn.title=enabled?(saved?'お気に入り解除':'お気に入り登録'):'武将・装備のみお気に入り登録できます';debugLog('mobileResultFavorite:sync',{context,category,name,enabled,saved});}
function toggleMobileResultFavorite(){const row=getSelectedResultSelectRow();const category=row?.key||'';const name=norm(row?.item?.name||row?.item?.title||'');if(!(category==='generals'||category==='equipments')||!name)return;const beforeSaved=isSavedName(category,name);toggleSavedName(category,name);const afterSaved=isSavedName(category,name);debugLog('mobileResultFavorite:toggle',{category,name,beforeSaved,afterSaved});syncMobileResultFavoriteButton('toggle');}
function syncMobileSearchHistoryDeleteButton(){if(!els.mobileDeleteSearchHistoryBtn)return;const keyword=state.mobileSelectedSearchHistory||els.mobileSearchHistorySelect?.value||'';els.mobileDeleteSearchHistoryBtn.disabled=!keyword;}
function deleteMobileSelectedSearchHistory(){const keyword=norm(state.mobileSelectedSearchHistory||els.mobileSearchHistorySelect?.value||'');if(!keyword)return;const beforeCount=(state.searchHistory||[]).length;state.searchHistory=(state.searchHistory||[]).filter(v=>v!==keyword);state.mobileSelectedSearchHistory='';persistSearchHistory();renderSearchHistory();syncMobileSearchHistoryDeleteButton();debugLog('mobileSearchHistory:delete',{keyword,beforeCount,afterCount:(state.searchHistory||[]).length});}
function applyDetailTableColumnWidth(){if(!els.detail)return;const width=Math.max(20,Math.min(45,Number(state.detailLabelWidth)||25));els.detail.style.setProperty('--detail-label-col-width',`${width}%`);const label=document.getElementById('detailLabelWidthValue');if(label)label.textContent=`${width}%`;}
function markDetailTwoColumnTables(){if(!els.detail)return;els.detail.querySelectorAll('table').forEach(table=>{const rows=Array.from(table.rows||[]);if(rows.length&&rows.every(row=>row.cells&&row.cells.length===2)){table.classList.add('detail-two-col');}});applyDetailTableColumnWidth();}

