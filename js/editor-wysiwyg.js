/**
 * WYSIWYGエディタ管理クラス
 * contenteditableベースのリッチテキストエディタとMarkdownとの双方向変換を提供
 */
(function () {
  'use strict';

  class RichTextEditor {
    constructor(editorManager) {
      this.editorManager = editorManager;
      if (this.editorManager) {
        this.editorManager.richTextEditor = this;
      }
      this.textareaEditor = document.getElementById('editor');
      this.wysiwygEditor = document.getElementById('wysiwyg-editor');
      this.wysiwygToolbar = document.getElementById('wysiwyg-toolbar');
      this.toggleWysiwygBtn = document.getElementById('toggle-wysiwyg');
      this.switchToTextareaBtn = document.getElementById('wysiwyg-switch-to-textarea');
      this.isWysiwygMode = false;
      this.decorTagToClass = {
        bold: 'decor-bold',
        italic: 'decor-italic',
        underline: 'decor-underline',
        strike: 'decor-strikethrough',
        smallcaps: 'decor-smallcaps',
        light: 'decor-light',
        shadow: 'decor-shadow',
        black: 'decor-black',
        uppercase: 'decor-uppercase',
        lowercase: 'decor-lowercase',
        capitalize: 'decor-capitalize',
        outline: 'decor-outline',
        glow: 'decor-glow',
        wide: 'decor-wide',
        narrow: 'decor-narrow',
      };
      this.animTagToClass = {
        fade: 'anim-fade',
        slide: 'anim-slide',
        type: 'anim-typewriter',
        pulse: 'anim-pulse',
        shake: 'anim-shake',
        bounce: 'anim-bounce',
        fadein: 'anim-fade-in',
      };

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
      this.installTurndownRules();

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

    installTurndownRules() {
      if (!this.turndownService) return;
      const classToTag = {};
      Object.keys(this.decorTagToClass).forEach((tag) => {
        classToTag[this.decorTagToClass[tag]] = tag;
      });
      Object.keys(this.animTagToClass).forEach((tag) => {
        classToTag[this.animTagToClass[tag]] = tag;
      });

      this.turndownService.addRule('zwDecorAnimSpan', {
        filter(node) {
          return (
            node &&
            node.nodeName === 'SPAN' &&
            typeof node.getAttribute === 'function' &&
            !!node.getAttribute('class')
          );
        },
        replacement(content, node) {
          const className = String(node.getAttribute('class') || '')
            .split(/\s+/)
            .find((c) => !!classToTag[c]);
          if (!className) return content;
          const tag = classToTag[className];
          return `[${tag}]${content}[/${tag}]`;
        },
      });

      this.turndownService.addRule('zwUnderlineTag', {
        filter: 'u',
        replacement(content) {
          return `[underline]${content}[/underline]`;
        },
      });
    }

    notifyEditorChanged() {
      this.syncToMarkdown();
      if (this.editorManager) {
        this.editorManager.markDirty();
        this.editorManager.saveContent();
        this.editorManager.updateWordCount();
        this.editorManager.renderMarkdownPreview();
      }
    }

    notifySelectionRequired() {
      if (
        this.editorManager &&
        typeof this.editorManager.showNotification === 'function'
      ) {
        this.editorManager.showNotification('適用したいテキストを選択してください', 1800);
      }
    }

    getSelectionRangeInEditor() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
      const range = selection.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return null;
      return range;
    }

    applyClassToSelection(className) {
      if (!this.wysiwygEditor || !this.isWysiwygMode || !className) return false;
      this.wysiwygEditor.focus();

      const selection = window.getSelection();
      const range = this.getSelectionRangeInEditor();
      if (!range) {
        this.notifySelectionRequired();
        return false;
      }

      const selectedContent = range.extractContents();
      const wrapper = document.createElement('span');
      wrapper.className = className;
      wrapper.appendChild(selectedContent);
      range.insertNode(wrapper);

      if (selection) {
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(wrapper);
        newRange.collapse(true);
        selection.addRange(newRange);
      }

      this.wysiwygEditor.focus();
      this.notifyEditorChanged();
      return true;
    }

    applyTag(tag, kind = 'decor') {
      if (!this.isWysiwygMode) return false;

      if (kind === 'anim') {
        const animClass = this.animTagToClass[tag];
        return this.applyClassToSelection(animClass);
      }

      if (tag === 'bold' || tag === 'italic' || tag === 'underline') {
        return this.executeCommand(tag);
      }
      const decorClass = this.decorTagToClass[tag];
      return this.applyClassToSelection(decorClass);
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
      const range = this.getSelectionRangeInEditor();
      if (!range) {
        this.notifySelectionRequired();
        return false;
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
          this.notifyEditorChanged();
          return true;
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
      this.notifyEditorChanged();
      return true;
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
      this.notifyEditorChanged();
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
      const normalized = this.expandCustomTagsToHtml(markdown);

      if (this.markdownRenderer) {
        try {
          return this.markdownRenderer.render(normalized);
        } catch (e) {
          console.warn('Markdown to HTML conversion failed:', e);
        }
      }

      // フォールバック: 基本的なエスケープ
      return normalized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }

    expandCustomTagsToHtml(markdown) {
      let html = String(markdown || '');
      Object.keys(this.decorTagToClass).forEach((tag) => {
        const klass = this.decorTagToClass[tag];
        const re = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'gi');
        html = html.replace(re, `<span class="${klass}">$1</span>`);
      });
      Object.keys(this.animTagToClass).forEach((tag) => {
        const klass = this.animTagToClass[tag];
        const re = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'gi');
        html = html.replace(re, `<span class="${klass}">$1</span>`);
      });
      return html;
    }

    /**
     * HTMLをMarkdownに変換
     */
    htmlToMarkdown(html) {
      if (!html) return '';

      if (this.turndownService) {
        try {
          return this.turndownService.turndown(html).replace(/\n{3,}/g, '\n\n').trim();
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
        .replace(/<u>(.*?)<\/u>/gi, '[underline]$1[/underline]')
        .replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<span[^>]*class="[^"]*decor-bold[^"]*"[^>]*>(.*?)<\/span>/gi, '[bold]$1[/bold]')
        .replace(/<span[^>]*class="[^"]*decor-italic[^"]*"[^>]*>(.*?)<\/span>/gi, '[italic]$1[/italic]')
        .replace(/<span[^>]*class="[^"]*decor-underline[^"]*"[^>]*>(.*?)<\/span>/gi, '[underline]$1[/underline]')
        .replace(/<span[^>]*class="[^"]*decor-strikethrough[^"]*"[^>]*>(.*?)<\/span>/gi, '[strike]$1[/strike]')
        .replace(/<span[^>]*class="[^"]*decor-smallcaps[^"]*"[^>]*>(.*?)<\/span>/gi, '[smallcaps]$1[/smallcaps]')
        .replace(/<span[^>]*class="[^"]*decor-light[^"]*"[^>]*>(.*?)<\/span>/gi, '[light]$1[/light]')
        .replace(/<span[^>]*class="[^"]*decor-shadow[^"]*"[^>]*>(.*?)<\/span>/gi, '[shadow]$1[/shadow]')
        .replace(/<span[^>]*class="[^"]*decor-black[^"]*"[^>]*>(.*?)<\/span>/gi, '[black]$1[/black]')
        .replace(/<span[^>]*class="[^"]*decor-uppercase[^"]*"[^>]*>(.*?)<\/span>/gi, '[uppercase]$1[/uppercase]')
        .replace(/<span[^>]*class="[^"]*decor-lowercase[^"]*"[^>]*>(.*?)<\/span>/gi, '[lowercase]$1[/lowercase]')
        .replace(/<span[^>]*class="[^"]*decor-capitalize[^"]*"[^>]*>(.*?)<\/span>/gi, '[capitalize]$1[/capitalize]')
        .replace(/<span[^>]*class="[^"]*decor-outline[^"]*"[^>]*>(.*?)<\/span>/gi, '[outline]$1[/outline]')
        .replace(/<span[^>]*class="[^"]*decor-glow[^"]*"[^>]*>(.*?)<\/span>/gi, '[glow]$1[/glow]')
        .replace(/<span[^>]*class="[^"]*decor-wide[^"]*"[^>]*>(.*?)<\/span>/gi, '[wide]$1[/wide]')
        .replace(/<span[^>]*class="[^"]*decor-narrow[^"]*"[^>]*>(.*?)<\/span>/gi, '[narrow]$1[/narrow]')
        .replace(/<span[^>]*class="[^"]*anim-fade[^"]*"[^>]*>(.*?)<\/span>/gi, '[fade]$1[/fade]')
        .replace(/<span[^>]*class="[^"]*anim-slide[^"]*"[^>]*>(.*?)<\/span>/gi, '[slide]$1[/slide]')
        .replace(/<span[^>]*class="[^"]*anim-typewriter[^"]*"[^>]*>(.*?)<\/span>/gi, '[type]$1[/type]')
        .replace(/<span[^>]*class="[^"]*anim-pulse[^"]*"[^>]*>(.*?)<\/span>/gi, '[pulse]$1[/pulse]')
        .replace(/<span[^>]*class="[^"]*anim-shake[^"]*"[^>]*>(.*?)<\/span>/gi, '[shake]$1[/shake]')
        .replace(/<span[^>]*class="[^"]*anim-bounce[^"]*"[^>]*>(.*?)<\/span>/gi, '[bounce]$1[/bounce]')
        .replace(/<span[^>]*class="[^"]*anim-fade-in[^"]*"[^>]*>(.*?)<\/span>/gi, '[fadein]$1[/fadein]')
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
