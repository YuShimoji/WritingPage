/**
 * ツールバーと執筆域の幾何プローブ（重なり検証用）
 */
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, showFullToolbar, setUIMode } = require('./helpers');

async function measureLayout(page) {
  return page.evaluate(() => {
    const toolbar = document.getElementById('toolbar');
    const ec = document.querySelector('.editor-container');
    if (!toolbar || !ec) return null;
    const tr = toolbar.getBoundingClientRect();
    const er = ec.getBoundingClientRect();
    const root = document.documentElement;
    return {
      uiMode: root.getAttribute('data-ui-mode'),
      toolbarHidden: root.getAttribute('data-toolbar-hidden'),
      toolbarPosition: getComputedStyle(toolbar).position,
      toolbarHeight: tr.height,
      toolbarBottom: tr.bottom,
      editorTop: er.top,
      gapEditorTopMinusToolbarBottom: er.top - tr.bottom,
      toolbarHeightVar: getComputedStyle(root).getPropertyValue('--toolbar-height').trim(),
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth
    };
  });
}

test.describe('toolbar vs editor-container geometry', () => {
  test('desktop 1280x720 normal: no vertical overlap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/index.html');
    await ensureNormalMode(page);
    await showFullToolbar(page);
    await page.waitForTimeout(200);
    const m = await measureLayout(page);
    // eslint-disable-next-line no-console
    console.log('[geometry]', JSON.stringify(m));
    expect(m).toBeTruthy();
    expect(m.uiMode).toBe('normal');
    expect(m.toolbarHidden).toBeNull();
    expect(m.gapEditorTopMinusToolbarBottom).toBeGreaterThanOrEqual(-2);
  });

  test('narrow 520x720 normal: toolbar wrap must not cover editor top', async ({ page }) => {
    await page.setViewportSize({ width: 520, height: 720 });
    await page.goto('/index.html');
    await ensureNormalMode(page);
    await showFullToolbar(page);
    await page.waitForTimeout(200);
    const m = await measureLayout(page);
    // eslint-disable-next-line no-console
    console.log('[geometry narrow]', JSON.stringify(m));
    expect(m).toBeTruthy();
    expect(m.gapEditorTopMinusToolbarBottom).toBeGreaterThanOrEqual(-2);
  });

  test('focus + top edge hover: editor top clears toolbar (no overlap)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/index.html');
    await setUIMode(page, 'focus');
    await page.waitForTimeout(200);
    await page.mouse.move(8, 8);
    await page.waitForTimeout(250);
    const m = await page.evaluate(() => {
      const toolbar = document.getElementById('toolbar');
      const editor = document.getElementById('editor');
      if (!toolbar || !editor) return null;
      const tr = toolbar.getBoundingClientRect();
      const er = editor.getBoundingClientRect();
      return {
        dataEdgeHoverTop: document.documentElement.getAttribute('data-edge-hover-top'),
        uiMode: document.documentElement.getAttribute('data-ui-mode'),
        toolbarBottom: tr.bottom,
        editorTop: er.top,
        gap: er.top - tr.bottom
      };
    });
    // eslint-disable-next-line no-console
    console.log('[geometry focus edge top]', JSON.stringify(m));
    expect(m).toBeTruthy();
    expect(m.uiMode).toBe('focus');
    expect(m.dataEdgeHoverTop).toBe('true');
    expect(m.gap).toBeGreaterThanOrEqual(-2);
  });
});
