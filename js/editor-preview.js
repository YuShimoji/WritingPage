(function () {
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
            breaks: true
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
    } catch (e) {
      html = '';
    }

    if (window.morphdom) {
      var tempContainer = document.createElement('div');
      tempContainer.innerHTML = html;
      try {
        window.morphdom(editorManager.markdownPreviewPanel, tempContainer, {
          childrenOnly: true
        });
      } catch (morphErr) {
        console.warn('morphdom error, falling back to innerHTML:', morphErr);
        editorManager.markdownPreviewPanel.innerHTML = html;
      }
    } else {
      editorManager.markdownPreviewPanel.innerHTML = html;
    }
  }

  window.editorPreview_renderMarkdownPreview = renderMarkdownPreview;
  window.editorPreview_renderMarkdownPreviewImmediate = renderMarkdownPreviewImmediate;
})();
