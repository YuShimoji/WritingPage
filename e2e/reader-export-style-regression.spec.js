const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const { ensureNormalMode } = require('./helpers');

async function showReader(page, markdown) {
  await page.evaluate((source) => {
    window.ZenWriterEditor.setContent(source);
    window.ZWReaderPreview.enter();
  }, markdown);
  await expect(page.locator('html')).toHaveAttribute('data-reader-overlay-open', 'true');
}

async function openDownloadedHtml(page, browser, testInfo) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#reader-preview').getByRole('button', { name: 'HTMLとして保存（再生オーバーレイ）', exact: true }).click()
  ]);
  const file = testInfo.outputPath('reader-export.html');
  await download.saveAs(file);
  expect(download.suggestedFilename()).toMatch(/\.html$/);

  // A separate, offline context gives the saved file no app CSS, storage or service worker.
  const context = await browser.newContext({ offline: true, serviceWorkers: 'block' });
  const standalone = await context.newPage();
  const externalRequests = [];
  standalone.on('request', (request) => {
    if (/^https?:/.test(request.url())) externalRequests.push(request.url());
  });
  await standalone.goto(pathToFileURL(file).href);
  expect(externalRequests).toEqual([]);
  await expect(standalone.locator('link[rel="stylesheet"], script[src]')).toHaveCount(0);
  return { context, standalone };
}

async function readAlignments(scope) {
  return scope.locator('[data-zw-align]').evaluateAll((elements) => elements.map((element) => ({
    align: element.getAttribute('data-zw-align'),
    text: element.textContent,
    computed: getComputedStyle(element).textAlign
  })));
}

test.describe('Reader standalone HTML style regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?reset=1');
    await page.waitForFunction(() => window.ZenWriterEditor && window.ZWReaderPreview);
    await ensureNormalMode(page);
  });

  test('downloaded HTML preserves Reader start, center and end paragraph alignment', async ({ page, browser }, testInfo) => {
    const expected = ['start', 'center', 'end'].map((align, index) => ({
      align,
      text: 'ExportAlignProbe-' + align,
      computed: ['left', 'center', 'right'][index]
    }));
    await showReader(page, expected.map(({ align, text }) => (
      '<p data-zw-align="' + align + '">' + text + '</p>'
    )).join('\n\n'));
    const readerStyles = await readAlignments(page.locator('.reader-preview__content'));
    expect(readerStyles).toEqual(expected);

    const { context, standalone } = await openDownloadedHtml(page, browser, testInfo);
    try {
      expect(await readAlignments(standalone.locator('body'))).toEqual(readerStyles);
    } finally {
      await context.close();
    }
  });

  test('downloaded HTML preserves Reader custom strikethrough', async ({ page, browser }, testInfo) => {
    await showReader(page, '[strike]ExportStrikeProbe[/strike]');
    const readerStrike = page.locator('.reader-preview__content .decor-strikethrough');
    await expect(readerStrike).toHaveText('ExportStrikeProbe');
    await expect(readerStrike).toHaveCSS('text-decoration-line', 'line-through');
    const readerStyle = await readerStrike.evaluate((element) => getComputedStyle(element).textDecorationLine);

    const { context, standalone } = await openDownloadedHtml(page, browser, testInfo);
    try {
      const exportedStrike = standalone.locator('.decor-strikethrough');
      await expect(exportedStrike).toHaveText('ExportStrikeProbe');
      await expect(exportedStrike).toHaveCSS('text-decoration-line', readerStyle);
    } finally {
      await context.close();
    }
  });
});
