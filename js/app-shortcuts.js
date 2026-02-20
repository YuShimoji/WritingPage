// app-shortcuts.js 窶・繧ｭ繝ｼ繝懊・繝峨す繝ｧ繝ｼ繝医き繝・ヨ蜃ｦ逅・// app.js 縺九ｉ蛻・屬縲・OMContentLoaded 蠕後↓ initAppShortcuts(deps) 繧貞他縺ｳ蜃ｺ縺吶・(function () {
    'use strict';

    /**
     * 繧ｭ繝ｼ繝懊・繝峨す繝ｧ繝ｼ繝医き繝・ヨ繧貞・譛溷喧
     * @param {Object} deps - 萓晏ｭ倥が繝悶ず繧ｧ繧ｯ繝・     * @param {Function} deps.toggleSidebar
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

        // capture: true縺ｧ蜆ｪ蜈育噪縺ｫ蜃ｦ逅・        document.addEventListener('keydown', (e) => {
            // 繧ｭ繝ｼ繝舌う繝ｳ繝峨す繧ｹ繝・Β縺悟茜逕ｨ蜿ｯ閭ｽ縺ｪ蝣ｴ蜷医・縺昴ｌ繧剃ｽｿ逕ｨ
            if (window.ZenWriterKeybinds) {
                const keybinds = window.ZenWriterKeybinds.load();
                const keybindId = window.ZenWriterKeybinds.getKeybindIdForEvent(e, keybinds);

                if (keybindId) {
                    const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
                    const inFormControl = ['input', 'select', 'textarea', 'button'].includes(targetTag);

                    // 繝輔か繝ｼ繝繧ｳ繝ｳ繝医Ο繝ｼ繝ｫ蜀・〒縺ｯ荳驛ｨ縺ｮ繧ｷ繝ｧ繝ｼ繝医き繝・ヨ縺ｮ縺ｿ譛牙柑
                    const allowInFormControl = ['editor.save', 'editor.bold', 'editor.italic', 'search.toggle'];

                    if (inFormControl && !allowInFormControl.includes(keybindId)) {
                        return;
                    }

                    e.preventDefault();
                    e.stopPropagation();

                    switch (keybindId) {
                        case 'sidebar.toggle':
                            logger.info('繧ｭ繝ｼ繝懊・繝峨す繝ｧ繝ｼ繝医き繝・ヨ: 繧ｵ繧､繝峨ヰ繝ｼ髢矩哩');
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
                            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.saveContent === 'function') {
                                window.ZenWriterEditor.saveContent();
                            }
                            break;
                        case 'editor.bold':
                            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration === 'function') {
                                window.ZenWriterEditor.applyFontDecoration('bold');
                            }
                            break;
                        case 'editor.italic':
                            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration === 'function') {
                                window.ZenWriterEditor.applyFontDecoration('italic');
                            }
                            break;
                        case 'editor.font.increase':
                            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.adjustGlobalFontSize === 'function') {
                                window.ZenWriterEditor.adjustGlobalFontSize(1);
                            }
                            break;
                        case 'editor.font.decrease':
                            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.adjustGlobalFontSize === 'function') {
                                window.ZenWriterEditor.adjustGlobalFontSize(-1);
                            }
                            break;
                        case 'editor.font.reset':
                            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setGlobalFontSize === 'function') {
                                window.ZenWriterEditor.setGlobalFontSize(16);
                            }
                            break;
                    }
                    return;
                }
            }

            // 繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ: 繧ｭ繝ｼ繝舌う繝ｳ繝峨す繧ｹ繝・Β縺悟茜逕ｨ縺ｧ縺阪↑縺・ｴ蜷・            // Alt + 1: 繧ｵ繧､繝峨ヰ繝ｼ繧帝幕髢・            if (e.altKey && e.key === '1') {
                e.preventDefault();
                e.stopPropagation();
                logger.info('繧ｭ繝ｼ繝懊・繝峨す繝ｧ繝ｼ繝医き繝・ヨ: Alt+1 竊・繧ｵ繧､繝峨ヰ繝ｼ髢矩哩');
                toggleSidebar();
                return;
            }

            const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
            const inFormControl = ['input', 'select', 'textarea', 'button'].includes(targetTag);

            // Alt+W: 繝・・繝ｫ繝舌・蛻・ｊ譖ｿ縺・            if (!inFormControl && e.altKey && (e.key === 'w' || e.key === 'W')) {
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

            // Ctrl+P / Cmd+P: 繧ｳ繝槭Φ繝峨ヱ繝ｬ繝・ヨ
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                if (window.commandPalette && typeof window.commandPalette.toggle === 'function') {
                    window.commandPalette.toggle();
                }
                return;
            }

            // Ctrl+F: 讀懃ｴ｢繝代ロ繝ｫ
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
                    window.ZenWriterEditor.toggleSearchPanel();
                }
            }

            // Ctrl+Shift+Z: 譛蠕後・繧ｹ繝翫ャ繝励す繝ｧ繝・ヨ縺九ｉ蠕ｩ蜈・            if (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                restoreLastSnapshot();
            }

            // F2: UI繝｢繝ｼ繝峨し繧､繧ｯ繝ｫ蛻・崛
            if (e.key === 'F2') {
                e.preventDefault();
                const currentMode = document.documentElement.getAttribute('data-ui-mode') || 'normal';
                const modes = ['normal', 'focus', 'blank'];
                const currentIndex = modes.indexOf(currentMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                setUIMode(modes[nextIndex]);
                return;
            }

            // Escape: Blank繝｢繝ｼ繝峨°繧・Normal 縺ｫ謌ｻ繧九√∪縺溘・繝｢繝ｼ繝繝ｫ繧帝哩縺倥ｋ
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
                    const closeBtn = modal.querySelector('.panel-close, .modal-close, [aria-label*="??"], [aria-label*="close"]');
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
