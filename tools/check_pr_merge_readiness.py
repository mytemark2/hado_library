#!/usr/bin/env python3
"""Check that the current branch can merge into the canonical app base branch.

This is an operator/Codex pre-PR guard, not a normal offline app validator. It
intentionally contacts GitHub and fails closed when the remote branch cannot be
fetched, because mergeability cannot be proven from a stale local checkout.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REMOTE_URL = "https://github.com/mytemark2/hado_library.git"


def run(cmd: list[str], *, cwd: Path = ROOT, check: bool = True) -> subprocess.CompletedProcess[str]:
    print("$ " + " ".join(cmd), flush=True)
    result = subprocess.run(cmd, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if result.stdout:
        print(result.stdout, end="")
    if check and result.returncode != 0:
        raise SystemExit(result.returncode)
    return result


def git_stdout(args: list[str], *, cwd: Path = ROOT) -> str:
    result = subprocess.run(["git", *args], cwd=cwd, check=True, text=True, stdout=subprocess.PIPE)
    return result.stdout.strip()


def ensure_remote(remote: str, remote_url: str) -> None:
    result = run(["git", "remote", "get-url", remote], check=False)
    if result.returncode == 0:
        return
    if not remote_url:
        raise SystemExit(f"remote '{remote}' is missing and no remote URL was provided")
    run(["git", "remote", "add", remote, remote_url])


def require_clean_worktree() -> None:
    status = git_stdout(["status", "--porcelain"])
    if status:
        print(status)
        raise SystemExit("working tree is not clean; commit or discard changes before checking PR mergeability")


def check_merge(remote: str, base_branch: str) -> None:
    base_ref = f"refs/remotes/{remote}/{base_branch}"
    base_sha = git_stdout(["rev-parse", base_ref])
    head_sha = git_stdout(["rev-parse", "HEAD"])
    merge_base = git_stdout(["merge-base", "HEAD", base_ref])
    current_branch = git_stdout(["branch", "--show-current"])

    print(f"current branch: {current_branch}")
    print(f"head sha: {head_sha}")
    print(f"base branch: {base_branch}")
    print(f"base sha: {base_sha}")
    print(f"merge-base sha: {merge_base}")

    tmp_root = Path(tempfile.mkdtemp(prefix="hado-merge-check-", dir=str(ROOT.parent)))
    worktree = tmp_root / "worktree"
    try:
        run(["git", "worktree", "add", "--detach", str(worktree), "HEAD"])
        result = run(["git", "merge", "--no-commit", "--no-ff", base_ref], cwd=worktree, check=False)
        if result.returncode != 0:
            run(["git", "status", "--short"], cwd=worktree, check=False)
            raise SystemExit("merge readiness check failed: resolve conflicts against the latest canonical base before opening a PR")
        run(["git", "merge", "--abort"], cwd=worktree, check=False)
    finally:
        run(["git", "worktree", "remove", "--force", str(worktree)], check=False)
        shutil.rmtree(tmp_root, ignore_errors=True)

    print("merge readiness check passed: current HEAD merges cleanly with latest canonical base")


def main() -> int:
    parser = argparse.ArgumentParser(description="Fail closed unless the current HEAD can merge cleanly into the canonical app base branch.")
    parser.add_argument("--remote", default="origin", help="Git remote name to fetch from")
    parser.add_argument("--remote-url", default=DEFAULT_REMOTE_URL, help="Remote URL to add if the remote is missing; use an empty value to disable auto-add")
    parser.add_argument("--base", default="feature/app-3.0.0.0", help="Canonical base branch for application PRs")
    args = parser.parse_args()

    require_clean_worktree()
    ensure_remote(args.remote, args.remote_url)
    run(["git", "fetch", args.remote, args.base, "--prune"])
    check_merge(args.remote, args.base)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
