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
                const editor = elementManager.get('editor');
                if (editor && window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                    try {
                        window.ZenWriterStorage.saveContent(editor.value || '');
                        // HUDに保存通知
                        if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
                            window.ZenWriterHUD.show('自動保存されました', 1500, { bg: '#28a745', fg: '#fff' });
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
                        window.ZenWriterHUD.show('オフラインになりました。変更はローカルに保存されます。', 3000, { bg: '#ffc107', fg: '#000' });
                    }
                } else {
                    if (window.ZenWriterHUD && typeof window.ZenWriterHUD.show === 'function') {
                        window.ZenWriterHUD.show('オンラインに戻りました。', 2000, { bg: '#28a745', fg: '#fff' });
                    }
                }
            }
        }
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // 自動バックアップ強化: ページを離れる前に保存
        window.addEventListener('beforeunload', function (_e) {
            const editor = elementManager.get('editor');
            try {
                if (editor && window.ZenWriterStorage && typeof window.ZenWriterStorage.saveContent === 'function') {
                    window.ZenWriterStorage.saveContent(editor.value || '');
                }
            } catch (_) { }
            // メッセージは表示しない（ブラウザがデフォルト表示）
        });

        // 定期的なバックアップ（オンライン時のみ）
        setInterval(function () {
            if (!isOnline) return;
            const editor = elementManager.get('editor');
            try {
                if (editor && window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') {
                    window.ZenWriterStorage.addSnapshot(editor.value || '', 10); // 最大10件
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
        window.addEventListener('beforeunload', (e) => {
            try {
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
