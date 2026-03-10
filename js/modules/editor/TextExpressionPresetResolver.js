(function (root) {
  'use strict';

  function ensureArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function isReducedMotionRequested(options) {
    if (options && typeof options.reduceMotion === 'boolean') return options.reduceMotion;
    try {
      if (typeof document !== 'undefined' && document.documentElement.getAttribute('data-reduce-motion') === 'true') {
        return true;
      }
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return !!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
    } catch (_) { }
    return false;
  }

  function getFallbackMode(settings) {
    var mode = settings && settings.editor && settings.editor.textExpression
      ? settings.editor.textExpression.fallbackMode
      : 'plain';
    return mode === 'backlog' ? 'backlog' : 'plain';
  }

  function normalizeLayers(preset, attrs, options) {
    var effectDict = root.TextEffectDictionary;
    var animationDict = root.TextAnimationDictionary;
    var ornamentDict = root.TextOrnamentDictionary;
    var reducedMotion = isReducedMotionRequested(options);

    var textEffects = ensureArray(preset.textEffects).filter(function (tag) {
      return !!(effectDict && typeof effectDict.get === 'function' && effectDict.get(tag));
    });
    var animations = ensureArray(preset.animations);
    if (attrs.anim) animations.unshift(String(attrs.anim));
    animations = animations.filter(function (tag, index, arr) {
      return arr.indexOf(tag) === index
        && !!(animationDict && typeof animationDict.get === 'function' && animationDict.get(tag));
    });
    var ornaments = ensureArray(preset.ornaments).filter(function (id) {
      return !!(ornamentDict && typeof ornamentDict.get === 'function' && ornamentDict.get(id));
    });

    if (reducedMotion) {
      animations = animations.filter(function (tag) {
        var def = animationDict.get(tag);
        return def && def.reducedMotion !== 'drop';
      });
    }

    return {
      textEffects: textEffects,
      animations: animations,
      ornaments: ornaments
    };
  }

  function resolveTextbox(attrs, settings, options) {
    var safeAttrs = attrs && typeof attrs === 'object' ? attrs : {};
    var textExpressionSettings = settings && settings.editor && settings.editor.textExpression
      ? settings.editor.textExpression
      : {};
    var registry = root.TextboxPresetRegistry;
    var preset = registry && typeof registry.resolve === 'function'
      ? registry.resolve(safeAttrs.preset || '', settings || {})
      : {
          id: safeAttrs.preset || 'inner-voice',
          role: safeAttrs.role || 'custom',
          anim: safeAttrs.anim || '',
          tilt: safeAttrs.tilt,
          scale: safeAttrs.scale
        };

    var layers = normalizeLayers(preset, safeAttrs, options || {});
    if (textExpressionSettings.enabled === false) {
      layers.animations = [];
      layers.textEffects = [];
      layers.ornaments = [];
    }
    return {
      presetId: preset.id,
      label: preset.label || preset.id,
      role: safeAttrs.role || preset.role || 'custom',
      sfx: safeAttrs.sfx || preset.sfx || '',
      fallbackMode: getFallbackMode(settings || {}),
      className: safeAttrs.class || preset.className || ('zw-textbox--' + String(preset.id || 'custom')),
      tilt: typeof safeAttrs.tilt === 'number' ? safeAttrs.tilt : preset.tilt,
      scale: typeof safeAttrs.scale === 'number' ? safeAttrs.scale : preset.scale,
      layers: layers,
      reducedMotion: isReducedMotionRequested(options),
      meta: {
        sourcePreset: preset
      }
    };
  }

  var api = {
    resolveTextbox: resolveTextbox,
    isReducedMotionRequested: isReducedMotionRequested
  };

  root.TextExpressionPresetResolver = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
