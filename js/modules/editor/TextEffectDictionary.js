(function (root) {
  'use strict';

  var EFFECTS = {
    bold: { tag: 'bold', className: 'decor-bold' },
    italic: { tag: 'italic', className: 'decor-italic' },
    underline: { tag: 'underline', className: 'decor-underline' },
    strike: { tag: 'strike', className: 'decor-strikethrough' },
    smallcaps: { tag: 'smallcaps', className: 'decor-smallcaps' },
    light: { tag: 'light', className: 'decor-light' },
    shadow: { tag: 'shadow', className: 'decor-shadow' },
    black: { tag: 'black', className: 'decor-black' },
    uppercase: { tag: 'uppercase', className: 'decor-uppercase' },
    lowercase: { tag: 'lowercase', className: 'decor-lowercase' },
    capitalize: { tag: 'capitalize', className: 'decor-capitalize' },
    outline: { tag: 'outline', className: 'decor-outline' },
    glow: { tag: 'glow', className: 'decor-glow' },
    wide: { tag: 'wide', className: 'decor-wide' },
    narrow: { tag: 'narrow', className: 'decor-narrow' }
  };

  function get(tag) {
    if (!tag) return null;
    return EFFECTS[String(tag).toLowerCase()] || null;
  }

  function list() {
    return Object.keys(EFFECTS).map(function (key) { return EFFECTS[key]; });
  }

  var api = {
    EFFECTS: EFFECTS,
    get: get,
    list: list
  };

  root.TextEffectDictionary = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
