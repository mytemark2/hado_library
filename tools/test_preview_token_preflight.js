#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const workflow = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'app-validation.yml'), 'utf8');

assert(workflow.includes('Preflight Preview repository token for crawler data PR'), 'crawler data PR token preflight is missing');
assert(workflow.includes("github.event.pull_request.head.repo.full_name == github.repository"), 'preflight must be limited to same-repository PRs');
assert(workflow.includes("startsWith(github.head_ref, 'automation/hado-data-')"), 'preflight must cover crawler data branches');
assert(workflow.includes('secrets.PREVIEW_REPO_TOKEN'), 'preflight must use the Preview repository credential');
assert(workflow.includes('repos/mytemark2/hado_library-preview'), 'preflight must check the intended Preview repository');
assert(workflow.includes('actions/workflows/deploy-preview.yml'), 'preflight must check Preview Pages workflow visibility');
assert(workflow.includes('expected HTTP 200'), 'preflight must fail closed on invalid credentials');
assert(!/curl[^\n]*(?:-X|--request)\s+(?:POST|PUT|PATCH|DELETE)/i.test(workflow), 'preflight must not mutate GitHub state');

console.log('Preview token preflight workflow contract passed');
