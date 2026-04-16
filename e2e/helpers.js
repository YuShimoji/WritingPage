// Shared helpers for Playwright E2E tests.

/**
 * UIモードを setUIMode 経由で切り替える。
 * 直接 setAttribute するとサイドエフェクト(サイドバー閉じ、ツールバー非表示等)が迂回されるため、
 * 全E2Eテストはこのヘルパーを使うこと。
 */
async function setUIMode(page, mode) {
  await page.evaluate((m) => {
    if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
      window.ZenWriterApp.setUIMode(m);
    } else {
      document.documentElement.setAttribute('data-ui-mode', m);
    }
  }, mode);
}

async function openCommandPalette(page) {
  await page.evaluate(() => {
    if (window.commandPalette && typeof window.commandPalette.show === 'function') {
      window.commandPalette.show();
    }
  });
}

/**
 * E2E 用にフル Chrome（Normal）へ寄せる。旧メイン横帯ツールバー廃止後は setUIMode のみ。
 */
async function showFullToolbar(page) {
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-toolbar-mode');
    document.documentElement.removeAttribute('data-toolbar-hidden');
    if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
      window.ZenWriterApp.setUIMode('normal');
    } else {
      document.documentElement.setAttribute('data-ui-mode', 'normal');
    }
    // Focus→Normal 遷移でサイドバー未オープンの場合は明示的に開く
    var sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('open') &&
        window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
      window.sidebarManager.forceSidebarState(true);
    }
  });
  // サイドバーの CSS 遷移完了を待つ
  await page.waitForTimeout(200);
}


/**
 * 全ガジェットをサイドバーに載せるロードアウトを適用する。
 * @param {import('@playwright/test').Page} page
 * @param {{ expandAllGadgets?: boolean }} [opts] - `expandAllGadgets: false` で初回折りたたみ状態を上書きしない（defaultCollapsed の E2E 用）
 */
async function enableAllGadgets(page, opts) {
  var expandAll = !opts || opts.expandAllGadgets !== false;
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

    // session 103: settings グループは deprecated → advanced に統合済み。
    // ALL ガジェットを advanced グループに登録し、`#advanced-gadgets-panel` に集約描画する。
    gadgets._list.forEach(function (g) {
      if (!Array.isArray(g.groups)) g.groups = [];
      if (g.groups.indexOf('advanced') < 0) g.groups.push('advanced');
    });

    var advancedPanel = document.querySelector('#advanced-gadgets-panel');
    if (advancedPanel) {
      if (gadgets._renderers) delete gadgets._renderers['advanced'];
      if (gadgets._roots) gadgets._roots['advanced'] = advancedPanel;
      gadgets.init('#advanced-gadgets-panel', { group: 'advanced' });
    }
  });
  // 執筆集中モードと slim モードを無効化 (全ガジェットパネル + chrome を表示可能にする)
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-writing-sidebar-focus', 'false');
    document.documentElement.setAttribute('data-writing-settings-open', 'false');
    document.documentElement.removeAttribute('data-sidebar-slim');
    var sp = document.getElementById('structure-gadgets-panel');
    if (sp) sp.style.display = '';
    document.querySelectorAll('.accordion-category[data-category]').forEach(function(s) {
      s.style.display = '';
      s.setAttribute('aria-hidden', 'false');
    });
  });

  if (expandAll) {
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
    var sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('open')) {
      if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(true);
      } else {
        var toggleBtn = document.getElementById('toggle-sidebar');
        if (toggleBtn) toggleBtn.click();
      }
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
 * 設定モーダルを開く (session 103: 動線をサイドバー詳細設定 (advanced) カテゴリ展開に変更)。
 * 詳細設定アコーディオンが折りたたみ状態でも DOM 上に存在するため state: 'attached' で確認。
 */
async function openSettingsModal(page) {
  await page.evaluate(() => {
    if (window.ZenWriterApp && typeof window.ZenWriterApp.openSettingsModal === 'function') {
      window.ZenWriterApp.openSettingsModal();
    }
  });
  await page.waitForSelector('#advanced-gadgets-panel', { state: 'attached', timeout: 5000 });
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
    document.documentElement.removeAttribute('data-sidebar-slim');
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

/**
 * サイドバーを Normal モードで開き、指定グループのパネルを表示する。
 * openAssistPanel / openThemePanel / openSidebarAndStructurePanel の共通化。
 * @param {import('@playwright/test').Page} page
 * @param {string} group - 'structure' | 'edit' | 'theme' | 'assist' | 'advanced'
 * @param {{ expandGadgets?: boolean, waitSelector?: string }} [opts]
 */
async function openSidebarPanel(page, group, opts = {}) {
  await setUIMode(page, 'normal');
  await page.waitForFunction(() => {
    try { return !!window.ZWGadgets; } catch (_) { return false; }
  }, { timeout: 20000 });
  await page.waitForSelector('#sidebar', { timeout: 10000 });
  await enableAllGadgets(page);

  await page.evaluate(() => {
    var sb = document.getElementById('sidebar');
    if (sb && !sb.classList.contains('open')) {
      if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(true);
      } else {
        var btn = document.getElementById('toggle-sidebar');
        if (btn) btn.click();
      }
    }
    // Focus モードの設定パネルが閉じている場合は開く
    var settingsBtn = document.getElementById('writing-focus-settings-btn');
    if (settingsBtn && settingsBtn.getAttribute('aria-pressed') !== 'true') {
      settingsBtn.click();
    }
  });

  await openSidebarGroup(page, group);
  await page.waitForSelector('#' + group + '-gadgets-panel', { state: 'visible', timeout: 10000 });

  if (opts.expandGadgets) {
    await page.evaluate(() => {
      document.querySelectorAll('.gadget-wrapper').forEach(function(w) {
        var name = w.getAttribute('data-gadget-name');
        if (name && window.ZWGadgets && window.ZWGadgets._setGadgetCollapsed) {
          window.ZWGadgets._setGadgetCollapsed(name, false, w, true);
        }
      });
    });
  }

  if (opts.waitSelector) {
    await page.waitForSelector(opts.waitSelector, { state: 'attached', timeout: 10000 });
  }
  await page.waitForTimeout(300);
}

/**
 * window.confirm / window.prompt をモックし、呼び出しログを記録する。
 * @param {import('@playwright/test').Page} page
 * @param {{ confirmReturn?: boolean, promptReturn?: string }} [opts]
 */
async function mockDialogs(page, opts = {}) {
  await page.evaluate(({ cr, pr }) => {
    window.__zwDialogLog = [];
    var origConfirm = window.confirm;
    var origPrompt = window.prompt;
    window.__zwRestoreDialogs = function() {
      window.confirm = origConfirm;
      window.prompt = origPrompt;
    };
    window.confirm = function(msg) {
      window.__zwDialogLog.push({ type: 'confirm', message: String(msg) });
      return cr;
    };
    window.prompt = function(msg, def) {
      window.__zwDialogLog.push({ type: 'prompt', message: String(msg), defaultValue: def });
      return pr;
    };
  }, { cr: opts.confirmReturn !== false, pr: opts.promptReturn || '' });
}

/**
 * mockDialogs で設定したモックを復元し、ログを返す。
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Array<{type: string, message: string}>>}
 */
async function restoreDialogs(page) {
  var log = await page.evaluate(() => {
    var l = window.__zwDialogLog || [];
    if (typeof window.__zwRestoreDialogs === 'function') window.__zwRestoreDialogs();
    return l;
  });
  return log;
}

/**
 * Normal モードを確実に適用する。
 * localStorage に保存された設定が Focus の場合があるため、
 * テスト開始時に呼び出して一貫した状態にする。
 */
async function ensureNormalMode(page) {
  await setUIMode(page, 'normal');
  // Focus→Normal 遷移で sidebar-overlay が pointer-events: auto になる副作用を解消
  await page.evaluate(() => {
    var overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.style.pointerEvents = 'none';
      overlay.style.display = 'none';
    }
  });
  await page.waitForTimeout(100);
}

/**
 * サイドバーを evaluate 経由で開く。
 * page.click('#toggle-sidebar') はビューポート外でエラーになるため、
 * DOM API 経由でクリックする。
 */
async function openSidebar(page) {
  await page.evaluate(() => {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar || sidebar.classList.contains('open')) return;
    if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
      window.sidebarManager.forceSidebarState(true);
      return;
    }
    var btn = document.getElementById('toggle-sidebar');
    if (btn) btn.click();
  });
  await page.waitForTimeout(300);
}

/** サイドバーを閉じる（#toggle-sidebar は画面外のため API 優先） */
async function closeSidebar(page) {
  await page.evaluate(() => {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar || !sidebar.classList.contains('open')) return;
    if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
      window.sidebarManager.forceSidebarState(false);
      return;
    }
    var btn = document.getElementById('toggle-sidebar');
    if (btn) btn.click();
  });
  await page.waitForTimeout(300);
}

/**
 * WYSIWYG → textarea モードに切り替える (オーバーフローメニュー経由)。
 */
/**
 * 開発者モードを有効化（Markdown ソース切替の E2E 用。localhost 以外では必須）
 */
async function enableDeveloperMode(page) {
  await page.evaluate(() => {
    try {
      localStorage.setItem('zenwriter-developer-mode', 'true');
    } catch (_) { /* noop */ }
    if (window.ZenWriterDeveloperMode && typeof window.ZenWriterDeveloperMode.syncDocumentAttr === 'function') {
      window.ZenWriterDeveloperMode.syncDocumentAttr();
    } else {
      document.documentElement.setAttribute('data-developer-mode', 'true');
    }
  });
}

async function switchToTextareaMode(page) {
  await enableDeveloperMode(page);
  await page.locator('[data-dropdown="overflow"] .wysiwyg-dropdown-toggle').dispatchEvent('mousedown');
  await page.locator('[data-overflow="switch-textarea"]').dispatchEvent('mousedown');
  await page.locator('#editor').waitFor({ state: 'visible', timeout: 5000 });
}

module.exports = {
  setUIMode,
  ensureNormalMode,
  openCommandPalette,
  showFullToolbar,
  enableAllGadgets,
  expandAllGadgets,
  openSidebarGroup,
  expandAccordion,
  openSettingsModal,
  disableWritingFocus,
  openSidebarPanel,
  openSidebar,
  closeSidebar,
  mockDialogs,
  restoreDialogs,
  switchToTextareaMode,
  enableDeveloperMode,
};
