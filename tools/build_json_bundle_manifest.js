#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cachePolicy = require('../hado_web_json_cache.js');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, cachePolicy.MANIFEST_FILE);

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function canonicalJsonBytes(buffer) {
  return Buffer.from(buffer.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
}

function canonicalText(value) {
  return String(value == null ? '' : value).replace(/\r\n/g, '\n');
}

function buildManifest() {
  const required = new Set(cachePolicy.REQUIRED_FILE_NAMES);
  const names = [...cachePolicy.REQUIRED_FILE_NAMES, ...cachePolicy.OPTIONAL_FILE_NAMES].sort();
  const files = {};
  for (const name of names) {
    const filePath = path.join(ROOT, name);
    if (!fs.existsSync(filePath)) {
      if (required.has(name)) throw new Error(`required JSON is missing: ${name}`);
      continue;
    }
    const content = canonicalJsonBytes(fs.readFileSync(filePath));
    files[name] = { required: required.has(name), size: content.length, sha256: sha256(content) };
  }
  const identity = Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, entry]) => `${name}:${entry.size}:${entry.sha256}:${entry.required ? 'required' : 'optional'}`)
    .join('\n');
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'hadou_meta.json'), 'utf8'));
  return {
    contractVersion: cachePolicy.CONTRACT_VERSION,
    bundleId: sha256(Buffer.from(`${cachePolicy.CONTRACT_VERSION}\n${identity}`, 'utf8')),
    dataUpdatedAt: String(meta.dataUpdatedAt || meta.exportedAt || ''),
    dataRunId: String(meta.runId || ''),
    files
  };
}

function main(args = process.argv.slice(2)) {
  const expected = `${JSON.stringify(buildManifest(), null, 2)}\n`;
  if (args.includes('--check')) {
    const actual = fs.existsSync(OUTPUT) ? canonicalText(fs.readFileSync(OUTPUT, 'utf8')) : '';
    if (actual !== expected) {
      console.error(`${cachePolicy.MANIFEST_FILE} is not synchronized with the public JSON bundle`);
      return 1;
    }
    console.log(`PASS ${cachePolicy.MANIFEST_FILE} bundle manifest`);
    return 0;
  }
  fs.writeFileSync(OUTPUT, expected, 'utf8');
  console.log(`wrote ${cachePolicy.MANIFEST_FILE}`);
  return 0;
}

if (require.main === module) process.exitCode = main();

module.exports = { buildManifest, canonicalJsonBytes, canonicalText, main };
