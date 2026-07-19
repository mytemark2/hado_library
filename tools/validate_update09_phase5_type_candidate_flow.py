#!/usr/bin/env python3
from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[1]
read=lambda name:(ROOT/name).read_text(encoding='utf-8')
entry=read('hado_type_entry.js')
tc=read('hado_type_candidates.js')
tray=read('hado_candidate_tray.js')
formation=read('hado_formation.js')
errors=[]
def req(cond,msg):
    if not cond: errors.append(msg)
req('候補ワークスペースへ' in entry and "mode: 'edit'" in entry,'hado_type_entry.js must open candidate workspace in edit mode')
req('<button class="hte-btn primary" data-action="save">選択を保存</button>' not in entry,'primary confirm save button must not remain 選択を保存')
req('close();' in entry and 'HadoTypeCandidates.open' in entry and 'hado:type-candidates-open-request' in entry,'saveSelection must close entry and open type candidates with event fallback')
req('data-add-tray' not in tc and '候補に追加（' not in tc,'candidate workspace edit mode must not retain the redundant add button')
req('function toggleCandidate(key)' in tc and 'カード選択は候補へ即時反映されます。' in tc,'candidate workspace edit mode must reflect candidate toggles immediately')
req('data-create-formation' in tc and 'この型で新規部隊' in tc,'candidate mode must own new formation creation')
req("st.context=options.source==='type-entry-save'?'draft':'formation'" in tc,'type navigator candidate edits must use an isolated pre-formation draft')
req('candidateTray:candidates' in tc and 'mainGeneral:primary' in tc,'new formation must receive the reviewed candidates and selected main general')
req('hado:formation-candidate-tray-add' in tc and 'new CustomEvent' in tc,'type candidates must dispatch tray add event')
req('activeCandidateItems' in tc and 'buildTrayPayload' in tc,'type candidates must expose active candidate and payload helpers')
req('safeRoleRows(id).length' not in tc,'type candidate tabs must not synchronously score all roles for counts')
req('workspaceTabCountLabel(id)' in tc and 'requestIdleCallback' in tc,'candidate workspace role counts must use prepared async labels')
req("['extensions','装備・拡張']" in tc,'candidate workspace must group extension roles')
req('window.HadoTypeCandidates={open,close}' in tc,'type candidates must expose open API')
req('window.HadoCandidateTray={open,close,requestSnapshot}' in tray or 'hado:formation-candidate-tray-open-request' in tray,'candidate tray must expose open API or open-request listener')
req('hado:formation-candidate-tray-open-request' in tray,'candidate tray must listen for open request')
req("'hado:formation-candidate-tray-add'" in formation or '"hado:formation-candidate-tray-add"' in formation,'formation must listen for tray add')
req('candidateTray.push' in formation and "saveFormationDataToStorage('candidate-tray-add')" in formation,'formation must update current formation candidateTray and save')
req('sanitizeFormationCandidateTray' in formation and 'displayName' in formation,'candidateTray sanitize/export/import compatibility must be preserved')
req('roleId' in formation and 'typeId' in formation and 'formationCandidateTrayKey' in formation,'dedupe must include roleId/name/typeId')
req('hado:formation-candidate-tray-snapshot-request' in formation,'snapshot request must be implemented')
req('hado:formation-candidate-tray-remove' in formation and 'hado:formation-candidate-tray-clear' in formation and 'hado:formation-candidate-tray-place' in formation,'remove/clear/place events must be implemented')
if errors:
    print('Update09 Phase5 type candidate flow validation failed:')
    for e in errors: print('-',e)
    sys.exit(1)
print('Update09 Phase5 type candidate flow validation passed')
