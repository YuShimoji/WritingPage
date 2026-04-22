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

        function getCurrentChapterStoreDocId() {
            var Store = window.ZWChapterStore;
            var S = window.ZenWriterStorage;
            var rawId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
            var docs = S && typeof S.loadDocuments === 'function' ? (S.loadDocuments() || []) : null;
            return rawId && Store && typeof Store.resolveParentDocumentId === 'function'
                ? Store.resolveParentDocumentId(rawId, docs)
                : rawId;
        }

        // session 109: `_triggerAutoSave` はデッドコード (どこからも呼ばれていなかった) のため削除。
        // 保存神経系は `chapter-list.js flushActiveChapter` に一本化。HUD 通知はそこで `autoSave.enabled` ガード下に実行。

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
                    var _dId = getCurrentChapterStoreDocId();
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
                var _dId3 = getCurrentChapterStoreDocId();
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

        // session 109: _triggerAutoSave を削除したため、空オブジェクトを返す (呼び出し側の destructure は空のままで問題なし)
        return {};
    }

    window.initAppAutosaveApi = initAppAutosaveApi;
})();
