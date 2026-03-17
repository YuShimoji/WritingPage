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

      // SP-055: カスタム Undo/Redo スタック
      this._undoStack = [];
      this._redoStack = [];
      this._undoMaxSize = 100;
      this._undoSnapshotTimer = null;
      this._undoLastSnapshot = '';
      this._lastCursorOffset = 0;
      this._undoBatchTimeout = 500; // ms — テキスト入力のバッチング間隔

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
        // 傍点 span.kenten → {kenten|...} 逆変換
        this.turndownService.addRule('kenten', {
          filter: function (node) {
            return node.nodeName === 'SPAN' && node.className === 'kenten';
          },
          replacement: function (content) {
            return '{kenten|' + content + '}';
          }
        });
        // SP-072: chapter-link → [text](chapter://target) 逆変換
        this.turndownService.addRule('chapterLink', {
          filter: function (node) {
            return node.nodeName === 'A' && node.classList.contains('chapter-link');
          },
          replacement: function (content, node) {
            var target = node.dataset.chapterTarget || '';
            return '[' + content + '](chapter://' + decodeURIComponent(target) + ')';
          }
        });
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

      // ドロップダウントグル (position: fixed で overflow clipping を回避)
      this.wysiwygToolbar.querySelectorAll('.wysiwyg-dropdown-toggle').forEach(function (toggle) {
        toggle.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var dropdown = toggle.closest('.wysiwyg-dropdown');
          var isOpen = dropdown.getAttribute('data-open') === 'true';
          // 他のドロップダウンを閉じる
          self.wysiwygToolbar.querySelectorAll('.wysiwyg-dropdown').forEach(function (d) {
            d.setAttribute('data-open', 'false');
          });
          if (!isOpen) {
            var menu = dropdown.querySelector('.wysiwyg-dropdown-menu');
            if (menu) {
              var btnRect = toggle.getBoundingClientRect();
              var menuLeft = btnRect.left + btnRect.width / 2;
              menu.style.top = (btnRect.bottom + 4) + 'px';
              menu.style.left = menuLeft + 'px';
              menu.style.transform = 'translateX(-50%)';
              // ビューポートクランプ（表示後に位置補正）
              requestAnimationFrame(function () {
                var menuRect = menu.getBoundingClientRect();
                var margin = 8;
                if (menuRect.left < margin) {
                  menu.style.left = (menuRect.width / 2 + margin) + 'px';
                }
                if (menuRect.right > window.innerWidth - margin) {
                  menu.style.left = (window.innerWidth - menuRect.width / 2 - margin) + 'px';
                }
              });
            }
          }
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

      // ブロック操作（見出し/リスト/引用）
      this.wysiwygToolbar.querySelectorAll('[data-block]').forEach(function (btn) {
        btn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var block = btn.getAttribute('data-block');
          if (block) self.executeCommand(block);
          var dd = btn.closest('.wysiwyg-dropdown');
          if (dd) dd.setAttribute('data-open', 'false');
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

    /** @private フローティングツールバーを選択範囲の近くに表示 (position: fixed) */
    _showFloatingToolbar(range) {
      var rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      // ツールバー幅を正確に測定するため、一旦画面外に表示
      if (!this._floatingVisible) {
        this.wysiwygToolbar.style.top = '-9999px';
        this.wysiwygToolbar.style.left = '-9999px';
        this.wysiwygToolbar.setAttribute('data-visible', 'true');
      }

      var toolbarH = 44;
      var gap = 8;
      var top, left;
      var vpW = window.innerWidth;

      var tbRect = this.wysiwygToolbar.getBoundingClientRect();
      var tbW = tbRect.width || 300;
      toolbarH = tbRect.height || toolbarH;

      // 選択範囲の上にビューポート余白があれば上、なければ下
      if (rect.top > toolbarH + gap) {
        top = rect.top - toolbarH - gap;
      } else {
        top = rect.bottom + gap;
      }
      left = rect.left + rect.width / 2;

      var margin = 12;

      // サイドバーが開いている場合、左端をサイドバー右端に制限
      var sidebarEl = document.querySelector('.sidebar.open');
      var leftBound = margin;
      if (sidebarEl) {
        leftBound = sidebarEl.getBoundingClientRect().right + margin;
      }

      // 左端クランプ: translateX(-50%) を考慮
      if (left - tbW / 2 < leftBound) {
        left = tbW / 2 + leftBound;
      }
      // 右端クランプ
      if (left + tbW / 2 > vpW - margin) {
        left = vpW - tbW / 2 - margin;
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

    // ─── Typewriter Mode ──────────────────────────────────
    /** @private タイプライター設定を読み込む */
    _getTypewriterConfig() {
      var s = window.ZenWriterStorage && window.ZenWriterStorage.loadSettings();
      var tw = (s && s.typewriter) || {};
      return {
        enabled: !!tw.enabled,
        anchorRatio: typeof tw.anchorRatio === 'number' ? tw.anchorRatio : 0.5,
        stickiness: typeof tw.stickiness === 'number' ? tw.stickiness : 0.9,
      };
    }

    /** タイプライターモードを有効化/無効化する (ガジェットから呼ばれる) */
    applyTypewriterIfEnabled() {
      var cfg = this._getTypewriterConfig();
      if (cfg.enabled && this.isWysiwygMode) {
        this._enableTypewriter(cfg);
      } else {
        this._disableTypewriter();
      }
    }

    /** @private タイプライターモードを有効化 */
    _enableTypewriter(cfg) {
      if (this._twEnabled) return; // 既に有効
      this._twEnabled = true;
      this._twCfg = cfg;
      var self = this;

      this._twHandler = function () {
        requestAnimationFrame(function () { self._scrollCursorToAnchor(); });
      };
      this.wysiwygEditor.addEventListener('input', this._twHandler);
      this.wysiwygEditor.addEventListener('keyup', this._twHandler);
      this.wysiwygEditor.addEventListener('click', this._twHandler);

      // 上下余白を追加してカーソルがアンカー位置に到達できるようにする
      this.wysiwygEditor.style.paddingBottom = 'calc(100vh * ' + cfg.anchorRatio + ')';
      this.wysiwygEditor.setAttribute('data-typewriter', 'true');
    }

    /** @private タイプライターモードを無効化 */
    _disableTypewriter() {
      if (!this._twEnabled) return;
      this._twEnabled = false;
      if (this._twHandler) {
        this.wysiwygEditor.removeEventListener('input', this._twHandler);
        this.wysiwygEditor.removeEventListener('keyup', this._twHandler);
        this.wysiwygEditor.removeEventListener('click', this._twHandler);
        this._twHandler = null;
      }
      this.wysiwygEditor.style.paddingBottom = '';
      this.wysiwygEditor.removeAttribute('data-typewriter');
    }

    /** @private カーソル行をアンカー位置にスクロール */
    _scrollCursorToAnchor() {
      if (!this._twEnabled || !this.wysiwygEditor) return;
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      var range = sel.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return;

      // カーソル位置の座標を取得
      var rects = range.getClientRects();
      var cursorRect = rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();
      if (!cursorRect || (cursorRect.height === 0 && cursorRect.width === 0)) return;

      var editorRect = this.wysiwygEditor.getBoundingClientRect();
      var viewH = editorRect.height;
      var anchorY = viewH * this._twCfg.anchorRatio;

      // カーソルのエディタ内相対Y座標
      var cursorRelY = cursorRect.top - editorRect.top + cursorRect.height / 2;
      var delta = cursorRelY - anchorY;

      if (Math.abs(delta) < 2) return; // 微小差は無視

      var stickiness = this._twCfg.stickiness;
      var scrollDelta = delta * stickiness;
      this.wysiwygEditor.scrollTop += scrollDelta;
    }

    /**
     * WYSIWYGエディタのイベント設定
     */
    setupWysiwygEditorEvents() {
      if (!this.wysiwygEditor) return;

      // SP-072: chapter:// リンクのクリックナビゲーション
      this.wysiwygEditor.addEventListener('click', (e) => {
        var link = e.target.closest('.chapter-link');
        if (link) {
          e.preventDefault();
          var target = decodeURIComponent(link.dataset.chapterTarget || '');
          if (target && window.ZWChapterNav) {
            // chapter-nav.js の resolveAndNavigate は非公開なので直接呼ぶ
            if (window.ZWChapterList && typeof window.ZWChapterList.navigateTo === 'function') {
              var chapters = window.ZWChapterList.getChapters();
              for (var i = 0; i < chapters.length; i++) {
                if (chapters[i].title.toLowerCase().trim() === target.toLowerCase().trim() ||
                    chapters[i].id === target) {
                  window.ZWChapterList.navigateTo(i);
                  break;
                }
              }
            }
          }
        }
      });

      // 入力時の自動保存とプレビュー更新
      this.wysiwygEditor.addEventListener('input', () => {
        this._scheduleUndoSnapshot();
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
        this._captureUndoSnapshot(); // ペースト前にスナップショット
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
        this._captureUndoSnapshot(); // ペースト後もキャプチャ
      });

      // キーボードショートカット
      this.wysiwygEditor.addEventListener('keydown', (e) => {
        // Ctrl+Z: Undo (カスタム)
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
          e.preventDefault();
          this._undoAction();
          return;
        }
        // Ctrl+Shift+Z / Ctrl+Y: Redo (カスタム)
        if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'z') || e.key === 'y')) {
          e.preventDefault();
          this._redoAction();
          return;
        }
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
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return;

      // SP-055: フォーマットコマンド前にスナップショット（アトミックなUndo単位）
      this._captureUndoSnapshot();

      // execCommand は選択なし (collapsed) でもプリフォーマットとして機能する
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

      // SP-055: カスタム装飾前にスナップショット（アトミックなUndo単位）
      this._captureUndoSnapshot();

      this.wysiwygEditor.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return;

      // プリフォーマット: 選択なしの場合、空SPANを挿入してカーソルを中に配置
      if (selection.isCollapsed) {
        // カーソル位置の親が同クラスSPANなら、SPANの外にカーソルを移動（トグルOFF）
        const curNode = range.startContainer;
        const curEl = curNode.nodeType === Node.TEXT_NODE ? curNode.parentElement : curNode;
        if (curEl && curEl.tagName === 'SPAN' && curEl.classList.contains(className)) {
          const afterRange = document.createRange();
          afterRange.setStartAfter(curEl);
          afterRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(afterRange);
        } else {
          const span = document.createElement('span');
          span.className = className;
          span.textContent = '\u200B'; // ゼロ幅スペース
          range.insertNode(span);
          const innerRange = document.createRange();
          innerRange.setStart(span.firstChild, 1);
          innerRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(innerRange);
        }
        this.wysiwygEditor.focus();
        return;
      }

      // トグル: 選択範囲の親が同クラスのspanならアンラップ
      const ancestor = range.commonAncestorContainer;
      const parentEl = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : ancestor;
      var targetNode = null; // 操作後に選択を復元するためのノード
      if (parentEl && parentEl.tagName === 'SPAN' && parentEl.classList.contains(className)) {
        const fragment = document.createDocumentFragment();
        while (parentEl.firstChild) fragment.appendChild(parentEl.firstChild);
        targetNode = fragment.firstChild;
        var lastChild = fragment.lastChild;
        parentEl.parentNode.replaceChild(fragment, parentEl);
        // アンラップしたテキスト全体を再選択
        if (targetNode && lastChild) {
          const newRange = document.createRange();
          newRange.setStartBefore(targetNode);
          newRange.setEndAfter(lastChild);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        try {
          const span = document.createElement('span');
          span.className = className;
          range.surroundContents(span);
          targetNode = span;
        } catch (_) {
          // surroundContentsは部分選択で失敗する場合がある
          const span = document.createElement('span');
          span.className = className;
          span.appendChild(range.extractContents());
          range.insertNode(span);
          targetNode = span;
        }
        // ラップしたspan内のテキストを選択状態に復元
        if (targetNode) {
          const newRange = document.createRange();
          newRange.selectNodeContents(targetNode);
          selection.removeAllRanges();
          selection.addRange(newRange);
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

      const savedRange = range.cloneRange();
      const selectedText = selection.toString().trim();
      const self = this;

      this._showLinkInsertModal(savedRange, selectedText, function (url, isChapterLink) {
        self.wysiwygEditor.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);

        const link = document.createElement('a');
        if (isChapterLink) {
          link.href = '#';
          link.className = 'chapter-link';
          link.dataset.chapterTarget = encodeURIComponent(url);
        } else {
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.className = 'external-link';
        }
        link.textContent = selectedText || url;

        savedRange.deleteContents();
        savedRange.insertNode(link);

        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(link);
        newRange.collapse(true);
        sel.addRange(newRange);

        self.wysiwygEditor.focus();
        self.syncToMarkdown();
      });
    }

    _showLinkInsertModal(savedRange, selectedText, onConfirm) {
      // 既存モーダルを閉じる
      this._closeLinkInsertModal();

      const modal = document.createElement('div');
      modal.className = 'link-insert-modal';

      // 位置をカーソル付近に配置
      const rect = savedRange.getBoundingClientRect();
      modal.style.left = Math.min(rect.left, window.innerWidth - 340) + 'px';
      modal.style.top = (rect.bottom + 8) + 'px';

      // ヘッダー
      const header = document.createElement('div');
      header.className = 'link-insert-modal__header';
      header.textContent = '\u30ea\u30f3\u30af\u633f\u5165';
      modal.appendChild(header);

      // URL入力欄
      const inputRow = document.createElement('div');
      inputRow.className = 'link-insert-modal__input-row';
      const input = document.createElement('input');
      input.className = 'link-insert-modal__input';
      input.type = 'text';
      input.placeholder = 'URL\u3092\u5165\u529b (https://...)';
      inputRow.appendChild(input);
      // 外部リンクヒント（URL入力時に表示）
      const extHint = document.createElement('div');
      extHint.className = 'link-insert-modal__ext-hint';
      extHint.textContent = '\u5916\u90e8\u30ea\u30f3\u30af: \u65b0\u898f\u30bf\u30d6\u3067\u958b\u304d\u307e\u3059';
      extHint.style.display = 'none';
      inputRow.appendChild(extHint);
      modal.appendChild(inputRow);

      // 仕切り
      const divider = document.createElement('div');
      divider.className = 'link-insert-modal__divider';
      divider.textContent = '\u2014\u2014 \u307e\u305f\u306f\u7ae0\u30ea\u30f3\u30af \u2014\u2014';
      modal.appendChild(divider);

      // 章リスト
      const chaptersEl = document.createElement('div');
      chaptersEl.className = 'link-insert-modal__chapters';
      modal.appendChild(chaptersEl);

      // ChapterStoreから全章取得（draft含む）
      const allChapters = this._getAllChaptersForLinkModal();

      if (allChapters.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'link-insert-modal__empty';
        empty.textContent = '\u7ae0\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093';
        chaptersEl.appendChild(empty);
      } else {
        const self = this;
        allChapters.forEach(function (ch) {
          const item = document.createElement('div');
          item.className = 'link-insert-modal__chapter-item';
          if (ch.visibility === 'draft') item.classList.add('link-insert-modal__chapter-item--draft');
          if (ch.visibility === 'hidden') item.classList.add('link-insert-modal__chapter-item--hidden');

          item.textContent = ch.title || ch.name || '(untitled)';

          if (ch.visibility && ch.visibility !== 'visible') {
            const badge = document.createElement('span');
            badge.className = 'link-insert-modal__visibility-badge';
            badge.textContent = ch.visibility;
            item.appendChild(badge);
          }

          item.addEventListener('click', function () {
            self._closeLinkInsertModal();
            onConfirm(ch.title || ch.id, true);
          });
          chaptersEl.appendChild(item);
        });
      }

      // 危険なURLスキームの検証
      const isDangerousUrl = (url) => /^\s*(javascript|data|vbscript):/i.test(url);
      const isExternalUrl = (url) => /^https?:\/\//i.test(url);

      // URL入力のEnterキー確定
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = input.value.trim();
          if (val && !isDangerousUrl(val)) {
            this._closeLinkInsertModal();
            onConfirm(val, false);
          }
        }
        if (e.key === 'Escape') {
          this._closeLinkInsertModal();
        }
      });

      // フィルタリング + 外部リンクヒント表示
      input.addEventListener('input', () => {
        const q = input.value.trim();
        const qLower = q.toLowerCase();
        const items = chaptersEl.querySelectorAll('.link-insert-modal__chapter-item');
        items.forEach(function (it) {
          if (!q || it.textContent.toLowerCase().includes(qLower)) {
            it.style.display = '';
          } else {
            it.style.display = 'none';
          }
        });
        // 外部URLヒント表示
        extHint.style.display = isExternalUrl(q) ? '' : 'none';
        // 危険なURL警告
        if (isDangerousUrl(q)) {
          extHint.textContent = '\u5371\u967a\u306aURL\u30b9\u30ad\u30fc\u30e0\u3067\u3059';
          extHint.style.display = '';
          extHint.classList.add('link-insert-modal__ext-hint--warn');
        } else {
          extHint.textContent = '\u5916\u90e8\u30ea\u30f3\u30af: \u65b0\u898f\u30bf\u30d6\u3067\u958b\u304d\u307e\u3059';
          extHint.classList.remove('link-insert-modal__ext-hint--warn');
        }
      });

      // 外部クリックで閉じる
      this._linkModalCloseHandler = (e) => {
        if (!modal.contains(e.target)) {
          this._closeLinkInsertModal();
        }
      };
      setTimeout(() => document.addEventListener('mousedown', this._linkModalCloseHandler), 0);

      document.body.appendChild(modal);
      this._linkInsertModal = modal;
      input.focus();
    }

    _getAllChaptersForLinkModal() {
      var Store = window.ZWChapterStore;
      var S = window.ZenWriterStorage;
      var docId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
      if (docId && Store && typeof Store.isChapterMode === 'function' && Store.isChapterMode(docId)) {
        return (Store.getChaptersForDoc(docId) || []).map(function (sc) {
          return { id: sc.id, title: sc.name || '', visibility: sc.visibility || 'visible' };
        });
      }
      // Legacy fallback
      if (window.ZWChapterNav && typeof window.ZWChapterNav.getVisibleChapters === 'function') {
        return window.ZWChapterNav.getVisibleChapters();
      }
      return [];
    }

    _closeLinkInsertModal() {
      if (this._linkInsertModal) {
        this._linkInsertModal.remove();
        this._linkInsertModal = null;
      }
      if (this._linkModalCloseHandler) {
        document.removeEventListener('mousedown', this._linkModalCloseHandler);
        this._linkModalCloseHandler = null;
      }
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

      // SP-055: Undoスタック初期化
      this._undoStack = [];
      this._redoStack = [];
      this._undoLastSnapshot = this.wysiwygEditor.innerHTML;
      this._lastCursorOffset = 0;

      // タイプライターモードの状態を同期
      this.applyTypewriterIfEnabled();
    }

    /**
     * Undoスタックをリセットする（章切替時などに使用）
     */
    resetUndoStack() {
      this._undoStack = [];
      this._redoStack = [];
      clearTimeout(this._undoSnapshotTimer);
      if (this.isWysiwygMode && this.wysiwygEditor) {
        this._undoLastSnapshot = this.wysiwygEditor.innerHTML;
      }
      this._lastCursorOffset = 0;
    }

    /**
     * textareaモードに切り替え (ソース表示)
     */
    switchToTextarea() {
      if (!this.isWysiwygMode) return;

      // SP-052 Phase 2: コラプスをクリアしてから変換
      var sc = window.ZWSectionCollapse;
      if (sc && sc.clear) sc.clear();

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

      // タイプライターモードを無効化
      this._disableTypewriter();
    }

    /**
     * WYSIWYGの内容をMarkdownに同期（内部使用）
     */
    syncToMarkdown() {
      if (!this.isWysiwygMode || !this.textareaEditor) return;

      // SP-052 Phase 2: コラプスマーカーを一時除去してから変換
      var sc = window.ZWSectionCollapse;
      var wasActive = sc && sc.isActive && sc.isActive();
      if (wasActive && sc.clear) sc.clear();

      const html = this.wysiwygEditor.innerHTML || '';
      const markdown = this.htmlToMarkdown(html);
      this.textareaEditor.value = markdown;

      // コラプス状態を復元
      if (wasActive && sc && sc.reapply) sc.reapply();
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

      // SP-059 Phase 3: {kenten|text} → <span class="kenten">text</span>
      html = html.replace(/\{kenten\|([^{}|]+)\}/g, function (_m, text) {
        return '<span class="kenten">' + text.trim() + '</span>';
      });

      // SP-072: chapter:// リンク変換
      if (window.ZWChapterNav && typeof window.ZWChapterNav.convertChapterLinks === 'function') {
        html = window.ZWChapterNav.convertChapterLinks(html);
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

    // ---- SP-055: Undo/Redo スタック管理 ----

    /**
     * デバウンスされたスナップショット取得（テキスト入力用）。
     * 連続入力を1つのUndo単位にバッチングする。
     */
    _scheduleUndoSnapshot() {
      clearTimeout(this._undoSnapshotTimer);
      this._undoSnapshotTimer = setTimeout(() => {
        this._captureUndoSnapshot();
      }, this._undoBatchTimeout);
    }

    /**
     * 現在のcontenteditable状態をUndoスタックに即時キャプチャ。
     * フォーマットコマンド・ペースト等のアトミック操作前に呼ぶ。
     */
    _captureUndoSnapshot() {
      clearTimeout(this._undoSnapshotTimer);
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;

      var current = this.wysiwygEditor.innerHTML;
      if (current === this._undoLastSnapshot) return; // 変化なし

      var cursorPos = this._getCursorOffset();
      this._undoStack.push({
        html: this._undoLastSnapshot,
        cursorOffset: this._lastCursorOffset || 0
      });
      if (this._undoStack.length > this._undoMaxSize) {
        this._undoStack.shift();
      }
      this._undoLastSnapshot = current;
      this._lastCursorOffset = cursorPos;
      this._redoStack = []; // 新しい操作でRedoをクリア
    }

    /**
     * Undo実行
     */
    _undoAction() {
      if (!this.wysiwygEditor || this._undoStack.length === 0) return;

      // 現在の状態を保存してから一つ前の操作に戻す
      this._captureUndoSnapshot();
      // captureで現在の状態がpushされたので、それをredoに移す
      var current = this._undoStack.pop();
      if (current !== undefined) {
        this._redoStack.push({
          html: this._undoLastSnapshot,
          cursorOffset: this._lastCursorOffset || 0
        });
      }

      var prevSnapshot = this._undoStack.length > 0
        ? this._undoStack.pop()
        : { html: this._undoLastSnapshot, cursorOffset: 0 };

      // 後方互換: 旧フォーマット (plain string) にも対応
      var prevHtml = typeof prevSnapshot === 'string' ? prevSnapshot : prevSnapshot.html;
      var prevCursor = typeof prevSnapshot === 'string' ? 0 : (prevSnapshot.cursorOffset || 0);

      this.wysiwygEditor.innerHTML = prevHtml;
      this._undoLastSnapshot = prevHtml;
      this._lastCursorOffset = prevCursor;
      this._restoreCursorOffset(prevCursor);
      this.syncToMarkdown();
      this._notifyChange();
    }

    /**
     * Redo実行
     */
    _redoAction() {
      if (!this.wysiwygEditor || this._redoStack.length === 0) return;

      this._undoStack.push({
        html: this._undoLastSnapshot,
        cursorOffset: this._lastCursorOffset || 0
      });
      var nextSnapshot = this._redoStack.pop();

      // 後方互換: 旧フォーマット (plain string) にも対応
      var nextHtml = typeof nextSnapshot === 'string' ? nextSnapshot : nextSnapshot.html;
      var nextCursor = typeof nextSnapshot === 'string' ? 0 : (nextSnapshot.cursorOffset || 0);

      this.wysiwygEditor.innerHTML = nextHtml;
      this._undoLastSnapshot = nextHtml;
      this._lastCursorOffset = nextCursor;
      this._restoreCursorOffset(nextCursor);
      this.syncToMarkdown();
      this._notifyChange();
    }

    /**
     * エディタ内のカーソル位置を文字オフセットとして取得
     */
    _getCursorOffset() {
      if (!this.wysiwygEditor) return 0;
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return 0;

      var range = sel.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return 0;

      try {
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(this.wysiwygEditor);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
      } catch (_) {
        return 0;
      }
    }

    /**
     * 文字オフセットからカーソル位置を復元
     */
    _restoreCursorOffset(offset) {
      if (!this.wysiwygEditor || offset <= 0) return;

      var sel = window.getSelection();
      if (!sel) return;

      try {
        var charCount = 0;
        var range = document.createRange();
        range.setStart(this.wysiwygEditor, 0);
        range.collapse(true);

        var nodeStack = [this.wysiwygEditor];
        var node, foundStart = false;

        while (!foundStart && (node = nodeStack.pop())) {
          if (node.nodeType === Node.TEXT_NODE) {
            var nextCharCount = charCount + node.length;
            if (offset <= nextCharCount) {
              range.setStart(node, offset - charCount);
              foundStart = true;
            }
            charCount = nextCharCount;
          } else {
            // 子ノードを逆順にスタックへ (前方から走査するため)
            var i = node.childNodes.length;
            while (i--) {
              nodeStack.push(node.childNodes[i]);
            }
          }
        }

        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (_) {
        // カーソル復元失敗時は末尾にフォールバック
      }
    }

    /**
     * Undo/Redo後の同期通知
     */
    _notifyChange() {
      if (this.editorManager) {
        this.editorManager.markDirty();
        this.editorManager.saveContent();
        this.editorManager.updateWordCount();
        this.editorManager.renderMarkdownPreview();
      }
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
