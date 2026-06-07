#!/usr/bin/env python3
"""Validate HADO app JavaScript syntax, JSON syntax, and duplicated HTML identity."""
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
    distribution = ROOT / 'hado_library_3.0.0.0.html'
    if index.read_bytes() != distribution.read_bytes():
        raise SystemExit('HTML mismatch: index.html != hado_library_3.0.0.0.html')
    print(f'validated: js={len(js_files)}, json={len(json_files)}, html_identity=ok')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
