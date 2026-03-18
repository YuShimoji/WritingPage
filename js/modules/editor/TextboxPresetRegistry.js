/**
 * TextboxPresetRegistry
 * Phase 1: preset registry for extended textbox feature.
 */
(function (root) {
  'use strict';

  var MAX_USER_PRESETS = 100;
  var ALLOWED_ROLES = ['dialogue', 'monologue', 'narration', 'sfx', 'system', 'custom'];

  var BUILTIN_PRESETS = [
    {
      id: 'inner-voice',
      label: '心の声',
      role: 'monologue',
      anim: 'fadein',
      tilt: -4,
      scale: 0.98,
      className: 'zw-textbox--inner-voice',
      textEffects: ['italic'],
      animations: ['fadein'],
      ornaments: ['soft']
    },
    {
      id: 'se-animal-fade',
      label: '動物SE',
      role: 'sfx',
      anim: 'fade',
      tilt: 0,
      scale: 1,
      sfx: 'animal-fadeout',
      className: 'zw-textbox--se-animal-fade',
      textEffects: ['black', 'outline'],
      animations: ['shake', 'fade'],
      ornaments: ['burst']
    },
    {
      id: 'typing-sequence',
      label: 'タイピング',
      role: 'system',
      anim: 'type',
      tilt: 0,
      scale: 1,
      sfx: 'typing-loop',
      className: 'zw-textbox--typing-sequence',
      textEffects: [],
      animations: ['type'],
      ornaments: ['mono']
    },
    {
      id: 'dialogue',
      label: '台詞',
      role: 'dialogue',
      anim: '',
      tilt: 0,
      scale: 1,
      className: 'zw-textbox--dialogue',
      textEffects: [],
      animations: [],
      ornaments: []
    },
    {
      id: 'monologue',
      label: '独白',
      role: 'monologue',
      anim: 'fadein',
      tilt: -2,
      scale: 0.98,
      className: 'zw-textbox--monologue',
      textEffects: ['italic'],
      animations: ['fadein'],
      ornaments: ['soft']
    },
    {
      id: 'narration',
      label: '語り',
      role: 'narration',
      anim: '',
      tilt: 0,
      scale: 0.95,
      className: 'zw-textbox--narration',
      textEffects: [],
      animations: [],
      ornaments: ['mono']
    },
    {
      id: 'chant',
      label: '詠唱',
      role: 'custom',
      anim: 'shake',
      tilt: 0,
      scale: 1.05,
      className: 'zw-textbox--chant',
      textEffects: ['bold', 'outline'],
      animations: ['shake'],
      ornaments: ['burst']
    },
    {
      id: 'warning',
      label: '警告',
      role: 'system',
      anim: 'shake',
      tilt: 2,
      scale: 1.02,
      className: 'zw-textbox--warning',
      textEffects: ['bold'],
      animations: ['shake'],
      ornaments: ['burst']
    }
  ];

  function clampNumber(value, min, max, fallback) {
    var n = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function sanitizeId(id) {
    var s = String(id || '').trim().toLowerCase();
    if (!s) return '';
    return s.replace(/[^a-z0-9-_]/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
  }

  function normalizeRole(role) {
    var value = String(role || 'custom').trim().toLowerCase();
    return ALLOWED_ROLES.indexOf(value) !== -1 ? value : 'custom';
  }

  function normalizePreset(input, fallbackId) {
    if (!input || typeof input !== 'object') return null;
    var id = sanitizeId(input.id || fallbackId || '');
    if (!id) return null;
    return {
      id: id,
      label: String(input.label || input.name || id),
      role: normalizeRole(input.role),
      anim: input.anim ? String(input.anim) : '',
      tilt: clampNumber(input.tilt, -20, 20, 0),
      scale: clampNumber(input.scale, 0.5, 2.0, 1),
      sfx: input.sfx ? String(input.sfx) : '',
      className: input.className ? String(input.className) : ('zw-textbox--' + id),
      textEffects: Array.isArray(input.textEffects) ? input.textEffects.slice(0, 6) : [],
      animations: Array.isArray(input.animations) ? input.animations.slice(0, 4) : [],
      ornaments: Array.isArray(input.ornaments) ? input.ornaments.slice(0, 4) : []
    };
  }

  function list(settings) {
    var all = BUILTIN_PRESETS.map(function (p) { return normalizePreset(p, p.id); }).filter(Boolean);
    var userPresets = settings && settings.editor && settings.editor.extendedTextbox
      ? settings.editor.extendedTextbox.userPresets
      : [];

    if (Array.isArray(userPresets)) {
      userPresets.slice(0, MAX_USER_PRESETS).forEach(function (raw, index) {
        var preset = normalizePreset(raw, 'user-' + index);
        if (!preset) return;
        var dup = all.some(function (it) { return it.id === preset.id; });
        if (!dup) all.push(preset);
      });
    }

    return all;
  }

  function resolve(presetId, settings) {
    var presets = list(settings);
    var id = sanitizeId(presetId || '');
    if (id) {
      for (var i = 0; i < presets.length; i += 1) {
        if (presets[i].id === id) return presets[i];
      }
    }

    var fallbackId = settings && settings.editor && settings.editor.extendedTextbox
      ? sanitizeId(settings.editor.extendedTextbox.defaultPreset)
      : '';

    if (fallbackId) {
      for (var j = 0; j < presets.length; j += 1) {
        if (presets[j].id === fallbackId) return presets[j];
      }
    }

    return presets[0] || normalizePreset(BUILTIN_PRESETS[0], 'inner-voice');
  }

  var api = {
    BUILTIN_PRESETS: BUILTIN_PRESETS,
    MAX_USER_PRESETS: MAX_USER_PRESETS,
    ALLOWED_ROLES: ALLOWED_ROLES,
    list: list,
    resolve: resolve,
    normalizePreset: normalizePreset,
    sanitizeId: sanitizeId,
    normalizeRole: normalizeRole
  };

  root.TextboxPresetRegistry = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
