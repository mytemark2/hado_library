#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');

const candidates = fs.readFileSync('hado_type_candidates.js', 'utf8');
const tray = fs.readFileSync('hado_candidate_tray.js', 'utf8');
const entry = fs.readFileSync('hado_type_entry.js', 'utf8');

assert(candidates.includes("const WORKSPACE_TABS=[['main_general','主将'],['vice_general','副将'],['support_general','補佐'],['attendant','侍従'],['extensions','装備・拡張']]"), 'workspace must group the agreed four general roles and one extension tab');
assert(candidates.includes("st.mode=options.mode==='candidate'?'candidate':'edit'"), 'one workspace must own both edit and candidate modes');
assert(candidates.includes("st.mode='candidate'"), 'adding selected rows must switch directly to candidate mode');
assert(candidates.includes('data-workspace-place=') && candidates.includes('data-workspace-remove='), 'candidate mode must provide direct placement and removal actions');
assert(candidates.includes("new CustomEvent('hado:formation-candidate-tray-place'"), 'placement must continue through the formation-owned candidate tray event');
assert(candidates.includes("new CustomEvent('hado:formation-candidate-tray-remove'"), 'removal must continue through the formation-owned persistence event');
assert(candidates.includes('候補に追加（${pickedCount}件）'), 'edit mode must keep multi-select and show its selected count');
assert(candidates.includes('候補済み'), 'edit mode must identify candidates already stored in the candidate set');
assert(candidates.includes('const batchSize=120'), 'workspace startup must score in bounded 120-row batches so all numeric tab counts are ready without the former long frame-by-frame delay');
assert(!tray.includes("id='hct-overlay'") && !tray.includes('function itemHtml'), 'legacy duplicate tray modal must not remain');
assert(tray.includes("mode:'candidate'"), 'the single formation launcher must open candidate mode');
assert(tray.includes('候補ワークスペース <span id="hct-count">'), 'the formation launcher must expose the unified workspace and persisted count');
assert(entry.includes("window.HadoTypeCandidates.open({ source: 'type-entry-save', mode: 'edit' })"), 'type navigator must always open the candidate workspace in edit mode');

console.log('Update09.5.61 candidate workspace contract: passed');
