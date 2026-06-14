#!/usr/bin/env python3
"""Validate preview notification workflow directly syncs and verifies preview assets."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "notify-preview.yml"
REQUIRED = (
    "uses: actions/checkout@v5",
    "branches:\n      - '**'",
    "Validate source preview assets before sync",
    "hado_styles.css is unexpectedly small",
    "Sync preview repository contents",
    "git clone --depth 1",
    "mytemark2/hado_library-preview.git",
    "rsync -a --delete",
    "PREVIEW_SOURCE_COMMIT.txt",
    "PREVIEW_SOURCE_BRANCH.txt",
    "PREVIEW_DISPLAY_VERSION.txt",
    "Synced preview assets validated",
    "Synced hado_styles.css is unexpectedly small",
    "git -C \"${PREVIEW_DIR}\" push origin HEAD:main",
    "Verify preview Pages deployment workflow exists",
    "Dispatch preview Pages deployment workflow",
    "actions/workflows/jekyll-gh-pages.yml/dispatches",
    "Verify preview reflects source commit and version assets",
    "https://mytemark2.github.io/hado_library-preview/",
    "EXPECTED_DISPLAY_VERSION",
    "EXPECTED_SOURCE_SHA",
    "EXPECTED_SOURCE_BRANCH",
    "hado_version.js",
    "hado_styles.css",
    "./hado_styles.css",
    "len(css_text) >= 100000",
    "actions/deploy-pages",
    "actions/jekyll-build-pages",
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
    print("preview workflow directly syncs current source branch assets and verifies deployed css/version/commit")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
