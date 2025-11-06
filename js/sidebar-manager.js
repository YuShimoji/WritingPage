// SidebarManager: サイドバーとツールバーの管理
class SidebarManager {
    constructor(elementManager) {
        this.elementManager = elementManager;
        // サイドバータブ設定の統一管理（シンプル化：1つのみ）
        this.sidebarTabConfig = [
            {
                id: 'structure',
                label: 'ガジェット',
                icon: '🏗️',
                description: 'ガジェット管理',
                panelId: 'structure-gadgets-panel'
            }
        ];
    }

    forceSidebarState(open) {
        const sidebar = this.elementManager.get('sidebar');
        if (!sidebar) {
            console.error('サイドバー要素が見つかりません');
            return;
        }
        
        console.info(`forceSidebarState(${open}) 実行開始`);
        console.info(`現在の状態: open=${sidebar.classList.contains('open')}, aria-hidden=${sidebar.getAttribute('aria-hidden')}`);
        
        // 閉じる場合、サイドバー内のフォーカスを外部に移動してからaria-hiddenを設定
        if (!open) {
            const activeElement = document.activeElement;
            // サイドバー内にフォーカスがある場合、エディタに移動
            if (sidebar.contains(activeElement)) {
                const editor = this.elementManager.get('editor');
                if (editor) {
                    // フォーカスを移動
                    editor.focus();
                    console.info('サイドバー閉鎖のため、フォーカスをエディタに移動');
                } else {
                    // エディタがない場合はbodyにフォーカス
                    document.body.focus();
                    console.info('サイドバー閉鎖のため、フォーカスをbodyに移動');
                }
            }
        }
        
        // CSSクラスの更新
        if (open) {
            sidebar.classList.add('open');
            document.documentElement.setAttribute('data-sidebar-open', 'true');
            console.info('サイドバーに .open クラスを追加');
        } else {
            sidebar.classList.remove('open');
            document.documentElement.removeAttribute('data-sidebar-open');
            console.info('サイドバーから .open クラスを削除');
        }
        
        // ツールバー側の閉じるボタンの表示制御
        const toolbarCloseSidebar = this.elementManager.get('toolbarCloseSidebar');
        if (toolbarCloseSidebar) {
            toolbarCloseSidebar.style.display = ''; // 常に表示
            console.info(`ツールバーの閉じるボタン: 表示`);
        }
        
        // aria-hiddenはフォーカス移動後に設定（requestAnimationFrameで次のフレームで実行）
        requestAnimationFrame(() => {
            sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
            console.info(`サイドバー aria-hidden="${open ? 'false' : 'true'}" を設定`);
            console.info(`最終状態: open=${sidebar.classList.contains('open')}, left=${getComputedStyle(sidebar).left}`);
        });
    }

    toggleSidebar() {
        const sidebar = this.elementManager.get('sidebar');
        if (!sidebar) return;
        const willOpen = !sidebar.classList.contains('open');
        console.info(`サイドバーを${willOpen ? '開く' : '閉じる'}`);
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

    applyTabsPresentationUI() {
        try {
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
                activateSidebarGroup(gid);
            }
        } catch(_) {}
    }

    formatTs(ts) {
        const d = new Date(ts);
        const p = (n)=> String(n).padStart(2,'0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }

    activateSidebarGroup(groupId) {
        if (!groupId || !window.elementManager) {
            console.warn('activateSidebarGroup: groupId または elementManager が存在しません');
            return;
        }

        // タブ設定から有効なgroupIdかチェック
        const tabConfig = this.sidebarTabConfig.find(tab => tab.id === groupId);
        if (!tabConfig) {
            console.warn(`Unknown sidebar group: ${groupId}`);
            return;
        }

        // 現在のactive groupを取得
        const currentActiveTab = document.querySelector('.sidebar-tab.active');
        const currentGroupId = currentActiveTab ? currentActiveTab.dataset.group : null;
        if (currentGroupId === groupId) {
            console.info(`Tab "${groupId}" is already active`);
            return; // すでにactiveならスキップ
        }

        console.info(`Switching tab from "${currentGroupId}" to "${groupId}"`);

        const sidebarTabs = window.elementManager.getMultiple('sidebarTabs');
        const sidebarGroups = window.elementManager.getMultiple('sidebarGroups');
        
        console.info('Tab switch elements:', {
            tabsCount: sidebarTabs.length,
            groupsCount: sidebarGroups.length
        });

        // タブのアクティブ状態を更新
        sidebarTabs.forEach(tab => {
            const isActive = tab.dataset.group === groupId;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // グループパネルの表示状態を更新
        sidebarGroups.forEach(section => {
            const isActive = section.dataset.group === groupId;
            section.classList.toggle('active', isActive);
            section.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        // ZWGadgetsに通知（ガジェットの再レンダリングをトリガー）
        if (window.ZWGadgets && typeof window.ZWGadgets.setActiveGroup === 'function') {
            console.info(`ZWGadgets.setActiveGroup("${groupId}") を呼び出し`);
            try {
                window.ZWGadgets.setActiveGroup(groupId);
                // ガジェットのレンダリングを強制実行
                if (typeof window.ZWGadgets._renderLast === 'function') {
                    window.ZWGadgets._renderLast();
                    console.info('ガジェットのレンダリングを強制実行');
                }
            } catch (e) {
                console.error('ZWGadgets.setActiveGroup でエラー:', e);
            }
        } else {
            console.warn('ZWGadgets が利用できません');
        }

        // プレゼンテーション方式に合わせてUI反映
        this.applyTabsPresentationUI();
    }
}

// グローバルに公開
window.SidebarManager = SidebarManager;
