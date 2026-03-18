/**
 * TextboxDslParser
 * Parser/serializer and HTML transformer for :::zw-* blocks.
 * Supported block types: textbox, typing, dialog
 */
(function (root) {
  'use strict';

  var BLOCK_TYPES = ['textbox', 'typing', 'dialog'];
  var BLOCK_TYPES_RE = BLOCK_TYPES.join('|');
  var OPEN_RE = new RegExp(':::zw-(?:' + BLOCK_TYPES_RE + ')(?:\\{([^}]*)\\})?(?:\\r?\\n|<br\\s*\\/?>)', 'i');
  var BLOCK_RE = new RegExp(':::zw-(' + BLOCK_TYPES_RE + ')(?:\\{([^}]*)\\})?(?:\\r?\\n|<br\\s*\\/?>)([\\s\\S]*?)(?:\\r?\\n|<br\\s*\\/?>):::', 'gi');
  var ALLOWED_ATTRS = ['preset', 'role', 'anim', 'tilt', 'scale', 'sfx', 'class', 'speed', 'mode', 'speaker', 'icon', 'position', 'style'];
  var ALLOWED_ROLES = ['dialogue', 'monologue', 'narration', 'sfx', 'system', 'custom'];
  var TYPING_MODES = ['auto', 'click', 'scroll'];
  var DIALOG_POSITIONS = ['left', 'right', 'center'];
  var DIALOG_STYLES = ['default', 'bubble', 'bordered', 'transparent'];

  function clampNumber(value, min, max, fallback) {
    var n = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function parseAttrs(raw) {
    var out = {};
    var src = String(raw || '').trim();
    if (!src) return out;

    src.split(',').forEach(function (segment) {
      var item = String(segment || '').trim();
      if (!item) return;
      var idx = item.indexOf(':');
      if (idx <= 0) return;
      var key = item.slice(0, idx).trim();
      var value = item.slice(idx + 1).trim();
      if (!key) return;
      if (ALLOWED_ATTRS.indexOf(key) === -1) return;
      value = value
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    });

    if (typeof out.role !== 'undefined') {
      var role = String(out.role || '').toLowerCase();
      out.role = ALLOWED_ROLES.indexOf(role) !== -1 ? role : 'custom';
    }
    if (typeof out.tilt !== 'undefined') out.tilt = clampNumber(out.tilt, -20, 20, 0);
    if (typeof out.scale !== 'undefined') out.scale = clampNumber(out.scale, 0.5, 2.0, 1);
    if (typeof out.mode !== 'undefined') {
      var mode = String(out.mode || '').toLowerCase();
      out.mode = TYPING_MODES.indexOf(mode) !== -1 ? mode : 'auto';
    }
    if (typeof out.position !== 'undefined') {
      var pos = String(out.position || '').toLowerCase();
      out.position = DIALOG_POSITIONS.indexOf(pos) !== -1 ? pos : 'left';
    }
    if (typeof out.style !== 'undefined') {
      var st = String(out.style || '').toLowerCase();
      out.style = DIALOG_STYLES.indexOf(st) !== -1 ? st : 'default';
    }

    return out;
  }

  function stringifyAttrs(attrs) {
    var src = attrs && typeof attrs === 'object' ? attrs : {};
    var keys = ['preset', 'role', 'anim', 'tilt', 'scale', 'sfx', 'class', 'speed', 'mode', 'speaker', 'icon', 'position', 'style'];
    var parts = [];

    keys.forEach(function (key) {
      if (typeof src[key] === 'undefined' || src[key] === null || src[key] === '') return;
      var v = src[key];
      if (typeof v === 'number') {
        parts.push(key + ':' + String(v));
        return;
      }
      parts.push(key + ':"' + String(v).replace(/"/g, '\\"') + '"');
    });

    return parts.join(', ');
  }

  function wrap(text, attrs, blockType) {
    var body = String(text || '');
    var type = blockType || 'textbox';
    if (BLOCK_TYPES.indexOf(type) === -1) type = 'textbox';
    var attrText = stringifyAttrs(attrs || {});
    var header = ':::zw-' + type + (attrText ? '{' + attrText + '}' : '');
    return header + '\n' + body + '\n:::';
  }

  function parseSegments(input) {
    var source = String(input || '');
    if (!OPEN_RE.test(source)) {
      return [{ type: 'text', value: source }];
    }

    var segments = [];
    var lastIndex = 0;
    source.replace(BLOCK_RE, function (full, blockType, attrText, content, offset) {
      if (offset > lastIndex) {
        segments.push({
          type: 'text',
          value: source.slice(lastIndex, offset)
        });
      }
      segments.push({
        type: blockType || 'textbox',
        raw: full,
        attrs: parseAttrs(attrText || ''),
        content: String(content || '')
      });
      lastIndex = offset + full.length;
      return full;
    });

    if (lastIndex < source.length) {
      segments.push({
        type: 'text',
        value: source.slice(lastIndex)
      });
    }

    return segments;
  }

  function escapeAttr(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeHtmlText(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function normalizePresetClass(attrs, options) {
    var preset = attrs.preset || '';
    var registry = options && options.registry;
    if (!preset || !registry || typeof registry.resolve !== 'function') return attrs.class || '';
    var resolved = registry.resolve(preset, options.settings || {});
    return (attrs.class || (resolved && resolved.className) || ('zw-textbox--' + String(preset).toLowerCase()));
  }

  function renderTypingHtml(attrs, content) {
    var speed = attrs.speed || '30ms';
    var mode = attrs.mode || 'auto';
    if (TYPING_MODES.indexOf(mode) === -1) mode = 'auto';
    var dataAttrs = 'data-speed="' + escapeAttr(speed) + '" data-mode="' + escapeAttr(mode) + '"';
    return '<div class="zw-typing" ' + dataAttrs + ' aria-live="polite">'
      + '<span class="zw-typing__text">' + escapeHtmlText(content) + '</span>'
      + '</div>';
  }

  function renderDialogHtml(attrs, content) {
    var speaker = attrs.speaker || '';
    var position = attrs.position || 'left';
    if (DIALOG_POSITIONS.indexOf(position) === -1) position = 'left';
    var dialogStyle = attrs.style || 'default';
    if (DIALOG_STYLES.indexOf(dialogStyle) === -1) dialogStyle = 'default';
    var icon = attrs.icon || '';
    var classAttr = 'zw-dialog zw-dialog--' + escapeAttr(position) + ' zw-dialog--' + escapeAttr(dialogStyle);
    var iconHtml = icon ? '<div class="zw-dialog__icon"><img src="' + escapeAttr(icon) + '" alt="' + escapeAttr(speaker) + '"></div>' : '';
    var speakerHtml = speaker ? '<div class="zw-dialog__speaker">' + escapeHtmlText(speaker) + '</div>' : '';
    return '<div class="' + classAttr + '">'
      + iconHtml
      + '<div class="zw-dialog__body">'
      + speakerHtml
      + '<div class="zw-dialog__content">' + escapeHtmlText(content) + '</div>'
      + '</div></div>';
  }

  function toHtml(input, options) {
    var source = String(input || '');
    if (!OPEN_RE.test(source)) return source;

    if (typeof window !== 'undefined'
      && window.TextboxEffectRenderer
      && typeof window.TextboxEffectRenderer.renderSegments === 'function') {
      return window.TextboxEffectRenderer.renderSegments(parseSegments(source), options || {});
    }

    return source.replace(BLOCK_RE, function (_full, blockType, attrText, content) {
      var attrs = parseAttrs(attrText || '');
      var type = blockType || 'textbox';

      if (type === 'typing') {
        return renderTypingHtml(attrs, content);
      }
      if (type === 'dialog') {
        return renderDialogHtml(attrs, content);
      }

      // textbox (default)
      var role = attrs.role ? String(attrs.role) : 'custom';
      var className = normalizePresetClass(attrs, options);
      var dataAttrs = [
        'data-role="' + escapeAttr(role) + '"'
      ];

      if (attrs.preset) dataAttrs.push('data-preset="' + escapeAttr(attrs.preset) + '"');
      if (attrs.anim) dataAttrs.push('data-anim="' + escapeAttr(attrs.anim) + '"');
      if (typeof attrs.tilt !== 'undefined') dataAttrs.push('data-tilt="' + escapeAttr(attrs.tilt) + '"');
      if (typeof attrs.scale !== 'undefined') dataAttrs.push('data-scale="' + escapeAttr(attrs.scale) + '"');
      if (attrs.sfx) dataAttrs.push('data-sfx="' + escapeAttr(attrs.sfx) + '"');

      var style = [];
      if (typeof attrs.tilt !== 'undefined') style.push('transform: rotate(' + attrs.tilt + 'deg) scale(' + (typeof attrs.scale !== 'undefined' ? attrs.scale : 1) + ');');
      else if (typeof attrs.scale !== 'undefined') style.push('transform: scale(' + attrs.scale + ');');

      var styleAttr = style.length ? ' style="' + escapeAttr(style.join(' ')) + '"' : '';
      var classAttr = 'zw-textbox' + (className ? (' ' + className) : '');
      return '<div class="' + escapeAttr(classAttr) + '" ' + dataAttrs.join(' ') + styleAttr + '>' + escapeHtmlText(content) + '</div>';
    });
  }

  var api = {
    BLOCK_TYPES: BLOCK_TYPES,
    ALLOWED_ATTRS: ALLOWED_ATTRS,
    ALLOWED_ROLES: ALLOWED_ROLES,
    TYPING_MODES: TYPING_MODES,
    DIALOG_POSITIONS: DIALOG_POSITIONS,
    DIALOG_STYLES: DIALOG_STYLES,
    parseAttrs: parseAttrs,
    parseSegments: parseSegments,
    stringifyAttrs: stringifyAttrs,
    wrap: wrap,
    toHtml: toHtml
  };

  root.TextboxDslParser = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
