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
        hasMoveToLeft: typeof dm.moveToLeft === 'function' || typeof dm.moveSidebarToLeft === 'function',
        hasMoveToRight: typeof dm.moveToRight === 'function' || typeof dm.moveSidebarToRight === 'function'
      };
    });

    expect(result).toBeTruthy();
    expect(result.exists).toBe(true);
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
});
