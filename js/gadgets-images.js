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

      // コラージュレイアウトコントロール
      var collageSection = document.createElement('div');
      collageSection.style.display = 'grid';
      collageSection.style.gap = '6px';
      collageSection.style.padding = '8px';
      collageSection.style.border = '1px solid var(--border-color)';
      collageSection.style.borderRadius = '4px';
      collageSection.style.marginTop = '8px';

      var collageTitle = document.createElement('div');
      collageTitle.textContent = (window.UILabels && window.UILabels.COLLAGE_TITLE) || 'コラージュレイアウト';
      collageTitle.style.fontWeight = '600';
      collageTitle.style.fontSize = '13px';
      collageSection.appendChild(collageTitle);

      var modeRow = document.createElement('div');
      modeRow.style.display = 'flex';
      modeRow.style.gap = '6px';
      var freeModeBtn = document.createElement('button');
      freeModeBtn.type = 'button';
      freeModeBtn.className = 'small';
      freeModeBtn.textContent = (window.UILabels && window.UILabels.COLLAGE_MODE_FREE) || '自由配置';
      var gridModeBtn = document.createElement('button');
      gridModeBtn.type = 'button';
      gridModeBtn.className = 'small';
      gridModeBtn.textContent = (window.UILabels && window.UILabels.COLLAGE_MODE_GRID) || 'グリッド';
      modeRow.appendChild(freeModeBtn);
      modeRow.appendChild(gridModeBtn);
      collageSection.appendChild(modeRow);

      var gridConfigRow = document.createElement('div');
      gridConfigRow.style.display = 'grid';
      gridConfigRow.style.gridTemplateColumns = 'auto 1fr auto 1fr';
      gridConfigRow.style.gap = '4px';
      gridConfigRow.style.alignItems = 'center';
      var rowsLabel = document.createElement('label');
      rowsLabel.textContent = (window.UILabels && window.UILabels.COLLAGE_GRID_ROWS) || '行:';
      rowsLabel.style.fontSize = '12px';
      var rowsInput = document.createElement('input');
      rowsInput.type = 'number';
      rowsInput.min = '1';
      rowsInput.max = '10';
      rowsInput.value = '2';
      rowsInput.style.width = '50px';
      var colsLabel = document.createElement('label');
      colsLabel.textContent = (window.UILabels && window.UILabels.COLLAGE_GRID_COLS) || '列:';
      colsLabel.style.fontSize = '12px';
      var colsInput = document.createElement('input');
      colsInput.type = 'number';
      colsInput.min = '1';
      colsInput.max = '10';
      colsInput.value = '2';
      colsInput.style.width = '50px';
      gridConfigRow.appendChild(rowsLabel);
      gridConfigRow.appendChild(rowsInput);
      gridConfigRow.appendChild(colsLabel);
      gridConfigRow.appendChild(colsInput);
      collageSection.appendChild(gridConfigRow);

      var actionRow = document.createElement('div');
      actionRow.style.display = 'flex';
      actionRow.style.gap = '6px';
      var applyGridBtn = document.createElement('button');
      applyGridBtn.type = 'button';
      applyGridBtn.className = 'small';
      applyGridBtn.textContent = (window.UILabels && window.UILabels.COLLAGE_APPLY_GRID) || 'グリッド適用';
      var saveLayoutBtn = document.createElement('button');
      saveLayoutBtn.type = 'button';
      saveLayoutBtn.className = 'small';
      saveLayoutBtn.textContent = (window.UILabels && window.UILabels.COLLAGE_SAVE) || 'レイアウト保存';
      var loadLayoutBtn = document.createElement('button');
      loadLayoutBtn.type = 'button';
      loadLayoutBtn.className = 'small';
      loadLayoutBtn.textContent = (window.UILabels && window.UILabels.COLLAGE_LOAD) || 'レイアウト復元';
      actionRow.appendChild(applyGridBtn);
      actionRow.appendChild(saveLayoutBtn);
      actionRow.appendChild(loadLayoutBtn);
      collageSection.appendChild(actionRow);

      function updateModeButtons() {
        var mode = (API && typeof API.getCollageMode === 'function') ? API.getCollageMode() : 'free';
        if (mode === 'free') {
          freeModeBtn.style.background = 'var(--focus-color)';
          freeModeBtn.style.color = '#fff';
          gridModeBtn.style.background = '';
          gridModeBtn.style.color = '';
        } else {
          freeModeBtn.style.background = '';
          freeModeBtn.style.color = '';
          gridModeBtn.style.background = 'var(--focus-color)';
          gridModeBtn.style.color = '#fff';
        }
        var config = (API && typeof API.getGridConfig === 'function') ? API.getGridConfig() : { rows: 2, cols: 2, gap: 16 };
        rowsInput.value = config.rows || 2;
        colsInput.value = config.cols || 2;
      }

      freeModeBtn.addEventListener('click', function () {
        try {
          if (API && typeof API.setCollageMode === 'function') {
            API.setCollageMode('free');
            updateModeButtons();
          }
        } catch (_) { }
      });

      gridModeBtn.addEventListener('click', function () {
        try {
          if (API && typeof API.setCollageMode === 'function') {
            API.setCollageMode('grid');
            updateModeButtons();
          }
        } catch (_) { }
      });

      applyGridBtn.addEventListener('click', function () {
        try {
          if (API && typeof API.setGridConfig === 'function' && typeof API.applyGridLayout === 'function') {
            API.setGridConfig({
              rows: parseInt(rowsInput.value, 10) || 2,
              cols: parseInt(colsInput.value, 10) || 2,
              gap: 16,
            });
            API.applyGridLayout();
            renderList();
          }
        } catch (_) { }
      });

      saveLayoutBtn.addEventListener('click', function () {
        try {
          if (API && typeof API.saveCollageLayout === 'function') {
            API.saveCollageLayout();
            alert((window.UILabels && window.UILabels.COLLAGE_SAVED) || 'レイアウトを保存しました');
          }
        } catch (_) { }
      });

      loadLayoutBtn.addEventListener('click', function () {
        try {
          if (API && typeof API.loadCollageLayout === 'function') {
            API.loadCollageLayout();
            updateModeButtons();
            renderList();
            alert((window.UILabels && window.UILabels.COLLAGE_LOADED) || 'レイアウトを復元しました');
          }
        } catch (_) { }
      });

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
      root.appendChild(collageSection);
      root.appendChild(list);
      el.appendChild(root);

      updateModeButtons();
      renderList();
      try {
        window.addEventListener('ZWDocumentsChanged', function () {
          renderList();
          updateModeButtons();
        });
        if (API && typeof API.getCollageMode === 'function') {
          window.addEventListener('ZWImagesChanged', updateModeButtons);
        }
      } catch (_) { }
    } catch (e) { try { el.textContent = (window.UILabels && window.UILabels.IMG_INIT_FAILED) || '画像ガジェットの初期化に失敗しました。'; } catch (_) { } }
  }, { groups: ['assist'], title: (window.UILabels && window.UILabels.GADGET_IMAGES_TITLE) || '画像' });

})();
