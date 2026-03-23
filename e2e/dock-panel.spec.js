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
