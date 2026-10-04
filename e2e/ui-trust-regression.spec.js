const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

const fixtureName = 'ui-trust-custom';
const fixture = {
  label: 'Trust custom layout',
  groups: {
    sections: [], structure: ['Documents'], edit: [], theme: [], assist: [], advanced: []
  },
  dockLayout: {
    sidebarDock: 'left',
    leftPanel: { visible: false, width: 290, tabs: [], activeTab: 0 },
    rightPanel: { width: 350 }
  }
};

async function mountLoadoutManager(page) {
  // LoadoutManager is intentionally hidden in the default UI. Mount its real
  // factory in an isolated test surface; this does not prove a public entry path.
  await page.evaluate(() => {
    const definition = window.ZWGadgets._list.find(item => item.name === 'LoadoutManager');
    const host = document.createElement('section');
    host.id = 'ui-trust-loadout-manager';
    host.style.cssText = 'position:fixed;top:20px;left:20px;width:400px;z-index:99999;background:white;color:black;padding:16px';
    document.body.appendChild(host);
    definition.factory(host, {});
  });
  return page.locator('#ui-trust-loadout-manager');
}

async function loadSavedEntry(page, name) {
  return page.evaluate(key => window.ZWGadgetsLoadouts.loadLoadouts().entries[key] || null, name);
}

async function openPalette(page) {
  await page.keyboard.press('F2');
  await expect(page.locator('#command-palette')).toBeVisible();
  await expect(page.locator('#command-palette-input')).toBeFocused();
}

async function runPaletteCommand(page, query, id) {
  await openPalette(page);
  await page.locator('#command-palette-input').fill(query);
  await expect(page.locator(`.command-palette-item[data-command-id="${id}"]`)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page.locator('#command-palette')).not.toBeVisible();
}

test.describe('UI trust regressions', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();
  });

  test('isolated hidden LoadoutManager duplicate preserves selected custom groups and dock layout after reload', async ({ page }) => {
    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });
    await page.evaluate(({ name, config }) => window.ZWGadgets.defineLoadout(name, config), { name: fixtureName, config: fixture });
    const manager = await mountLoadoutManager(page);
    await manager.locator('#loadout-select').selectOption(fixtureName);
    await expect(manager.locator('#loadout-name')).toHaveValue(fixture.label);
    await manager.locator('#loadout-duplicate').click();

    const duplicateName = await manager.locator('#loadout-select').inputValue();
    expect(duplicateName).not.toBe(fixtureName);
    expect(dialogs).toContain('ロードアウトを複製しました');
    const duplicateLabel = `${fixture.label} (複製)`;
    await expect(manager.locator('#loadout-select option:checked')).toHaveText(duplicateLabel);
    expect(await loadSavedEntry(page, duplicateName)).toEqual({ ...fixture, label: duplicateLabel });
    expect(await loadSavedEntry(page, fixtureName)).toEqual(fixture);

    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(await loadSavedEntry(page, duplicateName)).toEqual({ ...fixture, label: duplicateLabel });
    expect(await loadSavedEntry(page, fixtureName)).toEqual(fixture);
    const restoredManager = await mountLoadoutManager(page);
    await restoredManager.locator('#loadout-select').selectOption(duplicateName);
    await expect(restoredManager.locator('#loadout-name')).toHaveValue(duplicateLabel);
  });

  test('isolated hidden LoadoutManager delete honors cancel and removes the saved custom entry after confirmation and reload', async ({ page }) => {
    let confirmDeletion = false;
    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push({ type: dialog.type(), message: dialog.message() });
      if (dialog.type() === 'confirm' && !confirmDeletion) await dialog.dismiss();
      else await dialog.accept();
    });
    await page.evaluate(({ name, config }) => window.ZWGadgets.defineLoadout(name, config), { name: fixtureName, config: fixture });
    const manager = await mountLoadoutManager(page);
    await manager.locator('#loadout-select').selectOption(fixtureName);
    await manager.locator('#loadout-delete').click();
    expect(await loadSavedEntry(page, fixtureName)).toEqual(fixture);
    expect(dialogs.map(dialog => dialog.type)).toEqual(['confirm']);

    confirmDeletion = true;
    await manager.locator('#loadout-delete').click();
    expect(dialogs.map(dialog => dialog.type)).toEqual(['confirm', 'confirm', 'alert']);
    expect(dialogs[2].message).toBe('ロードアウトを削除しました');
    await expect(manager.locator(`option[value="${fixtureName}"]`)).toHaveCount(0);
    expect(await loadSavedEntry(page, fixtureName)).toBeNull();

    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(await loadSavedEntry(page, fixtureName)).toBeNull();
    const restoredManager = await mountLoadoutManager(page);
    await expect(restoredManager.locator(`option[value="${fixtureName}"]`)).toHaveCount(0);
  });

  test('notification OFF keeps local automatic saving and cockpit wording truthful after reload', async ({ page }) => {
    const draft = '通知を止めても、この本文は端末に自動保存される。';
    await page.evaluate(() => {
      const settings = window.ZenWriterStorage.loadSettings();
      settings.autoSave = { ...settings.autoSave, enabled: false };
      window.ZenWriterStorage.saveSettings(settings);
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
    await page.locator('#wysiwyg-editor').fill(draft);
    // No manual save: wait for the durable current-document content before reload.
    await expect.poll(() => page.evaluate(() => {
      const storage = window.ZenWriterStorage;
      const current = storage.loadDocuments().find(doc => doc.id === storage.getCurrentDocId());
      return current && current.content;
    })).toContain(draft);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#wysiwyg-editor')).toContainText(draft);
    expect(await page.evaluate(() => window.ZenWriterStorage.loadSettings().autoSave.enabled)).toBe(false);

    await runPaletteCommand(page, 'Design Cockpit', 'design-cockpit');
    await expect(page.locator('#design-cockpit-autosave')).toContainText('ON');
    await expect(page.locator('#design-cockpit-autosave')).toContainText('この端末');
    await expect(page.locator('#design-cockpit-autosave-notification')).toHaveText('OFF');
    await expect(page.locator('#design-cockpit-summary')).toContainText('autosave=on');
    await expect(page.locator('#design-cockpit-summary')).toContainText('autosave_notification=off');
    await expect(page.locator('#design-cockpit-summary')).not.toContainText(draft);
  });

  test('UISettings notification checkbox OFF preserves automatic saving and explains the setting after reload', async ({ page }) => {
    const draft = '設定欄で通知を切っても、書いた本文は自動保存される。';
    const settingsGadget = page.locator('#advanced-gadgets-panel .gadget-wrapper[data-gadget-name="UISettings"]');
    const notificationCheckbox = settingsGadget.locator('#auto-save-enabled');
    async function openUISettings() {
      // Use the default advanced category and its real gadget header, without a
      // factory mount or a test-only loadout that changes the available controls.
      await openPalette(page);
      await page.locator('#command-palette-input').fill('advanced');
      await page.locator('.command-palette-item[data-command-id="gadget-advanced"]').click();
      await expect(page.locator('#command-palette')).not.toBeVisible();
      await expect(settingsGadget).toBeVisible();
      const header = settingsGadget.locator('.gadget-header');
      if (await header.getAttribute('aria-expanded') !== 'true') await header.click();
      await expect(notificationCheckbox).toBeVisible();
    }

    await openUISettings();
    await expect(notificationCheckbox).toBeChecked();
    await notificationCheckbox.uncheck();
    expect(await page.evaluate(() => window.ZenWriterStorage.loadSettings().autoSave.enabled)).toBe(false);
    await page.locator('#wysiwyg-editor').fill(draft);
    await expect.poll(() => page.evaluate(() => {
      const storage = window.ZenWriterStorage;
      const current = storage.loadDocuments().find(doc => doc.id === storage.getCurrentDocId());
      return current && current.content;
    })).toContain(draft);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#wysiwyg-editor')).toContainText(draft);
    expect(await page.evaluate(() => window.ZenWriterStorage.loadSettings().autoSave.enabled)).toBe(false);
    await openUISettings();
    await expect(notificationCheckbox).not.toBeChecked();
    await expect(notificationCheckbox).toHaveAccessibleName('自動保存の通知');
    await expect(settingsGadget).toContainText('通知をOFFにしても、本文はこの端末に自動保存されます。');
  });

  for (const readerOpen of [false, true]) {
    test(`F2 and Enter keep focus inside opened Cockpit (Reader ${readerOpen ? 'open' : 'closed'})`, async ({ page }) => {
      if (readerOpen) await runPaletteCommand(page, 'Reader を開く', 'reader-overlay-toggle');
      await runPaletteCommand(page, 'Design Cockpit', 'design-cockpit');
      await expect(page.locator('#design-cockpit')).toBeVisible();
      await expect(page.locator('#design-cockpit-focus')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.locator('#design-cockpit-save')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Enter');
      await expect(page.locator('#design-cockpit')).not.toBeVisible();
      await expect(page.locator('#wysiwyg-editor')).toBeFocused();
      expect(await page.evaluate(() => window.ZWReaderPreview.isOpen())).toBe(false);
    });
  }

  test('palette save and Escape return to editor while Reader commands focus the active surface', async ({ page }) => {
    await page.locator('#wysiwyg-editor').fill('既存の保存とフォーカス復帰を保つ。');
    await runPaletteCommand(page, '保存（手動・即時）', 'save');
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();
    await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'saved');
    await openPalette(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#command-palette')).not.toBeVisible();
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();

    await runPaletteCommand(page, 'Reader を開く', 'reader-overlay-toggle');
    await expect(page.locator('#reader-back-fab')).toBeFocused();
    await runPaletteCommand(page, 'Reader を開く', 'reader-overlay-toggle');
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();
  });
});
