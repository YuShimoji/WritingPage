const { test, expect } = require('@playwright/test');

// 視認・設定系UIのE2E: HUD / テーマ / スナップショット

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  // サイドバーを強制的に開く（操作UIがサイドバー内にあるため）
  await page.evaluate(() => {
    try {
      const sb = document.querySelector('.sidebar');
      if (sb) sb.classList.add('open');
      document.documentElement.removeAttribute('data-toolbar-hidden');
      document.body && document.body.classList && document.body.classList.remove('toolbar-hidden');
    } catch {}
  });
});


test.describe('UI basics', () => {
  test('HUD settings apply and show', async ({ page }) => {
    // 要素が描画されるまで待機
    await page.waitForSelector('#hud-position');

    // 位置・色・不透明度・時間を変更
    await page.selectOption('#hud-position', 'top-right');
    await page.fill('#hud-duration', '800');
    await page.fill('#hud-bg', '#ff0000');
    await page.fill('#hud-fg', '#00ff00');
    await page.fill('#hud-opacity', '0.5');

    // テスト表示
    await page.click('#hud-test');

    const hud = page.locator('.mini-hud');
    await expect(hud).toHaveClass(/show/);
    // 位置クラスが適用されていること
    await expect(hud).toHaveClass(/pos-tr/);

    // 色が反映されていること（computed style）
    const { bg, fg } = await hud.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, fg: cs.color };
    });
    expect(String(bg)).toContain('255, 0, 0'); // 赤背景（RGBA）
    // ブラウザは #00ff00 を rgb(0, 255, 0) に正規化
    expect(String(fg)).toContain('0, 255, 0');
  });

  test('Theme presets switch (light/dark/sepia)', async ({ page }) => {
    // テーマセクションを開いてからプリセットを押下
    await page.click('#theme-section > summary');
    await page.click('.theme-preset[data-theme="dark"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.click('.theme-preset[data-theme="sepia"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sepia');

    await page.click('.theme-preset[data-theme="light"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('Snapshot: create and list shows entry', async ({ page }) => {
    await page.fill('#editor', 'Hello snapshot!');
    await page.click('#snapshot-now');

    // 生成されたエントリが表示され、「復元」ボタンが見えること
    const restoreBtn = page.locator('#snapshot-list button.small', { hasText: '復元' });
    await expect(restoreBtn).toBeVisible();
  });
});
