(function () {
  'use strict';

  // Utility functions
  function clone(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return {}; }
  }

  function uniquePush(arr, item) {
    if (arr.indexOf(item) < 0) arr.push(item);
  }

  function normalizeGroupName(name) {
    var trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed) return '';
    var lower = trimmed.toLowerCase();
    if (KNOWN_GROUPS.indexOf(lower) >= 0) return lower;
    if (lower === 'typo') return 'typography';
    return '';
  }

  function normalizeGroupList(list) {
    var out = [];
    if (!Array.isArray(list)) return out;
    for (var i = 0; i < list.length; i++) {
      var mapped = normalizeGroupName(list[i]);
      if (!mapped) continue;
      uniquePush(out, mapped);
    }
    return out;
  }

  function normalizeList(list) {
    var out = [];
    if (!Array.isArray(list)) return out;
    for (var i = 0; i < list.length; i++) {
      var name = list[i];
      if (typeof name !== 'string') continue;
      var trimmed = name.trim();
      if (!trimmed) continue;
      uniquePush(out, trimmed);
    }
    return out;
  }

  function normaliseGroups(groups) {
    var g = groups && typeof groups === 'object' ? groups : {};
    var out = {};
    KNOWN_GROUPS.forEach(function (key) {
      out[key] = normalizeList(g[key] || []);
    });
    return out;
  }

  function emit(eventName, detail) {
    try { window.dispatchEvent(new CustomEvent(eventName, { detail: detail || {} })); } catch (_) { }
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  // Constants
  var STORAGE_KEY = 'zenWriter_gadgets:prefs';
  var LOADOUT_KEY = 'zenWriter_gadgets:loadouts';
  var KNOWN_GROUPS = ['structure', 'wiki', 'assist', 'typography'];

  var DEFAULT_LOADOUTS = {
    active: 'novel-standard',
    entries: {
      'novel-standard': {
        label: '小説・長編',
        groups: {
          structure: [
            'Documents',
            'Outline',
            'OutlineQuick',
            'EditorLayout',
            'SceneGradient',
            'ChoiceTools',
            'PrintSettings'
          ],
          assist: [
            'Typewriter',
            'SnapshotManager',
            'HUDSettings',
            'WritingGoal',
            'Clock',
            'MarkdownPreview',
            'UISettings'
          ],
          typography: ['TypographyThemes'],
          wiki: ['Wiki']
        }
      },
      'novel-minimal': {
        label: 'ミニマル',
        groups: {
          structure: ['Documents', 'Outline', 'EditorLayout', 'SceneGradient'],
          assist: ['HUDSettings', 'WritingGoal', 'Clock'],
          typography: ['TypographyThemes'],
          wiki: ['Wiki']
        }
      },
      'vn-layout': {
        label: 'ビジュアルノベル',
        groups: {
          structure: [
            'Documents',
            'Outline',
            'EditorLayout',
            'SceneGradient',
            'Images',
            'ChoiceTools'
          ],
          assist: [
            'Typewriter',
            'SnapshotManager',
            'HUDSettings',
            'WritingGoal',
            'Clock',
            'MarkdownPreview',
            'UISettings'
          ],
          typography: ['TypographyThemes'],
          wiki: ['Wiki', 'StoryWiki']
        }
      }
    }
  };

  // Export utilities
  try {
    window.ZWGadgetsUtils = {
      clone: clone,
      uniquePush: uniquePush,
      normalizeGroupName: normalizeGroupName,
      normalizeGroupList: normalizeGroupList,
      normalizeList: normalizeList,
      normaliseGroups: normaliseGroups,
      emit: emit,
      ready: ready,
      STORAGE_KEY: STORAGE_KEY,
      LOADOUT_KEY: LOADOUT_KEY,
      KNOWN_GROUPS: KNOWN_GROUPS,
      DEFAULT_LOADOUTS: DEFAULT_LOADOUTS
    };
  } catch (_) { }

})();
