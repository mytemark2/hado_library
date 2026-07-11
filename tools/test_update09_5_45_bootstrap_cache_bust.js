const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
if(!html.includes('./hado_bootstrap.js?v=09.5.45-r135'))throw new Error('bootstrap cache-bust version missing');
console.log('PASS Update09.5.45 bootstrap cache bust');
