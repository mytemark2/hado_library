const fs=require('fs');
const source=fs.readFileSync('hado_search.js','utf8');
const required=[
  "searchableMasterCount===0",
  "JSON未読込：検索できません",
  "dataLoadRequired:true",
  "makeStartupDataLoadError('search-before-json-load'",
  "renderStartupDataLoadScreen"
];
const missing=required.filter(token=>!source.includes(token));
if(missing.length)throw new Error(`JSON未読込検索ガード不足: ${missing.join(', ')}`);
console.log('PASS Update09.5.43 JSON未読込検索ガード');
