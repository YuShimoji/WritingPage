// @ts-nocheck
const { test, expect } = require('@playwright/test');

test.describe('SP-074 Phase 6: Genre Preset', () => {
  test('GenrePresetRegistry is exposed as global', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var reg = window.GenrePresetRegistry;
      if (!reg) return null;
      return {
        hasList: typeof reg.list === 'function',
        hasApply: typeof reg.apply === 'function',
        hasClear: typeof reg.clear === 'function',
        hasResolve: typeof reg.resolve === 'function',
        hasPresets: Array.isArray(reg.GENRE_PRESETS)
      };
    });

    expect(result).toBeTruthy();
    expect(result.hasList).toBe(true);
    expect(result.hasApply).toBe(true);
    expect(result.hasClear).toBe(true);
    expect(result.hasResolve).toBe(true);
    expect(result.hasPresets).toBe(true);
  });

  test('list returns 4 built-in presets', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const presets = await page.evaluate(() => {
      var reg = window.GenrePresetRegistry;
      if (!reg) return null;
      return reg.list();
    });

    expect(presets).toBeTruthy();
    expect(presets.length).toBeGreaterThanOrEqual(4);
    const ids = presets.map(p => p.id);
    expect(ids).toContain('adv');
    expect(ids).toContain('webnovel');
    expect(ids).toContain('horror');
    expect(ids).toContain('poem');
  });

  test('apply adds CSS class to container element', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var reg = window.GenrePresetRegistry;
      if (!reg) return null;
      var container = document.createElement('div');
      document.body.appendChild(container);
      reg.apply(container, 'horror');
      var hasClass = container.classList.contains('genre-horror');
      reg.clear(container);
      var noClass = !container.classList.contains('genre-horror');
      document.body.removeChild(container);
      return { hasClass, noClass };
    });

    expect(result).toBeTruthy();
    expect(result.hasClass).toBe(true);
    expect(result.noClass).toBe(true);
  });

  test('resolve returns preset by ID', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const preset = await page.evaluate(() => {
      var reg = window.GenrePresetRegistry;
      if (!reg) return null;
      return reg.resolve('adv');
    });

    expect(preset).toBeTruthy();
    expect(preset.id).toBe('adv');
    expect(preset.className).toBe('genre-adv');
  });
});
