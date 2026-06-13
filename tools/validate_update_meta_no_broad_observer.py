#!/usr/bin/env python3
"""Validate update metadata sync does not observe the whole DOM tree."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "hado_update_meta.js").read_text(encoding="utf-8")
FORBIDDEN = (
    "new MutationObserver",
    "document.documentElement",
    "subtree: true",
)
REQUIRED = (
    "window.HADO_SYNC_VISIBLE_VERSION",
    "hado:version-sync-request",
    "pageshow",
)


def main() -> int:
    forbidden = [snippet for snippet in FORBIDDEN if snippet in SOURCE]
    if forbidden:
        raise SystemExit("broad update-meta observer remains: " + ", ".join(forbidden))
    missing = [snippet for snippet in REQUIRED if snippet not in SOURCE]
    if missing:
        raise SystemExit("explicit update-meta sync hook missing: " + ", ".join(missing))
    print("update meta sync avoids broad DOM MutationObserver")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
