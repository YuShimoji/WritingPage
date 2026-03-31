// app-file-manager.js — ファイル管理機能
// app.js から分離。DOMContentLoaded 後に initAppFileManager(deps) を呼び出す。
// データ保全は ZWContentGuard に委譲する。
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

        /** ContentGuard を安全に取得 */
        function guard() { return window.ZWContentGuard || null; }

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
                    var G = guard();
                    if (G) {
                        // ContentGuard 経由: chapterMode flush + dirty check + snapshot を一括処理
                        var canProceed = G.prepareDocumentSwitch(docId, {
                            confirmIfDirty: true,
                            onCancelled: function () {
                                // キャンセル時: ドロップダウンを元に戻す
                                var selectEl = elementManager.get('currentDocument');
                                var currentDocId = window.ZenWriterStorage.getCurrentDocId ? window.ZenWriterStorage.getCurrentDocId() : null;
                                if (selectEl && currentDocId) selectEl.value = currentDocId;
                            }
                        });
                        if (!canProceed) return;
                    } else {
                        // ContentGuard 未ロード時のフォールバック (起動初期)
                        this._legacyDirtyCheck();
                    }

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
                            // chapterMode を自動適用
                            var Store = window.ZWChapterStore;
                            if (Store && Store.ensureChapterMode) {
                                Store.ensureChapterMode(newDoc.id);
                            }
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
                        const newDoc = window.ZenWriterStorage.createDocument('デフォルト', currentContent);
                        // chapterMode を自動適用
                        var Store = window.ZWChapterStore;
                        if (newDoc && newDoc.id && Store && Store.ensureChapterMode) {
                            Store.ensureChapterMode(newDoc.id);
                        }
                    }

                    const currentDocId = window.ZenWriterStorage.getCurrentDocId ? window.ZenWriterStorage.getCurrentDocId() : null;
                    if (!currentDocId && docs.length > 0) {
                        window.ZenWriterStorage.setCurrentDocId(docs[0].id);
                    }
                } catch (e) {
                    console.warn('ドキュメント初期化エラー:', e);
                }
            },

            /** ContentGuard 未ロード時のレガシーフォールバック */
            _legacyDirtyCheck() {
                try {
                    var hasDirty = (window.ZenWriterEditor && typeof window.ZenWriterEditor.isDirty === 'function')
                        ? window.ZenWriterEditor.isDirty()
                        : false;
                    if (hasDirty) {
                        var settings = window.ZenWriterStorage.loadSettings ? window.ZenWriterStorage.loadSettings() : {};
                        var autoSaveEnabled = settings.autoSave && settings.autoSave.enabled;
                        if (autoSaveEnabled) {
                            // WYSIWYG 対応: getEditorValue を優先
                            var content = '';
                            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.getEditorValue === 'function') {
                                content = window.ZenWriterEditor.getEditorValue() || '';
                            }
                            if (!content) {
                                var editorEl = elementManager.get('editor');
                                content = editorEl ? (editorEl.value || '') : '';
                            }
                            if (window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                                window.ZenWriterStorage.saveContent(content);
                            }
                        }
                    }
                } catch (_) { }
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
                var G = guard();
                if (G) {
                    if (!G.prepareNewDocument()) return;
                } else {
                    // ContentGuard 未ロード時のフォールバック
                    try {
                        var hasDirty = (window.ZenWriterEditor && typeof window.ZenWriterEditor.isDirty === 'function')
                            ? window.ZenWriterEditor.isDirty()
                            : false;
                        if (hasDirty) {
                            var msg = (window.UILabels && window.UILabels.UNSAVED_CHANGES_NEW) || '未保存の変更があります。新規作成を続行しますか？\n現在の内容はスナップショットとして自動退避します。';
                            if (!confirm(msg)) return;
                        }
                    } catch (_) { }
                }
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
