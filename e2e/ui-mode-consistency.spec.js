// @ts-check
const { test, expect } = require('@playwright/test');
const { showFullToolbar, setUIMode, enableAllGadgets, openSidebarGroup } = require('./helpers');

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

  test('F2 shortcut opens command palette without cycling display modes', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    await page.keyboard.press('F2');
    await page.waitForTimeout(220);
    const state = await page.evaluate(() => ({
      mode: document.documentElement.getAttribute('data-ui-mode'),
      retiredChromeVisible: document.body.getAttribute('data-top-chrome-visible'),
      commandPaletteVisible: window.commandPalette ? window.commandPalette.isVisible : false,
      focusedId: document.activeElement ? document.activeElement.id : ''
    }));
    expect(state.mode).toBe('normal');
    expect(state.retiredChromeVisible).toBeNull();
    expect(state.commandPaletteVisible).toBe(true);
    expect(state.focusedId).toBe('command-palette-input');
  });

  test('retired top chrome routes no longer create a visible top surface', async ({ page }) => {
    const before = await page.evaluate(() => ({
      visible: document.body.getAttribute('data-top-chrome-visible'),
      trigger: !!document.getElementById('top-chrome-trigger'),
      handle: !!document.getElementById('top-chrome-handle'),
      surface: !!document.getElementById('top-chrome')
    }));
    expect(before.visible).toBeNull();
    expect(before.trigger).toBe(false);
    expect(before.handle).toBe(false);
    expect(before.surface).toBe(false);

    await page.mouse.move(400, 1);
    await page.waitForTimeout(120);
    await expect(page.locator('body')).not.toHaveAttribute('data-top-chrome-visible', 'true');

    await page.evaluate(() => {
      if (window.ZenWriterTopChrome && typeof window.ZenWriterTopChrome.show === 'function') {
        window.ZenWriterTopChrome.show();
      }
    });
    await page.waitForTimeout(120);

    const afterCompatShow = await page.evaluate(() => ({
      visible: document.body.getAttribute('data-top-chrome-visible'),
      commandPaletteVisible: window.commandPalette ? window.commandPalette.isVisible : false,
      focusedId: document.activeElement ? document.activeElement.id : ''
    }));
    expect(afterCompatShow.visible).toBeNull();
    expect(afterCompatShow.commandPaletteVisible).toBe(true);
    expect(afterCompatShow.focusedId).toBe('command-palette-input');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(80);
    await expect(page.locator('#command-palette')).toBeHidden();
    await expect(page.locator('body')).not.toHaveAttribute('data-top-chrome-visible', 'true');
  });

  test('writing status chip is visible only while shell and reader surfaces are hidden', async ({ page }) => {
    const chip = page.locator('#writing-status-chip');
    await expect(chip).toBeVisible();

    await page.keyboard.press('F2');
    await page.waitForTimeout(120);
    await expect(page.locator('body')).not.toHaveAttribute('data-top-chrome-visible', 'true');
    await expect(chip).toBeVisible();
    await page.keyboard.press('Escape');

    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await expect(page.locator('html')).toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(chip).toBeHidden();

    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.exit === 'function') {
        window.ZWReaderPreview.exit();
      }
    });
    await expect(page.locator('html')).not.toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(chip).toBeVisible();
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

  test('command palette hides retired mode/fullscreen/top chrome commands', async ({ page }) => {
    const visibleCommands = await page.evaluate(() => {
      if (!window.commandPalette || typeof window.commandPalette.filterCommands !== 'function') {
        return [];
      }
      window.commandPalette.filterCommands('');
      return (window.commandPalette.filteredCommands || []).map((cmd) => cmd.id);
    });

    expect(visibleCommands).toContain('toggle-sidebar');
    expect(visibleCommands).not.toContain('show-top-chrome');
    expect(visibleCommands).not.toContain('toggle-fullscreen');
    expect(visibleCommands).not.toContain('ui-mode-normal');
    expect(visibleCommands).not.toContain('ui-mode-focus');
    expect(visibleCommands).not.toContain('ui-mode-next');
  });

  test('frameless Electron window grip provides a hidden-chrome drag affordance', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);

    const nonElectronDisplay = await page.evaluate(() => {
      const grip = document.getElementById('electron-window-grip');
      return grip ? window.getComputedStyle(grip).display : null;
    });
    expect(nonElectronDisplay).toBe('none');

    const gripMetrics = await page.evaluate(() => {
      document.documentElement.classList.add('is-electron');
      document.body.classList.add('is-electron');
      document.body.removeAttribute('data-top-chrome-visible');
      document.documentElement.removeAttribute('data-reader-overlay-open');
      if (window.ZenWriterTopChrome && typeof window.ZenWriterTopChrome.hide === 'function') {
        window.ZenWriterTopChrome.hide();
      }
      if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(false);
      }

      const grip = document.getElementById('electron-window-grip');
      const editor = document.getElementById('editor');
      const wysiwyg = document.getElementById('wysiwyg-editor');
      const sidebar = document.getElementById('sidebar');
      const button = document.getElementById('win-minimize');
      const gripStyle = grip ? window.getComputedStyle(grip) : null;
      const gripRect = grip ? grip.getBoundingClientRect() : null;
      const gripX = gripRect ? Math.round(gripRect.left + gripRect.width / 2) : 0;
      const gripY = gripRect ? Math.round(gripRect.top + gripRect.height / 2) : 0;
      const gripIcon = grip ? grip.querySelector('svg, [data-lucide]') : null;
      const gripStack = gripRect
        ? document.elementsFromPoint(gripX, gripY).slice(0, 3).map((element) => ({
          id: element.id || '',
          className: typeof element.className === 'string' ? element.className : '',
          tagName: element.tagName,
        }))
        : [];

      return {
        exists: !!grip,
        ariaHidden: grip ? grip.getAttribute('aria-hidden') : null,
        tabIndex: grip ? grip.tabIndex : null,
        display: gripStyle ? gripStyle.display : null,
        pointerEvents: gripStyle ? gripStyle.pointerEvents : null,
        appRegion: gripStyle ? gripStyle.getPropertyValue('-webkit-app-region').trim() : null,
        opacity: gripStyle ? Number.parseFloat(gripStyle.opacity || '1') : null,
        width: gripRect ? Math.round(gripRect.width) : 0,
        height: gripRect ? Math.round(gripRect.height) : 0,
        left: gripRect ? Math.round(gripRect.left) : null,
        top: gripRect ? Math.round(gripRect.top) : null,
        hasIcon: !!gripIcon,
        gripStack,
        bodyAppRegion: window.getComputedStyle(document.body).getPropertyValue('-webkit-app-region').trim(),
        editorAppRegion: editor ? window.getComputedStyle(editor).getPropertyValue('-webkit-app-region').trim() : null,
        wysiwygAppRegion: wysiwyg ? window.getComputedStyle(wysiwyg).getPropertyValue('-webkit-app-region').trim() : null,
        sidebarAppRegion: sidebar ? window.getComputedStyle(sidebar).getPropertyValue('-webkit-app-region').trim() : null,
        buttonAppRegion: button ? window.getComputedStyle(button).getPropertyValue('-webkit-app-region').trim() : null,
      };
    });

    expect(gripMetrics.exists).toBe(true);
    expect(gripMetrics.ariaHidden).toBe('true');
    expect(gripMetrics.tabIndex).toBe(-1);
    expect(gripMetrics.display).not.toBe('none');
    expect(gripMetrics.pointerEvents).toBe('auto');
    expect(gripMetrics.appRegion).toBe('drag');
    expect(gripMetrics.opacity).toBe(0);
    expect(gripMetrics.width).toBe(44);
    expect(gripMetrics.height).toBe(44);
    expect(gripMetrics.left).toBeGreaterThanOrEqual(8);
    expect(gripMetrics.left).toBeLessThan(16);
    expect(gripMetrics.top).toBeGreaterThanOrEqual(0);
    expect(gripMetrics.top).toBeLessThan(8);
    expect(gripMetrics.hasIcon).toBe(true);
    expect(gripMetrics.gripStack[0]?.id).toBe('electron-window-grip');
    expect(gripMetrics.bodyAppRegion).toBe('no-drag');
    expect(gripMetrics.editorAppRegion).toBe('no-drag');
    expect(gripMetrics.wysiwygAppRegion).toBe('no-drag');
    expect(gripMetrics.sidebarAppRegion).toBe('no-drag');
    expect(gripMetrics.buttonAppRegion).toBe('no-drag');

    await page.locator('#electron-window-grip').hover({ position: { x: 22, y: 22 } });
    await page.waitForTimeout(220);
    const hoveredGrip = await page.evaluate(() => {
      const grip = document.getElementById('electron-window-grip');
      const style = grip ? window.getComputedStyle(grip) : null;
      return {
        opacity: style ? Number.parseFloat(style.opacity || '0') : 0,
        transform: style ? style.transform : null
      };
    });
    expect(hoveredGrip.opacity).toBeGreaterThan(0.5);
    expect(hoveredGrip.transform).not.toBe('none');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-reader-overlay-open', 'true');
    });
    await page.waitForTimeout(220);
    const readerDisabledGrip = await page.evaluate(() => {
      const grip = document.getElementById('electron-window-grip');
      const style = grip ? window.getComputedStyle(grip) : null;
      return {
        pointerEvents: style ? style.pointerEvents : null,
        appRegion: style ? style.getPropertyValue('-webkit-app-region').trim() : null,
        opacity: style ? Number.parseFloat(style.opacity || '1') : null
      };
    });
    expect(readerDisabledGrip.pointerEvents).toBe('none');
    expect(readerDisabledGrip.appRegion).toBe('no-drag');
    expect(readerDisabledGrip.opacity).toBe(0);
  });

  test('Electron right window controls island fades in from the right corner', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);

    const nonElectronDisplay = await page.evaluate(() => {
      const island = document.getElementById('electron-window-controls');
      return island ? window.getComputedStyle(island).display : null;
    });
    expect(nonElectronDisplay).toBe('none');

    const initialMetrics = await page.evaluate(() => {
      document.documentElement.classList.add('is-electron');
      document.body.classList.add('is-electron');
      document.body.removeAttribute('data-top-chrome-visible');
      document.documentElement.removeAttribute('data-reader-overlay-open');
      const island = document.getElementById('electron-window-controls');
      const buttons = island ? Array.from(island.querySelectorAll('.window-control-btn')) : [];
      const grip = document.getElementById('electron-window-grip');
      const islandStyle = island ? window.getComputedStyle(island) : null;
      const gripStyle = grip ? window.getComputedStyle(grip) : null;
      const rect = island ? island.getBoundingClientRect() : null;
      const centerX = rect ? Math.round(rect.left + rect.width / 2) : 0;
      const centerY = rect ? Math.round(rect.top + rect.height / 2) : 0;
      const stack = rect
        ? document.elementsFromPoint(centerX, centerY).slice(0, 4).map((element) => ({
          id: element.id || '',
          className: typeof element.className === 'string' ? element.className : '',
          tagName: element.tagName,
        }))
        : [];

      return {
        exists: !!island,
        display: islandStyle ? islandStyle.display : null,
        opacity: islandStyle ? Number.parseFloat(islandStyle.opacity || '1') : null,
        pointerEvents: islandStyle ? islandStyle.pointerEvents : null,
        appRegion: islandStyle ? islandStyle.getPropertyValue('-webkit-app-region').trim() : null,
        transform: islandStyle ? islandStyle.transform : null,
        buttonCount: buttons.length,
        buttonRegions: buttons.map((button) => window.getComputedStyle(button).getPropertyValue('-webkit-app-region').trim()),
        buttonLabels: buttons.map((button) => button.getAttribute('aria-label')),
        rightGap: rect ? Math.round(window.innerWidth - rect.right) : null,
        top: rect ? Math.round(rect.top) : null,
        stack,
        gripAppRegion: gripStyle ? gripStyle.getPropertyValue('-webkit-app-region').trim() : null,
        gripPointerEvents: gripStyle ? gripStyle.pointerEvents : null,
        gripOpacity: gripStyle ? Number.parseFloat(gripStyle.opacity || '1') : null,
      };
    });

    expect(initialMetrics.exists).toBe(true);
    expect(initialMetrics.display).toBe('flex');
    expect(initialMetrics.opacity).toBe(0);
    expect(initialMetrics.pointerEvents).toBe('auto');
    expect(initialMetrics.appRegion).toBe('no-drag');
    expect(initialMetrics.buttonCount).toBe(3);
    expect(initialMetrics.buttonRegions).toEqual(['no-drag', 'no-drag', 'no-drag']);
    expect(initialMetrics.buttonLabels).toEqual(['最小化', '最大化', '閉じる']);
    expect(initialMetrics.rightGap).toBeGreaterThanOrEqual(0);
    expect(initialMetrics.rightGap).toBeLessThanOrEqual(16);
    expect(initialMetrics.top).toBeGreaterThanOrEqual(0);
    expect(initialMetrics.top).toBeLessThanOrEqual(12);
    expect(initialMetrics.stack.some((entry) => entry.id === 'electron-window-controls')).toBe(true);
    expect(initialMetrics.gripAppRegion).toBe('drag');
    expect(initialMetrics.gripPointerEvents).toBe('auto');
    expect(initialMetrics.gripOpacity).toBe(0);

    await page.locator('#electron-window-controls').hover({ position: { x: 12, y: 12 } });
    await page.waitForTimeout(220);
    const hoveredMetrics = await page.evaluate(() => {
      const island = document.getElementById('electron-window-controls');
      const style = island ? window.getComputedStyle(island) : null;
      return {
        opacity: style ? Number.parseFloat(style.opacity || '0') : 0,
        transform: style ? style.transform : null
      };
    });
    expect(hoveredMetrics.opacity).toBeGreaterThan(0.9);
    expect(hoveredMetrics.transform).not.toBe('none');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-reader-overlay-open', 'true');
    });
    await page.waitForTimeout(220);
    const readerMetrics = await page.evaluate(() => {
      const island = document.getElementById('electron-window-controls');
      const style = island ? window.getComputedStyle(island) : null;
      return {
        opacity: style ? Number.parseFloat(style.opacity || '1') : null,
        pointerEvents: style ? style.pointerEvents : null
      };
    });
    expect(readerMetrics.opacity).toBe(0);
    expect(readerMetrics.pointerEvents).toBe('none');
  });

  test('session 121: left nav enters category mode and pins the selected category', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(false);
      }
    });
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('theme');
      }
    });
    await page.waitForTimeout(150);

    const state = await page.evaluate(() => {
      const html = document.documentElement;
      const shellHeader = document.getElementById('sidebar-shell-header');
      const active = document.querySelector('.accordion-category[data-category="theme"]');
      const hidden = document.querySelector('.accordion-category[data-category="sections"]');
      return {
        navState: html.getAttribute('data-left-nav-state'),
        active: html.getAttribute('data-left-nav-active'),
        shellVisible: shellHeader ? shellHeader.getAttribute('aria-hidden') : null,
        anchorLabel: document.getElementById('sidebar-nav-anchor-label')?.textContent?.trim() || '',
        activeHeaderDisplay: active ? window.getComputedStyle(active.querySelector('.accordion-header')).display : null,
        hiddenCategoryAria: hidden ? hidden.getAttribute('aria-hidden') : null,
        hiddenCategoryPointerEvents: hidden ? window.getComputedStyle(hidden).pointerEvents : null,
        isOpen: document.getElementById('sidebar')?.classList.contains('open') || false,
      };
    });

    expect(state.navState).toBe('category');
    expect(state.active).toBe('theme');
    expect(state.shellVisible).toBe('false');
    expect(state.anchorLabel).toBe('テーマ');
    expect(state.activeHeaderDisplay).toBe('none');
    expect(state.hiddenCategoryAria).toBe('true');
    expect(state.hiddenCategoryPointerEvents).toBe('none');
    expect(state.isOpen).toBe(true);
  });

  test('session 121: left nav back returns from category mode to root', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
    });
    await page.waitForTimeout(150);

    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('advanced');
      }
    });
    await page.waitForTimeout(150);
    await page.click('#sidebar-nav-back');
    await page.waitForTimeout(150);

    const after = await page.evaluate(() => {
      return {
        navState: document.documentElement.getAttribute('data-left-nav-state'),
        active: document.documentElement.getAttribute('data-left-nav-active'),
        shellVisible: document.getElementById('sidebar-shell-header')?.getAttribute('aria-hidden'),
        themeAria: document.querySelector('.accordion-category[data-category="theme"]')?.getAttribute('aria-hidden'),
        sidebarOpenClass: document.getElementById('sidebar')?.classList.contains('open') || false,
      };
    });

    expect(after.navState).toBe('root');
    expect(after.active).toBeNull();
    expect(after.shellVisible).toBe('true');
    expect(after.themeAria).toBe('false');
    expect(after.sidebarOpenClass).toBe(false);
  });

  test('session 122: root left nav clears legacy inline sidebar width', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);

    await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar || !window.sidebarManager) return;

      sidebar.style.width = '320px';
      window.sidebarManager.forceSidebarState(false);
    });
    await page.waitForTimeout(250);

    const metrics = await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      const main = document.querySelector('.main-content');
      if (!sidebar || !main) return null;

      const sidebarWidth = Math.round(sidebar.getBoundingClientRect().width);
      const mainMarginLeft = Math.round(parseFloat(window.getComputedStyle(main).marginLeft || '0'));

      return {
        navState: document.documentElement.getAttribute('data-left-nav-state'),
        inlineWidth: sidebar.style.width,
        sidebarWidth,
        mainMarginLeft
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics.navState).toBe('root');
    expect(metrics.inlineWidth).toBe('');
    expect(metrics.sidebarWidth).toBeLessThanOrEqual(90);
    expect(metrics.mainMarginLeft).toBe(0);
  });

  test('session 126: left nav category content does not collapse during shell expansion', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      if (window.sidebarManager) window.sidebarManager.forceSidebarState(false);
    });
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('advanced');
      }
    });
    await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.style.transition = 'none';
        sidebar.style.width = '4.75rem';
      }
    });

    const metrics = await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar');
      const toolbar = document.querySelector('.sidebar-chrome-toolbar');
      const shellHeader = document.getElementById('sidebar-shell-header');
      const accordion = document.querySelector('.sidebar-accordion');
      const activeContent = document.querySelector('.accordion-category[data-category="advanced"] .accordion-content');
      if (!sidebar || !toolbar || !shellHeader || !accordion || !activeContent) return null;

      return {
        navState: document.documentElement.getAttribute('data-left-nav-state'),
        active: document.documentElement.getAttribute('data-left-nav-active'),
        sidebarWidth: Math.round(sidebar.getBoundingClientRect().width),
        toolbarWidth: Math.round(toolbar.getBoundingClientRect().width),
        shellHeaderWidth: Math.round(shellHeader.getBoundingClientRect().width),
        accordionWidth: Math.round(accordion.getBoundingClientRect().width),
        activeContentWidth: Math.round(activeContent.getBoundingClientRect().width),
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics.navState).toBe('category');
    expect(metrics.active).toBe('advanced');
    expect(metrics.sidebarWidth).toBeLessThan(100);
    expect(metrics.toolbarWidth).toBeGreaterThan(230);
    expect(metrics.shellHeaderWidth).toBeGreaterThan(230);
    expect(metrics.accordionWidth).toBeGreaterThan(230);
    expect(metrics.activeContentWidth).toBeGreaterThan(230);
  });

  test('session 127: sidebar gadget foundation keeps shell controls stable', async ({ page }) => {
    await setUIMode(page, 'normal');
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'structure');
    await page.waitForSelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="Documents"]', { state: 'attached' });

    const metrics = await page.evaluate(() => {
      const html = document.documentElement;
      const toolbar = document.querySelector('.sidebar-chrome-toolbar');
      const dockControls = document.getElementById('sidebar-dock-controls');
      const content = document.querySelector('.accordion-category[data-category="structure"] .accordion-content');
      const panel = document.getElementById('structure-gadgets-panel');
      const wrapper = document.querySelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="Documents"]');
      const header = wrapper ? wrapper.querySelector('.gadget-header') : null;
      const body = wrapper ? wrapper.querySelector('.gadget') : null;
      const menuBtn = document.getElementById('documents-io-menu-btn');
      const tree = document.querySelector('.documents-tree-container');
      const toolbarStyle = toolbar ? window.getComputedStyle(toolbar) : null;
      const dockStyle = dockControls ? window.getComputedStyle(dockControls) : null;
      const headerStyle = header ? window.getComputedStyle(header) : null;
      const menuRect = menuBtn ? menuBtn.getBoundingClientRect() : null;
      const treeStyle = tree ? window.getComputedStyle(tree) : null;
      const contentRect = content ? content.getBoundingClientRect() : null;

      return {
        navState: html.getAttribute('data-left-nav-state'),
        active: html.getAttribute('data-left-nav-active'),
        toolbarPointerEvents: toolbarStyle ? toolbarStyle.pointerEvents : null,
        toolbarOpacity: toolbarStyle ? Number(toolbarStyle.opacity) : null,
        toolbarMaxHeight: toolbarStyle ? parseFloat(toolbarStyle.maxHeight || '0') : null,
        dockDisplay: dockStyle ? dockStyle.display : null,
        contentWidth: contentRect ? Math.round(contentRect.width) : 0,
        panelClientWidth: panel ? panel.clientWidth : 0,
        panelScrollWidth: panel ? panel.scrollWidth : 0,
        wrapperRole: wrapper ? wrapper.getAttribute('role') : null,
        headerDisplay: headerStyle ? headerStyle.display : null,
        headerExpanded: header ? header.getAttribute('aria-expanded') : null,
        bodyHidden: body ? body.getAttribute('aria-hidden') : null,
        menuClasses: menuBtn ? menuBtn.className : '',
        menuWidth: menuRect ? Math.round(menuRect.width) : 0,
        menuHeight: menuRect ? Math.round(menuRect.height) : 0,
        treeScrollbarWidth: treeStyle ? treeStyle.scrollbarWidth : null,
      };
    });

    expect(metrics.navState).toBe('category');
    expect(metrics.active).toBe('structure');
    expect(metrics.toolbarPointerEvents).toBe('none');
    expect(metrics.toolbarOpacity).toBeLessThanOrEqual(0.01);
    expect(metrics.toolbarMaxHeight).toBeLessThanOrEqual(1);
    expect(metrics.dockDisplay).toBe('none');
    expect(metrics.contentWidth).toBeGreaterThan(230);
    expect(metrics.panelScrollWidth).toBeLessThanOrEqual(metrics.panelClientWidth + 2);
    expect(metrics.wrapperRole).toBe('group');
    expect(metrics.headerDisplay).not.toBe('none');
    expect(metrics.headerExpanded).toBe('true');
    expect(metrics.bodyHidden).toBe('false');
    expect(metrics.menuClasses).toContain('zw-shell-control');
    expect(metrics.menuWidth).toBeGreaterThanOrEqual(30);
    expect(metrics.menuHeight).toBeGreaterThanOrEqual(30);
    expect(metrics.treeScrollbarWidth === 'thin' || metrics.treeScrollbarWidth === 'auto').toBe(true);

    await page.evaluate(() => {
      const header = document.querySelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="Documents"] .gadget-header');
      if (header) header.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(120);

    const collapsed = await page.evaluate(() => {
      const wrapper = document.querySelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="Documents"]');
      const header = wrapper ? wrapper.querySelector('.gadget-header') : null;
      const body = wrapper ? wrapper.querySelector('.gadget') : null;
      return {
        wrapperCollapsed: wrapper ? wrapper.getAttribute('data-gadget-collapsed') : null,
        headerExpanded: header ? header.getAttribute('aria-expanded') : null,
        bodyHidden: body ? body.getAttribute('aria-hidden') : null,
      };
    });

    expect(collapsed.wrapperCollapsed).toBe('true');
    expect(collapsed.headerExpanded).toBe('false');
    expect(collapsed.bodyHidden).toBe('true');
  });

  test('session 127: legacy wiki sidebar command resolves into edit category', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('wiki');
      }
    });
    await page.waitForTimeout(150);

    const state = await page.evaluate(() => ({
      navState: document.documentElement.getAttribute('data-left-nav-state'),
      active: document.documentElement.getAttribute('data-left-nav-active'),
      editExpanded: document.querySelector('.accordion-category[data-category="edit"] .accordion-header')?.getAttribute('aria-expanded') || null,
    }));

    expect(state.navState).toBe('category');
    expect(state.active).toBe('edit');
    expect(state.editExpanded).toBe('true');
  });

  test('session 128: Story Wiki and Link Graph fit the shell foundation', async ({ page }) => {
    await setUIMode(page, 'normal');
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'structure');
    await page.waitForSelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="StoryWiki"]', { state: 'attached' });
    await page.waitForSelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="LinkGraph"] .link-graph-container', { state: 'attached' });

    const expandedMetrics = await page.evaluate(() => {
      const storyWrapper = document.querySelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="StoryWiki"]');
      const newButton = storyWrapper ? storyWrapper.querySelector('.swiki-footer .swiki-btn-new') : null;
      const newButtonStyle = newButton ? window.getComputedStyle(newButton) : null;
      const newButtonRect = newButton ? newButton.getBoundingClientRect() : null;
      const graph = document.querySelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="LinkGraph"] .link-graph-container');
      const graphStyle = graph ? window.getComputedStyle(graph) : null;
      return {
        buttonWritingMode: newButtonStyle ? newButtonStyle.writingMode : null,
        buttonWhiteSpace: newButtonStyle ? newButtonStyle.whiteSpace : null,
        buttonHeight: newButtonRect ? Math.round(newButtonRect.height) : 0,
        graphClientWidth: graph ? graph.clientWidth : 0,
        graphScrollWidth: graph ? graph.scrollWidth : 0,
        graphOverflowX: graphStyle ? graphStyle.overflowX : null,
        graphScrollbarWidth: graphStyle ? graphStyle.scrollbarWidth : null,
      };
    });

    expect(expandedMetrics.buttonWritingMode).toBe('horizontal-tb');
    expect(expandedMetrics.buttonWhiteSpace).toBe('nowrap');
    expect(expandedMetrics.buttonHeight).toBeLessThanOrEqual(40);
    expect(expandedMetrics.graphClientWidth).toBeGreaterThan(120);
    expect(expandedMetrics.graphScrollWidth).toBeLessThanOrEqual(expandedMetrics.graphClientWidth + 2);
    expect(expandedMetrics.graphOverflowX).toBe('hidden');
    expect(expandedMetrics.graphScrollbarWidth === 'thin' || expandedMetrics.graphScrollbarWidth === 'auto').toBe(true);

    await page.evaluate(() => {
      const header = document.querySelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="StoryWiki"] .gadget-header');
      if (header) header.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(260);

    const collapsedMetrics = await page.evaluate(() => {
      const storyWrapper = document.querySelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="StoryWiki"]');
      const header = storyWrapper ? storyWrapper.querySelector('.gadget-header') : null;
      const body = storyWrapper ? storyWrapper.querySelector('.gadget') : null;
      const bodyStyle = body ? window.getComputedStyle(body) : null;
      const bodyRect = body ? body.getBoundingClientRect() : null;
      return {
        wrapperCollapsed: storyWrapper ? storyWrapper.getAttribute('data-gadget-collapsed') : null,
        headerExpanded: header ? header.getAttribute('aria-expanded') : null,
        bodyHidden: body ? body.getAttribute('aria-hidden') : null,
        bodyHeight: bodyRect ? Math.round(bodyRect.height) : 0,
        bodyPaddingTop: bodyStyle ? parseFloat(bodyStyle.paddingTop || '0') : 0,
        bodyPaddingBottom: bodyStyle ? parseFloat(bodyStyle.paddingBottom || '0') : 0,
        bodyPointerEvents: bodyStyle ? bodyStyle.pointerEvents : null,
        bodyVisibility: bodyStyle ? bodyStyle.visibility : null,
      };
    });

    expect(collapsedMetrics.wrapperCollapsed).toBe('true');
    expect(collapsedMetrics.headerExpanded).toBe('false');
    expect(collapsedMetrics.bodyHidden).toBe('true');
    expect(collapsedMetrics.bodyHeight).toBeLessThanOrEqual(2);
    expect(collapsedMetrics.bodyPaddingTop).toBeLessThanOrEqual(1);
    expect(collapsedMetrics.bodyPaddingBottom).toBeLessThanOrEqual(1);
    expect(collapsedMetrics.bodyPointerEvents).toBe('none');
    expect(collapsedMetrics.bodyVisibility).toBe('hidden');
  });

  test('session 128: structure compare actions stay compact until invoked', async ({ page }) => {
    await setUIMode(page, 'normal');
    await openSidebarGroup(page, 'structure');

    const metrics = await page.evaluate(() => {
      const controls = document.querySelector('.sidebar-compare-controls');
      const splitView = document.getElementById('split-view-container');
      const controlsRect = controls ? controls.getBoundingClientRect() : null;
      return {
        controlsHeight: controlsRect ? Math.round(controlsRect.height) : 0,
        controlsDisplay: controls ? window.getComputedStyle(controls).display : null,
        splitDisplay: splitView ? window.getComputedStyle(splitView).display : null,
      };
    });

    expect(metrics.controlsDisplay).toBe('grid');
    expect(metrics.controlsHeight).toBeLessThanOrEqual(48);
    expect(metrics.splitDisplay).not.toBe('flex');
  });

  test('session 129: left nav anchor icon follows the active category', async ({ page }) => {
    await setUIMode(page, 'normal');

    const activate = async (categoryId) => {
      await page.evaluate((id) => {
        if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
          window.sidebarManager.activateSidebarGroup(id);
        }
      }, categoryId);
      await page.waitForTimeout(180);
      return page.evaluate(() => {
        const anchor = document.getElementById('sidebar-nav-anchor');
        return {
          active: document.documentElement.getAttribute('data-left-nav-active'),
          label: document.getElementById('sidebar-nav-anchor-label')?.textContent?.trim() || '',
          group: anchor?.dataset.group || '',
          icon: anchor?.dataset.currentIcon || '',
        };
      });
    };

    const sections = await activate('sections');
    expect(sections.active).toBe('sections');
    expect(sections.label).toBe('セクション');
    expect(sections.group).toBe('sections');
    expect(sections.icon).toBe('list-tree');

    const structure = await activate('structure');
    expect(structure.active).toBe('structure');
    expect(structure.label).toBe('構造');
    expect(structure.group).toBe('structure');
    expect(structure.icon).toBe('file-text');

    const sectionsAgain = await activate('sections');
    expect(sectionsAgain.active).toBe('sections');
    expect(sectionsAgain.label).toBe('セクション');
    expect(sectionsAgain.group).toBe('sections');
    expect(sectionsAgain.icon).toBe('list-tree');
  });

  test('friction sweep: left nav title icon is display-only and back icon returns root', async ({ page }) => {
    await setUIMode(page, 'normal');
    await openSidebarGroup(page, 'sections');
    await page.waitForTimeout(150);

    await page.evaluate(() => {
      var anchor = document.getElementById('sidebar-nav-anchor');
      if (anchor) {
        anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    });
    await page.waitForTimeout(120);
    await expect(page.locator('html')).toHaveAttribute('data-left-nav-state', 'category');
    await expect(page.locator('html')).toHaveAttribute('data-left-nav-active', 'sections');

    await page.click('#sidebar-nav-back');
    await page.waitForTimeout(120);
    await expect(page.locator('html')).toHaveAttribute('data-left-nav-state', 'root');
    await expect(page.locator('html')).not.toHaveAttribute('data-left-nav-active', 'sections');
  });

  test('left nav category back rail uses the left column without appearing in root icon rail', async ({ page }) => {
    await setUIMode(page, 'normal');
    await openSidebarGroup(page, 'sections');
    await page.waitForTimeout(150);

    const categoryRail = await page.evaluate(() => {
      var rail = document.getElementById('sidebar-nav-back-rail');
      var back = document.getElementById('sidebar-nav-back');
      var style = rail ? window.getComputedStyle(rail) : null;
      var rect = rail ? rail.getBoundingClientRect() : null;
      var backRect = back ? back.getBoundingClientRect() : null;
      var stack = rect
        ? document.elementsFromPoint(Math.round(rect.left + rect.width / 2), Math.round(rect.top + rect.height / 2)).slice(0, 3).map(function (element) {
          return { id: element.id || '', tagName: element.tagName };
        })
        : [];
      return {
        navState: document.documentElement.getAttribute('data-left-nav-state'),
        visibility: style ? style.visibility : '',
        pointerEvents: style ? style.pointerEvents : '',
        width: rect ? Math.round(rect.width) : 0,
        railTop: rect ? Math.round(rect.top) : 0,
        backBottom: backRect ? Math.round(backRect.bottom) : 0,
        stack: stack
      };
    });
    expect(categoryRail.navState).toBe('category');
    expect(categoryRail.visibility).toBe('visible');
    expect(categoryRail.pointerEvents).toBe('auto');
    expect(categoryRail.width).toBeGreaterThan(60);
    expect(categoryRail.railTop).toBeGreaterThanOrEqual(categoryRail.backBottom);
    expect(categoryRail.stack[0]?.id).toBe('sidebar-nav-back-rail');

    const railBox = await page.locator('#sidebar-nav-back-rail').boundingBox();
    expect(railBox).toBeTruthy();
    await page.mouse.click(Math.round((railBox?.left || 0) + (railBox?.width || 0) / 2), Math.round((railBox?.top || 0) + 180));
    await page.waitForTimeout(160);
    await expect(page.locator('html')).toHaveAttribute('data-left-nav-state', 'root');

    const rootRail = await page.evaluate(() => {
      var rail = document.getElementById('sidebar-nav-back-rail');
      var style = rail ? window.getComputedStyle(rail) : null;
      return {
        visibility: style ? style.visibility : '',
        pointerEvents: style ? style.pointerEvents : ''
      };
    });
    expect(rootRail.visibility).toBe('hidden');
    expect(rootRail.pointerEvents).toBe('none');

    await page.waitForTimeout(650);
    await page.evaluate(() => {
      var edge = document.getElementById('sidebar-edge-rail');
      if (edge) {
        edge.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: 1, clientY: 180 }));
        edge.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 1, clientY: 180 }));
      }
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 1, clientY: 180 }));
    });
    await page.waitForTimeout(220);

    await page.click('.accordion-category[data-category="structure"] .accordion-header');
    await page.waitForTimeout(160);
    await expect(page.locator('html')).toHaveAttribute('data-left-nav-state', 'category');
    await expect(page.locator('html')).toHaveAttribute('data-left-nav-active', 'structure');
  });

  test('friction sweep: root left nav is hidden until edge hover fades it in', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.returnToLeftNavRoot === 'function') {
        window.sidebarManager.returnToLeftNavRoot();
      } else if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(false);
      }
    });
    await page.waitForTimeout(650);

    const atRest = await page.evaluate(() => {
      var sidebar = document.getElementById('sidebar');
      var rail = document.getElementById('sidebar-edge-rail');
      var sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;
      var railStyle = rail ? window.getComputedStyle(rail) : null;
      return {
        navState: document.documentElement.getAttribute('data-left-nav-state'),
        sidebarOpacity: sidebarStyle ? Number(sidebarStyle.opacity) : -1,
        sidebarVisibility: sidebarStyle ? sidebarStyle.visibility : '',
        sidebarPointerEvents: sidebarStyle ? sidebarStyle.pointerEvents : '',
        railVisibility: railStyle ? railStyle.visibility : '',
        railPointerEvents: railStyle ? railStyle.pointerEvents : ''
      };
    });

    expect(atRest.navState).toBe('root');
    expect(atRest.sidebarOpacity).toBeLessThan(0.1);
    expect(atRest.sidebarVisibility).toBe('hidden');
    expect(atRest.sidebarPointerEvents).toBe('none');
    expect(atRest.railVisibility).toBe('visible');
    expect(atRest.railPointerEvents).toBe('auto');

    await page.evaluate(() => {
      var rail = document.getElementById('sidebar-edge-rail');
      if (rail) {
        rail.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: 1, clientY: 180 }));
        rail.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 1, clientY: 180 }));
      }
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 1, clientY: 180 }));
    });
    await page.waitForTimeout(220);

    const hovered = await page.evaluate(() => {
      var sidebar = document.getElementById('sidebar');
      var backRail = document.getElementById('sidebar-nav-back-rail');
      var sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;
      var backRailStyle = backRail ? window.getComputedStyle(backRail) : null;
      return {
        edgeHover: document.documentElement.getAttribute('data-edge-hover-left'),
        opacity: sidebarStyle ? Number(sidebarStyle.opacity) : -1,
        visibility: sidebarStyle ? sidebarStyle.visibility : '',
        pointerEvents: sidebarStyle ? sidebarStyle.pointerEvents : '',
        rootRight: sidebar ? Math.round(sidebar.getBoundingClientRect().right) : 0,
        backRailVisibility: backRailStyle ? backRailStyle.visibility : '',
        backRailPointerEvents: backRailStyle ? backRailStyle.pointerEvents : ''
      };
    });

    expect(hovered.edgeHover).toBe('true');
    expect(hovered.opacity).toBeGreaterThan(0.5);
    expect(hovered.visibility).toBe('visible');
    expect(hovered.pointerEvents).toBe('auto');
    expect(hovered.backRailVisibility).toBe('hidden');
    expect(hovered.backRailPointerEvents).toBe('none');

    await page.evaluate((x) => {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: 180 }));
    }, hovered.rootRight + 8);
    await page.waitForTimeout(220);

    const dismissed = await page.evaluate(() => {
      var sidebar = document.getElementById('sidebar');
      var sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;
      return {
        edgeHover: document.documentElement.getAttribute('data-edge-hover-left'),
        opacity: sidebarStyle ? Number(sidebarStyle.opacity) : -1,
        visibility: sidebarStyle ? sidebarStyle.visibility : '',
        pointerEvents: sidebarStyle ? sidebarStyle.pointerEvents : ''
      };
    });
    expect(dismissed.edgeHover).toBeNull();
    expect(dismissed.opacity).toBeLessThan(0.1);
    expect(dismissed.visibility).toBe('hidden');
    expect(dismissed.pointerEvents).toBe('none');
  });

  test('session 129: sections and structure keep distinct gadget panels', async ({ page }) => {
    await setUIMode(page, 'normal');

    await openSidebarGroup(page, 'sections');
    await page.waitForSelector('#sections-gadgets-panel .gadget-wrapper[data-gadget-name="SectionsNavigator"]', { state: 'attached' });

    const sectionsState = await page.evaluate(() => {
      const collect = (panelId) => [...document.querySelectorAll(`#${panelId} .gadget-wrapper`)]
        .map((wrapper) => wrapper.getAttribute('data-gadget-name'))
        .filter(Boolean);
      const sectionsContent = document.querySelector('.accordion-header[aria-controls="accordion-sections"]')?.closest('.accordion-category')?.querySelector('.accordion-content');
      const structureContent = document.querySelector('.accordion-header[aria-controls="accordion-structure"]')?.closest('.accordion-category')?.querySelector('.accordion-content');
      return {
        active: document.documentElement.getAttribute('data-left-nav-active'),
        label: document.getElementById('sidebar-nav-anchor-label')?.textContent?.trim() || '',
        sectionsHidden: sectionsContent ? sectionsContent.hidden || window.getComputedStyle(sectionsContent).display === 'none' : true,
        structureHidden: structureContent ? structureContent.hidden || window.getComputedStyle(structureContent).display === 'none' : true,
        sectionsGadgets: collect('sections-gadgets-panel'),
        structureGadgets: collect('structure-gadgets-panel'),
      };
    });

    expect(sectionsState.active).toBe('sections');
    expect(sectionsState.label).toBe('セクション');
    expect(sectionsState.sectionsHidden).toBe(false);
    expect(sectionsState.structureHidden).toBe(true);
    expect(sectionsState.sectionsGadgets).toContain('SectionsNavigator');
    expect(sectionsState.sectionsGadgets).not.toContain('Documents');

    await openSidebarGroup(page, 'structure');
    await page.waitForSelector('#structure-gadgets-panel .gadget-wrapper[data-gadget-name="Documents"]', { state: 'attached' });

    const structureState = await page.evaluate(() => {
      const collect = (panelId) => [...document.querySelectorAll(`#${panelId} .gadget-wrapper`)]
        .map((wrapper) => wrapper.getAttribute('data-gadget-name'))
        .filter(Boolean);
      const sectionsContent = document.querySelector('.accordion-header[aria-controls="accordion-sections"]')?.closest('.accordion-category')?.querySelector('.accordion-content');
      const structureContent = document.querySelector('.accordion-header[aria-controls="accordion-structure"]')?.closest('.accordion-category')?.querySelector('.accordion-content');
      return {
        active: document.documentElement.getAttribute('data-left-nav-active'),
        label: document.getElementById('sidebar-nav-anchor-label')?.textContent?.trim() || '',
        sectionsHidden: sectionsContent ? sectionsContent.hidden || window.getComputedStyle(sectionsContent).display === 'none' : true,
        structureHidden: structureContent ? structureContent.hidden || window.getComputedStyle(structureContent).display === 'none' : true,
        sectionsGadgets: collect('sections-gadgets-panel'),
        structureGadgets: collect('structure-gadgets-panel'),
      };
    });

    expect(structureState.active).toBe('structure');
    expect(structureState.label).toBe('構造');
    expect(structureState.sectionsHidden).toBe(true);
    expect(structureState.structureHidden).toBe(false);
    expect(structureState.structureGadgets).toEqual(expect.arrayContaining(['Documents', 'Outline', 'StoryWiki']));
    expect(structureState.structureGadgets).not.toContain('SectionsNavigator');
  });

  test('session 123: root left nav keeps a cue for the last active category', async ({ page }) => {
    await setUIMode(page, 'normal');
    await page.waitForTimeout(150);

    await page.evaluate(() => {
      if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
        window.sidebarManager.activateSidebarGroup('advanced');
      }
    });
    await page.waitForTimeout(150);
    await page.click('#sidebar-nav-back');
    await page.waitForTimeout(150);

    const cue = await page.evaluate(() => {
      const html = document.documentElement;
      const activeSection = document.querySelector('.accordion-category[data-category="advanced"]');
      const activeHeader = activeSection ? activeSection.querySelector('.accordion-header') : null;
      return {
        navState: html.getAttribute('data-left-nav-state'),
        lastActive: html.getAttribute('data-left-nav-last-active'),
        hasCueClass: activeSection ? activeSection.classList.contains('is-last-active-category') : false,
        borderColor: activeHeader ? window.getComputedStyle(activeHeader).borderTopColor : null,
      };
    });

    expect(cue.navState).toBe('root');
    expect(cue.lastActive).toBe('advanced');
    expect(cue.hasCueClass).toBe(true);
    expect(cue.borderColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  // 旧モード値は統合シェルの normal に吸収する
  test('Blank mode fallback: redirected to normal', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZenWriterApp) window.ZenWriterApp.setUIMode('blank');
    });
    await page.waitForTimeout(200);
    const mode = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(mode).toBe('normal');
  });
});
