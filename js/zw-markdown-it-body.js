/**
 * Markdown ソースを markdown-it で HTML にし、:::zw-* DSL ブロックを復元するまで（パイプライン直前）。
 * MD プレビューと読者プレビューで同一前段を共有し、WP-004 Phase 3 の二重後処理を防ぐ。
 */
(function () {
  'use strict';

  var DSL_BLOCK_RE = /:::zw-(?:textbox|typing|dialog|scroll|pathtext)(?:\{[^}]*\})?\n[\s\S]*?\n:::/gi;
  var ALIGN_BLOCK_RE = /<(p|h1|h2|h3|blockquote|li)\s+data-zw-align="(start|center|end)">([\s\S]*?)<\/\1>/gi;

  var sharedFallbackRenderer = null;

  // Recognize markers in parsed blockquotes, before Markdown parses their
  // titles. Escaped markers, ordinary quotes and code examples remain literal.
  function renderReadingBlocks(state) {
    if (!state.src.includes('[!SCENE]') && !state.src.includes('[!SPOILER]')) return;
    const tokens = state.tokens;
    const quotes = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === 'blockquote_close') {
        token.tag = quotes.pop();
        continue;
      }
      if (token.type !== 'blockquote_open') continue;
      quotes.push(token.tag);
      const inline = tokens[i + 2];
      if (tokens[i + 1]?.type !== 'paragraph_open' || inline?.type !== 'inline') continue;
      const lines = inline.content.split('\n');
      const marker = /^\[!(SCENE|SPOILER)\][ \t]+(.+)$/.exec(lines[0]);
      if (!marker) continue;
      const spoiler = marker[1] === 'SPOILER';
      const interactive = spoiler && !state.env.zwEditing;
      token.tag = interactive ? 'details' : 'section';
      quotes[quotes.length - 1] = token.tag;
      token.attrSet('class', spoiler ? 'zw-spoiler' : 'zw-intertitle');
      const titleTag = interactive ? 'summary' : 'header';
      const start = new state.Token('reading_title_open', titleTag, 1);
      start.attrSet('class', 'zw-reading-title');
      const title = new state.Token('inline', '', 0);
      title.content = marker[2];
      title.children = [];
      const end = new state.Token('reading_title_close', titleTag, -1);
      inline.content = lines.slice(1).join('\n');
      tokens.splice(i + 1, inline.content ? 0 : 3, start, title, end);
    }
  }

  function createRenderer(options) {
    const md = window.markdownit(options);
    md.core.ruler.before('inline', 'reading_blocks', renderReadingBlocks);
    const renderImage = md.renderer.rules.image;
    md.renderer.rules.image = function (tokens, index, options, env, renderer) {
      const image = tokens[index];
      if (image.attrGet('src')?.startsWith('asset://')) {
        // markdown-it's plain-text alt renderer skips escaped punctuation and entities.
        for (const child of image.children || []) {
          if (child.type === 'text_special') child.type = 'text';
        }
      }
      return renderImage(tokens, index, options, env, renderer);
    };
    return md;
  }

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

  /**
   * @param {object} [editorManager] 指定時は editorManager._markdownRenderer を利用（MD プレビューと同一インスタンス）
   * @returns {object|null} markdown-it インスタンス
   */
  function resolveMarkdownRenderer(editorManager) {
    if (editorManager && window.markdownit) {
      if (!editorManager._markdownRenderer) {
        editorManager._markdownRenderer = createRenderer({
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
        sharedFallbackRenderer = createRenderer({
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
    createRenderer: createRenderer,
    hasReadingBlocks: source => /^ {0,3}>[ \t]?\[!(?:SCENE|SPOILER)\][ \t]+\S/m.test(source || ''),
    renderToHtmlBeforePipeline: renderToHtmlBeforePipeline,
  };
})();
