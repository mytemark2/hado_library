#!/usr/bin/env python3
"""Ensure formation detail-link helpers are available in the active HTML script set."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ("formationEntityLinkHtml", "formationAutoLinkHtml")


def script_sources(html: str) -> list[str]:
    return re.findall(r'<script\s+src="\./([^"]+\.js)"\s*>\s*</script>', html)


def main() -> int:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    sources = script_sources(html)
    if not sources:
        raise SystemExit("no script sources found in index.html")
    active_text = "\n".join((ROOT / src).read_text(encoding="utf-8") for src in sources)
    legacy_text = (ROOT / "hado_app.js").read_text(encoding="utf-8") if (ROOT / "hado_app.js").exists() else ""
    for name in REQUIRED:
        active_defined = re.search(rf"function\s+{re.escape(name)}\s*\(", active_text)
        legacy_defined = re.search(rf"function\s+{re.escape(name)}\s*\(", legacy_text)
        if not active_defined:
            suffix = " (legacy hado_app.js has it but is not loaded)" if legacy_defined else ""
            raise SystemExit(f"{name} is not defined by active HTML scripts{suffix}")
    print("formation link helpers available in active scripts: " + ", ".join(REQUIRED))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
