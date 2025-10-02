(function(){
  'use strict';

  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  var ZWGadgets = {
    _list: [],
    register: function(name, factory){
      try { this._list.push({ name: String(name||''), factory: factory }); } catch(_) {}
    },
    init: function(selector){
      var sel = selector || '#gadgets-panel';
      var root = document.querySelector(sel);
      if (!root) return;
      for (var i=0; i<this._list.length; i++){
        try {
          var g = this._list[i];
          var wrap = document.createElement('section');
          wrap.className = 'gadget';
          if (g.name) {
            var h = document.createElement('h4');
            h.className = 'gadget-title';
            h.textContent = g.name;
            wrap.appendChild(h);
          }
          var body = document.createElement('div');
          body.className = 'gadget-body';
          wrap.appendChild(body);
          if (typeof g.factory === 'function') {
            try { g.factory(body); } catch(e){ /* ignore gadget error */ }
          }
          root.appendChild(wrap);
        } catch(e) { /* ignore per gadget */ }
      }
    }
  };

  // expose
  try { window.ZWGadgets = ZWGadgets; } catch(_) {}

  // Default gadget: Clock
  ZWGadgets.register('Clock', function(el){
    try {
      var time = document.createElement('div');
      time.style.fontSize = '14px';
      time.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, Arial, sans-serif';
      el.appendChild(time);
      function tick(){
        try {
          var d = new Date();
          var z = function(n){ return (n<10?'0':'')+n };
          var s = d.getFullYear() + '-' + z(d.getMonth()+1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds());
          time.textContent = s;
        } catch(_) {}
      }
      tick();
      var id = setInterval(tick, 1000);
      try { el.addEventListener('removed', function(){ clearInterval(id); }); } catch(_) {}
      try { window.addEventListener('beforeunload', function(){ clearInterval(id); }, { once: true }); } catch(_) {}
    } catch(_) {}
  });

  // auto-init when DOM ready
  ready(function(){
    try { ZWGadgets.init('#gadgets-panel'); } catch(_) {}
  });
})();
