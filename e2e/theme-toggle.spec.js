// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('テーマ切り替え機能', () => {
  test.beforeEach(async ({ page }) => {
    // localStorageをクリアして初期状態にする
    await page.goto('/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    // テーママネージャーが初期化されるまで待機
    await page.waitForFunction(() => !!window.ZenWriterTheme, { timeout: 5000 });
  });

  test('デフォルトでダークモードが適用されている', async ({ page }) => {
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');

    // 背景色がダークモードの色になっているか確認
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim()
    );
    expect(bgColor).toBe('#1e1e1e');
  });

  test('テーマ切り替えボタンが存在する', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-theme');
    await expect(toggleBtn).toBeVisible();

    // 初期アイコンはsun（ダークモードなので）
    const icon = toggleBtn.locator('[data-lucide]');
    const iconType = await icon.getAttribute('data-lucide');
    expect(iconType).toBe('sun');
  });

  test('ボタンをクリックするとライトモードに切り替わる', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-theme');

    // 初期状態はダークモード
    let theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');

    // ボタンをクリック
    await toggleBtn.click();
    await page.waitForTimeout(500); // テーマ適用とアイコン更新を待つ

    // ライトモードに切り替わったか確認
    theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('light');

    // アイコンがmoonに変わったか確認
    const icon = toggleBtn.locator('[data-lucide]');
    const iconType = await icon.getAttribute('data-lucide');
    expect(iconType).toBe('moon');
  });

  test('ボタンを2回クリックするとダークモードに戻る', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-theme');

    // 1回目のクリック（ライトモードへ）
    await toggleBtn.click();
    await page.waitForTimeout(100);

    let theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('light');

    // 2回目のクリック（ダークモードへ）
    await toggleBtn.click();
    await page.waitForTimeout(100);

    theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');

    // アイコンがsunに戻ったか確認
    const icon = toggleBtn.locator('[data-lucide]');
    const iconType = await icon.getAttribute('data-lucide');
    expect(iconType).toBe('sun');
  });

  test('テーマ設定がlocalStorageに保存される', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-theme');

    // ライトモードに切り替え
    await toggleBtn.click();
    await page.waitForTimeout(100);

    // localStorageを確認
    const savedTheme = await page.evaluate(() => {
      const settings = localStorage.getItem('zenWriter_settings');
      return settings ? JSON.parse(settings).theme : null;
    });
    expect(savedTheme).toBe('light');

    // ページをリロードして設定が維持されるか確認
    await page.reload();
    await page.waitForLoadState('networkidle');

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('light');
  });

  test('キーボード操作でテーマを切り替えられる', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-theme');

    // ボタンにフォーカス
    await toggleBtn.focus();

    // Enterキーで切り替え
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    let theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('light');

    // Spaceキーで切り替え
    await toggleBtn.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');
  });

  test('ダークモードのCSS変数が正しく適用される', async ({ page }) => {
    // ダークモードの状態でCSS変数を確認
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
    expect(cssVars.textColor).toBe('#d4d4d4'); // 実際のCSS計算値
    expect(cssVars.sidebarBg).toBe('#181818'); // adjustColor()で計算された値
    expect(cssVars.toolbarBg).toBe('#1c1c1c'); // adjustColor()で計算された値
    expect(cssVars.borderColor).toBe('#3a3a3a'); // adjustColor()で計算された値
  });

  test('ライトモードのCSS変数が正しく適用される', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-theme');

    // ライトモードに切り替え
    await toggleBtn.click();
    await page.waitForTimeout(100);

    // ライトモードの状態でCSS変数を確認
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      return {
        bgColor: styles.getPropertyValue('--bg-color').trim(),
        textColor: styles.getPropertyValue('--text-color').trim()
      };
    });

    // ライトモードのデフォルト色（variables.cssの:root）
    expect(cssVars.bgColor).toBe('#ffffff');
    expect(cssVars.textColor).toBe('#333333');
  });
});
