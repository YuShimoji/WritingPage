// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { enableAllGadgets } = require('./helpers');

async function openSettingsPanel(page) {
  await page.waitForSelector('#toggle-settings', { state: 'visible', timeout: 10000 });
  await page.click('#toggle-settings');
  await page.waitForSelector('#settings-modal', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('#settings-gadgets-panel', { state: 'visible', timeout: 10000 });
  await enableAllGadgets(page);
  await page.waitForTimeout(300);
}

async function openSidebarAndStructurePanel(page) {
  await page.waitForSelector('#sidebar', { timeout: 10000 });
  await enableAllGadgets(page);

  const isOpen = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return !!(sb && sb.classList.contains('open'));
  });

  if (!isOpen) {
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
  }

  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('structure');
      }
      if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
        window.ZWGadgets.setActiveGroup('structure');
      }
    } catch (_) {
      /* noop */
    }
  });

  await page.waitForSelector('#structure-gadgets-panel', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(300);
}

test.describe('Editor Settings', () => {
  test('should toggle typewriter mode and save settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openSettingsPanel(page);

    const checkbox = page.locator('#settings-gadgets-panel #typewriter-enabled');
    await expect(checkbox).toBeVisible();
    await checkbox.check();

    const anchor = page.locator('#typewriter-anchor-ratio');
    await anchor.fill('0.7');

    const stickiness = page.locator('#typewriter-stickiness');
    await stickiness.fill('0.8');

    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openSettingsPanel(page);

    await expect(page.locator('#settings-gadgets-panel #typewriter-enabled')).toBeChecked();
    await expect(page.locator('#settings-gadgets-panel #typewriter-anchor-ratio')).toHaveValue('0.7');
    await expect(page.locator('#settings-gadgets-panel #typewriter-stickiness')).toHaveValue('0.8');
  });

  test('should toggle focus mode and save settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openSettingsPanel(page);

    const checkbox = page.locator('#settings-gadgets-panel #focus-mode-enabled');
    await expect(checkbox).toBeVisible();
    await checkbox.check();

    const dimOpacity = page.locator('#focus-dim-opacity');
    await dimOpacity.fill('0.5');

    const blurRadius = page.locator('#focus-blur-radius');
    await blurRadius.fill('3');

    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openSettingsPanel(page);

    await expect(page.locator('#settings-gadgets-panel #focus-mode-enabled')).toBeChecked();
    await expect(page.locator('#settings-gadgets-panel #focus-dim-opacity')).toHaveValue('0.5');
    await expect(page.locator('#settings-gadgets-panel #focus-blur-radius')).toHaveValue('3');
  });

  test('should work with typewriter mode simultaneously', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openSettingsPanel(page);

    const typewriterCheckbox = page.locator('#settings-gadgets-panel #typewriter-enabled');
    await typewriterCheckbox.check();

    const focusCheckbox = page.locator('#settings-gadgets-panel #focus-mode-enabled');
    await focusCheckbox.check();

    await expect(typewriterCheckbox).toBeChecked();
    await expect(focusCheckbox).toBeChecked();
    await page.fill('#editor', 'Line 1\nLine 2\nLine 3');
    await page.waitForTimeout(500);

    await expect(typewriterCheckbox).toBeChecked();
    await expect(focusCheckbox).toBeChecked();
  });

  test('should adjust snapshot settings and save', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openSettingsPanel(page);

    await page.evaluate(() => {
      const writeNumber = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = String(value);
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      writeNumber('snapshot-interval-ms', 60000);
      writeNumber('snapshot-delta-chars', 200);
      writeNumber('snapshot-retention', 5);
    });

    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openSettingsPanel(page);
    const snapshotConfig = await page.evaluate(() => {
      try {
        const s = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
          ? window.ZenWriterStorage.loadSettings()
          : {};
        return (s && s.snapshot) || {};
      } catch (_) {
        return {};
      }
    });
    expect(snapshotConfig.intervalMs).toBe(60000);
    expect(snapshotConfig.deltaChars).toBe(200);
    expect(snapshotConfig.retention).toBe(5);
  });

  test('should switch UI presentation modes and persist', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      try {
        if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.loadSettings !== 'function') return;
        const s = window.ZenWriterStorage.loadSettings();
        s.ui = s.ui || {};
        s.ui.tabsPresentation = 'dropdown';
        window.ZenWriterStorage.saveSettings(s);

        const sb = document.getElementById('sidebar');
        if (sb) sb.setAttribute('data-tabs-presentation', 'dropdown');
        if (window.sidebarManager && typeof window.sidebarManager.applyTabsPresentationUI === 'function') {
          window.sidebarManager.applyTabsPresentationUI();
        }
      } catch (_) {
        /* noop */
      }
    });

    await expect(page.locator('#sidebar')).toHaveAttribute('data-tabs-presentation', 'dropdown');

    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });
    await expect(page.locator('#sidebar')).toHaveAttribute('data-tabs-presentation', 'dropdown');
  });

  test('should toggle typewriter gadget and affect scrolling', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page
      .locator('#editor')
      .fill('Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\n');

    await openSettingsPanel(page);

    const chk = page.locator('#settings-gadgets-panel #typewriter-enabled');
    await chk.check();
    await page.click('#close-settings-modal');
    await page.waitForTimeout(200);

    await page.locator('#editor').click();
    await page.keyboard.press('End');
    await page.waitForTimeout(200);
  });

  test('should create manual snapshot in Snapshot Manager', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const beforeCount = await page.evaluate(() => {
      try {
        localStorage.removeItem('zenWriter_snapshots');
        if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.loadSnapshots !== 'function') return 0;
        return (window.ZenWriterStorage.loadSnapshots() || []).length;
      } catch (_) {
        return 0;
      }
    });

    await page.locator('#editor').fill('Test content for snapshot');

    await page.evaluate(() => {
      try {
        if (window.ZenWriterAPI && typeof window.ZenWriterAPI.takeSnapshot === 'function') {
          window.ZenWriterAPI.takeSnapshot();
        } else if (window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
          const el = document.getElementById('editor');
          const content = el ? el.value || '' : '';
          window.ZenWriterStorage.addSnapshot(content);
        }
      } catch (_) {
        /* noop */
      }
    });

    const afterCount = await page.evaluate(() => {
      try {
        if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.loadSnapshots !== 'function') return 0;
        return (window.ZenWriterStorage.loadSnapshots() || []).length;
      } catch (_) {
        return 0;
      }
    });

    expect(afterCount).toBeGreaterThan(beforeCount);
  });

  test('should add node graph gadget elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const info = await page.evaluate(() => {
      try {
        const apiResult = {
          registered: false,
          hasToolbar: false,
          hasViewport: false,
          buttonCount: 0,
        };

        const g = window.ZWGadgets;
        if (!g || !Array.isArray(g._list)) return apiResult;

        const entry = g._list.find((e) => e && e.name === 'NodeGraph');
        if (!entry || typeof entry.factory !== 'function') return apiResult;

        apiResult.registered = true;
        const root = document.createElement('div');
        entry.factory(root, {
          get() {
            return null;
          },
          set() {},
        });

        apiResult.hasToolbar = !!root.querySelector('.ng-toolbar');
        apiResult.hasViewport = !!root.querySelector('.ng-viewport');
        apiResult.buttonCount = root.querySelectorAll('button').length;
        return apiResult;
      } catch (_) {
        return {
          registered: false,
          hasToolbar: false,
          hasViewport: false,
          buttonCount: 0,
        };
      }
    });

    expect(info.registered).toBeTruthy();
    expect(info.hasToolbar).toBeTruthy();
    expect(info.hasViewport).toBeTruthy();
    expect(info.buttonCount).toBeGreaterThanOrEqual(2);
  });

  test('should create and search wiki page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');

    const wikiTab = page.locator('.sidebar-tab[data-group="wiki"]');
    await wikiTab.waitFor({ timeout: 10000 });
    await wikiTab.click();

    await page.waitForSelector('#wiki-gadgets-panel .gadget-wiki', { timeout: 10000 });
    await expect(page.locator('#wiki-gadgets-panel .gadget-wiki input[type="text"]').first()).toBeVisible();
  });

  test('should have smooth typewriter scroll without jitter', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const lines = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`).join('\n');
    await page.locator('#editor').fill(lines);

    await openSettingsPanel(page);

    const checkbox = page.locator('#settings-gadgets-panel #typewriter-enabled');
    await checkbox.check();

    await page.click('#close-settings-modal');
    await page.waitForTimeout(300);

    await page.locator('#editor').click();
    await page.keyboard.press('Home');

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);
    }

    const scrollTop = await page.locator('#editor').evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);
  });

  test('should confirm unsaved changes on document switch and auto-save', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.locator('#editor').fill('Initial content');

    const initialDocId = await page.evaluate(() => {
      try {
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.getCurrentDocId === 'function') {
          return window.ZenWriterStorage.getCurrentDocId();
        }
      } catch (_) {
        /* noop */
      }
      return null;
    });

    await openSidebarAndStructurePanel(page);

    await page.waitForSelector('#new-document-btn', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      window.__zwDialogLog = [];
      const origConfirm = window.confirm;
      const origPrompt = window.prompt;
      window.__zwRestoreDialogs = () => {
        window.confirm = origConfirm;
        window.prompt = origPrompt;
      };
      window.confirm = (msg) => {
        window.__zwDialogLog.push({ type: 'confirm', message: String(msg) });
        return true;
      };
      window.prompt = (msg, def) => {
        window.__zwDialogLog.push({ type: 'prompt', message: String(msg), defaultValue: def });
        return 'e2e-doc-2';
      };
    });

    await page.evaluate(() => {
      const btn = document.getElementById('new-document-btn');
      if (btn) btn.click();
    });

    const dialogLog = await page.evaluate(() => window.__zwDialogLog || []);
    expect(dialogLog.some((e) => e.type === 'confirm')).toBeTruthy();
    expect(dialogLog.some((e) => e.type === 'prompt')).toBeTruthy();

    await page.evaluate(() => {
      try {
        if (typeof window.__zwRestoreDialogs === 'function') window.__zwRestoreDialogs();
      } catch (_) {
        /* noop */
      }
    });

    const newDocId = await page.evaluate(() => {
      try {
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.getCurrentDocId === 'function') {
          return window.ZenWriterStorage.getCurrentDocId();
        }
      } catch (_) {
        /* noop */
      }
      return null;
    });

    if (initialDocId) {
      expect(newDocId).not.toBe(initialDocId);
      await page.evaluate((id) => {
        const select = document.getElementById('current-document');
        if (select) {
          select.value = id;
          select.dispatchEvent(new Event('change'));
        }
      }, initialDocId);
    }
  });

  test('should restore from last snapshot via button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      try {
        localStorage.removeItem('zenWriter_snapshots');
      } catch (_) {
        /* noop */
      }
    });

    const original = 'Original content for restore test';
    await page.locator('#editor').fill(original);

    await page.evaluate(() => {
      try {
        if (window.ZenWriterAPI && typeof window.ZenWriterAPI.takeSnapshot === 'function') {
          window.ZenWriterAPI.takeSnapshot();
        } else if (window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
          const el = document.getElementById('editor');
          const content = el ? el.value || '' : '';
          window.ZenWriterStorage.addSnapshot(content);
        }
      } catch (_) {
        /* noop */
      }
    });

    await page.locator('#editor').fill('Modified content for restore test');

    await openSidebarAndStructurePanel(page);
    await page.waitForSelector('#restore-from-snapshot', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      window.__zwDialogLog = [];
      const origConfirm = window.confirm;
      window.__zwRestoreDialogs = () => {
        window.confirm = origConfirm;
      };
      window.confirm = (msg) => {
        window.__zwDialogLog.push({ type: 'confirm', message: String(msg) });
        return true;
      };
    });

    await page.evaluate(() => {
      const btn = document.getElementById('restore-from-snapshot');
      if (btn) btn.click();
    });

    const dialogLog = await page.evaluate(() => window.__zwDialogLog || []);
    expect(dialogLog.some((e) => e.type === 'confirm')).toBeTruthy();

    await page.evaluate(() => {
      try {
        if (typeof window.__zwRestoreDialogs === 'function') window.__zwRestoreDialogs();
      } catch (_) {
        /* noop */
      }
    });

    await expect(page.locator('#editor')).toHaveValue(original);
  });
});
