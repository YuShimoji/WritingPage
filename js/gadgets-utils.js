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
    if (lower === 'typo') lower = 'typography';
    if (KNOWN_GROUPS.indexOf(lower) >= 0) return lower;
    // 旧区分（sections / structure / edit / theme / assist など）は現行の4区分へ読み替える
    if (Object.prototype.hasOwnProperty.call(LEGACY_GROUP_MAP, lower)) return LEGACY_GROUP_MAP[lower];
    if (GADGET_GROUPS && Object.prototype.hasOwnProperty.call(GADGET_GROUPS, lower)) return lower;
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
    // 旧区分で保存された配置を現行の区分へ移す（旧キーは読み取り専用の入力として扱う）。
    // 個別に移動先が決まっているガジェット（Wiki・画像など）は旧区分の既定より優先する。
    LEGACY_GROUP_ORDER.forEach(function (legacyKey) {
      if (!Object.prototype.hasOwnProperty.call(g, legacyKey)) return;
      normalizeList(g[legacyKey] || []).forEach(function (gadgetName) {
        var dest = GADGET_HOME_OVERRIDES[gadgetName] || LEGACY_GROUP_MAP[legacyKey];
        if (!dest || !out[dest]) return;
        uniquePush(out[dest], gadgetName);
      });
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
  // 左ナビの区分は作業単位の4つ。1区分 = 1グループ = 1パネル。
  //   manuscript 原稿: 書く・構成する（セクション・文書・アウトライン・バックアップ）
  //   reference  資料: 参照する（Wiki・リンクグラフ・画像・Markdown早見表）
  //   view       表示: 見え方と集中（集中・タイプライター・目標・テーマ・フォント）
  //   advanced   設定: 環境設定・出力・キー割り当て
  var KNOWN_GROUPS = ['manuscript', 'reference', 'view', 'advanced'];

  // 旧区分（6区分時代）から現行区分への読み替え。保存済みの配置・外部プラグイン・
  // 呼び出し元の旧IDを壊さないために残す。ここに無い旧IDは未知として扱う。
  var LEGACY_GROUP_MAP = {
    sections: 'manuscript',
    structure: 'manuscript',
    edit: 'manuscript',
    theme: 'view',
    assist: 'view',
    wiki: 'reference',
    typography: 'view'
  };
  // 旧キーを取り込む順（先に取り込んだものが区分内の上側に並ぶ）。
  // セクション移動を最上段に、集中・目標（assist）をテーマより上に置く。
  // 'settings'（設定モーダル専用のグループ）は左ナビの区分ではないため対象外。
  var LEGACY_GROUP_ORDER = ['sections', 'structure', 'edit', 'assist', 'theme', 'wiki', 'typography'];
  // 旧区分の既定とは別の区分へ移すガジェット。旧キーの保存データを移すときだけ使う。
  var GADGET_HOME_OVERRIDES = {
    StoryWiki: 'reference',
    LinkGraph: 'reference',
    Images: 'reference',
    MarkdownReference: 'reference',
    MarkdownPreview: 'view'
  };

  // ガジェットグループ定義（アコーディオン形式対応）
  // グループ名→メタデータのマッピング
  var GADGET_GROUPS = {
    manuscript: {
      id: 'manuscript',
      label: '原稿',
      icon: 'file-text',
      description: '書く・構成する（セクション・文書・アウトライン・バックアップ）',
      panelSelector: '[data-gadget-group="manuscript"]',
      sectionSelector: '[data-category="manuscript"]'
    },
    reference: {
      id: 'reference',
      label: '資料',
      icon: 'book-open',
      description: '参照する（Wiki・リンクグラフ・画像・Markdown早見表）',
      panelSelector: '[data-gadget-group="reference"]',
      sectionSelector: '[data-category="reference"]'
    },
    view: {
      id: 'view',
      label: '表示',
      icon: 'sliders-horizontal',
      description: '見え方と集中（集中・タイプライター・目標・テーマ・フォント）',
      panelSelector: '[data-gadget-group="view"]',
      sectionSelector: '[data-category="view"]'
    },
    advanced: {
      id: 'advanced',
      label: '設定',
      icon: 'settings',
      description: '環境設定・運用管理・出力・キー割り当て',
      panelSelector: '[data-gadget-group="advanced"]',
      sectionSelector: '[data-category="advanced"]'
    }
  };
  // 旧区分名もメタデータ上は現行区分のパネルを指す（registerGroup 済みの外部グループとは別）
  Object.keys(LEGACY_GROUP_MAP).forEach(function (legacyId) {
    var target = GADGET_GROUPS[LEGACY_GROUP_MAP[legacyId]];
    GADGET_GROUPS[legacyId] = {
      id: legacyId,
      label: target.label + '（旧' + legacyId + '）',
      icon: target.icon,
      description: '旧区分 ' + legacyId + ' は ' + target.label + ' に統合',
      panelSelector: target.panelSelector,
      sectionSelector: target.sectionSelector,
      deprecated: true,
      migratesTo: target.id
    };
  });
  // 設定モーダル用の独立グループ。左ナビの区分ではなく、保存する loadout にも含めない。
  GADGET_GROUPS.settings = {
    id: 'settings',
    label: '設定モーダル',
    icon: 'settings',
    description: '設定モーダル専用のガジェット（ローカルMod管理など）',
    panelSelector: '[data-gadget-group="settings"]',
    sectionSelector: '[data-category="advanced"]'
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
          manuscript: ['SectionsNavigator', 'Documents', 'Outline', 'TagsAndSmartFolders', 'SnapshotManager'],
          reference: ['StoryWiki', 'LinkGraph', 'MarkdownReference'],
          view: ['FocusMode', 'Typewriter', 'WritingGoal', 'Themes', 'Typography', 'HeadingStyles', 'VisualProfile'],
          advanced: ['EditorLayout', 'UISettings', 'PrintSettings', 'Keybinds']
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
      LEGACY_GROUP_MAP: LEGACY_GROUP_MAP,
      GADGET_HOME_OVERRIDES: GADGET_HOME_OVERRIDES,
      GADGET_GROUPS: GADGET_GROUPS,
      getGroupPanel: getGroupPanel,
      getGroupSection: getGroupSection,
      isValidGroup: isValidGroup,
      registerGroup: registerGroup,
      DEFAULT_LOADOUTS: DEFAULT_LOADOUTS
    };
  } catch (_) { }

})();
