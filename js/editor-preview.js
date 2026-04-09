(function () {
  function syncPreviewToggleChrome(editorManager, isOpen) {
    var panel = editorManager && editorManager.previewPanel;
    var toolbarToggle = editorManager && editorManager.previewPanelToggle;
    var sidebarBtn = document.getElementById('sidebar-toggle-preview');
    if (panel) {
      panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
    if (toolbarToggle) {
      toolbarToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
    if (sidebarBtn) {
      sidebarBtn.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
    }
  }

  function setupPreviewPanel(editorManager) {
    if (!editorManager) return;

    var panel = editorManager.previewPanel;
    var toggle = editorManager.previewPanelToggle;
    if (!panel) return;

    function syncPreviewAria() {
      var isCollapsed = panel.classList.contains('editor-preview--collapsed');
      syncPreviewToggleChrome(editorManager, !isCollapsed);
    }

    if (toggle && !toggle.__zwPreviewBound) {
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
    if (!editorManager || !editorManager.previewPanel) {
      return false;
    }

    var panel = editorManager.previewPanel;
    var willOpen = panel.classList.contains('editor-preview--collapsed');

    panel.classList.toggle('editor-preview--collapsed', !willOpen);
    syncPreviewToggleChrome(editorManager, willOpen);

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
    if (window.ZWMdItBody && typeof window.ZWMdItBody.renderToHtmlBeforePipeline === 'function') {
      html = window.ZWMdItBody.renderToHtmlBeforePipeline(src, { editorManager: editorManager });
    } else {
      html = (src || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
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
