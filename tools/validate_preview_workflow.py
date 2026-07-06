#!/usr/bin/env python3
"""Validate preview notification workflow uses the minimal canonical-branch runtime sync."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "notify-preview.yml"
CHECKOUT_ACTION_RE = re.compile(r"uses:\s*actions/checkout@v[45]\b")
REQUIRED = (
    "ALLOWED_PREVIEW_SOURCE_BRANCH: feature/app-3.0.0.0",
    "case \"${APP_REF}\" in",
    "Refusing preview sync from prohibited Codex/PR branch ${APP_REF}; only ${ALLOWED_PREVIEW_SOURCE_BRANCH} may update mytemark2/hado_library-preview.",
    "if [ \"${APP_REF}\" != \"${ALLOWED_PREVIEW_SOURCE_BRANCH}\" ]; then",
    "if [[ \"${GITHUB_REF:-}\" == refs/heads/codex/* ]]; then",
    "Refusing preview sync from Codex work branch ${GITHUB_REF}; only ${ALLOWED_PREVIEW_SOURCE_BRANCH} may update mytemark2/hado_library-preview.",
    "Refusing preview sync from ${APP_REF}; only ${ALLOWED_PREVIEW_SOURCE_BRANCH} may update mytemark2/hado_library-preview.",
    "SOURCE_COMMIT=\"$(git rev-parse HEAD)\"",
    "Checked-out source commit ${SOURCE_COMMIT} does not match GITHUB_SHA ${GITHUB_SHA}.",
    "concurrency:",
    "group: hado-library-preview-sync",
    "cancel-in-progress: true",
    "for attempt in 1 2 3",
    "Preview repository main changed during push; retrying with a fresh clone.",
    "Preview repository push failed after ${attempt} attempts",
    "Sync preview repository contents",
    "git clone --depth 1",
    "mytemark2/hado_library-preview.git",
    "find \"${PREVIEW_DIR}\" -mindepth 1 -maxdepth 1 -not -name '.git' -not -name '.github' -exec rm -rf {} +",
    "rsync -a index.html HADO_DEV_INFO.json hado_*.js hado_styles.css hadou_*.json",
    "HADO_DEV_INFO.json",
    "cmp -s HADO_DEV_INFO.json",
    "PREVIEW_SOURCE_COMMIT.txt",
    "PREVIEW_SOURCE_BRANCH.txt",
    "PREVIEW_DISPLAY_VERSION.txt",
    "PREVIEW_SOURCE_FILES.txt",
    "sha256sum index.html hado_formation.js hado_styles.css hado_version.js HADO_DEV_INFO.json",
    "test \"$(cat \"${PREVIEW_DIR}/PREVIEW_SOURCE_BRANCH.txt\")\" = \"${ALLOWED_PREVIEW_SOURCE_BRANCH}\"",
    "test \"$(cat \"${PREVIEW_DIR}/PREVIEW_SOURCE_COMMIT.txt\")\" = \"${SOURCE_COMMIT}\"",
    "test \"$(cat \"${PREVIEW_DIR}/PREVIEW_DISPLAY_VERSION.txt\")\" = \"${DISPLAY_VERSION}\"",
    "(cd \"${PREVIEW_DIR}\" && sha256sum -c PREVIEW_SOURCE_FILES.txt)",
    "git -C \"${PREVIEW_DIR}\" push origin HEAD:main",
    "push_output=\"$(mktemp)\"",
    "without[^[:cntrl:]]*workflow scope",
    "Preview repository push failed: workflow file was staged or preview token lacks workflow scope.",
    "The app preview sync must not edit mytemark2/hado_library-preview/.github/workflows/jekyll-gh-pages.yml",
    "The app preview sync must never edit hado_library-preview/.github files.",
    "Preview workflow settings such as cancel-in-progress must be changed separately with workflow-scoped permission.",
    "sync_paths=(",
    "git add -- \"${sync_paths[@]}\"",
    "git add -u --",
    "staged_files=\"$(git diff --cached --name-only)\"",
    "Preview staged files:",
    "preview sync must never stage .github files",
    "sync preview from ${APP_REF}: ${SOURCE_COMMIT}",
    "Preflight preview token permissions",
    "PREVIEW_REPO_TOKEN preflight failed during ${label}; expected HTTP ${expected}, got ${http_code}.",
    "before preview files are pushed",
    "repository access check",
    "Pages workflow visibility check",
    "PREVIEW_REPO_TOKEN preflight passed before preview repository push: repository access and Pages workflow visibility are available.",
    "Wait for preview Pages deployment",
    "Preview Pages workflow run ${run_id} completed with conclusion=${conclusion}.",
    "Failed preview jobs: ${failed_jobs}",
    "Do not auto-rerun failed preview jobs from app sync because PREVIEW_REPO_TOKEN may not have Actions write rerun permission.",
    "Rerun mytemark2/hado_library-preview/.github/workflows/${workflow_file} manually, or inspect the preview deploy job logs.",
    "::warning title=Preview Pages deploy failed::Preview assets were pushed to mytemark2/hado_library-preview",
    "Skipping public marker verification for this failed deploy run.",
    "github_api_json()",
    "GitHub API ${label} returned HTTP ${http_code}; retrying (${attempt}/6).",
    "GitHub API ${label} did not return HTTP 200 after retries.",
    "runs_json=\"$(github_api_json \"list preview Pages workflow runs\"",
    "run_json=\"$(github_api_json \"get preview Pages workflow run ${run_id}\"",
    "PREVIEW_COMMIT: ${{ steps.sync.outputs.preview_commit }}",
    "preview_commit=",
    "runs?branch=main&event=push&per_page=20",
    "runs_file=\"$(mktemp)\"",
    "printf '%s' \"${runs_json}\" > \"${runs_file}\"",
    "RUNS_FILE=\"${runs_file}\" PREVIEW_COMMIT=\"${PREVIEW_COMMIT}\" python - <<'PY'",
    "with open(os.environ['RUNS_FILE'], encoding='utf-8') as fh:",
    "rm -f \"${runs_file}\"",
    "Preview Pages workflow push event did not produce a visible run for preview commit ${PREVIEW_COMMIT}.",
    "${api_root}/actions/runs/${run_id}",
    "https://mytemark2.github.io/hado_library-preview/PREVIEW_SOURCE_COMMIT.txt",
    "https://mytemark2.github.io/hado_library-preview/PREVIEW_DISPLAY_VERSION.txt",
    "[ \"${public_source}\" = \"${SOURCE_COMMIT}\" ]",
    "[ \"${public_version}\" = \"${DISPLAY_VERSION}\" ]",
    "PREVIEW_REPO_TOKEN",
    "cancel-in-progress: true",
    "Verify public preview deployment",
    "https://mytemark2.github.io/hado_library-preview",
    "PREVIEW_SOURCE_COMMIT.txt?cb=",
    "PREVIEW_DISPLAY_VERSION.txt?cb=",
    "Public preview matches ${SOURCE_COMMIT} / ${DISPLAY_VERSION}",
)
FORBIDDEN = (
    'requesting failed-job rerun',
    'Failed preview jobs to rerun:',
    'rerun permissions are expected',
    'Actions: Read and write is required',
    'after failed-job rerun',
    'rerunning failed jobs',
    'rerun_failed_jobs_requested',
    'rerun-failed-jobs',
    'github_api_post_empty()',
    "workflow_dispatch:",
    "schedule:",
    "sync_app_preview",
    "repository_dispatch",
    "branches-ignore:",
    "branches:\n      - '**'",
    "identify-and-propose-ui",
    "git clone --depth 1 --branch feature/app-3.0.0.0",
    "rsync -a --delete",
    "Verify preview reflects source commit and version assets",
    "actions/workflows/${workflow_file}/dispatches",
    "PREVIEW_PAGES_WORKFLOW",
    "preview_workflow=",
    "PYPREVIEW",
    "git add -A",
    "actions/workflows/${workflow_file}/enable",
    "Actions write permission check",
    "RUNS_JSON=\"${runs_json}\"",
    "json.load(sys.stdin)",
    "\n              ! -name",
    "\n              -not -name",
)


def main() -> int:
    text = WORKFLOW.read_text(encoding="utf-8")
    missing = []
    if not CHECKOUT_ACTION_RE.search(text):
        missing.append("uses: actions/checkout@v4 or actions/checkout@v5")
    missing.extend(snippet for snippet in REQUIRED if snippet not in text)
    forbidden = [snippet for snippet in FORBIDDEN if snippet in text]
    if missing:
        raise SystemExit("preview workflow missing: " + ", ".join(missing))
    if forbidden:
        raise SystemExit("preview workflow contains prohibited stale sync pattern: " + ", ".join(forbidden))
    print("preview workflow rejects non-canonical branches, syncs runtime assets without editing preview .github files, warns on preview deploy failures without auto-rerun, and verifies public deployment markers after successful deploys")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
