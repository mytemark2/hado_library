/* Shared accessible tab behavior and visual-state synchronization. */
(() => {
  'use strict';

  const TAB_SELECTOR = '[role="tab"]';

  function tabsIn(list) {
    if (!list) return [];
    return [...list.querySelectorAll(TAB_SELECTOR)].filter(tab => tab.closest('[role="tablist"]') === list && !tab.disabled && !tab.hidden);
  }

  function tabLabel(tab) {
    if (!tab) return '';
    const labelled = tab.querySelector('[data-tab-label],.hado-tab-label,.htc-tab-label');
    return String(labelled?.textContent || tab.getAttribute('aria-label') || tab.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function sync(list, activeTab, options = {}) {
    if (!list) return null;
    const tabs = tabsIn(list);
    const active = typeof activeTab === 'string'
      ? tabs.find(tab => tab.matches(activeTab) || tab.id === activeTab || tab.dataset.tabKey === activeTab)
      : activeTab;
    const selected = active && tabs.includes(active) ? active : tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0] || null;
    tabs.forEach(tab => {
      const on = tab === selected;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.setAttribute('tabindex', on ? '0' : '-1');
      tab.toggleAttribute('aria-current', on);
      tab.classList.toggle('is-active', on);
    });
    list.dataset.currentTab = tabLabel(selected);
    const statusId = options.statusId || list.dataset.tabStatusId || '';
    const status = statusId ? document.getElementById(statusId) : null;
    if (status && selected) status.textContent = `${tabLabel(selected)}を表示中`;
    return selected;
  }

  function activate(tab, focus = true) {
    if (!tab || tab.disabled) return;
    if (focus) tab.focus({ preventScroll: true });
    tab.click();
  }

  function onKeydown(event) {
    const tab = event.target?.closest?.(TAB_SELECTOR);
    const list = tab?.closest?.('[role="tablist"]');
    if (!tab || !list) return;
    const tabs = tabsIn(list);
    const index = tabs.indexOf(tab);
    if (index < 0) return;
    const vertical = list.getAttribute('aria-orientation') === 'vertical';
    let nextIndex = index;
    if ((!vertical && event.key === 'ArrowRight') || (vertical && event.key === 'ArrowDown')) nextIndex = (index + 1) % tabs.length;
    else if ((!vertical && event.key === 'ArrowLeft') || (vertical && event.key === 'ArrowUp')) nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(tab);
      return;
    } else return;
    event.preventDefault();
    const next = tabs[nextIndex];
    next?.focus({ preventScroll: true });
    if ((list.dataset.tabActivation || 'automatic') === 'automatic') activate(next, false);
  }

  document.addEventListener('keydown', onKeydown);
  window.HADO_TABS = Object.freeze({ sync, tabsIn, tabLabel });
})();
