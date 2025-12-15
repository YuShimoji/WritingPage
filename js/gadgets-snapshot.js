(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  // SnapshotManager gadget (個別ファイル化)
  ZWGadgets.register('SnapshotManager', function (el) {
    try {
      var storage = window.ZenWriterStorage;
      var editorManager = window.ZenWriterEditor;
      var L = window.UILabels || {};

      if (!storage || !storage.loadSnapshots) {
        var warn = document.createElement('p');
        warn.style.opacity = '0.7';
        warn.textContent = L.BACKUP_UNAVAILABLE || 'バックアップ機能を利用できません。';
        el.appendChild(warn);
        return;
      }

      // メインラッパー
      var wrap = document.createElement('div');
      wrap.className = 'snapshot-manager';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '8px';

      // ヘッダー行（保存ボタン + ショートカットヒント）
      var header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.gap = '8px';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = L.NOW_SAVE || '今すぐ保存';
      btn.addEventListener('click', function () {
        try {
          var content = (editorManager && editorManager.editor) ? (editorManager.editor.value || '') : (storage.loadContent ? storage.loadContent() : '');
          storage.addSnapshot(content);
          if (editorManager && typeof editorManager.showNotification === 'function') {
            editorManager.showNotification(L.BACKUP_SAVED || 'バックアップを保存しました');
          }
          renderList();
        } catch (e) { }
      });

      var hint = document.createElement('span');
      hint.style.fontSize = '11px';
      hint.style.opacity = '0.6';
      hint.textContent = L.RESTORE_SHORTCUT_HINT || 'Ctrl+Shift+Z: 復元';

      header.appendChild(btn);
      header.appendChild(hint);

      // スナップショット一覧
      var listEl = document.createElement('div');
      listEl.className = 'snapshot-list';

      wrap.appendChild(header);
      wrap.appendChild(listEl);
      el.appendChild(wrap);

      // プレビューモーダル
      var previewModal = null;

      function showPreview(content, ts) {
        if (previewModal) {
          previewModal.remove();
        }
        previewModal = document.createElement('div');
        previewModal.className = 'snapshot-preview-modal';
        previewModal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg-color,#fff);border:1px solid var(--border-color,#ccc);border-radius:8px;padding:16px;max-width:500px;max-height:400px;overflow:auto;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);';

        var modalHeader = document.createElement('div');
        modalHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;';

        var modalTitle = document.createElement('strong');
        modalTitle.textContent = (L.PREVIEW_TITLE || 'プレビュー') + ' - ' + fmt(ts);

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'small';
        closeBtn.textContent = L.CLOSE || '閉じる';
        closeBtn.addEventListener('click', function () {
          if (previewModal) previewModal.remove();
          previewModal = null;
        });

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeBtn);

        var modalBody = document.createElement('pre');
        modalBody.style.cssText = 'white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.5;margin:0;max-height:300px;overflow:auto;';
        modalBody.textContent = content || (L.EMPTY_CONTENT || '（空）');

        previewModal.appendChild(modalHeader);
        previewModal.appendChild(modalBody);
        document.body.appendChild(previewModal);

        // ESCで閉じる
        function onEsc(e) {
          if (e.key === 'Escape' && previewModal) {
            previewModal.remove();
            previewModal = null;
            document.removeEventListener('keydown', onEsc);
          }
        }
        document.addEventListener('keydown', onEsc);
      }

      function fmt(ts) {
        var d = new Date(ts);
        var p = function (n) { return String(n).padStart(2, '0'); };
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
      }

      function truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '…' : str;
      }

      function renderList() {
        var list = storage.loadSnapshots() || [];
        listEl.innerHTML = '';

        if (!list.length) {
          var empty = document.createElement('div');
          empty.style.opacity = '0.7';
          empty.textContent = L.NO_BACKUPS || 'バックアップはありません';
          listEl.appendChild(empty);
          return;
        }

        list.forEach(function (s, idx) {
          var row = document.createElement('div');
          row.className = 'snapshot-row';
          row.style.cssText = 'display:flex;flex-direction:column;gap:4px;padding:6px 8px;margin:4px 0;border-radius:4px;background:var(--sidebar-item-bg,rgba(0,0,0,0.03));';

          // 最新のスナップショットを強調
          if (idx === 0) {
            row.style.borderLeft = '3px solid var(--accent-color,#4a90e2)';
          }

          // 上段: 日時と文字数
          var metaRow = document.createElement('div');
          metaRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

          var meta = document.createElement('div');
          meta.style.fontSize = '12px';
          var timeSpan = document.createElement('span');
          timeSpan.textContent = fmt(s.ts);
          var lenSpan = document.createElement('span');
          lenSpan.style.opacity = '0.7';
          lenSpan.style.marginLeft = '8px';
          lenSpan.textContent = s.len + ' ' + (L.CHARS_SUFFIX || '文字');
          meta.appendChild(timeSpan);
          meta.appendChild(lenSpan);

          // 最新ラベル
          if (idx === 0) {
            var latestBadge = document.createElement('span');
            latestBadge.style.cssText = 'font-size:10px;background:var(--accent-color,#4a90e2);color:#fff;padding:1px 5px;border-radius:3px;margin-left:6px;';
            latestBadge.textContent = L.LATEST || '最新';
            meta.appendChild(latestBadge);
          }

          metaRow.appendChild(meta);

          // 下段: プレビューテキストとアクションボタン
          var contentRow = document.createElement('div');
          contentRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;';

          var preview = document.createElement('div');
          preview.style.cssText = 'font-size:11px;opacity:0.6;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;';
          preview.textContent = truncate(s.content, 40) || (L.EMPTY_CONTENT || '（空）');
          preview.title = L.CLICK_TO_PREVIEW || 'クリックでプレビュー';
          preview.addEventListener('click', function () {
            showPreview(s.content, s.ts);
          });

          var actions = document.createElement('div');
          actions.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';

          var restoreBtn = document.createElement('button');
          restoreBtn.type = 'button';
          restoreBtn.className = 'small';
          restoreBtn.textContent = L.RESTORE || '復元';
          restoreBtn.addEventListener('click', function () {
            var confirmMsg = L.CONFIRM_RESTORE || 'このバックアップで本文を置き換えます。よろしいですか？';
            if (confirm(confirmMsg)) {
              // 復元前に現在の内容を自動バックアップ（安全策）
              try {
                var currentContent = (editorManager && editorManager.editor) ? editorManager.editor.value : '';
                if (currentContent && storage.addSnapshot) {
                  storage.addSnapshot(currentContent);
                }
              } catch (e) { }

              if (editorManager && typeof editorManager.setContent === 'function') {
                editorManager.setContent(s.content || '');
                if (editorManager.showNotification) {
                  editorManager.showNotification(L.RESTORED || 'バックアップから復元しました');
                }
                renderList(); // 自動バックアップ分を反映
              }
            }
          });

          var delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'small';
          delBtn.textContent = L.DELETE || '削除';
          delBtn.addEventListener('click', function () {
            storage.deleteSnapshot(s.id);
            renderList();
          });

          actions.appendChild(restoreBtn);
          actions.appendChild(delBtn);

          contentRow.appendChild(preview);
          contentRow.appendChild(actions);

          row.appendChild(metaRow);
          row.appendChild(contentRow);
          listEl.appendChild(row);
        });
      }

      renderList();
    } catch (e) {
      try {
        el.textContent = (window.UILabels && window.UILabels.SNAPSHOT_INIT_FAILED) || 'スナップショットの初期化に失敗しました。';
      } catch (_) { }
    }
  }, { groups: ['structure'], title: (window.UILabels && window.UILabels.GADGET_BACKUP_TITLE) || 'バックアップ' });

})();
