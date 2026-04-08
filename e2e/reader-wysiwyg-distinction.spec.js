/**
 * 再生オーバーレイ（閲覧専用 UI）とリッチ編集（WYSIWYG）の混同防止の回帰テスト
 */
const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

test.describe('Reader vs WYSIWYG distinction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await ensureNormalMode(page);
  });

  test('再生オーバーレイではメイン編集領域が隠れ、UIモードは維持される', async ({ page }) => {
    const modeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await page.waitForTimeout(400);

    await expect(page.locator('html')).toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(page.locator('#reader-mode-hint')).toBeVisible();

    const mainHidden = await page.evaluate(() => {
      const main = document.querySelector('.main-content');
      return !!(main && window.getComputedStyle(main).display === 'none');
    });
    expect(mainHidden).toBe(true);
    const modeDuring = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(modeDuring).toBe(modeBefore);

    await page.locator('#reader-back-fab').click();
    await page.waitForTimeout(300);
    const closed = await page.evaluate(() => !document.documentElement.hasAttribute('data-reader-overlay-open'));
    expect(closed).toBe(true);
    const modeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-ui-mode'));
    expect(modeAfter).toBe(modeBefore);

    const focusOnEditSurface = await page.evaluate(() => {
      const a = document.activeElement;
      const ed = document.getElementById('editor');
      const wys = document.getElementById('wysiwyg-editor');
      if (!a) return false;
      if (ed && a === ed) return true;
      if (wys && a === wys) return true;
      if (ed && ed.contains(a)) return true;
      if (wys && wys.contains(a)) return true;
      return false;
    });
    expect(focusOnEditSurface).toBe(true);
  });

  test('ZWPostMarkdownHtmlPipeline（reader）で chapter:// が # リンクへ正規化される', async ({ page }) => {
    const ok = await page.evaluate(() => {
      if (!window.ZWPostMarkdownHtmlPipeline || typeof window.ZWPostMarkdownHtmlPipeline.apply !== 'function') {
        return false;
      }
      var html = '<p><a href="chapter://TestTarget">go</a></p>';
      var out = window.ZWPostMarkdownHtmlPipeline.apply(html, { surface: 'reader', settings: {} });
      return out.indexOf('chapter://') === -1 && /href="#/.test(out);
    });
    expect(ok).toBe(true);
  });

  test('ZWPostMarkdownHtmlPipeline（preview）は .chapter-link を残し reader は convertForExport 後に除去', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.ZWPostMarkdownHtmlPipeline) return null;
      var html = '<p><a href="chapter://OnlyProbe">x</a></p>';
      var prev = window.ZWPostMarkdownHtmlPipeline.apply(html, { surface: 'preview', settings: {} });
      var read = window.ZWPostMarkdownHtmlPipeline.apply(html, { surface: 'reader', settings: {} });
      return {
        previewHasChapterLink: prev.indexOf('chapter-link') !== -1 && prev.indexOf('data-chapter-target') !== -1,
        readerLosesChapterLinkClass: read.indexOf('chapter-link') === -1,
        readerHasHashHref: /href="#[^"]+"/.test(read)
      };
    });
    expect(r).toBeTruthy();
    expect(r.previewHasChapterLink).toBe(true);
    expect(r.readerLosesChapterLinkClass).toBe(true);
    expect(r.readerHasHashHref).toBe(true);
  });

  test('ZWPostMarkdownHtmlPipeline: preview と reader で |漢字《かな》ルビが同一 HTML（章リンクなし）', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.ZWPostMarkdownHtmlPipeline) return null;
      var html = '<p>|試し《ためし》</p>';
      var prev = window.ZWPostMarkdownHtmlPipeline.apply(html, { surface: 'preview', settings: {} });
      var read = window.ZWPostMarkdownHtmlPipeline.apply(html, { surface: 'reader', settings: {} });
      return {
        bothRuby: prev.indexOf('<ruby>') !== -1 && read.indexOf('<ruby>') !== -1,
        identical: prev === read
      };
    });
    expect(r).toBeTruthy();
    expect(r.bothRuby).toBe(true);
    expect(r.identical).toBe(true);
  });

  test('ZWMdItBody + パイプライン: フォント装飾記法が preview / reader で同一 HTML（二重後処理なし）', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.ZWPostMarkdownHtmlPipeline || !window.ZWMdItBody) return null;
      var md = '[bold]ZW004[/bold]\n';
      var raw = window.ZWMdItBody.renderToHtmlBeforePipeline(md);
      var prev = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'preview', settings: {} });
      var read = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'reader', settings: {} });
      var countDecor = function (s) {
        return (s.match(/decor-bold/g) || []).length;
      };
      return {
        rawKeepsMarkers: raw.indexOf('[bold]') !== -1,
        identical: prev === read,
        countPrev: countDecor(prev),
        countRead: countDecor(read)
      };
    });
    expect(r).toBeTruthy();
    expect(r.rawKeepsMarkers).toBe(true);
    expect(r.identical).toBe(true);
    expect(r.countPrev).toBe(1);
    expect(r.countRead).toBe(1);
  });

  test('ZWMdItBody + パイプライン: 最小 zw-textbox DSL が preview / reader で同一 HTML', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.ZWMdItBody || !window.ZWPostMarkdownHtmlPipeline) return null;
      var md = ':::zw-textbox\nParityProbe\n:::\n';
      var raw = window.ZWMdItBody.renderToHtmlBeforePipeline(md);
      var prev = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'preview', settings: {} });
      var read = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'reader', settings: {} });
      return {
        hasTextbox: prev.indexOf('zw-textbox') !== -1 && read.indexOf('zw-textbox') !== -1,
        identical: prev === read,
        probeInBoth: prev.indexOf('ParityProbe') !== -1 && read.indexOf('ParityProbe') !== -1
      };
    });
    expect(r).toBeTruthy();
    expect(r.hasTextbox).toBe(true);
    expect(r.probeInBoth).toBe(true);
    expect(r.identical).toBe(true);
  });

  test('ZWMdItBody + パイプライン: zw-textbox 複合（preset・tilt・anim + 装飾記法）が preview / reader で同一 HTML（監査シナリオ2）', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.ZWMdItBody || !window.ZWPostMarkdownHtmlPipeline) return null;
      var md =
        ':::zw-textbox{preset:"inner-voice", tilt:3, anim:pulse}\n'
        + '[italic]TBParityProbe[/italic]\n'
        + ':::\n';
      var raw = window.ZWMdItBody.renderToHtmlBeforePipeline(md);
      var prev = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'preview', settings: {} });
      var read = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'reader', settings: {} });
      return {
        hasTextbox: prev.indexOf('zw-textbox') !== -1 && read.indexOf('zw-textbox') !== -1,
        hasItalicDecor:
          prev.indexOf('decor-italic') !== -1 && read.indexOf('decor-italic') !== -1,
        hasDataAnim: prev.indexOf('data-anim') !== -1 && read.indexOf('data-anim') !== -1,
        identical: prev === read
      };
    });
    expect(r).toBeTruthy();
    expect(r.hasTextbox).toBe(true);
    expect(r.hasItalicDecor).toBe(true);
    expect(r.hasDataAnim).toBe(true);
    expect(r.identical).toBe(true);
  });

  test('ZWMdItBody + パイプライン: 複数見出し + chapter:// 相互リンクが preview / reader で意図どおり（監査シナリオ1・パイプライン層）', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.ZWMdItBody || !window.ZWPostMarkdownHtmlPipeline) return null;
      var md =
        '# ChAlpha\n\nFirst body probe.\n\n# ChBeta\n\n'
        + 'Cross [to Alpha](chapter://ChAlpha) probe.\n';
      var raw = window.ZWMdItBody.renderToHtmlBeforePipeline(md);
      var prev = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'preview', settings: {} });
      var read = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'reader', settings: {} });
      var h1count = function (s) {
        return (s.match(/<h1[\s>]/gi) || []).length;
      };
      return {
        h1Prev: h1count(prev),
        h1Read: h1count(read),
        previewHasChapterLink:
          prev.indexOf('chapter-link') !== -1 && prev.indexOf('data-chapter-target') !== -1,
        readerNoChapterProtocol: read.indexOf('chapter://') === -1,
        readerHasHashHref: /href="#[^"]+"/.test(read),
        bothHaveFirstBody: prev.indexOf('First body probe') !== -1 && read.indexOf('First body probe') !== -1,
        bothHaveLinkText: prev.indexOf('to Alpha') !== -1 && read.indexOf('to Alpha') !== -1,
        nonChapterIdentical: (function () {
          var strip = function (html) {
            return html
              .replace(/<a[^>]*class="[^"]*chapter-link[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '<a>CHAPTER_LINK</a>')
              .replace(/<a[^>]*href="#[^"]+"[^>]*>[\s\S]*?<\/a>/gi, '<a>CHAPTER_LINK</a>');
          };
          return strip(prev) === strip(read);
        })()
      };
    });
    expect(r).toBeTruthy();
    expect(r.h1Prev).toBe(2);
    expect(r.h1Read).toBe(2);
    expect(r.previewHasChapterLink).toBe(true);
    expect(r.readerNoChapterProtocol).toBe(true);
    expect(r.readerHasHashHref).toBe(true);
    expect(r.bothHaveFirstBody).toBe(true);
    expect(r.bothHaveLinkText).toBe(true);
    expect(r.nonChapterIdentical).toBe(true);
  });

  test('ZWMdItBody + パイプライン: zw-typing / zw-dialog 内のルビ記法が preview / reader で同一 HTML（監査シナリオ3）', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.ZWMdItBody || !window.ZWPostMarkdownHtmlPipeline) return null;
      var md =
        ':::zw-typing\n|試し《ためし》\n:::\n\n'
        + ':::zw-dialog\n|会話《かいわ》\n:::\n';
      var raw = window.ZWMdItBody.renderToHtmlBeforePipeline(md);
      var prev = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'preview', settings: {} });
      var read = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'reader', settings: {} });
      return {
        hasTyping: prev.indexOf('zw-typing') !== -1 && read.indexOf('zw-typing') !== -1,
        hasDialog: prev.indexOf('zw-dialog') !== -1 && read.indexOf('zw-dialog') !== -1,
        bothRuby:
          prev.indexOf('<ruby>') !== -1
          && read.indexOf('<ruby>') !== -1
          && prev.split('<ruby>').length === read.split('<ruby>').length,
        identical: prev === read
      };
    });
    expect(r).toBeTruthy();
    expect(r.hasTyping).toBe(true);
    expect(r.hasDialog).toBe(true);
    expect(r.bothRuby).toBe(true);
    expect(r.identical).toBe(true);
  });

  test('ZWMdItBody + パイプライン: 存在しない Wiki への wikilink が preview / reader で同一（is-broken・監査シナリオ4・パイプライン層）', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.ZWMdItBody || !window.ZWPostMarkdownHtmlPipeline) return null;
      var md = '[[ZWBrokenWikiProbeSession56]]\n';
      var raw = window.ZWMdItBody.renderToHtmlBeforePipeline(md);
      var prev = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'preview', settings: {} });
      var read = window.ZWPostMarkdownHtmlPipeline.apply(raw, { surface: 'reader', settings: {} });
      return {
        identical: prev === read,
        bothBroken:
          prev.indexOf('is-broken') !== -1
          && read.indexOf('is-broken') !== -1
          && prev.indexOf('ZWBrokenWikiProbeSession56') !== -1,
        bothWikilink: prev.indexOf('wikilink') !== -1 && read.indexOf('wikilink') !== -1
      };
    });
    expect(r).toBeTruthy();
    expect(r.identical).toBe(true);
    expect(r.bothBroken).toBe(true);
    expect(r.bothWikilink).toBe(true);
  });

  test('ZWPostMarkdownHtmlPipeline: preview と reader で wikilink / 傍点が同一経路', async ({ page }) => {
    const r = await page.evaluate(() => {
      if (!window.ZWPostMarkdownHtmlPipeline) return null;
      var html = '<p>[[ZProbe]] {kenten|点}</p>';
      var a = window.ZWPostMarkdownHtmlPipeline.apply(html, { surface: 'preview', settings: {} });
      var b = window.ZWPostMarkdownHtmlPipeline.apply(html, { surface: 'reader', settings: {} });
      return {
        bothWikilink: a.indexOf('wikilink') !== -1 && b.indexOf('wikilink') !== -1,
        bothKenten: a.indexOf('class="kenten"') !== -1 && b.indexOf('class="kenten"') !== -1
      };
    });
    expect(r).toBeTruthy();
    expect(r.bothWikilink).toBe(true);
    expect(r.bothKenten).toBe(true);
  });

  test('P2: data-zw-align がパイプライン後も残り、MD プレビュー・Reader 本文で text-align が投影される', async ({ page }) => {
    const pipelineOk = await page.evaluate(() => {
      if (!window.ZWPostMarkdownHtmlPipeline) return false;
      var html = '<p data-zw-align="center">probe</p>';
      var prev = window.ZWPostMarkdownHtmlPipeline.apply(html, { surface: 'preview', settings: {} });
      var read = window.ZWPostMarkdownHtmlPipeline.apply(html, { surface: 'reader', settings: {} });
      return (
        prev.indexOf('data-zw-align="center"') !== -1
        && read.indexOf('data-zw-align="center"') !== -1
        && prev === read
      );
    });
    expect(pipelineOk).toBe(true);

    const mdAlign = await page.evaluate(() => {
      var panel = document.getElementById('markdown-preview-panel');
      if (!panel) return null;
      panel.innerHTML = '<p data-zw-align="center" id="zw-align-md-probe">x</p>';
      var el = document.getElementById('zw-align-md-probe');
      return window.getComputedStyle(el).textAlign;
    });
    expect(mdAlign).toBe('center');

    await page.evaluate(() => {
      var ed = document.getElementById('editor');
      if (ed && !String(ed.value || '').trim()) {
        ed.value = 'zw-align-e2e-probe\n';
        ed.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await page.waitForTimeout(400);

    const readerAlign = await page.evaluate(() => {
      var content = document.querySelector('#reader-preview-inner .reader-preview__content');
      if (!content) return null;
      content.innerHTML = '<p data-zw-align="end" id="zw-align-reader-probe">y</p>';
      var el = document.getElementById('zw-align-reader-probe');
      return window.getComputedStyle(el).textAlign;
    });
    expect(readerAlign).toBe('right');
  });

  test('WP-004: MD プレビューと Reader 本文の段落 typography 変数が一致する', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--paragraph-spacing', '13px');
      document.documentElement.style.setProperty('--paragraph-indent', '17px');
      document.documentElement.style.setProperty('--body-letter-spacing', '0.05em');
      var panel = document.getElementById('markdown-preview-panel');
      if (panel) {
        panel.innerHTML = '<p>lead</p><p id="typo-md-probe">body</p>';
      }
    });
    const md = await page.evaluate(() => {
      var el = document.getElementById('typo-md-probe');
      if (!el) return null;
      var st = window.getComputedStyle(el);
      return { mb: st.marginBottom, ti: st.textIndent, ls: st.letterSpacing };
    });
    expect(md).toBeTruthy();

    await page.evaluate(() => {
      var ed = document.getElementById('editor');
      if (ed && !String(ed.value || '').trim()) {
        ed.value = 'typography-e2e-probe\n';
        ed.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await page.waitForTimeout(400);

    await page.evaluate(() => {
      var content = document.querySelector('#reader-preview-inner .reader-preview__content');
      if (content) {
        content.innerHTML = '<p>lead</p><p id="typo-rd-probe">body</p>';
      }
    });
    const rd = await page.evaluate(() => {
      var el = document.getElementById('typo-rd-probe');
      if (!el) return null;
      var st = window.getComputedStyle(el);
      return { mb: st.marginBottom, ti: st.textIndent, ls: st.letterSpacing };
    });
    expect(rd).toBeTruthy();
    expect(rd).toEqual(md);
  });

  test('リッチ編集の切替で UI モードは通常のまま', async ({ page }) => {
    await page.evaluate(() => {
      const btn = document.getElementById('toggle-wysiwyg');
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);
    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'normal');
  });

  test('フォーカスモード中に再生オーバーレイを開閉しても data-ui-mode は focus のまま', async ({ page }) => {
    await page.evaluate(() => {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
        window.ZenWriterApp.setUIMode('focus');
      }
    });
    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'focus');

    await page.evaluate(() => {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
        window.ZWReaderPreview.enter();
      }
    });
    await expect(page.locator('html')).toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'focus');

    await page.locator('#reader-back-fab').click();
    await page.waitForTimeout(250);
    await expect(page.locator('html')).not.toHaveAttribute('data-reader-overlay-open', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-ui-mode', 'focus');
  });
});
