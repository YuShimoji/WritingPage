/**
 * WYSIWYGエディタ管理クラス
 * contenteditableベースのリッチテキストエディタとMarkdownとの双方向変換を提供
 */
(function () {
  'use strict';

  class RichTextEditor {
    constructor(editorManager) {
      this.editorManager = editorManager;
      this.textareaEditor = document.getElementById('editor');
      this.wysiwygEditor = document.getElementById('wysiwyg-editor');
      this.wysiwygToolbar = document.getElementById('wysiwyg-toolbar');
      this.toggleWysiwygBtn = document.getElementById('toggle-wysiwyg');
      this.switchToTextareaBtn = document.getElementById('wysiwyg-switch-to-textarea');
      this.isWysiwygMode = false;

      // Turndownインスタンス（HTML → Markdown変換）
      this.turndownService = null;
      if (typeof TurndownService !== 'undefined') {
        this.turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          bulletListMarker: '-',
          emDelimiter: '*',
          strongDelimiter: '**'
        });
      } else if (typeof window.TurndownService !== 'undefined') {
        this.turndownService = new window.TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          bulletListMarker: '-',
          emDelimiter: '*',
          strongDelimiter: '**'
        });
      }

      // カスタム装飾span → [tag]...[/tag] 逆変換ルール
      if (this.turndownService) {
        this.turndownService.addRule('fontDecorations', {
          filter: function (node) {
            return node.nodeName === 'SPAN' && node.className && /^decor-/.test(node.className);
          },
          replacement: function (content, node) {
            var tag = node.className.replace('decor-', '');
            return '[' + tag + ']' + content + '[/' + tag + ']';
          }
        });
        var animClassToTag = {
          'anim-fade': 'fade', 'anim-slide': 'slide', 'anim-typewriter': 'type',
          'anim-pulse': 'pulse', 'anim-shake': 'shake', 'anim-bounce': 'bounce', 'anim-fade-in': 'fadein'
        };
        this.turndownService.addRule('textAnimations', {
          filter: function (node) {
            return node.nodeName === 'SPAN' && node.className && /^anim-/.test(node.className);
          },
          replacement: function (content, node) {
            var tag = animClassToTag[node.className] || node.className.replace('anim-', '');
            return '[' + tag + ']' + content + '[/' + tag + ']';
          }
        });
      }

      // Markdown → HTML変換用（markdown-itは既に読み込まれている）
      this.markdownRenderer = null;
      if (window.markdownit) {
        this.markdownRenderer = window.markdownit({
          html: true,
          linkify: true,
          breaks: true
        });
      }

      this.init();
      if (this.editorManager) {
        this.editorManager.richTextEditor = this;
      }
    }

    /**
     * 初期化
     */
    init() {
      if (!this.wysiwygEditor || !this.textareaEditor) return;

      // エディタ切り替えボタン: 双方向トグル
      if (this.toggleWysiwygBtn) {
        this.toggleWysiwygBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (this.isWysiwygMode) {
            this.switchToTextarea();
          } else {
            this.switchToWysiwyg();
          }
        });
      }

      if (this.switchToTextareaBtn) {
        this.switchToTextareaBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.switchToTextarea();
        });
      }

      // WYSIWYGツールバーボタンのイベント
      this.setupToolbarButtons();

      // WYSIWYGエディタのイベント
      this.setupWysiwygEditorEvents();

      // 初期状態はtextareaモード (autoEnableで切り替え)
      this.isWysiwygMode = false;

      // localStorageからWYSIWYGモード設定を読み込み (デフォルト: true)
      this.autoEnableWysiwyg();
    }

    /**
     * 起動時にWYSIWYGモードを自動有効化
     * localStorageに明示的にfalseが保存されている場合のみtextareaモード
     */
    autoEnableWysiwyg() {
      const saved = localStorage.getItem('zenwriter-wysiwyg-mode');
      // デフォルトはWYSIWYG ON (savedがnullまたは'true'の場合)
      const shouldEnable = saved !== 'false';
      if (shouldEnable) {
        // textareaにコンテンツが読み込まれた後に切り替え
        requestAnimationFrame(() => this.switchToWysiwyg());
      }
    }

    /**
     * WYSIWYGツールバーボタンの設定
     */
    setupToolbarButtons() {
      if (!this.wysiwygToolbar) return;

      const boldBtn = document.getElementById('wysiwyg-bold');
      const italicBtn = document.getElementById('wysiwyg-italic');
      const underlineBtn = document.getElementById('wysiwyg-underline');
      const strikeBtn = document.getElementById('wysiwyg-strike');
      const linkBtn = document.getElementById('wysiwyg-link');

      if (boldBtn) {
        boldBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.executeCommand('bold');
        });
      }

      if (italicBtn) {
        italicBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.executeCommand('italic');
        });
      }

      if (underlineBtn) {
        underlineBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.executeCommand('underline');
        });
      }

      if (strikeBtn) {
        strikeBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.executeCommand('strikeThrough');
        });
      }

      if (linkBtn) {
        linkBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.insertLink();
        });
      }

      // 装飾ドロップダウン
      this.setupDropdowns();

      // フローティングツールバー
      this.setupFloatingToolbar();
    }

    /**
     * ドロップダウンメニュー (装飾/アニメーション) の初期化
     */
    setupDropdowns() {
      if (!this.wysiwygToolbar) return;
      var self = this;

      // ドロップダウントグル
      this.wysiwygToolbar.querySelectorAll('.wysiwyg-dropdown-toggle').forEach(function (toggle) {
        toggle.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var dropdown = toggle.closest('.wysiwyg-dropdown');
          var isOpen = dropdown.getAttribute('data-open') === 'true';
          // 他のドロップダウンを閉じる
          self.wysiwygToolbar.querySelectorAll('.wysiwyg-dropdown').forEach(function (d) {
            d.setAttribute('data-open', 'false');
          });
          dropdown.setAttribute('data-open', isOpen ? 'false' : 'true');
          toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        });
      });

      // 装飾メニュー項目
      this.wysiwygToolbar.querySelectorAll('[data-decor]').forEach(function (btn) {
        btn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var tag = btn.getAttribute('data-decor');
          if (tag) self.wrapSelectionWithSpan('decor-' + tag);
          btn.closest('.wysiwyg-dropdown').setAttribute('data-open', 'false');
        });
      });

      // アニメーションメニュー項目
      this.wysiwygToolbar.querySelectorAll('[data-anim]').forEach(function (btn) {
        btn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var tag = btn.getAttribute('data-anim');
          var classMap = { fade: 'anim-fade', slide: 'anim-slide', type: 'anim-typewriter', pulse: 'anim-pulse', shake: 'anim-shake', bounce: 'anim-bounce', fadein: 'anim-fade-in' };
          if (tag && classMap[tag]) self.wrapSelectionWithSpan(classMap[tag]);
          btn.closest('.wysiwyg-dropdown').setAttribute('data-open', 'false');
        });
      });

      // ドロップダウン外クリックで閉じる
      document.addEventListener('mousedown', function (e) {
        if (!e.target.closest('.wysiwyg-dropdown')) {
          self.wysiwygToolbar.querySelectorAll('.wysiwyg-dropdown').forEach(function (d) {
            d.setAttribute('data-open', 'false');
          });
        }
      });
    }

    /**
     * フローティングツールバーの選択連動表示
     */
    setupFloatingToolbar() {
      if (!this.wysiwygEditor || !this.wysiwygToolbar) return;
      var self = this;
      this._floatingVisible = false;

      document.addEventListener('selectionchange', function () {
        if (!self.isWysiwygMode) return;
        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
          self._hideFloatingToolbar();
          return;
        }
        var range = sel.getRangeAt(0);
        if (!self.wysiwygEditor.contains(range.commonAncestorContainer)) {
          self._hideFloatingToolbar();
          return;
        }
        self._showFloatingToolbar(range);
      });

      // ツールバー上のマウスダウンで非表示を防止
      this.wysiwygToolbar.addEventListener('mousedown', function (e) {
        // ボタン以外のツールバー領域クリック時も選択を保持
        if (!e.target.closest('button')) e.preventDefault();
      });
    }

    /** @private フローティングツールバーを選択範囲の近くに表示 */
    _showFloatingToolbar(range) {
      var rect = range.getBoundingClientRect();
      var container = this.wysiwygEditor.closest('.editor-container');
      if (!container) return;
      var cRect = container.getBoundingClientRect();

      var toolbarH = 44; // おおよそのツールバー高さ
      var gap = 8;
      var top, left;

      // 選択範囲の上に余白があれば上、なければ下
      if (rect.top - cRect.top > toolbarH + gap) {
        top = rect.top - cRect.top - toolbarH - gap;
      } else {
        top = rect.bottom - cRect.top + gap;
      }
      left = rect.left - cRect.left + rect.width / 2;

      // ツールバー幅を取得して境界クランプ
      var tbRect = this.wysiwygToolbar.getBoundingClientRect();
      var tbW = tbRect.width || 300; // 非表示時のフォールバック
      var containerW = cRect.width;
      var margin = 12;

      // 左端クランプ: translateX(-50%) を考慮
      if (left - tbW / 2 < margin) {
        left = tbW / 2 + margin;
      }
      // 右端クランプ
      if (left + tbW / 2 > containerW - margin) {
        left = containerW - tbW / 2 - margin;
      }
      // 上端クランプ
      if (top < 0) {
        top = gap;
      }

      this.wysiwygToolbar.style.top = top + 'px';
      this.wysiwygToolbar.style.left = left + 'px';
      this.wysiwygToolbar.style.transform = 'translateX(-50%)';
      this.wysiwygToolbar.setAttribute('data-visible', 'true');
      this._floatingVisible = true;
    }

    /** @private フローティングツールバーを非表示 */
    _hideFloatingToolbar() {
      if (!this._floatingVisible) return;
      this.wysiwygToolbar.setAttribute('data-visible', 'false');
      // ドロップダウンも閉じる
      this.wysiwygToolbar.querySelectorAll('.wysiwyg-dropdown').forEach(function (d) {
        d.setAttribute('data-open', 'false');
      });
      this._floatingVisible = false;
    }

    /**
     * WYSIWYGエディタのイベント設定
     */
    setupWysiwygEditorEvents() {
      if (!this.wysiwygEditor) return;

      // 入力時の自動保存とプレビュー更新
      this.wysiwygEditor.addEventListener('input', () => {
        this.syncToMarkdown();
        if (this.editorManager) {
          this.editorManager.markDirty();
          this.editorManager.saveContent();
          this.editorManager.updateWordCount();
          this.editorManager.renderMarkdownPreview();
        }
      });

      // ペースト時の処理（プレーンテキスト化を防ぐ）
      this.wysiwygEditor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });

      // キーボードショートカット
      this.wysiwygEditor.addEventListener('keydown', (e) => {
        // Ctrl+B: 太字
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
          e.preventDefault();
          this.executeCommand('bold');
        }
        // Ctrl+I: 斜体
        else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
          e.preventDefault();
          this.executeCommand('italic');
        }
        // Ctrl+U: 下線
        else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
          e.preventDefault();
          this.executeCommand('underline');
        }
        // Ctrl+K: リンク
        else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          this.insertLink();
        }
      });
    }

    /**
     * コマンドを実行（太字、斜体、下線など）
     * document.execCommandの代わりに、手動でHTMLタグを挿入する実装
     */
    executeCommand(command, value = null) {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;

      this.wysiwygEditor.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        this.notifySelectionRequired();
        return;
      }

      const range = selection.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return;

      // Apply only to selected text and allow toggle-off by re-running the command.
      document.execCommand(command, false, value);
      this.wysiwygEditor.focus();
      this.syncToMarkdown();
    }

    /**
     * 選択テキストを指定CSSクラスのspanで囲む（トグル対応）。
     * execCommandで対応できないカスタム装飾（decor-smallcaps等）に使用。
     */
    wrapSelectionWithSpan(className) {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;

      this.wysiwygEditor.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        this.notifySelectionRequired();
        return;
      }

      const range = selection.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return;

      // トグル: 選択範囲の親が同クラスのspanならアンラップ
      const ancestor = range.commonAncestorContainer;
      const parentEl = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : ancestor;
      if (parentEl && parentEl.tagName === 'SPAN' && parentEl.classList.contains(className)) {
        const fragment = document.createDocumentFragment();
        while (parentEl.firstChild) fragment.appendChild(parentEl.firstChild);
        parentEl.parentNode.replaceChild(fragment, parentEl);
      } else {
        try {
          const span = document.createElement('span');
          span.className = className;
          range.surroundContents(span);
        } catch (_) {
          // surroundContentsは部分選択で失敗する場合がある
          const span = document.createElement('span');
          span.className = className;
          span.appendChild(range.extractContents());
          range.insertNode(span);
        }
      }

      this.wysiwygEditor.focus();
      this.syncToMarkdown();
    }

    insertLink() {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;

      this.wysiwygEditor.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        this.notifySelectionRequired();
        return;
      }

      const range = selection.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return;

      const selectedText = selection.toString().trim();
      const url = prompt('リンクURLを入力してください:', selectedText ? 'https://' : '');
      if (!url) return;

      const link = document.createElement('a');
      link.href = url;
      link.textContent = selectedText || url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      range.deleteContents();
      range.insertNode(link);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(link);
      newRange.collapse(true);
      selection.addRange(newRange);

      this.wysiwygEditor.focus();
      this.syncToMarkdown();
    }

    notifySelectionRequired() {
      try {
        if (this.editorManager && typeof this.editorManager.showNotification === 'function') {
          this.editorManager.showNotification('先にテキストを選択してください', 1400);
        }
      } catch (_) { }
    }

    switchToWysiwyg() {
      if (this.isWysiwygMode) return;

      // textareaの内容を取得してMarkdownからHTMLに変換
      const markdown = this.textareaEditor.value || '';
      const html = this.markdownToHtml(markdown);

      // WYSIWYGエディタに設定
      this.wysiwygEditor.innerHTML = html;

      // 表示を切り替え
      this.textareaEditor.style.display = 'none';
      this.wysiwygEditor.style.display = 'block';
      // フローティングモード: ツールバーはテキスト選択時に自動表示
      this.isWysiwygMode = true;

      // フォーカスを移動
      this.wysiwygEditor.focus();

      // ツールバーボタンの状態を更新
      if (this.toggleWysiwygBtn) {
        this.toggleWysiwygBtn.setAttribute('aria-pressed', 'true');
        this.toggleWysiwygBtn.title = 'ソース表示に切り替え';
      }

      // 設定を保存
      try { localStorage.setItem('zenwriter-wysiwyg-mode', 'true'); } catch (_) { /* noop */ }
    }

    /**
     * textareaモードに切り替え (ソース表示)
     */
    switchToTextarea() {
      if (!this.isWysiwygMode) return;

      // WYSIWYGの内容を取得してHTMLからMarkdownに変換
      const html = this.wysiwygEditor.innerHTML || '';
      const markdown = this.htmlToMarkdown(html);

      // textareaに設定
      this.textareaEditor.value = markdown;

      // 表示を切り替え
      this.wysiwygEditor.style.display = 'none';
      this._hideFloatingToolbar();
      this.wysiwygToolbar.removeAttribute('data-visible');
      this.textareaEditor.style.display = 'block';
      this.isWysiwygMode = false;

      // フォーカスを移動
      this.textareaEditor.focus();

      // 保存と更新
      if (this.editorManager) {
        this.editorManager.saveContent();
        this.editorManager.updateWordCount();
        this.editorManager.renderMarkdownPreview();
      }

      // ツールバーボタンの状態を更新
      if (this.toggleWysiwygBtn) {
        this.toggleWysiwygBtn.setAttribute('aria-pressed', 'false');
        this.toggleWysiwygBtn.title = 'リッチテキスト編集';
      }

      // 設定を保存
      try { localStorage.setItem('zenwriter-wysiwyg-mode', 'false'); } catch (_) { /* noop */ }
    }

    /**
     * WYSIWYGの内容をMarkdownに同期（内部使用）
     */
    syncToMarkdown() {
      if (!this.isWysiwygMode || !this.textareaEditor) return;

      const html = this.wysiwygEditor.innerHTML || '';
      const markdown = this.htmlToMarkdown(html);
      this.textareaEditor.value = markdown;
    }

    /**
     * MarkdownをHTMLに変換
     */
    markdownToHtml(markdown) {
      if (!markdown) return '';

      let html = '';
      const settings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
        ? window.ZenWriterStorage.loadSettings()
        : {};
      if (this.markdownRenderer) {
        try {
          html = this.markdownRenderer.render(markdown);
        } catch (e) {
          console.warn('Markdown to HTML conversion failed:', e);
        }
      }

      if (!html) {
        // フォールバック: 基本的なエスケープ
        html = markdown
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }

      if (html && window.TextboxRichTextBridge && typeof window.TextboxRichTextBridge.projectRenderedHtml === 'function') {
        html = window.TextboxRichTextBridge.projectRenderedHtml(html, {
          settings,
          target: 'wysiwyg'
        });
      }

      if (this.editorManager && typeof this.editorManager.processFontDecorations === 'function') {
        html = this.editorManager.processFontDecorations(html);
      }
      if (this.editorManager && typeof this.editorManager.processTextAnimations === 'function') {
        html = this.editorManager.processTextAnimations(html);
      }

      return html;
    }

    /**
     * HTMLをMarkdownに変換
     */
    htmlToMarkdown(html) {
      if (!html) return '';

      let serializedHtml = html;
      let textboxPlaceholders = [];
      if (window.TextboxRichTextBridge && typeof window.TextboxRichTextBridge.serializeHtml === 'function') {
        const bridged = window.TextboxRichTextBridge.serializeHtml(html, {
          serializeFragment: (fragmentHtml) => this.htmlFragmentToMarkdown(fragmentHtml)
        });
        serializedHtml = bridged && typeof bridged.html === 'string' ? bridged.html : html;
        textboxPlaceholders = bridged && Array.isArray(bridged.placeholders) ? bridged.placeholders : [];
      }

      if (this.turndownService) {
        try {
          const markdown = this.turndownService.turndown(serializedHtml);
          const restored = window.TextboxRichTextBridge && typeof window.TextboxRichTextBridge.restoreSerializedBlocks === 'function'
            ? window.TextboxRichTextBridge.restoreSerializedBlocks(markdown, textboxPlaceholders)
            : markdown;
          return this.normalizeCustomTagEscapes(restored);
        } catch (e) {
          console.warn('HTML to Markdown conversion failed:', e);
        }
      }

      // フォールバック: 基本的な変換
      let markdown = serializedHtml
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i>(.*?)<\/i>/gi, '*$1*')
        .replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>') // 下線はMarkdown標準ではサポートされていないためHTMLタグのまま
        .replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      // 連続する改行を整理
      markdown = markdown.replace(/\n{3,}/g, '\n\n');

      if (window.TextboxRichTextBridge && typeof window.TextboxRichTextBridge.restoreSerializedBlocks === 'function') {
        markdown = window.TextboxRichTextBridge.restoreSerializedBlocks(markdown, textboxPlaceholders);
      }

      return this.normalizeCustomTagEscapes(markdown);
    }

    htmlFragmentToMarkdown(html) {
      if (!html) return '';
      if (this.turndownService) {
        try {
          return this.normalizeCustomTagEscapes(this.turndownService.turndown(html));
        } catch (_) { }
      }
      return String(html)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    }

    normalizeCustomTagEscapes(markdown) {
      if (!markdown) return '';
      return markdown.replace(
        /\\\[(\/?(?:bold|italic|underline|strike|smallcaps|light|shadow|black|uppercase|lowercase|capitalize|outline|glow|wide|narrow|fade|slide|type|pulse|shake|bounce|fadein))\\\]/gi,
        '[$1]'
      );
    }

    /**
     * 現在のエディタモードを取得
     */
    getCurrentMode() {
      return this.isWysiwygMode ? 'wysiwyg' : 'textarea';
    }

    /**
     * エディタの内容を取得（現在のモードに応じて）
     */
    getContent() {
      if (this.isWysiwygMode) {
        this.syncToMarkdown();
      }
      return this.textareaEditor.value || '';
    }

    /**
     * エディタの内容を設定（現在のモードに応じて）
     */
    setContent(content) {
      if (this.isWysiwygMode) {
        const html = this.markdownToHtml(content);
        this.wysiwygEditor.innerHTML = html;
        this.syncToMarkdown();
      } else {
        this.textareaEditor.value = content || '';
      }
    }
  }

  // グローバルに公開（EditorManagerの初期化後に呼び出される）
  window.RichTextEditor = RichTextEditor;

  // EditorManagerが初期化された後にRichTextEditorを初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.ZenWriterEditor) {
        const instance = new RichTextEditor(window.ZenWriterEditor);
        window.richTextEditor = instance;
        if (window.ZenWriterEditor) {
          window.ZenWriterEditor.richTextEditor = instance;
        }
      }
    });
  } else {
    if (window.ZenWriterEditor) {
      const instance = new RichTextEditor(window.ZenWriterEditor);
      window.richTextEditor = instance;
      window.ZenWriterEditor.richTextEditor = instance;
    }
  }
})();
