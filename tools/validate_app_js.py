#!/usr/bin/env python3
"""Validate HADO app JavaScript syntax, JSON syntax, and root HTML presence."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def main() -> int:
    js_files = sorted(ROOT.glob('*.js')) + sorted((ROOT / 'src').rglob('*.js'))
    json_files = sorted(ROOT.glob('*.json'))
    for path in json_files:
        json.loads(path.read_text(encoding='utf-8'))
    for path in js_files:
        subprocess.run(['node', '--check', str(path)], check=True)
    index = ROOT / 'index.html'
    if not index.is_file() or not index.read_text(encoding='utf-8').strip():
        raise SystemExit('index.html is missing or empty')
    print(f'validated: js={len(js_files)}, json={len(json_files)}, html=ok')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
