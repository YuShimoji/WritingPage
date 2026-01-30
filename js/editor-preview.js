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

    // フォント装飾とテキストアニメーションを処理
    // プレビューでは、Markdownレンダリング後のHTMLに対して装飾を適用する
    if (html && editorManager.processFontDecorations) {
      html = editorManager.processFontDecorations(html);
    }
    if (html && editorManager.processTextAnimations) {
      html = editorManager.processTextAnimations(html);
    }

    // Wikilinks [[link]] または [[link|display]] を処理
    if (html) {
      html = html.replace(/\[\[([^\]]+)\]\]/g, function (match, content) {
        var parts = content.split('|');
        var link = parts[0].trim();
        var display = parts.length > 1 ? parts[1].trim() : link;

        // 存在チェック (TASK_044)
        var exists = false;
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.listWikiPages === 'function') {
          var all = window.ZenWriterStorage.listWikiPages();
          exists = all.some(function (p) { return (p.title || '') === link; });
        }
        var brokenClass = exists ? '' : ' is-broken';

        // data-wikilink 属性を付与してクリックイベントで拾えるようにする
        return '<a href="#" class="wikilink' + brokenClass + '" data-wikilink="' + encodeURIComponent(link) + '" onclick="return false;">' + display + '</a>';
      });
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
