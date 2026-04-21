// @ts-check
const { test, expect } = require('@playwright/test');
const { showFullToolbar, setUIMode } = require('./helpers');

/** UIモード (Normal/Focus/Blank) の表示整合性テスト */
test.describe('UI Mode Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await showFullToolbar(page);
  });

  // ===== Normal モード (デフォルト) =====
  test('Normal mode: sidebar chrome toolbar exists', async ({ page }) => {
    const chrome = page.locator('.sidebar-chrome-toolbar');
    await expect(chrome).toHaveCount(1);
  });

  // ===== Focus モード =====
  test('Focus mode: UI mode toggle preserves sidebar open/closed', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.evaluate(() => {
      if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
    });
    await page.waitForTimeout(350);
    await setUIMode(page, 'focus');
    await page.waitForTimeout(350);
    let closed = await page.evaluate(() => {
      const s = document.getElementById('sidebar');
      return !!(s && !s.classList.contains('open'));
    });
    expect(closed).toBe(true);

    await page.evaluate(() => {
      if (window.sidebarManager) window.sidebarManager.forceSidebarState(true);
    });
    await page.waitForTimeout(350);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    await setUIMode(page, 'focus');
    await page.waitForTimeout(350);
    const stillOpen = await page.evaluate(() => {
      const s = document.getElementById('sidebar');
      return !!(s && s.classList.contains('open'));
    });
    expect(stillOpen).toBe(true);
  });

  test('Focus mode: focus chapter panel appears if present', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(100);
    const panel = page.locator('.focus-chapter-panel');
    if (await panel.count() > 0) {
      await expect(panel).toBeVisible();
    }
  });

  test('F2 shortcut exits focus to normal (session 107)', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(150);
    await page.keyboard.press('F2');
    await page.waitForTimeout(200);
    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'normal');
  });

  test('session 108: view-menu の現モード表示は setUIMode で更新される', async ({ page }) => {
    // 回帰テスト — session 107 で setUIMode が ZenWriterUIModeChanged を発火していなかったため
    // view-menu summary 内の現モード表示が初期値「ミニマル」のまま固定されていた問題を固定化
    await setUIMode(page, 'focus');
    await page.waitForTimeout(150);
    const initial = (await page.locator('#view-menu [data-current-mode]').textContent()) || '';
    expect(initial.trim()).toBe('ミニマル');

    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    const afterNormal = (await page.locator('#view-menu [data-current-mode]').textContent()) || '';
    expect(afterNormal.trim()).toBe('通常表示');

    await setUIMode(page, 'focus');
    await page.waitForTimeout(150);
    const backToFocus = (await page.locator('#view-menu [data-current-mode]').textContent()) || '';
    expect(backToFocus.trim()).toBe('ミニマル');
  });

  test('Focus mode: editor layout has no main toolbar strip', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(200);
    const layout = await page.evaluate(() => {
      const visibleEditor = [...document.querySelectorAll('#editor, #wysiwyg-editor')]
        .find((el) => window.getComputedStyle(el).display !== 'none');
      const editorContainer = document.querySelector('.editor-container');
      if (!visibleEditor || !editorContainer) return null;
      return {
        toolbarHidden: document.documentElement.getAttribute('data-toolbar-hidden'),
        containerTop: Math.round(editorContainer.getBoundingClientRect().top),
        editorTop: Math.round(visibleEditor.getBoundingClientRect().top),
        noMainToolbar: !document.getElementById('toolbar')
      };
    });
    expect(layout).not.toBeNull();
    expect(layout.toolbarHidden).toBeNull();
    expect(layout.noMainToolbar).toBe(true);
    // ミニ HUD 等の薄い Chrome で数 px〜数十 px のオフセットがあり得る
    expect(layout.containerTop).toBeLessThanOrEqual(48);
    expect(layout.editorTop).toBeGreaterThanOrEqual(0);
  });

  test('Focus mode: left edge panel does not overlap the writing surface', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-edge-hover-left', 'true');
    });
    await page.waitForTimeout(350);
    const overlap = await page.evaluate(() => {
      const panel = document.getElementById('focus-chapter-panel');
      const visibleEditor = [...document.querySelectorAll('#editor, #wysiwyg-editor')]
        .find((el) => window.getComputedStyle(el).display !== 'none');
      if (!panel || !visibleEditor) return null;
      const panelRect = panel.getBoundingClientRect();
      const editorRect = visibleEditor.getBoundingClientRect();
      return Math.max(0, Math.round(panelRect.right - editorRect.left));
    });
    expect(overlap).toBe(0);
  });

  // ===== Blank モード廃止 (SP-081 Phase 3) =====

  // ===== モード遷移 =====
  test('Focus->Normal round-trip: sidebar chrome remains in DOM', async ({ page }) => {
    await setUIMode(page, 'focus');
    await page.waitForTimeout(100);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(100);
    const chrome = page.locator('.sidebar-chrome-toolbar');
    await expect(chrome).toHaveCount(1);
  });

  test('Focus->Normal: closed sidebar is not reopened implicitly', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
    });
    await page.waitForTimeout(350);

    await setUIMode(page, 'focus');
    await page.waitForTimeout(200);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(350);

    const isOpen = await page.evaluate(() => {
      var sidebar = document.getElementById('sidebar');
      return !!(sidebar && sidebar.classList.contains('open'));
    });
    expect(isOpen).toBe(false);
  });

  test('Normal→Focus: persisted 詳細(sidebarSettingsOpen) is collapsed for minimal rail', async ({ page }) => {
    await page.evaluate(() => {
      const s = window.ZenWriterStorage.loadSettings();
      s.ui = s.ui || {};
      s.ui.sidebarSettingsOpen = true;
      window.ZenWriterStorage.saveSettings(s);
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await showFullToolbar(page);
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    await setUIMode(page, 'focus');
    await page.waitForTimeout(250);
    const wso = await page.evaluate(() => document.documentElement.getAttribute('data-writing-settings-open'));
    expect(wso).toBe('false');
  });

  // Blank->Normal テスト削除 (SP-081 Phase 3: Blank 廃止)
  // MainHubPanel テスト削除 (session 94: パネル廃止)

  // ===== 再生オーバーレイ (SP-078+) =====
  test('再生オーバーレイ: sidebar and floating chrome controls are hidden', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);
    const open = await page.evaluate(() => document.documentElement.getAttribute('data-reader-overlay-open'));
    expect(open).toBe('true');
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeHidden();
  });

  test('再生オーバーレイ: reader-preview is visible', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);
    const preview = page.locator('#reader-preview');
    if (await preview.count() > 0) {
      await expect(preview).toBeVisible();
    }
  });

  test('再生オーバーレイ: current editor content is rendered instead of empty state', async ({ page }) => {
    await page.evaluate(() => {
      const content = '## 第一章\n本文です\n\n### シーン1\nReader確認';
      if (window.ZWContentGuard && typeof window.ZWContentGuard.safeSetContent === 'function') {
        window.ZWContentGuard.safeSetContent(content, { backup: false });
      } else {
        const editor = document.getElementById('editor');
        if (editor) {
          editor.value = content;
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      if (window.ZWContentGuard && typeof window.ZWContentGuard.ensureSaved === 'function') {
        window.ZWContentGuard.ensureSaved({ snapshot: false });
      }
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);
    const text = await page.locator('#reader-preview-inner').innerText();
    expect(text).toContain('第一章');
    expect(text).toContain('Reader確認');
    expect(text).not.toContain('コンテンツがありません');
  });

  test('再生オーバーレイ: 右上コントロールが重ならない', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(300);

    const layout = await page.evaluate(() => {
      var controls = document.getElementById('reader-preview-controls');
      if (!controls) return null;
      var items = Array.from(controls.children).filter(function (el) {
        return window.getComputedStyle(el).display !== 'none';
      }).map(function (el) {
        var r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
      var overlap = false;
      for (var i = 0; i < items.length; i++) {
        for (var j = i + 1; j < items.length; j++) {
          var a = items[i];
          var b = items[j];
          var separated = a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
          if (!separated) overlap = true;
        }
      }
      return { count: items.length, overlap: overlap };
    });

    expect(layout).not.toBeNull();
    expect(layout.count).toBeGreaterThanOrEqual(3);
    expect(layout.overlap).toBe(false);
  });

  test('再生オーバーレイ: exit closes overlay and preserves ui mode', async ({ page }) => {
    const prevMode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.enter();
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      if (window.ZWReaderPreview) window.ZWReaderPreview.exit();
    });
    await page.waitForTimeout(200);
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    const open = await page.evaluate(() => document.documentElement.hasAttribute('data-reader-overlay-open'));
    expect(mode).toBe(prevMode);
    expect(open).toBe(false);
  });

  test('session 110: view-menu パネルからのモード切替が data-ui-mode と表示ラベルに反映される', async ({ page }) => {
    // view-menu の click handler 経由で setUIMode が呼ばれ、
    // data-ui-mode と [data-current-mode] の両方が同期することを検証
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);

    // view-menu を開いてミニマルを click
    await page.evaluate(() => {
      var menu = document.getElementById('view-menu');
      if (menu) menu.open = true;
    });
    await page.waitForTimeout(100);
    await page.click('#view-menu [data-view-action="ui-mode-focus"]');
    await page.waitForTimeout(300);

    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'focus');
    const labelFocus = (await page.locator('#view-menu [data-current-mode]').textContent()) || '';
    expect(labelFocus.trim()).toBe('ミニマル');

    // view-menu を開いて通常表示を click
    await page.evaluate(() => {
      var menu = document.getElementById('view-menu');
      if (menu) menu.open = true;
    });
    await page.waitForTimeout(100);
    await page.click('#view-menu [data-view-action="ui-mode-normal"]');
    await page.waitForTimeout(300);

    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'normal');
    const labelNormal = (await page.locator('#view-menu [data-current-mode]').textContent()) || '';
    expect(labelNormal.trim()).toBe('通常表示');
  });

  test('session 118: Electron titlebar lane reserves top chrome and keeps drag ownership on strip root', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);

    const dragCss = await page.evaluate(() => {
      document.documentElement.classList.add('is-electron');
      document.body.classList.add('is-electron');

      if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(true);
      }

      const viewMenu = document.getElementById('view-menu');
      if (viewMenu) viewMenu.open = true;

      const strip = document.querySelector('.electron-drag-strip');
      const title = document.querySelector('.electron-drag-strip__title');
      const main = document.querySelector('.main-content');
      const sidebar = document.getElementById('sidebar');
      const rail = document.getElementById('sidebar-edge-rail');
      const panel = document.querySelector('.view-menu__panel');
      const bodyStyle = window.getComputedStyle(document.body);
      const stripStyle = strip ? window.getComputedStyle(strip) : null;
      const titleStyle = title ? window.getComputedStyle(title) : null;
      const stripRect = strip ? strip.getBoundingClientRect() : null;
      const titlebarHeight = stripRect ? stripRect.height : 0;
      const laneY = Math.max(1, Math.min(window.innerHeight - 1, Math.round(titlebarHeight / 2)));
      const laneX = Math.round(window.innerWidth / 2);
      const topStack = document.elementsFromPoint(laneX, laneY).slice(0, 3).map((element) => ({
        id: element.id || '',
        className: typeof element.className === 'string' ? element.className : '',
        tagName: element.tagName,
      }));

      return {
        bodyAppRegion: bodyStyle.getPropertyValue('-webkit-app-region').trim(),
        stripAppRegion: stripStyle ? stripStyle.getPropertyValue('-webkit-app-region').trim() : null,
        titleAppRegion: titleStyle ? titleStyle.getPropertyValue('-webkit-app-region').trim() : null,
        titlePointerEvents: titleStyle ? titleStyle.pointerEvents : null,
        titlebarHeight,
        stripTop: stripRect ? stripRect.top : null,
        mainTop: main ? main.getBoundingClientRect().top : null,
        sidebarTop: sidebar ? sidebar.getBoundingClientRect().top : null,
        railTop: rail ? rail.getBoundingClientRect().top : null,
        viewMenuPanelTop: panel ? panel.getBoundingClientRect().top : null,
        topStack,
      };
    });

    expect(dragCss.bodyAppRegion).toBe('no-drag');
    expect(dragCss.stripAppRegion).toBe('drag');
    expect(dragCss.titleAppRegion).not.toBe('drag');
    expect(dragCss.titlePointerEvents).toBe('none');
    expect(dragCss.titlebarHeight).toBeGreaterThan(0);
    expect(Math.abs(dragCss.stripTop || 0)).toBeLessThanOrEqual(1);
    expect(dragCss.mainTop || 0).toBeGreaterThanOrEqual(dragCss.titlebarHeight - 1);
    expect(dragCss.sidebarTop || 0).toBeGreaterThanOrEqual(dragCss.titlebarHeight - 1);
    expect(dragCss.railTop || 0).toBeGreaterThanOrEqual(dragCss.titlebarHeight - 1);
    expect(dragCss.viewMenuPanelTop || 0).toBeGreaterThanOrEqual(dragCss.titlebarHeight - 1);
    expect(dragCss.topStack[0]?.className || '').toContain('electron-drag-strip');
  });

  test('session 119: packaged window move interruption dismisses hover-opened sidebar', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
    });
    await page.waitForTimeout(350);

    await page.mouse.move(2, 90);
    await page.waitForTimeout(120);

    let before = await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      return {
        edgeHoverLeft: document.documentElement.getAttribute('data-edge-hover-left'),
        isOpen: !!(sidebar && sidebar.classList.contains('open')),
      };
    });
    expect(before.edgeHoverLeft).toBe('true');
    expect(before.isOpen).toBe(true);

    await page.evaluate(() => {
      if (window.ZWEdgeHover && typeof window.ZWEdgeHover.notifyWindowMoved === 'function') {
        window.ZWEdgeHover.notifyWindowMoved();
      }
    });
    await page.waitForTimeout(150);

    const after = await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      return {
        edgeHoverLeft: document.documentElement.getAttribute('data-edge-hover-left'),
        isOpen: !!(sidebar && sidebar.classList.contains('open')),
      };
    });
    expect(after.edgeHoverLeft).toBeNull();
    expect(after.isOpen).toBe(false);
  });

  // 旧 sp081-detailed-audit から移動: Blank モードは Focus にフォールバック
  test('Blank mode fallback: redirected to Focus', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('blank');
    });
    await page.waitForTimeout(200);
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe('focus');
  });
});
