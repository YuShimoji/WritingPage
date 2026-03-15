/**
 * chapter-list.js — SP-071 Phase 1 チャプターリスト UI
 *
 * Focus モードの左パネルにチャプターリストを表示する。
 * 見出しベースのドキュメントから章を自動検出し、
 * クリック・ダブルクリック・右クリック・ドラッグ&ドロップで操作する。
 *
 * 依存: chapter-model.js (ZWChapterModel)
 */
(function () {
  'use strict';

  var Model = null; // ZWChapterModel (lazy init)
  var panelEl = null;
  var listEl = null;
  var addBtn = null;
  var chapters = [];
  var activeChapterIdx = -1;
  var refreshTimer = null;
  var contextMenu = null;
  var dragState = null;

  // ---- Init ----

  function init() {
    Model = window.ZWChapterModel;
    if (!Model) {
      console.warn('chapter-list: ZWChapterModel not found');
      return;
    }

    panelEl = document.getElementById('focus-chapter-panel');
    listEl = document.getElementById('focus-chapter-list');
    if (!panelEl || !listEl) return;

    // 「+ 新しい章」ボタン
    addBtn = document.getElementById('focus-add-chapter');
    if (addBtn) {
      addBtn.addEventListener('click', handleAddChapter);
    }

    // エディタ入力時にリフレッシュ
    var editorEl = document.getElementById('editor');
    if (editorEl) {
      editorEl.addEventListener('input', scheduleRefresh);
      // カーソル移動でアクティブ章更新
      editorEl.addEventListener('click', updateActive);
      editorEl.addEventListener('keyup', function (e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
            e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
            e.key === 'Home' || e.key === 'End' ||
            e.key === 'PageUp' || e.key === 'PageDown') {
          updateActive();
        }
      });
    }

    // モード切替時にリフレッシュ
    var modeObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'data-ui-mode') {
          var mode = document.documentElement.getAttribute('data-ui-mode');
          if (mode === 'focus') {
            refresh();
          }
          if (mode !== 'focus') {
            closeContextMenu();
          }
        }
      });
    });
    modeObserver.observe(document.documentElement, { attributes: true });

    // 初回: Focusモードならリフレッシュ
    if (document.documentElement.getAttribute('data-ui-mode') === 'focus') {
      setTimeout(refresh, 100);
    }

    // クリック外でコンテキストメニューを閉じる
    document.addEventListener('click', function (e) {
      if (contextMenu && !contextMenu.contains(e.target)) {
        closeContextMenu();
      }
    });

    // 公開API
    window.ZWChapterList = {
      refresh: refresh,
      getChapters: function () { return chapters; },
      getActiveIndex: function () { return activeChapterIdx; },
      navigateTo: navigateToChapter
    };
  }

  // ---- Refresh ----

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 300);
  }

  function refresh() {
    if (!Model || !listEl) return;
    if (document.documentElement.getAttribute('data-ui-mode') !== 'focus') return;

    var text = getEditorText();
    chapters = Model.parseChapters(text);
    render();
    updateActive();
  }

  function updateActive() {
    if (!listEl || chapters.length === 0) return;
    var editorEl = document.getElementById('editor');
    if (!editorEl) return;
    var cursorPos = editorEl.selectionStart || 0;
    activeChapterIdx = Model.getActiveChapterIndex(chapters, cursorPos);

    var items = listEl.querySelectorAll('.cl-item[data-ch-idx]');
    items.forEach(function (item) {
      var idx = parseInt(item.getAttribute('data-ch-idx'), 10);
      var isActive = idx === activeChapterIdx;
      item.classList.toggle('cl-item--active', isActive);
      item.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  // ---- Render ----

  function render() {
    listEl.innerHTML = '';

    if (chapters.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'cl-empty';
      empty.textContent = '見出しがありません';
      listEl.appendChild(empty);
      return;
    }

    chapters.forEach(function (ch, idx) {
      var item = document.createElement('div');
      item.className = 'cl-item cl-item--level-' + ch.level;
      item.setAttribute('data-ch-idx', idx);
      item.setAttribute('data-ch-id', ch.id);
      item.setAttribute('draggable', 'true');
      item.setAttribute('role', 'treeitem');

      var titleSpan = document.createElement('span');
      titleSpan.className = 'cl-item__title';
      titleSpan.textContent = ch.title;
      item.appendChild(titleSpan);

      // 文字数（オプション表示）
      var text = getEditorText();
      var bodyLen = Model.getChapterBody(text, ch).trim().length;
      if (bodyLen > 0) {
        var countSpan = document.createElement('span');
        countSpan.className = 'cl-item__count';
        countSpan.textContent = formatCount(bodyLen);
        item.appendChild(countSpan);
      }

      // イベント
      item.addEventListener('click', handleClick.bind(null, idx));
      item.addEventListener('dblclick', handleDblClick.bind(null, idx));
      item.addEventListener('contextmenu', handleContextMenu.bind(null, idx));

      // ドラッグ&ドロップ
      item.addEventListener('dragstart', handleDragStart.bind(null, idx));
      item.addEventListener('dragover', handleDragOver.bind(null, idx));
      item.addEventListener('dragleave', handleDragLeave);
      item.addEventListener('drop', handleDrop.bind(null, idx));
      item.addEventListener('dragend', handleDragEnd);

      listEl.appendChild(item);
    });

    // リスト末尾にドロップゾーン
    var dropZone = document.createElement('div');
    dropZone.className = 'cl-drop-zone';
    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dropZone.classList.add('cl-drop-zone--active');
    });
    dropZone.addEventListener('dragleave', function () {
      dropZone.classList.remove('cl-drop-zone--active');
    });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropZone.classList.remove('cl-drop-zone--active');
      if (dragState !== null) {
        performReorder(dragState, chapters.length);
        dragState = null;
      }
    });
    listEl.appendChild(dropZone);
  }

  // ---- Click handlers ----

  function handleClick(idx, e) {
    if (e.detail > 1) return; // dblclick は別処理
    navigateToChapter(idx);
  }

  function navigateToChapter(idx) {
    if (idx < 0 || idx >= chapters.length) return;
    var ch = chapters[idx];

    // SectionsNavigator の jumpToHeading を優先
    if (window.ZWGadgets) {
      var sg = window.ZWGadgets.find(function (g) {
        return g.id === 'SectionsNavigator' && typeof g.jumpToHeading === 'function';
      });
      if (sg) {
        sg.jumpToHeading(idx);
        activeChapterIdx = idx;
        updateActive();
        return;
      }
    }

    // フォールバック: 直接スクロール
    var editor = document.getElementById('editor');
    if (editor && typeof editor.setSelectionRange === 'function') {
      editor.focus();
      editor.setSelectionRange(ch.startOffset, ch.startOffset);
      // 見出し位置までスクロール
      var ratio = ch.startOffset / (editor.value || '').length;
      editor.scrollTop = editor.scrollHeight * ratio;
    }
    activeChapterIdx = idx;
    updateActive();
  }

  // ---- Double-click: inline rename ----

  function handleDblClick(idx, e) {
    e.preventDefault();
    e.stopPropagation();
    startInlineRename(idx);
  }

  function startInlineRename(idx) {
    var ch = chapters[idx];
    var item = listEl.querySelector('[data-ch-idx="' + idx + '"]');
    if (!item) return;

    var titleSpan = item.querySelector('.cl-item__title');
    if (!titleSpan) return;

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'cl-item__rename-input';
    input.value = ch.title;
    input.setAttribute('aria-label', '章タイトルを編集');

    titleSpan.replaceWith(input);
    input.focus();
    input.select();

    function commit() {
      var newTitle = input.value.trim();
      if (newTitle && newTitle !== ch.title) {
        var text = getEditorText();
        var updated = Model.renameChapter(text, ch, newTitle);
        setEditorText(updated);
        refresh();
      } else {
        // キャンセル: 元に戻す
        refresh();
      }
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        refresh(); // キャンセル
      }
    });

    input.addEventListener('blur', commit);
  }

  // ---- Context menu ----

  function handleContextMenu(idx, e) {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(idx, e.clientX, e.clientY);
  }

  function showContextMenu(idx, x, y) {
    closeContextMenu();

    contextMenu = document.createElement('div');
    contextMenu.className = 'cl-context-menu';
    contextMenu.setAttribute('role', 'menu');

    var actions = [
      { label: 'リネーム', action: function () { startInlineRename(idx); } },
      { label: '複製', action: function () { performDuplicate(idx); } },
      { label: '上へ移動', action: function () { performMove(idx, 'up'); }, disabled: idx === 0 },
      { label: '下へ移動', action: function () { performMove(idx, 'down'); }, disabled: idx === chapters.length - 1 },
      { label: '---' },
      { label: '削除（見出しのみ）', action: function () { performDelete(idx, false); } },
      { label: '削除（本文含む）', action: function () { performDelete(idx, true); }, dangerous: true }
    ];

    actions.forEach(function (a) {
      if (a.label === '---') {
        var sep = document.createElement('div');
        sep.className = 'cl-context-menu__sep';
        contextMenu.appendChild(sep);
        return;
      }
      var btn = document.createElement('button');
      btn.className = 'cl-context-menu__item';
      if (a.dangerous) btn.classList.add('cl-context-menu__item--danger');
      btn.textContent = a.label;
      btn.disabled = !!a.disabled;
      btn.setAttribute('role', 'menuitem');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeContextMenu();
        if (a.action) a.action();
      });
      contextMenu.appendChild(btn);
    });

    // 位置調整
    document.body.appendChild(contextMenu);
    var rect = contextMenu.getBoundingClientRect();
    var viewW = window.innerWidth;
    var viewH = window.innerHeight;
    if (x + rect.width > viewW) x = viewW - rect.width - 4;
    if (y + rect.height > viewH) y = viewH - rect.height - 4;
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
  }

  function closeContextMenu() {
    if (contextMenu && contextMenu.parentNode) {
      contextMenu.parentNode.removeChild(contextMenu);
    }
    contextMenu = null;
  }

  // ---- Chapter operations ----

  function handleAddChapter() {
    var lastChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;
    var afterId = lastChapter ? lastChapter.id : null;
    var level = lastChapter ? lastChapter.level : 2;

    var text = getEditorText();
    var result = Model.addChapter(text, chapters, afterId, '新しい章', level);
    setEditorText(result.text);
    refresh();

    // 新しい章にナビゲート & インラインリネーム開始
    setTimeout(function () {
      var newIdx = chapters.length - 1;
      navigateToChapter(newIdx);
      startInlineRename(newIdx);
    }, 50);
  }

  function performDuplicate(idx) {
    var ch = chapters[idx];
    var text = getEditorText();
    var updated = Model.duplicateChapter(text, ch);
    setEditorText(updated);
    refresh();
  }

  function performMove(idx, direction) {
    var ch = chapters[idx];
    var text = getEditorText();
    var updated = Model.moveChapter(text, chapters, ch.id, direction);
    if (updated !== null) {
      setEditorText(updated);
      refresh();
      // 移動後のアイテムにナビゲート
      var newIdx = direction === 'up' ? idx - 1 : idx + 1;
      navigateToChapter(newIdx);
    }
  }

  function performDelete(idx, deleteContent) {
    var ch = chapters[idx];
    if (deleteContent) {
      if (!confirm('「' + ch.title + '」の本文も含めて削除しますか？')) return;
    }
    var text = getEditorText();
    var updated = Model.deleteChapter(text, ch, deleteContent);
    setEditorText(updated);
    refresh();
  }

  function performReorder(sourceIdx, targetIdx) {
    if (sourceIdx === targetIdx || sourceIdx === targetIdx - 1) return;
    var ch = chapters[sourceIdx];
    var text = getEditorText();
    var updated = Model.reorderChapter(text, chapters, ch.id, targetIdx);
    if (updated !== null) {
      setEditorText(updated);
      refresh();
    }
  }

  // ---- Drag & Drop ----

  function handleDragStart(idx, e) {
    dragState = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    var item = e.currentTarget;
    setTimeout(function () {
      item.classList.add('cl-item--dragging');
    }, 0);
  }

  function handleDragOver(idx, e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragState === null || dragState === idx) return;

    // ドロップ位置のインジケーター
    var item = e.currentTarget;
    var rect = item.getBoundingClientRect();
    var midY = rect.top + rect.height / 2;
    var isAbove = e.clientY < midY;

    // 既存のインジケーターをリセット
    clearDropIndicators();

    if (isAbove) {
      item.classList.add('cl-item--drop-above');
    } else {
      item.classList.add('cl-item--drop-below');
    }
  }

  function handleDragLeave(e) {
    var item = e.currentTarget;
    item.classList.remove('cl-item--drop-above', 'cl-item--drop-below');
  }

  function handleDrop(idx, e) {
    e.preventDefault();
    clearDropIndicators();

    if (dragState === null || dragState === idx) {
      dragState = null;
      return;
    }

    var rect = e.currentTarget.getBoundingClientRect();
    var midY = rect.top + rect.height / 2;
    var targetIdx = e.clientY < midY ? idx : idx + 1;

    performReorder(dragState, targetIdx);
    dragState = null;
  }

  function handleDragEnd(e) {
    clearDropIndicators();
    var item = e.currentTarget;
    item.classList.remove('cl-item--dragging');
    dragState = null;
  }

  function clearDropIndicators() {
    if (!listEl) return;
    var items = listEl.querySelectorAll('.cl-item--drop-above, .cl-item--drop-below');
    items.forEach(function (item) {
      item.classList.remove('cl-item--drop-above', 'cl-item--drop-below');
    });
    var zones = listEl.querySelectorAll('.cl-drop-zone--active');
    zones.forEach(function (z) { z.classList.remove('cl-drop-zone--active'); });
  }

  // ---- Editor bridge ----

  function getEditorText() {
    var editor = document.getElementById('editor');
    if (!editor) return '';
    return editor.value || editor.textContent || '';
  }

  function setEditorText(text) {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
      window.ZenWriterEditor.setContent(text);
      return;
    }
    var editor = document.getElementById('editor');
    if (editor) {
      if ('value' in editor) {
        editor.value = text;
      } else {
        editor.textContent = text;
      }
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function formatCount(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  // ---- Bootstrap ----

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
