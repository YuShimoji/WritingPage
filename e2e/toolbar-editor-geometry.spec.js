/**
 * メイン横帯ツールバー廃止後のレイアウト検証（エディタ列の高さ・サイドバー上端）。
 */
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, showFullToolbar, setUIMode, openSidebar } = require('./helpers');

/** @param {string|undefined} val */
function parseCssPx(val) {
  if (!val || typeof val !== 'string') return NaN;
  const m = /^([\d.]+)px$/.exec(val.trim());
  return m ? parseFloat(m[1]) : NaN;
}

test.describe('chrome vs editor-container geometry', () => {
  test('desktop 1280x720 normal: editor fills viewport and --toolbar-height is 0', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/index.html');
    await ensureNormalMode(page);
    await showFullToolbar(page);
    await page.waitForTimeout(200);
    const m = await page.evaluate(() => {
      const ec = document.querySelector('.editor-container');
      const root = document.documentElement;
      if (!ec) return null;
      const er = ec.getBoundingClientRect();
      const th = getComputedStyle(root).getPropertyValue('--toolbar-height').trim();
      return {
        uiMode: root.getAttribute('data-ui-mode'),
        editorHeight: er.height,
        innerHeight: window.innerHeight,
        toolbarHeightVar: th
      };
    });
    expect(m).toBeTruthy();
    expect(m.uiMode).toBe('normal');
    expect(m.toolbarHeightVar === '0px' || m.toolbarHeightVar === '0').toBeTruthy();
    expect(m.editorHeight).toBeGreaterThan(m.innerHeight * 0.92);
  });

  test('narrow 520x720 normal: editor still fills most of viewport', async ({ page }) => {
    await page.setViewportSize({ width: 520, height: 720 });
    await page.goto('/index.html');
    await ensureNormalMode(page);
    await showFullToolbar(page);
    await page.waitForTimeout(200);
    const m = await page.evaluate(() => {
      const ec = document.querySelector('.editor-container');
      if (!ec) return null;
      return {
        editorHeight: ec.getBoundingClientRect().height,
        innerHeight: window.innerHeight
      };
    });
    expect(m).toBeTruthy();
    expect(m.editorHeight).toBeGreaterThan(m.innerHeight * 0.88);
  });

  test('desktop normal sidebar open: sidebar top flush and chrome toolbar present', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/index.html');
    await ensureNormalMode(page);
    await showFullToolbar(page);
    await openSidebar(page);
    await page.waitForTimeout(250);
    const m = await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      const chrome = document.querySelector('.sidebar-chrome-toolbar');
      if (!sidebar || !chrome) return null;
      const sr = sidebar.getBoundingClientRect();
      const padTop = getComputedStyle(sidebar).paddingTop.trim();
      return {
        sidebarTop: sr.top,
        paddingTop: padTop,
        chromeInSidebar: !!chrome.closest('#sidebar')
      };
    });
    expect(m).toBeTruthy();
    expect(m.sidebarTop).toBeLessThanOrEqual(0.5);
    expect(m.chromeInSidebar).toBe(true);
    const padPx = parseCssPx(m.paddingTop);
    expect(Number.isFinite(padPx)).toBe(true);
    expect(padPx).toBeGreaterThanOrEqual(12);
    expect(padPx).toBeLessThanOrEqual(32);
  });

  test('focus with left+top edge flags: chapter panel above sidebar chrome (z-index)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/index.html');
    await setUIMode(page, 'focus');
    await page.waitForTimeout(150);
    const z = await page.evaluate(() => {
      document.documentElement.setAttribute('data-edge-hover-left', 'true');
      document.documentElement.setAttribute('data-edge-hover-top', 'true');
      const panel = document.querySelector('.focus-chapter-panel');
      const chrome = document.querySelector('.sidebar-chrome-toolbar');
      document.documentElement.removeAttribute('data-edge-hover-left');
      document.documentElement.removeAttribute('data-edge-hover-top');
      if (!panel || !chrome) return null;
      const pz = parseInt(getComputedStyle(panel).zIndex, 10) || 0;
      const cz = parseInt(getComputedStyle(chrome).zIndex, 10) || 0;
      return { panelZ: pz, chromeZ: cz };
    });
    expect(z).toBeTruthy();
    expect(z.panelZ).toBeGreaterThanOrEqual(z.chromeZ);
  });

  test('focus + top edge hover: opens main hub quick-tools', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/index.html');
    await setUIMode(page, 'focus');
    await page.waitForTimeout(200);
    await page.mouse.move(8, 8);
    await page.waitForTimeout(350);
    const m = await page.evaluate(() => {
      const hub = document.getElementById('main-hub-panel');
      return {
        dataEdgeHoverTop: document.documentElement.getAttribute('data-edge-hover-top'),
        uiMode: document.documentElement.getAttribute('data-ui-mode'),
        hubDisplay: hub ? hub.style.display : null
      };
    });
    expect(m).toBeTruthy();
    expect(m.uiMode).toBe('focus');
    expect(m.dataEdgeHoverTop).toBe('true');
    expect(m.hubDisplay).not.toBe('none');
  });
});
