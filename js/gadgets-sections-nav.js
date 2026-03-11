/**
 * gadgets-sections-nav.js
 * SP-052: セクションナビゲーターガジェット
 * 責務: 見出しツリー表示、クリックジャンプ、アクティブ追従、下部ナビ連携
 */
(function () {
  'use strict';

  var ZWGadgets = window.ZWGadgets;
  if (!ZWGadgets) return;

  var HEADING_RE = /^(#{1,6})\s+(.+)$/gm;
  var DEBOUNCE_MS = 120;

  function parseHeadings(text) {
    var headings = [];
    var match;
    HEADING_RE.lastIndex = 0;
    while ((match = HEADING_RE.exec(text)) !== null) {
      headings.push({
        level: match[1].length,
        title: match[2].trim(),
        offset: match.index
      });
    }
    // Compute endOffset for each heading
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
      if (cursorPos >= headings[i].offset) active = i;
      else break;
    }
    return active;
  }

  // --- Bottom nav controller ---
  function initBottomNav() {
    var prevBtn = document.getElementById('bottom-nav-prev');
    var nextBtn = document.getElementById('bottom-nav-next');
    var titleBtn = document.getElementById('bottom-nav-title');
    var titleText = document.getElementById('bottom-nav-title-text');
    if (!prevBtn || !nextBtn || !titleBtn || !titleText) return null;

    var state = { headings: [], activeIndex: -1 };

    prevBtn.addEventListener('click', function () {
      if (state.activeIndex > 0) {
        jumpToHeading(state.headings[state.activeIndex - 1]);
      }
    });

    nextBtn.addEventListener('click', function () {
      if (state.activeIndex < state.headings.length - 1) {
        jumpToHeading(state.headings[state.activeIndex + 1]);
      }
    });

    titleBtn.addEventListener('click', function () {
      // Open sidebar and show sections
      window.dispatchEvent(new CustomEvent('ZWBottomNavNavigate', {
        detail: { action: 'openSections' }
      }));
    });

    return {
      update: function (headings, activeIndex) {
        state.headings = headings;
        state.activeIndex = activeIndex;
        prevBtn.disabled = activeIndex <= 0;
        nextBtn.disabled = activeIndex >= headings.length - 1 || headings.length === 0;
        if (activeIndex >= 0 && headings[activeIndex]) {
          titleText.textContent = headings[activeIndex].title;
        } else {
          titleText.textContent = '---';
        }
      }
    };
  }

  function jumpToHeading(heading) {
    var editor = document.getElementById('editor');
    if (!editor || !heading) return;
    editor.selectionStart = heading.offset;
    editor.selectionEnd = heading.offset;
    editor.focus();
    // Scroll into view
    var linesBefore = editor.value.substring(0, heading.offset).split('\n').length;
    var lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20;
    var scrollTarget = (linesBefore - 3) * lineHeight;
    editor.scrollTop = Math.max(0, scrollTarget);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  ZWGadgets.register('SectionsNavigator', function (el) {
    var wrap = document.createElement('div');
    wrap.className = 'sections-nav-gadget';

    var treeContainer = document.createElement('div');
    treeContainer.className = 'sections-tree';
    treeContainer.setAttribute('role', 'tree');
    treeContainer.setAttribute('aria-label', '見出しツリー');

    var emptyMsg = document.createElement('div');
    emptyMsg.className = 'sections-empty';
    emptyMsg.textContent = '見出しがありません';
    emptyMsg.style.cssText = 'font-size:0.85rem;opacity:0.6;padding:4px 0;';
    treeContainer.appendChild(emptyMsg);

    wrap.appendChild(treeContainer);
    el.appendChild(wrap);

    var bottomNav = initBottomNav();
    var currentHeadings = [];
    var currentActiveIndex = -1;
    var debounceTimer = null;

    function getEditorText() {
      // WYSIWYG mode: ensure textarea is synced first
      var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
      if (rte && rte.isWysiwygMode && typeof rte.syncToMarkdown === 'function') {
        rte.syncToMarkdown();
      }
      var editor = document.getElementById('editor');
      return editor ? (editor.value || '') : '';
    }

    function render() {
      var editor = document.getElementById('editor');
      if (!editor) return;

      var text = getEditorText();
      currentHeadings = parseHeadings(text);
      var cursorPos = typeof editor.selectionStart === 'number' ? editor.selectionStart : 0;
      currentActiveIndex = findActiveIndex(currentHeadings, cursorPos);

      // Clear tree
      treeContainer.innerHTML = '';

      if (currentHeadings.length === 0) {
        var msg = document.createElement('div');
        msg.className = 'sections-empty';
        msg.textContent = '見出しがありません';
        msg.style.cssText = 'font-size:0.85rem;opacity:0.6;padding:4px 0;';
        treeContainer.appendChild(msg);
      } else {
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

          // Level indicator
          var levelBadge = document.createElement('span');
          levelBadge.className = 'sections-level-badge';
          levelBadge.textContent = 'H' + h.level;

          // Level-skip warning
          if (prevLevel > 0 && h.level - prevLevel > 1) {
            levelBadge.classList.add('sections-level-warning');
            levelBadge.title = 'H' + prevLevel + ' \u2192 H' + h.level + ': \u30EC\u30D9\u30EB\u304C\u98DB\u3093\u3067\u3044\u307E\u3059';
          }
          prevLevel = h.level;

          var titleSpan = document.createElement('span');
          titleSpan.className = 'sections-node-title';
          titleSpan.textContent = h.title;

          node.appendChild(levelBadge);
          node.appendChild(titleSpan);

          if (idx === currentActiveIndex) {
            node.classList.add('sections-tree-node--active');
            node.setAttribute('aria-current', 'true');
          }

          node.addEventListener('click', function () {
            jumpToHeading(h);
            scheduleRender();
          });

          treeContainer.appendChild(node);
        });
      }

      // Update bottom nav
      if (bottomNav) {
        bottomNav.update(currentHeadings, currentActiveIndex);
      }

      // Emit location event for synchronization
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
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(render, DEBOUNCE_MS);
    }

    // Listen to editor changes (textarea mode)
    var editor = document.getElementById('editor');
    if (editor) {
      editor.addEventListener('input', scheduleRender);
      editor.addEventListener('click', scheduleRender);
      editor.addEventListener('keyup', function (e) {
        // Only re-render on cursor movement keys
        if ([37, 38, 39, 40, 33, 34, 36, 35].indexOf(e.keyCode) >= 0) {
          scheduleRender();
        }
      });
    }

    // Listen to WYSIWYG editor changes
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (wysiwygEl) {
      wysiwygEl.addEventListener('input', scheduleRender);
      wysiwygEl.addEventListener('click', scheduleRender);
      wysiwygEl.addEventListener('keyup', function (e) {
        if ([37, 38, 39, 40, 33, 34, 36, 35].indexOf(e.keyCode) >= 0) {
          scheduleRender();
        }
      });
    }

    // Listen to document switch
    window.addEventListener('ZWDocumentsChanged', function () {
      setTimeout(render, 50);
    });
    // zen-content-saved is dispatched on document, not window
    document.addEventListener('zen-content-saved', scheduleRender);

    // Handle openSections from bottom nav
    window.addEventListener('ZWBottomNavNavigate', function (e) {
      if (e.detail && e.detail.action === 'openSections') {
        // Open sidebar and expand sections category
        var sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('open')) {
          var toggle = document.getElementById('toggle-sidebar');
          if (toggle) toggle.click();
        }
        var sectionHeader = document.querySelector('.accordion-header[aria-controls="accordion-sections"]');
        if (sectionHeader && sectionHeader.getAttribute('aria-expanded') !== 'true') {
          sectionHeader.click();
        }
      }
    });

    // Initial render
    render();

  }, {
    groups: ['sections'],
    title: 'セクションナビゲーター',
    description: '見出しツリーと話ナビゲーション (SP-052)'
  });

})();
