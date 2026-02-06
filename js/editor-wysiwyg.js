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
      console.log('[RichTextEditor] Initialized');
    }

    /**
     * 初期化
     */
    init() {
      if (!this.wysiwygEditor || !this.textareaEditor) return;

      // エディタ切り替えボタンのイベント
      if (this.toggleWysiwygBtn) {
        this.toggleWysiwygBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.switchToWysiwyg();
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

      // 初期状態はtextareaモード
      this.isWysiwygMode = false;
    }

    /**
     * WYSIWYGツールバーボタンの設定
     */
    setupToolbarButtons() {
      if (!this.wysiwygToolbar) return;

      const boldBtn = document.getElementById('wysiwyg-bold');
      const italicBtn = document.getElementById('wysiwyg-italic');
      const underlineBtn = document.getElementById('wysiwyg-underline');
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

      if (linkBtn) {
        linkBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.insertLink();
        });
      }
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

      // エディタにフォーカスを確保
      this.wysiwygEditor.focus();

      const selection = window.getSelection();
      let range;

      // 選択範囲を取得
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        range = selection.getRangeAt(0);
        // 選択範囲がエディタ内にあることを確認
        if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) {
          range = null;
        }
      }

      // 選択範囲がない、または空の場合は、エディタ全体を選択
      if (!range || range.collapsed) {
        range = document.createRange();
        range.selectNodeContents(this.wysiwygEditor);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      // 選択範囲が空の場合は何もしない
      if (range.collapsed) {
        return;
      }

      // 選択範囲の内容を取得
      const selectedContent = range.extractContents();
      
      // コマンドに応じたタグを作成
      let wrapper;
      switch (command) {
        case 'bold':
          wrapper = document.createElement('strong');
          break;
        case 'italic':
          wrapper = document.createElement('em');
          break;
        case 'underline':
          wrapper = document.createElement('u');
          break;
        default:
          // 未知のコマンドの場合はexecCommandにフォールバック
          document.execCommand(command, false, value);
          this.wysiwygEditor.focus();
          return;
      }

      // 選択範囲の内容をラッパーで囲む
      wrapper.appendChild(selectedContent);
      range.insertNode(wrapper);

      // 選択範囲をクリアして、挿入した要素の後にカーソルを移動
      if (selection) {
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(wrapper);
        newRange.collapse(true);
        selection.addRange(newRange);
      }

      this.wysiwygEditor.focus();
      
      // 同期をトリガー
      this.syncToMarkdown();
    }
    /**
     * リンクを挿入
     * document.execCommandの代わりに、手動でリンクタグを挿入する実装
     */
    insertLink() {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;

      // エディタにフォーカスを確保
      this.wysiwygEditor.focus();

      const selection = window.getSelection();
      let range;
      let selectedText = '';

      // 選択範囲を取得
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        range = selection.getRangeAt(0);
        // 選択範囲がエディタ内にあることを確認
        if (this.wysiwygEditor.contains(range.commonAncestorContainer)) {
          selectedText = selection.toString().trim();
        } else {
          range = null;
        }
      }

      // 選択範囲がない場合は、カーソル位置を取得
      if (!range) {
        range = document.createRange();
        range.setStart(this.wysiwygEditor, 0);
        range.collapse(true);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      const url = prompt('リンクのURLを入力してください:', selectedText ? 'https://' : '');

      if (!url) return;

      const linkText = selectedText || url;

      // リンク要素を作成
      const link = document.createElement('a');
      link.href = url;
      link.textContent = linkText;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      // 選択範囲がある場合は、その範囲をリンクに置き換え
      if (selectedText && !range.collapsed) {
        range.deleteContents();
        range.insertNode(link);
      } else {
        // 選択範囲がない場合は、カーソル位置にリンクを挿入
        range.insertNode(link);
      }

      // 選択範囲をクリアして、リンクの後にカーソルを移動
      if (selection) {
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(link);
        newRange.collapse(true);
        selection.addRange(newRange);
      }

      this.wysiwygEditor.focus();
      
      // 同期をトリガー
      this.syncToMarkdown();
    }

    /**
     * WYSIWYGモードに切り替え
     */
    switchToWysiwyg() {
      console.log('[RichTextEditor] switchToWysiwyg called', { isWysiwygMode: this.isWysiwygMode });
      if (this.isWysiwygMode) return;

      // textareaの内容を取得してMarkdownからHTMLに変換
      const markdown = this.textareaEditor.value || '';
      const html = this.markdownToHtml(markdown);

      // WYSIWYGエディタに設定
      this.wysiwygEditor.innerHTML = html;

      // 表示を切り替え
      this.textareaEditor.style.display = 'none';
      this.wysiwygEditor.style.display = 'block';
      this.wysiwygToolbar.style.display = 'flex';
      this.isWysiwygMode = true;

      // フォーカスを移動
      this.wysiwygEditor.focus();

      // ツールバーボタンの状態を更新
      if (this.toggleWysiwygBtn) {
        this.toggleWysiwygBtn.setAttribute('aria-pressed', 'true');
      }
    }

    /**
     * textareaモードに切り替え
     */
    switchToTextarea() {
      console.log('[RichTextEditor] switchToTextarea called', { isWysiwygMode: this.isWysiwygMode });
      if (!this.isWysiwygMode) return;

      // WYSIWYGの内容を取得してHTMLからMarkdownに変換
      const html = this.wysiwygEditor.innerHTML || '';
      const markdown = this.htmlToMarkdown(html);

      // textareaに設定
      this.textareaEditor.value = markdown;

      // 表示を切り替え
      this.wysiwygEditor.style.display = 'none';
      this.wysiwygToolbar.style.display = 'none';
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
      }
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

      if (this.markdownRenderer) {
        try {
          return this.markdownRenderer.render(markdown);
        } catch (e) {
          console.warn('Markdown to HTML conversion failed:', e);
        }
      }

      // フォールバック: 基本的なエスケープ
      return markdown
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }

    /**
     * HTMLをMarkdownに変換
     */
    htmlToMarkdown(html) {
      if (!html) return '';

      if (this.turndownService) {
        try {
          return this.turndownService.turndown(html);
        } catch (e) {
          console.warn('HTML to Markdown conversion failed:', e);
        }
      }

      // フォールバック: 基本的な変換
      let markdown = html
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

      return markdown;
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
        window.richTextEditor = new RichTextEditor(window.ZenWriterEditor);
      }
    });
  } else {
    if (window.ZenWriterEditor) {
      window.richTextEditor = new RichTextEditor(window.ZenWriterEditor);
    }
  }
})();
