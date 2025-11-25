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
        const tabsContainer = document.querySelector('.sidebar-tabs');
        if (!tabsContainer) return;
        tabsContainer.innerHTML = '';
        sidebarManager.sidebarTabConfig.forEach(tab => {
            const tabBtn = document.createElement('button');
            tabBtn.className = 'sidebar-tab';
            tabBtn.type = 'button';
            tabBtn.dataset.group = tab.id;
            tabBtn.setAttribute('aria-controls', `sidebar-group-${tab.id}`);
            tabBtn.setAttribute('aria-selected', 'false');
            tabBtn.textContent = tab.label;
            // クリックハンドラを追加
            tabBtn.addEventListener('click', () => {
                activateSidebarGroup(tab.id);
            });
            tabsContainer.appendChild(tabBtn);
        });
        try {
            const s = window.ZenWriterStorage.loadSettings();
            const list = (s && s.ui && Array.isArray(s.ui.customTabs)) ? s.ui.customTabs : [];
            list.forEach(t => { try { if (window.sidebarManager && typeof window.sidebarManager.addTab === 'function') window.sidebarManager.addTab(t.id, t.label); } catch (_) { } });
        } catch (_) { }
        // 初期アクティブタブ
        const firstTab = tabsContainer.querySelector('.sidebar-tab');
        if (firstTab) {
            firstTab.classList.add('active');
            firstTab.setAttribute('aria-selected', 'true');
        }
        // ElementManager のキャッシュを最新DOMで再取得（タブ生成後に必要）
        if (window.elementManager && typeof window.elementManager.initialize === 'function') {
            window.elementManager.initialize();
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

    // 印刷処理
    function _printDocument() {
        const pv = elementManager.get('print-view');
        if (!pv || !elementManager.get('editor')) return;
        const text = elementManager.get('editor').value || '';
        pv.innerHTML = '';
        const norm = text.replace(/\r\n/g, '\n');
        const blocks = norm.split(/\n{2,}/);
        blocks.forEach(seg => {
            const p = document.createElement('p');
            p.textContent = seg;
            pv.appendChild(p);
        });
        window.print();
    }

    function _forceSidebarState(open) {
        const sidebar = elementManager.get('sidebar');
        if (!sidebar) {
            logger.error('サイドバー要素が見つかりません');
            return;
        }

        logger.info(`forceSidebarState(${open}) 実行開始`);
        logger.info(`現在の状態: open=${sidebar.classList.contains('open')}, aria-hidden=${sidebar.getAttribute('aria-hidden')}`);

        // 閉じる場合、サイドバー内のフォーカスを外部に移動してからaria-hiddenを設定
        if (!open) {
            const activeElement = document.activeElement;
            // サイドバー内にフォーカスがある場合、エディタに移動
            if (sidebar.contains(activeElement)) {
                const editor = elementManager.get('editor');
                if (editor) {
                    // フォーカスを移動
                    editor.focus();
                    logger.info('サイドバー閉鎖のため、フォーカスをエディタに移動');
                } else {
                    // エディタがない場合はbodyにフォーカス
                    document.body.focus();
                    logger.info('サイドバー閉鎖のため、フォーカスをbodyに移動');
                }
            }
        }

        // CSSクラスの更新
        if (open) {
            sidebar.classList.add('open');
            document.documentElement.setAttribute('data-sidebar-open', 'true');
            logger.info('サイドバーに .open クラスを追加');
        } else {
            sidebar.classList.remove('open');
            document.documentElement.removeAttribute('data-sidebar-open');
            logger.info('サイドバーから .open クラスを削除');
        }

        // ツールバー側の閉じるボタンの表示制御
        const toolbarCloseSidebar = elementManager.get('toolbarCloseSidebar');
        if (toolbarCloseSidebar) {
            toolbarCloseSidebar.style.display = ''; // 常に表示
            logger.info(`ツールバーの閉じるボタン: 表示`);
        }

        // aria-hiddenはフォーカス移動後に設定（requestAnimationFrameで次のフレームで実行）
        requestAnimationFrame(() => {
            sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
            logger.info(`サイドバー aria-hidden="${open ? 'false' : 'true'}" を設定`);
            logger.info(`最終状態: open=${sidebar.classList.contains('open')}, left=${getComputedStyle(sidebar).left}`);
        });
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

    function _formatTs(ts) {
        const d = new Date(ts);
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }

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

    // イベントリスナーを設定
    const toggleSidebarBtn = elementManager.get('toggleSidebarBtn');
    const toolbarCloseSidebar = elementManager.get('toolbarCloseSidebar');
    const toggleToolbarBtn = elementManager.get('toggleToolbarBtn');
    const showToolbarBtn = elementManager.get('showToolbarBtn');
    const feedbackBtn = elementManager.get('feedbackBtn');

    // サイドバーの開閉ボタン（ツールバー側のみ）
    if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', toggleSidebar);
    if (toolbarCloseSidebar) toolbarCloseSidebar.addEventListener('click', toggleSidebar);

    // その他のボタン
    if (toggleToolbarBtn) toggleToolbarBtn.addEventListener('click', toggleToolbar);
    if (showToolbarBtn) showToolbarBtn.addEventListener('click', toggleToolbar);
    if (feedbackBtn) feedbackBtn.addEventListener('click', toggleFeedbackPanel);

    const sidebarTabs = elementManager.getMultiple('sidebarTabs');
    if (sidebarTabs && sidebarTabs.length) {
        sidebarTabs.forEach(tab => {
            tab.addEventListener('click', () => activateSidebarGroup(tab.dataset.group));
        });
    }
    // キーボードショートカット: Alt+W でツールバー表示切替
    // capture: trueで優先的に処理
    document.addEventListener('keydown', (e) => {
        // Alt + 1: サイドバーを開閉（タブは1つのみなので単純化）
        if (e.altKey && e.key === '1') {
            e.preventDefault();
            e.stopPropagation();
            logger.info('キーボードショートカット: Alt+1 → サイドバー開閉');
            toggleSidebar();
            return;
        }

        const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        const inFormControl = ['input', 'select', 'textarea', 'button'].includes(targetTag);

        // Alt+W: ツールバー切り替え
        if (!inFormControl && e.altKey && (e.key === 'w' || e.key === 'W')) {
            if (e.repeat) return;
            e.preventDefault();

            // ブランクモードなら通常モードに戻す
            const currentMode = document.documentElement.getAttribute('data-ui-mode');
            if (currentMode === 'blank') {
                setUIMode('normal');
                return;
            }

            toggleToolbar();
            return;
        }

        // Ctrl+F: 検索パネル
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
                window.ZenWriterEditor.toggleSearchPanel();
            }
        }
    }, true); // capture: trueで優先的に処理

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
            }
            // UIモード適用
            if (s && s.ui && s.ui.uiMode) {
                setUIMode(s.ui.uiMode, false); // 初回は保存しない
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

    // ガジェットの初期化（全パネル）
    function initGadgetsWithRetry() {
        let tries = 0;
        const maxTries = 60; // ~3秒
        function tick() {
            tries++;
            if (window.ZWGadgets && typeof window.ZWGadgets.init === 'function') {
                logger.info('ZWGadgets が利用可能になりました。初期化を開始します');
                try {
                    const panels = Array.from(document.querySelectorAll('.gadgets-panel[data-gadget-group]'))
                        .map(panel => ({ selector: `#${panel.id}`, group: panel.dataset.gadgetGroup }))
                        .filter(info => info.selector && info.group);

                    if (!panels.length) {
                        logger.warn('初期化対象のガジェットパネルが見つかりません');
                    }

                    panels.forEach(info => {
                        try {
                            window.ZWGadgets.init(info.selector, { group: info.group });
                            logger.info(`ガジェット初期化完了: ${info.selector}`);
                        } catch (initErr) {
                            logger.error(`ガジェット初期化失敗: ${info.selector}`, initErr);
                        }
                    });

                    if (typeof window.ZWGadgets.setActiveGroup === 'function') {
                        window.ZWGadgets.setActiveGroup('structure');
                    }

                    setTimeout(() => {
                        if (typeof window.ZWGadgets._renderLast === 'function') {
                            window.ZWGadgets._renderLast();
                            logger.info('ガジェット初期レンダリング完了（全ガジェット登録済み）');
                        }
                    }, 300);
                } catch (e) {
                    logger.error('ガジェット初期化エラー:', e);
                }
                return;
            }
            if (tries < maxTries) {
                setTimeout(tick, 50);
            } else {
                logger.error(`ZWGadgets の初期化に失敗しました（${maxTries}回試行）`);
            }
        }
        tick();
    }

    // ロードアウトUI初期化
    function initLoadoutUI() {
        const loadoutSelect = document.getElementById('loadout-select');
        const loadoutName = document.getElementById('loadout-name');
        const loadoutSaveBtn = document.getElementById('loadout-save');
        const loadoutDuplicateBtn = document.getElementById('loadout-duplicate');
        const loadoutApplyBtn = document.getElementById('loadout-apply');
        const loadoutDeleteBtn = document.getElementById('loadout-delete');

        if (!loadoutSelect) return;

        function refreshLoadoutList() {
            if (!window.ZWGadgets) return;
            const active = window.ZWGadgets.getActiveLoadout();
            const data = window.ZWGadgets._ensureLoadouts();
            loadoutSelect.innerHTML = '';
            Object.keys(data.entries || {}).forEach(key => {
                const entry = data.entries[key];
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = entry.label || key;
                loadoutSelect.appendChild(opt);
            });
            loadoutSelect.value = active.name || '';
            if (loadoutName) loadoutName.value = active.label || '';
        }

        if (loadoutSaveBtn) {
            loadoutSaveBtn.addEventListener('click', () => {
                if (!window.ZWGadgets) return;
                const name = loadoutSelect.value || ('preset-' + Date.now());
                const label = loadoutName.value || name;
                const captured = window.ZWGadgets.captureCurrentLoadout(label);
                window.ZWGadgets.defineLoadout(name, captured);
                window.ZWGadgets.activateLoadout(name);
                refreshLoadoutList();
                logger.info(`ロードアウト保存: ${label}`);
            });
        }

        if (loadoutDuplicateBtn) {
            loadoutDuplicateBtn.addEventListener('click', () => {
                if (!window.ZWGadgets) return;
                const current = window.ZWGadgets.getActiveLoadout();
                const newName = 'preset-' + Date.now();
                const newLabel = (loadoutName.value || current.label || '') + 'のコピー';
                window.ZWGadgets.defineLoadout(newName, { label: newLabel, groups: current.entry.groups });
                refreshLoadoutList();
                logger.info(`ロードアウト複製: ${newLabel}`);
            });
        }

        if (loadoutApplyBtn) {
            loadoutApplyBtn.addEventListener('click', () => {
                if (!window.ZWGadgets) return;
                const name = loadoutSelect.value;
                if (name && window.ZWGadgets.activateLoadout(name)) {
                    refreshLoadoutList();
                    logger.info(`ロードアウト適用: ${name}`);
                }
            });
        }

        if (loadoutDeleteBtn) {
            loadoutDeleteBtn.addEventListener('click', () => {
                if (!window.ZWGadgets) return;
                const name = loadoutSelect.value;
                // ZWGadgets.deleteLoadout() が内部で確認ダイアログを表示するため、ここでは confirm を呼ばない
                if (name && window.ZWGadgets.deleteLoadout(name)) {
                    refreshLoadoutList();
                    logger.info(`ロードアウト削除: ${name}`);
                }
            });
        }

        if (loadoutSelect) {
            loadoutSelect.addEventListener('change', () => {
                const name = loadoutSelect.value;
                const data = window.ZWGadgets._ensureLoadouts();
                const entry = data.entries[name];
                if (loadoutName && entry) loadoutName.value = entry.label || name;
            });
        }

        // 初期リスト生成
        setTimeout(() => {
            refreshLoadoutList();
        }, 500);
    }

    initGadgetsWithRetry();
    initLoadoutUI();

    // テーマ設定
    const themePresets = elementManager.getMultiple('themePresets');
    themePresets.forEach(btn => {
        btn.addEventListener('click', () => {
            window.ZenWriterTheme.applyTheme(btn.dataset.theme);
            // テーマプリセット選択時はカスタムカラー上書きを解除
            window.ZenWriterTheme.clearCustomColors();
            applySettingsToUI();
        });
    });

    const toggleThemeBtn = elementManager.get('toggleThemeBtn');
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', () => {
            try {
                const order = ['light', 'dark', 'sepia'];
                const currentSettings = window.ZenWriterStorage.loadSettings();
                const currentTheme = (currentSettings && currentSettings.theme) || 'light';
                const currentIndex = order.indexOf(currentTheme);
                const nextTheme = order[(currentIndex + 1 + order.length) % order.length];
                window.ZenWriterTheme.applyTheme(nextTheme);
                // テーマボタンからの切替時もカスタムカラーは一旦リセット
                window.ZenWriterTheme.clearCustomColors();
                applySettingsToUI();
            } catch (_) { }
        });
    }

    // forceSidebarState(false); // 設定反映に任せる

    // カラーピッカー
    const bgColorInput = elementManager.get('bgColorInput');
    const textColorInput = elementManager.get('textColorInput');
    if (bgColorInput) {
        bgColorInput.addEventListener('input', (e) => {
            const text = textColorInput ? textColorInput.value : '#333333';
            window.ZenWriterTheme.applyCustomColors(e.target.value, text, true);
        });
    }

    if (textColorInput) {
        textColorInput.addEventListener('input', (e) => {
            const bg = bgColorInput ? bgColorInput.value : '#ffffff';
            window.ZenWriterTheme.applyCustomColors(bg, e.target.value, true);
        });
    }

    // カスタム色リセット
    const resetColorsBtn = elementManager.get('resetColorsBtn');
    if (resetColorsBtn) {
        resetColorsBtn.addEventListener('click', () => {
            window.ZenWriterTheme.clearCustomColors();
            applySettingsToUI();
        });
    }

    // フィードバックパネル
    let feedbackPanel = null;
    function toggleFeedbackPanel() {
        if (!feedbackPanel) {
            feedbackPanel = document.createElement('div');
            feedbackPanel.className = 'floating-panel';
            feedbackPanel.id = 'feedback-panel';
            feedbackPanel.style.display = 'none';
            feedbackPanel.innerHTML = `
                <div class="panel-header">
                    <span>フィードバック</span>
                    <button class="panel-close" id="close-feedback-panel">閉じる</button>
                </div>
                <div class="panel-body">
                    <p>問題報告や機能要望をお送りください。</p>
                    <textarea id="feedback-text" placeholder="詳細を記述してください..." rows="6" style="width:100%; margin:8px 0;"></textarea>
                    <div style="display:flex; gap:8px;">
                        <button id="submit-feedback" class="small">送信</button>
                        <button id="cancel-feedback" class="small">キャンセル</button>
                    </div>
                </div>
            `;
            document.body.appendChild(feedbackPanel);
            document.getElementById('close-feedback-panel').addEventListener('click', () => feedbackPanel.style.display = 'none');
            document.getElementById('cancel-feedback').addEventListener('click', () => feedbackPanel.style.display = 'none');
            document.getElementById('submit-feedback').addEventListener('click', () => {
                const text = document.getElementById('feedback-text').value.trim();
                if (text) {
                    // GitHub Issue作成（仮）
                    const url = `https://github.com/YuShimoji/WritingPage/issues/new?title=Feedback&body=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                    feedbackPanel.style.display = 'none';
                    document.getElementById('feedback-text').value = '';
                }
            });
        }
        feedbackPanel.style.display = feedbackPanel.style.display === 'none' ? 'block' : 'none';
    }

    // フローティングツール（フォントパネル）
    function toggleFontPanel(forceShow = null) {
        const fontPanel = elementManager.get('fontPanel');
        if (!fontPanel) return;
        const willShow = forceShow !== null ? !!forceShow : fontPanel.style.display === 'none';
        fontPanel.style.display = willShow ? 'block' : 'none';
        if (willShow) {
            // 現在設定をUIへ反映
            const s = window.ZenWriterStorage.loadSettings();
            const globalFontRange = elementManager.get('globalFontRange');
            const globalFontNumber = elementManager.get('globalFontNumber');
            if (globalFontRange) globalFontRange.value = s.fontSize;
            if (globalFontNumber) globalFontNumber.value = s.fontSize;
            syncHudQuickControls();
        }
    }
    const toolsFab = elementManager.get('toolsFab');
    const closeFontPanelBtn = elementManager.get('closeFontPanelBtn');
    const hudToggleVisibilityBtn = elementManager.get('hudToggleVisibility');
    const hudPinToggleBtn = elementManager.get('hudPinToggle');
    const hudRefreshBtn = elementManager.get('hudRefresh');
    if (toolsFab) toolsFab.addEventListener('click', () => toggleFontPanel());
    if (closeFontPanelBtn) closeFontPanelBtn.addEventListener('click', () => toggleFontPanel(false));
    if (hudToggleVisibilityBtn) hudToggleVisibilityBtn.addEventListener('click', () => toggleHudVisibility());
    if (hudPinToggleBtn) hudPinToggleBtn.addEventListener('click', () => toggleHudPinned());
    if (hudRefreshBtn) hudRefreshBtn.addEventListener('click', () => refreshHudFromSettings());

    // フォントパネルのコントロール
    function updateGlobalFontFrom(value) {
        const size = parseFloat(value);
        if (!isNaN(size)) {
            window.ZenWriterEditor.setGlobalFontSize(size);
        }
    }
    const globalFontRange = elementManager.get('globalFontRange');
    const globalFontNumber = elementManager.get('globalFontNumber');
    if (globalFontRange) {
        globalFontRange.addEventListener('input', (e) => {
            updateGlobalFontFrom(e.target.value);
        });
    }
    if (globalFontNumber) {
        globalFontNumber.addEventListener('input', (e) => {
            updateGlobalFontFrom(e.target.value);
        });
    }

    function loadHudSettings() {
        try {
            const s = window.ZenWriterStorage.loadSettings();
            return (s && s.hud) ? Object.assign({}, s.hud) : {};
        } catch (_) {
            return {};
        }
    }

    function saveHudSettings(patch) {
        try {
            if (!patch || typeof patch !== 'object') return;
            const s = window.ZenWriterStorage.loadSettings();
            s.hud = Object.assign({}, s.hud || {}, patch);
            window.ZenWriterStorage.saveSettings(s);
            if (window.ZenWriterHUD && typeof window.ZenWriterHUD.applyConfig === 'function') {
                window.ZenWriterHUD.applyConfig(s.hud);
            }
        } catch (_) { }
    }

    function hudElement() {
        if (!window.ZenWriterHUD) return null;
        try { return window.ZenWriterHUD.el || null; } catch (_) { return null; }
    }

    function syncHudQuickControls() {
        const hudCfg = loadHudSettings();
        const hudEl = hudElement();
        const isVisible = !!(hudEl && hudEl.classList.contains('show'));
        if (hudToggleVisibilityBtn) {
            hudToggleVisibilityBtn.textContent = isVisible ?
                (window.UILabels ? window.UILabels.HUD_HIDE : 'HUDを隠す') :
                (window.UILabels ? window.UILabels.HUD_SHOW : 'HUDを表示');
        }
        if (hudPinToggleBtn) {
            hudPinToggleBtn.textContent = hudCfg.pinned ?
                (window.UILabels ? window.UILabels.HUD_PIN_OFF : 'HUDピン解除') :
                (window.UILabels ? window.UILabels.HUD_PIN_ON : 'HUDピン固定');
        }
    }

    function toggleHudVisibility(forceShow = null) {
        if (!window.ZenWriterHUD) return;
        const hudEl = hudElement();
        const currentlyVisible = !!(hudEl && hudEl.classList.contains('show'));
        const shouldShow = forceShow !== null ? !!forceShow : !currentlyVisible;
        if (shouldShow) {
            const cfg = loadHudSettings();
            const message = cfg.message || window.ZenWriterHUD.defaultMessage || 'HUDを表示しました';
            try {
                window.ZenWriterHUD.publish(message, cfg.duration || null, { persistMessage: true });
            } catch (_) { }
            if (cfg.pinned && typeof window.ZenWriterHUD.pin === 'function') {
                window.ZenWriterHUD.pin();
            }
        } else {
            if (typeof window.ZenWriterHUD.hide === 'function') {
                window.ZenWriterHUD.hide();
            }
        }
        syncHudQuickControls();
    }

    function toggleHudPinned() {
        const cfg = loadHudSettings();
        const nextPinned = !cfg.pinned;
        saveHudSettings({ pinned: nextPinned });
        if (window.ZenWriterHUD) {
            try {
                if (nextPinned && typeof window.ZenWriterHUD.pin === 'function') {
                    window.ZenWriterHUD.pin();
                    toggleHudVisibility(true);
                } else if (!nextPinned && typeof window.ZenWriterHUD.unpin === 'function') {
                    window.ZenWriterHUD.unpin();
                }
            } catch (_) { }
        }
        syncHudQuickControls();
    }

    function refreshHudFromSettings() {
        if (window.ZenWriterHUD) {
            try {
                if (typeof window.ZenWriterHUD.updateFromSettings === 'function') {
                    window.ZenWriterHUD.updateFromSettings();
                } else if (typeof window.ZenWriterHUD.refresh === 'function') {
                    window.ZenWriterHUD.refresh();
                }
            } catch (_) { }
        }
        syncHudQuickControls();
    }

    syncHudQuickControls();

    // スナップショット: 今すぐ保存
    // 削除済み

    // フォント設定
    const fontFamilySelect = elementManager.get('fontFamilySelect');
    const fontSizeInput = elementManager.get('fontSizeInput');
    const fontSizeValue = elementManager.get('fontSizeValue');
    const lineHeightInput = elementManager.get('lineHeightInput');
    const lineHeightValue = elementManager.get('lineHeightValue');
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', (e) => {
            window.ZenWriterTheme.applyFontSettings(
                e.target.value,
                parseFloat(fontSizeInput.value),
                parseFloat(lineHeightInput.value)
            );
        });
    }

    if (fontSizeInput) {
        fontSizeInput.addEventListener('input', (e) => {
            if (fontSizeValue) fontSizeValue.textContent = e.target.value;
            window.ZenWriterTheme.applyFontSettings(
                fontFamilySelect.value,
                parseFloat(e.target.value),
                parseFloat(lineHeightInput.value)
            );
        });
    }

    if (lineHeightInput) {
        lineHeightInput.addEventListener('input', (e) => {
            if (lineHeightValue) lineHeightValue.textContent = e.target.value;
            window.ZenWriterTheme.applyFontSettings(
                fontFamilySelect.value,
                parseFloat(fontSizeInput.value),
                parseFloat(e.target.value)
            );
        });
    }

    // ------- 執筆目標（goal） -------
    function saveGoalPatch(patch) {
        const s = window.ZenWriterStorage.loadSettings();
        s.goal = { ...(s.goal || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
        // 文字数表示を更新
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.updateWordCount === 'function') {
            window.ZenWriterEditor.updateWordCount();
        }
    }

    // ------- Editor 設定（typewriter / snapshot / preview） -------
    function saveTypewriterPatch(patch) {
        const s = window.ZenWriterStorage.loadSettings();
        s.typewriter = { ...(s.typewriter || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
    }
    function saveSnapshotPatch(patch) {
        const s = window.ZenWriterStorage.loadSettings();
        s.snapshot = { ...(s.snapshot || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
    }
    function savePreviewPatch(patch) {
        const s = window.ZenWriterStorage.loadSettings();
        s.preview = { ...(s.preview || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
    }

    // リアルタイム自動保存設定
    const autoSaveEnabled = elementManager.get('autoSaveEnabled');
    const autoSaveDelay = elementManager.get('autoSaveDelay');
    const currentSettings = window.ZenWriterStorage.loadSettings();
    const currentAutoSave = (currentSettings && currentSettings.autoSave) || {};
    if (autoSaveEnabled) autoSaveEnabled.checked = !!currentAutoSave.enabled;
    if (autoSaveDelay) autoSaveDelay.value = String(currentAutoSave.delayMs || 2000);

    // clamp helpers
    const clamp = (val, min, max, def) => {
        const n = typeof val === 'number' ? val : parseFloat(val);
        if (isNaN(n)) return def;
        return Math.max(min, Math.min(max, n));
    };

    // Typewriter handlers
    const typewriterEnabled = elementManager.get('typewriterEnabled');
    const typewriterAnchor = elementManager.get('typewriterAnchor');
    const typewriterStickiness = elementManager.get('typewriterStickiness');
    if (typewriterEnabled) {
        typewriterEnabled.addEventListener('change', (e) => saveTypewriterPatch({ enabled: !!e.target.checked }));
    }
    if (typewriterAnchor) {
        const onChange = (e) => saveTypewriterPatch({ anchorRatio: clamp(e.target.value, 0.05, 0.95, 0.5) });
        typewriterAnchor.addEventListener('input', onChange);
        typewriterAnchor.addEventListener('change', onChange);
    }
    if (typewriterStickiness) {
        const onChange = (e) => saveTypewriterPatch({ stickiness: clamp(e.target.value, 0, 1, 0.9) });
        typewriterStickiness.addEventListener('input', onChange);
        typewriterStickiness.addEventListener('change', onChange);
    }

    // Snapshot handlers
    const snapshotInterval = elementManager.get('snapshotInterval');
    const snapshotDelta = elementManager.get('snapshotDelta');
    const snapshotRetention = elementManager.get('snapshotRetention');
    if (snapshotInterval) {
        const onChange = (e) => saveSnapshotPatch({ intervalMs: Math.round(clamp(e.target.value, 30000, 300000, 120000)) });
        snapshotInterval.addEventListener('input', onChange);
        snapshotInterval.addEventListener('change', onChange);
    }
    if (snapshotDelta) {
        const onChange = (e) => saveSnapshotPatch({ deltaChars: Math.round(clamp(e.target.value, 50, 1000, 300)) });
        snapshotDelta.addEventListener('input', onChange);
        snapshotDelta.addEventListener('change', onChange);
    }
    if (snapshotRetention) {
        const onChange = (e) => saveSnapshotPatch({ retention: Math.round(clamp(e.target.value, 1, 50, 10)) });
        snapshotRetention.addEventListener('input', onChange);
        snapshotRetention.addEventListener('change', onChange);
    }

    // Preview handlers
    const previewSyncScroll = elementManager.get('previewSyncScroll');
    if (previewSyncScroll) {
        previewSyncScroll.addEventListener('change', (e) => savePreviewPatch({ syncScroll: !!e.target.checked }));
    }
    const goalTargetInput = elementManager.get('goalTargetInput');
    const goalDeadlineInput = elementManager.get('goalDeadlineInput');
    // 初期値を設定から反映
    try {
        const s = window.ZenWriterStorage.loadSettings();
        const g = (s && s.goal) || {};
        if (goalTargetInput) goalTargetInput.value = (parseInt(g.target, 10) || 0) || '';
        if (goalDeadlineInput) goalDeadlineInput.value = g.deadline || '';
        // 文字数表示の初期更新（CSSゲーティングを反映）
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.updateWordCount === 'function') {
            window.ZenWriterEditor.updateWordCount();
        }
    } catch (_) { }
    if (goalTargetInput) {
        const clampTarget = (v) => Math.max(0, parseInt(v, 10) || 0);
        goalTargetInput.addEventListener('input', (e) => saveGoalPatch({ target: clampTarget(e.target.value) }));
        goalTargetInput.addEventListener('change', (e) => saveGoalPatch({ target: clampTarget(e.target.value) }));
    }
    if (goalDeadlineInput) {
        goalDeadlineInput.addEventListener('change', (e) => saveGoalPatch({ deadline: (e.target.value || '') || null }));
    }

    // AutoSave handlers
    function saveAutoSavePatch(patch) {
        const s = window.ZenWriterStorage.loadSettings();
        s.autoSave = { ...(s.autoSave || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
    }
    if (autoSaveEnabled) {
        autoSaveEnabled.addEventListener('change', (e) => saveAutoSavePatch({ enabled: !!e.target.checked }));
    }
    // エディタ設定保存関数
    function saveEditorPatch(patch) {
        const s = window.ZenWriterStorage.loadSettings();
        s.editor = { ...(s.editor || {}), ...patch };
        s.editor.wordWrap = { ...(s.editor.wordWrap || {}), ...(patch.wordWrap || {}) };
        window.ZenWriterStorage.saveSettings(s);
        // エディタに即時反映
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyWordWrap === 'function') {
            window.ZenWriterEditor.applyWordWrap();
        }
    }

    // Editor settings handlers
    const wordWrapEnabled = elementManager.get('wordWrapEnabled');
    const wordWrapMaxChars = elementManager.get('wordWrapMaxChars');
    if (wordWrapEnabled) {
        wordWrapEnabled.addEventListener('change', (e) => saveEditorPatch({ wordWrap: { enabled: !!e.target.checked } }));
    }
    if (wordWrapMaxChars) {
        const onChange = (e) => saveEditorPatch({ wordWrap: { maxChars: Math.round(clamp(e.target.value, 20, 200, 80)) } });
        wordWrapMaxChars.addEventListener('input', onChange);
        wordWrapMaxChars.addEventListener('change', onChange);
    }

    // Help button: 物語Wikiヘルプを別タブで開く
    const helpButton = elementManager.get('helpButton');
    if (helpButton) {
        helpButton.addEventListener('click', function () {
            try {
                window.open('docs/wiki-help.html', '_blank', 'noopener');
            } catch (e) {
                console.error('Failed to open wiki help:', e);
            }
        });
    }

    // リアルタイム自動保存機能
    let autoSaveTimeout = null;
    function _triggerAutoSave() {
        if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
        const settings = window.ZenWriterStorage.loadSettings();
        const autoSave = settings.autoSave || {};
        if (!autoSave.enabled) return;
        const delay = autoSave.delayMs || 2000;
        autoSaveTimeout = setTimeout(() => {
            const editor = elementManager.get('editor');
            if (editor && window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                try {
                    window.ZenWriterStorage.saveContent(editor.value || '');
                    // HUDに保存通知
                    if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
                        window.ZenWriterHUD.show('自動保存されました', 1500, { bg: '#28a745', fg: '#fff' });
                    }
                } catch (e) {
                    console.error('自動保存エラー:', e);
                }
            }
        }, delay);
    }
    // オフライン検知と自動バックアップ
    let isOnline = navigator.onLine;
    function updateOnlineStatus() {
        const wasOnline = isOnline;
        isOnline = navigator.onLine;
        if (wasOnline !== isOnline) {
            if (!isOnline) {
                // オフラインになった場合
                if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
                    window.ZenWriterHUD.show('オフラインになりました。変更はローカルに保存されます。', 3000, { bg: '#ffc107', fg: '#000' });
                }
            } else {
                // オンラインに戻った場合
                if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
                    window.ZenWriterHUD.show('オンラインに戻りました。', 2000, { bg: '#28a745', fg: '#fff' });
                }
            }
        }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // 自動バックアップ強化: ページを離れる前に保存
    window.addEventListener('beforeunload', function (_e) {
        const editor = elementManager.get('editor');
        try {
            if (editor && window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                window.ZenWriterStorage.saveContent(editor.value || '');
            }
        } catch (_) { }
        // メッセージは表示しない（ブラウザがデフォルト表示）
    });

    // 定期的なバックアップ（オンライン時のみ）
    setInterval(function () {
        if (!isOnline) return;
        const editor = elementManager.get('editor');
        try {
            if (editor && window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
                window.ZenWriterStorage.addSnapshot(editor.value || '', 10); // 最大10件
            }
        } catch (_) { }
    }, 5 * 60 * 1000); // 5分ごと
    window.settingsManager.applySettingsToUI();

    // 検索パネルのイベントリスナー
    const _searchPanel = elementManager.get('searchPanel');
    const closeSearchPanelBtn = elementManager.get('closeSearchPanelBtn');
    const searchInput = elementManager.get('searchInput');
    const _replaceInput = elementManager.get('replaceInput');
    const replaceSingleBtn = elementManager.get('replaceSingleBtn');
    const replaceAllBtn = elementManager.get('replaceAllBtn');
    const searchPrevBtn = elementManager.get('searchPrevBtn');
    const searchNextBtn = elementManager.get('searchNextBtn');

    if (closeSearchPanelBtn) {
        closeSearchPanelBtn.addEventListener('click', () => {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.hideSearchPanel === 'function') {
                window.ZenWriterEditor.hideSearchPanel();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.updateSearchMatches === 'function') {
                window.ZenWriterEditor.updateSearchMatches();
            }
        });
    }

    if (replaceSingleBtn) {
        replaceSingleBtn.addEventListener('click', () => {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.replaceSingle === 'function') {
                window.ZenWriterEditor.replaceSingle();
            }
        });
    }

    if (replaceAllBtn) {
        replaceAllBtn.addEventListener('click', () => {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.replaceAll === 'function') {
                window.ZenWriterEditor.replaceAll();
            }
        });
    }

    if (searchPrevBtn) {
        searchPrevBtn.addEventListener('click', () => {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.navigateMatch === 'function') {
                window.ZenWriterEditor.navigateMatch(-1);
            }
        });
    }

    if (searchNextBtn) {
        searchNextBtn.addEventListener('click', () => {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.navigateMatch === 'function') {
                window.ZenWriterEditor.navigateMatch(1);
            }
        });
    }

    // 検索オプションの変更時にも再検索
    ['search-case-sensitive', 'search-regex'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.updateSearchMatches === 'function') {
                    window.ZenWriterEditor.updateSearchMatches();
                }
            });
        }
    });

    // 初期状態の整合性
    // applySettingsToUI() と head内の early-boot で反映済みのため、ここでの上書きは行わない

    // ===== 埋め込み/外部制御用 安定APIブリッジ =====
    if (!window.ZenWriterAPI) {
        window.ZenWriterAPI = {
            /** 現在の本文を取得 */
            getContent() {
                const el = elementManager.get('editor');
                return el ? String(el.value || '') : '';
            },
            /** 本文を設定（保存とUI更新も実施） */
            setContent(text) {
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
                    window.ZenWriterEditor.setContent(String(text || ''));
                    return true;
                }
                const el = elementManager.get('editor');
                if (el) {
                    el.value = String(text || '');
                    if (window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                        window.ZenWriterStorage.saveContent(el.value);
                    }
                    return true;
                }
                return false;
            },
            /** エディタにフォーカスを移動 */
            focus() {
                const el = elementManager.get('editor');
                if (el) { el.focus(); return true; }
                return false;
            },
            /** 現在の本文でスナップショットを追加 */
            takeSnapshot() {
                const el = elementManager.get('editor');
                const content = el ? (el.value || '') : '';
                if (window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
                    window.ZenWriterStorage.addSnapshot(content);
                    return true;
                }
                return false;
            }
        };
    }

    // タブ管理API（リスト化・外部制御用）
    const tabManager = {
        // 利用可能なタブ一覧を取得
        getAvailableTabs() {
            const conf = (window.sidebarManager && window.sidebarManager.sidebarTabConfig) ? window.sidebarManager.sidebarTabConfig : [];
            return conf.map(tab => ({
                id: tab.id,
                label: tab.label,
                icon: tab.icon,
                description: tab.description,
                isActive: document.querySelector(`.sidebar-tab[data-group="${tab.id}"]`)?.classList.contains('active') || false
            }));
        },

        // 現在のアクティブタブを取得
        getActiveTab() {
            const activeTab = document.querySelector('.sidebar-tab.active');
            if (!activeTab) return null;
            const groupId = activeTab.dataset.group;
            const conf = (window.sidebarManager && window.sidebarManager.sidebarTabConfig) ? window.sidebarManager.sidebarTabConfig : [];
            return conf.find(tab => tab.id === groupId) || null;
        },

        // タブをアクティブ化
        activateTab(tabId) {
            activateSidebarGroup(tabId);
        },

        // 次のタブに切り替え
        nextTab() {
            const current = this.getActiveTab();
            if (!current) return;
            const conf = (window.sidebarManager && window.sidebarManager.sidebarTabConfig) ? window.sidebarManager.sidebarTabConfig : [];
            const currentIndex = conf.findIndex(tab => tab.id === current.id);
            const nextIndex = (currentIndex + 1) % conf.length;
            this.activateTab(conf[nextIndex].id);
        },

        // 前のタブに切り替え
        prevTab() {
            const current = this.getActiveTab();
            if (!current) return;
            const conf = (window.sidebarManager && window.sidebarManager.sidebarTabConfig) ? window.sidebarManager.sidebarTabConfig : [];
            const currentIndex = conf.findIndex(tab => tab.id === current.id);
            const prevIndex = currentIndex === 0 ? conf.length - 1 : currentIndex - 1;
            this.activateTab(conf[prevIndex].id);
        }
    };

    // タブ管理APIをグローバルに公開
    window.ZenWriterTabs = tabManager;

    // ===== ファイル管理機能 =====
    const fileManager = {
        // ドキュメントリストを更新
        updateDocumentList() {
            const select = elementManager.get('currentDocument');
            if (!select) return;

            // 既存のオプションをクリア（最初のプレースホルダーは残す）
            while (select.options.length > 1) {
                select.remove(1);
            }

            try {
                const docs = window.ZenWriterStorage.loadDocuments ? (window.ZenWriterStorage.loadDocuments() || []) : [];
                const currentDocId = window.ZenWriterStorage.getCurrentDocId ? window.ZenWriterStorage.getCurrentDocId() : null;

                docs.forEach(doc => {
                    if (doc && doc.id && doc.name) {
                        const option = document.createElement('option');
                        option.value = doc.id;
                        option.textContent = doc.name;
                        option.selected = (doc.id === currentDocId);
                        select.appendChild(option);
                    }
                });
            } catch (e) {
                console.warn('ドキュメントリスト更新エラー:', e);
            }
        },

        // ドキュメントを切り替え
        switchDocument(docId) {
            if (!docId) return;

            try {
                // 未保存変更の確認と退避
                try {
                    const hasDirty = (window.ZenWriterEditor && typeof window.ZenWriterEditor.isDirty === 'function')
                        ? window.ZenWriterEditor.isDirty()
                        : false;
                    if (hasDirty) {
                        const msg = (window.UILabels && window.UILabels.UNSAVED_CHANGES_SWITCH) || '未保存の変更があります。ファイルを切り替えますか？\n現在の内容はスナップショットとして自動退避します。';
                        const ok = confirm(msg);
                        if (!ok) {
                            // セレクトを元に戻す
                            const selectEl = elementManager.get('currentDocument');
                            const currentDocId = window.ZenWriterStorage.getCurrentDocId ? window.ZenWriterStorage.getCurrentDocId() : null;
                            if (selectEl && currentDocId) selectEl.value = currentDocId;
                            return;
                        }
                        // 現在内容をスナップショットへ退避
                        try {
                            const editorEl = elementManager.get('editor');
                            const content = editorEl ? (editorEl.value || '') : '';
                            if (window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
                                window.ZenWriterStorage.addSnapshot(content);
                            }
                        } catch (_) { }
                    }
                } catch (_) { }

                if (window.ZenWriterStorage.setCurrentDocId) {
                    window.ZenWriterStorage.setCurrentDocId(docId);
                }

                // エディタの内容を更新
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.loadContent === 'function') {
                    window.ZenWriterEditor.loadContent();
                    window.ZenWriterEditor.updateWordCount();
                }

                // UIを更新
                this.updateDocumentList();
                try { updateDocumentTitle(); } catch (_) { }

                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.showNotification === 'function') {
                    window.ZenWriterEditor.showNotification('ファイルを切り替えました');
                }
            } catch (e) {
                console.error('ドキュメント切り替えエラー:', e);
            }
        },

        // 新規ドキュメントを作成
        createNewDocument() {
            const name = prompt((window.UILabels && window.UILabels.NEW_DOC_PROMPT) || '新しいファイルの名前を入力してください:');
            if (!name || !name.trim()) return;

            try {
                if (window.ZenWriterStorage.createDocument) {
                    const newDoc = window.ZenWriterStorage.createDocument(name.trim());
                    if (newDoc && newDoc.id) {
                        this.switchDocument(newDoc.id);
                    }
                }
            } catch (e) {
                console.error('新規ドキュメント作成エラー:', e);
            }
        },

        // ドキュメント管理の初期化
        initializeDocuments() {
            try {
                // ドキュメントが存在しない場合はデフォルトドキュメントを作成
                const docs = window.ZenWriterStorage.loadDocuments ? (window.ZenWriterStorage.loadDocuments() || []) : [];
                if (docs.length === 0) {
                    // 現在のコンテンツを取得してデフォルトドキュメントを作成
                    const currentContent = window.ZenWriterStorage.loadContent ? (window.ZenWriterStorage.loadContent() || '') : '';
                    window.ZenWriterStorage.createDocument('デフォルト', currentContent);
                }

                // 現在ドキュメントが設定されていない場合は最初のドキュメントを設定
                const currentDocId = window.ZenWriterStorage.getCurrentDocId ? window.ZenWriterStorage.getCurrentDocId() : null;
                if (!currentDocId && docs.length > 0) {
                    window.ZenWriterStorage.setCurrentDocId(docs[0].id);
                }
            } catch (e) {
                console.warn('ドキュメント初期化エラー:', e);
            }
        }
    };

    // ファイル管理イベントリスナー設定
    const currentDocumentSelect = elementManager.get('currentDocument');
    const newDocumentBtn = elementManager.get('newDocumentBtn');
    const restoreFromSnapshotBtn = elementManager.get('restoreFromSnapshotBtn');

    if (currentDocumentSelect) {
        currentDocumentSelect.addEventListener('change', (e) => {
            fileManager.switchDocument(e.target.value);
        });
    }

    if (newDocumentBtn) {
        newDocumentBtn.addEventListener('click', () => {
            // 未保存変更の確認と退避
            try {
                const hasDirty = (window.ZenWriterEditor && typeof window.ZenWriterEditor.isDirty === 'function')
                    ? window.ZenWriterEditor.isDirty()
                    : false;
                if (hasDirty) {
                    const msg = (window.UILabels && window.UILabels.UNSAVED_CHANGES_NEW) || '未保存の変更があります。新規作成を続行しますか？\n現在の内容はスナップショットとして自動退避します。';
                    const ok = confirm(msg);
                    if (!ok) return;
                    try {
                        const editorEl = elementManager.get('editor');
                        const content = editorEl ? (editorEl.value || '') : '';
                        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
                            window.ZenWriterStorage.addSnapshot(content);
                        }
                    } catch (_) { }
                }
            } catch (_) { }
            fileManager.createNewDocument();
        });
    }

    if (restoreFromSnapshotBtn) {
        restoreFromSnapshotBtn.addEventListener('click', () => {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.restoreLastSnapshot === 'function') {
                window.ZenWriterEditor.restoreLastSnapshot();
            }
        });
    }

    // 初期ドキュメント初期化とファイルリスト更新
    fileManager.initializeDocuments();
    fileManager.updateDocumentList();

    // 要素別フォントサイズを適用
    applyElementFontSizes();

    // ページ離脱時の警告（未保存変更がある場合）
    window.addEventListener('beforeunload', (e) => {
        try {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.isDirty === 'function' && window.ZenWriterEditor.isDirty()) {
                e.preventDefault();
                e.returnValue = '';
            }
        } catch (_) { }
    });
});
