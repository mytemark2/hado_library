'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const policy = require('../hado_web_json_cache.js');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, policy.MANIFEST_FILE), 'utf8'));
const normalized = policy.normalizeManifest(manifest);
assert.strictEqual(normalized.bundleId, manifest.bundleId);
assert.strictEqual(policy.UPDATE_CHECK_TIMEOUT_MS, 3000);
assert.strictEqual(policy.FILE_TIMEOUT_MS, 8000);

const bootstrap = fs.readFileSync(path.join(root, 'hado_bootstrap.js'), 'utf8');
const requiredMatch = bootstrap.match(/const EXTERNAL_JSON_FILES=\{([^;]+)\};/);
const optionalMatch = bootstrap.match(/const EXTERNAL_JSON_OPTIONAL_FILES=\{([^;]+)\};/);
assert(requiredMatch && optionalMatch, 'bootstrap JSON file maps must exist');
const names = block => [...block.matchAll(/:'([^']+\.json)'/g)].map(match => match[1]).sort();
assert.deepStrictEqual(names(requiredMatch[1]), [...policy.REQUIRED_FILE_NAMES].sort(), 'manifest required files must match bootstrap');
assert.deepStrictEqual(names(optionalMatch[1]), [...policy.OPTIONAL_FILE_NAMES].sort(), 'manifest optional files must match bootstrap');

for (const [name, entry] of Object.entries(manifest.files)) {
  const content = Buffer.from(fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n'), 'utf8');
  const actual = require('crypto').createHash('sha256').update(content).digest('hex');
  assert.strictEqual(entry.size, content.length, `${name} size`);
  assert.strictEqual(entry.sha256, actual, `${name} sha256`);
}

for (const snippet of [
  'loadWebBundleManifest',
  "loadDecision:'auto-cache-current'",
  'legacy-cache-generation-match',
  "useCached('auto-cache-update-check-failed'",
  "useCached('auto-cache-refresh-failed'",
  'bundleManifest:remoteManifest',
  'xhr.timeout=timeoutMs',
  'webJson:sha256-mismatch'
]) assert(bootstrap.includes(snippet), `missing web cache behavior: ${snippet}`);

console.log('PASS web JSON cache policy, manifest hashes, timeout fallback, and atomic replacement contract');
