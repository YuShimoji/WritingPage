// @ts-nocheck
const { test, expect } = require('@playwright/test');

async function openSidebarAndAssistPanel(page) {
  // サイドバーを開き、assist グループを SidebarManager 経由でアクティブ化する
  await page.waitForSelector('#sidebar', { timeout: 10000 });

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
        window.sidebarManager.activateSidebarGroup('assist');
      }
      if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
        window.ZWGadgets.setActiveGroup('assist');
      }
    } catch (_) { /* noop */ }
  });

  // ガジェットがレンダリングされるまで待機
  await page.waitForTimeout(500);
}

test.describe('Flexible Tab Placement', () => {
  test('should change tab placement to right and persist', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    await openSidebarAndAssistPanel(page);

    // UI Settings ガジェットを探す
    const uiSettingsGadget = page.locator('#assist-gadgets-panel').filter({ hasText: 'UI Settings' });
    await expect(uiSettingsGadget).toBeVisible({ timeout: 5000 });

    // タブ配置セレクトを探す（"タブ配置"というラベルの後に続くselect）
    const placementSelect = page.locator('#assist-gadgets-panel select').filter({ hasText: /左|右|上|下/ }).first();
    
    // セレクトが見つからない場合は、直接data属性で確認
    const hasPlacementSelect = await placementSelect.count();
    if (hasPlacementSelect === 0) {
      // 直接JavaScriptで設定を変更
      await page.evaluate(() => {
        if (window.sidebarManager && typeof window.sidebarManager.saveTabPlacement === 'function') {
          window.sidebarManager.saveTabPlacement('right');
        }
      });
    } else {
      await placementSelect.selectOption('right');
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

    // typographyタブに切り替え
    const typographyTab = page.locator('.sidebar-tab[data-group="typography"]');
    await expect(typographyTab).toBeVisible();
    await typographyTab.click();

    // typographyタブがアクティブになっていることを確認
    await expect(typographyTab).toHaveClass(/active/);
    await expect(structureTab).not.toHaveClass(/active/);
  });
});
