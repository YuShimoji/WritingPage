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

    // 要素別フォントサイズを適用
    applyElementFontSizes();

    syncToolbarHeightWithCSSVar();

    // タブ初期化
    initializeSidebarTabs();

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
            if (typeof fs.heading === 'number') root.style.setProperty('--heading-font-size', fs.heading + 'px');
            if (typeof fs.body === 'number') root.style.setProperty('--body-font-size', fs.body + 'px');
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
                group.style.gap = '6px';

                const title = document.createElement('div');
                title.className = 'plugin-title';
                title.textContent = p.name || p.id;
                title.style.fontWeight = 'bold';
                group.appendChild(title);

                const actionsWrap = document.createElement('div');
                actionsWrap.className = 'plugin-actions';
                actionsWrap.style.display = 'flex';
                actionsWrap.style.flexWrap = 'wrap';
                actionsWrap.style.gap = '6px';
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
    }
    // キーボードショートカット（app-shortcuts.js に委譲）
    if (typeof window.initAppShortcuts === 'function') {
        window.initAppShortcuts({
            toggleSidebar,
            toggleToolbar,
            setUIMode,
            restoreLastSnapshot,
            logger
        });
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
                    const w = Math.max(220, Math.min(560, s.ui.sidebarWidth));
                    sidebar.style.width = w + 'px';
                    // CSS変数にも反映（main-content のオフセットと同期）
                    document.documentElement.style.setProperty('--sidebar-width', w + 'px');
                }
                if (s.ui.tabsPresentation) {
                    sidebar.setAttribute('data-tabs-presentation', String(s.ui.tabsPresentation));
                }
                // タブ配置を適用
                if (window.sidebarManager && typeof window.sidebarManager.applyTabPlacement === 'function') {
                    window.sidebarManager.applyTabPlacement();
                }
            }
            // UIモード適用
            if (s && s.ui && s.ui.uiMode) {
                setUIMode(s.ui.uiMode, false); // 初回は保存しない
            }
            if (window.sidebarManager && typeof window.sidebarManager.applyTabsPresentationUI === 'function') {
                window.sidebarManager.applyTabsPresentationUI();
            }
        } catch (_) { }
    })();

    // UIモード切り替え
    function setUIMode(mode, save = true) {
        const validModes = ['normal', 'focus', 'blank'];
        const targetMode = validModes.includes(mode) ? mode : 'normal';

        const currentMode = document.documentElement.getAttribute('data-ui-mode');

        // ブランクモードに入るときは、ツールバーを一時的に隠して
        // 再表示用FAB（show-toolbar）を出しておく
        if (targetMode === 'blank') {
            try {
                if (window.sidebarManager && typeof window.sidebarManager.setToolbarVisibility === 'function') {
                    window.sidebarManager.setToolbarVisibility(false);
                } else {
                    document.documentElement.setAttribute('data-toolbar-hidden', 'true');
                }
            } catch (_) { }
        }

        // ブランクモードから通常/フォーカスに戻る場合、ツールバー状態を復元
        if (currentMode === 'blank' && targetMode !== 'blank') {
            try {
                const s = window.ZenWriterStorage.loadSettings();
                const toolbarVisible = s.toolbarVisible !== false; // デフォルトは表示
                if (window.sidebarManager && typeof window.sidebarManager.setToolbarVisibility === 'function') {
                    window.sidebarManager.setToolbarVisibility(toolbarVisible);
                }
            } catch (_) {
                // エラー時はツールバーを表示状態に戻す
                if (window.sidebarManager && typeof window.sidebarManager.setToolbarVisibility === 'function') {
                    window.sidebarManager.setToolbarVisibility(true);
                } else {
                    document.documentElement.removeAttribute('data-toolbar-hidden');
                }
            }
        }

        document.documentElement.setAttribute('data-ui-mode', targetMode);

        const select = document.getElementById('ui-mode-select');
        if (select && select.value !== targetMode) {
            select.value = targetMode;
        }

        if (save) {
            try {
                const s = window.ZenWriterStorage.loadSettings();
                if (!s.ui) s.ui = {};
                s.ui.uiMode = targetMode;
                window.ZenWriterStorage.saveSettings(s);
            } catch (_) { }
        }
    }

    const uiModeSelect = document.getElementById('ui-mode-select');
    if (uiModeSelect) {
        uiModeSelect.addEventListener('change', (e) => {
            setUIMode(e.target.value);
        });
    }

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
});
