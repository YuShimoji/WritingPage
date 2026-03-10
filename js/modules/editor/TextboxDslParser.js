/**
 * TextboxDslParser
 * Phase 1 parser/serializer and HTML transformer for :::zw-textbox blocks.
 */
(function (root) {
  'use strict';

  var OPEN_RE = /:::zw-textbox(?:\{([^}]*)\})?(?:\r?\n|<br\s*\/?>)/i;
  var BLOCK_RE = /:::zw-textbox(?:\{([^}]*)\})?(?:\r?\n|<br\s*\/?>)([\s\S]*?)(?:\r?\n|<br\s*\/?>):::/gi;
  var ALLOWED_ATTRS = ['preset', 'role', 'anim', 'tilt', 'scale', 'sfx', 'class'];
  var ALLOWED_ROLES = ['dialogue', 'monologue', 'narration', 'sfx', 'system', 'custom'];

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

    return out;
  }

  function stringifyAttrs(attrs) {
    var src = attrs && typeof attrs === 'object' ? attrs : {};
    var keys = ['preset', 'role', 'anim', 'tilt', 'scale', 'sfx', 'class'];
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

  function wrap(text, attrs) {
    var body = String(text || '');
    var attrText = stringifyAttrs(attrs || {});
    var header = ':::zw-textbox' + (attrText ? '{' + attrText + '}' : '');
    return header + '\n' + body + '\n:::';
  }

  function parseSegments(input) {
    var source = String(input || '');
    if (!OPEN_RE.test(source)) {
      return [{ type: 'text', value: source }];
    }

    var segments = [];
    var lastIndex = 0;
    source.replace(BLOCK_RE, function (full, attrText, content, offset) {
      if (offset > lastIndex) {
        segments.push({
          type: 'text',
          value: source.slice(lastIndex, offset)
        });
      }
      segments.push({
        type: 'textbox',
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

  function toHtml(input, options) {
    var source = String(input || '');
    if (!OPEN_RE.test(source)) return source;

    if (typeof window !== 'undefined'
      && window.TextboxEffectRenderer
      && typeof window.TextboxEffectRenderer.renderSegments === 'function') {
      return window.TextboxEffectRenderer.renderSegments(parseSegments(source), options || {});
    }

    return source.replace(BLOCK_RE, function (_full, attrText, content) {
      var attrs = parseAttrs(attrText || '');
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
    ALLOWED_ATTRS: ALLOWED_ATTRS,
    ALLOWED_ROLES: ALLOWED_ROLES,
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
