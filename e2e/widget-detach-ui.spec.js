const { test, expect } = require('@playwright/test');

// Use the ordinary default Rich surface, independent of legacy Markdown test state.
test.use({ storageState: { cookies: [], origins: [] } });

async function command(page, query, id) {
  await page.keyboard.press('F2');
  await expect(page.locator('#command-palette-input')).toBeVisible();
  await page.locator('#command-palette-input').fill(query);
  await page.locator('.command-palette-item[data-command-id="' + id + '"]').click();
}

async function openStructure(page) {
  await command(page, 'outline', 'gadget-structure');
  await expect(page.locator('html')).toHaveAttribute('data-left-nav-state', 'category');
  await expect(page.locator('html')).toHaveAttribute('data-left-nav-active', 'structure');
  await expect(page.locator('#structure-gadgets-panel')).toBeVisible();
}

async function storedModel(page) {
  return page.evaluate(() => window.ZenWriterStorage.loadDocuments().map((record) => ({
    id: record.id,
    type: record.type,
    parentId: record.parentId || null,
    name: record.name,
    content: record.content,
    order: record.order,
    level: record.level,
    visibility: record.visibility,
    metadata: record.metadata
  })));
}

async function detachedOutline(page) {
  return page.evaluate(() => window.ZWGadgets.getPrefs().detached?.Outline || null);
}

test('Outline ordinary controls restore and re-detach with saved floating state', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/index.html');
  await page.waitForFunction(() => window.ZWGadgets && window.ZenWriterStorage && window.ZenWriterEditor);
  await page.locator('#wysiwyg-editor').click();
  await page.keyboard.insertText('Widget body stays here');
  await command(page, '\u4fdd\u5b58', 'save');
  await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'saved');
  const before = await storedModel(page);
  expect(before.some((record) => String(record.content).includes('Widget body stays here'))).toBeTruthy();

  await openStructure(page);
  await expect(page.locator('html')).toHaveAttribute('data-sidebar-slim', 'true');
  const wrapper = page.locator('.gadget-wrapper[data-gadget-name="Outline"][data-gadget-kind="tool"]');
  const header = wrapper.locator('.gadget-header');
  const detach = wrapper.locator('.gadget-detach-btn');
  const floating = page.locator('#floating-gadget-Outline');
  await expect(wrapper).toBeVisible();
  const expanded = await header.getAttribute('aria-expanded');
  await header.click();
  await expect(header).toHaveAttribute('aria-expanded', expanded === 'true' ? 'false' : 'true');
  await header.click();
  await expect(header).toHaveAttribute('aria-expanded', expanded);

  await header.hover();
  await expect(detach).toBeVisible();
  expect(await detach.evaluate((node) => getComputedStyle(node).display)).not.toBe('none');
  await expect.poll(() => detach.evaluate((node) => Number(getComputedStyle(node).opacity))).toBeGreaterThan(0);
  await detach.click();
  await expect(floating).toBeVisible();
  await expect.poll(() => detachedOutline(page)).toEqual({ group: 'structure', floating: true });
  await floating.locator('.panel-restore-gadget').click();
  // Restore retains the floating DOM node hidden for reuse.
  await expect(floating).toBeHidden();
  await expect.poll(() => detachedOutline(page)).toBeNull();
  await expect(wrapper).toBeVisible();

  // Actual header clicks return focus to the header; ordinary Tab reaches its button.
  await header.click();
  await header.click();
  let reachedDetach = false;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    reachedDetach = await detach.evaluate((node) => node === document.activeElement);
    if (reachedDetach) break;
  }
  expect(reachedDetach, 'Keyboard Tab must reach the visible Outline detach button').toBeTruthy();
  await page.keyboard.press('Enter');
  await expect(floating).toBeVisible();
  await expect.poll(() => detachedOutline(page)).toEqual({ group: 'structure', floating: true });

  await page.reload();
  await page.waitForFunction(() => window.ZWGadgets && window.ZenWriterStorage);
  await expect(floating).toBeVisible({ timeout: 10000 });
  await expect.poll(() => detachedOutline(page)).toEqual({ group: 'structure', floating: true });
  await floating.locator('.panel-restore-gadget').click();
  await expect(floating).toBeHidden();
  await expect.poll(() => detachedOutline(page)).toBeNull();

  await page.reload();
  await page.waitForFunction(() => window.ZWGadgets && window.ZenWriterStorage);
  await openStructure(page);
  await expect(wrapper).toBeVisible();
  await expect(header).toHaveAttribute('aria-expanded', expanded);
  await expect(floating).toBeHidden();
  expect(await detachedOutline(page)).toBeNull();
  expect(await storedModel(page)).toEqual(before);
});
