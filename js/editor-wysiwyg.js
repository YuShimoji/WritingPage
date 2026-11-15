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

      // SP-073 Phase 2: PathHandleOverlay
      this._pathOverlay = null;

      // SP-055: カスタム Undo/Redo スタック
      this._undoStack = [];
      this._redoStack = [];
      this._undoMaxSize = 100;
      this._undoSnapshotTimer = null;
      this._undoLastSnapshot = '';
      this._lastCursorOffset = 0;
      this._undoBatchTimeout = 500; // ms — テキスト入力のバッチング間隔
      this._isComposing = false;
      this._pendingTypedHeadingShortcut = false;
      this._imeRepaintFrame = null;

      // Turndownインスタンス（HTML → Markdown変換）。カスタムルールは RichTextTurndownRules が担当
      this.turndownService = null;
      const TurndownCtor = typeof TurndownService !== 'undefined' ? TurndownService : window.TurndownService;
      if (typeof TurndownCtor === 'function') {
        this.turndownService = new TurndownCtor({
          headingStyle: 'atx',
          blankReplacement: (_content, node) => this._replaceBlankNode(node),
          codeBlockStyle: 'fenced',
          bulletListMarker: '-',
          emDelimiter: '*',
          strongDelimiter: '**'
        });
        if (window.RichTextTurndownRules && typeof window.RichTextTurndownRules.install === 'function') {
          window.RichTextTurndownRules.install(this.turndownService);
        } else {
          console.warn('RichTextTurndownRules is not loaded; Markdown round-trip rules for decorations are disabled.');
        }
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

    _replaceBlankNode(node) {
      const state = this._emptyHeadingSerialization;
      if (state && /^H[1-6]$/.test(node.nodeName || '')) {
        if (!state.initialized) {
          const text = node.ownerDocument.documentElement.textContent || '';
          const parsedHtml = node.ownerDocument.documentElement.outerHTML || '';
          while (state.html.includes(state.prefix) || text.includes(state.prefix) || parsedHtml.includes(state.prefix)) state.prefix += 'X';
          state.initialized = true;
        }
        const index = state.levels.push(Number(node.nodeName.slice(1))) - 1;
        return '\n\n' + state.prefix + index + 'END\n\n';
      }
      return node.isBlock ? '\n\n' : '';
    }

    _turndownKeepingEmptyHeadings(html) {
      // Turndown handles blank nodes before custom rules and trims trailing spaces.
      // Protect only actual empty heading nodes, then restore the chapter separator.
      const previous = this._emptyHeadingSerialization;
      const state = { html, prefix: 'ZWEMPTYHEADING', levels: [], initialized: false };
      this._emptyHeadingSerialization = state;
      try {
        const markdown = this.turndownService.turndown(html);
        if (state.levels.length === 0) return markdown;
        return markdown.replace(new RegExp(state.prefix + '(\\d+)END', 'g'), (_token, index) => {
          return '#'.repeat(state.levels[Number(index)]) + ' ';
        });
      } finally {
        this._emptyHeadingSerialization = previous;
      }
    }

    /**
     * 初期化
     */
    init() {
      if (!this.wysiwygEditor || !this.textareaEditor) return;

      this._disableNativeWysiwygSpellcheck();

      // エディタ切り替えボタン: 双方向トグル（Markdown ソースへは開発者モード時のみ）
      if (this.toggleWysiwygBtn) {
        this.toggleWysiwygBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (this.isWysiwygMode) {
            if (!this._isDeveloperModeEnabled()) {
              this._notifyMarkdownSourceLocked();
              return;
            }
            this.switchToTextarea();
          } else {
            this.switchToWysiwyg();
          }
        });
      }

      if (this.switchToTextareaBtn) {
        this.switchToTextareaBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (!this._isDeveloperModeEnabled()) {
            this._notifyMarkdownSourceLocked();
            return;
          }
          this.switchToTextarea();
        });
      }

      // 縦書き/横書き: 保存された設定を復元
      try {
        if (localStorage.getItem('zenwriter-vertical-writing') === 'true') {
          this._setVerticalWriting(true);
        }
      } catch (_) { /* noop */ }

      // textarea モードからの復帰ボタン
      this.textareaModeBar = document.getElementById('textarea-mode-bar');
      var backBtn = document.getElementById('textarea-back-to-wysiwyg');
      if (backBtn) {
        backBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.switchToWysiwyg();
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

    _disableNativeWysiwygSpellcheck() {
      if (!this.wysiwygEditor) return;
      this.wysiwygEditor.setAttribute('spellcheck', 'false');
      this.wysiwygEditor.spellcheck = false;
    }

    /**
     * 起動時にWYSIWYGモードを自動有効化
     * ポリシー: `zenwriter-wysiwyg-mode` が 'false' のときのみ Markdown のまま。未設定はリッチ編集へ（INTERACTION_NOTES WP-004 Phase 2）
     */
    autoEnableWysiwyg() {
      const saved = localStorage.getItem('zenwriter-wysiwyg-mode');
      var dev = this._isDeveloperModeEnabled();
      // 一般ユーザーは Markdown 固定を許さずリッチ編集へ寄せる
      var shouldEnable = saved !== 'false' || !dev;
      if (!dev && saved === 'false') {
        try { localStorage.setItem('zenwriter-wysiwyg-mode', 'true'); } catch (_) { /* noop */ }
        shouldEnable = true;
      }
      if (shouldEnable) {
        requestAnimationFrame(() => this.switchToWysiwyg());
      }
    }

    _isDeveloperModeEnabled() {
      return !!(window.ZenWriterDeveloperMode && typeof window.ZenWriterDeveloperMode.isEnabled === 'function' &&
        window.ZenWriterDeveloperMode.isEnabled());
    }

    _notifyMarkdownSourceLocked() {
      try {
        if (this.editorManager && typeof this.editorManager.showNotification === 'function') {
          this.editorManager.showNotification('Markdown ソース表示は開発者モード時のみ利用できます', 2200);
        }
      } catch (_) { /* noop */ }
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

      // ルビ挿入/編集ボタン
      var rubyBtn = document.getElementById('wysiwyg-ruby');
      if (rubyBtn) {
        rubyBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this._handleRubyAction();
        });
      }

      // 傍点ボタン
      var kentenBtn = document.getElementById('wysiwyg-kenten');
      if (kentenBtn) {
        kentenBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this._handleKentenAction();
        });
      }

      // WYSIWYG内のルビクリックで編集ポップアップ / 傍点クリックで解除
      if (this.wysiwygEditor) {
        this.wysiwygEditor.addEventListener('click', (e) => {
          var rubyEl = e.target.closest('ruby');
          if (rubyEl && this.isWysiwygMode) {
            e.preventDefault();
            this._showRubyEditPopup(rubyEl);
            return;
          }
          var kentenEl = e.target.closest('.kenten');
          if (kentenEl && this.isWysiwygMode) {
            e.preventDefault();
            this._showKentenRemovePopup(kentenEl);
          }
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
          var classMap = { fade: 'anim-fade', slide: 'anim-slide', type: 'anim-typewriter', pulse: 'anim-pulse', shake: 'anim-shake', bounce: 'anim-bounce', fadein: 'anim-fade-in', wave: 'tex-wave', sparkle: 'tex-sparkle', cosmic: 'tex-cosmic', fire: 'tex-fire', glitch: 'tex-glitch' };
          if (tag && classMap[tag]) self.wrapSelectionWithSpan(classMap[tag]);
          btn.closest('.wysiwyg-dropdown').setAttribute('data-open', 'false');
        });
      });

      // ブロック操作（見出し/リスト/引用）
      this.wysiwygToolbar.querySelectorAll('[data-block]').forEach(function (btn) {
        btn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var block = btn.getAttribute('data-block');
          if (block === 'ul') {
            self.executeCommand('insertUnorderedList');
          } else if (block === 'ol') {
            self.executeCommand('insertOrderedList');
          } else if (block) {
            self.executeCommand('formatBlock', '<' + block + '>');
          }
          var dd = btn.closest('.wysiwyg-dropdown');
          if (dd) dd.setAttribute('data-open', 'false');
        });
      });

      // オーバーフローメニュー項目
      this.wysiwygToolbar.querySelectorAll('[data-overflow]').forEach(function (btn) {
        btn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var action = btn.getAttribute('data-overflow');
          if (action === 'vertical-toggle') self._toggleVerticalWriting();
          if (action === 'switch-textarea') {
            if (!self._isDeveloperModeEnabled()) {
              self._notifyMarkdownSourceLocked();
            } else {
              self.switchToTextarea();
            }
          }
          if (action === 'align-start') self.executeCommand('alignstart');
          if (action === 'align-center') self.executeCommand('aligncenter');
          if (action === 'align-end') self.executeCommand('alignend');
          var dd = btn.closest('.wysiwyg-dropdown');
          if (dd) dd.setAttribute('data-open', 'false');
        });
      });

      // テキストボックスプリセットドロップダウン (Phase 3)
      this._setupTextboxDropdown();

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
     * テキストボックスプリセットドロップダウンの初期化 (SP-016 Phase 3)
     */
    _setupTextboxDropdown() {
      if (!this.wysiwygToolbar) return;
      var self = this;
      var tbDropdown = this.wysiwygToolbar.querySelector('[data-dropdown="textbox"]');
      if (!tbDropdown) return;
      var tbMenu = tbDropdown.querySelector('.wysiwyg-dropdown-menu');
      if (!tbMenu) return;

      // テキストボックス機能が無効の場合は非表示
      function isTextboxEnabled() {
        try {
          var s = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
            ? window.ZenWriterStorage.loadSettings() : {};
          return !!(s && s.editor && s.editor.extendedTextbox && s.editor.extendedTextbox.enabled);
        } catch (_) { return false; }
      }

      function buildMenu() {
        tbMenu.innerHTML = '';
        var settings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
          ? window.ZenWriterStorage.loadSettings() : {};
        var registry = window.TextboxPresetRegistry;
        var presets = registry && typeof registry.list === 'function' ? registry.list(settings) : [];

        // 解除ボタン
        var removeBtn = document.createElement('button');
        removeBtn.setAttribute('role', 'menuitem');
        removeBtn.className = 'wysiwyg-tb-item wysiwyg-tb-item--remove';
        removeBtn.textContent = 'テキストボックス解除';
        removeBtn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          self._unwrapTextbox();
          tbDropdown.setAttribute('data-open', 'false');
        });
        tbMenu.appendChild(removeBtn);

        presets.forEach(function (preset) {
          var btn = document.createElement('button');
          btn.setAttribute('role', 'menuitem');
          btn.className = 'wysiwyg-tb-item';
          btn.dataset.tbPreset = preset.id;
          var labelSpan = document.createElement('span');
          labelSpan.className = 'wysiwyg-tb-label';
          labelSpan.textContent = preset.label;
          var roleSpan = document.createElement('span');
          roleSpan.className = 'wysiwyg-tb-role';
          roleSpan.textContent = preset.role;
          btn.appendChild(labelSpan);
          btn.appendChild(roleSpan);
          btn.addEventListener('mousedown', function (e) {
            e.preventDefault();
            self._applyTextboxPreset(preset);
            tbDropdown.setAttribute('data-open', 'false');
          });
          tbMenu.appendChild(btn);
        });

        // 演出ブロック挿入セクション (SP-074 Phase 3)
        var sep = document.createElement('div');
        sep.className = 'wysiwyg-tb-separator';
        tbMenu.appendChild(sep);

        var typingBtn = document.createElement('button');
        typingBtn.setAttribute('role', 'menuitem');
        typingBtn.className = 'wysiwyg-tb-item wysiwyg-tb-item--effect';
        typingBtn.textContent = 'タイピング演出を挿入';
        typingBtn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          tbDropdown.setAttribute('data-open', 'false');
          self._showDslModal('typing', function (attrs) {
            self._insertTypingBlock(attrs);
          });
        });
        tbMenu.appendChild(typingBtn);

        var dialogBtn = document.createElement('button');
        dialogBtn.setAttribute('role', 'menuitem');
        dialogBtn.className = 'wysiwyg-tb-item wysiwyg-tb-item--effect';
        dialogBtn.textContent = 'ダイアログを挿入';
        dialogBtn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          tbDropdown.setAttribute('data-open', 'false');
          self._showDslModal('dialog', function (attrs) {
            self._insertDialogBlock(attrs);
          });
        });
        tbMenu.appendChild(dialogBtn);

        var scrollBtn = document.createElement('button');
        scrollBtn.setAttribute('role', 'menuitem');
        scrollBtn.className = 'wysiwyg-tb-item wysiwyg-tb-item--effect';
        scrollBtn.textContent = 'スクロール演出を挿入';
        scrollBtn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          tbDropdown.setAttribute('data-open', 'false');
          self._showDslModal('scroll', function (attrs) {
            self._insertScrollBlock(attrs);
          });
        });
        tbMenu.appendChild(scrollBtn);

        var pathtextBtn = document.createElement('button');
        pathtextBtn.setAttribute('role', 'menuitem');
        pathtextBtn.className = 'wysiwyg-tb-item wysiwyg-tb-item--effect';
        pathtextBtn.textContent = 'パステキストを挿入';
        pathtextBtn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          tbDropdown.setAttribute('data-open', 'false');
          self._showDslModal('pathtext', function (attrs) {
            self._insertPathtextBlock(attrs);
          });
        });
        tbMenu.appendChild(pathtextBtn);
      }

      // トグル開閉時にメニューを再構築
      var toggle = tbDropdown.querySelector('.wysiwyg-dropdown-toggle');
      if (toggle) {
        var origListener = toggle._tbMenuListener;
        if (origListener) toggle.removeEventListener('mousedown', origListener);
        toggle._tbMenuListener = function () {
          var isOpen = tbDropdown.getAttribute('data-open') === 'true';
          if (!isOpen) buildMenu();
          // 機能無効時は開かない
          if (!isTextboxEnabled()) {
            tbDropdown.setAttribute('data-open', 'false');
          }
        };
        toggle.addEventListener('mousedown', toggle._tbMenuListener);
      }

      // 表示/非表示の更新
      this._updateTbDropdownVisibility = function () {
        tbDropdown.style.display = isTextboxEnabled() ? '' : 'none';
      };
      this._updateTbDropdownVisibility();
      window.addEventListener('ZenWriterSettingsChanged', function () {
        if (self._updateTbDropdownVisibility) self._updateTbDropdownVisibility();
      });
    }

    /**
     * WYSIWYG で選択テキストをテキストボックスで囲む
     */
    _applyTextboxPreset(preset) {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;
      this._captureUndoSnapshot();
      this.wysiwygEditor.focus();

      var selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
      var range = selection.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return;

      // 既存の textbox 内にいる場合はプリセットを変更
      var existing = range.commonAncestorContainer;
      if (existing.nodeType === Node.TEXT_NODE) existing = existing.parentElement;
      var existingTb = existing ? existing.closest('.zw-textbox') : null;
      if (existingTb && this.wysiwygEditor.contains(existingTb)) {
        existingTb.dataset.preset = preset.id;
        existingTb.dataset.role = preset.role || 'custom';
        if (preset.anim) existingTb.dataset.anim = preset.anim;
        if (typeof preset.tilt === 'number') existingTb.dataset.tilt = String(preset.tilt);
        if (typeof preset.scale === 'number') existingTb.dataset.scale = String(preset.scale);
        if (preset.sfx) existingTb.dataset.sfx = preset.sfx;
        // CSS クラスを更新
        existingTb.className = 'zw-textbox ' + (preset.className || 'zw-textbox--' + preset.id);
        this._notifyChange();
        return;
      }

      // 新しいテキストボックス div を作成
      var div = document.createElement('div');
      div.className = 'zw-textbox ' + (preset.className || 'zw-textbox--' + preset.id);
      div.dataset.preset = preset.id;
      div.dataset.role = preset.role || 'custom';
      if (preset.anim) div.dataset.anim = preset.anim;
      if (typeof preset.tilt === 'number' && preset.tilt !== 0) div.dataset.tilt = String(preset.tilt);
      if (typeof preset.scale === 'number' && preset.scale !== 1) div.dataset.scale = String(preset.scale);
      if (preset.sfx) div.dataset.sfx = preset.sfx;

      var content = document.createElement('div');
      content.className = 'zw-textbox__content';
      content.appendChild(range.extractContents());
      div.appendChild(content);
      range.insertNode(div);

      // カーソルをテキストボックスの末尾に配置
      var newRange = document.createRange();
      newRange.selectNodeContents(content);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);

      this._notifyChange();
    }

    /**
     * WYSIWYG でテキストボックスを解除
     */
    _unwrapTextbox() {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;

      var selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      var range = selection.getRangeAt(0);
      var node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      var tb = node ? node.closest('.zw-textbox') : null;
      if (!tb || !this.wysiwygEditor.contains(tb)) return;

      this._captureUndoSnapshot();
      var contentEl = tb.querySelector('.zw-textbox__content');
      var fragment = document.createDocumentFragment();
      var source = contentEl || tb;
      while (source.firstChild) fragment.appendChild(source.firstChild);
      tb.parentNode.replaceChild(fragment, tb);
      this._notifyChange();
    }

    // ルビ・傍点の操作は RichTextRubyKentenActions が担当し、プロトタイプへ差し込む（末尾の install 参照）

    // DSL ブロック挿入（属性設定モーダル含む）は RichTextDslActions が担当し、プロトタイプへ差し込む（末尾の install 参照）

    /**
     * フローティングツールバーの選択連動表示
     */
    setupFloatingToolbar() {
      if (!this.wysiwygEditor || !this.wysiwygToolbar) return;
      var self = this;
      // 初期状態で非表示を確定
      this.wysiwygToolbar.setAttribute('data-visible', 'false');

      document.addEventListener('selectionchange', function () {
        // UIモードが reader の場合は表示しない
        var uiMode = document.documentElement.getAttribute('data-ui-mode');
        if (uiMode === 'reader') {
          self._hideFloatingToolbar();
          return;
        }
        if (!self.isWysiwygMode) {
          self._hideFloatingToolbar();
          self._syncFormatState();
          return;
        }
        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
          self._hideFloatingToolbar();
          self._syncFormatState();
          return;
        }
        var range = sel.getRangeAt(0);
        if (!self.wysiwygEditor.contains(range.commonAncestorContainer)) {
          self._hideFloatingToolbar();
          self._syncFormatState();
          return;
        }
        self._showFloatingToolbar(range);
        self._syncFormatState();
      });

      // ツールバー上のマウスダウンで非表示を防止
      this.wysiwygToolbar.addEventListener('mousedown', function (e) {
        // ボタン以外のツールバー領域クリック時も選択を保持
        if (!e.target.closest('button')) e.preventDefault();
      });
    }

    /** @private フローティングツールバーの表示状態を属性から取得 */
    _isFloatingVisible() {
      return this.wysiwygToolbar && this.wysiwygToolbar.getAttribute('data-visible') === 'true';
    }

    /** @private フローティングツールバーを選択範囲の近くに表示 (position: fixed) */
    _showFloatingToolbar(range) {
      var rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      var gap = 8;
      var vpW = window.innerWidth;
      var margin = 12;

      // 毎回画面外で測定する（2回目以降に画面内のまま測ると折り返し高さが変わり、上/下分岐がズレる）
      this.wysiwygToolbar.setAttribute('data-visible', 'true');
      this.wysiwygToolbar.style.top = '-9999px';
      this.wysiwygToolbar.style.left = vpW / 2 + 'px';
      this.wysiwygToolbar.style.transform = 'translateX(-50%)';

      var roughRect = this.wysiwygToolbar.getBoundingClientRect();
      var roughW = roughRect.width || 300;

      var left = rect.left + rect.width / 2;
      var sidebarEl = document.querySelector('.sidebar.open');
      var leftBound = margin;
      if (sidebarEl) {
        leftBound = sidebarEl.getBoundingClientRect().right + margin;
      }
      if (left - roughW / 2 < leftBound) {
        left = roughW / 2 + leftBound;
      }
      if (left + roughW / 2 > vpW - margin) {
        left = vpW - roughW / 2 - margin;
      }

      this.wysiwygToolbar.style.left = left + 'px';
      var tbRect = this.wysiwygToolbar.getBoundingClientRect();
      var tbW = tbRect.width || 300;
      var toolbarH = tbRect.height || 44;

      var minTop = gap;

      var top;
      if (rect.top > toolbarH + gap) {
        top = rect.top - toolbarH - gap;
        if (top < minTop) {
          top = rect.bottom + gap;
        }
      } else {
        top = rect.bottom + gap;
      }
      if (top < minTop) {
        top = minTop;
      }

      // 左端クランプ: translateX(-50%) を考慮（tbW は確定後）
      if (left - tbW / 2 < leftBound) {
        left = tbW / 2 + leftBound;
      }
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
    }

    /** @private フローティングツールバーを非表示 */
    _hideFloatingToolbar() {
      if (!this.wysiwygToolbar) return;
      this.wysiwygToolbar.setAttribute('data-visible', 'false');
      // ドロップダウンも閉じる
      this.wysiwygToolbar.querySelectorAll('.wysiwyg-dropdown').forEach(function (d) {
        d.setAttribute('data-open', 'false');
      });
    }

    _isWysiwygContentEmpty() {
      if (!this.wysiwygEditor) return true;
      var text = (this.wysiwygEditor.textContent || '')
        .replace(/\u200B/g, '')
        .replace(/\u00a0/g, ' ')
        .trim();
      if (text) return false;
      return !this.wysiwygEditor.querySelector(
        'img, video, audio, iframe, svg, .zw-textbox, .zw-typing, .zw-dialog, .zw-scroll, .zw-pathtext'
      );
    }

    _syncEmptyWritingHint() {
      if (!this.wysiwygEditor) return;
      this.wysiwygEditor.setAttribute('data-empty', this._isWysiwygContentEmpty() ? 'true' : 'false');
    }

    // ─── BL-003: 書式状態インジケータ ──────────────────────
    /**
     * @private ツールバーボタンの aria-pressed と書式インジケータを同期
     */
    _syncFormatState() {
      if (!this.isWysiwygMode) {
        this._updateFormatIndicator([]);
        return;
      }

      var states = [
        { id: 'wysiwyg-bold', cmd: 'bold', label: 'B' },
        { id: 'wysiwyg-italic', cmd: 'italic', label: 'I' },
        { id: 'wysiwyg-underline', cmd: 'underline', label: 'U' },
        { id: 'wysiwyg-strike', cmd: 'strikeThrough', label: 'S' },
      ];

      var active = [];
      for (var i = 0; i < states.length; i++) {
        var s = states[i];
        var on = false;
        try { on = document.queryCommandState(s.cmd); } catch (_) {}
        var btn = document.getElementById(s.id);
        if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) active.push(s.label);
      }

      // decor-* span の検出
      var sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && this.wysiwygEditor) {
        var node = sel.getRangeAt(0).startContainer;
        var el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        while (el && el !== this.wysiwygEditor) {
          if (el.tagName === 'SPAN' && el.className && /^decor-/.test(el.className)) {
            active.push(el.className.replace('decor-', ''));
          }
          el = el.parentElement;
        }
      }

      this._updateFormatIndicator(active);
    }

    /**
     * @private 書式インジケータ要素を更新
     */
    _updateFormatIndicator(activeLabels) {
      var indicator = document.getElementById('wysiwyg-format-indicator');
      if (!indicator) return;
      if (!activeLabels || activeLabels.length === 0) {
        indicator.textContent = '';
        indicator.style.display = 'none';
        return;
      }
      indicator.textContent = activeLabels.join(' + ');
      indicator.style.display = '';
    }

    // ─── Wikilink 入力補完 ─────────────────────────────────

    /** @private カーソル直前の [[ を検出し補完ドロップダウンを表示 */
    _checkWikiLinkTrigger() {
      // Focus モードでは表示しない (「自分が書いた以外の文字を表示しない」原則)
      if (document.documentElement.getAttribute('data-ui-mode') === 'focus') {
        this._dismissWikiComplete();
        return;
      }
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
        this._dismissWikiComplete();
        return;
      }
      var node = sel.getRangeAt(0).startContainer;
      if (node.nodeType !== Node.TEXT_NODE) { this._dismissWikiComplete(); return; }
      var text = node.textContent.slice(0, sel.getRangeAt(0).startOffset);
      var idx = text.lastIndexOf('[[');
      if (idx === -1 || text.indexOf(']]', idx) !== -1) {
        this._dismissWikiComplete();
        return;
      }
      var query = text.slice(idx + 2);
      this._showWikiComplete(query);
    }

    /** @private 補完ドロップダウン表示 */
    _showWikiComplete(query) {
      var S = window.ZenWriterStorage;
      if (!S || !S.loadStoryWiki) { this._dismissWikiComplete(); return; }
      var entries = S.loadStoryWiki();
      if (!entries || entries.length === 0) { this._dismissWikiComplete(); return; }
      var lq = query.toLowerCase();
      var filtered = entries.filter(function (e) {
        return e.title && e.title.toLowerCase().indexOf(lq) === 0;
      }).slice(0, 8);
      if (filtered.length === 0) { this._dismissWikiComplete(); return; }

      var drop = this._wikiCompleteEl;
      if (!drop) {
        drop = document.createElement('div');
        drop.className = 'wiki-complete-dropdown';
        document.body.appendChild(drop);
        this._wikiCompleteEl = drop;
      }
      drop.innerHTML = '';
      var self = this;
      filtered.forEach(function (entry) {
        var item = document.createElement('div');
        item.className = 'wiki-complete-item';
        item.textContent = entry.title;
        item.addEventListener('mousedown', function (e) {
          e.preventDefault();
          self._insertWikiLink(entry.title);
        });
        drop.appendChild(item);
      });
      drop.style.display = 'block';

      // カーソル位置にドロップダウンを配置
      var sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        var range = sel.getRangeAt(0);
        var rect = range.getBoundingClientRect();
        drop.style.left = rect.left + 'px';
        drop.style.top = (rect.bottom + 4) + 'px';
      }
    }

    /** @private wikilink テキストを挿入 */
    _insertWikiLink(title) {
      this._dismissWikiComplete();
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      var range = sel.getRangeAt(0);
      var node = range.startContainer;
      if (node.nodeType !== Node.TEXT_NODE) return;
      var offset = range.startOffset;
      var text = node.textContent;
      var idx = text.lastIndexOf('[[', offset);
      if (idx === -1) return;
      // [[ と入力済み部分を置換して [[title]] に
      var before = text.slice(0, idx);
      var after = text.slice(offset);
      node.textContent = before + '[[' + title + ']]' + after;
      // カーソルを ]] の直後に配置
      var newOffset = before.length + title.length + 4;
      range.setStart(node, newOffset);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      // 同期
      this.syncToMarkdown();
      if (this.editorManager) {
        this.editorManager.markDirty();
        this.editorManager.saveContent();
        this.editorManager.renderMarkdownPreview();
      }
    }

    /** @private 補完ドロップダウンを閉じる */
    _dismissWikiComplete() {
      if (this._wikiCompleteEl) {
        this._wikiCompleteEl.style.display = 'none';
      }
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
      // 下のみだと scrollTop=0 のとき短文ではカーソルがアンカーより上に固定され、寄せられない（session 63）
      this.wysiwygEditor.style.paddingBottom = 'calc(100vh * ' + cfg.anchorRatio + ')';
      this.wysiwygEditor.style.paddingTop = 'calc(100vh * ' + (1 - cfg.anchorRatio) + ')';
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
      this.wysiwygEditor.style.paddingTop = '';
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
      var el = this.wysiwygEditor;
      el.scrollTop += scrollDelta;
      var maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll < 0) maxScroll = 0;
      el.scrollTop = Math.max(0, Math.min(el.scrollTop, maxScroll));
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

      // SP-073 Phase 2: パステキスト制御点ハンドル
      this.wysiwygEditor.addEventListener('pointerdown', (e) => {
        // Phase 4: 描画モード中はデタッチしない
        if (this._pathOverlay && this._pathOverlay.isDrawing()) return;
        var pathtextEl = e.target.closest('.zw-pathtext');
        // ハンドル自体のpointerdownはPathHandleOverlay内で処理される
        if (e.target.closest('.zw-pathtext-handle')) return;
        if (pathtextEl && this.wysiwygEditor.contains(pathtextEl)) {
          this._attachPathOverlay(pathtextEl);
        } else if (this._pathOverlay && this._pathOverlay.isAttached()) {
          this._detachPathOverlay();
        }
      });

      // SP-073 Phase 3: パステキスト右クリックメニュー
      this.wysiwygEditor.addEventListener('contextmenu', (e) => {
        var pathtextEl = e.target.closest('.zw-pathtext');
        if (pathtextEl && this.wysiwygEditor.contains(pathtextEl)) {
          e.preventDefault();
          this._showPathtextContextMenu(pathtextEl, e.clientX, e.clientY);
        }
      });
      // クリックでメニューを閉じる
      document.addEventListener('click', (e) => {
        if (this._pathtextContextMenu && !this._pathtextContextMenu.contains(e.target)) {
          this._closePathtextContextMenu();
        }
      });

      // 入力時の自動保存とプレビュー更新
      this.wysiwygEditor.addEventListener('input', () => {
        if (this._consumeTypedHeadingShortcut()) {
          this._syncEmptyWritingHint();
          return;
        }
        this._scheduleUndoSnapshot();
        this.syncToMarkdown();
        this._syncEmptyWritingHint();
        this._syncFormatState();
        this._checkWikiLinkTrigger();
        if (this.editorManager) {
          this.editorManager.markDirty();
          this.editorManager.saveContent();
          this.editorManager.updateWordCount();
          this.editorManager.renderMarkdownPreview();
        }
      });

      /** P1（session 62）: blur 時に保留中の入力バッチを Undo スタックへ確定 */
      this.wysiwygEditor.addEventListener('blur', () => {
        if (this.isWysiwygMode) this._flushPendingUndoSnapshot();
      });

      this.wysiwygEditor.addEventListener('compositionstart', () => {
        this._isComposing = true;
        this._pendingTypedHeadingShortcut = false;
      });

      /** IME 確定直後も 1 単位として区切る（連続デバウンスと分離） */
      this.wysiwygEditor.addEventListener('compositionend', () => {
        this._isComposing = false;
        if (this.isWysiwygMode) this._flushPendingUndoSnapshot();
        this._disableNativeWysiwygSpellcheck();
        this._scheduleImeCompositionRepaint();
      });

      // ペースト時の処理（プレーンテキスト化を防ぐ）
      this.wysiwygEditor.addEventListener('paste', (e) => {
        e.preventDefault();
        this._captureUndoSnapshot(); // ペースト前にスナップショット
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
        this._syncEmptyWritingHint();
        this._captureUndoSnapshot(); // ペースト後もキャプチャ
      });

      // キーボードショートカット
      this.wysiwygEditor.addEventListener('keydown', (e) => {
        // Escape で wikilink 補完を閉じる
        if (e.key === 'Escape' && this._wikiCompleteEl && this._wikiCompleteEl.style.display !== 'none') {
          e.preventDefault();
          this._dismissWikiComplete();
          return;
        }
        this._pendingTypedHeadingShortcut = this._shouldQueueTypedHeadingShortcut(e);
        // P1（session 62）: Space / Enter 直前にデバウンス中のスナップショットを確定（単語・行境界での Undo 粒度）
        if (!e.isComposing && !(e.ctrlKey || e.metaKey || e.altKey)) {
          if (e.key === ' ' || e.key === 'Enter') {
            this._flushPendingUndoSnapshot();
          }
        }
        // Ctrl+Shift+Alt+D: effectPersistDecorAcrossNewline をトグル（設定 UI 未実装時のショートカット）
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
          e.preventDefault();
          if (
            window.ZenWriterStorage
            && typeof window.ZenWriterStorage.loadSettings === 'function'
            && typeof window.ZenWriterStorage.saveSettings === 'function'
          ) {
            var s = window.ZenWriterStorage.loadSettings();
            var on = !!(s.editor && s.editor.effectPersistDecorAcrossNewline === true);
            window.ZenWriterStorage.saveSettings({ editor: { effectPersistDecorAcrossNewline: !on } });
          }
          return;
        }
        // BL-002: Enter で書式を切断 (effectBreakAtNewline)
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          var settings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
            ? window.ZenWriterStorage.loadSettings() : {};
          var breakAtNewline = settings.editor && settings.editor.effectBreakAtNewline !== false;
          var persistDecorAcrossNewline = settings.editor && settings.editor.effectPersistDecorAcrossNewline === true;
          if (breakAtNewline) {
            // execCommand 系の書式状態を取得
            var wasBold = document.queryCommandState('bold');
            var wasItalic = document.queryCommandState('italic');
            var wasUnderline = document.queryCommandState('underline');
            var wasStrikeThrough = document.queryCommandState('strikeThrough');

            // カーソル位置の decor-* span を検出
            var sel = window.getSelection();
            var decorSpan = null;
            if (sel && sel.rangeCount > 0) {
              var node = sel.getRangeAt(0).startContainer;
              var el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
              while (el && el !== this.wysiwygEditor) {
                if (el.tagName === 'SPAN' && el.className && /^decor-/.test(el.className)) {
                  decorSpan = el;
                  break;
                }
                el = el.parentElement;
              }
            }

            // デフォルトの改行処理を実行
            // (ブラウザが <p> を生成)

            // 改行後に書式をクリアする (非同期: ブラウザの段落生成後)
            setTimeout(() => {
              if (wasBold) document.execCommand('bold', false, null);
              if (wasItalic) document.execCommand('italic', false, null);
              if (wasUnderline) document.execCommand('underline', false, null);
              if (wasStrikeThrough) document.execCommand('strikeThrough', false, null);

              // decor-* span の外にカーソルを移動（effectPersistDecorAcrossNewline 時は継続のためスキップ）
              if (decorSpan && !persistDecorAcrossNewline) {
                var curSel = window.getSelection();
                if (curSel && curSel.rangeCount > 0) {
                  var curNode = curSel.getRangeAt(0).startContainer;
                  var curEl = curNode.nodeType === Node.TEXT_NODE ? curNode.parentElement : curNode;
                  while (curEl && curEl !== this.wysiwygEditor) {
                    if (curEl.tagName === 'SPAN' && curEl.className && /^decor-/.test(curEl.className)) {
                      // span の内容をフラグメントに展開してカーソルを外に出す
                      var range = document.createRange();
                      range.setStartAfter(curEl);
                      range.collapse(true);
                      curSel.removeAllRanges();
                      curSel.addRange(range);
                      break;
                    }
                    curEl = curEl.parentElement;
                  }
                }
              }
            }, 0);
            // デフォルト動作 (改行挿入) は阻止しない → return して続行
            return;
          }
        }

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

    _shouldQueueTypedHeadingShortcut(e) {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return false;
      if (!e || e.key !== ' ' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return false;
      if (e.isComposing || this._isComposing) return false;

      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      var range = sel.getRangeAt(0);
      if (!range.collapsed || !this.wysiwygEditor.contains(range.commonAncestorContainer)) return false;

      var candidate = this._getTypedHeadingShortcutCandidate(false);
      return !!candidate;
    }

    _consumeTypedHeadingShortcut() {
      if (!this._pendingTypedHeadingShortcut) return false;
      this._pendingTypedHeadingShortcut = false;
      if (this._isComposing) return false;

      var candidate = this._getTypedHeadingShortcutCandidate(true);
      if (!candidate) return false;
      this._applyTypedHeadingShortcut(candidate);
      return true;
    }

    _getTypedHeadingShortcutCandidate(afterSpace) {
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      var range = sel.getRangeAt(0);
      if (!range.collapsed || !this.wysiwygEditor || !this.wysiwygEditor.contains(range.commonAncestorContainer)) {
        return null;
      }

      var block = this._getShortcutBlock(range.startContainer);
      if (!block) return null;

      var text = (block.textContent || '').replace(/\u00a0/g, ' ');
      var match = afterSpace ? text.match(/^(#{1,3}) $/) : text.match(/^(#{1,3})$/);
      if (!match) return null;

      var afterRange = document.createRange();
      try {
        afterRange.selectNodeContents(block);
        afterRange.setStart(range.startContainer, range.startOffset);
      } catch (_) {
        return null;
      }
      if ((afterRange.toString() || '').replace(/\u00a0/g, ' ') !== '') return null;

      return {
        block: block,
        level: match[1].length
      };
    }

    _getShortcutBlock(node) {
      var el = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
      while (el && el !== this.wysiwygEditor) {
        if (el.nodeType === Node.ELEMENT_NODE && /^(P|DIV)$/.test(el.tagName || '')) {
          return el;
        }
        el = el.parentElement;
      }
      if (this.wysiwygEditor && node) {
        var parent = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
        if (parent === this.wysiwygEditor || node === this.wysiwygEditor) {
          return this.wysiwygEditor;
        }
      }
      return null;
    }

    _applyTypedHeadingShortcut(candidate) {
      if (!candidate || !candidate.block || !candidate.block.parentNode) return;

      this._captureUndoSnapshot();

      var heading = document.createElement('h' + candidate.level);
      heading.appendChild(document.createElement('br'));
      if (candidate.block === this.wysiwygEditor) {
        this.wysiwygEditor.replaceChildren(heading);
      } else {
        candidate.block.parentNode.replaceChild(heading, candidate.block);
      }

      var sel = window.getSelection();
      if (sel) {
        var range = document.createRange();
        range.setStart(heading, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      this.syncToMarkdown();
      this._syncFormatState();
      this._notifyChange();
    }

    _scheduleImeCompositionRepaint() {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;
      var editor = this.wysiwygEditor;
      if (this._imeRepaintFrame) {
        cancelAnimationFrame(this._imeRepaintFrame);
        this._imeRepaintFrame = null;
      }
      editor.setAttribute('data-ime-repaint', 'pending');
      this._imeRepaintFrame = requestAnimationFrame(() => {
        editor.setAttribute('data-ime-repaint', 'settle');
        this._imeRepaintFrame = requestAnimationFrame(() => {
          editor.removeAttribute('data-ime-repaint');
          this._imeRepaintFrame = null;
        });
      });
    }

    /**
     * エディタ内の選択範囲を保存する（focus()による消失防止用）
     */
    _saveEditorSelection() {
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      var range = sel.getRangeAt(0);
      if (!this.wysiwygEditor || !this.wysiwygEditor.contains(range.commonAncestorContainer)) return null;
      return range.cloneRange();
    }

    /**
     * 保存した選択範囲を復元する
     */
    _restoreEditorSelection(savedRange) {
      if (!savedRange) return;
      var sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }

    /**
     * コマンドを実行（太字、斜体、下線など）
     * document.execCommandの代わりに、手動でHTMLタグを挿入する実装
     */
    executeCommand(command, value = null) {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;

      // ドロップダウン操作時に focus() で選択範囲が消失するのを防止
      var savedRange = this._saveEditorSelection();
      this.wysiwygEditor.focus();
      this._restoreEditorSelection(savedRange);

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
      this._syncFormatState();
    }

    /**
     * 選択テキストを指定CSSクラスのspanで囲む（トグル対応）。
     * execCommandで対応できないカスタム装飾（decor-smallcaps等）に使用。
     */
    wrapSelectionWithSpan(className) {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;

      // SP-055: カスタム装飾前にスナップショット（アトミックなUndo単位）
      this._captureUndoSnapshot();

      // ドロップダウン操作時に focus() で選択範囲が消失するのを防止
      var savedRange = this._saveEditorSelection();
      this.wysiwygEditor.focus();
      this._restoreEditorSelection(savedRange);

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

      // ドロップダウン操作時に focus() で選択範囲が消失するのを防止
      var savedRange = this._saveEditorSelection();
      this.wysiwygEditor.focus();
      this._restoreEditorSelection(savedRange);

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        this.notifySelectionRequired();
        return;
      }

      const range = selection.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return;

      const linkRange = range.cloneRange();
      const selectedText = selection.toString().trim();
      const self = this;

      this._showLinkInsertModal(linkRange, selectedText, function (url, isChapterLink, linkStyle) {
        self.wysiwygEditor.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(linkRange);

        const link = document.createElement('a');
        if (isChapterLink) {
          link.href = '#';
          link.className = 'chapter-link';
          if (linkStyle) link.classList.add('chapter-link--' + linkStyle);
          link.dataset.chapterTarget = encodeURIComponent(url);
          if (linkStyle) link.dataset.style = linkStyle;
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

      // リンクスタイル選択
      const styleRow = document.createElement('div');
      styleRow.className = 'link-insert-modal__style-row';
      const styleLabel = document.createElement('label');
      styleLabel.className = 'link-insert-modal__style-label';
      styleLabel.textContent = '\u30b9\u30bf\u30a4\u30eb';
      const styleSelect = document.createElement('select');
      styleSelect.className = 'link-insert-modal__style-select';
      [
        { value: '', label: '\u6a19\u6e96' },
        { value: 'choice', label: '\u25b6 \u9078\u629e\u80a2' },
        { value: 'emphasis', label: '\u25b6 \u5f37\u8abf' },
        { value: 'card', label: '\u25b6 \u30ab\u30fc\u30c9' }
      ].forEach(function (opt) {
        var o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        styleSelect.appendChild(o);
      });
      styleRow.appendChild(styleLabel);
      styleRow.appendChild(styleSelect);
      modal.appendChild(styleRow);

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
            var style = styleSelect.value;
            self._closeLinkInsertModal();
            onConfirm(ch.title || ch.id, true, style);
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
            var style = styleSelect.value;
            this._closeLinkInsertModal();
            onConfirm(val, false, style);
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
      var rawId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
      var docId =
        rawId && Store && typeof Store.resolveParentDocumentId === 'function'
          ? Store.resolveParentDocumentId(rawId)
          : rawId;
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

    /**
     * ツールバーとサイドバーの WYSIWYG トグル表示を同期（editor-preview のプレビュー同期と同系）
     */
    _syncWysiwygToggleChrome() {
      var on = this.isWysiwygMode;
      var dev = this._isDeveloperModeEnabled();
      if (this.toggleWysiwygBtn) {
        this.toggleWysiwygBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on && !dev) {
          this.toggleWysiwygBtn.title = 'リッチ編集中（ソース表示は開発者モード）';
        } else if (on && dev) {
          this.toggleWysiwygBtn.title = 'Markdown ソース表示に切り替え';
        } else {
          this.toggleWysiwygBtn.title = 'リッチ編集表示（編集可能）';
        }
      }
      var sidebarBtn = document.getElementById('sidebar-toggle-wysiwyg');
      if (sidebarBtn) {
        sidebarBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on && !dev) {
          sidebarBtn.title = 'リッチ編集中（ソースは開発者モード）';
        } else if (on && dev) {
          sidebarBtn.title = 'Markdown ソース表示に切り替え（リッチ表示中）';
        } else {
          sidebarBtn.title = '装飾をリッチ表示で編集（読者プレビューではありません）';
        }
      }
    }

    switchToWysiwyg() {
      if (this.isWysiwygMode) return;

      // textareaの内容を取得してMarkdownからHTMLに変換
      const markdown = this.textareaEditor.value || '';
      const html = this.markdownToHtml(markdown);

      // WYSIWYGエディタに設定
      this.wysiwygEditor.innerHTML = html;
      this._syncEmptyWritingHint();

      // 表示を切り替え
      this.textareaEditor.style.display = 'none';
      this.wysiwygEditor.style.display = 'block';
      // フローティングモード: ツールバーはテキスト選択時に自動表示
      this.isWysiwygMode = true;

      // フォーカスを移動
      this.wysiwygEditor.focus();

      this._syncWysiwygToggleChrome();

      // textarea モードバナーを非表示
      if (this.textareaModeBar) this.textareaModeBar.style.display = 'none';

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
    // --- 縦書き/横書きトグル (実験的) ---

    _toggleVerticalWriting() {
      var isVertical = this.wysiwygEditor.classList.contains('vertical-writing');
      this._setVerticalWriting(!isVertical);
    }

    _setVerticalWriting(vertical) {
      if (!this.wysiwygEditor) return;
      if (vertical) {
        this.wysiwygEditor.classList.add('vertical-writing');
      } else {
        this.wysiwygEditor.classList.remove('vertical-writing');
      }
      if (this._verticalToggleBtn) {
        this._verticalToggleBtn.setAttribute('aria-pressed', String(vertical));
      }
      try {
        localStorage.setItem('zenwriter-vertical-writing', String(vertical));
      } catch (_) { /* noop */ }
    }

    switchToTextarea() {
      if (!this.isWysiwygMode) return;
      if (!this._isDeveloperModeEnabled()) {
        this._notifyMarkdownSourceLocked();
        return;
      }

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
      this.textareaEditor.style.display = 'block';
      this.isWysiwygMode = false;

      // フォーカスを移動
      this.textareaEditor.focus();

      // 保存と更新 (renderMarkdownPreview は editor-preview.js の責務 — input イベントで自動発火)
      if (this.editorManager) {
        this.editorManager.saveContent();
        this.editorManager.updateWordCount();
      }

      this._syncWysiwygToggleChrome();

      // textarea モードバナーを表示
      if (this.textareaModeBar) this.textareaModeBar.style.display = '';

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

      // SP-059 Phase 3: 傍点 {kenten|text} とルビ {漢字|かな} は、プレビュー・Reader と同じ規則で HTML 化する
      if (window.ZWInlineHtmlPostMarkdown && typeof window.ZWInlineHtmlPostMarkdown.applyKentenRuby === 'function') {
        html = window.ZWInlineHtmlPostMarkdown.applyKentenRuby(html);
      }

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

      // ルビ挿入時に追加されるゼロ幅スペースを除去
      let serializedHtml = html.replace(/\u200B/g, '');
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
          const markdown = this._turndownKeepingEmptyHeadings(serializedHtml);
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
          return this.normalizeCustomTagEscapes(this._turndownKeepingEmptyHeadings(html));
        } catch (e) { console.warn('HTML to Markdown conversion failed:', e); }
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
        /\\\[(\/?(?:bold|italic|underline|strike|smallcaps|light|shadow|black|uppercase|lowercase|capitalize|outline|glow|wide|narrow|fade|slide|type|pulse|shake|bounce|fadein|wave|sparkle|cosmic|fire|glitch))\\\]/gi,
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
     * テキスト入力用デバウンスを打ち切り、現時点の HTML を即座に Undo スタックへ反映する。
     * Space / Enter / blur / compositionend で呼び、バッチが無意味に長く連なるのを防ぐ。
     */
    _flushPendingUndoSnapshot() {
      clearTimeout(this._undoSnapshotTimer);
      this._undoSnapshotTimer = null;
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;
      this._captureUndoSnapshot();
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
      if (!this.wysiwygEditor) return;

      // 最初の入力がデバウンス中でも、履歴の有無を調べる前に確定する。
      this._captureUndoSnapshot();

      // スタック先頭は「現状態の直前スナップショット」1 件のみ（二重 pop すると履歴が浅いときに 2 段ぶん戻って空になる）
      var prevSnapshot = this._undoStack.pop();
      if (prevSnapshot === undefined) return;

      // Redo 用は実 DOM を正とする（`_undoLastSnapshot` とブラウザ DOM がずれると Redo が空振りする）
      var redoHtml = this.wysiwygEditor.innerHTML;
      var redoCursor = this._getCursorOffset();
      this._redoStack.push({
        html: redoHtml,
        cursorOffset: redoCursor
      });

      // 後方互換: 旧フォーマット (plain string) にも対応
      var prevHtml = typeof prevSnapshot === 'string' ? prevSnapshot : prevSnapshot.html;
      var prevCursor = typeof prevSnapshot === 'string' ? 0 : (prevSnapshot.cursorOffset || 0);

      this.wysiwygEditor.innerHTML = prevHtml;
      this._undoLastSnapshot = prevHtml;
      this._lastCursorOffset = prevCursor;
      this._restoreCursorOffset(prevCursor);
      this.syncToMarkdown();
      this._syncEmptyWritingHint();
      this._notifyChange();
    }

    /**
     * Redo実行
     */
    _redoAction() {
      if (!this.wysiwygEditor) return;

      // Undo 後の未確定入力を先に記録し、古い Redo 分岐で上書きしない。
      this._captureUndoSnapshot();
      if (this._redoStack.length === 0) return;

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
      this._syncEmptyWritingHint();
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
        this._syncEmptyWritingHint();
      } else {
        this.textareaEditor.value = content || '';
      }
    }
  }

  // グローバルに公開（EditorManagerの初期化後に呼び出される）
  // パステキスト操作（SP-073）は RichTextPathTextActions が担当し、プロトタイプへ差し込む
  if (window.RichTextPathTextActions && typeof window.RichTextPathTextActions.install === 'function') {
    window.RichTextPathTextActions.install(RichTextEditor.prototype);
  } else {
    console.warn('RichTextPathTextActions is not loaded; path text editing is disabled.');
  }

  // ルビ・傍点の操作は RichTextRubyKentenActions が担当し、プロトタイプへ差し込む
  if (window.RichTextRubyKentenActions && typeof window.RichTextRubyKentenActions.install === 'function') {
    window.RichTextRubyKentenActions.install(RichTextEditor.prototype);
  } else {
    console.warn('RichTextRubyKentenActions is not loaded; ruby/kenten editing is disabled.');
  }

  // DSL ブロック挿入は RichTextDslActions が担当し、プロトタイプへ差し込む
  if (window.RichTextDslActions && typeof window.RichTextDslActions.install === 'function') {
    window.RichTextDslActions.install(RichTextEditor.prototype);
  } else {
    console.warn('RichTextDslActions is not loaded; DSL block insertion is disabled.');
  }

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
