// E2E共通ヘルパー: ブラウザ環境の制約を回避するユーティリティ

/**
 * コマンドパレットを開く（headlessブラウザではCtrl+Pが印刷ダイアログに横取りされるため）
 */
async function openCommandPalette(page) {
  await page.evaluate(() => {
    if (window.commandPalette && typeof window.commandPalette.show === 'function') {
      window.commandPalette.show();
    }
  });
}

/**
 * 検索パネルを開く（headlessブラウザではCtrl+Fがブラウザ検索に横取りされるため）
 */
async function openSearchPanel(page) {
  await page.evaluate(() => {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
      window.ZenWriterEditor.toggleSearchPanel();
    }
  });
}

/**
 * 全ガジェットを有効にする（ロードアウトのフィルタリングを無効化）
 */
async function enableAllGadgets(page) {
  await page.evaluate(() => {
    if (!window.ZWGadgets) return;
    var gadgets = window.ZWGadgets;
    var allNames = gadgets._list.map(function (g) { return g.name; });
    // 全ガジェットを全グループに追加するロードアウトを定義・適用
    var groups = {};
    ['structure', 'typography', 'wiki', 'assist'].forEach(function (group) {
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
 * サイドバーを開いて指定グループをアクティブにする
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

module.exports = {
  openCommandPalette,
  openSearchPanel,
  enableAllGadgets,
  openSidebarGroup,
};
