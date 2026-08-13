'use strict';

const assert = require('assert');
const fs = require('fs');

const meta = JSON.parse(fs.readFileSync('hadou_meta.json', 'utf8'));
const core = fs.readFileSync('hado_core.js', 'utf8');
const bootstrap = fs.readFileSync('hado_bootstrap.js', 'utf8');

assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(meta.dataUpdatedAt), 'dataUpdatedAt must be a UTC ISO 8601 timestamp');
assert(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} JST$/.test(meta.dataUpdatedAtJst), 'dataUpdatedAtJst must be a JST display timestamp');
assert(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/.test(meta.runId), 'runId must identify the completed crawler run');
assert(/^[0-9a-f]{40}$/.test(meta.sourceCommit), 'sourceCommit must be a Git commit SHA');
assert(core.includes('データ更新日：${dataUpdatedAtDisplay()}'), 'data update date must be visible in the data management UI');
assert(bootstrap.includes('dataUpdatedAtJst:norm(data?.meta?.dataUpdatedAtJst'), 'loaded JSON metadata must flow into the UI state');

console.log('data update metadata contract ok');
