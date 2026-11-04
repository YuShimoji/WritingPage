(function () {
  function cleanupPreviewControllers(editorManager) {
    if (!editorManager) return;
    if (typeof editorManager._previewTypingCleanup === 'function') {
      try { editorManager._previewTypingCleanup(); } catch (_) { /* noop */ }
    }
    if (typeof editorManager._previewScrollCleanup === 'function') {
      try { editorManager._previewScrollCleanup(); } catch (_) { /* noop */ }
    }
    editorManager._previewTypingCleanup = null;
    editorManager._previewScrollCleanup = null;
  }

  function activatePreviewControllers(editorManager) {
    if (!editorManager || !editorManager.markdownPreviewPanel) return;
    cleanupPreviewControllers(editorManager);
    var container = editorManager.markdownPreviewPanel;
    if (window.TypingEffectController && typeof window.TypingEffectController.activate === 'function') {
      editorManager._previewTypingCleanup = window.TypingEffectController.activate(container);
    }
    if (window.ScrollTriggerController && typeof window.ScrollTriggerController.activate === 'function') {
      editorManager._previewScrollCleanup = window.ScrollTriggerController.activate(container);
    }
  }

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
    // 開いている間は執筆面と入れ替える（並べない）。CSS が .editor-classic-layer--previewing で執筆面を不可視にする
    var layer = document.getElementById('editor-classic-layer');
    if (layer) {
      layer.classList.toggle('editor-classic-layer--previewing', !!isOpen);
    }
  }

  /** 入れ替え対象の執筆面（リッチ編集中は #wysiwyg-editor、それ以外は #editor）。 */
  function getWritingSurface(editorManager) {
    var rte = editorManager && editorManager.richTextEditor;
    if (rte && rte.isWysiwygMode && rte.wysiwygEditor) return rte.wysiwygEditor;
    return editorManager && editorManager.editor ? editorManager.editor : null;
  }

  function getScrollRatio(el) {
    if (!el) return 0;
    var max = el.scrollHeight - el.clientHeight;
    return max > 0 ? el.scrollTop / max : 0;
  }

  function applyScrollRatio(el, ratio) {
    if (!el) return;
    var max = el.scrollHeight - el.clientHeight;
    if (max > 0) el.scrollTop = ratio * max;
  }

  function restoreWritingFocus(editorManager, previewRatio) {
    var surface = getWritingSurface(editorManager);
    if (!surface) return;
    applyScrollRatio(surface, previewRatio);
    try { surface.focus({ preventScroll: true }); } catch (_) { /* noop */ }
  }

  function setupPreviewPanel(editorManager) {
    if (!editorManager) return;

    var panel = editorManager.previewPanel;
    var toggle = editorManager.previewPanelToggle;
    if (!panel) return;

    function syncPreviewAria() {
      var isCollapsed = panel.classList.contains('editor-preview--collapsed');
      syncPreviewToggleChrome(editorManager, !isCollapsed);
      if (isCollapsed) {
        cleanupPreviewControllers(editorManager);
      }
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

    var back = document.getElementById('editor-preview-back');
    if (back && !back.__zwPreviewBound) {
      back.addEventListener('click', function () {
        if (!panel.classList.contains('editor-preview--collapsed')) {
          togglePreview(editorManager);
        }
      });
      back.__zwPreviewBound = true;
    }

    syncPreviewAria();
  }

  function cancelScheduledRender(editorManager) {
    if (editorManager._markdownPreviewDebounceTimer) {
      clearTimeout(editorManager._markdownPreviewDebounceTimer);
      editorManager._markdownPreviewDebounceTimer = null;
    }
    if (editorManager._markdownPreviewFrame) {
      cancelAnimationFrame(editorManager._markdownPreviewFrame);
      editorManager._markdownPreviewFrame = null;
    }
  }

  function togglePreview(editorManager) {
    if (!editorManager || !editorManager.previewPanel) {
      return false;
    }

    var panel = editorManager.previewPanel;
    var willOpen = panel.classList.contains('editor-preview--collapsed');
    var ratio = 0;

    if (willOpen) {
      // 同じ位置から読み始める（Markdown 正本は入力・コマンド・Undo のたびに同期済み）
      ratio = getScrollRatio(getWritingSurface(editorManager));
    } else {
      ratio = getScrollRatio(panel);
    }

    panel.classList.toggle('editor-preview--collapsed', !willOpen);
    syncPreviewToggleChrome(editorManager, willOpen);

    if (willOpen) {
      // 切り替えた瞬間に古い内容や空表示を見せない: debounce せず同期描画する
      cancelScheduledRender(editorManager);
      renderMarkdownPreviewImmediate(editorManager);
      applyScrollRatio(panel, ratio);
    } else {
      cleanupPreviewControllers(editorManager);
      restoreWritingFocus(editorManager, ratio);
    }

    return willOpen;
  }

  function renderMarkdownPreview(editorManager) {
    if (!editorManager) return;
    cancelScheduledRender(editorManager);
    var panel = editorManager.previewPanel;
    var isOpen = !!panel && !panel.classList.contains('editor-preview--collapsed');
    if (isOpen) {
      // 開いている間は次フレームで反映（実時間）。閉じている間は従来どおり debounce
      editorManager._markdownPreviewFrame = requestAnimationFrame(function () {
        editorManager._markdownPreviewFrame = null;
        renderMarkdownPreviewImmediate(editorManager);
      });
      return;
    }
    editorManager._markdownPreviewDebounceTimer = setTimeout(function () {
      editorManager._markdownPreviewDebounceTimer = null;
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
    if (!src.trim()) {
      html = '<p class="editor-preview__empty">プレビューできる本文がまだありません。本文を書くとここに反映されます。</p>';
    } else if (window.ZWMdItBody && typeof window.ZWMdItBody.renderToHtmlBeforePipeline === 'function') {
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

    // WP-005 Slice B: preview surface でも演出 Controller を有効化
    activatePreviewControllers(editorManager);
  }

  window.editorPreview_setupPreviewPanel = setupPreviewPanel;
  window.editorPreview_togglePreview = togglePreview;
  window.editorPreview_renderMarkdownPreview = renderMarkdownPreview;
  window.editorPreview_renderMarkdownPreviewImmediate = renderMarkdownPreviewImmediate;
})();
