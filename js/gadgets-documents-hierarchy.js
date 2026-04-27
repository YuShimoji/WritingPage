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
          if (editorManager && typeof storage.saveContent === 'function') {
            // WYSIWYG モード対応: getEditorValue() で正しい Markdown を取得
            var content = '';
            if (typeof editorManager.getEditorValue === 'function') {
              content = editorManager.getEditorValue() || '';
            } else if (editorManager.editor) {
              content = editorManager.editor.value || '';
            }
            storage.saveContent(content);
          }
        } catch (_) { }
      }

      // ========== ドキュメント操作 ==========
      function switchDocument(id) {
        if (!id) return;
        var docs = storage.loadDocuments() || [];
        var doc = docs.find(function (d) { return d && d.id === id && d.type === 'document'; });
        if (!doc) return;

        // ContentGuard 経由: chapterMode flush + dirty保存 + WYSIWYG安全取得を一括
        var G = window.ZWContentGuard;
        if (G) {
          var canProceed = G.prepareDocumentSwitch(id, {
            confirmIfDirty: true
          });
          if (!canProceed) return;
        } else {
          // フォールバック: 既存の saveCurrentContent
          saveCurrentContent();
        }

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
        // ContentGuard 経由: dirty チェック + スナップショット退避
        var G = window.ZWContentGuard;
        if (G) {
          if (!G.prepareNewDocument()) return;
        } else {
          // フォールバック
          try {
            var hasDirty = (editorManager && typeof editorManager.isDirty === 'function')
              ? editorManager.isDirty()
              : false;
            if (hasDirty) {
              var msg = (window.UILabels && window.UILabels.UNSAVED_CHANGES_NEW) || '未保存の変更があります。新規作成を続行しますか？\n現在の内容はスナップショットとして自動退避します。';
              if (!confirm(msg)) return;
              try {
                var content = (G ? G.getEditorContent() : '') || ((editorManager && typeof editorManager.getEditorValue === 'function') ? editorManager.getEditorValue() : '') || '';
                if (storage && typeof storage.addSnapshot === 'function' && content) {
                  storage.addSnapshot(content);
                }
              } catch (_) { }
            }
          } catch (_) { }
        }

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
      container.style.gap = '0.5rem';

      // ツールバー
      var toolbar = document.createElement('div');
      toolbar.className = 'documents-toolbar';
      toolbar.style.display = 'flex';
      toolbar.style.gap = '0.25rem';
      toolbar.style.marginBottom = '0.5rem';
      toolbar.style.alignItems = 'center';

      var newDocBtn = document.createElement('button');
      newDocBtn.type = 'button';
      newDocBtn.className = 'zw-shell-control zw-shell-control--text';
      newDocBtn.id = 'new-document-btn';
      newDocBtn.textContent = '+ 新規';
      newDocBtn.title = 'ルートに新規ドキュメント作成';
      newDocBtn.addEventListener('click', function () { createDocument(null); });

      var saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'zw-shell-control zw-shell-control--text';
      saveBtn.textContent = ((window.UILabels && window.UILabels.SAVE) || '保存');
      saveBtn.title = '現在の内容を保存';
      saveBtn.addEventListener('click', function () {
        saveCurrentContent();
        if (editorManager && typeof editorManager.refreshDirtyBaseline === 'function') {
          editorManager.refreshDirtyBaseline();
        }
        notify((window.UILabels && window.UILabels.SAVED) || '保存しました');
      });

      // overflow メニュー
      var moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'documents-more-btn zw-shell-control zw-shell-control--icon';
      moreBtn.textContent = '\u2026';
      moreBtn.setAttribute('aria-label', 'ドキュメント操作メニュー');
      moreBtn.setAttribute('aria-haspopup', 'menu');
      moreBtn.setAttribute('aria-expanded', 'false');
      moreBtn.title = 'その他の操作';

      var moreMenu = document.createElement('div');
      moreMenu.className = 'documents-more-menu zw-shell-menu';
      moreMenu.setAttribute('role', 'menu');
      moreMenu.style.display = 'none';
      moreMenu.style.position = 'absolute';
      moreMenu.style.zIndex = '1001';

      function createMenuItem(label, title, handler) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'zw-shell-menu__item';
        item.setAttribute('role', 'menuitem');
        item.textContent = label;
        item.title = title;
        item.addEventListener('click', function () {
          moreMenu.style.display = 'none';
          moreBtn.setAttribute('aria-expanded', 'false');
          handler();
        });
        return item;
      }

      moreMenu.appendChild(createMenuItem('フォルダ作成', 'ルートに新規フォルダ作成', function () { createFolder(null); }));
      moreMenu.appendChild(createMenuItem('TXTエクスポート', '現在の内容をテキストで書き出し', function () {
        saveCurrentContent();
        if (editorManager && typeof editorManager.exportAsText === 'function') {
          editorManager.exportAsText();
        } else if (storage && typeof storage.exportText === 'function') {
          var text = '';
          try {
            var G = window.ZWContentGuard;
            text = G ? G.getEditorContent() : ((editorManager && typeof editorManager.getEditorValue === 'function') ? editorManager.getEditorValue() : '') || '';
            if (!text) text = storage.loadContent ? storage.loadContent() : '';
          } catch (_) { }
          storage.exportText(text || '', 'document.txt', 'text/plain');
        }
      }));
      moreMenu.appendChild(createMenuItem('JSON保存', '現在のドキュメントを構造保持JSONで保存', function () {
        saveCurrentContent();
        var docId = storage.getCurrentDocId ? storage.getCurrentDocId() : null;
        if (!docId) { notify('ドキュメントが選択されていません'); return; }
        if (storage.exportProjectJSON) {
          var ok = storage.exportProjectJSON(docId);
          if (ok) notify('JSONプロジェクトを保存しました');
        }
      }));
      moreMenu.appendChild(createMenuItem('JSON読込', 'JSONプロジェクトファイルを読み込み', function () {
        if (storage.importProjectJSONFromFile) {
          storage.importProjectJSONFromFile().then(function (docId) {
            if (docId) {
              switchDocument(docId);
              refreshUI();
              notify('プロジェクトを読み込みました');
              dispatchChanged();
            }
          });
        }
      }));

      // スナップショット復元
      var restoreItem = createMenuItem('復元', '最後のスナップショットから復元', function () {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.restoreLastSnapshot === 'function') {
          window.ZenWriterEditor.restoreLastSnapshot();
        }
      });
      restoreItem.id = 'restore-from-snapshot';
      moreMenu.appendChild(restoreItem);

      moreBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = moreMenu.style.display !== 'none';
        moreMenu.style.display = isOpen ? 'none' : 'block';
        moreBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        if (!isOpen) {
          var rect = moreBtn.getBoundingClientRect();
          moreMenu.style.top = (rect.bottom + 2) + 'px';
          moreMenu.style.left = Math.max(0, rect.right - 160) + 'px';
        }
      });

      document.addEventListener('click', function () {
        moreMenu.style.display = 'none';
        moreBtn.setAttribute('aria-expanded', 'false');
      });

      // BL-005: 選択モードボタン + 一括削除ボタン
      var selectMode = false;
      var selectedIds = new Set();
      var lastClickedId = null; // Shift+Click 範囲選択のアンカー

      // ツリーを DFS で展開し選択可能な document id を順序付きで返す
      function getFlatSelectableIds() {
        var result = [];
        function walk(nodes) {
          if (!nodes) return;
          nodes.forEach(function (n) {
            if (!n) return;
            if (n.type === 'document') result.push(n.id);
            if (n.children && n.children.length) walk(n.children);
          });
        }
        try { walk(storage.buildTree()); } catch (_) { }
        return result;
      }

      var selectModeBtn = document.createElement('button');
      selectModeBtn.type = 'button';
      selectModeBtn.className = 'zw-shell-control zw-shell-control--text';
      selectModeBtn.textContent = '選択';
      selectModeBtn.title = '複数選択モード';
      selectModeBtn.addEventListener('click', function () {
        selectMode = !selectMode;
        selectedIds.clear();
        lastClickedId = null;
        selectModeBtn.setAttribute('aria-pressed', selectMode ? 'true' : 'false');
        batchDeleteBtn.style.display = 'none';
        selectAllBtn.style.display = selectMode ? '' : 'none';
        refreshUI();
      });

      var selectAllBtn = document.createElement('button');
      selectAllBtn.type = 'button';
      selectAllBtn.className = 'zw-shell-control zw-shell-control--text';
      selectAllBtn.textContent = '全選択';
      selectAllBtn.title = '表示中のドキュメントをすべて選択';
      selectAllBtn.style.display = 'none';
      selectAllBtn.addEventListener('click', function () {
        if (!selectMode) return;
        var ids = getFlatSelectableIds();
        var allSelected = ids.length > 0 && ids.every(function (id) { return selectedIds.has(id); });
        selectedIds.clear();
        if (!allSelected) {
          ids.forEach(function (id) { selectedIds.add(id); });
        }
        lastClickedId = null;
        batchDeleteBtn.style.display = selectedIds.size > 0 ? '' : 'none';
        batchDeleteBtn.textContent = selectedIds.size > 0 ? (selectedIds.size + ' 件削除') : '一括削除';
        selectAllBtn.textContent = allSelected ? '全選択' : '全解除';
        refreshUI();
      });

      var batchDeleteBtn = document.createElement('button');
      batchDeleteBtn.type = 'button';
      batchDeleteBtn.className = 'zw-shell-control zw-shell-control--text zw-shell-control--danger';
      batchDeleteBtn.textContent = '一括削除';
      batchDeleteBtn.title = '選択したドキュメントを一括削除';
      batchDeleteBtn.style.display = 'none';
      batchDeleteBtn.addEventListener('click', function () {
        var count = selectedIds.size;
        if (count === 0) return;
        if (!confirm(count + ' 件のドキュメントを削除しますか?')) return;
        storage.deleteMultipleDocuments(Array.from(selectedIds));
        selectedIds.clear();
        lastClickedId = null;
        selectMode = false;
        selectModeBtn.setAttribute('aria-pressed', 'false');
        batchDeleteBtn.style.display = 'none';
        batchDeleteBtn.textContent = '一括削除';
        selectAllBtn.style.display = 'none';
        selectAllBtn.textContent = '全選択';
        refreshUI();
        dispatchChanged();
        notify(count + ' 件を削除しました');
      });

      // 「選択」は overflow メニューに移動 (BL-005 修正: ツールバー膨張防止)
      moreMenu.appendChild(createMenuItem('複数選択', '複数のドキュメントを選択して操作', function () {
        selectMode = !selectMode;
        selectedIds.clear();
        lastClickedId = null;
        selectModeBtn.setAttribute('aria-pressed', selectMode ? 'true' : 'false');
        batchDeleteBtn.style.display = 'none';
        selectAllBtn.style.display = selectMode ? '' : 'none';
        refreshUI();
      }));

      toolbar.appendChild(newDocBtn);
      toolbar.appendChild(saveBtn);
      toolbar.appendChild(selectAllBtn);
      toolbar.appendChild(batchDeleteBtn);
      toolbar.appendChild(moreBtn);
      document.body.appendChild(moreMenu);

      // ツリーコンテナ
      var treeContainer = document.createElement('div');
      treeContainer.className = 'documents-tree-container';
      treeContainer.style.flex = '1';
      treeContainer.style.overflow = 'auto';

      container.appendChild(toolbar);
      container.appendChild(treeContainer);
      el.appendChild(container);

      function syncSelectionToolbar() {
        batchDeleteBtn.style.display = selectedIds.size > 0 ? '' : 'none';
        batchDeleteBtn.textContent = selectedIds.size > 0 ? (selectedIds.size + ' 件削除') : '一括削除';
        var ids = getFlatSelectableIds();
        var allSelected = ids.length > 0 && ids.every(function (id) { return selectedIds.has(id); });
        selectAllBtn.textContent = allSelected ? '全解除' : '全選択';
      }

      // ========== イベントハンドラ ==========
      var handlers = {
        get multiSelect() { return selectMode; },
        isSelected: function (id) { return selectedIds.has(id); },
        onSelectionChange: function (id, checked) {
          if (checked) { selectedIds.add(id); } else { selectedIds.delete(id); }
          lastClickedId = id;
          syncSelectionToolbar();
        },
        onRangeSelect: function (targetId, checked) {
          var ids = getFlatSelectableIds();
          var targetIdx = ids.indexOf(targetId);
          if (targetIdx < 0) {
            // 範囲外(folder など) は単体選択にフォールバック
            if (checked) { selectedIds.add(targetId); } else { selectedIds.delete(targetId); }
            lastClickedId = targetId;
            syncSelectionToolbar();
            refreshUI();
            return;
          }
          var anchorIdx = lastClickedId ? ids.indexOf(lastClickedId) : -1;
          if (anchorIdx < 0) {
            // アンカーなし: 単体選択として扱う
            if (checked) { selectedIds.add(targetId); } else { selectedIds.delete(targetId); }
            lastClickedId = targetId;
            syncSelectionToolbar();
            refreshUI();
            return;
          }
          var lo = Math.min(anchorIdx, targetIdx);
          var hi = Math.max(anchorIdx, targetIdx);
          for (var i = lo; i <= hi; i++) {
            if (checked) { selectedIds.add(ids[i]); } else { selectedIds.delete(ids[i]); }
          }
          lastClickedId = targetId;
          syncSelectionToolbar();
          refreshUI();
        },
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
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';

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
            sep.className = 'context-menu-divider';
            contextMenu.appendChild(sep);
          } else {
            var menuBtn = document.createElement('button');
            menuBtn.type = 'button';
            menuBtn.textContent = menuItem.label;
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
    description: 'ドキュメント階層をツリー表示し、並び替え・移動を管理。'
  });

  // グローバルに公開
  window.ZWGadgets = ZWGadgetsInstance;
})();
