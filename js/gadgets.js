(function(){
  'use strict';

  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  var STORAGE_KEY = 'zenWriter_gadgets:prefs';
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

  var ZWGadgets = {
    _list: [],
    _settings: {},
    register: function(name, factory){
      try { this._list.push({ name: String(name||''), factory: factory }); } catch(_) {}
    },
    registerSettings: function(name, factory){
      try { this._settings[String(name||'')] = factory; } catch(_) {}
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
        try { this._renderLast && this._renderLast(); } catch(_) {}
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
    init: function(selector){
      var self = this;
      var sel = selector || '#gadgets-panel';
      var root = document.querySelector(sel);
      if (!root) return;

      function dispatchRemoved(node){
        try {
          if (!node) return;
          var targets = node.querySelectorAll('.gadget-body');
          for (var i = 0; i < targets.length; i++){
            var target = targets[i];
            try {
              if (typeof Event === 'function') {
                target.dispatchEvent(new Event('removed'));
              } else {
                var legacy = document.createEvent('Event');
                legacy.initEvent('removed', false, false);
                target.dispatchEvent(legacy);
              }
            } catch(_) {}
          }
        } catch(_) {}
      }

      function buildOrder(){
        var p = loadPrefs();
        var names = self._list.map(function(x){ return x.name||''; });
        var eff = [];
        for (var i=0;i<p.order.length;i++){ if (names.indexOf(p.order[i])>=0 && eff.indexOf(p.order[i])<0) eff.push(p.order[i]); }
        for (var j=0;j<names.length;j++){ if (eff.indexOf(names[j])<0) eff.push(names[j]); }
        return { order: eff, prefs: p };
      }

      function normalizeSelector(raw){
        try { return String(raw || '').replace(/\\\./g, '.'); }
        catch(_) { return raw; }
      }

      var sortableInstance = null;

      function applySortable(){
        try {
          if (!root || typeof Sortable === 'undefined' || typeof Sortable.create !== 'function') return;
          if (sortableInstance && typeof sortableInstance.destroy === 'function') {
            sortableInstance.destroy();
            sortableInstance = null;
          }
          var sortableOptions = {
            animation: 140,
            handle: '\\.gadget-handle',
            draggable: 'details\\.gadget',
            dragClass: 'gadget-dragging',
            ghostClass: 'gadget-placeholder',
            onEnd: function(){
              try {
                var nodes = root.querySelectorAll('details.gadget');
                var nextOrder = [];
                for (var i=0; i<nodes.length; i++){
                  var nm = nodes[i].dataset.name || '';
                  if (nm && nextOrder.indexOf(nm) < 0) nextOrder.push(nm);
                }
                var prefs = loadPrefs();
                prefs.order = nextOrder;
                savePrefs(prefs);
                if (self._renderLast) self._renderLast();
              } catch(_) {}
            }
          };
          try {
            sortableOptions.handle = normalizeSelector(sortableOptions.handle);
            sortableOptions.draggable = normalizeSelector(sortableOptions.draggable);
          } catch(_) {}
          sortableInstance = Sortable.create(root, sortableOptions);
        } catch(_) {}
      }

      function renderSettings(name, wrap){
        try {
          if (!self._settings[name]) return;
          var panel = wrap.querySelector('.gadget-settings');
          if (!panel) return;
          if (!wrap.classList.contains('settings-open')){
            panel.innerHTML = '';
            panel.style.display = 'none';
            return;
          }
          panel.style.display = '';
          panel.innerHTML = '';
          var ctxApi = {
            get: function(key, d){ var s = self.getSettings(name); return (key in s) ? s[key] : d; },
            set: function(key, val){ self.setSetting(name, key, val); },
            prefs: function(){ return self.getPrefs(); },
            refresh: function(){ try { self._renderLast && self._renderLast(); } catch(_) {} }
          };
          try { self._settings[name](panel, ctxApi); } catch(_) {}
        } catch(_) {}
      }

      function render(){
        var state = buildOrder();
        var order = state.order, prefs = state.prefs;
        var prev = Array.prototype.slice.call(root.children || []);
        for (var r=0; r<prev.length; r++) dispatchRemoved(prev[r]);
        while (root.firstChild) root.removeChild(root.firstChild);
        for (var k=0; k<order.length; k++){
          var name = order[k];
          var g = null;
          for (var t=0; t<self._list.length; t++){ if ((self._list[t].name||'')===name){ g=self._list[t]; break; } }
          if (!g) continue;
          try {
            var wrap = document.createElement('details');
            wrap.className = 'gadget';
            wrap.dataset.name = name;
            if (!prefs.collapsed[name]) wrap.setAttribute('open', '');

            var summary = document.createElement('summary');
            summary.className = 'gadget-summary';

            var handle = document.createElement('span');
            handle.className = 'gadget-handle';
            handle.setAttribute('aria-label', 'ドラッグで並び替え');
            handle.title = 'ドラッグして並び替え';

            var title = document.createElement('span');
            title.className = 'gadget-title';
            title.textContent = name;

            summary.appendChild(handle);
            summary.appendChild(title);

            var settingsBtn = null;
            if (self._settings[name]){
              settingsBtn = document.createElement('button');
              settingsBtn.type = 'button';
              settingsBtn.className = 'gadget-settings-btn small';
              settingsBtn.title = '設定';
              settingsBtn.textContent = '⚙';
              settingsBtn.addEventListener('click', (function(nm, el){
                return function(evt){
                  try {
                    evt.preventDefault();
                    evt.stopPropagation();
                    el.classList.toggle('settings-open');
                    renderSettings(nm, el);
                  } catch(_) {}
                };
              })(name, wrap));
            }

            if (settingsBtn) summary.appendChild(settingsBtn);
            wrap.appendChild(summary);

            var body = document.createElement('div');
            body.className = 'gadget-body';
            if (typeof g.factory === 'function'){
              try {
                var api = {
                  get: function(key, d){ var s = self.getSettings(name); return (key in s) ? s[key] : d; },
                  set: function(key, val){ self.setSetting(name, key, val); },
                  prefs: function(){ return self.getPrefs(); },
                  refresh: function(){ try { self._renderLast && self._renderLast(); } catch(_) {} }
                };
                g.factory(body, api);
              } catch(_) {}
            }
            wrap.appendChild(body);

            if (self._settings[name]){
              var settingsPanel = document.createElement('div');
              settingsPanel.className = 'gadget-settings';
              wrap.appendChild(settingsPanel);
            }

            wrap.addEventListener('toggle', (function(nm, el){
              return function(){
                try {
                  var prefs = loadPrefs();
                  prefs.collapsed = prefs.collapsed || {};
                  prefs.collapsed[nm] = !el.open;
                  savePrefs(prefs);
                  if (!el.open) {
                    el.classList.remove('settings-open');
                  }
                  renderSettings(nm, el);
                } catch(_) {}
              };
            })(name, wrap));

            root.appendChild(wrap);
          } catch(_) {}
        }
        applySortable();
      }

      self._renderLast = render;
      render();
    }
  };

  // expose
  try { window.ZWGadgets = ZWGadgets; } catch(_) {}

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

  // auto-init when DOM ready
  ready(function(){
    try { ZWGadgets.init('#gadgets-panel'); } catch(_) {}
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
