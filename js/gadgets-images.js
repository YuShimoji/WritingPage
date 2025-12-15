(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  // Images gadget (個別ファイル化)
  ZWGadgets.register('Images', function (el) {
    try {
      var API = window.ZenWriterImages;
      var root = document.createElement('div');
      root.style.display = 'grid';
      root.style.gap = '6px';

      var urlRow = document.createElement('div');
      var urlInput = document.createElement('input'); urlInput.type = 'url'; urlInput.placeholder = (window.UILabels && window.UILabels.IMG_URL_PLACEHOLDER) || '画像URLを入力';
      var addUrlBtn = document.createElement('button'); addUrlBtn.type = 'button'; addUrlBtn.className = 'small'; addUrlBtn.textContent = (window.UILabels && window.UILabels.BTN_ADD_URL) || 'URL追加';
      urlRow.appendChild(urlInput); urlRow.appendChild(addUrlBtn);

      var fileRow = document.createElement('div');
      var fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/*';
      fileRow.appendChild(fileInput);

      var list = document.createElement('div'); list.style.display = 'grid'; list.style.gap = '6px';

      function showEditDialog(id, it) {
        try {
          // 簡易ダイアログ
          var altInput = document.createElement('input'); altInput.type = 'text'; altInput.placeholder = (window.UILabels && window.UILabels.IMG_ALT_PLACEHOLDER) || 'Altテキスト'; altInput.value = it.alt || '';
          var widthInput = document.createElement('input'); widthInput.type = 'number'; widthInput.min = '100'; widthInput.max = '800'; widthInput.value = it.width || 240;
          var alignSelect = document.createElement('select');
          ['left', 'center', 'right'].forEach(function (a) { var o = document.createElement('option'); o.value = a; o.textContent = a; alignSelect.appendChild(o); });
          alignSelect.value = it.alignment || 'left';
          var saveBtn = document.createElement('button'); saveBtn.type = 'button'; saveBtn.textContent = (window.UILabels && window.UILabels.BTN_SAVE) || '保存'; saveBtn.className = 'small';
          var cancelBtn = document.createElement('button'); cancelBtn.type = 'button'; cancelBtn.textContent = (window.UILabels && window.UILabels.BTN_CANCEL) || 'キャンセル'; cancelBtn.className = 'small';

          var dialog = document.createElement('div'); dialog.style.position = 'fixed'; dialog.style.top = '50%'; dialog.style.left = '50%'; dialog.style.transform = 'translate(-50%,-50%)'; dialog.style.background = 'var(--bg-color)'; dialog.style.border = '1px solid var(--border-color)'; dialog.style.padding = '16px'; dialog.style.zIndex = '10000'; dialog.style.display = 'flex'; dialog.style.flexDirection = 'column'; dialog.style.gap = '8px';
          dialog.appendChild(document.createTextNode((window.UILabels && window.UILabels.IMG_ALT_PLACEHOLDER) || 'Altテキスト:')); dialog.appendChild(altInput);
          dialog.appendChild(document.createTextNode((window.UILabels && window.UILabels.IMG_WIDTH_LABEL) || '幅 (px):')); dialog.appendChild(widthInput);
          dialog.appendChild(document.createTextNode((window.UILabels && window.UILabels.IMG_ALIGN_LABEL) || '配置:')); dialog.appendChild(alignSelect);
          var btns = document.createElement('div'); btns.style.display = 'flex'; btns.style.gap = '8px';
          btns.appendChild(saveBtn); btns.appendChild(cancelBtn);
          dialog.appendChild(btns);
          document.body.appendChild(dialog);

          saveBtn.addEventListener('click', function () {
            try {
              API && API.update && API.update(id, { alt: altInput.value, width: parseInt(widthInput.value, 10), alignment: alignSelect.value });
              renderList();
              document.body.removeChild(dialog);
            } catch (_) { }
          });
          cancelBtn.addEventListener('click', function () { document.body.removeChild(dialog); });
        } catch (_) { }
      }

      function renderList() {
        try {
          list.innerHTML = '';
          var images = (API && typeof API._load === 'function') ? API._load() : [];
          images.forEach(function (it) {
            var row = document.createElement('div'); row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '8px';
            var thumb = document.createElement('img'); thumb.src = it.src; thumb.alt = it.alt || ''; thumb.style.width = '40px'; thumb.style.height = '40px'; thumb.style.objectFit = 'cover'; thumb.style.border = '1px solid var(--border-color)';
            var name = document.createElement('div'); name.textContent = it.alt || it.id || '(image)'; name.style.flex = '1 1 auto'; name.style.fontSize = '12px'; name.style.opacity = '0.8';
            var editBtn = document.createElement('button'); editBtn.type = 'button'; editBtn.className = 'small'; editBtn.textContent = (window.UILabels && window.UILabels.BTN_EDIT) || '編集'; editBtn.title = (window.UILabels && window.UILabels.BTN_EDIT_TITLE) || 'プロパティ編集';
            editBtn.addEventListener('click', function () { showEditDialog(it.id, it); });
            var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'small'; rm.textContent = (window.UILabels && window.UILabels.BTN_DELETE) || '削除';
            rm.addEventListener('click', function () { try { API && API.remove && API.remove(it.id); renderList(); } catch (_) { } });
            row.appendChild(thumb); row.appendChild(name); row.appendChild(editBtn); row.appendChild(rm);
            list.appendChild(row);
          });
        } catch (_) { }
      }

      addUrlBtn.addEventListener('click', function () {
        var val = (urlInput.value || '').trim(); if (!val) return;
        try { API && API.addFromUrl && API.addFromUrl(val); urlInput.value = ''; renderList(); } catch (_) { }
      });
      fileInput.addEventListener('change', function () {
        try { var f = fileInput.files && fileInput.files[0]; if (f && API && API.addFromFile) { API.addFromFile(f); fileInput.value = ''; renderList(); } } catch (_) { }
      });

      root.appendChild(urlRow);
      root.appendChild(fileRow);
      root.appendChild(list);
      el.appendChild(root);

      renderList();
      try { window.addEventListener('ZWDocumentsChanged', renderList); } catch (_) { }
    } catch (e) { try { el.textContent = (window.UILabels && window.UILabels.IMG_INIT_FAILED) || '画像ガジェットの初期化に失敗しました。'; } catch (_) { } }
  }, { groups: ['assist'], title: (window.UILabels && window.UILabels.GADGET_IMAGES_TITLE) || '画像' });

})();
