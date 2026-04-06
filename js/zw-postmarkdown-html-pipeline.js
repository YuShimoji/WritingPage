/**
 * Markdown-it 等で生成した HTML に対する共通後処理。
 * MD プレビュー（editor-preview）と読者プレビュー（reader-preview）で順序と処理を一致させ、WP-004 Phase 3 の収束用。
 */
(function () {
  'use strict';

  /**
   * @param {string} html
   * @param {object} [opts]
   * @param {object} [opts.settings] ZenWriter 設定（未指定時は loadSettings）
   * @param {'preview'|'reader'} [opts.surface='preview'] preview: 章は .chapter-link（アプリ内ナビ用）。reader: convertChapterLinks 後に convertForExport で # アンカーへ（ページ内スクロール・エクスポート整合）。
   * @returns {string}
   */
  function applyPostMarkdownHtmlPipeline(html, opts) {
    opts = opts || {};
    var surface = opts.surface === 'reader' ? 'reader' : 'preview';
    var settings = opts.settings;
    if (settings === undefined && window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function') {
      try {
        settings = window.ZenWriterStorage.loadSettings();
      } catch (_) {
        settings = {};
      }
    }
    settings = settings || {};

    var edMgr = window.ZenWriterEditor;

    if (html && window.TextboxRichTextBridge && typeof window.TextboxRichTextBridge.projectRenderedHtml === 'function') {
      html = window.TextboxRichTextBridge.projectRenderedHtml(html, {
        settings: settings,
        target: surface === 'reader' ? 'reader' : 'preview'
      });
    }

    if (html && edMgr && typeof edMgr.processFontDecorations === 'function') {
      html = edMgr.processFontDecorations(html);
    }
    if (html && edMgr && typeof edMgr.processTextAnimations === 'function') {
      html = edMgr.processTextAnimations(html);
    }

    if (html && window.ZWInlineHtmlPostMarkdown && typeof window.ZWInlineHtmlPostMarkdown.applyWikilinksKentenRuby === 'function') {
      html = window.ZWInlineHtmlPostMarkdown.applyWikilinksKentenRuby(html);
    }

    var Nav = window.ZWChapterNav;
    // chapter:// は常に先に .chapter-link へ（Reader はその後 # へ。convertForExport は .chapter-link 前提）
    if (html && Nav && typeof Nav.convertChapterLinks === 'function') {
      html = Nav.convertChapterLinks(html);
    }

    if (surface === 'reader' && html && Nav && typeof Nav.convertForExport === 'function') {
      html = Nav.convertForExport(html);
    }

    return html || '';
  }

  window.ZWPostMarkdownHtmlPipeline = {
    apply: applyPostMarkdownHtmlPipeline
  };
})();
