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
js = js.replace('/* HADO app 3.0.0.0 Update03.2: type formation entry navigator */', '/* HADO app 3.0.0.0 Update03.3: type formation entry navigator */')
js = js.replace(
    "    const q = norm(state.query);\n    const generals = state.data.generals.filter((v) => !q || norm(v.displayName || v.name).includes(q));\n    return `<div class=\"hte-card\"><div class=\"hte-title\">主将を選択</div><input class=\"hte-search\" id=\"hadoTypeEntryQuery\" placeholder=\"主将名で絞り込み\" value=\"${esc(state.query)}\"><div class=\"hte-list\">${generals.map((g) => `<button class=\"hte-item\" data-main-id=\"${esc(g.id)}\">${esc(g.displayName || g.name)}</button>`).join('')}</div><div class=\"hte-note\" style=\"margin-top:8px\">上ほど新しい武将です。</div></div>`;",
    "    const q = norm(state.query);\n    const generals = state.data.generals;\n    return `<div class=\"hte-card\"><div class=\"hte-title\">主将を選択</div><input class=\"hte-search\" id=\"hadoTypeEntryQuery\" placeholder=\"主将名で絞り込み\" value=\"${esc(state.query)}\"><div class=\"hte-list\">${generals.map((g) => `<button class=\"hte-item\" data-main-id=\"${esc(g.id)}\" ${q && !norm(g.displayName || g.name).includes(q) ? 'hidden' : ''}>${esc(g.displayName || g.name)}</button>`).join('')}</div><div class=\"hte-note\" style=\"margin-top:8px\">上ほど新しい武将です。IME変換確定後に候補を絞り込みます。</div></div>`;"
)
js = js.replace('3.0.0.0 Update03.2 / 主将単体の参考適合度', '3.0.0.0 Update03.3 / 主将単体の参考適合度')
js = js.replace(
    "    document.getElementById('hadoTypeEntryQuery')?.addEventListener('input', (e) => { state.query = e.target.value; render(); document.getElementById('hadoTypeEntryQuery')?.focus(); });",
    "    const queryInput = document.getElementById('hadoTypeEntryQuery');\n    if (queryInput) {\n      let composing = false;\n      const applyMainFilter = () => {\n        state.query = queryInput.value;\n        const q = norm(state.query);\n        modal.querySelectorAll('[data-main-id]').forEach((button) => {\n          const general = state.data.generals.find((g) => g.id === button.dataset.mainId);\n          button.hidden = Boolean(q) && !norm(general?.displayName || general?.name).includes(q);\n        });\n      };\n      queryInput.addEventListener('compositionstart', () => { composing = true; });\n      queryInput.addEventListener('compositionend', () => { composing = false; applyMainFilter(); });\n      queryInput.addEventListener('input', (e) => {\n        state.query = e.target.value;\n        if (!composing && !e.isComposing) applyMainFilter();\n      });\n    }"
)

required = [
    'Update03.3',
    "compositionstart",
    "compositionend",
    "applyMainFilter",
    "button.hidden = Boolean(q)",
    "IME変換確定後に候補を絞り込みます。"
]
for token in required:
    if token not in js:
        raise SystemExit(f'Update03.3 JavaScript audit failed: {token} missing')
if "state.query = e.target.value; render();" in js:
    raise SystemExit('Update03.3 JavaScript audit failed: input-triggered full render remains')
JS_PATH.write_text(js, encoding='utf-8')

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
    'revision': 3,
    'displayVersion': '3.0.0.0 Update03.3',
    'summary': 'Update03.3: make main-general filtering IME-safe by keeping the input DOM stable and filtering candidate visibility after composition confirmation.',
    'updatedAt': '2026-06-06T00:00:00+09:00'
})
info_path.write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

report = {
    'version': '3.0.0.0',
    'update': 'Update03.3',
    'bugClass': 'IME composition broken by input-triggered full DOM rerender',
    'rootCause': 'The input event called render(), replacing the text field while Japanese IME composition was active and resetting the caret.',
    'fixes': [
        'do not rerender the modal on main-general query input',
        'keep all main-general candidate DOM nodes mounted',
        'toggle candidate hidden state instead of rebuilding the list',
        'pause filtering between compositionstart and compositionend',
        'apply filtering after Japanese conversion is confirmed',
        'support query deletion so previously hidden candidates reappear'
    ],
    'regressionChecks': [
        'compositionstart handler exists',
        'compositionend handler exists',
        'input-triggered full render is absent',
        'index.html and standalone HTML are identical'
    ],
    'indexSha256': hashlib.sha256(index_bytes).hexdigest()
}
report_path = ROOT / 'report/HADO_APP_3.0.0.0_UPDATE03.3_REPORT.json'
report_path.parent.mkdir(exist_ok=True)
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
