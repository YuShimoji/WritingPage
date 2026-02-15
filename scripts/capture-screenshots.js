/**
 * capture-screenshots.js
 * Playwright を使って現在のプロジェクト状態をスクリーンショットとしてキャプチャする。
 * 出力先: test-artifacts/screenshots/YYYY-MM-DD/ （日付別サブフォルダ）
 * Usage: node scripts/capture-screenshots.js [port]
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PORT = process.argv[2] || 9080;
const BASE = `http://127.0.0.1:${PORT}`;
const DATE_STR = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const OUT_ROOT = path.resolve(__dirname, '..', 'test-artifacts', 'screenshots');
const OUT = path.join(OUT_ROOT, DATE_STR);

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // Collect console errors for diagnostics
  const consoleErrors = [];

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log(`Navigating to ${BASE}/index.html ...`);
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // 1. Initial state — editor view
  await page.screenshot({ path: path.join(OUT, '01_initial_state.png'), fullPage: false });
  console.log('  01_initial_state.png');

  // 2. Force sidebar open via JS API
  await page.evaluate(() => {
    if (window.sidebarManager) window.sidebarManager.forceSidebarState(true);
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '02_sidebar_open.png') });
  console.log('  02_sidebar_open.png');

  // 3. Click through sidebar tabs — verify switch via data-group
  const tabInfo = await page.evaluate(() => {
    const tabs = document.querySelectorAll('.sidebar-tab');
    return Array.from(tabs).map((t) => ({
      label: t.textContent.trim(),
      group: t.dataset.tab || t.getAttribute('aria-controls') || '',
    }));
  });
  console.log(`  Found ${tabInfo.length} sidebar tabs: ${tabInfo.map((t) => t.label).join(', ')}`);

  for (let i = 0; i < Math.min(tabInfo.length, 6); i++) {
    try {
      const info = tabInfo[i];
      await page.evaluate((idx) => {
        const tabs = document.querySelectorAll('.sidebar-tab');
        if (tabs[idx]) tabs[idx].click();
      }, i);
      await page.waitForTimeout(700);

      // Verify the active group changed
      const activeGroup = await page.evaluate(() => {
        const active = document.querySelector('.sidebar-group.active');
        return active ? active.dataset.group : 'unknown';
      });

      // Scroll sidebar to top for consistent screenshot
      await page.evaluate(() => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.scrollTop = 0;
      });
      await page.waitForTimeout(200);

      const safeName = (info.label || `tab_${i}`).replace(/[^a-zA-Z0-9\u3040-\u9FFF]/g, '_');
      const filename = `03_tab_${i}_${safeName}.png`;
      await page.screenshot({ path: path.join(OUT, filename) });

      const verified = activeGroup !== 'unknown' ? '✓' : '?';
      console.log(`  ${filename}  (${info.label}, group=${activeGroup}) ${verified}`);
    } catch (e) {
      console.log(`  tab ${i} skipped: ${e.message}`);
    }
  }

  // 4. Close sidebar, clean editor view
  await page.evaluate(() => {
    if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '04_editor_clean.png') });
  console.log('  04_editor_clean.png');

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

  // Report console errors
  if (consoleErrors.length > 0) {
    console.log(`\n⚠ ${consoleErrors.length} console error(s) detected:`);
    consoleErrors.forEach((e, i) => console.log(`  [${i + 1}] ${e}`));
  } else {
    console.log('\n✓ No console errors detected');
  }

  console.log(`\nDone. ${tabInfo.length + 3} screenshots saved to ${OUT}`);
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err.message);
  process.exit(1);
});
