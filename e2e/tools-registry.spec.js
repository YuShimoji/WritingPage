const { test, expect } = require('@playwright/test');

const pageUrl = '/index.html';

test.describe('Tools Registry Integration', () => {
    test('Header icons match registry definitions', async ({ page }) => {
        await page.goto(pageUrl);

        // Get verify tool definitions from browser
        const tools = await page.evaluate(() => {
            return window.WritingTools.listTools({ entrypoint: 'headerIcon' });
        });

        console.log('Tools found in registry:', tools.length);

        for (const tool of tools) {
            if (!tool.domId) continue;

            const button = page.locator(`#${tool.domId}`);
            await expect(button, `Button #${tool.domId} should be visible`).toBeVisible();

            if (tool.icon) {
                const icon = button.locator('i');
                await expect(icon, `Button #${tool.domId} should have icon ${tool.icon}`).toHaveAttribute('data-lucide', tool.icon);
            }
        }
    });
});
