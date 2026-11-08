'use strict';
// Owned synthetic source shapes, NOT a snapshot or assertion of current game abilities.
const positive = ['LR周倉（しゅうそう）', 'LR関羽（かんう）', 'LR関銀屏（かんぎんぺい）', 'LR関平（かんぺい）', 'UR廖化（りょうか）', 'UR関羽（かんう）', '関羽（かんう）'];
const negative = ['LR呂蒙・盾兵（りょもう）', 'LR司馬師（しばし）', 'LR張良（ちょうりょう）', 'UR蒋欽（しょうきん）', 'LR孟獲（もうかく）', 'LR呂玲綺（りょれいき）', 'UR張苞（ちょうほう）', '黄忠（こうちゅう）', 'LR夏侯淵・盾兵（かこうえん）', 'UR花鬘（かまん）'];
function general(name, match) {
  const item = {
    name: `【三國志 覇道】${name}`, title: name, category: '武将',
    tables: [{index: 0, headers: ['兵科', '相性'], rows: [['歩兵', 'A']]}],
    sections: [
      {title: `${name}の基本情報`, content: ['基本情報']},
      {title: 'おすすめ武将', content: ['関羽と組み合わせる攻略解説']},
      {title: `${name}の戦法`, content: ['戦法情報']},
      {title: '検証戦法', content: [match ? '主将が関羽の際、攻撃を上昇' : name.includes('司馬師') ? '部隊の兵力+10%' : '対象に攻撃する']}
    ]
  };
  if (name.includes('夏侯淵')) for (const index of [20, 21]) item.tables.push({index, headers: ['武将', '特徴'], rows: [['関羽', 'おすすめ武将']]});
  if (name.includes('花鬘')) item.sections.push({title: '兵心を持つ武将', content: ['兵心を持つ武将 LR関羽']});
  return item;
}
module.exports = {
  generals: {items: [...positive.map(name => general(name, true)), ...negative.map(name => general(name, false))]},
  luBuSearch: {category: 'generals', sourceEntityKey: 'generals:article-415628', name: 'LR呂布（りょふ）', searchText: 'LR呂布 兵科相性に応じて兵力を決定'}
};
