/**
 * Markdown ソースを markdown-it で HTML にし、:::zw-* DSL ブロックを復元するまで（パイプライン直前）。
 * MD プレビューと読者プレビューで同一前段を共有し、WP-004 Phase 3 の二重後処理を防ぐ。
 */
(function () {
  'use strict';

  var DSL_BLOCK_RE = /:::zw-(?:textbox|typing|dialog|scroll|pathtext)(?:\{[^}]*\})?\n[\s\S]*?\n:::/gi;
  var ALIGN_BLOCK_RE = /<(p|h1|h2|h3|blockquote|li)\s+data-zw-align="(start|center|end)">([\s\S]*?)<\/\1>/gi;

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

  function extractAlignedBlocks(markdown, md) {
    var placeholders = [];
    var counter = 0;
    var source = markdown || '';
    var reserved = source;
    if (md && md.utils && typeof md.utils.unescapeAll === 'function') {
      reserved += md.utils.unescapeAll(source);
    }
    // Reserve namespaces in one scan, including text produced by entity decoding.
    var namespaces = new Set(reserved.match(/ZWALIGNBLOCK\d+X/g) || []);
    var namespace = 0;
    while (namespaces.has('ZWALIGNBLOCK' + namespace + 'X')) namespace++;
    var prefix = 'ZWALIGNBLOCK' + namespace + 'X';
    var processed = source.replace(ALIGN_BLOCK_RE, function (_match, tag, align, content) {
      var token = prefix + counter + 'END';
      placeholders.push({
        token: token,
        tag: String(tag || 'p').toLowerCase(),
        align: String(align || 'start').toLowerCase(),
        content: content || ''
      });
      counter++;
      return '\n\n' + token + '\n\n';
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

  // Rich editing renders raw HTML first, so literal aligned markup inside code stays escaped.
  function renderAlignedHtml(html, md) {
    // This is already HTML; Markdown placeholder separators would become manuscript LF.
    return String(html || '').replace(ALIGN_BLOCK_RE, function (_match, tag, align, content) {
      return '<' + tag.toLowerCase() + ' data-zw-align="' + align.toLowerCase() + '">'
        + renderInlineMarkdown(md, content) + '</' + tag.toLowerCase() + '>';
    });
  }

  function installRichAlignedBlockRule(md) {
    if (!md || !md.block || !md.block.ruler || md.__zwAlignedBlockInstalled) return;
    md.block.ruler.before('html_block', 'zw_aligned_block', function (state, startLine, endLine, silent) {
      if (!state.md.options.html || state.sCount[startLine] - state.blkIndent >= 4) return false;
      var start = state.bMarks[startLine] + state.tShift[startLine];
      var opening = /^<(p|h1|h2|h3|blockquote|li)\s+data-zw-align="(start|center|end)">/i;
      if (!opening.test(state.src.slice(start, state.eMarks[startLine]))) return false;
      var match = state.src.slice(start).match(/^<(p|h1|h2|h3|blockquote|li)\s+data-zw-align="(start|center|end)">[\s\S]*?<\/\1>/i);
      if (!match) return false;
      var matchedEnd = start + match[0].length;
      // Turndown can serialize adjacent aligned paragraphs without a separator.
      // Keep any aligned block starting on the same closing line intact as well.
      var adjacent = state.src.slice(matchedEnd).match(/^[ \t]*<(p|h1|h2|h3|blockquote|li)\s+data-zw-align="(start|center|end)">[\s\S]*?<\/\1>/i);
      while (adjacent) {
        matchedEnd += adjacent[0].length;
        adjacent = state.src.slice(matchedEnd).match(/^[ \t]*<(p|h1|h2|h3|blockquote|li)\s+data-zw-align="(start|center|end)">[\s\S]*?<\/\1>/i);
      }
      var nextLine = startLine + 1;
      while (nextLine < endLine && state.eMarks[nextLine - 1] < matchedEnd) {
        if (!state.isEmpty(nextLine) && state.sCount[nextLine] < state.blkIndent) return false;
        nextLine++;
      }
      if (state.eMarks[nextLine - 1] < matchedEnd) return false;
      if (silent) return true;
      // HTML blocks normally end at a blank line. A serialized aligned body
      // owns its explicit blank lines until its closing tag instead.
      var token = state.push('html_block', '', 0);
      token.map = [startLine, nextLine];
      token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
      state.line = nextLine;
      return true;
    }, { alt: ['paragraph', 'reference', 'blockquote'] });
    md.__zwAlignedBlockInstalled = true;
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
    var aligned;
    var extracted;
    var html = '';
    var md = null;

    try {
      md = resolveMarkdownRenderer(opts.editorManager);
      aligned = extractAlignedBlocks(markdown, md);
      extracted = extractDslBlocks(aligned.markdown);
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
    installRichAlignedBlockRule: installRichAlignedBlockRule,
    renderAlignedHtml: renderAlignedHtml,
    renderToHtmlBeforePipeline: renderToHtmlBeforePipeline,
  };
})();
