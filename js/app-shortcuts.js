// app-shortcuts.js — キーボードショートカット処理
// app.js から分離。DOMContentLoaded 後に initAppShortcuts(deps) を呼び出す。
(function () {
    'use strict';

    /**
     * キーボードショートカットを初期化
     * @param {Object} deps - 依存オブジェクト
     * @param {Function} deps.toggleSidebar
     * @param {Function} deps.setUIMode
     * @param {Function} deps.restoreLastSnapshot
     * @param {Object}   deps.logger
     */
    function initAppShortcuts(deps) {
        const {
            toggleSidebar,
            setUIMode,
            restoreLastSnapshot,
            logger,
            sidebarManager
        } = deps;

        function showCommandPalette() {
            if (window.commandPalette && typeof window.commandPalette.show === 'function') {
                window.commandPalette.show();
                return true;
            }
            return false;
        }

        function toggleCommandPalette() {
            if (window.commandPalette && typeof window.commandPalette.toggle === 'function') {
                window.commandPalette.toggle();
                return true;
            }
            return false;
        }

        function clearRetiredShellState() {
            if (document.body && document.body.hasAttribute('data-top-chrome-visible')) {
                document.body.removeAttribute('data-top-chrome-visible');
                return true;
            }
            return false;
        }

        // capture: trueで優先的に処理
        document.addEventListener('keydown', (e) => {
            // キーバインドシステムが利用可能な場合はそれを使用
            if (window.ZenWriterKeybinds) {
                const keybinds = window.ZenWriterKeybinds.load();
                const keybindId = window.ZenWriterKeybinds.getKeybindIdForEvent(e, keybinds);

                if (keybindId) {
                    const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
                    const inFormControl = ['input', 'select', 'textarea', 'button'].includes(targetTag);

                    // フォームコントロール内では一部のショートカットのみ有効
                    // 注: ui.mode.exit (Escape) は除外 — モーダル/パネルのEscape処理を妨げないため
                    const allowInFormControl = [
                        'editor.save', 'editor.bold', 'editor.italic',
                        'search.toggle', 'search.global.toggle',
                        'toolbar.toggle', 'sidebar.toggle',
                        'ui.mode.cycle', 'command-palette.toggle',
                        'writing.scene.prev', 'writing.scene.next',
                        'writing.chapter.prev', 'writing.chapter.next'
                    ];

                    if (inFormControl && !allowInFormControl.includes(keybindId)) {
                        return;
                    }

                    if (keybindId === 'ui.mode.exit' && !clearRetiredShellState()) {
                        // Escape はモーダル / Reader / Focus 終了の fallback 処理へ流す。
                    } else {
                        e.preventDefault();
                        e.stopPropagation();

                        switch (keybindId) {
                            case 'sidebar.toggle':
                                logger.info('キーボードショートカット: サイドバー開閉');
                                toggleSidebar();
                                break;

                            case 'toolbar.toggle':
                                if (e.repeat) return;
                                showCommandPalette();
                                break;

                            case 'command-palette.toggle':
                                toggleCommandPalette();
                                break;

                        case 'search.toggle':
                            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
                                window.ZenWriterEditor.toggleSearchPanel();
                            }
                            break;

                        case 'search.global.toggle':
                            if (window.GlobalSearchUI && typeof window.GlobalSearchUI.showPanel === 'function') {
                                window.GlobalSearchUI.showPanel();
                            }
                            break;

                        case 'snapshot.restore':
                            restoreLastSnapshot();
                            break;

                        case 'ui.mode.cycle':
                            showCommandPalette();
                            break;

                        case 'ui.mode.exit':
                            break;

                        case 'editor.save':
                        case 'editor.bold':
                        case 'editor.italic':
                        case 'editor.font.increase':
                        case 'editor.font.decrease':
                        case 'editor.font.reset':
                            // editor.jsで処理される
                            break;

                        case 'writing.scene.prev':
                            if (sidebarManager && typeof sidebarManager.moveWritingFocusScene === 'function') {
                                sidebarManager.moveWritingFocusScene(-1);
                            } else if (window.sidebarManager && typeof window.sidebarManager.moveWritingFocusScene === 'function') {
                                window.sidebarManager.moveWritingFocusScene(-1);
                            }
                            break;

                        case 'writing.scene.next':
                            if (sidebarManager && typeof sidebarManager.moveWritingFocusScene === 'function') {
                                sidebarManager.moveWritingFocusScene(1);
                            } else if (window.sidebarManager && typeof window.sidebarManager.moveWritingFocusScene === 'function') {
                                window.sidebarManager.moveWritingFocusScene(1);
                            }
                            break;

                        case 'writing.chapter.prev':
                            if (sidebarManager && typeof sidebarManager.moveWritingFocusChapter === 'function') {
                                sidebarManager.moveWritingFocusChapter(-1);
                            } else if (window.sidebarManager && typeof window.sidebarManager.moveWritingFocusChapter === 'function') {
                                window.sidebarManager.moveWritingFocusChapter(-1);
                            }
                            break;

                        case 'writing.chapter.next':
                            if (sidebarManager && typeof sidebarManager.moveWritingFocusChapter === 'function') {
                                sidebarManager.moveWritingFocusChapter(1);
                            } else if (window.sidebarManager && typeof window.sidebarManager.moveWritingFocusChapter === 'function') {
                                window.sidebarManager.moveWritingFocusChapter(1);
                            }
                            break;

                        case 'app.settings.open':
                            if (window.ZenWriterApp && typeof window.ZenWriterApp.openSettingsModal === 'function') {
                                window.ZenWriterApp.openSettingsModal();
                            }
                            break;

                        case 'app.help.open':
                            if (window.ZenWriterApp && typeof window.ZenWriterApp.openHelpModal === 'function') {
                                window.ZenWriterApp.openHelpModal();
                            }
                            break;
                    }
                    return;
                    }
                }
            }

            // フォールバック: キーバインドシステムが利用できない場合
            // Alt + 1: サイドバーを開閉
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
                showCommandPalette();
                return;
            }

            // Alt+↑/↓: 前後シーン移動
            if (e.altKey && !e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                const manager = sidebarManager || window.sidebarManager;
                if (manager && typeof manager.moveWritingFocusScene === 'function') {
                    manager.moveWritingFocusScene(e.key === 'ArrowUp' ? -1 : 1);
                }
                return;
            }

            // Alt+Shift+↑/↓: 前後章移動
            if (e.altKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                const manager = sidebarManager || window.sidebarManager;
                if (manager && typeof manager.moveWritingFocusChapter === 'function') {
                    manager.moveWritingFocusChapter(e.key === 'ArrowUp' ? -1 : 1);
                }
                return;
            }

            // Ctrl+P / Cmd+P: コマンドパレット
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                if (window.commandPalette && typeof window.commandPalette.toggle === 'function') {
                    window.commandPalette.toggle();
                }
                return;
            }

            // Ctrl+, / Cmd+,: 設定モーダル (Mac metaKey フォールバック含む)
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                if (window.ZenWriterApp && typeof window.ZenWriterApp.openSettingsModal === 'function') {
                    window.ZenWriterApp.openSettingsModal();
                }
                return;
            }

            // F1: ヘルプモーダル
            if (e.key === 'F1') {
                e.preventDefault();
                if (window.ZenWriterApp && typeof window.ZenWriterApp.openHelpModal === 'function') {
                    window.ZenWriterApp.openHelpModal();
                }
                return;
            }

            // Ctrl+F: 検索パネル
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
                    window.ZenWriterEditor.toggleSearchPanel();
                }
            }

            // Ctrl+Shift+Z: 最後のスナップショットから復元
            if (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                restoreLastSnapshot();
            }

            // F2: コマンドパレット表示
            if (e.key === 'F2') {
                e.preventDefault();
                showCommandPalette();
                return;
            }

            // Escape: Focus終了、またはモーダルを閉じる
            if (e.key === 'Escape') {
                const openModals = Array.from(document.querySelectorAll('[aria-modal="true"]')).filter((modal) => {
                    try {
                        const ariaHidden = modal.getAttribute('aria-hidden');
                        const style = window.getComputedStyle(modal);
                        const visible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                        return ariaHidden !== 'true' && visible;
                    } catch (_) {
                        return false;
                    }
                });
                if (openModals.length > 0) {
                    const modal = openModals[openModals.length - 1];
                    const closeBtn = modal.querySelector('.panel-close, .modal-close, [aria-label*="閉じる"], [aria-label*="close"]');
                    if (closeBtn) {
                        e.preventDefault();
                        closeBtn.click();
                        return;
                    }
                }

                // 再生オーバーレイを先に閉じる（Focus 維持のまま Reader のみ終了）
                if (window.ZWReaderPreview && typeof window.ZWReaderPreview.isOpen === 'function' && window.ZWReaderPreview.isOpen()) {
                    e.preventDefault();
                    if (typeof window.ZWReaderPreview.exit === 'function') {
                        window.ZWReaderPreview.exit();
                    }
                    return;
                }

                if (clearRetiredShellState()) {
                    e.preventDefault();
                    return;
                }

                const currentMode = document.documentElement.getAttribute('data-ui-mode');
                if (currentMode === 'focus') {
                    e.preventDefault();
                    setUIMode('normal');
                    return;
                }
            }
        }, true);
    }

    window.initAppShortcuts = initAppShortcuts;
})();
