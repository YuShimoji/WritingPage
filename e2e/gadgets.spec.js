const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup, showFullToolbar, disableWritingFocus, ensureNormalMode } = require('./helpers');

const pageUrl = '/index.html';

async function waitGadgetsReady(page) {
  await page.waitForFunction(() => {
    try {
      return !!window.ZWGadgets && !!document.querySelector('#structure-gadgets-panel');
    } catch (_) {
      return false;
    }
  }, { timeout: 20000 });
  await enableAllGadgets(page);
  await showFullToolbar(page);
  // 執筆集中IAモードを解除し全カテゴリを表示 + structure展開を強制
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-writing-sidebar-focus', 'false');
    // structure カテゴリと gadgets-panel を確実に表示
    var cat = document.querySelector('.accordion-category[data-category="structure"]');
    if (cat) cat.style.display = '';
    var panel = document.getElementById('structure-gadgets-panel');
    if (panel) panel.style.display = '';
  });
  await openSidebarGroup(page, 'structure');
  await page.evaluate(() => {
    if (window.sidebarManager && typeof window.sidebarManager._setAccordionState === 'function') {
      window.sidebarManager._setAccordionState('structure', true);
    }
    var header = document.querySelector('.accordion-header[aria-controls="accordion-structure"]');
    var content = document.getElementById('accordion-structure');
    if (header) header.setAttribute('aria-expanded', 'true');
    if (content) {
      content.hidden = false;
      content.style.display = '';
      content.style.maxHeight = '';
      content.setAttribute('aria-hidden', 'false');
    }
  });
  await page.waitForTimeout(200);
  await page.waitForSelector('#structure-gadgets-panel .gadget-wrapper', {
    state: 'visible',
    timeout: 10000,
  });
}


test.describe('Gadgets E2E', () => {
  test.setTimeout(60000);
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

  test('Gadget wrappers expose dedicated drag handle semantics', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    const wrapper = page.locator('#structure-gadgets-panel .gadget-wrapper').first();
    await expect(wrapper).toBeVisible();
    await expect(wrapper).not.toHaveAttribute('draggable', 'true');
    await expect(wrapper).toHaveAttribute('role', 'group');
    await expect(wrapper).toHaveAttribute('data-gadget-name');

    const handle = wrapper.locator('.gadget-drag-handle');
    await expect(handle).toBeVisible();
    await expect(handle).toHaveAttribute('draggable', 'true');
    await expect(handle).toHaveAttribute('aria-label', /移動/);
  });

  test('Gadget range controls do not start gadget dragging', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);
    await openSidebarGroup(page, 'theme');

    const state = await page.evaluate(() => {
      var range = document.querySelector('#theme-gadgets-panel .gadget-wrapper input[type="range"]');
      if (!range) {
        range = document.querySelector('.gadget-wrapper input[type="range"]');
      }
      var wrapper = range ? range.closest('.gadget-wrapper') : null;
      var gadget = wrapper ? wrapper.querySelector('.gadget') : null;
      var handle = wrapper ? wrapper.querySelector('.gadget-drag-handle') : null;
      if (!range || !wrapper || !gadget || !handle) {
        return { hasRange: !!range, hasWrapper: !!wrapper, hasGadget: !!gadget, hasHandle: !!handle };
      }

      var rangeTransfer = new DataTransfer();
      range.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: rangeTransfer }));
      var rangeStartedDrag = gadget.classList.contains('is-dragging');

      var handleTransfer = new DataTransfer();
      handle.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: handleTransfer }));
      var handleStartedDrag = gadget.classList.contains('is-dragging');
      handle.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: handleTransfer }));
      var dragCleared = !gadget.classList.contains('is-dragging');

      return {
        hasRange: true,
        hasWrapper: true,
        hasGadget: true,
        hasHandle: true,
        rangeStartedDrag,
        handleStartedDrag,
        dragCleared
      };
    });

    expect(state.hasRange).toBeTruthy();
    expect(state.hasHandle).toBeTruthy();
    expect(state.rangeStartedDrag).toBeFalsy();
    expect(state.handleStartedDrag).toBeTruthy();
    expect(state.dragCleared).toBeTruthy();
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

  test('assist ガジェットは初回（折りたたみ状態未保存）で defaultCollapsed どおり閉じる', async ({ page }) => {
    await page.goto(pageUrl);
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.evaluate(() => {
      try {
        localStorage.removeItem('zenwriter-gadget-collapsed');
      } catch (_) {}
    });
    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });
    await enableAllGadgets(page, { expandAllGadgets: false });
    await showFullToolbar(page);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-writing-sidebar-focus', 'false');
    });
    await openSidebarGroup(page, 'assist');
    await page.waitForSelector('#assist-gadgets-panel .gadget-wrapper', {
      state: 'visible',
      timeout: 15000,
    });

    const assistCollapsedNames = await page.evaluate(() => {
      var list = window.ZWGadgets && window.ZWGadgets._list ? window.ZWGadgets._list : [];
      return list
        .filter(function (e) {
          return e && e.groups && e.groups.indexOf('assist') >= 0 && e.defaultCollapsed === true;
        })
        .map(function (e) {
          return e.name;
        });
    });
    expect(assistCollapsedNames.length).toBeGreaterThan(0);

    for (const name of assistCollapsedNames) {
      const wrap = page.locator(`#assist-gadgets-panel .gadget-wrapper[data-gadget-name="${name}"]`);
      await expect(wrap).toHaveCount(1);
      await expect(wrap).toHaveAttribute('data-gadget-collapsed', 'true');
    }
  });
});

// ---------------------------------------------------------------------------
// TASK_048 Phase 2: ガジェット切り離し・復帰フロー
// (元 gadget-detach-restore.spec.js を統合)
// ---------------------------------------------------------------------------
test.describe('Gadget Detach/Restore Flow (TASK_048)', () => {
  test.setTimeout(60000);

  async function waitDetachReady(page) {
    await ensureNormalMode(page);
    await page.waitForFunction(() => {
      try {
        return !!window.ZWGadgets && !!document.querySelector('#structure-gadgets-panel');
      } catch (_) {
        return false;
      }
    }, { timeout: 15000 });
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'structure');
    await page.waitForSelector('#structure-gadgets-panel .gadget-wrapper', {
      state: 'visible',
      timeout: 10000,
    });
  }

  test('gadget wrapper has detach button', async ({ page }) => {
    await page.goto(pageUrl);
    await waitDetachReady(page);

    const wrapper = page.locator('#structure-gadgets-panel .gadget-wrapper').first();
    await expect(wrapper).toBeVisible();

    const detachBtn = wrapper.locator('.gadget-detach-btn');
    await expect(detachBtn).toBeVisible();
    await expect(detachBtn).toHaveAttribute('aria-label', 'ガジェットを切り離す');
  });

  test('detachGadget API exists on ZWGadgets', async ({ page }) => {
    await page.goto(pageUrl);
    await ensureNormalMode(page);
    await disableWritingFocus(page);
    await page.waitForSelector('#structure-gadgets-panel', { state: 'attached', timeout: 10000 });

    const hasDetach = await page.evaluate(() => {
      return typeof window.ZWGadgets?.detachGadget === 'function';
    });
    expect(hasDetach).toBeTruthy();
  });

  test('restoreGadget API exists on ZWGadgets', async ({ page }) => {
    await page.goto(pageUrl);
    await ensureNormalMode(page);
    await disableWritingFocus(page);
    await page.waitForSelector('#structure-gadgets-panel', { state: 'attached', timeout: 10000 });

    const hasRestore = await page.evaluate(() => {
      return typeof window.ZWGadgets?.restoreGadget === 'function';
    });
    expect(hasRestore).toBeTruthy();
  });

  test('detachGadget creates floating panel and persists state', async ({ page }) => {
    await page.goto(pageUrl);
    await waitDetachReady(page);
    await page.waitForFunction(() => !!window.ZenWriterPanels, { timeout: 10000 });

    const gadgetName = await page.evaluate(() => {
      const wrapper = document.querySelector('#structure-gadgets-panel .gadget-wrapper');
      return wrapper ? wrapper.getAttribute('data-gadget-name') : null;
    });
    expect(gadgetName).toBeTruthy();

    const detached = await page.evaluate((name) => {
      try {
        if (window.ZWGadgets && typeof window.ZWGadgets.detachGadget === 'function') {
          window.ZWGadgets.detachGadget(name, 'structure');
          const prefs = window.ZWGadgets.getPrefs();
          return prefs.detached && prefs.detached[name] && prefs.detached[name].floating === true;
        }
        return false;
      } catch (e) {
        console.error('detach error:', e);
        return false;
      }
    }, gadgetName);

    expect(detached).toBeTruthy();

    const panelId = 'floating-gadget-' + gadgetName;
    const panelExists = await page.evaluate((id) => {
      const el = document.getElementById(id);
      return el !== null && el.style.display !== 'none';
    }, panelId);
    expect(panelExists).toBeTruthy();
  });

  test('restoreGadget clears detached state', async ({ page }) => {
    await page.goto(pageUrl);
    await waitDetachReady(page);
    await page.waitForFunction(() => !!window.ZenWriterPanels, { timeout: 10000 });

    const gadgetName = await page.evaluate(() => {
      const wrapper = document.querySelector('#structure-gadgets-panel .gadget-wrapper');
      return wrapper ? wrapper.getAttribute('data-gadget-name') : null;
    });
    expect(gadgetName).toBeTruthy();

    const restored = await page.evaluate((name) => {
      try {
        if (!window.ZWGadgets) return false;

        if (typeof window.ZWGadgets.detachGadget === 'function') {
          window.ZWGadgets.detachGadget(name, 'structure');
        }

        let prefs = window.ZWGadgets.getPrefs();
        const wasDetached = prefs.detached && prefs.detached[name];
        if (!wasDetached) return false;

        const panelId = 'floating-gadget-' + name;
        if (typeof window.ZWGadgets.restoreGadget === 'function') {
          window.ZWGadgets.restoreGadget(name, panelId);
        }

        prefs = window.ZWGadgets.getPrefs();
        const isCleared = !prefs.detached || !prefs.detached[name];
        return isCleared;
      } catch (e) {
        console.error('restore error:', e);
        return false;
      }
    }, gadgetName);

    expect(restored).toBeTruthy();
  });

  test('floating panel has restore-to-sidebar button', async ({ page }) => {
    await page.goto(pageUrl);
    await waitDetachReady(page);
    await page.waitForFunction(() => !!window.ZenWriterPanels, { timeout: 10000 });

    const gadgetName = await page.evaluate(() => {
      const wrapper = document.querySelector('#structure-gadgets-panel .gadget-wrapper');
      return wrapper ? wrapper.getAttribute('data-gadget-name') : null;
    });
    expect(gadgetName).toBeTruthy();

    await page.evaluate((name) => {
      if (window.ZWGadgets && typeof window.ZWGadgets.detachGadget === 'function') {
        window.ZWGadgets.detachGadget(name, 'structure');
      }
    }, gadgetName);

    const panelId = 'floating-gadget-' + gadgetName;
    const hasRestoreBtn = await page.evaluate((id) => {
      const panel = document.getElementById(id);
      if (!panel) return false;
      return panel.querySelector('.panel-restore-gadget') !== null;
    }, panelId);
    expect(hasRestoreBtn).toBeTruthy();
  });
});
