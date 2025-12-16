/**
 * SidebarManager: サイドバーとツールバーの管理
 *
 * 責務（フェーズC-2で明確化）:
 * - サイドバーの開閉制御（forceSidebarState, toggleSidebar）
 * - ツールバーの表示/非表示制御（setToolbarVisibility, toggleToolbar）
 * - タブの追加/削除/名前変更（addTab, removeTab, renameTab）
 * - サイドバーグループの切り替え（activateSidebarGroup）
 *
 * ZWGadgets との連携:
 * - addTab でパネル作成時に ZWGadgets.init を呼び出し
 * - ガジェットのレンダリング・設定管理は ZWGadgets が担当
 */
class SidebarManager {
    // 定数定義

    constructor(elementManager) {
        this.elementManager = elementManager;
        // サイドバータブ設定の統一管理
        this.sidebarTabConfig = [
            {
                id: 'structure',
                label: '構造',
                description: 'ドキュメント構造・ガジェット管理',
                panelId: 'structure-gadgets-panel'
            },
            {
                id: 'typography',
                label: 'テーマ・フォント',
                description: 'タイポグラフィ設定',
                panelId: 'typography-gadgets-panel'
            },
            {
                id: 'wiki',
                label: 'Wiki',
                description: '物語Wiki',
                panelId: 'wiki-gadgets-panel'
            },
            {
                id: 'assist',
                label: 'アシスト',
                description: '支援ツール',
                panelId: 'assist-gadgets-panel'
            }
        ];
    }

    bootstrapTabs() {
        try {
            const tabsContainer = document.querySelector('.sidebar-tabs');
            if (!tabsContainer) return;

            tabsContainer.innerHTML = '';

            try {
                const dd = document.getElementById('tabs-dropdown-select');
                if (dd && dd.parentNode) dd.parentNode.removeChild(dd);
            } catch (_) { }

            this.sidebarTabConfig.forEach(tab => {
                try {
                    this.addTab(tab.id, tab.label, { persist: false });
                } catch (_) { }
            });

            try {
                const s = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
                    ? window.ZenWriterStorage.loadSettings()
                    : null;
                const list = (s && s.ui && Array.isArray(s.ui.customTabs)) ? s.ui.customTabs : [];
                list.forEach(t => {
                    if (!t || !t.id) return;
                    this.addTab(t.id, t.label, { persist: false });
                });
            } catch (_) { }

            const firstId = (this.sidebarTabConfig[0] && this.sidebarTabConfig[0].id) ? this.sidebarTabConfig[0].id : 'structure';
            this.activateSidebarGroup(firstId);

            try {
                if (this.elementManager && typeof this.elementManager.initialize === 'function') {
                    this.elementManager.initialize();
                }
            } catch (_) { }
        } catch (_) { }
    }

    /**
     * 開発環境かどうかを判定
     * @returns {boolean} 開発環境の場合はtrue
     */
    _isDevMode() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }

    forceSidebarState(open, callback) {
        const sidebar = this.elementManager.get('sidebar');
        if (!sidebar) {
            console.error('サイドバー要素が見つかりません');
            return;
        }
        
        if (this._isDevMode()) {
            console.info(`forceSidebarState(${open}) 実行開始`);
            console.info(`現在の状態: open=${sidebar.classList.contains('open')}, aria-hidden=${sidebar.getAttribute('aria-hidden')}`);
        }
        
        // 閉じる場合、サイドバー内のフォーカスを外部に移動してからaria-hiddenを設定
        if (!open) {
            const activeElement = document.activeElement;
            // サイドバー内にフォーカスがある場合、エディタに移動
            if (sidebar.contains(activeElement)) {
                const editor = this.elementManager.get('editor');
                if (editor) {
                    // フォーカスを移動
                    editor.focus();
                    if (this._isDevMode()) console.info('サイドバー閉鎖のため、フォーカスをエディタに移動');
                } else {
                    // エディタがない場合はbodyにフォーカス
                    document.body.focus();
                    if (this._isDevMode()) console.info('サイドバー閉鎖のため、フォーカスをbodyに移動');
                }
            }
        }
        
        // アニメーション完了を待つためのPromise
        const waitForTransition = () => {
            return new Promise((resolve) => {
                const onTransitionEnd = (e) => {
                    if (e.propertyName === 'left') {
                        sidebar.removeEventListener('transitionend', onTransitionEnd);
                        resolve();
                    }
                };
                sidebar.addEventListener('transitionend', onTransitionEnd);
                // タイムアウトでフォールバック（transitionが発火しない場合）
                setTimeout(resolve, SidebarManager.TRANSITION_TIMEOUT_MS);
            });
        };
        
        // CSSクラスの更新
        if (open) {
            sidebar.classList.add('open');
            document.documentElement.setAttribute('data-sidebar-open', 'true');
            if (this._isDevMode()) console.info('サイドバーに .open クラスを追加');
        } else {
            sidebar.classList.remove('open');
            document.documentElement.removeAttribute('data-sidebar-open');
            if (this._isDevMode()) console.info('サイドバーから .open クラスを削除');
        }
        
        // ツールバー側の閉じるボタンの表示制御
        // const toolbarCloseSidebar = this.elementManager.get('toolbarCloseSidebar');
        // if (toolbarCloseSidebar) {
        //     toolbarCloseSidebar.style.display = ''; // 常に表示
        //     console.info('ツールバーの閉じるボタン: 表示');
        // }
        
        // transition完了を待ってからaria-hiddenを設定
        waitForTransition().then(() => {
            sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (this._isDevMode()) {
                console.info(`サイドバー aria-hidden="${open ? 'false' : 'true'}" を設定`);
                console.info(`最終状態: open=${sidebar.classList.contains('open')}, left=${getComputedStyle(sidebar).left}`);
            }
            if (callback) callback();
        });
    }

    toggleSidebar() {
        const sidebar = this.elementManager.get('sidebar');
        if (!sidebar) return;
        const willOpen = !sidebar.classList.contains('open');
        if (this._isDevMode()) {
            console.info(`サイドバーを${willOpen ? '開く' : '閉じる'}`);
        }
        this.forceSidebarState(willOpen);
    }

    setToolbarVisibility(show) {
        const toolbar = this.elementManager.get('toolbar');
        const showToolbarBtn = this.elementManager.get('showToolbarBtn');
        if (!toolbar) return;
        // インライン style ではなく、ルート属性 + クラスで一元制御
        // これにより computedStyle の不整合や一時的な二重描画を回避
        if (showToolbarBtn) showToolbarBtn.style.display = show ? 'none' : 'inline-flex';
        document.body.classList.toggle('toolbar-hidden', !show);
        if (!show) {
            document.documentElement.setAttribute('data-toolbar-hidden', 'true');
        } else {
            document.documentElement.removeAttribute('data-toolbar-hidden');
        }
    }

    toggleToolbar() {
        // ルート属性（early-boot と setToolbarVisibility が管理）に基づき判定
        const rootHidden = document.documentElement.getAttribute('data-toolbar-hidden') === 'true';
        const willShow = !!rootHidden;
        this.setToolbarVisibility(willShow);
        // 状態保存
        const s = window.ZenWriterStorage.loadSettings();
        s.toolbarVisible = willShow;
        window.ZenWriterStorage.saveSettings(s);
        // ツールバーを表示にしたらHUDを隠す
        if (willShow && window.ZenWriterHUD && typeof window.ZenWriterHUD.hide === 'function') {
            window.ZenWriterHUD.hide();
        }
    }

    _ensureSidebarPanel(groupId, label) {
        try {
            const groupsContainer = document.querySelector('.sidebar-groups');
            if (!groupsContainer || !groupId) return null;

            const safeId = String(groupId);
            const safeLabel = String(label || safeId);

            const expectedSectionId = 'sidebar-group-' + safeId;
            let section = document.getElementById(expectedSectionId);
            if (!section) {
                section = groupsContainer.querySelector('.sidebar-group[data-group="' + safeId + '"], [data-group="' + safeId + '"]');
            }
            let panel = null;

            if (section) {
                try {
                    section.classList.add('sidebar-group');
                    section.dataset.group = safeId;
                    if (!section.id || (section.id !== expectedSectionId && !document.getElementById(expectedSectionId))) {
                        section.id = expectedSectionId;
                    }
                    section.setAttribute('role', 'tabpanel');
                    section.setAttribute('aria-labelledby', 'sidebar-tab-' + safeId);
                    const isActive = section.classList.contains('active');
                    section.setAttribute('aria-hidden', isActive ? 'false' : 'true');
                } catch (_) { }

                panel = section.querySelector('.gadgets-panel');
                if (!panel) {
                    const wrapper = section.querySelector('.sidebar-section') || section;
                    panel = document.createElement('div');
                    panel.id = safeId + '-gadgets-panel';
                    panel.className = 'gadgets-panel';
                    panel.dataset.gadgetGroup = safeId;
                    panel.setAttribute('aria-label', safeLabel + 'ガジェット');
                    wrapper.appendChild(panel);
                } else {
                    try {
                        const expectedPanelId = safeId + '-gadgets-panel';
                        panel.classList.add('gadgets-panel');
                        panel.dataset.gadgetGroup = safeId;
                        if (!panel.id || (panel.id !== expectedPanelId && !document.getElementById(expectedPanelId))) {
                            panel.id = expectedPanelId;
                        }
                        panel.setAttribute('aria-label', safeLabel + 'ガジェット');
                    } catch (_) { }
                }
            } else {
                section = document.createElement('section');
                section.className = 'sidebar-group';
                section.dataset.group = safeId;
                section.id = expectedSectionId;
                section.setAttribute('role', 'tabpanel');
                section.setAttribute('aria-labelledby', 'sidebar-tab-' + safeId);
                section.setAttribute('aria-hidden', 'true');

                const wrapper = document.createElement('div');
                wrapper.className = 'sidebar-section';

                panel = document.createElement('div');
                panel.id = safeId + '-gadgets-panel';
                panel.className = 'gadgets-panel';
                panel.dataset.gadgetGroup = safeId;
                panel.setAttribute('aria-label', safeLabel + 'ガジェット');

                wrapper.appendChild(panel);
                section.appendChild(wrapper);
                groupsContainer.appendChild(section);
            }

            return { section, panel };
        } catch (_) {
            return null;
        }
    }

    addTab(id, label, options) {
        try {
            var safeId = String(id || ('custom-' + Date.now()));
            var safeLabel = String(label || safeId);
            var opts = (options && typeof options === 'object') ? options : {};
            var persist = opts.persist !== false;
            try {
                if (window.ZWGadgetsUtils && typeof window.ZWGadgetsUtils.registerGroup === 'function') {
                    safeId = window.ZWGadgetsUtils.registerGroup(safeId, safeLabel) || safeId;
                }
            } catch (_) { }
            if (!this.sidebarTabConfig.find(function(t){ return t.id === safeId; })) {
                this.sidebarTabConfig.push({ id: safeId, label: safeLabel, description: '', panelId: safeId + '-gadgets-panel' });
            }

            var created = this._ensureSidebarPanel(safeId, safeLabel);
            var panel = created && created.panel;

            var tabsContainer = document.querySelector('.sidebar-tabs');
            if (tabsContainer && !document.querySelector('.sidebar-tab[data-group="' + safeId + '"]')){
                var btn = document.createElement('button');
                btn.className = 'sidebar-tab';
                btn.type = 'button';
                btn.dataset.group = safeId;
                btn.id = 'sidebar-tab-' + safeId;
                btn.setAttribute('aria-controls', 'sidebar-group-' + safeId);
                btn.setAttribute('aria-selected', 'false');
                btn.textContent = safeLabel;
                btn.addEventListener('click', () => this.activateSidebarGroup(safeId));
                tabsContainer.appendChild(btn);
            }

            if (panel) {
                try { if (window.ZWGadgets && typeof window.ZWGadgets.init==='function') window.ZWGadgets.init('#' + panel.id, { group: safeId }); } catch(_) {}
            }
            try {
                if (window.elementManager && typeof window.elementManager.initialize==='function') window.elementManager.initialize();
            } catch(_) {}
            if (persist) {
                try {
                    var s = window.ZenWriterStorage.loadSettings();
                    s.ui = s.ui || {};
                    var list = Array.isArray(s.ui.customTabs) ? s.ui.customTabs : [];
                    if (!list.some(function(t){ return t && String(t.id || '').trim().toLowerCase() === String(safeId || '').trim().toLowerCase(); })) {
                        list.push({ id: safeId, label: safeLabel });
                    }
                    s.ui.customTabs = list;
                    window.ZenWriterStorage.saveSettings(s);
                } catch(_) {}
            }
            return safeId;
        } catch(_) { return null; }
    }

    removeTab(id) {
        try {
            var rawId = String(id || '').trim();
            var nid = rawId.toLowerCase();
            var idx = this.sidebarTabConfig.findIndex(function(t){ return t && String(t.id || '').trim() === rawId; });
            if (idx < 0) idx = this.sidebarTabConfig.findIndex(function(t){ return t && String(t.id || '').trim().toLowerCase() === nid; });
            if (idx >= 0) this.sidebarTabConfig.splice(idx, 1);
            var btn = document.querySelector('.sidebar-tab[data-group="' + rawId + '"]') || document.querySelector('.sidebar-tab[data-group="' + nid + '"]');
            if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
            var grp = document.getElementById('sidebar-group-' + rawId) || document.getElementById('sidebar-group-' + nid);
            if (grp && grp.parentNode) grp.parentNode.removeChild(grp);
            try {
                var s = window.ZenWriterStorage.loadSettings();
                s.ui = s.ui || {};
                s.ui.customTabs = (Array.isArray(s.ui.customTabs) ? s.ui.customTabs : []).filter(function(t){
                    var tid = t && String(t.id || '').trim();
                    if (!tid) return false;
                    return tid !== rawId && tid.toLowerCase() !== nid;
                });
                window.ZenWriterStorage.saveSettings(s);
            } catch(_) {}
            var fallback = (this.sidebarTabConfig[0] && this.sidebarTabConfig[0].id) || 'structure';
            this.activateSidebarGroup(fallback);
        } catch(_) {}
    }

    renameTab(id, newLabel) {
        try {
            var rawId = String(id || '').trim();
            var nid = rawId.toLowerCase();
            var label = String(newLabel || '');
            if (!label) return;
            var conf = this.sidebarTabConfig.find(function(t){ return t && String(t.id || '').trim() === rawId; });
            if (!conf) conf = this.sidebarTabConfig.find(function(t){ return t && String(t.id || '').trim().toLowerCase() === nid; });
            if (conf) conf.label = label;
            var btn = document.querySelector('.sidebar-tab[data-group="' + rawId + '"]') || document.querySelector('.sidebar-tab[data-group="' + nid + '"]');
            if (btn) btn.textContent = label;
            try {
                var s = window.ZenWriterStorage.loadSettings();
                s.ui = s.ui || {};
                var list = Array.isArray(s.ui.customTabs) ? s.ui.customTabs : [];
                for (var i=0;i<list.length;i++){
                    var tid = list[i] && String(list[i].id || '').trim();
                    if (tid && (tid === rawId || tid.toLowerCase() === nid)){
                        list[i].id = nid;
                        list[i].label = label;
                        break;
                    }
                }
                s.ui.customTabs = list;
                window.ZenWriterStorage.saveSettings(s);
            } catch(_) {}
        } catch(_) {}
    }

    applyTabsPresentationUI(options) {
        try {
            const opts = (options && typeof options === 'object') ? options : {};
            const skipActivate = opts.skipActivate === true;
            const sb = document.getElementById('sidebar');
            if (!sb) return;
            const mode = sb.getAttribute('data-tabs-presentation') || 'tabs';
            const tabsBar = document.querySelector('.sidebar-tabs');
            const top = document.querySelector('.sidebar-top');
            const ddId = 'tabs-dropdown-select';
            let dd = document.getElementById(ddId);

            // reset defaults
            if (tabsBar) tabsBar.style.display = '';
            if (mode !== 'dropdown' && dd && dd.parentNode) dd.parentNode.removeChild(dd);

            if (mode === 'dropdown'){
                if (tabsBar) tabsBar.style.display = 'none';
                if (!dd){
                    dd = document.createElement('select');
                    dd.id = ddId;
                    dd.setAttribute('aria-label','サイドバータブ');
                    const tabs = document.querySelectorAll('.sidebar-tab');
                    tabs.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.getAttribute('data-group');
                        opt.textContent = t.textContent || opt.value;
                        dd.appendChild(opt);
                    });
                    dd.addEventListener('change', () => this.activateSidebarGroup(dd.value));
                    if (top) top.insertBefore(dd, top.firstChild);
                }
                // set value to current active group
                const activeTab = document.querySelector('.sidebar-tab.active');
                const gid = activeTab ? activeTab.getAttribute('data-group') : 'structure';
                if (dd) dd.value = gid;
            }

            if (mode === 'accordion'){
                if (tabsBar) tabsBar.style.display = 'none';
                // 全グループを展開表示
                document.querySelectorAll('.sidebar-group').forEach(sec => {
                    sec.classList.add('active');
                    sec.setAttribute('aria-hidden','false');
                });
            } else {
                // デフォルト動作: active のみ表示
                const activeTab = document.querySelector('.sidebar-tab.active');
                const gid = activeTab ? activeTab.getAttribute('data-group') : 'structure';
                if (!skipActivate) {
                    this.activateSidebarGroup(gid, { skipPresentationUpdate: true });
                }
            }
        } catch(e) { void e; }
    }

    formatTs(ts) {
        const d = new Date(ts);
        const p = (n)=> String(n).padStart(2,'0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }

    activateSidebarGroup(groupId, options) {
        if (!groupId || !window.elementManager) {
            console.warn('activateSidebarGroup: groupId または elementManager が存在しません');
            return;
        }

        const opts = (options && typeof options === 'object') ? options : {};
        const skipPresentationUpdate = opts.skipPresentationUpdate === true;

        const tabConfig = this.sidebarTabConfig.find(tab => tab.id === groupId);
        if (!tabConfig) {
            const tabEl = document.querySelector(`.sidebar-tab[data-group="${groupId}"]`);
            const panelEl = document.querySelector(`.sidebar-group[data-group="${groupId}"]`);
            if (tabEl && panelEl) {
                this.sidebarTabConfig.push({ id: groupId, label: tabEl.textContent || groupId, description: '', panelId: panelEl.id || `${groupId}-gadgets-panel` });
            } else {
                console.warn(`Unknown sidebar group: ${groupId}`);
                return;
            }
        }

        // 現在のactive groupを取得
        const currentActiveTab = document.querySelector('.sidebar-tab.active');
        const currentGroupId = currentActiveTab ? currentActiveTab.dataset.group : null;
        if (currentGroupId === groupId) {
            // すでにactiveならスキップ（開発環境のみログ出力）
            if (this._isDevMode()) {
                console.info(`Tab "${groupId}" is already active`);
            }
            if (!skipPresentationUpdate) {
                this.applyTabsPresentationUI({ skipActivate: true });
            }
            return;
        }

        if (this._isDevMode()) {
            console.info(`Switching tab from "${currentGroupId}" to "${groupId}"`);
        }

        // タブのアクティブ状態を更新
        const sidebarTabs = document.querySelectorAll('.sidebar-tab');
        sidebarTabs.forEach(tab => {
            const isActive = tab.dataset.group === groupId;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // グループパネルの表示状態を更新
        const sidebarGroups = document.querySelectorAll('.sidebar-group');
        sidebarGroups.forEach(section => {
            const isActive = section.dataset.group === groupId;
            section.classList.toggle('active', isActive);
            section.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        // ZWGadgetsに通知（ガジェットの再レンダリングをトリガー）
        if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
            try {
                window.ZWGadgets.setActiveGroup(groupId);
                // setActiveGroup内でrequestAnimationFrameによる遅延レンダリングが行われるため、
                // ここでの_renderLast()直接呼び出しは不要（重複を避ける）
            } catch (e) {
                console.error('ZWGadgets.setActiveGroup でエラー:', e);
            }
        } else {
            console.warn('ZWGadgets が利用できません');
        }

        // プレゼンテーション方式に合わせてUI反映
        if (!skipPresentationUpdate) {
            this.applyTabsPresentationUI({ skipActivate: true });
        }
    }
}

SidebarManager.TRANSITION_TIMEOUT_MS = 350; // transition-duration + buffer

// グローバルに公開
window.SidebarManager = SidebarManager;
