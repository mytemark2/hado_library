#!/usr/bin/env python3
"""Validate preview notification workflow uses the minimal runtime-file sync."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "notify-preview.yml"
REQUIRED = (
    "uses: actions/checkout@v4",
    "branches:\n      - feature/app-3.0.0.0",
    "concurrency:",
    "group: hado-library-preview-sync",
    "for attempt in 1 2 3",
    "Preview repository main changed during push; retrying with a fresh clone.",
    "Preview repository push failed after ${attempt} attempts",
    "Sync preview repository contents",
    "git clone --depth 1",
    "mytemark2/hado_library-preview.git",
    "find \"${PREVIEW_DIR}\" -mindepth 1 -maxdepth 1",
    "rsync -a index.html HADO_DEV_INFO.json hado_*.js hado_styles.css hadou_*.json",
    "HADO_DEV_INFO.json",
    "cmp -s HADO_DEV_INFO.json",
    "PREVIEW_SOURCE_COMMIT.txt",
    "PREVIEW_SOURCE_BRANCH.txt",
    "PREVIEW_DISPLAY_VERSION.txt",
    'grep -q "${GITHUB_SHA}"',
    "grep -q 'setFormationScoreDetailIndex'",
    "grep -q 'data-formation-score-detail-index'",
    "grep -q 'formation-score-metric-chip'",
    "git -C \"${PREVIEW_DIR}\" push origin HEAD:main",
    "PREVIEW_REPO_TOKEN",
)
FORBIDDEN = (
    "workflow_dispatch:",
    "schedule:",
    "sync_app_preview",
    "repository_dispatch",
    "branches-ignore:",
    "branches:\n      - '**'",
    "git clone --depth 1 --branch feature/app-3.0.0.0",
    "rsync -a --delete",
    "Verify preview reflects source commit and version assets",
    "actions/workflows/jekyll-gh-pages.yml/dispatches",
)


def main() -> int:
    text = WORKFLOW.read_text(encoding="utf-8")
    missing = [snippet for snippet in REQUIRED if snippet not in text]
    forbidden = [snippet for snippet in FORBIDDEN if snippet in text]
    if missing:
        raise SystemExit("preview workflow missing: " + ", ".join(missing))
    if forbidden:
        raise SystemExit("preview workflow contains prohibited stale sync pattern: " + ", ".join(forbidden))
    print("preview workflow syncs feature/app-3.0.0.0 runtime assets with source commit marker and UI contract checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
