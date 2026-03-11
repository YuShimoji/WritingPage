// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('SP-058 Heading Typography Phase 1', () => {
  test.beforeEach(async ({ page }) => {
    // テストごとに localStorage をクリア
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
  });

  test('プリセット適用でCSS変数が変わる', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // HeadingPresetRegistry が読み込まれていることを確認
    const registryLoaded = await page.evaluate(() => {
      return typeof window.HeadingPresetRegistry !== 'undefined';
    });
    expect(registryLoaded).toBe(true);

    // デフォルトのCSS変数値を取得
    const defaultH1Size = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-size');
    });
    expect(defaultH1Size.trim()).toBe('1.5em');

    // chapter-title プリセットを適用
    await page.evaluate(() => {
      window.ZenWriterTheme.applyHeadingSettings('chapter-title');
    });

    // CSS変数が変わったことを確認
    const updatedH1Size = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-size');
    });
    expect(updatedH1Size.trim()).toBe('2em');

    // 他のプロパティも確認
    const updatedH1LetterSpacing = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-letter-spacing');
    });
    expect(updatedH1LetterSpacing.trim()).toBe('0.08em');
  });

  test('設定がリロード後に復元される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // chapter-title プリセットを適用
    await page.evaluate(() => {
      window.ZenWriterTheme.applyHeadingSettings('chapter-title');
    });

    // 設定が保存されたことを確認
    const savedPreset = await page.evaluate(() => {
      const settings = window.ZenWriterStorage.loadSettings();
      return settings.heading.preset;
    });
    expect(savedPreset).toBe('chapter-title');

    // リロード
    await page.reload();
    await page.waitForLoadState('networkidle');

    // CSS変数が復元されていることを確認
    const h1Size = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-size');
    });
    expect(h1Size.trim()).toBe('2em');

    // 設定が読み込まれていることを確認
    const reloadedPreset = await page.evaluate(() => {
      const settings = window.ZenWriterStorage.loadSettings();
      return settings.heading.preset;
    });
    expect(reloadedPreset).toBe('chapter-title');
  });

  test('見出し設定変更が本文フォント設定を破壊しない', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // テーマとフォントファミリーを設定 (順序を変更: フォント設定を先に)
    await page.evaluate(() => {
      window.ZenWriterTheme.applyFontSettings(
        '"Noto Serif JP", serif',
        18,
        1.8,
        16,
        18
      );
    });

    // フォント設定が反映されたことを確認
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      window.ZenWriterTheme.applyTheme('night');
    });

    // テーマが反映されたことを確認
    await page.waitForTimeout(100);

    // 設定を確認
    const beforeSettings = await page.evaluate(() => {
      const settings = window.ZenWriterStorage.loadSettings();
      return {
        theme: settings.theme,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight
      };
    });
    expect(beforeSettings.theme).toBe('night');
    expect(beforeSettings.fontFamily).toBe('"Noto Serif JP", serif');
    expect(beforeSettings.fontSize).toBe(18);
    expect(beforeSettings.lineHeight).toBe(1.8);

    // 見出しプリセットを変更
    await page.evaluate(() => {
      window.ZenWriterTheme.applyHeadingSettings('chapter-title');
    });

    // テーマとフォント設定が変わっていないことを確認
    const afterSettings = await page.evaluate(() => {
      const settings = window.ZenWriterStorage.loadSettings();
      return {
        theme: settings.theme,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight,
        headingPreset: settings.heading.preset
      };
    });
    expect(afterSettings.theme).toBe('night');
    expect(afterSettings.fontFamily).toBe('"Noto Serif JP", serif');
    expect(afterSettings.fontSize).toBe(18);
    expect(afterSettings.lineHeight).toBe(1.8);
    expect(afterSettings.headingPreset).toBe('chapter-title');
  });
});

test.describe('SP-058 Heading Typography Phase 2 - UI Gadget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
  });

  test('プリセットselectでCSS変数が変わる', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // テーマアコーディオンを開く
    await page.click('#toggle-sidebar');
    await page.waitForTimeout(200);

    // 設定モードに入る
    const settingsBtn = page.locator('#writing-focus-settings-btn');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(200);
    }

    // テーマカテゴリを展開
    await page.evaluate(() => {
      const header = document.querySelector('.accordion-header[aria-controls="accordion-theme"]');
      if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
    });
    await page.waitForTimeout(300);

    // プリセットselectが存在することを確認
    const selectExists = await page.evaluate(() => {
      return !!document.getElementById('heading-preset-select');
    });
    expect(selectExists).toBe(true);

    // chapter-title に変更
    await page.evaluate(() => {
      var sel = document.getElementById('heading-preset-select');
      if (sel) {
        sel.value = 'chapter-title';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(100);

    // CSS変数が変わったことを確認
    const h1Size = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-size').trim();
    });
    expect(h1Size).toBe('2em');
  });

  test('H1 sizeスライダーでカスタムオーバーライドが保存される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('#toggle-sidebar');
    await page.waitForTimeout(200);
    const settingsBtn = page.locator('#writing-focus-settings-btn');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(200);
    }
    await page.evaluate(() => {
      const header = document.querySelector('.accordion-header[aria-controls="accordion-theme"]');
      if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
    });
    await page.waitForTimeout(300);

    // H1 sizeスライダーを操作
    await page.evaluate(() => {
      var slider = document.querySelector('input[type="range"][data-level="h1"][data-prop="size"]');
      if (slider) {
        slider.value = '2.5';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(100);

    // カスタムオーバーライドが保存されたことを確認
    const saved = await page.evaluate(() => {
      var settings = window.ZenWriterStorage.loadSettings();
      return settings.heading.custom;
    });
    expect(saved.h1).toBeDefined();
    expect(saved.h1.size).toBe('2.5em');

    // CSS変数にも反映
    const h1Size = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-size').trim();
    });
    expect(h1Size).toBe('2.5em');
  });

  test('リセットボタンでプリセット値に復帰する', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // カスタムオーバーライドを設定
    await page.evaluate(() => {
      window.ZenWriterTheme.applyHeadingSettings('default', { h1: { size: '2.5em' } });
    });
    await page.waitForTimeout(100);

    await page.click('#toggle-sidebar');
    await page.waitForTimeout(200);
    const settingsBtn = page.locator('#writing-focus-settings-btn');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(200);
    }
    await page.evaluate(() => {
      const header = document.querySelector('.accordion-header[aria-controls="accordion-theme"]');
      if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
    });
    await page.waitForTimeout(300);

    // リセットボタンクリック
    await page.evaluate(() => {
      var btn = document.getElementById('heading-reset-btn');
      if (btn) btn.click();
    });
    await page.waitForTimeout(100);

    // カスタムが空になったことを確認
    const saved = await page.evaluate(() => {
      var settings = window.ZenWriterStorage.loadSettings();
      return settings.heading;
    });
    expect(saved.custom).toEqual({});

    // CSS変数がデフォルトに戻ったことを確認
    const h1Size = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-size').trim();
    });
    expect(h1Size).toBe('1.5em');
  });
});

test.describe('SP-058 Heading Typography Phase 3 - H4-H6 + Extended Properties', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
  });

  test('H1 lineHeightスライダーでCSS変数が変わる', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // lineHeight を API 経由でカスタム適用
    await page.evaluate(() => {
      window.ZenWriterTheme.applyHeadingSettings('default', { h1: { lineHeight: '1.8' } });
    });
    await page.waitForTimeout(100);

    const h1LineHeight = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-line-height').trim();
    });
    expect(h1LineHeight).toBe('1.8');

    // 設定に保存されていることを確認
    const saved = await page.evaluate(() => {
      return window.ZenWriterStorage.loadSettings().heading.custom;
    });
    expect(saved.h1.lineHeight).toBe('1.8');
  });

  test('H1 letterSpacingスライダーでCSS変数が変わる', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.ZenWriterTheme.applyHeadingSettings('default', { h1: { letterSpacing: '0.1em' } });
    });
    await page.waitForTimeout(100);

    const h1LetterSpacing = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h1-letter-spacing').trim();
    });
    expect(h1LetterSpacing).toBe('0.1em');
  });

  test('H4 sizeカスタムでCSS変数が変わる', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // H4 サイズをカスタムオーバーライド
    await page.evaluate(() => {
      window.ZenWriterTheme.applyHeadingSettings('default', { h4: { size: '1.3em' } });
    });
    await page.waitForTimeout(100);

    const h4Size = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h4-size').trim();
    });
    expect(h4Size).toBe('1.3em');

    // リロード後も復元される
    await page.reload();
    await page.waitForLoadState('networkidle');

    const h4SizeAfter = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--heading-h4-size').trim();
    });
    expect(h4SizeAfter).toBe('1.3em');
  });

  test('H4-H6 sizeスライダーがUI上に存在する', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('#toggle-sidebar');
    await page.waitForTimeout(200);
    const settingsBtn = page.locator('#writing-focus-settings-btn');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(200);
    }
    await page.evaluate(() => {
      const header = document.querySelector('.accordion-header[aria-controls="accordion-theme"]');
      if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
    });
    await page.waitForTimeout(300);

    // H4 sizeスライダーが存在すること（折りたたみ内だが DOM には存在）
    const h4Exists = await page.evaluate(() => {
      return !!document.querySelector('input[type="range"][data-level="h4"][data-prop="size"]');
    });
    expect(h4Exists).toBe(true);

    // H1 lineHeight スライダーが存在すること
    const h1LhExists = await page.evaluate(() => {
      return !!document.querySelector('input[type="range"][data-level="h1"][data-prop="lineHeight"]');
    });
    expect(h1LhExists).toBe(true);

    // H1 letterSpacing スライダーが存在すること
    const h1LsExists = await page.evaluate(() => {
      return !!document.querySelector('input[type="range"][data-level="h1"][data-prop="letterSpacing"]');
    });
    expect(h1LsExists).toBe(true);
  });
});

test.describe('SP-058 Heading Typography Phase 4 - User Presets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForLoadState('networkidle');
  });

  test('ユーザープリセット保存でlistAllPresetsに含まれる', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // カスタム値を適用してからユーザープリセットとして保存
    const result = await page.evaluate(() => {
      var values = { h1: { size: '2.2em', weight: '800' }, h2: { size: '1.6em' } };
      var entry = window.HeadingPresetRegistry.saveUserPreset(window.ZenWriterStorage, 'My Novel', values);
      if (!entry) return null;
      var all = window.HeadingPresetRegistry.listAllPresets(window.ZenWriterStorage.loadSettings());
      return { entryId: entry.id, allIds: all.map(function (p) { return p.id; }) };
    });

    expect(result).not.toBeNull();
    expect(result.entryId).toMatch(/^user-/);
    expect(result.allIds).toContain(result.entryId);
  });

  test('ユーザープリセット削除でlistAllPresetsから消える', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(() => {
      var values = { h1: { size: '2em' } };
      var entry = window.HeadingPresetRegistry.saveUserPreset(window.ZenWriterStorage, 'Temp', values);
      if (!entry) return null;

      // 削除
      var deleted = window.HeadingPresetRegistry.deleteUserPreset(window.ZenWriterStorage, entry.id);
      var all = window.HeadingPresetRegistry.listAllPresets(window.ZenWriterStorage.loadSettings());
      var ids = all.map(function (p) { return p.id; });
      return { deleted: deleted, stillContains: ids.indexOf(entry.id) >= 0 };
    });

    expect(result).not.toBeNull();
    expect(result.deleted).toBe(true);
    expect(result.stillContains).toBe(false);
  });

  test('ユーザープリセットがリロード後も保持される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 保存
    const savedId = await page.evaluate(() => {
      var values = { h1: { size: '1.9em', weight: '600' } };
      var entry = window.HeadingPresetRegistry.saveUserPreset(window.ZenWriterStorage, 'Persist Test', values);
      return entry ? entry.id : null;
    });
    expect(savedId).not.toBeNull();

    // リロード
    await page.reload();
    await page.waitForLoadState('networkidle');

    // リロード後も存在確認
    const found = await page.evaluate((id) => {
      var all = window.HeadingPresetRegistry.listAllPresets(window.ZenWriterStorage.loadSettings());
      return all.some(function (p) { return p.id === id; });
    }, savedId);
    expect(found).toBe(true);
  });

  test('組み込みプリセットは削除不可', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(() => {
      var r1 = window.HeadingPresetRegistry.deleteUserPreset(window.ZenWriterStorage, 'default');
      var r2 = window.HeadingPresetRegistry.deleteUserPreset(window.ZenWriterStorage, 'chapter-title');
      var r3 = window.HeadingPresetRegistry.deleteUserPreset(window.ZenWriterStorage, 'body-emphasis');
      var all = window.HeadingPresetRegistry.listAllPresets(window.ZenWriterStorage.loadSettings());
      var builtInIds = all.filter(function (p) { return p.builtIn; }).map(function (p) { return p.id; });
      return { r1: r1, r2: r2, r3: r3, builtInIds: builtInIds };
    });

    expect(result.r1).toBe(false);
    expect(result.r2).toBe(false);
    expect(result.r3).toBe(false);
    expect(result.builtInIds).toContain('default');
    expect(result.builtInIds).toContain('chapter-title');
    expect(result.builtInIds).toContain('body-emphasis');
  });
});
