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

        var exists = false;
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.listWikiPages === 'function') {
          var all = window.ZenWriterStorage.listWikiPages();
          exists = all.some(function (p) {
            return (p.title || '') === link;
          });
        }
        var brokenClass = exists ? '' : ' is-broken';

        return '<a href="#" class="wikilink' + brokenClass + '" data-wikilink="' + encodeURIComponent(link) + '" onclick="return false;">' + display + '</a>';
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
  }

  window.editorPreview_setupPreviewPanel = setupPreviewPanel;
  window.editorPreview_togglePreview = togglePreview;
  window.editorPreview_renderMarkdownPreview = renderMarkdownPreview;
  window.editorPreview_renderMarkdownPreviewImmediate = renderMarkdownPreviewImmediate;
})();
