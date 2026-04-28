// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { showFullToolbar, switchToTextareaMode } = require('./helpers');

test.describe('SP-074 Phase 1: Texture Overlay', () => {
  test('TextAnimationDictionary exposes TEXTURES and getTexture API', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var dict = window.TextAnimationDictionary;
      if (!dict) return null;
      return {
        hasTextures: !!dict.TEXTURES,
        hasGetTexture: typeof dict.getTexture === 'function',
        hasListTextures: typeof dict.listTextures === 'function',
        textureCount: dict.listTextures ? dict.listTextures().length : 0,
        waveClass: dict.getTexture('wave') ? dict.getTexture('wave').className : null,
        fireClass: dict.getTexture('fire') ? dict.getTexture('fire').className : null
      };
    });

    expect(result).toBeTruthy();
    expect(result.hasTextures).toBe(true);
    expect(result.hasGetTexture).toBe(true);
    expect(result.textureCount).toBe(5);
    expect(result.waveClass).toBe('tex-wave');
    expect(result.fireClass).toBe('tex-fire');
  });

  test('preview renders [wave] as span.tex-wave', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', '[wave]波打つテキスト[/wave]');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

    const texSpan = page.locator('#markdown-preview-panel .tex-wave');
    await expect(texSpan).toBeVisible();
    await expect(texSpan).toContainText('波打つテキスト');
  });

  test('all 5 texture types render correctly in preview', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    const textures = ['wave', 'sparkle', 'cosmic', 'fire', 'glitch'];
    const lines = textures.map(t => `[${t}]${t}テスト[/${t}]`).join('\n\n');

    await page.fill('#editor', lines);
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

    for (const t of textures) {
      const span = page.locator(`#markdown-preview-panel .tex-${t}`);
      await expect(span).toBeVisible();
    }
  });

  test('texture has background-clip: text CSS applied', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', '[cosmic]宇宙テキスト[/cosmic]');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

    const texSpan = page.locator('#markdown-preview-panel .tex-cosmic');
    await expect(texSpan).toBeVisible();

    const bgClip = await texSpan.evaluate(el => {
      var style = window.getComputedStyle(el);
      return style.backgroundClip || style.webkitBackgroundClip;
    });
    expect(bgClip).toBe('text');
  });

  test('reduced motion disables texture animation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-reduce-motion', 'true');
    });

    await page.fill('#editor', '[fire]炎テキスト[/fire]');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

    const texSpan = page.locator('#markdown-preview-panel .tex-fire');
    await expect(texSpan).toBeVisible();

    const animName = await texSpan.evaluate(el => {
      return window.getComputedStyle(el).animationName;
    });
    expect(animName).toBe('none');
  });

  test('WYSIWYG round-trip preserves texture markup', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', '[sparkle]キラキラ[/sparkle]');

    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    await switchToTextareaMode(page);
    const value = await page.locator('#editor').inputValue();

    expect(value).toContain('[sparkle]');
    expect(value).toContain('[/sparkle]');
    expect(value).toContain('キラキラ');
  });

  test('texture works alongside existing animations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', '[shake][glitch]グリッチ震え[/glitch][/shake]');
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());

    const glitchSpan = page.locator('#markdown-preview-panel .tex-glitch');
    await expect(glitchSpan).toBeVisible();
    await expect(glitchSpan).toContainText('グリッチ震え');
  });
});
