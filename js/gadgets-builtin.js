(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgetsCore = window.ZWGadgetsCore;
  if (!utils || !ZWGadgetsCore) return;

  var ZWGadgetsInstance = window.ZWGadgets || new ZWGadgetsCore();

  // Outline gadget (構造)
  ZWGadgetsInstance.register('Outline', function (el) {
    try {
      var STORAGE = window.ZenWriterStorage;
      if (!STORAGE || typeof STORAGE.loadOutline !== 'function') {
        var p = document.createElement('p');
        p.textContent = (window.UILabels && window.UILabels.OUTLINE_UNAVAILABLE) || 'アウトライン機能を利用できません。';
        p.style.opacity = '0.7'; p.style.fontSize = '0.9rem';
        el.appendChild(p);
        return;
      }

      var DEFAULT_OUTLINE = {
        sets: [
          {
            id: 'default-3',
            name: (window.UILabels && window.UILabels.OUTLINE_DEFAULT_SET_NAME) || '部・章・節',
            levels: [
              { key: 'part', label: (window.UILabels && window.UILabels.OUTLINE_PART) || '部', color: '#4a90e2' },
              { key: 'chapter', label: (window.UILabels && window.UILabels.OUTLINE_CHAPTER) || '章', color: '#7b8a8b' },
              { key: 'section', label: (window.UILabels && window.UILabels.OUTLINE_SECTION) || '節', color: '#b88a4a' }
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
      label.textContent = (window.UILabels && window.UILabels.PRESET_LABEL) || 'プリセット';
      label.setAttribute('for', 'outline-set-select');
      var sel = document.createElement('select');
      sel.id = 'outline-set-select';

      var details = document.createElement('details');
      var sum = document.createElement('summary'); sum.textContent = (window.UILabels && window.UILabels.CREATE_NEW_PRESET) || '新しいプリセットを作成';
      var nameLbl = document.createElement('label'); nameLbl.setAttribute('for', 'outline-new-name'); nameLbl.textContent = (window.UILabels && window.UILabels.NAME_LABEL) || '名前';
      var nameInput = document.createElement('input'); nameInput.type = 'text'; nameInput.id = 'outline-new-name'; nameInput.placeholder = (window.UILabels && window.UILabels.PRESET_NAME_EXAMPLE) || '例: 三部構成';
      var lvLbl = document.createElement('label'); lvLbl.setAttribute('for', 'outline-new-levels'); lvLbl.textContent = (window.UILabels && window.UILabels.LEVELS_CSV_LABEL) || 'レベル（カンマ区切り）';
      var lvInput = document.createElement('input'); lvInput.type = 'text'; lvInput.id = 'outline-new-levels'; lvInput.placeholder = (window.UILabels && window.UILabels.LEVELS_CSV_PLACEHOLDER) || '部,章,節';
      var createBtn = document.createElement('button'); createBtn.type = 'button'; createBtn.id = 'create-outline-set'; createBtn.textContent = (window.UILabels && window.UILabels.CREATE) || '作成';
      var createBox = document.createElement('div');
      createBox.style.display = 'grid'; createBox.style.gap = '6px';
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

      function save() { try { STORAGE.saveOutline(state); } catch (_) { } }
      function currentSet() {
        var s = state.sets.find(function (x) { return x && x.id === state.currentSetId; });
        return s || state.sets[0];
      }
      function renderSetSelect() {
        sel.innerHTML = '';
        state.sets.forEach(function (set) {
          var opt = document.createElement('option');
          opt.value = set.id; opt.textContent = set.name || set.id; sel.appendChild(opt);
        });
        sel.value = state.currentSetId;
      }
      function renderCurrentSet() {
        var set = currentSet(); if (!set) return;
        levelsBox.innerHTML = '';
        set.levels.forEach(function (lv, i) {
          var row = document.createElement('div');
          row.className = 'level-row';
          row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.justifyContent = 'space-between'; row.style.gap = '6px';
          var left = document.createElement('label'); left.textContent = String(lv.label || ''); left.style.flex = '1 1 auto';
          var right = document.createElement('div'); right.style.display = 'flex'; right.style.alignItems = 'center'; right.style.gap = '6px';
          var color = document.createElement('input'); color.type = 'color'; color.value = lv.color || '#888888'; color.setAttribute('data-index', String(i));
          var up = document.createElement('button'); up.type = 'button'; up.className = 'small btn-move'; up.setAttribute('data-dir', 'up'); up.setAttribute('data-index', String(i));
          up.textContent = (window.UILabels && window.UILabels.MOVE_UP) || '上へ';
          up.title = (window.UILabels && window.UILabels.MOVE_UP) || '上へ';
          var down = document.createElement('button'); down.type = 'button'; down.className = 'small btn-move'; down.setAttribute('data-dir', 'down'); down.setAttribute('data-index', String(i));
          down.textContent = (window.UILabels && window.UILabels.MOVE_DOWN) || '下へ';
          down.title = (window.UILabels && window.UILabels.MOVE_DOWN) || '下へ';
          right.appendChild(color); right.appendChild(up); right.appendChild(down);
          row.appendChild(left); row.appendChild(right);
          levelsBox.appendChild(row);
        });

        insertBox.innerHTML = '';
        set.levels.forEach(function (lv, i) {
          var b = document.createElement('button');
          b.className = 'outline-btn'; b.type = 'button';
          b.textContent = String(lv.label || '') + ((window.UILabels && window.UILabels.INSERT_SUFFIX) || ' を挿入');
          b.style.borderColor = lv.color || '#888';
          b.style.color = lv.color || 'inherit';
          b.addEventListener('click', function () { insertLevel(i); });
          insertBox.appendChild(b);
        });
      }

      function generatePalette(n) {
        var arr = []; for (var i = 0; i < n; i++) { var hue = Math.round((360 / n) * i); arr.push(hslToHex(hue, 60, 50)); } return arr;
      }
      function hslToHex(h, s, l) {
        s /= 100; l /= 100; var k = function (n) { return (n + h / 30) % 12; };
        var a = s * Math.min(l, 1 - l);
        var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
        var r = Math.round(255 * f(0)), g = Math.round(255 * f(8)), b = Math.round(255 * f(4));
        var toHex = function (c) { var x = c.toString(16); return x.length === 1 ? ('0' + x) : x; };
        return '#' + toHex(r) + toHex(g) + toHex(b);
      }

      function insertLevel(index) {
        var set = currentSet(); if (!set || !set.levels[index]) return;
        var depth = index + 1; var prefix = '#'.repeat(Math.min(depth, 6));
        var text = prefix + ' ' + String(set.levels[index].label || '') + ((window.UILabels && window.UILabels.TITLE_SUFFIX) || ' タイトル\n\n');
        try {
          if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertTextAtCursor === 'function') {
            window.ZenWriterEditor.insertTextAtCursor(text);
          }
        } catch (_) { }
      }

      // events
      sel.addEventListener('change', function (e) { state.currentSetId = e.target.value; save(); renderCurrentSet(); });
      createBtn.addEventListener('click', function () {
        var name = (nameInput.value || '').trim() || ((window.UILabels && window.UILabels.NEW_PRESET_DEFAULT_NAME) || '新規プリセット');
        var csv = (lvInput.value || '').trim(); if (!csv) { alert((window.UILabels && window.UILabels.LEVELS_CSV_REQUIRED) || 'レベル名をカンマ区切りで入力してください'); return; }
        var labels = csv.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var palette = generatePalette(labels.length);
        var id = 'set-' + Date.now();
        var set = { id: id, name: name, levels: labels.map(function (label, idx) { return { key: 'k' + idx, label: label, color: palette[idx] }; }) };
        state.sets.push(set); state.currentSetId = id; save(); nameInput.value = ''; lvInput.value = ''; renderSetSelect(); renderCurrentSet();
      });
      levelsBox.addEventListener('change', function (e) { var t = e.target; if (t && t.matches('input[type="color"]')) { var idx = parseInt(t.getAttribute('data-index'), 10); var set = currentSet(); if (set && set.levels[idx]) { set.levels[idx].color = t.value; save(); renderCurrentSet(); } } });
      levelsBox.addEventListener('click', function (e) { var t = e.target; if (t && t.matches('.btn-move')) { var dir = t.getAttribute('data-dir'); var idx = parseInt(t.getAttribute('data-index'), 10); var set = currentSet(); if (!set) return; var ni = dir === 'up' ? idx - 1 : idx + 1; if (ni < 0 || ni >= set.levels.length) return; var arr = set.levels; var tmp = arr[idx]; arr[idx] = arr[ni]; arr[ni] = tmp; save(); renderCurrentSet(); } });

      // init
      renderSetSelect();
      renderCurrentSet();
    } catch (e) {
      console.error('Outline gadget failed:', e);
      try { el.textContent = (window.UILabels && window.UILabels.OUTLINE_INIT_FAILED) || 'アウトラインの初期化に失敗しました。'; } catch (_) { }
    }
  }, { groups: ['structure'], title: (window.UILabels && window.UILabels.GADGET_OUTLINE_TITLE) || 'アウトライン' });

  // Documents gadget
  ZWGadgetsInstance.register('Documents', function (el) {
    try {
      var storage = window.ZenWriterStorage;
      if (!storage) {
        var warn = document.createElement('p');
        warn.textContent = (window.UILabels && window.UILabels.DOCS_STORAGE_UNAVAILABLE) || 'ストレージ機能が利用できないため、ドキュメントを管理できません。';
        warn.style.fontSize = '0.9rem';
        warn.style.opacity = '0.7';
        el.appendChild(warn);
        return;
      }

      var editorManager = window.ZenWriterEditor;
      var selectId = 'zw-doc-select-' + Math.random().toString(36).slice(2);
      var state = { docs: [], currentId: null };

      function notify(message, duration) {
        try {
          if (editorManager && typeof editorManager.showNotification === 'function') {
            editorManager.showNotification(message, duration || 1200);
          }
        } catch (_) { }
      }

      function ensureDocuments() {
        var docs = storage.loadDocuments() || [];
        var cur = storage.getCurrentDocId();
        if (!docs.length) {
          var initial = '';
          try { initial = storage.loadContent() || ''; } catch (_) { }
          var created = storage.createDocument((window.UILabels && window.UILabels.DEFAULT_DOC_NAME) || 'ドキュメント1', initial);
          storage.setCurrentDocId(created.id);
          if (editorManager && typeof editorManager.setContent === 'function') {
            editorManager.setContent(initial);
          } else {
            storage.saveContent(initial);
          }
          docs = storage.loadDocuments() || [];
          cur = created.id;
        }
        if (!cur || !docs.some(function (d) { return d && d.id === cur; })) {
          var sorted = docs.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
          if (sorted.length) {
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

      function sortedDocs() {
        var docs = storage.loadDocuments() || [];
        return docs.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      }

      function refreshOptions(preferredId) {
        ensureDocuments();
        var docs = sortedDocs();
        var select = elements.select;
        select.innerHTML = '';
        if (!docs.length) {
          var empty = document.createElement('option');
          empty.value = '';
          empty.textContent = (window.UILabels && window.UILabels.NO_DOCUMENTS) || '(なし)';
          select.appendChild(empty);
          select.disabled = true;
          elements.renameBtn.disabled = true;
          elements.deleteBtn.disabled = true;
          return;
        }
        select.disabled = false;
        docs.forEach(function (doc) {
          var opt = document.createElement('option');
          opt.value = doc.id;
          opt.textContent = doc.name || ((window.UILabels && window.UILabels.UNTITLED_DOC) || '無題');
          select.appendChild(opt);
        });
        var cur = preferredId || storage.getCurrentDocId();
        if (cur) select.value = cur;
        elements.renameBtn.disabled = !cur;
        elements.deleteBtn.disabled = !cur;
      }

      function saveCurrentContent() {
        try {
          if (editorManager && editorManager.editor && typeof storage.saveContent === 'function') {
            storage.saveContent(editorManager.editor.value || '');
          }
        } catch (_) { }
      }

      function updateDocumentTitle() {
        try {
          var docs = storage.loadDocuments() || [];
          var cur = storage.getCurrentDocId();
          var doc = docs.find(function (d) { return d && d.id === cur; });
          var name = doc && doc.name ? doc.name : '';
          document.title = name ? name + ' - Zen Writer' : 'Zen Writer - 小説執筆ツール';
        } catch (_) {
          document.title = 'Zen Writer - 小説執筆ツール';
        }
      }

      function dispatchChanged() {
        try { window.dispatchEvent(new CustomEvent('ZWDocumentsChanged', { detail: { docs: storage.loadDocuments() || [] } })); } catch (_) { }
      }

      function switchDocument(id) {
        if (!id) return;
        var docs = storage.loadDocuments() || [];
        var doc = docs.find(function (d) { return d && d.id === id; });
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
        var msg = (window.UILabels && window.UILabels.DOC_OPENED_MSG) || '「{0}」を開きました';
        notify(msg.replace('{0}', doc.name || ((window.UILabels && window.UILabels.UNTITLED_DOC) || '無題')));
        dispatchChanged();
      }

      function createDocument() {
        try {
          var hasDirty = (editorManager && typeof editorManager.isDirty === 'function')
            ? editorManager.isDirty()
            : false;
          if (hasDirty) {
            var msg = (window.UILabels && window.UILabels.UNSAVED_CHANGES_NEW) || '未保存の変更があります。新規作成を続行しますか？\n現在の内容はスナップショットとして自動退避します。';
            var ok = confirm(msg);
            if (!ok) return;
            try {
              var content = (editorManager && editorManager.editor) ? (editorManager.editor.value || '') : '';
              if (storage && typeof storage.addSnapshot === 'function') {
                storage.addSnapshot(content);
              }
            } catch (_) { }
          }
        } catch (_) { }

        var name = prompt((window.UILabels && window.UILabels.NEW_DOC_PROMPT) || '新しいドキュメント名を入力', (window.UILabels && window.UILabels.UNTITLED_DOC) || '無題');
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
        notify((window.UILabels && window.UILabels.DOC_CREATED_MSG) || 'ドキュメントを作成しました');
        dispatchChanged();
      }

      function renameDocument() {
        var cur = storage.getCurrentDocId();
        if (!cur) return;
        var docs = storage.loadDocuments() || [];
        var doc = docs.find(function (d) { return d && d.id === cur; });
        var name = prompt((window.UILabels && window.UILabels.RENAME_DOC_PROMPT) || 'ドキュメント名を変更', doc ? (doc.name || ((window.UILabels && window.UILabels.UNTITLED_DOC) || '無題')) : ((window.UILabels && window.UILabels.UNTITLED_DOC) || '無題'));
        if (name === null) return;
        storage.renameDocument(cur, name || '無題');
        refreshOptions(cur);
        updateDocumentTitle();
        notify('ドキュメント名を更新しました');
        dispatchChanged();
      }

      function deleteDocument() {
        var cur = storage.getCurrentDocId();
        if (!cur) return;
        if (!confirm((window.UILabels && window.UILabels.DELETE_DOC_CONFIRM) || 'このドキュメントを削除しますか？この操作は元に戻せません。')) return;
        storage.deleteDocument(cur);
        ensureDocuments();
        var next = storage.getCurrentDocId();
        if (editorManager && typeof editorManager.setContent === 'function') {
          var docs = storage.loadDocuments() || [];
          var doc = docs.find(function (d) { return d && d.id === next; });
          editorManager.setContent(doc && doc.content ? doc.content : '');
        } else {
          var doc2 = storage.loadDocuments().find(function (d) { return d && d.id === next; });
          storage.saveContent(doc2 ? doc2.content || '' : '');
        }
        refreshOptions(next);
        updateDocumentTitle();
        notify((window.UILabels && window.UILabels.DOC_DELETED_MSG) || 'ドキュメントを削除しました');
        dispatchChanged();
      }

      function importFile(files) {
        if (!files || !files.length) return;
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var text = String(reader.result || '');
            if (editorManager && typeof editorManager.setContent === 'function') {
              editorManager.setContent(text);
            } else {
              storage.saveContent(text);
            }
            refreshOptions(storage.getCurrentDocId());
            notify((window.UILabels && window.UILabels.FILE_IMPORTED_MSG) || 'ファイルを読み込みました');
            dispatchChanged();
          } catch (e) { console.error(e); }
        };
        reader.onerror = function () { console.error((window.UILabels && window.UILabels.FILE_IMPORT_ERROR) || 'ファイル読み込みエラー'); };
        reader.readAsText(file, 'utf-8');
      }

      function exportCurrent(asMarkdown) {
        if (editorManager) {
          if (asMarkdown && typeof editorManager.exportAsMarkdown === 'function') return editorManager.exportAsMarkdown();
          if (!asMarkdown && typeof editorManager.exportAsText === 'function') return editorManager.exportAsText();
        }
        try {
          var text = storage.loadContent() || '';
          var docId = storage.getCurrentDocId();
          var docs = storage.loadDocuments() || [];
          var doc = docs.find(function (d) { return d && d.id === docId; });
          var base = doc && doc.name ? doc.name : 'zenwriter';
          var filename = base + (asMarkdown ? '.md' : '.txt');
          storage.exportText(text, filename, asMarkdown ? 'text/markdown' : 'text/plain');
        } catch (_) { }
      }

      function printCurrent() {
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
      label.textContent = (window.UILabels && window.UILabels.DOC_LIST_LABEL) || 'ドキュメント一覧';
      label.style.fontWeight = '600';

      var select = document.createElement('select');
      select.id = selectId;
      select.addEventListener('change', function (ev) { switchDocument(ev.target.value); });
      elements.select = select;

      function makeSmallButton(text, handler) {
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
      var btnCreate = makeSmallButton((window.UILabels && window.UILabels.CREATE) || '作成', createDocument);
      btnCreate.id = 'new-document-btn';
      var btnRename = makeSmallButton((window.UILabels && window.UILabels.RENAME) || '改名', renameDocument);
      var btnDelete = makeSmallButton((window.UILabels && window.UILabels.DELETE) || '削除', deleteDocument);
      elements.renameBtn = btnRename;
      elements.deleteBtn = btnDelete;
      primaryRow.appendChild(btnCreate);
      primaryRow.appendChild(btnRename);
      primaryRow.appendChild(btnDelete);

      var secondaryRow = document.createElement('div');
      secondaryRow.style.display = 'flex';
      secondaryRow.style.flexWrap = 'wrap';
      secondaryRow.style.gap = '6px';
      var btnImport = makeSmallButton((window.UILabels && window.UILabels.IMPORT_FILE) || 'ファイルを読み込む', function () { hiddenInput.click(); });
      var btnExportTxt = makeSmallButton((window.UILabels && window.UILabels.EXPORT_TEXT) || 'テキストで保存', function () { exportCurrent(false); });
      var btnExportMd = makeSmallButton((window.UILabels && window.UILabels.EXPORT_MARKDOWN) || 'Markdownで保存', function () { exportCurrent(true); });
      var btnPrint = makeSmallButton((window.UILabels && window.UILabels.PRINT) || '印刷', printCurrent);
      var btnPdfExport = makeSmallButton((window.UILabels && window.UILabels.EXPORT_PDF) || 'PDFエクスポート', function () {
        try {
          window.print();
        } catch (e) { console.error('PDF export failed', e); }
      });
      var btnRestoreSnapshot = makeSmallButton((window.UILabels && window.UILabels.RESTORE_FROM_BACKUP) || '復元', function () {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.restoreLastSnapshot === 'function') {
          window.ZenWriterEditor.restoreLastSnapshot();
        }
      });
      btnRestoreSnapshot.id = 'restore-from-snapshot';
      secondaryRow.appendChild(btnImport);
      secondaryRow.appendChild(btnExportTxt);
      secondaryRow.appendChild(btnExportMd);
      secondaryRow.appendChild(btnPrint);
      secondaryRow.appendChild(btnPdfExport);
      secondaryRow.appendChild(btnRestoreSnapshot);

      var hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.accept = '.txt,.md,.markdown,.text';
      hiddenInput.style.display = 'none';
      hiddenInput.addEventListener('change', function (ev) {
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

      window.addEventListener('ZWLoadoutsChanged', function () { refreshOptions(storage.getCurrentDocId()); });
      window.addEventListener('ZWLoadoutApplied', function () { refreshOptions(storage.getCurrentDocId()); });
      window.addEventListener('ZWDocumentsChanged', function () { refreshOptions(storage.getCurrentDocId()); });
    } catch (e) {
      console.error('Documents gadget failed:', e);
      try { el.textContent = (window.UILabels && window.UILabels.DOCS_INIT_FAILED) || 'ドキュメントガジェットの初期化に失敗しました。'; } catch (_) { }
    }
  }, { groups: ['assist'], title: (window.UILabels && window.UILabels.GADGET_DOCUMENTS_TITLE) || 'ドキュメント' });

  // TypographyThemes gadget (個別ファイル化済み - gadgets-typography.js)

  // HUDSettings gadget (個別ファイル化済み - gadgets-hud.js)

  // Other built-in gadgets...
  // EditorLayout, etc.

  // EditorLayout settings UI (個別ファイル化済み - gadgets-layout.js)

  // SnapshotManager gadget (個別ファイル化済み - gadgets-snapshot.js)

  // Export the instance with built-in gadgets registered
  try {
    window.ZWGadgets = ZWGadgetsInstance;
  } catch (_) { }

})();
