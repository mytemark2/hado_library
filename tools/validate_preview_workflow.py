#!/usr/bin/env python3
"""Validate preview notification workflow directly syncs and verifies preview assets."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "notify-preview.yml"
REQUIRED = (
    "uses: actions/checkout@v4",
    "branches:\n      - '**'",
    "concurrency:",
    "group: hado-library-preview-sync",
    "for attempt in 1 2 3",
    "Preview repository main changed during push; retrying with a fresh clone.",
    "Preview repository push failed after ${attempt} attempts",
    "Sync preview repository contents",
    "git clone --depth 1",
    "mytemark2/hado_library-preview.git",
    "rsync -a --delete",
    "PREVIEW_SOURCE_COMMIT.txt",
    "PREVIEW_SOURCE_BRANCH.txt",
    "PREVIEW_DISPLAY_VERSION.txt",
    "git -C \"${PREVIEW_DIR}\" push origin HEAD:main",
    "Dispatch preview Pages deployment workflow",
    "actions/workflows/jekyll-gh-pages.yml/dispatches",
    "final preview verification step remains mandatory",
    "Preview Pages workflow dispatch was not authorized by PREVIEW_REPO_TOKEN",
    "Verify preview reflects source commit and version assets",
    "https://mytemark2.github.io/hado_library-preview/",
    "EXPECTED_DISPLAY_VERSION",
    "EXPECTED_SOURCE_SHA",
    "EXPECTED_SOURCE_BRANCH",
    "hado_version.js",
    "PREVIEW_REPO_TOKEN",
)
FORBIDDEN = (
    "workflow_dispatch:",
    "schedule:",
    "sync_app_preview",
    "repository_dispatch",
    "branches-ignore:",
    "git clone --depth 1 --branch feature/app-3.0.0.0",
)


def main() -> int:
    text = WORKFLOW.read_text(encoding="utf-8")
    missing = [snippet for snippet in REQUIRED if snippet not in text]
    forbidden = [snippet for snippet in FORBIDDEN if snippet in text]
    if missing:
        raise SystemExit("preview workflow missing: " + ", ".join(missing))
    if forbidden:
        raise SystemExit("preview workflow contains prohibited stale sync pattern: " + ", ".join(forbidden))
    print("preview workflow syncs source branch assets with minimal pre-sync checks and verifies deployed version/commit")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
