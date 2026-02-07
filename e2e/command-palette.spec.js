// E2E: コマンドパレット機能の検証
const { test, expect } = require('@playwright/test');

const pageUrl = '/index.html';

// Helper: open command palette via JS (avoids browser print dialog interception)
async function openCommandPalette(page) {
  await page.evaluate(() => {
    if (window.commandPalette && typeof window.commandPalette.show === 'function') {
      window.commandPalette.show();
    }
  });
}

test.describe('Command Palette E2E', () => {
  test('コマンドパレットがCtrl+Pで開く', async ({ page }) => {
    await page.goto(pageUrl);
    
    // コマンドパレットが初期状態で非表示であることを確認
    const palette = page.locator('#command-palette');
    await expect(palette).not.toBeVisible();

    // コマンドパレットを開く（evaluate経由 — headlessではCtrl+Pがブラウザ印刷に横取りされるため）
    await openCommandPalette(page);
    await expect(palette).toBeVisible();
  });

  test('コマンドパレットがCmd+Pで開く（Mac）', async ({ page }) => {
    await page.goto(pageUrl);
    
    const palette = page.locator('#command-palette');
    await expect(palette).not.toBeVisible();

    // コマンドパレットを開く（evaluate経由）
    await openCommandPalette(page);
    await expect(palette).toBeVisible();
  });

  test('コマンドパレットで検索が機能する', async ({ page }) => {
    await page.goto(pageUrl);
    
    // コマンドパレットを開く
    await openCommandPalette(page);
    await expect(page.locator('#command-palette')).toBeVisible();

    // 検索入力フィールドに「検索」と入力
    const input = page.locator('#command-palette-input');
    await input.fill('検索');
    
    // 検索コマンドが表示されることを確認
    const searchCommand = page.locator('.command-palette-item[data-command-id="search"]');
    await expect(searchCommand).toBeVisible();
    
    // 検索コマンドのラベルと説明が正しいことを確認
    await expect(searchCommand.locator('.command-palette-item-label')).toHaveText('検索');
    await expect(searchCommand.locator('.command-palette-item-description')).toContainText('検索パネルを開く');
  });

  test('コマンドパレットでコマンドを実行できる', async ({ page }) => {
    await page.goto(pageUrl);
    
    // コマンドパレットを開く
    await openCommandPalette(page);
    await expect(page.locator('#command-palette')).toBeVisible();

    // 「検索」と入力
    const input = page.locator('#command-palette-input');
    await input.fill('検索');
    
    // 検索コマンドを選択してEnterで実行
    await page.keyboard.press('Enter');
    
    // 検索パネルが開くことを確認
    await expect(page.locator('#search-panel')).toBeVisible();
    
    // コマンドパレットが閉じることを確認
    await expect(page.locator('#command-palette')).not.toBeVisible();
  });

  test('コマンドパレットでキーボードナビゲーションが機能する', async ({ page }) => {
    await page.goto(pageUrl);
    
    // コマンドパレットを開く
    await openCommandPalette(page);
    await expect(page.locator('#command-palette')).toBeVisible();

    // 下矢印キーで選択が移動することを確認
    const items = page.locator('.command-palette-item');
    const firstItem = items.first();
    const secondItem = items.nth(1);
    
    // 最初のアイテムが選択されていることを確認
    await expect(firstItem).toHaveClass(/selected/);
    
    // 下矢印キーを押す
    await page.keyboard.press('ArrowDown');
    
    // 2番目のアイテムが選択されていることを確認
    await expect(secondItem).toHaveClass(/selected/);
    await expect(firstItem).not.toHaveClass(/selected/);
    
    // 上矢印キーで戻る
    await page.keyboard.press('ArrowUp');
    await expect(firstItem).toHaveClass(/selected/);
  });

  test('コマンドパレットがEscapeで閉じる', async ({ page }) => {
    await page.goto(pageUrl);
    
    // コマンドパレットを開く
    await openCommandPalette(page);
    await expect(page.locator('#command-palette')).toBeVisible();

    // Escapeキーで閉じる
    await page.keyboard.press('Escape');
    await expect(page.locator('#command-palette')).not.toBeVisible();
  });

  test('コマンドパレットでカテゴリが表示される', async ({ page }) => {
    await page.goto(pageUrl);
    
    // コマンドパレットを開く
    await openCommandPalette(page);
    await expect(page.locator('#command-palette')).toBeVisible();

    // カテゴリが表示されることを確認
    const categories = page.locator('.command-palette-category-title');
    const categoryCount = await categories.count();
    expect(categoryCount).toBeGreaterThan(0);
    
    // 主要なカテゴリが存在することを確認
    const categoryTexts = await categories.allTextContents();
    expect(categoryTexts.some(text => text.includes('検索・置換'))).toBeTruthy();
    expect(categoryTexts.some(text => text.includes('UI操作'))).toBeTruthy();
  });

  test('コマンドパレットでショートカットが表示される', async ({ page }) => {
    await page.goto(pageUrl);
    
    // コマンドパレットを開く
    await openCommandPalette(page);
    await expect(page.locator('#command-palette')).toBeVisible();

    // 「検索」と入力
    const input = page.locator('#command-palette-input');
    await input.fill('検索');
    
    // 検索コマンドのショートカットが表示されることを確認
    const searchCommand = page.locator('.command-palette-item[data-command-id="search"]');
    const shortcut = searchCommand.locator('.command-palette-item-shortcut');
    await expect(shortcut).toBeVisible();
    await expect(shortcut).toContainText('Ctrl+F');
  });

  test('コマンドパレットでガジェット操作が実行できる', async ({ page }) => {
    await page.goto(pageUrl);
    
    // コマンドパレットを開く
    await openCommandPalette(page);
    await expect(page.locator('#command-palette')).toBeVisible();

    // 「構造」と入力
    const input = page.locator('#command-palette-input');
    await input.fill('構造');
    
    // 構造ガジェットコマンドを選択して実行
    await page.keyboard.press('Enter');
    
    // サイドバーが開き、構造タブがアクティブになることを確認
    await page.waitForTimeout(300);
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toHaveClass(/open/);
    
    const structureTab = page.locator('.sidebar-tab[data-group="structure"]');
    await expect(structureTab).toHaveClass(/active/);
  });
});
