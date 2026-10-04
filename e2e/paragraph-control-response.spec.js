const { test, expect, chromium } = require('@playwright/test');
const { performance, monitorEventLoopDelay } = require('node:perf_hooks');

test.use({ storageState: { cookies: [], origins: [] } });

async function chooseBlock(page, type, overlapScans) {
  await page.locator('#wysiwyg-toolbar [data-dropdown="block-heading"] .wysiwyg-dropdown-toggle').click();
  const item = page.locator('#wysiwyg-toolbar [data-block="' + type + '"]');
  await expect(item).toBeVisible();
  const started = performance.now();
  const hostStartAt = Date.now();
  const click = item.click({ timeout: 15000 });
  if (overlapScans) {
    const scanStarted = performance.now(), at = Date.now();
    const sample = require(process.env.WRITINGPAGE_BUDGET_HELPER).budget();
    overlapScans.push({ at, started: scanStarted, endedAt: Date.now(), durationMs: performance.now() - scanStarted, generatedBytes: sample.generatedBytes, enoentRetries: sample.enoentRetryCount, mode: 'one real budget scan while ordinary click is pending' });
  }
  await click;
  return { durationMs: performance.now() - started, hostStartAt, hostEndAt: Date.now() };
}

async function save(page) {
  await page.keyboard.press('F2');
  await page.locator('#command-palette-input').fill('保存');
  await page.locator('.command-palette-item[data-command-id="save"]').click();
  await expect(page.locator('#writing-status-chip')).toHaveAttribute('data-save-state', 'saved');
}

for (const scanMode of ['none', 'periodic', 'overlap']) {
  const synchronousScan = scanMode === 'periodic';
  test(`ordinary paragraph first, repeat and browser restart with ${scanMode === 'overlap' ? 'controlled budget overlap' : synchronousScan ? 'old synchronous budget scan' : 'no periodic scan'}`, async ({ page: initialPage }, testInfo) => {
    test.skip(scanMode !== 'none' && !process.env.WRITINGPAGE_BUDGET_HELPER, 'Optional historical budget helper requires the isolated diagnostic configuration.');
    let page = initialPage, restartedBrowser;
    const timeline = [], scans = [], pageErrors = [], warnings = [], responses = [];
    const delay = monitorEventLoopDelay({ resolution: 10 });
    delay.enable();
    async function observe(target) {
      target.on('pageerror', error => pageErrors.push(error.message));
      target.on('console', message => { if (['error', 'warning'].includes(message.type())) warnings.push({ type: message.type(), text: message.text(), location: message.location() }); });
      target.on('response', response => { if (response.status() >= 400) responses.push({ url: response.url(), status: response.status() }); });
      await target.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
      });
      await target.addInitScript(() => {
      window.__paragraphControlEvents = [];
      function record(event, phase) {
        const block = event.target.closest && event.target.closest('[data-block]');
        if (!block) return;
        window.__paragraphControlEvents.push({ event: event.type, phase, block: block.dataset.block, at: Date.now(), browserMs: performance.now(), editorHtml: document.getElementById('wysiwyg-editor')?.innerHTML });
      }
      document.addEventListener('mousedown', event => record(event, 'capture'), true);
      document.addEventListener('mousedown', event => record(event, 'bubble'));
      });
    }
    await observe(page);
    await page.goto('/index.html');
    await page.waitForFunction(() => window.ZenWriterEditor?.richTextEditor?.__richTextEnhancedInstalled);
    await expect(page.locator('#wysiwyg-editor')).toBeVisible();
    expect(await page.title()).toContain('Zen Writer');
    const timer = synchronousScan ? setInterval(() => {
      const started = performance.now();
      const at = Date.now();
      try {
        const sample = require(process.env.WRITINGPAGE_BUDGET_HELPER).budget();
        scans.push({ at, started, durationMs: performance.now() - started, generatedBytes: sample.generatedBytes, enoentRetries: sample.enoentRetryCount });
      } catch (error) { scans.push({ started, error: error.message }); }
    }, 2000) : null;
    try {
      let canonical;
      for (const phase of ['first', 'repeat', 'browser-restart']) {
        const entry = { phase };
        timeline.push(entry);
        if (phase === 'browser-restart') {
          const storageState = testInfo.outputPath('synthetic-storage-state.json');
          await page.context().storageState({ path: storageState });
          await page.close();
          restartedBrowser = await chromium.launch({ channel: 'chrome', headless: true });
          const context = await restartedBrowser.newContext({ baseURL: testInfo.project.use.baseURL, storageState });
          page = await context.newPage();
          await observe(page);
          await page.goto('/index.html');
          await page.waitForFunction(() => window.ZenWriterEditor?.richTextEditor?.__richTextEnhancedInstalled);
          expect(await page.locator('#editor').inputValue()).toBe(canonical);
          entry.restoredCanonical = await page.locator('#editor').inputValue();
        }
        const editor = page.locator('#wysiwyg-editor');
        if (phase === 'first') {
          await editor.click();
          await page.keyboard.press('Control+a');
          await page.keyboard.press('Backspace');
          await page.keyboard.insertText('Keep heading');
          await page.keyboard.press('Control+a');
          entry.headingClick = await chooseBlock(page, 'h1');
          await page.keyboard.press('Control+End');
          await page.keyboard.press('Enter');
          await page.keyboard.insertText('Keep paragraph');
        } else {
          await editor.locator('p').click();
        }
        await page.keyboard.press('Home');
        await page.keyboard.press('Shift+End');
        entry.paragraphClick = await chooseBlock(page, 'p', scanMode === 'overlap' ? scans : null);
        entry.events = await page.evaluate(() => window.__paragraphControlEvents.slice());
        await expect(editor.locator('h1')).toHaveText('Keep heading');
        await expect(editor.locator('p')).toHaveText('Keep paragraph');
        await expect(page.locator('#wysiwyg-toolbar [data-dropdown="block-heading"]')).toHaveAttribute('data-open', 'false');
        await save(page);
        const content = await page.locator('#editor').inputValue();
        entry.canonical = content;
        if (canonical !== undefined) expect(content).toBe(canonical);
        canonical = content;
      }
      expect(pageErrors).toEqual([]);
      expect(responses.filter(response => !response.url.endsWith('/favicon.ico'))).toEqual([]);
      if (synchronousScan) expect(scans.length).toBeGreaterThan(0);
      if (scanMode === 'overlap') expect(scans).toHaveLength(3);
      await page.screenshot({ path: testInfo.outputPath('paragraph-result.png') });
    } finally {
      if (timer) clearInterval(timer);
      delay.disable();
      await testInfo.attach('paragraph-control-observation.json', { body: JSON.stringify({ url: page.url(), title: await page.title().catch(() => ''), scanMode, synchronousScan, scans, timeline, pageErrors, warnings, responses, eventLoop: { maximumMs: delay.max / 1e6, meanMs: delay.mean / 1e6 }, historicalNativeCauseEstablished: false }), contentType: 'application/json' });
      if (restartedBrowser) await restartedBrowser.close();
    }
  });
}
