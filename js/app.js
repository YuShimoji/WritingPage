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

    // グローバルオブジェクトが存在するか確認
    if (!window.ZenWriterStorage || !window.ZenWriterTheme || !window.ZenWriterEditor) {
        logger.error('必要なスクリプトが読み込まれていません');
        return;
    }

    // ElementManager: 要素取得を中央集権的に管理
    class ElementManager {
        constructor() {
            this.elements = {};
            this.initialize();
        }

        initialize() {
            const elementMap = {
                // サイドバー関連
                toggleSidebarBtn: 'toggle-sidebar',
                // sidebarHeaderCloseは削除（ツールバー側に統一）
                toolbarCloseSidebar: 'toolbar-close-sidebar',
                sidebar: 'sidebar',
                sidebarTabs: '.sidebar-tab',
                sidebarGroups: '.sidebar-group',

                // ツールバー関連
                toggleToolbarBtn: 'toggle-toolbar',
                toolbar: '.toolbar',
                showToolbarBtn: 'show-toolbar',
                fullscreenBtn: 'fullscreen',
                feedbackBtn: 'feedback',

                // テーマ関連
                bgColorInput: 'bg-color',
                textColorInput: 'text-color',
                resetColorsBtn: 'reset-colors',
                themePresets: '[data-theme-preset], .theme-preset',

                // フォント関連
                fontFamilySelect: 'font-family',
                fontSizeInput: 'font-size',
                fontSizeValue: 'font-size-value',
                lineHeightInput: 'line-height',
                lineHeightValue: 'line-height-value',
                toolsFab: 'fab-tools',
                fontPanel: 'floating-font-panel',
                closeFontPanelBtn: 'close-font-panel',
                globalFontRange: 'global-font-size',
                globalFontNumber: 'global-font-size-number',

                // エディタ関連
                editor: 'editor',
                editorContainer: '.editor-container',

                // エディタ設定UI
                typewriterEnabled: 'typewriter-enabled',
                typewriterAnchor: 'typewriter-anchor-ratio',
                typewriterStickiness: 'typewriter-stickiness',
                snapshotInterval: 'snapshot-interval-ms',
                snapshotDelta: 'snapshot-delta-chars',
                snapshotRetention: 'snapshot-retention',
                previewSyncScroll: 'preview-sync-scroll',
                autoSaveEnabled: 'auto-save-enabled',
                autoSaveDelay: 'auto-save-delay-ms',

                // HUD設定UI
                goalTargetInput: 'goal-target',
                goalDeadlineInput: 'goal-deadline',
                pluginsPanel: 'plugins-panel',
                helpButton: 'help-button',

                // 検索パネル
                searchPanel: 'search-panel',
                closeSearchPanelBtn: 'close-search-panel',
                searchInput: 'search-input',
                replaceInput: 'replace-input',
                replaceSingleBtn: 'replace-single',
                replaceAllBtn: 'replace-all',
                searchPrevBtn: 'search-prev',
                searchNextBtn: 'search-next'
            };

            // 複数要素を取得する必要があるキー
            const multipleElementKeys = ['sidebarTabs', 'sidebarGroups', 'themePresets'];

            Object.entries(elementMap).forEach(([key, selector]) => {
                try {
                    if (multipleElementKeys.includes(key) || selector.startsWith('[')) {
                        // 複数要素を配列として取得
                        const elements = selector.startsWith('.') || selector.startsWith('[')
                            ? document.querySelectorAll(selector)
                            : document.querySelectorAll(`#${selector}`);
                        this.elements[key] = Array.from(elements);
                    } else if (selector.startsWith('.')) {
                        // 単一要素をクラスで取得
                        this.elements[key] = document.querySelector(selector);
                    } else {
                        // 単一要素をIDで取得
                        this.elements[key] = document.getElementById(selector);
                    }
                } catch (error) {
                    console.warn(`要素取得エラー (${key}): ${error.message}`);
                    this.elements[key] = multipleElementKeys.includes(key) ? [] : null;
                }
            });
            
            // 初期化状態をログ出力（開発環境のみ）
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('[ElementManager] 初期化完了:', {
                    sidebar: !!this.elements.sidebar,
                    sidebarTabs: this.elements.sidebarTabs?.length || 0,
                    sidebarGroups: this.elements.sidebarGroups?.length || 0,
                    toggleSidebarBtn: !!this.elements.toggleSidebarBtn,
                    toolbarCloseSidebar: !!this.elements.toolbarCloseSidebar
                });
            }
        }

        get(name) {
            return this.elements[name] || null;
        }

        getMultiple(name) {
            return this.elements[name] || [];
        }
    }

    const elementManager = new ElementManager();

    // ElementManagerをグローバルに公開（他の関数からアクセスするため）
    window.elementManager = elementManager;

    // サイドバータブ設定の統一管理（シンプル化：1つのみ）
    const sidebarTabConfig = [
        {
            id: 'structure',
            label: 'ガジェット',
            icon: '🏗️',
            description: 'ガジェット管理',
            panelId: 'structure-gadgets-panel'
        }
    ];

    // 要素別フォントサイズを適用
    applyElementFontSizes();

    // ------- 複数ドキュメント管理 -------
    function ensureInitialDocument(){
        if (!window.ZenWriterStorage) return;
        const docs = window.ZenWriterStorage.loadDocuments();
        let cur = window.ZenWriterStorage.getCurrentDocId();
        if (!docs || docs.length === 0){
            // 既存の単一CONTENTを初回ドキュメントとして取り込む
            const initial = window.ZenWriterStorage.loadContent() || '';
            const created = window.ZenWriterStorage.createDocument('ドキュメント1', initial);
            window.ZenWriterStorage.setCurrentDocId(created.id);
            // エディタへ同期
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function'){
                window.ZenWriterEditor.setContent(initial);
            }
            updateDocumentTitle();
        } else {
            // カレントが無ければ先頭に設定
            if (!cur || !docs.some(d => d && d.id === cur)){
                const first = docs[0];
                window.ZenWriterStorage.setCurrentDocId(first.id);
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function'){
                    window.ZenWriterEditor.setContent(first.content || '');
                }
                updateDocumentTitle();
            }
        }
    }

    // タイトル更新（ドキュメント名 - Zen Writer）
    function updateDocumentTitle(){
        try {
            const docs = window.ZenWriterStorage.loadDocuments() || [];
            const cur = window.ZenWriterStorage.getCurrentDocId();
            const doc = docs.find(d => d && d.id === cur);
            const name = (doc && doc.name) ? doc.name : '';
            document.title = name ? `${name} - Zen Writer` : 'Zen Writer - 小説執筆ツール';
        } catch(_) {
            document.title = 'Zen Writer - 小説執筆ツール';
        }
    }

    // 印刷処理
    function printDocument(){
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

    function forceSidebarState(open){
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
            toolbarCloseSidebar.style.display = open ? '' : 'none';
            logger.info(`ツールバーの閉じるボタン: ${open ? '表示' : '非表示'}`);
        }
        
        // aria-hiddenはフォーカス移動後に設定（requestAnimationFrameで次のフレームで実行）
        requestAnimationFrame(() => {
            sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
            logger.info(`サイドバー aria-hidden="${open ? 'false' : 'true'}" を設定`);
            logger.info(`最終状態: open=${sidebar.classList.contains('open')}, left=${getComputedStyle(sidebar).left}`);
        });
    }

    // 要素別フォントサイズを適用
    function applyElementFontSizes(){
        try {
            const s = window.ZenWriterStorage.loadSettings();
            const fs = (s && s.fontSizes) || {};
            const root = document.documentElement;
            if (typeof fs.heading === 'number') root.style.setProperty('--heading-font-size', fs.heading + 'px');
            if (typeof fs.body === 'number') root.style.setProperty('--body-font-size', fs.body + 'px');
        } catch(_) {}
    }

    // サイドバータブの表示方式を反映
    function applyTabsPresentationUI(){
        try {
            const sb = document.getElementById('sidebar');
            if (!sb) return;
            const mode = sb.getAttribute('data-tabs-presentation') || 'tabs';
            const tabsBar = document.querySelector('.sidebar-tabs');
            const top = document.querySelector('.sidebar-top');
            const ddId = 'tabs-dropdown-select';
            let dd = document.getElementById(ddId);

            // reset defaults
            if (tabsBar) tabsBar.style.display = '';
            if (mode !== 'dropdown' && dd && dd.parentNode) dd.parentNode.removeChild(dd);

            if (mode === 'dropdown'){
                if (tabsBar) tabsBar.style.display = 'none';
                if (!dd){
                    dd = document.createElement('select');
                    dd.id = ddId;
                    dd.setAttribute('aria-label','サイドバータブ');
                    const tabs = document.querySelectorAll('.sidebar-tab');
                    tabs.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.getAttribute('data-group');
                        opt.textContent = t.textContent || opt.value;
                        dd.appendChild(opt);
                    });
                    dd.addEventListener('change', () => activateSidebarGroup(dd.value));
                    if (top) top.insertBefore(dd, top.firstChild);
                }
                // set value to current active group
                const activeTab = document.querySelector('.sidebar-tab.active');
                const gid = activeTab ? activeTab.getAttribute('data-group') : 'structure';
                if (dd) dd.value = gid;
            }

            if (mode === 'accordion'){
                if (tabsBar) tabsBar.style.display = 'none';
                // 全グループを展開表示
                document.querySelectorAll('.sidebar-group').forEach(sec => {
                    sec.classList.add('active');
                    sec.setAttribute('aria-hidden','false');
                });
            } else {
                // デフォルト動作: active のみ表示
                const activeTab = document.querySelector('.sidebar-tab.active');
                const gid = activeTab ? activeTab.getAttribute('data-group') : 'structure';
                activateSidebarGroup(gid);
            }
        } catch(_) {}
    }

    function formatTs(ts){
        const d = new Date(ts);
        const p = (n)=> String(n).padStart(2,'0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }

    // プラグインを描画
    function renderPlugins(){
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
                        try { if (a && typeof a.run === 'function') a.run(); } catch(e){ console.error(e); }
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
        const sidebar = elementManager.get('sidebar');
        if (!sidebar) return;
        const willOpen = !sidebar.classList.contains('open');
        logger.info(`サイドバーを${willOpen ? '開く' : '閉じる'}`);
        forceSidebarState(willOpen);
    }

    // ツールバー表示/非表示の適用（保存・レイアウト反映を含む）
    function setToolbarVisibility(show) {
        const toolbar = elementManager.get('toolbar');
        const showToolbarBtn = elementManager.get('showToolbarBtn');
        if (!toolbar) return;
        // インライン style ではなく、ルート属性 + クラスで一元制御
        // これにより computedStyle の不整合や一時的な二重描画を回避
        if (showToolbarBtn) showToolbarBtn.style.display = show ? 'none' : 'inline-flex';
        document.body.classList.toggle('toolbar-hidden', !show);
        if (!show) {
            document.documentElement.setAttribute('data-toolbar-hidden', 'true');
        } else {
            document.documentElement.removeAttribute('data-toolbar-hidden');
        }
    }

    // ツールバーの表示/非表示を切り替え（状態保存）
    let lastToolbarToggle = 0;
    function toggleToolbar() {
        const now = Date.now();
        if (now - lastToolbarToggle < 150) return; // debounce 二重発火防止
        lastToolbarToggle = now;
        // ルート属性（early-boot と setToolbarVisibility が管理）に基づき判定
        const rootHidden = document.documentElement.getAttribute('data-toolbar-hidden') === 'true';
        const willShow = !!rootHidden;
        setToolbarVisibility(willShow);
        // 状態保存
        const s = window.ZenWriterStorage.loadSettings();
        s.toolbarVisible = willShow;
        window.ZenWriterStorage.saveSettings(s);
        // ツールバーを表示にしたらHUDを隠す
        if (willShow && window.ZenWriterHUD && typeof window.ZenWriterHUD.hide === 'function') {
            window.ZenWriterHUD.hide();
        }
    }

    // フルスクリーン切り替え
    function toggleFullscreen() {
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

    // 設定をUIに反映
    function applySettingsToUI() {
        const settings = window.ZenWriterStorage.loadSettings();

        // テーマプリセットを選択
        const themePresets = elementManager.getMultiple('themePresets');
        themePresets.forEach(btn => {
            if (btn.dataset.theme === settings.theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // カラーピッカーを設定
        const bgColorInput = elementManager.get('bgColorInput');
        const textColorInput = elementManager.get('textColorInput');
        if (bgColorInput) bgColorInput.value = settings.bgColor;
        if (textColorInput) textColorInput.value = settings.textColor;

        // フォント設定を設定
        const fontFamilySelect = elementManager.get('fontFamilySelect');
        const fontSizeInput = elementManager.get('fontSizeInput');
        const fontSizeValue = elementManager.get('fontSizeValue');
        if (fontFamilySelect) fontFamilySelect.value = settings.fontFamily;
        if (fontSizeInput) {
            fontSizeInput.value = settings.fontSize;
            if (fontSizeValue) fontSizeValue.textContent = settings.fontSize;
        }
        const lineHeightInput = elementManager.get('lineHeightInput');
        const lineHeightValue = elementManager.get('lineHeightValue');
        if (lineHeightInput) {
            lineHeightInput.value = settings.lineHeight;
            if (lineHeightValue) lineHeightValue.textContent = settings.lineHeight;
        }
        // ツールバー表示状態
        if (typeof settings.toolbarVisible !== 'undefined') {
            setToolbarVisibility(!!settings.toolbarVisible);
        }

        // サイドバー表示状態
        if (typeof settings.sidebarVisible !== 'undefined') {
            forceSidebarState(!!settings.sidebarVisible);
        }

        // 執筆目標の初期反映
        const goal = settings.goal || {};
        const goalTargetInput = elementManager.get('goalTargetInput');
        const goalDeadlineInput = elementManager.get('goalDeadlineInput');
        if (goalTargetInput) goalTargetInput.value = (typeof goal.target === 'number' ? goal.target : parseInt(goal.target,10) || 0);
        if (goalDeadlineInput) goalDeadlineInput.value = goal.deadline || '';

        // Typewriter 設定の初期反映
        const tw = settings.typewriter || {};
        const typewriterEnabled = elementManager.get('typewriterEnabled');
        const typewriterAnchor = elementManager.get('typewriterAnchor');
        const typewriterStickiness = elementManager.get('typewriterStickiness');
        if (typewriterEnabled) typewriterEnabled.checked = !!tw.enabled;
        if (typewriterAnchor) typewriterAnchor.value = String((typeof tw.anchorRatio === 'number' ? tw.anchorRatio : 0.5));
        if (typewriterStickiness) typewriterStickiness.value = String((typeof tw.stickiness === 'number' ? tw.stickiness : 0.9));

        // Snapshot 設定の初期反映
        const snap = settings.snapshot || {};
        const snapshotInterval = elementManager.get('snapshotInterval');
        const snapshotDelta = elementManager.get('snapshotDelta');
        const snapshotRetention = elementManager.get('snapshotRetention');
        if (snapshotInterval) snapshotInterval.value = String((typeof snap.intervalMs === 'number' ? snap.intervalMs : 120000));
        if (snapshotDelta) snapshotDelta.value = String((typeof snap.deltaChars === 'number' ? snap.deltaChars : 300));
        if (snapshotRetention) snapshotRetention.value = String((typeof snap.retention === 'number' ? snap.retention : 10));

        // Preview 設定の初期反映
        const prev = settings.preview || {};
        const previewSyncScroll = elementManager.get('previewSyncScroll');
        if (previewSyncScroll) previewSyncScroll.checked = !!prev.syncScroll;

        // AutoSave 設定の初期反映
        const autoSave = settings.autoSave || {};
        const autoSaveEnabled = elementManager.get('autoSaveEnabled');
        const autoSaveDelay = elementManager.get('autoSaveDelay');
        if (autoSaveEnabled) autoSaveEnabled.checked = !!autoSave.enabled;
        if (autoSaveDelay) autoSaveDelay.value = String(autoSave.delayMs || 2000);
    }

    function activateSidebarGroup(groupId){
        if (!groupId || !window.elementManager) {
            logger.warn('activateSidebarGroup: groupId または elementManager が存在しません');
            return;
        }

        // タブ設定から有効なgroupIdかチェック
        const tabConfig = sidebarTabConfig.find(tab => tab.id === groupId);
        if (!tabConfig) {
            logger.warn(`Unknown sidebar group: ${groupId}`);
            return;
        }

        // 現在のactive groupを取得
        const currentActiveTab = document.querySelector('.sidebar-tab.active');
        const currentGroupId = currentActiveTab ? currentActiveTab.dataset.group : null;
        if (currentGroupId === groupId) {
            logger.info(`Tab "${groupId}" is already active`);
            return; // すでにactiveならスキップ
        }

        logger.info(`Switching tab from "${currentGroupId}" to "${groupId}"`);

        const sidebarTabs = window.elementManager.getMultiple('sidebarTabs');
        const sidebarGroups = window.elementManager.getMultiple('sidebarGroups');
        
        logger.info('Tab switch elements:', {
            tabsCount: sidebarTabs.length,
            groupsCount: sidebarGroups.length
        });

        // タブのアクティブ状態を更新
        sidebarTabs.forEach(tab => {
            const isActive = tab.dataset.group === groupId;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // グループパネルの表示状態を更新
        sidebarGroups.forEach(section => {
            const isActive = section.dataset.group === groupId;
            section.classList.toggle('active', isActive);
            section.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        // ZWGadgetsに通知（ガジェットの再レンダリングをトリガー）
        if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
            logger.info(`ZWGadgets.setActiveGroup("${groupId}") を呼び出し`);
            try {
                window.ZWGadgets.setActiveGroup(groupId);
                // ガジェットのレンダリングを強制実行
                if (typeof window.ZWGadgets._renderLast === 'function') {
                    window.ZWGadgets._renderLast();
                    logger.info('ガジェットのレンダリングを強制実行');
                }
            } catch (e) {
                logger.error('ZWGadgets.setActiveGroup でエラー:', e);
            }
        } else {
            logger.warn('ZWGadgets が利用できません');
        }

        // プレゼンテーション方式に合わせてUI反映
        applyTabsPresentationUI();
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
        const inFormControl = ['input','select','textarea','button'].includes(targetTag);
        
        // Alt+W: ツールバー切り替え
        if (!inFormControl && e.altKey && (e.key === 'w' || e.key === 'W')) {
            if (e.repeat) return;
            e.preventDefault();
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

    // UI設定を適用（サイドバー幅やタブ表示方式）
    (function applyUISettings(){
        try {
            const s = window.ZenWriterStorage.loadSettings();
            const sidebar = elementManager.get('sidebar');
            if (sidebar && s && s.ui) {
                if (typeof s.ui.sidebarWidth === 'number') {
                    sidebar.style.width = Math.max(220, Math.min(560, s.ui.sidebarWidth)) + 'px';
                }
                if (s.ui.tabsPresentation) {
                    sidebar.setAttribute('data-tabs-presentation', String(s.ui.tabsPresentation));
                }
            }
        } catch(_) {}
    })();

    // ガジェットの初期化（structureパネルのみ）
    (function initGadgetsWithRetry(){
        let tries = 0;
        const maxTries = 60; // ~3秒
        function tick(){
            tries++;
            if (window.ZWGadgets && typeof window.ZWGadgets.init === 'function'){
                logger.info('ZWGadgets が利用可能になりました。初期化を開始します');
                try {
                    // structureパネルのみ初期化
                    const panelId = 'structure-gadgets-panel';
                    const panel = document.getElementById(panelId);
                    if (panel) {
                        window.ZWGadgets.init(`#${panelId}`, { group: 'structure' });
                        logger.info(`ガジェット初期化完了: #${panelId}`);
                        
                        // アクティブグループを設定
                        if (typeof window.ZWGadgets.setActiveGroup === 'function') {
                            window.ZWGadgets.setActiveGroup('structure');
                            // 初期レンダリングを強制実行
                            if (typeof window.ZWGadgets._renderLast === 'function') {
                                setTimeout(() => {
                                    window.ZWGadgets._renderLast();
                                    logger.info('ガジェット初期レンダリング完了');
                                }, 100);
                            }
                        }
                    } else {
                        logger.error(`パネルが見つかりません: #${panelId}`);
                    }
                } catch(e) {
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
    })();

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
    function toggleFeedbackPanel(){
        if (!feedbackPanel){
            feedbackPanel = document.createElement('div');
            feedbackPanel.className = 'floating-panel';
            feedbackPanel.id = 'feedback-panel';
            feedbackPanel.style.display = 'none';
            feedbackPanel.innerHTML = `
                <div class="panel-header">
                    <span>フィードバック</span>
                    <button class="panel-close" id="close-feedback-panel">×</button>
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
        }
    }
    const toolsFab = elementManager.get('toolsFab');
    const closeFontPanelBtn = elementManager.get('closeFontPanelBtn');
    if (toolsFab) toolsFab.addEventListener('click', () => toggleFontPanel());
    if (closeFontPanelBtn) closeFontPanelBtn.addEventListener('click', () => toggleFontPanel(false));

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
    function saveGoalPatch(patch){
        const s = window.ZenWriterStorage.loadSettings();
        s.goal = { ...(s.goal || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
        // 文字数表示を更新
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.updateWordCount === 'function') {
            window.ZenWriterEditor.updateWordCount();
        }
    }

    // ------- Editor 設定（typewriter / snapshot / preview） -------
    function saveTypewriterPatch(patch){
        const s = window.ZenWriterStorage.loadSettings();
        s.typewriter = { ...(s.typewriter || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
    }
    function saveSnapshotPatch(patch){
        const s = window.ZenWriterStorage.loadSettings();
        s.snapshot = { ...(s.snapshot || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
    }
    function savePreviewPatch(patch){
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
    if (typewriterEnabled){
        typewriterEnabled.addEventListener('change', (e)=> saveTypewriterPatch({ enabled: !!e.target.checked }));
    }
    if (typewriterAnchor){
        const onChange = (e)=> saveTypewriterPatch({ anchorRatio: clamp(e.target.value, 0.05, 0.95, 0.5) });
        typewriterAnchor.addEventListener('input', onChange);
        typewriterAnchor.addEventListener('change', onChange);
    }
    if (typewriterStickiness){
        const onChange = (e)=> saveTypewriterPatch({ stickiness: clamp(e.target.value, 0, 1, 0.9) });
        typewriterStickiness.addEventListener('input', onChange);
        typewriterStickiness.addEventListener('change', onChange);
    }

    // Snapshot handlers
    const snapshotInterval = elementManager.get('snapshotInterval');
    const snapshotDelta = elementManager.get('snapshotDelta');
    const snapshotRetention = elementManager.get('snapshotRetention');
    if (snapshotInterval){
        const onChange = (e)=> saveSnapshotPatch({ intervalMs: Math.round(clamp(e.target.value, 30000, 300000, 120000)) });
        snapshotInterval.addEventListener('input', onChange);
        snapshotInterval.addEventListener('change', onChange);
    }
    if (snapshotDelta){
        const onChange = (e)=> saveSnapshotPatch({ deltaChars: Math.round(clamp(e.target.value, 50, 1000, 300)) });
        snapshotDelta.addEventListener('input', onChange);
        snapshotDelta.addEventListener('change', onChange);
    }
    if (snapshotRetention){
        const onChange = (e)=> saveSnapshotPatch({ retention: Math.round(clamp(e.target.value, 1, 50, 10)) });
        snapshotRetention.addEventListener('input', onChange);
        snapshotRetention.addEventListener('change', onChange);
    }

    // Preview handlers
    const previewSyncScroll = elementManager.get('previewSyncScroll');
    if (previewSyncScroll){
        previewSyncScroll.addEventListener('change', (e)=> savePreviewPatch({ syncScroll: !!e.target.checked }));
    }
    const goalTargetInput = elementManager.get('goalTargetInput');
    const goalDeadlineInput = elementManager.get('goalDeadlineInput');
    if (goalTargetInput){
        const clampTarget = (v)=> Math.max(0, parseInt(v,10) || 0);
        goalTargetInput.addEventListener('input', (e)=> saveGoalPatch({ target: clampTarget(e.target.value) }));
        goalTargetInput.addEventListener('change', (e)=> saveGoalPatch({ target: clampTarget(e.target.value) }));
    }
    if (goalDeadlineInput){
        goalDeadlineInput.addEventListener('change', (e)=> saveGoalPatch({ deadline: (e.target.value || '') || null }));
    }

    // AutoSave handlers
    function saveAutoSavePatch(patch){
        const s = window.ZenWriterStorage.loadSettings();
        s.autoSave = { ...(s.autoSave || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
    }
    if (autoSaveEnabled){
        autoSaveEnabled.addEventListener('change', (e)=> saveAutoSavePatch({ enabled: !!e.target.checked }));
    }
    if (autoSaveDelay){
        const onChange = (e)=> saveAutoSavePatch({ delayMs: Math.round(clamp(e.target.value, 500, 10000, 2000)) });
        autoSaveDelay.addEventListener('input', onChange);
        autoSaveDelay.addEventListener('change', onChange);
    }
    
    // Help button: Wikiタブを開く
    const helpButton = elementManager.get('helpButton');
    if (helpButton) {
        helpButton.addEventListener('click', function(){
            // サイドバー開く
            const sidebar = elementManager.get('sidebar');
            if (window.ZenWriterHUD && typeof window.ZenWriterHUD.hide === 'function') {
                window.ZenWriterHUD.hide();
            }
            if (sidebar) sidebar.classList.add('open');
            // Wikiタブに切替
            activateSidebarGroup('wiki');
        });
    }
    
    // リアルタイム自動保存機能
    let autoSaveTimeout = null;
    function triggerAutoSave(){
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
                } catch(e) {
                    console.error('自動保存エラー:', e);
                }
            }
        }, delay);
    }
    // オフライン検知と自動バックアップ
    let isOnline = navigator.onLine;
    function updateOnlineStatus(){
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
    window.addEventListener('beforeunload', function(e){
        const editor = elementManager.get('editor');
        try {
            if (editor && window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                window.ZenWriterStorage.saveContent(editor.value || '');
            }
        } catch(_) {}
        // メッセージは表示しない（ブラウザがデフォルト表示）
    });

    // 定期的なバックアップ（オンライン時のみ）
    setInterval(function(){
        if (!isOnline) return;
        const editor = elementManager.get('editor');
        try {
            if (editor && window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
                window.ZenWriterStorage.addSnapshot(editor.value || '', 10); // 最大10件
            }
        } catch(_) {}
    }, 5 * 60 * 1000); // 5分ごと
    applySettingsToUI();
    // バックアップ一覧
    // renderSnapshots();

    // 検索パネルのイベントリスナー
    const searchPanel = elementManager.get('searchPanel');
    const closeSearchPanelBtn = elementManager.get('closeSearchPanelBtn');
    const searchInput = elementManager.get('searchInput');
    const replaceInput = elementManager.get('replaceInput');
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
        }
    }

    // タブ管理API（リスト化・外部制御用）
    const tabManager = {
        // 利用可能なタブ一覧を取得
        getAvailableTabs() {
            return sidebarTabConfig.map(tab => ({
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
            return sidebarTabConfig.find(tab => tab.id === groupId) || null;
        },

        // タブをアクティブ化
        activateTab(tabId) {
            activateSidebarGroup(tabId);
        },

        // 次のタブに切り替え
        nextTab() {
            const current = this.getActiveTab();
            if (!current) return;
            const currentIndex = sidebarTabConfig.findIndex(tab => tab.id === current.id);
            const nextIndex = (currentIndex + 1) % sidebarTabConfig.length;
            this.activateTab(sidebarTabConfig[nextIndex].id);
        },

        // 前のタブに切り替え
        prevTab() {
            const current = this.getActiveTab();
            if (!current) return;
            const currentIndex = sidebarTabConfig.findIndex(tab => tab.id === current.id);
            const prevIndex = currentIndex === 0 ? sidebarTabConfig.length - 1 : currentIndex - 1;
            this.activateTab(sidebarTabConfig[prevIndex].id);
        }
    };

    // タブ管理APIをグローバルに公開
    window.ZenWriterTabs = tabManager;

    // 要素別フォントサイズを適用
    applyElementFontSizes();
});
