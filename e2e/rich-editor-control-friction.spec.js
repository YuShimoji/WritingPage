// @ts-check
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

const richStorageState = {
  cookies: [],
  origins: [{
    origin: 'http://127.0.0.1:9080',
    localStorage: [
      { name: 'zenwriter-wysiwyg-mode', value: 'true' },
      { name: 'zenwriter-developer-mode', value: 'true' },
    ],
  }],
};

async function openRichEditor(page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => {
    return !!(window.richTextEditor && window.richTextEditor.isWysiwygMode);
  });
}

async function seedGeometryDocument(page) {
  await page.evaluate(() => {
    const editor = document.getElementById('wysiwyg-editor');
    editor.innerHTML = Array.from({ length: 20 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      return `<p data-proof-line="${index}">執筆行 ${number} — 選択中も前後の文章を読み続けられる代表テキストです。</p>`;
    }).join('');
    editor.scrollTop = 0;
    editor.focus();
  });
}

async function selectProofLine(page, index, mode = 'center') {
  await page.evaluate(({ targetIndex, block }) => {
    const editor = document.getElementById('wysiwyg-editor');
    const target = editor.querySelector(`[data-proof-line="${targetIndex}"]`);
    if (block === 'top') {
      editor.scrollTop = 0;
    } else if (block === 'bottom') {
      const next = editor.querySelector(`[data-proof-line="${targetIndex + 1}"]`) || target;
      editor.scrollTop = Math.max(0, next.offsetTop + next.offsetHeight - editor.clientHeight + 12);
    } else {
      target.scrollIntoView({ block: 'center' });
    }
    editor.focus();
    const text = target.firstChild;
    const range = document.createRange();
    range.setStart(text, 4);
    range.setEnd(text, Math.min(text.length, 18));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  }, { targetIndex: index, block: mode });
  await page.waitForFunction(() => {
    const toolbar = document.getElementById('wysiwyg-toolbar');
    return toolbar && toolbar.getAttribute('data-visible') === 'true';
  });
}

async function readToolbarGeometry(page, index) {
  return page.evaluate((targetIndex) => {
    const editor = document.getElementById('wysiwyg-editor');
    const toolbar = document.getElementById('wysiwyg-toolbar');
    const previous = editor.querySelector(`[data-proof-line="${targetIndex - 1}"]`);
    const next = editor.querySelector(`[data-proof-line="${targetIndex + 1}"]`);
    const toolbarRect = toolbar.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const selection = window.getSelection();
    const selectionRects = selection && selection.rangeCount
      ? Array.from(selection.getRangeAt(0).getClientRects())
      : [];
    const edgeLineRect = (element, edge) => {
      if (!element) return null;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.length) nodes.push(walker.currentNode);
      }
      const node = edge === 'start' ? nodes[0] : nodes[nodes.length - 1];
      if (!node) return null;
      const range = document.createRange();
      if (edge === 'start') {
        range.setStart(node, 0);
        range.setEnd(node, Math.min(1, node.length));
      } else {
        range.setStart(node, Math.max(0, node.length - 1));
        range.setEnd(node, node.length);
      }
      return range.getBoundingClientRect();
    };
    const previousRect = edgeLineRect(previous, 'end');
    const nextRect = edgeLineRect(next, 'start');
    const overlaps = (a, b) => !!b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return {
      visible: toolbar.getAttribute('data-visible'),
      placement: toolbar.getAttribute('data-placement'),
      toolbar: {
        left: toolbarRect.left,
        right: toolbarRect.right,
        top: toolbarRect.top,
        bottom: toolbarRect.bottom,
      },
      editor: {
        left: Math.max(0, editorRect.left),
        right: Math.min(window.innerWidth, editorRect.right),
        top: Math.max(0, editorRect.top),
        bottom: Math.min(window.innerHeight, editorRect.bottom),
      },
      protectedTop: Number(toolbar.getAttribute('data-protected-top')),
      protectedBottom: Number(toolbar.getAttribute('data-protected-bottom')),
      overlapsTarget: selectionRects.some((rect) => overlaps(toolbarRect, rect)),
      overlapsPrevious: overlaps(toolbarRect, previousRect),
      overlapsNext: overlaps(toolbarRect, nextRect),
    };
  }, index);
}

function expectSafeGeometry(geometry) {
  expect(geometry.visible).toBe('true');
  expect(['above', 'below']).toContain(geometry.placement);
  expect(geometry.overlapsTarget).toBe(false);
  expect(geometry.overlapsPrevious).toBe(false);
  expect(geometry.overlapsNext).toBe(false);
  expect(
    geometry.toolbar.bottom <= geometry.protectedTop + 0.5
      || geometry.toolbar.top >= geometry.protectedBottom - 0.5
  ).toBe(true);
  expect(geometry.toolbar.left).toBeGreaterThanOrEqual(geometry.editor.left + 10);
  expect(geometry.toolbar.right).toBeLessThanOrEqual(geometry.editor.right - 10);
  expect(geometry.toolbar.top).toBeGreaterThanOrEqual(geometry.editor.top + 10);
  expect(geometry.toolbar.bottom).toBeLessThanOrEqual(geometry.editor.bottom - 10);
}

test.describe('Rich Editing control friction', () => {
  test.use({ storageState: richStorageState });

  test('toolbar settles outside selected and adjacent lines across representative geometry', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await openRichEditor(page);
    await seedGeometryDocument(page);

    const scenarios = [
      { name: 'top-selection', index: 1, block: 'top' },
      { name: 'middle-selection', index: 9, block: 'center' },
      { name: 'bottom-selection', index: 17, block: 'bottom' },
    ];

    for (const scenario of scenarios) {
      await selectProofLine(page, scenario.index, scenario.block);
      expectSafeGeometry(await readToolbarGeometry(page, scenario.index));
      await page.screenshot({ path: testInfo.outputPath(`${scenario.name}.png`) });
    }

    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      window.__richToolbarKeyboardSamples = [];
      window.__richToolbarDelayedSamples = [];
      const keyTimes = new WeakMap();
      editor.addEventListener('keydown', (event) => {
        if (event.shiftKey && event.key === 'ArrowRight') keyTimes.set(event, performance.now());
      }, true);
      // Registered after the product listener: observe its immediate hide in
      // browser time, before a delayed protocol read can cross the 140ms settle.
      editor.addEventListener('keydown', (event) => {
        const eventAt = keyTimes.get(event);
        if (eventAt === undefined) return;
        const observedAt = performance.now();
        window.__richToolbarKeyboardSamples.push({
          eventAt,
          observedAt,
          elapsed: observedAt - eventAt,
          visible: document.getElementById('wysiwyg-toolbar').getAttribute('data-visible'),
        });
        setTimeout(() => {
          const delayedAt = performance.now();
          window.__richToolbarDelayedSamples.push({
            eventAt,
            observedAt: delayedAt,
            elapsed: delayedAt - eventAt,
            visible: document.getElementById('wysiwyg-toolbar').getAttribute('data-visible'),
          });
        }, 35);
      });
      const target = editor.querySelector('[data-proof-line="9"]');
      target.scrollIntoView({ block: 'center' });
      editor.focus();
      const text = target.firstChild;
      const range = document.createRange();
      range.setStart(text, 4);
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });

    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Shift+ArrowRight');
      await page.waitForTimeout(35);
    }
    const samples = await page.evaluate(() => window.__richToolbarKeyboardSamples);
    expect(samples).toHaveLength(6);
    for (const sample of samples) {
      expect(sample.elapsed).toBeGreaterThanOrEqual(0);
      expect(sample.elapsed).toBeLessThan(140);
      expect(sample.visible).toBe('false');
    }
    await page.waitForFunction(() => window.__richToolbarDelayedSamples.length === 6);
    const delayedSamples = await page.evaluate(() => window.__richToolbarDelayedSamples);
    const beforeSettle = delayedSamples.filter(sample => sample.elapsed < 140);
    await testInfo.attach('keyboard-toolbar-browser-timing', {
      body: JSON.stringify({ immediate: samples, delayed: delayedSamples, observedBeforeSettle: beforeSettle.length }, null, 2),
      contentType: 'application/json',
    });
    expect(beforeSettle.length).toBeGreaterThan(0);
    for (const sample of beforeSettle) {
      expect(sample.elapsed).toBeGreaterThanOrEqual(35);
      expect(sample.visible).toBe('false');
    }
    await page.waitForTimeout(180);
    await expect(page.locator('#wysiwyg-toolbar')).toHaveAttribute('data-visible', 'true');
    expectSafeGeometry(await readToolbarGeometry(page, 9));
    await page.screenshot({ path: testInfo.outputPath('keyboard-settled-selection.png') });

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(180);
    await expect(page.locator('#wysiwyg-toolbar')).toHaveAttribute('data-visible', 'false');

    await selectProofLine(page, 9);
    await page.keyboard.press('Escape');
    await expect(page.locator('#wysiwyg-toolbar')).toHaveAttribute('data-visible', 'false');

    await selectProofLine(page, 9);
    await page.evaluate(() => document.getElementById('wysiwyg-editor').blur());
    await expect(page.locator('#wysiwyg-toolbar')).toHaveAttribute('data-visible', 'false');

    await selectProofLine(page, 9);
    const selectedBefore = await page.evaluate(() => window.getSelection().toString());
    await page.locator('#wysiwyg-bold').click();
    const actionState = await page.evaluate(() => ({
      selected: window.getSelection().toString(),
      hasBold: !!document.querySelector('#wysiwyg-editor [data-proof-line="9"] strong, #wysiwyg-editor [data-proof-line="9"] b'),
      activeId: document.activeElement && document.activeElement.id,
    }));
    expect(actionState.selected).toBe(selectedBefore);
    expect(actionState.hasBold).toBe(true);
    expect(actionState.activeId).toBe('wysiwyg-editor');
  });

  test('toolbar stays inside a narrow editor viewport and remains keyboard reachable', async ({ page }) => {
    await page.setViewportSize({ width: 520, height: 720 });
    await openRichEditor(page);
    await seedGeometryDocument(page);
    await selectProofLine(page, 1, 'top');
    expectSafeGeometry(await readToolbarGeometry(page, 1));

    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#wysiwyg-toolbar')).toHaveAttribute('data-visible', 'true');
    const focusState = await page.evaluate(() => ({
      inToolbar: !!document.activeElement.closest('#wysiwyg-toolbar'),
      selected: window.getSelection().toString(),
    }));
    expect(focusState.inToolbar).toBe(true);
    expect(focusState.selected.length).toBeGreaterThan(0);

    await page.locator('#wysiwyg-bold').focus();
    await page.keyboard.press('Enter');
    const keyboardActionState = await page.evaluate(() => ({
      selected: window.getSelection().toString(),
      hasBold: !!document.querySelector('#wysiwyg-editor [data-proof-line="1"] strong, #wysiwyg-editor [data-proof-line="1"] b'),
      activeId: document.activeElement && document.activeElement.id,
    }));
    expect(keyboardActionState.selected).toBe(focusState.selected);
    expect(keyboardActionState.hasBold).toBe(true);
    expect(keyboardActionState.activeId).toBe('wysiwyg-editor');

    await seedGeometryDocument(page);
    await selectProofLine(page, 1, 'top');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Escape');
    await expect(page.locator('#wysiwyg-toolbar')).toHaveAttribute('data-visible', 'false');
    await expect(page.locator('#wysiwyg-editor')).toBeFocused();
  });

  test('URL and email linkification follows the explicit surface conversion contract', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await openRichEditor(page);
    const editor = page.locator('#wysiwyg-editor');
    const sourceText = '連絡先 https://example.com と writer@example.com を確認します。';

    await page.evaluate(() => {
      const richEditor = document.getElementById('wysiwyg-editor');
      richEditor.innerHTML = '<p><br></p>';
      richEditor.focus();
      const paragraph = richEditor.querySelector('p');
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await page.keyboard.type(sourceText);
    expect(await editor.locator('a').count()).toBe(0);
    expect(await editor.evaluate((node) => node.firstElementChild.childNodes.length)).toBe(1);

    await page.evaluate(() => {
      const richEditor = document.getElementById('wysiwyg-editor');
      const paragraph = document.createElement('p');
      richEditor.appendChild(paragraph);
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const transfer = new DataTransfer();
      transfer.setData('text/plain', '貼付 https://example.org paste@example.org');
      richEditor.dispatchEvent(new ClipboardEvent('paste', {
        clipboardData: transfer,
        bubbles: true,
        cancelable: true,
      }));
    });
    expect(await editor.locator('a').count()).toBe(0);
    await page.screenshot({ path: testInfo.outputPath('rich-editor-direct-text-links.png') });

    await page.evaluate(() => {
      window.richTextEditor.syncToMarkdown();
      window.ZenWriterEditor.saveContent();
    });
    await page.waitForTimeout(200);
    await page.reload();
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => !!(window.richTextEditor && window.richTextEditor.isWysiwygMode));

    const richLinkState = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('#wysiwyg-editor a'));
      return links.map((link) => {
        const style = getComputedStyle(link);
        return {
          href: link.getAttribute('href'),
          target: link.getAttribute('target') || '',
          decoration: style.textDecorationLine,
          color: style.color,
          editorColor: getComputedStyle(document.getElementById('wysiwyg-editor')).color,
        };
      });
    });
    expect(richLinkState.some((link) => link.href === 'https://example.com')).toBe(true);
    expect(richLinkState.some((link) => link.href === 'mailto:writer@example.com')).toBe(true);
    expect(richLinkState.every((link) => link.target === '')).toBe(true);
    expect(richLinkState.every((link) => link.decoration.includes('underline'))).toBe(true);
    expect(richLinkState.every((link) => link.color === link.editorColor)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('rich-editor-converted-links.png') });

    await page.evaluate(() => {
      window.richTextEditor.switchToTextarea();
    });
    await expect(page.locator('#editor')).toBeVisible();
    await page.evaluate(() => {
      window.richTextEditor.switchToWysiwyg();
    });
    await expect(page.locator('#wysiwyg-editor a[href="https://example.com"]')).toBeAttached();
    await expect(page.locator('#wysiwyg-editor a[href="mailto:writer@example.com"]')).toBeAttached();

    await page.evaluate(() => {
      window.editorPreview_renderMarkdownPreviewImmediate(window.ZenWriterEditor);
    });
    const previewLinks = page.locator('#markdown-preview-panel a');
    await expect(previewLinks.filter({ hasText: 'https://example.com' })).toHaveAttribute('href', 'https://example.com');
    await expect(previewLinks.filter({ hasText: 'writer@example.com' })).toHaveAttribute('href', 'mailto:writer@example.com');

    await page.evaluate(() => {
      window.richTextEditor.syncToMarkdown();
      window.ZenWriterEditor.saveContent();
      window.ZWReaderPreview.enter();
    });
    await expect(page.locator('#reader-preview')).toBeVisible();
    const readerLinks = page.locator('#reader-preview .reader-preview__content a');
    await expect(readerLinks.filter({ hasText: 'https://example.com' })).toHaveAttribute('href', 'https://example.com');
    await expect(readerLinks.filter({ hasText: 'writer@example.com' })).toHaveAttribute('href', 'mailto:writer@example.com');
    await page.screenshot({ path: testInfo.outputPath('reader-rendered-links.png') });
    await page.evaluate(() => window.ZWReaderPreview.exit());

    await enableAllGadgets(page);
    await openSidebarGroup(page, 'structure');
    await page.evaluate(() => {
      window.ZenWriterStorage.createStoryWikiEntry({
        title: 'リンク契約ノート',
        category: 'term',
        content: '参照 https://example.net と wiki@example.net',
      });
    });
    await page.locator('#structure-gadgets-panel .swiki-btn-expand').click();
    await page.locator('.swiki-tree-item', { hasText: 'リンク契約ノート' }).click();
    const wikiLinks = page.locator('.swiki-full:visible .swiki-detail-content a');
    await expect(wikiLinks.filter({ hasText: 'https://example.net' })).toHaveAttribute('href', 'https://example.net');
    await expect(wikiLinks.filter({ hasText: 'wiki@example.net' })).toHaveAttribute('href', 'mailto:wiki@example.net');
    const wikiStyle = await wikiLinks.first().evaluate((link) => ({
      decoration: getComputedStyle(link).textDecorationLine,
      target: link.getAttribute('target') || '',
    }));
    expect(wikiStyle.decoration).toContain('underline');
    expect(wikiStyle.target).toBe('');
  });
});
