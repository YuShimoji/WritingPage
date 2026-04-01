// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { showFullToolbar, switchToTextareaMode } = require('./helpers');

test.describe('Text Expression Tier 1', () => {
  test('preview projects textbox preset into lower-layer classes', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', ':::zw-textbox{preset:"inner-voice"}\nこれはプレビューです\n:::');
    await page.click('#toggle-preview');

    const box = page.locator('#markdown-preview-panel .zw-textbox[data-preset="inner-voice"]');
    await expect(box).toBeVisible();
    await expect(box.locator('.decor-italic')).toContainText('これはプレビューです');
    await expect(box.locator('.anim-fade-in')).toBeAttached();
  });

  test('reduced motion drops textbox animation but keeps static styling', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-reduce-motion', 'true');
    });
    await page.fill('#editor', ':::zw-textbox{preset:"typing-sequence"}\nslow\n:::');
    await page.click('#toggle-preview');

    const box = page.locator('#markdown-preview-panel .zw-textbox--typing-sequence').first();
    await expect(box).toBeVisible();
    await expect(box).toHaveClass(/zw-textbox--motion-reduced/);
    await expect(box.locator('.anim-typewriter')).toHaveCount(0);
    await expect(box).toHaveClass(/zw-ornament-mono/);
  });

  test('WYSIWYG round-trip preserves textbox DSL', async ({ page }) => {
    await page.goto('/');
    await showFullToolbar(page);
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    await switchToTextareaMode(page);
    await page.fill('#editor', ':::zw-textbox{preset:"inner-voice", role:"monologue"}\n往復テスト\n:::');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor .zw-textbox[data-preset="inner-voice"]')).toBeVisible();

    await switchToTextareaMode(page);
    const value = await page.locator('#editor').inputValue();
    expect(value).toContain(':::zw-textbox{preset:"inner-voice"');
    expect(value).toContain('往復テスト');
  });
});
