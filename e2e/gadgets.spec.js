// E2E: ガジェット機能の検証
const { test, expect } = require('@playwright/test');

const pageUrl = '/index.html';

async function waitGadgetsReady(page) {
  await page.waitForFunction(() => {
    try {
      return !!window.ZWGadgets && !!document.querySelector('#assist-gadgets-panel');
    } catch (_) { return false; }
  });
  // サイドバーを確実に開く
  const sidebar = page.locator('.sidebar');
  const toggleBtn = page.locator('#toggle-sidebar');
  if (await toggleBtn.isVisible().catch(() => false)) {
    const opened = await sidebar.evaluate((el) => el.classList.contains('open')).catch(() => false);
    if (!opened) {
      await toggleBtn.click();
      await expect(sidebar).toHaveClass(/open/);
    }
  }
  // assistタブをアクティブにしてガジェットパネルを表示
  const assistTab = page.locator('.sidebar-tab[data-group="assist"]');
  if (await assistTab.isVisible().catch(() => false)) {
    await assistTab.click();
  }
  // 初回レンダ後のガジェット要素を待機
  await page.waitForTimeout(500);
  await page.waitForSelector('#assist-gadgets-panel .gadget-wrapper', { state: 'attached' });
  return true;
}

test.describe('Gadgets E2E', () => {
  test('Clock gadget renders and respects hour24 setting', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    // ガジェットパネルと Clock の存在のみ確認（DOM構造への依存を最小化）
    await expect(page.locator('#assist-gadgets-panel')).toBeVisible();
    const clock = page.locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="Clock"]');
    await expect(clock).toBeVisible();

    const clockTextBefore = await clock.locator('.gadget-clock').innerText();
    expect(clockTextBefore).toMatch(/\d{4}-\d{2}-\d{2}/);

    // 設定API経由で 12時間表示に変更
    await page.evaluate(() => {
      try {
        if (window.ZWGadgets && typeof window.ZWGadgets.setSetting === 'function') {
          window.ZWGadgets.setSetting('Clock', 'hour24', false);
        }
      } catch (_) { /* noop */ }
    });

    // 反映待ち（tickは1秒間隔）
    await page.waitForTimeout(1200);

    // 設定の永続化確認（API ベース）
    const hour24 = await page.evaluate(() => {
      try {
        if (window.ZWGadgets && typeof window.ZWGadgets.getSettings === 'function') {
          const s = window.ZWGadgets.getSettings('Clock') || {};
          return !!s.hour24;
        }
      } catch (_) { /* noop */ }
      return true;
    });
    expect(hour24).toBe(false);

    // 見た目上も 12H になっている目安（AM/PM を含む）
    await expect(clock.locator('.gadget-clock')).toHaveText(/AM|PM/);
  });

  test('EditorLayout gadget factory creates basic controls', async ({ page }) => {
    await page.goto(pageUrl);
    await page.waitForSelector('#editor', { timeout: 10000 });

    const info = await page.evaluate(() => {
      try {
        const result = {
          registered: false,
          hasMaxWidthInput: false,
          hasPaddingInput: false,
          hasMarginBgInput: false,
          hasApplyButton: false,
        };

        const g = window.ZWGadgets;
        if (!g || !Array.isArray(g._list)) return result;

        let entry = null;
        for (let i = 0; i < g._list.length; i++) {
          const e = g._list[i];
          if (e && e.name === 'EditorLayout') {
            entry = e;
            break;
          }
        }
        if (!entry || typeof entry.factory !== 'function') return result;

        result.registered = true;

        const root = document.createElement('div');
        entry.factory(root, {
          get: function () { return null; },
          set: function () { },
        });

        const inputs = Array.prototype.slice.call(root.querySelectorAll('input'));
        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];
          if (input.type === 'number') {
            if (!result.hasMaxWidthInput) {
              result.hasMaxWidthInput = true;
            } else {
              result.hasPaddingInput = true;
            }
          }
          if (input.type === 'color') {
            result.hasMarginBgInput = true;
          }
        }

        const buttons = Array.prototype.slice.call(root.querySelectorAll('button'));
        for (let j = 0; j < buttons.length; j++) {
          const text = (buttons[j].textContent || '').trim();
          if (text === '適用') {
            result.hasApplyButton = true;
            break;
          }
        }

        return result;
      } catch (_) {
        return {
          registered: false,
          hasMaxWidthInput: false,
          hasPaddingInput: false,
          hasMarginBgInput: false,
          hasApplyButton: false,
        };
      }
    });

    expect(info.registered).toBeTruthy();
    expect(info.hasMaxWidthInput).toBeTruthy();
    expect(info.hasPaddingInput).toBeTruthy();
    expect(info.hasMarginBgInput).toBeTruthy();
    expect(info.hasApplyButton).toBeTruthy();
  });

  test('Gadget drag and drop to different tab', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    // ガジェットパネルが表示されていることを確認
    await expect(page.locator('#assist-gadgets-panel')).toBeVisible();

    // ガジェットラッパーが存在し、draggable属性が設定されていることを確認
    const gadgetWrapper = page.locator('#assist-gadgets-panel .gadget-wrapper').first();
    await expect(gadgetWrapper).toBeVisible();
    
    const draggable = await gadgetWrapper.getAttribute('draggable');
    expect(draggable).toBe('true');

    // ガジェット名を取得
    const gadgetName = await gadgetWrapper.getAttribute('data-gadget-name');
    expect(gadgetName).toBeTruthy();

    // structureタブを開く
    const structureTab = page.locator('.sidebar-tab[data-group="structure"]');
    await structureTab.click();
    await page.waitForTimeout(300);

    // structureパネルが表示されていることを確認
    const structurePanel = page.locator('#structure-gadgets-panel');
    await expect(structurePanel).toBeVisible();

    // ガジェットをassistパネルからstructureパネルにドラッグ&ドロップ
    await gadgetWrapper.dragTo(structurePanel);

    // ドロップ後にstructureパネルにガジェットが表示されることを確認
    await page.waitForTimeout(500);
    const movedGadget = structurePanel.locator(`.gadget-wrapper[data-gadget-name="${gadgetName}"]`);
    await expect(movedGadget).toBeVisible({ timeout: 2000 });

    // ロードアウトが更新されていることを確認
    const loadoutUpdated = await page.evaluate((name) => {
      try {
        if (window.ZWGadgets && typeof window.ZWGadgets.getActiveLoadout === 'function') {
          const loadout = window.ZWGadgets.getActiveLoadout();
          if (loadout && loadout.entry && loadout.entry.groups) {
            const structureGroup = loadout.entry.groups.structure || [];
            return structureGroup.indexOf(name) >= 0;
          }
        }
      } catch (_) { }
      return false;
    }, gadgetName);
    expect(loadoutUpdated).toBeTruthy();
  });

  test('Gadget drag visual feedback', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    const gadgetWrapper = page.locator('#assist-gadgets-panel .gadget-wrapper').first();
    await expect(gadgetWrapper).toBeVisible();

    const gadget = gadgetWrapper.locator('.gadget');
    await expect(gadget).toBeVisible();

    // ドラッグ開始
    await gadgetWrapper.hover();
    await page.mouse.down();
    await page.mouse.move(10, 10);

    // ドラッグ中のスタイルが適用されていることを確認
    await expect(gadget).toHaveClass(/is-dragging/);

    // ドラッグ終了
    await page.mouse.up();

    // ドラッグ中のスタイルが解除されていることを確認
    await page.waitForTimeout(100);
    const hasDraggingClass = await gadget.evaluate((el) => el.classList.contains('is-dragging'));
    expect(hasDraggingClass).toBeFalsy();
  });

  test('Panel drop zone visual feedback', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    const structureTab = page.locator('.sidebar-tab[data-group="structure"]');
    await structureTab.click();
    await page.waitForTimeout(300);

    const structurePanel = page.locator('#structure-gadgets-panel');
    await expect(structurePanel).toBeVisible();

    const gadgetWrapper = page.locator('#assist-gadgets-panel .gadget-wrapper').first();
    await expect(gadgetWrapper).toBeVisible();

    // ドラッグ開始
    const box = await gadgetWrapper.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
    }

    // structureパネルの上に移動
    const panelBox = await structurePanel.boundingBox();
    if (panelBox) {
      await page.mouse.move(panelBox.x + panelBox.width / 2, panelBox.y + panelBox.height / 2);
      
      // ドロップゾーンのハイライトが表示されていることを確認
      await expect(structurePanel).toHaveClass(/drag-over-tab/);
    }

    // ドラッグ終了
    await page.mouse.up();

    // ハイライトが解除されていることを確認
    await page.waitForTimeout(100);
    const hasDragOverClass = await structurePanel.evaluate((el) => el.classList.contains('drag-over-tab'));
    expect(hasDragOverClass).toBeFalsy();
  });
});
