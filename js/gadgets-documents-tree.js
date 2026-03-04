(function () {
  'use strict';

  // ツリーUI実装を既存のDocumentsガジェットに統合するヘルパー

  /**
   * ツリーアイテムをレンダリング（再帰的）
   * @param {Object} item - ツリーアイテム
   * @param {number} depth - 現在の深さ
   * @param {Object} handlers - イベントハンドラ
   * @returns {HTMLElement} ツリーアイテムの要素
   */
  function renderTreeItem(item, depth, handlers) {
    const container = document.createElement('div');
    container.className = 'tree-item';
    container.dataset.id = item.id;
    container.dataset.type = item.type;
    container.style.paddingLeft = (depth * 16) + 'px';

    const row = document.createElement('div');
    row.className = 'tree-item-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.padding = '4px 8px';
    row.style.borderRadius = '4px';
    row.style.cursor = 'pointer';
    row.style.userSelect = 'none';

    // フォルダの場合: 折りたたみボタン
    if (item.type === 'folder') {
      const toggle = document.createElement('span');
      toggle.className = 'tree-toggle';
      toggle.textContent = item.collapsed ? '▶' : '▼';
      toggle.style.marginRight = '4px';
      toggle.style.fontSize = '0.8em';
      toggle.style.cursor = 'pointer';
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (handlers.onToggleFolder) {
          handlers.onToggleFolder(item.id);
        }
      });
      row.appendChild(toggle);
    } else {
      // ドキュメントの場合: インデント用スペース
      const spacer = document.createElement('span');
      spacer.style.width = '12px';
      spacer.style.display = 'inline-block';
      row.appendChild(spacer);
    }

    // アイコン
    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    icon.textContent = item.type === 'folder' ? '📁' : '📄';
    icon.style.marginRight = '6px';
    row.appendChild(icon);

    // ラベル
    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = item.name || '無題';
    label.style.flex = '1';
    row.appendChild(label);

    // クリックイベント
    row.addEventListener('click', () => {
      if (item.type === 'document' && handlers.onSelectDocument) {
        handlers.onSelectDocument(item.id);
      } else if (item.type === 'folder' && handlers.onToggleFolder) {
        handlers.onToggleFolder(item.id);
      }
    });

    // コンテキストメニュー
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (handlers.onContextMenu) {
        handlers.onContextMenu(e, item);
      }
    });

    // ドラッグ&ドロップ
    row.draggable = true;
    row.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.id);
      row.classList.add('dragging');
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
    });

    if (item.type === 'folder') {
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== item.id && handlers.onDropItem) {
          handlers.onDropItem(draggedId, item.id);
        }
      });
    }

    container.appendChild(row);

    // 子要素（フォルダが展開されている場合）
    if (item.type === 'folder' && !item.collapsed && item.children && item.children.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'tree-children';

      item.children.forEach(child => {
        const childEl = renderTreeItem(child, depth + 1, handlers);
        childrenContainer.appendChild(childEl);
      });

      container.appendChild(childrenContainer);
    }

    return container;
  }

  /**
   * ツリー全体をレンダリング
   * @param {Array} tree - ツリー構造
   * @param {HTMLElement} container - コンテナ要素
   * @param {Object} handlers - イベントハンドラ
   */
  function renderTree(tree, container, handlers) {
    container.innerHTML = '';

    if (!tree || tree.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'ドキュメントがありません';
      empty.style.opacity = '0.6';
      empty.style.padding = '16px 8px';
      empty.style.textAlign = 'center';
      container.appendChild(empty);
      return;
    }

    tree.forEach(item => {
      const el = renderTreeItem(item, 0, handlers);
      container.appendChild(el);
    });
  }

  /**
   * アクティブなアイテムをハイライト
   * @param {HTMLElement} container - コンテナ要素
   * @param {string} activeId - アクティブなアイテムのID
   */
  function highlightActive(container, activeId) {
    // すべてのアクティブクラスを削除
    container.querySelectorAll('.tree-item-row.active').forEach(el => {
      el.classList.remove('active');
    });

    // 新しいアクティブアイテムにクラスを追加
    if (activeId) {
      const active = container.querySelector(`.tree-item[data-id="${CSS.escape(activeId)}"] .tree-item-row`);
      if (active) {
        active.classList.add('active');
        active.style.backgroundColor = 'var(--accent-color, #4a90e2)';
        active.style.color = '#ffffff';
      }
    }
  }

  /**
   * ルートへのドロップゾーンを追加
   * @param {HTMLElement} container - コンテナ要素
   * @param {Function} onDrop - ドロップハンドラ
   */
  function addRootDropZone(container, onDrop) {
    const dropZone = document.createElement('div');
    dropZone.className = 'tree-root-drop-zone';
    dropZone.textContent = 'ルートに移動';
    dropZone.style.padding = '8px';
    dropZone.style.margin = '4px';
    dropZone.style.border = '2px dashed #ccc';
    dropZone.style.borderRadius = '4px';
    dropZone.style.textAlign = 'center';
    dropZone.style.color = '#999';
    dropZone.style.display = 'none';

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dropZone.style.display = 'block';
      dropZone.style.borderColor = '#4a90e2';
      dropZone.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = '#ccc';
      dropZone.style.backgroundColor = 'transparent';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && onDrop) {
        onDrop(draggedId, null); // null = ルート
      }
      dropZone.style.display = 'none';
      dropZone.style.borderColor = '#ccc';
      dropZone.style.backgroundColor = 'transparent';
    });

    // ドラッグ開始時に表示
    container.addEventListener('dragstart', () => {
      dropZone.style.display = 'block';
    });

    container.addEventListener('dragend', () => {
      setTimeout(() => {
        dropZone.style.display = 'none';
      }, 100);
    });

    container.insertBefore(dropZone, container.firstChild);
  }

  // グローバルに公開
  window.DocumentsTreeUI = {
    renderTree,
    highlightActive,
    addRootDropZone
  };
})();
