// electron-bridge.js — Connects Electron IPC to existing app functionality.
// Only activates when running inside Electron (window.electronAPI exists).
(function () {
    'use strict';

    if (!window.electronAPI || !window.electronAPI.isElectron) return;

    const api = window.electronAPI;

    /* ---------- Menu command routing ---------- */
    api.onMenuCommand((channel, ...args) => {
        switch (channel) {
            case 'menu:new-document':
                if (window.ZenWriterStorage && typeof window.ZenWriterStorage.createDocument === 'function') {
                    window.ZenWriterStorage.createDocument();
                    const editor = document.getElementById('editor');
                    if (editor) editor.value = '';
                }
                break;

            case 'menu:find':
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
                    window.ZenWriterEditor.toggleSearchPanel();
                }
                break;

            case 'menu:find-replace':
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleSearchPanel === 'function') {
                    window.ZenWriterEditor.toggleSearchPanel();
                }
                break;

            case 'menu:print':
                window.print();
                break;

            case 'menu:toggle-sidebar': {
                const btn = document.getElementById('toggle-sidebar');
                if (btn) btn.click();
                break;
            }

            case 'menu:toggle-toolbar': {
                const btn = document.getElementById('toggle-toolbar');
                if (btn) btn.click();
                break;
            }

            case 'menu:toggle-focus':
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleFocusMode === 'function') {
                    window.ZenWriterEditor.toggleFocusMode();
                } else {
                    document.documentElement.setAttribute('data-ui-mode', 'focus');
                }
                break;

            case 'menu:toggle-typewriter':
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleTypewriterMode === 'function') {
                    window.ZenWriterEditor.toggleTypewriterMode();
                }
                break;

            case 'menu:toggle-minimal':
                toggleMinimalMode();
                break;

            case 'menu:toggle-split-view': {
                const btn = document.getElementById('toggle-split-view');
                if (btn) btn.click();
                break;
            }

            case 'menu:zoom-in':
                adjustZoom(1);
                break;
            case 'menu:zoom-out':
                adjustZoom(-1);
                break;
            case 'menu:zoom-reset':
                resetZoom();
                break;

            case 'menu:export': {
                const format = args[0];
                handleExport(format);
                break;
            }
        }
    });

    /* ---------- File open (main -> renderer) ---------- */
    api.onFileOpened((data) => {
        const editor = document.getElementById('editor');
        if (editor) {
            editor.value = data.content;
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
            window.ZenWriterStorage.saveContent(data.content);
        }
    });

    /* ---------- File save (main requests content) ---------- */
    api.onRequestContentForSave((filePath) => {
        const editor = document.getElementById('editor');
        const content = editor ? editor.value : '';
        api.sendSaveContent(filePath, content);
    });

    api.onFileSaved((data) => {
        if (data.success) {
            showNotification('保存しました: ' + data.path.split(/[\\/]/).pop());
        }
    });

    /* ---------- Export ---------- */
    async function handleExport(format) {
        const editor = document.getElementById('editor');
        const content = editor ? editor.value : '';
        const docs = window.ZenWriterStorage ? window.ZenWriterStorage.loadDocuments() : [];
        const currentDoc = docs.find(d => d.id === (window.ZenWriterStorage ? window.ZenWriterStorage.getCurrentDocId() : ''));
        const baseName = (currentDoc ? currentDoc.name : '無題').replace(/\.[^.]+$/, '');

        let exportContent = content;
        let defaultName = baseName;
        let filters = [];

        switch (format) {
            case 'txt':
                defaultName += '.txt';
                filters = [{ name: 'テキストファイル', extensions: ['txt'] }];
                break;
            case 'html': {
                const rendered = renderMarkdown(content);
                exportContent = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:sans-serif;max-width:800px;margin:2em auto;line-height:1.8;}</style></head><body>${rendered}</body></html>`;
                defaultName += '.html';
                filters = [{ name: 'HTMLファイル', extensions: ['html'] }];
                break;
            }
            case 'md':
                defaultName += '.md';
                filters = [{ name: 'Markdownファイル', extensions: ['md'] }];
                break;
        }

        const result = await api.exportFile(exportContent, defaultName, filters);
        if (result.success) {
            showNotification('エクスポート完了: ' + result.path.split(/[\\/]/).pop());
        }
    }

    /* ---------- Minimal mode ---------- */
    function toggleMinimalMode() {
        const html = document.documentElement;
        const current = html.getAttribute('data-ui-mode');
        if (current === 'minimal') {
            html.setAttribute('data-ui-mode', 'normal');
            document.body.classList.remove('ultra-minimal');
        } else {
            html.setAttribute('data-ui-mode', 'minimal');
            document.body.classList.add('ultra-minimal');
            // Hide everything except editor
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('open');
        }
    }

    /* ---------- System theme sync ---------- */
    api.getSystemTheme().then((theme) => {
        document.dispatchEvent(new CustomEvent('electron:theme', { detail: theme }));
    });
    api.onThemeChanged((theme) => {
        document.dispatchEvent(new CustomEvent('electron:theme', { detail: theme }));
    });

    /* ---------- Auto-updater UI ---------- */
    api.onUpdateAvailable((info) => {
        showNotification(`新しいバージョン ${info.version} が利用可能です`, 'update');
    });
    api.onUpdateDownloaded(() => {
        if (confirm('アップデートがダウンロードされました。今すぐ再起動してインストールしますか？')) {
            api.installUpdate();
        }
    });
    api.onUpdaterError((msg) => {
        console.warn('Auto-updater error:', msg);
    });

    /* ---------- Helpers ---------- */
    function adjustZoom(direction) {
        const editor = document.getElementById('editor');
        if (!editor) return;
        const current = parseFloat(window.getComputedStyle(editor).fontSize) || 16;
        const newSize = Math.max(10, Math.min(48, current + direction * 2));
        editor.style.fontSize = newSize + 'px';
    }

    function resetZoom() {
        const editor = document.getElementById('editor');
        if (editor) editor.style.fontSize = '';
    }

    function renderMarkdown(text) {
        if (window.markdownit) {
            const md = window.markdownit();
            return md.render(text);
        }
        // Simple fallback
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
    }

    function showNotification(message, type) {
        if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
            window.ZenWriterHUD.show(message);
        } else {
            console.info('[Zen Writer]', message, type || '');
        }
    }

    console.info('[Electron Bridge] initialized');
})();
