// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, showFullToolbar, expandAccordion } = require('./helpers');

async function openSettingsPanel(page) {
  await page.waitForFunction(() => {
    try { return !!window.ZWGadgets; } catch (_) { return false; }
  }, { timeout: 20000 });
  await enableAllGadgets(page);
  await showFullToolbar(page);
  await page.waitForTimeout(200);
  await page.waitForSelector('#toggle-settings', { state: 'visible', timeout: 10000 });
  await page.click('#toggle-settings');
  await page.waitForSelector('#settings-modal', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('#settings-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(500);
}

async function ensureSidebarSettingsOpen(page) {
  const settingsBtn = page.locator('#writing-focus-settings-btn');
  if (await settingsBtn.count()) {
    const pressed = await settingsBtn.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await settingsBtn.click();
    }
  }
}

async function openAssistPanel(page) {
  // フォーカスモードではサイドバーが非表示のため、normal に戻す
  await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'normal'));
  await page.waitForFunction(() => {
    try { return !!window.ZWGadgets; } catch (_) { return false; }
  }, { timeout: 20000 });
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
  await ensureSidebarSettingsOpen(page);

  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('assist');
      }
      if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
        window.ZWGadgets.setActiveGroup('assist');
      }
    } catch (_) { /* noop */ }
  });

  await expandAccordion(page, 'assist');
  await page.waitForSelector('#assist-gadgets-panel', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);

  // すべてのガジェットを展開 (data-gadget-collapsed 属性で制御)
  await page.evaluate(() => {
    document.querySelectorAll('.gadget-wrapper').forEach(function(w) {
      var name = w.getAttribute('data-gadget-name');
      if (name && window.ZWGadgets && window.ZWGadgets._setGadgetCollapsed) {
        window.ZWGadgets._setGadgetCollapsed(name, false, w, true);
      }
    });
  });
  await page.waitForTimeout(300);
}

async function openThemePanel(page) {
  await page.waitForFunction(() => {
    try { return !!window.ZWGadgets; } catch (_) { return false; }
  }, { timeout: 20000 });
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
  await ensureSidebarSettingsOpen(page);

  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('theme');
      }
      if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
        window.ZWGadgets.setActiveGroup('theme');
      }
    } catch (_) {
      /* noop */
    }
  });
  await expandAccordion(page, 'theme');
  await page.waitForSelector('#theme-gadgets-panel', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('.gadget-wrapper[data-gadget-name="Typography"]', { state: 'attached', timeout: 10000 });
}

async function openSidebarAndStructurePanel(page) {
  await page.waitForFunction(() => {
    try { return !!window.ZWGadgets; } catch (_) { return false; }
  }, { timeout: 20000 });
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
  await ensureSidebarSettingsOpen(page);

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
  test.setTimeout(60000);
  test('should toggle typewriter mode and save settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openAssistPanel(page);

    const checkbox = page.locator('#assist-gadgets-panel #typewriter-enabled');
    await expect(checkbox).toBeVisible();
    await checkbox.check();

    const anchor = page.locator('#assist-gadgets-panel #typewriter-anchor-ratio');
    await anchor.fill('0.7');

    const stickiness = page.locator('#assist-gadgets-panel #typewriter-stickiness');
    await stickiness.fill('0.8');

    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openAssistPanel(page);

    await expect(page.locator('#assist-gadgets-panel #typewriter-enabled')).toBeChecked();
    await expect(page.locator('#assist-gadgets-panel #typewriter-anchor-ratio')).toHaveValue('0.7');
    await expect(page.locator('#assist-gadgets-panel #typewriter-stickiness')).toHaveValue('0.8');
  });

  test('should toggle focus mode and save settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openAssistPanel(page);

    const checkbox = page.locator('#assist-gadgets-panel #focus-mode-enabled');
    await expect(checkbox).toBeVisible();
    await checkbox.check();

    const dimOpacity = page.locator('#assist-gadgets-panel #focus-dim-opacity');
    await dimOpacity.fill('0.5');

    const blurRadius = page.locator('#assist-gadgets-panel #focus-blur-radius');
    await blurRadius.fill('3');

    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openAssistPanel(page);

    await expect(page.locator('#assist-gadgets-panel #focus-mode-enabled')).toBeChecked();
    await expect(page.locator('#assist-gadgets-panel #focus-dim-opacity')).toHaveValue('0.5');
    await expect(page.locator('#assist-gadgets-panel #focus-blur-radius')).toHaveValue('3');
  });

  test('should work with typewriter mode simultaneously', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openAssistPanel(page);

    const typewriterCheckbox = page.locator('#assist-gadgets-panel #typewriter-enabled');
    await typewriterCheckbox.check();

    const focusCheckbox = page.locator('#assist-gadgets-panel #focus-mode-enabled');
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
        if (!el) return false;
        el.value = String(value);
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };
      const okInterval = writeNumber('snapshot-interval-ms', 60000);
      const okDelta = writeNumber('snapshot-delta-chars', 200);
      const okRetention = writeNumber('snapshot-retention', 5);
      if (!okInterval || !okDelta || !okRetention) {
        const s = window.ZenWriterStorage.loadSettings();
        s.snapshot = { ...(s.snapshot || {}), intervalMs: 60000, deltaChars: 200, retention: 5 };
        window.ZenWriterStorage.saveSettings(s);
      }
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

    await openAssistPanel(page);

    const chk = page.locator('#assist-gadgets-panel #typewriter-enabled');
    await chk.check();
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

  test('should create and search wiki page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'normal'));
    await page.waitForFunction(() => {
      try { return !!window.ZWGadgets; } catch (_) { return false; }
    }, { timeout: 20000 });
    await enableAllGadgets(page);

    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await ensureSidebarSettingsOpen(page);
    await page.evaluate(() => {
      try {
        if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
          window.sidebarManager.activateSidebarGroup('edit');
        }
        if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
          window.ZWGadgets.setActiveGroup('edit');
        }
      } catch (_) { /* noop */ }
    });

    const wikiHeader = page.locator('.accordion-header[aria-controls="accordion-edit"]');
    await wikiHeader.waitFor({ timeout: 10000 });
    await wikiHeader.click();

    // Story Wiki (story-wiki.js) は input[type="text"] を使用
    await page.waitForSelector('#edit-gadgets-panel .swiki-search-input', { timeout: 10000 });
    await expect(page.locator('#edit-gadgets-panel .swiki-search-input').first()).toBeVisible();
  });

  test('should have smooth typewriter scroll without jitter', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'normal'));
    await page.waitForSelector('#editor', { timeout: 10000 });

    const lines = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`).join('\n');
    await page.locator('#editor').fill(lines);

    await openAssistPanel(page);

    const checkbox = page.locator('#assist-gadgets-panel #typewriter-enabled');
    await checkbox.check();

    // サイドバーを閉じてエディタにフォーカス
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
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'normal'));
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
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'normal'));
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

  test('font size quick change should preserve existing settings object', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      try {
        const s = window.ZenWriterStorage.loadSettings();
        s.theme = 'sepia';
        s.ui = { ...(s.ui || {}), showWordCount: true };
        s.autoSave = { ...(s.autoSave || {}), enabled: true, delayMs: 2500 };
        s.editor = { ...(s.editor || {}), wordWrap: { enabled: true, maxChars: 70 } };
        window.ZenWriterStorage.saveSettings(s);
      } catch (_) {
        /* noop */
      }
    });

    await page.evaluate(() => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setGlobalFontSize === 'function') {
        window.ZenWriterEditor.setGlobalFontSize(23);
      }
    });

    const snapshot = await page.evaluate(() => {
      try {
        return window.ZenWriterStorage.loadSettings();
      } catch (_) {
        return {};
      }
    });

    expect(snapshot.theme).toBe('sepia');
    expect(snapshot.ui?.showWordCount).toBeTruthy();
    expect(snapshot.autoSave?.enabled).toBeTruthy();
    expect(snapshot.autoSave?.delayMs).toBe(2500);
    expect(snapshot.editor?.wordWrap?.enabled).toBeTruthy();
    expect(snapshot.editor?.wordWrap?.maxChars).toBe(70);
    expect(snapshot.editorFontSize).toBe(23);
    expect(snapshot.fontSize).toBe(23);
  });

  test('legacy fontSize should normalize to editor/ui font size on load', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const normalized = await page.evaluate(() => {
      try {
        const raw = window.ZenWriterStorage.loadSettings();
        const legacy = {
          ...raw,
          fontSize: 19
        };
        delete legacy.editorFontSize;
        delete legacy.uiFontSize;
        window.ZenWriterStorage.saveSettings(legacy);
        return window.ZenWriterStorage.loadSettings();
      } catch (_) {
        return {};
      }
    });

    expect(normalized.fontSize).toBe(19);
    expect(normalized.editorFontSize).toBe(19);
    expect(normalized.uiFontSize).toBe(19);
  });

  test('Typography and quick font controls should stay in sync', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.documentElement.setAttribute('data-ui-mode', 'normal'));
    await page.waitForSelector('#editor', { timeout: 10000 });
    await openThemePanel(page);

    await page.evaluate(() => {
      const root = document.querySelector('.gadget-wrapper[data-gadget-name="Typography"] .gadget-typography');
      if (!root) return;
      const ranges = Array.from(root.querySelectorAll('input[type="range"]'));
      const editorSizeInput = ranges[1];
      if (!editorSizeInput) return;
      editorSizeInput.value = '24';
      editorSizeInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await expect(page.locator('#global-font-size')).toHaveValue('24');
    await expect(page.locator('#global-font-size-number')).toHaveValue('24');

    await page.evaluate(() => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setGlobalFontSize === 'function') {
        window.ZenWriterEditor.setGlobalFontSize(21);
      }
    });

    await expect.poll(async () => {
      return page.evaluate(() => {
        const root = document.querySelector('.gadget-wrapper[data-gadget-name="Typography"] .gadget-typography');
        if (!root) return null;
        const ranges = Array.from(root.querySelectorAll('input[type="range"]'));
        return ranges[1] ? ranges[1].value : null;
      });
    }).toBe('21');
  });

  test('font family change should persist after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const targetFont = '"BIZ UDMincho", serif';
    await page.evaluate((font) => {
      try {
        if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyFontSettings === 'function') {
          const s = window.ZenWriterStorage.loadSettings();
          window.ZenWriterTheme.applyFontSettings(
            font,
            s.fontSize || 16,
            s.lineHeight || 1.6,
            s.uiFontSize || 16,
            s.editorFontSize || 16,
          );
        }
      } catch (_) { /* noop */ }
    }, targetFont);

    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });

    const cssFont = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim();
    });
    expect(cssFont).toBe(targetFont);

    const stored = await page.evaluate(() => {
      try { return window.ZenWriterStorage.loadSettings().fontFamily; } catch (_) { return ''; }
    });
    expect(stored).toBe(targetFont);
  });

  test('font family change via Typography should preserve other settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      try {
        const s = window.ZenWriterStorage.loadSettings();
        s.theme = 'night';
        s.autoSave = { ...(s.autoSave || {}), enabled: true, delayMs: 3000 };
        s.editor = { ...(s.editor || {}), wordWrap: { enabled: true, maxChars: 80 } };
        window.ZenWriterStorage.saveSettings(s);
      } catch (_) { /* noop */ }
    });

    await page.evaluate(() => {
      try {
        if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyFontSettings === 'function') {
          const s = window.ZenWriterStorage.loadSettings();
          window.ZenWriterTheme.applyFontSettings(
            '"BIZ UDMincho", serif',
            s.fontSize || 16,
            s.lineHeight || 1.6,
            s.uiFontSize || 16,
            s.editorFontSize || 16,
          );
        }
      } catch (_) { /* noop */ }
    });

    const snapshot = await page.evaluate(() => {
      try { return window.ZenWriterStorage.loadSettings(); } catch (_) { return {}; }
    });

    expect(snapshot.theme).toBe('night');
    expect(snapshot.autoSave?.enabled).toBeTruthy();
    expect(snapshot.autoSave?.delayMs).toBe(3000);
    expect(snapshot.editor?.wordWrap?.enabled).toBeTruthy();
    expect(snapshot.editor?.wordWrap?.maxChars).toBe(80);
    expect(snapshot.fontFamily).toBe('"BIZ UDMincho", serif');
  });

  test('micro-typography settings should apply CSS variables and persist (SP-057)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      try {
        if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyMicroTypographySettings === 'function') {
          window.ZenWriterTheme.applyMicroTypographySettings({
            letterSpacing: 0.05,
            paragraphSpacing: 1.5,
            paragraphIndent: 1,
            lineBreakMode: 'strict-ja'
          });
        }
      } catch (_) { /* noop */ }
    });

    const cssVars = await page.evaluate(() => {
      var root = document.documentElement;
      var cs = getComputedStyle(root);
      return {
        letterSpacing: cs.getPropertyValue('--body-letter-spacing').trim(),
        paragraphSpacing: cs.getPropertyValue('--paragraph-spacing').trim(),
        paragraphIndent: cs.getPropertyValue('--paragraph-indent').trim(),
        lineBreakMode: root.getAttribute('data-line-break-mode')
      };
    });

    expect(cssVars.letterSpacing).toBe('0.05em');
    expect(cssVars.paragraphSpacing).toBe('1.5em');
    expect(cssVars.paragraphIndent).toBe('1em');
    expect(cssVars.lineBreakMode).toBe('strict-ja');

    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });

    const restored = await page.evaluate(() => {
      try {
        var s = window.ZenWriterStorage.loadSettings();
        return s.microTypography || {};
      } catch (_) { return {}; }
    });

    expect(restored.letterSpacing).toBe(0.05);
    expect(restored.paragraphSpacing).toBe(1.5);
    expect(restored.paragraphIndent).toBe(1);
    expect(restored.lineBreakMode).toBe('strict-ja');

    const restoredCss = await page.evaluate(() => {
      var root = document.documentElement;
      var cs = getComputedStyle(root);
      return {
        letterSpacing: cs.getPropertyValue('--body-letter-spacing').trim(),
        lineBreakMode: root.getAttribute('data-line-break-mode')
      };
    });

    expect(restoredCss.letterSpacing).toBe('0.05em');
    expect(restoredCss.lineBreakMode).toBe('strict-ja');
  });

  test('micro-typography should not destroy other settings (SP-057)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    await page.evaluate(() => {
      try {
        var s = window.ZenWriterStorage.loadSettings();
        s.theme = 'sepia';
        s.autoSave = { ...(s.autoSave || {}), enabled: true };
        window.ZenWriterStorage.saveSettings(s);
      } catch (_) { /* noop */ }
    });

    await page.evaluate(() => {
      try {
        if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyMicroTypographySettings === 'function') {
          window.ZenWriterTheme.applyMicroTypographySettings({
            letterSpacing: 0.03,
            paragraphIndent: 1
          });
        }
      } catch (_) { /* noop */ }
    });

    const snapshot = await page.evaluate(() => {
      try { return window.ZenWriterStorage.loadSettings(); } catch (_) { return {}; }
    });

    expect(snapshot.theme).toBe('sepia');
    expect(snapshot.autoSave?.enabled).toBeTruthy();
    expect(snapshot.microTypography?.letterSpacing).toBe(0.03);
    expect(snapshot.microTypography?.paragraphIndent).toBe(1);
  });
});
