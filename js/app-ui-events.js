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
     * @param {Function} deps.syncHudQuickControls
     * @returns {Object} toggleFeedbackPanel, toggleFontPanel
     */
    function initAppUIEvents(deps) {
        const {
            elementManager,
            toggleSidebar,
            toggleToolbar,
            _toggleFullscreen,
            syncHudQuickControls
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
            if (rect.left < FLOATING_PANEL_MARGIN) {
                nextLeft = FLOATING_PANEL_MARGIN;
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
            enableFloatingPanelDrag(panel);
            bringPanelToFront(panel);

            if (!panel.dataset.zwPositioned) {
                const rect = panel.getBoundingClientRect();
                const left = Math.max(FLOATING_PANEL_MARGIN, window.innerWidth - rect.width - 16);
                const top = Math.max(72, Math.min(window.innerHeight - rect.height - 120, window.innerHeight - rect.height - FLOATING_PANEL_MARGIN));
                panel.style.left = `${Math.round(left)}px`;
                panel.style.top = `${Math.round(top)}px`;
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
                panel.dataset.zwPositioned = 'true';
            }

            clampPanelToViewport(panel);
        }

        function enableFloatingPanelDrag(panel) {
            if (!panel || panel.dataset.zwDragReady === 'true') return;
            const handle = panel.querySelector('.panel-header');
            if (!handle) return;

            panel.dataset.zwDragReady = 'true';
            let startX = 0;
            let startY = 0;
            let startLeft = 0;
            let startTop = 0;
            let dragging = false;

            const onMouseMove = (ev) => {
                if (!dragging) return;
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                panel.style.left = `${Math.round(startLeft + dx)}px`;
                panel.style.top = `${Math.round(startTop + dy)}px`;
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
            };

            const onMouseUp = () => {
                if (!dragging) return;
                dragging = false;
                document.body.classList.remove('dragging-floating-panel');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                clampPanelToViewport(panel);
            };

            handle.addEventListener('mousedown', (ev) => {
                if (ev.button !== 0) return;
                if (ev.target.closest('button, input, select, textarea, a, label')) return;
                ev.preventDefault();
                prepareFloatingPanel(panel);

                const rect = panel.getBoundingClientRect();
                startX = ev.clientX;
                startY = ev.clientY;
                startLeft = rect.left;
                startTop = rect.top;
                dragging = true;
                document.body.classList.add('dragging-floating-panel');
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            panel.addEventListener('mousedown', () => bringPanelToFront(panel));
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

            if (window.ZenWriterEditor.spellChecker.enabled) {
                toggleSpellCheckBtn.classList.add('active');
            }
        }

        // 分割ビューのイベントハンドラ
        if (toggleSplitViewBtn) {
            toggleSplitViewBtn.addEventListener('click', () => {
                if (splitViewModePanel) {
                    const isVisible = splitViewModePanel.style.display !== 'none';
                    splitViewModePanel.style.display = isVisible ? 'none' : 'block';
                    if (!isVisible) {
                        prepareFloatingPanel(splitViewModePanel);
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
                if (splitViewModePanel) splitViewModePanel.style.display = 'none';
            });
        }

        if (splitViewChapterCompareBtn && window.ZenWriterSplitView) {
            splitViewChapterCompareBtn.addEventListener('click', () => {
                window.ZenWriterSplitView.toggle('chapter-compare');
                if (splitViewModePanel) splitViewModePanel.style.display = 'none';
            });
        }

        if (splitViewSnapshotDiffBtn && window.ZenWriterSplitView) {
            splitViewSnapshotDiffBtn.addEventListener('click', () => {
                window.ZenWriterSplitView.toggle('snapshot-diff');
                if (splitViewModePanel) splitViewModePanel.style.display = 'none';
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

        // ===== フローティングツール（フォントパネル） =====
        function toggleFontPanel(forceShow) {
            if (forceShow === undefined) forceShow = null;
            const fontPanel = elementManager.get('fontPanel');
            if (!fontPanel) return;
            const willShow = forceShow !== null ? !!forceShow : fontPanel.style.display === 'none';
            fontPanel.style.display = willShow ? 'block' : 'none';
            const toolsFab = elementManager.get('toolsFab');
            if (toolsFab) {
                toolsFab.setAttribute('aria-expanded', String(willShow));
            }
            if (willShow) {
                prepareFloatingPanel(fontPanel);
                const s = window.ZenWriterStorage.loadSettings();
                const globalFontRange = elementManager.get('globalFontRange');
                const globalFontNumber = elementManager.get('globalFontNumber');
                if (globalFontRange) globalFontRange.value = s.fontSize;
                if (globalFontNumber) globalFontNumber.value = s.fontSize;
                syncHudQuickControls();
                const firstInput = fontPanel.querySelector('input, button, select');
                if (firstInput) {
                    setTimeout(() => firstInput.focus(), 100);
                }
            }
        }
        ['floating-font-panel', 'font-decoration-panel', 'text-animation-panel', 'search-panel', 'split-view-mode-panel'].forEach((id) => {
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
        const toolsFab = elementManager.get('toolsFab');
        const closeFontPanelBtn = elementManager.get('closeFontPanelBtn');
        if (toolsFab) {
            toolsFab.addEventListener('click', () => toggleFontPanel());
            toolsFab.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFontPanel(); }
            });
        }
        if (closeFontPanelBtn) {
            closeFontPanelBtn.addEventListener('click', () => toggleFontPanel(false));
            closeFontPanelBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFontPanel(false); }
            });
        }

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
                const val = e.target.value;
                if (globalFontNumber) globalFontNumber.value = val;
                updateGlobalFontFrom(val);
            });
        }
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

        return { toggleFeedbackPanel, toggleFontPanel, toggleModal };
    }

    window.initAppUIEvents = initAppUIEvents;
})();
