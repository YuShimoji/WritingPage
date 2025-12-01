const puppeteer = require('puppeteer');

async function runTest() {
  console.log('Starting Puppeteer visual test...');

  const browser = await puppeteer.launch({
    headless: false, // ブラウザを表示して確認
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 開発サーバーにアクセス
    await page.goto('http://localhost:8080');
    console.log('Page loaded successfully');

    // 初期スクリーンショット
    await page.screenshot({ path: 'test-screenshots/initial-load.png' });
    console.log('Screenshot saved: initial-load.png');

    // タイプライターモードが有効か確認（例）
    const typewriterToggle = await page.$('[data-setting="typewriter.enabled"]');
    if (typewriterToggle) {
      console.log('Typewriter toggle found');
      await typewriterToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-screenshots/typewriter-enabled.png' });
      console.log('Screenshot saved: typewriter-enabled.png');
    }

    // テーマ変更テスト（例）
    const themeSelect = await page.$('#theme-select');
    if (themeSelect) {
      await page.select('#theme-select', 'dark');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-screenshots/dark-theme.png' });
      console.log('Screenshot saved: dark-theme.png');
    }

    console.log('Visual test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

runTest();
