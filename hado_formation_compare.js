/* Saved formation browsing and comparison. UI state stays outside saved records. */
(() => {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const text = value => String(value ?? '').trim();
  const folded = value => text(value).normalize('NFKC').toLocaleLowerCase('ja');
  const html = value => text(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let query = '';
  let dialog = null;
  let returnFocus = null;
  let selection = {a:'', b:''};
  let resultKey = '';
  let cachedResult = null;
  let generation = 0;

  function identity(f) {
    const general = text(f?.slots?.main?.general);
    const item = general ? findItemByDisplayName('generals', general) : null;
    const troop = item ? text(getGeneralTroopType(item)) : '';
    const group = (state.formationGroups || []).find(row => row.id === f.groupId)?.name || '';
    return {general, troop, group, type:text(f.evaluationTypeName) || '未指定'};
  }
  function matches(f, value) {
    const id = identity(f);
    const generals = FORMATION_SLOT_SPECS.flatMap(spec => [f.slots?.[spec.key]?.general, f.slots?.[spec.key]?.attendant]);
    const advisors = ADVISOR_SLOT_SPECS.map(spec => f.advisorSlots?.[spec.key]);
    const haystack = folded([f.name, ...generals, ...advisors, id.troop, id.type, f.memo].join(' '));
    return folded(value).split(/\s+/).filter(Boolean).every(term => haystack.includes(term));
  }
  function label(f) {
    const id = identity(f);
    return [id.group, f.name, id.general || '主将未設定', id.troop, id.type].filter(Boolean).join(' / ');
  }
  function fields(f) {
    const rows = [];
    const add = (key, name, value) => rows.push({key, label:name, value:text(value)});
    add('formation', '陣形', f.formationName || '基本');
    add('deployment', '配置場所', formationDeploymentTypeLabel(f.deploymentType));
    FORMATION_SLOT_SPECS.forEach(spec => {
      const slot = f.slots?.[spec.key] || {};
      add(`${spec.key}.general`, `${spec.label}・武将`, slot.general);
      add(`${spec.key}.attendant`, `${spec.label}・侍従`, slot.attendant);
      add(`${spec.key}.position`, `${spec.label}・侍従位置`, slot.attendantPosition);
      EQUIP_SLOT_SPECS.forEach(eq => add(`${spec.key}.${eq.key}`, `${spec.label}・${eq.label}`, slot.equipments?.[eq.key]));
    });
    ADVISOR_SLOT_SPECS.forEach(spec => add(`advisor.${spec.key}`, `参軍・${spec.label}`, f.advisorSlots?.[spec.key]));
    add('siege', '兵器', f.siegeWeapon?.name ? `${f.siegeWeapon.name} Lv${f.siegeWeapon.level || 0}` : '');
    add('armament', '武装', f.ethnicArmament?.name ? `${f.ethnicArmament.name} Lv${f.ethnicArmament.level || 0}` : '');
    add('ethnic', '武装・異民族武将', f.ethnicArmament?.ethnicGeneralName);
    add('type', '評価の型', identity(f).type);
    add('memo', 'メモ', f.memo);
    return rows;
  }
  function differences(a, b) {
    const right = new Map(fields(b).map(row => [row.key, row.value]));
    return fields(a).map(row => ({...row, a:row.value, b:right.get(row.key) || '', changed:row.value !== (right.get(row.key) || '')}));
  }
  // Existing evaluation helpers normalize owned data. Run synchronously against detached
  // copies and restore context even on error; never call a save/selection/render path.
  function evaluatePair(a, b) {
    const original = {saveData:state.saveData, formations:state.formations, diagnostics:state.diagnostics,
      clause:state._formationClauseSurface};
    try {
      state.saveData = copy(state.saveData || {saves:[]});
      state.formations = copy(state.formations || []);
      state.diagnostics = copy(state.diagnostics || {});
      return [a, b].map(record => {
        const f = copy(record);
        const data = buildFormationParameterDataUncached(f);
        data.clauseSurface = buildFormationClauseSurface(f);
        const score = calculateFormationAutoScores(f, data);
        const reason = score.breakdown?.emptyReason;
        return {total:Number(score.totalScore) || 0, type:score.breakdown?.evaluationTypeName || identity(f).type,
          error:reason || '', rows:copy(score.breakdown?.scoreRows || [])};
      });
    } finally {
      state.saveData = original.saveData;
      state.formations = original.formations;
      state.diagnostics = original.diagnostics;
      state._formationClauseSurface = original.clause;
    }
  }
  function horseSummary() {
    const data = sanitizeWarhorseSaveData(copy(getCurrentSave()?.warhorses || {}));
    return Array.from({length:3}, (_, index) => {
      const horse = data.owned?.[data.activeSlots?.[index]];
      if (!horse) return `軍馬${index + 1}：未設定`;
      const skills = (horse.skills || []).slice().sort((a,b) => Number(a.slotIndex)-Number(b.slotIndex)).slice(0,3)
        .map(skill => `${skill.skillId} Lv${skill.level}`).join(' / ');
      const master = getWarhorseMasterById(horse.horseMasterId);
      const fixed = master && getWarhorseFixedSkillName(master);
      const fixedLevel = fixed ? getFamousHorseFixedSkillLevel(master, horse.star || 0) : 0;
      return `軍馬${index + 1}：${horse.name || horse.horseMasterId}${skills ? ' / ' + skills : ''}${fixedLevel ? ` / 固有:${fixed} Lv${fixedLevel}` : ''}`;
    });
  }
  function pairRow(name, a, b, changed) {
    return `<div class="formation-compare-row${changed ? ' is-changed' : ''}"><div class="formation-compare-label">${html(name)}</div><div><span class="formation-compare-side">A</span>${html(a || '未設定')}</div><div><span class="formation-compare-side">B</span>${html(b || '未設定')}</div></div>`;
  }
  function metricRows(a, b) {
    const rows = new Map();
    [a, b].forEach((score, index) => score.rows.forEach(row => {
      const key = row.scoreMetricId || row.label;
      if (!rows.has(key)) rows.set(key, {label:row.label, a:0, b:0});
      rows.get(key)[index ? 'b' : 'a'] = Number(row.score) || 0;
    }));
    return [...rows.values()].map(row => pairRow(`${row.label}（B−A: ${signed(row.b-row.a)}）`, row.a.toString(), row.b.toString(), row.a !== row.b)).join('');
  }
  const signed = number => number > 0 ? `+${number}` : String(number);
  function evidence(score, side) {
    return `<section><h4>${side}の評価内訳・根拠</h4>${score.rows.map(row => `<details><summary>${html(row.label)}：${html(row.score)}</summary><div class="formation-score-evidence-dialog-list">${renderFormationScoreEvidenceItemsHtml(normalizeFormationScoreEvidenceRows(row),true) || '<p>内訳なし</p>'}</div></details>`).join('') || '<p>評価内訳なし</p>'}</section>`;
  }
  function resultHtml(a, b, scores) {
    const rows = differences(a,b);
    const changed = rows.filter(row => row.changed);
    const common = rows.filter(row => !row.changed);
    const [left, right] = scores;
    const sameType = left.type === right.type;
    const unavailable = left.error || right.error;
    return `<p class="formation-compare-result-summary" role="status">${changed.length ? `${changed.length}項目が異なります` : '編成内容は同じです'}。${unavailable ? '評価は算出できない項目があります。' : sameType ? `評価差（B−A）：${signed(right.total-left.total)}` : '評価の型が異なるため、合計値の差で優劣を判定しません。'}</p>
      <h3>変更箇所</h3>${changed.map(row => pairRow(row.label,row.a,row.b,true)).join('') || '<p>変更箇所はありません。</p>'}
      <h3>現在の条件での評価</h3><p class="note">${state.viewMode === 'saved' ? '保存データの登録設定' : '全データ表示の設定'}と共通の軍馬配置で再計算しています。保存時の評価は更新しません。</p>
      ${pairRow('評価の型',left.type,right.type,!sameType)}
      ${pairRow('現在の合計',left.error ? '算出不可' : String(left.total),right.error ? '算出不可' : String(right.total),!unavailable && left.total !== right.total)}
      ${unavailable ? `<p role="status">${html([left.error && `A：${left.error}`,right.error && `B：${right.error}`].filter(Boolean).join(' / '))}</p>` : sameType ? metricRows(left,right) : '<p>評価項目が異なるため、内訳は各編成の評価根拠で確認してください。</p>'}
      ${pairRow('編成に記録された合計',String(a.totalScore ?? a.evaluationScore ?? 0),String(b.totalScore ?? b.evaluationScore ?? 0),false)}
      <details><summary>評価の根拠を確認</summary><div class="formation-compare-evidence">${evidence(left,'A')}${evidence(right,'B')}</div></details>
      <details><summary>共通の編成内容（${common.length}項目）</summary>${common.map(row => pairRow(row.label,row.a,row.b,false)).join('')}</details>
      <details><summary>共通の軍馬・技能</summary><p>軍馬配置は同じ保存データ内の全編成で共通です。部隊ごとの変更点には数えません。</p>${horseSummary().map(line => `<p>${html(line)}</p>`).join('')}</details>`;
  }
  function updateResult() {
    const target = dialog?.querySelector('[data-compare-result]');
    if (!target) return;
    const a = (state.formations || []).find(f => f.id === selection.a);
    const b = (state.formations || []).find(f => f.id === selection.b);
    const token = ++generation;
    if (!a || !b) {target.innerHTML = '<p>比較する編成A・Bを選択してください。</p>'; return;}
    if (a.id === b.id) {target.innerHTML = '<p role="status">AとBには異なる編成を選択してください。</p>'; return;}
    target.innerHTML = '<p role="status">差分と評価を確認しています…</p>';
    setTimeout(() => {
      if (!dialog || token !== generation) return;
      try {
        const key = JSON.stringify([a,b,state.viewMode,getCurrentSave(),state.savedSearchCacheSeq]);
        if (key !== resultKey) {cachedResult = evaluatePair(a,b); resultKey = key;}
        target.innerHTML = resultHtml(a,b,cachedResult);
        debugLog('formationCompare:result',{a:a.id,b:b.id,changed:differences(a,b).filter(row=>row.changed).length,readOnly:true});
      } catch (error) {
        target.innerHTML = '<p role="alert">比較を表示できませんでした。元の編成は変更していません。閉じて再度お試しください。</p>';
        debugLog('formationCompare:error',{message:error?.message || String(error)});
      }
    }, 0);
  }
  function options(side, value) {
    return '<option value="">編成を選択</option>' + (state.formations || []).filter(f => matches(f,value) || f.id === selection[side])
      .map(f => `<option value="${html(f.id)}"${f.id === selection[side] ? ' selected' : ''}>${html(label(f))}${matches(f,value) ? '' : '（選択中・条件外）'}</option>`).join('');
  }
  function updateChoices() {
    const value = dialog.querySelector('[data-compare-search]').value;
    dialog.querySelectorAll('[data-compare-select]').forEach(select => {select.innerHTML = options(select.dataset.compareSelect,value);});
    dialog.querySelector('[data-compare-count]').textContent = `${(state.formations || []).filter(f=>matches(f,value)).length}/${(state.formations || []).length}件（全グループ）`;
  }
  function close() {
    if (!dialog) return;
    const old = dialog;
    dialog = null;
    generation++;
    old.close();
    old.remove();
    returnFocus?.focus?.();
  }
  function open(button) {
    if (dialog) return;
    returnFocus = button;
    selection = {a:state.currentFormationId || '',b:''};
    resultKey = '';
    cachedResult = null;
    dialog = document.createElement('dialog');
    dialog.className = 'formation-compare-dialog no-detail-linkify';
    dialog.setAttribute('aria-labelledby','formationCompareTitle');
    dialog.innerHTML = `<header><h2 id="formationCompareTitle">保存編成を比較</h2><button type="button" data-compare-close>閉じる</button></header>
      <p class="note">比較しても編集中の部隊・保存内容は変わりません。未保存の編集がある場合は、現在の編集内容を比較します。</p>
      <label class="formation-compare-search">比較対象を絞り込む<input type="search" data-compare-search placeholder="名前・武将・兵科・型・メモ" autocomplete="off"></label>
      <p data-compare-count role="status"></p><div class="formation-compare-choices">${['a','b'].map(side=>`<label>編成${side.toUpperCase()}<select aria-label="編成${side.toUpperCase()}" data-compare-select="${side}"></select></label>`).join('')}</div><div data-compare-result></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('[data-compare-close]').addEventListener('click',close);
    dialog.addEventListener('cancel', event => {event.preventDefault(); close();});
    dialog.querySelector('[data-compare-search]').addEventListener('input',updateChoices);
    dialog.querySelectorAll('[data-compare-select]').forEach(select => select.addEventListener('change',()=>{selection[select.dataset.compareSelect]=select.value; updateResult();}));
    updateChoices();
    updateResult();
    dialog.showModal();
  }
  function filterLists(root) {
    const matched = (state.formations || []).filter(f => matches(f,query));
    const ids = new Set(matched.map(f=>f.id));
    root.querySelectorAll('[data-formation-select]').forEach(button=>{button.hidden = !ids.has(button.dataset.formationSelect);});
    root.querySelectorAll('#formationMobileSelect option').forEach(option=>{
      const excluded = !ids.has(option.value);
      option.hidden = excluded && option.value !== state.currentFormationId;
      option.textContent = option.textContent.replace(/（編集中・条件外）$/,'') + (excluded && option.value === state.currentFormationId ? '（編集中・条件外）' : '');
    });
    const groupId = state.currentFormationGroupId || state.formationGroups?.[0]?.id;
    const visible = (state.formations || []).filter(f => (f.groupId || groupId) === groupId);
    root.querySelectorAll('[data-formation-filter-count]').forEach(count=>{count.textContent = `${visible.filter(f=>ids.has(f.id)).length}/${visible.length}件`;});
    root.querySelectorAll('[data-formation-filter-empty]').forEach(empty=>{empty.hidden = visible.some(f=>ids.has(f.id));});
  }
  function mount(root) {
    if (!root) return;
    if (dialog) close();
    root.querySelectorAll('.formation-list-fixed-head,.formation-mobile-select-wrap').forEach((host,index)=>{
      const toolbar = document.createElement('div');
      toolbar.className = 'formation-browse-tools';
      toolbar.innerHTML = `<label for="formationBrowseSearch${index}">部隊を絞り込む</label><div class="formation-browse-search"><input id="formationBrowseSearch${index}" type="search" data-formation-browse-search placeholder="名前・武将・兵科・型・メモ" value="${html(query)}" autocomplete="off"><button type="button" data-formation-browse-clear aria-label="部隊の絞り込みを解除">解除</button></div><div class="formation-browse-actions"><span data-formation-filter-count role="status"></span><button type="button" data-formation-compare-open>2編成を比較</button></div><p data-formation-filter-empty hidden>該当する部隊はありません。</p>`;
      host.appendChild(toolbar);
      toolbar.querySelector('[data-formation-compare-open]').addEventListener('click',event=>open(event.currentTarget));
      toolbar.querySelector('[data-formation-browse-search]').addEventListener('input',event=>{
        query = event.currentTarget.value;
        root.querySelectorAll('[data-formation-browse-search]').forEach(input=>{if(input!==event.currentTarget)input.value=query;});
        filterLists(root);
      });
      toolbar.querySelector('[data-formation-browse-clear]').addEventListener('click',()=>{
        query = '';
        root.querySelectorAll('[data-formation-browse-search]').forEach(input=>{input.value='';});
        filterLists(root);
        toolbar.querySelector('input').focus();
      });
    });
    filterLists(root);
  }
  window.HADO_FORMATION_COMPARE = Object.freeze({mount, matches, differences, evaluatePair, horseSummary});
})();
