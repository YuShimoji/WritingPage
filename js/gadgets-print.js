(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  // PrintSettings gadget (個別ファイル化)
  ZWGadgets.register('PrintSettings', function (el, _api) {
    try {
      var ed = (window.ZenWriterEditor && window.ZenWriterEditor.editor) || document.getElementById('editor');

      function createPrintButton(editorEl) {
        const printBtn = document.createElement('button');
        printBtn.type = 'button';
        printBtn.className = 'small';
        printBtn.textContent = (window.UILabels && window.UILabels.PRINT_PREVIEW) || '印刷プレビュー';
        printBtn.addEventListener('click', function () {
          const pv = document.getElementById('print-view');
          if (!pv || !editorEl) return;
          const text = editorEl.value || '';
          pv.innerHTML = '';
          const norm = text.replace(/\r\n/g, '\n');
          const blocks = norm.split(/\n{2,}/);
          blocks.forEach(function (seg) {
            const p = document.createElement('p');
            p.textContent = seg;
            pv.appendChild(p);
          });
          window.print();
        });
        return printBtn;
      }

      function createExportButton(editorEl) {
        const exportBtn = document.createElement('button');
        exportBtn.type = 'button';
        exportBtn.className = 'small';
        exportBtn.textContent = (window.UILabels && window.UILabels.TXT_EXPORT) || 'TXTエクスポート';
        exportBtn.addEventListener('click', function () {
          const text = editorEl && editorEl.value ? editorEl.value : '';
          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = (window.UILabels && window.UILabels.EXPORT_FILENAME_DEFAULT) || 'document.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
        return exportBtn;
      }

      el.appendChild(createPrintButton(ed));
      el.appendChild(createExportButton(ed));
    } catch (e) {
      console.error('PrintSettings gadget failed:', e);
      try { el.textContent = (window.UILabels && window.UILabels.PRINT_INIT_FAILED) || '印刷設定ガジェットの初期化に失敗しました。'; } catch (e2) { void e2; }
    }
  }, { groups: ['settings'], title: (window.UILabels && window.UILabels.GADGET_EXPORT_TITLE) || 'エクスポート' });

})();
