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

  function returnLeftNavRoot() {
    if (window.sidebarManager && typeof window.sidebarManager.returnToLeftNavRoot === 'function') {
      window.sidebarManager.returnToLeftNavRoot();
      return true;
    }
    return false;
  }

  function openLeftNavCategory(group) {
    if (!window.sidebarManager || typeof window.sidebarManager.activateSidebarGroup !== 'function') return false;
    window.sidebarManager.activateSidebarGroup(group);
    return true;
  }

  function isCommandPaletteDevMode() {
    return !!(window.ZenWriterDeveloperMode && typeof window.ZenWriterDeveloperMode.isEnabled === 'function' &&
      window.ZenWriterDeveloperMode.isEnabled());
  }

  // コマンド定義
  const COMMANDS = [
    // 検索・置換
    {
      id: 'search',
      label: '検索',
      description: '検索パネルを開く',
      keywords: 'find grep 探す',
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
      keywords: '検索置換 一括 置き換え',
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
      keywords: 'パネル 左 メニュー',
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
      label: 'コマンドパレットを開く',
      description: '旧ツールバー互換コマンド。現在はコマンドパレットを開く',
      keywords: '上端 バー 旧ツールバー コマンド パレット',
      shortcut: 'Alt+W',
      category: 'UI操作',
      hidden: true,
      execute: () => {
        if (window.commandPalette && typeof window.commandPalette.show === 'function') {
          window.commandPalette.show();
        }
      }
    },
    {
      id: 'toggle-fullscreen',
      label: 'フルスクリーン',
      description: 'フルスクリーンモードに切り替え',
      keywords: '全画面 immersive',
      shortcut: 'F11',
      category: 'UI操作',
      hidden: true,
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
      id: 'align-paragraph-start',
      label: '段落を左揃え',
      description: 'リッチ編集中のカーソル段落を左揃え（data-zw-align 解除）',
      keywords: '左寄せ align left',
      shortcut: '',
      category: 'テキスト装飾',
      execute: () => {
        const rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
        if (rte && typeof rte.executeCommand === 'function') {
          rte.executeCommand('alignstart');
        }
      }
    },
    {
      id: 'align-paragraph-center',
      label: '段落を中央揃え',
      description: 'リッチ編集中のカーソル段落を中央揃え',
      keywords: '中央寄せ センター align center',
      shortcut: '',
      category: 'テキスト装飾',
      execute: () => {
        const rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
        if (rte && typeof rte.executeCommand === 'function') {
          rte.executeCommand('aligncenter');
        }
      }
    },
    {
      id: 'align-paragraph-end',
      label: '段落を右揃え',
      description: 'リッチ編集中のカーソル段落を右揃え',
      keywords: '右寄せ align right',
      shortcut: '',
      category: 'テキスト装飾',
      execute: () => {
        const rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
        if (rte && typeof rte.executeCommand === 'function') {
          rte.executeCommand('alignend');
        }
      }
    },
    {
      id: 'font-decoration-panel',
      label: 'フォント装飾パネル',
      description: '装飾用フローティングパネルを開く（サイドバー編集の「フォント装飾」ガジェットと同系）',
      keywords: '装飾 文字装飾 Font Decoration',
      shortcut: '',
      category: 'テキスト装飾',
      execute: () => {
        if (window.sidebarManager) {
          window.sidebarManager.activateSidebarGroup('edit');
        }
      }
    },
    {
      id: 'text-animation-panel',
      label: 'テキストアニメーションパネル',
      description: 'サイドバーの編集カテゴリを開く（テキストアニメーション）',
      keywords: '文字アニメーション Text Animation',
      shortcut: '',
      category: 'テキスト装飾',
      execute: () => {
        if (window.sidebarManager) {
          window.sidebarManager.activateSidebarGroup('edit');
        }
      }
    },
    // ファイル操作
    {
      id: 'save',
      label: '保存（手動・即時）',
      description: '自動保存に加えて、現在の本文をすぐローカル保存する。',
      keywords: '手動保存 即時保存 ローカル保存 Ctrl+S',
      shortcut: 'Ctrl+S / Cmd+S',
      category: 'ファイル操作',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.saveContent === 'function') {
          try {
            window.ZenWriterEditor.saveContent();
            if (window.ZenWriterEditor.showNotification) {
              window.ZenWriterEditor.showNotification('保存しました');
            }
          } catch (e) {
            console.error('手動保存に失敗:', e);
            var msg = '保存に失敗しました' + (e && e.message ? ': ' + e.message : '');
            if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
              window.ZenWriterHUD.show(msg, 3000, { type: 'error' });
            } else if (window.ZenWriterEditor && window.ZenWriterEditor.showNotification) {
              window.ZenWriterEditor.showNotification(msg, 3000);
            }
          }
        }
      }
    },
    {
      id: 'restore-snapshot',
      label: 'スナップショットから復元',
      description: '最後のスナップショットから復元',
      keywords: 'バックアップ 履歴 自動保存履歴',
      shortcut: 'Ctrl+Shift+Z / Cmd+Shift+Z',
      category: 'ファイル操作',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.restoreLastSnapshot === 'function') {
          window.ZenWriterEditor.restoreLastSnapshot();
        }
      }
    },
    // Internal compatibility: 旧 display-mode commands は visible list から外し、内部互換だけ残す
    {
      id: 'ui-mode-normal',
      label: '通常表示',
      description: 'ツールバー常時表示・サイドバー復元',
      keywords: '標準 レイアウト normal 通常 表示',
      shortcut: 'F2',
      category: '表示',
      hidden: true,
      execute: () => {
        setAppUIMode('normal');
      }
    },
    {
      id: 'ui-mode-focus',
      label: 'ミニマル',
      description: 'エッジ／ショートカットでChrome',
      keywords: '集中 執筆 シンプル focus フォーカス フォーカスモード 表示',
      shortcut: 'F2',
      category: '表示',
      hidden: true,
      execute: () => {
        setAppUIMode('focus');
      }
    },
    {
      id: 'ui-mode-next',
      label: '表示を切替',
      description: '通常表示 ⇄ ミニマルを循環',
      keywords: 'サイクル 切替 cycle toggle 表示',
      shortcut: 'F2',
      category: '表示',
      hidden: true,
      execute: () => {
        var cur = document.documentElement.getAttribute('data-ui-mode') || 'focus';
        setAppUIMode(cur === 'focus' ? 'normal' : 'focus');
      }
    },
    {
      id: 'reader-overlay-toggle',
      label: 'Reader を開く / 閉じる',
      description: 'Reader surface を開閉する',
      keywords: '読者プレビュー リーダー reader surface 閲覧',
      shortcut: 'Alt+Shift+R',
      category: 'サーフェス',
      execute: () => {
        if (window.ZWReaderPreview && typeof window.ZWReaderPreview.toggle === 'function') {
          window.ZWReaderPreview.toggle();
        }
      }
    },
    {
      id: 'return-left-nav-root',
      label: '左ナビのルートへ戻る',
      description: '左ナビをカテゴリ表示からルート一覧へ戻す',
      keywords: '左ナビ ルート 戻る 戻す',
      shortcut: '',
      category: 'UI操作',
      execute: () => {
        returnLeftNavRoot();
      }
    },
    {
      id: 'editor-surface-wysiwyg',
      label: 'リッチ編集',
      description: 'エディタをリッチ編集表示に切替',
      keywords: 'リッチ 編集面 surface',
      category: '表示',
      execute: () => {
        var shim = document.getElementById('toggle-wysiwyg');
        if (shim && shim.getAttribute('aria-pressed') !== 'true') {
          shim.dispatchEvent(new Event('mousedown', { bubbles: true }));
        }
      }
    },
    {
      id: 'editor-surface-markdown',
      label: 'Markdown ソース',
      description: 'エディタを Markdown ソース面に切替',
      keywords: 'Markdown ソース 編集面 surface',
      category: '表示',
      execute: () => {
        var shim = document.getElementById('toggle-wysiwyg');
        if (shim && shim.getAttribute('aria-pressed') === 'true') {
          shim.dispatchEvent(new Event('mousedown', { bubbles: true }));
        }
      }
    },
    // フォントサイズ
    {
      id: 'font-size-increase',
      label: 'フォントサイズ拡大',
      description: 'フォントサイズを大きくする',
      keywords: '文字サイズ 拡大 ズーム zoom in',
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
      keywords: '文字サイズ 縮小 zoom out',
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
      keywords: '文字サイズ 初期 デフォルト',
      shortcut: 'Ctrl+0 / Cmd+0',
      category: 'フォント',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setGlobalFontSize === 'function') {
          const defaults = window.ZenWriterStorage ? window.ZenWriterStorage.DEFAULT_SETTINGS : {};
          window.ZenWriterEditor.setGlobalFontSize(defaults.fontSize || 16);
        }
      }
    },
    // リッチ編集の改行挙動の切替 — サイドバー設定に埋もれている機能を発見性の高いコマンドパレットへ昇格
    {
      id: 'toggle-effect-break-at-newline',
      label: 'リッチ編集: 改行で装飾を切る (ON/OFF)',
      description: 'リッチ編集で Enter 時に書式解除・decor 後処理を行うかを切替 (BL-002)',
      keywords: 'リッチ 装飾 改行 Enter BL-002 effectBreakAtNewline',
      shortcut: '',
      category: 'リッチ編集',
      execute: () => {
        try {
          if (!window.ZenWriterStorage) return;
          const s = window.ZenWriterStorage.loadSettings();
          s.editor = s.editor || {};
          const current = s.editor.effectBreakAtNewline !== false;
          s.editor.effectBreakAtNewline = !current;
          window.ZenWriterStorage.saveSettings(s);
          window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged'));
        } catch (_) { }
      }
    },
    {
      id: 'toggle-effect-persist-decor',
      label: 'リッチ編集: 改行後も decor を継続 (ON/OFF)',
      description: 'リッチ編集で Enter 後もカーソルを decor-* 要素内に残すかを切替',
      keywords: 'リッチ 装飾 改行 Enter decor effectPersistDecorAcrossNewline',
      shortcut: '',
      category: 'リッチ編集',
      execute: () => {
        try {
          if (!window.ZenWriterStorage) return;
          const s = window.ZenWriterStorage.loadSettings();
          s.editor = s.editor || {};
          const current = !!s.editor.effectPersistDecorAcrossNewline;
          s.editor.effectPersistDecorAcrossNewline = !current;
          window.ZenWriterStorage.saveSettings(s);
          window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged'));
        } catch (_) { }
      }
    },
    // ガジェット操作（動的に追加）
    {
      id: 'gadget-sections',
      label: 'セクション',
      description: 'セクションナビを開く',
      keywords: 'sections 章 見出し セクションナビゲーター',
      shortcut: '',
      category: 'ガジェット',
      execute: () => {
        openLeftNavCategory('sections');
      }
    },
    {
      id: 'gadget-structure',
      label: '構造',
      description: '構造カテゴリを開く（ドキュメント・アウトライン・Wiki）',
      keywords: 'ドキュメント 構造 アウトライン StoryWiki LinkGraph バックアップ snapshot outline',
      shortcut: '',
      category: 'ガジェット',
      execute: () => {
        openLeftNavCategory('structure');
      }
    },
    {
      id: 'gadget-edit',
      label: '編集',
      description: '編集カテゴリを開く（MDプレビュー・装飾・選択肢）',
      keywords: 'edit Markdownプレビュー MD プレビュー 装飾 選択肢 画像 animation',
      shortcut: '',
      category: 'ガジェット',
      execute: () => {
        openLeftNavCategory('edit');
      }
    },
    {
      id: 'gadget-theme',
      label: 'テーマ',
      description: 'テーマカテゴリを開く（テーマ・フォント・見出しスタイル）',
      keywords: 'theme テーマ フォント typography 見出し style visual profile',
      shortcut: '',
      category: 'ガジェット',
      execute: () => {
        openLeftNavCategory('theme');
      }
    },
    {
      id: 'gadget-assist',
      label: '補助',
      description: '補助カテゴリを開く（進捗・集中・参照）',
      keywords: 'アシスト assist タイプライター Typewriter ポモドロ Pomodoro 執筆目標 Markdownリファレンス 集中タイマー',
      shortcut: '',
      category: 'ガジェット',
      execute: () => {
        openLeftNavCategory('assist');
      }
    },
    {
      id: 'gadget-advanced',
      label: '詳細設定',
      description: '詳細設定カテゴリを開く（UI設定・出力・キー割り当て）',
      keywords: 'advanced キー割り当て ショートカット keybind 印刷 ロードアウト Loadout HUD UI設定 プリセット',
      shortcut: '',
      category: 'ガジェット',
      execute: () => {
        openLeftNavCategory('advanced');
      }
    },
    {
      id: 'open-settings',
      label: '設定を開く',
      description: 'サイドバー詳細設定カテゴリを開く (キー割当・ロードアウト・スナップショット等)',
      keywords: '環境 preferences オプション 詳細 advanced キーバインド shortcut keybind ロードアウト Loadout スナップショット',
      shortcut: 'Ctrl+, / Cmd+,',
      category: 'UI操作',
      execute: () => {
        if (window.ZenWriterApp && typeof window.ZenWriterApp.openSettingsModal === 'function') {
          window.ZenWriterApp.openSettingsModal();
        }
      }
    },
    {
      id: 'open-help',
      label: 'ヘルプを開く',
      description: 'ヘルプモーダルを表示',
      keywords: 'ガイド 使い方 editor guide',
      shortcut: 'F1',
      category: 'UI操作',
      execute: () => {
        if (window.ZenWriterApp && typeof window.ZenWriterApp.openHelpModal === 'function') {
          window.ZenWriterApp.openHelpModal();
        }
      }
    },
    {
      id: 'toggle-markdown-preview',
      label: 'MD プレビュー（横並び）',
      description: '編集画面の横に Markdown 表示を開閉。全画面閲覧ではなく並べて表示。サイドバー「Markdownプレビュー」ガジェットのスクロール同期はそちらで設定',
      keywords: 'マークダウン 並列 プレビュー 横並び Markdownプレビュー ガジェット',
      shortcut: '',
      category: '編集',
      execute: () => {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.togglePreview === 'function') {
          window.ZenWriterEditor.togglePreview();
          return;
        }
        const btn = document.getElementById('sidebar-toggle-preview');
        if (btn) btn.click();
      }
    },
    {
      id: 'toggle-wysiwyg',
      label: 'リッチ編集表示',
      description: 'リッチ表示で編集。UI モードは変わらず（読者プレビュー UI ではない）',
      keywords: '装飾 リッチテキスト 所見即得',
      shortcut: '',
      category: '編集',
      devOnly: true,
      execute: () => {
        const btn = document.getElementById('toggle-wysiwyg');
        if (btn) btn.click();
      }
    },
    {
      id: 'toggle-ui-editor',
      label: 'UI設定ガジェット',
      description: 'UIビジュアルエディタを切り替え（実験的）',
      keywords: 'UI Settings 表示設定',
      shortcut: '',
      category: '実験的機能',
      devOnly: true,
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
      id: 'toggle-floating-memo-lab',
      label: '浮遊メモ実験',
      description: 'DOM + CSS 3D の浮遊メモ実験を開閉',
      keywords: 'memo メモ 実験 3D floating drift',
      shortcut: '',
      category: '実験的機能',
      devOnly: true,
      execute: () => {
        if (window.ZWFloatingMemoField && typeof window.ZWFloatingMemoField.toggle === 'function') {
          window.ZWFloatingMemoField.toggle();
        }
      }
    },
    {
      id: 'compare-chapter',
      label: '比較ツール: 章比較',
      description: '2つの章を横並びで比較する',
      keywords: '比較 差分 章 split compare structure',
      shortcut: '',
      category: '比較ツール',
      execute: () => {
        if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
          window.sidebarManager.activateSidebarGroup('structure');
          if (typeof window.sidebarManager.toggleSidebar === 'function') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('open')) {
              window.sidebarManager.toggleSidebar();
            }
          }
        }
        if (window.ZenWriterSplitView && typeof window.ZenWriterSplitView.open === 'function') {
          window.ZenWriterSplitView.open('chapter-compare');
        }
      }
    },
    {
      id: 'compare-snapshot',
      label: '比較ツール: スナップショット差分',
      description: '2つのスナップショット差分を比較する',
      keywords: '比較 差分 スナップショット snapshot compare structure',
      shortcut: '',
      category: '比較ツール',
      execute: () => {
        if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
          window.sidebarManager.activateSidebarGroup('structure');
          if (typeof window.sidebarManager.toggleSidebar === 'function') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('open')) {
              window.sidebarManager.toggleSidebar();
            }
          }
        }
        if (window.ZenWriterSplitView && typeof window.ZenWriterSplitView.open === 'function') {
          window.ZenWriterSplitView.open('snapshot-diff');
        }
      }
    },
    {
      id: 'gadget-wiki',
      label: '物語Wikiガジェット',
      description: 'Wikiタブを開く（用語・リンク管理）',
      keywords: 'story wiki wikilink 物語 百科 用語 リンク 設定',
      shortcut: '',
      category: 'ガジェット',
      execute: () => {
        openLeftNavCategory('structure');
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
        if (cmd.devOnly && !isCommandPaletteDevMode()) return false;
        if (cmd.hidden) return false;
        if (!lowerQuery) return true;
        const searchText = `${cmd.label} ${cmd.description} ${cmd.category} ${cmd.shortcut} ${cmd.keywords || ''}`.toLowerCase();
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

    /** 再生オーバーレイ表示中は、閉じる導線へフォーカス */
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
        const keepFocusOffEditor = deferEditingFocus;
        cmd.execute();
        this.hide({ skipEditingSurfaceFocus: keepFocusOffEditor });
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
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.isOpen === 'function' && window.ZWReaderPreview.isOpen()) {
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
