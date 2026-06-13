#!/usr/bin/env python3
"""Validate internal PR auto-merge workflow contract."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "auto-merge-codex-pr.yml"
REQUIRED = (
    "name: Auto-merge Internal PR",
    "pull_request_target:",
    "contents: write",
    "pull-requests: write",
    "github.event.pull_request.head.repo.full_name == github.repository",
    "github.event.pull_request.draft == false",
    "uses: actions/github-script@v7",
    "enablePullRequestAutoMerge",
    "mergeMethod:MERGE",
    "autoMergeRequest",
)
FORBIDDEN = (
    "actions/checkout",
    "pull_request:\n",
    "workflow_dispatch:",
)


def main() -> int:
    if not WORKFLOW.is_file():
        raise SystemExit("auto-merge workflow is missing")
    text = WORKFLOW.read_text(encoding="utf-8")
    missing = [snippet for snippet in REQUIRED if snippet not in text]
    forbidden = [snippet for snippet in FORBIDDEN if snippet in text]
    if missing:
        raise SystemExit("auto-merge workflow missing: " + ", ".join(missing))
    if forbidden:
        raise SystemExit("auto-merge workflow contains unsafe/manual pattern: " + ", ".join(forbidden))
    print("auto-merge workflow ok: same-repository non-draft PRs enable auto-merge without checkout")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
