(function () {
  'use strict';

  var ZWGadgets = window.ZWGadgets;
  if (!ZWGadgets || typeof ZWGadgets.register !== 'function') return;

  function tryNotify(message) {
    try {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.showNotification === 'function') {
        window.ZenWriterEditor.showNotification(message, 1400);
        return;
      }
    } catch (_) { }
    try { alert(message); } catch (_) { }
  }

  function downloadText(filename, text) {
    try {
      var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { try { URL.revokeObjectURL(url); } catch (_) { } }, 1000);
    } catch (_) { }
  }

  ZWGadgets.register('GadgetPrefs', function (root) {
    try {
      root.innerHTML = '';
      root.style.display = 'grid';
      root.style.gap = '8px';

      if (!window.ZWGadgets || typeof window.ZWGadgets.exportPrefs !== 'function' || typeof window.ZWGadgets.importPrefs !== 'function') {
        var warn = document.createElement('div');
        warn.textContent = (window.UILabels && window.UILabels.STORAGE_UNAVAILABLE) || 'ガジェット設定APIが利用できません';
        warn.style.opacity = '0.7';
        warn.style.fontSize = '0.9rem';
        root.appendChild(warn);
        return;
      }

      var exportBtn = document.createElement('button');
      exportBtn.type = 'button';
      exportBtn.className = 'small';
      exportBtn.id = 'gadget-export';
      exportBtn.textContent = (window.UILabels && window.UILabels.GADGET_PREFS_EXPORT) || 'ガジェット設定をエクスポート';

      var importRow = document.createElement('div');
      importRow.style.display = 'grid';
      importRow.style.gap = '6px';

      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'gadget-prefs-input';
      fileInput.accept = 'application/json,.json';

      var importBtn = document.createElement('button');
      importBtn.type = 'button';
      importBtn.className = 'small';
      importBtn.id = 'gadget-import';
      importBtn.textContent = (window.UILabels && window.UILabels.GADGET_PREFS_IMPORT) || 'ガジェット設定をインポート';

      exportBtn.addEventListener('click', function () {
        try {
          var json = window.ZWGadgets.exportPrefs();
          downloadText('zenwriter-gadget-prefs.json', json || '{}');
          tryNotify((window.UILabels && window.UILabels.EXPORTED) || 'エクスポートしました');
        } catch (e) {
          console.error('exportPrefs failed', e);
          tryNotify((window.UILabels && window.UILabels.EXPORT_FAILED) || 'エクスポートに失敗しました');
        }
      });

      importBtn.addEventListener('click', function () {
        try {
          var f = fileInput.files && fileInput.files[0];
          if (!f) {
            tryNotify((window.UILabels && window.UILabels.SELECT_FILE_REQUIRED) || 'JSONファイルを選択してください');
            return;
          }
          var reader = new FileReader();
          reader.onload = function () {
            try {
              var ok = window.ZWGadgets.importPrefs(String(reader.result || ''));
              if (ok) {
                tryNotify((window.UILabels && window.UILabels.IMPORTED) || 'インポートしました');
              } else {
                tryNotify((window.UILabels && window.UILabels.IMPORT_FAILED) || 'インポートに失敗しました');
              }
            } catch (e) {
              console.error('importPrefs failed', e);
              tryNotify((window.UILabels && window.UILabels.IMPORT_FAILED) || 'インポートに失敗しました');
            }
          };
          reader.readAsText(f);
        } catch (e) {
          console.error('import handler failed', e);
          tryNotify((window.UILabels && window.UILabels.IMPORT_FAILED) || 'インポートに失敗しました');
        }
      });

      root.appendChild(exportBtn);
      importRow.appendChild(fileInput);
      importRow.appendChild(importBtn);
      root.appendChild(importRow);
    } catch (e) {
      console.error('GadgetPrefs gadget failed:', e);
      try {
        root.textContent = (window.UILabels && window.UILabels.GADGET_INIT_FAILED) || 'ガジェットの初期化に失敗しました。';
      } catch (_) { }
    }
  }, { groups: ['settings'], title: (window.UILabels && window.UILabels.GADGET_PREFS_TITLE) || 'ガジェット設定' });

})();
