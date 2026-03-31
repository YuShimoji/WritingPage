// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    // デバッグモード（開発環境でのみ有効）
    const DEBUG = !!(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const logger = {
        info: (msg, ...args) => DEBUG && console.log(`[Zen Writer] ${msg}`, ...args),
        warn: (msg, ...args) => console.warn(`[Zen Writer] ${msg}`, ...args),
        error: (msg, ...args) => console.error(`[Zen Writer] ${msg}`, ...args)
    };

    logger.info('アプリケーション初期化開始');

    // SP-077: IndexedDB 初期化 (非ブロッキング)
    if (window.ZenWriterStorage && typeof window.ZenWriterStorage.initIDB === 'function') {
        window.ZenWriterStorage.initIDB().then(function (ok) {
            if (ok) logger.info('IndexedDB 初期化完了');
        });
    }

    // 階層ドキュメントへのデータ移行
    try {
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.migrateDocumentsToHierarchy === 'function') {
            window.ZenWriterStorage.migrateDocumentsToHierarchy();
            logger.info('ドキュメントデータの階層化移行完了');
        }
    } catch (e) {
        logger.error('ドキュメントデータ移行エラー:', e);
    }

    // キーボード/マウス操作の検出（フォーカス表示の制御用）
    let _isKeyboardUser = false;
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            _isKeyboardUser = true;
            document.body.classList.add('keyboard-user');
            document.body.classList.remove('mouse-user');
        }
    }, true);
    document.addEventListener('mousedown', () => {
        _isKeyboardUser = false;
        document.body.classList.add('mouse-user');
        document.body.classList.remove('keyboard-user');
    }, true);

    // UIラベルの適用
    function applyUILabels() {
        if (!window.UILabels) return;

        // ユーザー設定（エディタプレースホルダなど）を取得
        let editorPlaceholderOverride = null;
        try {
            if (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function') {
                const s = window.ZenWriterStorage.loadSettings();
                if (s && s.editor && typeof s.editor.placeholder === 'string') {
                    const trimmed = s.editor.placeholder.trim();
                    if (trimmed) editorPlaceholderOverride = trimmed;
                }
            }
        } catch (_) { }

        // data-i18n 属性を持つ要素を更新
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (window.UILabels[key]) {
                el.textContent = window.UILabels[key];
            }
        });

        // data-i18n-placeholder 属性を持つ要素を更新
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key === 'EDITOR_PLACEHOLDER' && editorPlaceholderOverride) {
                el.setAttribute('placeholder', editorPlaceholderOverride);
            } else if (window.UILabels[key]) {
                el.setAttribute('placeholder', window.UILabels[key]);
            }
        });

        // data-i18n-title 属性を持つ要素を更新（ツールチップなど）
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (window.UILabels[key]) {
                el.setAttribute('title', window.UILabels[key]);
            }
        });

        // data-i18n-aria-label 属性を持つ要素を更新
        document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria-label');
            if (window.UILabels[key]) {
                el.setAttribute('aria-label', window.UILabels[key]);
            }
        });
    }

    // 初期化時にラベル適用
    applyUILabels();

    // グローバルオブジェクトが存在するか確認
    if (!window.ZenWriterStorage || !window.ZenWriterTheme || !window.ZenWriterEditor) {
        logger.error('必要なスクリプトが読み込まれていません');
        return;
    }

    // ElementManagerをグローバルに公開（他の関数からアクセスするため）
    window.elementManager = new ElementManager();

    // SidebarManagerを初期化
    const sidebarManager = new SidebarManager(window.elementManager);
    window.sidebarManager = sidebarManager;

    // SettingsManagerを初期化
    const settingsManager = new SettingsManager(window.elementManager);
    window.settingsManager = settingsManager;
    try {
        window.addEventListener('ZenWriterSettingsChanged', () => {
            if (window.settingsManager && typeof window.settingsManager.applySettingsToUI === 'function') {
                window.settingsManager.applySettingsToUI();
            }
        });
    } catch (_) { }

    function syncToolbarHeightWithCSSVar() {
        try {
            const toolbarEl = document.querySelector('.toolbar');
            if (!toolbarEl) return;
            const root = document.documentElement;
            const update = () => {
                const rect = toolbarEl.getBoundingClientRect();
                if (!rect || !rect.height) return;
                const h = Math.round(rect.height);
                root.style.setProperty('--toolbar-height', h + 'px');
            };
            update();
            if (typeof ResizeObserver === 'function') {
                const ro = new ResizeObserver(() => update());
                ro.observe(toolbarEl);
            } else {
                window.addEventListener('resize', update);
            }
        } catch (_) { }
    }

    // タブボタンを動的に生成
    function initializeSidebarTabs() {
        if (sidebarManager && typeof sidebarManager.bootstrapTabs === 'function') {
            sidebarManager.bootstrapTabs();
        }
    }

    // SP-076: ドックパネル初期化
    if (typeof DockManager === 'function') {
        var dockManager = new DockManager(sidebarManager);
        dockManager.init();
        window.dockManager = dockManager;
    }

    // SP-061 Phase 2: リロード時にタイポグラフィパックを復元
    if (window.ZenWriterVisualProfile && window.ZenWriterVisualProfile.getCurrentTypographyPackId) {
        var savedPackId = window.ZenWriterVisualProfile.getCurrentTypographyPackId();
        if (savedPackId) {
            window.ZenWriterVisualProfile.applyTypographyPack(savedPackId);
        }
    }

    // 要素別フォントサイズを適用
    applyElementFontSizes();

    syncToolbarHeightWithCSSVar();

    // タブ初期化
    initializeSidebarTabs();

    // R-2: 保存された blank 設定を focus に移行 (ツールバー初期化は setUIMode(force:true) に統合)
    try {
        const settings = window.ZenWriterStorage.loadSettings();
        if (settings.ui && settings.ui.uiMode === 'blank') {
            settings.ui.uiMode = 'focus';
            window.ZenWriterStorage.saveSettings(settings);
        }
    } catch (e) {
        logger.warn('設定マイグレーションエラー:', e);
    }

    // ------- 複数ドキュメント管理 -------
    function ensureInitialDocument() {
        if (!window.ZenWriterStorage) return;
        const docs = window.ZenWriterStorage.loadDocuments();
        let cur = window.ZenWriterStorage.getCurrentDocId();
        if (!docs || docs.length === 0) {
            // 既存の単一CONTENTを初回ドキュメントとして取り込む
            const initial = window.ZenWriterStorage.loadContent() || '';
            const created = window.ZenWriterStorage.createDocument('ドキュメント1', initial);
            window.ZenWriterStorage.setCurrentDocId(created.id);
            // エディタへ同期
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
                window.ZenWriterEditor.setContent(initial);
            }
            updateDocumentTitle();
        } else {
            // カレントが無ければ先頭に設定
            if (!cur || !docs.some(d => d && d.id === cur)) {
                const first = docs[0];
                window.ZenWriterStorage.setCurrentDocId(first.id);
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
                    window.ZenWriterEditor.setContent(first.content || '');
                }
                updateDocumentTitle();
            }
        }
    }

    // タイトル更新（ドキュメント名 - Zen Writer）
    function updateDocumentTitle() {
        try {
            const docs = window.ZenWriterStorage.loadDocuments() || [];
            const cur = window.ZenWriterStorage.getCurrentDocId();
            const doc = docs.find(d => d && d.id === cur);
            const name = (doc && doc.name) ? doc.name : '';
            document.title = name ? `${name} - Zen Writer` : 'Zen Writer - 小説執筆ツール';
        } catch (_) {
            document.title = 'Zen Writer - 小説執筆ツール';
        }
    }

    // 要素別フォントサイズを適用
    function applyElementFontSizes() {
        try {
            const s = window.ZenWriterStorage.loadSettings();
            const fs = (s && s.fontSizes) || {};
            const root = document.documentElement;
            if (typeof fs.heading === 'number') root.style.setProperty('--heading-font-size', (fs.heading / 16) + 'rem');
            if (typeof fs.body === 'number') root.style.setProperty('--body-font-size', (fs.body / 16) + 'rem');
        } catch (_) { }
    }

    // サイドバータブの表示方式を反映
    window.sidebarManager.applyTabsPresentationUI();

    // プラグインを描画
    function renderPlugins() {
        const pluginsPanel = elementManager.get('pluginsPanel');
        if (!pluginsPanel || !window.ZenWriterPlugins) return;
        try {
            const list = window.ZenWriterPlugins.list ? (window.ZenWriterPlugins.list() || []) : [];
            pluginsPanel.innerHTML = '';
            if (!list.length) {
                // メッセージを表示しない
                return;
            }
            list.forEach(p => {
                const group = document.createElement('div');
                group.className = 'plugin-group';
                group.style.display = 'flex';
                group.style.flexDirection = 'column';
                group.style.gap = '0.375rem';

                const title = document.createElement('div');
                title.className = 'plugin-title';
                title.textContent = p.name || p.id;
                title.style.fontWeight = 'bold';
                group.appendChild(title);

                const actionsWrap = document.createElement('div');
                actionsWrap.className = 'plugin-actions';
                actionsWrap.style.display = 'flex';
                actionsWrap.style.flexWrap = 'wrap';
                actionsWrap.style.gap = '0.375rem';
                (p.actions || []).forEach(a => {
                    const btn = document.createElement('button');
                    btn.className = 'small';
                    btn.textContent = a.label || a.id;
                    btn.addEventListener('click', () => {
                        try { if (a && typeof a.run === 'function') a.run(); } catch (e) { console.error(e); }
                    });
                    actionsWrap.appendChild(btn);
                });
                group.appendChild(actionsWrap);
                pluginsPanel.appendChild(group);
            });
        } catch (e) {
            console.error('プラグイン描画エラー:', e);
        }
    }

    // サイドバーの表示/非表示を切り替え
    function toggleSidebar() {
        window.sidebarManager.toggleSidebar();
        // ハンバーガーメニューボタンのaria-expanded属性を更新
        const toggleBtn = elementManager.get('toggleSidebarBtn');
        if (toggleBtn) {
            const sidebar = elementManager.get('sidebar');
            const isOpen = sidebar && sidebar.classList.contains('open');
            toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
    }

    // ツールバーの表示/非表示を切り替え（状態保存）
    function toggleToolbar() {
        const currentMode = document.documentElement.getAttribute('data-ui-mode');
        // ブランクモード時にツールバー操作が行われた場合は、
        // まず通常モードへ戻してから処理する（脱出用エスケープ）
        if (currentMode === 'blank') {
            setUIMode('normal');
            return;
        }
        window.sidebarManager.toggleToolbar();
        // aria-expanded属性を更新
        const toggleBtn = elementManager.get('toggleToolbarBtn');
        const showBtn = elementManager.get('showToolbarBtn');
        const toolbar = elementManager.get('toolbar');
        const isVisible = toolbar && !document.documentElement.getAttribute('data-toolbar-hidden');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', String(!!isVisible));
        }
        if (showBtn) {
            showBtn.setAttribute('aria-expanded', String(!isVisible));
        }
    }

    // フルスクリーン切り替え
    function _toggleFullscreen() {
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

    function activateSidebarGroup(groupId) {
        window.sidebarManager.activateSidebarGroup(groupId);
    }

    // HUD管理（app-hud.js に委譲）— UIイベントより先に初期化
    let appHud = null;
    if (typeof window.initAppHud === 'function') {
        appHud = window.initAppHud({ elementManager });
    }
    function syncHudQuickControls() {
        if (appHud) appHud.syncHudQuickControls();
    }

    // UIイベントリスナー（app-ui-events.js に委譲）
    let _appUIEvents = null;
    if (typeof window.initAppUIEvents === 'function') {
        _appUIEvents = window.initAppUIEvents({
            elementManager,
            toggleSidebar,
            toggleToolbar,
            _toggleFullscreen,
            syncHudQuickControls
        });
        // APIをグローバルに公開（フローティングパネルの位置管理用）
        window.appUIEventsAPI = _appUIEvents;
    }

    // R-1: setUIMode をグローバルに公開 (SP-081 Phase 3)
    // Electron-bridge / テスト / 外部モジュールは window.ZenWriterApp.setUIMode() を経由すること
    window.ZenWriterApp = window.ZenWriterApp || {};
    window.ZenWriterApp.setUIMode = setUIMode;
    // キーボードショートカット（app-shortcuts.js に委譲）
    if (typeof window.initAppShortcuts === 'function') {
        window.initAppShortcuts({
            toggleSidebar,
            toggleToolbar,
            setUIMode,
            restoreLastSnapshot,
            logger,
            sidebarManager
        });
    }

    // editor-container の空き領域クリック時にエディタへフォーカス転送
    {
        const ec = elementManager.get('editorContainer');
        if (ec) {
            ec.addEventListener('click', function (e) {
                if (e.target !== ec) return; // 子要素クリックは無視
                const wysiwyg = document.getElementById('wysiwyg-editor');
                const textarea = document.getElementById('editor');
                if (wysiwyg && wysiwyg.style.display !== 'none') {
                    wysiwyg.focus();
                } else if (textarea) {
                    textarea.focus();
                }
            });
        }
    }

    /**
     * 最後のスナップショットから復元（Ctrl+Shift+Z）
     * 復元前に現在の内容を自動でスナップショット保存
     */
    function restoreLastSnapshot() {
        const storage = window.ZenWriterStorage;
        const editor = window.ZenWriterEditor;
        if (!storage || !editor) return;

        const snapshots = storage.loadSnapshots ? storage.loadSnapshots() : [];
        if (!snapshots.length) {
            if (editor.showNotification) {
                editor.showNotification(
                    (window.UILabels && window.UILabels.RESTORE_NO_BACKUPS) || '復元できるバックアップがありません',
                    2000
                );
            }
            return;
        }

        // 確認ダイアログ
        const confirmMsg = (window.UILabels && window.UILabels.RESTORE_LAST_SNAPSHOT_CONFIRM) ||
            '最後のスナップショットから復元しますか？\n現在の内容はスナップショットとして保存されます。';
        if (!confirm(confirmMsg)) return;

        // 復元前に現在の内容をスナップショット保存（安全策）
        const currentContent = editor.editor ? editor.editor.value : '';
        if (currentContent && storage.addSnapshot) {
            storage.addSnapshot(currentContent);
        }

        // 最新のスナップショットを復元
        const latest = snapshots[0]; // 新しい順にソート済み
        if (editor.setContent) {
            editor.setContent(latest.content || '');
            if (editor.showNotification) {
                editor.showNotification(
                    (window.UILabels && window.UILabels.RESTORED) || 'バックアップから復元しました',
                    1500
                );
            }
        }
    }

    // ドキュメント操作
    // 初期: ドキュメント管理セットアップ
    ensureInitialDocument();
    updateDocumentTitle();
    renderPlugins();

    // サイドバー初期表示は設定しない（E2Eはボタンで開閉する前提）

    // UI設定を適用（サイドバー幅やタブ表示方式、UIモード）
    (function applyUISettings() {
        try {
            const s = window.ZenWriterStorage.loadSettings();
            const sidebar = elementManager.get('sidebar');
            if (sidebar && s && s.ui) {
                if (typeof s.ui.sidebarWidth === 'number') {
                    const isDesktop = window.matchMedia('(min-width: 1025px)').matches;
                    if (isDesktop) {
                        const w = Math.max(220, Math.min(560, s.ui.sidebarWidth));
                        sidebar.style.width = w + 'px';
                        // CSS変数にも反映（main-content のオフセットと同期）
                        document.documentElement.style.setProperty('--sidebar-width', w + 'px');
                    } else {
                        sidebar.style.removeProperty('width');
                        document.documentElement.style.removeProperty('--sidebar-width');
                    }
                }
                if (s.ui.tabsPresentation) {
                    sidebar.setAttribute('data-tabs-presentation', String(s.ui.tabsPresentation));
                }
                // タブ配置を適用
                if (window.sidebarManager && typeof window.sidebarManager.applyTabPlacement === 'function') {
                    window.sidebarManager.applyTabPlacement();
                }
            }
            // UIモード適用 — force:true で全コンポーネント状態を確実に初期化
            if (s && s.ui && s.ui.uiMode) {
                setUIMode(s.ui.uiMode, false, true);
            } else {
                setUIMode('normal', false, true);
            }
            if (window.sidebarManager && typeof window.sidebarManager.applyTabsPresentationUI === 'function') {
                window.sidebarManager.applyTabsPresentationUI();
            }
        } catch (_) { }
    })();

    // UIモード切り替え (SP-081 Phase 3: Blank廃止、3モード体制)
    function setUIMode(mode, save = true, force = false) {
        const validModes = ['normal', 'focus', 'reader'];
        // R-2: blank → focus にフォールバック
        var targetMode = mode === 'blank' ? 'focus' : mode;
        targetMode = validModes.includes(targetMode) ? targetMode : 'normal';

        const currentMode = document.documentElement.getAttribute('data-ui-mode');
        if (!force && currentMode === targetMode) return;

        // SP-070 Phase 2: モード変更前に chapterMode のデータを安定化
        if (currentMode !== targetMode) {
            try {
                var G = window.ZWContentGuard;
                if (G) {
                    G.flushChapterIfNeeded();
                    G.ensureSaved({ snapshot: false });
                }
            } catch (_) { }
        }

        // R-4: モード遷移前にツールバー状態を確定的にリセット
        // Normal モードに入る場合: ツールバーを確実に表示
        try {
            if (window.sidebarManager && typeof window.sidebarManager.setToolbarVisibility === 'function') {
                window.sidebarManager.setToolbarVisibility(targetMode === 'normal');
            } else if (targetMode === 'normal') {
                document.documentElement.removeAttribute('data-toolbar-hidden');
            } else {
                document.documentElement.setAttribute('data-toolbar-hidden', 'true');
            }
        } catch (_) { }

        document.documentElement.setAttribute('data-ui-mode', targetMode);

        // M-1: モード切替時にエッジホバー状態をクリア
        if (window.ZWEdgeHover && typeof window.ZWEdgeHover.dismissAll === 'function') {
            window.ZWEdgeHover.dismissAll();
        }

        // Focus / Reader モードに入る時はサイドバーを閉じる
        if (targetMode === 'focus' || targetMode === 'reader') {
            if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
                window.sidebarManager.forceSidebarState(false);
            }
        }

        // Normal モードに戻る時はサイドバー/ツールバー状態を復元
        if (targetMode === 'normal') {
            if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
                try {
                    var savedSettings = window.ZenWriterStorage.loadSettings();
                    var sidebarOpen = savedSettings && savedSettings.sidebarOpen !== false;
                    window.sidebarManager.forceSidebarState(sidebarOpen);
                } catch (_2) { }
            }
        }

        // M-2: モード切替時にフローティングツールバーを確実に非表示
        var wysiwygToolbar = document.getElementById('wysiwyg-toolbar');
        if (wysiwygToolbar) {
            wysiwygToolbar.setAttribute('data-visible', 'false');
        }

        // M-3: Reader return-bar のクリーンアップ
        // Reader 以外のモード間遷移 (Normal ↔ Focus) で残存する return-bar を除去
        if (targetMode !== 'reader') {
            var returnBar = document.querySelector('.reader-return-bar');
            if (returnBar && returnBar.parentNode) {
                returnBar.parentNode.removeChild(returnBar);
            }
        }


        // モードスイッチボタンの状態を同期
        // 全ボタン (Normal/Focus/Reader) の aria-pressed を更新
        document.querySelectorAll('.mode-switch-btn').forEach(function (btn) {
            btn.setAttribute('aria-pressed', btn.getAttribute('data-mode') === targetMode ? 'true' : 'false');
        });

        if (save) {
            try {
                const s = window.ZenWriterStorage.loadSettings();
                if (!s.ui) s.ui = {};
                s.ui.uiMode = targetMode;
                window.ZenWriterStorage.saveSettings(s);
            } catch (_) { }
        }

        // SP-076: ドックパネルにモード変更を通知
        if (window.dockManager && typeof window.dockManager._onUIModeChanged === 'function') {
            window.dockManager._onUIModeChanged(targetMode);
        }
    }

    window.ZenWriterApp = Object.assign({}, window.ZenWriterApp, {
        setUIMode,
        getUIMode: function () {
            return document.documentElement.getAttribute('data-ui-mode') || 'normal';
        }
    });

    // モードスイッチボタンのクリックハンドラ
    document.querySelectorAll('.mode-switch-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const mode = this.getAttribute('data-mode');
            if (!mode) return;
            const currentMode = document.documentElement.getAttribute('data-ui-mode');
            if (mode === 'reader') {
                // Reader ボタン: 既に Reader なら何もしない、そうでなければ enter
                if (currentMode !== 'reader' && window.ZWReaderPreview) {
                    window.ZWReaderPreview.enter();
                }
            } else if (currentMode === 'reader' && window.ZWReaderPreview) {
                // Reader から Normal/Focus へ: exit に遷移先を指定
                window.ZWReaderPreview.exit(mode);
            } else {
                setUIMode(mode);
            }
        });
    });

    // Visual Profile からの UIモード変更を受信 (SP-012)
    window.addEventListener('ZenWriterUIModeChanged', function (e) {
        if (e.detail && e.detail.source === 'visual-profile' && e.detail.mode) {
            setUIMode(e.detail.mode);
        }
    });

    // SP-070 モード切替ショートカット: app-shortcuts.js に統一 (ui.mode.cycle / ui.mode.exit)
    // Ctrl+Shift+F, Ctrl+Shift+B, Escape の処理は app-shortcuts.js (capture:true) で一元管理

    // --- SP-071: Focus チャプターパネル ---
    // チャプターリストは chapter-list.js (ZWChapterList) が管理。
    // ここではオーバーレイサイドバーの開閉のみ管理する。
    (function initFocusOverlay() {
        var settingsBtn = document.getElementById('focus-open-settings');

        function closeFocusOverlay() {
            var sidebar = document.getElementById('sidebar');
            var overlay = document.getElementById('focus-overlay-backdrop');
            if (sidebar) sidebar.classList.remove('focus-overlay-open');
            if (overlay) overlay.style.display = 'none';
        }

        function openFocusOverlay() {
            var sidebar = document.getElementById('sidebar');
            if (!sidebar) return;
            sidebar.classList.add('focus-overlay-open');
            sidebar.style.display = '';
            if (window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
                window.sidebarManager.forceSidebarState(true);
            }
            var overlay = document.getElementById('focus-overlay-backdrop');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'focus-overlay-backdrop';
                overlay.className = 'focus-overlay-backdrop';
                overlay.addEventListener('click', closeFocusOverlay);
                document.body.appendChild(overlay);
            }
            overlay.style.display = 'block';
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', function () {
                var sidebar = document.getElementById('sidebar');
                if (sidebar && sidebar.classList.contains('focus-overlay-open')) {
                    closeFocusOverlay();
                } else {
                    openFocusOverlay();
                }
            });
        }

        // Focus以外に切り替えた時にオーバーレイを閉じる
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                if (m.attributeName === 'data-ui-mode') {
                    if (document.documentElement.getAttribute('data-ui-mode') !== 'focus') {
                        closeFocusOverlay();
                    }
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });

        // 後方互換
        window.ZWFocusChapterPanel = {
            refresh: function () {
                if (window.ZWChapterList && typeof window.ZWChapterList.refresh === 'function') {
                    window.ZWChapterList.refresh();
                }
            }
        };
    })();

    // ガジェット初期化・ロードアウトUI・ツールレジストリ（app-gadgets-init.js に委譲）
    if (typeof window.initAppGadgets === 'function') {
        window.initAppGadgets({ logger });
    }

    // フィードバック/フォントパネル/検索パネルは app-ui-events.js で設定済み
    // HUD管理・ボタンのイベントリスナーは app-hud.js で設定済み（376行で初期化済み）

    // 設定UIハンドラ（app-settings-handlers.js に委譲）
    if (typeof window.initAppSettingsHandlers === 'function') {
        window.initAppSettingsHandlers({ elementManager });
    }

    // 自動保存・オフライン検知・API・タブ管理（app-autosave-api.js に委譲）
    if (typeof window.initAppAutosaveApi === 'function') {
        window.initAppAutosaveApi({ elementManager, activateSidebarGroup });
    }
    window.settingsManager.applySettingsToUI();

    // ===== ファイル管理機能（app-file-manager.js に委譲） =====
    if (typeof window.initAppFileManager === 'function') {
        window.initAppFileManager({ elementManager, updateDocumentTitle });
    }

    // ===== .zwp.json ドロップインポート =====
    (function setupJsonDropImport() {
        var dropOverlay = null;

        function isJsonFile(file) {
            return file && (file.name.endsWith('.zwp.json') || file.name.endsWith('.json'));
        }

        function hasJsonFiles(dt) {
            if (!dt || !dt.files) return false;
            for (var i = 0; i < dt.files.length; i++) {
                if (isJsonFile(dt.files[i])) return true;
            }
            return false;
        }

        function showDropOverlay() {
            if (dropOverlay) return;
            dropOverlay = document.createElement('div');
            dropOverlay.className = 'zwp-drop-overlay';
            dropOverlay.textContent = 'プロジェクトファイルをドロップして読み込み';
            document.body.appendChild(dropOverlay);
        }

        function hideDropOverlay() {
            if (dropOverlay) {
                dropOverlay.remove();
                dropOverlay = null;
            }
        }

        document.addEventListener('dragover', function (e) {
            if (!e.dataTransfer) return;
            // Files が含まれている場合のみ反応（テキストD&D等は無視）
            if (!Array.from(e.dataTransfer.types || []).includes('Files')) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            showDropOverlay();
        });

        document.addEventListener('dragleave', function (e) {
            // document 外に出た場合のみオーバーレイを消す
            if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
                hideDropOverlay();
            }
        });

        document.addEventListener('drop', function (e) {
            hideDropOverlay();
            if (!e.dataTransfer || !hasJsonFiles(e.dataTransfer)) return;

            var storage = window.ZenWriterStorage;
            if (!storage || !storage.importProjectJSON) return;

            e.preventDefault();
            var files = Array.from(e.dataTransfer.files).filter(isJsonFile);
            if (!files.length) return;

            // 最初の JSON ファイルをインポート
            var reader = new FileReader();
            reader.onload = function (ev) {
                var docId = storage.importProjectJSON(ev.target.result);
                if (docId) {
                    storage.setCurrentDocId(docId);
                    window.dispatchEvent(new CustomEvent('ZWDocumentsChanged', {
                        detail: { docs: storage.loadDocuments() || [] }
                    }));
                    // ページをリロードして新しいドキュメントを表示
                    window.location.reload();
                } else {
                    var editor = window.ZenWriterEditor;
                    if (editor && editor.showNotification) {
                        editor.showNotification('プロジェクトファイルの読み込みに失敗しました', 3000);
                    }
                }
            };
            reader.readAsText(files[0]);
        });
    })();

    // 起動時にエディタへ自動フォーカス（即執筆可能にする）
    requestAnimationFrame(function () {
        var wysiwyg = document.getElementById('wysiwyg-editor');
        var textarea = document.getElementById('editor');
        if (wysiwyg && wysiwyg.style.display !== 'none') {
            wysiwyg.focus();
        } else if (textarea) {
            textarea.focus();
        }
    });
});
