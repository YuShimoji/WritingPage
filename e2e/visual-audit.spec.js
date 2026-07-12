// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { ensureNormalMode, openSidebarGroup } = require('./helpers');

const BASE = '/index.html';
const TRACKED_SHOTS = path.join(__dirname, 'visual-audit-screenshots');

async function waitForApp(page) {
  await page.goto(`${BASE}?reset=1`);
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => !!window.sidebarManager && !!window.ZWGadgets, { timeout: 15000 });
  await ensureNormalMode(page);
}

test.describe('Visual audit current-shell smoke', () => {
  test('captures the active current-shell sidebar panel into Playwright output', async ({ page }, testInfo) => {
    await waitForApp(page);
    await openSidebarGroup(page, 'structure');
    await page.waitForSelector('#structure-gadgets-panel', { state: 'visible', timeout: 10000 });

    const output = testInfo.outputPath('visual-audit', 'structure-panel.png');
    await page.locator('.accordion-category[data-category="structure"]').screenshot({ path: output });

    expect(fs.existsSync(output)).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-left-nav-state', 'category');
    await expect(page.locator('html')).toHaveAttribute('data-left-nav-active', 'structure');
  });

  test('ordinary visual audit does not write tracked baseline screenshots', async ({ page }) => {
    await waitForApp(page);
    await openSidebarGroup(page, 'sections');

    const trackedBefore = fs.existsSync(TRACKED_SHOTS)
      ? fs.readdirSync(TRACKED_SHOTS).filter((name) => name.endsWith('.png')).sort()
      : [];

    await page.locator('.accordion-category[data-category="sections"]').screenshot();

    const trackedAfter = fs.existsSync(TRACKED_SHOTS)
      ? fs.readdirSync(TRACKED_SHOTS).filter((name) => name.endsWith('.png')).sort()
      : [];

    expect(trackedAfter).toEqual(trackedBefore);
  });

  test.skip('tracked visual baseline refresh is manual-only; use scripts/capture-full-showcase.js', async () => {});
});
