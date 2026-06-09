from pathlib import Path
import hashlib
import json
import re

ROOT = Path('.')
START = '<!-- HADO_UPDATE03_START -->'
END = '<!-- HADO_UPDATE03_END -->'
JS_PATH = ROOT / 'src/update03_type_entry.js'
TARGETS = [ROOT / 'index.html', ROOT / 'hado_library_3.0.0.0.html']

js = JS_PATH.read_text(encoding='utf-8')
block = f'{START}<script>\n{js}\n</script>{END}'

for path in TARGETS:
    if not path.exists():
        raise SystemExit(f'missing HTML: {path}')
    html = path.read_text(encoding='utf-8')
    html = re.sub(re.escape(START) + r'.*?' + re.escape(END), '', html, flags=re.S)
    if '</body>' not in html:
        raise SystemExit(f'</body> not found: {path}')
    path.write_text(html.replace('</body>', block + '</body>', 1), encoding='utf-8')

index_bytes = (ROOT / 'index.html').read_bytes()
standalone_bytes = (ROOT / 'hado_library_3.0.0.0.html').read_bytes()
if index_bytes != standalone_bytes:
    raise SystemExit('index.html and standalone HTML differ')

info_path = ROOT / 'HADO_DEV_INFO.json'
info = json.loads(info_path.read_text(encoding='utf-8'))
info.update({
    'releaseStatus': 'development',
    'releaseVersion': '3.0.0.0',
    'updateNo': '03',
    'revision': 2,
    'displayVersion': '3.0.0.0 Update03.2',
    'summary': 'Update03.2: normalize main-general reference fit scores to 0-10 using five fixed metrics per type and prevent annihilation-type inflation.',
    'updatedAt': '2026-06-06T00:00:00+09:00'
})
info_path.write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

report = {
    'version': '3.0.0.0',
    'update': 'Update03.2',
    'scoreLabel': '主将参考適合度',
    'scoreScale': '0-10',
    'scoreFormula': 'matched fixed metrics / 5 * 10; each fixed metric = 2 points',
    'purposeFormula': 'maximum type score among recommended types for the purpose',
    'inflationPrevention': [
        'do not add points from candidate count',
        'do not add points from broad feature count',
        'use only five fixed metrics declared for each type',
        'cap each type score at 10'
    ],
    'ui': [
        'display score as x/10',
        'display matched fixed metric count as x/5',
        'display matched metric labels',
        'preserve responsive layout and main-general reselection'
    ],
    'indexSha256': hashlib.sha256(index_bytes).hexdigest()
}
report_path = ROOT / 'report/HADO_APP_3.0.0.0_UPDATE03.2_REPORT.json'
report_path.parent.mkdir(exist_ok=True)
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
