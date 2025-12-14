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
            toggleThemeBtn: 'toggle-theme',

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
            hudToggleVisibility: 'hud-toggle-visibility',
            hudPinToggle: 'hud-pin-toggle',
            hudRefresh: 'hud-refresh',

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
            wordWrapEnabled: 'word-wrap-enabled',
            wordWrapMaxChars: 'word-wrap-max-chars',
            currentDocument: 'current-document',
            newDocumentBtn: 'new-document-btn',
            restoreFromSnapshotBtn: 'restore-from-snapshot',

            // HUD設定UI
            goalTargetInput: 'goal-target',
            goalDeadlineInput: 'goal-deadline',
            pluginsPanel: 'plugins-panel',
            helpButton: 'help-button',
            editorHelpButton: 'editor-help-button',

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

// グローバルに公開
window.ElementManager = ElementManager;
