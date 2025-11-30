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

  // ガジェットグループ定義（フェーズC-1: データ属性ベースの安定セレクタ）
  // グループ名→メタデータのマッピング
  var GADGET_GROUPS = {
    structure: {
      id: 'structure',
      label: '構造',
      panelSelector: '[data-gadget-group="structure"]',
      sectionSelector: '[data-group="structure"]'
    },
    typography: {
      id: 'typography',
      label: 'テーマ・フォント',
      panelSelector: '[data-gadget-group="typography"]',
      sectionSelector: '[data-group="typography"]'
    },
    wiki: {
      id: 'wiki',
      label: 'Wiki',
      panelSelector: '[data-gadget-group="wiki"]',
      sectionSelector: '[data-group="wiki"]'
    },
    assist: {
      id: 'assist',
      label: 'アシスト',
      panelSelector: '[data-gadget-group="assist"]',
      sectionSelector: '[data-group="assist"]'
    }
  };

  /**
   * グループ名からパネル要素を取得（データ属性ベース）
   * @param {string} groupName
   * @returns {Element|null}
   */
  function getGroupPanel(groupName) {
    var group = GADGET_GROUPS[groupName];
    if (!group) {
      console.warn('[ZWGadgets] Unknown group:', groupName);
      return null;
    }
    return document.querySelector(group.panelSelector);
  }

  /**
   * グループ名からセクション要素を取得（データ属性ベース）
   * @param {string} groupName
   * @returns {Element|null}
   */
  function getGroupSection(groupName) {
    var group = GADGET_GROUPS[groupName];
    if (!group) return null;
    return document.querySelector(group.sectionSelector);
  }

  /**
   * グループ名のバリデーション
   * @param {string} groupName
   * @returns {boolean}
   */
  function isValidGroup(groupName) {
    return GADGET_GROUPS.hasOwnProperty(groupName);
  }

  // ロードアウトプリセットは loadouts-presets.js から読み込み
  // フォールバック用の最小定義のみ保持
  var DEFAULT_LOADOUTS = window.ZWLoadoutPresets || {
    active: 'novel-standard',
    entries: {
      'novel-standard': {
        label: '小説・長編',
        groups: {
          structure: ['Documents', 'Outline', 'EditorLayout'],
          assist: ['HUDSettings', 'Clock'],
          typography: ['TypographyThemes'],
          wiki: ['Wiki']
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
      GADGET_GROUPS: GADGET_GROUPS,
      getGroupPanel: getGroupPanel,
      getGroupSection: getGroupSection,
      isValidGroup: isValidGroup,
      DEFAULT_LOADOUTS: DEFAULT_LOADOUTS
    };
  } catch (_) { }

})();
