'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {assertCrawlerDataContract:check,assertCrawlerDataSetContract:checkSet}=require('./crawler_data_contract');
const fixture={schemaVersion:'1.0',items:[],kind:'tag_index'};
for(const version of ['1.1.0.9','1.1.0.11','2.0.0','future-generator-build'])check({...fixture,crawlerVersion:version},version,{kind:'tag_index'});
for(const invalid of [null,[],{...fixture,crawlerVersion:''},{...fixture,crawlerVersion:11},{...fixture,crawlerVersion:'1.1.0.11',schemaVersion:'2.0'},{...fixture,crawlerVersion:'1.1.0.11',items:{}}])assert.throws(()=>check(invalid));
assert.throws(()=>check({...fixture,crawlerVersion:'1.1.0.11'},'wrong kind',{kind:'search_index'}));
checkSet(['a','b'].map(name=>[name,{...fixture,crawlerVersion:'1.1.0.11'}]));
assert.throws(()=>checkSet([]));
assert.throws(()=>checkSet([['a',{...fixture,crawlerVersion:'1.1.0.9'}],['b',{...fixture,crawlerVersion:'1.1.0.11'}]]));
for(const file of ['test_release_3_0_2_0_status_effect_tags.js','test_3_2_0_0_update02_troop_cross_search.js']){
 const text=fs.readFileSync(path.join(__dirname,file),'utf8');
 assert(!/strictEqual\([^\n]*crawlerVersion\s*,\s*['"]\d/.test(text),`${file}: exact generator-version pin must not return`);
}
console.log('crawler data compatibility: multiple generator releases accepted; invalid schema, shape, provenance and kind rejected');
const importer=fs.readFileSync(path.join(__dirname,'import_crawler_json.ps1'),'utf8');
assert(!/Equal[^\n]*(?:crawlerVersion|CrawlerVersion)[^\n]*'\d+\.\d+\.\d+/.test(importer),'legacy importer must not pin a generator release');
assert(importer.includes("Equal (Prop $obj 'schemaVersion') '1.0'"),'legacy importer must retain schema compatibility gate');
