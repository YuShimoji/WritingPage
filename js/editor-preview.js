(function () {
  function setupPreviewPanel(editorManager) {
    if (!editorManager) return;

    var panel = editorManager.previewPanel;
    var toggle = editorManager.previewPanelToggle;
    if (!panel || !toggle) return;

    function syncPreviewAria() {
      var isCollapsed = panel.classList.contains('editor-preview--collapsed');
      toggle.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      panel.setAttribute('aria-hidden', isCollapsed ? 'true' : 'false');
    }

    if (!toggle.__zwPreviewBound) {
      toggle.addEventListener('click', function () {
        togglePreview(editorManager);
      });
      toggle.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          togglePreview(editorManager);
        }
      });
      toggle.__zwPreviewBound = true;
    }

    syncPreviewAria();
  }

  function togglePreview(editorManager) {
    if (!editorManager || !editorManager.previewPanel || !editorManager.previewPanelToggle) {
      return false;
    }

    var panel = editorManager.previewPanel;
    var toggle = editorManager.previewPanelToggle;
    var willOpen = panel.classList.contains('editor-preview--collapsed');

    panel.classList.toggle('editor-preview--collapsed', !willOpen);
    toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    panel.setAttribute('aria-hidden', willOpen ? 'false' : 'true');

    if (willOpen) {
      renderMarkdownPreview(editorManager);
    }

    return willOpen;
  }

  function renderMarkdownPreview(editorManager) {
    if (!editorManager) return;
    if (editorManager._markdownPreviewDebounceTimer) {
      clearTimeout(editorManager._markdownPreviewDebounceTimer);
    }
    editorManager._markdownPreviewDebounceTimer = setTimeout(function () {
      renderMarkdownPreviewImmediate(editorManager);
    }, editorManager._MARKDOWN_PREVIEW_DEBOUNCE_DELAY || 100);
  }

  function renderMarkdownPreviewImmediate(editorManager) {
    if (!editorManager || !editorManager.markdownPreviewPanel || !editorManager.editor) return;
    var src = editorManager.editor.value || '';
    var settings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
      ? window.ZenWriterStorage.loadSettings()
      : {};

    var html = '';
    try {
      if (window.markdownit) {
        if (!editorManager._markdownRenderer) {
          editorManager._markdownRenderer = window.markdownit({
            html: false,
            linkify: true,
            breaks: true,
          });
        }
        html = editorManager._markdownRenderer.render(src);
      } else {
        html = (src || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }
    } catch (_) {
      html = '';
    }

    // :::zw-* DSL マーカーが <p> で囲まれている場合を復元
    if (html && html.indexOf(':::zw-') !== -1) {
      html = html.replace(/<p>(:::zw-(?:textbox|typing|dialog)(?:\{[^}]*\})?)<\/p>/gi, '$1\n');
      html = html.replace(/<p>:::<\/p>/g, '\n:::');
    }

    if (html && window.TextboxRichTextBridge && typeof window.TextboxRichTextBridge.projectRenderedHtml === 'function') {
      html = window.TextboxRichTextBridge.projectRenderedHtml(html, {
        settings: settings,
        target: 'preview'
      });
    }

    if (html && editorManager.processFontDecorations) {
      html = editorManager.processFontDecorations(html);
    }
    if (html && editorManager.processTextAnimations) {
      html = editorManager.processTextAnimations(html);
    }

    if (html) {
      html = html.replace(/\[\[([^\]]+)\]\]/g, function (_match, content) {
        var parts = content.split('|');
        var link = parts[0].trim();
        var display = parts.length > 1 ? parts[1].trim() : link;

        // W2: StoryWiki API で存在チェック (旧 listWikiPages から移行)
        var exists = false;
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.searchStoryWiki === 'function') {
          var results = window.ZenWriterStorage.searchStoryWiki(link);
          exists = results.some(function (e) {
            return (e.title || '').toLowerCase() === link.toLowerCase();
          });
        } else if (window.ZenWriterStorage && typeof window.ZenWriterStorage.listWikiPages === 'function') {
          // フォールバック: 旧 API
          var all = window.ZenWriterStorage.listWikiPages();
          exists = all.some(function (p) {
            return (p.title || '') === link;
          });
        }
        var brokenClass = exists ? '' : ' is-broken';

        return '<a href="#" class="wikilink' + brokenClass + '" data-wikilink="' + encodeURIComponent(link) + '">' + display + '</a>';
      });
    }

    // SP-072: chapter:// リンク変換
    if (html && window.ZWChapterNav && typeof window.ZWChapterNav.convertChapterLinks === 'function') {
      html = window.ZWChapterNav.convertChapterLinks(html);
    }

    if (html) {
      // Kenten (傍点) support: {kenten|text} -> <span class="kenten">text</span>
      // Must run before ruby to avoid {kenten|...} being parsed as ruby
      html = html.replace(/\{kenten\|([^{}|]+)\}/g, function (_match, text) {
        return '<span class="kenten">' + text.trim() + '</span>';
      });
      // Ruby Text support: {Kanji|Kana} -> <ruby>Kanji<rt>Kana</rt></ruby>
      html = html.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, function (_match, kanji, kana) {
        return '<ruby>' + kanji.trim() + '<rt>' + kana.trim() + '</rt></ruby>';
      });
      // Legacy ruby format: |漢字《かな》 -> <ruby>漢字<rt>かな</rt></ruby>
      html = html.replace(/\|([^|《》]+)《([^《》]+)》/g, function (_match, kanji, kana) {
        return '<ruby>' + kanji.trim() + '<rt>' + kana.trim() + '</rt></ruby>';
      });
    }

    if (window.morphdom) {
      var tempContainer = document.createElement('div');
      tempContainer.innerHTML = html;
      try {
        window.morphdom(editorManager.markdownPreviewPanel, tempContainer, {
          childrenOnly: true,
        });
      } catch (_) {
        editorManager.markdownPreviewPanel.innerHTML = html;
      }
    } else {
      editorManager.markdownPreviewPanel.innerHTML = html;
    }

    // SP-072: 章末ナビバー注入 + chapter:// リンクバインド
    if (window.ZWChapterNav && typeof window.ZWChapterNav.onPreviewUpdated === 'function') {
      window.ZWChapterNav.onPreviewUpdated(editorManager.markdownPreviewPanel);
    }

    // W1: wikilink クリックハンドラ (イベント委譲)
    if (!editorManager.markdownPreviewPanel.__zwWikilinkBound) {
      editorManager.markdownPreviewPanel.addEventListener('click', function (e) {
        var target = e.target.closest('a.wikilink');
        if (!target) return;
        e.preventDefault();
        var link = decodeURIComponent(target.getAttribute('data-wikilink') || '');
        if (!link) return;
        // StoryWiki のエントリを開く (swiki-open-entry イベントを発火)
        document.dispatchEvent(new CustomEvent('swiki-open-entry', { detail: { title: link } }));
      });
      editorManager.markdownPreviewPanel.__zwWikilinkBound = true;
    }
  }

  window.editorPreview_setupPreviewPanel = setupPreviewPanel;
  window.editorPreview_togglePreview = togglePreview;
  window.editorPreview_renderMarkdownPreview = renderMarkdownPreview;
  window.editorPreview_renderMarkdownPreviewImmediate = renderMarkdownPreviewImmediate;
})();
