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

    // 印刷処理
    function _printDocument() {
        const pv = elementManager.get('printView');
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
            // toggle-sidebarボタンのaria-expanded属性も更新
            const toggleBtn = elementManager.get('toggleSidebarBtn');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-expanded', String(open));
            }
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

    // イベントリスナーを設定
    const toggleSidebarBtn = elementManager.get('toggleSidebarBtn');
    const toolbarCloseSidebar = elementManager.get('toolbarCloseSidebar');
    const toggleToolbarBtn = elementManager.get('toggleToolbarBtn');
    const showToolbarBtn = elementManager.get('showToolbarBtn');
    const fullscreenBtn = elementManager.get('fullscreenBtn');
    const feedbackBtn = elementManager.get('feedbackBtn');
    const toggleSplitViewBtn = document.getElementById('toggle-split-view');
    const splitViewModePanel = document.getElementById('split-view-mode-panel');
    const closeSplitViewModePanelBtn = document.getElementById('close-split-view-mode-panel');
    const splitViewEditPreviewBtn = document.getElementById('split-view-edit-preview');
    const splitViewChapterCompareBtn = document.getElementById('split-view-chapter-compare');
    const splitViewSnapshotDiffBtn = document.getElementById('split-view-snapshot-diff');
    const toggleUIEditorBtn = document.getElementById('toggle-ui-editor');
    const toggleSpellCheckBtn = document.getElementById('toggle-spell-check');

    // サイドバーの開閉ボタン（ツールバー側のみ）
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
        // タッチイベントも対応
        toggleSidebarBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleSidebar();
        });
    }
    if (toolbarCloseSidebar) {
        toolbarCloseSidebar.addEventListener('click', toggleSidebar);
        toolbarCloseSidebar.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleSidebar();
        });
    }

    // サイドバーオーバーレイのクリック/タッチでサイドバーを閉じる（モバイル用）
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            if (window.sidebarManager) {
                window.sidebarManager.forceSidebarState(false);
            }
        });
        sidebarOverlay.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (window.sidebarManager) {
                window.sidebarManager.forceSidebarState(false);
            }
        });
    }

    // サイドバーのスワイプ操作（モバイル用）
    (function initSidebarSwipe() {
        const sidebar = elementManager.get('sidebar');
        if (!sidebar) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        const SWIPE_THRESHOLD = 50; // スワイプ判定の最小距離（px）
        const SWIPE_TIME_THRESHOLD = 300; // スワイプ判定の最大時間（ms）
        const SWIPE_VERTICAL_THRESHOLD = 30; // 縦方向の許容範囲（px）

        sidebar.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        sidebar.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = Math.abs(touch.clientY - touchStartY);
            
            // 縦方向のスクロールが主な場合はスワイプ判定をスキップ
            if (deltaY > SWIPE_VERTICAL_THRESHOLD && Math.abs(deltaX) < deltaY) {
                return;
            }
            
            // 左方向へのスワイプ（サイドバーを閉じる）
            if (deltaX < -SWIPE_THRESHOLD && deltaY < SWIPE_VERTICAL_THRESHOLD) {
                const elapsed = Date.now() - touchStartTime;
                if (elapsed < SWIPE_TIME_THRESHOLD && window.sidebarManager) {
                    window.sidebarManager.forceSidebarState(false);
                }
            }
        }, { passive: true });
    })();

    // その他のボタン
    if (toggleToolbarBtn) {
        toggleToolbarBtn.addEventListener('click', toggleToolbar);
        toggleToolbarBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleToolbar();
            }
        });
    }
    if (showToolbarBtn) {
        showToolbarBtn.addEventListener('click', toggleToolbar);
        showToolbarBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleToolbar();
            }
        });
    }
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', _toggleFullscreen);
        fullscreenBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                _toggleFullscreen();
            }
        });
    }
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', toggleFeedbackPanel);
        feedbackBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFeedbackPanel();
            }
        });
    }
    
    // スペルチェックのトグル
    if (toggleSpellCheckBtn && window.ZenWriterEditor && window.ZenWriterEditor.spellChecker) {
        toggleSpellCheckBtn.addEventListener('click', () => {
            const spellChecker = window.ZenWriterEditor.spellChecker;
            if (spellChecker.enabled) {
                spellChecker.disable();
                toggleSpellCheckBtn.classList.remove('active');
            } else {
                spellChecker.enable();
                toggleSpellCheckBtn.classList.add('active');
            }
        });
        
        // 初期状態を反映
        if (window.ZenWriterEditor.spellChecker.enabled) {
            toggleSpellCheckBtn.classList.add('active');
        }
    }

    // 分割ビューのイベントハンドラ
    if (toggleSplitViewBtn) {
        toggleSplitViewBtn.addEventListener('click', () => {
            if (splitViewModePanel) {
                const isVisible = splitViewModePanel.style.display !== 'none';
                if (isVisible) {
                    splitViewModePanel.style.display = 'none';
                } else {
                    splitViewModePanel.style.display = 'block';
                }
            }
        });
    }

    // UIエディタのイベントハンドラ
    if (toggleUIEditorBtn) {
      toggleUIEditorBtn.addEventListener('click', () => {
        if (window.uiVisualEditor) {
          if (window.uiVisualEditor.isActive) {
            window.uiVisualEditor.deactivate();
          } else {
            window.uiVisualEditor.activate();
          }
        }
      });
    }

    if (closeSplitViewModePanelBtn) {
        closeSplitViewModePanelBtn.addEventListener('click', () => {
            if (splitViewModePanel) {
                splitViewModePanel.style.display = 'none';
            }
        });
    }

    if (splitViewEditPreviewBtn && window.ZenWriterSplitView) {
        splitViewEditPreviewBtn.addEventListener('click', () => {
            window.ZenWriterSplitView.toggle('edit-preview');
            if (splitViewModePanel) {
                splitViewModePanel.style.display = 'none';
            }
        });
    }

    if (splitViewChapterCompareBtn && window.ZenWriterSplitView) {
        splitViewChapterCompareBtn.addEventListener('click', () => {
            window.ZenWriterSplitView.toggle('chapter-compare');
            if (splitViewModePanel) {
                splitViewModePanel.style.display = 'none';
            }
        });
    }

    if (splitViewSnapshotDiffBtn && window.ZenWriterSplitView) {
        splitViewSnapshotDiffBtn.addEventListener('click', () => {
            window.ZenWriterSplitView.toggle('snapshot-diff');
            if (splitViewModePanel) {
                splitViewModePanel.style.display = 'none';
            }
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

                    const roots = window.ZWGadgets._roots || {};
                    panels.forEach(info => {
                        try {
                            if (roots && roots[info.group]) return;
                            window.ZWGadgets.init(info.selector, { group: info.group });
                            logger.info(`ガジェット初期化完了: ${info.selector}`);
                        } catch (initErr) {
                            logger.error(`ガジェット初期化失敗: ${info.selector}`, initErr);
                        }
                    });

                    if (typeof window.ZWGadgets.setActiveGroup === 'function') {
                        const activeTab = document.querySelector('.sidebar-tab.active');
                        const group = activeTab ? activeTab.getAttribute('data-group') : 'structure';
                        window.ZWGadgets.setActiveGroup(group);
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
        if (window.ZWLoadoutUI && typeof window.ZWLoadoutUI.refresh === 'function') {
            try {
                if (window.ZWGadgets && typeof window.ZWGadgets.getActiveLoadout === 'function') {
                    window.ZWGadgets.getActiveLoadout();
                }
            } catch (_) { }
            try { window.ZWLoadoutUI.refresh(); } catch (_) { }
            return;
        }
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
                // applyLoadoutを使用（activateLoadoutは存在しない）
                if (window.ZWGadgets.applyLoadout) {
                    window.ZWGadgets.applyLoadout(name);
                }
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
                // applyLoadoutを使用（activateLoadoutは存在しない）
                if (name && window.ZWGadgets.applyLoadout && window.ZWGadgets.applyLoadout(name)) {
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

    // Selection Tooltip は app-editor-bridge.js に抽出済み
    function initSelectionTooltip() {
        if (typeof window.appEditorBridge_initSelectionTooltip === 'function') {
            window.appEditorBridge_initSelectionTooltip();
        }
    }

    // ツールレジストリからのUI生成 (初期実装: Header Icons)
    function initializeToolsRegistry() {
        if (!window.WritingTools || typeof window.WritingTools.listTools !== 'function') return;

        // 1. Header Icons
        const headerTools = window.WritingTools.listTools({ entrypoint: 'headerIcon' });
        const toolbarActions = document.querySelector('.toolbar-actions');

        if (toolbarActions) {
            headerTools.forEach(tool => {
                if (!tool.domId) return;

                let btn = document.getElementById(tool.domId);
                // 既存ボタンがない場合は作成
                if (!btn) {
                    btn = document.createElement('button');
                    btn.id = tool.domId;
                    btn.className = 'icon-button iconified';
                    btn.title = tool.label;
                    btn.setAttribute('aria-label', tool.label);
                    // 挿入位置: 最後に追加
                    toolbarActions.appendChild(btn);
                    if (typeof logger !== 'undefined') logger.info(`Tool button created: ${tool.domId}`);
                }

                // アイコン同期
                if (tool.icon) {
                    let icon = btn.querySelector('i');
                    if (!icon) {
                        icon = document.createElement('i');
                        icon.setAttribute('aria-hidden', 'true');
                        btn.appendChild(icon);
                    }
                    // 既存のアイコンが異なる場合のみ更新（ちらつき防止）
                    if (icon.getAttribute('data-lucide') !== tool.icon) {
                        icon.setAttribute('data-lucide', tool.icon);
                    }
                }
            });

            // Lucideアイコンの再レンダリング
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    }

    initializeToolsRegistry();
    initGadgetsWithRetry();
    initLoadoutUI();
    initSelectionTooltip();

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
            feedbackPanel.setAttribute('role', 'dialog');
            feedbackPanel.setAttribute('aria-labelledby', 'feedback-panel-title');
            feedbackPanel.setAttribute('aria-modal', 'true');
            feedbackPanel.style.display = 'none';
            feedbackPanel.innerHTML = `
                <div class="panel-header">
                    <span id="feedback-panel-title">フィードバック</span>
                    <button class="panel-close" id="close-feedback-panel" aria-label="フィードバックパネルを閉じる">閉じる</button>
                </div>
                <div class="panel-body">
                    <p>問題報告や機能要望をお送りください。</p>
                    <label for="feedback-text" class="sr-only">フィードバック内容</label>
                    <textarea id="feedback-text" placeholder="詳細を記述してください..." rows="6" style="width:100%; margin:8px 0;" aria-label="フィードバック内容を入力"></textarea>
                    <div style="display:flex; gap:8px;">
                        <button id="submit-feedback" class="small">送信</button>
                        <button id="cancel-feedback" class="small">キャンセル</button>
                    </div>
                </div>
            `;
            document.body.appendChild(feedbackPanel);
            const closeBtn = document.getElementById('close-feedback-panel');
            const cancelBtn = document.getElementById('cancel-feedback');
            const submitBtn = document.getElementById('submit-feedback');
            const textarea = document.getElementById('feedback-text');
            
            const closePanel = () => {
                feedbackPanel.style.display = 'none';
                feedbackPanel.setAttribute('aria-hidden', 'true');
            };
            
            closeBtn.addEventListener('click', closePanel);
            closeBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    closePanel();
                }
            });
            cancelBtn.addEventListener('click', closePanel);
            cancelBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    closePanel();
                }
            });
            submitBtn.addEventListener('click', () => {
                const text = textarea.value.trim();
                if (text) {
                    // GitHub Issue作成（仮）
                    const url = `https://github.com/YuShimoji/WritingPage/issues/new?title=Feedback&body=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                    closePanel();
                    textarea.value = '';
                }
            });
            submitBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    submitBtn.click();
                }
            });
            
            // ESCキーで閉じる
            feedbackPanel.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closePanel();
                }
            });
        }
        const isVisible = feedbackPanel.style.display !== 'none';
        feedbackPanel.style.display = isVisible ? 'none' : 'block';
        feedbackPanel.setAttribute('aria-hidden', String(isVisible));
        if (!isVisible) {
            // パネルを開いたら最初の入力欄にフォーカス
            const textarea = document.getElementById('feedback-text');
            if (textarea) {
                setTimeout(() => textarea.focus(), 100);
            }
        }
    }

    // フローティングツール（フォントパネル）
    function toggleFontPanel(forceShow = null) {
        const fontPanel = elementManager.get('fontPanel');
        if (!fontPanel) return;
        const willShow = forceShow !== null ? !!forceShow : fontPanel.style.display === 'none';
        fontPanel.style.display = willShow ? 'block' : 'none';
        // aria-expanded属性を更新
        const toolsFab = elementManager.get('toolsFab');
        if (toolsFab) {
            toolsFab.setAttribute('aria-expanded', String(willShow));
        }
        if (willShow) {
            // 現在設定をUIへ反映
            const s = window.ZenWriterStorage.loadSettings();
            const globalFontRange = elementManager.get('globalFontRange');
            const globalFontNumber = elementManager.get('globalFontNumber');
            if (globalFontRange) globalFontRange.value = s.fontSize;
            if (globalFontNumber) globalFontNumber.value = s.fontSize;
            syncHudQuickControls();
            // フォーカスをパネル内の最初の要素に移動
            const firstInput = fontPanel.querySelector('input, button, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }
    const toolsFab = elementManager.get('toolsFab');
    const closeFontPanelBtn = elementManager.get('closeFontPanelBtn');
    if (toolsFab) {
        toolsFab.addEventListener('click', () => toggleFontPanel());
        toolsFab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFontPanel();
            }
        });
    }
    if (closeFontPanelBtn) {
        closeFontPanelBtn.addEventListener('click', () => toggleFontPanel(false));
        closeFontPanelBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFontPanel(false);
            }
        });
    }
    // HUDボタンのイベントリスナーは app-hud.js で設定済み

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

    // HUD管理（app-hud.js に委譲）
    let appHud = null;
    if (typeof window.initAppHud === 'function') {
        appHud = window.initAppHud({ elementManager });
    }
    function syncHudQuickControls() {
        if (appHud) appHud.syncHudQuickControls();
    }

    // 設定UIハンドラ（app-settings-handlers.js に委譲）
    if (typeof window.initAppSettingsHandlers === 'function') {
        window.initAppSettingsHandlers({ elementManager });
    }

    // ------- 設定更新用共通ヘルパー（他モジュールからも参照） -------
    function updateSettingsPatch(key, patch, callback) {
        const s = window.ZenWriterStorage.loadSettings();
        s[key] = { ...(s[key] || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
        if (callback) callback();
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

    // ===== ファイル管理機能（app-file-manager.js に委譲） =====
    if (typeof window.initAppFileManager === 'function') {
        window.initAppFileManager({ elementManager, updateDocumentTitle });
    }

    // 背景ビジュアルのスクロール連動
    let scrollY = 0;
    function updateBackgroundScroll() {
        const newScrollY = window.scrollY || window.pageYOffset || 0;
        if (Math.abs(newScrollY - scrollY) > 1) { // 1px以上の変化で更新
            scrollY = newScrollY;
            document.documentElement.style.setProperty('--scroll-y', scrollY + 'px');
        }
        requestAnimationFrame(updateBackgroundScroll);
    }
    updateBackgroundScroll();
    window.addEventListener('beforeunload', (e) => {
        try {
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.isDirty === 'function' && window.ZenWriterEditor.isDirty()) {
                e.preventDefault();
                e.returnValue = '';
            }
        } catch (_) { }
    });
});
