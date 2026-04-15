// app-autosave-api.js — 自動保存・オフライン検知・ZenWriterAPI・TabManager
// app.js から分離。DOMContentLoaded 後に initAppAutosaveApi(deps) を呼び出す。
(function () {
    'use strict';

    /**
     * 自動保存・API・タブ管理を初期化
     * @param {Object} deps
     * @param {Object}   deps.elementManager
     * @param {Function} deps.activateSidebarGroup
     */
    function initAppAutosaveApi(deps) {
        const { elementManager, activateSidebarGroup } = deps;

        // ===== リアルタイム自動保存機能 =====
        let autoSaveTimeout = null;
        function _triggerAutoSave() {
            if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
            const settings = window.ZenWriterStorage.loadSettings();
            const autoSave = settings.autoSave || {};
            if (!autoSave.enabled) return;
            const delay = autoSave.delayMs || 2000;
            autoSaveTimeout = setTimeout(() => {
                if (window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                    try {
                        var G = window.ZWContentGuard;
                        var content = G ? G.getEditorContent() : '';
                        if (!content) {
                            const editor = elementManager.get('editor');
                            content = editor ? (editor.value || '') : '';
                        }
                        if (G) G.flushChapterIfNeeded();
                        // chapterMode: アクティブ章だけでなく全文を組み立てて保存
                        var _Store = window.ZWChapterStore;
                        var _S = window.ZenWriterStorage;
                        var _rawId = _S && typeof _S.getCurrentDocId === 'function' ? _S.getCurrentDocId() : null;
                        var _docId =
                            _rawId && _Store && typeof _Store.resolveParentDocumentId === 'function'
                                ? _Store.resolveParentDocumentId(_rawId)
                                : _rawId;
                        if (_docId && _Store && _Store.isChapterMode(_docId)) {
                            content = _Store.assembleFullText(_docId);
                        }
                        window.ZenWriterStorage.saveContent(content);
                        // HUDに保存通知
                        if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
                            window.ZenWriterHUD.show('自動保存されました', 1500, { type: 'success' });
                        }
                    } catch (e) {
                        console.error('自動保存エラー:', e);
                    }
                }
            }, delay);
        }

        // ===== オフライン検知と自動バックアップ =====
        let isOnline = navigator.onLine;
        function updateOnlineStatus() {
            const wasOnline = isOnline;
            isOnline = navigator.onLine;
            if (wasOnline !== isOnline) {
                if (!isOnline) {
                    if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
                        window.ZenWriterHUD.show('オフラインになりました。変更はローカルに保存されます。', 3000, { type: 'warning' });
                    }
                } else {
                    if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
                        window.ZenWriterHUD.show('オンラインに戻りました。', 2000, { type: 'success' });
                    }
                }
            }
        }
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // 自動バックアップ強化: ページを離れる前に保存
        window.addEventListener('beforeunload', function (_e) {
            try {
                var G = window.ZWContentGuard;
                if (G) {
                    // ContentGuard 経由: chapterMode flush + ドキュメント保存
                    G.ensureSaved({ snapshot: false });
                    // chapterMode: 全文で上書き（ensureSaved はアクティブ章テキストのみ保存するため）
                    var _Store2 = window.ZWChapterStore;
                    var _S2 = window.ZenWriterStorage;
                    var _raw2 = _S2 && typeof _S2.getCurrentDocId === 'function' ? _S2.getCurrentDocId() : null;
                    var _dId =
                        _raw2 && _Store2 && typeof _Store2.resolveParentDocumentId === 'function'
                            ? _Store2.resolveParentDocumentId(_raw2)
                            : _raw2;
                    if (_dId && _Store2 && _Store2.isChapterMode(_dId)) {
                        _S2.saveContent(_Store2.assembleFullText(_dId));
                    }
                } else {
                    // フォールバック: ContentGuard 未ロード時
                    var content = '';
                    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.getEditorValue === 'function') {
                        content = window.ZenWriterEditor.getEditorValue() || '';
                    }
                    if (!content) {
                        const editor = elementManager.get('editor');
                        content = editor ? (editor.value || '') : '';
                    }
                    if (content && window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                        window.ZenWriterStorage.saveContent(content);
                    }
                }
            } catch (_) { }
        });

        // 定期的なバックアップ（オンライン時のみ）
        setInterval(function () {
            if (!isOnline) return;
            try {
                var G = window.ZWContentGuard;
                var content = G ? G.getEditorContent() : '';
                if (!content) {
                    const editor = elementManager.get('editor');
                    content = editor ? (editor.value || '') : '';
                }
                // chapterMode: アクティブ章をフラッシュしてから全文をスナップショット
                if (G) G.flushChapterIfNeeded();
                var _Store3 = window.ZWChapterStore;
                var _S3 = window.ZenWriterStorage;
                var _raw3 = _S3 && typeof _S3.getCurrentDocId === 'function' ? _S3.getCurrentDocId() : null;
                var _dId3 =
                    _raw3 && _Store3 && typeof _Store3.resolveParentDocumentId === 'function'
                        ? _Store3.resolveParentDocumentId(_raw3)
                        : _raw3;
                if (_dId3 && _Store3 && _Store3.isChapterMode(_dId3)) {
                    content = _Store3.assembleFullText(_dId3);
                }
                if (content && window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
                    window.ZenWriterStorage.addSnapshot(content, 10); // 最大10件
                }
            } catch (_) { }
        }, 5 * 60 * 1000); // 5分ごと

        // ===== 埋め込み/外部制御用 安定APIブリッジ =====
        if (!window.ZenWriterAPI) {
            window.ZenWriterAPI = {
                /** 現在の本文を取得 */
                getContent() {
                    const el = elementManager.get('editor');
                    return el ? String(el.value || '') : '';
                },
                /** 本文を設定（保存とUI更新も実施） */
                setContent(text) {
                    if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function') {
                        window.ZenWriterEditor.setContent(String(text || ''));
                        return true;
                    }
                    const el = elementManager.get('editor');
                    if (el) {
                        el.value = String(text || '');
                        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                            window.ZenWriterStorage.saveContent(el.value);
                        }
                        return true;
                    }
                    return false;
                },
                /** エディタにフォーカスを移動 */
                focus() {
                    const el = elementManager.get('editor');
                    if (el) { el.focus(); return true; }
                    return false;
                },
                /** 現在の本文でスナップショットを追加 */
                takeSnapshot() {
                    const el = elementManager.get('editor');
                    const content = el ? (el.value || '') : '';
                    if (window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
                        window.ZenWriterStorage.addSnapshot(content);
                        return true;
                    }
                    return false;
                }
            };
        }

        // ===== タブ管理API（リスト化・外部制御用） =====
        const tabManager = {
            getAvailableTabs() {
                const conf = (window.sidebarManager && window.sidebarManager.sidebarTabConfig) ? window.sidebarManager.sidebarTabConfig : [];
                return conf.map(tab => ({
                    id: tab.id,
                    label: tab.label,
                    icon: tab.icon,
                    description: tab.description,
                    isActive: document.querySelector(`.sidebar-tab[data-group="${tab.id}"]`)?.classList.contains('active') || false
                }));
            },
            getActiveTab() {
                const activeTab = document.querySelector('.sidebar-tab.active');
                if (!activeTab) return null;
                const groupId = activeTab.dataset.group;
                const conf = (window.sidebarManager && window.sidebarManager.sidebarTabConfig) ? window.sidebarManager.sidebarTabConfig : [];
                return conf.find(tab => tab.id === groupId) || null;
            },
            activateTab(tabId) {
                activateSidebarGroup(tabId);
            },
            nextTab() {
                const current = this.getActiveTab();
                if (!current) return;
                const conf = (window.sidebarManager && window.sidebarManager.sidebarTabConfig) ? window.sidebarManager.sidebarTabConfig : [];
                const currentIndex = conf.findIndex(tab => tab.id === current.id);
                const nextIndex = (currentIndex + 1) % conf.length;
                this.activateTab(conf[nextIndex].id);
            },
            prevTab() {
                const current = this.getActiveTab();
                if (!current) return;
                const conf = (window.sidebarManager && window.sidebarManager.sidebarTabConfig) ? window.sidebarManager.sidebarTabConfig : [];
                const currentIndex = conf.findIndex(tab => tab.id === current.id);
                const prevIndex = currentIndex === 0 ? conf.length - 1 : currentIndex - 1;
                this.activateTab(conf[prevIndex].id);
            }
        };
        window.ZenWriterTabs = tabManager;

        // 背景ビジュアルのスクロール連動
        let scrollY = 0;
        function updateBackgroundScroll() {
            const newScrollY = window.scrollY || window.pageYOffset || 0;
            if (Math.abs(newScrollY - scrollY) > 1) {
                scrollY = newScrollY;
                document.documentElement.style.setProperty('--scroll-y', scrollY + 'px');
            }
            requestAnimationFrame(updateBackgroundScroll);
        }
        updateBackgroundScroll();

        // 未保存変更の警告
        // Electron ではダイアログ未対応のため preventDefault すると終了が hang する。autoSave に任せる。
        window.addEventListener('beforeunload', (e) => {
            try {
                if (window.electronAPI) return;
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.isDirty === 'function' && window.ZenWriterEditor.isDirty()) {
                    e.preventDefault();
                    e.returnValue = '';
                }
            } catch (_) { }
        });

        return { _triggerAutoSave };
    }

    window.initAppAutosaveApi = initAppAutosaveApi;
})();
