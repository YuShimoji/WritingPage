/**
 * gadgets-sections-nav.js
 * SP-052: セクションナビゲーターガジェット
 * Phase 1: 見出しツリー表示、クリックジャンプ、アクティブ追従、下部ナビ連携
 * Phase 2: WYSIWYG軽量セクションコラプス (先頭2段落 + 省略マーカー)
 */
(function () {
  'use strict';

  var ZWGadgets = window.ZWGadgets;
  if (!ZWGadgets) return;

  var HEADING_RE = /^(#{1,6})(?:[ \t]+(.*))?$/gm;
  var DEBOUNCE_MS = 120;
  var COLLAPSE_PREVIEW_COUNT = 2; // 折りたたみ時に表示する段落数
  var UNTITLED_CHAPTER_LABEL = '章タイトル未設定';
  var CHAPTER_TITLE_PLACEHOLDER = '章タイトルを入力';

  // --- Collapse state ---
  var collapseActive = false;
  var lastCollapseIndex = -1;

  // =========================================================
  //  Phase 1: Markdown (textarea) 用ヘッダー解析
  // =========================================================

  function parseHeadings(text) {
    var headings = [];
    var match;
    HEADING_RE.lastIndex = 0;
    while ((match = HEADING_RE.exec(text)) !== null) {
      headings.push({
        level: match[1].length,
        title: (match[2] || '').trim(),
        offset: match.index,
        titleOffset: match.index + match[1].length + (match[0].charAt(match[1].length) === ' ' ? 1 : 0)
      });
    }
    for (var i = 0; i < headings.length; i++) {
      headings[i].endOffset = (i + 1 < headings.length)
        ? headings[i + 1].offset
        : text.length;
    }
    return headings;
  }

  function findActiveIndex(headings, cursorPos) {
    var active = -1;
    for (var i = 0; i < headings.length; i++) {
      // chapterMode の virtual heading は offset:-1 のためカーソル判定から除外（誤ハイライト防止）
      if (headings[i]._virtual) continue;
      if (cursorPos >= headings[i].offset) active = i;
      else break;
    }
    return active;
  }

  // =========================================================
  //  Phase 2: WYSIWYG DOM 用ヘッダー/セクション解析
  // =========================================================

  var HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

  function syncEmptyHeadingPlaceholder(headingEl) {
    if (!headingEl || !/^H[1-6]$/.test(headingEl.tagName || '')) return;
    var isEmpty = !(headingEl.textContent || '').trim();
    if (isEmpty) {
      headingEl.setAttribute('data-zw-empty-heading', 'true');
      headingEl.setAttribute('data-placeholder', CHAPTER_TITLE_PLACEHOLDER);
    } else {
      headingEl.removeAttribute('data-zw-empty-heading');
      headingEl.removeAttribute('data-placeholder');
    }
  }

  function syncAllEmptyHeadingPlaceholders() {
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (!wysiwygEl) return;
    var els = wysiwygEl.querySelectorAll(HEADING_SELECTOR);
    for (var i = 0; i < els.length; i++) {
      syncEmptyHeadingPlaceholder(els[i]);
    }
  }

  /** WYSIWYG DOM から見出し一覧を取得 (ツリー構築用) */
  function parseWysiwygHeadings() {
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (!wysiwygEl) return [];
    var headings = [];
    var els = wysiwygEl.querySelectorAll(HEADING_SELECTOR);
    for (var i = 0; i < els.length; i++) {
      syncEmptyHeadingPlaceholder(els[i]);
      headings.push({
        level: parseInt(els[i].tagName.charAt(1), 10),
        title: els[i].textContent.trim(),
        el: els[i],
        offset: 0 // textarea 互換用 (WYSIWYG では未使用)
      });
    }
    return headings;
  }

  /** WYSIWYG DOM からセクション境界を検出 (コラプス用) */
  function parseWysiwygSections() {
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (!wysiwygEl) return [];
    var sections = [];
    var currentSection = null;
    var children = wysiwygEl.childNodes;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.nodeType !== 1) continue; // Element nodes only
      var tagName = child.tagName;
      if (/^H[1-6]$/.test(tagName)) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          headingEl: child,
          bodyEls: [],
          level: parseInt(tagName.charAt(1), 10),
          index: sections.length
        };
      } else if (currentSection) {
        // コラプスマーカーは除外
        if (!child.classList || !child.classList.contains('section-collapse-more')) {
          currentSection.bodyEls.push(child);
        }
      }
    }
    if (currentSection) sections.push(currentSection);
    return sections;
  }

  /** WYSIWYG で現在のカーソル位置からアクティブセクションを判定 */
  function findWysiwygActiveIndex(headings) {
    if (collapseActive) return lastCollapseIndex;
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return headings.length > 0 ? 0 : -1;
    var anchor = sel.anchorNode;
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (!wysiwygEl || !wysiwygEl.contains(anchor)) return headings.length > 0 ? 0 : -1;
    // 最後に見出しが前にある位置を探す
    for (var i = headings.length - 1; i >= 0; i--) {
      if (!headings[i].el) continue;
      var pos = headings[i].el.compareDocumentPosition(anchor);
      if ((pos & Node.DOCUMENT_POSITION_FOLLOWING) || headings[i].el.contains(anchor)) {
        return i;
      }
    }
    return 0;
  }

  // =========================================================
  //  Phase 2: コラプス適用/解除
  // =========================================================

  /** 非アクティブセクションを折りたたむ
   * session 91: ユーザー要望により折りたたみ機能を廃止。
   * ZWSectionCollapse API 互換のため関数は残置するが、常に no-op。
   * 呼び出し側 (jumpToHeading / jumpToIndex 等) もそのままで副作用なし。 */
  function applySectionCollapse(activeIndex) {
    return;
    /* eslint-disable no-unreachable */
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (!wysiwygEl) return;

    // 先にクリーンアップ
    clearSectionCollapse();

    var sections = parseWysiwygSections();
    if (sections.length === 0) return;
    if (activeIndex < 0 || activeIndex >= sections.length) return;

    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      if (i === activeIndex) {
        section.headingEl.setAttribute('data-section-active', 'true');
        continue;
      }

      // 非アクティブ: 先頭 N 段落を残し、残りを非表示
      var visibleCount = 0;
      var lastVisibleEl = null;
      var hasHidden = false;

      for (var j = 0; j < section.bodyEls.length; j++) {
        var el = section.bodyEls[j];
        if (visibleCount < COLLAPSE_PREVIEW_COUNT) {
          visibleCount++;
          lastVisibleEl = el;
        } else {
          el.setAttribute('data-collapsed', 'true');
          hasHidden = true;
        }
      }

      // 省略マーカーを挿入 (非表示コンテンツがある場合のみ)
      if (hasHidden) {
        var insertAfter = lastVisibleEl || section.headingEl;
        var marker = document.createElement('div');
        marker.className = 'section-collapse-more';
        marker.textContent = '\u2026'; // ...
        marker.setAttribute('data-collapse-section-index', String(i));
        marker.contentEditable = 'false';
        insertAfter.insertAdjacentElement('afterend', marker);
      }
    }

    wysiwygEl.setAttribute('data-section-collapse-active', 'true');
    collapseActive = true;
    lastCollapseIndex = activeIndex;
    /* eslint-enable no-unreachable */
  }

  /** コラプス状態をすべて解除 */
  function clearSectionCollapse() {
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (!wysiwygEl) return;
    // data-collapsed を除去
    var collapsed = wysiwygEl.querySelectorAll('[data-collapsed="true"]');
    for (var i = 0; i < collapsed.length; i++) {
      collapsed[i].removeAttribute('data-collapsed');
    }
    // コラプスマーカーを除去
    var markers = wysiwygEl.querySelectorAll('.section-collapse-more');
    for (var i = 0; i < markers.length; i++) {
      markers[i].remove();
    }
    // アクティブセクションマーカーを除去
    var actives = wysiwygEl.querySelectorAll('[data-section-active]');
    for (var i = 0; i < actives.length; i++) {
      actives[i].removeAttribute('data-section-active');
    }
    wysiwygEl.removeAttribute('data-section-collapse-active');
    collapseActive = false;
  }

  // グローバル公開 (syncToMarkdown フック用 + sidebar-manager 連携)
  window.ZWSectionCollapse = {
    clear: clearSectionCollapse,
    reapply: function () {
      if (lastCollapseIndex >= 0) {
        applySectionCollapse(lastCollapseIndex);
      }
    },
    isActive: function () { return collapseActive; },
    /** 指定インデックスのセクションへジャンプしコラプス適用 (-1 で末尾) */
    jumpToIndex: function (index) {
      var headings = parseWysiwygHeadings();
      if (headings.length === 0) return;
      var target = index < 0 ? headings.length - 1 : Math.min(index, headings.length - 1);
      jumpToHeading(headings[target], target);
      scheduleRender();
    }
  };

  // =========================================================
  //  ジャンプ (textarea / WYSIWYG 両対応)
  // =========================================================

  function isWysiwygMode() {
    var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
    return !!(rte && rte.isWysiwygMode);
  }

  function getCurrentChapterDocId() {
    var Store = window.ZWChapterStore;
    var S = window.ZenWriterStorage;
    var rawId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
    return rawId && Store && typeof Store.resolveParentDocumentId === 'function'
      ? Store.resolveParentDocumentId(rawId)
      : rawId;
  }

  function getChapterStoreChapters() {
    try {
      var Store = window.ZWChapterStore;
      var docId = getCurrentChapterDocId();
      if (!Store || !docId || typeof Store.isChapterMode !== 'function' || !Store.isChapterMode(docId)) return [];
      if (typeof Store.getChaptersForDoc !== 'function') return [];
      return Store.getChaptersForDoc(docId) || [];
    } catch (_) {
      return [];
    }
  }

  function isWysiwygVisible() {
    var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
    if (rte && rte.isWysiwygMode) return true;
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    return !!(wysiwygEl && window.getComputedStyle(wysiwygEl).display !== 'none');
  }

  function getEditorMarkdown() {
    var editorManager = window.ZenWriterEditor;
    if (editorManager && typeof editorManager.getEditorValue === 'function') {
      return editorManager.getEditorValue() || '';
    }
    var editor = document.getElementById('editor');
    return editor ? (editor.value || '') : '';
  }

  function appendChapterHeading(markdown) {
    var base = String(markdown || '').replace(/\s+$/g, '');
    return (base ? base + '\n\n' : '') + '## \n\n';
  }

  function getAppendedHeadingTitlePosition(markdown) {
    var markerIndex = String(markdown || '').lastIndexOf('## ');
    return markerIndex >= 0 ? markerIndex + 3 : String(markdown || '').length;
  }

  function appendEmptyHeadingToWysiwyg() {
    var editorManager = window.ZenWriterEditor;
    var rte = editorManager && editorManager.richTextEditor;
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (!wysiwygEl || !rte || !rte.isWysiwygMode) return false;

    if (wysiwygEl.childNodes.length > 0) {
      wysiwygEl.appendChild(document.createElement('p'));
    }
    var heading = document.createElement('h2');
    heading.appendChild(document.createElement('br'));
    syncEmptyHeadingPlaceholder(heading);
    wysiwygEl.appendChild(heading);
    syncAllEmptyHeadingPlaceholders();

    try {
      var range = document.createRange();
      var sel = window.getSelection();
      range.selectNodeContents(heading);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      wysiwygEl.focus();
    } catch (_) { /* noop */ }

    if (typeof rte.syncToMarkdown === 'function') {
      rte.syncToMarkdown();
    }
    if (editorManager && typeof editorManager.saveContent === 'function') {
      editorManager.saveContent();
    }
    wysiwygEl.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  function notifySectionAction(message) {
    if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
      window.ZenWriterHUD.show(message, 1400, { type: 'success' });
      return;
    }
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.showNotification === 'function') {
      window.ZenWriterEditor.showNotification(message, 1400);
    }
  }

  function focusLastHeading() {
    setTimeout(function () {
      var headings = isWysiwygMode() ? parseWysiwygHeadings() : parseHeadings(getEditorMarkdown());
      if (headings.length > 0) {
        jumpToHeading(headings[headings.length - 1], headings.length - 1);
      }
    }, 80);
  }

  function addChapterHeadingToEditor() {
    if (appendEmptyHeadingToWysiwyg()) {
      notifySectionAction('新しい章を追加しました');
      focusLastHeading();
      return;
    }

    var next = appendChapterHeading(getEditorMarkdown());
    var editorManager = window.ZenWriterEditor;
    if (editorManager && typeof editorManager.setContent === 'function') {
      editorManager.setContent(next);
      syncAllEmptyHeadingPlaceholders();
      if (typeof editorManager.saveContent === 'function') {
        editorManager.saveContent();
      }
    } else {
      var editor = document.getElementById('editor');
      if (editor) {
        var titlePos = getAppendedHeadingTitlePosition(next);
        editor.value = next;
        editor.selectionStart = titlePos;
        editor.selectionEnd = titlePos;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
        window.ZenWriterStorage.saveContent(next);
      }
    }

    var wysiwygEl = document.getElementById('wysiwyg-editor');
    var editorEl = document.getElementById('editor');
    if (wysiwygEl) wysiwygEl.dispatchEvent(new Event('input', { bubbles: true }));
    if (editorEl) editorEl.dispatchEvent(new Event('input', { bubbles: true }));
    if (!isWysiwygVisible() && editorEl) {
      var headingTitlePos = getAppendedHeadingTitlePosition(next);
      editorEl.focus();
      editorEl.selectionStart = headingTitlePos;
      editorEl.selectionEnd = headingTitlePos;
    }
    notifySectionAction('新しい章を追加しました');
    focusLastHeading();
  }

  function handleAddChapterFromSections() {
    var storeChapters = getChapterStoreChapters();
    var chapterList = window.ZWChapterList;
    if (storeChapters.length > 0 && chapterList && typeof chapterList.addChapter === 'function') {
      chapterList.addChapter();
      notifySectionAction('新しい章を追加しました');
      return;
    }
    addChapterHeadingToEditor();
  }

  function jumpToHeading(heading, headingIndex) {
    if (!heading) return;

    // session 109: virtual heading (chapterMode の ChapterStore 由来) は章ナビゲーションで移動
    if (heading._virtual && heading._chapterId) {
      try {
        var cl = window.ZWChapterList;
        var Store = window.ZWChapterStore;
        if (cl && Store && typeof cl.navigateTo === 'function') {
          var docId = getCurrentChapterDocId();
          var chapters = Store.getChaptersForDoc(docId) || [];
          var chapterIdx = chapters.findIndex(function (c) { return c && c.id === heading._chapterId; });
          if (chapterIdx >= 0) {
            cl.navigateTo(chapterIdx);
          }
        }
      } catch (_) { /* ignore */ }
      return; // virtual は navigate のみ。offset: -1 を editor に渡さない
    }

    if (isWysiwygMode()) {
      var wysiwygEl = document.getElementById('wysiwyg-editor');
      if (!wysiwygEl) return;

      // DOM 上の見出し要素を特定
      var targetEl = heading.el; // WYSIWYG heading には el がある
      if (!targetEl) {
        // フォールバック: textContent 一致で検索
        var els = wysiwygEl.querySelectorAll(HEADING_SELECTOR);
        for (var i = 0; i < els.length; i++) {
          if (els[i].textContent.trim() === heading.title) {
            targetEl = els[i];
            break;
          }
        }
      }
      if (!targetEl) return;

      // コラプス適用
      if (typeof headingIndex === 'number' && headingIndex >= 0) {
        applySectionCollapse(headingIndex);
      }

      // スクロールしてフォーカス
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try {
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents(targetEl);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (_) {}

      // textarea カーソルも同期 (E2E 互換 + 他コンポーネント連携用)
      var rte2 = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (rte2 && typeof rte2.syncToMarkdown === 'function') {
        rte2.syncToMarkdown();
      }
      var editorEl = document.getElementById('editor');
      if (editorEl && heading.title) {
        var mdText = editorEl.value || '';
        var escaped = heading.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var re = new RegExp('^#{1,6}\\s+' + escaped, 'm');
        var m = re.exec(mdText);
        if (m) {
          editorEl.selectionStart = m.index;
          editorEl.selectionEnd = m.index;
        }
      }

    } else {
      // textarea モード (既存動作)
      var editor = document.getElementById('editor');
      if (!editor) return;
      var cursorOffset = heading.title ? heading.offset : (heading.titleOffset || heading.offset);
      editor.selectionStart = cursorOffset;
      editor.selectionEnd = cursorOffset;
      editor.focus();
      var linesBefore = editor.value.substring(0, cursorOffset).split('\n').length;
      var lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20;
      var scrollTarget = (linesBefore - 3) * lineHeight;
      editor.scrollTop = Math.max(0, scrollTarget);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // =========================================================
  //  ガジェット本体
  // =========================================================

  ZWGadgets.register('SectionsNavigator', function (el, api) {
    var wrap = document.createElement('div');
    wrap.className = 'sections-nav-gadget';

    var actions = document.createElement('div');
    actions.className = 'sections-nav-actions';

    var addChapterBtn = document.createElement('button');
    addChapterBtn.type = 'button';
    addChapterBtn.id = 'sections-add-chapter';
    addChapterBtn.className = 'sections-add-chapter zw-shell-control zw-shell-control--text';
    addChapterBtn.textContent = '+ 新しい章';
    addChapterBtn.title = '現在の原稿に新しい章を追加';
    addChapterBtn.setAttribute('aria-label', '新しい章を追加');
    addChapterBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      handleAddChapterFromSections();
    });
    actions.appendChild(addChapterBtn);

    var treeContainer = document.createElement('div');
    treeContainer.className = 'sections-tree';
    treeContainer.setAttribute('role', 'tree');
    treeContainer.setAttribute('aria-label', '\u898b\u51fa\u3057\u30c4\u30ea\u30fc');

    var emptyState = document.createElement('div');
    emptyState.className = 'sections-empty-state';
    emptyState.hidden = true;
    emptyState.innerHTML = [
      '<p class="sections-empty-state__title">表示できるセクションがまだありません</p>',
      '<p class="sections-empty-state__meta" data-sections-empty-meta></p>',
      '<p class="sections-empty-state__hint" data-sections-empty-hint></p>'
    ].join('');

    wrap.appendChild(actions);
    wrap.appendChild(treeContainer);
    wrap.appendChild(emptyState);
    el.appendChild(wrap);

    var currentHeadings = [];
    var currentActiveIndex = -1;
    var debounceTimer = null;

    // session 109: chapterMode のとき、ChapterStore の章タイトルも「見出し」として統合表示。
    // WYSIWYG / textarea いずれでも同じ virtual heading ルールを適用 (編集面非依存)。
    function mergeVirtualChapterHeadings(list) {
      try {
        var Store = window.ZWChapterStore;
        var docId = getCurrentChapterDocId();
        if (!docId || !Store || typeof Store.isChapterMode !== 'function' || !Store.isChapterMode(docId)) return list;
        var storeChapters = Store.getChaptersForDoc(docId) || [];
        // 実見出しと章を「先頭から同タイトルで 1 対 1」で突き合わせる。同名章が複数あっても欠落しない。
        // タイトルのみでの重複判定は、2 件目以降の章が sections に出ない bug になるため禁止。
        var consumed = [];
        for (var ci = 0; ci < list.length; ci++) consumed[ci] = false;

        storeChapters.forEach(function (ch) {
          var name = ch && ch.name != null ? String(ch.name) : ((ch && ch.title) || '');
          var matchedIdx = -1;
          for (var hi = 0; hi < list.length; hi++) {
            if (consumed[hi]) continue;
            var h = list[hi];
            if (!h._virtual && h.title === name) {
              matchedIdx = hi;
              break;
            }
          }
          if (matchedIdx >= 0) {
            consumed[matchedIdx] = true;
            return;
          }
          list.push({
            level: ch.level || 2,
            title: name,
            offset: -1, // virtual (editor テキスト上の位置なし)
            endOffset: -1,
            _virtual: true,
            _chapterId: ch.id // クリック時 navigate のアンカー（章 id で一意）
          });
        });
      } catch (_) { /* ignore */ }
      return list;
    }

    function getEmptyStateInfo() {
      var Store = window.ZWChapterStore;
      var docId = getCurrentChapterDocId();
      var chapterMode = !!(docId && Store && typeof Store.isChapterMode === 'function' && Store.isChapterMode(docId));
      var chapters = chapterMode && typeof Store.getChaptersForDoc === 'function'
        ? (Store.getChaptersForDoc(docId) || [])
        : [];
      var editor = document.getElementById('editor');
      var content = editor ? (editor.value || '') : '';
      var surface = isWysiwygMode() ? 'リッチ編集' : 'Markdown ソース';
      var meta = '現在: ' + surface + ' / 本文 ' + content.trim().length + ' 文字';
      var hint = '本文に # 見出し を追加すると、ここに一覧が出ます。';

      if (chapterMode) {
        meta += ' / 章モード / 章 ' + chapters.length + ' 件';
        if (chapters.length === 0) {
          hint = '章モードです。章を追加するか、本文に # 見出し を入れるとここに表示されます。';
        } else {
          hint = '章はありますが、表示対象の見出しがまだありません。';
        }
      } else if (!content.trim()) {
        hint = '本文がまだ空です。まず見出し付きで書き始めると、ここに現在位置が出ます。';
      }

      return { meta: meta, hint: hint };
    }

    function render() {
      // BP-5: アコーディオントグル中の再 render をスキップ (循環防止)
      if (window.sidebarManager && window.sidebarManager._toggleAccordionInProgress) return;
      var wysiwyg = isWysiwygMode();

      if (wysiwyg) {
        // WYSIWYG: DOM から直接見出しを取得 (syncToMarkdown 不要)
        currentHeadings = parseWysiwygHeadings();
        currentActiveIndex = findWysiwygActiveIndex(currentHeadings);
        // session 109: WYSIWYG でも ChapterStore 由来の virtual heading を統合
        mergeVirtualChapterHeadings(currentHeadings);
      } else {
        var editor = document.getElementById('editor');
        if (!editor) return;
        var text = editor.value || '';
        currentHeadings = parseHeadings(text);
        var cursorPos = typeof editor.selectionStart === 'number' ? editor.selectionStart : 0;
        currentActiveIndex = findActiveIndex(currentHeadings, cursorPos);
        mergeVirtualChapterHeadings(currentHeadings);
      }

      // session 91: 全展開ボタンおよび「見出しがありません」メッセージ撤去

      // ツリー描画
      treeContainer.innerHTML = '';

      if (currentHeadings.length === 0) {
        var emptyInfo = getEmptyStateInfo();
        var metaEl = emptyState.querySelector('[data-sections-empty-meta]');
        var hintEl = emptyState.querySelector('[data-sections-empty-hint]');
        if (metaEl) metaEl.textContent = emptyInfo.meta;
        if (hintEl) hintEl.textContent = emptyInfo.hint;
        emptyState.hidden = false;
      } else {
        emptyState.hidden = true;
        var minLevel = 6;
        for (var k = 0; k < currentHeadings.length; k++) {
          if (currentHeadings[k].level < minLevel) minLevel = currentHeadings[k].level;
        }
        var prevLevel = 0;
        currentHeadings.forEach(function (h, idx) {
          var node = document.createElement('button');
          node.type = 'button';
          node.className = 'sections-tree-node';
          node.setAttribute('role', 'treeitem');
          node.setAttribute('data-heading-index', idx);

          var indent = (h.level - minLevel) * 16;
          node.style.paddingLeft = (8 + indent) + 'px';

          var levelBadge = document.createElement('span');
          levelBadge.className = 'sections-level-badge';
          levelBadge.textContent = 'H' + h.level;

          if (prevLevel > 0 && h.level - prevLevel > 1) {
            levelBadge.classList.add('sections-level-warning');
            levelBadge.title = 'H' + prevLevel + ' \u2192 H' + h.level + ': \u30EC\u30D9\u30EB\u304C\u98DB\u3093\u3067\u3044\u307E\u3059';
          }
          prevLevel = h.level;

          var titleSpan = document.createElement('span');
          titleSpan.className = 'sections-node-title';
          if (h.title) {
            titleSpan.textContent = h.title;
          } else {
            titleSpan.textContent = UNTITLED_CHAPTER_LABEL;
            titleSpan.classList.add('sections-node-title--placeholder');
          }

          node.appendChild(levelBadge);
          node.appendChild(titleSpan);

          if (idx === currentActiveIndex) {
            node.classList.add('sections-tree-node--active');
            node.setAttribute('aria-current', 'true');
          }

          node.addEventListener('click', (function (hh, ii) {
            return function () {
              jumpToHeading(hh, ii);
              scheduleRender();
            };
          })(h, idx));

          treeContainer.appendChild(node);
        });
      }

      // 同期イベント
      try {
        window.dispatchEvent(new CustomEvent('ZWSectionsLocationChanged', {
          detail: {
            headings: currentHeadings,
            activeIndex: currentActiveIndex,
            activeTitle: currentActiveIndex >= 0 ? currentHeadings[currentActiveIndex].title : null
          }
        }));
      } catch (_) {}
    }

    function scheduleRender() {
      // BP-5: アコーディオントグル中の再 render をスキップ (循環防止)
      if (window.sidebarManager && window.sidebarManager._toggleAccordionInProgress) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(render, DEBOUNCE_MS);
    }

    // --- イベントリスナー ---

    // textarea モード
    var editor = document.getElementById('editor');
    if (editor) {
      editor.addEventListener('input', scheduleRender);
      editor.addEventListener('click', scheduleRender);
      editor.addEventListener('keyup', function (e) {
        if ([37, 38, 39, 40, 33, 34, 36, 35].indexOf(e.keyCode) >= 0) {
          scheduleRender();
        }
      });
    }

    // リッチ編集表示
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (wysiwygEl) {
      wysiwygEl.addEventListener('input', scheduleRender);
      wysiwygEl.addEventListener('keyup', function (e) {
        if ([37, 38, 39, 40, 33, 34, 36, 35].indexOf(e.keyCode) >= 0) {
          scheduleRender();
        }
      });

      // Phase 2: WYSIWYG エディタ内クリックでセクション切替
      wysiwygEl.addEventListener('click', function (e) {
        // コラプス非アクティブ時はツリー更新のみ
        if (!collapseActive) {
          scheduleRender();
          return;
        }

        var target = e.target;

        // 省略マーカークリック → そのセクションをアクティブ化
        if (target.classList && target.classList.contains('section-collapse-more')) {
          var sIdx = parseInt(target.getAttribute('data-collapse-section-index'), 10);
          if (!isNaN(sIdx)) {
            applySectionCollapse(sIdx);
            var sections = parseWysiwygSections();
            if (sections[sIdx]) {
              sections[sIdx].headingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            scheduleRender();
          }
          e.preventDefault();
          return;
        }

        // 折りたたまれたセクションの見出しクリック → 切替
        if (/^H[1-6]$/.test(target.tagName)) {
          var sections = parseWysiwygSections();
          for (var i = 0; i < sections.length; i++) {
            if (sections[i].headingEl === target && i !== lastCollapseIndex) {
              applySectionCollapse(i);
              scheduleRender();
              return;
            }
          }
        }

        scheduleRender();
      });
    }

    // ドキュメント切替
    var onDocsChanged = function () {
      clearSectionCollapse();
      lastCollapseIndex = -1;
      setTimeout(render, 50);
    };
    window.addEventListener('ZWDocumentsChanged', onDocsChanged);
    document.addEventListener('zen-content-saved', scheduleRender);

    // session 108: Focus モードでの章追加・削除・リネームにも追従する
    var onChapterStoreChanged = function () { scheduleRender(); };
    window.addEventListener('ZWChapterStoreChanged', onChapterStoreChanged);

    // cleanup: render 時に前回のグローバルリスナーを除去
    if (api && typeof api.addCleanup === 'function') {
      api.addCleanup(function () { window.removeEventListener('ZWDocumentsChanged', onDocsChanged); });
      api.addCleanup(function () { document.removeEventListener('zen-content-saved', scheduleRender); });
      api.addCleanup(function () { window.removeEventListener('ZWChapterStoreChanged', onChapterStoreChanged); });
    }

    // 初回レンダリング
    render();

  }, {
    groups: ['sections'],
    title: '\u30bb\u30af\u30b7\u30e7\u30f3\u30ca\u30d3\u30b2\u30fc\u30bf\u30fc',
    description: '\u898b\u51fa\u3057\u30c4\u30ea\u30fc\u3068\u8a71\u30ca\u30d3\u30b2\u30fc\u30b7\u30e7\u30f3 (SP-052)',
    defaultCollapsed: false
  });

})();
