/**
 * editor-search.js
 * 検索・置換機能のモジュール化
 * EditorManager から検索関連ロジックを分離
 */
(function () {
  /**
   * 検索パネルを表示
   * @param {EditorManager} manager
   */
  function showSearchPanel(manager) {
    const panel = document.getElementById('search-panel');
    if (!panel) return;
    panel.style.display = 'block';
    const input = document.getElementById('search-input');
    if (input) {
      // 選択中のテキストを検索入力に設定
      const selected = manager.editor?.value?.substring(
        manager.editor.selectionStart,
        manager.editor.selectionEnd
      );
      if (selected) {
        input.value = selected;
      }
      input.focus();
    }
    updateSearchMatches(manager);
  }

  /**
   * 検索パネルを非表示
   * @param {EditorManager} manager
   */
  function hideSearchPanel(manager) {
    const panel = document.getElementById('search-panel');
    if (panel) {
      panel.style.display = 'none';
    }
    clearSearchHighlights(manager);
  }

  /**
   * 検索条件に基づいて正規表現を取得
   * @returns {RegExp|null}
   */
  function getSearchRegex() {
    const input = document.getElementById('search-input');
    const caseSensitive = document.getElementById('search-case-sensitive')?.checked;
    const useRegex = document.getElementById('search-regex')?.checked;
    const query = input?.value || '';

    if (!query) return null;

    let flags = 'g';
    if (!caseSensitive) flags += 'i';

    try {
      return useRegex ? new RegExp(query, flags) : new RegExp(escapeRegex(query), flags);
    } catch (e) {
      return null;
    }
  }

  /**
   * 正規表現の特殊文字をエスケープ
   * @param {string} str
   * @returns {string}
   */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * マッチを検索してハイライト
   * @param {EditorManager} manager
   */
  function updateSearchMatches(manager) {
    clearSearchHighlights(manager);
    const regex = getSearchRegex();
    if (!regex) {
      manager.currentMatches = [];
      manager.currentMatchIndex = -1;
      updateMatchCount(0);
      return;
    }

    const text = manager.editor.value;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }

    manager.currentMatches = matches;

    if (matches.length > 0) {
      // 最初のマッチを自動的に選択しておくことで、
      // navigateMatch や replaceSingle が直後に動作するようにする
      manager.currentMatchIndex = 0;
      updateMatchCount(matches.length);
      highlightMatches(manager, matches);
      selectMatch(manager, matches[0]);
    } else {
      manager.currentMatchIndex = -1;
      updateMatchCount(0);
    }
  }

  /**
   * マッチ数を更新
   * @param {number} count
   */
  function updateMatchCount(count) {
    const countEl = document.getElementById('match-count');
    if (countEl) {
      if (count === 0) {
        countEl.textContent = '一致するテキストが見つかりません';
      } else {
        countEl.textContent = `${count} 件一致しました`;
      }
    }
  }

  /**
   * マッチをハイライト
   * @param {EditorManager} manager
   * @param {Array} matches
   */
  function highlightMatches(manager, matches) {
    const overlay = manager.editorOverlay;
    if (!overlay) return;

    matches.forEach((match, index) => {
      const highlight = document.createElement('div');
      highlight.className = 'search-highlight';
      highlight.dataset.matchIndex = index;

      const rect = getTextPosition(manager, match.start, match.end);
      if (rect) {
        highlight.style.left = rect.left + 'px';
        highlight.style.top = rect.top + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        overlay.appendChild(highlight);
      }
    });
  }

  /**
   * テキスト位置を取得
   * @param {EditorManager} manager
   * @param {number} start
   * @param {number} end
   * @returns {Object|null}
   */
  function getTextPosition(manager, start, end) {
    const mirror = manager.editorMirror;
    if (!mirror) return null;

    const text = manager.editor.value;
    const before = text.substring(0, start);
    const match = text.substring(start, end);
    const after = text.substring(end);

    // escapeHtml はマネージャの関数を使用
    const escapeHtml = typeof manager.escapeHtml === 'function'
      ? manager.escapeHtml.bind(manager)
      : (str) => (str || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));

    mirror.innerHTML = escapeHtml(before) +
                      '<span class="search-match">' + escapeHtml(match) + '</span>' +
                      escapeHtml(after);
    mirror.innerHTML = mirror.innerHTML.replace(/\n/g, '<br>');

    const matchEl = mirror.querySelector('.search-match');
    if (matchEl) {
      const rect = matchEl.getBoundingClientRect();
      const editorRect = manager.editor.getBoundingClientRect();
      return {
        left: rect.left - editorRect.left,
        top: rect.top - editorRect.top,
        width: rect.width,
        height: rect.height
      };
    }
    return null;
  }

  /**
   * ハイライトをクリア
   * @param {EditorManager} manager
   */
  function clearSearchHighlights(manager) {
    const highlights = manager.editorOverlay?.querySelectorAll('.search-highlight');
    if (highlights) {
      highlights.forEach(h => h.remove());
    }
  }

  /**
   * 次/前のマッチに移動
   * @param {EditorManager} manager
   * @param {number} direction - 1 for next, -1 for previous
   */
  function navigateMatch(manager, direction) {
    if (!manager.currentMatches || manager.currentMatches.length === 0) return;

    if (direction > 0) {
      manager.currentMatchIndex = (manager.currentMatchIndex + 1) % manager.currentMatches.length;
    } else {
      manager.currentMatchIndex = manager.currentMatchIndex <= 0 ?
        manager.currentMatches.length - 1 : manager.currentMatchIndex - 1;
    }

    const match = manager.currentMatches[manager.currentMatchIndex];
    selectMatch(manager, match);
  }

  /**
   * マッチを選択
   * @param {EditorManager} manager
   * @param {Object} match
   */
  function selectMatch(manager, match) {
    manager.editor.selectionStart = match.start;
    manager.editor.selectionEnd = match.end;
    manager.editor.focus();
    scrollToMatch(manager, match);
  }

  /**
   * マッチにスクロール
   * @param {EditorManager} manager
   * @param {Object} match
   */
  function scrollToMatch(manager, match) {
    // 簡易的なスクロール実装
    const lineHeight = parseFloat(getComputedStyle(manager.editor).lineHeight) || 20;
    const lines = manager.editor.value.substring(0, match.start).split('\n').length - 1;
    const y = lines * lineHeight;
    manager.editor.scrollTop = Math.max(0, y - manager.editor.clientHeight / 2);
  }

  /**
   * 単一置換
   * @param {EditorManager} manager
   */
  function replaceSingle(manager) {
    const replaceInput = document.getElementById('replace-input');
    const replaceText = replaceInput?.value || '';

    if (!manager.currentMatches || manager.currentMatchIndex < 0) return;

    const match = manager.currentMatches[manager.currentMatchIndex];
    const before = manager.editor.value.substring(0, match.start);
    const after = manager.editor.value.substring(match.end);

    manager.editor.value = before + replaceText + after;
    if (typeof manager.saveContent === 'function') manager.saveContent();
    if (typeof manager._updateWordCountImmediate === 'function') manager._updateWordCountImmediate();

    // マッチ位置を調整
    manager.currentMatches.splice(manager.currentMatchIndex, 1);

    // 残りのマッチ位置を調整
    for (let i = manager.currentMatchIndex; i < manager.currentMatches.length; i++) {
      manager.currentMatches[i].start += replaceText.length - match.text.length;
      manager.currentMatches[i].end += replaceText.length - match.text.length;
    }

    if (manager.currentMatches.length === 0) {
      manager.currentMatchIndex = -1;
    } else {
      manager.currentMatchIndex = Math.min(manager.currentMatchIndex, manager.currentMatches.length - 1);
    }

    updateMatchCount(manager.currentMatches.length);
    updateSearchMatches(manager);

    // エディタの選択を更新
    if (manager.currentMatchIndex >= 0) {
      const newMatch = manager.currentMatches[manager.currentMatchIndex];
      selectMatch(manager, newMatch);
    }
  }

  /**
   * すべて置換
   * @param {EditorManager} manager
   */
  function replaceAll(manager) {
    const replaceInput = document.getElementById('replace-input');
    const replaceText = replaceInput?.value || '';
    const regex = getSearchRegex();

    if (!regex || !manager.currentMatches) return;

    let result = manager.editor.value;
    let offset = 0;

    manager.currentMatches.forEach(match => {
      const before = result.substring(0, match.start + offset);
      const after = result.substring(match.end + offset);
      result = before + replaceText + after;
      offset += replaceText.length - match.text.length;
    });

    manager.editor.value = result;
    if (typeof manager.saveContent === 'function') manager.saveContent();
    if (typeof manager._updateWordCountImmediate === 'function') manager._updateWordCountImmediate();
    updateSearchMatches(manager);
    if (typeof manager.showNotification === 'function') manager.showNotification('すべて置換しました');
  }

  // グローバルに公開
  window.editorSearch_showSearchPanel = showSearchPanel;
  window.editorSearch_hideSearchPanel = hideSearchPanel;
  window.editorSearch_getSearchRegex = getSearchRegex;
  window.editorSearch_escapeRegex = escapeRegex;
  window.editorSearch_updateSearchMatches = updateSearchMatches;
  window.editorSearch_updateMatchCount = updateMatchCount;
  window.editorSearch_highlightMatches = highlightMatches;
  window.editorSearch_getTextPosition = getTextPosition;
  window.editorSearch_clearSearchHighlights = clearSearchHighlights;
  window.editorSearch_navigateMatch = navigateMatch;
  window.editorSearch_selectMatch = selectMatch;
  window.editorSearch_scrollToMatch = scrollToMatch;
  window.editorSearch_replaceSingle = replaceSingle;
  window.editorSearch_replaceAll = replaceAll;
})();
