/**
 * EditorCore.js
 * エディタのコアロジック（データ操作、保存、ハッシュ計算など）を管理します。
 */
(function () {
    'use strict';

    const EditorCore = {
        /**
         * カーソル位置（または指定範囲）にテキストを挿入
         */
        insertTextAtCursor(manager, text, options = {}) {
            const start = (options && typeof options.start === 'number') ? options.start : manager.editor.selectionStart;
            const end = (options && typeof options.end === 'number') ? options.end : manager.editor.selectionEnd;
            const suffix = (options && typeof options.suffix === 'string') ? options.suffix : '';
            const selected = manager.editor.value.substring(start, end);
            const insertion = suffix ? (String(text) + selected + suffix) : String(text);
            try {
                manager.editor.setRangeText(insertion, start, end, 'end');
            } catch (_) {
                const before = manager.editor.value.substring(0, start);
                const after = manager.editor.value.substring(end, manager.editor.value.length);
                manager.editor.value = before + insertion + after;
                const newPos = start + insertion.length;
                manager.editor.selectionStart = newPos;
                manager.editor.selectionEnd = newPos;
            }
            manager.editor.focus();
            manager.saveContent();
            manager.updateWordCount();
        },

        getSelectionRange(manager) {
            if (!manager.editor) return { start: 0, end: 0 };
            return {
                start: manager.editor.selectionStart || 0,
                end: manager.editor.selectionEnd || 0
            };
        },

        getSelectedText(manager) {
            if (!manager.editor) return '';
            const range = this.getSelectionRange(manager);
            if (range.start === range.end) return '';
            const value = manager.editor.value || '';
            return value.substring(range.start, range.end);
        },

        wrapSelection(manager, prefix, suffix = prefix) {
            if (!manager.editor) return;
            const el = manager.editor;
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
            manager.saveContent();
            manager.updateWordCount();
        },

        getEditorValue(manager) {
            if (manager.richTextEditor && manager.richTextEditor.isWysiwygMode) {
                return manager.richTextEditor.getContent();
            }
            return manager.editor.value || '';
        },

        saveContent(manager) {
            try {
                let content = manager.editor.value;
                if (manager.richTextEditor && manager.richTextEditor.isWysiwygMode) {
                    content = manager.richTextEditor.getContent();
                }
                window.ZenWriterStorage.saveContent(content);
            } catch (_) { }
        },

        _computeContentHash(text) {
            let h = 5381;
            for (let i = 0; i < text.length; i++) {
                h = ((h << 5) + h) ^ text.charCodeAt(i);
                h |= 0;
            }
            return h >>> 0;
        },

        markDirty(manager) {
            try {
                const cur = this._computeContentHash(manager.editor.value || '');
                manager._isDirty = (manager._baselineHash == null) ? (cur !== 0) : (cur !== manager._baselineHash);
            } catch (_) {
                manager._isDirty = true;
            }
        },

        isDirty(manager) {
            return !!manager._isDirty;
        },

        refreshDirtyBaseline(manager) {
            try {
                manager._baselineHash = this._computeContentHash(manager.editor.value || '');
                manager._isDirty = false;
            } catch (_) { }
        },

        maybeAutoSnapshot(manager) {
            if (!window.ZenWriterStorage || !window.ZenWriterStorage.addSnapshot) return;
            const now = Date.now();
            const len = (manager.editor.value || '').length;
            if (manager._lastSnapTs === 0) {
                manager._lastSnapTs = now;
                manager._lastSnapLen = len;
                return;
            }
            const dt = now - manager._lastSnapTs;
            const dlen = Math.abs(len - manager._lastSnapLen);
            if (dt >= manager.SNAPSHOT_MIN_INTERVAL && dlen >= manager.SNAPSHOT_MIN_DELTA) {
                window.ZenWriterStorage.addSnapshot(manager.editor.value);
                manager._lastSnapTs = now;
                manager._lastSnapLen = len;
                if (typeof manager.showNotification === 'function') {
                    manager.showNotification('自動バックアップを保存しました');
                }
            }
        },

        loadContent(manager) {
            const savedContent = window.ZenWriterStorage.loadContent();
            const processed = manager.convertLegacyImageEmbeds(savedContent || '');
            manager.editor.value = processed || '';
            if (manager.richTextEditor && manager.richTextEditor.isWysiwygMode) {
                manager.richTextEditor.setContent(processed || '');
            }
            manager.renderImagePreview();
            this.refreshDirtyBaseline(manager);
        },

        setContent(manager, text) {
            manager.editor.value = text || '';
            if (manager.richTextEditor && manager.richTextEditor.isWysiwygMode) {
                manager.richTextEditor.setContent(text || '');
            }
            manager.saveContent();
            manager._updateWordCountImmediate();
            manager.renderImagePreview();
            this.refreshDirtyBaseline(manager);
        },

        newDocument(manager) {
            const msg = (window.UILabels && window.UILabels.EDITOR_NEW_DOC_CONFIRM) || '現在の内容を破棄して新規ドキュメントを作成しますか？';
            if (confirm(msg)) {
                manager.editor.value = '';
                manager.saveContent();
                manager._updateWordCountImmediate();
            }
        },

        restoreLastSnapshot(manager) {
            try {
                const snaps = (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSnapshots === 'function')
                    ? (window.ZenWriterStorage.loadSnapshots() || [])
                    : [];
                if (snaps.length === 0) {
                    if (typeof manager.showNotification === 'function') manager.showNotification('復元可能なスナップショットがありません');
                    return;
                }
                const msg = (window.UILabels && window.UILabels.EDITOR_RESTORE_CONFIRM) || '直近のスナップショットから復元しますか？（現在の内容は退避されます）';
                if (!confirm(msg)) return;

                const last = snaps[snaps.length - 1];
                window.ZenWriterStorage.addSnapshot(manager.editor.value); // 退避
                manager.setContent(last.content || '');
                if (typeof manager.showNotification === 'function') manager.showNotification('スナップショットから復元しました');
            } catch (e) {
                console.warn('Restore failed:', e);
            }
        },

        exportAsText(manager) {
            const text = manager.getEditorValue();
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${manager.getCurrentDocBaseName()}_${this.getFormattedDate()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        },

        exportAsMarkdown(manager) {
            const text = manager.getEditorValue();
            const blob = new Blob([text], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${manager.getCurrentDocBaseName()}_${this.getFormattedDate()}.md`;
            a.click();
            URL.revokeObjectURL(url);
        },

        getFormattedDate() {
            const d = new Date();
            const pad = (num) => String(num).padStart(2, '0');
            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        },

        getCurrentDocBaseName(_manager) {
            let name = 'doc';
            if (window.ZenWriterStorage && typeof window.ZenWriterStorage.getCurrentDocName === 'function') {
                name = window.ZenWriterStorage.getCurrentDocName() || 'doc';
            }
            return this.sanitizeForFilename(name);
        },

        sanitizeForFilename(s) {
            return (s || '').replace(/[\\/:*?"<>|]/g, '_').substring(0, 100);
        },

        insertCharacterStamp(manager) {
            const charCount = (manager.editor.value || '').length;
            const stamp = `[${charCount}文字]`;
            this.insertTextAtCursor(manager, stamp);
        },

        getCursorPosition(manager) {
            return manager.editor.selectionStart || 0;
        },

        escapeHtml(text) {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
            return (text || '').replace(/[&<>"']/g, (ch) => map[ch] || ch);
        },

        normalizeCustomTagEscapes(text) {
            if (!text) return text;
            return String(text).replace(
                /\\\[(\/?(?:bold|italic|underline|strike|smallcaps|light|shadow|black|uppercase|lowercase|capitalize|outline|glow|wide|narrow|fade|slide|type|pulse|shake|bounce|fadein))\\\]/gi,
                '[$1]'
            );
        },

        processTextAnimations(text) {
            if (!text) return text;
            const normalized = this.normalizeCustomTagEscapes(text);
            return normalized
                .replace(/\[fade\](.*?)\[\/fade\]/gi, '<span class="anim-fade">$1</span>')
                .replace(/\[slide\](.*?)\[\/slide\]/gi, '<span class="anim-slide">$1</span>')
                .replace(/\[type\](.*?)\[\/type\]/gi, '<span class="anim-typewriter">$1</span>')
                .replace(/\[pulse\](.*?)\[\/pulse\]/gi, '<span class="anim-pulse">$1</span>')
                .replace(/\[shake\](.*?)\[\/shake\]/gi, '<span class="anim-shake">$1</span>')
                .replace(/\[bounce\](.*?)\[\/bounce\]/gi, '<span class="anim-bounce">$1</span>')
                .replace(/\[fadein\](.*?)\[\/fadein\]/gi, '<span class="anim-fade-in">$1</span>');
        },

        processFontDecorations(text) {
            if (!text) return text;
            const normalized = this.normalizeCustomTagEscapes(text);
            return normalized
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
        },

        persistAssetMeta(manager, assetId, patch) {
            if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.updateAssetMeta !== 'function') {
                return;
            }
            window.ZenWriterStorage.updateAssetMeta(assetId, patch || {});
            manager.renderImagePreview();
        },

        getAsset(assetId) {
            if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.loadAssets !== 'function') return null;
            const assets = window.ZenWriterStorage.loadAssets();
            return assets ? assets[assetId] : null;
        },

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
        },

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
    };

    // グローバルに公開
    window.EditorCore = EditorCore;
})();
