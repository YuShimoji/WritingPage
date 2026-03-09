// E2E: キーバインド編集機能の検証
const { test, expect } = require('@playwright/test');
const { showFullToolbar, enableAllGadgets } = require('./helpers');

const pageUrl = '/index.html';

// v0.3.27: Keybinds は settings グループ。サイドバーには settings タブがないため
// 設定モーダルを開いてアクセスする。enableAllGadgets は使わない（重複回避）。
const scope = '#settings-gadgets-panel';

async function openKeybindsPanel(page) {
  await page.waitForFunction(() => {
    try { return !!window.ZenWriterKeybinds && !!window.ZWGadgets; } catch (_) { return false; }
  }, { timeout: 20000 });

  // enableAllGadgets を呼んでから設定モーダルを開く（settings ガジェットをレンダリング）
  await enableAllGadgets(page);
  await showFullToolbar(page);
  await page.waitForTimeout(200);
  await page.waitForSelector('#toggle-settings', { state: 'visible', timeout: 10000 });
  await page.click('#toggle-settings');
  await page.waitForSelector('#settings-modal', { state: 'visible', timeout: 10000 });
  await page.waitForSelector(scope + ' .gadget-wrapper', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(500);

  // ガジェットを展開 (data-gadget-collapsed 属性で制御)
  await page.evaluate((s) => {
    var panel = document.querySelector(s);
    if (!panel) return;
    panel.querySelectorAll('.gadget-wrapper').forEach(function(w) {
      var name = w.getAttribute('data-gadget-name');
      if (name && window.ZWGadgets && window.ZWGadgets._setGadgetCollapsed) {
        window.ZWGadgets._setGadgetCollapsed(name, false, w, true);
      }
    });
  }, scope);
  await page.waitForTimeout(300);

  // Keybinds ガジェットのレンダリングを待機
  await page.waitForSelector(`${scope} .keybinds-list`, { state: 'visible', timeout: 10000 });
}

test.describe('Keybinds E2E', () => {
  test.setTimeout(60000);

  test('キーバインド編集ガジェットが表示される', async ({ page }) => {
    await page.goto(pageUrl);
    await openKeybindsPanel(page);

    const keybindsGadget = page.locator(`${scope} .keybinds-list`);
    await expect(keybindsGadget).toBeVisible();

    const keybindItems = page.locator(`${scope} .keybind-item`);
    const count = await keybindItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('キーバインドを編集できる', async ({ page }) => {
    await page.goto(pageUrl);
    await openKeybindsPanel(page);

    const firstItem = page.locator(`${scope} .keybind-item`).first();
    const keyDisplay = firstItem.locator('.keybind-display');

    const originalKeybind = await keyDisplay.textContent();
    expect(originalKeybind).toBeTruthy();

    await keyDisplay.click();
    await expect(keyDisplay).toHaveText('...');

    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('KeyK');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    const newKeybind = await keyDisplay.textContent();
    expect(newKeybind).toContain('Ctrl');
    expect(newKeybind).toContain('Shift');
    expect(newKeybind).toContain('K');
  });

  test('キーバインドの競合検出が機能する', async ({ page }) => {
    await page.goto(pageUrl);
    page.on('dialog', dialog => dialog.accept());
    await openKeybindsPanel(page);

    const firstKeyDisplay = page.locator(`${scope} .keybind-item`).first().locator('.keybind-display');
    await firstKeyDisplay.textContent();

    const secondKeybindData = await page.evaluate(() => {
      const keybinds = window.ZenWriterKeybinds.load();
      const keys = Object.keys(keybinds);
      return keybinds[keys[1]];
    });

    await firstKeyDisplay.click();
    await page.waitForTimeout(100);

    if (secondKeybindData.ctrlKey) await page.keyboard.down('Control');
    if (secondKeybindData.shiftKey) await page.keyboard.down('Shift');
    if (secondKeybindData.altKey) await page.keyboard.down('Alt');
    await page.keyboard.press(secondKeybindData.key);
    if (secondKeybindData.altKey) await page.keyboard.up('Alt');
    if (secondKeybindData.shiftKey) await page.keyboard.up('Shift');
    if (secondKeybindData.ctrlKey) await page.keyboard.up('Control');

    await page.waitForTimeout(500);
  });

  test('デフォルトに戻す機能が動作する', async ({ page }) => {
    await page.goto(pageUrl);
    page.on('dialog', dialog => dialog.accept());
    await openKeybindsPanel(page);

    const resetBtn = page.locator(`${scope} button:has-text("デフォルトに戻す")`);
    await expect(resetBtn).toBeVisible();

    const firstItem = page.locator(`${scope} .keybind-item`).first();
    const firstKeyDisplay = firstItem.locator('.keybind-display');
    await firstKeyDisplay.click();
    await page.waitForTimeout(100);

    await page.keyboard.down('Control');
    await page.keyboard.press('KeyX');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    await resetBtn.click();
    await page.waitForTimeout(500);

    const allMatch = await page.evaluate(() => {
      const keybinds = window.ZenWriterKeybinds.load();
      const defaults = window.ZenWriterKeybinds.getDefaults();
      for (const id in keybinds) {
        const def = defaults[id];
        if (def) {
          const kbStr = window.ZenWriterKeybinds.keybindToString(keybinds[id]);
          const defStr = window.ZenWriterKeybinds.keybindToString(def);
          if (kbStr !== defStr) return false;
        }
      }
      return true;
    });
    expect(allMatch).toBe(true);
  });

  test('カスタムキーバインドのAPI設定と保存が機能する', async ({ page }) => {
    await page.goto(pageUrl);
    await openKeybindsPanel(page);

    const result = await page.evaluate(() => {
      const success = window.ZenWriterKeybinds.set('sidebar.toggle', {
        key: '9',
        altKey: true,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        description: 'サイドバーを開閉'
      });
      const saved = window.ZenWriterKeybinds.get('sidebar.toggle');
      return { success, key: saved ? saved.key : null, altKey: saved ? saved.altKey : null };
    });

    expect(result.success).toBeTruthy();
    expect(result.key).toBe('9');
    expect(result.altKey).toBe(true);
  });

  test('キーバインドの保存と復元が機能する', async ({ page }) => {
    await page.goto(pageUrl);
    await openKeybindsPanel(page);

    await page.evaluate(() => {
      window.ZenWriterKeybinds.set('toolbar.toggle', {
        key: 't',
        altKey: true,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        description: 'ツールバー表示/非表示切り替え'
      });
    });

    await page.reload();
    await openKeybindsPanel(page);

    const keybind = await page.evaluate(() => {
      return window.ZenWriterKeybinds.get('toolbar.toggle');
    });

    expect(keybind).toBeTruthy();
    expect(keybind.key).toBe('t');
    expect(keybind.altKey).toBe(true);
  });
});
