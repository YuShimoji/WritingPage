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
          structure: ['Documents','Outline','SnapshotManager'],
          typography: ['EditorLayout'],
          assist: ['Clock','WritingGoal','PrintSettings','ChoiceTools']
        }
      },
      'vn-layout': {
        label: 'ビジュアルノベル',
        groups: {
          structure: ['Documents','Outline','SnapshotManager'],
          typography: ['EditorLayout'],
          assist: ['Clock','WritingGoal','PrintSettings','ChoiceTools']
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

  class ZWGadgets {
    constructor() {
      this._list = [];
      this._settings = {};
      this._renderers = {};
      this._roots = {};
      this._loadouts = null;
      this._activeGroup = 'assist';
      this._defaults = {};
      this._renderPending = null;
    }

    _ensureLoadouts(){
      if (!this._loadouts) this._loadouts = loadLoadouts();
      return this._loadouts;
    }
    _applyLoadoutEntry(entry){
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
        var current = Array.isArray(item.groups) ? item.groups.slice() : [];
        item.groups = map[item.name] ? map[item.name].slice() : (current.length ? current : fallback);
      }
    }
    _getActiveEntry(){
      var data = this._ensureLoadouts();
      return data.entries[data.active] || { groups: normaliseGroups({}) };
    }
    _getActiveNames(){
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
    }
    register(name, factory, options){
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
    }
    registerSettings(name, factory){
      try { this._settings[String(name||'')] = factory; } catch(_) {}
    }
    defineLoadout(name, config){
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
    }
    listLoadouts(){
      var data = this._ensureLoadouts();
      return Object.keys(data.entries).map(function(key){
        var entry = data.entries[key] || {};
        return { name: key, label: entry.label || key };
      });
    }
    applyLoadout(name){
      var data = this._ensureLoadouts();
      if (!name || !data.entries[name]) return false;
      data.active = name;
      saveLoadouts(data);
      this._loadouts = loadLoadouts();
      this._applyLoadoutEntry(this._loadouts.entries[name]);
      try { this._renderLast && this._renderLast(); } catch(_) {}
      emit('ZWLoadoutApplied', { name: name });
      return true;
    }
    deleteLoadout(name){
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
    }
    getActiveLoadout(){
      var data = this._ensureLoadouts();
      var entry = data.entries[data.active] || {};
      this._applyLoadoutEntry(entry);
      return {
        name: data.active,
        label: entry.label || data.active,
        entry: clone(entry)
      };
    }
    captureCurrentLoadout(label){
      var groups = { structure: [], typography: [], assist: [] };
      var roots = this._roots || {};
      var _self = this;
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
    }
    setActiveGroup(group){
      var self = this;
      if (!group) return;
      if (self._activeGroup === group) return; // すでにactiveならスキップ
      self._activeGroup = group;
      emit('ZWLoadoutGroupChanged', { group: group });
      // requestAnimationFrameで遅延実行して連続呼び出しを防ぐ
      if (self._renderPending) cancelAnimationFrame(self._renderPending);
      self._renderPending = requestAnimationFrame(function(){
        try { self._renderLast && self._renderLast(); } catch(_) {}
        self._renderPending = null;
      });
    }

    getPrefs(){
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

    setPrefs(p){
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p||{})); } catch(_) {}
    }

    getSettings(name){
      try {
        var p = this.getPrefs();
        return (p.settings && p.settings[name]) || {};
      } catch(_) { return {}; }
    }

    setSetting(name, key, value){
      try {
        var p = this.getPrefs();
        p.settings = p.settings || {};
        var s = p.settings[name] = p.settings[name] || {};
        s[key] = value;
        this.setPrefs(p);
        // Emit event
        try {
          window.dispatchEvent(new CustomEvent('ZWGadgetSettingsChanged', {
            detail: { name: name, key: key, value: value, settings: s }
          }));
        } catch(_) {}
      } catch(_) {}
    }

    listLoadouts(){
      var data = this._ensureLoadouts();
      return Object.keys(data.entries).map(function(key){
        var entry = data.entries[key] || {};
        return { name: key, label: entry.label || key };
      });
    }

    applyLoadout(name){
      var data = this._ensureLoadouts();
      if (!name || !data.entries[name]) return false;
      data.active = name;
      saveLoadouts(data);
      this._loadouts = loadLoadouts();
      this._applyLoadoutEntry(this._loadouts.entries[name]);
      return true;
    }

    getActiveLoadout(){
      var data = this._ensureLoadouts();
      var entry = data.entries[data.active] || {};
      this._applyLoadoutEntry(entry);
      return {
        name: data.active,
        label: entry.label || data.active,
        entry: clone(entry)
      };
    }
    assignGroups(name, groups){
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
    }
    getPrefs(){ return loadPrefs(); }
    setPrefs(p){ savePrefs(p||{ order: [], collapsed: {}, settings: {} }); try { this._renderLast && this._renderLast(); } catch(_) {} }
    getSettings(name){ try { var p = loadPrefs(); return (p.settings && p.settings[name]) || {}; } catch(_) { return {}; } }
    setSetting(name, key, value){
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
    }
    exportPrefs(){
      try {
        var p = loadPrefs();
        return JSON.stringify(p || { order: [], collapsed: {}, settings: {} }, null, 2);
      } catch(_) { return '{}'; }
    }
    importPrefs(obj){
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
    }
    move(name, dir){
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
    }
    toggle(name){
      try {
        var p = loadPrefs();
        p.collapsed = p.collapsed || {};
        p.collapsed[name] = !p.collapsed[name];
        savePrefs(p);
        try { this._renderLast && this._renderLast(); } catch(_) {}
      } catch(_) {}
    }
    init(selector, options){
      var self = this;
      var opts = options && typeof options === 'object' ? options : {};
      var sel = selector || '#gadgets-panel';
      var root = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!root) return;
      var group = opts.group || 'assist';
      this._roots[group] = root;
      if (!this._activeGroup) this._activeGroup = group;

      // Create render function
      var self = this;
      this._renderers[group] = function(){
        try {
          // Clear existing gadgets
          root.innerHTML = '';
          
          // Get active gadget names for this group
          var allowedNames = self._getActiveNames();
          
          // Render each active gadget
          self._list.forEach(function(entry){
            if (!entry || !entry.groups || entry.groups.indexOf(group) === -1) return;
            if (allowedNames.indexOf(entry.name) === -1) return;
            
            var wrapper = document.createElement('div');
            wrapper.className = 'gadget-wrapper';
            wrapper.setAttribute('data-gadget-name', entry.name);
            
            var gadgetEl = document.createElement('div');
            gadgetEl.className = 'gadget';
            
            try {
              var api = {
                get: function(key, def){ return self.getSetting(entry.name, key, def); },
                set: function(key, val){ self.setSetting(entry.name, key, val); }
              };
              entry.factory(gadgetEl, api);
            } catch(e) {
              console.error('Gadget render failed:', entry.name, e);
              gadgetEl.textContent = 'ガジェットの読み込みに失敗しました。';
            }
            
            wrapper.appendChild(gadgetEl);
            root.appendChild(wrapper);
          });
          
          // Replace icons after rendering
          self.replaceGadgetSettingsWithIcons();
        } catch(e) {
          console.error('Renderer error for group:', group, e);
        }
      };

      this._renderers[group]();
    }

    _renderLast(){
      var keys = Object.keys(this._renderers || {});
      for (var i=0; i<keys.length; i++){
        var fn = this._renderers[keys[i]];
        if (typeof fn === 'function') fn();
      }

      // Icon replacement
      this.replaceGadgetSettingsWithIcons();
    }
    register(name, factory, options){
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
    }

    registerSettings(name, factory){
      try { this._settings[String(name||'')] = factory; } catch(_) {}
    }

    _ensureLoadouts(){
      if (this._loadoutsManager) {
        return this._loadoutsManager._ensureLoadouts();
      }
      return { active: 'novel-standard', entries: {} };
    }
    _applyLoadoutEntry(entry){
      // Delegate to loadouts manager
      if (this._loadoutsManager) {
        this._loadoutsManager._applyLoadoutEntry(entry);
      }
    }
    _getActiveNames(){
      if (this._loadoutsManager) {
        return this._loadoutsManager._getActiveNames();
      }
      return [];
    }

    move(name, direction){
      try {
        var p = loadPrefs();
        p.order = p.order || [];
        var idx = p.order.indexOf(name);
        if (idx < 0) return;
        var newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= p.order.length) return;
        p.order.splice(idx, 1);
        p.order.splice(newIdx, 0, name);
        savePrefs(p);
        if (this._renderer) {
          this._renderer._scheduleRender();
        }
      } catch(_) {}
    }

    toggle(name){
      try {
        var p = loadPrefs();
        p.collapsed = p.collapsed || {};
        p.collapsed[name] = !p.collapsed[name];
        savePrefs(p);
        if (this._renderer) {
          this._renderer._scheduleRender();
        }
      } catch(_) {}
    }

    assignGroups(name, groups){
      if (!name) return;
      var normalized = normalizeList(groups || ['assist']);
      if (!normalized.length) normalized = ['assist'];
      for (var i=0; i<this._list.length; i++){
        if ((this._list[i].name || '') === name){
          this._list[i].groups = normalized;
          break;
        }
      }
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

  }

  // Instantiate and expose ZWGadgets
  var ZWGadgetsInstance = new ZWGadgets();
  try { window.ZWGadgets = ZWGadgetsInstance; } catch(_) {}

  // Outline gadget (構造)
  ZWGadgetsInstance.register('Outline', function(el){
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
          var up = document.createElement('button'); up.type='button'; up.className='small btn-move'; up.setAttribute('data-dir','up'); up.setAttribute('data-index', String(i)); up.textContent='上へ'; up.title='上へ';
          var down = document.createElement('button'); down.type='button'; down.className='small btn-move'; down.setAttribute('data-dir','down'); down.setAttribute('data-index', String(i)); down.textContent='下へ'; down.title='下へ';
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

  ZWGadgetsInstance.register('Documents', function(el){
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

  ZWGadgetsInstance.register('OutlineQuick', function(el){
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

      levels.forEach(function(level, _idx){
        var _btn3 = document.createElement('button');
        _btn3.type = 'button';
        _btn3.className = 'outline-btn small';
        _btn3.textContent = levelLabels[_idx] || level.trim();
        _btn3.addEventListener('click', function(){
          try {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertTextAtCursor === 'function') {
              window.ZenWriterEditor.insertTextAtCursor(level + '\n\n');
            }
          } catch(e){ console.error('insert outline failed', e); }
        });
        insertContainer.appendChild(_btn3);
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

        var head = document.createElement('div');
        head.className = 'gadget-head';
        head.style.display = 'flex';
        head.style.alignItems = 'center';
        head.style.justifyContent = 'space-between';
        head.style.padding = '6px 8px';
        head.style.cursor = 'pointer';
        head.style.userSelect = 'none';
        var title = document.createElement('span');
        title.className = 'gadget-title';
        title.textContent = label;
        title.style.fontWeight = 'bold';
        title.style.flex = '1';
        var toggleBtn = document.createElement('button');
        toggleBtn.className = 'gadget-toggle-btn';
        toggleBtn.textContent = '折りたたみ';
        toggleBtn.style.border = 'none';
        toggleBtn.style.background = 'none';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.addEventListener('click', function(ev){
          ev.stopPropagation();
          row.classList.toggle('collapsed');
          toggleBtn.textContent = row.classList.contains('collapsed') ? '展開' : '折りたたみ';
        });
        var settingsBtn = document.createElement('button');
        settingsBtn.className = 'gadget-settings-btn small';
        settingsBtn.textContent = '設定';
        settingsBtn.title = '設定';
        head.appendChild(title);
        head.appendChild(toggleBtn);
        head.appendChild(settingsBtn);
        row.appendChild(head);

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
        upBtn.textContent = '上へ';
        upBtn.style.width = '24px';
        upBtn.style.height = '24px';
        upBtn.addEventListener('click', function(){ moveLevel(row, -1); });

        var downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = 'small';
        downBtn.textContent = '下へ';
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
  }, { groups: ['structure'], title: 'クイックアウトライン' });

  ZWGadgetsInstance.register('TypographyThemes', function(el){
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

      var makeRow = function(labelText, control){
        var row = document.createElement('label');
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '4px';
        row.textContent = labelText;
        row.appendChild(control);
        return row;
      };

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
        customPresets.forEach(function(preset, _idx){
          var _btn2 = document.createElement('button');
          _btn2.type = 'button';
          _btn2.className = 'small';
          _btn2.textContent = preset.name;
          _btn2.addEventListener('click', function(){
            theme.applyCustomColors(preset.bg, preset.text, true);
            refreshState();
          });
          paletteSection.appendChild(_btn2);
        });
      }

      // Font settings
      var fontSection = makeSection('フォント');
      var fontSelect = document.createElement('select');
      var fonts = [
        { value: '"Noto Serif JP", serif', label: 'Noto Serif JP' },
        { value: '"Yu Mincho", "YuMincho", serif', label: '游明朝' },
        { value: '"Hiragino Mincho ProN", serif', label: 'ヒラギノ明朝' }
      ];
      fonts.forEach(function(f){ var opt=document.createElement('option'); opt.value=f.value; opt.textContent=f.label; fontSelect.appendChild(opt); });
      fontSection.appendChild(makeRow('フォントファミリー', fontSelect));

      var fontSizeInput = document.createElement('input');
      fontSizeInput.type = 'range'; fontSizeInput.min = '12'; fontSizeInput.max = '32'; fontSizeInput.step = '1'; fontSizeInput.value = settings.fontSize || 16;
      var fontSizeLabel = document.createElement('div');
      fontSizeLabel.style.fontSize = '0.85rem'; fontSizeLabel.style.opacity = '0.8';
      fontSizeLabel.textContent = 'フォントサイズ: ' + fontSizeInput.value + 'px';
      fontSizeInput.addEventListener('input', function(e){
        fontSizeLabel.textContent = 'フォントサイズ: ' + e.target.value + 'px';
        theme.applyFontSettings(fontSelect.value, parseFloat(e.target.value), parseFloat(lineHeightInput.value), parseInt(uiFontSizeInput.value || e.target.value, 10), parseInt(editorFontSizeInput.value || e.target.value, 10));
        refreshState();
      });
      fontSection.appendChild(makeRow('本文フォントサイズ', fontSizeInput));

      var uiFontSizeInput = document.createElement('input');
      uiFontSizeInput.type = 'range'; uiFontSizeInput.min = '12'; uiFontSizeInput.max = '32'; uiFontSizeInput.step = '1'; uiFontSizeInput.value = settings.uiFontSize || settings.fontSize || 16;
      var uiFontSizeLabel = document.createElement('div');
      uiFontSizeLabel.style.fontSize = '0.85rem'; uiFontSizeLabel.style.opacity = '0.8';
      uiFontSizeLabel.textContent = 'UIフォントサイズ: ' + uiFontSizeInput.value + 'px';
      uiFontSizeInput.addEventListener('input', function(e){
        uiFontSizeLabel.textContent = 'UIフォントサイズ: ' + e.target.value + 'px';
        theme.applyFontSettings(fontSelect.value, parseFloat(fontSizeInput.value), parseFloat(lineHeightInput.value), parseInt(e.target.value, 10), parseInt(editorFontSizeInput.value, 10));
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
        theme.applyFontSettings(fontSelect.value, parseFloat(fontSizeInput.value), parseFloat(lineHeightInput.value), parseInt(uiFontSizeInput.value, 10), parseInt(e.target.value, 10));
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
        theme.applyFontSettings(fontSelect.value, parseFloat(fontSizeInput.value), parseFloat(e.target.value), parseInt(uiFontSizeInput.value, 10), parseInt(editorFontSizeInput.value, 10));
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

      refreshState();

      var refreshState = function(){
        try {
          var latest = storage.loadSettings();
          if (!latest) return;
          fontSelect.value = latest.fontFamily || fonts[0].value;
          fontSizeInput.value = latest.fontSize || 16;
          fontSizeLabel.textContent = 'フォントサイズ: ' + fontSizeInput.value + 'px';
          uiFontSizeInput.value = latest.uiFontSize || fontSizeInput.value;
          uiFontSizeLabel.textContent = 'UIフォントサイズ: ' + uiFontSizeInput.value + 'px';
          editorFontSizeInput.value = latest.editorFontSize || fontSizeInput.value;
          editorFontSizeLabel.textContent = 'エディタフォントサイズ: ' + editorFontSizeInput.value + 'px';
          lineHeightInput.value = latest.lineHeight || 1.6;
          lineHeightLabel.textContent = '行間: ' + lineHeightInput.value;
          bgInput.value = latest.bgColor || '#ffffff';
          textInput.value = latest.textColor || '#333333';
        } catch(e){ console.error('refreshState failed', e); }
      };

      window.addEventListener('ZWLoadoutsChanged', refreshState);
      window.addEventListener('ZWLoadoutApplied', refreshState);
      window.addEventListener('ZenWriterSettingsChanged', refreshState);
    } catch(e) {
      console.error('TypographyThemes gadget failed:', e);
      try { el.textContent = 'タイポ設定ガジェットの初期化に失敗しました。'; } catch(e) { void e; }
    }
  }, { groups: ['typography'], title: 'テーマ & フォント' });

  ZWGadgetsInstance.register('HUDSettings', function(el){
    try {
      var storage = window.ZenWriterStorage;
      if (!storage || typeof storage.loadSettings !== 'function' || typeof storage.saveSettings !== 'function') {
        var warn = document.createElement('p');
        warn.textContent = 'HUD設定は利用できません。';
        warn.style.opacity = '0.7'; warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      var loadHud = function(){
        var settings = storage.loadSettings() || {};
        return settings.hud || {};
      };
      var saveHud = function(patch){
        var settings = storage.loadSettings() || {};
        settings.hud = Object.assign({}, settings.hud || {}, patch || {});
        storage.saveSettings(settings);
        try {
          if (window.ZenWriterHUD && typeof window.ZenWriterHUD.updateFromSettings === 'function') {
            window.ZenWriterHUD.updateFromSettings();
          }
        } catch(e) { void e; }
      };

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
      var clampDuration = function(v){ var n = parseInt(v,10); if (isNaN(n)) return 1200; return Math.max(300, Math.min(5000, n)); };
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
      var setOpacity = function(val){
        var num = Math.max(0, Math.min(1, parseFloat(val)));
        opacityLabel.textContent = '不透明度: ' + num;
        saveHud({ opacity: num });
      };
      opacity.addEventListener('input', function(e){ setOpacity(e.target.value); });
      opacity.addEventListener('change', function(e){ setOpacity(e.target.value); });
      var opacityRow = document.createElement('div');
      opacityRow.style.display = 'flex';
      opacityRow.style.flexDirection = 'column';
      opacityRow.style.gap = '4px';
      opacityRow.appendChild(opacityLabel);
      opacityRow.appendChild(opacity);
      wrap.appendChild(opacityRow);

      // 幅（px）
      var widthInput = document.createElement('input');
      widthInput.type = 'number'; widthInput.min = '120'; widthInput.max = '800'; widthInput.step = '10';
      widthInput.value = hud.width || 240;
      var clampWidth = function(v){ var n = parseInt(v,10); if (isNaN(n)) return 240; return Math.max(120, Math.min(800, n)); };
      var widthHandler = function(e){ saveHud({ width: clampWidth(e.target.value) }); };
      widthInput.addEventListener('change', widthHandler);
      widthInput.addEventListener('input', widthHandler);
      wrap.appendChild(makeRow('幅（px）', widthInput));

      // フォントサイズ（px）
      var fontSizeNum = document.createElement('input');
      fontSizeNum.type = 'number'; fontSizeNum.min = '10'; fontSizeNum.max = '24'; fontSizeNum.step = '1';
      fontSizeNum.value = hud.fontSize || 14;
      var clampFontPx = function(v){ var n = parseInt(v,10); if (isNaN(n)) return 14; return Math.max(10, Math.min(24, n)); };
      var fontHandler = function(e){ saveHud({ fontSize: clampFontPx(e.target.value) }); };
      fontSizeNum.addEventListener('change', fontHandler);
      fontSizeNum.addEventListener('input', fontHandler);
      wrap.appendChild(makeRow('フォントサイズ（px）', fontSizeNum));

      var testBtn = document.createElement('button');
      testBtn.type = 'button'; testBtn.className = 'small'; testBtn.textContent = 'HUDテスト表示';
      testBtn.addEventListener('click', function(){
        try {
          if (window.ZenWriterHUD && typeof window.ZenWriterHUD.publish === 'function') {
            window.ZenWriterHUD.publish('HUDテスト表示');
          }
        } catch(e) { void e; }
      });
      wrap.appendChild(testBtn);

      el.appendChild(wrap);
    } catch(e) {
      console.error('HUDSettings gadget failed:', e);
      try { el.textContent = 'HUD設定ガジェットの初期化に失敗しました。'; } catch(e) { void e; }
    }
  }, { groups: ['assist'], title: 'HUD設定' });

  // Writing Goal gadget
  ZWGadgetsInstance.register('WritingGoal', function(el, api){
    try {
      var storage = window.ZenWriterStorage;
      var editor = window.ZenWriterEditor;
      if (!storage) {
        var warn = document.createElement('p');
        warn.textContent = 'ストレージが利用できないため目標を保存できません。';
        warn.style.opacity = '0.7'; warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      var goal = api && typeof api.get === 'function' ? api.get('goal', {}) : {};

      var wrap = document.createElement('div');
      wrap.className = 'gadget-goal';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '8px';

      var target = document.createElement('input');
      target.type = 'number'; target.min = '0'; target.placeholder = '例: 2000';
      target.value = (typeof goal.target === 'number' ? goal.target : parseInt(goal.target,10) || 0);
      target.addEventListener('input', function(e){ 
        var n = Math.max(0, parseInt(e.target.value,10)||0); 
        var newGoal = Object.assign({}, goal, { target: n });
        if (api && typeof api.set === 'function') api.set('goal', newGoal);
        try{ editor && editor.updateWordCount && editor.updateWordCount(); }catch(_){}
      });

      var deadline = document.createElement('input');
      deadline.type = 'date'; deadline.value = goal.deadline || '';
      deadline.addEventListener('change', function(e){ 
        var newGoal = Object.assign({}, goal, { deadline: e.target.value || '' });
        if (api && typeof api.set === 'function') api.set('goal', newGoal);
      });

      var row1 = document.createElement('label'); row1.style.display='flex'; row1.style.flexDirection='column'; row1.style.gap='4px'; row1.textContent = '目標文字数'; row1.appendChild(target);
      var row2 = document.createElement('label'); row2.style.display='flex'; row2.style.flexDirection='column'; row2.style.gap='4px'; row2.textContent = '締切日'; row2.appendChild(deadline);

      var reset = document.createElement('button'); reset.type='button'; reset.className='small'; reset.textContent='目標をクリア';
      reset.addEventListener('click', function(){ 
        if (confirm('執筆目標をクリアしますか？')){ 
          if (api && typeof api.set === 'function') api.set('goal', {});
          target.value = 0; deadline.value=''; 
          try{ editor && editor.updateWordCount && editor.updateWordCount(); }catch(_){}
        }
      });

      wrap.appendChild(row1);
      wrap.appendChild(row2);
      wrap.appendChild(reset);
      el.appendChild(wrap);
    } catch(e) {
      console.error('WritingGoal gadget failed:', e);
      try { el.textContent = '執筆目標ガジェットの初期化に失敗しました。'; } catch(_) {}
    }
  }, { groups: ['assist'], title: '執筆目標' });

  // Snapshot Manager gadget (legacy assist) — renamed to avoid conflict
  ZWGadgetsInstance.register('SnapshotManagerLegacyAssist', function(el, _api){
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

      var formatTs = function(ts){
        const d = new Date(ts);
        const p = (n)=> String(n).padStart(2,'0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
      };

      var renderSnapshots = function(){
        var list = storage.loadSnapshots() || [];
        el.innerHTML = '';
        if (list.length === 0){
          const empty = document.createElement('div');
          empty.style.opacity = '0.7';
          empty.textContent = 'バックアップはありません';
          el.appendChild(empty);
          return;
        }
        list.forEach(s => {
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
            if (confirm('このバックアップで本文を置き換えます。よろしいですか？')){
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
            if (confirm('このバックアップを削除しますか？')){
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
      };

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
    } catch(e) {
      console.error('SnapshotManager gadget failed:', e);
      try { el.textContent = 'スナップショットガジェットの初期化に失敗しました。'; } catch(_) {}
    }
  }, { groups: ['assist'], title: 'バックアップ' });

  // Print Settings gadget
  ZWGadgetsInstance.register('PrintSettings', function(el, _api){
    try {
      var ed = (window.ZenWriterEditor && window.ZenWriterEditor.editor) || document.getElementById('editor');
      const printBtn = document.createElement('button');
      printBtn.type = 'button';
      printBtn.className = 'small';
      printBtn.textContent = '印刷プレビュー';
      printBtn.addEventListener('click', () => {
        const pv = document.getElementById('print-view');
        if (!pv || !ed) return;
        const text = ed.value || '';
        pv.innerHTML = '';
        const norm = text.replace(/\r\n/g, '\n');
        const blocks = norm.split(/\n{2,}/);
        blocks.forEach(seg => {
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
        const text = ed && ed.value ? ed.value : '';
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
    } catch(e) {
      console.error('PrintSettings gadget failed:', e);
      try { el.textContent = '印刷設定ガジェットの初期化に失敗しました。'; } catch(e2) { void e2; }
    }
  }, { groups: ['assist'], title: 'エクスポート' });

  // (removed) legacy EditorLayout gadget (replaced by new implementation at bottom)

  // SnapshotManager gadget (バックアップ管理)
  ZWGadgetsInstance.register('SnapshotManager', function(el){
    try {
      var storage = window.ZenWriterStorage;
      var editorManager = window.ZenWriterEditor;
      if (!storage || !storage.loadSnapshots) {
        var warn = document.createElement('p'); warn.style.opacity='0.7'; warn.textContent='バックアップ機能を利用できません。'; el.appendChild(warn); return;
      }
      var wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.flexDirection='column'; wrap.style.gap='8px';
      var btn = document.createElement('button'); btn.type='button'; btn.textContent='今すぐ保存'; btn.addEventListener('click', function(){ try {
        var content = (editorManager && editorManager.editor) ? (editorManager.editor.value||'') : (storage.loadContent ? storage.loadContent() : '');
        storage.addSnapshot(content);
        if (editorManager && typeof editorManager.showNotification==='function') editorManager.showNotification('バックアップを保存しました');
        renderList();
      } catch(e){} });
      var listEl = document.createElement('div'); listEl.className='snapshot-list';
      wrap.appendChild(btn); wrap.appendChild(listEl); el.appendChild(wrap);

      function fmt(ts){ var d=new Date(ts); var p=function(n){return String(n).padStart(2,'0');}; return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds()); }
      function renderList(){
        var list = storage.loadSnapshots()||[]; listEl.innerHTML='';
        if (!list.length){ var empty=document.createElement('div'); empty.style.opacity='0.7'; empty.textContent='バックアップはありません'; listEl.appendChild(empty); return; }
        list.forEach(function(s){
          var row=document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.gap='6px'; row.style.margin='4px 0';
          var meta=document.createElement('div'); meta.textContent=fmt(s.ts)+' / '+s.len+' 文字';
          var actions=document.createElement('div');
          var restore=document.createElement('button'); restore.className='small'; restore.textContent='復元'; restore.addEventListener('click', function(){ if (confirm('このバックアップで本文を置き換えます。よろしいですか？')){ if (editorManager && typeof editorManager.setContent==='function'){ editorManager.setContent(s.content||''); if (editorManager.showNotification) editorManager.showNotification('バックアップから復元しました'); } } });
          var del=document.createElement('button'); del.className='small'; del.textContent='削除'; del.addEventListener('click', function(){ storage.deleteSnapshot(s.id); renderList(); });
          actions.appendChild(restore); actions.appendChild(del);
          row.appendChild(meta); row.appendChild(actions); listEl.appendChild(row);
        });
      }
      renderList();
    } catch(e) { try { el.textContent='スナップショットの初期化に失敗しました。'; } catch(_) {} }
  }, { groups: ['structure'], title: 'バックアップ' });

  // ChoiceTools gadget（選択肢ツール）
  ZWGadgetsInstance.register('ChoiceTools', function(el){
    try {
      var ed = window.ZenWriterEditor;
      var wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.flexWrap='wrap'; wrap.style.gap='6px';
      function makeBtn(text, handler){ var b=document.createElement('button'); b.type='button'; b.className='small'; b.textContent=text; b.addEventListener('click', handler); return b; }
      function insertChoice(){ if (!ed || typeof ed.insertTextAtCursor!=='function') return; var tpl=['','[choice title="選択肢"]','- [> 選択肢1](#label1)','- [> 選択肢2](#label2)','[/choice]',''].join('\n'); ed.insertTextAtCursor(tpl); if (ed.showNotification) ed.showNotification('選択肢ブロックを挿入しました'); }
      function insertLabel(){ if (!ed || typeof ed.insertTextAtCursor!=='function') return; var name=prompt('ラベルIDを入力','label1'); if (name===null) return; var tpl=['','[label id="'+String((name||'label1').trim())+'"]','', '[/label]',''].join('\n'); ed.insertTextAtCursor(tpl); if (ed.showNotification) ed.showNotification('ラベルを挿入しました'); }
      function insertJump(){ if (!ed || typeof ed.insertTextAtCursor!=='function') return; var to=prompt('ジャンプ先ラベルIDを入力','label1'); if (to===null) return; var tpl='\n[jump to="'+String((to||'label1').trim())+'"]\n'; ed.insertTextAtCursor(tpl); if (ed.showNotification) ed.showNotification('ジャンプを挿入しました'); }
      wrap.appendChild(makeBtn('選択肢ブロック', insertChoice));
      wrap.appendChild(makeBtn('ラベル', insertLabel));
      wrap.appendChild(makeBtn('ジャンプ', insertJump));
      el.appendChild(wrap);
    } catch(e){ try { el.textContent='選択肢ツールの初期化に失敗しました。'; } catch(_) {} }
  }, { groups: ['assist'], title: '選択肢' });

  // Images gadget (insert/list/remove)
  ZWGadgetsInstance.register('Images', function(el){
    try {
      var API = window.ZenWriterImages;
      var root = document.createElement('div');
      root.style.display = 'grid';
      root.style.gap = '6px';

      var urlRow = document.createElement('div');
      var urlInput = document.createElement('input'); urlInput.type='url'; urlInput.placeholder='画像URLを入力';
      var addUrlBtn = document.createElement('button'); addUrlBtn.type='button'; addUrlBtn.className='small'; addUrlBtn.textContent='URL追加';
      urlRow.appendChild(urlInput); urlRow.appendChild(addUrlBtn);

      var fileRow = document.createElement('div');
      var fileInput = document.createElement('input'); fileInput.type='file'; fileInput.accept='image/*';
      fileRow.appendChild(fileInput);

      var list = document.createElement('div'); list.style.display='grid'; list.style.gap='6px';

      function showEditDialog(id, it){
        try {
          // 簡易ダイアログ
          var altInput = document.createElement('input'); altInput.type='text'; altInput.placeholder='Altテキスト'; altInput.value=it.alt||'';
          var widthInput = document.createElement('input'); widthInput.type='number'; widthInput.min='100'; widthInput.max='800'; widthInput.value=it.width||240;
          var alignSelect = document.createElement('select');
          ['left','center','right'].forEach(function(a){ var o=document.createElement('option'); o.value=a; o.textContent=a; alignSelect.appendChild(o); });
          alignSelect.value = it.alignment || 'left';
          var saveBtn = document.createElement('button'); saveBtn.type='button'; saveBtn.textContent='保存'; saveBtn.className='small';
          var cancelBtn = document.createElement('button'); cancelBtn.type='button'; cancelBtn.textContent='キャンセル'; cancelBtn.className='small';

          var dialog = document.createElement('div'); dialog.style.position='fixed'; dialog.style.top='50%'; dialog.style.left='50%'; dialog.style.transform='translate(-50%,-50%)'; dialog.style.background='var(--bg-color)'; dialog.style.border='1px solid var(--border-color)'; dialog.style.padding='16px'; dialog.style.zIndex='10000'; dialog.style.display='flex'; dialog.style.flexDirection='column'; dialog.style.gap='8px';
          dialog.appendChild(document.createTextNode('Altテキスト:')); dialog.appendChild(altInput);
          dialog.appendChild(document.createTextNode('幅 (px):')); dialog.appendChild(widthInput);
          dialog.appendChild(document.createTextNode('配置:')); dialog.appendChild(alignSelect);
          var btns = document.createElement('div'); btns.style.display='flex'; btns.style.gap='8px';
          btns.appendChild(saveBtn); btns.appendChild(cancelBtn);
          dialog.appendChild(btns);
          document.body.appendChild(dialog);

          saveBtn.addEventListener('click', function(){
            try {
              API && API.update && API.update(id, { alt: altInput.value, width: parseInt(widthInput.value,10), alignment: alignSelect.value });
              renderList();
              document.body.removeChild(dialog);
            } catch(_) {}
          });
          cancelBtn.addEventListener('click', function(){ document.body.removeChild(dialog); });
        } catch(_) {}
      }

      function renderList(){
        try {
          list.innerHTML='';
          var images = (API && typeof API._load==='function') ? API._load() : [];
          images.forEach(function(it){
            var row = document.createElement('div'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px';
            var thumb = document.createElement('img'); thumb.src=it.src; thumb.alt=it.alt||''; thumb.style.width='40px'; thumb.style.height='40px'; thumb.style.objectFit='cover'; thumb.style.border='1px solid var(--border-color)';
            var name = document.createElement('div'); name.textContent = it.alt || it.id || '(image)'; name.style.flex='1 1 auto'; name.style.fontSize='12px'; name.style.opacity='0.8';
            var editBtn = document.createElement('button'); editBtn.type='button'; editBtn.className='small'; editBtn.textContent='編集'; editBtn.title='プロパティ編集';
            editBtn.addEventListener('click', function(){ showEditDialog(it.id, it); });
            var rm = document.createElement('button'); rm.type='button'; rm.className='small'; rm.textContent='削除';
            rm.addEventListener('click', function(){ try { API && API.remove && API.remove(it.id); renderList(); } catch(_){} });
            row.appendChild(thumb); row.appendChild(name); row.appendChild(editBtn); row.appendChild(rm);
            list.appendChild(row);
          });
        } catch(_) {}
      }

      addUrlBtn.addEventListener('click', function(){
        var val = (urlInput.value||'').trim(); if (!val) return;
        try { API && API.addFromUrl && API.addFromUrl(val); urlInput.value=''; renderList(); } catch(_){}
      });
      fileInput.addEventListener('change', function(){ try { var f=fileInput.files && fileInput.files[0]; if (f && API && API.addFromFile){ API.addFromFile(f); fileInput.value=''; renderList(); } } catch(_){}
      });

      root.appendChild(urlRow);
      root.appendChild(fileRow);
      root.appendChild(list);
      el.appendChild(root);

      renderList();
      try { window.addEventListener('ZWDocumentsChanged', renderList); } catch(_) {}
    } catch(e){ try { el.textContent = '画像ガジェットの初期化に失敗しました。'; } catch(_) {} }
  }, { groups: ['assist'], title: '画像' });

  // EditorLayout settings UI
  ZWGadgetsInstance.registerSettings('EditorLayout', function(el, ctx){
    try {
      var _makeRow = function(labelText, control){
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
  ZWGadgetsInstance.register('Clock', function(el, api){
    try {
      var time = document.createElement('div');
      time.className = 'gadget-clock';
      el.appendChild(time);
      function tick(){
        try {
          var d = new Date();
          var z = function(n){ return (n<10?'0':'')+n; };
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
  ZWGadgetsInstance.registerSettings('Clock', function(el, ctx){
    try {
      var row = document.createElement('label'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='6px';
      var cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!ctx.get('hour24', true);
      var txt = document.createElement('span'); txt.textContent = '24時間表示';
      cb.addEventListener('change', function(){ try { ctx.set('hour24', !!cb.checked); } catch(_) {} });
      row.appendChild(cb); row.appendChild(txt);
      el.appendChild(row);
    } catch(_) {}
  });

  // 旧API (ZWGadgets.addTab/removeTab) は廃止しました

  ZWGadgetsInstance.register('EditorLayout', function(el){
    try {
      var api = arguments[1];
      var wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '8px';

      // 執筆エリア枠表示
      var borderLabel = document.createElement('label');
      borderLabel.innerHTML = '<input type="checkbox" id="editor-border-toggle"> 執筆エリアの枠を表示';
      var borderInput = borderLabel.querySelector('#editor-border-toggle');
      borderInput.checked = api.get('borderVisible', true);
      borderInput.addEventListener('change', function(){
        api.set('borderVisible', this.checked);
        applySettings();
      });

      // 画像プレビュー表示
      var previewLabel = document.createElement('label');
      previewLabel.innerHTML = '<input type="checkbox" id="preview-toggle"> 画像プレビューを表示';
      var previewInput = previewLabel.querySelector('#preview-toggle');
      previewInput.checked = api.get('previewVisible', false);
      previewInput.addEventListener('change', function(){
        api.set('previewVisible', this.checked);
        applySettings();
      });

      // padding
      var paddingLabel = document.createElement('label');
      paddingLabel.textContent = '執筆エリア内余白 (px)';
      var paddingInput = document.createElement('input');
      paddingInput.type = 'range';
      paddingInput.min = '0';
      paddingInput.max = '100';
      paddingInput.value = api.get('editorPadding', 32);
      paddingInput.addEventListener('input', function(){
        api.set('editorPadding', this.value);
        applySettings();
      });

      wrap.appendChild(borderLabel);
      wrap.appendChild(previewLabel);
      wrap.appendChild(paddingLabel);
      wrap.appendChild(paddingInput);
      el.appendChild(wrap);

      function applySettings(){
        var borderVisible = api.get('borderVisible', false);
        var previewVisible = api.get('previewVisible', false);
        var padding = api.get('editorPadding', 32);
        var editor = document.getElementById('editor');
        var preview = document.getElementById('editor-preview');
        if (editor){
          editor.style.border = borderVisible ? '1px solid var(--border-color)' : 'none';
          editor.style.outline = borderVisible ? '' : 'none';
          editor.style.padding = padding + 'px';
        }
        if (preview){
          preview.classList.toggle('editor-preview--collapsed', !previewVisible);
        }
      }

      applySettings();
    } catch(e){
      console.error('EditorLayout gadget failed:', e);
    }
  }, { groups: ['typography'], title: 'エディタレイアウト' });

  // StoryWiki gadget
  ZWGadgetsInstance.register('StoryWiki', function(el){
    try {
        var storage = window.ZenWriterStorage;
        if (!storage || !storage.listWikiPages) {
            el.textContent = 'ストレージが利用できません。';
            return;
        }

        var wrap = document.createElement('div');
        wrap.className = 'gadget-wiki';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '8px';

        // 検索入力
        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Wikiページを検索...';
        searchInput.style.width = '100%';
        searchInput.style.padding = '4px';
        searchInput.style.border = '1px solid var(--border-color)';
        searchInput.style.borderRadius = '4px';

        // 新規作成ボタン
        var createBtn = document.createElement('button');
        createBtn.type = 'button';
        createBtn.className = 'small';
        createBtn.textContent = '+ 新規Wikiページ';
        createBtn.addEventListener('click', function(){
            var title = prompt('Wikiページのタイトルを入力:');
            if (title && title.trim()) {
                var page = storage.createWikiPage(title.trim());
                if (page) renderList();
            }
        });

        // Wikiリスト
        var listContainer = document.createElement('div');
        listContainer.className = 'wiki-list';
        listContainer.style.maxHeight = '300px';
        listContainer.style.overflowY = 'auto';

        var renderList = function(){
            listContainer.innerHTML = '';
            var query = searchInput.value.trim();
            var pages = query ? storage.searchWikiPages(query) : storage.listWikiPages();
            if (!pages || !pages.length) {
                var placeholder = document.createElement('div');
                placeholder.style.opacity = '0.7';
                placeholder.textContent = query ? '検索結果が見つかりません。' : 'Wikiページはまだありません。新規作成してください。';
                listContainer.appendChild(placeholder);
                return;
            }

            pages.forEach(function(page){
                var item = document.createElement('div');
                item.className = 'wiki-item';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'space-between';
                item.style.padding = '6px';
                item.style.border = '1px solid var(--border-color)';
                item.style.borderRadius = '4px';
                item.style.marginBottom = '4px';
                item.style.background = 'var(--bg-color)';

                var title = document.createElement('span');
                title.textContent = page.title;
                title.style.flex = '1';
                title.style.cursor = 'pointer';
                title.style.fontWeight = '500';
                title.addEventListener('click', function(){
                    showPageEditor(page.id);
                });

                var actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.gap = '4px';

                var editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'small';
                editBtn.textContent = '編集';
                editBtn.addEventListener('click', function(){
                    showPageEditor(page.id);
                });

                var deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'small';
                deleteBtn.textContent = '削除';
                deleteBtn.addEventListener('click', function(){
                    if (confirm('このWikiページを削除しますか？')) {
                        storage.deleteWikiPage(page.id);
                        renderList();
                    }
                });

                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);
                item.appendChild(title);
                item.appendChild(actions);
                listContainer.appendChild(item);
            });
        };

        var showPageEditor = function(pageId){
            var page = storage.getWikiPage(pageId);
            if (!page) return;

            var titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.value = page.title;
            titleInput.style.width = '100%';
            titleInput.style.padding = '4px';
            titleInput.style.border = '1px solid var(--border-color)';
            titleInput.style.borderRadius = '4px';

            var contentTextarea = document.createElement('textarea');
            contentTextarea.value = page.content;
            contentTextarea.style.width = '100%';
            contentTextarea.style.height = '200px';
            contentTextarea.style.padding = '4px';
            contentTextarea.style.border = '1px solid var(--border-color)';
            contentTextarea.style.borderRadius = '4px';
            contentTextarea.style.fontFamily = 'monospace';
            contentTextarea.style.resize = 'vertical';

            var tagsInput = document.createElement('input');
            tagsInput.type = 'text';
            tagsInput.value = (page.tags || []).join(', ');
            tagsInput.placeholder = 'タグ（カンマ区切り）';
            tagsInput.style.width = '100%';
            tagsInput.style.padding = '4px';
            tagsInput.style.border = '1px solid var(--border-color)';
            tagsInput.style.borderRadius = '4px';

            var saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'small';
            saveBtn.textContent = '保存';
            saveBtn.addEventListener('click', function(){
                var updates = {
                    title: titleInput.value.trim() || '無題',
                    content: contentTextarea.value,
                    tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
                };
                storage.updateWikiPage(pageId, updates);
                renderList();
                document.body.removeChild(editorDialog);
            });

            var cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'small';
            cancelBtn.textContent = 'キャンセル';
            cancelBtn.addEventListener('click', function(){
                document.body.removeChild(editorDialog);
            });

            var editorDialog = document.createElement('div');
            editorDialog.style.position = 'fixed';
            editorDialog.style.top = '50%';
            editorDialog.style.left = '50%';
            editorDialog.style.transform = 'translate(-50%, -50%)';
            editorDialog.style.background = 'var(--bg-color)';
            editorDialog.style.border = '1px solid var(--border-color)';
            editorDialog.style.borderRadius = '8px';
            editorDialog.style.padding = '16px';
            editorDialog.style.zIndex = '10000';
            editorDialog.style.width = '80%';
            editorDialog.style.maxWidth = '600px';
            editorDialog.style.maxHeight = '80vh';
            editorDialog.style.overflow = 'auto';
            editorDialog.style.display = 'flex';
            editorDialog.style.flexDirection = 'column';
            editorDialog.style.gap = '8px';

            editorDialog.appendChild(document.createTextNode('タイトル:'));
            editorDialog.appendChild(titleInput);
            editorDialog.appendChild(document.createTextNode('内容:'));
            editorDialog.appendChild(contentTextarea);
            editorDialog.appendChild(document.createTextNode('タグ:'));
            editorDialog.appendChild(tagsInput);

            var btns = document.createElement('div');
            btns.style.display = 'flex';
            btns.style.gap = '8px';
            btns.appendChild(saveBtn);
            btns.appendChild(cancelBtn);
            editorDialog.appendChild(btns);

            document.body.appendChild(editorDialog);
        };

        searchInput.addEventListener('input', function(){
            renderList();
        });

        wrap.appendChild(searchInput);
        wrap.appendChild(createBtn);
        wrap.appendChild(listContainer);
        el.appendChild(wrap);

        renderList();
    } catch(e) {
        console.error('StoryWiki gadget failed:', e);
        el.textContent = 'Wikiガジェットの初期化に失敗しました。';
    }
}, { groups: ['wiki'], title: '物語Wiki' });

  // HUDSettings ガジェット
  ZWGadgetsInstance.register('HUDSettings', function(el, _options){
    try {
      el.innerHTML = '';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.gap = '12px';

      var storage = window.ZenWriterStorage;
      if (!storage || !storage.loadSettings) {
        el.textContent = 'ストレージが利用できません';
        return;
      }

      var settings = storage.loadSettings();
      var hud = settings.hud || {};
      var mergedHud = Object.assign({}, {
        position: 'bottom-left',
        duration: 1200,
        bg: '#000000',
        fg: '#ffffff',
        opacity: 0.75,
        message: '',
        pinned: false,
        width: 240,
        fontSize: 14
      }, hud);

      // 位置選択
      var posLabel = document.createElement('label');
      posLabel.textContent = '位置:';
      var posSelect = document.createElement('select');
      posSelect.style.width = '100%';
      posSelect.style.padding = '4px';
      posSelect.style.border = '1px solid var(--border-color)';
      posSelect.style.borderRadius = '4px';
      posSelect.style.background = 'var(--bg-color)';
      posSelect.style.color = 'var(--text-color)';

      ['bottom-left', 'bottom-right', 'top-left', 'top-right'].forEach(function(pos){
        var opt = document.createElement('option');
        opt.value = pos;
        opt.textContent = pos.replace('-', ' ');
        if (mergedHud.position === pos) opt.selected = true;
        posSelect.appendChild(opt);
      });

      // 表示時間
      var durLabel = document.createElement('label');
      durLabel.textContent = 'フェード時間 (ms):';
      var durInput = document.createElement('input');
      durInput.type = 'number';
      durInput.min = '500';
      durInput.max = '5000';
      durInput.step = '100';
      durInput.value = mergedHud.duration;
      durInput.style.width = '100%';
      durInput.style.padding = '4px';
      durInput.style.border = '1px solid var(--border-color)';
      durInput.style.borderRadius = '4px';

      // 背景色
      var bgLabel = document.createElement('label');
      bgLabel.textContent = '背景色:';
      var bgInput = document.createElement('input');
      bgInput.type = 'color';
      bgInput.value = mergedHud.bg;
      bgInput.style.width = '100%';
      bgInput.style.height = '32px';

      // 文字色
      var fgLabel = document.createElement('label');
      fgLabel.textContent = '文字色:';
      var fgInput = document.createElement('input');
      fgInput.type = 'color';
      fgInput.value = mergedHud.fg;
      fgInput.style.width = '100%';
      fgInput.style.height = '32px';

      // 不透明度
      var opLabel = document.createElement('label');
      opLabel.textContent = '不透明度:';
      var opInput = document.createElement('input');
      opInput.type = 'range';
      opInput.min = '0.1';
      opInput.max = '1.0';
      opInput.step = '0.05';
      opInput.value = mergedHud.opacity;
      opInput.style.width = '100%';

      var opValue = document.createElement('span');
      opValue.textContent = Math.round(mergedHud.opacity * 100) + '%';
      opValue.style.fontSize = '12px';
      opValue.style.marginLeft = '8px';

      opInput.addEventListener('input', function(){
        opValue.textContent = Math.round(this.value * 100) + '%';
      });

      // 幅
      var widthLabel = document.createElement('label');
      widthLabel.textContent = '幅 (px):';
      var widthInput = document.createElement('input');
      widthInput.type = 'number';
      widthInput.min = '120';
      widthInput.max = '800';
      widthInput.step = '10';
      widthInput.value = mergedHud.width;
      widthInput.style.width = '100%';
      widthInput.style.padding = '4px';
      widthInput.style.border = '1px solid var(--border-color)';
      widthInput.style.borderRadius = '4px';

      // フォントサイズ
      var fsLabel = document.createElement('label');
      fsLabel.textContent = 'フォントサイズ (px):';
      var fsInput = document.createElement('input');
      fsInput.type = 'number';
      fsInput.min = '10';
      fsInput.max = '24';
      fsInput.step = '1';
      fsInput.value = mergedHud.fontSize;
      fsInput.style.width = '100%';
      fsInput.style.padding = '4px';
      fsInput.style.border = '1px solid var(--border-color)';
      fsInput.style.borderRadius = '4px';

      // メッセージ
      var msgLabel = document.createElement('label');
      msgLabel.textContent = 'メッセージ:';
      var msgInput = document.createElement('input');
      msgInput.type = 'text';
      msgInput.placeholder = 'HUDに表示するメッセージ';
      msgInput.value = mergedHud.message;
      msgInput.style.width = '100%';
      msgInput.style.padding = '4px';
      msgInput.style.border = '1px solid var(--border-color)';
      msgInput.style.borderRadius = '4px';

      // ピン留め
      var pinLabel = document.createElement('label');
      pinLabel.style.display = 'flex';
      pinLabel.style.alignItems = 'center';
      pinLabel.style.gap = '8px';
      var pinInput = document.createElement('input');
      pinInput.type = 'checkbox';
      pinInput.checked = mergedHud.pinned;
      pinLabel.appendChild(pinInput);
      pinLabel.appendChild(document.createTextNode('常に表示'));

      // 保存ボタン
      var saveBtn = document.createElement('button');
      saveBtn.className = 'small';
      saveBtn.textContent = '設定を保存';
      saveBtn.addEventListener('click', function(){
        var updatedHud = {
          position: posSelect.value,
          duration: parseInt(durInput.value) || 1200,
          bg: bgInput.value,
          fg: fgInput.value,
          opacity: parseFloat(opInput.value) || 0.75,
          message: msgInput.value.trim(),
          pinned: pinInput.checked,
          width: parseInt(widthInput.value) || 240,
          fontSize: parseInt(fsInput.value) || 14
        };

        settings.hud = updatedHud;
        storage.saveSettings(settings);

        // HUDに即時反映
        if (window.ZenWriterHUD && window.ZenWriterHUD.applyConfig) {
          window.ZenWriterHUD.applyConfig(updatedHud);
        }

        alert('HUD設定を保存しました');
      });

      // レイアウト
      el.appendChild(posLabel);
      el.appendChild(posSelect);
      el.appendChild(durLabel);
      el.appendChild(durInput);
      el.appendChild(bgLabel);
      el.appendChild(bgInput);
      el.appendChild(fgLabel);
      el.appendChild(fgInput);

      var opRow = document.createElement('div');
      opRow.style.display = 'flex';
      opRow.style.alignItems = 'center';
      opRow.appendChild(opLabel);
      opRow.appendChild(opValue);
      el.appendChild(opRow);
      el.appendChild(opInput);

      el.appendChild(widthLabel);
      el.appendChild(widthInput);
      el.appendChild(fsLabel);
      el.appendChild(fsInput);
      el.appendChild(msgLabel);
      el.appendChild(msgInput);
      el.appendChild(pinLabel);
      el.appendChild(saveBtn);

    } catch(e) {
      console.error('HUDSettings gadget failed:', e);
      el.textContent = 'HUD設定ガジェットの初期化に失敗しました。';
    }
  }, { groups: ['assist'], title: 'HUD設定' });

  // StoryWiki ガジェット
  /*
  ZWGadgetsInstance.register('StoryWiki', function(el, options){
    try {
      el.innerHTML = '';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.gap = '12px';

      var storage = window.ZenWriterStorage;
      if (!storage || !storage.loadWikiPages) {
        el.textContent = 'ストレージが利用できません';
        return;
      }

      // 検索入力
      var searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'ページを検索...';
      searchInput.style.width = '100%';
      searchInput.style.padding = '8px';
      searchInput.style.border = '1px solid var(--border-color)';
      searchInput.style.borderRadius = '4px';
      searchInput.style.background = 'var(--bg-color)';
      searchInput.style.color = 'var(--text-color)';

      // 新規作成ボタン
      var createBtn = document.createElement('button');
      createBtn.className = 'small';
      createBtn.textContent = '新規ページ作成';

      // ページリストコンテナ
      var listContainer = document.createElement('div');
      listContainer.style.flex = '1';
      listContainer.style.overflow = 'auto';
      listContainer.style.border = '1px solid var(--border-color)';
      listContainer.style.borderRadius = '4px';
      listContainer.style.padding = '8px';
      listContainer.style.background = 'var(--bg-color)';

      function renderList(){
        listContainer.innerHTML = '';
        var pages = storage.loadWikiPages() || [];
        var query = searchInput.value.toLowerCase().trim();

        pages.forEach(function(page){
          if (query && !page.title.toLowerCase().includes(query) && !page.content.toLowerCase().includes(query)) {
            return;
          }

          var item = document.createElement('div');
          item.style.padding = '8px';
          item.style.marginBottom = '4px';
          item.style.border = '1px solid var(--border-color)';
          item.style.borderRadius = '4px';
          item.style.background = 'var(--bg-color)';
          item.style.cursor = 'pointer';

          var title = document.createElement('div');
          title.textContent = page.title || '無題';
          title.style.fontWeight = 'bold';
          title.style.marginBottom = '4px';

          var preview = document.createElement('div');
          preview.textContent = (page.content || '').substring(0, 100) + '...';
          preview.style.fontSize = '12px';
          preview.style.opacity = '0.7';

          item.appendChild(title);
          item.appendChild(preview);

          item.addEventListener('click', function(){
            // ページ編集ダイアログを表示
            showPageEditor(page.id);
          });

          listContainer.appendChild(item);
        });

        if (pages.length === 0) {
          listContainer.textContent = 'ページがありません。新規作成ボタンから作成してください。';
          listContainer.style.textAlign = 'center';
          listContainer.style.padding = '40px';
          listContainer.style.opacity = '0.6';
        }
      }

      function showPageEditor(pageId){
        var page = pageId ? storage.getWikiPage(pageId) : null;

        var titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = page ? (page.title || '') : '';
        titleInput.placeholder = 'ページタイトル';
        titleInput.style.width = '100%';
        titleInput.style.padding = '4px';
        titleInput.style.border = '1px solid var(--border-color)';
        titleInput.style.borderRadius = '4px';

        var contentTextarea = document.createElement('textarea');
        contentTextarea.value = page ? (page.content || '') : '';
        contentTextarea.placeholder = 'ページ内容';
        contentTextarea.style.width = '100%';
        contentTextarea.style.height = '200px';
        contentTextarea.style.padding = '4px';
        contentTextarea.style.border = '1px solid var(--border-color)';
        contentTextarea.style.borderRadius = '4px';
        contentTextarea.style.resize = 'vertical';

        var tagsInput = document.createElement('input');
        tagsInput.type = 'text';
        tagsInput.value = page ? ((page.tags || []).join(', ')) : '';
        tagsInput.placeholder = 'タグ（カンマ区切り）';
        tagsInput.style.width = '100%';
        tagsInput.style.padding = '4px';
        tagsInput.style.border = '1px solid var(--border-color)';
        tagsInput.style.borderRadius = '4px';

        var saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'small';
        saveBtn.textContent = '保存';
        saveBtn.addEventListener('click', function(){
          var updates = {
            title: titleInput.value.trim() || '無題',
            content: contentTextarea.value,
            tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
          };
          if (pageId) {
            storage.updateWikiPage(pageId, updates);
          } else {
            storage.createWikiPage(updates);
          }
          renderList();
          document.body.removeChild(editorDialog);
        });

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'small';
        cancelBtn.textContent = 'キャンセル';
        cancelBtn.addEventListener('click', function(){
          document.body.removeChild(editorDialog);
        });

        var editorDialog = document.createElement('div');
        editorDialog.style.position = 'fixed';
        editorDialog.style.top = '50%';
        editorDialog.style.left = '50%';
        editorDialog.style.transform = 'translate(-50%, -50%)';
        editorDialog.style.background = 'var(--bg-color)';
        editorDialog.style.border = '1px solid var(--border-color)';
        editorDialog.style.borderRadius = '8px';
        editorDialog.style.padding = '16px';
        editorDialog.style.zIndex = '10000';
        editorDialog.style.width = '80%';
        editorDialog.style.maxWidth = '600px';
        editorDialog.style.maxHeight = '80vh';
        editorDialog.style.overflow = 'auto';
        editorDialog.style.display = 'flex';
        editorDialog.style.flexDirection = 'column';
        editorDialog.style.gap = '8px';

        editorDialog.appendChild(document.createTextNode('タイトル:'));
        editorDialog.appendChild(titleInput);
        editorDialog.appendChild(document.createTextNode('内容:'));
        editorDialog.appendChild(contentTextarea);
        editorDialog.appendChild(document.createTextNode('タグ:'));
        editorDialog.appendChild(tagsInput);

        var btns = document.createElement('div');
        btns.style.display = 'flex';
        btns.style.gap = '8px';
        btns.appendChild(saveBtn);
        btns.appendChild(cancelBtn);
        editorDialog.appendChild(btns);

        document.body.appendChild(editorDialog);
      }

      createBtn.addEventListener('click', function(){
        showPageEditor(null);
      });

      searchInput.addEventListener('input', function(){
        renderList();
      });

      el.appendChild(searchInput);
      el.appendChild(createBtn);
      el.appendChild(listContainer);

      renderList();
    } catch(e) {
      console.error('StoryWiki gadget failed:', e);
      el.textContent = 'Wikiガジェットの初期化に失敗しました。';
    }
  }, { groups: ['wiki'], title: '物語Wiki' });
  */

  ready(function(){
    // Initialize gadget panels
    ZWGadgetsInstance.init('#gadgets-panel', { group: 'assist' });
    ZWGadgetsInstance.init('#structure-gadgets-panel', { group: 'structure' });
    ZWGadgetsInstance.init('#typography-gadgets-panel', { group: 'typography' });
    ZWGadgetsInstance.init('#wiki-gadgets-panel', { group: 'wiki' });

    // Initialize loadout UI
    var loadoutSelect = document.getElementById('loadout-select');
    var loadoutName = document.getElementById('loadout-name');
    var loadoutSave = document.getElementById('loadout-save');
    var loadoutDuplicate = document.getElementById('loadout-duplicate');
    var loadoutApply = document.getElementById('loadout-apply');
    var loadoutDelete = document.getElementById('loadout-delete');

    // Loadout select change
    if (loadoutSelect) {
      loadoutSelect.addEventListener('change', function() {
        var selected = loadoutSelect.value;
        if (selected && loadoutName) {
          var loadouts = ZWGadgetsInstance.listLoadouts();
          var entry = loadouts.find(function(l) { return l.name === selected; });
          if (entry) {
            loadoutName.value = entry.label || '';
          }
        }
      });
    }

    // Loadout save
    if (loadoutSave) {
      loadoutSave.addEventListener('click', function() {
        var name = loadoutSelect.value;
        var label = loadoutName.value.trim();
        if (!label) {
          alert('ロードアウト名を入力してください');
          return;
        }
        if (!name) {
          name = 'loadout_' + Date.now().toString(36);
        }
        var config = ZWGadgetsInstance.captureCurrentLoadout(label);
        ZWGadgetsInstance.defineLoadout(name, config);
        alert('ロードアウトを保存しました');
        // Update select
        if (loadoutSelect) {
          loadoutSelect.innerHTML = '';
          var loadouts = ZWGadgetsInstance.listLoadouts();
          loadouts.forEach(function(l) {
            var opt = document.createElement('option');
            opt.value = l.name;
            opt.textContent = l.label;
            loadoutSelect.appendChild(opt);
          });
          loadoutSelect.value = name;
        }
      });
    }

    // Loadout duplicate
    if (loadoutDuplicate) {
      loadoutDuplicate.addEventListener('click', function() {
        var selected = loadoutSelect.value;
        if (!selected) {
          alert('複製するロードアウトを選択してください');
          return;
        }
        var loadouts = ZWGadgetsInstance.listLoadouts();
        var entry = loadouts.find(function(l) { return l.name === selected; });
        if (!entry) return;
        var newName = 'loadout_' + Date.now().toString(36);
        var newLabel = (loadoutName.value.trim() || entry.label) + ' (複製)';
        ZWGadgetsInstance.defineLoadout(newName, { label: newLabel, groups: entry.groups || normaliseGroups({}) });
        alert('ロードアウトを複製しました');
        // Update select
        if (loadoutSelect) {
          loadoutSelect.innerHTML = '';
          var loadouts2 = ZWGadgetsInstance.listLoadouts();
          loadouts2.forEach(function(l) {
            var opt = document.createElement('option');
            opt.value = l.name;
            opt.textContent = l.label;
            loadoutSelect.appendChild(opt);
          });
          loadoutSelect.value = newName;
          if (loadoutName) loadoutName.value = newLabel;
        }
      });
    }

    // Loadout apply
    if (loadoutApply) {
      loadoutApply.addEventListener('click', function() {
        var selected = loadoutSelect.value;
        if (!selected) {
          alert('適用するロードアウトを選択してください');
          return;
        }
        var success = ZWGadgetsInstance.applyLoadout(selected);
        if (success) {
          alert('ロードアウトを適用しました');
        } else {
          alert('ロードアウトの適用に失敗しました');
        }
      });
    }

    // Loadout delete
    if (loadoutDelete) {
      loadoutDelete.addEventListener('click', function() {
        var selected = loadoutSelect.value;
        if (!selected) {
          alert('削除するロードアウトを選択してください');
          return;
        }
        if (!confirm('このロードアウトを削除しますか？この操作は元に戻せません。')) {
          return;
        }
        var success = ZWGadgetsInstance.deleteLoadout(selected);
        if (success) {
          alert('ロードアウトを削除しました');
          // Update select
          if (loadoutSelect) {
            loadoutSelect.innerHTML = '';
            var loadouts = ZWGadgetsInstance.listLoadouts();
            loadouts.forEach(function(l) {
              var opt = document.createElement('option');
              opt.value = l.name;
              opt.textContent = l.label;
              loadoutSelect.appendChild(opt);
            });
          }
        } else {
          alert('ロードアウトの削除に失敗しました');
        }
      });
    }

    // Initialize loadout select
    if (loadoutSelect) {
      var loadouts = ZWGadgetsInstance.listLoadouts();
      loadouts.forEach(function(l) {
        var opt = document.createElement('option');
        opt.value = l.name;
        opt.textContent = l.label;
        loadoutSelect.appendChild(opt);
      });
      var active = ZWGadgetsInstance.getActiveLoadout();
      if (active) {
        loadoutSelect.value = active.name;
        if (loadoutName) loadoutName.value = active.label;
      }
    }
  });

})();
