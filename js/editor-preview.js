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

    // DSL ブロックを退避してから markdown-it に渡す
    var dslBlockRe = /:::zw-(?:textbox|typing|dialog|scroll|pathtext)(?:\{[^}]*\})?\n[\s\S]*?\n:::/gi;
    var dslPlaceholders = [];
    var dslCounter = 0;
    var mdSrc = src.replace(dslBlockRe, function (match) {
      var token = '\n\nZWDSLBLOCK' + dslCounter + '\n\n';
      dslPlaceholders.push({ token: 'ZWDSLBLOCK' + dslCounter, dsl: match });
      dslCounter++;
      return token;
    });

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
        html = editorManager._markdownRenderer.render(mdSrc);
      } else {
        html = (mdSrc || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }
    } catch (_) {
      html = '';
    }

    // DSL ブロックを復元
    for (var di = 0; di < dslPlaceholders.length; di++) {
      var dp = dslPlaceholders[di];
      html = html.replace(new RegExp('<p>' + dp.token + '</p>', 'g'), dp.dsl);
      html = html.replace(new RegExp(dp.token, 'g'), dp.dsl);
    }

    if (html && window.ZWPostMarkdownHtmlPipeline && typeof window.ZWPostMarkdownHtmlPipeline.apply === 'function') {
      html = window.ZWPostMarkdownHtmlPipeline.apply(html, {
        settings: settings,
        surface: 'preview'
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
