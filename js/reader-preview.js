/**
 * reader-preview.js — SP-078 読者プレビューモード
 *
 * 執筆した小説を「読者が読む体験」として全画面プレビューする。
 * 既存の chapter-nav.js / editor-preview.js の基盤を再利用。
 */
(function () {
  'use strict';

  var previewEl = null;
  var innerEl = null;
  var backFab = null;
  var toggleButtons = [];
  var isOpen = false;
  var progressBar = null;
  var progressFill = null;
  var scrollRAF = null;
  var typingCleanup = null;
  var scrollCleanup = null;
  var genreSelect = null;
  var verticalToggle = null;
  var isVertical = false;
  var readerChapterNavHandlerBound = null;

  /**
   * 再生オーバーレイ表示中は章ナビを執筆側 ChapterList に渡さず、Reader 面内でスクロールのみ行う。
   * @param {{ type: string, index?: number, source?: string }} detail
   * @returns {boolean}
   */
  function readerChapterNavigateHandler(detail) {
    if (!isOpen || !innerEl) return false;
    var content = innerEl.querySelector('.reader-preview__content');
    if (!content) return false;
    if (detail.type === 'scrollToToc') {
      var tocEl = content.querySelector('.chapter-toc');
      if (tocEl) {
        tocEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      var heads0 = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (heads0[0]) {
        heads0[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return true;
    }
    if (detail.type === 'chapterIndex') {
      var idx = typeof detail.index === 'number' ? detail.index : parseInt(detail.index, 10);
      if (isNaN(idx)) return true;
      var headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings[idx]) {
        headings[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return true;
    }
    return false;
  }

  function registerReaderChapterNavHandler() {
    var Nav = window.ZWChapterNav;
    if (!Nav || typeof Nav.registerNavigateHandler !== 'function') return;
    readerChapterNavHandlerBound = readerChapterNavigateHandler;
    Nav.registerNavigateHandler(readerChapterNavHandlerBound);
  }

  function unregisterReaderChapterNavHandler() {
    var Nav = window.ZWChapterNav;
    if (!Nav || typeof Nav.unregisterNavigateHandler !== 'function' || !readerChapterNavHandlerBound) return;
    Nav.unregisterNavigateHandler(readerChapterNavHandlerBound);
    readerChapterNavHandlerBound = null;
  }

  function ensureQuickToggleButton() {
    // ツールバー内の読者プレビューボタンに toggle 属性を付与
    var toolbarToggleBtn = document.getElementById('toggle-reader-preview');
    if (toolbarToggleBtn) {
      toolbarToggleBtn.setAttribute('data-reader-preview-toggle', 'true');
    }
    // モードボタンではなく専用トグルボタンで開閉する
  }

  function init() {
    previewEl = document.getElementById('reader-preview');
    innerEl = document.getElementById('reader-preview-inner');
    backFab = document.getElementById('reader-back-fab');
    ensureQuickToggleButton();
    toggleButtons = Array.prototype.slice.call(
      document.querySelectorAll('[data-reader-preview-toggle]')
    );

    if (!previewEl || !innerEl) return;

    // プログレスバーを生成
    progressBar = document.createElement('div');
    progressBar.className = 'reader-progress-bar';
    progressFill = document.createElement('div');
    progressFill.className = 'reader-progress-fill';
    progressBar.appendChild(progressFill);
    previewEl.appendChild(progressBar);

    // ジャンルプリセット選択UI (SP-074 Phase 6)
    if (window.GenrePresetRegistry) {
      var toolbar = document.createElement('div');
      toolbar.className = 'reader-genre-toolbar';
      genreSelect = document.createElement('select');
      genreSelect.className = 'reader-genre-select';
      var defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = '\u30B8\u30E3\u30F3\u30EB: \u306A\u3057';
      genreSelect.appendChild(defaultOpt);
      var presets = window.GenrePresetRegistry.list();
      for (var g = 0; g < presets.length; g++) {
        var opt = document.createElement('option');
        opt.value = presets[g].id;
        opt.textContent = presets[g].label;
        genreSelect.appendChild(opt);
      }
      genreSelect.addEventListener('change', function () {
        if (innerEl) {
          window.GenrePresetRegistry.apply(innerEl, genreSelect.value);
        }
      });
      toolbar.appendChild(genreSelect);
      previewEl.appendChild(toolbar);
    }

    // 縦書きトグルボタン
    verticalToggle = document.getElementById('reader-vertical-toggle');
    if (verticalToggle) {
      verticalToggle.addEventListener('click', toggleVerticalMode);
    }
    // 前回の縦書き設定を復元
    try {
      isVertical = localStorage.getItem('zenwriter-reader-vertical') === 'true';
    } catch (_) { /* noop */ }

    // スクロール連動
    previewEl.addEventListener('scroll', onScroll, { passive: true });

    // ツールバーボタン
    toggleButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (isOpen) exitReaderMode();
        else enterReaderMode();
      });
    });

    // 戻るFAB
    if (backFab) {
      if (backFab.__zwReaderExitHandler) {
        backFab.removeEventListener('click', backFab.__zwReaderExitHandler);
      }
      backFab.__zwReaderExitHandler = function () {
        exitReaderMode();
      };
      backFab.addEventListener('click', backFab.__zwReaderExitHandler);
    }

    // Escキーで復帰（app-shortcuts.jsに統合されていない場合のフォールバック）
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        exitReaderMode();
      }
    });

    // Ctrl+Shift+R ショートカット
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if (isOpen) exitReaderMode();
        else enterReaderMode();
      }
    });
  }

  // --- Reader Wiki ポップオーバー ---
  var readerWikiPopover = null;

  function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function showReaderWikiPopover(anchor, title) {
    dismissReaderWikiPopover();
    var trimmed = String(title || '').trim();
    if (!trimmed) return;

    var S = window.ZenWriterStorage;
    var entry = null;
    if (S && typeof S.loadStoryWiki === 'function') {
      var entries = S.loadStoryWiki() || [];
      entry = entries.find(function (e) { return e && e.title === trimmed; });
    }

    var pop = document.createElement('div');
    pop.className = 'reader-wiki-popover';
    if (entry) {
      var preview = (entry.content || '').slice(0, 120);
      if (entry.content && entry.content.length > 120) preview += '...';
      pop.innerHTML = '<strong>' + escHtml(entry.title) + '</strong>' +
        (preview ? '<div class="reader-wiki-popover-body">' + escHtml(preview) + '</div>' : '');
    } else {
      // 壊れ wikilink（is-broken）でもプレビュー意図を伝える（WP-004 / session 58 E2E 対象）
      pop.classList.add('reader-wiki-popover--broken');
      pop.innerHTML = '<strong>' + escHtml(trimmed) + '</strong>' +
        '<div class="reader-wiki-popover-body">' + escHtml('Story Wiki にこの語の項目はまだありません。') + '</div>';
    }

    // 位置: アンカー直下
    document.body.appendChild(pop);
    var rect = anchor.getBoundingClientRect();
    pop.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
    pop.style.top = (rect.bottom + 6) + 'px';
    readerWikiPopover = pop;

    // 外クリックで閉じる
    setTimeout(function () {
      document.addEventListener('click', onPopoverOutsideClick, true);
    }, 0);
  }

  function onPopoverOutsideClick(e) {
    if (readerWikiPopover && !readerWikiPopover.contains(e.target)) {
      dismissReaderWikiPopover();
    }
  }

  function dismissReaderWikiPopover() {
    if (readerWikiPopover) {
      readerWikiPopover.remove();
      readerWikiPopover = null;
    }
    document.removeEventListener('click', onPopoverOutsideClick, true);
  }

  /**
   * Reader 終了直後に編集面へフォーカスを戻す（WP-004 Phase 2: 復帰ワークフロー）
   */
  function scheduleFocusEditingSurfaceAfterReaderExit() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          var rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
          if (rte && rte.isWysiwygMode && rte.wysiwygEditor) {
            var w = rte.wysiwygEditor;
            if (w && window.getComputedStyle(w).display !== 'none') {
              w.focus();
              return;
            }
          }
          var ed = document.getElementById('editor');
          if (ed && window.getComputedStyle(ed).display !== 'none') {
            ed.focus();
          }
        } catch (_) { /* noop */ }
      });
    });
  }

  function enterReaderMode() {
    if (isOpen) return;

    // ContentGuard: 現在の編集内容を保存してからモード切替
    var G = window.ZWContentGuard;
    if (G && typeof G.ensureSaved === 'function') {
      G.ensureSaved();
    }

    registerReaderChapterNavHandler();

    // 読者プレビューHTMLを生成
    buildReaderHTML();

    // 縦書き設定を適用
    applyVerticalMode(isVertical);

    isOpen = true;
    document.documentElement.setAttribute('data-reader-overlay-open', 'true');
    if (previewEl) previewEl.classList.add('is-open');

    // スクロール位置を復元
    restoreScrollPosition();
  }

  function exitReaderMode() {
    if (!isOpen) return;
    unregisterReaderChapterNavHandler();
    dismissReaderWikiPopover();
    // スクロール位置を保存
    saveScrollPosition();

    isOpen = false;
    document.documentElement.removeAttribute('data-reader-overlay-open');
    if (previewEl) previewEl.classList.remove('is-open');

    scheduleFocusEditingSurfaceAfterReaderExit();

    // プログレスバーをリセット
    if (progressFill) progressFill.style.width = '0%';

    // タイピング演出をクリーンアップ
    if (typingCleanup) {
      typingCleanup();
      typingCleanup = null;
    }

    // スクロール連動演出をクリーンアップ
    if (scrollCleanup) {
      scrollCleanup();
      scrollCleanup = null;
    }

    // 縦書きクラスを除去 (次回 enter 時に再適用)
    if (previewEl) previewEl.classList.remove('reader-preview--vertical');

    // ジャンルプリセットをクリア
    if (innerEl && window.GenrePresetRegistry) {
      window.GenrePresetRegistry.clear(innerEl);
    }
    if (genreSelect) genreSelect.value = '';

    // 読者プレビューの内容をクリア（メモリ節約）
    if (innerEl) innerEl.innerHTML = '';
  }

  /**
   * 全visible章を結合して読者向けHTMLを生成
   */
  function buildReaderHTML() {
    if (!innerEl) return;
    innerEl.innerHTML = '';

    var Nav = window.ZWChapterNav;
    var S = window.ZenWriterStorage;

    // 作品タイトル
    var docTitle = '';
    if (S && typeof S.getCurrentDocId === 'function') {
      var docId = S.getCurrentDocId();
      if (docId && S.loadDocuments) {
        var docs = S.loadDocuments() || [];
        var doc = docs.find(function (d) { return d.id === docId; });
        if (doc) docTitle = doc.name || doc.title || '';
      }
    }

    if (docTitle) {
      var titleEl = document.createElement('h1');
      titleEl.className = 'reader-preview__title';
      titleEl.textContent = docTitle;
      innerEl.appendChild(titleEl);
    }

    // 章のHTML生成
    var fullHtml = getFullContentHtml();
    if (!fullHtml) {
      innerEl.innerHTML = '<p style="text-align:center;color:var(--text-muted,#999);padding:3rem;">コンテンツがありません</p>';
      return;
    }

    var html = fullHtml;
    if (html && window.ZWPostMarkdownHtmlPipeline && typeof window.ZWPostMarkdownHtmlPipeline.apply === 'function') {
      var rwSettings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
        ? window.ZenWriterStorage.loadSettings() : {};
      html = window.ZWPostMarkdownHtmlPipeline.apply(html, {
        settings: rwSettings,
        surface: 'reader'
      });
    }

    // コンテンツ挿入
    var contentDiv = document.createElement('div');
    contentDiv.className = 'reader-preview__content';
    contentDiv.innerHTML = html;
    innerEl.appendChild(contentDiv);

    // 目次とナビバーを注入
    if (Nav) {
      if (typeof Nav.injectToc === 'function') {
        Nav.injectToc(contentDiv);
      }
      if (typeof Nav.injectNavBars === 'function') {
        Nav.injectNavBars(contentDiv);
      }
      // 連続リンクの自動グループ化
      if (typeof Nav.autoGroupChoices === 'function') {
        Nav.autoGroupChoices(contentDiv);
      }
      if (typeof Nav.bindChapterLinks === 'function') {
        Nav.bindChapterLinks(contentDiv);
      }
      // アンカーリンクのみ（ToC/章末ナビは ZWChapterNav.dispatch 経路の単一リスナ）
      bindReaderLinks(contentDiv);
    }

    // wikilinkクリックハンドラ — ポップオー���ーで用語プレビュー
    var wikiLinks = contentDiv.querySelectorAll('a.wikilink');
    for (var wl = 0; wl < wikiLinks.length; wl++) {
      wikiLinks[wl].addEventListener('click', function (e) {
        e.preventDefault();
        var title = decodeURIComponent(this.getAttribute('data-wikilink') || '');
        if (!title) return;
        showReaderWikiPopover(this, title);
      });
    }

    // タイピング演出をアクティベート (SP-074 Phase 2)
    if (window.TypingEffectController && typeof window.TypingEffectController.activate === 'function') {
      typingCleanup = window.TypingEffectController.activate(contentDiv);
    }

    // スクロール連動演出をアクティベート (SP-074 Phase 4)
    if (window.ScrollTriggerController && typeof window.ScrollTriggerController.activate === 'function') {
      scrollCleanup = window.ScrollTriggerController.activate(contentDiv);
    }

    // SE AudioContext をユーザー操作で resume (SP-074 Phase 5)
    if (window.SoundEffectController && typeof window.SoundEffectController.resume === 'function') {
      contentDiv.addEventListener('click', function resumeSE() {
        window.SoundEffectController.resume();
        contentDiv.removeEventListener('click', resumeSE);
      }, { once: true });
    }

    // 先頭にスクロール
    if (isVertical) {
      previewEl.scrollLeft = 0;
    } else {
      previewEl.scrollTop = 0;
    }
  }

  /**
   * 縦書き/横書きを切り替える
   */
  function toggleVerticalMode() {
    isVertical = !isVertical;
    applyVerticalMode(isVertical);
    try {
      localStorage.setItem('zenwriter-reader-vertical', isVertical ? 'true' : 'false');
    } catch (_) { /* noop */ }
  }

  /**
   * 縦書きモードを適用/解除
   */
  function applyVerticalMode(vertical) {
    if (!previewEl) return;
    if (vertical) {
      previewEl.classList.add('reader-preview--vertical');
    } else {
      previewEl.classList.remove('reader-preview--vertical');
    }
    if (verticalToggle) {
      verticalToggle.setAttribute('aria-pressed', vertical ? 'true' : 'false');
      verticalToggle.textContent = vertical ? '横書き' : '縦書き';
      verticalToggle.setAttribute(
        'aria-label',
        vertical ? '横書き表示に切り替え（再生オーバーレイ）' : '縦書き表示に切り替え（再生オーバーレイ）'
      );
    }
    // プログレスバーをリセット
    if (progressFill) {
      progressFill.style.width = vertical ? '100%' : '0%';
      progressFill.style.height = vertical ? '0%' : '100%';
    }
  }

  function resolveDocumentIdForChapterStore(rawId, docs) {
    if (!rawId) return null;
    var list = docs || [];
    var rec = list.find(function (d) { return d && d.id === rawId; });
    if (!rec) return rawId;
    if (rec.type === 'document') return rawId;
    if (rec.type === 'chapter' && rec.parentId) {
      var parent = list.find(function (d) { return d && d.id === rec.parentId; });
      if (parent && parent.type === 'document') return parent.id;
      return rec.parentId;
    }
    var firstDoc = list.find(function (d) { return d && d.type === 'document'; });
    return firstDoc ? firstDoc.id : rawId;
  }

  /**
   * エディタの全コンテンツをHTMLとして取得（パイプライン直前。後処理は ZWPostMarkdownHtmlPipeline に一本化）
   */
  function getFullContentHtml() {
    var Store = window.ZWChapterStore;
    var S = window.ZenWriterStorage;
    var rawDocId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
    var docs = S && typeof S.loadDocuments === 'function' ? (S.loadDocuments() || []) : [];
    var docId = resolveDocumentIdForChapterStore(rawDocId, docs);
    var currentDoc = null;
    var markdown = '';

    if (docId) {
      currentDoc = docs.find(function (d) { return d && d.id === docId && d.type === 'document'; }) || null;
    }

    if (docId && Store && typeof Store.isChapterMode === 'function' && Store.isChapterMode(docId)) {
      // chapterMode: visible章のみ結合
      var chapters = Store.getChaptersForDoc(docId) || [];
      if (chapters.length > 0) {
        var visibleParts = [];
        chapters.forEach(function (ch) {
          if (!ch.visibility || ch.visibility === 'visible') {
            var heading = '## ' + (ch.name || 'Untitled');
            visibleParts.push(heading + '\n\n' + (ch.content || ''));
          }
        });
        markdown = visibleParts.join('\n\n---\n\n');
      }
    }

    if (!markdown.trim()) {
      // 通常モード: エディタ全文
      var G = window.ZWContentGuard;
      if (G && typeof G.getEditorContent === 'function') {
        markdown = G.getEditorContent();
      } else {
        var editor = document.getElementById('editor');
        markdown = editor ? editor.value || '' : '';
      }
    }

    if (!markdown.trim() && currentDoc) {
      markdown = currentDoc.content || '';
    }

    // プレビュー描画のたびに splitIntoChapters を走らせない（ensureSaved 等で doc.content と
    // エディタが一時的に不整合なとき、## 見出しが一斉に章レコード化される事故の原因になる）。
    // 章への分解は ensureChapterMode や明示的な移行処理に限定する。

    if (!markdown.trim()) return '';

    if (window.ZWMdItBody && typeof window.ZWMdItBody.renderToHtmlBeforePipeline === 'function') {
      return window.ZWMdItBody.renderToHtmlBeforePipeline(markdown);
    }

    return '<pre>' + markdown.replace(/</g, '&lt;') + '</pre>';
  }

  /**
   * 読者プレビュー内のリンクにクリックハンドラを設定
   */
  function bindReaderLinks(container) {
    // chapter-linkまたはアンカーリンク
    var links = container.querySelectorAll('a[href^="#"]');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var targetId = this.getAttribute('href').slice(1);
        if (!targetId) return;

        // IDで要素を探す
        var target = container.querySelector('#' + CSS.escape(targetId));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        // slugマッチで見出しを探す
        var headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (var i = 0; i < headings.length; i++) {
          var slug = headings[i].textContent.toLowerCase().trim()
            .replace(/[\s_]+/g, '-')
            .replace(/[^\w\u3000-\u9fff\uf900-\ufaff\u4e00-\u9faf-]/g, '');
          if (slug === targetId) {
            headings[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }
      });
    });
  }

  /**
   * 読者プレビューのHTMLをスタンドアロンファイルとしてダウンロード
   */
  function exportHtml() {
    if (!innerEl) return;

    var title = '';
    var titleEl = innerEl.querySelector('.reader-preview__title');
    if (titleEl) title = titleEl.textContent || '';

    // CSSテーマ変数を取得
    var cs = getComputedStyle(document.documentElement);
    var bgColor = cs.getPropertyValue('--bg-color').trim() || '#ffffff';
    var textColor = cs.getPropertyValue('--text-color').trim() || '#333333';
    var linkColor = cs.getPropertyValue('--link-color').trim() || cs.getPropertyValue('--accent-color').trim() || '#4a90d9';
    var fontFamily = cs.getPropertyValue('--font-family').trim() || "'Noto Serif JP', serif";

    var content = innerEl.querySelector('.reader-preview__content');
    var bodyHtml = content ? content.innerHTML : innerEl.innerHTML;

    // ナビバーを出力から除外（編集ツール用）
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyHtml;
    tempDiv.querySelectorAll('.chapter-nav-bar').forEach(function (el) { el.remove(); });
    bodyHtml = tempDiv.innerHTML;

    // 縦書きモードの場合、bodyスタイルを変更
    var bodyStyle = isVertical
      ? 'writing-mode: vertical-rl; max-height: 100vh; overflow-x: auto; overflow-y: hidden; margin: 2rem; padding: 0 1rem; '
      : 'max-width: 720px; margin: 2rem auto; padding: 0 1rem; ';

    var html = '<!DOCTYPE html>\n<html lang="ja">\n<head>\n'
      + '<meta charset="UTF-8">\n'
      + '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
      + '<title>' + (title || 'Zen Writer Export').replace(/</g, '&lt;') + '</title>\n'
      + '<style>\n'
      + '  body { ' + bodyStyle
      + 'font-family: ' + fontFamily + '; line-height: 1.8; '
      + 'background: ' + bgColor + '; color: ' + textColor + '; }\n'
      + '  a { color: ' + linkColor + '; }\n'
      + '  h1, h2, h3 { margin-top: 2em; margin-bottom: 0.5em; }\n'
      + '  hr { border: none; border-top: 1px solid #ccc; margin: 2em 0; }\n'
      + '  p { text-indent: 1em; margin: 0.5em 0; }\n'
      + '  blockquote { border-left: 3px solid #ccc; margin: 1em 0; padding: 0.5em 1em; color: #666; }\n'
      + '  .zw-textbox { display: block; margin: 1em 0; padding: 0.8em 1em; border-left: 3px solid #ccc; }\n'
      + '  .zw-textbox--dialogue { border-left-color: #4a90e2; }\n'
      + '  .zw-textbox--monologue { opacity: 0.9; font-style: italic; }\n'
      + '  .zw-textbox--narration { font-size: 0.95em; line-height: 2; }\n'
      + '  .zw-textbox--chant { letter-spacing: 0.05em; text-align: center; }\n'
      + '  .zw-textbox--warning { border-left-color: #e53935; }\n'
      + '  .tex-wave, .tex-sparkle, .tex-cosmic, .tex-fire, .tex-glitch'
      + '  { -webkit-background-clip: text; background-clip: text; color: transparent; background-size: 200% 200%; }\n'
      + '  .tex-wave { background-image: linear-gradient(90deg, #1a73e8, #00bcd4, #1a73e8); animation: tex-wave-move 3s ease-in-out infinite; }\n'
      + '  .tex-sparkle { background-image: linear-gradient(135deg, #f5c842 0%, #ff6f61 25%, #f5c842 50%, #ff6f61 75%, #f5c842 100%); animation: tex-sparkle-move 2s linear infinite; }\n'
      + '  .tex-cosmic { background-image: linear-gradient(270deg, #7b1fa2, #1565c0, #00838f, #1565c0, #7b1fa2); animation: tex-cosmic-flow 6s ease infinite; }\n'
      + '  .tex-fire { background-image: linear-gradient(0deg, #ff6f00, #ff8f00, #ffd600, #ff8f00, #ff6f00); animation: tex-fire-flicker 1.5s ease-in-out infinite alternate; }\n'
      + '  .tex-glitch { background-image: linear-gradient(90deg, #00e676, #f50057, #2979ff, #f50057, #00e676); animation: tex-glitch-shift 0.5s steps(4) infinite; }\n'
      + '  @keyframes tex-wave-move { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }\n'
      + '  @keyframes tex-sparkle-move { 0% { background-position: 0% 0%; } 100% { background-position: 200% 200%; } }\n'
      + '  @keyframes tex-cosmic-flow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }\n'
      + '  @keyframes tex-fire-flicker { 0%,100% { background-position: 50% 100%; } 50% { background-position: 50% 60%; } }\n'
      + '  @keyframes tex-glitch-shift { 0% { background-position: 0% 0%; } 25% { background-position: 80% 20%; } 50% { background-position: 20% 80%; } 75% { background-position: 60% 40%; } 100% { background-position: 0% 0%; } }\n'
      + '  @media (prefers-reduced-motion: reduce) { .tex-wave,.tex-sparkle,.tex-cosmic,.tex-fire,.tex-glitch { animation: none !important; } }\n'
      + '  .zw-typing { display: block; margin: 0.5em 0; line-height: 1.8; }\n'
      + '  .zw-typing .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }\n'
      + '  .zw-dialog { display: flex; align-items: flex-start; gap: 0.75em; margin: 1em 0; padding: 0.8em 1em; border-radius: 8px; background: rgba(128,128,128,0.08); line-height: 1.8; }\n'
      + '  .zw-dialog__icon { flex-shrink: 0; width: 48px; height: 48px; border-radius: 50%; overflow: hidden; }\n'
      + '  .zw-dialog__icon img { width: 100%; height: 100%; object-fit: cover; }\n'
      + '  .zw-dialog__body { flex: 1; min-width: 0; }\n'
      + '  .zw-dialog__speaker { font-weight: 700; font-size: 0.9em; margin-bottom: 0.2em; }\n'
      + '  .zw-dialog__content { white-space: pre-wrap; }\n'
      + '  .zw-dialog--right { flex-direction: row-reverse; text-align: right; }\n'
      + '  .zw-dialog--center { flex-direction: column; align-items: center; text-align: center; }\n'
      + '  .zw-dialog--bubble { background: rgba(74,144,226,0.1); border: 1px solid rgba(74,144,226,0.3); border-radius: 16px; }\n'
      + '  .zw-dialog--bordered { background: transparent; border: 2px solid #ccc; border-radius: 4px; }\n'
      + '  .zw-dialog--transparent { background: transparent; padding: 0.4em 0; }\n'
      + '  .zw-scroll { display: block; margin: 0.5em 0; line-height: 1.8; }\n'
      + '  .zw-scroll__content { white-space: pre-wrap; }\n'
      + '  .zw-scroll--fade-in { opacity: 0; transition: opacity 0.6s ease-out; }\n'
      + '  .zw-scroll--slide-up { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }\n'
      + '  .zw-scroll--slide-left { opacity: 0; transform: translateX(-30px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }\n'
      + '  .zw-scroll--slide-right { opacity: 0; transform: translateX(30px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }\n'
      + '  .zw-scroll--zoom-in { opacity: 0; transform: scale(0.8); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }\n'
      + '  .zw-scroll--visible { opacity: 1 !important; transform: none !important; }\n'
      + '  @media (prefers-reduced-motion: reduce) { .zw-scroll { opacity: 1 !important; transform: none !important; transition: none !important; } }\n'
      + '  .genre-adv .zw-dialog { background: rgba(0,0,0,0.85); color: #fff; border-radius: 4px; border: 1px solid rgba(255,215,0,0.3); }\n'
      + '  .genre-adv .zw-dialog__speaker { color: #ffd700; }\n'
      + '  .genre-adv .zw-typing { color: #fff; background: rgba(0,0,0,0.7); padding: 0.6em 1em; border-radius: 4px; }\n'
      + '  .genre-webnovel .zw-dialog { border-left: 3px solid #4a90e2; border-radius: 0; }\n'
      + '  .genre-webnovel .zw-scroll { transition-duration: 0.8s; }\n'
      + '  .genre-horror .zw-dialog { background: rgba(20,0,0,0.9); color: #ddd; border: 1px solid rgba(180,0,0,0.4); }\n'
      + '  .genre-horror .zw-dialog__speaker { color: #cc3333; letter-spacing: 0.1em; }\n'
      + '  .genre-horror .zw-typing { color: #ccc; letter-spacing: 0.05em; }\n'
      + '  .genre-horror .zw-scroll { transition-duration: 1.2s; }\n'
      + '  .genre-poem .zw-dialog { background: transparent; text-align: center; padding: 1.5em 2em; }\n'
      + '  .genre-poem .zw-typing { text-align: center; font-style: italic; line-height: 2.2; }\n'
      + '  .genre-poem .zw-scroll { text-align: center; transition-duration: 1s; }\n'
      + '  .kenten { -webkit-text-emphasis: filled sesame; text-emphasis: filled sesame; }\n'
      + '  a.wikilink { color: ' + linkColor + '; text-decoration: underline dotted; }\n'
      + '  a.wikilink.is-broken { color: #e53935; text-decoration: line-through; }\n'
      + '  ruby rt { font-size: 0.5em; }\n'
      + '</style>\n</head>\n<body>\n'
      + (title ? '<h1>' + title.replace(/</g, '&lt;') + '</h1>\n' : '')
      + bodyHtml + '\n'
      + '</body>\n</html>';

    // Blobダウンロード
    var blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (title || 'export').replace(/[<>:"/\\|?*]/g, '_') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // HUDフィードバック
    if (window.ZenWriterHUD) {
      window.ZenWriterHUD.show('HTMLを保存しました', 2000, { type: 'success' });
    }
  }

  /**
   * スクロール進捗を更新
   */
  function onScroll() {
    if (scrollRAF) return;
    scrollRAF = requestAnimationFrame(function () {
      scrollRAF = null;
      if (!previewEl || !progressFill) return;

      var pct;
      if (isVertical) {
        // 縦書き: 横スクロール (右→左方向。scrollLeft は負値)
        var scrollWidth = previewEl.scrollWidth - previewEl.clientWidth;
        var scrollLeft = Math.abs(previewEl.scrollLeft);
        pct = scrollWidth > 0 ? Math.min(100, (scrollLeft / scrollWidth) * 100) : 0;
        progressFill.style.height = pct + '%';
        progressFill.style.width = '100%';
      } else {
        var scrollTop = previewEl.scrollTop;
        var scrollHeight = previewEl.scrollHeight - previewEl.clientHeight;
        pct = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
        progressFill.style.width = pct + '%';
        progressFill.style.height = '100%';
      }
    });
  }

  /**
   * スクロール位置をセッションに保存
   */
  function saveScrollPosition() {
    if (!previewEl) return;
    var key = getScrollKey();
    if (!key) return;
    try {
      var pos = isVertical ? previewEl.scrollLeft : previewEl.scrollTop;
      sessionStorage.setItem(key, String(pos));
      sessionStorage.setItem(key + '-vertical', isVertical ? 'true' : 'false');
    } catch (_e) { /* quota exceeded */ }
  }

  /**
   * スクロール位置を復元
   */
  function restoreScrollPosition() {
    if (!previewEl) return;
    var key = getScrollKey();
    if (!key) return;
    try {
      var savedVertical = sessionStorage.getItem(key + '-vertical') === 'true';
      if (savedVertical !== isVertical) return; // モード不一致なら復元しない
      var saved = sessionStorage.getItem(key);
      if (saved !== null) {
        var pos = parseInt(saved, 10);
        if (!isNaN(pos)) {
          if (isVertical) {
            previewEl.scrollLeft = pos;
          } else if (pos > 0) {
            previewEl.scrollTop = pos;
          }
        }
      }
    } catch (_e) { /* not available */ }
  }

  /**
   * 現在のドキュメントIDに基づくスクロールキー
   */
  function getScrollKey() {
    var S = window.ZenWriterStorage;
    var docId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
    return docId ? 'reader-scroll-' + docId : 'reader-scroll-default';
  }

  // ---- Init ----

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      var exportBtn = document.getElementById('reader-export-html');
      if (exportBtn) exportBtn.addEventListener('click', exportHtml);
    }, { once: true });
  } else {
    init();
    var exportBtn = document.getElementById('reader-export-html');
    if (exportBtn) exportBtn.addEventListener('click', exportHtml);
  }

  // Public API
  window.ZWReaderPreview = {
    enter: enterReaderMode,
    exit: exitReaderMode,
    toggle: function () {
      if (isOpen) exitReaderMode();
      else enterReaderMode();
    },
    isOpen: function () { return isOpen; },
    exportHtml: exportHtml,
    toggleVertical: toggleVerticalMode,
    get isVertical() { return isVertical; },
    getProgress: function () {
      if (!previewEl) return 0;
      if (isVertical) {
        var scrollWidth = previewEl.scrollWidth - previewEl.clientWidth;
        return scrollWidth > 0 ? Math.min(100, (Math.abs(previewEl.scrollLeft) / scrollWidth) * 100) : 0;
      }
      var scrollHeight = previewEl.scrollHeight - previewEl.clientHeight;
      return scrollHeight > 0 ? Math.min(100, (previewEl.scrollTop / scrollHeight) * 100) : 0;
    }
  };
})();
