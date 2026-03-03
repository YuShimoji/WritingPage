// app-settings-handlers.js — 設定UIハンドラ（目標/タイプライター/スナップショット/プレビュー/自動保存/エディタ）
// app.js から分離。DOMContentLoaded 後に initAppSettingsHandlers(deps) を呼び出す。
(function () {
    'use strict';

    /**
     * 設定UIハンドラを初期化
     * @param {Object} deps
     * @param {Object} deps.elementManager
     */
    function initAppSettingsHandlers(deps) {
        const { elementManager } = deps;

        // ------- 設定更新用共通ヘルパー -------
        function updateSettingsPatch(key, patch, callback) {
            const s = window.ZenWriterStorage.loadSettings();
            s[key] = { ...(s[key] || {}), ...patch };
            window.ZenWriterStorage.saveSettings(s);
            if (callback) callback();
        }

        // clamp helpers
        const clamp = (val, min, max, def) => {
            const n = typeof val === 'number' ? val : parseFloat(val);
            if (isNaN(n)) return def;
            return Math.max(min, Math.min(max, n));
        };

        // ------- 執筆目標（goal） -------
        function saveGoalPatch(patch) {
            updateSettingsPatch('goal', patch, () => {
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.updateWordCount === 'function') {
                    window.ZenWriterEditor.updateWordCount();
                }
            });
        }

        // ------- Editor 設定（typewriter / snapshot / preview） -------
        function saveTypewriterPatch(patch) {
            updateSettingsPatch('typewriter', patch);
        }
        function saveSnapshotPatch(patch) {
            updateSettingsPatch('snapshot', patch);
        }
        function savePreviewPatch(patch) {
            updateSettingsPatch('preview', patch);
        }
        function saveAutoSavePatch(patch) {
            updateSettingsPatch('autoSave', patch);
        }
        function saveEditorPatch(patch) {
            const s = window.ZenWriterStorage.loadSettings();
            s.editor = { ...(s.editor || {}), ...patch };
            s.editor.wordWrap = { ...(s.editor.wordWrap || {}), ...(patch.wordWrap || {}) };
            window.ZenWriterStorage.saveSettings(s);
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyWordWrap === 'function') {
                window.ZenWriterEditor.applyWordWrap();
            }
        }

        // リアルタイム自動保存設定の初期値反映
        const autoSaveEnabled = elementManager.get('autoSaveEnabled');
        const autoSaveDelay = elementManager.get('autoSaveDelay');
        const currentSettings = window.ZenWriterStorage.loadSettings();
        const currentAutoSave = (currentSettings && currentSettings.autoSave) || {};
        if (autoSaveEnabled) autoSaveEnabled.checked = !!currentAutoSave.enabled;
        if (autoSaveDelay) autoSaveDelay.value = String(currentAutoSave.delayMs || 2000);

        // =========================================================
        // Event delegation for dynamically-rendered gadget elements
        // (typewriter, focus mode, snapshot, preview, auto-save)
        // These elements are created by ZWGadgets after this module
        // runs, so we attach listeners to document instead.
        // =========================================================
        document.addEventListener('change', function (e) {
            const id = e.target && e.target.id;
            if (!id) return;

            // Typewriter
            if (id === 'typewriter-enabled') {
                saveTypewriterPatch({ enabled: !!e.target.checked });
                try { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyTypewriterIfEnabled === 'function') window.ZenWriterEditor.applyTypewriterIfEnabled(); } catch (_) { }
                return;
            }
            if (id === 'typewriter-anchor-ratio') {
                saveTypewriterPatch({ anchorRatio: clamp(e.target.value, 0.05, 0.95, 0.5) });
                return;
            }
            if (id === 'typewriter-stickiness') {
                saveTypewriterPatch({ stickiness: clamp(e.target.value, 0, 1, 0.9) });
                return;
            }

            // Focus Mode
            if (id === 'focus-mode-enabled') {
                updateSettingsPatch('focusMode', { enabled: !!e.target.checked });
                try { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.scheduleFocusModeUpdate === 'function') window.ZenWriterEditor.scheduleFocusModeUpdate(); } catch (_) { }
                return;
            }

            // Snapshot
            if (id === 'snapshot-interval-ms') {
                saveSnapshotPatch({ intervalMs: Math.round(clamp(e.target.value, 30000, 300000, 120000)) });
                return;
            }
            if (id === 'snapshot-delta-chars') {
                saveSnapshotPatch({ deltaChars: Math.round(clamp(e.target.value, 50, 1000, 300)) });
                return;
            }
            if (id === 'snapshot-retention') {
                saveSnapshotPatch({ retention: Math.round(clamp(e.target.value, 1, 50, 10)) });
                return;
            }

            // Auto-save (also dynamically rendered)
            if (id === 'auto-save-enabled') {
                saveAutoSavePatch({ enabled: !!e.target.checked });
                return;
            }
            if (id === 'auto-save-delay-ms') {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) saveAutoSavePatch({ delayMs: Math.max(500, Math.min(30000, val)) });
                return;
            }
        });

        // input event delegation (for range sliders)
        document.addEventListener('input', function (e) {
            const id = e.target && e.target.id;
            if (!id) return;
            if (id === 'typewriter-anchor-ratio') {
                saveTypewriterPatch({ anchorRatio: clamp(e.target.value, 0.05, 0.95, 0.5) });
            } else if (id === 'typewriter-stickiness') {
                saveTypewriterPatch({ stickiness: clamp(e.target.value, 0, 1, 0.9) });
            } else if (id === 'snapshot-interval-ms') {
                saveSnapshotPatch({ intervalMs: Math.round(clamp(e.target.value, 30000, 300000, 120000)) });
            } else if (id === 'snapshot-delta-chars') {
                saveSnapshotPatch({ deltaChars: Math.round(clamp(e.target.value, 50, 1000, 300)) });
            } else if (id === 'snapshot-retention') {
                saveSnapshotPatch({ retention: Math.round(clamp(e.target.value, 1, 50, 10)) });
            }
        });

        // Preview handlers
        const previewSyncScroll = elementManager.get('previewSyncScroll');
        if (previewSyncScroll) {
            previewSyncScroll.addEventListener('change', (e) => savePreviewPatch({ syncScroll: !!e.target.checked }));
        }

        // Goal handlers
        const goalTargetInput = elementManager.get('goalTargetInput');
        const goalDeadlineInput = elementManager.get('goalDeadlineInput');
        try {
            const s = window.ZenWriterStorage.loadSettings();
            const g = (s && s.goal) || {};
            if (goalTargetInput) goalTargetInput.value = (parseInt(g.target, 10) || 0) || '';
            if (goalDeadlineInput) goalDeadlineInput.value = g.deadline || '';
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.updateWordCount === 'function') {
                window.ZenWriterEditor.updateWordCount();
            }
        } catch (_) { }
        if (goalTargetInput) {
            const clampTarget = (v) => Math.max(0, parseInt(v, 10) || 0);
            goalTargetInput.addEventListener('input', (e) => saveGoalPatch({ target: clampTarget(e.target.value) }));
            goalTargetInput.addEventListener('change', (e) => saveGoalPatch({ target: clampTarget(e.target.value) }));
        }
        if (goalDeadlineInput) {
            goalDeadlineInput.addEventListener('change', (e) => saveGoalPatch({ deadline: (e.target.value || '') || null }));
        }

        // AutoSave handlers
        if (autoSaveEnabled) {
            autoSaveEnabled.addEventListener('change', (e) => saveAutoSavePatch({ enabled: !!e.target.checked }));
        }

        // Editor settings handlers
        const wordWrapEnabled = elementManager.get('wordWrapEnabled');
        const wordWrapMaxChars = elementManager.get('wordWrapMaxChars');
        if (wordWrapEnabled) {
            wordWrapEnabled.addEventListener('change', (e) => saveEditorPatch({ wordWrap: { enabled: !!e.target.checked } }));
        }
        if (wordWrapMaxChars) {
            const onChange = (e) => saveEditorPatch({ wordWrap: { maxChars: Math.round(clamp(e.target.value, 20, 200, 80)) } });
            wordWrapMaxChars.addEventListener('input', onChange);
            wordWrapMaxChars.addEventListener('change', onChange);
        }

        // Font settings
        const fontFamilySelect = elementManager.get('fontFamilySelect');
        const fontSizeInput = elementManager.get('fontSizeInput');
        const fontSizeValue = elementManager.get('fontSizeValue');
        const lineHeightInput = elementManager.get('lineHeightInput');
        const lineHeightValue = elementManager.get('lineHeightValue');
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
                window.ZenWriterTheme.applyFontSettings(
                    e.target.value,
                    parseFloat(fontSizeInput.value),
                    parseFloat(lineHeightInput.value)
                );
            });
        }
        if (fontSizeInput) {
            fontSizeInput.addEventListener('input', (e) => {
                if (fontSizeValue) fontSizeValue.textContent = e.target.value;
                window.ZenWriterTheme.applyFontSettings(
                    fontFamilySelect.value,
                    parseFloat(e.target.value),
                    parseFloat(lineHeightInput.value)
                );
            });
        }
        if (lineHeightInput) {
            lineHeightInput.addEventListener('input', (e) => {
                if (lineHeightValue) lineHeightValue.textContent = e.target.value;
                window.ZenWriterTheme.applyFontSettings(
                    fontFamilySelect.value,
                    parseFloat(fontSizeInput.value),
                    parseFloat(e.target.value)
                );
            });
        }

        // Theme presets
        const themePresets = elementManager.getMultiple('themePresets');
        themePresets.forEach(btn => {
            btn.addEventListener('click', () => {
                window.ZenWriterTheme.applyTheme(btn.dataset.theme);
                window.ZenWriterTheme.clearCustomColors();
                if (window.settingsManager && typeof window.settingsManager.applySettingsToUI === 'function') {
                    window.settingsManager.applySettingsToUI();
                }
            });
        });

        const toggleThemeBtn = elementManager.get('toggleThemeBtn');
        if (toggleThemeBtn) {
            toggleThemeBtn.addEventListener('click', () => {
                try {
                    const order = ['light', 'dark', 'sepia'];
                    const cs = window.ZenWriterStorage.loadSettings();
                    const currentTheme = (cs && cs.theme) || 'light';
                    const currentIndex = order.indexOf(currentTheme);
                    const nextTheme = order[(currentIndex + 1 + order.length) % order.length];
                    window.ZenWriterTheme.applyTheme(nextTheme);
                    window.ZenWriterTheme.clearCustomColors();
                    if (window.settingsManager && typeof window.settingsManager.applySettingsToUI === 'function') {
                        window.settingsManager.applySettingsToUI();
                    }
                } catch (_) { }
            });
        }

        // カラーピッカー
        const bgColorInput = elementManager.get('bgColorInput');
        const textColorInput = elementManager.get('textColorInput');
        if (bgColorInput) {
            bgColorInput.addEventListener('input', (e) => {
                const text = textColorInput ? textColorInput.value : '#333333';
                window.ZenWriterTheme.applyCustomColors(e.target.value, text, true);
            });
        }
        if (textColorInput) {
            textColorInput.addEventListener('input', (e) => {
                const bg = bgColorInput ? bgColorInput.value : '#ffffff';
                window.ZenWriterTheme.applyCustomColors(bg, e.target.value, true);
            });
        }

        // カスタム色リセット
        const resetColorsBtn = elementManager.get('resetColorsBtn');
        if (resetColorsBtn) {
            resetColorsBtn.addEventListener('click', () => {
                window.ZenWriterTheme.clearCustomColors();
                if (window.settingsManager && typeof window.settingsManager.applySettingsToUI === 'function') {
                    window.settingsManager.applySettingsToUI();
                }
            });
        }

        // Help buttons
        const helpButton = elementManager.get('helpButton');
        if (helpButton) {
            helpButton.addEventListener('click', function () {
                try { window.open('docs/wiki-help.html', '_blank', 'noopener'); } catch (e) { console.error('Failed to open wiki help:', e); }
            });
        }
        const editorHelpButton = elementManager.get('editorHelpButton');
        if (editorHelpButton) {
            editorHelpButton.addEventListener('click', function () {
                try { window.open('docs/editor-help.html', '_blank', 'noopener'); } catch (e) { console.error('Failed to open editor help:', e); }
            });
        }

        return { updateSettingsPatch };
    }

    window.initAppSettingsHandlers = initAppSettingsHandlers;
})();
