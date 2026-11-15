/**
 * RichTextLinkActions
 * リッチ編集のリンク挿入: 選択範囲の保存/復元、リンク挿入モーダル（URL・章リンク候補）、閉じる処理。
 * RichTextEditor のプロトタイプへメソッドをそのまま差し込む（呼び出し側の this.insertLink 等は変更なし。
 * RichTextEnhancedRuntime が insertLink をインスタンス側で包む構造もそのまま維持）。
 * 依存: RichTextEditor 側の wysiwygEditor / isWysiwygMode / syncToMarkdown / _saveEditorSelection / _restoreEditorSelection /
 *       notifySelectionRequired、window.ZWChapterNav / ZWChapterStore / ZenWriterStorage。
 */
(function (root) {
  'use strict';

  class LinkActions {
    insertLink() {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;

      // ドロップダウン操作時に focus() で選択範囲が消失するのを防止
      var savedRange = this._saveEditorSelection();
      this.wysiwygEditor.focus();
      this._restoreEditorSelection(savedRange);

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        this.notifySelectionRequired();
        return;
      }

      const range = selection.getRangeAt(0);
      if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return;

      const linkRange = range.cloneRange();
      const selectedText = selection.toString().trim();
      const self = this;

      this._showLinkInsertModal(linkRange, selectedText, function (url, isChapterLink, linkStyle) {
        self.wysiwygEditor.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(linkRange);

        const link = document.createElement('a');
        if (isChapterLink) {
          link.href = '#';
          link.className = 'chapter-link';
          if (linkStyle) link.classList.add('chapter-link--' + linkStyle);
          link.dataset.chapterTarget = encodeURIComponent(url);
          if (linkStyle) link.dataset.style = linkStyle;
        } else {
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.className = 'external-link';
        }
        link.textContent = selectedText || url;

        savedRange.deleteContents();
        savedRange.insertNode(link);

        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(link);
        newRange.collapse(true);
        sel.addRange(newRange);

        self.wysiwygEditor.focus();
        self.syncToMarkdown();
      });
    }

    _showLinkInsertModal(savedRange, selectedText, onConfirm) {
      // 既存モーダルを閉じる
      this._closeLinkInsertModal();

      const modal = document.createElement('div');
      modal.className = 'link-insert-modal';

      // 位置をカーソル付近に配置
      const rect = savedRange.getBoundingClientRect();
      modal.style.left = Math.min(rect.left, window.innerWidth - 340) + 'px';
      modal.style.top = (rect.bottom + 8) + 'px';

      // ヘッダー
      const header = document.createElement('div');
      header.className = 'link-insert-modal__header';
      header.textContent = '\u30ea\u30f3\u30af\u633f\u5165';
      modal.appendChild(header);

      // URL入力欄
      const inputRow = document.createElement('div');
      inputRow.className = 'link-insert-modal__input-row';
      const input = document.createElement('input');
      input.className = 'link-insert-modal__input';
      input.type = 'text';
      input.placeholder = 'URL\u3092\u5165\u529b (https://...)';
      inputRow.appendChild(input);
      // 外部リンクヒント（URL入力時に表示）
      const extHint = document.createElement('div');
      extHint.className = 'link-insert-modal__ext-hint';
      extHint.textContent = '\u5916\u90e8\u30ea\u30f3\u30af: \u65b0\u898f\u30bf\u30d6\u3067\u958b\u304d\u307e\u3059';
      extHint.style.display = 'none';
      inputRow.appendChild(extHint);
      modal.appendChild(inputRow);

      // リンクスタイル選択
      const styleRow = document.createElement('div');
      styleRow.className = 'link-insert-modal__style-row';
      const styleLabel = document.createElement('label');
      styleLabel.className = 'link-insert-modal__style-label';
      styleLabel.textContent = '\u30b9\u30bf\u30a4\u30eb';
      const styleSelect = document.createElement('select');
      styleSelect.className = 'link-insert-modal__style-select';
      [
        { value: '', label: '\u6a19\u6e96' },
        { value: 'choice', label: '\u25b6 \u9078\u629e\u80a2' },
        { value: 'emphasis', label: '\u25b6 \u5f37\u8abf' },
        { value: 'card', label: '\u25b6 \u30ab\u30fc\u30c9' }
      ].forEach(function (opt) {
        var o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        styleSelect.appendChild(o);
      });
      styleRow.appendChild(styleLabel);
      styleRow.appendChild(styleSelect);
      modal.appendChild(styleRow);

      // 仕切り
      const divider = document.createElement('div');
      divider.className = 'link-insert-modal__divider';
      divider.textContent = '\u2014\u2014 \u307e\u305f\u306f\u7ae0\u30ea\u30f3\u30af \u2014\u2014';
      modal.appendChild(divider);

      // 章リスト
      const chaptersEl = document.createElement('div');
      chaptersEl.className = 'link-insert-modal__chapters';
      modal.appendChild(chaptersEl);

      // ChapterStoreから全章取得（draft含む）
      const allChapters = this._getAllChaptersForLinkModal();

      if (allChapters.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'link-insert-modal__empty';
        empty.textContent = '\u7ae0\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093';
        chaptersEl.appendChild(empty);
      } else {
        const self = this;
        allChapters.forEach(function (ch) {
          const item = document.createElement('div');
          item.className = 'link-insert-modal__chapter-item';
          if (ch.visibility === 'draft') item.classList.add('link-insert-modal__chapter-item--draft');
          if (ch.visibility === 'hidden') item.classList.add('link-insert-modal__chapter-item--hidden');

          item.textContent = ch.title || ch.name || '(untitled)';

          if (ch.visibility && ch.visibility !== 'visible') {
            const badge = document.createElement('span');
            badge.className = 'link-insert-modal__visibility-badge';
            badge.textContent = ch.visibility;
            item.appendChild(badge);
          }

          item.addEventListener('click', function () {
            var style = styleSelect.value;
            self._closeLinkInsertModal();
            onConfirm(ch.title || ch.id, true, style);
          });
          chaptersEl.appendChild(item);
        });
      }

      // 危険なURLスキームの検証
      const isDangerousUrl = (url) => /^\s*(javascript|data|vbscript):/i.test(url);
      const isExternalUrl = (url) => /^https?:\/\//i.test(url);

      // URL入力のEnterキー確定
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = input.value.trim();
          if (val && !isDangerousUrl(val)) {
            var style = styleSelect.value;
            this._closeLinkInsertModal();
            onConfirm(val, false, style);
          }
        }
        if (e.key === 'Escape') {
          this._closeLinkInsertModal();
        }
      });

      // フィルタリング + 外部リンクヒント表示
      input.addEventListener('input', () => {
        const q = input.value.trim();
        const qLower = q.toLowerCase();
        const items = chaptersEl.querySelectorAll('.link-insert-modal__chapter-item');
        items.forEach(function (it) {
          if (!q || it.textContent.toLowerCase().includes(qLower)) {
            it.style.display = '';
          } else {
            it.style.display = 'none';
          }
        });
        // 外部URLヒント表示
        extHint.style.display = isExternalUrl(q) ? '' : 'none';
        // 危険なURL警告
        if (isDangerousUrl(q)) {
          extHint.textContent = '\u5371\u967a\u306aURL\u30b9\u30ad\u30fc\u30e0\u3067\u3059';
          extHint.style.display = '';
          extHint.classList.add('link-insert-modal__ext-hint--warn');
        } else {
          extHint.textContent = '\u5916\u90e8\u30ea\u30f3\u30af: \u65b0\u898f\u30bf\u30d6\u3067\u958b\u304d\u307e\u3059';
          extHint.classList.remove('link-insert-modal__ext-hint--warn');
        }
      });

      // 外部クリックで閉じる
      this._linkModalCloseHandler = (e) => {
        if (!modal.contains(e.target)) {
          this._closeLinkInsertModal();
        }
      };
      setTimeout(() => document.addEventListener('mousedown', this._linkModalCloseHandler), 0);

      document.body.appendChild(modal);
      this._linkInsertModal = modal;
      input.focus();
    }

    _getAllChaptersForLinkModal() {
      var Store = window.ZWChapterStore;
      var S = window.ZenWriterStorage;
      var rawId = S && typeof S.getCurrentDocId === 'function' ? S.getCurrentDocId() : null;
      var docId =
        rawId && Store && typeof Store.resolveParentDocumentId === 'function'
          ? Store.resolveParentDocumentId(rawId)
          : rawId;
      if (docId && Store && typeof Store.isChapterMode === 'function' && Store.isChapterMode(docId)) {
        return (Store.getChaptersForDoc(docId) || []).map(function (sc) {
          return { id: sc.id, title: sc.name || '', visibility: sc.visibility || 'visible' };
        });
      }
      // Legacy fallback
      if (window.ZWChapterNav && typeof window.ZWChapterNav.getVisibleChapters === 'function') {
        return window.ZWChapterNav.getVisibleChapters();
      }
      return [];
    }

    _closeLinkInsertModal() {
      if (this._linkInsertModal) {
        this._linkInsertModal.remove();
        this._linkInsertModal = null;
      }
      if (this._linkModalCloseHandler) {
        document.removeEventListener('mousedown', this._linkModalCloseHandler);
        this._linkModalCloseHandler = null;
      }
    }
  }

  function install(proto) {
    Object.getOwnPropertyNames(LinkActions.prototype).forEach(function (name) {
      if (name === 'constructor') return;
      Object.defineProperty(proto, name, Object.getOwnPropertyDescriptor(LinkActions.prototype, name));
    });
  }

  root.RichTextLinkActions = { install: install };
})(typeof window !== 'undefined' ? window : globalThis);
