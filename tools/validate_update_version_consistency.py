#!/usr/bin/env python3
"""Validate the visible app version has exactly one runtime definition."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION_JS = ROOT / "hado_version.js"
HTML_FILES = ("index.html", "hado_library_3.0.0.0.html")
DERIVED_KEYS = {"releaseVersion", "updateNo", "displayVersion", "revision"}


def script_sources(html: str) -> list[str]:
    return re.findall(r'<script\s+src="\./([^"]+\.js)"\s*>\s*</script>', html)


def version_field(source: str, key: str) -> str:
    match = re.search(rf"{key}:\s*'([^']+)'", source)
    if not match:
        raise SystemExit(f"hado_version.js missing {key}")
    return match.group(1)


def number_field(source: str, key: str) -> int:
    match = re.search(rf"{key}:\s*(\d+)", source)
    if not match:
        raise SystemExit(f"hado_version.js missing {key}")
    return int(match.group(1))


def main() -> int:
    version_source = VERSION_JS.read_text(encoding="utf-8")
    release_version = version_field(version_source, "releaseVersion")
    update_no = version_field(version_source, "updateNo")
    revision = number_field(version_source, "revision")
    display_version = f"{release_version} Update{update_no}"

    dev_info = json.loads((ROOT / "HADO_DEV_INFO.json").read_text(encoding="utf-8"))
    duplicated = sorted(DERIVED_KEYS.intersection(dev_info))
    if duplicated:
        raise SystemExit("HADO_DEV_INFO.json duplicates version fields: " + ", ".join(duplicated))
    if dev_info.get("versionSource") != "hado_version.js":
        raise SystemExit("HADO_DEV_INFO.json must point versionSource to hado_version.js")

    update_meta_js = (ROOT / "hado_update_meta.js").read_text(encoding="utf-8")
    if "const HADO_VERSION" in update_meta_js or re.search(r"updateNo:\s*'", update_meta_js):
        raise SystemExit("hado_update_meta.js must not define runtime version constants")
    if "window.HADO_VERSION" not in update_meta_js:
        raise SystemExit("hado_update_meta.js must read window.HADO_VERSION")

    workflow = (ROOT / ".github" / "workflows" / "notify-preview.yml").read_text(encoding="utf-8")
    if "hado_version.js" not in workflow:
        raise SystemExit("preview workflow must read hado_version.js")
    if "with open('HADO_DEV_INFO.json'" in workflow:
        raise SystemExit("preview workflow must not read displayVersion from HADO_DEV_INFO.json")

    for html_name in HTML_FILES:
        sources = script_sources((ROOT / html_name).read_text(encoding="utf-8"))
        for required in ("hado_version.js", "hado_update_meta.js"):
            if required not in sources:
                raise SystemExit(f"{html_name} does not load {required}")
        if sources.index("hado_version.js") > sources.index("hado_update_meta.js"):
            raise SystemExit(f"{html_name} loads hado_version.js after hado_update_meta.js")
        if "hado_type_candidates.js" in sources and sources.index("hado_update_meta.js") > sources.index("hado_type_candidates.js"):
            raise SystemExit(f"{html_name} loads hado_update_meta.js after hado_type_candidates.js")

    print(f"update version consistency ok: {display_version} (revision {revision}, single source hado_version.js)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
