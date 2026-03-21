// @ts-nocheck
const { test, expect } = require('@playwright/test');

test.describe('SP-061: Typography Pack', () => {
  test('ZenWriterVisualProfile exposes Typography Pack API', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var vp = window.ZenWriterVisualProfile;
      if (!vp) return null;
      return {
        hasGetPacks: typeof vp.getTypographyPacks === 'function',
        hasApplyPack: typeof vp.applyTypographyPack === 'function',
        hasGetCurrentId: typeof vp.getCurrentTypographyPackId === 'function',
        hasClearPack: typeof vp.clearTypographyPack === 'function',
        hasGetPack: typeof vp.getTypographyPack === 'function'
      };
    });

    expect(result).toBeTruthy();
    expect(result.hasGetPacks).toBe(true);
    expect(result.hasApplyPack).toBe(true);
    expect(result.hasGetCurrentId).toBe(true);
    expect(result.hasClearPack).toBe(true);
    expect(result.hasGetPack).toBe(true);
  });

  test('getTypographyPacks returns 4 packs', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const packs = await page.evaluate(() => {
      var vp = window.ZenWriterVisualProfile;
      if (!vp) return null;
      return vp.getTypographyPacks();
    });

    expect(packs).toBeTruthy();
    expect(packs.length).toBe(4);
    const ids = packs.map(p => p.id);
    expect(ids).toContain('silent-writing');
    expect(ids).toContain('reference-reading');
    expect(ids).toContain('proofreading');
    expect(ids).toContain('staging-check');
  });

  test('applyTypographyPack changes CSS variables', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var vp = window.ZenWriterVisualProfile;
      if (!vp) return null;

      // Apply silent-writing pack
      vp.applyTypographyPack('silent-writing');

      var root = document.documentElement;
      var fontSize = root.style.getPropertyValue('--font-size');
      var lineHeight = root.style.getPropertyValue('--line-height');
      var letterSpacing = root.style.getPropertyValue('--body-letter-spacing');
      var currentId = vp.getCurrentTypographyPackId();

      return { fontSize, lineHeight, letterSpacing, currentId };
    });

    expect(result).toBeTruthy();
    expect(result.fontSize).toBe('18px');
    expect(result.lineHeight).toBe('2');
    expect(result.letterSpacing).toBe('0.04em');
    expect(result.currentId).toBe('silent-writing');
  });

  test('clearTypographyPack removes stored pack', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var vp = window.ZenWriterVisualProfile;
      if (!vp) return null;

      vp.applyTypographyPack('proofreading');
      var beforeClear = vp.getCurrentTypographyPackId();
      vp.clearTypographyPack();
      var afterClear = vp.getCurrentTypographyPackId();

      return { beforeClear, afterClear };
    });

    expect(result).toBeTruthy();
    expect(result.beforeClear).toBe('proofreading');
    expect(result.afterClear).toBeNull();
  });

  test('invalid pack ID returns false', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var vp = window.ZenWriterVisualProfile;
      if (!vp) return null;
      return vp.applyTypographyPack('nonexistent-pack');
    });

    expect(result).toBe(false);
  });
});
