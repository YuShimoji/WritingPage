// Shared helpers for Playwright E2E tests.

async function openCommandPalette(page) {
  await page.evaluate(() => {
    if (window.commandPalette && typeof window.commandPalette.show === 'function') {
      window.commandPalette.show();
    }
  });
}

async function openSearchPanel(page) {
  await page.evaluate(() => {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
      window.ZenWriterEditor.toggleSearchPanel();
    }
  });
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

async function openSidebarGroup(page, group) {
  await page.evaluate((g) => {
    if (g === 'settings') {
      var settingsBtn = document.getElementById('toggle-settings');
      if (settingsBtn) settingsBtn.click();
      return;
    }

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
