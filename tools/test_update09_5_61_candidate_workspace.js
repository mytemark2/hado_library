#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');

const candidates = fs.readFileSync('hado_type_candidates.js', 'utf8');
const tray = fs.readFileSync('hado_candidate_tray.js', 'utf8');
const entry = fs.readFileSync('hado_type_entry.js', 'utf8');

assert(candidates.includes("const WORKSPACE_TABS=[['main_general','主将'],['vice_general','副将'],['support_general','補佐'],['attendant','侍従'],['extensions','装備・拡張']]"), 'workspace must group the agreed four general roles and one extension tab');
assert(candidates.includes("mode:options.mode==='candidate'?'candidate':'edit'"), 'one workspace must own both edit and candidate modes');
assert(candidates.includes('async function switchWorkspaceMode(mode)'), 'workspace modes must switch without losing their shared context');
assert(candidates.includes('data-workspace-place=') && candidates.includes('data-workspace-remove='), 'candidate mode must provide direct placement and removal actions');
assert(candidates.includes("new CustomEvent('hado:formation-candidate-tray-place'"), 'placement must continue through the formation-owned candidate tray event');
assert(candidates.includes("new CustomEvent('hado:formation-candidate-tray-remove'"), 'removal must continue through the formation-owned persistence event');
assert(!candidates.includes('data-add-tray') && !candidates.includes('候補に追加（'), 'edit mode must not retain the redundant bulk-add action');
assert(candidates.includes('function toggleCandidate(key)') && candidates.includes('カード選択は候補へ即時反映されます。'), 'edit mode must reflect candidate toggles immediately');
assert(candidates.includes('候補済み'), 'edit mode must identify candidates already stored in the candidate set');
assert(candidates.includes('isEdit?`<button class="htc-btn" data-workspace-mode="candidate">候補モード</button>`:`<button class="htc-btn primary" data-workspace-mode="edit"'), 'candidate and edit mode actions must remain separated');
assert(candidates.includes("st.sel?.typeId?'<button class=\"htc-btn primary\" data-create-formation>この型で新規部隊</button>':''"), 'new formation action must be rendered by candidate mode');
assert(candidates.includes('function workspaceOpenPlan(options={},savedDraft=loadMatchingDraft())'), 'all workspace launch paths must share the draft/formation context resolver');
assert(candidates.includes("source:'型編成ナビ'") && candidates.includes('primaryMainKey'), 'type navigator main general must seed and select the main candidate');
assert(candidates.includes('const batchSize=120'), 'workspace startup must score in bounded 120-row batches so all numeric tab counts are ready without the former long frame-by-frame delay');
assert(!tray.includes("id='hct-overlay'") && !tray.includes('function itemHtml'), 'legacy duplicate tray modal must not remain');
assert(tray.includes("mode:'candidate'"), 'the single formation launcher must open candidate mode');
assert(tray.includes('候補ワークスペース <span id="hct-count">'), 'the formation launcher must expose the unified workspace and persisted count');
assert(entry.includes("window.HadoTypeCandidates.open({ source: 'type-entry-save', mode: 'edit' })"), 'type navigator must always open the candidate workspace in edit mode');

console.log('Update09.5.61 candidate workspace contract: passed');
