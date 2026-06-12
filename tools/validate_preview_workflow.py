#!/usr/bin/env python3
"""Validate preview notification workflow verifies the deployed preview version."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "notify-preview.yml"
REQUIRED = (
    "uses: actions/checkout@v4",
    "display_version",
    "hado_version.js",
    "Verify preview reflects source commit and version assets",
    "https://mytemark2.github.io/hado_library-preview/",
    "EXPECTED_DISPLAY_VERSION",
    "EXPECTED_SOURCE_SHA",
    "sync_app_preview",
    "PREVIEW_SOURCE_COMMIT.txt",
    "hado_version.js",
    "hado_styles.css",
    "./hado_styles.css",
    "feature/app-3.0.0.0",
    "Verify preview Pages deployment workflow exists",
    "Wait for preview repository sync commit",
    "Dispatch preview Pages deployment workflow",
    "actions/workflows/jekyll-gh-pages.yml/dispatches",
    "PREVIEW_REPO_TOKEN",
    "jekyll-gh-pages.yml",
    "actions/deploy-pages",
    "actions/jekyll-build-pages",
)
FORBIDDEN = ("workflow_dispatch:", "schedule:", "app_branch_updated", "branches-ignore:")


def main() -> int:
    text = WORKFLOW.read_text(encoding="utf-8")
    missing = [snippet for snippet in REQUIRED if snippet not in text]
    forbidden = [snippet for snippet in FORBIDDEN if snippet in text]
    if missing:
        raise SystemExit("preview workflow missing: " + ", ".join(missing))
    if forbidden:
        raise SystemExit("preview workflow contains prohibited trigger: " + ", ".join(forbidden))
    print("preview workflow preflights and dispatches Pages deployment, then verifies source commit/version/css assets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
