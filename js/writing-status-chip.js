(function () {
  'use strict';

  var SAVE_IDLE_DELAY_MS = 900;
  var MANUAL_SAVE_DELAY_MS = 120;

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function getEditorText() {
    var editor = window.ZenWriterEditor;
    try {
      if (editor && typeof editor.getEditorValue === 'function') {
        return editor.getEditorValue() || '';
      }
    } catch (_) { /* noop */ }
    var el = document.getElementById('editor');
    return el ? el.value || '' : '';
  }

  function countChars(text) {
    if (window.EditorUI && typeof window.EditorUI._countPlainChars === 'function') {
      return window.EditorUI._countPlainChars(text || '');
    }
    return String(text || '').trim().length;
  }

  function isEditorInput(target) {
    if (!target || !target.closest) return false;
    return !!target.closest('#editor, #wysiwyg-editor');
  }

  onReady(function initWritingStatusChip() {
    var chip = document.getElementById('writing-status-chip');
    if (!chip) return;

    var state = 'saved';
    var saveTimer = 0;
    var lastSavedAt = null;

    function formatSavedTime(date) {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
      try {
        return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      } catch (_) {
        var hours = String(date.getHours()).padStart(2, '0');
        var minutes = String(date.getMinutes()).padStart(2, '0');
        return hours + ':' + minutes;
      }
    }

    function getSaveLabel() {
      if (state === 'editing') return '編集中';
      var savedTime = formatSavedTime(lastSavedAt);
      return savedTime ? '保存済み ' + savedTime : '保存済み';
    }

    function markSavedAt(date) {
      lastSavedAt = date instanceof Date ? date : new Date();
    }

    function render() {
      var count = countChars(getEditorText());
      chip.textContent = '文字数: ' + count + ' · ' + getSaveLabel();
      chip.setAttribute('data-save-state', state);
      chip.setAttribute('data-char-count', String(count));
      chip.setAttribute('data-last-saved-at', lastSavedAt ? lastSavedAt.toISOString() : '');
      chip.setAttribute('title', lastSavedAt ? '最終保存: ' + formatSavedTime(lastSavedAt) : '保存状態');
    }

    function setState(next, options) {
      state = next === 'editing' ? 'editing' : 'saved';
      if (state === 'saved' && options && options.updateSavedAt) markSavedAt(options.date);
      render();
    }

    function scheduleSaved(delay, options) {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(function () {
        saveTimer = 0;
        setState('saved', { updateSavedAt: !options || options.updateSavedAt !== false });
      }, typeof delay === 'number' ? delay : SAVE_IDLE_DELAY_MS);
    }

    document.addEventListener('input', function (event) {
      if (!isEditorInput(event.target)) return;
      setState('editing');
      scheduleSaved(SAVE_IDLE_DELAY_MS);
    }, true);

    document.addEventListener('zen-content-saved', function () {
      scheduleSaved(state === 'editing' ? SAVE_IDLE_DELAY_MS : MANUAL_SAVE_DELAY_MS, { updateSavedAt: true });
      render();
    });

    window.addEventListener('ZWChapterStoreChanged', render);
    window.addEventListener('ZenWriterUIModeChanged', render);
    window.addEventListener('ZWReaderPreviewChanged', render);

    render();

    window.ZWWritingStatusChip = {
      refresh: render,
      markEditing: function () {
        setState('editing');
        scheduleSaved(SAVE_IDLE_DELAY_MS);
      },
      markSaved: function () {
        if (saveTimer) window.clearTimeout(saveTimer);
        saveTimer = 0;
        setState('saved', { updateSavedAt: true });
      },
      getState: function () {
        return {
          saveState: state,
          charCount: parseInt(chip.getAttribute('data-char-count') || '0', 10),
          lastSavedAt: lastSavedAt ? lastSavedAt.toISOString() : null
        };
      }
    };
  });
})();
