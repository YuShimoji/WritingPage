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
        // 手動スクロール検知
        this._manualScrollTimeout = null;
        this._isManualScrolling = false;
        this.previewPanel = document.getElementById('editor-preview');
        this.previewPanelBody = document.getElementById('editor-preview-body');
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

        // 手動スクロール検知
        this.editor.addEventListener('scroll', () => {
            this._isManualScrolling = true;
            clearTimeout(this._manualScrollTimeout);
            this._manualScrollTimeout = setTimeout(() => {
                this._isManualScrolling = false;
            }, 2000); // 手動スクロール後2秒間typewriter調整をスキップ
        });

        // 選択変更時に文字数スタンプ更新
        this.editor.addEventListener('selectionchange', () => this.updateWordCount());
        this.setupImageHandlers();
        this.setupPreviewPanel();
        this.setupOverlaySupport();
        this.loadContent();
        this.updateWordCount();
        this.renderImagePreview();
        // イベント配線（パネルボタン、検索、ショートカット等）
        this.setupEventListeners();
        // タイプライターモードのインストール
        this.installTypewriterHandlers();
        // 折り返しガイドを設置し、設定に基づき適用
        if (this.editorOverlay) {
            this._wrapGuideEl = document.createElement('div');
            this._wrapGuideEl.className = 'editor-overlay__wrap-guide';
            this.editorOverlay.appendChild(this._wrapGuideEl);
        }
        this.applyWrapCols();
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // コンテンツ変更時の自動保存
        this.editor.addEventListener('input', () => {
            this.saveContent();
            this.updateWordCount();
            this.maybeAutoSnapshot();
            this.renderImagePreview();
        });

        // タブキーでインデント
        this.editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertTextAtCursor('\t');
            }
        });

        // 保存ショートカット (Ctrl+S or Cmd+S)
        document.addEventListener('keydown', (e) => {
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
        if (this.closeSearchBtn) {
            this.closeSearchBtn.addEventListener('click', () => {
                this.hideSearchPanel();
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

        // フォント装飾ボタンイベント
        const decorButtons = document.querySelectorAll('.decor-btn');
        decorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                if (tag) {
                    this.applyFontDecoration(tag);
                }
            });
        });
    }

    // ===== タイプライターモード =====
    installTypewriterHandlers(){
        if (!this.editor) return;
        const onCaretMove = () => this.scheduleTypewriterUpdate();
        this.editor.addEventListener('input', onCaretMove);
        this.editor.addEventListener('keyup', onCaretMove);
        this.editor.addEventListener('click', onCaretMove);
        window.addEventListener('resize', onCaretMove);
        this.editor.addEventListener('scroll', () => {
            this._ty_scrollPending = true;
            clearTimeout(this._ty_scrollTimer);
            this._ty_scrollTimer = setTimeout(()=>{ this._ty_scrollPending = false; this.scheduleTypewriterUpdate(); }, 120);
        });
        setTimeout(()=> this.scheduleTypewriterUpdate(), 50);
    }

    scheduleTypewriterUpdate(){
        if (this._ty_scheduled) return;
        this._ty_scheduled = true;
        requestAnimationFrame(() => {
            try { this.applyTypewriterIfEnabled(); } finally { this._ty_scheduled = false; }
        });
    }

    applyTypewriterIfEnabled(){
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
        } catch(_) {}
    }

    applyWrapCols(){
        try {
            const s = (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function') ? window.ZenWriterStorage.loadSettings() : {};
            const tw = (s && s.typewriter) || {};
            const cols = (typeof tw.wrapCols === 'number') ? Math.max(20, Math.min(120, tw.wrapCols)) : 80;
            document.documentElement.style.setProperty('--wrap-ch', cols + 'ch');
        } catch(_) {}
    }

    /**
     * カーソル位置にテキストを挿入
     * @param {string} text - 挿入するテキスト
     */
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
        this.previewPanelToggle.addEventListener('click', () => {
            const collapsed = this.previewPanel.classList.toggle('editor-preview--collapsed');
            this.previewPanelToggle.textContent = collapsed ? '展開する' : '折りたたむ';
        });
    }

    setupOverlaySupport() {
        if (!this.editor || !this.editorOverlay || !this.editorMirror) return;
        const schedule = () => this.scheduleOverlayRefresh();
        this.editor.addEventListener('scroll', schedule);
        window.addEventListener('resize', schedule);
        this._overlayScheduleHandler = schedule;
    }

    handlePasteEvent(event) {
        const items = event.clipboardData && event.clipboardData.items;
        if (!items || !items.length) return;
        const imageFiles = Array.from(items)
            .filter((item) => item.kind === 'file' && item.type && item.type.startsWith('image/'))
            .map((item) => item.getAsFile())
            .filter(Boolean);
        if (!imageFiles.length) return;
        event.preventDefault();
        this.insertImagesSequentially(imageFiles);
    }

    handleDragOver(event) {
        if (!event.dataTransfer) return;
        if (Array.from(event.dataTransfer.types || []).includes('Files')) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            this.editor.classList.add(this.dropIndicatorClass);
        }
    }

    handleDragLeave(event) {
        if (event.relatedTarget === this.editor) return;
        this.editor.classList.remove(this.dropIndicatorClass);
    }

    handleDropEvent(event) {
        if (!event.dataTransfer) return;
        const files = Array.from(event.dataTransfer.files || []).filter((file) => file.type && file.type.startsWith('image/'));
        if (!files.length) {
            this.editor.classList.remove(this.dropIndicatorClass);
            return;
        }
        event.preventDefault();
        this.editor.classList.remove(this.dropIndicatorClass);
        this.editor.focus();
        this.insertImagesSequentially(files);
    }

    insertImagesSequentially(files, index = 0) {
        if (!files || index >= files.length) return;
        this.insertImageFile(files[index])
            .catch(() => {
                this.showNotification('画像の挿入に失敗しました');
            })
            .finally(() => {
                this.insertImagesSequentially(files, index + 1);
            });
    }

    insertImageFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) { resolve(); return; }
            const reader = new FileReader();
            const selection = {
                start: this.editor.selectionStart,
                end: this.editor.selectionEnd
            };
            reader.onload = () => {
                try {
                    const dataUrl = reader.result;
                    const markdown = this.buildAssetAwareMarkdown({
                        dataUrl,
                        file,
                        selectionStart: selection.start
                    });
                    this.insertTextAtCursor(markdown, selection);
                    if (typeof this.showNotification === 'function') {
                        this.showNotification('画像を挿入しました', 1500);
                    }
                    this.renderImagePreview();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            try {
                reader.readAsDataURL(file);
            } catch (err) {
                reject(err);
            }
        });
    }

    buildAssetAwareMarkdown({ dataUrl, file, selectionStart }) {
        const before = this.editor.value.substring(0, selectionStart || 0);
        const prefix = before && !/\n$/.test(before) ? '\n\n' : '';
        const suffix = '\n\n';
        const alt = this.deriveAltText(file && file.name);
        let link = dataUrl;
        if (window.ZenWriterStorage && typeof window.ZenWriterStorage.saveAssetFromDataUrl === 'function') {
            const asset = window.ZenWriterStorage.saveAssetFromDataUrl(dataUrl, {
                name: alt,
                fileName: file && file.name,
                type: file && file.type,
                size: file && file.size
            });
            if (asset && asset.id) {
                link = `asset://${asset.id}`;
            }
        }
        return `${prefix}![${alt}](${link})${suffix}`;
    }

    deriveAltText(fileName) {
        const base = fileName ? String(fileName).replace(/\.[^.]+$/, '') : 'image';
        const sanitized = base.replace(/[_`*\[\]{}()#!|<>]/g, ' ').trim();
        return sanitized || 'image';
    }

    convertLegacyImageEmbeds(content) {
        if (!content || content.indexOf('data:image') === -1) {
            return content;
        }
        if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.saveAssetFromDataUrl !== 'function') {
            return content;
        }
        const pattern = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g;
        let changed = false;
        const replaced = content.replace(pattern, (match, alt, dataUrl) => {
            const asset = window.ZenWriterStorage.saveAssetFromDataUrl(dataUrl, { name: alt || 'image' });
            if (!asset || !asset.id) {
                return match;
            }
            changed = true;
            const safeAlt = (alt || '').trim();
            return `![${safeAlt}](asset://${asset.id})`;
        });
        if (changed) {
            this.updateStorageContentAfterMigration(replaced);
            return replaced;
        }
        return content;
    }

    renderImagePreview() {
        if (!this.previewPanelBody) return;
        const content = this.editor.value || '';
        const regex = /!\[[^\]]*\]\(asset:\/\/([^\s)]+)\)/g;
        const matches = Array.from(content.matchAll(regex));
        this.previewPanelBody.innerHTML = '';

        if (!matches.length) {
            const hint = document.createElement('div');
            hint.className = 'preview-empty-hint';
            hint.textContent = '画像はまだ挿入されていません。画像を貼り付けるとここに一覧表示されます。';
            this.previewPanelBody.appendChild(hint);
            if (this.editorOverlay) this.editorOverlay.innerHTML = '';
            this._lastOverlayEntries = [];
            return;
        }

        const storage = window.ZenWriterStorage;
        const assets = (storage && typeof storage.loadAssets === 'function') ? storage.loadAssets() : {};

        const list = document.createElement('div');
        list.className = 'editor-preview__items';

        const orderedEntries = [];
        matches.forEach((match, index) => {
            const assetId = match[1];
            const asset = assets[assetId];
            if (!asset || !asset.dataUrl) return;
            orderedEntries.push({
                assetId,
                asset,
                matchIndex: index,
                matchStart: typeof match.index === 'number' ? match.index : content.indexOf(match[0]),
                matchLength: match[0].length
            });
            const card = this.createPreviewCard({ assetId, asset, matchIndex: index });
            if (card) list.appendChild(card);
        });

        if (!list.childElementCount) {
            const warn = document.createElement('div');
            warn.className = 'preview-warning';
            warn.textContent = 'アセット情報が見つからない画像があります。必要であれば再読み込みしてください。';
            this.previewPanelBody.appendChild(warn);
            if (this.editorOverlay) this.editorOverlay.innerHTML = '';
            this._lastOverlayEntries = [];
            return;
        }

        this.previewPanelBody.appendChild(list);

        if (storage && typeof storage.updateAssetMeta === 'function') {
            orderedEntries.forEach((entry, order) => {
                if (typeof entry.asset.order !== 'number' || entry.asset.order !== order) {
                    storage.updateAssetMeta(entry.assetId, { order });
                }
            });
        }

        this._lastOverlayEntries = orderedEntries;
        this.renderOverlayImages(orderedEntries, content);
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

    scheduleOverlayRefresh() {
        if (this._overlayRenderFrame) {
            cancelAnimationFrame(this._overlayRenderFrame);
        }
        this._overlayRenderFrame = requestAnimationFrame(() => {
            this._overlayRenderFrame = null;
            const entries = Array.isArray(this._lastOverlayEntries) ? this._lastOverlayEntries : [];
            this.renderOverlayImages(entries, this.editor.value || '');
        });
    }

    renderOverlayImages(entries, content) {
        if (!this.editorOverlay || !this.editorMirror) return;
        this.editorOverlay.innerHTML = '';
        const _entries = Array.isArray(entries) ? entries : [];
        this.editorMirror.innerHTML = this.buildMirrorHtml(content);
        const style = window.getComputedStyle(this.editor);
        const padding = {
            top: parseFloat(style.paddingTop) || 0,
            right: parseFloat(style.paddingRight) || 0,
            bottom: parseFloat(style.paddingBottom) || 0,
            left: parseFloat(style.paddingLeft) || 0
        };
        const usableWidth = this.editor.clientWidth - padding.left - padding.right;
        _entries.forEach((entry) => {
            const asset = entry.asset;
            if (!asset || !asset.dataUrl) return;
            const anchor = this.editorMirror.querySelector(`span[data-asset-id="${entry.assetId}"]`);
            if (!anchor) return;

            const overlay = document.createElement('div');
            overlay.className = 'editor-overlay__image';
            overlay.dataset.assetId = entry.assetId;
            overlay.dataset.alignment = asset.alignment || 'auto';
            if (asset.hidden) overlay.classList.add('hidden');

            const widthPercent = Math.min(100, Math.max(10, asset.widthPercent || 60));
            const widthPx = Math.max(40, Math.round(usableWidth * (widthPercent / 100)));

            // 画像を左寄せに固定（エディタ拡大時の上書きを防ぐ）
            let left = padding.left;

            const top = anchor.offsetTop - this.editor.scrollTop + (asset.offsetY || 0);

            overlay.style.left = `${left}px`;
            overlay.style.top = `${top}px`;
            overlay.style.width = `${widthPx}px`;

            const img = document.createElement('img');
            img.src = asset.dataUrl;
            img.alt = asset.name || '';
            overlay.appendChild(img);

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'overlay-toggle';
            toggle.title = asset.hidden ? '表示する' : '隠す';
            toggle.textContent = asset.hidden ? '👁' : '🙈';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.persistAssetMeta(entry.assetId, { hidden: !asset.hidden });
            });
            overlay.appendChild(toggle);

            const handle = document.createElement('div');
            handle.className = 'overlay-handle';
            handle.textContent = '↔';
            overlay.appendChild(handle);

            this.attachOverlayInteractions({ overlay, assetId: entry.assetId, handle });

            this.editorOverlay.appendChild(overlay);
        });

        const stamps = Array.isArray(this.inlineStamps) ? this.inlineStamps : [];
        stamps.forEach((st) => {
            const rect = this.getTextPosition(Math.max(0, st.start), Math.max(st.start, st.end));
            if (!rect) return;
            const el = document.createElement('div');
            el.className = 'editor-overlay__stamp inline-stamp';
            el.textContent = `文字数: ${st.count}`;
            el.style.left = (rect.left + rect.width + 8) + 'px';
            el.style.top = rect.top + 'px';
            this.editorOverlay.appendChild(el);
        });
    }

    attachOverlayInteractions({ overlay, assetId, handle }) {
        overlay.style.pointerEvents = 'auto';
        overlay.style.cursor = 'move';

        overlay.addEventListener('pointerdown', (event) => {
            if (event.target === handle || event.target.classList.contains('overlay-toggle')) {
                return;
            }
            if (overlay.classList.contains('hidden')) return;
            event.preventDefault();
            this.startOverlayDrag({ overlay, assetId, event });
        });

        handle.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.startOverlayResize({ overlay, assetId, event });
        });
    }

    startOverlayDrag({ overlay, assetId, event }) {
        const pointerId = event.pointerId;
        overlay.setPointerCapture(pointerId);
        const startY = event.clientY;
        const startTop = parseFloat(overlay.style.top) || 0;

        const move = (ev) => {
            const deltaY = ev.clientY - startY;
            overlay.style.top = `${startTop + deltaY}px`;
        };

        const up = (ev) => {
            overlay.removeEventListener('pointermove', move);
            overlay.removeEventListener('pointerup', up);
            try { overlay.releasePointerCapture(pointerId); } catch (_) {}
            const finalTop = parseFloat(overlay.style.top) || startTop;
            const delta = Math.round(finalTop - startTop);
            const asset = this.getAsset(assetId);
            const base = asset && typeof asset.offsetY === 'number' ? asset.offsetY : 0;
            this.persistAssetMeta(assetId, { offsetY: base + delta });
        };

        overlay.addEventListener('pointermove', move);
        overlay.addEventListener('pointerup', up);
    }

    startOverlayResize({ overlay, assetId, event }) {
        const pointerId = event.pointerId;
        overlay.setPointerCapture(pointerId);
        const startX = event.clientX;
        const startWidth = parseFloat(overlay.style.width) || 0;
        const style = window.getComputedStyle(this.editor);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const usableWidth = this.editor.clientWidth - paddingLeft - paddingRight;

        const move = (ev) => {
            const delta = ev.clientX - startX;
            const next = Math.max(40, startWidth + delta);
            overlay.style.width = `${next}px`;
        };

        const up = (ev) => {
            overlay.removeEventListener('pointermove', move);
            overlay.removeEventListener('pointerup', up);
            try { overlay.releasePointerCapture(pointerId); } catch (_) {}
            const finalWidth = parseFloat(overlay.style.width) || startWidth;
            const percent = Math.max(10, Math.min(100, Math.round((finalWidth / usableWidth) * 100)));
            this.persistAssetMeta(assetId, { widthPercent: percent });
        };

        overlay.addEventListener('pointermove', move);
        overlay.addEventListener('pointerup', up);
    }

    buildMirrorHtml(content) {
        if (!content) return '';
        const regex = /!\[[^\]]*\]\(asset:\/\/([^\s)]+)\)/g;
        let lastIndex = 0;
        let html = '';
        let match;
        while ((match = regex.exec(content)) !== null) {
            const before = content.slice(lastIndex, match.index);
            html += this.processFontDecorations(this.processTextAnimations(this.escapeHtml(before))).replace(/\n/g, '<br>');
            html += `<span class="mirror-asset" data-asset-id="${match[1]}">&#8203;</span>`;
            lastIndex = match.index + match[0].length;
        }
        html += this.processFontDecorations(this.processTextAnimations(this.escapeHtml(content.slice(lastIndex)))).replace(/\n/g, '<br>');
        return html;
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
        try { window.ZenWriterStorage.saveContent(content); } catch (_) {}
        try {
            if (window.ZenWriterStorage.getCurrentDocId && window.ZenWriterStorage.updateDocumentContent) {
                const currentId = window.ZenWriterStorage.getCurrentDocId();
                if (currentId) {
                    window.ZenWriterStorage.updateDocumentContent(currentId, content);
                }
            }
        } catch (_) {}
    }

    /**
     * コンテンツをローカルストレージに保存
     */
    saveContent() {
        window.ZenWriterStorage.saveContent(this.editor.value);
    }

    maybeAutoSnapshot(){
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
        this.renderImagePreview();
    }

    /**
     * エディタ内容を置き換える（読み込み時など）
     * @param {string} text
     */
    setContent(text) {
        this.editor.value = text || '';
        this.saveContent();
        this.updateWordCount();
        this.renderImagePreview();
    }

    /**
     * 新しいドキュメントを作成
     */
    newDocument() {
        if (confirm('現在の内容を破棄して新規ドキュメントを作成しますか？')) {
            this.editor.value = '';
            this.saveContent();
            this.updateWordCount();
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
    getCurrentDocBaseName(){
        try {
            if (!window.ZenWriterStorage || !window.ZenWriterStorage.getCurrentDocId) return 'zenwriter';
            const id = window.ZenWriterStorage.getCurrentDocId();
            const docs = window.ZenWriterStorage.loadDocuments ? (window.ZenWriterStorage.loadDocuments() || []) : [];
            const doc = docs.find(d => d && d.id === id);
            const name = (doc && doc.name) ? String(doc.name) : 'zenwriter';
            return this.sanitizeForFilename(name.trim() || 'zenwriter');
        } catch(_) { return 'zenwriter'; }
    }

    /**
     * ファイル名に使えない文字を安全なものに置換
     * @param {string} s
     * @returns {string}
     */
    sanitizeForFilename(s){
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
    updateWordCount() {
        const text = this.editor.value;
        // インラインスタンプを除去してカウント
        const cleanText = text.replace(/<span class="inline-stamp">.*?<\/span>/g, '');
        const charCount = cleanText ? cleanText.replace(/\r?\n/g, '').length : 0;
        const wordCount = cleanText.trim() === '' ? 0 : cleanText.trim().split(/\s+/).length;
        // 執筆目標の進捗（任意）
        const s = window.ZenWriterStorage.loadSettings();
        const goal = (s && s.goal) || {};
        let suffix = '';
        if (goal && (parseInt(goal.target,10) || 0) > 0) {
            const target = Math.max(0, parseInt(goal.target,10) || 0);
            const ratio = target > 0 ? charCount / target : 0;
            const pct = Math.floor(ratio * 100);
            suffix += ` | 目標 ${target} (${pct}%)`;
            // 進捗バーの表示と更新
            if (this.goalProgressEl && this.goalProgressBarEl) {
                this.goalProgressEl.style.display = 'inline-flex';
                this.goalProgressEl.setAttribute('aria-hidden', 'false');
                const w = Math.max(0, pct);
                this.goalProgressBarEl.style.width = `${Math.min(100, w)}%`;
            }
            // 締切日がある場合は残日数を併記
            if (goal.deadline) {
                const today = new Date();
                const dl = new Date(`${goal.deadline}T00:00:00`);
                const msPerDay = 24*60*60*1000;
                const days = Math.ceil((dl - today) / msPerDay);
                if (!isNaN(days)) {
                    if (days >= 0) suffix += ` | 残り${days}日`;
                    else suffix += ` | 期限超過${Math.abs(days)}日`;
                }
            }
            // 目標達成時の通知（初回のみ）
            if (charCount >= target) {
                if (!this._goalReachedNotified) {
                    this._goalReachedNotified = true;
                    if (typeof this.showNotification === 'function') {
                        this.showNotification('目標達成！お疲れさまです 🎉');
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

        this.wordCountElement.textContent = `${charCount} 文字 / ${wordCount} 語${suffix}`;
        // ミニHUDに一時表示（ツールバー非表示時のみ）
        if (window.ZenWriterHUD) {
            const toolbarHidden = document.body.classList.contains('toolbar-hidden') ||
                                  document.documentElement.getAttribute('data-toolbar-hidden') === 'true';
            if (toolbarHidden && typeof window.ZenWriterHUD.publish === 'function') {
                // HUD 設定の既定時間に従う（durationを渡さない）
                window.ZenWriterHUD.publish(`${charCount} 文字 / ${wordCount} 語`);
            } else if (!toolbarHidden && typeof window.ZenWriterHUD.hide === 'function') {
                window.ZenWriterHUD.hide();
            }
        }

        // Typewriter mode: 手動スクロール中でなければカーソルを中央に保つ
        const settings = window.ZenWriterStorage.loadSettings();
        if (settings.typewriter && settings.typewriter.enabled && !this._isManualScrolling) {
            const anchorRatio = settings.typewriter.anchorRatio || 0.5;
            const lineHeight = parseFloat(getComputedStyle(this.editor).lineHeight) || 20;
            const cursorPos = this.getCursorPosition();
            const cursorLine = this.editor.value.substring(0, cursorPos).split('\n').length - 1;
            const anchorY = anchorRatio * this.editor.clientHeight;
            const cursorY = cursorLine * lineHeight;
            const delta = cursorY - anchorY;
            const newScroll = this.editor.scrollTop + delta;
            this.editor.scrollTop = Math.max(0, newScroll);
        }
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

    hideSearchPanel() {
        const panel = document.getElementById('search-panel');
        if (panel) {
            panel.style.display = 'none';
        }
        this.clearSearchHighlights();
    }

    /**
     * 検索条件に基づいてマッチを取得
     */
    getSearchRegex() {
        const input = document.getElementById('search-input');
        const caseSensitive = document.getElementById('search-case-sensitive')?.checked;
        const useRegex = document.getElementById('search-regex')?.checked;
        const query = input?.value || '';

        if (!query) return null;

        let flags = 'g';
        if (!caseSensitive) flags += 'i';

        try {
            return useRegex ? new RegExp(query, flags) : new RegExp(this.escapeRegex(query), flags);
        } catch (e) {
            return null;
        }
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * マッチを検索してハイライト
     */
    updateSearchMatches() {
        this.clearSearchHighlights();
        const regex = this.getSearchRegex();
        if (!regex) {
            this.updateMatchCount(0);
            return;
        }

        const text = this.editor.value;
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
        }

        this.currentMatches = matches;
        this.currentMatchIndex = -1;
        this.updateMatchCount(matches.length);
        this.highlightMatches(matches);
    }

    /**
     * マッチ数を更新
     */
    updateMatchCount(count) {
        const countEl = document.getElementById('match-count');
        if (countEl) {
            if (count === 0) {
                countEl.textContent = '一致するテキストが見つかりません';
            } else {
                countEl.textContent = `${count} 件一致しました`;
            }
        }
    }

    /**
     * マッチをハイライト
     */
    highlightMatches(matches) {
        const overlay = this.editorOverlay;
        if (!overlay) return;

        matches.forEach((match, index) => {
            const highlight = document.createElement('div');
            highlight.className = 'search-highlight';
            highlight.dataset.matchIndex = index;

            const rect = this.getTextPosition(match.start, match.end);
            if (rect) {
                highlight.style.left = rect.left + 'px';
                highlight.style.top = rect.top + 'px';
                highlight.style.width = rect.width + 'px';
                highlight.style.height = rect.height + 'px';
                overlay.appendChild(highlight);
            }
        });
    }

    /**
     * テキスト位置を取得
     */
    getTextPosition(start, end) {
        const mirror = this.editorMirror;
        if (!mirror) return null;

        const text = this.editor.value;
        const before = text.substring(0, start);
        const match = text.substring(start, end);
        const after = text.substring(end);

        mirror.innerHTML = this.escapeHtml(before) +
                          '<span class="search-match">' + this.escapeHtml(match) + '</span>' +
                          this.escapeHtml(after);
        mirror.innerHTML = mirror.innerHTML.replace(/\n/g, '<br>');

        const matchEl = mirror.querySelector('.search-match');
        if (matchEl) {
            const rect = matchEl.getBoundingClientRect();
            const editorRect = this.editor.getBoundingClientRect();
            return {
                left: rect.left - editorRect.left,
                top: rect.top - editorRect.top,
                width: rect.width,
                height: rect.height
            };
        }
        return null;
    }

    /**
     * ハイライトをクリア
     */
    clearSearchHighlights() {
        const highlights = this.editorOverlay?.querySelectorAll('.search-highlight');
        if (highlights) {
            highlights.forEach(h => h.remove());
        }
    }

    /**
     * 次/前のマッチに移動
     */
    navigateMatch(direction) {
        if (!this.currentMatches || this.currentMatches.length === 0) return;

        if (direction > 0) {
            this.currentMatchIndex = (this.currentMatchIndex + 1) % this.currentMatches.length;
        } else {
            this.currentMatchIndex = this.currentMatchIndex <= 0 ?
                this.currentMatches.length - 1 : this.currentMatchIndex - 1;
        }

        const match = this.currentMatches[this.currentMatchIndex];
        this.selectMatch(match);
    }

    /**
     * マッチを選択
     */
    selectMatch(match) {
        this.editor.selectionStart = match.start;
        this.editor.selectionEnd = match.end;
        this.editor.focus();
        this.scrollToMatch(match);
    }

    /**
     * マッチにスクロール
     */
    scrollToMatch(match) {
        // 簡易的なスクロール実装
        const lineHeight = parseFloat(getComputedStyle(this.editor).lineHeight) || 20;
        const lines = this.editor.value.substring(0, match.start).split('\n').length - 1;
        const y = lines * lineHeight;
        this.editor.scrollTop = Math.max(0, y - this.editor.clientHeight / 2);
    }

    /**
     * 単一置換
     */
    replaceSingle() {
        const replaceInput = document.getElementById('replace-input');
        const replaceText = replaceInput?.value || '';

        if (!this.currentMatches || this.currentMatchIndex < 0) return;

        const match = this.currentMatches[this.currentMatchIndex];
        const before = this.editor.value.substring(0, match.start);
        const after = this.editor.value.substring(match.end);

        this.editor.value = before + replaceText + after;
        this.saveContent();
        this.updateWordCount();

        // マッチ位置を調整
        const newEnd = match.start + replaceText.length;
        this.currentMatches.splice(this.currentMatchIndex, 1);

        // 残りのマッチ位置を調整
        for (let i = this.currentMatchIndex; i < this.currentMatches.length; i++) {
            this.currentMatches[i].start += replaceText.length - match.text.length;
            this.currentMatches[i].end += replaceText.length - match.text.length;
        }

        if (this.currentMatches.length === 0) {
            this.currentMatchIndex = -1;
        } else {
            this.currentMatchIndex = Math.min(this.currentMatchIndex, this.currentMatches.length - 1);
        }

        this.updateMatchCount(this.currentMatches.length);
        this.updateSearchMatches();

        // エディタの選択を更新
        if (this.currentMatchIndex >= 0) {
            const newMatch = this.currentMatches[this.currentMatchIndex];
            this.selectMatch(newMatch);
        }
    }

    /**
     * すべて置換
     */
    replaceAll() {
        const replaceInput = document.getElementById('replace-input');
        const replaceText = replaceInput?.value || '';
        const regex = this.getSearchRegex();

        if (!regex || !this.currentMatches) return;

        let result = this.editor.value;
        let offset = 0;

        this.currentMatches.forEach(match => {
            const before = result.substring(0, match.start + offset);
            const after = result.substring(match.end + offset);
            result = before + replaceText + after;
            offset += replaceText.length - match.text.length;
        });

        this.editor.value = result;
        this.saveContent();
        this.updateWordCount();
        this.updateSearchMatches();
        this.showNotification('すべて置換しました');
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
        this.updateWordCount();
        this.hideFontDecorationPanel();
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
        // 他のパネルを隠す
        this.hideSearchPanel();
        if (this.floatingFontPanel) this.floatingFontPanel.style.display = 'none';
    }

    /**
     * フォント装飾パネルを非表示
     */
    hideFontDecorationPanel() {
        if (this.fontDecorationPanel) {
            this.fontDecorationPanel.style.display = 'none';
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
        // 他のパネルを隠す
        this.hideSearchPanel();
        this.hideFontDecorationPanel();
        if (this.floatingFontPanel) this.floatingFontPanel.style.display = 'none';
    }

    /**
     * テキストアニメーションパネルを非表示
     */
    hideTextAnimationPanel() {
        if (this.textAnimationPanel) {
            this.textAnimationPanel.style.display = 'none';
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
        }
        this.clearSearchHighlights();
    }
}

// グローバルオブジェクトに追加
window.ZenWriterEditor = new EditorManager();
