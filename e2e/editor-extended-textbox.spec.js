// @ts-nocheck
const { test, expect } = require('@playwright/test');

test.describe('Extended Textbox (SP-016 Phase 1)', () => {
  test('settings.editor.extendedTextbox defaults are available', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });

    const settings = await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      return s && s.editor && s.editor.extendedTextbox ? s.editor.extendedTextbox : null;
    });

    expect(settings).toBeTruthy();
    expect(settings.enabled).toBe(true);
    expect(settings.defaultPreset).toBe('inner-voice');
    expect(Array.isArray(settings.userPresets)).toBe(true);
  });

  test('textarea selection tooltip can wrap selected text with textbox DSL', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.waitForSelector('#selection-tooltip', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      editor.value = 'これはテストです';
      editor.focus();
      editor.setSelectionRange(0, 3);
      editor.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    const presetBtn = page.locator('#selection-tooltip button[data-action="textbox-inner-voice"]');
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    const value = await page.locator('#editor').inputValue();
    expect(value).toContain(':::zw-textbox{preset:"inner-voice"');
    expect(value).toContain('これは');
    expect(value).toContain(':::');
  });

  test('textbox feature disabled hides textbox buttons in selection tooltip', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.waitForSelector('#selection-tooltip', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.editor = s.editor || {};
      s.editor.extendedTextbox = s.editor.extendedTextbox || {};
      s.editor.extendedTextbox.enabled = false;
      window.ZenWriterStorage.saveSettings(s);
    });

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      editor.value = '機能OFFテスト';
      editor.focus();
      editor.setSelectionRange(0, 2);
      editor.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    await expect(page.locator('#selection-tooltip button[data-action="textbox-inner-voice"]')).toBeHidden();
    await expect(page.locator('#selection-tooltip button[data-action="textbox-se-animal-fade"]')).toBeHidden();
    await expect(page.locator('#selection-tooltip button[data-action="textbox-typing-sequence"]')).toBeHidden();
  });

  test('textbox default preset setting is respected by TB button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.waitForSelector('#selection-tooltip', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.editor = s.editor || {};
      s.editor.extendedTextbox = s.editor.extendedTextbox || {};
      s.editor.extendedTextbox.enabled = true;
      s.editor.extendedTextbox.defaultPreset = 'typing-sequence';
      window.ZenWriterStorage.saveSettings(s);
    });

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      editor.value = 'デフォルトプリセット';
      editor.focus();
      editor.setSelectionRange(0, 4);
      editor.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    const defaultBtn = page.locator('#selection-tooltip button[data-action="textbox-default"]');
    await expect(defaultBtn).toBeVisible();
    await defaultBtn.click();

    const value = await page.locator('#editor').inputValue();
    expect(value).toContain('preset:"typing-sequence"');
  });
});
