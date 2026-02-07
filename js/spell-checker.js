/**
 * スペルチェック機能
 * 基本的なスペルチェックと提案機能を提供
 */
(function () {
  'use strict';

  /**
   * スペルチェッカークラス
   */
  class SpellChecker {
    constructor(editorManager) {
      this.editorManager = editorManager;
      this.editor = editorManager.editor;
      this.enabled = false;
      this.userDictionary = new Set();
      this.highlights = [];
      this.suggestionsPanel = null;
      this.currentMisspelling = null;
      
      // 基本的な英語辞書（簡易版）
      this.dictionary = new Set([
        // よく使われる単語（100語程度）
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
        'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
        'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
        'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
        'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
        'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
        'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
        'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
        'hello', 'world', 'test', 'example', 'sample', 'text', 'word', 'sentence', 'paragraph', 'document'
      ]);

      // 設定の読み込み
      this.loadSettings();
      
      // 初期化
      this.init();
    }

    /**
     * 初期化
     */
    init() {
      if (!this.editor) return;

      // スペルチェックUI要素の作成
      this.createUI();
      
      // イベントリスナーの設定
      this.setupEventListeners();
      
      // 設定が有効な場合は有効化
      if (this.enabled) {
        this.enable();
      }
    }

    /**
     * 設定を読み込み
     */
    loadSettings() {
      try {
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function') {
          const settings = window.ZenWriterStorage.loadSettings() || {};
          const spellCheck = settings.spellCheck || {};
          this.enabled = spellCheck.enabled || false;
          
          // ユーザー辞書の読み込み
          if (spellCheck.userDictionary && Array.isArray(spellCheck.userDictionary)) {
            this.userDictionary = new Set(spellCheck.userDictionary);
          }
        }
      } catch (e) {
        console.warn('[SpellChecker] Failed to load settings:', e);
      }
    }

    /**
     * 設定を保存
     */
    saveSettings() {
      try {
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function') {
          const settings = window.ZenWriterStorage.loadSettings() || {};
          if (!settings.spellCheck) settings.spellCheck = {};
          settings.spellCheck.enabled = this.enabled;
          settings.spellCheck.userDictionary = Array.from(this.userDictionary);
          window.ZenWriterStorage.saveSettings(settings);
        }
      } catch (e) {
        console.warn('[SpellChecker] Failed to save settings:', e);
      }
    }

    /**
     * UI要素の作成
     */
    createUI() {
      // 提案パネルを作成
      this.suggestionsPanel = document.createElement('div');
      this.suggestionsPanel.id = 'spell-check-suggestions';
      this.suggestionsPanel.className = 'spell-check-suggestions';
      this.suggestionsPanel.style.display = 'none';
      document.body.appendChild(this.suggestionsPanel);
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
      if (!this.editor) return;

      // 入力時のスペルチェック（デバウンス）
      let checkTimer = null;
      this.editor.addEventListener('input', () => {
        if (!this.enabled) return;
        
        clearTimeout(checkTimer);
        checkTimer = setTimeout(() => {
          this.checkSpelling();
        }, 500); // 500ms後にチェック
      });

      // 右クリックメニュー（コンテキストメニュー）
      this.editor.addEventListener('contextmenu', (e) => {
        if (!this.enabled) return;
        
        const word = this.getWordAtPosition(e.target.selectionStart || 0);
        if (word && this.isMisspelled(word.text)) {
          e.preventDefault();
          this.showContextMenu(e, word);
        }
      });

      // クリック時に提案パネルを閉じる
      document.addEventListener('click', (e) => {
        if (!this.suggestionsPanel.contains(e.target) && 
            !e.target.closest('.spell-check-highlight')) {
          this.hideSuggestions();
        }
      });
    }

    /**
     * スペルチェックを有効化
     */
    enable() {
      this.enabled = true;
      this.saveSettings();
      this.checkSpelling();
      
      // エディタに spellcheck 属性を設定（ブラウザのネイティブ機能も併用）
      if (this.editor) {
        this.editor.setAttribute('spellcheck', 'true');
      }
    }

    /**
     * スペルチェックを無効化
     */
    disable() {
      this.enabled = false;
      this.saveSettings();
      this.clearHighlights();
      this.hideSuggestions();
      
      if (this.editor) {
        this.editor.setAttribute('spellcheck', 'false');
      }
    }

    /**
     * スペルチェックの実行
     */
    checkSpelling() {
      if (!this.enabled || !this.editor) return;

      const text = this.editor.value || '';
      this.clearHighlights();
      
      // 単語を抽出してチェック
      const words = this.extractWords(text);
      words.forEach(word => {
        if (this.isMisspelled(word.text)) {
          this.highlightMisspelling(word);
        }
      });
    }

    /**
     * テキストから単語を抽出
     * @param {string} text
     * @returns {Array<{text: string, start: number, end: number}>}
     */
    extractWords(text) {
      const words = [];
      const wordRegex = /\b[a-zA-Z]+\b/g;
      let match;
      
      while ((match = wordRegex.exec(text)) !== null) {
        words.push({
          text: match[0].toLowerCase(),
          start: match.index,
          end: match.index + match[0].length
        });
      }
      
      return words;
    }

    /**
     * スペルミスかどうかを判定
     * @param {string} word
     * @returns {boolean}
     */
    isMisspelled(word) {
      const lowerWord = word.toLowerCase();
      
      // ユーザー辞書に含まれている場合は正しい
      if (this.userDictionary.has(lowerWord)) {
        return false;
      }
      
      // 辞書に含まれていない場合はスペルミス
      return !this.dictionary.has(lowerWord);
    }

    /**
     * スペルミスをハイライト
     * @param {{text: string, start: number, end: number}} word
     */
    highlightMisspelling(word) {
      if (!this.editor) return;

      // editor-overlay を取得
      const editorOverlay = this.editorManager?.editorOverlay || document.getElementById('editor-overlay');
      if (!editorOverlay) return;

      // テキスト位置を取得
      const position = this.getTextPosition(word.start, word.end);
      if (!position) return;

      // ハイライト要素を作成
      const highlight = document.createElement('div');
      highlight.className = 'spell-check-highlight';
      highlight.style.position = 'absolute';
      highlight.style.left = position.left + 'px';
      highlight.style.top = position.top + 'px';
      highlight.style.width = position.width + 'px';
      highlight.style.height = position.height + 'px';
      highlight.style.borderBottom = '2px wavy rgba(255, 0, 0, 0.6)';
      highlight.style.pointerEvents = 'none';
      highlight.dataset.start = word.start;
      highlight.dataset.end = word.end;
      highlight.dataset.word = word.text;
      
      // クリックイベント
      highlight.style.pointerEvents = 'auto';
      highlight.style.cursor = 'pointer';
      highlight.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showSuggestions(word, highlight);
      });

      editorOverlay.appendChild(highlight);
      this.highlights.push(highlight);
    }

    /**
     * テキスト位置を取得（editor-search.js の実装を参考）
     * @param {number} start
     * @param {number} end
     * @returns {{left: number, top: number, width: number, height: number} | null}
     */
    getTextPosition(start, end) {
      if (!this.editor) return null;

      try {
        // テキストエリアの前の部分を取得
        const before = this.editor.value.substring(0, start);
        const after = this.editor.value.substring(start, end);
        
        // 一時的な要素を作成して位置を測定
        const mirror = document.getElementById('editor-mirror');
        if (!mirror) return null;

        // スタイルをコピー
        const style = window.getComputedStyle(this.editor);
        mirror.style.fontSize = style.fontSize;
        mirror.style.fontFamily = style.fontFamily;
        mirror.style.lineHeight = style.lineHeight;
        mirror.style.padding = style.padding;
        mirror.style.width = style.width;
        mirror.style.whiteSpace = 'pre-wrap';
        mirror.style.wordWrap = 'break-word';
        mirror.style.visibility = 'visible';
        mirror.style.position = 'absolute';
        mirror.style.top = '0';
        mirror.style.left = '0';

        // テキストを設定
        const textBefore = this.escapeHtml(before);
        const textAfter = this.escapeHtml(after);
        mirror.innerHTML = textBefore + '<span id="measure-start"></span>' + textAfter;

        const measureStart = mirror.querySelector('#measure-start');
        if (!measureStart) return null;

        const rect = measureStart.getBoundingClientRect();
        const editorRect = this.editor.getBoundingClientRect();

        // 幅を測定
        const measureEnd = document.createElement('span');
        measureEnd.id = 'measure-end';
        measureEnd.textContent = after;
        measureStart.parentNode.insertBefore(measureEnd, measureStart.nextSibling);
        const endRect = measureEnd.getBoundingClientRect();

        mirror.style.visibility = 'hidden';

        return {
          left: rect.left - editorRect.left + this.editor.scrollLeft,
          top: rect.top - editorRect.top + this.editor.scrollTop,
          width: Math.max(20, endRect.right - rect.left),
          height: rect.height
        };
      } catch (e) {
        console.warn('[SpellChecker] Failed to get text position:', e);
        return null;
      }
    }

    /**
     * HTMLエスケープ
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return (text || '').replace(/[&<>"']/g, (ch) => map[ch] || ch);
    }

    /**
     * 指定位置の単語を取得
     * @param {number} position
     * @returns {{text: string, start: number, end: number} | null}
     */
    getWordAtPosition(position) {
      const text = this.editor.value || '';
      const wordRegex = /\b[a-zA-Z]+\b/g;
      let match;
      
      while ((match = wordRegex.exec(text)) !== null) {
        if (match.index <= position && position <= match.index + match[0].length) {
          return {
            text: match[0],
            start: match.index,
            end: match.index + match[0].length
          };
        }
      }
      
      return null;
    }

    /**
     * 提案を表示
     * @param {{text: string, start: number, end: number}} word
     * @param {HTMLElement} highlightElement
     */
    showSuggestions(word, highlightElement) {
      if (!this.suggestionsPanel) return;

      this.currentMisspelling = word;
      const suggestions = this.getSuggestions(word.text);
      
      // 提案パネルの内容を更新
      this.suggestionsPanel.innerHTML = '';
      
      const title = document.createElement('div');
      title.className = 'spell-check-suggestions-title';
      title.textContent = `「${word.text}」の提案:`;
      this.suggestionsPanel.appendChild(title);

      if (suggestions.length === 0) {
        const noSuggestions = document.createElement('div');
        noSuggestions.className = 'spell-check-no-suggestions';
        noSuggestions.textContent = '提案が見つかりませんでした';
        this.suggestionsPanel.appendChild(noSuggestions);
      } else {
        suggestions.forEach(suggestion => {
          const button = document.createElement('button');
          button.className = 'spell-check-suggestion';
          button.textContent = suggestion;
          button.addEventListener('click', () => {
            this.replaceWord(word, suggestion);
            this.hideSuggestions();
          });
          this.suggestionsPanel.appendChild(button);
        });
      }

      // 「辞書に追加」ボタン
      const addToDictBtn = document.createElement('button');
      addToDictBtn.className = 'spell-check-add-dict';
      addToDictBtn.textContent = '辞書に追加';
      addToDictBtn.addEventListener('click', () => {
        this.addToDictionary(word.text);
        this.hideSuggestions();
        this.checkSpelling(); // 再チェック
      });
      this.suggestionsPanel.appendChild(addToDictBtn);

      // 位置を設定
      const rect = highlightElement.getBoundingClientRect();
      this.suggestionsPanel.style.left = rect.left + 'px';
      this.suggestionsPanel.style.top = (rect.bottom + 5) + 'px';
      this.suggestionsPanel.style.display = 'block';
    }

    /**
     * 提案を非表示
     */
    hideSuggestions() {
      if (this.suggestionsPanel) {
        this.suggestionsPanel.style.display = 'none';
      }
      this.currentMisspelling = null;
    }

    /**
     * スペル提案を取得（簡易版：編集距離ベース）
     * @param {string} word
     * @returns {string[]}
     */
    getSuggestions(word) {
      const lowerWord = word.toLowerCase();
      
      // 編集距離が小さい単語を提案
      const candidates = Array.from(this.dictionary);
      const scored = candidates.map(candidate => ({
        word: candidate,
        score: this.levenshteinDistance(lowerWord, candidate)
      }));
      
      scored.sort((a, b) => a.score - b.score);
      
      // 上位5件を返す
      return scored.slice(0, 5).map(item => item.word);
    }

    /**
     * レーベンシュタイン距離を計算
     * @param {string} a
     * @param {string} b
     * @returns {number}
     */
    levenshteinDistance(a, b) {
      const matrix = [];
      
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      
      return matrix[b.length][a.length];
    }

    /**
     * 単語を置換
     * @param {{text: string, start: number, end: number}} word
     * @param {string} replacement
     */
    replaceWord(word, replacement) {
      if (!this.editor) return;

      const start = word.start;
      const end = word.end;
      const before = this.editor.value.substring(0, start);
      const after = this.editor.value.substring(end);
      
      this.editor.value = before + replacement + after;
      this.editor.selectionStart = start + replacement.length;
      this.editor.selectionEnd = start + replacement.length;
      this.editor.focus();
      
      // エディタマネージャーに通知
      if (this.editorManager) {
        this.editorManager.markDirty();
        this.editorManager.saveContent();
        this.editorManager.updateWordCount();
      }
      
      // 再チェック
      setTimeout(() => this.checkSpelling(), 100);
    }

    /**
     * 辞書に追加
     * @param {string} word
     */
    addToDictionary(word) {
      const lowerWord = word.toLowerCase();
      this.userDictionary.add(lowerWord);
      this.saveSettings();
      
      if (this.editorManager && typeof this.editorManager.showNotification === 'function') {
        this.editorManager.showNotification(`「${word}」を辞書に追加しました`);
      }
    }

    /**
     * ハイライトをクリア
     */
    clearHighlights() {
      this.highlights.forEach(highlight => {
        if (highlight.parentNode) {
          highlight.parentNode.removeChild(highlight);
        }
      });
      this.highlights = [];
    }

    /**
     * コンテキストメニューを表示
     * @param {Event} e
     * @param {{text: string, start: number, end: number}} word
     */
    showContextMenu(e, word) {
      // 簡易実装：提案パネルを表示
      const tempHighlight = document.createElement('div');
      tempHighlight.style.position = 'fixed';
      tempHighlight.style.left = e.clientX + 'px';
      tempHighlight.style.top = e.clientY + 'px';
      document.body.appendChild(tempHighlight);
      
      this.showSuggestions(word, tempHighlight);
      
      setTimeout(() => {
        if (tempHighlight.parentNode) {
          tempHighlight.parentNode.removeChild(tempHighlight);
        }
      }, 100);
    }
  }

  // グローバルに公開
  window.SpellChecker = SpellChecker;
})();
