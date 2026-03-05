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
  await page.evaluate(() => {
    if (!window.ZWGadgets) return;
    var gadgets = window.ZWGadgets;
    var allNames = gadgets._list.map(function (g) {
      return g.name;
    });

    var knownGroups = ['structure', 'wiki', 'assist', 'typography', 'settings'];
    if (window.ZWGadgetsUtils && Array.isArray(window.ZWGadgetsUtils.KNOWN_GROUPS)) {
      knownGroups = window.ZWGadgetsUtils.KNOWN_GROUPS.slice();
    }

    var groups = {};
    knownGroups.forEach(function (group) {
      groups[group] = allNames.filter(function (name) {
        return gadgets._list.some(function (g) {
          return g.name === name && g.groups && g.groups.indexOf(group) >= 0;
        });
      });
    });

    gadgets.defineLoadout('__e2e_all__', { label: 'E2E All', groups: groups });
    gadgets.applyLoadout('__e2e_all__');
  });
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

  await page.waitForTimeout(500);
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
 * 設定モーダルを開く（ツールバーのボタン経由）。
 */
async function openSettingsModal(page) {
  await showFullToolbar(page);
  await page.waitForSelector('#toggle-settings', { state: 'visible', timeout: 5000 });
  await page.click('#toggle-settings');
  await page.waitForSelector('#settings-modal', { state: 'visible', timeout: 5000 });
}

module.exports = {
  openCommandPalette,
  openSearchPanel,
  openGlobalSearchPanel,
  showFullToolbar,
  enableAllGadgets,
  openSidebarGroup,
  expandAccordion,
  openSettingsModal,
};
