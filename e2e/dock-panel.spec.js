// @ts-nocheck
const { test, expect } = require('@playwright/test');

test.describe('SP-076 Phase 1: Dock Panel', () => {
  test('DockManager is initialized on page load', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var dm = window.dockManager;
      if (!dm) return null;
      return {
        exists: true,
        hasInit: typeof dm.init === 'function',
        hasMoveSidebarTo: typeof dm.moveSidebarTo === 'function',
        hasToggleSidebarDock: typeof dm.toggleSidebarDock === 'function'
      };
    });

    expect(result).toBeTruthy();
    expect(result.exists).toBe(true);
    expect(result.hasMoveSidebarTo).toBe(true);
    expect(result.hasToggleSidebarDock).toBe(true);
  });

  test('Left dock panel element exists in DOM', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const dockPanel = await page.$('#dock-panel-left');
    expect(dockPanel).toBeTruthy();
  });

  test('Left dock panel has close button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const closeBtn = await page.$('#dock-left-close');
    expect(closeBtn).toBeTruthy();
  });

  test('Left dock panel has resize handle', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const resizeHandle = await page.$('#dock-left-resize-handle');
    expect(resizeHandle).toBeTruthy();
  });

  test('Dock panel is hidden in focus mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // Switch to focus mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-ui-mode', 'focus');
    });

    const isHidden = await page.evaluate(() => {
      var panel = document.getElementById('dock-panel-left');
      if (!panel) return true;
      var style = window.getComputedStyle(panel);
      return style.display === 'none' || style.visibility === 'hidden' || panel.hidden;
    });

    // dock panel should not be visible in focus mode
    expect(isHidden).toBe(true);
  });

  test('Toggle left panel open and close via API', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // Open left panel
    await page.evaluate(() => window.dockManager.setLeftPanelVisible(true));

    const isOpen = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-dock-left-open') === 'true';
    });
    expect(isOpen).toBe(true);

    // Verify panel is displayed
    const display = await page.evaluate(() => {
      var panel = document.getElementById('dock-panel-left');
      return window.getComputedStyle(panel).display;
    });
    expect(display).toBe('flex');

    // Close left panel
    await page.evaluate(() => window.dockManager.setLeftPanelVisible(false));

    const isClosed = await page.evaluate(() => {
      return document.documentElement.hasAttribute('data-dock-left-open');
    });
    expect(isClosed).toBe(false);
  });

  test('Move sidebar from left to right via API', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // Move sidebar to right
    await page.evaluate(() => window.dockManager.moveSidebarTo('right'));
    await page.waitForTimeout(100);

    const dockSide = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-dock-sidebar');
    });
    expect(dockSide).toBe('right');

    // Move back to left
    await page.evaluate(() => window.dockManager.moveSidebarTo('left'));
    await page.waitForTimeout(100);

    const dockSideAfter = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-dock-sidebar');
    });
    expect(dockSideAfter).toBe('left');
  });

  test('Left panel width is persisted to localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // Set custom width
    await page.evaluate(() => {
      window.dockManager.setLeftPanelVisible(true);
      window.dockManager.setDockWidth('left', 350);
    });

    // Verify CSS variable
    const cssWidth = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--dock-left-width');
    });
    expect(cssWidth).toBe('350px');

    // Verify localStorage
    const stored = await page.evaluate(() => {
      var raw = localStorage.getItem('zenwriter-dock-layout');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored).toBeTruthy();
    expect(stored.leftPanel.width).toBe(350);
  });

  test('Sidebar width is persisted to localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // Set custom sidebar width
    await page.evaluate(() => {
      window.dockManager.setDockWidth('sidebar', 400);
    });

    // Verify CSS variable
    const cssWidth = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--sidebar-width');
    });
    expect(cssWidth).toBe('400px');

    // Verify localStorage
    const stored = await page.evaluate(() => {
      var raw = localStorage.getItem('zenwriter-dock-layout');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored).toBeTruthy();
    expect(stored.rightPanel.width).toBe(400);
  });

  test('Dock layout restores after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // Set layout: sidebar right + left panel open + custom widths
    await page.evaluate(() => {
      window.dockManager.moveSidebarTo('right');
    });
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      window.dockManager.setLeftPanelVisible(true);
      window.dockManager.setDockWidth('left', 300);
    });

    // Reload
    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });

    const layout = await page.evaluate(() => {
      return {
        dockSide: document.documentElement.getAttribute('data-dock-sidebar'),
        leftOpen: document.documentElement.getAttribute('data-dock-left-open'),
        leftWidth: document.documentElement.style.getPropertyValue('--dock-left-width')
      };
    });

    expect(layout.dockSide).toBe('right');
    expect(layout.leftOpen).toBe('true');
    expect(layout.leftWidth).toBe('300px');
  });

  test('Dock panel hidden in blank and reader modes', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // Open left panel first
    await page.evaluate(() => window.dockManager.setLeftPanelVisible(true));

    for (const mode of ['blank', 'reader']) {
      await page.evaluate((m) => {
        document.documentElement.setAttribute('data-ui-mode', m);
      }, mode);

      const isHidden = await page.evaluate(() => {
        var panel = document.getElementById('dock-panel-left');
        return window.getComputedStyle(panel).display === 'none';
      });
      expect(isHidden).toBe(true);
    }

    // Restore normal mode — panel should reappear
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-ui-mode', 'normal');
      window.dockManager._onUIModeChanged('normal');
    });

    const visibleAgain = await page.evaluate(() => {
      var panel = document.getElementById('dock-panel-left');
      return window.getComputedStyle(panel).display;
    });
    expect(visibleAgain).toBe('flex');
  });

  test('Close button closes left panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // Open left panel
    await page.evaluate(() => window.dockManager.setLeftPanelVisible(true));

    // Click close button
    await page.click('#dock-left-close');

    const isClosed = await page.evaluate(() => {
      return !document.documentElement.hasAttribute('data-dock-left-open');
    });
    expect(isClosed).toBe(true);
  });

  test('Width clamped to min/max bounds', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // Try setting width below minimum (180px)
    await page.evaluate(() => window.dockManager.setDockWidth('left', 50));
    const minWidth = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--dock-left-width');
    });
    expect(minWidth).toBe('180px');

    // Try setting width above maximum (50% of window)
    await page.evaluate(() => window.dockManager.setDockWidth('left', 99999));
    const maxWidth = await page.evaluate(() => {
      var w = document.documentElement.style.getPropertyValue('--dock-left-width');
      return parseInt(w) <= Math.floor(window.innerWidth * 0.5);
    });
    expect(maxWidth).toBe(true);
  });
});

test.describe('SP-076 Phase 2: Tab Groups', () => {
  test('Tab bar element exists in DOM', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const tabBar = await page.$('#dock-left-tab-bar');
    expect(tabBar).toBeTruthy();
  });

  test('DockManager has tab API methods', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const api = await page.evaluate(() => {
      var dm = window.dockManager;
      return {
        addTab: typeof dm.addTab === 'function',
        removeTab: typeof dm.removeTab === 'function',
        setActiveTab: typeof dm.setActiveTab === 'function',
        reorderTabs: typeof dm.reorderTabs === 'function',
        getTabs: typeof dm.getTabs === 'function',
        getActiveTabIndex: typeof dm.getActiveTabIndex === 'function'
      };
    });

    expect(api.addTab).toBe(true);
    expect(api.removeTab).toBe(true);
    expect(api.setActiveTab).toBe(true);
    expect(api.reorderTabs).toBe(true);
    expect(api.getTabs).toBe(true);
    expect(api.getActiveTabIndex).toBe(true);
  });

  test('Adding a single tab auto-opens the left panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('test-1', 'Test Tab');
    });

    const isOpen = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-dock-left-open') === 'true';
    });
    expect(isOpen).toBe(true);

    const tabs = await page.evaluate(() => window.dockManager.getTabs());
    expect(tabs).toHaveLength(1);
    expect(tabs[0].id).toBe('test-1');
    expect(tabs[0].title).toBe('Test Tab');
  });

  test('Tab bar hidden with 0-1 tabs, visible with 2+', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    // 0 tabs: hidden
    const hidden0 = await page.evaluate(() => {
      var bar = document.getElementById('dock-left-tab-bar');
      return window.getComputedStyle(bar).display;
    });
    expect(hidden0).toBe('none');

    // 1 tab: hidden
    await page.evaluate(() => window.dockManager.addTab('t1', 'Tab 1'));
    const hidden1 = await page.evaluate(() => {
      var bar = document.getElementById('dock-left-tab-bar');
      return window.getComputedStyle(bar).display;
    });
    expect(hidden1).toBe('none');

    // 2 tabs: visible
    await page.evaluate(() => window.dockManager.addTab('t2', 'Tab 2'));
    const visible2 = await page.evaluate(() => {
      var bar = document.getElementById('dock-left-tab-bar');
      return window.getComputedStyle(bar).display;
    });
    expect(visible2).toBe('flex');
  });

  test('Tab click switches active tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('a', 'Alpha');
      window.dockManager.addTab('b', 'Beta');
    });

    // Active tab should be the last added (Beta)
    const active0 = await page.evaluate(() => window.dockManager.getActiveTabIndex());
    expect(active0).toBe(1);

    // Click first tab
    await page.click('.dock-tab[data-tab-index="0"]');

    const active1 = await page.evaluate(() => window.dockManager.getActiveTabIndex());
    expect(active1).toBe(0);

    // Verify aria-selected
    const ariaFirst = await page.getAttribute('.dock-tab[data-tab-index="0"]', 'aria-selected');
    const ariaSecond = await page.getAttribute('.dock-tab[data-tab-index="1"]', 'aria-selected');
    expect(ariaFirst).toBe('true');
    expect(ariaSecond).toBe('false');
  });

  test('Removing a tab updates the tab bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('x', 'X');
      window.dockManager.addTab('y', 'Y');
      window.dockManager.addTab('z', 'Z');
    });

    // Remove middle tab
    await page.evaluate(() => window.dockManager.removeTab('y'));

    const tabs = await page.evaluate(() => window.dockManager.getTabs());
    expect(tabs).toHaveLength(2);
    expect(tabs[0].id).toBe('x');
    expect(tabs[1].id).toBe('z');
  });

  test('Removing active tab adjusts activeTab index', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('a', 'A');
      window.dockManager.addTab('b', 'B');
      window.dockManager.addTab('c', 'C');
      // Active is now 2 (C)
    });

    // Remove last tab (active)
    await page.evaluate(() => window.dockManager.removeTab(2));

    const active = await page.evaluate(() => window.dockManager.getActiveTabIndex());
    expect(active).toBe(1); // Should fall back to B
  });

  test('Duplicate tab id activates existing instead of adding', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('dup', 'First');
      window.dockManager.addTab('other', 'Other');
      // Try adding duplicate
      window.dockManager.addTab('dup', 'First Again');
    });

    const tabs = await page.evaluate(() => window.dockManager.getTabs());
    expect(tabs).toHaveLength(2);
    const active = await page.evaluate(() => window.dockManager.getActiveTabIndex());
    expect(active).toBe(0); // Should switch to existing 'dup'
  });

  test('Reorder tabs via API', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('r1', 'One');
      window.dockManager.addTab('r2', 'Two');
      window.dockManager.addTab('r3', 'Three');
      window.dockManager.setActiveTab(0); // activate r1
    });

    // Move r1 (index 0) to index 2
    await page.evaluate(() => window.dockManager.reorderTabs(0, 2));

    const tabs = await page.evaluate(() => window.dockManager.getTabs());
    expect(tabs[0].id).toBe('r2');
    expect(tabs[1].id).toBe('r3');
    expect(tabs[2].id).toBe('r1');

    // Active tab should follow r1 to index 2
    const active = await page.evaluate(() => window.dockManager.getActiveTabIndex());
    expect(active).toBe(2);
  });

  test('Tab state persists after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('p1', 'Persist 1');
      window.dockManager.addTab('p2', 'Persist 2');
      window.dockManager.setActiveTab(0);
    });

    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });

    const state = await page.evaluate(() => {
      return {
        tabs: window.dockManager.getTabs(),
        active: window.dockManager.getActiveTabIndex()
      };
    });

    expect(state.tabs).toHaveLength(2);
    expect(state.tabs[0].id).toBe('p1');
    expect(state.tabs[1].id).toBe('p2');
    expect(state.active).toBe(0);
  });

  test('Tab close button removes tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('c1', 'Close Me');
      window.dockManager.addTab('c2', 'Stay');
    });

    // Click close button on first tab
    await page.click('.dock-tab[data-tab-index="0"] .dock-tab__close');

    const tabs = await page.evaluate(() => window.dockManager.getTabs());
    expect(tabs).toHaveLength(1);
    expect(tabs[0].id).toBe('c2');
  });

  test('Header title reflects active tab name', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('h1', 'Wiki');
      window.dockManager.addTab('h2', 'Outline');
    });

    // Active is h2 (Outline)
    const title1 = await page.evaluate(() => {
      return document.querySelector('.dock-panel-left__title').textContent;
    });
    expect(title1).toBe('Outline');

    // Switch to h1
    await page.evaluate(() => window.dockManager.setActiveTab(0));
    const title2 = await page.evaluate(() => {
      return document.querySelector('.dock-panel-left__title').textContent;
    });
    expect(title2).toBe('Wiki');
  });

  test('Tab content panels show/hide correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('ct1', 'Content A', function (panel) {
        panel.textContent = 'Content of A';
      });
      window.dockManager.addTab('ct2', 'Content B', function (panel) {
        panel.textContent = 'Content of B';
      });
    });

    // Active is ct2 — its panel should be visible, ct1 hidden
    const visibility = await page.evaluate(() => {
      var panels = document.querySelectorAll('#dock-left-content .dock-tab-panel');
      var result = {};
      for (var i = 0; i < panels.length; i++) {
        result[panels[i].getAttribute('data-dock-tab-id')] = panels[i].getAttribute('data-active');
      }
      return result;
    });

    expect(visibility['ct1']).toBe('false');
    expect(visibility['ct2']).toBe('true');

    // Switch to ct1
    await page.evaluate(() => window.dockManager.setActiveTab(0));

    const visibility2 = await page.evaluate(() => {
      var panels = document.querySelectorAll('#dock-left-content .dock-tab-panel');
      var result = {};
      for (var i = 0; i < panels.length; i++) {
        result[panels[i].getAttribute('data-dock-tab-id')] = panels[i].getAttribute('data-active');
      }
      return result;
    });

    expect(visibility2['ct1']).toBe('true');
    expect(visibility2['ct2']).toBe('false');
  });
});

test.describe('SP-076 Phase 3: Floating & Snap', () => {
  test('DockManager has floating API methods', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const api = await page.evaluate(() => {
      var dm = window.dockManager;
      return {
        floatTab: typeof dm.floatTab === 'function',
        snapToDock: typeof dm.snapToDock === 'function',
        getFloating: typeof dm.getFloating === 'function',
        closeFloating: typeof dm.closeFloating === 'function'
      };
    });

    expect(api.floatTab).toBe(true);
    expect(api.snapToDock).toBe(true);
    expect(api.getFloating).toBe(true);
    expect(api.closeFloating).toBe(true);
  });

  test('Float a tab creates a floating panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('f1', 'Float Me', function (panel) {
        panel.textContent = 'Floating content';
      });
    });

    // Float the tab
    await page.evaluate(() => {
      window.dockManager.floatTab('f1', { x: 100, y: 100, width: 300, height: 250 });
    });

    // Tab should be removed from dock
    const tabs = await page.evaluate(() => window.dockManager.getTabs());
    expect(tabs).toHaveLength(0);

    // Floating panel should exist
    const floatEl = await page.$('.dock-floating[data-float-id="f1"]');
    expect(floatEl).toBeTruthy();

    // Floating state should be stored
    const floating = await page.evaluate(() => window.dockManager.getFloating());
    expect(floating).toHaveLength(1);
    expect(floating[0].id).toBe('f1');
    expect(floating[0].x).toBe(100);
    expect(floating[0].y).toBe(100);
  });

  test('Floating panel has header, dock button, and close button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('fh', 'Header Test');
      window.dockManager.floatTab('fh');
    });

    const title = await page.evaluate(() => {
      var el = document.querySelector('.dock-floating[data-float-id="fh"] .dock-floating__title');
      return el ? el.textContent : null;
    });
    expect(title).toBe('Header Test');

    const btns = await page.evaluate(() => {
      var el = document.querySelector('.dock-floating[data-float-id="fh"] .dock-floating__actions');
      return el ? el.querySelectorAll('.dock-floating__btn').length : 0;
    });
    expect(btns).toBe(2); // dock + close
  });

  test('Snap floating panel back to dock', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('snap1', 'Snap Test');
      window.dockManager.floatTab('snap1');
    });

    // Snap back
    await page.evaluate(() => {
      window.dockManager.snapToDock('snap1');
    });

    // Floating should be gone
    const floating = await page.evaluate(() => window.dockManager.getFloating());
    expect(floating).toHaveLength(0);

    // Should be back as a dock tab
    const tabs = await page.evaluate(() => window.dockManager.getTabs());
    expect(tabs).toHaveLength(1);
    expect(tabs[0].id).toBe('snap1');

    // Floating DOM should be removed
    const floatEl = await page.$('.dock-floating[data-float-id="snap1"]');
    expect(floatEl).toBeFalsy();
  });

  test('Close floating panel removes it completely', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('close1', 'Close Test');
      window.dockManager.floatTab('close1');
    });

    await page.evaluate(() => {
      window.dockManager.closeFloating('close1');
    });

    const floating = await page.evaluate(() => window.dockManager.getFloating());
    expect(floating).toHaveLength(0);

    const tabs = await page.evaluate(() => window.dockManager.getTabs());
    expect(tabs).toHaveLength(0); // Not re-docked

    const floatEl = await page.$('.dock-floating[data-float-id="close1"]');
    expect(floatEl).toBeFalsy();
  });

  test('Floating panel position is persisted after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('persist-f', 'Persist Float');
      window.dockManager.floatTab('persist-f', { x: 200, y: 150, width: 350, height: 280 });
    });

    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });

    const floating = await page.evaluate(() => window.dockManager.getFloating());
    expect(floating).toHaveLength(1);
    expect(floating[0].id).toBe('persist-f');
    expect(floating[0].x).toBe(200);
    expect(floating[0].y).toBe(150);

    // DOM should be restored
    const floatEl = await page.$('.dock-floating[data-float-id="persist-f"]');
    expect(floatEl).toBeTruthy();
  });

  test('Floating panel hidden in focus/blank modes', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('mode-f', 'Mode Test');
      window.dockManager.floatTab('mode-f');
    });

    for (const mode of ['focus', 'blank']) {
      await page.evaluate((m) => {
        document.documentElement.setAttribute('data-ui-mode', m);
        window.dockManager._onUIModeChanged(m);
      }, mode);

      const isHidden = await page.evaluate(() => {
        var el = document.querySelector('.dock-floating');
        if (!el) return true;
        return window.getComputedStyle(el).display === 'none' || el.style.display === 'none';
      });
      expect(isHidden).toBe(true);
    }

    // Restore normal
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-ui-mode', 'normal');
      window.dockManager._onUIModeChanged('normal');
    });

    const visibleAgain = await page.evaluate(() => {
      var el = document.querySelector('.dock-floating');
      return el && window.getComputedStyle(el).display !== 'none' && el.style.display !== 'none';
    });
    expect(visibleAgain).toBe(true);
  });

  test('Dock button in floating panel snaps back', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('dock-btn', 'Dock Btn Test');
      window.dockManager.floatTab('dock-btn');
    });

    // Click dock button (first button in actions)
    await page.click('.dock-floating[data-float-id="dock-btn"] .dock-floating__btn:first-child');

    const floating = await page.evaluate(() => window.dockManager.getFloating());
    expect(floating).toHaveLength(0);

    const tabs = await page.evaluate(() => window.dockManager.getTabs());
    expect(tabs).toHaveLength(1);
    expect(tabs[0].id).toBe('dock-btn');
  });

  test('Close button in floating panel closes it', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('close-btn', 'Close Btn Test');
      window.dockManager.floatTab('close-btn');
    });

    // Click close button (last button in actions)
    await page.click('.dock-floating[data-float-id="close-btn"] .dock-floating__btn:last-child');

    const floating = await page.evaluate(() => window.dockManager.getFloating());
    expect(floating).toHaveLength(0);

    const floatEl = await page.$('.dock-floating');
    expect(floatEl).toBeFalsy();
  });

  test('Floating panel has resize handle', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('resize-f', 'Resize Test');
      window.dockManager.floatTab('resize-f');
    });

    const resizeHandle = await page.$('.dock-floating[data-float-id="resize-f"] .dock-floating__resize');
    expect(resizeHandle).toBeTruthy();
  });
});

test.describe('SP-076 Phase 2-3: UI Interaction Tests', () => {
  // Helper: simulate pointer drag via evaluate (works with setPointerCapture)
  async function simulatePointerDrag(page, selector, dx, dy) {
    return page.evaluate(({ sel, deltaX, deltaY }) => {
      var el = document.querySelector(sel);
      if (!el) throw new Error('Element not found: ' + sel);
      var rect = el.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;

      el.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: cx, clientY: cy, pointerId: 1, bubbles: true
      }));
      // Simulate movement in steps
      for (var i = 1; i <= 5; i++) {
        el.dispatchEvent(new PointerEvent('pointermove', {
          clientX: cx + deltaX * i / 5,
          clientY: cy + deltaY * i / 5,
          pointerId: 1, bubbles: true
        }));
      }
      el.dispatchEvent(new PointerEvent('pointerup', {
        clientX: cx + deltaX, clientY: cy + deltaY,
        pointerId: 1, bubbles: true
      }));
    }, { sel: selector, deltaX: dx, deltaY: dy });
  }

  test('Tab drag reorder via HTML drag events', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('d1', 'Drag A');
      window.dockManager.addTab('d2', 'Drag B');
      window.dockManager.addTab('d3', 'Drag C');
      window.dockManager.setActiveTab(0);
    });

    // Simulate HTML drag via evaluate (DataTransfer can't be constructed externally)
    await page.evaluate(() => {
      var tabs = document.querySelectorAll('.dock-tab');
      var tab0 = tabs[0];
      var tab2 = tabs[2];
      var dt = new DataTransfer();
      dt.setData('text/plain', '0');

      tab0.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      tab2.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
      tab2.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
      tab0.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
    });

    const tabs = await page.evaluate(() => window.dockManager.getTabs());
    expect(tabs[0].id).toBe('d2');
    expect(tabs[1].id).toBe('d3');
    expect(tabs[2].id).toBe('d1');
  });

  test('Floating panel drag moves position', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('fdrag', 'Drag Float');
      window.dockManager.floatTab('fdrag', { x: 200, y: 200, width: 300, height: 250 });
    });

    const before = await page.evaluate(() => {
      var el = document.querySelector('.dock-floating[data-float-id="fdrag"]');
      return { left: el.offsetLeft, top: el.offsetTop };
    });

    await simulatePointerDrag(page,
      '.dock-floating[data-float-id="fdrag"] .dock-floating__header', 100, 50);

    const after = await page.evaluate(() => {
      var el = document.querySelector('.dock-floating[data-float-id="fdrag"]');
      return { left: el.offsetLeft, top: el.offsetTop };
    });

    expect(after.left).toBeGreaterThan(before.left + 50);
    expect(after.top).toBeGreaterThan(before.top + 20);
  });

  test('Floating panel drag position is saved to localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('fdsave', 'Drag Save');
      window.dockManager.floatTab('fdsave', { x: 100, y: 100, width: 300, height: 250 });
    });

    await simulatePointerDrag(page,
      '.dock-floating[data-float-id="fdsave"] .dock-floating__header', 80, 60);

    const stored = await page.evaluate(() => {
      var raw = localStorage.getItem('zenwriter-dock-layout');
      return JSON.parse(raw).floating[0];
    });

    expect(stored.x).toBeGreaterThan(100);
    expect(stored.y).toBeGreaterThan(100);
  });

  test('Floating panel resize via pointer drag on handle', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('fresize', 'Resize Float');
      window.dockManager.floatTab('fresize', { x: 100, y: 100, width: 300, height: 250 });
    });

    const before = await page.evaluate(() => {
      var el = document.querySelector('.dock-floating[data-float-id="fresize"]');
      return { width: el.offsetWidth, height: el.offsetHeight };
    });

    await simulatePointerDrag(page,
      '.dock-floating[data-float-id="fresize"] .dock-floating__resize', 80, 60);

    const after = await page.evaluate(() => {
      var el = document.querySelector('.dock-floating[data-float-id="fresize"]');
      return { width: el.offsetWidth, height: el.offsetHeight };
    });

    expect(after.width).toBeGreaterThan(before.width + 40);
    expect(after.height).toBeGreaterThan(before.height + 30);
  });

  test('Floating panel resize size is saved', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('frsave', 'Resize Save');
      window.dockManager.floatTab('frsave', { x: 100, y: 100, width: 300, height: 250 });
    });

    await simulatePointerDrag(page,
      '.dock-floating[data-float-id="frsave"] .dock-floating__resize', 100, 80);

    const stored = await page.evaluate(() => {
      var raw = localStorage.getItem('zenwriter-dock-layout');
      return JSON.parse(raw).floating[0];
    });

    expect(stored.width).toBeGreaterThan(300);
    expect(stored.height).toBeGreaterThan(250);
  });

  test('Snap zone appears during drag and triggers re-dock', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('fsnap', 'Snap Test');
      window.dockManager.floatTab('fsnap', { x: 300, y: 200, width: 300, height: 250 });
    });

    // Simulate drag to left edge (clientX < 40 triggers snap)
    const result = await page.evaluate(() => {
      var header = document.querySelector('.dock-floating[data-float-id="fsnap"] .dock-floating__header');
      var rect = header.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;

      header.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: cx, clientY: cy, pointerId: 1, bubbles: true
      }));

      // Check snap zone appeared
      var hasZone = !!document.querySelector('.dock-snap-zone--left');

      // Move to left edge
      header.dispatchEvent(new PointerEvent('pointermove', {
        clientX: 10, clientY: cy, pointerId: 1, bubbles: true
      }));

      var zoneActive = document.querySelector('.dock-snap-zone--left');
      var isActive = zoneActive && zoneActive.classList.contains('dock-snap-zone--active');

      // Release at left edge
      header.dispatchEvent(new PointerEvent('pointerup', {
        clientX: 10, clientY: cy, pointerId: 1, bubbles: true
      }));

      return {
        hadZone: hasZone,
        wasActive: isActive,
        tabs: window.dockManager.getTabs(),
        floating: window.dockManager.getFloating(),
        zonesRemoved: document.querySelectorAll('.dock-snap-zone').length === 0
      };
    });

    expect(result.hadZone).toBe(true);
    expect(result.wasActive).toBe(true);
    expect(result.tabs).toHaveLength(1);
    expect(result.tabs[0].id).toBe('fsnap');
    expect(result.floating).toHaveLength(0);
    expect(result.zonesRemoved).toBe(true);
  });

  test('Content preserved when floating and snapping back', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('content-preserve', 'Content Test', function (panel) {
        var div = document.createElement('div');
        div.id = 'test-content-marker';
        div.textContent = 'Preserved Content 12345';
        panel.appendChild(div);
      });
    });

    const beforeFloat = await page.evaluate(() => {
      var marker = document.getElementById('test-content-marker');
      return marker ? marker.textContent : null;
    });
    expect(beforeFloat).toBe('Preserved Content 12345');

    await page.evaluate(() => window.dockManager.floatTab('content-preserve'));

    const inFloat = await page.evaluate(() => {
      var marker = document.querySelector('.dock-floating .dock-floating__content #test-content-marker');
      return marker ? marker.textContent : null;
    });
    expect(inFloat).toBe('Preserved Content 12345');

    await page.evaluate(() => window.dockManager.snapToDock('content-preserve'));

    const afterSnap = await page.evaluate(() => {
      var marker = document.querySelector('#dock-left-content .dock-tab-panel #test-content-marker');
      return marker ? marker.textContent : null;
    });
    expect(afterSnap).toBe('Preserved Content 12345');
  });

  test('Multiple floating panels coexist', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('mf1', 'Multi 1');
      window.dockManager.addTab('mf2', 'Multi 2');
      window.dockManager.addTab('mf3', 'Multi 3');
      window.dockManager.floatTab('mf1', { x: 50, y: 50 });
      window.dockManager.floatTab('mf2', { x: 200, y: 100 });
      window.dockManager.floatTab('mf3', { x: 350, y: 150 });
    });

    const state = await page.evaluate(() => {
      return {
        domCount: document.querySelectorAll('.dock-floating').length,
        floating: window.dockManager.getFloating()
      };
    });
    expect(state.domCount).toBe(3);
    expect(state.floating).toHaveLength(3);

    // Close one, snap one back
    await page.evaluate(() => {
      window.dockManager.closeFloating('mf2');
      window.dockManager.snapToDock('mf1');
    });

    const after = await page.evaluate(() => {
      return {
        domCount: document.querySelectorAll('.dock-floating').length,
        tabs: window.dockManager.getTabs(),
        floating: window.dockManager.getFloating()
      };
    });
    expect(after.domCount).toBe(1);
    expect(after.tabs).toHaveLength(1);
    expect(after.tabs[0].id).toBe('mf1');
    expect(after.floating).toHaveLength(1);
    expect(after.floating[0].id).toBe('mf3');
  });

  test('Floating panel min size enforced on resize', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      window.dockManager.addTab('fmin', 'Min Size');
      window.dockManager.floatTab('fmin', { x: 200, y: 200, width: 300, height: 250 });
    });

    // Resize to try to go below minimum
    await simulatePointerDrag(page,
      '.dock-floating[data-float-id="fmin"] .dock-floating__resize', -200, -200);

    const size = await page.evaluate(() => {
      var el = document.querySelector('.dock-floating[data-float-id="fmin"]');
      return { width: el.offsetWidth, height: el.offsetHeight };
    });

    expect(size.width).toBeGreaterThanOrEqual(200);
    expect(size.height).toBeGreaterThanOrEqual(150);
  });
});
