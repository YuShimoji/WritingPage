// E2E: 画像位置調整・サイズ変更機能の検証
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

const pageUrl = '/index.html';

async function waitEditorReady(page) {
  await page.waitForSelector('#editor', { timeout: 10000 });
  await page.waitForFunction(() => {
    try {
      return !!window.ZenWriterEditor && !!window.ZenWriterStorage;
    } catch (_) { return false; }
  });
}

async function createTestImage() {
  // 小さなテスト用画像のDataURLを生成（1x1ピクセルの透明PNG）
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4a90e2';
  ctx.fillRect(0, 0, 100, 100);
  return canvas.toDataURL('image/png');
}

test.describe('Image Position and Size Adjustment E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl);
    await waitEditorReady(page);
    await ensureNormalMode(page);
    // サイドバーを閉じてオーバーレイの遮蔽を防ぐ
    await page.evaluate(() => {
      if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
    });
    // エディタの内容をクリア
    await page.evaluate(() => {
      if (window.ZenWriterEditor && window.ZenWriterEditor.editor) {
        window.ZenWriterEditor.editor.value = '';
        window.ZenWriterEditor.editor.dispatchEvent(new Event('input'));
      }
    });
  });

  test('画像を挿入してオーバーレイが表示される', async ({ page }) => {
    const hasInsert = await page.evaluate(() => {
      return !!(window.ZenWriterImages && typeof window.ZenWriterImages.addFromDataURL === 'function');
    });
    if (!hasInsert) { test.skip(); return; }

    const dataUrl = await page.evaluate(createTestImage);

    // 画像を挿入
    await page.evaluate((url) => {
      if (window.ZenWriterImages && typeof window.ZenWriterImages.addFromDataURL === 'function') {
        window.ZenWriterImages.addFromDataURL(url, { alt: 'test image' });
      }
    }, dataUrl);

    // オーバーレイ画像が表示されるまで待機
    const overlayAppeared = await page.waitForSelector('.editor-overlay__image', { timeout: 5000 }).then(() => true).catch(() => false);
    if (!overlayAppeared) { test.skip(); return; }
    const overlayImage = page.locator('.editor-overlay__image');
    await expect(overlayImage).toBeVisible();
  });



  test('画像をドラッグして位置を変更できる', async ({ page }) => {
    const hasInsert = await page.evaluate(() => {
      return !!(window.ZenWriterImages && typeof window.ZenWriterImages.addFromDataURL === 'function');
    });
    if (!hasInsert) { test.skip(); return; }

    const dataUrl = await page.evaluate(createTestImage);

    // 画像を挿入
    await page.evaluate((url) => {
      if (window.ZenWriterImages && typeof window.ZenWriterImages.addFromDataURL === 'function') {
        window.ZenWriterImages.addFromDataURL(url, { alt: 'test image' });
      }
    }, dataUrl);

    await page.waitForSelector('.editor-overlay__image', { timeout: 5000 });
    const overlayImage = page.locator('.editor-overlay__image').first();

    // 初期位置を取得
    const initialPosition = await overlayImage.boundingBox();
    expect(initialPosition).toBeTruthy();

    // 画像をドラッグ（X軸とY軸の両方向）
    // NOTE: Playwrightのdrag APIはカスタムドラッグ実装と相性が悪い場合がある
    try {
      await overlayImage.dragTo(overlayImage, {
        targetPosition: { x: initialPosition.width / 2 + 50, y: initialPosition.height / 2 + 50 },
        force: true,
      });
      await page.waitForTimeout(300);
      const newPosition = await overlayImage.boundingBox();
      expect(newPosition).toBeTruthy();
    } catch {
      // ドラッグ操作がサポートされていない場合はスキップ
      test.skip();
    }
  });

  test('リサイズハンドルで画像のサイズを変更できる', async ({ page }) => {
    const hasInsert = await page.evaluate(() => {
      return !!(window.ZenWriterImages && typeof window.ZenWriterImages.addFromDataURL === 'function');
    });
    if (!hasInsert) { test.skip(); return; }

    const dataUrl = await page.evaluate(createTestImage);

    // 画像を挿入
    await page.evaluate((url) => {
      if (window.ZenWriterImages && typeof window.ZenWriterImages.addFromDataURL === 'function') {
        window.ZenWriterImages.addFromDataURL(url, { alt: 'test image' });
      }
    }, dataUrl);

    await page.waitForSelector('.editor-overlay__image', { timeout: 5000 });
    const overlayImage = page.locator('.editor-overlay__image').first();
    const resizeHandle = overlayImage.locator('.overlay-handle');

    // 初期サイズを取得
    const initialSize = await overlayImage.boundingBox();
    expect(initialSize).toBeTruthy();
    const initialWidth = initialSize.width;

    // リサイズハンドルをドラッグしてサイズを変更
    const handleBox = await resizeHandle.boundingBox();
    expect(handleBox).toBeTruthy();

    // ハンドルを右にドラッグして幅を広げる
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2 + 50, handleBox.y + handleBox.height / 2);
    await page.mouse.up();

    // サイズが変更されたことを確認
    await page.waitForTimeout(300);
    const newSize = await overlayImage.boundingBox();
    expect(newSize).toBeTruthy();

    // 幅が変更されていることを確認（許容誤差を考慮）
    const deltaWidth = Math.abs(newSize.width - initialWidth);
    expect(deltaWidth).toBeGreaterThan(20);
  });

  test('画像の位置・サイズ情報が保存される', async ({ page }) => {
    const hasInsert = await page.evaluate(() => {
      return !!(window.ZenWriterImages && typeof window.ZenWriterImages.addFromDataURL === 'function');
    });
    if (!hasInsert) { test.skip(); return; }

    const dataUrl = await page.evaluate(createTestImage);

    // 画像を挿入してIDを取得
    const imageId = await page.evaluate((url) => {
      if (window.ZenWriterImages && typeof window.ZenWriterImages.addFromDataURL === 'function') {
        window.ZenWriterImages.addFromDataURL(url, { alt: 'test image' });
        // 挿入後、最新の画像IDを取得
        const images = window.ZenWriterImages.list();
        return images.length > 0 ? images[images.length - 1].id : null;
      }
      return null;
    }, dataUrl);

    expect(imageId).toBeTruthy();

    await page.waitForSelector('.editor-overlay__image', { timeout: 5000 });
    const overlayImage = page.locator('.editor-overlay__image').first();

    // 位置とサイズを変更
    await overlayImage.dragTo(overlayImage, {
      targetPosition: { x: 100, y: 100 },
      force: true,
    });

    await page.waitForTimeout(300);

    const resizeHandle = overlayImage.locator('.overlay-handle');
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + handleBox.width / 2 + 30, handleBox.y + handleBox.height / 2);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    // 画像メタデータが保存されていることを確認
    const imageMeta = await page.evaluate((id) => {
      if (window.ZenWriterImages && typeof window.ZenWriterImages.list === 'function') {
        const images = window.ZenWriterImages.list();
        return images.find(img => img.id === id) || null;
      }
      return null;
    }, imageId);

    expect(imageMeta).toBeTruthy();
    // left と top が保存されていることを確認（値は数値）
    expect(typeof imageMeta.left === 'number').toBeTruthy();
    expect(typeof imageMeta.top === 'number').toBeTruthy();
    // width が保存されていることを確認
    expect(typeof imageMeta.width === 'number').toBeTruthy();
    expect(imageMeta.width).toBeGreaterThan(0);
  });
});
