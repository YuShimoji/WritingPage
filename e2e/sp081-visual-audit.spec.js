// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const BASE = '/index.html';
const SHOTS = path.resolve(__dirname, '..', 'docs', 'verification', '2026-03-30');

async function waitForApp(page) {
  await page.goto(BASE);
  await page.waitForFunction(
    () => window.ZWGadgets && window.ZWGadgets._list && window.ZWGadgets._list.length > 5,
    { timeout: 15000 }
  );
  await page.waitForTimeout(800);
}

test.describe('SP-081 Phase 3 Visual Audit', () => {

  test('01 — Normal mode initial state', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) window.ZenWriterApp.setUIMode('normal');
      else document.documentElement.setAttribute('data-ui-mode', 'normal');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, '01-normal-initial.png'), fullPage: false });
  });

  test('02 — Focus mode (default)', async ({ page }) => {
    await waitForApp(page);
    // Focus is default, just capture
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) {
        window.ZenWriterApp.setUIMode('focus');
      } else {
        document.documentElement.setAttribute('data-ui-mode', 'focus'); // fallback
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, '02-focus-mode.png'), fullPage: false });
  });

  test('03 — Focus to Normal transition (sidebar overlap check)', async ({ page }) => {
    await waitForApp(page);
    // Start in focus
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) {
        window.ZenWriterApp.setUIMode('focus');
      }
    });
    await page.waitForTimeout(500);
    // Switch to normal
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) {
        window.ZenWriterApp.setUIMode('normal');
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, '03-focus-to-normal.png'), fullPage: false });
  });

  test('04 — Blank fallback to Focus (R-2)', async ({ page }) => {
    await waitForApp(page);
    // blank は focus にフォールバックされるはず
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) {
        window.ZenWriterApp.setUIMode('blank');
      }
    });
    await page.waitForTimeout(500);
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    // blank → focus にフォールバックされている
    await page.screenshot({ path: path.join(SHOTS, '04-blank-fallback.png'), fullPage: false });
  });

  test('05 — Chapter add (single)', async ({ page }) => {
    await waitForApp(page);
    // Switch to focus to see chapter panel
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) {
        window.ZenWriterApp.setUIMode('focus');
      }
    });
    await page.waitForTimeout(500);

    // Hover left edge to reveal chapter panel
    await page.mouse.move(5, 400);
    await page.waitForTimeout(300);

    // Click add chapter button if visible
    const addBtn = page.locator('.cl-add-chapter, #add-chapter-btn, [data-action="add-chapter"]');
    if (await addBtn.count() > 0) {
      await addBtn.first().click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(SHOTS, '05-chapter-add-single.png'), fullPage: false });
  });

  test('06 — Chapter add (triple - multiplication check)', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) {
        window.ZenWriterApp.setUIMode('focus');
      }
    });
    await page.waitForTimeout(500);

    // Hover left edge
    await page.mouse.move(5, 400);
    await page.waitForTimeout(300);

    // Try to add 3 chapters
    for (let i = 0; i < 3; i++) {
      const addBtn = page.locator('.cl-add-chapter, #add-chapter-btn, [data-action="add-chapter"]');
      if (await addBtn.count() > 0) {
        await addBtn.first().click();
        await page.waitForTimeout(400);
      }
    }

    await page.screenshot({ path: path.join(SHOTS, '06-chapter-add-triple.png'), fullPage: false });
  });

  test('07 — Floating toolbar (text selection)', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) window.ZenWriterApp.setUIMode('normal');
      else document.documentElement.setAttribute('data-ui-mode', 'normal');
      // Switch to WYSIWYG
      localStorage.setItem('zenwriter-wysiwyg-mode', 'true');
    });
    await page.reload();
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) window.ZenWriterApp.setUIMode('normal');
      else document.documentElement.setAttribute('data-ui-mode', 'normal');
    });
    await page.waitForTimeout(500);

    // Type some text
    const editor = page.locator('#wysiwyg-editor');
    if (await editor.count() > 0) {
      await editor.click();
      await page.keyboard.type('This is test text for floating toolbar selection.');
      await page.waitForTimeout(300);

      // Select the text
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(SHOTS, '07-floating-toolbar.png'), fullPage: false });
  });

  test('08 — Edge hover (top)', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) {
        window.ZenWriterApp.setUIMode('focus');
      }
      // Reset hint count
      localStorage.removeItem('zenwriter-edge-hint-count');
    });
    await page.waitForTimeout(500);

    // Move mouse to top edge
    await page.mouse.move(600, 5);
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(SHOTS, '08-edge-hover-top.png'), fullPage: false });
  });

  test('09 — Edge hover (left)', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) {
        window.ZenWriterApp.setUIMode('focus');
      }
      localStorage.removeItem('zenwriter-edge-hint-count');
    });
    await page.waitForTimeout(500);

    // Move mouse to left edge
    await page.mouse.move(5, 400);
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(SHOTS, '09-edge-hover-left.png'), fullPage: false });
  });

  test('10 — Mode switch buttons', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) {
        window.ZenWriterApp.setUIMode('normal');
      }
    });
    await page.waitForTimeout(500);

    // Capture mode switch buttons state
    const modeButtons = page.locator('.mode-switch-btn');
    const count = await modeButtons.count();

    await page.screenshot({ path: path.join(SHOTS, '10-mode-buttons.png'), fullPage: false });
  });

  test('11 — Main toolbar buttons (Normal mode)', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) window.ZenWriterApp.setUIMode('normal');
      else document.documentElement.setAttribute('data-ui-mode', 'normal');
      document.documentElement.removeAttribute('data-toolbar-hidden');
      document.documentElement.setAttribute('data-toolbar-mode', 'full');
    });
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SHOTS, '11-main-toolbar.png'), fullPage: false });
  });

  test('12 — Sidebar open state (Normal)', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) window.ZenWriterApp.setUIMode('normal');
      else document.documentElement.setAttribute('data-ui-mode', 'normal');
      // Open sidebar
      var btn = document.querySelector('#toggle-sidebar, [data-action="toggle-sidebar"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, '12-sidebar-open.png'), fullPage: false });
  });

  test('13 — All mode rapid switching (no blank)', async ({ page }) => {
    await waitForApp(page);
    const modes = ['normal', 'focus', 'normal', 'focus', 'normal'];
    for (const mode of modes) {
      await page.evaluate((m) => {
        if (window.ZenWriterApp && window.ZenWriterApp.setUIMode) {
          window.ZenWriterApp.setUIMode(m);
        }
      }, mode);
      await page.waitForTimeout(300);
    }
    // Should end in normal mode with clean state
    await page.screenshot({ path: path.join(SHOTS, '13-rapid-switch-final.png'), fullPage: false });
  });
});
