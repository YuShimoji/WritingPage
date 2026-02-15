// app-hud.js — HUD管理関数
// app.js から分離。DOMContentLoaded 後に initAppHud(deps) を呼び出す。
(function () {
    'use strict';

    /**
     * HUD管理を初期化し、関数群を返す
     * @param {Object} deps
     * @param {Object} deps.elementManager
     * @returns {Object} HUD管理関数群
     */
    function initAppHud(deps) {
        const { elementManager } = deps;

        function loadHudSettings() {
            try {
                const s = window.ZenWriterStorage.loadSettings();
                return (s && s.hud) ? Object.assign({}, s.hud) : {};
            } catch (_) {
                return {};
            }
        }

        function saveHudSettings(patch) {
            updateSettingsPatch('hud', patch, () => {
                if (window.ZenWriterHUD && typeof window.ZenWriterHUD.applyConfig === 'function') {
                    const s = window.ZenWriterStorage.loadSettings();
                    window.ZenWriterHUD.applyConfig(s.hud || {});
                }
            });
        }

        function hudElement() {
            if (!window.ZenWriterHUD) return null;
            try { return window.ZenWriterHUD.el || null; } catch (_) { return null; }
        }

        function syncHudQuickControls() {
            const hudCfg = loadHudSettings();
            const hudEl = hudElement();
            const isVisible = !!(hudEl && hudEl.classList.contains('show'));
            const hudToggleVisibilityBtn = elementManager.get('hudToggleVisibility');
            const hudPinToggleBtn = elementManager.get('hudPinToggle');
            if (hudToggleVisibilityBtn) {
                hudToggleVisibilityBtn.textContent = isVisible ?
                    (window.UILabels ? window.UILabels.HUD_HIDE : 'HUDを隠す') :
                    (window.UILabels ? window.UILabels.HUD_SHOW : 'HUDを表示');
            }
            if (hudPinToggleBtn) {
                hudPinToggleBtn.textContent = hudCfg.pinned ?
                    (window.UILabels ? window.UILabels.HUD_PIN_OFF : 'HUDピン解除') :
                    (window.UILabels ? window.UILabels.HUD_PIN_ON : 'HUDピン固定');
            }
        }

        function toggleHudVisibility(forceShow) {
            if (forceShow === undefined) forceShow = null;
            if (!window.ZenWriterHUD) return;
            const hudEl = hudElement();
            const currentlyVisible = !!(hudEl && hudEl.classList.contains('show'));
            const shouldShow = forceShow !== null ? !!forceShow : !currentlyVisible;
            if (shouldShow) {
                const cfg = loadHudSettings();
                const message = cfg.message || window.ZenWriterHUD.defaultMessage || 'HUDを表示しました';
                try {
                    window.ZenWriterHUD.publish(message, cfg.duration || null, { persistMessage: true });
                } catch (_) { }
                if (cfg.pinned && typeof window.ZenWriterHUD.pin === 'function') {
                    window.ZenWriterHUD.pin();
                }
            } else {
                if (typeof window.ZenWriterHUD.hide === 'function') {
                    window.ZenWriterHUD.hide();
                }
            }
            syncHudQuickControls();
        }

        function toggleHudPinned() {
            const cfg = loadHudSettings();
            const nextPinned = !cfg.pinned;
            saveHudSettings({ pinned: nextPinned });
            if (window.ZenWriterHUD) {
                try {
                    if (nextPinned && typeof window.ZenWriterHUD.pin === 'function') {
                        window.ZenWriterHUD.pin();
                        toggleHudVisibility(true);
                    } else if (!nextPinned && typeof window.ZenWriterHUD.unpin === 'function') {
                        window.ZenWriterHUD.unpin();
                    }
                } catch (_) { }
            }
            syncHudQuickControls();
        }

        function refreshHudFromSettings() {
            if (window.ZenWriterHUD) {
                try {
                    if (typeof window.ZenWriterHUD.updateFromSettings === 'function') {
                        window.ZenWriterHUD.updateFromSettings();
                    } else if (typeof window.ZenWriterHUD.refresh === 'function') {
                        window.ZenWriterHUD.refresh();
                    }
                } catch (_) { }
            }
            syncHudQuickControls();
        }

        // updateSettingsPatch を参照（app.js から公開される）
        function updateSettingsPatch(key, patch, callback) {
            const s = window.ZenWriterStorage.loadSettings();
            s[key] = { ...(s[key] || {}), ...patch };
            window.ZenWriterStorage.saveSettings(s);
            if (callback) callback();
        }

        // ボタンイベント接続
        const hudToggleVisibilityBtn = elementManager.get('hudToggleVisibility');
        const hudPinToggleBtn = elementManager.get('hudPinToggle');
        const hudRefreshBtn = elementManager.get('hudRefresh');
        if (hudToggleVisibilityBtn) hudToggleVisibilityBtn.addEventListener('click', () => toggleHudVisibility());
        if (hudPinToggleBtn) hudPinToggleBtn.addEventListener('click', () => toggleHudPinned());
        if (hudRefreshBtn) hudRefreshBtn.addEventListener('click', () => refreshHudFromSettings());

        // 初期同期
        syncHudQuickControls();

        return {
            syncHudQuickControls,
            toggleHudVisibility,
            toggleHudPinned,
            refreshHudFromSettings
        };
    }

    window.initAppHud = initAppHud;
})();
