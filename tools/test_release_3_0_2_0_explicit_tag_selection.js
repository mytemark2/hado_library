'use strict';

const assert = require('assert');
const fs = require('fs');

const bootstrap = fs.readFileSync('hado_bootstrap.js', 'utf8');
const status = fs.readFileSync('hado_status_effects.js', 'utf8');

assert(!bootstrap.includes('commitTagSearchInput('), 'typing and IME confirmation must not auto-register a tag');
assert(!status.includes('function commitTagSearchInput('), 'automatic exact-input commit path must be removed');
assert(!status.includes('function resolveAvailableTagInput('), 'exact text must remain visible until a candidate is selected');
assert(bootstrap.includes("addEventListener('compositionend',()=>{state.tagSearchComposing=false;renderTagCandidates();})"), 'IME confirmation must only render candidates');
assert(bootstrap.includes("addEventListener('input',e=>{if(state.tagSearchComposing||e.isComposing){hideTagCandidates();return;}renderTagCandidates();})"), 'ordinary input must only render candidates');
assert(status.includes("option.addEventListener('click',()=>{state.tagCandidatePointerDown=false;selectTagCandidate(tag,'candidate-tap');})"), 'tap or click must explicitly select the candidate');
assert(status.includes("e.key==='Enter'&&state.tagCandidateActiveIndex>=0"), 'Enter must require an active keyboard candidate');
assert(status.includes("selectTagCandidate(tag,'candidate-keyboard')"), 'keyboard-selected candidates must use the same canonical selection path');
assert(status.includes("if(els.tagSearchInput)els.tagSearchInput.value=''"), 'the input must clear only inside explicit candidate selection');
assert(status.includes("const current=active<0?(delta>0?-1:0):active"), 'ArrowDown and ArrowUp must activate the first and last candidate respectively');

console.log('3.0.2.0 explicit tag selection regression ok');
