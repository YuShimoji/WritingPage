const { test, expect } = require('@playwright/test');
const { openCommandPalette } = require('./helpers');

async function dragFromBox(page, box, dx, dy, options = {}) {
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dx, startY + dy, { steps: options.steps || 8 });
  await page.mouse.up();
}

async function dispatchSyntheticPointer(locator, type, box, dx = 0, dy = 0, options = {}) {
  const x = box.x + box.width / 2 + dx;
  const y = box.y + box.height / 2 + dy;
  await locator.dispatchEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerId: options.pointerId || 1,
    pointerType: options.pointerType || 'touch',
    isPrimary: options.isPrimary !== false,
    button: 0,
    buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
  });
}

async function getMemoTranslateY(locator) {
  return locator.evaluate((element) => {
    const match = element.style.transform.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px,\s*([-\d.]+)px\)/);
    return match ? parseFloat(match[2]) : null;
  });
}

test.describe('floating memo lab', () => {
  test('supports surface dragging for background memos and foreground editing', async ({ page }) => {
    await page.goto('/index.html?memoLab=1');

    const overlay = page.locator('#memo-field-lab');
    const memos = page.locator('.memo-field-lab__memo');
    await expect(overlay).toBeVisible();
    await expect(memos).toHaveCount(8);

    const firstMemo = memos.first();
    const firstText = firstMemo.locator('.memo-field-lab__memo-text');
    await expect(firstMemo).toHaveAttribute('data-memo-state', 'foreground');
    await expect(firstText).toBeEditable();

    const noteText = 'foreground edit survives';
    await firstText.fill(noteText);
    await expect(firstText).toHaveValue(noteText);

    const secondMemo = page.locator('[data-memo-id="memo-02-2"]');
    const secondTextAreaBox = await secondMemo.locator('.memo-field-lab__memo-text').boundingBox();
    expect(secondTextAreaBox).toBeTruthy();
    await page.mouse.move(secondTextAreaBox.x + secondTextAreaBox.width / 2, secondTextAreaBox.y + secondTextAreaBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(secondTextAreaBox.x + secondTextAreaBox.width / 2 + 28, secondTextAreaBox.y + secondTextAreaBox.height / 2 - 24, { steps: 6 });
    await expect(secondMemo).toHaveAttribute('data-memo-state', 'dragging');
    await page.mouse.up();
    await page.waitForTimeout(80);
    await expect(secondMemo).not.toHaveAttribute('data-memo-state', 'dragging');

    const fourthMemo = page.locator('[data-memo-id="memo-04-4"]');
    const fourthHit = fourthMemo.locator('.memo-field-lab__memo-hit');
    const fourthBox = await fourthHit.boundingBox();
    expect(fourthBox).toBeTruthy();
    await dragFromBox(page, fourthBox, 20, 18, { steps: 5 });
    await expect(fourthMemo).not.toHaveAttribute('data-memo-state', 'dragging');

    await page.getByRole('button', { name: '閉じる' }).click();
    await expect(overlay).toBeHidden();
  });

  test('keeps memo identity through throw-away respawn and exposes flutter state', async ({ page }) => {
    await page.goto('/index.html?memoLab=1');

    const memo = page.locator('[data-memo-id="memo-01-1"]');
    const textarea = memo.locator('.memo-field-lab__memo-text');
    const header = memo.locator('.memo-field-lab__memo-header');

    await expect(memo).toHaveAttribute('data-memo-state', 'foreground');
    await textarea.fill('respawn keeps this text');
    await expect(textarea).toHaveValue('respawn keeps this text');

    const startGeneration = await memo.getAttribute('data-spawn-generation');
    const headerBox = await header.boundingBox();
    expect(headerBox).toBeTruthy();

    await dragFromBox(page, headerBox, 560, -180, { steps: 3 });

    await expect(memo).toHaveAttribute('data-paper-flutter', 'true');
    await expect(memo).toHaveAttribute('data-memo-state', /returning|respawning/);
    await expect(memo).toHaveAttribute('data-spawn-generation', new RegExp(`^(?!${startGeneration}$).+`), { timeout: 4000 });
    await expect(memo).toHaveAttribute('data-memo-state', 'floating', { timeout: 4000 });

    await memo.locator('.memo-field-lab__memo-hit').click({ force: true });
    await expect(memo).toHaveAttribute('data-memo-state', 'foreground');
    await expect(textarea).toHaveValue('respawn keeps this text');
  });

  test('disables flutter under prefers-reduced-motion and still opens from command palette', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/index.html');

    await openCommandPalette(page);
    await page.locator('#command-palette-input').fill('浮遊メモ');
    await page.getByRole('option', { name: /浮遊メモ実験/ }).click();

    const overlay = page.locator('#memo-field-lab');
    const memo = page.locator('[data-memo-id="memo-02-2"]');
    await expect(overlay).toBeVisible();
    await expect(memo).toBeVisible();

    const box = await memo.locator('.memo-field-lab__memo-header').boundingBox();
    expect(box).toBeTruthy();
    await dragFromBox(page, box, 320, -120, { steps: 3 });

    await page.waitForTimeout(80);
    await expect(memo).toHaveAttribute('data-paper-flutter', 'false');
  });
});

test.describe('floating memo lab touch interactions', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 430, height: 932 },
  });

  test('promotes on first touch tap, edits on second tap, and backdrop blur is two-stage', async ({ page }) => {
    await page.goto('/index.html?memoLab=1');

    const memo = page.locator('[data-memo-id="memo-03-3"]');
    const hit = memo.locator('.memo-field-lab__memo-hit');
    const textarea = memo.locator('.memo-field-lab__memo-text');
    const viewport = page.locator('#memo-field-lab-viewport');
    const viewportBox = await viewport.boundingBox();
    expect(viewportBox).toBeTruthy();
    const blurDx = 24 - viewportBox.width / 2;
    const blurDy = 24 - viewportBox.height / 2;

    const hitBox = await hit.boundingBox();
    expect(hitBox).toBeTruthy();
    await dispatchSyntheticPointer(hit, 'pointerdown', hitBox);
    await dispatchSyntheticPointer(hit, 'pointerup', hitBox);
    await expect(memo).toHaveAttribute('data-memo-state', 'foreground');
    await expect(textarea).not.toBeFocused();

    await page.waitForTimeout(300);
    await textarea.tap();
    await expect(textarea).toBeFocused();
    await textarea.fill('touch edit path');
    await expect(textarea).toHaveValue('touch edit path');

    await dispatchSyntheticPointer(viewport, 'pointerdown', viewportBox, blurDx, blurDy);
    await dispatchSyntheticPointer(viewport, 'pointerup', viewportBox, blurDx, blurDy);
    await expect(textarea).not.toBeFocused();
    await expect(memo).toHaveAttribute('data-memo-state', 'foreground');

    await dispatchSyntheticPointer(viewport, 'pointerdown', viewportBox, blurDx, blurDy);
    await dispatchSyntheticPointer(viewport, 'pointerup', viewportBox, blurDx, blurDy);
    await expect(memo).toHaveAttribute('data-memo-state', /returning|floating/);
  });

  test('uses touch slop for dragging and does not hijack foreground textarea touches', async ({ page }) => {
    await page.goto('/index.html?memoLab=1');

    const backgroundMemo = page.locator('[data-memo-id="memo-04-4"]');
    const backgroundHit = backgroundMemo.locator('.memo-field-lab__memo-hit');
    const backgroundBox = await backgroundHit.boundingBox();
    expect(backgroundBox).toBeTruthy();

    await dispatchSyntheticPointer(backgroundHit, 'pointerdown', backgroundBox);
    await dispatchSyntheticPointer(backgroundHit, 'pointermove', backgroundBox, 4, 3);
    await page.waitForTimeout(40);
    await expect(backgroundMemo).not.toHaveAttribute('data-memo-state', 'dragging');

    await dispatchSyntheticPointer(backgroundHit, 'pointermove', backgroundBox, 32, -28);
    await expect(backgroundMemo).toHaveAttribute('data-memo-state', 'dragging');
    await dispatchSyntheticPointer(backgroundHit, 'pointerup', backgroundBox, 32, -28);
    await page.waitForTimeout(80);
    await expect(backgroundMemo).not.toHaveAttribute('data-memo-state', 'dragging');

    await dispatchSyntheticPointer(backgroundHit, 'pointerdown', backgroundBox);
    await dispatchSyntheticPointer(backgroundHit, 'pointerup', backgroundBox);
    await expect(backgroundMemo).toHaveAttribute('data-memo-state', 'foreground');

    const foregroundMemo = backgroundMemo;
    const foregroundText = foregroundMemo.locator('.memo-field-lab__memo-text');
    await foregroundText.evaluate((element) => element.focus());
    await expect(foregroundText).toBeFocused();

    const textBox = await foregroundText.boundingBox();
    expect(textBox).toBeTruthy();
    await dispatchSyntheticPointer(foregroundText, 'pointerdown', textBox);
    await dispatchSyntheticPointer(foregroundText, 'pointermove', textBox, 42, 0);
    await page.waitForTimeout(40);
    await expect(foregroundMemo).toHaveAttribute('data-memo-state', 'foreground');
    await dispatchSyntheticPointer(foregroundText, 'pointerup', textBox, 42, 0);
    await expect(foregroundMemo).toHaveAttribute('data-memo-state', 'foreground');
  });

  test('shifts the active memo upward when visualViewport reports keyboard inset', async ({ page }) => {
    await page.addInitScript(() => {
      const listeners = new Map();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        offsetLeft: 0,
        offsetTop: 0,
        pageLeft: 0,
        pageTop: 0,
        scale: 1,
        addEventListener(type, callback) {
          if (!listeners.has(type)) listeners.set(type, new Set());
          listeners.get(type).add(callback);
        },
        removeEventListener(type, callback) {
          if (!listeners.has(type)) return;
          listeners.get(type).delete(callback);
        },
        __set(values) {
          Object.assign(this, values);
          ['resize', 'scroll'].forEach((type) => {
            if (!listeners.has(type)) return;
            listeners.get(type).forEach((callback) => callback({ type }));
          });
        },
      };

      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        enumerable: true,
        value: viewport,
      });
    });

    await page.goto('/index.html?memoLab=1');

    const memo = page.locator('[data-memo-id="memo-01-1"]');
    const textarea = memo.locator('.memo-field-lab__memo-text');
    const viewport = page.locator('#memo-field-lab-viewport');

    await page.waitForTimeout(300);
    await textarea.tap();
    await expect(textarea).toBeFocused();

    const initialY = await getMemoTranslateY(memo);
    expect(initialY).not.toBeNull();

    await page.evaluate(() => {
      window.visualViewport.__set({
        height: Math.max(240, window.innerHeight - 620),
        offsetTop: 0,
      });
    });

    await page.waitForFunction(({ selector, before }) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const match = element.style.transform.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px,\s*([-\d.]+)px\)/);
      return !!match && parseFloat(match[2]) < before - 40;
    }, { selector: '[data-memo-id="memo-01-1"]', before: initialY });

    const liftedY = await getMemoTranslateY(memo);
    expect(liftedY).toBeLessThan(initialY - 40);

    await viewport.tap({ position: { x: 24, y: 24 } });
    await page.evaluate(() => {
      window.visualViewport.__set({
        height: window.innerHeight,
        offsetTop: 0,
      });
    });

    await page.waitForFunction(({ selector, lifted }) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const match = element.style.transform.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px,\s*([-\d.]+)px\)/);
      return !!match && parseFloat(match[2]) > lifted + 20;
    }, { selector: '[data-memo-id="memo-01-1"]', lifted: liftedY });
  });
});
