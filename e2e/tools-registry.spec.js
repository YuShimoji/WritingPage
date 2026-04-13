const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

const pageUrl = '/index.html';

test.describe('Tools Registry Integration', () => {
    test('WritingTools loads and every domId exists in the page', async ({ page }) => {
        await page.goto(pageUrl);
        await showFullToolbar(page);

        const domIds = await page.evaluate(() => {
            if (!window.WritingTools || typeof window.WritingTools.tools !== 'object') return null;
            return window.WritingTools.tools.map(function (t) {
                return t && t.domId ? t.domId : null;
            }).filter(Boolean);
        });

        expect(domIds, 'WritingTools.tools should be available').not.toBeNull();
        expect(domIds.length, 'At least one tool with domId').toBeGreaterThan(0);

        for (const id of domIds) {
            await expect(page.locator('#' + id), 'Registry domId #' + id + ' must exist').toHaveCount(1);
        }
    });

    test('When tools declare headerIcon entrypoint, controls are visible', async ({ page }) => {
        await page.goto(pageUrl);
        await showFullToolbar(page);

        const tools = await page.evaluate(() => {
            if (!window.WritingTools || typeof window.WritingTools.listTools !== 'function') return null;
            return window.WritingTools.listTools({ entrypoint: 'headerIcon' });
        });

        if (!tools) {
            test.skip();
            return;
        }

        for (const tool of tools) {
            if (!tool.domId) continue;
            const button = page.locator('#' + tool.domId);
            await expect(button, 'Button #' + tool.domId + ' should be visible').toBeVisible();
            if (tool.icon) {
                const icon = button.locator('i, svg').first();
                await expect(icon, 'Button #' + tool.domId + ' should have an icon').toBeAttached({ timeout: 5000 });
            }
        }
    });
});
