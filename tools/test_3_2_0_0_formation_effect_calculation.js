'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const noop = () => {};
const sandbox = {
  console, performance, URL, URLSearchParams, setTimeout, clearTimeout,
  localStorage: {getItem: () => null, setItem: noop},
  document: {getElementById: () => null, addEventListener: noop},
  location: {protocol: 'https:', search: ''},
  addEventListener: noop,
};
sandbox.window = sandbox;
const vmContext = vm.createContext(sandbox);
for (const file of ['hado_version.js', 'hado_core.js', 'hado_status_effects.js', 'hado_formation.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), vmContext, {filename: file});
}

const results = vm.runInContext(`
  const slots = {
    main: {baseName: '主役'}, deputy1: {baseName: '味方甲'}, deputy2: {baseName: '味方乙'},
    support1: {baseName: '味方丙'}, support2: {baseName: '味方丁'}
  };
  const context = {
    slots, mainGeneralNormalizedName: '主役', troopType: '', isOwnCity: true, isGarrisonOrDefense: true,
    compatibilityMap: {
      主役: ['味方甲', '味方乙', '味方丙', '味方丁'],
      味方丙: ['味方甲', '味方乙', '味方丁']
    }
  };
  const speed = '■常に ●部隊の戦法速度+';
  const skill = (name, levels) => ({name, sections: [{title: name, content: [levels]}]});
  const affinity = (rate, cap) => '▼駐屯/防衛中 ●部隊内（主将/副将/補佐）の自身と好相性の武将数×'+rate+'%、部隊の戦法速度が上昇（最大'+cap+'%）';
  const genericSpeed = skill('瞬動', 'Ⅰ'+speed+'2%Ⅱ'+speed+'4%Ⅲ'+speed+'7%Ⅳ'+speed+'10%Ⅴ'+speed+'15%');
  const defenses = skill('堅陣', 'Ⅱ■主将の際 ●好相性の副将と補佐を兵科一致として兵力を決定Ⅲ■主将の際 '+affinity(5,25));
  const support = skill('駐守', 'Ⅱ■常に ●部隊の兵力+3%Ⅲ■常に '+affinity(2,10));
  const command = skill('出陣準備', 'Ⅱ■常に ●部隊の攻撃速度+10%Ⅲ■主将の際 ▼出陣時 ●戦法ゲージ+15%（上限50%）');
  state.skills = [genericSpeed, defenses, support, command];
  debugLog = () => {};
  const record = (name, level, text, extra={}) => ({source: '技能:'+name+level, text, kind: 'include', ...extra});
  const boost = (name, limit) => record(name, 'Lv+1', '部隊の「'+name+'」の技能Lv+1', {
    formationSkillName:name, equipmentReferenceKind:'skill-lv-boost', equipmentSkillBoost:1, equipmentSkillLimit:limit
  });
  const grant = (name, text) => ({
    formationSkillName:name, grantedFromSkill:'親技能', grantedFromParentText:text, grantedFromMatchedText:'を付与'
  });
  const owner = (holder, holderSlot, sourceType, records) => ({
    holder, holderSlot, slotKey:holderSlot, holderRole:sourceType==='attendant'?'attendant':holderSlot,
    sourceType, item:{name:holder, records}
  });
  const items = [
    owner('主役','main','general',[
      record('堅陣','Ⅱ','■主将の際 ●好相性の副将と補佐を兵科一致として兵力を決定',
        grant('堅陣','■主将で、編制時点の自部隊の知力が2750以上の際 ●堅陣Lv2を付与'))
    ]),
    owner('侍従甲','main','attendant',[record('出陣準備','Ⅱ','■常に ●部隊の攻撃速度+10%')]),
    owner('味方甲','deputy1','general',[record('瞬動','Ⅰ',speed+'2%')]),
    owner('味方丙','support1','general',[record('瞬動','Ⅱ',speed+'4%'),record('駐守','Ⅱ','■常に ●部隊の兵力+3%')]),
    owner('味方丁','support2','general',[record('疾行','Ⅱ',speed+'4%'),record('護厳付与','Ⅱ',
      '■主将か、主将と自身が好相性の際 ▼駐屯/防衛中に交戦開始時 ●自身に護厳が発生していない場合、自身1部隊に3％の護厳を20秒付与（この技能を持つ武将の将星ランクに応じて、効果量が1％ずつ上昇）'
    )]),
    owner('装備甲','main','equipment',[boost('瞬動',5),boost('堅陣',3),boost('駐守',3),boost('出陣準備',4)]),
    owner('装備乙','deputy2','equipment',[boost('瞬動',5),boost('通常未所持',3)])
  ];
  buildFormationContext=()=>context;
  collectFormationItems=()=>items;
  collectFormationParameterSourceRecords=item=>item.records;
  getCurrentStarValue=()=>3;
  const f=createFormationRecord('fixture');
  function run(){
    const out=buildFormationParameterDataUncached(f);
    const value=(timing,group,key)=>out.summary[timing]?.[group]?.[key]?.maxTotal??null;
    return {
      steady:value('normal','speed','戦法速度'),
      defense:value('defense','speed','戦法速度'),
      opening:value('defenseEngagement','speed','戦法速度'),
      deploy:value('deploy','gauge','戦法ゲージ'),
      levels:Object.fromEntries(out.skills.map(s=>[s.name,s.total])),
      defenseSources:out.summary.defense?.speed?.['戦法速度']?.maxItems?.map(e=>e.condition)||[],
      rendered:renderFormationDefenseSpeedEstimate(out)
    };
  }
  const full=run();
  context.isOwnCity=false;
  context.isGarrisonOrDefense=false;
  const marching=run();
  context.isGarrisonOrDefense=true;
  context.compatibilityMap.主役=['味方甲','味方乙','味方丙'];
  context.compatibilityMap.味方丙=['味方甲','味方乙'];
  const partial=run();
  context.compatibilityMap.主役.push('味方丁');
  state.viewMode='saved';
  const saved=run();
  const gaugeText='■常に ●通常攻撃時に50%の確率で戦法ゲージを3%増加（1度の通常攻撃につき1回発生判定を行う）';
  const gaugeEffects=parseParameterEffectsFromRecord(record('追撃','Ⅲ',gaugeText)).effects;
  JSON.stringify({full,marching,partial,saved,gauge:gaugeEffects.filter(e=>e.key==='戦法ゲージ').map(e=>e.value)});
`, vmContext);

const {full, marching, partial, saved, gauge} = JSON.parse(results);
assert.equal(full.steady, 19, '瞬動Ⅴ15%と別技能の疾行Ⅱ4%を加算');
assert.equal(full.defense, 35, '堅陣Ⅲ25%と駐守Ⅲ10%。各技能の所有者と相性の合う5枠だけ');
assert.equal(full.opening, 10, '全データ最大段階の護厳は将星7で10%');
assert.equal(full.deploy, 15, '侍従の技能を配置先の主将枠として判定');
assert.equal(full.levels.瞬動, 5);
assert.equal(full.levels.堅陣, 3);
assert(!Object.hasOwn(full.levels, '通常未所持'), '武将側にない技能は装備で加算しない');
assert(full.defenseSources.some(text => text.includes('知力が2750以上')));
assert.match(full.rendered, /条件成立時.*\+54%.*交戦開始時 \+64%/);
assert.equal(marching.steady, 19);
assert.equal(marching.defense, null);
assert.equal(marching.opening, null);
assert.equal(marching.rendered, '');
assert.equal(partial.defense, 28, '相性の悪い枠は数えない');
assert.equal(partial.opening, null, '補佐と主将が好相性でなければ護厳なし');
assert.equal(saved.opening, 6, '保存データは将星3を反映');
assert.deepEqual(gauge, [3], '同じゲージ増加文を複数の解析器で二重加算しない');
console.log('formation effect calculation passed');
