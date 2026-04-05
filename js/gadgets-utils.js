(function () {
  'use strict';

  // Utility functions
  /**
   * Deep clone an object via JSON serialization
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  function clone(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return {}; }
  }

  /**
   * Add item to array if not already present
   * @param {Array} arr - Target array
   * @param {*} item - Item to add
   */
  function uniquePush(arr, item) {
    if (arr.indexOf(item) < 0) arr.push(item);
  }

  /**
   * Normalize and validate a group name
   * @param {string} name - Group name to normalize
   * @returns {string} Normalized group name or empty string if invalid
   */
  function normalizeGroupName(name) {
    var trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed) return '';
    var lower = trimmed.toLowerCase();
    if (KNOWN_GROUPS.indexOf(lower) >= 0) return lower;
    if (GADGET_GROUPS && Object.prototype.hasOwnProperty.call(GADGET_GROUPS, lower)) return lower;
    if (lower === 'typo') return 'typography';
    return '';
  }

  /**
   * Normalize a list of group names
   * @param {Array<string>} list - List of group names
   * @returns {Array<string>} Normalized group names
   */
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

  /**
   * Normalize a list of strings (trim and deduplicate)
   * @param {Array<string>} list - List of strings
   * @returns {Array<string>} Normalized strings
   */
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

  /**
   * Normalize groups object (ensure all known groups are present)
   * @param {Object} groups - Groups object
   * @returns {Object} Normalized groups object
   */
  function normaliseGroups(groups) {
    var g = groups && typeof groups === 'object' ? groups : {};
    var out = {};
    KNOWN_GROUPS.forEach(function (key) {
      out[key] = normalizeList(g[key] || []);
    });
    return out;
  }

  /**
   * Emit a custom event
   * @param {string} eventName - Event name
   * @param {Object} [detail] - Event detail data
   */
  function emit(eventName, detail) {
    try { window.dispatchEvent(new CustomEvent(eventName, { detail: detail || {} })); } catch (_) { }
  }

  /**
   * Execute function when DOM is ready
   * @param {Function} fn - Function to execute
   */
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  // Constants
  var STORAGE_KEY = 'zenWriter_gadgets:prefs';
  var LOADOUT_KEY = 'zenWriter_gadgets:loadouts';
  var KNOWN_GROUPS = ['sections', 'structure', 'edit', 'theme', 'assist', 'advanced'];

  // ガジェットグループ定義（アコーディオン形式対応）
  // グループ名→メタデータのマッピング
  var GADGET_GROUPS = {
    sections: {
      id: 'sections',
      label: 'セクション',
      icon: 'list-tree',
      description: '見出しツリーと話ナビゲーション',
      panelSelector: '[data-gadget-group="sections"]',
      sectionSelector: '[data-category="sections"]'
    },
    structure: {
      id: 'structure',
      label: '構造',
      icon: 'file-text',
      description: 'ドキュメント構造・アウトライン',
      panelSelector: '[data-gadget-group="structure"]',
      sectionSelector: '[data-category="structure"]'
    },
    edit: {
      id: 'edit',
      label: '編集',
      icon: 'edit',
      description: '編集支援ツール',
      panelSelector: '[data-gadget-group="edit"]',
      sectionSelector: '[data-category="edit"]'
    },
    theme: {
      id: 'theme',
      label: 'テーマ',
      icon: 'palette',
      description: '見た目のカスタマイズ',
      panelSelector: '[data-gadget-group="theme"]',
      sectionSelector: '[data-category="theme"]'
    },
    assist: {
      id: 'assist',
      label: '補助',
      icon: 'zap',
      description: '執筆支援ツール',
      panelSelector: '[data-gadget-group="assist"]',
      sectionSelector: '[data-category="assist"]'
    },
    advanced: {
      id: 'advanced',
      label: '詳細設定',
      icon: 'settings',
      description: '高度な設定と管理',
      panelSelector: '[data-gadget-group="advanced"]',
      sectionSelector: '[data-category="advanced"]'
    },
    // 旧グループ名の互換性マッピング
    wiki: {
      id: 'wiki',
      label: 'Wiki（旧）',
      icon: 'book',
      description: '旧Wiki（editに統合）',
      panelSelector: '[data-gadget-group="edit"]',
      sectionSelector: '[data-category="edit"]',
      deprecated: true,
      migratesTo: 'edit'
    },
    typography: {
      id: 'typography',
      label: 'テーマ・フォント（旧）',
      icon: 'type',
      description: '旧Typography（themeに統合）',
      panelSelector: '[data-gadget-group="theme"]',
      sectionSelector: '[data-category="theme"]',
      deprecated: true,
      migratesTo: 'theme'
    },
    settings: {
      id: 'settings',
      label: '設定（旧）',
      icon: 'settings',
      description: '旧Settings（advancedに統合）',
      panelSelector: '[data-gadget-group="advanced"]',
      sectionSelector: '[data-category="advanced"]',
      deprecated: true,
      migratesTo: 'advanced'
    }
  };

  /**
   * Get panel element for a group (data attribute based)
   * @param {string} groupName - Group name
   * @returns {Element|null} Panel element or null
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
   * Get section element for a group (data attribute based)
   * @param {string} groupName - Group name
   * @returns {Element|null} Section element or null
   */
  function getGroupSection(groupName) {
    var group = GADGET_GROUPS[groupName];
    if (!group) return null;
    return document.querySelector(group.sectionSelector);
  }

  /**
   * Validate a group name
   * @param {string} groupName - Group name to validate
   * @returns {boolean} Whether the group name is valid
   */
  function isValidGroup(groupName) {
    return GADGET_GROUPS.hasOwnProperty(groupName);
  }

  /**
   * Register a new group
   * @param {string} groupId - Group identifier
   * @param {string} label - Group label
   * @returns {string} Registered group ID
   */
  function registerGroup(groupId, label) {
    var id = typeof groupId === 'string' ? groupId.trim().toLowerCase() : '';
    if (!id) return '';
    if (KNOWN_GROUPS.indexOf(id) < 0) KNOWN_GROUPS.push(id);
    if (!Object.prototype.hasOwnProperty.call(GADGET_GROUPS, id)) {
      GADGET_GROUPS[id] = {
        id: id,
        label: typeof label === 'string' && label ? label : id,
        panelSelector: '[data-gadget-group="' + id + '"]',
        sectionSelector: '[data-group="' + id + '"]'
      };
    }
    return id;
  }

  // ロードアウトプリセットは loadouts-presets.js から読み込み
  // フォールバック用の最小定義のみ保持（新カテゴリ対応）
  var DEFAULT_LOADOUTS = window.ZWLoadoutPresets || {
    active: 'novel-standard',
    entries: {
      'novel-standard': {
        label: '小説・長編',
        groups: {
          structure: ['Documents', 'Outline', 'TagsAndSmartFolders', 'SnapshotManager'],
          edit: ['StoryWiki'],
          theme: ['Themes', 'Typography', 'HeadingStyles', 'VisualProfile'],
          assist: ['Typewriter', 'FocusMode', 'HUDSettings', 'WritingGoal', 'MarkdownReference'],
          advanced: ['EditorLayout', 'Keybinds', 'LoadoutManager']
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
      registerGroup: registerGroup,
      DEFAULT_LOADOUTS: DEFAULT_LOADOUTS
    };
  } catch (_) { }

})();
