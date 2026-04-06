/**
 * command-palette.js
 * コマンドパレット機能: ショートカットと操作を可視化し、横断的に実行
 */
(function () {
  'use strict';

  function setAppUIMode(mode) {
    if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
      window.ZenWriterApp.setUIMode(mode);
      return;
    }
    const modeButton = document.querySelector('.mode-switch-btn[data-mode="' + mode + '"]');
    if (modeButton instanceof HTMLElement) {
      modeButton.click();
    }
  }

  // コマンド定義
  const COMMANDS = [
    // 検索・置換
    {
      id: 'search',
      label: '検索',
      description: '検索パネルを開く',
      shortcut: 'Ctrl+F / Cmd+F',
      category: '検索・置換',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
          window.ZenWriterEditor.toggleSearchPanel();
        }
      }
    },
    {
      id: 'replace',
      label: '置換',
      description: '検索パネルを開いて置換する',
      shortcut: 'Ctrl+H / Cmd+H',
      category: '検索・置換',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
          window.ZenWriterEditor.toggleSearchPanel();
        }
      }
    },
    // UI操作
    {
      id: 'toggle-sidebar',
      label: 'サイドバーを開閉',
      description: 'サイドバーの表示/非表示を切り替え',
      shortcut: 'Alt+1',
      category: 'UI操作',
      execute: () => {
        if (window.sidebarManager && typeof window.sidebarManager.toggleSidebar === 'function') {
          window.sidebarManager.toggleSidebar();
        }
      }
    },
    {
      id: 'toggle-toolbar',
      label: 'ツールバーを開閉',
      description: 'ツールバーの表示/非表示を切り替え',
      shortcut: 'Alt+W',
      category: 'UI操作',
      execute: () => {
        if (window.sidebarManager && typeof window.sidebarManager.toggleToolbar === 'function') {
          window.sidebarManager.toggleToolbar();
        }
      }
    },
    {
      id: 'toggle-fullscreen',
      label: 'フルスクリーン',
      description: 'フルスクリーンモードに切り替え',
      shortcut: 'F11',
      category: 'UI操作',
      execute: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.error('フルスクリーンエラー:', err);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      }
    },
    // テキスト装飾
    {
      id: 'bold',
      label: '太字',
      description: '選択テキストを太字にする',
      shortcut: 'Ctrl+B / Cmd+B',
      category: 'テキスト装飾',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration === 'function') {
          window.ZenWriterEditor.applyFontDecoration('bold');
        }
      }
    },
    {
      id: 'italic',
      label: '斜体',
      description: '選択テキストを斜体にする',
      shortcut: 'Ctrl+I / Cmd+I',
      category: 'テキスト装飾',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration === 'function') {
          window.ZenWriterEditor.applyFontDecoration('italic');
        }
      }
    },
    {
      id: 'font-decoration-panel',
      label: 'フォント装飾パネル',
      description: 'フォント装飾パネルを開く',
      shortcut: '',
      category: 'テキスト装飾',
      execute: () => {
        if (window.MainHubPanel) {
          window.MainHubPanel.toggle('decoration');
        }
      }
    },
    {
      id: 'text-animation-panel',
      label: 'テキストアニメーションパネル',
      description: 'テキストアニメーションパネルを開く',
      shortcut: '',
      category: 'テキスト装飾',
      execute: () => {
        if (window.MainHubPanel) {
          window.MainHubPanel.toggle('animation');
        }
      }
    },
    // ファイル操作
    {
      id: 'save',
      label: '保存',
      description: '現在の内容を保存',
      shortcut: 'Ctrl+S / Cmd+S',
      category: 'ファイル操作',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.saveContent === 'function') {
          window.ZenWriterEditor.saveContent();
          if (window.ZenWriterEditor.showNotification) {
            window.ZenWriterEditor.showNotification('保存しました');
          }
        }
      }
    },
    {
      id: 'restore-snapshot',
      label: 'スナップショットから復元',
      description: '最後のスナップショットから復元',
      shortcut: 'Ctrl+Shift+Z / Cmd+Shift+Z',
      category: 'ファイル操作',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.restoreLastSnapshot === 'function') {
          window.ZenWriterEditor.restoreLastSnapshot();
        }
      }
    },
    // UIモード
    {
      id: 'ui-mode-normal',
      label: '通常モード',
      description: 'UIモードを通常に切り替え',
      shortcut: 'F2 (サイクル)',
      category: 'UIモード',
      execute: () => {
        setAppUIMode('normal');
      }
    },
    {
      id: 'ui-mode-focus',
      label: 'フォーカスモード',
      description: 'UIモードをフォーカスに切り替え',
      shortcut: 'F2 (サイクル)',
      category: 'UIモード',
      execute: () => {
        setAppUIMode('focus');
      }
    },
    {
      id: 'ui-mode-reader',
      label: '読者プレビュー（閲覧専用）',
      description: '全画面の読了レイアウトへ（編集は「編集に戻る」から）',
      shortcut: '',
      category: 'UIモード',
      execute: () => {
        if (window.ZWReaderPreview && typeof window.ZWReaderPreview.enter === 'function') {
          window.ZWReaderPreview.enter();
        } else {
          setAppUIMode('reader');
        }
      }
    },
    // フォントサイズ
    {
      id: 'font-size-increase',
      label: 'フォントサイズ拡大',
      description: 'フォントサイズを大きくする',
      shortcut: 'Ctrl++ / Cmd++',
      category: 'フォント',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.adjustGlobalFontSize === 'function') {
          window.ZenWriterEditor.adjustGlobalFontSize(1);
        }
      }
    },
    {
      id: 'font-size-decrease',
      label: 'フォントサイズ縮小',
      description: 'フォントサイズを小さくする',
      shortcut: 'Ctrl+- / Cmd+-',
      category: 'フォント',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.adjustGlobalFontSize === 'function') {
          window.ZenWriterEditor.adjustGlobalFontSize(-1);
        }
      }
    },
    {
      id: 'font-size-reset',
      label: 'フォントサイズリセット',
      description: 'フォントサイズを初期値に戻す',
      shortcut: 'Ctrl+0 / Cmd+0',
      category: 'フォント',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setGlobalFontSize === 'function') {
          const defaults = window.ZenWriterStorage ? window.ZenWriterStorage.DEFAULT_SETTINGS : {};
          window.ZenWriterEditor.setGlobalFontSize(defaults.fontSize || 16);
        }
      }
    },
    // ガジェット操作（動的に追加）
    {
      id: 'gadget-structure',
      label: '構造ガジェット',
      description: '構造タブを開く',
      shortcut: '',
      category: 'ガジェット',
      execute: () => {
        if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
          window.sidebarManager.activateSidebarGroup('structure');
          if (window.sidebarManager && typeof window.sidebarManager.toggleSidebar === 'function') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('open')) {
              window.sidebarManager.toggleSidebar();
            }
          }
        }
      }
    },
    {
      id: 'open-settings',
      label: '設定を開く',
      description: '設定モーダルを表示',
      shortcut: '',
      category: 'UI操作',
      execute: () => {
        const modal = document.getElementById('settings-modal');
        if (modal) {
          modal.style.display = 'flex';
          modal.setAttribute('aria-hidden', 'false');
        }
      }
    },
    {
      id: 'open-help',
      label: 'ヘルプを開く',
      description: 'ヘルプモーダルを表示',
      shortcut: '',
      category: 'UI操作',
      execute: () => {
        const modal = document.getElementById('help-modal');
        if (modal) {
          modal.style.display = 'flex';
          modal.setAttribute('aria-hidden', 'false');
          if (window.ZenWriterHelpModal && typeof window.ZenWriterHelpModal.render === 'function') {
            window.ZenWriterHelpModal.render();
          }
        }
      }
    },
    {
      id: 'toggle-markdown-preview',
      label: 'MD プレビュー（横並び）',
      description: '編集画面の横に Markdown 表示を開閉（読者モードではない）',
      shortcut: '',
      category: '編集',
      execute: () => {
        const btn = document.getElementById('toggle-preview');
        if (btn) btn.click();
      }
    },
    {
      id: 'toggle-wysiwyg',
      label: 'リッチ編集（WYSIWYG）',
      description: 'リッチ表示で編集。UI モードは変わらず（読者プレビューではない）',
      shortcut: '',
      category: '編集',
      execute: () => {
        const btn = document.getElementById('toggle-wysiwyg');
        if (btn) btn.click();
      }
    },
    {
      id: 'toggle-ui-editor',
      label: 'UI エディタ',
      description: 'UIビジュアルエディタを切り替え（実験的）',
      shortcut: '',
      category: '実験的機能',
      execute: () => {
        if (window.uiVisualEditor) {
          if (window.uiVisualEditor.isActive) {
            window.uiVisualEditor.deactivate();
          } else {
            window.uiVisualEditor.activate();
          }
        }
      }
    },
    {
      id: 'toggle-split-view',
      label: '分割ビュー',
      description: '分割ビューを切り替え（実験的）',
      shortcut: '',
      category: '実験的機能',
      execute: () => {
        if (window.MainHubPanel) {
          window.MainHubPanel.toggle('split-view');
        }
      }
    },
    {
      id: 'gadget-wiki',
      label: 'Wikiガジェット',
      description: 'Wikiタブを開く',
      shortcut: '',
      category: 'ガジェット',
      execute: () => {
        if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
          window.sidebarManager.activateSidebarGroup('wiki');
          if (window.sidebarManager && typeof window.sidebarManager.toggleSidebar === 'function') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('open')) {
              window.sidebarManager.toggleSidebar();
            }
          }
        }
      }
    }
  ];

  class CommandPalette {
    constructor() {
      this.panel = null;
      this.input = null;
      this.list = null;
      this.filteredCommands = [];
      this.selectedIndex = 0;
      this.isVisible = false;
      this.init();
    }

    init() {
      // パネルが存在しない場合は作成
      let panel = document.getElementById('command-palette');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'command-palette';
        panel.className = 'floating-panel command-palette';
        panel.style.display = 'none';
        panel.innerHTML = `
          <div class="panel-header">
            <span data-i18n="COMMAND_PALETTE">コマンドパレット</span>
            <button class="panel-close" id="close-command-palette" data-i18n="CLOSE">閉じる</button>
          </div>
          <div class="panel-body">
            <input type="text" id="command-palette-input" class="command-palette-input" 
                   data-i18n-placeholder="COMMAND_PALETTE_PLACEHOLDER" 
                   placeholder="コマンドを検索..." 
                   autocomplete="off" />
            <div id="command-palette-list" class="command-palette-list" role="listbox" aria-label="コマンド一覧"></div>
            <div class="panel-hint">
              <small data-i18n="HINT_COMMAND_PALETTE">↑↓ で選択、Enter で実行、Esc で閉じる</small>
            </div>
          </div>
        `;
        document.body.appendChild(panel);
      }

      this.panel = panel;
      this.input = document.getElementById('command-palette-input');
      this.list = document.getElementById('command-palette-list');

      // イベントリスナー設定
      this.setupEventListeners();
    }

    setupEventListeners() {
      // 閉じるボタン
      const closeBtn = document.getElementById('close-command-palette');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide());
      }

      // 入力フィールド
      if (this.input) {
        this.input.addEventListener('input', (e) => this.filterCommands(e.target.value));
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
      }

      // パネル外クリックで閉じる
      this.panel.addEventListener('click', (e) => {
        if (e.target === this.panel) {
          this.hide();
        }
      });

      // Escapeキーで閉じる
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isVisible) {
          this.hide();
        }
      });
    }

    filterCommands(query) {
      const lowerQuery = (query || '').toLowerCase().trim();
      this.filteredCommands = COMMANDS.filter(cmd => {
        if (!lowerQuery) return true;
        const searchText = `${cmd.label} ${cmd.description} ${cmd.category} ${cmd.shortcut}`.toLowerCase();
        return searchText.includes(lowerQuery);
      });

      // カテゴリごとにグループ化
      const grouped = {};
      this.filteredCommands.forEach(cmd => {
        if (!grouped[cmd.category]) {
          grouped[cmd.category] = [];
        }
        grouped[cmd.category].push(cmd);
      });

      this.renderCommands(grouped);
      this.selectedIndex = 0;
      this.updateSelection();
    }

    renderCommands(grouped) {
      if (!this.list) return;

      this.list.innerHTML = '';

      const categories = Object.keys(grouped).sort();
      categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'command-palette-category';
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'command-palette-category-title';
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);

        const commandsDiv = document.createElement('div');
        commandsDiv.className = 'command-palette-commands';
        grouped[category].forEach((cmd, _index) => {
          const item = document.createElement('div');
          item.className = 'command-palette-item';
          item.setAttribute('role', 'option');
          item.setAttribute('data-command-id', cmd.id);
          item.innerHTML = `
            <div class="command-palette-item-label">${this.escapeHtml(cmd.label)}</div>
            <div class="command-palette-item-meta">
              <span class="command-palette-item-description">${this.escapeHtml(cmd.description)}</span>
              ${cmd.shortcut ? `<span class="command-palette-item-shortcut">${this.escapeHtml(cmd.shortcut)}</span>` : ''}
            </div>
          `;
          item.addEventListener('click', () => this.executeCommand(cmd));
          commandsDiv.appendChild(item);
        });

        categoryDiv.appendChild(commandsDiv);
        this.list.appendChild(categoryDiv);
      });

      // 結果がない場合
      if (categories.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'command-palette-empty';
        empty.textContent = 'コマンドが見つかりません';
        this.list.appendChild(empty);
      }
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    handleKeyDown(e) {
      const items = this.list.querySelectorAll('.command-palette-item');
      const maxIndex = items.length - 1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, maxIndex);
          this.updateSelection();
          this.scrollToSelected();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
          this.updateSelection();
          this.scrollToSelected();
          break;
        case 'Enter':
          e.preventDefault();
          if (items[this.selectedIndex]) {
            const commandId = items[this.selectedIndex].getAttribute('data-command-id');
            const cmd = COMMANDS.find(c => c.id === commandId);
            if (cmd) {
              this.executeCommand(cmd);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          this.hide();
          break;
      }
    }

    updateSelection() {
      const items = this.list.querySelectorAll('.command-palette-item');
      items.forEach((item, index) => {
        if (index === this.selectedIndex) {
          item.classList.add('selected');
          item.setAttribute('aria-selected', 'true');
        } else {
          item.classList.remove('selected');
          item.setAttribute('aria-selected', 'false');
        }
      });
    }

    scrollToSelected() {
      const items = this.list.querySelectorAll('.command-palette-item');
      if (items[this.selectedIndex]) {
        items[this.selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    /** 執筆面（textarea / WYSIWYG）へフォーカスを戻す */
    _focusEditingSurface() {
      const wysiwyg = document.getElementById('wysiwyg-editor');
      const textarea = document.getElementById('editor');
      if (wysiwyg && wysiwyg.style.display !== 'none') {
        wysiwyg.focus();
      } else if (textarea) {
        textarea.focus();
      }
    }

    /** Reader モード時は非表示の textarea にフォーカスを奪わせない */
    _focusReaderReturnControl() {
      const fab = document.getElementById('reader-back-fab');
      if (fab && typeof fab.focus === 'function') {
        try {
          fab.focus({ preventScroll: true });
        } catch (_) {
          fab.focus();
        }
      }
    }

    executeCommand(cmd) {
      try {
        const deferEditingFocus = cmd.id === 'ui-mode-normal' || cmd.id === 'ui-mode-focus';
        cmd.execute();
        this.hide({ skipEditingSurfaceFocus: deferEditingFocus });
        if (deferEditingFocus) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              this._focusEditingSurface();
            });
          });
        }
      } catch (error) {
        console.error('コマンド実行エラー:', error);
        if (window.ZenWriterEditor && window.ZenWriterEditor.showNotification) {
          window.ZenWriterEditor.showNotification('コマンドの実行に失敗しました', 2000);
        }
      }
    }

    show() {
      if (!this.panel || !this.input || !this.list) {
        this.init();
      }
      this.panel.style.display = 'block';
      this.isVisible = true;
      this.filterCommands('');
      this.selectedIndex = 0;
      this.updateSelection();
      
      // フォーカスを入力フィールドに
      setTimeout(() => {
        if (this.input) {
          this.input.focus();
          this.input.select();
        }
      }, 50);
    }

    /**
     * @param {object} [options]
     * @param {boolean} [options.skipEditingSurfaceFocus] true のとき執筆面への即時フォーカスをスキップ（UI モード切替後に rAF で再試行するため）
     */
    hide(options) {
      options = options || {};
      if (this.panel) {
        this.panel.style.display = 'none';
      }
      this.isVisible = false;
      if (this.input) {
        this.input.value = '';
      }
      const mode = document.documentElement.getAttribute('data-ui-mode');
      if (mode === 'reader') {
        this._focusReaderReturnControl();
      } else if (!options.skipEditingSurfaceFocus) {
        this._focusEditingSurface();
      }
    }

    toggle() {
      if (this.isVisible) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  // グローバルに公開
  window.CommandPalette = CommandPalette;
  window.commandPalette = new CommandPalette();
})();
