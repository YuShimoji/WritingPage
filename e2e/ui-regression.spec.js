// @ts-check
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, enableAllGadgets, openSidebarGroup } = require('./helpers');

const pageUrl = '/index.html';

test.describe('Current shell icon rendering', () => {
    test('visible left-nav shell controls render as SVG', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        await ensureNormalMode(page);
        await openSidebarGroup(page, 'structure');
        await page.waitForSelector('#structure-gadgets-panel', { state: 'visible', timeout: 10000 });

        const iconButtons = page.locator('#sidebar-nav-back:visible, #sidebar-nav-anchor:visible, .accordion-category.is-active-category .accordion-header:visible');
        const count = await iconButtons.count();
        expect(count).toBeGreaterThanOrEqual(2);

        for (let i = 0; i < count; i++) {
            const btn = iconButtons.nth(i);
            const svgCount = await btn.locator('svg').count();
            const label = await btn.evaluate((el) => el.id || el.closest('.accordion-category')?.getAttribute('data-category') || el.tagName);
            expect(svgCount, `Visible current-shell control ${label} should have a Lucide SVG icon`).toBeGreaterThan(0);
        }
    });

    test('Electron window controls keep structural icon buttons without visible top chrome', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');

        const controls = await page.evaluate(() => {
            const island = document.getElementById('electron-window-controls');
            const buttons = island ? Array.from(island.querySelectorAll('.window-control-btn')) : [];
            return {
                islandExists: !!island,
                retiredTopChromeExists: !!document.getElementById('top-chrome'),
                buttonIds: buttons.map((button) => button.id),
                buttonsWithIcons: buttons.filter((button) => !!button.querySelector('svg, [data-lucide]')).length,
                handleHasIcon: !!document.querySelector('#electron-window-drag-handle svg, #electron-window-drag-handle [data-lucide]')
            };
        });

        expect(controls.islandExists).toBe(true);
        expect(controls.retiredTopChromeExists).toBe(false);
        expect(controls.buttonIds).toEqual(['win-minimize', 'win-maximize', 'win-close']);
        expect(controls.buttonsWithIcons).toBe(3);
        expect(controls.handleHasIcon).toBe(true);
    });
});

test.describe('Gadget header layout', () => {
    test.setTimeout(60000);

    test('gadget header shows title and controls in one row', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForFunction(() => {
            try { return !!window.ZWGadgets; } catch (_) { return false; }
        }, { timeout: 15000 });

        await enableAllGadgets(page);
        await openSidebarGroup(page, 'structure');
        await page.waitForSelector('#structure-gadgets-panel .gadget-header', {
            state: 'visible',
            timeout: 10000,
        });

        const header = page.locator('#structure-gadgets-panel .gadget-header').first();
        await expect(header).toBeVisible();

        const headerBox = await header.boundingBox();
        expect(headerBox).not.toBeNull();
        expect(headerBox.height).toBeLessThanOrEqual(40);

        const flexDir = await header.evaluate((el) =>
            window.getComputedStyle(el).flexDirection
        );
        expect(flexDir).toBe('row');
    });

    test('gadget detach button is inline with title', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForFunction(() => {
            try { return !!window.ZWGadgets; } catch (_) { return false; }
        }, { timeout: 15000 });

        await enableAllGadgets(page);
        await openSidebarGroup(page, 'structure');
        await page.waitForSelector('#structure-gadgets-panel .gadget-header', {
            state: 'visible',
            timeout: 10000,
        });

        const header = page.locator('#structure-gadgets-panel .gadget-header').first();
        const detachBtn = header.locator('.gadget-detach-btn');
        const hasDetachBtn = (await detachBtn.count()) > 0;

        if (hasDetachBtn) {
            const headerBox = await header.boundingBox();
            const btnBox = await detachBtn.boundingBox();

            expect(btnBox.y).toBeGreaterThanOrEqual(headerBox.y);
            expect(btnBox.y + btnBox.height).toBeLessThanOrEqual(
                headerBox.y + headerBox.height + 2
            );
        }
    });
});
