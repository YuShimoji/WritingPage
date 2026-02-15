/**
 * gadgets-keybinds.js
 * キーバインド編集ガジェット
 * サイドバー内でキーバインドを編集できるUIを提供
 */
(function () {
  'use strict';

  var ZWGadgets = window.ZWGadgets;
  if (!ZWGadgets || typeof ZWGadgets.register !== 'function') return;
  if (!window.ZenWriterKeybinds) return;

  var Keybinds = window.ZenWriterKeybinds;

  function tryNotify(message, duration) {
    try {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.showNotification === 'function') {
        window.ZenWriterEditor.showNotification(message, duration || 2000);
        return;
      }
    } catch (_) { }
    try { alert(message); } catch (_) { }
  }

  ZWGadgets.register('Keybinds', function (root) {
    try {
      root.innerHTML = '';
      root.style.display = 'grid';
      root.style.gap = '12px';

      // ヘッダー
      var header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '8px';

      var title = document.createElement('h3');
      title.textContent = (window.UILabels && window.UILabels.KEYBINDS_TITLE) || 'キーボードショートカット';
      title.style.margin = '0';
      title.style.fontSize = '1.1em';
      header.appendChild(title);

      var resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'small';
      resetBtn.textContent = (window.UILabels && window.UILabels.KEYBINDS_RESET) || 'デフォルトに戻す';
      resetBtn.addEventListener('click', function () {
        if (confirm((window.UILabels && window.UILabels.KEYBINDS_RESET_CONFIRM) || 'すべてのキーバインドをデフォルトに戻しますか？')) {
          if (Keybinds.reset()) {
            renderKeybindList();
            tryNotify((window.UILabels && window.UILabels.KEYBINDS_RESET_SUCCESS) || 'デフォルトに戻しました', 1500);
          } else {
            tryNotify((window.UILabels && window.UILabels.KEYBINDS_RESET_FAILED) || 'リセットに失敗しました', 2000);
          }
        }
      });
      header.appendChild(resetBtn);
      root.appendChild(header);

      // 説明
      var hint = document.createElement('div');
      hint.className = 'keybinds-hint';
      hint.style.fontSize = '0.85em';
      hint.style.opacity = '0.7';
      hint.style.marginBottom = '8px';
      hint.textContent = (window.UILabels && window.UILabels.KEYBINDS_HINT) || '各ショートカットをクリックして新しいキーを設定できます';
      root.appendChild(hint);

      // キーバインドリストコンテナ
      var listContainer = document.createElement('div');
      listContainer.className = 'keybinds-list';
      listContainer.style.display = 'grid';
      listContainer.style.gap = '8px';
      root.appendChild(listContainer);

      // 編集中のキーバインドID
      var editingId = null;
      var captureListener = null;

      /**
       * キーバインドリストをレンダリング
       */
      function renderKeybindList() {
        listContainer.innerHTML = '';
        var keybinds = Keybinds.load();
        var defaults = Keybinds.getDefaults();

        Object.keys(keybinds).sort().forEach(function (id) {
          var keybind = keybinds[id];
          var defaultKeybind = defaults[id];
          var isCustom = defaultKeybind && Keybinds.keybindToString(keybind) !== Keybinds.keybindToString(defaultKeybind);

          var item = document.createElement('div');
          item.className = 'keybind-item';
          item.style.display = 'grid';
          item.style.gridTemplateColumns = '1fr auto';
          item.style.gap = '8px';
          item.style.padding = '8px';
          item.style.border = '1px solid var(--border-color, #e0e0e0)';
          item.style.borderRadius = '4px';
          item.style.alignItems = 'center';
          if (editingId === id) {
            item.style.borderColor = 'var(--focus-color, #4a90e2)';
            item.style.borderWidth = '2px';
            item.style.backgroundColor = 'var(--ui-bg, #f5f5f5)';
          }

          var left = document.createElement('div');
          left.style.display = 'flex';
          left.style.flexDirection = 'column';
          left.style.gap = '4px';

          var desc = document.createElement('div');
          desc.textContent = keybind.description || id;
          desc.style.fontWeight = '500';
          desc.style.fontSize = '0.95em';
          left.appendChild(desc);

          if (isCustom) {
            var customBadge = document.createElement('span');
            customBadge.textContent = (window.UILabels && window.UILabels.KEYBINDS_CUSTOM) || 'カスタム';
            customBadge.style.fontSize = '0.75em';
            customBadge.style.color = 'var(--accent-color, #4a90e2)';
            customBadge.style.opacity = '0.8';
            left.appendChild(customBadge);
          }

          var right = document.createElement('div');
          right.style.display = 'flex';
          right.style.alignItems = 'center';
          right.style.gap = '8px';

          var keyDisplay = document.createElement('kbd');
          keyDisplay.className = 'keybind-display';
          keyDisplay.textContent = editingId === id ? '...' : Keybinds.format(keybind);
          keyDisplay.style.padding = '4px 8px';
          keyDisplay.style.backgroundColor = 'var(--ui-bg, #f0f0f0)';
          keyDisplay.style.border = '1px solid var(--border-color, #d0d0d0)';
          keyDisplay.style.borderRadius = '3px';
          keyDisplay.style.fontSize = '0.85em';
          keyDisplay.style.fontFamily = 'monospace';
          keyDisplay.style.cursor = 'pointer';
          keyDisplay.style.userSelect = 'none';
          keyDisplay.title = (window.UILabels && window.UILabels.KEYBINDS_CLICK_TO_EDIT) || 'クリックして編集';

          if (editingId === id) {
            keyDisplay.style.backgroundColor = 'var(--focus-color, #4a90e2)';
            keyDisplay.style.color = '#fff';
            keyDisplay.style.borderColor = 'var(--focus-color, #4a90e2)';
          }

          keyDisplay.addEventListener('click', function () {
            if (editingId === id) {
              // 編集中ならキャンセル
              cancelEditing();
              return;
            }
            startEditing(id);
          });

          right.appendChild(keyDisplay);

          if (isCustom && editingId !== id) {
            var clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'small';
            clearBtn.textContent = '×';
            clearBtn.style.padding = '2px 6px';
            clearBtn.style.minWidth = 'auto';
            clearBtn.title = (window.UILabels && window.UILabels.KEYBINDS_CLEAR) || 'デフォルトに戻す';
            clearBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              if (defaultKeybind) {
                Keybinds.set(id, defaultKeybind);
                renderKeybindList();
                tryNotify((window.UILabels && window.UILabels.KEYBINDS_CLEARED) || 'デフォルトに戻しました', 1500);
              }
            });
            right.appendChild(clearBtn);
          }

          item.appendChild(left);
          item.appendChild(right);
          listContainer.appendChild(item);
        });
      }

      /**
       * 編集を開始
       */
      function startEditing(id) {
        if (editingId === id) return;

        cancelEditing();
        editingId = id;

        // キーキャプチャリスナーを追加
        captureListener = function (e) {
          e.preventDefault();
          e.stopPropagation();

          // 修飾キーのみは無視
          if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
            return;
          }

          // Escapeでキャンセル
          if (e.key === 'Escape') {
            cancelEditing();
            return;
          }

          // キーバインドを生成
          var newKeybind = Keybinds.eventToKeybind(e);
          var keybinds = Keybinds.load();

          // 競合チェック
          var conflicts = Keybinds.detectConflicts(keybinds, id, newKeybind);
          if (conflicts.length > 0) {
            var conflictNames = conflicts.map(function (c) { return c.description; }).join(', ');
            if (!confirm((window.UILabels && window.UILabels.KEYBINDS_CONFLICT) || 
              'このキーは既に使用されています: ' + conflictNames + '\n上書きしますか？')) {
              return;
            }
            // 競合するキーバインドをクリア
            conflicts.forEach(function (conflict) {
              var defaultKb = Keybinds.getDefaults()[conflict.id];
              if (defaultKb) {
                Keybinds.set(conflict.id, defaultKb);
              }
            });
          }

          // キーバインドを保存
          if (Keybinds.set(id, newKeybind)) {
            tryNotify((window.UILabels && window.UILabels.KEYBINDS_SAVED) || 'キーバインドを保存しました', 1500);
          } else {
            tryNotify((window.UILabels && window.UILabels.KEYBINDS_SAVE_FAILED) || '保存に失敗しました', 2000);
          }

          cancelEditing();
          renderKeybindList();
        };

        document.addEventListener('keydown', captureListener, true);
        renderKeybindList();
      }

      /**
       * 編集をキャンセル
       */
      function cancelEditing() {
        if (captureListener) {
          document.removeEventListener('keydown', captureListener, true);
          captureListener = null;
        }
        editingId = null;
        renderKeybindList();
      }

      // 初期レンダリング
      renderKeybindList();

      // クリーンアップ（ガジェットが削除される場合）
      return function cleanup() {
        cancelEditing();
      };
    } catch (e) {
      console.error('Keybinds gadget error:', e);
      root.innerHTML = '<div style="color: red;">キーバインド編集の初期化に失敗しました</div>';
    }
  }, {
    title: (window.UILabels && window.UILabels.KEYBINDS_GADGET_TITLE) || 'キーボードショートカット',
    groups: ['settings']
  });

})();
