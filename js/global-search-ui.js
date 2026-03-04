/**
 * global-search-ui.js
 * 全文検索パネルのUI管理
 */
(function () {
  'use strict';

  const PANEL_ID = 'global-search-panel';
  const INPUT_ID = 'global-search-input';
  const RESULTS_ID = 'global-search-results';
  const STATUS_ID = 'global-search-status';
  const HISTORY_ID = 'global-search-history';
  const CASE_ID = 'global-search-case';
  const REGEX_ID = 'global-search-regex';

  /**
   * パネルを表示
   */
  function showPanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    panel.style.display = 'block';
    const input = document.getElementById(INPUT_ID);
    if (input) {
      input.focus();
    }

    // 履歴を更新
    updateHistoryDropdown();
  }

  /**
   * パネルを非表示
   */
  function hidePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.style.display = 'none';
    }
  }

  /**
   * 検索履歴ドロップダウンを更新
   */
  function updateHistoryDropdown() {
    const select = document.getElementById(HISTORY_ID);
    if (!select || !window.GlobalSearch) return;

    const history = window.GlobalSearch.loadSearchHistory();

    // 既存のオプションをクリア（最初のプレースホルダーは残す）
    while (select.options.length > 1) {
      select.remove(1);
    }

    // 履歴を追加
    history.forEach(query => {
      const option = document.createElement('option');
      option.value = query;
      option.textContent = query;
      select.appendChild(option);
    });
  }

  /**
   * 検索を実行
   */
  function executeSearch() {
    const input = document.getElementById(INPUT_ID);
    const query = input?.value?.trim();

    if (!query) {
      showStatus('検索クエリを入力してください', 'info');
      return;
    }

    const caseSensitive = document.getElementById(CASE_ID)?.checked || false;
    const useRegex = document.getElementById(REGEX_ID)?.checked || false;

    showStatus('検索中...', 'info');

    try {
      const results = window.GlobalSearch.searchAllDocuments(query, {
        caseSensitive,
        useRegex,
        contextChars: 50,
        maxMatchesPerDoc: 50
      });

      // 検索履歴に保存
      window.GlobalSearch.saveSearchHistory(query);
      updateHistoryDropdown();

      // 結果を表示
      displayResults(results, query);

      const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0);
      showStatus(
        `${results.length} 件のドキュメントで ${totalMatches} 件のマッチが見つかりました`,
        'success'
      );
    } catch (e) {
      console.error('検索エラー:', e);
      showStatus('検索中にエラーが発生しました: ' + e.message, 'error');
    }
  }

  /**
   * ステータスメッセージを表示
   * @param {string} message - メッセージ
   * @param {string} type - 'info' | 'success' | 'error'
   */
  function showStatus(message, type = 'info') {
    const status = document.getElementById(STATUS_ID);
    if (!status) return;

    status.textContent = message;
    status.style.color = type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#95a5a6';
  }

  /**
   * 検索結果を表示
   * @param {Array} results - 検索結果の配列
   * @param {string} query - 検索クエリ
   */
  function displayResults(results, query) {
    const container = document.getElementById(RESULTS_ID);
    if (!container) return;

    // 既存の結果をクリア
    container.innerHTML = '';

    if (results.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'global-search-no-results';
      noResults.textContent = '一致するドキュメントが見つかりませんでした';
      noResults.style.cssText = 'padding: 1rem; text-align: center; color: #95a5a6; font-style: italic;';
      container.appendChild(noResults);
      return;
    }

    // 結果ごとにカードを作成
    results.forEach(result => {
      const card = createResultCard(result, query);
      container.appendChild(card);
    });
  }

  /**
   * 結果カードを作成
   * @param {Object} result - 検索結果
   * @param {string} query - 検索クエリ
   * @returns {HTMLElement}
   */
  function createResultCard(result, _query) {
    const card = document.createElement('div');
    card.className = 'global-search-result-card';
    card.style.cssText = `
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
    `;

    // ヘッダー（ドキュメント名とマッチ数）
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; color: #2c3e50;';
    title.textContent = result.docName;
    header.appendChild(title);

    const badge = document.createElement('span');
    badge.style.cssText = `
      background-color: #3498db;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
    `;
    badge.textContent = `${result.matchCount} 件`;
    header.appendChild(badge);

    card.appendChild(header);

    // パス
    if (result.path) {
      const path = document.createElement('div');
      path.style.cssText = 'font-size: 0.85rem; color: #7f8c8d; margin-bottom: 0.5rem;';
      path.textContent = result.path;
      card.appendChild(path);
    }

    // マッチのプレビュー（最初の3件）
    const previewCount = Math.min(3, result.matches.length);
    for (let i = 0; i < previewCount; i++) {
      const match = result.matches[i];
      const preview = createMatchPreview(match);
      card.appendChild(preview);
    }

    // 残りのマッチ数を表示
    if (result.matchCount > previewCount) {
      const more = document.createElement('div');
      more.style.cssText = 'font-size: 0.85rem; color: #95a5a6; margin-top: 0.25rem; font-style: italic;';
      more.textContent = `他 ${result.matchCount - previewCount} 件...`;
      card.appendChild(more);
    }

    // ホバー効果
    card.addEventListener('mouseenter', () => {
      card.style.backgroundColor = '#f8f9fa';
    });
    card.addEventListener('mouseleave', () => {
      card.style.backgroundColor = 'transparent';
    });

    // クリックでドキュメントを開く
    card.addEventListener('click', () => {
      openDocument(result.docId, result.matches[0]);
    });

    return card;
  }

  /**
   * マッチプレビューを作成
   * @param {Object} match - マッチ情報
   * @returns {HTMLElement}
   */
  function createMatchPreview(match) {
    const preview = document.createElement('div');
    preview.style.cssText = `
      font-size: 0.85rem;
      color: #555;
      padding: 0.25rem 0;
      border-left: 2px solid #3498db;
      padding-left: 0.5rem;
      margin: 0.25rem 0;
    `;

    const line = document.createElement('span');
    line.style.cssText = 'color: #95a5a6; margin-right: 0.5rem;';
    line.textContent = `L${match.lineNumber}:`;

    const text = document.createElement('span');
    text.innerHTML = highlightMatch(match.contextText, match.matchText);

    preview.appendChild(line);
    preview.appendChild(text);

    return preview;
  }

  /**
   * マッチ部分をハイライト
   * @param {string} text - コンテキストテキスト
   * @param {string} matchText - マッチしたテキスト
   * @returns {string} HTML文字列
   */
  function highlightMatch(text, matchText) {
    // text, matchText 共にescapeHtml済みの安全な文字列に対して操作
    const escaped = escapeHtml(text);
    const escapedMatch = escapeHtml(matchText);

    const regex = new RegExp(escapedMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return escaped.replace(regex, match =>
      `<mark style="background-color: #f39c12; padding: 2px 4px; border-radius: 2px;">${match}</mark>`
    );
  }

  /**
   * HTML特殊文字をエスケープ
   * @param {string} text
   * @returns {string}
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * ドキュメントを開く
   * @param {string} docId - ドキュメントID
   * @param {Object} firstMatch - 最初のマッチ（オプション）
   */
  function openDocument(docId, firstMatch) {
    const storage = window.ZenWriterStorage;
    const editorManager = window.ZenWriterEditor;

    if (!storage || !editorManager) {
      console.error('ストレージまたはエディタが利用できません');
      return;
    }

    // ドキュメントを切り替え
    const docs = storage.loadDocuments() || [];
    const doc = docs.find(d => d && d.id === docId);
    if (!doc) {
      console.error('ドキュメントが見つかりません:', docId);
      return;
    }

    // 現在のコンテンツを保存
    if (typeof storage.saveContent === 'function') {
      storage.saveContent(editorManager.editor?.value || '');
    }

    // 新しいドキュメントをロード
    storage.setCurrentDocId(docId);
    if (typeof editorManager.setContent === 'function') {
      editorManager.setContent(doc.content || '');
    }

    // 最初のマッチ位置にスクロール（オプション）
    if (firstMatch && editorManager.editor) {
      setTimeout(() => {
        try {
          const lines = (doc.content || '').split('\n');
          let charPosition = 0;
          for (let i = 0; i < firstMatch.lineNumber - 1; i++) {
            charPosition += lines[i].length + 1; // +1 for newline
          }
          charPosition += firstMatch.matchStart;

          editorManager.editor.focus();
          editorManager.editor.setSelectionRange(charPosition, charPosition + firstMatch.matchText.length);

          // スクロール
          const lineHeight = parseFloat(getComputedStyle(editorManager.editor).lineHeight) || 20;
          const y = (firstMatch.lineNumber - 1) * lineHeight;
          editorManager.editor.scrollTop = Math.max(0, y - editorManager.editor.clientHeight / 2);
        } catch (err) {
          console.warn('検索結果へのスクロールに失敗:', err);
        }
      }, 100);
    }

    // 通知
    if (typeof editorManager.showNotification === 'function') {
      editorManager.showNotification(`「${doc.name}」を開きました`);
    }

    // パネルを閉じる
    hidePanel();

    // ドキュメント変更イベントを発火
    window.dispatchEvent(new CustomEvent('ZWDocumentsChanged', {
      detail: { docs: storage.loadDocuments() || [] }
    }));
  }

  /**
   * 初期化
   */
  function init() {
    // 閉じるボタン
    const closeBtn = document.getElementById('close-global-search-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', hidePanel);
    }

    // 検索ボタン
    const searchBtn = document.getElementById('global-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', executeSearch);
    }

    // Enterキーで検索
    const input = document.getElementById(INPUT_ID);
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          executeSearch();
        }
      });
    }

    // 履歴選択
    const historySelect = document.getElementById(HISTORY_ID);
    if (historySelect) {
      historySelect.addEventListener('change', (e) => {
        const query = e.target.value;
        if (query && input) {
          input.value = query;
          executeSearch();
        }
      });
    }

    // ESCキーでパネルを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const panel = document.getElementById(PANEL_ID);
        if (panel && panel.style.display !== 'none') {
          hidePanel();
        }
      }
    });
  }

  // DOMContentLoaded時に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // グローバルに公開
  window.GlobalSearchUI = {
    showPanel,
    hidePanel
  };
})();
