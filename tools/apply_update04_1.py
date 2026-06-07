from pathlib import Path
from datetime import datetime, timezone, timedelta
import hashlib, json, re

ROOT=Path('.')
START='<!-- HADO_UPDATE04_START -->'
END='<!-- HADO_UPDATE04_END -->'
JS_PATH=ROOT/'src/update04_type_candidates.js'
TARGETS=[ROOT/'index.html', ROOT/'hado_library_3.0.0.0.html']

js=JS_PATH.read_text(encoding='utf-8')
required=[
  'Update04.1.1',
  'hado.typeEntry.selection.v1',
  'hado:type-search-entry-selected',
  'hadou_type_search_role_index.json',
  'ROLES',
  "'main_general'",
  "'vice_general'",
  "'support_general'",
  "'attendant'",
  "'equipment'",
  "'formation'",
  "'siege_weapon'",
  "'warhorse'",
  "'warhorse_skill'",
  '参考一致数',
  '異なる型同士の順位付けには使いません',
  '配置や成立判定は行いません',
  '候補表示のみです。自動配置・保存データ変更は行いません。',
  'function chipLabel(',
  'function chipLabels(',
  'x.label||x.statusEffectName||x.displayName||x.name||x.featureId',
  'new Set('
]
for token in required:
  if token not in js:
    raise SystemExit(f'Update04.1.1 JS audit failed: missing {token}')
for forbidden in ['evaluationTypeId=', 'candidateTray=', "localStorage.setItem('hado.formation", 'autoPlace', "${esc(x)}</span>`).join('')"]:
  if forbidden in js:
    raise SystemExit(f'Update04.1.1 safety audit failed: forbidden token {forbidden}')

block=f'{START}<script>\n{js}\n</script>{END}'
for path in TARGETS:
  if not path.exists():
    raise SystemExit(f'missing HTML: {path}')
  html=path.read_text(encoding='utf-8')
  html=re.sub(re.escape(START)+r'.*?'+re.escape(END),'',html,flags=re.S)
  if '</body>' not in html:
    raise SystemExit(f'</body> not found: {path}')
  path.write_text(html.replace('</body>',block+'</body>',1),encoding='utf-8')

index=(ROOT/'index.html').read_bytes(); standalone=(ROOT/'hado_library_3.0.0.0.html').read_bytes()
if index!=standalone:
  raise SystemExit('index.html and standalone HTML differ')

updated=datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds')
info_path=ROOT/'HADO_DEV_INFO.json'
info=json.loads(info_path.read_text(encoding='utf-8'))
info.update({
  'releaseStatus':'development',
  'releaseVersion':'3.0.0.0',
  'updateNo':'04',
  'revision':'1.1',
  'displayVersion':'3.0.0.0 Update04.1.1',
  'summary':'Update04.1.1: normalize object-valued type feature and status-effect chips to readable labels, remove empty labels, and deduplicate chips. Candidate display remains read-only.',
  'updatedAt':updated
})
info_path.write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

report={
  'version':'3.0.0.0',
  'update':'Update04.1.1',
  'bugClass':'object-valued feature chip rendering',
  'rootCause':'typeFeatures and statusEffectRefs contain objects, but the view passed each object directly to String()',
  'fixes':['prefer label/statusEffectName/displayName/name/featureId','remove empty labels','deduplicate chip labels','retain candidate-only safety boundary'],
  'roleCount':9,
  'safety':{
    'candidateDisplayOnly':True,
    'autoPlacement':False,
    'formationSaveMutation':False,
    'existingFormationGateBypass':False
  },
  'regressionChecks':['chipLabel normalizer','chipLabels deduplication','no direct object String rendering','nine role tabs','selected type display','same-type reference match count','HTML equality'],
  'indexSha256':hashlib.sha256(index).hexdigest()
}
for name in ['HADO_APP_3.0.0.0_UPDATE04.1_REPORT.json','HADO_APP_3.0.0.0_UPDATE04.1.1_REPORT.json']:
  rp=ROOT/'report'/name; rp.parent.mkdir(exist_ok=True)
  rp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
