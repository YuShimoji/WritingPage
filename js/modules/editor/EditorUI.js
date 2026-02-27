/**
 * EditorUI module
 * Handles UI interactions, panel management, and visualizations.
 */
(function () {
    'use strict';

    window.EditorUI = {
        /**
         * Word count update with debounce
         */
        updateWordCount(manager) {
            clearTimeout(manager._wordCountDebounceTimer);
            manager._wordCountDebounceTimer = setTimeout(() => {
                this._updateWordCountImmediate(manager);
            }, manager._WORD_COUNT_DEBOUNCE_DELAY || 300);
        },

        /**
         * Immediate word count update
         */
        _updateWordCountImmediate(manager) {
            if (!manager.wordCountElement) return;
            const text = manager.getEditorValue ? manager.getEditorValue() : (manager.editor ? manager.editor.value : '');
            const count = (text || '').length;
            manager.wordCountElement.textContent = `文字数: ${count}`;

            if (manager.goalProgressEl && manager.goalProgressBarEl) {
                const s = (window.ZenWriterStorage && window.ZenWriterStorage.loadSettings) ? window.ZenWriterStorage.loadSettings() : {};
                const goal = (s && s.editor && s.editor.wordGoal) || 0;

                if (goal > 0) {
                    manager.goalProgressEl.style.display = 'block';
                    const prog = Math.min(100, (count / goal) * 100);
                    manager.goalProgressBarEl.style.width = `${prog}%`;

                    if (prog >= 100 && !manager._goalReachedNotified) {
                        this.showNotification(manager, '目標文字数に到達しました！', 3000);
                        manager._goalReachedNotified = true;
                    } else if (prog < 100) {
                        manager._goalReachedNotified = false;
                    }
                } else {
                    manager.goalProgressEl.style.display = 'none';
                }
            }
        },

        /**
         * Show notification via HUD
         */
        showNotification(manager, message, duration = 2000) {
            if (window.ZenWriterHUD && typeof window.ZenWriterHUD.showNotification === 'function') {
                window.ZenWriterHUD.showNotification(message, duration);
            } else {
                console.log('ZenWriter Notification:', message);
            }
        },

        /**
         * Font size adjustment
         */
        adjustGlobalFontSize(manager, delta) {
            const s = (window.ZenWriterStorage && window.ZenWriterStorage.loadSettings) ? window.ZenWriterStorage.loadSettings() : {};
            let size = (s && s.fontSize) || 18;
            size = this.clampFontSize(size + delta);
            this.setGlobalFontSize(manager, size);
        },

        setGlobalFontSize(manager, sizePx) {
            const size = this.clampFontSize(sizePx);
            document.documentElement.style.setProperty('--editor-font-size', size + 'px');
            if (window.ZenWriterStorage && window.ZenWriterStorage.saveSettings) {
                window.ZenWriterStorage.saveSettings({ fontSize: size });
            }
        },

        clampFontSize(px) {
            return Math.min(72, Math.max(12, px));
        },

        /**
         * Width mode application
         */
        applyWidthMode(mode) {
            const root = document.documentElement;
            if (mode === 'narrow') {
                root.style.setProperty('--editor-max-width', '600px');
            } else if (mode === 'wide') {
                root.style.setProperty('--editor-max-width', '1200px');
            } else {
                root.style.setProperty('--editor-max-width', '800px');
            }
        },

        /**
         * Font decoration application
         */
        applyFontDecoration(manager, tag) {
            const rich = manager && (manager.richTextEditor || window.richTextEditor);
            if (rich && rich.isWysiwygMode && typeof rich.applyTag === 'function') {
                rich.applyTag(tag, 'decor');
                return;
            }
            if (typeof manager.insertTextAtCursor === 'function') {
                manager.insertTextAtCursor(`[${tag}]`, { suffix: `[/${tag}]` });
            }
        },

        applyTextAnimation(manager, tag) {
            const rich = manager && (manager.richTextEditor || window.richTextEditor);
            if (rich && rich.isWysiwygMode && typeof rich.applyTag === 'function') {
                rich.applyTag(tag, 'anim');
                return;
            }
            if (typeof manager.insertTextAtCursor === 'function') {
                manager.insertTextAtCursor(`[${tag}]`, { suffix: `[/${tag}]` });
            }
        },

        positionFloatingPanel(panel, trigger) {
            if (!panel) return;
            const margin = 12;
            const triggerRect = trigger ? trigger.getBoundingClientRect() : null;
            const panelRect = panel.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let left = triggerRect ? triggerRect.left : viewportWidth - panelRect.width - margin;
            let top = triggerRect ? (triggerRect.bottom + 8) : (viewportHeight - panelRect.height - margin);

            if (left + panelRect.width > viewportWidth - margin) {
                left = viewportWidth - panelRect.width - margin;
            }
            if (left < margin) left = margin;

            if (top + panelRect.height > viewportHeight - margin && triggerRect) {
                top = triggerRect.top - panelRect.height - 8;
            }
            if (top < margin) top = margin;

            panel.style.position = 'fixed';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            panel.style.left = `${Math.round(left)}px`;
            panel.style.top = `${Math.round(top)}px`;
            panel.style.maxHeight = `calc(100vh - ${margin * 2}px)`;
            panel.style.overflowY = 'auto';
        },

        /**
         * Panel management
         */
        toggleFontDecorationPanel(manager) {
            const isVisible = manager.fontDecorationPanel && manager.fontDecorationPanel.style.display !== 'none';
            if (isVisible) this.hideFontDecorationPanel(manager);
            else this.showFontDecorationPanel(manager);
        },

        showFontDecorationPanel(manager) {
            if (manager.fontDecorationPanel) {
                manager.fontDecorationPanel.style.display = 'block';
                if (manager.textAnimationPanel) manager.textAnimationPanel.style.display = 'none';
                this.positionFloatingPanel(manager.fontDecorationPanel, manager.toggleFontDecorationBtn);
            }
        },

        hideFontDecorationPanel(manager) {
            if (manager.fontDecorationPanel) manager.fontDecorationPanel.style.display = 'none';
        },

        toggleTextAnimationPanel(manager) {
            const isVisible = manager.textAnimationPanel && manager.textAnimationPanel.style.display !== 'none';
            if (isVisible) this.hideTextAnimationPanel(manager);
            else this.showTextAnimationPanel(manager);
        },

        showTextAnimationPanel(manager) {
            if (manager.textAnimationPanel) {
                manager.textAnimationPanel.style.display = 'block';
                if (manager.fontDecorationPanel) manager.fontDecorationPanel.style.display = 'none';
                this.positionFloatingPanel(manager.textAnimationPanel, manager.toggleTextAnimationBtn);
            }
        },

        hideTextAnimationPanel(manager) {
            if (manager.textAnimationPanel) manager.textAnimationPanel.style.display = 'none';
        },

        updateAnimationSpeed(speed) {
            document.documentElement.style.setProperty('--anim-speed-factor', speed);
        },

        updateAnimationDuration(duration) {
            document.documentElement.style.setProperty('--anim-duration-factor', duration);
        },

        updateAnimationReduceMotion(reduceMotion) {
            if (reduceMotion) document.body.classList.add('reduce-motion');
            else document.body.classList.remove('reduce-motion');
        },

        saveAnimationSettings(patch) {
            if (window.ZenWriterStorage && window.ZenWriterStorage.saveSettings) {
                window.ZenWriterStorage.saveSettings({ animation: patch });
            }
        },

        /**
         * Image preview card creation
         */
        createPreviewCard(manager, { assetId, asset, matchIndex }) {
            const card = document.createElement('article');
            card.className = 'preview-card';
            card.dataset.assetId = assetId;

            const imgContainer = document.createElement('div');
            imgContainer.className = 'preview-card__image';
            const img = document.createElement('img');
            img.src = asset.dataUrl;
            imgContainer.appendChild(img);
            card.appendChild(imgContainer);

            const info = document.createElement('div');
            info.className = 'preview-card__info';
            const title = document.createElement('h4');
            title.textContent = asset.name || `画像 ${matchIndex + 1}`;
            info.appendChild(title);

            const meta = document.createElement('p');
            meta.className = 'preview-card__meta';
            meta.textContent = `${asset.type || 'image'} | ${Math.round((asset.size || 0) / 1024)} KB`;
            info.appendChild(meta);
            card.appendChild(info);

            const actions = document.createElement('div');
            actions.className = 'preview-card__actions';

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'small';
            toggleBtn.textContent = asset.hidden ? '表示' : '非表示';
            toggleBtn.addEventListener('click', () => {
                if (typeof manager.persistAssetMeta === 'function') {
                    manager.persistAssetMeta(assetId, { hidden: !asset.hidden });
                }
            });
            actions.appendChild(toggleBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'small danger';
            deleteBtn.textContent = '削除';
            deleteBtn.addEventListener('click', () => {
                if (confirm('この画像をドキュメントから削除しますか？')) {
                    this.showNotification(manager, '削除機能はエディタ上で直接行ってください');
                }
            });
            actions.appendChild(deleteBtn);
            card.appendChild(actions);

            return card;
        },

        updateCharCountStamps(_manager) {
            // Not implemented yet
        },

        /**
         * Primary event listener setup (editor scoped)
         */
        setupEventListeners(manager) {
            if (!manager || !manager.editor) return;
            const handleEditorShortcuts = (e) => {
                if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                    const k = String(e.key || '').toLowerCase();
                    if (k === 'b' || k === 'i' || k === 'u') {
                        e.preventDefault();
                        if (typeof manager.applyFontDecoration === 'function') {
                            if (k === 'b') manager.applyFontDecoration('bold');
                            if (k === 'i') manager.applyFontDecoration('italic');
                            if (k === 'u') manager.applyFontDecoration('underline');
                        }
                    }
                }
            };

            // Simple input event
            manager.editor.addEventListener('input', () => {
                if (typeof manager.markDirty === 'function') manager.markDirty();
                if (typeof manager.saveContent === 'function') manager.saveContent();
                this.updateWordCount(manager);
                if (typeof manager.maybeAutoSnapshot === 'function') manager.maybeAutoSnapshot();
                if (typeof manager.renderImagePreview === 'function') manager.renderImagePreview();
                if (typeof manager.renderMarkdownPreview === 'function') manager.renderMarkdownPreview();
                if (typeof manager.renderOverlayImages === 'function') {
                    manager.renderOverlayImages(manager.inlineStamps || [], manager.editor.value);
                }
            });

            // Tab key support
            manager.editor.addEventListener('keydown', (e) => {
                if (e.defaultPrevented) return;
                if (e.key === 'Tab') {
                    e.preventDefault();
                    if (typeof manager.insertTextAtCursor === 'function') {
                        manager.insertTextAtCursor('\t');
                    }
                    return;
                }
                handleEditorShortcuts(e);
            });
            document.addEventListener('keydown', (e) => {
                if (e.defaultPrevented) return;
                if (document.activeElement === manager.editor) handleEditorShortcuts(e);
            }, true);

            // Decor buttons (delegated common logic)
            const decorButtons = document.querySelectorAll('.decor-btn');
            decorButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tag = btn.dataset.tag;
                    if (!tag) return;
                    const isAnim = btn.closest('#text-animation-panel') !== null;
                    if (isAnim) {
                        if (typeof manager.applyTextAnimation === 'function') manager.applyTextAnimation(tag);
                    } else {
                        if (typeof manager.applyFontDecoration === 'function') manager.applyFontDecoration(tag);
                    }
                });
            });

            // Built-in panel toggles
            if (manager.toggleFontDecorationBtn) {
                manager.toggleFontDecorationBtn.addEventListener('click', () => this.toggleFontDecorationPanel(manager));
            }
            if (manager.closeFontDecorationBtn) {
                manager.closeFontDecorationBtn.addEventListener('click', () => this.hideFontDecorationPanel(manager));
            }
            if (manager.toggleTextAnimationBtn) {
                manager.toggleTextAnimationBtn.addEventListener('click', () => this.toggleTextAnimationPanel(manager));
            }
            if (manager.closeTextAnimationBtn) {
                manager.closeTextAnimationBtn.addEventListener('click', () => this.hideTextAnimationPanel(manager));
            }
        }
    };
})();
