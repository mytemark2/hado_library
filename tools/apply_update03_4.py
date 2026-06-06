from pathlib import Path
from datetime import datetime, timezone, timedelta
import hashlib
import json
import re

ROOT = Path('.')
START = '<!-- HADO_UPDATE03_START -->'
END = '<!-- HADO_UPDATE03_END -->'
JS_PATH = ROOT / 'src/update03_type_entry.js'
TARGETS = [ROOT / 'index.html', ROOT / 'hado_library_3.0.0.0.html']

js = JS_PATH.read_text(encoding='utf-8')
required = [
    'Update03.4',
    'WIZARD_STEPS',
    "main: ['main', 'purpose', 'type', 'confirm']",
    "purpose: ['purpose', 'type', 'confirm']",
    "type: ['type', 'confirm']",
    'renderStepProgress',
    'renderConfirmStep',
    'data-action="back"',
    'data-action="next"',
    'compositionstart',
    'compositionend',
    'applyMainFilter',
    'button.hidden = Boolean(q)',
    'IME変換中は候補DOMを作り直さず、変換確定後に表示・非表示だけを切り替えます。'
]
for token in required:
    if token not in js:
        raise SystemExit(f'Update03.4 JavaScript audit failed: {token} missing')
for forbidden in [
    "state.query = e.target.value; render();",
    "${state.mode === 'main' ? renderMainPane() : ''}${state.mode !== 'type' ? renderPurposes() : ''}",
    'Update03.3 / 主将単体の参考適合度'
]:
    if forbidden in js:
        raise SystemExit(f'Update03.4 JavaScript audit failed: forbidden token remains: {forbidden}')

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

updated_at = datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds')
info_path = ROOT / 'HADO_DEV_INFO.json'
info = json.loads(info_path.read_text(encoding='utf-8'))
info.update({
    'releaseStatus': 'development',
    'releaseVersion': '3.0.0.0',
    'updateNo': '03',
    'revision': 4,
    'displayVersion': '3.0.0.0 Update03.4',
    'summary': 'Update03.4: replace simultaneous navigator panes with method-specific sequential wizard steps while preserving IME-safe main-general filtering.',
    'updatedAt': updated_at
})
info_path.write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

report = {
    'version': '3.0.0.0',
    'update': 'Update03.4',
    'bugClass': 'Navigator information architecture did not guide users through one decision at a time',
    'rootCause': 'The three entry methods were displayed as tabs, but the active method still rendered multiple selection panes simultaneously. The user had to infer the order of operations.',
    'fixes': [
        'define method-specific wizard sequences',
        'main-general entry: main general -> purpose -> type -> confirmation',
        'purpose entry: purpose -> type -> confirmation',
        'direct type entry: type -> confirmation',
        'show one decision pane at a time with explicit progress, back and next controls',
        'retain the 10-point fixed-five-metric score introduced in Update03.2',
        'retain the Update03.3 IME-safe candidate filtering with stable input and candidate DOM nodes'
    ],
    'regressionChecks': [
        'wizard sequences exist for all three entry methods',
        'step progress, back, next and confirmation rendering exist',
        'simultaneous multi-pane rendering from Update03.3 is absent',
        'compositionstart and compositionend handlers exist',
        'input-triggered full render is absent',
        'index.html and standalone HTML are identical'
    ],
    'indexSha256': hashlib.sha256(index_bytes).hexdigest()
}
report_path = ROOT / 'report/HADO_APP_3.0.0.0_UPDATE03.4_REPORT.json'
report_path.parent.mkdir(exist_ok=True)
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
