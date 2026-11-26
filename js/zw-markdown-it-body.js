/**
 * Markdown ソースを markdown-it で HTML にし、:::zw-* DSL ブロックを復元するまで（パイプライン直前）。
 * MD プレビューと読者プレビューで同一前段を共有し、WP-004 Phase 3 の二重後処理を防ぐ。
 */
(function () {
  'use strict';

  var DSL_BLOCK_RE = /:::zw-(?:textbox|typing|dialog|scroll|pathtext)(?:\{[^}]*\})?\n[\s\S]*?\n:::/gi;
  var ALIGN_BLOCK_RE = /<(p|h1|h2|h3|blockquote|li)\s+data-zw-align="(start|center|end)">([\s\S]*?)<\/\1>/gi;

  var sharedFallbackRenderer = null;

  function extractDslBlocks(markdown, md) {
    var placeholders = [];
    var source = markdown || '';
    var prefix = availableTokenPrefix(source, md, 'ZWDSLBLOCK');
    var processed = source.replace(DSL_BLOCK_RE, function (match) {
      var token = prefix + placeholders.length + 'END';
      placeholders.push({ token: token, dsl: match });
      return '\n\n' + token + '\n\n';
    });
    return { markdown: processed, placeholders: placeholders };
  }

  function availableTokenPrefix(source, md, label) {
    var reserved = source;
    if (md && md.utils && typeof md.utils.unescapeAll === 'function') {
      reserved += md.utils.unescapeAll(source);
    }
    // Reserve namespaces in one scan, including text produced by entity decoding.
    var namespaces = new Set(reserved.match(new RegExp(label + '\\d+X', 'g')) || []);
    var namespace = 0;
    while (namespaces.has(label + namespace + 'X')) namespace++;
    return label + namespace + 'X';
  }

  function extractAlignedBlocks(markdown, md) {
    var placeholders = [];
    var source = markdown || '';
    var prefix = availableTokenPrefix(source, md, 'ZWALIGNBLOCK');
    var processed = source.replace(ALIGN_BLOCK_RE, function (_match, tag, align, content) {
      var token = prefix + placeholders.length + 'END';
      placeholders.push({
        token: token,
        tag: String(tag || 'p').toLowerCase(),
        align: String(align || 'start').toLowerCase(),
        content: content || ''
      });
      return '\n\n' + token + '\n\n';
    });
    return { markdown: processed, placeholders: placeholders };
  }

  function restoreDslBlocks(html, placeholders) {
    for (var i = 0; i < placeholders.length; i++) {
      var p = placeholders[i];
      html = html.replace(new RegExp('<p>' + p.token + '</p>|' + p.token, 'g'), function () { return p.dsl; });
    }
    return html;
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderInlineMarkdown(md, source) {
    if (md && typeof md.renderInline === 'function') {
      try {
        return md.renderInline(source || '');
      } catch (_) {
        return escapeHtml(source || '');
      }
    }
    return escapeHtml(source || '');
  }

  function restoreAlignedBlocks(html, placeholders, md) {
    for (var i = 0; i < placeholders.length; i++) {
      var p = placeholders[i];
      var body = renderInlineMarkdown(md, p.content);
      var block = '<' + p.tag + ' data-zw-align="' + p.align + '">' + body + '</' + p.tag + '>';
      html = html.replace(new RegExp('<p>' + p.token + '</p>|' + p.token, 'g'), function () { return block; });
    }
    return html;
  }

  /**
   * @param {object} [editorManager] 指定時は editorManager._markdownRenderer を利用（MD プレビューと同一インスタンス）
   * @returns {object|null} markdown-it インスタンス
   */
  function resolveMarkdownRenderer(editorManager, imported) {
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
    if (!imported && rte && rte.markdownRenderer) {
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
   * @param {{ editorManager?: object, imported?: boolean }} [opts]
   * @returns {string}
   */
  function renderToHtmlBeforePipeline(markdown, opts) {
    opts = opts || {};
    var aligned;
    var extracted;
    var html = '';
    var md = null;

    try {
      md = resolveMarkdownRenderer(opts.editorManager, opts.imported);
      aligned = extractAlignedBlocks(markdown, md);
      extracted = extractDslBlocks(aligned.markdown, md);
      var mdSrc = extracted.markdown;
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
      return '';
    }

    html = restoreDslBlocks(html, extracted.placeholders);
    return restoreAlignedBlocks(html, aligned.placeholders, md);
  }

  window.ZWMdItBody = {
    renderToHtmlBeforePipeline: renderToHtmlBeforePipeline,
  };
})();
