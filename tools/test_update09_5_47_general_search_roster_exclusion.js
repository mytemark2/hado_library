const fs=require('fs');
const source=fs.readFileSync('hado_status_effects.js','utf8');
for(const token of ['五行適正','rosterSensitive=cat===\'generals\'','Number(table?.index)'])if(!source.includes(token))throw new Error(`武将検索除外ロジック不足: ${token}`);
console.log('PASS Update09.5.47 general roster search exclusion');
