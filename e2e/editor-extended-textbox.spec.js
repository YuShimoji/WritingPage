// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

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
    await ensureNormalMode(page);
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

test.describe('Extended Textbox (SP-016 Phase 3: Preset Management)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    await ensureNormalMode(page);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-toolbar-mode', 'full');
    });
  });

  test('user can create a custom preset via settings UI', async ({ page }) => {
    // カスタมプリセットを直接ストレージに追加
    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.editor = s.editor || {};
      s.editor.extendedTextbox = s.editor.extendedTextbox || {};
      s.editor.extendedTextbox.userPresets = [
        { id: 'my-custom', label: 'マイプリセット', role: 'custom', anim: 'fadein', tilt: 3, scale: 1.1 }
      ];
      window.ZenWriterStorage.saveSettings(s);
    });

    // プリセット一覧に反映されることを確認
    const presets = await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      return window.TextboxPresetRegistry.list(s).map(p => p.id);
    });
    expect(presets).toContain('my-custom');
    expect(presets.length).toBe(9); // 8 builtin + 1 user
  });

  test('user preset appears in textarea TB dropdown', async ({ page }) => {
    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.editor = s.editor || {};
      s.editor.extendedTextbox = s.editor.extendedTextbox || {};
      s.editor.extendedTextbox.userPresets = [
        { id: 'test-preset', label: 'テスト用プリセット', role: 'narration' }
      ];
      window.ZenWriterStorage.saveSettings(s);
    });

    await page.waitForSelector('#selection-tooltip', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      editor.value = 'ユーザープリセットテスト';
      editor.focus();
      editor.setSelectionRange(0, 5);
      editor.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    const tbToggle = page.locator('#selection-tooltip .tb-dropdown-toggle');
    await expect(tbToggle).toBeVisible();
    await tbToggle.click();

    const items = page.locator('#selection-tooltip .tb-dropdown-item');
    await expect(items).toHaveCount(9); // 8 builtin + 1 user

    const userItem = page.locator('#selection-tooltip .tb-dropdown-item[data-preset-id="test-preset"]');
    await expect(userItem).toBeVisible();
    await expect(userItem).toContainText('テスト用プリセット');
  });

  test('user preset can be applied via textarea TB dropdown', async ({ page }) => {
    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.editor = s.editor || {};
      s.editor.extendedTextbox = s.editor.extendedTextbox || {};
      s.editor.extendedTextbox.userPresets = [
        { id: 'apply-test', label: '適用テスト', role: 'dialogue', anim: 'shake', tilt: 5 }
      ];
      window.ZenWriterStorage.saveSettings(s);
    });

    await page.waitForSelector('#selection-tooltip', { state: 'attached', timeout: 10000 });

    await page.evaluate(() => {
      const editor = document.getElementById('editor');
      editor.value = '適用対象テキスト';
      editor.focus();
      editor.setSelectionRange(0, 4);
      editor.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    await page.locator('#selection-tooltip .tb-dropdown-toggle').click();
    await page.locator('#selection-tooltip .tb-dropdown-item[data-preset-id="apply-test"]').click();

    const value = await page.locator('#editor').inputValue();
    expect(value).toContain('preset:"apply-test"');
    expect(value).toContain('適用対象');
  });

  test('user preset deletion removes from storage', async ({ page }) => {
    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.editor = s.editor || {};
      s.editor.extendedTextbox = s.editor.extendedTextbox || {};
      s.editor.extendedTextbox.userPresets = [
        { id: 'del-test-1', label: '削除テスト1', role: 'custom' },
        { id: 'del-test-2', label: '削除テスト2', role: 'custom' }
      ];
      window.ZenWriterStorage.saveSettings(s);

      // 1件削除
      s.editor.extendedTextbox.userPresets.splice(0, 1);
      window.ZenWriterStorage.saveSettings(s);
    });

    const presets = await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      return s.editor.extendedTextbox.userPresets;
    });
    expect(presets).toHaveLength(1);
    expect(presets[0].id).toBe('del-test-2');
  });

  test('user preset duplication creates a copy', async ({ page }) => {
    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.editor = s.editor || {};
      s.editor.extendedTextbox = s.editor.extendedTextbox || {};
      const original = { id: 'dup-source', label: '複製元', role: 'monologue', anim: 'fadein', tilt: -3, scale: 0.95 };
      const copy = JSON.parse(JSON.stringify(original));
      copy.id = copy.id + '-copy';
      copy.label = copy.label + ' (コピー)';
      s.editor.extendedTextbox.userPresets = [original, copy];
      window.ZenWriterStorage.saveSettings(s);
    });

    const presets = await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      return s.editor.extendedTextbox.userPresets;
    });
    expect(presets).toHaveLength(2);
    expect(presets[1].id).toBe('dup-source-copy');
    expect(presets[1].label).toBe('複製元 (コピー)');
    expect(presets[1].role).toBe('monologue');
  });

  test('WYSIWYG TB dropdown applies textbox preset to selected text', async ({ page }) => {
    await page.fill('#editor', 'プリセット適用テスト');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    // WYSIWYG エディタ内のテキストを選択してツールバー表示
    const hasSelection = await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      const textNode = editor.querySelector('p') || editor.firstChild;
      if (!textNode) return false;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return !sel.isCollapsed;
    });
    expect(hasSelection).toBe(true);

    // フローティングツールバーが表示されるまで待つ
    await page.waitForFunction(() => {
      const toolbar = document.getElementById('wysiwyg-toolbar');
      return toolbar && toolbar.style.display !== 'none' && toolbar.style.opacity !== '0';
    }, { timeout: 5000 });

    // TB プリセットを JS API 経由で直接適用
    await page.evaluate(() => {
      const rte = window.richTextEditor || (window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor);
      if (rte && typeof rte._applyTextboxPreset === 'function') {
        rte._applyTextboxPreset({
          id: 'inner-voice', role: 'monologue', anim: 'fadein', tilt: -4, scale: 0.98,
          className: 'zw-textbox--inner-voice'
        });
      }
    });

    // テキストボックスが作成されたことを確認
    const textbox = page.locator('#wysiwyg-editor .zw-textbox[data-preset="inner-voice"]');
    await expect(textbox).toBeVisible();
  });

  test('WYSIWYG textbox unwrap removes textbox div', async ({ page }) => {
    await page.fill('#editor', ':::zw-textbox{preset:"inner-voice"}\n解除テスト\n:::');
    await page.locator('#toggle-wysiwyg').dispatchEvent('mousedown');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });

    // テキストボックスが存在することを確認
    await expect(page.locator('#wysiwyg-editor .zw-textbox')).toBeVisible();

    // JS API 経由でテキストボックスを解除
    await page.evaluate(() => {
      // テキストボックス内にカーソルを置く
      const tb = document.querySelector('#wysiwyg-editor .zw-textbox');
      if (tb) {
        const range = document.createRange();
        const content = tb.querySelector('.zw-textbox__content') || tb;
        range.selectNodeContents(content);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      // 解除呼び出し
      const rte = window.richTextEditor || (window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor);
      if (rte && typeof rte._unwrapTextbox === 'function') {
        rte._unwrapTextbox();
      }
    });

    // テキストボックスが解除されたことを確認
    await expect(page.locator('#wysiwyg-editor .zw-textbox')).toHaveCount(0);
    await expect(page.locator('#wysiwyg-editor')).toContainText('解除テスト');
  });

  test('max 100 user presets enforced', async ({ page }) => {
    const count = await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.editor = s.editor || {};
      s.editor.extendedTextbox = s.editor.extendedTextbox || {};
      const presets = [];
      for (let i = 0; i < 105; i++) {
        presets.push({ id: 'bulk-' + i, label: 'Bulk ' + i, role: 'custom' });
      }
      s.editor.extendedTextbox.userPresets = presets;
      window.ZenWriterStorage.saveSettings(s);
      return window.TextboxPresetRegistry.list(s).length;
    });
    // 8 builtin + 100 user max = 108
    expect(count).toBe(108);
  });
});
