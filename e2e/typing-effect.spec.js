// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

test.describe('SP-074 Phase 2: Typing Effect', () => {
  test('TypingEffectController is exposed as global', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var ctrl = window.TypingEffectController;
      if (!ctrl) return null;
      return {
        hasActivate: typeof ctrl.activate === 'function',
        hasDeactivateAll: typeof ctrl.deactivateAll === 'function',
        hasParseSpeed: typeof ctrl.parseSpeed === 'function',
        hasIsReducedMotion: typeof ctrl.isReducedMotion === 'function'
      };
    });

    expect(result).toBeTruthy();
    expect(result.hasActivate).toBe(true);
    expect(result.hasDeactivateAll).toBe(true);
    expect(result.hasParseSpeed).toBe(true);
  });

  test('parseSpeed returns correct values', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var ctrl = window.TypingEffectController;
      return {
        default30: ctrl.parseSpeed('30ms'),
        plain50: ctrl.parseSpeed('50'),
        empty: ctrl.parseSpeed(''),
        nullVal: ctrl.parseSpeed(null),
        capped: ctrl.parseSpeed('999ms')
      };
    });

    expect(result.default30).toBe(30);
    expect(result.plain50).toBe(50);
    expect(result.empty).toBe(30);
    expect(result.nullVal).toBe(30);
    expect(result.capped).toBe(500);
  });

  test('TextboxDslParser renders :::zw-typing as .zw-typing div', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const html = await page.evaluate(() => {
      var parser = window.TextboxDslParser;
      if (!parser) return null;
      return parser.toHtml(':::zw-typing{speed:"30ms", mode:"auto"}\nタイピングテスト\n:::');
    });

    expect(html).toBeTruthy();
    expect(html).toContain('class="zw-typing"');
    expect(html).toContain('data-speed="30ms"');
    expect(html).toContain('data-mode="auto"');
    expect(html).toContain('タイピングテスト');
  });

  test('default speed is 30ms when not specified', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const html = await page.evaluate(() => {
      var parser = window.TextboxDslParser;
      if (!parser) return null;
      return parser.toHtml(':::zw-typing\nデフォルト速度\n:::');
    });

    expect(html).toContain('data-speed="30ms"');
  });

  test('typing block renders in editor preview', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    await page.fill('#editor', ':::zw-typing{speed:"30ms"}\nタイピング演出テスト\n:::');
    await page.click('#toggle-preview');

    const typingDiv = page.locator('#markdown-preview-panel .zw-typing');
    await expect(typingDiv).toBeVisible({ timeout: 5000 });
    await expect(typingDiv).toHaveAttribute('data-speed', '30ms');
  });

  test('TextboxEffectRenderer handles typing segments', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const html = await page.evaluate(() => {
      var parser = window.TextboxDslParser;
      var renderer = window.TextboxEffectRenderer;
      if (!parser || !renderer) return null;
      var segments = parser.parseSegments(':::zw-typing{speed:"50ms", mode:"click"}\nクリックモード\n:::');
      return renderer.renderSegments(segments, {});
    });

    expect(html).toBeTruthy();
    expect(html).toContain('class="zw-typing"');
    expect(html).toContain('data-speed="50ms"');
    expect(html).toContain('data-mode="click"');
    expect(html).toContain('クリックモード');
  });

  test('typing effect activates on container', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      // Create a test container with typing markup
      var container = document.createElement('div');
      container.innerHTML = '<div class="zw-typing" data-speed="10" data-mode="auto" aria-live="polite">'
        + '<span class="zw-typing__text">ABC</span>'
        + '<span class="zw-typing__full sr-only">ABC</span>'
        + '</div>';
      document.body.appendChild(container);

      var ctrl = window.TypingEffectController;
      if (!ctrl) return { error: 'no controller' };

      var cleanup = ctrl.activate(container);

      // Check that characters were split
      var chars = container.querySelectorAll('.zw-typing__char');
      var charCount = chars.length;
      var firstCharOpacity = chars.length > 0 ? chars[0].style.opacity : null;

      // Cleanup
      cleanup();
      document.body.removeChild(container);

      return {
        charCount: charCount,
        firstCharOpacity: firstCharOpacity,
        hasActivatedAttr: true
      };
    });

    expect(result.charCount).toBe(3);
    expect(result.firstCharOpacity).toBe('0');
  });

  test('reduced motion shows all text immediately', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      document.documentElement.setAttribute('data-reduce-motion', 'true');

      var container = document.createElement('div');
      container.innerHTML = '<div class="zw-typing" data-speed="30" data-mode="auto" aria-live="polite">'
        + '<span class="zw-typing__text">テスト</span>'
        + '<span class="zw-typing__full sr-only">テスト</span>'
        + '</div>';
      document.body.appendChild(container);

      var ctrl = window.TypingEffectController;
      var cleanup = ctrl.activate(container);

      var typingEl = container.querySelector('.zw-typing');
      var hasComplete = typingEl.classList.contains('zw-typing--complete');

      cleanup();
      document.body.removeChild(container);
      document.documentElement.removeAttribute('data-reduce-motion');

      return { hasComplete: hasComplete };
    });

    expect(result.hasComplete).toBe(true);
  });

  test('WYSIWYG round-trip preserves typing content', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await showFullToolbar(page);

    const dsl = ':::zw-typing{speed:"30ms", mode:"auto"}\nタイプライター\n:::';
    await page.fill('#editor', dsl);

    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    // WYSIWYG should render the typing block visually
    const typingDiv = page.locator('#wysiwyg-editor .zw-typing');
    const hasTyping = await typingDiv.count();
    // Content text should be preserved in some form
    const wysiwygText = await page.locator('#wysiwyg-editor').textContent();
    expect(wysiwygText).toContain('タイプライター');
  });

  test('TextboxDslParser renders :::zw-dialog as .zw-dialog div', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const html = await page.evaluate(() => {
      var parser = window.TextboxDslParser;
      if (!parser) return null;
      return parser.toHtml(':::zw-dialog{speaker:"Alice", position:"left"}\nこんにちは\n:::');
    });

    expect(html).toBeTruthy();
    expect(html).toContain('zw-dialog');
    expect(html).toContain('zw-dialog--left');
    expect(html).toContain('Alice');
    expect(html).toContain('こんにちは');
  });
});
