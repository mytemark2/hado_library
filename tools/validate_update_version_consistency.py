#!/usr/bin/env python3
"""Validate Update display version has one runtime definition and active HTML loading."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def script_sources(html: str) -> list[str]:
    return re.findall(r'<script\s+src="\./([^"]+\.js)"\s*>\s*</script>', html)


def main() -> int:
    meta = json.loads((ROOT / "HADO_DEV_INFO.json").read_text(encoding="utf-8"))
    update_no = str(meta.get("updateNo", "")).strip()
    release_version = str(meta.get("releaseVersion", "")).strip()
    display_version = str(meta.get("displayVersion", "")).strip()
    expected_display = f"{release_version} Update{update_no}"
    if display_version != expected_display:
        raise SystemExit(f"displayVersion mismatch: {display_version} != {expected_display}")

    update_meta_js = (ROOT / "hado_update_meta.js").read_text(encoding="utf-8")
    rel_match = re.search(r"releaseVersion:\s*'([^']+)'", update_meta_js)
    update_match = re.search(r"updateNo:\s*'([^']+)'", update_meta_js)
    if not rel_match or not update_match:
        raise SystemExit("hado_update_meta.js does not define HADO_VERSION releaseVersion/updateNo")
    if rel_match.group(1) != release_version or update_match.group(1) != update_no:
        raise SystemExit(
            "hado_update_meta.js HADO_VERSION mismatch: "
            f"{rel_match.group(1)} Update{update_match.group(1)} != {display_version}"
        )

    candidate_js = (ROOT / "hado_type_candidates.js").read_text(encoding="utf-8")
    hardcoded = re.findall(r"3\.0\.0\.0 Update\d+(?:\.\d+)?", candidate_js)
    if hardcoded:
        raise SystemExit(f"hado_type_candidates.js contains hardcoded display versions: {hardcoded}")

    for html_name in ("index.html", "hado_library_3.0.0.0.html"):
        sources = script_sources((ROOT / html_name).read_text(encoding="utf-8"))
        if "hado_update_meta.js" not in sources:
            raise SystemExit(f"{html_name} does not load hado_update_meta.js")
        if "hado_type_candidates.js" in sources and sources.index("hado_update_meta.js") > sources.index("hado_type_candidates.js"):
            raise SystemExit(f"{html_name} loads hado_update_meta.js after hado_type_candidates.js")
    print(f"update version consistency ok: {display_version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
