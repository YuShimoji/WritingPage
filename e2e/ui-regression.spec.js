/**
 * E2E: UI回帰テスト
 * ツールバーアイコン、フローティングパネル位置、ガジェットヘッダーレイアウトを検証
 */
const { test, expect } = require('@playwright/test');
const { showFullToolbar, enableAllGadgets, openSidebarGroup } = require('./helpers');

const pageUrl = '/index.html';

test.describe('Toolbar icon rendering', () => {
    test('all toolbar icons render as SVG', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        await showFullToolbar(page);

        // .iconified ボタン内の <i data-lucide> が全て SVG に変換されているか
        const iconButtons = page.locator('.toolbar-actions .icon-button.iconified');
        const count = await iconButtons.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const btn = iconButtons.nth(i);
            const isVisible = await btn.isVisible();
            if (!isVisible) continue;

            const svg = btn.locator('svg');
            const svgCount = await svg.count();
            const btnId = await btn.getAttribute('id');
            expect(svgCount, `Button #${btnId} should have an SVG icon`).toBeGreaterThan(0);
        }
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

        // ガジェットヘッダーが表示されるまで待機 (structureパネル内を指定 — 単一ガジェットカテゴリのヘッダーは非表示)
        await page.waitForSelector('#structure-gadgets-panel .gadget-header', {
            state: 'visible',
            timeout: 10000,
        });

        const header = page.locator('#structure-gadgets-panel .gadget-header').first();
        await expect(header).toBeVisible();

        // ヘッダーの高さが1行分 (40px以下) であること
        const headerBox = await header.boundingBox();
        expect(headerBox).not.toBeNull();
        expect(headerBox.height).toBeLessThanOrEqual(40);

        // flex-direction が row (横並び) であること
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

            // ボタンのY座標がヘッダーのY座標範囲内にあること (横並びの証拠)
            expect(btnBox.y).toBeGreaterThanOrEqual(headerBox.y);
            expect(btnBox.y + btnBox.height).toBeLessThanOrEqual(
                headerBox.y + headerBox.height + 2
            );
        }
    });
});
