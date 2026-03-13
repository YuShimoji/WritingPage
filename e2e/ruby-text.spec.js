const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

test.describe('Ruby Text E2E (TASK_054)', () => {
    const pageUrl = '/index.html';

    test('Ruby text {Kanji|Kana} is rendered correctly in preview', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForSelector('#editor', { timeout: 10000 });
        await showFullToolbar(page);

        // Type ruby text syntax
        await page.fill('#editor', '{漢字|かんじ} is ruby text.');

        // Give some time for internal state/debounce
        await page.waitForTimeout(500);

        // Toggle Preview - find the button by ID or icon
        const previewToggle = page.locator('#toggle-preview');
        await previewToggle.click();

        // Wait for the preview container to not be collapsed
        const previewContainer = page.locator('#editor-preview');
        await expect(previewContainer).not.toHaveClass(/editor-preview--collapsed/);

        // Check if ruby element exists with correct content in the panel
        const panel = page.locator('#markdown-preview-panel');
        await expect(panel).toContainText('漢字');

        const rubyHtml = await panel.innerHTML();
        expect(rubyHtml).toContain('<ruby>漢字<rt>かんじ</rt></ruby>');
    });

    test('Multiple ruby texts are rendered correctly', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForSelector('#editor', { timeout: 10000 });
        await showFullToolbar(page);

        await page.fill('#editor', '{蒼|あお}い{空|そら}');
        await page.waitForTimeout(500);

        await page.click('#toggle-preview');

        const panel = page.locator('#markdown-preview-panel');
        await expect(panel).toContainText('蒼');
        await expect(panel).toContainText('空');

        const rubyHtml = await panel.innerHTML();
        expect(rubyHtml).toContain('<ruby>蒼<rt>あお</rt></ruby>');
        expect(rubyHtml).toContain('<ruby>空<rt>そら</rt></ruby>');
    });

    test('Legacy ruby notation |漢字《かな》 is rendered correctly', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForSelector('#editor', { timeout: 10000 });
        await showFullToolbar(page);

        await page.fill('#editor', '|漢字《かんじ》のテスト');
        await page.waitForTimeout(500);

        await page.click('#toggle-preview');

        const panel = page.locator('#markdown-preview-panel');
        const rubyHtml = await panel.innerHTML();
        expect(rubyHtml).toContain('<ruby>漢字<rt>かんじ</rt></ruby>');
    });

    // SP-059 Phase 2: ルビ表示設定テスト
    test('ruby size setting changes rt font-size via CSS variable', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForSelector('#editor', { timeout: 10000 });

        // ルビサイズを変更
        await page.evaluate(() => {
            if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyRubySettings === 'function') {
                window.ZenWriterTheme.applyRubySettings({ sizeRatio: 0.4, position: 'over', visible: true });
            }
        });

        const cssValue = await page.evaluate(() => {
            return document.documentElement.style.getPropertyValue('--ruby-size-ratio').trim();
        });
        expect(cssValue).toBe('0.4em');
    });

    test('ruby visibility toggle hides rt elements', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForSelector('#editor', { timeout: 10000 });

        // ルビを非表示に設定
        await page.evaluate(() => {
            if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyRubySettings === 'function') {
                window.ZenWriterTheme.applyRubySettings({ sizeRatio: 0.5, position: 'over', visible: false });
            }
        });

        const hidden = await page.evaluate(() => {
            return document.documentElement.getAttribute('data-ruby-hidden');
        });
        expect(hidden).toBe('true');

        // 再表示
        await page.evaluate(() => {
            window.ZenWriterTheme.applyRubySettings({ sizeRatio: 0.5, position: 'over', visible: true });
        });

        const notHidden = await page.evaluate(() => {
            return document.documentElement.getAttribute('data-ruby-hidden');
        });
        expect(notHidden).toBeNull();
    });

    test('ruby position setting applies css variable', async ({ page }) => {
        await page.goto(pageUrl);
        await page.waitForSelector('#editor', { timeout: 10000 });

        await page.evaluate(() => {
            if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyRubySettings === 'function') {
                window.ZenWriterTheme.applyRubySettings({ sizeRatio: 0.5, position: 'under', visible: true });
            }
        });

        const cssValue = await page.evaluate(() => {
            return document.documentElement.style.getPropertyValue('--ruby-position').trim();
        });
        expect(cssValue).toBe('under');
    });
});
