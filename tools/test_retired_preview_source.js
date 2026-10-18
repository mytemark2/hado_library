'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../.github/workflows/notify-preview.yml'),'utf8');
const jobs=source.slice(source.indexOf('\njobs:'));
assert(/notify-preview:\s*\n\s*# [^\n]*\n\s*if: \$\{\{ false &&/.test(jobs),'retired source must never dispatch or publish Preview');
assert(!/workflow_dispatch:|schedule:/.test(source),'retirement adds no manual or scheduled bypass');
console.log('Retired 3.1.2 Preview source is unconditionally disabled');
