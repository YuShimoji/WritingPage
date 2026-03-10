// @ts-check
const { test, expect } = require('@playwright/test');

function parseMatrixTranslate(transformText) {
  if (!transformText || transformText === 'none') return { x: 0, y: 0 };
  const match = transformText.match(/matrix\(([^)]+)\)/);
  if (!match) return { x: 0, y: 0 };
  const parts = match[1].split(',').map((v) => Number(v.trim()));
  return {
    x: Number.isFinite(parts[4]) ? parts[4] : 0,
    y: Number.isFinite(parts[5]) ? parts[5] : 0
  };
}

test.describe('Canvas Mode (beta)', () => {
  test('toggle enables canvas root and updates aria state', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('#toggle-canvas-mode');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.editor-container')).toHaveAttribute('data-canvas-mode', 'true');
    await expect(page.locator('#editor-canvas-root')).toBeVisible();
    await expect(page.locator('#editor-canvas-root')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#editor-canvas-node-main')).toBeVisible();
  });

  test('hud zoom controls work for Canvas Mode', async ({ page }) => {
    await page.goto('/');

    await page.click('#toggle-canvas-mode');
    await expect(page.locator('#canvas-zoom-label')).toHaveText('100%');

    await page.click('#canvas-zoom-in');
    await expect(page.locator('#canvas-zoom-label')).toHaveText('110%');

    await page.click('#canvas-zoom-out');
    await expect(page.locator('#canvas-zoom-label')).toHaveText('100%');

    await page.click('#canvas-zoom-in');
    await page.click('#canvas-zoom-reset');
    await expect(page.locator('#canvas-zoom-label')).toHaveText('100%');
  });

  test('space+drag pan and ctrl+wheel zoom persist settings', async ({ page }) => {
    await page.goto('/');

    await page.click('#toggle-canvas-mode');
    const editor = page.locator('#editor');
    const box = await editor.boundingBox();
    expect(box).toBeTruthy();

    const startX = Math.round((box && box.x) || 0) + 120;
    const startY = Math.round((box && box.y) || 0) + 120;

    await page.keyboard.down('Space');
    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'left' });
    await page.mouse.move(startX + 120, startY + 70);
    await page.mouse.up({ button: 'left' });
    await page.keyboard.up('Space');

    await page.evaluate(() => {
      const container = document.querySelector('.editor-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      container.dispatchEvent(new WheelEvent('wheel', {
        deltaY: -120,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      }));
    });
    await page.waitForTimeout(220);

    const transform = await page.locator('#editor-classic-layer').evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    const translate = parseMatrixTranslate(transform);
    expect(Math.abs(translate.x)).toBeGreaterThan(20);
    expect(Math.abs(translate.y)).toBeGreaterThan(20);

    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('zenWriter_settings');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.editor && parsed.editor.canvas ? parsed.editor.canvas : null;
    });

    expect(saved).toBeTruthy();
    expect(saved.enabled).toBe(true);
    expect(saved.zoom).toBeGreaterThan(1);
    expect(Math.abs(saved.panX || 0)).toBeGreaterThan(20);
    expect(Math.abs(saved.panY || 0)).toBeGreaterThan(20);
  });
});
