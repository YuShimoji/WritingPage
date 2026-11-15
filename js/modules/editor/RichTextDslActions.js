/**
 * RichTextDslActions
 * リッチ編集の DSL ブロック挿入: 属性設定モーダル（typing / dialog / scroll / pathtext）と各ブロックの挿入。
 * RichTextEditor のプロトタイプへメソッドをそのまま差し込む（呼び出し側の this._showDslModal 等は変更なし）。
 * 依存: RichTextEditor 側の wysiwygEditor / isWysiwygMode / _captureUndoSnapshot / _notifyChange。
 */
(function (root) {
  'use strict';

  class DslActions {
    _showDslModal(type, onConfirm) {
      var DSL_FIELDS = {
        typing: [
          { key: 'speed', label: '速度 (ms/字)', type: 'select', options: ['30ms', '50ms', '80ms', '120ms'], default: '30ms' },
          { key: 'mode', label: 'モード', type: 'select', options: ['auto', 'click', 'scroll'], default: 'auto' }
        ],
        dialog: [
          { key: 'speaker', label: '話者名', type: 'text', default: 'キャラクター' },
          { key: 'position', label: '位置', type: 'select', options: ['left', 'right', 'center'], default: 'left' },
          { key: 'style', label: 'スタイル', type: 'select', options: ['default', 'dark', 'neon', 'retro'], default: 'default' }
        ],
        scroll: [
          { key: 'effect', label: 'エフェクト', type: 'select', options: ['fade-in', 'slide-in', 'slide-up'], default: 'fade-in' },
          { key: 'delay', label: '遅延 (ms)', type: 'text', default: '' },
          { key: 'threshold', label: '閾値 (0-1)', type: 'text', default: '0.2' }
        ],
        pathtext: [
          { key: 'path', label: 'パス形状', type: 'select', options: [
            'M20,100 Q200,10 380,100',
            'M20,60 C100,0 300,120 380,60',
            'M20,60 L380,60',
            'M200,10 A90,90 0 1,1 200,190'
          ], default: 'M20,100 Q200,10 380,100', labels: ['波形', 'S字カーブ', '直線', '円弧'] }
        ]
      };
      var fields = DSL_FIELDS[type];
      if (!fields || fields.length === 0) { onConfirm({}); return; }

      // 既存モーダルを除去
      var existing = document.getElementById('dsl-attr-modal');
      if (existing) existing.remove();

      var overlay = document.createElement('div');
      overlay.id = 'dsl-attr-modal';
      overlay.className = 'dsl-attr-modal-overlay';

      var modal = document.createElement('div');
      modal.className = 'dsl-attr-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'dsl-attr-modal-title');

      var title = document.createElement('div');
      title.className = 'dsl-attr-modal__title';
      title.id = 'dsl-attr-modal-title';
      var typeNames = { typing: 'タイピング演出', dialog: 'ダイアログ', scroll: 'スクロール演出', pathtext: 'パステキスト' };
      title.textContent = (typeNames[type] || type) + ' の設定';
      modal.appendChild(title);

      var inputs = {};
      fields.forEach(function (field) {
        var row = document.createElement('div');
        row.className = 'dsl-attr-modal__row';

        var label = document.createElement('label');
        label.className = 'dsl-attr-modal__label';
        label.textContent = field.label;
        row.appendChild(label);

        if (field.type === 'select') {
          var sel = document.createElement('select');
          sel.className = 'dsl-attr-modal__input';
          (field.options || []).forEach(function (opt, i) {
            var optEl = document.createElement('option');
            optEl.value = opt;
            optEl.textContent = field.labels ? field.labels[i] : opt;
            if (opt === field.default) optEl.selected = true;
            sel.appendChild(optEl);
          });
          row.appendChild(sel);
          inputs[field.key] = sel;
        } else {
          var inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'dsl-attr-modal__input';
          inp.value = field.default || '';
          inp.placeholder = field.label;
          row.appendChild(inp);
          inputs[field.key] = inp;
        }
        modal.appendChild(row);
      });

      var actions = document.createElement('div');
      actions.className = 'dsl-attr-modal__actions';

      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'small dsl-attr-modal__cancel';
      cancelBtn.textContent = 'キャンセル';
      cancelBtn.addEventListener('click', function () { overlay.remove(); });
      actions.appendChild(cancelBtn);

      var confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = 'small dsl-attr-modal__confirm';
      confirmBtn.textContent = '挿入';
      confirmBtn.addEventListener('click', function () {
        var attrs = {};
        Object.keys(inputs).forEach(function (key) {
          var val = inputs[key].value;
          if (val) attrs[key] = val;
        });
        overlay.remove();
        onConfirm(attrs);
      });
      actions.appendChild(confirmBtn);
      modal.appendChild(actions);

      overlay.appendChild(modal);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.remove();
      });

      document.body.appendChild(overlay);
      // 最初の入力にフォーカス
      var firstInput = modal.querySelector('input, select');
      if (firstInput) firstInput.focus();
    }

    /**
     * WYSIWYG にタイピング演出ブロックを挿入 (SP-074 Phase 3)
     */
    _insertTypingBlock(attrs) {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;
      attrs = attrs || {};
      this._captureUndoSnapshot();
      this.wysiwygEditor.focus();

      var div = document.createElement('div');
      div.className = 'zw-typing';
      div.setAttribute('data-speed', attrs.speed || '30ms');
      div.setAttribute('data-mode', attrs.mode || 'auto');
      div.setAttribute('aria-live', 'polite');

      var textSpan = document.createElement('span');
      textSpan.className = 'zw-typing__text';
      textSpan.textContent = 'ここにテキストを入力';
      var fullSpan = document.createElement('span');
      fullSpan.className = 'zw-typing__full sr-only';
      fullSpan.textContent = 'ここにテキストを入力';
      div.appendChild(textSpan);
      div.appendChild(fullSpan);

      var selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        if (this.wysiwygEditor.contains(range.commonAncestorContainer)) {
          range.collapse(false);
          range.insertNode(div);
          var newRange = document.createRange();
          newRange.selectNodeContents(textSpan);
          selection.removeAllRanges();
          selection.addRange(newRange);
          this._notifyChange();
          return;
        }
      }
      this.wysiwygEditor.appendChild(div);
      this._notifyChange();
    }

    /**
     * WYSIWYG にダイアログブロックを挿入 (SP-074 Phase 3)
     */
    _insertDialogBlock(attrs) {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;
      attrs = attrs || {};
      this._captureUndoSnapshot();
      this.wysiwygEditor.focus();

      var pos = attrs.position || 'left';
      var sty = attrs.style || 'default';
      var speaker = attrs.speaker || 'キャラクター';

      var div = document.createElement('div');
      div.className = 'zw-dialog zw-dialog--' + pos + ' zw-dialog--' + sty;
      div.setAttribute('data-dialog-position', pos);
      div.setAttribute('data-dialog-style', sty);
      div.setAttribute('data-dialog-speaker', speaker);

      var body = document.createElement('div');
      body.className = 'zw-dialog__body';
      var speakerEl = document.createElement('div');
      speakerEl.className = 'zw-dialog__speaker';
      speakerEl.textContent = speaker;
      var contentEl = document.createElement('div');
      contentEl.className = 'zw-dialog__content';
      contentEl.textContent = 'セリフを入力';
      body.appendChild(speakerEl);
      body.appendChild(contentEl);
      div.appendChild(body);

      var selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        if (this.wysiwygEditor.contains(range.commonAncestorContainer)) {
          range.collapse(false);
          range.insertNode(div);
          var newRange = document.createRange();
          newRange.selectNodeContents(contentEl);
          selection.removeAllRanges();
          selection.addRange(newRange);
          this._notifyChange();
          return;
        }
      }
      this.wysiwygEditor.appendChild(div);
      this._notifyChange();
    }

    /**
     * WYSIWYG にスクロール連動ブロックを挿入
     */
    _insertScrollBlock(attrs) {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;
      attrs = attrs || {};
      this._captureUndoSnapshot();
      this.wysiwygEditor.focus();

      var effect = attrs.effect || 'fade-in';
      var div = document.createElement('div');
      div.className = 'zw-scroll zw-scroll--' + effect;
      div.setAttribute('data-effect', effect);
      div.setAttribute('data-delay', attrs.delay || '0ms');
      div.setAttribute('data-threshold', attrs.threshold || '0.2');

      var content = document.createElement('div');
      content.className = 'zw-scroll__content';
      content.textContent = 'スクロールで表示されるテキスト';
      div.appendChild(content);

      var selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        if (this.wysiwygEditor.contains(range.commonAncestorContainer)) {
          range.collapse(false);
          range.insertNode(div);
          var newRange = document.createRange();
          newRange.selectNodeContents(content);
          selection.removeAllRanges();
          selection.addRange(newRange);
          this._notifyChange();
          return;
        }
      }
      this.wysiwygEditor.appendChild(div);
      this._notifyChange();
    }
  }

  function install(proto) {
    Object.getOwnPropertyNames(DslActions.prototype).forEach(function (name) {
      if (name === 'constructor') return;
      Object.defineProperty(proto, name, Object.getOwnPropertyDescriptor(DslActions.prototype, name));
    });
  }

  root.RichTextDslActions = { install: install };
})(typeof window !== 'undefined' ? window : globalThis);
