/**
 * SidebarManager: サイドバーとツールバーの管理
 *
 * 責務:
 * - サイドバーの開閉制御（forceSidebarState, toggleSidebar）
 * - 旧ツールバー API 互換（setToolbarVisibility はノーアップ、toggleToolbar はメインハブ）
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
        this._initializedAccordionGroups = new Set();
        this._pendingAccordionGroupInits = new Set();
        this._writingFocusInitialized = false;
        this._writingFocusRenderTimer = null;
        this._writingFocusObserver = null;
        this._writingFocusSettingsOpen = false;
        this._writingFocusAddBusy = false;
        this._toggleAccordionInProgress = false;
        this.leftNavState = 'root';
        this.activeCategoryId = 'sections';
        // アコーディオンカテゴリ設定の統一管理
        this.accordionCategories = [
            {
                id: 'sections',
                label: 'セクション',
                icon: 'list-tree',
                description: '見出しツリーと話ナビゲーション',
                panelId: 'sections-gadgets-panel',
                defaultExpanded: true
            },
            {
                id: 'structure',
                label: '構造',
                icon: 'file-text',
                description: '構成管理（ドキュメント・アウトライン・比較）',
                panelId: 'structure-gadgets-panel',
                defaultExpanded: false
            },
            {
                id: 'edit',
                label: '編集',
                icon: 'edit',
                description: '編集支援（装飾・プレビュー・画像）',
                panelId: 'edit-gadgets-panel',
                defaultExpanded: false
            },
            {
                id: 'theme',
                label: 'テーマ',
                icon: 'palette',
                description: '表示調整（テーマ・フォント・見出しスタイル）',
                panelId: 'theme-gadgets-panel',
                defaultExpanded: false
            },
            {
                id: 'assist',
                label: '補助',
                icon: 'zap',
                description: '補助。執筆の継続を支える進捗・集中・参照。',
                panelId: 'assist-gadgets-panel',
                defaultExpanded: false
            },
            {
                id: 'advanced',
                label: '詳細設定',
                icon: 'settings',
                description: '詳細。環境設定・運用管理・出力を調整。',
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

    _persistLeftNavState() {
        try {
            if (!window.ZenWriterStorage ||
                typeof window.ZenWriterStorage.loadSettings !== 'function' ||
                typeof window.ZenWriterStorage.saveSettings !== 'function') {
                return;
            }
            const settings = window.ZenWriterStorage.loadSettings() || {};
            settings.ui = settings.ui || {};
            settings.ui.leftNavCategory = this.activeCategoryId;
            settings.sidebarOpen = this.leftNavState === 'category';
            window.ZenWriterStorage.saveSettings(settings);
        } catch (_) { }
    }

    _setShellAnchorIcon(anchor, iconName) {
        if (!anchor) return;
        const safeIconName = iconName || 'panel-left';
        anchor.dataset.currentIcon = safeIconName;

        let icon = anchor.querySelector(':scope > i[data-lucide], :scope > svg');
        if (!icon) {
            icon = document.createElement('i');
            const label = anchor.querySelector('.sidebar-shell-header__anchor-text');
            if (label) {
                anchor.insertBefore(icon, label);
            } else {
                anchor.insertBefore(icon, anchor.firstChild);
            }
        } else if (icon.tagName.toLowerCase() !== 'i') {
            const nextIcon = document.createElement('i');
            anchor.replaceChild(nextIcon, icon);
            icon = nextIcon;
        }

        icon.setAttribute('data-lucide', safeIconName);
        icon.setAttribute('aria-hidden', 'true');
    }

    _applyLeftNavState(options) {
        const opts = (options && typeof options === 'object') ? options : {};
        const html = document.documentElement;
        const sidebar = document.getElementById('sidebar');
        const shellHeader = document.getElementById('sidebar-shell-header');
        const backButton = document.getElementById('sidebar-nav-back');
        const backRail = document.getElementById('sidebar-nav-back-rail');
        const anchor = document.getElementById('sidebar-nav-anchor');
        const anchorLabel = document.getElementById('sidebar-nav-anchor-label');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('toggle-sidebar');
        const isCategory = this.leftNavState === 'category';
        const activeCategory = this.accordionCategories.find((category) => category.id === this.activeCategoryId) || this.accordionCategories[0];

        if (activeCategory) {
            this.activeCategoryId = activeCategory.id;
        }

        html.setAttribute('data-left-nav-state', isCategory ? 'category' : 'root');
        if (isCategory && activeCategory) {
            html.setAttribute('data-left-nav-active', activeCategory.id);
            html.setAttribute('data-sidebar-open', 'true');
        } else {
            html.removeAttribute('data-left-nav-active');
            html.removeAttribute('data-sidebar-open');
        }
        if (activeCategory) {
            html.setAttribute('data-left-nav-last-active', activeCategory.id);
        } else {
            html.removeAttribute('data-left-nav-last-active');
        }

        if (sidebar) {
            // Unified-shell normal mode owns sidebar width via CSS, so clear any legacy inline width.
            if (html.getAttribute('data-ui-mode') === 'normal') {
                sidebar.style.removeProperty('width');
            }
            sidebar.classList.toggle('open', isCategory);
            sidebar.setAttribute('aria-hidden', 'false');
        }
        if (overlay) {
            overlay.setAttribute('aria-hidden', isCategory ? 'false' : 'true');
        }
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', isCategory ? 'true' : 'false');
        }
        if (shellHeader) {
            shellHeader.setAttribute('aria-hidden', isCategory ? 'false' : 'true');
        }
        if (backButton) {
            backButton.tabIndex = isCategory ? 0 : -1;
        }
        if (backRail) {
            backRail.setAttribute('aria-hidden', isCategory ? 'false' : 'true');
        }

        if (anchor && activeCategory) {
            anchor.dataset.group = activeCategory.id;
            anchor.setAttribute('title', activeCategory.label);
            anchor.setAttribute('aria-label', activeCategory.label + ' カテゴリ');
            anchor.tabIndex = isCategory ? 0 : -1;
            if (anchorLabel) {
                anchorLabel.textContent = activeCategory.label;
            }
            this._setShellAnchorIcon(anchor, activeCategory.icon || 'panel-left');
        }

        this.accordionCategories.forEach((category) => {
            const section = document.querySelector(`.accordion-category[data-category="${category.id}"]`);
            if (!section) return;
            const header = section.querySelector('.accordion-header');
            const content = section.querySelector('.accordion-content');
            const isActive = !!activeCategory && category.id === activeCategory.id;
            const showContent = isCategory && isActive;
            const isHidden = isCategory && !isActive;

            section.classList.toggle('is-active-category', isActive);
            section.classList.toggle('is-last-active-category', isActive);
            section.classList.toggle('is-category-hidden', isHidden);
            section.setAttribute('aria-hidden', isHidden ? 'true' : 'false');

            if (header) {
                header.setAttribute('aria-expanded', showContent ? 'true' : 'false');
                header.setAttribute('aria-current', showContent ? 'page' : 'false');
                header.tabIndex = isHidden ? -1 : 0;
            }

            if (content) {
                content.hidden = !showContent;
                content.style.display = showContent ? 'block' : 'none';
                content.style.maxHeight = showContent ? 'none' : '0';
                content.setAttribute('aria-hidden', showContent ? 'false' : 'true');
            }

            if (showContent) {
                this._scheduleAccordionGadgetInitialized(category.id);
            }
        });

        if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function' && isCategory && activeCategory) {
            try {
                window.ZWGadgets.setActiveGroup(activeCategory.id);
            } catch (_) { }
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try {
                window.lucide.createIcons();
            } catch (_) { }
        }

        if (!opts.skipPersist) {
            this._persistLeftNavState();
        }
    }

    returnToLeftNavRoot(options) {
        const opts = (options && typeof options === 'object') ? options : {};
        this.leftNavState = 'root';
        this._applyLeftNavState({ skipPersist: opts.skipPersist === true });
    }

    _ensureAccordionGadgetInitialized(categoryId) {
        try {
            const category = this.accordionCategories.find(c => c && c.id === categoryId);
            if (!category) return false;

            const panel = document.getElementById(category.panelId);
            if (!panel) return false;

            if (this._initializedAccordionGroups.has(categoryId)) return true;

            const roots = window.ZWGadgets && window.ZWGadgets._roots;
            if (roots && roots[categoryId] === panel) {
                this._initializedAccordionGroups.add(categoryId);
                return true;
            }

            if (window.ZWGadgets && typeof window.ZWGadgets.init === 'function') {
                window.ZWGadgets.init(`#${category.panelId}`, { group: categoryId });
                this._initializedAccordionGroups.add(categoryId);
                if (this._isDevMode()) {
                    console.log(`[Accordion] ガジェット初期化成功: ${categoryId}`);
                }
                return true;
            }
        } catch (e) {
            console.error(`ガジェット初期化失敗: ${categoryId}`, e);
        }
        return false;
    }

    _scheduleAccordionGadgetInitialized(categoryId) {
        try {
            if (!categoryId) return false;
            if (this._initializedAccordionGroups.has(categoryId)) return true;
            if (this._pendingAccordionGroupInits.has(categoryId)) return true;

            const category = this.accordionCategories.find(c => c && c.id === categoryId);
            if (!category) return false;
            const panel = document.getElementById(category.panelId);
            if (!panel) return false;

            if (!panel.children.length) {
                const placeholder = document.createElement('div');
                placeholder.className = 'gadget-loading-placeholder';
                placeholder.setAttribute('aria-hidden', 'true');
                placeholder.textContent = '読み込み中…';
                panel.appendChild(placeholder);
            }

            this._pendingAccordionGroupInits.add(categoryId);
            const runInit = () => {
                this._pendingAccordionGroupInits.delete(categoryId);
                this._ensureAccordionGadgetInitialized(categoryId);
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    try { window.lucide.createIcons(); } catch (_) { }
                }
            };
            const scheduleIdle = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 0));
            window.requestAnimationFrame(() => {
                scheduleIdle(runInit, { timeout: 120 });
            });
            return true;
        } catch (e) {
            console.error(`ガジェット遅延初期化失敗: ${categoryId}`, e);
        }
        return false;
    }

    bootstrapAccordion() {
        try {
            document.documentElement.setAttribute('data-sidebar-slim', 'true');

            const settings = this._loadSidebarUISettings() || {};
            const savedGroup = settings && settings.ui && settings.ui.leftNavCategory;
            if (savedGroup && this.accordionCategories.some((category) => category.id === savedGroup)) {
                this.activeCategoryId = savedGroup;
            }
            this.leftNavState = settings && settings.sidebarOpen ? 'category' : 'root';

            this.accordionCategories.forEach(category => {
                const header = document.querySelector(`.accordion-header[aria-controls="accordion-${category.id}"]`);
                const content = document.getElementById(`accordion-${category.id}`);
                if (!header || !content) return;

                header.addEventListener('click', () => {
                    this.activateSidebarGroup(category.id);
                });
                header.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.activateSidebarGroup(category.id);
                    }
                });

                content.hidden = true;
                content.style.display = 'none';
                content.style.maxHeight = '0';
                content.setAttribute('aria-hidden', 'true');
                header.setAttribute('aria-expanded', 'false');
            });

            const backButton = document.getElementById('sidebar-nav-back');
            if (backButton && !backButton.dataset.boundLeftNav) {
                backButton.dataset.boundLeftNav = '1';
                backButton.addEventListener('click', () => this.returnToLeftNavRoot());
            }

            const backRail = document.getElementById('sidebar-nav-back-rail');
            if (backRail && !backRail.dataset.boundLeftNav) {
                backRail.dataset.boundLeftNav = '1';
                backRail.addEventListener('click', () => this.returnToLeftNavRoot());
            }

            const anchorButton = document.getElementById('sidebar-nav-anchor');
            if (anchorButton && !anchorButton.dataset.boundLeftNav) {
                anchorButton.dataset.boundLeftNav = '1';
                anchorButton.setAttribute('aria-disabled', 'true');
                anchorButton.setAttribute('tabindex', '-1');
                anchorButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                });
            }

            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }

            try {
                if (this.elementManager && typeof this.elementManager.initialize === 'function') {
                    this.elementManager.initialize();
                }
            } catch (_) { }
            this._initWritingFocusSidebar();
            this._applyLeftNavState({ skipPersist: true });
        } catch (e) {
            console.error('アコーディオン初期化エラー:', e);
        }
    }

    _toggleAccordion(categoryId, expand) {
        if (this._toggleAccordionInProgress) {
            if (this._isDevMode()) {
                console.log(`[Accordion] 再入防止: ${categoryId}`);
            }
            return;
        }
        this._toggleAccordionInProgress = true;
        try {
            if (this._isDevMode()) {
                console.log(`[Accordion] トグル: ${categoryId} → ${expand ? '展開' : '折りたたみ'}`);
            }
            this._setAccordionState(categoryId, expand);
            this._saveAccordionState();

            // カテゴリ展開時にガジェットを再レンダリング
            if (expand) {
                try {
                    this._ensureAccordionGadgetInitialized(categoryId);
                    const renderers = window.ZWGadgets && window.ZWGadgets._renderers;
                    if (renderers && typeof renderers[categoryId] === 'function') {
                        renderers[categoryId]();
                    }
                    if (this._isDevMode()) {
                        console.log(`[Accordion] ガジェット再レンダリング成功: ${categoryId}`);
                    }
                } catch (e) {
                    console.error(`ガジェット再レンダリング失敗: ${categoryId}`, e);
                }
            }
        } finally {
            this._toggleAccordionInProgress = false;
        }
    }

    /**
     * アニメーションなしで開閉状態だけ同期（フォーカスモードで非表示カテゴリを毎フレーム閉じる用途）
     */
    _silentAccordionSetExpanded(categoryId, expand) {
        const header = document.querySelector(
            `.accordion-header[aria-controls="accordion-${categoryId}"]`
        );
        const content = document.getElementById(`accordion-${categoryId}`);
        if (!header || !content) return;
        header.setAttribute('aria-expanded', expand ? 'true' : 'false');
        content.setAttribute('aria-hidden', expand ? 'false' : 'true');
        if (expand) {
            content.style.display = 'block';
            content.style.maxHeight = 'none';
        } else {
            content.style.maxHeight = '0';
        }
    }

    /** 既に開いていればアニメ再実行しない */
    _expandAccordionIfCollapsed(categoryId) {
        const header = document.querySelector(
            `.accordion-header[aria-controls="accordion-${categoryId}"]`
        );
        if (header && header.getAttribute('aria-expanded') === 'true') return;
        this._setAccordionState(categoryId, true);
    }

    _setAccordionState(categoryId, expand) {
        const header = document.querySelector(
            `.accordion-header[aria-controls="accordion-${categoryId}"]`
        );
        const content = document.getElementById(`accordion-${categoryId}`);

        if (!header || !content) {
            if (this._isDevMode()) {
                console.warn(`[Accordion] _setAccordionState: 要素未検出 categoryId=${categoryId}`, { header: !!header, content: !!content });
            }
            return;
        }

        header.setAttribute('aria-expanded', expand ? 'true' : 'false');

        if (expand) {
            // 展開: scrollHeightを取得してアニメーション開始
            content.style.display = 'block';
            content.setAttribute('aria-hidden', 'false');
            var targetH = content.scrollHeight;
            content.style.maxHeight = '0';
            // 次フレームで目標高さを設定してアニメーション開始
            requestAnimationFrame(function () {
                content.style.maxHeight = targetH + 'px';
                var cleared = false;
                // アニメーション完了後に max-height: none で自由伸縮可能に
                var clearMaxHeight = function () {
                    if (cleared) return;
                    cleared = true;
                    content.removeEventListener('transitionend', clearMaxHeight);
                    if (content.getAttribute('aria-hidden') !== 'true') {
                        content.style.maxHeight = 'none';
                    }
                };
                content.addEventListener('transitionend', clearMaxHeight);
                // フォールバック: transitionendが発火しない場合に備える
                setTimeout(clearMaxHeight, 400);
            });
        } else {
            // 折りたたみ: scrollHeight → 0 のアニメーション
            content.style.maxHeight = content.scrollHeight + 'px';
            requestAnimationFrame(function () {
                content.setAttribute('aria-hidden', 'true');
                requestAnimationFrame(function () {
                    content.style.maxHeight = '0';
                });
            });
        }
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
            if (!s) return;
            if (!s.ui) s.ui = {};
            s.ui.accordionState = state;
            window.ZenWriterStorage.saveSettings(s);
        } catch (e) {
            console.error('アコーディオン状態保存エラー:', e);
        }
    }

    _loadSidebarUISettings() {
        try {
            if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.loadSettings !== 'function') return null;
            return window.ZenWriterStorage.loadSettings();
        } catch (_) {
            return null;
        }
    }

    _saveSidebarUISettingsPatch(patch) {
        try {
            if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.loadSettings !== 'function' || typeof window.ZenWriterStorage.saveSettings !== 'function') return false;
            const settings = window.ZenWriterStorage.loadSettings() || {};
            settings.ui = settings.ui || {};
            Object.keys(patch || {}).forEach((k) => {
                settings.ui[k] = patch[k];
            });
            return !!window.ZenWriterStorage.saveSettings(settings);
        } catch (_) {
            return false;
        }
    }

    _initWritingFocusSidebar() {
        try {
            if (this._writingFocusInitialized) return;
            const accordion = document.querySelector('.sidebar-accordion');
            if (!accordion) return;

            const settings = this._loadSidebarUISettings();
            this._writingFocusSettingsOpen = !!(settings && settings.ui && settings.ui.sidebarSettingsOpen);

            let rail = document.getElementById('writing-focus-rail');
            if (!rail) {
                rail = document.createElement('section');
                rail.id = 'writing-focus-rail';
                rail.className = 'writing-focus-rail';
                rail.innerHTML = `
                    <h3 id="writing-focus-title" class="writing-focus-title">ドキュメント</h3>
                    <div class="writing-focus-section-head">
                      <span class="writing-focus-section-head-label">章ナビ</span>
                      <button id="writing-focus-add-section" class="writing-focus-add" type="button" title="チャプターストアに章を追加（左端の「チャプター」パネルにも表示されます）">+ 追加</button>
                    </div>
                    <div id="writing-focus-nav" class="writing-focus-nav" aria-live="polite"></div>
                `;
                accordion.insertBefore(rail, accordion.firstChild);
            } else {
                const headRow = rail.querySelector('.writing-focus-section-head');
                const firstSpan = headRow && headRow.querySelector('span:first-of-type');
                if (firstSpan && String(firstSpan.textContent || '').trim() === 'セクション') {
                    firstSpan.textContent = '章ナビ';
                    firstSpan.classList.add('writing-focus-section-head-label');
                }
            }

            let footer = document.getElementById('writing-focus-footer');
            if (!footer) {
                footer = document.createElement('section');
                footer.id = 'writing-focus-footer';
                footer.className = 'writing-focus-footer';
                footer.innerHTML = `
                    <div class="writing-focus-footer__row" role="group" aria-label="執筆集中サイドバー操作">
                        <button id="writing-focus-settings-btn" class="writing-focus-settings-btn" type="button" title="サイドバーで構成・テーマなどを表示">詳細</button>
                        <button type="button" id="writing-focus-exit-to-normal-btn" class="writing-focus-exit-full" title="通常表示に切替">通常表示</button>
                    </div>`;
                accordion.appendChild(footer);
            } else if (!document.getElementById('writing-focus-exit-to-normal-btn')) {
                const existingSettings = document.getElementById('writing-focus-settings-btn');
                if (existingSettings && existingSettings.parentElement === footer) {
                    const row = document.createElement('div');
                    row.className = 'writing-focus-footer__row';
                    row.setAttribute('role', 'group');
                    row.setAttribute('aria-label', '執筆集中サイドバー操作');
                    footer.insertBefore(row, existingSettings);
                    row.appendChild(existingSettings);
                    const exitBtn = document.createElement('button');
                    exitBtn.type = 'button';
                    exitBtn.id = 'writing-focus-exit-to-normal-btn';
                    exitBtn.className = 'writing-focus-exit-full';
                    exitBtn.title = '通常表示に切替';
                    exitBtn.textContent = '通常表示';
                    row.appendChild(exitBtn);
                }
            }

            const settingsBtn = document.getElementById('writing-focus-settings-btn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    this._writingFocusSettingsOpen = !this._writingFocusSettingsOpen;
                    this._saveSidebarUISettingsPatch({ sidebarSettingsOpen: this._writingFocusSettingsOpen });
                    this._applyWritingFocusSidebar();
                });
            }

            const exitNormalBtn = document.getElementById('writing-focus-exit-to-normal-btn');
            if (exitNormalBtn && !exitNormalBtn.dataset.zwExitFullBound) {
                exitNormalBtn.dataset.zwExitFullBound = '1';
                exitNormalBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
                        window.ZenWriterApp.setUIMode('normal');
                    }
                });
            }

            const addSectionBtn = document.getElementById('writing-focus-add-section');
            if (addSectionBtn && !addSectionBtn.dataset.zwWritingFocusAddBound) {
                addSectionBtn.dataset.zwWritingFocusAddBound = '1';
                addSectionBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._insertQuickSection();
                });
            }

            const editor = document.getElementById('editor');
            if (editor) {
                const onEditorChanged = () => this._scheduleWritingFocusRender();
                editor.addEventListener('input', onEditorChanged);
                editor.addEventListener('click', onEditorChanged);
            }
            window.addEventListener('ZWDocumentsChanged', () => this._scheduleWritingFocusRender());
            window.addEventListener('ZWChapterStoreChanged', () => {
                this._scheduleWritingFocusRender();
                requestAnimationFrame(() => this._scrollWritingFocusRailIntoView());
            });
            this._writingFocusObserver = new MutationObserver(() => {
                this._applyWritingFocusSidebar();
                this._renderWritingFocusNavigator();
            });
            this._writingFocusObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ui-mode'] });

            this._writingFocusInitialized = true;
            this._applyWritingFocusSidebar();
            this._renderWritingFocusNavigator();
        } catch (e) {
            console.error('執筆集中サイドバー初期化エラー:', e);
        }
    }

    _isWritingFocusSidebarEffective() {
        const mode = document.documentElement.getAttribute('data-ui-mode') || 'normal';
        return mode === 'focus';
    }

    /**
     * Normal→Focus（最小）へ入ったとき、永続の「詳細」展開を畳み章ナビ中心に揃える。
     * 通常表示に戻ったあと再度最小にしたときに、サイドバーが「最小なのに構造まで出る」状態を防ぐ。
     */
    collapseWritingFocusDetailForUIModeFocus() {
        if (!this._isWritingFocusSidebarEffective()) return;
        if (this._writingFocusSettingsOpen) {
            this._writingFocusSettingsOpen = false;
            this._saveSidebarUISettingsPatch({ sidebarSettingsOpen: false });
        }
        this._applyWritingFocusSidebar();
    }

    _applyWritingFocusSidebar() {
        const effective = this._isWritingFocusSidebarEffective();
        const rail = document.getElementById('writing-focus-rail');
        const footer = document.getElementById('writing-focus-footer');
        const structurePanel = document.getElementById('structure-gadgets-panel');

        document.documentElement.setAttribute('data-writing-sidebar-focus', effective ? 'true' : 'false');
        document.documentElement.setAttribute('data-writing-settings-open', effective && this._writingFocusSettingsOpen ? 'true' : 'false');

        if (rail) {
            rail.hidden = false;
            rail.style.display = effective ? '' : 'none';
            rail.setAttribute('aria-hidden', effective ? 'false' : 'true');
        }
        if (footer) {
            footer.hidden = false;
            footer.style.display = effective ? '' : 'none';
            footer.setAttribute('aria-hidden', effective ? 'false' : 'true');
        }

        const settingsBtn = document.getElementById('writing-focus-settings-btn');
        if (settingsBtn) {
            const opened = effective && this._writingFocusSettingsOpen;
            settingsBtn.setAttribute('aria-pressed', opened ? 'true' : 'false');
            settingsBtn.textContent = opened ? '執筆へ戻る' : '詳細';
            settingsBtn.title = opened ? '章ナビ中心の表示に戻す' : 'サイドバーで構成・テーマなどを表示';
        }

        const categories = document.querySelectorAll('.accordion-category[data-category]');
        categories.forEach((section) => {
            const categoryId = section.getAttribute('data-category');
            if (effective && !this._writingFocusSettingsOpen && categoryId !== 'sections') {
                section.style.display = 'none';
                section.setAttribute('aria-hidden', 'true');
                this._silentAccordionSetExpanded(categoryId, false);
            } else {
                section.style.display = '';
                section.setAttribute('aria-hidden', 'false');
            }
        });

        if (effective) {
            this._expandAccordionIfCollapsed('sections');
            this._ensureAccordionGadgetInitialized('sections');
            if (this._writingFocusSettingsOpen) {
                // 設定表示時: structure を展開し他を閉じる
                this._setAccordionState('structure', true);
                this._ensureAccordionGadgetInitialized('structure');
                this.accordionCategories.forEach((category) => {
                    if (category.id !== 'structure') this._setAccordionState(category.id, false);
                });
            }
            if (structurePanel) {
                structurePanel.style.display = this._writingFocusSettingsOpen ? '' : 'none';
            }
            return;
        }

        if (structurePanel) {
            structurePanel.style.display = '';
        }

        const savedState = this._loadAccordionState();
        // 保存が空でも各カテゴリの defaultExpanded が適用される（例: sections は true）。
        // 旧フォールバック「saved に展開キーが無いと structure を開く」は、
        // 空オブジェクト {} で常に誤判定し更新のたびに構造が開いて見えたため廃止。
        this.accordionCategories.forEach((category) => {
            const isExpanded = savedState[category.id] !== undefined
                ? savedState[category.id]
                : category.defaultExpanded;
            this._setAccordionState(category.id, isExpanded);
        });
    }

    _scheduleWritingFocusRender() {
        if (!this._isWritingFocusSidebarEffective()) return;
        if (this._writingFocusRenderTimer) clearTimeout(this._writingFocusRenderTimer);
        this._writingFocusRenderTimer = setTimeout(() => {
            // レイアウト再適用はモード切替・設定トグルで _applyWritingFocusSidebar が既に走る。
            // 章ストア更新のたびに呼ぶと sections の展開アニメが毎回走りガジェットが伸縮するため、ここではナビだけ更新する。
            this._renderWritingFocusNavigator();
        }, 80);
    }

    _scrollWritingFocusRailIntoView() {
        if (!this._isWritingFocusSidebarEffective()) return;
        const sidebar = document.getElementById('sidebar');
        const rail = document.getElementById('writing-focus-rail');
        if (!sidebar || !rail || !sidebar.classList.contains('open')) return;
        try {
            rail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } catch (_) { /* noop */ }
    }

    _parseMarkdownHeadings(text) {
        const source = String(text || '');
        const headingPattern = /^(#{1,6})(?:[ \t]+(.*))?$/gm;
        const headings = [];
        let m;
        while ((m = headingPattern.exec(source)) !== null) {
            headings.push({
                level: m[1].length,
                title: String(m[2] || '').trim(),
                index: m.index
            });
        }
        if (!headings.length) return { chapterLevel: 2, sceneLevel: 3, headings: [], chapters: [], sourceLength: source.length };

        const levels = headings.map((h) => h.level);
        const chapterLevel = levels.includes(2) ? 2 : Math.min.apply(null, levels);
        const sceneLevel = Math.min(chapterLevel + 1, 6);
        const chapters = [];
        let currentChapter = null;

        headings.forEach((h) => {
            if (h.level === chapterLevel) {
                currentChapter = { title: h.title, index: h.index, endIndex: source.length, scenes: [] };
                chapters.push(currentChapter);
                return;
            }
            if (h.level === sceneLevel && currentChapter) {
                currentChapter.scenes.push({ title: h.title, index: h.index, endIndex: source.length });
            }
        });

        chapters.forEach((chapter, idx) => {
            const nextChapter = chapters[idx + 1];
            chapter.endIndex = nextChapter ? nextChapter.index : source.length;
            chapter.scenes.forEach((scene, sceneIdx) => {
                const nextScene = chapter.scenes[sceneIdx + 1];
                scene.endIndex = nextScene ? nextScene.index : chapter.endIndex;
            });
        });

        return { chapterLevel, sceneLevel, headings, chapters, sourceLength: source.length };
    }

    _getWritingFocusContext(editor, parsed) {
        const sourceParsed = parsed || this._parseMarkdownHeadings(editor && editor.value ? editor.value : '');
        const chapters = sourceParsed.chapters || [];
        const cursor = editor && typeof editor.selectionStart === 'number' ? editor.selectionStart : 0;

        let activeChapterIndex = -1;
        for (let i = 0; i < chapters.length; i += 1) {
            if (cursor >= chapters[i].index) activeChapterIndex = i;
        }
        const activeChapter = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : null;

        let activeSceneIndex = -1;
        const scenes = activeChapter ? (activeChapter.scenes || []) : [];
        for (let i = 0; i < scenes.length; i += 1) {
            if (cursor >= scenes[i].index) activeSceneIndex = i;
        }

        const allScenes = [];
        chapters.forEach((chapter, chapterIndex) => {
            (chapter.scenes || []).forEach((scene, sceneIndex) => {
                allScenes.push({
                    chapterIndex,
                    sceneIndex,
                    title: scene.title,
                    index: scene.index
                });
            });
        });

        let currentGlobalScenePos = -1;
        for (let i = 0; i < allScenes.length; i += 1) {
            if (cursor >= allScenes[i].index) currentGlobalScenePos = i;
        }

        return {
            parsed: sourceParsed,
            cursor,
            chapters,
            activeChapterIndex,
            activeChapter,
            activeSceneIndex,
            allScenes,
            currentGlobalScenePos
        };
    }

    _moveEditorCaretTo(index) {
        const editor = document.getElementById('editor');
        if (!editor) return;
        const target = Math.max(0, Math.min(Number(index) || 0, editor.value.length));
        editor.focus();
        editor.selectionStart = target;
        editor.selectionEnd = target;
        const before = editor.value.slice(0, target);
        const lines = (before.match(/\n/g) || []).length;
        const lineHeight = parseFloat(window.getComputedStyle(editor).lineHeight) || 24;
        editor.scrollTop = Math.max(0, lines * lineHeight - editor.clientHeight * 0.35);
        this._scheduleWritingFocusRender();
    }

    moveWritingFocusChapter(step) {
        const editor = document.getElementById('editor');
        if (!editor) return false;
        const context = this._getWritingFocusContext(editor);
        const chapters = context.chapters;
        if (!chapters.length) return false;

        let targetIndex = context.activeChapterIndex;
        if (targetIndex < 0) {
            targetIndex = step > 0 ? 0 : chapters.length - 1;
        } else {
            targetIndex += step;
        }
        if (targetIndex < 0 || targetIndex >= chapters.length) return false;
        this._moveEditorCaretTo(chapters[targetIndex].index);
        return true;
    }

    moveWritingFocusScene(step) {
        const editor = document.getElementById('editor');
        if (!editor) return false;
        const context = this._getWritingFocusContext(editor);
        const scenes = context.allScenes;
        if (!scenes.length) return false;

        let targetPos = -1;
        if (step > 0) {
            targetPos = context.currentGlobalScenePos + 1;
        } else {
            targetPos = context.currentGlobalScenePos >= 0 ? context.currentGlobalScenePos - 1 : -1;
        }
        if (targetPos < 0 || targetPos >= scenes.length) return false;
        this._moveEditorCaretTo(scenes[targetPos].index);
        return true;
    }

    navigateWritingFocus(action) {
        switch (action) {
            case 'prevScene':
                return this.moveWritingFocusScene(-1);
            case 'nextScene':
                return this.moveWritingFocusScene(1);
            case 'prevChapter':
                return this.moveWritingFocusChapter(-1);
            case 'nextChapter':
                return this.moveWritingFocusChapter(1);
            case 'openSections':
                this.forceSidebarState(true);
                return true;
            default:
                return false;
        }
    }

    _insertQuickSection() {
        if (this._writingFocusAddBusy) return;
        this._writingFocusAddBusy = true;
        try {
        // chapterMode では Store.createChapter() 経由の正規経路を使う
        // エディタへの直接テキスト挿入は uninvited text の原因になるため禁止
        var cl = window.ZWChapterList;
        if (cl && typeof cl.addChapter === 'function') {
            cl.addChapter();
            if (this._isWritingFocusSidebarEffective()) {
                this._renderWritingFocusNavigator();
            }
            this._scheduleWritingFocusRender();
            requestAnimationFrame(() => this._scrollWritingFocusRailIntoView());
            return;
        }

        const editor = document.getElementById('editor');
        if (!editor) return;
        const parsed = this._parseMarkdownHeadings(editor.value || '');
        const context = this._getWritingFocusContext(editor, parsed);
        const currentChapter = context.activeChapter;
        const insideChapter = !!(currentChapter && context.cursor > currentChapter.index && context.cursor < currentChapter.endIndex);
        const level = Math.max(1, Math.min(6, insideChapter ? parsed.sceneLevel : parsed.chapterLevel));
        const marks = '#'.repeat(level);
        const label = `${marks} `;
        const start = typeof editor.selectionStart === 'number' ? editor.selectionStart : editor.value.length;
        const needsLeadingBreak = start > 0 && editor.value.charAt(start - 1) !== '\n';
        const insertion = `${needsLeadingBreak ? '\n' : ''}${label}\n\n`;
        const before = editor.value.slice(0, start);
        const after = editor.value.slice(start);
        editor.value = before + insertion + after;
        const nextCaret = before.length + (needsLeadingBreak ? 1 : 0) + marks.length + 1;
        editor.focus();
        editor.selectionStart = nextCaret;
        editor.selectionEnd = nextCaret;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        this._scheduleWritingFocusRender();
        } finally {
            window.setTimeout(() => {
                this._writingFocusAddBusy = false;
            }, 320);
        }
    }

    _escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * CURRENT_DOC_ID が document 以外（例: 章レコード）や無効なときでも、章一覧クエリ用の親ドキュメント ID を返す。
     */
    _resolveChapterNavDocId(rawId) {
        const Store = window.ZWChapterStore;
        if (Store && typeof Store.resolveParentDocumentId === 'function') {
            return Store.resolveParentDocumentId(rawId);
        }
        return rawId || null;
    }

    _writingFocusDocTitleFromId(curId, docs) {
        if (!curId || !docs || !docs.length) return null;
        const rec = docs.find((d) => d && d.id === curId);
        if (!rec) return null;
        if (rec.type === 'document' && rec.name) return rec.name;
        if (rec.type === 'chapter' && rec.parentId) {
            const parent = docs.find((d) => d && d.id === rec.parentId && d.type === 'document');
            if (parent && parent.name) return parent.name;
        }
        return null;
    }

    /**
     * chapterMode（ZWChapterStore）時: 執筆レールの「章」チップをストアの章一覧に同期。
     * 従来の ## 見出しパースは「単一バッファ原稿」向けのため、章ストアと齟齬が出ないように分岐する。
     */
    _renderWritingFocusNavigatorChapterStore(docName, editor, storeChapters, title, nav) {
        const cl = window.ZWChapterList;
        let activeIdx = 0;
        if (cl && typeof cl.getActiveIndex === 'function') {
            const ai = cl.getActiveIndex();
            if (ai >= 0 && ai < storeChapters.length) activeIdx = ai;
        }

        title.textContent = docName;
        const safeDocName = this._escapeHtml(docName);

        const chapterButtons = storeChapters.map((sc, idx) => {
            const activeClass = idx === activeIdx ? ' is-active' : '';
            const t = String((sc && (sc.name != null && sc.name !== '' ? sc.name : sc.title)) || '').trim() || '章タイトル未設定';
            return `<button type="button" class="writing-focus-chip${activeClass}" data-wf-store-chapter-index="${idx}">${this._escapeHtml(t)}</button>`;
        }).join('');

        const parsed = this._parseMarkdownHeadings(editor.value || '');
        const sceneLevel = parsed.sceneLevel;
        const sceneHeadings = (parsed.headings || []).filter((h) => h.level === sceneLevel);
        const cursor = editor && typeof editor.selectionStart === 'number' ? editor.selectionStart : 0;
        let activeSceneIndex = -1;
        for (let i = 0; i < sceneHeadings.length; i += 1) {
            if (cursor >= sceneHeadings[i].index) activeSceneIndex = i;
        }
        const hasPrevScene = activeSceneIndex > 0;
        const hasNextScene = activeSceneIndex >= 0 && activeSceneIndex < sceneHeadings.length - 1;
        const sceneButtons = sceneHeadings.map((scene, idx) => {
            const activeClass = idx === activeSceneIndex ? ' is-active' : '';
            return `<button type="button" class="writing-focus-scene${activeClass}" data-wf-jump="${scene.index}"># ${this._escapeHtml(scene.title)}</button>`;
        }).join('');

        nav.innerHTML = `
            <div class="writing-focus-seek">
              <button type="button" class="writing-focus-seek-btn" data-wf-prev-scene ${hasPrevScene ? '' : 'disabled'}>前のシーン</button>
              <button type="button" class="writing-focus-seek-btn" data-wf-next-scene ${hasNextScene ? '' : 'disabled'}>次のシーン</button>
            </div>
            <div class="writing-focus-chips" aria-label="${safeDocName} の章（ストア）">${chapterButtons}</div>
            <div class="writing-focus-scenes">
              ${sceneButtons || '<p class="writing-focus-empty">この章に ### シーン見出しはまだありません。</p>'}
            </div>
        `;

        nav.querySelectorAll('[data-wf-store-chapter-index]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-wf-store-chapter-index'));
                if (!cl || typeof cl.navigateTo !== 'function') return;
                if (idx >= 0 && idx < storeChapters.length) cl.navigateTo(idx);
            });
        });
        nav.querySelectorAll('[data-wf-jump]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this._moveEditorCaretTo(Number(btn.getAttribute('data-wf-jump')));
            });
        });
        const prevBtn = nav.querySelector('[data-wf-prev-scene]');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!hasPrevScene) return;
                this._moveEditorCaretTo(sceneHeadings[activeSceneIndex - 1].index);
            });
        }
        const nextBtn = nav.querySelector('[data-wf-next-scene]');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!hasNextScene) return;
                this._moveEditorCaretTo(sceneHeadings[activeSceneIndex + 1].index);
            });
        }

        const activeCh = storeChapters[activeIdx];
        const activeScene = activeSceneIndex >= 0 ? sceneHeadings[activeSceneIndex] : null;
        const activeTitle = activeCh ? String(activeCh.name != null && activeCh.name !== '' ? activeCh.name : activeCh.title || '') : '';
        this._emitWritingFocusLocationChanged({
            docName,
            chapterTitle: activeTitle,
            chapterIndex: activeIdx,
            chapterCount: storeChapters.length,
            sceneTitle: activeScene && activeScene.title ? activeScene.title : '',
            sceneIndex: activeSceneIndex,
            sceneCount: sceneHeadings.length
        });
    }

    _renderWritingFocusNavigator() {
        const title = document.getElementById('writing-focus-title');
        const nav = document.getElementById('writing-focus-nav');
        if (!title || !nav) return;

        const effective = this._isWritingFocusSidebarEffective();
        if (!effective) {
            title.textContent = 'ドキュメント';
            nav.innerHTML = '';
            return;
        }

        const editor = document.getElementById('editor');
        if (!editor) {
            title.textContent = 'ドキュメント';
            nav.innerHTML = '';
            return;
        }

        let docName = '無題ドキュメント';
        let currentDocId = null;
        let docs = [];
        try {
            const storage = window.ZenWriterStorage;
            docs = storage && typeof storage.loadDocuments === 'function' ? (storage.loadDocuments() || []) : [];
            const cur = storage && typeof storage.getCurrentDocId === 'function' ? storage.getCurrentDocId() : null;
            currentDocId = cur;
            const named = this._writingFocusDocTitleFromId(cur, docs);
            if (named) docName = named;
            else {
                const doc = docs.find((d) => d && d.id === cur);
                if (doc && doc.name) docName = doc.name;
            }
        } catch (_) { }

        // 左の「チャプター」パネルと同じメモリ一覧を優先（CURRENT_DOC_ID とストアキーがずれてもチップが空にならない）
        const cl = window.ZWChapterList;
        if (cl && typeof cl.getChapters === 'function') {
            const memChapters = cl.getChapters() || [];
            if (memChapters.length > 0) {
                this._renderWritingFocusNavigatorChapterStore(docName, editor, memChapters, title, nav);
                return;
            }
        }

        const Store = window.ZWChapterStore;
        const navDocId = this._resolveChapterNavDocId(currentDocId);
        if (navDocId && Store && typeof Store.getChaptersForDoc === 'function') {
            const storeChapters = Store.getChaptersForDoc(navDocId) || [];
            if (storeChapters.length > 0) {
                this._renderWritingFocusNavigatorChapterStore(docName, editor, storeChapters, title, nav);
                return;
            }
        }

        const parsed = this._parseMarkdownHeadings(editor.value || '');
        const context = this._getWritingFocusContext(editor, parsed);
        const chapters = context.chapters || [];
        if (!chapters.length) {
            title.textContent = docName;
            nav.innerHTML = '<p class="writing-focus-empty">見出し（## 章タイトル）を作成すると章ナビが表示されます。</p>';
            this._emitWritingFocusLocationChanged({
                docName,
                chapterTitle: '',
                chapterIndex: -1,
                chapterCount: 0,
                sceneTitle: '',
                sceneIndex: -1,
                sceneCount: 0
            });
            return;
        }

        const activeChapterIndex = context.activeChapterIndex >= 0 ? context.activeChapterIndex : 0;
        const activeChapter = chapters[activeChapterIndex];
        title.textContent = docName;
        const safeDocName = this._escapeHtml(docName);

        const chapterButtons = chapters.map((ch, idx) => {
            const activeClass = idx === activeChapterIndex ? ' is-active' : '';
            return `<button type="button" class="writing-focus-chip${activeClass}" data-wf-chapter-index="${idx}">${this._escapeHtml(ch.title || '章タイトル未設定')}</button>`;
        }).join('');
        const scenes = activeChapter.scenes || [];
        const activeSceneIndex = context.activeChapterIndex === activeChapterIndex ? context.activeSceneIndex : -1;
        const hasPrevScene = activeSceneIndex > 0;
        const hasNextScene = activeSceneIndex >= 0 && activeSceneIndex < scenes.length - 1;
        const sceneButtons = scenes.map((scene, idx) => {
            const activeClass = idx === activeSceneIndex ? ' is-active' : '';
            return `<button type="button" class="writing-focus-scene${activeClass}" data-wf-jump="${scene.index}"># ${this._escapeHtml(scene.title || 'シーンタイトル未設定')}</button>`;
        }).join('');

        nav.innerHTML = `
            <div class="writing-focus-seek">
              <button type="button" class="writing-focus-seek-btn" data-wf-prev-scene ${hasPrevScene ? '' : 'disabled'}>前のシーン</button>
              <button type="button" class="writing-focus-seek-btn" data-wf-next-scene ${hasNextScene ? '' : 'disabled'}>次のシーン</button>
            </div>
            <div class="writing-focus-chips" aria-label="${safeDocName} 章一覧">${chapterButtons}</div>
            <div class="writing-focus-scenes">
              ${sceneButtons || '<p class="writing-focus-empty">この章にはシーン見出し（###）がありません。</p>'}
            </div>
        `;

        nav.querySelectorAll('[data-wf-chapter-index]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-wf-chapter-index'));
                const chapter = chapters[idx];
                if (chapter) this._moveEditorCaretTo(chapter.index);
            });
        });
        nav.querySelectorAll('[data-wf-jump]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this._moveEditorCaretTo(Number(btn.getAttribute('data-wf-jump')));
            });
        });
        const prevBtn = nav.querySelector('[data-wf-prev-scene]');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!hasPrevScene) return;
                this._moveEditorCaretTo(scenes[activeSceneIndex - 1].index);
            });
        }
        const nextBtn = nav.querySelector('[data-wf-next-scene]');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!hasNextScene) return;
                this._moveEditorCaretTo(scenes[activeSceneIndex + 1].index);
            });
        }

        this._emitWritingFocusLocationChanged({
            docName,
            chapterTitle: activeChapter && activeChapter.title ? activeChapter.title : '',
            chapterIndex: activeChapterIndex,
            chapterCount: chapters.length,
            sceneTitle: activeSceneIndex >= 0 && scenes[activeSceneIndex] ? scenes[activeSceneIndex].title : '',
            sceneIndex: activeSceneIndex,
            sceneCount: scenes.length
        });
    }

    _emitWritingFocusLocationChanged(payload) {
        try {
            const chapterTitle = payload && payload.chapterTitle ? payload.chapterTitle : '';
            document.querySelectorAll('#section-nav-current-title, #chapter-nav-current-title, [data-bottom-chapter-title]').forEach((el) => {
                el.textContent = chapterTitle;
            });
            window.dispatchEvent(new CustomEvent('ZWWritingFocusLocationChanged', {
                detail: Object.assign({ source: 'sidebar' }, payload || {})
            }));
        } catch (_) { }
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
        if (!sidebar) return;

        this.leftNavState = open ? 'category' : 'root';
        this._applyLeftNavState();

        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (sidebarOverlay) {
            sidebarOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
        }

        const toggleBtn = document.getElementById('toggle-sidebar');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        sidebar.setAttribute('aria-hidden', 'false');
        if (callback) {
            requestAnimationFrame(() => callback());
        }
    }

    toggleSidebar() {
        const willOpen = this.leftNavState !== 'category';
        if (this._isDevMode()) {
            console.info(`toggleSidebar -> ${willOpen ? 'category' : 'root'}`);
        }
        this.forceSidebarState(willOpen);
    }

    setToolbarVisibility(_show) {
        try {
            document.documentElement.removeAttribute('data-toolbar-hidden');
            document.body.classList.remove('toolbar-hidden');
        } catch (_) { }
    }

    /** Alt+W: コマンドパレットへ誘導（旧メインハブ互換） */
    toggleToolbar() {
        if (window.commandPalette && typeof window.commandPalette.show === 'function') {
            window.commandPalette.show();
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

    /**
     * アコーディオン型サイドバー（.accordion-header）があるとき、該当カテゴリを展開する。
     * コマンドパレット等からの activateSidebarGroup と整合させ、折りたたんだまま見えない問題を防ぐ。
     */
    _expandAccordionForSidebarGroup(groupId) {
        if (!groupId) return;
        const header = document.querySelector(
            `.accordion-header[aria-controls="accordion-${groupId}"]`
        );
        if (!header) return;
        try {
            if (header.getAttribute('aria-expanded') === 'true') {
                this._ensureAccordionGadgetInitialized(groupId);
                return;
            }
            this._setAccordionState(groupId, true);
            this._saveAccordionState();
            this._ensureAccordionGadgetInitialized(groupId);
            const renderers = window.ZWGadgets && window.ZWGadgets._renderers;
            if (renderers && typeof renderers[groupId] === 'function') {
                renderers[groupId]();
            }
        } catch (e) {
            console.error('_expandAccordionForSidebarGroup failed:', e);
        }
    }

    activateSidebarGroup(groupId, options) {
        if (!groupId) {
            return;
        }

        const opts = (options && typeof options === 'object') ? options : {};
        const legacyGroupMap = {
            wiki: 'edit',
            typography: 'theme',
            settings: 'advanced'
        };
        const normalizedGroupId = legacyGroupMap[groupId] || groupId;
        const category = this.accordionCategories.find((item) => item.id === normalizedGroupId);
        if (!category) {
            console.warn(`Unknown sidebar group: ${groupId}`);
            return;
        }

        this.activeCategoryId = category.id;
        this.leftNavState = 'category';
        this._applyLeftNavState({ skipPersist: opts.skipPersist === true });
    }
}

SidebarManager.TRANSITION_TIMEOUT_MS = 350; // transition-duration + buffer

// グローバルに公開
window.SidebarManager = SidebarManager;
