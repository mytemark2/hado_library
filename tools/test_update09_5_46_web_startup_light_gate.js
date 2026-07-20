const fs=require('fs');
const source=fs.readFileSync('hado_bootstrap.js','utf8');
if(!source.includes('validateExternalJsonBundle(data,{skipHeavy:true})'))throw new Error('web startup still runs heavyweight JSON audit');
if(!source.includes('if(options.skipHeavy)'))throw new Error('structural-only gate missing');
console.log('PASS Update09.5.46 web startup light gate');
