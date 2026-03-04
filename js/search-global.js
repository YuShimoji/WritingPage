/**
 * search-global.js
 * 複数ドキュメントにまたがる全文検索機能
 */
(function () {
  'use strict';

  /**
   * 正規表現の特殊文字をエスケープ
   * @param {string} str
   * @returns {string}
   */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 検索クエリから正規表現を作成
   * @param {string} query - 検索クエリ
   * @param {Object} options - { caseSensitive, useRegex }
   * @returns {RegExp|null}
   */
  function createSearchRegex(query, options = {}) {
    if (!query) return null;

    const { caseSensitive = false, useRegex = false } = options;
    let flags = 'g';
    if (!caseSensitive) flags += 'i';

    try {
      return useRegex
        ? new RegExp(query, flags)
        : new RegExp(escapeRegex(query), flags);
    } catch (e) {
      console.error('正規表現エラー:', e);
      return null;
    }
  }

  /**
   * ドキュメントのパスを取得（親フォルダを含む）
   * @param {string} docId - ドキュメントID
   * @param {Array} docs - 全ドキュメントリスト
   * @returns {string} パス（例: "フォルダA / フォルダB / ドキュメント名"）
   */
  function getDocumentPath(docId, docs) {
    const doc = docs.find(d => d && d.id === docId);
    if (!doc) return '';

    const parts = [doc.name];
    let current = doc;

    // 親フォルダをたどる
    while (current.parentId) {
      const parent = docs.find(d => d && d.id === current.parentId);
      if (!parent) break;
      parts.unshift(parent.name);
      current = parent;
    }

    return parts.join(' / ');
  }

  /**
   * テキスト内のマッチを検索
   * @param {string} text - 検索対象テキスト
   * @param {RegExp} regex - 検索正規表現
   * @param {number} contextChars - 前後のコンテキスト文字数
   * @returns {Array} マッチ情報の配列
   */
  function findMatches(text, regex, contextChars = 40) {
    if (!text || !regex) return [];

    const lines = text.split('\n');
    const matches = [];

    lines.forEach((line, lineIndex) => {
      const lineMatches = [];
      let match;

      // 正規表現をリセット
      regex.lastIndex = 0;

      while ((match = regex.exec(line)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;

        // コンテキストを含む行テキスト
        const contextStart = Math.max(0, matchStart - contextChars);
        const contextEnd = Math.min(line.length, matchEnd + contextChars);
        let contextText = line.substring(contextStart, contextEnd);

        // 前後が切れている場合は省略記号を追加
        if (contextStart > 0) contextText = '...' + contextText;
        if (contextEnd < line.length) contextText = contextText + '...';

        lineMatches.push({
          lineNumber: lineIndex + 1,
          lineText: line,
          contextText: contextText,
          matchStart: matchStart,
          matchEnd: matchEnd,
          matchText: match[0]
        });
      }

      matches.push(...lineMatches);
    });

    return matches;
  }

  /**
   * 全ドキュメントを検索
   * @param {string} query - 検索クエリ
   * @param {Object} options - 検索オプション
   *   - caseSensitive: 大文字小文字を区別するか（デフォルト: false）
   *   - useRegex: 正規表現として検索するか（デフォルト: false）
   *   - includeContent: コンテンツも結果に含めるか（デフォルト: false）
   *   - contextChars: マッチの前後に表示する文字数（デフォルト: 40）
   *   - maxMatchesPerDoc: ドキュメントあたりの最大マッチ数（デフォルト: 100）
   * @returns {Array} 検索結果の配列
   */
  function searchAllDocuments(query, options = {}) {
    const storage = window.ZenWriterStorage;
    if (!storage || typeof storage.loadDocuments !== 'function') {
      console.error('ZenWriterStorage が利用できません');
      return [];
    }

    const {
      caseSensitive = false,
      useRegex = false,
      includeContent = false,
      contextChars = 40,
      maxMatchesPerDoc = 100
    } = options;

    const regex = createSearchRegex(query, { caseSensitive, useRegex });
    if (!regex) return [];

    const docs = storage.loadDocuments() || [];
    const results = [];

    docs.forEach(doc => {
      // ドキュメントタイプのみ検索（フォルダは除外）
      if (!doc || doc.type !== 'document') return;

      const content = doc.content || '';
      const matches = findMatches(content, regex, contextChars);

      if (matches.length > 0) {
        const result = {
          docId: doc.id,
          docName: doc.name,
          path: getDocumentPath(doc.id, docs),
          matchCount: matches.length,
          matches: matches.slice(0, maxMatchesPerDoc)
        };

        if (includeContent) {
          result.content = content;
        }

        results.push(result);
      }
    });

    // マッチ数の多い順にソート
    results.sort((a, b) => b.matchCount - a.matchCount);

    return results;
  }

  /**
   * 検索履歴を保存
   * @param {string} query - 検索クエリ
   * @param {number} maxHistory - 保持する履歴数（デフォルト: 10）
   */
  function saveSearchHistory(query, maxHistory = 10) {
    if (!query || typeof query !== 'string') return;

    try {
      const key = 'zenWriter_searchHistory';
      const raw = localStorage.getItem(key);
      const history = raw ? JSON.parse(raw) : [];

      // 重複を削除
      const filtered = history.filter(h => h !== query);
      filtered.unshift(query);

      // 最大数に制限
      const trimmed = filtered.slice(0, maxHistory);

      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (e) {
      console.error('検索履歴保存エラー:', e);
    }
  }

  /**
   * 検索履歴を読み込み
   * @returns {Array} 検索履歴の配列
   */
  function loadSearchHistory() {
    try {
      const key = 'zenWriter_searchHistory';
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('検索履歴読込エラー:', e);
      return [];
    }
  }

  /**
   * 検索履歴をクリア
   */
  function clearSearchHistory() {
    try {
      const key = 'zenWriter_searchHistory';
      localStorage.removeItem(key);
    } catch (e) {
      console.error('検索履歴クリアエラー:', e);
    }
  }

  // グローバルに公開
  window.GlobalSearch = {
    searchAllDocuments,
    saveSearchHistory,
    loadSearchHistory,
    clearSearchHistory
  };
})();
