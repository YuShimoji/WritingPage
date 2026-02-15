const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const wait = (ms) => new Promise(r => setTimeout(r, ms));

test.beforeEach(async ({ page }) => {
  page.on('console', m => {
    try { console.log(`[browser:${m.type()}] ${m.text()}`); } catch {}
  });
  page.on('pageerror', e => {
    try { console.log(`[pageerror] ${e.message}`); } catch {}
  });
  await page.goto('/index.html');
  // Wait until gadgets script is loaded and initialized
  try {
    await page.waitForFunction(() => !!window['ZWGadgets'], { timeout: 2000 });
  } catch {
    // Fallback: inject script directly if dynamic loader didn't run yet
    await page.addScriptTag({ url: '/js/gadgets.js' });
    await page.waitForFunction(() => !!window['ZWGadgets']);
  }
  await page.evaluate(() => {
    try {
      localStorage.removeItem('zenWriter_gadgets:prefs');
      var g = window['ZWGadgets'];
      if (g && typeof g.setPrefs === 'function') {
        g.setPrefs({ order: [], collapsed: {}, settings: {} });
      }
      if (g && typeof g.init === 'function') {
        g.init('#gadgets-panel');
      }
      // Ensure sidebar is visible for interactions
      var sb = document.querySelector('.sidebar');
      if (sb) sb.classList.add('open');
      document.documentElement.removeAttribute('data-toolbar-hidden');
      document.body && document.body.classList && document.body.classList.remove('toolbar-hidden');
    } catch {}
  });
  // Ensure initial render is complete
  await page.waitForSelector('#gadgets-panel .gadget', { state: 'attached' });
});

test.describe('Gadgets UI', () => {
  test('collapse and expand Clock gadget', async ({ page }) => {
    await page.waitForSelector('#gadgets-panel .gadget[data-name="Clock"]', { state: 'attached' });
    const gadget = page.locator('#gadgets-panel .gadget[data-name="Clock"]');
    await expect(gadget).toBeVisible();
    const body = gadget.locator('.gadget-body');
    const toggle = gadget.locator('.gadget-toggle');
    await expect(body).toBeVisible();
    await toggle.click();
    await expect(body).toBeHidden();
    await toggle.click();
    await expect(body).toBeVisible();
  });

  test('reorder gadget (fallback)', async ({ page }) => {
    await page.waitForSelector('.gadget[data-name="Clock"]');
    // Ensure at least two gadgets by registering a temporary one
    await page.evaluate(() => {
      var g = window['ZWGadgets'];
      if (!g) throw new Error('ZWGadgets not found');
      g.register('Test', function(el){ el.textContent = 'Test'; });
      g._renderLast && g._renderLast();
    });
    await page.waitForSelector('#gadgets-panel .gadget[data-name="Test"]');

    const firstNameBefore = await page.locator('#gadgets-panel .gadget').first().evaluate(el => el.dataset.name);
    const orderBefore = await page.locator('#gadgets-panel .gadget').evaluateAll(els => els.map(e=>e.getAttribute('data-name')));
    console.log('ORDER BEFORE:', orderBefore);
    expect(firstNameBefore).toBe('Clock');

    // Reorder using move-up button loop (stable fallback in headless)
    for (let i=0;i<5;i++){
      const isFirst = await page.evaluate(() => {
        const panel = document.querySelector('#gadgets-panel');
        const first = panel && panel.querySelector('.gadget');
        return !!first && first.getAttribute('data-name') === 'Test';
      });
      if (isFirst) break;
      const upBtn = page.locator('#gadgets-panel .gadget[data-name="Test"] .gadget-move-up');
      await upBtn.click();
      await page.waitForTimeout(100);
    }
    await page.waitForFunction(() => {
      const panel = document.querySelector('#gadgets-panel');
      const first = panel && panel.querySelector('.gadget');
      return !!first && first.getAttribute('data-name') === 'Test';
    }, { timeout: 2000 });

    // Re-render is synchronous; verify order changed
    const firstNameAfter = await page.locator('#gadgets-panel .gadget').first().evaluate(el => el.dataset.name);
    const orderAfter = await page.locator('#gadgets-panel .gadget').evaluateAll(els => els.map(e=>e.getAttribute('data-name')));
    console.log('ORDER AFTER:', orderAfter);
    expect(firstNameAfter).toBe('Test');
  });

  test('export and import gadget settings JSON', async ({ page }) => {
    await page.waitForFunction(() => !!window['ZWGadgets']);

    // Verify export triggers a download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#gadget-export')
    ]);
    const suggested = download.suggestedFilename();
    expect(suggested).toMatch(/\.json$/);
    const tmpDir = path.join(process.cwd(), '.tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const saved = path.join(tmpDir, suggested || 'gadgets_prefs.json');
    await download.saveAs(saved);

    // Prepare modified prefs to import (toggle Clock hour24 -> false)
    const json = await page.evaluate(() => window['ZWGadgets'].exportPrefs());
    /** @type {{order:string[],collapsed:Object,settings:Record<string, any>}} */
    const prefs = JSON.parse(json || '{}');
    if (!prefs.settings) prefs.settings = {};
    if (!prefs.settings.Clock) prefs.settings.Clock = {};
    prefs.settings.Clock.hour24 = false;
    const tmpFile = path.join(tmpDir, 'gadgets_import.json');
    fs.writeFileSync(tmpFile, JSON.stringify(prefs, null, 2));

    // Import via hidden input
    await page.setInputFiles('#gadget-prefs-input', tmpFile);
    // Allow UI to re-render
    await wait(600);

    // Validate setting applied
    const hour24 = await page.evaluate(() => (window['ZWGadgets'].getSettings('Clock') || {}).hour24);
    expect(hour24).toBe(false);
  });
});
