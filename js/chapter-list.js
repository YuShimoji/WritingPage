/**
 * chapter-list.js — SP-071 チャプターリスト UI
 *
 * Focus モードの左パネルにチャプターリストを表示する。
 *
 * chapterMode 専用: ZWChapterStore から独立章データを使用
 *
 * 依存: chapter-store.js (ZWChapterStore)
 */
(function () {
  'use strict';

  var Store = null; // ZWChapterStore (lazy init)
  var panelEl = null;
  var listEl = null;
  var addBtn = null;
  var chapters = [];
  var activeChapterIdx = -1;
  var saveTimer = null;
  var contextMenu = null;
  var dragState = null;
  var previousMode = null; // モード切替検出用
  var chapterObserver = null; // IntersectionObserver for chapter visibility

  // ---- Helpers ----

  function clearChapterVisibility() {
    if (!listEl) return;
    var items = listEl.querySelectorAll('[data-focus-chapter-visible]');
    items.forEach(function (el) { el.removeAttribute('data-focus-chapter-visible'); });
  }

  function observeChapterItems() {
    if (!chapterObserver || !listEl) return;
    chapterObserver.disconnect();
    var items = listEl.querySelectorAll('.cl-item[data-ch-idx]');
    items.forEach(function (item) { chapterObserver.observe(item); });
  }

  function getCurrentDocId() {
    if (window.ZenWriterStorage && typeof window.ZenWriterStorage.getCurrentDocId === 'function') {
      return window.ZenWriterStorage.getCurrentDocId() || null;
    }
    return null;
  }

  function inChapterMode() {
    return true;
  }

  /**
   * Markdown ソースから DSL ブロック・見出し記号・装飾記法を除いてプレーンテキスト文字数を返す
   */
  function countPlainChars(markdown) {
    if (!markdown) return 0;
    return markdown
      .replace(/^:::zw-[^\n]*\n?/gm, '')    // DSL ヘッダー行
      .replace(/^:::\s*$/gm, '')              // DSL 閉じ行
      .replace(/^#{1,6}\s+/gm, '')            // 見出し記号
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // リンク (テキスト部分のみ残す)
      .replace(/\{([^|]+)\|[^}]+\}/g, '$1')    // ルビ記法 (本文のみ残す)
      .replace(/\{kenten\|([^}]+)\}/g, '$1')   // 傍点記法
      .trim()
      .length;
  }

  // ---- Init ----

  function init() {
    Store = window.ZWChapterStore;
    if (!Store) {
      console.warn('chapter-list: ZWChapterStore not found');
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

    // パネルリサイズハンドル
    setupPanelResize();

    // エディタ入力時にリフレッシュ / 自動保存
    var editorInputHandler = function () {
      if (document.documentElement.getAttribute('data-ui-mode') !== 'focus') return;
      scheduleSaveActiveChapter();
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

    // IntersectionObserver: Focus モードで章アイテムの可視性を追跡
    if (typeof IntersectionObserver !== 'undefined' && listEl) {
      chapterObserver = new IntersectionObserver(function (entries) {
        if (document.documentElement.getAttribute('data-ui-mode') !== 'focus') return;
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-focus-chapter-visible', '');
          } else {
            entry.target.removeAttribute('data-focus-chapter-visible');
          }
        });
      }, { root: listEl, threshold: 0 });
    }

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
      isChapterMode: inChapterMode,
      flushActive: flushActiveChapter,
      addChapter: handleAddChapter
    };
  }

  // ---- Mode Transition (Slice 3) ----

  function handleModeTransition(fromMode, toMode) {
    var G = window.ZWContentGuard;

    if (toMode === 'focus') {
      if (G) G.ensureSaved({ snapshot: false });
      refreshChapterMode();
      if (chapters.length > 0 && activeChapterIdx < 0) {
        navigateToChapter(0);
      }
    } else if (fromMode === 'focus') {
      closeContextMenu();
      clearChapterVisibility();
      if (G) G.flushChapterIfNeeded();
      else flushActiveChapter();
      var docId = getCurrentDocId();
      var chaps = docId && Store ? (Store.getChaptersForDoc(docId) || []) : [];
      if (docId && chaps.length > 0) {
        var fullText = Store.assembleFullText(docId);
        setEditorText(fullText);
      }
    } else {
      if (toMode !== 'focus') {
        closeContextMenu();
      }
    }
  }

  // ---- Refresh ----

  function refresh() {
    if (!Store || !listEl) return;
    if (document.documentElement.getAttribute('data-ui-mode') !== 'focus') return;
    refreshChapterMode();
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

    // ContentGuard 経由で安全にコンテンツを取得 (WYSIWYG/textarea 両対応)
    var G = window.ZWContentGuard;
    var text = G ? G.getEditorContent() : getEditorText();
    Store.updateChapterContent(ch.id, text);
    // 内部キャッシュも更新
    ch.content = text;
  }

  // ---- Render ----

  function render() {
    listEl.innerHTML = '';

    if (chapters.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'cl-empty';
      empty.textContent = '章がありません';
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

      // 文字数 (プレーンテキストベース)
      var chBody = ch.content || '';
      var bodyLen = countPlainChars(chBody);
      if (bodyLen > 0) {
        var countSpan = document.createElement('span');
        countSpan.className = 'cl-item__count';
        countSpan.textContent = formatCount(bodyLen);
        item.appendChild(countSpan);
      }

      // visibility バッジ
      if (ch.visibility && ch.visibility !== 'visible') {
        var badge = document.createElement('span');
        badge.className = 'cl-item__badge cl-item__badge--' + ch.visibility;
        badge.textContent = ch.visibility === 'draft' ? '下書き' : '非公開';
        item.appendChild(badge);
        item.classList.add('cl-item--' + ch.visibility);
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

    // フッター統計 + 目次コピーボタン
    renderFooterStats();

    // IntersectionObserver: 章アイテムの可視性を追跡
    observeChapterItems();
  }

  function renderFooterStats() {
    var footer = panelEl && panelEl.querySelector('.focus-chapter-panel__footer');
    if (!footer) return;

    // 既存の統計要素を除去
    var existing = footer.querySelector('.cl-footer-stats');
    if (existing) existing.remove();

    if (chapters.length === 0) return;

    var totalChars = 0;
    chapters.forEach(function (ch) {
      totalChars += countPlainChars(ch.content || '');
    });

    var stats = document.createElement('div');
    stats.className = 'cl-footer-stats';

    var countText = document.createElement('span');
    countText.className = 'cl-footer-stats__count';
    countText.textContent = formatCount(totalChars) + ' / ' + chapters.length + '\u7ae0';
    stats.appendChild(countText);

    var tocCopyBtn = document.createElement('button');
    tocCopyBtn.type = 'button';
    tocCopyBtn.className = 'cl-footer-stats__toc-btn';
    tocCopyBtn.textContent = '\u76ee\u6b21\u30b3\u30d4\u30fc';
    tocCopyBtn.title = '\u76ee\u6b21\u3092\u30af\u30ea\u30c3\u30d7\u30dc\u30fc\u30c9\u306b\u30b3\u30d4\u30fc';
    tocCopyBtn.addEventListener('click', function () {
      if (window.ZWChapterNav && typeof window.ZWChapterNav.generateTocText === 'function') {
        var text = window.ZWChapterNav.generateTocText();
        if (text && navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function () {
            tocCopyBtn.textContent = '\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f';
            setTimeout(function () { tocCopyBtn.textContent = '\u76ee\u6b21\u30b3\u30d4\u30fc'; }, 1500);
          });
        }
      }
    });
    stats.appendChild(tocCopyBtn);

    // addBtn の前に挿入
    footer.insertBefore(stats, footer.firstChild);
  }

  // ---- Click handlers ----

  function handleClick(idx, e) {
    if (e.detail > 1) return; // dblclick は別処理
    navigateToChapter(idx);
  }

  function navigateToChapter(idx) {
    if (idx < 0 || idx >= chapters.length) return;
    var ch = chapters[idx];

    // chapterMode: アクティブ章を保存してから切替
    flushActiveChapter();
    activeChapterIdx = idx;
    setEditorText(ch.content || '');
    // undo スタック + dirty baseline をリセット（別章の履歴を持ち込まない）
    var E = window.ZenWriterEditor;
    if (E && E.richTextEditor && typeof E.richTextEditor.resetUndoStack === 'function') {
      E.richTextEditor.resetUndoStack();
    }
    if (E && typeof E.refreshDirtyBaseline === 'function') {
      E.refreshDirtyBaseline();
    }
    highlightActive();
    // WYSIWYG 対応: 適切なエディタにフォーカス
    focusEditor();
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
        Store.renameChapter(ch.id, newTitle);
        refreshChapterMode();
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

    contextMenu = document.createElement('div');
    contextMenu.className = 'cl-context-menu';
    contextMenu.setAttribute('role', 'menu');

    var currentVis = chapters[idx] ? (chapters[idx].visibility || 'visible') : 'visible';
    var actions = [
      { label: 'リネーム', action: function () { startInlineRename(idx); } },
      { label: '複製', action: function () { performDuplicate(idx); } },
      { label: '上へ移動', action: function () { performMove(idx, 'up'); }, disabled: idx === 0 },
      { label: '下へ移動', action: function () { performMove(idx, 'down'); }, disabled: idx === chapters.length - 1 },
      { label: '---' },
      { label: '表示', action: function () { setVisibility(idx, 'visible'); }, disabled: currentVis === 'visible' },
      { label: '下書き', action: function () { setVisibility(idx, 'draft'); }, disabled: currentVis === 'draft' },
      { label: '非公開', action: function () { setVisibility(idx, 'hidden'); }, disabled: currentVis === 'hidden' },
      { label: '---' },
      { label: '削除', action: function () { performDelete(idx); }, dangerous: true }
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
    var G = window.ZWContentGuard;
    if (G) {
      G.flushChapterIfNeeded();
      G.ensureSaved({ snapshot: false });
    } else {
      flushActiveChapter();
    }

    var docId = getCurrentDocId();
    if (!docId) return;
    var lastChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;
    var afterId = lastChapter ? lastChapter.id : null;
    var level = lastChapter ? lastChapter.level : 2;

    Store.createChapter(docId, '新しい章', '', afterId, level);
    refreshChapterMode();

    setTimeout(function () {
      var newIdx = chapters.length - 1;
      if (newIdx >= 0) {
        navigateToChapter(newIdx);
        startInlineRename(newIdx);
      }
    }, 50);
  }

  /** 共通: 章操作の前にアクティブ章を保存 */
  function guardBeforeChapterOp() {
    var G = window.ZWContentGuard;
    if (G) {
      G.flushChapterIfNeeded();
    } else {
      flushActiveChapter();
    }
  }

  function performDuplicate(idx) {
    var ch = chapters[idx];
    guardBeforeChapterOp();
    var docId = getCurrentDocId();
    if (!docId) return;
    Store.createChapter(docId, ch.title + ' (コピー)', ch.content || '', ch.id, ch.level);
    refreshChapterMode();
  }

  function performMove(idx, direction) {
    guardBeforeChapterOp();
    var docId = getCurrentDocId();
    if (!docId) return;
    var swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= chapters.length) return;

    var ids = [];
    for (var i = 0; i < chapters.length; i++) ids.push(chapters[i].id);
    var tmp = ids[idx];
    ids[idx] = ids[swapIdx];
    ids[swapIdx] = tmp;
    Store.reorderChapters(docId, ids);
    refreshChapterMode();
    var newIdx = direction === 'up' ? idx - 1 : idx + 1;
    navigateToChapter(newIdx);
  }

  function setVisibility(idx, value) {
    var ch = chapters[idx];
    if (!ch || !ch._storeRecord || !Store) return;
    Store.updateChapterMeta(ch.id, { visibility: value });
    ch.visibility = value;
    refreshChapterMode();
  }

  function performDelete(idx) {
    var ch = chapters[idx];
    guardBeforeChapterOp();
    if (!confirm('「' + ch.title + '」を削除しますか？')) return;
    Store.deleteChapter(ch.id);
    activeChapterIdx = -1;
    refreshChapterMode();
    if (chapters.length > 0) {
      navigateToChapter(Math.min(idx, chapters.length - 1));
    } else {
      setEditorText('');
    }
  }

  function performReorder(sourceIdx, targetIdx) {
    if (sourceIdx === targetIdx || sourceIdx === targetIdx - 1) return;

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

  // ---- Panel resize (SP-070) ----

  function setupPanelResize() {
    if (!panelEl) return;

    var handle = document.createElement('div');
    handle.className = 'focus-chapter-panel__resize-handle';
    panelEl.appendChild(handle);

    var isDragging = false;
    var startX = 0;
    var startWidth = 0;
    var MIN_WIDTH = 160;
    var MAX_WIDTH = 480;
    var DEFAULT_WIDTH = 240;

    // 保存された幅を復元
    try {
      var saved = localStorage.getItem('zenwriter-focus-panel-width');
      if (saved) {
        var w = parseInt(saved, 10);
        if (w >= MIN_WIDTH && w <= MAX_WIDTH) {
          document.documentElement.style.setProperty('--focus-panel-width', w + 'px');
        }
      }
    } catch (e) { void e; }

    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      startWidth = panelEl.getBoundingClientRect().width;
      handle.classList.add('focus-chapter-panel__resize-handle--active');
      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      var delta = e.clientX - startX;
      var newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
      document.documentElement.style.setProperty('--focus-panel-width', newWidth + 'px');
    });

    handle.addEventListener('pointerup', function (e) {
      if (!isDragging) return;
      isDragging = false;
      handle.classList.remove('focus-chapter-panel__resize-handle--active');
      try { handle.releasePointerCapture(e.pointerId); } catch (err) { void err; }
      // 保存
      var finalWidth = panelEl.getBoundingClientRect().width;
      try { localStorage.setItem('zenwriter-focus-panel-width', String(Math.round(finalWidth))); } catch (err2) { void err2; }
    });

    // ダブルクリックでデフォルト幅に復帰
    handle.addEventListener('dblclick', function () {
      document.documentElement.style.setProperty('--focus-panel-width', DEFAULT_WIDTH + 'px');
      try { localStorage.removeItem('zenwriter-focus-panel-width'); } catch (e) { void e; }
    });
  }

  function getEditorText() {
    // ContentGuard 経由で統一取得 (WYSIWYG/textarea 両対応)
    var G = window.ZWContentGuard;
    if (G) return G.getEditorContent();

    // フォールバック: ContentGuard 未ロード時
    var E = window.ZenWriterEditor;
    if (E && typeof E.getEditorValue === 'function') {
      return E.getEditorValue() || '';
    }
    var editor = document.getElementById('editor');
    if (!editor) return '';
    return editor.value || '';
  }

  function setEditorText(text) {
    // ContentGuard 経由で統一書込 (バックアップなし: 章操作は意図的な上書き)
    var G = window.ZWContentGuard;
    if (G) {
      G.safeSetContent(text, { backup: false });
      return;
    }

    // フォールバック
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
