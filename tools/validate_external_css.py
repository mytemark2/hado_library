#!/usr/bin/env python3
"""Validate main HTML files use external CSS instead of embedded style blocks/attributes."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = ("index.html", "hado_library_3.0.0.0.html")
CSS_FILE = "hado_styles.css"
LINK = f'<link href="./{CSS_FILE}" rel="stylesheet"/>'


def main() -> int:
    css = ROOT / CSS_FILE
    if not css.is_file() or not css.read_text(encoding="utf-8").strip():
        raise SystemExit(f"{CSS_FILE} is missing or empty")
    errors: list[str] = []
    for name in HTML_FILES:
        text = (ROOT / name).read_text(encoding="utf-8")
        if "<style" in text or "</style>" in text:
            errors.append(f"{name} still contains a <style> block")
        if "style=" in text:
            errors.append(f"{name} still contains inline style attributes")
        if LINK not in text:
            errors.append(f"{name} does not reference {CSS_FILE}")
    if errors:
        raise SystemExit("\n".join(errors))
    print("external CSS ok: HTML references hado_styles.css and has no style blocks/attributes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
