const { test, expect } = require('@playwright/test');

test.use({ storageState: { cookies: [], origins: [] } });
const observations = new WeakMap();

async function snapshot(page) {
  return page.evaluate(() => ({
    html: document.getElementById('wysiwyg-editor').innerHTML,
    markdown: document.getElementById('editor').value,
    bold: document.queryCommandState('bold'),
    selection: window.getSelection().toString(),
  }));
}

async function chooseBlock(page, block) {
  await page.locator('#wysiwyg-toolbar [data-dropdown="block-heading"] .wysiwyg-dropdown-toggle').click();
  await page.locator('#wysiwyg-toolbar [data-block="' + block + '"]').click();
}

async function save(page) {
  await page.keyboard.press('F2');
  await page.locator('#command-palette-input').fill('保存');
  await page.locator('.command-palette-item[data-command-id="save"]').click();
  await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'saved');
}

async function clear(page) {
  await page.locator('#wysiwyg-editor').click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Backspace');
  await expect(page.locator('#wysiwyg-editor')).toHaveText('');
}

test.beforeEach(async ({ page }) => {
  const health = { pageErrors: [], consoleErrors: [], responses: [] };
  observations.set(page, health);
  page.on('pageerror', error => health.pageErrors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) health.consoleErrors.push({ text: message.text(), location: message.location() }); });
  page.on('response', response => { if (response.status() >= 400) health.responses.push({ url: response.url(), status: response.status() }); });
  await page.addInitScript(() => {
    window.__emptyRestartEvents = [];
    const record = phase => {
      window.__emptyRestartEvents.push({ phase, at: Date.now(), html: document.getElementById('wysiwyg-editor')?.innerHTML, bold: document.queryCommandState('bold') });
    };
    document.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.target.id !== 'wysiwyg-editor') return;
      record('before-enter');
      setTimeout(() => record('native-enter-before-product-callback'), 0);
      setTimeout(() => record('after-product-callback'), 30);
    }, true);
  });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/index.html');
  await page.waitForFunction(() => window.ZenWriterEditor?.richTextEditor?.__richTextEnhancedInstalled);
  await expect(page.locator('#wysiwyg-editor')).toBeVisible();
  expect(await page.title()).toContain('Zen Writer');
});

test.afterEach(async ({ page }, testInfo) => {
  const state = await snapshot(page);
  const health = observations.get(page);
  await testInfo.attach('empty-restart-observation.json', { body: JSON.stringify({ ...state, health, events: await page.evaluate(() => window.__emptyRestartEvents), route: page.url() }), contentType: 'application/json' });
  await page.screenshot({ path: testInfo.outputPath('empty-restart-result.png') });
  expect(health.pageErrors).toEqual([]);
  expect(health.consoleErrors).toEqual([]);
  expect(health.responses).toEqual([]);
});

test('heading newline and full deletion restart keep an ordinary paragraph', async ({ page }, testInfo) => {
  const phases = [];
  for (const phase of ['first', 'after-full-deletion']) {
    await clear(page);
    phases.push({ phase, empty: await snapshot(page) });
    await page.keyboard.insertText('Heading');
    await page.keyboard.press('Control+a');
    await chooseBlock(page, 'h1');
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__emptyRestartEvents.filter(event => event.phase === 'after-product-callback').length >= window.__emptyRestartEvents.filter(event => event.phase === 'before-enter').length);
    phases.push({ phase, afterEnter: await snapshot(page) });
    await page.keyboard.insertText('Paragraph');
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+End');
    await chooseBlock(page, 'p');
    phases.push({ phase, result: await snapshot(page) });
    await testInfo.attach(phase + '-timeline.json', { body: JSON.stringify(phases), contentType: 'application/json' });
    await expect(page.locator('#wysiwyg-editor p')).toHaveText('Paragraph');
    await expect(page.locator('#wysiwyg-editor p b, #wysiwyg-editor p strong')).toHaveCount(0);
    await expect(page.locator('#editor')).toHaveValue('# Heading\n\nParagraph');
    await save(page);
  }
  await page.reload();
  await expect(page.locator('#editor')).toHaveValue('# Heading\n\nParagraph');
  await expect(page.locator('#wysiwyg-editor p')).toHaveText('Paragraph');
  await expect(page.locator('#wysiwyg-editor p b, #wysiwyg-editor p strong')).toHaveCount(0);
});

for (const mode of ['plain', 'explicit-bold', 'explicit-normal']) {
  test(`${mode} chosen before full deletion survives typing, UndoRedo and saved reload`, async ({ page }, testInfo) => {
    await clear(page);
    await page.keyboard.insertText('Seed');
    if (mode !== 'plain') {
      await page.keyboard.press('Control+a');
      await page.locator('#wysiwyg-bold').click();
      await expect(page.locator('#wysiwyg-editor b, #wysiwyg-editor strong')).toHaveText('Seed');
      if (mode === 'explicit-normal') {
        await page.locator('#wysiwyg-bold').click();
        await expect(page.locator('#wysiwyg-editor b, #wysiwyg-editor strong')).toHaveCount(0);
      }
    }
    const beforeDeletion = await snapshot(page);
    // Keep the current editing caret: an extra blur/save or empty-surface click
    // changes the browser typing style and does not test direct delete/retype.
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Backspace');
    await expect(page.locator('#wysiwyg-editor')).toHaveText('');
    await page.waitForFunction(() => {
      const rich = window.ZenWriterEditor.richTextEditor;
      return rich._undoLastSnapshot === rich.wysiwygEditor.innerHTML;
    });
    const afterDeletion = await snapshot(page);
    await page.keyboard.insertText('Restart');
    const expected = mode === 'explicit-bold' ? '**Restart**' : 'Restart';
    await expect(page.locator('#editor')).toHaveValue(expected);
    await testInfo.attach('explicit-deletion-intent.json', { body: JSON.stringify({ mode, beforeDeletion, afterDeletion, afterTyping: await snapshot(page) }), contentType: 'application/json' });
    await save(page);
    await page.locator('#wysiwyg-editor').click();
    await page.keyboard.press('Control+z');
    await expect(page.locator('#wysiwyg-editor')).toHaveText('');
    await page.keyboard.press('Control+y');
    await expect(page.locator('#editor')).toHaveValue(expected);
    await save(page);
    await page.reload();
    await expect(page.locator('#editor')).toHaveValue(expected);
    const rich = page.locator('#wysiwyg-editor');
    await expect(rich).toHaveText('Restart');
    if (mode === 'explicit-bold') await expect(rich.locator('strong, b')).toHaveText('Restart');
    else await expect(rich.locator('strong, b')).toHaveCount(0);
  });
}

test('explicit bold ends on the default ordinary Enter', async ({ page }) => {
  await clear(page);
  await page.keyboard.insertText('Bold');
  await page.keyboard.press('Control+a');
  await page.locator('#wysiwyg-bold').click();
  await page.keyboard.press('Control+End');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__emptyRestartEvents.some(event => event.phase === 'after-product-callback'));
  await page.keyboard.insertText('Plain');
  await expect(page.locator('#editor')).toHaveValue('**Bold**\n\nPlain');
  await save(page);
  await page.reload();
  await expect(page.locator('#editor')).toHaveValue('**Bold**\n\nPlain');
});
