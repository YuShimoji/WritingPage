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
});
