const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

const pageUrl = '/index.html';

async function waitGadgetsReady(page) {
  await page.waitForFunction(() => {
    try {
      return !!window.ZWGadgets && !!document.querySelector('#structure-gadgets-panel');
    } catch (_) {
      return false;
    }
  });
  await enableAllGadgets(page);
  await openSidebarGroup(page, 'structure');
  await page.waitForSelector('#structure-gadgets-panel .gadget-wrapper', {
    state: 'visible',
    timeout: 10000,
  });
}

async function openSettingsModal(page) {
  await page.click('#toggle-settings');
  await expect(page.locator('#settings-modal')).toBeVisible();
  await expect(page.locator('#settings-gadgets-panel')).toBeVisible();
}

test.describe('Gadgets E2E', () => {
  test('Clock gadget renders in settings modal and respects hour24 setting', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);
    await openSettingsModal(page);

    const clock = page.locator('#settings-gadgets-panel .gadget-wrapper[data-gadget-name="Clock"]');
    await expect(clock).toBeVisible();

    await page.evaluate(() => {
      if (window.ZWGadgets && typeof window.ZWGadgets.setSetting === 'function') {
        window.ZWGadgets.setSetting('Clock', 'hour24', false);
      }
    });

    await page.waitForTimeout(1200);

    const hour24 = await page.evaluate(() => {
      if (window.ZWGadgets && typeof window.ZWGadgets.getSettings === 'function') {
        const s = window.ZWGadgets.getSettings('Clock') || {};
        return !!s.hour24;
      }
      return true;
    });

    expect(hour24).toBe(false);
    await expect(clock.locator('.gadget-clock')).toHaveText(/AM|PM/);
  });

  test('EditorLayout gadget factory creates basic controls', async ({ page }) => {
    await page.goto(pageUrl);
    await page.waitForSelector('#editor', { timeout: 10000 });

    const info = await page.evaluate(() => {
      const result = {
        registered: false,
        hasMaxWidthInput: false,
        hasPaddingInput: false,
        hasMarginBgInput: false,
        hasApplyButton: false,
      };

      const g = window.ZWGadgets;
      if (!g || !Array.isArray(g._list)) return result;

      const entry = g._list.find((e) => e && e.name === 'EditorLayout');
      if (!entry || typeof entry.factory !== 'function') return result;

      result.registered = true;

      const root = document.createElement('div');
      entry.factory(root, {
        get: function () {
          return null;
        },
        set: function () {},
      });

      const inputs = Array.from(root.querySelectorAll('input'));
      inputs.forEach((input) => {
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
      });

      const buttons = Array.from(root.querySelectorAll('button'));
      result.hasApplyButton = buttons.some((b) => {
        const text = (b.textContent || '').trim();
        return text.length > 0;
      });

      return result;
    });

    expect(info.registered).toBeTruthy();
    expect(info.hasMaxWidthInput).toBeTruthy();
    expect(info.hasPaddingInput).toBeTruthy();
    expect(info.hasMarginBgInput).toBeTruthy();
    expect(info.hasApplyButton).toBeTruthy();
  });

  test('assignGroups updates gadget group definitions', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    const source = page.locator('#structure-gadgets-panel .gadget-wrapper').first();
    await expect(source).toBeVisible();
    const gadgetName = await source.getAttribute('data-gadget-name');
    expect(gadgetName).toBeTruthy();

    const updateResult = await page.evaluate((name) => {
      const list = window.ZWGadgets && Array.isArray(window.ZWGadgets._list) ? window.ZWGadgets._list : [];
      const item = list.find((g) => g && g.name === name);
      const groups = item && Array.isArray(item.groups) ? item.groups.slice() : [];
      if (!groups.includes('wiki')) groups.push('wiki');
      if (window.ZWGadgets && typeof window.ZWGadgets.assignGroups === 'function') {
        window.ZWGadgets.assignGroups(name, groups);
      }
      const updatedItem = list.find((g) => g && g.name === name);
      const updatedGroups = updatedItem && Array.isArray(updatedItem.groups) ? updatedItem.groups.slice() : [];
      return {
        hasWikiInItem: updatedGroups.includes('wiki'),
      };
    }, gadgetName);

    expect(updateResult.hasWikiInItem).toBeTruthy();
  });

  test('Gadget wrappers expose draggable semantics', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    const wrapper = page.locator('#structure-gadgets-panel .gadget-wrapper').first();
    await expect(wrapper).toBeVisible();
    await expect(wrapper).toHaveAttribute('draggable', 'true');
    await expect(wrapper).toHaveAttribute('role', 'button');
    await expect(wrapper).toHaveAttribute('data-gadget-name');
  });

  test('Panel drag-over class is added and removed by drag events', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    const panel = page.locator('#structure-gadgets-panel');
    await expect(panel).toBeVisible();

    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    await panel.dispatchEvent('dragover', { dataTransfer });
    await expect(panel).toHaveClass(/drag-over-tab/);

    await panel.dispatchEvent('dragleave', {
      dataTransfer,
      clientX: -1,
      clientY: -1,
    });
    await expect(panel).not.toHaveClass(/drag-over-tab/);
  });
});
