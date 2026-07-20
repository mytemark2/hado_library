#!/usr/bin/env python3
"""Validate the canonical, push-triggered preview synchronization contract."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "notify-preview.yml"
CHECKOUT_ACTION_RE = re.compile(r"uses:\s*actions/checkout@v[45]\b")

REQUIRED = (
    "ALLOWED_PREVIEW_SOURCE_BRANCH: feature/app-3.0.0.0",
    "github.ref == 'refs/heads/feature/app-3.0.0.0'",
    "SOURCE_COMMIT=\"$(git rev-parse HEAD)\"",
    "Checked-out source commit ${SOURCE_COMMIT} does not match GITHUB_SHA ${GITHUB_SHA}.",
    "group: hado-library-preview-sync",
    "cancel-in-progress: true",
    "Preflight preview token permissions",
    "repository access check",
    "Pages workflow visibility check",
    'workflow_file="deploy-preview.yml"',
    "Sync preview repository contents",
    "for attempt in 1 2 3",
    "Preview repository main changed during push; retrying with a fresh clone.",
    "find \"${PREVIEW_DIR}\" -mindepth 1 -maxdepth 1 -not -name '.git' -not -name '.github' -exec rm -rf {} +",
    "rsync -a index.html HADO_DEV_INFO.json hado_*.js hado_styles.css hadou_*.json",
    "PREVIEW_SOURCE_COMMIT.txt",
    "PREVIEW_SOURCE_BRANCH.txt",
    "PREVIEW_DISPLAY_VERSION.txt",
    "PREVIEW_SOURCE_FILES.txt",
    "git add -- \"${sync_paths[@]}\"",
    "git add -u --",
    "staged_files=\"$(git diff --cached --name-only)\"",
    "preview sync must never stage .github files",
    "git -C \"${PREVIEW_DIR}\" push origin HEAD:main",
    "Wait for preview Pages deployment",
    "runs?branch=main&event=push&per_page=20",
    "Preview Pages workflow run ${run_id} completed with conclusion=${conclusion}.",
    "Failed preview jobs: ${failed_jobs}",
    "Preview synchronization is incomplete until this Pages deployment succeeds.",
    "PREVIEW_SOURCE_COMMIT.txt?cb=${SOURCE_COMMIT}",
    "PREVIEW_DISPLAY_VERSION.txt?cb=${SOURCE_COMMIT}",
    "Public preview matches source commit ${SOURCE_COMMIT} and display version ${DISPLAY_VERSION}.",
)

FORBIDDEN = (
    "workflow_dispatch:",
    "schedule:",
    "repository_dispatch",
    "rerun-failed-jobs",
    "github_api_post_empty",
    "rerun_failed_jobs_requested",
    "Rerun mytemark2/hado_library-preview/.github/workflows/${workflow_file} manually",
    "::warning title=Preview Pages deploy failed::",
    "Skipping public marker verification for this failed deploy run",
    "PREVIEW_PAGES_WORKFLOW",
    "preview_workflow=",
    "PYPREVIEW",
    "git add -A",
    "rsync -a --delete",
    'workflow_file="jekyll-gh-pages.yml"',
)


def section_between(text: str, start: str, end: str | None = None) -> str:
    begin = text.find(start)
    if begin < 0:
        raise SystemExit(f"preview workflow section missing: {start}")
    if end is None:
        return text[begin:]
    finish = text.find(end, begin + len(start))
    if finish < 0:
        raise SystemExit(f"preview workflow section missing: {end}")
    return text[begin:finish]


def main() -> int:
    text = WORKFLOW.read_text(encoding="utf-8")
    missing = []
    if not CHECKOUT_ACTION_RE.search(text):
        missing.append("uses: actions/checkout@v4 or actions/checkout@v5")
    missing.extend(snippet for snippet in REQUIRED if snippet not in text)
    forbidden = [snippet for snippet in FORBIDDEN if snippet in text]

    sync = section_between(
        text,
        "- name: Sync preview repository contents",
        "- name: Wait for preview Pages deployment",
    )
    wait = section_between(text, "- name: Wait for preview Pages deployment")
    if ".github/*)" not in sync:
        missing.append("explicit .github staged-file guard")
    if "exit 1" not in wait[wait.find("Failed preview jobs:") : wait.find("source_url=")]:
        missing.append("failed Pages deployment exits non-zero")

    if missing:
        raise SystemExit("preview workflow missing: " + ", ".join(missing))
    if forbidden:
        raise SystemExit(
            "preview workflow contains prohibited sync pattern: " + ", ".join(forbidden)
        )
    print(
        "preview workflow is canonical-branch push-triggered, stages only runtime assets, "
        "fails on an incomplete Pages deployment, and verifies cache-busted public markers"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
