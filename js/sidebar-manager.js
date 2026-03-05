/**
 * SidebarManager: サイドバーとツールバーの管理
 *
 * 責務:
 * - サイドバーの開閉制御（forceSidebarState, toggleSidebar）
 * - ツールバーの表示/非表示制御（setToolbarVisibility, toggleToolbar）
 * - アコーディオンカテゴリの管理（bootstrapAccordion）
 * - サイドバーグループの切り替え（activateSidebarGroup）
 *
 * ZWGadgets との連携:
 * - bootstrapAccordion でパネル作成時に ZWGadgets.init を呼び出し
 * - ガジェットのレンダリング・設定管理は ZWGadgets が担当
 */
class SidebarManager {
    // 定数定義

    constructor(elementManager) {
        this.elementManager = elementManager;
        // アコーディオンカテゴリ設定の統一管理
        this.accordionCategories = [
            {
                id: 'structure',
                label: '構造',
                icon: 'file-text',
                description: 'ドキュメント構造・アウトライン',
                panelId: 'structure-gadgets-panel',
                defaultExpanded: true
            },
            {
                id: 'edit',
                label: '編集',
                icon: 'edit',
                description: '編集支援ツール',
                panelId: 'edit-gadgets-panel',
                defaultExpanded: false
            },
            {
                id: 'theme',
                label: 'テーマ',
                icon: 'palette',
                description: '見た目のカスタマイズ',
                panelId: 'theme-gadgets-panel',
                defaultExpanded: false
            },
            {
                id: 'assist',
                label: '補助',
                icon: 'zap',
                description: '執筆支援ツール',
                panelId: 'assist-gadgets-panel',
                defaultExpanded: false
            },
            {
                id: 'advanced',
                label: '詳細設定',
                icon: 'settings',
                description: '高度な設定と管理',
                panelId: 'advanced-gadgets-panel',
                defaultExpanded: false
            }
        ];
        // 旧タブ設定（互換性のため）
        this.sidebarTabConfig = this.accordionCategories;
    }

    bootstrapTabs() {
        // アコーディオンモードにリダイレクト
        return this.bootstrapAccordion();
    }

    bootstrapAccordion() {
        try {
            // localStorageから展開状態を読み込み
            const savedState = this._loadAccordionState();

            // 各カテゴリのアコーディオンヘッダーにイベントリスナーを設定
            this.accordionCategories.forEach(category => {
                const header = document.querySelector(
                    `.accordion-header[aria-controls="accordion-${category.id}"]`
                );
                const content = document.getElementById(`accordion-${category.id}`);

                if (!header || !content) return;

                // 保存された状態または初期状態を適用
                const isExpanded = savedState[category.id] !== undefined
                    ? savedState[category.id]
                    : category.defaultExpanded;

                this._setAccordionState(category.id, isExpanded);

                // クリックイベント
                header.addEventListener('click', () => {
                    const currentState = header.getAttribute('aria-expanded') === 'true';
                    this._toggleAccordion(category.id, !currentState);
                });

                // キーボードイベント（Enter/Space）
                header.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const currentState = header.getAttribute('aria-expanded') === 'true';
                        this._toggleAccordion(category.id, !currentState);
                    }
                });

                // ガジェット初期化
                const panel = document.getElementById(category.panelId);
                if (this._isDevMode()) {
                    console.log(`[Accordion] カテゴリ ${category.id} の初期化:`, {
                        panelId: category.panelId,
                        panelFound: !!panel,
                        ZWGadgetsAvailable: !!(window.ZWGadgets && window.ZWGadgets.init),
                        isExpanded: isExpanded
                    });
                }
                if (panel && window.ZWGadgets && typeof window.ZWGadgets.init === 'function') {
                    try {
                        window.ZWGadgets.init(`#${category.panelId}`, { group: category.id });
                        if (this._isDevMode()) {
                            console.log(`[Accordion] ガジェット初期化成功: ${category.id}`);
                        }
                    } catch (e) {
                        console.error(`ガジェット初期化失敗: ${category.id}`, e);
                    }
                } else {
                    if (!panel) console.warn(`[Accordion] パネルが見つかりません: ${category.panelId}`);
                    if (!window.ZWGadgets) console.warn(`[Accordion] ZWGadgetsが利用できません`);
                }
            });

            // Lucideアイコンの初期化
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }

            try {
                if (this.elementManager && typeof this.elementManager.initialize === 'function') {
                    this.elementManager.initialize();
                }
            } catch (_) { }
        } catch (e) {
            console.error('アコーディオン初期化エラー:', e);
        }
    }

    _toggleAccordion(categoryId, expand) {
        if (this._isDevMode()) {
            console.log(`[Accordion] トグル: ${categoryId} → ${expand ? '展開' : '折りたたみ'}`);
        }
        this._setAccordionState(categoryId, expand);
        this._saveAccordionState();

        // カテゴリ展開時にガジェットを再レンダリング
        if (expand && window.ZWGadgets && typeof window.ZWGadgets._renderGroup === 'function') {
            try {
                window.ZWGadgets._renderGroup(categoryId);
                if (this._isDevMode()) {
                    console.log(`[Accordion] ガジェット再レンダリング成功: ${categoryId}`);
                }
            } catch (e) {
                console.error(`ガジェット再レンダリング失敗: ${categoryId}`, e);
            }
        }
    }

    _setAccordionState(categoryId, expand) {
        const header = document.querySelector(
            `.accordion-header[aria-controls="accordion-${categoryId}"]`
        );
        const content = document.getElementById(`accordion-${categoryId}`);

        if (!header || !content) return;

        header.setAttribute('aria-expanded', expand ? 'true' : 'false');
        content.setAttribute('aria-hidden', expand ? 'false' : 'true');
        content.style.display = expand ? 'block' : 'none';
    }

    _loadAccordionState() {
        try {
            const s = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
                ? window.ZenWriterStorage.loadSettings()
                : null;
            return (s && s.ui && s.ui.accordionState) || {};
        } catch (e) {
            return {};
        }
    }

    _saveAccordionState() {
        try {
            const state = {};
            this.accordionCategories.forEach(category => {
                const header = document.querySelector(
                    `.accordion-header[aria-controls="accordion-${category.id}"]`
                );
                if (header) {
                    state[category.id] = header.getAttribute('aria-expanded') === 'true';
                }
            });

            const s = window.ZenWriterStorage.loadSettings();
            if (!s.ui) s.ui = {};
            s.ui.accordionState = state;
            window.ZenWriterStorage.saveSettings(s);
        } catch (e) {
            console.error('アコーディオン状態保存エラー:', e);
        }
    }


    /**
     * 開発環境かどうかを判定
     * @returns {boolean} 開発環境の場合はtrue
     */
    _isDevMode() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
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

        // サイドバーオーバーレイの表示制御（モバイル用）
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (sidebarOverlay) {
            if (open) {
                sidebarOverlay.setAttribute('aria-hidden', 'false');
            } else {
                sidebarOverlay.setAttribute('aria-hidden', 'true');
            }
        }

        // ハンバーガーメニューボタンのaria-expanded属性を更新
        const toggleBtn = document.getElementById('toggle-sidebar');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
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

    _ensureSidebarPanel(groupId, label, panelId) {
        try {
            const groupsContainer = document.querySelector('.sidebar-groups');
            if (!groupsContainer || !groupId) return null;

            const safeId = String(groupId);
            const safeLabel = String(label || safeId);

            const expectedSectionId = 'sidebar-group-' + safeId;
            const expectedPanelId = String(panelId || (safeId + '-gadgets-panel'));
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
                    panel.id = expectedPanelId;
                    panel.className = 'gadgets-panel';
                    panel.dataset.gadgetGroup = safeId;
                    panel.setAttribute('aria-label', safeLabel + 'ガジェット');
                    wrapper.appendChild(panel);
                } else {
                    try {
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
                panel.id = expectedPanelId;
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

    /**
     * @deprecated アコーディオンシステムでは動的タブ追加は非対応。このメソッドは互換性のために残されていますが、機能しません。
     */
    addTab(id, label, options) {
        console.warn('addTab() is deprecated and does not work with the accordion system. Dynamic tab creation is no longer supported.');
        try {
            var safeId = String(id || ('custom-' + Date.now()));
            var safeLabel = String(label || safeId);
            var opts = (options && typeof options === 'object') ? options : {};
            var persist = opts.persist !== false;
            var panelId = String(opts.panelId || (safeId + '-gadgets-panel'));
            try {
                if (window.ZWGadgetsUtils && typeof window.ZWGadgetsUtils.registerGroup === 'function') {
                    safeId = window.ZWGadgetsUtils.registerGroup(safeId, safeLabel) || safeId;
                }
            } catch (_) { }
            panelId = String(opts.panelId || (safeId + '-gadgets-panel'));
            if (!this.sidebarTabConfig.find(function (t) { return t.id === safeId; })) {
                this.sidebarTabConfig.push({ id: safeId, label: safeLabel, description: '', panelId: panelId });
            }

            var created = this._ensureSidebarPanel(safeId, safeLabel, panelId);
            var panel = created && created.panel;

            var tabsContainer = document.querySelector('.sidebar-tabs');
            if (tabsContainer && !document.querySelector('.sidebar-tab[data-group="' + safeId + '"]')) {
                var btn = document.createElement('button');
                btn.className = 'sidebar-tab';
                btn.type = 'button';
                btn.dataset.group = safeId;
                btn.id = 'sidebar-tab-' + safeId;
                btn.setAttribute('aria-controls', 'sidebar-group-' + safeId);
                btn.setAttribute('aria-selected', 'false');
                btn.setAttribute('role', 'tab');
                btn.textContent = safeLabel;
                btn.addEventListener('click', () => this.activateSidebarGroup(safeId));
                // キーボード操作対応（Enter/Space）
                btn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.activateSidebarGroup(safeId);
                    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        // 矢印キーでタブを切り替え
                        e.preventDefault();
                        const tabs = Array.from(document.querySelectorAll('.sidebar-tab'));
                        const currentIndex = tabs.indexOf(btn);
                        let nextIndex;
                        if (e.key === 'ArrowRight') {
                            nextIndex = (currentIndex + 1) % tabs.length;
                        } else {
                            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                        }
                        tabs[nextIndex].focus();
                        this.activateSidebarGroup(tabs[nextIndex].dataset.group);
                    }
                });
                tabsContainer.appendChild(btn);
                // D&Dを再初期化（新タブ追加後）
                try { this._setupTabDragAndDrop(); } catch (_) { }
            }

            if (panel) {
                try { if (window.ZWGadgets && typeof window.ZWGadgets.init === 'function') window.ZWGadgets.init('#' + panel.id, { group: safeId }); } catch (_) { }
            }
            try {
                if (window.elementManager && typeof window.elementManager.initialize === 'function') window.elementManager.initialize();
            } catch (_) { }
            if (persist) {
                try {
                    var s = window.ZenWriterStorage.loadSettings();
                    s.ui = s.ui || {};
                    var list = Array.isArray(s.ui.customTabs) ? s.ui.customTabs : [];
                    if (!list.some(function (t) { return t && String(t.id || '').trim().toLowerCase() === String(safeId || '').trim().toLowerCase(); })) {
                        list.push({ id: safeId, label: safeLabel });
                    }
                    s.ui.customTabs = list;
                    window.ZenWriterStorage.saveSettings(s);
                } catch (_) { }
            }
            return safeId;
        } catch (_) { return null; }
    }

    /**
     * @deprecated アコーディオンシステムでは動的タブ削除は非対応。このメソッドは互換性のために残されていますが、機能しません。
     */
    removeTab(id) {
        console.warn('removeTab() is deprecated and does not work with the accordion system. Dynamic tab removal is no longer supported.');
        try {
            var rawId = String(id || '').trim();
            var nid = rawId.toLowerCase();
            var idx = this.sidebarTabConfig.findIndex(function (t) { return t && String(t.id || '').trim() === rawId; });
            if (idx < 0) idx = this.sidebarTabConfig.findIndex(function (t) { return t && String(t.id || '').trim().toLowerCase() === nid; });
            if (idx >= 0) this.sidebarTabConfig.splice(idx, 1);
            var btn = document.querySelector('.sidebar-tab[data-group="' + rawId + '"]') || document.querySelector('.sidebar-tab[data-group="' + nid + '"]');
            if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
            var grp = document.getElementById('sidebar-group-' + rawId) || document.getElementById('sidebar-group-' + nid);
            if (grp && grp.parentNode) grp.parentNode.removeChild(grp);
            try {
                var s = window.ZenWriterStorage.loadSettings();
                s.ui = s.ui || {};
                s.ui.customTabs = (Array.isArray(s.ui.customTabs) ? s.ui.customTabs : []).filter(function (t) {
                    var tid = t && String(t.id || '').trim();
                    if (!tid) return false;
                    return tid !== rawId && tid.toLowerCase() !== nid;
                });
                window.ZenWriterStorage.saveSettings(s);
            } catch (_) { }
            var fallback = (this.sidebarTabConfig[0] && this.sidebarTabConfig[0].id) || 'structure';
            this.activateSidebarGroup(fallback);
        } catch (_) { }
    }

    /**
     * @deprecated アコーディオンシステムでは動的タブ名変更は非対応。このメソッドは互換性のために残されていますが、機能しません。
     */
    renameTab(id, newLabel) {
        console.warn('renameTab() is deprecated and does not work with the accordion system. Dynamic tab renaming is no longer supported.');
        try {
            var rawId = String(id || '').trim();
            var nid = rawId.toLowerCase();
            var label = String(newLabel || '');
            if (!label) return;
            var conf = this.sidebarTabConfig.find(function (t) { return t && String(t.id || '').trim() === rawId; });
            if (!conf) conf = this.sidebarTabConfig.find(function (t) { return t && String(t.id || '').trim().toLowerCase() === nid; });
            if (conf) conf.label = label;
            var btn = document.querySelector('.sidebar-tab[data-group="' + rawId + '"]') || document.querySelector('.sidebar-tab[data-group="' + nid + '"]');
            if (btn) btn.textContent = label;
            try {
                var s = window.ZenWriterStorage.loadSettings();
                s.ui = s.ui || {};
                var list = Array.isArray(s.ui.customTabs) ? s.ui.customTabs : [];
                for (var i = 0; i < list.length; i++) {
                    var tid = list[i] && String(list[i].id || '').trim();
                    if (tid && (tid === rawId || tid.toLowerCase() === nid)) {
                        list[i].id = nid;
                        list[i].label = label;
                        break;
                    }
                }
                s.ui.customTabs = list;
                window.ZenWriterStorage.saveSettings(s);
            } catch (_) { }
        } catch (_) { }
    }

    /**
     * @deprecated アコーディオンシステムではタブ順序管理は非対応。固定のカテゴリ順序を使用します。
     * @returns {string[]} 固定のアコーディオンカテゴリ順序
     */
    getTabOrder() {
        console.warn('getTabOrder() is deprecated. The accordion system uses a fixed category order.');
        // アコーディオンカテゴリの固定順序を返す
        return this.accordionCategories.map(function(cat) { return cat.id; });
    }

    /**
     * @deprecated アコーディオンシステムではタブ順序変更は非対応。
     */
    saveTabOrder(order) {
        console.warn('saveTabOrder() is deprecated and does not work with the accordion system. Tab order is fixed.');
    }

    applyTabsPresentationUI(options) {
        try {
            const opts = (options && typeof options === 'object') ? options : {};
            const _skipActivate = opts.skipActivate === true;
            const sb = document.getElementById('sidebar');
            if (!sb) return;
            const mode = sb.getAttribute('data-tabs-presentation') || 'tabs';
            const tabsBar = document.querySelector('.sidebar-tabs');
            const top = document.querySelector('.sidebar-top');
            const ddId = 'tabs-dropdown-select';
            let dd = document.getElementById(ddId);

            // デフォルト状態にリセット（dropdown以外ならdropdownを削除、tabsBarを表示）
            if (mode !== 'dropdown' && dd && dd.parentNode) {
                dd.parentNode.removeChild(dd);
                dd = null;
            }
            if (tabsBar) tabsBar.style.display = (mode === 'dropdown' || mode === 'accordion') ? 'none' : '';

            // Dropdown モード処理
            if (mode === 'dropdown') {
                if (!dd) {
                    dd = document.createElement('select');
                    dd.id = ddId;
                    dd.setAttribute('aria-label', 'サイドバータブ');
                    dd.className = 'sidebar-tab-dropdown';
                    dd.style.width = '100%';
                    dd.style.marginBottom = '1rem';
                    dd.addEventListener('change', () => this.activateSidebarGroup(dd.value));
                    if (top) top.insertBefore(dd, top.firstChild);
                }

                // オプションを常に再構築（タブの増減に対応）
                dd.innerHTML = '';
                const tabs = document.querySelectorAll('.sidebar-tab');
                tabs.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.getAttribute('data-group');
                    opt.textContent = t.textContent || opt.value;
                    dd.appendChild(opt);
                });

                // 現在のアクティブグループを選択
                const activeTab = document.querySelector('.sidebar-tab.active');
                const gid = activeTab ? activeTab.getAttribute('data-group') : 'structure';
                dd.value = gid;
            }

            // Accordion モード処理
            if (mode === 'accordion') {
                // 全グループを展開表示
                document.querySelectorAll('.sidebar-group').forEach(sec => {
                    sec.classList.add('active');
                    sec.setAttribute('aria-hidden', 'false');
                    sec.style.display = 'block';
                });
            } else {
                // 通常（Tabs）または Dropdown モード（選択されたものだけ表示）
                const activeTab = document.querySelector('.sidebar-tab.active');
                const gid = activeTab ? activeTab.getAttribute('data-group') : 'structure';

                // 表示状態のリセットと更新
                document.querySelectorAll('.sidebar-group').forEach(sec => {
                    const isActive = sec.getAttribute('data-group') === gid;
                    sec.classList.toggle('active', isActive);
                    sec.setAttribute('aria-hidden', isActive ? 'false' : 'true');
                    sec.style.display = ''; // styleリセット
                });
            }
        } catch (e) {
            console.error('applyTabsPresentationUI error:', e);
        }
    }

    formatTs(ts) {
        const d = new Date(ts);
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
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
            if (isActive) {
                // アクティブなタブにフォーカスを移動（キーボード操作時のみ）
                const isKeyboardUser = document.body.classList.contains('keyboard-user');
                if (isKeyboardUser) {
                    tab.focus();
                }
            }
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
