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

      function buildOrder(){
        var p = loadPrefs();
        var names = self._list.map(function(x){ return x.name||''; });
        var eff = [];
        for (var i=0;i<p.order.length;i++){ if (names.indexOf(p.order[i])>=0 && eff.indexOf(p.order[i])<0) eff.push(p.order[i]); }
        for (var j=0;j<names.length;j++){ if (eff.indexOf(names[j])<0) eff.push(names[j]); }
        return { order: eff, prefs: p };
      }

      function render(){
        var state = buildOrder();
        var order = state.order, prefs = state.prefs;
        // clear
        while (root.firstChild) root.removeChild(root.firstChild);
        // render all
        for (var k=0; k<order.length; k++){
          var name = order[k];
          var g = null;
          for (var t=0; t<self._list.length; t++){ if ((self._list[t].name||'')===name){ g=self._list[t]; break; } }
          if (!g) continue;
          try {
            var wrap = document.createElement('section');
            wrap.className = 'gadget';
            wrap.dataset.name = name;
            wrap.setAttribute('draggable', 'true');

            var head = document.createElement('div');
            head.className = 'gadget-head';
            var toggleBtn = document.createElement('button'); toggleBtn.type='button'; toggleBtn.className='gadget-toggle'; toggleBtn.textContent = (prefs.collapsed[name] ? '▶' : '▼');
            var title = document.createElement('h4'); title.className='gadget-title'; title.textContent = name;
            var upBtn = document.createElement('button'); upBtn.type='button'; upBtn.className='gadget-move-up small'; upBtn.textContent='↑'; upBtn.title='上へ';
            var downBtn = document.createElement('button'); downBtn.type='button'; downBtn.className='gadget-move-down small'; downBtn.textContent='↓'; downBtn.title='下へ';
            var settingsBtn = null;
            if (self._settings[name]){
              settingsBtn = document.createElement('button');
              settingsBtn.type='button'; settingsBtn.className='gadget-settings-btn small'; settingsBtn.title='設定'; settingsBtn.textContent='⚙';
            }
            head.appendChild(toggleBtn); head.appendChild(title);
            if (settingsBtn) head.appendChild(settingsBtn);
            head.appendChild(upBtn); head.appendChild(downBtn);
            // styles moved to CSS (.gadget-head)
            wrap.appendChild(head);

            var body = document.createElement('div');
            body.className = 'gadget-body';
            if (prefs.collapsed[name]) body.style.display = 'none';
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
            toggleBtn.addEventListener('click', function(n, b, btn){ return function(){
              try {
                var p = loadPrefs(); p.collapsed = p.collapsed||{}; p.collapsed[n] = !p.collapsed[n]; savePrefs(p);
                btn.textContent = (p.collapsed[n] ? '▶' : '▼');
                b.style.display = p.collapsed[n] ? 'none' : '';
              } catch(_) {}
            }; }(name, body, toggleBtn));

            upBtn.addEventListener('click', function(n){ return function(){ self.move(n, 'up'); }; }(name));
            downBtn.addEventListener('click', function(n){ return function(){ self.move(n, 'down'); }; }(name));

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

            // drag and drop reorder
            wrap.addEventListener('dragstart', function(ev){ try { wrap.classList.add('is-dragging'); ev.dataTransfer.setData('text/gadget-name', name); ev.dataTransfer.effectAllowed='move'; } catch(_) {} });
            wrap.addEventListener('dragend', function(){ try { wrap.classList.remove('is-dragging'); } catch(_) {} });
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
                var names = self._list.map(function(x){ return x.name||''; });
                var eff = [];
                for (var i=0;i<p.order.length;i++){ if (names.indexOf(p.order[i])>=0 && eff.indexOf(p.order[i])<0) eff.push(p.order[i]); }
                for (var j=0;j<names.length;j++){ if (eff.indexOf(names[j])<0) eff.push(names[j]); }
                var sIdx = eff.indexOf(src), dIdx = eff.indexOf(dst);
                if (sIdx<0 || dIdx<0) return;
                // move src before dst
                eff.splice(dIdx, 0, eff.splice(sIdx,1)[0]);
                p.order = eff;
                savePrefs(p);
                try { self._renderLast && self._renderLast(); } catch(_) {}
              } catch(_) {}
            });

            root.appendChild(wrap);
          } catch(e) { /* ignore per gadget */ }
        }
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
  });
})();
