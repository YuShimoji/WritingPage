(function () {
  'use strict';

  var utils = window.ZWGadgetsUtils;
  var ZWGadgetsCore = window.ZWGadgetsCore;
  if (!utils || !ZWGadgetsCore) return;

  var ZWGadgetsInstance = window.ZWGadgets || new ZWGadgetsCore();

  // 階層対応Documentsガジェット
  ZWGadgetsInstance.register('Documents', function (el) {
    try {
      var storage = window.ZenWriterStorage;
      var treeUI = window.DocumentsTreeUI;

      if (!storage || !treeUI) {
        var warn = document.createElement('p');
        warn.textContent = 'ストレージ機能またはツリーUIが利用できません。';
        warn.style.fontSize = '0.9rem';
        warn.style.opacity = '0.7';
        el.appendChild(warn);
        return;
      }

      var editorManager = window.ZenWriterEditor;

      // ========== ヘルパー関数 ==========
      function notify(message, duration) {
        try {
          if (editorManager && typeof editorManager.showNotification === 'function') {
            editorManager.showNotification(message, duration || 1200);
          }
        } catch (_) { }
      }

      // 循環参照チェック: targetIdがparentIdの子孫である場合trueを返す
      function isDescendant(docs, parentId, targetId) {
        if (!parentId || !targetId || parentId === targetId) return false;

        var target = docs.find(function (d) { return d && d.id === targetId; });
        if (!target) return false;

        var currentId = target.parentId;
        while (currentId) {
          if (currentId === parentId) return true;
          var current = docs.find(function (d) { return d && d.id === currentId; });
          if (!current) break;
          currentId = current.parentId;
        }
        return false;
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
        try {
          window.dispatchEvent(new CustomEvent('ZWDocumentsChanged', {
            detail: { docs: storage.loadDocuments() || [] }
          }));
        } catch (_) { }
      }

      function saveCurrentContent() {
        try {
          if (editorManager && editorManager.editor && typeof storage.saveContent === 'function') {
            storage.saveContent(editorManager.editor.value || '');
          }
        } catch (_) { }
      }

      // ========== ドキュメント操作 ==========
      function switchDocument(id) {
        if (!id) return;
        var docs = storage.loadDocuments() || [];
        var doc = docs.find(function (d) { return d && d.id === id && d.type === 'document'; });
        if (!doc) return;

        saveCurrentContent();
        storage.setCurrentDocId(id);

        if (editorManager && typeof editorManager.setContent === 'function') {
          editorManager.setContent(doc.content || '');
        } else {
          storage.saveContent(doc.content || '');
        }

        refreshUI();
        updateDocumentTitle();
        notify('「' + (doc.name || '無題') + '」を開きました');
        dispatchChanged();
      }

      function createDocument(parentId) {
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

        var name = prompt('新しいドキュメント名を入力', '無題');
        if (name === null) return;

        var doc = storage.createDocument(name || '無題', '', parentId);
        storage.setCurrentDocId(doc.id);

        if (editorManager && typeof editorManager.setContent === 'function') {
          editorManager.setContent('');
        } else {
          storage.saveContent('');
        }

        refreshUI();
        updateDocumentTitle();
        notify('ドキュメントを作成しました');
        dispatchChanged();
      }

      function createFolder(parentId) {
        var name = prompt('新しいフォルダ名を入力', '新規フォルダ');
        if (name === null) return;

        storage.createFolder(name || '新規フォルダ', parentId);
        refreshUI();
        notify('フォルダを作成しました');
        dispatchChanged();
      }

      function renameItem(id) {
        var docs = storage.loadDocuments() || [];
        var item = docs.find(function (d) { return d && d.id === id; });
        if (!item) return;

        var newName = prompt(
          (item.type === 'folder' ? 'フォルダ' : 'ドキュメント') + '名を変更',
          item.name || '無題'
        );
        if (newName === null) return;

        storage.renameDocument(id, newName || '無題');
        refreshUI();
        updateDocumentTitle();
        notify('名前を更新しました');
        dispatchChanged();
      }

      function deleteItem(id) {
        var docs = storage.loadDocuments() || [];
        var item = docs.find(function (d) { return d && d.id === id; });
        if (!item) return;

        var confirmMsg = item.type === 'folder'
          ? 'このフォルダを削除しますか？（中身のアイテムは親フォルダに移動します）'
          : 'このドキュメントを削除しますか？この操作は元に戻せません。';

        if (!confirm(confirmMsg)) return;

        storage.deleteDocument(id);
        refreshUI();
        updateDocumentTitle();
        notify((item.type === 'folder' ? 'フォルダ' : 'ドキュメント') + 'を削除しました');
        dispatchChanged();
      }

      function deleteFolderRecursive(id) {
        if (!confirm('このフォルダと中身をすべて削除しますか？この操作は元に戻せません。')) return;

        storage.deleteFolderRecursive(id);
        refreshUI();
        updateDocumentTitle();
        notify('フォルダを削除しました');
        dispatchChanged();
      }

      // ========== UI構築 ==========
      var container = document.createElement('div');
      container.className = 'documents-hierarchy';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';

      // ツールバー
      var toolbar = document.createElement('div');
      toolbar.className = 'documents-toolbar';
      toolbar.style.display = 'flex';
      toolbar.style.gap = '4px';
      toolbar.style.marginBottom = '8px';

      var newDocBtn = document.createElement('button');
      newDocBtn.type = 'button';
      newDocBtn.id = 'new-document-btn'; // E2Eテスト互換性のため追加
      newDocBtn.textContent = '+ 新規';
      newDocBtn.title = 'ルートに新規ドキュメント作成';
      newDocBtn.addEventListener('click', function () { createDocument(null); });

      var newFolderBtn = document.createElement('button');
      newFolderBtn.type = 'button';
      newFolderBtn.textContent = '📁 フォルダ';
      newFolderBtn.title = 'ルートに新規フォルダ作成';
      newFolderBtn.addEventListener('click', function () { createFolder(null); });

      // スナップショット復元ボタン
      var restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.id = 'restore-from-snapshot'; // E2Eテスト互換性のため追加
      restoreBtn.textContent = '📜 復元';
      restoreBtn.title = '最後のスナップショットから復元';
      restoreBtn.addEventListener('click', function () {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.restoreLastSnapshot === 'function') {
          window.ZenWriterEditor.restoreLastSnapshot();
        }
      });

      toolbar.appendChild(newDocBtn);
      toolbar.appendChild(newFolderBtn);
      toolbar.appendChild(restoreBtn);

      // ツリーコンテナ
      var treeContainer = document.createElement('div');
      treeContainer.className = 'documents-tree-container';
      treeContainer.style.flex = '1';
      treeContainer.style.overflow = 'auto';

      container.appendChild(toolbar);
      container.appendChild(treeContainer);
      el.appendChild(container);

      // ========== イベントハンドラ ==========
      var handlers = {
        onSelectDocument: function (id) {
          switchDocument(id);
        },
        onToggleFolder: function (id) {
          storage.toggleFolderCollapsed(id);
          refreshUI();
        },
        onDropItem: function (draggedId, targetFolderId) {
          // 循環参照チェック: ドラッグ元がフォルダで、ドロップ先がその子孫の場合は禁止
          var docs = storage.loadDocuments() || [];
          var draggedItem = docs.find(function (d) { return d && d.id === draggedId; });

          if (draggedItem && draggedItem.type === 'folder' && targetFolderId) {
            if (isDescendant(docs, draggedId, targetFolderId)) {
              notify('フォルダをその子孫フォルダに移動することはできません', 2000);
              return;
            }
          }

          storage.moveItem(draggedId, targetFolderId);
          refreshUI();
          notify('移動しました');
          dispatchChanged();
        },
        onContextMenu: function (e, item) {
          showContextMenu(e, item);
        }
      };

      // コンテキストメニュー
      var contextMenu = null;

      function showContextMenu(e, item) {
        // 既存のメニューを削除
        if (contextMenu && contextMenu.parentNode) {
          contextMenu.parentNode.removeChild(contextMenu);
        }

        contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.position = 'fixed';
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        contextMenu.style.backgroundColor = '#fff';
        contextMenu.style.border = '1px solid #ccc';
        contextMenu.style.borderRadius = '4px';
        contextMenu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        contextMenu.style.zIndex = '10000';
        contextMenu.style.minWidth = '150px';

        var menuItems = [];

        if (item.type === 'folder') {
          menuItems.push({
            label: '新規ドキュメント',
            action: function () { createDocument(item.id); }
          });
          menuItems.push({
            label: '新規フォルダ',
            action: function () { createFolder(item.id); }
          });
          menuItems.push({ separator: true });
        }

        menuItems.push({
          label: '名前を変更',
          action: function () { renameItem(item.id); }
        });

        menuItems.push({
          label: '削除',
          action: function () { deleteItem(item.id); }
        });

        if (item.type === 'folder') {
          menuItems.push({
            label: '中身ごと削除',
            action: function () { deleteFolderRecursive(item.id); }
          });
        }

        menuItems.forEach(function (menuItem) {
          if (menuItem.separator) {
            var sep = document.createElement('div');
            sep.style.height = '1px';
            sep.style.backgroundColor = '#e0e0e0';
            sep.style.margin = '4px 0';
            contextMenu.appendChild(sep);
          } else {
            var menuBtn = document.createElement('button');
            menuBtn.type = 'button';
            menuBtn.textContent = menuItem.label;
            menuBtn.style.display = 'block';
            menuBtn.style.width = '100%';
            menuBtn.style.padding = '8px 12px';
            menuBtn.style.border = 'none';
            menuBtn.style.background = 'none';
            menuBtn.style.textAlign = 'left';
            menuBtn.style.cursor = 'pointer';
            menuBtn.addEventListener('mouseover', function () {
              menuBtn.style.backgroundColor = '#f0f0f0';
            });
            menuBtn.addEventListener('mouseout', function () {
              menuBtn.style.backgroundColor = 'transparent';
            });
            menuBtn.addEventListener('click', function () {
              menuItem.action();
              closeContextMenu();
            });
            contextMenu.appendChild(menuBtn);
          }
        });

        document.body.appendChild(contextMenu);

        // クリック外でメニューを閉じる
        setTimeout(function () {
          document.addEventListener('click', closeContextMenu);
        }, 0);
      }

      function closeContextMenu() {
        if (contextMenu && contextMenu.parentNode) {
          contextMenu.parentNode.removeChild(contextMenu);
          contextMenu = null;
        }
        document.removeEventListener('click', closeContextMenu);
      }

      // ========== UI更新 ==========
      function refreshUI() {
        var tree = storage.buildTree();
        var currentId = storage.getCurrentDocId();

        treeUI.renderTree(tree, treeContainer, handlers);
        treeUI.highlightActive(treeContainer, currentId);
        treeUI.addRootDropZone(treeContainer, function (draggedId, targetId) {
          handlers.onDropItem(draggedId, targetId);
        });
      }

      // ========== 初期化 ==========
      refreshUI();

      // ドキュメント変更イベントをリッスン
      window.addEventListener('ZWDocumentsChanged', function () {
        refreshUI();
      });

    } catch (e) {
      console.error('Documents (Hierarchy) gadget failed:', e);
      try {
        el.textContent = 'ドキュメント管理の初期化に失敗しました。';
      } catch (_) { }
    }
  }, {
    groups: ['structure'],
    title: 'ドキュメント',
    description: 'ドキュメントの階層ツリー表示と管理。'
  });

  // グローバルに公開
  window.ZWGadgets = ZWGadgetsInstance;
})();
