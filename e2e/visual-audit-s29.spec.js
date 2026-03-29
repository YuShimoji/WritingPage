// @ts-nocheck
const { test, expect } = require('@playwright/test');
const fss = require('fs');

const SAVE = 'docs/verification/2026-03-28';
const BASE = '/index.html';

async function waitForApp(page) {
  await page.goto(BASE);
  await page.waitForFunction(
    () => window.ZWGadgets && window.ZWGadgets._list && window.ZWGadgets._list.length > 5,
    { timeout: 15000 }
  );
  await page.waitForTimeout(1000);
}

async function showNormal(page) {
  await page.evaluate(() => {
    if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) window.ZenWriterApp.setUIMode('normal');
    else document.documentElement.setAttribute('data-ui-mode', 'normal');
    document.documentElement.setAttribute('data-toolbar-hidden', 'false');
    document.documentElement.setAttribute('data-toolbar-mode', 'full');
  });
  await page.waitForTimeout(400);
}

async function openSidebar(page) {
  await page.evaluate(() => {
    var sb = document.querySelector('.sidebar');
    if (sb) { sb.classList.add('open'); sb.setAttribute('aria-hidden', 'false'); }
    document.documentElement.setAttribute('data-sidebar-open', 'true');
  });
  await page.waitForTimeout(400);
}

function lg(save, msg) {
  console.log(msg);
  try { fss.appendFileSync(save + '/audit-log.txt', msg + '\n'); } catch(e) {}
}

test.describe('Visual Audit Session 29', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [{ origin: 'http://127.0.0.1:9080', localStorage: [] }],
    },
  });

  test('D-1: initial load focus mode', async ({ page }) => {
    await waitForApp(page);
    const uiMode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    const tbHidden = await page.evaluate(() => document.documentElement.getAttribute('data-toolbar-hidden'));
    await page.screenshot({ path: SAVE + '/01_initial_load_focus.png', fullPage: false });
    lg(SAVE, 'D-1: uiMode=' + uiMode + ' tbHidden=' + tbHidden);
  });

  test('D-2: normal mode toolbar visible', async ({ page }) => {
    await waitForApp(page);
    await showNormal(page);
    const uiMode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    const tbHidden = await page.evaluate(() => document.documentElement.getAttribute('data-toolbar-hidden'));
    await page.screenshot({ path: SAVE + '/02_normal_mode.png', fullPage: false });
    lg(SAVE, 'D-2: uiMode=' + uiMode + ' tbHidden=' + tbHidden);
  });

  test('A: kenten button exists', async ({ page }) => {
    await waitForApp(page);
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await showNormal(page);
    await page.screenshot({ path: SAVE + '/03_wysiwyg_mode.png', fullPage: false });
    const ki = await page.evaluate(() => {
      const btn = document.getElementById('wysiwyg-kenten');
      if (!btn) return { found: false };
      const s = window.getComputedStyle(btn);
      const r = btn.getBoundingClientRect();
      return { found: true, id: btn.id, text: btn.textContent.trim(), title: btn.title, display: s.display, x: Math.round(r.x), y: Math.round(r.y) };
    });
    lg(SAVE, 'A-kenten-btn: ' + JSON.stringify(ki));
    expect(ki.found).toBe(true);
  });

  test('A: WYSIWYG toolbar close-up screenshot', async ({ page }) => {
    await waitForApp(page);
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await showNormal(page);
    const tbEl = page.locator('#wysiwyg-toolbar');
    await tbEl.waitFor({ state: 'attached', timeout: 8000 }).catch(() => {});
    const isVis = await tbEl.isVisible().catch(() => false);
    if (isVis) { await tbEl.screenshot({ path: SAVE + '/04_wysiwyg_toolbar_closeup.png' }); }
    else { await page.screenshot({ path: SAVE + '/04_wysiwyg_toolbar_closeup.png', fullPage: false }); }
    const tbInfo = await page.evaluate(() => {
      const tb = document.getElementById('wysiwyg-toolbar');
      if (!tb) return { found: false };
      const btns = Array.from(tb.querySelectorAll('button')).map(b => ({ id: b.id, text: b.textContent.trim().substring(0, 8), title: b.title }));
      const s = window.getComputedStyle(tb);
      return { found: true, display: s.display, btns: btns };
    });
    lg(SAVE, 'A-toolbar-detail: ' + JSON.stringify(tbInfo));
  });

  test('A: apply kenten to selected text', async ({ page }) => {
    await waitForApp(page);
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await showNormal(page);
    const edEl = page.locator('#wysiwyg-editor');
    const isEdVis = await edEl.isVisible().catch(() => false);
    if (isEdVis) {
      await edEl.click(); await page.keyboard.type('TEST');
      for (let i = 0; i < 4; i++) { await page.keyboard.down('Shift'); await page.keyboard.press('ArrowLeft'); await page.keyboard.up('Shift'); }
      await page.waitForTimeout(300);
      const kBtn = page.locator('#wysiwyg-kenten');
      const kVis = await kBtn.isVisible().catch(() => false);
      if (kVis) { await kBtn.click(); await page.waitForTimeout(600); }
    }
    await page.screenshot({ path: SAVE + '/05_kenten_applied.png', fullPage: false });
    const kc = await page.evaluate(() => ({ count: document.querySelectorAll('.kenten').length }));
    lg(SAVE, 'A-kenten-applied: ' + JSON.stringify(kc));
  });

  test('B: sidebar open state', async ({ page }) => {
    await waitForApp(page);
    await showNormal(page);
    await openSidebar(page);
    await page.screenshot({ path: SAVE + '/06_sidebar_open.png', fullPage: false });
    const accInfo = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.accordion-header[aria-controls]'));
      return headers.map(h => ({ controls: h.getAttribute('aria-controls'), text: h.textContent.trim().substring(0, 25), expanded: h.getAttribute('aria-expanded') }));
    });
    lg(SAVE, 'B-accordion-headers: ' + JSON.stringify(accInfo));
  });

  test('B: structure accordion stability BP-5', async ({ page }) => {
    await waitForApp(page);
    await showNormal(page);
    await openSidebar(page);
    const sh = page.locator('.accordion-header[aria-controls=accordion-structure]');
    const shVis = await sh.isVisible().catch(() => false);
    if (shVis) {
      await sh.click(); await page.waitForTimeout(600);
      const expanded1 = await sh.getAttribute('aria-expanded');
      await page.waitForTimeout(500);
      const expanded2 = await sh.getAttribute('aria-expanded');
      await page.screenshot({ path: SAVE + '/07_accordion_structure.png', fullPage: false });
      lg(SAVE, 'B-structure: e1=' + expanded1 + ' e2=' + expanded2 + ' stable=' + (expanded1 === expanded2));
    } else {
      await page.screenshot({ path: SAVE + '/07_accordion_structure.png', fullPage: false });
      lg(SAVE, 'B-structure: header not visible');
    }
  });

  test('C: zwp-drop-overlay CSS exists', async ({ page }) => {
    await waitForApp(page);
    await showNormal(page);
    const dropCss = await page.evaluate(() => {
      for (const sh of document.styleSheets) {
        try { for (const r of sh.cssRules) { if (r.selectorText && r.selectorText.indexOf('zwp-drop-overlay') >= 0) return { found: true, sel: r.selectorText }; } } catch(e) {}
      }
      return { found: false };
    });
    lg(SAVE, 'C-drop-overlay: ' + JSON.stringify(dropCss));
    await page.screenshot({ path: SAVE + '/08_normal_mode_full.png', fullPage: false });
    expect(dropCss.found).toBe(true);
  });

  test('D-3: sidebar with toolbar full view', async ({ page }) => {
    await waitForApp(page);
    await showNormal(page);
    await openSidebar(page);
    await page.screenshot({ path: SAVE + '/09_sidebar_with_toolbar.png', fullPage: false });
  });

});
