// @ts-nocheck
const { test, expect } = require('@playwright/test');
const { showFullToolbar } = require('./helpers');

// SP-073 Phase 2: パステキスト制御点ハンドルUI
test.describe('PathText Handle Overlay', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:9080',
        localStorage: [],
      }],
    },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#wysiwyg-editor', { state: 'visible', timeout: 10000 });
    await showFullToolbar(page);

    // パステキストブロックをWYSIWYGに挿入
    await page.evaluate(() => {
      const editor = document.getElementById('wysiwyg-editor');
      if (!editor) return;
      editor.innerHTML = '<p>通常テキスト</p>'
        + '<div class="zw-pathtext" data-path="M 10 80 Q 95 10 180 80">'
        + '<svg viewBox="-10 -10 210 110" class="zw-pathtext__svg" preserveAspectRatio="xMidYMid meet">'
        + '<defs><path id="zw-pathtext-test" d="M 10 80 Q 95 10 180 80" fill="transparent" /></defs>'
        + '<text font-size="1rem" fill="currentColor">'
        + '<textPath href="#zw-pathtext-test" text-anchor="start" startOffset="0%">'
        + '曲線テキスト</textPath></text></svg></div>'
        + '<p>後続テキスト</p>';
    });
  });

  test('PathHandleOverlay module is loaded', async ({ page }) => {
    const loaded = await page.evaluate(() => {
      return !!(window.PathHandleOverlay
        && typeof window.PathHandleOverlay.parsePath === 'function'
        && typeof window.PathHandleOverlay.serializePath === 'function'
        && typeof window.PathHandleOverlay.extractPoints === 'function');
    });
    expect(loaded).toBe(true);
  });

  test('parsePath correctly parses Q command', async ({ page }) => {
    const result = await page.evaluate(() => {
      var cmds = window.PathHandleOverlay.parsePath('M 10 80 Q 95 10 180 80');
      return cmds.map(function (c) { return { cmd: c.cmd, args: c.args }; });
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ cmd: 'M', args: [10, 80] });
    expect(result[1]).toEqual({ cmd: 'Q', args: [95, 10, 180, 80] });
  });

  test('parsePath correctly parses C command', async ({ page }) => {
    const result = await page.evaluate(() => {
      var cmds = window.PathHandleOverlay.parsePath('M 0 0 C 10 20 30 40 50 60');
      return cmds.map(function (c) { return { cmd: c.cmd, args: c.args }; });
    });
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ cmd: 'C', args: [10, 20, 30, 40, 50, 60] });
  });

  test('extractPoints returns correct point types for Q command', async ({ page }) => {
    const points = await page.evaluate(() => {
      var cmds = window.PathHandleOverlay.parsePath('M 10 80 Q 95 10 180 80');
      return window.PathHandleOverlay.extractPoints(cmds).map(function (p) {
        return { x: p.x, y: p.y, type: p.type };
      });
    });
    // M endpoint, Q control, Q endpoint
    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ x: 10, y: 80, type: 'endpoint' });
    expect(points[1]).toEqual({ x: 95, y: 10, type: 'control' });
    expect(points[2]).toEqual({ x: 180, y: 80, type: 'endpoint' });
  });

  test('serializePath round-trips correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      var d = 'M 10 80 Q 95 10 180 80';
      var cmds = window.PathHandleOverlay.parsePath(d);
      return window.PathHandleOverlay.serializePath(cmds);
    });
    expect(result).toBe('M 10 80 Q 95 10 180 80');
  });

  test('clicking pathtext shows control point handles', async ({ page }) => {
    const pathtext = page.locator('.zw-pathtext');
    await pathtext.click();

    // ハンドルが表示されるか
    const handles = page.locator('.zw-pathtext-handle');
    await expect(handles.first()).toBeVisible({ timeout: 3000 });

    // 3点 (M endpoint + Q control + Q endpoint)
    const count = await handles.count();
    expect(count).toBe(3);

    // 編集中クラスが付与
    await expect(pathtext).toHaveClass(/zw-pathtext--editing/);
  });

  test('clicking outside pathtext hides handles', async ({ page }) => {
    const pathtext = page.locator('.zw-pathtext');
    await pathtext.click();
    await expect(page.locator('.zw-pathtext-handle').first()).toBeVisible({ timeout: 3000 });

    // パス外をpointerdownで直接発火 (contenteditable内のバブリングを確実にする)
    await page.evaluate(() => {
      var p = document.querySelector('#wysiwyg-editor p');
      if (p) p.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });

    // ハンドルが消える
    await expect(page.locator('.zw-pathtext-handles')).toHaveCount(0);
    await expect(pathtext).not.toHaveClass(/zw-pathtext--editing/);
  });

  test('guide lines are rendered for control points', async ({ page }) => {
    const pathtext = page.locator('.zw-pathtext');
    await pathtext.click();
    await expect(page.locator('.zw-pathtext-handle').first()).toBeVisible({ timeout: 3000 });

    const guideCount = await page.locator('.zw-pathtext-handle__guide').count();
    expect(guideCount).toBeGreaterThan(0);
  });

  test('applyPointMove updates commands and serializePath reflects change', async ({ page }) => {
    const result = await page.evaluate(() => {
      var PH = window.PathHandleOverlay;
      var cmds = PH.parsePath('M 10 80 Q 95 10 180 80');
      var pts = PH.extractPoints(cmds);
      // 制御点 (index 1) を移動
      PH.applyPointMove(cmds, pts[1], 120, 30);
      return PH.serializePath(cmds);
    });
    expect(result).toContain('120');
    expect(result).toContain('30');
    expect(result).not.toBe('M 10 80 Q 95 10 180 80');
  });

  test('overlay syncDataPath updates data-path on target element', async ({ page }) => {
    // パステキストをクリックしてオーバーレイをアタッチ
    await page.locator('.zw-pathtext').click();
    await expect(page.locator('.zw-pathtext-handle').first()).toBeVisible({ timeout: 3000 });

    // evaluate内でプログラム的にポイントを移動し、syncを呼ぶ
    const newPath = await page.evaluate(() => {
      var editor = window.richTextEditor;
      if (!editor || !editor._pathOverlay) return null;
      var overlay = editor._pathOverlay;
      // コマンドを直接変更
      if (overlay._commands.length >= 2) {
        overlay._commands[1].args[0] = 120; // Q の x1
        overlay._commands[1].args[1] = 30;  // Q の y1
      }
      overlay._updatePath();
      overlay._syncDataPath();
      return document.querySelector('.zw-pathtext').getAttribute('data-path');
    });
    expect(newPath).toBeTruthy();
    expect(newPath).toContain('120');
    expect(newPath).not.toBe('M 10 80 Q 95 10 180 80');
  });

  test('TextboxRichTextBridge serializes pathtext back to DSL', async ({ page }) => {
    const dsl = await page.evaluate(() => {
      var html = '<div class="zw-pathtext" data-path="M 10 80 Q 95 10 180 80">'
        + '<svg viewBox="-10 -10 210 110" class="zw-pathtext__svg">'
        + '<defs><path id="test-p" d="M 10 80 Q 95 10 180 80" fill="transparent" /></defs>'
        + '<text font-size="1rem"><textPath href="#test-p" text-anchor="start" startOffset="0%">'
        + '曲線テキスト</textPath></text></svg></div>';
      var result = window.TextboxRichTextBridge.serializeHtml(html, {});
      if (result.placeholders.length > 0) {
        return result.placeholders[0].dsl;
      }
      return '';
    });
    expect(dsl).toContain(':::zw-pathtext');
    expect(dsl).toContain('曲線テキスト');
    expect(dsl).toContain('path:');
  });

  test('endpoint handles have correct CSS class', async ({ page }) => {
    await page.locator('.zw-pathtext').click();
    await expect(page.locator('.zw-pathtext-handle').first()).toBeVisible({ timeout: 3000 });

    const endpointCount = await page.locator('.zw-pathtext-handle--endpoint').count();
    const controlCount = await page.locator('.zw-pathtext-handle--control').count();
    expect(endpointCount).toBe(2); // M endpoint + Q endpoint
    expect(controlCount).toBe(1); // Q control
  });

  // ---- Phase 3: プリセットパス & コンテキストメニュー ----

  test('preset path generators produce valid path strings', async ({ page }) => {
    const results = await page.evaluate(() => {
      var PH = window.PathHandleOverlay;
      return PH.PRESET_NAMES.map(function (name) {
        return { name: name, path: PH.generatePresetPath(name) };
      });
    });
    expect(results.length).toBe(7);
    for (const r of results) {
      expect(r.path).toBeTruthy();
      expect(r.path).toMatch(/^M/); // 全プリセットは M で始まる
    }
  });

  test('right-click on pathtext shows context menu', async ({ page }) => {
    const pathtext = page.locator('.zw-pathtext');
    await pathtext.click({ button: 'right' });

    const menu = page.locator('.cl-context-menu');
    await expect(menu).toBeVisible({ timeout: 3000 });

    // プリセット項目が7つある
    const presetItems = menu.locator('.cl-context-menu__item');
    const count = await presetItems.count();
    expect(count).toBeGreaterThanOrEqual(10); // 7 presets + 2 side + 1 stroke
  });

  test('context menu has section headers', async ({ page }) => {
    await page.locator('.zw-pathtext').click({ button: 'right' });
    const headers = page.locator('.cl-context-menu__header');
    await expect(headers.first()).toBeVisible({ timeout: 3000 });
    const count = await headers.count();
    expect(count).toBe(2); // パス形状 + テキスト配置方向
  });

  test('selecting a preset changes data-path', async ({ page }) => {
    const pathtext = page.locator('.zw-pathtext');
    const originalPath = await pathtext.getAttribute('data-path');

    await pathtext.click({ button: 'right' });
    await expect(page.locator('.cl-context-menu')).toBeVisible({ timeout: 3000 });

    // '波線' プリセットを選択
    await page.locator('.cl-context-menu__item', { hasText: '波線' }).click();

    const newPath = await pathtext.getAttribute('data-path');
    expect(newPath).not.toBe(originalPath);
    expect(newPath).toContain('Q'); // 波線は Q コマンドを含む
  });

  test('context menu closes after selection', async ({ page }) => {
    await page.locator('.zw-pathtext').click({ button: 'right' });
    await expect(page.locator('.cl-context-menu')).toBeVisible({ timeout: 3000 });

    await page.locator('.cl-context-menu__item', { hasText: '直線' }).click();
    await expect(page.locator('.cl-context-menu')).toHaveCount(0);
  });

  test('stroke toggle changes path stroke attribute', async ({ page }) => {
    // 初期 stroke 状態を取得
    const strokeBefore = await page.evaluate(() => {
      var defPath = document.querySelector('.zw-pathtext .zw-pathtext__svg defs path');
      return defPath ? (defPath.getAttribute('stroke') || '') : '';
    });

    // コンテキストメニューからストロークトグル
    await page.locator('.zw-pathtext').click({ button: 'right' });
    await expect(page.locator('.cl-context-menu')).toBeVisible({ timeout: 3000 });
    // パス線表示/非表示のどちらかのボタンをクリック
    const strokeItem = page.locator('.cl-context-menu__item', { hasText: /パス線を/ });
    await strokeItem.click();

    const strokeAfter = await page.evaluate(() => {
      var defPath = document.querySelector('.zw-pathtext .zw-pathtext__svg defs path');
      return defPath ? (defPath.getAttribute('stroke') || '') : '';
    });
    // トグルなので before と after が異なることを確認
    expect(strokeAfter).not.toBe(strokeBefore);
  });

  test('preset changes update SVG path element', async ({ page }) => {
    await page.locator('.zw-pathtext').click({ button: 'right' });
    await expect(page.locator('.cl-context-menu')).toBeVisible({ timeout: 3000 });
    await page.locator('.cl-context-menu__item', { hasText: 'S字カーブ' }).click();

    const svgD = await page.evaluate(() => {
      var defPath = document.querySelector('.zw-pathtext .zw-pathtext__svg defs path');
      return defPath ? defPath.getAttribute('d') : '';
    });
    expect(svgD).toContain('C'); // S字カーブは C コマンド
  });

  test('preset handles reattach after shape change', async ({ page }) => {
    // まずハンドルを表示
    await page.locator('.zw-pathtext').click();
    await expect(page.locator('.zw-pathtext-handle').first()).toBeVisible({ timeout: 3000 });
    const handlesBefore = await page.locator('.zw-pathtext-handle').count();

    // プリセット変更 (S字カーブ: M + C = 4点)
    await page.locator('.zw-pathtext').click({ button: 'right' });
    await expect(page.locator('.cl-context-menu')).toBeVisible({ timeout: 3000 });
    await page.locator('.cl-context-menu__item', { hasText: 'S字カーブ' }).click();

    // ハンドル数が変わっている
    const handlesAfter = await page.locator('.zw-pathtext-handle').count();
    expect(handlesAfter).toBe(4); // M endpoint + C control1 + C control2 + C endpoint
  });

  // ---- SP-073 Phase 4: フリーハンド描画 ----

  test('simplifyRDP reduces point count', async ({ page }) => {
    const result = await page.evaluate(() => {
      var PH = window.PathHandleOverlay;
      if (!PH || !PH.simplifyRDP) return null;
      var pts = [];
      for (var i = 0; i <= 100; i++) {
        pts.push({ x: i * 2, y: 50 + Math.sin(i * 0.1) * 30 });
      }
      var simplified = PH.simplifyRDP(pts, 3);
      return { original: pts.length, simplified: simplified.length };
    });
    expect(result).toBeTruthy();
    expect(result.simplified).toBeLessThan(result.original);
    expect(result.simplified).toBeGreaterThanOrEqual(2);
  });

  test('fitBezierCurve generates valid SVG path', async ({ page }) => {
    const pathD = await page.evaluate(() => {
      var PH = window.PathHandleOverlay;
      if (!PH || !PH.fitBezierCurve) return null;
      var pts = [
        { x: 0, y: 50 }, { x: 50, y: 10 },
        { x: 100, y: 80 }, { x: 150, y: 30 }, { x: 200, y: 50 }
      ];
      return PH.fitBezierCurve(pts);
    });
    expect(pathD).toBeTruthy();
    expect(pathD).toContain('M');
    expect(pathD).toContain('C');
  });

  test('context menu shows freehand drawing button', async ({ page }) => {
    await page.locator('.zw-pathtext').click({ button: 'right' });
    await expect(page.locator('.cl-context-menu')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.cl-context-menu__item', { hasText: 'フリーハンド描画' })).toBeVisible();
  });

  test('freehand drawing button enters drawing mode', async ({ page }) => {
    // まずハンドルをアタッチ
    await page.locator('.zw-pathtext').click();
    await expect(page.locator('.zw-pathtext-handle').first()).toBeVisible({ timeout: 3000 });

    // コンテキストメニューからフリーハンド描画開始
    await page.locator('.zw-pathtext').click({ button: 'right' });
    await expect(page.locator('.cl-context-menu')).toBeVisible({ timeout: 3000 });
    await page.locator('.cl-context-menu__item', { hasText: 'フリーハンド描画' }).click();

    // 描画モードに入り、ハンドルが非表示
    const isDrawing = await page.evaluate(() => {
      var editor = window.richTextEditor;
      return editor && editor._pathOverlay ? editor._pathOverlay.isDrawing() : false;
    });
    expect(isDrawing).toBe(true);

    // ハンドルが非表示
    const overlayDisplay = await page.evaluate(() => {
      var g = document.querySelector('.zw-pathtext-handles');
      return g ? g.style.display : null;
    });
    expect(overlayDisplay).toBe('none');
  });

  test('ESC exits drawing mode without changing path', async ({ page }) => {
    await page.locator('.zw-pathtext').click();
    await expect(page.locator('.zw-pathtext-handle').first()).toBeVisible({ timeout: 3000 });

    const pathBefore = await page.evaluate(() => {
      return document.querySelector('.zw-pathtext').getAttribute('data-path');
    });

    // 描画モード開始
    await page.locator('.zw-pathtext').click({ button: 'right' });
    await expect(page.locator('.cl-context-menu')).toBeVisible({ timeout: 3000 });
    await page.locator('.cl-context-menu__item', { hasText: 'フリーハンド描画' }).click();

    // 描画モードに入ったことを確認
    await page.waitForFunction(() => {
      var editor = window.richTextEditor;
      return editor && editor._pathOverlay && editor._pathOverlay.isDrawing();
    }, { timeout: 3000 });

    // ESCでキャンセル
    await page.keyboard.press('Escape');

    const pathAfter = await page.evaluate(() => {
      return document.querySelector('.zw-pathtext').getAttribute('data-path');
    });
    expect(pathAfter).toBe(pathBefore);

    const isDrawing = await page.evaluate(() => {
      var editor = window.richTextEditor;
      return editor && editor._pathOverlay ? editor._pathOverlay.isDrawing() : false;
    });
    expect(isDrawing).toBe(false);
  });

  test('freehand drag updates path with bezier curve', async ({ page }) => {
    await page.locator('.zw-pathtext').click();
    await expect(page.locator('.zw-pathtext-handle').first()).toBeVisible({ timeout: 3000 });

    // 描画モード開始
    await page.locator('.zw-pathtext').click({ button: 'right' });
    await expect(page.locator('.cl-context-menu')).toBeVisible({ timeout: 3000 });
    await page.locator('.cl-context-menu__item', { hasText: 'フリーハンド描画' }).click();

    // SVG上でドラッグ描画
    const svgBox = await page.locator('.zw-pathtext__svg').boundingBox();
    if (svgBox) {
      await page.mouse.move(svgBox.x + 20, svgBox.y + svgBox.height / 2);
      await page.mouse.down();
      // 曲線を描く
      for (let i = 1; i <= 5; i++) {
        await page.mouse.move(
          svgBox.x + 20 + i * (svgBox.width - 40) / 5,
          svgBox.y + svgBox.height / 2 + Math.sin(i) * 20,
          { steps: 3 }
        );
      }
      await page.mouse.up();
    }

    // パスが更新されている
    const pathAfter = await page.evaluate(() => {
      return document.querySelector('.zw-pathtext').getAttribute('data-path');
    });
    expect(pathAfter).toContain('C'); // ベジェ曲線に変換

    // 描画モードを抜けている
    const isDrawing = await page.evaluate(() => {
      var editor = window.richTextEditor;
      return editor && editor._pathOverlay ? editor._pathOverlay.isDrawing() : false;
    });
    expect(isDrawing).toBe(false);

    // ハンドルが再表示されている
    const handleCount = await page.locator('.zw-pathtext-handle').count();
    expect(handleCount).toBeGreaterThan(0);
  });

  test('drawing polyline is visible during drag', async ({ page }) => {
    await page.locator('.zw-pathtext').click();
    await expect(page.locator('.zw-pathtext-handle').first()).toBeVisible({ timeout: 3000 });

    await page.locator('.zw-pathtext').click({ button: 'right' });
    await expect(page.locator('.cl-context-menu')).toBeVisible({ timeout: 3000 });
    await page.locator('.cl-context-menu__item', { hasText: 'フリーハンド描画' }).click();

    // ドラッグ開始
    const svgBox = await page.locator('.zw-pathtext__svg').boundingBox();
    if (svgBox) {
      await page.mouse.move(svgBox.x + 20, svgBox.y + svgBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(svgBox.x + 100, svgBox.y + 30, { steps: 5 });

      // ドラッグ中にポリラインが存在
      const polylineExists = await page.evaluate(() => {
        return !!document.querySelector('.zw-pathtext-drawing');
      });
      expect(polylineExists).toBe(true);

      const points = await page.evaluate(() => {
        var pl = document.querySelector('.zw-pathtext-drawing');
        return pl ? pl.getAttribute('points') : '';
      });
      expect(points.length).toBeGreaterThan(0);

      await page.mouse.up();
    }
  });
});
