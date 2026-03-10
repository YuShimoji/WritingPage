(function (root) {
  'use strict';

  var ORNAMENTS = {
    soft: { id: 'soft', className: 'zw-ornament-soft', tier: 1 },
    burst: { id: 'burst', className: 'zw-ornament-burst', tier: 1 },
    mono: { id: 'mono', className: 'zw-ornament-mono', tier: 1 }
  };

  function get(id) {
    if (!id) return null;
    return ORNAMENTS[String(id).toLowerCase()] || null;
  }

  function list() {
    return Object.keys(ORNAMENTS).map(function (key) { return ORNAMENTS[key]; });
  }

  var api = {
    ORNAMENTS: ORNAMENTS,
    get: get,
    list: list
  };

  root.TextOrnamentDictionary = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
