const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'notify-preview.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

function sectionBetween(startMarker, endMarker) {
  const start = workflow.indexOf(startMarker);
  assert(start >= 0, `missing section start: ${startMarker}`);
  const end = workflow.indexOf(endMarker, start + startMarker.length);
  assert(end > start, `missing section end: ${endMarker}`);
  return workflow.slice(start, end);
}

const syncStep = sectionBetween('- name: Sync preview repository contents', '- name: Wait for preview Pages deployment');


for (const forbidden of [
  'rerun-failed-jobs',
  'github_api_post_empty',
  'rerun_failed_jobs_requested',
  'rerunning failed jobs',
  'Failed preview jobs to rerun:',
  'requesting failed-job rerun',
  'Actions: Read and write is required',
]) {
  assert(!workflow.includes(forbidden), `workflow must not contain automatic rerun pattern ${forbidden}`);
}

const waitStep = sectionBetween('- name: Wait for preview Pages deployment', '# Verify public preview deployment');
assert(waitStep.includes('Failed preview jobs:'), 'wait step must report failed preview job names');
assert(waitStep.includes('Do not auto-rerun failed preview jobs from app sync'), 'wait step must explain that app sync does not auto-rerun preview jobs');
assert(waitStep.includes('Rerun mytemark2/hado_library-preview/.github/workflows/${workflow_file} manually'), 'wait step must point operators to manual preview workflow rerun');
assert(waitStep.includes('::warning title=Preview Pages deploy failed::'), 'wait step must downgrade preview deploy failure to a warning after reporting failed jobs');
assert(waitStep.includes('Skipping public marker verification for this failed deploy run'), 'wait step must explain marker verification is skipped only after failed preview deploy');
assert(waitStep.includes('exit 0'), 'wait step must not fail the app sync after an external preview Pages deploy failure');
assert(!waitStep.includes('curl -sS -X POST'), 'wait step must not POST to rerun preview workflow jobs');

for (const forbidden of [
  'PREVIEW_PAGES_WORKFLOW',
  'preview_workflow=',
  'PYPREVIEW',
  'git -C "${PREVIEW_DIR}" add -A',
  'git add -A',
]) {
  assert(!syncStep.includes(forbidden), `sync step must not contain ${forbidden}`);
}

assert(syncStep.includes("find \"${PREVIEW_DIR}\" -mindepth 1 -maxdepth 1 -not -name '.git' -not -name '.github' -exec rm -rf {} +"), 'sync step must preserve preview .github directory while replacing root runtime files');
assert(syncStep.includes('rsync -a index.html HADO_DEV_INFO.json hado_*.js hado_styles.css hadou_*.json'), 'sync step must copy only runtime assets from the app repo');
assert(syncStep.includes('sync_paths=('), 'sync step must build an explicit add list');
assert(syncStep.includes('git add -- "${sync_paths[@]}"'), 'sync step must explicitly add existing sync targets');
assert(syncStep.includes('git add -u --'), 'sync step must stage deletions only for explicit sync targets');
assert(syncStep.includes('staged_files="$(git diff --cached --name-only)"'), 'sync step must inspect staged files before commit');
assert(syncStep.includes('preview sync must never stage .github files'), 'sync step must fail if .github files are staged');
assert(syncStep.includes('.github/*)'), 'sync step must guard the .github path pattern');

const previewEditTerms = [
  'cancel-in-progress: true\\n',
  'concurrency:\\n  group: pages',
  'path.write_text',
  'read_text(encoding',
];
for (const term of previewEditTerms) {
  assert(!syncStep.includes(term), `sync step must not auto-edit the preview workflow via ${term}`);
}

assert(syncStep.includes('workflow file was staged or preview token lacks workflow scope'), 'workflow-scope push errors must be classified as non-retryable permission errors');
assert(syncStep.includes('without[^[:cntrl:]]*workflow scope'), 'workflow-scope rejection pattern must be detected');
assert(syncStep.includes('fetch first|non-fast-forward|stale info|failed to push some refs'), 'only non-fast-forward style push errors should be retried');
assert(syncStep.includes('Preview repository push failed for a non-retryable reason.'), 'unknown push errors must fail instead of being treated as branch races');

const ownConcurrencyCount = (workflow.match(/cancel-in-progress: true/g) || []).length;
assert(ownConcurrencyCount >= 1, 'notify-preview workflow should keep its own concurrency cancellation');
assert(!syncStep.includes('cancel-in-progress: true'), 'sync step must not write cancel-in-progress into the preview clone');

console.log('notify-preview workflow does not edit preview workflow files, guards staged paths, and avoids automatic preview job reruns');
