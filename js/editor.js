/**
 * editor.js
 * 
 * Main Editor Management Module (Facade)
 * Delegates functionality to EditorCore, EditorUI, EditorSearch, and other sub-modules.
 */
class EditorManager {
    constructor() {
        window.ZenWriterEditor = this;
        this.editor = document.getElementById('editor');
        this.wordCountElement = document.querySelector('.word-count');
        this.goalProgressEl = document.getElementById('goal-progress');
        this.goalProgressBarEl = this.goalProgressEl ? this.goalProgressEl.querySelector('.goal-progress__bar') : null;

        // Change tracking and snapshot state
        this._lastSnapTs = 0;
        this._lastSnapLen = 0;
        this.SNAPSHOT_MIN_INTERVAL = 120000;
        this.SNAPSHOT_MIN_DELTA = 300;
        this._goalReachedNotified = false;
        this.dropIndicatorClass = 'drop-ready';
        this.editorOverlay = document.getElementById('editor-overlay');
        this.editorMirror = document.getElementById('editor-mirror');
        this.inlineStamps = [];
        this.charCountStamps = [];
        this.isCharCountStampsEnabled = true;

        // Dirty Flag tracking
        this._isDirty = false;
        this._baselineHash = null;

        // UI Panels and references
        this.previewPanel = document.getElementById('editor-preview');
        this.previewPanelBody = document.getElementById('editor-preview-body');
        this.markdownPreviewPanel = document.getElementById('markdown-preview-panel');
        this.imagesPreviewPanel = document.getElementById('images-preview-panel');
        this.previewPanelToggle = document.getElementById('toggle-preview');
        this._markdownRenderer = null;
        this.fontDecorationPanel = document.getElementById('font-decoration-panel');
        this.toggleFontDecorationBtn = document.getElementById('toggle-font-decoration');
        this.closeFontDecorationBtn = document.getElementById('close-font-decoration-panel');
        this.textAnimationPanel = document.getElementById('text-animation-panel');
        this.toggleTextAnimationBtn = document.getElementById('toggle-text-animation');
        this.closeTextAnimationBtn = document.getElementById('close-text-animation-panel');
        this.searchPanel = document.getElementById('search-panel');
        this.closeSearchBtn = document.getElementById('close-search-panel');

        // Other specialized managers
        if (typeof window.SpellChecker !== 'undefined') {
            this.spellChecker = new window.SpellChecker(this);
        }

        // Timers and settings
        this._wordCountDebounceTimer = null;
        this._WORD_COUNT_DEBOUNCE_DELAY = 300;
        this._markdownPreviewDebounceTimer = null;
        this._MARKDOWN_PREVIEW_DEBOUNCE_DELAY = 100;
        this._TYPEWRITER_SCROLL_DELAY_MS = 120;
        this._TYPEWRITER_INITIAL_DELAY_MS = 50;
        this._MANUAL_SCROLL_TIMEOUT_MS = 2000;
        this._charStampTimer = null;


        // Initialize components and load content
        this.setupImageHandlers();
        this.setupPreviewPanel();
        this.setupOverlaySupport();
        this.loadContent();
        this._updateWordCountImmediate();
        this.renderImagePreview();
        // this.setupEventListeners(); // Calls EditorUI.setupEventListeners(this)
        this.installTypewriterHandlers();
        this.installFocusModeHandlers();

        // Visual overlay elements
        if (this.editorOverlay) {
            this._wrapGuideEl = document.createElement('div');
            this._wrapGuideEl.className = 'editor-overlay__wrap-guide';
            this.editorOverlay.appendChild(this._wrapGuideEl);

            this._focusDimEl = document.createElement('div');
            this._focusDimEl.className = 'editor-overlay__focus-dim';
            this.editorOverlay.appendChild(this._focusDimEl);

            this._focusLineEl = document.createElement('div');
            this._focusLineEl.className = 'editor-overlay__focus-line';
            this.editorOverlay.appendChild(this._focusLineEl);
        }
        this.applyWordWrap();
        // Initialize modules with this manager instance
        window.EditorUI.setupEventListeners(this);
    }

    // ===== UI and Interaction Methods (Delegated to EditorUI.js) =====
    setupEventListeners() { return window.EditorUI.setupEventListeners(this); }
    updateWordCount() { return window.EditorUI.updateWordCount(this); }
    _updateWordCountImmediate() { return window.EditorUI._updateWordCountImmediate(this); }
    showNotification(msg, dur) { return window.EditorUI.showNotification(this, msg, dur); }
    adjustGlobalFontSize(delta) { return window.EditorUI.adjustGlobalFontSize(this, delta); }
    setGlobalFontSize(size) { return window.EditorUI.setGlobalFontSize(this, size); }
    clampFontSize(px) { return window.EditorUI.clampFontSize(px); }
    applyFontDecoration(tag) { return window.EditorUI.applyFontDecoration(this, tag); }
    applyTextAnimation(tag) { return window.EditorUI.applyTextAnimation(this, tag); }
    toggleFontDecorationPanel() { return window.EditorUI.toggleFontDecorationPanel(this); }
    showFontDecorationPanel() { return window.EditorUI.showFontDecorationPanel(this); }
    hideFontDecorationPanel() { return window.EditorUI.hideFontDecorationPanel(this); }
    toggleTextAnimationPanel() { return window.EditorUI.toggleTextAnimationPanel(this); }
    showTextAnimationPanel() { return window.EditorUI.showTextAnimationPanel(this); }
    hideTextAnimationPanel() { return window.EditorUI.hideTextAnimationPanel(this); }
    updateAnimationSpeed(val) { return window.EditorUI.updateAnimationSpeed(val); }
    updateAnimationDuration(val) { return window.EditorUI.updateAnimationDuration(val); }
    updateAnimationReduceMotion(val) { return window.EditorUI.updateAnimationReduceMotion(val); }
    saveAnimationSettings(patch) { return window.EditorUI.saveAnimationSettings(patch); }
    applyWidthMode(mode) { return window.EditorUI.applyWidthMode(mode); }
    createPreviewCard(args) { return window.EditorUI.createPreviewCard(this, args); }
    updateCharCountStamps() { return window.EditorUI.updateCharCountStamps(this); }

    // ===== Core Editing and Data Methods (Delegated to EditorCore.js) =====
    saveContent() { return window.EditorCore.saveContent(this); }
    loadContent() { return window.EditorCore.loadContent(this); }
    setContent(text) { return window.EditorCore.setContent(this, text); }
    newDocument() { return window.EditorCore.newDocument(this); }
    restoreLastSnapshot() { return window.EditorCore.restoreLastSnapshot(this); }
    markDirty() { return window.EditorCore.markDirty(this); }
    isDirty() { return this._isDirty; }
    refreshDirtyBaseline() { return window.EditorCore.refreshDirtyBaseline(this); }
    _computeContentHash(text) { return window.EditorCore._computeContentHash(text); }
    maybeAutoSnapshot() { return window.EditorCore.maybeAutoSnapshot(this); }
    exportAsText() { return window.EditorCore.exportAsText(this); }
    exportAsMarkdown() { return window.EditorCore.exportAsMarkdown(this); }
    insertTextAtCursor(text, opts) { return window.EditorCore.insertTextAtCursor(this, text, opts); }
    getFormattedDate() { return window.EditorCore.getFormattedDate(this); }
    getCurrentDocBaseName() { return window.EditorCore.getCurrentDocBaseName(this); }
    sanitizeForFilename(s) { return window.EditorCore.sanitizeForFilename(s); }
    insertCharacterStamp() { return window.EditorCore.insertCharacterStamp(this); }
    getCursorPosition() { return window.EditorCore.getCursorPosition(this); }
    getEditorValue() { return window.EditorCore.getEditorValue(this); }
    escapeHtml(text) { return window.EditorCore.escapeHtml(text); }
    processTextAnimations(text) { return window.EditorCore.processTextAnimations(text); }
    processFontDecorations(text) { return window.EditorCore.processFontDecorations(text); }
    persistAssetMeta(id, patch) { return window.EditorCore.persistAssetMeta(this, id, patch); }
    getAsset(id) { return window.EditorCore.getAsset(id); }
    applyAlignmentToImage(img, align) { return window.EditorCore.applyAlignmentToImage(img, align); }
    updateStorageContentAfterMigration(c) { return window.EditorCore.updateStorageContentAfterMigration(c); }

    // ===== Search and Replace Methods (Delegated to EditorSearch.js) =====
    toggleSearchPanel() { return window.EditorSearch.toggleSearchPanel(this); }
    showSearchPanel() { return window.EditorSearch.showSearchPanel(this); }
    hideSearchPanel() { return window.EditorSearch.hideSearchPanel(this); }
    updateSearchMatches() { return window.EditorSearch.updateSearchMatches(this); }
    navigateMatch(dir) { return window.EditorSearch.navigateMatch(this, dir); }
    replaceSingle() { return window.EditorSearch.replaceSingle(this); }
    replaceAll() { return window.EditorSearch.replaceAll(this); }
    getTextPosition(s, e) { return window.EditorSearch.getTextPosition(this, s, e); }
    clearSearchHighlights() { return window.EditorSearch.clearSearchHighlights(this); }

    // ===== External Logic Delegations (Existing Separate Modules) =====
    setupPreviewPanel() { return (typeof editorPreview_setupPreviewPanel === 'function') ? editorPreview_setupPreviewPanel(this) : null; }
    togglePreview() { return (typeof editorPreview_togglePreview === 'function') ? editorPreview_togglePreview(this) : null; }
    renderMarkdownPreview() { return (typeof editorPreview_renderMarkdownPreview === 'function') ? editorPreview_renderMarkdownPreview(this) : null; }
    renderImagePreview() { return (typeof editorImages_renderImagePreview === 'function') ? editorImages_renderImagePreview(this) : null; }
    convertLegacyImageEmbeds(content) { return (typeof editorImages_convertLegacyImageEmbeds === 'function') ? editorImages_convertLegacyImageEmbeds(this, content) : content; }
    renderOverlayImages(entries, content) { return (typeof editorOverlays_renderOverlayImages === 'function') ? editorOverlays_renderOverlayImages(this, entries, content) : null; }
    setupImageHandlers() { return (typeof editorImages_setupImageHandlers === 'function') ? editorImages_setupImageHandlers(this) : null; }
    setupOverlaySupport() { return (typeof editorOverlays_setupOverlaySupport === 'function') ? editorOverlays_setupOverlaySupport(this) : null; }
    applyWordWrap() { return (typeof editorOverlays_applyWordWrap === 'function') ? editorOverlays_applyWordWrap(this) : null; }
    installTypewriterHandlers() { return (typeof typewriter_installHandlers === 'function') ? typewriter_installHandlers(this) : null; }
    scheduleTypewriterUpdate() { return (typeof typewriter_scheduleUpdate === 'function') ? typewriter_scheduleUpdate(this) : null; }
    installFocusModeHandlers() { return (typeof focusMode_installHandlers === 'function') ? focusMode_installHandlers(this) : null; }
    setFocusModeLine(y) { return (typeof focusMode_setLine === 'function') ? focusMode_setLine(this, y) : null; }
}

// Global instantiation
window.ZenWriterEditor = new EditorManager();
