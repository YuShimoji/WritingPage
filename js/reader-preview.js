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

  function init() {
    previewEl = document.getElementById('reader-preview');
    innerEl = document.getElementById('reader-preview-inner');
    backFab = document.getElementById('reader-back-fab');
    toggleBtn = document.getElementById('toggle-reader-preview');

    if (!previewEl || !innerEl) return;

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
  }

  function exitReaderMode() {
    var target = previousMode || 'normal';
    document.documentElement.setAttribute('data-ui-mode', target);
    previousMode = null;

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

    // HTML変換パイプライン
    var html = fullHtml;

    // chapter://リンクをアンカーに変換
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
      // chapter-linkのクリックハンドラ（読者プレビュー内でのジャンプ）
      bindReaderLinks(contentDiv);
    }

    // 先頭にスクロール
    previewEl.scrollTop = 0;
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

    // Markdown→HTML変換
    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.richTextEditor === 'object' &&
        typeof window.ZenWriterEditor.richTextEditor.markdownToHtml === 'function') {
      return window.ZenWriterEditor.richTextEditor.markdownToHtml(markdown);
    }

    // フォールバック: markdown-itが利用可能なら直接変換
    if (window.markdownit) {
      var md = window.markdownit({ html: false, linkify: true, breaks: true });
      return md.render(markdown);
    }

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
    exportHtml: exportHtml
  };
})();
