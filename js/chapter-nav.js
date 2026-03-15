/**
 * chapter-nav.js — SP-072 Phase 1 章間ナビゲーション
 *
 * 1. 章末ナビバー: プレビュー内の各章末尾に「前へ / 目次 / 次へ」を自動挿入
 * 2. chapter:// リンク: プレビュー内の [text](chapter://id) をクリック可能リンクに変換
 */
(function () {
  'use strict';

  var SETTING_KEY = 'chapterNav';

  // ---- Settings ----

  function loadSettings() {
    var s = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
      ? window.ZenWriterStorage.loadSettings()
      : {};
    return s[SETTING_KEY] || { enabled: false, style: 'minimal' };
  }

  function saveSettings(patch) {
    if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.saveSettings !== 'function') return;
    var s = window.ZenWriterStorage.loadSettings ? window.ZenWriterStorage.loadSettings() : {};
    s[SETTING_KEY] = Object.assign({}, s[SETTING_KEY] || {}, patch);
    window.ZenWriterStorage.saveSettings(s);
  }

  // ---- Chapter resolution ----

  function getChapters() {
    if (!window.ZWChapterModel || typeof window.ZWChapterModel.parseChapters !== 'function') return [];
    var text = '';
    if (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadContent === 'function') {
      text = window.ZenWriterStorage.loadContent() || '';
    }
    return window.ZWChapterModel.parseChapters(text);
  }

  function findChapterByTitle(chapters, title) {
    if (!title) return null;
    var slug = slugify(title);
    for (var i = 0; i < chapters.length; i++) {
      if (slugify(chapters[i].title) === slug) return { chapter: chapters[i], index: i };
    }
    return null;
  }

  function slugify(str) {
    return (str || '').toLowerCase().trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\u3000-\u9fff\uf900-\ufaff\u4e00-\u9faf-]/g, '');
  }

  // ---- Nav bar injection (preview) ----

  /**
   * プレビューパネル内のH1-H6要素を章境界として検出し、
   * 各章の末尾にナビバーを注入する。
   */
  function injectNavBars(container) {
    var settings = loadSettings();
    if (!settings.enabled) return;

    // 既存のナビバーを除去
    var existing = container.querySelectorAll('.chapter-nav-bar');
    for (var i = 0; i < existing.length; i++) {
      existing[i].parentNode.removeChild(existing[i]);
    }

    var chapters = getChapters();
    if (chapters.length < 2) return; // 1章以下ならナビ不要

    // プレビュー内のH1-H6を収集
    var headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;

    // 各見出し = 章の開始。前の章の末尾(=次の見出しの直前)にナビバーを挿入
    for (var h = 0; h < headings.length; h++) {
      var chIdx = h;
      if (chIdx >= chapters.length) break;

      // この章の最後の要素を探す（次の見出しの直前、または末尾）
      var insertBefore = headings[h + 1] || null;

      var nav = createNavBar(chapters, chIdx);
      if (nav) {
        if (insertBefore) {
          insertBefore.parentNode.insertBefore(nav, insertBefore);
        } else {
          container.appendChild(nav);
        }
      }
    }
  }

  function createNavBar(chapters, currentIndex) {
    var nav = document.createElement('nav');
    nav.className = 'chapter-nav-bar';
    nav.setAttribute('aria-label', '章間ナビゲーション');

    var prevCh = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    var nextCh = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

    // 前の章
    var prevBtn = document.createElement('a');
    prevBtn.className = 'chapter-nav-bar__link chapter-nav-bar__prev';
    if (prevCh) {
      prevBtn.textContent = '\u2190 ' + prevCh.title;
      prevBtn.href = '#';
      prevBtn.dataset.chapterIndex = currentIndex - 1;
      prevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        navigateToChapter(parseInt(this.dataset.chapterIndex, 10));
      });
    } else {
      prevBtn.textContent = '';
      prevBtn.className += ' chapter-nav-bar__link--disabled';
    }

    // 目次 (先頭章へ)
    var tocBtn = document.createElement('a');
    tocBtn.className = 'chapter-nav-bar__link chapter-nav-bar__toc';
    tocBtn.textContent = '\u76ee\u6b21';
    tocBtn.href = '#';
    tocBtn.addEventListener('click', function (e) {
      e.preventDefault();
      navigateToChapter(0);
    });

    // 次の章
    var nextBtn = document.createElement('a');
    nextBtn.className = 'chapter-nav-bar__link chapter-nav-bar__next';
    if (nextCh) {
      nextBtn.textContent = nextCh.title + ' \u2192';
      nextBtn.href = '#';
      nextBtn.dataset.chapterIndex = currentIndex + 1;
      nextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        navigateToChapter(parseInt(this.dataset.chapterIndex, 10));
      });
    } else {
      nextBtn.textContent = '';
      nextBtn.className += ' chapter-nav-bar__link--disabled';
    }

    nav.appendChild(prevBtn);
    nav.appendChild(tocBtn);
    nav.appendChild(nextBtn);
    return nav;
  }

  function navigateToChapter(index) {
    // ChapterList のナビゲーション機能を利用
    if (window.ZWChapterList && typeof window.ZWChapterList.navigateTo === 'function') {
      window.ZWChapterList.navigateTo(index);
      return;
    }
    // フォールバック: プレビュー内のH要素にスクロール
    var container = document.getElementById('markdown-preview') || document.querySelector('.markdown-preview');
    if (!container) return;
    var headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings[index]) {
      headings[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ---- chapter:// link conversion ----

  /**
   * HTML内の chapter:// リンクを章ナビゲーション用リンクに変換する。
   * editor-preview.js の HTML 変換パイプラインから呼ばれる。
   *
   * @param {string} html
   * @returns {string}
   */
  function convertChapterLinks(html) {
    if (!html) return html;
    // Markdown-it が生成する <a href="chapter://..."> を変換
    return html.replace(
      /<a\s+href="chapter:\/\/([^"]+)"([^>]*)>(.*?)<\/a>/gi,
      function (_match, chapterId, attrs, text) {
        var decoded = decodeURIComponent(chapterId);
        return '<a href="#" class="chapter-link" data-chapter-target="' +
          encodeURIComponent(decoded) + '"' + attrs + '>' + text + '</a>';
      }
    );
  }

  /**
   * プレビューパネル内の .chapter-link にクリックハンドラを設定する。
   */
  function bindChapterLinks(container) {
    var links = container.querySelectorAll('.chapter-link');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.preventDefault();
        var target = decodeURIComponent(this.dataset.chapterTarget || '');
        resolveAndNavigate(target);
      });
    }
  }

  function resolveAndNavigate(target) {
    var chapters = getChapters();
    if (!chapters.length) return;

    // タイトルマッチ
    var found = findChapterByTitle(chapters, target);
    if (found) {
      navigateToChapter(found.index);
      return;
    }

    // インデックスマッチ (ch-0 形式)
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].id === target || chapters[i].id === 'ch-' + target) {
        navigateToChapter(i);
        return;
      }
    }
  }

  // ---- Preview integration hook ----

  /**
   * プレビュー更新後に呼ばれるフック。
   * ナビバー注入 + chapter:// リンクバインドを行う。
   */
  function onPreviewUpdated(container) {
    if (!container) return;
    injectNavBars(container);
    bindChapterLinks(container);
  }

  // ---- Public API ----

  window.ZWChapterNav = {
    onPreviewUpdated: onPreviewUpdated,
    convertChapterLinks: convertChapterLinks,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    injectNavBars: injectNavBars
  };
})();
