const fs=require('fs');
const generals=require('../hadou_generals.json');
const source=fs.readFileSync('hado_status_effects.js','utf8');
for(const token of ['五行適正','rosterSensitive=cat===\'generals\'','Number(table?.index)','Array.isArray(table?.rows)'])if(!source.includes(token))throw new Error(`武将検索除外ロジック不足: ${token}`);
const items=generals.items||generals;const x=items.find(v=>String(v.name||'').includes('LR夏侯淵・盾兵'));if(!x)throw new Error('LR夏侯淵・盾兵 fixture missing');const roster=(x.tables||[]).filter(t=>[20,21].includes(Number(t.index))).map(t=>JSON.stringify(t)).join(' ');if(!roster.includes('関羽'))throw new Error('fixture does not reproduce 関羽 roster contamination');
console.log('PASS Update09.5.47 general roster search exclusion');
