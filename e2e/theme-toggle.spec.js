// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('テーマ切り替え機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => !!window.ZenWriterTheme, { timeout: 5000 });
  });

  test('デフォルトでダークモードが適用されている', async ({ page }) => {
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');

    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim()
    );
    expect(bgColor).toBe('#1e1e1e');
  });

  test('トップ固定のテーマボタンに依存せず Theme API で切り替えられる', async ({ page }) => {
    await expect(page.locator('#toggle-theme')).toHaveCount(0);

    await page.evaluate(() => window.ZenWriterTheme.applyTheme('light'));
    await page.waitForTimeout(100);

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('light');
  });

  test('Theme API でライトとダークを往復できる', async ({ page }) => {
    await page.evaluate(() => window.ZenWriterTheme.applyTheme('light'));
    await page.waitForTimeout(100);

    let theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('light');

    await page.evaluate(() => window.ZenWriterTheme.applyTheme('dark'));
    await page.waitForTimeout(100);

    theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');
  });

  test('テーマ設定がlocalStorageに保存される', async ({ page }) => {
    await page.evaluate(() => window.ZenWriterTheme.applyTheme('light'));
    await page.waitForTimeout(100);

    const savedTheme = await page.evaluate(() => {
      const settings = localStorage.getItem('zenWriter_settings');
      return settings ? JSON.parse(settings).theme : null;
    });
    expect(savedTheme).toBe('light');

    await page.reload();
    await page.waitForLoadState('networkidle');

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('light');
  });

  test('ダークモードのCSS変数が正しく適用される', async ({ page }) => {
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      return {
        bgColor: styles.getPropertyValue('--bg-color').trim(),
        textColor: styles.getPropertyValue('--text-color').trim(),
        sidebarBg: styles.getPropertyValue('--sidebar-bg').trim(),
        toolbarBg: styles.getPropertyValue('--toolbar-bg').trim(),
        borderColor: styles.getPropertyValue('--border-color').trim()
      };
    });

    expect(cssVars.bgColor).toBe('#1e1e1e');
    expect(cssVars.textColor).toBe('#d4d4d4');
    expect(cssVars.sidebarBg).toBe('#181818');
    expect(cssVars.toolbarBg).toBe('#1c1c1c');
    expect(cssVars.borderColor).toBe('#3a3a3a');
  });

  test('ライトモードのCSS変数が正しく適用される', async ({ page }) => {
    await page.evaluate(() => window.ZenWriterTheme.applyTheme('light'));
    await page.waitForTimeout(100);

    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      return {
        bgColor: styles.getPropertyValue('--bg-color').trim(),
        textColor: styles.getPropertyValue('--text-color').trim()
      };
    });

    expect(cssVars.bgColor).toBe('#ffffff');
    expect(cssVars.textColor).toBe('#333333');
  });
});
