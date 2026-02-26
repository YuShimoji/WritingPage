/**
 * ZWGadgets Core: ガジェットシステムの中核モジュール
 *
 * 責務（フェーズC-2で明確化）:
 * - ガジェットの登録（register, registerSettings）
 * - ガジェットのレンダリング（init, _renderLast, _renderActive）
 * - 設定管理（getSettings, setSetting, getPrefs, setPrefs）
 * - ロードアウト管理（defineLoadout, applyLoadout, deleteLoadout, listLoadouts）
 *
 * SidebarManager との連携:
 * - SidebarManager が addTab でパネル作成時に init を呼び出し
 * - タブ切り替え・サイドバー制御は SidebarManager が担当
 */
(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-loadouts.js
  var utils = window.ZWGadgetsUtils;
  var loadouts = window.ZWGadgetsLoadouts;
  if (!utils || !loadouts) return;

  var clone = utils.clone;
  var uniquePush = utils.uniquePush;
  var normalizeGroupName = utils.normalizeGroupName;
  var normalizeGroupList = utils.normalizeGroupList;
  var normalizeList = utils.normalizeList;
  var normaliseGroups = utils.normaliseGroups;
  var emit = utils.emit;
  var STORAGE_KEY = utils.STORAGE_KEY;
  var _LOADOUT_KEY = utils.LOADOUT_KEY;
  var KNOWN_GROUPS = utils.KNOWN_GROUPS;
  var DEFAULT_LOADOUTS = utils.DEFAULT_LOADOUTS;

  var loadPrefs = loadouts.loadPrefs;
  var savePrefs = loadouts.savePrefs;
  var loadLoadouts = loadouts.loadLoadouts;
  var saveLoadouts = loadouts.saveLoadouts;

  class ZWGadgets {
    constructor() {
      this._list = [];
      this._settings = {};
      this._renderers = {};
      this._roots = {};
      this._loadouts = null;
      this._activeGroup = 'structure';
      this._defaults = {};
      this._renderPending = null;
    }

    _ensureLoadouts() {
      if (!this._loadouts) this._loadouts = loadLoadouts();
      return this._loadouts;
    }

    _applyLoadoutEntry(entry) {
      var map = {};
      entry = entry || { groups: {} };
      Object.keys(entry.groups || {}).forEach(function (group) {
        var items = entry.groups[group] || [];
        for (var i = 0; i < items.length; i++) {
          var name = items[i];
          if (!map[name]) map[name] = [];
          if (map[name].indexOf(group) < 0) map[name].push(group);
        }
      });
      for (var j = 0; j < this._list.length; j++) {
        var item = this._list[j];
        var fallback = this._defaults[item.name] ? this._defaults[item.name].slice() : ['structure'];
        var current = Array.isArray(item.groups) ? item.groups.slice() : [];
        item.groups = map[item.name] ? map[item.name].slice() : (current.length ? current : fallback);
      }
    }

    _getActiveEntry() {
      var data = this._ensureLoadouts();
      return data.entries[data.active] || { groups: normaliseGroups({}) };
    }

    _getActiveNames() {
      var entry = this._getActiveEntry();
      var names = [];
      KNOWN_GROUPS.forEach(function (key) {
        var list = entry.groups && entry.groups[key];
        if (Array.isArray(list)) {
          list.forEach(function (n) { if (typeof n === 'string' && n && names.indexOf(n) < 0) names.push(n); });
        }
      });
      if (!names.length) {
        names = this._list.map(function (g) { return g.name || ''; }).filter(Boolean);
      }
      return names;
    }

    /**
     * @typedef {Object} GadgetApi
     * @property {function(string, *): *} get - Get a setting value
     * @property {function(string, *): void} set - Set a setting value
     */

    /**
     * @callback GadgetFactory
     * @param {HTMLElement} el - The container element for the gadget
     * @param {GadgetApi} api - The gadget API
     */

    /**
     * @typedef {Object} GadgetOptions
     * @property {string} [title] - The display title of the gadget
     * @property {string[]} [groups] - The groups this gadget belongs to
     */

    /**
     * ガジェットを登録する
     * @param {string} name - ガジェットの一意識別名
     * @param {GadgetFactory} factory - ガジェットの生成関数
     * @param {GadgetOptions} [options] - オプション設定
     */
    register(name, factory, options) {
      try {
        var safeName = String(name || '');
        if (!safeName) {
          console.error('[ZWGadgets] Gadget name is required for registration.');
          return;
        }

        if (typeof factory !== 'function') {
          console.error('[ZWGadgets] Gadget factory must be a function for "' + safeName + '".');
          return;
        }

        var opts = options && typeof options === 'object' ? options : {};
        var entry = {
          name: safeName,
          title: opts.title || safeName,
          factory: factory,
          groups: normalizeGroupList(opts.groups || ['structure'])
        };
        if (!entry.groups.length) entry.groups = ['structure'];
        this._defaults[safeName] = entry.groups.slice();
        this._list.push(entry);
      } catch (e) {
        console.error('[ZWGadgets] Registration failed for "' + name + '":', e);
      }
    }

    registerSettings(name, factory) {
      try { this._settings[String(name || '')] = factory; } catch (_) { }
    }

    defineLoadout(name, config) {
      if (!name) return;
      var data = this._ensureLoadouts();
      var safe = String(name);
      data.entries[safe] = {
        label: (config && config.label) || safe,
        groups: normaliseGroups(config && config.groups)
      };
      if (!data.active) data.active = safe;
      saveLoadouts(data);
      this._loadouts = loadLoadouts();
      this._applyLoadoutEntry(this._loadouts.entries[this._loadouts.active]);
      emit('ZWLoadoutDefined', { name: safe });
      try { this._renderLast && this._renderLast(); } catch (_) { }
    }

    listLoadouts() {
      var data = this._ensureLoadouts();
      return Object.keys(data.entries).map(function (key) {
        var entry = data.entries[key] || {};
        return { name: key, label: entry.label || key };
      });
    }

    applyLoadout(name) {
      var data = this._ensureLoadouts();
      if (!name || !data.entries[name]) return false;
      data.active = name;
      saveLoadouts(data);
      this._loadouts = loadLoadouts();
      this._applyLoadoutEntry(this._loadouts.entries[name]);
      try { this._renderLast && this._renderLast(); } catch (_) { }
      emit('ZWLoadoutApplied', { name: name });
      return true;
    }

    deleteLoadout(name) {
      var data = this._ensureLoadouts();
      if (!name || !data.entries[name]) return false;
      delete data.entries[name];
      if (!Object.keys(data.entries).length) {
        data = clone(DEFAULT_LOADOUTS);
      }
      if (!data.active || !data.entries[data.active]) {
        data.active = Object.keys(data.entries)[0];
      }
      saveLoadouts(data);
      this._loadouts = loadLoadouts();
      this._applyLoadoutEntry(this._loadouts.entries[this._loadouts.active]);
      try { this._renderLast && this._renderLast(); } catch (_) { }
      emit('ZWLoadoutDeleted', { name: name });
      return true;
    }

    getActiveLoadout() {
      var data = this._ensureLoadouts();
      var entry = data.entries[data.active] || {};
      this._applyLoadoutEntry(entry);
      return {
        name: data.active,
        label: entry.label || data.active,
        entry: clone(entry)
      };
    }

    captureCurrentLoadout(label) {
      var groups = {};
      KNOWN_GROUPS.forEach(function (key) { groups[key] = []; });
      var roots = this._roots || {};
      Object.keys(roots).forEach(function (group) {
        var root = roots[group];
        if (!root) return;
        var nodes = root.querySelectorAll('.gadget-wrapper[data-gadget-name], [data-gadget-name]');
        for (var i = 0; i < nodes.length; i++) {
          var name = '';
          try {
            name = nodes[i].getAttribute('data-gadget-name') || '';
          } catch (_) { name = ''; }
          if (!name) continue;
          if (!groups[group]) groups[group] = [];
          uniquePush(groups[group], name);
        }
      });
      Object.keys(groups).forEach(function (key) {
        groups[key] = normalizeList(groups[key] || []);
      });
      var active = this.getActiveLoadout();
      return {
        label: label || (active && active.label) || '',
        groups: groups
      };
    }

    setActiveGroup(group) {
      var self = this;
      if (!group) return;
      var normalized = normalizeGroupName(group);
      if (!normalized) {
        try {
          var lower = String(group || '').trim().toLowerCase();
          normalized = normalizeGroupName(lower) || lower;
        } catch (_) { normalized = ''; }
      }
      if (!normalized) return;
      if (self._activeGroup === normalized) return;
      self._activeGroup = normalized;
      emit('ZWLoadoutGroupChanged', { group: normalized });
      if (self._renderPending) cancelAnimationFrame(self._renderPending);
      self._renderPending = requestAnimationFrame(function () {
        try { self._renderActive && self._renderActive(); } catch (_) { }
        self._renderPending = null;
      });
    }

    getPrefs() {
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

    setPrefs(p) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p || {})); } catch (_) { }
    }

    getSettings(name) {
      try {
        var p = this.getPrefs();
        return (p.settings && p.settings[name]) || {};
      } catch (_) { return {}; }
    }

    getSetting(name, key, def) {
      try {
        var s = this.getSettings(name) || {};
        return Object.prototype.hasOwnProperty.call(s, key) ? s[key] : def;
      } catch (_) { return def; }
    }

    setSetting(name, key, value) {
      try {
        var p = loadPrefs();
        p.settings = p.settings || {};
        var s = p.settings[name] = p.settings[name] || {};
        s[key] = value;
        savePrefs(p);
        var detail = { name: name, key: key, value: value, settings: s };
        try { window.dispatchEvent(new CustomEvent('ZWGadgetSettingsChanged', { detail: detail })); } catch (_) { }
        try { window.dispatchEvent(new CustomEvent('ZWGadgetSettingsChanged:' + name, { detail: detail })); } catch (_) { }
      } catch (_) { }
    }

    exportPrefs() {
      try {
        var p = loadPrefs();
        return JSON.stringify(p || { order: [], collapsed: {}, settings: {} }, null, 2);
      } catch (_) { return '{}'; }
    }

    importPrefs(obj) {
      try {
        var p = obj;
        if (typeof obj === 'string') { try { p = JSON.parse(obj); } catch (e) { return false; } }
        if (!p || typeof p !== 'object') return false;
        if (!Array.isArray(p.order)) p.order = [];
        if (!p.collapsed || typeof p.collapsed !== 'object') p.collapsed = {};
        if (!p.settings || typeof p.settings !== 'object') p.settings = {};
        savePrefs({ order: p.order, collapsed: p.collapsed, settings: p.settings });
        try { this._renderLast && this._renderLast(); } catch (_) { }
        return true;
      } catch (_) { return false; }
    }

    addTab(group, label, _panelId) {
      try {
        if (window.sidebarManager && typeof window.sidebarManager.addTab === 'function') {
          window.sidebarManager.addTab(group, label, { persist: false });
        }
      } catch (e) {
        console.error('addTab failed:', e);
      }
    }

    move(name, dir) {
      try {
        var p = loadPrefs();
        var names = this._list.map(function (x) { return x.name || ''; });
        var eff = [];
        for (var i = 0; i < p.order.length; i++) { if (names.indexOf(p.order[i]) >= 0 && eff.indexOf(p.order[i]) < 0) eff.push(p.order[i]); }
        for (var j = 0; j < names.length; j++) { if (eff.indexOf(names[j]) < 0) eff.push(names[j]); }
        var idx = eff.indexOf(name);
        if (idx < 0) return;
        if (dir === 'up' && idx > 0) { var t = eff[idx - 1]; eff[idx - 1] = eff[idx]; eff[idx] = t; }
        if (dir === 'down' && idx < eff.length - 1) { var t2 = eff[idx + 1]; eff[idx + 1] = eff[idx]; eff[idx] = t2; }
        p.order = eff;
        savePrefs(p);
        try { this._renderLast && this._renderLast(); } catch (_) { }
      } catch (_) { }
    }

    toggle(name) {
      try {
        var p = loadPrefs();
        p.collapsed = p.collapsed || {};
        p.collapsed[name] = !p.collapsed[name];
        savePrefs(p);
        try { this._renderLast && this._renderLast(); } catch (_) { }
      } catch (_) { }
    }

    init(selector, options) {
      var self = this;
      var opts = options && typeof options === 'object' ? options : {};
      var sel = selector || '#gadgets-panel';
      var root = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!root) return;
      var group = normalizeGroupName(opts.group) || 'structure';

      try {
        var prevGroup = root.getAttribute('data-zwg-init-group');
        if (prevGroup === group && this._roots[group] === root && typeof this._renderers[group] === 'function') {
          this._renderers[group]();
          return;
        }
        root.setAttribute('data-zwg-init-group', group);
      } catch (_) { }
      this._roots[group] = root;
      if (!this._activeGroup) this._activeGroup = group;

      this._renderers[group] = function () {
        try {
          root.innerHTML = '';
          var allowedNames = self._getActiveNames();
          var hasActiveForGroup = self._list.some(function (entry) {
            return entry && entry.groups && entry.groups.indexOf(group) !== -1 &&
              allowedNames.indexOf(entry.name) !== -1;
          });
          if (!hasActiveForGroup) {
            allowedNames = self._list
              .filter(function (entry) { return entry && entry.groups && entry.groups.indexOf(group) !== -1; })
              .map(function (entry) { return entry.name; });
          }

          self._list.forEach(function (entry) {
            if (!entry || !entry.groups || entry.groups.indexOf(group) === -1) return;
            if (allowedNames.indexOf(entry.name) === -1) return;

            var wrapper = document.createElement('div');
            wrapper.className = 'gadget-wrapper';
            wrapper.setAttribute('data-gadget-name', entry.name);
            // ドラッグ&ドロップ対応: ガジェットをドラッグ可能にする
            wrapper.setAttribute('draggable', 'true');
            wrapper.setAttribute('role', 'button');
            wrapper.setAttribute('aria-label', 'ガジェット「' + (entry.title || entry.name) + '」を移動');

            var gadgetEl = document.createElement('div');
            gadgetEl.className = 'gadget';

            try {
              var api = {
                get: function (key, def) { return self.getSetting(entry.name, key, def); },
                set: function (key, val) { self.setSetting(entry.name, key, val); }
              };
              entry.factory(gadgetEl, api);
            } catch (e) {
              console.error('Gadget render failed:', entry.name, e);
              gadgetEl.textContent = 'ガジェットの読み込みに失敗しました。';
            }

            // ドラッグイベントハンドラーを追加
            self._setupGadgetDragHandlers(wrapper, entry.name, group);

            wrapper.appendChild(gadgetEl);
            root.appendChild(wrapper);
          });

          // パネルにドロップハンドラーを設定
          self._setupPanelDropHandlers(root, group);

          self.replaceGadgetSettingsWithIcons();
        } catch (e) {
          console.error('Renderer error for group:', group, e);
        }
      };

      this._renderers[group]();
    }

    _renderLast() {
      var keys = Object.keys(this._renderers || {});
      for (var i = 0; i < keys.length; i++) {
        var fn = this._renderers[keys[i]];
        if (typeof fn === 'function') fn();
      }
      this.replaceGadgetSettingsWithIcons();
    }

    _renderActive() {
      if (!this._activeGroup || !this._renderers) return;
      var fn = this._renderers[this._activeGroup];
      if (typeof fn === 'function') fn();
      this.replaceGadgetSettingsWithIcons();
    }

    assignGroups(name, groups) {
      if (!name) return;
      var normalized = normalizeGroupList(groups || ['structure']);
      if (!normalized.length) normalized = ['structure'];
      for (var i = 0; i < this._list.length; i++) {
        if ((this._list[i].name || '') === name) {
          this._list[i].groups = normalized;
          break;
        }
      }
      try { this._renderLast && this._renderLast(); } catch (_) { }
    }

    replaceGadgetSettingsWithIcons() {
      if (!window.WritingIcons) return;
      var settingsBtns = document.querySelectorAll('.gadget-settings-btn');
      for (var i = 0; i < settingsBtns.length; i++) {
        var btn = settingsBtns[i];
        if (btn.textContent === '設定') {
          btn.innerHTML = '';
          var icon = window.WritingIcons.createIcon('settings', { size: 14, label: '設定を開く' });
          btn.appendChild(icon);
        }
      }
    }

    _setupGadgetDragHandlers(wrapper, gadgetName, currentGroup) {
      var _self = this;
      var gadgetEl = wrapper.querySelector('.gadget');

      // ドラッグ開始
      wrapper.addEventListener('dragstart', function (e) {
        try {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', gadgetName);
          e.dataTransfer.setData('application/x-gadget-name', gadgetName);
          e.dataTransfer.setData('application/x-gadget-group', currentGroup || '');
          if (gadgetEl) gadgetEl.classList.add('is-dragging');
        } catch (err) {
          console.error('Drag start error:', err);
        }
      });

      // ドラッグ終了
      wrapper.addEventListener('dragend', function (_e) {
        try {
          if (gadgetEl) gadgetEl.classList.remove('is-dragging');
          // すべてのドロップゾーンのハイライトを解除
          document.querySelectorAll('.gadgets-panel.drag-over-tab').forEach(function (panel) {
            panel.classList.remove('drag-over-tab');
          });
        } catch (err) {
          console.error('Drag end error:', err);
        }
      });
    }

    _setupPanelDropHandlers(panel, groupId) {
      var self = this;
      if (!panel || !groupId) return;

      // ドラッグオーバー（ドロップ可能な状態）
      panel.addEventListener('dragover', function (e) {
        try {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          if (!panel.classList.contains('drag-over-tab')) {
            panel.classList.add('drag-over-tab');
          }
        } catch (err) {
          console.error('Drag over error:', err);
        }
      });

      // ドラッグリーブ（ドロップゾーンから離れた）
      panel.addEventListener('dragleave', function (e) {
        try {
          // パネル内の子要素に移動した場合は解除しない
          var rect = panel.getBoundingClientRect();
          var x = e.clientX;
          var y = e.clientY;
          if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            panel.classList.remove('drag-over-tab');
          }
        } catch (err) {
          console.error('Drag leave error:', err);
        }
      });

      // ドロップ
      panel.addEventListener('drop', function (e) {
        try {
          e.preventDefault();
          e.stopPropagation();
          panel.classList.remove('drag-over-tab');

          var gadgetName = e.dataTransfer.getData('application/x-gadget-name') || e.dataTransfer.getData('text/plain');
          var sourceGroup = e.dataTransfer.getData('application/x-gadget-group') || '';

          if (!gadgetName) return;

          // 同じグループへの移動は無視
          if (sourceGroup === groupId) {
            return;
          }

          // ガジェットを新しいグループに割り当て
          var currentGroups = [];
          for (var i = 0; i < self._list.length; i++) {
            if (self._list[i].name === gadgetName) {
              currentGroups = (self._list[i].groups || []).slice();
              break;
            }
          }

          // 新しいグループを追加（既に含まれている場合は追加しない）
          if (currentGroups.indexOf(groupId) < 0) {
            currentGroups.push(groupId);
          }

          // ガジェットのグループを更新
          self.assignGroups(gadgetName, currentGroups);

          // ロードアウトを更新（現在の状態をキャプチャして保存）
          self._updateLoadoutFromCurrentState();

          // 再レンダリング
          try {
            self._renderLast && self._renderLast();
          } catch (renderErr) {
            console.error('Render error after drop:', renderErr);
          }

          // イベント発火
          emit('ZWGadgetMoved', {
            name: gadgetName,
            fromGroup: sourceGroup,
            toGroup: groupId
          });
        } catch (err) {
          console.error('Drop error:', err);
        }
      });
    }

    _updateLoadoutFromCurrentState() {
      try {
        var self = this;
        var currentLoadout = self.getActiveLoadout();
        if (!currentLoadout || !currentLoadout.name) return;

        // 現在の状態をキャプチャ
        var captured = self.captureCurrentLoadout(currentLoadout.label);
        if (!captured || !captured.groups) return;

        // ロードアウトを更新
        var data = self._ensureLoadouts();
        if (data.entries[currentLoadout.name]) {
          data.entries[currentLoadout.name].groups = captured.groups;
          saveLoadouts(data);
          self._loadouts = loadLoadouts();
        }
      } catch (err) {
        console.error('Update loadout error:', err);
      }
    }
  }

  // Export ZWGadgets class
  try {
    window.ZWGadgetsCore = ZWGadgets;
  } catch (_) { }

})();
