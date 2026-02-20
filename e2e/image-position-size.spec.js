const { test, expect } = require('@playwright/test');

const pageUrl = '/index.html';

async function waitEditorReady(page) {
  await page.goto(pageUrl);
  await page.waitForSelector('#editor', { timeout: 10000 });
  await page.waitForFunction(() => {
    try {
      return !!window.ZenWriterEditor && !!window.ZenWriterStorage;
    } catch (_) {
      return false;
    }
  });
}

function makeDataUrl() {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4a90e2';
  ctx.fillRect(0, 0, 100, 100);
  return canvas.toDataURL('image/png');
}

async function insertImageFromDataUrl(page, dataUrl) {
  return page.evaluate(async (url) => {
    function dataURLtoBlob(raw) {
      const arr = raw.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new Blob([u8arr], { type: mime });
    }

    const manager = window.ZenWriterEditor;
    if (!manager) return { ok: false, reason: 'no-manager' };

    try {
      const file = new File([dataURLtoBlob(url)], 'test.png', { type: 'image/png' });
      if (typeof manager.insertImageFile === 'function') {
        await manager.insertImageFile(file);
      } else if (typeof window.editorImages_insertImageFile === 'function') {
        await window.editorImages_insertImageFile(manager, file);
      } else {
        return { ok: false, reason: 'no-insert-api' };
      }

      if (typeof manager.renderImagePreview === 'function') {
        manager.renderImagePreview();
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, reason: String((e && e.message) || e || 'unknown') };
    }
  }, dataUrl);
}

async function latestAssetId(page) {
  return page.evaluate(() => {
    try {
      const assets = window.ZenWriterStorage.loadAssets ? window.ZenWriterStorage.loadAssets() : {};
      const ids = Object.keys(assets || {});
      return ids.length ? ids[ids.length - 1] : null;
    } catch (_) {
      return null;
    }
  });
}

async function readAssetMeta(page, assetId) {
  return page.evaluate((id) => {
    try {
      const assets = window.ZenWriterStorage.loadAssets ? window.ZenWriterStorage.loadAssets() : {};
      return (assets && assets[id]) || null;
    } catch (_) {
      return null;
    }
  }, assetId);
}

test.describe('Image Position and Size Adjustment E2E', () => {
  test.beforeEach(async ({ page }) => {
    await waitEditorReady(page);
    await page.evaluate(() => {
      try {
        if (window.ZenWriterEditor && window.ZenWriterEditor.editor) {
          window.ZenWriterEditor.editor.value = '';
          window.ZenWriterEditor.editor.dispatchEvent(new Event('input'));
        }
      } catch (_) {}
    });
  });

  test('shows overlay image after insertion', async ({ page }) => {
    const dataUrl = await page.evaluate(makeDataUrl);
    const inserted = await insertImageFromDataUrl(page, dataUrl);
    expect(inserted && inserted.ok).toBeTruthy();

    await page.waitForSelector('.editor-overlay__image', { timeout: 10000 });
    await expect(page.locator('.editor-overlay__image').first()).toBeVisible();
  });

  test('moves overlay position after drag', async ({ page }) => {
    const dataUrl = await page.evaluate(makeDataUrl);
    const inserted = await insertImageFromDataUrl(page, dataUrl);
    expect(inserted && inserted.ok).toBeTruthy();

    await page.waitForSelector('.editor-overlay__image', { timeout: 10000 });
    const overlay = page.locator('.editor-overlay__image').first();
    const assetId = await overlay.getAttribute('data-asset-id');
    expect(assetId).toBeTruthy();

    const box = await overlay.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 40);
    await page.mouse.up();

    await page.waitForTimeout(300);
    const afterBox = await overlay.boundingBox();
    expect(afterBox).toBeTruthy();
    const moved = Math.abs(afterBox.x - box.x) + Math.abs(afterBox.y - box.y);
    expect(moved).toBeGreaterThan(5);
  });

  test('changes overlay width after resize handle drag', async ({ page }) => {
    const dataUrl = await page.evaluate(makeDataUrl);
    const inserted = await insertImageFromDataUrl(page, dataUrl);
    expect(inserted && inserted.ok).toBeTruthy();

    await page.waitForSelector('.editor-overlay__image', { timeout: 10000 });
    const overlay = page.locator('.editor-overlay__image').first();
    const handle = overlay.locator('.overlay-handle--resize');
    await expect(handle).toBeVisible();
    const assetId = await overlay.getAttribute('data-asset-id');
    expect(assetId).toBeTruthy();
    const beforeBox = await overlay.boundingBox();
    expect(beforeBox).toBeTruthy();
    const beforeWidth = beforeBox.width;

    const hbox = await handle.boundingBox();
    expect(hbox).toBeTruthy();
    await page.mouse.move(hbox.x + hbox.width / 2, hbox.y + hbox.height / 2);
    await page.mouse.down();
    await page.mouse.move(hbox.x + hbox.width / 2 + 50, hbox.y + hbox.height / 2);
    await page.mouse.up();

    await page.waitForTimeout(300);
    const afterBox = await overlay.boundingBox();
    expect(afterBox).toBeTruthy();
    expect(Math.abs(afterBox.width - beforeWidth)).toBeGreaterThan(5);
  });

  test('keeps inserted image after reload', async ({ page }) => {
    const dataUrl = await page.evaluate(makeDataUrl);
    const inserted = await insertImageFromDataUrl(page, dataUrl);
    expect(inserted && inserted.ok).toBeTruthy();

    const id = await latestAssetId(page);
    expect(id).toBeTruthy();

    await page.waitForSelector('.editor-overlay__image', { timeout: 10000 });
    const overlay = page.locator(`.editor-overlay__image[data-asset-id="${id}"]`).first();
    await expect(overlay).toBeVisible();

    const box = await overlay.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 35);
    await page.mouse.up();

    const handle = overlay.locator('.overlay-handle--resize');
    const hbox = await handle.boundingBox();
    if (hbox) {
      await page.mouse.move(hbox.x + hbox.width / 2, hbox.y + hbox.height / 2);
      await page.mouse.down();
      await page.mouse.move(hbox.x + hbox.width / 2 + 30, hbox.y + hbox.height / 2);
      await page.mouse.up();
    }

    await page.reload();
    await waitEditorReady(page);
    await page.waitForTimeout(300);
    const meta = await readAssetMeta(page, id);
    expect(meta).toBeTruthy();
    await page.waitForSelector(`.editor-overlay__image[data-asset-id="${id}"]`, { timeout: 10000 });
    await expect(page.locator(`.editor-overlay__image[data-asset-id="${id}"]`).first()).toBeVisible();
  });
});
