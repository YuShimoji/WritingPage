const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function ensureScreenshotsDir() {
  const dir = path.join(__dirname, '..', 'test-screenshots');
  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (_) { }
  return dir;
}

async function openSidebarAndAssistPanel(page) {
  await page.waitForSelector('#sidebar', { timeout: 10000 });
  const isOpen = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return !!(sb && sb.classList.contains('open'));
  });
  if (!isOpen) {
    await page.waitForSelector('#toggle-sidebar', { visible: true });
    await page.click('#toggle-sidebar');
  }
  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('assist');
      }
      if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
        window.ZWGadgets.setActiveGroup('assist');
      }
    } catch (_) { }
  });
  await page.waitForTimeout(500);
}

async function openSidebarAndTypographyPanel(page) {
  await page.waitForSelector('#sidebar', { timeout: 10000 });
  const isOpen = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return !!(sb && sb.classList.contains('open'));
  });
  if (!isOpen) {
    await page.waitForSelector('#toggle-sidebar', { visible: true });
    await page.click('#toggle-sidebar');
  }
  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('typography');
      }
      if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
        window.ZWGadgets.setActiveGroup('typography');
      }
    } catch (_) { }
  });
  await page.waitForTimeout(500);
}

async function runTest() {
  console.log('Starting Puppeteer visual test...');

  const screenshotsDir = await ensureScreenshotsDir();

  const browser = await puppeteer.launch({
    headless: false, // ブラウザを表示して確認
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 開発サーバーにアクセス
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#editor', { timeout: 10000 });
    console.log('Page loaded successfully');

    // 初期スクリーンショット
    await page.screenshot({ path: path.join(screenshotsDir, 'initial-load.png'), fullPage: true });
    console.log('Screenshot saved: initial-load.png');

    // タイプライターモードが有効か確認（例）
    await openSidebarAndAssistPanel(page);
    const typewriterToggle = await page.$('#assist-gadgets-panel #typewriter-enabled');
    if (typewriterToggle) {
      await typewriterToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotsDir, 'typewriter-enabled.png'), fullPage: true });
      console.log('Screenshot saved: typewriter-enabled.png');
    }

    // スナップショット設定の確認
    const snapshotInterval = await page.$('#assist-gadgets-panel #snapshot-interval-ms');
    const snapshotDelta = await page.$('#assist-gadgets-panel #snapshot-delta-chars');
    const snapshotRetention = await page.$('#assist-gadgets-panel #snapshot-retention');
    if (snapshotInterval && snapshotDelta && snapshotRetention) {
      await snapshotInterval.click({ clickCount: 3 });
      await snapshotInterval.type('60000');
      await snapshotDelta.click({ clickCount: 3 });
      await snapshotDelta.type('200');
      await snapshotRetention.click({ clickCount: 3 });
      await snapshotRetention.type('5');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotsDir, 'snapshot-settings.png'), fullPage: true });
      console.log('Screenshot saved: snapshot-settings.png');
    }

    // テーマ変更テスト（例）
    await openSidebarAndTypographyPanel(page);
    const darkThemeBtn = await page.$('#typography-gadgets-panel [data-theme-preset="dark"]');
    if (darkThemeBtn) {
      await darkThemeBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotsDir, 'dark-theme.png'), fullPage: true });
      console.log('Screenshot saved: dark-theme.png');
    }

    const visualProfileSelectExists = await page.$('#typography-gadgets-panel select');
    if (visualProfileSelectExists) {
      try {
        await page.select('#typography-gadgets-panel select', 'focus-dark');
      } catch (_) { }
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotsDir, 'visual-profile-focus-dark.png'), fullPage: true });
      console.log('Screenshot saved: visual-profile-focus-dark.png');
    }

    console.log('Visual test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

runTest();
