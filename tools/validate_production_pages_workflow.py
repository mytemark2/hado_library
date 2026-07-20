#!/usr/bin/env python3
"""Validate the canonical main-branch production Pages deployment workflow."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "deploy-production-pages.yml"

REQUIRED = (
    "name: Deploy Hado Library Production Pages",
    "branches:\n      - main",
    "pages: write",
    "id-token: write",
    "group: hado-library-production-pages",
    "cancel-in-progress: false",
    "uses: actions/checkout@v5",
    "uses: actions/configure-pages@v5",
    "name: Verify production runtime assets",
    "test -s hado_version.js",
    "test -s hado_formation.js",
    "test -s hado_styles.css",
    "test -s hadou_generals.json",
    "test -s hadou_search_index.json",
    "uses: actions/upload-pages-artifact@v3",
    "path: .",
    "uses: actions/deploy-pages@v5",
)

FORBIDDEN = (
    "workflow_dispatch:",
    "schedule:",
    "hado-2.9.6.5",
    "actions/jekyll-build-pages",
)


def main() -> int:
    if not WORKFLOW.is_file():
        raise SystemExit(f"production Pages workflow is missing: {WORKFLOW}")
    text = WORKFLOW.read_text(encoding="utf-8")
    missing = [needle for needle in REQUIRED if needle not in text]
    forbidden = [needle for needle in FORBIDDEN if needle in text]
    if missing:
        raise SystemExit("production Pages workflow missing: " + ", ".join(missing))
    if forbidden:
        raise SystemExit("production Pages workflow contains forbidden pattern: " + ", ".join(forbidden))
    print("production Pages workflow is main-push-triggered, static, and guarded by required runtime assets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
