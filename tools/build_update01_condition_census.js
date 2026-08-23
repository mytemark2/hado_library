'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'updates', '3.1.0.0', 'update01');
const CENSUS_FILE = path.join(OUT_DIR, 'condition-census.json');
const GOLD_FILE = path.join(OUT_DIR, 'condition-gold-set.json');

const SOURCES = {
  generals: 'hadou_generals.json',
  tactics: 'hadou_tactics.json',
  skills: 'hadou_skills.json',
  statusEffects: 'hadou_status_effects.json'
};

const TAXONOMY = [
  ['condition', 'placement_role', '配置役割', /主将|副将|補佐|侍従/],
  ['condition', 'formation_membership', '編制・部隊内構成', /編[制成]|部隊内|兵科一致/],
  ['condition', 'troop_type', '兵科', /歩兵|騎兵|弓兵|兵科/],
  ['condition', 'general_identity_set', '特定武将・武将集合', /武将のうち|(?:主将|副将|補佐|侍従)が[^、。]{1,30}(?:の場合|の際|いる|好相性)|司馬師|王元姫|鍾会|鄧艾|関羽|関興|関索|関銀屏|曹操|諸葛亮/],
  ['condition', 'affinity', '相性', /好相性|相性が良い|相性が有利|相性が不利/],
  ['condition', 'formation_stat_threshold', '編制時能力閾値', /編[制成]時点.*(?:攻撃|防御|知力|機動|兵力).*(?:以上|以下|未満)/],
  ['condition', 'component_state', '兵器・装備等の編成物', /兵器|装備品|武装|名馬|軍馬|五行/],
  ['condition', 'troop_threshold', '現在兵力', /(?:現在)?兵力.*(?:以上|以下|未満|高い|低い|多い|少ない|％|%)/],
  ['condition', 'stat_comparison', '能力比較', /(?:攻撃|防御|知力|機動|統率|政治).*(?:より|高い|低い|同値|比較)|より(?:高|低)?(?:攻撃|防御|知力|機動|統率|政治)/],
  ['condition', 'status_presence_count', '状態変化の有無・個数', /(?:強化|弱化|有利変化|不利変化|状態変化|闘気).*(?:数|個|付与されて|発生して|有無|ない場合)|既に発生している/],
  ['condition', 'skill_level', '技能Lv', /技能Lv|技能レベル|のLv/],
  ['condition', 'star_rank', '将星', /将星|★\d/],
  ['condition', 'count_threshold', '人数・部隊数・回数', /\d+人|人数|武将数|部隊数|(?:効果|状態変化)の数|\d+つ|\d+個|\d+回|\d+度/],
  ['condition', 'probability', '確率', /確率|発生率|付与率/],
  ['condition', 'target_relation', '対象・攻撃元との関係', /自部隊|敵部隊|味方|攻撃してきた|対象部隊/],
  ['condition', 'entity_state_relation', '個別状態・関係条件', /場合|の際|の時|なら|につき|ごと|応じ|まで|直前|健在|発生中|効果時間中/],
  ['trigger', 'sortie', '出陣', /出陣/],
  ['trigger', 'engagement_start', '交戦開始', /交戦開始/],
  ['trigger', 'tactic_activation', '戦法発動', /戦法.*発動|戦法発動/],
  ['trigger', 'normal_attack', '通常攻撃', /通常攻撃/],
  ['trigger', 'pre_attack_or_hit', '被攻撃・攻撃直前', /攻撃を受け|攻撃され|受ける直前|攻撃直前/],
  ['trigger', 'critical_hit', '会心・撃心', /会心|撃心/],
  ['trigger', 'siege_action', '兵器行動', /兵器行動|兵器攻撃/],
  ['trigger', 'status_change', '状態変化の付与・解除', /付与される際|解除された|打ち消した|奪取した/],
  ['trigger', 'damage_event', 'ダメージイベント', /ダメージを与え|ダメージを受け/],
  ['trigger', 'custom_event', 'その他の明示イベント', /(?:した|する|された|される|受けた|与えた|なる|なった)(?:時|際|たび)|ごと/],
  ['context', 'always', '常時', /常に/],
  ['context', 'appointment', '任命・非戦闘', /任命時|任命効果|参軍府|軍事府|文化府|製鉄所|交易所|倉庫/],
  ['modifier', 'multiplier', '倍率変更', /\d+(?:\.\d+)?倍|×\d|効果量.*倍/],
  ['modifier', 'stat_scaling', '能力比例', /(?:統率|武力|知力|政治|魅力)の?\d+(?:\.\d+)?[%％].*(?:加算|上昇)/],
  ['modifier', 'override_fixed', '固定値・上書き', /固定|にして|上書き|置き換/],
  ['modifier', 'additive', '加算・上乗せ・合算', /加算|上乗せ|合算|追加/],
  ['modifier', 'cap_floor', '上限・下限', /上限|下限|最大|最小|未満は切り捨て/],
  ['modifier', 'conditional_adjustment', '条件付き調整', /→|効果が|効果量|威力を|確率[+＋]|付与率[+＋]/],
  ['limit', 'activation_count', '発動回数制限', /\d+回まで|\d+度まで|につき\d+回|初回|最初の/],
  ['limit', 'duration', '期間・効果時間', /\d+秒|効果時間|一定時間|まで/],
  ['limit', 'upper_lower_bound', '数値上限・下限', /上限|下限|最大\d|最低\d|以上|以下|未満/],
  ['reset', 'cumulative', '累積', /累積|重ね|加算した状態/],
  ['reset', 'reset_or_expire', 'リセット・終了', /リセット|解除|終了|消滅|なくなる/],
  ['suppression', 'activation_suppression', '発動抑止', /発動しない|発生しない|発揮されない|無効化|連鎖不能/],
  ['suppression', 'exception', '例外', /除く|例外|ただし|の場合は効果なし|適用しない/],
  ['suppression', 'ignore_or_avoid', '無視・回避', /無視|避ける|回避/],
  ['targeting', 'priority', '対象優先', /優先して対象|対象を優先|優先的/],
  ['targeting', 'target_count', '対象数', /対象部隊数|味方\d+部隊|敵\d+部隊|自身\d+部隊/]
].map(([group, id, label, pattern]) => ({ group, id, label, pattern }));

const GOLD_SPECS = [
  ['yuan-main-double', 'LR袁紹', 'この武将が主将の場合、魁威の効果量が2倍', ['condition.placement_role', 'modifier.multiplier']],
  ['yuan-troops-50', 'LR袁紹', '現在兵力が50％以上の場合、威力を700％', ['condition.troop_threshold', 'modifier.conditional_adjustment']],
  ['yuan-base-250-override-700', 'LR袁紹', '250％の攻撃', ['modifier.override_fixed']],
  ['yuan-kaii-25-to-50', 'LR袁紹', '25％の魁威を付与', ['condition.placement_role', 'modifier.multiplier']],
  ['yuan-50-to-100', 'LR袁紹', '効果量が2倍（100％）', ['condition.placement_role', 'modifier.multiplier']],
  ['maliang-affinity', 'LR馬良', '主将と自身が好相性の際', ['condition.placement_role', 'condition.affinity']],
  ['maliang-politics-ratio', 'LR馬良', '自身の政治の20%', ['modifier.stat_scaling', 'modifier.additive']],
  ['maliang-intelligence-compare', 'LR馬良', '自部隊より低知力の敵部隊', ['condition.stat_comparison']],
  ['maliang-existing-effect-sum', 'LR馬良', '既に発生している有利激攻', ['condition.status_presence_count', 'modifier.additive']],
  ['maliang-vice1-trigger', 'LR馬良', '副将1の戦法発動時', ['trigger.tactic_activation']],
  ['maliang-vice2-trigger', 'LR馬良', '副将2の戦法発動時', ['trigger.tactic_activation']],
  ['maliang-appointment', 'LR馬良', '軍事府に任命時', ['context.appointment']],
  ['guanping-named-generals', 'LR関平', '関羽/関興/関索/関銀屏', ['condition.general_identity_set']],
  ['guanping-cavalry', 'LR関平', '自部隊が騎兵の場合', ['condition.troop_type']],
  ['guanping-first-tactic', 'LR関平', '最初の戦法発動まで', ['limit.activation_count', 'limit.duration']],
  ['guanping-buff-count', 'LR関平', '強化効果の数×5％', ['condition.status_presence_count', 'condition.count_threshold']],
  ['guanping-enemy-attack-compare', 'LR関平', '自部隊より攻撃の低い敵部隊', ['condition.stat_comparison']],
  ['guanping-critical-trigger', 'LR関平', '会心攻撃でダメージを与えた時', ['trigger.critical_hit', 'trigger.damage_event']],
  ['sun-formation-defense', 'LR孫堅・盾兵', '編制時点の自部隊の防御が2750以上', ['condition.formation_stat_threshold']],
  ['sun-troops-50', 'LR孫堅・盾兵', '兵力が50%以上の時', ['condition.troop_threshold']],
  ['sun-base-power-fixed', 'LR孫堅・盾兵', '通常攻撃の基礎威力を50%に固定', ['modifier.override_fixed']],
  ['sun-target-priority', 'LR孫堅・盾兵', '優先して対象となる', ['targeting.priority']],
  ['simazhao-named-set', 'LR司馬昭', '司馬師/王元姫/鍾会/鄧艾のうち1人以上', ['condition.general_identity_set', 'condition.count_threshold']],
  ['simazhao-enemy-affinity', 'LR司馬昭', '敵部隊の主将と諸葛亮の相性が良い場合', ['condition.affinity']],
  ['simazhao-before-normal-attack', 'LR司馬昭', '通常攻撃を受ける直前', ['trigger.pre_attack_or_hit']],
  ['simazhao-before-tactic-attack', 'LR司馬昭', '戦法攻撃を受ける直前', ['trigger.pre_attack_or_hit']],
  ['simazhao-insulation-suppression', 'LR司馬昭', '絶縁」により攻撃の発生が無効化されている場合', ['suppression.activation_suppression']],
  ['huang-component-alive', 'LR黄月英', '兵器を編制して健在の時', ['condition.component_state']],
  ['huang-siege-action', 'LR黄月英', '兵器行動時', ['trigger.siege_action']],
  ['huang-affinity-count', 'LR黄月英', '好相性の武将数×3％', ['condition.affinity', 'condition.count_threshold']],
  ['huang-intelligence-compare', 'LR黄月英', '自部隊の知力が敵より高い場合', ['condition.stat_comparison']],
  ['cross-skill-level', null, '技能Lv+1', ['condition.skill_level']],
  ['cross-star-rank', null, '将星ランクに応じて', ['condition.star_rank']],
  ['cross-sortie', null, '▼出陣時', ['trigger.sortie']],
  ['cross-engagement', null, '▼交戦開始時', ['trigger.engagement_start']],
  ['cross-count-limit', null, '1度の通常攻撃につき1回まで', ['limit.activation_count']],
  ['cross-duration', null, '効果時間+10秒', ['limit.duration']],
  ['cross-cumulative', null, '累積して上昇', ['reset.cumulative']],
  ['cross-probability', null, '50％の確率', ['condition.probability']],
  ['cross-suppression', null, '発揮されない', ['suppression.activation_suppression']],
  ['cross-exception', null, '場合は効果なし', ['suppression.exception']],
  ['status-periodic', '治癒', '一定時間ごと', ['condition.entity_state_relation']],
  ['status-condition-count', '豪昇', '強化効果の数', ['condition.status_presence_count']],
  ['status-troops-threshold', '闘気', '兵力が50％以上', ['condition.troop_threshold']]
].map(([id, entityContains, needle, requiredTags]) => ({ id, entityContains, needle, requiredTags }));

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n')).digest('hex');
}

function clean(value) {
  return String(value ?? '').replace(/\u00a0/g, ' ').replace(/[\t\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function displayName(category, item) {
  const raw = clean(item.displayName || item.name || item.title || `unnamed-${category}`);
  return raw.replace(/^【三國志 覇道】/, '').replace(/の戦法と技能$/, '').replace(/の効果と所持武将・強化する装備品$/, '').trim();
}

function hasSemanticSignal(text) {
  return /[■▼●→※]|場合|の際|の時|以上|以下|未満|ごと|応じ|直前|発動時|行動時|効果時間中|健在/.test(text);
}

function sourceTexts(category, item) {
  const out = [];
  const add = (locator, value) => {
    const text = clean(value);
    if (text && text !== '-' && !out.some(row => row.text === text)) out.push({ locator, text });
  };
  if (category === 'generals') {
    (item.tables || []).forEach((table, tableIndex) => {
      let takeNextAsTacticEffect = false;
      (table.rows || []).forEach((row, rowIndex) => {
        const cells = Array.isArray(row) ? row.map(clean) : [];
        if (takeNextAsTacticEffect && cells.length) add(`table:${tableIndex}:row:${rowIndex}:tactic-effect`, cells.join(' '));
        takeNextAsTacticEffect = cells.length === 1 && cells[0] === '効果';
        cells.forEach((cell, cellIndex) => {
          if (/[■▼●→※]/.test(cell) || (cell.length >= 20 && hasSemanticSignal(cell))) {
            add(`table:${tableIndex}:row:${rowIndex}:cell:${cellIndex}`, cell);
          }
        });
      });
    });
  } else if (category === 'tactics') {
    add('description', item.description);
    (item.sections || []).forEach((section, sectionIndex) => {
      (section.content || []).forEach((value, contentIndex) => add(`section:${sectionIndex}:content:${contentIndex}`, value));
    });
  } else if (category === 'skills') {
    const firstTable = (item.tables || [])[0];
    (firstTable?.rows || []).forEach((row, rowIndex) => {
      const cells = Array.isArray(row) ? row : [];
      if (cells.length > 1) add(`table:0:row:${rowIndex}`, cells.slice(1).join(' '));
    });
    (item.sections || []).forEach((section, sectionIndex) => {
      if (!/レベル別効果/.test(clean(section.title))) return;
      (section.content || []).forEach((value, contentIndex) => add(`section:${sectionIndex}:content:${contentIndex}`, value));
    });
  } else if (category === 'statusEffects') {
    add('description', item.description);
  }
  return out;
}

function semanticUnits(text) {
  return clean(text)
    .replace(/([■▼●→※])/g, '\n$1')
    .split(/\n|(?<=[。！？])/u)
    .map(clean)
    .filter(value => value && !/^[-ー]+$/.test(value));
}

function classifyUnit(text, category) {
  const tags = [];
  for (const rule of TAXONOMY) if (rule.pattern.test(text)) tags.push(`${rule.group}.${rule.id}`);
  const marker = text[0] || '';
  let primaryRole = 'description';
  if (marker === '■') primaryRole = /常に/.test(text) ? 'context' : 'condition';
  else if (marker === '▼') primaryRole = tags.some(tag => tag.startsWith('trigger.')) ? 'trigger' : 'condition';
  else if (marker === '→') primaryRole = 'modifier';
  else if (marker === '●') primaryRole = /場合|の際|の時|なら|以上|以下|未満|ごと|応じ|まで|直前|発動時|行動時|付与される際/.test(text) ? 'conditionedEffect' : 'effect';
  else if (marker === '※') primaryRole = 'explanation';
  else if (tags.some(tag => tag.startsWith('trigger.'))) primaryRole = 'trigger';
  else if (tags.some(tag => tag.startsWith('condition.'))) primaryRole = /付与|上昇|低下|攻撃|回復|軽減|短縮|延長|無効|避け|固定/.test(text) ? 'conditionedEffect' : 'condition';
  else if (category === 'statusEffects') primaryRole = 'effectDescription';
  else if (/付与|上昇|低下|攻撃|回復|軽減|短縮|延長|無効|避け|固定|加算/.test(text)) primaryRole = 'effect';

  const semanticRoleNeedsTag = ['condition', 'conditionedEffect', 'trigger', 'modifier'].includes(primaryRole);
  if (semanticRoleNeedsTag && !tags.length) {
    if (primaryRole === 'trigger') tags.push('trigger.custom_event');
    else if (primaryRole === 'modifier') tags.push('modifier.conditional_adjustment');
    else tags.push('condition.entity_state_relation');
  }
  return { primaryRole, tags: [...new Set(tags)].sort() };
}

function buildRecords(datasets) {
  const records = [];
  for (const [category, data] of Object.entries(datasets)) {
    (data.items || []).forEach((item, sourceIndex) => {
      const name = displayName(category, item);
      const units = [];
      sourceTexts(category, item).forEach((part, partIndex) => {
        semanticUnits(part.text).forEach((text, unitIndex) => {
          const classified = classifyUnit(text, category);
          units.push({
            id: `${category}:${sourceIndex}:${partIndex}:${unitIndex}`,
            locator: part.locator,
            text,
            ...classified
          });
        });
      });
      const tagSet = [...new Set(units.flatMap(unit => unit.tags))].sort();
      records.push({
        id: `${category}:${sourceIndex}`,
        category,
        sourceIndex,
        name,
        sourceUrl: clean(item.url || item.source_url),
        unitCount: units.length,
        tags: tagSet,
        disposition: units.length ? 'semantic_units_scanned' : 'no_condition_language_in_structured_source',
        units
      });
    });
  }
  return records;
}

function buildGoldSet(records) {
  const items = GOLD_SPECS.map(spec => {
    const candidates = records.filter(record => !spec.entityContains || record.name.includes(spec.entityContains));
    let match = null;
    let owner = null;
    for (const record of candidates) {
      const found = record.units.find(unit => unit.text.includes(spec.needle));
      if (found) { match = found; owner = record; break; }
    }
    if (!match || !owner) throw new Error(`gold set source not found: ${spec.id} / ${spec.entityContains || '*'} / ${spec.needle}`);
    const missingTags = spec.requiredTags.filter(tag => !match.tags.includes(tag));
    if (missingTags.length) throw new Error(`gold set tag mismatch: ${spec.id}: ${missingTags.join(', ')} / ${match.tags.join(', ')}`);
    return {
      id: spec.id,
      category: owner.category,
      entity: owner.name,
      sourceRecordId: owner.id,
      sourceUnitId: match.id,
      sourceText: match.text,
      expectedSemanticTags: spec.requiredTags
    };
  });
  return {
    schemaVersion: 1,
    releaseVersion: '3.1.0.0',
    updateNo: '01',
    itemCount: items.length,
    items
  };
}

function buildExistingBlocksAudit(records) {
  const source = readJson('hadou_effect_condition_blocks.json');
  const indexed = new Map();
  (source.items || []).forEach(item => indexed.set(`${item.category}:${clean(item.name)}`, item));
  const categoryMap = { generals: 'generals', tactics: 'tactics', skills: 'skills', statusEffects: 'status_effects' };
  const missingRecords = [];
  const byCategory = {};
  for (const record of records) {
    const derivedCategory = categoryMap[record.category];
    byCategory[record.category] ||= { sourceRecords: 0, indexedRecords: 0, missingRecords: 0 };
    byCategory[record.category].sourceRecords++;
    const key = `${derivedCategory}:${record.name}`;
    if (indexed.has(key)) byCategory[record.category].indexedRecords++;
    else {
      byCategory[record.category].missingRecords++;
      missingRecords.push({ category: record.category, name: record.name, disposition: 'independently_scanned_by_update01' });
    }
  }
  const likelyMisclassifications = [];
  const ambiguousMarkerOnlyClassifications = [];
  let parentlessConditionCount = 0;
  for (const item of source.items || []) {
    for (const block of item.blocks || []) {
      const auditClass = classifyUnit(clean(block.sourceText), item.category);
      const hasConditionSemantics = ['condition', 'conditionedEffect', 'trigger', 'modifier'].includes(auditClass.primaryRole)
        && /場合|の際|の時|なら|以上|以下|未満|ごと|応じ|まで|直前|発動時|行動時|付与される際|^→|^▼|^■/.test(clean(block.sourceText));
      const reviewBase = { blockId: block.blockId, category: item.category, entity: item.name, currentType: block.blockType, suggestedRole: auditClass.primaryRole, tags: auditClass.tags, sourceText: block.sourceText };
      if (block.blockType === 'effect' && ['conditionedEffect', 'trigger'].includes(auditClass.primaryRole)) {
        likelyMisclassifications.push({ ...reviewBase, reason: 'inline_condition_or_trigger_is_classified_as_plain_effect' });
      } else if (block.blockType === 'condition' && auditClass.primaryRole === 'trigger') {
        likelyMisclassifications.push({ ...reviewBase, reason: 'trigger_is_collapsed_into_condition' });
      } else if (block.blockType === 'conditionedEffect' && auditClass.primaryRole === 'trigger') {
        likelyMisclassifications.push({ ...reviewBase, reason: 'trigger_is_collapsed_into_conditioned_effect' });
      } else if (block.blockType === 'conditionedEffect' && auditClass.primaryRole === 'condition') {
        likelyMisclassifications.push({ ...reviewBase, reason: 'condition_heading_is_collapsed_into_conditioned_effect' });
      } else if (block.blockType === 'conditionedEffect' && !hasConditionSemantics) {
        ambiguousMarkerOnlyClassifications.push({ ...reviewBase, reason: 'condition_marker_word_without_explicit_parent_link' });
      }
      if (block.blockType === 'condition') parentlessConditionCount++;
    }
  }
  return {
    sourceFile: 'hadou_effect_condition_blocks.json',
    sourceSha256: sha256File('hadou_effect_condition_blocks.json'),
    sourceItemCount: (source.items || []).length,
    sourceBlockCount: (source.items || []).reduce((sum, item) => sum + (item.blockCount || 0), 0),
    byCategory,
    missingRecordCount: missingRecords.length,
    missingRecords,
    likelyMisclassificationCount: likelyMisclassifications.length,
    likelyMisclassifications,
    ambiguousMarkerOnlyClassificationCount: ambiguousMarkerOnlyClassifications.length,
    ambiguousMarkerOnlyClassifications,
    conditionBlocksWithoutParentEffectLinkCount: parentlessConditionCount,
    reuseDecision: 'diagnostic_input_only',
    limitations: [
      'statusEffects are not included in the current generator category list.',
      'records without a marker-matched block are omitted instead of being retained with an explicit audited disposition.',
      'condition and following effect blocks have no parent-child identifier.',
      'conditionText is a marker list and cannot represent boolean grouping, trigger, context, override, limit, reset, suppression, or target priority.',
      'source extraction for generals covers skill tables but not the general-page tactic body as an independently traceable source.'
    ]
  };
}

function summarizeTaxonomy(records) {
  const allUnits = records.flatMap(record => record.units.map(unit => ({ ...unit, recordId: record.id, entity: record.name, category: record.category })));
  return TAXONOMY.map(rule => {
    const tag = `${rule.group}.${rule.id}`;
    const matches = allUnits.filter(unit => unit.tags.includes(tag));
    return {
      group: rule.group,
      id: rule.id,
      label: rule.label,
      unitCount: matches.length,
      examples: matches.slice(0, 3).map(unit => ({ category: unit.category, entity: unit.entity, sourceUnitId: unit.id, sourceText: unit.text }))
    };
  }).filter(row => row.unitCount > 0);
}

function compactRecord(record) {
  const roleCounts = {};
  record.units.forEach(unit => { roleCounts[unit.primaryRole] = (roleCounts[unit.primaryRole] || 0) + 1; });
  const unitDigest = crypto.createHash('sha256')
    .update(JSON.stringify(record.units.map(unit => [unit.locator, unit.text, unit.primaryRole, unit.tags])))
    .digest('hex');
  const { units, ...base } = record;
  return {
    ...base,
    conditionalUnitCount: units.filter(unit => ['condition', 'conditionedEffect', 'trigger', 'modifier'].includes(unit.primaryRole)).length,
    primaryRoleCounts: roleCounts,
    unitDigest
  };
}

function main() {
  const datasets = Object.fromEntries(Object.entries(SOURCES).map(([key, file]) => [key, readJson(file)]));
  const records = buildRecords(datasets);
  const units = records.flatMap(record => record.units);
  const semanticRoles = new Set(['condition', 'conditionedEffect', 'trigger', 'modifier']);
  const unresolved = units.filter(unit => (
    !unit.primaryRole
    || !Array.isArray(unit.tags)
    || (semanticRoles.has(unit.primaryRole) && unit.tags.length === 0)
  ));
  const sourceFiles = Object.fromEntries(Object.entries(SOURCES).map(([category, file]) => [category, {
    file,
    itemCount: datasets[category].items.length,
    sha256: sha256File(file)
  }]));
  const byCategory = Object.fromEntries(Object.keys(SOURCES).map(category => {
    const scoped = records.filter(record => record.category === category);
    return [category, {
      sourceRecords: datasets[category].items.length,
      scannedRecords: scoped.length,
      recordsWithSemanticUnits: scoped.filter(record => record.unitCount > 0).length,
      recordsWithoutConditionLanguage: scoped.filter(record => record.unitCount === 0).length,
      semanticUnitCount: scoped.reduce((sum, record) => sum + record.unitCount, 0)
    }];
  }));
  const census = {
    schemaVersion: 1,
    kind: 'update01_condition_census',
    releaseVersion: '3.1.0.0',
    updateNo: '01',
    sourceFiles,
    scanSummary: {
      sourceRecordCount: Object.values(sourceFiles).reduce((sum, row) => sum + row.itemCount, 0),
      scannedRecordCount: records.length,
      semanticUnitCount: units.length,
      classifiedUnitCount: units.length - unresolved.length,
      unresolvedUnitCount: unresolved.length,
      unscannedRecordCount: Object.values(sourceFiles).reduce((sum, row) => sum + row.itemCount, 0) - records.length,
      byCategory
    },
    taxonomy: summarizeTaxonomy(records),
    unresolvedUnits: unresolved,
    existingConditionBlocksAudit: buildExistingBlocksAudit(records),
    update02Requirements: [
      'Represent condition, trigger, context, modifier/base+override, limit/reset, suppression/exception, and target priority as separate typed fields.',
      'Preserve boolean grouping and parent-child links from every condition or trigger to the affected effect.',
      'Retain source record, locator, raw text, and source hash for traceability.',
      'Retain audited records with zero condition clauses instead of dropping them from the output.',
      'Include status-effect descriptions and both general-page tactic and skill bodies in the canonical generation path.',
      'Model base values and conditional overrides as one effect identity to prevent double counting.',
      'Fail generation when a semantic condition-like unit cannot be assigned to a registry type.',
      'Keep scoreEvidence unchanged until Update07 shadow comparison.'
    ],
    records: records.map(compactRecord)
  };
  const gold = buildGoldSet(records);
  if (census.scanSummary.sourceRecordCount !== census.scanSummary.scannedRecordCount) throw new Error('source/scanned record count mismatch');
  if (census.scanSummary.unscannedRecordCount !== 0 || census.scanSummary.unresolvedUnitCount !== 0) throw new Error('census has unresolved residuals');
  if (gold.itemCount < 40) throw new Error(`gold set too small: ${gold.itemCount}`);
  fs.writeFileSync(CENSUS_FILE, `${JSON.stringify(census, null, 2)}\n`);
  fs.writeFileSync(GOLD_FILE, `${JSON.stringify(gold, null, 2)}\n`);
  console.log(JSON.stringify({
    censusFile: path.relative(ROOT, CENSUS_FILE),
    goldFile: path.relative(ROOT, GOLD_FILE),
    sourceRecordCount: census.scanSummary.sourceRecordCount,
    scannedRecordCount: census.scanSummary.scannedRecordCount,
    semanticUnitCount: census.scanSummary.semanticUnitCount,
    unresolvedUnitCount: census.scanSummary.unresolvedUnitCount,
    missingCurrentConditionBlockRecords: census.existingConditionBlocksAudit.missingRecordCount,
    likelyMisclassificationCount: census.existingConditionBlocksAudit.likelyMisclassificationCount,
    ambiguousMarkerOnlyClassificationCount: census.existingConditionBlocksAudit.ambiguousMarkerOnlyClassificationCount,
    goldSetCount: gold.itemCount
  }, null, 2));
}

if (require.main === module) main();

module.exports = { buildRecords, buildGoldSet, classifyUnit, semanticUnits, sourceTexts, TAXONOMY };
