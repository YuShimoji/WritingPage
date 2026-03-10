(function (root) {
  'use strict';

  var ANIMATIONS = {
    fade: { tag: 'fade', className: 'anim-fade', reducedMotion: 'drop' },
    slide: { tag: 'slide', className: 'anim-slide', reducedMotion: 'drop' },
    type: { tag: 'type', className: 'anim-typewriter', reducedMotion: 'drop' },
    pulse: { tag: 'pulse', className: 'anim-pulse', reducedMotion: 'drop' },
    shake: { tag: 'shake', className: 'anim-shake', reducedMotion: 'drop' },
    bounce: { tag: 'bounce', className: 'anim-bounce', reducedMotion: 'drop' },
    fadein: { tag: 'fadein', className: 'anim-fade-in', reducedMotion: 'drop' }
  };

  function get(tag) {
    if (!tag) return null;
    return ANIMATIONS[String(tag).toLowerCase()] || null;
  }

  function list() {
    return Object.keys(ANIMATIONS).map(function (key) { return ANIMATIONS[key]; });
  }

  var api = {
    ANIMATIONS: ANIMATIONS,
    get: get,
    list: list
  };

  root.TextAnimationDictionary = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
