(function () {
  'use strict';

  function clone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (_) {
      return {};
    }
  }

  function uniquePush(arr, item) {
    if (arr.indexOf(item) < 0) arr.push(item);
  }

  function emit(eventName, detail) {
    try {
      window.dispatchEvent(
        new CustomEvent(eventName, { detail: detail || {} }),
      );
    } catch (_) {}
  }

  function ready(fn) {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  var STORAGE_KEY = 'zenWriter_gadgets:prefs';
  var LOADOUT_KEY = 'zenWriter_gadgets:loadouts';
  var DEFAULT_LOADOUTS = {
    active: 'novel-standard',
    entries: {
      'novel-standard': {
        label: '小説・長編',
        groups: {
          structure: ['Documents', 'Outline', 'SnapshotManager'],
          typography: ['EditorLayout'],
          assist: ['Clock', 'WritingGoal', 'PrintSettings', 'ChoiceTools'],
        },
      },
      'vn-layout': {
        label: 'ビジュアルノベル',
        groups: {
          structure: ['Documents', 'Outline', 'SnapshotManager'],
          typography: ['EditorLayout'],
          assist: ['Clock', 'WritingGoal', 'PrintSettings', 'ChoiceTools'],
        },
      },
    },
  };
  var loadoutState = null;

  function normalizeLoadouts(raw) {
    var data =
      raw && typeof raw === 'object' ? clone(raw) : clone(DEFAULT_LOADOUTS);
    var entries =
      data.entries && typeof data.entries === 'object' ? data.entries : {};
    var normalizedEntries = {};
    Object.keys(entries).forEach(function (key) {
      var entry = entries[key] || {};
      normalizedEntries[key] = {
        label: entry.label || key,
        groups: normaliseGroups(entry.groups || {}),
      };
    });
    if (!Object.keys(normalizedEntries).length) {
      normalizedEntries = clone(DEFAULT_LOADOUTS.entries);
    }
    var active = data.active;
    if (!active || !normalizedEntries[active]) {
      active = Object.keys(normalizedEntries)[0];
    }
    return {
      active: active,
      entries: normalizedEntries,
    };
  }

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var p = raw ? JSON.parse(raw) : null;
      if (!p || typeof p !== 'object')
        p = { order: [], collapsed: {}, settings: {} };
      if (!Array.isArray(p.order)) p.order = [];
      if (!p.collapsed || typeof p.collapsed !== 'object') p.collapsed = {};
      if (!p.settings || typeof p.settings !== 'object') p.settings = {};
      return p;
    } catch (_) {
      return { order: [], collapsed: {}, settings: {} };
    }
  }
  function savePrefs(p) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p || {}));
    } catch (_) {}
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
    return {
      structure: normalizeList(g.structure || []),
      typography: normalizeList(g.typography || []),
      assist: normalizeList(g.assist || []),
    };
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
    } catch (_) {}
  }

  var ZWGadgets = {
    _list: [],
    _settings: {},
    _renderers: {},
    _roots: {},
    _loadouts: null,
    _activeGroup: '',
    _defaults: {},
    _ensureLoadouts: function () {
      if (!this._loadouts) this._loadouts = loadLoadouts();
      return this._loadouts;
    },
    _applyLoadoutEntry: function (entry) {
      var map = {};
      entry = entry || {
        groups: { structure: [], typography: [], assist: [] },
      };
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
        var fallback = this._defaults[item.name]
          ? this._defaults[item.name].slice()
          : ['assist'];
        item.groups = map[item.name] ? map[item.name].slice() : fallback;
      }
    },
    _getActiveEntry: function () {
      var data = this._ensureLoadouts();
      return data.entries[data.active] || { groups: normaliseGroups({}) };
    },
    _getActiveNames: function () {
      var entry = this._getActiveEntry();
      var names = [];
      ['structure', 'typography', 'assist'].forEach(function (key) {
        var list = entry.groups && entry.groups[key];
        if (Array.isArray(list)) {
          list.forEach(function (n) {
            if (typeof n === 'string' && n && names.indexOf(n) < 0)
              names.push(n);
          });
        }
      });
      if (!names.length) {
        names = this._list
          .map(function (g) {
            return g.name || '';
          })
          .filter(Boolean);
      }
      return names;
    },
    register: function (name, factory, options) {
      try {
        var safeName = String(name || '');
        if (!safeName) return;
        var opts = options && typeof options === 'object' ? options : {};
        var entry = {
          name: safeName,
          title: opts.title || safeName,
          factory: factory,
          groups: normalizeList(opts.groups || ['assist']),
        };
        if (!entry.groups.length) entry.groups = ['assist'];
        this._defaults[safeName] = entry.groups.slice();
        this._list.push(entry);
      } catch (_) {}
    },
    registerSettings: function (name, factory) {
      try {
        this._settings[String(name || '')] = factory;
      } catch (_) {}
    },
    defineLoadout: function (name, config) {
      if (!name) return;
      var data = this._ensureLoadouts();
      var safe = String(name);
      data.entries[safe] = {
        label: (config && config.label) || safe,
        groups: normaliseGroups(config && config.groups),
      };
      if (!data.active) data.active = safe;
      saveLoadouts(data);
      this._loadouts = loadLoadouts();
      this._applyLoadoutEntry(this._loadouts.entries[this._loadouts.active]);
      emit('ZWLoadoutDefined', { name: safe });
      try {
        this._renderLast && this._renderLast();
      } catch (_) {}
    },
    listLoadouts: function () {
      var data = this._ensureLoadouts();
      return Object.keys(data.entries).map(function (key) {
        var entry = data.entries[key] || {};
        return { name: key, label: entry.label || key };
      });
    },
    applyLoadout: function (name) {
      var data = this._ensureLoadouts();
      if (!name || !data.entries[name]) return false;
      data.active = name;
      saveLoadouts(data);
      this._loadouts = loadLoadouts();
      this._applyLoadoutEntry(this._loadouts.entries[name]);
      try {
        this._renderLast && this._renderLast();
      } catch (_) {}
      emit('ZWLoadoutApplied', { name: name });
      return true;
    },
    deleteLoadout: function (name) {
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
      try {
        this._renderLast && this._renderLast();
      } catch (_) {}
      emit('ZWLoadoutDeleted', { name: name });
      return true;
    },
    getActiveLoadout: function () {
      var data = this._ensureLoadouts();
      var entry = data.entries[data.active] || {};
      this._applyLoadoutEntry(entry);
      return {
        name: data.active,
        label: entry.label || data.active,
        entry: clone(entry),
      };
    },
    captureCurrentLoadout: function (label) {
      var groups = { structure: [], typography: [], assist: [] };
      var roots = this._roots || {};
      var self = this;
      Object.keys(roots).forEach(function (group) {
        var root = roots[group];
        if (!root) return;
        var nodes = root.querySelectorAll('.gadget');
        for (var i = 0; i < nodes.length; i++) {
          var name = nodes[i].dataset && nodes[i].dataset.name;
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
        groups: groups,
      };
    },
    setActiveGroup: function (group) {
      if (!group) return;
      this._activeGroup = group;
      emit('ZWLoadoutGroupChanged', { group: group });
      try {
        this._renderLast && this._renderLast();
      } catch (_) {}
    },
    assignGroups: function (name, groups) {
      if (!name) return;
      var normalized = normalizeList(groups || ['assist']);
      if (!normalized.length) normalized = ['assist'];
      for (var i = 0; i < this._list.length; i++) {
        if ((this._list[i].name || '') === name) {
          this._list[i].groups = normalized;
          break;
        }
      }
      try {
        this._renderLast && this._renderLast();
      } catch (_) {}
    },
    getPrefs: function () {
      return loadPrefs();
    },
    setPrefs: function (p) {
      savePrefs(p || { order: [], collapsed: {}, settings: {} });
      try {
        this._renderLast && this._renderLast();
      } catch (_) {}
    },
    getSettings: function (name) {
      try {
        var p = loadPrefs();
        return (p.settings && p.settings[name]) || {};
      } catch (_) {
        return {};
      }
    },
    setSetting: function (name, key, value) {
      try {
        var p = loadPrefs();
        p.settings = p.settings || {};
        var s = (p.settings[name] = p.settings[name] || {});
        s[key] = value;
        savePrefs(p);
        // NOTE: 再レンダリングは行わない。購読しているガジェットが即時に反映する。
        var detail = { name: name, key: key, value: value, settings: s };
        try {
          window.dispatchEvent(
            new CustomEvent('ZWGadgetSettingsChanged', { detail: detail }),
          );
        } catch (_) {}
        try {
          window.dispatchEvent(
            new CustomEvent('ZWGadgetSettingsChanged:' + name, {
              detail: detail,
            }),
          );
        } catch (_) {}
      } catch (_) {}
    },
    exportPrefs: function () {
      try {
        var p = loadPrefs();
        return JSON.stringify(
          p || { order: [], collapsed: {}, settings: {} },
          null,
          2,
        );
      } catch (_) {
        return '{}';
      }
    },
    importPrefs: function (obj) {
      try {
        var p = obj;
        if (typeof obj === 'string') {
          try {
            p = JSON.parse(obj);
          } catch (e) {
            return false;
          }
        }
        if (!p || typeof p !== 'object') return false;
        if (!Array.isArray(p.order)) p.order = [];
        if (!p.collapsed || typeof p.collapsed !== 'object') p.collapsed = {};
        if (!p.settings || typeof p.settings !== 'object') p.settings = {};
        savePrefs({
          order: p.order,
          collapsed: p.collapsed,
          settings: p.settings,
        });
        try {
          this._renderLast && this._renderLast();
        } catch (_) {}
        return true;
      } catch (_) {
        return false;
      }
    },
    move: function (name, dir) {
      try {
        var p = loadPrefs();
        var names = this._list.map(function (x) {
          return x.name || '';
        });
        // build effective order
        var eff = [];
        for (var i = 0; i < p.order.length; i++) {
          if (names.indexOf(p.order[i]) >= 0 && eff.indexOf(p.order[i]) < 0)
            eff.push(p.order[i]);
        }
        for (var j = 0; j < names.length; j++) {
          if (eff.indexOf(names[j]) < 0) eff.push(names[j]);
        }
        var idx = eff.indexOf(name);
        if (idx < 0) return;
        if (dir === 'up' && idx > 0) {
          var t = eff[idx - 1];
          eff[idx - 1] = eff[idx];
          eff[idx] = t;
        }
        if (dir === 'down' && idx < eff.length - 1) {
          var t2 = eff[idx + 1];
          eff[idx + 1] = eff[idx];
          eff[idx] = t2;
        }
        p.order = eff;
        savePrefs(p);
        try {
          this._renderLast && this._renderLast();
        } catch (_) {}
      } catch (_) {}
    },
    toggle: function (name) {
      try {
        var p = loadPrefs();
        p.collapsed = p.collapsed || {};
        p.collapsed[name] = !p.collapsed[name];
        savePrefs(p);
        try {
          this._renderLast && this._renderLast();
        } catch (_) {}
      } catch (_) {}
    },
    init: function (selector, options) {
      var self = this;
      var opts = options && typeof options === 'object' ? options : {};
      var sel = selector || '#gadgets-panel';
      var root = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!root) return;
      var group = opts.group || 'assist';
      this._roots[group] = root;
      if (!this._activeGroup) this._activeGroup = group;

      // Tab inter-move support
      root.addEventListener('dragover', function (ev) {
        try {
          ev.preventDefault();
          ev.dataTransfer.dropEffect = 'move';
          root.classList.add('drag-over-tab');
        } catch (_) {}
      });
      root.addEventListener('dragleave', function () {
        try {
          root.classList.remove('drag-over-tab');
        } catch (_) {}
      });
      root.addEventListener('drop', function (ev) {
        try {
          ev.preventDefault();
          root.classList.remove('drag-over-tab');
          var name = ev.dataTransfer.getData('text/gadget-name');
          if (!name) return;
          // Assign to this group
          var currentGroups = self._list.find(function (g) {
            return g.name === name;
          });
          if (!currentGroups) return;
          var newGroups = [group];
          self.assignGroups(name, newGroups);
          if (self._renderLast) self._renderLast();
        } catch (_) {}
      });

      var data = this._ensureLoadouts();
      this._applyLoadoutEntry(data.entries[data.active]);

      function render() {
        var activeGroup = self._activeGroup || 'assist';
        if (activeGroup !== group) {
          root.setAttribute('data-gadgets-hidden', 'true');
          while (root.firstChild) root.removeChild(root.firstChild);
          return;
        }
        root.removeAttribute('data-gadgets-hidden');

        var allowedNamesAll = self._getActiveNames();
        var allowedNames = allowedNamesAll.filter(function (name) {
          for (var idx = 0; idx < self._list.length; idx++) {
            var item = self._list[idx];
            if (
              (item.name || '') === name &&
              Array.isArray(item.groups) &&
              item.groups.indexOf(group) >= 0
            ) {
              return true;
            }
          }
          return false;
        });
        // ロードアウトに未登録でも、該当グループに属するガジェットは候補へ含める
        var extras = self._list
          .filter(function (item) {
            return (
              Array.isArray(item.groups) &&
              item.groups.indexOf(group) >= 0 &&
              allowedNamesAll.indexOf(item.name || '') < 0
            );
          })
          .map(function (item) {
            return item.name || '';
          })
          .filter(Boolean);
        for (var exi = 0; exi < extras.length; exi++) {
          if (allowedNames.indexOf(extras[exi]) < 0) allowedNames.push(extras[exi]);
        }
        var allowedSet = {};
        for (var ai = 0; ai < allowedNames.length; ai++) {
          allowedSet[allowedNames[ai]] = true;
        }

        function buildOrder() {
          var p = loadPrefs();
          var names = self._list
            .filter(function (x) {
              return (
                Array.isArray(x.groups) &&
                x.groups.indexOf(group) >= 0 &&
                allowedSet[x.name || '']
              );
            })
            .map(function (x) {
              return x.name || '';
            });
          var eff = [];
          for (var i = 0; i < p.order.length; i++) {
            var n = p.order[i];
            if (allowedSet[n] && eff.indexOf(n) < 0) eff.push(n);
          }
          for (var j = 0; j < names.length; j++) {
            if (eff.indexOf(names[j]) < 0) eff.push(names[j]);
          }
          return { order: eff, prefs: p };
        }

        var state = buildOrder();
        var order = state.order,
          prefs = state.prefs;
        while (root.firstChild) root.removeChild(root.firstChild);
        for (var k = 0; k < order.length; k++) {
          var name = order[k];
          if (!allowedSet[name]) continue;
          var g = null;
          for (var t = 0; t < self._list.length; t++) {
            if ((self._list[t].name || '') === name) {
              g = self._list[t];
              break;
            }
          }
          if (!g) continue;
          try {
            var wrap = document.createElement('section');
            wrap.className = 'gadget';
            wrap.dataset.name = name;
            wrap.dataset.group = group;
            // ガジェット本体はドラッグ不可。ヘッダーのみドラッグ可能。
            wrap.setAttribute('draggable', 'false');

            var head = document.createElement('div');
            head.className = 'gadget-head';
            var collapsed =
              name === 'EditorLayout' ? false : !!prefs.collapsed[name];
            var toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'gadget-toggle';
            toggleBtn.textContent = collapsed ? '▶' : '▼';
            var title = document.createElement('h4');
            title.className = 'gadget-title';
            title.textContent = g.title || name;
            var upBtn = document.createElement('button');
            upBtn.type = 'button';
            upBtn.className = 'gadget-move-up small';
            upBtn.textContent = '↑';
            upBtn.title = '上へ';
            var downBtn = document.createElement('button');
            downBtn.type = 'button';
            downBtn.className = 'gadget-move-down small';
            downBtn.textContent = '↓';
            downBtn.title = '下へ';
            var settingsBtn = null;
            if (self._settings[name]) {
              settingsBtn = document.createElement('button');
              settingsBtn.type = 'button';
              settingsBtn.className = 'gadget-settings-btn small';
              settingsBtn.title = '設定';
              settingsBtn.textContent = '⚙';
            }
            // 削除ボタン（現在のタブから除外）
            var removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'gadget-remove-btn small';
            removeBtn.title = '削除';
            removeBtn.textContent = '✕';
            head.appendChild(title);
            head.appendChild(toggleBtn);
            if (settingsBtn) head.appendChild(settingsBtn);
            head.appendChild(upBtn);
            head.appendChild(downBtn);
            head.appendChild(removeBtn);
            // styles moved to CSS (.gadget-head)
            wrap.appendChild(head);

            var body = document.createElement('div');
            body.className = 'gadget-body';
            if (collapsed) body.style.display = 'none';
            wrap.appendChild(body);
            // 折りたたみトグル
            toggleBtn.addEventListener('click', function(){
              try {
                collapsed = !collapsed;
                body.style.display = collapsed ? 'none' : '';
                toggleBtn.textContent = collapsed ? '▶' : '▼';
                var p = loadPrefs();
                p.collapsed = p.collapsed || {};
                p.collapsed[name] = collapsed;
                savePrefs(p);
              } catch(_) {}
            });
            if (typeof g.factory === 'function') {
              try {
                var api = {
                  get: function (key, d) {
                    var s = self.getSettings(name);
                    return key in s ? s[key] : d;
                  },
                  set: function (key, val) {
                    self.setSetting(name, key, val);
                  },
                  prefs: function () {
                    return self.getPrefs();
                  },
                  refresh: function () {
                    try {
                      self._renderLast && self._renderLast();
                    } catch (_) {}
                  },
                };
                g.factory(body, api);
              } catch (e) {
                /* ignore gadget error */
              }
            }

            // events

            upBtn.addEventListener(
              'click',
              (function (n, w) {
                return function () {
                  try {
                    w.classList.add('moving-up');
                    setTimeout(function () {
                      self.move(n, 'up');
                      setTimeout(function () {
                        w.classList.remove('moving-up');
                      }, 220);
                    }, 180);
                  } catch (_) {}
                };
              })(name, wrap),
            );
            downBtn.addEventListener(
              'click',
              (function (n, w) {
                return function () {
                  try {
                    w.classList.add('moving-down');
                    setTimeout(function () {
                      self.move(n, 'down');
                      setTimeout(function () {
                        w.classList.remove('moving-down');
                      }, 220);
                    }, 180);
                  } catch (_) {}
                };
              })(name, wrap),
            );

            // settings panel
            if (settingsBtn) {
              var panel = document.createElement('div');
              panel.className = 'gadget-settings';
              panel.style.display = 'none';
              wrap.appendChild(panel);
              settingsBtn.addEventListener(
                'click',
                (function (n, p, btn) {
                  return function () {
                    try {
                      var visible = p.style.display !== 'none';
                      p.style.display = visible ? 'none' : '';
                      if (!visible) {
                        // render settings lazily
                        try {
                          p.innerHTML = '';
                          var sApi = {
                            get: function (key, d) {
                              var s = self.getSettings(n);
                              return key in s ? s[key] : d;
                            },
                            set: function (key, val) {
                              self.setSetting(n, key, val);
                            },
                            prefs: function () {
                              return self.getPrefs();
                            },
                            refresh: function () {
                              try {
                                self._renderLast && self._renderLast();
                              } catch (_) {}
                            },
                          };
                          self._settings[n](p, sApi);
                        } catch (_) {}
                      }
                    } catch (_) {}
                  };
                })(name, panel, settingsBtn),
              );
            }
            // drag and drop reorder（ヘッダーのみドラッグ開始）
            head.addEventListener('dragstart', function (ev) {
              try {
                wrap.classList.add('is-dragging');
                ev.dataTransfer.setData('text/gadget-name', name);
                ev.dataTransfer.effectAllowed = 'move';
              } catch (_) {}
            });
            head.addEventListener('dragend', function () {
              try {
                wrap.classList.remove('is-dragging');
              } catch (_) {}
            });
            wrap.addEventListener('dragover', function (ev) {
              try {
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'move';
                wrap.classList.add('drag-over');
              } catch (_) {}
            });
            wrap.addEventListener('dragleave', function () {
              try {
                wrap.classList.remove('drag-over');
              } catch (_) {}
            });
            wrap.addEventListener('drop', function (ev) {
              try {
                ev.preventDefault();
                wrap.classList.remove('drag-over');
                var src = ev.dataTransfer.getData('text/gadget-name');
                var dst = name;
                if (!src || !dst || src === dst) return;

                // DOMから現在の順序を取得
                var container = wrap.parentNode;
                var gadgets = container.querySelectorAll('.gadget');
                var currentOrder = [];
                for (var i = 0; i < gadgets.length; i++) {
                  var gName = gadgets[i].dataset.name;
                  if (gName) currentOrder.push(gName);
                }

                var sIdx = currentOrder.indexOf(src),
                  dIdx = currentOrder.indexOf(dst);
                if (sIdx < 0 || dIdx < 0) return;

                // srcをdstの前に移動
                currentOrder.splice(dIdx, 0, currentOrder.splice(sIdx, 1)[0]);

                // 設定に保存
                var p = loadPrefs();
                p.order = currentOrder;
                savePrefs(p);
                try {
                  if (self._renderLast) self._renderLast();
                } catch (_) {}
              } catch (_) {}
            });

            // keyboard navigation
            wrap.addEventListener('keydown', function (ev) {
              if (ev.key === 'ArrowUp' && ev.altKey) {
                ev.preventDefault();
                self.move(name, 'up');
              } else if (ev.key === 'ArrowDown' && ev.altKey) {
                ev.preventDefault();
                self.move(name, 'down');
              }
            });

            // remove button: 現在のグループからこのガジェットを除外
            removeBtn.addEventListener('click', function () {
              try {
                var item = self._list.find(function (it) {
                  return (it.name || '') === name;
                });
                var current = Array.isArray(item && item.groups)
                  ? item.groups.slice()
                  : [];
                var next = current.filter(function (gr) {
                  return gr !== group;
                });
                self.assignGroups(name, next);
              } finally {
                try {
                  self._renderLast && self._renderLast();
                } catch (_) {}
              }
            });

            root.appendChild(wrap);
          } catch (e) {
            /* ignore per gadget */
          }
        }

        // Add available gadgets list
        var available = self._list.filter(function (g) {
          return Array.isArray(g.groups) && g.groups.indexOf(group) < 0;
        });
        if (available.length > 0) {
          var addSection = document.createElement('div');
          addSection.className = 'gadget-add-section';
          addSection.style.marginTop = '12px';
          addSection.style.padding = '8px';
          addSection.style.border = '1px dashed var(--border-color)';
          addSection.style.borderRadius = '4px';
          addSection.style.background = 'var(--bg-color)';

          var addTitle = document.createElement('div');
          addTitle.textContent = '+ ガジェット追加';
          addTitle.style.fontSize = '0.9rem';
          addTitle.style.fontWeight = '600';
          addTitle.style.marginBottom = '6px';
          addTitle.style.cursor = 'pointer';
          addSection.appendChild(addTitle);

          var addList = document.createElement('div');
          addList.style.display = 'none';
          addList.style.gap = '4px';
          addList.style.flexDirection = 'column';

          available.forEach(function (g) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'small';
            btn.textContent = g.title || g.name;
            btn.style.width = '100%';
            btn.addEventListener('click', function () {
              self.assignGroups(g.name, [group]);
              self._renderLast && self._renderLast();
            });
            addList.appendChild(btn);
          });

          addSection.appendChild(addList);

          addTitle.addEventListener('click', function () {
            addList.style.display =
              addList.style.display === 'none' ? 'flex' : 'none';
          });

          root.appendChild(addSection);
        }
      }

      self._renderers[group] = render;
      self._renderLast = function () {
        var keys = Object.keys(self._renderers || {});
        for (var i = 0; i < keys.length; i++) {
          var fn = self._renderers[keys[i]];
          if (typeof fn === 'function') fn();
        }
      };
      render();
    },
  };

  // expose
  try {
    window.ZWGadgets = ZWGadgets;
  } catch (_) {}

  // Outline gadget (構造)
  ZWGadgets.register(
    'Outline',
    function (el) {
      try {
        var STORAGE = window.ZenWriterStorage;
        if (!STORAGE || typeof STORAGE.loadOutline !== 'function') {
          var p = document.createElement('p');
          p.textContent = 'アウトライン機能を利用できません。';
          p.style.opacity = '0.7';
          p.style.fontSize = '0.9rem';
          el.appendChild(p);
          return;
        }

        var DEFAULT_OUTLINE = {
          sets: [
            {
              id: 'default-3',
              name: '部・章・節',
              levels: [
                { key: 'part', label: '部', color: '#4a90e2' },
                { key: 'chapter', label: '章', color: '#7b8a8b' },
                { key: 'section', label: '節', color: '#b88a4a' },
              ],
            },
          ],
          currentSetId: 'default-3',
        };

        var state = STORAGE.loadOutline() || DEFAULT_OUTLINE;

        // elements
        var wrap = document.createElement('div');
        wrap.className = 'gadget-outline';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '8px';

        var label = document.createElement('label');
        label.textContent = 'プリセット';
        label.setAttribute('for', 'outline-set-select');
        var sel = document.createElement('select');
        sel.id = 'outline-set-select';

        var details = document.createElement('details');
        var sum = document.createElement('summary');
        sum.textContent = '新しいプリセットを作成';
        var nameLbl = document.createElement('label');
        nameLbl.setAttribute('for', 'outline-new-name');
        nameLbl.textContent = '名前';
        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'outline-new-name';
        nameInput.placeholder = '例: 三部構成';
        var lvLbl = document.createElement('label');
        lvLbl.setAttribute('for', 'outline-new-levels');
        lvLbl.textContent = 'レベル（カンマ区切り）';
        var lvInput = document.createElement('input');
        lvInput.type = 'text';
        lvInput.id = 'outline-new-levels';
        lvInput.placeholder = '部,章,節';
        var createBtn = document.createElement('button');
        createBtn.type = 'button';
        createBtn.id = 'create-outline-set';
        createBtn.textContent = '作成';
        var createBox = document.createElement('div');
        createBox.style.display = 'grid';
        createBox.style.gap = '6px';
        createBox.appendChild(nameLbl);
        createBox.appendChild(nameInput);
        createBox.appendChild(lvLbl);
        createBox.appendChild(lvInput);
        createBox.appendChild(createBtn);
        details.appendChild(sum);
        details.appendChild(createBox);

        var levelsBox = document.createElement('div');
        levelsBox.id = 'outline-levels-container';
        var insertBox = document.createElement('div');
        insertBox.id = 'outline-insert-buttons';

        wrap.appendChild(label);
        wrap.appendChild(sel);
        wrap.appendChild(details);
        wrap.appendChild(levelsBox);
        wrap.appendChild(insertBox);
        el.appendChild(wrap);

        function save() {
          try {
            STORAGE.saveOutline(state);
          } catch (_) {}
        }
        function currentSet() {
          var s = state.sets.find(function (x) {
            return x && x.id === state.currentSetId;
          });
          return s || state.sets[0];
        }
        function renderSetSelect() {
          sel.innerHTML = '';
          state.sets.forEach(function (set) {
            var opt = document.createElement('option');
            opt.value = set.id;
            opt.textContent = set.name || set.id;
            sel.appendChild(opt);
          });
          sel.value = state.currentSetId;
        }
        function renderCurrentSet() {
          var set = currentSet();
          if (!set) return;
          // levels editor
          levelsBox.innerHTML = '';
          set.levels.forEach(function (lv, i) {
            var row = document.createElement('div');
            row.className = 'level-row';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.gap = '6px';
            var left = document.createElement('label');
            left.textContent = String(lv.label || '');
            left.style.flex = '1 1 auto';
            var right = document.createElement('div');
            right.style.display = 'flex';
            right.style.alignItems = 'center';
            right.style.gap = '6px';
            var color = document.createElement('input');
            color.type = 'color';
            color.value = lv.color || '#888888';
            color.setAttribute('data-index', String(i));
            var up = document.createElement('button');
            up.type = 'button';
            up.className = 'small btn-move';
            up.setAttribute('data-dir', 'up');
            up.setAttribute('data-index', String(i));
            up.textContent = '↑';
            up.title = '上へ';
            var down = document.createElement('button');
            down.type = 'button';
            down.className = 'small btn-move';
            down.setAttribute('data-dir', 'down');
            down.setAttribute('data-index', String(i));
            down.textContent = '↓';
            down.title = '下へ';
            right.appendChild(color);
            right.appendChild(up);
            right.appendChild(down);
            row.appendChild(left);
            row.appendChild(right);
            levelsBox.appendChild(row);
          });

          // insert buttons
          insertBox.innerHTML = '';
          set.levels.forEach(function (lv, i) {
            var b = document.createElement('button');
            b.className = 'outline-btn';
            b.type = 'button';
            b.textContent = String(lv.label || '') + ' を挿入';
            b.style.borderColor = lv.color || '#888';
            b.style.color = lv.color || 'inherit';
            b.addEventListener('click', function () {
              insertLevel(i);
            });
            insertBox.appendChild(b);
          });
        }

        function generatePalette(n) {
          var arr = [];
          for (var i = 0; i < n; i++) {
            var hue = Math.round((360 / n) * i);
            arr.push(hslToHex(hue, 60, 50));
          }
          return arr;
        }
        function hslToHex(h, s, l) {
          s /= 100;
          l /= 100;
          var k = function (n) {
            return (n + h / 30) % 12;
          };
          var a = s * Math.min(l, 1 - l);
          var f = function (n) {
            return (
              l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
            );
          };
          var r = Math.round(255 * f(0)),
            g = Math.round(255 * f(8)),
            b = Math.round(255 * f(4));
          var toHex = function (c) {
            var x = c.toString(16);
            return x.length === 1 ? '0' + x : x;
          };
          return '#' + toHex(r) + toHex(g) + toHex(b);
        }

        function insertLevel(index) {
          var set = currentSet();
          if (!set || !set.levels[index]) return;
          var depth = index + 1;
          var prefix = '#'.repeat(Math.min(depth, 6));
          var text =
            prefix +
            ' ' +
            String(set.levels[index].label || '') +
            ' タイトル\n\n';
          try {
            if (
              window.ZenWriterEditor &&
              typeof window.ZenWriterEditor.insertTextAtCursor === 'function'
            ) {
              window.ZenWriterEditor.insertTextAtCursor(text);
            }
          } catch (_) {}
        }

        // events
        sel.addEventListener('change', function (e) {
          state.currentSetId = e.target.value;
          save();
          renderCurrentSet();
        });
        createBtn.addEventListener('click', function () {
          var name = (nameInput.value || '').trim() || '新規プリセット';
          var csv = (lvInput.value || '').trim();
          if (!csv) {
            alert('レベル名をカンマ区切りで入力してください');
            return;
          }
          var labels = csv
            .split(',')
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean);
          var palette = generatePalette(labels.length);
          var id = 'set-' + Date.now();
          var set = {
            id: id,
            name: name,
            levels: labels.map(function (label, idx) {
              return { key: 'k' + idx, label: label, color: palette[idx] };
            }),
          };
          state.sets.push(set);
          state.currentSetId = id;
          save();
          nameInput.value = '';
          lvInput.value = '';
          renderSetSelect();
          renderCurrentSet();
        });
        levelsBox.addEventListener('change', function (e) {
          var t = e.target;
          if (t && t.matches('input[type="color"]')) {
            var idx = parseInt(t.getAttribute('data-index'), 10);
            var set = currentSet();
            if (set && set.levels[idx]) {
              set.levels[idx].color = t.value;
              save();
              renderCurrentSet();
            }
          }
        });
        levelsBox.addEventListener('click', function (e) {
          var t = e.target;
          if (t && t.matches('.btn-move')) {
            var dir = t.getAttribute('data-dir');
            var idx = parseInt(t.getAttribute('data-index'), 10);
            var set = currentSet();
            if (!set) return;
            var ni = dir === 'up' ? idx - 1 : idx + 1;
            if (ni < 0 || ni >= set.levels.length) return;
            var arr = set.levels;
            var tmp = arr[idx];
            arr[idx] = arr[ni];
            arr[ni] = tmp;
            save();
            renderCurrentSet();
          }
        });

        // init
        renderSetSelect();
        renderCurrentSet();
      } catch (e) {
        console.error('Outline gadget failed:', e);
        try {
          el.textContent = 'アウトラインの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['structure'], title: 'アウトライン' },
  );

  ZWGadgets.register(
    'Documents',
    function (el) {
      try {
        var storage = window.ZenWriterStorage;
        if (!storage) {
          var warn = document.createElement('p');
          warn.textContent =
            'ストレージ機能が利用できないため、ドキュメントを管理できません。';
          warn.style.fontSize = '0.9rem';
          warn.style.opacity = '0.7';
          el.appendChild(warn);
          return;
        }

        var editorManager = window.ZenWriterEditor;
        var selectId = 'zw-doc-select-' + Math.random().toString(36).slice(2);
        var state = { docs: [], currentId: null };

        function notify(message, duration) {
          try {
            if (
              editorManager &&
              typeof editorManager.showNotification === 'function'
            ) {
              editorManager.showNotification(message, duration || 1200);
            }
          } catch (_) {}
        }

        function ensureDocuments() {
          var docs = storage.loadDocuments() || [];
          var cur = storage.getCurrentDocId();
          if (!docs.length) {
            var initial = '';
            try {
              initial = storage.loadContent() || '';
            } catch (_) {}
            var created = storage.createDocument('ドキュメント1', initial);
            storage.setCurrentDocId(created.id);
            if (
              editorManager &&
              typeof editorManager.setContent === 'function'
            ) {
              editorManager.setContent(initial);
            } else {
              storage.saveContent(initial);
            }
            docs = storage.loadDocuments() || [];
            cur = created.id;
          }
          if (
            !cur ||
            !docs.some(function (d) {
              return d && d.id === cur;
            })
          ) {
            var sorted = docs.slice().sort(function (a, b) {
              return (b.updatedAt || 0) - (a.updatedAt || 0);
            });
            if (sorted.length) {
              var first = sorted[0];
              storage.setCurrentDocId(first.id);
              if (
                editorManager &&
                typeof editorManager.setContent === 'function'
              ) {
                editorManager.setContent(first.content || '');
              } else {
                storage.saveContent(first.content || '');
              }
              cur = first.id;
            }
          }
          state.docs = docs;
          state.currentId = cur;
        }

        function sortedDocs() {
          var docs = storage.loadDocuments() || [];
          return docs.slice().sort(function (a, b) {
            return (b.updatedAt || 0) - (a.updatedAt || 0);
          });
        }

        function refreshOptions(preferredId) {
          ensureDocuments();
          var docs = sortedDocs();
          var select = elements.select;
          select.innerHTML = '';
          if (!docs.length) {
            var empty = document.createElement('option');
            empty.value = '';
            empty.textContent = '(なし)';
            select.appendChild(empty);
            select.disabled = true;
            elements.renameBtn.disabled = true;
            elements.deleteBtn.disabled = true;
            return;
          }
          select.disabled = false;
          docs.forEach(function (doc) {
            var opt = document.createElement('option');
            opt.value = doc.id;
            opt.textContent = doc.name || '無題';
            select.appendChild(opt);
          });
          var cur = preferredId || storage.getCurrentDocId();
          if (cur) select.value = cur;
          elements.renameBtn.disabled = !cur;
          elements.deleteBtn.disabled = !cur;
        }

        function saveCurrentContent() {
          try {
            if (
              editorManager &&
              editorManager.editor &&
              typeof storage.saveContent === 'function'
            ) {
              storage.saveContent(editorManager.editor.value || '');
            }
          } catch (_) {}
        }

        function updateDocumentTitle() {
          try {
            var docs = storage.loadDocuments() || [];
            var cur = storage.getCurrentDocId();
            var doc = docs.find(function (d) {
              return d && d.id === cur;
            });
            var name = doc && doc.name ? doc.name : '';
            document.title = name
              ? name + ' - Zen Writer'
              : 'Zen Writer - 小説執筆ツール';
          } catch (_) {
            document.title = 'Zen Writer - 小説執筆ツール';
          }
        }

        function dispatchChanged() {
          try {
            window.dispatchEvent(
              new CustomEvent('ZWDocumentsChanged', {
                detail: { docs: storage.loadDocuments() || [] },
              }),
            );
          } catch (_) {}
        }

        function switchDocument(id) {
          if (!id) return;
          var docs = storage.loadDocuments() || [];
          var doc = docs.find(function (d) {
            return d && d.id === id;
          });
          if (!doc) return;
          saveCurrentContent();
          storage.setCurrentDocId(id);
          if (editorManager && typeof editorManager.setContent === 'function') {
            editorManager.setContent(doc.content || '');
          } else {
            storage.saveContent(doc.content || '');
          }
          refreshOptions(id);
          updateDocumentTitle();
          notify('「' + (doc.name || '無題') + '」を開きました');
          dispatchChanged();
        }

        function createDocument() {
          var name = prompt('新しいドキュメント名を入力', '無題');
          if (name === null) return;
          var doc = storage.createDocument(name || '無題', '');
          storage.setCurrentDocId(doc.id);
          if (editorManager && typeof editorManager.setContent === 'function') {
            editorManager.setContent('');
          } else {
            storage.saveContent('');
          }
          refreshOptions(doc.id);
          updateDocumentTitle();
          notify('ドキュメントを作成しました');
          dispatchChanged();
        }

        function renameDocument() {
          var cur = storage.getCurrentDocId();
          if (!cur) return;
          var docs = storage.loadDocuments() || [];
          var doc = docs.find(function (d) {
            return d && d.id === cur;
          });
          var name = prompt(
            'ドキュメント名を変更',
            doc ? doc.name || '無題' : '無題',
          );
          if (name === null) return;
          storage.renameDocument(cur, name || '無題');
          refreshOptions(cur);
          updateDocumentTitle();
          notify('ドキュメント名を更新しました');
          dispatchChanged();
        }

        function deleteDocument() {
          var cur = storage.getCurrentDocId();
          if (!cur) return;
          if (
            !confirm(
              'このドキュメントを削除しますか？この操作は元に戻せません。',
            )
          )
            return;
          storage.deleteDocument(cur);
          ensureDocuments();
          var next = storage.getCurrentDocId();
          if (editorManager && typeof editorManager.setContent === 'function') {
            var docs = storage.loadDocuments() || [];
            var doc = docs.find(function (d) {
              return d && d.id === next;
            });
            editorManager.setContent(doc && doc.content ? doc.content : '');
          } else {
            var doc2 = storage.loadDocuments().find(function (d) {
              return d && d.id === next;
            });
            storage.saveContent(doc2 ? doc2.content || '' : '');
          }
          refreshOptions(next);
          updateDocumentTitle();
          notify('ドキュメントを削除しました');
          dispatchChanged();
        }

        function importFile(files) {
          if (!files || !files.length) return;
          var file = files[0];
          var reader = new FileReader();
          reader.onload = function () {
            try {
              var text = String(reader.result || '');
              if (
                editorManager &&
                typeof editorManager.setContent === 'function'
              ) {
                editorManager.setContent(text);
              } else {
                storage.saveContent(text);
              }
              refreshOptions(storage.getCurrentDocId());
              notify('ファイルを読み込みました');
              dispatchChanged();
            } catch (e) {
              console.error(e);
            }
          };
          reader.onerror = function () {
            console.error('ファイル読み込みエラー');
          };
          reader.readAsText(file, 'utf-8');
        }

        function exportCurrent(asMarkdown) {
          if (editorManager) {
            if (
              asMarkdown &&
              typeof editorManager.exportAsMarkdown === 'function'
            )
              return editorManager.exportAsMarkdown();
            if (!asMarkdown && typeof editorManager.exportAsText === 'function')
              return editorManager.exportAsText();
          }
          try {
            var text = storage.loadContent() || '';
            var docId = storage.getCurrentDocId();
            var docs = storage.loadDocuments() || [];
            var doc = docs.find(function (d) {
              return d && d.id === docId;
            });
            var base = doc && doc.name ? doc.name : 'zenwriter';
            var filename = base + (asMarkdown ? '.md' : '.txt');
            storage.exportText(
              text,
              filename,
              asMarkdown ? 'text/markdown' : 'text/plain',
            );
          } catch (_) {}
        }

        function printCurrent() {
          if (
            window.ZenWriterApp &&
            typeof window.ZenWriterApp.printDocument === 'function'
          ) {
            window.ZenWriterApp.printDocument();
          } else {
            window.print();
          }
        }

        var elements = {};
        var container = document.createElement('div');
        container.className = 'gadget-documents';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';

        var label = document.createElement('label');
        label.setAttribute('for', selectId);
        label.textContent = 'ドキュメント一覧';
        label.style.fontWeight = '600';

        var select = document.createElement('select');
        select.id = selectId;
        select.addEventListener('change', function (ev) {
          switchDocument(ev.target.value);
        });
        elements.select = select;

        function makeSmallButton(text, handler) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'small';
          btn.textContent = text;
          btn.addEventListener('click', handler);
          return btn;
        }

        var primaryRow = document.createElement('div');
        primaryRow.style.display = 'flex';
        primaryRow.style.flexWrap = 'wrap';
        primaryRow.style.gap = '6px';
        var btnCreate = makeSmallButton('作成', createDocument);
        var btnRename = makeSmallButton('改名', renameDocument);
        var btnDelete = makeSmallButton('削除', deleteDocument);
        elements.renameBtn = btnRename;
        elements.deleteBtn = btnDelete;
        primaryRow.appendChild(btnCreate);
        primaryRow.appendChild(btnRename);
        primaryRow.appendChild(btnDelete);

        var secondaryRow = document.createElement('div');
        secondaryRow.style.display = 'flex';
        secondaryRow.style.flexWrap = 'wrap';
        secondaryRow.style.gap = '6px';
        var btnImport = makeSmallButton('ファイルを読み込む', function () {
          hiddenInput.click();
        });
        var btnExportTxt = makeSmallButton('テキストで保存', function () {
          exportCurrent(false);
        });
        var btnExportMd = makeSmallButton('Markdownで保存', function () {
          exportCurrent(true);
        });
        var btnPrint = makeSmallButton('印刷', printCurrent);
        var btnPdfExport = makeSmallButton('PDFエクスポート', function () {
          try {
            window.print();
          } catch (e) {
            console.error('PDF export failed', e);
          }
        });
        secondaryRow.appendChild(btnImport);
        secondaryRow.appendChild(btnExportTxt);
        secondaryRow.appendChild(btnExportMd);
        secondaryRow.appendChild(btnPrint);
        secondaryRow.appendChild(btnPdfExport);

        var hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.accept = '.txt,.md,.markdown,.text';
        hiddenInput.style.display = 'none';
        hiddenInput.addEventListener('change', function (ev) {
          try {
            importFile(ev.target.files);
          } finally {
            ev.target.value = '';
          }
        });

        container.appendChild(label);
        container.appendChild(select);
        container.appendChild(primaryRow);
        container.appendChild(secondaryRow);
        container.appendChild(hiddenInput);

        el.appendChild(container);

        refreshOptions();
        updateDocumentTitle();

        window.addEventListener('ZWLoadoutsChanged', function () {
          refreshOptions(storage.getCurrentDocId());
        });
        window.addEventListener('ZWLoadoutApplied', function () {
          refreshOptions(storage.getCurrentDocId());
        });
        window.addEventListener('ZWDocumentsChanged', function () {
          refreshOptions(storage.getCurrentDocId());
        });
      } catch (e) {
        console.error('Documents gadget failed:', e);
        try {
          el.textContent = 'ドキュメントガジェットの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['structure'], title: 'ドキュメント' },
  );

  ZWGadgets.register(
    'SnapshotManagerLegacyAssist', function(el, api){
    try {
      var storage = window.ZenWriterStorage;
      var editor = window.ZenWriterEditor;
      if (!storage || !storage.loadSnapshots || !storage.addSnapshot) {
        var warn = document.createElement('p');
        warn.textContent = 'スナップショット機能が利用できません。';
        warn.style.opacity = '0.7'; warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      function formatTs(ts){
        const d = new Date(ts);
        const p = (n)=> String(n).padStart(2,'0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
      }

      function renderSnapshots(){
        var list = storage.loadSnapshots() || [];
        el.innerHTML = '';
        if (list.length === 0){
          const empty = document.createElement('div');
          empty.style.opacity = '0.7';
          empty.textContent = 'バックアップはありません';
          el.appendChild(empty);
          return;
        }
        list.forEach(function(item){
          var row = document.createElement('div');
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';
          row.style.padding = '6px 8px';
          row.style.borderBottom = '1px solid #ccc';
          var ts = document.createElement('span');
          ts.textContent = formatTs(item.ts);
          ts.style.flex = '1';
          var label = document.createElement('span');
          label.textContent = item.label || 'バックアップ';
          label.style.flex = '1';
          var restoreBtn = document.createElement('button');
          restoreBtn.type = 'button';
          restoreBtn.className = 'small';
          restoreBtn.textContent = '復元';
          restoreBtn.addEventListener('click', function(){
            if (confirm('このバックアップを復元しますか？')) {
              storage.addSnapshot({
                ts: Date.now(),
                label: '復元',
                data: item.data,
              });
              editor && editor.updateContent && editor.updateContent(item.data);
            }
          });
          var deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.className = 'small';
          deleteBtn.textContent = '削除';
          deleteBtn.addEventListener('click', function(){
            if (confirm('このバックアップを削除しますか？')) {
              storage.removeSnapshot(item.ts);
              renderSnapshots();
            }
          });
          row.appendChild(ts);
          row.appendChild(label);
          row.appendChild(restoreBtn);
          row.appendChild(deleteBtn);
          el.appendChild(row);
        });
      }
      renderSnapshots();
    } catch(e) {
      console.error('SnapshotManagerLegacyAssist gadget failed:', e);
      try { el.textContent = 'スナップショットマネージャーガジェットの初期化に失敗しました。'; } catch(_) {}
    }
  }, { groups: ['assist'], title: 'スナップショットマネージャー' });

  // Tree Pane gadget (structure group minimal version) - documents and gadgets tree view with expand/collapse and click navigation
  ZWGadgets.register('TreePane', function(el, api){
    try {
      var storage = window.ZenWriterStorage;
      if (!storage || !storage.loadDocuments) {
        var warn = document.createElement('p');
        warn.textContent = 'ストレージが利用できません。';
        warn.style.opacity = '0.7';
        warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      var container = document.createElement('div');
      container.className = 'gadget-tree-pane';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '4px';
      container.style.maxHeight = '400px';
      container.style.overflowY = 'auto';

      var expanded = api && typeof api.get === 'function' ? api.get('expanded', { documents: true, gadgets: false }) : { documents: true, gadgets: false };

      function createTreeItem(label, isFolder, level, onClick, onToggle, isExpanded) {
        var item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.padding = '2px 4px';
        item.style.paddingLeft = (level * 16) + 'px';
        item.style.cursor = 'pointer';
        item.style.borderRadius = '3px';
        item.addEventListener('mouseenter', function() { item.style.backgroundColor = 'var(--bg-hover-color, #f0f0f0)'; });
        item.addEventListener('mouseleave', function() { item.style.backgroundColor = ''; });

        if (isFolder) {
          var toggleBtn = document.createElement('button');
          toggleBtn.type = 'button';
          toggleBtn.textContent = isExpanded ? '▼' : '▶';
          toggleBtn.style.border = 'none';
          toggleBtn.style.background = 'none';
          toggleBtn.style.cursor = 'pointer';
          toggleBtn.style.fontSize = '0.8rem';
          toggleBtn.style.width = '16px';
          toggleBtn.style.height = '16px';
          toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            onToggle && onToggle();
          });
          item.appendChild(toggleBtn);
        } else {
          item.style.paddingLeft = (level * 16 + 16) + 'px';
        }

        var textSpan = document.createElement('span');
        textSpan.textContent = label;
        textSpan.style.fontSize = '0.9rem';
        textSpan.style.fontWeight = isFolder ? 'bold' : 'normal';
        item.appendChild(textSpan);

        item.addEventListener('click', onClick);
        return item;
      }

      function renderTree() {
        container.innerHTML = '';

        // Documents folder
        var docsFolder = createTreeItem('ドキュメント', true, 0, null, function() {
          expanded.documents = !expanded.documents;
          if (api && typeof api.set === 'function') api.set('expanded', expanded);
          renderTree();
        }, expanded.documents);
        container.appendChild(docsFolder);

        if (expanded.documents) {
          var docs = storage.loadDocuments() || [];
          docs.forEach(function(doc) {
            if (!doc || !doc.id) return;
            var currentDocId = storage.getCurrentDocId();
            var isActive = doc.id === currentDocId;
            var docItem = createTreeItem(doc.name || '無題', false, 1, function() {
              storage.setCurrentDocId(doc.id);
              if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
                window.ZenWriterEditor.setContent(doc.content || '');
              }
              updateDocumentTitle();
              renderTree();
            }, null, false);
            if (isActive) {
              docItem.style.fontWeight = 'bold';
              docItem.style.backgroundColor = 'var(--accent-color, #007acc)';
              docItem.style.color = 'white';
            }
            container.appendChild(docItem);
          });
        }

        // Gadgets folder
        var gadgetsFolder = createTreeItem('ガジェット', true, 0, null, function() {
          expanded.gadgets = !expanded.gadgets;
          if (api && typeof api.set === 'function') api.set('expanded', expanded);
          renderTree();
        }, expanded.gadgets);
        container.appendChild(gadgetsFolder);

        if (expanded.gadgets) {
          if (window.ZWGadgets && window.ZWGadgets._list) {
            window.ZWGadgets._list.forEach(function(gadget) {
              var gadgetItem = createTreeItem(gadget.title || gadget.name, false, 1, null, null, false);
              container.appendChild(gadgetItem);
            });
          }
        }
      }

      function updateDocumentTitle() {
        try {
          var docs = storage.loadDocuments() || [];
          var cur = storage.getCurrentDocId();
          var doc = docs.find(function(d) { return d && d.id === cur; });
          var name = doc && doc.name ? doc.name : '';
          document.title = name ? name + ' - Zen Writer' : 'Zen Writer - 小説執筆ツール';
        } catch (_) {
          document.title = 'Zen Writer - 小説執筆ツール';
        }
      }

      el.appendChild(container);
      renderTree();

      // Listen for changes
      window.addEventListener('ZWDocumentsChanged', renderTree);
      window.addEventListener('ZWLoadoutsChanged', renderTree);
      window.addEventListener('ZWLoadoutApplied', renderTree);
    } catch (e) {
      console.error('TreePane gadget failed:', e);
      try {
        el.textContent = 'ツリーペインガジェットの初期化に失敗しました。';
      } catch (_) {}
    }
  },
  { groups: ['structure'], title: 'ツリーペイン' },
  );

  // Corkboard gadget (minimal version) - text cards add/drag reorder only
  ZWGadgets.register('Corkboard', function(el, api){
    try {
      var container = document.createElement('div');
      container.className = 'gadget-corkboard';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      container.style.maxHeight = '500px';
      container.style.overflowY = 'auto';
      container.style.padding = '8px';
      container.style.backgroundColor = 'var(--bg-color, #f9f9f9)';
      container.style.borderRadius = '4px';

      var cards = api && typeof api.get === 'function' ? api.get('cards', []) : [];
      var draggedCard = null;
      var dragOverCard = null;

      function createCard(text, index) {
        var card = document.createElement('div');
        card.className = 'corkboard-card';
        card.style.backgroundColor = 'white';
        card.style.border = '1px solid #ddd';
        card.style.borderRadius = '4px';
        card.style.padding = '8px';
        card.style.cursor = 'move';
        card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        card.style.minHeight = '40px';
        card.draggable = true;
        card.dataset.index = index;

        var textArea = document.createElement('textarea');
        textArea.value = text || '';
        textArea.placeholder = 'テキストを入力...';
        textArea.style.width = '100%';
        textArea.style.border = 'none';
        textArea.style.resize = 'none';
        textArea.style.background = 'transparent';
        textArea.style.fontSize = '0.9rem';
        textArea.style.lineHeight = '1.4';
        textArea.addEventListener('input', function() {
          cards[index] = textArea.value;
          if (api && typeof api.set === 'function') api.set('cards', cards);
          autoResize(textArea);
        });
        textArea.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addNewCard(index + 1);
          }
        });

        card.addEventListener('dragstart', function(e) {
          draggedCard = card;
          e.dataTransfer.effectAllowed = 'move';
          card.style.opacity = '0.5';
        });
        card.addEventListener('dragend', function(e) {
          draggedCard = null;
          card.style.opacity = '1';
          if (dragOverCard) {
            dragOverCard.style.borderTop = '';
            dragOverCard = null;
          }
        });
        card.addEventListener('dragover', function(e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (dragOverCard !== card) {
            if (dragOverCard) dragOverCard.style.borderTop = '';
            dragOverCard = card;
            card.style.borderTop = '2px solid #007acc';
          }
        });
        card.addEventListener('dragleave', function(e) {
          if (dragOverCard === card) {
            card.style.borderTop = '';
            dragOverCard = null;
          }
        });
        card.addEventListener('drop', function(e) {
          e.preventDefault();
          card.style.borderTop = '';
          if (draggedCard && draggedCard !== card) {
            var fromIndex = parseInt(draggedCard.dataset.index);
            var toIndex = parseInt(card.dataset.index);
            if (fromIndex !== toIndex) {
              var movedCard = cards.splice(fromIndex, 1)[0];
              cards.splice(toIndex, 0, movedCard);
              if (api && typeof api.set === 'function') api.set('cards', cards);
              renderCards();
            }
          }
          draggedCard = null;
          dragOverCard = null;
        });

        card.appendChild(textArea);
        autoResize(textArea);
        return card;
      }

      function autoResize(textArea) {
        textArea.style.height = 'auto';
        textArea.style.height = textArea.scrollHeight + 'px';
      }

      function addNewCard(atIndex) {
        cards.splice(atIndex, 0, '');
        if (api && typeof api.set === 'function') api.set('cards', cards);
        renderCards();
        // Focus the new card
        setTimeout(function() {
          var newCards = container.querySelectorAll('.corkboard-card');
          if (newCards[atIndex]) {
            var textArea = newCards[atIndex].querySelector('textarea');
            if (textArea) textArea.focus();
          }
        }, 0);
      }

      function renderCards() {
        container.innerHTML = '';
        cards.forEach(function(cardText, index) {
          var card = createCard(cardText, index);
          container.appendChild(card);
        });
        // Add button to add new card
        var addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.textContent = '+ 新しいカード';
        addBtn.className = 'small';
        addBtn.style.width = '100%';
        addBtn.style.marginTop = '8px';
        addBtn.addEventListener('click', function() {
          addNewCard(cards.length);
        });
        container.appendChild(addBtn);
      }

      el.appendChild(container);
      renderCards();
    } catch (e) {
      console.error('Corkboard gadget failed:', e);
      try {
        el.textContent = 'Corkboardガジェットの初期化に失敗しました。';
      } catch (_) {}
    }
  },
  { groups: ['assist'], title: 'Corkboard' },
  );

  // Documents gadget
  ZWGadgets.register('Documents', function(el, api){
    try {
      var storage = window.ZenWriterStorage;
      var container = document.createElement('div');
      container.className = 'gadget-documents';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';

      var label = document.createElement('label');
      label.textContent = 'ドキュメント';
      label.style.fontWeight = 'bold';

      var select = document.createElement('select');
      select.className = 'gadget-select';
      select.addEventListener('change', function(e){
        var docId = e.target.value;
        if (api && typeof api.set === 'function') api.set('docId', docId);
        storage.setCurrentDocId(docId);
        refreshOptions(docId);
        updateDocumentTitle();
      });

      var primaryRow = document.createElement('div');
      primaryRow.style.display = 'flex';
      primaryRow.style.flexWrap = 'wrap';
      primaryRow.style.gap = '6px';
      var btnCreate = makeSmallButton('作成', createDocument);
      var btnRename = makeSmallButton('改名', renameDocument);
      var btnDelete = makeSmallButton('削除', deleteDocument);
      elements.renameBtn = btnRename;
      elements.deleteBtn = btnDelete;
      primaryRow.appendChild(btnCreate);
      primaryRow.appendChild(btnRename);
      primaryRow.appendChild(btnDelete);

      var secondaryRow = document.createElement('div');
      secondaryRow.style.display = 'flex';
      secondaryRow.style.flexWrap = 'wrap';
      secondaryRow.style.gap = '6px';
      var btnImport = makeSmallButton('ファイルを読み込む', function () {
        hiddenInput.click();
      });
      var btnExportTxt = makeSmallButton('テキストで保存', function () {
        exportCurrent(false);
      });
      var btnExportMd = makeSmallButton('Markdownで保存', function () {
        exportCurrent(true);
      });
      var btnPrint = makeSmallButton('印刷', printCurrent);
      var btnPdfExport = makeSmallButton('PDFエクスポート', function () {
        // PDFエクスポート機能（ブラウザ印刷利用）
        try {
          window.print();
        } catch (e) {
          console.error('PDF export failed', e);
        }
      });
      secondaryRow.appendChild(btnImport);
      secondaryRow.appendChild(btnExportTxt);
      secondaryRow.appendChild(btnExportMd);
      secondaryRow.appendChild(btnPrint);
      secondaryRow.appendChild(btnPdfExport);

      var hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.accept = '.txt,.md,.markdown,.text';
      hiddenInput.style.display = 'none';
      hiddenInput.addEventListener('change', function (ev) {
        try {
          importFile(ev.target.files);
        } finally {
          ev.target.value = '';
        }
      });

      container.appendChild(label);
      container.appendChild(select);
      container.appendChild(primaryRow);
      container.appendChild(secondaryRow);
      container.appendChild(hiddenInput);

      el.appendChild(container);

      refreshOptions();
      updateDocumentTitle();

      window.addEventListener('ZWLoadoutsChanged', function () {
        refreshOptions(storage.getCurrentDocId());
      });
      window.addEventListener('ZWLoadoutApplied', function () {
        refreshOptions(storage.getCurrentDocId());
      });
      window.addEventListener('ZWDocumentsChanged', function () {
        refreshOptions(storage.getCurrentDocId());
      });
    } catch (e) {
      console.error('Documents gadget failed:', e);
      try {
        el.textContent = 'ドキュメントガジェットの初期化に失敗しました。';
      } catch (_) {}
    }
  },
  { groups: ['structure'], title: 'ドキュメント' },
  );

  ZWGadgets.register(
    'TypographyThemes',
    function (el) {
      try {
        var theme = window.ZenWriterTheme;
        var storage = window.ZenWriterStorage;
        if (!theme || !storage || typeof storage.loadSettings !== 'function') {
          var warn = document.createElement('p');
          warn.textContent = 'タイポ設定を読み込めません。';
          warn.style.opacity = '0.7';
          warn.style.fontSize = '0.9rem';
          el.appendChild(warn);
          return;
        }

        var wrap = document.createElement('div');
        wrap.className = 'gadget-typography';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '12px';

        var settings = storage.loadSettings() || {};

        var makeSection = function (title) {
          var section = document.createElement('section');
          section.className = 'typography-section';
          section.style.display = 'flex';
          section.style.flexDirection = 'column';
          section.style.gap = '6px';
          var heading = document.createElement('h4');
          heading.textContent = title;
          heading.style.margin = '0';
          heading.style.fontSize = '0.95rem';
          section.appendChild(heading);
          return section;
        };

        var makeField = function (labelText, control) {
          var row = document.createElement('label');
          row.style.display = 'flex';
          row.style.flexDirection = 'column';
          row.style.gap = '4px';
          row.textContent = labelText;
          row.appendChild(control);
          return row;
        };

        var themes = ['light', 'dark', 'sepia', 'high-contrast', 'solarized'];
        var themeLabels = {
          light: 'ライト',
          dark: 'ダーク',
          sepia: 'セピア',
          'high-contrast': '高コントラスト',
          solarized: 'ソラリゼド',
        };
        var colorsSection = makeSection('テーマ & 色');
        var themeButtons = document.createElement('div');
        themeButtons.style.display = 'flex';
        themeButtons.style.flexWrap = 'wrap';
        themeButtons.style.gap = '6px';
        themes.forEach(function (key) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'small';
          btn.textContent = themeLabels[key] || key;
          btn.addEventListener('click', function () {
            try {
              theme.applyTheme(key);
              refreshState();
            } catch (err) {
              console.error('applyTheme failed', err);
            }
          });
          themeButtons.appendChild(btn);
        });
        colorsSection.appendChild(themeButtons);

        var bgInput = document.createElement('input');
        bgInput.type = 'color';
        bgInput.addEventListener('change', function () {
          try {
            theme.applyCustomColors(bgInput.value, textInput.value, true);
          } catch (err) {
            console.error('applyCustomColors failed', err);
          }
          refreshState();
        });
        var textInput = document.createElement('input');
        textInput.type = 'color';
        textInput.addEventListener('change', function () {
          try {
            theme.applyCustomColors(bgInput.value, textInput.value, true);
          } catch (err) {
            console.error('applyCustomColors failed', err);
          }
          refreshState();
        });
        colorsSection.appendChild(makeField('背景色', bgInput));
        colorsSection.appendChild(makeField('文字色', textInput));

        var fontSection = makeSection('フォント');

        var contentFonts = [
          { value: '\'Noto Serif JP\', serif', label: 'Noto Serif JP' },
          { value: '\'Yu Mincho\', \'YuMincho\', serif', label: '游明朝' },
          { value: '\'Hiragino Mincho ProN\', serif', label: 'ヒラギノ明朝' },
          { value: '\'Klee One\', cursive', label: 'Klee One' },
          { value: '\'Shippori Mincho\', serif', label: 'しっぽり明朝' },
        ];
        var uiFonts = [
          {
            value:
              'system-ui, -apple-system, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif',
            label: 'システムフォント',
          },
          { value: '\'Noto Sans JP\', sans-serif', label: 'Noto Sans JP' },
          { value: '\'Yu Gothic\', \'YuGothic\', sans-serif', label: '游ゴシック' },
        ];

        var contentFontSelect = document.createElement('select');
        contentFonts.forEach(function (font) {
          var opt = document.createElement('option');
          opt.value = font.value;
          opt.textContent = font.label;
          contentFontSelect.appendChild(opt);
        });
        contentFontSelect.addEventListener('change', function () {
          applyFontChanges();
        });
        fontSection.appendChild(makeField('本文フォント', contentFontSelect));

        var uiFontSelect = document.createElement('select');
        uiFonts.forEach(function (font) {
          var opt = document.createElement('option');
          opt.value = font.value;
          opt.textContent = font.label;
          uiFontSelect.appendChild(opt);
        });
        uiFontSelect.addEventListener('change', function () {
          applyFontChanges();
        });
        fontSection.appendChild(makeField('UIフォント', uiFontSelect));

        var fontSizeRow = document.createElement('div');
        fontSizeRow.style.display = 'flex';
        fontSizeRow.style.flexDirection = 'column';
        fontSizeRow.style.gap = '4px';
        var fontSizeLabel = document.createElement('div');
        fontSizeLabel.style.fontSize = '0.85rem';
        fontSizeLabel.style.opacity = '0.8';
        var fontSizeInput = document.createElement('input');
        fontSizeInput.type = 'range';
        fontSizeInput.min = '12';
        fontSizeInput.max = '32';
        fontSizeInput.step = '1';
        fontSizeInput.addEventListener('input', function () {
          fontSizeLabel.textContent =
            '本文フォントサイズ: ' + fontSizeInput.value + 'px';
          applyFontChanges();
        });
        fontSizeRow.appendChild(fontSizeLabel);
        fontSizeRow.appendChild(fontSizeInput);
        fontSection.appendChild(fontSizeRow);

        var uiFontSizeRow = document.createElement('div');
        uiFontSizeRow.style.display = 'flex';
        uiFontSizeRow.style.flexDirection = 'column';
        uiFontSizeRow.style.gap = '4px';
        var uiFontSizeLabel = document.createElement('div');
        uiFontSizeLabel.style.fontSize = '0.85rem';
        uiFontSizeLabel.style.opacity = '0.8';
        var uiFontSizeInput = document.createElement('input');
        uiFontSizeInput.type = 'range';
        uiFontSizeInput.min = '12';
        uiFontSizeInput.max = '32';
        uiFontSizeInput.step = '1';
        uiFontSizeInput.addEventListener('input', function () {
          uiFontSizeLabel.textContent =
            'UIフォントサイズ: ' + uiFontSizeInput.value + 'px';
          applyFontChanges();
        });
        uiFontSizeRow.appendChild(uiFontSizeLabel);
        uiFontSizeRow.appendChild(uiFontSizeInput);
        fontSection.appendChild(uiFontSizeRow);

        var editorFontSizeRow = document.createElement('div');
        editorFontSizeRow.style.display = 'flex';
        editorFontSizeRow.style.flexDirection = 'column';
        editorFontSizeRow.style.gap = '4px';
        var editorFontSizeLabel = document.createElement('div');
        editorFontSizeLabel.style.fontSize = '0.85rem';
        editorFontSizeLabel.style.opacity = '0.8';
        var editorFontSizeInput = document.createElement('input');
        editorFontSizeInput.type = 'range';
        editorFontSizeInput.min = '12';
        editorFontSizeInput.max = '32';
        editorFontSizeInput.step = '1';
        editorFontSizeInput.addEventListener('input', function () {
          editorFontSizeLabel.textContent =
            'エディタフォントサイズ: ' + editorFontSizeInput.value + 'px';
          applyFontChanges();
        });
        editorFontSizeRow.appendChild(editorFontSizeLabel);
        editorFontSizeRow.appendChild(editorFontSizeInput);
        fontSection.appendChild(editorFontSizeRow);

        var lineHeightRow = document.createElement('div');
        lineHeightRow.style.display = 'flex';
        lineHeightRow.style.flexDirection = 'column';
        lineHeightRow.style.gap = '4px';
        var lineHeightLabel = document.createElement('div');
        lineHeightLabel.style.fontSize = '0.85rem';
        lineHeightLabel.style.opacity = '0.8';
        var lineHeightInput = document.createElement('input');
        lineHeightInput.type = 'range';
        lineHeightInput.min = '1.0';
        lineHeightInput.max = '3.0';
        lineHeightInput.step = '0.1';
        lineHeightInput.addEventListener('input', function () {
          lineHeightLabel.textContent = '行間: ' + lineHeightInput.value;
          applyFontChanges();
        });
        lineHeightRow.appendChild(lineHeightLabel);
        lineHeightRow.appendChild(lineHeightInput);
        fontSection.appendChild(lineHeightRow);

        wrap.appendChild(colorsSection);
        wrap.appendChild(fontSection);
        el.appendChild(wrap);

        function applyFontChanges() {
          try {
            var baseSize = parseInt(fontSizeInput.value, 10) || 16;
            var uiSize = parseInt(uiFontSizeInput.value, 10) || baseSize;
            var editorSize =
              parseInt(editorFontSizeInput.value, 10) || baseSize;
            var line = parseFloat(lineHeightInput.value) || 1.6;
            theme.applyFontSettings(
              contentFontSelect.value,
              baseSize,
              line,
              uiSize,
              editorSize,
            );
            storage.saveSettings(
              Object.assign({}, settings, {
                fontFamilyContent: contentFontSelect.value,
                fontFamilyUI: uiFontSelect.value,
                fontSize: baseSize,
                uiFontSize: uiSize,
                editorFontSize: editorSize,
                lineHeight: line,
              }),
            );
          } catch (err) {
            console.error('applyFontSettings failed', err);
          }
        }

        function refreshState() {
          try {
            settings = storage.loadSettings() || {};
            var currentContentFont =
              settings.fontFamilyContent || contentFonts[0].value;
            var currentUIFont = settings.fontFamilyUI || uiFonts[0].value;
            var baseSize = settings.fontSize || 16;
            var uiSize = settings.uiFontSize || baseSize;
            var editorSize = settings.editorFontSize || baseSize;
            var line = settings.lineHeight || 1.6;
            var bg = settings.bgColor || '#ffffff';
            var text = settings.textColor || '#333333';

            if (contentFontSelect.value !== currentContentFont)
              contentFontSelect.value = currentContentFont;
            if (uiFontSelect.value !== currentUIFont)
              uiFontSelect.value = currentUIFont;
            fontSizeInput.value = baseSize;
            fontSizeLabel.textContent =
              '本文フォントサイズ: ' + baseSize + 'px';
            uiFontSizeInput.value = uiSize;
            uiFontSizeLabel.textContent = 'UIフォントサイズ: ' + uiSize + 'px';
            editorFontSizeInput.value = editorSize;
            editorFontSizeLabel.textContent =
              'エディタフォントサイズ: ' + editorSize + 'px';
            lineHeightInput.value = line;
            lineHeightLabel.textContent = '行間: ' + line;
            bgInput.value = bg;
            textInput.value = text;
          } catch (err) {
            console.error('refreshState failed', err);
          }
        }

        refreshState();
        window.addEventListener('ZenWriterSettingsChanged', refreshState);
        window.addEventListener('ZWLoadoutsChanged', refreshState);
        window.addEventListener('ZWLoadoutApplied', refreshState);
      } catch (e) {
        console.error('TypographyThemes gadget failed:', e);
        try {
          el.textContent = 'タイポ設定ガジェットの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['typography'], title: 'テーマ & フォント' },
  );

  ZWGadgets.register(
    'EditorLayout',
    function (el, api) {
      try {
        var wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '8px';

        function makeRow(labelText, control) {
          var row = document.createElement('label');
          row.style.display = 'flex';
          row.style.flexDirection = 'column';
          row.style.gap = '4px';
          row.textContent = labelText;
          row.appendChild(control);
          return row;
        }

        var s = (api && typeof api.getSettings === 'function') ? (api.getSettings() || {}) : {};

        var cbBorder = document.createElement('input');
        cbBorder.type = 'checkbox';
        cbBorder.checked = !!s.showBorder;
        cbBorder.addEventListener('change', function () {
          var ns = Object.assign({}, s, { showBorder: !!cbBorder.checked });
          s = ns;
          if (api && typeof api.setSettings === 'function') api.setSettings(ns);
          applyToDOM();
        });

        var cbPreview = document.createElement('input');
        cbPreview.type = 'checkbox';
        cbPreview.checked = !!s.showPreview;
        cbPreview.addEventListener('change', function () {
          var ns = Object.assign({}, s, { showPreview: !!cbPreview.checked });
          s = ns;
          if (api && typeof api.setSettings === 'function') api.setSettings(ns);
          applyToDOM();
        });

        var padding = document.createElement('input');
        padding.type = 'range';
        padding.min = '0';
        padding.max = '200';
        padding.step = '10';
        padding.value = String(typeof s.paddingX === 'number' ? s.paddingX : 100);
        padding.addEventListener('input', function () {
          var px = parseInt(padding.value, 10) || 0;
          var ns = Object.assign({}, s, { paddingX: px });
          s = ns;
          if (api && typeof api.setSettings === 'function') api.setSettings(ns);
          applyToDOM();
        });

        wrap.appendChild(makeRow('編集エリアの枠を表示', cbBorder));
        wrap.appendChild(makeRow('白黒プレビューを表示', cbPreview));
        wrap.appendChild(makeRow('執筆エリア内余白（px）', padding));
        el.appendChild(wrap);

        function applyToDOM() {
          try {
            var preview = document.getElementById('editor-preview');
            if (preview) {
              preview.classList.toggle('editor-preview--bordered', !!s.showBorder);
              preview.classList.toggle('editor-preview--collapsed', !s.showPreview);
              var px = typeof s.paddingX === 'number' ? s.paddingX : 100;
              preview.style.padding = '1rem ' + px + 'px';
              if (s.showPreview) {
                preview.style.filter = 'grayscale(100%)';
              } else {
                preview.style.filter = '';
              }
            }
          } catch (_) {}
        }

        applyToDOM();
      } catch (e) {
        try {
          el.textContent = 'エディタレイアウトの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['typography'], title: 'エディタレイアウト' },
  );

  ZWGadgets.register(
    'HUDSettings',
    function (el) {
      try {
        var storage = window.ZenWriterStorage;
        if (
          !storage ||
          typeof storage.loadSettings !== 'function' ||
          typeof storage.saveSettings !== 'function'
        ) {
          var warn = document.createElement('p');
          warn.textContent = 'HUD設定は利用できません。';
          warn.style.opacity = '0.7';
          warn.style.fontSize = '0.9rem';
          el.appendChild(warn);
          return;
        }

        function loadHud() {
          var settings = storage.loadSettings() || {};
          return settings.hud || {};
        }
        function saveHud(patch) {
          var settings = storage.loadSettings() || {};
          settings.hud = Object.assign({}, settings.hud || {}, patch || {});
          storage.saveSettings(settings);
          try {
            if (
              window.ZenWriterHUD &&
              typeof window.ZenWriterHUD.updateFromSettings === 'function'
            ) {
              window.ZenWriterHUD.updateFromSettings();
            }
          } catch (_) {}
        }

        var hud = loadHud();

        var wrap = document.createElement('div');
        wrap.className = 'gadget-hud-settings';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '8px';

        function makeRow(labelText, control) {
          var row = document.createElement('label');
          row.style.display = 'flex';
          row.style.flexDirection = 'column';
          row.style.gap = '4px';
          row.textContent = labelText;
          row.appendChild(control);
          return row;
        }

        var select = document.createElement('select');
        [
          { value: 'bottom-left', label: '左下' },
          { value: 'bottom-right', label: '右下' },
          { value: 'top-left', label: '左上' },
          { value: 'top-right', label: '右上' },
        ].forEach(function (opt) {
          var o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          select.appendChild(o);
        });
        select.value = hud.position || 'bottom-left';
        select.addEventListener('change', function (e) {
          saveHud({ position: e.target.value });
        });
        wrap.appendChild(makeRow('表示位置', select));

        var duration = document.createElement('input');
        duration.type = 'number';
        duration.min = '300';
        duration.max = '5000';
        duration.step = '100';
        duration.value = hud.duration || 1200;
        function clampDuration(v) {
          var n = parseInt(v, 10);
          if (isNaN(n)) return 1200;
          return Math.max(300, Math.min(5000, n));
        }
        var durationHandler = function (e) {
          saveHud({ duration: clampDuration(e.target.value) });
        };
        duration.addEventListener('change', durationHandler);
        duration.addEventListener('input', durationHandler);
        wrap.appendChild(makeRow('表示時間（ms）', duration));

        var bg = document.createElement('input');
        bg.type = 'color';
        bg.value = hud.bg || '#000000';
        bg.addEventListener('change', function (e) {
          saveHud({ bg: e.target.value });
        });
        wrap.appendChild(makeRow('背景色', bg));

        var fg = document.createElement('input');
        fg.type = 'color';
        fg.value = hud.fg || '#ffffff';
        fg.addEventListener('change', function (e) {
          saveHud({ fg: e.target.value });
        });
        wrap.appendChild(makeRow('文字色', fg));

        var opacityLabel = document.createElement('div');
        opacityLabel.textContent =
          '不透明度: ' + (typeof hud.opacity === 'number' ? hud.opacity : 0.75);
        opacityLabel.style.fontSize = '0.85rem';
        opacityLabel.style.opacity = '0.8';
        var opacity = document.createElement('input');
        opacity.type = 'range';
        opacity.min = '0';
        opacity.max = '1';
        opacity.step = '0.05';
        opacity.value = typeof hud.opacity === 'number' ? hud.opacity : 0.75;
        function setOpacity(val) {
          var num = Math.max(0, Math.min(1, parseFloat(val)));
          opacityLabel.textContent = '不透明度: ' + num;
          saveHud({ opacity: num });
        }
        opacity.addEventListener('input', function (e) {
          setOpacity(e.target.value);
        });
        opacity.addEventListener('change', function (e) {
          setOpacity(e.target.value);
        });
        var opacityRow = document.createElement('div');
        opacityRow.style.display = 'flex';
        opacityRow.style.flexDirection = 'column';
        opacityRow.style.gap = '4px';
        opacityRow.appendChild(opacityLabel);
        opacityRow.appendChild(opacity);
        wrap.appendChild(opacityRow);

        var testBtn = document.createElement('button');
        testBtn.type = 'button';
        testBtn.className = 'small';
        testBtn.textContent = 'HUDテスト表示';
        testBtn.addEventListener('click', function () {
          try {
            if (
              window.ZenWriterHUD &&
              typeof window.ZenWriterHUD.publish === 'function'
            ) {
              window.ZenWriterHUD.publish('HUDテスト表示');
            }
          } catch (_) {}
        });
        wrap.appendChild(testBtn);

        el.appendChild(wrap);
      } catch (e) {
        console.error('HUDSettings gadget failed:', e);
        try {
          el.textContent = 'HUD設定ガジェットの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['assist'], title: 'HUD設定' },
  );

  // Writing Goal gadget
  ZWGadgets.register(
    'WritingGoal',
    function (el, api) {
      try {
        var storage = window.ZenWriterStorage;
        var editor = window.ZenWriterEditor;
        if (!storage) {
          var warn = document.createElement('p');
          warn.textContent =
            'ストレージが利用できないため目標を保存できません。';
          warn.style.opacity = '0.7';
          warn.style.fontSize = '0.9rem';
          el.appendChild(warn);
          return;
        }

        var goal =
          api && typeof api.get === 'function' ? api.get('goal', {}) : {};

        var wrap = document.createElement('div');
        wrap.className = 'gadget-goal';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '8px';

        var target = document.createElement('input');
        target.type = 'number';
        target.min = '0';
        target.placeholder = '例: 2000';
        target.value =
          typeof goal.target === 'number'
            ? goal.target
            : parseInt(goal.target, 10) || 0;
        target.addEventListener('input', function (e) {
          var n = Math.max(0, parseInt(e.target.value, 10) || 0);
          var newGoal = Object.assign({}, goal, { target: n });
          if (api && typeof api.set === 'function') api.set('goal', newGoal);
          try {
            editor && editor.updateWordCount && editor.updateWordCount();
          } catch (_) {}
        });

        var deadline = document.createElement('input');
        deadline.type = 'date';
        deadline.value = goal.deadline || '';
        deadline.addEventListener('change', function (e) {
          var newGoal = Object.assign({}, goal, {
            deadline: e.target.value || '',
          });
          if (api && typeof api.set === 'function') api.set('goal', newGoal);
        });

        var row1 = document.createElement('label');
        row1.style.display = 'flex';
        row1.style.flexDirection = 'column';
        row1.style.gap = '4px';
        row1.textContent = '目標文字数';
        row1.appendChild(target);
        var row2 = document.createElement('label');
        row2.style.display = 'flex';
        row2.style.flexDirection = 'column';
        row2.style.gap = '4px';
        row2.textContent = '締切日';
        row2.appendChild(deadline);

        var reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'small';
        reset.textContent = '目標をクリア';
        reset.addEventListener('click', function () {
          if (confirm('執筆目標をクリアしますか？')) {
            if (api && typeof api.set === 'function') api.set('goal', {});
            target.value = 0;
            deadline.value = '';
            try {
              editor && editor.updateWordCount && editor.updateWordCount();
            } catch (_) {}
          }
        });

        wrap.appendChild(row1);
        wrap.appendChild(row2);
        wrap.appendChild(reset);
        el.appendChild(wrap);
        var settings =
          api && typeof api.getSettings === 'function' ? api.getSettings() : {};
        var width = settings.width || 900;
        var paddingX = settings.paddingX || 100;
        var showBorder = !!settings.showBorder;

        function applyLayout() {
          try {
            var canvas = document.querySelector('.editor-canvas');
            var preview = document.getElementById('editor-preview');
            if (canvas) {
              canvas.style.width = width + 'px';
            }
            if (preview) {
              preview.style.padding = '1rem ' + paddingX + 'px';
              preview.classList.toggle('editor-preview--bordered', showBorder);
              var sAll = (window.ZWGadgets && typeof window.ZWGadgets.getSettings === 'function') ? (window.ZWGadgets.getSettings('EditorLayout') || {}) : {};
              var sp = !!(sAll && sAll.showPreview);
              preview.classList.toggle('editor-preview--collapsed', !sp);
            }
          } catch (e) {
            console.error('applyLayout failed', e);
          }
        }
        applyLayout();

        // 設定変更イベント（共通/個別）を購読して再適用
        function _onSettingsChanged(ev) {
          try {
            var d = ev && ev.detail ? ev.detail : {};
            if (d && d.name === 'EditorLayout') {
              var s = d.settings || {};
              width = typeof s.width === 'number' ? s.width : width;
              paddingX = typeof s.paddingX === 'number' ? s.paddingX : paddingX;
              showBorder = !!s.showBorder;
              applyLayout();
            }
          } catch (_) {}
        }
        try {
          window.addEventListener(
            'ZWGadgetSettingsChanged',
            _onSettingsChanged,
          );
        } catch (_) {}
        try {
          window.addEventListener(
            'ZWGadgetSettingsChanged:EditorLayout',
            _onSettingsChanged,
          );
        } catch (_) {}
      } catch (e) {
        console.error('WritingGoal gadget failed:', e);
        try {
          el.textContent = '執筆目標ガジェットの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['assist'], title: '執筆目標' },
  );

  // Snapshot Manager gadget (legacy assist) — renamed to avoid conflict
  ZWGadgets.register(
    'SnapshotManagerLegacyAssist',
    function (el, api) {
      try {
        var storage = window.ZenWriterStorage;
        var editor = window.ZenWriterEditor;
        if (!storage || !storage.loadSnapshots || !storage.addSnapshot) {
          var warn = document.createElement('p');
          warn.textContent = 'スナップショット機能が利用できません。';
          warn.style.opacity = '0.7';
          warn.style.fontSize = '0.9rem';
          el.appendChild(warn);
          return;
        }

        function formatTs(ts) {
          const d = new Date(ts);
          const p = (n) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
        }

        function renderSnapshots() {
          var list = storage.loadSnapshots() || [];
          el.innerHTML = '';
          if (list.length === 0) {
            const empty = document.createElement('div');
            empty.style.opacity = '0.7';
            empty.textContent = 'バックアップはありません';
            el.appendChild(empty);
            return;
          }
          list.forEach((s) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.gap = '6px';
            row.style.margin = '4px 0';
            const meta = document.createElement('div');
            meta.textContent = `${formatTs(s.ts)} / ${s.len} 文字`;
            const actions = document.createElement('div');
            const restore = document.createElement('button');
            restore.className = 'small';
            restore.textContent = '復元';
            restore.addEventListener('click', () => {
              if (
                confirm(
                  'このバックアップで本文を置き換えます。よろしいですか？',
                )
              ) {
                editor.setContent(s.content || '');
                if (typeof editor.showNotification === 'function') {
                  editor.showNotification('バックアップから復元しました');
                }
              }
            });
            const del = document.createElement('button');
            del.className = 'small';
            del.textContent = '削除';
            del.addEventListener('click', () => {
              if (confirm('このバックアップを削除しますか？')) {
                storage.deleteSnapshot(s.id);
                renderSnapshots();
              }
            });
            actions.appendChild(restore);
            actions.appendChild(del);
            row.appendChild(meta);
            row.appendChild(actions);
            el.appendChild(row);
          });
        }

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'small';
        saveBtn.textContent = '今すぐ保存';
        saveBtn.addEventListener('click', () => {
          const content = editor && editor.value ? editor.value : '';
          storage.addSnapshot(content);
          if (typeof editor.showNotification === 'function') {
            editor.showNotification('バックアップを保存しました');
          }
          renderSnapshots();
        });
        el.appendChild(saveBtn);

        renderSnapshots();
      } catch (e) {
        console.error('SnapshotManager gadget failed:', e);
        try {
          el.textContent = 'スナップショットガジェットの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['assist'], title: 'バックアップ' },
  );

  // Print Settings gadget
  ZWGadgets.register(
    'PrintSettings',
    function (el, api) {
      try {
        const printBtn = document.createElement('button');
        printBtn.type = 'button';
        printBtn.className = 'small';
        printBtn.textContent = '印刷プレビュー';
        printBtn.addEventListener('click', () => {
          const pv = document.getElementById('print-view');
          if (!pv || !editor) return;
          const text = editor.value || '';
          pv.innerHTML = '';
          const norm = text.replace(/\r\n/g, '\n');
          const blocks = norm.split(/\n{2,}/);
          blocks.forEach((seg) => {
            const p = document.createElement('p');
            p.textContent = seg;
            pv.appendChild(p);
          });
          window.print();
        });
        el.appendChild(printBtn);

        const exportBtn = document.createElement('button');
        exportBtn.type = 'button';
        exportBtn.className = 'small';
        exportBtn.textContent = 'TXTエクスポート';
        exportBtn.addEventListener('click', () => {
          const text = editor && editor.value ? editor.value : '';
          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'document.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
        el.appendChild(exportBtn);
      } catch (e) {
        console.error('PrintSettings gadget failed:', e);
        try {
          el.textContent = '印刷設定ガジェットの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['assist'], title: 'エクスポート' },
  );

  // (removed) legacy EditorLayout gadget (replaced by new implementation at bottom)

  // SnapshotManager gadget (バックアップ管理)
  ZWGadgets.register(
    'SnapshotManager',
    function (el) {
      try {
        var storage = window.ZenWriterStorage;
        var editorManager = window.ZenWriterEditor;
        if (!storage || !storage.loadSnapshots) {
          var warn = document.createElement('p');
          warn.style.opacity = '0.7';
          warn.textContent = 'バックアップ機能を利用できません。';
          el.appendChild(warn);
          return;
        }
        var wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '8px';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = '今すぐ保存';
        btn.addEventListener('click', function () {
          try {
            var content =
              editorManager && editorManager.editor
                ? editorManager.editor.value || ''
                : storage.loadContent
                  ? storage.loadContent()
                  : '';
            storage.addSnapshot(content);
            if (
              editorManager &&
              typeof editorManager.showNotification === 'function'
            )
              editorManager.showNotification('バックアップを保存しました');
            renderList();
          } catch (e) {}
        });
        var listEl = document.createElement('div');
        listEl.className = 'snapshot-list';
        wrap.appendChild(btn);
        wrap.appendChild(listEl);
        el.appendChild(wrap);

        function fmt(ts) {
          var d = new Date(ts);
          var p = function (n) {
            return String(n).padStart(2, '0');
          };
          return (
            d.getFullYear() +
            '-' +
            p(d.getMonth() + 1) +
            '-' +
            p(d.getDate()) +
            ' ' +
            p(d.getHours()) +
            ':' +
            p(d.getMinutes()) +
            ':' +
            p(d.getSeconds())
          );
        }
        function renderList() {
          var list = storage.loadSnapshots() || [];
          listEl.innerHTML = '';
          if (!list.length) {
            var empty = document.createElement('div');
            empty.style.opacity = '0.7';
            empty.textContent = 'バックアップはありません';
            listEl.appendChild(empty);
            return;
          }
          list.forEach(function (s) {
            var row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.gap = '6px';
            row.style.margin = '4px 0';
            var meta = document.createElement('div');
            meta.textContent = fmt(s.ts) + ' / ' + s.len + ' 文字';
            var actions = document.createElement('div');
            var restore = document.createElement('button');
            restore.className = 'small';
            restore.textContent = '復元';
            restore.addEventListener('click', function () {
              if (
                confirm(
                  'このバックアップで本文を置き換えます。よろしいですか？',
                )
              ) {
                if (
                  editorManager &&
                  typeof editorManager.setContent === 'function'
                ) {
                  editorManager.setContent(s.content || '');
                  if (editorManager.showNotification)
                    editorManager.showNotification(
                      'バックアップから復元しました',
                    );
                }
              }
            });
            var del = document.createElement('button');
            del.className = 'small';
            del.textContent = '削除';
            del.addEventListener('click', function () {
              storage.deleteSnapshot(s.id);
              renderList();
            });
            actions.appendChild(restore);
            actions.appendChild(del);
            row.appendChild(meta);
            row.appendChild(actions);
            listEl.appendChild(row);
          });
        }
        renderList();
      } catch (e) {
        try {
          el.textContent = 'スナップショットの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['structure'], title: 'バックアップ' },
  );

  // ChoiceTools gadget（選択肢ツール）
  ZWGadgets.register(
    'ChoiceTools',
    function (el) {
      try {
        var ed = window.ZenWriterEditor;
        var wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.flexWrap = 'wrap';
        wrap.style.gap = '6px';
        function makeBtn(text, handler) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'small';
          b.textContent = text;
          b.addEventListener('click', handler);
          return b;
        }
        function insertChoice() {
          if (!ed || typeof ed.insertTextAtCursor !== 'function') return;
          var tpl = [
            '',
            '[choice title="選択肢"]',
            '- [> 選択肢1](#label1)',
            '- [> 選択肢2](#label2)',
            '[/choice]',
            '',
          ].join('\n');
          ed.insertTextAtCursor(tpl);
          if (ed.showNotification)
            ed.showNotification('選択肢ブロックを挿入しました');
        }
        function insertLabel() {
          if (!ed || typeof ed.insertTextAtCursor !== 'function') return;
          var name = prompt('ラベルIDを入力', 'label1');
          if (name === null) return;
          var tpl = [
            '',
            '[label id="' + String((name || 'label1').trim()) + '"]',
            '',
            '[/label]',
            '',
          ].join('\n');
          ed.insertTextAtCursor(tpl);
          if (ed.showNotification) ed.showNotification('ラベルを挿入しました');
        }
        function insertJump() {
          if (!ed || typeof ed.insertTextAtCursor !== 'function') return;
          var to = prompt('ジャンプ先ラベルIDを入力', 'label1');
          if (to === null) return;
          var tpl = '\n[jump to="' + String((to || 'label1').trim()) + '"]\n';
          ed.insertTextAtCursor(tpl);
          if (ed.showNotification)
            ed.showNotification('ジャンプを挿入しました');
        }
        wrap.appendChild(makeBtn('選択肢ブロック', insertChoice));
        wrap.appendChild(makeBtn('ラベル', insertLabel));
        wrap.appendChild(makeBtn('ジャンプ', insertJump));
        el.appendChild(wrap);
      } catch (e) {
        try {
          el.textContent = '選択肢ツールの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['assist'], title: '選択肢' },
  );

  // Images gadget (insert/list/remove)
  ZWGadgets.register(
    'Images',
    function (el) {
      try {
        var API = window.ZenWriterImages;
        var root = document.createElement('div');
        root.style.display = 'grid';
        root.style.gap = '6px';

        var urlRow = document.createElement('div');
        var urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.placeholder = '画像URLを入力';
        var addUrlBtn = document.createElement('button');
        addUrlBtn.type = 'button';
        addUrlBtn.className = 'small';
        addUrlBtn.textContent = 'URL追加';
        urlRow.appendChild(urlInput);
        urlRow.appendChild(addUrlBtn);

        var fileRow = document.createElement('div');
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileRow.appendChild(fileInput);

        var list = document.createElement('div');
        list.style.display = 'grid';
        list.style.gap = '6px';

        function renderList() {
          try {
            list.innerHTML = '';
            var images =
              API && typeof API._load === 'function' ? API._load() : [];
            images.forEach(function (it) {
              var row = document.createElement('div');
              row.style.display = 'flex';
              row.style.alignItems = 'center';
              row.style.gap = '8px';
              var thumb = document.createElement('img');
              thumb.src = it.src;
              thumb.alt = it.alt || '';
              thumb.style.width = '40px';
              thumb.style.height = '40px';
              thumb.style.objectFit = 'cover';
              thumb.style.border = '1px solid var(--border-color)';
              var name = document.createElement('div');
              name.textContent = it.alt || it.id || '(image)';
              name.style.flex = '1 1 auto';
              name.style.fontSize = '12px';
              name.style.opacity = '0.8';
              var rm = document.createElement('button');
              rm.type = 'button';
              rm.className = 'small';
              rm.textContent = '削除';
              rm.addEventListener('click', function () {
                try {
                  API && API.remove && API.remove(it.id);
                  renderList();
                } catch (_) {}
              });
              row.appendChild(thumb);
              row.appendChild(name);
              row.appendChild(rm);
              list.appendChild(row);
            });
          } catch (_) {}
        }

        addUrlBtn.addEventListener('click', function () {
          var val = (urlInput.value || '').trim();
          if (!val) return;
          try {
            API && API.addFromUrl && API.addFromUrl(val);
            urlInput.value = '';
            renderList();
          } catch (_) {}
        });
        fileInput.addEventListener('change', function () {
          try {
            var f = fileInput.files && fileInput.files[0];
            if (f && API && API.addFromFile) {
              API.addFromFile(f);
              fileInput.value = '';
              renderList();
            }
          } catch (_) {}
        });

        root.appendChild(urlRow);
        root.appendChild(fileRow);
        root.appendChild(list);
        el.appendChild(root);

        renderList();
        try {
          window.addEventListener('ZWDocumentsChanged', renderList);
        } catch (_) {}
      } catch (e) {
        try {
          el.textContent = '画像ガジェットの初期化に失敗しました。';
        } catch (_) {}
      }
    },
    { groups: ['assist'], title: '画像' },
  );

  // EditorLayout settings UI
  ZWGadgets.registerSettings('EditorLayout', function (el, ctx) {
    try {
      var makeRow = function (labelText, control) {
        var row = document.createElement('label');
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '4px';
        row.textContent = labelText;
        row.appendChild(control);
        return row;
      };

      // Width slider
      var widthInput = document.createElement('input');
      widthInput.type = 'range';
      widthInput.min = '600';
      widthInput.max = '2000';
      widthInput.step = '50';
      widthInput.value = ctx.get('width', 900);
      var widthLabel = document.createElement('div');
      widthLabel.textContent = '幅: ' + widthInput.value + 'px';
      widthLabel.style.fontSize = '0.85rem';
      widthLabel.style.opacity = '0.8';
      widthInput.addEventListener('input', function () {
        widthLabel.textContent = '幅: ' + widthInput.value + 'px';
        ctx.set('width', parseInt(widthInput.value, 10));
      });
      widthInput.addEventListener('change', function () {
        ctx.set('width', parseInt(widthInput.value, 10));
      });
      var widthRow = document.createElement('div');
      widthRow.style.display = 'flex';
      widthRow.style.flexDirection = 'column';
      widthRow.style.gap = '4px';
      widthRow.appendChild(widthLabel);
      widthRow.appendChild(widthInput);
      el.appendChild(widthRow);

      // Padding X slider
      var paddingInput = document.createElement('input');
      paddingInput.type = 'range';
      paddingInput.min = '0';
      paddingInput.max = '200';
      paddingInput.step = '10';
      paddingInput.value = ctx.get('paddingX', 100);
      var paddingLabel = document.createElement('div');
      paddingLabel.textContent = '左右余白: ' + paddingInput.value + 'px';
      paddingLabel.style.fontSize = '0.85rem';
      paddingLabel.style.opacity = '0.8';
      paddingInput.addEventListener('input', function () {
        paddingLabel.textContent = '左右余白: ' + paddingInput.value + 'px';
        ctx.set('paddingX', parseInt(paddingInput.value, 10));
      });
      paddingInput.addEventListener('change', function () {
        ctx.set('paddingX', parseInt(paddingInput.value, 10));
      });
      var paddingRow = document.createElement('div');
      paddingRow.style.display = 'flex';
      paddingRow.style.flexDirection = 'column';
      paddingRow.style.gap = '4px';
      paddingRow.appendChild(paddingLabel);
      paddingRow.appendChild(paddingInput);
      el.appendChild(paddingRow);

      // Border checkbox
      var borderRow = document.createElement('label');
      borderRow.style.display = 'flex';
      borderRow.style.alignItems = 'center';
      borderRow.style.gap = '6px';
      var borderCb = document.createElement('input');
      borderCb.type = 'checkbox';
      borderCb.checked = !!ctx.get('showBorder', false);
      var borderTxt = document.createElement('span');
      borderTxt.textContent = '枠線を表示';
      borderCb.addEventListener('change', function () {
        ctx.set('showBorder', !!borderCb.checked);
      });
      borderRow.appendChild(borderCb);
      borderRow.appendChild(borderTxt);
      el.appendChild(borderRow);
    } catch (e) {
      console.error('EditorLayout settings failed:', e);
    }
  });

  // Default gadget: Clock
  ZWGadgets.register('Clock', function (el, api) {
    try {
      var time = document.createElement('div');
      time.className = 'gadget-clock';
      el.appendChild(time);
      function tick() {
        try {
          var d = new Date();
          var z = function (n) {
            return (n < 10 ? '0' : '') + n;
          };
          var hour24 =
            api && typeof api.get === 'function'
              ? !!api.get('hour24', true)
              : true;
          var h = d.getHours();
          var ap = '';
          if (!hour24) {
            ap = h >= 12 ? ' PM' : ' AM';
            h = h % 12;
            if (h === 0) h = 12;
          }
          var s =
            d.getFullYear() +
            '-' +
            z(d.getMonth() + 1) +
            '-' +
            z(d.getDate()) +
            ' ' +
            (hour24 ? z(h) : h < 10 ? ' ' + h : h) +
            ':' +
            z(d.getMinutes()) +
            ':' +
            z(d.getSeconds()) +
            (hour24 ? '' : ap);
          time.textContent = s;
        } catch (_) {}
      }
      tick();
      var id = setInterval(tick, 1000);
      try {
        el.addEventListener('removed', function () {
          clearInterval(id);
        });
      } catch (_) {}
      try {
        window.addEventListener(
          'beforeunload',
          function () {
            clearInterval(id);
          },
          { once: true },
        );
      } catch (_) {}
    } catch (_) {}
  });

  // Clock settings UI
  ZWGadgets.registerSettings('Clock', function (el, ctx) {
    try {
      var row = document.createElement('label');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '6px';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!ctx.get('hour24', true);
      var txt = document.createElement('span');
      txt.textContent = '24時間表示';
      cb.addEventListener('change', function () {
        try {
          ctx.set('hour24', !!cb.checked);
        } catch (_) {}
      });
      row.appendChild(cb);
      row.appendChild(txt);
      el.appendChild(row);
    } catch (_) {}
  });

  ZWGadgets.addTab = function (name, label, containerId) {
    try {
      var tabsEl = document.getElementById('sidebar-tabs');
      var groupsEl = document.getElementById('sidebar-groups');
      if (!tabsEl || !groupsEl) return false;

      // タブボタン追加
      var tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = 'sidebar-tab';
      tabBtn.setAttribute('data-tab', name);
      tabBtn.textContent = label;
      tabBtn.addEventListener('click', function () {
        var tabs = tabsEl.querySelectorAll('.sidebar-tab');
        tabs.forEach(function (t) {
          t.classList.remove('active');
        });
        var groups = groupsEl.querySelectorAll('.sidebar-group');
        groups.forEach(function (g) {
          g.classList.remove('active');
          g.setAttribute('aria-hidden', 'true');
        });
        tabBtn.classList.add('active');
        var targetGroup = groupsEl.querySelector('[data-group="' + name + '"]');
        if (targetGroup) {
          targetGroup.classList.add('active');
          targetGroup.setAttribute('aria-hidden', 'false');
        }
      });
      tabsEl.appendChild(tabBtn);

      // グループ追加
      var groupEl = document.createElement('section');
      groupEl.className = 'sidebar-group';
      groupEl.setAttribute('data-group', name);
      groupEl.setAttribute('aria-hidden', 'true');
      var section = document.createElement('div');
      section.className = 'sidebar-section';
      var panel = document.createElement('div');
      panel.className = 'gadgets-panel';
      panel.setAttribute('data-gadget-group', name);
      panel.setAttribute('aria-label', label + 'ガジェット');
      section.appendChild(panel);
      groupEl.appendChild(section);
      groupsEl.appendChild(groupEl);

      return true;
    } catch (e) {
      console.error('addTab failed', e);
      return false;
    }
  };

  ZWGadgets.removeTab = function (name) {
    try {
      var tabsEl = document.getElementById('sidebar-tabs');
      var groupsEl = document.getElementById('sidebar-groups');
      if (!tabsEl || !groupsEl) return false;

      var tabBtn = tabsEl.querySelector('[data-tab="' + name + '"]');
      if (tabBtn) tabBtn.remove();

      var groupEl = groupsEl.querySelector('[data-group="' + name + '"]');
      if (groupEl) groupEl.remove();

      return true;
    } catch (e) {
      console.error('removeTab failed', e);
      return false;
    }
  };
  ready(function () {
    try {
      loadLoadouts();
    } catch (_) {}
    try {
      ZWGadgets.init('#structure-gadgets-panel', { group: 'structure' });
    } catch (_) {}
    try {
      ZWGadgets.init('#typography-gadgets-panel', { group: 'typography' });
    } catch (_) {}
    try {
      ZWGadgets.init('#gadgets-panel', { group: 'assist' });
    } catch (_) {}
    // Wire Loadout UI (one-time binding guard)
    try {
      if (window.__ZW_LOADOUT_UI_BOUND__) {
        /* already bound */
      } else {
        window.__ZW_LOADOUT_UI_BOUND__ = true;
      }
      if (window.__ZW_LOADOUT_UI_BOUND_INIT_DONE__) return; // prevent double handlers
      window.__ZW_LOADOUT_UI_BOUND_INIT_DONE__ = true;
      var $sel = document.getElementById('loadout-select');
      var $name = document.getElementById('loadout-name');
      var $save = document.getElementById('loadout-save');
      var $apply = document.getElementById('loadout-apply');
      var $dup = document.getElementById('loadout-duplicate');
      var $del = document.getElementById('loadout-delete');

      function refreshLoadoutUI(activeName) {
        try {
          var items = ZWGadgets.listLoadouts ? ZWGadgets.listLoadouts() : [];
          if ($sel) {
            $sel.innerHTML = '';
            items.forEach(function (it) {
              var opt = document.createElement('option');
              opt.value = it.name;
              opt.textContent = it.label || it.name;
              $sel.appendChild(opt);
            });
            var active =
              (ZWGadgets.getActiveLoadout &&
                ZWGadgets.getActiveLoadout().name) ||
              (items[0] && items[0].name) ||
              '';
            $sel.value = activeName || active || '';
          }
          if ($name) {
            try {
              var cur = ZWGadgets.getActiveLoadout
                ? ZWGadgets.getActiveLoadout()
                : null;
              $name.value = (cur && cur.label) || '';
            } catch (_) {}
          }
        } catch (_) {}
      }

      if ($save) {
        $save.addEventListener('click', function () {
          try {
            var nm = (($name && $name.value) || '').trim();
            if (!nm) {
              alert('ロードアウト名を入力してください');
              return;
            }
            var captured = ZWGadgets.captureCurrentLoadout
              ? ZWGadgets.captureCurrentLoadout(nm)
              : null;
            if (!captured) {
              alert('現在の構成を取得できませんでした');
              return;
            }
            ZWGadgets.defineLoadout(nm, captured);
            ZWGadgets.applyLoadout(nm);
            refreshLoadoutUI(nm);
          } catch (e) {
            console.error('save loadout failed', e);
          }
        });
      }
      if ($apply) {
        $apply.addEventListener('click', function () {
          try {
            if ($sel && $sel.value) {
              ZWGadgets.applyLoadout($sel.value);
              refreshLoadoutUI($sel.value);
            }
          } catch (_) {}
        });
      }
      if ($dup) {
        $dup.addEventListener('click', function () {
          try {
            if (!$sel || !$sel.value) {
              alert('複製元のロードアウトを選択してください');
              return;
            }
            var base = $sel.value;
            var cur = ZWGadgets.getActiveLoadout
              ? ZWGadgets.getActiveLoadout()
              : null;
            // 現在の配置を採取して別名保存（UI入力があればそれを使う）
            var nm = (($name && $name.value) || base + ' copy').trim();
            if (!nm) {
              alert('複製先の名前を入力してください');
              return;
            }
            // いったん対象を適用→現構成を採取→別名定義
            ZWGadgets.applyLoadout(base);
            var captured = ZWGadgets.captureCurrentLoadout
              ? ZWGadgets.captureCurrentLoadout(nm)
              : null;
            if (!captured) {
              alert('ロードアウトの採取に失敗しました');
              return;
            }
            ZWGadgets.defineLoadout(nm, captured);
            ZWGadgets.applyLoadout(nm);
            refreshLoadoutUI(nm);
          } catch (e) {
            console.error('duplicate loadout failed', e);
          }
        });
      }
      if ($del) {
        $del.addEventListener('click', function () {
          try {
            if ($sel && $sel.value) {
              var active = ZWGadgets.getActiveLoadout
                ? ZWGadgets.getActiveLoadout().name
                : '';
              if ($sel.value === active) {
                alert('アクティブなロードアウトは削除できません');
                return;
              }
              if (!confirm('選択中のロードアウトを削除しますか？')) return;
              // 選択値を即時に退避してから削除を実行（UI再描画による値変化を防止）
              var toDelete = String($sel.value);
              ZWGadgets.deleteLoadout(toDelete);
              refreshLoadoutUI(active);
            }
          } catch (e) {
            console.error('delete loadout failed', e);
          }
        });
      }
      // 初期描画
      refreshLoadoutUI();
      // 状態変化時に更新
      window.addEventListener('ZWLoadoutsChanged', function () {
        refreshLoadoutUI();
      });
      window.addEventListener('ZWLoadoutApplied', function () {
        refreshLoadoutUI();
      });
      window.addEventListener('ZWLoadoutDeleted', function () {
        refreshLoadoutUI();
      });
    } catch (_) {}

    emit('ZWGadgetsReady', {
      loadout: ZWGadgets.getActiveLoadout ? ZWGadgets.getActiveLoadout() : null,
    });
    // Wire import/export controls if present
    try {
      var expBtn = document.getElementById('gadget-export');
      var impBtn = document.getElementById('gadget-import');
      var inp = document.getElementById('gadget-prefs-input');
      if (expBtn) {
        expBtn.addEventListener('click', function () {
          try {
            var json = ZWGadgets.exportPrefs();
            var blob = new Blob([json], {
              type: 'application/json;charset=utf-8',
            });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            var d = new Date();
            var pad = function (n) {
              return (n < 10 ? '0' : '') + n;
            };
            var name =
              'gadgets_prefs_' +
              d.getFullYear() +
              pad(d.getMonth() + 1) +
              pad(d.getDate()) +
              '_' +
              pad(d.getHours()) +
              pad(d.getMinutes()) +
              pad(d.getSeconds()) +
              '.json';
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () {
              URL.revokeObjectURL(url);
            }, 0);
          } catch (e) {
            /* ignore */
          }
        });
      }
      if (impBtn && inp) {
        impBtn.addEventListener('click', function () {
          try {
            inp.click();
          } catch (_) {}
        });
        inp.addEventListener('change', function (ev) {
          try {
            var file = ev.target && ev.target.files && ev.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () {
              try {
                var ok = ZWGadgets.importPrefs(String(reader.result || ''));
                if (!ok) {
                  console.warn('Import failed: invalid file');
                }
              } catch (e) {
                console.warn('Import failed:', e);
              }
              try {
                inp.value = '';
              } catch (_) {}
            };
            reader.onerror = function () {
              try {
                inp.value = '';
              } catch (_) {}
            };
            reader.readAsText(file, 'utf-8');
          } catch (_) {
            try {
              inp.value = '';
            } catch (__) {}
          }
        });
      }
    } catch (_) {}
  });

})();
