/**
 * Tags Manager: タグ管理機能
 * 
 * 責務:
 * - タグの一覧取得・集計
 * - タグによるフィルタリング
 * - タグの使用状況の管理
 */
(function () {
  'use strict';

  var STORAGE_KEYS = {
    TAGS: 'zenWriter_tags',
    SMART_FOLDERS: 'zenWriter_smart_folders'
  };

  /**
   * すべてのWikiページからタグを収集
   * @returns {Array<string>} ユニークなタグの配列
   */
  function getAllTags() {
    try {
      var STORAGE = window.ZenWriterStorage;
      if (!STORAGE || typeof STORAGE.listWikiPages !== 'function') return [];
      
      var pages = STORAGE.listWikiPages();
      var tagSet = new Set();
      
      pages.forEach(function (page) {
        if (page && Array.isArray(page.tags)) {
          page.tags.forEach(function (tag) {
            if (tag && typeof tag === 'string' && tag.trim()) {
              tagSet.add(tag.trim());
            }
          });
        }
      });
      
      return Array.from(tagSet).sort();
    } catch (e) {
      console.error('タグ取得エラー:', e);
      return [];
    }
  }

  /**
   * タグごとのページ数を取得
   * @returns {Object<string, number>} タグ名をキー、ページ数を値とするオブジェクト
   */
  function getTagCounts() {
    try {
      var STORAGE = window.ZenWriterStorage;
      if (!STORAGE || typeof STORAGE.listWikiPages !== 'function') return {};
      
      var pages = STORAGE.listWikiPages();
      var counts = {};
      
      pages.forEach(function (page) {
        if (page && Array.isArray(page.tags)) {
          page.tags.forEach(function (tag) {
            if (tag && typeof tag === 'string' && tag.trim()) {
              var key = tag.trim();
              counts[key] = (counts[key] || 0) + 1;
            }
          });
        }
      });
      
      return counts;
    } catch (e) {
      console.error('タグカウント取得エラー:', e);
      return {};
    }
  }

  /**
   * 指定されたタグを持つページを取得
   * @param {string|Array<string>} tags - タグ（単一または配列）
   * @param {boolean} matchAll - trueの場合、すべてのタグが一致する必要がある
   * @returns {Array<Object>} 一致するページの配列
   */
  function getPagesByTags(tags, matchAll) {
    try {
      var STORAGE = window.ZenWriterStorage;
      if (!STORAGE || typeof STORAGE.listWikiPages !== 'function') return [];
      
      var pages = STORAGE.listWikiPages();
      var tagArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);
      
      if (!tagArray.length) return pages;
      
      return pages.filter(function (page) {
        if (!page || !Array.isArray(page.tags)) return false;
        
        var pageTags = page.tags.map(function (t) { return String(t || '').trim(); }).filter(Boolean);
        
        if (matchAll) {
          // すべてのタグが一致する必要がある
          return tagArray.every(function (tag) {
            return pageTags.indexOf(String(tag).trim()) >= 0;
          });
        } else {
          // いずれかのタグが一致すればよい
          return tagArray.some(function (tag) {
            return pageTags.indexOf(String(tag).trim()) >= 0;
          });
        }
      });
    } catch (e) {
      console.error('タグによるページ取得エラー:', e);
      return [];
    }
  }

  /**
   * タグを正規化（空白除去、小文字化など）
   * @param {string} tag - タグ文字列
   * @returns {string} 正規化されたタグ
   */
  function normalizeTag(tag) {
    if (typeof tag !== 'string') return '';
    return tag.trim();
  }

  /**
   * タグ文字列を配列に変換
   * @param {string} tagString - カンマ区切りのタグ文字列
   * @returns {Array<string>} タグの配列
   */
  function parseTags(tagString) {
    if (typeof tagString !== 'string') return [];
    return tagString
      .split(',')
      .map(function (s) { return normalizeTag(s); })
      .filter(Boolean);
  }

  /**
   * タグ配列を文字列に変換
   * @param {Array<string>} tags - タグの配列
   * @returns {string} カンマ区切りのタグ文字列
   */
  function joinTags(tags) {
    if (!Array.isArray(tags)) return '';
    return tags.map(function (t) { return String(t || '').trim(); }).filter(Boolean).join(', ');
  }

  // グローバルに公開
  if (typeof window !== 'undefined') {
    window.ZenWriterTags = {
      getAllTags: getAllTags,
      getTagCounts: getTagCounts,
      getPagesByTags: getPagesByTags,
      normalizeTag: normalizeTag,
      parseTags: parseTags,
      joinTags: joinTags
    };
  }
})();
