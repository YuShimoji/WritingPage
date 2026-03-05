const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

const pageUrl = '/index.html';

test.describe('Tools Registry Integration', () => {
    test('Header icons match registry definitions', async ({ page }) => {
        await page.goto(pageUrl);
        await showFullToolbar(page);

        // Get verify tool definitions from browser
        const tools = await page.evaluate(() => {
            if (!window.WritingTools || typeof window.WritingTools.listTools !== 'function') return null;
            return window.WritingTools.listTools({ entrypoint: 'headerIcon' });
        });

        if (!tools) { test.skip(); return; }

        console.log('Tools found in registry:', tools.length);

        for (const tool of tools) {
            if (!tool.domId) continue;

            const button = page.locator(`#${tool.domId}`);
            await expect(button, `Button #${tool.domId} should be visible`).toBeVisible();

            if (tool.icon) {
                // The icon might be an <i> or an <svg> depending on Lucide load state
                const icon = button.locator('i, svg').first();
                await expect(icon, `Button #${tool.domId} should have an icon`).toBeAttached({ timeout: 5000 });
            }
        }
    });
});
