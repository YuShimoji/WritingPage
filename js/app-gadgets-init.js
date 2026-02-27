// app-gadgets-init.js — ガジェット初期化・ロードアウトUI・ツールレジストリ
// app.js から分離。DOMContentLoaded 後に initAppGadgets(deps) を呼び出す。
(function () {
    'use strict';

    /**
     * ガジェット関連を初期化
     * @param {Object} deps
     * @param {Object} deps.logger
     */
    function initAppGadgets(deps) {
        const { logger } = deps;

        // ===== ガジェットの初期化（全パネル） =====
        function initGadgetsWithRetry() {
            let tries = 0;
            const maxTries = 60; // ~3秒
            function tick() {
                tries++;
                if (window.ZWGadgets && typeof window.ZWGadgets.init === 'function') {
                    logger.info('ZWGadgets が利用可能になりました。初期化を開始します');
                    try {
                        const panels = Array.from(document.querySelectorAll('.gadgets-panel[data-gadget-group]'))
                            .map(panel => ({ selector: `#${panel.id}`, group: panel.dataset.gadgetGroup }))
                            .filter(info => info.selector && info.group);

                        if (!panels.length) {
                            logger.warn('初期化対象のガジェットパネルが見つかりません');
                        }

                        const roots = window.ZWGadgets._roots || {};
                        panels.forEach(info => {
                            try {
                                if (roots && roots[info.group]) return;
                                window.ZWGadgets.init(info.selector, { group: info.group });
                                logger.info(`ガジェット初期化完了: ${info.selector}`);
                            } catch (initErr) {
                                logger.error(`ガジェット初期化失敗: ${info.selector}`, initErr);
                            }
                        });

                        if (typeof window.ZWGadgets.setActiveGroup === 'function') {
                            const activeTab = document.querySelector('.sidebar-tab.active');
                            const group = activeTab ? activeTab.getAttribute('data-group') : 'structure';
                            window.ZWGadgets.setActiveGroup(group);
                        }

                        setTimeout(() => {
                            if (typeof window.ZWGadgets._renderLast === 'function') {
                                window.ZWGadgets._renderLast();
                                logger.info('ガジェット初期レンダリング完了（全ガジェット登録済み）');
                            }
                        }, 300);
                    } catch (e) {
                        logger.error('ガジェット初期化エラー:', e);
                    }
                    return;
                }
                if (tries < maxTries) {
                    setTimeout(tick, 50);
                } else {
                    logger.error(`ZWGadgets の初期化に失敗しました（${maxTries}回試行）`);
                }
            }
            tick();
        }

        // ===== ロードアウトUI初期化 =====
        function initLoadoutUI() {
            if (window.ZWLoadoutUI && typeof window.ZWLoadoutUI.refresh === 'function') {
                try {
                    if (window.ZWGadgets && typeof window.ZWGadgets.getActiveLoadout === 'function') {
                        window.ZWGadgets.getActiveLoadout();
                    }
                } catch (_) { }
                try { window.ZWLoadoutUI.refresh(); } catch (_) { }
                return;
            }
            const loadoutSelect = document.getElementById('loadout-select');
            const loadoutName = document.getElementById('loadout-name');
            const loadoutSaveBtn = document.getElementById('loadout-save');
            const loadoutDuplicateBtn = document.getElementById('loadout-duplicate');
            const loadoutApplyBtn = document.getElementById('loadout-apply');
            const loadoutDeleteBtn = document.getElementById('loadout-delete');

            if (!loadoutSelect) return;

            function refreshLoadoutList() {
                if (!window.ZWGadgets) return;
                const active = window.ZWGadgets.getActiveLoadout();
                const data = window.ZWGadgets._ensureLoadouts();
                loadoutSelect.innerHTML = '';
                Object.keys(data.entries || {}).forEach(key => {
                    const entry = data.entries[key];
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = entry.label || key;
                    loadoutSelect.appendChild(opt);
                });
                loadoutSelect.value = active.name || '';
                if (loadoutName) loadoutName.value = active.label || '';
            }

            if (loadoutSaveBtn) {
                loadoutSaveBtn.addEventListener('click', () => {
                    if (!window.ZWGadgets) return;
                    const name = loadoutSelect.value || ('preset-' + Date.now());
                    const label = loadoutName.value || name;
                    const captured = window.ZWGadgets.captureCurrentLoadout(label);
                    window.ZWGadgets.defineLoadout(name, captured);
                    // applyLoadoutを使用（activateLoadoutは存在しない）
                    if (window.ZWGadgets.applyLoadout) {
                        window.ZWGadgets.applyLoadout(name);
                    }
                    refreshLoadoutList();
                    logger.info(`ロードアウト保存: ${label}`);
                });
            }

            if (loadoutDuplicateBtn) {
                loadoutDuplicateBtn.addEventListener('click', () => {
                    if (!window.ZWGadgets) return;
                    const current = window.ZWGadgets.getActiveLoadout();
                    const newName = 'preset-' + Date.now();
                    const newLabel = (loadoutName.value || current.label || '') + 'のコピー';
                    window.ZWGadgets.defineLoadout(newName, { label: newLabel, groups: current.entry.groups });
                    refreshLoadoutList();
                    logger.info(`ロードアウト複製: ${newLabel}`);
                });
            }

            if (loadoutApplyBtn) {
                loadoutApplyBtn.addEventListener('click', () => {
                    if (!window.ZWGadgets) return;
                    const name = loadoutSelect.value;
                    // applyLoadoutを使用（activateLoadoutは存在しない）
                    if (name && window.ZWGadgets.applyLoadout && window.ZWGadgets.applyLoadout(name)) {
                        refreshLoadoutList();
                        logger.info(`ロードアウト適用: ${name}`);
                    }
                });
            }

            if (loadoutDeleteBtn) {
                loadoutDeleteBtn.addEventListener('click', () => {
                    if (!window.ZWGadgets) return;
                    const name = loadoutSelect.value;
                    // ZWGadgets.deleteLoadout() が内部で確認ダイアログを表示するため、ここでは confirm を呼ばない
                    if (name && window.ZWGadgets.deleteLoadout(name)) {
                        refreshLoadoutList();
                        logger.info(`ロードアウト削除: ${name}`);
                    }
                });
            }

            if (loadoutSelect) {
                loadoutSelect.addEventListener('change', () => {
                    const name = loadoutSelect.value;
                    const data = window.ZWGadgets._ensureLoadouts();
                    const entry = data.entries[name];
                    if (loadoutName && entry) loadoutName.value = entry.label || name;
                });
            }

            // 初期リスト生成
            setTimeout(() => {
                refreshLoadoutList();
            }, 500);
        }

        // ===== Selection Tooltip =====
        function initSelectionTooltip() {
            if (typeof window.appEditorBridge_initSelectionTooltip === 'function') {
                window.appEditorBridge_initSelectionTooltip();
            }
        }

        // ===== ツールレジストリからのUI生成 (Header Icons) =====
        function initializeToolsRegistry() {
            if (!window.WritingTools || typeof window.WritingTools.listTools !== 'function') return;

            // 1. Header Icons
            const headerTools = window.WritingTools.listTools({ entrypoint: 'headerIcon' });
            const toolbarActions = document.querySelector('.toolbar-actions');

            if (toolbarActions) {
                const groupTargets = {
                    editor: toolbarActions.querySelector('.toolbar-group[data-group="editor"]'),
                    system: toolbarActions.querySelector('.toolbar-group[data-group="window"]'),
                };

                headerTools.forEach(tool => {
                    if (!tool.domId) return;

                    let btn = document.getElementById(tool.domId);
                    const targetGroup = groupTargets[tool.group] || toolbarActions;
                    // 既存ボタンがない場合は作成
                    if (!btn) {
                        btn = document.createElement('button');
                        btn.id = tool.domId;
                        btn.className = 'icon-button iconified';
                        btn.title = tool.label;
                        btn.setAttribute('aria-label', tool.label);
                        if (tool.group) btn.dataset.toolGroup = tool.group;
                        // 挿入位置: 最後に追加
                        targetGroup.appendChild(btn);
                        logger.info(`Tool button created: ${tool.domId}`);
                    } else if (tool.group) {
                        btn.dataset.toolGroup = tool.group;
                        if (targetGroup && btn.parentElement !== targetGroup) {
                            targetGroup.appendChild(btn);
                        }
                    }

                    // アイコン同期
                    if (tool.icon) {
                        let icon = btn.querySelector('i');
                        if (!icon) {
                            icon = document.createElement('i');
                            icon.setAttribute('aria-hidden', 'true');
                            btn.appendChild(icon);
                        }
                        // 既存のアイコンが異なる場合のみ更新（ちらつき防止）
                        if (icon.getAttribute('data-lucide') !== tool.icon) {
                            icon.setAttribute('data-lucide', tool.icon);
                        }
                    }
                });

                // Lucideアイコンの再レンダリング
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }
        }

        // 全初期化を実行
        initializeToolsRegistry();
        initGadgetsWithRetry();
        initLoadoutUI();
        initSelectionTooltip();
    }

    window.initAppGadgets = initAppGadgets;
})();
