/**
 * app-editor-bridge.js
 * EditorManager との接続ブリッジ
 * - Selection Tooltip の初期化
 * - Editor 依存 UI の初期化
 * 
 * app.js から抽出（REFACTORING_PLAN 6.3 参照）
 */
(function () {
  'use strict';

  /**
   * Selection Tooltip を初期化
   * エディタ上でテキスト選択時に表示されるフォーマットツールバー
   */
  function initSelectionTooltip() {
    const editorManager = window.ZenWriterEditor;
    const editorEl = editorManager && editorManager.editor;
    if (!editorEl || typeof editorManager.getTextPosition !== 'function' || typeof editorManager.getSelectedText !== 'function' || typeof editorManager.wrapSelection !== 'function') {
      return;
    }

    const tooltip = document.createElement('div');
    tooltip.id = 'selection-tooltip';
    tooltip.className = 'selection-tooltip';
    tooltip.setAttribute('role', 'toolbar');
    tooltip.setAttribute('aria-label', '選択ツール');
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    const actions = [
      { id: 'bold', label: 'B', run: () => wrap('**') },
      { id: 'italic', label: 'I', run: () => wrap('*') },
      { id: 'strike', label: 'S', run: () => wrap('~~') },
      { id: 'link', label: 'Link', run: () => makeLink() },
      { id: 'image', label: 'Img', run: () => makeImage() },
      { id: 'hr', label: '---', run: () => insertHr() },
      { id: 'ruby', label: 'ルビ', run: () => insertRuby() }
    ];

    actions.forEach(act => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = act.label;
      btn.dataset.action = act.id;
      btn.addEventListener('click', () => {
        act.run();
      });
      tooltip.appendChild(btn);
    });

    // Textbox preset dropdown
    const tbWrapper = document.createElement('div');
    tbWrapper.className = 'tb-dropdown-wrapper';
    tbWrapper.dataset.action = 'textbox-dropdown';

    const tbBtn = document.createElement('button');
    tbBtn.type = 'button';
    tbBtn.textContent = 'TB \u25bc';
    tbBtn.dataset.action = 'textbox-toggle';
    tbBtn.className = 'tb-dropdown-toggle';
    tbWrapper.appendChild(tbBtn);

    const tbMenu = document.createElement('div');
    tbMenu.className = 'tb-dropdown-menu';
    tbMenu.style.display = 'none';

    function buildPresetMenu() {
      tbMenu.innerHTML = '';
      const settings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
        ? window.ZenWriterStorage.loadSettings() : {};
      const registry = window.TextboxPresetRegistry;
      const presets = registry && typeof registry.list === 'function' ? registry.list(settings) : [];

      presets.forEach(preset => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'tb-dropdown-item';
        item.dataset.presetId = preset.id;
        const labelSpan = document.createElement('span');
        labelSpan.className = 'tb-preset-label';
        labelSpan.textContent = preset.label;
        const roleSpan = document.createElement('span');
        roleSpan.className = 'tb-preset-role';
        roleSpan.textContent = preset.role;
        item.appendChild(labelSpan);
        item.appendChild(roleSpan);
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          applyTextboxPreset(preset.id);
          hideTbMenu();
        });
        tbMenu.appendChild(item);
      });
    }

    let tbMenuVisible = false;
    function showTbMenu() {
      buildPresetMenu();
      tbMenu.style.display = 'block';
      tbMenuVisible = true;
    }
    function hideTbMenu() {
      tbMenu.style.display = 'none';
      tbMenuVisible = false;
    }

    tbBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (tbMenuVisible) { hideTbMenu(); } else { showTbMenu(); }
    });

    document.addEventListener('click', () => {
      if (tbMenuVisible) hideTbMenu();
    });

    tbWrapper.appendChild(tbMenu);
    tooltip.appendChild(tbWrapper);

    const buttons = Array.from(tooltip.querySelectorAll('button'));

    let visible = false;

    function hideTooltip() {
      if (!visible) return;
      tooltip.style.display = 'none';
      visible = false;
    }

    function updateFromSelection() {
      const start = editorEl.selectionStart || 0;
      const end = editorEl.selectionEnd || 0;
      if (start === end) {
        hideTooltip();
        return;
      }
      const rect = editorManager.getTextPosition(start, end);
      if (!rect) {
        hideTooltip();
        return;
      }
      const editorRect = editorEl.getBoundingClientRect();
      tooltip.style.display = 'flex';
      const tooltipRect = tooltip.getBoundingClientRect();
      const centerX = editorRect.left + rect.left + rect.width / 2;
      const top = editorRect.top + rect.top;
      const x = Math.max(8, Math.min(window.innerWidth - tooltipRect.width - 8, centerX - tooltipRect.width / 2));
      const y = Math.max(8, top - tooltipRect.height - 8);
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';

      const textboxEnabled = isTextboxFeatureEnabled();
      tbWrapper.style.display = textboxEnabled ? '' : 'none';
      if (!textboxEnabled && tbMenuVisible) hideTbMenu();
      visible = true;
    }

    function handleSelectionChange() {
      if (document.activeElement !== editorEl) {
        hideTooltip();
        return;
      }
      setTimeout(updateFromSelection, 0);
    }

    editorEl.addEventListener('mouseup', handleSelectionChange);
    editorEl.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        if (visible) hideTooltip();
        return;
      }
      handleSelectionChange();
    });

    document.addEventListener('selectionchange', handleSelectionChange);

    tooltip.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const current = document.activeElement;
      const idx = buttons.indexOf(current);
      if (idx === -1) return;
      e.preventDefault();
      let nextIdx;
      if (e.shiftKey) {
        nextIdx = idx <= 0 ? buttons.length - 1 : idx - 1;
      } else {
        nextIdx = idx >= buttons.length - 1 ? 0 : idx + 1;
      }
      const next = buttons[nextIdx];
      if (next) next.focus();
    });

    window.addEventListener('scroll', () => {
      if (visible) updateFromSelection();
    }, true);
    window.addEventListener('resize', () => {
      if (visible) updateFromSelection();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && visible) {
        hideTooltip();
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!visible) return;
      if (!tooltip.contains(e.target) && e.target !== editorEl) {
        hideTooltip();
      }
    });

    function wrap(marker) {
      const selected = editorManager.getSelectedText();
      if (!selected) return;
      editorManager.wrapSelection(marker);
      hideTooltip();
    }

    function insertHr() {
      editorManager.insertTextAtCursor('\n\n---\n\n');
      hideTooltip();
    }

    function makeLink() {
      const start = editorEl.selectionStart || 0;
      const end = editorEl.selectionEnd || 0;
      if (start === end) return;
      const text = editorEl.value || '';
      const selected = text.slice(start, end);
      const url = window.prompt('リンクURLを入力してください', 'https://');
      if (!url) return;
      const safe = String(url).trim();
      if (!safe) return;
      const label = selected || 'text';
      const before = text.slice(0, start);
      const after = text.slice(end);
      const insertion = `[${label}](${safe})`;
      editorEl.value = before + insertion + after;
      const newStart = before.length;
      const newEnd = newStart + insertion.length;
      editorEl.selectionStart = newStart;
      editorEl.selectionEnd = newEnd;
      editorManager.saveContent();
      editorManager.updateWordCount();
      editorEl.focus();
      hideTooltip();
    }

    function makeImage() {
      const start = editorEl.selectionStart || 0;
      const end = editorEl.selectionEnd || 0;
      const text = editorEl.value || '';
      const selected = text.slice(start, end);
      const url = window.prompt('画像URLを入力してください', 'https://');
      if (!url) return;
      const safe = String(url).trim();
      if (!safe) return;
      const alt = selected || 'image';
      const before = text.slice(0, start);
      const after = text.slice(end);
      const insertion = `![${alt}](${safe})`;
      editorEl.value = before + insertion + after;
      const newStart = before.length;
      const newEnd = newStart + insertion.length;
      editorEl.selectionStart = newStart;
      editorEl.selectionEnd = newEnd;
      editorManager.saveContent();
      editorManager.updateWordCount();
      editorEl.focus();
      hideTooltip();
    }

    function insertRuby() {
      const start = editorEl.selectionStart || 0;
      const end = editorEl.selectionEnd || 0;
      if (start === end) return;
      const text = editorEl.value || '';
      const base = text.slice(start, end);
      const reading = window.prompt('ルビ（ふりがな）を入力してください', '');
      if (!reading) return;
      const before = text.slice(0, start);
      const after = text.slice(end);
      const insertion = `{${base}|${reading}}`;
      editorEl.value = before + insertion + after;
      const newStart = before.length;
      const newEnd = newStart + insertion.length;
      editorEl.selectionStart = newStart;
      editorEl.selectionEnd = newEnd;
      editorManager.saveContent();
      editorManager.updateWordCount();
      editorEl.focus();
      hideTooltip();
    }

    function isTextboxFeatureEnabled() {
      try {
        const settings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
          ? window.ZenWriterStorage.loadSettings()
          : {};
        return !!(settings && settings.editor && settings.editor.extendedTextbox && settings.editor.extendedTextbox.enabled);
      } catch (_) {
        return false;
      }
    }

    function applyTextboxPreset(presetId) {
      if (!isTextboxFeatureEnabled()) return;
      const start = editorEl.selectionStart || 0;
      const end = editorEl.selectionEnd || 0;
      if (start === end) return;
      if (!(window.TextboxDslParser && typeof window.TextboxDslParser.wrap === 'function')) return;

      const selected = editorManager.getSelectedText();
      if (!selected) return;

      const settings = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
        ? window.ZenWriterStorage.loadSettings()
        : {};

      const registry = window.TextboxPresetRegistry;
      const preset = (registry && typeof registry.resolve === 'function')
        ? registry.resolve(presetId, settings)
        : { id: presetId || 'inner-voice', role: 'custom' };

      const wrapped = window.TextboxDslParser.wrap(selected, {
        preset: preset.id,
        role: preset.role || 'custom',
        anim: preset.anim || '',
        tilt: typeof preset.tilt === 'number' ? preset.tilt : undefined,
        scale: typeof preset.scale === 'number' ? preset.scale : undefined,
        sfx: preset.sfx || ''
      });

      editorEl.setRangeText(wrapped, start, end, 'select');
      editorManager.saveContent();
      editorManager.updateWordCount();
      if (typeof editorManager.renderMarkdownPreview === 'function') {
        editorManager.renderMarkdownPreview();
      }
      editorEl.focus();
      hideTooltip();
    }
  }

  // グローバルに公開（app.js から呼び出し可能に）
  window.appEditorBridge_initSelectionTooltip = initSelectionTooltip;

})();
