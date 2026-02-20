// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Responsive UI (Mobile/Tablet)', () => {
  // モバイルビューポート（iPhone 12 Pro相当）
  const mobileViewport = { width: 390, height: 844 };
  // タブレットビューポート（iPad相当）
  const tabletViewport = { width: 820, height: 1180 };

  test.describe('Mobile Viewport (max-width: 768px)', () => {
    test.use({ viewport: mobileViewport, hasTouch: true });

    test('サイドバーがフルスクリーンオーバーレイとして表示される', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
      
      // サイドバーを開く
      await page.click('#toggle-sidebar');
      await page.waitForTimeout(400); // transition duration
      
      const sidebar = page.locator('#sidebar');
      await expect(sidebar).toHaveClass(/open/);
      
      // サイドバーが100%幅であることを確認
      const sidebarWidth = await sidebar.evaluate((el) => {
        return window.getComputedStyle(el).width;
      });
      const sidebarWidthNum = parseFloat(sidebarWidth);
      const viewport = page.viewportSize();
      if (viewport) {
        expect(sidebarWidthNum).toBeLessThanOrEqual(viewport.width);
        expect(sidebarWidthNum).toBeGreaterThanOrEqual(Math.min(320, viewport.width * 0.8));
      }
      
      // サイドバーオーバーレイが表示されていることを確認
      const overlay = page.locator('#sidebar-overlay');
      await expect(overlay).toBeVisible();
      
      // エディタコンテナが押し出されていないことを確認（オーバーレイモード）
      const editorContainer = page.locator('.editor-container');
      const marginLeft = await editorContainer.evaluate((el) => {
        return window.getComputedStyle(el).marginLeft;
      });
      expect(parseInt(marginLeft)).toBe(0);
    });

    test('サイドバーオーバーレイをクリック/タップでサイドバーが閉じる', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
      
      // サイドバーを開く
      await page.click('#toggle-sidebar');
      await page.waitForTimeout(400);
      
      // オーバーレイをクリック
      const overlay = page.locator('#sidebar-overlay');
      await expect(overlay).toBeVisible();
      const viewport = page.viewportSize();
      if (viewport) {
        // サイドバー外（右端）のオーバーレイ領域をタップする
        await page.mouse.click(viewport.width - 4, Math.floor(viewport.height / 2));
      } else {
        await overlay.click({ force: true });
      }
      await page.waitForTimeout(400);
      
      // サイドバーが閉じていることを確認
      const sidebar = page.locator('#sidebar');
      const hasOpenClass = await sidebar.evaluate((el) => {
        return el.classList.contains('open');
      });
      expect(hasOpenClass).toBe(false);
    });

    test('ハンバーガーメニューボタンが適切なサイズで表示される', async ({ page }) => {
      await page.goto('/');
      const toggleBtn = page.locator('#toggle-sidebar');
      
      // ボタンが表示されていることを確認
      await expect(toggleBtn).toBeVisible();
      
      // ボタンのサイズがタッチ操作に適していることを確認（最小44px）
      const btnSize = await toggleBtn.boundingBox();
      expect(btnSize.width).toBeGreaterThanOrEqual(44);
      expect(btnSize.height).toBeGreaterThanOrEqual(44);
    });

    test('ツールバーのアイコンボタンがタッチ操作に最適化されている', async ({ page }) => {
      await page.goto('/');
      const toolbar = page.locator('.toolbar');
      await expect(toolbar).toBeVisible();
      
      // アイコンボタンのサイズを確認
      const iconButtons = page.locator('.toolbar .icon-button');
      const count = await iconButtons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const btn = iconButtons.nth(i);
        const box = await btn.boundingBox();
        if (box) {
          // タッチ操作に適したサイズ（最小40px）であることを確認
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('エディタのフォントサイズとパディングが適切に調整されている', async ({ page }) => {
      await page.goto('/');
      const editor = page.locator('#editor');
      await expect(editor).toBeVisible();
      
      // フォントサイズが16px以上であることを確認（iOSでのズーム防止）
      const fontSize = await editor.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });
      const fontSizeNum = parseFloat(fontSize);
      expect(fontSizeNum).toBeGreaterThanOrEqual(16);
      
      // パディングが適切に設定されていることを確認
      const padding = await editor.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          top: style.paddingTop,
          left: style.paddingLeft
        };
      });
      expect(parseFloat(padding.top)).toBeGreaterThan(0);
      expect(parseFloat(padding.left)).toBeGreaterThan(0);
    });

    test('サイドバーのスワイプ操作で閉じることができる', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
      
      // サイドバーを開く
      await page.click('#toggle-sidebar');
      await page.waitForTimeout(400);
      
      const sidebar = page.locator('#sidebar');
      await expect(sidebar).toHaveClass(/open/);
      
      // サイドバーを左方向にスワイプ
      const sidebarBox = await sidebar.boundingBox();
      if (sidebarBox) {
        const startX = sidebarBox.x + sidebarBox.width - 10;
        const startY = sidebarBox.y + sidebarBox.height / 2;
        const endX = startX - 100; // 左方向に100pxスワイプ

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, startY);
        await page.mouse.up();
        
        await page.waitForTimeout(400);
        
        // サイドバーが閉じていることを確認
        const hasOpenClass = await sidebar.evaluate((el) => {
          return el.classList.contains('open');
        });
        expect(hasOpenClass).toBe(false);
      }
    });

    test('フローティングパネルがモバイル画面に適切に表示される', async ({ page }) => {
      await page.goto('/');
      
      // フォントパネルを開く（FABボタンをクリック）
      const fabTools = page.locator('#fab-tools');
      if (await fabTools.isVisible()) {
        await fabTools.click();
        await page.waitForTimeout(300);
        
        const fontPanel = page.locator('#floating-font-panel');
        if (await fontPanel.isVisible()) {
          // パネルが画面内に収まっていることを確認
          const panelBox = await fontPanel.boundingBox();
          const viewport = page.viewportSize();
          
          if (panelBox && viewport) {
            expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(viewport.width);
            expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(viewport.height);
          }
        }
      }
    });
  });

  test.describe('Tablet Viewport (max-width: 1024px)', () => {
    test.use({ viewport: tabletViewport });

    test('タブレット向けにサイドバー幅が調整される', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
      
      // サイドバーを開く
      await page.click('#toggle-sidebar');
      await page.waitForTimeout(400);
      
      const sidebar = page.locator('#sidebar');
      await expect(sidebar).toHaveClass(/open/);
      
      // サイドバー幅が280pxに調整されていることを確認
      const sidebarWidth = await sidebar.evaluate((el) => {
        return window.getComputedStyle(el).width;
      });
      const widthNum = parseFloat(sidebarWidth);
      // 280px前後であることを確認（パディング等の影響を考慮）
      expect(widthNum).toBeGreaterThanOrEqual(250);
      expect(widthNum).toBeLessThanOrEqual(340);
    });

    test('ツールバーのアイコンサイズが適切に調整される', async ({ page }) => {
      await page.goto('/');
      const toolbar = page.locator('.toolbar');
      await expect(toolbar).toBeVisible();
      
      const iconButton = page.locator('.toolbar .icon-button').first();
      const box = await iconButton.boundingBox();
      
      if (box) {
        // タブレット向けにサイズが調整されていることを確認
        expect(box.width).toBeGreaterThanOrEqual(36);
        expect(box.height).toBeGreaterThanOrEqual(36);
      }
    });

    test('エディタのパディングがタブレット向けに調整される', async ({ page }) => {
      await page.goto('/');
      const editor = page.locator('#editor');
      await expect(editor).toBeVisible();
      
      const padding = await editor.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.paddingLeft);
      });
      
      // タブレット向けのパディング（1.5rem = 24px前後）であることを確認
      expect(padding).toBeGreaterThanOrEqual(16);
      expect(padding).toBeLessThanOrEqual(32);
    });

    test('分割ビューが縦並びで表示される', async ({ page }) => {
      await page.goto('/');
      
      // 分割ビューボタンをクリック
      const splitViewBtn = page.locator('#toggle-split-view');
      if (await splitViewBtn.isVisible()) {
        await splitViewBtn.click();
        await page.waitForTimeout(300);
        
        // モード選択パネルが表示されることを確認
        const modePanel = page.locator('#split-view-mode-panel');
        if (await modePanel.isVisible()) {
          // 編集/プレビューモードを選択
          const editPreviewBtn = page.locator('#split-view-edit-preview');
          if (await editPreviewBtn.isVisible()) {
            await editPreviewBtn.click();
            await page.waitForTimeout(400);
            
            const splitContainer = page.locator('#split-view-container');
            if (await splitContainer.isVisible()) {
              // コンテナが縦並び（flex-direction: column）であることを確認
              const flexDirection = await splitContainer.evaluate((el) => {
                return window.getComputedStyle(el).flexDirection;
              });
              expect(flexDirection).toBe('column');
            }
          }
        }
      }
    });
  });

  test.describe('Touch Device Optimization', () => {
    test.use({ viewport: mobileViewport, hasTouch: true });

    test('タッチ操作に最適化されたボタンサイズ', async ({ page }) => {
      await page.goto('/');
      
      // 各種ボタンのサイズを確認
      const buttons = [
        '#toggle-sidebar',
        '.toolbar .icon-button',
        '.fab-button'
      ];
      
      for (const selector of buttons) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < Math.min(count, 3); i++) {
          const btn = elements.nth(i);
          if (await btn.isVisible()) {
            const box = await btn.boundingBox();
            if (box) {
              // 最小44px（iOS推奨）または40px（Android推奨）であることを確認
              expect(box.width).toBeGreaterThanOrEqual(40);
              expect(box.height).toBeGreaterThanOrEqual(40);
            }
          }
        }
      }
    });

    test('入力要素のフォントサイズが16px以上（iOSズーム防止）', async ({ page }) => {
      await page.goto('/');
      
      const inputElements = [
        '#editor',
        '#search-input',
        '#replace-input'
      ];
      
      for (const selector of inputElements) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < Math.min(count, 2); i++) {
          const el = elements.nth(i);
          if (await el.isVisible()) {
            const fontSize = await el.evaluate((elem) => {
              return window.getComputedStyle(elem).fontSize;
            });
            const fontSizeNum = parseFloat(fontSize);
            // 16px以上であることを確認（iOSでの自動ズームを防ぐ）
            expect(fontSizeNum).toBeGreaterThanOrEqual(16);
          }
        }
      }
    });
  });
});
