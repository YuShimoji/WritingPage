(function (root) {
  'use strict';

  function hasDocument() {
    return typeof document !== 'undefined' && !!document.createElement;
  }

  function projectRenderedHtml(html, options) {
    if (!(root.TextboxDslParser && typeof root.TextboxDslParser.parseSegments === 'function')) {
      return html;
    }
    if (!(root.TextboxEffectRenderer && typeof root.TextboxEffectRenderer.renderSegments === 'function')) {
      return html;
    }
    return root.TextboxEffectRenderer.renderSegments(
      root.TextboxDslParser.parseSegments(html || ''),
      options || {}
    );
  }

  function collectAttrs(node) {
    return {
      preset: node.getAttribute('data-preset') || '',
      role: node.getAttribute('data-role') || 'custom',
      anim: (node.getAttribute('data-anim') || '').split(/\s+/).filter(Boolean)[0] || '',
      tilt: node.style && node.style.transform && /rotate\((-?\d+(?:\.\d+)?)deg\)/.test(node.style.transform)
        ? parseFloat(node.style.transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/)[1])
        : undefined,
      scale: node.style && node.style.transform && /scale\((\d+(?:\.\d+)?)\)/.test(node.style.transform)
        ? parseFloat(node.style.transform.match(/scale\((\d+(?:\.\d+)?)\)/)[1])
        : undefined,
      sfx: node.getAttribute('data-sfx') || ''
    };
  }

  function serializeHtml(html, options) {
    if (!hasDocument()) {
      return { html: html || '', placeholders: [] };
    }

    var container = document.createElement('div');
    container.innerHTML = html || '';
    var placeholders = [];
    var nodes = container.querySelectorAll('.zw-textbox');

    Array.prototype.forEach.call(nodes, function (node, index) {
      var contentNode = node.querySelector('.zw-textbox__content') || node;
      var attrs = collectAttrs(node);
      var bodyHtml = contentNode.innerHTML || '';
      var bodyMarkdown = options && typeof options.serializeFragment === 'function'
        ? options.serializeFragment(bodyHtml)
        : (contentNode.textContent || '');
      var parser = root.TextboxDslParser;
      var dsl = parser && typeof parser.wrap === 'function'
        ? parser.wrap(String(bodyMarkdown || '').trim(), attrs)
        : String(bodyMarkdown || '');
      var token = 'ZWTEXTBOXBLOCK' + index;
      placeholders.push({ token: token, dsl: dsl });
      node.replaceWith(document.createTextNode(token));
    });

    // .zw-typing ブロックのシリアライズ (SP-074 Phase 3)
    var typingNodes = container.querySelectorAll('.zw-typing');
    Array.prototype.forEach.call(typingNodes, function (node, localIdx) {
      var textEl = node.querySelector('.zw-typing__text');
      var content = textEl ? (textEl.textContent || '') : (node.textContent || '');
      var speed = node.getAttribute('data-speed') || '';
      var mode = node.getAttribute('data-mode') || '';
      var attrs = {};
      if (speed && speed !== '30ms') attrs.speed = speed;
      if (mode && mode !== 'auto') attrs.mode = mode;
      var parser = root.TextboxDslParser;
      var dsl = parser && typeof parser.wrap === 'function'
        ? parser.wrap(content.trim(), attrs, 'typing')
        : ':::zw-typing\n' + content + '\n:::';
      var token = 'ZWTYPING' + localIdx;
      placeholders.push({ token: token, dsl: dsl });
      node.replaceWith(document.createTextNode(token));
    });

    // .zw-dialog ブロックのシリアライズ (SP-074 Phase 3)
    var dialogNodes = container.querySelectorAll('.zw-dialog');
    Array.prototype.forEach.call(dialogNodes, function (node, localIdx) {
      var contentEl = node.querySelector('.zw-dialog__content');
      var content = contentEl ? (contentEl.textContent || '') : '';
      var attrs = {};
      var speaker = node.getAttribute('data-dialog-speaker') || '';
      var position = node.getAttribute('data-dialog-position') || '';
      var dialogStyle = node.getAttribute('data-dialog-style') || '';
      var icon = node.getAttribute('data-dialog-icon') || '';
      if (speaker) attrs.speaker = speaker;
      if (position && position !== 'left') attrs.position = position;
      if (dialogStyle && dialogStyle !== 'default') attrs.style = dialogStyle;
      if (icon) attrs.icon = icon;
      var parser = root.TextboxDslParser;
      var dsl = parser && typeof parser.wrap === 'function'
        ? parser.wrap(content.trim(), attrs, 'dialog')
        : ':::zw-dialog\n' + content + '\n:::';
      var token = 'ZWDIALOG' + localIdx;
      placeholders.push({ token: token, dsl: dsl });
      node.replaceWith(document.createTextNode(token));
    });

    return {
      html: container.innerHTML,
      placeholders: placeholders
    };
  }

  function restoreSerializedBlocks(markdown, placeholders) {
    var output = String(markdown || '');
    (Array.isArray(placeholders) ? placeholders : []).forEach(function (entry) {
      if (!entry || !entry.token) return;
      var escaped = String(entry.token).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp(escaped, 'g');
      output = output.replace(re, entry.dsl || '');
    });
    return output.replace(/\n{3,}/g, '\n\n');
  }

  var api = {
    projectRenderedHtml: projectRenderedHtml,
    serializeHtml: serializeHtml,
    restoreSerializedBlocks: restoreSerializedBlocks
  };

  root.TextboxRichTextBridge = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
