(function (root) {
  'use strict';

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

  function wrapWithSpan(html, className) {
    if (!className) return html;
    return '<span class="' + escapeAttr(className) + '">' + html + '</span>';
  }

  function renderFallback(content, detail, fallbackMode) {
    var safeContent = escapeHtmlText(content || '');
    var className = fallbackMode === 'backlog'
      ? 'zw-textbox zw-textbox--plain zw-textbox--backlog'
      : 'zw-textbox zw-textbox--plain';
    var note = fallbackMode === 'backlog'
      ? '<div class="zw-textbox__fallback-note">Tier 2 backlog: ' + escapeHtmlText(detail || 'unsupported-expression') + '</div>'
      : '';
    return '<div class="' + className + '" data-fallback-mode="' + escapeAttr(fallbackMode) + '" data-fallback-detail="' + escapeAttr(detail || 'unsupported-expression') + '">' + safeContent + note + '</div>';
  }

  function renderTextbox(segment, options) {
    if (!segment || segment.type !== 'textbox') return '';
    var settings = options && options.settings ? options.settings : {};
    var resolver = root.TextExpressionPresetResolver;
    var effectDict = root.TextEffectDictionary;
    var animationDict = root.TextAnimationDictionary;
    var ornamentDict = root.TextOrnamentDictionary;
    var resolved = resolver && typeof resolver.resolveTextbox === 'function'
      ? resolver.resolveTextbox(segment.attrs || {}, settings, options || {})
      : null;

    if (!resolved) {
      return renderFallback(segment.content, 'resolver-unavailable', 'plain');
    }

    if (String(segment.content || '').indexOf(':::zw-textbox') !== -1) {
      return renderFallback(segment.content, 'nested-textbox', resolved.fallbackMode);
    }

    var classNames = ['zw-textbox'];
    if (resolved.className) classNames.push(resolved.className);

    (resolved.layers.ornaments || []).forEach(function (ornamentId) {
      var def = ornamentDict && typeof ornamentDict.get === 'function' ? ornamentDict.get(ornamentId) : null;
      if (def && def.className) classNames.push(def.className);
    });

    if (resolved.reducedMotion) classNames.push('zw-textbox--motion-reduced');

    var contentHtml = escapeHtmlText(segment.content || '');
    (resolved.layers.textEffects || []).forEach(function (tag) {
      var def = effectDict && typeof effectDict.get === 'function' ? effectDict.get(tag) : null;
      if (def && def.className) contentHtml = wrapWithSpan(contentHtml, def.className);
    });
    (resolved.layers.animations || []).forEach(function (tag) {
      var def = animationDict && typeof animationDict.get === 'function' ? animationDict.get(tag) : null;
      if (def && def.className) contentHtml = wrapWithSpan(contentHtml, def.className);
    });

    var dataAttrs = [
      'data-role="' + escapeAttr(resolved.role) + '"',
      'data-expression-tier="1"'
    ];
    if (resolved.presetId) dataAttrs.push('data-preset="' + escapeAttr(resolved.presetId) + '"');
    if (resolved.sfx) dataAttrs.push('data-sfx="' + escapeAttr(resolved.sfx) + '"');
    if (resolved.layers.animations && resolved.layers.animations.length) {
      dataAttrs.push('data-anim="' + escapeAttr(resolved.layers.animations.join(' ')) + '"');
    }
    if (resolved.layers.ornaments && resolved.layers.ornaments.length) {
      dataAttrs.push('data-ornament="' + escapeAttr(resolved.layers.ornaments.join(' ')) + '"');
    }

    var style = [];
    if (typeof resolved.tilt === 'number') {
      style.push('rotate(' + resolved.tilt + 'deg)');
    }
    if (typeof resolved.scale === 'number') {
      style.push('scale(' + resolved.scale + ')');
    }
    var styleAttr = style.length ? ' style="transform: ' + escapeAttr(style.join(' ')) + ';"' : '';

    return '<div class="' + escapeAttr(classNames.join(' ')) + '" ' + dataAttrs.join(' ') + styleAttr + '><div class="zw-textbox__content">' + contentHtml + '</div></div>';
  }

  function renderSegments(segments, options) {
    var list = Array.isArray(segments) ? segments : [];
    return list.map(function (segment) {
      if (!segment || segment.type !== 'textbox') return segment && typeof segment.value === 'string' ? segment.value : '';
      return renderTextbox(segment, options || {});
    }).join('');
  }

  var api = {
    renderSegments: renderSegments,
    renderTextbox: renderTextbox
  };

  root.TextboxEffectRenderer = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
