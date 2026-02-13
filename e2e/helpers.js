// E2E共通ヘルパー: ブラウザ環境の制約を回避するユーティリティ

/**
 * ページ読み込み後の初期化を待機
 */
async function waitForAppReady(page) {
  await page.waitForSelector('#editor', { timeout: 10000 });
  await page.waitForFunction(() => {
    return !!(window.ZWGadgets && window.ZWGadgets._list && window.ZWGadgets._list.length > 0);
  }, { timeout: 10000 });
}

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
  await page.waitForTimeout(500);
}

/**
 * 特定のガジェットを有効化してサイドバーに表示
 * @param {Page} page - Playwrightページ
 * @param {string[]} gadgetNames - 有効化するガジェット名の配列
 * @param {string} targetGroup - 表示するグループ（structure, assist, wiki, typography）
 */
async function enableGadgets(page, gadgetNames, targetGroup) {
  await page.evaluate(({ names, group }) => {
    if (!window.ZWGadgets) return;
    var gadgets = window.ZWGadgets;
    // 現在のロードアウトを取得
    var current = gadgets._loadouts && gadgets._loadouts.active;
    var entries = gadgets._loadouts && gadgets._loadouts.entries;
    var baseGroups = {};
    if (current && entries && entries[current]) {
      baseGroups = JSON.parse(JSON.stringify(entries[current].groups || {}));
    }
    // 指定されたガジェットを追加
    if (!baseGroups[group]) baseGroups[group] = [];
    names.forEach(function (name) {
      if (baseGroups[group].indexOf(name) < 0) {
        baseGroups[group].push(name);
      }
    });
    gadgets.defineLoadout('__e2e_custom__', { label: 'E2E Custom', groups: baseGroups });
    gadgets.applyLoadout('__e2e_custom__');
  }, { names: gadgetNames, group: targetGroup });
  await page.waitForTimeout(500);
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
  waitForAppReady,
  openCommandPalette,
  openSearchPanel,
  enableAllGadgets,
  enableGadgets,
  openSidebarGroup,
};
