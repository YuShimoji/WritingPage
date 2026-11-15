/**
 * RichTextRubyKentenActions
 * リッチ編集のルビ・傍点操作: 挿入/編集/削除ポップアップ、ruby 要素・.kenten 要素の付与と解除。
 * RichTextEditor のプロトタイプへメソッドをそのまま差し込む（呼び出し側の this._handleRubyAction 等は変更なし）。
 * 依存: RichTextEditor 側の wysiwygEditor / isWysiwygMode / _captureUndoSnapshot / _notifyChange。
 */
(function (root) {
  'use strict';

  class RubyKentenActions {
    /**
     * ルビボタンクリック: 選択テキストにルビを付与、または既存ルビを編集
     */
    _handleRubyAction() {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;
      var selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // 選択範囲内にruby要素があれば編集モード
      var range = selection.getRangeAt(0);
      var rubyEl = range.commonAncestorContainer.closest
        ? range.commonAncestorContainer.closest('ruby')
        : null;
      if (!rubyEl && range.commonAncestorContainer.parentElement) {
        rubyEl = range.commonAncestorContainer.parentElement.closest('ruby');
      }
      if (rubyEl) {
        this._showRubyEditPopup(rubyEl);
        return;
      }

      // テキスト選択がなければ何もしない
      var selectedText = selection.toString().trim();
      if (!selectedText) return;

      this._showRubyInsertPopup(range, selectedText);
    }

    /**
     * ルビ挿入ポップアップ (選択テキストの近くに表示)
     */
    _showRubyInsertPopup(range, baseText) {
      this._removeRubyPopup();
      var self = this;

      var rect = range.getBoundingClientRect();
      var popup = document.createElement('div');
      popup.id = 'ruby-popup';
      popup.className = 'ruby-popup';
      popup.setAttribute('role', 'dialog');
      popup.setAttribute('aria-label', 'ルビ入力');
      popup.style.top = (rect.top - 40 + window.scrollY) + 'px';
      popup.style.left = rect.left + 'px';

      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'ruby-popup__input';
      input.placeholder = 'ルビを入力';
      input.setAttribute('aria-label', 'ルビ入力');
      popup.appendChild(input);

      var okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'small ruby-popup__ok';
      okBtn.textContent = '確定';
      okBtn.addEventListener('click', function () {
        var reading = input.value.trim();
        if (reading) {
          self._applyRuby(range, baseText, reading);
        }
        self._removeRubyPopup();
      });
      popup.appendChild(okBtn);

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { okBtn.click(); e.preventDefault(); }
        if (e.key === 'Escape') { self._removeRubyPopup(); }
      });

      document.body.appendChild(popup);
      input.focus();
    }

    /**
     * ルビ編集/削除ポップアップ (既存のruby要素をクリック)
     */
    _showRubyEditPopup(rubyEl) {
      this._removeRubyPopup();
      var self = this;

      var rtEl = rubyEl.querySelector('rt');
      var currentReading = rtEl ? rtEl.textContent : '';
      var baseText = '';
      for (var i = 0; i < rubyEl.childNodes.length; i++) {
        if (rubyEl.childNodes[i].nodeName !== 'RT' && rubyEl.childNodes[i].nodeName !== 'RP') {
          baseText += rubyEl.childNodes[i].textContent || '';
        }
      }

      var rect = rubyEl.getBoundingClientRect();
      var popup = document.createElement('div');
      popup.id = 'ruby-popup';
      popup.className = 'ruby-popup';
      popup.setAttribute('role', 'dialog');
      popup.setAttribute('aria-label', 'ルビ編集');
      popup.style.top = (rect.top - 40 + window.scrollY) + 'px';
      popup.style.left = rect.left + 'px';

      var label = document.createElement('span');
      label.className = 'ruby-popup__label';
      label.textContent = baseText;
      popup.appendChild(label);

      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'ruby-popup__input';
      input.value = currentReading;
      input.setAttribute('aria-label', 'ルビ編集');
      popup.appendChild(input);

      var okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'small ruby-popup__ok';
      okBtn.textContent = '更新';
      okBtn.addEventListener('click', function () {
        var reading = input.value.trim();
        if (reading) {
          self._captureUndoSnapshot();
          rtEl.textContent = reading;
          self._notifyChange();
        }
        self._removeRubyPopup();
      });
      popup.appendChild(okBtn);

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'small ruby-popup__delete';
      delBtn.textContent = '削除';
      delBtn.addEventListener('click', function () {
        self._captureUndoSnapshot();
        rubyEl.replaceWith(document.createTextNode(baseText));
        self._notifyChange();
        self._removeRubyPopup();
      });
      popup.appendChild(delBtn);

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { okBtn.click(); e.preventDefault(); }
        if (e.key === 'Escape') { self._removeRubyPopup(); }
      });

      document.body.appendChild(popup);
      input.focus();
      input.select();
    }

    /**
     * 選択範囲をruby要素で包む
     */
    _applyRuby(range, baseText, reading) {
      this._captureUndoSnapshot();
      var ruby = document.createElement('ruby');
      ruby.textContent = baseText;
      var rt = document.createElement('rt');
      rt.textContent = reading;
      ruby.appendChild(rt);

      range.deleteContents();
      range.insertNode(ruby);

      // カーソルを ruby 要素の外側に確実に配置する
      // Chromium は setStartAfter(ruby) だけでは後続入力を <rt> 内に挿入してしまう
      // ゼロ幅スペースのテキストノードを挿入し、そこにカーソルを配置することで回避
      var spacer = document.createTextNode('\u200B');
      ruby.parentNode.insertBefore(spacer, ruby.nextSibling);
      var sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        var newRange = document.createRange();
        newRange.setStart(spacer, 1);
        newRange.collapse(true);
        sel.addRange(newRange);
      }
      this._notifyChange();
    }

    _removeRubyPopup() {
      var existing = document.getElementById('ruby-popup');
      if (existing) existing.remove();
      // エディタにフォーカスを戻す
      if (this.wysiwygEditor && this.isWysiwygMode) {
        this.wysiwygEditor.focus();
      }
    }

    // ---- 傍点 (kenten) ----

    /**
     * 傍点ボタンクリック: 選択テキストに傍点を付与
     */
    _handleKentenAction() {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;
      var selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      var range = selection.getRangeAt(0);

      // 選択範囲内にkenten要素があれば解除
      var kentenEl = range.commonAncestorContainer.closest
        ? range.commonAncestorContainer.closest('.kenten')
        : null;
      if (!kentenEl && range.commonAncestorContainer.parentElement) {
        kentenEl = range.commonAncestorContainer.parentElement.closest('.kenten');
      }
      if (kentenEl) {
        this._removeKenten(kentenEl);
        return;
      }

      // テキスト選択がなければ何もしない
      var selectedText = selection.toString().trim();
      if (!selectedText) return;

      this._applyKenten(range, selectedText);
    }

    /**
     * 選択範囲を <span class="kenten"> で包む
     */
    _applyKenten(range, text) {
      this._captureUndoSnapshot();
      var span = document.createElement('span');
      span.className = 'kenten';
      span.textContent = text;

      range.deleteContents();
      range.insertNode(span);

      // カーソルを傍点要素の外側に確実に配置する
      var spacer = document.createTextNode('\u200B');
      span.parentNode.insertBefore(spacer, span.nextSibling);
      var sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        var newRange = document.createRange();
        newRange.setStart(spacer, 1);
        newRange.collapse(true);
        sel.addRange(newRange);
      }
      this._notifyChange();
    }

    /**
     * 傍点を解除（テキストノードに戻す）
     */
    _removeKenten(kentenEl) {
      this._captureUndoSnapshot();
      var text = kentenEl.textContent;
      var textNode = document.createTextNode(text);
      kentenEl.replaceWith(textNode);
      // 隣接テキストノードを結合して選択可能にする
      if (this.wysiwygEditor) this.wysiwygEditor.normalize();
      // 解除したテキストを選択状態にする（即座に再適用可能）
      var sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        var range = document.createRange();
        range.selectNodeContents(textNode);
        sel.addRange(range);
      }
      this._notifyChange();
    }

    /**
     * 傍点クリック時の削除確認ポップアップ
     */
    _showKentenRemovePopup(kentenEl) {
      this._removeRubyPopup(); // 既存ポップアップを閉じる
      var self = this;

      var rect = kentenEl.getBoundingClientRect();
      var popup = document.createElement('div');
      popup.id = 'ruby-popup';
      popup.className = 'ruby-popup';
      popup.setAttribute('role', 'dialog');
      popup.setAttribute('aria-label', '傍点');
      popup.style.top = (rect.top - 40 + window.scrollY) + 'px';
      popup.style.left = rect.left + 'px';

      var label = document.createElement('span');
      label.className = 'ruby-popup__label';
      label.textContent = kentenEl.textContent;
      popup.appendChild(label);

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'small ruby-popup__delete';
      delBtn.textContent = '解除';
      delBtn.addEventListener('click', function () {
        self._removeKenten(kentenEl);
        self._removeRubyPopup();
      });
      popup.appendChild(delBtn);

      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'small ruby-popup__ok';
      cancelBtn.textContent = '閉じる';
      cancelBtn.addEventListener('click', function () {
        self._removeRubyPopup();
      });
      popup.appendChild(cancelBtn);

      popup.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { self._removeRubyPopup(); }
      });

      document.body.appendChild(popup);
      delBtn.focus();
    }
  }

  function install(proto) {
    Object.getOwnPropertyNames(RubyKentenActions.prototype).forEach(function (name) {
      if (name === 'constructor') return;
      Object.defineProperty(proto, name, Object.getOwnPropertyDescriptor(RubyKentenActions.prototype, name));
    });
  }

  root.RichTextRubyKentenActions = { install: install };
})(typeof window !== 'undefined' ? window : globalThis);
