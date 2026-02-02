// E2E: 画像位置調整・サイズ変更機能の検証
const { test, expect } = require('@playwright/test');

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
    // エディタの内容をクリア
    await page.evaluate(() => {
      if (window.ZenWriterEditor && window.ZenWriterEditor.editor) {
        window.ZenWriterEditor.editor.value = '';
        window.ZenWriterEditor.editor.dispatchEvent(new Event('input'));
      }
    });
  });

  test('画像を挿入してオーバーレイが表示される', async ({ page }) => {
    const dataUrl = await page.evaluate(createTestImage);
    
    // 画像を挿入
    await page.evaluate((url) => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertImageFile === 'function') {
        const blob = dataURLtoBlob(url);
        const file = new File([blob], 'test.png', { type: 'image/png' });
        return window.ZenWriterEditor.insertImageFile(file);
      }
      function dataURLtoBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      }
    }, dataUrl);

    // オーバーレイ画像が表示されるまで待機
    await page.waitForSelector('.editor-overlay__image', { timeout: 5000 });
    const overlayImage = page.locator('.editor-overlay__image');
    await expect(overlayImage).toBeVisible();
  });

  test('画像をドラッグして位置を変更できる', async ({ page }) => {
    const dataUrl = await page.evaluate(createTestImage);
    
    // 画像を挿入
    await page.evaluate((url) => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertImageFile === 'function') {
        const blob = dataURLtoBlob(url);
        const file = new File([blob], 'test.png', { type: 'image/png' });
        return window.ZenWriterEditor.insertImageFile(file);
      }
      function dataURLtoBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      }
    }, dataUrl);

    await page.waitForSelector('.editor-overlay__image', { timeout: 5000 });
    const overlayImage = page.locator('.editor-overlay__image').first();

    // 初期位置を取得
    const initialPosition = await overlayImage.boundingBox();
    expect(initialPosition).toBeTruthy();

    // 画像をドラッグ（X軸とY軸の両方向）
    await overlayImage.dragTo(overlayImage, {
      targetPosition: { x: initialPosition.width / 2 + 50, y: initialPosition.height / 2 + 50 },
      force: true,
    });

    // 位置が変更されたことを確認
    await page.waitForTimeout(300);
    const newPosition = await overlayImage.boundingBox();
    expect(newPosition).toBeTruthy();
    
    // 位置が変更されていることを確認（許容誤差を考慮）
    const deltaX = Math.abs(newPosition.x - initialPosition.x);
    const deltaY = Math.abs(newPosition.y - initialPosition.y);
    expect(deltaX).toBeGreaterThan(10);
    expect(deltaY).toBeGreaterThan(10);
  });

  test('リサイズハンドルで画像のサイズを変更できる', async ({ page }) => {
    const dataUrl = await page.evaluate(createTestImage);
    
    // 画像を挿入
    await page.evaluate((url) => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertImageFile === 'function') {
        const blob = dataURLtoBlob(url);
        const file = new File([blob], 'test.png', { type: 'image/png' });
        return window.ZenWriterEditor.insertImageFile(file);
      }
      function dataURLtoBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      }
    }, dataUrl);

    await page.waitForSelector('.editor-overlay__image', { timeout: 5000 });
    const overlayImage = page.locator('.editor-overlay__image').first();
    const resizeHandle = overlayImage.locator('.overlay-handle--resize');

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
    const dataUrl = await page.evaluate(createTestImage);
    
    // 画像を挿入
    const assetId = await page.evaluate((url) => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertImageFile === 'function') {
        const blob = dataURLtoBlob(url);
        const file = new File([blob], 'test.png', { type: 'image/png' });
        return window.ZenWriterEditor.insertImageFile(file).then(() => {
          // アセットIDを取得
          const assets = window.ZenWriterStorage.loadAssets();
          const ids = Object.keys(assets);
          return ids.length > 0 ? ids[ids.length - 1] : null;
        });
      }
      function dataURLtoBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      }
      return null;
    }, dataUrl);

    expect(assetId).toBeTruthy();

    await page.waitForSelector('.editor-overlay__image', { timeout: 5000 });
    const overlayImage = page.locator('.editor-overlay__image').first();

    // 位置とサイズを変更
    await overlayImage.dragTo(overlayImage, {
      targetPosition: { x: 100, y: 100 },
      force: true,
    });

    await page.waitForTimeout(300);

    const resizeHandle = overlayImage.locator('.overlay-handle--resize');
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + handleBox.width / 2 + 30, handleBox.y + handleBox.height / 2);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    // アセットメタデータが保存されていることを確認
    const assetMeta = await page.evaluate((id) => {
      if (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadAssets === 'function') {
        const assets = window.ZenWriterStorage.loadAssets();
        return assets[id] || null;
      }
      return null;
    }, assetId);

    expect(assetMeta).toBeTruthy();
    // offsetX と offsetY が保存されていることを確認（値は0以上）
    expect(typeof assetMeta.offsetX === 'number').toBeTruthy();
    expect(typeof assetMeta.offsetY === 'number').toBeTruthy();
    // widthPercent が保存されていることを確認
    expect(typeof assetMeta.widthPercent === 'number').toBeTruthy();
    expect(assetMeta.widthPercent).toBeGreaterThan(0);
    expect(assetMeta.widthPercent).toBeLessThanOrEqual(100);
  });
});
