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
     * @param {Function} deps._toggleFullscreen
     * @returns {Object} toggleFeedbackPanel, toggleModal, prepareFloatingPanel, clampPanelToViewport
     */
    function initAppUIEvents(deps) {
        const {
            elementManager,
            toggleSidebar,
            toggleToolbar,
            _toggleFullscreen,
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
            // サイドバーが開いている場合、左端をサイドバー右端に制限
            var sidebarEl = document.querySelector('.sidebar.open');
            var leftBound = FLOATING_PANEL_MARGIN;
            if (sidebarEl) {
                var sidebarRight = sidebarEl.getBoundingClientRect().right;
                if (sidebarRight > leftBound) leftBound = sidebarRight + FLOATING_PANEL_MARGIN;
            }
            if (rect.left < leftBound) {
                nextLeft = leftBound;
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
        const toolbarCloseSidebar = elementManager.get('toolbarCloseSidebar');
        const toggleToolbarBtn = elementManager.get('toggleToolbarBtn');
        const showToolbarBtn = elementManager.get('showToolbarBtn');
        const fullscreenBtn = elementManager.get('fullscreenBtn');
        const toggleSplitViewBtn = document.getElementById('toggle-split-view');
        // split-view-mode-panel は MainHubPanel に統合済み (旧参照削除)
        const splitViewEditPreviewBtn = document.getElementById('split-view-edit-preview');
        const splitViewChapterCompareBtn = document.getElementById('split-view-chapter-compare');
        const splitViewSnapshotDiffBtn = document.getElementById('split-view-snapshot-diff');
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

        // feedbackBtn は HTML不在のため削除済み。toggleFeedbackPanel は他から呼ばれる可能性あり残存

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

        // 分割ビュー — MainHubPanel に統一
        if (toggleSplitViewBtn) {
            toggleSplitViewBtn.addEventListener('click', () => {
                if (window.MainHubPanel) {
                    window.MainHubPanel.toggle('split-view');
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

        // 分割ビューモード選択ボタン — MainHubPanel内に配置済み
        if (splitViewEditPreviewBtn && window.ZenWriterSplitView) {
            splitViewEditPreviewBtn.addEventListener('click', () => {
                window.ZenWriterSplitView.toggle('edit-preview');
                if (window.MainHubPanel) window.MainHubPanel.hide();
            });
        }

        if (splitViewChapterCompareBtn && window.ZenWriterSplitView) {
            splitViewChapterCompareBtn.addEventListener('click', () => {
                window.ZenWriterSplitView.toggle('chapter-compare');
                if (window.MainHubPanel) window.MainHubPanel.hide();
            });
        }

        if (splitViewSnapshotDiffBtn && window.ZenWriterSplitView) {
            splitViewSnapshotDiffBtn.addEventListener('click', () => {
                window.ZenWriterSplitView.toggle('snapshot-diff');
                if (window.MainHubPanel) window.MainHubPanel.hide();
            });
        }

        // ===== フィードバックパネル =====
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
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closePanel(); }
                });
                cancelBtn.addEventListener('click', closePanel);
                cancelBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closePanel(); }
                });
                submitBtn.addEventListener('click', () => {
                    const text = textarea.value.trim();
                    if (text) {
                        const url = `https://github.com/YuShimoji/WritingPage/issues/new?title=Feedback&body=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                        closePanel();
                        textarea.value = '';
                    }
                });
                submitBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); submitBtn.click(); }
                });

                feedbackPanel.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') { closePanel(); }
                });
                enableFloatingPanelDrag(feedbackPanel);
            }
            const isVisible = feedbackPanel.style.display !== 'none';
            feedbackPanel.style.display = isVisible ? 'none' : 'block';
            feedbackPanel.setAttribute('aria-hidden', String(isVisible));
            if (!isVisible) {
                prepareFloatingPanel(feedbackPanel);
                const textarea = document.getElementById('feedback-text');
                if (textarea) {
                    setTimeout(() => textarea.focus(), 100);
                }
            }
        }

        // positionFloatingPanel / toggleFontPanel は削除済み (MainHubPanel に統合)
        // フローティングパネルのドラッグ有効化（旧パネルIDは削除済み）
        ['main-hub-panel'].forEach((id) => {
            const panel = document.getElementById(id);
            if (panel) {
                enableFloatingPanelDrag(panel);
            }
        });
        window.addEventListener('resize', () => {
            document.querySelectorAll('.floating-panel').forEach((panel) => {
                const style = window.getComputedStyle(panel);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    clampPanelToViewport(panel);
                }
            });
        });
        // toolsFab / closeFontPanelBtn は削除済み (HTML不在)

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

        // 設定モーダル
        const toggleSettingsBtn = document.getElementById('toggle-settings');
        const closeSettingsBtn = document.getElementById('close-settings-modal');
        if (toggleSettingsBtn) {
            toggleSettingsBtn.addEventListener('click', () => toggleModal('settings-modal', true));
        }
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => toggleModal('settings-modal', false));
        }

        // ヘルプモーダル
        const toggleHelpBtn = document.getElementById('toggle-help-modal');
        const closeHelpBtn = document.getElementById('close-help-modal');
        if (toggleHelpBtn) {
            toggleHelpBtn.addEventListener('click', () => {
                toggleModal('help-modal', true);
                // ヘルプコンテンツの初期化（まだ未レンダリングの場合）
                if (window.ZenWriterHelpModal && typeof window.ZenWriterHelpModal.render === 'function') {
                    window.ZenWriterHelpModal.render();
                }
            });
        }
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', () => toggleModal('help-modal', false));
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

        // サイドバー内エディタ制御ボタン
        const sidebarPreviewBtn = document.getElementById('sidebar-toggle-preview');
        const sidebarSplitBtn = document.getElementById('sidebar-toggle-split');
        const sidebarWysiwygBtn = document.getElementById('sidebar-toggle-wysiwyg');
        const sidebarHelpBtn = document.getElementById('sidebar-toggle-help');

        // サイドバーボタン: 直接API呼び出し (ツールバー.click()中継を廃止)
        if (sidebarPreviewBtn) {
            sidebarPreviewBtn.addEventListener('click', () => {
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.togglePreview === 'function') {
                    window.ZenWriterEditor.togglePreview();
                }
            });
        }

        if (sidebarSplitBtn) {
            sidebarSplitBtn.addEventListener('click', () => {
                if (window.MainHubPanel) {
                    window.MainHubPanel.toggle('split-view');
                }
            });
        }

        if (sidebarWysiwygBtn) {
            sidebarWysiwygBtn.addEventListener('click', () => {
                const rte = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor;
                if (rte) {
                    if (rte.isWysiwygMode) {
                        rte.switchToTextarea();
                    } else {
                        rte.switchToWysiwyg();
                    }
                }
            });
        }

        if (sidebarHelpBtn) {
            sidebarHelpBtn.addEventListener('click', () => {
                toggleModal('help-modal', true);
                if (window.ZenWriterHelpModal && typeof window.ZenWriterHelpModal.render === 'function') {
                    window.ZenWriterHelpModal.render();
                }
            });
        }

        return {
            toggleFeedbackPanel,
            toggleModal,
            prepareFloatingPanel,
            clampPanelToViewport
        };
    }

    window.initAppUIEvents = initAppUIEvents;
})();
