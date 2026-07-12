const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'notify-preview.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

assert(workflow.includes('workflow_file="deploy-preview.yml"'), 'preview monitor must target the canonical deploy-preview workflow');
assert(!workflow.includes('workflow_file="jekyll-gh-pages.yml"'), 'preview monitor must not target a retired duplicate Jekyll workflow');

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

const waitStart = workflow.indexOf('- name: Wait for preview Pages deployment');
assert(waitStart >= 0, 'missing preview wait step');
const waitStep = workflow.slice(waitStart);
assert(waitStep.includes('Failed preview jobs:'), 'wait step must report failed preview job names');
assert(waitStep.includes('Preview synchronization is incomplete until this Pages deployment succeeds.'), 'wait step must classify a failed Pages deploy as incomplete');
const failureBlock = waitStep.slice(waitStep.indexOf('Failed preview jobs:'), waitStep.indexOf('source_url='));
assert(failureBlock.includes('exit 1'), 'failed preview Pages deployment must fail the app sync');
assert(!failureBlock.includes('exit 0'), 'failed preview Pages deployment must not be downgraded to success');
assert(!waitStep.includes('Rerun mytemark2/hado_library-preview/.github/workflows/${workflow_file} manually'), 'normal preview synchronization must not require a manual rerun');
assert(waitStep.includes('PREVIEW_SOURCE_COMMIT.txt?cb=${SOURCE_COMMIT}'), 'public source marker verification must be cache-busted');
assert(waitStep.includes('PREVIEW_DISPLAY_VERSION.txt?cb=${SOURCE_COMMIT}'), 'public version marker verification must be cache-busted');
assert(waitStep.includes("str(run.get('status', '')) == 'completed'"), 'preview workflow selection must inspect run status');
assert(waitStep.includes("{'cancelled', 'skipped'}"), 'preview workflow selection must ignore cancelled/skipped duplicate runs');
assert(waitStep.includes("created_at"), 'preview workflow selection must choose the newest viable matching run');
assert(waitStep.includes('searching for another viable run for the same commit'), 'cancelled preview runs must trigger a retry for the same commit');
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

console.log('notify-preview workflow preserves preview workflows, guards staged paths, and fails hard when Pages deployment is incomplete');
