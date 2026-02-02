// SettingsManager: 設定の管理とUI反映
class SettingsManager {
    constructor(elementManager) {
        this.elementManager = elementManager;
    }

    applySettingsToUI() {
        const settings = window.ZenWriterStorage.loadSettings();

        // テーマプリセットを選択
        const themePresets = this.elementManager.getMultiple('themePresets');
        themePresets.forEach(btn => {
            if (btn.dataset.theme === settings.theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // カラーピッカーを設定
        const bgColorInput = this.elementManager.get('bgColorInput');
        const textColorInput = this.elementManager.get('textColorInput');
        if (bgColorInput) bgColorInput.value = settings.bgColor;
        if (textColorInput) textColorInput.value = settings.textColor;

        // フォント設定を設定
        const fontFamilySelect = this.elementManager.get('fontFamilySelect');
        const fontSizeInput = this.elementManager.get('fontSizeInput');
        const fontSizeValue = this.elementManager.get('fontSizeValue');
        if (fontFamilySelect) fontFamilySelect.value = settings.fontFamily;
        if (fontSizeInput) {
            fontSizeInput.value = settings.fontSize;
            if (fontSizeValue) fontSizeValue.textContent = settings.fontSize;
        }
        const lineHeightInput = this.elementManager.get('lineHeightInput');
        const lineHeightValue = this.elementManager.get('lineHeightValue');
        if (lineHeightInput) {
            lineHeightInput.value = settings.lineHeight;
            if (lineHeightValue) lineHeightValue.textContent = settings.lineHeight;
        }
        // ツールバー表示状態
        if (typeof settings.toolbarVisible !== 'undefined') {
            window.sidebarManager.setToolbarVisibility(!!settings.toolbarVisible);
        }

        // サイドバー表示状態
        if (typeof settings.sidebarVisible !== 'undefined') {
            window.sidebarManager.forceSidebarState(!!settings.sidebarVisible);
        }

        // 執筆目標の初期反映
        const goal = settings.goal || {};
        const goalTargetInput = this.elementManager.get('goalTargetInput');
        const goalDeadlineInput = this.elementManager.get('goalDeadlineInput');
        if (goalTargetInput) goalTargetInput.value = (typeof goal.target === 'number' ? goal.target : parseInt(goal.target,10) || 0);
        if (goalDeadlineInput) goalDeadlineInput.value = goal.deadline || '';

        // Typewriter 設定の初期反映
        const tw = settings.typewriter || {};
        const typewriterEnabled = this.elementManager.get('typewriterEnabled');
        const typewriterAnchor = this.elementManager.get('typewriterAnchor');
        const typewriterStickiness = this.elementManager.get('typewriterStickiness');
        if (typewriterEnabled) typewriterEnabled.checked = !!tw.enabled;
        if (typewriterAnchor) typewriterAnchor.value = String((typeof tw.anchorRatio === 'number' ? tw.anchorRatio : 0.5));
        if (typewriterStickiness) typewriterStickiness.value = String((typeof tw.stickiness === 'number' ? tw.stickiness : 0.9));

        // Snapshot 設定の初期反映
        const snap = settings.snapshot || {};
        const snapshotInterval = this.elementManager.get('snapshotInterval');
        const snapshotDelta = this.elementManager.get('snapshotDelta');
        const snapshotRetention = this.elementManager.get('snapshotRetention');
        if (snapshotInterval) snapshotInterval.value = String((typeof snap.intervalMs === 'number' ? snap.intervalMs : 120000));
        if (snapshotDelta) snapshotDelta.value = String((typeof snap.deltaChars === 'number' ? snap.deltaChars : 300));
        if (snapshotRetention) snapshotRetention.value = String((typeof snap.retention === 'number' ? snap.retention : 10));

        // Preview 設定の初期反映
        const prev = settings.preview || {};
        const previewSyncScroll = this.elementManager.get('previewSyncScroll');
        if (previewSyncScroll) previewSyncScroll.checked = !!prev.syncScroll;

        // AutoSave 設定の初期反映
        const autoSave = settings.autoSave || {};
        const autoSaveEnabled = this.elementManager.get('autoSaveEnabled');
        const autoSaveDelay = this.elementManager.get('autoSaveDelay');
        if (autoSaveEnabled) autoSaveEnabled.checked = !!autoSave.enabled;
        if (autoSaveDelay) autoSaveDelay.value = String(autoSave.delayMs || 2000);

        // エディタ設定の初期反映
        const editor = settings.editor || {};
        const wordWrap = editor.wordWrap || {};
        const wordWrapEnabled = this.elementManager.get('wordWrapEnabled');
        const wordWrapMaxChars = this.elementManager.get('wordWrapMaxChars');
        if (wordWrapEnabled) wordWrapEnabled.checked = !!wordWrap.enabled;
        if (wordWrapMaxChars) wordWrapMaxChars.value = String(wordWrap.maxChars || 80);

        // エディタレイアウト設定の適用
        const layout = settings.editorLayout || {};
        const editorEl = document.getElementById('editor');
        const containerEl = document.querySelector('.editor-container');
        const maxW = typeof layout.maxWidth === 'number' ? layout.maxWidth : 0;
        const pad = typeof layout.padding === 'number' ? layout.padding : 0;
        if (editorEl) {
            editorEl.style.maxWidth = maxW > 0 ? maxW + 'px' : 'none';
            editorEl.style.padding = pad + 'px';
        }
        if (containerEl) {
            if ((maxW > 0 || pad > 0) && layout.marginBgColor) {
                containerEl.style.backgroundColor = layout.marginBgColor;
            } else {
                // デフォルトはテーマ側の背景色に任せる
                containerEl.style.backgroundColor = '';
            }
        }
    }
}

// グローバルに公開
window.SettingsManager = SettingsManager;
