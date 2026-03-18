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

  var TEXTURES = {
    wave: { tag: 'wave', className: 'tex-wave', reducedMotion: 'drop' },
    sparkle: { tag: 'sparkle', className: 'tex-sparkle', reducedMotion: 'drop' },
    cosmic: { tag: 'cosmic', className: 'tex-cosmic', reducedMotion: 'drop' },
    fire: { tag: 'fire', className: 'tex-fire', reducedMotion: 'drop' },
    glitch: { tag: 'glitch', className: 'tex-glitch', reducedMotion: 'drop' }
  };

  function get(tag) {
    if (!tag) return null;
    return ANIMATIONS[String(tag).toLowerCase()] || null;
  }

  function list() {
    return Object.keys(ANIMATIONS).map(function (key) { return ANIMATIONS[key]; });
  }

  function getTexture(tag) {
    if (!tag) return null;
    return TEXTURES[String(tag).toLowerCase()] || null;
  }

  function listTextures() {
    return Object.keys(TEXTURES).map(function (key) { return TEXTURES[key]; });
  }

  var api = {
    ANIMATIONS: ANIMATIONS,
    TEXTURES: TEXTURES,
    get: get,
    getTexture: getTexture,
    list: list,
    listTextures: listTextures
  };

  root.TextAnimationDictionary = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
