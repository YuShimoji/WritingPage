// E2E: コラージュレイアウト機能の検証
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

const pageUrl = '/index.html';

async function waitImagesAPIReady(page) {
  await page.evaluate(async () => {
    try {
      if (window.ZenWriterImages && typeof window.ZenWriterImages.addFromDataURL === 'function') {
        return;
      }
      await new Promise((resolve) => {
        var existing = document.querySelector('script[src$="js/images.js"]');
        if (existing) {
          if (window.ZenWriterImages) {
            resolve();
            return;
          }
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 5000);
          return;
        }
        var s = document.createElement('script');
        s.src = 'js/images.js';
        s.defer = true;
        s.onload = resolve;
        s.onerror = resolve;
        document.body.appendChild(s);
        setTimeout(resolve, 5000);
      });
    } catch (_) { /* noop */ }
  });

  await page.waitForFunction(() => {
    try {
      return !!window.ZenWriterImages && (
        typeof window.ZenWriterImages.addFromDataURL === 'function' ||
        typeof window.ZenWriterImages.addFromUrl === 'function'
      );
    } catch (_) { return false; }
  }, null, { timeout: 15000 });
}

async function waitGadgetsReady(page) {
  await page.waitForFunction(() => {
    try {
      return !!window.ZWGadgets && !!document.querySelector('#settings-gadgets-panel');
    } catch (_) { return false; }
  });
  await enableAllGadgets(page);
  await openSidebarGroup(page, 'settings');
  await page.waitForTimeout(500);
}

test.describe('Collage Layout E2E', () => {
  test('コラージュレイアウトAPIが利用可能', async ({ page }) => {
    await page.goto(pageUrl);
    await waitImagesAPIReady(page);

    const apiAvailable = await page.evaluate(() => {
      try {
        const API = window.ZenWriterImages;
        return !!(
          API &&
          typeof API.setCollageMode === 'function' &&
          typeof API.getCollageMode === 'function' &&
          typeof API.setGridConfig === 'function' &&
          typeof API.getGridConfig === 'function' &&
          typeof API.applyGridLayout === 'function' &&
          typeof API.saveCollageLayout === 'function' &&
          typeof API.loadCollageLayout === 'function' &&
          typeof API.arrangeImagesInGrid === 'function'
        );
      } catch (_) {
        return false;
      }
    });

    expect(apiAvailable).toBeTruthy();
  });

  test('コラージュモードの切り替えが動作する', async ({ page }) => {
    await page.goto(pageUrl);
    await waitImagesAPIReady(page);

    // モードを設定
    await page.evaluate(() => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages.setCollageMode === 'function') {
          window.ZenWriterImages.setCollageMode('grid');
        }
      } catch (_) { /* noop */ }
    });

    const mode = await page.evaluate(() => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages.getCollageMode === 'function') {
          return window.ZenWriterImages.getCollageMode();
        }
      } catch (_) { }
      return null;
    });

    expect(mode).toBe('grid');

    // 自由配置モードに戻す
    await page.evaluate(() => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages.setCollageMode === 'function') {
          window.ZenWriterImages.setCollageMode('free');
        }
      } catch (_) { /* noop */ }
    });

    const freeMode = await page.evaluate(() => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages.getCollageMode === 'function') {
          return window.ZenWriterImages.getCollageMode();
        }
      } catch (_) { }
      return null;
    });

    expect(freeMode).toBe('free');
  });

  test('グリッド設定が保存・取得できる', async ({ page }) => {
    await page.goto(pageUrl);
    await waitImagesAPIReady(page);

    // グリッド設定を設定
    await page.evaluate(() => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages.setGridConfig === 'function') {
          window.ZenWriterImages.setGridConfig({ rows: 3, cols: 3, gap: 20 });
        }
      } catch (_) { /* noop */ }
    });

    const config = await page.evaluate(() => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages.getGridConfig === 'function') {
          return window.ZenWriterImages.getGridConfig();
        }
      } catch (_) { }
      return null;
    });

    expect(config).toBeTruthy();
    expect(config.rows).toBe(3);
    expect(config.cols).toBe(3);
    expect(config.gap).toBe(20);
  });

  test('コラージュレイアウトの保存・復元が動作する', async ({ page }) => {
    await page.goto(pageUrl);
    await waitImagesAPIReady(page);

    // テスト用の画像を追加
    const testImageId = await page.evaluate(() => {
      try {
        if (window.ZenWriterImages && (
          typeof window.ZenWriterImages.addFromDataURL === 'function' ||
          typeof window.ZenWriterImages.addFromUrl === 'function'
        )) {
          const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
          if (typeof window.ZenWriterImages.addFromDataURL === 'function') {
            window.ZenWriterImages.addFromDataURL(testDataUrl, { left: 100, top: 100, width: 200 });
          } else {
            window.ZenWriterImages.addFromUrl(testDataUrl, { left: 100, top: 100, width: 200 });
          }
          const images = window.ZenWriterImages.list();
          return images && images.length > 0 ? images[images.length - 1].id : null;
        }
      } catch (_) { }
      return null;
    });

    if (!testImageId) {
      test.skip();
      return;
    }

    // レイアウトを保存
    const savedLayout = await page.evaluate(() => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages.saveCollageLayout === 'function') {
          return window.ZenWriterImages.saveCollageLayout();
        }
      } catch (_) { }
      return null;
    });

    expect(savedLayout).toBeTruthy();
    expect(savedLayout.mode).toBeDefined();
    expect(savedLayout.images).toBeDefined();
    expect(Array.isArray(savedLayout.images)).toBeTruthy();

    // 画像位置を変更
    await page.evaluate((id) => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages.update === 'function') {
          window.ZenWriterImages.update(id, { left: 300, top: 300 });
        }
      } catch (_) { }
    }, testImageId);

    // レイアウトを復元
    const loadedLayout = await page.evaluate(() => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages.loadCollageLayout === 'function') {
          return window.ZenWriterImages.loadCollageLayout();
        }
      } catch (_) { }
      return null;
    });

    expect(loadedLayout).toBeTruthy();

    // 位置が復元されたか確認
    const restoredImage = await page.evaluate((id) => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages._load === 'function') {
          const images = window.ZenWriterImages._load();
          for (let i = 0; i < images.length; i++) {
            if (images[i] && images[i].id === id) {
              return images[i];
            }
          }
        }
      } catch (_) { }
      return null;
    }, testImageId);

    expect(restoredImage).toBeTruthy();
    // 保存時の位置に戻っているか確認（100, 100）
    expect(restoredImage.left).toBe(100);
    expect(restoredImage.top).toBe(100);
  });

  test('グリッドモード時にオーバーレイにdata属性が設定される', async ({ page }) => {
    await page.goto(pageUrl);
    await waitImagesAPIReady(page);

    // グリッドモードに設定
    await page.evaluate(() => {
      try {
        if (window.ZenWriterImages && typeof window.ZenWriterImages.setCollageMode === 'function') {
          window.ZenWriterImages.setCollageMode('grid');
        }
      } catch (_) { /* noop */ }
    });

    await page.waitForTimeout(100);

    const hasGridAttribute = await page.evaluate(() => {
      try {
        const overlay = document.getElementById('editor-overlay');
        return overlay && overlay.getAttribute('data-collage-mode') === 'grid';
      } catch (_) {
        return false;
      }
    });

    expect(hasGridAttribute).toBeTruthy();
  });

  test('画像ガジェットにコラージュレイアウトコントロールが表示される', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    // Imagesガジェットを探す
    const imagesGadget = page.locator('#settings-gadgets-panel .gadget-wrapper[data-gadget-name="Images"]');
    await expect(imagesGadget).toBeVisible({ timeout: 5000 });

    // コラージュレイアウトセクションが存在するか確認
    const collageSection = imagesGadget.locator('div').filter({ hasText: /コラージュレイアウト|Collage/i });
    await expect(collageSection.first()).toBeVisible();

    // モード切り替えボタンが存在するか確認
    const modeButtons = imagesGadget.locator('button').filter({ hasText: /自由配置|グリッド|Free|Grid/i });
    const buttonCount = await modeButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });
});
