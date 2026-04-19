// app-ui-events.js — UIイベントリスナー（ボタン/スワイプ/分割ビュー/スペルチェック/検索パネル/フィードバック/フォントパネル）
// app.js から分離。DOMContentLoaded 後に initAppUIEvents(deps) を呼び出す。
(function () {
    'use strict';

    /**
     * UIイベントリスナーを初期化
     * @param {Object} deps
     * @param {Object}   deps.elementManager
     * @param {Function} deps.toggleSidebar
     * @param {Function} deps.toggleToolbar
     * @returns {Object} toggleModal, prepareFloatingPanel, clampPanelToViewport
     */
    function initAppUIEvents(deps) {
        const {
            elementManager,
            toggleSidebar,
            toggleToolbar,
            _syncHudQuickControls
        } = deps;
        const FLOATING_PANEL_MARGIN = 12;
        let floatingPanelZIndex = 1650;

        function bringPanelToFront(panel) {
            if (!panel) return;
            floatingPanelZIndex += 1;
            panel.style.zIndex = String(floatingPanelZIndex);
        }

        function clampPanelToViewport(panel) {
            if (!panel) return;
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
            if (!viewportWidth || !viewportHeight) return;

            const maxWidth = Math.max(220, viewportWidth - FLOATING_PANEL_MARGIN * 2);
            if (panel.offsetWidth > maxWidth) {
                panel.style.width = `${Math.round(maxWidth)}px`;
            }

            const rect = panel.getBoundingClientRect();
            let nextLeft = rect.left;
            let nextTop = rect.top;

            if (rect.right > viewportWidth - FLOATING_PANEL_MARGIN) {
                nextLeft = viewportWidth - rect.width - FLOATING_PANEL_MARGIN;
            }
            // サイドバーが開いている場合の水平方向クランプ
            var sidebarEl = document.querySelector('.sidebar.open');
            var dock = document.documentElement.getAttribute('data-dock-sidebar') || 'left';
            var leftBound = FLOATING_PANEL_MARGIN;
            if (sidebarEl) {
                var sRect = sidebarEl.getBoundingClientRect();
                if (dock === 'right') {
                    // 右ドック時: パネル右端がサイドバー左端より左に入るよう制限（左ドック用の leftBound 誤適用を避ける）
                    var maxRight = sRect.left - FLOATING_PANEL_MARGIN;
                    if (rect.right > maxRight) {
                        nextLeft = maxRight - rect.width;
                    }
                    if (nextLeft < leftBound) nextLeft = leftBound;
                } else {
                    var sidebarRight = sRect.right;
                    if (sidebarRight > leftBound) leftBound = sidebarRight + FLOATING_PANEL_MARGIN;
                    if (rect.left < leftBound) {
                        nextLeft = leftBound;
                    }
                }
            }
            if (rect.bottom > viewportHeight - FLOATING_PANEL_MARGIN) {
                nextTop = viewportHeight - rect.height - FLOATING_PANEL_MARGIN;
            }
            if (rect.top < FLOATING_PANEL_MARGIN) {
                nextTop = FLOATING_PANEL_MARGIN;
            }

            panel.style.left = `${Math.round(nextLeft)}px`;
            panel.style.top = `${Math.round(nextTop)}px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        }

        function prepareFloatingPanel(panel) {
            if (!panel) return;
            // position: fixed を明示的に保証
            panel.style.position = 'fixed';
            enableFloatingPanelDrag(panel);
            bringPanelToFront(panel);

            if (!panel.dataset.zwPositioned) {
                // 初回表示: CSSのデフォルト位置を尊重
                // left/top/right/bottomを上書きしない
                panel.dataset.zwPositioned = 'true';
            } else if (panel.dataset.zwDragged) {
                // ドラッグ後の再表示時のみビューポート内に制限
                clampPanelToViewport(panel);
            }
        }

        const DRAG_THRESHOLD = 3; // 3px閾値で誤操作防止

        function enableFloatingPanelDrag(panel) {
            if (!panel || panel.dataset.zwDragReady === 'true') return;
            const handle = panel.querySelector('.panel-header');
            if (!handle) return;

            panel.dataset.zwDragReady = 'true';
            let startX = 0;
            let startY = 0;
            let startLeft = 0;
            let startTop = 0;
            let pointerDown = false;
            let dragging = false;
            let activePointerId = -1;

            const onPointerMove = (ev) => {
                if (!pointerDown) return;
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                // 閾値未満ならドラッグ開始しない
                if (!dragging) {
                    if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
                    dragging = true;
                    document.body.classList.add('dragging-floating-panel');
                }

                panel.style.left = `${Math.round(startLeft + dx)}px`;
                panel.style.top = `${Math.round(startTop + dy)}px`;
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
            };

            function cleanupListeners() {
                handle.removeEventListener('pointermove', onPointerMove);
                handle.removeEventListener('pointerup', onPointerUp);
                handle.removeEventListener('lostpointercapture', onPointerUp);
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
            }

            const onPointerUp = (_ev) => {
                if (!pointerDown) return;
                pointerDown = false;
                try { handle.releasePointerCapture(activePointerId); } catch (_) { }
                if (dragging) {
                    dragging = false;
                    panel.dataset.zwDragged = 'true';
                    document.body.classList.remove('dragging-floating-panel');
                    clampPanelToViewport(panel);
                }
                cleanupListeners();
            };

            handle.addEventListener('pointerdown', (ev) => {
                // マウス左ボタン or タッチ
                if (ev.pointerType === 'mouse' && ev.button !== 0) return;
                if (ev.target.closest('button, input, select, textarea, a, label')) return;
                ev.preventDefault();
                prepareFloatingPanel(panel);

                const rect = panel.getBoundingClientRect();
                startX = ev.clientX;
                startY = ev.clientY;
                startLeft = rect.left;
                startTop = rect.top;
                pointerDown = true;
                dragging = false;
                activePointerId = ev.pointerId;

                // タッチ: setPointerCapture で handle に集約
                // マウス: document 側でもリスン (Playwright 互換 + ブラウザフォールバック)
                try { handle.setPointerCapture(ev.pointerId); } catch (_) { }
                handle.addEventListener('pointermove', onPointerMove);
                handle.addEventListener('pointerup', onPointerUp);
                handle.addEventListener('lostpointercapture', onPointerUp);
                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', onPointerUp);
            });

            panel.addEventListener('pointerdown', () => bringPanelToFront(panel));
        }

        window.ZenWriterFloatingPanels = {
            preparePanel: prepareFloatingPanel,
            clampPanel: clampPanelToViewport,
            enableDrag: enableFloatingPanelDrag
        };

        // ===== ボタンイベントリスナー =====
        const toggleSidebarBtn = elementManager.get('toggleSidebarBtn');
        const showToolbarBtn = elementManager.get('showToolbarBtn');
        // session 107: fullscreenBtn 撤去
        const compareChapterBtn = document.getElementById('open-compare-chapter');
        const compareSnapshotBtn = document.getElementById('open-compare-snapshot');
        const toggleUIEditorBtn = document.getElementById('toggle-ui-editor');
        const toggleSpellCheckBtn = document.getElementById('toggle-spell-check');

        // サイドバーの開閉ボタン（ツールバー側のみ）
        if (toggleSidebarBtn) {
            toggleSidebarBtn.addEventListener('click', toggleSidebar);
            toggleSidebarBtn.addEventListener('touchend', (e) => {
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
            const SWIPE_THRESHOLD = 50;
            const SWIPE_TIME_THRESHOLD = 300;
            const SWIPE_VERTICAL_THRESHOLD = 30;

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

                if (deltaY > SWIPE_VERTICAL_THRESHOLD && Math.abs(deltaX) < deltaY) {
                    return;
                }

                if (deltaX < -SWIPE_THRESHOLD && deltaY < SWIPE_VERTICAL_THRESHOLD) {
                    const elapsed = Date.now() - touchStartTime;
                    if (elapsed < SWIPE_TIME_THRESHOLD && window.sidebarManager) {
                        window.sidebarManager.forceSidebarState(false);
                    }
                }
            }, { passive: true });
        })();

        // その他のボタン
        if (showToolbarBtn) {
            showToolbarBtn.addEventListener('click', toggleToolbar);
            showToolbarBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleToolbar();
                }
            });
        }
        // session 107: #fullscreen 撤去。Electron の F11 / メニュー「View > Toggle Full Screen」で代替

        // テーマ切り替えボタン
        const toggleThemeBtn = elementManager.get('toggleThemeBtn');
        if (toggleThemeBtn && window.ZenWriterTheme) {
            const updateThemeIcon = () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                const icon = toggleThemeBtn.querySelector('[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', currentTheme === 'dark' ? 'sun' : 'moon');
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }
            };

            toggleThemeBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                window.ZenWriterTheme.applyTheme(newTheme);
                updateThemeIcon();
            });

            toggleThemeBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                    window.ZenWriterTheme.applyTheme(newTheme);
                    updateThemeIcon();
                }
            });

            // 初期アイコンを設定
            updateThemeIcon();
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

            if (window.ZenWriterEditor.spellChecker.enabled) {
                toggleSpellCheckBtn.classList.add('active');
            }
        }

        // 比較ツール（構造カテゴリ）— 直接 SplitView をオープン
        if (compareChapterBtn && window.ZenWriterSplitView) {
            compareChapterBtn.addEventListener('click', () => {
                window.ZenWriterSplitView.open('chapter-compare');
            });
        }
        if (compareSnapshotBtn && window.ZenWriterSplitView) {
            compareSnapshotBtn.addEventListener('click', () => {
                window.ZenWriterSplitView.open('snapshot-diff');
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

        window.addEventListener('resize', () => {
            document.querySelectorAll('.floating-panel').forEach((panel) => {
                const style = window.getComputedStyle(panel);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    clampPanelToViewport(panel);
                }
            });
        });
        // フォントパネルのコントロール
        function updateGlobalFontFrom(value) {
            const size = parseFloat(value);
            if (!isNaN(size)) {
                window.ZenWriterEditor.setGlobalFontSize(size);
            }
        }

        function syncQuickFontSizeInputs() {
            try {
                const s = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
                    ? window.ZenWriterStorage.loadSettings()
                    : {};
                const editorSize = Math.round((s && (s.editorFontSize || s.fontSize)) || 16);
                const globalFontRange = elementManager.get('globalFontRange');
                const globalFontNumber = elementManager.get('globalFontNumber');
                if (globalFontRange) globalFontRange.value = String(editorSize);
                if (globalFontNumber) globalFontNumber.value = String(editorSize);
            } catch (_) { /* noop */ }
        }

        const globalFontRange = elementManager.get('globalFontRange');
        const globalFontNumber = elementManager.get('globalFontNumber');
        if (globalFontRange) {
            globalFontRange.addEventListener('input', (e) => {
                const val = e.target.value;
                if (globalFontNumber) globalFontNumber.value = val;
                updateGlobalFontFrom(val);
            });
        }
        window.addEventListener('ZenWriterSettingsChanged', syncQuickFontSizeInputs);
        syncQuickFontSizeInputs();
        if (globalFontNumber) {
            globalFontNumber.addEventListener('input', (e) => {
                const val = e.target.value;
                if (globalFontRange) globalFontRange.value = val;
                updateGlobalFontFrom(val);
            });
        }

        // ===== 検索パネルのイベントリスナー =====
        // (Moved to EditorUI.setupEventListeners to consolidate editor logic)

        // ===== モーダルダイアログ =====
        function toggleModal(modalId, show) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            if (show === undefined) {
                show = modal.style.display === 'none';
            }
            modal.style.display = show ? 'flex' : 'none';
            modal.setAttribute('aria-hidden', String(!show));
            if (show) {
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) setTimeout(() => closeBtn.focus(), 100);
            } else {
                const editor = document.getElementById('editor');
                if (editor) editor.focus();
            }
        }

        /**
         * アプリ設定の入口（歯車アイコン・コマンドパレット・Ctrl+, 等の唯一の実装）
         * session 105: Focus→Normal 遷移後に残留する sidebar のインライン style.width (dock-manager
         * リサイズや app.js:388 の設定復元が書き込み)が .sidebar.open 付与時に viewport 幅化を招いていた。
         * setUIMode('normal') 後・activateSidebarGroup 前にインライン width をクリアし、CSS 変数
         * --sidebar-width のフォールバックを効かせる。永続化値 s.ui.sidebarWidth は loadSettings 経路で保持。
         */
        function openSettingsModal() {
            const currentMode = document.documentElement.getAttribute('data-ui-mode');
            if (currentMode === 'focus' && window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
                window.ZenWriterApp.setUIMode('normal');
            }
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.style.removeProperty('width');
            }
            if (window.sidebarManager && typeof window.sidebarManager.activateSidebarGroup === 'function') {
                window.sidebarManager.activateSidebarGroup('advanced');
                if (sidebar && !sidebar.classList.contains('open') && typeof window.sidebarManager.toggleSidebar === 'function') {
                    window.sidebarManager.toggleSidebar();
                }
            }
        }

        /** session 103 以降は no-op (旧 settings-modal は開かれない)。互換のため残す。 */
        function closeSettingsModal() {
            toggleModal('settings-modal', false);
        }

        /** ヘルプモーダルを開く（? ボタン等の唯一の実装） */
        function openHelpModal() {
            toggleModal('help-modal', true);
            if (window.ZenWriterHelpModal && typeof window.ZenWriterHelpModal.render === 'function') {
                window.ZenWriterHelpModal.render();
            }
        }

        function closeHelpModal() {
            toggleModal('help-modal', false);
        }

        // 設定モーダル: トップバー入口は撤去 (session 102)。コマンドパレット / Ctrl+, / #focus-open-settings 経由で到達
        const closeSettingsBtn = document.getElementById('close-settings-modal');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => closeSettingsModal());
        }

        // ヘルプモーダル: トップバー入口は撤去 (session 102)。コマンドパレット / F1 経由で到達
        const closeHelpBtn = document.getElementById('close-help-modal');
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', () => closeHelpModal());
        }

        // モーダルオーバーレイクリックで閉じる
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    toggleModal(overlay.id, false);
                }
            });
        });

        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;

            const openModal = Array.from(document.querySelectorAll('.modal-overlay')).find((modal) => {
                const style = window.getComputedStyle(modal);
                return style.display === 'flex';
            });
            if (openModal) {
                toggleModal(openModal.id, false);
                e.stopPropagation();
                return;
            }

            const openFloatingPanel = Array.from(document.querySelectorAll('.floating-panel[aria-modal="true"]')).find((panel) => {
                const style = window.getComputedStyle(panel);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });
            if (openFloatingPanel) {
                openFloatingPanel.style.display = 'none';
                openFloatingPanel.setAttribute('aria-hidden', 'true');
                e.stopPropagation();
            }
        });

        // サイドバー内エディタ制御（details 内のボタン。操作後はメニューを閉じて視覚的ノイズを減らす）
        const closeSidebarEditorViewDetails = () => {
            const det = document.querySelector('details.sidebar-editor-view-details');
            if (det) det.open = false;
        };

        const sidebarPreviewBtn = document.getElementById('sidebar-toggle-preview');
        const sidebarWysiwygBtn = document.getElementById('sidebar-toggle-wysiwyg');

        // サイドバーボタン: 直接API呼び出し (ツールバー.click()中継を廃止)
        if (sidebarPreviewBtn) {
            sidebarPreviewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.togglePreview === 'function') {
                    window.ZenWriterEditor.togglePreview();
                }
                closeSidebarEditorViewDetails();
            });
        }

        if (sidebarWysiwygBtn) {
            sidebarWysiwygBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
                if (rte) {
                    if (rte.isWysiwygMode) {
                        rte.switchToTextarea();
                    } else {
                        rte.switchToWysiwyg();
                    }
                }
                closeSidebarEditorViewDetails();
            });
        }

        return {
            toggleModal,
            prepareFloatingPanel,
            clampPanelToViewport,
            openSettingsModal,
            closeSettingsModal,
            openHelpModal,
            closeHelpModal
        };
    }

    window.initAppUIEvents = initAppUIEvents;
})();
