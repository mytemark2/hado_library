'use strict';
const assert = require('assert'), path = require('path'), {spawnSync} = require('child_process');
const root = path.resolve(__dirname, '..');
const preload = path.join(__dirname, 'validation_data_access.js');
for (const operation of [
  "require('fs').readFileSync('hadou_generals.json')",
  "require('./hadou_generals.json')",
  "require('fs').promises.readFile('hadou_generals.json').catch(e=>{console.error(e.message);process.exitCode=1})"
]) {
  const result = spawnSync(process.execPath, ['--require', preload, '-e', operation], {cwd: root, encoding: 'utf8'});
  assert.notStrictEqual(result.status, 0, 'unclassified regression must not read current JSON');
  assert(result.stderr.includes('validation-data-boundary'), result.stderr);
}
const fixture = spawnSync(process.execPath, ['--require', preload, 'tools/test_update09_5_63_equipment_search_stage.js'], {cwd: root, encoding: 'utf8'});
assert.strictEqual(fixture.status, 0, fixture.stderr);
console.log('validation data boundary passed: sync, require and async reads blocked; owned fixture works');
