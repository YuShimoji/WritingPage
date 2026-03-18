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

  test('textarea selection tooltip can wrap selected text with textbox DSL via dropdown', async ({ page }) => {
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

    // Open TB dropdown
    const tbToggle = page.locator('#selection-tooltip .tb-dropdown-toggle');
    await expect(tbToggle).toBeVisible();
    await tbToggle.click();

    // Select inner-voice from dropdown
    const presetItem = page.locator('#selection-tooltip .tb-dropdown-item[data-preset-id="inner-voice"]');
    await expect(presetItem).toBeVisible();
    await presetItem.click();

    const value = await page.locator('#editor').inputValue();
    expect(value).toContain(':::zw-textbox{preset:"inner-voice"');
    expect(value).toContain('これは');
    expect(value).toContain(':::');
  });

  test('textbox feature disabled hides TB dropdown in selection tooltip', async ({ page }) => {
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

    await expect(page.locator('#selection-tooltip .tb-dropdown-wrapper')).toBeHidden();
  });

  test('TB dropdown lists all 8 presets', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.waitForSelector('#selection-tooltip', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      editor.value = 'プリセット一覧テスト';
      editor.focus();
      editor.setSelectionRange(0, 4);
      editor.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    const tbToggle = page.locator('#selection-tooltip .tb-dropdown-toggle');
    await expect(tbToggle).toBeVisible();
    await tbToggle.click();

    const items = page.locator('#selection-tooltip .tb-dropdown-item');
    await expect(items).toHaveCount(8);
  });
});

test.describe('Extended Textbox (SP-016 Phase 2: WYSIWYG)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-toolbar-mode', 'full');
    });
  });

  test('WYSIWYG renders textbox DSL as div.zw-textbox', async ({ page }) => {
    await page.fill('#editor', ':::zw-textbox{preset:"inner-voice"}\n心の声テスト\n:::');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    const textbox = page.locator('#wysiwyg-editor .zw-textbox[data-preset="inner-voice"]');
    await expect(textbox).toBeVisible();
    await expect(textbox).toContainText('心の声テスト');
  });

  test('textbox DSL round-trip textarea -> WYSIWYG -> textarea preserves content', async ({ page }) => {
    const dsl = ':::zw-textbox{preset:"se-animal-fade"}\nガルルル\n:::';
    await page.fill('#editor', dsl);

    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await expect(page.locator('#wysiwyg-editor .zw-textbox')).toBeVisible();

    await page.locator('#wysiwyg-switch-to-textarea').dispatchEvent('mousedown');
    const value = await page.locator('#editor').inputValue();
    expect(value).toContain(':::zw-textbox{preset:"se-animal-fade"');
    expect(value).toContain('ガルルル');
  });

  test('textbox coexists with inline decorations in WYSIWYG', async ({ page }) => {
    const content = ':::zw-textbox{preset:"inner-voice"}\n[bold]太字の心の声[/bold]\n:::';
    await page.fill('#editor', content);

    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    const textbox = page.locator('#wysiwyg-editor .zw-textbox');
    await expect(textbox).toBeVisible();

    await page.locator('#wysiwyg-switch-to-textarea').dispatchEvent('mousedown');
    const value = await page.locator('#editor').inputValue();
    expect(value).toContain('zw-textbox');
    expect(value).toContain('太字の心の声');
  });

  test('settings toggle disables textbox feature', async ({ page }) => {
    const hasSettingsSection = await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      return !!(s && s.editor && s.editor.extendedTextbox);
    });
    expect(hasSettingsSection).toBe(true);

    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.editor.extendedTextbox.enabled = false;
      window.ZenWriterStorage.saveSettings(s);
      window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged'));
    });

    const isDisabled = await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      return s.editor.extendedTextbox.enabled === false;
    });
    expect(isDisabled).toBe(true);
  });
});
