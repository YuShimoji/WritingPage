// electron-bridge.js — Connects Electron IPC to existing app functionality.
// Only activates when running inside Electron (window.electronAPI exists).
(function () {
    'use strict';

    if (!window.electronAPI || !window.electronAPI.isElectron) return;

    document.documentElement.classList.add('is-electron');
    document.body.classList.add('is-electron');

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
                // R-8: setUIMode を経由 (SP-081 Phase 3)
                if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
                    var current = document.documentElement.getAttribute('data-ui-mode');
                    window.ZenWriterApp.setUIMode(current === 'focus' ? 'normal' : 'focus');
                } else if (window.ZenWriterEditor && typeof window.ZenWriterEditor.toggleFocusMode === 'function') {
                    window.ZenWriterEditor.toggleFocusMode();
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

            case 'menu:export-project-json': {
                const storage = window.ZenWriterStorage;
                if (storage && storage.exportProjectJSON) {
                    const docId = storage.getCurrentDocId ? storage.getCurrentDocId() : null;
                    if (docId) storage.exportProjectJSON(docId);
                }
                break;
            }

            case 'menu:import-project-json': {
                const storage2 = window.ZenWriterStorage;
                if (storage2 && storage2.importProjectJSONFromFile) {
                    storage2.importProjectJSONFromFile().then(function (docId) {
                        if (docId) {
                            if (storage2.setCurrentDocId) storage2.setCurrentDocId(docId);
                            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.loadContent === 'function') {
                                window.ZenWriterEditor.loadContent();
                            }
                        }
                    });
                }
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
        editor.style.fontSize = (newSize / 16) + 'rem';
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

    /* ---------- Frameless window controls ---------- */
    function setupWindowControls() {
        const btnMin = document.getElementById('win-minimize');
        const btnMax = document.getElementById('win-maximize');
        const btnClose = document.getElementById('win-close');

        if (btnMin) btnMin.addEventListener('click', () => api.minimize());
        if (btnMax) btnMax.addEventListener('click', () => api.maximize());
        if (btnClose) btnClose.addEventListener('click', () => api.close());

        // Update maximize/restore icon
        async function updateMaxIcon() {
            if (!btnMax) return;
            const maximized = await api.isMaximized();
            const icon = btnMax.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', maximized ? 'copy' : 'square');
                if (window.lucide) window.lucide.createIcons({ nodes: [icon] });
            }
            btnMax.title = maximized ? '元に戻す' : '最大化';
            btnMax.setAttribute('aria-label', maximized ? '元に戻す' : '最大化');
        }

        updateMaxIcon();
        api.onMaximizedChanged(() => updateMaxIcon());
    }

    setupWindowControls();

    /* ---------- Double-click toolbar to maximize/restore ---------- */
    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
        toolbar.addEventListener('dblclick', (e) => {
            if (e.target.closest('button, input, select, a, [contenteditable]')) return;
            api.maximize();
        });
    }

    console.info('[Electron Bridge] initialized');
})();
