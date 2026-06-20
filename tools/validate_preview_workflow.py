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
    "find \"${PREVIEW_DIR}\" -mindepth 1 -maxdepth 1",
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
    "sync preview from ${APP_REF}: ${SOURCE_COMMIT}",
    "PREVIEW_REPO_TOKEN",
    "Preview Pages workflow .github/workflows/jekyll-gh-pages.yml was not found",
    "PREVIEW_PAGES_WORKFLOW",
    "cancel-in-progress: true",
    "Verify public preview deployment",
    "https://mytemark2.github.io/hado_library-preview",
    "PREVIEW_SOURCE_COMMIT.txt?cb=",
    "PREVIEW_DISPLAY_VERSION.txt?cb=",
    "Public preview matches ${SOURCE_COMMIT} / ${DISPLAY_VERSION}",
)
FORBIDDEN = (
    "workflow_dispatch:",
    "schedule:",
    "sync_app_preview",
    "repository_dispatch",
    "branches-ignore:",
    "branches:\n      - '**'",
    "codex/",
    "identify-and-propose-ui",
    "git clone --depth 1 --branch feature/app-3.0.0.0",
    "rsync -a --delete",
    "Verify preview reflects source commit and version assets",
    "actions/workflows/jekyll-gh-pages.yml/dispatches",
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
    print("preview workflow rejects non-canonical branches, patches preview Pages concurrency, syncs runtime assets, and verifies public deployment markers")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
