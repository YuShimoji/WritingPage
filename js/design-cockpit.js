(function () {
  'use strict';

  var PANEL_ID = 'design-cockpit';
  var SUMMARY_ID = 'design-cockpit-summary';

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function icon(name) {
    return '<i data-lucide="' + name + '" aria-hidden="true"></i>';
  }

  function refreshIcons(root) {
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({ icons: window.lucide.icons, attrs: { 'aria-hidden': 'true' }, root: root || document });
      }
    } catch (_) { }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text == null || text === '' ? 'unknown' : String(text);
  }

  function getEditorText() {
    var editor = window.ZenWriterEditor;
    try {
      if (editor && typeof editor.getEditorValue === 'function') {
        return editor.getEditorValue() || '';
      }
    } catch (_) { }
    var textarea = document.getElementById('editor');
    return textarea ? textarea.value || '' : '';
  }

  function countChars(text) {
    try {
      if (window.EditorUI && typeof window.EditorUI._countPlainChars === 'function') {
        return window.EditorUI._countPlainChars(text || '');
      }
    } catch (_) { }
    return String(text || '').trim().length;
  }

  function getChipState() {
    var chip = document.getElementById('writing-status-chip');
    var fromChip = chip ? parseInt(chip.getAttribute('data-char-count') || '', 10) : NaN;
    return {
      saveState: chip ? chip.getAttribute('data-save-state') || 'unknown' : 'missing',
      charCount: Number.isFinite(fromChip) ? fromChip : countChars(getEditorText()),
      lastSavedAt: chip ? chip.getAttribute('data-last-saved-at') || '' : '',
      visible: !!(chip && chip.offsetParent !== null)
    };
  }

  function getCurrentDocumentInfo() {
    var storage = window.ZenWriterStorage;
    var store = window.ZWChapterStore;
    var result = {
      id: '',
      rawId: '',
      name: '',
      type: 'unknown',
      selectedName: ''
    };
    try {
      if (!storage || typeof storage.loadDocuments !== 'function' || typeof storage.getCurrentDocId !== 'function') {
        result.name = document.title.replace(/\s+-\s+Zen Writer$/, '') || 'unknown';
        return result;
      }
      var docs = storage.loadDocuments() || [];
      var rawId = storage.getCurrentDocId();
      var docId = rawId;
      if (rawId && store && typeof store.resolveParentDocumentId === 'function') {
        docId = store.resolveParentDocumentId(rawId, docs) || rawId;
      }
      var doc = docs.find(function (item) { return item && item.id === docId; }) || null;
      var selected = docs.find(function (item) { return item && item.id === rawId; }) || null;
      result.id = docId || rawId || '';
      result.rawId = rawId || '';
      result.name = doc && doc.name ? doc.name : document.title.replace(/\s+-\s+Zen Writer$/, '') || 'unknown';
      result.type = selected && selected.type ? selected.type : doc && doc.type ? doc.type : 'document';
      result.selectedName = selected && selected.name ? selected.name : '';
      return result;
    } catch (_) {
      result.name = document.title.replace(/\s+-\s+Zen Writer$/, '') || 'unknown';
      return result;
    }
  }

  function getEditorMode() {
    var wysiwyg = document.getElementById('wysiwyg-editor');
    if (wysiwyg && wysiwyg.style.display !== 'none') return 'Rich editing';
    return 'Markdown source';
  }

  function getSettings() {
    try {
      if (window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function') {
        return window.ZenWriterStorage.loadSettings() || {};
      }
    } catch (_) { }
    return {};
  }

  function getReviewState() {
    var settings = getSettings();
    var root = document.documentElement;
    var sidebar = document.getElementById('sidebar');
    var activeCategory = root.getAttribute('data-left-nav-active') ||
      (settings.ui && settings.ui.leftNavCategory) ||
      'none';
    var sidebarState = sidebar && sidebar.classList.contains('open') ? 'open' : 'root/closed';
    var uiMode = window.ZenWriterApp && typeof window.ZenWriterApp.getUIMode === 'function'
      ? window.ZenWriterApp.getUIMode()
      : root.getAttribute('data-ui-mode') || 'normal';
    return {
      theme: root.getAttribute('data-theme') || settings.theme || 'unknown',
      uiMode: uiMode,
      sidebarState: sidebarState,
      activeCategory: activeCategory,
      fontSize: settings.editorFontSize || settings.fontSize || 'default',
      lineHeight: settings.lineHeight || 'default',
      layout: settings.editorLayout && (settings.editorLayout.maxWidth || settings.editorLayout.padding)
        ? 'custom'
        : 'default',
      autosave: !settings.autoSave || settings.autoSave.enabled !== false,
      autosaveDelay: settings.autoSave && settings.autoSave.delayMs ? settings.autoSave.delayMs : 2000
    };
  }

  function shortId(id) {
    if (!id) return 'none';
    return String(id).length > 12 ? String(id).slice(-12) : String(id);
  }

  function makeSummary(chip, doc, review) {
    return [
      'Design Cockpit / Writing UX checkpoint',
      'save_state=' + chip.saveState + ' count=' + chip.charCount + ' autosave=' + (review.autosave ? 'on' : 'off'),
      'manual_save=dashboard_button command_palette_save',
      'editor=' + getEditorMode() + ' shell=' + review.uiMode + ' theme=' + review.theme,
      'document_id=' + shortId(doc.id) + ' selected_type=' + doc.type,
      'sidebar=' + review.sidebarState + ' active_category=' + review.activeCategory,
      'review_surface=available manuscript_content=copied_never'
    ].join('\n');
  }

  function setChecklist(id, ok) {
    var el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('data-state', ok ? 'pass' : 'warn');
    el.querySelector('.design-cockpit__check-icon').textContent = ok ? 'OK' : 'CHECK';
  }

  function refresh() {
    var chip = getChipState();
    var doc = getCurrentDocumentInfo();
    var review = getReviewState();
    var saveWarning = chip.saveState === 'failed'
      ? '保存失敗が表示されています'
      : '現在の保存警告はありません';
    var selected = doc.type === 'chapter' && doc.selectedName ? ' / ' + doc.selectedName : '';

    setText('design-cockpit-save-state', chip.saveState);
    setText('design-cockpit-count', chip.charCount + ' 文字');
    setText('design-cockpit-doc', doc.name + selected + ' (' + shortId(doc.id) + ')');
    setText('design-cockpit-editor-mode', getEditorMode());
    setText('design-cockpit-autosave', review.autosave ? 'ON / 約 ' + review.autosaveDelay + 'ms' : 'OFF');
    setText('design-cockpit-manual-save', 'このパネルの保存ボタン / command palette save');
    setText('design-cockpit-save-warning', saveWarning);
    setText('design-cockpit-reload', 'reload は現在ドキュメントを復帰、外部退避は Documents の TXT / JSON export');
    setText('design-cockpit-theme', review.theme);
    setText('design-cockpit-shell', review.uiMode);
    setText('design-cockpit-type', 'font ' + review.fontSize + ' / line ' + review.lineHeight + ' / layout ' + review.layout);
    setText('design-cockpit-panel', review.sidebarState + ' / ' + review.activeCategory);
    setText(SUMMARY_ID, makeSummary(chip, doc, review));

    setChecklist('design-cockpit-check-writing', !!document.getElementById('editor') || !!document.getElementById('wysiwyg-editor'));
    setChecklist('design-cockpit-check-save-visible', chip.visible || !!document.getElementById('writing-status-chip'));
    setChecklist('design-cockpit-check-manual-save', !!(window.ZenWriterEditor && typeof window.ZenWriterEditor.saveContent === 'function'));
    setChecklist('design-cockpit-check-review', !!document.getElementById(PANEL_ID));
  }

  function focusEditor() {
    close();
    requestAnimationFrame(function () {
      try {
        if (window.ZWReaderPreview && typeof window.ZWReaderPreview.isOpen === 'function' && window.ZWReaderPreview.isOpen()) {
          window.ZWReaderPreview.exit();
        }
      } catch (_) { }
      var wysiwyg = document.getElementById('wysiwyg-editor');
      var textarea = document.getElementById('editor');
      var target = wysiwyg && wysiwyg.style.display !== 'none' ? wysiwyg : textarea;
      if (target && typeof target.focus === 'function') {
        try {
          target.focus({ preventScroll: true });
        } catch (_) {
          target.focus();
        }
      }
    });
  }

  function manualSave() {
    try {
      if (window.ZenWriterEditor && typeof window.ZenWriterEditor.saveContent === 'function') {
        var ok = window.ZenWriterEditor.saveContent();
        if (window.ZenWriterEditor.showNotification) {
          window.ZenWriterEditor.showNotification(ok ? '保存しました' : '保存に失敗しました', 1800);
        }
      }
    } catch (_) { }
    window.setTimeout(refresh, 150);
  }

  function copySummary() {
    var summary = document.getElementById(SUMMARY_ID);
    var status = document.getElementById('design-cockpit-copy-state');
    var text = summary ? summary.textContent || '' : '';
    function done(ok) {
      if (status) status.textContent = ok ? 'コピーしました' : 'コピーできませんでした';
    }
    if (!text) {
      done(false);
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }).catch(function () { done(false); });
      return;
    }
    try {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      done(document.execCommand('copy'));
      area.remove();
    } catch (_) {
      done(false);
    }
  }

  function createPanel() {
    var existing = document.getElementById(PANEL_ID);
    if (existing) return existing;
    var panel = document.createElement('section');
    panel.id = PANEL_ID;
    panel.className = 'floating-panel design-cockpit';
    panel.style.display = 'none';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'design-cockpit-title');
    panel.innerHTML = [
      '<div class="panel-header design-cockpit__header">',
      '  <span id="design-cockpit-title" class="design-cockpit__title">' + icon('layout-dashboard') + 'Design Cockpit</span>',
      '  <button class="panel-close design-cockpit__icon-btn" id="design-cockpit-close" type="button" aria-label="Design Cockpit を閉じる">' + icon('x') + '</button>',
      '</div>',
      '<div class="panel-body design-cockpit__body">',
      '  <div class="design-cockpit__actions" role="group" aria-label="Design Cockpit actions">',
      '    <button id="design-cockpit-focus" class="design-cockpit__button" type="button">' + icon('pen-line') + '<span>書き始める</span></button>',
      '    <button id="design-cockpit-save" class="design-cockpit__button" type="button">' + icon('save') + '<span>保存</span></button>',
      '    <button id="design-cockpit-refresh" class="design-cockpit__button" type="button">' + icon('refresh-cw') + '<span>更新</span></button>',
      '    <button id="design-cockpit-copy" class="design-cockpit__button" type="button">' + icon('copy') + '<span>要約をコピー</span></button>',
      '  </div>',
      '  <section class="design-cockpit__section" aria-label="Writer readiness">',
      '    <h3>執筆準備</h3>',
      '    <dl class="design-cockpit__grid">',
      '      <div><dt>保存状態</dt><dd id="design-cockpit-save-state">unknown</dd></div>',
      '      <div><dt>文字数</dt><dd id="design-cockpit-count">unknown</dd></div>',
      '      <div><dt>文書</dt><dd id="design-cockpit-doc">unknown</dd></div>',
      '      <div><dt>編集面</dt><dd id="design-cockpit-editor-mode">unknown</dd></div>',
      '    </dl>',
      '  </section>',
      '  <section class="design-cockpit__section" aria-label="Save trust">',
      '    <h3>保存の信頼</h3>',
      '    <dl class="design-cockpit__stack">',
      '      <div><dt>自動保存</dt><dd id="design-cockpit-autosave">unknown</dd></div>',
      '      <div><dt>手動保存</dt><dd id="design-cockpit-manual-save">unknown</dd></div>',
      '      <div><dt>警告</dt><dd id="design-cockpit-save-warning">unknown</dd></div>',
      '      <div><dt>復帰 / 退避</dt><dd id="design-cockpit-reload">unknown</dd></div>',
      '    </dl>',
      '  </section>',
      '  <section class="design-cockpit__section" aria-label="Designer review">',
      '    <h3>デザイナー確認</h3>',
      '    <dl class="design-cockpit__grid">',
      '      <div><dt>テーマ</dt><dd id="design-cockpit-theme">unknown</dd></div>',
      '      <div><dt>シェル</dt><dd id="design-cockpit-shell">unknown</dd></div>',
      '      <div><dt>文字 / 密度</dt><dd id="design-cockpit-type">unknown</dd></div>',
      '      <div><dt>パネル</dt><dd id="design-cockpit-panel">unknown</dd></div>',
      '    </dl>',
      '    <ul class="design-cockpit__checks">',
      '      <li id="design-cockpit-check-writing"><span class="design-cockpit__check-icon">CHECK</span> can start writing</li>',
      '      <li id="design-cockpit-check-save-visible"><span class="design-cockpit__check-icon">CHECK</span> save state visible</li>',
      '      <li id="design-cockpit-check-manual-save"><span class="design-cockpit__check-icon">CHECK</span> manual save route discoverable</li>',
      '      <li id="design-cockpit-check-review"><span class="design-cockpit__check-icon">CHECK</span> review surface available</li>',
      '    </ul>',
      '  </section>',
      '  <section class="design-cockpit__section" aria-label="Review summary">',
      '    <h3>レビュー要約</h3>',
      '    <pre id="' + SUMMARY_ID + '" class="design-cockpit__summary" aria-live="polite"></pre>',
      '    <p id="design-cockpit-copy-state" class="design-cockpit__copy-state" aria-live="polite"></p>',
      '  </section>',
      '</div>'
    ].join('');
    document.body.appendChild(panel);
    panel.querySelector('#design-cockpit-close').addEventListener('click', close);
    panel.querySelector('#design-cockpit-focus').addEventListener('click', focusEditor);
    panel.querySelector('#design-cockpit-save').addEventListener('click', manualSave);
    panel.querySelector('#design-cockpit-refresh').addEventListener('click', refresh);
    panel.querySelector('#design-cockpit-copy').addEventListener('click', copySummary);
    refreshIcons(panel);
    return panel;
  }

  function open() {
    var panel = createPanel();
    refresh();
    panel.style.display = 'block';
    refreshIcons(panel);
    var first = document.getElementById('design-cockpit-focus');
    if (first && typeof first.focus === 'function') {
      first.focus({ preventScroll: true });
    }
  }

  function close() {
    var panel = document.getElementById(PANEL_ID);
    if (panel) panel.style.display = 'none';
  }

  function toggle() {
    var panel = createPanel();
    if (panel.style.display === 'none' || !panel.style.display) {
      open();
    } else {
      close();
    }
  }

  function bindRefreshSignals() {
    ['input', 'zen-content-saved', 'zen-content-save-failed', 'ZWDocumentsChanged', 'ZWChapterStoreChanged'].forEach(function (name) {
      document.addEventListener(name, function () {
        if (document.getElementById(PANEL_ID) && document.getElementById(PANEL_ID).style.display !== 'none') {
          window.setTimeout(refresh, 0);
        }
      }, true);
    });
    ['ZenWriterUIModeChanged', 'ZWReaderPreviewChanged', 'ZenWriterSettingsChanged'].forEach(function (name) {
      window.addEventListener(name, refresh);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });
  }

  function openFromQueryParameter() {
    if (!/(?:^|[?&])designCockpit=1(?:&|$)/.test(location.search)) return;
    window.setTimeout(open, 0);
    window.setTimeout(open, 300);
    window.addEventListener('load', function () {
      window.setTimeout(open, 0);
      window.setTimeout(open, 300);
    }, { once: true });
  }

  window.ZWDesignCockpit = {
    open: open,
    close: close,
    toggle: toggle,
    refresh: refresh,
    getSummary: function () {
      var summary = document.getElementById(SUMMARY_ID);
      return summary ? summary.textContent || '' : '';
    }
  };
  window.ZenWriterApp = window.ZenWriterApp || {};
  window.ZenWriterApp.openDesignCockpit = open;

  onReady(function () {
    createPanel();
    bindRefreshSignals();
    openFromQueryParameter();
  });
})();
