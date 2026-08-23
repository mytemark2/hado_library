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
if(source.includes('cancelSearchProgressIndicator'))throw new Error('未定義の検索進捗取消関数を呼び出している');
if(!/if\(searchableMasterCount===0\)\{\s*clearSearchProgressTimer\(\);/.test(source))throw new Error('JSON未読込検索は既存の進捗タイマーを安全に停止する必要がある');
console.log('PASS Update09.5.43 JSON未読込検索ガード');
