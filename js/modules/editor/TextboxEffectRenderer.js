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

  function renderTyping(segment) {
    if (!segment || segment.type !== 'typing') return '';
    var attrs = segment.attrs || {};
    var speed = attrs.speed || '30ms';
    var mode = attrs.mode || 'auto';
    var validModes = ['auto', 'click', 'scroll'];
    if (validModes.indexOf(mode) === -1) mode = 'auto';
    var sfx = attrs.sfx || '';
    var content = escapeHtmlText(segment.content || '');
    var sfxAttr = sfx ? ' data-sfx="' + escapeAttr(sfx) + '"' : '';
    return '<div class="zw-typing" data-speed="' + escapeAttr(speed) + '" data-mode="' + escapeAttr(mode) + '"' + sfxAttr + ' aria-live="polite">'
      + '<span class="zw-typing__text">' + content + '</span>'
      + '<span class="zw-typing__full sr-only">' + content + '</span>'
      + '</div>';
  }

  function renderDialog(segment) {
    if (!segment || segment.type !== 'dialog') return '';
    var attrs = segment.attrs || {};
    var speaker = attrs.speaker || '';
    var position = attrs.position || 'left';
    var validPos = ['left', 'right', 'center'];
    if (validPos.indexOf(position) === -1) position = 'left';
    var dialogStyle = attrs.style || 'default';
    var validStyles = ['default', 'bubble', 'bordered', 'transparent'];
    if (validStyles.indexOf(dialogStyle) === -1) dialogStyle = 'default';
    var icon = attrs.icon || '';
    var classAttr = 'zw-dialog zw-dialog--' + position + ' zw-dialog--' + dialogStyle;
    var iconHtml = icon ? '<div class="zw-dialog__icon"><img src="' + escapeAttr(icon) + '" alt="' + escapeAttr(speaker) + '"></div>' : '';
    var speakerHtml = speaker ? '<div class="zw-dialog__speaker">' + escapeHtmlText(speaker) + '</div>' : '';
    var content = escapeHtmlText(segment.content || '');
    return '<div class="' + classAttr + '">'
      + iconHtml
      + '<div class="zw-dialog__body">'
      + speakerHtml
      + '<div class="zw-dialog__content">' + content + '</div>'
      + '</div></div>';
  }

  function renderScroll(segment) {
    if (!segment || segment.type !== 'scroll') return '';
    var attrs = segment.attrs || {};
    var validEffects = ['fade-in', 'slide-up', 'slide-left', 'slide-right', 'zoom-in'];
    var effect = attrs.effect || 'fade-in';
    if (validEffects.indexOf(effect) === -1) effect = 'fade-in';
    var delay = attrs.delay || '0ms';
    var threshold = typeof attrs.threshold !== 'undefined' ? attrs.threshold : 0.2;
    var sfx = attrs.sfx || '';
    var content = escapeHtmlText(segment.content || '');
    var sfxAttr = sfx ? ' data-sfx="' + escapeAttr(sfx) + '"' : '';
    return '<div class="zw-scroll zw-scroll--' + escapeAttr(effect) + '"'
      + ' data-effect="' + escapeAttr(effect) + '"'
      + ' data-delay="' + escapeAttr(delay) + '"'
      + ' data-threshold="' + escapeAttr(threshold) + '"'
      + sfxAttr + '>'
      + '<div class="zw-scroll__content">' + content + '</div>'
      + '</div>';
  }

  function renderSegments(segments, options) {
    var list = Array.isArray(segments) ? segments : [];
    return list.map(function (segment) {
      if (!segment) return '';
      if (segment.type === 'textbox') return renderTextbox(segment, options || {});
      if (segment.type === 'typing') return renderTyping(segment);
      if (segment.type === 'dialog') return renderDialog(segment);
      if (segment.type === 'scroll') return renderScroll(segment);
      if (segment.type === 'pathtext') return renderPathtext(segment);
      return typeof segment.value === 'string' ? segment.value : '';
    }).join('');
  }

  // SP-073: pathtext レンダリング（DslParser の renderPathtextHtml に委譲）
  var pathtextIdCounter = 0;
  function renderPathtext(segment) {
    pathtextIdCounter += 1;
    var attrs = segment.attrs || {};
    var content = segment.content || '';
    var pathId = 'zw-pathtext-r-' + pathtextIdCounter;
    var pathD = attrs.path || 'M 10 80 Q 95 10 180 80';
    var fontSize = attrs['font-size'] || '16px';
    var textAnchor = attrs['text-anchor'] || 'start';
    var startOffset = attrs['start-offset'] || '0%';
    var viewBox = attrs.viewbox || '';
    var stroke = attrs.stroke || 'none';
    var strokeWidth = attrs['stroke-width'] || '0';
    var showPath = stroke !== 'none';

    if (!viewBox) {
      var nums = pathD.match(/-?\d+\.?\d*/g);
      if (nums && nums.length >= 2) {
        var xs = [], ys = [];
        for (var i = 0; i < nums.length; i++) {
          (i % 2 === 0 ? xs : ys).push(parseFloat(nums[i]));
        }
        var pad = 20;
        viewBox = (Math.min.apply(null, xs) - pad) + ' ' + (Math.min.apply(null, ys) - pad) + ' '
          + (Math.max.apply(null, xs) - Math.min.apply(null, xs) + pad * 2) + ' '
          + (Math.max.apply(null, ys) - Math.min.apply(null, ys) + pad * 2);
      } else {
        viewBox = '0 0 200 100';
      }
    }

    var pathStroke = showPath
      ? ' stroke="' + escapeAttr(stroke) + '" stroke-width="' + escapeAttr(strokeWidth) + '"'
      : '';

    return '<div class="zw-pathtext" data-path="' + escapeAttr(pathD) + '">'
      + '<svg viewBox="' + escapeAttr(viewBox) + '" class="zw-pathtext__svg" preserveAspectRatio="xMidYMid meet">'
      + '<defs><path id="' + pathId + '" d="' + escapeAttr(pathD) + '" fill="transparent"' + pathStroke + ' /></defs>'
      + (showPath ? '<use href="#' + pathId + '" fill="transparent"' + pathStroke + ' />' : '')
      + '<text font-size="' + escapeAttr(fontSize) + '" fill="currentColor">'
      + '<textPath href="#' + pathId + '"'
      + ' text-anchor="' + escapeAttr(textAnchor) + '"'
      + ' startOffset="' + escapeAttr(startOffset) + '">'
      + escapeHtmlText(content)
      + '</textPath></text></svg></div>';
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
