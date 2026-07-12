#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('hado_core.js', 'utf8');
const start = source.indexOf('function renderDebugPanel(');
const end = source.indexOf('function getResponsiveDiagnosticSnapshot(', start);
assert(start >= 0 && end > start, 'renderDebugPanel source must be available');

const panelClasses = new Set(['panel', 'hidden-panel']);
const panel = {
  style: { display: '' },
  classList: {
    toggle(name, force) {
      if (force) panelClasses.add(name);
      else panelClasses.delete(name);
    }
  }
};
const content = { textContent: '' };
const bodyClasses = new Set();
const sandbox = {
  console,
  els: { debugPanel: panel, debugPanelContent: content },
  state: { showRawJson: false },
  document: {
    body: {
      classList: {
        toggle(name, force) {
          if (force) bodyClasses.add(name);
          else bodyClasses.delete(name);
        }
      }
    }
  },
  cancelDebugPanelRender() {},
  schedulePcSearchViewportLayout() {},
  setDebugCopyButtonEnabled() {},
  scheduleDebugPanelRender(callback) { callback(); },
  buildDebugPanelSummaryText() { return 'Debug Log Summary'; },
  debugLog() {},
  performance: { now() { return 0; } }
};

vm.createContext(sandbox);
vm.runInContext(source.slice(start, end), sandbox, { filename: 'renderDebugPanel.js' });

sandbox.renderDebugPanel(null, '');
assert(panelClasses.has('hidden-panel'), 'disabled Debug Log panel must remain hidden');
assert.strictEqual(panel.style.display, 'none', 'disabled Debug Log panel must use display:none');

sandbox.state.showRawJson = true;
sandbox.renderDebugPanel(null, '');
assert(!panelClasses.has('hidden-panel'), 'enabled Debug Log panel must remove hidden-panel');
assert(bodyClasses.has('debug-panel-visible'), 'enabled Debug Log must activate responsive body layout');
assert.strictEqual(panel.style.display, '', 'enabled Debug Log panel must clear inline display:none');
assert.strictEqual(content.textContent, 'Debug Log Summary', 'enabled Debug Log panel must render its summary');

console.log('PASS Update09.5.52 Debug Log panel visibility');
