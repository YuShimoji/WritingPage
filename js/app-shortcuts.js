// app-shortcuts.js — キーボードショートカット処理
// app.js から分離。DOMContentLoaded 後に initAppShortcuts(deps) を呼び出す。
(function () {
    'use strict';

    /**
     * キーボードショートカットを初期化
     * @param {Object} deps - 依存オブジェクト
     * @param {Function} deps.toggleSidebar
     * @param {Function} deps.toggleToolbar
     * @param {Function} deps.setUIMode
     * @param {Function} deps.restoreLastSnapshot
     * @param {Object}   deps.logger
     */
    function initAppShortcuts(deps) {
        const {
            toggleSidebar,
            toggleToolbar,
            setUIMode,
            restoreLastSnapshot,
            logger
        } = deps;

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
                    const allowInFormControl = ['editor.save', 'editor.bold', 'editor.italic', 'search.toggle'];

                    if (inFormControl && !allowInFormControl.includes(keybindId)) {
                        return;
                    }

                    e.preventDefault();
                    e.stopPropagation();

                    switch (keybindId) {
                        case 'sidebar.toggle':
                            logger.info('キーボードショートカット: サイドバー開閉');
                            toggleSidebar();
                            break;

                        case 'toolbar.toggle':
                            if (e.repeat) return;
                            {
                                const currentMode = document.documentElement.getAttribute('data-ui-mode');
                                if (currentMode === 'blank') {
                                    setUIMode('normal');
                                    return;
                                }
                            }
                            toggleToolbar();
                            break;

                        case 'command-palette.toggle':
                            if (window.commandPalette && typeof window.commandPalette.toggle === 'function') {
                                window.commandPalette.toggle();
                            }
                            break;

                        case 'search.toggle':
                            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
                                window.ZenWriterEditor.toggleSearchPanel();
                            }
                            break;

                        case 'snapshot.restore':
                            restoreLastSnapshot();
                            break;

                        case 'ui.mode.cycle':
                            {
                                const mode = document.documentElement.getAttribute('data-ui-mode') || 'normal';
                                const modes = ['normal', 'focus', 'blank'];
                                const currentIndex = modes.indexOf(mode);
                                const nextIndex = (currentIndex + 1) % modes.length;
                                setUIMode(modes[nextIndex]);
                            }
                            break;

                        case 'ui.mode.exit':
                            {
                                const currentMode2 = document.documentElement.getAttribute('data-ui-mode');
                                if (currentMode2 === 'blank' || currentMode2 === 'focus') {
                                    setUIMode('normal');
                                }
                            }
                            break;

                        case 'editor.save':
                        case 'editor.bold':
                        case 'editor.italic':
                        case 'editor.font.increase':
                        case 'editor.font.decrease':
                        case 'editor.font.reset':
                            // editor.jsで処理される
                            break;
                    }
                    return;
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

                const currentMode = document.documentElement.getAttribute('data-ui-mode');
                if (currentMode === 'blank') {
                    setUIMode('normal');
                    return;
                }

                toggleToolbar();
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

            // F2: UIモードサイクル切替
            if (e.key === 'F2') {
                e.preventDefault();
                const currentMode = document.documentElement.getAttribute('data-ui-mode') || 'normal';
                const modes = ['normal', 'focus', 'blank'];
                const currentIndex = modes.indexOf(currentMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                setUIMode(modes[nextIndex]);
                return;
            }

            // Escape: Blankモードから Normal に戻る、またはモーダルを閉じる
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

                const currentMode = document.documentElement.getAttribute('data-ui-mode');
                if (currentMode === 'blank' || currentMode === 'focus') {
                    e.preventDefault();
                    setUIMode('normal');
                    return;
                }
            }
        }, true);
    }

    window.initAppShortcuts = initAppShortcuts;
})();
