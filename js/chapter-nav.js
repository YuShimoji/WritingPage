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
    // chapterMode: Store から visibility 付きデータを取得
    var Store = window.ZWChapterStore;
    var S = window.ZenWriterStorage;
    var docId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
    if (docId && Store && Store.isChapterMode(docId)) {
      var storeChapters = Store.getChaptersForDoc(docId);
      return storeChapters.map(function (sc, _i) {
        return {
          id: sc.id,
          title: sc.name || '',
          level: sc.level || 2,
          visibility: sc.visibility || 'visible',
          startOffset: 0,
          endOffset: 0
        };
      });
    }
    // Legacy: heading ベースのパーサー
    if (!window.ZWChapterModel || typeof window.ZWChapterModel.parseChapters !== 'function') return [];
    var text = '';
    if (S && typeof S.loadContent === 'function') {
      text = S.loadContent() || '';
    }
    return window.ZWChapterModel.parseChapters(text);
  }

  /** visibility=visible の章のみ返す */
  function getVisibleChapters(chapters) {
    return chapters.filter(function (ch) {
      return !ch.visibility || ch.visibility === 'visible';
    });
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

  // ---- Table of Contents injection (preview) ----

  /**
   * プレビューパネルの先頭に目次を自動挿入する (SP-071)。
   * visibleな章のみ表示。各項目はクリックで章にジャンプ。
   */
  function injectToc(container) {
    var settings = loadSettings();
    if (!settings.enabled) return;

    // 既存のToCを除去
    var existing = container.querySelector('.chapter-toc');
    if (existing) existing.remove();

    var allChapters = getChapters();
    var visibleChapters = getVisibleChapters(allChapters);
    if (visibleChapters.length < 2) return;

    var toc = document.createElement('nav');
    toc.className = 'chapter-toc';
    toc.setAttribute('aria-label', '\u76ee\u6b21');

    var tocTitle = document.createElement('h2');
    tocTitle.className = 'chapter-toc__title';
    tocTitle.textContent = '\u76ee\u6b21';
    toc.appendChild(tocTitle);

    var list = document.createElement('ol');
    list.className = 'chapter-toc__list';

    visibleChapters.forEach(function (ch, visIdx) {
      var allIdx = allChapters.indexOf(ch);
      var li = document.createElement('li');
      li.className = 'chapter-toc__item';

      var link = document.createElement('a');
      link.className = 'chapter-toc__link';
      link.href = '#';
      link.textContent = ch.title || '(untitled)';
      link.dataset.chapterIndex = allIdx >= 0 ? allIdx : visIdx;
      link.addEventListener('click', function (e) {
        e.preventDefault();
        navigateToChapter(parseInt(this.dataset.chapterIndex, 10));
      });

      li.appendChild(link);
      list.appendChild(li);
    });

    toc.appendChild(list);

    // プレビュー先頭に挿入
    if (container.firstChild) {
      container.insertBefore(toc, container.firstChild);
    } else {
      container.appendChild(toc);
    }
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

    var allChapters = getChapters();
    var visibleChapters = getVisibleChapters(allChapters);
    if (visibleChapters.length < 2) return; // 1章以下ならナビ不要

    // プレビュー内のH1-H6を収集
    var headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;

    // 各見出し = 章の開始。前の章の末尾(=次の見出しの直前)にナビバーを挿入
    for (var h = 0; h < headings.length; h++) {
      var chIdx = h;
      if (chIdx >= allChapters.length) break;

      // draft/hidden の章にはナビバーを挿入しない
      var ch = allChapters[chIdx];
      if (ch.visibility && ch.visibility !== 'visible') continue;

      // この章の最後の要素を探す（次の見出しの直前、または末尾）
      var insertBefore = headings[h + 1] || null;

      var nav = createNavBar(visibleChapters, chIdx, allChapters);
      if (nav) {
        if (insertBefore) {
          insertBefore.parentNode.insertBefore(nav, insertBefore);
        } else {
          container.appendChild(nav);
        }
      }
    }
  }

  function createNavBar(visibleChapters, currentAllIndex, allChapters) {
    // currentAllIndex は allChapters 内のインデックス。visibleChapters 内の位置を求める
    var currentCh = allChapters[currentAllIndex];
    var visIdx = -1;
    for (var v = 0; v < visibleChapters.length; v++) {
      if (visibleChapters[v].title === currentCh.title && visibleChapters[v].id === currentCh.id) {
        visIdx = v;
        break;
      }
    }
    if (visIdx < 0) return null; // この章は visible でないためナビバーなし

    var nav = document.createElement('nav');
    nav.className = 'chapter-nav-bar';
    nav.setAttribute('aria-label', '章間ナビゲーション');

    var prevCh = visIdx > 0 ? visibleChapters[visIdx - 1] : null;
    var nextCh = visIdx < visibleChapters.length - 1 ? visibleChapters[visIdx + 1] : null;

    // 前の章 — allChapters 内のインデックスを逆引き
    var prevBtn = document.createElement('a');
    prevBtn.className = 'chapter-nav-bar__link chapter-nav-bar__prev';
    if (prevCh) {
      var prevAllIdx = allChapters.indexOf(prevCh);
      prevBtn.textContent = '\u2190 ' + prevCh.title;
      prevBtn.href = '#';
      prevBtn.dataset.chapterIndex = prevAllIdx >= 0 ? prevAllIdx : visIdx - 1;
      prevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        navigateToChapter(parseInt(this.dataset.chapterIndex, 10));
      });
    } else {
      prevBtn.textContent = '';
      prevBtn.className += ' chapter-nav-bar__link--disabled';
    }

    // 目次 (ToC要素へスクロール、なければ先頭章へ)
    var tocBtn = document.createElement('a');
    tocBtn.className = 'chapter-nav-bar__link chapter-nav-bar__toc';
    tocBtn.textContent = '\u76ee\u6b21';
    tocBtn.href = '#';
    tocBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var tocEl = document.querySelector('.chapter-toc');
      if (tocEl) {
        tocEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigateToChapter(0);
      }
    });

    // 次の章
    var nextBtn = document.createElement('a');
    nextBtn.className = 'chapter-nav-bar__link chapter-nav-bar__next';
    if (nextCh) {
      var nextAllIdx = allChapters.indexOf(nextCh);
      nextBtn.textContent = nextCh.title + ' \u2192';
      nextBtn.href = '#';
      nextBtn.dataset.chapterIndex = nextAllIdx >= 0 ? nextAllIdx : visIdx + 1;
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
  var VALID_LINK_STYLES = ['choice', 'emphasis', 'card'];

  function parseLinkStyle(attrs) {
    if (!attrs) return '';
    var m = attrs.match(/data-style="([^"]+)"/i);
    if (m && VALID_LINK_STYLES.indexOf(m[1]) !== -1) return m[1];
    return '';
  }

  function parseStyleFromFragment(chapterId) {
    var hashIdx = chapterId.indexOf('#style=');
    if (hashIdx === -1) return { id: chapterId, style: '' };
    var style = chapterId.substring(hashIdx + 7);
    var id = chapterId.substring(0, hashIdx);
    if (VALID_LINK_STYLES.indexOf(style) === -1) return { id: id, style: '' };
    return { id: id, style: style };
  }

  function convertChapterLinks(html) {
    if (!html) return html;
    var chapters = getChapters();
    // Markdown-it が生成する <a href="chapter://..."> を変換
    var converted = html.replace(
      /<a\s+href="chapter:\/\/([^"]+)"([^>]*)>(.*?)<\/a>/gi,
      function (_match, chapterId, attrs, text) {
        var decoded = decodeURIComponent(chapterId);
        // #style=xxx フラグメントからスタイル抽出
        var parsed = parseStyleFromFragment(decoded);
        decoded = parsed.id;
        var isBroken = !findChapterByTitle(chapters, decoded) && !findChapterById(chapters, decoded);
        // data-style属性 or URLフラグメントのどちらからでもスタイル取得
        var style = parsed.style || parseLinkStyle(attrs);
        var cls = 'chapter-link';
        if (style) cls += ' chapter-link--' + style;
        if (isBroken) cls += ' chapter-link--broken';
        var dataStyle = style ? ' data-style="' + style + '"' : '';
        var title = isBroken ? ' title="\u30ea\u30f3\u30af\u5148\u306e\u7ae0\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093: ' + decoded + '"' : '';
        return '<a href="#" class="' + cls + '" data-chapter-target="' +
          encodeURIComponent(decoded) + '"' + dataStyle + title + '>' + text + '</a>';
      }
    );
    return converted;
  }

  function findChapterById(chapters, id) {
    if (!id) return null;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].id === id || chapters[i].id === 'ch-' + id) return { chapter: chapters[i], index: i };
    }
    return null;
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

  // ---- Auto-grouping of consecutive choice links ----

  /**
   * 連続する .chapter-link 要素を .chapter-choices ラッパーで自動グループ化する。
   * 間に他の要素（テキストノード含む）が挟まっている場合はグループを分割する。
   */
  function autoGroupChoices(container) {
    if (!container) return;
    var links = container.querySelectorAll('.chapter-link');
    if (links.length < 2) return;

    var groups = [];
    var currentGroup = [];

    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      // 直前のグループの最後のリンクと同じ親で連続しているか判定
      if (currentGroup.length === 0) {
        currentGroup.push(link);
      } else {
        var prev = currentGroup[currentGroup.length - 1];
        if (areConsecutiveBlockLinks(prev, link)) {
          currentGroup.push(link);
        } else {
          if (currentGroup.length >= 2) groups.push(currentGroup);
          currentGroup = [link];
        }
      }
    }
    if (currentGroup.length >= 2) groups.push(currentGroup);

    // 各グループを .chapter-choices で囲む
    groups.forEach(function (group) {
      // 既にグループ化済みならスキップ
      if (group[0].parentNode && group[0].parentNode.classList &&
          group[0].parentNode.classList.contains('chapter-choices')) return;

      var wrapper = document.createElement('div');
      wrapper.className = 'chapter-choices';
      group[0].parentNode.insertBefore(wrapper, group[0]);
      group.forEach(function (link) {
        wrapper.appendChild(link);
      });
    });
  }

  /**
   * 2つのリンクがブロック要素として連続しているか判定。
   * 同じ親の中で、間に意味のある要素がなければ連続とみなす。
   */
  function areConsecutiveBlockLinks(a, b) {
    if (a.parentNode !== b.parentNode) return false;
    var node = a.nextSibling;
    while (node && node !== b) {
      // 空白テキストノードはスキップ
      if (node.nodeType === 3 && node.textContent.trim() === '') {
        node = node.nextSibling;
        continue;
      }
      // <br> もスキップ
      if (node.nodeType === 1 && node.nodeName === 'BR') {
        node = node.nextSibling;
        continue;
      }
      return false;
    }
    return node === b;
  }

  // ---- Preview integration hook ----

  /**
   * プレビュー更新後に呼ばれるフック。
   * ナビバー注入 + chapter:// リンクバインド + 選択肢自動グループ化。
   */
  function onPreviewUpdated(container) {
    if (!container) return;
    injectToc(container);
    injectNavBars(container);
    bindChapterLinks(container);
    autoGroupChoices(container);
  }

  // ---- Export conversion ----

  /**
   * HTML出力用: chapter:// リンクを #anchor リンクに変換する。
   * 印刷/エクスポート時に呼ぶ。
   * @param {string} html
   * @returns {string}
   */
  function convertForExport(html) {
    if (!html) return html;
    return html.replace(
      /<a[^>]*class="chapter-link"[^>]*data-chapter-target="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      function (_match, target, text) {
        var decoded = decodeURIComponent(target);
        var slug = slugify(decoded);
        return '<a href="#' + slug + '">' + text + '</a>';
      }
    );
  }

  // ---- Public API ----

  /**
   * 目次をプレーンテキストとして生成（クリップボードコピー用）
   */
  function generateTocText() {
    var allChapters = getChapters();
    var visible = getVisibleChapters(allChapters);
    if (visible.length === 0) return '';
    var lines = ['\u76ee\u6b21', ''];
    visible.forEach(function (ch, i) {
      lines.push((i + 1) + '. ' + (ch.title || '(untitled)'));
    });
    return lines.join('\n');
  }

  window.ZWChapterNav = {
    onPreviewUpdated: onPreviewUpdated,
    convertChapterLinks: convertChapterLinks,
    convertForExport: convertForExport,
    autoGroupChoices: autoGroupChoices,
    getVisibleChapters: function () { return getVisibleChapters(getChapters()); },
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    injectNavBars: injectNavBars,
    injectToc: injectToc,
    generateTocText: generateTocText
  };
})();
