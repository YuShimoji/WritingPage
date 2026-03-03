/**
 * E2E: ガジェット切り離し・復帰フロー (TASK_048 Phase 2)
 * ガジェットをフローティングパネルに切り離し、
 * サイドバーに戻す機能をテスト
 */
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

const pageUrl = '/index.html';

async function waitGadgetsReady(page) {
    await page.waitForFunction(() => {
        try {
            return !!window.ZWGadgets && !!document.querySelector('#structure-gadgets-panel');
        } catch (_) {
            return false;
        }
    }, { timeout: 15000 });
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'structure');
    await page.waitForSelector('#structure-gadgets-panel .gadget-wrapper', {
        state: 'visible',
        timeout: 10000,
    });
}

test.describe('Gadget Detach/Restore Flow (TASK_048)', () => {
    test.setTimeout(60000);
    test('gadget wrapper has detach button', async ({ page }) => {
        await page.goto(pageUrl);
        await waitGadgetsReady(page);

        const wrapper = page.locator('#structure-gadgets-panel .gadget-wrapper').first();
        await expect(wrapper).toBeVisible();

        const detachBtn = wrapper.locator('.gadget-detach-btn');
        await expect(detachBtn).toBeVisible();
        await expect(detachBtn).toHaveAttribute('aria-label', 'ガジェットを切り離す');
    });

    test('detachGadget API exists on ZWGadgets', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForSelector('#structure-gadgets-panel', { timeout: 10000 });

        const hasDetach = await page.evaluate(() => {
            return typeof window.ZWGadgets?.detachGadget === 'function';
        });
        expect(hasDetach).toBeTruthy();
    });

    test('restoreGadget API exists on ZWGadgets', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForSelector('#structure-gadgets-panel', { timeout: 10000 });

        const hasRestore = await page.evaluate(() => {
            return typeof window.ZWGadgets?.restoreGadget === 'function';
        });
        expect(hasRestore).toBeTruthy();
    });

    test('detachGadget creates floating panel and persists state', async ({ page }) => {
        await page.goto(pageUrl);
        await waitGadgetsReady(page);

        // panels.jsがロードされるまで待機
        await page.waitForFunction(() => !!window.ZenWriterPanels, { timeout: 10000 });

        const gadgetName = await page.evaluate(() => {
            const wrapper = document.querySelector('#structure-gadgets-panel .gadget-wrapper');
            return wrapper ? wrapper.getAttribute('data-gadget-name') : null;
        });
        expect(gadgetName).toBeTruthy();

        // デタッチを実行
        const detached = await page.evaluate((name) => {
            try {
                if (window.ZWGadgets && typeof window.ZWGadgets.detachGadget === 'function') {
                    window.ZWGadgets.detachGadget(name, 'structure');
                    // 状態が保存されているか確認
                    const prefs = window.ZWGadgets.getPrefs();
                    return prefs.detached && prefs.detached[name] && prefs.detached[name].floating === true;
                }
                return false;
            } catch (e) {
                console.error('detach error:', e);
                return false;
            }
        }, gadgetName);

        expect(detached).toBeTruthy();

        // フローティングパネルが存在するか確認
        const panelId = 'floating-gadget-' + gadgetName;
        const panelExists = await page.evaluate((id) => {
            const el = document.getElementById(id);
            return el !== null && el.style.display !== 'none';
        }, panelId);
        expect(panelExists).toBeTruthy();
    });

    test('restoreGadget clears detached state', async ({ page }) => {
        await page.goto(pageUrl);
        await waitGadgetsReady(page);
        await page.waitForFunction(() => !!window.ZenWriterPanels, { timeout: 10000 });

        const gadgetName = await page.evaluate(() => {
            const wrapper = document.querySelector('#structure-gadgets-panel .gadget-wrapper');
            return wrapper ? wrapper.getAttribute('data-gadget-name') : null;
        });
        expect(gadgetName).toBeTruthy();

        // デタッチ → 復帰フローをテスト
        const restored = await page.evaluate((name) => {
            try {
                if (!window.ZWGadgets) return false;

                // デタッチ
                if (typeof window.ZWGadgets.detachGadget === 'function') {
                    window.ZWGadgets.detachGadget(name, 'structure');
                }

                // 状態確認
                let prefs = window.ZWGadgets.getPrefs();
                const wasDetached = prefs.detached && prefs.detached[name];
                if (!wasDetached) return false;

                // 復帰
                const panelId = 'floating-gadget-' + name;
                if (typeof window.ZWGadgets.restoreGadget === 'function') {
                    window.ZWGadgets.restoreGadget(name, panelId);
                }

                // 状態クリア確認
                prefs = window.ZWGadgets.getPrefs();
                const isCleared = !prefs.detached || !prefs.detached[name];
                return isCleared;
            } catch (e) {
                console.error('restore error:', e);
                return false;
            }
        }, gadgetName);

        expect(restored).toBeTruthy();
    });

    test('floating panel has restore-to-sidebar button', async ({ page }) => {
        await page.goto(pageUrl);
        await waitGadgetsReady(page);
        await page.waitForFunction(() => !!window.ZenWriterPanels, { timeout: 10000 });

        const gadgetName = await page.evaluate(() => {
            const wrapper = document.querySelector('#structure-gadgets-panel .gadget-wrapper');
            return wrapper ? wrapper.getAttribute('data-gadget-name') : null;
        });
        expect(gadgetName).toBeTruthy();

        // デタッチ実行
        await page.evaluate((name) => {
            if (window.ZWGadgets && typeof window.ZWGadgets.detachGadget === 'function') {
                window.ZWGadgets.detachGadget(name, 'structure');
            }
        }, gadgetName);

        // 復帰ボタンが存在するか確認
        const panelId = 'floating-gadget-' + gadgetName;
        const hasRestoreBtn = await page.evaluate((id) => {
            const panel = document.getElementById(id);
            if (!panel) return false;
            return panel.querySelector('.panel-restore-gadget') !== null;
        }, panelId);
        expect(hasRestoreBtn).toBeTruthy();
    });
});
