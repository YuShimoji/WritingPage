/**
 * Markdown ソースを markdown-it で HTML にし、:::zw-* DSL ブロックを復元するまで（パイプライン直前）。
 * MD プレビューと読者プレビューで同一前段を共有し、WP-004 Phase 3 の二重後処理を防ぐ。
 */
(function () {
  'use strict';

  var DSL_BLOCK_RE = /:::zw-(?:textbox|typing|dialog|scroll|pathtext)(?:\{[^}]*\})?\n[\s\S]*?\n:::/gi;

  var sharedFallbackRenderer = null;

  function extractDslBlocks(markdown) {
    var placeholders = [];
    var counter = 0;
    var processed = (markdown || '').replace(DSL_BLOCK_RE, function (match) {
      var token = '\n\nZWDSLBLOCK' + counter + '\n\n';
      placeholders.push({ token: 'ZWDSLBLOCK' + counter, dsl: match });
      counter++;
      return token;
    });
    return { markdown: processed, placeholders: placeholders };
  }

  function restoreDslBlocks(html, placeholders) {
    for (var i = 0; i < placeholders.length; i++) {
      var p = placeholders[i];
      html = html.replace(new RegExp('<p>' + p.token + '</p>', 'g'), p.dsl);
      html = html.replace(new RegExp(p.token, 'g'), p.dsl);
    }
    return html;
  }

  /**
   * @param {object} [editorManager] 指定時は editorManager._markdownRenderer を利用（MD プレビューと同一インスタンス）
   * @returns {object|null} markdown-it インスタンス
   */
  function resolveMarkdownRenderer(editorManager) {
    if (editorManager && window.markdownit) {
      if (!editorManager._markdownRenderer) {
        editorManager._markdownRenderer = window.markdownit({
          html: false,
          linkify: true,
          breaks: true,
        });
      }
      return editorManager._markdownRenderer;
    }

    var Z = window.ZenWriterEditor;
    var rte = Z && Z.richTextEditor;
    if (rte && rte.markdownRenderer) {
      return rte.markdownRenderer;
    }

    if (window.markdownit) {
      if (!sharedFallbackRenderer) {
        sharedFallbackRenderer = window.markdownit({
          html: false,
          linkify: true,
          breaks: true,
        });
      }
      return sharedFallbackRenderer;
    }

    return null;
  }

  /**
   * @param {string} markdown
   * @param {{ editorManager?: object }} [opts]
   * @returns {string}
   */
  function renderToHtmlBeforePipeline(markdown, opts) {
    opts = opts || {};
    var extracted = extractDslBlocks(markdown);
    var mdSrc = extracted.markdown;
    var html = '';

    try {
      var md = resolveMarkdownRenderer(opts.editorManager);
      if (md) {
        html = md.render(mdSrc);
      } else {
        html = (mdSrc || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }
    } catch (_) {
      html = '';
    }

    return restoreDslBlocks(html, extracted.placeholders);
  }

  window.ZWMdItBody = {
    renderToHtmlBeforePipeline: renderToHtmlBeforePipeline,
  };
})();
