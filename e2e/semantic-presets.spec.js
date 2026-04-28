// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { showFullToolbar, switchToTextareaMode } = require('./helpers');

test.describe('SP-060 Semantic Presets', () => {
  test('TextboxPresetRegistry lists all 8 presets (3 legacy + 5 semantic)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const presets = await page.evaluate(() => {
      return window.TextboxPresetRegistry.list({});
    });

    expect(presets.length).toBe(8);
    const ids = presets.map(p => p.id);
    expect(ids).toContain('inner-voice');
    expect(ids).toContain('dialogue');
    expect(ids).toContain('monologue');
    expect(ids).toContain('narration');
    expect(ids).toContain('chant');
    expect(ids).toContain('warning');
  });

  test('semantic preset resolve returns correct role', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      const reg = window.TextboxPresetRegistry;
      return {
        dialogue: reg.resolve('dialogue', {}).role,
        monologue: reg.resolve('monologue', {}).role,
        narration: reg.resolve('narration', {}).role,
        chant: reg.resolve('chant', {}).role,
        warning: reg.resolve('warning', {}).role
      };
    });

    expect(result.dialogue).toBe('dialogue');
    expect(result.monologue).toBe('monologue');
    expect(result.narration).toBe('narration');
    expect(result.chant).toBe('custom');
    expect(result.warning).toBe('system');
  });

  test('dialogue preset renders with minimal decoration in preview', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', ':::zw-textbox{preset:"dialogue"}\n「こんにちは」\n:::');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

    const box = page.locator('#markdown-preview-panel .zw-textbox--dialogue');
    await expect(box).toBeVisible();
    await expect(box.locator('.decor-italic')).toHaveCount(0);
    await expect(box.locator('.anim-fade-in')).toHaveCount(0);
  });

  test('monologue preset renders with italic + fadein in preview', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', ':::zw-textbox{preset:"monologue"}\n心の中で思った\n:::');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

    const box = page.locator('#markdown-preview-panel .zw-textbox--monologue');
    await expect(box).toBeVisible();
    await expect(box.locator('.decor-italic')).toContainText('心の中で思った');
  });

  test('warning preset renders with danger styling in preview', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', ':::zw-textbox{preset:"warning"}\n危険です\n:::');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

    const box = page.locator('#markdown-preview-panel .zw-textbox--warning');
    await expect(box).toBeVisible();
    await expect(box.locator('.decor-bold')).toContainText('危険です');
  });

  test('semantic preset WYSIWYG round-trip preserves DSL', async ({ page }) => {
    await page.goto('/');
    await showFullToolbar(page);
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    await switchToTextareaMode(page);
    await page.fill('#editor', ':::zw-textbox{preset:"narration"}\n語りの文章\n:::');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await expect(page.locator('#wysiwyg-editor .zw-textbox[data-preset="narration"]')).toBeVisible();

    await switchToTextareaMode(page);
    const value = await page.locator('#editor').inputValue();
    expect(value).toContain(':::zw-textbox{preset:"narration"');
    expect(value).toContain('語りの文章');
  });

  test('chant preset round-trip preserves bold + ornament', async ({ page }) => {
    await page.goto('/');
    await showFullToolbar(page);

    await page.fill('#editor', ':::zw-textbox{preset:"chant"}\n詠唱開始\n:::');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

    const box = page.locator('#markdown-preview-panel .zw-textbox--chant');
    await expect(box).toBeVisible();
    await expect(box.locator('.decor-bold')).toContainText('詠唱開始');
    await expect(box).toHaveClass(/zw-ornament-burst/);
  });
});
