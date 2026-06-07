from pathlib import Path
from datetime import datetime, timezone, timedelta
import hashlib
import json
import re
import subprocess

ROOT = Path('.')
TARGETS = [ROOT / 'index.html', ROOT / 'hado_library_3.0.0.0.html']
UPDATE04_START = '<!-- HADO_UPDATE04_START -->'
UPDATE04_END = '<!-- HADO_UPDATE04_END -->'
UPDATE05_START = '<!-- HADO_UPDATE05_START -->'
UPDATE05_END = '<!-- HADO_UPDATE05_END -->'

update04_path = ROOT / 'src/update04_type_candidates.js'
update05_ui_path = ROOT / 'src/update05_candidate_tray.js'
bridge_path = ROOT / 'src/update05_formation_candidate_tray_bridge.js'

update04 = update04_path.read_text(encoding='utf-8')
if "const ADD='hado:formation-candidate-tray-add';" not in update04:
    update04 = update04.replace(
        "const KEY='hado.typeEntry.selection.v1',EV='hado:type-search-entry-selected',FILES=['hadou_type_search_role_index.json','hadou_type_score_rules.json','hadou_type_purpose_rules.json'];",
        "const KEY='hado.typeEntry.selection.v1',EV='hado:type-search-entry-selected',ADD='hado:formation-candidate-tray-add',FILES=['hadou_type_search_role_index.json','hadou_type_score_rules.json','hadou_type_purpose_rules.json'];"
    )
    old = "<div class=\"htc-detail\">${chipLabels(v).map(x=>`<span class=\"htc-chip\">${esc(x)}</span>`).join('')}</div></div>"
    new = "<div class=\"htc-detail\">${chipLabels(v).map(x=>`<span class=\"htc-chip\">${esc(x)}</span>`).join('')}</div><div style=\"margin-top:8px\"><button type=\"button\" class=\"htc-btn\" data-htc-tray-add=\"1\" data-role-id=\"${esc(st.role)}\" data-name=\"${esc(v.displayName||v.name)}\">候補トレイへ追加</button></div></div>"
    if old not in update04:
        raise SystemExit('Update05 patch failed: candidate card insertion point missing')
    update04 = update04.replace(old, new)
    old_tail = "m.querySelector('#htc-q').oninput=e=>{st.q=e.target.value;render()}}"
    new_tail = "m.querySelector('#htc-q').oninput=e=>{st.q=e.target.value;render()};m.querySelectorAll('[data-htc-tray-add]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();dispatchEvent(new CustomEvent(ADD,{detail:{roleId:b.dataset.roleId||st.role,name:b.dataset.name||'',typeId:type()?.typeId||'',typeName:type()?.typeName||'',source:'型候補一覧'}}))})}"
    if old_tail not in update04:
        raise SystemExit('Update05 patch failed: render tail insertion point missing')
    update04 = update04.replace(old_tail, new_tail)
update04_path.write_text(update04, encoding='utf-8')

bridge = r'''/* HADO app 3.0.0.0 Update05: persist candidate tray per formation and hand off placement to existing selectors */
(()=>{'use strict';
const REQUEST='hado:formation-candidate-tray-snapshot-request',SNAPSHOT='hado:formation-candidate-tray-snapshot',ADD='hado:formation-candidate-tray-add',REMOVE='hado:formation-candidate-tray-remove',CLEAR='hado:formation-candidate-tray-clear',PLACE='hado:formation-candidate-tray-place',TYPE_SELECTED='hado:type-search-entry-selected';
const ROLE_LABELS={main_general:'主将',vice_general:'副将',support_general:'補佐',attendant:'侍従',equipment:'装備',formation:'陣形',siege_weapon:'兵器',warhorse:'名馬',warhorse_skill:'軍馬技能'};
const norm=s=>String(s??'').trim();
const clean=s=>norm(s).replace(/[\r\n\t]+/g,' ');
function trayId(roleId,name){return [clean(roleId),clean(name)].join('::')}
function sanitizeTrayItem(v){const roleId=clean(v?.roleId),name=clean(v?.name);if(!roleId||!name)return null;return {id:clean(v?.id)||trayId(roleId,name),roleId,name,typeId:clean(v?.typeId),typeName:clean(v?.typeName),source:clean(v?.source)||'型候補一覧',addedAt:clean(v?.addedAt)||new Date().toISOString()}}
function sanitizeTray(items){const out=[],seen=new Set();(Array.isArray(items)?items:[]).forEach(v=>{const row=sanitizeTrayItem(v);if(!row||seen.has(row.id))return;seen.add(row.id);out.push(row)});return out.slice(0,60)}
function ensureFields(f,src=f){if(!f)return f;f.evaluationTypeId=clean(src?.evaluationTypeId||f.evaluationTypeId||'');f.candidateTray=sanitizeTray(src?.candidateTray||f.candidateTray||[]);return f}
const originalCreateFormationRecord=createFormationRecord;
createFormationRecord=function(name='新規部隊'){return ensureFields(originalCreateFormationRecord(name),{evaluationTypeId:'',candidateTray:[]})};
const originalSanitizeFormationRecord=sanitizeFormationRecord;
sanitizeFormationRecord=function(f){return ensureFields(originalSanitizeFormationRecord(f),f)};
function current(){return typeof getCurrentFormation==='function'?getCurrentFormation():null}
function emitSnapshot(context=''){const f=ensureFields(current());dispatchEvent(new CustomEvent(SNAPSHOT,{detail:{context,formationId:f?.id||'',formationName:f?.name||'',evaluationTypeId:f?.evaluationTypeId||'',items:sanitizeTray(f?.candidateTray||[])}}))}
const originalSaveFormationDataToStorage=saveFormationDataToStorage;
saveFormationDataToStorage=function(context=''){const ok=originalSaveFormationDataToStorage(context);setTimeout(()=>emitSnapshot('save:'+context),0);return ok};
function persist(f,context){if(!f)return false;f.updatedAt=new Date().toISOString();state.formationDirty=true;return saveFormationDataToStorage(context)}
function notify(message){if(typeof showFormationToast==='function')showFormationToast(message);else try{window.alert(message)}catch{}}
function pick(label,rows){const text=rows.map((v,i)=>`${i+1}: ${v.label}`).join('\n');const raw=window.prompt(`${label}\n${text}`,'1');if(raw===null)return null;const idx=Number(raw)-1;return rows[idx]||null}
function openExistingSelector(item){if(typeof setMainTab==='function')setMainTab('formation');const role=item.roleId;let type='',slotKey='',equipKey='';if(role==='main_general'){type='general';slotKey='main'}else if(role==='vice_general'){const x=pick('副将の配置先を選択してください。',[{label:'副将1',slotKey:'deputy1'},{label:'副将2',slotKey:'deputy2'}]);if(!x)return;type='general';slotKey=x.slotKey}else if(role==='support_general'){const x=pick('補佐の配置先を選択してください。',[{label:'補佐1',slotKey:'support1'},{label:'補佐2',slotKey:'support2'}]);if(!x)return;type='general';slotKey=x.slotKey}else if(role==='attendant'){const x=pick('侍従を設定する武将枠を選択してください。',[{label:'主将',slotKey:'main'},{label:'副将1',slotKey:'deputy1'},{label:'副将2',slotKey:'deputy2'},{label:'補佐1',slotKey:'support1'},{label:'補佐2',slotKey:'support2'}]);if(!x)return;type='attendant';slotKey=x.slotKey}else if(role==='equipment'){const x=pick('装備を設定する武将枠を選択してください。',[{label:'主将',slotKey:'main'},{label:'副将1',slotKey:'deputy1'},{label:'副将2',slotKey:'deputy2'},{label:'補佐1',slotKey:'support1'},{label:'補佐2',slotKey:'support2'}]);if(!x)return;const e=pick('装備枠を選択してください。',[{label:'武器',equipKey:'weapon'},{label:'防具',equipKey:'armor'},{label:'文物',equipKey:'treasure'}]);if(!e)return;type='equipment';slotKey=x.slotKey;equipKey=e.equipKey}else{notify(`${ROLE_LABELS[role]||role}候補はトレイへ保存しました。配置接続は後続更新で対応します。`);return}
state.formationSelectedSlot=slotKey||state.formationSelectedSlot;
openFormationSelectorDialog(type,slotKey,equipKey,'');
if(state.formationSelectorDialog){state.formationSelectorDialog.keyword=item.name;renderFormationScreen()}
}
addEventListener(REQUEST,e=>emitSnapshot(e.detail?.context||'request'));
addEventListener(TYPE_SELECTED,e=>{const f=ensureFields(current());const typeId=clean(e.detail?.typeId);if(!f||!typeId)return;f.evaluationTypeId=typeId;persist(f,'update05:type-selected');emitSnapshot('type-selected')});
addEventListener(ADD,e=>{const f=ensureFields(current());const row=sanitizeTrayItem(e.detail);if(!f||!row)return;f.evaluationTypeId=row.typeId||f.evaluationTypeId;const rows=sanitizeTray(f.candidateTray);if(rows.some(v=>v.id===row.id)){notify(`${row.name} は候補トレイに登録済みです。`);emitSnapshot('duplicate');return}f.candidateTray=sanitizeTray([...rows,row]);persist(f,'update05:tray-add');notify(`${row.name} を候補トレイへ追加しました。`);emitSnapshot('add')});
addEventListener(REMOVE,e=>{const f=ensureFields(current());if(!f)return;const id=clean(e.detail?.id);f.candidateTray=sanitizeTray(f.candidateTray).filter(v=>v.id!==id);persist(f,'update05:tray-remove');emitSnapshot('remove')});
addEventListener(CLEAR,()=>{const f=ensureFields(current());if(!f)return;f.candidateTray=[];persist(f,'update05:tray-clear');emitSnapshot('clear')});
addEventListener(PLACE,e=>{const f=ensureFields(current());const id=clean(e.detail?.id);const item=sanitizeTray(f?.candidateTray).find(v=>v.id===id);if(item)openExistingSelector(item)});
setTimeout(()=>{(state.formations||[]).forEach(ensureFields);emitSnapshot('mount')},0);
})();
'''
bridge_path.write_text(bridge, encoding='utf-8')

subprocess.run(['node', '--check', str(update04_path)], check=True)
subprocess.run(['node', '--check', str(update05_ui_path)], check=True)
subprocess.run(['node', '--check', str(bridge_path)], check=True)

update05_ui = update05_ui_path.read_text(encoding='utf-8')
update05_block = f"{UPDATE05_START}<script>\n{bridge}\n</script><script>\n{update05_ui}\n</script>{UPDATE05_END}"
update04_block = f"{UPDATE04_START}<script>\n{update04}\n</script>{UPDATE04_END}"

created_at = datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d %H:%M:%S')
for path in TARGETS:
    html = path.read_text(encoding='utf-8')
    html = re.sub(re.escape(UPDATE04_START) + r'.*?' + re.escape(UPDATE04_END), update04_block, html, flags=re.S)
    html = re.sub(re.escape(UPDATE05_START) + r'.*?' + re.escape(UPDATE05_END), '', html, flags=re.S)
    if '</body>' not in html:
        raise SystemExit(f'</body> missing: {path}')
    html = html.replace('</body>', update05_block + '</body>', 1)
    html = re.sub(r'const FILE_META=\{fileName:"hado_library_3\.0\.0\.0\.html",createdAt:"[^"]*"\};', f'const FILE_META={{fileName:"hado_library_3.0.0.0.html",createdAt:"{created_at}"}};', html)
    html = re.sub(r'const HADO_BUILD_INFO=\{version:"3\.0\.0\.0",baseVersion:"2\.9\.6\.5",changeType:"feature",summary:"[^"]*",baseSha256:"[a-f0-9]{64}"\};', 'const HADO_BUILD_INFO={version:"3.0.0.0",baseVersion:"2.9.6.5",changeType:"feature",summary:"Update05: persist per-formation evaluation type and candidate tray; add candidate-list registration and existing-gate placement handoff.",baseSha256:"fb5063235bd797ae8376c2f0c37da4863e375d85c611f5b3400904a151dfcafa"};', html)
    path.write_text(html, encoding='utf-8')

index_bytes = TARGETS[0].read_bytes()
standalone_bytes = TARGETS[1].read_bytes()
if index_bytes != standalone_bytes:
    raise SystemExit('index.html and standalone HTML differ')

info_path = ROOT / 'HADO_DEV_INFO.json'
info = json.loads(info_path.read_text(encoding='utf-8'))
info.update({
    'releaseStatus': 'development',
    'releaseVersion': '3.0.0.0',
    'updateNo': '05',
    'revision': 0,
    'displayVersion': '3.0.0.0 Update05',
    'baseAppVersion': '2.9.6.5',
    'summary': 'Update05: persist evaluationTypeId and candidateTray per formation; add type-candidate registration and hand off placement to existing formation selector gates.',
    'updatedAt': datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds')
})
info_path.write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

scope = '''# HADO App 3.0.0.0 Update05 Scope\n\n## Purpose\nConnect the selected-type candidate browser to a per-formation candidate tray without bypassing existing formation gates.\n\n## Implemented\n- Persist `evaluationTypeId` and `candidateTray` in each formation record.\n- Add `候補トレイへ追加` to the Update04.2 candidate browser.\n- Keep tray entries per formation and deduplicate by role and name.\n- Open existing formation selector dialogs for main general, vice general, support general, attendant, and equipment placement.\n- Do not directly assign a candidate from the tray.\n\n## Preserved gates\nAttendant, formation, troop type, range, equipment duplication, adviser, five-elements, siege weapon, armament, warhorse, and warhorse-skill gates remain in the existing formation workflow.\n'''
(ROOT / 'docs/HADO_APP_3.0.0.0_UPDATE05_SCOPE.md').write_text(scope, encoding='utf-8')

report = {
    'version': '3.0.0.0',
    'update': 'Update05',
    'scope': 'per-formation candidate tray and existing-gate placement handoff',
    'implemented': [
        'formation.evaluationTypeId persisted',
        'formation.candidateTray persisted',
        'candidate browser add-to-tray button',
        'per-formation tray deduplication',
        'existing formation selector handoff for generals, attendants and equipment',
        'unsupported role entries remain tray-only'
    ],
    'safety': {
        'directAssignmentFromTray': False,
        'existingFormationSelectorUsed': True,
        'existingGateBypass': False,
        'candidateTrayLimit': 60
    },
    'checks': [
        'node --check src/update04_type_candidates.js',
        'node --check src/update05_candidate_tray.js',
        'node --check src/update05_formation_candidate_tray_bridge.js',
        'index.html equals hado_library_3.0.0.0.html'
    ],
    'indexSha256': hashlib.sha256(index_bytes).hexdigest()
}
report_path = ROOT / 'report/HADO_APP_3.0.0.0_UPDATE05_REPORT.json'
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print(json.dumps({'ok': True, 'update': 'Update05', 'indexSha256': report['indexSha256']}, ensure_ascii=False))
