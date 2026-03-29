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
        this._initializedAccordionGroups = new Set();
        this._writingFocusInitialized = false;
        this._writingFocusRenderTimer = null;
        this._writingFocusObserver = null;
        this._writingFocusSettingsOpen = false;
        this._toggleAccordionInProgress = false;
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

                // 一括折りたたみ/展開ボタン
                const bulkToggleVisible = localStorage.getItem('zenwriter-gadget-bulk-toggle-visible');
                if (bulkToggleVisible !== 'false') {
                    const bulkBtn = document.createElement('button');
                    bulkBtn.className = 'gadget-bulk-toggle-btn';
                    bulkBtn.title = 'ガジェットを全て展開/折りたたみ';
                    bulkBtn.setAttribute('aria-label', 'ガジェットを全て展開/折りたたみ');
                    const bulkIcon = document.createElement('i');
                    bulkIcon.setAttribute('data-lucide', 'chevrons-down-up');
                    bulkIcon.setAttribute('aria-hidden', 'true');
                    bulkBtn.appendChild(bulkIcon);

                    bulkBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // 現在のカテゴリ内の全ガジェットの状態を確認
                        const panel = document.getElementById(category.panelId);
                        if (!panel) return;
                        const wrappers = panel.querySelectorAll('.gadget-wrapper');
                        const allCollapsed = Array.from(wrappers).every(w => {
                            return w.getAttribute('data-gadget-collapsed') === 'true';
                        });
                        // 全て折りたたみなら全展開、それ以外なら全折りたたみ
                        wrappers.forEach(w => {
                            const name = w.getAttribute('data-gadget-name');
                            if (name && window.ZWGadgets) {
                                window.ZWGadgets._setGadgetCollapsed(name, !allCollapsed, w);
                            }
                        });
                    });

                    // chevron-downアイコンの前に挿入
                    const accordionChevron = header.querySelector('.accordion-icon');
                    if (accordionChevron) {
                        header.insertBefore(bulkBtn, accordionChevron);
                    }
                }

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
                if (isExpanded) {
                    this._ensureAccordionGadgetInitialized(category.id);
                } else if (!panel) {
                    console.warn(`[Accordion] パネルが見つかりません: ${category.panelId}`);
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
            this._initWritingFocusSidebar();
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
                      <span>セクション</span>
                      <button id="writing-focus-add-section" class="writing-focus-add" type="button" title="セクション追加">+ 追加</button>
                    </div>
                    <div id="writing-focus-nav" class="writing-focus-nav" aria-live="polite"></div>
                `;
                accordion.insertBefore(rail, accordion.firstChild);
            }

            let footer = document.getElementById('writing-focus-footer');
            if (!footer) {
                footer = document.createElement('section');
                footer.id = 'writing-focus-footer';
                footer.className = 'writing-focus-footer';
                footer.innerHTML = `<button id="writing-focus-settings-btn" class="writing-focus-settings-btn" type="button">設定</button>`;
                accordion.appendChild(footer);
            }

            const settingsBtn = document.getElementById('writing-focus-settings-btn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    this._writingFocusSettingsOpen = !this._writingFocusSettingsOpen;
                    this._saveSidebarUISettingsPatch({ sidebarSettingsOpen: this._writingFocusSettingsOpen });
                    this._applyWritingFocusSidebar();
                });
            }

            const addSectionBtn = document.getElementById('writing-focus-add-section');
            if (addSectionBtn) {
                addSectionBtn.addEventListener('click', () => {
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
            window.addEventListener('ZWBottomNavNavigate', (ev) => {
                const action = ev && ev.detail ? ev.detail.action : '';
                if (!action) return;
                this.navigateWritingFocus(action);
            });

            this._writingFocusObserver = new MutationObserver(() => this._scheduleWritingFocusRender());
            this._writingFocusObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ui-mode'] });

            this._writingFocusInitialized = true;
            this._applyWritingFocusSidebar();
            this._renderWritingFocusNavigator();
        } catch (e) {
            console.error('執筆集中サイドバー初期化エラー:', e);
        }
    }

    _isWritingFocusSidebarEffective() {
        return true;
    }

    _applyWritingFocusSidebar() {
        const effective = this._isWritingFocusSidebarEffective();
        document.documentElement.setAttribute('data-writing-sidebar-focus', effective ? 'true' : 'false');
        document.documentElement.setAttribute('data-writing-settings-open', effective && this._writingFocusSettingsOpen ? 'true' : 'false');
        const settingsBtn = document.getElementById('writing-focus-settings-btn');
        if (settingsBtn) {
            const opened = effective && this._writingFocusSettingsOpen;
            settingsBtn.setAttribute('aria-pressed', opened ? 'true' : 'false');
            settingsBtn.textContent = opened ? '執筆へ戻る' : '設定';
        }

        const categories = document.querySelectorAll('.accordion-category[data-category]');
        categories.forEach((section) => {
            const categoryId = section.getAttribute('data-category');
            if (effective && !this._writingFocusSettingsOpen && categoryId !== 'structure' && categoryId !== 'sections') {
                section.style.display = 'none';
                section.setAttribute('aria-hidden', 'true');
                this._setAccordionState(categoryId, false);
            } else {
                section.style.display = '';
                section.setAttribute('aria-hidden', 'false');
            }
        });

        if (effective) {
            this._setAccordionState('structure', true);
            this._setAccordionState('sections', true);
            this._ensureAccordionGadgetInitialized('structure');
            this._ensureAccordionGadgetInitialized('sections');
            if (this._writingFocusSettingsOpen) {
                // 設定表示はノイズ削減のため structure のみ初期展開
                this.accordionCategories.forEach((category) => {
                    if (category.id !== 'structure') this._setAccordionState(category.id, false);
                });
            }
            const structurePanel = document.getElementById('structure-gadgets-panel');
            if (structurePanel) {
                structurePanel.style.display = this._writingFocusSettingsOpen ? '' : 'none';
            }
            return;
        }

        const savedState = this._loadAccordionState();
        const hasAnyExpanded = this.accordionCategories.some((category) => !!savedState[category.id]);
        this.accordionCategories.forEach((category) => {
            const isExpanded = savedState[category.id] !== undefined
                ? savedState[category.id]
                : category.defaultExpanded;
            this._setAccordionState(category.id, isExpanded);
        });
        if (!hasAnyExpanded) {
            this._setAccordionState('structure', true);
        }
    }

    _scheduleWritingFocusRender() {
        if (this._writingFocusRenderTimer) clearTimeout(this._writingFocusRenderTimer);
        this._writingFocusRenderTimer = setTimeout(() => {
            this._applyWritingFocusSidebar();
            this._renderWritingFocusNavigator();
        }, 80);
    }

    _parseMarkdownHeadings(text) {
        const source = String(text || '');
        const headingPattern = /^(#{1,6})\s+(.+)$/gm;
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
        const editor = document.getElementById('editor');
        if (!editor) return;

        // WYSIWYG mode: sync content to textarea before operating
        const rte = window.richTextEditor || (window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor);
        const isWysiwyg = rte && rte.isWysiwygMode;
        if (isWysiwyg && typeof rte.syncToMarkdown === 'function') {
            rte.syncToMarkdown();
        }

        const parsed = this._parseMarkdownHeadings(editor.value || '');
        const context = this._getWritingFocusContext(editor, parsed);
        const currentChapter = context.activeChapter;
        // WYSIWYG mode: cursor position unreliable, insert at end (chapter level)
        const insideChapter = isWysiwyg
            ? false
            : !!(currentChapter && context.cursor > currentChapter.index && context.cursor < currentChapter.endIndex);
        const level = Math.max(1, Math.min(6, insideChapter ? parsed.sceneLevel : parsed.chapterLevel));
        const marks = '#'.repeat(level);
        const sectionLabel = insideChapter ? '新しいシーン' : '新しい章';
        const label = `${marks} ${sectionLabel}`;
        const start = isWysiwyg
            ? editor.value.length
            : (typeof editor.selectionStart === 'number' ? editor.selectionStart : editor.value.length);
        const needsLeadingBreak = start > 0 && editor.value.charAt(start - 1) !== '\n';
        const insertion = `${needsLeadingBreak ? '\n' : ''}${label}\n\n`;
        const before = editor.value.slice(0, start);
        const after = editor.value.slice(start);
        editor.value = before + insertion + after;
        const nextCaret = before.length + insertion.length;
        editor.selectionStart = nextCaret;
        editor.selectionEnd = nextCaret;
        editor.dispatchEvent(new Event('input', { bubbles: true }));

        // WYSIWYG mode: sync textarea back to WYSIWYG editor
        if (isWysiwyg && typeof rte.setContent === 'function') {
            rte.setContent(editor.value);
            // 新セクションへジャンプ (コラプス適用 + スクロール)
            var sc = window.ZWSectionCollapse;
            if (sc && typeof sc.jumpToIndex === 'function') {
                sc.jumpToIndex(-1); // 末尾 = 新しく追加したセクション
            }
        } else {
            editor.focus();
        }

        this._scheduleWritingFocusRender();
    }

    _escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
        try {
            const storage = window.ZenWriterStorage;
            const docs = storage && typeof storage.loadDocuments === 'function' ? (storage.loadDocuments() || []) : [];
            const cur = storage && typeof storage.getCurrentDocId === 'function' ? storage.getCurrentDocId() : null;
            const doc = docs.find((d) => d && d.id === cur);
            if (doc && doc.name) docName = doc.name;
        } catch (_) { }

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
            return `<button type="button" class="writing-focus-chip${activeClass}" data-wf-chapter-index="${idx}">${this._escapeHtml(ch.title)}</button>`;
        }).join('');
        const scenes = activeChapter.scenes || [];
        const activeSceneIndex = context.activeChapterIndex === activeChapterIndex ? context.activeSceneIndex : -1;
        const hasPrevScene = activeSceneIndex > 0;
        const hasNextScene = activeSceneIndex >= 0 && activeSceneIndex < scenes.length - 1;
        const sceneButtons = scenes.map((scene, idx) => {
            const activeClass = idx === activeSceneIndex ? ' is-active' : '';
            return `<button type="button" class="writing-focus-scene${activeClass}" data-wf-jump="${scene.index}"># ${this._escapeHtml(scene.title)}</button>`;
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
                    if (e.propertyName === 'left' || e.propertyName === 'right') {
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
