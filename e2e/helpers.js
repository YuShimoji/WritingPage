// Shared helpers for Playwright E2E tests.

async function openCommandPalette(page) {
  await page.evaluate(() => {
    if (window.commandPalette && typeof window.commandPalette.show === 'function') {
      window.commandPalette.show();
    }
  });
}

/**
 * ツールバーをフル表示モードに切り替える。
 * ミニマル化により非表示になっているボタンを全て表示する。
 */
async function showFullToolbar(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-toolbar-mode', 'full');
    document.documentElement.removeAttribute('data-toolbar-hidden');
    // フォーカスモードではツールバーが CSS で非表示のため、normal に切り替える
    document.documentElement.setAttribute('data-ui-mode', 'normal');
  });
}

/**
 * 検索パネルを開く（メインハブパネルの検索タブ）。
 */
async function openSearchPanel(page) {
  await page.evaluate(() => {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
      window.ZenWriterEditor.toggleSearchPanel();
    }
  });
  await page.waitForSelector('#main-hub-panel', { state: 'visible', timeout: 5000 }).catch(() => {});
}

/**
 * 全文検索パネルを開く（メインハブパネルの全文検索タブ）。
 */
async function openGlobalSearchPanel(page) {
  await page.evaluate(() => {
    if (window.MainHubPanel && typeof window.MainHubPanel.toggle === 'function') {
      window.MainHubPanel.toggle('global-search');
    }
  });
  await page.waitForSelector('#main-hub-panel', { state: 'visible', timeout: 5000 }).catch(() => {});
}

async function enableAllGadgets(page) {
  // Wait for gadgets to be registered
  await page.waitForFunction(() => {
    return window.ZWGadgets && window.ZWGadgets._list && window.ZWGadgets._list.length > 5;
  }, { timeout: 15000 });

  await page.evaluate(() => {
    if (!window.ZWGadgets) return;
    var gadgets = window.ZWGadgets;
    var allNames = gadgets._list.map(function (g) { return g.name; });

    // KNOWN_GROUPS (sidebar groups only — 'settings' is NOT included)
    var KNOWN = ['structure', 'edit', 'theme', 'assist', 'advanced'];
    if (window.ZWGadgetsUtils && Array.isArray(window.ZWGadgetsUtils.KNOWN_GROUPS)) {
      KNOWN = window.ZWGadgetsUtils.KNOWN_GROUPS.slice();
    }

    // Build sidebar groups from loadout presets (authoritative source)
    var sidebarGroups = {};
    KNOWN.forEach(function (g) { sidebarGroups[g] = []; });
    var settingsNames = [];

    var presets = window.ZWLoadoutPresets;
    if (presets && presets.entries) {
      var ref = presets.entries[presets.active || Object.keys(presets.entries)[0]];
      if (ref && ref.groups) {
        var groupMap = { wiki: 'edit', typography: 'theme' };
        Object.keys(ref.groups).forEach(function (key) {
          if (key === 'settings') {
            // Collect settings gadgets separately (normaliseGroups strips this)
            settingsNames = (ref.groups[key] || []).slice();
            return;
          }
          var target = groupMap[key] || key;
          if (!sidebarGroups[target]) sidebarGroups[target] = [];
          (ref.groups[key] || []).forEach(function (name) {
            if (sidebarGroups[target].indexOf(name) < 0) sidebarGroups[target].push(name);
          });
        });
      }
    }

    // Ensure every registered gadget appears in at least one sidebar group.
    // For gadgets not in the preset, use their registration default groups.
    allNames.forEach(function (name) {
      if (settingsNames.indexOf(name) >= 0) return; // settings-only gadgets handled later
      var found = false;
      Object.keys(sidebarGroups).forEach(function (g) {
        if (sidebarGroups[g].indexOf(name) >= 0) found = true;
      });
      if (!found) {
        var defaults = gadgets._defaults && gadgets._defaults[name];
        var placed = false;
        if (defaults && defaults.length) {
          for (var di = 0; di < defaults.length; di++) {
            var dg = defaults[di];
            if (sidebarGroups[dg] && sidebarGroups[dg].indexOf(name) < 0) {
              sidebarGroups[dg].push(name);
              placed = true;
            }
          }
        }
        if (!placed) sidebarGroups['structure'].push(name);
      }
    });

    // Settings gadgets also need to appear in a sidebar group (using their defaults)
    settingsNames.forEach(function (name) {
      var inSidebar = false;
      Object.keys(sidebarGroups).forEach(function (g) {
        if (sidebarGroups[g].indexOf(name) >= 0) inSidebar = true;
      });
      if (!inSidebar) {
        var defaults = gadgets._defaults && gadgets._defaults[name];
        var placed = false;
        if (defaults && defaults.length) {
          for (var di = 0; di < defaults.length; di++) {
            var dg = defaults[di];
            if (sidebarGroups[dg] && sidebarGroups[dg].indexOf(name) < 0) {
              sidebarGroups[dg].push(name);
              placed = true;
            }
          }
        }
        if (!placed) sidebarGroups['advanced'].push(name);
      }
    });

    // Define and apply loadout (only KNOWN_GROUPS survive normaliseGroups)
    gadgets.defineLoadout('__e2e_all__', { label: 'E2E All', groups: sidebarGroups });
    gadgets.applyLoadout('__e2e_all__');

    // After loadout is applied, add 'settings' to ALL gadgets so they render
    // in the settings modal panel. normaliseGroups strips 'settings' from loadouts,
    // so we must assign directly.
    gadgets._list.forEach(function (g) {
      if (!Array.isArray(g.groups)) g.groups = [];
      if (g.groups.indexOf('settings') < 0) g.groups.push('settings');
    });

    // Force-correct _roots['settings'] to the actual settings panel element.
    // GADGET_GROUPS.settings has migratesTo:'advanced', causing _roots['settings']
    // to incorrectly point to #advanced-gadgets-panel. We must fix this.
    var settingsPanel = document.querySelector('#settings-gadgets-panel');
    if (settingsPanel) {
      // Clear stale renderer (closured over wrong root element)
      if (gadgets._renderers) delete gadgets._renderers['settings'];
      if (gadgets._roots) gadgets._roots['settings'] = settingsPanel;
      // Re-init with correct panel — creates fresh renderer with correct root
      gadgets.init('#settings-gadgets-panel', { group: 'settings' });
    }
  });
  // 執筆集中モードを無効化 (全ガジェットパネルを表示可能にする)
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-writing-sidebar-focus', 'false');
    document.documentElement.setAttribute('data-writing-settings-open', 'false');
    var sp = document.getElementById('structure-gadgets-panel');
    if (sp) sp.style.display = '';
    document.querySelectorAll('.accordion-category[data-category]').forEach(function(s) {
      s.style.display = '';
      s.setAttribute('aria-hidden', 'false');
    });
  });

  // デフォルト折りたたみ状態を全展開にする (localStorage にも保存して再レンダリング時も展開)
  await page.evaluate(() => {
    if (!window.ZWGadgets) return;
    var state = {};
    window.ZWGadgets._list.forEach(function(g) {
      state[g.name] = true; // true = 展開
    });
    localStorage.setItem('zenwriter-gadget-collapsed', JSON.stringify(state));
    // 現在のDOMも展開
    document.querySelectorAll('.gadget-wrapper').forEach(function(w) {
      var name = w.getAttribute('data-gadget-name');
      if (name && window.ZWGadgets._setGadgetCollapsed) {
        window.ZWGadgets._setGadgetCollapsed(name, false, w, true);
      }
    });
  });
  await page.waitForTimeout(300);
}

/**
 * 指定パネル内の全ガジェットを展開する。
 */
async function expandAllGadgets(page, panelSelector) {
  await page.evaluate((sel) => {
    var panel = sel ? document.querySelector(sel) : document;
    if (!panel) return;
    panel.querySelectorAll('.gadget-wrapper').forEach(function(w) {
      var name = w.getAttribute('data-gadget-name');
      if (name && window.ZWGadgets && window.ZWGadgets._setGadgetCollapsed) {
        window.ZWGadgets._setGadgetCollapsed(name, false, w, true);
      }
    });
  }, panelSelector || null);
  await page.waitForTimeout(200);
}

/**
 * サイドバーを開き、指定カテゴリのアコーディオンを展開する。
 */
async function openSidebarGroup(page, group) {
  await page.evaluate((g) => {
    var toggleBtn = document.getElementById('toggle-sidebar');
    var sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('open') && toggleBtn) {
      toggleBtn.click();
    }

    if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
      window.sidebarManager.activateSidebarGroup(g);
    }
    if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
      window.ZWGadgets.setActiveGroup(g);
    }
  }, group);

  await expandAccordion(page, group);
  await page.waitForTimeout(300);
}

/**
 * アコーディオンカテゴリを展開する。
 * @param {import('@playwright/test').Page} page
 * @param {string} categoryId - structure, edit, theme, assist, advanced
 */
async function expandAccordion(page, categoryId) {
  await page.evaluate((id) => {
    var header = document.querySelector(
      '.accordion-header[aria-controls="accordion-' + id + '"]'
    );
    if (header && header.getAttribute('aria-expanded') !== 'true') {
      header.click();
    }
  }, categoryId);
  await page.waitForTimeout(300);
}

/**
 * メインハブパネルを指定タブで開く。
 * @param {import('@playwright/test').Page} page
 * @param {string} tab - 'decoration' | 'animation' | 'search' | 'global-search'
 */
async function openMainHubPanel(page, tab) {
  await page.evaluate((t) => {
    if (window.MainHubPanel && typeof window.MainHubPanel.toggle === 'function') {
      window.MainHubPanel.toggle(t);
    }
  }, tab);
  await page.waitForSelector('#main-hub-panel', { state: 'visible', timeout: 5000 });
}

/**
 * 設定モーダルを開く（ツールバーのボタン経由）。
 */
async function openSettingsModal(page) {
  await showFullToolbar(page);
  await page.waitForSelector('#toggle-settings', { state: 'visible', timeout: 5000 });
  await page.click('#toggle-settings');
  await page.waitForSelector('#settings-modal', { state: 'visible', timeout: 5000 });
}

/**
 * 執筆集中サイドバーモードを無効化する。
 * writing-focus が有効だと structure-gadgets-panel や assist/edit 等のカテゴリが非表示になるため、
 * ガジェット操作テストでは事前に呼び出す。
 */
async function disableWritingFocus(page) {
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-writing-sidebar-focus', 'false');
    document.documentElement.setAttribute('data-writing-settings-open', 'false');
    // CSS非表示を解除: structure-gadgets-panel
    var sp = document.getElementById('structure-gadgets-panel');
    if (sp) sp.style.display = '';
    // JS非表示を解除: 全アコーディオンカテゴリ
    document.querySelectorAll('.accordion-category[data-category]').forEach(function(s) {
      s.style.display = '';
      s.setAttribute('aria-hidden', 'false');
    });
  });
}

module.exports = {
  openCommandPalette,
  openSearchPanel,
  openGlobalSearchPanel,
  openMainHubPanel,
  showFullToolbar,
  enableAllGadgets,
  expandAllGadgets,
  openSidebarGroup,
  expandAccordion,
  openSettingsModal,
  disableWritingFocus,
};
