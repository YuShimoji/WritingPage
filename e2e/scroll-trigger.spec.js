// @ts-nocheck
const { test, expect } = require('@playwright/test');

test.describe('SP-074 Phase 4: Scroll Trigger', () => {
  test('ScrollTriggerController is exposed as global', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const result = await page.evaluate(() => {
      var ctrl = window.ScrollTriggerController;
      if (!ctrl) return null;
      return {
        hasActivate: typeof ctrl.activate === 'function',
        hasDeactivateAll: typeof ctrl.deactivateAll === 'function',
        hasParseDelay: typeof ctrl.parseDelay === 'function',
        hasParseThreshold: typeof ctrl.parseThreshold === 'function',
        hasIsReducedMotion: typeof ctrl.isReducedMotion === 'function'
      };
    });

    expect(result).toBeTruthy();
    expect(result.hasActivate).toBe(true);
    expect(result.hasDeactivateAll).toBe(true);
    expect(result.hasParseDelay).toBe(true);
    expect(result.hasParseThreshold).toBe(true);
  });

  test('TextboxDslParser renders :::zw-scroll as .zw-scroll div', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const html = await page.evaluate(() => {
      var parser = window.TextboxDslParser;
      if (!parser) return null;
      return parser.toHtml(':::zw-scroll{effect:"fade-in"}\nHello scroll\n:::');
    });

    expect(html).toBeTruthy();
    expect(html).toContain('zw-scroll');
    expect(html).toContain('fade-in');
    expect(html).toContain('Hello scroll');
  });

  test('All 5 scroll effects are valid', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const results = await page.evaluate(() => {
      var parser = window.TextboxDslParser;
      if (!parser) return null;
      var effects = ['fade-in', 'slide-up', 'slide-left', 'slide-right', 'zoom-in'];
      return effects.map(function (eff) {
        var html = parser.toHtml(':::zw-scroll{effect:"' + eff + '"}\ntest\n:::');
        return { effect: eff, hasClass: html.indexOf('zw-scroll--' + eff) !== -1 };
      });
    });

    expect(results).toBeTruthy();
    for (const r of results) {
      expect(r.hasClass).toBe(true);
    }
  });

  test('Invalid scroll effect falls back to fade-in', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const html = await page.evaluate(() => {
      var parser = window.TextboxDslParser;
      if (!parser) return null;
      return parser.toHtml(':::zw-scroll{effect:"invalid-effect"}\ntest\n:::');
    });

    expect(html).toBeTruthy();
    expect(html).toContain('zw-scroll--fade-in');
  });
});
