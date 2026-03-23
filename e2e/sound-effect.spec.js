// @ts-nocheck
const { test, expect } = require('@playwright/test');

test.describe('SP-074 Phase 5: Sound Effect', () => {
  test('SoundEffectController is exposed as global', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var ctrl = window.SoundEffectController;
      if (!ctrl) return null;
      return {
        hasPlay: typeof ctrl.play === 'function',
        hasResume: typeof ctrl.resume === 'function',
        hasSetVolume: typeof ctrl.setVolume === 'function',
        hasSetEnabled: typeof ctrl.setEnabled === 'function',
        hasSoundNames: Array.isArray(ctrl.SOUND_NAMES)
      };
    });

    expect(result).toBeTruthy();
    expect(result.hasPlay).toBe(true);
    expect(result.hasResume).toBe(true);
    expect(result.hasSetVolume).toBe(true);
    expect(result.hasSetEnabled).toBe(true);
    expect(result.hasSoundNames).toBe(true);
  });

  test('SOUND_NAMES contains 5 built-in sounds', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const names = await page.evaluate(() => {
      var ctrl = window.SoundEffectController;
      if (!ctrl) return null;
      return ctrl.SOUND_NAMES;
    });

    expect(names).toBeTruthy();
    expect(names.length).toBeGreaterThanOrEqual(5);
    expect(names).toContain('keystroke');
    expect(names).toContain('click');
    expect(names).toContain('whoosh');
    expect(names).toContain('chime');
    expect(names).toContain('ping');
  });

  test('setEnabled toggles without error', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var ctrl = window.SoundEffectController;
      if (!ctrl) return null;
      try {
        ctrl.setEnabled(false);
        ctrl.setEnabled(true);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });

    expect(result).toBeTruthy();
    expect(result.ok).toBe(true);
  });
});
