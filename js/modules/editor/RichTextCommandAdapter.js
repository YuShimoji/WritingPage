/**
 * RichTextCommandAdapter
 * Centralizes WYSIWYG edit commands while preserving current behavior.
 */
(function () {
  'use strict';

  class RichTextCommandAdapter {
    constructor(options = {}) {
      this.editor = options.editor || null;
      this.doc = options.doc || document;
      this.onSelectionRequired = typeof options.onSelectionRequired === 'function'
        ? options.onSelectionRequired
        : function () { };
    }

    setEditor(editor) {
      this.editor = editor || null;
    }

    execute(command, value = null) {
      if (!this.editor) return false;
      const normalized = String(command || '').toLowerCase();
      const inlineMap = {
        bold: 'bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'strikeThrough',
        strike: 'strikeThrough'
      };
      if (inlineMap[normalized]) {
        return this.toggleInline(inlineMap[normalized]);
      }
      if (normalized === 'removeformat') {
        return this.removeFormat();
      }
      if (normalized === 'p' || normalized === 'h1' || normalized === 'h2' || normalized === 'h3' || normalized === 'blockquote' || normalized === 'ul' || normalized === 'ol') {
        return this.applyBlock(normalized);
      }
      if (normalized === 'alignstart' || normalized === 'aligncenter' || normalized === 'alignend') {
        var alignMap = { alignstart: 'start', aligncenter: 'center', alignend: 'end' };
        return this.applyBlockAlign(alignMap[normalized]);
      }
      return this._execCommandWithSelection(command, value);
    }

    toggleInline(type) {
      const cmd = this._normalizeInlineCommand(type);
      if (!cmd) return false;
      return this._execCommandWithSelection(cmd, null);
    }

    wrapWithClass(className) {
      if (!this.editor || !className) return false;
      this.editor.focus();

      const target = this._getSelectionRange();
      if (!target) return false;
      const range = target.range;

      const ancestor = range.commonAncestorContainer;
      const parentEl = ancestor && ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : ancestor;
      if (parentEl && parentEl.tagName === 'SPAN' && parentEl.classList.contains(className)) {
        const fragment = document.createDocumentFragment();
        while (parentEl.firstChild) fragment.appendChild(parentEl.firstChild);
        if (parentEl.parentNode) {
          parentEl.parentNode.replaceChild(fragment, parentEl);
        }
      } else {
        try {
          const span = document.createElement('span');
          span.className = className;
          range.surroundContents(span);
        } catch (_) {
          const span = document.createElement('span');
          span.className = className;
          span.appendChild(range.extractContents());
          range.insertNode(span);
        }
      }

      this.editor.focus();
      return true;
    }

    insertLink(url, fallbackText = '') {
      if (!this.editor || !url) return false;
      this.editor.focus();

      const target = this._getSelectionRange();
      if (!target) return false;
      const selection = target.selection;
      const range = target.range;
      const selectedText = (selection.toString() || '').trim();

      const link = document.createElement('a');
      link.href = url;
      link.textContent = selectedText || fallbackText || url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      range.deleteContents();
      range.insertNode(link);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(link);
      newRange.collapse(true);
      selection.addRange(newRange);

      this.editor.focus();
      return true;
    }

    insertText(text) {
      if (!this.editor) return false;
      this.editor.focus();

      const payload = String(text || '');
      if (typeof this.doc.execCommand === 'function') {
        try {
          return !!this.doc.execCommand('insertText', false, payload);
        } catch (_) {
          // Fallback below.
        }
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      const range = selection.getRangeAt(0);
      if (!this.editor.contains(range.commonAncestorContainer)) return false;
      range.deleteContents();
      range.insertNode(document.createTextNode(payload));
      return true;
    }

    removeFormat() {
      return this._execCommandWithSelection('removeFormat', null);
    }

    applyBlock(type) {
      const block = String(type || '').toLowerCase();
      if (block === 'ul') return this._execCommandWithSelection('insertUnorderedList', null);
      if (block === 'ol') return this._execCommandWithSelection('insertOrderedList', null);
      if (block === 'blockquote') return this._execCommandWithSelection('formatBlock', '<blockquote>');
      if (block === 'p' || block === 'h1' || block === 'h2' || block === 'h3') {
        return this._execCommandWithSelection('formatBlock', `<${block}>`);
      }
      return false;
    }

    /**
     * カーソル（折りたたみ可）のブロック根に data-zw-align を付与（P2 段落揃え）。
     * start は既定寄りのため属性除去。
     */
    applyBlockAlign(align) {
      var a = String(align || '').toLowerCase();
      if (a !== 'start' && a !== 'center' && a !== 'end') return false;
      if (!this.editor) return false;
      this.editor.focus();
      var target = this._getCaretOrSelectionRange();
      if (!target) return false;
      var node = target.range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      var block = this._findBlockRoot(node);
      if (!block || !this.editor.contains(block)) return false;
      if (a === 'start') {
        block.removeAttribute('data-zw-align');
      } else {
        block.setAttribute('data-zw-align', a);
      }
      this.editor.focus();
      return true;
    }

    sanitizeHtml(html) {
      var ALLOWED_TAGS = { p: 1, br: 1, strong: 1, em: 1, u: 1, s: 1, a: 1, h1: 1, h2: 1, h3: 1, ul: 1, ol: 1, li: 1, blockquote: 1, span: 1 };
      var BLOCK_ALIGN_TAGS = { p: 1, h1: 1, h2: 1, h3: 1, blockquote: 1, li: 1 };
      var SAFE_URL = /^(https?:|mailto:|\/|#)/i;
      var ALLOWED_CLASS = /^(decor-|anim-)/;

      try {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var body = doc.body;
        if (!body) return '';
        _sanitizeNode(body);
        return body.innerHTML;
      } catch (_) {
        return '';
      }

      function _sanitizeNode(parent) {
        var children = Array.from(parent.childNodes);
        for (var i = 0; i < children.length; i++) {
          var node = children[i];
          if (node.nodeType === Node.ELEMENT_NODE) {
            var tag = node.tagName.toLowerCase();
            if (!ALLOWED_TAGS[tag]) {
              var frag = document.createDocumentFragment();
              while (node.firstChild) frag.appendChild(node.firstChild);
              parent.replaceChild(frag, node);
              _sanitizeNode(parent);
              return;
            }
            var attrs = Array.from(node.attributes);
            for (var j = 0; j < attrs.length; j++) {
              var name = attrs[j].name.toLowerCase();
              if (name.indexOf('on') === 0) { node.removeAttribute(attrs[j].name); continue; }
              if (tag === 'a' && name === 'href') {
                if (!SAFE_URL.test(attrs[j].value.trim())) node.removeAttribute(attrs[j].name);
                continue;
              }
              if (tag === 'span' && name === 'class') {
                var classes = attrs[j].value.split(/\s+/).filter(function (c) { return ALLOWED_CLASS.test(c); });
                if (classes.length) { node.setAttribute('class', classes.join(' ')); } else { node.removeAttribute('class'); }
                continue;
              }
              if (BLOCK_ALIGN_TAGS[tag] && name === 'data-zw-align') {
                var za = attrs[j].value;
                if (za === 'start' || za === 'center' || za === 'end') {
                  node.setAttribute('data-zw-align', za);
                } else {
                  node.removeAttribute('data-zw-align');
                }
                continue;
              }
              node.removeAttribute(attrs[j].name);
            }
            _sanitizeNode(node);
          }
        }
      }
    }

    insertHtml(html) {
      if (!this.editor) return false;
      this.editor.focus();
      var payload = String(html || '');
      if (!payload) return false;
      if (typeof this.doc.execCommand === 'function') {
        try { return !!this.doc.execCommand('insertHTML', false, payload); } catch (_) { /* fallback */ }
      }
      var selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      var range = selection.getRangeAt(0);
      if (!this.editor.contains(range.commonAncestorContainer)) return false;
      range.deleteContents();
      var temp = document.createElement('div');
      temp.innerHTML = payload;
      var frag = document.createDocumentFragment();
      while (temp.firstChild) frag.appendChild(temp.firstChild);
      range.insertNode(frag);
      return true;
    }

    _execCommandWithSelection(command, value) {
      if (!this.editor || typeof this.doc.execCommand !== 'function') return false;
      this.editor.focus();
      const target = this._getSelectionRange();
      if (!target) return false;
      try {
        this.doc.execCommand(command, false, value);
        this.editor.focus();
        return true;
      } catch (_) {
        return false;
      }
    }

    _normalizeInlineCommand(type) {
      const key = String(type || '').toLowerCase();
      if (key === 'bold') return 'bold';
      if (key === 'italic') return 'italic';
      if (key === 'underline') return 'underline';
      if (key === 'strikethrough' || key === 'strike' || key === 'strikethru') return 'strikeThrough';
      return null;
    }

    _getSelectionRange() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        this.onSelectionRequired();
        return null;
      }
      const range = selection.getRangeAt(0);
      if (!this.editor || !this.editor.contains(range.commonAncestorContainer)) {
        return null;
      }
      return { selection, range };
    }

    _getCaretOrSelectionRange() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);
      if (!this.editor || !this.editor.contains(range.commonAncestorContainer)) {
        return null;
      }
      return { selection, range };
    }

    _findBlockRoot(el) {
      const BLOCK = { P: 1, H1: 1, H2: 1, H3: 1, BLOCKQUOTE: 1, LI: 1 };
      let cur = el;
      while (cur && cur !== this.editor) {
        if (cur.nodeType === Node.ELEMENT_NODE && BLOCK[cur.tagName]) {
          return cur;
        }
        cur = cur.parentElement;
      }
      return null;
    }
  }

  window.RichTextCommandAdapter = RichTextCommandAdapter;
})();
