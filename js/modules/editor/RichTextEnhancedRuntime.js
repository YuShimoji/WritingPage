/**
 * RichTextEnhancedRuntime
 * Applies RichTextCommandAdapter to the existing RichTextEditor instance
 * without modifying editor-wysiwyg.js internals.
 */
(function () {
  'use strict';

  function ensureFlag() {
    let enabled = true;
    try {
      if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.loadSettings !== 'function') {
        return true;
      }
      const settings = window.ZenWriterStorage.loadSettings() || {};
      settings.editor = settings.editor || {};
      if (typeof settings.editor.richtextEnhanced === 'boolean') {
        enabled = settings.editor.richtextEnhanced;
      } else {
        settings.editor.richtextEnhanced = true;
        if (typeof window.ZenWriterStorage.saveSettings === 'function') {
          window.ZenWriterStorage.saveSettings(settings);
        }
      }
    } catch (_) {
      enabled = true;
    }
    return enabled;
  }

  function getFlagValue() {
    try {
      if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.loadSettings !== 'function') return true;
      const settings = window.ZenWriterStorage.loadSettings() || {};
      return !(settings && settings.editor && settings.editor.richtextEnhanced === false);
    } catch (_) {
      return true;
    }
  }

  function installAdapter(instance) {
    if (!instance || instance.__richTextEnhancedInstalled) return;
    if (typeof window.RichTextCommandAdapter !== 'function') return;

    const adapter = new window.RichTextCommandAdapter({
      editor: instance.wysiwygEditor,
      onSelectionRequired: () => {
        if (typeof instance.notifySelectionRequired === 'function') {
          instance.notifySelectionRequired();
        }
      }
    });
    instance.commandAdapter = adapter;

    const legacyExecute = typeof instance.executeCommand === 'function'
      ? instance.executeCommand.bind(instance)
      : null;
    const legacyWrap = typeof instance.wrapSelectionWithSpan === 'function'
      ? instance.wrapSelectionWithSpan.bind(instance)
      : null;
    const legacyInsertLink = typeof instance.insertLink === 'function'
      ? instance.insertLink.bind(instance)
      : null;

    instance.executeCommand = function (command, value) {
      if (getFlagValue() && this.isWysiwygMode && this.commandAdapter && typeof this.commandAdapter.execute === 'function') {
        const ok = this.commandAdapter.execute(command, value);
        if (ok && typeof this.syncToMarkdown === 'function') this.syncToMarkdown();
        if (ok) return;
      }
      if (legacyExecute) legacyExecute(command, value);
    };

    instance.wrapSelectionWithSpan = function (className) {
      if (getFlagValue() && this.isWysiwygMode && this.commandAdapter && typeof this.commandAdapter.wrapWithClass === 'function') {
        const ok = this.commandAdapter.wrapWithClass(className);
        if (ok && typeof this.syncToMarkdown === 'function') this.syncToMarkdown();
        if (ok) return;
      }
      if (legacyWrap) legacyWrap(className);
    };

    instance.insertLink = function () {
      if (getFlagValue() && this.isWysiwygMode && this.commandAdapter && typeof this.commandAdapter.insertLink === 'function') {
        this.wysiwygEditor.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          if (typeof this.notifySelectionRequired === 'function') this.notifySelectionRequired();
          return;
        }
        const range = selection.getRangeAt(0);
        if (!this.wysiwygEditor.contains(range.commonAncestorContainer)) return;
        const selectedText = selection.toString().trim();
        const url = prompt('リンクURLを入力してください:', selectedText ? 'https://' : '');
        if (!url) return;
        const ok = this.commandAdapter.insertLink(url, selectedText || url);
        if (ok && typeof this.syncToMarkdown === 'function') this.syncToMarkdown();
        if (ok) return;
      }
      if (legacyInsertLink) legacyInsertLink();
    };

    if (instance.wysiwygEditor && !instance.__richTextEnhancedPasteCaptureInstalled) {
      instance.wysiwygEditor.addEventListener('paste', function (e) {
        if (!getFlagValue()) return;
        if (!instance.isWysiwygMode) return;
        if (!instance.commandAdapter || typeof instance.commandAdapter.insertText !== 'function') return;
        e.preventDefault();
        e.stopImmediatePropagation();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        instance.commandAdapter.insertText(text);
        if (typeof instance.syncToMarkdown === 'function') instance.syncToMarkdown();
      }, true);
      instance.__richTextEnhancedPasteCaptureInstalled = true;
    }

    instance.__richTextEnhancedInstalled = true;
  }

  function bootstrap() {
    ensureFlag();
    let retries = 0;
    const maxRetries = 200;
    const timer = setInterval(function () {
      const instance = window.richTextEditor || (window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor);
      if (instance) {
        clearInterval(timer);
        installAdapter(instance);
        return;
      }
      retries += 1;
      if (retries >= maxRetries) {
        clearInterval(timer);
      }
    }, 25);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
