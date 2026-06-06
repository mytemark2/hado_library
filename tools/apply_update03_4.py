from pathlib import Path
from datetime import datetime, timezone, timedelta
import hashlib, json, re

ROOT=Path('.')
START='<!-- HADO_UPDATE03_START -->'; END='<!-- HADO_UPDATE03_END -->'
JS_PATH=ROOT/'src/update03_type_entry.js'
TARGETS=[ROOT/'index.html',ROOT/'hado_library_3.0.0.0.html']

def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'Update03.5 patch failed: {label} source not found')
    return text.replace(old,new,1)

def replace_regex_once(text, pattern, new, label):
    out,count=re.subn(pattern,new,text,count=1,flags=re.S)
    if count!=1:
        raise SystemExit(f'Update03.5 patch failed: {label} count={count}')
    return out

js=JS_PATH.read_text(encoding='utf-8')
if 'Update03.5: seven-purpose wizard' not in js:
    js=replace_once(js,
      '/* HADO app 3.0.0.0 Update03.4: method-specific wizard type formation entry navigator */',
      '/* HADO app 3.0.0.0 Update03.5: seven-purpose wizard with primary/support reasons */\n/* Update03.4 workflow compatibility marker: preserve existing verified workflow while applying Update03.5. */',
      'header')
    js=replace_once(js,
      "    enemy_attack_debuff: ['敵部隊攻撃低下'], enemy_defense_debuff: ['敵部隊防御低下']",
      "    enemy_attack_debuff: ['敵部隊攻撃低下'], enemy_defense_debuff: ['敵部隊防御低下'],\n    ally_buff_multi: ['味方バフ配布', '有利変化', '強化効果'], ally_target_count: ['味方対象部隊数', '味方部隊'], effect_duration: ['効果時間', '秒間'],\n    enemy_debuff_multi: ['敵デバフ配布', '不利変化', '弱化効果'], enemy_target_count: ['敵対象部隊数', '敵部隊'], enemy_anti_object_debuff: ['敵部隊対物特効低下', '対物特効低下'],\n    ally_wounded_recovery: ['味方負傷兵回復', '味方部隊の負傷兵'], ally_defense_buff: ['味方防御上昇', '味方部隊の防御'], combat_start_tactic_gauge: ['交戦開始時戦法ゲージ']",
      'aliases')
    js=replace_once(js,
      "    const featureText = norm(flatten(general.typeFeatures || []));",
      "    const featureText = norm(flatten([general.typeFeatures || [], general.statusEffectRefs || []]));",
      'feature text')
    helper="""  function purposeRows(p) {
    const primary=(p?.primaryTypes||[]).map(v=>({...v,role:'primary',roleLabel:'主軸型'}));
    const secondary=(p?.secondaryTypes||[]).map(v=>({...v,role:'secondary',roleLabel:'補助型'}));
    if(primary.length||secondary.length)return [...primary,...secondary];
    return (p?.recommendedTypeIds||[]).map(typeId=>({typeId,role:'primary',roleLabel:'候補型',reason:'旧JSON互換候補'}));
  }
"""
    js=replace_regex_once(js,r"  function scorePurpose\(general, p\) \{.*?\n  \}\n(?=\n  function clampStep)",helper,'scorePurpose')
    purpose_step="""  function renderPurposeStep() {
    return `<div class="hte-card"><div class="hte-title">${state.mainGeneral ? '主将を使う目的を選択' : '目的を選択'}</div><div class="hte-note" style="margin-bottom:8px">目的は実戦用途で分離しています。型の順位ではなく、用途に必要な役割から選択してください。</div><div class="hte-list">${state.data.purposes.map((p) => `<button class="hte-item ${state.purposeId === p.purposeId ? 'active' : ''}" data-purpose-id="${esc(p.purposeId)}"><div class="hte-title">${esc(p.purposeName)}</div><div class="hte-reason">${esc(p.summary || '')}</div><div class="hte-score">主軸型: ${esc((p.primaryTypes || []).map((v) => state.data.scoreRules.find((t) => t.typeId === v.typeId)?.typeName || v.typeId).join('、'))}</div></button>`).join('')}</div></div>`;
  }
"""
    js=replace_regex_once(js,r"  function renderPurposeStep\(\) \{.*?\n  \}\n(?=  function renderTypeStep)",purpose_step,'renderPurposeStep')
    type_step="""  function typeCard(row) {
    const rule=state.data.scoreRules.find((t)=>t.typeId===row.typeId); if(!rule)return '';
    const r=scoreType(state.mainGeneral,rule);
    return `<button class="hte-item ${state.typeId===rule.typeId?'active':''}" data-type-id="${esc(rule.typeId)}"><span class="hte-item-role ${row.role==='primary'?'primary':''}">${esc(row.roleLabel||'型')}</span><div class="hte-title">${esc(rule.typeName)}</div>${rule.description?`<div class="hte-reason">${esc(rule.description)}</div>`:''}${row.reason?`<div class="hte-reason"><strong>推奨理由:</strong> ${esc(row.reason)}</div>`:''}<div class="hte-score">主将参考一致数: ${r.matched.length}/${r.total}項目${r.matched.length?` / ${r.matched.map((m)=>esc(m.label)).join('、')}`:''}</div></button>`;
  }
  function renderTypeStep() {
    if(state.mode==='type'){
      const rows=state.data.scoreRules.map((v)=>({typeId:v.typeId,role:'direct',roleLabel:'型を直接選択',reason:v.description||''}));
      return `<div class="hte-card"><div class="hte-title">型を直接選択</div><div class="hte-list">${rows.map(typeCard).join('')}</div><div class="hte-note">参考一致数は同一型内の候補比較用です。異なる型同士の順位付けには使いません。</div></div>`;
    }
    const rows=purposeRows(purpose()),primary=rows.filter((v)=>v.role==='primary'),secondary=rows.filter((v)=>v.role!=='primary');
    return `<div class="hte-card"><div class="hte-title">${esc(purpose()?.purposeName||'目的')}に使う型を選択</div><div class="hte-reason">${esc(purpose()?.summary||'')}</div><div class="hte-group-title">主軸型</div><div class="hte-list">${primary.map(typeCard).join('')}</div><div class="hte-group-title">補助型</div><div class="hte-list">${secondary.map(typeCard).join('')}</div><div class="hte-note">参考一致数は同一型内の候補比較用です。異なる型同士の順位付けには使いません。</div></div>`;
  }
"""
    js=replace_regex_once(js,r"  function renderTypeStep\(\) \{.*?\n  \}\n(?=  function renderConfirmStep)",type_step,'renderTypeStep')
    confirm="""  function renderConfirmStep() {
    const row=purposeRows(purpose()).find((v)=>v.typeId===state.typeId)||null;
    return `<div class="hte-card"><div class="hte-title">選択内容を確認</div><div class="hte-confirm"><div class="hte-confirm-row"><div class="hte-confirm-label">選び方</div><div>${esc(state.mode === 'main' ? '主将から考える' : state.mode === 'purpose' ? '目的から考える' : '型を直接選ぶ')}</div></div><div class="hte-confirm-row"><div class="hte-confirm-label">主将</div><div>${esc(state.mainGeneral?.displayName || state.mainGeneral?.name || '指定なし')}</div></div><div class="hte-confirm-row"><div class="hte-confirm-label">目的</div><div>${esc(purpose()?.purposeName || '指定なし')}</div></div><div class="hte-confirm-row"><div class="hte-confirm-label">型</div><div>${esc(typeRule()?.typeName || '未選択')}</div></div>${row?.reason?`<div class="hte-confirm-row"><div class="hte-confirm-label">選定理由</div><div>${esc(row.reason)}</div></div>`:''}</div><div class="hte-note" style="margin-top:10px">内容を確認し、「選択を保存」を押してください。</div></div>`;
  }
"""
    js=replace_regex_once(js,r"  function renderConfirmStep\(\) \{.*?\n  \}\n(?=  function renderStepBody)",confirm,'renderConfirmStep')
    js=replace_once(js,'.hte-score{font-weight:700}.hte-match,.hte-note{font-size:12px;color:#475569;margin-top:4px}', '.hte-score{font-weight:700}.hte-match,.hte-note,.hte-reason{font-size:12px;color:#475569;margin-top:4px}.hte-item-role{display:inline-block;font-size:11px;border-radius:999px;padding:2px 7px;margin-bottom:4px;background:#f1f5f9;color:#475569}.hte-item-role.primary{background:#dbeafe;color:#1d4ed8}.hte-group-title{font-weight:700;margin:10px 0 6px}', 'style')
    js=replace_once(js,'3.0.0.0 Update03.4 / 選び方ごとの段階式ナビ','3.0.0.0 Update03.4 / 3.0.0.0 Update03.5 / 7用途・主軸型・補助型・理由表示','subtitle')

required=['Update03.5','Update03.4','WIZARD_STEPS','primaryTypes','secondaryTypes','推奨理由','主将参考一致数','異なる型同士の順位付けには使いません','compositionstart','compositionend','applyMainFilter','button.hidden = Boolean(q)','IME変換中は候補DOMを作り直さず、変換確定後に表示・非表示だけを切り替えます。']
for token in required:
    if token not in js: raise SystemExit(f'Update03.5 audit failed: {token} missing')
for token in ['最上位型:','主将参考適合度:']:
    if token in js: raise SystemExit(f'Update03.5 audit failed: old label remains: {token}')

purpose=json.loads((ROOT/'hadou_type_purpose_rules.json').read_text(encoding='utf-8')); score=json.loads((ROOT/'hadou_type_score_rules.json').read_text(encoding='utf-8'))
purposes=purpose.get('items') or []; types=score.get('items') or []
expected=['anti_troop_annihilation','wall_break','wall_defense','strongpoint_battle','garrison','buff_support','debuff_interference']
if [v.get('purposeId') for v in purposes]!=expected: raise SystemExit('purpose JSON audit failed')
if len(types)!=15 or not {'buff_support','debuff_interference','wall_defense','garrison_support'}.issubset({v.get('typeId') for v in types}): raise SystemExit('type JSON audit failed')
if not all(len(v.get('metrics',[]))==5 for v in types): raise SystemExit('type metrics audit failed')
if not all(v.get('primaryTypes') and v.get('secondaryTypes') and all(x.get('typeId') and x.get('reason') for x in v['primaryTypes']+v['secondaryTypes']) for v in purposes): raise SystemExit('purpose reason audit failed')

JS_PATH.write_text(js,encoding='utf-8')
block=f'{START}<script>\n{js}\n</script>{END}'
for path in TARGETS:
    html=path.read_text(encoding='utf-8'); html=re.sub(re.escape(START)+r'.*?'+re.escape(END),'',html,flags=re.S)
    if '</body>' not in html: raise SystemExit(f'</body> not found: {path}')
    path.write_text(html.replace('</body>',block+'</body>',1),encoding='utf-8')
index=(ROOT/'index.html').read_bytes(); standalone=(ROOT/'hado_library_3.0.0.0.html').read_bytes()
if index!=standalone: raise SystemExit('HTML mismatch')
updated=datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds')
info_path=ROOT/'HADO_DEV_INFO.json'; info=json.loads(info_path.read_text(encoding='utf-8'))
info.update({'releaseStatus':'development','releaseVersion':'3.0.0.0','updateNo':'03','revision':5,'displayVersion':'3.0.0.0 Update03.5','summary':'Update03.5: seven battle purposes, primary/support type reasons, four composite purpose types, and no cross-type ranking.','updatedAt':updated})
info_path.write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'version':'3.0.0.0','update':'Update03.5','bugClass':'purpose mapping and cross-type ranking','rootCause':'coarse provisional purposes lacked role and reason metadata','fixes':['seven purposes','primary/support grouping','recommendation reasons','four composite types','reference match count only','IME handling retained'],'regressionChecks':['seven purposes','fifteen types','five metrics per type','reason completeness','HTML equality'],'indexSha256':hashlib.sha256(index).hexdigest()}
rp=ROOT/'report/HADO_APP_3.0.0.0_UPDATE03.4_REPORT.json'; rp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
