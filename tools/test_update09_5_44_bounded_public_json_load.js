const fs=require('fs');
const source=fs.readFileSync('hado_bootstrap.js','utf8');
if(!source.includes('Math.min(3,queue.length)'))throw new Error('公開JSONの並列数上限がありません');
if(!source.includes('await nextFrame()'))throw new Error('JSONごとのUI解放がありません');
const block=source.slice(source.indexOf('async function loadExternalJsonBundleViaHttp'),source.indexOf('async function ensureDirectoryPermission'));
if(block.includes('required.map(async')||block.includes('optional.map(async'))throw new Error('全JSON同時Promise.allが残っています');
console.log('PASS Update09.5.44 bounded public JSON load');
