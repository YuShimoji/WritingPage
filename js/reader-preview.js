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
  var toggleBtn = null;
  var previousMode = null;
  var progressBar = null;
  var progressFill = null;
  var scrollRAF = null;
  var typingCleanup = null;
  var scrollTriggerCleanup = null;

  function init() {
    previewEl = document.getElementById('reader-preview');
    innerEl = document.getElementById('reader-preview-inner');
    backFab = document.getElementById('reader-back-fab');
    toggleBtn = document.getElementById('toggle-reader-preview');

    if (!previewEl || !innerEl) return;

    // プログレスバーを生成
    progressBar = document.createElement('div');
    progressBar.className = 'reader-progress-bar';
    progressFill = document.createElement('div');
    progressFill.className = 'reader-progress-fill';
    progressBar.appendChild(progressFill);
    previewEl.appendChild(progressBar);

    // スクロール連動
    previewEl.addEventListener('scroll', onScroll, { passive: true });

    // ツールバーボタン
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var mode = document.documentElement.getAttribute('data-ui-mode');
        if (mode === 'reader') {
          exitReaderMode();
        } else {
          enterReaderMode();
        }
      });
    }

    // 戻るFAB
    if (backFab) {
      backFab.addEventListener('click', exitReaderMode);
    }

    // Escキーで復帰（app-shortcuts.jsに統合されていない場合のフォールバック）
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.documentElement.getAttribute('data-ui-mode') === 'reader') {
        exitReaderMode();
      }
    });

    // Ctrl+Shift+R ショートカット
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        var mode = document.documentElement.getAttribute('data-ui-mode');
        if (mode === 'reader') {
          exitReaderMode();
        } else {
          enterReaderMode();
        }
      }
    });
  }

  function enterReaderMode() {
    previousMode = document.documentElement.getAttribute('data-ui-mode') || 'normal';

    // ContentGuard: 現在の編集内容を保存してからモード切替
    var G = window.ZWContentGuard;
    if (G && typeof G.ensureSaved === 'function') {
      G.ensureSaved();
    }

    // 読者プレビューHTMLを生成
    buildReaderHTML();

    // モード切替
    document.documentElement.setAttribute('data-ui-mode', 'reader');

    // スクロール位置を復元
    restoreScrollPosition();
  }

  function exitReaderMode() {
    // スクロール位置を保存
    saveScrollPosition();

    var target = previousMode || 'normal';
    document.documentElement.setAttribute('data-ui-mode', target);
    previousMode = null;

    // プログレスバーをリセット
    if (progressFill) progressFill.style.width = '0%';

    // タイピング演出をクリーンアップ
    if (typingCleanup) {
      typingCleanup();
      typingCleanup = null;
    }

    // スクロール連動演出をクリーンアップ
    if (scrollTriggerCleanup) {
      scrollTriggerCleanup();
      scrollTriggerCleanup = null;
    }

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

    // HTML変換パイプライン (editor-preview.js と同等の装飾処理を適用)
    var html = fullHtml;

    // 1. テキストボックス + semantic preset 投影
    if (html && window.TextboxRichTextBridge && typeof window.TextboxRichTextBridge.projectRenderedHtml === 'function') {
      var rwSettings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
        ? window.ZenWriterStorage.loadSettings() : {};
      html = window.TextboxRichTextBridge.projectRenderedHtml(html, {
        settings: rwSettings,
        target: 'reader'
      });
    }

    // 2. フォント装飾
    var edMgr = window.ZenWriterEditor;
    if (html && edMgr && typeof edMgr.processFontDecorations === 'function') {
      html = edMgr.processFontDecorations(html);
    }

    // 3. テキストアニメーション (wave, sparkle, cosmic, fire, glitch)
    if (html && edMgr && typeof edMgr.processTextAnimations === 'function') {
      html = edMgr.processTextAnimations(html);
    }

    // 4. [[wikilink]] 変換
    if (html) {
      html = html.replace(/\[\[([^\]]+)\]\]/g, function (_match, content) {
        var parts = content.split('|');
        var link = parts[0].trim();
        var display = parts.length > 1 ? parts[1].trim() : link;
        var exists = false;
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.searchStoryWiki === 'function') {
          var results = window.ZenWriterStorage.searchStoryWiki(link);
          exists = results.some(function (e) {
            return (e.title || '').toLowerCase() === link.toLowerCase();
          });
        }
        var brokenClass = exists ? '' : ' is-broken';
        return '<a href="#" class="wikilink' + brokenClass + '" data-wikilink="' + encodeURIComponent(link) + '">' + display + '</a>';
      });
    }

    // 5. 傍点 + ルビ
    if (html) {
      html = html.replace(/\{kenten\|([^{}|]+)\}/g, function (_match, text) {
        return '<span class="kenten">' + text.trim() + '</span>';
      });
      html = html.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, function (_match, kanji, kana) {
        return '<ruby>' + kanji.trim() + '<rt>' + kana.trim() + '</rt></ruby>';
      });
      html = html.replace(/\|([^|《》]+)《([^《》]+)》/g, function (_match, kanji, kana) {
        return '<ruby>' + kanji.trim() + '<rt>' + kana.trim() + '</rt></ruby>';
      });
    }

    // 6. chapter://リンクをアンカーに変換
    if (Nav && typeof Nav.convertForExport === 'function') {
      html = Nav.convertForExport(html);
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
      // chapter-linkのクリックハンドラ（読者プレビュー内でのジャンプ）
      bindReaderLinks(contentDiv);
    }

    // wikilinkクリックハンドラ
    var wikiLinks = contentDiv.querySelectorAll('a.wikilink');
    for (var wl = 0; wl < wikiLinks.length; wl++) {
      wikiLinks[wl].addEventListener('click', function (e) {
        e.preventDefault();
      });
    }

    // タイピング演出をアクティベート (SP-074 Phase 2)
    if (root.TypingEffectController && typeof root.TypingEffectController.activate === 'function') {
      typingCleanup = root.TypingEffectController.activate(contentDiv);
    }

    // スクロール連動演出をアクティベート (SP-074 Phase 4)
    scrollTriggerCleanup = activateScrollTriggers(contentDiv);

    // 先頭にスクロール
    previewEl.scrollTop = 0;
  }

  /**
   * markdown-it 処理前に :::zw-* DSL ブロックをプレースホルダーに退避する。
   * markdown-it は DSL 構文を認識しないため、<p> で囲まれて壊れるのを防ぐ。
   */
  var DSL_BLOCK_RE = /:::zw-(?:textbox|typing|dialog|scroll)(?:\{[^}]*\})?\n[\s\S]*?\n:::/gi;

  function extractDslBlocks(markdown) {
    var placeholders = [];
    var counter = 0;
    var processed = markdown.replace(DSL_BLOCK_RE, function (match) {
      var token = '\n\nZWDSLBLOCK' + counter + '\n\n';
      placeholders.push({ token: 'ZWDSLBLOCK' + counter, dsl: match });
      counter++;
      return token;
    });
    return { markdown: processed, placeholders: placeholders };
  }

  function restoreDslBlocks(html, placeholders) {
    for (var i = 0; i < placeholders.length; i++) {
      var p = placeholders[i];
      // markdown-it が <p>TOKEN</p> で囲んでいる場合
      html = html.replace(new RegExp('<p>' + p.token + '</p>', 'g'), p.dsl);
      // 生テキストとして残っている場合
      html = html.replace(new RegExp(p.token, 'g'), p.dsl);
    }
    return html;
  }

  /**
   * スクロール連動演出 (SP-074 Phase 4) の IntersectionObserver を設定する。
   * @param {Element} container
   * @returns {Function|null} クリーンアップ関数
   */
  function activateScrollTriggers(container) {
    var triggers = container.querySelectorAll('.zw-scroll-trigger');
    if (!triggers.length) return null;

    // IntersectionObserver 非対応環境: 全て即時表示
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(triggers, function (el) {
        el.classList.add('is-visible');
      });
      return null;
    }

    // reduced motion: 即時表示
    var isReduced = document.documentElement.getAttribute('data-reduce-motion') === 'true'
      || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (isReduced) {
      Array.prototype.forEach.call(triggers, function (el) {
        el.classList.add('is-visible');
      });
      return null;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = el.getAttribute('data-delay') || '';
        var delayMs = parseInt(delay, 10) || 0;
        if (delayMs > 0) {
          setTimeout(function () { el.classList.add('is-visible'); }, delayMs);
        } else {
          el.classList.add('is-visible');
        }
        observer.unobserve(el);
      });
    }, { threshold: 0.2, rootMargin: '0px' });

    Array.prototype.forEach.call(triggers, function (el) {
      observer.observe(el);
    });

    return function cleanup() { observer.disconnect(); };
  }

  /**
   * エディタの全コンテンツをHTMLとして取得
   */
  function getFullContentHtml() {
    var Store = window.ZWChapterStore;
    var S = window.ZenWriterStorage;
    var docId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;

    var markdown = '';

    if (docId && Store && typeof Store.isChapterMode === 'function' && Store.isChapterMode(docId)) {
      // chapterMode: visible章のみ結合
      var chapters = Store.getChaptersForDoc(docId) || [];
      var visibleParts = [];
      chapters.forEach(function (ch) {
        if (!ch.visibility || ch.visibility === 'visible') {
          var heading = '## ' + (ch.name || 'Untitled');
          visibleParts.push(heading + '\n\n' + (ch.content || ''));
        }
      });
      markdown = visibleParts.join('\n\n---\n\n');
    } else {
      // 通常モード: エディタ全文
      var G = window.ZWContentGuard;
      if (G && typeof G.getEditorContent === 'function') {
        markdown = G.getEditorContent();
      } else {
        var editor = document.getElementById('editor');
        markdown = editor ? editor.value || '' : '';
      }
    }

    if (!markdown.trim()) return '';

    // DSL ブロックを退避してから markdown-it に渡す
    var extracted = extractDslBlocks(markdown);
    var src = extracted.markdown;
    var html = '';

    // Markdown→HTML変換
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.richTextEditor === 'object' &&
        typeof window.ZenWriterEditor.richTextEditor.markdownToHtml === 'function') {
      html = window.ZenWriterEditor.richTextEditor.markdownToHtml(src);
    } else if (window.markdownit) {
      // フォールバック: markdown-itが利用可能なら直接変換
      var md = window.markdownit({ html: false, linkify: true, breaks: true });
      html = md.render(src);
    } else {
      return '<pre>' + markdown.replace(/</g, '&lt;') + '</pre>';
    }

    // DSL ブロックを復元
    return restoreDslBlocks(html, extracted.placeholders);

    // 最終フォールバック: テキストそのまま
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

    // 目次リンク
    var tocLinks = container.querySelectorAll('.chapter-toc__link');
    tocLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var idx = parseInt(this.dataset.chapterIndex, 10);
        var headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings[idx]) {
          headings[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // 章末ナビのリンク
    var navLinks = container.querySelectorAll('.chapter-nav-bar__link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var idx = parseInt(this.dataset.chapterIndex, 10);
        if (isNaN(idx)) return;
        var headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings[idx]) {
          headings[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    var html = '<!DOCTYPE html>\n<html lang="ja">\n<head>\n'
      + '<meta charset="UTF-8">\n'
      + '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
      + '<title>' + (title || 'Zen Writer Export').replace(/</g, '&lt;') + '</title>\n'
      + '<style>\n'
      + '  body { max-width: 720px; margin: 2rem auto; padding: 0 1rem; '
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
      var scrollTop = previewEl.scrollTop;
      var scrollHeight = previewEl.scrollHeight - previewEl.clientHeight;
      var pct = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
      progressFill.style.width = pct + '%';
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
      sessionStorage.setItem(key, String(previewEl.scrollTop));
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
      var saved = sessionStorage.getItem(key);
      if (saved !== null) {
        var pos = parseInt(saved, 10);
        if (!isNaN(pos) && pos > 0) {
          previewEl.scrollTop = pos;
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
    exportHtml: exportHtml,
    getProgress: function () {
      if (!previewEl) return 0;
      var scrollHeight = previewEl.scrollHeight - previewEl.clientHeight;
      return scrollHeight > 0 ? Math.min(100, (previewEl.scrollTop / scrollHeight) * 100) : 0;
    }
  };
})();
