'use strict';
const assert=require('assert');

// Generator release is provenance, not a JSON compatibility boundary.
function assertCrawlerDataContract(value,label='crawler JSON',{kind}={}){
  assert(value&&typeof value==='object'&&!Array.isArray(value),`${label}: object required`);
  assert.strictEqual(value.schemaVersion,'1.0',`${label}: unsupported schemaVersion`);
  assert(Array.isArray(value.items),`${label}: items array required`);
  assert(typeof value.crawlerVersion==='string'&&value.crawlerVersion.trim(),`${label}: generator version must be recorded`);
  if(kind)assert.strictEqual(value.kind,kind,`${label}: unexpected kind`);
  return value;
}
function assertCrawlerDataSetContract(rows){
  assert(rows.length>0,'derived JSON set required');
  for(const [label,value] of rows)assertCrawlerDataContract(value,label);
  assert.strictEqual(new Set(rows.map(([,value])=>value.crawlerVersion)).size,1,'derived JSON generator versions must be consistent');
}
module.exports={assertCrawlerDataContract,assertCrawlerDataSetContract};
