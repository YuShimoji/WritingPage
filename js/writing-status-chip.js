(function () {
  'use strict';

  var SAVE_IDLE_DELAY_MS = 900;
  var MANUAL_SAVE_DELAY_MS = 120;
  var SAVE_HELP_TEXT = '本文はこの端末に自動保存されます。保存状態はこの表示で確認できます。';

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

  /** 原稿用紙（400字詰め）の枚数。半枚に満たない短文では出さない。 */
  function getSheetCount(count) {
    var metrics = window.ManuscriptMetrics;
    if (!metrics || typeof metrics.sheets !== 'function') return 0;
    var sheets = metrics.sheets(count);
    return sheets >= 0.5 ? sheets : 0;
  }

  /** 選択中の文字数。編集面の外や未選択では 0。ルビの読みは数えない。 */
  function getSelectionCount() {
    var metrics = window.ManuscriptMetrics;
    if (!metrics || typeof metrics.countRendered !== 'function') return 0;
    try {
      var active = document.activeElement;
      if (active && active.id === 'editor' && typeof active.selectionStart === 'number') {
        if (active.selectionStart === active.selectionEnd) return 0;
        return metrics.count(active.value.slice(active.selectionStart, active.selectionEnd));
      }
      var selection = window.getSelection && window.getSelection();
      var rich = document.getElementById('wysiwyg-editor');
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !rich) return 0;
      var range = selection.getRangeAt(0);
      if (!rich.contains(range.commonAncestorContainer)) return 0;
      var holder = document.createElement('div');
      holder.appendChild(range.cloneContents());
      var readings = holder.querySelectorAll('rt, rp');
      for (var i = 0; i < readings.length; i++) readings[i].remove();
      return metrics.countRendered(holder.textContent || '', metrics.getMode());
    } catch (_) {
      return 0;
    }
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
      if (state === 'failed') return '保存失敗';
      if (state === 'editing') return '編集中';
      var savedTime = formatSavedTime(lastSavedAt);
      return savedTime ? '保存済み ' + savedTime : '保存済み';
    }

    function markSavedAt(date) {
      lastSavedAt = date instanceof Date ? date : new Date();
    }

    function render() {
      var count = countChars(getEditorText());
      var selected = getSelectionCount();
      var sheets = getSheetCount(count);
      var label = '文字数: ' + count
        + (sheets ? '（約' + sheets + '枚）' : '')
        + (selected ? ' · 選択 ' + selected : '')
        + ' · ' + getSaveLabel();
      chip.textContent = label;
      chip.setAttribute('data-save-state', state);
      chip.setAttribute('data-char-count', String(count));
      chip.setAttribute('data-selection-count', String(selected));
      chip.setAttribute('data-last-saved-at', lastSavedAt ? lastSavedAt.toISOString() : '');
      var metrics = window.ManuscriptMetrics;
      var modeNote = metrics && metrics.MODES && metrics.MODES[metrics.getMode()]
        ? '数え方: ' + metrics.MODES[metrics.getMode()].label + '。' : '';
      chip.setAttribute('aria-label', label + '。' + modeNote + SAVE_HELP_TEXT);
      chip.setAttribute('title', (lastSavedAt ? '最終保存: ' + formatSavedTime(lastSavedAt) + '。' : '') + modeNote + SAVE_HELP_TEXT);
    }

    function setState(next, options) {
      state = next === 'editing' || next === 'failed' ? next : 'saved';
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
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = 0;
      setState('editing');
    }, true);

    document.addEventListener('zen-content-saved', function () {
      scheduleSaved(state === 'editing' ? SAVE_IDLE_DELAY_MS : MANUAL_SAVE_DELAY_MS, { updateSavedAt: true });
      render();
    });

    document.addEventListener('zen-content-save-failed', function () {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = 0;
      setState('failed');
    });

    window.addEventListener('ZWManuscriptMetricsChanged', render);
    // 選択文字数は選択が動くたびに変わる。ドラッグ中の再描画は 1 フレームに 1 回へまとめる
    var selectionFrame = 0;
    document.addEventListener('selectionchange', function () {
      if (selectionFrame) return;
      selectionFrame = window.requestAnimationFrame(function () {
        selectionFrame = 0;
        var before = chip.getAttribute('data-selection-count') || '0';
        if (before === '0' && !window.getSelection().toString()) return;
        render();
      });
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
      markFailed: function () {
        if (saveTimer) window.clearTimeout(saveTimer);
        saveTimer = 0;
        setState('failed');
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
