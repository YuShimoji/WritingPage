// エディタ管理クラス
class EditorManager {
    constructor() {
        this.editor = document.getElementById('editor');
        this.wordCountElement = document.querySelector('.word-count');
        this.goalProgressEl = document.getElementById('goal-progress');
        this.goalProgressBarEl = this.goalProgressEl ? this.goalProgressEl.querySelector('.goal-progress__bar') : null;
        // 自動スナップショット用の状態
        this._lastSnapTs = 0;
        this._lastSnapLen = 0;
        this.SNAPSHOT_MIN_INTERVAL = 120000; // 2分
        this.SNAPSHOT_MIN_DELTA = 300; // 300文字以上の変化
        // 目標達成の一時フラグ（再達成の過剰通知を抑止）
        this._goalReachedNotified = false;
        this.dropIndicatorClass = 'drop-ready';
        this.editorOverlay = document.getElementById('editor-overlay');
        this.editorMirror = document.getElementById('editor-mirror');
        this.inlineStamps = [];
        // 文字数スタンプ
        this.charCountStamps = [];
        this.isCharCountStampsEnabled = true;
        // 変更追跡（Dirty Flag）
        this._isDirty = false;
        this._baselineHash = null;
        this.previewPanel = document.getElementById('editor-preview');
        this.previewPanelBody = document.getElementById('editor-preview-body');
        this.markdownPreviewPanel = document.getElementById('markdown-preview-panel');
        this.imagesPreviewPanel = document.getElementById('images-preview-panel');
        this.previewPanelToggle = document.getElementById('toggle-preview');
        this._markdownRenderer = null;
        // フォント装飾パネル
        this.fontDecorationPanel = document.getElementById('font-decoration-panel');
        this.toggleFontDecorationBtn = document.getElementById('toggle-font-decoration');
        this.closeFontDecorationBtn = document.getElementById('close-font-decoration-panel');
        // テキストアニメーションパネル
        this.textAnimationPanel = document.getElementById('text-animation-panel');
        this.toggleTextAnimationBtn = document.getElementById('toggle-text-animation');
        this.closeTextAnimationBtn = document.getElementById('close-text-animation-panel');

        // SearchManagerを初期化
        this.searchManager = new SearchManager(this);
        // 検索パネルのDOM参照をEditorManager側にも保持しておく
        // （Ctrl+F → showSearchPanel() で #search-panel を確実に開くため）
        this.searchPanel = document.getElementById('search-panel');
        this.closeSearchBtn = document.getElementById('close-search-panel');

        // SpellCheckerを初期化
        if (typeof window.SpellChecker !== 'undefined') {
            this.spellChecker = new window.SpellChecker(this);
        }

        // 手動スクロール検知
        this.editor.addEventListener('scroll', () => {
            this._isManualScrolling = true;
            clearTimeout(this._manualScrollTimeout);
            this._manualScrollTimeout = setTimeout(() => {
                this._isManualScrolling = false;
            }, this._MANUAL_SCROLL_TIMEOUT_MS);
        });

        // updateWordCount デバウンスタイマー（長文パフォーマンス改善）
        this._wordCountDebounceTimer = null;
        this._WORD_COUNT_DEBOUNCE_DELAY = 300; // 300ms

        // Markdownプレビューデバウンスタイマー（長文パフォーマンス改善）
        this._markdownPreviewDebounceTimer = null;
        this._MARKDOWN_PREVIEW_DEBOUNCE_DELAY = 100; // 100ms

        // タイプライターモード関連の定数
        this._TYPEWRITER_SCROLL_DELAY_MS = 120; // スクロール後の更新遅延
        this._TYPEWRITER_INITIAL_DELAY_MS = 50; // 初期更新遅延
        this._MANUAL_SCROLL_TIMEOUT_MS = 2000; // 手動スクロール後のタイムアウト

        // 選択変更時に文字数スタンプ更新（デバウンス適用）
        this._charStampTimer = null;
        this.editor.addEventListener('selectionchange', () => {
            this.updateWordCount(); // デバウンス版
            // 文字数スタンプ更新をデバウンス
            if (this._charStampTimer) clearTimeout(this._charStampTimer);
            this._charStampTimer = setTimeout(() => this.updateCharCountStamps(), 100);
        });
        this.setupImageHandlers();
        this.setupPreviewPanel();
        this.setupOverlaySupport();
        this.loadContent();
        this._updateWordCountImmediate(); // 初回は即座に実行
        this.renderImagePreview();
        // イベント配線（パネルボタン、検索、ショートカット等）
        this.setupEventListeners();
        // タイプライターモードのインストール
        this.installTypewriterHandlers();
        // フォーカスモードのインストール
        this.installFocusModeHandlers();
        // 折り返しガイドを設置し、設定に基づき適用
        if (this.editorOverlay) {
            this._wrapGuideEl = document.createElement('div');
            this._wrapGuideEl.className = 'editor-overlay__wrap-guide';
            this.editorOverlay.appendChild(this._wrapGuideEl);
            // フォーカスモード用のオーバーレイ要素を作成
            this._focusDimEl = document.createElement('div');
            this._focusDimEl.className = 'editor-overlay__focus-dim';
            this.editorOverlay.appendChild(this._focusDimEl);
            this._focusLineEl = document.createElement('div');
            this._focusLineEl.className = 'editor-overlay__focus-line';
            this.editorOverlay.appendChild(this._focusLineEl);
        }
        this.applyWordWrap();
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // コンテンツ変更時の自動保存
        this.editor.addEventListener('input', () => {
            this.markDirty();
            this.saveContent();
            this.updateWordCount(); // デバウンス版で高頻度入力に対応
            this.maybeAutoSnapshot();
            this.renderImagePreview();
            this.renderMarkdownPreview(); // デバウンス版で高頻度入力に対応
        });

        // タブキーでインデント
        this.editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertTextAtCursor('\t');
            }
        });

        // 保存ショートカット (Ctrl+S or Cmd+S) - カスタムキーバインド対応
        document.addEventListener('keydown', (e) => {
            // キーバインドシステムが利用可能な場合はそれを使用
            if (window.ZenWriterKeybinds) {
                const keybinds = window.ZenWriterKeybinds.load();
                const keybindId = window.ZenWriterKeybinds.getKeybindIdForEvent(e, keybinds);

                if (keybindId) {
                    switch (keybindId) {
                        case 'editor.save':
                            e.preventDefault();
                            this.saveContent();
                            this.showNotification('保存しました');
                            return;

                        case 'editor.font.increase':
                            e.preventDefault();
                            this.adjustGlobalFontSize(1);
                            return;

                        case 'editor.font.decrease':
                            e.preventDefault();
                            this.adjustGlobalFontSize(-1);
                            return;

                        case 'editor.font.reset':
                            e.preventDefault();
                            const defaults = window.ZenWriterStorage.DEFAULT_SETTINGS;
                            this.setGlobalFontSize(defaults.fontSize);
                            return;

                        case 'editor.bold':
                            e.preventDefault();
                            this.applyFontDecoration('bold');
                            return;

                        case 'editor.italic':
                            e.preventDefault();
                            this.applyFontDecoration('italic');
                            return;

                        case 'search.toggle':
                            e.preventDefault();
                            this.showSearchPanel();
                            return;
                    }
                }
            }

            // フォールバック: 既存のショートカット処理
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveContent();
                this.showNotification('保存しました');
            }

            // フォントサイズ調整ショートカット
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    this.adjustGlobalFontSize(1);
                } else if (e.key === '-') {
                    e.preventDefault();
                    this.adjustGlobalFontSize(-1);
                } else if (e.key === '0') {
                    e.preventDefault();
                    const defaults = window.ZenWriterStorage.DEFAULT_SETTINGS;
                    this.setGlobalFontSize(defaults.fontSize);
                }
            }

            // フォント装飾ショートカット
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b') {
                    e.preventDefault();
                    this.applyFontDecoration('bold');
                } else if (e.key === 'i') {
                    e.preventDefault();
                    this.applyFontDecoration('italic');
                } else if (e.key === 'f') {
                    e.preventDefault();
                    this.showSearchPanel();
                }
            }
        });

        // フォント装飾パネルイベント
        if (this.toggleFontDecorationBtn) {
            this.toggleFontDecorationBtn.addEventListener('click', () => {
                this.toggleFontDecorationPanel();
            });
        }
        if (this.closeFontDecorationBtn) {
            this.closeFontDecorationBtn.addEventListener('click', () => {
                this.hideFontDecorationPanel();
            });
        }

        // テキストアニメーションパネルイベント
        if (this.toggleTextAnimationBtn) {
            this.toggleTextAnimationBtn.addEventListener('click', () => {
                this.toggleTextAnimationPanel();
            });
        }
        if (this.closeTextAnimationBtn) {
            this.closeTextAnimationBtn.addEventListener('click', () => {
                this.hideTextAnimationPanel();
            });
        }

        // 検索パネルイベント
        if (!this.searchManager) {
            if (this.closeSearchBtn) {
                this.closeSearchBtn.addEventListener('click', () => {
                    this.hideSearchPanel();
                });
                this.closeSearchBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.hideSearchPanel();
                    }
                });
            }

            // 検索パネル内のボタンイベント
            const replaceSingleBtn = document.getElementById('replace-single');
            const replaceAllBtn = document.getElementById('replace-all');
            const searchPrevBtn = document.getElementById('search-prev');
            const searchNextBtn = document.getElementById('search-next');
            const searchInput = document.getElementById('search-input');

            if (replaceSingleBtn) {
                replaceSingleBtn.addEventListener('click', () => this.replaceSingle());
            }
            if (replaceAllBtn) {
                replaceAllBtn.addEventListener('click', () => this.replaceAll());
            }
            if (searchPrevBtn) {
                searchPrevBtn.addEventListener('click', () => this.navigateMatch(-1));
            }
            if (searchNextBtn) {
                searchNextBtn.addEventListener('click', () => this.navigateMatch(1));
            }

            // 検索入力のリアルタイム検索
            if (searchInput) {
                let searchTimeout;
                searchInput.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.updateSearchMatches();
                    }, 200); // 200ms遅延で検索
                });
            }
        }

        // フォント装飾ボタンイベント
        const decorButtons = document.querySelectorAll('.decor-btn');
        decorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                if (tag) {
                    // テキストアニメーションパネル内のボタンかどうかを判定
                    const isAnimationBtn = btn.closest('#text-animation-panel') !== null;
                    if (isAnimationBtn) {
                        this.applyTextAnimation(tag);
                    } else {
                        this.applyFontDecoration(tag);
                    }
                }
            });
            // キーボード操作対応（Enter/Space）
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
    }

    // ===== タイプライターモード =====
    installTypewriterHandlers() {
        if (!this.editor) return;
        const onCaretMove = () => this.scheduleTypewriterUpdate();
        this.editor.addEventListener('input', onCaretMove);
        this.editor.addEventListener('keyup', onCaretMove);
        this.editor.addEventListener('click', onCaretMove);
        window.addEventListener('resize', onCaretMove);
        this.editor.addEventListener('scroll', () => {
            this._ty_scrollPending = true;
            clearTimeout(this._ty_scrollTimer);
            this._ty_scrollTimer = setTimeout(() => { this._ty_scrollPending = false; this.scheduleTypewriterUpdate(); }, this._TYPEWRITER_SCROLL_DELAY_MS);
        });
        setTimeout(() => this.scheduleTypewriterUpdate(), this._TYPEWRITER_INITIAL_DELAY_MS);
    }

    scheduleTypewriterUpdate() {
        if (this._ty_scheduled) return;
        this._ty_scheduled = true;
        requestAnimationFrame(() => {
            try { this.applyTypewriterIfEnabled(); } finally { this._ty_scheduled = false; }
        });
    }

    applyTypewriterIfEnabled() {
        try {
            if (!this.editor || !window.ZenWriterStorage || typeof window.ZenWriterStorage.loadSettings !== 'function') return;
            const s = window.ZenWriterStorage.loadSettings();
            const tw = (s && s.typewriter) || {};
            if (!tw.enabled) return;
            const anchor = (typeof tw.anchorRatio === 'number') ? Math.max(0.05, Math.min(0.95, tw.anchorRatio)) : 0.5;
            const sticky = (typeof tw.stickiness === 'number') ? Math.max(0, Math.min(1, tw.stickiness)) : 0.9;

            const style = window.getComputedStyle(this.editor);
            const lineHeight = parseFloat(style.lineHeight) || 20;
            const selStart = this.editor.selectionStart || 0;
            const before = (this.editor.value || '').substring(0, selStart);
            const caretLine = (before.match(/\n/g) || []).length;
            const caretY = caretLine * lineHeight;

            const viewportH = this.editor.clientHeight;
            const currentScroll = this.editor.scrollTop;
            const desiredCenterY = currentScroll + viewportH * anchor;
            const delta = caretY - desiredCenterY;
            const next = Math.max(0, Math.min(this.editor.scrollHeight - viewportH, Math.round(currentScroll + delta * sticky)));
            if (Math.abs(next - currentScroll) > 1) {
                this.editor.scrollTop = next;
            }
        } catch (_) { }
    }

    // ===== フォーカスモード =====
    installFocusModeHandlers() {
        if (!this.editor) return;
        const onCaretMove = () => this.scheduleFocusModeUpdate();
        this.editor.addEventListener('input', onCaretMove);
        this.editor.addEventListener('keyup', onCaretMove);
        this.editor.addEventListener('click', onCaretMove);
        this.editor.addEventListener('scroll', onCaretMove);
        window.addEventListener('resize', onCaretMove);
        // 初期更新
        setTimeout(() => this.scheduleFocusModeUpdate(), 50);
    }

    scheduleFocusModeUpdate() {
        if (this._focus_scheduled) return;
        this._focus_scheduled = true;
        requestAnimationFrame(() => {
            try { this.applyFocusModeIfEnabled(); } finally { this._focus_scheduled = false; }
        });
    }

    applyFocusModeIfEnabled() {
        try {
            if (!this.editor || !window.ZenWriterStorage || typeof window.ZenWriterStorage.loadSettings !== 'function') return;
            const s = window.ZenWriterStorage.loadSettings();
            const fm = (s && s.focusMode) || {};
            if (!fm.enabled) {
                document.documentElement.removeAttribute('data-focus-mode');
                document.documentElement.removeAttribute('data-focus-blur');
                return;
            }

            // フォーカスモードを有効化
            document.documentElement.setAttribute('data-focus-mode', 'enabled');

            // ぼかしの設定
            if (fm.blurRadius && fm.blurRadius > 0) {
                document.documentElement.setAttribute('data-focus-blur', 'enabled');
                document.documentElement.style.setProperty('--focus-blur-radius', `${fm.blurRadius}px`);
            } else {
                document.documentElement.removeAttribute('data-focus-blur');
            }

            // 減光の設定
            const dimOpacity = (typeof fm.dimOpacity === 'number') ? Math.max(0, Math.min(1, fm.dimOpacity)) : 0.3;
            document.documentElement.style.setProperty('--focus-dim-opacity', String(dimOpacity));

            // 現在行の位置を計算
            const style = window.getComputedStyle(this.editor);
            const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.6;
            const selStart = this.editor.selectionStart || 0;
            const before = (this.editor.value || '').substring(0, selStart);
            const caretLine = (before.match(/\n/g) || []).length;

            // エディタのパディングとスクロール位置を考慮
            const paddingTop = parseFloat(style.paddingTop) || 0;
            const scrollTop = this.editor.scrollTop;
            const lineTop = caretLine * lineHeight + paddingTop - scrollTop;

            // CSS変数に設定
            if (this._focusLineEl) {
                this._focusLineEl.style.setProperty('--focus-line-top', `${lineTop}px`);
                this._focusLineEl.style.setProperty('--focus-line-height', `${lineHeight}px`);
                this._focusLineEl.style.transform = `translateY(${lineTop}px)`;
                this._focusLineEl.style.height = `${lineHeight}px`;
            }
        } catch (_) { }
    }

    applyWordWrap() {
        try {
            const s = (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function') ? window.ZenWriterStorage.loadSettings() : {};
            const editor = s.editor || {};
            const wordWrap = editor.wordWrap || {};
            if (!wordWrap.enabled) {
                // 折り返し無効時はガイドを隠す
                if (this._wrapGuideEl) {
                    this._wrapGuideEl.style.display = 'none';
                }
                return;
            }
            const maxChars = (typeof wordWrap.maxChars === 'number') ? Math.max(20, Math.min(200, wordWrap.maxChars)) : 80;
            document.documentElement.style.setProperty('--wrap-ch', maxChars + 'ch');
            // ガイドを表示
            if (this._wrapGuideEl) {
                this._wrapGuideEl.style.display = 'block';
            }
        } catch (_) { }
    }

    /**
     * 文字数スタンプを更新
     */
    updateCharCountStamps() {
        if (!this.isCharCountStampsEnabled || !this.editorOverlay) return;

        // 既存の文字数スタンプを削除
        this.charCountStamps.forEach(stamp => {
            if (stamp.element && stamp.element.parentNode) {
                stamp.element.parentNode.removeChild(stamp.element);
            }
        });
        this.charCountStamps = [];

        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;

        // 選択範囲がない場合は何もしない
        if (start === end) return;

        const selectedText = this.editor.value.substring(start, end);
        const charCount = selectedText.length;

        // 文字数が少ない場合は表示しない
        if (charCount < 10) return;

        // 選択範囲の位置を取得
        const rect = this.getTextPosition(start, end);
        if (!rect) return;

        // スタンプ要素を作成
        const stamp = document.createElement('div');
        stamp.className = 'editor-overlay__char-count-stamp';
        stamp.textContent = `${charCount}文字`;
        stamp.style.left = (rect.left + rect.width + 8) + 'px';
        stamp.style.top = rect.top + 'px';

        this.editorOverlay.appendChild(stamp);
        this.charCountStamps.push({
            element: stamp,
            start: start,
            end: end,
            charCount: charCount
        });
    }
    insertTextAtCursor(text, options = {}) {
        const start = (options && typeof options.start === 'number') ? options.start : this.editor.selectionStart;
        const end = (options && typeof options.end === 'number') ? options.end : this.editor.selectionEnd;
        try {
            this.editor.setRangeText(String(text), start, end, 'end');
        } catch (_) {
            const before = this.editor.value.substring(0, start);
            const after = this.editor.value.substring(end, this.editor.value.length);
            this.editor.value = before + String(text) + after;
            const newPos = start + String(text).length;
            this.editor.selectionStart = newPos;
            this.editor.selectionEnd = newPos;
        }
        this.editor.focus();
        this.saveContent();
        this.updateWordCount();
    }

    getSelectionRange() {
        if (!this.editor) return { start: 0, end: 0 };
        return {
            start: this.editor.selectionStart || 0,
            end: this.editor.selectionEnd || 0
        };
    }

    getSelectedText() {
        if (!this.editor) return '';
        const range = this.getSelectionRange();
        if (range.start === range.end) return '';
        const value = this.editor.value || '';
        return value.substring(range.start, range.end);
    }

    wrapSelection(prefix, suffix = prefix) {
        if (!this.editor) return;
        const el = this.editor;
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        if (start === end) return;
        const value = el.value || '';
        const before = value.slice(0, start);
        const middle = value.slice(start, end);
        const after = value.slice(end);
        el.value = before + prefix + middle + suffix + after;
        const newStart = start + prefix.length;
        const newEnd = newStart + middle.length;
        el.selectionStart = newStart;
        el.selectionEnd = newEnd;
        el.focus();
        this.saveContent();
        this.updateWordCount();
    }

    setupImageHandlers() {
        if (!this.editor) return;
        this.editor.addEventListener('paste', (e) => this.handlePasteEvent(e));
        this.editor.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.editor.addEventListener('dragenter', (e) => this.handleDragOver(e));
        this.editor.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.editor.addEventListener('drop', (e) => this.handleDropEvent(e));
    }

    setupPreviewPanel() {
        if (!this.previewPanel || !this.previewPanelToggle) return;
        // 初期状態をaria-pressedに反映
        const initiallyCollapsed = this.previewPanel.classList.contains('editor-preview--collapsed');
        this.previewPanelToggle.setAttribute('aria-pressed', initiallyCollapsed ? 'false' : 'true');
        this.previewPanelToggle.setAttribute('aria-expanded', initiallyCollapsed ? 'false' : 'true');

        this.previewPanelToggle.addEventListener('click', () => {
            const collapsed = this.previewPanel.classList.toggle('editor-preview--collapsed');
            this.previewPanelToggle.setAttribute('aria-pressed', collapsed ? 'false' : 'true');
            this.previewPanelToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        });
        // キーボード操作対応
        this.previewPanelToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.previewPanelToggle.click();
            }
        });

        // Wikilink クリックハンドラを追加 (TASK_044)
        if (this.markdownPreviewPanel) {
            this.markdownPreviewPanel.addEventListener('click', (e) => {
                const target = e.target.closest('.wikilink');
                if (target) {
                    e.preventDefault();
                    const linkName = decodeURIComponent(target.dataset.wikilink || '');
                    if (linkName && window.ZenWriterWikiAPI && typeof window.ZenWriterWikiAPI.openPageByName === 'function') {
                        window.ZenWriterWikiAPI.openPageByName(linkName);
                    } else {
                        console.warn('Wiki API is not available or linkName is empty');
                    }
                }
            });
        }
    }

    setupOverlaySupport() {
        if (!this.editor || !this.editorOverlay || !this.editorMirror) return;
        const schedule = () => this.scheduleOverlayRefresh();
        this.editor.addEventListener('scroll', schedule);
        window.addEventListener('resize', schedule);
        this._overlayScheduleHandler = schedule;
    }

    handlePasteEvent(event) {
        if (typeof editorImages_handlePasteEvent === 'function') {
            return editorImages_handlePasteEvent(this, event);
        }
    }

    handleDragOver(event) {
        if (typeof editorImages_handleDragOver === 'function') {
            return editorImages_handleDragOver(this, event);
        }
    }

    handleDragLeave(event) {
        if (typeof editorImages_handleDragLeave === 'function') {
            return editorImages_handleDragLeave(this, event);
        }
    }

    handleDropEvent(event) {
        if (typeof editorImages_handleDropEvent === 'function') {
            return editorImages_handleDropEvent(this, event);
        }
    }

    insertImagesSequentially(files, index = 0) {
        if (typeof editorImages_insertImagesSequentially === 'function') {
            return editorImages_insertImagesSequentially(this, files, index);
        }
    }

    insertImageFile(file) {
        if (typeof editorImages_insertImageFile === 'function') {
            return editorImages_insertImageFile(this, file);
        }
        return Promise.resolve();
    }

    buildAssetAwareMarkdown(args) {
        if (typeof editorImages_buildAssetAwareMarkdown === 'function') {
            return editorImages_buildAssetAwareMarkdown(this, args || {});
        }
        return '';
    }

    deriveAltText(fileName) {
        if (typeof editorImages_deriveAltText === 'function') {
            return editorImages_deriveAltText(fileName);
        }
        const base = fileName ? String(fileName).replace(/\.[^.]+$/, '') : 'image';
        const sanitized = base.replace(/[_`*\[\]{}()#!|<>]/g, ' ').trim();
        return sanitized || 'image';
    }

    convertLegacyImageEmbeds(content) {
        if (typeof editorImages_convertLegacyImageEmbeds === 'function') {
            return editorImages_convertLegacyImageEmbeds(this, content);
        }
        return content;
    }

    renderImagePreview() {
        if (typeof editorImages_renderImagePreview === 'function') {
            return editorImages_renderImagePreview(this);
        }
    }

    /**
     * Markdownプレビューのデバウンス版（長文入力時のパフォーマンス改善）
     * 高頻度で呼ばれる input イベント等で使用
     */
    renderMarkdownPreview() {
        editorPreview_renderMarkdownPreview(this);
    }

    /**
     * Markdownプレビューの即時更新（デバウンスなし）
     * setContent/loadContent など初期化時や重要な操作時に使用
     * morphdom による差分適用でスクロール位置・フォーカスを保持
     */
    _renderMarkdownPreviewImmediate() {
        editorPreview_renderMarkdownPreviewImmediate(this);
    }

    createPreviewCard({ assetId, asset, matchIndex }) {
        const card = document.createElement('article');
        card.className = 'preview-image-card';
        card.dataset.assetId = assetId;
        if (asset.hidden) card.classList.add('hidden');

        const toolbar = document.createElement('div');
        toolbar.className = 'preview-image-card__toolbar';

        const title = document.createElement('span');
        title.textContent = asset.name || `画像 ${matchIndex + 1}`;
        toolbar.appendChild(title);

        const actions = document.createElement('div');
        actions.className = 'preview-action-bar';

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'small';
        toggleBtn.textContent = asset.hidden ? '表示する' : '隠す';
        toggleBtn.addEventListener('click', () => {
            this.persistAssetMeta(assetId, { hidden: !asset.hidden });
        });
        actions.appendChild(toggleBtn);

        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'small';
        openBtn.textContent = '別タブで開く';
        openBtn.addEventListener('click', () => {
            const w = window.open(asset.dataUrl, '_blank', 'noopener');
            if (w) w.focus();
        });
        actions.appendChild(openBtn);

        toolbar.appendChild(actions);
        card.appendChild(toolbar);

        const body = document.createElement('div');
        body.className = 'preview-image-card__body';

        const img = document.createElement('img');
        img.src = asset.dataUrl;
        img.alt = asset.name || '';
        img.style.width = `${asset.widthPercent || 60}%`;
        this.applyAlignmentToImage(img, asset.alignment);
        if (asset.hidden) {
            img.style.opacity = '0.25';
        }
        body.appendChild(img);

        const controls = document.createElement('div');
        controls.className = 'preview-image-options';

        const widthRange = document.createElement('input');
        widthRange.type = 'range';
        widthRange.min = '10';
        widthRange.max = '100';
        widthRange.step = '1';
        widthRange.value = String(asset.widthPercent || 60);

        const widthLabel = document.createElement('span');
        widthLabel.textContent = `幅: ${asset.widthPercent || 60}%`;

        widthRange.addEventListener('input', () => {
            const next = parseInt(widthRange.value, 10) || 60;
            widthLabel.textContent = `幅: ${next}%`;
            img.style.width = `${next}%`;
        });
        widthRange.addEventListener('change', () => {
            const next = parseInt(widthRange.value, 10) || 60;
            this.persistAssetMeta(assetId, { widthPercent: next });
        });

        const alignSelect = document.createElement('select');
        const alignOptions = [
            { value: 'auto', label: '自動' },
            { value: 'left', label: '左寄せ' },
            { value: 'center', label: '中央' },
            { value: 'right', label: '右寄せ' }
        ];
        alignOptions.forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            alignSelect.appendChild(option);
        });
        alignSelect.value = asset.alignment || 'auto';
        alignSelect.addEventListener('change', () => {
            this.persistAssetMeta(assetId, { alignment: alignSelect.value });
        });

        controls.appendChild(widthRange);
        controls.appendChild(widthLabel);
        controls.appendChild(alignSelect);

        body.appendChild(controls);
        card.appendChild(body);

        const meta = document.createElement('div');
        meta.className = 'preview-image-meta';
        const typeLabel = asset.type || 'image';
        meta.innerHTML = `<span>ID: ${assetId}</span><span>${typeLabel}</span>`;
        card.appendChild(meta);

        if (asset.hidden) {
            const badge = document.createElement('div');
            badge.className = 'preview-warning';
            badge.style.padding = '0 0.75rem 0.75rem';
            badge.textContent = '非表示状態です。表示する場合は「表示する」をクリックしてください。';
            card.appendChild(badge);
        }

        return card;
    }

    replaceOverlayButtonsWithIcons() {
        if (typeof window.editorOverlays_replaceOverlayButtonsWithIcons === 'function') {
            return window.editorOverlays_replaceOverlayButtonsWithIcons(this);
        }
    }

    scheduleOverlayRefresh() {
        if (typeof window.editorOverlays_scheduleOverlayRefresh === 'function') {
            return window.editorOverlays_scheduleOverlayRefresh(this);
        }
    }

    renderOverlayImages(entries, content) {
        if (typeof window.editorOverlays_renderOverlayImages === 'function') {
            return window.editorOverlays_renderOverlayImages(this, entries, content);
        }
    }

    attachOverlayInteractions(args) {
        if (typeof window.editorOverlays_attachOverlayInteractions === 'function') {
            return window.editorOverlays_attachOverlayInteractions(this, args || {});
        }
    }

    startOverlayDrag(args) {
        if (typeof window.editorOverlays_startOverlayDrag === 'function') {
            return window.editorOverlays_startOverlayDrag(this, args || {});
        }
    }

    startOverlayResize(args) {
        if (typeof window.editorOverlays_startOverlayResize === 'function') {
            return window.editorOverlays_startOverlayResize(this, args || {});
        }
    }

    buildMirrorHtml(content) {
        if (typeof window.editorOverlays_buildMirrorHtml === 'function') {
            return window.editorOverlays_buildMirrorHtml(this, content);
        }
        const safe = this.escapeHtml(content || '');
        return safe.replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return (text || '').replace(/[&<>"']/g, (ch) => map[ch] || ch);
    }

    processTextAnimations(text) {
        if (!text) return text;
        // [fade]text[/fade] -> <span class="anim-fade">text</span>
        // [slide]text[/slide] -> <span class="anim-slide">text</span>
        // [type]text[/type] -> <span class="anim-typewriter">text</span>
        return text
            .replace(/\[fade\](.*?)\[\/fade\]/gi, '<span class="anim-fade">$1</span>')
            .replace(/\[slide\](.*?)\[\/slide\]/gi, '<span class="anim-slide">$1</span>')
            .replace(/\[type\](.*?)\[\/type\]/gi, '<span class="anim-typewriter">$1</span>')
            .replace(/\[pulse\](.*?)\[\/pulse\]/gi, '<span class="anim-pulse">$1</span>')
            .replace(/\[shake\](.*?)\[\/shake\]/gi, '<span class="anim-shake">$1</span>')
            .replace(/\[bounce\](.*?)\[\/bounce\]/gi, '<span class="anim-bounce">$1</span>')
            .replace(/\[fadein\](.*?)\[\/fadein\]/gi, '<span class="anim-fade-in">$1</span>');
    }

    processFontDecorations(text) {
        if (!text) return text;
        // Font decoration tags: [bold]text[/bold], [italic]text[/italic], etc.
        return text
            .replace(/\[bold\](.*?)\[\/bold\]/gi, '<span class="decor-bold">$1</span>')
            .replace(/\[italic\](.*?)\[\/italic\]/gi, '<span class="decor-italic">$1</span>')
            .replace(/\[underline\](.*?)\[\/underline\]/gi, '<span class="decor-underline">$1</span>')
            .replace(/\[strike\](.*?)\[\/strike\]/gi, '<span class="decor-strikethrough">$1</span>')
            .replace(/\[smallcaps\](.*?)\[\/smallcaps\]/gi, '<span class="decor-smallcaps">$1</span>')
            .replace(/\[light\](.*?)\[\/light\]/gi, '<span class="decor-light">$1</span>')
            .replace(/\[shadow\](.*?)\[\/shadow\]/gi, '<span class="decor-shadow">$1</span>')
            .replace(/\[black\](.*?)\[\/black\]/gi, '<span class="decor-black">$1</span>')
            .replace(/\[uppercase\](.*?)\[\/uppercase\]/gi, '<span class="decor-uppercase">$1</span>')
            .replace(/\[lowercase\](.*?)\[\/lowercase\]/gi, '<span class="decor-lowercase">$1</span>')
            .replace(/\[capitalize\](.*?)\[\/capitalize\]/gi, '<span class="decor-capitalize">$1</span>')
            .replace(/\[outline\](.*?)\[\/outline\]/gi, '<span class="decor-outline">$1</span>')
            .replace(/\[glow\](.*?)\[\/glow\]/gi, '<span class="decor-glow">$1</span>')
            .replace(/\[wide\](.*?)\[\/wide\]/gi, '<span class="decor-wide">$1</span>')
            .replace(/\[narrow\](.*?)\[\/narrow\]/gi, '<span class="decor-narrow">$1</span>');
    }

    persistAssetMeta(assetId, patch) {
        if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.updateAssetMeta !== 'function') {
            return;
        }
        window.ZenWriterStorage.updateAssetMeta(assetId, patch || {});
        this.renderImagePreview();
    }

    getAsset(assetId) {
        if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.loadAssets !== 'function') return null;
        const assets = window.ZenWriterStorage.loadAssets();
        return assets ? assets[assetId] : null;
    }

    applyAlignmentToImage(img, alignment) {
        if (!img) return;
        img.style.display = 'block';
        if (!alignment || alignment === 'auto') {
            img.style.margin = '';
            return;
        }
        if (alignment === 'left') {
            img.style.margin = '0 auto 0 0';
        } else if (alignment === 'center') {
            img.style.margin = '0 auto';
        } else if (alignment === 'right') {
            img.style.margin = '0 0 0 auto';
        }
    }

    updateStorageContentAfterMigration(content) {
        try { window.ZenWriterStorage.saveContent(content); } catch (_) { }
        try {
            if (window.ZenWriterStorage.getCurrentDocId && window.ZenWriterStorage.updateDocumentContent) {
                const currentId = window.ZenWriterStorage.getCurrentDocId();
                if (currentId) {
                    window.ZenWriterStorage.updateDocumentContent(currentId, content);
                }
            }
        } catch (_) { }
    }

    /**
     * コンテンツをローカルストレージに保存
     */
    saveContent() {
        try {
            // WYSIWYGモードの場合は内容を同期してから保存
            let content = this.editor.value;
            if (this.richTextEditor && this.richTextEditor.isWysiwygMode) {
                content = this.richTextEditor.getContent();
            }
            window.ZenWriterStorage.saveContent(content);
        } catch (_) { }
        // 自動保存してもベースラインは更新しない（セッション内変更を保持）
    }

    // 変更追跡（Dirty Flag）関連
    _computeContentHash(text) {
        // シンプルなdjb2風ハッシュ（依存なし）
        let h = 5381;
        for (let i = 0; i < text.length; i++) {
            h = ((h << 5) + h) ^ text.charCodeAt(i);
            h |= 0;
        }
        return h >>> 0;
    }

    markDirty() {
        try {
            const cur = this._computeContentHash(this.editor.value || '');
            this._isDirty = (this._baselineHash == null) ? (cur !== 0) : (cur !== this._baselineHash);
        } catch (_) {
            this._isDirty = true;
        }
    }

    isDirty() {
        return !!this._isDirty;
    }

    refreshDirtyBaseline() {
        try {
            this._lastSavedHash = this._computeContentHash(this.editor.value || '');
            this._isDirty = false;
        } catch (_) { }
    }

    maybeAutoSnapshot() {
        if (!window.ZenWriterStorage || !window.ZenWriterStorage.addSnapshot) return;
        const now = Date.now();
        const len = (this.editor.value || '').length;
        if (this._lastSnapTs === 0) {
            // 初回基準
            this._lastSnapTs = now;
            this._lastSnapLen = len;
            return;
        }
        const dt = now - this._lastSnapTs;
        const dlen = Math.abs(len - this._lastSnapLen);
        if (dt >= this.SNAPSHOT_MIN_INTERVAL && dlen >= this.SNAPSHOT_MIN_DELTA) {
            window.ZenWriterStorage.addSnapshot(this.editor.value);
            this._lastSnapTs = now;
            this._lastSnapLen = len;
            if (typeof this.showNotification === 'function') {
                this.showNotification('自動バックアップを保存しました');
            }
        }
    }

    /**
     * ローカルストレージからコンテンツを読み込み
     */
    loadContent() {
        const savedContent = window.ZenWriterStorage.loadContent();
        const processed = this.convertLegacyImageEmbeds(savedContent || '');
        this.editor.value = processed || '';
        // WYSIWYGモードの場合は同期
        if (this.richTextEditor && this.richTextEditor.isWysiwygMode) {
            this.richTextEditor.setContent(processed || '');
        }
        this.renderImagePreview();
        this.refreshDirtyBaseline();
    }

    /**
     * エディタ内容を置き換える（読み込み時など）
     * @param {string} text
     */
    setContent(text) {
        this.editor.value = text || '';
        // WYSIWYGモードの場合は同期
        if (this.richTextEditor && this.richTextEditor.isWysiwygMode) {
            this.richTextEditor.setContent(text || '');
        }
        this.saveContent();
        this._updateWordCountImmediate(); // 即座に実行
        this.renderImagePreview();
        this.refreshDirtyBaseline();
    }

    /**
     * 新しいドキュメントを作成
     */
    newDocument() {
        const msg = (window.UILabels && window.UILabels.EDITOR_NEW_DOC_CONFIRM) || '現在の内容を破棄して新規ドキュメントを作成しますか？';
        if (confirm(msg)) {
            this.editor.value = '';
            this.saveContent();
            this._updateWordCountImmediate(); // 即座に実行
        }
    }

    /**
     * 直近のスナップショットから復元（現在内容は安全のためスナップショットへ退避）
     */
    restoreLastSnapshot() {
        try {
            const snaps = (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSnapshots === 'function')
                ? (window.ZenWriterStorage.loadSnapshots() || [])
                : [];
            if (!snaps.length) {
                if (typeof this.showNotification === 'function') this.showNotification((window.UILabels && window.UILabels.RESTORE_NO_BACKUPS) || '復元できるバックアップがありません');
                return;
            }
            if (!confirm((window.UILabels && window.UILabels.RESTORE_LAST_SNAPSHOT_CONFIRM) || '最後のスナップショットから復元しますか？\n現在の内容はスナップショットとして保存されます。')) return;
            // 現在の内容をまず退避
            if (typeof window.ZenWriterStorage.addSnapshot === 'function') {
                window.ZenWriterStorage.addSnapshot(this.editor.value || '');
            }
            const latest = snaps[0];
            this.setContent(latest && typeof latest.content === 'string' ? latest.content : '');
            if (typeof this.showNotification === 'function') this.showNotification('スナップショットから復元しました');
        } catch (e) {
            try { if (typeof this.showNotification === 'function') this.showNotification((window.UILabels && window.UILabels.RESTORE_FAILED) || '復元に失敗しました'); } catch (_) { }
            console.error(e);
        }
    }

    /**
     * テキストとしてエクスポート
     */
    exportAsText() {
        const content = this.editor.value || ' ';
        const base = this.getCurrentDocBaseName();
        const filename = `${base}_${this.getFormattedDate()}.txt`;
        window.ZenWriterStorage.exportText(content, filename, 'text/plain');
    }

    /**
     * Markdownとしてエクスポート
     */
    exportAsMarkdown() {
        const content = this.editor.value || ' ';
        const base = this.getCurrentDocBaseName();
        const filename = `${base}_${this.getFormattedDate()}.md`;
        window.ZenWriterStorage.exportText(content, filename, 'text/markdown');
    }

    /**
     * 現在日時をフォーマット
     * @returns {string} フォーマットされた日時文字列 (YYYYMMDD_HHMMSS)
     */
    getFormattedDate() {
        const now = new Date();
        const pad = (num) => num.toString().padStart(2, '0');

        const year = now.getFullYear();
        const month = pad(now.getMonth() + 1);
        const day = pad(now.getDate());
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        const seconds = pad(now.getSeconds());

        return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    }

    /**
     * 現在選択中ドキュメントのファイル名ベースを取得（無効文字は置換）
     * @returns {string}
     */
    getCurrentDocBaseName() {
        try {
            if (!window.ZenWriterStorage || !window.ZenWriterStorage.getCurrentDocId) return 'zenwriter';
            const id = window.ZenWriterStorage.getCurrentDocId();
            const docs = window.ZenWriterStorage.loadDocuments ? (window.ZenWriterStorage.loadDocuments() || []) : [];
            const doc = docs.find(d => d && d.id === id);
            const name = (doc && doc.name) ? String(doc.name) : 'zenwriter';
            return this.sanitizeForFilename(name.trim() || 'zenwriter');
        } catch (_) { return 'zenwriter'; }
    }

    /**
     * ファイル名に使えない文字を安全なものに置換
     * @param {string} s
     * @returns {string}
     */
    sanitizeForFilename(s) {
        // Windows禁止文字 \ / : * ? " < > | と制御文字を置換し、連続空白を圧縮
        return s
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/[\x00-\x1F\x7F]/g, '_')
            .replace(/\s+/g, ' ')
            .slice(0, 60) // 長すぎる名前を抑制
            || 'zenwriter';
    }

    /**
     * インライン文字数スタンプを挿入
     */
    insertCharacterStamp() {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        let count = 0;
        let anchorStart = start;
        let anchorEnd = end;
        if (start !== end) {
            const selectedText = this.editor.value.substring(start, end).replace(/\r?\n/g, '');
            count = selectedText.length;
        } else {
            const text = this.editor.value;
            const lines = text.split('\n');
            let currentLine = 0;
            let charPos = 0;
            for (let i = 0; i < lines.length; i++) {
                if (charPos + lines[i].length >= start) {
                    currentLine = i;
                    break;
                }
                charPos += lines[i].length + 1;
            }
            const paragraphText = lines[currentLine] || '';
            count = paragraphText.replace(/\r/g, '').length;
            anchorStart = charPos;
            anchorEnd = charPos + (lines[currentLine] ? lines[currentLine].length : 0);
        }
        const stamp = {
            id: 'stamp_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
            count,
            start: Math.max(0, anchorStart),
            end: Math.max(Math.max(anchorStart, anchorEnd), anchorStart)
        };
        this.inlineStamps.push(stamp);
        this.scheduleOverlayRefresh();
    }

    /**
     * カーソル位置を取得
     */
    getCursorPosition() {
        return this.editor.selectionStart || 0;
    }

    /**
     * updateWordCount のデバウンス版（長文入力時のパフォーマンス改善）
     * 高頻度で呼ばれる input イベント等で使用
     */
    updateWordCount() {
        if (this._wordCountDebounceTimer) {
            clearTimeout(this._wordCountDebounceTimer);
        }
        this._wordCountDebounceTimer = setTimeout(() => {
            this._updateWordCountImmediate();
        }, this._WORD_COUNT_DEBOUNCE_DELAY);
    }

    /**
     * 現在のエディタの値を取得（WYSIWYGモード対応）
     */
    getEditorValue() {
        if (this.richTextEditor && this.richTextEditor.isWysiwygMode) {
            return this.richTextEditor.getContent();
        }
        return this.editor.value || '';
    }

    /**
     * ワードカウント・進捗表示の即時更新（デバウンスなし）
     * setContent/loadContent など初期化時や重要な操作時に使用
     */
    _updateWordCountImmediate() {
        const text = this.getEditorValue();
        // インラインスタンプを除去してカウント
        const cleanText = text.replace(/<span class="inline-stamp">.*?<\/span>/g, '');
        const charCount = cleanText ? cleanText.replace(/\r?\n/g, '').length : 0;

        // [DOCUMENTATION] Word Count Behavior
        // 現在の単語カウントは、英語圏向けの「スペース区切り」による簡易実装（モックアップ）です。
        // 日本語などの非スペース区切り言語では正確な単語数になりません。
        // 将来的には Intl.Segmenter や形態素解析ライブラリ（Kuromoji.js等）の導入を検討してください。
        const wordCount = cleanText.trim() === '' ? 0 : cleanText.trim().split(/\s+/).length;

        // 執筆目標の進捗（任意）
        const settings = window.ZenWriterStorage.loadSettings();
        const goal = (settings && settings.goal) || {};
        const metrics = { charCount, wordCount };
        const progress = {
            // ガジェット相当の有効状態（目標設定もしくは締切設定がある場合に有効とみなす）
            writingGoalEnabled: !!((parseInt(goal.target, 10) || 0) > 0 || (goal.deadline && String(goal.deadline).trim())),
            target: parseInt(goal.target, 10) || 0,
            deadline: goal.deadline || null,
            pct: 0
        };
        try {
            const root = document.documentElement;
            if (progress.writingGoalEnabled) root.setAttribute('data-writing-goal-enabled', 'true');
            else root.removeAttribute('data-writing-goal-enabled');
        } catch (_) { }
        let suffix = '';
        if (progress.writingGoalEnabled && progress.target > 0) {
            const target = Math.max(0, progress.target);
            const ratio = target > 0 ? metrics.charCount / target : 0;
            const pct = Math.floor(ratio * 100);
            progress.pct = pct;
            suffix += ` | 目標 ${target} (${pct}%)`;
            // 進捗バーの表示と更新
            if (this.goalProgressEl && this.goalProgressBarEl) {
                this.goalProgressEl.style.display = 'inline-flex';
                this.goalProgressEl.setAttribute('aria-hidden', 'false');
                const w = Math.max(0, pct);
                this.goalProgressBarEl.style.width = `${Math.min(100, w)}%`;
            }
            // 締切日がある場合は残日数を併記
            if (progress.deadline) {
                const today = new Date();
                const dl = new Date(`${progress.deadline}T00:00:00`);
                const msPerDay = 24 * 60 * 60 * 1000;
                const days = Math.ceil((dl - today) / msPerDay);
                if (!isNaN(days)) {
                    if (days >= 0) suffix += ` | 残り${days}日`;
                    else suffix += ` | 期限超過${Math.abs(days)}日`;
                }
            }
            // 目標達成時の通知（初回のみ）
            if (metrics.charCount >= progress.target) {
                if (!this._goalReachedNotified) {
                    this._goalReachedNotified = true;
                    if (typeof this.showNotification === 'function') {
                        this.showNotification('目標達成！お疲れさまです');
                    }
                    if (window.ZenWriterHUD && typeof window.ZenWriterHUD.publish === 'function') {
                        window.ZenWriterHUD.publish('目標達成！', 1500);
                    }
                }
            } else {
                // 目標未達に戻った場合はフラグをリセット
                this._goalReachedNotified = false;
            }
        } else {
            // 目標未設定時はフラグをリセット
            this._goalReachedNotified = false;
            // 進捗バーを隠す
            if (this.goalProgressEl) {
                this.goalProgressEl.style.display = 'none';
                this.goalProgressEl.setAttribute('aria-hidden', 'true');
            }
        }

        const baseLabel = `${charCount} 文字 / ${wordCount} 語`;
        const fullLabel = `${baseLabel}${suffix}`;
        this.wordCountElement.textContent = baseLabel;
        if (suffix) {
            this.wordCountElement.title = fullLabel;
        } else {
            this.wordCountElement.removeAttribute('title');
        }
        // ミニHUDに一時表示（ツールバー非表示時のみ）
        if (window.ZenWriterHUD) {
            const toolbarHidden = document.body.classList.contains('toolbar-hidden') ||
                document.documentElement.getAttribute('data-toolbar-hidden') === 'true';
            if (toolbarHidden && typeof window.ZenWriterHUD.publish === 'function') {
                // HUD 設定の既定時間に従う（durationを渡さない）
                window.ZenWriterHUD.publish(fullLabel);
            } else if (!toolbarHidden && typeof window.ZenWriterHUD.hide === 'function') {
                window.ZenWriterHUD.hide();
            }
        }

        // Typewriter mode: 手動スクロール中でなければカーソルを中央に保つ
        const typewriterSettings = (settings && settings.typewriter) || {};
        if (typewriterSettings.enabled && !this._isManualScrolling) {
            // タイプライタースクロールをデバウンス
            if (this._typewriterScrollPending) {
                cancelAnimationFrame(this._typewriterScrollPending);
            }

            this._typewriterScrollPending = requestAnimationFrame(() => {
                const anchorRatio = typewriterSettings.anchorRatio || 0.5;
                const lineHeight = parseFloat(getComputedStyle(this.editor).lineHeight) || 20;
                const cursorPos = this.getCursorPosition();
                const cursorLine = this.editor.value.substring(0, cursorPos).split('\n').length - 1;
                const anchorY = anchorRatio * this.editor.clientHeight;
                const cursorY = cursorLine * lineHeight;
                const delta = cursorY - anchorY;
                const newScroll = this.editor.scrollTop + delta;

                // スムーズスクロールを有効化
                const oldBehavior = this.editor.style.scrollBehavior;
                this.editor.style.scrollBehavior = 'smooth';
                this.editor.scrollTop = Math.max(0, newScroll);

                // スクロール完了後に元に戻す
                setTimeout(() => {
                    this.editor.style.scrollBehavior = oldBehavior;
                }, 100);

                this._typewriterScrollPending = null;
            });
        }
        // フォーカスモード: 現在行を追跡（タイプライターモードと併用可能）
        this.scheduleFocusModeUpdate();
        // オーバーレイ（スタンプ等）の再描画
        this.scheduleOverlayRefresh();
    }

    /**
     * 通知を表示
     * @param {string} message - 表示するメッセージ
     * @param {number} duration - 表示時間 (ミリ秒)
     */
    showNotification(message, duration = 2000) {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 通知要素を作成
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        // スタイルを適用
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '1000';
        notification.style.transition = 'opacity 0.3s';

        // ドキュメントに追加
        document.body.appendChild(notification);

        // アニメーション用に少し遅らせる
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);

        // 指定時間後に削除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    /**
     * 現在の設定に対してフォントサイズを増減
     * @param {number} delta 正または負の増分
     */
    adjustGlobalFontSize(delta) {
        const settings = window.ZenWriterStorage.loadSettings();
        const next = this.clampFontSize((settings.fontSize || 16) + delta);
        this.setGlobalFontSize(next);
    }

    /**
     * フォントサイズを指定値に設定し、関連UIを同期
     * @param {number} sizePx
     */
    setGlobalFontSize(sizePx) {
        const settings = window.ZenWriterStorage.loadSettings();
        const next = this.clampFontSize(sizePx);
        window.ZenWriterTheme.applyFontSettings(
            settings.fontFamily,
            next,
            settings.lineHeight
        );
        // UI同期（存在する場合）
        const sidebarRange = document.getElementById('font-size');
        const sidebarValue = document.getElementById('font-size-value');
        if (sidebarRange) sidebarRange.value = next;
        if (sidebarValue) sidebarValue.textContent = next;
        const panelRange = document.getElementById('global-font-size');
        const panelNumber = document.getElementById('global-font-size-number');
        if (panelRange) panelRange.value = next;
        if (panelNumber) panelNumber.value = next;
    }

    clampFontSize(px) {
        return Math.min(48, Math.max(12, Math.round(px)));
    }

    /**
     * 検索パネルを表示/非表示
     */
    toggleSearchPanel() {
        const panel = document.getElementById('search-panel');
        if (!panel) return;
        const isVisible = panel.style.display !== 'none';
        if (isVisible) {
            this.hideSearchPanel();
        } else {
            this.showSearchPanel();
        }
    }

    showSearchPanel() {
        const panel = document.getElementById('search-panel');
        if (!panel) return;
        panel.style.display = 'block';
        const input = document.getElementById('search-input');
        if (input) {
            input.focus();
            // 選択範囲があればそれを検索語に
            const selected = this.editor.value.substring(this.editor.selectionStart, this.editor.selectionEnd);
            if (selected) {
                input.value = selected;
            }
        }
        this.updateSearchMatches();
    }

    // ===== 検索・置換機能（editor-search.js に委譲） =====

    hideSearchPanel() {
        if (typeof window.editorSearch_hideSearchPanel === 'function') {
            window.editorSearch_hideSearchPanel(this);
        }
    }

    updateSearchMatches() {
        if (typeof window.editorSearch_updateSearchMatches === 'function') {
            window.editorSearch_updateSearchMatches(this);
        }
    }

    navigateMatch(direction) {
        if (typeof window.editorSearch_navigateMatch === 'function') {
            window.editorSearch_navigateMatch(this, direction);
        }
    }

    replaceSingle() {
        if (typeof window.editorSearch_replaceSingle === 'function') {
            window.editorSearch_replaceSingle(this);
        }
    }

    replaceAll() {
        if (typeof window.editorSearch_replaceAll === 'function') {
            window.editorSearch_replaceAll(this);
        }
    }

    /**
     * テキスト位置を取得（検索以外からも呼ばれるため残す）
     */
    getTextPosition(start, end) {
        if (typeof window.editorSearch_getTextPosition === 'function') {
            return window.editorSearch_getTextPosition(this, start, end);
        }
        return null;
    }

    /**
     * ハイライトをクリア
     */
    clearSearchHighlights() {
        if (typeof window.editorSearch_clearSearchHighlights === 'function') {
            window.editorSearch_clearSearchHighlights(this);
        }
    }

    /**
     * フォント装飾を適用
     * @param {string} tag - 装飾タグ名
     */
    applyFontDecoration(tag) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const selectedText = this.editor.value.substring(start, end);

        const open = `[${tag}]`;
        const close = `[/${tag}]`;
        const insertion = selectedText ? (open + selectedText + close) : (open + close);
        try {
            // 置換はUndoスタックに乗る
            this.editor.setRangeText(insertion, start, end, 'end');
        } catch (_) {
            this.insertTextAtCursor(insertion, { start, end });
        }
        if (!selectedText) {
            // 選択なし時はカーソルをタグの内側へ移動
            const caret = start + open.length;
            this.editor.selectionStart = caret;
            this.editor.selectionEnd = caret;
        }
        this.editor.focus();
        this.saveContent();
        this._updateWordCountImmediate(); // 装飾適用後は即座に更新
        this.hideFontDecorationPanel();
    }

    /**
     * テキストアニメーションを適用
     * @param {string} tag - アニメーションタグ名（fade, slide, type, pulse, shake, bounce, fadein）
     */
    applyTextAnimation(tag) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const selectedText = this.editor.value.substring(start, end);

        const open = `[${tag}]`;
        const close = `[/${tag}]`;
        const insertion = selectedText ? (open + selectedText + close) : (open + close);
        try {
            // 置換はUndoスタックに乗る
            this.editor.setRangeText(insertion, start, end, 'end');
        } catch (_) {
            this.insertTextAtCursor(insertion, { start, end });
        }
        if (!selectedText) {
            // 選択なし時はカーソルをタグの内側へ移動
            const caret = start + open.length;
            this.editor.selectionStart = caret;
            this.editor.selectionEnd = caret;
        }
        this.editor.focus();
        this.saveContent();
        this._updateWordCountImmediate(); // アニメーション適用後は即座に更新
        this.hideTextAnimationPanel();
    }

    /**
     * フォント装飾パネルを表示/非表示
     */
    toggleFontDecorationPanel() {
        if (!this.fontDecorationPanel) return;
        const isVisible = this.fontDecorationPanel.style.display !== 'none';
        if (isVisible) {
            this.hideFontDecorationPanel();
        } else {
            this.showFontDecorationPanel();
        }
    }

    /**
     * フォント装飾パネルを表示
     */
    showFontDecorationPanel() {
        if (!this.fontDecorationPanel) return;
        this.fontDecorationPanel.style.display = 'block';
        this.fontDecorationPanel.setAttribute('aria-hidden', 'false');
        // 他のパネルを隠す
        this.hideSearchPanel();
        if (this.floatingFontPanel) this.floatingFontPanel.style.display = 'none';

        // 最初のボタンにフォーカス
        const firstBtn = this.fontDecorationPanel.querySelector('.decor-btn');
        if (firstBtn) {
            setTimeout(() => firstBtn.focus(), 100);
        }
    }

    /**
     * フォント装飾パネルを非表示
     */
    hideFontDecorationPanel() {
        if (this.fontDecorationPanel) {
            this.fontDecorationPanel.style.display = 'none';
            this.fontDecorationPanel.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * テキストアニメーションパネルを表示/非表示
     */
    toggleTextAnimationPanel() {
        if (!this.textAnimationPanel) return;
        const isVisible = this.textAnimationPanel.style.display !== 'none';
        if (isVisible) {
            this.hideTextAnimationPanel();
        } else {
            this.showTextAnimationPanel();
        }
    }

    /**
     * テキストアニメーションパネルを表示
     */
    showTextAnimationPanel() {
        if (!this.textAnimationPanel) return;
        this.textAnimationPanel.style.display = 'block';
        this.textAnimationPanel.setAttribute('aria-hidden', 'false');
        // 他のパネルを隠す
        this.hideSearchPanel();
        this.hideFontDecorationPanel();
        if (this.floatingFontPanel) this.floatingFontPanel.style.display = 'none';

        // 最初のボタンにフォーカス
        const firstBtn = this.textAnimationPanel.querySelector('.decor-btn');
        if (firstBtn) {
            setTimeout(() => firstBtn.focus(), 100);
        }
    }

    /**
     * テキストアニメーションパネルを非表示
     */
    hideTextAnimationPanel() {
        if (this.textAnimationPanel) {
            this.textAnimationPanel.style.display = 'none';
            this.textAnimationPanel.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * アニメーション速度を更新
     * @param {number} speed - アニメーション速度倍率（0.5-3.0）
     */
    updateAnimationSpeed(speed) {
        document.documentElement.style.setProperty('--anim-speed', speed);
    }

    /**
     * アニメーション持続時間を更新
     * @param {number} duration - アニメーション持続時間（秒）
     */
    updateAnimationDuration(duration) {
        document.documentElement.style.setProperty('--anim-duration', duration + 's');
    }

    /**
     * アニメーション減らす設定を更新
     * @param {boolean} reduceMotion - アニメーションを減らすかどうか
     */
    updateAnimationReduceMotion(reduceMotion) {
        if (reduceMotion) {
            document.documentElement.setAttribute('data-reduce-motion', 'true');
        } else {
            document.documentElement.removeAttribute('data-reduce-motion');
        }
    }

    /**
     * アニメーション設定を保存
     * @param {Object} patch - 更新する設定
     */
    saveAnimationSettings(patch) {
        if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.loadSettings !== 'function') return;
        try {
            const settings = window.ZenWriterStorage.loadSettings() || {};
            if (!settings.textAnimation) settings.textAnimation = {};
            Object.assign(settings.textAnimation, patch);
            window.ZenWriterStorage.saveSettings(settings);
        } catch (e) {
            console.warn('Failed to save animation settings:', e);
        }
    }

    /**
     * 検索パネルを表示
     */
    showSearchPanel() {
        if (!this.searchPanel) return;
        this.searchPanel.style.display = 'block';
        // 他のパネルを隠す
        this.hideFontDecorationPanel();
        this.hideTextAnimationPanel();
        if (this.floatingFontPanel) this.floatingFontPanel.style.display = 'none';

        // 検索入力にフォーカス
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    /**
     * 検索パネルを非表示
     */
    hideSearchPanel() {
        if (this.searchPanel) {
            this.searchPanel.style.display = 'none';
            this.searchPanel.setAttribute('aria-hidden', 'true');
        }
        this.clearSearchHighlights();
        // エディタにフォーカスを戻す
        if (this.editor) {
            this.editor.focus();
        }
    }

    /**
     * エディタ幅モードを適用
     * Visual Profile から呼び出される
     * @param {string} mode - 'narrow' | 'medium' | 'wide'
     */
    applyWidthMode(mode) {
        const widthMap = {
            narrow: '700px',
            medium: '900px',
            wide: '1200px'
        };
        const paddingMap = {
            narrow: '60px',
            medium: '40px',
            wide: '20px'
        };
        const maxWidth = widthMap[mode] || widthMap.medium;
        const padding = paddingMap[mode] || paddingMap.medium;

        document.documentElement.style.setProperty('--editor-max-width', maxWidth);
        document.documentElement.style.setProperty('--editor-padding-x', padding);

        // 設定に保存
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function') {
            try {
                const settings = window.ZenWriterStorage.loadSettings() || {};
                if (!settings.editorLayout) settings.editorLayout = {};
                settings.editorLayout.widthMode = mode;
                window.ZenWriterStorage.saveSettings(settings);
            } catch (e) {
                console.warn('Failed to save editorWidthMode:', e);
            }
        }
    }
}

// グローバルオブジェクトに追加
window.ZenWriterEditor = new EditorManager();
