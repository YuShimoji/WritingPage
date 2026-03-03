// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { enableAllGadgets } = require('./helpers');


async function openSidebarAndAssistPanel(page) {
  await page.waitForSelector('#sidebar', { timeout: 10000 });
  await enableAllGadgets(page);

  const isOpen = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return !!(sb && sb.classList.contains('open'));
  });

  if (!isOpen) {
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
  }

  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('settings');
      }
      if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
        window.ZWGadgets.setActiveGroup('settings');
      }
    } catch (_) { /* noop */ }
  });

  // ガジェットがレンダリングされるまで待機
  await page.waitForTimeout(500);
}

test.describe('Flexible Tab Placement', () => {
  test.setTimeout(60000);
  test('should change tab placement to right and persist', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await openSidebarAndAssistPanel(page);

    try {
      // UI Settings ガジェットが表示されるまで待機
      const settingsPanel = page.locator('#settings-gadgets-panel').or(page.locator('#assist-gadgets-panel')).first();
      await settingsPanel.waitFor({ state: 'visible', timeout: 3000 });
      await page.waitForTimeout(500);

      // タブ配置セレクトを探す
      const targetSelect = settingsPanel.locator('select').filter({ hasText: /左|右|上|下/ }).or(
        settingsPanel.locator('select:has(option[value="left"])')
      ).first();

      // 存在確認と操作を試みる
      if (await targetSelect.count() > 0 && await targetSelect.isVisible()) {
        await targetSelect.selectOption('right', { timeout: 3000 });
      } else {
        throw new Error('Placement select not found or not visible');
      }
    } catch (e) {
      console.warn('UI interaction failed, falling back to JS execution:', e.message);
      // フォールバック: 直接JavaScriptで設定を変更
      await page.evaluate(() => {
        if (window.sidebarManager && typeof window.sidebarManager.saveTabPlacement === 'function') {
          window.sidebarManager.saveTabPlacement('right');
        }
      });
    }

    // サイドバーにdata-tab-placement属性が設定されていることを確認
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toHaveAttribute('data-tab-placement', 'right');

    // リロードして永続化を確認
    await page.reload();
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await expect(sidebar).toHaveAttribute('data-tab-placement', 'right');
  });

  test('should change tab placement to top and persist', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await openSidebarAndAssistPanel(page);

    // 直接JavaScriptで設定を変更
    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.saveTabPlacement === 'function') {
        window.sidebarManager.saveTabPlacement('top');
      }
    });

    // サイドバーにdata-tab-placement属性が設定されていることを確認
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toHaveAttribute('data-tab-placement', 'top');

    // タブが横並びになっていることを確認（CSSでflex-direction: rowが適用されている）
    const tabsContainer = page.locator('.sidebar-tabs');
    const display = await tabsContainer.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('flex');

    // リロードして永続化を確認
    await page.reload();
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await expect(sidebar).toHaveAttribute('data-tab-placement', 'top');
  });

  test('should change tab placement to bottom and persist', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await openSidebarAndAssistPanel(page);

    // 直接JavaScriptで設定を変更
    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.saveTabPlacement === 'function') {
        window.sidebarManager.saveTabPlacement('bottom');
      }
    });

    // サイドバーにdata-tab-placement属性が設定されていることを確認
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toHaveAttribute('data-tab-placement', 'bottom');

    // リロードして永続化を確認
    await page.reload();
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await expect(sidebar).toHaveAttribute('data-tab-placement', 'bottom');
  });

  test('should change tab order and persist', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await openSidebarAndAssistPanel(page);

    // 現在のタブ順序を取得
    const initialOrder = await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.getTabOrder === 'function') {
        return window.sidebarManager.getTabOrder();
      }
      return [];
    });

    expect(initialOrder.length).toBeGreaterThan(0);

    // タブ順序を変更（最初と2番目を入れ替え）
    const newOrder = [...initialOrder];
    if (newOrder.length >= 2) {
      [newOrder[0], newOrder[1]] = [newOrder[1], newOrder[0]];
    }

    await page.evaluate((order) => {
      if (window.sidebarManager && typeof window.sidebarManager.saveTabOrder === 'function') {
        window.sidebarManager.saveTabOrder(order);
      }
    }, newOrder);

    // タブを再構築
    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.bootstrapTabs === 'function') {
        window.sidebarManager.bootstrapTabs();
      }
    });

    await page.waitForTimeout(500);

    // 新しい順序が適用されていることを確認
    const currentOrder = await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.getTabOrder === 'function') {
        return window.sidebarManager.getTabOrder();
      }
      return [];
    });

    expect(currentOrder).toEqual(newOrder);

    // リロードして永続化を確認
    await page.reload();
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await page.waitForTimeout(500);

    const persistedOrder = await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.getTabOrder === 'function') {
        return window.sidebarManager.getTabOrder();
      }
      return [];
    });

    expect(persistedOrder).toEqual(newOrder);
  });

  test('should maintain existing tab functionality after placement change', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await openSidebarAndAssistPanel(page);

    // タブ配置を変更
    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.saveTabPlacement === 'function') {
        window.sidebarManager.saveTabPlacement('top');
      }
    });

    await page.waitForTimeout(300);

    // タブがクリック可能であることを確認
    const structureTab = page.locator('.sidebar-tab[data-group="structure"]');
    await expect(structureTab).toBeVisible();
    await structureTab.click();

    // structureタブがアクティブになっていることを確認
    await expect(structureTab).toHaveClass(/active/);

    // settingsタブに切り替え
    const settingsTab = page.locator('.sidebar-tab[data-group="settings"]').or(page.locator('.sidebar-tab[data-group="assist"]')).first();
    await expect(settingsTab).toBeVisible({ timeout: 10000 });
    await settingsTab.click();

    // settingsタブがアクティブになっていることを確認
    await expect(settingsTab).toHaveClass(/active/, { timeout: 10000 });
    await expect(structureTab).not.toHaveClass(/active/, { timeout: 10000 });
  });
});
