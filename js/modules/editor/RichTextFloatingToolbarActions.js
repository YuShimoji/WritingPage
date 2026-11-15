/**
 * RichTextFloatingToolbarActions
 * リッチ編集のフローティングツールバー（選択連動表示・配置・settle）と書式状態インジケータの同期。
 * RichTextEditor のプロトタイプへメソッドをそのまま差し込む（呼び出し側の this._showFloatingToolbar 等は変更なし）。
 * 依存: RichTextEditor 側の wysiwygEditor / wysiwygToolbar / isWysiwygMode / _saveEditorSelection / _restoreEditorSelection /
 *       _floatingToolbar* フィールド（constructor で初期化）。
 */
(function (root) {
  'use strict';

  class FloatingToolbarActions {
    /**
     * フローティングツールバーの選択連動表示
     */
    setupFloatingToolbar() {
      if (!this.wysiwygEditor || !this.wysiwygToolbar) return;
      var self = this;
      // 初期状態で非表示を確定
      this.wysiwygToolbar.setAttribute('data-visible', 'false');

      document.addEventListener('selectionchange', function () {
        // UIモードが reader の場合は表示しない
        var uiMode = document.documentElement.getAttribute('data-ui-mode');
        if (uiMode === 'reader') {
          self._hideFloatingToolbar();
          return;
        }
        if (!self.isWysiwygMode) {
          self._cancelFloatingToolbarSettle();
          self._hideFloatingToolbar();
          self._syncFormatState();
          return;
        }
        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
          self._cancelFloatingToolbarSettle();
          self._hideFloatingToolbar();
          self._syncFormatState();
          return;
        }
        var range = sel.getRangeAt(0);
        if (!self.wysiwygEditor.contains(range.commonAncestorContainer)) {
          self._cancelFloatingToolbarSettle();
          self._hideFloatingToolbar();
          self._syncFormatState();
          return;
        }
        if (self._floatingToolbarPointerSelecting) {
          self._cancelFloatingToolbarSettle();
          self._hideFloatingToolbar();
        } else {
          self._scheduleFloatingToolbar();
        }
        self._syncFormatState();
      });

      // ドラッグ選択中はツールバーを追従させず、pointerup 後にだけ配置する。
      this.wysiwygEditor.addEventListener('pointerdown', function () {
        self._floatingToolbarPointerSelecting = true;
        self._cancelFloatingToolbarSettle();
        self._hideFloatingToolbar();
      });
      var finishPointerSelection = function () {
        if (!self._floatingToolbarPointerSelecting) return;
        self._floatingToolbarPointerSelecting = false;
        self._scheduleFloatingToolbar();
      };
      document.addEventListener('pointerup', finishPointerSelection);
      document.addEventListener('pointercancel', finishPointerSelection);

      // Shift+Arrow の連続変更中や通常の caret 移動では、settle 前の toolbar を隠す。
      this.wysiwygEditor.addEventListener('keydown', function (e) {
        var navigationKeys = [
          'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
          'Home', 'End', 'PageUp', 'PageDown'
        ];
        if (e.key === 'Escape' || navigationKeys.indexOf(e.key) >= 0) {
          self._cancelFloatingToolbarSettle();
          self._hideFloatingToolbar();
        }
      });

      // ツールバー上のマウスダウンで非表示を防止
      this.wysiwygToolbar.addEventListener('mousedown', function (e) {
        // ボタン以外のツールバー領域クリック時も選択を保持
        if (!e.target.closest('button')) e.preventDefault();
      });

      // 既存の mousedown command を keyboard click からも利用できるようにする。
      this.wysiwygToolbar.addEventListener('click', function (e) {
        var button = e.target.closest('button');
        if (!button || e.detail !== 0 || button.disabled) return;
        e.preventDefault();
        button.dispatchEvent(new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          button: 0
        }));
      });

      this.wysiwygToolbar.addEventListener('focusin', function () {
        var saved = self._saveEditorSelection();
        if (saved) self._floatingToolbarSelection = saved;
      });

      this.wysiwygToolbar.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        var saved = self._floatingToolbarSelection && self._floatingToolbarSelection.cloneRange();
        self._cancelFloatingToolbarSettle();
        self._hideFloatingToolbar();
        self.wysiwygEditor.focus({ preventScroll: true });
        self._restoreEditorSelection(saved);
      });

      this.wysiwygToolbar.addEventListener('focusout', function () {
        setTimeout(function () {
          var active = document.activeElement;
          if (self.wysiwygToolbar.contains(active) || active === self.wysiwygEditor) return;
          self._cancelFloatingToolbarSettle();
          self._hideFloatingToolbar();
        }, 0);
      });
    }

    /** @private フローティングツールバーの表示状態を属性から取得 */
    _isFloatingVisible() {
      return this.wysiwygToolbar && this.wysiwygToolbar.getAttribute('data-visible') === 'true';
    }

    /** @private 保留中の toolbar 配置を取り消す */
    _cancelFloatingToolbarSettle() {
      if (this._floatingToolbarSettleTimer) {
        clearTimeout(this._floatingToolbarSettleTimer);
        this._floatingToolbarSettleTimer = null;
      }
    }

    /** @private selection geometry が安定してから toolbar を配置する */
    _scheduleFloatingToolbar() {
      if (!this.wysiwygEditor || !this.wysiwygToolbar || !this.isWysiwygMode) return;
      this._cancelFloatingToolbarSettle();
      this._hideFloatingToolbar();
      var self = this;
      this._floatingToolbarSettleTimer = setTimeout(function () {
        self._floatingToolbarSettleTimer = null;
        var selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          self._hideFloatingToolbar();
          return;
        }
        var range = selection.getRangeAt(0);
        if (!self.wysiwygEditor.contains(range.commonAncestorContainer)) {
          self._hideFloatingToolbar();
          return;
        }
        var active = document.activeElement;
        if (active !== self.wysiwygEditor && !self.wysiwygToolbar.contains(active)) {
          self._hideFloatingToolbar();
          return;
        }
        self._floatingToolbarSelection = range.cloneRange();
        self._showFloatingToolbar(range);
      }, this._floatingToolbarSettleDelay);
    }

    /** @private フローティングツールバーを選択範囲の近くに表示 (position: fixed) */
    _showFloatingToolbar(range) {
      var selectionRects = Array.prototype.slice.call(range.getClientRects()).filter(function (rect) {
        return rect.width > 0 || rect.height > 0;
      });
      if (selectionRects.length === 0) {
        var fallbackRect = range.getBoundingClientRect();
        if (fallbackRect.width === 0 && fallbackRect.height === 0) return;
        selectionRects = [fallbackRect];
      }

      var editorRect = this.wysiwygEditor.getBoundingClientRect();
      var viewport = {
        left: Math.max(0, editorRect.left),
        right: Math.min(window.innerWidth, editorRect.right),
        top: Math.max(0, editorRect.top),
        bottom: Math.min(window.innerHeight, editorRect.bottom)
      };
      if (viewport.right <= viewport.left || viewport.bottom <= viewport.top) {
        this._hideFloatingToolbar();
        return;
      }

      var selectionTop = Math.min.apply(null, selectionRects.map(function (rect) { return rect.top; }));
      var selectionBottom = Math.max.apply(null, selectionRects.map(function (rect) { return rect.bottom; }));
      var selectionLeft = Math.min.apply(null, selectionRects.map(function (rect) { return rect.left; }));
      var selectionRight = Math.max.apply(null, selectionRects.map(function (rect) { return rect.right; }));
      var maxSelectionHeight = Math.max.apply(null, selectionRects.map(function (rect) { return rect.height; }));
      var editorStyle = window.getComputedStyle(this.wysiwygEditor);
      var lineHeight = parseFloat(editorStyle.lineHeight);
      if (!Number.isFinite(lineHeight)) {
        lineHeight = (parseFloat(editorStyle.fontSize) || 16) * 1.6;
      }
      // 選択行に加え、直前・直後の可視 1 行を protected band とする。
      // 隣接 block がある場合は段落間 margin も含め、直前 block の最終行／直後 block の先頭行まで保護する。
      var adjacentLineBand = Math.max(lineHeight, maxSelectionHeight, 20);
      var blockSelector = 'p, div, h1, h2, h3, h4, h5, h6, li, blockquote, pre';
      var closestLineBlock = function (node) {
        var element = node && node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        if (!element || typeof element.closest !== 'function') return null;
        var block = element.closest(blockSelector);
        return block && block !== this.wysiwygEditor && this.wysiwygEditor.contains(block) ? block : null;
      }.bind(this);
      var startBlock = closestLineBlock(range.startContainer);
      var endBlock = closestLineBlock(range.endContainer);
      var previousBlock = startBlock && startBlock.previousElementSibling;
      var nextBlock = endBlock && endBlock.nextElementSibling;
      var protectedTop = selectionTop - adjacentLineBand;
      var protectedBottom = selectionBottom + adjacentLineBand;
      if (previousBlock) {
        var previousRect = previousBlock.getBoundingClientRect();
        if (previousRect.bottom > viewport.top && previousRect.top < viewport.bottom) {
          protectedTop = Math.min(protectedTop, previousRect.bottom - adjacentLineBand);
        }
      }
      if (nextBlock) {
        var nextRect = nextBlock.getBoundingClientRect();
        if (nextRect.bottom > viewport.top && nextRect.top < viewport.bottom) {
          protectedBottom = Math.max(protectedBottom, nextRect.top + adjacentLineBand);
        }
      }
      protectedTop = Math.max(viewport.top, protectedTop);
      protectedBottom = Math.min(viewport.bottom, protectedBottom);
      var gap = 8;
      var margin = 12;
      var availableWidth = Math.max(1, viewport.right - viewport.left - margin * 2);

      // 毎回画面外で測定し、editor viewport 幅での実際の折り返し高を取得する。
      this.wysiwygToolbar.setAttribute('data-visible', 'true');
      this.wysiwygToolbar.style.top = '-9999px';
      this.wysiwygToolbar.style.left = (viewport.left + viewport.right) / 2 + 'px';
      this.wysiwygToolbar.style.transform = 'translateX(-50%)';
      this.wysiwygToolbar.style.maxWidth = availableWidth + 'px';
      var tbRect = this.wysiwygToolbar.getBoundingClientRect();
      var tbW = tbRect.width || 300;
      var toolbarH = tbRect.height || 44;
      var viewportTop = viewport.top + margin;
      var viewportBottom = viewport.bottom - margin;
      var aboveTop = protectedTop - gap - toolbarH;
      var belowTop = protectedBottom + gap;
      var aboveFits = aboveTop >= viewportTop;
      var belowFits = belowTop + toolbarH <= viewportBottom;
      var top = null;
      var placement = '';

      if (aboveFits) {
        top = aboveTop;
        placement = 'above';
      } else if (belowFits) {
        top = belowTop;
        placement = 'below';
      }

      // 前後行を含む protected band と重ならない場所がなければ表示しない。
      if (top === null) {
        this._hideFloatingToolbar();
        return;
      }

      var left = (selectionLeft + selectionRight) / 2;
      var minCenter = viewport.left + margin + tbW / 2;
      var maxCenter = viewport.right - margin - tbW / 2;
      if (minCenter <= maxCenter) {
        left = Math.max(minCenter, Math.min(left, maxCenter));
      } else {
        left = (viewport.left + viewport.right) / 2;
      }

      this.wysiwygToolbar.style.top = top + 'px';
      this.wysiwygToolbar.style.left = left + 'px';
      this.wysiwygToolbar.style.transform = 'translateX(-50%)';
      this.wysiwygToolbar.setAttribute('data-placement', placement);
      this.wysiwygToolbar.setAttribute('data-protected-top', protectedTop.toFixed(1));
      this.wysiwygToolbar.setAttribute('data-protected-bottom', protectedBottom.toFixed(1));
      this.wysiwygToolbar.setAttribute('data-visible', 'true');
    }

    /** @private フローティングツールバーを非表示 */
    _hideFloatingToolbar() {
      if (!this.wysiwygToolbar) return;
      this.wysiwygToolbar.setAttribute('data-visible', 'false');
      this.wysiwygToolbar.removeAttribute('data-placement');
      this.wysiwygToolbar.removeAttribute('data-protected-top');
      this.wysiwygToolbar.removeAttribute('data-protected-bottom');
      // ドロップダウンも閉じる
      this.wysiwygToolbar.querySelectorAll('.wysiwyg-dropdown').forEach(function (d) {
        d.setAttribute('data-open', 'false');
      });
    }

    // ─── BL-003: 書式状態インジケータ ──────────────────────
    /**
     * @private ツールバーボタンの aria-pressed と書式インジケータを同期
     */
    _syncFormatState() {
      if (!this.isWysiwygMode) {
        this._updateFormatIndicator([]);
        return;
      }

      var states = [
        { id: 'wysiwyg-bold', cmd: 'bold', label: 'B' },
        { id: 'wysiwyg-italic', cmd: 'italic', label: 'I' },
        { id: 'wysiwyg-underline', cmd: 'underline', label: 'U' },
        { id: 'wysiwyg-strike', cmd: 'strikeThrough', label: 'S' },
      ];

      var active = [];
      for (var i = 0; i < states.length; i++) {
        var s = states[i];
        var on = false;
        try { on = document.queryCommandState(s.cmd); } catch (_) {}
        var btn = document.getElementById(s.id);
        if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) active.push(s.label);
      }

      // decor-* span の検出
      var sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && this.wysiwygEditor) {
        var node = sel.getRangeAt(0).startContainer;
        var el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        while (el && el !== this.wysiwygEditor) {
          if (el.tagName === 'SPAN' && el.className && /^decor-/.test(el.className)) {
            active.push(el.className.replace('decor-', ''));
          }
          el = el.parentElement;
        }
      }

      this._updateFormatIndicator(active);
    }

    /**
     * @private 書式インジケータ要素を更新
     */
    _updateFormatIndicator(activeLabels) {
      var indicator = document.getElementById('wysiwyg-format-indicator');
      if (!indicator) return;
      if (!activeLabels || activeLabels.length === 0) {
        indicator.textContent = '';
        indicator.style.display = 'none';
        return;
      }
      indicator.textContent = activeLabels.join(' + ');
      indicator.style.display = '';
    }
  }

  function install(proto) {
    Object.getOwnPropertyNames(FloatingToolbarActions.prototype).forEach(function (name) {
      if (name === 'constructor') return;
      Object.defineProperty(proto, name, Object.getOwnPropertyDescriptor(FloatingToolbarActions.prototype, name));
    });
  }

  root.RichTextFloatingToolbarActions = { install: install };
})(typeof window !== 'undefined' ? window : globalThis);
