/**
 * WP-004 Phase 3 監査シナリオ5（ジャンルプリセット）— Reader コンテナへの genre-* クラス付与の浅い E2E
 */
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

test.describe('Reader genre preset (shallow)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureNormalMode(page);
  });

  test('GenrePresetRegistry.apply が #reader-preview-inner に genre-adv を付与する', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.GenrePresetRegistry || typeof window.GenrePresetRegistry.apply !== 'function') {
        return { ok: false, reason: 'no-registry' };
      }
      var inner = document.getElementById('reader-preview-inner');
      if (!inner) return { ok: false, reason: 'no-inner' };
      window.GenrePresetRegistry.clear(inner);
      var beforeAdv = inner.classList.contains('genre-adv');
      window.GenrePresetRegistry.apply(inner, 'adv');
      var afterAdv = inner.classList.contains('genre-adv');
      window.GenrePresetRegistry.apply(inner, 'webnovel');
      var hasWebnovel = inner.classList.contains('genre-webnovel');
      var noAdvAfterSwitch = !inner.classList.contains('genre-adv');
      return { ok: true, beforeAdv, afterAdv, hasWebnovel, noAdvAfterSwitch };
    });
    expect(r.ok).toBe(true);
    expect(r.beforeAdv).toBe(false);
    expect(r.afterAdv).toBe(true);
    expect(r.hasWebnovel).toBe(true);
    expect(r.noAdvAfterSwitch).toBe(true);
  });
});
