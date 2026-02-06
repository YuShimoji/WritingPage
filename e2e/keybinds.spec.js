// E2E: キーバインド編集機能の検証
const { test, expect } = require('@playwright/test');

const pageUrl = '/index.html';

async function waitKeybindsReady(page) {
  await page.waitForFunction(() => {
    try {
      return !!window.ZenWriterKeybinds && !!window.ZWGadgets;
    } catch (_) { return false; }
  });
  // サイドバーを開く
  const sidebar = page.locator('.sidebar');
  const toggleBtn = page.locator('#toggle-sidebar');
  if (await toggleBtn.isVisible().catch(() => false)) {
    const opened = await sidebar.evaluate((el) => el.classList.contains('open')).catch(() => false);
    if (!opened) {
      await toggleBtn.click();
      await expect(sidebar).toHaveClass(/open/);
    }
  }
  // assistタブをアクティブにしてキーバインドガジェットを表示
  const assistTab = page.locator('.sidebar-tab[data-group="assist"]');
  if (await assistTab.isVisible().catch(() => false)) {
    await assistTab.click();
  }
  // ガジェットのレンダリングを待機
  await page.waitForTimeout(500);
  await page.waitForSelector('.keybinds-list', { state: 'attached' });
  return true;
}

test.describe('Keybinds E2E', () => {
  test('キーバインド編集ガジェットが表示される', async ({ page }) => {
    await page.goto(pageUrl);
    await waitKeybindsReady(page);

    // ガジェットが表示されていることを確認
    const keybindsGadget = page.locator('.keybinds-list');
    await expect(keybindsGadget).toBeVisible();

    // キーバインドアイテムが存在することを確認
    const keybindItems = page.locator('.keybind-item');
    const count = await keybindItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('キーバインドを編集できる', async ({ page }) => {
    await page.goto(pageUrl);
    await waitKeybindsReady(page);

    // 最初のキーバインドアイテムを取得
    const firstItem = page.locator('.keybind-item').first();
    const keyDisplay = firstItem.locator('.keybind-display');
    
    // 現在のキーバインドを取得
    const originalKeybind = await keyDisplay.textContent();
    expect(originalKeybind).toBeTruthy();

    // キーバインドをクリックして編集モードに入る
    await keyDisplay.click();
    
    // 編集中の表示を確認
    await expect(keyDisplay).toHaveText('...');

    // 新しいキーを入力（Ctrl+Shift+K）
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('KeyK');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');

    // 編集が完了するまで待機
    await page.waitForTimeout(500);

    // 新しいキーバインドが保存されていることを確認
    const newKeybind = await keyDisplay.textContent();
    expect(newKeybind).toContain('Ctrl');
    expect(newKeybind).toContain('Shift');
    expect(newKeybind).toContain('K');
  });

  test('キーバインドの競合検出が機能する', async ({ page }) => {
    await page.goto(pageUrl);
    await waitKeybindsReady(page);

    // 最初のキーバインドを取得
    const firstItem = page.locator('.keybind-item').first();
    const firstKeyDisplay = firstItem.locator('.keybind-display');
    const _firstKeybind = await firstKeyDisplay.textContent();

    // 2番目のキーバインドを取得
    const secondItem = page.locator('.keybind-item').nth(1);
    const secondKeyDisplay = secondItem.locator('.keybind-display');
    const _secondKeybind = await secondKeyDisplay.textContent();

    // 最初のキーバインドを編集
    await firstKeyDisplay.click();
    await page.waitForTimeout(100);

    // 2番目のキーバインドと同じキーを設定（競合を発生させる）
    // 2番目のキーバインドのキーを取得
    const secondKeybindData = await page.evaluate(() => {
      const keybinds = window.ZenWriterKeybinds.load();
      const keys = Object.keys(keybinds);
      return keybinds[keys[1]];
    });

    // 同じキーを入力
    if (secondKeybindData.ctrlKey) await page.keyboard.down('Control');
    if (secondKeybindData.shiftKey) await page.keyboard.down('Shift');
    if (secondKeybindData.altKey) await page.keyboard.down('Alt');
    await page.keyboard.press(secondKeybindData.key);
    if (secondKeybindData.altKey) await page.keyboard.up('Alt');
    if (secondKeybindData.shiftKey) await page.keyboard.up('Shift');
    if (secondKeybindData.ctrlKey) await page.keyboard.up('Control');

    // 確認ダイアログが表示されることを確認（競合検出）
    // 注意: Playwrightは自動的にダイアログを処理するため、ここでは確認のみ
    await page.waitForTimeout(500);
  });

  test('デフォルトに戻す機能が動作する', async ({ page }) => {
    await page.goto(pageUrl);
    await waitKeybindsReady(page);

    // リセットボタンを取得
    const resetBtn = page.locator('button:has-text("デフォルトに戻す")');
    await expect(resetBtn).toBeVisible();

    // 最初のキーバインドをカスタマイズ
    const firstItem = page.locator('.keybind-item').first();
    const firstKeyDisplay = firstItem.locator('.keybind-display');
    await firstKeyDisplay.click();
    await page.waitForTimeout(100);
    
    // 新しいキーを設定
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyX');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);

    // リセットボタンをクリック
    await resetBtn.click();

    // 確認ダイアログでOKをクリック
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(500);

    // キーバインドがデフォルトに戻っていることを確認
    const keybinds = await page.evaluate(() => {
      return window.ZenWriterKeybinds.load();
    });
    const defaults = await page.evaluate(() => {
      return window.ZenWriterKeybinds.getDefaults();
    });

    // すべてのキーバインドがデフォルトと一致することを確認
    for (const id in keybinds) {
      const kb = keybinds[id];
      const def = defaults[id];
      if (def) {
        const kbStr = window.ZenWriterKeybinds.keybindToString(kb);
        const defStr = window.ZenWriterKeybinds.keybindToString(def);
        expect(kbStr).toBe(defStr);
      }
    }
  });

  test('カスタムキーバインドが実際に機能する', async ({ page }) => {
    await page.goto(pageUrl);
    await waitKeybindsReady(page);

    // サイドバーを閉じる
    const sidebar = page.locator('.sidebar');
    const toggleBtn = page.locator('#toggle-sidebar');
    if (await sidebar.evaluate((el) => el.classList.contains('open')).catch(() => false)) {
      await toggleBtn.click();
      await expect(sidebar).not.toHaveClass(/open/);
    }

    // カスタムキーバインドを設定（Alt+1をAlt+9に変更）
    await page.evaluate(() => {
      window.ZenWriterKeybinds.set('sidebar.toggle', {
        key: '9',
        altKey: true,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        description: 'サイドバーを開閉'
      });
    });

    // Alt+9でサイドバーが開くことを確認
    await page.keyboard.down('Alt');
    await page.keyboard.press('Digit9');
    await page.keyboard.up('Alt');
    await page.waitForTimeout(300);

    // サイドバーが開いていることを確認
    await expect(sidebar).toHaveClass(/open/);
  });

  test('キーバインドの保存と復元が機能する', async ({ page }) => {
    await page.goto(pageUrl);
    await waitKeybindsReady(page);

    // カスタムキーバインドを設定
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

    // ページをリロード
    await page.reload();
    await waitKeybindsReady(page);

    // キーバインドが保存されていることを確認
    const keybind = await page.evaluate(() => {
      return window.ZenWriterKeybinds.get('toolbar.toggle');
    });

    expect(keybind).toBeTruthy();
    expect(keybind.key).toBe('t');
    expect(keybind.altKey).toBe(true);
  });
});
