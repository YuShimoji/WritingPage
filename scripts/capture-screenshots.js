/**
 * capture-screenshots.js
 * Playwright を使って現在のプロジェクト状態をスクリーンショットとしてキャプチャする。
 * Usage: node scripts/capture-screenshots.js [port]
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PORT = process.argv[2] || 9080;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.resolve(__dirname, '..', 'test-artifacts', 'screenshots');

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  console.log(`Navigating to ${BASE}/index.html ...`);
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // 1. Initial state — full page
  await page.screenshot({ path: path.join(OUT, '01_initial_state.png'), fullPage: false });
  console.log('  01_initial_state.png');

  // 2. Force sidebar open via JS API
  await page.evaluate(() => {
    if (window.sidebarManager) window.sidebarManager.forceSidebarState(true);
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '02_sidebar_open.png') });
  console.log('  02_sidebar_open.png');

  // 3. Click through sidebar tabs via JS to bypass viewport issues
  const tabCount = await page.evaluate(() => {
    const tabs = document.querySelectorAll('.sidebar-tab');
    return tabs.length;
  });
  console.log(`  Found ${tabCount} sidebar tabs`);
  for (let i = 0; i < Math.min(tabCount, 6); i++) {
    try {
      const label = await page.evaluate((idx) => {
        const tabs = document.querySelectorAll('.sidebar-tab');
        if (tabs[idx]) { tabs[idx].click(); return tabs[idx].textContent.trim(); }
        return '';
      }, i);
      await page.waitForTimeout(700);
      // Scroll sidebar to top for consistent screenshot
      await page.evaluate(() => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.scrollTop = 0;
      });
      await page.waitForTimeout(200);
      const filename = `03_tab_${i}.png`;
      await page.screenshot({ path: path.join(OUT, filename) });
      console.log(`  ${filename}  (${label})`);
    } catch (e) { console.log(`  tab ${i} skipped: ${e.message}`); }
  }

  // 4. Capture gadget settings panel (gear icon)
  const gearBtn = await page.$('#gadget-settings-btn');
  if (gearBtn) {
    await gearBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, '04_gadget_settings.png') });
    console.log('  04_gadget_settings.png');
  }

  // 5. Close sidebar, clean editor view
  await page.evaluate(() => {
    if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '05_editor_clean.png') });
  console.log('  05_editor_clean.png');

  // 5. Embed demo page if available
  try {
    await page.goto(`${BASE}/embed-demo.html`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, '05_embed_demo.png') });
    console.log('  05_embed_demo.png');
  } catch {
    console.log('  (embed-demo not reachable, skipped)');
  }

  await browser.close();
  console.log(`\nDone. Screenshots saved to ${OUT}`);
}

main().catch(err => {
  console.error('Screenshot capture failed:', err.message);
  process.exit(1);
});
