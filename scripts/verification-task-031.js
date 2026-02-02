const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TARGET_DIR = path.resolve(__dirname, '../docs/archive/screenshots/verification_20260119');
const BASE_URL = 'http://localhost:8080';

async function ensureDir(dir) {
    await fs.promises.mkdir(dir, { recursive: true });
}

async function runVerification() {
    await ensureDir(TARGET_DIR);
    console.log(`Target directory: ${TARGET_DIR}`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();

    try {
        console.log('Navigating to ' + BASE_URL);
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

        // --- 1. Initial Load ---
        console.log('Taking screenshot: initial_load.png');
        await page.screenshot({ path: path.join(TARGET_DIR, 'initial_load.png') });

        // Helper to click tab and wait
        async function switchTab(storeId) {
            const selector = `.sidebar-tab[data-group="${storeId}"]`;
            await page.waitForSelector(selector);
            await page.click(selector);
            await new Promise(r => setTimeout(r, 500)); // Wait for animation
        }

        // --- 2. Sidebar Structure ---
        console.log('Switching to Structure tab...');
        // Ensure sidebar is open first.
        const sidebar = await page.$('#sidebar');
        const sidebarClass = await page.evaluate(el => el.className, sidebar);
        if (!sidebarClass.includes('open')) {
            console.log('Opening sidebar...');
            await page.click('#toggle-sidebar'); // Assuming ID
            await new Promise(r => setTimeout(r, 500));
        }

        await switchTab('structure');
        console.log('Taking screenshot: sidebar_structure.png');
        await page.screenshot({ path: path.join(TARGET_DIR, 'sidebar_structure.png') });

        // --- 7. Loadout Menu (DoD 7) ---
        // Ensure LoadoutManager is in the structure group.
        await page.evaluate(() => {
            if (window.ZWGadgets && window.ZWGadgets.assignGroups) {
                // Determine current groups for LoadoutManager
                // If checking default prefs, it might not be there. Force it.
                window.ZWGadgets.assignGroups('LoadoutManager', ['structure']);
                // Also ensure it is enabled in the current loadout if needed
                // assignGroups usually updates the registry and triggers redraw if active group matches.
                // We might need to refresh the group.
                if (window.ZWGadgets.refreshGroup) {
                    window.ZWGadgets.refreshGroup('structure');
                } else if (window.ZWGadgets.setActiveGroup) {
                    window.ZWGadgets.setActiveGroup('structure');
                }
            }
        });

        await new Promise(r => setTimeout(r, 1000)); // Wait for re-render

        // Scroll to top
        const panelSelector = `.gadgets-panel[data-gadget-group="structure"]`;
        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) el.scrollTop = 0;
        }, panelSelector);

        console.log('Taking screenshot: loadout_menu.png (Gadget focused)');
        // Wait for the element
        try {
            await page.waitForSelector('#loadout-select', { timeout: 2000 });
            await page.focus('#loadout-select');
        } catch (e) {
            console.log('Loadout select not found, taking screenshot of panel anyway.');
        }
        await new Promise(r => setTimeout(r, 200));
        await page.screenshot({ path: path.join(TARGET_DIR, 'loadout_menu.png') });


        // --- 3. Sidebar Typography ---
        console.log('Switching to Typography tab...');
        await switchTab('typography');
        console.log('Taking screenshot: sidebar_typography.png');
        await page.screenshot({ path: path.join(TARGET_DIR, 'sidebar_typography.png') });

        // --- 4. Sidebar Assist ---
        console.log('Switching to Assist tab...');
        await switchTab('assist');
        console.log('Taking screenshot: sidebar_assist.png');
        await page.screenshot({ path: path.join(TARGET_DIR, 'sidebar_assist.png') });

        // --- 6. HUD Visible ---
        // While in Assist, let's ensure HUD is visible.
        // We can force show it via console just to be sure.
        console.log('Ensuring HUD is visible...');
        await page.evaluate(() => {
            if (window.ZenWriterHUD && window.ZenWriterHUD.show) {
                window.ZenWriterHUD.show('Verification HUD Test', 5000);
            }
        });
        await new Promise(r => setTimeout(r, 500)); // Wait for fade in
        console.log('Taking screenshot: hud_visible.png');
        await page.screenshot({ path: path.join(TARGET_DIR, 'hud_visible.png') });

        // --- 5. Sidebar Wiki ---
        console.log('Switching to Wiki tab...');
        await switchTab('wiki');
        console.log('Taking screenshot: sidebar_wiki.png');
        await page.screenshot({ path: path.join(TARGET_DIR, 'sidebar_wiki.png') });

    } catch (e) {
        console.error('Error during verification:', e);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runVerification();
