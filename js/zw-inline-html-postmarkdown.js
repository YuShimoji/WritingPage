/**
 * Markdown レンダリング後の HTML に対する共通後処理。
 * editor-preview（MD プレビュー）と reader-preview（読者）で同一の wikilink / 傍点 / ルビ変換を適用し、WP-004 の見え方ギャップを抑える。
 */
(function () {
  'use strict';

  /**
   * @param {string} html
   * @returns {string}
   */
  function applyWikilinks(html) {
    if (!html) return html;

    return html.replace(/\[\[([^\]]+)\]\]/g, function (_match, content) {
      var parts = content.split('|');
      var link = parts[0].trim();
      var display = parts.length > 1 ? parts[1].trim() : link;
      var exists = false;
      if (window.ZenWriterStorage && typeof window.ZenWriterStorage.searchStoryWiki === 'function') {
        var results = window.ZenWriterStorage.searchStoryWiki(link);
        exists = results.some(function (e) {
          return (e.title || '').toLowerCase() === link.toLowerCase();
        });
      } else if (window.ZenWriterStorage && typeof window.ZenWriterStorage.listWikiPages === 'function') {
        var all = window.ZenWriterStorage.listWikiPages();
        exists = all.some(function (p) {
          return (p.title || '') === link;
        });
      }
      var brokenClass = exists ? '' : ' is-broken';
      return '<a href="#" class="wikilink' + brokenClass + '" data-wikilink="' + encodeURIComponent(link) + '">' + display + '</a>';
    });
  }

  /**
   * 傍点 {kenten|..} とルビ {漢字|かな} / |漢字《かな》 を HTML 化する。
   * プレビュー・Reader だけでなく、リッチ編集の Markdown→HTML（editor-wysiwyg.js）も同じ規則を使う。
   * Wiki リンクは含まない（編集面では [[...]] を文字のまま編集するため）。
   * @param {string} html
   * @returns {string}
   */
  function applyKentenRuby(html) {
    if (!html) return html;

    html = html.replace(/\{kenten\|([^{}|]+)\}/g, function (_match, text) {
      return '<span class="kenten">' + text.trim() + '</span>';
    });
    html = html.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, function (_match, kanji, kana) {
      return '<ruby>' + kanji.trim() + '<rt>' + kana.trim() + '</rt></ruby>';
    });
    html = html.replace(/\|([^|《》]+)《([^《》]+)》/g, function (_match, kanji, kana) {
      return '<ruby>' + kanji.trim() + '<rt>' + kana.trim() + '</rt></ruby>';
    });

    return html;
  }

  function applyWikilinksKentenRuby(html) {
    return applyKentenRuby(applyWikilinks(html));
  }

  window.ZWInlineHtmlPostMarkdown = {
    applyWikilinks: applyWikilinks,
    applyKentenRuby: applyKentenRuby,
    applyWikilinksKentenRuby: applyWikilinksKentenRuby
  };
})();
