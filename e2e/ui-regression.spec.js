/**
 * E2E: UI回帰テスト
 * ツールバーアイコン、フローティングパネル位置、ガジェットヘッダーレイアウトを検証
 */
const { test, expect } = require('@playwright/test');
const { showFullToolbar, enableAllGadgets, openSidebarGroup } = require('./helpers');

const pageUrl = '/index.html';

test.describe('Toolbar icon rendering', () => {
    test('font decoration button renders as SVG icon, not text', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        await showFullToolbar(page);

        const btn = page.locator('#toggle-font-decoration');
        await expect(btn).toBeVisible();

        // Lucide がアイコンを SVG に変換していることを確認
        const svg = btn.locator('svg');
        await expect(svg).toBeVisible();

        // テキストノードとして文字が表示されていないことを確認
        const textContent = await btn.evaluate((el) => {
            // SVG 以外の直接テキストノードを収集
            let text = '';
            for (const node of el.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent.trim();
                }
            }
            return text;
        });
        expect(textContent).toBe('');
    });

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

test.describe('Floating panel position', () => {
    test('font decoration panel appears within viewport, not at page bottom', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        await showFullToolbar(page);

        // フォント装飾ボタンをクリックしてパネルを表示
        const btn = page.locator('#toggle-font-decoration');
        await expect(btn).toBeVisible();
        await btn.click();

        const panel = page.locator('#main-hub-panel');
        await expect(panel).toBeVisible({ timeout: 5000 });

        // パネルの位置がビューポート内に収まっていることを確認
        const viewportSize = page.viewportSize();
        const panelBox = await panel.boundingBox();
        expect(panelBox).not.toBeNull();

        // パネルの下端がビューポートの高さを超えていないこと
        expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(viewportSize.height + 5);
        // パネルの上端が0以上であること
        expect(panelBox.y).toBeGreaterThanOrEqual(0);
        // パネルが画面最下部に張り付いていないこと (下端から十分な余裕がある)
        expect(panelBox.y).toBeLessThan(viewportSize.height - 50);
    });

    test('floating panel does not stretch editor area', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        await showFullToolbar(page);

        // パネル表示前のエディタの高さを取得
        const editorHeightBefore = await page.evaluate(() => {
            const editor = document.querySelector('.editor-wrapper') ||
                           document.querySelector('#editor') ||
                           document.querySelector('.app-container');
            return editor ? editor.scrollHeight : 0;
        });

        // フォント装飾パネルを表示
        await page.locator('#toggle-font-decoration').click();
        await page.locator('#main-hub-panel').waitFor({ state: 'visible' });
        await page.waitForTimeout(300); // レイアウト安定待ち

        // パネル表示後のエディタの高さを取得
        const editorHeightAfter = await page.evaluate(() => {
            const editor = document.querySelector('.editor-wrapper') ||
                           document.querySelector('#editor') ||
                           document.querySelector('.app-container');
            return editor ? editor.scrollHeight : 0;
        });

        // エディタの高さが大幅に増加していないこと (100px以上の増加は異常)
        expect(editorHeightAfter - editorHeightBefore).toBeLessThan(100);
    });

    test('floating panel uses position:fixed', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        await showFullToolbar(page);

        await page.locator('#toggle-font-decoration').click();
        const panel = page.locator('#main-hub-panel');
        await expect(panel).toBeVisible({ timeout: 5000 });

        const position = await panel.evaluate((el) =>
            window.getComputedStyle(el).position
        );
        expect(position).toBe('fixed');
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
