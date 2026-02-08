// app-file-manager.js — ファイル管理機能
// app.js から分離。DOMContentLoaded 後に initAppFileManager(deps) を呼び出す。
(function () {
    'use strict';

    /**
     * ファイル管理を初期化
     * @param {Object} deps
     * @param {Object} deps.elementManager
     * @param {Function} deps.updateDocumentTitle
     */
    function initAppFileManager(deps) {
        const { elementManager, updateDocumentTitle } = deps;

        const fileManager = {
            updateDocumentList() {
                const select = elementManager.get('currentDocument');
                if (!select) return;

                while (select.options.length > 1) {
                    select.remove(1);
                }

                try {
                    const docs = window.ZenWriterStorage.loadDocuments ? (window.ZenWriterStorage.loadDocuments() || []) : [];
                    const currentDocId = window.ZenWriterStorage.getCurrentDocId ? window.ZenWriterStorage.getCurrentDocId() : null;

                    docs.forEach(doc => {
                        if (doc && doc.id && doc.name) {
                            const option = document.createElement('option');
                            option.value = doc.id;
                            option.textContent = doc.name;
                            option.selected = (doc.id === currentDocId);
                            select.appendChild(option);
                        }
                    });
                } catch (e) {
                    console.warn('ドキュメントリスト更新エラー:', e);
                }
            },

            switchDocument(docId) {
                if (!docId) return;

                try {
                    const settings = window.ZenWriterStorage.loadSettings ? window.ZenWriterStorage.loadSettings() : {};
                    const autoSaveEnabled = settings.autoSave && settings.autoSave.enabled;

                    try {
                        const hasDirty = (window.ZenWriterEditor && typeof window.ZenWriterEditor.isDirty === 'function')
                            ? window.ZenWriterEditor.isDirty()
                            : false;
                        if (hasDirty) {
                            if (autoSaveEnabled) {
                                const editorEl = elementManager.get('editor');
                                const content = editorEl ? (editorEl.value || '') : '';
                                if (window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                                    window.ZenWriterStorage.saveContent(content);
                                }
                            } else {
                                const msg = (window.UILabels && window.UILabels.UNSAVED_CHANGES_SWITCH) || '未保存の変更があります。ファイルを切り替えますか？\n現在の内容はスナップショットとして自動退避します。';
                                const ok = confirm(msg);
                                if (!ok) {
                                    const selectEl = elementManager.get('currentDocument');
                                    const currentDocId = window.ZenWriterStorage.getCurrentDocId ? window.ZenWriterStorage.getCurrentDocId() : null;
                                    if (selectEl && currentDocId) selectEl.value = currentDocId;
                                    return;
                                }
                                try {
                                    const editorEl = elementManager.get('editor');
                                    const content = editorEl ? (editorEl.value || '') : '';
                                    if (window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
                                        window.ZenWriterStorage.addSnapshot(content);
                                    }
                                } catch (_) { }
                            }
                        }
                    } catch (_) { }

                    if (window.ZenWriterStorage.setCurrentDocId) {
                        window.ZenWriterStorage.setCurrentDocId(docId);
                    }

                    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.loadContent === 'function') {
                        window.ZenWriterEditor.loadContent();
                        window.ZenWriterEditor.updateWordCount();
                    }

                    this.updateDocumentList();
                    try { updateDocumentTitle(); } catch (_) { }

                    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.showNotification === 'function') {
                        window.ZenWriterEditor.showNotification('ファイルを切り替えました');
                    }
                } catch (e) {
                    console.error('ドキュメント切り替えエラー:', e);
                }
            },

            createNewDocument() {
                const name = prompt((window.UILabels && window.UILabels.NEW_DOC_PROMPT) || '新しいファイルの名前を入力してください:');
                if (!name || !name.trim()) return;

                try {
                    if (window.ZenWriterStorage.createDocument) {
                        const newDoc = window.ZenWriterStorage.createDocument(name.trim());
                        if (newDoc && newDoc.id) {
                            this.switchDocument(newDoc.id);
                        }
                    }
                } catch (e) {
                    console.error('新規ドキュメント作成エラー:', e);
                }
            },

            initializeDocuments() {
                try {
                    const docs = window.ZenWriterStorage.loadDocuments ? (window.ZenWriterStorage.loadDocuments() || []) : [];
                    if (docs.length === 0) {
                        const currentContent = window.ZenWriterStorage.loadContent ? (window.ZenWriterStorage.loadContent() || '') : '';
                        window.ZenWriterStorage.createDocument('デフォルト', currentContent);
                    }

                    const currentDocId = window.ZenWriterStorage.getCurrentDocId ? window.ZenWriterStorage.getCurrentDocId() : null;
                    if (!currentDocId && docs.length > 0) {
                        window.ZenWriterStorage.setCurrentDocId(docs[0].id);
                    }
                } catch (e) {
                    console.warn('ドキュメント初期化エラー:', e);
                }
            }
        };

        // イベントリスナー設定
        const currentDocumentSelect = elementManager.get('currentDocument');
        const newDocumentBtn = elementManager.get('newDocumentBtn');
        const restoreFromSnapshotBtn = elementManager.get('restoreFromSnapshotBtn');

        if (currentDocumentSelect) {
            currentDocumentSelect.addEventListener('change', (e) => {
                fileManager.switchDocument(e.target.value);
            });
        }

        if (newDocumentBtn) {
            newDocumentBtn.addEventListener('click', () => {
                try {
                    const hasDirty = (window.ZenWriterEditor && typeof window.ZenWriterEditor.isDirty === 'function')
                        ? window.ZenWriterEditor.isDirty()
                        : false;
                    if (hasDirty) {
                        const msg = (window.UILabels && window.UILabels.UNSAVED_CHANGES_NEW) || '未保存の変更があります。新規作成を続行しますか？\n現在の内容はスナップショットとして自動退避します。';
                        const ok = confirm(msg);
                        if (!ok) return;
                        try {
                            const editorEl = elementManager.get('editor');
                            const content = editorEl ? (editorEl.value || '') : '';
                            if (window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
                                window.ZenWriterStorage.addSnapshot(content);
                            }
                        } catch (_) { }
                    }
                } catch (_) { }
                fileManager.createNewDocument();
            });
        }

        if (restoreFromSnapshotBtn) {
            restoreFromSnapshotBtn.addEventListener('click', () => {
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.restoreLastSnapshot === 'function') {
                    window.ZenWriterEditor.restoreLastSnapshot();
                }
            });
        }

        // 初期化
        fileManager.initializeDocuments();
        fileManager.updateDocumentList();

        return fileManager;
    }

    window.initAppFileManager = initAppFileManager;
})();
