/**
 * Smart Folders Manager: スマートフォルダ機能
 * 
 * 責務:
 * - 保存された検索条件の管理
 * - 仮想フォルダ（動的フィルタリング）の管理
 * - 検索条件に基づくページの動的表示
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'zenWriter_smart_folders';

  /**
   * スマートフォルダのデフォルト定義
   */
  var DEFAULT_SMART_FOLDERS = [
    {
      id: 'all',
      name: 'すべて',
      type: 'all',
      query: null
    },
    {
      id: 'untagged',
      name: 'タグなし',
      type: 'query',
      query: { tags: [], matchAll: false, hasTags: false }
    }
  ];

  /**
   * スマートフォルダを読み込み
   * @returns {Array<Object>} スマートフォルダの配列
   */
  function loadSmartFolders() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SMART_FOLDERS.slice();
      
      var saved = JSON.parse(raw);
      if (!Array.isArray(saved)) return DEFAULT_SMART_FOLDERS.slice();
      
      // デフォルトとマージ（デフォルトは常に含める）
      var merged = DEFAULT_SMART_FOLDERS.slice();
      saved.forEach(function (folder) {
        if (folder && folder.id && folder.id !== 'all' && folder.id !== 'untagged') {
          merged.push(folder);
        }
      });
      
      return merged;
    } catch (e) {
      console.error('スマートフォルダ読込エラー:', e);
      return DEFAULT_SMART_FOLDERS.slice();
    }
  }

  /**
   * スマートフォルダを保存
   * @param {Array<Object>} folders - スマートフォルダの配列
   * @returns {boolean} 保存成功かどうか
   */
  function saveSmartFolders(folders) {
    try {
      // デフォルトフォルダを除外して保存
      var toSave = folders.filter(function (f) {
        return f && f.id && f.id !== 'all' && f.id !== 'untagged';
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      return true;
    } catch (e) {
      console.error('スマートフォルダ保存エラー:', e);
      return false;
    }
  }

  /**
   * 新しいスマートフォルダを作成
   * @param {Object} folderData - フォルダデータ {name, type, query}
   * @returns {Object} 作成されたフォルダ
   */
  function createSmartFolder(folderData) {
    var folders = loadSmartFolders();
    var folder = {
      id: 'smart_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name: String(folderData.name || '新規フォルダ'),
      type: String(folderData.type || 'query'),
      query: folderData.query || null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    folders.push(folder);
    saveSmartFolders(folders);
    return folder;
  }

  /**
   * スマートフォルダを更新
   * @param {string} folderId - フォルダID
   * @param {Object} updates - 更新データ
   * @returns {boolean} 更新成功かどうか
   */
  function updateSmartFolder(folderId, updates) {
    var folders = loadSmartFolders();
    var index = folders.findIndex(function (f) { return f && f.id === folderId; });
    if (index < 0) return false;
    
    folders[index] = Object.assign({}, folders[index], updates, {
      updatedAt: Date.now()
    });
    return saveSmartFolders(folders);
  }

  /**
   * スマートフォルダを削除
   * @param {string} folderId - フォルダID
   * @returns {boolean} 削除成功かどうか
   */
  function deleteSmartFolder(folderId) {
    if (folderId === 'all' || folderId === 'untagged') return false; // デフォルトは削除不可
    
    var folders = loadSmartFolders();
    var filtered = folders.filter(function (f) { return f && f.id !== folderId; });
    if (filtered.length === folders.length) return false;
    return saveSmartFolders(filtered);
  }

  /**
   * スマートフォルダに一致するページを取得
   * @param {string} folderId - フォルダID
   * @returns {Array<Object>} 一致するページの配列
   */
  function getPagesForSmartFolder(folderId) {
    try {
      var STORAGE = window.ZenWriterStorage;
      var Tags = window.ZenWriterTags;
      
      if (!STORAGE || typeof STORAGE.listWikiPages !== 'function') return [];
      if (!Tags || typeof Tags.getPagesByTags !== 'function') return [];
      
      var folders = loadSmartFolders();
      var folder = folders.find(function (f) { return f && f.id === folderId; });
      if (!folder) return [];
      
      var allPages = STORAGE.listWikiPages();
      
      if (folder.type === 'all') {
        return allPages;
      } else if (folder.type === 'query') {
        var query = folder.query || {};
        
        // タグによるフィルタリング
        if (query.hasTags === false) {
          // タグなし
          return allPages.filter(function (p) {
            return !p.tags || !Array.isArray(p.tags) || p.tags.length === 0;
          });
        } else if (query.tags && Array.isArray(query.tags) && query.tags.length > 0) {
          // 指定されたタグでフィルタリング
          return Tags.getPagesByTags(query.tags, query.matchAll || false);
        }
        
        // テキスト検索
        if (query.text && typeof query.text === 'string' && query.text.trim()) {
          var lowerQuery = query.text.trim().toLowerCase();
          return allPages.filter(function (p) {
            var title = String(p.title || '').toLowerCase();
            var content = String(p.content || '').toLowerCase();
            var tags = Array.isArray(p.tags) ? p.tags.join(',').toLowerCase() : '';
            return title.indexOf(lowerQuery) >= 0 || 
                   content.indexOf(lowerQuery) >= 0 || 
                   tags.indexOf(lowerQuery) >= 0;
          });
        }
      }
      
      return allPages;
    } catch (e) {
      console.error('スマートフォルダページ取得エラー:', e);
      return [];
    }
  }

  /**
   * 保存された検索を作成
   * @param {string} name - 検索名
   * @param {Object} query - 検索条件
   * @returns {Object} 作成されたスマートフォルダ
   */
  function createSavedSearch(name, query) {
    return createSmartFolder({
      name: name,
      type: 'query',
      query: query
    });
  }

  // グローバルに公開
  if (typeof window !== 'undefined') {
    window.ZenWriterSmartFolders = {
      loadSmartFolders: loadSmartFolders,
      saveSmartFolders: saveSmartFolders,
      createSmartFolder: createSmartFolder,
      updateSmartFolder: updateSmartFolder,
      deleteSmartFolder: deleteSmartFolder,
      getPagesForSmartFolder: getPagesForSmartFolder,
      createSavedSearch: createSavedSearch
    };
  }
})();
