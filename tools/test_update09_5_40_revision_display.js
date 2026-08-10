#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const nodes = new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{textContent:''});return nodes.get(id);}
const document = {
  title: '',
  readyState: 'complete',
  getElementById(id){return node(id);},
  querySelector(selector){if(selector === '#appTitlePanel h1')return node('h1');return null;},
  querySelectorAll(){return [];},
  addEventListener(){}
};
const context = { console, window: null, document, fetch: async () => { throw new Error('offline'); } };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('hado_version.js','utf8'), context, { filename: 'hado_version.js' });
vm.runInContext(fs.readFileSync('hado_update_meta.js','utf8'), context, { filename: 'hado_update_meta.js' });
const version = context.window.HADO_VERSION;
const expectedBase = version.updateNo ? `${version.releaseVersion} Update${version.updateNo}` : version.releaseVersion;
const expected = `${expectedBase} r${version.revision}`;
assert.strictEqual(context.window.HADO_APP_DISPLAY_VERSION, expected, 'visible app version includes revision');
assert.strictEqual(document.title, `覇道ライブラリ ${expected}`, 'page title includes revision');
assert.strictEqual(node('h1').textContent, `覇道ライブラリ ${expected}`, 'top title includes revision');
assert.strictEqual(node('uxHomeVersionBadge').textContent, `${expected} 操作ガイド`, 'guide badge includes revision');
assert.strictEqual(node('diagnosticAppVersion').textContent, `覇道ライブラリ｜${expected}`, 'diagnostic display includes revision');
assert.strictEqual(context.window.HADO_APP_VERSION_META.displayVersion, expectedBase, 'base displayVersion remains revision-free metadata');
assert.strictEqual(context.window.HADO_APP_VERSION_META.visibleVersion, expected, 'visibleVersion carries revision');
console.log('revision display tests passed');
