/**
 * chapter-list.js — SP-071 チャプターリスト UI
 *
 * Focus モードの左パネルにチャプターリストを表示する。
 *
 * Phase 1: 見出しベースのドキュメントから章を自動検出
 * Phase 2: chapterMode 時は ZWChapterStore から独立章データを使用
 *
 * 依存: chapter-model.js (ZWChapterModel), chapter-store.js (ZWChapterStore)
 */
(function () {
  'use strict';

  var Model = null; // ZWChapterModel (lazy init)
  var Store = null; // ZWChapterStore (lazy init)
  var panelEl = null;
  var listEl = null;
  var addBtn = null;
  var chapters = [];
  var activeChapterIdx = -1;
  var refreshTimer = null;
  var saveTimer = null;
  var contextMenu = null;
  var dragState = null;
  var previousMode = null; // モード切替検出用

  // ---- Helpers ----

  function getCurrentDocId() {
    if (window.ZenWriterStorage && typeof window.ZenWriterStorage.getCurrentDocId === 'function') {
      return window.ZenWriterStorage.getCurrentDocId() || null;
    }
    return null;
  }

  function inChapterMode() {
    var docId = getCurrentDocId();
    return !!(docId && Store && Store.isChapterMode(docId));
  }

  // ---- Init ----

  function init() {
    Model = window.ZWChapterModel;
    Store = window.ZWChapterStore;
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

    // エディタ入力時にリフレッシュ / 自動保存
    var editorInputHandler = function () {
      if (document.documentElement.getAttribute('data-ui-mode') !== 'focus') return;
      if (inChapterMode()) {
        scheduleSaveActiveChapter();
      } else {
        scheduleRefresh();
      }
    };
    var editorEl = document.getElementById('editor');
    if (editorEl) {
      editorEl.addEventListener('input', editorInputHandler);
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
    // WYSIWYG エディタにも同じリスナーを追加
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (wysiwygEl) {
      wysiwygEl.addEventListener('input', editorInputHandler);
      wysiwygEl.addEventListener('click', updateActive);
    }

    // モード切替時のハンドリング
    previousMode = document.documentElement.getAttribute('data-ui-mode') || 'normal';
    var modeObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'data-ui-mode') {
          var newMode = document.documentElement.getAttribute('data-ui-mode') || 'normal';
          handleModeTransition(previousMode, newMode);
          previousMode = newMode;
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
      navigateTo: navigateToChapter,
      isChapterMode: inChapterMode
    };
  }

  // ---- Mode Transition (Slice 3) ----

  function handleModeTransition(fromMode, toMode) {
    if (toMode === 'focus') {
      if (inChapterMode()) {
        // Normal → Focus (chapterMode): 全文を章に分解
        var docId = getCurrentDocId();
        if (docId && fromMode !== 'focus') {
          var text = getEditorText();
          Store.splitIntoChapters(docId, text);
        }
        refreshChapterMode();
        // 最初の章を選択
        if (chapters.length > 0 && activeChapterIdx < 0) {
          navigateToChapter(0);
        }
      } else {
        refresh();
      }
    } else if (fromMode === 'focus') {
      closeContextMenu();
      if (inChapterMode()) {
        // Focus → Normal (chapterMode): アクティブ章を保存 → 全文を組み立て
        flushActiveChapter();
        var docId2 = getCurrentDocId();
        if (docId2) {
          var fullText = Store.assembleFullText(docId2);
          setEditorText(fullText);
        }
      }
    } else {
      if (toMode !== 'focus') {
        closeContextMenu();
      }
    }
  }

  // ---- Refresh ----

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 300);
  }

  function refresh() {
    if (!Model || !listEl) return;
    if (document.documentElement.getAttribute('data-ui-mode') !== 'focus') return;

    if (inChapterMode()) {
      refreshChapterMode();
    } else {
      refreshLegacyMode();
    }
  }

  /**
   * Phase 1 互換: 見出しベースのリフレッシュ
   */
  function refreshLegacyMode() {
    var text = getEditorText();
    chapters = Model.parseChapters(text);
    render();
    updateActive();
  }

  /**
   * Phase 2: chapterMode のリフレッシュ
   */
  function refreshChapterMode() {
    var docId = getCurrentDocId();
    if (!docId || !Store) return;

    var storeChapters = Store.getChaptersForDoc(docId);
    // chapter-list 内部で使う chapters 配列を構築
    // Phase 1 の Chapter 形式に合わせる (title, level, id 等)
    chapters = [];
    for (var i = 0; i < storeChapters.length; i++) {
      var sc = storeChapters[i];
      chapters.push({
        id: sc.id,
        title: sc.name || '',
        level: sc.level || 2,
        order: sc.order || i,
        content: sc.content || '',
        visibility: sc.visibility || 'visible',
        _storeRecord: true // chapterMode 判定用フラグ
      });
    }
    render();
    // アクティブ章のハイライトを維持
    highlightActive();
  }

  function updateActive() {
    if (!listEl || chapters.length === 0) return;

    if (inChapterMode()) {
      // chapterMode: activeChapterIdx は navigateToChapter で設定済み
      highlightActive();
      return;
    }

    // Phase 1: カーソル位置から判定
    // WYSIWYG モード中は textarea.selectionStart が信頼できないためスキップ
    var E = window.ZenWriterEditor;
    if (E && E.richTextEditor && E.richTextEditor.isWysiwygMode) {
      highlightActive();
      return;
    }
    var editorEl = document.getElementById('editor');
    if (!editorEl) return;
    var cursorPos = editorEl.selectionStart || 0;
    activeChapterIdx = Model.getActiveChapterIndex(chapters, cursorPos);
    highlightActive();
  }

  function highlightActive() {
    var items = listEl.querySelectorAll('.cl-item[data-ch-idx]');
    items.forEach(function (item) {
      var idx = parseInt(item.getAttribute('data-ch-idx'), 10);
      var isActive = idx === activeChapterIdx;
      item.classList.toggle('cl-item--active', isActive);
      item.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  // ---- Active chapter save (chapterMode) ----

  function scheduleSaveActiveChapter() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushActiveChapter, 500);
  }

  function flushActiveChapter() {
    if (!inChapterMode()) return;
    if (activeChapterIdx < 0 || activeChapterIdx >= chapters.length) return;

    var ch = chapters[activeChapterIdx];
    if (!ch || !ch._storeRecord) return;

    var text = getEditorText();
    Store.updateChapterContent(ch.id, text);
    // 内部キャッシュも更新
    ch.content = text;
  }

  // ---- Render ----

  function render() {
    listEl.innerHTML = '';

    var isChMode = inChapterMode();

    if (chapters.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'cl-empty';
      empty.textContent = isChMode ? '章がありません' : '見出しがありません';
      listEl.appendChild(empty);

      // chapterMode でなければ移行ボタンを表示 (Slice 4)
      if (!isChMode) {
        renderMigrateButton();
      }
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

      // 文字数
      if (isChMode) {
        var bodyLen = (ch.content || '').trim().length;
        if (bodyLen > 0) {
          var countSpan = document.createElement('span');
          countSpan.className = 'cl-item__count';
          countSpan.textContent = formatCount(bodyLen);
          item.appendChild(countSpan);
        }
      } else {
        var text = getEditorText();
        var bodyLen2 = Model.getChapterBody(text, ch).trim().length;
        if (bodyLen2 > 0) {
          var countSpan2 = document.createElement('span');
          countSpan2.className = 'cl-item__count';
          countSpan2.textContent = formatCount(bodyLen2);
          item.appendChild(countSpan2);
        }
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

    // chapterMode でなければ移行ボタンを表示 (Slice 4)
    if (!isChMode && chapters.length > 0) {
      renderMigrateButton();
    }
  }

  // ---- Migration button (Slice 4) ----

  function renderMigrateButton() {
    if (!Store) return;
    var docId = getCurrentDocId();
    if (!docId) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'cl-migrate-wrapper';
    wrapper.style.padding = '8px';
    wrapper.style.marginTop = '8px';
    wrapper.style.borderTop = '1px solid var(--border-color, #333)';

    var btn = document.createElement('button');
    btn.className = 'small cl-migrate-btn';
    btn.textContent = '章モードに変換';
    btn.title = '見出しベースの章を独立保存に変換します';
    btn.addEventListener('click', function () {
      if (!confirm('章を独立した保存単位に変換しますか？\n（元のテキストはバックアップとして保持されます）')) return;
      var ok = Store.migrateToChapterMode(docId);
      if (ok) {
        refreshChapterMode();
        if (chapters.length > 0) {
          navigateToChapter(0);
        }
      } else {
        alert('変換に失敗しました');
      }
    });

    wrapper.appendChild(btn);
    listEl.appendChild(wrapper);
  }

  // ---- Click handlers ----

  function handleClick(idx, e) {
    if (e.detail > 1) return; // dblclick は別処理
    navigateToChapter(idx);
  }

  function navigateToChapter(idx) {
    if (idx < 0 || idx >= chapters.length) return;
    var ch = chapters[idx];

    if (inChapterMode() && ch._storeRecord) {
      // chapterMode: アクティブ章を保存してから切替
      flushActiveChapter();
      activeChapterIdx = idx;
      setEditorText(ch.content || '');
      highlightActive();
      // WYSIWYG 対応: 適切なエディタにフォーカス
      focusEditor();
      return;
    }

    // Phase 1: 見出し位置にスクロール + カーソル設定
    var E = window.ZenWriterEditor;
    if (E && E.richTextEditor && E.richTextEditor.isWysiwygMode) {
      // WYSIWYG: 見出し要素に直接スクロール
      var wysiwygEl = document.getElementById('wysiwyg-editor');
      if (wysiwygEl) {
        var headings = wysiwygEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings[idx]) {
          headings[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
    // textarea カーソルも設定 (内部整合性・テスト互換)
    var editor2 = document.getElementById('editor');
    if (editor2 && typeof editor2.setSelectionRange === 'function') {
      editor2.setSelectionRange(ch.startOffset, ch.startOffset);
    }
    activeChapterIdx = idx;
    highlightActive();
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
        if (inChapterMode() && ch._storeRecord) {
          Store.renameChapter(ch.id, newTitle);
          refreshChapterMode();
        } else {
          var text = getEditorText();
          var updated = Model.renameChapter(text, ch, newTitle);
          setEditorText(updated);
          refresh();
        }
      } else {
        refresh();
      }
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        refresh();
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

    var isChMode = inChapterMode();

    contextMenu = document.createElement('div');
    contextMenu.className = 'cl-context-menu';
    contextMenu.setAttribute('role', 'menu');

    var actions;
    if (isChMode) {
      actions = [
        { label: 'リネーム', action: function () { startInlineRename(idx); } },
        { label: '複製', action: function () { performDuplicate(idx); } },
        { label: '上へ移動', action: function () { performMove(idx, 'up'); }, disabled: idx === 0 },
        { label: '下へ移動', action: function () { performMove(idx, 'down'); }, disabled: idx === chapters.length - 1 },
        { label: '---' },
        { label: '削除', action: function () { performDelete(idx, true); }, dangerous: true }
      ];
    } else {
      actions = [
        { label: 'リネーム', action: function () { startInlineRename(idx); } },
        { label: '複製', action: function () { performDuplicate(idx); } },
        { label: '上へ移動', action: function () { performMove(idx, 'up'); }, disabled: idx === 0 },
        { label: '下へ移動', action: function () { performMove(idx, 'down'); }, disabled: idx === chapters.length - 1 },
        { label: '---' },
        { label: '削除（見出しのみ）', action: function () { performDelete(idx, false); } },
        { label: '削除（本文含む）', action: function () { performDelete(idx, true); }, dangerous: true }
      ];
    }

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
    if (inChapterMode()) {
      var docId = getCurrentDocId();
      if (!docId) return;
      var lastChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;
      var afterId = lastChapter ? lastChapter.id : null;
      var level = lastChapter ? lastChapter.level : 2;

      Store.createChapter(docId, '新しい章', '', afterId, level);
      refreshChapterMode();

      // 新しい章にナビゲート & インラインリネーム開始
      setTimeout(function () {
        var newIdx = chapters.length - 1;
        navigateToChapter(newIdx);
        startInlineRename(newIdx);
      }, 50);
      return;
    }

    // Phase 1: テキスト操作
    var lastChapter2 = chapters.length > 0 ? chapters[chapters.length - 1] : null;
    var afterId2 = lastChapter2 ? lastChapter2.id : null;
    var level2 = lastChapter2 ? lastChapter2.level : 2;

    var text = getEditorText();
    var result = Model.addChapter(text, chapters, afterId2, '新しい章', level2);
    setEditorText(result.text);
    refresh();

    setTimeout(function () {
      var newIdx = chapters.length - 1;
      navigateToChapter(newIdx);
      startInlineRename(newIdx);
    }, 50);
  }

  function performDuplicate(idx) {
    var ch = chapters[idx];

    if (inChapterMode() && ch._storeRecord) {
      var docId = getCurrentDocId();
      if (!docId) return;
      Store.createChapter(docId, ch.title + ' (コピー)', ch.content || '', ch.id, ch.level);
      refreshChapterMode();
      return;
    }

    var text = getEditorText();
    var updated = Model.duplicateChapter(text, ch);
    setEditorText(updated);
    refresh();
  }

  function performMove(idx, direction) {
    var ch = chapters[idx];

    if (inChapterMode() && ch._storeRecord) {
      var docId = getCurrentDocId();
      if (!docId) return;
      var swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= chapters.length) return;

      // order を入れ替え
      var ids = [];
      for (var i = 0; i < chapters.length; i++) ids.push(chapters[i].id);
      // swap
      var tmp = ids[idx];
      ids[idx] = ids[swapIdx];
      ids[swapIdx] = tmp;
      Store.reorderChapters(docId, ids);
      refreshChapterMode();
      var newIdx = direction === 'up' ? idx - 1 : idx + 1;
      navigateToChapter(newIdx);
      return;
    }

    var text = getEditorText();
    var updated = Model.moveChapter(text, chapters, ch.id, direction);
    if (updated !== null) {
      setEditorText(updated);
      refresh();
      var newIdx2 = direction === 'up' ? idx - 1 : idx + 1;
      navigateToChapter(newIdx2);
    }
  }

  function performDelete(idx, deleteContent) {
    var ch = chapters[idx];

    if (inChapterMode() && ch._storeRecord) {
      if (!confirm('「' + ch.title + '」を削除しますか？')) return;
      Store.deleteChapter(ch.id);
      activeChapterIdx = -1;
      refreshChapterMode();
      if (chapters.length > 0) {
        navigateToChapter(Math.min(idx, chapters.length - 1));
      } else {
        setEditorText('');
      }
      return;
    }

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

    if (inChapterMode()) {
      var docId = getCurrentDocId();
      if (!docId) return;

      var ids = [];
      for (var i = 0; i < chapters.length; i++) ids.push(chapters[i].id);

      // sourceIdx を targetIdx の位置に移動
      var moved = ids.splice(sourceIdx, 1)[0];
      var insertAt = sourceIdx < targetIdx ? targetIdx - 1 : targetIdx;
      ids.splice(insertAt, 0, moved);

      Store.reorderChapters(docId, ids);
      refreshChapterMode();
      return;
    }

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

    var item = e.currentTarget;
    var rect = item.getBoundingClientRect();
    var midY = rect.top + rect.height / 2;
    var isAbove = e.clientY < midY;

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

  function focusEditor() {
    var E = window.ZenWriterEditor;
    if (E && E.richTextEditor && E.richTextEditor.isWysiwygMode) {
      var wysiwygEl = document.getElementById('wysiwyg-editor');
      if (wysiwygEl) { wysiwygEl.focus(); return; }
    }
    var editor = document.getElementById('editor');
    if (editor) editor.focus();
  }

  function getEditorText() {
    // chapterMode: WYSIWYG から正規 Markdown を取得 (offset 不要)
    if (inChapterMode()) {
      var E = window.ZenWriterEditor;
      if (E && typeof E.getEditorValue === 'function') {
        return E.getEditorValue() || '';
      }
    }
    // Phase 1 (legacy): textarea.value を返す (offset 整合性のため)
    var editor = document.getElementById('editor');
    if (!editor) return '';
    return editor.value || '';
  }

  function setEditorText(text) {
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
      window.ZenWriterEditor.setContent(text);
      return;
    }
    var editor = document.getElementById('editor');
    if (editor) {
      editor.value = text || '';
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
