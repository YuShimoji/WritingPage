/**
 * WP-004 Phase 3 監査シナリオ5（ジャンルプリセット）
 * - Reader コンテナへの genre-* クラス付与
 * - 代表1項目: genre-adv 時の .zw-dialog computed background（css/style.css と整合）
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

  test('genre-adv 適用時、.zw-dialog の computed background がテーマ（暗色）を反映する', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.GenrePresetRegistry || typeof window.GenrePresetRegistry.apply !== 'function') {
        return { ok: false, reason: 'no-registry' };
      }
      var inner = document.getElementById('reader-preview-inner');
      if (!inner) return { ok: false, reason: 'no-inner' };
      var probe = document.createElement('div');
      probe.className = 'zw-dialog';
      probe.setAttribute('data-e2e-genre-style-probe', '1');
      probe.textContent = '\u00a0';
      inner.appendChild(probe);
      window.GenrePresetRegistry.clear(inner);
      window.GenrePresetRegistry.apply(inner, 'adv');
      var bg = window.getComputedStyle(probe).backgroundColor;
      inner.removeChild(probe);
      return { ok: true, backgroundColor: bg };
    });
    expect(r.ok).toBe(true);
    // rgba(0, 0, 0, 0.85) — ブラウザ表記はスペース有無が揺れうるため正規化して比較
    const normalized = String(r.backgroundColor).replace(/\s+/g, '');
    expect(normalized).toMatch(/^rgba\(0,0,0,0\.85\)$/i);
  });
});
