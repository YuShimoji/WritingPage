const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TARGET_DIR = path.resolve(__dirname, '../docs/evidence');
const BASE_URL = 'http://localhost:8080';

async function ensureDir(dir) {
    await fs.promises.mkdir(dir, { recursive: true });
}

async function runCapture() {
    await ensureDir(TARGET_DIR);
    console.log(`Target directory: ${TARGET_DIR}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();

    try {
        console.log('Navigating to ' + BASE_URL);
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

        // 1. Normal Mode (Overall)
        console.log('Capturing: screenshot_20260128_NORMAL.png');
        await page.screenshot({ path: path.join(TARGET_DIR, 'screenshot_20260128_NORMAL.png') });

        // 2. Sidebar Tabs
        const tabs = ['structure', 'typography', 'assist', 'wiki'];
        for (const tab of tabs) {
            const selector = `.sidebar-tab[data-group="${tab}"]`;
            // Ensure sidebar is open
            const sidebar = await page.$('#sidebar');
            const sidebarClass = await page.evaluate(el => el.className, sidebar);
            if (!sidebarClass.includes('open')) {
                await page.click('#toggle-sidebar');
                await new Promise(r => setTimeout(r, 500));
            }

            await page.waitForSelector(selector);
            await page.click(selector);
            await new Promise(r => setTimeout(r, 800)); // Wait for render
            console.log(`Capturing: screenshot_20260128_SIDEBAR_${tab.toUpperCase()}.png`);
            await page.screenshot({ path: path.join(TARGET_DIR, `screenshot_20260128_SIDEBAR_${tab.toUpperCase()}.png`) });
        }

        // 3. Editor Content
        console.log('Typing content into editor...');
        // Focus editor
        await page.click('#editor');
        await page.keyboard.type('# Zen Writer Status\n\nCurrent state capture.\n\n## Features active\n- Markdown editing\n- Sidebar gadgets\n- Themes');
        await new Promise(r => setTimeout(r, 1000));
        console.log('Capturing: screenshot_20260128_EDITOR.png');
        await page.screenshot({ path: path.join(TARGET_DIR, 'screenshot_20260128_EDITOR.png') });

        // 4. Floating Panel
        // Try to detach structure panel via UI or force it
        console.log('Attempting to float structure panel...');
        await page.evaluate(() => {
            // Fallback: if we can't find the function, we skip
            if (window.SidebarManager && window.SidebarManager.floatPanel) {
                window.SidebarManager.floatPanel('structure');
            }
        });
        await new Promise(r => setTimeout(r, 1000));
        console.log('Capturing: screenshot_20260128_FLOATING.png');
        await page.screenshot({ path: path.join(TARGET_DIR, 'screenshot_20260128_FLOATING.png') });

    } catch (e) {
        console.error('Error during capture:', e);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runCapture();
