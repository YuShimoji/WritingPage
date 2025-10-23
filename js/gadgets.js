(function(){
  'use strict';

  function clone(obj){
    try { return JSON.parse(JSON.stringify(obj)); } catch(_) { return {}; }
  }

  function uniquePush(arr, item){
    if (arr.indexOf(item) < 0) arr.push(item);
  }

  function emit(eventName, detail){
    try { window.dispatchEvent(new CustomEvent(eventName, { detail: detail || {} })); } catch(_) {}
  }

  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
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
          structure: ['Documents','Outline'],
          typography: ['TypographyThemes','EditorLayout'],
          assist: ['Clock','HUDSettings']
        }
      },
      'vn-layout': {
        label: 'ビジュアルノベル',
        groups: {
          structure: ['Documents','Outline'],
          typography: ['TypographyThemes','EditorLayout'],
          assist: ['Clock','HUDSettings']
        }
      }
    }
  };
  var loadoutState = null;

  function normalizeLoadouts(raw){
    var data = raw && typeof raw === 'object' ? clone(raw) : clone(DEFAULT_LOADOUTS);
    var entries = data.entries && typeof data.entries === 'object' ? data.entries : {};
    var normalizedEntries = {};
    Object.keys(entries).forEach(function(key){
      var entry = entries[key] || {};
      normalizedEntries[key] = {
        label: entry.label || key,
        groups: normaliseGroups(entry.groups || {})
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
      entries: normalizedEntries
    };
  }

  function loadPrefs(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var p = raw ? JSON.parse(raw) : null;
      if (!p || typeof p !== 'object') p = { order: [], collapsed: {}, settings: {} };
      if (!Array.isArray(p.order)) p.order = [];
      if (!p.collapsed || typeof p.collapsed !== 'object') p.collapsed = {};
      if (!p.settings || typeof p.settings !== 'object') p.settings = {};
      return p;
    } catch(_) { return { order: [], collapsed: {}, settings: {} }; }
  }
  function savePrefs(p){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p||{})); } catch(_) {}
  }

  function normalizeList(list){
    var out = [];
    if (!Array.isArray(list)) return out;
    for (var i=0;i<list.length;i++){
      var name = list[i];
      if (typeof name !== 'string') continue;
      var trimmed = name.trim();
      if (!trimmed) continue;
      uniquePush(out, trimmed);
    }
    return out;
  }

  function normaliseGroups(groups){
    var g = groups && typeof groups === 'object' ? groups : {};
    return {
      structure: normalizeList(g.structure || []),
      typography: normalizeList(g.typography || []),
      assist: normalizeList(g.assist || [])
    };
  }

  function loadLoadouts(){
    try {
      var raw = localStorage.getItem(LOADOUT_KEY);
      loadoutState = normalizeLoadouts(raw ? JSON.parse(raw) : null);
      return loadoutState;
    } catch(_) {
      loadoutState = clone(DEFAULT_LOADOUTS);
      return loadoutState;
    }
  }

  function saveLoadouts(data){
    try {
      loadoutState = normalizeLoadouts(data);
      localStorage.setItem(LOADOUT_KEY, JSON.stringify(loadoutState));
      emit('ZWLoadoutsChanged', { loadouts: loadoutState });
    } catch(_) {}
  }

  var ZWGadgets = {
    _list: [],
    _settings: {},
    _renderers: {},
    _roots: {},
    _loadouts: null,
    _activeGroup: 'assist',
    _defaults: {},
    _ensureLoadouts: function(){
      if (!this._loadouts) this._loadouts = loadLoadouts();
      return this._loadouts;
    },
    _applyLoadoutEntry: function(entry){
      var map = {};
      entry = entry || { groups: { structure: [], typography: [], assist: [] } };
      Object.keys(entry.groups || {}).forEach(function(group){
        var items = entry.groups[group] || [];
        for (var i=0;i<items.length;i++){
          var name = items[i];
          if (!map[name]) map[name] = [];
          if (map[name].indexOf(group) < 0) map[name].push(group);
        }
      });
      for (var j=0; j<this._list.length; j++){
        var item = this._list[j];
        var fallback = this._defaults[item.name] ? this._defaults[item.name].slice() : ['assist'];
        item.groups = map[item.name] ? map[item.name].slice() : fallback;
      }
    },
    _getActiveEntry: function(){
      var data = this._ensureLoadouts();
      return data.entries[data.active] || { groups: normaliseGroups({}) };
    },
    _getActiveNames: function(){
      var entry = this._getActiveEntry();
      var names = [];
      ['structure','typography','assist'].forEach(function(key){
        var list = entry.groups && entry.groups[key];
        if (Array.isArray(list)) {
          list.forEach(function(n){ if (typeof n === 'string' && n && names.indexOf(n) < 0) names.push(n); });
        }
      });
      if (!names.length) {
        names = this._list.map(function(g){ return g.name || ''; }).filter(Boolean);
      }
      return names;
    },
    register: function(name, factory, options){
      try {
        var safeName = String(name || '');
        if (!safeName) return;
        var opts = options && typeof options === 'object' ? options : {};
        var entry = {
          name: safeName,
          title: opts.title || safeName,
          factory: factory,
          groups: normalizeList(opts.groups || ['assist'])
        };
        if (!entry.groups.length) entry.groups = ['assist'];
        this._defaults[safeName] = entry.groups.slice();
        this._list.push(entry);
      } catch(_) {}
    },
    registerSettings: function(name, factory){
      try { this._settings[String(name||'')] = factory; } catch(_) {}
    },
    defineLoadout: function(name, config){
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
      try { this._renderLast && this._renderLast(); } catch(_) {}
    },
    listLoadouts: function(){
      var data = this._ensureLoadouts();
      return Object.keys(data.entries).map(function(key){
        var entry = data.entries[key] || {};
        return { name: key, label: entry.label || key };
      });
    },
    applyLoadout: function(name){
      var data = this._ensureLoadouts();
      if (!name || !data.entries[name]) return false;
      data.active = name;
      saveLoadouts(data);
      this._loadouts = loadLoadouts();
      this._applyLoadoutEntry(this._loadouts.entries[name]);
      try { this._renderLast && this._renderLast(); } catch(_) {}
      emit('ZWLoadoutApplied', { name: name });
      return true;
    },
    deleteLoadout: function(name){
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
      try { this._renderLast && this._renderLast(); } catch(_) {}
      emit('ZWLoadoutDeleted', { name: name });
      return true;
    },
    getActiveLoadout: function(){
      var data = this._ensureLoadouts();
      var entry = data.entries[data.active] || {};
      this._applyLoadoutEntry(entry);
      return {
        name: data.active,
        label: entry.label || data.active,
        entry: clone(entry)
      };
    },
    captureCurrentLoadout: function(label){
      var groups = { structure: [], typography: [], assist: [] };
      var roots = this._roots || {};
      var self = this;
      Object.keys(roots).forEach(function(group){
        var root = roots[group];
        if (!root) return;
        var nodes = root.querySelectorAll('.gadget');
        for (var i=0; i<nodes.length; i++){
          var name = nodes[i].dataset && nodes[i].dataset.name;
          if (!name) continue;
          if (!groups[group]) groups[group] = [];
          uniquePush(groups[group], name);
        }
      });
      Object.keys(groups).forEach(function(key){
        groups[key] = normalizeList(groups[key] || []);
      });
      var active = this.getActiveLoadout();
      return {
        label: label || (active && active.label) || '',
        groups: groups
      };
    },
    setActiveGroup: function(group){
      if (!group) return;
      this._activeGroup = group;
      emit('ZWLoadoutGroupChanged', { group: group });
      try { this._renderLast && this._renderLast(); } catch(_) {}
    },
    assignGroups: function(name, groups){
      if (!name) return;
      var normalized = normalizeList(groups || ['assist']);
      if (!normalized.length) normalized = ['assist'];
      for (var i=0; i<this._list.length; i++){
        if ((this._list[i].name || '') === name){
          this._list[i].groups = normalized;
          break;
        }
      }
      try { this._renderLast && this._renderLast(); } catch(_) {}
    },
    getPrefs: function(){ return loadPrefs(); },
    setPrefs: function(p){ savePrefs(p||{ order: [], collapsed: {}, settings: {} }); try { this._renderLast && this._renderLast(); } catch(_) {} },
    getSettings: function(name){ try { var p = loadPrefs(); return (p.settings && p.settings[name]) || {}; } catch(_) { return {}; } },
    setSetting: function(name, key, value){
      try {
        var p = loadPrefs();
        p.settings = p.settings || {};
        var s = p.settings[name] = p.settings[name] || {};
        s[key] = value;
        savePrefs(p);
        // NOTE: 再レンダリングは行わない。購読しているガジェットが即時に反映する。
        var detail = { name: name, key: key, value: value, settings: s };
        try { window.dispatchEvent(new CustomEvent('ZWGadgetSettingsChanged', { detail: detail })); } catch(_) {}
        try { window.dispatchEvent(new CustomEvent('ZWGadgetSettingsChanged:' + name, { detail: detail })); } catch(_) {}
      } catch(_) {}
    },
    exportPrefs: function(){
      try {
        var p = loadPrefs();
        return JSON.stringify(p || { order: [], collapsed: {}, settings: {} }, null, 2);
      } catch(_) { return '{}'; }
    },
    importPrefs: function(obj){
      try {
        var p = obj;
        if (typeof obj === 'string') { try { p = JSON.parse(obj); } catch(e){ return false; } }
        if (!p || typeof p !== 'object') return false;
        if (!Array.isArray(p.order)) p.order = [];
        if (!p.collapsed || typeof p.collapsed !== 'object') p.collapsed = {};
        if (!p.settings || typeof p.settings !== 'object') p.settings = {};
        savePrefs({ order: p.order, collapsed: p.collapsed, settings: p.settings });
        try { this._renderLast && this._renderLast(); } catch(_) {}
        return true;
      } catch(_) { return false; }
    },
    move: function(name, dir){
      try {
        var p = loadPrefs();
        var names = this._list.map(function(x){ return x.name||''; });
        // build effective order
        var eff = [];
        for (var i=0;i<p.order.length;i++){ if (names.indexOf(p.order[i])>=0 && eff.indexOf(p.order[i])<0) eff.push(p.order[i]); }
        for (var j=0;j<names.length;j++){ if (eff.indexOf(names[j])<0) eff.push(names[j]); }
        var idx = eff.indexOf(name);
        if (idx<0) return;
        if (dir==='up' && idx>0){ var t=eff[idx-1]; eff[idx-1]=eff[idx]; eff[idx]=t; }
        if (dir==='down' && idx<eff.length-1){ var t2=eff[idx+1]; eff[idx+1]=eff[idx]; eff[idx]=t2; }
        p.order = eff;
        savePrefs(p);
        try { this._renderLast && this._renderLast(); } catch(_) {}
      } catch(_) {}
    },
    toggle: function(name){
      try {
        var p = loadPrefs();
        p.collapsed = p.collapsed || {};
        p.collapsed[name] = !p.collapsed[name];
        savePrefs(p);
        try { this._renderLast && this._renderLast(); } catch(_) {}
      } catch(_) {}
    },
    init: function(selector, options){
      var self = this;
      var opts = options && typeof options === 'object' ? options : {};
      var sel = selector || '#gadgets-panel';
      var root = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!root) return;
      var group = opts.group || 'assist';
      this._roots[group] = root;
      if (!this._activeGroup) this._activeGroup = group;

      // Tab inter-move support
      root.addEventListener('dragover', function(ev){
        try {
          ev.preventDefault();
          ev.dataTransfer.dropEffect = 'move';
          root.classList.add('drag-over-tab');
        } catch(_) {}
      });
      root.addEventListener('dragleave', function(){
        try { root.classList.remove('drag-over-tab'); } catch(_) {}
      });
      root.addEventListener('drop', function(ev){
        try {
          ev.preventDefault();
          root.classList.remove('drag-over-tab');
          var name = ev.dataTransfer.getData('text/gadget-name');
          if (!name) return;
          // Assign to this group
          var currentGroups = self._list.find(function(g){ return g.name === name; });
          if (!currentGroups) return;
          var newGroups = [group];
          self.assignGroups(name, newGroups);
          self._renderLast && self._renderLast();
        } catch(_) {}
      });

      var data = this._ensureLoadouts();
      this._applyLoadoutEntry(data.entries[data.active]);

      function render(){
        var activeGroup = self._activeGroup || 'assist';
        if (activeGroup !== group){
          root.setAttribute('data-gadgets-hidden', 'true');
          while (root.firstChild) root.removeChild(root.firstChild);
          return;
        }
        root.removeAttribute('data-gadgets-hidden');

        var allowedNamesAll = self._getActiveNames();
        var allowedNames = allowedNamesAll.filter(function(name){
          for (var idx = 0; idx < self._list.length; idx++){
            var item = self._list[idx];
            if ((item.name || '') === name && Array.isArray(item.groups) && item.groups.indexOf(group) >= 0){
              return true;
            }
          }
          return false;
        });
        if (!allowedNames.length) {
          allowedNames = self._list
            .filter(function(item){ return Array.isArray(item.groups) && item.groups.indexOf(group) >= 0; })
            .map(function(item){ return item.name || ''; })
            .filter(Boolean);
        }
        var allowedSet = {};
        for (var ai = 0; ai < allowedNames.length; ai++){ allowedSet[allowedNames[ai]] = true; }

        function buildOrder(){
          var p = loadPrefs();
          var names = self._list
            .filter(function(x){ return Array.isArray(x.groups) && x.groups.indexOf(group) >= 0 && allowedSet[x.name||'']; })
            .map(function(x){ return x.name||''; });
          var eff = [];
          for (var i=0;i<p.order.length;i++){ var n = p.order[i]; if (allowedSet[n] && eff.indexOf(n)<0) eff.push(n); }
          for (var j=0;j<names.length;j++){ if (eff.indexOf(names[j])<0) eff.push(names[j]); }
          return { order: eff, prefs: p };
        }

        var state = buildOrder();
        var order = state.order, prefs = state.prefs;
        while (root.firstChild) root.removeChild(root.firstChild);
        for (var k=0; k<order.length; k++){
          var name = order[k];
          if (!allowedSet[name]) continue;
          var g = null;
          for (var t=0; t<self._list.length; t++){ if ((self._list[t].name||'')===name){ g=self._list[t]; break; } }
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
            head.setAttribute('draggable', 'true');
            var title = document.createElement('h4'); title.className='gadget-title'; title.textContent = g.title || name;
            var upBtn = document.createElement('button'); upBtn.type='button'; upBtn.className='gadget-move-up small'; upBtn.textContent='↑'; upBtn.title='上へ';
            var downBtn = document.createElement('button'); downBtn.type='button'; downBtn.className='gadget-move-down small'; downBtn.textContent='↓'; downBtn.title='下へ';
            var settingsBtn = null;
            if (self._settings[name]){
              settingsBtn = document.createElement('button');
              settingsBtn.type='button'; settingsBtn.className='gadget-settings-btn small'; settingsBtn.title='設定'; settingsBtn.textContent='⚙';
            }
            // 削除ボタン（現在のタブから除外）
            var removeBtn = document.createElement('button');
            removeBtn.type='button'; removeBtn.className='gadget-remove-btn small'; removeBtn.title='削除'; removeBtn.textContent='✕';
            head.appendChild(title);
            if (settingsBtn) head.appendChild(settingsBtn);
            head.appendChild(upBtn); head.appendChild(downBtn);
            head.appendChild(removeBtn);
            // styles moved to CSS (.gadget-head)
            wrap.appendChild(head);

            var body = document.createElement('div');
            body.className = 'gadget-body';
            wrap.appendChild(body);
            if (typeof g.factory === 'function') {
              try {
                var api = {
                  get: function(key, d){ var s = self.getSettings(name); return (key in s) ? s[key] : d; },
                  set: function(key, val){ self.setSetting(name, key, val); },
                  prefs: function(){ return self.getPrefs(); },
                  refresh: function(){ try { self._renderLast && self._renderLast(); } catch(_) {} }
                };
                g.factory(body, api);
              } catch(e){ /* ignore gadget error */ }
            }

            // events

            upBtn.addEventListener('click', function(n, w){ return function(){ 
              try {
                w.classList.add('moving-up');
                setTimeout(function(){
                  self.move(n, 'up');
                  setTimeout(function(){ w.classList.remove('moving-up'); }, 220);
                }, 180);
              } catch(_) {}
            }; }(name, wrap));
            downBtn.addEventListener('click', function(n, w){ return function(){ 
              try {
                w.classList.add('moving-down');
                setTimeout(function(){
                  self.move(n, 'down');
                  setTimeout(function(){ w.classList.remove('moving-down'); }, 220);
                }, 180);
              } catch(_) {}
            }; }(name, wrap));

            // settings panel
            if (settingsBtn){
              var panel = document.createElement('div'); panel.className='gadget-settings'; panel.style.display='none';
              wrap.appendChild(panel);
              settingsBtn.addEventListener('click', function(n, p, btn){ return function(){
                try {
                  var visible = p.style.display !== 'none';
                  p.style.display = visible ? 'none' : '';
                  if (!visible){
                    // render settings lazily
                    try {
                      p.innerHTML = '';
                      var sApi = {
                        get: function(key, d){ var s = self.getSettings(n); return (key in s) ? s[key] : d; },
                        set: function(key, val){ self.setSetting(n, key, val); },
                        prefs: function(){ return self.getPrefs(); },
                        refresh: function(){ try { self._renderLast && self._renderLast(); } catch(_) {} }
                      };
                      self._settings[n](p, sApi);
                    } catch(_) {}
                  }
                } catch(_) {}
              }; }(name, panel, settingsBtn));
            }

            // drag and drop reorder（ヘッダーのみドラッグ開始）
            head.addEventListener('dragstart', function(ev){
              try {
                wrap.classList.add('is-dragging');
                ev.dataTransfer.setData('text/gadget-name', name);
                ev.dataTransfer.effectAllowed='move';
              } catch(_) {}
            });
            head.addEventListener('dragend', function(){ try { wrap.classList.remove('is-dragging'); } catch(_) {} });
            wrap.addEventListener('dragover', function(ev){ try { ev.preventDefault(); ev.dataTransfer.dropEffect='move'; wrap.classList.add('drag-over'); } catch(_) {} });
            wrap.addEventListener('dragleave', function(){ try { wrap.classList.remove('drag-over'); } catch(_) {} });
            wrap.addEventListener('drop', function(ev){
              try {
                ev.preventDefault();
                wrap.classList.remove('drag-over');
                var src = ev.dataTransfer.getData('text/gadget-name');
                var dst = name;
                if (!src || !dst || src===dst) return;
                var p = loadPrefs();
                var eff = state.order.slice();
                var sIdx = eff.indexOf(src), dIdx = eff.indexOf(dst);
                if (sIdx<0 || dIdx<0) return;
                // move src before dst
                eff.splice(dIdx, 0, eff.splice(sIdx,1)[0]);
                p.order = eff;
                savePrefs(p);
                try { self._renderLast && self._renderLast(); } catch(_) {}
              } catch(_) {}
            });

            // keyboard navigation
            wrap.addEventListener('keydown', function(ev){
              if (ev.key === 'ArrowUp' && ev.altKey){
                ev.preventDefault();
                self.move(name, 'up');
              } else if (ev.key === 'ArrowDown' && ev.altKey){
                ev.preventDefault();
                self.move(name, 'down');
              }
            });
            wrap.setAttribute('tabindex', '0');

            // remove button: 現在のグループからこのガジェットを除外
            removeBtn.addEventListener('click', function(){
              try {
                var item = self._list.find(function(it){ return (it.name||'') === name; });
                var current = Array.isArray(item && item.groups) ? item.groups.slice() : [];
                var next = current.filter(function(gr){ return gr !== group; });
                self.assignGroups(name, next);
              } finally {
                try { self._renderLast && self._renderLast(); } catch(_) {}
              }
            });

            root.appendChild(wrap);
          } catch(e) { /* ignore per gadget */ }
        }

        // Add available gadgets list
        var available = self._list.filter(function(g){
          return Array.isArray(g.groups) && g.groups.indexOf(group) < 0;
        });
        if (available.length > 0){
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

          available.forEach(function(g){
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'small';
            btn.textContent = g.title || g.name;
            btn.style.width = '100%';
            btn.addEventListener('click', function(){
              self.assignGroups(g.name, [group]);
              self._renderLast && self._renderLast();
            });
            addList.appendChild(btn);
          });

          addSection.appendChild(addList);

          addTitle.addEventListener('click', function(){
            addList.style.display = addList.style.display === 'none' ? 'flex' : 'none';
          });

          root.appendChild(addSection);
        }
      }

      self._renderers[group] = render;
      self._renderLast = function(){
        var keys = Object.keys(self._renderers || {});
        for (var i=0; i<keys.length; i++){
          var fn = self._renderers[keys[i]];
          if (typeof fn === 'function') fn();
        }
      };
      render();
    }
  };

  // expose
  try { window.ZWGadgets = ZWGadgets; } catch(_) {}

  // Outline gadget (構造)
  ZWGadgets.register('Outline', function(el){
    try {
      var STORAGE = window.ZenWriterStorage;
      if (!STORAGE || typeof STORAGE.loadOutline !== 'function'){
        var p = document.createElement('p');
        p.textContent = 'アウトライン機能を利用できません。';
        p.style.opacity = '0.7'; p.style.fontSize = '0.9rem';
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
              { key: 'section', label: '節', color: '#b88a4a' }
            ]
          }
        ],
        currentSetId: 'default-3'
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
      var sum = document.createElement('summary'); sum.textContent = '新しいプリセットを作成';
      var nameLbl = document.createElement('label'); nameLbl.setAttribute('for','outline-new-name'); nameLbl.textContent='名前';
      var nameInput = document.createElement('input'); nameInput.type='text'; nameInput.id='outline-new-name'; nameInput.placeholder='例: 三部構成';
      var lvLbl = document.createElement('label'); lvLbl.setAttribute('for','outline-new-levels'); lvLbl.textContent='レベル（カンマ区切り）';
      var lvInput = document.createElement('input'); lvInput.type='text'; lvInput.id='outline-new-levels'; lvInput.placeholder='部,章,節';
      var createBtn = document.createElement('button'); createBtn.type='button'; createBtn.id='create-outline-set'; createBtn.textContent='作成';
      var createBox = document.createElement('div');
      createBox.style.display='grid'; createBox.style.gap='6px';
      createBox.appendChild(nameLbl); createBox.appendChild(nameInput);
      createBox.appendChild(lvLbl); createBox.appendChild(lvInput);
      createBox.appendChild(createBtn);
      details.appendChild(sum); details.appendChild(createBox);

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

      function save(){ try { STORAGE.saveOutline(state); } catch(_) {} }
      function currentSet(){
        var s = state.sets.find(function(x){ return x && x.id === state.currentSetId; });
        return s || state.sets[0];
      }
      function renderSetSelect(){
        sel.innerHTML = '';
        state.sets.forEach(function(set){
          var opt = document.createElement('option');
          opt.value = set.id; opt.textContent = set.name || set.id; sel.appendChild(opt);
        });
        sel.value = state.currentSetId;
      }
      function renderCurrentSet(){
        var set = currentSet(); if (!set) return;
        // levels editor
        levelsBox.innerHTML = '';
        set.levels.forEach(function(lv, i){
          var row = document.createElement('div');
          row.className = 'level-row';
          row.style.display='flex'; row.style.alignItems='center'; row.style.justifyContent='space-between'; row.style.gap='6px';
          var left = document.createElement('label'); left.textContent = String(lv.label||''); left.style.flex='1 1 auto';
          var right = document.createElement('div'); right.style.display='flex'; right.style.alignItems='center'; right.style.gap='6px';
          var color = document.createElement('input'); color.type='color'; color.value = lv.color || '#888888'; color.setAttribute('data-index', String(i));
          var up = document.createElement('button'); up.type='button'; up.className='small btn-move'; up.setAttribute('data-dir','up'); up.setAttribute('data-index', String(i)); up.textContent='↑'; up.title='上へ';
          var down = document.createElement('button'); down.type='button'; down.className='small btn-move'; down.setAttribute('data-dir','down'); down.setAttribute('data-index', String(i)); down.textContent='↓'; down.title='下へ';
          right.appendChild(color); right.appendChild(up); right.appendChild(down);
          row.appendChild(left); row.appendChild(right);
          levelsBox.appendChild(row);
        });

        // insert buttons
        insertBox.innerHTML = '';
        set.levels.forEach(function(lv, i){
          var b = document.createElement('button');
          b.className='outline-btn'; b.type='button';
          b.textContent = String(lv.label||'') + ' を挿入';
          b.style.borderColor = lv.color || '#888';
          b.style.color = lv.color || 'inherit';
          b.addEventListener('click', function(){ insertLevel(i); });
          insertBox.appendChild(b);
        });
      }

      function generatePalette(n){
        var arr=[]; for (var i=0;i<n;i++){ var hue = Math.round((360/n)*i); arr.push(hslToHex(hue,60,50)); } return arr;
      }
      function hslToHex(h,s,l){
        s/=100; l/=100; var k=function(n){ return (n + h/30) % 12; };
        var a = s * Math.min(l, 1-l);
        var f = function(n){ return l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1))); };
        var r=Math.round(255*f(0)), g=Math.round(255*f(8)), b=Math.round(255*f(4));
        var toHex=function(c){ var x=c.toString(16); return x.length===1?('0'+x):x; };
        return '#'+toHex(r)+toHex(g)+toHex(b);
      }

      function insertLevel(index){
        var set = currentSet(); if (!set || !set.levels[index]) return;
        var depth = index + 1; var prefix = '#'.repeat(Math.min(depth,6));
        var text = prefix + ' ' + String(set.levels[index].label||'') + ' タイトル\n\n';
        try {
          if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertTextAtCursor === 'function'){
            window.ZenWriterEditor.insertTextAtCursor(text);
          }
        } catch(_) {}
      }

      // events
      sel.addEventListener('change', function(e){ state.currentSetId = e.target.value; save(); renderCurrentSet(); });
      createBtn.addEventListener('click', function(){
        var name = (nameInput.value||'').trim() || '新規プリセット';
        var csv = (lvInput.value||'').trim(); if (!csv){ alert('レベル名をカンマ区切りで入力してください'); return; }
        var labels = csv.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
        var palette = generatePalette(labels.length);
        var id = 'set-' + Date.now();
        var set = { id:id, name:name, levels: labels.map(function(label,idx){ return { key: 'k'+idx, label: label, color: palette[idx] }; }) };
        state.sets.push(set); state.currentSetId = id; save(); nameInput.value=''; lvInput.value=''; renderSetSelect(); renderCurrentSet();
      });
      levelsBox.addEventListener('change', function(e){ var t=e.target; if (t && t.matches('input[type="color"]')){ var idx=parseInt(t.getAttribute('data-index'),10); var set=currentSet(); if (set && set.levels[idx]){ set.levels[idx].color = t.value; save(); renderCurrentSet(); } } });
      levelsBox.addEventListener('click', function(e){ var t=e.target; if (t && t.matches('.btn-move')){ var dir=t.getAttribute('data-dir'); var idx=parseInt(t.getAttribute('data-index'),10); var set=currentSet(); if (!set) return; var ni = dir==='up'? idx-1 : idx+1; if (ni<0 || ni>=set.levels.length) return; var arr=set.levels; var tmp=arr[idx]; arr[idx]=arr[ni]; arr[ni]=tmp; save(); renderCurrentSet(); } });

      // init
      renderSetSelect();
      renderCurrentSet();
    } catch(e){
      console.error('Outline gadget failed:', e);
      try { el.textContent = 'アウトラインの初期化に失敗しました。'; } catch(_) {}
    }
  }, { groups: ['structure'], title: 'アウトライン' });

  ZWGadgets.register('Documents', function(el){
    try {
      var storage = window.ZenWriterStorage;
      if (!storage) {
        var warn = document.createElement('p');
        warn.textContent = 'ストレージ機能が利用できないため、ドキュメントを管理できません。';
        warn.style.fontSize = '0.9rem';
        warn.style.opacity = '0.7';
        el.appendChild(warn);
        return;
      }

      var editorManager = window.ZenWriterEditor;
      var selectId = 'zw-doc-select-' + Math.random().toString(36).slice(2);
      var state = { docs: [], currentId: null };

      function notify(message, duration){
        try {
          if (editorManager && typeof editorManager.showNotification === 'function') {
            editorManager.showNotification(message, duration || 1200);
          }
        } catch(_) {}
      }

      function ensureDocuments(){
        var docs = storage.loadDocuments() || [];
        var cur = storage.getCurrentDocId();
        if (!docs.length){
          var initial = '';
          try { initial = storage.loadContent() || ''; } catch(_) {}
          var created = storage.createDocument('ドキュメント1', initial);
          storage.setCurrentDocId(created.id);
          if (editorManager && typeof editorManager.setContent === 'function') {
            editorManager.setContent(initial);
          } else {
            storage.saveContent(initial);
          }
          docs = storage.loadDocuments() || [];
          cur = created.id;
        }
        if (!cur || !docs.some(function(d){ return d && d.id === cur; })){ 
          var sorted = docs.slice().sort(function(a,b){ return (b.updatedAt||0) - (a.updatedAt||0); });
          if (sorted.length){
            var first = sorted[0];
            storage.setCurrentDocId(first.id);
            if (editorManager && typeof editorManager.setContent === 'function') {
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

      function sortedDocs(){
        var docs = storage.loadDocuments() || [];
        return docs.slice().sort(function(a,b){ return (b.updatedAt||0) - (a.updatedAt||0); });
      }

      function refreshOptions(preferredId){
        ensureDocuments();
        var docs = sortedDocs();
        var select = elements.select;
        select.innerHTML = '';
        if (!docs.length){
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
        docs.forEach(function(doc){
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

      function saveCurrentContent(){
        try {
          if (editorManager && editorManager.editor && typeof storage.saveContent === 'function') {
            storage.saveContent(editorManager.editor.value || '');
          }
        } catch(_) {}
      }

      function updateDocumentTitle(){
        try {
          var docs = storage.loadDocuments() || [];
          var cur = storage.getCurrentDocId();
          var doc = docs.find(function(d){ return d && d.id === cur; });
          var name = doc && doc.name ? doc.name : '';
          document.title = name ? name + ' - Zen Writer' : 'Zen Writer - 小説執筆ツール';
        } catch(_) {
          document.title = 'Zen Writer - 小説執筆ツール';
        }
      }

      function dispatchChanged(){
        try { window.dispatchEvent(new CustomEvent('ZWDocumentsChanged', { detail: { docs: storage.loadDocuments() || [] } })); } catch(_) {}
      }

      function switchDocument(id){
        if (!id) return;
        var docs = storage.loadDocuments() || [];
        var doc = docs.find(function(d){ return d && d.id === id; });
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

      function createDocument(){
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

      function renameDocument(){
        var cur = storage.getCurrentDocId();
        if (!cur) return;
        var docs = storage.loadDocuments() || [];
        var doc = docs.find(function(d){ return d && d.id === cur; });
        var name = prompt('ドキュメント名を変更', doc ? (doc.name || '無題') : '無題');
        if (name === null) return;
        storage.renameDocument(cur, name || '無題');
        refreshOptions(cur);
        updateDocumentTitle();
        notify('ドキュメント名を更新しました');
        dispatchChanged();
      }

      function deleteDocument(){
        var cur = storage.getCurrentDocId();
        if (!cur) return;
        if (!confirm('このドキュメントを削除しますか？この操作は元に戻せません。')) return;
        storage.deleteDocument(cur);
        ensureDocuments();
        var next = storage.getCurrentDocId();
        if (editorManager && typeof editorManager.setContent === 'function') {
          var docs = storage.loadDocuments() || [];
          var doc = docs.find(function(d){ return d && d.id === next; });
          editorManager.setContent(doc && doc.content ? doc.content : '');
        } else {
          var doc2 = storage.loadDocuments().find(function(d){ return d && d.id === next; });
          storage.saveContent(doc2 ? doc2.content || '' : '');
        }
        refreshOptions(next);
        updateDocumentTitle();
        notify('ドキュメントを削除しました');
        dispatchChanged();
      }

      function importFile(files){
        if (!files || !files.length) return;
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function(){
          try {
            var text = String(reader.result || '');
            if (editorManager && typeof editorManager.setContent === 'function') {
              editorManager.setContent(text);
            } else {
              storage.saveContent(text);
            }
            refreshOptions(storage.getCurrentDocId());
            notify('ファイルを読み込みました');
            dispatchChanged();
          } catch(e){ console.error(e); }
        };
        reader.onerror = function(){ console.error('ファイル読み込みエラー'); };
        reader.readAsText(file, 'utf-8');
      }

      function exportCurrent(asMarkdown){
        if (editorManager) {
          if (asMarkdown && typeof editorManager.exportAsMarkdown === 'function') return editorManager.exportAsMarkdown();
          if (!asMarkdown && typeof editorManager.exportAsText === 'function') return editorManager.exportAsText();
        }
        try {
          var text = storage.loadContent() || '';
          var docId = storage.getCurrentDocId();
          var docs = storage.loadDocuments() || [];
          var doc = docs.find(function(d){ return d && d.id === docId; });
          var base = doc && doc.name ? doc.name : 'zenwriter';
          var filename = base + (asMarkdown ? '.md' : '.txt');
          storage.exportText(text, filename, asMarkdown ? 'text/markdown' : 'text/plain');
        } catch(_) {}
      }

      function printCurrent(){
        if (window.ZenWriterApp && typeof window.ZenWriterApp.printDocument === 'function') {
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
      select.addEventListener('change', function(ev){ switchDocument(ev.target.value); });
      elements.select = select;

      function makeSmallButton(text, handler){
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
      var btnImport = makeSmallButton('ファイルを読み込む', function(){ hiddenInput.click(); });
      var btnExportTxt = makeSmallButton('テキストで保存', function(){ exportCurrent(false); });
      var btnExportMd = makeSmallButton('Markdownで保存', function(){ exportCurrent(true); });
      var btnPrint = makeSmallButton('印刷', printCurrent);
      var btnPdfExport = makeSmallButton('PDFエクスポート', function(){
        // PDFエクスポート機能（ブラウザ印刷利用）
        try {
          window.print();
        } catch(e){ console.error('PDF export failed', e); }
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
      hiddenInput.addEventListener('change', function(ev){
        try { importFile(ev.target.files); } finally { ev.target.value = ''; }
      });

      container.appendChild(label);
      container.appendChild(select);
      container.appendChild(primaryRow);
      container.appendChild(secondaryRow);
      container.appendChild(hiddenInput);

      el.appendChild(container);

      refreshOptions();
      updateDocumentTitle();

      window.addEventListener('ZWLoadoutsChanged', function(){ refreshOptions(storage.getCurrentDocId()); });
      window.addEventListener('ZWLoadoutApplied', function(){ refreshOptions(storage.getCurrentDocId()); });
      window.addEventListener('ZWDocumentsChanged', function(){ refreshOptions(storage.getCurrentDocId()); });
    } catch(e) {
      console.error('Documents gadget failed:', e);
      try { el.textContent = 'ドキュメントガジェットの初期化に失敗しました。'; } catch(_) {}
    }
  }, { groups: ['structure'], title: 'ドキュメント' });

  ZWGadgets.register('Outline', function(el){
    try {
      var storage = window.ZenWriterStorage;
      if (!storage) {
        var warn = document.createElement('p');
        warn.textContent = 'ストレージが利用できません。';
        warn.style.opacity = '0.7'; warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      var wrap = document.createElement('div');
      wrap.className = 'gadget-outline';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '10px';

      var levelsContainer = document.createElement('div');
      levelsContainer.className = 'outline-levels';
      levelsContainer.style.display = 'flex';
      levelsContainer.style.flexDirection = 'column';
      levelsContainer.style.gap = '6px';

      var insertContainer = document.createElement('div');
      insertContainer.className = 'outline-insert';
      insertContainer.style.display = 'flex';
      insertContainer.style.flexWrap = 'wrap';
      insertContainer.style.gap = '6px';
      insertContainer.style.marginTop = '8px';

      var levels = ['# ', '## ', '### ', '#### ', '##### ', '###### '];
      var levelLabels = ['大見出し', '中見出し', '小見出し', '詳細', 'メモ', '注記'];

      levels.forEach(function(level, idx){
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'outline-btn small';
        btn.textContent = levelLabels[idx] || level.trim();
        btn.addEventListener('click', function(){
          try {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertTextAtCursor === 'function') {
              window.ZenWriterEditor.insertTextAtCursor(level + '\n\n');
            }
          } catch(e){ console.error('insert outline failed', e); }
        });
        insertContainer.appendChild(btn);
      });

      wrap.appendChild(levelsContainer);
      wrap.appendChild(insertContainer);

      // ドラッグ&ドロップ機能
      var draggedElement = null;

      function makeLevelRow(level, label, canDrag){
        var row = document.createElement('div');
        row.className = 'level-row';
        row.draggable = canDrag;
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.gap = '8px';
        row.style.margin = '6px 0';
        row.dataset.level = level;

        var levelSpan = document.createElement('span');
        levelSpan.textContent = level;
        levelSpan.style.fontFamily = 'monospace';
        levelSpan.style.fontWeight = 'bold';

        var labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        labelSpan.style.flex = '1';

        var upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'small';
        upBtn.textContent = '↑';
        upBtn.style.width = '24px';
        upBtn.style.height = '24px';
        upBtn.addEventListener('click', function(){ moveLevel(row, -1); });

        var downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = 'small';
        downBtn.textContent = '↓';
        downBtn.style.width = '24px';
        downBtn.style.height = '24px';
        downBtn.addEventListener('click', function(){ moveLevel(row, 1); });

        if (canDrag) {
          row.addEventListener('dragstart', function(e){
            draggedElement = row;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', row.outerHTML);
          });
          row.addEventListener('dragover', function(e){
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          });
          row.addEventListener('drop', function(e){
            e.preventDefault();
            if (draggedElement && draggedElement !== row) {
              var parent = row.parentNode;
              var allRows = Array.from(parent.children);
              var fromIndex = allRows.indexOf(draggedElement);
              var toIndex = allRows.indexOf(row);
              if (fromIndex < toIndex) {
                parent.insertBefore(draggedElement, row.nextSibling);
              } else {
                parent.insertBefore(draggedElement, row);
              }
              draggedElement = null;
            }
          });
        }

        row.appendChild(levelSpan);
        row.appendChild(labelSpan);
        if (canDrag) {
          row.appendChild(upBtn);
          row.appendChild(downBtn);
        }
        return row;
      }

      function moveLevel(row, direction){
        var parent = row.parentNode;
        var sibling = direction === -1 ? row.previousElementSibling : row.nextElementSibling;
        if (sibling) {
          if (direction === -1) {
            parent.insertBefore(row, sibling);
          } else {
            parent.insertBefore(sibling, row);
          }
        }
      }

      // 初期レベル表示（ドラッグ可能）
      var initialLevels = [
        { level: '#', label: '章' },
        { level: '##', label: '節' },
        { level: '###', label: '項' },
        { level: '####', label: '目' }
      ];
      initialLevels.forEach(function(item){
        levelsContainer.appendChild(makeLevelRow(item.level, item.label, true));
      });

      el.appendChild(wrap);
    } catch(e) {
      console.error('Outline gadget failed:', e);
      try { el.textContent = 'アウトラインガジェットの初期化に失敗しました。'; } catch(_) {}
    }
  }, { groups: ['structure'], title: 'アウトライン' });

  ZWGadgets.register('TypographyThemes', function(el){
    try {
      var theme = window.ZenWriterTheme;
      var storage = window.ZenWriterStorage;
      if (!theme || !storage) {
        var warn = document.createElement('p');
        warn.textContent = 'タイポ設定を読み込めません。';
        warn.style.opacity = '0.7'; warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      var settings = storage.loadSettings ? storage.loadSettings() : {};
      settings = settings || {};

      var wrap = document.createElement('div');
      wrap.className = 'gadget-typography';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '12px';

      function makeSection(title){
        var section = document.createElement('div');
        section.className = 'typography-section';
        var heading = document.createElement('h4');
        heading.textContent = title;
        heading.style.margin = '0';
        heading.style.fontSize = '0.95rem';
        section.appendChild(heading);
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '6px';
        return section;
      }

      function makeRow(labelText, control){
        var row = document.createElement('label');
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '4px';
        row.textContent = labelText;
        row.appendChild(control);
        return row;
      }

      // Theme presets
      var themesSection = makeSection('テーマ');
      var themeButtons = document.createElement('div');
      themeButtons.style.display = 'flex';
      themeButtons.style.gap = '6px';
      themeButtons.style.flexWrap = 'wrap';
      ['light','dark','sepia','high-contrast','solarized'].forEach(function(key){
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'small';
        btn.textContent = ({ light:'ライト', dark:'ダーク', sepia:'セピア', 'high-contrast':'高コントラスト', solarized:'ソラリゼド' })[key] || key;
        btn.addEventListener('click', function(){
          try {
            theme.applyTheme(key);
            try { refreshState(); } catch(_) {}
          } catch(e){ console.error('applyTheme failed', e); }
        });
        themeButtons.appendChild(btn);
      });
      themesSection.appendChild(themeButtons);

      // Color section
      var colorSection = makeSection('色');
      var bgInput = document.createElement('input');
      bgInput.type = 'color';
      bgInput.value = settings.bgColor || '#ffffff';
      var textInput = document.createElement('input');
      textInput.type = 'color';
      textInput.value = settings.textColor || '#333333';

      bgInput.addEventListener('change', function(){
        theme.applyCustomColors(bgInput.value, textInput.value, true);
        refreshState();
      });
      textInput.addEventListener('change', function(){
        theme.applyCustomColors(bgInput.value, textInput.value, true);
        refreshState();
      });

      colorSection.appendChild(makeRow('背景色', bgInput));
      colorSection.appendChild(makeRow('文字色', textInput));

      // Custom color presets
      var paletteSection = makeSection('カスタム色');
      var customPresets = [];
      try {
        var stored = localStorage.getItem('zenWriter_colorPresets');
        if (stored) customPresets = JSON.parse(stored);
      } catch(_) {}
      if (customPresets.length > 0) {
        customPresets.forEach(function(preset, idx){
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'small';
          btn.textContent = preset.name;
          btn.addEventListener('click', function(){
            theme.applyCustomColors(preset.bg, preset.text, true);
            refreshState();
          });
          paletteSection.appendChild(btn);
        });
      }

      // Font settings
      var fontSection = makeSection('フォント');
      var fontSelect = document.createElement('select');
      var fonts = [
        { value: "'Noto Serif JP', serif", label: 'Noto Serif JP' },
        { value: "'Yu Mincho', 'YuMincho', serif", label: '游明朝' },
        { value: "'Hiragino Mincho ProN', serif", label: 'ヒラギノ明朝' }
      ];
      fonts.forEach(function(f){ var opt=document.createElement('option'); opt.value=f.value; opt.textContent=f.label; fontSelect.appendChild(opt); });
      fontSection.appendChild(makeRow('フォントファミリー', fontSelect));

      var uiFontSizeInput = document.createElement('input');
      uiFontSizeInput.type = 'range'; uiFontSizeInput.min = '12'; uiFontSizeInput.max = '32'; uiFontSizeInput.step = '1'; uiFontSizeInput.value = settings.uiFontSize || 16;
      var uiFontSizeLabel = document.createElement('div');
      uiFontSizeLabel.style.fontSize = '0.85rem'; uiFontSizeLabel.style.opacity = '0.8';
      uiFontSizeLabel.textContent = 'UIフォントサイズ: ' + uiFontSizeInput.value + 'px';
      uiFontSizeInput.addEventListener('input', function(e){
        uiFontSizeLabel.textContent = 'UIフォントサイズ: ' + e.target.value + 'px';
        theme.applyFontSettings(fontSelect.value, settings.fontSize || 16, parseFloat(lineHeightInput.value), parseInt(e.target.value, 10), parseInt(editorFontSizeInput.value, 10));
        refreshState();
      });
      var uiFontSizeRow = document.createElement('div');
      uiFontSizeRow.style.display = 'flex';
      uiFontSizeRow.style.flexDirection = 'column';
      uiFontSizeRow.style.gap = '4px';
      uiFontSizeRow.appendChild(uiFontSizeLabel);
      uiFontSizeRow.appendChild(uiFontSizeInput);
      fontSection.appendChild(uiFontSizeRow);

      var editorFontSizeInput = document.createElement('input');
      editorFontSizeInput.type = 'range'; editorFontSizeInput.min = '12'; editorFontSizeInput.max = '32'; editorFontSizeInput.step = '1'; editorFontSizeInput.value = settings.editorFontSize || 16;
      var editorFontSizeLabel = document.createElement('div');
      editorFontSizeLabel.style.fontSize = '0.85rem'; editorFontSizeLabel.style.opacity = '0.8';
      editorFontSizeLabel.textContent = 'エディタフォントサイズ: ' + editorFontSizeInput.value + 'px';
      editorFontSizeInput.addEventListener('input', function(e){
        editorFontSizeLabel.textContent = 'エディタフォントサイズ: ' + e.target.value + 'px';
        theme.applyFontSettings(fontSelect.value, settings.fontSize || 16, parseFloat(lineHeightInput.value), parseInt(uiFontSizeInput.value, 10), parseInt(e.target.value, 10));
        refreshState();
      });
      var editorFontSizeRow = document.createElement('div');
      editorFontSizeRow.style.display = 'flex';
      editorFontSizeRow.style.flexDirection = 'column';
      editorFontSizeRow.style.gap = '4px';
      editorFontSizeRow.appendChild(editorFontSizeLabel);
      editorFontSizeRow.appendChild(editorFontSizeInput);
      fontSection.appendChild(editorFontSizeRow);

      var lineHeightInput = document.createElement('input');
      lineHeightInput.type = 'range'; lineHeightInput.min = '1'; lineHeightInput.max = '3'; lineHeightInput.step = '0.1';
      lineHeightInput.value = settings.lineHeight || 1.6;
      var lineHeightLabel = document.createElement('div');
      lineHeightLabel.style.fontSize = '0.85rem'; lineHeightLabel.style.opacity = '0.8';
      lineHeightLabel.textContent = '行間: ' + lineHeightInput.value;
      lineHeightInput.addEventListener('input', function(e){
        lineHeightLabel.textContent = '行間: ' + e.target.value;
        theme.applyFontSettings(fontSelect.value, settings.fontSize || 16, parseFloat(e.target.value), parseInt(uiFontSizeInput.value, 10), parseInt(editorFontSizeInput.value, 10));
        refreshState();
      });
      var lineHeightRow = document.createElement('div');
      lineHeightRow.style.display = 'flex';
      lineHeightRow.style.flexDirection = 'column';
      lineHeightRow.style.gap = '4px';
      lineHeightRow.appendChild(lineHeightLabel);
      lineHeightRow.appendChild(lineHeightInput);
      fontSection.appendChild(lineHeightRow);

      wrap.appendChild(themesSection);
      wrap.appendChild(colorSection);
      wrap.appendChild(paletteSection);
      wrap.appendChild(fontSection);

      el.appendChild(wrap);

      function refreshState(){
        try {
          var latest = storage.loadSettings();
          if (!latest) return;
          fontSelect.value = latest.fontFamily || fonts[0].value;
          uiFontSizeInput.value = latest.uiFontSize || 16;
          uiFontSizeLabel.textContent = 'UIフォントサイズ: ' + uiFontSizeInput.value + 'px';
          editorFontSizeInput.value = latest.editorFontSize || 16;
          editorFontSizeLabel.textContent = 'エディタフォントサイズ: ' + editorFontSizeInput.value + 'px';
          lineHeightInput.value = latest.lineHeight || 1.6;
          lineHeightLabel.textContent = '行間: ' + lineHeightInput.value;
          bgInput.value = latest.bgColor || '#ffffff';
          textInput.value = latest.textColor || '#333333';
        } catch(e){ console.error('refreshState failed', e); }
      }

      window.addEventListener('ZWLoadoutsChanged', refreshState);
      window.addEventListener('ZWLoadoutApplied', refreshState);
      window.addEventListener('ZenWriterSettingsChanged', refreshState);
    } catch(e) {
      console.error('TypographyThemes gadget failed:', e);
      try { el.textContent = 'タイポ設定ガジェットの初期化に失敗しました。'; } catch(_) {}
    }
  }, { groups: ['typography'], title: 'テーマ & フォント' });

  ZWGadgets.register('HUDSettings', function(el){
    try {
      var storage = window.ZenWriterStorage;
      if (!storage || typeof storage.loadSettings !== 'function' || typeof storage.saveSettings !== 'function') {
        var warn = document.createElement('p');
        warn.textContent = 'HUD設定は利用できません。';
        warn.style.opacity = '0.7'; warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      function loadHud(){
        var settings = storage.loadSettings() || {};
        return settings.hud || {};
      }
      function saveHud(patch){
        var settings = storage.loadSettings() || {};
        settings.hud = Object.assign({}, settings.hud || {}, patch || {});
        storage.saveSettings(settings);
        try {
          if (window.ZenWriterHUD && typeof window.ZenWriterHUD.updateFromSettings === 'function') {
            window.ZenWriterHUD.updateFromSettings();
          }
        } catch(_) {}
      }

      var hud = loadHud();

      var wrap = document.createElement('div');
      wrap.className = 'gadget-hud-settings';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '8px';

      function makeRow(labelText, control){
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
        { value: 'top-right', label: '右上' }
      ].forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.value; o.textContent = opt.label; select.appendChild(o);
      });
      select.value = hud.position || 'bottom-left';
      select.addEventListener('change', function(e){ saveHud({ position: e.target.value }); });
      wrap.appendChild(makeRow('表示位置', select));

      var duration = document.createElement('input');
      duration.type = 'number'; duration.min = '300'; duration.max = '5000'; duration.step = '100';
      duration.value = hud.duration || 1200;
      function clampDuration(v){ var n = parseInt(v,10); if (isNaN(n)) return 1200; return Math.max(300, Math.min(5000, n)); }
      var durationHandler = function(e){ saveHud({ duration: clampDuration(e.target.value) }); };
      duration.addEventListener('change', durationHandler);
      duration.addEventListener('input', durationHandler);
      wrap.appendChild(makeRow('表示時間（ms）', duration));

      var bg = document.createElement('input');
      bg.type = 'color'; bg.value = hud.bg || '#000000';
      bg.addEventListener('change', function(e){ saveHud({ bg: e.target.value }); });
      wrap.appendChild(makeRow('背景色', bg));

      var fg = document.createElement('input');
      fg.type = 'color'; fg.value = hud.fg || '#ffffff';
      fg.addEventListener('change', function(e){ saveHud({ fg: e.target.value }); });
      wrap.appendChild(makeRow('文字色', fg));

      var opacityLabel = document.createElement('div');
      opacityLabel.textContent = '不透明度: ' + (typeof hud.opacity === 'number' ? hud.opacity : 0.75);
      opacityLabel.style.fontSize = '0.85rem'; opacityLabel.style.opacity = '0.8';
      var opacity = document.createElement('input');
      opacity.type = 'range'; opacity.min = '0'; opacity.max = '1'; opacity.step = '0.05';
      opacity.value = (typeof hud.opacity === 'number') ? hud.opacity : 0.75;
      function setOpacity(val){
        var num = Math.max(0, Math.min(1, parseFloat(val)));
        opacityLabel.textContent = '不透明度: ' + num;
        saveHud({ opacity: num });
      }
      opacity.addEventListener('input', function(e){ setOpacity(e.target.value); });
      opacity.addEventListener('change', function(e){ setOpacity(e.target.value); });
      var opacityRow = document.createElement('div');
      opacityRow.style.display = 'flex';
      opacityRow.style.flexDirection = 'column';
      opacityRow.style.gap = '4px';
      opacityRow.appendChild(opacityLabel);
      opacityRow.appendChild(opacity);
      wrap.appendChild(opacityRow);

      // Writing goal settings
      var goalSection = document.createElement('div');
      goalSection.style.display = 'flex';
      goalSection.style.flexDirection = 'column';
      goalSection.style.gap = '8px';
      goalSection.style.marginTop = '12px';
      goalSection.style.paddingTop = '8px';
      goalSection.style.borderTop = '1px solid var(--border-color)';

      var goalLabel = document.createElement('label');
      goalLabel.textContent = '執筆目標';
      goalLabel.style.fontSize = '0.9rem';
      goalLabel.style.fontWeight = '600';
      goalSection.appendChild(goalLabel);

      var goalTargetInput = document.createElement('input');
      goalTargetInput.type = 'number';
      goalTargetInput.placeholder = '目標文字数';
      goalTargetInput.min = '0';
      goalTargetInput.value = hud.goalTarget || '';
      goalTargetInput.addEventListener('change', function(e){ saveHud({ goalTarget: parseInt(e.target.value, 10) || 0 }); });
      goalSection.appendChild(makeRow('目標文字数', goalTargetInput));

      var goalDeadlineInput = document.createElement('input');
      goalDeadlineInput.type = 'date';
      goalDeadlineInput.value = hud.goalDeadline || '';
      goalDeadlineInput.addEventListener('change', function(e){ saveHud({ goalDeadline: e.target.value }); });
      goalSection.appendChild(makeRow('締切日', goalDeadlineInput));

      wrap.appendChild(goalSection);

      var testBtn = document.createElement('button');
      testBtn.type = 'button'; testBtn.className = 'small'; testBtn.textContent = 'HUDテスト表示';
      testBtn.addEventListener('click', function(){
        try {
          if (window.ZenWriterHUD && typeof window.ZenWriterHUD.publish === 'function') {
            window.ZenWriterHUD.publish('HUDテスト表示');
          }
        } catch(_) {}
      });
      wrap.appendChild(testBtn);

      el.appendChild(wrap);
    } catch(e) {
      console.error('HUDSettings gadget failed:', e);
      try { el.textContent = 'HUD設定ガジェットの初期化に失敗しました。'; } catch(_) {}
    }
  }, { groups: ['assist'], title: 'HUD設定' });

  // EditorLayout gadget
  ZWGadgets.register('EditorLayout', function(el, api){
    try {
      var settings = api && typeof api.getSettings === 'function' ? api.getSettings() : {};
      var width = settings.width || 900;
      var paddingX = settings.paddingX || 100;
      var showBorder = !!settings.showBorder;

      function applyLayout(){
        try {
          var canvas = document.querySelector('.editor-canvas');
          var preview = document.querySelector('.editor-preview');
          if (canvas) {
            canvas.style.width = width + 'px';
          }
          if (preview) {
            preview.style.padding = '1rem ' + paddingX + 'px';
            preview.classList.toggle('editor-preview--bordered', showBorder);
          }
        } catch(e) { console.error('applyLayout failed', e); }
      }
      applyLayout();

      // 設定変更イベント（共通/個別）を購読して再適用
      function _onSettingsChanged(ev){
        try {
          var d = ev && ev.detail ? ev.detail : {};
          if (d && d.name === 'EditorLayout'){
            var s = d.settings || {};
            width = (typeof s.width === 'number') ? s.width : width;
            paddingX = (typeof s.paddingX === 'number') ? s.paddingX : paddingX;
            showBorder = !!s.showBorder;
            applyLayout();
          }
        } catch(_) {}
      }
      try { window.addEventListener('ZWGadgetSettingsChanged', _onSettingsChanged); } catch(_) {}
      try { window.addEventListener('ZWGadgetSettingsChanged:EditorLayout', _onSettingsChanged); } catch(_) {}
    } catch(e) {
      console.error('EditorLayout gadget failed:', e);
      try { el.textContent = 'エディタレイアウトガジェットの初期化に失敗しました。'; } catch(_) {}
    }
  }, { groups: ['typography'], title: 'エディタレイアウト' });

  // EditorLayout settings UI
  ZWGadgets.registerSettings('EditorLayout', function(el, ctx){
    try {
      var makeRow = function(labelText, control){
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
      widthInput.addEventListener('input', function(){
        widthLabel.textContent = '幅: ' + widthInput.value + 'px';
        ctx.set('width', parseInt(widthInput.value, 10));
      });
      widthInput.addEventListener('change', function(){
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
      paddingInput.addEventListener('input', function(){
        paddingLabel.textContent = '左右余白: ' + paddingInput.value + 'px';
        ctx.set('paddingX', parseInt(paddingInput.value, 10));
      });
      paddingInput.addEventListener('change', function(){
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
      borderCb.addEventListener('change', function(){
        ctx.set('showBorder', !!borderCb.checked);
      });
      borderRow.appendChild(borderCb);
      borderRow.appendChild(borderTxt);
      el.appendChild(borderRow);

    } catch(e) { console.error('EditorLayout settings failed:', e); }
  });

  // Default gadget: Clock
  ZWGadgets.register('Clock', function(el, api){
    try {
      var time = document.createElement('div');
      time.className = 'gadget-clock';
      el.appendChild(time);
      function tick(){
        try {
          var d = new Date();
          var z = function(n){ return (n<10?'0':'')+n };
          var hour24 = api && typeof api.get==='function' ? !!api.get('hour24', true) : true;
          var h = d.getHours();
          var ap = '';
          if (!hour24){ ap = (h>=12?' PM':' AM'); h = h%12; if (h===0) h = 12; }
          var s = d.getFullYear() + '-' + z(d.getMonth()+1) + '-' + z(d.getDate()) + ' ' + (hour24? z(h) : (h<10?' '+h:h)) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds()) + (hour24?'':ap);
          time.textContent = s;
        } catch(_) {}
      }
      tick();
      var id = setInterval(tick, 1000);
      try { el.addEventListener('removed', function(){ clearInterval(id); }); } catch(_) {}
      try { window.addEventListener('beforeunload', function(){ clearInterval(id); }, { once: true }); } catch(_) {}
    } catch(_) {}
  });

  // Clock settings UI
  ZWGadgets.registerSettings('Clock', function(el, ctx){
    try {
      var row = document.createElement('label'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='6px';
      var cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!ctx.get('hour24', true);
      var txt = document.createElement('span'); txt.textContent = '24時間表示';
      cb.addEventListener('change', function(){ try { ctx.set('hour24', !!cb.checked); } catch(_) {} });
      row.appendChild(cb); row.appendChild(txt);
      el.appendChild(row);
    } catch(_) {}
  });

  ZWGadgets.addTab = function(name, label, containerId){
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
      tabBtn.addEventListener('click', function(){
        var tabs = tabsEl.querySelectorAll('.sidebar-tab');
        tabs.forEach(function(t){ t.classList.remove('active'); });
        var groups = groupsEl.querySelectorAll('.sidebar-group');
        groups.forEach(function(g){ g.classList.remove('active'); g.setAttribute('aria-hidden', 'true'); });
        tabBtn.classList.add('active');
        var targetGroup = groupsEl.querySelector('[data-group="' + name + '"]');
        if (targetGroup){
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
    } catch(e) { console.error('addTab failed', e); return false; }
  };

  ZWGadgets.removeTab = function(name){
    try {
      var tabsEl = document.getElementById('sidebar-tabs');
      var groupsEl = document.getElementById('sidebar-groups');
      if (!tabsEl || !groupsEl) return false;

      var tabBtn = tabsEl.querySelector('[data-tab="' + name + '"]');
      if (tabBtn) tabBtn.remove();

      var groupEl = groupsEl.querySelector('[data-group="' + name + '"]');
      if (groupEl) groupEl.remove();

      return true;
    } catch(e) { console.error('removeTab failed', e); return false; }
  };
  ready(function(){
    try { loadLoadouts(); } catch(_) {}
    try { ZWGadgets.init('#structure-gadgets-panel', { group: 'structure' }); } catch(_) {}
    try { ZWGadgets.init('#gadgets-panel', { group: 'assist' }); } catch(_) {}
    try { ZWGadgets.init('#typography-gadgets-panel', { group: 'typography' }); } catch(_) {}
    // Wire Loadout UI
    try {
      var $sel = document.getElementById('loadout-select');
      var $name = document.getElementById('loadout-name');
      var $save = document.getElementById('loadout-save');
      var $apply = document.getElementById('loadout-apply');
      var $dup = document.getElementById('loadout-duplicate');
      var $del = document.getElementById('loadout-delete');

      function refreshLoadoutUI(activeName){
        try {
          var items = ZWGadgets.listLoadouts ? ZWGadgets.listLoadouts() : [];
          if ($sel){
            $sel.innerHTML='';
            items.forEach(function(it){ var opt=document.createElement('option'); opt.value=it.name; opt.textContent=it.label||it.name; $sel.appendChild(opt); });
            var active = (ZWGadgets.getActiveLoadout && ZWGadgets.getActiveLoadout().name) || (items[0] && items[0].name) || '';
            $sel.value = activeName || active || '';
          }
          if ($name){
            try { var cur = ZWGadgets.getActiveLoadout ? ZWGadgets.getActiveLoadout() : null; $name.value = (cur && cur.label) || ''; } catch(_) {}
          }
        } catch(_) {}
      }

      if ($save){
        $save.addEventListener('click', function(){
          try {
            var nm = ($name && $name.value || '').trim();
            if (!nm){ alert('ロードアウト名を入力してください'); return; }
            var captured = ZWGadgets.captureCurrentLoadout ? ZWGadgets.captureCurrentLoadout(nm) : null;
            if (!captured){ alert('現在の構成を取得できませんでした'); return; }
            ZWGadgets.defineLoadout(nm, captured);
            ZWGadgets.applyLoadout(nm);
            refreshLoadoutUI(nm);
          } catch(e){ console.error('save loadout failed', e); }
        });
      }
      if ($apply){
        $apply.addEventListener('click', function(){
          try { if ($sel && $sel.value){ ZWGadgets.applyLoadout($sel.value); refreshLoadoutUI($sel.value); } } catch(_) {}
        });
      }
      if ($dup){
        $dup.addEventListener('click', function(){
          try {
            if (!$sel || !$sel.value){ alert('複製元のロードアウトを選択してください'); return; }
            var base = $sel.value;
            var cur = ZWGadgets.getActiveLoadout ? ZWGadgets.getActiveLoadout() : null;
            // 現在の配置を採取して別名保存（UI入力があればそれを使う）
            var nm = ($name && $name.value || (base + ' copy')).trim();
            if (!nm){ alert('複製先の名前を入力してください'); return; }
            // いったん対象を適用→現構成を採取→別名定義
            ZWGadgets.applyLoadout(base);
            var captured = ZWGadgets.captureCurrentLoadout ? ZWGadgets.captureCurrentLoadout(nm) : null;
            if (!captured){ alert('ロードアウトの採取に失敗しました'); return; }
            ZWGadgets.defineLoadout(nm, captured);
            ZWGadgets.applyLoadout(nm);
            refreshLoadoutUI(nm);
          } catch(e){ console.error('duplicate loadout failed', e); }
        });
      }
      if ($del){
        $del.addEventListener('click', function(){
          try {
            if ($sel && $sel.value){
              var active = ZWGadgets.getActiveLoadout ? ZWGadgets.getActiveLoadout().name : '';
              if ($sel.value === active){
                alert('アクティブなロードアウトは削除できません');
                return;
              }
              if (!confirm('選択中のロードアウトを削除しますか？')) return;
              ZWGadgets.deleteLoadout($sel.value);
              refreshLoadoutUI(active);
            }
          } catch(e){ console.error('delete loadout failed', e); }
        });
      }
      // 初期描画
      refreshLoadoutUI();
      // 状態変化時に更新
      window.addEventListener('ZWLoadoutsChanged', function(){ refreshLoadoutUI(); });
      window.addEventListener('ZWLoadoutApplied', function(){ refreshLoadoutUI(); });
      window.addEventListener('ZWLoadoutDeleted', function(){ refreshLoadoutUI(); });
    } catch(_) {}

    emit('ZWGadgetsReady', { loadout: ZWGadgets.getActiveLoadout ? ZWGadgets.getActiveLoadout() : null });
    // Wire import/export controls if present
    try {
      var expBtn = document.getElementById('gadget-export');
      var impBtn = document.getElementById('gadget-import');
      var inp = document.getElementById('gadget-prefs-input');
      if (expBtn) {
        expBtn.addEventListener('click', function(){
          try {
            var json = ZWGadgets.exportPrefs();
            var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            var d = new Date();
            var pad = function(n){ return (n<10?'0':'')+n; };
            var name = 'gadgets_prefs_' + d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.json';
            a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(function(){ URL.revokeObjectURL(url); }, 0);
          } catch(e) { /* ignore */ }
        });
      }
      if (impBtn && inp) {
        impBtn.addEventListener('click', function(){ try { inp.click(); } catch(_) {} });
        inp.addEventListener('change', function(ev){
          try {
            var file = ev.target && ev.target.files && ev.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(){
              try {
                var ok = ZWGadgets.importPrefs(String(reader.result||''));
                if (!ok) { console.warn('Import failed: invalid file'); }
              } catch(e) { console.warn('Import failed:', e); }
              try { inp.value = ''; } catch(_) {}
            };
            reader.onerror = function(){ try { inp.value=''; } catch(_) {} };
            reader.readAsText(file, 'utf-8');
          } catch(_) { try { inp.value=''; } catch(__) {} }
        });
      }
    } catch(_) {}
  });
})();
