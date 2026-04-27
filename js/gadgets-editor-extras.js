(function () {
  'use strict';

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function clamp(n, min, max) { n = parseFloat(n); if (isNaN(n)) return min; return Math.max(min, Math.min(max, n)); }
  function toInt(n, d) { var v = parseInt(n, 10); return isNaN(v) ? d : v; }

  function withStorage(updater) {
    try {
      var s = window.ZenWriterStorage.loadSettings();
      updater(s);
      window.ZenWriterStorage.saveSettings(s);
    } catch (_) { }
  }

  function refreshTypewriter() { try { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyTypewriterIfEnabled === 'function') window.ZenWriterEditor.applyTypewriterIfEnabled(); } catch (_) { } }
  function applyWrapCols() { try { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyWrapCols === 'function') window.ZenWriterEditor.applyWrapCols(); } catch (_) { } }


  function register() {
    if (!window.ZWGadgets || typeof window.ZWGadgets.register !== 'function') return;

    // Typewriter Gadget
    window.ZWGadgets.register('Typewriter', function (root) {
      var s = window.ZenWriterStorage.loadSettings();
      var tw = (s && s.typewriter) || {};
      root.innerHTML = '';
      root.style.display = 'grid'; root.style.gap = '0.5rem';

      var row1 = el('label', 'toggle-switch');
      var enabled = el('input'); enabled.type = 'checkbox'; enabled.id = 'typewriter-enabled'; enabled.checked = !!tw.enabled;
      var lbl1 = el('span'); lbl1.textContent = 'タイプライターモード';
      row1.appendChild(enabled); row1.appendChild(lbl1);

      var row2 = el('div');
      var anchor = el('input'); anchor.type = 'range'; anchor.id = 'typewriter-anchor-ratio'; anchor.min = '0.05'; anchor.max = '0.95'; anchor.step = '0.05'; anchor.value = String(typeof tw.anchorRatio === 'number' ? tw.anchorRatio : 0.5);
      var aLbl = el('div'); aLbl.textContent = 'アンカー位置: ' + anchor.value; aLbl.style.fontSize = '0.75rem';
      row2.appendChild(aLbl); row2.appendChild(anchor);

      var row3 = el('div');
      var stick = el('input'); stick.type = 'range'; stick.id = 'typewriter-stickiness'; stick.min = '0'; stick.max = '1'; stick.step = '0.1'; stick.value = String(typeof tw.stickiness === 'number' ? tw.stickiness : 0.9);
      var sLbl = el('div'); sLbl.textContent = '張り付き強度: ' + stick.value; sLbl.style.fontSize = '0.75rem';
      row3.appendChild(sLbl); row3.appendChild(stick);

      var row4 = el('div');
      var wrapCols = el('input'); wrapCols.type = 'range'; wrapCols.min = '40'; wrapCols.max = '120'; wrapCols.step = '10'; wrapCols.value = String(typeof tw.wrapCols === 'number' ? tw.wrapCols : 80);
      var wLbl = el('div'); wLbl.textContent = '折り返し文字数: ' + wrapCols.value; wLbl.style.fontSize = '0.75rem';
      row4.appendChild(wLbl); row4.appendChild(wrapCols);

      var btnApply = el('button', 'small'); btnApply.textContent = '今すぐ整列';

      enabled.addEventListener('change', function () { withStorage(function (cfg) { cfg.typewriter = cfg.typewriter || {}; cfg.typewriter.enabled = !!enabled.checked; }); refreshTypewriter(); });
      anchor.addEventListener('input', function () { aLbl.textContent = 'アンカー位置: ' + anchor.value; });
      anchor.addEventListener('change', function () { withStorage(function (cfg) { cfg.typewriter = cfg.typewriter || {}; cfg.typewriter.anchorRatio = clamp(anchor.value, 0.05, 0.95); }); refreshTypewriter(); });
      stick.addEventListener('input', function () { sLbl.textContent = '張り付き強度: ' + stick.value; });
      stick.addEventListener('change', function () { withStorage(function (cfg) { cfg.typewriter = cfg.typewriter || {}; cfg.typewriter.stickiness = clamp(stick.value, 0, 1); }); refreshTypewriter(); });
      wrapCols.addEventListener('input', function () { wLbl.textContent = '折り返し文字数: ' + wrapCols.value; });
      wrapCols.addEventListener('change', function () { withStorage(function (cfg) { cfg.typewriter = cfg.typewriter || {}; cfg.typewriter.wrapCols = clamp(wrapCols.value, 40, 120); }); applyWrapCols(); });
      btnApply.addEventListener('click', refreshTypewriter);

      root.appendChild(row1); root.appendChild(row2); root.appendChild(row3); root.appendChild(row4); root.appendChild(btnApply);
    }, { title: 'タイプライター', groups: ['assist'], description: 'カーソル行を画面中央へ寄せて視線移動を減らします。', defaultCollapsed: true });

    // Focus Mode Gadget
    window.ZWGadgets.register('FocusMode', function (root) {
      var s = window.ZenWriterStorage.loadSettings();
      var fm = (s && s.focusMode) || {};
      root.innerHTML = '';
      root.style.display = 'grid'; root.style.gap = '0.5rem';

      var row1 = el('label', 'toggle-switch');
      var enabled = el('input'); enabled.type = 'checkbox'; enabled.id = 'focus-mode-enabled'; enabled.checked = !!fm.enabled;
      var lbl1 = el('span'); lbl1.textContent = 'フォーカスモード';
      row1.appendChild(enabled); row1.appendChild(lbl1);

      var row2 = el('div');
      var dimOpacity = el('input'); dimOpacity.type = 'range'; dimOpacity.id = 'focus-dim-opacity'; dimOpacity.min = '0'; dimOpacity.max = '1'; dimOpacity.step = '0.1'; dimOpacity.value = String(typeof fm.dimOpacity === 'number' ? fm.dimOpacity : 0.3);
      var dLbl = el('div'); dLbl.textContent = '減光: ' + dimOpacity.value; dLbl.style.fontSize = '0.75rem';
      row2.appendChild(dLbl); row2.appendChild(dimOpacity);

      var row3 = el('div');
      var blurRadius = el('input'); blurRadius.type = 'range'; blurRadius.id = 'focus-blur-radius'; blurRadius.min = '0'; blurRadius.max = '10'; blurRadius.step = '0.5'; blurRadius.value = String(typeof fm.blurRadius === 'number' ? fm.blurRadius : 2);
      var bLbl = el('div'); bLbl.textContent = 'ぼかし: ' + blurRadius.value + 'px'; bLbl.style.fontSize = '0.75rem';
      row3.appendChild(bLbl); row3.appendChild(blurRadius);

      function refreshFocusMode() {
        try {
          if (window.ZenWriterEditor && typeof window.ZenWriterEditor.scheduleFocusModeUpdate === 'function') {
            window.ZenWriterEditor.scheduleFocusModeUpdate();
          }
        } catch (_) { }
      }

      enabled.addEventListener('change', function () {
        withStorage(function (cfg) {
          cfg.focusMode = cfg.focusMode || {};
          cfg.focusMode.enabled = !!enabled.checked;
        });
        refreshFocusMode();
      });
      dimOpacity.addEventListener('input', function () { dLbl.textContent = '減光: ' + dimOpacity.value; });
      dimOpacity.addEventListener('change', function () {
        withStorage(function (cfg) {
          cfg.focusMode = cfg.focusMode || {};
          cfg.focusMode.dimOpacity = clamp(parseFloat(dimOpacity.value), 0, 1);
        });
        refreshFocusMode();
      });
      blurRadius.addEventListener('input', function () { bLbl.textContent = 'ぼかし: ' + blurRadius.value + 'px'; });
      blurRadius.addEventListener('change', function () {
        withStorage(function (cfg) {
          cfg.focusMode = cfg.focusMode || {};
          cfg.focusMode.blurRadius = clamp(parseFloat(blurRadius.value), 0, 10);
        });
        refreshFocusMode();
      });

      root.appendChild(row1); root.appendChild(row2); root.appendChild(row3);
    }, { title: 'フォーカスモード', groups: ['assist'], description: '編集中の段落以外を減光して集中を維持します。', defaultCollapsed: true });

    // SnapshotManager は gadgets-snapshot.js に個別ファイル化済み

    // Markdown Preview Gadget
    window.ZWGadgets.register('MarkdownPreview', function (root) {
      var s = window.ZenWriterStorage.loadSettings();
      var prev = (s && s.preview) || {};
      root.innerHTML = ''; root.style.display = 'grid'; root.style.gap = '0.375rem';

      var row = el('div');
      var sync = el('input'); sync.type = 'checkbox'; sync.checked = !!prev.syncScroll; var lbl = el('label'); lbl.textContent = 'スクロール同期'; lbl.style.marginLeft = '0.375rem'; row.appendChild(sync); row.appendChild(lbl);

      var btnToggle = el('button', 'small'); btnToggle.textContent = 'プレビュー開閉';
      btnToggle.type = 'button';
      btnToggle.addEventListener('click', function () {
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.togglePreview === 'function') {
          window.ZenWriterEditor.togglePreview();
        }
      });
      sync.addEventListener('change', function () { withStorage(function (cfg) { cfg.preview = cfg.preview || {}; cfg.preview.syncScroll = !!sync.checked; }); });

      root.appendChild(row); root.appendChild(btnToggle);
    }, { title: 'Markdownプレビュー', groups: ['edit'], description: '編集画面の横に Markdown を並列表示し、本文とスクロール同期します。' });

    // UI Settings Gadget
    window.ZWGadgets.register('UISettings', function (root) {
      var s = window.ZenWriterStorage.loadSettings();
      var ui = (s && s.ui) || {};
      var fs = (s && s.fontSizes) || {};
      var editorCfg = (s && s.editor) || {};
      root.innerHTML = ''; root.style.display = 'grid'; root.style.gap = '0.5rem';

      var presRow = el('div');
      var sel = el('select');['buttons', 'tabs', 'dropdown', 'accordion'].forEach(function (k) { var o = el('option'); o.value = k; o.textContent = k; sel.appendChild(o); }); sel.value = String(ui.tabsPresentation || 'tabs');
      var l1 = el('label'); l1.textContent = 'タブ表示方式'; l1.style.display = 'block'; presRow.appendChild(l1); presRow.appendChild(sel);

      // UI表示スタイル（アイコン/テキスト切替）
      var styleRow = el('div');
      var styleSel = el('select');
      [
        { value: 'default', label: 'アイコン+テキスト' },
        { value: 'icons-only', label: 'アイコンのみ' },
        { value: 'text-only', label: 'テキストのみ' }
      ].forEach(function (opt) {
        var o = el('option'); o.value = opt.value; o.textContent = opt.label; styleSel.appendChild(o);
      });
      styleSel.value = String(ui.uiStyle || 'default');
      var styleLabel = el('label'); styleLabel.textContent = 'ボタン表示'; styleLabel.style.display = 'block';
      styleRow.appendChild(styleLabel); styleRow.appendChild(styleSel);

      styleSel.addEventListener('change', function () {
        var val = styleSel.value;
        withStorage(function (cfg) { cfg.ui = cfg.ui || {}; cfg.ui.uiStyle = val; });
        document.documentElement.setAttribute('data-ui-style', val === 'default' ? '' : val);
      });

      // 初期適用
      if (ui.uiStyle && ui.uiStyle !== 'default') {
        document.documentElement.setAttribute('data-ui-style', ui.uiStyle);
      }

      var widthRow = el('div');
      var rng = el('input'); rng.type = 'range'; rng.min = '220'; rng.max = '560'; rng.step = '10'; rng.value = String(typeof ui.sidebarWidth === 'number' ? ui.sidebarWidth : 320);
      var note = el('div'); note.style.fontSize = '0.75rem'; note.textContent = 'サイドバー幅: ' + rng.value + 'px';
      widthRow.appendChild(note); widthRow.appendChild(rng);

      var fontRow = el('div');
      var hInput = el('input'); hInput.type = 'number'; hInput.min = '10'; hInput.max = '50'; hInput.value = String(fs.heading || 20);
      var bInput = el('input'); bInput.type = 'number'; bInput.min = '10'; bInput.max = '50'; bInput.value = String(fs.body || 16);
      var hLabel = el('label'); hLabel.textContent = '見出しサイズ'; hLabel.style.display = 'block';
      var bLabel = el('label'); bLabel.textContent = '本文サイズ'; bLabel.style.display = 'block';
      fontRow.appendChild(hLabel); fontRow.appendChild(hInput); fontRow.appendChild(bLabel); fontRow.appendChild(bInput);

      // エディタプレースホルダ設定
      var placeholderRow = el('div');
      var placeholderLabel = el('label');
      placeholderLabel.textContent = 'エディタプレースホルダ';
      placeholderLabel.style.display = 'block';
      var placeholderInput = el('input');
      placeholderInput.type = 'text';
      placeholderInput.placeholder = (window.UILabels && window.UILabels.EDITOR_PLACEHOLDER) || 'ここに小説を入力してください...';
      placeholderInput.value = typeof editorCfg.placeholder === 'string' ? editorCfg.placeholder : '';
      placeholderInput.style.width = '100%';
      placeholderRow.appendChild(placeholderLabel);
      placeholderRow.appendChild(placeholderInput);

      // リッチ編集: 改行で装飾・効果を切る（BL-002・settings.editor.effectBreakAtNewline、既定 true）
      var effectBreakRow = el('div');
      effectBreakRow.style.display = 'grid';
      effectBreakRow.style.gap = '0.25rem';
      var effectBreakLabel = el('label');
      effectBreakLabel.style.display = 'flex';
      effectBreakLabel.style.alignItems = 'flex-start';
      effectBreakLabel.style.gap = '0.375rem';
      var effectBreakCheck = el('input');
      effectBreakCheck.type = 'checkbox';
      effectBreakCheck.id = 'effect-break-at-newline';
      effectBreakCheck.checked = !(editorCfg.effectBreakAtNewline === false);
      var effectBreakTextWrap = el('span');
      effectBreakTextWrap.style.display = 'grid';
      effectBreakTextWrap.style.gap = '0.125rem';
      var effectBreakTitle = el('span');
      effectBreakTitle.textContent = '改行で装飾・効果を切る（既定オン・BL-002）';
      var effectBreakHint = el('span');
      effectBreakHint.style.fontSize = '0.7rem';
      effectBreakHint.style.opacity = '0.75';
      effectBreakHint.textContent = 'リッチ編集表示で Enter 時に、太字等の書式解除や decor 周りの後処理を行います。オフにすると改行挙動が変わります。';
      effectBreakTextWrap.appendChild(effectBreakTitle);
      effectBreakTextWrap.appendChild(effectBreakHint);
      effectBreakLabel.appendChild(effectBreakCheck);
      effectBreakLabel.appendChild(effectBreakTextWrap);
      effectBreakRow.appendChild(effectBreakLabel);
      effectBreakCheck.addEventListener('change', function () {
        withStorage(function (cfg) {
          cfg.editor = cfg.editor || {};
          cfg.editor.effectBreakAtNewline = !!effectBreakCheck.checked;
        });
        try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch (_) { }
      });

      // リッチ編集: Enter 後も decor-* 内にカーソルを残す（settings.editor.effectPersistDecorAcrossNewline）
      var newlineDecorRow = el('div');
      newlineDecorRow.style.display = 'grid';
      newlineDecorRow.style.gap = '0.25rem';
      var newlineDecorLabel = el('label');
      newlineDecorLabel.style.display = 'flex';
      newlineDecorLabel.style.alignItems = 'flex-start';
      newlineDecorLabel.style.gap = '0.375rem';
      var newlineDecorCheck = el('input');
      newlineDecorCheck.type = 'checkbox';
      newlineDecorCheck.id = 'effect-persist-decor-across-newline';
      newlineDecorCheck.checked = !!editorCfg.effectPersistDecorAcrossNewline;
      var newlineDecorTextWrap = el('span');
      newlineDecorTextWrap.style.display = 'grid';
      newlineDecorTextWrap.style.gap = '0.125rem';
      var newlineDecorTitle = el('span');
      newlineDecorTitle.textContent = '改行後も装飾スパン内にカーソルを残す';
      var newlineDecorHint = el('span');
      newlineDecorHint.style.fontSize = '0.7rem';
      newlineDecorHint.style.opacity = '0.75';
      newlineDecorHint.textContent = 'リッチ編集表示専用。Enter 後もカスタム装飾（decor-*）内にカーソルを残します（上の「改行で装飾・効果を切る」がオンのときのみ）。ショートカット: Ctrl+Shift+Alt+D（macOS は ⌘+Shift+Option+D）。';
      newlineDecorTextWrap.appendChild(newlineDecorTitle);
      newlineDecorTextWrap.appendChild(newlineDecorHint);
      newlineDecorLabel.appendChild(newlineDecorCheck);
      newlineDecorLabel.appendChild(newlineDecorTextWrap);
      newlineDecorRow.appendChild(newlineDecorLabel);
      newlineDecorCheck.addEventListener('change', function () {
        withStorage(function (cfg) {
          cfg.editor = cfg.editor || {};
          cfg.editor.effectPersistDecorAcrossNewline = !!newlineDecorCheck.checked;
        });
        try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch (_) { }
      });

      // Extended Textbox 設定
      var textboxCfg = editorCfg.extendedTextbox || {};
      var textboxRow = el('div');
      textboxRow.style.display = 'grid';
      textboxRow.style.gap = '0.375rem';
      textboxRow.style.padding = '0.5rem';
      textboxRow.style.border = '1px solid var(--border-color, #444)';
      textboxRow.style.borderRadius = '0.375rem';

      var textboxTitle = el('div');
      textboxTitle.textContent = 'TextBox Effects';
      textboxTitle.style.fontSize = '0.75rem';
      textboxTitle.style.fontWeight = 'bold';

      var textboxEnabledRow = el('label');
      textboxEnabledRow.style.display = 'flex';
      textboxEnabledRow.style.alignItems = 'center';
      textboxEnabledRow.style.gap = '0.375rem';
      var textboxEnabled = el('input');
      textboxEnabled.type = 'checkbox';
      textboxEnabled.checked = textboxCfg.enabled !== false;
      var textboxEnabledText = el('span');
      textboxEnabledText.textContent = '機能を有効化';
      textboxEnabledRow.appendChild(textboxEnabled);
      textboxEnabledRow.appendChild(textboxEnabledText);

      var textboxPresetRow = el('div');
      var textboxPresetLabel = el('label');
      textboxPresetLabel.textContent = '既定プリセット';
      textboxPresetLabel.style.display = 'block';
      var textboxPresetSelect = el('select');
      textboxPresetSelect.style.width = '100%';
      var textboxPresets = (window.TextboxPresetRegistry && typeof window.TextboxPresetRegistry.list === 'function')
        ? window.TextboxPresetRegistry.list(s)
        : [];
      textboxPresets.forEach(function (preset) {
        var opt = el('option');
        opt.value = preset.id;
        opt.textContent = preset.label || preset.id;
        textboxPresetSelect.appendChild(opt);
      });
      if (textboxPresetSelect.options.length === 0) {
        var fallbackOpt = el('option');
        fallbackOpt.value = 'inner-voice';
        fallbackOpt.textContent = '心の声';
        textboxPresetSelect.appendChild(fallbackOpt);
      }
      textboxPresetSelect.value = textboxCfg.defaultPreset || 'inner-voice';
      textboxPresetRow.appendChild(textboxPresetLabel);
      textboxPresetRow.appendChild(textboxPresetSelect);

      var textboxSfxRow = el('label');
      textboxSfxRow.style.display = 'flex';
      textboxSfxRow.style.alignItems = 'center';
      textboxSfxRow.style.gap = '0.375rem';
      var textboxShowSfx = el('input');
      textboxShowSfx.type = 'checkbox';
      textboxShowSfx.checked = textboxCfg.showSfxField !== false;
      var textboxShowSfxText = el('span');
      textboxShowSfxText.textContent = 'sfx フィールド表示';
      textboxSfxRow.appendChild(textboxShowSfx);
      textboxSfxRow.appendChild(textboxShowSfxText);

      function saveTextboxSettings(patch) {
        withStorage(function (cfg) {
          cfg.editor = cfg.editor || {};
          cfg.editor.extendedTextbox = cfg.editor.extendedTextbox || {};
          cfg.editor.extendedTextbox = {
            ...cfg.editor.extendedTextbox,
            ...patch
          };
        });
        try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch (_) { }
      }

      textboxEnabled.addEventListener('change', function () {
        saveTextboxSettings({ enabled: !!textboxEnabled.checked });
      });
      textboxPresetSelect.addEventListener('change', function () {
        saveTextboxSettings({ defaultPreset: String(textboxPresetSelect.value || 'inner-voice') });
      });
      textboxShowSfx.addEventListener('change', function () {
        saveTextboxSettings({ showSfxField: !!textboxShowSfx.checked });
      });

      // ユーザー定義プリセット管理UI (Phase 3)
      var ALLOWED_ROLES = (window.TextboxPresetRegistry && window.TextboxPresetRegistry.ALLOWED_ROLES)
        ? window.TextboxPresetRegistry.ALLOWED_ROLES
        : ['dialogue', 'monologue', 'narration', 'sfx', 'system', 'custom'];

      var userPresetsContainer = el('div');
      userPresetsContainer.className = 'tb-user-presets';
      userPresetsContainer.style.display = 'grid';
      userPresetsContainer.style.gap = '0.25rem';

      var userPresetsLabel = el('div');
      userPresetsLabel.textContent = 'カスタムプリセット';
      userPresetsLabel.style.fontSize = '0.75rem';
      userPresetsLabel.style.fontWeight = 'bold';
      userPresetsContainer.appendChild(userPresetsLabel);

      var userPresetsList = el('div');
      userPresetsList.className = 'tb-user-presets-list';
      userPresetsContainer.appendChild(userPresetsList);

      function getUserPresets() {
        var cfg = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
          ? window.ZenWriterStorage.loadSettings() : {};
        return (cfg && cfg.editor && cfg.editor.extendedTextbox && Array.isArray(cfg.editor.extendedTextbox.userPresets))
          ? cfg.editor.extendedTextbox.userPresets : [];
      }

      function saveUserPresets(presets) {
        saveTextboxSettings({ userPresets: presets });
        renderUserPresetList();
        // 既定プリセットセレクトも更新
        refreshDefaultPresetSelect();
      }

      function refreshDefaultPresetSelect() {
        var current = textboxPresetSelect.value;
        textboxPresetSelect.innerHTML = '';
        var allPresets = (window.TextboxPresetRegistry && typeof window.TextboxPresetRegistry.list === 'function')
          ? window.TextboxPresetRegistry.list(window.ZenWriterStorage.loadSettings()) : [];
        allPresets.forEach(function (p) {
          var o = el('option'); o.value = p.id; o.textContent = p.label || p.id;
          textboxPresetSelect.appendChild(o);
        });
        textboxPresetSelect.value = current || 'inner-voice';
      }

      function renderUserPresetList() {
        userPresetsList.innerHTML = '';
        var presets = getUserPresets();
        if (presets.length === 0) {
          var empty = el('div');
          empty.textContent = 'カスタムプリセットはありません';
          empty.style.fontSize = '0.6875rem';
          empty.style.color = 'var(--text-color, #999)';
          empty.style.padding = '0.25rem 0';
          userPresetsList.appendChild(empty);
          return;
        }
        presets.forEach(function (raw, idx) {
          var registry = window.TextboxPresetRegistry;
          var preset = registry && typeof registry.normalizePreset === 'function'
            ? registry.normalizePreset(raw, 'user-' + idx) : raw;
          if (!preset) return;

          var item = el('div');
          item.className = 'tb-preset-item';
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.gap = '0.375rem';
          item.style.padding = '0.25rem 0.375rem';
          item.style.border = '1px solid var(--border-color, #555)';
          item.style.borderRadius = '0.25rem';

          var info = el('span');
          info.style.flex = '1';
          info.style.fontSize = '0.75rem';
          info.textContent = (preset.label || preset.id) + ' (' + (preset.role || 'custom') + ')';

          var editBtn = el('button');
          editBtn.className = 'small';
          editBtn.textContent = '編集';
          editBtn.style.fontSize = '0.6875rem';
          editBtn.addEventListener('click', function () { openPresetEditor(preset, idx); });

          var dupBtn = el('button');
          dupBtn.className = 'small';
          dupBtn.textContent = '複製';
          dupBtn.style.fontSize = '0.6875rem';
          dupBtn.addEventListener('click', function () {
            var list = getUserPresets();
            var copy = JSON.parse(JSON.stringify(raw));
            copy.id = (copy.id || 'preset') + '-copy';
            copy.label = (copy.label || copy.id) + ' (コピー)';
            list.push(copy);
            saveUserPresets(list);
          });

          var delBtn = el('button');
          delBtn.className = 'small';
          delBtn.textContent = '削除';
          delBtn.style.fontSize = '0.6875rem';
          delBtn.style.color = 'var(--danger-color, #e74c3c)';
          delBtn.addEventListener('click', function () {
            var list = getUserPresets();
            list.splice(idx, 1);
            saveUserPresets(list);
          });

          item.appendChild(info);
          item.appendChild(editBtn);
          item.appendChild(dupBtn);
          item.appendChild(delBtn);
          userPresetsList.appendChild(item);
        });
      }

      // プリセット作成/編集フォーム
      function openPresetEditor(preset, editIndex) {
        // 既存のエディタがあれば削除
        var existing = userPresetsContainer.querySelector('.tb-preset-editor');
        if (existing) existing.remove();

        var isNew = editIndex === undefined || editIndex === null;
        var data = preset || { id: '', label: '', role: 'custom', anim: '', tilt: 0, scale: 1, sfx: '' };

        var editor = el('div');
        editor.className = 'tb-preset-editor';
        editor.style.display = 'grid';
        editor.style.gap = '0.25rem';
        editor.style.padding = '0.5rem';
        editor.style.border = '1px solid var(--accent-color, #4a9eff)';
        editor.style.borderRadius = '0.375rem';
        editor.style.marginTop = '0.25rem';

        var editorTitle = el('div');
        editorTitle.textContent = isNew ? '新規プリセット' : 'プリセット編集';
        editorTitle.style.fontSize = '0.75rem';
        editorTitle.style.fontWeight = 'bold';
        editor.appendChild(editorTitle);

        function addField(labelText, inputEl) {
          var row = el('div');
          var lbl = el('label');
          lbl.textContent = labelText;
          lbl.style.display = 'block';
          lbl.style.fontSize = '0.6875rem';
          row.appendChild(lbl);
          row.appendChild(inputEl);
          editor.appendChild(row);
          return inputEl;
        }

        var idInput = el('input'); idInput.type = 'text'; idInput.value = data.id || ''; idInput.placeholder = 'preset-id'; idInput.style.width = '100%';
        addField('ID (英数字とハイフン)', idInput);

        var labelInput = el('input'); labelInput.type = 'text'; labelInput.value = data.label || ''; labelInput.placeholder = '表示名'; labelInput.style.width = '100%';
        addField('表示名', labelInput);

        var roleSelect = el('select'); roleSelect.style.width = '100%';
        ALLOWED_ROLES.forEach(function (r) {
          var o = el('option'); o.value = r; o.textContent = r; roleSelect.appendChild(o);
        });
        roleSelect.value = data.role || 'custom';
        addField('役割', roleSelect);

        var animInput = el('input'); animInput.type = 'text'; animInput.value = data.anim || ''; animInput.placeholder = 'fadein, shake, etc.'; animInput.style.width = '100%';
        addField('アニメーション', animInput);

        var tiltInput = el('input'); tiltInput.type = 'number'; tiltInput.min = '-20'; tiltInput.max = '20'; tiltInput.step = '1'; tiltInput.value = String(data.tilt || 0); tiltInput.style.width = '100%';
        addField('傾き (-20 ~ 20)', tiltInput);

        var scaleInput = el('input'); scaleInput.type = 'number'; scaleInput.min = '0.5'; scaleInput.max = '2.0'; scaleInput.step = '0.05'; scaleInput.value = String(data.scale || 1); scaleInput.style.width = '100%';
        addField('スケール (0.5 ~ 2.0)', scaleInput);

        var sfxInput = el('input'); sfxInput.type = 'text'; sfxInput.value = data.sfx || ''; sfxInput.placeholder = 'サウンドエフェクトID'; sfxInput.style.width = '100%';
        addField('SFX', sfxInput);

        var errorMsg = el('div');
        errorMsg.style.fontSize = '0.6875rem';
        errorMsg.style.color = 'var(--danger-color, #e74c3c)';
        errorMsg.style.display = 'none';
        editor.appendChild(errorMsg);

        var btnRow = el('div');
        btnRow.style.display = 'flex';
        btnRow.style.gap = '0.375rem';
        btnRow.style.justifyContent = 'flex-end';

        var saveBtn = el('button');
        saveBtn.className = 'small';
        saveBtn.textContent = isNew ? '作成' : '保存';
        saveBtn.addEventListener('click', function () {
          var registry = window.TextboxPresetRegistry;
          var sanitizedId = registry && typeof registry.sanitizeId === 'function'
            ? registry.sanitizeId(idInput.value) : idInput.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

          if (!sanitizedId) {
            errorMsg.textContent = 'IDを入力してください';
            errorMsg.style.display = 'block';
            return;
          }
          if (!labelInput.value.trim()) {
            errorMsg.textContent = '表示名を入力してください';
            errorMsg.style.display = 'block';
            return;
          }

          // 組み込みプリセットとのID重複チェック
          var builtins = (registry && registry.BUILTIN_PRESETS) ? registry.BUILTIN_PRESETS : [];
          var builtinDup = builtins.some(function (b) { return b.id === sanitizedId; });
          if (builtinDup) {
            errorMsg.textContent = '組み込みプリセットと同じIDは使用できません';
            errorMsg.style.display = 'block';
            return;
          }

          var newPreset = {
            id: sanitizedId,
            label: labelInput.value.trim(),
            role: roleSelect.value || 'custom',
            anim: animInput.value.trim(),
            tilt: clamp(parseFloat(tiltInput.value), -20, 20),
            scale: clamp(parseFloat(scaleInput.value), 0.5, 2.0),
            sfx: sfxInput.value.trim()
          };

          var list = getUserPresets();
          if (isNew) {
            // 既存ユーザープリセットとのID重複チェック
            var userDup = list.some(function (u) { return (u.id || '') === sanitizedId; });
            if (userDup) {
              errorMsg.textContent = '同じIDのカスタムプリセットが既に存在します';
              errorMsg.style.display = 'block';
              return;
            }
            list.push(newPreset);
          } else {
            list[editIndex] = newPreset;
          }
          saveUserPresets(list);
          editor.remove();
        });

        var cancelBtn = el('button');
        cancelBtn.className = 'small';
        cancelBtn.textContent = 'キャンセル';
        cancelBtn.addEventListener('click', function () { editor.remove(); });

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(saveBtn);
        editor.appendChild(btnRow);

        userPresetsContainer.appendChild(editor);
      }

      var addPresetBtn = el('button');
      addPresetBtn.className = 'small';
      addPresetBtn.textContent = '+ 新規プリセット';
      addPresetBtn.style.marginTop = '0.25rem';
      addPresetBtn.addEventListener('click', function () { openPresetEditor(null); });
      userPresetsContainer.appendChild(addPresetBtn);

      renderUserPresetList();

      textboxRow.appendChild(textboxTitle);
      textboxRow.appendChild(textboxEnabledRow);
      textboxRow.appendChild(textboxPresetRow);
      textboxRow.appendChild(textboxSfxRow);
      textboxRow.appendChild(userPresetsContainer);

      // タブ配置（上下左右）
      var placementRow = el('div');
      var placementSel = el('select');
      [
        { value: 'left', label: '左' },
        { value: 'right', label: '右' },
        { value: 'top', label: '上' },
        { value: 'bottom', label: '下' }
      ].forEach(function (opt) {
        var o = el('option'); o.value = opt.value; o.textContent = opt.label; placementSel.appendChild(o);
      });
      placementSel.value = String(ui.tabPlacement || 'left');
      var placementLabel = el('label'); placementLabel.textContent = 'タブ配置'; placementLabel.style.display = 'block';
      placementRow.appendChild(placementLabel); placementRow.appendChild(placementSel);

      sel.addEventListener('change', function () { withStorage(function (cfg) { cfg.ui = cfg.ui || {}; cfg.ui.tabsPresentation = String(sel.value || 'tabs'); }); try { var sb = document.getElementById('sidebar'); if (sb) sb.setAttribute('data-tabs-presentation', String(sel.value)); if (window.sidebarManager && typeof window.sidebarManager.applyTabsPresentationUI === 'function') window.sidebarManager.applyTabsPresentationUI(); } catch (_) { } });
      placementSel.addEventListener('change', function () {
        var val = placementSel.value;
        withStorage(function (cfg) { cfg.ui = cfg.ui || {}; cfg.ui.tabPlacement = val; });
        if (window.sidebarManager && typeof window.sidebarManager.saveTabPlacement === 'function') {
          window.sidebarManager.saveTabPlacement(val);
        }
      });
      hInput.addEventListener('change', function () { withStorage(function (cfg) { cfg.fontSizes = cfg.fontSizes || {}; cfg.fontSizes.heading = toInt(hInput.value, 20); }); applyElementFontSizes(); });
      bInput.addEventListener('change', function () { withStorage(function (cfg) { cfg.fontSizes = cfg.fontSizes || {}; cfg.fontSizes.body = toInt(bInput.value, 16); }); applyElementFontSizes(); });

      placeholderInput.addEventListener('change', function () {
        var value = String(placeholderInput.value || '');
        withStorage(function (cfg) {
          cfg.editor = cfg.editor || {};
          cfg.editor.placeholder = value;
        });
        try {
          var editorEl = (window.ZenWriterEditor && window.ZenWriterEditor.editor) || document.getElementById('editor');
          if (editorEl) {
            if (value.trim()) {
              editorEl.setAttribute('placeholder', value);
            } else if (window.UILabels && window.UILabels.EDITOR_PLACEHOLDER) {
              editorEl.setAttribute('placeholder', window.UILabels.EDITOR_PLACEHOLDER);
            }
          }
        } catch (_) { }
      });

      // 自動保存設定
      var autoSaveCfg = (s && s.autoSave) || {};
      var autoSaveRow = el('div');
      autoSaveRow.style.display = 'grid';
      autoSaveRow.style.gap = '0.25rem';

      var autoSaveLabel = el('label');
      autoSaveLabel.style.display = 'flex';
      autoSaveLabel.style.alignItems = 'center';
      autoSaveLabel.style.gap = '0.375rem';
      var autoSaveCheck = el('input');
      autoSaveCheck.type = 'checkbox';
      autoSaveCheck.id = 'auto-save-enabled';
      autoSaveCheck.checked = !!autoSaveCfg.enabled;
      var autoSaveLabelText = el('span');
      autoSaveLabelText.textContent = '自動保存';
      autoSaveLabel.appendChild(autoSaveCheck);
      autoSaveLabel.appendChild(autoSaveLabelText);

      var autoSaveDelayRow = el('div');
      autoSaveDelayRow.style.display = 'flex';
      autoSaveDelayRow.style.alignItems = 'center';
      autoSaveDelayRow.style.gap = '0.375rem';
      autoSaveDelayRow.style.fontSize = '0.75rem';
      var autoSaveDelayLabel = el('span');
      autoSaveDelayLabel.textContent = '遅延:';
      var autoSaveDelayInput = el('input');
      autoSaveDelayInput.type = 'number';
      autoSaveDelayInput.id = 'auto-save-delay-ms';
      autoSaveDelayInput.min = '500';
      autoSaveDelayInput.max = '30000';
      autoSaveDelayInput.step = '500';
      autoSaveDelayInput.value = String(autoSaveCfg.delayMs || 2000);
      autoSaveDelayInput.style.width = '4.375rem';
      var autoSaveDelayUnit = el('span');
      autoSaveDelayUnit.textContent = 'ms';
      autoSaveDelayRow.appendChild(autoSaveDelayLabel);
      autoSaveDelayRow.appendChild(autoSaveDelayInput);
      autoSaveDelayRow.appendChild(autoSaveDelayUnit);

      autoSaveCheck.addEventListener('change', function () {
        withStorage(function (cfg) {
          cfg.autoSave = cfg.autoSave || {};
          cfg.autoSave.enabled = !!autoSaveCheck.checked;
        });
      });

      autoSaveDelayInput.addEventListener('change', function () {
        var val = parseInt(autoSaveDelayInput.value, 10);
        if (isNaN(val) || val < 500) val = 500;
        if (val > 30000) val = 30000;
        autoSaveDelayInput.value = String(val);
        withStorage(function (cfg) {
          cfg.autoSave = cfg.autoSave || {};
          cfg.autoSave.delayMs = val;
        });
      });

      autoSaveRow.appendChild(autoSaveLabel);
      autoSaveRow.appendChild(autoSaveDelayRow);

      // フローティングパネル設定
      var floatRow = el('div');
      floatRow.style.display = 'grid';
      floatRow.style.gap = '0.375rem';
      var floatLabel = el('div'); floatLabel.textContent = 'フローティングパネル'; floatLabel.style.fontSize = '0.75rem'; floatLabel.style.fontWeight = 'bold';

      var floatTabSelect = el('select');
      floatTabSelect.style.width = '100%';
      var tabOptions = [
        { id: 'structure', label: '構造', group: 'structure' },
        { id: 'typography', label: 'テーマ・フォント', group: 'typography' },
        { id: 'assist', label: 'アシスト', group: 'assist' },
        { id: 'wiki', label: 'Wiki', group: 'wiki' }
      ];
      tabOptions.forEach(function (opt) {
        var o = el('option'); o.value = opt.id; o.textContent = opt.label; floatTabSelect.appendChild(o);
      });

      var floatBtnRow = el('div');
      floatBtnRow.style.display = 'flex';
      floatBtnRow.style.gap = '0.375rem';
      var floatBtn = el('button', 'small'); floatBtn.textContent = '表示/非表示';
      var floatCloseBtn = el('button', 'small'); floatCloseBtn.textContent = '閉じる';
      floatBtnRow.appendChild(floatBtn);
      floatBtnRow.appendChild(floatCloseBtn);

      floatRow.appendChild(floatLabel);
      floatRow.appendChild(floatTabSelect);
      floatRow.appendChild(floatBtnRow);

      // フローティングパネル生成/トグル
      function createOrToggleFloatingPanel(tabId) {
        try {
          if (!window.ZenWriterPanels || typeof window.ZenWriterPanels.createDockablePanel !== 'function') {
            alert('Panels API が利用できません');
            return;
          }

          var tabConfig = tabOptions.find(function (t) { return t.id === tabId; });
          if (!tabConfig) return;

          var panelId = tabId + '-floating-panel';
          var existing = document.getElementById(panelId);
          if (existing) {
            window.ZenWriterPanels.togglePanel(panelId);
            return;
          }

          var container = document.createElement('div');
          container.id = tabId + '-floating-gadgets-panel';
          container.className = 'gadgets-panel';
          container.dataset.gadgetGroup = tabConfig.group;
          container.setAttribute('aria-label', tabConfig.label + 'ガジェット (フローティング)');

          var panel = window.ZenWriterPanels.createDockablePanel(panelId, tabConfig.label, container, { width: 320 });

          var floatingContainer = document.getElementById('floating-panels');
          if (!floatingContainer) {
            floatingContainer = document.createElement('div');
            floatingContainer.id = 'floating-panels';
            floatingContainer.className = 'floating-panels';
            document.body.appendChild(floatingContainer);
          }
          floatingContainer.appendChild(panel);

          if (window.ZWGadgets && typeof window.ZWGadgets.init === 'function') {
            window.ZWGadgets.init('#' + container.id, { group: tabConfig.group });
          }
        } catch (_) { }
      }

      floatBtn.addEventListener('click', function () {
        createOrToggleFloatingPanel(floatTabSelect.value);
      });

      floatCloseBtn.addEventListener('click', function () {
        var panelId = floatTabSelect.value + '-floating-panel';
        if (window.ZenWriterPanels) {
          window.ZenWriterPanels.hidePanel(panelId);
        }
      });

      // ガジェットUX設定
      var gadgetUXRow = el('div');
      gadgetUXRow.style.display = 'grid';
      gadgetUXRow.style.gap = '0.375rem';

      var gadgetUXLabel = el('div');
      gadgetUXLabel.textContent = 'ガジェット表示';
      gadgetUXLabel.style.fontSize = '0.75rem';
      gadgetUXLabel.style.fontWeight = 'bold';

      // ヘルプアイコン表示トグル
      var helpIconRow = el('label');
      helpIconRow.style.display = 'flex';
      helpIconRow.style.alignItems = 'center';
      helpIconRow.style.gap = '0.375rem';
      var helpIconCheck = el('input');
      helpIconCheck.type = 'checkbox';
      helpIconCheck.checked = localStorage.getItem('zenwriter-gadget-help-visible') !== 'false';
      var helpIconText = el('span');
      helpIconText.textContent = 'ガジェットヘルプアイコンを表示';
      helpIconRow.appendChild(helpIconCheck);
      helpIconRow.appendChild(helpIconText);

      helpIconCheck.addEventListener('change', function() {
        localStorage.setItem('zenwriter-gadget-help-visible', helpIconCheck.checked ? 'true' : 'false');
        // 即座に反映
        document.querySelectorAll('.gadget-help-btn').forEach(function(btn) {
          btn.style.display = helpIconCheck.checked ? '' : 'none';
        });
      });

      // 一括操作ボタン表示トグル
      var bulkToggleRow = el('label');
      bulkToggleRow.style.display = 'flex';
      bulkToggleRow.style.alignItems = 'center';
      bulkToggleRow.style.gap = '0.375rem';
      var bulkToggleCheck = el('input');
      bulkToggleCheck.type = 'checkbox';
      bulkToggleCheck.checked = localStorage.getItem('zenwriter-gadget-bulk-toggle-visible') !== 'false';
      var bulkToggleText = el('span');
      bulkToggleText.textContent = '一括折りたたみボタンを表示';
      bulkToggleRow.appendChild(bulkToggleCheck);
      bulkToggleRow.appendChild(bulkToggleText);

      bulkToggleCheck.addEventListener('change', function() {
        localStorage.setItem('zenwriter-gadget-bulk-toggle-visible', bulkToggleCheck.checked ? 'true' : 'false');
        // 即座に反映
        document.querySelectorAll('.gadget-bulk-toggle-btn').forEach(function(btn) {
          btn.style.display = bulkToggleCheck.checked ? '' : 'none';
        });
      });

      gadgetUXRow.appendChild(gadgetUXLabel);
      gadgetUXRow.appendChild(helpIconRow);
      gadgetUXRow.appendChild(bulkToggleRow);

      root.appendChild(presRow); root.appendChild(placementRow); root.appendChild(styleRow); root.appendChild(widthRow); root.appendChild(autoSaveRow); root.appendChild(fontRow); root.appendChild(placeholderRow); root.appendChild(effectBreakRow); root.appendChild(newlineDecorRow); root.appendChild(textboxRow); root.appendChild(floatRow); root.appendChild(gadgetUXRow);
    }, { title: 'UI設定', groups: ['advanced'], description: '表示方式・サイドバー配置・文字サイズ・改行時の装飾挙動を調整。' });

    // Font Decoration Gadget (パネルのミラー)
    window.ZWGadgets.register('FontDecoration', function (root) {
      root.innerHTML = '';
      var mkBtn = function (id, label) { var b = el('button', 'decor-btn'); b.dataset.tag = id; b.textContent = label; b.style.margin = '0.125rem'; return b; };
      var row1 = el('div'); row1.appendChild(mkBtn('bold', 'B')); row1.appendChild(mkBtn('italic', 'I')); row1.appendChild(mkBtn('underline', 'U')); row1.appendChild(mkBtn('strike', 'S')); row1.appendChild(mkBtn('black', '極'));
      var row2 = el('div'); row2.appendChild(mkBtn('light', '細')); row2.appendChild(mkBtn('smallcaps', 'SC')); row2.appendChild(mkBtn('shadow', '影')); row2.appendChild(mkBtn('outline', '輪')); row2.appendChild(mkBtn('glow', '光'));
      var row3 = el('div'); row3.appendChild(mkBtn('uppercase', '大')); row3.appendChild(mkBtn('lowercase', '小')); row3.appendChild(mkBtn('capitalize', '頭')); row3.appendChild(mkBtn('wide', '広')); row3.appendChild(mkBtn('narrow', '狭'));
      var row4 = el('div'); row4.appendChild(mkBtn('kenten', '傍点'));
      function bind(container) {
        var btns = container.querySelectorAll('.decor-btn');
        btns.forEach(function (btn) { btn.addEventListener('click', function () { try { var tag = btn.dataset.tag; if (tag === 'kenten') { var rich = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor; if (rich && rich.isWysiwygMode && typeof rich.wrapSelectionWithSpan === 'function') { rich.wrapSelectionWithSpan('kenten'); } else if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertTextAtCursor === 'function') { window.ZenWriterEditor.insertTextAtCursor('{kenten|', { suffix: '}' }); } } else if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration === 'function') { window.ZenWriterEditor.applyFontDecoration(tag); } } catch (_) { } }); });
      }
      root.appendChild(row1); root.appendChild(row2); root.appendChild(row3); root.appendChild(row4); bind(root);
    }, { title: 'フォント装飾', groups: ['edit'], description: '太字・斜体・傍点・影などを選択範囲に適用します（ツールバー装飾と同系）。' });

    // Text Animation Gadget (パネルのミラー)
    window.ZWGadgets.register('TextAnimation', function (root) {
      root.innerHTML = '';
      var mkBtn = function (id, label) { var b = el('button', 'decor-btn'); b.dataset.tag = id; b.textContent = label; b.style.margin = '0.125rem'; return b; };
      var row1 = el('div'); row1.appendChild(mkBtn('fade', 'フェード')); row1.appendChild(mkBtn('slide', 'スライド')); row1.appendChild(mkBtn('type', 'タイプ')); row1.appendChild(mkBtn('pulse', 'パルス'));
      var row2 = el('div'); row2.appendChild(mkBtn('shake', 'シェイク')); row2.appendChild(mkBtn('bounce', 'バウンス')); row2.appendChild(mkBtn('fadein', '遅フェード'));
      function bind(container) {
        var btns = container.querySelectorAll('.decor-btn');
        btns.forEach(function (btn) { btn.addEventListener('click', function () { try { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration === 'function') { window.ZenWriterEditor.applyFontDecoration(btn.dataset.tag); } } catch (_) { } }); });
      }
      root.appendChild(row1); root.appendChild(row2); bind(root);
    }, { title: 'テキストアニメーション', groups: ['edit'], description: 'フェード・タイプライター・バウンスなどを選択範囲に適用します。' });

    // Editor Layout Gadget (余白・幅・背景色)
    window.ZWGadgets.register('EditorLayout', function (root) {
      var s = window.ZenWriterStorage.loadSettings();
      var layout = (s && s.editorLayout) || {};
      root.innerHTML = ''; root.style.display = 'grid'; root.style.gap = '0.5rem';

      // 最大幅設定
      var maxWidthRow = el('div');
      var maxWidthLabel = el('div'); maxWidthLabel.textContent = '最大幅 (0=全幅)'; maxWidthLabel.style.fontSize = '0.75rem';
      var maxWidthInput = el('input'); maxWidthInput.type = 'number'; maxWidthInput.min = '0'; maxWidthInput.max = '2000'; maxWidthInput.step = '50';
      maxWidthInput.value = String(typeof layout.maxWidth === 'number' ? layout.maxWidth : 900);
      maxWidthRow.appendChild(maxWidthLabel); maxWidthRow.appendChild(maxWidthInput);

      // padding設定
      var paddingRow = el('div');
      var paddingLabel = el('div'); paddingLabel.textContent = '内余白 (px)'; paddingLabel.style.fontSize = '0.75rem';
      var paddingInput = el('input'); paddingInput.type = 'number'; paddingInput.min = '0'; paddingInput.max = '100'; paddingInput.step = '5';
      paddingInput.value = String(typeof layout.padding === 'number' ? layout.padding : 32);
      paddingRow.appendChild(paddingLabel); paddingRow.appendChild(paddingInput);

      // 余白エリア背景色
      var marginBgRow = el('div');
      var marginBgLabel = el('div'); marginBgLabel.textContent = '余白背景色'; marginBgLabel.style.fontSize = '0.75rem';
      var marginBgInput = el('input'); marginBgInput.type = 'color';
      marginBgInput.value = layout.marginBgColor || '#f5f5dc';
      marginBgRow.appendChild(marginBgLabel); marginBgRow.appendChild(marginBgInput);

      // 適用ボタン
      var applyBtn = el('button', 'small'); applyBtn.textContent = '適用';

      function applyLayout() {
        var maxW = toInt(maxWidthInput.value, 900);
        var pad = toInt(paddingInput.value, 32);
        var bg = marginBgInput.value || '#f5f5dc';

        withStorage(function (cfg) {
          cfg.editorLayout = cfg.editorLayout || {};
          cfg.editorLayout.maxWidth = maxW;
          cfg.editorLayout.padding = pad;
          cfg.editorLayout.marginBgColor = bg;
        });

        // Apply to DOM
        var editor = document.getElementById('editor');
        var container = document.querySelector('.editor-container');

        if (editor) {
          editor.style.maxWidth = maxW > 0 ? maxW + 'px' : 'none';
          editor.style.padding = pad + 'px';
        }

        if (container) {
          if ((maxW > 0 || pad > 0) && bg) {
            container.style.backgroundColor = bg;
          } else {
            // 余白がない場合はテーマ側の背景色に戻す
            container.style.backgroundColor = '';
          }
        }
      }

      applyBtn.addEventListener('click', applyLayout);

      root.appendChild(maxWidthRow);
      root.appendChild(paddingRow);
      root.appendChild(marginBgRow);
      root.appendChild(applyBtn);
    }, { title: 'Editor Layout', groups: ['advanced'], description: '本文の最大幅・内余白・余白背景色を調整。' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register); else register();
})();
