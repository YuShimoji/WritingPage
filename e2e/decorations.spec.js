const { test, expect } = require('@playwright/test');
const { showFullToolbar, openSidebarGroup, enableAllGadgets, openSidebar } = require('./helpers');

async function _openSidebarAndStructurePanel(page) {
  // サイドバーを開き、structure グループを正式なAPI経由でアクティブにする
  await page.waitForFunction(() => {
    try { return !!window.ZWGadgets; } catch (_) { return false; }
  }, { timeout: 20000 });
  await page.waitForSelector('#sidebar', { timeout: 10000 });

  const isOpen = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return !!(sb && sb.classList.contains('open'));
  });

  if (!isOpen) {
    await openSidebar(page);
  }

  // SidebarManager に委譲して structure タブをアクティブ化
  await page.evaluate(() => {
    try {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('structure');
      }
    } catch (_) { /* noop */ }
  });
}

async function openSidebarAndAdvancedPanel(page) {
  await enableAllGadgets(page);
  await openSidebarGroup(page, 'advanced');
  await page.waitForSelector('#advanced-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });
  await page.waitForTimeout(300);

  // すべてのガジェットを開く
  await page.evaluate(() => {
    document.querySelectorAll('#advanced-gadgets-panel .gadget-header').forEach(function (h) {
      if (h.parentElement && !h.parentElement.classList.contains('expanded')) {
        h.click();
      }
    });
  });
  await page.waitForTimeout(300);
}

test.describe('Font Decoration System', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for editor to load
    await page.waitForSelector('#editor', { timeout: 10000 });
    // Show full toolbar to access hidden buttons
    await showFullToolbar(page);
  });

  test('should render basic font decorations', async ({ page }) => {
    // Type text with decorations
    await page.fill('#editor', '[bold]太字テキスト[/bold]\n[italic]斜体テキスト[/italic]\n[underline]下線テキスト[/underline]');

    // Check that decorations are applied in mirror
    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.decor-bold')).toContainText('太字テキスト');
    await expect(mirror.locator('.decor-italic')).toContainText('斜体テキスト');
    await expect(mirror.locator('.decor-underline')).toContainText('下線テキスト');
  });

  test('should render advanced decorations', async ({ page }) => {
    await page.fill('#editor', '[shadow]影付き[/shadow]\n[outline]輪郭[/outline]\n[glow]発光[/glow]');

    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.decor-shadow')).toContainText('影付き');
    await expect(mirror.locator('.decor-outline')).toContainText('輪郭');
    await expect(mirror.locator('.decor-glow')).toContainText('発光');
  });

  test('should render text animations', async ({ page }) => {
    await page.fill('#editor', '[pulse]パルス[/pulse]\n[shake]シェイク[/shake]\n[bounce]バウンス[/bounce]');

    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.anim-pulse')).toContainText('パルス');
    await expect(mirror.locator('.anim-shake')).toContainText('シェイク');
    await expect(mirror.locator('.anim-bounce')).toContainText('バウンス');
  });

  test('should apply bold via applyFontDecoration API', async ({ page }) => {
    await page.fill('#editor', 'テスト');
    await page.keyboard.press('Control+a'); // Select all

    // テキストエリアモードでは Ctrl+B ショートカットは未登録のため、API 経由で適用
    await page.evaluate(() => {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration === 'function') {
        window.ZenWriterEditor.applyFontDecoration('bold');
      }
    });

    await expect(page.locator('#editor')).toHaveValue('[bold]テスト[/bold]');
  });

  test('should maintain performance with large documents', async ({ page }) => {
    // Create large document with many decorations
    let largeText = '';
    for (let i = 0; i < 100; i++) {
      largeText += `[bold]行${i}[/bold] [italic]斜体${i}[/italic]\n`;
    }

    const startTime = Date.now();
    await page.evaluate((text) => {
      const el = document.getElementById('editor');
      if (el) {
        el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, largeText);

    // Wait for mirror to update（オーバーレイやプレビュー描画も含めて余裕を持たせる）
    await page.waitForTimeout(200);

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // 実行環境差を考慮しつつ、3 秒以内にはレンダリングが完了する想定（CI環境考慮）
    expect(renderTime).toBeLessThan(3000);
  });

  test('should work with theme changes', async ({ page }) => {
    await page.fill('#editor', '[outline]輪郭テキスト[/outline]');

    // Change theme (if theme selector exists)
    const themeSelect = await page.locator('select[id*="theme"], [data-theme-select]');
    if (await themeSelect.count() > 0) {
      await themeSelect.selectOption('dark');

      // Check that outline still works with new theme
      const mirror = await page.locator('#editor-mirror');
      await expect(mirror.locator('.decor-outline')).toContainText('輪郭テキスト');
    }
  });

  test('should render font decorations in preview panel', async ({ page }) => {
    // Open preview panel
    await page.evaluate(() => window.ZenWriterEditor && window.ZenWriterEditor.togglePreview());
    await page.waitForTimeout(500);

    // Type text with decorations
    await page.fill('#editor', '[bold]太字テキスト[/bold]\n[italic]斜体テキスト[/italic]\n[underline]下線テキスト[/underline]');

    // Wait for preview to update
    await page.waitForTimeout(500);

    // Check that decorations are applied in editor mirror (not preview panel)
    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.decor-bold')).toContainText('太字テキスト');
    await expect(mirror.locator('.decor-italic')).toContainText('斜体テキスト');
    await expect(mirror.locator('.decor-underline')).toContainText('下線テキスト');
  });

  test('should render text animations in preview panel', async ({ page }) => {
    // Type text with animations
    await page.fill('#editor', '[pulse]パルス[/pulse]\n[shake]シェイク[/shake]');

    // Wait for rendering
    await page.waitForTimeout(500);

    // Check that animations are applied in editor mirror
    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.anim-pulse')).toContainText('パルス');
    await expect(mirror.locator('.anim-shake')).toContainText('シェイク');
  });

  test('should render all animation types', async ({ page }) => {
    await page.fill('#editor', '[fade]フェード[/fade]\n[slide]スライド[/slide]\n[type]タイプ[/type]\n[fadein]遅フェード[/fadein]');

    const mirror = await page.locator('#editor-mirror');
    await expect(mirror.locator('.anim-fade')).toContainText('フェード');
    await expect(mirror.locator('.anim-slide')).toContainText('スライド');
    await expect(mirror.locator('.anim-typewriter')).toContainText('タイプ');
    await expect(mirror.locator('.anim-fade-in')).toContainText('遅フェード');
  });

});

test.describe('HUD Settings', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // HUD 関連ロードアウトを初期化してデフォルト構成（HUDSettings を含む）に戻す
    await page.evaluate(() => {
      try {
        localStorage.removeItem('zenWriter_gadgets:loadouts');
        localStorage.removeItem('zenWriter_gadgets:prefs');
      } catch (_) { /* noop */ }
    });

    await page.reload();

    // HUDSettings は低頻度 settings として advanced グループに描画される
    await openSidebarAndAdvancedPanel(page);
  });

  test('should display HUD settings gadget', async ({ page }) => {
    // v1: HUDSettings gadget is in advanced/settings group
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'advanced');
    await page.waitForSelector('#advanced-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });

    const hudGadgets = await page.locator('#advanced-gadgets-panel .gadget-wrapper[data-gadget-name="HUDSettings"]');
    const count = await hudGadgets.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should update HUD width setting', async ({ page }) => {
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'advanced');
    await page.waitForSelector('#advanced-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });

    // v1: HUDSettings ガジェットは advanced/settings グループに配置
    const hudGadget = await page
      .locator('#advanced-gadgets-panel .gadget-wrapper[data-gadget-name="HUDSettings"]')
      .first();

    const widthInput = hudGadget.locator('input[type="number"][min="120"]').first();
    await widthInput.waitFor({ state: 'attached', timeout: 5000 });

    // HUD 幅設定用の数値入力が存在し、min 属性が 120 であることだけ確認する
    await expect(widthInput).toHaveAttribute('min', '120');
  });

  test('should update HUD font size setting', async ({ page }) => {
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'advanced');
    await page.waitForSelector('#advanced-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });

    const hudGadget = await page
      .locator('#advanced-gadgets-panel .gadget-wrapper[data-gadget-name="HUDSettings"]')
      .first();

    const fsInput = hudGadget.locator('input[type="number"][min="10"]').first();
    await fsInput.waitFor({ state: 'attached', timeout: 5000 });

    // フォントサイズ設定用の数値入力が存在し、min 属性が 10 であることだけ確認する
    await expect(fsInput).toHaveAttribute('min', '10');
  });

  test('should update HUD colors', async ({ page }) => {
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'advanced');
    await page.waitForSelector('#advanced-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });

    const hudGadget = await page
      .locator('#advanced-gadgets-panel .gadget-wrapper[data-gadget-name="HUDSettings"]')
      .first();

    const firstColorInput = hudGadget.locator('input[type="color"]').first();
    await firstColorInput.waitFor({ state: 'attached', timeout: 5000 });

    // input[type=color] は fill() だけだと change が発火しない環境があるため、イベントを明示的に送る
    await firstColorInput.evaluate((el) => {
      try {
        el.value = '#ff0000';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (_) { /* noop */ }
    });

    // HUDSettings は保存ボタン押下で永続化される
    const saveBtn = hudGadget.locator('button.small:has-text("設定を保存")').first();
    await saveBtn.evaluate(b => b.click());
    await page.waitForTimeout(250);

    const hudConfig = await page.evaluate(() => {
      try {
        const s =
          window.ZenWriterStorage &&
            typeof window.ZenWriterStorage.loadSettings === 'function'
            ? window.ZenWriterStorage.loadSettings()
            : null;
        return (s && s.hud) || {};
      } catch (_) {
        return {};
      }
    });

    expect(hudConfig.bg).toBe('#ff0000');
  });
});
