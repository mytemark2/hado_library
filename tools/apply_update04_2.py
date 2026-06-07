from pathlib import Path
from datetime import datetime, timezone, timedelta
import hashlib, json, re

ROOT=Path('.')
SCORE=ROOT/'hadou_type_score_rules.json'
PURPOSE=ROOT/'hadou_type_purpose_rules.json'
JS=ROOT/'src/update04_type_candidates.js'
TARGETS=[ROOT/'index.html',ROOT/'hado_library_3.0.0.0.html']
START='<!-- HADO_UPDATE04_START -->'; END='<!-- HADO_UPDATE04_END -->'

vaccine={
  'typeId':'vaccine',
  'typeName':'ワクチン型',
  'description':'自部隊の不利対策と、味方への非ダメージ支援を持つ候補を確認する。',
  'metrics':[
    {'metricKey':'self_disadvantage_countermeasure','label':'自部隊不利対策','method':'presence_fixed','basis':100},
    {'metricKey':'ally_non_damage_effect','label':'味方非ダメージ効果','method':'presence_fixed','basis':100},
    {'metricKey':'weakening_nullify','label':'弱化無効','method':'presence_fixed','basis':100},
    {'metricKey':'weakening_remove','label':'弱化解除','method':'presence_fixed','basis':100},
    {'metricKey':'ally_wounded_recovery','label':'味方負傷兵回復','method':'percent_sum_or_presence','basis':100}
  ]
}
score=json.loads(SCORE.read_text(encoding='utf-8'))
for key in ['types','items']:
  arr=score.get(key) or []
  if not any(v.get('typeId')=='vaccine' for v in arr): arr.append(vaccine)
  score[key]=arr
score.setdefault('policy',{})['typeCount']=16
score['updateNo']='04.2'; score['status']='vaccine-type-and-zero-match-exclusion'
SCORE.write_text(json.dumps(score,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')

purpose=json.loads(PURPOSE.read_text(encoding='utf-8'))
links={
  'wall_defense':'自部隊の不利対策と味方への非ダメージ支援で、防衛継続力を高める。',
  'garrison':'自部隊の不利対策と味方への非ダメージ支援で、駐屯部隊を維持する。',
  'buff_support':'味方への非ダメージ支援と不利対策をまとめて確認する。'
}
for key in ['purposes','items']:
  for p in purpose.get(key) or []:
    pid=p.get('purposeId')
    if pid not in links: continue
    sec=p.setdefault('secondaryTypes',[])
    if not any(v.get('typeId')=='vaccine' for v in sec): sec.append({'typeId':'vaccine','reason':links[pid]})
    rec=p.setdefault('recommendedTypeIds',[])
    if 'vaccine' not in rec: rec.append('vaccine')
    p['hiddenTypeIds']=[v for v in p.get('hiddenTypeIds',[]) if v!='vaccine']
purpose['updateNo']='04.2'; purpose['status']='vaccine-type-and-zero-match-exclusion'
PURPOSE.write_text(json.dumps(purpose,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')

js=JS.read_text(encoding='utf-8')
js=js.replace('/* HADO app 3.0.0.0 Update04.1.1: normalize object feature chips in selected-type role candidate browser */','/* HADO app 3.0.0.0 Update04.2: vaccine type and zero-match candidate exclusion */')
wide="self_disadvantage_countermeasure:['自部隊不利対策','自部隊耐性強化','弱化無効','弱化解除','状態変化無効','回避','無視','耐性'],ally_non_damage_effect:['味方非ダメージ効果','味方部隊','有利変化','強化効果','弱化解除','状態変化無効','負傷兵回復','防御','耐性']"
narrow="self_disadvantage_countermeasure:['自部隊不利対策','skill_effect:self_disadvantage_countermeasure'],ally_non_damage_effect:['味方非ダメージ効果','skill_effect:ally_non_damage_effect']"
if wide in js:
  js=js.replace(wide,narrow,1)
elif narrow not in js:
  js=js.replace("ally_defense_buff:['味方防御上昇','味方部隊の防御'],combat_start_tactic_gauge:['交戦開始時戦法ゲージ']", "ally_defense_buff:['味方防御上昇','味方部隊の防御'],combat_start_tactic_gauge:['交戦開始時戦法ゲージ'],"+narrow)
old="function rows(){const q=norm(st.q);return st.data.roles.filter(v=>v.roleId===st.role).map(v=>({...v,_s:score(v)})).filter(v=>!q||norm(flat([v.displayName,v.name,v.typeFeatures,v.statusEffectRefs])).includes(q)).sort((a,b)=>b._s.matched.length-a._s.matched.length||Number(a.sourceIndex||0)-Number(b.sourceIndex||0))}"
new="function roleRows(role){const q=norm(st.q);return st.data.roles.filter(v=>v.roleId===role).map(v=>({...v,_s:score(v)})).filter(v=>v._s.matched.length>0).filter(v=>!q||norm(flat([v.displayName,v.name,v.typeFeatures,v.statusEffectRefs])).includes(q)).sort((a,b)=>b._s.matched.length-a._s.matched.length||Number(a.sourceIndex||0)-Number(b.sourceIndex||0))}\nfunction rows(){return roleRows(st.role)}"
if old in js: js=js.replace(old,new,1)
elif 'function roleRows(role)' not in js: raise SystemExit('rows patch source not found')
js=js.replace("${ROLES.map(([id,l])=>`<button class=\"htc-tab ${st.role===id?'on':''}\" data-role=\"${id}\">${l} (${st.data.roles.filter(v=>v.roleId===id).length})</button>`).join('')}", "${ROLES.map(([id,l])=>`<button class=\"htc-tab ${st.role===id?'on':''}\" data-role=\"${id}\">${l} (${roleRows(id).length})</button>`).join('')}")
js=js.replace('3.0.0.0 Update04.1.1 / 選択中の型:','3.0.0.0 Update04.2 / 選択中の型:')
if '参考一致数が0件の候補は表示しません。' not in js:
  js=js.replace('同一型内の参考一致数で候補を並べます。','同一型内の参考一致数で候補を並べます。参考一致数が0件の候補は表示しません。')
required=['Update04.2',narrow,'function roleRows(role)','v._s.matched.length>0','roleRows(id).length','参考一致数が0件の候補は表示しません。','function chipLabels(']
for token in required:
  if token not in js: raise SystemExit(f'Update04.2 JS audit failed: {token}')
if wide in js: raise SystemExit('Update04.2 JS audit failed: broad vaccine aliases remain')
JS.write_text(js,encoding='utf-8')

block=f'{START}<script>\n{js}\n</script>{END}'
for path in TARGETS:
  html=path.read_text(encoding='utf-8')
  html=re.sub(re.escape(START)+r'.*?'+re.escape(END),'',html,flags=re.S)
  if '</body>' not in html: raise SystemExit(f'</body> missing: {path}')
  path.write_text(html.replace('</body>',block+'</body>',1),encoding='utf-8')
index=TARGETS[0].read_bytes(); standalone=TARGETS[1].read_bytes()
if index!=standalone: raise SystemExit('HTML mismatch')

info_path=ROOT/'HADO_DEV_INFO.json'; info=json.loads(info_path.read_text(encoding='utf-8'))
info.update({'releaseStatus':'development','releaseVersion':'3.0.0.0','updateNo':'04','revision':2,'displayVersion':'3.0.0.0 Update04.2','summary':'Update04.2: add conservative vaccine type for explicit self disadvantage countermeasures and ally non-damage effects; exclude zero-match candidates and align role tab counts with visible candidates.','updatedAt':datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds')})
info_path.write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'version':'3.0.0.0','update':'Update04.2','typeCount':len(score['types']),'vaccineType':True,'vaccineAliases':'explicit-derived-features-only','zeroMatchExcluded':True,'roleTabCountUsesVisibleRows':True,'chipObjectRenderingFixed':True,'candidateDisplayOnly':True,'indexSha256':hashlib.sha256(index).hexdigest()}
rp=ROOT/'report/HADO_APP_3.0.0.0_UPDATE04.2_REPORT.json'; rp.parent.mkdir(exist_ok=True)
rp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

assert len(score['types'])==16 and len(score['items'])==16
assert any(v.get('typeId')=='vaccine' and len(v.get('metrics',[]))==5 for v in score['types'])
for pid in links:
  p=next(v for v in purpose['purposes'] if v.get('purposeId')==pid)
  assert any(x.get('typeId')=='vaccine' for x in p.get('secondaryTypes',[]))
print('Update04.2 applied')
