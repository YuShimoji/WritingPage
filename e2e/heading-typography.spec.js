// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('SP-058 Heading Typography Phase 1', () => {
  test.beforeEach(async ({ page }) => {
    // テストごとに localStorage をクリア
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
  });

  test('プリセット適用でCSS変数が変わる', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // HeadingPresetRegistry が読み込まれていることを確認
    const registryLoaded = await page.evaluate(() => {
      return typeof window.HeadingPresetRegistry !== 'undefined';
    });
    expect(registryLoaded).toBe(true);

    // デフォルトのCSS変数値を取得
    const defaultH1Size = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-size');
    });
    expect(defaultH1Size.trim()).toBe('1.5em');

    // chapter-title プリセットを適用
    await page.evaluate(() => {
      window.ZenWriterTheme.applyHeadingSettings('chapter-title');
    });

    // CSS変数が変わったことを確認
    const updatedH1Size = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-size');
    });
    expect(updatedH1Size.trim()).toBe('2em');

    // 他のプロパティも確認
    const updatedH1LetterSpacing = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-letter-spacing');
    });
    expect(updatedH1LetterSpacing.trim()).toBe('0.08em');
  });

  test('設定がリロード後に復元される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // chapter-title プリセットを適用
    await page.evaluate(() => {
      window.ZenWriterTheme.applyHeadingSettings('chapter-title');
    });

    // 設定が保存されたことを確認
    const savedPreset = await page.evaluate(() => {
      const settings = window.ZenWriterStorage.loadSettings();
      return settings.heading.preset;
    });
    expect(savedPreset).toBe('chapter-title');

    // リロード
    await page.reload();
    await page.waitForLoadState('networkidle');

    // CSS変数が復元されていることを確認
    const h1Size = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-size');
    });
    expect(h1Size.trim()).toBe('2em');

    // 設定が読み込まれていることを確認
    const reloadedPreset = await page.evaluate(() => {
      const settings = window.ZenWriterStorage.loadSettings();
      return settings.heading.preset;
    });
    expect(reloadedPreset).toBe('chapter-title');
  });

  test('見出し設定変更が本文フォント設定を破壊しない', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // テーマとフォントファミリーを設定 (順序を変更: フォント設定を先に)
    await page.evaluate(() => {
      window.ZenWriterTheme.applyFontSettings(
        '"Noto Serif JP", serif',
        18,
        1.8,
        16,
        18
      );
    });

    // フォント設定が反映されたことを確認
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      window.ZenWriterTheme.applyTheme('night');
    });

    // テーマが反映されたことを確認
    await page.waitForTimeout(100);

    // 設定を確認
    const beforeSettings = await page.evaluate(() => {
      const settings = window.ZenWriterStorage.loadSettings();
      return {
        theme: settings.theme,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight
      };
    });
    expect(beforeSettings.theme).toBe('night');
    expect(beforeSettings.fontFamily).toBe('"Noto Serif JP", serif');
    expect(beforeSettings.fontSize).toBe(18);
    expect(beforeSettings.lineHeight).toBe(1.8);

    // 見出しプリセットを変更
    await page.evaluate(() => {
      window.ZenWriterTheme.applyHeadingSettings('chapter-title');
    });

    // テーマとフォント設定が変わっていないことを確認
    const afterSettings = await page.evaluate(() => {
      const settings = window.ZenWriterStorage.loadSettings();
      return {
        theme: settings.theme,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight,
        headingPreset: settings.heading.preset
      };
    });
    expect(afterSettings.theme).toBe('night');
    expect(afterSettings.fontFamily).toBe('"Noto Serif JP", serif');
    expect(afterSettings.fontSize).toBe(18);
    expect(afterSettings.lineHeight).toBe(1.8);
    expect(afterSettings.headingPreset).toBe('chapter-title');
  });
});
