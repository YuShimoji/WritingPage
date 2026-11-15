/**
 * RichTextPathTextActions
 * リッチ編集のパステキスト（SP-073）操作: 挿入・制御点オーバーレイ・コンテキストメニュー・形状/配置/パス線の変更。
 * RichTextEditor のプロトタイプへメソッドをそのまま差し込む（呼び出し側の this._insertPathtextBlock 等は変更なし）。
 * 依存: RichTextEditor 側の wysiwygEditor / isWysiwygMode / _captureUndoSnapshot / _notifyChange、window.PathHandleOverlay。
 */
(function (root) {
  'use strict';

  class PathTextActions {
    /**
     * WYSIWYG にパステキストブロックを挿入
     */
    _insertPathtextBlock(attrs) {
      if (!this.wysiwygEditor || !this.isWysiwygMode) return;
      attrs = attrs || {};
      this._captureUndoSnapshot();
      this.wysiwygEditor.focus();

      var pathD = attrs.path || 'M20,100 Q200,10 380,100';
      var isArc = pathD.indexOf(' A') !== -1;
      var viewH = isArc ? 200 : 120;

      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'zw-pathtext');
      svg.setAttribute('viewBox', '0 0 400 ' + viewH);
      svg.setAttribute('width', '400');
      svg.setAttribute('height', String(viewH));
      svg.setAttribute('data-path', pathD);

      var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      var pathId = 'zw-path-' + Date.now();
      path.setAttribute('id', pathId);
      path.setAttribute('d', pathD);
      path.setAttribute('fill', 'none');
      defs.appendChild(path);
      svg.appendChild(defs);

      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      var textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
      textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + pathId);
      textPath.textContent = 'パスに沿ったテキスト';
      text.appendChild(textPath);
      svg.appendChild(text);

      var wrapper = document.createElement('div');
      wrapper.className = 'zw-pathtext-wrapper';
      wrapper.appendChild(svg);

      var selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        if (this.wysiwygEditor.contains(range.commonAncestorContainer)) {
          range.collapse(false);
          range.insertNode(wrapper);
          this._notifyChange();
          return;
        }
      }
      this.wysiwygEditor.appendChild(wrapper);
      this._notifyChange();
    }

    // ---- SP-073 Phase 2: パステキスト制御点オーバーレイ ----

    _attachPathOverlay(pathtextEl) {
      if (!window.PathHandleOverlay) return;
      if (!this._pathOverlay) {
        this._pathOverlay = new window.PathHandleOverlay.PathHandleOverlay();
        this._pathOverlay.onChange(() => {
          this._captureUndoSnapshot();
          this._notifyChange();
        });
      }
      this._pathOverlay.attach(pathtextEl);
    }

    _detachPathOverlay() {
      if (this._pathOverlay) {
        this._pathOverlay.detach();
      }
    }

    // ---- SP-073 Phase 3: パステキスト コンテキストメニュー ----

    _showPathtextContextMenu(pathtextEl, x, y) {
      this._closePathtextContextMenu();
      var self = this;
      var PH = window.PathHandleOverlay;
      if (!PH) return;

      var menu = document.createElement('div');
      menu.className = 'cl-context-menu';
      menu.setAttribute('role', 'menu');
      this._pathtextContextMenu = menu;

      // -- プリセットヘッダー --
      var presetHeader = document.createElement('div');
      presetHeader.className = 'cl-context-menu__header';
      presetHeader.textContent = 'パスの形状を変更';
      menu.appendChild(presetHeader);

      PH.PRESET_NAMES.forEach(function (name) {
        var btn = document.createElement('button');
        btn.className = 'cl-context-menu__item';
        btn.textContent = PH.PRESET_LABELS[name] || name;
        btn.setAttribute('role', 'menuitem');
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          self._applyPresetPath(pathtextEl, name);
          self._closePathtextContextMenu();
        });
        menu.appendChild(btn);
      });

      var sep1 = document.createElement('div');
      sep1.className = 'cl-context-menu__sep';
      menu.appendChild(sep1);

      // -- テキスト配置方向 --
      var sideHeader = document.createElement('div');
      sideHeader.className = 'cl-context-menu__header';
      sideHeader.textContent = 'テキスト配置方向';
      menu.appendChild(sideHeader);

      var currentSide = this._getPathtextSide(pathtextEl);
      [{ value: '', label: '左 (デフォルト)' }, { value: 'right', label: '右' }].forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 'cl-context-menu__item';
        btn.textContent = opt.label;
        btn.disabled = (currentSide === opt.value);
        btn.setAttribute('role', 'menuitem');
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          self._applyPathtextSide(pathtextEl, opt.value);
          self._closePathtextContextMenu();
        });
        menu.appendChild(btn);
      });

      var sep2 = document.createElement('div');
      sep2.className = 'cl-context-menu__sep';
      menu.appendChild(sep2);

      // -- パス線表示トグル --
      var hasStroke = this._pathtextHasStroke(pathtextEl);
      var strokeBtn = document.createElement('button');
      strokeBtn.className = 'cl-context-menu__item';
      strokeBtn.textContent = hasStroke ? 'パス線を非表示' : 'パス線を表示';
      strokeBtn.setAttribute('role', 'menuitem');
      strokeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        self._togglePathtextStroke(pathtextEl);
        self._closePathtextContextMenu();
      });
      menu.appendChild(strokeBtn);

      // -- フリーハンド描画 (Phase 4) --
      var sep3 = document.createElement('div');
      sep3.className = 'cl-context-menu__sep';
      menu.appendChild(sep3);

      var drawBtn = document.createElement('button');
      drawBtn.className = 'cl-context-menu__item';
      drawBtn.textContent = 'フリーハンド描画';
      drawBtn.setAttribute('role', 'menuitem');
      drawBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        self._closePathtextContextMenu();
        if (self._pathOverlay) {
          self._captureUndoSnapshot();
          self._pathOverlay.enterDrawingMode();
        }
      });
      menu.appendChild(drawBtn);

      // 位置調整
      document.body.appendChild(menu);
      var rect = menu.getBoundingClientRect();
      var viewW = window.innerWidth;
      var viewH = window.innerHeight;
      if (x + rect.width > viewW) x = viewW - rect.width - 4;
      if (y + rect.height > viewH) y = viewH - rect.height - 4;
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';
    }

    _closePathtextContextMenu() {
      if (this._pathtextContextMenu && this._pathtextContextMenu.parentNode) {
        this._pathtextContextMenu.parentNode.removeChild(this._pathtextContextMenu);
      }
      this._pathtextContextMenu = null;
    }

    _applyPresetPath(pathtextEl, presetName) {
      var PH = window.PathHandleOverlay;
      if (!PH) return;
      var newD = PH.generatePresetPath(presetName);
      if (!newD) return;

      this._captureUndoSnapshot();
      pathtextEl.setAttribute('data-path', newD);

      var svg = pathtextEl.querySelector('.zw-pathtext__svg');
      if (svg) {
        var defPath = svg.querySelector('defs path');
        if (defPath) defPath.setAttribute('d', newD);
        var nums = newD.match(/-?\d+\.?\d*/g);
        if (nums && nums.length >= 2) {
          var xs = [], ys = [];
          for (var i = 0; i < nums.length; i++) {
            (i % 2 === 0 ? xs : ys).push(parseFloat(nums[i]));
          }
          var pad = 20;
          svg.setAttribute('viewBox',
            (Math.min.apply(null, xs) - pad) + ' ' + (Math.min.apply(null, ys) - pad) + ' '
            + (Math.max.apply(null, xs) - Math.min.apply(null, xs) + pad * 2) + ' '
            + (Math.max.apply(null, ys) - Math.min.apply(null, ys) + pad * 2));
        }
      }

      // オーバーレイ再アタッチ
      if (this._pathOverlay && this._pathOverlay.isAttached()) {
        this._pathOverlay.detach();
        this._pathOverlay.attach(pathtextEl);
      }
      this._notifyChange();
    }

    _getPathtextSide(pathtextEl) {
      var svg = pathtextEl.querySelector('.zw-pathtext__svg');
      if (!svg) return '';
      var tp = svg.querySelector('textPath');
      return tp ? (tp.getAttribute('side') || '') : '';
    }

    _applyPathtextSide(pathtextEl, side) {
      var svg = pathtextEl.querySelector('.zw-pathtext__svg');
      if (!svg) return;
      var tp = svg.querySelector('textPath');
      if (!tp) return;
      this._captureUndoSnapshot();
      if (side) {
        tp.setAttribute('side', side);
      } else {
        tp.removeAttribute('side');
      }
      this._notifyChange();
    }

    _pathtextHasStroke(pathtextEl) {
      var svg = pathtextEl.querySelector('.zw-pathtext__svg');
      if (!svg) return false;
      var defPath = svg.querySelector('defs path');
      if (!defPath) return false;
      var stroke = defPath.getAttribute('stroke');
      return stroke && stroke !== 'none';
    }

    _togglePathtextStroke(pathtextEl) {
      var svg = pathtextEl.querySelector('.zw-pathtext__svg');
      if (!svg) return;
      var defPath = svg.querySelector('defs path');
      if (!defPath) return;
      this._captureUndoSnapshot();

      var current = defPath.getAttribute('stroke');
      if (current && current !== 'none') {
        defPath.setAttribute('stroke', 'none');
        defPath.setAttribute('stroke-width', '0');
        var useEl = svg.querySelector('use');
        if (useEl) useEl.remove();
      } else {
        defPath.setAttribute('stroke', '#888');
        defPath.setAttribute('stroke-width', '1');
        if (!svg.querySelector('use')) {
          var pathId = defPath.getAttribute('id');
          if (pathId) {
            var useNew = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            useNew.setAttribute('href', '#' + pathId);
            useNew.setAttribute('fill', 'transparent');
            useNew.setAttribute('stroke', '#888');
            useNew.setAttribute('stroke-width', '1');
            var textEl = svg.querySelector('text');
            if (textEl) svg.insertBefore(useNew, textEl);
            else svg.appendChild(useNew);
          }
        }
      }
      this._notifyChange();
    }
  }

  function install(proto) {
    Object.getOwnPropertyNames(PathTextActions.prototype).forEach(function (name) {
      if (name === 'constructor') return;
      Object.defineProperty(proto, name, Object.getOwnPropertyDescriptor(PathTextActions.prototype, name));
    });
  }

  root.RichTextPathTextActions = { install: install };
})(typeof window !== 'undefined' ? window : globalThis);
