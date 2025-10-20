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

  // HUD gadget (configures MiniHUD)
  ZWGadgets.register('HUD', function(el){
    try {
      var hasStorage = !!(window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function' && typeof window.ZenWriterStorage.saveSettings === 'function');
      var hasHud = !!(window.ZenWriterHUD && typeof window.ZenWriterHUD.applyConfig === 'function');
      if (!hasStorage || !hasHud) {
        var warn = document.createElement('p');
        warn.textContent = 'HUD機能を初期化できませんでした。ページを再読み込みしてください。';
        el.appendChild(warn);
        return;
      }

      var defaults = (window.ZenWriterStorage.DEFAULT_SETTINGS && window.ZenWriterStorage.DEFAULT_SETTINGS.hud) || {
        position: 'bottom-left',
        duration: 1200,
        bg: '#000000',
        fg: '#ffffff',
        opacity: 0.75,
        message: '',
        pinned: false,
        width: 240,
        fontSize: 14
      };

      function cloneHud(obj){
        var result = {};
        for (var key in defaults){ if (Object.prototype.hasOwnProperty.call(defaults, key)) result[key] = (obj && Object.prototype.hasOwnProperty.call(obj, key)) ? obj[key] : defaults[key]; }
        return result;
      }

      var hud = cloneHud((window.ZenWriterStorage.loadSettings() || {}).hud || {});
      var updating = false;

      function persist(update, opts){
        opts = opts || {};
        hud = Object.assign({}, hud, update || {});
        try {
          var settings = window.ZenWriterStorage.loadSettings() || {};
          settings.hud = Object.assign({}, settings.hud || {}, hud);
          window.ZenWriterStorage.saveSettings(settings);
        } catch(e){ /* ignore persist errors */ }
        if (!opts.silent && window.ZenWriterHUD) {
          try {
            window.ZenWriterHUD.applyConfig(hud);
            window.ZenWriterHUD.refresh();
          } catch(_) {}
        }
        if (!opts.skipSync) syncUI();
      }

      var desc = document.createElement('p');
      desc.textContent = 'HUDに表示する通知メッセージとスタイルを設定します。';
      el.appendChild(desc);

      function makeField(labelText){
        var wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '4px';
        wrapper.style.marginBottom = '10px';
        if (labelText){
          var label = document.createElement('label');
          label.textContent = labelText;
          wrapper.appendChild(label);
        }
        return wrapper;
      }

      var messageField = makeField('メッセージ');
      var messageInput = document.createElement('textarea');
      messageInput.rows = 3;
      messageInput.placeholder = 'HUDに表示するテキスト';
      messageInput.addEventListener('input', function(){
        if (updating) return;
        persist({ message: messageInput.value }, { skipSync: true, silent: !hud.pinned });
      });
      messageField.appendChild(messageInput);
      el.appendChild(messageField);

      var pinnedField = makeField(); pinnedField.style.flexDirection = 'row'; pinnedField.style.alignItems = 'center'; pinnedField.style.gap='6px';
      var pinnedInput = document.createElement('input'); pinnedInput.type='checkbox';
      var pinnedLabel = document.createElement('span'); pinnedLabel.textContent='ピン留め（常時表示）';
      pinnedInput.addEventListener('change', function(){
        if (updating) return;
        persist({ pinned: !!pinnedInput.checked }, { silent: false });
      });
      pinnedField.appendChild(pinnedInput); pinnedField.appendChild(pinnedLabel);
      el.appendChild(pinnedField);

      var positionField = makeField('表示位置');
      var positionSelect = document.createElement('select');
      [
        { value: 'bottom-left', label: '左下' },
        { value: 'bottom-right', label: '右下' },
        { value: 'top-left', label: '左上' },
        { value: 'top-right', label: '右上' }
      ].forEach(function(opt){
        var option = document.createElement('option'); option.value = opt.value; option.textContent = opt.label; positionSelect.appendChild(option);
      });
      positionSelect.addEventListener('change', function(){
        if (updating) return;
        persist({ position: positionSelect.value });
      });
      positionField.appendChild(positionSelect);
      el.appendChild(positionField);

      var durationField = makeField('表示時間 (ms)');
      var durationInput = document.createElement('input'); durationInput.type='number'; durationInput.min='300'; durationInput.max='10000'; durationInput.step='100';
      durationInput.addEventListener('change', function(){
        if (updating) return;
        var val = parseInt(durationInput.value, 10);
        if (isNaN(val) || val <= 0) val = defaults.duration;
        persist({ duration: val });
      });
      durationField.appendChild(durationInput);
      el.appendChild(durationField);

      var widthField = makeField('HUD幅 (px)');
      var widthRange = document.createElement('input'); widthRange.type='range'; widthRange.min='160'; widthRange.max='480'; widthRange.step='10';
      var widthValue = document.createElement('div'); widthValue.style.fontSize='12px'; widthValue.style.opacity='0.8';
      widthRange.addEventListener('input', function(){
        if (updating) return;
        var val = parseInt(widthRange.value, 10);
        persist({ width: val }, { skipSync: true });
        widthValue.textContent = val + 'px';
      });
      widthField.appendChild(widthRange); widthField.appendChild(widthValue);
      el.appendChild(widthField);

      var fontField = makeField('文字サイズ (px)');
      var fontRange = document.createElement('input'); fontRange.type='range'; fontRange.min='10'; fontRange.max='28'; fontRange.step='1';
      var fontValue = document.createElement('div'); fontValue.style.fontSize='12px'; fontValue.style.opacity='0.8';
      fontRange.addEventListener('input', function(){
        if (updating) return;
        var val = parseInt(fontRange.value, 10);
        persist({ fontSize: val }, { skipSync: true });
        fontValue.textContent = val + 'px';
      });
      fontField.appendChild(fontRange); fontField.appendChild(fontValue);
      el.appendChild(fontField);

      var colorField = makeField('カラー');
      var bgInput = document.createElement('input'); bgInput.type='color';
      var bgLabel = document.createElement('span'); bgLabel.textContent='背景色'; bgLabel.style.fontSize='12px';
      var fgInput = document.createElement('input'); fgInput.type='color';
      var fgLabel = document.createElement('span'); fgLabel.textContent='文字色'; fgLabel.style.fontSize='12px';
      colorField.appendChild(bgLabel); colorField.appendChild(bgInput); colorField.appendChild(fgLabel); colorField.appendChild(fgInput);
      bgInput.addEventListener('input', function(){ if (updating) return; persist({ bg: bgInput.value }); });
      fgInput.addEventListener('input', function(){ if (updating) return; persist({ fg: fgInput.value }); });
      el.appendChild(colorField);

      var opacityField = makeField('不透明度');
      var opacityRange = document.createElement('input'); opacityRange.type='range'; opacityRange.min='0'; opacityRange.max='1'; opacityRange.step='0.05';
      var opacityValue = document.createElement('div'); opacityValue.style.fontSize='12px'; opacityValue.style.opacity='0.8';
      opacityRange.addEventListener('input', function(){
        if (updating) return;
        var val = Math.min(1, Math.max(0, parseFloat(opacityRange.value)));
        persist({ opacity: val }, { skipSync: true });
        opacityValue.textContent = val.toFixed(2);
      });
      opacityField.appendChild(opacityRange); opacityField.appendChild(opacityValue);
      el.appendChild(opacityField);

      var controls = document.createElement('div');
      controls.style.display='flex'; controls.style.flexWrap='wrap'; controls.style.gap='8px';

      var previewBtn = document.createElement('button'); previewBtn.type='button'; previewBtn.className='small'; previewBtn.textContent='プレビュー';
      previewBtn.addEventListener('click', function(){
        if (!window.ZenWriterHUD) return;
        persist({ message: messageInput.value }, { skipSync: true, silent: false });
        window.ZenWriterHUD.publish(messageInput.value || 'HUDサンプル', hud.duration || 1200, { force: true, persistMessage: true });
        if (hud.pinned) window.ZenWriterHUD.pin(); else window.ZenWriterHUD.unpin();
      });

      var clearBtn = document.createElement('button'); clearBtn.type='button'; clearBtn.className='small'; clearBtn.textContent='クリア';
      clearBtn.addEventListener('click', function(){
        persist({ message: '', pinned: false }, { silent: false });
        if (window.ZenWriterHUD) window.ZenWriterHUD.hide();
      });

      var resetBtn = document.createElement('button'); resetBtn.type='button'; resetBtn.className='small'; resetBtn.textContent='リセット';
      resetBtn.addEventListener('click', function(){
        persist(cloneHud(defaults), { silent: false });
      });

      controls.appendChild(previewBtn);
      controls.appendChild(clearBtn);
      controls.appendChild(resetBtn);
      el.appendChild(controls);

      function syncUI(){
        updating = true;
        try {
          messageInput.value = hud.message || '';
          pinnedInput.checked = !!hud.pinned;
          positionSelect.value = hud.position || defaults.position;
          durationInput.value = hud.duration || defaults.duration;
          widthRange.value = hud.width || defaults.width;
          widthValue.textContent = (hud.width || defaults.width) + 'px';
          fontRange.value = hud.fontSize || defaults.fontSize;
          fontValue.textContent = (hud.fontSize || defaults.fontSize) + 'px';
          bgInput.value = hud.bg || defaults.bg;
          fgInput.value = hud.fg || defaults.fg;
          var op = (typeof hud.opacity === 'number') ? hud.opacity : defaults.opacity;
          opacityRange.value = op;
          opacityValue.textContent = op.toFixed(2);
        } finally {
          updating = false;
        }
      }

      syncUI();
      // 初期表示時にも HUD へ反映
      persist({}, { silent: false, skipSync: true });
    } catch(e) {
      var err = document.createElement('p'); err.textContent='HUD設定の初期化に失敗しました。'; el.appendChild(err);
    }
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
