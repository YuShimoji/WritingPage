// @ts-check
const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** メインハブパネル (確実に .panel-header を持つ) を表示する */
async function openMainHubPanel(page) {
  await page.evaluate(() => {
    var panel = document.getElementById('main-hub-panel');
    if (panel) {
      panel.style.display = 'block';
      if (window.ZenWriterFloatingPanels) {
        window.ZenWriterFloatingPanels.preparePanel(panel);
      }
    }
  });
  await page.waitForSelector('#main-hub-panel', { state: 'visible', timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// Floating Panel Drag テスト
// ---------------------------------------------------------------------------
test.describe('フローティングパネルドラッグ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
  });

  // -----------------------------------------------------------------------
  // 1. ZenWriterFloatingPanels API が公開されている
  // -----------------------------------------------------------------------
  test('ZenWriterFloatingPanels API が公開されている', async ({ page }) => {
    const available = await page.evaluate(() => {
      return typeof window.ZenWriterFloatingPanels === 'object' &&
             typeof window.ZenWriterFloatingPanels.preparePanel === 'function' &&
             typeof window.ZenWriterFloatingPanels.clampPanel === 'function' &&
             typeof window.ZenWriterFloatingPanels.enableDrag === 'function';
    });
    expect(available).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 2. パネルヘッダーをドラッグして位置が変わる
  // -----------------------------------------------------------------------
  test('パネルヘッダーのドラッグでパネルが移動する', async ({ page }) => {
    await openMainHubPanel(page);

    const panel = page.locator('#main-hub-panel');
    await expect(panel).toBeVisible();

    // 初期位置を取得
    const initialBox = await panel.boundingBox();
    expect(initialBox).toBeTruthy();

    const header = panel.locator('.panel-header');
    const headerBox = await header.boundingBox();
    expect(headerBox).toBeTruthy();

    // パネルをビューポート中央付近に配置
    await page.evaluate(() => {
      var p = document.getElementById('main-hub-panel');
      if (p) {
        p.style.left = '200px';
        p.style.top = '100px';
        p.style.right = 'auto';
        p.style.bottom = 'auto';
      }
    });
    await page.waitForTimeout(50);
    const positionedBox = await panel.boundingBox();

    // ドラッグ: 100px右、50px下に移動
    const headerBox2 = await header.boundingBox();
    const startX = headerBox2.x + headerBox2.width / 2;
    const startY = headerBox2.y + headerBox2.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY + 50, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(100);

    // 位置が変化していること
    const afterBox = await panel.boundingBox();
    expect(afterBox).toBeTruthy();
    // 少なくとも50px以上移動している
    expect(Math.abs(afterBox.x - positionedBox.x)).toBeGreaterThan(50);
  });

  // -----------------------------------------------------------------------
  // 3. 閾値未満の微小移動ではドラッグ開始しない
  // -----------------------------------------------------------------------
  test('3px未満の移動ではドラッグ開始しない', async ({ page }) => {
    await openMainHubPanel(page);

    const panel = page.locator('#main-hub-panel');
    const initialBox = await panel.boundingBox();

    const header = panel.locator('.panel-header');
    const headerBox = await header.boundingBox();

    // 1px だけ移動
    const startX = headerBox.x + headerBox.width / 2;
    const startY = headerBox.y + headerBox.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 1, startY + 1, { steps: 1 });
    await page.mouse.up();
    await page.waitForTimeout(100);

    // 位置が変わっていないこと
    const afterBox = await panel.boundingBox();
    expect(Math.abs(afterBox.x - initialBox.x)).toBeLessThan(3);
    expect(Math.abs(afterBox.y - initialBox.y)).toBeLessThan(3);
  });

  // -----------------------------------------------------------------------
  // 4. ビューポート外にドラッグしても制限される
  // -----------------------------------------------------------------------
  test('ビューポート外への移動が制限される', async ({ page }) => {
    await openMainHubPanel(page);

    const panel = page.locator('#main-hub-panel');
    const header = panel.locator('.panel-header');
    const headerBox = await header.boundingBox();

    // 大きく右下に移動 (ビューポート外へ)
    const startX = headerBox.x + headerBox.width / 2;
    const startY = headerBox.y + headerBox.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 2000, startY + 2000, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(100);

    // パネルがビューポート内に収まっていること
    const afterBox = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(afterBox.x + afterBox.width).toBeLessThanOrEqual(viewport.width);
    expect(afterBox.y + afterBox.height).toBeLessThanOrEqual(viewport.height);
  });

  // -----------------------------------------------------------------------
  // 5. ボタンクリックではドラッグが始まらない
  // -----------------------------------------------------------------------
  test('ヘッダー内ボタンクリックでドラッグしない', async ({ page }) => {
    await openMainHubPanel(page);

    const panel = page.locator('#main-hub-panel');
    const initialBox = await panel.boundingBox();

    // ヘッダー内の閉じるボタンをクリック
    const closeBtn = panel.locator('.panel-header button').first();
    if (await closeBtn.count() > 0) {
      const closeBtnBox = await closeBtn.boundingBox();
      if (closeBtnBox) {
        await page.mouse.move(closeBtnBox.x + 5, closeBtnBox.y + 5);
        await page.mouse.down();
        await page.mouse.move(closeBtnBox.x + 105, closeBtnBox.y + 55, { steps: 3 });
        await page.mouse.up();
        await page.waitForTimeout(100);

        // パネルの位置が変わっていないこと (ボタン上でのドラッグは無効)
        const afterBox = await panel.boundingBox();
        if (afterBox) {
          expect(Math.abs(afterBox.x - initialBox.x)).toBeLessThan(5);
        }
      }
    }
  });
});
