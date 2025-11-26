(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgetsCore = window.ZWGadgetsCore;
  if (!utils || !ZWGadgetsCore) return;

  var ZWGadgetsInstance = new ZWGadgetsCore();

  // SnapshotManager gadget (個別ファイル化)
  ZWGadgetsInstance.register('SnapshotManager', function (el) {
    try {
      var storage = window.ZenWriterStorage;
      var editorManager = window.ZenWriterEditor;
      if (!storage || !storage.loadSnapshots) {
        var warn = document.createElement('p'); warn.style.opacity = '0.7'; warn.textContent = (window.UILabels && window.UILabels.BACKUP_UNAVAILABLE) || 'バックアップ機能を利用できません。'; el.appendChild(warn); return;
      }
      var wrap = document.createElement('div'); wrap.style.display = 'flex'; wrap.style.flexDirection = 'column'; wrap.style.gap = '8px';
      var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = (window.UILabels && window.UILabels.NOW_SAVE) || '今すぐ保存'; btn.addEventListener('click', function () {
        try {
          var content = (editorManager && editorManager.editor) ? (editorManager.editor.value || '') : (storage.loadContent ? storage.loadContent() : '');
          storage.addSnapshot(content);
          if (editorManager && typeof editorManager.showNotification === 'function') editorManager.showNotification((window.UILabels && window.UILabels.BACKUP_SAVED) || 'バックアップを保存しました');
          renderList();
        } catch (e) { }
      });
      var listEl = document.createElement('div'); listEl.className = 'snapshot-list';
      wrap.appendChild(btn); wrap.appendChild(listEl); el.appendChild(wrap);

      function fmt(ts) { var d = new Date(ts); var p = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }
      function renderList() {
        var list = storage.loadSnapshots() || []; listEl.innerHTML = '';
        if (!list.length) { var empty = document.createElement('div'); empty.style.opacity = '0.7'; empty.textContent = (window.UILabels && window.UILabels.NO_BACKUPS) || 'バックアップはありません'; listEl.appendChild(empty); return; }
        list.forEach(function (s) {
          var row = document.createElement('div'); row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.alignItems = 'center'; row.style.gap = '6px'; row.style.margin = '4px 0';
          var meta = document.createElement('div'); meta.textContent = fmt(s.ts) + ' / ' + s.len + ' ' + ((window.UILabels && window.UILabels.CHARS_SUFFIX) || '文字');
          var actions = document.createElement('div');
          var restore = document.createElement('button'); restore.className = 'small'; restore.textContent = (window.UILabels && window.UILabels.RESTORE) || '復元'; restore.addEventListener('click', function () { if (confirm((window.UILabels && window.UILabels.CONFIRM_RESTORE) || 'このバックアップで本文を置き換えます。よろしいですか？')) { if (editorManager && typeof editorManager.setContent === 'function') { editorManager.setContent(s.content || ''); if (editorManager.showNotification) editorManager.showNotification((window.UILabels && window.UILabels.RESTORED) || 'バックアップから復元しました'); } } });
          var del = document.createElement('button'); del.className = 'small'; del.textContent = (window.UILabels && window.UILabels.DELETE) || '削除'; del.addEventListener('click', function () { storage.deleteSnapshot(s.id); renderList(); });
          actions.appendChild(restore); actions.appendChild(del);
          row.appendChild(meta); row.appendChild(actions); listEl.appendChild(row);
        });
      }
      renderList();
    } catch (e) { try { el.textContent = (window.UILabels && window.UILabels.SNAPSHOT_INIT_FAILED) || 'スナップショットの初期化に失敗しました。'; } catch (_) { } }
  }, { groups: ['structure'], title: (window.UILabels && window.UILabels.GADGET_BACKUP_TITLE) || 'バックアップ' });

})();
