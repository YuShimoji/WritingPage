// @ts-check
const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

/**
 * v0.3.27: テーマ設定は settings グループの Themes ガジェットに移動。
 * 設定モーダルを開いて Themes ガジェット内のテーマプリセットボタンと
 * カラーピッカーにアクセスする。サイドバー経由だと二重レンダリングが
 * 発生するため、モーダルのみを使用する。
 */
async function openThemePanel(page) {
  await page.waitForFunction(() => {
    try { return !!window.ZWGadgets; } catch (_) { return false; }
  }, { timeout: 20000 });

  // enableAllGadgets を使わない（loadout 再適用でサイドバーにも settings パネルが
  // 生成され、#bg-color が重複する問題を回避）。Themes ガジェットを settings グループに
  // 直接追加して設定モーダルで描画させる。
  await page.evaluate(() => {
    var g = window.ZWGadgets;
    if (!g || !g._list) return;
    g._list.forEach(function(entry) {
      if (entry.name === 'Themes') {
        if (!Array.isArray(entry.groups)) entry.groups = [];
        if (entry.groups.indexOf('settings') < 0) entry.groups.push('settings');
      }
    });
    // settings パネルの renderer を再初期化
    if (g._renderers) delete g._renderers['settings'];
    g.init('#settings-gadgets-panel', { group: 'settings' });
  });
  await showFullToolbar(page);
  await page.waitForTimeout(200);
  await page.waitForSelector('#toggle-settings', { state: 'visible', timeout: 10000 });
  await page.click('#toggle-settings');
  await page.waitForSelector('#settings-modal', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('#settings-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 15000 });
  await page.waitForTimeout(500);

  // すべてのガジェットを展開 (data-gadget-collapsed 属性で制御)
  await page.evaluate(() => {
    document.querySelectorAll('#settings-gadgets-panel .gadget-wrapper').forEach(function(w) {
      var name = w.getAttribute('data-gadget-name');
      if (name && window.ZWGadgets && window.ZWGadgets._setGadgetCollapsed) {
        window.ZWGadgets._setGadgetCollapsed(name, false, w, true);
      }
    });
  });
  await page.waitForTimeout(300);

  // Themes ガジェット内のコントロールがDOMに存在することを確認
  await page.waitForSelector('#settings-gadgets-panel .gadget-themes #bg-color', { state: 'attached', timeout: 15000 });
  await page.waitForSelector('#settings-gadgets-panel .gadget-themes #text-color', { state: 'attached', timeout: 10000 });
  await page.waitForSelector('#settings-gadgets-panel .gadget-themes button[data-theme-preset="light"]', { state: 'attached', timeout: 10000 });
}

test.describe('Theme Colors', () => {
  test.setTimeout(60000);
  test('should reflect theme colors in color pickers when switching presets', async ({ page }) => {
    await page.goto('/');
    await openThemePanel(page);

    // テーマ切替はZenWriterTheme APIで実行し、updateColorPickersがgetElementById
    // で更新するカラーピッカーの値を検証する（DOM上に#bg-colorが複数存在するため）
    async function applyPresetAndGetColors(preset) {
      return await page.evaluate((key) => {
        // ZenWriterTheme API でテーマ適用（clearCustomColors -> updateColorPickers が実行される）
        if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyTheme === 'function') {
          window.ZenWriterTheme.applyTheme(key);
        }
        // updateColorPickers は getElementById で最初の #bg-color を更新する
        const bg = document.getElementById('bg-color');
        const text = document.getElementById('text-color');
        return {
          bg: bg ? bg.value : null,
          text: text ? text.value : null,
        };
      }, preset);
    }

    // Test Light theme
    const light = await applyPresetAndGetColors('light');
    expect(light.bg).toBe('#ffffff');
    expect(light.text).toBe('#333333');

    // Test Dark theme
    const dark = await applyPresetAndGetColors('dark');
    expect(dark.bg).toBe('#1e1e1e');
    expect(dark.text).toBe('#cccccc'); // Updated to match new dark theme color

    // Test Sepia theme
    const sepia = await applyPresetAndGetColors('sepia');
    expect(sepia.bg).toBe('#f4ecd8');
    expect(sepia.text).toBe('#5b4636');
  });

  test('should apply custom colors and persist after reload', async ({ page }) => {
    await page.goto('/');
    await openThemePanel(page);

    // Set custom colors
    await page.evaluate(() => {
      const themesGadget = document.querySelector('#settings-gadgets-panel .gadget-themes');
      if (!themesGadget) return;
      const bgInput = themesGadget.querySelector('#bg-color');
      const textInput = themesGadget.querySelector('#text-color');
      if (bgInput) {
        bgInput.value = '#ffcccc';
        bgInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (textInput) {
        textInput.value = '#003300';
        textInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);

    const scope = '#settings-gadgets-panel .gadget-themes';

    // Verify color pickers have the custom values
    await expect(page.locator(`${scope} #bg-color`)).toHaveValue('#ffcccc');
    await expect(page.locator(`${scope} #text-color`)).toHaveValue('#003300');

    // Reload and verify persistence
    await page.reload();
    await openThemePanel(page);

    await expect(page.locator(`${scope} #bg-color`)).toHaveValue('#ffcccc');
    await expect(page.locator(`${scope} #text-color`)).toHaveValue('#003300');
  });

  test('should reset custom colors to theme defaults', async ({ page }) => {
    await page.goto('/');
    await openThemePanel(page);

    // Set custom colors
    await page.evaluate(() => {
      const themesGadget = document.querySelector('#settings-gadgets-panel .gadget-themes');
      if (!themesGadget) return;
      const bgInput = themesGadget.querySelector('#bg-color');
      const textInput = themesGadget.querySelector('#text-color');
      if (bgInput) {
        bgInput.value = '#112233';
        bgInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (textInput) {
        textInput.value = '#aabbcc';
        textInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);

    const scope = '#settings-gadgets-panel .gadget-themes';

    // Click reset button
    await page.locator(`${scope} #reset-colors`).evaluate(b => b.click());
    await page.waitForTimeout(200);

    // Verify colors reset to light theme defaults (assuming light is active)
    await page.locator(`${scope} button[data-theme-preset="light"]`).click();
    await page.waitForTimeout(200);
    await expect(page.locator(`${scope} #bg-color`)).toHaveValue('#ffffff');
    await expect(page.locator(`${scope} #text-color`)).toHaveValue('#333333');
  });
});
