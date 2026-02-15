(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  // Clock gadget (個別ファイル化)
  ZWGadgets.register('Clock', function (el, api) {
    try {
      var time = document.createElement('div');
      time.className = 'gadget-clock';
      el.appendChild(time);
      function tick() {
        try {
          var d = new Date();
          var z = function (n) { return (n < 10 ? '0' : '') + n; };
          var hour24 = api && typeof api.get === 'function' ? !!api.get('hour24', true) : true;
          var h = d.getHours();
          var ap = '';
          if (!hour24) { ap = (h >= 12 ? ' PM' : ' AM'); h = h % 12; if (h === 0) h = 12; }
          var s = d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + (hour24 ? z(h) : (h < 10 ? ' ' + h : h)) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds()) + (hour24 ? '' : ap);
          time.textContent = s;
        } catch (_) { }
      }
      tick();
      var id = setInterval(tick, 1000);
      try { el.addEventListener('removed', function () { clearInterval(id); }); } catch (_) { }
      try { window.addEventListener('beforeunload', function () { clearInterval(id); }, { once: true }); } catch (_) { }
    } catch (_) { }
  }, {
    // E2E が assist パネル上で Clock の存在を期待するため、既定は assist に配置する。
    // （過去はロードアウト/並び替えで移動できたが、既定配置は固定しておく）
    groups: ['settings'],
    title: (window.UILabels && (window.UILabels.GADGET_CLOCK || window.UILabels.GADGET_CLOCK_TITLE)) || '時計',
  });

  // Clock settings UI
  ZWGadgets.registerSettings('Clock', function (el, ctx) {
    try {
      var row = document.createElement('label'); row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '6px';
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!ctx.get('hour24', true);
      var txt = document.createElement('span'); txt.textContent = (window.UILabels && window.UILabels.CLOCK_24H) || '24時間表示';
      cb.addEventListener('change', function () { try { ctx.set('hour24', !!cb.checked); } catch (_) { } });
      row.appendChild(cb); row.appendChild(txt);
      el.appendChild(row);
    } catch (_) { }
  });

})();
