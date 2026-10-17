'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/app-validation.yml'),'utf8');
for(const text of ['Preflight Preview repository token for crawler data PR',"github.event_name == 'pull_request'",'github.event.pull_request.head.repo.full_name == github.repository',"startsWith(github.head_ref, 'automation/hado-data-')",'secrets.PREVIEW_REPO_TOKEN','repos/mytemark2/hado_library-preview','actions/workflows/deploy-preview.yml','expected HTTP 200'])assert(workflow.includes(text),`Missing publication guard: ${text}`);
assert(!/curl[^\n]*(?:-X|--request)\s+(?:POST|PUT|PATCH|DELETE)/i.test(workflow),'preflight is read-only');
console.log('Preview token preflight contract passed');
