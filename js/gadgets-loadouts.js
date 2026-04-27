(function () {
  'use strict';

  // Depends on gadgets-utils.js
  var utils = window.ZWGadgetsUtils;
  if (!utils) return;

  var clone = utils.clone;
  var uniquePush = utils.uniquePush;
  var _normalizeGroupName = utils.normalizeGroupName;
  var _normalizeGroupList = utils.normalizeGroupList;
  var _normalizeList = utils.normalizeList;
  var normaliseGroups = utils.normaliseGroups;
  var emit = utils.emit;
  var STORAGE_KEY = utils.STORAGE_KEY;
  var LOADOUT_KEY = utils.LOADOUT_KEY;
  var _KNOWN_GROUPS = utils.KNOWN_GROUPS;
  var DEFAULT_LOADOUTS = utils.DEFAULT_LOADOUTS;
  var HIDE_BY_DEFAULT_GADGETS = { LoadoutManager: true };

  var loadoutState = null;

  function isBuiltInLoadout(key) {
    return !!(DEFAULT_LOADOUTS && DEFAULT_LOADOUTS.entries && DEFAULT_LOADOUTS.entries[key]);
  }

  function filterDefaultHiddenGadgets(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (name) {
      return !HIDE_BY_DEFAULT_GADGETS[name];
    });
  }

  function normalizeLoadouts(raw) {
    var data = raw && typeof raw === 'object' ? clone(raw) : clone(DEFAULT_LOADOUTS);
    var entries = data.entries && typeof data.entries === 'object' ? data.entries : {};
    var normalizedEntries = {};
    Object.keys(entries).forEach(function (key) {
      var entry = entries[key] || {};
      var normalized = {
        label: entry.label || key,
        groups: normaliseGroups(entry.groups || {})
      };
      // SP-076 Phase 4: preserve dockLayout if present
      if (entry.dockLayout && typeof entry.dockLayout === 'object') {
        normalized.dockLayout = entry.dockLayout;
      }
      if (isBuiltInLoadout(key)) {
        Object.keys(normalized.groups || {}).forEach(function (group) {
          normalized.groups[group] = filterDefaultHiddenGadgets(normalized.groups[group]);
        });
      }
      normalizedEntries[key] = normalized;
    });
    // 既存のロードアウトにも、デフォルト定義されているガジェットを自動で統合する
    // （新規ガジェット追加時にユーザーの保存済みロードアウトへも反映するため）
    if (DEFAULT_LOADOUTS && DEFAULT_LOADOUTS.entries) {
      Object.keys(DEFAULT_LOADOUTS.entries).forEach(function (key) {
        var defEntry = DEFAULT_LOADOUTS.entries[key];
        var normalized = normalizedEntries[key];
        if (!defEntry || !normalized || !defEntry.groups) return;
        Object.keys(defEntry.groups || {}).forEach(function (group) {
          var baseList = filterDefaultHiddenGadgets(defEntry.groups[group] || []);
          if (!normalized.groups[group]) normalized.groups[group] = [];
          baseList.forEach(function (name) { uniquePush(normalized.groups[group], name); });
        });
        // SP-076 Phase 4: inherit default dockLayout if user entry lacks one
        if (!normalized.dockLayout && defEntry.dockLayout) {
          normalized.dockLayout = clone(defEntry.dockLayout);
        }
      });
    }
    if (!Object.keys(normalizedEntries).length) {
      normalizedEntries = clone(DEFAULT_LOADOUTS.entries);
    }
    var active = data.active;
    if (!active || !normalizedEntries[active]) {
      active = Object.keys(normalizedEntries)[0];
    }
    return {
      active: active,
      entries: normalizedEntries
    };
  }

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var p = raw ? JSON.parse(raw) : null;
      if (!p || typeof p !== 'object') p = { order: [], collapsed: {}, settings: {} };
      if (!Array.isArray(p.order)) p.order = [];
      if (!p.collapsed || typeof p.collapsed !== 'object') p.collapsed = {};
      if (!p.settings || typeof p.settings !== 'object') p.settings = {};
      return p;
    } catch (_) { return { order: [], collapsed: {}, settings: {} }; }
  }

  function savePrefs(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p || {})); } catch (_) { }
  }

  function loadLoadouts() {
    try {
      var raw = localStorage.getItem(LOADOUT_KEY);
      loadoutState = normalizeLoadouts(raw ? JSON.parse(raw) : null);
      return loadoutState;
    } catch (_) {
      loadoutState = clone(DEFAULT_LOADOUTS);
      return loadoutState;
    }
  }

  function saveLoadouts(data) {
    try {
      loadoutState = normalizeLoadouts(data);
      localStorage.setItem(LOADOUT_KEY, JSON.stringify(loadoutState));
      emit('ZWLoadoutsChanged', { loadouts: loadoutState });
    } catch (_) { }
  }

  // Export loadout management functions
  try {
    window.ZWGadgetsLoadouts = {
      loadPrefs: loadPrefs,
      savePrefs: savePrefs,
      loadLoadouts: loadLoadouts,
      saveLoadouts: saveLoadouts,
      normalizeLoadouts: normalizeLoadouts
    };
  } catch (_) { }

})();
